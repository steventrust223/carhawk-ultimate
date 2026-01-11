// ==========================================
// CARHAWK ULTIMATE - DATA IMPORT MODULE
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Import data from staging sheets and populate Master Database
// ==========================================

/**
 * Import data from all staging sheets
 */
function importFromAllStagingSheets() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '📥 Import from All Staging Sheets',
    'This will import new data from all staging sheets into the Master Database.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    let totalImported = 0;

    // Import from each staging sheet
    totalImported += importFromStagingSheet(SHEETS.STAGING_FB.name, SHEETS.STAGING_FB.platform);
    totalImported += importFromStagingSheet(SHEETS.STAGING_CL.name, SHEETS.STAGING_CL.platform);
    totalImported += importFromStagingSheet(SHEETS.STAGING_OU.name, SHEETS.STAGING_OU.platform);
    totalImported += importFromStagingSheet(SHEETS.STAGING_EBAY.name, SHEETS.STAGING_EBAY.platform);

    logSystem('DATA_IMPORT', `Imported ${totalImported} new listings from staging sheets`);

    ui.alert(
      '✅ Import Complete',
      `Imported ${totalImported} new listings into Master Database.\n\n` +
      'Next steps:\n' +
      '1. Run analysis (MAO, Speed-to-Lead, Rental, etc.)\n' +
      '2. Generate verdict sheet\n' +
      '3. Review top opportunities',
      ui.ButtonSet.OK
    );

  } catch (error) {
    logError('DATA_IMPORT_ERROR', error.message);
    ui.alert('Error importing data: ' + error.message);
  }
}

/**
 * Import data from a specific staging sheet
 * @param {string} stagingSheetName - Name of staging sheet
 * @param {string} platform - Platform name
 * @return {number} Number of records imported
 */
function importFromStagingSheet(stagingSheetName, platform) {
  const stagingSheet = getSheetSafe(stagingSheetName);

  if (!stagingSheet) {
    logSystem('IMPORT_SKIP', `Staging sheet not found: ${stagingSheetName}`);
    return 0;
  }

  const stagingData = stagingSheet.getDataRange().getValues();

  if (stagingData.length < 2) {
    return 0; // No data to import
  }

  const masterSheet = getSheet(SHEETS.MASTER.name);
  const masterHeaders = masterSheet.getRange(1, 1, 1, masterSheet.getLastColumn()).getValues()[0];

  // Build column map for master sheet
  const colMap = {};
  for (let col in MASTER_COLUMNS) {
    colMap[col] = masterHeaders.indexOf(MASTER_COLUMNS[col]);
  }

  // Staging sheet structure:
  // Import Timestamp, Title, Price, Location, Seller Name, Posted Date, Description, URL, Images, Contact Info, Processed?
  const stagingHeaders = stagingData[0];

  let imported = 0;

  for (let i = 1; i < stagingData.length; i++) {
    const row = stagingData[i];

    // Check if already processed
    const processedCol = stagingHeaders.indexOf('Processed?');
    if (processedCol !== -1 && row[processedCol] === 'Yes') {
      continue; // Skip already processed
    }

    // Extract data
    const title = row[stagingHeaders.indexOf('Title')] || '';
    const priceStr = row[stagingHeaders.indexOf('Price')] || '';
    const location = row[stagingHeaders.indexOf('Location')] || '';
    const sellerName = row[stagingHeaders.indexOf('Seller Name')] || '';
    const description = row[stagingHeaders.indexOf('Description')] || '';
    const url = row[stagingHeaders.indexOf('URL')] || '';
    const images = row[stagingHeaders.indexOf('Images')] || '';
    const contactInfo = row[stagingHeaders.indexOf('Contact Info')] || '';

    // Parse vehicle info from title
    const vehicleInfo = parseVehicleTitle(title);

    // Parse price
    const askingPrice = parsePrice(priceStr);

    // Extract ZIP from location
    const sellerZIP = extractZIP(location);
    const sellerCity = location.replace(/\d{5}/g, '').trim();

    // Calculate distance
    const distance = sellerZIP ? calculateDistance(SYSTEM.HOME_ZIP, sellerZIP) : 0;

    // Extract contact info
    const phone = extractPhone(contactInfo + ' ' + description);
    const email = extractEmail(contactInfo + ' ' + description);

    // Check for enthusiast vehicle
    const enthusiastFlag = isEnthusiastVehicle(title + ' ' + description) ? 'Yes' : 'No';

    // Extract hazard flags
    const hazardFlags = extractHazardFlags(description);

    // Generate listing ID
    const listingID = generateID();

    // Timestamps
    const now = new Date();

    // Build new master row
    const newRow = new Array(masterHeaders.length).fill('');

    // Fill in data
    if (colMap.LISTING_ID !== -1) newRow[colMap.LISTING_ID] = listingID;
    if (colMap.YEAR !== -1) newRow[colMap.YEAR] = vehicleInfo.year;
    if (colMap.MAKE !== -1) newRow[colMap.MAKE] = vehicleInfo.make;
    if (colMap.MODEL !== -1) newRow[colMap.MODEL] = vehicleInfo.model;
    if (colMap.TRIM !== -1) newRow[colMap.TRIM] = vehicleInfo.trim;
    if (colMap.BODY_TYPE !== -1) newRow[colMap.BODY_TYPE] = vehicleInfo.bodyType;
    if (colMap.ENTHUSIAST_FLAG !== -1) newRow[colMap.ENTHUSIAST_FLAG] = enthusiastFlag;

    if (colMap.ASKING_PRICE !== -1) newRow[colMap.ASKING_PRICE] = askingPrice;

    if (colMap.MILEAGE !== -1) newRow[colMap.MILEAGE] = vehicleInfo.mileage;
    if (colMap.CONDITION !== -1) newRow[colMap.CONDITION] = vehicleInfo.condition;
    if (colMap.TITLE_STATUS !== -1) newRow[colMap.TITLE_STATUS] = vehicleInfo.titleStatus;
    if (colMap.HAZARD_FLAGS !== -1) newRow[colMap.HAZARD_FLAGS] = hazardFlags;

    if (colMap.PLATFORM !== -1) newRow[colMap.PLATFORM] = platform;

    if (colMap.SELLER_CITY !== -1) newRow[colMap.SELLER_CITY] = sellerCity;
    if (colMap.SELLER_ZIP !== -1) newRow[colMap.SELLER_ZIP] = sellerZIP;
    if (colMap.DISTANCE !== -1) newRow[colMap.DISTANCE] = distance;
    if (colMap.LOCATION_RISK !== -1) newRow[colMap.LOCATION_RISK] = getLocationRisk(distance);

    if (colMap.FIRST_SEEN !== -1) newRow[colMap.FIRST_SEEN] = now;

    if (colMap.CAPITAL_TIER !== -1) newRow[colMap.CAPITAL_TIER] = getCapitalTier(askingPrice);

    if (colMap.LISTING_URL !== -1) newRow[colMap.LISTING_URL] = url;
    if (colMap.SELLER_NAME !== -1) newRow[colMap.SELLER_NAME] = sellerName;
    if (colMap.SELLER_PHONE !== -1) newRow[colMap.SELLER_PHONE] = phone;
    if (colMap.SELLER_EMAIL !== -1) newRow[colMap.SELLER_EMAIL] = email;
    if (colMap.DESCRIPTION !== -1) newRow[colMap.DESCRIPTION] = description;
    if (colMap.IMAGES !== -1) newRow[colMap.IMAGES] = images;
    if (colMap.CREATED_AT !== -1) newRow[colMap.CREATED_AT] = now;
    if (colMap.UPDATED_AT !== -1) newRow[colMap.UPDATED_AT] = now;

    // Append to master
    masterSheet.appendRow(newRow);

    // Mark as processed in staging
    if (processedCol !== -1) {
      stagingSheet.getRange(i + 1, processedCol + 1).setValue('Yes');
    }

    imported++;
  }

  return imported;
}

/**
 * Parse vehicle information from title
 * @param {string} title - Listing title
 * @return {Object} Parsed vehicle info
 */
function parseVehicleTitle(title) {
  const info = {
    year: 0,
    make: '',
    model: '',
    trim: '',
    bodyType: '',
    mileage: 0,
    condition: '',
    titleStatus: 'Unknown'
  };

  if (!title) return info;

  // Extract year (4-digit number between 1900-2030)
  const yearMatch = title.match(/\b(19\d{2}|20[0-3]\d)\b/);
  if (yearMatch) {
    info.year = parseInt(yearMatch[0]);
  }

  // Extract mileage
  const mileageMatch = title.match(/\b(\d{1,3}[,\s]?\d{3}|\d{4,6})\s*(miles?|mi|k|km)\b/i);
  if (mileageMatch) {
    const mileageStr = mileageMatch[1].replace(/[,\s]/g, '');
    info.mileage = parseInt(mileageStr);

    // Handle "k" notation (e.g., "100k miles")
    if (mileageMatch[2].toLowerCase() === 'k') {
      info.mileage *= 1000;
    }
  }

  // Extract make (common car makes)
  const commonMakes = [
    'Toyota', 'Honda', 'Ford', 'Chevrolet', 'Chevy', 'Nissan', 'Jeep',
    'Ram', 'GMC', 'Dodge', 'Mazda', 'Hyundai', 'Kia', 'Subaru',
    'Volkswagen', 'VW', 'BMW', 'Mercedes', 'Audi', 'Lexus', 'Acura',
    'Infiniti', 'Cadillac', 'Lincoln', 'Buick', 'Chrysler',
    'Tesla', 'Rivian', 'Lucid', 'Porsche', 'Volvo', 'Jaguar', 'Land Rover'
  ];

  for (let make of commonMakes) {
    if (title.toLowerCase().includes(make.toLowerCase())) {
      info.make = make;
      break;
    }
  }

  // Extract model (this is tricky, do basic extraction)
  // Remove year and make from title, first word after is likely model
  let remainder = title;
  if (info.year) remainder = remainder.replace(info.year.toString(), '');
  if (info.make) remainder = remainder.replace(new RegExp(info.make, 'i'), '');

  const words = remainder.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length > 0) {
    info.model = words[0];
    if (words.length > 1) {
      info.trim = words.slice(1, 3).join(' '); // Take next 1-2 words as trim
    }
  }

  // Extract condition keywords
  const conditionKeywords = ['excellent', 'very good', 'good', 'fair', 'poor', 'salvage', 'parts'];
  for (let keyword of conditionKeywords) {
    if (title.toLowerCase().includes(keyword)) {
      info.condition = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      break;
    }
  }

  // Extract title status
  if (title.toLowerCase().includes('salvage')) info.titleStatus = 'Salvage';
  else if (title.toLowerCase().includes('rebuilt')) info.titleStatus = 'Rebuilt';
  else if (title.toLowerCase().includes('clean title')) info.titleStatus = 'Clean';
  else if (title.toLowerCase().includes('no title')) info.titleStatus = 'No Title';

  // Extract body type
  const bodyTypes = [
    'Sedan', 'Coupe', 'SUV', 'Truck', 'Van', 'Wagon', 'Crossover',
    'Convertible', 'Hatchback', 'Minivan', 'Pickup'
  ];

  for (let type of bodyTypes) {
    if (title.toLowerCase().includes(type.toLowerCase())) {
      info.bodyType = type;
      break;
    }
  }

  return info;
}

/**
 * Run full analysis pipeline after import
 */
function importAndAnalyze() {
  // Import data
  importFromAllStagingSheets();

  // Wait a moment
  Utilities.sleep(2000);

  // Run all analysis
  SpreadsheetApp.getUi().alert(
    '🔄 Running Full Analysis',
    'Now running MAO, Speed-to-Lead, Rental, and Verdict analysis...',
    SpreadsheetApp.getUi().ButtonSet.OK
  );

  try {
    updateMAOCalculations();
    Utilities.sleep(1000);

    updateSpeedToLeadData();
    Utilities.sleep(1000);

    updateRentalAnalysis();
    Utilities.sleep(1000);

    updateVerdictColumn();
    Utilities.sleep(1000);

    generateVerdictSheet();

    SpreadsheetApp.getUi().alert(
      '✅ Analysis Complete!',
      'All data has been imported and analyzed.\n\n' +
      'Check the Verdict sheet for top opportunities!',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('IMPORT_AND_ANALYZE_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error during analysis: ' + error.message);
  }
}
