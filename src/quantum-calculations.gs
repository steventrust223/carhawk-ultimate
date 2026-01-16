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
  metrics.distance = calculateQuantumDistance(parsed.zip);
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
  
  // Profit calculations
  const profit = metrics.marketValue - parsed.price - metrics.estimatedRepairCost - 500; // $500 holding costs
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
  
  return metrics;
}

function calculateQuantumDistance(targetZip) {
  if (!targetZip) return 999; // Unknown location
  
  const homeZip = getQuantumSetting('HOME_ZIP') || '63101';
  
  // Simplified distance calculation
  // In production, use Maps API for accurate distance
  const zipDiff = Math.abs(parseInt(homeZip) - parseInt(targetZip));
  
  // Rough approximation: 1 ZIP difference ≈ 10 miles
  return Math.min(zipDiff * 0.1, 500);
}

function assessLocationRisk(distance) {
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

function estimateQuantumMarketValue(parsed) {
  // Base value by age
  const currentYear = new Date().getFullYear();
  const age = currentYear - parseInt(parsed.year);
  
  let baseValue = 30000; // Default
  
  if (age < 2) baseValue = 40000;
  else if (age < 4) baseValue = 30000;
  else if (age < 6) baseValue = 22000;
  else if (age < 10) baseValue = 15000;
  else if (age < 15) baseValue = 8000;
  else baseValue = 4000;
  
  // Adjust for make premium
  const makePremiums = {
    'Toyota': 1.1,
    'Honda': 1.08,
    'Lexus': 1.3,
    'BMW': 1.25,
    'Mercedes': 1.28,
    'Audi': 1.22,
    'Tesla': 1.4,
    'Porsche': 1.5,
    'Ford': 0.95,
    'Chevrolet': 0.93,
    'Nissan': 0.92
  };
  
  const premium = makePremiums[parsed.make] || 1.0;
  baseValue *= premium;
  
  // Adjust for mileage
  const avgMilesPerYear = 12000;
  const expectedMiles = age * avgMilesPerYear;
  const mileageDiff = parsed.mileage - expectedMiles;
  
  if (mileageDiff > 20000) {
    baseValue *= 0.85;
  } else if (mileageDiff > 10000) {
    baseValue *= 0.92;
  } else if (mileageDiff < -10000) {
    baseValue *= 1.08;
  } else if (mileageDiff < -20000) {
    baseValue *= 1.15;
  }
  
  // Condition adjustment
  const conditionMultipliers = {
    'Excellent': 1.15,
    'Very Good': 1.08,
    'Good': 1.0,
    'Fair': 0.85,
    'Poor': 0.65
  };
  
  baseValue *= conditionMultipliers[parsed.condition] || 0.9;
  
  // Check knowledge base for model-specific adjustments
  const knowledge = getVehicleKnowledge(parsed.make, parsed.model, parsed.year);
  if (knowledge) {
    // Adjust based on market demand
    if (knowledge.marketDemand === 'Very High') baseValue *= 1.1;
    else if (knowledge.marketDemand === 'High') baseValue *= 1.05;
    else if (knowledge.marketDemand === 'Low') baseValue *= 0.95;
    
    // Cap within known price range
    if (baseValue < knowledge.priceRange.low) baseValue = knowledge.priceRange.low;
    if (baseValue > knowledge.priceRange.high) baseValue = knowledge.priceRange.high;
  }
  
  return Math.round(baseValue);
}

function calculateQuantumMAO(marketValue, repairCost) {
  // Quantum MAO formula
  // MAO = (ARV * 0.75) - Repair Costs - Holding Costs - Profit Margin
  
  const holdingCosts = 500; // Base holding costs
  const desiredProfit = marketValue * 0.15; // 15% minimum profit
  
  const mao = (marketValue * 0.75) - repairCost - holdingCosts - desiredProfit;
  
  return Math.max(mao, 500); // Never go below $500
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
  
  // Location advantage
  if (metrics.distance < 25) advantage += 10;
  else if (metrics.distance > 100) advantage -= 15;
  
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

// =========================================================
