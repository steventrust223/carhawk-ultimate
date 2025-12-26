// ============================================================================
// CARHAWK ULTIMATE — AI.GS
// AI Integration with OpenAI (G-07/08: Validation + Retry + Fallback)
// AI is OPTIONAL and NEVER overrides core scoring
// ============================================================================

/**
 * AI Response Schema for validation
 */
const AI_RESPONSE_SCHEMA = {
  required: ['summary', 'repairHints', 'sellerTone'],
  optional: ['negotiationTips', 'redFlags', 'greenFlags', 'marketInsight'],
  types: {
    summary: 'string',
    repairHints: 'array',
    sellerTone: 'string',
    negotiationTips: 'array',
    redFlags: 'array',
    greenFlags: 'array',
    marketInsight: 'string'
  }
};

/**
 * Call AI for deal insights (optional enhancement)
 * Returns deterministic fallback on any failure
 */
function getAIInsights(dealData) {
  // Check if AI is enabled
  if (!FEATURE_FLAGS.ENABLE_AI_NOTES) {
    return getDefaultInsights(dealData);
  }

  // Get API key
  const apiKey = getApiKey('OPENAI');
  if (!apiKey) {
    logHealth('AI', 'WARNING', 'No OpenAI API key configured');
    return getDefaultInsights(dealData);
  }

  // Build prompt
  const prompt = buildAIPrompt(dealData);

  // Call API with retry
  try {
    const response = callOpenAIWithRetry(prompt, apiKey);

    // Validate response
    const validated = validateAIResponse(response);

    logHealth('AI', 'SUCCESS', 'AI insights generated', {
      vehicle: dealData.vehicle,
      hasRepairHints: validated.repairHints.length > 0
    });

    return validated;

  } catch (error) {
    logHealth('AI', 'ERROR', `AI call failed: ${error.toString()}`, {
      vehicle: dealData.vehicle
    });
    return getDefaultInsights(dealData);
  }
}

/**
 * Build AI prompt for deal analysis
 * AI provides supplementary insights only - not scoring
 */
function buildAIPrompt(dealData) {
  return `Analyze this vehicle listing and provide insights. DO NOT provide scores or verdicts - only supplementary information.

Vehicle: ${dealData.year || ''} ${dealData.make || ''} ${dealData.model || ''}
Mileage: ${dealData.mileage || 'Unknown'}
Condition: ${dealData.condition || 'Unknown'}
Asking Price: $${dealData.askingPrice || 0}
Days Listed: ${dealData.daysListed || 'Unknown'}
Title Status: ${dealData.titleStatus || 'Unknown'}
Listing Text: ${(dealData.title || '') + ' ' + (dealData.description || '')}

Provide your response as valid JSON with this exact structure:
{
  "summary": "One sentence summary of this deal opportunity",
  "repairHints": ["Array of potential repair issues mentioned or implied"],
  "sellerTone": "motivated" | "firm" | "flexible" | "desperate" | "unknown",
  "negotiationTips": ["Array of negotiation suggestions based on listing"],
  "redFlags": ["Array of warning signs in this listing"],
  "greenFlags": ["Array of positive indicators"],
  "marketInsight": "Brief market context for this vehicle type"
}

Be concise. Focus on information not obvious from the numbers alone.`;
}

/**
 * Call OpenAI API with retry logic
 */
function callOpenAIWithRetry(prompt, apiKey) {
  let lastError = null;

  for (let attempt = 0; attempt <= API_CONFIG.OPENAI.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(API_CONFIG.OPENAI.URL, {
        method: 'post',
        headers: {
          'Authorization': 'Bearer ' + apiKey,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify({
          model: API_CONFIG.OPENAI.MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: API_CONFIG.OPENAI.TEMPERATURE,
          response_format: { type: 'json_object' }
        }),
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      const body = response.getContentText();

      if (code === 200) {
        const result = JSON.parse(body);
        const content = result.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('Empty AI response content');
        }

        return JSON.parse(content);
      }

      // Rate limiting - wait longer
      if (code === 429) {
        lastError = 'Rate limited';
        Utilities.sleep(API_CONFIG.OPENAI.RETRY_DELAY_MS * 3);
        continue;
      }

      // Other error
      lastError = `API error ${code}: ${body.substring(0, 200)}`;

    } catch (e) {
      lastError = e.toString();
    }

    // Wait before retry
    if (attempt < API_CONFIG.OPENAI.MAX_RETRIES) {
      Utilities.sleep(API_CONFIG.OPENAI.RETRY_DELAY_MS * (attempt + 1));
    }
  }

  throw new Error(`OpenAI failed after ${API_CONFIG.OPENAI.MAX_RETRIES + 1} attempts: ${lastError}`);
}

/**
 * Validate AI response against schema
 * Ensures all required fields exist and have correct types
 */
function validateAIResponse(response) {
  const validated = {};

  // Check required fields
  for (const field of AI_RESPONSE_SCHEMA.required) {
    if (response[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }

    const expectedType = AI_RESPONSE_SCHEMA.types[field];
    if (!validateFieldType(response[field], expectedType)) {
      throw new Error(`Invalid type for ${field}: expected ${expectedType}`);
    }

    validated[field] = response[field];
  }

  // Check optional fields
  for (const field of AI_RESPONSE_SCHEMA.optional) {
    if (response[field] !== undefined) {
      const expectedType = AI_RESPONSE_SCHEMA.types[field];
      if (validateFieldType(response[field], expectedType)) {
        validated[field] = response[field];
      }
    }
  }

  // Ensure arrays are arrays
  validated.repairHints = Array.isArray(validated.repairHints) ? validated.repairHints : [];
  validated.negotiationTips = Array.isArray(validated.negotiationTips) ? validated.negotiationTips : [];
  validated.redFlags = Array.isArray(validated.redFlags) ? validated.redFlags : [];
  validated.greenFlags = Array.isArray(validated.greenFlags) ? validated.greenFlags : [];

  // Validate sellerTone is from allowed values
  const validTones = ['motivated', 'firm', 'flexible', 'desperate', 'unknown'];
  if (!validTones.includes(validated.sellerTone)) {
    validated.sellerTone = 'unknown';
  }

  return validated;
}

/**
 * Validate field type
 */
function validateFieldType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'array':
      return Array.isArray(value);
    case 'number':
      return typeof value === 'number';
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
}

/**
 * Get default insights when AI is unavailable
 * Deterministic fallback based on deal data
 */
function getDefaultInsights(dealData) {
  const insights = {
    summary: generateDefaultSummary(dealData),
    repairHints: generateDefaultRepairHints(dealData),
    sellerTone: 'unknown',
    negotiationTips: generateDefaultNegotiationTips(dealData),
    redFlags: generateDefaultRedFlags(dealData),
    greenFlags: generateDefaultGreenFlags(dealData),
    marketInsight: generateDefaultMarketInsight(dealData)
  };

  return insights;
}

/**
 * Generate default summary
 */
function generateDefaultSummary(dealData) {
  const vehicle = `${dealData.year || ''} ${dealData.make || ''} ${dealData.model || ''}`.trim();
  const condition = dealData.condition || 'unknown condition';

  return `${vehicle} in ${condition.toLowerCase()} listed at ${formatCurrency(dealData.askingPrice || 0)}.`;
}

/**
 * Generate default repair hints based on condition
 */
function generateDefaultRepairHints(dealData) {
  const hints = [];
  const condition = dealData.condition || '';
  const textContent = `${dealData.title || ''} ${dealData.description || ''}`.toLowerCase();

  if (condition === 'Poor' || condition === 'Parts Only') {
    hints.push('Major repairs likely needed based on condition rating');
  }

  if (condition === 'Fair') {
    hints.push('Some repairs may be needed - inspect carefully');
  }

  // Check for common repair keywords
  if (textContent.includes('engine')) hints.push('Engine issues mentioned');
  if (textContent.includes('transmission')) hints.push('Transmission issues mentioned');
  if (textContent.includes('rust')) hints.push('Rust mentioned - check thoroughly');
  if (textContent.includes('ac') || textContent.includes('a/c')) hints.push('A/C may need attention');
  if (textContent.includes('brake')) hints.push('Brakes may need service');

  return hints;
}

/**
 * Generate default negotiation tips
 */
function generateDefaultNegotiationTips(dealData) {
  const tips = [];
  const daysListed = parseInt(dealData.daysListed) || 0;

  if (daysListed > 30) {
    tips.push('Listed for over a month - seller may be motivated');
  }

  if (daysListed > 60) {
    tips.push('Long listing time suggests room for negotiation');
  }

  if (daysListed < 7) {
    tips.push('Fresh listing - seller expectations may be high initially');
  }

  const condition = dealData.condition || '';
  if (condition === 'Fair' || condition === 'Poor') {
    tips.push('Use condition as leverage in negotiations');
  }

  return tips.length > 0 ? tips : ['Standard negotiation approach recommended'];
}

/**
 * Generate default red flags
 */
function generateDefaultRedFlags(dealData) {
  const flags = [];
  const titleStatus = dealData.titleStatus || '';
  const condition = dealData.condition || '';
  const textContent = `${dealData.title || ''} ${dealData.description || ''}`.toLowerCase();

  if (titleStatus === 'Salvage' || titleStatus === 'Rebuilt') {
    flags.push('Salvage/rebuilt title');
  }

  if (titleStatus === 'No Title') {
    flags.push('No title - significant risk');
  }

  if (condition === 'Parts Only') {
    flags.push('Listed as parts only');
  }

  if (textContent.includes('as is') || textContent.includes('as-is')) {
    flags.push('Sold as-is - limited recourse');
  }

  if (textContent.includes('flood') || textContent.includes('water damage')) {
    flags.push('Possible flood damage');
  }

  return flags;
}

/**
 * Generate default green flags
 */
function generateDefaultGreenFlags(dealData) {
  const flags = [];
  const condition = dealData.condition || '';
  const titleStatus = dealData.titleStatus || '';
  const mileage = parseInt(dealData.mileage) || 999999;

  if (condition === 'Excellent' || condition === 'Very Good') {
    flags.push('Good condition rating');
  }

  if (titleStatus === 'Clean' || titleStatus === 'Clear') {
    flags.push('Clean title');
  }

  if (mileage < 100000) {
    flags.push('Relatively low mileage');
  }

  const make = dealData.make || '';
  if (['Toyota', 'Honda', 'Lexus'].includes(make)) {
    flags.push('Reliable brand with good resale value');
  }

  return flags;
}

/**
 * Generate default market insight
 */
function generateDefaultMarketInsight(dealData) {
  const make = dealData.make || '';
  const premium = getMakePremium(make);

  if (premium >= 1.08) {
    return `${make} vehicles typically hold value well and sell quickly.`;
  } else if (premium >= 1.00) {
    return `${make} vehicles have average market demand.`;
  } else {
    return `${make} vehicles may take longer to resell - price competitively.`;
  }
}

// ============================================================================
// AI MESSAGE REWRITING
// ============================================================================

/**
 * Use AI to rewrite a seller message (keeping same offer)
 * Returns original if AI fails
 */
function rewriteMessageWithAI(originalMessage, analysis, tone = 'friendly') {
  if (!FEATURE_FLAGS.ENABLE_AI_NOTES) {
    return originalMessage;
  }

  const apiKey = getApiKey('OPENAI');
  if (!apiKey) {
    return originalMessage;
  }

  const prompt = `Rewrite this seller message with a ${tone} tone. Keep the same offer amount and all key information. Make it natural and conversational.

Original message:
${originalMessage}

Return ONLY the rewritten message, nothing else.`;

  try {
    const response = UrlFetchApp.fetch(API_CONFIG.OPENAI.URL, {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: API_CONFIG.OPENAI.MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8
      }),
      muteHttpExceptions: true
    });

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      const rewritten = result.choices?.[0]?.message?.content?.trim();

      if (rewritten && rewritten.length > 50) {
        return rewritten;
      }
    }

  } catch (error) {
    logSystem('AI Rewrite', `Failed: ${error.toString()}`);
  }

  return originalMessage;
}

// ============================================================================
// AI NOTES GENERATION (for display in UI)
// ============================================================================

/**
 * Generate AI notes summary for a deal
 */
function generateAINotes(analysis) {
  const insights = getAIInsights(analysis);

  const parts = [];

  if (insights.summary) {
    parts.push(insights.summary);
  }

  if (insights.repairHints && insights.repairHints.length > 0) {
    parts.push('Repairs: ' + insights.repairHints.slice(0, 2).join(', '));
  }

  if (insights.sellerTone && insights.sellerTone !== 'unknown') {
    parts.push('Seller appears ' + insights.sellerTone);
  }

  if (insights.redFlags && insights.redFlags.length > 0) {
    parts.push('⚠️ ' + insights.redFlags[0]);
  }

  return parts.join(' | ').substring(0, 500); // Limit length
}
