// =========================================================
// FILE: quantum-ai.gs - Quantum AI Analysis Engine
// =========================================================

/**
 * Executes batch AI analysis on all unanalyzed deals in the Master Database.
 * Called from menu, triggers, and UI batch actions.
 */
function executeQuantumAIBatch() {
  const startTime = new Date();
  logQuantum('Batch Analysis', 'Starting quantum AI batch analysis...');

  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  if (!dbSheet) {
    logQuantum('Batch Analysis Error', 'Master Database sheet not found.');
    return {success: false, message: 'Master Database sheet not found.'};
  }

  const data = dbSheet.getDataRange().getValues();
  if (data.length <= 1) {
    logQuantum('Batch Analysis', 'No deals found in database.');
    return {success: true, message: 'No deals to analyze.', analyzed: 0};
  }

  var deals = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dealId = row[0];     // Column A: Deal ID
    var verdict = row[42];   // Column AQ: Verdict (0-indexed col 42)

    // Skip rows without a deal ID or that already have a verdict
    if (!dealId) continue;
    if (verdict && verdict !== '' && verdict !== 'Needs Review') continue;

    var parsed = {
      year: row[5],
      make: row[6],
      model: row[7],
      trim: row[8],
      vin: row[9],
      mileage: row[10],
      color: row[11],
      condition: row[19],
      price: row[13],
      zip: row[15],
      daysListed: row[32],
      platform: row[2],
      sellerType: row[36],
      sellerPhone: row[34],
      sellerEmail: row[35],
      multipleVehicles: row[39],
      imageCount: row[11] ? 5 : 0,
      repairKeywords: row[21] ? (typeof row[21] === 'string' ? JSON.parse(row[21] || '[]') : []) : []
    };

    try {
      var metrics = calculateQuantumMetrics(parsed);
      deals.push({
        rowNum: i + 1,  // 1-indexed for sheet operations
        dealId: dealId,
        metrics: metrics
      });
    } catch (e) {
      logQuantum('Metrics Error', 'Deal ' + dealId + ': ' + e.toString());
    }
  }

  if (deals.length === 0) {
    logQuantum('Batch Analysis', 'All deals already analyzed.');
    return {success: true, message: 'All deals already analyzed.', analyzed: 0};
  }

  // Process in batches to avoid execution time limits
  var BATCH_SIZE = 10;
  var analyzed = 0;
  for (var b = 0; b < deals.length; b += BATCH_SIZE) {
    var batch = deals.slice(b, b + BATCH_SIZE);
    try {
      triggerQuantumAnalysis(batch);
      analyzed += batch.length;
    } catch (e) {
      logQuantum('Batch Analysis Error', 'Batch starting at index ' + b + ': ' + e.toString());
    }
  }

  var duration = new Date() - startTime;
  logQuantum('Batch Analysis', 'Completed. ' + analyzed + '/' + deals.length + ' deals analyzed in ' + duration + 'ms.');

  return {success: true, message: analyzed + ' deals analyzed.', analyzed: analyzed, duration: duration};
}

function triggerQuantumAnalysis(deals) {
  const apiKey = getQuantumSetting('OPENAI_API_KEY');
  if (!apiKey) {
    SpreadsheetApp.getUi().alert('OpenAI API key not configured.');
    return;
  }

  const analysisDepth = getQuantumSetting('ANALYSIS_DEPTH') || 'QUANTUM';
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const verdictSheet = getQuantumSheet(QUANTUM_SHEETS.VERDICT.name);

  for (const deal of deals) {
    try {
      // Get deal data
      const dealData = dbSheet.getRange(deal.rowNum, 1, 1, 60).getValues()[0];

      // Prepare quantum context
      const context = prepareQuantumContext(dealData, deal.metrics);

      // Execute quantum analysis
      const analysis = executeQuantumAnalysis(context, apiKey, analysisDepth);

      // Update database with results
      updateQuantumResults(dbSheet, deal.rowNum, analysis);

      // Log verdict
      logQuantumVerdict(verdictSheet, deal.dealId, analysis);

      // Check for alerts
      checkQuantumAlerts(dealData, analysis);

      // Auto-create follow-up sequence if hot deal
      if (analysis.verdict === '🔥 HOT DEAL' && getQuantumSetting('AUTO_FOLLOW_UP') === 'true') {
        createFollowUpSequence(deal.dealId, 'HOT_LEAD');
      }

    } catch (error) {
      logQuantum('Analysis Error', `Deal ${deal.dealId}: ${error.toString()}`);
    }
  }
}

function prepareQuantumContext(dealData, metrics) {
  return {
    vehicle: {
      year: dealData[5],
      make: dealData[6],
      model: dealData[7],
      trim: dealData[8],
      mileage: dealData[10],
      color: dealData[11],
      title: dealData[12]
    },
    pricing: {
      askingPrice: dealData[13],
      marketValue: metrics.marketValue,
      mao: metrics.mao,
      estimatedRepairCost: metrics.estimatedRepairCost
    },
    condition: {
      stated: dealData[19],
      score: metrics.conditionScore,
      repairKeywords: dealData[21],
      repairRisk: metrics.repairRiskScore
    },
    market: {
      daysListed: dealData[32],
      platform: dealData[2],
      location: dealData[14],
      distance: metrics.distance,
      competitionLevel: metrics.competitionLevel,
      salesVelocity: metrics.salesVelocity,
      marketAdvantage: metrics.marketAdvantage
    },
    seller: {
      type: dealData[36],
      hotSeller: dealData[38],
      multipleVehicles: dealData[39],
      engagementScore: metrics.engagementScore
    }
  };
}

function executeQuantumAnalysis(context, apiKey, depth) {
  const quantumPrompt = generateQuantumPrompt(context, depth);

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: depth === 'QUANTUM' ? 'gpt-4-turbo-preview' : 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a quantum-class vehicle investment analyst with deep market knowledge and predictive capabilities. Analyze deals with extreme precision and provide actionable intelligence.'
          },
          {
            role: 'user',
            content: quantumPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });

    const result = JSON.parse(response.getContentText());
    return JSON.parse(result.choices[0].message.content);

  } catch (error) {
    logQuantum('OpenAI Error', error.toString());
    return generateFallbackAnalysis(context);
  }
}

function generateQuantumPrompt(context, depth) {
  const depthInstructions = {
    QUANTUM: 'Perform ultra-deep analysis considering market microtrends, seasonal patterns, demographic targeting, and psychological pricing strategies.',
    ADVANCED: 'Analyze with focus on profit optimization, risk mitigation, and market timing.',
    BASIC: 'Provide quick assessment focusing on obvious profit potential and major risks.'
  };

  return `Analyze this vehicle deal with ${depth} intelligence level:

Vehicle: ${context.vehicle.year} ${context.vehicle.make} ${context.vehicle.model}
Mileage: ${context.vehicle.mileage}
Asking Price: $${context.pricing.askingPrice}
Market Value: $${context.pricing.marketValue}
MAO: $${context.pricing.mao}
Repair Estimate: $${context.pricing.estimatedRepairCost}
Condition: ${context.condition.stated} (Score: ${context.condition.score}/100)
Repair Keywords: ${context.condition.repairKeywords}
Days Listed: ${context.market.daysListed}
Platform: ${context.market.platform}
Distance: ${context.market.distance} miles
Competition Level: ${context.market.competitionLevel}
Seller Type: ${context.seller.type}

${depthInstructions[depth]}

Return analysis in this JSON structure:
{
  "quantumScore": (0-100),
  "verdict": "🔥 HOT DEAL" | "✅ SOLID DEAL" | "⚠️ PORTFOLIO FOUNDATION" | "❌ PASS",
  "confidence": (0-100),
  "flipStrategy": "Quick Flip" | "Repair + Resell" | "Wholesale" | "Part Out" | "Pass",
  "profitPotential": (dollar amount),
  "riskAssessment": {
    "overall": "Low" | "Medium" | "High",
    "factors": ["list", "of", "risks"]
  },
  "marketTiming": "Excellent" | "Good" | "Fair" | "Poor",
  "priceOptimization": {
    "suggestedOffer": (dollar amount),
    "maxOffer": (dollar amount),
    "negotiationRoom": (percentage)
  },
  "quickSaleProbability": (0-100),
  "repairComplexity": "None" | "Simple" | "Moderate" | "Complex",
  "hiddenCostRisk": (0-100),
  "flipTimeline": "X-Y days",
  "successProbability": (0-100),
  "keyInsights": ["insight1", "insight2", "insight3"],
  "redFlags": ["flag1", "flag2"],
  "greenLights": ["positive1", "positive2"],
  "sellerMessage": "Personalized message to seller",
  "recommended": true | false
}`;
}

function updateQuantumResults(sheet, rowNum, analysis) {
  // Update flip strategy
  sheet.getRange(rowNum, 29).setValue(analysis.flipStrategy);

  // Update deal flag based on verdict
  const flagMap = {
    '🔥 HOT DEAL': '🔥',
    '✅ SOLID DEAL': '✅',
    '⚠️ PORTFOLIO FOUNDATION': '⚠️',
    '❌ PASS': '❌'
  };
  sheet.getRange(rowNum, 37).setValue(flagMap[analysis.verdict]);

  // Update seller message
  sheet.getRange(rowNum, 40).setValue(analysis.sellerMessage);

  // Update AI fields
  sheet.getRange(rowNum, 41).setValue(analysis.confidence);
  sheet.getRange(rowNum, 42).setValue(analysis.verdict);
  sheet.getRange(rowNum, 43).setValue(analysis.verdict.split(' ')[0]); // Icon only
  sheet.getRange(rowNum, 44).setValue(analysis.recommended ? 'YES' : 'NO');

  // Apply conditional formatting based on verdict
  const row = sheet.getRange(rowNum, 1, 1, sheet.getLastColumn());

  if (analysis.verdict === '🔥 HOT DEAL') {
    row.setBackground('#ffebee'); // Light red
  } else if (analysis.verdict === '✅ SOLID DEAL') {
    row.setBackground('#e8f5e9'); // Light green
  } else if (analysis.verdict === '❌ PASS') {
    row.setBackground('#f5f5f5'); // Light grey
  }
}
