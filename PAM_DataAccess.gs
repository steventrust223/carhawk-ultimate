// =========================================================
// FILE: PAM_DataAccess.gs — Read/Write Layer for HTML UI
// Project Arbitrage Module — Quantum Workbook Ecosystem
// =========================================================

// ── Projects ──────────────────────────────────────────────

function getPAMProjects() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Projects');
    if (!sheet || sheet.getLastRow() < 2) return { success: true, data: [] };
    const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, 13).getValues();
    const data = raw
      .filter(r => r[0])
      .map(r => ({
        id:          pamSafeStr_(r[0]),
        name:        pamSafeStr_(r[1]),
        type:        pamSafeStr_(r[2]),
        category:    pamSafeStr_(r[3]),
        description: pamSafeStr_(r[4]),
        budget:      parseFloat(r[5]) || 0,
        spent:       parseFloat(r[6]) || 0,
        remaining:   parseFloat(r[7]) || 0,
        priority:    pamSafeStr_(r[8]),
        status:      pamSafeStr_(r[9]),
        startDate:   pamFormatDate_(r[10]),
        targetDate:  pamFormatDate_(r[11]),
        notes:       pamSafeStr_(r[12])
      }));
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.toString(), data: [] };
  }
}

function addProject(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Projects');
    if (!sheet) throw new Error('PAM_Projects sheet not found. Run Initialize first.');
    const id = pamNextProjectId();
    const row = [
      id,
      data.name || '',
      data.type || '',
      data.category || '',
      data.description || '',
      parseFloat(data.budget) || 0,
      '', // Spent — formula
      '', // Remaining — formula
      data.priority || 'Medium',
      data.status || 'Planning',
      data.startDate || '',
      data.targetDate || '',
      data.notes || ''
    ];
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, row.length).setValues([row]);
    // Re-apply formulas for this row
    sheet.getRange(newRow, 7).setFormula('=IF(A'+newRow+'="","",SUMIFS(PAM_Purchases!F:F,PAM_Purchases!B:B,A'+newRow+'))');
    sheet.getRange(newRow, 8).setFormula('=IF(F'+newRow+'="","",F'+newRow+'-G'+newRow+')');
    return { success: true, id };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ── Needs ─────────────────────────────────────────────────

function getPAMNeeds(projectId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Needs');
    if (!sheet || sheet.getLastRow() < 2) return { success: true, data: [] };
    const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, 19).getValues();
    let data = raw
      .filter(r => r[0])
      .map(r => ({
        id:           pamSafeStr_(r[0]),
        projectId:    pamSafeStr_(r[1]),
        projectName:  pamSafeStr_(r[2]),
        item:         pamSafeStr_(r[3]),
        keywords:     pamSafeStr_(r[4]),
        category:     pamSafeStr_(r[5]),
        subcategory:  pamSafeStr_(r[6]),
        brand:        pamSafeStr_(r[7]),
        model:        pamSafeStr_(r[8]),
        alternatives: pamSafeStr_(r[9]),
        condition:    pamSafeStr_(r[10]),
        qtyNeeded:    parseFloat(r[11]) || 1,
        qtyAcquired:  parseFloat(r[12]) || 0,
        targetPrice:  parseFloat(r[13]) || 0,
        maxPrice:     parseFloat(r[14]) || 0,
        priority:     pamSafeStr_(r[15]),
        required:     r[16] === true || r[16] === 'TRUE',
        notes:        pamSafeStr_(r[17]),
        status:       pamSafeStr_(r[18])
      }));
    if (projectId) data = data.filter(n => n.projectId === projectId);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.toString(), data: [] };
  }
}

function addNeed(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Needs');
    if (!sheet) throw new Error('PAM_Needs sheet not found. Run Initialize first.');
    const id = pamNextNeedId();
    const row = [
      id,
      data.projectId || '',
      '', // Project Name — formula
      data.item || '',
      data.keywords || '',
      data.category || '',
      data.subcategory || '',
      data.brand || '',
      data.model || '',
      data.alternatives || '',
      data.condition || 'Any',
      parseFloat(data.qtyNeeded) || 1,
      '', // Qty Acquired — formula
      parseFloat(data.targetPrice) || 0,
      parseFloat(data.maxPrice) || 0,
      data.priority || 'Important',
      data.required || false,
      data.notes || '',
      data.status || 'Open'
    ];
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, row.length).setValues([row]);
    sheet.getRange(newRow, 3).setFormula('=IF(B'+newRow+'="","",IFERROR(VLOOKUP(B'+newRow+',PAM_Projects!A:B,2,FALSE),"? Unknown"))');
    sheet.getRange(newRow, 13).setFormula('=IF(B'+newRow+'="","",COUNTIFS(PAM_Purchases!C:C,B'+newRow+',PAM_Purchases!D:D,D'+newRow+'))');
    return { success: true, id };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ── Matches ───────────────────────────────────────────────

function getPAMMatches(filters) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Matches');
    if (!sheet || sheet.getLastRow() < 2) return { success: true, data: [] };
    const raw = sheet.getRange(2, 1, sheet.getLastRow() - 1, 25).getValues();
    let data = raw
      .filter(r => r[0])
      .map(r => ({
        id:               pamSafeStr_(r[0]),
        scrapedRowId:     pamSafeStr_(r[1]),
        projectId:        pamSafeStr_(r[2]),
        projectName:      pamSafeStr_(r[3]),
        needId:           pamSafeStr_(r[4]),
        needItem:         pamSafeStr_(r[5]),
        secondaryNeedId:  pamSafeStr_(r[6]),
        title:            pamSafeStr_(r[7]),
        description:      pamSafeStr_(r[8]),
        platform:         pamSafeStr_(r[9]),
        url:              pamSafeStr_(r[10]),
        askingPrice:      parseFloat(r[11]) || 0,
        estimatedValue:   parseFloat(r[12]) || 0,
        distance:         pamSafeStr_(r[13]),
        logicMatch:       r[14],
        matchScore:       parseFloat(r[15]) || 0,
        matchTier:        pamSafeStr_(r[16]),
        aiVerdict:        pamSafeStr_(r[17]),
        aiInsight:        pamSafeStr_(r[18]),
        aiStrategy:       pamSafeStr_(r[19]),
        aiRiskFlags:      pamSafeStr_(r[20]),
        aiNegotiation:    pamSafeStr_(r[21]),
        recommendedAction:pamSafeStr_(r[22]),
        reviewStatus:     pamSafeStr_(r[23]),
        timestamp:        pamFormatDate_(r[24])
      }));

    if (filters) {
      if (filters.projectId)   data = data.filter(m => m.projectId === filters.projectId);
      if (filters.tier)        data = data.filter(m => m.matchTier === filters.tier);
      if (filters.aiVerdict)   data = data.filter(m => m.aiVerdict === filters.aiVerdict);
      if (filters.reviewStatus)data = data.filter(m => m.reviewStatus === filters.reviewStatus);
    }

    data.sort((a, b) => b.matchScore - a.matchScore);
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.toString(), data: [] };
  }
}

function updateMatchStatus(matchId, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Matches');
    if (!sheet || sheet.getLastRow() < 2) throw new Error('PAM_Matches not found.');
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues().flat();
    const idx = ids.indexOf(matchId);
    if (idx === -1) throw new Error('Match ID not found: ' + matchId);
    sheet.getRange(idx + 2, 24).setValue(status); // Review Status column
    return { success: true };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

// ── Purchases ─────────────────────────────────────────────

function recordPurchase(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PAM_Purchases');
    if (!sheet) throw new Error('PAM_Purchases sheet not found. Run Initialize first.');
    const id = pamNextPurchaseId();
    const row = [
      id,
      data.projectId || '',
      data.needId || '',
      data.item || '',
      data.platform || '',
      parseFloat(data.price) || 0,
      data.dateBought || new Date(),
      data.seller || '',
      data.listingUrl || '',
      data.matchId || '',
      false, // Installed Yet
      false, // Resellable Later
      parseFloat(data.resaleValue) || 0,
      data.condition || 'Good',
      data.notes || ''
    ];
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1, 1, row.length).setValues([row]);
    sheet.getRange(newRow, 6).setNumberFormat('$#,##0.00');
    sheet.getRange(newRow, 13).setNumberFormat('$#,##0.00');

    // If match ID provided, mark that match as Acted On
    if (data.matchId) {
      updateMatchStatus(data.matchId, 'Acted On');
    }
    // Mark need as Partially Filled or Fulfilled
    if (data.needId) {
      refreshNeedStatus_(data.needId);
    }
    return { success: true, id };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

function refreshNeedStatus_(needId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const needsSheet = ss.getSheetByName('PAM_Needs');
    if (!needsSheet || needsSheet.getLastRow() < 2) return;
    const ids = needsSheet.getRange(2, 1, needsSheet.getLastRow() - 1, 1).getValues().flat();
    const idx = ids.indexOf(needId);
    if (idx === -1) return;
    const row = idx + 2;
    const qtyNeeded   = parseFloat(needsSheet.getRange(row, 12).getValue()) || 1;
    const qtyAcquired = parseFloat(needsSheet.getRange(row, 13).getValue()) || 0;
    let newStatus = 'Open';
    if (qtyAcquired >= qtyNeeded) newStatus = 'Fulfilled';
    else if (qtyAcquired > 0) newStatus = 'Partially Filled';
    needsSheet.getRange(row, 19).setValue(newStatus);
  } catch (e) {
    // non-fatal
  }
}

// ── Stats for UI header bar ───────────────────────────────

function getPAMStats() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const matchSheet = ss.getSheetByName('PAM_Matches');
    const today = new Date();
    today.setHours(0,0,0,0);

    let total = 0, strong = 0, awaitingAI = 0, actedToday = 0;
    if (matchSheet && matchSheet.getLastRow() >= 2) {
      const data = matchSheet.getRange(2, 1, matchSheet.getLastRow() - 1, 25).getValues();
      data.forEach(r => {
        if (!r[0]) return;
        total++;
        if (r[16] === 'Strong') strong++;
        if (!r[17] || r[17].toString().startsWith('AI Error')) awaitingAI++;
        const ts = r[24] instanceof Date ? r[24] : new Date(r[24]);
        if (!isNaN(ts.getTime()) && ts >= today && r[23] === 'Acted On') actedToday++;
      });
    }
    return { success: true, total, strong, awaitingAI, actedToday };
  } catch (e) {
    return { success: false, error: e.toString(), total: 0, strong: 0, awaitingAI: 0, actedToday: 0 };
  }
}

// ── Next ID helpers exposed to UI ─────────────────────────

function getPAMNextIds() {
  return {
    projectId:  pamNextProjectId(),
    needId:     pamNextNeedId(),
    purchaseId: pamNextPurchaseId()
  };
}
