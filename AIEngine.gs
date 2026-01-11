// ==========================================
// CARHAWK ULTIMATE - AI ENGINE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: AI-powered analysis for condition assessment, seller messages, and insights
// ==========================================

/**
 * AI is used for:
 * 1. Condition inference from descriptions
 * 2. Repair risk estimation
 * 3. Seller message generation (personalized, context-aware)
 * 4. Negotiation angle identification
 * 5. Market insights
 *
 * AI does NOT replace:
 * - MAO calculations (math-based)
 * - Speed-to-lead calculations (math-based)
 * - Rental ROI (math-based)
 */

/**
 * Analyze vehicle using OpenAI API
 * @param {Object} vehicle - Vehicle data object
 * @return {Object} AI analysis results
 */
function analyzeVehicleWithAI(vehicle) {
  const apiKey = getConfig('OPENAI_API_KEY');

  if (!apiKey) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
      aiCondition: 'Unknown',
      sellerMessage: 'Configure API key to generate messages',
      negotiationAngle: 'N/A',
      aiNotes: 'AI analysis unavailable'
    };
  }

  try {
    // Build context for AI
    const context = buildVehicleContext(vehicle);

    // Call OpenAI
    const response = callOpenAI(context, apiKey);

    // Parse response
    const analysis = parseAIResponse(response);

    return {
      success: true,
      aiCondition: analysis.condition || 'Good',
      sellerMessage: analysis.message || '',
      negotiationAngle: analysis.angle || '',
      aiNotes: analysis.notes || ''
    };

  } catch (error) {
    logError('AI_ANALYSIS_ERROR', error.message);
    return {
      success: false,
      error: error.message,
      aiCondition: 'Error',
      sellerMessage: 'AI analysis failed',
      negotiationAngle: 'N/A',
      aiNotes: error.message
    };
  }
}

/**
 * Build context string for AI analysis
 * @param {Object} vehicle - Vehicle data
 * @return {string} Context for AI
 */
function buildVehicleContext(vehicle) {
  const year = vehicle[MASTER_COLUMNS.YEAR] || '';
  const make = vehicle[MASTER_COLUMNS.MAKE] || '';
  const model = vehicle[MASTER_COLUMNS.MODEL] || '';
  const mileage = vehicle[MASTER_COLUMNS.MILEAGE] || '';
  const askingPrice = vehicle[MASTER_COLUMNS.ASKING_PRICE] || 0;
  const offerTarget = vehicle[MASTER_COLUMNS.OFFER_TARGET] || 0;
  const description = vehicle[MASTER_COLUMNS.DESCRIPTION] || '';
  const platform = vehicle[MASTER_COLUMNS.PLATFORM] || '';
  const condition = vehicle[MASTER_COLUMNS.CONDITION] || '';
  const sellerName = vehicle[MASTER_COLUMNS.SELLER_NAME] || 'the seller';

  const context = `
Analyze this vehicle listing and provide:
1. Estimated condition (Excellent/Very Good/Good/Fair/Poor)
2. A personalized seller message (2-3 sentences, friendly, professional, cash buyer angle)
3. Best negotiation angle
4. Brief notes on opportunity

Vehicle:
- ${year} ${make} ${model}
- Mileage: ${mileage}
- Asking Price: $${askingPrice}
- Our Target Offer: $${offerTarget}
- Platform: ${platform}
- Listed Condition: ${condition}
- Seller: ${sellerName}
- Description: "${description}"

Guidelines for seller message:
- Be friendly and respectful
- Mention you're a cash buyer (no financing delays)
- Express genuine interest
- Suggest meeting soon
- Don't mention exact offer amount yet
- Keep it concise (2-3 sentences max)
`.trim();

  return context;
}

/**
 * Call OpenAI API
 * @param {string} context - Context for analysis
 * @param {string} apiKey - OpenAI API key
 * @return {string} AI response
 */
function callOpenAI(context, apiKey) {
  const endpoint = 'https://api.openai.com/v1/chat/completions';

  const payload = {
    model: API_CONFIG.OPENAI.model,
    messages: [
      {
        role: 'system',
        content: 'You are an expert vehicle appraiser and negotiator helping a car flipper analyze deals and craft seller messages. Be concise and practical.'
      },
      {
        role: 'user',
        content: context
      }
    ],
    max_tokens: API_CONFIG.OPENAI.maxTokens,
    temperature: API_CONFIG.OPENAI.temperature
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(endpoint, options);
  const responseCode = response.getResponseCode();

  if (responseCode !== 200) {
    throw new Error(`OpenAI API error: ${responseCode} - ${response.getContentText()}`);
  }

  const json = JSON.parse(response.getContentText());

  if (!json.choices || json.choices.length === 0) {
    throw new Error('No response from OpenAI');
  }

  return json.choices[0].message.content;
}

/**
 * Parse AI response into structured data
 * @param {string} response - Raw AI response
 * @return {Object} Parsed analysis
 */
function parseAIResponse(response) {
  // AI should respond in structured format, but we'll parse it flexibly
  const lines = response.split('\n').filter(line => line.trim() !== '');

  const analysis = {
    condition: '',
    message: '',
    angle: '',
    notes: ''
  };

  let currentSection = '';

  for (let line of lines) {
    const lower = line.toLowerCase();

    if (lower.includes('condition:')) {
      currentSection = 'condition';
      analysis.condition = line.split(':')[1].trim();
    } else if (lower.includes('seller message:') || lower.includes('message:')) {
      currentSection = 'message';
      const parts = line.split(':');
      if (parts.length > 1) {
        analysis.message = parts.slice(1).join(':').trim();
      }
    } else if (lower.includes('negotiation:') || lower.includes('angle:')) {
      currentSection = 'angle';
      const parts = line.split(':');
      if (parts.length > 1) {
        analysis.angle = parts.slice(1).join(':').trim();
      }
    } else if (lower.includes('notes:')) {
      currentSection = 'notes';
      const parts = line.split(':');
      if (parts.length > 1) {
        analysis.notes = parts.slice(1).join(':').trim();
      }
    } else {
      // Continuation of current section
      if (currentSection === 'message' && !analysis.message) {
        analysis.message = line.trim();
      } else if (currentSection === 'message') {
        analysis.message += ' ' + line.trim();
      } else if (currentSection === 'angle' && !analysis.angle) {
        analysis.angle = line.trim();
      } else if (currentSection === 'notes') {
        analysis.notes += ' ' + line.trim();
      }
    }
  }

  // Clean up
  analysis.message = analysis.message.replace(/["""]/g, '').trim();

  return analysis;
}

/**
 * Generate seller message without AI (fallback template)
 * @param {Object} vehicle - Vehicle data
 * @return {string} Template-based message
 */
function generateSellerMessageTemplate(vehicle) {
  const year = vehicle[MASTER_COLUMNS.YEAR] || '';
  const make = vehicle[MASTER_COLUMNS.MAKE] || '';
  const model = vehicle[MASTER_COLUMNS.MODEL] || '';
  const sellerName = vehicle[MASTER_COLUMNS.SELLER_NAME] || '';
  const platform = vehicle[MASTER_COLUMNS.PLATFORM] || '';

  // Templates based on platform
  let template = '';

  if (platform.toLowerCase().includes('facebook')) {
    template = `Hi${sellerName ? ' ' + sellerName : ''}! I'm very interested in your ${year} ${make} ${model}. I'm a cash buyer and can come take a look today or tomorrow. Is it still available?`;
  } else if (platform.toLowerCase().includes('craigslist')) {
    template = `Hello, I saw your ${year} ${make} ${model} listing. I'm a serious cash buyer looking for exactly this. Would love to see it this week. Still available?`;
  } else {
    template = `Hi! Interested in your ${year} ${make} ${model}. Cash buyer, can meet soon. Is this still for sale?`;
  }

  return template;
}

/**
 * Run AI analysis on all vehicles in Master Database
 * @param {number} limit - Maximum number to analyze (to avoid API costs)
 */
function runBatchAIAnalysis(limit = 10) {
  const apiKey = getConfig('OPENAI_API_KEY');

  if (!apiKey) {
    SpreadsheetApp.getUi().alert('Please configure OpenAI API key in Config sheet');
    return;
  }

  try {
    const sheet = getSheet(SHEETS.MASTER.name);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = data[0];

    // Find required columns
    const colMap = {};
    for (let col in MASTER_COLUMNS) {
      colMap[col] = headers.indexOf(MASTER_COLUMNS[col]);
    }

    let analyzed = 0;

    for (let i = 1; i < Math.min(data.length, limit + 1); i++) {
      const row = data[i];

      // Build vehicle object
      const vehicle = {};
      for (let col in MASTER_COLUMNS) {
        const index = colMap[col];
        if (index !== -1) {
          vehicle[MASTER_COLUMNS[col]] = row[index];
        }
      }

      // Skip if already has AI data
      if (vehicle[MASTER_COLUMNS.SELLER_MESSAGE] &&
          vehicle[MASTER_COLUMNS.SELLER_MESSAGE] !== 'Generate message') {
        continue;
      }

      // Analyze with AI
      const analysis = analyzeVehicleWithAI(vehicle);

      if (analysis.success) {
        // Update columns
        if (colMap.AI_CONDITION !== -1) {
          sheet.getRange(i + 1, colMap.AI_CONDITION + 1).setValue(analysis.aiCondition);
        }
        if (colMap.SELLER_MESSAGE !== -1) {
          sheet.getRange(i + 1, colMap.SELLER_MESSAGE + 1).setValue(analysis.sellerMessage);
        }
        if (colMap.NEGOTIATION_ANGLE !== -1) {
          sheet.getRange(i + 1, colMap.NEGOTIATION_ANGLE + 1).setValue(analysis.negotiationAngle);
        }
        if (colMap.AI_NOTES !== -1) {
          sheet.getRange(i + 1, colMap.AI_NOTES + 1).setValue(analysis.aiNotes);
        }

        analyzed++;

        // Rate limiting: sleep 1 second between API calls
        Utilities.sleep(1000);
      }
    }

    logSystem('AI_BATCH_ANALYSIS', `Analyzed ${analyzed} vehicles with AI`);

    SpreadsheetApp.getUi().alert(
      '✅ AI Analysis Complete',
      `Analyzed ${analyzed} vehicles.\n\n` +
      'Seller messages and insights have been generated.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('AI_BATCH_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error during AI analysis: ' + error.message);
  }
}

/**
 * Generate seller messages for all vehicles (with template fallback)
 */
function generateAllSellerMessages() {
  try {
    const sheet = getSheet(SHEETS.MASTER.name);
    const data = sheet.getDataRange().getValues();

    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = data[0];
    const sellerMessageCol = headers.indexOf(MASTER_COLUMNS.SELLER_MESSAGE);

    if (sellerMessageCol === -1) {
      throw new Error('Seller Message column not found');
    }

    let generated = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];

      // Build vehicle object
      const vehicle = {};
      for (let j = 0; j < headers.length; j++) {
        vehicle[headers[j]] = row[j];
      }

      // Skip if already has message
      if (vehicle[MASTER_COLUMNS.SELLER_MESSAGE] &&
          vehicle[MASTER_COLUMNS.SELLER_MESSAGE] !== 'Generate message') {
        continue;
      }

      // Generate template message
      const message = generateSellerMessageTemplate(vehicle);

      // Update column
      sheet.getRange(i + 1, sellerMessageCol + 1).setValue(message);

      generated++;
    }

    logSystem('SELLER_MESSAGES_GENERATED', `Generated ${generated} seller messages`);

    SpreadsheetApp.getUi().alert(
      '✅ Messages Generated',
      `Generated ${generated} seller messages using templates.\n\n` +
      'Use AI Analysis for personalized messages (requires API key).',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('MESSAGE_GENERATION_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error generating messages: ' + error.message);
  }
}
