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
  var skippedIncomplete = 0;
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var dealId = row[0];     // Column A: Deal ID
    var verdict = row[42];   // Column AQ: Verdict (0-indexed col 42)

    // Skip rows without a deal ID or that already have a verdict
    if (!dealId) continue;
    if (verdict && verdict !== '' && verdict !== 'Needs Review') continue;

    // Validate critical fields: must have year, make, and price
    var year = row[5];
    var make = row[6];
    var price = row[13];
    if (!year || !make || !price) {
      skippedIncomplete++;
      logQuantum('Batch Skip', 'Deal ' + dealId + ': Missing critical data (year=' + year + ', make=' + make + ', price=' + price + ')');
      continue;
    }

    // Read already-calculated metrics directly from the sheet
    // These were computed during import by processQuantumImport -> calculateQuantumMetrics
    var metrics = {
      distance: row[16] || 0,           // Column Q: Distance
      locationRisk: row[17] || '',       // Column R: Location Risk
      locationFlag: row[18] || '',       // Column S: Location Flag
      conditionScore: row[20] || 50,     // Column U: Condition Score
      repairRiskScore: row[22] || 0,     // Column W: Repair Risk Score
      estimatedRepairCost: row[23] || 0, // Column X: Est. Repair Cost
      marketValue: row[24] || 0,         // Column Y: Market Value
      mao: row[25] || 0,                 // Column Z: MAO
      salesVelocity: row[30] || 0,       // Column AE: Sales Velocity Score
      marketAdvantage: row[31] || 0,     // Column AF: Market Advantage
      imageScore: row[45] || 0,          // Column AT: Image Score
      engagementScore: row[46] || 0,     // Column AU: Engagement Score
      competitionLevel: row[47] || 0     // Column AV: Competition Level
    };

    // If market value is 0, the import didn't calculate it properly — skip
    if (metrics.marketValue <= 0) {
      skippedIncomplete++;
      logQuantum('Batch Skip', 'Deal ' + dealId + ': No market value calculated');
      continue;
    }

    deals.push({
      rowNum: i + 1,  // 1-indexed for sheet operations
      dealId: dealId,
      metrics: metrics
    });
  }

  if (skippedIncomplete > 0) {
    logQuantum('Batch Analysis', skippedIncomplete + ' deals skipped due to missing data.');
  }

  if (deals.length === 0) {
    logQuantum('Batch Analysis', 'All deals already analyzed.');
    return {success: true, message: 'All deals already analyzed.', analyzed: 0};
  }

  // Process deals one at a time with time limit check (5 min safety margin)
  var MAX_RUNTIME_MS = 5 * 60 * 1000; // 5 minutes (leave 1 min buffer before Google's 6 min limit)
  var analyzed = 0;
  var skipped = 0;

  for (var d = 0; d < deals.length; d++) {
    // Check if we're running out of time
    var elapsed = new Date() - startTime;
    if (elapsed > MAX_RUNTIME_MS) {
      skipped = deals.length - d;
      logQuantum('Batch Analysis', 'Time limit approaching. Stopping after ' + analyzed + ' deals. ' + skipped + ' remaining for next run.');
      break;
    }

    try {
      triggerQuantumAnalysis([deals[d]]);
      analyzed++;
    } catch (e) {
      logQuantum('Batch Analysis Error', 'Deal ' + deals[d].dealId + ': ' + e.toString());
    }
  }

  var duration = new Date() - startTime;
  logQuantum('Batch Analysis', 'Completed. ' + analyzed + '/' + deals.length + ' deals analyzed in ' + Math.round(duration / 1000) + 's.' + (skipped > 0 ? ' Run again to process remaining ' + skipped + ' deals.' : ''));

  if (analyzed > 0) {
    SpreadsheetApp.getUi().alert('Quantum AI Analysis Complete\n\n' + analyzed + ' deals analyzed.\n' + (skipped > 0 ? skipped + ' deals remaining — run again to continue.' : 'All deals processed!'));
  } else {
    SpreadsheetApp.getUi().alert('No unanalyzed deals found in the Master Database.');
  }

  return {success: true, message: analyzed + ' deals analyzed.', analyzed: analyzed, skipped: skipped, duration: duration};
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
  // Column numbers are 1-based for getRange()
  // 30:Flip Strategy, 38:Deal Flag, 41:Seller Message,
  // 42:AI Confidence, 43:Verdict, 44:Verdict Icon, 45:Recommended?

  // Update flip strategy (Column AD = 30)
  sheet.getRange(rowNum, 30).setValue(analysis.flipStrategy);

  // Update deal flag based on verdict (Column AL = 38)
  const flagMap = {
    '🔥 HOT DEAL': '🔥',
    '✅ SOLID DEAL': '✅',
    '⚠️ PORTFOLIO FOUNDATION': '⚠️',
    '❌ PASS': '❌'
  };
  sheet.getRange(rowNum, 38).setValue(flagMap[analysis.verdict] || '');

  // Update seller message (Column AO = 41)
  sheet.getRange(rowNum, 41).setValue(analysis.sellerMessage || '');

  // Update AI fields
  sheet.getRange(rowNum, 42).setValue(analysis.confidence);        // Column AP: AI Confidence
  sheet.getRange(rowNum, 43).setValue(analysis.verdict);           // Column AQ: Verdict
  sheet.getRange(rowNum, 44).setValue(analysis.verdict ? analysis.verdict.split(' ')[0] : ''); // Column AR: Verdict Icon
  sheet.getRange(rowNum, 45).setValue(analysis.recommended ? 'YES' : 'NO'); // Column AS: Recommended?

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
