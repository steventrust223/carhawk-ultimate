// ============================================================================
// CARHAWK ULTIMATE — ANALYSIS.GS
// Core Analysis Pipeline: Strategy Selection, MAO, Profit Calculations
// ============================================================================

/**
 * Analyze a deal completely - returns full analysis object
 * This is the main entry point for deal analysis
 */
function analyzeDeal(rawData) {
  // Normalize input data
  const dealData = normalizeDealData(rawData);

  // Step 1: Calculate distance
  const originZip = getOriginZip();
  dealData.distance = getDistanceMiles(originZip, dealData.zip);

  // Step 2: Estimate market value
  dealData.marketValue = calculateMarketValue(dealData);

  // Step 3: Estimate repair cost
  dealData.repairCost = calculateRepairCost(dealData);

  // Step 4: Determine strategy (BEFORE MAO)
  dealData.strategy = determineStrategy(dealData);

  // Step 5: Calculate all scores
  const scores = calculateAllScores(dealData);

  // Step 6: Determine verdict
  const verdict = determineVerdict(dealData, scores);

  // Step 7: Calculate negotiation anchors
  const negotiation = calculateNegotiationAnchors(scores.mao, dealData.strategy);

  // Combine into analysis result
  return {
    // Input data
    id: dealData.id || generateId('CH'),
    vehicle: `${dealData.year} ${dealData.make} ${dealData.model}`.trim(),
    year: dealData.year,
    make: dealData.make,
    model: dealData.model,
    mileage: dealData.mileage,
    condition: dealData.condition,
    titleStatus: dealData.titleStatus,
    askingPrice: dealData.askingPrice,
    platform: dealData.platform,
    location: dealData.location,
    zip: dealData.zip,
    distance: dealData.distance,
    daysListed: dealData.daysListed,
    sellerName: dealData.sellerName,
    sellerPhone: dealData.sellerPhone,
    sellerEmail: dealData.sellerEmail,

    // Calculations
    ...scores,
    strategy: dealData.strategy,
    strategyLabel: getStrategyLabel(dealData.strategy),

    // Verdict
    verdict: verdict.verdict,
    verdictEmoji: verdict.emoji,
    verdictColor: verdict.color,
    whyPass: verdict.whyPass,

    // Negotiation
    openingOfferAggressive: negotiation.aggressive,
    openingOfferModerate: negotiation.moderate,
    walkAwayCeiling: negotiation.ceiling,

    // Metadata
    analyzedAt: new Date(),
    version: CARHAWK_VERSION
  };
}

/**
 * Normalize raw input data into consistent format
 */
function normalizeDealData(rawData) {
  // Handle both array (row) and object input
  if (Array.isArray(rawData)) {
    return normalizeFromRow(rawData);
  }

  // Object input - ensure all fields have defaults
  return {
    id: rawData.id || '',
    year: rawData.year || extractYear(rawData.title || rawData.vehicle || ''),
    make: rawData.make || extractMake(rawData.title || rawData.vehicle || ''),
    model: rawData.model || '',
    mileage: parseInt(rawData.mileage) || 100000,
    condition: rawData.condition || 'Unknown',
    titleStatus: rawData.titleStatus || rawData.title_status || 'Unknown',
    askingPrice: parsePrice(rawData.askingPrice || rawData.asking_price || rawData.price),
    platform: rawData.platform || rawData.source || 'unknown',
    location: rawData.location || '',
    zip: rawData.zip || extractZip(rawData.location || ''),
    daysListed: parseInt(rawData.daysListed || rawData.days_listed) || 21,
    sellerName: rawData.sellerName || rawData.seller_name || '',
    sellerPhone: rawData.sellerPhone || rawData.seller_phone || '',
    sellerEmail: rawData.sellerEmail || rawData.seller_email || '',
    title: rawData.title || '',
    description: rawData.description || ''
  };
}

/**
 * Normalize from sheet row array
 * Column mapping based on Master Database structure
 */
function normalizeFromRow(row) {
  return {
    id: row[0] || '',
    dateAdded: row[1],
    platform: row[2] || 'unknown',
    status: row[3] || 'New',
    leadScore: row[4],
    temperature: row[5],
    year: row[6] || '',
    make: row[7] || '',
    model: row[8] || '',
    trim: row[9] || '',
    vin: row[10] || '',
    mileage: parseInt(row[11]) || 100000,
    condition: row[12] || 'Unknown',
    titleStatus: row[13] || 'Unknown',
    location: row[14] || '',
    zip: row[15] || extractZip(row[14] || ''),
    distance: parseFloat(row[16]) || 0,
    locationRisk: row[17],
    askingPrice: parsePrice(row[18]),
    mao: row[19],
    marketValue: row[20],
    repairCost: row[21],
    arv: row[22],
    profitMargin: row[23],
    roi: row[24],
    dealScore: row[25],
    verdict: row[26],
    strategy: row[27],
    daysListed: parseInt(row[28]) || 21,
    sellerName: row[29] || '',
    sellerPhone: row[30] || '',
    sellerEmail: row[31] || '',
    aiNotes: row[32],
    manualNotes: row[33],
    lastUpdated: row[34],
    assignedTo: row[35],
    title: '',
    description: ''
  };
}

// ============================================================================
// STRATEGY SELECTION (Deterministic, BEFORE MAO)
// ============================================================================

/**
 * Determine flip strategy based on locked rules
 * Order: Part-Out → Repair+Resell → Hold/Seasonal → Quick Flip
 */
function determineStrategy(dealData) {
  const condition = dealData.condition || 'Unknown';
  const textContent = `${dealData.title || ''} ${dealData.description || ''}`;
  const repairCost = dealData.repairCost || calculateRepairCost(dealData);
  const askingPrice = dealData.askingPrice || 0;

  // Rule S1: Part-Out
  if (isPartOutCandidate(condition, textContent)) {
    return 'PART_OUT';
  }

  // Rule S2: Repair + Resell
  const repairRatio = safeDivide(repairCost, Math.max(askingPrice, 1), 0);
  if (repairRatio >= STRATEGY_THRESHOLDS.REPAIR_TRIGGER_REPAIR_PCT_MIN) {
    return 'REPAIR_RESELL';
  }

  // Rule S3: Hold / Seasonal
  if (isHoldCandidate(dealData)) {
    return 'HOLD_SEASONAL';
  }

  // Rule S4: Default - Quick Flip
  return 'QUICK_FLIP';
}

/**
 * Check if deal qualifies for Part-Out strategy
 */
function isPartOutCandidate(condition, textContent) {
  // Check condition trigger
  if (STRATEGY_THRESHOLDS.PART_OUT_TRIGGER_CONDITION.includes(condition)) {
    return true;
  }

  // Check keyword triggers
  return containsPartOutKeywords(textContent);
}

/**
 * Check if deal qualifies for Hold/Seasonal strategy
 */
function isHoldCandidate(dealData) {
  // Check if current month is in hold trigger months
  const currentMonth = new Date().getMonth() + 1; // 1-12
  if (!STRATEGY_THRESHOLDS.HOLD_TRIGGER_MONTHS.includes(currentMonth)) {
    return false;
  }

  // Check market desirability
  const desirability = calculateMarketDesirabilityScore(
    dealData.make,
    dealData.mileage,
    dealData.condition
  );

  return desirability >= STRATEGY_THRESHOLDS.HOLD_TRIGGER_DESIRABILITY_MIN;
}

/**
 * Get human-readable strategy label
 */
function getStrategyLabel(strategy) {
  const labels = {
    'QUICK_FLIP': 'Quick Flip',
    'REPAIR_RESELL': 'Repair & Resell',
    'PART_OUT': 'Part Out',
    'HOLD_SEASONAL': 'Hold/Seasonal'
  };
  return labels[strategy] || strategy;
}

// ============================================================================
// VERDICT DETERMINATION
// ============================================================================

/**
 * Determine verdict based on scores and thresholds
 */
function determineVerdict(dealData, scores) {
  const profitDollars = scores.profitDollars || 0;
  const distance = dealData.distance || 0;
  const profitPct = scores.profitPct || 0;
  const riskScore = scores.riskScore || 0;
  const temperature = scores.temperature || 'Cold';

  // PASS conditions
  if (profitDollars <= 0) {
    return {
      verdict: 'PASS',
      emoji: '❌',
      color: '#f44336',
      whyPass: 'No profit after repairs/holding'
    };
  }

  if (!dealData.askingPrice || dealData.askingPrice === 0) {
    return {
      verdict: 'PASS',
      emoji: '❌',
      color: '#f44336',
      whyPass: 'Missing asking price'
    };
  }

  if (distance >= VERDICT_THRESHOLDS.MAX_DISTANCE_ABSOLUTE) {
    return {
      verdict: 'PASS',
      emoji: '❌',
      color: '#f44336',
      whyPass: 'Too far (' + Math.round(distance) + ' miles)'
    };
  }

  if (profitPct < VERDICT_THRESHOLDS.MIN_PROFIT_PCT_SOLID) {
    return {
      verdict: 'PASS',
      emoji: '⚠️',
      color: '#ff9800',
      whyPass: 'Margin too thin (' + formatPercent(profitPct) + ')'
    };
  }

  if (riskScore > VERDICT_THRESHOLDS.MAX_RISK_ACCEPTABLE) {
    return {
      verdict: 'PASS',
      emoji: '⚠️',
      color: '#ff9800',
      whyPass: 'Risk too high (score: ' + riskScore + ')'
    };
  }

  // HOT DEAL conditions
  if (temperature === 'Hot' && distance <= VERDICT_THRESHOLDS.MAX_DISTANCE_HOT) {
    return {
      verdict: 'HOT DEAL',
      emoji: '🔥',
      color: '#4caf50',
      whyPass: null
    };
  }

  // SOLID DEAL conditions
  if (temperature === 'Warm' && distance <= VERDICT_THRESHOLDS.MAX_DISTANCE_SOLID) {
    return {
      verdict: 'SOLID DEAL',
      emoji: '✅',
      color: '#8bc34a',
      whyPass: null
    };
  }

  // Default PASS
  return {
    verdict: 'PASS',
    emoji: '⚠️',
    color: '#ff9800',
    whyPass: 'Low velocity / overpriced'
  };
}

// ============================================================================
// NEGOTIATION ANCHORS
// ============================================================================

/**
 * Calculate negotiation price anchors
 */
function calculateNegotiationAnchors(mao, strategy) {
  const aggressive = Math.round(mao * NEGOTIATION_CONFIG.AGGRESSIVE_MULTIPLIER);
  const moderate = Math.round(mao * NEGOTIATION_CONFIG.MODERATE_MULTIPLIER);
  const ceiling = Math.round(mao * NEGOTIATION_CONFIG.WALK_AWAY_CEILING_MULT);

  return {
    aggressive: Math.max(aggressive, FLOOR_MAO),
    moderate: Math.max(moderate, FLOOR_MAO),
    ceiling: Math.max(ceiling, FLOOR_MAO)
  };
}

// ============================================================================
// BATCH ANALYSIS
// ============================================================================

/**
 * Analyze multiple deals with concurrency protection
 */
function analyzeDealsWithLock(startRow, endRow) {
  const lock = LockService.getScriptLock();

  try {
    // Try to acquire lock
    if (!lock.tryLock(LOCK_CONFIG.ANALYSIS_LOCK_TIMEOUT_MS)) {
      throw new Error('Could not acquire analysis lock. Another process may be running.');
    }

    const sheet = getSheet(SHEETS.MASTER);
    if (!sheet) {
      throw new Error('Master Database sheet not found');
    }

    const results = [];

    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      try {
        const row = sheet.getRange(rowNum, 1, 1, 38).getValues()[0];
        const dealData = normalizeFromRow(row);
        const analysis = analyzeDeal(dealData);

        // Update sheet with analysis results
        updateSheetWithAnalysis(sheet, rowNum, analysis);

        results.push({
          rowNum: rowNum,
          id: analysis.id,
          success: true,
          verdict: analysis.verdict
        });

      } catch (error) {
        logSystem('Analysis Error', `Row ${rowNum}: ${error.toString()}`);
        results.push({
          rowNum: rowNum,
          success: false,
          error: error.toString()
        });
      }
    }

    logSystem('Batch Analysis', `Analyzed ${endRow - startRow + 1} deals`, {
      startRow, endRow,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;

  } finally {
    lock.releaseLock();
  }
}

/**
 * Update sheet row with analysis results
 */
function updateSheetWithAnalysis(sheet, rowNum, analysis) {
  // Update columns with analysis results
  // Adjust column numbers based on your sheet structure

  const updates = {
    5: analysis.overallScore,        // Lead Score
    6: analysis.temperature,         // Temperature
    17: analysis.distance,           // Distance
    18: getLocationRiskEmoji(analysis.distance), // Location Risk
    20: analysis.mao,                // MAO
    21: analysis.marketValue,        // Market Value
    22: analysis.repairCost,         // Repair Cost
    23: analysis.marketValue,        // ARV (same as market value for now)
    24: analysis.profitPct,          // Profit Margin
    25: safeDivide(analysis.profitDollars, analysis.totalInvestment, 0), // ROI
    26: analysis.overallScore,       // Deal Score
    27: `${analysis.verdictEmoji} ${analysis.verdict}`, // Verdict
    28: analysis.strategyLabel,      // Strategy
    35: new Date()                   // Last Updated
  };

  for (const [col, value] of Object.entries(updates)) {
    sheet.getRange(rowNum, parseInt(col)).setValue(value);
  }
}

/**
 * Get location risk emoji based on distance
 */
function getLocationRiskEmoji(distance) {
  if (distance <= 25) return '🟢';
  if (distance <= 75) return '🟡';
  if (distance <= 150) return '🟠';
  return '🔴';
}

// ============================================================================
// SINGLE DEAL ANALYSIS (from UI)
// ============================================================================

/**
 * Analyze selected row from menu
 */
function analyzeSelectedDeal() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();

  if (!range) {
    SpreadsheetApp.getUi().alert('Please select a row to analyze.');
    return;
  }

  const rowNum = range.getRow();
  if (rowNum < 2) {
    SpreadsheetApp.getUi().alert('Please select a data row (not the header).');
    return;
  }

  try {
    const row = sheet.getRange(rowNum, 1, 1, 38).getValues()[0];
    const dealData = normalizeFromRow(row);
    const analysis = analyzeDeal(dealData);

    updateSheetWithAnalysis(sheet, rowNum, analysis);

    SpreadsheetApp.getUi().alert(
      'Analysis Complete',
      `${analysis.vehicle}\n\n` +
      `Verdict: ${analysis.verdictEmoji} ${analysis.verdict}\n` +
      `Strategy: ${analysis.strategyLabel}\n` +
      `Overall Score: ${analysis.overallScore}\n` +
      `MAO: ${formatCurrency(analysis.mao)}\n` +
      `Profit: ${formatCurrency(analysis.profitDollars)} (${formatPercent(analysis.profitPct)})`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

    logSystem('Single Analysis', `Analyzed ${analysis.vehicle}`, {
      verdict: analysis.verdict,
      score: analysis.overallScore
    });

  } catch (error) {
    SpreadsheetApp.getUi().alert('Analysis Error', error.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
    logSystem('Analysis Error', error.toString());
  }
}

// ============================================================================
// FULL RECALCULATION
// ============================================================================

/**
 * Recalculate all deals in Master Database
 */
function recalculateAllDeals() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet(SHEETS.MASTER);

  if (!sheet) {
    ui.alert('Master Database sheet not found.');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert('No data to analyze.');
    return;
  }

  const confirm = ui.alert(
    'Recalculate All Deals',
    `This will recalculate ${lastRow - 1} deals. Continue?`,
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  try {
    const results = analyzeDealsWithLock(2, lastRow);
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    ui.alert(
      'Recalculation Complete',
      `Successfully analyzed: ${success}\nFailed: ${failed}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Error', error.toString(), ui.ButtonSet.OK);
    logSystem('Recalculation Error', error.toString());
  }
}
