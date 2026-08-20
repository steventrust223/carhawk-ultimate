// =========================================================
// FILE: quantum_browse_ai_chain.gs - Two-Robot Chaining
// =========================================================
// API-orchestrated chaining for marketplaces that require a
// LIST robot + DETAIL robot to fully scrape listings.
//
//   List Robot   -> scrapes a search-results page, returns a
//                   list of listing URLs (capturedLists)
//   CarHawk      -> harvests those URLs
//   Detail Robot -> bulk-run against the URLs, returns full
//                   per-listing data (capturedTexts)
//   CarHawk      -> imports the detail rows (existing path)
//
// A chain integration stores BOTH robot IDs in its config:
//   { chainMode:true, listRobotId, detailRobotId, platform, ... }
//
// Single-robot integrations (config.browseAIRobotId) are
// unaffected and continue to flow through the existing path.
// =========================================================

// =========================================================
// WEBHOOK ROUTER
// =========================================================

/**
 * Central router for Browse.ai webhook callbacks.
 * Called by doPost() in quantum_browse_ai_api.gs.
 *
 * Decides whether the finished task belongs to a LIST robot
 * (=> kick the detail robot) or a DETAIL / single robot
 * (=> import the captured data).
 */
function handleBrowseAIWebhook(payload) {
  const task = payload.task || {};
  const robotId = task.robotId || (payload.robot && payload.robot.id);
  const taskId = task.id || (payload.task && payload.task.id);

  if (!robotId) {
    logQuantum('Webhook', 'No robotId in payload — ignoring');
    return { status: 'ignored', reason: 'no robotId' };
  }

  // Is this the LIST robot of a chain?
  const chain = findChainByListRobot(robotId);
  if (chain) {
    return handleListRobotComplete(chain, task);
  }

  // Otherwise treat as detail / single robot -> import captured data
  const capturedData = task.capturedTexts;
  if (capturedData) {
    importWebhookData(robotId, taskId, capturedData);
    return { status: 'imported', robotId: robotId, taskId: taskId };
  }

  logQuantum('Webhook', `No capturedTexts for robot ${robotId} — nothing to import`);
  return { status: 'no_data', robotId: robotId };
}

/**
 * A list robot finished. Harvest the listing URLs it captured and
 * bulk-run the chain's detail robot against them.
 */
function handleListRobotComplete(chain, task) {
  const urls = extractUrlsFromListTask(task);

  if (urls.length === 0) {
    logQuantum('Chain', `List robot ${chain.listRobotId} returned 0 URLs (${chain.platform})`);
    return { status: 'no_urls', platform: chain.platform };
  }

  // Skip URLs we've already imported to save detail-robot credits
  const processed = getProcessedUrls();
  const freshUrls = urls.filter(u => u && processed.indexOf(u) === -1);

  if (freshUrls.length === 0) {
    logQuantum('Chain', `All ${urls.length} URLs already processed (${chain.platform})`);
    return { status: 'all_duplicates', platform: chain.platform, totalUrls: urls.length };
  }

  const results = runBrowseAIBulkRun(
    chain.detailRobotId,
    freshUrls,
    `CarHawk ${chain.platform} Detail`
  );

  logQuantum('Chain',
    `${chain.platform}: list robot -> ${freshUrls.length} fresh URLs handed to detail robot ${chain.detailRobotId}`);

  return {
    status: 'detail_dispatched',
    platform: chain.platform,
    totalUrls: urls.length,
    freshUrls: freshUrls.length,
    detailRobotId: chain.detailRobotId,
    bulkRuns: results
  };
}

// =========================================================
// URL HARVESTING
// =========================================================

/**
 * Extract listing URLs from a list robot's completed task.
 * Browse.ai returns list data under task.capturedLists:
 *   { "Listings": [ { url: "...", title: "..." }, ... ] }
 *
 * We scan every item in every list for a URL-like value.
 */
function extractUrlsFromListTask(task) {
  const lists = task.capturedLists || {};
  const urls = [];
  const seen = {};

  // Field names that commonly hold the listing link
  const urlKeys = [
    'url', 'link', 'listing_url', 'listingurl', ' listing url',
    'ad_url', 'adurl', 'href', 'product_url', 'producturl',
    'item_url', 'itemurl', 'detail_url', 'detailurl',
    'url_href', 'link_href', 'listing_link'
  ];

  Object.keys(lists).forEach(function (listName) {
    const items = lists[listName];
    if (!Array.isArray(items)) return;

    items.forEach(function (item) {
      if (!item || typeof item !== 'object') return;

      let found = '';

      // 1) Try known URL keys (case-insensitive)
      const keys = Object.keys(item);
      for (let k = 0; k < keys.length && !found; k++) {
        const norm = keys[k].toLowerCase().replace(/\s+/g, '_');
        if (urlKeys.indexOf(norm) !== -1) {
          const val = item[keys[k]];
          if (val && typeof val === 'string' && /^https?:\/\//i.test(val)) {
            found = val;
          }
        }
      }

      // 2) Fallback: any string value that looks like an http URL
      if (!found) {
        for (let k = 0; k < keys.length && !found; k++) {
          const val = item[keys[k]];
          if (val && typeof val === 'string' && /^https?:\/\//i.test(val)) {
            found = val;
          }
        }
      }

      if (found) {
        const clean = found.trim();
        if (!seen[clean]) {
          seen[clean] = true;
          urls.push(clean);
        }
      }
    });
  });

  return urls;
}

// =========================================================
// CHAIN LOOKUP
// =========================================================

/**
 * Return all active Browse.ai chain integrations (chainMode = true).
 * Each result includes parsed { listRobotId, detailRobotId, platform, ... }.
 */
function getChainIntegrations() {
  const integrations = getActiveIntegrations();
  const chains = [];

  for (const i of integrations) {
    if (i.provider !== 'Browse.ai') continue;
    let config = {};
    try { config = JSON.parse(i.configuration || '{}'); } catch (e) { continue; }
    if (config.chainMode && config.listRobotId && config.detailRobotId) {
      chains.push({
        integrationId: i.integrationId,
        name: i.name,
        platform: config.platform || i.notes,
        listRobotId: config.listRobotId,
        detailRobotId: config.detailRobotId,
        category: config.category,
        config: config
      });
    }
  }

  return chains;
}

/**
 * Find the chain whose LIST robot matches the given robot ID.
 */
function findChainByListRobot(robotId) {
  const chains = getChainIntegrations();
  return chains.find(c => c.listRobotId === robotId) || null;
}

// =========================================================
// DEPLOYMENT — run the list robot (webhook drives the rest)
// =========================================================

/**
 * Deploy a robot chain: generate search URLs for the platform and
 * run the LIST robot against them. When the list robot finishes,
 * the webhook router hands the harvested URLs to the detail robot.
 */
function deployRobotChain(chain, searchParams) {
  const urlBuilders = {
    'Facebook': buildFacebookMarketplaceURLs,
    'Craigslist': buildCraigslistURLs,
    'OfferUp': buildOfferUpURLs,
    'eBay': buildEbayMotorsURLs,
    'AutoTrader': buildAutoTraderURLs,
    'Cars.com': buildCarsComURLs,
    'ATV Trader': buildATVTraderURLs,
    'Cycle Trader': buildCycleTraderURLs,
    'Facebook E-Bikes': buildFacebookEbikeURLs,
    'Craigslist E-Bikes': buildCraigslistEbikeURLs,
    'OfferUp E-Bikes': buildOfferUpEbikeURLs,
    'eBay E-Bikes': buildEbayEbikeURLs
  };

  const builder = urlBuilders[chain.platform];
  if (!builder) {
    throw new Error(`No URL builder for platform: ${chain.platform}`);
  }

  const searchUrls = builder(searchParams || {});
  if (searchUrls.length === 0) {
    throw new Error(`No search URLs generated for ${chain.platform}`);
  }

  // Run the LIST robot against the search-results pages
  const results = runBrowseAIBulkRun(
    chain.listRobotId,
    searchUrls,
    `CarHawk ${chain.platform} List`
  );

  logQuantum('Chain Deployed',
    `${chain.platform}: ${searchUrls.length} search pages -> list robot ${chain.listRobotId}`);

  return {
    platform: chain.platform,
    listRobotId: chain.listRobotId,
    detailRobotId: chain.detailRobotId,
    searchUrlCount: searchUrls.length,
    bulkRuns: results
  };
}

/**
 * Deploy every registered chain at once.
 */
function deployAllChains(searchParams) {
  const chains = getChainIntegrations();
  const results = [];

  for (const chain of chains) {
    try {
      const result = deployRobotChain(chain, searchParams);
      results.push({ platform: chain.platform, status: 'deployed', ...result });
    } catch (error) {
      results.push({ platform: chain.platform, status: 'error', error: error.toString() });
    }
  }

  return results;
}

// =========================================================
// POLL-BASED FALLBACK (when webhooks aren't set up)
// =========================================================

/**
 * For chains without webhooks: pull recent successful LIST-robot tasks,
 * harvest their URLs, and dispatch the detail robot. Then import any
 * finished detail-robot data via the existing fetch path.
 *
 * Safe to run on a timer (e.g. every 30 min).
 */
function processChainsPoll() {
  const chains = getChainIntegrations();
  const summary = [];

  for (const chain of chains) {
    try {
      const tasksResult = listBrowseAITasks(chain.listRobotId, {
        status: 'successful',
        pageSize: 50
      });
      const tasks = tasksResult.tasks || tasksResult.result || [];

      let dispatched = 0;
      for (const task of tasks) {
        const r = handleListRobotComplete(chain, task);
        if (r.status === 'detail_dispatched') dispatched += r.freshUrls;
      }

      summary.push({ platform: chain.platform, urlsDispatched: dispatched });
    } catch (error) {
      logQuantum('Chain Poll Error', `${chain.platform}: ${error.toString()}`);
      summary.push({ platform: chain.platform, error: error.toString() });
    }
  }

  // Import any completed detail-robot data
  const imported = fetchAndImportBrowseAIData();

  return { chains: summary, imported: imported };
}

// =========================================================
// UI
// =========================================================

/**
 * Interactive: link a LIST robot + DETAIL robot as a chain for a platform.
 */
function linkBrowseAIChainUI() {
  const ui = SpreadsheetApp.getUi();

  // Fetch robots from the API
  let robots;
  try {
    robots = listBrowseAIRobots();
  } catch (error) {
    ui.alert('Error: ' + error.toString() + '\n\nMake sure your API key is set (Set API Key).');
    return;
  }

  if (robots.length < 2) {
    ui.alert('A chain needs two robots (a list robot and a detail robot).\n\n' +
             'Create and train both in Browse.ai first, then come back here.');
    return;
  }

  const robotList = robots.map((r, i) => `${i + 1}. ${r.name || 'Unnamed'} (${r.id})`).join('\n');

  // Choose LIST robot
  const listResp = ui.prompt(
    'Step 1 of 3 — LIST Robot',
    `Which robot scrapes the SEARCH RESULTS page (outputs listing URLs)?\n\n${robotList}\n\nEnter the number:`,
    ui.ButtonSet.OK_CANCEL
  );
  if (listResp.getSelectedButton() !== ui.Button.OK) return;
  const listIdx = parseInt(listResp.getResponseText()) - 1;
  if (isNaN(listIdx) || !robots[listIdx]) { ui.alert('Invalid selection.'); return; }
  const listRobot = robots[listIdx];

  // Choose DETAIL robot
  const detailResp = ui.prompt(
    'Step 2 of 3 — DETAIL Robot',
    `Which robot scrapes a SINGLE listing page (full details)?\n\n${robotList}\n\nEnter the number:`,
    ui.ButtonSet.OK_CANCEL
  );
  if (detailResp.getSelectedButton() !== ui.Button.OK) return;
  const detailIdx = parseInt(detailResp.getResponseText()) - 1;
  if (isNaN(detailIdx) || !robots[detailIdx]) { ui.alert('Invalid selection.'); return; }
  const detailRobot = robots[detailIdx];

  if (listIdx === detailIdx) {
    ui.alert('The list robot and detail robot must be different robots.');
    return;
  }

  // Choose platform
  const platforms = Object.values(ROBOT_REGISTRY);
  const platformList = platforms.map((p, i) => `${i + 1}. ${p.displayName} (${p.category})`).join('\n');
  const platResp = ui.prompt(
    'Step 3 of 3 — Marketplace',
    `Which marketplace is this chain for?\n\n${platformList}\n\nEnter the number:`,
    ui.ButtonSet.OK_CANCEL
  );
  if (platResp.getSelectedButton() !== ui.Button.OK) return;
  const platIdx = parseInt(platResp.getResponseText()) - 1;
  if (isNaN(platIdx) || !platforms[platIdx]) { ui.alert('Invalid selection.'); return; }
  const platform = platforms[platIdx];

  const integrationId = addIntegration({
    provider: 'Browse.ai',
    type: 'Robot Chain',
    name: `${platform.displayName} Chain: ${listRobot.name || listRobot.id} -> ${detailRobot.name || detailRobot.id}`,
    key: '',
    syncFrequency: String(platform.searchConfig.refreshInterval),
    configuration: JSON.stringify({
      chainMode: true,
      listRobotId: listRobot.id,
      detailRobotId: detailRobot.id,
      listRobotName: listRobot.name,
      detailRobotName: detailRobot.name,
      platform: platform.platform,
      category: platform.category
    }),
    features: Object.keys(platform.columnMap).join(', '),
    notes: platform.platform
  });

  ui.alert(
    `Robot chain linked!\n\n` +
    `Integration ID: ${integrationId}\n` +
    `Platform: ${platform.displayName}\n` +
    `List robot:   ${listRobot.name || listRobot.id}\n` +
    `Detail robot: ${detailRobot.name || detailRobot.id}\n\n` +
    `Next: register the webhook (Register Chain Webhooks) so the detail robot\n` +
    `runs automatically, then Deploy Chain to start scraping.`
  );
}

/**
 * Register the CarHawk web-app URL as a webhook on BOTH robots of every chain
 * so list completion auto-triggers the detail robot and detail completion
 * auto-imports.
 */
function registerChainWebhooksUI() {
  const ui = SpreadsheetApp.getUi();

  const urlResp = ui.prompt(
    'Register Chain Webhooks',
    'Paste your deployed CarHawk web-app URL.\n\n' +
    '(Apps Script: Deploy > New deployment > Web app > copy the /exec URL)',
    ui.ButtonSet.OK_CANCEL
  );
  if (urlResp.getSelectedButton() !== ui.Button.OK) return;
  const webhookUrl = urlResp.getResponseText().trim();
  if (!webhookUrl) { ui.alert('Web-app URL is required.'); return; }

  const chains = getChainIntegrations();
  if (chains.length === 0) { ui.alert('No chains linked yet. Use "Link Robot Chain" first.'); return; }

  const lines = [];
  for (const chain of chains) {
    try {
      registerBrowseAIWebhook(chain.listRobotId, webhookUrl, 'taskFinishedSuccessfully');
      registerBrowseAIWebhook(chain.detailRobotId, webhookUrl, 'taskFinishedSuccessfully');
      lines.push(`${chain.platform}: ✓ both robots`);
    } catch (error) {
      lines.push(`${chain.platform}: ✗ ${error.toString()}`);
    }
  }

  ui.alert('Webhook Registration\n\n' + lines.join('\n'));
}

/**
 * Interactive: deploy a chain (or all chains).
 */
function deployChainUI() {
  const ui = SpreadsheetApp.getUi();
  const chains = getChainIntegrations();

  if (chains.length === 0) {
    ui.alert('No chains linked.\n\nUse "Link Robot Chain" to connect a list robot + detail robot.');
    return;
  }

  const chainList = chains.map((c, i) => `${i + 1}. ${c.platform}`).join('\n');
  const response = ui.prompt(
    'Deploy Robot Chain',
    `Select a chain to deploy:\n\n${chainList}\n\nOr enter 0 to deploy ALL chains:`,
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  const selection = parseInt(response.getResponseText());

  try {
    if (selection === 0) {
      const results = deployAllChains({});
      const summary = results.map(r =>
        `${r.platform}: ${r.status}${r.searchUrlCount ? ' (' + r.searchUrlCount + ' search pages)' : ''}`
      ).join('\n');
      ui.alert(`All Chains Deployed!\n\n${summary}\n\nThe detail robot runs automatically as the list robot finishes.`);
    } else {
      const chain = chains[selection - 1];
      if (!chain) { ui.alert('Invalid selection.'); return; }
      const result = deployRobotChain(chain, {});
      ui.alert(`Chain Deployed!\n\n${chain.platform}: ${result.searchUrlCount} search pages submitted to the list robot.\n\n` +
               `The detail robot will run automatically on the harvested listing URLs.`);
    }
  } catch (error) {
    ui.alert('Deployment error: ' + error.toString());
  }
}

/**
 * UI wrapper: run the poll-based chain processor (for setups without webhooks).
 */
function processChainsPollUI() {
  const ui = SpreadsheetApp.getUi();
  try {
    const result = processChainsPoll();
    const lines = result.chains.map(c =>
      c.error ? `${c.platform}: error` : `${c.platform}: ${c.urlsDispatched} URLs -> detail robot`
    );
    ui.alert(`Chain Processing Complete!\n\n${lines.join('\n')}\n\nDetail rows imported: ${result.imported}`);
  } catch (error) {
    ui.alert('Chain processing error: ' + error.toString());
  }
}
