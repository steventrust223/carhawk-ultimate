// ============================================================================
// CARHAWK ULTIMATE — CRM.GS
// Real CRM Integration: SMS-iT + CompanyHub (G-12/G-13)
// With Retry, Rate Limiting, and Logging
// ============================================================================

// ============================================================================
// CRM ROUTING (Deterministic Rules)
// ============================================================================

/**
 * Route deal to appropriate CRM actions based on verdict
 */
function routeDealToCRM(analysis) {
  const verdict = analysis.verdict || 'PASS';

  // Get routing config
  let routing;
  if (verdict === 'HOT DEAL') {
    routing = CRM_ROUTING.HOT_DEAL;
  } else if (verdict === 'SOLID DEAL') {
    routing = CRM_ROUTING.SOLID_DEAL;
  } else {
    routing = CRM_ROUTING.PASS;
  }

  const results = {
    smsit: null,
    companyhub: null
  };

  // Route to CompanyHub
  if (FEATURE_FLAGS.ENABLE_COMPANYHUB_INTEGRATION) {
    if (verdict !== 'PASS' || FEATURE_FLAGS.LOG_PASSES_TO_CRM) {
      results.companyhub = syncToCompanyHub(analysis, routing);
    }
  }

  // Route to SMS-iT
  if (FEATURE_FLAGS.ENABLE_SMS_INTEGRATION && routing.SEND_SMS) {
    if (analysis.sellerPhone) {
      results.smsit = sendToSMSIT(analysis, routing);
    }
  }

  return results;
}

// ============================================================================
// SMS-iT INTEGRATION (G-12: Real HTTP + Tagging + Logging + Retry)
// ============================================================================

/**
 * Send deal to SMS-iT with message
 */
function sendToSMSIT(analysis, routing) {
  const apiKey = getApiKey('SMSIT');
  if (!apiKey) {
    logCrmSync('SMS-iT', 'SKIP', analysis.id, 'NO_API_KEY', {}, { error: 'No API key configured' });
    return { success: false, error: 'No API key configured' };
  }

  // Build tags
  const tags = [...routing.SMSIT_TAGS, analysis.strategy];

  // Generate message
  const message = generateSellerMessage(analysis);

  // Build payload
  const payload = {
    to: formatPhoneForSMSIT(analysis.sellerPhone),
    message: message,
    tags: tags,
    customFields: {
      carHawkId: analysis.id,
      vehicle: analysis.vehicle,
      mao: analysis.mao,
      verdict: analysis.verdict,
      strategy: analysis.strategy,
      profitPotential: analysis.profitDollars
    }
  };

  // Send with retry
  return callSMSITWithRetry('contacts/message', 'POST', payload, analysis.id);
}

/**
 * Create or update contact in SMS-iT
 */
function upsertSMSITContact(analysis, tags = []) {
  const apiKey = getApiKey('SMSIT');
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  const payload = {
    phone: formatPhoneForSMSIT(analysis.sellerPhone),
    firstName: extractFirstName(analysis.sellerName),
    lastName: analysis.sellerName?.split(' ').slice(1).join(' ') || '',
    email: analysis.sellerEmail || '',
    tags: tags,
    customFields: {
      carHawkId: analysis.id,
      vehicle: analysis.vehicle,
      platform: analysis.platform,
      askingPrice: analysis.askingPrice,
      mao: analysis.mao,
      verdict: analysis.verdict
    }
  };

  return callSMSITWithRetry('contacts', 'POST', payload, analysis.id);
}

/**
 * Call SMS-iT API with retry and rate limiting
 */
function callSMSITWithRetry(endpoint, method, payload, dealId) {
  const apiKey = getApiKey('SMSIT');
  const url = `${API_CONFIG.SMSIT.BASE_URL}/${endpoint}`;

  let lastError = null;

  for (let attempt = 0; attempt <= API_CONFIG.SMSIT.MAX_RETRIES; attempt++) {
    try {
      // Rate limiting
      Utilities.sleep(API_CONFIG.SMSIT.RATE_LIMIT_MS);

      const response = UrlFetchApp.fetch(url, {
        method: method.toLowerCase(),
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        payload: method !== 'GET' ? JSON.stringify(payload) : null,
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      const body = response.getContentText();
      let responseData;

      try {
        responseData = JSON.parse(body);
      } catch (e) {
        responseData = { raw: body };
      }

      if (code >= 200 && code < 300) {
        logCrmSync('SMS-iT', endpoint, dealId, 'SUCCESS', payload, responseData);
        return {
          success: true,
          data: responseData,
          statusCode: code
        };
      }

      // Rate limit - wait and retry
      if (code === 429) {
        lastError = 'Rate limited';
        Utilities.sleep(API_CONFIG.SMSIT.RETRY_DELAY_MS * 3);
        continue;
      }

      // Other error
      lastError = `HTTP ${code}: ${body.substring(0, 200)}`;

    } catch (e) {
      lastError = e.toString();
    }

    // Wait before retry
    if (attempt < API_CONFIG.SMSIT.MAX_RETRIES) {
      Utilities.sleep(API_CONFIG.SMSIT.RETRY_DELAY_MS * (attempt + 1));
    }
  }

  const error = `Failed after ${API_CONFIG.SMSIT.MAX_RETRIES + 1} attempts: ${lastError}`;
  logCrmSync('SMS-iT', endpoint, dealId, 'FAILED', payload, { error: error });

  return {
    success: false,
    error: error
  };
}

/**
 * Format phone number for SMS-iT (E.164 format)
 */
function formatPhoneForSMSIT(phone) {
  if (!phone) return '';

  // Remove all non-digits
  const digits = String(phone).replace(/\D/g, '');

  // Add US country code if needed
  if (digits.length === 10) {
    return '+1' + digits;
  }

  if (digits.length === 11 && digits.startsWith('1')) {
    return '+' + digits;
  }

  return '+' + digits;
}

// ============================================================================
// COMPANYHUB INTEGRATION (G-13: Real HTTP + Logging + Retry)
// ============================================================================

/**
 * Sync deal to CompanyHub
 */
function syncToCompanyHub(analysis, routing) {
  const apiKey = getApiKey('COMPANYHUB');
  if (!apiKey) {
    logCrmSync('CompanyHub', 'SKIP', analysis.id, 'NO_API_KEY', {}, { error: 'No API key configured' });
    return { success: false, error: 'No API key configured' };
  }

  // Build deal payload
  const payload = {
    title: `${analysis.vehicle} - ${analysis.verdict}`,
    stage: routing.COMPANYHUB_STAGE,
    value: analysis.mao || 0,
    probability: calculateDealProbability(analysis),
    expectedCloseDate: calculateExpectedCloseDate(analysis),
    contact: {
      name: analysis.sellerName || 'Unknown Seller',
      phone: analysis.sellerPhone || '',
      email: analysis.sellerEmail || ''
    },
    customFields: {
      carHawkId: analysis.id,
      platform: analysis.platform,
      askingPrice: analysis.askingPrice,
      mao: analysis.mao,
      profitPotential: analysis.profitDollars,
      profitPercent: analysis.profitPct,
      strategy: analysis.strategy,
      verdict: analysis.verdict,
      overallScore: analysis.overallScore,
      distance: analysis.distance,
      condition: analysis.condition,
      mileage: analysis.mileage,
      year: analysis.year,
      make: analysis.make,
      model: analysis.model
    },
    tags: generateCompanyHubTags(analysis, routing),
    notes: generateCompanyHubNotes(analysis)
  };

  return callCompanyHubWithRetry('deals', 'POST', payload, analysis.id);
}

/**
 * Update existing deal in CompanyHub
 */
function updateCompanyHubDeal(dealId, analysis, newStage) {
  const apiKey = getApiKey('COMPANYHUB');
  if (!apiKey) {
    return { success: false, error: 'No API key configured' };
  }

  const payload = {
    stage: newStage,
    customFields: {
      lastUpdated: new Date().toISOString(),
      currentStatus: analysis.status || 'Updated'
    }
  };

  return callCompanyHubWithRetry(`deals/${dealId}`, 'PUT', payload, analysis.id);
}

/**
 * Call CompanyHub API with retry and rate limiting
 */
function callCompanyHubWithRetry(endpoint, method, payload, dealId) {
  const apiKey = getApiKey('COMPANYHUB');
  const url = `${API_CONFIG.COMPANYHUB.BASE_URL}/${endpoint}`;

  let lastError = null;

  for (let attempt = 0; attempt <= API_CONFIG.COMPANYHUB.MAX_RETRIES; attempt++) {
    try {
      // Rate limiting
      Utilities.sleep(API_CONFIG.COMPANYHUB.RATE_LIMIT_MS);

      const response = UrlFetchApp.fetch(url, {
        method: method.toLowerCase(),
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        payload: method !== 'GET' ? JSON.stringify(payload) : null,
        muteHttpExceptions: true
      });

      const code = response.getResponseCode();
      const body = response.getContentText();
      let responseData;

      try {
        responseData = JSON.parse(body);
      } catch (e) {
        responseData = { raw: body };
      }

      if (code >= 200 && code < 300) {
        logCrmSync('CompanyHub', endpoint, dealId, 'SUCCESS', payload, responseData);
        return {
          success: true,
          data: responseData,
          statusCode: code
        };
      }

      // Rate limit
      if (code === 429) {
        lastError = 'Rate limited';
        Utilities.sleep(API_CONFIG.COMPANYHUB.RETRY_DELAY_MS * 3);
        continue;
      }

      lastError = `HTTP ${code}: ${body.substring(0, 200)}`;

    } catch (e) {
      lastError = e.toString();
    }

    if (attempt < API_CONFIG.COMPANYHUB.MAX_RETRIES) {
      Utilities.sleep(API_CONFIG.COMPANYHUB.RETRY_DELAY_MS * (attempt + 1));
    }
  }

  const error = `Failed after ${API_CONFIG.COMPANYHUB.MAX_RETRIES + 1} attempts: ${lastError}`;
  logCrmSync('CompanyHub', endpoint, dealId, 'FAILED', payload, { error: error });

  return {
    success: false,
    error: error
  };
}

/**
 * Calculate deal probability for CRM
 */
function calculateDealProbability(analysis) {
  const verdict = analysis.verdict || 'PASS';
  const temperature = analysis.temperature || 'Cold';

  let probability = 10;

  if (verdict === 'HOT DEAL') probability = 70;
  else if (verdict === 'SOLID DEAL') probability = 50;
  else probability = 10;

  // Adjust based on temperature
  if (temperature === 'Hot') probability += 15;
  else if (temperature === 'Warm') probability += 5;

  return Math.min(probability, 95);
}

/**
 * Calculate expected close date
 */
function calculateExpectedCloseDate(analysis) {
  const today = new Date();
  let daysToClose = 14; // Default

  const verdict = analysis.verdict || 'PASS';
  if (verdict === 'HOT DEAL') daysToClose = 7;
  else if (verdict === 'SOLID DEAL') daysToClose = 14;
  else daysToClose = 30;

  // Adjust for strategy
  if (analysis.strategy === 'HOLD_SEASONAL') daysToClose += 30;

  const closeDate = new Date(today);
  closeDate.setDate(closeDate.getDate() + daysToClose);

  return closeDate.toISOString().split('T')[0];
}

/**
 * Generate tags for CompanyHub
 */
function generateCompanyHubTags(analysis, routing) {
  const tags = ['CARHAWK'];

  // Verdict tags
  if (analysis.verdict === 'HOT DEAL') tags.push('hot-deal');
  else if (analysis.verdict === 'SOLID DEAL') tags.push('solid-deal');

  // Strategy tag
  tags.push(analysis.strategy.toLowerCase().replace('_', '-'));

  // Platform tag
  if (analysis.platform) {
    tags.push(analysis.platform.toLowerCase());
  }

  // Distance tags
  if (analysis.distance < 25) tags.push('local');
  else if (analysis.distance < 100) tags.push('regional');
  else tags.push('distant');

  // Performance tags
  if (analysis.profitPct > 0.25) tags.push('high-margin');
  if (analysis.profitDollars > 3000) tags.push('high-profit');

  return tags;
}

/**
 * Generate notes for CompanyHub
 */
function generateCompanyHubNotes(analysis) {
  const parts = [
    `CarHawk Analysis - ${new Date().toLocaleDateString()}`,
    `Vehicle: ${analysis.vehicle}`,
    `Verdict: ${analysis.verdict} | Score: ${analysis.overallScore}/100`,
    `Strategy: ${analysis.strategyLabel || analysis.strategy}`,
    `MAO: ${formatCurrency(analysis.mao)} | Asking: ${formatCurrency(analysis.askingPrice)}`,
    `Profit Potential: ${formatCurrency(analysis.profitDollars)} (${formatPercent(analysis.profitPct)})`,
    `Distance: ${Math.round(analysis.distance)} miles`,
    `Condition: ${analysis.condition} | Title: ${analysis.titleStatus}`
  ];

  if (analysis.whyPass) {
    parts.push(`Why Pass: ${analysis.whyPass}`);
  }

  return parts.join('\n');
}

// ============================================================================
// BATCH CRM SYNC
// ============================================================================

/**
 * Sync multiple deals to CRM with concurrency protection
 */
function batchSyncToCRM(analyses) {
  const lock = LockService.getScriptLock();

  if (!lock.tryLock(LOCK_CONFIG.CRM_SYNC_LOCK_TIMEOUT_MS)) {
    throw new Error('CRM sync already in progress');
  }

  try {
    const results = [];

    for (const analysis of analyses) {
      try {
        const result = routeDealToCRM(analysis);
        results.push({
          id: analysis.id,
          success: true,
          smsit: result.smsit,
          companyhub: result.companyhub
        });

        // Rate limiting between deals
        Utilities.sleep(500);

      } catch (error) {
        results.push({
          id: analysis.id,
          success: false,
          error: error.toString()
        });
      }
    }

    logSystem('Batch CRM Sync', `Synced ${analyses.length} deals`, {
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    });

    return results;

  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// CRM EXPORT UI FUNCTIONS
// ============================================================================

/**
 * Export hot leads to CRM (menu function)
 */
function exportHotLeadsToCRM() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet(SHEETS.MASTER);

  if (!sheet) {
    ui.alert('Master Database not found.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const hotDeals = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    // Check for Hot temperature and has phone
    if (row[5] === 'Hot' && row[30]) {
      const dealData = normalizeFromRow(row);
      const analysis = analyzeDeal(dealData);
      if (analysis.verdict === 'HOT DEAL') {
        hotDeals.push(analysis);
      }
    }
  }

  if (hotDeals.length === 0) {
    ui.alert('No hot deals with phone numbers found.');
    return;
  }

  const confirm = ui.alert(
    'Export to CRM',
    `Found ${hotDeals.length} hot deals. Export to SMS-iT and CompanyHub?`,
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  try {
    const results = batchSyncToCRM(hotDeals);
    const success = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    ui.alert(
      'Export Complete',
      `Successfully synced: ${success}\nFailed: ${failed}`,
      ui.ButtonSet.OK
    );

  } catch (error) {
    ui.alert('Export Error', error.toString(), ui.ButtonSet.OK);
  }
}

/**
 * Write export to local CRM sheet
 */
function writeToLocalCRMSheet(analysis, crmResults) {
  const sheet = getOrCreateSheet(SHEETS.CRM);

  sheet.appendRow([
    generateId('CRM'),
    new Date(),
    analysis.id,
    analysis.vehicle,
    analysis.sellerName,
    analysis.sellerPhone,
    analysis.sellerEmail,
    analysis.verdict,
    analysis.strategy,
    analysis.mao,
    analysis.profitDollars,
    crmResults.smsit?.success ? 'Sent' : 'Not Sent',
    crmResults.companyhub?.success ? 'Synced' : 'Not Synced',
    generateSellerMessage(analysis).substring(0, 200),
    new Date()
  ]);
}
