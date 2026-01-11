// ==========================================
// CARHAWK ULTIMATE - CONFIGURATION MODULE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Central configuration for all system constants, settings, and parameters
// ==========================================

/**
 * SYSTEM METADATA
 */
const SYSTEM = {
  NAME: 'CarHawk Ultimate',
  VERSION: '1.0.0',
  DESCRIPTION: 'Vehicle Intelligence, Flipping & Rental Optimization OS',
  ICON: '🦅',
  HOME_ZIP: '63101', // St. Louis County, MO
  HOME_COORDS: {lat: 38.6270, lng: -90.1994}
};

/**
 * SHEET DEFINITIONS
 * Complete list of all sheets with metadata
 */
const SHEETS = {
  // Import/Staging Sheets (Read-Only)
  STAGING_FB: {
    name: 'Staging - Facebook',
    color: '#3b5998',
    icon: '📘',
    platform: 'Facebook Marketplace',
    readOnly: true
  },
  STAGING_CL: {
    name: 'Staging - Craigslist',
    color: '#5d4037',
    icon: '📋',
    platform: 'Craigslist',
    readOnly: true
  },
  STAGING_OU: {
    name: 'Staging - OfferUp',
    color: '#00c853',
    icon: '🔼',
    platform: 'OfferUp',
    readOnly: true
  },
  STAGING_EBAY: {
    name: 'Staging - eBay',
    color: '#e53935',
    icon: '🛒',
    platform: 'eBay Motors',
    readOnly: true
  },

  // Core Database
  MASTER: {
    name: 'Master Database',
    color: '#1a73e8',
    icon: '🗄️',
    description: 'Single source of truth for all vehicle data'
  },

  // Decision & Analysis Sheets
  VERDICT: {
    name: 'Verdict',
    color: '#ea4335',
    icon: '⚖️',
    description: 'Top-ranked deals with actionable verdicts'
  },

  SPEED_LEAD: {
    name: 'Speed-to-Lead Dashboard',
    color: '#ff6d00',
    icon: '🔥',
    description: 'Real-time lead urgency and speed tracking'
  },

  RENTAL: {
    name: 'Rental Analysis',
    color: '#34a853',
    icon: '🚗',
    description: 'Turo and rental viability analysis'
  },

  // Supporting Sheets
  CALCULATOR: {
    name: 'Flip ROI Calculator',
    color: '#fbbc04',
    icon: '💰',
    description: 'Manual flip calculation workspace'
  },

  SCORING: {
    name: 'Lead Scoring & Risk',
    color: '#673ab7',
    icon: '📊',
    description: 'Detailed scoring breakdown and risk assessment'
  },

  CRM: {
    name: 'CRM Integration',
    color: '#00acc1',
    icon: '🤝',
    description: 'CRM sync status and message tracking'
  },

  // System Sheets
  CONFIG: {
    name: 'Config',
    color: '#9e9e9e',
    icon: '⚙️',
    description: 'System configuration and API keys'
  },

  LOGS: {
    name: 'System Logs',
    color: '#424242',
    icon: '📝',
    description: 'Activity logs and system events'
  }
};

/**
 * MASTER DATABASE COLUMN DEFINITIONS
 * Complete schema with exact column names as required
 */
const MASTER_COLUMNS = {
  // Vehicle Identity
  LISTING_ID: 'Listing ID',
  YEAR: 'Year',
  MAKE: 'Make',
  MODEL: 'Model',
  TRIM: 'Trim',
  BODY_TYPE: 'Body Type',
  ENTHUSIAST_FLAG: 'Enthusiast Flag',

  // Pricing
  ASKING_PRICE: 'Asking Price',
  ESTIMATED_RESALE: 'Estimated Resale Value',
  MAO: 'MAO',
  OFFER_TARGET: 'Offer Target',
  PROFIT_DOLLAR: 'Profit $',
  PROFIT_PERCENT: 'Profit %',

  // Condition & Risk
  MILEAGE: 'Mileage',
  CONDITION: 'Condition',
  AI_CONDITION: 'AI Condition Guess',
  TITLE_STATUS: 'Title Status',
  REPAIR_RISK_SCORE: 'Repair Risk Score',
  ESTIMATED_REPAIR: 'Estimated Repair Cost',
  HAZARD_FLAGS: 'Hazard Flags',

  // Market Intelligence
  PLATFORM: 'Platform',
  MARKET_DEMAND: 'Market Demand Score',
  SALES_VELOCITY: 'Sales Velocity Score',
  MARKET_ADVANTAGE: 'Market Advantage Score',
  DAYS_TO_SELL: 'Days-to-Sell Estimate',

  // Location
  SELLER_CITY: 'Seller City',
  SELLER_ZIP: 'Seller ZIP',
  DISTANCE: 'Distance (mi)',
  LOCATION_RISK: 'Location Risk Tier',

  // Speed-to-Lead
  FIRST_SEEN: 'First Seen Timestamp',
  TIME_SINCE_POSTED: 'Time Since Posted (mins)',
  LEAD_SPEED_SCORE: 'Lead Speed Score',
  LEAD_COOLING_RISK: 'Lead Cooling Risk',

  // Capital & Strategy
  CAPITAL_TIER: 'Capital Tier',
  FLIP_STRATEGY: 'Flip Strategy',
  VERDICT: 'Verdict',

  // Rental/Turo Analysis
  RENTAL_VIABLE: 'Rental Viability',
  DAILY_RATE: 'Estimated Daily Rate',
  MONTHLY_GROSS: 'Monthly Gross Potential',
  MONTHLY_NET: 'Monthly Net',
  BREAKEVEN_DAYS: 'Break-Even Days',
  RENTAL_RISK: 'Rental Risk Score',

  // AI Output
  SELLER_MESSAGE: 'Seller Message',
  NEGOTIATION_ANGLE: 'Negotiation Angle',
  AI_NOTES: 'AI Notes',

  // CRM
  LEAD_SYNCED: 'Lead Synced?',
  CRM_PLATFORM: 'CRM Platform',
  CRM_DEAL_ID: 'CRM Deal ID',
  CONTACTED_AT: 'Contacted Timestamp',

  // Metadata
  LISTING_URL: 'Listing URL',
  SELLER_NAME: 'Seller Name',
  SELLER_PHONE: 'Seller Phone',
  SELLER_EMAIL: 'Seller Email',
  DESCRIPTION: 'Description',
  IMAGES: 'Images',
  CREATED_AT: 'Created At',
  UPDATED_AT: 'Updated At'
};

/**
 * SCORING WEIGHTS
 * Used in lead scoring algorithm
 */
const SCORING_WEIGHTS = {
  PROFIT_MARGIN: 0.30,      // 30% - Most important
  SPEED_TO_LEAD: 0.20,      // 20% - Critical for conversions
  DISTANCE: 0.10,           // 10% - Logistics matter
  MARKET_DEMAND: 0.10,      // 10% - Sellability
  CONDITION: 0.10,          // 10% - Risk factor
  MILEAGE: 0.08,            // 8%  - Depreciation factor
  TITLE_STATUS: 0.07,       // 7%  - Legal risk
  PLATFORM: 0.05,           // 5%  - Source reliability
  RENTAL_BONUS: 0.10        // 10% - Bonus if rental-viable
};

/**
 * SPEED-TO-LEAD CONFIGURATION
 * Time-based urgency thresholds
 */
const SPEED_CONFIG = {
  // Urgency thresholds (minutes)
  IMMEDIATE: 30,       // 🔥 Less than 30 min = immediate action
  WARM: 120,           // ⚠️ 30-120 min = still warm
  COOLING: 360,        // ⏰ 2-6 hours = cooling down
  COLD: 1440,          // ❄️ 6-24 hours = cold
  // Above 24 hours = dead

  // Score decay curve parameters
  DECAY_RATE: 0.92,    // Score multiplier per hour
  MIN_SCORE: 10,       // Minimum possible score
  MAX_SCORE: 100,      // Maximum possible score

  // Alert settings
  ALERT_THRESHOLD: 30, // Send email if posted < 30 min ago
  ALERT_MIN_PROFIT: 2000 // Only alert if profit > $2000
};

/**
 * RENTAL/TURO CONFIGURATION
 * Parameters for rental viability analysis
 */
const RENTAL_CONFIG = {
  // Turo fee structure
  TURO_FEE_STANDARD: 0.25,     // 25% standard plan
  TURO_FEE_PREMIER: 0.15,      // 15% premier plan (assume this)

  // Operating costs (monthly estimates)
  INSURANCE_MONTHLY: 150,      // Commercial insurance
  MAINTENANCE_RESERVE: 0.08,   // 8% of gross for maintenance
  CLEANING_PER_RENTAL: 30,     // Per rental cleaning

  // Utilization assumptions
  UTILIZATION_CONSERVATIVE: 0.50,  // 50% - pessimistic
  UTILIZATION_MODERATE: 0.65,      // 65% - realistic
  UTILIZATION_OPTIMISTIC: 0.80,    // 80% - optimistic

  // Market rate multipliers by vehicle type
  DAILY_RATES: {
    'Economy': 35,
    'Compact': 40,
    'Sedan': 45,
    'SUV': 65,
    'Truck': 70,
    'Luxury Sedan': 90,
    'Luxury SUV': 120,
    'Sports Car': 150,
    'Exotic': 300,
    'Van': 75
  },

  // Enthusiast bonus multiplier
  ENTHUSIAST_MULTIPLIER: 1.4,

  // Viability thresholds
  MIN_MONTHLY_NET: 400,        // Need at least $400/mo net profit
  MAX_BREAKEVEN_MONTHS: 18,    // Must break even within 18 months
  MIN_CONDITION_SCORE: 70      // Must be in good condition
};

/**
 * MAO (Maximum Allowable Offer) CONFIGURATION
 * Formula: MAO = (Estimated Resale Value × Rule %) - Repair Costs - Fixed Costs
 */
const MAO_CONFIG = {
  // Rule percentages by strategy
  QUICK_FLIP_RULE: 0.75,       // 75% rule for quick flips
  REPAIR_FLIP_RULE: 0.65,      // 65% rule if repairs needed
  ENTHUSIAST_RULE: 0.70,       // 70% rule for enthusiast vehicles
  RENTAL_RULE: 0.80,           // 80% rule for rental holds

  // Fixed costs per deal
  FIXED_COSTS: {
    title_transfer: 200,
    registration: 150,
    inspection: 100,
    detailing: 150,
    photos: 50,
    listing_fees: 50,
    contingency: 200
  },

  // Minimum profit targets
  MIN_PROFIT_MICRO: 500,
  MIN_PROFIT_BUDGET: 1000,
  MIN_PROFIT_STANDARD: 2000,
  MIN_PROFIT_PREMIUM: 3500,
  MIN_PROFIT_LUXURY: 5000
};

/**
 * CONDITION SCORING
 * Maps condition strings to numeric scores
 */
const CONDITION_SCORES = {
  'Excellent': 95,
  'Very Good': 85,
  'Good': 75,
  'Fair': 65,
  'Poor': 50,
  'Salvage': 30,
  'Parts Only': 20,
  'Unknown': 60  // Default if not specified
};

/**
 * TITLE STATUS RISK MULTIPLIERS
 */
const TITLE_RISK = {
  'Clean': 1.0,
  'Clear': 1.0,
  'Rebuilt': 0.7,
  'Salvage': 0.5,
  'Branded': 0.6,
  'No Title': 0.3,
  'Pending': 0.8,
  'Unknown': 0.7
};

/**
 * CAPITAL TIER DEFINITIONS
 */
const CAPITAL_TIERS = {
  MICRO: {label: 'Micro Deal', min: 0, max: 1000, minProfit: 300},
  BUDGET: {label: 'Budget Flip', min: 1001, max: 5000, minProfit: 800},
  STANDARD: {label: 'Standard Flip', min: 5001, max: 15000, minProfit: 2000},
  PREMIUM: {label: 'Premium Flip', min: 15001, max: 30000, minProfit: 3500},
  LUXURY: {label: 'Luxury Flip', min: 30001, max: 999999, minProfit: 5000}
};

/**
 * FLIP STRATEGY TYPES
 */
const FLIP_STRATEGIES = {
  QUICK_FLIP: 'Quick Flip',
  REPAIR_FLIP: 'Repair + Resell',
  PART_OUT: 'Part-Out',
  RENTAL_HOLD: 'Turo / Rental Hold',
  PORTFOLIO_HOLD: 'Portfolio Hold',
  PASS: 'Pass'
};

/**
 * VERDICT TYPES
 */
const VERDICTS = {
  HOT: {label: '🔥 HOT', icon: '🔥', minScore: 80},
  SOLID: {label: '✅ SOLID', icon: '✅', minScore: 65},
  RENTAL_GEM: {label: '💎 RENTAL GEM', icon: '💎', minScore: 70, rentalRequired: true},
  MAYBE: {label: '🤔 MAYBE', icon: '🤔', minScore: 50},
  PASS: {label: '❌ PASS', icon: '❌', minScore: 0}
};

/**
 * ENTHUSIAST VEHICLE MARKERS
 * Keywords that indicate enthusiast/collectible vehicles
 */
const ENTHUSIAST_MARKERS = {
  makes: [
    'Porsche', 'Ferrari', 'Lamborghini', 'McLaren', 'Aston Martin',
    'BMW M', 'Mercedes AMG', 'Audi RS', 'Audi S',
    'Corvette', 'Viper', 'GT-R', 'Supra', 'NSX',
    'Mazda RX', 'Subaru WRX', 'Mitsubishi Evo',
    'Tesla', 'Rivian', 'Lucid'
  ],
  models: [
    '911', 'Boxster', 'Cayman', 'M3', 'M5', 'M4',
    'GT-R', 'Supra', 'NSX', 'RX-7', 'RX-8',
    'WRX STI', 'EVO', 'Type R', 'RS3', 'RS4', 'RS6',
    'AMG GT', 'C63', 'E63', 'S63',
    'Hellcat', 'Demon', 'Shelby', 'Boss', 'Raptor'
  ],
  keywords: [
    'turbo', 'supercharged', 'manual transmission',
    'stick shift', 'track pack', 'performance pack',
    'limited edition', 'collector', 'rare'
  ]
};

/**
 * HAZARD FLAGS
 * Red flags that indicate risky deals
 */
const HAZARD_FLAGS = {
  critical: [
    'no title', 'lost title', 'missing title',
    'flood damage', 'flood title', 'water damage',
    'frame damage', 'structural damage',
    'stolen', 'lien', 'repo'
  ],
  high: [
    'rebuilt title', 'salvage',
    'needs engine', 'needs transmission', 'blown motor',
    'not running', 'does not run', 'for parts'
  ],
  medium: [
    'check engine light', 'needs repair',
    'ac not working', 'no ac',
    'body damage', 'accident',
    'high mileage', 'rough'
  ]
};

/**
 * CRM INTEGRATION SETTINGS
 */
const CRM_SETTINGS = {
  // SMS-iT CRM (for negotiation and messaging)
  SMSIT: {
    enabled: true,
    apiEndpoint: '', // To be configured
    apiKey: '',      // To be configured
    syncVerdicts: ['🔥 HOT', '💎 RENTAL GEM']
  },

  // CompanyHub / OneHash (for deal tracking)
  COMPANYHUB: {
    enabled: false,
    apiEndpoint: '', // To be configured
    apiKey: '',      // To be configured
    syncAllLeads: false
  },

  // Sync rules
  SYNC_RULES: {
    minLeadScore: 70,
    autoGenMessage: true,
    syncSpeedToLead: true
  }
};

/**
 * DISTANCE THRESHOLDS
 * Risk tiers based on distance from home base
 */
const DISTANCE_TIERS = {
  LOCAL: {max: 25, label: 'Local', risk: 1.0},
  REGIONAL: {max: 75, label: 'Regional', risk: 0.95},
  DISTANT: {max: 150, label: 'Distant', risk: 0.85},
  REMOTE: {max: 999999, label: 'Remote', risk: 0.70}
};

/**
 * EMAIL ALERT CONFIGURATION
 */
const EMAIL_CONFIG = {
  enabled: true,
  alertOnHotDeals: true,
  alertOnRentalGems: true,
  minProfitForAlert: 2000,
  maxAgeMinutes: 30,
  recipient: '' // To be configured from user email
};

/**
 * MARKET INTELLIGENCE PARAMETERS
 * Used for estimating market demand and sales velocity
 */
const MARKET_PARAMS = {
  // Popular makes (higher demand)
  popularMakes: [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Nissan',
    'Jeep', 'Ram', 'GMC', 'Subaru', 'Mazda', 'Hyundai', 'Kia'
  ],

  // Fast-selling body types
  fastSelling: [
    'Truck', 'SUV', 'Crossover'
  ],

  // Average days to sell by category
  avgDaysToSell: {
    'Truck': 21,
    'SUV': 28,
    'Sedan': 35,
    'Coupe': 42,
    'Sports Car': 56,
    'Van': 38,
    'Wagon': 45,
    'Convertible': 49
  }
};

/**
 * UI/UX SETTINGS
 */
const UI_CONFIG = {
  // Frozen rows
  frozenRows: 1,

  // Column widths (pixels)
  columnWidths: {
    small: 80,
    medium: 120,
    large: 180,
    xlarge: 250
  },

  // Color codes
  colors: {
    hot: '#ff4444',
    solid: '#44ff44',
    rentalGem: '#44aaff',
    maybe: '#ffaa44',
    pass: '#999999',
    immediate: '#ff0000',
    warm: '#ff9900',
    cooling: '#ffff00',
    cold: '#cccccc'
  },

  // Icons
  icons: {
    hot: '🔥',
    solid: '✅',
    rentalGem: '💎',
    maybe: '🤔',
    pass: '❌',
    immediate: '🔥',
    warm: '⚠️',
    cooling: '⏰',
    cold: '❄️',
    up: '📈',
    down: '📉',
    check: '✓',
    x: '✗'
  }
};

/**
 * REPAIR COST ESTIMATION KEYWORDS
 * Used to estimate repair costs from descriptions
 */
const REPAIR_KEYWORDS = {
  'transmission': {cost: 3000, severity: 'HIGH'},
  'engine': {cost: 2500, severity: 'HIGH'},
  'motor': {cost: 2500, severity: 'HIGH'},
  'head gasket': {cost: 1500, severity: 'HIGH'},
  'blown head': {cost: 1500, severity: 'HIGH'},
  'timing chain': {cost: 800, severity: 'MEDIUM'},
  'timing belt': {cost: 600, severity: 'MEDIUM'},
  'turbo': {cost: 1800, severity: 'MEDIUM'},
  'suspension': {cost: 800, severity: 'MEDIUM'},
  'ac': {cost: 500, severity: 'LOW'},
  'air conditioning': {cost: 500, severity: 'LOW'},
  'paint': {cost: 1200, severity: 'MEDIUM'},
  'body work': {cost: 1000, severity: 'MEDIUM'},
  'dent': {cost: 300, severity: 'LOW'},
  'rust': {cost: 800, severity: 'MEDIUM'},
  'brake': {cost: 400, severity: 'LOW'},
  'tire': {cost: 400, severity: 'LOW'},
  'battery': {cost: 150, severity: 'LOW'},
  'alternator': {cost: 300, severity: 'LOW'},
  'starter': {cost: 250, severity: 'LOW'}
};

/**
 * API CONFIGURATION
 * External service integrations
 */
const API_CONFIG = {
  // OpenAI for AI analysis
  OPENAI: {
    model: 'gpt-4-turbo-preview',
    maxTokens: 500,
    temperature: 0.3
  },

  // Google Maps for distance calculation
  MAPS: {
    useCache: true,
    cacheExpiry: 86400 // 24 hours
  }
};
