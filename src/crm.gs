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

// ============================================================================
// EMAIL CAMPAIGN GENERATION
// ============================================================================

/**
 * Generate email campaign for hot leads (menu function)
 */
function generateEmailCampaign() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet(SHEETS.MASTER);

  if (!sheet) {
    ui.alert('Master Database not found.');
    return;
  }

  const data = sheet.getDataRange().getValues();
  const emailLeads = [];

  // Collect leads with email addresses
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const email = row[31]; // Seller Email column
    const temperature = row[5];

    if (email && (temperature === 'Hot' || temperature === 'Warm')) {
      const dealData = normalizeFromRow(row);
      const analysis = analyzeDeal(dealData);
      if (analysis.verdict !== 'PASS') {
        emailLeads.push(analysis);
      }
    }
  }

  if (emailLeads.length === 0) {
    ui.alert('No leads with email addresses found.');
    return;
  }

  // Show campaign options
  const response = ui.prompt(
    'Generate Email Campaign',
    `Found ${emailLeads.length} leads with emails.\n\nEnter campaign name:`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const campaignName = response.getResponseText().trim() || `Campaign_${new Date().toISOString().split('T')[0]}`;

  try {
    // Create campaign sheet
    const campaignSheet = getOrCreateSheet(`Email_${campaignName}`);

    // Set headers
    campaignSheet.getRange(1, 1, 1, 10).setValues([[
      'Email', 'Name', 'Vehicle', 'Verdict', 'Strategy',
      'MAO', 'Profit', 'Subject', 'Body', 'Generated'
    ]]);

    // Generate emails for each lead
    for (const analysis of emailLeads) {
      const emailContent = generateEmailContent(analysis);

      campaignSheet.appendRow([
        analysis.sellerEmail,
        analysis.sellerName || 'Seller',
        analysis.vehicle,
        analysis.verdict,
        analysis.strategy,
        analysis.mao,
        analysis.profitDollars,
        emailContent.subject,
        emailContent.body,
        new Date()
      ]);
    }

    // Format sheet
    campaignSheet.setFrozenRows(1);
    campaignSheet.autoResizeColumns(1, 10);

    ui.alert(
      'Campaign Generated',
      `Created campaign "${campaignName}" with ${emailLeads.length} emails.\n\nSheet: Email_${campaignName}`,
      ui.ButtonSet.OK
    );

    logSystem('Email Campaign', `Generated ${emailLeads.length} emails for ${campaignName}`);

  } catch (error) {
    ui.alert('Campaign Error', error.toString(), ui.ButtonSet.OK);
    logSystem('Email Campaign Error', error.toString());
  }
}

/**
 * Generate email content for a lead
 */
function generateEmailContent(analysis) {
  const strategy = analysis.strategy || 'QUICK_FLIP';
  const verdict = analysis.verdict || 'SOLID DEAL';
  const firstName = extractFirstName(analysis.sellerName) || 'there';

  // Subject lines by verdict
  const subjects = {
    'HOT DEAL': `Quick Question About Your ${analysis.year} ${analysis.make}`,
    'SOLID DEAL': `Interested in Your ${analysis.make} ${analysis.model}`,
    'PASS': `Question About Your Vehicle Listing`
  };

  // Body templates by strategy
  const bodies = {
    'QUICK_FLIP': `Hi ${firstName},

I came across your ${analysis.vehicle} listing and I'm very interested. I'm a local buyer who can move quickly and pay cash.

Would you be available for a quick call to discuss? I'm flexible on timing and can work around your schedule.

Best regards`,

    'REPAIR_RESELL': `Hi ${firstName},

I noticed your ${analysis.vehicle} for sale. I specialize in vehicles that need some TLC and I'm interested in taking a look.

I understand the condition and I'm prepared to make a fair cash offer. Would you have some time to chat this week?

Thanks`,

    'PART_OUT': `Hi ${firstName},

I'm reaching out about your ${analysis.vehicle}. I work with vehicles in various conditions and I'm interested in discussing a potential purchase.

I can be flexible and make the process easy for you. When would be a good time to connect?

Best`,

    'HOLD_SEASONAL': `Hi ${firstName},

Your ${analysis.vehicle} caught my attention. I'm building my inventory and this looks like a great addition.

I'm a serious buyer with cash ready. Would you be open to a conversation about the vehicle?

Thanks for your time`
  };

  return {
    subject: subjects[verdict] || subjects['SOLID DEAL'],
    body: bodies[strategy] || bodies['QUICK_FLIP']
  };
}

// ============================================================================
// CRM STATUS SYNC
// ============================================================================

/**
 * Sync CRM status back to Master sheet (menu function)
 */
function syncCRMStatus() {
  const ui = SpreadsheetApp.getUi();
  const masterSheet = getSheet(SHEETS.MASTER);
  const crmSheet = getSheet(SHEETS.CRM);

  if (!masterSheet) {
    ui.alert('Master Database not found.');
    return;
  }

  if (!crmSheet) {
    ui.alert('CRM sheet not found. Export leads first.');
    return;
  }

  const confirm = ui.alert(
    'Sync CRM Status',
    'This will:\n\n' +
    '1. Check CompanyHub for deal status updates\n' +
    '2. Update Master sheet with current CRM status\n' +
    '3. Log any changes\n\nContinue?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  try {
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(LOCK_CONFIG.CRM_SYNC_LOCK_TIMEOUT_MS)) {
      ui.alert('CRM sync already in progress. Try again later.');
      return;
    }

    let updated = 0;
    let errors = 0;

    // Get CRM data
    const crmData = crmSheet.getDataRange().getValues();

    // Build map of carHawkId -> row in CRM sheet
    const crmMap = new Map();
    for (let i = 1; i < crmData.length; i++) {
      const carHawkId = crmData[i][2]; // CarHawk ID column
      if (carHawkId) {
        crmMap.set(carHawkId, i + 1);
      }
    }

    // Get Master data
    const masterData = masterSheet.getDataRange().getValues();

    // Check each synced deal
    for (let i = 1; i < masterData.length; i++) {
      const dealId = masterData[i][0];

      if (crmMap.has(dealId)) {
        try {
          // Fetch status from CompanyHub
          const status = fetchCompanyHubDealStatus(dealId);

          if (status) {
            // Update CRM Status column (column 35, index 34)
            masterSheet.getRange(i + 1, 35).setValue(status.stage || 'Unknown');

            // Update Last CRM Sync column (column 36, index 35)
            masterSheet.getRange(i + 1, 36).setValue(new Date());

            updated++;
          }
        } catch (error) {
          errors++;
          logSystem('CRM Sync Error', `Deal ${dealId}: ${error.toString()}`);
        }

        // Rate limiting
        Utilities.sleep(200);
      }
    }

    lock.releaseLock();

    ui.alert(
      'Sync Complete',
      `Updated: ${updated} deals\nErrors: ${errors}`,
      ui.ButtonSet.OK
    );

    logSystem('CRM Status Sync', `Updated ${updated} deals, ${errors} errors`);

  } catch (error) {
    ui.alert('Sync Error', error.toString(), ui.ButtonSet.OK);
    logSystem('CRM Status Sync Error', error.toString());
  }
}

/**
 * Fetch deal status from CompanyHub
 */
function fetchCompanyHubDealStatus(carHawkId) {
  const apiKey = getApiKey('COMPANYHUB');
  if (!apiKey) {
    return null;
  }

  try {
    const url = `${API_CONFIG.COMPANYHUB.BASE_URL}/deals?customFields.carHawkId=${encodeURIComponent(carHawkId)}`;

    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      muteHttpExceptions: true
    });

    const code = response.getResponseCode();
    if (code >= 200 && code < 300) {
      const data = JSON.parse(response.getContentText());
      if (data && data.deals && data.deals.length > 0) {
        return {
          stage: data.deals[0].stage,
          status: data.deals[0].status,
          lastUpdated: data.deals[0].updatedAt
        };
      }
    }
  } catch (error) {
    logSystem('CompanyHub Fetch Error', error.toString());
  }

  return null;
}

/**
 * Show CRM sync log (menu function)
 */
function showCRMSyncLog() {
  const ui = SpreadsheetApp.getUi();
  const logSheet = getSheet(SHEETS.CRM_LOG);

  if (!logSheet) {
    ui.alert('No CRM sync logs found.');
    return;
  }

  const data = logSheet.getDataRange().getValues();

  // Get last 20 entries
  const recentLogs = data.slice(-20).reverse();

  let message = 'Recent CRM Sync Activity:\n\n';

  for (const log of recentLogs) {
    const timestamp = log[0] ? new Date(log[0]).toLocaleString() : 'N/A';
    const system = log[1] || '';
    const action = log[2] || '';
    const status = log[3] || '';

    message += `${timestamp}\n${system}: ${action} - ${status}\n\n`;
  }

  // Show in sidebar for better formatting
  const html = HtmlService.createHtmlOutput(
    `<html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          h2 { color: #1a73e8; }
          .log-entry {
            background: #f8f9fa;
            padding: 12px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 3px solid #1a73e8;
          }
          .timestamp { color: #5f6368; font-size: 12px; }
          .status-success { color: #34a853; }
          .status-failed { color: #ea4335; }
        </style>
      </head>
      <body>
        <h2>CRM Sync Log</h2>
        ${recentLogs.map(log => {
          const timestamp = log[0] ? new Date(log[0]).toLocaleString() : 'N/A';
          const system = log[1] || '';
          const action = log[2] || '';
          const status = log[3] || '';
          const statusClass = status === 'SUCCESS' ? 'status-success' : 'status-failed';
          return `
            <div class="log-entry">
              <div class="timestamp">${timestamp}</div>
              <strong>${system}</strong>: ${action}
              <span class="${statusClass}">${status}</span>
            </div>
          `;
        }).join('')}
      </body>
    </html>`
  )
    .setTitle('CRM Sync Log')
    .setWidth(400);

  ui.showSidebar(html);
}

// ============================================================================
// AUTO-ROUTING AFTER IMPORT ANALYSIS (Feature-Flagged)
// ============================================================================

/**
 * Check if a deal has already been exported to CRM (idempotency check)
 * Tracks: carHawkId, verdict, companyhub_status, smsit_status, routed_at
 * @param {string} carHawkId - The CarHawk deal ID
 * @param {string} currentVerdict - Current verdict to detect verdict changes
 * @returns {Object} - Full export status including verdict change detection
 */
function hasBeenExportedToCRM(carHawkId, currentVerdict) {
  const result = {
    exported: false,
    smsitSent: false,
    companyhubSynced: false,
    previousVerdict: null,
    verdictChanged: false,
    routedAt: null,
    crmRowNum: null
  };

  const crmSheet = getSheet(SHEETS.CRM);
  if (!crmSheet) return result;

  const data = crmSheet.getDataRange().getValues();

  // CRM Sheet columns:
  // 0: CRM ID, 1: Timestamp, 2: CarHawk ID, 3: Vehicle, 4: Seller Name
  // 5: Phone, 6: Email, 7: Verdict, 8: Strategy, 9: MAO, 10: Profit
  // 11: SMS Status, 12: CompanyHub Status, 13: Message Preview, 14: Last Updated
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === carHawkId) {
      result.exported = true;
      result.crmRowNum = i + 1;
      result.smsitSent = data[i][11] === 'Sent';
      result.companyhubSynced = data[i][12] === 'Synced';
      result.previousVerdict = data[i][7];
      result.routedAt = data[i][14];

      // verdictChanged = true ONLY if current verdict is an UPGRADE
      // Upgrade hierarchy: PASS < SOLID DEAL < HOT DEAL
      if (currentVerdict && result.previousVerdict) {
        result.verdictChanged = isVerdictUpgrade(result.previousVerdict, currentVerdict);
      }
      break;
    }
  }

  return result;
}

/**
 * Auto-route deals to CRM after import analysis
 * Called automatically when ENABLE_AUTO_CRM_ROUTING is true
 * @param {Array} analysisResults - Array of analysis results from analyzeDealsWithLock
 */
function autoRouteDealsToCRM(analysisResults) {
  // Check if auto-routing is enabled
  if (!FEATURE_FLAGS.ENABLE_AUTO_CRM_ROUTING) {
    return { skipped: true, reason: 'ENABLE_AUTO_CRM_ROUTING is false' };
  }

  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_CONFIG.CRM_SYNC_LOCK_TIMEOUT_MS)) {
    logCrmAutoRoute('SKIP', null, 'Could not acquire lock');
    return { skipped: true, reason: 'Lock unavailable' };
  }

  try {
    const stats = {
      total: analysisResults.length,
      hotRouted: 0,
      solidRouted: 0,
      passSkipped: 0,
      alreadyExported: 0,
      errors: 0
    };

    const sheet = getSheet(SHEETS.MASTER);
    if (!sheet) {
      throw new Error('Master sheet not found');
    }

    for (const result of analysisResults) {
      if (!result.success || !result.analysis) continue;

      const analysis = result.analysis;
      const verdict = analysis.verdict || 'PASS';

      // Build logging context
      const logContext = {
        carHawkId: analysis.id,
        verdict: verdict,
        previousVerdict: null,
        verdictChanged: false,
        smsitSent: false,
        companyhubSynced: false,
        notes: ''
      };

      try {
        // Skip PASS deals - never auto-route
        if (verdict === 'PASS') {
          stats.passSkipped++;
          logContext.notes = 'Verdict is PASS - never auto-route';
          logCrmAutoRoute('SKIP_PASS', logContext);
          continue;
        }

        // Idempotency check with verdict change detection
        const exportStatus = hasBeenExportedToCRM(analysis.id, verdict);

        // Update log context with export status
        logContext.previousVerdict = exportStatus.previousVerdict;
        logContext.verdictChanged = exportStatus.verdictChanged;
        logContext.smsitSent = exportStatus.smsitSent;
        logContext.companyhubSynced = exportStatus.companyhubSynced;

        if (exportStatus.exported) {
          // Determine what action to take
          const needsRetrySms = verdict === 'HOT DEAL' && !exportStatus.smsitSent && analysis.sellerPhone;
          const needsRetryCompanyHub = !exportStatus.companyhubSynced;

          // If verdict upgraded -> re-route fully
          if (exportStatus.verdictChanged) {
            logContext.notes = `Verdict upgraded: ${exportStatus.previousVerdict} → ${verdict}`;
            // Continue to routing below
          }
          // If only SMS retry needed
          else if (needsRetrySms && !needsRetryCompanyHub) {
            const smsResult = retrySmsOnly(analysis);
            logContext.notes = smsResult.success ? 'SMS retry successful' : `SMS retry failed: ${smsResult.error}`;
            logCrmAutoRoute('RETRIED_SMS', logContext);
            if (smsResult.success) stats.hotRouted++;
            else stats.errors++;
            continue;
          }
          // If only CompanyHub retry needed
          else if (needsRetryCompanyHub && !needsRetrySms) {
            const chResult = retryCompanyHubOnly(analysis);
            logContext.notes = chResult.success ? 'CompanyHub retry successful' : `CompanyHub retry failed: ${chResult.error}`;
            logCrmAutoRoute('RETRIED_COMPANYHUB', logContext);
            if (chResult.success) stats.solidRouted++;
            else stats.errors++;
            continue;
          }
          // If both need retry
          else if (needsRetrySms && needsRetryCompanyHub) {
            logContext.notes = 'Retry both SMS and CompanyHub';
            // Continue to full routing below
          }
          // Nothing needs retry - skip
          else {
            stats.alreadyExported++;
            logContext.notes = 'Already fully exported, no retry needed';
            logCrmAutoRoute('SKIP_DUPLICATE', logContext);
            continue;
          }
        }

        // Route based on verdict (new export or re-route on upgrade)
        if (verdict === 'HOT DEAL') {
          const routeResult = autoRouteHotDeal(analysis, exportStatus);
          if (routeResult.success) {
            stats.hotRouted++;
            logContext.notes = 'Routed to CompanyHub + SMS-iT';
            logCrmAutoRoute('ROUTED', logContext);
          } else {
            stats.errors++;
            logContext.notes = `Error: ${routeResult.error}`;
            logCrmAutoRoute('ERROR', logContext);
          }

        } else if (verdict === 'SOLID DEAL') {
          const routeResult = autoRouteSolidDeal(analysis, exportStatus);
          if (routeResult.success) {
            stats.solidRouted++;
            logContext.notes = 'Routed to CompanyHub (nurture queue)';
            logCrmAutoRoute('ROUTED', logContext);
          } else {
            stats.errors++;
            logContext.notes = `Error: ${routeResult.error}`;
            logCrmAutoRoute('ERROR', logContext);
          }
        }

        // Rate limiting between deals
        Utilities.sleep(300);

      } catch (error) {
        stats.errors++;
        logContext.notes = `Exception: ${error.toString()}`;
        logCrmAutoRoute('ERROR', logContext);
      }
    }

    // Log summary to System Health
    logSystem('Auto CRM Routing', `Completed: ${stats.hotRouted} HOT, ${stats.solidRouted} SOLID routed`, stats);

    return {
      skipped: false,
      stats: stats
    };

  } finally {
    lock.releaseLock();
  }
}

/**
 * Auto-route HOT deal: CompanyHub + SMS-iT
 */
function autoRouteHotDeal(analysis, exportStatus) {
  const results = {
    success: true,
    companyhub: null,
    smsit: null,
    error: null
  };

  try {
    // Route to CompanyHub if not already synced
    if (!exportStatus.companyhubSynced && FEATURE_FLAGS.ENABLE_COMPANYHUB_INTEGRATION) {
      const routing = CRM_ROUTING.HOT_DEAL;
      results.companyhub = syncToCompanyHub(analysis, routing);
    }

    // Send SMS if not already sent and has phone
    if (!exportStatus.smsitSent && analysis.sellerPhone && FEATURE_FLAGS.ENABLE_SMS_INTEGRATION) {
      const routing = CRM_ROUTING.HOT_DEAL;
      results.smsit = sendToSMSIT(analysis, routing);
    }

    // Write to local CRM sheet
    writeToLocalCRMSheet(analysis, results);

    return results;

  } catch (error) {
    results.success = false;
    results.error = error.toString();
    return results;
  }
}

/**
 * Auto-route SOLID deal: CompanyHub only (no SMS unless ENABLE_AUTO_SOLID_SMS)
 */
function autoRouteSolidDeal(analysis, exportStatus) {
  const results = {
    success: true,
    companyhub: null,
    smsit: null,
    error: null
  };

  try {
    // Route to CompanyHub if not already synced
    if (!exportStatus.companyhubSynced && FEATURE_FLAGS.ENABLE_COMPANYHUB_INTEGRATION) {
      const routing = CRM_ROUTING.SOLID_DEAL;
      results.companyhub = syncToCompanyHub(analysis, routing);
    }

    // Only send SMS to SOLID deals if explicitly enabled
    if (FEATURE_FLAGS.ENABLE_AUTO_SOLID_SMS &&
        !exportStatus.smsitSent &&
        analysis.sellerPhone &&
        FEATURE_FLAGS.ENABLE_SMS_INTEGRATION) {
      const routing = CRM_ROUTING.SOLID_DEAL;
      results.smsit = sendToSMSIT(analysis, routing);
    }

    // Write to local CRM sheet
    writeToLocalCRMSheet(analysis, results);

    return results;

  } catch (error) {
    results.success = false;
    results.error = error.toString();
    return results;
  }
}

/**
 * Retry SMS only (for HOT deals where CompanyHub already synced)
 */
function retrySmsOnly(analysis) {
  const result = { success: true, error: null };

  try {
    if (!FEATURE_FLAGS.ENABLE_SMS_INTEGRATION) {
      result.success = false;
      result.error = 'SMS integration disabled';
      return result;
    }

    const routing = CRM_ROUTING.HOT_DEAL;
    const smsResult = sendToSMSIT(analysis, routing);

    if (smsResult && smsResult.success) {
      // Update CRM sheet SMS status
      updateCrmSheetSmsStatus(analysis.id, 'Sent');
    } else {
      result.success = false;
      result.error = smsResult?.error || 'SMS send failed';
    }

    return result;

  } catch (error) {
    result.success = false;
    result.error = error.toString();
    return result;
  }
}

/**
 * Retry CompanyHub only (for deals where SMS already sent or not applicable)
 */
function retryCompanyHubOnly(analysis) {
  const result = { success: true, error: null };

  try {
    if (!FEATURE_FLAGS.ENABLE_COMPANYHUB_INTEGRATION) {
      result.success = false;
      result.error = 'CompanyHub integration disabled';
      return result;
    }

    const verdict = analysis.verdict || 'SOLID DEAL';
    const routing = verdict === 'HOT DEAL' ? CRM_ROUTING.HOT_DEAL : CRM_ROUTING.SOLID_DEAL;
    const chResult = syncToCompanyHub(analysis, routing);

    if (chResult && chResult.success) {
      // Update CRM sheet CompanyHub status
      updateCrmSheetCompanyHubStatus(analysis.id, 'Synced');
    } else {
      result.success = false;
      result.error = chResult?.error || 'CompanyHub sync failed';
    }

    return result;

  } catch (error) {
    result.success = false;
    result.error = error.toString();
    return result;
  }
}

/**
 * Update SMS status in CRM sheet for a specific deal
 */
function updateCrmSheetSmsStatus(carHawkId, status) {
  const crmSheet = getSheet(SHEETS.CRM);
  if (!crmSheet) return;

  const data = crmSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === carHawkId) {
      crmSheet.getRange(i + 1, 12).setValue(status); // Column 12 = SMS Status
      crmSheet.getRange(i + 1, 15).setValue(new Date()); // Column 15 = Last Updated
      break;
    }
  }
}

/**
 * Update CompanyHub status in CRM sheet for a specific deal
 */
function updateCrmSheetCompanyHubStatus(carHawkId, status) {
  const crmSheet = getSheet(SHEETS.CRM);
  if (!crmSheet) return;

  const data = crmSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === carHawkId) {
      crmSheet.getRange(i + 1, 13).setValue(status); // Column 13 = CompanyHub Status
      crmSheet.getRange(i + 1, 15).setValue(new Date()); // Column 15 = Last Updated
      break;
    }
  }
}

/**
 * Log auto-routing action to CRM_SYNC_LOG with full decision context
 * @param {string} actionTaken - ROUTED | RETRIED_SMS | RETRIED_COMPANYHUB | SKIP_DUPLICATE | SKIP_PASS | ERROR
 * @param {Object} context - Full routing context
 */
function logCrmAutoRoute(actionTaken, context) {
  const logSheet = getOrCreateSheet(SHEETS.CRM_LOG);

  // Ensure headers exist
  if (logSheet.getLastRow() === 0) {
    logSheet.appendRow([
      'Timestamp',
      'CarHawk ID',
      'Verdict',
      'Previous Verdict',
      'Verdict Changed',
      'SMS Sent',
      'CompanyHub Synced',
      'Action Taken',
      'Notes'
    ]);
  }

  logSheet.appendRow([
    new Date(),
    context.carHawkId || '',
    context.verdict || '',
    context.previousVerdict || '',
    context.verdictChanged ? 'TRUE' : 'FALSE',
    context.smsitSent ? 'TRUE' : 'FALSE',
    context.companyhubSynced ? 'TRUE' : 'FALSE',
    actionTaken,
    context.notes || ''
  ]);
}

/**
 * Check if verdict change is an upgrade (warrants re-routing)
 * Upgrade hierarchy: PASS < SOLID DEAL < HOT DEAL
 */
function isVerdictUpgrade(previousVerdict, currentVerdict) {
  const verdictRank = {
    'PASS': 0,
    'SOLID DEAL': 1,
    'HOT DEAL': 2
  };

  const prevRank = verdictRank[previousVerdict] ?? 0;
  const currRank = verdictRank[currentVerdict] ?? 0;

  return currRank > prevRank;
}
