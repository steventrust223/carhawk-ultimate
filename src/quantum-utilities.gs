// FILE: quantum-utilities.gs - Helper Functions
// =========================================================

function getQuantumSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

function getQuantumSetting(key) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.SETTINGS.name);
  if (!sheet) return null;
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

function setQuantumSetting(key, value) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.SETTINGS.name);
  if (!sheet) {
    Logger.log('Settings sheet not found');
    return;
  }

  const lastRow = sheet.getLastRow();

  // If only headers exist (row 1), append new row directly
  if (lastRow <= 1) {
    sheet.appendRow([key, value, new Date(), '', 'System', 'String', '', value, false, '', false]);
    return;
  }

  const data = sheet.getDataRange().getValues();

  // Search for existing key
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 3).setValue(new Date());
      return;
    }
  }

  // Add new setting
  sheet.appendRow([key, value, new Date(), '', 'System', 'String', '', value, false, '', false]);
}

function logQuantum(action, details) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.LOGS.name);
  if (!sheet) {
    Logger.log(`Log: ${action} - ${details}`);
    return;
  }

  sheet.appendRow([
    new Date(),
    'INFO',
    action,
    'SYSTEM',
    details,
    Session.getActiveUser().getEmail(),
    '', // Deal ID
    '', // Duration
    true, // Success
    '', // Error
    '' // Stack trace
  ]);
}

function logCRMActivity(action, dealId, details) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.LOGS.name);
  if (!sheet) {
    Logger.log(`CRM Log: ${action} - Deal ${dealId} - ${details}`);
    return;
  }

  sheet.appendRow([
    new Date(),
    'CRM',
    action,
    'INFO',
    details,
    Session.getActiveUser().getEmail(),
    dealId,
    '', // Duration
    true, // Success
    '', // Error
    '' // Stack trace
  ]);
}

function generateQuantumId(prefix) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function standardizeMake(make) {
  const standardMap = {
    'Chevy': 'Chevrolet',
    'VW': 'Volkswagen'
  };
  
  return standardMap[make] || make;
}

function detectPlatform(url) {
  if (!url) return 'Unknown';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('facebook.com')) return 'Facebook';
  if (urlLower.includes('craigslist.org')) return 'Craigslist';
  if (urlLower.includes('offerup.com')) return 'OfferUp';
  if (urlLower.includes('ebay.com')) return 'eBay';
  
  return 'Other';
}

function detectHotSeller(data) {
  // Multiple signals for hot seller
  const signals = [];
  
  // Quick listing
  if (data.postedDate) {
    const posted = new Date(data.postedDate);
    const hoursSincePost = (new Date() - posted) / (1000 * 60 * 60);
    if (hoursSincePost < 24) signals.push('new');
  }
  
  // Urgency keywords
  const urgencyWords = ['must go', 'moving', 'asap', 'today', 'quick sale', 'obo', 'need gone'];
  const description = (data.rawTitle + ' ' + data.rawDescription).toLowerCase();
  
  for (const word of urgencyWords) {
    if (description.includes(word)) {
      signals.push('urgent');
      break;
    }
  }
  
  return signals.length >= 1;
}

function detectMultipleVehicles(description) {
  const multipleIndicators = [
    'other vehicles',
    'also have',
    'check my other',
    'more cars',
    'inventory',
    'dealer',
    'lot'
  ];
  
  const lowerDesc = description.toLowerCase();
  
  for (const indicator of multipleIndicators) {
    if (lowerDesc.includes(indicator)) {
      return true;
    }
  }
  
  return false;
}

function formatTime(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, h:mm a');
}

function analyzeInboundResponse(dealId, message) {
  const intent = analyzeMessageIntent(message);
  const sentiment = analyzeSentiment(message);
  
  // Update deal based on response
  if (intent === 'SOLD') {
    updateDealStage(dealId, 'LOST');
  } else if (intent === 'AVAILABLE') {
    updateDealStage(dealId, 'RESPONDED');
  } else if (intent === 'SCHEDULING') {
    updateDealStage(dealId, 'SCHEDULING');
  }
  
  // Update response rate
  const deal = getDealById(dealId);
  if (deal) {
    const sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
    sheet.getRange(deal.rowNum, 55).setValue(100); // Response rate = 100%
  }
}

function processCallInsights(dealId, callData) {
  if (detectAppointmentInCall(callData.transcription)) {
    updateDealStage(dealId, 'APPOINTMENT_SET');
  }
  
  const priceDiscussion = detectPriceDiscussion(callData.transcription);
  if (priceDiscussion.discussed && priceDiscussion.pricesMentioned) {
    // Log price discussion in notes
    const deal = getDealById(dealId);
    if (deal) {
      const sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
      const currentNotes = sheet.getRange(deal.rowNum, 50).getValue();
      sheet.getRange(deal.rowNum, 50).setValue(
        currentNotes + '\nPrice discussed in call: ' + priceDiscussion.pricesMentioned
      );
    }
  }
}

function scheduleAppointmentReminder(appointmentId, scheduledTime) {
  // This would create a time-based trigger for the specific appointment
  // For now, we rely on the hourly check
  logQuantum('Appointment Reminder', `Scheduled for appointment ${appointmentId}`);
}

function markAppointmentSynced(appointmentId) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.APPOINTMENTS.name);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === appointmentId) {
      sheet.getRange(i + 1, 18).setValue(true); // Mark as synced
      break;
    }
  }
}

function sendReminderSMS(phoneNumber, message) {
  sendSMS(phoneNumber, message);
}

function sendCampaignSMS(phoneNumber, message) {
  sendViaSMSIT(phoneNumber, message, '');
}

function sendCampaignEmail(email, subject, message) {
  sendEmail(email, subject, message);
}

function getEmailTemplate(templateName, deal) {
  // Define email templates
  const templates = {
    follow_up_3: `
      <p>Hi ${deal.sellerName || 'there'},</p>
      <p>I wanted to follow up one more time about your ${deal.year} ${deal.make} ${deal.model}.</p>
      <p>If it's still available, I'm ready to make a cash offer. If you've already sold it, no worries - just let me know!</p>
      <p>Best regards,<br>${getQuantumSetting('YOUR_NAME')}</p>
    `,
    follow_up_2: `
      <p>Hi ${deal.sellerName || 'there'},</p>
      <p>Just checking in about your ${deal.year} ${deal.make} ${deal.model}. Market conditions are favorable right now, and I can offer a competitive cash price.</p>
      <p>Let me know if you'd like to discuss!</p>
      <p>Thanks,<br>${getQuantumSetting('YOUR_NAME')}</p>
    `,
    initial_cold: `
      <p>Hi,</p>
      <p>I saw your ${deal.year} ${deal.make} ${deal.model} listing. I'm actively looking for vehicles like yours and can offer cash.</p>
      <p>Is it still available? I'd love to learn more about it.</p>
      <p>Best,<br>${getQuantumSetting('YOUR_NAME')}</p>
    `
  };
  
  return templates[templateName] || templates.follow_up_2;
}

function scheduleFollowUp(dealId, campaignId) {
  // This would be called to schedule the next follow-up in a sequence
  logQuantum('Follow-up Scheduled', `Deal ${dealId}, Campaign ${campaignId}`);
}

function executeCampaign(campaignId) {
  // This would start processing a campaign
  logQuantum('Campaign Execution', `Started campaign ${campaignId}`);
}

function updatePostSaleTracker(dealId, closeId, saleData) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.POSTSALE.name);
  const saleId = generateQuantumId('SALE');
  
  const deal = getDealById(dealId);
  const vehicle = `${deal.year} ${deal.make} ${deal.model}`;
  
  const row = [
    saleId,
    dealId,
    vehicle,
    new Date(),
    saleData.daysToSell || 0,
    saleData.buyerName || '',
    saleData.buyerType || 'Private',
    saleData.platform || 'Direct Sale',
    saleData.listedPrice || 0,
    saleData.salePrice,
    saleData.negotiationPercent || 0,
    saleData.purchasePrice,
    saleData.totalInvestment || 0,
    saleData.grossProfit || 0,
    saleData.netProfit || 0,
    saleData.actualROI || 0,
    saleData.projectedROI || 0,
    saleData.paymentMethod || 'Cash',
    'Completed',
    saleData.titleTransfer || 'Pending',
    saleData.deliveryMethod || 'Pickup',
    saleData.satisfaction || 5,
    saleData.referral || false,
    saleData.lessons || '',
    saleData.successes || '',
    saleData.failures || '',
    saleData.strategy || '',
    saleData.marketConditions || '',
    saleData.seasonal || '',
    saleData.repeatBuyer || false,
    saleData.referralSource || '',
    '', // Follow-up date
    '', // Testimonial
    false, // Case study
    'A' // Performance grade
  ];
  
  sheet.appendRow(row);
}

function updateExportRecordIds(leadIds) {
  // Update CRM export sheet with SMS-iT lead IDs
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CRM.name);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    sheet.getRange(lastRow, 18).setValue(leadIds.join(','));
    sheet.getRange(lastRow, 19).setValue('Synced');
  }
}

function logCRMExport(platform, count, fileId) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CRM.name);
  const exportId = generateQuantumId('EXP');
  
  const row = [
    exportId,
    new Date(),
    platform,
    '', // Deal IDs will be filled later
    count,
    'Manual Export',
    'All Fields',
    'Recommended Deals',
    0, // Total value
    0, // Avg deal value
    0, // Hot leads count
    count, // Contact info complete
    count, // SMS ready
    count, // Email ready
    'Manual Export',
    '',
    '',
    fileId || '',
    'Completed',
    '',
    new Date(),
    '',
    'false',
    'false',
    0,
    0
  ];
  
  sheet.appendRow(row);
}

function launchCampaignUI() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.prompt(
    'Launch Campaign',
    'Enter campaign name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const campaignName = response.getResponseText();
    
    // Get hot deals
    const deals = getTopDeals(50);
    const hotDeals = deals.filter(d => d.verdict.includes('🔥') || d.verdict.includes('✅'));
    
    if (hotDeals.length === 0) {
      ui.alert('No hot deals found for campaign.');
      return;
    }
    
    const dealIds = hotDeals.map(d => d.dealId);
    
    const campaignId = launchCampaign(dealIds.slice(0, 10), 'HOT_LEAD', campaignName);
    
    ui.alert(
      'Campaign Launched!',
      `Campaign "${campaignName}" launched with ${Math.min(dealIds.length, 10)} deals.\n\nCampaign ID: ${campaignId}`,
      ui.ButtonSet.OK
    );
  }
}

// =========================================================
