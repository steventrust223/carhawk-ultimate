// =========================================================
// FILE: quantum_browse_ai_api.gs - Browse.AI API Client
// =========================================================
// Direct API integration with Browse.ai for running robots,
// bulk scraping, webhooks, and data retrieval.
//
// Browse.ai API v2 Reference:
//   Base URL: https://api.browse.ai/v2
//   Auth: Bearer token (API key from Browse.ai dashboard)
//
// Robots must be created & trained in Browse.ai dashboard first.
// This module handles: running tasks, bulk runs, webhooks,
// retrieving scraped data, and auto-importing results.
// =========================================================

const BROWSE_AI_API = {
  BASE_URL: 'https://api.browse.ai/v2',
  ENDPOINTS: {
    ROBOTS: '/robots',
    TASKS: '/robots/{robotId}/tasks',
    TASK: '/robots/{robotId}/tasks/{taskId}',
    BULK_RUN: '/robots/{robotId}/bulk-runs',
    WEBHOOKS: '/robots/{robotId}/webhooks'
  }
};

// =========================================================
// API CLIENT CORE
// =========================================================

/**
 * Get the Browse.ai API key from settings or script properties.
 */
function getBrowseAIApiKey() {
  // Check script properties first (more secure)
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty('BROWSE_AI_API_KEY');
  if (key) return key;

  // Fallback to settings sheet
  try {
    return getQuantumSetting('BROWSE_AI_API_KEY') || '';
  } catch (e) {
    return '';
  }
}

/**
 * Set the Browse.ai API key in script properties.
 */
function setBrowseAIApiKey(apiKey) {
  const props = PropertiesService.getScriptProperties();
  props.setProperty('BROWSE_AI_API_KEY', apiKey);
  logQuantum('Browse.ai API', 'API key updated');
}

/**
 * Make an authenticated API request to Browse.ai.
 */
function browseAIRequest(method, endpoint, payload) {
  const apiKey = getBrowseAIApiKey();
  if (!apiKey) {
    throw new Error('Browse.ai API key not configured. Run setBrowseAIApiKeyUI() first.');
  }

  const url = BROWSE_AI_API.BASE_URL + endpoint;
  const options = {
    method: method,
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  };

  if (payload && (method === 'post' || method === 'put')) {
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code >= 400) {
    throw new Error(`Browse.ai API error ${code}: ${body}`);
  }

  return JSON.parse(body);
}

// =========================================================
// ROBOT MANAGEMENT
// =========================================================

/**
 * List all robots in the Browse.ai account.
 */
function listBrowseAIRobots() {
  const result = browseAIRequest('get', BROWSE_AI_API.ENDPOINTS.ROBOTS);
  return result.robots || [];
}

/**
 * Get details for a specific robot.
 */
function getBrowseAIRobot(robotId) {
  const endpoint = BROWSE_AI_API.ENDPOINTS.ROBOTS + '/' + robotId;
  return browseAIRequest('get', endpoint);
}

// =========================================================
// TASK MANAGEMENT
// =========================================================

/**
 * Run a single task on a robot with the given origin URL.
 */
function runBrowseAITask(robotId, originUrl, additionalParams) {
  const endpoint = BROWSE_AI_API.ENDPOINTS.TASKS.replace('{robotId}', robotId);
  const payload = {
    inputParameters: Object.assign({ originUrl: originUrl }, additionalParams || {})
  };

  const result = browseAIRequest('post', endpoint, payload);
  logQuantum('Browse.ai Task', `Task created for robot ${robotId}: ${originUrl}`);
  return result;
}

/**
 * Get task status and results.
 */
function getBrowseAITask(robotId, taskId) {
  const endpoint = BROWSE_AI_API.ENDPOINTS.TASK
    .replace('{robotId}', robotId)
    .replace('{taskId}', taskId);
  return browseAIRequest('get', endpoint);
}

/**
 * List tasks for a robot with optional filters.
 */
function listBrowseAITasks(robotId, options) {
  let endpoint = BROWSE_AI_API.ENDPOINTS.TASKS.replace('{robotId}', robotId);

  const params = [];
  if (options) {
    if (options.status) params.push('status=' + options.status);
    if (options.fromDate) params.push('fromDate=' + options.fromDate);
    if (options.toDate) params.push('toDate=' + options.toDate);
    if (options.page) params.push('page=' + options.page);
    if (options.pageSize) params.push('pageSize=' + options.pageSize);
  }

  if (params.length > 0) {
    endpoint += '?' + params.join('&');
  }

  return browseAIRequest('get', endpoint);
}

// =========================================================
// BULK RUNS - For scraping multiple listings at once
// =========================================================

/**
 * Run a bulk scrape job on a robot with multiple URLs.
 * Max 1000 URLs per bulk run.
 */
function runBrowseAIBulkRun(robotId, urls, title) {
  const endpoint = BROWSE_AI_API.ENDPOINTS.BULK_RUN.replace('{robotId}', robotId);

  // Chunk into batches of 1000
  const chunks = [];
  for (let i = 0; i < urls.length; i += 1000) {
    chunks.push(urls.slice(i, i + 1000));
  }

  const results = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const payload = {
      title: title ? `${title} - Batch ${i + 1}` : `CarHawk Bulk Run - Batch ${i + 1}`,
      inputParameters: chunk.map(url => ({ originUrl: url }))
    };

    const result = browseAIRequest('post', endpoint, payload);
    results.push(result);

    logQuantum('Browse.ai Bulk Run', `Batch ${i + 1}: ${chunk.length} URLs submitted for robot ${robotId}`);

    // Brief pause between batches to avoid rate limits
    if (i < chunks.length - 1) {
      Utilities.sleep(1000);
    }
  }

  return results;
}

// =========================================================
// WEBHOOKS - Auto-import when scrape completes
// =========================================================

/**
 * Register a webhook to receive notifications when tasks complete.
 * The webhook URL should point to your Apps Script web app.
 */
function registerBrowseAIWebhook(robotId, webhookUrl, eventType) {
  const endpoint = BROWSE_AI_API.ENDPOINTS.WEBHOOKS.replace('{robotId}', robotId);
  const payload = {
    hookUrl: webhookUrl,
    eventType: eventType || 'taskFinishedSuccessfully'
  };

  const result = browseAIRequest('post', endpoint, payload);
  logQuantum('Browse.ai Webhook', `Webhook registered for robot ${robotId}: ${eventType}`);
  return result;
}

/**
 * Web app endpoint to receive Browse.ai webhook callbacks.
 * Deploy this as a web app and use its URL for webhook registration.
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    // Extract task data from webhook
    const robotId = payload.robot && payload.robot.id;
    const taskId = payload.task && payload.task.id;
    const capturedData = payload.task && payload.task.capturedTexts;

    if (capturedData) {
      // Auto-import the scraped data
      importWebhookData(robotId, taskId, capturedData);
    }

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    logQuantum('Webhook Error', error.toString());
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Import data received from a Browse.ai webhook callback.
 */
function importWebhookData(robotId, taskId, capturedData) {
  // Find the integration that matches this robot
  const integrations = getActiveIntegrations();
  const integration = integrations.find(i => {
    try {
      const config = JSON.parse(i.configuration || '{}');
      return config.browseAIRobotId === robotId;
    } catch (e) { return false; }
  });

  const platform = integration ? integration.notes : 'Other';
  const columnMap = {};

  // Map capturedData keys to our field names
  const data = capturedData;
  const keys = Object.keys(data);
  keys.forEach((key, idx) => { columnMap[key.toLowerCase()] = key; });

  // Build import row
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  const url = data[columnMap.url || columnMap.link || columnMap.listing_url || columnMap.originurl] || '';

  // Skip if already processed
  const processedUrls = getProcessedUrls();
  if (processedUrls.includes(url)) return;

  const importRow = [
    generateQuantumId('IMP'),
    new Date(),
    `robot:${robotId}/task:${taskId}`,
    url,
    platform,
    data[columnMap.title || columnMap.listing_title] || '',
    data[columnMap.price || columnMap.asking_price] || '',
    data[columnMap.location || columnMap.city] || '',
    data[columnMap.description || columnMap.details] || '',
    data[columnMap.seller || columnMap.seller_name || columnMap.contact] || '',
    data[columnMap.date || columnMap.posted || columnMap.date_posted] || '',
    data[columnMap.images || columnMap.photos || columnMap.image_count] || 0,
    data[columnMap.mileage || columnMap.miles] || '',
    data[columnMap.year || columnMap.model_year] || '',
    data[columnMap.condition || columnMap.vehicle_condition] || '',
    'Pending',
    false,
    '',
    ''
  ];

  importSheet.appendRow(importRow);
  markUrlProcessed(url);

  logQuantum('Webhook Import', `Imported listing from robot ${robotId}: ${url}`);
}

// =========================================================
// MARKETPLACE ROBOT BUILDERS
// =========================================================
// Each builder generates the search URLs for a specific
// marketplace and launches bulk runs against the trained robot.
// The robot must already be trained in Browse.ai dashboard.
// =========================================================

/**
 * Build Facebook Marketplace search URLs for bulk scraping.
 */
function buildFacebookMarketplaceURLs(params) {
  const config = ROBOT_REGISTRY.FACEBOOK.searchConfig;
  const location = params.location || 'st-louis-missouri';
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;
  const minYear = params.minYear || config.defaultMinYear;
  const radius = params.radius || config.defaultRadius;

  const urls = [];

  // Facebook Marketplace vehicle search with filters
  // Pagination via cursor - each page has ~24 listings
  const baseUrl = `https://www.facebook.com/marketplace/${location}/vehicles`;
  const filterParams = [
    `minPrice=${minPrice}`,
    `maxPrice=${maxPrice}`,
    `minYear=${minYear}`,
    `daysSinceListed=7`,
    `sortBy=creation_time_descend`,
    `exact=false`
  ].join('&');

  // Generate pages
  for (let page = 0; page < (params.maxPages || config.maxPages); page++) {
    urls.push(`${baseUrl}?${filterParams}`);
  }

  return urls;
}

/**
 * Build Craigslist search URLs for bulk scraping across multiple regions.
 */
function buildCraigslistURLs(params) {
  const config = ROBOT_REGISTRY.CRAIGSLIST.searchConfig;
  const subdomains = params.subdomains || Object.values(config.subdomains);
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;
  const minYear = params.minYear || config.defaultMinYear;
  const category = params.category || 'cto'; // by owner default

  const urls = [];

  for (const subdomain of subdomains) {
    const baseUrl = `https://${subdomain}.craigslist.org/search/${category}`;
    const filterParams = [
      `min_price=${minPrice}`,
      `max_price=${maxPrice}`,
      `min_auto_year=${minYear}`,
      `auto_title_status=1`, // clean title
      `sort=date`,
      `purveyor=owner` // by owner
    ].join('&');

    // Craigslist pages (120 per page)
    for (let offset = 0; offset < (params.maxPages || config.maxPages) * 120; offset += 120) {
      urls.push(`${baseUrl}?${filterParams}&s=${offset}`);
    }
  }

  return urls;
}

/**
 * Build OfferUp search URLs for bulk scraping.
 */
function buildOfferUpURLs(params) {
  const config = ROBOT_REGISTRY.OFFERUP.searchConfig;
  const zip = params.zip || QUANTUM_CONFIG.HOME_ZIP;
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;
  const radius = params.radius || config.defaultRadius;

  const urls = [];

  const keywords = params.keywords || ['car', 'truck', 'suv'];

  for (const keyword of keywords) {
    const baseUrl = `https://offerup.com/search`;
    const filterParams = [
      `q=${encodeURIComponent(keyword)}`,
      `delivery_param=all`,
      `sort=-posted`,
      `price_min=${minPrice}`,
      `price_max=${maxPrice}`,
      `location=${zip}`,
      `radius=${radius}`,
      `category_id=7` // Vehicles
    ].join('&');

    urls.push(`${baseUrl}?${filterParams}`);
  }

  return urls;
}

/**
 * Build eBay Motors search URLs for bulk scraping.
 */
function buildEbayMotorsURLs(params) {
  const config = ROBOT_REGISTRY.EBAY.searchConfig;
  const zip = params.zip || QUANTUM_CONFIG.HOME_ZIP;
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;
  const radius = params.radius || config.defaultRadius;
  const minYear = params.minYear || config.defaultMinYear;

  const urls = [];

  // eBay Motors - Cars & Trucks category 6001
  const baseUrl = 'https://www.ebay.com/sch/Cars-Trucks/6001/i.html';
  const filterParams = [
    `_udlo=${minPrice}`,
    `_udhi=${maxPrice}`,
    `_stpos=${zip}`,
    `_sadis=${radius}`,
    `_fspt=1`, // local pickup
    `LH_ItemCondition=3000`, // Used
    `_sop=10`, // Newly listed
    `Year%20Range=${minYear}-2026`,
    `rt=nc`
  ].join('&');

  // Buy It Now listings
  urls.push(`${baseUrl}?${filterParams}&LH_BIN=1`);
  // Auction listings
  urls.push(`${baseUrl}?${filterParams}&LH_Auction=1`);

  return urls;
}

/**
 * Build AutoTrader search URLs for bulk scraping.
 */
function buildAutoTraderURLs(params) {
  const config = ROBOT_REGISTRY.AUTOTRADER.searchConfig;
  const zip = params.zip || QUANTUM_CONFIG.HOME_ZIP;
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;
  const radius = params.radius || config.defaultRadius;
  const minYear = params.minYear || config.defaultMinYear;

  const urls = [];

  const baseUrl = 'https://www.autotrader.com/cars-for-sale/all-cars';
  const filterParams = [
    `listingTypes=USED`,
    `zip=${zip}`,
    `searchRadius=${radius}`,
    `startYear=${minYear}`,
    `minPrice=${minPrice}`,
    `maxPrice=${maxPrice}`,
    `sortBy=derivedpriceDESC`, // Best deal
    `numRecords=25`
  ].join('&');

  // Multiple pages
  for (let page = 1; page <= (params.maxPages || config.maxPages); page++) {
    urls.push(`${baseUrl}?${filterParams}&firstRecord=${(page - 1) * 25}`);
  }

  return urls;
}

/**
 * Build Cars.com search URLs for bulk scraping.
 */
function buildCarsComURLs(params) {
  const config = ROBOT_REGISTRY.CARSCOM.searchConfig;
  const zip = params.zip || QUANTUM_CONFIG.HOME_ZIP;
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;
  const radius = params.radius || config.defaultRadius;
  const minYear = params.minYear || config.defaultMinYear;

  const urls = [];

  const baseUrl = 'https://www.cars.com/shopping/results/';
  const filterParams = [
    `stock_type=used`,
    `zip=${zip}`,
    `maximum_distance=${radius}`,
    `year_min=${minYear}`,
    `list_price_min=${minPrice}`,
    `list_price_max=${maxPrice}`,
    `sort=best_deal_desc`,
    `per_page=20`
  ].join('&');

  for (let page = 1; page <= (params.maxPages || config.maxPages); page++) {
    urls.push(`${baseUrl}?${filterParams}&page=${page}`);
  }

  return urls;
}

// =========================================================
// POWERSPORTS URL BUILDERS
// =========================================================

/**
 * Build ATV Trader search URLs.
 */
function buildATVTraderURLs(params) {
  const config = ROBOT_REGISTRY.ATV_TRADER.searchConfig;
  const zip = params.zip || QUANTUM_CONFIG.HOME_ZIP;
  const radius = params.radius || config.defaultRadius;
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;

  const urls = [];
  const baseUrl = 'https://www.atvtrader.com/atvs-for-sale';
  const filterParams = [
    `zip=${zip}`,
    `radius=${radius}`,
    `price=${minPrice}%2C${maxPrice}`,
    `sort=create_date%3Adesc`
  ].join('&');

  for (let page = 1; page <= (params.maxPages || config.maxPages); page++) {
    urls.push(`${baseUrl}?${filterParams}&page=${page}`);
  }

  return urls;
}

/**
 * Build Cycle Trader search URLs.
 */
function buildCycleTraderURLs(params) {
  const config = ROBOT_REGISTRY.CYCLE_TRADER.searchConfig;
  const zip = params.zip || QUANTUM_CONFIG.HOME_ZIP;
  const radius = params.radius || config.defaultRadius;
  const minPrice = params.minPrice || config.defaultMinPrice;
  const maxPrice = params.maxPrice || config.defaultMaxPrice;

  const urls = [];
  const baseUrl = 'https://www.cycletrader.com/motorcycles-for-sale';
  const filterParams = [
    `zip=${zip}`,
    `radius=${radius}`,
    `price=${minPrice}%2C${maxPrice}`,
    `sort=create_date%3Adesc`
  ].join('&');

  for (let page = 1; page <= (params.maxPages || config.maxPages); page++) {
    urls.push(`${baseUrl}?${filterParams}&page=${page}`);
  }

  return urls;
}

/**
 * Build Craigslist ATV/Powersports search URLs.
 */
function buildCraigslistATVURLs(params) {
  const config = ROBOT_REGISTRY.CRAIGSLIST.searchConfig;
  const subdomains = params.subdomains || [config.subdomains['St. Louis']];
  const minPrice = params.minPrice || 500;
  const maxPrice = params.maxPrice || 15000;

  const urls = [];

  for (const subdomain of subdomains) {
    // ATVs/UTVs/Snowmobiles category
    urls.push(`https://${subdomain}.craigslist.org/search/ata?min_price=${minPrice}&max_price=${maxPrice}&sort=date`);
    // Motorcycles/Scooters category
    urls.push(`https://${subdomain}.craigslist.org/search/mca?min_price=${minPrice}&max_price=${maxPrice}&sort=date`);
  }

  return urls;
}

// =========================================================
// ONE-CLICK DEPLOYMENT
// =========================================================

/**
 * Deploy a robot for a specific marketplace.
 * Generates search URLs, runs bulk scrape, and sets up webhook.
 *
 * Prerequisites: Robot must be trained in Browse.ai dashboard
 * and registered via registerBrowseAIRobot().
 */
function deployMarketplaceRobot(platform, robotId, searchParams) {
  const urlBuilders = {
    'Facebook': buildFacebookMarketplaceURLs,
    'Craigslist': buildCraigslistURLs,
    'OfferUp': buildOfferUpURLs,
    'eBay': buildEbayMotorsURLs,
    'AutoTrader': buildAutoTraderURLs,
    'Cars.com': buildCarsComURLs,
    'ATV Trader': buildATVTraderURLs,
    'Cycle Trader': buildCycleTraderURLs
  };

  const builder = urlBuilders[platform];
  if (!builder) {
    throw new Error(`No URL builder for platform: ${platform}. Supported: ${Object.keys(urlBuilders).join(', ')}`);
  }

  // Generate search URLs
  const urls = builder(searchParams || {});

  if (urls.length === 0) {
    throw new Error(`No URLs generated for ${platform}. Check search parameters.`);
  }

  // Run bulk scrape
  const results = runBrowseAIBulkRun(robotId, urls, `CarHawk ${platform} Scrape`);

  logQuantum('Robot Deployed', `${platform}: ${urls.length} URLs submitted to robot ${robotId}`);

  return {
    platform: platform,
    robotId: robotId,
    urlCount: urls.length,
    bulkRuns: results
  };
}

/**
 * Deploy all registered marketplace robots at once.
 */
function deployAllRobots(searchParams) {
  const integrations = getActiveIntegrations();
  const browseAIRobots = integrations.filter(i => i.provider === 'Browse.ai');

  const results = [];

  for (const robot of browseAIRobots) {
    try {
      let config = {};
      try { config = JSON.parse(robot.configuration || '{}'); } catch (e) {}

      const robotId = config.browseAIRobotId;
      if (!robotId) {
        results.push({ platform: robot.notes, status: 'skipped', reason: 'No Browse.ai robot ID configured' });
        continue;
      }

      const result = deployMarketplaceRobot(robot.notes, robotId, searchParams);
      results.push({ platform: robot.notes, status: 'deployed', ...result });

    } catch (error) {
      results.push({ platform: robot.notes, status: 'error', error: error.toString() });
    }
  }

  return results;
}

// =========================================================
// UI FUNCTIONS
// =========================================================

/**
 * Set Browse.ai API key via UI prompt.
 */
function setBrowseAIApiKeyUI() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Browse.ai API Key',
    'Enter your Browse.ai API key.\n\nFind it at: Browse.ai Dashboard > API tab\n\nThis key will be stored securely in script properties.',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const apiKey = response.getResponseText().trim();
  if (!apiKey) {
    ui.alert('API key is required.');
    return;
  }

  setBrowseAIApiKey(apiKey);
  ui.alert('Browse.ai API key saved successfully!');
}

/**
 * List all Browse.ai robots from the API and show in dialog.
 */
function showBrowseAIRobotsUI() {
  const ui = SpreadsheetApp.getUi();

  try {
    const robots = listBrowseAIRobots();

    if (robots.length === 0) {
      ui.alert('No robots found in your Browse.ai account.\n\nCreate and train robots at browse.ai first.');
      return;
    }

    const lines = robots.map((r, i) =>
      `${i + 1}. ${r.name || 'Unnamed'}\n   ID: ${r.id}\n   Status: ${r.status || 'unknown'}`
    );

    showLargeText_('Browse.ai Robots', lines.join('\n\n'));

  } catch (error) {
    ui.alert('Error fetching robots: ' + error.toString());
  }
}

/**
 * Interactive: link a Browse.ai robot to a marketplace platform.
 */
function linkBrowseAIRobotUI() {
  const ui = SpreadsheetApp.getUi();

  // Fetch robots from API
  let robots;
  try {
    robots = listBrowseAIRobots();
  } catch (error) {
    ui.alert('Error: ' + error.toString() + '\n\nMake sure your API key is set.');
    return;
  }

  if (robots.length === 0) {
    ui.alert('No robots found. Create and train robots in Browse.ai first.');
    return;
  }

  // Show robots
  const robotList = robots.map((r, i) => `${i + 1}. ${r.name || 'Unnamed'} (${r.id})`).join('\n');
  const robotResponse = ui.prompt(
    'Link Browse.ai Robot',
    `Select a robot number:\n\n${robotList}`,
    ui.ButtonSet.OK_CANCEL
  );

  if (robotResponse.getSelectedButton() !== ui.Button.OK) return;

  const robotIdx = parseInt(robotResponse.getResponseText()) - 1;
  if (isNaN(robotIdx) || robotIdx < 0 || robotIdx >= robots.length) {
    ui.alert('Invalid selection.');
    return;
  }

  const selectedRobot = robots[robotIdx];

  // Show platforms
  const platforms = Object.values(ROBOT_REGISTRY);
  const platformList = platforms.map((p, i) => `${i + 1}. ${p.displayName} (${p.category})`).join('\n');
  const platformResponse = ui.prompt(
    'Select Marketplace',
    `Which marketplace does this robot scrape?\n\n${platformList}`,
    ui.ButtonSet.OK_CANCEL
  );

  if (platformResponse.getSelectedButton() !== ui.Button.OK) return;

  const platformIdx = parseInt(platformResponse.getResponseText()) - 1;
  if (isNaN(platformIdx) || platformIdx < 0 || platformIdx >= platforms.length) {
    ui.alert('Invalid selection.');
    return;
  }

  const selectedPlatform = platforms[platformIdx];

  // Register the integration
  const integrationId = addIntegration({
    provider: 'Browse.ai',
    type: 'Robot',
    name: `${selectedPlatform.displayName}: ${selectedRobot.name || selectedRobot.id}`,
    key: '', // No sheet ID needed for API-based robots
    syncFrequency: String(selectedPlatform.searchConfig.refreshInterval),
    configuration: JSON.stringify({
      browseAIRobotId: selectedRobot.id,
      platform: selectedPlatform.platform,
      category: selectedPlatform.category,
      robotName: selectedRobot.name
    }),
    features: Object.keys(selectedPlatform.columnMap).join(', '),
    notes: selectedPlatform.platform
  });

  ui.alert(
    `Robot linked successfully!\n\n` +
    `Integration ID: ${integrationId}\n` +
    `Robot: ${selectedRobot.name || selectedRobot.id}\n` +
    `Platform: ${selectedPlatform.displayName}\n\n` +
    `You can now run "Deploy Robot" to start scraping.`
  );
}

/**
 * Interactive: deploy a marketplace robot (generate URLs + bulk run).
 */
function deployRobotUI() {
  const ui = SpreadsheetApp.getUi();

  // Get registered robots
  const integrations = getActiveIntegrations();
  const browseAIRobots = integrations.filter(i => {
    if (i.provider !== 'Browse.ai') return false;
    try {
      const config = JSON.parse(i.configuration || '{}');
      return !!config.browseAIRobotId;
    } catch (e) { return false; }
  });

  if (browseAIRobots.length === 0) {
    ui.alert('No API-linked robots found.\n\nUse "Link Browse.ai Robot" first to connect a robot to a marketplace.');
    return;
  }

  // Show registered robots
  const robotList = browseAIRobots.map((r, i) => `${i + 1}. ${r.name} (${r.notes})`).join('\n');
  const response = ui.prompt(
    'Deploy Robot',
    `Select a robot to deploy:\n\n${robotList}\n\nOr enter 0 to deploy ALL robots:`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const selection = parseInt(response.getResponseText());

  try {
    if (selection === 0) {
      // Deploy all
      const results = deployAllRobots({});
      const summary = results.map(r => `${r.platform}: ${r.status}${r.urlCount ? ' (' + r.urlCount + ' URLs)' : ''}`).join('\n');
      ui.alert(`All Robots Deployed!\n\n${summary}`);
    } else {
      const robot = browseAIRobots[selection - 1];
      if (!robot) {
        ui.alert('Invalid selection.');
        return;
      }

      const config = JSON.parse(robot.configuration || '{}');
      const result = deployMarketplaceRobot(robot.notes, config.browseAIRobotId, {});
      ui.alert(`Robot Deployed!\n\n${robot.notes}: ${result.urlCount} URLs submitted for scraping.`);
    }
  } catch (error) {
    ui.alert('Deployment error: ' + error.toString());
  }
}

/**
 * UI wrapper: Fetch and import Browse.ai data with status alert.
 */
function fetchAndImportBrowseAIDataUI() {
  const ui = SpreadsheetApp.getUi();
  try {
    const count = fetchAndImportBrowseAIData();
    ui.alert(`Browse.ai Data Import Complete!\n\nImported ${count} new listings from API-linked robots.`);
  } catch (error) {
    ui.alert('Import error: ' + error.toString());
  }
}

/**
 * UI wrapper: Show status of all registered robots.
 */
function showRobotStatusUI() {
  const ui = SpreadsheetApp.getUi();

  // Sheet-based robots
  const sheetRobots = listRegisteredRobots();

  // API-linked robots
  const integrations = getActiveIntegrations();
  const apiRobots = integrations.filter(i => {
    if (i.provider !== 'Browse.ai') return false;
    try {
      const config = JSON.parse(i.configuration || '{}');
      return !!config.browseAIRobotId;
    } catch (e) { return false; }
  });

  const lines = [];

  lines.push('=== SHEET-BASED ROBOTS ===');
  if (sheetRobots.count === 0) {
    lines.push('  None registered');
  } else {
    for (const r of sheetRobots.robots) {
      lines.push(`  ${r.platform}: ${r.name}`);
      lines.push(`    Status: ${r.status} | Last Sync: ${r.lastSync || 'Never'}`);
    }
  }

  lines.push('');
  lines.push('=== API-LINKED ROBOTS ===');
  if (apiRobots.length === 0) {
    lines.push('  None linked');
  } else {
    for (const r of apiRobots) {
      let config = {};
      try { config = JSON.parse(r.configuration || '{}'); } catch (e) {}
      lines.push(`  ${r.notes}: ${config.robotName || config.browseAIRobotId}`);
      lines.push(`    Robot ID: ${config.browseAIRobotId}`);
      lines.push(`    Status: ${r.status} | Last Sync: ${r.lastSync || 'Never'}`);
    }
  }

  lines.push('');
  lines.push('=== SUPPORTED PLATFORMS ===');
  const platforms = getSupportedPlatforms();
  lines.push('Automotive:');
  for (const p of platforms.automotive) {
    lines.push(`  ${p.displayName} (${p.fieldCount} fields, ${p.refreshMinutes}min refresh)`);
  }
  lines.push('Powersports:');
  for (const p of platforms.powersports) {
    lines.push(`  ${p.displayName} (${p.fieldCount} fields, ${p.refreshMinutes}min refresh)`);
  }

  showLargeText_('Browse.ai Robot Status', lines.join('\n'));
}

/**
 * Fetch completed task data from all API-linked robots and import.
 */
function fetchAndImportBrowseAIData() {
  const integrations = getActiveIntegrations();
  const browseAIRobots = integrations.filter(i => {
    if (i.provider !== 'Browse.ai') return false;
    try {
      const config = JSON.parse(i.configuration || '{}');
      return !!config.browseAIRobotId;
    } catch (e) { return false; }
  });

  let totalImported = 0;

  for (const robot of browseAIRobots) {
    try {
      const config = JSON.parse(robot.configuration || '{}');
      const robotId = config.browseAIRobotId;

      // Get recent successful tasks
      const tasksResult = listBrowseAITasks(robotId, {
        status: 'successful',
        pageSize: 100
      });

      const tasks = tasksResult.tasks || tasksResult.result || [];

      for (const task of tasks) {
        if (task.capturedTexts) {
          const url = task.inputParameters && task.inputParameters.originUrl;
          const processedUrls = getProcessedUrls();
          if (url && !processedUrls.includes(url)) {
            importWebhookData(robotId, task.id, task.capturedTexts);
            totalImported++;
          }
        }
      }

      updateIntegrationSync(robot.integrationId, totalImported);

    } catch (error) {
      logQuantum('Fetch Import Error', `${robot.name}: ${error.toString()}`);
    }
  }

  return totalImported;
}
