// ==========================================
// CARHAWK ULTIMATE - RENTAL/TURO ENGINE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Analyze rental viability, calculate Turo ROI, and identify rental opportunities
// ==========================================

/**
 * CORE PRINCIPLE: Some vehicles are worth MORE as rental assets than quick flips.
 * This engine identifies "Rental Gems" - vehicles that generate passive income > flip profit.
 */

/**
 * Calculate complete rental analysis for a vehicle
 * @param {Object} vehicle - Vehicle data object with all properties
 * @return {Object} Rental analysis with viability, rates, and ROI metrics
 */
function calculateRentalAnalysis(vehicle) {
  // Extract required data
  const bodyType = vehicle[MASTER_COLUMNS.BODY_TYPE] || '';
  const year = vehicle[MASTER_COLUMNS.YEAR] || 0;
  const make = vehicle[MASTER_COLUMNS.MAKE] || '';
  const model = vehicle[MASTER_COLUMNS.MODEL] || '';
  const condition = vehicle[MASTER_COLUMNS.CONDITION] || '';
  const mileage = vehicle[MASTER_COLUMNS.MILEAGE] || 0;
  const enthusiastFlag = vehicle[MASTER_COLUMNS.ENTHUSIAST_FLAG] || 'No';
  const askingPrice = vehicle[MASTER_COLUMNS.ASKING_PRICE] || 0;
  const mao = vehicle[MASTER_COLUMNS.MAO] || 0;

  // Step 1: Check basic viability requirements
  const viabilityCheck = checkRentalViability(bodyType, year, condition, mileage);

  if (!viabilityCheck.viable) {
    return {
      viable: false,
      reason: viabilityCheck.reason,
      dailyRate: 0,
      monthlyGross: 0,
      monthlyNet: 0,
      annualNet: 0,
      breakevenMonths: null,
      rentalRisk: 'N/A',
      verdict: 'Not Rental Viable'
    };
  }

  // Step 2: Calculate estimated daily rate
  const dailyRate = estimateDailyRate(bodyType, year, make, model, enthusiastFlag === 'Yes');

  // Step 3: Calculate monthly revenue at different utilization rates
  const utilization = RENTAL_CONFIG.UTILIZATION_MODERATE; // Use moderate assumption
  const daysPerMonth = 30;
  const rentalDays = daysPerMonth * utilization;

  const monthlyGross = dailyRate * rentalDays;

  // Step 4: Calculate operating costs
  const costs = calculateRentalCosts(monthlyGross, rentalDays);

  // Step 5: Calculate net profit
  const monthlyNet = monthlyGross - costs.total;
  const annualNet = monthlyNet * 12;

  // Step 6: Calculate breakeven period
  const initialInvestment = mao > 0 ? mao : askingPrice;
  const breakevenMonths = monthlyNet > 0 ? initialInvestment / monthlyNet : null;

  // Step 7: Assess rental risk
  const rentalRisk = assessRentalRisk(year, mileage, condition, breakevenMonths);

  // Step 8: Determine verdict
  let verdict;
  if (monthlyNet >= RENTAL_CONFIG.MIN_MONTHLY_NET &&
      breakevenMonths <= RENTAL_CONFIG.MAX_BREAKEVEN_MONTHS) {
    if (monthlyNet >= 800) verdict = '💎 RENTAL GEM';
    else if (monthlyNet >= 600) verdict = '✅ SOLID RENTAL';
    else verdict = '🤔 MARGINAL RENTAL';
  } else {
    verdict = '❌ NOT VIABLE';
  }

  return {
    viable: true,
    dailyRate: Math.round(dailyRate),
    monthlyGross: Math.round(monthlyGross),
    monthlyNet: Math.round(monthlyNet),
    annualNet: Math.round(annualNet),
    breakevenMonths: breakevenMonths ? breakevenMonths.toFixed(1) : 'N/A',
    rentalRisk: rentalRisk,
    verdict: verdict,
    utilizationRate: utilization,
    costs: costs
  };
}

/**
 * Check if vehicle meets basic rental viability requirements
 * @param {string} bodyType - Vehicle body type
 * @param {number} year - Vehicle year
 * @param {string} condition - Vehicle condition
 * @param {number} mileage - Vehicle mileage
 * @return {Object} Viability check result
 */
function checkRentalViability(bodyType, year, condition, mileage) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Age requirement: Not too old (Turo typically allows 12 years max)
  if (age > 12) {
    return {viable: false, reason: 'Vehicle too old for Turo (>12 years)'};
  }

  // Condition requirement
  const conditionScore = getConditionScore(condition);
  if (conditionScore < RENTAL_CONFIG.MIN_CONDITION_SCORE) {
    return {viable: false, reason: 'Condition too poor for rental'};
  }

  // Mileage requirement (high mileage = higher maintenance risk)
  if (mileage > 150000) {
    return {viable: false, reason: 'Mileage too high (>150k miles)'};
  }

  // Body type check (some types are not rental-friendly)
  const lowDemandTypes = ['Cargo Van', 'Commercial', 'Bus'];
  if (lowDemandTypes.some(type => bodyType.includes(type))) {
    return {viable: false, reason: 'Body type not suitable for rental'};
  }

  return {viable: true, reason: 'Meets basic requirements'};
}

/**
 * Estimate daily rental rate based on vehicle characteristics
 * @param {string} bodyType - Vehicle body type
 * @param {number} year - Vehicle year
 * @param {string} make - Vehicle make
 * @param {string} model - Vehicle model
 * @param {boolean} isEnthusiast - Whether it's an enthusiast vehicle
 * @return {number} Estimated daily rate in dollars
 */
function estimateDailyRate(bodyType, year, make, model, isEnthusiast) {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;

  // Start with base rate by body type
  let baseRate = 45; // Default for unknown types

  // Match body type to rate
  for (let type in RENTAL_CONFIG.DAILY_RATES) {
    if (bodyType.toLowerCase().includes(type.toLowerCase())) {
      baseRate = RENTAL_CONFIG.DAILY_RATES[type];
      break;
    }
  }

  // Adjust for vehicle age
  let ageMultiplier = 1.0;
  if (age <= 2) ageMultiplier = 1.3;        // New cars command premium
  else if (age <= 5) ageMultiplier = 1.1;   // Recent cars still good
  else if (age <= 8) ageMultiplier = 1.0;   // Average
  else if (age <= 10) ageMultiplier = 0.9;  // Older cars discount
  else ageMultiplier = 0.8;                 // Very old cars

  // Enthusiast bonus
  let enthusiastMultiplier = isEnthusiast ? RENTAL_CONFIG.ENTHUSIAST_MULTIPLIER : 1.0;

  // Luxury brand multiplier
  const luxuryBrands = ['BMW', 'Mercedes', 'Audi', 'Lexus', 'Porsche', 'Tesla', 'Cadillac', 'Lincoln'];
  let luxuryMultiplier = 1.0;
  if (luxuryBrands.some(brand => make.includes(brand))) {
    luxuryMultiplier = 1.3;
  }

  // Calculate final rate
  const finalRate = baseRate * ageMultiplier * enthusiastMultiplier * luxuryMultiplier;

  return Math.round(finalRate);
}

/**
 * Calculate all rental operating costs
 * @param {number} monthlyGross - Monthly gross revenue
 * @param {number} rentalDays - Number of rental days per month
 * @return {Object} Breakdown of all costs
 */
function calculateRentalCosts(monthlyGross, rentalDays) {
  // Turo fee (percentage of gross)
  const turoFee = monthlyGross * RENTAL_CONFIG.TURO_FEE_PREMIER;

  // Insurance (fixed monthly)
  const insurance = RENTAL_CONFIG.INSURANCE_MONTHLY;

  // Maintenance reserve (percentage of gross)
  const maintenance = monthlyGross * RENTAL_CONFIG.MAINTENANCE_RESERVE;

  // Cleaning costs (per rental, assume 1 rental = 3 days average)
  const numRentals = Math.ceil(rentalDays / 3);
  const cleaning = numRentals * RENTAL_CONFIG.CLEANING_PER_RENTAL;

  // Total costs
  const total = turoFee + insurance + maintenance + cleaning;

  return {
    turoFee: Math.round(turoFee),
    insurance: Math.round(insurance),
    maintenance: Math.round(maintenance),
    cleaning: Math.round(cleaning),
    total: Math.round(total)
  };
}

/**
 * Assess rental risk level
 * @param {number} year - Vehicle year
 * @param {number} mileage - Vehicle mileage
 * @param {string} condition - Vehicle condition
 * @param {number} breakevenMonths - Months to breakeven
 * @return {string} Risk level
 */
function assessRentalRisk(year, mileage, condition, breakevenMonths) {
  let riskScore = 0;

  // Age risk
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  if (age > 10) riskScore += 30;
  else if (age > 7) riskScore += 20;
  else if (age > 5) riskScore += 10;

  // Mileage risk
  if (mileage > 120000) riskScore += 30;
  else if (mileage > 80000) riskScore += 20;
  else if (mileage > 50000) riskScore += 10;

  // Condition risk
  const conditionScore = getConditionScore(condition);
  if (conditionScore < 75) riskScore += 25;
  else if (conditionScore < 85) riskScore += 15;

  // Breakeven risk
  if (breakevenMonths > 15) riskScore += 25;
  else if (breakevenMonths > 12) riskScore += 15;
  else if (breakevenMonths > 9) riskScore += 10;

  // Determine risk tier
  if (riskScore >= 70) return '🔴 HIGH RISK';
  if (riskScore >= 40) return '🟡 MEDIUM RISK';
  return '🟢 LOW RISK';
}

/**
 * Update rental analysis for all vehicles in Master Database
 */
function updateRentalAnalysis() {
  try {
    const sheet = getSheet(SHEETS.MASTER.name);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = data[0];

    // Find all required columns
    const colMap = {};
    for (let col in MASTER_COLUMNS) {
      colMap[col] = headers.indexOf(MASTER_COLUMNS[col]);
    }

    let updatedCount = 0;
    let rentalViableCount = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Build vehicle object
      const vehicle = {};
      for (let col in MASTER_COLUMNS) {
        const index = colMap[col];
        if (index !== -1) {
          vehicle[MASTER_COLUMNS[col]] = row[index];
        }
      }

      // Calculate rental analysis
      const rentalData = calculateRentalAnalysis(vehicle);

      // Update columns
      if (colMap.RENTAL_VIABLE !== -1) {
        sheet.getRange(i + 1, colMap.RENTAL_VIABLE + 1).setValue(rentalData.viable ? 'Yes' : 'No');
      }
      if (colMap.DAILY_RATE !== -1) {
        sheet.getRange(i + 1, colMap.DAILY_RATE + 1).setValue(rentalData.dailyRate);
      }
      if (colMap.MONTHLY_GROSS !== -1) {
        sheet.getRange(i + 1, colMap.MONTHLY_GROSS + 1).setValue(rentalData.monthlyGross);
      }
      if (colMap.MONTHLY_NET !== -1) {
        sheet.getRange(i + 1, colMap.MONTHLY_NET + 1).setValue(rentalData.monthlyNet);
      }
      if (colMap.BREAKEVEN_DAYS !== -1) {
        sheet.getRange(i + 1, colMap.BREAKEVEN_DAYS + 1).setValue(rentalData.breakevenMonths);
      }
      if (colMap.RENTAL_RISK !== -1) {
        sheet.getRange(i + 1, colMap.RENTAL_RISK + 1).setValue(rentalData.rentalRisk);
      }

      updatedCount++;
      if (rentalData.viable) rentalViableCount++;
    }

    logSystem('RENTAL_ANALYSIS_UPDATE', `Updated ${updatedCount} records, ${rentalViableCount} rental viable`);

    SpreadsheetApp.getUi().alert(
      '✅ Rental Analysis Complete',
      `Analyzed ${updatedCount} vehicles.\n\n` +
      `${rentalViableCount} vehicles are rental-viable.\n\n` +
      'Check the Rental Analysis sheet for top opportunities.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('RENTAL_ANALYSIS_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error updating rental analysis: ' + error.message);
  }
}

/**
 * Generate Rental Analysis Dashboard
 * Shows top rental opportunities ranked by monthly net profit
 */
function generateRentalDashboard() {
  try {
    const masterSheet = getSheet(SHEETS.MASTER.name);
    const rentalSheet = getSheet(SHEETS.RENTAL.name);

    const masterData = masterSheet.getDataRange().getValues();

    if (masterData.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = masterData[0];

    // Find column indices
    const rentalViableCol = headers.indexOf(MASTER_COLUMNS.RENTAL_VIABLE);
    const yearCol = headers.indexOf(MASTER_COLUMNS.YEAR);
    const makeCol = headers.indexOf(MASTER_COLUMNS.MAKE);
    const modelCol = headers.indexOf(MASTER_COLUMNS.MODEL);
    const askingPriceCol = headers.indexOf(MASTER_COLUMNS.ASKING_PRICE);
    const maoCol = headers.indexOf(MASTER_COLUMNS.MAO);
    const dailyRateCol = headers.indexOf(MASTER_COLUMNS.DAILY_RATE);
    const monthlyGrossCol = headers.indexOf(MASTER_COLUMNS.MONTHLY_GROSS);
    const monthlyNetCol = headers.indexOf(MASTER_COLUMNS.MONTHLY_NET);
    const breakevenCol = headers.indexOf(MASTER_COLUMNS.BREAKEVEN_DAYS);
    const rentalRiskCol = headers.indexOf(MASTER_COLUMNS.RENTAL_RISK);
    const bodyTypeCol = headers.indexOf(MASTER_COLUMNS.BODY_TYPE);
    const conditionCol = headers.indexOf(MASTER_COLUMNS.CONDITION);
    const mileageCol = headers.indexOf(MASTER_COLUMNS.MILEAGE);
    const enthusiastCol = headers.indexOf(MASTER_COLUMNS.ENTHUSIAST_FLAG);

    // Build dashboard data - only viable rentals
    const dashboardData = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];

      // Only include rental-viable vehicles
      if (row[rentalViableCol] !== 'Yes') continue;

      const vehicle = `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`;
      const monthlyNet = row[monthlyNetCol] || 0;
      const annualNet = monthlyNet * 12;

      // Determine verdict
      let verdict;
      if (monthlyNet >= 800) verdict = '💎 RENTAL GEM';
      else if (monthlyNet >= 600) verdict = '✅ SOLID RENTAL';
      else if (monthlyNet >= 400) verdict = '🤔 MARGINAL';
      else verdict = '❌ NOT VIABLE';

      dashboardData.push([
        0, // Rank - will be set after sorting
        vehicle,
        row[askingPriceCol] || 0,
        row[maoCol] || 0,
        row[dailyRateCol] || 0,
        row[monthlyGrossCol] || 0,
        monthlyNet,
        annualNet,
        row[breakevenCol] || 'N/A',
        row[rentalRiskCol] || 'N/A',
        row[bodyTypeCol] || '',
        row[conditionCol] || '',
        row[mileageCol] || 0,
        row[enthusiastCol] || 'No',
        verdict,
        '' // Notes column
      ]);
    }

    // Sort by monthly net profit (descending)
    dashboardData.sort((a, b) => b[6] - a[6]);

    // Add rank numbers
    for (let i = 0; i < dashboardData.length; i++) {
      dashboardData[i][0] = i + 1;
    }

    // Clear existing data
    clearSheetData(SHEETS.RENTAL.name);

    // Write dashboard data
    if (dashboardData.length > 0) {
      rentalSheet.getRange(2, 1, dashboardData.length, dashboardData[0].length)
        .setValues(dashboardData);
    }

    // Apply formatting
    applyRentalFormatting(rentalSheet, dashboardData.length);

    logSystem('RENTAL_DASHBOARD_GENERATED', `Generated dashboard with ${dashboardData.length} rental opportunities`);

    SpreadsheetApp.getUi().alert(
      '✅ Rental Dashboard Generated',
      `Found ${dashboardData.length} rental-viable vehicles.\n\n` +
      'Sorted by monthly net profit. Focus on 💎 RENTAL GEMS for best ROI!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('RENTAL_DASHBOARD_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error generating rental dashboard: ' + error.message);
  }
}

/**
 * Apply conditional formatting to Rental Dashboard
 * @param {Sheet} sheet - The rental sheet
 * @param {number} dataRows - Number of data rows
 */
function applyRentalFormatting(sheet, dataRows) {
  if (dataRows === 0) return;

  // Format currency columns
  sheet.getRange(2, 3, dataRows, 1).setNumberFormat('$#,##0'); // Asking Price
  sheet.getRange(2, 4, dataRows, 1).setNumberFormat('$#,##0'); // Offer Target
  sheet.getRange(2, 5, dataRows, 1).setNumberFormat('$#,##0'); // Daily Rate
  sheet.getRange(2, 6, dataRows, 1).setNumberFormat('$#,##0'); // Monthly Gross
  sheet.getRange(2, 7, dataRows, 1).setNumberFormat('$#,##0'); // Monthly Net
  sheet.getRange(2, 8, dataRows, 1).setNumberFormat('$#,##0'); // Annual Net

  // Color code by verdict
  for (let i = 0; i < dataRows; i++) {
    const row = i + 2;
    const verdict = sheet.getRange(row, 15).getValue();

    let bgColor = '#FFFFFF';
    if (verdict.includes('RENTAL GEM')) bgColor = '#e8f5e9'; // Light green
    else if (verdict.includes('SOLID')) bgColor = '#f3f9ff'; // Light blue
    else if (verdict.includes('MARGINAL')) bgColor = '#fff9e6'; // Light yellow

    sheet.getRange(row, 1, 1, 16).setBackground(bgColor);
  }
}

/**
 * Compare flip vs rental strategies for a vehicle
 * Helps decide which strategy generates more value
 * @param {Object} vehicle - Vehicle data
 * @param {number} flipProfit - Expected one-time flip profit
 * @return {Object} Comparison analysis
 */
function compareFlipVsRental(vehicle, flipProfit) {
  const rentalData = calculateRentalAnalysis(vehicle);

  if (!rentalData.viable) {
    return {
      recommendation: 'FLIP',
      reason: 'Not rental viable',
      flipValue: flipProfit,
      rentalValue: 0,
      advantage: flipProfit
    };
  }

  // Calculate rental value over same timeframe as flip (assume 3 months for flip)
  const rentalValueThreeMonths = rentalData.monthlyNet * 3;

  // Calculate rental value over 1 year
  const rentalValueOneYear = rentalData.annualNet;

  // Determine recommendation
  let recommendation, reason, advantage;

  if (flipProfit > rentalValueOneYear) {
    recommendation = 'FLIP';
    reason = `Flip profit ($${formatNumber(flipProfit)}) exceeds annual rental profit`;
    advantage = flipProfit - rentalValueOneYear;
  } else if (rentalData.breakevenMonths <= 12 && rentalData.monthlyNet >= 600) {
    recommendation = 'RENTAL';
    reason = `Strong rental asset: $${formatNumber(rentalData.monthlyNet)}/mo, ${rentalData.breakevenMonths} mo breakeven`;
    advantage = rentalValueOneYear - flipProfit;
  } else if (flipProfit > rentalValueThreeMonths) {
    recommendation = 'FLIP';
    reason = 'Better immediate return on capital';
    advantage = flipProfit - rentalValueThreeMonths;
  } else {
    recommendation = 'RENTAL';
    reason = 'Better long-term value';
    advantage = rentalValueOneYear - flipProfit;
  }

  return {
    recommendation: recommendation,
    reason: reason,
    flipValue: flipProfit,
    rentalValueShortTerm: rentalValueThreeMonths,
    rentalValueLongTerm: rentalValueOneYear,
    advantage: Math.round(advantage),
    breakevenMonths: rentalData.breakevenMonths
  };
}
