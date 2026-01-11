// ==========================================
// CARHAWK ULTIMATE - MAO CALCULATION ENGINE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Calculate Maximum Allowable Offer using industry formulas and strategy rules
// ==========================================

/**
 * CORE FORMULA:
 * MAO = (Estimated Resale Value × Rule %) - Repair Costs - Fixed Costs
 *
 * Different strategies use different rule percentages:
 * - Quick Flip: 75% rule
 * - Repair Flip: 65% rule
 * - Enthusiast: 70% rule
 * - Rental Hold: 80% rule (higher because we hold longer)
 */

/**
 * Calculate MAO for a vehicle
 * @param {Object} vehicle - Vehicle data object
 * @param {string} strategy - Flip strategy (optional, auto-detected if not provided)
 * @return {Object} MAO calculation with breakdown
 */
function calculateMAO(vehicle, strategy = null) {
  // Extract data
  const estimatedResale = vehicle[MASTER_COLUMNS.ESTIMATED_RESALE] || 0;
  const estimatedRepair = vehicle[MASTER_COLUMNS.ESTIMATED_REPAIR] || 0;
  const askingPrice = vehicle[MASTER_COLUMNS.ASKING_PRICE] || 0;
  const enthusiastFlag = vehicle[MASTER_COLUMNS.ENTHUSIAST_FLAG] || 'No';
  const rentalViable = vehicle[MASTER_COLUMNS.RENTAL_VIABLE] || 'No';

  if (estimatedResale === 0) {
    return {
      mao: 0,
      offerTarget: 0,
      profit: 0,
      profitPercent: 0,
      rule: 'N/A',
      breakdown: {
        resale: 0,
        rulePercent: 0,
        ruleValue: 0,
        repairCosts: 0,
        fixedCosts: 0,
        totalDeductions: 0
      },
      viable: false,
      reason: 'No estimated resale value'
    };
  }

  // Determine strategy if not provided
  if (!strategy) {
    strategy = determineOptimalStrategy(vehicle);
  }

  // Get rule percentage based on strategy
  let rulePercent;
  if (strategy === FLIP_STRATEGIES.RENTAL_HOLD) {
    rulePercent = MAO_CONFIG.RENTAL_RULE;
  } else if (enthusiastFlag === 'Yes') {
    rulePercent = MAO_CONFIG.ENTHUSIAST_RULE;
  } else if (estimatedRepair > 1000) {
    rulePercent = MAO_CONFIG.REPAIR_FLIP_RULE;
  } else {
    rulePercent = MAO_CONFIG.QUICK_FLIP_RULE;
  }

  // Calculate components
  const ruleValue = estimatedResale * rulePercent;

  // Calculate fixed costs
  const fixedCosts = Object.values(MAO_CONFIG.FIXED_COSTS).reduce((sum, cost) => sum + cost, 0);

  // Total deductions
  const totalDeductions = estimatedRepair + fixedCosts;

  // Calculate MAO
  const mao = Math.max(0, ruleValue - totalDeductions);

  // Offer target (typically 90-95% of MAO to leave negotiation room)
  const offerTarget = Math.round(mao * 0.92);

  // Calculate profit if bought at offer target
  const profit = estimatedResale - offerTarget - estimatedRepair - fixedCosts;
  const profitPercent = offerTarget > 0 ? profit / offerTarget : 0;

  // Check if deal is viable
  const minProfit = getMinProfitForTier(askingPrice);
  const viable = profit >= minProfit && offerTarget < askingPrice;

  let reason = '';
  if (!viable) {
    if (profit < minProfit) {
      reason = `Profit too low (need $${minProfit} for this tier)`;
    } else if (offerTarget >= askingPrice) {
      reason = 'Offer target exceeds asking price (already fair or overpriced)';
    }
  }

  return {
    mao: Math.round(mao),
    offerTarget: offerTarget,
    profit: Math.round(profit),
    profitPercent: profitPercent,
    rule: `${Math.round(rulePercent * 100)}% Rule`,
    breakdown: {
      resale: estimatedResale,
      rulePercent: rulePercent,
      ruleValue: Math.round(ruleValue),
      repairCosts: estimatedRepair,
      fixedCosts: fixedCosts,
      totalDeductions: totalDeductions
    },
    viable: viable,
    reason: reason,
    strategy: strategy
  };
}

/**
 * Determine optimal flip strategy based on vehicle characteristics
 * @param {Object} vehicle - Vehicle data object
 * @return {string} Recommended flip strategy
 */
function determineOptimalStrategy(vehicle) {
  const estimatedRepair = vehicle[MASTER_COLUMNS.ESTIMATED_REPAIR] || 0;
  const rentalViable = vehicle[MASTER_COLUMNS.RENTAL_VIABLE] || 'No';
  const monthlyNet = vehicle[MASTER_COLUMNS.MONTHLY_NET] || 0;
  const hazardFlags = vehicle[MASTER_COLUMNS.HAZARD_FLAGS] || '';
  const titleStatus = vehicle[MASTER_COLUMNS.TITLE_STATUS] || '';
  const condition = vehicle[MASTER_COLUMNS.CONDITION] || '';

  // Part-out if severe damage or salvage
  if (hazardFlags.includes('🚨') || titleStatus.toLowerCase().includes('parts only')) {
    return FLIP_STRATEGIES.PART_OUT;
  }

  // Rental hold if strong rental candidate
  if (rentalViable === 'Yes' && monthlyNet >= 600) {
    return FLIP_STRATEGIES.RENTAL_HOLD;
  }

  // Repair flip if significant repairs needed
  if (estimatedRepair > 2000) {
    return FLIP_STRATEGIES.REPAIR_FLIP;
  }

  // Quick flip for clean, ready-to-sell vehicles
  if (estimatedRepair < 500 && getConditionScore(condition) >= 75) {
    return FLIP_STRATEGIES.QUICK_FLIP;
  }

  // Default to quick flip
  return FLIP_STRATEGIES.QUICK_FLIP;
}

/**
 * Estimate resale value using market data and comparable pricing
 * @param {Object} vehicle - Vehicle data object
 * @return {number} Estimated resale value
 */
function estimateResaleValue(vehicle) {
  const year = vehicle[MASTER_COLUMNS.YEAR] || 0;
  const make = vehicle[MASTER_COLUMNS.MAKE] || '';
  const model = vehicle[MASTER_COLUMNS.MODEL] || '';
  const mileage = vehicle[MASTER_COLUMNS.MILEAGE] || 0;
  const condition = vehicle[MASTER_COLUMNS.CONDITION] || '';
  const bodyType = vehicle[MASTER_COLUMNS.BODY_TYPE] || '';
  const askingPrice = vehicle[MASTER_COLUMNS.ASKING_PRICE] || 0;

  // If no data, return 0
  if (year === 0 || !make || !model) return 0;

  // Start with asking price as baseline
  let estimatedValue = askingPrice;

  // If asking price is 0, use rough KBB estimation
  if (estimatedValue === 0) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    // Very rough estimation: depreciation curve
    // New car average: $30k, depreciates 15-20% per year
    const avgNewCarPrice = 30000;
    const depreciationRate = 0.15;

    estimatedValue = avgNewCarPrice * Math.pow(1 - depreciationRate, age);
  }

  // Adjust for mileage
  // Average: 12,000 miles/year
  const expectedMileage = (new Date().getFullYear() - year) * 12000;
  const mileageDiff = mileage - expectedMileage;

  if (mileageDiff > 0) {
    // High mileage - deduct $0.10 per extra mile
    estimatedValue -= (mileageDiff * 0.10);
  } else {
    // Low mileage - add premium $0.05 per mile under
    estimatedValue += (Math.abs(mileageDiff) * 0.05);
  }

  // Adjust for condition
  const conditionScore = getConditionScore(condition);
  const conditionMultiplier = conditionScore / 85; // 85 = "Very Good" baseline

  estimatedValue *= conditionMultiplier;

  // Adjust for body type popularity
  const popularTypes = ['Truck', 'SUV', 'Crossover'];
  if (popularTypes.some(type => bodyType.includes(type))) {
    estimatedValue *= 1.1; // 10% premium for popular types
  }

  // Floor at reasonable minimum
  estimatedValue = Math.max(estimatedValue, 1000);

  return Math.round(estimatedValue);
}

/**
 * Estimate repair costs from description and condition
 * @param {Object} vehicle - Vehicle data object
 * @return {number} Estimated repair cost
 */
function estimateRepairCosts(vehicle) {
  const description = (vehicle[MASTER_COLUMNS.DESCRIPTION] || '').toLowerCase();
  const condition = vehicle[MASTER_COLUMNS.CONDITION] || '';
  const hazardFlags = vehicle[MASTER_COLUMNS.HAZARD_FLAGS] || '';

  let totalRepairCost = 0;

  // Scan description for repair keywords
  for (let keyword in REPAIR_KEYWORDS) {
    if (description.includes(keyword)) {
      totalRepairCost += REPAIR_KEYWORDS[keyword].cost;
    }
  }

  // Add base repair cost based on condition
  const conditionScore = getConditionScore(condition);

  if (conditionScore < 65) {
    totalRepairCost += 2000; // Poor condition base
  } else if (conditionScore < 75) {
    totalRepairCost += 1000; // Fair condition base
  } else if (conditionScore < 85) {
    totalRepairCost += 500; // Good condition base
  }

  // Add cost for hazard flags
  if (hazardFlags.includes('🚨')) {
    totalRepairCost += 3000; // Critical issues
  } else if (hazardFlags.includes('⚠️')) {
    totalRepairCost += 1500; // High severity issues
  } else if (hazardFlags.includes('⚡')) {
    totalRepairCost += 500; // Medium issues
  }

  return Math.round(totalRepairCost);
}

/**
 * Update MAO calculations for all vehicles in Master Database
 */
function updateMAOCalculations() {
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

      // Estimate resale if not set
      if (!vehicle[MASTER_COLUMNS.ESTIMATED_RESALE] || vehicle[MASTER_COLUMNS.ESTIMATED_RESALE] === 0) {
        const estimatedResale = estimateResaleValue(vehicle);
        vehicle[MASTER_COLUMNS.ESTIMATED_RESALE] = estimatedResale;
        if (colMap.ESTIMATED_RESALE !== -1) {
          sheet.getRange(i + 1, colMap.ESTIMATED_RESALE + 1).setValue(estimatedResale);
        }
      }

      // Estimate repair costs if not set
      if (!vehicle[MASTER_COLUMNS.ESTIMATED_REPAIR] || vehicle[MASTER_COLUMNS.ESTIMATED_REPAIR] === 0) {
        const repairCost = estimateRepairCosts(vehicle);
        vehicle[MASTER_COLUMNS.ESTIMATED_REPAIR] = repairCost;
        if (colMap.ESTIMATED_REPAIR !== -1) {
          sheet.getRange(i + 1, colMap.ESTIMATED_REPAIR + 1).setValue(repairCost);
        }
      }

      // Calculate MAO
      const maoData = calculateMAO(vehicle);

      // Update columns
      if (colMap.MAO !== -1) {
        sheet.getRange(i + 1, colMap.MAO + 1).setValue(maoData.mao);
      }
      if (colMap.OFFER_TARGET !== -1) {
        sheet.getRange(i + 1, colMap.OFFER_TARGET + 1).setValue(maoData.offerTarget);
      }
      if (colMap.PROFIT_DOLLAR !== -1) {
        sheet.getRange(i + 1, colMap.PROFIT_DOLLAR + 1).setValue(maoData.profit);
      }
      if (colMap.PROFIT_PERCENT !== -1) {
        sheet.getRange(i + 1, colMap.PROFIT_PERCENT + 1).setValue(maoData.profitPercent);
      }
      if (colMap.FLIP_STRATEGY !== -1) {
        sheet.getRange(i + 1, colMap.FLIP_STRATEGY + 1).setValue(maoData.strategy);
      }

      updatedCount++;
    }

    logSystem('MAO_CALCULATION_UPDATE', `Updated ${updatedCount} MAO calculations`);

    SpreadsheetApp.getUi().alert(
      '✅ MAO Calculations Complete',
      `Updated ${updatedCount} vehicle records with MAO, offer targets, and profit projections.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('MAO_CALCULATION_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error updating MAO calculations: ' + error.message);
  }
}

/**
 * Calculate MAO for a single vehicle (manual calculator)
 * @param {number} resaleValue - Estimated resale value
 * @param {number} repairCosts - Estimated repair costs
 * @param {string} strategy - Flip strategy
 * @return {Object} MAO breakdown
 */
function calculateMAOManual(resaleValue, repairCosts, strategy) {
  // Get rule percentage
  let rulePercent;
  switch (strategy) {
    case FLIP_STRATEGIES.QUICK_FLIP:
      rulePercent = MAO_CONFIG.QUICK_FLIP_RULE;
      break;
    case FLIP_STRATEGIES.REPAIR_FLIP:
      rulePercent = MAO_CONFIG.REPAIR_FLIP_RULE;
      break;
    case FLIP_STRATEGIES.RENTAL_HOLD:
      rulePercent = MAO_CONFIG.RENTAL_RULE;
      break;
    default:
      rulePercent = MAO_CONFIG.QUICK_FLIP_RULE;
  }

  const ruleValue = resaleValue * rulePercent;
  const fixedCosts = Object.values(MAO_CONFIG.FIXED_COSTS).reduce((sum, cost) => sum + cost, 0);
  const totalDeductions = repairCosts + fixedCosts;
  const mao = Math.max(0, ruleValue - totalDeductions);
  const offerTarget = Math.round(mao * 0.92);
  const profit = resaleValue - offerTarget - repairCosts - fixedCosts;

  return {
    mao: Math.round(mao),
    offerTarget: offerTarget,
    profit: Math.round(profit),
    profitPercent: offerTarget > 0 ? profit / offerTarget : 0,
    rule: `${Math.round(rulePercent * 100)}% Rule`,
    breakdown: {
      resale: resaleValue,
      ruleValue: Math.round(ruleValue),
      repairCosts: repairCosts,
      fixedCosts: fixedCosts,
      totalDeductions: totalDeductions
    }
  };
}
