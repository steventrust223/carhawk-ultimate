// ==========================================
// CARHAWK ULTIMATE - UTILITIES MODULE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Shared utility functions for formatting, calculations, and helpers
// ==========================================

/**
 * SHEET HELPERS
 */

/**
 * Get or create a sheet by name
 * @param {string} sheetName - Name of the sheet
 * @return {Sheet} The sheet object
 */
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    logSystem('SHEET_CREATED', `Created new sheet: ${sheetName}`);
  }

  return sheet;
}

/**
 * Get sheet safely without creating it
 * @param {string} sheetName - Name of the sheet
 * @return {Sheet|null} The sheet object or null if not found
 */
function getSheetSafe(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName);
}

/**
 * Clear sheet contents while preserving headers
 * @param {string} sheetName - Name of the sheet to clear
 */
function clearSheetData(sheetName) {
  const sheet = getSheetSafe(sheetName);
  if (!sheet) return;

  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
  }
}

/**
 * Get all data from a sheet as array of objects
 * @param {string} sheetName - Name of the sheet
 * @return {Array<Object>} Array of row objects
 */
function getSheetData(sheetName) {
  const sheet = getSheetSafe(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }

  return rows;
}

/**
 * FORMATTING FUNCTIONS
 */

/**
 * Format number as currency
 * @param {number} value - The number to format
 * @return {string} Formatted currency string
 */
function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '$0.00';
  const num = Number(value);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format number as percentage
 * @param {number} value - The decimal value (0.15 = 15%)
 * @param {number} decimals - Number of decimal places (default 1)
 * @return {string} Formatted percentage string
 */
function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || value === '') return '0%';
  const num = Number(value);
  if (isNaN(num)) return '0%';
  return (num * 100).toFixed(decimals) + '%';
}

/**
 * Format number with commas
 * @param {number} value - The number to format
 * @return {string} Formatted number string
 */
function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '0';
  const num = Number(value);
  if (isNaN(num)) return '0';
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * Format phone number
 * @param {string} phone - Raw phone number
 * @return {string} Formatted phone number
 */
function formatPhone(phone) {
  if (!phone) return '';
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }
  return phone;
}

/**
 * DISTANCE & LOCATION FUNCTIONS
 */

/**
 * Calculate distance between two ZIP codes using Google Maps API
 * @param {string} zip1 - First ZIP code
 * @param {string} zip2 - Second ZIP code
 * @return {number} Distance in miles
 */
function calculateDistance(zip1, zip2) {
  if (!zip1 || !zip2) return 0;

  // Check cache first
  const cacheKey = `distance_${zip1}_${zip2}`;
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);

  if (cached) {
    return Number(cached);
  }

  try {
    // Use Maps API if available
    const origin = zip1 + ', USA';
    const destination = zip2 + ', USA';

    const directions = Maps.newDirectionFinder()
      .setOrigin(origin)
      .setDestination(destination)
      .setMode(Maps.DirectionFinder.Mode.DRIVING)
      .getDirections();

    if (directions.routes && directions.routes.length > 0) {
      const route = directions.routes[0];
      const distanceMeters = route.legs[0].distance.value;
      const distanceMiles = distanceMeters * 0.000621371; // Convert to miles

      // Cache for 24 hours
      cache.put(cacheKey, distanceMiles.toString(), 86400);

      return Math.round(distanceMiles);
    }
  } catch (e) {
    logError('DISTANCE_CALC_ERROR', `Failed to calculate distance: ${e.message}`);
  }

  // Fallback: estimate based on ZIP code difference
  return estimateDistanceByZIP(zip1, zip2);
}

/**
 * Estimate distance based on ZIP code difference (fallback)
 * @param {string} zip1 - First ZIP code
 * @param {string} zip2 - Second ZIP code
 * @return {number} Estimated distance in miles
 */
function estimateDistanceByZIP(zip1, zip2) {
  const z1 = parseInt(zip1);
  const z2 = parseInt(zip2);

  if (isNaN(z1) || isNaN(z2)) return 0;

  const diff = Math.abs(z1 - z2);

  // Rough approximation: 1 ZIP unit ≈ 0.5 miles on average
  return Math.min(Math.round(diff * 0.5), 500);
}

/**
 * Get location risk tier based on distance
 * @param {number} distance - Distance in miles
 * @return {string} Risk tier label
 */
function getLocationRisk(distance) {
  if (distance <= DISTANCE_TIERS.LOCAL.max) return DISTANCE_TIERS.LOCAL.label;
  if (distance <= DISTANCE_TIERS.REGIONAL.max) return DISTANCE_TIERS.REGIONAL.label;
  if (distance <= DISTANCE_TIERS.DISTANT.max) return DISTANCE_TIERS.DISTANT.label;
  return DISTANCE_TIERS.REMOTE.label;
}

/**
 * Get location risk multiplier
 * @param {number} distance - Distance in miles
 * @return {number} Risk multiplier (0-1)
 */
function getLocationRiskMultiplier(distance) {
  if (distance <= DISTANCE_TIERS.LOCAL.max) return DISTANCE_TIERS.LOCAL.risk;
  if (distance <= DISTANCE_TIERS.REGIONAL.max) return DISTANCE_TIERS.REGIONAL.risk;
  if (distance <= DISTANCE_TIERS.DISTANT.max) return DISTANCE_TIERS.DISTANT.risk;
  return DISTANCE_TIERS.REMOTE.risk;
}

/**
 * DATE & TIME FUNCTIONS
 */

/**
 * Get current timestamp
 * @return {Date} Current date/time
 */
function now() {
  return new Date();
}

/**
 * Calculate minutes elapsed since a timestamp
 * @param {Date|string} timestamp - The past timestamp
 * @return {number} Minutes elapsed
 */
function minutesSince(timestamp) {
  if (!timestamp) return 0;

  const past = new Date(timestamp);
  const current = new Date();
  const diff = current - past;

  return Math.floor(diff / (1000 * 60));
}

/**
 * Format timestamp for display
 * @param {Date|string} timestamp - The timestamp to format
 * @return {string} Formatted timestamp
 */
function formatTimestamp(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}

/**
 * Get relative time string (e.g., "5 mins ago", "2 hours ago")
 * @param {Date|string} timestamp - The past timestamp
 * @return {string} Relative time string
 */
function getRelativeTime(timestamp) {
  if (!timestamp) return 'Unknown';

  const mins = minutesSince(timestamp);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/**
 * TEXT PARSING FUNCTIONS
 */

/**
 * Extract price from text
 * @param {string} text - Text containing price
 * @return {number} Extracted price or 0
 */
function parsePrice(text) {
  if (!text) return 0;

  // Remove currency symbols and commas
  const cleaned = text.toString().replace(/[$,]/g, '');

  // Extract first number
  const match = cleaned.match(/\d+/);
  if (match) {
    return parseInt(match[0]);
  }

  return 0;
}

/**
 * Extract ZIP code from location string
 * @param {string} location - Location text
 * @return {string} ZIP code or empty string
 */
function extractZIP(location) {
  if (!location) return '';

  const match = location.match(/\b\d{5}\b/);
  return match ? match[0] : '';
}

/**
 * Extract phone number from text
 * @param {string} text - Text containing phone number
 * @return {string} Phone number or empty string
 */
function extractPhone(text) {
  if (!text) return '';

  // Match various phone formats
  const patterns = [
    /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    /\d{10}/
  ];

  for (let pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return '';
}

/**
 * Extract email from text
 * @param {string} text - Text containing email
 * @return {string} Email or empty string
 */
function extractEmail(text) {
  if (!text) return '';

  const match = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return match ? match[0] : '';
}

/**
 * Check if text contains enthusiast markers
 * @param {string} text - Text to check
 * @return {boolean} True if enthusiast vehicle detected
 */
function isEnthusiastVehicle(text) {
  if (!text) return false;

  const lower = text.toLowerCase();

  // Check makes
  for (let make of ENTHUSIAST_MARKERS.makes) {
    if (lower.includes(make.toLowerCase())) return true;
  }

  // Check models
  for (let model of ENTHUSIAST_MARKERS.models) {
    if (lower.includes(model.toLowerCase())) return true;
  }

  // Check keywords
  for (let keyword of ENTHUSIAST_MARKERS.keywords) {
    if (lower.includes(keyword.toLowerCase())) return true;
  }

  return false;
}

/**
 * Extract hazard flags from description
 * @param {string} description - Vehicle description
 * @return {string} Comma-separated hazard flags
 */
function extractHazardFlags(description) {
  if (!description) return '';

  const lower = description.toLowerCase();
  const flags = [];

  // Check critical flags
  for (let flag of HAZARD_FLAGS.critical) {
    if (lower.includes(flag)) {
      flags.push('🚨 ' + flag.toUpperCase());
    }
  }

  // Check high flags
  for (let flag of HAZARD_FLAGS.high) {
    if (lower.includes(flag)) {
      flags.push('⚠️ ' + flag);
    }
  }

  // Check medium flags
  for (let flag of HAZARD_FLAGS.medium) {
    if (lower.includes(flag)) {
      flags.push('⚡ ' + flag);
    }
  }

  return flags.join(', ');
}

/**
 * VEHICLE DATA HELPERS
 */

/**
 * Determine capital tier based on asking price
 * @param {number} price - Asking price
 * @return {string} Capital tier label
 */
function getCapitalTier(price) {
  if (price <= CAPITAL_TIERS.MICRO.max) return CAPITAL_TIERS.MICRO.label;
  if (price <= CAPITAL_TIERS.BUDGET.max) return CAPITAL_TIERS.BUDGET.label;
  if (price <= CAPITAL_TIERS.STANDARD.max) return CAPITAL_TIERS.STANDARD.label;
  if (price <= CAPITAL_TIERS.PREMIUM.max) return CAPITAL_TIERS.PREMIUM.label;
  return CAPITAL_TIERS.LUXURY.label;
}

/**
 * Get minimum profit for capital tier
 * @param {number} price - Asking price
 * @return {number} Minimum profit required
 */
function getMinProfitForTier(price) {
  if (price <= CAPITAL_TIERS.MICRO.max) return CAPITAL_TIERS.MICRO.minProfit;
  if (price <= CAPITAL_TIERS.BUDGET.max) return CAPITAL_TIERS.BUDGET.minProfit;
  if (price <= CAPITAL_TIERS.STANDARD.max) return CAPITAL_TIERS.STANDARD.minProfit;
  if (price <= CAPITAL_TIERS.PREMIUM.max) return CAPITAL_TIERS.PREMIUM.minProfit;
  return CAPITAL_TIERS.LUXURY.minProfit;
}

/**
 * Get condition score from condition string
 * @param {string} condition - Condition label
 * @return {number} Condition score (0-100)
 */
function getConditionScore(condition) {
  if (!condition) return CONDITION_SCORES['Unknown'];

  for (let key in CONDITION_SCORES) {
    if (condition.toLowerCase().includes(key.toLowerCase())) {
      return CONDITION_SCORES[key];
    }
  }

  return CONDITION_SCORES['Unknown'];
}

/**
 * Get title risk multiplier
 * @param {string} titleStatus - Title status
 * @return {number} Risk multiplier (0-1)
 */
function getTitleRiskMultiplier(titleStatus) {
  if (!titleStatus) return TITLE_RISK['Unknown'];

  for (let key in TITLE_RISK) {
    if (titleStatus.toLowerCase().includes(key.toLowerCase())) {
      return TITLE_RISK[key];
    }
  }

  return TITLE_RISK['Unknown'];
}

/**
 * LOGGING FUNCTIONS
 */

/**
 * Log system event
 * @param {string} action - Action type
 * @param {string} details - Event details
 */
function logSystem(action, details) {
  try {
    const sheet = getSheetSafe(SHEETS.LOGS.name);
    if (!sheet) return;

    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail();

    sheet.appendRow([timestamp, action, details, user]);
  } catch (e) {
    // Silent fail - don't break execution
    console.log(`Log error: ${e.message}`);
  }
}

/**
 * Log error
 * @param {string} action - Action that failed
 * @param {string} error - Error message
 */
function logError(action, error) {
  logSystem('ERROR', `${action}: ${error}`);
  console.error(`[${action}] ${error}`);
}

/**
 * CONFIGURATION HELPERS
 */

/**
 * Get configuration value
 * @param {string} key - Config key
 * @return {string} Config value
 */
function getConfig(key) {
  try {
    const sheet = getSheetSafe(SHEETS.CONFIG.name);
    if (!sheet) return '';

    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
  } catch (e) {
    logError('GET_CONFIG', e.message);
  }

  return '';
}

/**
 * Set configuration value
 * @param {string} key - Config key
 * @param {string} value - Config value
 */
function setConfig(key, value) {
  try {
    const sheet = getSheet(SHEETS.CONFIG.name);
    const data = sheet.getDataRange().getValues();

    // Find existing key
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(value);
        return;
      }
    }

    // Add new key
    sheet.appendRow([key, value]);
  } catch (e) {
    logError('SET_CONFIG', e.message);
  }
}

/**
 * MISCELLANEOUS HELPERS
 */

/**
 * Generate unique ID
 * @return {string} Unique ID
 */
function generateID() {
  return Utilities.getUuid();
}

/**
 * Sleep for specified milliseconds
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
  Utilities.sleep(ms);
}

/**
 * Batch process array in chunks
 * @param {Array} array - Array to process
 * @param {number} chunkSize - Size of each chunk
 * @param {Function} callback - Function to call for each chunk
 */
function processInBatches(array, chunkSize, callback) {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    callback(chunk, i);
  }
}

/**
 * Get user email
 * @return {string} User email
 */
function getUserEmail() {
  return Session.getActiveUser().getEmail() || Session.getEffectiveUser().getEmail();
}

/**
 * Send email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} body - Email body (HTML)
 */
function sendEmail(to, subject, body) {
  try {
    MailApp.sendEmail({
      to: to,
      subject: subject,
      htmlBody: body
    });
    logSystem('EMAIL_SENT', `Sent to: ${to}`);
  } catch (e) {
    logError('EMAIL_ERROR', e.message);
  }
}
