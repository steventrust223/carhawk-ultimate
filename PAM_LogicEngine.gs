// =========================================================
// FILE: PAM_LogicEngine.gs — Layer 1 Keyword/Rule Matching
// Project Arbitrage Module — Quantum Workbook Ecosystem
// =========================================================

function runPAMLogicEngine() {
  const log = [];
  const push = (msg, cat) => { log.push({ time: new Date().toLocaleTimeString(), cat: cat || 'ENGINE', msg }); console.log(msg); };

  try {
    push('Logic Engine starting…', 'START');

    // Load settings
    const settingsResult = getPAMSettings();
    const cfg = settingsResult.settings;
    const weights = {
      keyword:   parseFloat(cfg.PAM_KeywordWeight)  || 40,
      category:  parseFloat(cfg.PAM_CategoryWeight) || 20,
      price:     parseFloat(cfg.PAM_PriceWeight)    || 20,
      brand:     parseFloat(cfg.PAM_BrandWeight)    || 10,
      distance:  parseFloat(cfg.PAM_DistanceWeight) || 5,
      condition: parseFloat(cfg.PAM_ConditionWeight)|| 5
    };
    const distanceRadius = parseFloat(cfg.PAM_DistanceRadius) || 30;
    const sourceSheet    = cfg.PAM_SourceSheet || 'Master DB';

    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Load source (scraped) listings
    const srcSheet = ss.getSheetByName(sourceSheet);
    if (!srcSheet) throw new Error('Source sheet not found: "' + sourceSheet + '". Check PAM Settings.');
    if (srcSheet.getLastRow() < 2) throw new Error('Source sheet has no data rows.');

    const srcHeaders = srcSheet.getRange(1, 1, 1, srcSheet.getLastColumn()).getValues()[0];
    const srcData    = srcSheet.getRange(2, 1, srcSheet.getLastRow() - 1, srcSheet.getLastColumn()).getValues();

    // Map column names (case-insensitive)
    const colIdx = (names) => {
      for (const name of names) {
        const i = srcHeaders.findIndex(h => h.toString().toLowerCase().includes(name.toLowerCase()));
        if (i >= 0) return i;
      }
      return -1;
    };

    const COL_TITLE    = colIdx(['title','listing title','name','item']);
    const COL_DESC     = colIdx(['description','desc','details','body']);
    const COL_PRICE    = colIdx(['price','asking','ask price','cost']);
    const COL_CATEGORY = colIdx(['category','type']);
    const COL_DISTANCE = colIdx(['distance','miles','mi']);
    const COL_PLATFORM = colIdx(['platform','source','site','marketplace']);
    const COL_URL      = colIdx(['url','link','listing url']);
    const COL_ROWID    = colIdx(['row id','id','row','listing id']);

    push('Source sheet "' + sourceSheet + '": ' + srcData.length + ' rows found.', 'INFO');
    push('Column map — Title:' + COL_TITLE + ' Price:' + COL_PRICE + ' Platform:' + COL_PLATFORM, 'INFO');

    // Load open needs
    const needsSheet = ss.getSheetByName('PAM_Needs');
    if (!needsSheet || needsSheet.getLastRow() < 2) throw new Error('PAM_Needs sheet is empty.');
    const needsRaw = needsSheet.getRange(2, 1, needsSheet.getLastRow() - 1, 19).getValues();
    const openNeeds = needsRaw
      .filter(r => r[0] && (pamSafeStr_(r[18]) === 'Open' || pamSafeStr_(r[18]) === 'Partially Filled'))
      .map(r => ({
        id:          pamSafeStr_(r[0]),
        projectId:   pamSafeStr_(r[1]),
        item:        pamSafeStr_(r[3]),
        keywords:    pamSafeStr_(r[4]),
        category:    pamSafeStr_(r[5]),
        brand:       pamSafeStr_(r[7]),
        model:       pamSafeStr_(r[8]),
        condition:   pamSafeStr_(r[10]),
        qtyNeeded:   parseFloat(r[11]) || 1,
        qtyAcquired: parseFloat(r[12]) || 0,
        targetPrice: parseFloat(r[13]) || 0,
        maxPrice:    parseFloat(r[14]) || 0,
        priority:    pamSafeStr_(r[15])
      }));

    if (!openNeeds.length) throw new Error('No open needs found in PAM_Needs.');
    push('Scanning ' + srcData.length + ' listings against ' + openNeeds.length + ' open needs…', 'SCAN');

    // Load project budgets for cross-referencing
    const projSheet = ss.getSheetByName('PAM_Projects');
    const projBudgets = {};
    if (projSheet && projSheet.getLastRow() >= 2) {
      const pData = projSheet.getRange(2, 1, projSheet.getLastRow() - 1, 8).getValues();
      pData.forEach(r => { if (r[0]) projBudgets[pamSafeStr_(r[0])] = parseFloat(r[7]) || 0; });
    }

    const matchesSheet = ss.getSheetByName('PAM_Matches');
    if (!matchesSheet) throw new Error('PAM_Matches sheet not found. Run Initialize first.');

    let written = 0, skipped = 0, weak = 0, good = 0, strong = 0;

    // Score each listing × need
    srcData.forEach((srcRow, srcIdx) => {
      const title       = COL_TITLE    >= 0 ? pamSafeStr_(srcRow[COL_TITLE])    : '';
      const desc        = COL_DESC     >= 0 ? pamSafeStr_(srcRow[COL_DESC])     : '';
      const askingRaw   = COL_PRICE    >= 0 ? srcRow[COL_PRICE]                : 0;
      const asking      = parseFloat(String(askingRaw).replace(/[^0-9.]/g,'')) || 0;
      const srcCategory = COL_CATEGORY >= 0 ? pamSafeStr_(srcRow[COL_CATEGORY]) : '';
      const distanceRaw = COL_DISTANCE >= 0 ? srcRow[COL_DISTANCE]             : '';
      const platform    = COL_PLATFORM >= 0 ? pamSafeStr_(srcRow[COL_PLATFORM]) : '';
      const url         = COL_URL      >= 0 ? pamSafeStr_(srcRow[COL_URL])      : '';
      const scrapedId   = COL_ROWID    >= 0 ? pamSafeStr_(srcRow[COL_ROWID])   : 'SRC' + (srcIdx + 2);

      if (!title && !desc) return; // nothing to score

      const fullText = (title + ' ' + desc).toLowerCase();
      const distanceMiles = parseFloat(String(distanceRaw).replace(/[^0-9.]/g,'')) || -1;

      // Score each need
      const scored = openNeeds.map(need => {
        let score = 0;

        // 1. Keyword match (40 pts)
        const kwRatio = pamKeywordScore_(fullText, need.keywords);
        score += Math.round(kwRatio * weights.keyword);

        // 2. Category match (20 pts)
        if (need.category && srcCategory) {
          if (srcCategory.toLowerCase().includes(need.category.toLowerCase()) ||
              need.category.toLowerCase().includes(srcCategory.toLowerCase())) {
            score += weights.category;
          }
        }

        // 3. Price score (20 pts)
        if (asking > 0) {
          if (need.targetPrice > 0 && asking <= need.targetPrice) {
            score += weights.price;
          } else if (need.maxPrice > 0 && asking <= need.maxPrice) {
            score += Math.round(weights.price * 0.5);
          }
        }

        // 4. Distance score (5 pts)
        if (distanceMiles >= 0 && distanceMiles <= distanceRadius) {
          score += weights.distance;
        } else if (distanceMiles < 0) {
          // No distance data — give partial credit
          score += Math.round(weights.distance * 0.5);
        }

        // 5. Condition score (5 pts)
        if (pamContainsCondition_(fullText, need.condition)) {
          score += weights.condition;
        }

        // 6. Brand/model match bonus (10 pts)
        const brandStr = ((need.brand || '') + ' ' + (need.model || '')).toLowerCase().trim();
        if (brandStr) {
          const brands = brandStr.split(/[\s,]+/).filter(Boolean);
          if (brands.some(b => b.length > 2 && fullText.includes(b))) {
            score += weights.brand;
          }
        }

        return { need, score: Math.min(score, 100) };
      });

      // Sort by score desc
      scored.sort((a, b) => b.score - a.score);
      const best   = scored[0];
      const second = scored[1];

      if (!best || best.score < 40) { skipped++; return; }

      // Deduplication check
      if (pamMatchExists_(scrapedId, best.need.id)) { skipped++; return; }

      const tier = best.score >= 80 ? 'Strong' : best.score >= 60 ? 'Good' : 'Weak';
      const matchId = pamNextMatchId();
      const secondaryNeedId = (second && second.score >= 40 && second.need.projectId !== best.need.projectId)
        ? second.need.id : '';

      const matchRow = [
        matchId,                  // A Match ID
        scrapedId,                // B Scraped Row ID
        best.need.projectId,      // C Project ID
        '',                       // D Project Name — formula
        best.need.id,             // E Need ID
        '',                       // F Need Item — formula
        secondaryNeedId,          // G Secondary Need ID
        title,                    // H Listing Title
        desc.substring(0, 500),   // I Listing Description
        platform,                 // J Platform
        url,                      // K Listing URL
        asking,                   // L Asking Price
        '',                       // M Estimated Value
        distanceMiles >= 0 ? distanceMiles + ' mi' : '', // N Distance
        true,                     // O Logic Match
        best.score,               // P Match Score
        tier,                     // Q Match Tier
        '',                       // R AI Fit Verdict
        '',                       // S AI Compatibility Insight
        '',                       // T AI Strategy
        '',                       // U AI Risk Flags
        '',                       // V AI Negotiation Angle
        '',                       // W Recommended Action
        'New',                    // X Review Status
        new Date()                // Y Timestamp
      ];

      const newRow = matchesSheet.getLastRow() + 1;
      matchesSheet.getRange(newRow, 1, 1, matchRow.length).setValues([matchRow]);
      // Re-apply formula columns
      matchesSheet.getRange(newRow, 4).setFormula('=IF(C'+newRow+'="","",IFERROR(VLOOKUP(C'+newRow+',PAM_Projects!A:B,2,FALSE),""))');
      matchesSheet.getRange(newRow, 6).setFormula('=IF(E'+newRow+'="","",IFERROR(VLOOKUP(E'+newRow+',PAM_Needs!A:D,4,FALSE),""))');
      matchesSheet.getRange(newRow, 12).setNumberFormat('$#,##0.00');

      written++;
      if (tier === 'Strong') strong++;
      else if (tier === 'Good') good++;
      else weak++;
    });

    const summary = 'Complete. ' + written + ' new matches written (' + strong + ' strong, ' + good + ' good, ' + weak + ' weak). ' + skipped + ' skipped (below threshold or duplicate).';
    push(summary, 'DONE');
    return { success: true, log, summary, written, strong, good, weak, skipped };

  } catch (e) {
    const errMsg = 'Logic Engine error: ' + e.toString();
    log.push({ time: new Date().toLocaleTimeString(), cat: 'ERROR', msg: errMsg });
    return { success: false, log, error: errMsg };
  }
}
