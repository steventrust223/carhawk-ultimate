// =========================================================
// CARHAWK ULTIMATE - TURO ENGINE (Core Analysis Module)
// =========================================================
// Version: 1.0.0
// Purpose: Vehicle classification, Turo economics computation,
//          Hold Score scoring, risk tiers, and Master DB writeback.
// =========================================================

// =========================================================
// VEHICLE CLASSIFICATION
// =========================================================

/**
 * Classifies a vehicle into one of 8 Turo rental classes.
 * Priority: Luxury brand > Sports model > Specific model lists > Body type > Default.
 * @param {string} make - Vehicle manufacturer.
 * @param {string} model - Vehicle model name.
 * @param {string} body - Body type (Sedan, SUV, Truck, etc.).
 * @param {number} year - Model year.
 * @returns {string} Vehicle class (Economy, Midsize, Full-Size, SUV, Truck, Luxury, Sports/Exotic, Van/Minivan).
 */
function classifyVehicle(make, model, body, year) {
  var makeUpper = String(make || '').trim();
  var modelStr = String(model || '').trim();
  var bodyStr = String(body || '').trim();

  // 1. Luxury brand check
  for (var i = 0; i < LUXURY_BRANDS.length; i++) {
    if (makeUpper.toLowerCase() === LUXURY_BRANDS[i].toLowerCase()) {
      return VEHICLE_CLASSES.LUXURY;
    }
  }

  // 2. Sports/exotic model check
  for (var j = 0; j < SPORTS_MODELS.length; j++) {
    if (modelStr.toLowerCase().indexOf(SPORTS_MODELS[j].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.SPORTS_EXOTIC;
    }
  }

  // 3. Truck model check
  for (var k = 0; k < TRUCK_MODELS.length; k++) {
    if (modelStr.toLowerCase().indexOf(TRUCK_MODELS[k].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.TRUCK;
    }
  }

  // 4. SUV model check
  for (var l = 0; l < SUV_MODELS.length; l++) {
    if (modelStr.toLowerCase().indexOf(SUV_MODELS[l].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.SUV;
    }
  }

  // 5. Van/Minivan model check
  for (var m = 0; m < VAN_MODELS.length; m++) {
    if (modelStr.toLowerCase().indexOf(VAN_MODELS[m].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.VAN_MINIVAN;
    }
  }

  // 6. Economy model check
  for (var n = 0; n < ECONOMY_MODELS.length; n++) {
    if (modelStr.toLowerCase().indexOf(ECONOMY_MODELS[n].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.ECONOMY;
    }
  }

  // 7. Full-size model check
  for (var p = 0; p < FULL_SIZE_MODELS.length; p++) {
    if (modelStr.toLowerCase().indexOf(FULL_SIZE_MODELS[p].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.FULL_SIZE;
    }
  }

  // 8. Midsize model check
  for (var q = 0; q < MIDSIZE_MODELS.length; q++) {
    if (modelStr.toLowerCase().indexOf(MIDSIZE_MODELS[q].toLowerCase()) !== -1) {
      return VEHICLE_CLASSES.MIDSIZE;
    }
  }

  // 9. Body type fallback
  var bodyLower = bodyStr.toLowerCase();
  if (bodyLower.indexOf('truck') !== -1 || bodyLower.indexOf('pickup') !== -1) return VEHICLE_CLASSES.TRUCK;
  if (bodyLower.indexOf('suv') !== -1 || bodyLower.indexOf('crossover') !== -1) return VEHICLE_CLASSES.SUV;
  if (bodyLower.indexOf('van') !== -1 || bodyLower.indexOf('minivan') !== -1) return VEHICLE_CLASSES.VAN_MINIVAN;
  if (bodyLower.indexOf('hatchback') !== -1) return VEHICLE_CLASSES.ECONOMY;

  // 10. Default
  return VEHICLE_CLASSES.MIDSIZE;
}

// =========================================================
// AGE & DEPRECIATION
// =========================================================

/**
 * Returns the age of a vehicle in years.
 * @param {number} year - Vehicle model year.
 * @returns {number} Age in years.
 */
function getVehicleAge(year) {
  var currentYear = new Date().getFullYear();
  return Math.max(0, currentYear - (parseInt(year, 10) || currentYear));
}

/**
 * Returns the annual depreciation rate for a vehicle, including Turo rental add-on.
 * @param {number} vehicleAge - Age of vehicle in years.
 * @returns {number} Annual depreciation rate (e.g. 0.17 = 17%).
 */
function getDepreciationRate(vehicleAge) {
  var baseRate = DEPRECIATION_TIERS[DEPRECIATION_TIERS.length - 1].rate; // default to last tier
  for (var i = 0; i < DEPRECIATION_TIERS.length; i++) {
    if (vehicleAge >= DEPRECIATION_TIERS[i].minAge && vehicleAge <= DEPRECIATION_TIERS[i].maxAge) {
      baseRate = DEPRECIATION_TIERS[i].rate;
      break;
    }
  }
  return baseRate + TURO_DEPRECIATION_ADDON;
}

// =========================================================
// PRICING & SETTINGS LOOKUP
// =========================================================

/**
 * Gets pricing defaults for a vehicle class from the Turo Pricing sheet.
 * Falls back to TURO_PRICING_DEFAULTS constants if sheet is unavailable.
 * @param {string} vehicleClass - One of the 8 vehicle classes.
 * @returns {Object} Pricing defaults {dailyRate, utilization, tripLength, insurance, registration, cleaning, maintenanceReserve, flipTimeline}.
 */
function getPricingDefaults(vehicleClass) {
  // Try to read from Turo Pricing & Seasonality sheet first
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(TURO_SHEETS.PRICING.name);
    if (sheet) {
      var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      var classCol = -1;
      for (var c = 1; c < headerRow.length; c++) {
        if (headerRow[c] === vehicleClass) {
          classCol = c + 1; // 1-based
          break;
        }
      }
      if (classCol > 0) {
        var data = sheet.getRange(2, classCol, 8, 1).getValues();
        return {
          dailyRate: parseFloat(data[0][0]) || 50,
          utilization: parseFloat(data[1][0]) || 0.55,
          tripLength: parseFloat(data[2][0]) || 3,
          insurance: parseFloat(data[3][0]) || 175,
          registration: parseFloat(data[4][0]) || 275,
          cleaning: parseFloat(data[5][0]) || 30,
          maintenanceReserve: parseFloat(data[6][0]) || 0.06,
          flipTimeline: parseFloat(data[7][0]) || 21
        };
      }
    }
  } catch (e) {
    // Fall through to defaults
  }

  // Fallback to constants
  var defaults = TURO_PRICING_DEFAULTS[vehicleClass] || TURO_PRICING_DEFAULTS['Midsize'];
  return {
    dailyRate: defaults.dailyRate,
    utilization: defaults.utilization,
    tripLength: defaults.tripLength,
    insurance: defaults.insurance,
    registration: defaults.registration,
    cleaning: defaults.cleaning,
    maintenanceReserve: defaults.maintenanceReserve,
    flipTimeline: defaults.flipTimeline
  };
}

/**
 * Reads all Turo settings from the Settings sheet.
 * @returns {Object} Key-value map of all TURO_* settings.
 */
function getTuroSettings() {
  var settings = {};
  // Initialize with defaults
  for (var i = 0; i < TURO_SETTINGS_DEFAULTS.length; i++) {
    settings[TURO_SETTINGS_DEFAULTS[i].key] = TURO_SETTINGS_DEFAULTS[i].value;
  }

  // Override with actual sheet values
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(QUANTUM_SHEETS.SETTINGS.name);
    if (sheet) {
      var data = sheet.getDataRange().getValues();
      for (var j = 1; j < data.length; j++) {
        var key = String(data[j][0]).trim();
        if (key.indexOf('TURO_') === 0 && data[j][1] !== '') {
          settings[key] = data[j][1];
        }
      }
    }
  } catch (e) {
    // Use defaults
  }

  return settings;
}

// =========================================================
// TURO ECONOMICS COMPUTATION
// =========================================================

/**
 * Pure calculation function for Turo economics.
 * @param {Object} vehicleData - Vehicle details from Master DB.
 * @param {Object} defaults - Pricing defaults for vehicle class.
 * @param {Object} settings - Turo settings from Settings sheet.
 * @param {Object} overrides - Optional manual overrides for any field.
 * @returns {Object} Full economics breakdown.
 */
function computeTuroEconomics(vehicleData, defaults, settings, overrides) {
  overrides = overrides || {};

  var askingPrice = parseFloat(overrides.askingPrice || vehicleData.askingPrice) || 0;
  var repairCost = parseFloat(overrides.repairCost || vehicleData.repairCost) || 0;
  var totalAcquisitionCost = askingPrice + repairCost;

  var estimatedResale = parseFloat(overrides.resaleValue || vehicleData.resaleValue) || 0;
  var flipNetProfit = parseFloat(vehicleData.flipNetProfit) || (estimatedResale - totalAcquisitionCost);

  var dailyRate = parseFloat(overrides.dailyRate || defaults.dailyRate) || 50;
  var utilization = parseFloat(overrides.utilization || defaults.utilization) || 0.55;
  var platformFeePct = parseFloat(settings.TURO_PLATFORM_FEE_PCT) || 0.25;
  var insuranceMonthly = parseFloat(overrides.insurance || defaults.insurance) || 175;
  var cleaningPerTrip = parseFloat(overrides.cleaningPerTrip || settings.TURO_CLEANING_PER_TRIP || defaults.cleaning) || 30;
  var avgTripLength = parseFloat(overrides.avgTripLength || settings.TURO_AVG_TRIP_LENGTH || defaults.tripLength) || 3;
  var maintenanceReservePct = parseFloat(overrides.maintenanceReserve || settings.TURO_MAINTENANCE_RESERVE_PCT || defaults.maintenanceReserve) || 0.06;
  var annualReg = parseFloat(overrides.registration || settings.TURO_ANNUAL_REGISTRATION || defaults.registration) || 275;
  var annualInspection = parseFloat(settings.TURO_ANNUAL_INSPECTION) || 50;
  var financingAPR = parseFloat(settings.TURO_FINANCING_APR) || 0;
  var financingTerm = parseFloat(settings.TURO_FINANCING_TERM) || 0;
  var flipTimeline = parseFloat(overrides.flipTimeline || defaults.flipTimeline) || 21;

  // Apply seasonal multipliers if enabled
  var useSeasonal = String(settings.TURO_USE_SEASONAL).toLowerCase() === 'true';
  if (useSeasonal) {
    var month = new Date().getMonth(); // 0-11
    dailyRate = dailyRate * (SEASONAL_RATE_MULTIPLIERS[month] || 1.0);
    utilization = utilization * (SEASONAL_UTIL_MULTIPLIERS[month] || 1.0);
  }

  // Core calculations
  var daysPerMonth = 30.44;
  var grossMonthlyRevenue = dailyRate * daysPerMonth * utilization;
  var platformFeeAmt = grossMonthlyRevenue * platformFeePct;
  var tripsPerMonth = (daysPerMonth * utilization) / avgTripLength;
  var totalCleaningMonthly = cleaningPerTrip * tripsPerMonth;
  var maintenanceReserveMonthly = (totalAcquisitionCost * maintenanceReservePct) / 12;

  // Depreciation
  var vehicleAge = getVehicleAge(vehicleData.year);
  var annualDepRate = getDepreciationRate(vehicleAge);
  var depreciationMonthly = (estimatedResale * annualDepRate) / 12;

  // Financing payment (PMT formula if financed)
  var financingPayment = 0;
  if (financingAPR > 0 && financingTerm > 0) {
    var monthlyRate = financingAPR / 12;
    financingPayment = (totalAcquisitionCost * monthlyRate * Math.pow(1 + monthlyRate, financingTerm)) /
                       (Math.pow(1 + monthlyRate, financingTerm) - 1);
  }

  var registrationTaxMonthly = (annualReg + annualInspection) / 12;

  var totalMonthlyExpenses = platformFeeAmt + insuranceMonthly + totalCleaningMonthly +
                             maintenanceReserveMonthly + depreciationMonthly + financingPayment +
                             registrationTaxMonthly;

  var netMonthlyCashFlow = grossMonthlyRevenue - totalMonthlyExpenses;
  var netAnnualCashFlow = netMonthlyCashFlow * 12;

  var paybackMonths = netMonthlyCashFlow > 0 ? totalAcquisitionCost / netMonthlyCashFlow : Infinity;

  // Break-even utilization: what utilization % would make net = 0
  var fixedMonthlyExpenses = insuranceMonthly + maintenanceReserveMonthly + depreciationMonthly +
                             financingPayment + registrationTaxMonthly;
  var revenuePerUtilDay = dailyRate * daysPerMonth;
  var feeAndCleaningPerUtil = (revenuePerUtilDay * platformFeePct) + (cleaningPerTrip * daysPerMonth / avgTripLength);
  var netRevenuePerUtil = revenuePerUtilDay - feeAndCleaningPerUtil;
  var breakEvenUtilization = netRevenuePerUtil > 0 ? fixedMonthlyExpenses / netRevenuePerUtil : 1.0;

  // 12-month profit comparison
  var depreciatedResale12 = estimatedResale * (1 - annualDepRate);
  var turo12MonthProfit = (netMonthlyCashFlow * 12) + depreciatedResale12 - totalAcquisitionCost;
  var flip12MonthProfit = flipNetProfit;
  var turoVsFlipDelta = turo12MonthProfit - flip12MonthProfit;

  return {
    totalAcquisitionCost: totalAcquisitionCost,
    estimatedResale: estimatedResale,
    flipNetProfit: flipNetProfit,
    flipTimeline: flipTimeline,
    dailyRate: dailyRate,
    utilization: utilization,
    grossMonthlyRevenue: grossMonthlyRevenue,
    platformFeePct: platformFeePct,
    platformFeeAmt: platformFeeAmt,
    insuranceMonthly: insuranceMonthly,
    cleaningPerTrip: cleaningPerTrip,
    tripsPerMonth: tripsPerMonth,
    totalCleaningMonthly: totalCleaningMonthly,
    maintenanceReserveMonthly: maintenanceReserveMonthly,
    depreciationMonthly: depreciationMonthly,
    financingPayment: financingPayment,
    registrationTaxMonthly: registrationTaxMonthly,
    totalMonthlyExpenses: totalMonthlyExpenses,
    netMonthlyCashFlow: netMonthlyCashFlow,
    netAnnualCashFlow: netAnnualCashFlow,
    paybackMonths: paybackMonths,
    breakEvenUtilization: breakEvenUtilization,
    turo12MonthProfit: turo12MonthProfit,
    flip12MonthProfit: flip12MonthProfit,
    turoVsFlipDelta: turoVsFlipDelta
  };
}

// =========================================================
// TURO HOLD SCORE
// =========================================================

/**
 * Computes the composite Turo Hold Score (0-100).
 * @param {Object} economics - Output from computeTuroEconomics().
 * @param {number} mileage - Current vehicle mileage.
 * @param {Object} settings - Turo settings from Settings sheet.
 * @returns {number} Score from 0 to 100.
 */
function computeTuroHoldScore(economics, mileage, settings) {
  var w = {
    payback:      parseFloat(settings.TURO_WEIGHT_PAYBACK) || TURO_SCORE_WEIGHTS.PAYBACK,
    cashFlow:     parseFloat(settings.TURO_WEIGHT_CASHFLOW) || TURO_SCORE_WEIGHTS.CASH_FLOW,
    utilization:  parseFloat(settings.TURO_WEIGHT_UTILIZATION) || TURO_SCORE_WEIGHTS.UTILIZATION,
    depreciation: parseFloat(settings.TURO_WEIGHT_DEPRECIATION) || TURO_SCORE_WEIGHTS.DEPRECIATION,
    flipCompare:  parseFloat(settings.TURO_WEIGHT_FLIP_COMPARISON) || TURO_SCORE_WEIGHTS.FLIP_COMPARISON,
    mileageW:     parseFloat(settings.TURO_WEIGHT_MILEAGE) || TURO_SCORE_WEIGHTS.MILEAGE
  };

  // Sub-scores (each 0-100)
  var paybackScore = Math.max(0, 100 - ((economics.paybackMonths === Infinity ? 25 : economics.paybackMonths) * 4));
  var cashFlowScore = Math.min(100, Math.max(0, economics.netMonthlyCashFlow / 5));
  var utilizationScore = Math.min(100, (economics.utilization || 0.5) * 100);

  var annualDepRate = economics.estimatedResale > 0
    ? (economics.depreciationMonthly * 12) / economics.estimatedResale
    : 0.15;
  var depreciationScore = Math.max(0, 100 - (annualDepRate * 100 * 5));

  var flipCompareScore = economics.turoVsFlipDelta > 0
    ? 100
    : Math.max(0, 100 - Math.abs(economics.turoVsFlipDelta) / 20);

  var mileageScore = Math.max(0, 100 - ((mileage || 0) / 2000));

  var totalScore = (paybackScore * w.payback) +
                   (cashFlowScore * w.cashFlow) +
                   (utilizationScore * w.utilization) +
                   (depreciationScore * w.depreciation) +
                   (flipCompareScore * w.flipCompare) +
                   (mileageScore * w.mileageW);

  return Math.round(Math.max(0, Math.min(100, totalScore)));
}

/**
 * Returns the risk tier label for a given Turo Hold Score.
 * @param {number} score - Turo Hold Score (0-100).
 * @returns {string} Risk tier: Low, Medium, High, or Critical.
 */
function getRiskTier(score) {
  if (score >= TURO_RISK_TIERS.LOW.min) return TURO_RISK_TIERS.LOW.label;
  if (score >= TURO_RISK_TIERS.MEDIUM.min) return TURO_RISK_TIERS.MEDIUM.label;
  if (score >= TURO_RISK_TIERS.HIGH.min) return TURO_RISK_TIERS.HIGH.label;
  return TURO_RISK_TIERS.CRITICAL.label;
}

/**
 * Determines the recommended strategy based on score, delta, and override status.
 * @param {number} score - Turo Hold Score (0-100).
 * @param {number} delta - Turo vs Flip Delta ($).
 * @param {string} existingStrategy - Current Flip Strategy from Master DB.
 * @param {boolean} hasOverride - Whether Override? is checked on Turo Engine.
 * @returns {string} Recommended strategy.
 */
function getRecommendedStrategy(score, delta, existingStrategy, hasOverride) {
  if (hasOverride) return existingStrategy;

  if (score >= 70 && delta > 0) return 'Turo Hold';
  if (score >= 50 && delta > -500) return existingStrategy;
  return existingStrategy;
}

/**
 * Generates a human-readable rationale for the Turo analysis result.
 * @param {Object} economics - Output from computeTuroEconomics().
 * @param {number} score - Turo Hold Score.
 * @param {string} riskTier - Risk tier label.
 * @param {string} recommended - Recommended strategy.
 * @returns {string} Rationale text.
 */
function generateRationale(economics, score, riskTier, recommended) {
  var netFormatted = '$' + Math.round(economics.netMonthlyCashFlow).toLocaleString();
  var paybackText = economics.paybackMonths === Infinity
    ? 'negative cash flow'
    : Math.round(economics.paybackMonths) + '-month payback';
  var utilPct = Math.round(economics.utilization * 100) + '%';
  var deltaFormatted = '$' + Math.round(Math.abs(economics.turoVsFlipDelta)).toLocaleString();
  var deltaDirection = economics.turoVsFlipDelta >= 0 ? 'Outperforms' : 'Underperforms';

  if (recommended === 'Turo Hold') {
    return 'Turo Hold recommended: ' + netFormatted + '/mo net, ' + paybackText +
           ', ' + utilPct + ' utilization. ' + deltaDirection + ' flip by ' + deltaFormatted +
           ' over 12 months. Risk: ' + riskTier + '.';
  }

  if (score >= 50) {
    return 'Marginal Turo candidate: ' + netFormatted + '/mo net, ' + paybackText +
           '. ' + deltaDirection + ' flip by ' + deltaFormatted +
           ' over 12 months. Score: ' + score + '/100, Risk: ' + riskTier + '. Monitor closely.';
  }

  return 'Turo not recommended: ' + netFormatted + '/mo net, ' + paybackText +
         '. ' + deltaDirection + ' flip by ' + deltaFormatted +
         ' over 12 months. Score: ' + score + '/100, Risk: ' + riskTier + '. Flip is the better strategy.';
}

/**
 * Generates an exit plan for a Turo Hold vehicle.
 * @param {Object} economics - Output from computeTuroEconomics().
 * @param {string} vehicleClass - Vehicle class.
 * @returns {string} Exit plan text.
 */
function generateExitPlan(economics, vehicleClass) {
  var age = 12; // months forward
  var annualDepRate = economics.estimatedResale > 0
    ? (economics.depreciationMonthly * 12) / economics.estimatedResale
    : 0.12;
  var estimatedResale12 = Math.round(economics.estimatedResale * (1 - annualDepRate));
  var breakEvenResale = Math.round(economics.totalAcquisitionCost - (economics.netMonthlyCashFlow * 12));
  var minAcceptableResale = Math.round(breakEvenResale * 1.07); // 7% buffer

  return 'If Turo underperforms: sell after 12 months at estimated $' +
         estimatedResale12.toLocaleString() + '. Minimum acceptable resale: $' +
         minAcceptableResale.toLocaleString() + '. Break-even resale: $' +
         breakEvenResale.toLocaleString() + '.';
}

// =========================================================
// MAIN ANALYSIS FUNCTION
// =========================================================

/**
 * Analyzes a single Master Database row for Turo Hold viability.
 * Writes results to Turo Engine sheet and Master Database writeback columns.
 * @param {number} masterDbRow - 1-based row number in Master Database.
 * @param {Object} overrides - Optional overrides for pricing fields.
 * @returns {Object} Full analysis result.
 */
function analyzeTuroHold(masterDbRow, overrides) {
  overrides = overrides || {};
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);

  if (!dbSheet) {
    throw new Error('Master Database sheet not found');
  }

  var lastCol = dbSheet.getLastColumn();
  var rowData = dbSheet.getRange(masterDbRow, 1, 1, lastCol).getValues()[0];

  // Extract vehicle data using TURO_DB_COLS
  var vehicleData = {
    dealId: rowData[TURO_DB_COLS.DEAL_ID],
    year: rowData[TURO_DB_COLS.YEAR],
    make: rowData[TURO_DB_COLS.MAKE],
    model: rowData[TURO_DB_COLS.MODEL],
    trim: rowData[TURO_DB_COLS.TRIM],
    vin: rowData[TURO_DB_COLS.VIN],
    mileage: parseFloat(rowData[TURO_DB_COLS.MILEAGE]) || 0,
    body: rowData[TURO_DB_COLS.CONDITION] || '', // Body type may be in condition or elsewhere
    askingPrice: parseFloat(rowData[TURO_DB_COLS.PRICE]) || 0,
    resaleValue: parseFloat(rowData[TURO_DB_COLS.MARKET_VALUE]) || 0,
    repairCost: parseFloat(rowData[TURO_DB_COLS.EST_REPAIR_COST]) || 0,
    flipNetProfit: parseFloat(rowData[TURO_DB_COLS.PROFIT_MARGIN]) || 0,
    flipStrategy: rowData[TURO_DB_COLS.FLIP_STRATEGY] || '',
    title: rowData[TURO_DB_COLS.TITLE] || ''
  };

  var vehicleName = vehicleData.year + ' ' + vehicleData.make + ' ' + vehicleData.model;
  if (vehicleData.trim) vehicleName += ' ' + vehicleData.trim;

  // 2. Classify vehicle
  var vehicleClass = classifyVehicle(vehicleData.make, vehicleData.model, vehicleData.body, vehicleData.year);

  // 3. Get pricing defaults
  var defaults = getPricingDefaults(vehicleClass);

  // 4. Get settings
  var settings = getTuroSettings();

  // 5. Compute economics
  var economics = computeTuroEconomics(vehicleData, defaults, settings, overrides);

  // 6. Compute Hold Score
  var score = computeTuroHoldScore(economics, vehicleData.mileage, settings);

  // 7. Get Risk Tier
  var riskTier = getRiskTier(score);

  // 8. Check for existing override
  var turoSheet = ss.getSheetByName(TURO_SHEETS.ENGINE.name);
  var hasOverride = false;
  var existingTuroRow = -1;
  var rowId = 'MD-' + masterDbRow;

  if (turoSheet && turoSheet.getLastRow() > 1) {
    var turoData = turoSheet.getRange(2, 1, turoSheet.getLastRow() - 1, 1).getValues();
    for (var i = 0; i < turoData.length; i++) {
      if (turoData[i][0] === rowId) {
        existingTuroRow = i + 2; // 1-based, offset by header
        var overrideVal = turoSheet.getRange(existingTuroRow, TE_COLS.OVERRIDE + 1).getValue();
        hasOverride = overrideVal === true || overrideVal === 'TRUE';
        break;
      }
    }
  }

  // 9. Get Recommended Strategy
  var recommended = getRecommendedStrategy(score, economics.turoVsFlipDelta, vehicleData.flipStrategy, hasOverride);

  // 10. Generate Rationale
  var rationale = generateRationale(economics, score, riskTier, recommended);

  // 11. Generate Exit Plan
  var exitPlan = generateExitPlan(economics, vehicleClass);

  // 12. Determine Turo Recommended? label
  var turoRecommended;
  if (!vehicleData.askingPrice || !vehicleData.resaleValue) {
    turoRecommended = 'INSUFFICIENT DATA';
  } else if (score >= 70 && economics.turoVsFlipDelta > 0) {
    turoRecommended = 'YES \u2014 Turo Hold';
  } else if (score >= 50 && economics.turoVsFlipDelta > -500) {
    turoRecommended = 'MARGINAL';
  } else {
    turoRecommended = 'NO \u2014 Flip Better';
  }

  // 13. Determine Turo Status
  var existingTuroStatus = '';
  if (existingTuroRow > 0) {
    existingTuroStatus = turoSheet.getRange(existingTuroRow, TE_COLS.TURO_STATUS + 1).getValue();
  }
  var turoStatus = existingTuroStatus || 'Candidate';

  // 14. Build Turo Engine row
  var turoRow = [
    rowId,                                    // Row ID
    vehicleData.vin,                          // VIN
    vehicleName,                              // Vehicle
    vehicleClass,                             // Vehicle Class
    vehicleData.askingPrice,                  // Asking Price
    vehicleData.repairCost,                   // Estimated Repair Cost
    economics.totalAcquisitionCost,           // Total Acquisition Cost
    vehicleData.resaleValue,                  // Estimated Resale Value
    economics.flipNetProfit,                  // Flip Net Profit
    economics.flipTimeline,                   // Flip Timeline
    economics.dailyRate,                      // Daily Rate
    economics.utilization,                    // Utilization %
    economics.grossMonthlyRevenue,            // Gross Monthly Revenue
    economics.platformFeePct,                 // Platform Fee %
    economics.platformFeeAmt,                 // Platform Fee $
    economics.insuranceMonthly,               // Insurance Monthly
    economics.cleaningPerTrip,                // Cleaning Per Trip
    economics.tripsPerMonth,                  // Trips Per Month
    economics.totalCleaningMonthly,           // Total Cleaning Monthly
    economics.maintenanceReserveMonthly,      // Maintenance Reserve Monthly
    economics.depreciationMonthly,            // Depreciation Monthly
    economics.financingPayment,               // Financing Payment Monthly
    economics.registrationTaxMonthly,         // Registration & Tax Monthly
    economics.totalMonthlyExpenses,           // Total Monthly Expenses
    economics.netMonthlyCashFlow,             // Net Monthly Cash Flow
    economics.netAnnualCashFlow,              // Net Annual Cash Flow
    economics.paybackMonths === Infinity ? 'N/A' : economics.paybackMonths, // Payback Months
    economics.breakEvenUtilization,           // Break-Even Utilization %
    economics.turo12MonthProfit,              // 12-Month Total Profit (Turo)
    economics.flip12MonthProfit,              // 12-Month Total Profit (Flip)
    economics.turoVsFlipDelta,                // Turo vs Flip Delta
    score,                                    // Turo Hold Score
    riskTier,                                 // Risk Tier
    recommended,                              // Recommended Strategy
    rationale,                                // Rationale
    exitPlan,                                 // Exit Plan
    turoStatus,                               // Turo Status
    new Date(),                               // Date Evaluated
    hasOverride                               // Override?
  ];

  // 15. Write to Turo Engine sheet (upsert by Row ID)
  if (!turoSheet) {
    turoSheet = ss.getSheetByName(TURO_SHEETS.ENGINE.name);
  }
  if (turoSheet) {
    if (existingTuroRow > 0) {
      turoSheet.getRange(existingTuroRow, 1, 1, turoRow.length).setValues([turoRow]);
    } else {
      turoSheet.appendRow(turoRow);
      existingTuroRow = turoSheet.getLastRow();
    }
    // Apply number formatting to the new row
    applyTuroEngineRowFormatting_(turoSheet, existingTuroRow > 0 ? existingTuroRow : turoSheet.getLastRow());
  }

  // 16. Write summary back to Master Database columns
  writeTuroMdSummary_(dbSheet, masterDbRow, score, economics, riskTier, turoRecommended, turoStatus);

  // 17. Update Flip Strategy if appropriate
  if (!hasOverride && score >= 70 && economics.turoVsFlipDelta > 0 && vehicleData.flipStrategy !== 'Turo Hold') {
    dbSheet.getRange(masterDbRow, TURO_DB_COLS.FLIP_STRATEGY + 1).setValue('Turo Hold');
  }

  // 18. Log
  logTuro_('Analysis', 'INFO', 'Analyzed ' + vehicleName + ' (Row ' + masterDbRow + '): Score=' + score + ', Tier=' + riskTier + ', Rec=' + recommended);

  return {
    rowId: rowId,
    vehicle: vehicleName,
    vehicleClass: vehicleClass,
    score: score,
    riskTier: riskTier,
    recommended: recommended,
    turoRecommended: turoRecommended,
    economics: economics,
    rationale: rationale,
    exitPlan: exitPlan
  };
}

/**
 * Writes Turo summary data back to Master Database columns (BJ-BS).
 * @param {SpreadsheetApp.Sheet} dbSheet - Master Database sheet.
 * @param {number} row - 1-based row number.
 * @param {number} score - Turo Hold Score.
 * @param {Object} economics - Economics result.
 * @param {string} riskTier - Risk tier.
 * @param {string} turoRecommended - Recommended label.
 * @param {string} turoStatus - Current Turo status.
 * @private
 */
function writeTuroMdSummary_(dbSheet, row, score, economics, riskTier, turoRecommended, turoStatus) {
  // Find the Turo Hold Score column by header name
  var headerRow = dbSheet.getRange(1, 1, 1, dbSheet.getLastColumn()).getValues()[0];
  var startCol = -1;
  for (var i = 0; i < headerRow.length; i++) {
    if (headerRow[i] === TURO_DB_HEADERS[0]) {
      startCol = i + 1; // 1-based
      break;
    }
  }

  if (startCol < 0) {
    logTuro_('Analysis', 'WARN', 'Turo columns not found in Master Database — run setupTuroModule() first');
    return;
  }

  var summaryData = [
    score,                                  // Turo Hold Score
    economics.netMonthlyCashFlow,           // Turo Monthly Net
    economics.paybackMonths === Infinity ? 'N/A' : economics.paybackMonths, // Payback Months
    economics.breakEvenUtilization,         // Break-Even Util %
    riskTier,                               // Risk Tier
    economics.turoVsFlipDelta,              // Turo vs Flip Delta
    turoRecommended,                        // Turo Recommended?
    turoStatus,                             // Turo Status
    '',                                     // Fleet ID (preserve existing)
    ''                                      // Turo Notes (preserve existing)
  ];

  // Preserve existing Fleet ID and Notes
  var existingFleetId = dbSheet.getRange(row, startCol + 8).getValue();
  var existingNotes = dbSheet.getRange(row, startCol + 9).getValue();
  if (existingFleetId) summaryData[8] = existingFleetId;
  if (existingNotes) summaryData[9] = existingNotes;

  dbSheet.getRange(row, startCol, 1, summaryData.length).setValues([summaryData]);
}

/**
 * Applies number formatting to a Turo Engine data row.
 * @param {SpreadsheetApp.Sheet} sheet - Turo Engine sheet.
 * @param {number} row - 1-based row number.
 * @private
 */
function applyTuroEngineRowFormatting_(sheet, row) {
  // Currency columns
  var currencyCols = [5, 6, 7, 8, 9, 11, 13, 15, 16, 17, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31];
  for (var i = 0; i < currencyCols.length; i++) {
    sheet.getRange(row, currencyCols[i]).setNumberFormat('$#,##0.00');
  }
  // Percentage columns
  sheet.getRange(row, 12).setNumberFormat('0.0%');  // Utilization %
  sheet.getRange(row, 14).setNumberFormat('0.0%');  // Platform Fee %
  sheet.getRange(row, 28).setNumberFormat('0.0%');  // Break-Even Util %
  // Integer columns
  sheet.getRange(row, 32).setNumberFormat('#,##0'); // Turo Hold Score
  // Payback Months
  var paybackVal = sheet.getRange(row, 27).getValue();
  if (typeof paybackVal === 'number') {
    sheet.getRange(row, 27).setNumberFormat('#,##0.0');
  }
}

// =========================================================
// MENU HANDLERS
// =========================================================

/**
 * Menu handler: Analyzes the currently selected row in Master Database for Turo.
 */
function analyzeTuroSelected() {
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

    ss.toast('Analyzing row ' + row + ' for Turo viability...', 'Turo Module', 10);

    var result = analyzeTuroHold(row);

    ss.toast(
      result.vehicle + ': Score ' + result.score + '/100 (' + result.riskTier + ') \u2014 ' + result.turoRecommended,
      'Turo Analysis Complete',
      8
    );

  } catch (e) {
    logTuro_('Analysis', 'ERROR', 'analyzeTuroSelected failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Analysis failed: ' + e.message, 'Turo Module Error', 5);
  }
}

/**
 * Batch analyzes all qualifying Master Database rows for Turo viability.
 * Targets rows with Turo Hold strategy or qualifying flip candidates.
 * Uses LockService to prevent concurrent runs.
 */
function batchAnalyzeTuro() {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(10000)) {
      SpreadsheetApp.getActiveSpreadsheet().toast('Batch analysis already running.', 'Turo Module', 5);
      return;
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var dbSheet = ss.getSheetByName(QUANTUM_SHEETS.DATABASE.name);
    if (!dbSheet || dbSheet.getLastRow() < 2) {
      ss.toast('No data in Master Database.', 'Turo Module', 5);
      return;
    }

    ss.toast('Starting Turo batch analysis...', 'Turo Module', 15);

    var lastCol = dbSheet.getLastColumn();
    var data = dbSheet.getRange(2, 1, dbSheet.getLastRow() - 1, lastCol).getValues();
    var headerRow = dbSheet.getRange(1, 1, 1, lastCol).getValues()[0];

    // Find Turo Hold Score column
    var turoScoreCol = -1;
    for (var h = 0; h < headerRow.length; h++) {
      if (headerRow[h] === TURO_DB_HEADERS[0]) {
        turoScoreCol = h;
        break;
      }
    }

    // Check for existing overrides on Turo Engine sheet
    var turoSheet = ss.getSheetByName(TURO_SHEETS.ENGINE.name);
    var overrideMap = {};
    if (turoSheet && turoSheet.getLastRow() > 1) {
      var turoData = turoSheet.getRange(2, 1, turoSheet.getLastRow() - 1, TURO_ENGINE_HEADERS.length).getValues();
      for (var t = 0; t < turoData.length; t++) {
        if (turoData[t][TE_COLS.OVERRIDE] === true || turoData[t][TE_COLS.OVERRIDE] === 'TRUE') {
          overrideMap[turoData[t][TE_COLS.ROW_ID]] = true;
        }
      }
    }

    var analyzed = 0;
    var skipped = 0;
    var errors = 0;

    for (var i = 0; i < data.length; i++) {
      var row = data[i];
      var masterRow = i + 2;
      var rowId = 'MD-' + masterRow;
      var flipStrategy = row[TURO_DB_COLS.FLIP_STRATEGY] || '';
      var hasTuroScore = turoScoreCol >= 0 && row[turoScoreCol] !== '' && row[turoScoreCol] !== null;
      var price = parseFloat(row[TURO_DB_COLS.PRICE]) || 0;

      // Skip if override is set
      if (overrideMap[rowId]) {
        skipped++;
        continue;
      }

      // Qualify rows for analysis
      var shouldAnalyze = false;

      // Already marked as Turo Hold but no score yet
      if (flipStrategy === 'Turo Hold' && !hasTuroScore) {
        shouldAnalyze = true;
      }

      // Qualifying flip candidates (have price and resale data)
      if (!shouldAnalyze && price > 0 && row[TURO_DB_COLS.MARKET_VALUE]) {
        var strategies = ['Quick Flip', 'Repair + Resell'];
        if (strategies.indexOf(flipStrategy) !== -1) {
          shouldAnalyze = true;
        }
      }

      if (!shouldAnalyze) {
        skipped++;
        continue;
      }

      try {
        analyzeTuroHold(masterRow);
        analyzed++;
      } catch (e) {
        errors++;
        logTuro_('Batch', 'ERROR', 'Row ' + masterRow + ' failed: ' + e.toString());
      }

      // Avoid quota limits
      if (analyzed % 10 === 0) {
        Utilities.sleep(100);
      }
    }

    var msg = 'Batch complete: ' + analyzed + ' analyzed, ' + skipped + ' skipped';
    if (errors > 0) msg += ', ' + errors + ' errors';
    ss.toast(msg, 'Turo Module', 8);
    logTuro_('Batch', 'INFO', msg);

  } catch (e) {
    logTuro_('Batch', 'ERROR', 'Batch analysis failed: ' + e.toString());
    SpreadsheetApp.getActiveSpreadsheet().toast('Batch failed: ' + e.message, 'Turo Module Error', 5);
  } finally {
    lock.releaseLock();
  }
}
