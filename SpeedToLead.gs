// ==========================================
// CARHAWK ULTIMATE - SPEED-TO-LEAD ENGINE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Track lead freshness, calculate urgency scores, and prioritize immediate action
// ==========================================

/**
 * CORE PRINCIPLE: Speed to lead is THE #1 factor in conversion rates.
 * First contact within 30 minutes = 21x higher conversion than after 30 min.
 * This engine ensures we NEVER miss a hot lead.
 */

/**
 * Calculate Speed-to-Lead score for a vehicle listing
 * @param {Date|string} firstSeenTimestamp - When listing was first detected
 * @return {Object} Speed analysis with score, status, and urgency
 */
function calculateSpeedToLead(firstSeenTimestamp) {
  if (!firstSeenTimestamp) {
    return {
      score: 0,
      status: 'Unknown',
      icon: '❓',
      urgency: 'UNKNOWN',
      minutesAgo: null,
      decayMultiplier: 0.5
    };
  }

  const minutesAgo = minutesSince(firstSeenTimestamp);

  // Calculate score with exponential decay
  let score = calculateLeadScore(minutesAgo);

  // Determine urgency status
  let status, icon, urgency;

  if (minutesAgo <= SPEED_CONFIG.IMMEDIATE) {
    status = '🔥 IMMEDIATE';
    icon = '🔥';
    urgency = 'IMMEDIATE';
  } else if (minutesAgo <= SPEED_CONFIG.WARM) {
    status = '⚠️ WARM';
    icon = '⚠️';
    urgency = 'WARM';
  } else if (minutesAgo <= SPEED_CONFIG.COOLING) {
    status = '⏰ COOLING';
    icon = '⏰';
    urgency = 'COOLING';
  } else if (minutesAgo <= SPEED_CONFIG.COLD) {
    status = '❄️ COLD';
    icon = '❄️';
    urgency = 'COLD';
  } else {
    status = '💀 DEAD';
    icon = '💀';
    urgency = 'DEAD';
  }

  // Calculate decay multiplier for lead scoring
  const decayMultiplier = calculateDecayMultiplier(minutesAgo);

  return {
    score: Math.round(score),
    status: status,
    icon: icon,
    urgency: urgency,
    minutesAgo: minutesAgo,
    decayMultiplier: decayMultiplier,
    relativeTime: getRelativeTime(firstSeenTimestamp)
  };
}

/**
 * Calculate lead score based on time elapsed
 * Uses exponential decay curve
 * @param {number} minutesAgo - Minutes since first seen
 * @return {number} Score (0-100)
 */
function calculateLeadScore(minutesAgo) {
  if (minutesAgo <= 0) return SPEED_CONFIG.MAX_SCORE;

  // Exponential decay formula: score = max * (decay_rate ^ hours)
  const hoursAgo = minutesAgo / 60;
  const score = SPEED_CONFIG.MAX_SCORE * Math.pow(SPEED_CONFIG.DECAY_RATE, hoursAgo);

  return Math.max(score, SPEED_CONFIG.MIN_SCORE);
}

/**
 * Calculate decay multiplier for use in overall lead scoring
 * @param {number} minutesAgo - Minutes since first seen
 * @return {number} Multiplier (0-1)
 */
function calculateDecayMultiplier(minutesAgo) {
  if (minutesAgo <= SPEED_CONFIG.IMMEDIATE) return 1.0;
  if (minutesAgo <= SPEED_CONFIG.WARM) return 0.9;
  if (minutesAgo <= SPEED_CONFIG.COOLING) return 0.7;
  if (minutesAgo <= SPEED_CONFIG.COLD) return 0.5;
  return 0.3;
}

/**
 * Update Speed-to-Lead data for all vehicles in Master Database
 */
function updateSpeedToLeadData() {
  try {
    const sheet = getSheet(SHEETS.MASTER.name);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = data[0];
    const firstSeenCol = headers.indexOf(MASTER_COLUMNS.FIRST_SEEN);
    const timeSinceCol = headers.indexOf(MASTER_COLUMNS.TIME_SINCE_POSTED);
    const speedScoreCol = headers.indexOf(MASTER_COLUMNS.LEAD_SPEED_SCORE);
    const coolingRiskCol = headers.indexOf(MASTER_COLUMNS.LEAD_COOLING_RISK);

    if (firstSeenCol === -1) {
      throw new Error('First Seen Timestamp column not found');
    }

    let updatedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const firstSeen = data[i][firstSeenCol];

      if (!firstSeen) continue;

      const speedData = calculateSpeedToLead(firstSeen);

      // Update row
      if (timeSinceCol !== -1) {
        sheet.getRange(i + 1, timeSinceCol + 1).setValue(speedData.minutesAgo);
      }
      if (speedScoreCol !== -1) {
        sheet.getRange(i + 1, speedScoreCol + 1).setValue(speedData.score);
      }
      if (coolingRiskCol !== -1) {
        sheet.getRange(i + 1, coolingRiskCol + 1).setValue(speedData.status);
      }

      updatedCount++;
    }

    logSystem('SPEED_TO_LEAD_UPDATE', `Updated ${updatedCount} records`);

    SpreadsheetApp.getUi().alert(
      '✅ Speed-to-Lead Updated',
      `Updated ${updatedCount} vehicle records with current speed-to-lead data.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('SPEED_TO_LEAD_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error updating speed-to-lead data: ' + error.message);
  }
}

/**
 * Generate Speed-to-Lead Dashboard
 * Shows all leads sorted by urgency with actionable priorities
 */
function generateSpeedToLeadDashboard() {
  try {
    const masterSheet = getSheet(SHEETS.MASTER.name);
    const speedSheet = getSheet(SHEETS.SPEED_LEAD.name);

    const masterData = masterSheet.getDataRange().getValues();

    if (masterData.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = masterData[0];

    // Find column indices
    const firstSeenCol = headers.indexOf(MASTER_COLUMNS.FIRST_SEEN);
    const yearCol = headers.indexOf(MASTER_COLUMNS.YEAR);
    const makeCol = headers.indexOf(MASTER_COLUMNS.MAKE);
    const modelCol = headers.indexOf(MASTER_COLUMNS.MODEL);
    const platformCol = headers.indexOf(MASTER_COLUMNS.PLATFORM);
    const askingPriceCol = headers.indexOf(MASTER_COLUMNS.ASKING_PRICE);
    const profitCol = headers.indexOf(MASTER_COLUMNS.PROFIT_DOLLAR);
    const distanceCol = headers.indexOf(MASTER_COLUMNS.DISTANCE);
    const urlCol = headers.indexOf(MASTER_COLUMNS.LISTING_URL);

    // Build dashboard data
    const dashboardData = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];
      const firstSeen = row[firstSeenCol];

      if (!firstSeen) continue;

      const speedData = calculateSpeedToLead(firstSeen);
      const vehicle = `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`;

      // Calculate action priority
      const profit = row[profitCol] || 0;
      const distance = row[distanceCol] || 0;
      const actionPriority = calculateActionPriority(speedData, profit, distance);

      dashboardData.push([
        speedData.icon,
        formatTimestamp(firstSeen),
        speedData.minutesAgo,
        vehicle,
        row[platformCol] || '',
        row[askingPriceCol] || 0,
        profit,
        distance,
        speedData.score,
        actionPriority,
        row[urlCol] || ''
      ]);
    }

    // Sort by urgency (speed score descending)
    dashboardData.sort((a, b) => b[8] - a[8]);

    // Clear existing data
    clearSheetData(SHEETS.SPEED_LEAD.name);

    // Write dashboard data
    if (dashboardData.length > 0) {
      speedSheet.getRange(2, 1, dashboardData.length, dashboardData[0].length)
        .setValues(dashboardData);
    }

    // Apply conditional formatting
    applySpeedToLeadFormatting(speedSheet, dashboardData.length);

    logSystem('SPEED_DASHBOARD_GENERATED', `Generated dashboard with ${dashboardData.length} leads`);

    SpreadsheetApp.getUi().alert(
      '✅ Dashboard Generated',
      `Speed-to-Lead Dashboard updated with ${dashboardData.length} active leads.\n\n` +
      'Leads are sorted by urgency. 🔥 IMMEDIATE leads require action NOW!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('SPEED_DASHBOARD_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error generating dashboard: ' + error.message);
  }
}

/**
 * Calculate action priority based on speed, profit, and distance
 * @param {Object} speedData - Speed-to-lead data
 * @param {number} profit - Expected profit
 * @param {number} distance - Distance in miles
 * @return {string} Priority level
 */
function calculateActionPriority(speedData, profit, distance) {
  let priority = 0;

  // Speed component (50% weight)
  if (speedData.urgency === 'IMMEDIATE') priority += 50;
  else if (speedData.urgency === 'WARM') priority += 35;
  else if (speedData.urgency === 'COOLING') priority += 20;
  else if (speedData.urgency === 'COLD') priority += 10;

  // Profit component (30% weight)
  if (profit >= 5000) priority += 30;
  else if (profit >= 3000) priority += 20;
  else if (profit >= 2000) priority += 15;
  else if (profit >= 1000) priority += 10;

  // Distance component (20% weight) - closer is better
  if (distance <= 25) priority += 20;
  else if (distance <= 75) priority += 15;
  else if (distance <= 150) priority += 10;
  else priority += 5;

  // Determine priority level
  if (priority >= 80) return '🚨 CRITICAL - ACT NOW';
  if (priority >= 60) return '⚡ HIGH - Act Today';
  if (priority >= 40) return '📍 MEDIUM - Act This Week';
  if (priority >= 20) return '📋 LOW - Follow Up';
  return '⏸️ HOLD';
}

/**
 * Apply conditional formatting to Speed-to-Lead Dashboard
 * @param {Sheet} sheet - The speed dashboard sheet
 * @param {number} dataRows - Number of data rows
 */
function applySpeedToLeadFormatting(sheet, dataRows) {
  if (dataRows === 0) return;

  const dataRange = sheet.getRange(2, 1, dataRows, 11);

  // Color code by urgency icon
  for (let i = 0; i < dataRows; i++) {
    const row = i + 2;
    const icon = sheet.getRange(row, 1).getValue();

    let bgColor = '#FFFFFF';
    if (icon === '🔥') bgColor = '#ffebee'; // Light red for immediate
    else if (icon === '⚠️') bgColor = '#fff3e0'; // Light orange for warm
    else if (icon === '⏰') bgColor = '#fffde7'; // Light yellow for cooling
    else if (icon === '❄️') bgColor = '#f1f8e9'; // Light blue for cold
    else if (icon === '💀') bgColor = '#f5f5f5'; // Grey for dead

    sheet.getRange(row, 1, 1, 11).setBackground(bgColor);
  }

  // Format currency columns
  if (dataRows > 0) {
    sheet.getRange(2, 6, dataRows, 1).setNumberFormat('$#,##0');
    sheet.getRange(2, 7, dataRows, 1).setNumberFormat('$#,##0');
  }
}

/**
 * Check for immediate action leads and send alerts
 * Should be run on a trigger (every 5-10 minutes)
 */
function checkForImmediateLeads() {
  try {
    const alertsEnabled = getConfig('EMAIL_ALERTS_ENABLED') === 'TRUE';
    if (!alertsEnabled) return;

    const masterSheet = getSheet(SHEETS.MASTER.name);
    const data = masterSheet.getDataRange().getValues();

    if (data.length < 2) return;

    const headers = data[0];
    const firstSeenCol = headers.indexOf(MASTER_COLUMNS.FIRST_SEEN);
    const yearCol = headers.indexOf(MASTER_COLUMNS.YEAR);
    const makeCol = headers.indexOf(MASTER_COLUMNS.MAKE);
    const modelCol = headers.indexOf(MASTER_COLUMNS.MODEL);
    const profitCol = headers.indexOf(MASTER_COLUMNS.PROFIT_DOLLAR);
    const urlCol = headers.indexOf(MASTER_COLUMNS.LISTING_URL);

    const immediateLeads = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const firstSeen = row[firstSeenCol];

      if (!firstSeen) continue;

      const minutesAgo = minutesSince(firstSeen);
      const profit = row[profitCol] || 0;

      // Check if immediate action required
      if (minutesAgo <= SPEED_CONFIG.ALERT_THRESHOLD && profit >= SPEED_CONFIG.ALERT_MIN_PROFIT) {
        const vehicle = `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`;
        immediateLeads.push({
          vehicle: vehicle,
          profit: profit,
          minutesAgo: minutesAgo,
          url: row[urlCol]
        });
      }
    }

    // Send alert if immediate leads found
    if (immediateLeads.length > 0) {
      sendImmediateLeadAlert(immediateLeads);
    }

  } catch (error) {
    logError('IMMEDIATE_LEAD_CHECK_ERROR', error.message);
  }
}

/**
 * Send email alert for immediate action leads
 * @param {Array} leads - Array of immediate lead objects
 */
function sendImmediateLeadAlert(leads) {
  const recipient = getConfig('ALERT_EMAIL') || getUserEmail();

  let emailBody = `
    <h2>🔥 IMMEDIATE ACTION REQUIRED - Hot Leads Detected!</h2>
    <p>The following high-value leads were posted in the last ${SPEED_CONFIG.ALERT_THRESHOLD} minutes:</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      <tr style="background-color: #ff4444; color: white;">
        <th>Vehicle</th>
        <th>Expected Profit</th>
        <th>Posted</th>
        <th>Action</th>
      </tr>
  `;

  for (let lead of leads) {
    emailBody += `
      <tr>
        <td><strong>${lead.vehicle}</strong></td>
        <td>${formatCurrency(lead.profit)}</td>
        <td>${lead.minutesAgo} minutes ago</td>
        <td><a href="${lead.url}" target="_blank">View Listing</a></td>
      </tr>
    `;
  }

  emailBody += `
    </table>
    <br>
    <p><strong>⚡ ACTION REQUIRED:</strong> Contact these sellers immediately for best conversion rates!</p>
    <p>Studies show that first contact within 30 minutes results in 21x higher conversion.</p>
    <hr>
    <p style="font-size: 11px; color: #666;">
      This alert was generated by CarHawk Ultimate Speed-to-Lead Engine<br>
      To disable alerts, update EMAIL_ALERTS_ENABLED in Config sheet
    </p>
  `;

  sendEmail(
    recipient,
    `🔥 ${leads.length} IMMEDIATE Lead${leads.length > 1 ? 's' : ''} - ACT NOW!`,
    emailBody
  );

  logSystem('IMMEDIATE_ALERT_SENT', `Sent alert for ${leads.length} immediate leads to ${recipient}`);
}

/**
 * Set up time-based trigger for checking immediate leads
 * Run this once to enable automatic alerts
 */
function setupSpeedToLeadTrigger() {
  // Delete existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (let trigger of triggers) {
    if (trigger.getHandlerFunction() === 'checkForImmediateLeads') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Create new trigger - every 10 minutes
  ScriptApp.newTrigger('checkForImmediateLeads')
    .timeBased()
    .everyMinutes(10)
    .create();

  logSystem('TRIGGER_SETUP', 'Speed-to-Lead trigger configured for 10-minute intervals');

  SpreadsheetApp.getUi().alert(
    '✅ Trigger Setup Complete',
    'Speed-to-Lead monitoring is now active.\n\n' +
    'Hot leads will be checked every 10 minutes and alerts sent via email.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Remove speed-to-lead trigger
 */
function removeSpeedToLeadTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  let removed = 0;

  for (let trigger of triggers) {
    if (trigger.getHandlerFunction() === 'checkForImmediateLeads') {
      ScriptApp.deleteTrigger(trigger);
      removed++;
    }
  }

  logSystem('TRIGGER_REMOVED', `Removed ${removed} speed-to-lead triggers`);

  SpreadsheetApp.getUi().alert(
    '✅ Trigger Removed',
    'Speed-to-Lead monitoring has been disabled.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
