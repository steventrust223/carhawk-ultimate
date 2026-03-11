// =========================================================
// FILE: quantum-import.gs - Browse.AI Integration & Import
// =========================================================

function quantumImportSync() {
  const ui = SpreadsheetApp.getUi();
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);

  // Build set of existing Origin URLs in Master Database to prevent duplicates
  // Origin URL is not stored in DB by default, so we deduplicate by title+price+platform
  const dbData = dbSheet.getDataRange().getValues();
  const existingDeals = new Set();
  for (let d = 1; d < dbData.length; d++) {
    // Create a fingerprint from year + make + model + price + platform
    var fp = String(dbData[d][5]) + '|' + String(dbData[d][6]) + '|' + String(dbData[d][7]) + '|' + String(dbData[d][13]) + '|' + String(dbData[d][2]);
    existingDeals.add(fp.toLowerCase());
  }

  // Get unprocessed imports
  const importData = importSheet.getDataRange().getValues();
  const unprocessed = [];

  for (let i = 1; i < importData.length; i++) {
    if (!importData[i][16]) { // Not processed (column shifted for new fields)
      unprocessed.push({
        row: i + 1,
        data: importData[i]
      });
    }
  }

  if (unprocessed.length === 0) {
    ui.alert('No new imports to process.');
    return;
  }

  // Show quantum processing dialog
  const htmlOutput = HtmlService.createHtmlOutput(getQuantumProcessingHTML(unprocessed.length))
    .setWidth(600)
    .setHeight(400);

  ui.showModelessDialog(htmlOutput, '⚛️ Quantum Import Processing');

  // Process imports with quantum intelligence
  let processed = 0;
  const results = [];

  for (const item of unprocessed) {
    try {
      const result = processQuantumImport(item.data, item.row, existingDeals);
      if (result) {
        results.push(result);
        processed++;
      }

      // Update progress (would use server events in production)
      Utilities.sleep(100);
    } catch (error) {
      logQuantum('Import Error', `Row ${item.row}: ${error.toString()}`);
    }
  }

  // Run quantum analysis on new entries
  if (results.length > 0) {
    triggerQuantumAnalysis(results);
  }

  ui.alert(`Quantum Import Complete! Processed ${processed} deals.`);
}

function processQuantumImport(rowData, rowNum, existingDeals) {
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);

  // Extract Browse.AI data structure (includes marketplace-specific fields)
  const importData = {
    importId: rowData[0],
    dateGMT: rowData[1],
    jobLink: rowData[2],
    originUrl: rowData[3],
    platform: detectPlatform(rowData[3]),
    rawTitle: rowData[5],
    rawPrice: rowData[6],
    rawLocation: rowData[7],
    rawDescription: rowData[8],
    sellerInfo: rowData[9],
    postedDate: rowData[10],
    imageCount: rowData[11],
    rawMileage: rowData[12],   // Pre-extracted by Browse.ai robot
    rawYear: rowData[13],      // Pre-extracted by Browse.ai robot (OfferUp)
    rawCondition: rowData[14]  // Pre-extracted by Browse.ai robot (Craigslist)
  };

  // Quantum parsing engine
  const parsed = quantumParseVehicle(importData);

  // Check for duplicates: skip if same year+make+model+price+platform already exists
  if (existingDeals) {
    var fp = String(parsed.year) + '|' + String(parsed.make) + '|' + String(parsed.model) + '|' + String(parsed.price) + '|' + String(parsed.platform);
    if (existingDeals.has(fp.toLowerCase())) {
      // Mark as processed but don't add to database
      importSheet.getRange(rowNum, 17).setValue(true);
      importSheet.getRange(rowNum, 18).setValue('DUPLICATE');
      logQuantum('Import Skip', 'Duplicate detected: ' + parsed.year + ' ' + parsed.make + ' ' + parsed.model + ' $' + parsed.price);
      return null;
    }
    // Add this deal's fingerprint to prevent duplicates within the same batch
    existingDeals.add(fp.toLowerCase());
  }

  // Calculate quantum metrics
  const metrics = calculateQuantumMetrics(parsed);

  // Generate deal ID
  const dealId = generateQuantumId('QD');

  // Prepare master database row
  const dbRow = [
    dealId,
    new Date(),
    parsed.platform,
    'New',
    metrics.priority,
    parsed.year,
    parsed.make,
    parsed.model,
    parsed.trim,
    parsed.vin,
    parsed.mileage,
    parsed.color,
    parsed.title,
    parsed.price,
    parsed.location,
    parsed.zip,
    metrics.distance,
    metrics.locationRisk,
    metrics.locationFlag,
    parsed.condition,
    metrics.conditionScore,
    parsed.repairKeywords.join(', '),
    metrics.repairRiskScore,
    metrics.estimatedRepairCost,
    metrics.marketValue,
    metrics.mao,
    metrics.profitMargin,
    metrics.roi,
    metrics.capitalTier,
    '', // Flip Strategy (AI will determine)
    metrics.salesVelocity,
    metrics.marketAdvantage,
    parsed.daysListed,
    parsed.sellerName,
    parsed.sellerPhone,
    parsed.sellerEmail,
    parsed.sellerType,
    '', // Deal Flag (AI will determine)
    parsed.hotSeller,
    parsed.multipleVehicles,
    '', // Seller Message (AI will generate)
    '', // AI Confidence
    '', // Verdict
    '', // Verdict Icon
    '', // Recommended?
    metrics.imageScore,
    metrics.engagementScore,
    metrics.competitionLevel,
    new Date(),
    '',
    '',
    // CRM fields
    'IMPORTED', // Stage
    0, // Contact Count
    '', // Last Contact
    'Initial Contact', // Next Action
    0, // Response Rate
    0, // SMS Count
    0, // Call Count
    0, // Email Count
    false, // Meeting Scheduled
    'Pending' // Follow-up Status
  ];

  // Add to database
  dbSheet.appendRow(dbRow);

  // Mark as processed (columns 17-18 after new Browse.ai fields added)
  importSheet.getRange(rowNum, 17).setValue(true);
  importSheet.getRange(rowNum, 18).setValue(dealId);

  // Add to leads tracker
  addToLeadsTracker(dealId, parsed, metrics);

  logQuantum('Import Processed', `Deal ${dealId} added to database`);

  return {
    dealId: dealId,
    rowNum: dbSheet.getLastRow(),
    metrics: metrics
  };
}

function quantumParseVehicle(data) {
  const parsed = {
    platform: data.platform,
    year: '',
    make: '',
    model: '',
    trim: '',
    vin: '',
    mileage: 0,
    color: '',
    title: data.rawTitle,
    price: 0,
    location: data.rawLocation,
    zip: '',
    condition: 'Unknown',
    daysListed: 0,
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    sellerType: 'Private',
    hotSeller: false,
    multipleVehicles: false,
    repairKeywords: [],
    transmission: '',
    drivetrain: '',
    fuelType: '',
    exteriorColor: '',
    interiorColor: '',
    titleStatus: '',
    bodyType: ''
  };

  // Quantum title parsing with AI patterns
  const titlePatterns = {
    year: /\b(19|20)\d{2}\b/,
    make: /\b(Ford|Chevrolet|Chevy|Toyota|Honda|Nissan|Jeep|Ram|GMC|Hyundai|Kia|Mazda|Subaru|VW|Volkswagen|Audi|BMW|Mercedes|Lexus|Acura|Infiniti|Cadillac|Lincoln|Buick|Chrysler|Dodge|Fiat|Genesis|Jaguar|Land Rover|Maserati|Mini|Mitsubishi|Porsche|Tesla|Volvo)\b/i,
    mileage: /(\d{1,3})[,.]?(\d{3})\s*(?:mi|miles|k)/i,
    vin: /\b[A-HJ-NPR-Z0-9]{17}\b/,
    color: /\b(black|white|silver|gray|grey|red|blue|green|gold|beige|brown|orange|yellow|purple)\b/i
  };

  // =========================================================
  // PLATFORM-SPECIFIC TITLE PURGING
  // Each marketplace packs different data into its fields.
  // Purge embedded data from titles before parsing vehicle info.
  // =========================================================
  let purgedTitle = String(data.rawTitle || '');
  let descriptionText = String(data.rawDescription || '');

  if (data.platform === 'Craigslist') {
    // Craigslist title format: "2007 jeep liberty limited 4x4 - $3,850 (St.louis)"
    // Purge: strip embedded price after " - $" and location in parentheses
    purgedTitle = purgedTitle.replace(/\s*-\s*\$[\d,]+/g, '');  // Remove " - $3,850"
    purgedTitle = purgedTitle.replace(/\s*\([^)]*\)\s*/g, ' ');  // Remove "(St.louis)"
    purgedTitle = purgedTitle.trim();
  }

  if (data.platform === 'Facebook') {
    // Facebook "Listing Title" can be generic or seller-written.
    // The real vehicle details are often in the seller's description.
    // e.g. Description: "2002 Silverado 1500 5.3/4x4 CLEAN MO TITLE..."
    // Also extract structured "About this vehicle" fields from description:
    // "Driven 274,000 miles", "Automatic transmission", "Exterior color: Blue"
    const fbTransmission = descriptionText.match(/\b(automatic|manual|cvt)\s*transmission\b/i);
    if (fbTransmission) parsed.transmission = fbTransmission[1].charAt(0).toUpperCase() + fbTransmission[1].slice(1).toLowerCase();

    const fbExterior = descriptionText.match(/exterior\s*color:\s*(\w+)/i);
    if (fbExterior) parsed.exteriorColor = fbExterior[1].toLowerCase();

    const fbInterior = descriptionText.match(/interior\s*color:\s*(\w+)/i);
    if (fbInterior) parsed.interiorColor = fbInterior[1].toLowerCase();

    const fbFuel = descriptionText.match(/fuel\s*type:\s*(\w+)/i);
    if (fbFuel) parsed.fuelType = fbFuel[1].charAt(0).toUpperCase() + fbFuel[1].slice(1).toLowerCase();

    const fbDriven = descriptionText.match(/driven\s+([\d,]+)\s*miles/i);
    if (fbDriven && !data.rawMileage) {
      data.rawMileage = fbDriven[1];
    }
  }

  if (data.platform === 'OfferUp') {
    // OfferUp title is usually clean: "2008 Hyundai Santa FE"
    // But drivetrain, transmission, condition come as separate tags/badges.
    // These may be embedded in description or as structured fields.
    const ouDrivetrain = descriptionText.match(/\b(front[- ]wheel drive|rear[- ]wheel drive|all[- ]wheel drive|4wd|4x4|awd|fwd|rwd)\b/i);
    if (ouDrivetrain) parsed.drivetrain = ouDrivetrain[0].replace(/-/g, ' ');

    const ouTransmission = descriptionText.match(/\b(automatic|manual|cvt)\b/i);
    if (ouTransmission && !parsed.transmission) parsed.transmission = ouTransmission[1].charAt(0).toUpperCase() + ouTransmission[1].slice(1).toLowerCase();

    // OfferUp condition tags: "regular", "like new", "good", "fair"
    const ouCondition = descriptionText.match(/\b(like new|good|fair|regular|excellent)\b/i);
    if (ouCondition && !data.rawCondition) {
      data.rawCondition = ouCondition[1];
    }
  }

  // Use purged title for vehicle info extraction
  parsed.title = purgedTitle;

  // Extract year - prefer Browse.ai pre-extracted value (OfferUp robot provides this)
  if (data.rawYear) {
    const yearVal = String(data.rawYear).match(/\b(19|20)\d{2}\b/);
    if (yearVal) parsed.year = yearVal[0];
  }
  if (!parsed.year) {
    const yearMatch = purgedTitle.match(titlePatterns.year);
    if (yearMatch) parsed.year = yearMatch[0];
  }
  // Facebook fallback: extract year from description if title didn't have it
  if (!parsed.year && data.platform === 'Facebook') {
    const descYearMatch = descriptionText.match(titlePatterns.year);
    if (descYearMatch) parsed.year = descYearMatch[0];
  }

  // Extract make - try purged title first
  let makeMatch = purgedTitle.match(titlePatterns.make);
  // Facebook fallback: extract make from description if title didn't have it
  if (!makeMatch && data.platform === 'Facebook') {
    makeMatch = descriptionText.match(titlePatterns.make);
  }
  if (makeMatch) parsed.make = standardizeMake(makeMatch[0]);

  // Extract model (context-aware)
  if (parsed.make) {
    // Try purged title first
    const modelPattern = new RegExp(parsed.make + '\\s+(\\w+(?:\\s+\\w+)?)', 'i');
    let modelMatch = purgedTitle.match(modelPattern);
    // Facebook fallback: try description
    if (!modelMatch && data.platform === 'Facebook') {
      // Also try with the raw make name before standardization
      const rawMake = makeMatch ? makeMatch[0] : parsed.make;
      const rawModelPattern = new RegExp(rawMake + '\\s+(\\w+(?:\\s+\\w+)?)', 'i');
      modelMatch = descriptionText.match(rawModelPattern) || descriptionText.match(modelPattern);
    }
    if (modelMatch) parsed.model = modelMatch[1];
  }

  // Extract trim from Craigslist purged title (often has trim after model)
  if (data.platform === 'Craigslist' && parsed.model) {
    const trimPattern = new RegExp(parsed.model + '\\s+(limited|sport|se|le|xle|sr5|lx|ex|touring|premium|base|sxt|slt|lt|ls|xl|xlt|sel|awd|4x4|4wd)', 'i');
    const trimMatch = purgedTitle.match(trimPattern);
    if (trimMatch) parsed.trim = trimMatch[1].toUpperCase();
  }

  // Extract mileage - prefer Browse.ai pre-extracted value (all 3 robots provide this)
  if (data.rawMileage) {
    const mileageVal = String(data.rawMileage).replace(/[^0-9.]/g, '');
    if (mileageVal) {
      let miles = parseFloat(mileageVal);
      // Handle "k" shorthand (e.g. "120k")
      if (String(data.rawMileage).toLowerCase().includes('k') && miles < 1000) {
        miles *= 1000;
      }
      parsed.mileage = Math.round(miles);
    }
  }
  if (!parsed.mileage) {
    const mileageMatch = (purgedTitle + ' ' + descriptionText).match(titlePatterns.mileage);
    if (mileageMatch) {
      parsed.mileage = parseInt(mileageMatch[1] + (mileageMatch[2] || '000'));
    }
  }

  // Extract VIN
  const vinMatch = descriptionText.match(titlePatterns.vin);
  if (vinMatch) parsed.vin = vinMatch[0];

  // Extract color - check purged title, then description
  let colorMatch = purgedTitle.match(titlePatterns.color);
  if (!colorMatch) colorMatch = descriptionText.match(titlePatterns.color);
  if (colorMatch) parsed.color = colorMatch[0].toLowerCase();
  // Use Facebook exterior color if available and no color found
  if (!parsed.color && parsed.exteriorColor) parsed.color = parsed.exteriorColor;

  // Extract Craigslist structured fields from description
  if (data.platform === 'Craigslist') {
    const clTitleStatus = descriptionText.match(/title\s*status:\s*(\w+)/i);
    if (clTitleStatus) parsed.titleStatus = clTitleStatus[1].toLowerCase();

    const clType = descriptionText.match(/type:\s*(\w+)/i);
    if (clType) parsed.bodyType = clType[1];

    const clFuel = descriptionText.match(/fuel:\s*(\w+)/i);
    if (clFuel) parsed.fuelType = clFuel[1].charAt(0).toUpperCase() + clFuel[1].slice(1).toLowerCase();

    const clTransmission = descriptionText.match(/transmission:\s*(\w+)/i);
    if (clTransmission) parsed.transmission = clTransmission[1].charAt(0).toUpperCase() + clTransmission[1].slice(1).toLowerCase();

    // Craigslist drivetrain is often in title: "4x4", "4wd", "awd"
    const clDrivetrain = purgedTitle.match(/\b(4x4|4wd|awd|fwd|rwd|2wd)\b/i);
    if (clDrivetrain) parsed.drivetrain = clDrivetrain[0].toUpperCase();
  }

  // Parse price with quantum intelligence
  parsed.price = parseQuantumPrice(data.rawPrice);

  // Extract ZIP from location
  const zipMatch = parsed.location.match(/\b\d{5}\b/);
  if (zipMatch) parsed.zip = zipMatch[0];

  // Calculate days listed
  if (data.postedDate) {
    const posted = new Date(data.postedDate);
    const now = new Date();
    parsed.daysListed = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  }

  // Extract seller information with quantum patterns
  const sellerData = extractQuantumSellerInfo(data.sellerInfo, data.rawDescription);
  Object.assign(parsed, sellerData);

  // Detect condition - prefer Browse.ai pre-extracted value (Craigslist robot provides this)
  if (data.rawCondition) {
    const conditionStr = String(data.rawCondition).trim().toLowerCase();
    const validConditions = ['excellent', 'very good', 'good', 'fair', 'poor', 'like new', 'new', 'salvage'];
    const matched = validConditions.find(c => conditionStr.includes(c));
    parsed.condition = matched
      ? matched.charAt(0).toUpperCase() + matched.slice(1)
      : detectQuantumCondition(parsed.title, data.rawDescription);
  } else {
    parsed.condition = detectQuantumCondition(parsed.title, data.rawDescription);
  }

  // Find repair keywords
  parsed.repairKeywords = findRepairKeywords(parsed.title + ' ' + data.rawDescription);

  // Detect seller patterns
  parsed.hotSeller = detectHotSeller(data);
  parsed.multipleVehicles = detectMultipleVehicles(data.rawDescription);

  return parsed;
}

function parseQuantumPrice(priceStr) {
  if (!priceStr) return 0;

  // Remove all non-numeric except decimal
  const cleaned = priceStr.replace(/[^0-9.]/g, '');

  // Handle different formats
  let price = parseFloat(cleaned);

  // If price seems too low, might be in thousands
  if (price < 100 && priceStr.toLowerCase().includes('k')) {
    price *= 1000;
  }

  return Math.round(price);
}

function detectQuantumCondition(title, description) {
  const text = (title + ' ' + description).toLowerCase();

  const conditionMap = {
    'excellent': ['excellent', 'mint', 'like new', 'pristine', 'showroom'],
    'very good': ['very good', 'great condition', 'well maintained', 'garage kept'],
    'good': ['good condition', 'clean', 'solid', 'daily driver'],
    'fair': ['fair', 'decent', 'needs work', 'tlc', 'fixer'],
    'poor': ['poor', 'rough', 'project', 'parts car', 'mechanic special']
  };

  for (const [condition, keywords] of Object.entries(conditionMap)) {
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        return condition.charAt(0).toUpperCase() + condition.slice(1);
      }
    }
  }

  // Check for negative indicators
  if (findRepairKeywords(text).length > 2) {
    return 'Fair';
  }

  return 'Good'; // Default
}

function findRepairKeywords(text) {
  const found = [];
  const lowerText = text.toLowerCase();

  for (const item of QUANTUM_CONFIG.REPAIR_KEYWORDS) {
    if (lowerText.includes(item.keyword)) {
      found.push({
        keyword: item.keyword,
        severity: item.severity,
        estimatedCost: item.cost
      });
    }
  }

  return found;
}

function extractQuantumSellerInfo(sellerStr, description) {
  const info = {
    sellerName: '',
    sellerPhone: '',
    sellerEmail: '',
    sellerType: 'Private'
  };

  // Phone extraction with multiple patterns
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
    /\(\d{3}\)\s?\d{3}-?\d{4}/,
    /\b\d{10}\b/
  ];

  for (const pattern of phonePatterns) {
    const match = (sellerStr + ' ' + description).match(pattern);
    if (match) {
      info.sellerPhone = match[0];
      break;
    }
  }

  // Email extraction
  const emailMatch = (sellerStr + ' ' + description).match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  if (emailMatch) {
    info.sellerEmail = emailMatch[0];
  }

  // Name extraction
  if (sellerStr) {
    const nameMatch = sellerStr.match(/^([A-Za-z]+(?:\s+[A-Za-z]+)?)/);
    if (nameMatch) {
      info.sellerName = nameMatch[1];
    }
  }

  // Detect dealer patterns
  const dealerKeywords = ['dealer', 'dealership', 'motors', 'auto', 'cars', 'automotive', 'sales'];
  const lowerText = (sellerStr + ' ' + description).toLowerCase();

  for (const keyword of dealerKeywords) {
    if (lowerText.includes(keyword)) {
      info.sellerType = 'Dealer';
      break;
    }
  }

  return info;
}
