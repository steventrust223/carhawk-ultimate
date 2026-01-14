// ==========================================
// CARHAWK ULTIMATE - LEAD SCORING ENGINE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Calculate comprehensive lead scores using weighted multi-factor analysis
// ==========================================

/**
 * SCORING METHODOLOGY:
 * - Profit Margin: 30% weight
 * - Speed-to-Lead: 20% weight
 * - Distance: 10% weight
 * - Market Demand: 10% weight
 * - Condition: 10% weight
 * - Mileage: 8% weight
 * - Title Status: 7% weight
 * - Platform Reliability: 5% weight
 * - Rental Bonus: Up to 10% bonus
 *
 * Final Score: 0-100 scale
 */

/**
 * Calculate comprehensive lead score for a vehicle
 * @param {Object} vehicle - Vehicle data object
 * @return {Object} Scoring breakdown with final score
 */
function calculateLeadScore(vehicle) {
  // Extract all scoring factors
  const profit = vehicle[MASTER_COLUMNS.PROFIT_DOLLAR] || 0;
  const profitPercent = vehicle[MASTER_COLUMNS.PROFIT_PERCENT] || 0;
  const askingPrice = vehicle[MASTER_COLUMNS.ASKING_PRICE] || 0;
  const distance = vehicle[MASTER_COLUMNS.DISTANCE] || 0;
  const mileage = vehicle[MASTER_COLUMNS.MILEAGE] || 0;
  const year = vehicle[MASTER_COLUMNS.YEAR] || 0;
  const condition = vehicle[MASTER_COLUMNS.CONDITION] || '';
  const titleStatus = vehicle[MASTER_COLUMNS.TITLE_STATUS] || '';
  const platform = vehicle[MASTER_COLUMNS.PLATFORM] || '';
  const firstSeen = vehicle[MASTER_COLUMNS.FIRST_SEEN];
  const rentalViable = vehicle[MASTER_COLUMNS.RENTAL_VIABLE] || 'No';
  const monthlyNet = vehicle[MASTER_COLUMNS.MONTHLY_NET] || 0;

  // Calculate individual component scores
  const profitScore = scoreProfitMargin(profit, profitPercent, askingPrice);
  const speedScore = scoreSpeedToLead(firstSeen);
  const distanceScore = scoreDistance(distance);
  const marketScore = scoreMarketDemand(vehicle);
  const conditionScore = scoreCondition(condition);
  const mileageScore = scoreMileage(mileage, year);
  const titleScore = scoreTitleStatus(titleStatus);
  const platformScore = scorePlatform(platform);
  const rentalBonus = scoreRentalBonus(rentalViable, monthlyNet);

  // Apply weights
  const weightedScore =
    (profitScore * SCORING_WEIGHTS.PROFIT_MARGIN) +
    (speedScore * SCORING_WEIGHTS.SPEED_TO_LEAD) +
    (distanceScore * SCORING_WEIGHTS.DISTANCE) +
    (marketScore * SCORING_WEIGHTS.MARKET_DEMAND) +
    (conditionScore * SCORING_WEIGHTS.CONDITION) +
    (mileageScore * SCORING_WEIGHTS.MILEAGE) +
    (titleScore * SCORING_WEIGHTS.TITLE_STATUS) +
    (platformScore * SCORING_WEIGHTS.PLATFORM);

  // Add rental bonus (can push score above 100)
  const finalScore = Math.min(weightedScore + rentalBonus, 110);

  // Determine opportunity grade
  const grade = determineOpportunityGrade(finalScore);

  // Identify risk factors
  const riskFactors = identifyRiskFactors(vehicle);

  return {
    finalScore: Math.round(finalScore),
    grade: grade,
    components: {
      profit: Math.round(profitScore),
      speed: Math.round(speedScore),
      distance: Math.round(distanceScore),
      market: Math.round(marketScore),
      condition: Math.round(conditionScore),
      mileage: Math.round(mileageScore),
      title: Math.round(titleScore),
      platform: Math.round(platformScore),
      rentalBonus: Math.round(rentalBonus)
    },
    riskFactors: riskFactors
  };
}

/**
 * Score profit margin component
 * @param {number} profit - Dollar profit
 * @param {number} profitPercent - Profit percentage
 * @param {number} askingPrice - Asking price
 * @return {number} Score 0-100
 */
function scoreProfitMargin(profit, profitPercent, askingPrice) {
  let score = 0;

  // Base score on absolute profit
  if (profit >= 5000) score += 50;
  else if (profit >= 3500) score += 40;
  else if (profit >= 2000) score += 30;
  else if (profit >= 1000) score += 20;
  else if (profit >= 500) score += 10;

  // Add score based on profit percentage (ROI)
  if (profitPercent >= 0.40) score += 50; // 40%+ ROI
  else if (profitPercent >= 0.30) score += 40; // 30%+ ROI
  else if (profitPercent >= 0.20) score += 30; // 20%+ ROI
  else if (profitPercent >= 0.15) score += 20; // 15%+ ROI
  else if (profitPercent >= 0.10) score += 10; // 10%+ ROI

  return Math.min(score, 100);
}

/**
 * Score speed-to-lead component
 * @param {Date|string} firstSeen - First seen timestamp
 * @return {number} Score 0-100
 */
function scoreSpeedToLead(firstSeen) {
  if (!firstSeen) return 50; // Unknown age = neutral score

  const speedData = calculateSpeedToLead(firstSeen);
  return speedData.score;
}

/**
 * Score distance component
 * @param {number} distance - Distance in miles
 * @return {number} Score 0-100
 */
function scoreDistance(distance) {
  if (distance <= 25) return 100;   // Local - excellent
  if (distance <= 50) return 85;    // Close - very good
  if (distance <= 75) return 70;    // Regional - good
  if (distance <= 100) return 55;   // Moderate distance
  if (distance <= 150) return 40;   // Distant - acceptable
  if (distance <= 200) return 25;   // Very distant - low
  return 10;                        // Remote - very low
}

/**
 * Score market demand component
 * @param {Object} vehicle - Vehicle data
 * @return {number} Score 0-100
 */
function scoreMarketDemand(vehicle) {
  const make = vehicle[MASTER_COLUMNS.MAKE] || '';
  const bodyType = vehicle[MASTER_COLUMNS.BODY_TYPE] || '';
  const enthusiastFlag = vehicle[MASTER_COLUMNS.ENTHUSIAST_FLAG] || 'No';

  let score = 50; // Baseline

  // Popular makes get bonus
  if (MARKET_PARAMS.popularMakes.some(m => make.includes(m))) {
    score += 20;
  }

  // Fast-selling body types
  if (MARKET_PARAMS.fastSelling.some(t => bodyType.includes(t))) {
    score += 20;
  }

  // Enthusiast vehicles have niche demand
  if (enthusiastFlag === 'Yes') {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Score condition component
 * @param {string} condition - Vehicle condition
 * @return {number} Score 0-100
 */
function scoreCondition(condition) {
  return getConditionScore(condition);
}

/**
 * Score mileage component
 * @param {number} mileage - Vehicle mileage
 * @param {number} year - Vehicle year
 * @return {number} Score 0-100
 */
function scoreMileage(mileage, year) {
  if (!mileage || !year) return 50;

  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  const expectedMileage = age * 12000; // Average 12k miles/year

  const mileageDiff = mileage - expectedMileage;

  // Score based on how mileage compares to expected
  if (mileageDiff < -30000) return 100; // Very low mileage
  if (mileageDiff < -15000) return 90;  // Low mileage
  if (mileageDiff < -5000) return 80;   // Below average
  if (mileageDiff < 5000) return 70;    // Average
  if (mileageDiff < 15000) return 55;   // Above average
  if (mileageDiff < 30000) return 40;   // High mileage
  return 20;                            // Very high mileage
}

/**
 * Score title status component
 * @param {string} titleStatus - Title status
 * @return {number} Score 0-100
 */
function scoreTitleStatus(titleStatus) {
  const multiplier = getTitleRiskMultiplier(titleStatus);

  // Convert multiplier (0-1) to score (0-100)
  return multiplier * 100;
}

/**
 * Score platform reliability component
 * @param {string} platform - Platform name
 * @return {number} Score 0-100
 */
function scorePlatform(platform) {
  const lower = platform.toLowerCase();

  // Facebook Marketplace - most common, decent quality
  if (lower.includes('facebook')) return 75;

  // Craigslist - mixed quality, more scams
  if (lower.includes('craigslist')) return 60;

  // OfferUp - mobile-first, younger sellers
  if (lower.includes('offerup')) return 70;

  // eBay Motors - usually serious sellers
  if (lower.includes('ebay')) return 85;

  // Unknown platform
  return 50;
}

/**
 * Calculate rental bonus component
 * @param {string} rentalViable - Yes/No rental viability
 * @param {number} monthlyNet - Monthly net rental income
 * @return {number} Bonus points 0-10
 */
function scoreRentalBonus(rentalViable, monthlyNet) {
  if (rentalViable !== 'Yes') return 0;

  // Award bonus based on monthly net income
  if (monthlyNet >= 1000) return 10;
  if (monthlyNet >= 800) return 8;
  if (monthlyNet >= 600) return 6;
  if (monthlyNet >= 400) return 4;
  return 2;
}

/**
 * Determine opportunity grade based on score
 * @param {number} score - Final lead score
 * @return {string} Grade (A+ to F)
 */
function determineOpportunityGrade(score) {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 85) return 'A-';
  if (score >= 80) return 'B+';
  if (score >= 75) return 'B';
  if (score >= 70) return 'B-';
  if (score >= 65) return 'C+';
  if (score >= 60) return 'C';
  if (score >= 55) return 'C-';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Identify risk factors for a deal
 * @param {Object} vehicle - Vehicle data
 * @return {Array<string>} List of risk factors
 */
function identifyRiskFactors(vehicle) {
  const risks = [];

  // Distance risk
  const distance = vehicle[MASTER_COLUMNS.DISTANCE] || 0;
  if (distance > 150) risks.push('Remote location');

  // Mileage risk
  const mileage = vehicle[MASTER_COLUMNS.MILEAGE] || 0;
  if (mileage > 150000) risks.push('Very high mileage');
  else if (mileage > 100000) risks.push('High mileage');

  // Title risk
  const titleStatus = vehicle[MASTER_COLUMNS.TITLE_STATUS] || '';
  if (titleStatus.toLowerCase().includes('salvage')) risks.push('Salvage title');
  if (titleStatus.toLowerCase().includes('rebuilt')) risks.push('Rebuilt title');
  if (titleStatus.toLowerCase().includes('no title')) risks.push('No title');

  // Repair risk
  const repairCost = vehicle[MASTER_COLUMNS.ESTIMATED_REPAIR] || 0;
  if (repairCost > 3000) risks.push('Extensive repairs needed');
  else if (repairCost > 1500) risks.push('Significant repairs needed');

  // Hazard flags
  const hazards = vehicle[MASTER_COLUMNS.HAZARD_FLAGS] || '';
  if (hazards.includes('🚨')) risks.push('Critical hazard flags');
  else if (hazards.includes('⚠️')) risks.push('Hazard flags present');

  // Age risk
  const year = vehicle[MASTER_COLUMNS.YEAR] || 0;
  const age = new Date().getFullYear() - year;
  if (age > 15) risks.push('Very old vehicle');

  // Speed-to-lead risk
  const firstSeen = vehicle[MASTER_COLUMNS.FIRST_SEEN];
  if (firstSeen) {
    const minutesAgo = minutesSince(firstSeen);
    if (minutesAgo > 1440) risks.push('Listing is old (>24 hours)');
  }

  return risks;
}

/**
 * Update lead scores for all vehicles in Master Database
 */
function updateLeadScores() {
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

      // Calculate lead score
      const scoreData = calculateLeadScore(vehicle);

      // Note: Lead scores are typically stored in a separate scoring sheet
      // or used for verdict generation rather than stored in master

      updatedCount++;
    }

    logSystem('LEAD_SCORING_UPDATE', `Calculated scores for ${updatedCount} vehicles`);

    SpreadsheetApp.getUi().alert(
      '✅ Lead Scoring Complete',
      `Calculated lead scores for ${updatedCount} vehicles.\n\n` +
      'Scores are used for verdict generation and ranking.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('LEAD_SCORING_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error updating lead scores: ' + error.message);
  }
}

/**
 * Generate Lead Scoring breakdown sheet
 */
function generateScoringBreakdown() {
  try {
    const masterSheet = getSheet(SHEETS.MASTER.name);
    const scoringSheet = getSheet(SHEETS.SCORING.name);

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

    // Build scoring data
    const scoringData = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];

      // Build vehicle object
      const vehicle = {};
      for (let j = 0; j < headers.length; j++) {
        vehicle[headers[j]] = row[j];
      }

      // Calculate score
      const scoreData = calculateLeadScore(vehicle);
      const vehicleName = `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`;

      scoringData.push([
        vehicleName,
        scoreData.finalScore,
        scoreData.components.profit,
        scoreData.components.speed,
        scoreData.components.distance,
        scoreData.components.market,
        scoreData.components.condition,
        scoreData.components.title,
        scoreData.components.rentalBonus,
        scoreData.riskFactors.join(', '),
        scoreData.grade
      ]);
    }

    // Sort by final score descending
    scoringData.sort((a, b) => b[1] - a[1]);

    // Clear existing data
    clearSheetData(SHEETS.SCORING.name);

    // Write data
    if (scoringData.length > 0) {
      scoringSheet.getRange(2, 1, scoringData.length, scoringData[0].length)
        .setValues(scoringData);
    }

    logSystem('SCORING_BREAKDOWN_GENERATED', `Generated breakdown for ${scoringData.length} vehicles`);

    SpreadsheetApp.getUi().alert(
      '✅ Scoring Breakdown Generated',
      `Created detailed scoring analysis for ${scoringData.length} vehicles.`,
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('SCORING_BREAKDOWN_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error generating scoring breakdown: ' + error.message);
  }
}
