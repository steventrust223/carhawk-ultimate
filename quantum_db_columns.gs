// =========================================================
// FILE: quantum_db_columns.gs - Master Database column map
//                               and CompanyHub stage contract
// =========================================================
//
// WHY THIS FILE EXISTS
//
// Master Database rows were read by hard-coded numeric index in nine
// places across seven files. Three of those indices were off by one:
// Stage was read at 50 (which is Notes), Contact Count at 51 (which is
// Stage), and Response Rate at 54 (which is Next Action). Every stage
// comparison in the codebase therefore tested an empty Notes cell and
// silently failed, and the CompanyHub export mapped every deal to its
// default stage regardless of where the deal actually stood.
//
// The column order is defined by setupDatabaseHeaders() in
// quantum_headers.gs and written by the row builder in
// quantum_import.gs. Both produce 61 columns. QUANTUM_DB_COL below is
// the single source of truth for reading them back. Add a column to the
// header list and you must add it here; never re-introduce a bare index.

/**
 * Named column indices for the Master Database sheet (0-based).
 * Mirrors setupDatabaseHeaders() in quantum_headers.gs exactly.
 */
var QUANTUM_DB_COL = Object.freeze({
  DEAL_ID: 0,
  IMPORT_DATE: 1,
  PLATFORM: 2,
  STATUS: 3,
  PRIORITY: 4,
  YEAR: 5,
  MAKE: 6,
  MODEL: 7,
  TRIM: 8,
  VIN: 9,
  MILEAGE: 10,
  COLOR: 11,
  TITLE: 12,
  PRICE: 13,
  LOCATION: 14,
  ZIP: 15,
  DISTANCE: 16,
  LOCATION_RISK: 17,
  LOCATION_FLAG: 18,
  CONDITION: 19,
  CONDITION_SCORE: 20,
  REPAIR_KEYWORDS: 21,
  REPAIR_RISK_SCORE: 22,
  EST_REPAIR_COST: 23,
  MARKET_VALUE: 24,
  MAO: 25,
  PROFIT_MARGIN: 26,
  ROI: 27,
  CAPITAL_TIER: 28,
  FLIP_STRATEGY: 29,
  SALES_VELOCITY: 30,
  MARKET_ADVANTAGE: 31,
  DAYS_LISTED: 32,
  SELLER_NAME: 33,
  SELLER_PHONE: 34,
  SELLER_EMAIL: 35,
  SELLER_TYPE: 36,
  DEAL_FLAG: 37,
  HOT_SELLER: 38,
  MULTIPLE_VEHICLES: 39,
  SELLER_MESSAGE: 40,
  AI_CONFIDENCE: 41,
  VERDICT: 42,
  VERDICT_ICON: 43,
  RECOMMENDED: 44,
  IMAGE_SCORE: 45,
  ENGAGEMENT_SCORE: 46,
  COMPETITION_LEVEL: 47,
  LAST_UPDATED: 48,
  ASSIGNED_TO: 49,
  NOTES: 50,
  STAGE: 51,
  CONTACT_COUNT: 52,
  LAST_CONTACT: 53,
  NEXT_ACTION: 54,
  RESPONSE_RATE: 55,
  SMS_COUNT: 56,
  CALL_COUNT: 57,
  EMAIL_COUNT: 58,
  MEETING_SCHEDULED: 59,
  FOLLOWUP_STATUS: 60
});

/** Total Master Database column count. Guards against silent drift. */
var QUANTUM_DB_COLUMN_COUNT = 61;

/**
 * CarHawk internal pipeline stages, as written to QUANTUM_DB_COL.STAGE.
 */
var CARHAWK_STAGES = Object.freeze([
  'IMPORTED',
  'CONTACTED',
  'RESPONDED',
  'APPOINTMENT_SET',
  'NEGOTIATING',
  'CLOSED_WON',
  'LOST'
]);

/**
 * The unified CompanyHub pipeline, 12 stages, per Unified CRM Blueprint
 * v1.0 Section C. These strings must match the CompanyHub stage names
 * exactly. 'Negotiating' is not 'Negotiation'; 'Closed' is not
 * 'Closed Won'; 'Dead' is not 'Closed Lost'.
 */
var COMPANYHUB_STAGES = Object.freeze([
  'New Lead',
  'Analyzed',
  'Contact Ready',
  'Contacted',
  'Engaged',
  'Appointment Set',
  'Negotiating',
  'Under Contract',
  'Closing',
  'Closed',
  'Dead',
  'Nurture'
]);

/**
 * CarHawk stage -> CompanyHub stage.
 *
 * Blueprint stages with no CarHawk equivalent (Analyzed, Contact Ready,
 * Under Contract, Closing, Nurture) are CompanyHub-side or manual
 * transitions. Do not invent CarHawk constants for them.
 */
var CARHAWK_TO_COMPANYHUB_STAGE = Object.freeze({
  'IMPORTED': 'New Lead',
  'CONTACTED': 'Contacted',
  'RESPONDED': 'Engaged',
  'APPOINTMENT_SET': 'Appointment Set',
  'NEGOTIATING': 'Negotiating',
  'CLOSED_WON': 'Closed',
  'LOST': 'Dead'
});

/**
 * Verifies that the live Master Database header row still matches
 * QUANTUM_DB_COL. Run after any schema change.
 *
 * @return {{ok: boolean, problems: Array<string>}} Validation result.
 */
function validateQuantumDbColumns() {
  var problems = [];
  var sheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);

  if (!sheet) {
    return { ok: false, problems: ['Master Database sheet not found.'] };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.length !== QUANTUM_DB_COLUMN_COUNT) {
    problems.push(
      'Expected ' + QUANTUM_DB_COLUMN_COUNT + ' columns, found ' + headers.length + '.'
    );
  }

  var expected = {
    PRIORITY: 'Priority',
    VERDICT: 'Verdict',
    RECOMMENDED: 'Recommended?',
    FLIP_STRATEGY: 'Flip Strategy',
    NOTES: 'Notes',
    STAGE: 'Stage',
    CONTACT_COUNT: 'Contact Count',
    RESPONSE_RATE: 'Response Rate'
  };

  Object.keys(expected).forEach(function(key) {
    var idx = QUANTUM_DB_COL[key];
    if (headers[idx] !== expected[key]) {
      problems.push(
        'Column ' + idx + ' should be "' + expected[key] +
        '" but is "' + headers[idx] + '".'
      );
    }
  });

  return { ok: problems.length === 0, problems: problems };
}
