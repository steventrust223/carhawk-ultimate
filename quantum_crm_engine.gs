// =========================================================
// FILE: quantum-crm-engine.gs - CRM Core Functions
// =========================================================

function initializeCRMSystem(config) {
  // Initialize CRM settings
  setQuantumSetting('TWILIO_ACCOUNT_SID', config.twilioSid || '');
  setQuantumSetting('TWILIO_AUTH_TOKEN', config.twilioToken || '');
  setQuantumSetting('TWILIO_PHONE', config.twilioPhone || '');
  setQuantumSetting('SENDGRID_API_KEY', config.sendgridKey || '');
  setQuantumSetting('SMSIT_API_KEY', config.smsitKey || '');
  setQuantumSetting('SMSIT_WEBHOOK_URL', config.smsitWebhook || '');
  setQuantumSetting('OHMYLEAD_WEBHOOK_URL', config.ohmyleadWebhook || '');
  setQuantumSetting('DEFAULT_FOLLOW_UP_SEQUENCE', 'HOT_LEAD');
  setQuantumSetting('AUTO_FOLLOW_UP', 'true');
  setQuantumSetting('CAMPAIGN_ENABLED', 'true');
  setQuantumSetting('CRM_SYNC_ENABLED', 'true');

  // Initialize knowledge base with common vehicles
  populateKnowledgeBase();

  // Set up CRM triggers
  setupCRMTriggers();
}

// Appointment Management
function scheduleAppointment(dealId, appointmentData) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.APPOINTMENTS.name);
  const appointmentId = generateQuantumId('APT');

  const deal = getDealById(dealId);
  if (!deal) throw new Error('Deal not found');

  const row = [
    appointmentId,
    dealId,
    `${deal.year} ${deal.make} ${deal.model}`,
    deal.sellerName,
    deal.sellerPhone,
    deal.sellerEmail || '',
    appointmentData.scheduledTime,
    appointmentData.location,
    appointmentData.locationType || 'In-Person',
    appointmentData.duration || 30,
    'Scheduled',
    appointmentData.type || 'Viewing',
    appointmentData.notes || '',
    false, // Reminder sent
    new Date(),
    Session.getActiveUser().getEmail(),
    new Date(),
    false, // Confirmed
    '', // Show rate
    '', // Outcome
    '' // Follow-up required
  ];

  sheet.appendRow(row);

  // Update deal stage
  updateDealStage(dealId, 'APPOINTMENT_SET');

  // Schedule reminder
  scheduleAppointmentReminder(appointmentId, appointmentData.scheduledTime);

  // Log activity
  logCRMActivity('APPOINTMENT_SCHEDULED', dealId, `Appointment scheduled for ${appointmentData.scheduledTime}`);

  // Sync with Ohmylead if enabled
  if (getQuantumSetting('CRM_SYNC_ENABLED') === 'true') {
    syncOhmyleadAppointments();
  }

  return appointmentId;
}

// Follow-up Engine
function createFollowUpSequence(dealId, sequenceType = 'HOT_LEAD') {
  const sequence = CRM_CONFIG.FOLLOW_UP_SEQUENCES[sequenceType];
  if (!sequence) throw new Error('Invalid sequence type');

  const campaignId = generateQuantumId('CAMP');
  const sheet = getQuantumSheet(QUANTUM_SHEETS.FOLLOWUPS.name);

  sequence.forEach((step, index) => {
    const followUpId = generateQuantumId('FUP');
    const scheduledTime = new Date();
    scheduledTime.setMinutes(scheduledTime.getMinutes() + step.delay);

    const row = [
      followUpId,
      dealId,
      campaignId,
      sequenceType,
      index + 1,
      scheduledTime,
      step.type,
      step.template,
      'Scheduled',
      '', // Sent time
      '', // Response
      '', // Response time
      false, // Opened
      false, // Clicked
      false, // Replied
      new Date(),
      index === 0 ? 'High' : 'Medium',
      0, // Retry count
      '', // Error message
      index < sequence.length - 1 ? sequence[index + 1].template : 'END'
    ];

    sheet.appendRow(row);
  });

  // Schedule the first follow-up
  scheduleFollowUp(dealId, campaignId);

  // Update deal follow-up status
  updateDealFollowUpStatus(dealId, 'Active');

  return campaignId;
}

// SMS Conversation Logging
function logSMSConversation(dealId, phoneNumber, message, direction, intent = '') {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.SMS.name);
  const conversationId = generateQuantumId('SMS');

  const row = [
    conversationId,
    dealId,
    phoneNumber,
    direction, // 'INBOUND' or 'OUTBOUND'
    message,
    new Date(),
    'Delivered',
    intent || analyzeMessageIntent(message),
    analyzeSentiment(message),
    direction === 'OUTBOUND' ? 'Automated' : 'Manual',
    '', // Campaign ID
    '', // Template used
    '', // Response time
    message.length,
    '', // Media URL
    '', // Error code
    0.01, // Cost estimate
    'SMS-iT', // Default provider
    generateQuantumId('THR'), // Thread ID
    '' // Tags
  ];

  sheet.appendRow(row);

  // Update deal contact count
  incrementContactCount(dealId, 'SMS');

  // Trigger response analysis if inbound
  if (direction === 'INBOUND') {
    analyzeInboundResponse(dealId, message);
  }

  return conversationId;
}

// AI Call Logging
function logAICall(dealId, callData) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CALLS.name);
  const callId = generateQuantumId('CALL');

  const row = [
    callId,
    dealId,
    callData.phoneNumber,
    callData.direction || 'OUTBOUND',
    callData.startTime,
    callData.endTime,
    callData.duration,
    callData.recordingUrl || '',
    callData.transcription || '',
    callData.summary || generateCallSummary(callData.transcription),
    callData.sentiment || analyzeSentiment(callData.transcription),
    callData.intent || analyzeCallIntent(callData.transcription),
    callData.outcome || 'Completed',
    callData.nextAction || '',
    detectAppointmentInCall(callData.transcription),
    detectPriceDiscussion(callData.transcription),
    extractObjections(callData.transcription),
    calculateAICallScore(callData),
    callData.cost || 0.10,
    callData.tags || ''
  ];

  sheet.appendRow(row);

  // Update deal contact count
  incrementContactCount(dealId, 'CALL');

  // Process call insights
  processCallInsights(dealId, callData);

  return callId;
}

// Campaign Management
function launchCampaign(dealIds, campaignType, campaignName) {
  const campaignId = generateQuantumId('CAMP');
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CAMPAIGNS.name);

  dealIds.forEach((dealId, index) => {
    const deal = getDealById(dealId);
    if (!deal) return;

    const sequence = CRM_CONFIG.FOLLOW_UP_SEQUENCES[campaignType];

    sequence.forEach((step, stepIndex) => {
      const touchId = generateQuantumId('TCH');
      const scheduledTime = new Date();
      scheduledTime.setMinutes(scheduledTime.getMinutes() + step.delay + (index * 5)); // Stagger sends

      const template = CRM_CONFIG.SMS_TEMPLATES[step.template];
      const message = fillTemplate(template, deal);

      const row = [
        touchId,
        campaignId,
        dealId,
        campaignType,
        stepIndex + 1,
        step.type,
        step.template,
        step.type === 'EMAIL' ? `Interest in your ${deal.make} ${deal.model}` : '',
        message,
        scheduledTime,
        'Scheduled',
        '', // Sent time
        false, // Delivered
        '', // Response
        '', // Response type
        new Date(),
        campaignName,
        '', // A/B test
        0, // Performance score
        0 // Cost
      ];

      sheet.appendRow(row);
    });
  });

  // Start campaign execution
  executeCampaign(campaignId);

  logQuantum('Campaign Launch', `Campaign ${campaignName} launched for ${dealIds.length} deals`);

  return campaignId;
}

// Closed Deal Tracking
function recordClosedDeal(dealId, saleData) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CLOSED.name);
  const closeId = generateQuantumId('CLS');

  const deal = getDealById(dealId);
  if (!deal) throw new Error('Deal not found');

  // Get original deal data for calculations
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const dealRow = dbSheet.getRange(deal.rowNum, 1, 1, 60).getValues()[0];

  const purchasePrice = saleData.purchasePrice || dealRow[13];
  const profit = saleData.salePrice - purchasePrice - (saleData.totalCosts || 0);
  const roi = ((profit / purchasePrice) * 100).toFixed(2);

  const row = [
    closeId,
    dealId,
    `${deal.year} ${deal.make} ${deal.model}`,
    deal.year,
    deal.make,
    deal.model,
    dealRow[10], // Mileage
    dealRow[19], // Condition
    dealRow[13], // Original asking price
    purchasePrice,
    saleData.salePrice,
    saleData.platform || 'Direct Sale',
    saleData.daysToClose || calculateDaysToClose(dealRow[1]),
    dealRow[32], // Days on market when acquired
    profit,
    parseFloat(roi),
    new Date(),
    saleData.paymentMethod || 'Cash',
    saleData.buyerType || 'Private',
    saleData.marketingCost || 0,
    saleData.repairCost || dealRow[23], // Est. repair cost
    saleData.totalInvestment || (purchasePrice + (saleData.repairCost || 0)),
    profit - (saleData.commission || 0),
    saleData.commission || 0,
    saleData.successFactors || '',
    saleData.lessonsLearned || '',
    saleData.rating || 5,
    saleData.tags || ''
  ];

  sheet.appendRow(row);

  // Update deal stage
  updateDealStage(dealId, 'CLOSED_WON');

  // Update post-sale tracker
  updatePostSaleTracker(dealId, closeId, saleData);

  // Log activity
  logCRMActivity('DEAL_CLOSED', dealId, `Deal closed for $${saleData.salePrice} - Profit: $${profit}`);

  return closeId;
}

function calculateDaysToClose(importDate) {
  const imported = new Date(importDate);
  const closed = new Date();
  return Math.floor((closed - imported) / (1000 * 60 * 60 * 24));
}

// Leads Tracker Management
function addToLeadsTracker(dealId, parsed, metrics) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.LEADS.name);
  const leadId = generateQuantumId('LEAD');

  const row = [
    leadId,
    dealId,
    new Date(),
    'New',
    metrics.priority,
    'IMPORTED',
    `${parsed.year} ${parsed.make} ${parsed.model}`,
    parsed.price,
    metrics.marketValue - parsed.price - metrics.estimatedRepairCost,
    metrics.roi,
    parsed.location,
    metrics.distance,
    parsed.sellerName,
    parsed.sellerPhone,
    parsed.sellerEmail,
    '', // Best contact time
    0, // Contact attempts
    '', // Last contact
    'Initial Contact', // Next action
    new Date(), // Action date
    0, // Response rate
    '', // Interest level
    '', // Negotiation notes
    '', // Final offer
    0, // Close probability
    '', // Assigned to
    generateLeadTags(parsed, metrics),
    true, // Follow-up required
    false, // SMS sent
    false // Email sent
  ];

  sheet.appendRow(row);

  return leadId;
}

function generateLeadTags(parsed, metrics) {
  const tags = [];

  if (metrics.priority === 'High') tags.push('high-priority');
  if (metrics.roi > 50) tags.push('high-roi');
  if (metrics.distance < 25) tags.push('local');
  if (parsed.hotSeller) tags.push('hot-seller');
  if (parsed.platform) tags.push(parsed.platform.toLowerCase());

  return tags.join(',');
}
