// ============================================================================
// CARHAWK ULTIMATE — CONFIG.GS
// Production Configuration (Locked Math + Thresholds)
// Version: 3.0.0 | $90M-Grade Production System
// ============================================================================

const CARHAWK_VERSION = '3.0.0';
const CARHAWK_NAME = 'CarHawk Ultimate';

// ============================================================================
// ORIGIN / LOCATION SETTINGS
// ============================================================================
const ORIGIN_ZIP = '63136'; // St. Louis County, MO (changeable via Config sheet)
const DISTANCE_CACHE_TTL_SECONDS = 86400; // 24 hours
const MAX_DISTANCE_FALLBACK = 999; // When API fails

// ============================================================================
// SHEET NAMES
// ============================================================================
const SHEETS = {
  MASTER: 'Master Database',
  LEADS: 'Leads Tracker',
  CALCULATOR: 'Flip ROI Calculator',
  VERDICT: 'Verdict',
  SCORING: 'Lead Scoring & Risk Assessment',
  CRM: 'CRM Integration',
  CRM_SYNC_LOG: 'CRM Sync Log',
  PARTS: 'Parts Needed',
  DASHBOARD: 'Dashboard & Analytics',
  REPORTING: 'Reporting & Charts',
  STAGING_FB: 'Staging - Facebook',
  STAGING_CL: 'Staging - Craigslist',
  STAGING_OU: 'Staging - OfferUp',
  STAGING_EBAY: 'Staging - eBay',
  KNOWLEDGE: 'Vehicle Knowledge Base',
  LOGS: 'System Logs',
  SYSTEM_HEALTH: 'System Health',
  CONFIG: 'Config'
};

// ============================================================================
// PLATFORM WEIGHTS (demand/velocity influence)
// ============================================================================
const PLATFORM_WEIGHTS = {
  'facebook': 1.00,
  'Facebook': 1.00,
  'offerup': 0.90,
  'OfferUp': 0.90,
  'craigslist': 0.80,
  'Craigslist': 0.80,
  'ebay': 0.70,
  'eBay': 0.70,
  'unknown': 0.75,
  'Unknown': 0.75
};

// ============================================================================
// MAKE DESIRABILITY PREMIUMS (market score)
// ============================================================================
const MAKE_PREMIUM = {
  'Toyota': 1.10,
  'Honda': 1.08,
  'Lexus': 1.12,
  'Acura': 1.06,
  'Subaru': 1.05,
  'Mazda': 1.03,
  'Ford': 1.00,
  'Chevrolet': 0.98,
  'Chevy': 0.98,
  'GMC': 0.99,
  'Dodge': 0.97,
  'Ram': 0.98,
  'Nissan': 0.97,
  'Hyundai': 0.96,
  'Kia': 0.96,
  'Volkswagen': 0.97,
  'VW': 0.97,
  'BMW': 1.02,
  'Mercedes': 1.02,
  'Mercedes-Benz': 1.02,
  'Audi': 1.02,
  'Tesla': 1.15,
  'Jeep': 1.01,
  'Porsche': 1.08,
  'Volvo': 1.00,
  'Infiniti': 1.01,
  'Cadillac': 0.98,
  'Lincoln': 0.97,
  'Buick': 0.95,
  'Chrysler': 0.94,
  'Mitsubishi': 0.93,
  'Other': 0.95
};

// ============================================================================
// MILEAGE BRACKET FACTORS (market/demand)
// ============================================================================
const MILEAGE_FACTOR = [
  { max: 60000, factor: 1.05 },
  { max: 100000, factor: 1.00 },
  { max: 150000, factor: 0.95 },
  { max: 200000, factor: 0.90 },
  { max: 9999999, factor: 0.85 }
];

// ============================================================================
// CONDITION MULTIPLIERS
// ============================================================================
const CONDITION_VALUE_MULT = {
  'Excellent': 1.15,
  'Very Good': 1.08,
  'Good': 1.00,
  'Fair': 0.85,
  'Poor': 0.70,
  'Parts Only': 0.55,
  'Unknown': 0.90
};

const CONDITION_REPAIR_PCT = {
  'Excellent': 0.02,
  'Very Good': 0.05,
  'Good': 0.10,
  'Fair': 0.20,
  'Poor': 0.35,
  'Parts Only': 0.60,
  'Unknown': 0.25
};

const CONDITION_SCORES = {
  'Excellent': 95,
  'Very Good': 85,
  'Good': 75,
  'Fair': 60,
  'Poor': 40,
  'Parts Only': 20,
  'Unknown': 50
};

// ============================================================================
// MAO CONFIGURATION (strategy-specific)
// ============================================================================
const MAO_PCT_BY_STRATEGY = {
  'QUICK_FLIP': 0.65,
  'REPAIR_RESELL': 0.72,
  'PART_OUT': 0.60,
  'HOLD_SEASONAL': 0.68
};

const HOLDING_COST_DEFAULT = 500;
const FLOOR_MAO = 500;

// ============================================================================
// PROFIT TARGETS BY CAPITAL TIER
// ============================================================================
const MIN_PROFIT_PCT_BY_TIER = {
  'T1': 0.25,
  'T2': 0.20,
  'T3': 0.15,
  'T4': 0.12
};

const MIN_PROFIT_DOLLARS_BY_TIER = {
  'T1': 600,
  'T2': 900,
  'T3': 1200,
  'T4': 1500
};

// ============================================================================
// CAPITAL TIERS (based on total investment)
// ============================================================================
const CAPITAL_TIERS = [
  { name: 'T1', max: 5000, label: 'Micro Deal ($0-5K)' },
  { name: 'T2', max: 15000, label: 'Budget Flip ($5-15K)' },
  { name: 'T3', max: 30000, label: 'Standard Flip ($15-30K)' },
  { name: 'T4', max: 999999999, label: 'Premium Flip ($30K+)' }
];

// ============================================================================
// VERDICT THRESHOLDS (deterministic)
// ============================================================================
const VERDICT_THRESHOLDS = {
  HOT_OVERALL_MIN: 80,
  SOLID_OVERALL_MIN: 60,
  PASS_OVERALL_BELOW: 60,
  MAX_DISTANCE_HOT: 120,      // miles
  MAX_DISTANCE_SOLID: 200,    // miles
  MAX_DISTANCE_ABSOLUTE: 350, // PASS if beyond this
  MIN_VELOCITY_HOT: 65,
  MIN_PROFIT_PCT_HOT: 0.18,
  MIN_PROFIT_PCT_SOLID: 0.12,
  MAX_RISK_ACCEPTABLE: 65
};

// ============================================================================
// STRATEGY SELECTION THRESHOLDS
// ============================================================================
const STRATEGY_THRESHOLDS = {
  PART_OUT_TRIGGER_CONDITION: ['Poor', 'Parts Only'],
  PART_OUT_TRIGGER_KEYWORDS: [
    'blown engine', 'no engine', 'no motor', 'transmission',
    'no title', 'parts only', 'won\'t start', 'wont start',
    'needs engine', 'needs transmission', 'not running',
    'doesn\'t run', 'doesnt run', 'for parts', 'project car',
    'mechanic special', 'engine knock', 'blown head gasket',
    'no start', 'salvage', 'flood damage', 'fire damage'
  ],
  HOLD_TRIGGER_MONTHS: [3, 4, 5, 6, 7, 8, 9], // Spring/Summer
  HOLD_TRIGGER_DESIRABILITY_MIN: 75,
  REPAIR_TRIGGER_REPAIR_PCT_MIN: 0.12
};

// ============================================================================
// SCORE WEIGHTS (sum to 1.00)
// ============================================================================
const SCORE_WEIGHTS = {
  PROFIT: 0.35,
  CONDITION: 0.20,
  LOCATION: 0.12,
  VELOCITY: 0.18,
  MARKET: 0.10,
  COMPETITION: 0.05
};

// Risk weight applied to overall score
const RISK_PENALTY_WEIGHT = 0.30;

// ============================================================================
// RISK COMPONENT WEIGHTS
// ============================================================================
const RISK_WEIGHTS = {
  TITLE: 0.25,
  REPAIR: 0.25,
  DISTANCE: 0.15,
  CAPITAL: 0.15,
  TIME: 0.20
};

// ============================================================================
// TITLE STATUS RISK SCORES
// ============================================================================
const TITLE_RISK_SCORES = {
  'Clean': 10,
  'Clear': 10,
  'Rebuilt': 45,
  'Salvage': 45,
  'Unknown': 25,
  'No Title': 70,
  'Lien': 35
};

// ============================================================================
// VELOCITY BASE SCORES BY DAYS LISTED
// ============================================================================
const VELOCITY_BY_DAYS = [
  { maxDays: 3, score: 95 },
  { maxDays: 7, score: 85 },
  { maxDays: 14, score: 72 },
  { maxDays: 30, score: 58 },
  { maxDays: 60, score: 42 },
  { maxDays: 999999, score: 30 }
];

// ============================================================================
// BASE VALUE BY VEHICLE AGE
// ============================================================================
const BASE_VALUE_BY_AGE = [
  { maxAge: 3, value: 35000 },
  { maxAge: 5, value: 25000 },
  { maxAge: 10, value: 15000 },
  { maxAge: 15, value: 8000 },
  { maxAge: 999, value: 4000 }
];

const MIN_MARKET_VALUE = 1500;

// ============================================================================
// NEGOTIATION ANCHORS
// ============================================================================
const NEGOTIATION_CONFIG = {
  AGGRESSIVE_MULTIPLIER: 0.75,
  MODERATE_MULTIPLIER: 0.85,
  WALK_AWAY_CEILING_MULT: 1.05,
  QUICK_FLIP_ANCHOR_MULT: 0.85,
  OTHER_STRATEGY_ANCHOR_MULT: 0.90
};

// ============================================================================
// API CONFIGURATION
// ============================================================================
const API_CONFIG = {
  OPENAI: {
    URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-4',
    TEMPERATURE: 0.7,
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000
  },
  SMSIT: {
    BASE_URL: 'https://api.sms-it.com/v1',
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000,
    RATE_LIMIT_MS: 200 // 5 per second max
  },
  COMPANYHUB: {
    BASE_URL: 'https://api.companyhub.com/v1',
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 1000,
    RATE_LIMIT_MS: 100
  },
  GOOGLE_MAPS: {
    DISTANCE_MATRIX_URL: 'https://maps.googleapis.com/maps/api/distancematrix/json',
    MAX_RETRIES: 2,
    RETRY_DELAY_MS: 500
  }
};

// ============================================================================
// LOCK SERVICE CONFIGURATION
// ============================================================================
const LOCK_CONFIG = {
  IMPORT_LOCK_TIMEOUT_MS: 60000,    // 1 minute
  ANALYSIS_LOCK_TIMEOUT_MS: 120000, // 2 minutes
  BATCH_LOCK_TIMEOUT_MS: 300000,    // 5 minutes
  CRM_SYNC_LOCK_TIMEOUT_MS: 30000   // 30 seconds
};

// ============================================================================
// CRM ROUTING RULES
// ============================================================================
const CRM_ROUTING = {
  HOT_DEAL: {
    COMPANYHUB_STAGE: 'HOT - Contact Now',
    SMSIT_TAGS: ['CARHAWK', 'HOT', 'PRIORITY_URGENT'],
    SEND_SMS: true
  },
  SOLID_DEAL: {
    COMPANYHUB_STAGE: 'Nurture',
    SMSIT_TAGS: ['CARHAWK', 'NURTURE'],
    SEND_SMS: true
  },
  PASS: {
    COMPANYHUB_STAGE: 'Archive',
    SMSIT_TAGS: [],
    SEND_SMS: false
  }
};

// ============================================================================
// FEATURE FLAGS
// ============================================================================
const FEATURE_FLAGS = {
  ENABLE_AI_NOTES: true,
  ENABLE_SMS_INTEGRATION: true,
  ENABLE_COMPANYHUB_INTEGRATION: true,
  USE_REAL_DISTANCE_API: true,
  ENABLE_KNOWLEDGE_BASE: true,

  // Auto-routing after import analysis (default OFF)
  ENABLE_AUTO_CRM_ROUTING: false,

  // Send SMS to SOLID deals automatically (only if ENABLE_AUTO_CRM_ROUTING=true)
  ENABLE_AUTO_SOLID_SMS: false,

  // Optional logging behavior (keep)
  LOG_PASSES_TO_CRM: false
};

// ============================================================================
// HELPER: Get config from sheet (with defaults)
// ============================================================================
function getConfigValue(key, defaultValue) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEETS.CONFIG);
    if (!sheet) return defaultValue;

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1] !== '' ? data[i][1] : defaultValue;
      }
    }
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// ============================================================================
// HELPER: Set config value
// ============================================================================
function setConfigValue(key, value) {
  const sheet = getOrCreateSheet(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      sheet.getRange(i + 1, 3).setValue(new Date());
      return;
    }
  }

  // Key not found, append new row
  sheet.appendRow([key, value, new Date(), 'Auto-created']);
}

// ============================================================================
// HELPER: Get origin ZIP (from config or default)
// ============================================================================
function getOriginZip() {
  return getConfigValue('ORIGIN_ZIP', ORIGIN_ZIP);
}

// ============================================================================
// HELPER: Get API key
// ============================================================================
function getApiKey(service) {
  const keyMap = {
    'OPENAI': 'OPENAI_API_KEY',
    'SMSIT': 'SMSIT_API_KEY',
    'COMPANYHUB': 'COMPANYHUB_API_KEY',
    'GOOGLE_MAPS': 'GOOGLE_MAPS_API_KEY'
  };
  return getConfigValue(keyMap[service], '');
}
