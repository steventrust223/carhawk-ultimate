// ============================================================================
// CARHAWK ULTIMATE — TRIGGERS.GS
// Trigger Management with LockService Protection
// ============================================================================

/**
 * onOpen trigger - creates custom menu
 */
function onOpen() {
  createCarHawkMenu();
}

/**
 * Create the CarHawk menu
 */
function createCarHawkMenu() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🚗 CarHawk Ultimate')
    // Data Management
    .addSubMenu(ui.createMenu('📊 Data Management')
      .addItem('📥 Import from Staging', 'importFromStaging')
      .addItem('🔗 Import from Browse.AI', 'importFromBrowseAI')
      .addItem('➕ Add Deal Manually', 'showAddDealSidebar')
      .addSeparator()
      .addItem('🔄 Sync All Sources', 'syncAllSources')
      .addItem('🧹 Clean Duplicates', 'cleanDuplicates')
      .addItem('📤 Export to CSV', 'exportToCSV'))

    // Analysis Tools
    .addSubMenu(ui.createMenu('🧠 Analysis Tools')
      .addItem('🎯 Analyze Selected Deal', 'analyzeSelectedDeal')
      .addItem('📊 Recalculate All Deals', 'recalculateAllDeals')
      .addSeparator()
      .addItem('🔥 Find Hot Deals', 'findHotDeals')
      .addItem('📈 Update All Scores', 'updateAllScores'))

    // CRM Integration
    .addSubMenu(ui.createMenu('🤝 CRM Integration')
      .addItem('📱 Export Hot Leads to CRM', 'exportHotLeadsToCRM')
      .addItem('📧 Generate Email Campaign', 'generateEmailCampaign')
      .addSeparator()
      .addItem('🔄 Sync CRM Status', 'syncCRMStatus')
      .addItem('📋 View CRM Sync Log', 'showCRMSyncLog'))

    // Reports
    .addSubMenu(ui.createMenu('📊 Reports')
      .addItem('📈 Generate Dashboard', 'generateDashboard')
      .addItem('📑 Weekly Report', 'generateWeeklyReport')
      .addItem('📊 Monthly Analysis', 'generateMonthlyAnalysis'))

    // System
    .addSubMenu(ui.createMenu('⚙️ System')
      .addItem('🔧 System Settings', 'showSystemSettings')
      .addItem('📋 View System Logs', 'showSystemLogs')
      .addItem('🏥 System Health Check', 'runSystemHealthCheck')
      .addSeparator()
      .addItem('🧪 Run Smoke Tests', 'runCarHawkSmokeTest')
      .addItem('🔍 Run Schema Audit', 'runSchemaAudit')
      .addSeparator()
      .addItem('⏰ Setup Triggers', 'setupTriggers')
      .addItem('🗑️ Remove Triggers', 'removeTriggers'))

    .addSeparator()
    .addItem('❓ Help', 'showHelp')
    .addItem('ℹ️ About CarHawk', 'showAbout')
    .addToUi();
}

// ============================================================================
// TRIGGER SETUP
// ============================================================================

/**
 * Setup automated triggers
 */
function setupTriggers() {
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    'Setup Automated Triggers',
    'This will create the following triggers:\n\n' +
    '• Hourly: Check for new imports\n' +
    '• Daily: Generate dashboard\n' +
    '• Weekly: Generate report\n\n' +
    'Existing triggers will be removed first. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  try {
    // Remove existing triggers first
    removeAllTriggers();

    const ss = SpreadsheetApp.getActive();

    // Hourly import check
    ScriptApp.newTrigger('scheduledImportCheck')
      .timeBased()
      .everyHours(1)
      .create();

    // Daily dashboard
    ScriptApp.newTrigger('scheduledDashboard')
      .timeBased()
      .atHour(6)
      .everyDays(1)
      .create();

    // Weekly report (Monday at 8 AM)
    ScriptApp.newTrigger('scheduledWeeklyReport')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(8)
      .create();

    // onEdit trigger for real-time updates
    ScriptApp.newTrigger('onEditHandler')
      .forSpreadsheet(ss)
      .onEdit()
      .create();

    ui.alert('Triggers Created', 'All automated triggers have been set up successfully.', ui.ButtonSet.OK);
    logSystem('Triggers', 'Setup completed');

  } catch (error) {
    ui.alert('Error', `Failed to create triggers: ${error.toString()}`, ui.ButtonSet.OK);
    logSystem('Trigger Error', error.toString());
  }
}

/**
 * Remove all project triggers
 */
function removeTriggers() {
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    'Remove Triggers',
    'Remove all automated triggers?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  removeAllTriggers();
  ui.alert('Triggers Removed', 'All triggers have been removed.', ui.ButtonSet.OK);
  logSystem('Triggers', 'All triggers removed');
}

/**
 * Remove all triggers (internal)
 */
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    ScriptApp.deleteTrigger(trigger);
  }
}

// ============================================================================
// SCHEDULED FUNCTIONS
// ============================================================================

/**
 * Hourly import check (triggered)
 */
function scheduledImportCheck() {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(5000)) {
    logSystem('Scheduled Import', 'Skipped - lock unavailable');
    return;
  }

  try {
    let totalImported = 0;

    // Check each staging sheet for new data
    const platforms = [
      { sheet: SHEETS.STAGING_FB, name: 'Facebook' },
      { sheet: SHEETS.STAGING_CL, name: 'Craigslist' },
      { sheet: SHEETS.STAGING_OU, name: 'OfferUp' },
      { sheet: SHEETS.STAGING_EBAY, name: 'eBay' }
    ];

    for (const platform of platforms) {
      const imported = importFromPlatform(platform.sheet, platform.name);
      totalImported += imported;
    }

    if (totalImported > 0) {
      logSystem('Scheduled Import', `Imported ${totalImported} new leads`);
    }

  } catch (error) {
    logSystem('Scheduled Import Error', error.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Daily dashboard generation (triggered)
 */
function scheduledDashboard() {
  try {
    generateDashboard();
    logSystem('Scheduled Dashboard', 'Dashboard generated');
  } catch (error) {
    logSystem('Scheduled Dashboard Error', error.toString());
  }
}

/**
 * Weekly report generation (triggered)
 */
function scheduledWeeklyReport() {
  try {
    generateWeeklyReport();
    logSystem('Scheduled Report', 'Weekly report generated');
  } catch (error) {
    logSystem('Scheduled Report Error', error.toString());
  }
}

// ============================================================================
// ONEDIT HANDLER
// ============================================================================

/**
 * Handle cell edits for real-time updates
 */
function onEditHandler(e) {
  if (!e || !e.range) return;

  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();

  // Only handle Master Database edits
  if (sheetName !== SHEETS.MASTER) return;

  const row = e.range.getRow();
  const col = e.range.getColumn();

  // Skip header row
  if (row < 2) return;

  // Columns that trigger recalculation
  const triggerColumns = [
    7,   // Year
    8,   // Make
    9,   // Model
    12,  // Mileage
    13,  // Condition
    14,  // Title Status
    16,  // ZIP
    19   // Asking Price
  ];

  if (triggerColumns.includes(col)) {
    // Debounce with cache
    const cacheKey = `edit:${row}`;
    const cache = CacheService.getScriptCache();

    if (cache.get(cacheKey)) {
      // Already scheduled
      return;
    }

    cache.put(cacheKey, 'pending', 5);

    // Schedule recalculation
    try {
      recalculateSingleRow(sheet, row);
    } catch (error) {
      logSystem('onEdit Error', `Row ${row}: ${error.toString()}`);
    }
  }
}

/**
 * Recalculate single row after edit
 */
function recalculateSingleRow(sheet, rowNum) {
  const row = sheet.getRange(rowNum, 1, 1, 38).getValues()[0];
  const dealData = normalizeFromRow(row);
  const analysis = analyzeDeal(dealData);
  updateSheetWithAnalysis(sheet, rowNum, analysis);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sync all data sources
 */
function syncAllSources() {
  const ui = SpreadsheetApp.getUi();

  const confirm = ui.alert(
    'Sync All Sources',
    'This will import from all staging sheets and recalculate scores. Continue?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  try {
    // Import from staging
    importFromStaging();

    ui.alert('Sync Complete', 'All sources have been synchronized.', ui.ButtonSet.OK);

  } catch (error) {
    ui.alert('Sync Error', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Update all scores (menu function)
 */
function updateAllScores() {
  recalculateAllDeals();
}

/**
 * Find hot deals
 */
function findHotDeals() {
  const sheet = getSheet(SHEETS.MASTER);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Master Database not found.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const hotDeals = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === 'Hot') {
      hotDeals.push({
        row: i + 1,
        id: data[i][0],
        vehicle: `${data[i][6]} ${data[i][7]} ${data[i][8]}`,
        score: data[i][25],
        verdict: data[i][26],
        mao: data[i][19]
      });
    }
  }

  if (hotDeals.length === 0) {
    SpreadsheetApp.getUi().alert('No hot deals found.');
    return;
  }

  // Sort by score
  hotDeals.sort((a, b) => (b.score || 0) - (a.score || 0));

  // Build message
  let message = `Found ${hotDeals.length} Hot Deals:\n\n`;
  for (const deal of hotDeals.slice(0, 10)) {
    message += `• Row ${deal.row}: ${deal.vehicle} (Score: ${deal.score})\n`;
  }

  SpreadsheetApp.getUi().alert('Hot Deals', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

/**
 * Clean duplicate entries
 */
function cleanDuplicates() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet(SHEETS.MASTER);

  if (!sheet) {
    ui.alert('Master Database not found.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const seen = new Set();
  const duplicateRows = [];

  for (let i = 1; i < data.length; i++) {
    // Create key from vehicle details
    const key = `${data[i][6]}|${data[i][7]}|${data[i][8]}|${data[i][18]}|${data[i][15]}`;

    if (seen.has(key)) {
      duplicateRows.push(i + 1);
    } else {
      seen.add(key);
    }
  }

  if (duplicateRows.length === 0) {
    ui.alert('No duplicates found.');
    return;
  }

  const confirm = ui.alert(
    'Duplicates Found',
    `Found ${duplicateRows.length} duplicate rows. Delete them?`,
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  // Delete from bottom to top to preserve row numbers
  duplicateRows.reverse();
  for (const row of duplicateRows) {
    sheet.deleteRow(row);
  }

  ui.alert('Cleanup Complete', `Deleted ${duplicateRows.length} duplicate rows.`, ui.ButtonSet.OK);
  logSystem('Cleanup', `Removed ${duplicateRows.length} duplicates`);
}

/**
 * Export to CSV
 */
function exportToCSV() {
  const sheet = getSheet(SHEETS.MASTER);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('Master Database not found.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const csvContent = data.map(row =>
    row.map(cell => {
      const str = String(cell);
      return str.includes(',') ? `"${str}"` : str;
    }).join(',')
  ).join('\n');

  // Create and download file
  const blob = Utilities.newBlob(csvContent, 'text/csv', 'carhawk-export.csv');
  const file = DriveApp.createFile(blob);

  SpreadsheetApp.getUi().alert(
    'Export Complete',
    `CSV file created: ${file.getUrl()}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  logSystem('Export', 'CSV exported to Drive');
}
