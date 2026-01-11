// ==========================================
// CARHAWK ULTIMATE - VERDICT ENGINE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Generate final verdicts and populate the Verdict sheet with top opportunities
// ==========================================

/**
 * VERDICT TYPES:
 * 🔥 HOT - Lead score 80+, immediate action
 * ✅ SOLID - Lead score 65-79, good opportunity
 * 💎 RENTAL GEM - Rental viable, $600+/mo net
 * 🤔 MAYBE - Lead score 50-64, consider
 * ❌ PASS - Lead score <50, skip
 */

/**
 * Generate verdict for a vehicle
 * @param {Object} vehicle - Vehicle data object
 * @param {number} leadScore - Calculated lead score
 * @return {Object} Verdict with classification and reasoning
 */
function generateVerdict(vehicle, leadScore) {
  const profit = vehicle[MASTER_COLUMNS.PROFIT_DOLLAR] || 0;
  const rentalViable = vehicle[MASTER_COLUMNS.RENTAL_VIABLE] || 'No';
  const monthlyNet = vehicle[MASTER_COLUMNS.MONTHLY_NET] || 0;
  const hazardFlags = vehicle[MASTER_COLUMNS.HAZARD_FLAGS] || '';
  const speedData = calculateSpeedToLead(vehicle[MASTER_COLUMNS.FIRST_SEEN]);
  const distance = vehicle[MASTER_COLUMNS.DISTANCE] || 0;

  // CRITICAL DISQUALIFIERS - automatic PASS
  if (hazardFlags.includes('🚨')) {
    return {
      verdict: VERDICTS.PASS.label,
      icon: VERDICTS.PASS.icon,
      reason: 'Critical hazard flags present',
      action: 'SKIP - High risk',
      priority: 0
    };
  }

  if (profit < 300) {
    return {
      verdict: VERDICTS.PASS.label,
      icon: VERDICTS.PASS.icon,
      reason: 'Insufficient profit potential',
      action: 'SKIP - Not profitable',
      priority: 0
    };
  }

  if (distance > 200) {
    return {
      verdict: VERDICTS.PASS.label,
      icon: VERDICTS.PASS.icon,
      reason: 'Too far away',
      action: 'SKIP - Logistics not feasible',
      priority: 0
    };
  }

  // RENTAL GEM - prioritize rental opportunities
  if (rentalViable === 'Yes' && monthlyNet >= 600) {
    return {
      verdict: VERDICTS.RENTAL_GEM.label,
      icon: VERDICTS.RENTAL_GEM.icon,
      reason: `Strong rental asset: $${formatNumber(monthlyNet)}/mo net income`,
      action: 'BUY & HOLD for Turo',
      priority: 85
    };
  }

  // HOT DEAL - high score, good profit, fresh listing
  if (leadScore >= VERDICTS.HOT.minScore) {
    let reason = 'Excellent opportunity';
    if (speedData.urgency === 'IMMEDIATE') reason += ', fresh listing';
    if (profit >= 3000) reason += ', high profit';

    return {
      verdict: VERDICTS.HOT.label,
      icon: VERDICTS.HOT.icon,
      reason: reason,
      action: speedData.urgency === 'IMMEDIATE' ? 'CONTACT NOW!' : 'Act within 24 hours',
      priority: 95
    };
  }

  // SOLID DEAL - good score, decent profit
  if (leadScore >= VERDICTS.SOLID.minScore) {
    return {
      verdict: VERDICTS.SOLID.label,
      icon: VERDICTS.SOLID.icon,
      reason: 'Good deal with acceptable margins',
      action: 'Follow up this week',
      priority: 75
    };
  }

  // MAYBE - borderline opportunity
  if (leadScore >= VERDICTS.MAYBE.minScore) {
    return {
      verdict: VERDICTS.MAYBE.label,
      icon: VERDICTS.MAYBE.icon,
      reason: 'Marginal opportunity, depends on negotiation',
      action: 'Low priority follow-up',
      priority: 50
    };
  }

  // PASS - low score
  return {
    verdict: VERDICTS.PASS.label,
    icon: VERDICTS.PASS.icon,
    reason: 'Lead score too low',
    action: 'SKIP',
    priority: 0
  };
}

/**
 * Generate complete verdict sheet with top opportunities
 */
function generateVerdictSheet() {
  try {
    const masterSheet = getSheet(SHEETS.MASTER.name);
    const verdictSheet = getSheet(SHEETS.VERDICT.name);

    const masterData = masterSheet.getDataRange().getValues();

    if (masterData.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = masterData[0];

    // Find required columns
    const yearCol = headers.indexOf(MASTER_COLUMNS.YEAR);
    const makeCol = headers.indexOf(MASTER_COLUMNS.MAKE);
    const modelCol = headers.indexOf(MASTER_COLUMNS.MODEL);
    const askingPriceCol = headers.indexOf(MASTER_COLUMNS.ASKING_PRICE);
    const profitCol = headers.indexOf(MASTER_COLUMNS.PROFIT_DOLLAR);
    const profitPctCol = headers.indexOf(MASTER_COLUMNS.PROFIT_PERCENT);
    const distanceCol = headers.indexOf(MASTER_COLUMNS.DISTANCE);
    const rentalViableCol = headers.indexOf(MASTER_COLUMNS.RENTAL_VIABLE);
    const monthlyNetCol = headers.indexOf(MASTER_COLUMNS.MONTHLY_NET);
    const flipStrategyCol = headers.indexOf(MASTER_COLUMNS.FLIP_STRATEGY);
    const offerTargetCol = headers.indexOf(MASTER_COLUMNS.OFFER_TARGET);
    const sellerMessageCol = headers.indexOf(MASTER_COLUMNS.SELLER_MESSAGE);
    const urlCol = headers.indexOf(MASTER_COLUMNS.LISTING_URL);

    // Build verdict data
    const verdictData = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];

      // Build vehicle object
      const vehicle = {};
      for (let j = 0; j < headers.length; j++) {
        vehicle[headers[j]] = row[j];
      }

      // Calculate lead score and verdict
      const scoreData = calculateLeadScore(vehicle);
      const verdictData_single = generateVerdict(vehicle, scoreData.finalScore);

      // Only include non-PASS verdicts
      if (verdictData_single.verdict === VERDICTS.PASS.label) continue;

      // Get speed-to-lead data
      const speedData = calculateSpeedToLead(vehicle[MASTER_COLUMNS.FIRST_SEEN]);

      const vehicleName = `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`;

      verdictData.push([
        0, // Rank - will be set after sorting
        verdictData_single.verdict,
        vehicleName,
        row[askingPriceCol] || 0,
        row[profitCol] || 0,
        row[profitPctCol] || 0,
        scoreData.finalScore,
        speedData.status,
        row[distanceCol] || 0,
        row[rentalViableCol] || 'No',
        row[monthlyNetCol] || 0,
        row[flipStrategyCol] || '',
        row[offerTargetCol] || 0,
        row[sellerMessageCol] || 'Generate message',
        row[urlCol] || '',
        verdictData_single.action,
        verdictData_single.priority // Hidden column for sorting
      ]);
    }

    // Sort by priority (descending), then by profit (descending)
    verdictData.sort((a, b) => {
      if (b[16] !== a[16]) return b[16] - a[16]; // Sort by priority
      return b[4] - a[4]; // Then by profit
    });

    // Add rank numbers and remove priority column
    const finalData = [];
    for (let i = 0; i < verdictData.length; i++) {
      verdictData[i][0] = i + 1; // Set rank
      finalData.push(verdictData[i].slice(0, 16)); // Remove priority column
    }

    // Clear existing data
    clearSheetData(SHEETS.VERDICT.name);

    // Write verdict data
    if (finalData.length > 0) {
      verdictSheet.getRange(2, 1, finalData.length, finalData[0].length)
        .setValues(finalData);
    }

    // Apply formatting
    applyVerdictSheetFormatting(verdictSheet, finalData.length);

    logSystem('VERDICT_SHEET_GENERATED', `Generated verdict sheet with ${finalData.length} opportunities`);

    // Count by verdict type
    const hotCount = finalData.filter(row => row[1].includes('HOT')).length;
    const solidCount = finalData.filter(row => row[1].includes('SOLID')).length;
    const rentalGemCount = finalData.filter(row => row[1].includes('RENTAL GEM')).length;

    SpreadsheetApp.getUi().alert(
      '✅ Verdict Sheet Generated',
      `Found ${finalData.length} opportunities:\n\n` +
      `🔥 HOT: ${hotCount}\n` +
      `✅ SOLID: ${solidCount}\n` +
      `💎 RENTAL GEMS: ${rentalGemCount}\n\n` +
      'Focus on HOT and RENTAL GEM deals first!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('VERDICT_GENERATION_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error generating verdict sheet: ' + error.message);
  }
}

/**
 * Apply conditional formatting to Verdict sheet
 * @param {Sheet} sheet - Verdict sheet
 * @param {number} dataRows - Number of data rows
 */
function applyVerdictSheetFormatting(sheet, dataRows) {
  if (dataRows === 0) return;

  // Format currency columns
  sheet.getRange(2, 4, dataRows, 1).setNumberFormat('$#,##0'); // Asking Price
  sheet.getRange(2, 5, dataRows, 1).setNumberFormat('$#,##0'); // Profit $
  sheet.getRange(2, 6, dataRows, 1).setNumberFormat('0.0%'); // Profit %
  sheet.getRange(2, 11, dataRows, 1).setNumberFormat('$#,##0'); // Monthly Net
  sheet.getRange(2, 13, dataRows, 1).setNumberFormat('$#,##0'); // Offer Target

  // Color code rows by verdict
  for (let i = 0; i < dataRows; i++) {
    const row = i + 2;
    const verdict = sheet.getRange(row, 2).getValue();

    let bgColor = '#FFFFFF';
    let textWeight = 'normal';

    if (verdict.includes('HOT')) {
      bgColor = '#ffebee'; // Light red
      textWeight = 'bold';
    } else if (verdict.includes('RENTAL GEM')) {
      bgColor = '#e3f2fd'; // Light blue
      textWeight = 'bold';
    } else if (verdict.includes('SOLID')) {
      bgColor = '#f1f8e9'; // Light green
    } else if (verdict.includes('MAYBE')) {
      bgColor = '#fff9c4'; // Light yellow
    }

    sheet.getRange(row, 1, 1, 16).setBackground(bgColor);
    sheet.getRange(row, 1, 1, 3).setFontWeight(textWeight);
  }

  // Bold and center rank column
  sheet.getRange(2, 1, dataRows, 1).setHorizontalAlignment('center').setFontWeight('bold');
}

/**
 * Update verdict column in Master Database
 */
function updateVerdictColumn() {
  try {
    const sheet = getSheet(SHEETS.MASTER.name);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = data[0];
    const verdictCol = headers.indexOf(MASTER_COLUMNS.VERDICT);

    if (verdictCol === -1) {
      throw new Error('Verdict column not found');
    }

    let updatedCount = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Build vehicle object
      const vehicle = {};
      for (let j = 0; j < headers.length; j++) {
        vehicle[headers[j]] = row[j];
      }

      // Calculate lead score and verdict
      const scoreData = calculateLeadScore(vehicle);
      const verdictData = generateVerdict(vehicle, scoreData.finalScore);

      // Update verdict column
      sheet.getRange(i + 1, verdictCol + 1).setValue(verdictData.verdict);

      updatedCount++;
    }

    logSystem('VERDICT_UPDATE', `Updated ${updatedCount} verdicts in Master Database`);

    SpreadsheetApp.getUi().alert(
      '✅ Verdicts Updated',
      `Updated ${updatedCount} verdicts in Master Database.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('VERDICT_UPDATE_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error updating verdicts: ' + error.message);
  }
}

/**
 * Get top N opportunities by verdict type
 * @param {string} verdictType - Verdict type to filter (HOT, SOLID, RENTAL GEM)
 * @param {number} limit - Maximum number to return
 * @return {Array} Top opportunities
 */
function getTopOpportunities(verdictType, limit = 10) {
  const masterSheet = getSheet(SHEETS.MASTER.name);
  const data = masterSheet.getDataRange().getValues();

  if (data.length < 2) return [];

  const headers = data[0];
  const opportunities = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const vehicle = {};

    for (let j = 0; j < headers.length; j++) {
      vehicle[headers[j]] = row[j];
    }

    const scoreData = calculateLeadScore(vehicle);
    const verdictData = generateVerdict(vehicle, scoreData.finalScore);

    if (verdictData.verdict.includes(verdictType)) {
      opportunities.push({
        vehicle: vehicle,
        score: scoreData.finalScore,
        verdict: verdictData,
        profit: vehicle[MASTER_COLUMNS.PROFIT_DOLLAR] || 0
      });
    }
  }

  // Sort by score descending
  opportunities.sort((a, b) => b.score - a.score);

  // Return top N
  return opportunities.slice(0, limit);
}

/**
 * Export top deals to CRM (HOT and RENTAL GEM only)
 */
function exportTopDealsToCRM() {
  try {
    const hotDeals = getTopOpportunities('HOT', 20);
    const rentalGems = getTopOpportunities('RENTAL GEM', 10);

    const allDeals = [...hotDeals, ...rentalGems];

    if (allDeals.length === 0) {
      SpreadsheetApp.getUi().alert('No HOT or RENTAL GEM deals to export');
      return;
    }

    // This would call the CRM integration
    // syncToCRM(allDeals);

    SpreadsheetApp.getUi().alert(
      '✅ Ready to Export',
      `Found ${hotDeals.length} HOT deals and ${rentalGems.length} RENTAL GEMS.\n\n` +
      'CRM sync functionality ready (configure in CRMIntegration.gs).',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('EXPORT_TO_CRM_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error exporting to CRM: ' + error.message);
  }
}
