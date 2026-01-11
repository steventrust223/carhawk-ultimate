// ==========================================
// CARHAWK ULTIMATE - SHEET SETUP MODULE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Initialize and configure all sheets with headers, formatting, and structure
// ==========================================

/**
 * Main setup function - Creates all sheets and initializes system
 */
function setupCarHawkUltimate() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '🦅 CarHawk Ultimate Setup',
    'This will initialize the complete CarHawk Ultimate system.\n\n' +
    'All sheets will be created with proper headers and formatting.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    ui.alert('⏳ Setup in progress...', 'This may take 30-60 seconds. Please wait.', ui.ButtonSet.OK);

    createAllSheets();
    setupAllHeaders();
    applyAllFormatting();
    initializeConfigSheet();
    initializeLogsSheet();

    logSystem('SYSTEM_SETUP', 'CarHawk Ultimate initialized successfully');

    ui.alert(
      '✅ Setup Complete!',
      'CarHawk Ultimate is ready to use.\n\n' +
      'Next steps:\n' +
      '1. Configure API keys in the Config sheet\n' +
      '2. Import data from staging sheets\n' +
      '3. Run analysis\n\n' +
      'Use the CarHawk menu to access all features.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    logError('SETUP_ERROR', error.message);
    ui.alert('❌ Setup Error', 'An error occurred during setup:\n' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Create all sheets if they don't exist
 */
function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create sheets in order
  const sheetOrder = [
    'VERDICT',
    'MASTER',
    'SPEED_LEAD',
    'RENTAL',
    'SCORING',
    'CALCULATOR',
    'CRM',
    'STAGING_FB',
    'STAGING_CL',
    'STAGING_OU',
    'STAGING_EBAY',
    'CONFIG',
    'LOGS'
  ];

  for (let key of sheetOrder) {
    const sheetConfig = SHEETS[key];
    let sheet = ss.getSheetByName(sheetConfig.name);

    if (!sheet) {
      sheet = ss.insertSheet(sheetConfig.name);
    }

    // Set tab color
    if (sheetConfig.color) {
      sheet.setTabColor(sheetConfig.color);
    }

    // Freeze header row
    sheet.setFrozenRows(1);
  }

  logSystem('SHEETS_CREATED', 'All sheets created and configured');
}

/**
 * Setup all sheet headers
 */
function setupAllHeaders() {
  setupMasterHeaders();
  setupVerdictHeaders();
  setupSpeedLeadHeaders();
  setupRentalHeaders();
  setupScoringHeaders();
  setupCalculatorHeaders();
  setupCRMHeaders();
  setupStagingHeaders();
  setupConfigHeaders();
  setupLogsHeaders();

  logSystem('HEADERS_SETUP', 'All headers configured');
}

/**
 * Setup Master Database headers
 */
function setupMasterHeaders() {
  const sheet = getSheet(SHEETS.MASTER.name);

  const headers = [
    // Vehicle Identity
    MASTER_COLUMNS.LISTING_ID,
    MASTER_COLUMNS.YEAR,
    MASTER_COLUMNS.MAKE,
    MASTER_COLUMNS.MODEL,
    MASTER_COLUMNS.TRIM,
    MASTER_COLUMNS.BODY_TYPE,
    MASTER_COLUMNS.ENTHUSIAST_FLAG,

    // Pricing
    MASTER_COLUMNS.ASKING_PRICE,
    MASTER_COLUMNS.ESTIMATED_RESALE,
    MASTER_COLUMNS.MAO,
    MASTER_COLUMNS.OFFER_TARGET,
    MASTER_COLUMNS.PROFIT_DOLLAR,
    MASTER_COLUMNS.PROFIT_PERCENT,

    // Condition & Risk
    MASTER_COLUMNS.MILEAGE,
    MASTER_COLUMNS.CONDITION,
    MASTER_COLUMNS.AI_CONDITION,
    MASTER_COLUMNS.TITLE_STATUS,
    MASTER_COLUMNS.REPAIR_RISK_SCORE,
    MASTER_COLUMNS.ESTIMATED_REPAIR,
    MASTER_COLUMNS.HAZARD_FLAGS,

    // Market Intelligence
    MASTER_COLUMNS.PLATFORM,
    MASTER_COLUMNS.MARKET_DEMAND,
    MASTER_COLUMNS.SALES_VELOCITY,
    MASTER_COLUMNS.MARKET_ADVANTAGE,
    MASTER_COLUMNS.DAYS_TO_SELL,

    // Location
    MASTER_COLUMNS.SELLER_CITY,
    MASTER_COLUMNS.SELLER_ZIP,
    MASTER_COLUMNS.DISTANCE,
    MASTER_COLUMNS.LOCATION_RISK,

    // Speed-to-Lead
    MASTER_COLUMNS.FIRST_SEEN,
    MASTER_COLUMNS.TIME_SINCE_POSTED,
    MASTER_COLUMNS.LEAD_SPEED_SCORE,
    MASTER_COLUMNS.LEAD_COOLING_RISK,

    // Capital & Strategy
    MASTER_COLUMNS.CAPITAL_TIER,
    MASTER_COLUMNS.FLIP_STRATEGY,
    MASTER_COLUMNS.VERDICT,

    // Rental/Turo Analysis
    MASTER_COLUMNS.RENTAL_VIABLE,
    MASTER_COLUMNS.DAILY_RATE,
    MASTER_COLUMNS.MONTHLY_GROSS,
    MASTER_COLUMNS.MONTHLY_NET,
    MASTER_COLUMNS.BREAKEVEN_DAYS,
    MASTER_COLUMNS.RENTAL_RISK,

    // AI Output
    MASTER_COLUMNS.SELLER_MESSAGE,
    MASTER_COLUMNS.NEGOTIATION_ANGLE,
    MASTER_COLUMNS.AI_NOTES,

    // CRM
    MASTER_COLUMNS.LEAD_SYNCED,
    MASTER_COLUMNS.CRM_PLATFORM,
    MASTER_COLUMNS.CRM_DEAL_ID,
    MASTER_COLUMNS.CONTACTED_AT,

    // Metadata
    MASTER_COLUMNS.LISTING_URL,
    MASTER_COLUMNS.SELLER_NAME,
    MASTER_COLUMNS.SELLER_PHONE,
    MASTER_COLUMNS.SELLER_EMAIL,
    MASTER_COLUMNS.DESCRIPTION,
    MASTER_COLUMNS.IMAGES,
    MASTER_COLUMNS.CREATED_AT,
    MASTER_COLUMNS.UPDATED_AT
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Format header row
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.MASTER.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  // Set column widths
  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup Verdict sheet headers
 */
function setupVerdictHeaders() {
  const sheet = getSheet(SHEETS.VERDICT.name);

  const headers = [
    'Rank',
    'Verdict',
    'Year',
    'Make',
    'Model',
    'Asking Price',
    'Profit $',
    'Profit %',
    'Lead Speed',
    'Speed Status',
    'Distance',
    'Rental Viable',
    'Monthly Net',
    'Flip Strategy',
    'Offer Target',
    'Seller Message',
    'Listing URL',
    'Action'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.VERDICT.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup Speed-to-Lead Dashboard headers
 */
function setupSpeedLeadHeaders() {
  const sheet = getSheet(SHEETS.SPEED_LEAD.name);

  const headers = [
    'Status',
    'Time Posted',
    'Minutes Ago',
    'Vehicle',
    'Platform',
    'Asking Price',
    'Profit $',
    'Distance',
    'Lead Score',
    'Action Priority',
    'Listing URL'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.SPEED_LEAD.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup Rental Analysis sheet headers
 */
function setupRentalHeaders() {
  const sheet = getSheet(SHEETS.RENTAL.name);

  const headers = [
    'Rank',
    'Vehicle',
    'Asking Price',
    'Offer Target',
    'Estimated Daily Rate',
    'Monthly Gross (65% util)',
    'Monthly Net',
    'Annual Net',
    'Break-Even Months',
    'Rental Risk',
    'Body Type',
    'Condition',
    'Mileage',
    'Enthusiast Flag',
    'Verdict',
    'Notes'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.RENTAL.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup Lead Scoring sheet headers
 */
function setupScoringHeaders() {
  const sheet = getSheet(SHEETS.SCORING.name);

  const headers = [
    'Vehicle',
    'Final Lead Score',
    'Profit Score',
    'Speed Score',
    'Distance Score',
    'Market Score',
    'Condition Score',
    'Title Score',
    'Rental Bonus',
    'Risk Factors',
    'Opportunity Grade'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.SCORING.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup Calculator sheet headers
 */
function setupCalculatorHeaders() {
  const sheet = getSheet(SHEETS.CALCULATOR.name);

  const headers = [
    'Vehicle Description',
    'Asking Price',
    'Estimated Resale',
    'Flip Strategy',
    'Estimated Repairs',
    'Fixed Costs',
    'Total Costs',
    'MAO',
    'Your Offer',
    'Expected Profit',
    'Profit %',
    'ROI %',
    'Verdict'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.CALCULATOR.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup CRM Integration sheet headers
 */
function setupCRMHeaders() {
  const sheet = getSheet(SHEETS.CRM.name);

  const headers = [
    'Listing ID',
    'Vehicle',
    'Verdict',
    'Lead Synced?',
    'CRM Platform',
    'CRM Deal ID',
    'Seller Message Sent',
    'Response Received',
    'Follow-Up Status',
    'Last Contact',
    'Next Action',
    'Deal Stage'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.CRM.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidths(1, headers.length, 120);
}

/**
 * Setup staging sheet headers (all platforms use same structure)
 */
function setupStagingHeaders() {
  const stagingSheets = [
    'STAGING_FB',
    'STAGING_CL',
    'STAGING_OU',
    'STAGING_EBAY'
  ];

  for (let key of stagingSheets) {
    const sheet = getSheet(SHEETS[key].name);

    const headers = [
      'Import Timestamp',
      'Title',
      'Price',
      'Location',
      'Seller Name',
      'Posted Date',
      'Description',
      'URL',
      'Images',
      'Contact Info',
      'Processed?'
    ];

    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground(SHEETS[key].color)
      .setFontColor('#FFFFFF')
      .setFontWeight('bold')
      .setWrap(true)
      .setVerticalAlignment('middle');

    sheet.setColumnWidths(1, headers.length, 120);

    // Add note about read-only
    sheet.getRange('A2').setNote(
      '📥 STAGING AREA - READ ONLY\n\n' +
      'This sheet receives raw data from Browse AI.\n' +
      'Do not manually edit. Use "Import from Staging" to process data.'
    );
  }
}

/**
 * Setup Config sheet
 */
function setupConfigHeaders() {
  const sheet = getSheet(SHEETS.CONFIG.name);

  const headers = ['Setting', 'Value', 'Description'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.CONFIG.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 250);
  sheet.setColumnWidth(3, 300);
}

/**
 * Initialize Config sheet with default values
 */
function initializeConfigSheet() {
  const sheet = getSheet(SHEETS.CONFIG.name);

  // Only initialize if empty
  if (sheet.getLastRow() > 1) return;

  const configData = [
    ['OPENAI_API_KEY', '', 'OpenAI API key for AI analysis'],
    ['HOME_ZIP', SYSTEM.HOME_ZIP, 'Your home base ZIP code'],
    ['ALERT_EMAIL', getUserEmail(), 'Email for hot deal alerts'],
    ['SMSIT_API_KEY', '', 'SMS-iT CRM API key'],
    ['SMSIT_ENDPOINT', '', 'SMS-iT CRM API endpoint'],
    ['COMPANYHUB_API_KEY', '', 'CompanyHub API key'],
    ['COMPANYHUB_ENDPOINT', '', 'CompanyHub API endpoint'],
    ['AUTO_IMPORT_ENABLED', 'FALSE', 'Auto-import from staging sheets'],
    ['AUTO_ANALYSIS_ENABLED', 'FALSE', 'Auto-run AI analysis on import'],
    ['EMAIL_ALERTS_ENABLED', 'TRUE', 'Send email alerts for hot deals'],
    ['MIN_PROFIT_ALERT', '2000', 'Minimum profit $ to trigger alert'],
    ['SPEED_ALERT_THRESHOLD', '30', 'Alert if posted within X minutes'],
    ['RENTAL_UTILIZATION', '0.65', 'Assumed rental utilization rate (0-1)'],
    ['TURO_FEE_RATE', '0.15', 'Turo fee percentage (0.15 = 15%)']
  ];

  sheet.getRange(2, 1, configData.length, 3).setValues(configData);

  // Format value column
  sheet.getRange(2, 2, configData.length, 1).setBackground('#f3f3f3');
}

/**
 * Setup Logs sheet
 */
function setupLogsHeaders() {
  const sheet = getSheet(SHEETS.LOGS.name);

  const headers = ['Timestamp', 'Action', 'Details', 'User'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(SHEETS.LOGS.color)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');

  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 400);
  sheet.setColumnWidth(4, 200);
}

/**
 * Initialize Logs sheet
 */
function initializeLogsSheet() {
  const sheet = getSheet(SHEETS.LOGS.name);

  // Add first log entry
  const timestamp = new Date();
  const user = getUserEmail();

  sheet.appendRow([timestamp, 'SYSTEM_INIT', 'CarHawk Ultimate system initialized', user]);
}

/**
 * Apply all conditional formatting
 */
function applyAllFormatting() {
  applyMasterFormatting();
  applyVerdictFormatting();
  applySpeedLeadFormatting();

  logSystem('FORMATTING_APPLIED', 'Conditional formatting configured');
}

/**
 * Apply formatting to Master Database
 */
function applyMasterFormatting() {
  const sheet = getSheet(SHEETS.MASTER.name);

  // This will be enhanced by the Formatting.gs module
  // Basic formatting here
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(4); // Freeze ID, Year, Make, Model
}

/**
 * Apply formatting to Verdict sheet
 */
function applyVerdictFormatting() {
  const sheet = getSheet(SHEETS.VERDICT.name);

  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2); // Freeze Rank and Verdict
}

/**
 * Apply formatting to Speed-to-Lead Dashboard
 */
function applySpeedLeadFormatting() {
  const sheet = getSheet(SHEETS.SPEED_LEAD.name);

  sheet.setFrozenRows(1);
}

/**
 * Reset all sheets (CAUTION: Deletes all data)
 */
function resetAllSheets() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '⚠️ RESET ALL SHEETS',
    'This will DELETE ALL DATA and recreate sheets from scratch.\n\n' +
    'This action CANNOT be undone!\n\n' +
    'Are you absolutely sure?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  // Double confirm
  const confirm = ui.alert(
    '⚠️ FINAL CONFIRMATION',
    'Last chance to cancel. All data will be lost.\n\nProceed with reset?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) {
    return;
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetsToKeep = ['Sheet1']; // Keep at least one sheet

    // Delete all CarHawk sheets
    const allSheets = ss.getSheets();
    for (let sheet of allSheets) {
      if (!sheetsToKeep.includes(sheet.getName())) {
        ss.deleteSheet(sheet);
      }
    }

    // Recreate everything
    setupCarHawkUltimate();

    ui.alert('✅ Reset Complete', 'All sheets have been reset and reinitialized.', ui.ButtonSet.OK);

  } catch (error) {
    logError('RESET_ERROR', error.message);
    ui.alert('❌ Reset Error', 'An error occurred: ' + error.message, ui.ButtonSet.OK);
  }
}
