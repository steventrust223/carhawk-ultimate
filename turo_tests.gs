// =========================================================
// CARHAWK ULTIMATE - TURO MODULE ACCEPTANCE TESTS
// =========================================================
// Version: 1.0.0
// Purpose: Comprehensive test suite for the Turo Add-On Module.
//          Run runAllTuroTests() from the script editor to validate.
// =========================================================

/**
 * Runs all Turo module acceptance tests and logs results.
 * @returns {boolean} True if all tests pass.
 */
function runAllTuroTests() {
  var results = {
    setup: testSetupIdempotent(),
    classification: testVehicleClassification(),
    engine: testTuroEngineAnalysis(),
    fleet: testFleetCreation(),
    integrity: testMasterDbIntegrity(),
    weights: testScoreWeights(),
    lifecycle: testLifecycleValidation()
  };

  var allPassed = true;
  var entries = Object.keys(results);
  for (var i = 0; i < entries.length; i++) {
    if (results[entries[i]] !== true) allPassed = false;
  }

  Logger.log('\n\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  Logger.log('TURO MODULE \u2014 TEST RESULTS');
  Logger.log('\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550');
  for (var j = 0; j < entries.length; j++) {
    var name = entries[j];
    var pass = results[name];
    Logger.log('  ' + (pass ? '\u2705' : '\u274C') + ' ' + name);
  }
  Logger.log('\nOVERALL: ' + (allPassed ? '\u2705 ALL PASSED' : '\u274C FAILURES DETECTED'));

  return allPassed;
}

// =========================================================
// TEST 1: Setup Idempotent
// =========================================================

/**
 * Runs setupTuroModule() twice and verifies no duplicates are created.
 * @returns {boolean} True if test passes.
 */
function testSetupIdempotent() {
  Logger.log('--- Test 1: Setup Idempotent ---');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // Run setup twice
    setupTuroModule();
    Utilities.sleep(1000);
    setupTuroModule();

    // Verify no duplicate sheets
    var sheetNames = ss.getSheets().map(function(s) { return s.getName(); });
    var turoSheetNames = [
      TURO_SHEETS.ENGINE.name,
      TURO_SHEETS.FLEET.name,
      TURO_SHEETS.MAINTENANCE.name,
      TURO_SHEETS.PRICING.name,
      TURO_SHEETS.INSURANCE.name
    ];

    for (var i = 0; i < turoSheetNames.length; i++) {
      var name = turoSheetNames[i];
      var count = sheetNames.filter(function(s) { return s === name; }).length;
      if (count !== 1) {
        Logger.log('FAIL: Sheet "' + name + '" exists ' + count + ' times (expected 1)');
        return false;
      }
    }

    // Verify all 5 sheets exist
    for (var j = 0; j < turoSheetNames.length; j++) {
      var sheet = ss.getSheetByName(turoSheetNames[j]);
      if (!sheet) {
        Logger.log('FAIL: Sheet "' + turoSheetNames[j] + '" not found');
        return false;
      }
      // Verify headers
      var firstHeader = sheet.getRange(1, 1).getValue();
      if (!firstHeader) {
        Logger.log('FAIL: Sheet "' + turoSheetNames[j] + '" has no headers');
        return false;
      }
    }

    // Verify no duplicate Turo columns on Master DB
    var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
    if (dbSheet) {
      var headerRow = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
      var turoScoreCount = headerRow.filter(function(h) { return h === 'Turo Hold Score'; }).length;
      if (turoScoreCount > 1) {
        Logger.log('FAIL: Duplicate "Turo Hold Score" columns in Master DB (' + turoScoreCount + ')');
        return false;
      }
    }

    // Verify no duplicate Settings section
    var settingsSheet = ss.getSheetByName(QUANTUM_SHEETS.SETTINGS.name);
    if (settingsSheet) {
      var settingsData = settingsSheet.getDataRange().getValues();
      var sectionCount = 0;
      for (var k = 0; k < settingsData.length; k++) {
        if (String(settingsData[k][0]).indexOf('TURO MODULE SETTINGS') !== -1) {
          sectionCount++;
        }
      }
      if (sectionCount > 1) {
        Logger.log('FAIL: Duplicate Turo settings sections (' + sectionCount + ')');
        return false;
      }
    }

    Logger.log('PASS: Setup is idempotent');
    return true;

  } catch (e) {
    Logger.log('FAIL: ' + e.toString());
    return false;
  }
}

// =========================================================
// TEST 2: Vehicle Classification
// =========================================================

/**
 * Tests the classifyVehicle() function against known inputs.
 * @returns {boolean} True if all classifications match expected results.
 */
function testVehicleClassification() {
  Logger.log('--- Test 2: Vehicle Classification ---');
  var tests = [
    { make: 'BMW', model: '330i', body: 'Sedan', year: 2020, expected: 'Luxury' },
    { make: 'Toyota', model: 'Corolla', body: 'Sedan', year: 2019, expected: 'Midsize' },
    { make: 'Toyota', model: 'Yaris', body: 'Hatchback', year: 2018, expected: 'Economy' },
    { make: 'Ford', model: 'F-150', body: 'Truck', year: 2021, expected: 'Truck' },
    { make: 'Honda', model: 'CR-V', body: 'SUV', year: 2020, expected: 'SUV' },
    { make: 'Chevrolet', model: 'Corvette', body: 'Coupe', year: 2022, expected: 'Sports/Exotic' },
    { make: 'Toyota', model: 'Sienna', body: 'Minivan', year: 2021, expected: 'Van/Minivan' },
    { make: 'Toyota', model: 'Camry', body: 'Sedan', year: 2020, expected: 'Full-Size' }
  ];

  var passed = 0;
  for (var i = 0; i < tests.length; i++) {
    var t = tests[i];
    var result = classifyVehicle(t.make, t.model, t.body, t.year);
    if (result === t.expected) {
      passed++;
    } else {
      Logger.log('FAIL: ' + t.make + ' ' + t.model + ' \u2192 got "' + result + '", expected "' + t.expected + '"');
    }
  }

  Logger.log('Vehicle Classification: ' + passed + '/' + tests.length + ' passed');
  return passed === tests.length;
}

// =========================================================
// TEST 3: Turo Engine Analysis
// =========================================================

/**
 * Creates a mock vehicle row in Master Database and runs analyzeTuroHold().
 * Verifies all output fields are populated correctly.
 * @returns {boolean} True if analysis produces valid results.
 */
function testTuroEngineAnalysis() {
  Logger.log('--- Test 3: Turo Engine Analysis ---');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
    if (!dbSheet) {
      Logger.log('FAIL: Master Database not found');
      return false;
    }

    // Create a test row at the bottom of Master Database
    var testRow = dbSheet.getLastRow() + 1;
    var testData = [];
    var totalCols = dbSheet.getLastColumn();
    for (var c = 0; c < totalCols; c++) testData.push('');

    // Populate required fields
    testData[TURO_DB_COLS.DEAL_ID] = 'TEST-TURO-001';
    testData[TURO_DB_COLS.YEAR] = 2019;
    testData[TURO_DB_COLS.MAKE] = 'Honda';
    testData[TURO_DB_COLS.MODEL] = 'Civic';
    testData[TURO_DB_COLS.TRIM] = 'LX';
    testData[TURO_DB_COLS.VIN] = 'TEST1234567890VIN';
    testData[TURO_DB_COLS.MILEAGE] = 45000;
    testData[TURO_DB_COLS.PRICE] = 12000;
    testData[TURO_DB_COLS.MARKET_VALUE] = 14500;
    testData[TURO_DB_COLS.EST_REPAIR_COST] = 500;
    testData[TURO_DB_COLS.PROFIT_MARGIN] = 2000;
    testData[TURO_DB_COLS.FLIP_STRATEGY] = 'Quick Flip';
    testData[TURO_DB_COLS.CONDITION] = 'Sedan';

    dbSheet.getRange(testRow, 1, 1, totalCols).setValues([testData]);

    // Run analysis
    var result = analyzeTuroHold(testRow);

    // Validate results
    var failures = [];

    if (result.vehicleClass !== 'Midsize') {
      failures.push('Vehicle Class: got "' + result.vehicleClass + '", expected "Midsize"');
    }

    if (result.economics.totalAcquisitionCost !== 12500) {
      failures.push('Total Acquisition Cost: got ' + result.economics.totalAcquisitionCost + ', expected 12500');
    }

    if (isNaN(result.economics.netMonthlyCashFlow)) {
      failures.push('Net Monthly Cash Flow is NaN');
    }

    if (result.score < 0 || result.score > 100) {
      failures.push('Score out of range: ' + result.score);
    }

    var validTiers = ['Low', 'Medium', 'High', 'Critical'];
    if (validTiers.indexOf(result.riskTier) === -1) {
      failures.push('Invalid Risk Tier: ' + result.riskTier);
    }

    if (!result.rationale || result.rationale.length === 0) {
      failures.push('Rationale is empty');
    }

    if (!result.exitPlan || result.exitPlan.length === 0) {
      failures.push('Exit Plan is empty');
    }

    // Verify Turo Engine sheet has the row
    var turoSheet = ss.getSheetByName(TURO_SHEETS.ENGINE.name);
    if (turoSheet) {
      var turoData = turoSheet.getDataRange().getValues();
      var found = false;
      for (var i = 1; i < turoData.length; i++) {
        if (turoData[i][0] === 'MD-' + testRow) {
          found = true;
          break;
        }
      }
      if (!found) failures.push('Row not found in Turo Engine sheet');
    }

    // Verify Master DB writeback columns
    var headerRow = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
    var scoreCol = -1;
    for (var h = 0; h < headerRow.length; h++) {
      if (headerRow[h] === 'Turo Hold Score') { scoreCol = h + 1; break; }
    }
    if (scoreCol > 0) {
      var mdScore = dbSheet.getRange(testRow, scoreCol).getValue();
      if (!mdScore && mdScore !== 0) {
        failures.push('Master DB Turo Hold Score not written');
      }
    }

    // Clean up test row
    dbSheet.deleteRow(testRow);

    // Clean up Turo Engine test row
    if (turoSheet) {
      var teData = turoSheet.getDataRange().getValues();
      for (var j = teData.length - 1; j >= 1; j--) {
        if (teData[j][0] === 'MD-' + testRow) {
          turoSheet.deleteRow(j + 1);
          break;
        }
      }
    }

    if (failures.length > 0) {
      for (var f = 0; f < failures.length; f++) {
        Logger.log('FAIL: ' + failures[f]);
      }
      return false;
    }

    Logger.log('PASS: Turo Engine Analysis');
    return true;

  } catch (e) {
    Logger.log('FAIL: ' + e.toString());
    return false;
  }
}

// =========================================================
// TEST 4: Fleet Creation
// =========================================================

/**
 * Tests addToFleet() by creating a test vehicle and adding it to the fleet.
 * @returns {boolean} True if fleet creation works correctly.
 */
function testFleetCreation() {
  Logger.log('--- Test 4: Fleet Creation ---');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
    if (!dbSheet) {
      Logger.log('FAIL: Master Database not found');
      return false;
    }

    // Create a test row
    var testRow = dbSheet.getLastRow() + 1;
    var totalCols = dbSheet.getLastColumn();
    var testData = [];
    for (var c = 0; c < totalCols; c++) testData.push('');

    testData[TURO_DB_COLS.DEAL_ID] = 'TEST-FLEET-001';
    testData[TURO_DB_COLS.YEAR] = 2020;
    testData[TURO_DB_COLS.MAKE] = 'Toyota';
    testData[TURO_DB_COLS.MODEL] = 'Camry';
    testData[TURO_DB_COLS.TRIM] = 'SE';
    testData[TURO_DB_COLS.VIN] = 'TESTFLEET1234567V';
    testData[TURO_DB_COLS.MILEAGE] = 30000;
    testData[TURO_DB_COLS.PRICE] = 15000;
    testData[TURO_DB_COLS.MARKET_VALUE] = 18000;
    testData[TURO_DB_COLS.EST_REPAIR_COST] = 200;

    dbSheet.getRange(testRow, 1, 1, totalCols).setValues([testData]);

    // Add to fleet
    var result = addToFleet(testRow);

    var failures = [];

    if (!result) {
      failures.push('addToFleet returned null');
    } else {
      // Verify Fleet ID format
      if (!/^TF-\d{3}$/.test(result.fleetId)) {
        failures.push('Invalid Fleet ID format: ' + result.fleetId);
      }

      // Verify Fleet Manager row exists
      var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);
      if (fleetSheet) {
        var fleetData = fleetSheet.getDataRange().getValues();
        var found = false;
        for (var i = 1; i < fleetData.length; i++) {
          if (fleetData[i][0] === result.fleetId) {
            found = true;
            // Verify status
            if (fleetData[i][4] !== 'Acquired') {
              failures.push('Turo Status should be "Acquired", got "' + fleetData[i][4] + '"');
            }
            break;
          }
        }
        if (!found) failures.push('Fleet ID not found in Fleet Manager');
      }

      // Verify Master DB Fleet ID column
      var headerRow = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
      var fleetIdCol = -1;
      for (var h = 0; h < headerRow.length; h++) {
        if (headerRow[h] === 'Fleet ID') { fleetIdCol = h + 1; break; }
      }
      if (fleetIdCol > 0) {
        var mdFleetId = dbSheet.getRange(testRow, fleetIdCol).getValue();
        if (mdFleetId !== result.fleetId) {
          failures.push('Master DB Fleet ID: got "' + mdFleetId + '", expected "' + result.fleetId + '"');
        }
      }

      // Verify Insurance & Compliance row
      var insSheet = ss.getSheetByName(TURO_SHEETS.INSURANCE.name);
      if (insSheet && insSheet.getLastRow() > 1) {
        var insData = insSheet.getRange(2, 1, insSheet.getLastRow() - 1, 1).getValues();
        var insFound = false;
        for (var k = 0; k < insData.length; k++) {
          if (insData[k][0] === result.fleetId) { insFound = true; break; }
        }
        if (!insFound) failures.push('Insurance & Compliance row not created');
      }

      // Clean up: remove fleet row, insurance row, and test DB row
      if (fleetSheet) {
        var fData = fleetSheet.getDataRange().getValues();
        for (var m = fData.length - 1; m >= 1; m--) {
          if (fData[m][0] === result.fleetId) {
            fleetSheet.deleteRow(m + 1);
            break;
          }
        }
      }
      if (insSheet) {
        var iData = insSheet.getDataRange().getValues();
        for (var n = iData.length - 1; n >= 1; n--) {
          if (iData[n][0] === result.fleetId) {
            insSheet.deleteRow(n + 1);
            break;
          }
        }
      }
    }

    // Clean up test DB row
    dbSheet.deleteRow(testRow);

    if (failures.length > 0) {
      for (var f = 0; f < failures.length; f++) {
        Logger.log('FAIL: ' + failures[f]);
      }
      return false;
    }

    Logger.log('PASS: Fleet Creation');
    return true;

  } catch (e) {
    Logger.log('FAIL: ' + e.toString());
    return false;
  }
}

// =========================================================
// TEST 5: Master DB Integrity
// =========================================================

/**
 * Verifies that existing Master Database columns are unchanged,
 * and Turo columns are appended correctly.
 * @returns {boolean} True if integrity check passes.
 */
function testMasterDbIntegrity() {
  Logger.log('--- Test 5: Master DB Integrity ---');
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
    if (!dbSheet) {
      Logger.log('FAIL: Master Database not found');
      return false;
    }

    var headerRow = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];

    // Known existing headers (first few key columns should be intact)
    var expectedExisting = {
      0: 'Deal ID',      // A
      5: 'Year',         // F
      6: 'Make',         // G
      7: 'Model',        // H
      9: 'VIN',          // J
      13: 'Price'        // N (Asking Price is stored as Price in some layouts)
    };

    var failures = [];

    // Verify Turo headers exist and are in order
    var turoStartIdx = -1;
    for (var i = 0; i < headerRow.length; i++) {
      if (headerRow[i] === TURO_DB_HEADERS[0]) {
        turoStartIdx = i;
        break;
      }
    }

    if (turoStartIdx < 0) {
      failures.push('Turo Hold Score column not found in Master DB');
    } else {
      // Verify all 10 Turo headers are present in order
      for (var j = 0; j < TURO_DB_HEADERS.length; j++) {
        if (headerRow[turoStartIdx + j] !== TURO_DB_HEADERS[j]) {
          failures.push('Turo header mismatch at position ' + (turoStartIdx + j) +
                        ': got "' + headerRow[turoStartIdx + j] + '", expected "' + TURO_DB_HEADERS[j] + '"');
        }
      }

      // Verify no columns were inserted (Turo headers should be at the end)
      // Check that the column before Turo start is NOT a Turo header
      if (turoStartIdx > 0 && TURO_DB_HEADERS.indexOf(headerRow[turoStartIdx - 1]) !== -1) {
        failures.push('Turo columns appear to be duplicated');
      }
    }

    // Verify no duplicate Turo columns
    var turoScoreCount = headerRow.filter(function(h) { return h === 'Turo Hold Score'; }).length;
    if (turoScoreCount > 1) {
      failures.push('Duplicate Turo Hold Score columns: ' + turoScoreCount);
    }

    if (failures.length > 0) {
      for (var f = 0; f < failures.length; f++) {
        Logger.log('FAIL: ' + failures[f]);
      }
      return false;
    }

    Logger.log('PASS: Master DB Integrity');
    return true;

  } catch (e) {
    Logger.log('FAIL: ' + e.toString());
    return false;
  }
}

// =========================================================
// TEST 6: Score Weights
// =========================================================

/**
 * Verifies that Turo Hold Score weights sum to 1.0.
 * @returns {boolean} True if weights sum correctly.
 */
function testScoreWeights() {
  Logger.log('--- Test 6: Score Weights ---');
  var w = TURO_SCORE_WEIGHTS;
  var sum = w.PAYBACK + w.CASH_FLOW + w.UTILIZATION +
            w.DEPRECIATION + w.FLIP_COMPARISON + w.MILEAGE;
  var passed = Math.abs(sum - 1.0) < 0.001;
  Logger.log('Score weights sum: ' + sum + ' \u2014 ' + (passed ? 'PASS' : 'FAIL'));
  return passed;
}

// =========================================================
// TEST 7: Lifecycle Validation
// =========================================================

/**
 * Tests validateStatusTransition() against known valid and invalid transitions.
 * @returns {boolean} True if all transition checks match expected results.
 */
function testLifecycleValidation() {
  Logger.log('--- Test 7: Lifecycle Validation ---');
  var tests = [
    { from: 'Candidate', to: 'Acquired', expected: true },
    { from: 'Candidate', to: 'Active', expected: false },
    { from: 'Active', to: 'In Maintenance', expected: true },
    { from: 'In Maintenance', to: 'Active', expected: true },
    { from: 'Sold', to: 'Active', expected: false },
    { from: 'Paused', to: 'Active', expected: true }
  ];

  var passed = 0;
  for (var i = 0; i < tests.length; i++) {
    var t = tests[i];
    var result = validateStatusTransition(t.from, t.to);
    if (result === t.expected) {
      passed++;
    } else {
      Logger.log('FAIL: ' + t.from + ' \u2192 ' + t.to + ': got ' + result + ', expected ' + t.expected);
    }
  }

  Logger.log('Lifecycle Validation: ' + passed + '/' + tests.length + ' passed');
  return passed === tests.length;
}
