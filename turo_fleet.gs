// =========================================================
// CARHAWK ULTIMATE - TURO FLEET MANAGEMENT
// =========================================================
// Version: 1.0.0
// Purpose: Fleet Manager operations including adding vehicles,
//          refreshing financials, lifecycle validation, and tracking.
// =========================================================

/**
 * Adds a Master Database vehicle to the Fleet Manager.
 * Generates a Fleet ID, creates Fleet Manager + Insurance & Compliance rows.
 * @param {number} masterDbRow - 1-based row number in Master Database.
 * @returns {Object} Fleet entry details.
 */
function addToFleet(masterDbRow) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(15000)) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Fleet operation in progress. Please wait.', 'Turo Module', 5);
      return null;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
    if (!dbSheet) throw new Error('Master Database not found');

    var lastCol = dbSheet.getLastColumn();
    var rowData = dbSheet.getRange(masterDbRow, 1, 1, lastCol).getValues()[0];

    // Extract vehicle info
    var year = rowData[TURO_DB_COLS.YEAR];
    var make = rowData[TURO_DB_COLS.MAKE];
    var model = rowData[TURO_DB_COLS.MODEL];
    var trim = rowData[TURO_DB_COLS.TRIM] || '';
    var vin = rowData[TURO_DB_COLS.VIN] || '';
    var vehicleName = year + ' ' + make + ' ' + model;
    if (trim) vehicleName += ' ' + trim;
    var vehicleClass = classifyVehicle(make, model, '', year);
    var acquisitionCost = (parseFloat(rowData[TURO_DB_COLS.PRICE]) || 0) +
                          (parseFloat(rowData[TURO_DB_COLS.EST_REPAIR_COST]) || 0);

    // Check if already in fleet
    var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);
    if (!fleetSheet) throw new Error('Fleet Manager sheet not found. Run setupTuroModule() first.');

    if (fleetSheet.getLastRow() > 1) {
      var existingVins = fleetSheet.getRange(2, 2, fleetSheet.getLastRow() - 1, 1).getValues();
      for (var i = 0; i < existingVins.length; i++) {
        if (existingVins[i][0] === vin && vin !== '') {
          ss.toast('Vehicle already in fleet: ' + vehicleName, 'Turo Module', 5);
          return null;
        }
      }
    }

    // Generate Fleet ID (TF-NNN)
    var fleetId = generateFleetId_(fleetSheet);

    // Get pricing defaults for initial daily rate
    var defaults = getPricingDefaults(vehicleClass);
    var today = new Date();

    // Build Fleet Manager row (26 columns)
    var fleetRow = [
      fleetId,             // Fleet ID
      vin,                 // VIN
      vehicleName,         // Vehicle
      vehicleClass,        // Vehicle Class
      TURO_STATUSES.ACQUIRED, // Turo Status
      today,               // Date Acquired
      '',                  // Date Listed on Turo
      acquisitionCost,     // Acquisition Cost
      0,                   // Total Revenue to Date
      0,                   // Total Expenses to Date
      0,                   // Net Profit to Date
      0,                   // ROI to Date %
      0,                   // Months Active
      0,                   // Avg Monthly Revenue
      0,                   // Avg Monthly Net
      0,                   // Utilization to Date %
      0,                   // Trips to Date
      0,                   // Avg Trip Length
      defaults.dailyRate,  // Current Daily Rate
      defaults.insurance,  // Monthly Insurance
      '',                  // Last Service Date
      '',                  // Next Service Due
      rowData[TURO_DB_COLS.MARKET_VALUE] || 0, // Current Estimated Value
      '',                  // Projected Payoff Date
      '',                  // On Track?
      ''                   // Fleet Notes
    ];

    fleetSheet.appendRow(fleetRow);

    // Apply formatting to the new row
    var newRow = fleetSheet.getLastRow();
    fleetSheet.getRange(newRow, 8).setNumberFormat('$#,##0.00');   // Acquisition Cost
    fleetSheet.getRange(newRow, 9).setNumberFormat('$#,##0.00');   // Revenue
    fleetSheet.getRange(newRow, 10).setNumberFormat('$#,##0.00');  // Expenses
    fleetSheet.getRange(newRow, 11).setNumberFormat('$#,##0.00');  // Net Profit
    fleetSheet.getRange(newRow, 12).setNumberFormat('0.0%');       // ROI %
    fleetSheet.getRange(newRow, 14).setNumberFormat('$#,##0.00');  // Avg Monthly Rev
    fleetSheet.getRange(newRow, 15).setNumberFormat('$#,##0.00');  // Avg Monthly Net
    fleetSheet.getRange(newRow, 16).setNumberFormat('0.0%');       // Utilization
    fleetSheet.getRange(newRow, 19).setNumberFormat('$#,##0.00');  // Daily Rate
    fleetSheet.getRange(newRow, 20).setNumberFormat('$#,##0.00');  // Insurance
    fleetSheet.getRange(newRow, 23).setNumberFormat('$#,##0.00');  // Estimated Value

    // Write Fleet ID back to Master Database
    var headerRow = dbSheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var fleetIdCol = -1;
    for (var h = 0; h < headerRow.length; h++) {
      if (headerRow[h] === 'Fleet ID') {
        fleetIdCol = h + 1;
        break;
      }
    }
    if (fleetIdCol > 0) {
      dbSheet.getRange(masterDbRow, fleetIdCol).setValue(fleetId);
    }

    // Update Turo Status on Master DB
    var turoStatusCol = -1;
    for (var s = 0; s < headerRow.length; s++) {
      if (headerRow[s] === 'Turo Status') {
        turoStatusCol = s + 1;
        break;
      }
    }
    if (turoStatusCol > 0) {
      dbSheet.getRange(masterDbRow, turoStatusCol).setValue(TURO_STATUSES.ACQUIRED);
    }

    // Create Insurance & Compliance row
    createInsuranceRow_(ss, fleetId, vehicleName);

    logTuro_('Fleet', 'INFO', 'Added to fleet: ' + fleetId + ' - ' + vehicleName);
    ss.toast('Added to fleet: ' + fleetId + ' - ' + vehicleName, 'Turo Module', 5);

    return {
      fleetId: fleetId,
      vehicle: vehicleName,
      vehicleClass: vehicleClass,
      acquisitionCost: acquisitionCost,
      status: TURO_STATUSES.ACQUIRED
    };

  } catch (e) {
    logTuro_('Fleet', 'ERROR', 'addToFleet failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Failed to add to fleet: ' + e.message, 'Turo Module Error', 5);
    return null;
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menu handler: Adds the currently selected Master Database row to the fleet.
 */
function addToFleetSelected() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var activeSheet = ss.getActiveSheet();

    if (activeSheet.getName() !== QUANTUM_SHEETS.DATABASE.name) {
      ss.toast('Please select a row in the Master Database sheet first.', 'Turo Module', 5);
      return;
    }

    var row = ss.getActiveRange().getRow();
    if (row < 2) {
      ss.toast('Please select a data row (not the header).', 'Turo Module', 5);
      return;
    }

    addToFleet(row);

  } catch (e) {
    logTuro_('Fleet', 'ERROR', 'addToFleetSelected failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Failed: ' + e.message, 'Turo Module Error', 5);
  }
}

/**
 * Generates the next Fleet ID in sequence (TF-001, TF-002, etc.).
 * @param {SpreadsheetApp.Sheet} fleetSheet - Fleet Manager sheet.
 * @returns {string} Next Fleet ID.
 * @private
 */
function generateFleetId_(fleetSheet) {
  var maxNum = 0;

  if (fleetSheet.getLastRow() > 1) {
    var ids = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i][0]);
      var match = id.match(/^TF-(\d+)$/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  var nextNum = maxNum + 1;
  var padded = ('000' + nextNum).slice(-3);
  return 'TF-' + padded;
}

/**
 * Creates a corresponding row in Insurance & Compliance for a new fleet vehicle.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @param {string} fleetId - Fleet ID.
 * @param {string} vehicleName - Vehicle display name.
 * @private
 */
function createInsuranceRow_(ss, fleetId, vehicleName) {
  var insuranceSheet = ss.getSheetByName(TURO_SHEETS.INSURANCE.name);
  if (!insuranceSheet) return;

  // Check if row already exists for this fleet ID
  if (insuranceSheet.getLastRow() > 1) {
    var existingIds = insuranceSheet.getRange(2, 1, insuranceSheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < existingIds.length; i++) {
      if (existingIds[i][0] === fleetId) return; // Already exists
    }
  }

  // Create empty Insurance & Compliance row (17 columns)
  var insuranceRow = [
    fleetId,      // Fleet ID
    vehicleName,  // Vehicle
    '',           // Registration State
    '',           // Registration Expiry
    '',           // Registration Cost
    '',           // Insurance Provider
    '',           // Insurance Policy #
    '',           // Insurance Expiry
    '',           // Insurance Monthly Premium
    '',           // Insurance Type
    '',           // Inspection Due
    'N/A',        // Inspection Status
    '',           // Emissions Due
    '',           // Annual Property Tax
    '',           // LLC/Business Entity
    'Clean',      // Title Status (default)
    ''            // Compliance Notes
  ];

  insuranceSheet.appendRow(insuranceRow);
}

// =========================================================
// FLEET REFRESH & FINANCIALS
// =========================================================

/**
 * Recalculates all computed columns in Fleet Manager for all active fleet vehicles.
 * Computes ROI, averages, estimated value, On Track? status, and projected payoff.
 */
function refreshFleetManager() {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(15000)) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Fleet refresh already running.', 'Turo Module', 5);
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);
    if (!fleetSheet || fleetSheet.getLastRow() < 2) {
      ss.toast('No fleet data to refresh.', 'Turo Module', 5);
      return;
    }

    ss.toast('Refreshing Fleet Manager...', 'Turo Module', 10);

    var data = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, FLEET_MANAGER_HEADERS.length).getValues();
    var turoSheet = ss.getSheetByName(TURO_SHEETS.ENGINE.name);

    // Build projected net map from Turo Engine
    var projectedNetMap = {};
    if (turoSheet && turoSheet.getLastRow() > 1) {
      var turoData = turoSheet.getRange(2, 1, turoSheet.getLastRow() - 1, TURO_ENGINE_HEADERS.length).getValues();
      for (var t = 0; t < turoData.length; t++) {
        var vin = turoData[t][TE_COLS.VIN];
        if (vin) {
          projectedNetMap[vin] = parseFloat(turoData[t][TE_COLS.NET_MONTHLY_CF]) || 0;
        }
      }
    }

    var today = new Date();
    var updated = 0;

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowNum = i + 2;
      var status = row[4]; // Turo Status

      // Skip terminal statuses
      if (status === TURO_STATUSES.SOLD) continue;

      var dateAcquired = row[5];
      var acquisitionCost = parseFloat(row[7]) || 0;
      var totalRevenue = parseFloat(row[8]) || 0;
      var totalExpenses = parseFloat(row[9]) || 0;
      var vin = row[1];

      // Net Profit to Date
      var netProfit = totalRevenue - totalExpenses;
      fleetSheet.getRange(rowNum, 11).setValue(netProfit);

      // ROI to Date %
      var roi = acquisitionCost > 0 ? netProfit / acquisitionCost : 0;
      fleetSheet.getRange(rowNum, 12).setValue(roi);

      // Months Active
      var monthsActive = 0;
      if (dateAcquired instanceof Date) {
        monthsActive = Math.max(0, (today.getFullYear() - dateAcquired.getFullYear()) * 12 +
                       (today.getMonth() - dateAcquired.getMonth()));
      }
      fleetSheet.getRange(rowNum, 13).setValue(monthsActive);

      // Avg Monthly Revenue
      var avgMonthlyRev = monthsActive > 0 ? totalRevenue / monthsActive : 0;
      fleetSheet.getRange(rowNum, 14).setValue(avgMonthlyRev);

      // Avg Monthly Net
      var avgMonthlyNet = monthsActive > 0 ? netProfit / monthsActive : 0;
      fleetSheet.getRange(rowNum, 15).setValue(avgMonthlyNet);

      // Current Estimated Value (depreciate from acquisition cost)
      var vehicleAge = getVehicleAge(parseInt(row[2]) || today.getFullYear()); // Year from vehicle name
      var depRate = getDepreciationRate(vehicleAge);
      var yearsActive = monthsActive / 12;
      var currentEstValue = parseFloat(row[22]) || acquisitionCost;
      if (monthsActive > 0) {
        currentEstValue = Math.max(0, currentEstValue * (1 - (depRate * yearsActive)));
      }
      fleetSheet.getRange(rowNum, 23).setValue(currentEstValue);

      // Projected Payoff Date
      if (avgMonthlyNet > 0 && acquisitionCost > netProfit) {
        var remainingPayback = (acquisitionCost - netProfit) / avgMonthlyNet;
        var payoffDate = new Date(today);
        payoffDate.setMonth(payoffDate.getMonth() + Math.ceil(remainingPayback));
        fleetSheet.getRange(rowNum, 24).setValue(payoffDate);
      }

      // On Track? indicator
      var projectedNet = projectedNetMap[vin] || 0;
      var onTrack = '';
      if (monthsActive > 0 && projectedNet !== 0) {
        var ratio = avgMonthlyNet / projectedNet;
        if (ratio > 1.10) {
          onTrack = '\u2705 Ahead';
        } else if (ratio >= 0.90) {
          onTrack = '\u26A0\uFE0F On Track';
        } else if (ratio >= 0.50) {
          onTrack = '\uD83D\uDD34 Behind';
        } else {
          onTrack = '\u274C Underwater';
        }
      } else if (monthsActive === 0) {
        onTrack = '\u2014 New';
      }
      fleetSheet.getRange(rowNum, 25).setValue(onTrack);

      updated++;
    }

    ss.toast('Fleet Manager refreshed: ' + updated + ' vehicles updated.', 'Turo Module', 5);
    logTuro_('Fleet', 'INFO', 'Fleet Manager refreshed: ' + updated + ' vehicles updated');

  } catch (e) {
    logTuro_('Fleet', 'ERROR', 'refreshFleetManager failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Fleet refresh failed: ' + e.message, 'Turo Module Error', 5);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Menu handler for updating fleet financials.
 */
function updateFleetFinancials() {
  refreshFleetManager();
}

// =========================================================
// LIFECYCLE VALIDATION
// =========================================================

/**
 * Validates whether a status transition is allowed.
 * @param {string} currentStatus - Current Turo status.
 * @param {string} newStatus - Proposed new Turo status.
 * @returns {boolean} True if transition is valid.
 */
function validateStatusTransition(currentStatus, newStatus) {
  var validNext = TURO_STATUS_TRANSITIONS[currentStatus];
  if (!validNext) return false;
  return validNext.indexOf(newStatus) !== -1;
}

/**
 * Attempts to transition a fleet vehicle to a new status.
 * @param {string} fleetId - Fleet ID.
 * @param {string} newStatus - New status to set.
 * @returns {boolean} True if transition succeeded.
 */
function transitionFleetStatus(fleetId, newStatus) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);
    if (!fleetSheet || fleetSheet.getLastRow() < 2) return false;

    var data = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, 5).getValues();
    for (var i = 0; i < data.length; i++) {
      if (data[i][0] === fleetId) {
        var currentStatus = data[i][4];
        if (!validateStatusTransition(currentStatus, newStatus)) {
          var validNext = TURO_STATUS_TRANSITIONS[currentStatus] || [];
          ss.toast(
            'Cannot change status from "' + currentStatus + '" to "' + newStatus +
            '". Valid next states: ' + validNext.join(', '),
            'Turo Module', 8
          );
          return false;
        }

        fleetSheet.getRange(i + 2, 5).setValue(newStatus);
        logTuro_('Fleet', 'INFO', fleetId + ' status changed: ' + currentStatus + ' \u2192 ' + newStatus);
        ss.toast(fleetId + ': ' + currentStatus + ' \u2192 ' + newStatus, 'Turo Module', 5);
        return true;
      }
    }

    ss.toast('Fleet ID not found: ' + fleetId, 'Turo Module', 5);
    return false;

  } catch (e) {
    logTuro_('Fleet', 'ERROR', 'transitionFleetStatus failed: ' + e.toString());
    return false;
  }
}
