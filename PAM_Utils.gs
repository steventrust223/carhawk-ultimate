// =========================================================
// FILE: PAM_Utils.gs — Shared Utilities for PAM
// Project Arbitrage Module — Quantum Workbook Ecosystem
// =========================================================

// ── ID Generation ─────────────────────────────────────────

function pamNextId_(sheet, prefix, col) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return prefix + '001';
  const ids = sheet.getRange(2, col, lastRow - 1, 1).getValues()
    .flat().filter(v => v && v.toString().startsWith(prefix));
  if (!ids.length) return prefix + '001';
  const nums = ids.map(id => parseInt(id.toString().replace(prefix, ''), 10) || 0);
  return prefix + String(Math.max(...nums) + 1).padStart(3, '0');
}

function pamNextProjectId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Projects');
  return sheet ? pamNextId_(sheet, 'P', 1) : 'P001';
}

function pamNextNeedId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Needs');
  return sheet ? pamNextId_(sheet, 'N', 1) : 'N001';
}

function pamNextMatchId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Matches');
  return sheet ? pamNextId_(sheet, 'M', 1) : 'M001';
}

function pamNextPurchaseId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Purchases');
  return sheet ? pamNextId_(sheet, 'PUR', 1) : 'PUR001';
}

// ── Deduplication ─────────────────────────────────────────

function pamMatchExists_(scrapedRowId, needId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('PAM_Matches');
  if (!sheet || sheet.getLastRow() < 2) return false;
  const data = sheet.getRange(2, 2, sheet.getLastRow() - 1, 4).getValues();
  // col B = Scraped Row ID (index 0), col E = Need ID (index 3)
  return data.some(row => row[0] == scrapedRowId && row[3] == needId);
}

// ── Number / String Formatting ────────────────────────────

function pamFormatCurrency_(val) {
  const n = parseFloat(val) || 0;
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pamFormatDate_(val) {
  if (!val) return '';
  const d = (val instanceof Date) ? val : new Date(val);
  if (isNaN(d.getTime())) return val.toString();
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pamSafeStr_(v) {
  return v != null ? v.toString().trim() : '';
}

// ── Keyword Matching ──────────────────────────────────────

function pamKeywordScore_(text, keywordCsv) {
  if (!keywordCsv || !text) return 0;
  const haystack = text.toString().toLowerCase();
  const keywords = keywordCsv.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  if (!keywords.length) return 0;
  const matched = keywords.filter(kw => haystack.includes(kw));
  return matched.length / keywords.length; // 0–1
}

function pamContainsCondition_(text, conditionNeeded) {
  if (!conditionNeeded || conditionNeeded === 'Any') return true;
  const t = text.toString().toLowerCase();
  const conditionMap = {
    'New':       ['new', 'brand new', 'unopened', 'sealed', 'oem'],
    'Like New':  ['like new', 'excellent', 'mint', 'pristine', 'barely used'],
    'Good':      ['good', 'great condition', 'works great', 'fully functional'],
    'Fair':      ['fair', 'some wear', 'used', 'functional']
  };
  const acceptable = [];
  const order = ['New', 'Like New', 'Good', 'Fair', 'Any'];
  const reqIdx = order.indexOf(conditionNeeded);
  for (let i = reqIdx; i < order.length - 1; i++) {
    const kws = conditionMap[order[i]] || [];
    acceptable.push(...kws);
  }
  return acceptable.some(kw => t.includes(kw));
}

// ── Sheet Styling Helpers ─────────────────────────────────

function pamStyleHeader_(sheet, numCols) {
  const hdr = sheet.getRange(1, 1, 1, numCols);
  hdr.setBackground('#0A0A0C')
     .setFontColor('#C9A84C')
     .setFontWeight('bold')
     .setFontSize(10);
  sheet.setFrozenRows(1);
}

function pamApplyDropdown_(sheet, row, col, options) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true)
    .setAllowInvalid(false)
    .build();
  const range = sheet.getRange(row, col);
  range.setDataValidation(rule);
}

function pamApplyDropdownColumn_(sheet, col, options, startRow, endRow) {
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(options, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(startRow, col, endRow - startRow + 1, 1).setDataValidation(rule);
}

// ── Logging ───────────────────────────────────────────────

const PAM_LOG_ = [];

function pamLog_(message, category) {
  const ts = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss');
  const line = '[' + ts + '] [' + (category || 'PAM') + '] ' + message;
  PAM_LOG_.push(line);
  console.log(line);
}

function pamGetLog() {
  return PAM_LOG_.slice();
}

// ── Safe JSON parse ───────────────────────────────────────

function pamParseJSON_(str) {
  try {
    // Strip markdown code fences if present
    const cleaned = str.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return null;
  }
}
