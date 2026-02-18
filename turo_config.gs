// =========================================================
// CARHAWK ULTIMATE - TURO MODULE CONFIGURATION
// =========================================================
// Version: 1.0.0
// Purpose: Constants, vehicle classification maps, column indices,
//          picklist options, and default values for the Turo Module.
// =========================================================

/**
 * Turo Module sheet definitions.
 * These are registered alongside existing QUANTUM_SHEETS entries in main.gs.
 * @const {Object}
 */
const TURO_SHEETS = {
  ENGINE: {name: 'Turo Engine', color: '#00BCD4', icon: '🔋'},
  FLEET: {name: 'Fleet Manager', color: '#4CAF50', icon: '🚗'},
  MAINTENANCE: {name: 'Maintenance & Turnovers', color: '#FF9800', icon: '🔧'},
  PRICING: {name: 'Turo Pricing & Seasonality', color: '#9C27B0', icon: '💰'},
  INSURANCE: {name: 'Insurance & Compliance', color: '#F44336', icon: '🛡️'}
};

/**
 * Master Database column indices (0-based) for fields used by the Turo module.
 * These map to the existing 61-column Master Database layout.
 * @const {Object}
 */
const TURO_DB_COLS = {
  // Existing Master DB columns (0-indexed)
  DEAL_ID: 0,
  IMPORT_DATE: 1,
  PLATFORM: 2,
  STATUS: 3,
  YEAR: 5,
  MAKE: 6,
  MODEL: 7,
  TRIM: 8,
  VIN: 9,
  MILEAGE: 10,
  COLOR: 11,
  TITLE: 12,
  PRICE: 13,            // Asking Price
  LOCATION: 14,
  ZIP: 15,
  DISTANCE: 16,
  CONDITION: 19,
  CONDITION_SCORE: 20,
  REPAIR_KEYWORDS: 21,
  REPAIR_RISK_SCORE: 22,
  EST_REPAIR_COST: 23,  // Estimated Repair Cost
  MARKET_VALUE: 24,     // Estimated Resale Value
  MAO: 25,
  PROFIT_MARGIN: 26,    // Profit Potential ($)
  ROI_PCT: 27,
  CAPITAL_TIER: 28,
  FLIP_STRATEGY: 29,
  SALES_VELOCITY: 30,
  MARKET_ADVANTAGE: 31,
  DAYS_LISTED: 32,
  AI_CONFIDENCE: 41,
  VERDICT: 42,
  RECOMMENDED: 44,
  NOTES: 50,

  // New Turo columns (appended after existing 61 columns, 0-indexed 61-70)
  TURO_HOLD_SCORE: 61,
  TURO_MONTHLY_NET: 62,
  TURO_PAYBACK_MONTHS: 63,
  TURO_BREAKEVEN_UTIL: 64,
  TURO_RISK_TIER: 65,
  TURO_VS_FLIP_DELTA: 66,
  TURO_RECOMMENDED: 67,
  TURO_STATUS: 68,
  FLEET_ID: 69,
  TURO_NOTES: 70
};

/**
 * New Master Database Turo column headers (appended in order).
 * @const {string[]}
 */
const TURO_DB_HEADERS = [
  'Turo Hold Score',
  'Turo Monthly Net',
  'Turo Payback Months',
  'Turo Break-Even Util %',
  'Turo Risk Tier',
  'Turo vs Flip Delta',
  'Turo Recommended?',
  'Turo Status',
  'Fleet ID',
  'Turo Notes'
];

/**
 * Turo Engine sheet headers (39 columns, A-AM).
 * @const {string[]}
 */
const TURO_ENGINE_HEADERS = [
  'Row ID',                    // A
  'VIN',                       // B
  'Vehicle',                   // C
  'Vehicle Class',             // D
  'Asking Price',              // E
  'Estimated Repair Cost',     // F
  'Total Acquisition Cost',    // G
  'Estimated Resale Value',    // H
  'Flip Net Profit',           // I
  'Flip Timeline (days)',      // J
  'Daily Rate',                // K
  'Utilization %',             // L
  'Gross Monthly Revenue',     // M
  'Turo Platform Fee %',       // N
  'Turo Platform Fee $',       // O
  'Insurance Monthly',         // P
  'Cleaning Per Trip',         // Q
  'Trips Per Month',           // R
  'Total Cleaning Monthly',    // S
  'Maintenance Reserve Monthly', // T
  'Depreciation Monthly',      // U
  'Financing Payment Monthly', // V
  'Registration & Tax Monthly', // W
  'Total Monthly Expenses',    // X
  'Net Monthly Cash Flow',     // Y
  'Net Annual Cash Flow',      // Z
  'Payback Months',            // AA
  'Break-Even Utilization %',  // AB
  '12-Month Total Profit (Turo)', // AC
  '12-Month Total Profit (Flip)', // AD
  'Turo vs Flip Delta',        // AE
  'Turo Hold Score',           // AF
  'Risk Tier',                 // AG
  'Recommended Strategy',      // AH
  'Rationale',                 // AI
  'Exit Plan',                 // AJ
  'Turo Status',               // AK
  'Date Evaluated',            // AL
  'Override?'                  // AM
];

/**
 * Turo Engine column indices (0-based) for programmatic access.
 * @const {Object}
 */
const TE_COLS = {
  ROW_ID: 0,
  VIN: 1,
  VEHICLE: 2,
  VEHICLE_CLASS: 3,
  ASKING_PRICE: 4,
  REPAIR_COST: 5,
  TOTAL_ACQ_COST: 6,
  RESALE_VALUE: 7,
  FLIP_NET_PROFIT: 8,
  FLIP_TIMELINE: 9,
  DAILY_RATE: 10,
  UTILIZATION: 11,
  GROSS_MONTHLY_REV: 12,
  PLATFORM_FEE_PCT: 13,
  PLATFORM_FEE_AMT: 14,
  INSURANCE_MONTHLY: 15,
  CLEANING_PER_TRIP: 16,
  TRIPS_PER_MONTH: 17,
  TOTAL_CLEANING_MONTHLY: 18,
  MAINT_RESERVE_MONTHLY: 19,
  DEPRECIATION_MONTHLY: 20,
  FINANCING_MONTHLY: 21,
  REG_TAX_MONTHLY: 22,
  TOTAL_MONTHLY_EXP: 23,
  NET_MONTHLY_CF: 24,
  NET_ANNUAL_CF: 25,
  PAYBACK_MONTHS: 26,
  BREAKEVEN_UTIL: 27,
  TURO_12MO_PROFIT: 28,
  FLIP_12MO_PROFIT: 29,
  TURO_VS_FLIP_DELTA: 30,
  TURO_HOLD_SCORE: 31,
  RISK_TIER: 32,
  RECOMMENDED_STRATEGY: 33,
  RATIONALE: 34,
  EXIT_PLAN: 35,
  TURO_STATUS: 36,
  DATE_EVALUATED: 37,
  OVERRIDE: 38
};

/**
 * Fleet Manager sheet headers (26 columns, A-Z).
 * @const {string[]}
 */
const FLEET_MANAGER_HEADERS = [
  'Fleet ID',                  // A
  'VIN',                       // B
  'Vehicle',                   // C
  'Vehicle Class',             // D
  'Turo Status',               // E
  'Date Acquired',             // F
  'Date Listed on Turo',       // G
  'Acquisition Cost',          // H
  'Total Revenue to Date',     // I
  'Total Expenses to Date',    // J
  'Net Profit to Date',        // K
  'ROI to Date %',             // L
  'Months Active',             // M
  'Avg Monthly Revenue',       // N
  'Avg Monthly Net',           // O
  'Utilization to Date %',     // P
  'Trips to Date',             // Q
  'Avg Trip Length (days)',     // R
  'Current Daily Rate',        // S
  'Monthly Insurance',         // T
  'Last Service Date',         // U
  'Next Service Due',          // V
  'Current Estimated Value',   // W
  'Projected Payoff Date',     // X
  'On Track?',                 // Y
  'Fleet Notes'                // Z
];

/**
 * Maintenance & Turnovers sheet headers (14 columns, A-N).
 * @const {string[]}
 */
const MAINTENANCE_HEADERS = [
  'Log ID',                    // A
  'Fleet ID',                  // B
  'Vehicle',                   // C
  'Date',                      // D
  'Type',                      // E
  'Description',               // F
  'Cost',                      // G
  'Vendor',                    // H
  'Mileage at Service',        // I
  'Downtime Days',             // J
  'Next Service Type',         // K
  'Next Service Date',         // L
  'Next Service Mileage',      // M
  'Notes'                      // N
];

/**
 * Insurance & Compliance sheet headers (17 columns, A-Q).
 * @const {string[]}
 */
const INSURANCE_HEADERS = [
  'Fleet ID',                  // A
  'Vehicle',                   // B
  'Registration State',        // C
  'Registration Expiry',       // D
  'Registration Cost',         // E
  'Insurance Provider',        // F
  'Insurance Policy #',        // G
  'Insurance Expiry',          // H
  'Insurance Monthly Premium', // I
  'Insurance Type',            // J
  'Inspection Due',            // K
  'Inspection Status',         // L
  'Emissions Due',             // M
  'Annual Property Tax',       // N
  'LLC/Business Entity',       // O
  'Title Status',              // P
  'Compliance Notes'           // Q
];

/**
 * Maintenance service types picklist.
 * @const {string[]}
 */
const MAINTENANCE_TYPES = [
  'Oil Change',
  'Tires',
  'Brakes',
  'Detailing/Cleaning',
  'Body Repair',
  'Mechanical Repair',
  'Inspection',
  'Registration Renewal',
  'Insurance Renewal',
  'Turnover Prep',
  'Accident Repair',
  'Other'
];

/**
 * Insurance type picklist.
 * @const {string[]}
 */
const INSURANCE_TYPES = [
  'Commercial Rental',
  'Turo Plan',
  'Personal + Turo',
  'LLC Fleet Policy'
];

/**
 * Inspection status picklist.
 * @const {string[]}
 */
const INSPECTION_STATUSES = [
  'Current',
  'Due Soon',
  'Overdue',
  'N/A'
];

/**
 * Title status picklist.
 * @const {string[]}
 */
const TITLE_STATUSES = [
  'Clean',
  'Rebuilt',
  'Salvage',
  'Bonded'
];

/**
 * Turo vehicle lifecycle statuses and valid transitions.
 * @const {Object}
 */
const TURO_STATUSES = {
  CANDIDATE: 'Candidate',
  ACQUIRED: 'Acquired',
  LISTED: 'Listed',
  ACTIVE: 'Active',
  IN_MAINTENANCE: 'In Maintenance',
  PAUSED: 'Paused',
  RETIRED: 'Retired',
  SOLD: 'Sold'
};

/**
 * Valid status transitions for Turo fleet lifecycle.
 * Each key maps to an array of valid next statuses.
 * @const {Object}
 */
const TURO_STATUS_TRANSITIONS = {
  'Candidate': ['Acquired'],
  'Acquired': ['Listed'],
  'Listed': ['Active'],
  'Active': ['In Maintenance', 'Paused', 'Retired'],
  'In Maintenance': ['Active', 'Paused', 'Retired'],
  'Paused': ['Active', 'Retired'],
  'Retired': ['Sold'],
  'Sold': []
};

/**
 * Turo Hold Score weight configuration (default values).
 * @const {Object}
 */
const TURO_SCORE_WEIGHTS = {
  PAYBACK: 0.25,
  CASH_FLOW: 0.25,
  UTILIZATION: 0.15,
  DEPRECIATION: 0.15,
  FLIP_COMPARISON: 0.10,
  MILEAGE: 0.10
};

/**
 * Risk tier thresholds for Turo Hold Score.
 * @const {Object}
 */
const TURO_RISK_TIERS = {
  LOW: {min: 70, max: 100, label: 'Low', description: 'Strong Turo candidate'},
  MEDIUM: {min: 50, max: 69, label: 'Medium', description: 'Viable but monitor closely'},
  HIGH: {min: 30, max: 49, label: 'High', description: 'Consider flipping instead'},
  CRITICAL: {min: 0, max: 29, label: 'Critical', description: 'Do not Turo, flip or pass'}
};

/**
 * Depreciation tiers by vehicle age (annual percentage).
 * Base rates before Turo rental add-on.
 * @const {Object[]}
 */
const DEPRECIATION_TIERS = [
  {minAge: 0, maxAge: 3, rate: 0.15, label: '0-3 years'},
  {minAge: 4, maxAge: 7, rate: 0.10, label: '4-7 years'},
  {minAge: 8, maxAge: 12, rate: 0.07, label: '8-12 years'},
  {minAge: 13, maxAge: 999, rate: 0.04, label: '13+ years'}
];

/**
 * Turo rental depreciation add-on (added to all tiers).
 * @const {number}
 */
const TURO_DEPRECIATION_ADDON = 0.02;

/**
 * Vehicle class definitions for classification logic.
 * @const {Object}
 */
const VEHICLE_CLASSES = {
  ECONOMY: 'Economy',
  MIDSIZE: 'Midsize',
  FULL_SIZE: 'Full-Size',
  SUV: 'SUV',
  TRUCK: 'Truck',
  LUXURY: 'Luxury',
  SPORTS_EXOTIC: 'Sports/Exotic',
  VAN_MINIVAN: 'Van/Minivan'
};

/**
 * Luxury brand list for vehicle classification.
 * @const {string[]}
 */
const LUXURY_BRANDS = [
  'BMW', 'Mercedes-Benz', 'Mercedes', 'Audi', 'Lexus', 'Porsche',
  'Tesla', 'Land Rover', 'Range Rover', 'Jaguar', 'Infiniti',
  'Acura', 'Volvo', 'Genesis', 'Lincoln', 'Cadillac',
  'Maserati', 'Bentley', 'Rolls-Royce', 'Aston Martin',
  'Alfa Romeo', 'Lucid', 'Rivian'
];

/**
 * Sports/exotic models (specific models that override brand classification).
 * @const {string[]}
 */
const SPORTS_MODELS = [
  'Corvette', 'Mustang GT', 'Camaro SS', 'Camaro ZL1', 'Camaro Z28',
  '911', 'Cayman', 'Boxster', 'GT-R', 'GTR', 'Supra', 'GR Supra',
  'NSX', 'R8', 'AMG GT', 'Viper', 'Challenger SRT', 'Charger SRT',
  'Shelby', 'GT350', 'GT500', 'M3', 'M4', 'M5', 'M8',
  'RS3', 'RS5', 'RS6', 'RS7', 'F-Type', 'Huracan', 'Gallardo',
  'Aventador', 'Urus', '488', '458', 'Roma', 'Portofino',
  'Continental GT', 'Wraith', 'Type R', 'Focus RS', 'Golf R',
  'WRX STI', 'Evo', 'Lancer Evolution', 'Z06', 'ZR1'
];

/**
 * Known truck models for classification.
 * @const {string[]}
 */
const TRUCK_MODELS = [
  'F-150', 'F-250', 'F-350', 'Silverado', 'Sierra', 'Ram 1500',
  'Ram 2500', 'Ram 3500', 'Tacoma', 'Tundra', 'Colorado',
  'Canyon', 'Ranger', 'Frontier', 'Titan', 'Ridgeline',
  'Gladiator', 'Maverick', 'Santa Cruz', 'S10', 'Dakota',
  'Cybertruck', 'R1T', 'Lightning'
];

/**
 * Known SUV models for classification.
 * @const {string[]}
 */
const SUV_MODELS = [
  'RAV4', 'CR-V', 'CRV', 'Highlander', 'Pilot', 'Explorer',
  'Tahoe', 'Suburban', 'Expedition', '4Runner', 'Wrangler',
  'Grand Cherokee', 'Cherokee', 'Equinox', 'Traverse', 'Blazer',
  'Pathfinder', 'Murano', 'Rogue', 'Tucson', 'Santa Fe',
  'Palisade', 'Telluride', 'Sorento', 'Sportage', 'Outlander',
  'CX-5', 'CX-9', 'CX-50', 'CX-90', 'Forester', 'Outback',
  'Ascent', 'Bronco', 'Bronco Sport', 'Escape', 'Edge',
  'Sequoia', 'Armada', 'Atlas', 'Tiguan', 'ID.4',
  'Model X', 'Model Y', 'EV6', 'Ioniq 5', 'Mach-E',
  'Q5', 'Q7', 'Q8', 'X3', 'X5', 'X7', 'GLC', 'GLE', 'GLS',
  'RX', 'NX', 'TX', 'QX50', 'QX60', 'QX80', 'MDX', 'RDX',
  'XC40', 'XC60', 'XC90', 'Defender', 'Discovery', 'Velar',
  'Range Rover Sport', 'Escalade', 'XT4', 'XT5', 'XT6',
  'Aviator', 'Corsair', 'Nautilus', 'Navigator', 'GV70', 'GV80'
];

/**
 * Known van/minivan models for classification.
 * @const {string[]}
 */
const VAN_MODELS = [
  'Odyssey', 'Sienna', 'Pacifica', 'Grand Caravan', 'Carnival',
  'Sedona', 'Transit', 'Transit Connect', 'Sprinter', 'ProMaster',
  'Express', 'Savana', 'NV', 'NV200', 'Metris', 'E-Series'
];

/**
 * Economy car models for classification.
 * @const {string[]}
 */
const ECONOMY_MODELS = [
  'Yaris', 'Fit', 'Versa', 'Spark', 'Mirage', 'Sonic', 'Fiesta',
  'Rio', 'Accent', 'Bolt', 'Leaf', 'Kicks', 'Venue', 'Trax',
  'Nissan Kicks', 'HR-V', 'Kona', 'Soul', 'Seltos', 'Crosstrek'
];

/**
 * Midsize car models for classification.
 * @const {string[]}
 */
const MIDSIZE_MODELS = [
  'Civic', 'Corolla', 'Elantra', 'Jetta', 'Sentra', 'Forte',
  'Mazda3', 'Impreza', 'Golf', 'Cruze', 'Focus', 'Dart'
];

/**
 * Full-size car models for classification.
 * @const {string[]}
 */
const FULL_SIZE_MODELS = [
  'Camry', 'Accord', 'Malibu', 'Altima', 'Sonata', 'Optima', 'K5',
  'Legacy', 'Mazda6', 'Passat', 'Maxima', 'Avalon', 'Impala',
  'Charger', 'Challenger', 'Mustang', 'Camaro', '300',
  'Model 3', 'Model S', 'Polestar 2', 'EV9'
];

/**
 * Default Turo Pricing & Seasonality data by vehicle class.
 * Used to populate the Turo Pricing & Seasonality sheet.
 * @const {Object}
 */
const TURO_PRICING_DEFAULTS = {
  'Economy':        {dailyRate: 35,  utilization: 0.65, tripLength: 3, insurance: 150, registration: 200, cleaning: 25, maintenanceReserve: 0.05, flipTimeline: 14},
  'Midsize':        {dailyRate: 50,  utilization: 0.60, tripLength: 3, insurance: 175, registration: 250, cleaning: 30, maintenanceReserve: 0.05, flipTimeline: 21},
  'Full-Size':      {dailyRate: 60,  utilization: 0.55, tripLength: 4, insurance: 200, registration: 300, cleaning: 35, maintenanceReserve: 0.06, flipTimeline: 21},
  'SUV':            {dailyRate: 70,  utilization: 0.58, tripLength: 4, insurance: 225, registration: 350, cleaning: 40, maintenanceReserve: 0.06, flipTimeline: 28},
  'Truck':          {dailyRate: 65,  utilization: 0.52, tripLength: 3, insurance: 200, registration: 300, cleaning: 40, maintenanceReserve: 0.07, flipTimeline: 21},
  'Luxury':         {dailyRate: 120, utilization: 0.45, tripLength: 2, insurance: 350, registration: 500, cleaning: 60, maintenanceReserve: 0.08, flipTimeline: 35},
  'Sports/Exotic':  {dailyRate: 175, utilization: 0.35, tripLength: 2, insurance: 500, registration: 600, cleaning: 60, maintenanceReserve: 0.10, flipTimeline: 45},
  'Van/Minivan':    {dailyRate: 55,  utilization: 0.50, tripLength: 5, insurance: 175, registration: 275, cleaning: 35, maintenanceReserve: 0.06, flipTimeline: 30}
};

/**
 * Seasonal rate multipliers by month (Jan=0, Dec=11).
 * @const {number[]}
 */
const SEASONAL_RATE_MULTIPLIERS = [
  0.80, 0.85, 0.90, 1.00, 1.10, 1.20,
  1.25, 1.20, 1.00, 0.90, 0.85, 0.95
];

/**
 * Seasonal utilization multipliers by month (Jan=0, Dec=11).
 * @const {number[]}
 */
const SEASONAL_UTIL_MULTIPLIERS = [
  0.75, 0.80, 0.90, 1.00, 1.10, 1.15,
  1.20, 1.15, 1.00, 0.85, 0.80, 0.90
];

/**
 * Turo Settings keys and their default values for the Settings sheet.
 * @const {Object[]}
 */
const TURO_SETTINGS_DEFAULTS = [
  {key: 'TURO_PLATFORM_FEE_PCT', value: 0.25, description: "Turo's host cut (25% default for Go plan, up to 40%)", category: 'Turo', type: 'Percent', defaultVal: 0.25},
  {key: 'TURO_PROTECTION_PLAN', value: 'Go', description: 'Go (25%), Standard (15%), Premium (10%) — affects fee %', category: 'Turo', type: 'String', defaultVal: 'Go'},
  {key: 'TURO_AVG_TRIP_LENGTH', value: 3, description: 'Average rental trip length in days', category: 'Turo', type: 'Number', defaultVal: 3},
  {key: 'TURO_CLEANING_PER_TRIP', value: 30, description: 'Avg cleaning/detailing cost between renters', category: 'Turo', type: 'Currency', defaultVal: 30},
  {key: 'TURO_MAINTENANCE_RESERVE_PCT', value: 0.06, description: 'Annual maintenance reserve as % of acquisition cost', category: 'Turo', type: 'Percent', defaultVal: 0.06},
  {key: 'TURO_DEPRECIATION_MODEL', value: 'Tiered', description: '"Tiered" (by age), "Straight-Line", or "None"', category: 'Turo', type: 'String', defaultVal: 'Tiered'},
  {key: 'TURO_RENTAL_DEPRECIATION_ADD', value: 0.02, description: 'Additional annual depreciation from rental wear', category: 'Turo', type: 'Percent', defaultVal: 0.02},
  {key: 'TURO_FINANCING_APR', value: 0, description: '0% = cash purchase. Enter APR if financed.', category: 'Turo', type: 'Percent', defaultVal: 0},
  {key: 'TURO_FINANCING_TERM', value: 0, description: '0 = cash. Enter term in months if financed.', category: 'Turo', type: 'Number', defaultVal: 0},
  {key: 'TURO_ANNUAL_REGISTRATION', value: 275, description: 'Average annual registration/plate cost', category: 'Turo', type: 'Currency', defaultVal: 275},
  {key: 'TURO_ANNUAL_INSPECTION', value: 50, description: 'State inspection cost', category: 'Turo', type: 'Currency', defaultVal: 50},
  {key: 'TURO_USE_SEASONAL', value: false, description: 'TRUE = apply monthly multipliers from Turo Pricing sheet', category: 'Turo', type: 'Boolean', defaultVal: false},
  {key: 'TURO_MIN_SCORE', value: 50, description: 'Below this score, vehicle is flagged as poor Turo candidate', category: 'Turo', type: 'Number', defaultVal: 50},
  {key: 'TURO_WEIGHT_PAYBACK', value: 0.25, description: 'Turo Hold Score weight for payback period', category: 'Turo', type: 'Percent', defaultVal: 0.25},
  {key: 'TURO_WEIGHT_CASHFLOW', value: 0.25, description: 'Turo Hold Score weight for cash flow', category: 'Turo', type: 'Percent', defaultVal: 0.25},
  {key: 'TURO_WEIGHT_UTILIZATION', value: 0.15, description: 'Turo Hold Score weight for utilization', category: 'Turo', type: 'Percent', defaultVal: 0.15},
  {key: 'TURO_WEIGHT_DEPRECIATION', value: 0.15, description: 'Turo Hold Score weight for depreciation', category: 'Turo', type: 'Percent', defaultVal: 0.15},
  {key: 'TURO_WEIGHT_FLIP_COMPARISON', value: 0.10, description: 'Turo Hold Score weight for flip comparison', category: 'Turo', type: 'Percent', defaultVal: 0.10},
  {key: 'TURO_WEIGHT_MILEAGE', value: 0.10, description: 'Turo Hold Score weight for mileage', category: 'Turo', type: 'Percent', defaultVal: 0.10},
  {key: 'TURO_MODULE_ENABLED', value: true, description: 'Master toggle for Turo module in pipeline', category: 'Turo', type: 'Boolean', defaultVal: true}
];
