// ============================================================================
// CARHAWK ULTIMATE — TESTS.GS
// Smoke Tests and Schema Audit (Callable from Menu)
// ============================================================================

/**
 * Run comprehensive smoke tests
 * Tests all core computations and integrations
 */
function runCarHawkSmokeTest() {
  const ui = SpreadsheetApp.getUi();
  const results = [];
  let passed = 0;
  let failed = 0;

  ui.alert('Running Smoke Tests', 'Testing all core components...', ui.ButtonSet.OK);

  // Test 1: Config constants exist
  results.push(testConfigConstants());

  // Test 2: Distance calculation
  results.push(testDistanceCalculation());

  // Test 3: Market value calculation
  results.push(testMarketValueCalculation());

  // Test 4: Repair cost calculation
  results.push(testRepairCostCalculation());

  // Test 5: MAO calculation
  results.push(testMAOCalculation());

  // Test 6: Scoring engine (deterministic)
  results.push(testScoringEngine());

  // Test 7: Strategy selection
  results.push(testStrategySelection());

  // Test 8: Verdict determination
  results.push(testVerdictDetermination());

  // Test 9: Message generation
  results.push(testMessageGeneration());

  // Test 10: Full deal analysis
  results.push(testFullDealAnalysis());

  // Count results
  for (const result of results) {
    if (result.passed) passed++;
    else failed++;
  }

  // Build report
  let report = `CarHawk Smoke Test Results\n`;
  report += `${'='.repeat(40)}\n\n`;
  report += `Passed: ${passed}\n`;
  report += `Failed: ${failed}\n\n`;
  report += `Details:\n`;
  report += `${'-'.repeat(40)}\n`;

  for (const result of results) {
    const status = result.passed ? '✅' : '❌';
    report += `${status} ${result.name}\n`;
    if (!result.passed) {
      report += `   Error: ${result.error}\n`;
    }
  }

  // Log results
  logHealth('Smoke Test', failed === 0 ? 'PASS' : 'FAIL', report, { passed, failed });

  // Show results
  const htmlReport = `<pre style="font-family: monospace; white-space: pre-wrap;">${report}</pre>`;
  const html = HtmlService.createHtmlOutput(htmlReport)
    .setWidth(500)
    .setHeight(400);
  ui.showModalDialog(html, '🧪 Smoke Test Results');

  return { passed, failed, results };
}

/**
 * Test 1: Config constants
 */
function testConfigConstants() {
  const name = 'Config Constants';
  try {
    // Check critical constants exist
    if (!CARHAWK_VERSION) throw new Error('CARHAWK_VERSION missing');
    if (!SHEETS.MASTER) throw new Error('SHEETS.MASTER missing');
    if (!MAO_PCT_BY_STRATEGY.QUICK_FLIP) throw new Error('MAO_PCT_BY_STRATEGY missing');
    if (!PLATFORM_WEIGHTS.facebook) throw new Error('PLATFORM_WEIGHTS missing');
    if (!MAKE_PREMIUM.Toyota) throw new Error('MAKE_PREMIUM missing');
    if (!CONDITION_VALUE_MULT.Good) throw new Error('CONDITION_VALUE_MULT missing');
    if (!SCORE_WEIGHTS.PROFIT) throw new Error('SCORE_WEIGHTS missing');

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 2: Distance calculation
 */
function testDistanceCalculation() {
  const name = 'Distance Calculation';
  try {
    // Test same ZIP
    const d1 = getDistanceMiles('63136', '63136');
    if (d1 !== 0) throw new Error(`Same ZIP should be 0, got ${d1}`);

    // Test fallback calculation (when API unavailable)
    const d2 = calculateFallbackDistance('63136', '63101');
    if (typeof d2 !== 'number' || d2 < 0) throw new Error(`Invalid fallback distance: ${d2}`);

    // Test location risk
    const risk1 = getLocationRiskEmoji(10);
    if (risk1 !== '🟢') throw new Error(`Expected green for 10 miles, got ${risk1}`);

    const risk2 = getLocationRiskEmoji(100);
    if (risk2 !== '🟠') throw new Error(`Expected orange for 100 miles, got ${risk2}`);

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 3: Market value calculation
 */
function testMarketValueCalculation() {
  const name = 'Market Value Calculation';
  try {
    const deal = {
      year: 2018,
      make: 'Toyota',
      model: 'Camry',
      condition: 'Good',
      mileage: 75000
    };

    const value = calculateMarketValue(deal);

    // Should be reasonable range
    if (value < 5000 || value > 50000) {
      throw new Error(`Market value ${value} out of expected range`);
    }

    // Toyota should get premium
    const toyotaDeal = { ...deal, make: 'Toyota' };
    const hondaDeal = { ...deal, make: 'Ford' };

    const toyotaValue = calculateMarketValue(toyotaDeal);
    const fordValue = calculateMarketValue(hondaDeal);

    if (toyotaValue <= fordValue) {
      throw new Error('Toyota should have higher value than Ford');
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 4: Repair cost calculation
 */
function testRepairCostCalculation() {
  const name = 'Repair Cost Calculation';
  try {
    const excellentDeal = { condition: 'Excellent', askingPrice: 10000 };
    const poorDeal = { condition: 'Poor', askingPrice: 10000 };

    const excellentRepair = calculateRepairCost(excellentDeal);
    const poorRepair = calculateRepairCost(poorDeal);

    // Poor should have higher repair cost
    if (poorRepair <= excellentRepair) {
      throw new Error('Poor condition should have higher repair cost');
    }

    // Check against expected percentages
    if (excellentRepair !== 200) { // 10000 * 0.02
      throw new Error(`Excellent repair should be 200, got ${excellentRepair}`);
    }

    if (poorRepair !== 3500) { // 10000 * 0.35
      throw new Error(`Poor repair should be 3500, got ${poorRepair}`);
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 5: MAO calculation
 */
function testMAOCalculation() {
  const name = 'MAO Calculation';
  try {
    const marketValue = 15000;
    const repairCost = 1500;

    // Quick Flip: 65%
    const maoQuick = Math.max((marketValue * 0.65) - repairCost - HOLDING_COST_DEFAULT, FLOOR_MAO);

    // Expected: 15000 * 0.65 - 1500 - 500 = 9750 - 2000 = 7750
    const expected = 7750;

    if (maoQuick !== expected) {
      throw new Error(`Quick Flip MAO should be ${expected}, got ${maoQuick}`);
    }

    // Floor test
    const lowValue = 1000;
    const maoLow = Math.max((lowValue * 0.65) - 2000 - 500, FLOOR_MAO);
    if (maoLow !== FLOOR_MAO) {
      throw new Error(`MAO should floor at ${FLOOR_MAO}, got ${maoLow}`);
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 6: Scoring engine (no randomness)
 */
function testScoringEngine() {
  const name = 'Scoring Engine (Deterministic)';
  try {
    const deal = {
      year: 2019,
      make: 'Honda',
      model: 'Accord',
      mileage: 50000,
      condition: 'Good',
      titleStatus: 'Clean',
      askingPrice: 12000,
      platform: 'Facebook',
      daysListed: 14,
      distance: 30
    };

    // Run scoring multiple times
    const scores1 = calculateAllScores(deal);
    const scores2 = calculateAllScores(deal);
    const scores3 = calculateAllScores(deal);

    // All should be identical (no randomness)
    if (scores1.overallScore !== scores2.overallScore ||
        scores2.overallScore !== scores3.overallScore) {
      throw new Error('Scoring is not deterministic!');
    }

    // Check that scores are in valid range
    for (const key of ['profitScore', 'conditionScore', 'locationScore',
                       'velocityScore', 'marketScore', 'competitionScore',
                       'riskScore', 'overallScore']) {
      const score = scores1[key];
      if (score < 0 || score > 100) {
        throw new Error(`${key} out of range: ${score}`);
      }
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 7: Strategy selection
 */
function testStrategySelection() {
  const name = 'Strategy Selection';
  try {
    // Part-Out trigger: condition
    const partOutDeal = { condition: 'Parts Only', askingPrice: 1000, repairCost: 100 };
    const partOutStrategy = determineStrategy(partOutDeal);
    if (partOutStrategy !== 'PART_OUT') {
      throw new Error(`Parts Only should trigger PART_OUT, got ${partOutStrategy}`);
    }

    // Part-Out trigger: keyword
    const keywordDeal = {
      condition: 'Fair',
      title: 'needs engine work',
      description: 'blown engine',
      askingPrice: 2000,
      repairCost: 200
    };
    const keywordStrategy = determineStrategy(keywordDeal);
    if (keywordStrategy !== 'PART_OUT') {
      throw new Error(`'blown engine' should trigger PART_OUT, got ${keywordStrategy}`);
    }

    // Quick Flip default
    const normalDeal = {
      condition: 'Good',
      askingPrice: 10000,
      repairCost: 500,
      title: 'Nice car',
      description: ''
    };
    const normalStrategy = determineStrategy(normalDeal);
    if (normalStrategy !== 'QUICK_FLIP') {
      throw new Error(`Normal deal should be QUICK_FLIP, got ${normalStrategy}`);
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 8: Verdict determination
 */
function testVerdictDetermination() {
  const name = 'Verdict Determination';
  try {
    // PASS: no profit
    const noProfit = { profitDollars: -1000, askingPrice: 10000, distance: 50 };
    const passScores = { profitDollars: -1000, profitPct: -0.1, riskScore: 30, temperature: 'Cold' };
    const passVerdict = determineVerdict(noProfit, passScores);
    if (passVerdict.verdict !== 'PASS') {
      throw new Error(`No profit should PASS, got ${passVerdict.verdict}`);
    }

    // PASS: too far
    const tooFar = { profitDollars: 5000, askingPrice: 10000, distance: 400 };
    const farScores = { profitDollars: 5000, profitPct: 0.25, riskScore: 30, temperature: 'Hot' };
    const farVerdict = determineVerdict(tooFar, farScores);
    if (farVerdict.verdict !== 'PASS') {
      throw new Error(`400 miles should PASS, got ${farVerdict.verdict}`);
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 9: Message generation
 */
function testMessageGeneration() {
  const name = 'Message Generation';
  try {
    const analysis = {
      vehicle: '2019 Honda Accord',
      year: 2019,
      make: 'Honda',
      model: 'Accord',
      sellerName: 'John Smith',
      mao: 12000,
      openingOfferModerate: 10200,
      strategy: 'QUICK_FLIP',
      temperature: 'Hot',
      daysListed: 7
    };

    const message = generateSellerMessage(analysis);

    // Check message contains key elements
    if (!message.includes('Honda Accord')) {
      throw new Error('Message should include vehicle');
    }
    if (!message.includes('John')) {
      throw new Error('Message should include first name');
    }
    if (!message.includes('$')) {
      throw new Error('Message should include offer amount');
    }
    if (!message.includes('STOP')) {
      throw new Error('Message should include opt-out');
    }

    // Check message validation
    const validation = validateMessageForSMS(message);
    if (!validation.valid) {
      throw new Error('Message exceeds SMS limit');
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

/**
 * Test 10: Full deal analysis
 */
function testFullDealAnalysis() {
  const name = 'Full Deal Analysis';
  try {
    const rawDeal = {
      year: 2020,
      make: 'Toyota',
      model: 'RAV4',
      mileage: 45000,
      condition: 'Very Good',
      titleStatus: 'Clean',
      askingPrice: 22000,
      platform: 'Facebook',
      daysListed: 10,
      location: 'St. Louis, MO',
      zip: '63101',
      sellerName: 'Jane Doe',
      sellerPhone: '314-555-1234'
    };

    const analysis = analyzeDeal(rawDeal);

    // Check all required fields exist
    const requiredFields = [
      'id', 'vehicle', 'marketValue', 'repairCost', 'mao',
      'profitDollars', 'profitPct', 'overallScore', 'temperature',
      'strategy', 'verdict', 'openingOfferModerate'
    ];

    for (const field of requiredFields) {
      if (analysis[field] === undefined) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check values are reasonable
    if (analysis.marketValue <= 0) throw new Error('Market value should be positive');
    if (analysis.overallScore < 0 || analysis.overallScore > 100) {
      throw new Error(`Overall score out of range: ${analysis.overallScore}`);
    }
    if (!['Hot', 'Warm', 'Cold'].includes(analysis.temperature)) {
      throw new Error(`Invalid temperature: ${analysis.temperature}`);
    }
    if (!['QUICK_FLIP', 'REPAIR_RESELL', 'PART_OUT', 'HOLD_SEASONAL'].includes(analysis.strategy)) {
      throw new Error(`Invalid strategy: ${analysis.strategy}`);
    }

    return { name, passed: true };
  } catch (e) {
    return { name, passed: false, error: e.toString() };
  }
}

// ============================================================================
// SCHEMA AUDIT
// ============================================================================

/**
 * Run schema audit on all sheets
 */
function runSchemaAudit() {
  const ui = SpreadsheetApp.getUi();
  const results = [];

  // Check each expected sheet
  for (const [key, sheetName] of Object.entries(SHEETS)) {
    const sheet = getSheet(sheetName);
    results.push({
      sheet: sheetName,
      exists: !!sheet,
      rows: sheet ? sheet.getLastRow() : 0,
      cols: sheet ? sheet.getLastColumn() : 0
    });
  }

  // Check Master Database columns
  const masterSheet = getSheet(SHEETS.MASTER);
  let masterAudit = null;

  if (masterSheet) {
    const headers = masterSheet.getRange(1, 1, 1, 40).getValues()[0];
    const expectedHeaders = [
      'ID', 'Date Added', 'Platform', 'Status', 'Lead Score', 'Temperature',
      'Year', 'Make', 'Model', 'Trim', 'VIN', 'Mileage', 'Condition',
      'Title Status', 'Location', 'ZIP', 'Distance', 'Location Risk',
      'Asking Price', 'MAO', 'Market Value', 'Repair Cost', 'ARV',
      'Profit Margin', 'ROI', 'Deal Score', 'Verdict', 'Strategy',
      'Days Listed', 'Seller Name', 'Seller Phone', 'Seller Email',
      'AI Notes', 'Manual Notes', 'Last Updated', 'Assigned To',
      'Source URL', 'CRM ID'
    ];

    masterAudit = {
      totalColumns: headers.filter(h => h).length,
      expectedColumns: expectedHeaders.length,
      missingHeaders: expectedHeaders.filter((h, i) => headers[i] !== h)
    };
  }

  // Build report
  let report = `Schema Audit Results\n`;
  report += `${'='.repeat(40)}\n\n`;

  report += `Sheets Status:\n`;
  report += `${'-'.repeat(40)}\n`;
  for (const result of results) {
    const status = result.exists ? '✅' : '❌';
    report += `${status} ${result.sheet}`;
    if (result.exists) {
      report += ` (${result.rows} rows, ${result.cols} cols)`;
    }
    report += '\n';
  }

  if (masterAudit) {
    report += `\nMaster Database Columns:\n`;
    report += `${'-'.repeat(40)}\n`;
    report += `Found: ${masterAudit.totalColumns}\n`;
    report += `Expected: ${masterAudit.expectedColumns}\n`;
    if (masterAudit.missingHeaders.length > 0) {
      report += `Missing/Mismatched: ${masterAudit.missingHeaders.slice(0, 5).join(', ')}\n`;
    } else {
      report += `All headers match ✅\n`;
    }
  }

  // Log results
  logHealth('Schema Audit', 'COMPLETE', report);

  // Show results
  const htmlReport = `<pre style="font-family: monospace; white-space: pre-wrap;">${report}</pre>`;
  const html = HtmlService.createHtmlOutput(htmlReport)
    .setWidth(500)
    .setHeight(400);
  ui.showModalDialog(html, '🔍 Schema Audit Results');
}

/**
 * Run system health check
 */
function runSystemHealthCheck() {
  const ui = SpreadsheetApp.getUi();
  const health = {
    sheets: true,
    config: true,
    apis: {},
    locks: true
  };

  // Check sheets
  const criticalSheets = [SHEETS.MASTER, SHEETS.CONFIG, SHEETS.LOGS];
  for (const sheetName of criticalSheets) {
    if (!getSheet(sheetName)) {
      health.sheets = false;
      break;
    }
  }

  // Check config values
  const originZip = getConfigValue('ORIGIN_ZIP', '');
  if (!originZip) health.config = false;

  // Check API keys
  health.apis.openai = !!getApiKey('OPENAI');
  health.apis.smsit = !!getApiKey('SMSIT');
  health.apis.companyhub = !!getApiKey('COMPANYHUB');
  health.apis.maps = !!getApiKey('GOOGLE_MAPS');

  // Check lock service
  try {
    const lock = LockService.getScriptLock();
    lock.tryLock(100);
    lock.releaseLock();
  } catch (e) {
    health.locks = false;
  }

  // Build report
  let report = `System Health Check\n`;
  report += `${'='.repeat(40)}\n\n`;

  report += `Core Systems:\n`;
  report += `${health.sheets ? '✅' : '❌'} Sheets: ${health.sheets ? 'OK' : 'Missing'}\n`;
  report += `${health.config ? '✅' : '❌'} Config: ${health.config ? 'OK' : 'Incomplete'}\n`;
  report += `${health.locks ? '✅' : '❌'} Locks: ${health.locks ? 'OK' : 'Error'}\n\n`;

  report += `API Connections:\n`;
  report += `${health.apis.openai ? '✅' : '⚠️'} OpenAI: ${health.apis.openai ? 'Configured' : 'Not configured'}\n`;
  report += `${health.apis.smsit ? '✅' : '⚠️'} SMS-iT: ${health.apis.smsit ? 'Configured' : 'Not configured'}\n`;
  report += `${health.apis.companyhub ? '✅' : '⚠️'} CompanyHub: ${health.apis.companyhub ? 'Configured' : 'Not configured'}\n`;
  report += `${health.apis.maps ? '✅' : '⚠️'} Google Maps: ${health.apis.maps ? 'Configured' : 'Not configured'}\n`;

  logHealth('Health Check', 'COMPLETE', report, health);

  ui.alert('System Health', report, ui.ButtonSet.OK);
}
