// ============================================================================
// CARHAWK ULTIMATE — IMPORT.GS
// Data Import Pipeline with LockService Concurrency Protection (G-16)
// ============================================================================

// ============================================================================
// MAIN IMPORT FUNCTIONS
// ============================================================================

/**
 * Import from all staging sheets (menu function)
 */
function importFromStaging() {
  const ui = SpreadsheetApp.getUi();

  const result = ui.alert(
    'Import from Staging',
    'Import new leads from all staging sheets?',
    ui.ButtonSet.YES_NO
  );

  if (result !== ui.Button.YES) return;

  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(LOCK_CONFIG.IMPORT_LOCK_TIMEOUT_MS)) {
      ui.alert('Import in Progress', 'Another import is already running. Please wait.', ui.ButtonSet.OK);
      return;
    }

    const imported = {
      facebook: importFromPlatform(SHEETS.STAGING_FB, 'Facebook'),
      craigslist: importFromPlatform(SHEETS.STAGING_CL, 'Craigslist'),
      offerup: importFromPlatform(SHEETS.STAGING_OU, 'OfferUp'),
      ebay: importFromPlatform(SHEETS.STAGING_EBAY, 'eBay')
    };

    const total = Object.values(imported).reduce((a, b) => a + b, 0);

    ui.alert(
      'Import Complete',
      `Imported ${total} new leads:\n\n` +
      `Facebook: ${imported.facebook}\n` +
      `Craigslist: ${imported.craigslist}\n` +
      `OfferUp: ${imported.offerup}\n` +
      `eBay: ${imported.ebay}`,
      ui.ButtonSet.OK
    );

    logSystem('Import', `Imported ${total} leads from staging`, imported);

  } catch (error) {
    ui.alert('Import Error', error.toString(), ui.ButtonSet.OK);
    logSystem('Import Error', error.toString());
  } finally {
    lock.releaseLock();
  }
}

/**
 * Import from Facebook staging
 */
function importFromFacebook() {
  return importFromPlatformWithLock(SHEETS.STAGING_FB, 'Facebook');
}

/**
 * Import from Craigslist staging
 */
function importFromCraigslist() {
  return importFromPlatformWithLock(SHEETS.STAGING_CL, 'Craigslist');
}

/**
 * Import from OfferUp staging
 */
function importFromOfferUp() {
  return importFromPlatformWithLock(SHEETS.STAGING_OU, 'OfferUp');
}

/**
 * Import from eBay staging
 */
function importFromEbay() {
  return importFromPlatformWithLock(SHEETS.STAGING_EBAY, 'eBay');
}

/**
 * Import from platform with lock protection
 */
function importFromPlatformWithLock(stagingSheetName, platform) {
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(LOCK_CONFIG.IMPORT_LOCK_TIMEOUT_MS)) {
      throw new Error('Import lock unavailable');
    }

    return importFromPlatform(stagingSheetName, platform);

  } finally {
    lock.releaseLock();
  }
}

/**
 * Core import logic from staging sheet to master
 */
function importFromPlatform(stagingSheetName, platform) {
  const stagingSheet = getSheet(stagingSheetName);
  if (!stagingSheet) {
    logSystem('Import', `Staging sheet not found: ${stagingSheetName}`);
    return 0;
  }

  const masterSheet = getOrCreateSheet(SHEETS.MASTER);

  const stagingData = stagingSheet.getDataRange().getValues();
  if (stagingData.length <= 1) return 0;

  const originZip = getOriginZip();
  let imported = 0;
  const masterLastRow = masterSheet.getLastRow();
  const newRows = [];

  for (let i = 1; i < stagingData.length; i++) {
    const row = stagingData[i];

    // Skip if already imported (check column 17 for Master ID)
    if (row[16]) continue;

    // Extract and normalize data
    const rawData = parseStagingRow(row, platform);

    // Calculate distance
    rawData.distance = getDistanceMiles(originZip, rawData.zip);

    // Generate unique ID
    const id = generateId('CH');

    // Prepare master row
    const masterRow = buildMasterRow(id, rawData, platform);
    newRows.push(masterRow);

    // Mark as imported in staging
    stagingSheet.getRange(i + 1, 17).setValue(id);
    stagingSheet.getRange(i + 1, 16).setValue('Imported');

    imported++;
  }

  // Batch append to master
  if (newRows.length > 0) {
    const startRow = masterLastRow + 1;
    masterSheet.getRange(startRow, 1, newRows.length, newRows[0].length)
      .setValues(newRows);

    // Run analysis on new imports
    analyzeImportedDeals(startRow, startRow + newRows.length - 1);
  }

  logSystem('Import', `Imported ${imported} leads from ${platform}`);
  return imported;
}

/**
 * Parse staging row into normalized data
 */
function parseStagingRow(row, platform) {
  // Staging sheet column mapping:
  // 0: Scrape ID, 1: Date, 2: Job Link, 3: Title, 4: Price
  // 5: Location, 6: Description, 7: Seller Info, 8: Date Listed
  // 9-14: Additional fields, 15: Status, 16: Master ID

  const title = row[3] || '';
  const description = row[6] || '';
  const vehicleInfo = extractVehicleInfo(title, description);

  return {
    title: title,
    description: description,
    year: vehicleInfo.year,
    make: vehicleInfo.make,
    model: vehicleInfo.model,
    trim: vehicleInfo.trim,
    mileage: vehicleInfo.mileage || extractMileage(description),
    condition: parseCondition(row[14] || description),
    titleStatus: parseTitleStatus(description),
    location: row[5] || '',
    zip: extractZip(row[5] || ''),
    askingPrice: parsePrice(row[4]),
    dateListed: row[8] || row[1],
    daysListed: daysSince(row[8] || row[1]),
    sellerInfo: row[7] || '',
    sellerName: extractSellerName(row[7]),
    sellerPhone: extractPhone(row[7] + ' ' + description),
    sellerEmail: extractEmail(row[7] + ' ' + description),
    sourceUrl: row[2] || '',
    platform: platform
  };
}

/**
 * Parse condition from text
 */
function parseCondition(text) {
  if (!text) return 'Unknown';
  const textLower = String(text).toLowerCase();

  if (textLower.includes('excellent') || textLower.includes('like new')) return 'Excellent';
  if (textLower.includes('very good')) return 'Very Good';
  if (textLower.includes('good')) return 'Good';
  if (textLower.includes('fair')) return 'Fair';
  if (textLower.includes('poor') || textLower.includes('rough')) return 'Poor';
  if (textLower.includes('parts') || textLower.includes('salvage')) return 'Parts Only';

  return 'Unknown';
}

/**
 * Parse title status from text
 */
function parseTitleStatus(text) {
  if (!text) return 'Unknown';
  const textLower = String(text).toLowerCase();

  if (textLower.includes('clean title') || textLower.includes('clear title')) return 'Clean';
  if (textLower.includes('rebuilt')) return 'Rebuilt';
  if (textLower.includes('salvage')) return 'Salvage';
  if (textLower.includes('no title')) return 'No Title';
  if (textLower.includes('lien')) return 'Lien';

  return 'Unknown';
}

/**
 * Build master database row
 */
function buildMasterRow(id, data, platform) {
  const locationRisk = getLocationRiskEmoji(data.distance);

  return [
    id,                          // 1: ID
    new Date(),                  // 2: Date Added
    platform,                    // 3: Source/Platform
    'New',                       // 4: Status
    '',                          // 5: Lead Score (calculated)
    '',                          // 6: Temperature (calculated)
    data.year,                   // 7: Year
    data.make,                   // 8: Make
    data.model,                  // 9: Model
    data.trim,                   // 10: Trim
    '',                          // 11: VIN
    data.mileage,                // 12: Mileage
    data.condition,              // 13: Condition
    data.titleStatus,            // 14: Title Status
    data.location,               // 15: Location
    data.zip,                    // 16: ZIP
    data.distance,               // 17: Distance
    locationRisk,                // 18: Location Risk
    data.askingPrice,            // 19: Asking Price
    '',                          // 20: MAO (calculated)
    '',                          // 21: Market Value (calculated)
    '',                          // 22: Repair Cost (calculated)
    '',                          // 23: ARV (calculated)
    '',                          // 24: Profit Margin (calculated)
    '',                          // 25: ROI (calculated)
    '',                          // 26: Deal Score (calculated)
    '',                          // 27: Verdict (calculated)
    '',                          // 28: Strategy (calculated)
    data.daysListed,             // 29: Days Listed
    data.sellerName,             // 30: Seller Name
    data.sellerPhone,            // 31: Seller Phone
    data.sellerEmail,            // 32: Seller Email
    '',                          // 33: AI Notes
    '',                          // 34: Manual Notes
    new Date(),                  // 35: Last Updated
    '',                          // 36: Assigned To
    data.sourceUrl,              // 37: Source URL
    ''                           // 38: CRM ID
  ];
}

/**
 * Analyze newly imported deals
 * Auto-routes to CRM if ENABLE_AUTO_CRM_ROUTING feature flag is true
 */
function analyzeImportedDeals(startRow, endRow) {
  try {
    // Use analyzeDealsWithAutoRoute which includes optional CRM auto-routing
    analyzeDealsWithAutoRoute(startRow, endRow);
  } catch (error) {
    logSystem('Post-Import Analysis', `Error analyzing rows ${startRow}-${endRow}: ${error.toString()}`);
  }
}

// ============================================================================
// BROWSE.AI INTEGRATION
// ============================================================================

/**
 * Import from Browse.AI export sheet
 */
function importFromBrowseAI() {
  const ui = SpreadsheetApp.getUi();

  // Prompt for Browse.AI sheet ID
  const response = ui.prompt(
    'Import from Browse.AI',
    'Enter the Google Sheet ID from Browse.AI:',
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() !== ui.Button.OK) return;

  const sheetId = response.getResponseText().trim();
  if (!sheetId) {
    ui.alert('No sheet ID provided.');
    return;
  }

  const platformResponse = ui.prompt(
    'Platform',
    'What platform was this data scraped from? (Facebook, Craigslist, OfferUp, eBay):',
    ui.ButtonSet.OK_CANCEL
  );

  if (platformResponse.getSelectedButton() !== ui.Button.OK) return;

  const platform = platformResponse.getResponseText().trim() || 'Unknown';

  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(LOCK_CONFIG.IMPORT_LOCK_TIMEOUT_MS)) {
      ui.alert('Import in Progress', 'Another import is running.', ui.ButtonSet.OK);
      return;
    }

    const imported = processBrowseAISheet(sheetId, platform);

    ui.alert(
      'Browse.AI Import Complete',
      `Imported ${imported} new leads from Browse.AI.`,
      ui.ButtonSet.OK
    );

    logSystem('Browse.AI Import', `Imported ${imported} leads`, { sheetId, platform });

  } catch (error) {
    ui.alert('Import Error', error.toString(), ui.ButtonSet.OK);
    logSystem('Browse.AI Error', error.toString(), { sheetId });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Process Browse.AI sheet
 */
function processBrowseAISheet(sheetId, platform) {
  let sourceSheet;

  try {
    const sourceSpreadsheet = SpreadsheetApp.openById(sheetId);
    sourceSheet = sourceSpreadsheet.getActiveSheet();
  } catch (error) {
    throw new Error('Cannot access Browse.AI sheet. Check sharing permissions.');
  }

  const data = sourceSheet.getDataRange().getValues();
  if (data.length < 2) return 0;

  const headers = data[0];
  const columnMap = mapBrowseAIColumns(headers);

  const masterSheet = getOrCreateSheet(SHEETS.MASTER);
  const originZip = getOriginZip();
  const processedUrls = getProcessedUrls();

  let imported = 0;
  const newRows = [];
  const masterLastRow = masterSheet.getLastRow();

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const url = row[columnMap.url] || row[columnMap.link] || '';

    // Skip if already processed
    if (processedUrls.includes(url)) continue;

    // Parse row based on column map
    const rawData = parseBrowseAIRow(row, columnMap, platform);
    rawData.distance = getDistanceMiles(originZip, rawData.zip);

    const id = generateId('BAI');
    const masterRow = buildMasterRow(id, rawData, platform);
    newRows.push(masterRow);

    imported++;
  }

  // Batch append
  if (newRows.length > 0) {
    const startRow = masterLastRow + 1;
    masterSheet.getRange(startRow, 1, newRows.length, newRows[0].length)
      .setValues(newRows);

    analyzeImportedDeals(startRow, startRow + newRows.length - 1);
  }

  return imported;
}

/**
 * Map Browse.AI column headers to standard fields
 */
function mapBrowseAIColumns(headers) {
  const map = {};
  const headerLower = headers.map(h => String(h).toLowerCase());

  // Common Browse.AI column names
  const mappings = {
    'title': ['title', 'listing title', 'name', 'vehicle'],
    'price': ['price', 'asking price', 'cost', 'amount'],
    'location': ['location', 'city', 'area', 'place'],
    'description': ['description', 'details', 'body', 'text'],
    'url': ['url', 'link', 'listing url', 'source'],
    'date': ['date', 'posted', 'listed', 'created'],
    'seller': ['seller', 'owner', 'contact', 'posted by'],
    'mileage': ['mileage', 'miles', 'odometer'],
    'condition': ['condition', 'status'],
    'images': ['images', 'photos', 'image count', 'photo count']
  };

  for (const [field, variants] of Object.entries(mappings)) {
    for (let i = 0; i < headerLower.length; i++) {
      if (variants.some(v => headerLower[i].includes(v))) {
        map[field] = i;
        break;
      }
    }
  }

  return map;
}

/**
 * Parse Browse.AI row based on column map
 */
function parseBrowseAIRow(row, columnMap, platform) {
  const title = row[columnMap.title] || '';
  const description = row[columnMap.description] || '';
  const vehicleInfo = extractVehicleInfo(title, description);

  return {
    title: title,
    description: description,
    year: vehicleInfo.year,
    make: vehicleInfo.make,
    model: vehicleInfo.model,
    trim: '',
    mileage: vehicleInfo.mileage || extractMileage(row[columnMap.mileage] || description),
    condition: parseCondition(row[columnMap.condition] || description),
    titleStatus: parseTitleStatus(description),
    location: row[columnMap.location] || '',
    zip: extractZip(row[columnMap.location] || ''),
    askingPrice: parsePrice(row[columnMap.price]),
    dateListed: row[columnMap.date],
    daysListed: daysSince(row[columnMap.date]),
    sellerInfo: row[columnMap.seller] || '',
    sellerName: extractSellerName(row[columnMap.seller]),
    sellerPhone: extractPhone(row[columnMap.seller] + ' ' + description),
    sellerEmail: extractEmail(row[columnMap.seller] + ' ' + description),
    sourceUrl: row[columnMap.url] || '',
    platform: platform
  };
}

/**
 * Get list of already processed URLs to prevent duplicates
 */
function getProcessedUrls() {
  const masterSheet = getSheet(SHEETS.MASTER);
  if (!masterSheet) return [];

  const lastRow = masterSheet.getLastRow();
  if (lastRow < 2) return [];

  // Get source URLs from column 37
  const urls = masterSheet.getRange(2, 37, lastRow - 1, 1).getValues();
  return urls.flat().filter(url => url);
}

// ============================================================================
// MANUAL ENTRY
// ============================================================================

/**
 * Add single deal manually (from sidebar)
 */
function addDealManually(formData) {
  const lock = LockService.getScriptLock();

  try {
    if (!lock.tryLock(10000)) {
      throw new Error('Could not acquire lock');
    }

    const masterSheet = getOrCreateSheet(SHEETS.MASTER);
    const originZip = getOriginZip();

    // Normalize form data
    const rawData = {
      title: `${formData.year} ${formData.make} ${formData.model}`,
      description: formData.notes || '',
      year: formData.year,
      make: formData.make,
      model: formData.model,
      trim: formData.trim || '',
      mileage: parseInt(formData.mileage) || 0,
      condition: formData.condition || 'Unknown',
      titleStatus: formData.titleStatus || 'Unknown',
      location: formData.location || '',
      zip: formData.zip || extractZip(formData.location || ''),
      askingPrice: parsePrice(formData.askingPrice),
      dateListed: new Date(),
      daysListed: 0,
      sellerInfo: formData.sellerName || '',
      sellerName: formData.sellerName || '',
      sellerPhone: formData.sellerPhone || '',
      sellerEmail: formData.sellerEmail || '',
      sourceUrl: '',
      platform: 'Manual'
    };

    rawData.distance = getDistanceMiles(originZip, rawData.zip);

    const id = generateId('MAN');
    const masterRow = buildMasterRow(id, rawData, 'Manual');

    const lastRow = masterSheet.getLastRow();
    masterSheet.appendRow(masterRow);

    // Analyze the new deal
    analyzeImportedDeals(lastRow + 1, lastRow + 1);

    logSystem('Manual Entry', `Added deal ${id}`, { vehicle: rawData.title });

    return { success: true, id: id };

  } catch (error) {
    logSystem('Manual Entry Error', error.toString());
    return { success: false, error: error.toString() };

  } finally {
    lock.releaseLock();
  }
}
