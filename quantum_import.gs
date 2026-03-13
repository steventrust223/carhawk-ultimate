// =========================================================
// FILE: quantum-import.gs - Browse.AI Integration & Import
// =========================================================

function quantumImportSync() {
  const ui = SpreadsheetApp.getUi();
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);

  // Get unprocessed imports
  const importData = importSheet.getDataRange().getValues();
  const unprocessed = [];

  for (let i = 1; i < importData.length; i++) {
    if (!importData[i][13]) { // Not processed
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
      const result = processQuantumImport(item.data, item.row);
      results.push(result);
      processed++;

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

function processQuantumImport(rowData, rowNum) {
  const importSheet = getQuantumSheet(QUANTUM_SHEETS.IMPORT.name);
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);

  // Extract Browse.AI data structure
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
    imageCount: rowData[11]
  };

  // Quantum parsing engine
  const parsed = quantumParseVehicle(importData);

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

  // Mark as processed
  importSheet.getRange(rowNum, 14).setValue(true);
  importSheet.getRange(rowNum, 15).setValue(dealId);

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
    // Enhanced fields from platform-specific robots
    transmission: '',
    fuelType: '',
    bodyStyle: '',
    drivetrain: '',
    titleStatus: '',
    accidents: '',
    owners: '',
    engineSize: '',
    vehicleType: '',
    hours: 0,
    listingId: '',
    bidCount: 0,
    watchers: 0,
    dealRating: '',
    certifiedPreOwned: false,
    features: ''
  };

  // First, extract structured data tags from enhanced description
  // These are injected by the platform-specific Browse.ai importers
  const structuredTags = extractStructuredTags(data.rawDescription);

  // Quantum title parsing with AI patterns
  const titlePatterns = {
    year: /\b(19|20)\d{2}\b/,
    make: /\b(Ford|Chevrolet|Chevy|Toyota|Honda|Nissan|Jeep|Ram|GMC|Hyundai|Kia|Mazda|Subaru|VW|Volkswagen|Audi|BMW|Mercedes|Lexus|Acura|Infiniti|Cadillac|Lincoln|Buick|Chrysler|Dodge|Fiat|Genesis|Jaguar|Land Rover|Maserati|Mini|Mitsubishi|Porsche|Tesla|Volvo|Polaris|Can-Am|Honda|Yamaha|Kawasaki|Arctic Cat|Suzuki|Harley-Davidson|Indian|Triumph|KTM|John Deere|Kubota|Sea-Doo|Ski-Doo|CF Moto)\b/i,
    mileage: /(\d{1,3})[,.]?(\d{3})\s*(?:mi|miles|k)/i,
    vin: /\b[A-HJ-NPR-Z0-9]{17}\b/,
    color: /\b(black|white|silver|gray|grey|red|blue|green|gold|beige|brown|orange|yellow|purple)\b/i
  };

  // Extract year
  const yearMatch = parsed.title.match(titlePatterns.year);
  if (yearMatch) parsed.year = yearMatch[0];

  // Extract make
  const makeMatch = parsed.title.match(titlePatterns.make);
  if (makeMatch) parsed.make = standardizeMake(makeMatch[0]);

  // Extract model (context-aware)
  if (parsed.make) {
    const modelPattern = new RegExp(parsed.make + '\\s+(\\w+(?:\\s+\\w+)?)', 'i');
    const modelMatch = parsed.title.match(modelPattern);
    if (modelMatch) parsed.model = modelMatch[1];
  }

  // Extract mileage - prefer structured tag, fall back to regex
  if (structuredTags.MILEAGE) {
    const tagMileage = parseInt(String(structuredTags.MILEAGE).replace(/[^0-9]/g, ''));
    if (tagMileage > 0) parsed.mileage = tagMileage;
  }
  if (!parsed.mileage) {
    const mileageMatch = (parsed.title + ' ' + data.rawDescription).match(titlePatterns.mileage);
    if (mileageMatch) {
      parsed.mileage = parseInt(mileageMatch[1] + (mileageMatch[2] || '000'));
    }
  }

  // Extract VIN - prefer structured tag
  if (structuredTags.VIN) {
    parsed.vin = structuredTags.VIN;
  } else {
    const vinMatch = data.rawDescription.match(titlePatterns.vin);
    if (vinMatch) parsed.vin = vinMatch[0];
  }

  // Extract color - prefer structured tag
  if (structuredTags.COLOR) {
    parsed.color = structuredTags.COLOR.toLowerCase();
  } else {
    const colorMatch = parsed.title.match(titlePatterns.color);
    if (colorMatch) parsed.color = colorMatch[0].toLowerCase();
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

  // Apply structured tag overrides for seller type
  if (data.sellerInfo && data.sellerInfo.includes('[TYPE:')) {
    const typeMatch = data.sellerInfo.match(/\[TYPE:\s*(\w+)\]/);
    if (typeMatch) parsed.sellerType = typeMatch[1];
  }

  // Detect condition - prefer structured tag, fall back to AI detection
  if (structuredTags.CONDITION && structuredTags.CONDITION !== 'Unknown') {
    parsed.condition = structuredTags.CONDITION;
  } else {
    parsed.condition = detectQuantumCondition(parsed.title, data.rawDescription);
  }

  // Apply all structured tag fields
  if (structuredTags.TRANSMISSION) parsed.transmission = structuredTags.TRANSMISSION;
  if (structuredTags.FUEL) parsed.fuelType = structuredTags.FUEL;
  if (structuredTags.BODY) parsed.bodyStyle = structuredTags.BODY;
  if (structuredTags.DRIVETRAIN) parsed.drivetrain = structuredTags.DRIVETRAIN;
  if (structuredTags.TITLE) parsed.titleStatus = structuredTags.TITLE;
  if (structuredTags.TRIM) parsed.trim = structuredTags.TRIM;
  if (structuredTags.LISTING_ID) parsed.listingId = structuredTags.LISTING_ID;
  if (structuredTags.ACCIDENTS) parsed.accidents = structuredTags.ACCIDENTS;
  if (structuredTags.OWNERS) parsed.owners = structuredTags.OWNERS;
  if (structuredTags.ENGINE_SIZE) parsed.engineSize = structuredTags.ENGINE_SIZE;
  if (structuredTags.VEHICLE_TYPE) parsed.vehicleType = structuredTags.VEHICLE_TYPE;
  if (structuredTags.DEAL_RATING) parsed.dealRating = structuredTags.DEAL_RATING;
  if (structuredTags.FEATURES) parsed.features = structuredTags.FEATURES;
  if (structuredTags.CPO) parsed.certifiedPreOwned = String(structuredTags.CPO).toLowerCase() === 'true' || structuredTags.CPO === 'Yes';
  if (structuredTags.PRICE_HISTORY) parsed.priceHistory = structuredTags.PRICE_HISTORY;
  if (structuredTags.SERIAL) parsed.vin = parsed.vin || structuredTags.SERIAL; // Use serial as VIN fallback for powersports

  // eBay-specific fields
  if (structuredTags.BIDS) parsed.bidCount = parseInt(structuredTags.BIDS) || 0;
  if (structuredTags.WATCHERS) parsed.watchers = parseInt(structuredTags.WATCHERS) || 0;

  // Powersports engine hours
  if (structuredTags.HOURS) parsed.hours = parseInt(String(structuredTags.HOURS).replace(/[^0-9]/g, '')) || 0;

  // Find repair keywords
  parsed.repairKeywords = findRepairKeywords(parsed.title + ' ' + data.rawDescription);

  // Detect seller patterns
  parsed.hotSeller = detectHotSeller(data);
  parsed.multipleVehicles = detectMultipleVehicles(data.rawDescription);

  return parsed;
}

/**
 * Extract structured data tags embedded in enhanced descriptions.
 * Tags follow the format: [TAG_NAME: value]
 */
function extractStructuredTags(description) {
  const tags = {};
  if (!description) return tags;

  const tagPattern = /\[([A-Z_]+):\s*([^\]]+)\]/g;
  let match;
  while ((match = tagPattern.exec(description)) !== null) {
    tags[match[1]] = match[2].trim();
  }

  return tags;
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

  // Detect dealer patterns - uses platform-aware detection if available
  // The enhanced importer may have already embedded [TYPE: ...] in sellerStr
  const typeTag = (sellerStr || '').match(/\[TYPE:\s*(\w+)\]/);
  if (typeTag) {
    info.sellerType = typeTag[1];
  } else {
    const dealerKeywords = [
      'dealer', 'dealership', 'motors', 'auto sales', 'automotive',
      'llc', 'inc', 'financing', 'warranty', 'certified',
      'powersports', 'motorsports', 'marine'
    ];
    const lowerText = (sellerStr + ' ' + description).toLowerCase();

    for (const keyword of dealerKeywords) {
      if (lowerText.includes(keyword)) {
        info.sellerType = 'Dealer';
        break;
      }
    }
  }

  return info;
}
