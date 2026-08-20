// =========================================================
// FILE: quantum-calculations.gs - Advanced Calculations
// =========================================================

function calculateQuantumMetrics(parsed) {
  const metrics = {
    distance: 0,
    locationRisk: '',
    locationFlag: '',
    conditionScore: 0,
    repairRiskScore: 0,
    estimatedRepairCost: 0,
    marketValue: 0,
    mao: 0,
    profitMargin: 0,
    roi: 0,
    capitalTier: '',
    salesVelocity: 0,
    marketAdvantage: 0,
    imageScore: 0,
    engagementScore: 0,
    competitionLevel: 0,
    priority: 'Medium'
  };

  // Distance calculation
  metrics.distance = calculateQuantumDistance(parsed.zip, parsed.location);
  const locRisk = assessLocationRisk(metrics.distance);
  metrics.locationRisk = locRisk.risk;
  metrics.locationFlag = locRisk.flag;

  // Condition scoring
  metrics.conditionScore = scoreCondition(parsed.condition);

  // Repair risk assessment
  const repairAnalysis = analyzeRepairRisk(parsed.repairKeywords);
  metrics.repairRiskScore = repairAnalysis.score;
  metrics.estimatedRepairCost = repairAnalysis.totalCost;

  // Market value estimation with quantum intelligence
  metrics.marketValue = estimateQuantumMarketValue(parsed);

  // MAO calculation
  metrics.mao = calculateQuantumMAO(metrics.marketValue, metrics.estimatedRepairCost);

  // Profit calculations — holding cost scales with the item's value
  const holdingCost = quantumHoldingCost(metrics.marketValue);
  const profit = metrics.marketValue - parsed.price - metrics.estimatedRepairCost - holdingCost;
  metrics.profitMargin = (profit / metrics.marketValue) * 100;
  metrics.roi = (profit / (parsed.price + metrics.estimatedRepairCost + 500)) * 100;

  // Capital tier classification
  metrics.capitalTier = classifyCapitalTier(parsed.price);

  // Sales velocity scoring
  metrics.salesVelocity = calculateSalesVelocity(parsed);

  // Market advantage calculation
  metrics.marketAdvantage = calculateMarketAdvantage(parsed, metrics);

  // Image scoring
  metrics.imageScore = scoreImages(parsed.imageCount);

  // Engagement scoring
  metrics.engagementScore = calculateEngagementScore(parsed);

  // Competition level
  metrics.competitionLevel = assessCompetitionLevel(parsed);

  // Priority calculation
  metrics.priority = calculateQuantumPriority(metrics);

  // Data quality gate.
  // Profit is marketValue - price - repairs - holding, so a listing whose
  // price failed to capture (0) shows a huge fake profit and enormous ROI,
  // and lands at the top of the deal list. Never rank on numbers we do not
  // actually have — surface it for review instead.
  const quality = assessDataQuality(parsed);
  metrics.dataQuality = quality.status;
  metrics.dataIssues = quality.issues.join('; ');

  if (!quality.usable) {
    metrics.profitMargin = 0;
    metrics.roi = 0;
    metrics.priority = 'Needs Review';
    metrics.dealFlag = '⚠️ ' + metrics.dataIssues;
  } else {
    metrics.dealFlag = '';
  }

  return metrics;
}

/**
 * Distance in miles from home base to a listing.
 *
 * Marketplace listings usually carry "City, ST" and no ZIP, so resolve the
 * location string to coordinates and measure real great-circle distance.
 * Returns null when the location cannot be resolved — callers must treat
 * that as unknown, NOT as far away, or every unresolved listing gets
 * penalised as high risk.
 *
 * @param {string} targetZip   ZIP if the listing happened to include one
 * @param {string} locationStr Raw location text, e.g. "Chesterfield, MO"
 * @return {number|null} miles, or null if unresolvable
 */
function calculateQuantumDistance(targetZip, locationStr) {
  const home = getQuantumHomeCoords();

  // Prefer the location text — it resolves to a real place.
  const point = geocodeQuantumLocation(locationStr) || geocodeQuantumLocation(targetZip);
  if (point) {
    return Math.round(haversineMiles(home, point));
  }

  return null; // Unknown — do not guess
}

function assessLocationRisk(distance) {
  // Unknown location: stay neutral rather than assuming the worst.
  if (distance === null || distance === undefined || isNaN(distance)) {
    return {risk: 'Unknown', flag: '⚪', score: 25};
  }

  if (distance < 25) {
    return {risk: 'Low', flag: '🟢', score: 10};
  } else if (distance < 75) {
    return {risk: 'Moderate', flag: '🟡', score: 25};
  } else {
    return {risk: 'High', flag: '🔴', score: 40};
  }
}

function scoreCondition(condition) {
  const scores = {
    'Excellent': 95,
    'Very Good': 85,
    'Good': 75,
    'Fair': 60,
    'Poor': 40,
    'Unknown': 50
  };

  return scores[condition] || 50;
}

function analyzeRepairRisk(repairKeywords) {
  let totalScore = 0;
  let totalCost = 0;

  for (const repair of repairKeywords) {
    // Add to total cost
    totalCost += repair.estimatedCost;

    // Score based on severity
    const severityScores = {
      'CRITICAL': 40,
      'HIGH': 30,
      'MEDIUM': 20,
      'LOW': 10
    };

    totalScore += severityScores[repair.severity] || 15;
  }

  // Cap at 100
  totalScore = Math.min(totalScore, 100);

  return {
    score: totalScore,
    totalCost: totalCost
  };
}

// =========================================================
// MARKET VALUATION
// =========================================================
// The previous model priced purely by age: every vehicle 15+ years old
// got a flat $4,000 base regardless of what it was, so a Corvette and a
// worn-out sedan valued identically. It also compared mileage against
// "expected miles = age x 12,000", which meant a 23-year-old car was
// expected to have 276k miles — so a 256k-mile Corolla earned a low-mileage
// BONUS. Market Value drives profit, ROI, MAO and priority, so those errors
// inverted the deal rankings.
//
// This model prices by vehicle segment with a segment-specific
// depreciation curve, then adjusts for mileage and condition.
// =========================================================

/**
 * Segment pricing: typical new price, annual value retention, and a floor
 * below which a running example of that segment does not realistically fall.
 */
const QUANTUM_SEGMENTS = {
  performance: {base: 48000, retention: 0.95, floor: 5000},
  heavyTruck:  {base: 58000, retention: 0.91, floor: 4000},
  lightTruck:  {base: 44000, retention: 0.90, floor: 2500},
  largeSuv:    {base: 46000, retention: 0.88, floor: 2200},
  smallSuv:    {base: 34000, retention: 0.88, floor: 1800},
  minivan:     {base: 38000, retention: 0.87, floor: 1400},
  luxury:      {base: 58000, retention: 0.83, floor: 2200},
  powersports: {base: 11000, retention: 0.86, floor: 800},
  economy:     {base: 24000, retention: 0.89, floor: 900}
};

const QUANTUM_SEGMENT_PATTERNS = {
  performance: /\b(camaro|mustang|challenger|charger|firebird|trans am|corvette|hellcat|viper|shelby|gt350|gt500|z06|grand sport|trackhawk|raptor|trx|srt|zl1|type r|sti|evo|amg)\b/i,
  heavyTruck:  /\b(2500|3500|f-?250|f-?350|super duty)\b/i,
  lightTruck:  /\b(f-?150|1500|sierra|tacoma|tundra|ranger|colorado|canyon|frontier|ridgeline|titan|silverado)\b/i,
  largeSuv:    /\b(tahoe|suburban|expedition|yukon|sequoia|armada|durango|traverse|pilot|highlander|explorer|grand cherokee|4runner)\b/i,
  smallSuv:    /\b(rav4|cr-?v|escape|equinox|rogue|compass|cherokee|tucson|sportage|forester|hr-?v|trax|encore|terrain)\b/i,
  minivan:     /\b(odyssey|sienna|town|caravan|pacifica|carnival|transit)\b/i
};

const QUANTUM_LUXURY_MAKES = /^(lexus|bmw|mercedes|audi|porsche|jaguar|land rover|infiniti|acura|cadillac|lincoln|genesis|tesla|maserati|volvo)$/i;
const QUANTUM_POWERSPORT_MAKES = /^(ktm|yamaha|kawasaki|suzuki|harley-davidson|polaris|can-am|arctic cat|sea-doo|ski-doo|indian|triumph|cf moto)$/i;
const QUANTUM_RELIABLE_MAKES = /^(toyota|honda|lexus|subaru|acura)$/i;

/**
 * Classify a listing into a pricing segment from its make, model and title.
 */
function classifyVehicleSegment(parsed) {
  const make = String(parsed.make || '');
  const text = [parsed.model, parsed.title].join(' ');

  if (QUANTUM_POWERSPORT_MAKES.test(make)) return 'powersports';

  // Order matters: heavy trucks before light trucks, since "2500" would
  // otherwise be caught by the broader truck pattern.
  const order = ['performance', 'heavyTruck', 'lightTruck', 'largeSuv', 'smallSuv', 'minivan'];
  for (const seg of order) {
    if (QUANTUM_SEGMENT_PATTERNS[seg].test(text)) return seg;
  }

  if (QUANTUM_LUXURY_MAKES.test(make)) return 'luxury';
  return 'economy';
}

/**
 * Mileage multiplier.
 *
 * Combines a relative reading (how the odometer compares to typical use for
 * the vehicle's age) with an absolute one, because beyond roughly 150k miles
 * a vehicle loses value regardless of how old it is.
 */
function quantumMileageFactor(mileage, age, segment) {
  if (!mileage || mileage <= 0) return 1.0;

  // Floor the expectation so a nearly new vehicle with high miles is not
  // compared against an unrealistically small number.
  const expected = Math.max(age * 12000, 15000);
  const ratio = mileage / expected;

  let relative;
  if (ratio < 0.25) relative = 1.35;
  else if (ratio < 0.5) relative = 1.20;
  else if (ratio < 0.8) relative = 1.08;
  else if (ratio <= 1.2) relative = 1.0;
  else if (ratio < 1.6) relative = 0.94;
  else if (ratio < 2.2) relative = 0.88;
  else relative = 0.80;

  // Implausibly low mileage on an older vehicle usually means a rolled-over
  // or mistyped odometer, so cap the bonus rather than trusting it outright.
  // The threshold is deliberately low: collector and performance cars really
  // are garaged and driven ~1-2k miles a year, and capping those would
  // undervalue exactly the listings worth chasing. Under 1k miles a year is
  // the range where the reading is more likely wrong than remarkable.
  if (age >= 10 && (mileage / Math.max(age, 1)) < 1000) {
    relative = Math.min(relative, 1.10);
  }

  let absolute = 1.0;
  if (segment !== 'powersports') {
    if (mileage > 250000) absolute = 0.60;
    else if (mileage > 200000) absolute = 0.70;
    else if (mileage > 150000) absolute = 0.82;
    else if (mileage > 120000) absolute = 0.90;
  }

  // A low-mileage bonus must survive when there is no absolute penalty:
  // Math.min(1.35, 1.0) would cancel it.
  return absolute < 1 ? Math.min(relative, absolute) : relative;
}

function estimateQuantumMarketValue(parsed) {
  // E-bikes price on a completely different scale and are handled by
  // their own model; running one through the vehicle curves overvalues
  // it by roughly an order of magnitude.
  if (isEbikeListing(parsed)) {
    return estimateEbikeMarketValue(parsed);
  }

  const currentYear = new Date().getFullYear();
  const year = parseInt(parsed.year);
  const age = isNaN(year) ? 12 : Math.max(0, currentYear - year);

  const segment = classifyVehicleSegment(parsed);
  const spec = QUANTUM_SEGMENTS[segment];

  // Segment depreciation curve
  let retention = spec.retention;
  if (QUANTUM_RELIABLE_MAKES.test(String(parsed.make || ''))) {
    retention = Math.min(0.95, retention + 0.025);
  }

  let value = spec.base * Math.pow(retention, age);

  // Mileage
  value *= quantumMileageFactor(parsed.mileage, age, segment);

  // Condition
  const conditionMultipliers = {
    'Excellent': 1.15,
    'Very Good': 1.08,
    'Very good': 1.08,
    'Like new': 1.12,
    'Good': 1.0,
    'Fair': 0.85,
    'Poor': 0.62,
    'Salvage': 0.40
  };
  value *= conditionMultipliers[parsed.condition] || 0.95;

  // Model-specific knowledge overrides the estimate when we have real data
  const knowledge = getVehicleKnowledge(parsed.make, parsed.model, parsed.year);
  if (knowledge) {
    if (knowledge.marketDemand === 'Very High') value *= 1.1;
    else if (knowledge.marketDemand === 'High') value *= 1.05;
    else if (knowledge.marketDemand === 'Low') value *= 0.95;

    if (value < knowledge.priceRange.low) value = knowledge.priceRange.low;
    if (value > knowledge.priceRange.high) value = knowledge.priceRange.high;
  }

  return Math.max(Math.round(value), spec.floor);
}

/**
 * Holding cost for a deal.
 *
 * A flat $500 is right for a car but absurd on a $1,200 e-bike, where it
 * would consume 40% of the margin. Scale with value and cap at the
 * original $500, so vehicles above $10k are unaffected.
 */
function quantumHoldingCost(marketValue) {
  if (!marketValue || marketValue <= 0) return 50;
  return Math.max(50, Math.min(500, Math.round(marketValue * 0.05)));
}

function calculateQuantumMAO(marketValue, repairCost) {
  // Quantum MAO formula
  // MAO = (ARV * 0.75) - Repair Costs - Holding Costs - Profit Margin

  const holdingCosts = quantumHoldingCost(marketValue);
  const desiredProfit = marketValue * 0.15; // 15% minimum profit

  const mao = (marketValue * 0.75) - repairCost - holdingCosts - desiredProfit;

  // Floor scales with the item: a fixed $500 minimum would exceed the
  // whole sensible offer on a cheap e-bike.
  const floor = Math.min(500, Math.max(25, marketValue * 0.1));
  return Math.max(mao, floor);
}

function classifyCapitalTier(price) {
  for (const [tier, config] of Object.entries(CAPITAL_TIERS)) {
    if (price >= config.min && price <= config.max) {
      return config.label;
    }
  }
  return 'Unknown';
}

function calculateSalesVelocity(parsed) {
  // Score based on vehicle popularity and market demand
  const popularModels = {
    'Camry': 90,
    'Accord': 88,
    'Civic': 85,
    'Corolla': 87,
    'F-150': 92,
    'Silverado': 90,
    'CR-V': 86,
    'RAV4': 88,
    'Escape': 82,
    'Explorer': 80
  };

  let velocityScore = popularModels[parsed.model] || 70;

  // Adjust for condition
  if (parsed.condition === 'Excellent' || parsed.condition === 'Very Good') {
    velocityScore += 10;
  }

  // Adjust for price competitiveness
  if (parsed.daysListed > 30) {
    velocityScore -= 15;
  } else if (parsed.daysListed < 7) {
    velocityScore += 10;
  }

  // Check knowledge base
  const knowledge = getVehicleKnowledge(parsed.make, parsed.model, parsed.year);
  if (knowledge) {
    velocityScore = knowledge.quickFlipScore;
  }

  return Math.min(Math.max(velocityScore, 0), 100);
}

function calculateMarketAdvantage(parsed, metrics) {
  let advantage = 50; // Base score

  // Price advantage
  const priceRatio = parsed.price / metrics.marketValue;
  if (priceRatio < 0.7) advantage += 20;
  else if (priceRatio < 0.8) advantage += 10;
  else if (priceRatio > 0.95) advantage -= 20;

  // Location advantage — distance is null when the location could not be
  // resolved. Guard explicitly: `null < 25` is true in JS and would hand out
  // a proximity bonus to listings whose location we never identified.
  if (metrics.distance !== null && metrics.distance !== undefined && !isNaN(metrics.distance)) {
    if (metrics.distance < 25) advantage += 10;
    else if (metrics.distance > 100) advantage -= 15;
  }

  // Condition advantage
  if (metrics.conditionScore > 80) advantage += 15;
  else if (metrics.conditionScore < 50) advantage -= 15;

  // Platform advantage
  const platformScores = {
    'Facebook': 5,
    'Craigslist': 0,
    'OfferUp': 3,
    'eBay': -5 // More competition
  };

  advantage += platformScores[parsed.platform] || 0;

  return Math.min(Math.max(advantage, 0), 100);
}

function scoreImages(imageCount) {
  if (imageCount >= 15) return 95;
  if (imageCount >= 10) return 85;
  if (imageCount >= 7) return 75;
  if (imageCount >= 5) return 65;
  if (imageCount >= 3) return 50;
  if (imageCount >= 1) return 30;
  return 10;
}

function calculateEngagementScore(parsed) {
  let score = 50;

  // Quick response indicators
  if (parsed.daysListed < 3) score += 20;
  else if (parsed.daysListed < 7) score += 10;
  else if (parsed.daysListed > 30) score -= 20;

  // Seller type bonus
  if (parsed.sellerType === 'Private') score += 10;

  // Contact availability
  if (parsed.sellerPhone) score += 15;
  if (parsed.sellerEmail) score += 10;

  // Multiple vehicles penalty (might be a dealer)
  if (parsed.multipleVehicles) score -= 15;

  return Math.min(Math.max(score, 0), 100);
}

function assessCompetitionLevel(parsed) {
  let competition = 50;

  // Platform-based competition
  const platformCompetition = {
    'eBay': 80, // National competition
    'Facebook': 60, // Regional competition
    'Craigslist': 40, // Local competition
    'OfferUp': 50 // Local/Regional
  };

  competition = platformCompetition[parsed.platform] || 50;

  // Adjust for popular models
  const popularModels = ['Camry', 'Accord', 'Civic', 'Corolla', 'F-150', 'Silverado'];
  if (popularModels.includes(parsed.model)) {
    competition += 15;
  }

  // Adjust for price range
  if (parsed.price < 5000) competition += 10; // High demand segment
  else if (parsed.price > 20000) competition -= 10; // Fewer buyers

  return Math.min(Math.max(competition, 0), 100);
}

function calculateQuantumPriority(metrics) {
  const score = (
    metrics.roi * 0.3 +
    metrics.profitMargin * 0.2 +
    metrics.salesVelocity * 0.2 +
    metrics.marketAdvantage * 0.15 +
    (100 - metrics.repairRiskScore) * 0.15
  );

  if (score > 70) return 'High';
  if (score > 40) return 'Medium';
  return 'Low';
}

/**
 * Judge whether a parsed listing carries enough real data to be scored.
 *
 * Missing fields default to 0, and 0 is not neutral in this model: a price
 * of 0 produces a fake profit equal to the whole market value, so the worst
 * listings rank highest. Flag these instead of scoring them.
 *
 * @return {{usable:boolean, status:string, issues:string[]}}
 */
function assessDataQuality(parsed) {
  const issues = [];

  if (!parsed.price || parsed.price <= 0) {
    issues.push('No price captured');
  }

  // Mileage is not universally meaningful: powersports listings report
  // hours, and most e-bike listings have no odometer at all. Requiring it
  // would send every e-bike to Needs Review.
  const isPowersport = !!parsed.hours && parsed.hours > 0;
  const isEbike = isEbikeListing(parsed);
  if (!isPowersport && !isEbike && (!parsed.mileage || parsed.mileage <= 0)) {
    issues.push('No mileage captured');
  }

  // E-bike listings routinely omit the model year, and the valuation model
  // assumes a mid-life example in that case rather than failing.
  if (!parsed.year && !isEbike) {
    issues.push('No year identified');
  }

  // A price alone is not enough to value a vehicle, but it is the field that
  // actually breaks the maths — treat any missing core field as unusable.
  return {
    usable: issues.length === 0,
    status: issues.length === 0 ? 'OK' : 'Incomplete',
    issues: issues
  };
}
