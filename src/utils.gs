// ============================================================================
// CARHAWK ULTIMATE — UTILS.GS
// Utility Functions, Distance API, Caching, Logging
// ============================================================================

// ============================================================================
// SHEET UTILITIES
// ============================================================================

/**
 * Get or create a sheet by name
 */
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * Get sheet (returns null if not exists)
 */
function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return '$0.00';
  return '$' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(value) {
  if (value === null || value === undefined || isNaN(value)) return '0.0%';
  return (Number(value) * 100).toFixed(1) + '%';
}

function formatNumber(value) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toLocaleString();
}

// ============================================================================
// MATH UTILITIES
// ============================================================================

/**
 * Clamp value between min and max
 */
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Safe division (returns 0 if denominator is 0)
 */
function safeDivide(numerator, denominator, defaultValue = 0) {
  if (!denominator || denominator === 0) return defaultValue;
  return numerator / denominator;
}

// ============================================================================
// DISTANCE CALCULATION (G-01: REAL, CACHED, NO MOCK)
// ============================================================================

/**
 * Get distance in miles between two ZIP codes
 * Uses Google Maps Distance Matrix API with caching
 */
function getDistanceMiles(originZip, destZip) {
  // Validate inputs
  if (!originZip || !destZip) {
    logSystem('Distance', 'Missing ZIP code', { originZip, destZip });
    return MAX_DISTANCE_FALLBACK;
  }

  // Normalize ZIPs
  originZip = String(originZip).trim().substring(0, 5);
  destZip = String(destZip).trim().substring(0, 5);

  // Same ZIP = 0 distance
  if (originZip === destZip) return 0;

  // Check cache first
  const cacheKey = `dist:${originZip}:${destZip}`;
  const cached = getCachedDistance(cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Check if real API is enabled
  if (!FEATURE_FLAGS.USE_REAL_DISTANCE_API) {
    return calculateFallbackDistance(originZip, destZip);
  }

  // Get API key
  const apiKey = getApiKey('GOOGLE_MAPS');
  if (!apiKey) {
    logSystem('Distance', 'No Google Maps API key configured');
    return calculateFallbackDistance(originZip, destZip);
  }

  // Call Google Maps Distance Matrix API
  try {
    const distance = fetchGoogleMapsDistance(originZip, destZip, apiKey);

    // Cache the result
    setCachedDistance(cacheKey, distance);

    return distance;
  } catch (error) {
    logSystem('Distance API Error', error.toString(), { originZip, destZip });
    return calculateFallbackDistance(originZip, destZip);
  }
}

/**
 * Fetch distance from Google Maps Distance Matrix API
 */
function fetchGoogleMapsDistance(originZip, destZip, apiKey) {
  const url = `${API_CONFIG.GOOGLE_MAPS.DISTANCE_MATRIX_URL}?` +
    `origins=${originZip},USA&` +
    `destinations=${destZip},USA&` +
    `units=imperial&` +
    `key=${apiKey}`;

  let lastError = null;

  for (let attempt = 0; attempt <= API_CONFIG.GOOGLE_MAPS.MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {
        muteHttpExceptions: true,
        headers: { 'Accept': 'application/json' }
      });

      const code = response.getResponseCode();
      const body = JSON.parse(response.getContentText());

      if (code === 200 && body.status === 'OK') {
        const element = body.rows[0]?.elements[0];

        if (element?.status === 'OK') {
          // Distance is in meters, convert to miles
          const meters = element.distance.value;
          const miles = Math.round(meters / 1609.34);
          return miles;
        } else {
          // Element status not OK (e.g., ZERO_RESULTS)
          logSystem('Distance API', `Element status: ${element?.status}`, { originZip, destZip });
          return MAX_DISTANCE_FALLBACK;
        }
      } else {
        lastError = `API status: ${body.status || code}`;
      }
    } catch (e) {
      lastError = e.toString();
    }

    // Wait before retry
    if (attempt < API_CONFIG.GOOGLE_MAPS.MAX_RETRIES) {
      Utilities.sleep(API_CONFIG.GOOGLE_MAPS.RETRY_DELAY_MS);
    }
  }

  throw new Error(lastError || 'Distance API failed after retries');
}

/**
 * Fallback distance calculation using ZIP code approximation
 * Only used when API is unavailable
 */
function calculateFallbackDistance(originZip, destZip) {
  // This is a rough approximation based on ZIP prefix regions
  // NOT as accurate as real API, but better than random
  const o = parseInt(originZip.substring(0, 3));
  const d = parseInt(destZip.substring(0, 3));

  // Approximate: each 3-digit prefix difference ≈ ~50-100 miles average
  const diff = Math.abs(o - d);

  // Apply regional scaling (ZIPs are roughly geographic)
  let distance;
  if (diff === 0) {
    distance = Math.abs(parseInt(originZip) - parseInt(destZip)) * 0.5;
  } else if (diff <= 5) {
    distance = diff * 30;
  } else if (diff <= 20) {
    distance = 150 + (diff - 5) * 50;
  } else {
    distance = 900 + (diff - 20) * 20;
  }

  return Math.min(Math.round(distance), 2500);
}

// ============================================================================
// CACHE UTILITIES (using CacheService)
// ============================================================================

/**
 * Get cached distance value
 */
function getCachedDistance(key) {
  try {
    const cache = CacheService.getScriptCache();
    const value = cache.get(key);
    if (value !== null) {
      return parseInt(value);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Set cached distance value
 */
function setCachedDistance(key, value) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put(key, String(value), DISTANCE_CACHE_TTL_SECONDS);
  } catch (e) {
    // Cache failure is non-critical
    logSystem('Cache', `Failed to cache distance: ${e.toString()}`);
  }
}

/**
 * Get cached value (generic)
 */
function getCached(key) {
  try {
    const cache = CacheService.getScriptCache();
    const value = cache.get(key);
    if (value !== null) {
      return JSON.parse(value);
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Set cached value (generic)
 */
function setCached(key, value, ttlSeconds = 3600) {
  try {
    const cache = CacheService.getScriptCache();
    cache.put(key, JSON.stringify(value), ttlSeconds);
  } catch (e) {
    // Non-critical
  }
}

// ============================================================================
// LOGGING UTILITIES
// ============================================================================

/**
 * Log to System Logs sheet
 */
function logSystem(action, details, metadata = null) {
  try {
    const sheet = getOrCreateSheet(SHEETS.LOGS);
    const timestamp = new Date();
    const user = Session.getActiveUser().getEmail() || 'system';
    const metaStr = metadata ? JSON.stringify(metadata) : '';

    sheet.appendRow([timestamp, action, details, user, metaStr]);

    // Keep log size manageable (max 5000 rows)
    const rowCount = sheet.getLastRow();
    if (rowCount > 5000) {
      sheet.deleteRows(2, rowCount - 5000);
    }
  } catch (e) {
    console.error('Logging failed:', e);
  }
}

/**
 * Log to System Health sheet (for monitoring)
 */
function logHealth(component, status, message, metrics = null) {
  try {
    const sheet = getOrCreateSheet(SHEETS.SYSTEM_HEALTH);
    const timestamp = new Date();
    const metricsStr = metrics ? JSON.stringify(metrics) : '';

    sheet.appendRow([timestamp, component, status, message, metricsStr]);

    // Keep log size manageable
    const rowCount = sheet.getLastRow();
    if (rowCount > 1000) {
      sheet.deleteRows(2, rowCount - 1000);
    }
  } catch (e) {
    console.error('Health logging failed:', e);
  }
}

/**
 * Log CRM sync activity
 */
function logCrmSync(platform, action, leadId, status, payload, response) {
  try {
    const sheet = getOrCreateSheet(SHEETS.CRM_SYNC_LOG);
    const timestamp = new Date();

    sheet.appendRow([
      timestamp,
      platform,
      action,
      leadId,
      status,
      JSON.stringify(payload).substring(0, 1000), // Truncate large payloads
      JSON.stringify(response).substring(0, 500)
    ]);

    // Keep log size manageable
    const rowCount = sheet.getLastRow();
    if (rowCount > 2000) {
      sheet.deleteRows(2, rowCount - 2000);
    }
  } catch (e) {
    console.error('CRM sync logging failed:', e);
  }
}

// ============================================================================
// EXTRACTION UTILITIES
// ============================================================================

/**
 * Extract year from text (1990-2099)
 */
function extractYear(text) {
  if (!text) return '';
  const match = String(text).match(/\b(19[9][0-9]|20[0-9]{2})\b/);
  return match ? match[0] : '';
}

/**
 * Extract make from text
 */
function extractMake(text) {
  if (!text) return '';
  const textLower = String(text).toLowerCase();

  // Check all known makes
  for (const make of Object.keys(MAKE_PREMIUM)) {
    if (make === 'Other') continue;
    if (textLower.includes(make.toLowerCase())) {
      return make;
    }
  }
  return '';
}

/**
 * Extract model from text (word after make)
 */
function extractModel(text, make) {
  if (!text || !make) return '';
  const regex = new RegExp(make + '\\s+(\\w+)', 'i');
  const match = String(text).match(regex);
  return match ? match[1] : '';
}

/**
 * Extract mileage from text
 */
function extractMileage(text) {
  if (!text) return 0;
  const match = String(text).match(/(\d{1,3}[,\s]?\d{3})\s*(mi|miles|k|km)?/i);
  if (match) {
    return parseInt(match[1].replace(/[,\s]/g, ''));
  }
  return 0;
}

/**
 * Extract ZIP code from text
 */
function extractZip(text) {
  if (!text) return '';
  const match = String(text).match(/\b(\d{5})(?:-\d{4})?\b/);
  return match ? match[1] : '';
}

/**
 * Extract phone number from text
 */
function extractPhone(text) {
  if (!text) return '';
  const match = String(text).match(/\b(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})\b/);
  return match ? match[1].replace(/[-.\s]/g, '') : '';
}

/**
 * Extract email from text
 */
function extractEmail(text) {
  if (!text) return '';
  const match = String(text).match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/i);
  return match ? match[0].toLowerCase() : '';
}

/**
 * Parse price from string
 */
function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = String(priceStr).replace(/[^0-9.]/g, '');
  return parseInt(cleaned) || 0;
}

/**
 * Calculate days since a date
 */
function daysSince(dateStr) {
  if (!dateStr) return 21; // Default assumption
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 21;
    const now = new Date();
    const days = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  } catch (e) {
    return 21;
  }
}

/**
 * Extract seller first name
 */
function extractFirstName(sellerInfo) {
  if (!sellerInfo) return '';
  const name = String(sellerInfo).trim().split(/\s+/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

// ============================================================================
// VEHICLE INFO EXTRACTION (combined)
// ============================================================================

/**
 * Extract all vehicle info from title and description
 */
function extractVehicleInfo(title, description) {
  const combined = `${title || ''} ${description || ''}`;

  const year = extractYear(combined);
  const make = extractMake(combined);
  const model = extractModel(combined, make);
  const mileage = extractMileage(combined);

  return {
    year: year,
    make: make,
    model: model,
    trim: '', // Would need more sophisticated parsing
    mileage: mileage
  };
}

// ============================================================================
// LOOKUP UTILITIES
// ============================================================================

/**
 * Get mileage factor from brackets
 */
function getMileageFactor(mileage) {
  const miles = parseInt(mileage) || 100000;
  for (const bracket of MILEAGE_FACTOR) {
    if (miles <= bracket.max) {
      return bracket.factor;
    }
  }
  return 0.85; // Default for very high mileage
}

/**
 * Get make premium (with fallback)
 */
function getMakePremium(make) {
  if (!make) return MAKE_PREMIUM['Other'];
  return MAKE_PREMIUM[make] || MAKE_PREMIUM['Other'];
}

/**
 * Get platform weight (with fallback)
 */
function getPlatformWeight(platform) {
  if (!platform) return PLATFORM_WEIGHTS['unknown'];
  return PLATFORM_WEIGHTS[platform] || PLATFORM_WEIGHTS['unknown'];
}

/**
 * Get capital tier from total investment
 */
function getCapitalTier(totalInvestment) {
  const amount = parseFloat(totalInvestment) || 0;
  for (const tier of CAPITAL_TIERS) {
    if (amount <= tier.max) {
      return tier;
    }
  }
  return CAPITAL_TIERS[CAPITAL_TIERS.length - 1];
}

/**
 * Get base value by vehicle age
 */
function getBaseValueByAge(ageYears) {
  const age = parseInt(ageYears) || 12;
  for (const bracket of BASE_VALUE_BY_AGE) {
    if (age <= bracket.maxAge) {
      return bracket.value;
    }
  }
  return 4000;
}

/**
 * Get velocity base score by days listed
 */
function getVelocityBaseByDays(daysListed) {
  const days = parseInt(daysListed) || 21;
  for (const bracket of VELOCITY_BY_DAYS) {
    if (days <= bracket.maxDays) {
      return bracket.score;
    }
  }
  return 30;
}

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate unique ID with prefix
 */
function generateId(prefix = 'CH') {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${prefix}${timestamp}${random}`.toUpperCase();
}

// ============================================================================
// KEYWORD DETECTION
// ============================================================================

/**
 * Check if text contains any part-out trigger keywords
 */
function containsPartOutKeywords(text) {
  if (!text) return false;
  const textLower = String(text).toLowerCase();

  for (const keyword of STRATEGY_THRESHOLDS.PART_OUT_TRIGGER_KEYWORDS) {
    if (textLower.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * Get all matching part-out keywords in text
 */
function getPartOutKeywords(text) {
  if (!text) return [];
  const textLower = String(text).toLowerCase();
  const matches = [];

  for (const keyword of STRATEGY_THRESHOLDS.PART_OUT_TRIGGER_KEYWORDS) {
    if (textLower.includes(keyword.toLowerCase())) {
      matches.push(keyword);
    }
  }
  return matches;
}
