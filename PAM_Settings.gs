// =========================================================
// FILE: PAM_Settings.gs — PAM Settings Management
// Project Arbitrage Module — Quantum Workbook Ecosystem
// =========================================================

const PAM_SETTINGS_DEFAULTS = {
  PAM_SourceSheet:    'Master DB',
  PAM_KeywordWeight:  40,
  PAM_CategoryWeight: 20,
  PAM_PriceWeight:    20,
  PAM_BrandWeight:    10,
  PAM_DistanceWeight: 5,
  PAM_ConditionWeight:5,
  PAM_AIThreshold:    60,
  PAM_AIModel:        'gpt-4o-mini',
  PAM_MaxAIPerRun:    20,
  PAM_DistanceRadius: 30,
  PAM_APIKeyCell:     'Settings!B2'
};

function getPAMSettingsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PAM_Settings');
  if (!sheet) {
    sheet = ss.insertSheet('PAM_Settings');
    // Build header row
    sheet.getRange(1,1,1,3).setValues([['Setting','Value','Notes']]);
    sheet.getRange(1,1,1,3)
      .setFontWeight('bold')
      .setBackground('#141418')
      .setFontColor('#C9A84C');
    sheet.setFrozenRows(1);
    // Write defaults
    const rows = [
      ['PAM_SourceSheet',    'Master DB',   'Sheet name to scan for scraped listings'],
      ['PAM_KeywordWeight',  40,            'Keyword match scoring weight'],
      ['PAM_CategoryWeight', 20,            'Category match scoring weight'],
      ['PAM_PriceWeight',    20,            'Price vs target scoring weight'],
      ['PAM_BrandWeight',    10,            'Brand/model match bonus weight'],
      ['PAM_DistanceWeight', 5,             'Distance scoring weight'],
      ['PAM_ConditionWeight',5,             'Condition clue scoring weight'],
      ['PAM_AIThreshold',    60,            'Minimum score to trigger AI evaluation'],
      ['PAM_AIModel',        'gpt-4o-mini', 'OpenAI model for evaluations'],
      ['PAM_MaxAIPerRun',    20,            'Max AI calls per run'],
      ['PAM_DistanceRadius', 30,            'Max distance in miles'],
      ['PAM_APIKeyCell',     'Settings!B2', 'Cell reference for OpenAI API key']
    ];
    sheet.getRange(2,1,rows.length,3).setValues(rows);
    sheet.autoResizeColumns(1,3);
  }
  return sheet;
}

function getPAMSettings() {
  try {
    const sheet = getPAMSettingsSheet_();
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
    const settings = Object.assign({}, PAM_SETTINGS_DEFAULTS);
    data.forEach(([key, value]) => {
      if (key && key.toString().startsWith('PAM_')) {
        settings[key] = value;
      }
    });
    return { success: true, settings };
  } catch (e) {
    return { success: false, error: e.toString(), settings: Object.assign({}, PAM_SETTINGS_DEFAULTS) };
  }
}

function savePAMSettings(data) {
  try {
    const sheet = getPAMSettingsSheet_();
    const existingData = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 2).getValues();
    const keyToRow = {};
    existingData.forEach(([key], i) => { if (key) keyToRow[key] = i + 2; });

    Object.entries(data).forEach(([key, value]) => {
      if (!key.startsWith('PAM_')) return;
      if (keyToRow[key]) {
        sheet.getRange(keyToRow[key], 2).setValue(value);
      } else {
        const newRow = sheet.getLastRow() + 1;
        sheet.getRange(newRow, 1, 1, 2).setValues([[key, value]]);
      }
    });
    return { success: true, message: 'Settings saved.' };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function getPAMSetting_(key) {
  const result = getPAMSettings();
  const val = result.settings[key];
  return (val !== undefined && val !== '') ? val : PAM_SETTINGS_DEFAULTS[key];
}

function getOpenAIKey_() {
  try {
    const cellRef = getPAMSetting_('PAM_APIKeyCell') || 'Settings!B2';
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const [sheetName, cellAddr] = cellRef.split('!');
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) throw new Error('Settings sheet not found: ' + sheetName);
    return sheet.getRange(cellAddr).getValue().toString().trim();
  } catch (e) {
    throw new Error('Could not read OpenAI API key: ' + e.toString());
  }
}

function initPAMSettings() {
  getPAMSettingsSheet_(); // idempotent — creates only if missing
}
