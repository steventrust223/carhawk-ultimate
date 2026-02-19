// =========================================================
// FILE: quantum-ui-functions.gs - UI Dialog Functions
// =========================================================

function showDealGallery() {
  const template = HtmlService.createTemplateFromFile('DealGallery');

  // Pass data to template
  template.deals = getTopDeals();
  template.stats = getQuickStats();

  const html = template.evaluate()
    .setWidth(1200)
    .setHeight(800)
    .setTitle('CarHawk Deal Gallery');

  SpreadsheetApp.getUi().showModalDialog(html, '🎴 Deal Gallery');
}

function showQuickActions() {
  const html = HtmlService.createTemplateFromFile('QuickActions')
    .evaluate()
    .setTitle('Quick Actions')
    .setWidth(350);

  SpreadsheetApp.getUi().showSidebar(html);
}

function showDealAnalyzer() {
  const template = HtmlService.createTemplateFromFile('DealAnalyzer');
  template.platforms = ['Facebook', 'Craigslist', 'OfferUp', 'eBay', 'Other'];

  const html = template.evaluate()
    .setWidth(800)
    .setHeight(600);

  SpreadsheetApp.getUi().showModalDialog(html, '🧠 Deal Analyzer');
}

// Data retrieval functions
function getTopDeals(limit = 20) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(QUANTUM_SHEETS.DATABASE.name);

  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const deals = [];

  // Skip header row, get top deals
  for (let i = 1; i < Math.min(data.length, limit + 1); i++) {
    const row = data[i];
    if (row[42] && row[42] !== '❌ PASS') { // Has verdict and not PASS
      deals.push({
        dealId: row[0] || '',
        year: row[5] || '',
        make: row[6] || '',
        model: row[7] || '',
        price: row[13] || 0,
        location: row[14] || '',
        distance: row[16] || 0,
        profit: row[26] || 0,
        roi: row[27] || 0,
        verdict: row[42] || '',
        strategy: row[28] || '',
        daysListed: row[32] || 0,
        mileage: row[10] || 0,
        condition: row[19] || '',
        platform: row[2] || '',
        confidence: row[41] || 0,
        sellerPhone: row[34] || '',
        stage: row[50] || 'IMPORTED'
      });
    }
  }

  return deals;
}

function getQuickStats() {
  const deals = getTopDeals(100);

  return {
    totalDeals: deals.length,
    hotDeals: deals.filter(d => d.verdict.includes('🔥')).length,
    totalProfit: deals.reduce((sum, d) => sum + (d.profit || 0), 0),
    avgROI: deals.length > 0 ?
      Math.round(deals.reduce((sum, d) => sum + (d.roi || 0), 0) / deals.length) : 0,
    platforms: {
      facebook: deals.filter(d => d.platform === 'Facebook').length,
      craigslist: deals.filter(d => d.platform === 'Craigslist').length,
      offerup: deals.filter(d => d.platform === 'OfferUp').length,
      ebay: deals.filter(d => d.platform === 'eBay').length
    }
  };
}

// Action handlers
function processDealAction(action, dealId) {
  switch(action) {
    case 'view':
      return navigateToDeal(dealId);
    case 'export':
      return exportSingleDeal(dealId);
    case 'analyze':
      return analyzeSingleDeal(dealId);
    case 'contact':
      return initiateDealContact(dealId);
    case 'schedule':
      return scheduleDealAppointment(dealId);
    default:
      throw new Error('Unknown action: ' + action);
  }
}

function navigateToDeal(dealId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(QUANTUM_SHEETS.DATABASE.name);

  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dealId) {
      sheet.setActiveRange(sheet.getRange(i + 1, 1));
      SpreadsheetApp.setActiveSheet(sheet);
      return {success: true, message: 'Navigated to deal'};
    }
  }

  return {success: false, message: 'Deal not found'};
}

function exportSingleDeal(dealId) {
  const deal = getDealById(dealId);
  if (!deal) return {success: false, message: 'Deal not found'};

  // Export to CRM
  const exportData = processQuantumSMSExport({
    selectedRows: [deal.rowNum],
    campaignName: `Single Export - ${deal.make} ${deal.model}`,
    messageTemplate: CRM_CONFIG.SMS_TEMPLATES.initial_hot,
    includeAI: true,
    createFollowUps: true
  });

  return {success: true, message: 'Deal exported to CRM'};
}

function analyzeSingleDeal(dealId) {
  const deal = getDealById(dealId);
  if (!deal) return {success: false, message: 'Deal not found'};

  // Trigger AI analysis for single deal
  triggerQuantumAnalysis([{
    dealId: dealId,
    rowNum: deal.rowNum,
    metrics: {} // Will be recalculated
  }]);

  return {success: true, message: 'Analysis started'};
}

function initiateDealContact(dealId) {
  const deal = getDealById(dealId);
  if (!deal) return {success: false, message: 'Deal not found'};

  // Create follow-up sequence
  const campaignId = createFollowUpSequence(dealId, 'HOT_LEAD');

  return {success: true, message: 'Contact sequence initiated', campaignId: campaignId};
}

function scheduleDealAppointment(dealId) {
  // This would open appointment scheduler
  return {success: true, message: 'Opening appointment scheduler...', action: 'openScheduler'};
}

function runQuickAction(action) {
  switch(action) {
    case 'sync':
      return runQuantumSync();
    case 'analyze':
      return runBatchAnalysis();
    case 'alerts':
      return checkAlerts();
    case 'export':
      return quickExportHotDeals();
    default:
      return {success: false, message: 'Unknown action'};
  }
}

function runQuantumSync() {
  // Run all active integrations
  const integrations = getActiveIntegrations();
  let totalImported = 0;

  integrations.forEach(integration => {
    if (integration.provider === 'Browse.ai') {
      const result = processBrowseAIIntegration(integration);
      totalImported += result.imported;
    }
  });

  // Run import sync
  quantumImportSync();

  return {success: true, message: `Sync complete. ${totalImported} new deals imported.`};
}

function runBatchAnalysis() {
  executeQuantumAIBatch();
  return {success: true, message: 'Batch analysis started'};
}

function checkAlerts() {
  const alerts = QuantumState.realTimeAlerts;
  return {success: true, message: `${alerts.length} active alerts`, count: alerts.length};
}

function quickExportHotDeals() {
  exportQuantumSMS();
  return {success: true, message: 'Opening export dialog...'};
}
