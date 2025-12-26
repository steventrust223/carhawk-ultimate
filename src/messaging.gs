// ============================================================================
// CARHAWK ULTIMATE — MESSAGING.GS
// Message Templates and Personalization Engine
// 6+ Variants by Strategy, Temperature, and Context
// ============================================================================

/**
 * Generate personalized seller message based on deal analysis
 */
function generateSellerMessage(analysis, variant = null) {
  // Determine message variant if not specified
  if (!variant) {
    variant = selectMessageVariant(analysis);
  }

  // Get template for this variant
  const template = MESSAGE_TEMPLATES[variant];
  if (!template) {
    logSystem('Messaging', `Unknown variant: ${variant}, using default`);
    return generateSellerMessage(analysis, 'QUICK_FLIP_HOT');
  }

  // Build template variables
  const vars = buildTemplateVars(analysis);

  // Fill template
  return fillTemplate(template, vars);
}

/**
 * Select appropriate message variant based on analysis
 */
function selectMessageVariant(analysis) {
  const strategy = analysis.strategy || 'QUICK_FLIP';
  const temperature = analysis.temperature || 'Cold';
  const daysListed = parseInt(analysis.daysListed) || 21;

  // Price drop follow-up (high priority)
  if (daysListed > 21) {
    return 'PRICE_DROP_FOLLOWUP';
  }

  // Strategy + Temperature combinations
  if (strategy === 'QUICK_FLIP') {
    return temperature === 'Hot' ? 'QUICK_FLIP_HOT' : 'QUICK_FLIP_WARM';
  }

  if (strategy === 'REPAIR_RESELL') {
    return 'REPAIR_RESELL_EXPLAIN';
  }

  if (strategy === 'PART_OUT') {
    return 'PART_OUT_ASIS';
  }

  if (strategy === 'HOLD_SEASONAL') {
    return 'HOLD_SEASONAL_PATIENT';
  }

  // Default
  return temperature === 'Hot' ? 'QUICK_FLIP_HOT' : 'QUICK_FLIP_WARM';
}

/**
 * Build template variables from analysis
 */
function buildTemplateVars(analysis) {
  const firstName = extractFirstName(analysis.sellerName) || 'there';
  const vehicle = analysis.vehicle || `${analysis.year} ${analysis.make} ${analysis.model}`.trim();

  // Use moderate offer as default
  const offerAmount = analysis.openingOfferModerate || analysis.mao || 0;

  return {
    firstName: firstName,
    vehicle: vehicle,
    year: analysis.year || '',
    make: analysis.make || '',
    model: analysis.model || '',
    offerAmount: formatCurrency(offerAmount),
    offerAmountRaw: offerAmount,
    mao: formatCurrency(analysis.mao || 0),
    daysListed: analysis.daysListed || 0,
    condition: analysis.condition || 'unknown condition',
    strategy: analysis.strategyLabel || analysis.strategy || 'Quick Flip',
    temperature: analysis.temperature || 'warm',
    platform: analysis.platform || 'your listing',
    distance: Math.round(analysis.distance || 0),
    repairCost: formatCurrency(analysis.repairCost || 0)
  };
}

/**
 * Fill template with variables
 */
function fillTemplate(template, vars) {
  let message = template;

  for (const [key, value] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    message = message.replace(regex, value);
  }

  return message.trim();
}

// ============================================================================
// MESSAGE TEMPLATES (6+ Required Variants)
// Each includes: vehicle summary, offer, credibility, soft question, opt-out
// ============================================================================

const MESSAGE_TEMPLATES = {

  // 1. Quick Flip – Hot – Direct and Urgent
  'QUICK_FLIP_HOT': `Hi {firstName}! 👋

I saw your {vehicle} listing and I'm very interested. I'm a local cash buyer who can close quickly and handle all the paperwork.

I can offer {offerAmount} and pick up as early as this week.

Would that work for you? Just reply YES if you're interested, or let me know if you have any questions.

Thanks!
(Reply STOP to opt out)`,

  // 2. Quick Flip – Warm – Friendly and Conversational
  'QUICK_FLIP_WARM': `Hey {firstName}!

I came across your {vehicle} and it caught my eye. I'm a cash buyer in the area and I'm looking for exactly this type of vehicle.

I'd like to offer {offerAmount} for a quick, hassle-free sale. I handle all the paperwork and can pick up at your convenience.

Is this something you'd consider? No pressure either way!

Best,
(Reply STOP to opt out)`,

  // 3. Repair & Resell – Explain Repairs
  'REPAIR_RESELL_EXPLAIN': `Hi {firstName},

I'm interested in your {vehicle}. I specialize in buying vehicles that need some work and bringing them back to great condition.

Based on what I can see, I estimate there's around {repairCost} in repairs needed. With that in mind, I can offer {offerAmount} as-is.

The nice thing is you wouldn't need to deal with any repairs or inspections – I take care of all that.

Would you be open to discussing this? Let me know your thoughts.

Thanks!
(Reply STOP to opt out)`,

  // 4. Part-Out – As-Is / Project Tone
  'PART_OUT_ASIS': `Hi {firstName},

I saw your {vehicle} listing. I'm a buyer who works with vehicles in all conditions, including project cars and parts vehicles.

I can offer {offerAmount} as-is, no questions asked. I'll handle towing and all paperwork.

Would that work for you? It's a straightforward process and I can pick up whenever is convenient.

Let me know!
(Reply STOP to opt out)`,

  // 5. Hold/Seasonal – Patient, Non-Rushed
  'HOLD_SEASONAL_PATIENT': `Hi {firstName},

I noticed your {vehicle} and wanted to reach out. I'm a local buyer and this is exactly the type of vehicle I've been looking for.

I'm in no rush and can work with your timeline. When you're ready to sell, I can offer {offerAmount} cash with a smooth, easy process.

No pressure at all – just wanted to let you know I'm interested whenever you're ready.

Feel free to reach out anytime!
(Reply STOP to opt out)`,

  // 6. Price Drop Follow-up (DaysListed > 21)
  'PRICE_DROP_FOLLOWUP': `Hi {firstName},

I noticed your {vehicle} has been listed for about {daysListed} days now. I'm still interested and wanted to check in.

I can offer {offerAmount} cash and close quickly. If the timing is right, I'm ready to move forward this week.

Would a quick sale be helpful at this point? Just let me know.

Thanks for your time!
(Reply STOP to opt out)`,

  // 7. High Value / Premium Tone
  'PREMIUM_BUYER': `Hello {firstName},

I came across your {vehicle} and I'm impressed with what I see. As a serious buyer, I'm prepared to offer {offerAmount} for a straightforward transaction.

I handle all documentation and can arrange pickup at your convenience. My goal is to make this as easy as possible for you.

Would you be available for a quick conversation about next steps?

Best regards,
(Reply STOP to opt out)`,

  // 8. Local Emphasis
  'LOCAL_BUYER': `Hey {firstName}!

I'm a local buyer (about {distance} miles from you) and I'm interested in your {vehicle}.

I can offer {offerAmount} cash and pick up in person – no shipping headaches or out-of-state complications.

Would you be interested in a quick local sale? Let me know!

Thanks,
(Reply STOP to opt out)`,

  // 9. Weekend Pickup
  'WEEKEND_READY': `Hi {firstName}!

I saw your {vehicle} and I'm interested! I'm available this weekend if you'd like to make a quick sale.

I can offer {offerAmount} cash and handle all the paperwork on the spot.

Does Saturday or Sunday work for you?

Let me know!
(Reply STOP to opt out)`,

  // 10. Second Attempt / Follow-up
  'FOLLOWUP_SECOND': `Hi {firstName},

I reached out a few days ago about your {vehicle} – just wanted to follow up in case my message got lost.

My offer of {offerAmount} still stands. I can be flexible on timing and make the process easy.

Any interest? No worries if not!

Thanks,
(Reply STOP to opt out)`

};

// ============================================================================
// GET ALL AVAILABLE VARIANTS
// ============================================================================

function getAvailableMessageVariants() {
  return Object.keys(MESSAGE_TEMPLATES);
}

// ============================================================================
// PREVIEW MESSAGE (for UI)
// ============================================================================

function previewMessage(analysis, variant = null) {
  const message = generateSellerMessage(analysis, variant);
  const selectedVariant = variant || selectMessageVariant(analysis);

  return {
    variant: selectedVariant,
    message: message,
    characterCount: message.length,
    smsSegments: Math.ceil(message.length / 160)
  };
}

// ============================================================================
// BATCH MESSAGE GENERATION
// ============================================================================

function generateMessagesForDeals(deals) {
  return deals.map(deal => ({
    id: deal.id,
    vehicle: deal.vehicle,
    message: generateSellerMessage(deal),
    variant: selectMessageVariant(deal)
  }));
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

const EMAIL_TEMPLATES = {

  'INITIAL_CONTACT': {
    subject: 'Interested in your {vehicle}',
    body: `Hi {firstName},

I came across your {vehicle} for sale and I'm interested in learning more.

I'm a cash buyer and can offer a quick, hassle-free purchase process. Based on the listing, I'd like to offer {offerAmount}.

If you're interested, I'd love to discuss further. You can reply to this email or call/text me directly.

Best regards,
[Your Name]
[Your Phone]`
  },

  'FOLLOWUP': {
    subject: 'Following up on your {vehicle}',
    body: `Hi {firstName},

I wanted to follow up on my interest in your {vehicle}. My offer of {offerAmount} still stands.

I'm flexible on timing and can work around your schedule. Let me know if you'd like to move forward or if you have any questions.

Thanks,
[Your Name]`
  }

};

/**
 * Generate email from template
 */
function generateEmail(analysis, templateName = 'INITIAL_CONTACT') {
  const template = EMAIL_TEMPLATES[templateName];
  if (!template) return null;

  const vars = buildTemplateVars(analysis);

  return {
    subject: fillTemplate(template.subject, vars),
    body: fillTemplate(template.body, vars)
  };
}

// ============================================================================
// MESSAGE PERSONALIZATION HELPERS
// ============================================================================

/**
 * Add urgency indicators based on context
 */
function addUrgencyModifiers(message, analysis) {
  const modifiers = [];

  if (analysis.daysListed > 30) {
    modifiers.push('I know it\'s been listed a while – happy to close quickly!');
  }

  if (analysis.temperature === 'Hot') {
    modifiers.push('I\'m ready to move fast on this one.');
  }

  if (modifiers.length > 0) {
    return message + '\n\n' + modifiers.join(' ');
  }

  return message;
}

/**
 * Validate message length for SMS
 */
function validateMessageForSMS(message) {
  const MAX_SMS_LENGTH = 1600; // 10 segments max
  const OPTIMAL_LENGTH = 320;  // 2 segments

  return {
    valid: message.length <= MAX_SMS_LENGTH,
    length: message.length,
    segments: Math.ceil(message.length / 160),
    optimal: message.length <= OPTIMAL_LENGTH,
    warning: message.length > OPTIMAL_LENGTH ?
      `Message is ${Math.ceil(message.length / 160)} SMS segments. Consider shortening.` : null
  };
}
