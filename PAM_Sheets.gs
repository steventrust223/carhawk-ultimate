// =========================================================
// FILE: PAM_Sheets.gs — Sheet Creation & Initialization
// Project Arbitrage Module — Quantum Workbook Ecosystem
// =========================================================

function initializePAMSheets() {
  initPAMSettings();
  createPAMProjectsSheet_();
  createPAMNeedsSheet_();
  createPAMMatchesSheet_();
  createPAMPurchasesSheet_();
  createPAMDashboardSheet_();
  SpreadsheetApp.getUi().alert('⚡ PAM sheets initialized successfully.');
}

// ── PAM_Projects ──────────────────────────────────────────

function createPAMProjectsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PAM_Projects');
  if (!sheet) sheet = ss.insertSheet('PAM_Projects');

  const headers = [
    'Project ID','Project Name','Project Type','Category','Description',
    'Budget','Spent So Far','Remaining Budget','Priority','Status',
    'Start Date','Target Completion','Notes'
  ];
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  pamStyleHeader_(sheet, headers.length);

  // Formula columns for rows 2–1000
  for (let r = 2; r <= 1000; r++) {
    sheet.getRange(r,7).setFormula('=IF(A'+r+'="","",SUMIFS(PAM_Purchases!F:F,PAM_Purchases!B:B,A'+r+'))');
    sheet.getRange(r,8).setFormula('=IF(F'+r+'="","",F'+r+'-G'+r+')');
  }

  // Currency formatting
  sheet.getRange('F2:H1000').setNumberFormat('$#,##0.00');
  sheet.getRange('K2:L1000').setNumberFormat('yyyy-mm-dd');

  // Dropdowns
  const projectTypes = ['Vehicle Flip','Vehicle Build','Property Rehab','ATV/Powersports Build','Solar/Off-Grid','Electronics Bundle','General Arbitrage','Other'];
  const priorities   = ['Critical','High','Medium','Low'];
  const statuses     = ['Planning','Active','Paused','Complete','Cancelled'];
  pamApplyDropdownColumn_(sheet, 3,  projectTypes, 2, 1000);
  pamApplyDropdownColumn_(sheet, 9,  priorities,   2, 1000);
  pamApplyDropdownColumn_(sheet, 10, statuses,     2, 1000);

  // Conditional formatting: red if remaining < 10% of budget
  const cfRules = sheet.getConditionalFormatRules();
  const redRule = SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(F2>0, H2/F2<0.1)')
    .setBackground('#3A0A0A')
    .setFontColor('#FF6B6B')
    .setRanges([sheet.getRange('A2:M1000')])
    .build();
  cfRules.push(redRule);
  sheet.setConditionalFormatRules(cfRules);

  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
}

// ── PAM_Needs ─────────────────────────────────────────────

function createPAMNeedsSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PAM_Needs');
  if (!sheet) sheet = ss.insertSheet('PAM_Needs');

  const headers = [
    'Need ID','Project ID','Project Name','Item Needed','Keyword Set',
    'Category','Subcategory','Preferred Brand','Preferred Model',
    'Acceptable Alternatives','Condition Needed','Qty Needed','Qty Acquired',
    'Target Price','Max Price','Priority','Required','Notes','Status'
  ];
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  pamStyleHeader_(sheet, headers.length);

  // Formula columns
  for (let r = 2; r <= 1000; r++) {
    sheet.getRange(r,3).setFormula('=IF(B'+r+'="","",IFERROR(VLOOKUP(B'+r+',PAM_Projects!A:B,2,FALSE),"? Unknown"))');
    sheet.getRange(r,13).setFormula('=IF(B'+r+'="","",COUNTIFS(PAM_Purchases!C:C,B'+r+',PAM_Purchases!D:D,D'+r+'))');
  }

  // Currency / number formatting
  sheet.getRange('L2:M1000').setNumberFormat('0');
  sheet.getRange('N2:O1000').setNumberFormat('$#,##0.00');

  // Dropdowns
  const categories  = ['HVAC','Electrical','Plumbing','Body/Cosmetic','Drivetrain','Engine','Suspension','Wheels/Tires','Interior','Exterior','Appliance','Flooring','Solar','Battery','Electronics','Tools','Other'];
  const conditions  = ['New','Like New','Good','Fair','Any'];
  const priorities  = ['Critical','Important','Nice to Have'];
  const statuses    = ['Open','Partially Filled','Fulfilled','Cancelled'];

  pamApplyDropdownColumn_(sheet, 6,  categories, 2, 1000);
  pamApplyDropdownColumn_(sheet, 11, conditions, 2, 1000);
  pamApplyDropdownColumn_(sheet, 16, priorities, 2, 1000);
  pamApplyDropdownColumn_(sheet, 19, statuses,   2, 1000);

  // Checkbox for Required column (17)
  sheet.getRange('Q2:Q1000').insertCheckboxes();

  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
}

// ── PAM_Matches ───────────────────────────────────────────

function createPAMMatchesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PAM_Matches');
  if (!sheet) sheet = ss.insertSheet('PAM_Matches');

  const headers = [
    'Match ID','Scraped Row ID','Project ID','Project Name','Need ID','Need Item',
    'Secondary Need ID','Listing Title','Listing Description','Platform','Listing URL',
    'Asking Price','Estimated Value','Distance','Logic Match','Match Score','Match Tier',
    'AI Fit Verdict','AI Compatibility Insight','AI Strategy','AI Risk Flags',
    'AI Negotiation Angle','Recommended Action','Review Status','Timestamp'
  ];
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  pamStyleHeader_(sheet, headers.length);

  // Formula columns
  for (let r = 2; r <= 5000; r++) {
    sheet.getRange(r,4).setFormula('=IF(C'+r+'="","",IFERROR(VLOOKUP(C'+r+',PAM_Projects!A:B,2,FALSE),""))');
    sheet.getRange(r,6).setFormula('=IF(E'+r+'="","",IFERROR(VLOOKUP(E'+r+',PAM_Needs!A:D,4,FALSE),""))');
  }

  sheet.getRange('L2:M5000').setNumberFormat('$#,##0.00');
  sheet.getRange('P2:P5000').setNumberFormat('0');
  sheet.getRange('Y2:Y5000').setNumberFormat('yyyy-mm-dd hh:mm:ss');

  const reviewStatuses = ['New','Reviewed','Acted On','Dismissed'];
  pamApplyDropdownColumn_(sheet, 24, reviewStatuses, 2, 5000);

  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
}

// ── PAM_Purchases ─────────────────────────────────────────

function createPAMPurchasesSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PAM_Purchases');
  if (!sheet) sheet = ss.insertSheet('PAM_Purchases');

  const headers = [
    'Purchase ID','Project ID','Need ID','Item Bought','Source / Platform',
    'Purchase Price','Date Bought','Seller','Listing URL','Match ID',
    'Installed Yet','Resellable Later','Estimated Resale Value','Condition','Notes'
  ];
  sheet.getRange(1,1,1,headers.length).setValues([headers]);
  pamStyleHeader_(sheet, headers.length);

  sheet.getRange('F2:F1000').setNumberFormat('$#,##0.00');
  sheet.getRange('G2:G1000').setNumberFormat('yyyy-mm-dd');
  sheet.getRange('M2:M1000').setNumberFormat('$#,##0.00');

  sheet.getRange('K2:L1000').insertCheckboxes();

  const conditions = ['New','Like New','Good','Fair','Poor'];
  pamApplyDropdownColumn_(sheet, 14, conditions, 2, 1000);

  sheet.autoResizeColumns(1, headers.length);
  sheet.setFrozenRows(1);
}

// ── PAM_Dashboard ─────────────────────────────────────────

function createPAMDashboardSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('PAM_Dashboard');
  if (!sheet) sheet = ss.insertSheet('PAM_Dashboard');

  sheet.clearContents();
  sheet.clearFormats();

  const dark = '#0A0A0C';
  const gold  = '#C9A84C';
  const surf  = '#141418';

  // Title row
  sheet.getRange('A1:H1').merge()
       .setValue('⚡  PROJECT ARBITRAGE MODULE — COMMAND VIEW')
       .setBackground(dark).setFontColor(gold)
       .setFontWeight('bold').setFontSize(16)
       .setHorizontalAlignment('center');
  sheet.setRowHeight(1, 40);

  // Section A header
  sheet.getRange('A3:H3').merge()
       .setValue('▸  ACTIVE PROJECTS SUMMARY')
       .setBackground(surf).setFontColor(gold)
       .setFontWeight('bold').setFontSize(11);

  const projHeaders = ['Project Name','Type','Budget','Spent','Remaining','Open Needs','Critical Needs','Status'];
  sheet.getRange(4,1,1,projHeaders.length).setValues([projHeaders])
       .setBackground('#1E1E24').setFontColor('#E8E6E1').setFontWeight('bold');

  // Dynamic QUERY formulas for active projects
  sheet.getRange('A5').setFormula(
    '=IFERROR(QUERY(PAM_Projects!A:M,"SELECT B,C,F,G,H,\'—\',\'—\',J WHERE J=\'Active\'",0),"")'
  );

  // Section B header (row 22)
  sheet.getRange('A22:G22').merge()
       .setValue('▸  TOP UNFILLED CRITICAL / IMPORTANT NEEDS')
       .setBackground(surf).setFontColor(gold)
       .setFontWeight('bold').setFontSize(11);
  const needHeaders = ['Need Item','Project Name','Priority','Qty Needed','Qty Acquired','Target Price','Status'];
  sheet.getRange(23,1,1,needHeaders.length).setValues([needHeaders])
       .setBackground('#1E1E24').setFontColor('#E8E6E1').setFontWeight('bold');
  sheet.getRange('A24').setFormula(
    '=IFERROR(QUERY(PAM_Needs!A:S,"SELECT D,C,P,L,M,N,S WHERE (S=\'Open\') AND (P=\'Critical\' OR P=\'Important\') ORDER BY P ASC LIMIT 15",0),"")'
  );

  // Section C header (row 42)
  sheet.getRange('A42:H42').merge()
       .setValue('▸  NEWEST STRONG / GOOD MATCHES')
       .setBackground(surf).setFontColor(gold)
       .setFontWeight('bold').setFontSize(11);
  const matchHeaders = ['Match ID','Listing Title','Project Name','Need Item','Asking Price','Match Score','AI Verdict','Action'];
  sheet.getRange(43,1,1,matchHeaders.length).setValues([matchHeaders])
       .setBackground('#1E1E24').setFontColor('#E8E6E1').setFontWeight('bold');
  sheet.getRange('A44').setFormula(
    '=IFERROR(QUERY(PAM_Matches!A:Y,"SELECT A,H,D,F,L,P,R,W WHERE (Q=\'Strong\' OR Q=\'Good\') ORDER BY Y DESC LIMIT 15",0),"")'
  );

  // Section D header (row 62)
  sheet.getRange('A62:E62').merge()
       .setValue('▸  RECENT PURCHASES')
       .setBackground(surf).setFontColor(gold)
       .setFontWeight('bold').setFontSize(11);
  const purHeaders = ['Item Bought','Project ID','Price','Date','Installed'];
  sheet.getRange(63,1,1,purHeaders.length).setValues([purHeaders])
       .setBackground('#1E1E24').setFontColor('#E8E6E1').setFontWeight('bold');
  sheet.getRange('A64').setFormula(
    '=IFERROR(QUERY(PAM_Purchases!A:O,"SELECT D,B,F,G,K ORDER BY G DESC LIMIT 10",0),"")'
  );

  // Section E header (row 77)
  sheet.getRange('A77:C77').merge()
       .setValue('▸  BUDGET HEALTH (Spent / Budget)')
       .setBackground(surf).setFontColor(gold)
       .setFontWeight('bold').setFontSize(11);
  sheet.getRange('A78:C78').setValues([['Project','Budget Bar','Remaining %']])
       .setBackground('#1E1E24').setFontColor('#E8E6E1').setFontWeight('bold');
  sheet.getRange('A79').setFormula(
    '=IFERROR(QUERY(PAM_Projects!A:M,"SELECT B,F,H WHERE J=\'Active\'",0),"")'
  );

  // Global styling
  sheet.getRange('A1:Z1000').setBackground(dark).setFontColor('#E8E6E1');
  sheet.setFrozenRows(1);
  sheet.hideGridlines();
}
