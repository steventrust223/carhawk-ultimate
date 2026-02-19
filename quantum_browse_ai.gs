// =========================================================
// FILE: quantum-browse-ai.gs - Browse.AI Integration
// =========================================================

function importFromBrowseAI() {
  const ui = SpreadsheetApp.getUi();

  // Get integration settings
  const integrations = getActiveIntegrations();
  const browseAIIntegrations = integrations.filter(i => i.provider === 'Browse.ai');

  if (browseAIIntegrations.length === 0) {
    ui.alert('No Browse.ai integrations configured. Please add one in Integration Manager.');
    return;
  }

  let totalImported = 0;

  for (const integration of browseAIIntegrations) {
    try {
      const result = processBrowseAIIntegration(integration);
      totalImported += result.imported;

      // Update integration status
      updateIntegrationSync(integration.integrationId, result.imported);

    } catch (error) {
      logQuantum('Browse.ai Import Error', `${integration.name}: ${error.toString()}`);
      updateIntegrationError(integration.integrationId, error.toString());
    }
  }

  ui.alert(`Browse.ai Import Complete! Imported ${totalImported} new deals.`);
}

function processBrowseAIIntegration(integration) {
  const sheetId = integration.key;

  // Open the Browse.ai export sheet
  let sourceSheet;
  try {
    const sourceSpreadsheet = SpreadsheetApp.openById(sheetId);
    sourceSheet = sourceSpreadsheet.getActiveSheet();
  } catch (error) {
    throw new Error('Cannot access Browse.ai sheet. Check sharing permissions.');
  }

  const data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) {
    return {imported: 0};
  }

  // Map Browse.ai columns
  const headers = data[0];
  const columnMap = mapBrowseAIColumns(headers);

  // Import to Master Import sheet
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  let imported = 0;

  // Track processed URLs to avoid duplicates
  const processedUrls = getProcessedUrls();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const url = row[columnMap.url] || row[columnMap.link] || '';

    // Skip if already processed
    if (processedUrls.includes(url)) continue;

    // Extract platform from integration notes
    const platform = integration.notes || detectPlatformFromURL(url);

    // Prepare import row
    const importRow = [
      generateQuantumId('IMP'), // Import ID
      new Date(), // Date (GMT)
      row[columnMap.jobLink] || '', // Job Link
      url, // Origin URL
      platform, // Platform
      row[columnMap.title] || '', // Raw Title
      row[columnMap.price] || '', // Raw Price
      row[columnMap.location] || '', // Raw Location
      row[columnMap.description] || '', // Raw Description
      row[columnMap.sellerInfo] || '', // Seller Info
      row[columnMap.postedDate] || '', // Posted Date
      row[columnMap.images] || 0, // Images Count
      'Pending', // Import Status
      false, // Processed
      '', // Master ID
      '' // Error Log
    ];

    importSheet.appendRow(importRow);
    imported++;

    // Mark URL as processed
    markUrlProcessed(url);
  }

  return {imported: imported};
}

function mapBrowseAIColumns(headers) {
  // Common Browse.ai column mappings
  const mappings = {
    url: ['url', 'link', 'listing_url', 'ad_url'],
    title: ['title', 'name', 'listing_title', 'vehicle'],
    price: ['price', 'asking_price', 'cost'],
    location: ['location', 'city', 'area'],
    description: ['description', 'details', 'info'],
    sellerInfo: ['seller', 'contact', 'seller_name'],
    postedDate: ['date', 'posted', 'listed_date'],
    images: ['images', 'photos', 'image_count'],
    jobLink: ['job_link', 'browse_ai_link']
  };

  const columnMap = {};

  for (const [key, variants] of Object.entries(mappings)) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i].toLowerCase().replace(/\s+/g, '_');
      if (variants.includes(header)) {
        columnMap[key] = i;
        break;
      }
    }
  }

  return columnMap;
}

function detectPlatformFromURL(url) {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('facebook.com')) return 'Facebook';
  if (urlLower.includes('craigslist.org')) return 'Craigslist';
  if (urlLower.includes('offerup.com')) return 'OfferUp';
  if (urlLower.includes('ebay.com')) return 'eBay';
  if (urlLower.includes('autotrader.com')) return 'AutoTrader';
  if (urlLower.includes('cars.com')) return 'Cars.com';

  return 'Other';
}

function getProcessedUrls() {
  const props = PropertiesService.getScriptProperties();
  const urlsJson = props.getProperty('PROCESSED_URLS') || '[]';
  return JSON.parse(urlsJson);
}

function markUrlProcessed(url) {
  const props = PropertiesService.getScriptProperties();
  const urls = getProcessedUrls();

  urls.push(url);

  // Keep only last 1000 URLs to prevent property size issues
  if (urls.length > 1000) {
    urls.splice(0, urls.length - 1000);
  }

  props.setProperty('PROCESSED_URLS', JSON.stringify(urls));
}
