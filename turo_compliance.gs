// =========================================================
// CARHAWK ULTIMATE - TURO INSURANCE & COMPLIANCE ALERTS
// =========================================================
// Version: 1.0.0
// Purpose: Scans Insurance & Compliance sheet for expiring
//          registrations, insurance, and inspections.
//          Outputs alerts via toast, email, and conditional formatting.
// =========================================================

/**
 * Scans Insurance & Compliance sheet for upcoming expirations and overdue items.
 * Alerts via toast, email (if configured), and highlights flagged rows.
 */
function checkComplianceAlerts() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TURO_SHEETS.INSURANCE.name);
    if (!sheet || sheet.getLastRow() < 2) {
      ss.toast('No compliance data to check.', 'Turo Module', 5);
      return;
    }

    var data = sheet.getRange(2, 1, sheet.getLastRow() - 1, INSURANCE_HEADERS.length).getValues();
    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var alerts = [];
    var flaggedRows = [];

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var rowNum = i + 2;
      var fleetId = row[0];
      var vehicle = row[1];
      var rowAlerts = [];

      // Registration Expiry (col D, index 3) — flag if <= 60 days
      var regExpiry = parseDate_(row[3]);
      if (regExpiry) {
        var regDaysLeft = daysBetween_(today, regExpiry);
        if (regDaysLeft <= 60) {
          rowAlerts.push({
            type: 'Registration',
            detail: regDaysLeft <= 0
              ? 'EXPIRED (' + formatDate_(regExpiry) + ')'
              : 'Expires in ' + regDaysLeft + ' days (' + formatDate_(regExpiry) + ')',
            severity: regDaysLeft <= 0 ? 'CRITICAL' : (regDaysLeft <= 30 ? 'WARNING' : 'INFO')
          });
        }
      }

      // Insurance Expiry (col H, index 7) — flag if <= 60 days
      var insExpiry = parseDate_(row[7]);
      if (insExpiry) {
        var insDaysLeft = daysBetween_(today, insExpiry);
        if (insDaysLeft <= 60) {
          rowAlerts.push({
            type: 'Insurance',
            detail: insDaysLeft <= 0
              ? 'EXPIRED (' + formatDate_(insExpiry) + ')'
              : 'Expires in ' + insDaysLeft + ' days (' + formatDate_(insExpiry) + ')',
            severity: insDaysLeft <= 0 ? 'CRITICAL' : (insDaysLeft <= 30 ? 'WARNING' : 'INFO')
          });
        }
      }

      // Inspection Due (col K, index 10) — flag if <= 30 days
      var inspDue = parseDate_(row[10]);
      if (inspDue) {
        var inspDaysLeft = daysBetween_(today, inspDue);
        if (inspDaysLeft <= 30) {
          rowAlerts.push({
            type: 'Inspection',
            detail: inspDaysLeft <= 0
              ? 'OVERDUE (' + formatDate_(inspDue) + ')'
              : 'Due in ' + inspDaysLeft + ' days (' + formatDate_(inspDue) + ')',
            severity: inspDaysLeft <= 0 ? 'CRITICAL' : 'WARNING'
          });
        }
      }

      // Inspection Status (col L, index 11) — flag if Overdue
      var inspStatus = String(row[11] || '').trim();
      if (inspStatus === 'Overdue') {
        var alreadyFlagged = rowAlerts.some(function(a) { return a.type === 'Inspection'; });
        if (!alreadyFlagged) {
          rowAlerts.push({
            type: 'Inspection',
            detail: 'Status marked as Overdue',
            severity: 'CRITICAL'
          });
        }
      }

      if (rowAlerts.length > 0) {
        alerts.push({
          fleetId: fleetId,
          vehicle: vehicle,
          row: rowNum,
          alerts: rowAlerts
        });
        flaggedRows.push(rowNum);
      }
    }

    // Apply conditional formatting to flagged rows
    applyComplianceHighlights_(sheet, flaggedRows, data.length);

    // Toast notification
    if (alerts.length === 0) {
      ss.toast('All compliance items are current. No alerts.', 'Turo Compliance', 5);
      logTuro_('Compliance', 'INFO', 'Compliance check passed \u2014 no alerts');
      return;
    }

    var totalAlerts = 0;
    alerts.forEach(function(a) { totalAlerts += a.alerts.length; });
    ss.toast(totalAlerts + ' compliance alert(s) for ' + alerts.length + ' vehicle(s). Check Insurance & Compliance sheet.', 'Turo Compliance', 8);

    // Email alert (if operator email is in Settings)
    sendComplianceEmail_(alerts);

    // Log
    var alertSummary = alerts.map(function(a) {
      return a.fleetId + ': ' + a.alerts.map(function(al) { return al.type + ' - ' + al.detail; }).join('; ');
    }).join(' | ');
    logTuro_('Compliance', 'WARN', totalAlerts + ' alert(s): ' + alertSummary);

  } catch (e) {
    logTuro_('Compliance', 'ERROR', 'checkComplianceAlerts failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Compliance check failed: ' + e.message, 'Turo Module Error', 5);
  }
}

/**
 * Applies red background highlighting to flagged Insurance & Compliance rows.
 * Clears highlighting on non-flagged rows.
 * @param {SpreadsheetApp.Sheet} sheet - Insurance & Compliance sheet.
 * @param {number[]} flaggedRows - Array of 1-based row numbers to highlight.
 * @param {number} totalDataRows - Total number of data rows.
 * @private
 */
function applyComplianceHighlights_(sheet, flaggedRows, totalDataRows) {
  if (totalDataRows <= 0) return;

  // Clear existing highlights on all data rows
  sheet.getRange(2, 1, totalDataRows, INSURANCE_HEADERS.length).setBackground(null);

  // Apply red background to flagged rows
  for (var i = 0; i < flaggedRows.length; i++) {
    sheet.getRange(flaggedRows[i], 1, 1, INSURANCE_HEADERS.length)
      .setBackground('#FFCDD2'); // light red
  }
}

/**
 * Sends a compliance alert email to the operator if configured.
 * @param {Object[]} alerts - Array of alert objects.
 * @private
 */
function sendComplianceEmail_(alerts) {
  try {
    // Check if email is configured in Settings
    var email = getQuantumSetting('NOTIFICATION_EMAIL') || getQuantumSetting('OPERATOR_EMAIL');
    if (!email) return;

    var subject = 'CarHawk Turo: ' + alerts.length + ' Compliance Alert(s)';
    var body = 'Turo Module Compliance Alert Summary\n';
    body += '=' .repeat(50) + '\n\n';

    for (var i = 0; i < alerts.length; i++) {
      var a = alerts[i];
      body += a.fleetId + ' - ' + a.vehicle + '\n';
      for (var j = 0; j < a.alerts.length; j++) {
        var al = a.alerts[j];
        body += '  [' + al.severity + '] ' + al.type + ': ' + al.detail + '\n';
      }
      body += '\n';
    }

    body += '\nGenerated: ' + new Date().toLocaleString() + '\n';
    body += 'Open your CarHawk spreadsheet to take action.\n';

    MailApp.sendEmail(email, subject, body);
    logTuro_('Compliance', 'INFO', 'Compliance alert email sent to ' + email);

  } catch (e) {
    // Email sending is best-effort; don't fail the compliance check
    logTuro_('Compliance', 'WARN', 'Failed to send compliance email: ' + e.toString());
  }
}

// =========================================================
// DATE UTILITY HELPERS
// =========================================================

/**
 * Parses a value into a Date object.
 * @param {*} val - Value to parse (Date, string, or empty).
 * @returns {Date|null} Parsed date or null.
 * @private
 */
function parseDate_(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  try {
    var d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}

/**
 * Returns the number of days between two dates.
 * @param {Date} from - Start date.
 * @param {Date} to - End date.
 * @returns {number} Days difference (negative if to is before from).
 * @private
 */
function daysBetween_(from, to) {
  var msPerDay = 86400000;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

/**
 * Formats a date as MM/DD/YYYY.
 * @param {Date} d - Date to format.
 * @returns {string} Formatted date string.
 * @private
 */
function formatDate_(d) {
  if (!d || !(d instanceof Date)) return '';
  return (d.getMonth() + 1) + '/' + d.getDate() + '/' + d.getFullYear();
}
