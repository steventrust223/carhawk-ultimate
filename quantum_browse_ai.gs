// =========================================================
// FILE: quantum-browse-ai.gs - Browse.AI Integration
// =========================================================
// Enhanced with platform-specific robot awareness.
// Uses ROBOT_REGISTRY from quantum_robots.gs for per-platform
// column mappings, field extraction, and seller detection.
// =========================================================

function importFromBrowseAI() {
  const ui = SpreadsheetApp.getUi();

  // Get integration settings
  const integrations = getActiveIntegrations();
  const browseAIIntegrations = integrations.filter(i => i.provider === 'Browse.ai');

  if (browseAIIntegrations.length === 0) {
    ui.alert('No Browse.ai integrations configured.\n\nUse "Register Robot" from the CarHawk menu to add one,\nor run registerRobotUI() to get started.');
    return;
  }

  let totalImported = 0;
  const importResults = [];

  for (const integration of browseAIIntegrations) {
    try {
      const result = processBrowseAIIntegration(integration);
      totalImported += result.imported;
      importResults.push({
        platform: integration.notes || 'Unknown',
        name: integration.name,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors
      });

      // Update integration status
      updateIntegrationSync(integration.integrationId, result.imported);

    } catch (error) {
      logQuantum('Browse.ai Import Error', `${integration.name}: ${error.toString()}`);
      updateIntegrationError(integration.integrationId, error.toString());
      importResults.push({
        platform: integration.notes || 'Unknown',
        name: integration.name,
        imported: 0,
        skipped: 0,
        errors: [error.toString()]
      });
    }
  }

  // Build summary
  const summary = importResults.map(r =>
    `${r.platform}: ${r.imported} imported, ${r.skipped} skipped` +
    (r.errors && r.errors.length > 0 ? ` (${r.errors.length} errors)` : '')
  ).join('\n');

  ui.alert(`Browse.ai Import Complete!\n\nTotal imported: ${totalImported}\n\n${summary}`);
}

function processBrowseAIIntegration(integration) {
  const sheetId = integration.key;

  // Open the Browse.ai export sheet
  let sourceSheet;
  try {
    const sourceSpreadsheet = SpreadsheetApp.openById(sheetId);
    sourceSheet = sourceSpreadsheet.getActiveSheet();
  } catch (error) {
    throw new Error('Cannot access Browse.ai sheet. Check sharing permissions.');
  }

  const data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) {
    return { imported: 0, skipped: 0, errors: [] };
  }

  // Determine platform from integration config
  const platform = integration.notes || 'Other';

  // Get platform-specific column map (from ROBOT_REGISTRY)
  const headers = data[0];
  const columnMap = mapBrowseAIColumnsPlatform(headers, platform);

  // Import to Master Import sheet
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  let imported = 0;
  let skipped = 0;
  const errors = [];

  // Track processed URLs to avoid duplicates
  const processedUrls = getProcessedUrls();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    try {
      // Resolve URL from multiple possible columns
      const url = resolveField(row, columnMap, 'url') || '';

      // Skip if empty URL or already processed
      if (!url) {
        skipped++;
        continue;
      }
      if (processedUrls.includes(url)) {
        skipped++;
        continue;
      }

      // Use advanced platform detection if integration notes are missing
      const detectedPlatform = platform !== 'Other' ? platform : detectPlatformFromURLAdvanced(url);

      // Extract all available fields using platform-aware mapping
      const title = resolveField(row, columnMap, 'title') || '';
      const price = resolveField(row, columnMap, 'price') || '';
      const location = resolveField(row, columnMap, 'location') || '';
      const description = resolveField(row, columnMap, 'description') || '';
      const sellerInfo = resolveField(row, columnMap, 'sellerInfo') || '';
      const postedDate = resolveField(row, columnMap, 'postedDate') || '';
      const imageCount = resolveField(row, columnMap, 'images') || 0;

      // Extract enhanced fields (mileage, condition, VIN, year, etc.)
      const mileage = resolveField(row, columnMap, 'mileage') || '';
      const year = resolveField(row, columnMap, 'year') || '';
      const condition = resolveField(row, columnMap, 'condition') || '';
      const vin = resolveField(row, columnMap, 'vin') || '';
      const transmission = resolveField(row, columnMap, 'transmission') || '';
      const fuelType = resolveField(row, columnMap, 'fuelType') || '';
      const bodyStyle = resolveField(row, columnMap, 'bodyStyle') || '';
      const exteriorColor = resolveField(row, columnMap, 'exteriorColor') || '';
      const drivetrain = resolveField(row, columnMap, 'drivetrain') || '';
      const titleStatus = resolveField(row, columnMap, 'titleStatus') || '';

      // Platform-specific extra fields
      const extras = extractPlatformExtras(row, columnMap, detectedPlatform);

      // Detect seller type using platform-specific keywords
      const sellerType = detectSellerType(sellerInfo, description, detectedPlatform);

      // Extract listing ID from URL
      const listingId = extractListingId(url, detectedPlatform) || '';

      // Build enhanced description with extracted structured fields
      const enhancedDescription = buildEnhancedDescription(description, {
        mileage, condition, vin, transmission, fuelType,
        bodyStyle, exteriorColor, drivetrain, titleStatus,
        sellerType, listingId, extras
      });

      // Build enhanced seller info
      const enhancedSellerInfo = buildEnhancedSellerInfo(sellerInfo, sellerType, extras);

      // Prepare import row (19 columns matching expanded Master Import schema)
      // Columns 12-14 carry pre-extracted Browse.ai robot fields for downstream parsing
      const importRow = [
        generateQuantumId('IMP'),    // Import ID
        new Date(),                   // Date (GMT)
        resolveField(row, columnMap, 'jobLink') || '', // Job Link
        url,                          // Origin URL
        detectedPlatform,             // Platform
        title,                        // Raw Title
        price,                        // Raw Price
        location,                     // Raw Location
        enhancedDescription,          // Raw Description (enhanced with structured data)
        enhancedSellerInfo,           // Seller Info (enhanced with type detection)
        postedDate,                   // Posted Date
        imageCount,                   // Images Count
        mileage,                      // Raw Mileage (pre-extracted by Browse.ai robot)
        year,                         // Raw Year (pre-extracted by Browse.ai robot)
        condition,                    // Raw Condition (pre-extracted by Browse.ai robot)
        'Pending',                    // Import Status
        false,                        // Processed
        '',                           // Master ID
        ''                            // Error Log
      ];

      importSheet.appendRow(importRow);
      imported++;

      // Mark URL as processed
      markUrlProcessed(url);

    } catch (rowError) {
      errors.push(`Row ${i + 1}: ${rowError.toString()}`);
      logQuantum('Row Import Error', `Row ${i + 1}: ${rowError.toString()}`);
    }
  }

  return { imported, skipped, errors };
}

// =========================================================
// PLATFORM-AWARE COLUMN MAPPING
// =========================================================

/**
 * Map Browse.ai export headers using platform-specific column definitions.
 * Falls back to generic mapping if platform is unknown.
 * Includes mileage, year, and condition variants from all marketplace robots.
 */
function mapBrowseAIColumnsPlatform(headers, platform) {
  const platformMappings = getPlatformColumnMap(platform);

  const columnMap = {};

  for (const [key, variants] of Object.entries(platformMappings)) {
    const matchedIndices = [];
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase().replace(/\s+/g, '_');
      if (variants.includes(header)) {
        matchedIndices.push(i);
      }
    }
    // Store first match as primary, keep all as fallbacks
    if (matchedIndices.length > 0) {
      columnMap[key] = matchedIndices[0];
      if (matchedIndices.length > 1) {
        columnMap[key + '_fallbacks'] = matchedIndices.slice(1);
      }
    }
  }

  return columnMap;
}

/**
 * Resolve a field value from a row using primary + fallback column indices.
 */
function resolveField(row, columnMap, fieldName) {
  // Try primary index
  if (columnMap[fieldName] !== undefined) {
    const val = row[columnMap[fieldName]];
    if (val !== undefined && val !== null && val !== '') return val;
  }

  // Try fallbacks
  const fallbacks = columnMap[fieldName + '_fallbacks'];
  if (fallbacks) {
    for (const idx of fallbacks) {
      const val = row[idx];
      if (val !== undefined && val !== null && val !== '') return val;
    }
  }

  return null;
}

// =========================================================
// ENHANCED DATA EXTRACTION
// =========================================================

/**
 * Extract platform-specific extra fields that don't fit in the standard schema.
 */
function extractPlatformExtras(row, columnMap, platform) {
  const extras = {};

  // eBay-specific
  if (platform === 'eBay') {
    extras.bidCount = resolveField(row, columnMap, 'bidCount') || 0;
    extras.watchers = resolveField(row, columnMap, 'watchers') || 0;
    extras.endDate = resolveField(row, columnMap, 'endDate') || '';
    extras.listingType = resolveField(row, columnMap, 'listingType') || '';
    extras.sellerFeedback = resolveField(row, columnMap, 'sellerFeedback') || '';
    extras.shippingCost = resolveField(row, columnMap, 'shippingCost') || '';
  }

  // AutoTrader-specific
  if (platform === 'AutoTrader') {
    extras.trim = resolveField(row, columnMap, 'trim') || '';
    extras.mpg = resolveField(row, columnMap, 'mpg') || '';
    extras.features = resolveField(row, columnMap, 'features') || '';
    extras.accidents = resolveField(row, columnMap, 'accidents') || '';
    extras.owners = resolveField(row, columnMap, 'owners') || '';
    extras.dealerRating = resolveField(row, columnMap, 'dealerRating') || '';
    extras.certifiedPreOwned = resolveField(row, columnMap, 'certifiedPreOwned') || '';
    extras.priceHistory = resolveField(row, columnMap, 'priceHistory') || '';
  }

  // Cars.com-specific
  if (platform === 'Cars.com') {
    extras.trim = resolveField(row, columnMap, 'trim') || '';
    extras.features = resolveField(row, columnMap, 'features') || '';
    extras.dealValue = resolveField(row, columnMap, 'dealValue') || '';
    extras.accidents = resolveField(row, columnMap, 'accidents') || '';
    extras.owners = resolveField(row, columnMap, 'owners') || '';
    extras.dealerRating = resolveField(row, columnMap, 'dealerRating') || '';
    extras.homeDelivery = resolveField(row, columnMap, 'homeDelivery') || '';
  }

  // OfferUp-specific
  if (platform === 'OfferUp') {
    extras.sellerRating = resolveField(row, columnMap, 'sellerRating') || '';
    extras.sellerJoined = resolveField(row, columnMap, 'sellerJoined') || '';
  }

  // Craigslist-specific
  if (platform === 'Craigslist') {
    extras.cylinders = resolveField(row, columnMap, 'cylinders') || '';
    extras.modelSpecific = resolveField(row, columnMap, 'modelSpecific') || '';
  }

  // Powersports platforms
  if (['ATV Trader', 'Cycle Trader', 'Tractor House', 'Powersports Listings'].includes(platform)) {
    extras.hours = resolveField(row, columnMap, 'hours') || '';
    extras.engineSize = resolveField(row, columnMap, 'engineSize') || '';
    extras.vehicleType = resolveField(row, columnMap, 'vehicleType') || '';
    extras.features = resolveField(row, columnMap, 'features') || '';
    extras.serialNumber = resolveField(row, columnMap, 'serialNumber') || '';
  }

  return extras;
}

/**
 * Build an enhanced description string that embeds structured fields
 * into the raw description for downstream parsing.
 */
function buildEnhancedDescription(rawDescription, fields) {
  const parts = [rawDescription || ''];

  // Append structured data tags that quantumParseVehicle() can extract
  const tags = [];
  if (fields.mileage) tags.push(`[MILEAGE: ${fields.mileage}]`);
  if (fields.condition) tags.push(`[CONDITION: ${fields.condition}]`);
  if (fields.vin) tags.push(`[VIN: ${fields.vin}]`);
  if (fields.transmission) tags.push(`[TRANSMISSION: ${fields.transmission}]`);
  if (fields.fuelType) tags.push(`[FUEL: ${fields.fuelType}]`);
  if (fields.bodyStyle) tags.push(`[BODY: ${fields.bodyStyle}]`);
  if (fields.exteriorColor) tags.push(`[COLOR: ${fields.exteriorColor}]`);
  if (fields.drivetrain) tags.push(`[DRIVETRAIN: ${fields.drivetrain}]`);
  if (fields.titleStatus) tags.push(`[TITLE: ${fields.titleStatus}]`);
  if (fields.listingId) tags.push(`[LISTING_ID: ${fields.listingId}]`);

  // Platform extras
  if (fields.extras) {
    const ex = fields.extras;
    if (ex.trim) tags.push(`[TRIM: ${ex.trim}]`);
    if (ex.bidCount) tags.push(`[BIDS: ${ex.bidCount}]`);
    if (ex.watchers) tags.push(`[WATCHERS: ${ex.watchers}]`);
    if (ex.endDate) tags.push(`[AUCTION_END: ${ex.endDate}]`);
    if (ex.dealValue) tags.push(`[DEAL_RATING: ${ex.dealValue}]`);
    if (ex.accidents) tags.push(`[ACCIDENTS: ${ex.accidents}]`);
    if (ex.owners) tags.push(`[OWNERS: ${ex.owners}]`);
    if (ex.hours) tags.push(`[HOURS: ${ex.hours}]`);
    if (ex.engineSize) tags.push(`[ENGINE_SIZE: ${ex.engineSize}]`);
    if (ex.vehicleType) tags.push(`[VEHICLE_TYPE: ${ex.vehicleType}]`);
    if (ex.certifiedPreOwned) tags.push(`[CPO: ${ex.certifiedPreOwned}]`);
    if (ex.priceHistory) tags.push(`[PRICE_HISTORY: ${ex.priceHistory}]`);
    if (ex.features) tags.push(`[FEATURES: ${ex.features}]`);
    if (ex.serialNumber) tags.push(`[SERIAL: ${ex.serialNumber}]`);
  }

  if (tags.length > 0) {
    parts.push('\n--- STRUCTURED DATA ---');
    parts.push(tags.join(' '));
  }

  return parts.join('\n');
}

/**
 * Build enhanced seller info with detected seller type.
 */
function buildEnhancedSellerInfo(rawSellerInfo, sellerType, extras) {
  const parts = [rawSellerInfo || ''];

  if (sellerType && sellerType !== 'Unknown') {
    parts.push(`[TYPE: ${sellerType}]`);
  }
  if (extras.sellerFeedback) parts.push(`[FEEDBACK: ${extras.sellerFeedback}]`);
  if (extras.sellerRating) parts.push(`[RATING: ${extras.sellerRating}]`);
  if (extras.dealerRating) parts.push(`[DEALER_RATING: ${extras.dealerRating}]`);
  if (extras.sellerJoined) parts.push(`[MEMBER_SINCE: ${extras.sellerJoined}]`);

  return parts.join(' ');
}

// =========================================================
// LEGACY COMPATIBILITY
// =========================================================

/**
 * Original generic column mapper - kept for backward compatibility.
 * New imports use mapBrowseAIColumnsPlatform() instead.
 */
function mapBrowseAIColumns(headers) {
  return mapBrowseAIColumnsPlatform(headers, 'Other');
}

/**
 * Original platform detection - enhanced version in quantum_robots.gs.
 */
function detectPlatformFromURL(url) {
  return detectPlatformFromURLAdvanced(url);
}

// =========================================================
// URL DEDUPLICATION
// =========================================================

function getProcessedUrls() {
  const props = PropertiesService.getScriptProperties();
  const urlsJson = props.getProperty('PROCESSED_URLS') || '[]';
  return JSON.parse(urlsJson);
}

function markUrlProcessed(url) {
  const props = PropertiesService.getScriptProperties();
  const urls = getProcessedUrls();

  urls.push(url);

  // Keep only last 1000 URLs to prevent property size issues
  if (urls.length > 1000) {
    urls.splice(0, urls.length - 1000);
  }

  props.setProperty('PROCESSED_URLS', JSON.stringify(urls));
}
