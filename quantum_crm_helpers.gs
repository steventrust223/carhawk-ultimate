// =========================================================
// FILE: quantum-crm-helpers.gs - CRM Helper Functions
// =========================================================

function analyzeMessageIntent(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('sold') || lowerMessage.includes('no longer available')) {
    return 'SOLD';
  } else if (lowerMessage.includes('yes') || lowerMessage.includes('still available')) {
    return 'AVAILABLE';
  } else if (lowerMessage.includes('when') || lowerMessage.includes('time') || lowerMessage.includes('meet')) {
    return 'SCHEDULING';
  } else if (lowerMessage.includes('price') || lowerMessage.includes('negotiable') || lowerMessage.includes('offer')) {
    return 'NEGOTIATION';
  } else if (lowerMessage.includes('stop') || lowerMessage.includes('remove') || lowerMessage.includes('unsubscribe')) {
    return 'OPT_OUT';
  }

  return 'GENERAL';
}

function analyzeSentiment(text) {
  const positiveWords = ['great', 'excellent', 'perfect', 'yes', 'interested', 'available', 'sure'];
  const negativeWords = ['sold', 'no', 'not', 'stop', 'dont', 'remove', 'spam'];

  const lowerText = text.toLowerCase();
  let score = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) score += 1;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) score -= 1;
  });

  if (score > 0) return 'POSITIVE';
  if (score < 0) return 'NEGATIVE';
  return 'NEUTRAL';
}

function generateCallSummary(transcription) {
  if (!transcription) return '';

  const sentences = transcription.split(/[.!?]+/);
  const keywords = ['price', 'available', 'meet', 'condition', 'sold', 'interested'];

  const relevantSentences = sentences.filter(sentence => {
    return keywords.some(keyword => sentence.toLowerCase().includes(keyword));
  });

  return relevantSentences.slice(0, 3).join('. ');
}

function analyzeCallIntent(transcription) {
  const lowerTranscript = transcription.toLowerCase();

  if (lowerTranscript.includes('appointment') || lowerTranscript.includes('meet') || lowerTranscript.includes('see the car')) {
    return 'APPOINTMENT_REQUEST';
  } else if (lowerTranscript.includes('price') || lowerTranscript.includes('negotiable')) {
    return 'PRICE_INQUIRY';
  } else if (lowerTranscript.includes('condition') || lowerTranscript.includes('problems')) {
    return 'CONDITION_INQUIRY';
  }

  return 'GENERAL_INQUIRY';
}

function detectAppointmentInCall(transcription) {
  const appointmentKeywords = ['meet', 'appointment', 'see the car', 'come by', 'available to show'];
  const lowerTranscript = transcription.toLowerCase();

  return appointmentKeywords.some(keyword => lowerTranscript.includes(keyword));
}

function detectPriceDiscussion(transcription) {
  const priceKeywords = ['price', 'cost', 'asking', 'offer', 'negotiable', 'cash', 'payment'];
  const lowerTranscript = transcription.toLowerCase();

  const priceMatches = priceKeywords.filter(keyword => lowerTranscript.includes(keyword));

  // Extract price if mentioned
  const priceMatch = transcription.match(/\$?(\d{1,3},?\d{3}|\d{4,5})/);

  return {
    discussed: priceMatches.length > 0,
    keywords: priceMatches,
    pricesMentioned: priceMatch ? priceMatch[0] : null
  };
}

function extractObjections(transcription) {
  const objectionPatterns = [
    {pattern: /too high|too much|expensive/i, type: 'PRICE'},
    {pattern: /need to think|think about it/i, type: 'CONSIDERATION'},
    {pattern: /check with|ask my/i, type: 'DECISION_MAKER'},
    {pattern: /already have|don't need/i, type: 'NO_NEED'},
    {pattern: /too far|distance/i, type: 'LOCATION'}
  ];

  const objections = [];

  objectionPatterns.forEach(({pattern, type}) => {
    if (pattern.test(transcription)) {
      objections.push(type);
    }
  });

  return objections.join(', ');
}

function calculateAICallScore(callData) {
  let score = 50; // Base score

  // Positive indicators
  if (callData.outcome === 'Appointment Set') score += 30;
  if (callData.sentiment === 'POSITIVE') score += 20;
  if (callData.duration > 180) score += 10; // Longer than 3 minutes

  // Negative indicators
  if (callData.sentiment === 'NEGATIVE') score -= 20;
  if (callData.outcome === 'Not Interested') score -= 30;
  if (callData.duration < 30) score -= 10; // Very short call

  return Math.max(0, Math.min(100, score));
}

function fillTemplate(template, deal) {
  return template
    .replace(/{name}/g, deal.sellerName || 'there')
    .replace(/{year}/g, deal.year)
    .replace(/{make}/g, deal.make)
    .replace(/{model}/g, deal.model)
    .replace(/{price}/g, deal.price.toLocaleString())
    .replace(/{vehicle}/g, `${deal.year} ${deal.make} ${deal.model}`);
}

function incrementContactCount(dealId, type) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dealId) {
      const row = i + 1;

      // Update contact count
      const currentCount = sheet.getRange(row, 52).getValue() || 0;
      sheet.getRange(row, 52).setValue(currentCount + 1);

      // Update last contact
      sheet.getRange(row, 53).setValue(new Date());

      // Update specific type count
      if (type === 'SMS') {
        const smsCount = sheet.getRange(row, 56).getValue() || 0;
        sheet.getRange(row, 56).setValue(smsCount + 1);
      } else if (type === 'CALL') {
        const callCount = sheet.getRange(row, 57).getValue() || 0;
        sheet.getRange(row, 57).setValue(callCount + 1);
      } else if (type === 'EMAIL') {
        const emailCount = sheet.getRange(row, 58).getValue() || 0;
        sheet.getRange(row, 58).setValue(emailCount + 1);
      }

      break;
    }
  }
}

function updateDealStage(dealId, newStage) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dealId) {
      sheet.getRange(i + 1, 51).setValue(newStage);
      sheet.getRange(i + 1, 49).setValue(new Date()); // Last updated

      logCRMActivity('STAGE_CHANGE', dealId, `Stage changed to ${newStage}`);
      break;
    }
  }
}

function updateDealFollowUpStatus(dealId, status) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dealId) {
      sheet.getRange(i + 1, 60).setValue(status);
      break;
    }
  }
}

function getDealById(dealId) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === dealId) {
      return {
        dealId: data[i][0],
        year: data[i][5],
        make: data[i][6],
        model: data[i][7],
        price: data[i][13],
        sellerName: data[i][33],
        sellerPhone: data[i][34],
        sellerEmail: data[i][35],
        stage: data[i][50],
        rowNum: i + 1
      };
    }
  }

  return null;
}
