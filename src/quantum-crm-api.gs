// FILE: quantum-crm-api.gs - External API Functions
// =========================================================

function sendFollowUpSMS(dealId, templateName) {
  const deal = getDealById(dealId);
  if (!deal || !deal.sellerPhone) return;
  
  const template = CRM_CONFIG.SMS_TEMPLATES[templateName];
  const message = fillTemplate(template, deal);
  
  // Use SMS-iT if configured, otherwise fallback to Twilio
  if (getQuantumSetting('SMSIT_API_KEY')) {
    sendViaSMSIT(deal.sellerPhone, message, dealId);
  } else {
    sendSMS(deal.sellerPhone, message);
  }
  
  logSMSConversation(dealId, deal.sellerPhone, message, 'OUTBOUND', 'FOLLOW_UP');
}

function sendFollowUpEmail(dealId, templateName) {
  const deal = getDealById(dealId);
  if (!deal || !deal.sellerEmail) return;
  
  // Email sending implementation
  const subject = `Regarding your ${deal.year} ${deal.make} ${deal.model}`;
  const body = getEmailTemplate(templateName, deal);
  
  sendEmail(deal.sellerEmail, subject, body);
  incrementContactCount(dealId, 'EMAIL');
}

function sendViaSMSIT(phoneNumber, message, dealId) {
  const apiKey = getQuantumSetting('SMSIT_API_KEY');
  const webhookUrl = getQuantumSetting('SMSIT_WEBHOOK_URL');
  
  if (webhookUrl) {
    // Send via webhook
    const payload = {
      phone: formatPhoneForSMSIT(phoneNumber),
      message: message,
      dealId: dealId,
      source: 'CarHawk Ultimate'
    };
    
    UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });
  } else if (apiKey) {
    // Direct API call to SMS-iT
    // Implementation depends on SMS-iT API structure
    throw new Error('SMS-iT direct API not implemented');
  } else {
    // Fallback to Twilio
    sendSMS(phoneNumber, message);
  }
}

function sendSMS(phoneNumber, message) {
  const twilioSid = getQuantumSetting('TWILIO_ACCOUNT_SID');
  const twilioToken = getQuantumSetting('TWILIO_AUTH_TOKEN');
  const twilioPhone = getQuantumSetting('TWILIO_PHONE');
  
  if (!twilioSid || !twilioToken || !twilioPhone) {
    throw new Error('SMS credentials not configured');
  }
  
  const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
  
  const payload = {
    'To': phoneNumber,
    'From': twilioPhone,
    'Body': message
  };
  
  const options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Basic ' + Utilities.base64Encode(twilioSid + ':' + twilioToken)
    },
    'payload': payload
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    return JSON.parse(response.getContentText());
  } catch (error) {
    logQuantum('SMS Error', error.toString());
    throw error;
  }
}

function sendEmail(to, subject, body) {
  const sendgridKey = getQuantumSetting('SENDGRID_API_KEY');
  
  if (sendgridKey) {
    // SendGrid implementation
    const url = 'https://api.sendgrid.com/v3/mail/send';
    
    const payload = {
      'personalizations': [{
        'to': [{'email': to}]
      }],
      'from': {
        'email': getQuantumSetting('YOUR_EMAIL') || Session.getActiveUser().getEmail(),
        'name': getQuantumSetting('YOUR_NAME') || 'CarHawk Ultimate'
      },
      'subject': subject,
      'content': [{
        'type': 'text/html',
        'value': body
      }]
    };
    
    const options = {
      'method': 'post',
      'headers': {
        'Authorization': 'Bearer ' + sendgridKey,
        'Content-Type': 'application/json'
      },
      'payload': JSON.stringify(payload)
    };
    
    try {
      UrlFetchApp.fetch(url, options);
    } catch (error) {
      logQuantum('Email Error', error.toString());
      
      // Fallback to MailApp
      MailApp.sendEmail(to, subject, body);
    }
  } else {
    // Use built-in MailApp
    MailApp.sendEmail(to, subject, body);
  }
}

// =========================================================
