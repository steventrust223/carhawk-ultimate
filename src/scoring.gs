// ============================================================================
// CARHAWK ULTIMATE — SCORING.GS
// Deterministic Scoring Engine (NO RANDOM VALUES)
// All formulas match locked specification exactly
// ============================================================================

/**
 * Calculate all scores for a deal (master scoring function)
 * Returns complete score object with all components
 */
function calculateAllScores(dealData) {
  // Extract needed values with defaults
  const askingPrice = parseFloat(dealData.askingPrice) || 0;
  const marketValue = parseFloat(dealData.marketValue) || calculateMarketValue(dealData);
  const repairCost = parseFloat(dealData.repairCost) || calculateRepairCost(dealData);
  const condition = dealData.condition || 'Unknown';
  const distance = parseFloat(dealData.distance) || 0;
  const daysListed = parseInt(dealData.daysListed) || 21;
  const platform = dealData.platform || 'unknown';
  const mileage = parseInt(dealData.mileage) || 100000;
  const make = dealData.make || '';
  const titleStatus = dealData.titleStatus || 'Unknown';
  const strategy = dealData.strategy || 'QUICK_FLIP';

  // Calculate profit metrics
  const holdingCost = HOLDING_COST_DEFAULT;
  const totalInvestment = askingPrice + repairCost + holdingCost;
  const profitDollars = marketValue - totalInvestment;
  const profitPct = safeDivide(profitDollars, Math.max(marketValue, 1), 0);

  // Get capital tier
  const capitalTier = getCapitalTier(totalInvestment);

  // Calculate MAO
  const maoPct = MAO_PCT_BY_STRATEGY[strategy] || MAO_PCT_BY_STRATEGY['QUICK_FLIP'];
  const mao = Math.max((marketValue * maoPct) - repairCost - holdingCost, FLOOR_MAO);

  // Calculate offer target (anchor below MAO)
  const offerMultiplier = strategy === 'QUICK_FLIP' ?
    NEGOTIATION_CONFIG.QUICK_FLIP_ANCHOR_MULT :
    NEGOTIATION_CONFIG.OTHER_STRATEGY_ANCHOR_MULT;
  const offerTarget = Math.round(mao * offerMultiplier);

  // Calculate all subscores (0-100)
  const profitScore = calculateProfitScore(profitPct);
  const conditionScore = calculateConditionScore(condition);
  const locationScore = calculateLocationScore(distance);
  const velocityScore = calculateVelocityScore(daysListed, platform, mileage);
  const marketScore = calculateMarketScore(make, mileage);
  const competitionScore = calculateCompetitionScore(askingPrice, marketValue);

  // Calculate risk components
  const riskComponents = calculateRiskComponents({
    titleStatus,
    condition,
    distance,
    totalInvestment,
    daysListed
  });

  const riskScore = calculateTotalRiskScore(riskComponents);

  // Calculate overall score
  const overallScore = calculateOverallScore({
    profitScore,
    conditionScore,
    locationScore,
    velocityScore,
    marketScore,
    competitionScore,
    riskScore
  });

  // Determine temperature
  const temperature = determineTemperature(overallScore, velocityScore, profitPct);

  // Determine priority
  const priority = determinePriority(temperature, distance);

  return {
    // Core metrics
    marketValue: Math.round(marketValue),
    repairCost: Math.round(repairCost),
    holdingCost: holdingCost,
    totalInvestment: Math.round(totalInvestment),
    mao: Math.round(mao),
    offerTarget: offerTarget,
    profitDollars: Math.round(profitDollars),
    profitPct: profitPct,
    capitalTier: capitalTier.name,
    capitalTierLabel: capitalTier.label,

    // Subscores (0-100)
    profitScore: profitScore,
    conditionScore: conditionScore,
    locationScore: locationScore,
    velocityScore: velocityScore,
    marketScore: marketScore,
    competitionScore: competitionScore,

    // Risk components (0-100 each)
    titleRisk: riskComponents.titleRisk,
    repairRisk: riskComponents.repairRisk,
    distanceRisk: riskComponents.distanceRisk,
    capitalRisk: riskComponents.capitalRisk,
    timeRisk: riskComponents.timeRisk,
    riskScore: riskScore,

    // Overall
    overallScore: overallScore,
    temperature: temperature,
    priority: priority
  };
}

// ============================================================================
// PROFIT SCORE (0-100)
// ProfitScore = clamp( round( (ProfitPct / 0.30) * 100 ), 0, 100 )
// ============================================================================
function calculateProfitScore(profitPct) {
  // 30% profit maps to score of 100
  const score = Math.round((profitPct / 0.30) * 100);
  return clamp(score, 0, 100);
}

// ============================================================================
// CONDITION SCORE (0-100)
// Direct lookup from CONDITION_SCORES
// ============================================================================
function calculateConditionScore(condition) {
  return CONDITION_SCORES[condition] || CONDITION_SCORES['Unknown'];
}

// ============================================================================
// LOCATION SCORE (0-100)
// LocationScore = clamp( round(100 - (DistanceMiles * 0.45)), 0, 100 )
// ============================================================================
function calculateLocationScore(distanceMiles) {
  const score = Math.round(100 - (distanceMiles * 0.45));
  return clamp(score, 0, 100);
}

// ============================================================================
// VELOCITY SCORE (0-100) — DETERMINISTIC
// VelocityScore = clamp( round( VelocityBaseByDays * PlatformWeight * MileageFactor ), 0, 100 )
// ============================================================================
function calculateVelocityScore(daysListed, platform, mileage) {
  const baseScore = getVelocityBaseByDays(daysListed);
  const platformWeight = getPlatformWeight(platform);
  const mileageFactor = getMileageFactor(mileage);

  const score = Math.round(baseScore * platformWeight * mileageFactor);
  return clamp(score, 0, 100);
}

// ============================================================================
// MARKET SCORE (0-100) — NO RANDOM
// MakePremiumScore = clamp( round((MAKE_PREMIUM[make] - 0.90) / (1.15 - 0.90) * 100 ), 0, 100 )
// MileageScore = clamp( round((MileageFactor - 0.85) / (1.05 - 0.85) * 100 ), 0, 100 )
// MarketScore = round(0.65 * MakePremiumScore + 0.35 * MileageScore)
// ============================================================================
function calculateMarketScore(make, mileage) {
  const makePremium = getMakePremium(make);
  const mileageFactor = getMileageFactor(mileage);

  // Normalize make premium to 0-100 scale
  // Range is 0.90 to 1.15, so normalize accordingly
  const makePremiumScore = clamp(
    Math.round(((makePremium - 0.90) / (1.15 - 0.90)) * 100),
    0, 100
  );

  // Normalize mileage factor to 0-100 scale
  // Range is 0.85 to 1.05
  const mileageScore = clamp(
    Math.round(((mileageFactor - 0.85) / (1.05 - 0.85)) * 100),
    0, 100
  );

  // Weighted combination
  const score = Math.round(0.65 * makePremiumScore + 0.35 * mileageScore);
  return clamp(score, 0, 100);
}

// ============================================================================
// COMPETITION SCORE (0-100) — NO RANDOM
// PriceToValue = AskingPrice / max(MarketValue, 1)
// CompetitionScore = clamp( round( (1.20 - PriceToValue) / 0.50 * 100 ), 0, 100 )
// ============================================================================
function calculateCompetitionScore(askingPrice, marketValue) {
  const priceToValue = safeDivide(askingPrice, Math.max(marketValue, 1), 1);

  // If asking = 0.70 * market → high score (good deal)
  // If asking >= 1.20 * market → 0 (overpriced)
  const score = Math.round(((1.20 - priceToValue) / 0.50) * 100);
  return clamp(score, 0, 100);
}

// ============================================================================
// RISK COMPONENTS (each 0-100)
// ============================================================================
function calculateRiskComponents(params) {
  const { titleStatus, condition, distance, totalInvestment, daysListed } = params;

  // Title Risk
  const titleRisk = TITLE_RISK_SCORES[titleStatus] || TITLE_RISK_SCORES['Unknown'];

  // Repair Risk (based on condition)
  const repairRiskMap = {
    'Excellent': 10,
    'Very Good': 15,
    'Good': 25,
    'Fair': 40,
    'Poor': 55,
    'Parts Only': 70,
    'Unknown': 35
  };
  const repairRisk = repairRiskMap[condition] || 35;

  // Distance Risk
  let distanceRisk;
  if (distance <= 25) distanceRisk = 10;
  else if (distance <= 75) distanceRisk = 20;
  else if (distance <= 150) distanceRisk = 35;
  else distanceRisk = 50;

  // Capital Risk (based on tier)
  const tier = getCapitalTier(totalInvestment);
  const capitalRiskMap = { 'T1': 15, 'T2': 22, 'T3': 30, 'T4': 38 };
  const capitalRisk = capitalRiskMap[tier.name] || 25;

  // Time Risk
  let timeRisk;
  if (daysListed <= 7) timeRisk = 15;
  else if (daysListed <= 30) timeRisk = 25;
  else timeRisk = 35;

  return {
    titleRisk,
    repairRisk,
    distanceRisk,
    capitalRisk,
    timeRisk
  };
}

// ============================================================================
// TOTAL RISK SCORE (0-100)
// RiskScore = clamp( round( weighted sum of components ), 0, 100 )
// ============================================================================
function calculateTotalRiskScore(components) {
  const score = Math.round(
    (components.titleRisk * RISK_WEIGHTS.TITLE) +
    (components.repairRisk * RISK_WEIGHTS.REPAIR) +
    (components.distanceRisk * RISK_WEIGHTS.DISTANCE) +
    (components.capitalRisk * RISK_WEIGHTS.CAPITAL) +
    (components.timeRisk * RISK_WEIGHTS.TIME)
  );
  return clamp(score, 0, 100);
}

// ============================================================================
// OVERALL SCORE (0-100)
// OverallScore = weighted sum of subscores - (RiskScore * RISK_PENALTY_WEIGHT)
// ============================================================================
function calculateOverallScore(scores) {
  const baseScore =
    (scores.profitScore * SCORE_WEIGHTS.PROFIT) +
    (scores.conditionScore * SCORE_WEIGHTS.CONDITION) +
    (scores.locationScore * SCORE_WEIGHTS.LOCATION) +
    (scores.velocityScore * SCORE_WEIGHTS.VELOCITY) +
    (scores.marketScore * SCORE_WEIGHTS.MARKET) +
    (scores.competitionScore * SCORE_WEIGHTS.COMPETITION);

  const riskPenalty = scores.riskScore * RISK_PENALTY_WEIGHT;
  const overall = Math.round(baseScore - riskPenalty);

  return clamp(overall, 0, 100);
}

// ============================================================================
// TEMPERATURE DETERMINATION
// Hot: OverallScore >= 80 AND VelocityScore >= 65 AND ProfitPct >= 0.18
// Warm: OverallScore >= 60 AND ProfitPct >= 0.12
// Cold: otherwise
// ============================================================================
function determineTemperature(overallScore, velocityScore, profitPct) {
  if (overallScore >= VERDICT_THRESHOLDS.HOT_OVERALL_MIN &&
      velocityScore >= VERDICT_THRESHOLDS.MIN_VELOCITY_HOT &&
      profitPct >= VERDICT_THRESHOLDS.MIN_PROFIT_PCT_HOT) {
    return 'Hot';
  }

  if (overallScore >= VERDICT_THRESHOLDS.SOLID_OVERALL_MIN &&
      profitPct >= VERDICT_THRESHOLDS.MIN_PROFIT_PCT_SOLID) {
    return 'Warm';
  }

  return 'Cold';
}

// ============================================================================
// PRIORITY DETERMINATION
// Urgent: Hot AND distance <= MAX_DISTANCE_HOT
// High: Warm AND distance <= MAX_DISTANCE_SOLID
// Medium: otherwise (but not PASS)
// ============================================================================
function determinePriority(temperature, distance) {
  if (temperature === 'Hot' && distance <= VERDICT_THRESHOLDS.MAX_DISTANCE_HOT) {
    return 'Urgent';
  }

  if (temperature === 'Warm' && distance <= VERDICT_THRESHOLDS.MAX_DISTANCE_SOLID) {
    return 'High';
  }

  return 'Medium';
}

// ============================================================================
// MARKET VALUE CALCULATION
// MarketValue = BaseValueByAge * CONDITION_VALUE_MULT * MAKE_PREMIUM * MileageFactor
// ============================================================================
function calculateMarketValue(dealData) {
  const currentYear = new Date().getFullYear();
  const vehicleYear = parseInt(dealData.year) || (currentYear - 12);
  const ageYears = currentYear - vehicleYear;

  const baseValue = getBaseValueByAge(ageYears);
  const conditionMult = CONDITION_VALUE_MULT[dealData.condition] || CONDITION_VALUE_MULT['Unknown'];
  const makePremium = getMakePremium(dealData.make);
  const mileageFactor = getMileageFactor(dealData.mileage);

  const marketValue = Math.round(baseValue * conditionMult * makePremium * mileageFactor);

  return Math.max(marketValue, MIN_MARKET_VALUE);
}

// ============================================================================
// REPAIR COST CALCULATION
// RepairCost = round(AskingPrice * CONDITION_REPAIR_PCT[condition])
// ============================================================================
function calculateRepairCost(dealData) {
  const condition = dealData.condition || 'Unknown';
  const repairPct = CONDITION_REPAIR_PCT[condition] || CONDITION_REPAIR_PCT['Unknown'];

  // Use asking price if available, otherwise use estimated market value
  const basePrice = parseFloat(dealData.askingPrice) || calculateMarketValue(dealData);

  return Math.round(basePrice * repairPct);
}

// ============================================================================
// REPAIR COMPLEXITY SCORE (0-100)
// Start at 10, add for condition and keywords
// ============================================================================
function calculateRepairComplexityScore(condition, textContent) {
  let score = 10;

  // Add for poor conditions
  if (condition === 'Poor' || condition === 'Parts Only') {
    score += 25;
  } else if (condition === 'Fair') {
    score += 10;
  }

  // Add for part-out keywords
  const keywords = getPartOutKeywords(textContent);
  if (keywords.length > 0) {
    score += Math.min(keywords.length * 10, 40);
  }

  return clamp(score, 0, 100);
}

// ============================================================================
// MARKET DESIRABILITY SCORE (for strategy selection)
// Used to determine Hold/Seasonal eligibility
// ============================================================================
function calculateMarketDesirabilityScore(make, mileage, condition) {
  const makePremium = getMakePremium(make);
  const mileageFactor = getMileageFactor(mileage);
  const conditionMult = CONDITION_VALUE_MULT[condition] || CONDITION_VALUE_MULT['Unknown'];

  // Combine factors into desirability score
  const score = Math.round(
    ((makePremium - 0.90) / 0.25) * 40 +    // 0-40 from make
    ((mileageFactor - 0.85) / 0.20) * 30 +  // 0-30 from mileage
    ((conditionMult - 0.55) / 0.60) * 30    // 0-30 from condition
  );

  return clamp(score, 0, 100);
}

// ============================================================================
// UPDATE SCORES FOR A ROW (batch-compatible)
// ============================================================================
function updateRowScores(sheet, rowNum, dealData) {
  const scores = calculateAllScores(dealData);

  // Map scores to column positions (adjust based on your sheet structure)
  // Column 5: Lead Score (overall)
  // Column 6: Temperature
  // Column 20: MAO
  // Column 21: Repair Cost
  // Column 22: Market Value (ARV)
  // Column 24: Profit Margin
  // Column 25: ROI
  // Column 26: Deal Score

  const updates = [
    [5, scores.overallScore],
    [6, scores.temperature],
    [20, scores.mao],
    [21, scores.repairCost],
    [22, scores.marketValue],
    [24, scores.profitPct],
    [25, safeDivide(scores.profitDollars, scores.totalInvestment, 0)],
    [26, scores.overallScore]
  ];

  for (const [col, value] of updates) {
    sheet.getRange(rowNum, col).setValue(value);
  }

  return scores;
}
