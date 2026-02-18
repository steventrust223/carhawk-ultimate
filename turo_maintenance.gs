// =========================================================
// CARHAWK ULTIMATE - TURO MAINTENANCE & TURNOVER LOGGING
// =========================================================
// Version: 1.0.0
// Purpose: Maintenance event logging with HTML dialog,
//          auto-ID generation, and Fleet Manager updates.
// =========================================================

/**
 * Opens an HTML dialog for logging a maintenance event.
 * Populates Fleet ID dropdown from active fleet vehicles.
 */
function logMaintenanceEvent() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);

    // Build fleet vehicle list for dropdown
    var fleetOptions = [];
    if (fleetSheet && fleetSheet.getLastRow() > 1) {
      var fleetData = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, 3).getValues();
      for (var i = 0; i < fleetData.length; i++) {
        if (fleetData[i][0]) {
          fleetOptions.push({
            id: fleetData[i][0],
            vehicle: fleetData[i][2] || fleetData[i][0]
          });
        }
      }
    }

    if (fleetOptions.length === 0) {
      ss.toast('No fleet vehicles found. Add vehicles to the fleet first.', 'Turo Module', 5);
      return;
    }

    // Build maintenance type options
    var typeOptions = MAINTENANCE_TYPES.map(function(t) {
      return '<option value="' + t + '">' + t + '</option>';
    }).join('');

    var fleetDropdown = fleetOptions.map(function(f) {
      return '<option value="' + f.id + '">' + f.id + ' - ' + f.vehicle + '</option>';
    }).join('');

    var html = HtmlService.createHtmlOutput(
      '<style>' +
      'body { font-family: Arial, sans-serif; padding: 16px; }' +
      'label { display: block; margin-top: 12px; font-weight: bold; font-size: 13px; }' +
      'select, input, textarea { width: 100%; padding: 8px; margin-top: 4px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }' +
      'textarea { height: 60px; }' +
      '.btn { margin-top: 16px; padding: 10px 24px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }' +
      '.btn:hover { background: #F57C00; }' +
      '.btn-cancel { background: #9E9E9E; margin-left: 8px; }' +
      '.btn-cancel:hover { background: #757575; }' +
      '</style>' +
      '<h3>Log Maintenance Event</h3>' +
      '<label>Fleet Vehicle</label>' +
      '<select id="fleetId">' + fleetDropdown + '</select>' +
      '<label>Type</label>' +
      '<select id="type">' + typeOptions + '</select>' +
      '<label>Description</label>' +
      '<textarea id="description" placeholder="Describe the work performed..."></textarea>' +
      '<label>Cost ($)</label>' +
      '<input type="number" id="cost" step="0.01" value="0">' +
      '<label>Vendor</label>' +
      '<input type="text" id="vendor" placeholder="Shop or vendor name">' +
      '<label>Mileage at Service</label>' +
      '<input type="number" id="mileage" step="1">' +
      '<label>Downtime Days</label>' +
      '<input type="number" id="downtime" step="1" value="0">' +
      '<label>Next Service Type (optional)</label>' +
      '<select id="nextType"><option value="">-- None --</option>' + typeOptions + '</select>' +
      '<label>Next Service Date (optional)</label>' +
      '<input type="date" id="nextDate">' +
      '<label>Next Service Mileage (optional)</label>' +
      '<input type="number" id="nextMileage" step="1">' +
      '<label>Notes</label>' +
      '<textarea id="notes" placeholder="Additional notes..."></textarea>' +
      '<div style="margin-top:16px">' +
      '<button class="btn" onclick="submitForm()">Log Event</button>' +
      '<button class="btn btn-cancel" onclick="google.script.host.close()">Cancel</button>' +
      '</div>' +
      '<script>' +
      'function submitForm() {' +
      '  var data = {' +
      '    fleetId: document.getElementById("fleetId").value,' +
      '    type: document.getElementById("type").value,' +
      '    description: document.getElementById("description").value,' +
      '    cost: parseFloat(document.getElementById("cost").value) || 0,' +
      '    vendor: document.getElementById("vendor").value,' +
      '    mileage: parseInt(document.getElementById("mileage").value) || 0,' +
      '    downtime: parseInt(document.getElementById("downtime").value) || 0,' +
      '    nextType: document.getElementById("nextType").value,' +
      '    nextDate: document.getElementById("nextDate").value,' +
      '    nextMileage: parseInt(document.getElementById("nextMileage").value) || 0,' +
      '    notes: document.getElementById("notes").value' +
      '  };' +
      '  google.script.run.withSuccessHandler(function() {' +
      '    google.script.host.close();' +
      '  }).withFailureHandler(function(err) {' +
      '    alert("Error: " + err.message);' +
      '  }).processMaintenanceEvent(data);' +
      '}' +
      '</script>'
    )
    .setWidth(420)
    .setHeight(700);

    SpreadsheetApp.getUi().showModalDialog(html, 'Log Maintenance Event');

  } catch (e) {
    logTuro_('Maintenance', 'ERROR', 'logMaintenanceEvent dialog failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Failed to open maintenance dialog: ' + e.message, 'Turo Module Error', 5);
  }
}

/**
 * Processes a maintenance event submitted from the HTML dialog.
 * Appends a row to Maintenance & Turnovers and updates Fleet Manager.
 * @param {Object} data - Form data from the maintenance dialog.
 */
function processMaintenanceEvent(data) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) {
      throw new Error('Maintenance logging in progress. Please wait.');
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var maintSheet = ss.getSheetByName(TURO_SHEETS.MAINTENANCE.name);
    if (!maintSheet) throw new Error('Maintenance sheet not found. Run setupTuroModule() first.');

    // Get vehicle name from fleet
    var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);
    var vehicleName = data.fleetId;
    if (fleetSheet && fleetSheet.getLastRow() > 1) {
      var fleetData = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, 3).getValues();
      for (var i = 0; i < fleetData.length; i++) {
        if (fleetData[i][0] === data.fleetId) {
          vehicleName = fleetData[i][2] || data.fleetId;
          break;
        }
      }
    }

    // Generate Log ID
    var logId = generateMaintenanceLogId_(maintSheet);

    // Build row (data starts at row 7, after summary rows)
    var nextDate = data.nextDate ? new Date(data.nextDate) : '';
    var maintRow = [
      logId,                   // Log ID
      data.fleetId,            // Fleet ID
      vehicleName,             // Vehicle
      new Date(),              // Date
      data.type,               // Type
      data.description,        // Description
      data.cost,               // Cost
      data.vendor,             // Vendor
      data.mileage || '',      // Mileage at Service
      data.downtime || 0,      // Downtime Days
      data.nextType || '',     // Next Service Type
      nextDate,                // Next Service Date
      data.nextMileage || '',  // Next Service Mileage
      data.notes || ''         // Notes
    ];

    maintSheet.appendRow(maintRow);

    // Format cost column
    var newRow = maintSheet.getLastRow();
    maintSheet.getRange(newRow, 7).setNumberFormat('$#,##0.00');

    // Update Fleet Manager: Last Service Date, Next Service Due
    updateFleetServiceDates_(ss, data.fleetId, new Date(), nextDate);

    logTuro_('Maintenance', 'INFO', 'Logged maintenance event: ' + logId + ' for ' + data.fleetId + ' - ' + data.type + ' ($' + data.cost + ')');
    ss.toast('Maintenance event logged: ' + logId, 'Turo Module', 5);

  } catch (e) {
    logTuro_('Maintenance', 'ERROR', 'processMaintenanceEvent failed: ' + e.toString());
    throw e; // Re-throw for the HTML dialog error handler
  } finally {
    lock.releaseLock();
  }
}

/**
 * Generates the next maintenance Log ID (MT-001, MT-002, etc.).
 * @param {SpreadsheetApp.Sheet} maintSheet - Maintenance sheet.
 * @returns {string} Next Log ID.
 * @private
 */
function generateMaintenanceLogId_(maintSheet) {
  var maxNum = 0;
  var lastRow = maintSheet.getLastRow();

  if (lastRow >= 7) { // Data starts at row 7
    var ids = maintSheet.getRange(7, 1, lastRow - 6, 1).getValues();
    for (var i = 0; i < ids.length; i++) {
      var id = String(ids[i][0]);
      var match = id.match(/^MT-(\d+)$/);
      if (match) {
        var num = parseInt(match[1], 10);
        if (num > maxNum) maxNum = num;
      }
    }
  }

  var nextNum = maxNum + 1;
  var padded = ('000' + nextNum).slice(-3);
  return 'MT-' + padded;
}

/**
 * Updates Fleet Manager Last Service Date and Next Service Due for a vehicle.
 * @param {SpreadsheetApp.Spreadsheet} ss - Active spreadsheet.
 * @param {string} fleetId - Fleet ID.
 * @param {Date} lastServiceDate - Date of service performed.
 * @param {Date|string} nextServiceDate - Next service due date.
 * @private
 */
function updateFleetServiceDates_(ss, fleetId, lastServiceDate, nextServiceDate) {
  var fleetSheet = ss.getSheetByName(TURO_SHEETS.FLEET.name);
  if (!fleetSheet || fleetSheet.getLastRow() < 2) return;

  var data = fleetSheet.getRange(2, 1, fleetSheet.getLastRow() - 1, 1).getValues();
  for (var i = 0; i < data.length; i++) {
    if (data[i][0] === fleetId) {
      var rowNum = i + 2;
      fleetSheet.getRange(rowNum, 21).setValue(lastServiceDate); // Last Service Date (col U)
      if (nextServiceDate) {
        fleetSheet.getRange(rowNum, 22).setValue(nextServiceDate); // Next Service Due (col V)
      }
      break;
    }
  }
}
