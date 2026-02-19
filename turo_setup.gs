// =========================================================
// CARHAWK ULTIMATE - TURO MODULE SETUP
// =========================================================
// Version: 1.0.0
// Purpose: Idempotent setup for all Turo Module sheets,
//          Master Database column extensions, and Settings injection.
// =========================================================

/**
 * Master setup function for the Turo Module.
 * Idempotent — safe to run multiple times without duplicating anything.
 * Creates all 5 Turo sheets, appends MD columns, and injects settings.
 */
function setupTuroModule() {
  const lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(30000)) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Setup already running. Please wait.', 'Turo Module', 5);
      return;
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const ui = SpreadsheetApp.getUi();

    logTuro_('Setup', 'INFO', 'Turo Module setup started');
    ss.toast('Setting up Turo Module...', 'Turo Module', 10);

    // 1. Create all 5 Turo sheets
    setupTuroEngineSheet_(ss);
    setupFleetManagerSheet_(ss);
    setupMaintenanceSheet_(ss);
    setupPricingSheet_(ss);
    setupInsuranceSheet_(ss);

    // 2. Append Master Database columns (BJ-BS)
    appendMasterDbColumns_(ss);

    // 3. Inject Turo settings into Settings sheet
    injectTuroSettings_(ss);

    logTuro_('Setup', 'INFO', 'Turo Module setup completed successfully');
    ss.toast('Turo Module setup complete! All 5 sheets created.', 'Turo Module', 5);

  } catch (e) {
    logTuro_('Setup', 'ERROR', 'Setup failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Setup failed: ' + e.message, 'Turo Module Error', 5);
  } finally {
    lock.releaseLock();
  }
}

// =========================================================
// SHEET CREATION HELPERS
// =========================================================

/**
 * Creates or verifies the Turo Engine sheet with exact headers.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function setupTuroEngineSheet_(ss) {
  const sheetName = TURO_SHEETS.ENGINE.name;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logTuro_('Setup', 'INFO', 'Created sheet: ' + sheetName);
  }

  // Write headers if row 1 is empty or mismatched
  const existing = sheet.getRange(1, 1, 1, TURO_ENGINE_HEADERS.length).getValues()[0];
  if (existing[0] !== TURO_ENGINE_HEADERS[0]) {
    sheet.getRange(1, 1, 1, TURO_ENGINE_HEADERS.length).setValues([TURO_ENGINE_HEADERS]);
  }

  // Format header row
  formatHeaderRow_(sheet, TURO_ENGINE_HEADERS.length, TURO_SHEETS.ENGINE.color);

  // Tab color
  sheet.setTabColor(TURO_SHEETS.ENGINE.color);

  // Freeze row 1, columns A-C
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);

  // Column widths
  sheet.setColumnWidth(1, 80);   // Row ID
  sheet.setColumnWidth(2, 140);  // VIN
  sheet.setColumnWidth(3, 200);  // Vehicle
  sheet.setColumnWidth(35, 300); // Rationale
  sheet.setColumnWidth(36, 250); // Exit Plan

  // Data validation: Override? checkbox
  if (sheet.getLastRow() >= 2) {
    const overrideRange = sheet.getRange(2, TE_COLS.OVERRIDE + 1, Math.max(1, sheet.getLastRow() - 1), 1);
    overrideRange.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireCheckbox().setAllowInvalid(false).build());
  }

  // Conditional formatting for Risk Tier column (AG = col 33)
  applyRiskTierFormatting_(sheet, TE_COLS.RISK_TIER + 1);

  // Conditional formatting for Turo Status column (AK = col 37)
  applyTuroStatusFormatting_(sheet, TE_COLS.TURO_STATUS + 1);
}

/**
 * Creates or verifies the Fleet Manager sheet with exact headers.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function setupFleetManagerSheet_(ss) {
  const sheetName = TURO_SHEETS.FLEET.name;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logTuro_('Setup', 'INFO', 'Created sheet: ' + sheetName);
  }

  const existing = sheet.getRange(1, 1, 1, FLEET_MANAGER_HEADERS.length).getValues()[0];
  if (existing[0] !== FLEET_MANAGER_HEADERS[0]) {
    sheet.getRange(1, 1, 1, FLEET_MANAGER_HEADERS.length).setValues([FLEET_MANAGER_HEADERS]);
  }

  formatHeaderRow_(sheet, FLEET_MANAGER_HEADERS.length, TURO_SHEETS.FLEET.color);
  sheet.setTabColor(TURO_SHEETS.FLEET.color);
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(3);

  sheet.setColumnWidth(1, 80);   // Fleet ID
  sheet.setColumnWidth(2, 140);  // VIN
  sheet.setColumnWidth(3, 200);  // Vehicle

  // Data validation: Turo Status dropdown (col E = 5)
  applyStatusDropdown_(sheet, 5);

  // Conditional formatting for On Track? column (Y = col 25)
  applyOnTrackFormatting_(sheet, 25);
}

/**
 * Creates or verifies the Maintenance & Turnovers sheet.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function setupMaintenanceSheet_(ss) {
  const sheetName = TURO_SHEETS.MAINTENANCE.name;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logTuro_('Setup', 'INFO', 'Created sheet: ' + sheetName);
  }

  // Summary rows 1-5 (header at row 1, summary formulas at rows 2-5, blank row 6, data from row 7)
  const existing = sheet.getRange(1, 1, 1, MAINTENANCE_HEADERS.length).getValues()[0];
  if (existing[0] !== MAINTENANCE_HEADERS[0]) {
    sheet.getRange(1, 1, 1, MAINTENANCE_HEADERS.length).setValues([MAINTENANCE_HEADERS]);
  }

  // Summary labels at rows 2-5
  const summaryLabels = [
    ['Total Spend', '', '', '', '', '', '=SUMIF(G7:G,">0")', '', '', '', '', '', '', ''],
    ['Total Downtime', '', '', '', '', '', '', '', '', '=SUMIF(J7:J,">0")', '', '', '', ''],
    ['Avg Cost', '', '', '', '', '', '=IF(COUNTA(G7:G)>0,AVERAGE(G7:G),0)', '', '', '', '', '', '', ''],
    ['Avg Downtime', '', '', '', '', '', '', '', '', '=IF(COUNTA(J7:J)>0,AVERAGE(J7:J),0)', '', '', '', '']
  ];

  const row2Val = sheet.getRange(2, 1).getValue();
  if (row2Val !== 'Total Spend') {
    sheet.getRange(2, 1, 4, MAINTENANCE_HEADERS.length).setValues(summaryLabels);
    // Bold the summary labels
    sheet.getRange(2, 1, 4, 1).setFontWeight('bold');
  }

  formatHeaderRow_(sheet, MAINTENANCE_HEADERS.length, TURO_SHEETS.MAINTENANCE.color);
  sheet.setTabColor(TURO_SHEETS.MAINTENANCE.color);
  sheet.setFrozenRows(1);

  // Data validation: Type dropdown (col E = 5) from row 7 onwards
  if (sheet.getLastRow() >= 7) {
    const typeRange = sheet.getRange(7, 5, Math.max(1, sheet.getLastRow() - 6), 1);
    typeRange.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(MAINTENANCE_TYPES, true).setAllowInvalid(false).build());
  }
}

/**
 * Creates or verifies the Turo Pricing & Seasonality sheet with default data.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function setupPricingSheet_(ss) {
  const sheetName = TURO_SHEETS.PRICING.name;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logTuro_('Setup', 'INFO', 'Created sheet: ' + sheetName);
  }

  sheet.setTabColor(TURO_SHEETS.PRICING.color);

  // Check if already populated
  const existingVal = sheet.getRange(1, 1).getValue();
  if (existingVal === 'Base Rates by Vehicle Class') {
    return; // Already populated
  }

  // Section A: Base rates (rows 1-10)
  const classes = Object.keys(TURO_PRICING_DEFAULTS);
  const sectionA = [
    ['Base Rates by Vehicle Class', ...classes],
    ['Daily Rate ($)', ...classes.map(c => TURO_PRICING_DEFAULTS[c].dailyRate)],
    ['Utilization %', ...classes.map(c => TURO_PRICING_DEFAULTS[c].utilization)],
    ['Avg Trip Length (days)', ...classes.map(c => TURO_PRICING_DEFAULTS[c].tripLength)],
    ['Insurance Monthly ($)', ...classes.map(c => TURO_PRICING_DEFAULTS[c].insurance)],
    ['Annual Registration ($)', ...classes.map(c => TURO_PRICING_DEFAULTS[c].registration)],
    ['Cleaning Per Trip ($)', ...classes.map(c => TURO_PRICING_DEFAULTS[c].cleaning)],
    ['Maintenance Reserve %', ...classes.map(c => TURO_PRICING_DEFAULTS[c].maintenanceReserve)],
    ['Flip Timeline (days)', ...classes.map(c => TURO_PRICING_DEFAULTS[c].flipTimeline)],
    [''] // blank row
  ];

  sheet.getRange(1, 1, sectionA.length, classes.length + 1).setValues(sectionA);

  // Section B: Seasonal multipliers (rows 12-14)
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const sectionB = [
    ['Seasonal Multipliers', ...monthNames],
    ['Rate Multiplier', ...SEASONAL_RATE_MULTIPLIERS],
    ['Utilization Multiplier', ...SEASONAL_UTIL_MULTIPLIERS]
  ];

  sheet.getRange(11, 1, sectionB.length, monthNames.length + 1).setValues(sectionB);

  // Format section headers
  sheet.getRange(1, 1, 1, classes.length + 1).setBackground(TURO_SHEETS.PRICING.color)
    .setFontColor('#FFFFFF').setFontWeight('bold');
  sheet.getRange(11, 1, 1, monthNames.length + 1).setBackground(TURO_SHEETS.PRICING.color)
    .setFontColor('#FFFFFF').setFontWeight('bold');

  // Format row labels bold
  sheet.getRange(2, 1, 8, 1).setFontWeight('bold');
  sheet.getRange(12, 1, 2, 1).setFontWeight('bold');

  // Number formats
  sheet.getRange(2, 2, 1, classes.length).setNumberFormat('$#,##0');
  sheet.getRange(3, 2, 1, classes.length).setNumberFormat('0.0%');
  sheet.getRange(5, 2, 1, classes.length).setNumberFormat('$#,##0');
  sheet.getRange(6, 2, 1, classes.length).setNumberFormat('$#,##0');
  sheet.getRange(7, 2, 1, classes.length).setNumberFormat('$#,##0');
  sheet.getRange(8, 2, 1, classes.length).setNumberFormat('0.0%');

  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 220);
}

/**
 * Creates or verifies the Insurance & Compliance sheet.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function setupInsuranceSheet_(ss) {
  const sheetName = TURO_SHEETS.INSURANCE.name;
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logTuro_('Setup', 'INFO', 'Created sheet: ' + sheetName);
  }

  const existing = sheet.getRange(1, 1, 1, INSURANCE_HEADERS.length).getValues()[0];
  if (existing[0] !== INSURANCE_HEADERS[0]) {
    sheet.getRange(1, 1, 1, INSURANCE_HEADERS.length).setValues([INSURANCE_HEADERS]);
  }

  formatHeaderRow_(sheet, INSURANCE_HEADERS.length, TURO_SHEETS.INSURANCE.color);
  sheet.setTabColor(TURO_SHEETS.INSURANCE.color);
  sheet.setFrozenRows(1);

  sheet.setColumnWidth(1, 80);  // Fleet ID
  sheet.setColumnWidth(2, 200); // Vehicle

  // Data validation: Insurance Type dropdown (col J = 10)
  applyDropdownValidation_(sheet, 10, INSURANCE_TYPES, 2);

  // Data validation: Inspection Status dropdown (col L = 12)
  applyDropdownValidation_(sheet, 12, INSPECTION_STATUSES, 2);

  // Data validation: Title Status dropdown (col P = 16)
  applyDropdownValidation_(sheet, 16, TITLE_STATUSES, 2);
}

// =========================================================
// MASTER DATABASE COLUMN EXTENSION
// =========================================================

/**
 * Appends 10 Turo columns to Master Database (BJ-BS).
 * Idempotent — checks if headers already exist.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function appendMasterDbColumns_(ss) {
  const dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
  if (!dbSheet) {
    logTuro_('Setup', 'WARN', 'Master Database sheet not found — skipping column append');
    return;
  }

  const headerRow = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];

  // Check if Turo headers already exist
  if (headerRow.indexOf(TURO_DB_HEADERS[0]) !== -1) {
    logTuro_('Setup', 'INFO', 'Turo columns already exist in Master Database');
    return;
  }

  // Append after existing columns
  const startCol = dbSheet.getLastColumn() + 1;
  dbSheet.getRange(1, startCol, 1, TURO_DB_HEADERS.length).setValues([TURO_DB_HEADERS]);

  // Format new headers
  const headerRange = dbSheet.getRange(1, startCol, 1, TURO_DB_HEADERS.length);
  headerRange.setBackground('#00BCD4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true);

  // Number formats for data rows (apply to 500 rows as buffer)
  const maxRows = Math.max(dbSheet.getLastRow(), 2);
  const dataRows = maxRows - 1;
  if (dataRows > 0) {
    // Turo Hold Score (integer)
    dbSheet.getRange(2, startCol, dataRows, 1).setNumberFormat('#,##0');
    // Turo Monthly Net (currency)
    dbSheet.getRange(2, startCol + 1, dataRows, 1).setNumberFormat('$#,##0.00');
    // Payback Months (decimal)
    dbSheet.getRange(2, startCol + 2, dataRows, 1).setNumberFormat('#,##0.0');
    // Break-Even Util % (percentage)
    dbSheet.getRange(2, startCol + 3, dataRows, 1).setNumberFormat('0.0%');
    // Risk Tier (text - no format needed)
    // Turo vs Flip Delta (currency)
    dbSheet.getRange(2, startCol + 5, dataRows, 1).setNumberFormat('$#,##0.00');
  }

  logTuro_('Setup', 'INFO', 'Appended ' + TURO_DB_HEADERS.length + ' Turo columns to Master Database at column ' + startCol);
}

// =========================================================
// SETTINGS INJECTION
// =========================================================

/**
 * Injects Turo settings rows into the Settings sheet.
 * Idempotent — checks if Turo section header already exists.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @private
 */
function injectTuroSettings_(ss) {
  const settingsSheet = ss.getSheetByName(QUANTUM_SHEETS.SETTINGS.name);
  if (!settingsSheet) {
    logTuro_('Setup', 'WARN', 'Settings sheet not found — skipping settings injection');
    return;
  }

  const data = settingsSheet.getDataRange().getValues();
  const sectionHeader = '\u2550\u2550\u2550 TURO MODULE SETTINGS \u2550\u2550\u2550';

  // Check if Turo section already exists
  for (var i = 0; i < data.length; i++) {
    if (String(data[i][0]).indexOf('TURO MODULE SETTINGS') !== -1) {
      logTuro_('Setup', 'INFO', 'Turo settings section already exists in Settings sheet');
      return;
    }
  }

  // Determine the column structure of the Settings sheet
  const numCols = settingsSheet.getLastColumn() || 3;
  const startRow = settingsSheet.getLastRow() + 2; // Leave blank row before section

  // Write section header
  settingsSheet.getRange(startRow, 1).setValue(sectionHeader);
  settingsSheet.getRange(startRow, 1, 1, Math.min(numCols, 3))
    .setBackground('#00BCD4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');

  // Write settings rows
  for (var j = 0; j < TURO_SETTINGS_DEFAULTS.length; j++) {
    var setting = TURO_SETTINGS_DEFAULTS[j];
    var row = startRow + 1 + j;
    settingsSheet.getRange(row, 1).setValue(setting.key);
    settingsSheet.getRange(row, 2).setValue(setting.value);
    if (numCols >= 3) {
      settingsSheet.getRange(row, 3).setValue(new Date());
    }
    if (numCols >= 4) {
      settingsSheet.getRange(row, 4).setValue(setting.description);
    }
    if (numCols >= 5) {
      settingsSheet.getRange(row, 5).setValue(setting.category);
    }
    if (numCols >= 6) {
      settingsSheet.getRange(row, 6).setValue(setting.type);
    }
    if (numCols >= 8) {
      settingsSheet.getRange(row, 8).setValue(setting.defaultVal);
    }
  }

  logTuro_('Setup', 'INFO', 'Injected ' + TURO_SETTINGS_DEFAULTS.length + ' Turo settings rows');
}

// =========================================================
// FORMATTING HELPERS
// =========================================================

/**
 * Formats header row with background color, white text, bold, and wrap.
 * @param {SpreadsheetApp.Sheet} sheet - Target sheet.
 * @param {number} numCols - Number of columns.
 * @param {string} bgColor - Hex background color.
 * @private
 */
function formatHeaderRow_(sheet, numCols, bgColor) {
  sheet.getRange(1, 1, 1, numCols)
    .setBackground(bgColor)
    .setFontColor('#FFFFFF')
    .setFontWeight('bold')
    .setWrap(true)
    .setVerticalAlignment('middle');
  sheet.setRowHeight(1, 40);
}

/**
 * Applies Risk Tier conditional formatting to a column.
 * @param {SpreadsheetApp.Sheet} sheet - Target sheet.
 * @param {number} col - 1-based column number.
 * @private
 */
function applyRiskTierFormatting_(sheet, col) {
  var rules = sheet.getConditionalFormatRules();
  var colLetter = columnToLetter_(col);
  var range = sheet.getRange(colLetter + '2:' + colLetter + '1000');

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Low').setBackground('#C8E6C9').setFontColor('#1B5E20')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Medium').setBackground('#FFF9C4').setFontColor('#F57F17')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('High').setBackground('#FFCCBC').setFontColor('#BF360C')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Critical').setBackground('#F44336').setFontColor('#FFFFFF')
    .setRanges([range]).build());

  sheet.setConditionalFormatRules(rules);
}

/**
 * Applies Turo Status conditional formatting to a column.
 * @param {SpreadsheetApp.Sheet} sheet - Target sheet.
 * @param {number} col - 1-based column number.
 * @private
 */
function applyTuroStatusFormatting_(sheet, col) {
  var rules = sheet.getConditionalFormatRules();
  var colLetter = columnToLetter_(col);
  var range = sheet.getRange(colLetter + '2:' + colLetter + '1000');

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Active').setBackground('#C8E6C9').setFontColor('#1B5E20')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Paused').setBackground('#FFF9C4').setFontColor('#F57F17')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('In Maintenance').setBackground('#FFCCBC').setFontColor('#BF360C')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Retired').setBackground('#E0E0E0').setFontColor('#616161')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Sold').setBackground('#BDBDBD').setFontColor('#424242')
    .setRanges([range]).build());

  sheet.setConditionalFormatRules(rules);
}

/**
 * Applies On Track? conditional formatting to a column.
 * @param {SpreadsheetApp.Sheet} sheet - Target sheet.
 * @param {number} col - 1-based column number.
 * @private
 */
function applyOnTrackFormatting_(sheet, col) {
  var rules = sheet.getConditionalFormatRules();
  var colLetter = columnToLetter_(col);
  var range = sheet.getRange(colLetter + '2:' + colLetter + '1000');

  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Ahead').setBackground('#C8E6C9').setFontColor('#1B5E20')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('On Track').setBackground('#FFF9C4').setFontColor('#F57F17')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Behind').setBackground('#FFCCBC').setFontColor('#BF360C')
    .setRanges([range]).build());
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenTextContains('Underwater').setBackground('#F44336').setFontColor('#FFFFFF')
    .setRanges([range]).build());

  sheet.setConditionalFormatRules(rules);
}

/**
 * Applies Turo Status dropdown validation to a column.
 * @param {SpreadsheetApp.Sheet} sheet - Target sheet.
 * @param {number} col - 1-based column number.
 * @private
 */
function applyStatusDropdown_(sheet, col) {
  var statuses = Object.values(TURO_STATUSES);
  var lastRow = Math.max(sheet.getLastRow(), 2);
  if (lastRow >= 2) {
    var range = sheet.getRange(2, col, lastRow - 1, 1);
    range.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(statuses, true).setAllowInvalid(false).build());
  }
}

/**
 * Applies a dropdown data validation list to a column starting at a given row.
 * @param {SpreadsheetApp.Sheet} sheet - Target sheet.
 * @param {number} col - 1-based column number.
 * @param {string[]} values - Dropdown values.
 * @param {number} startRow - Row to start validation from.
 * @private
 */
function applyDropdownValidation_(sheet, col, values, startRow) {
  var lastRow = Math.max(sheet.getLastRow(), startRow);
  if (lastRow >= startRow) {
    var range = sheet.getRange(startRow, col, lastRow - startRow + 1, 1);
    range.setDataValidation(SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true).setAllowInvalid(false).build());
  }
}

/**
 * Converts a 1-based column number to a letter (e.g. 1 -> A, 27 -> AA).
 * @param {number} col - 1-based column number.
 * @returns {string} Column letter(s).
 * @private
 */
function columnToLetter_(col) {
  var letter = '';
  while (col > 0) {
    var mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

// =========================================================
// LOGGING HELPER
// =========================================================

/**
 * Logs a Turo module event to the Activity Logs sheet.
 * @param {string} action - Action description.
 * @param {string} level - Log level (INFO, WARN, ERROR).
 * @param {string} details - Detail message.
 * @private
 */
function logTuro_(action, level, details) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUANTUM_SHEETS.LOGS.name);
    if (sheet) {
      sheet.appendRow([
        new Date(),
        level,
        'Turo: ' + action,
        'TURO_MODULE',
        details,
        Session.getActiveUser().getEmail(),
        '', // Deal ID
        '', // Duration
        level !== 'ERROR', // Success
        level === 'ERROR' ? details : '',
        '' // Stack trace
      ]);
    }
  } catch (e) {
    // Silently fail — logging should never break the main flow
  }
}
