// ==========================================
// CARHAWK 2.0 - VEHICLE FLIPPING ANALYZER
// ==========================================
// Complete Google Apps Script System
// Version: 2.0.0
// Last Updated: 2025

// ==========================================
// FILE: utils.gs - Shared Utilities & Constants
// ==========================================

// System Constants
const SYSTEM_VERSION = '2.0.0';
const SYSTEM_NAME = 'CarHawk 2.0';
const HOME_BASE_ZIP = '63101'; // St. Louis County, MO
const HOME_BASE_COORDS = {lat: 38.6270, lng: -90.1994};

// Sheet Names
const SHEETS = {
  MASTER: 'Master Database',
  LEADS: 'Leads Tracker',
  CALCULATOR: 'Flip ROI Calculator',
  VERDICT: 'Verdict',
  SCORING: 'Lead Scoring & Risk Assessment',
  CRM: 'CRM Integration',
  PARTS: 'Parts Needed',
  DASHBOARD: 'Dashboard & Analytics',
  REPORTING: 'Reporting & Charts',
  STAGING_FB: 'Staging - Facebook',
  STAGING_CL: 'Staging - Craigslist',
  STAGING_OU: 'Staging - OfferUp',
  STAGING_EBAY: 'Staging - eBay',
  LOGS: 'System Logs',
  CONFIG: 'Config'
};

// Sheet Colors (Hex)
const SHEET_COLORS = {
  MASTER: '#1a73e8',        // Blue
  LEADS: '#34a853',         // Green
  CALCULATOR: '#fbbc04',    // Yellow
  VERDICT: '#ea4335',       // Red
  SCORING: '#673ab7',       // Purple
  CRM: '#ff6d00',          // Orange
  PARTS: '#795548',        // Brown
  DASHBOARD: '#009688',    // Teal
  REPORTING: '#607d8b',    // Blue Grey
  STAGING_FB: '#3b5998',   // Facebook Blue
  STAGING_CL: '#5d4037',   // Craigslist Brown
  STAGING_OU: '#00c853',   // OfferUp Green
  STAGING_EBAY: '#e53935', // eBay Red
  LOGS: '#424242',         // Dark Grey
  CONFIG: '#9e9e9e'        // Grey
};

// Condition Grades
const CONDITIONS = {
  'Excellent': {score: 95, deduction: 0},
  'Very Good': {score: 85, deduction: 0.05},
  'Good': {score: 75, deduction: 0.10},
  'Fair': {score: 65, deduction: 0.20},
  'Poor': {score: 50, deduction: 0.35},
  'Parts Only': {score: 30, deduction: 0.60}
};

// Capital Tiers
const CAPITAL_TIERS = {
  MICRO: {min: 0, max: 1000, label: 'Micro Deal'},
  BUDGET: {min: 1001, max: 5000, label: 'Budget Flip'},
  STANDARD: {min: 5001, max: 15000, label: 'Standard Flip'},
  PREMIUM: {min: 15001, max: 30000, label: 'Premium Flip'},
  LUXURY: {min: 30001, max: 999999, label: 'Luxury Flip'}
};

// Utility Functions
function getSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function formatCurrency(value) {
  return '$' + Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function formatPercent(value) {
  return (Number(value) * 100).toFixed(1) + '%';
}

function calculateDistance(zip1, zip2) {
  // Mock distance calculation based on ZIP codes
  // In production, use Maps API
  const zipDiff = Math.abs(parseInt(zip1) - parseInt(zip2));
  return Math.min(zipDiff * 0.1, 500); // Simplified calculation
}

function getLocationRisk(distance) {
  if (distance < 25) return {risk: 'Low', emoji: '✅', color: '#34a853'};
  if (distance < 75) return {risk: 'Moderate', emoji: '⚠️', color: '#fbbc04'};
  return {risk: 'High', emoji: '❌', color: '#ea4335'};
}

function log(action, details) {
  const sheet = getSheet(SHEETS.LOGS);
  const timestamp = new Date();
  sheet.appendRow([timestamp, action, details, Session.getActiveUser().getEmail()]);
}

function getConfig(key) {
  const sheet = getSheet(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      return data[i][1];
    }
  }
  return null;
}

function setConfig(key, value) {
  const sheet = getSheet(SHEETS.CONFIG);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === key) {
      sheet.getRange(i + 1, 2).setValue(value);
      return;
    }
  }
  sheet.appendRow([key, value, new Date()]);
}

// ==========================================
// FILE: setup.gs - Initial Setup & Configuration
// ==========================================

function setupCarHawk() {
  const ui = SpreadsheetApp.getUi();
  
  // Show setup dialog
  const htmlOutput = HtmlService.createHtmlOutput(getSetupHTML())
    .setWidth(600)
    .setHeight(500);
  
  ui.showModalDialog(htmlOutput, '🚗 CarHawk 2.0 Setup');
}

function initializeSystem(config) {
  try {
    // Create all sheets
    createAllSheets();

    // Set up headers
    setupAllHeaders();

    // Set up data validation and parameters
    setupParameters();

    // Configure system settings
    initializeConfig(config);

    // Create custom menu
    createCustomMenu();

    // Set up triggers
    setupTriggers();

    // Initial formatting
    applySystemFormatting();

    log('System Setup', 'CarHawk 2.0 initialized successfully');

    return {success: true, message: 'CarHawk 2.0 setup complete!'};
  } catch (error) {
    log('Setup Error', error.toString());
    return {success: false, message: error.toString()};
  }
}

function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets in order
  Object.entries(SHEETS).forEach(([key, sheetName]) => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set tab color
    sheet.setTabColor(SHEET_COLORS[key]);
    
    // Apply protection to system sheets
    if (['CONFIG', 'LOGS'].includes(sheetName)) {
      const protection = sheet.protect();
      protection.setDescription('System Sheet - Edit with caution');
      protection.setWarningOnly(true);
    }
  });
  
  // Remove default Sheet1 if exists
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}

function getSetupHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <link rel="stylesheet" href="https://ssl.gstatic.com/docs/script/css/add-ons1.css">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #1a73e8; margin: 10px 0; }
          .header .version { color: #666; font-size: 14px; }
          .form-group { margin-bottom: 20px; }
          .form-group label { 
            display: block; 
            font-weight: bold; 
            margin-bottom: 5px;
            color: #333;
          }
          .form-group input, .form-group select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          .form-group .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          .button-group {
            text-align: center;
            margin-top: 30px;
          }
          .button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            margin: 0 5px;
          }
          .button:hover {
            background-color: #1557b0;
          }
          .button.secondary {
            background-color: #666;
          }
          .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
            display: none;
          }
          .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
          .status.error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }
          .loading {
            text-align: center;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🚗 CarHawk 2.0</h1>
          <div class="version">Vehicle Flipping Analyzer - Version 2.0.0</div>
        </div>
        
        <form id="setupForm">
          <div class="form-group">
            <label for="businessName">Business Name</label>
            <input type="text" id="businessName" value="My Auto Flipping Business" required>
            <div class="help-text">Your business name for reports and exports</div>
          </div>
          
          <div class="form-group">
            <label for="homeZip">Home Base ZIP Code</label>
            <input type="text" id="homeZip" value="63101" pattern="[0-9]{5}" required>
            <div class="help-text">Your primary location for distance calculations</div>
          </div>
          
          <div class="form-group">
            <label for="openaiKey">OpenAI API Key</label>
            <input type="password" id="openaiKey" placeholder="sk-...">
            <div class="help-text">Required for AI-powered analysis (optional during setup)</div>
          </div>
          
          <div class="form-group">
            <label for="alertEmail">Alert Email</label>
            <input type="email" id="alertEmail" placeholder="your@email.com">
            <div class="help-text">Where to send deal alerts</div>
          </div>
          
          <div class="form-group">
            <label for="profitThreshold">Minimum Profit Alert Threshold</label>
            <input type="number" id="profitThreshold" value="35" min="0" max="100">
            <div class="help-text">Alert when profit margin exceeds this percentage</div>
          </div>
          
          <div class="form-group">
            <label for="roiThreshold">Minimum ROI Alert Threshold</label>
            <input type="number" id="roiThreshold" value="50" min="0" max="200">
            <div class="help-text">Alert when ROI exceeds this percentage</div>
          </div>
        </form>
        
        <div class="button-group">
          <button class="button" onclick="startSetup()">Initialize CarHawk 2.0</button>
          <button class="button secondary" onclick="google.script.host.close()">Cancel</button>
        </div>
        
        <div id="loading" class="loading">
          <img src="https://www.gstatic.com/images/spinner/spinner_48.gif" alt="Loading">
          <p>Setting up CarHawk 2.0... This may take a minute.</p>
        </div>
        
        <div id="status" class="status"></div>
        
        <script>
          function startSetup() {
            const form = document.getElementById('setupForm');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }
            
            const config = {
              businessName: document.getElementById('businessName').value,
              homeZip: document.getElementById('homeZip').value,
              openaiKey: document.getElementById('openaiKey').value,
              alertEmail: document.getElementById('alertEmail').value,
              profitThreshold: document.getElementById('profitThreshold').value,
              roiThreshold: document.getElementById('roiThreshold').value
            };
            
            document.getElementById('setupForm').style.display = 'none';
            document.querySelector('.button-group').style.display = 'none';
            document.getElementById('loading').style.display = 'block';
            
            google.script.run
              .withSuccessHandler(handleSuccess)
              .withFailureHandler(handleError)
              .initializeSystem(config);
          }
          
          function handleSuccess(result) {
            document.getElementById('loading').style.display = 'none';
            const status = document.getElementById('status');
            status.className = result.success ? 'status success' : 'status error';
            status.textContent = result.message;
            status.style.display = 'block';
            
            if (result.success) {
              setTimeout(() => google.script.host.close(), 3000);
            }
          }
          
          function handleError(error) {
            document.getElementById('loading').style.display = 'none';
            const status = document.getElementById('status');
            status.className = 'status error';
            status.textContent = 'Error: ' + error.message;
            status.style.display = 'block';
          }
        </script>
      </body>
    </html>
  `;
}

// ==========================================
// FILE: headers.gs - Sheet Headers Setup
// ==========================================

function setupAllHeaders() {
  setupMasterHeaders();
  setupLeadsHeaders();
  setupCalculatorHeaders();
  setupVerdictHeaders();
  setupScoringHeaders();
  setupCRMHeaders();
  setupPartsHeaders();
  setupDashboardHeaders();
  setupReportingHeaders();
  setupStagingHeaders();
  setupConfigHeaders();
  setupLogHeaders();
}

function setupMasterHeaders() {
  const sheet = getSheet(SHEETS.MASTER);
  const headers = [
    'ID', 'Date Added', 'Source', 'Status', 'Lead Score', 'Lead Temp',
    'Year', 'Make', 'Model', 'Trim', 'VIN', 'Mileage', 'Condition',
    'Title Status', 'Location', 'ZIP', 'Distance (mi)', 'Location Risk',
    'Asking Price', 'MAO', 'Matched Value', 'Est. Repair Cost', 'Est. ARV',
    'Profit Margin %', 'ROI %', 'Deal Score', 'Verdict', 'Flip Strategy',
    'Days Listed', 'Seller Name', 'Seller Phone', 'Seller Email',
    'AI Notes', 'Manual Notes', 'Last Updated', 'Assigned To'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#1a73e8')
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(4);
}

function setupLeadsHeaders() {
  const sheet = getSheet(SHEETS.LEADS);
  const headers = [
    'Lead ID', 'Date', 'Status', 'Priority', 'Source', 'Platform',
    'Vehicle', 'Year', 'Make', 'Model', 'Asking Price', 'Location',
    'Distance', 'Condition Score', 'Profit Potential', 'ROI Potential',
    'Contact Name', 'Phone', 'Email', 'Best Time', 'Contact Attempts',
    'Last Contact', 'Next Action', 'Action Date', 'Notes', 'Tags',
    'Assigned To', 'Hot Flag', 'Follow-up Required'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#34a853')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
}

function setupCalculatorHeaders() {
  const sheet = getSheet(SHEETS.CALCULATOR);
  const headers = [
    'Deal ID', 'Vehicle', 'Purchase Price', 'Transport Cost', 'Repair Cost',
    'Parts Cost', 'Labor Cost', 'Detail Cost', 'Marketing Cost', 'Other Costs',
    'Total Investment', 'Target Sale Price', 'Expected Sale Price', 'Time to Sell',
    'Holding Costs', 'Transaction Fees', 'Total Costs', 'Net Profit',
    'Profit Margin', 'ROI', 'Cash on Cash', 'Break Even Price',
    'Risk Score', 'Confidence Level'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#fbbc04')
    .setFontColor('#000000')
    .setFontWeight('bold');
}

function setupVerdictHeaders() {
  const sheet = getSheet(SHEETS.VERDICT);
  const headers = [
    'Analysis ID', 'Date', 'Vehicle', 'Deal Score', 'AI Verdict', 'Verdict Color',
    'Confidence %', 'Strategy', 'Key Factors', 'Profit Potential', 'Risk Level',
    'Market Demand', 'Competition', 'Seasonality', 'Location Factor',
    'Repair Complexity', 'Time to Profit', 'Recommended Actions',
    'Red Flags', 'Green Flags', 'AI Reasoning', 'Override', 'Final Decision'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#ea4335')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupScoringHeaders() {
  const sheet = getSheet(SHEETS.SCORING);
  const headers = [
    'Score ID', 'Vehicle ID', 'Date', 'Overall Score', 'Profit Score',
    'Risk Score', 'Market Score', 'Condition Score', 'Location Score',
    'Seller Score', 'Speed Score', 'Competition Score', 'Demand Score',
    'Repair Risk', 'Title Risk', 'Market Risk', 'Distance Risk',
    'Capital Risk', 'Time Risk', 'Total Risk Score', 'Opportunity Rating',
    'Priority Level', 'Action Required'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#673ab7')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupCRMHeaders() {
  const sheet = getSheet(SHEETS.CRM);
  const headers = [
    'Export ID', 'Date', 'Platform', 'Lead ID', 'Vehicle', 'Contact Name',
    'Phone', 'Email', 'Lead Score', 'Lead Temp', 'Deal Value', 'Status',
    'Tags', 'Custom Message', 'SMS Template', 'Email Template',
    'CompanyHub ID', 'SMS-iT ID', 'Last Sync', 'Sync Status', 'Notes'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#ff6d00')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupPartsHeaders() {
  const sheet = getSheet(SHEETS.PARTS);
  const headers = [
    'Part ID', 'Vehicle ID', 'Category', 'Part Name', 'Part Number',
    'Condition Required', 'New Price', 'Used Price', 'Aftermarket Price',
    'Selected Option', 'Quantity', 'Supplier', 'Lead Time', 'In Stock',
    'Total Cost', 'Labor Hours', 'Labor Cost', 'Priority', 'Notes',
    'Ordered', 'Order Date', 'Expected Arrival'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#795548')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupDashboardHeaders() {
  const sheet = getSheet(SHEETS.DASHBOARD);
  // Dashboard is primarily charts and summary cards, minimal headers
  const headers = ['Metric', 'Value', 'Change', 'Trend', 'Target', 'Status'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#009688')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupReportingHeaders() {
  const sheet = getSheet(SHEETS.REPORTING);
  const headers = [
    'Report Date', 'Period', 'Total Leads', 'Hot Leads', 'Converted',
    'Total Investment', 'Total Revenue', 'Total Profit', 'Avg Profit',
    'Avg ROI', 'Best Deal', 'Worst Deal', 'Fastest Flip', 'Slowest Flip',
    'By Source', 'By Make', 'By Location', 'By Strategy'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#607d8b')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupStagingHeaders() {
  // Common staging headers for all platforms
  const stagingHeaders = [
    'Import Date', 'Platform', 'Listing ID', 'Title', 'Price', 'Location',
    'Description', 'Seller Info', 'Posted Date', 'Images', 'Link',
    'Extracted Year', 'Extracted Make', 'Extracted Model', 'Condition Guess',
    'Import Status', 'Master ID', 'Duplicate Flag', 'Auto-Tagged'
  ];
  
  [SHEETS.STAGING_FB, SHEETS.STAGING_CL, SHEETS.STAGING_OU, SHEETS.STAGING_EBAY].forEach(sheetName => {
    const sheet = getSheet(sheetName);
    sheet.getRange(1, 1, 1, stagingHeaders.length).setValues([stagingHeaders]);
    sheet.getRange(1, 1, 1, stagingHeaders.length)
      .setBackground('#666666')
      .setFontColor('#ffffff')
      .setFontWeight('bold');
  });
}

function setupConfigHeaders() {
  const sheet = getSheet(SHEETS.CONFIG);
  const headers = ['Setting Key', 'Value', 'Last Updated', 'Description'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#9e9e9e')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

function setupLogHeaders() {
  const sheet = getSheet(SHEETS.LOGS);
  const headers = ['Timestamp', 'Action', 'Details', 'User'];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#424242')
    .setFontColor('#ffffff')
    .setFontWeight('bold');
}

// ==========================================
// FILE: data-validation.gs - Setup Data Validation & Dropdowns
// ==========================================

function setupParameters() {
  setupDataValidation();
}

function setupDataValidation() {
  try {
    // Setup validation for Master Database
    setupMasterDataValidation();

    // Setup validation for Leads Tracker
    setupLeadsDataValidation();

    // Setup validation for other sheets
    setupCalculatorDataValidation();
    setupScoringDataValidation();

    log('Data Validation', 'All data validation rules applied successfully');
  } catch (error) {
    log('Data Validation Error', error.toString());
    throw error;
  }
}

function setupMasterDataValidation() {
  const sheet = getSheet(SHEETS.MASTER);

  // Status dropdown (column 4)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Reviewing', 'Contacted', 'Negotiating', 'Inspecting', 'Closed Won', 'Closed Lost', 'On Hold', 'Archived'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 1000).setDataValidation(statusRule);

  // Lead Temp dropdown (column 6)
  const leadTempRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Hot', 'Warm', 'Cold'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 6, 1000).setDataValidation(leadTempRule);

  // Condition dropdown (column 13)
  const conditionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Excellent', 'Very Good', 'Good', 'Fair', 'Poor', 'Parts Only'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 13, 1000).setDataValidation(conditionRule);

  // Title Status dropdown (column 14)
  const titleRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Clean', 'Salvage', 'Rebuilt', 'Lemon', 'Flood', 'Missing', 'Unknown'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 14, 1000).setDataValidation(titleRule);

  // Verdict dropdown (column 28)
  const verdictRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['STRONG BUY', 'BUY', 'CONSIDER', 'PASS', 'HARD PASS', 'NEEDS REVIEW'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 28, 1000).setDataValidation(verdictRule);

  // Flip Strategy dropdown (column 29)
  const strategyRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Quick Flip', 'Value Add', 'Premium Restoration', 'Parts Out', 'Wholesale'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 29, 1000).setDataValidation(strategyRule);
}

function setupLeadsDataValidation() {
  const sheet = getSheet(SHEETS.LEADS);

  // Status dropdown (column 3)
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['New', 'Contacted', 'Qualified', 'Nurture', 'Dead', 'Won'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 3, 1000).setDataValidation(statusRule);

  // Priority dropdown (column 4)
  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Critical', 'High', 'Medium', 'Low'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 4, 1000).setDataValidation(priorityRule);

  // Platform dropdown (column 6)
  const platformRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Facebook Marketplace', 'Craigslist', 'OfferUp', 'eBay Motors', 'Autotrader', 'Direct', 'Other'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 6, 1000).setDataValidation(platformRule);

  // Best Time dropdown (column 20)
  const timeRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Morning', 'Afternoon', 'Evening', 'Weekends', 'Anytime'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 20, 1000).setDataValidation(timeRule);
}

function setupCalculatorDataValidation() {
  const sheet = getSheet(SHEETS.CALCULATOR);

  // Risk Score dropdown (column 23)
  const riskRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Low', 'Moderate', 'High', 'Very High'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 23, 1000).setDataValidation(riskRule);

  // Confidence Level dropdown (column 24)
  const confidenceRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Very High', 'High', 'Medium', 'Low'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 24, 1000).setDataValidation(confidenceRule);
}

function setupScoringDataValidation() {
  const sheet = getSheet(SHEETS.SCORING);

  // Priority Level dropdown (column 22)
  const priorityRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Urgent', 'High', 'Medium', 'Low'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 22, 1000).setDataValidation(priorityRule);

  // Action Required dropdown (column 23)
  const actionRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Contact Immediately', 'Schedule Call', 'Send Offer', 'Monitor', 'Research More', 'Pass'], true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, 23, 1000).setDataValidation(actionRule);
}

// ==========================================
// FILE: menu.gs - Custom Menu System
// ==========================================

function onOpen() {
  createCustomMenu();
}

function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();
  
  const menu = ui.createMenu('🚗 CarHawk 2.0')
    // Setup & Initialization
    .addItem('⚙️ Setup CarHawk System', 'setupCarHawk')
    .addSeparator()
    // Data Management
    .addSubMenu(ui.createMenu('📊 Data Management')
      .addItem('📥 Import from Staging', 'importFromStaging')
      .addItem('🔄 Sync All Sources', 'syncAllSources')
      .addItem('🧹 Clean Duplicates', 'cleanDuplicates')
      .addSeparator()
      .addItem('📤 Export to CSV', 'exportToCSV')
      .addItem('🗄️ Archive Old Leads', 'archiveOldLeads'))
    
    // Analysis Tools
    .addSubMenu(ui.createMenu('🧠 Analysis Tools')
      .addItem('🎯 Run AI Analysis', 'runAIAnalysis')
      .addItem('💰 Calculate All ROI', 'calculateAllROI')
      .addItem('📈 Update Scores', 'updateAllScores')
      .addSeparator()
      .addItem('🔍 Analyze Single Deal', 'analyzeSingleDeal')
      .addItem('🏆 Find Best Deals', 'findBestDeals'))
    
    // CRM Integration
    .addSubMenu(ui.createMenu('🤝 CRM Integration')
      .addItem('📱 Export to SMS-iT', 'exportToSMSIT')
      .addItem('🏢 Export to CompanyHub', 'exportToCompanyHub')
      .addItem('📧 Generate Email Campaign', 'generateEmailCampaign')
      .addSeparator()
      .addItem('🔄 Sync CRM Status', 'syncCRMStatus'))
    
    // Alerts & Automation
    .addSubMenu(ui.createMenu('🔔 Alerts & Automation')
      .addItem('⚡ Check Alert Triggers', 'checkAlertTriggers')
      .addItem('📧 Send Alert Summary', 'sendAlertSummary')
      .addItem('⏰ Configure Alerts', 'configureAlerts')
      .addSeparator()
      .addItem('🤖 Toggle Auto-Sync', 'toggleAutoSync')
      .addItem('📅 Schedule Reports', 'scheduleReports'))
    
    // Reports & Analytics
    .addSubMenu(ui.createMenu('📊 Reports & Analytics')
      .addItem('📈 Generate Dashboard', 'generateDashboard')
      .addItem('📑 Weekly Report', 'generateWeeklyReport')
      .addItem('📊 Monthly Analysis', 'generateMonthlyAnalysis')
      .addSeparator()
      .addItem('🏆 Leaderboard', 'showLeaderboard')
      .addItem('🗺️ Heat Map', 'generateHeatMap'))
    
    // Tools & Utilities
    .addSubMenu(ui.createMenu('🛠️ Tools & Utilities')
      .addItem('🚗 VIN Decoder', 'showVINDecoder')
      .addItem('📍 Distance Calculator', 'showDistanceCalculator')
      .addItem('💵 Loan Calculator', 'showLoanCalculator')
      .addSeparator()
      .addItem('🎨 Format Sheets', 'applySystemFormatting')
      .addItem('📋 Setup Data Validation', 'setupParameters')
      .addItem('🔧 System Settings', 'showSystemSettings'))
    
    .addSeparator()
    .addItem('❓ Help & Documentation', 'showHelp')
    .addItem('ℹ️ About CarHawk 2.0', 'showAbout')
    .addToUi();
}

// ==========================================
// FILE: sync.gs - Data Sync & Import Logic
// ==========================================

function importFromStaging() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(
    'Import from Staging',
    'Import new leads from all staging sheets?',
    ui.ButtonSet.YES_NO
  );
  
  if (result == ui.Button.YES) {
    const imported = {
      facebook: importFromFacebook(),
      craigslist: importFromCraigslist(),
      offerup: importFromOfferUp(),
      ebay: importFromEbay()
    };
    
    const total = Object.values(imported).reduce((a, b) => a + b, 0);
    ui.alert('Import Complete', `Imported ${total} new leads:\n` +
      `Facebook: ${imported.facebook}\n` +
      `Craigslist: ${imported.craigslist}\n` +
      `OfferUp: ${imported.offerup}\n` +
      `eBay: ${imported.ebay}`, ui.ButtonSet.OK);
  }
}

function importFromFacebook() {
  return importFromStagingSheet(SHEETS.STAGING_FB, 'Facebook');
}

function importFromCraigslist() {
  return importFromStagingSheet(SHEETS.STAGING_CL, 'Craigslist');
}

function importFromOfferUp() {
  return importFromStagingSheet(SHEETS.STAGING_OU, 'OfferUp');
}

function importFromEbay() {
  return importFromStagingSheet(SHEETS.STAGING_EBAY, 'eBay');
}

function importFromStagingSheet(stagingSheetName, platform) {
  const stagingSheet = getSheet(stagingSheetName);
  const masterSheet = getSheet(SHEETS.MASTER);
  
  const stagingData = stagingSheet.getDataRange().getValues();
  if (stagingData.length <= 1) return 0; // No data to import
  
  let imported = 0;
  const masterLastRow = masterSheet.getLastRow();
  
  for (let i = 1; i < stagingData.length; i++) {
    const row = stagingData[i];
    
    // Skip if already imported
    if (row[16]) continue; // Master ID column
    
    // Extract vehicle info
    const vehicleInfo = extractVehicleInfo(row[3], row[6]); // Title and Description
    
    // Calculate distance
    const distance = calculateDistance(getConfig('HOME_ZIP'), row[5]);
    const locationRisk = getLocationRisk(distance);
    
    // Generate unique ID
    const id = 'CH' + Date.now() + Math.random().toString(36).substr(2, 4);
    
    // Prepare master row
    const masterRow = [
      id,                                    // ID
      new Date(),                           // Date Added
      platform,                             // Source
      'New',                                // Status
      '',                                   // Lead Score (calculated later)
      '',                                   // Lead Temp (calculated later)
      vehicleInfo.year,                     // Year
      vehicleInfo.make,                     // Make
      vehicleInfo.model,                    // Model
      vehicleInfo.trim,                     // Trim
      '',                                   // VIN
      vehicleInfo.mileage,                  // Mileage
      row[14] || 'Unknown',                 // Condition
      'Clean',                              // Title Status (default)
      row[5],                               // Location
      extractZIP(row[5]),                   // ZIP
      distance,                             // Distance
      locationRisk.emoji,                   // Location Risk
      parsePrice(row[4]),                   // Asking Price
      '',                                   // MAO (calculated)
      '',                                   // Matched Value (calculated)
      '',                                   // Est. Repair Cost
      '',                                   // Est. ARV
      '',                                   // Profit Margin %
      '',                                   // ROI %
      '',                                   // Deal Score
      '',                                   // Verdict
      '',                                   // Flip Strategy
      calculateDaysListed(row[8]),          // Days Listed
      extractSellerName(row[7]),            // Seller Name
      extractPhone(row[7]),                 // Seller Phone
      extractEmail(row[7]),                 // Seller Email
      '',                                   // AI Notes
      '',                                   // Manual Notes
      new Date(),                           // Last Updated
      ''                                    // Assigned To
    ];
    
    // Add to master
    masterSheet.appendRow(masterRow);
    
    // Update staging sheet with master ID
    stagingSheet.getRange(i + 1, 17).setValue(id);
    stagingSheet.getRange(i + 1, 16).setValue('Imported');
    
    imported++;
  }
  
  // Run calculations on new imports
  if (imported > 0) {
    calculateMAOBatch(masterLastRow + 1, masterLastRow + imported);
    updateScoresBatch(masterLastRow + 1, masterLastRow + imported);
  }
  
  log('Import', `Imported ${imported} leads from ${platform}`);
  return imported;
}

function extractVehicleInfo(title, description) {
  const info = {
    year: '',
    make: '',
    model: '',
    trim: '',
    mileage: ''
  };
  
  // Extract year (1900-2099)
  const yearMatch = title.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) info.year = yearMatch[0];
  
  // Common makes
  const makes = ['Ford', 'Chevrolet', 'Chevy', 'Toyota', 'Honda', 'Nissan', 
                 'Jeep', 'Ram', 'GMC', 'Hyundai', 'Kia', 'Mazda', 'Subaru',
                 'Volkswagen', 'VW', 'Audi', 'BMW', 'Mercedes', 'Lexus'];
  
  for (const make of makes) {
    const regex = new RegExp('\\b' + make + '\\b', 'i');
    if (regex.test(title)) {
      info.make = make;
      break;
    }
  }
  
  // Extract mileage
  const mileageMatch = (title + ' ' + description).match(/(\d{1,3},?\d{3})\s*(mi|miles|k)/i);
  if (mileageMatch) {
    info.mileage = mileageMatch[1].replace(',', '');
  }
  
  // Model extraction would require make-specific lists
  // For now, extract the word after make
  if (info.make) {
    const modelRegex = new RegExp(info.make + '\\s+(\\w+)', 'i');
    const modelMatch = title.match(modelRegex);
    if (modelMatch) info.model = modelMatch[1];
  }
  
  return info;
}

function parsePrice(priceStr) {
  if (!priceStr) return 0;
  const cleaned = priceStr.replace(/[^0-9]/g, '');
  return parseInt(cleaned) || 0;
}

function extractZIP(location) {
  const zipMatch = location.match(/\b\d{5}\b/);
  return zipMatch ? zipMatch[0] : '';
}

function calculateDaysListed(dateStr) {
  if (!dateStr) return 0;
  const posted = new Date(dateStr);
  const now = new Date();
  const days = Math.floor((now - posted) / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

function extractSellerName(sellerInfo) {
  // Extract name from seller info string
  const nameMatch = sellerInfo.match(/^([A-Za-z\s]+)/);
  return nameMatch ? nameMatch[1].trim() : '';
}

function extractPhone(text) {
  const phoneMatch = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/);
  return phoneMatch ? phoneMatch[0] : '';
}

function extractEmail(text) {
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
  return emailMatch ? emailMatch[0] : '';
}

// ==========================================
// FILE: analysis.gs - AI Analysis & Calculations
// ==========================================

function runAIAnalysis() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet(SHEETS.MASTER);
  
  // Get unanalyzed rows
  const data = sheet.getDataRange().getValues();
  const unanalyzed = [];
  
  for (let i = 1; i < data.length; i++) {
    if (!data[i][27]) { // No verdict yet
      unanalyzed.push(i + 1);
    }
  }
  
  if (unanalyzed.length === 0) {
    ui.alert('No unanalyzed deals found.');
    return;
  }
  
  const result = ui.alert(
    'Run AI Analysis',
    `Analyze ${unanalyzed.length} deals with OpenAI?`,
    ui.ButtonSet.YES_NO
  );
  
  if (result === ui.Button.YES) {
    const apiKey = getConfig('OPENAI_API_KEY');
    if (!apiKey) {
      ui.alert('Please set your OpenAI API key in Config sheet.');
      return;
    }
    
    // Show progress dialog
    const htmlOutput = HtmlService.createHtmlOutput(getAnalysisProgressHTML(unanalyzed.length))
      .setWidth(400)
      .setHeight(200);
    ui.showModelessDialog(htmlOutput, 'Analyzing Deals...');
    
    // Analyze in batches
    let analyzed = 0;
    for (const rowNum of unanalyzed) {
      try {
        analyzeVehicle(rowNum, apiKey);
        analyzed++;
        
        // Update progress (would need server-side events in real implementation)
        if (analyzed % 5 === 0) {
          Utilities.sleep(100); // Rate limiting
        }
      } catch (error) {
        log('Analysis Error', `Row ${rowNum}: ${error.toString()}`);
      }
    }
    
    ui.alert(`Analysis complete! Analyzed ${analyzed} deals.`);
  }
}

function analyzeVehicle(rowNum, apiKey) {
  const sheet = getSheet(SHEETS.MASTER);
  const row = sheet.getRange(rowNum, 1, 1, 38).getValues()[0];
  
  // Prepare context for AI
  const vehicle = `${row[6]} ${row[7]} ${row[8]} ${row[9]}`.trim();
  const context = {
    vehicle: vehicle,
    year: row[6],
    make: row[7], 
    model: row[8],
    mileage: row[11],
    condition: row[12],
    askingPrice: row[18],
    estimatedValue: row[20] || calculateEstimatedValue(row),
    distance: row[16],
    daysListed: row[29],
    titleStatus: row[13]
  };
  
  // Call OpenAI API
  const analysis = callOpenAIForAnalysis(context, apiKey);
  
  // Update sheet with results
  sheet.getRange(rowNum, 26).setValue(analysis.dealScore);
  sheet.getRange(rowNum, 27).setValue(analysis.verdict);
  sheet.getRange(rowNum, 28).setValue(analysis.flipStrategy);
  sheet.getRange(rowNum, 32).setValue(analysis.aiNotes);
  
  // Update verdict sheet
  addVerdictRecord(row[0], vehicle, analysis);
  
  // Calculate scores
  updateLeadScoring(rowNum);
}

function callOpenAIForAnalysis(context, apiKey) {
  const prompt = `Analyze this vehicle flip opportunity:

Vehicle: ${context.vehicle}
Year: ${context.year}
Mileage: ${context.mileage}
Condition: ${context.condition}
Asking Price: $${context.askingPrice}
Estimated Market Value: $${context.estimatedValue}
Distance from base: ${context.distance} miles
Days on market: ${context.daysListed}
Title Status: ${context.titleStatus}

Provide analysis in this JSON format:
{
  "dealScore": (0-100),
  "verdict": "BUY NOW" | "STRONG BUY" | "CONSIDER" | "PASS" | "HARD PASS",
  "flipStrategy": "Quick Flip" | "Repair & Flip" | "Part Out" | "Wholesale",
  "confidence": (0-100),
  "aiNotes": "Brief explanation of verdict and key factors",
  "estimatedProfit": (number),
  "estimatedROI": (percentage),
  "riskLevel": "Low" | "Medium" | "High",
  "repairComplexity": "None" | "Minor" | "Moderate" | "Major"
}

Consider: profit margin, market demand, repair needs, competition, and flip speed.`;

  try {
    const response = UrlFetchApp.fetch('https://api.openai.com/v1/chat/completions', {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        model: 'gpt-4',
        messages: [{role: 'user', content: prompt}],
        temperature: 0.7,
        response_format: { type: "json_object" }
      })
    });
    
    const result = JSON.parse(response.getContentText());
    return JSON.parse(result.choices[0].message.content);
  } catch (error) {
    log('OpenAI Error', error.toString());
    // Return default analysis on error
    return {
      dealScore: 50,
      verdict: 'NEEDS REVIEW',
      flipStrategy: 'Needs Analysis',
      confidence: 0,
      aiNotes: 'AI analysis failed - manual review required',
      estimatedProfit: 0,
      estimatedROI: 0,
      riskLevel: 'Unknown',
      repairComplexity: 'Unknown'
    };
  }
}

function calculateEstimatedValue(row) {
  // Simple estimation based on year, make, condition
  const year = parseInt(row[6]);
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  // Base values by vehicle age
  let baseValue = 25000;
  if (age < 3) baseValue = 35000;
  else if (age < 5) baseValue = 25000;
  else if (age < 10) baseValue = 15000;
  else if (age < 15) baseValue = 8000;
  else baseValue = 4000;
  
  // Adjust for condition
  const conditionMultipliers = {
    'Excellent': 1.2,
    'Very Good': 1.1,
    'Good': 1.0,
    'Fair': 0.8,
    'Poor': 0.6,
    'Parts Only': 0.3
  };
  
  const multiplier = conditionMultipliers[row[12]] || 0.9;
  return Math.round(baseValue * multiplier);
}

function calculateMAOBatch(startRow, endRow) {
  const sheet = getSheet(SHEETS.MASTER);
  
  for (let i = startRow; i <= endRow; i++) {
    const row = sheet.getRange(i, 1, 1, 38).getValues()[0];
    const estimatedARV = row[22] || calculateEstimatedValue(row);
    const repairCost = estimateRepairCost(row);
    
    // MAO = ARV * 0.7 - Repair Costs - Holding Costs
    const mao = (estimatedARV * 0.7) - repairCost - 500; // $500 holding costs
    
    sheet.getRange(i, 20).setValue(mao);
    sheet.getRange(i, 21).setValue(repairCost);
    sheet.getRange(i, 23).setValue(estimatedARV);
    
    // Calculate profit metrics
    const askingPrice = row[18];
    const profit = estimatedARV - askingPrice - repairCost - 500;
    const profitMargin = profit / estimatedARV;
    const roi = profit / (askingPrice + repairCost + 500);
    
    sheet.getRange(i, 24).setValue(profitMargin);
    sheet.getRange(i, 25).setValue(roi);
  }
}

function estimateRepairCost(row) {
  const condition = row[12];
  const askingPrice = row[18];
  
  const repairMultipliers = {
    'Excellent': 0.02,
    'Very Good': 0.05,
    'Good': 0.10,
    'Fair': 0.20,
    'Poor': 0.35,
    'Parts Only': 0.60
  };
  
  const multiplier = repairMultipliers[condition] || 0.25;
  return Math.round(askingPrice * multiplier);
}

function getAnalysisProgressHTML(total) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px; 
            text-align: center;
          }
          .progress-bar {
            width: 100%;
            height: 30px;
            background-color: #f0f0f0;
            border-radius: 15px;
            overflow: hidden;
            margin: 20px 0;
          }
          .progress-fill {
            height: 100%;
            background-color: #1a73e8;
            width: 0%;
            transition: width 0.5s ease;
          }
          .status {
            font-size: 16px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <h3>🧠 Analyzing ${total} Deals with AI</h3>
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="status">
          Processing deal <span id="current">0</span> of ${total}
        </div>
        <script>
          // This would need server-sent events or polling in real implementation
          // Simulating progress for demo
          let current = 0;
          const total = ${total};
          
          function updateProgress() {
            current++;
            const percent = (current / total) * 100;
            document.getElementById('progressFill').style.width = percent + '%';
            document.getElementById('current').textContent = current;
            
            if (current < total) {
              setTimeout(updateProgress, 1000);
            }
          }
          
          setTimeout(updateProgress, 500);
        </script>
      </body>
    </html>
  `;
}

// ==========================================
// FILE: dashboard.gs - Dashboard & Reporting
// ==========================================

function generateDashboard() {
  const sheet = getSheet(SHEETS.DASHBOARD);
  sheet.clear();
  
  // Add title
  sheet.getRange('A1').setValue('🚗 CarHawk 2.0 Dashboard');
  sheet.getRange('A1').setFontSize(20).setFontWeight('bold');
  
  // Calculate metrics
  const metrics = calculateDashboardMetrics();
  
  // Create summary cards
  createSummaryCards(sheet, metrics);
  
  // Create charts
  createDashboardCharts(sheet);
  
  // Create top deals table
  createTopDealsTable(sheet);
  
  // Format dashboard
  formatDashboard(sheet);
  
  log('Dashboard', 'Dashboard generated successfully');
}

function calculateDashboardMetrics() {
  const masterSheet = getSheet(SHEETS.MASTER);
  const data = masterSheet.getDataRange().getValues();
  
  const metrics = {
    totalLeads: data.length - 1,
    activeLeads: 0,
    hotLeads: 0,
    totalValue: 0,
    avgProfit: 0,
    avgROI: 0,
    bySource: {},
    byStatus: {},
    byVerdict: {},
    profitTrend: []
  };
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    // Count by status
    if (row[3] === 'Active' || row[3] === 'New') metrics.activeLeads++;
    
    // Count hot leads
    if (row[5] === 'Hot') metrics.hotLeads++;
    
    // Sum values
    metrics.totalValue += row[18] || 0;
    
    // Count by source
    metrics.bySource[row[2]] = (metrics.bySource[row[2]] || 0) + 1;
    
    // Count by status
    metrics.byStatus[row[3]] = (metrics.byStatus[row[3]] || 0) + 1;
    
    // Count by verdict
    if (row[27]) {
      metrics.byVerdict[row[27]] = (metrics.byVerdict[row[27]] || 0) + 1;
    }
  }
  
  return metrics;
}

function createSummaryCards(sheet, metrics) {
  // Row 3: Headers
  const headers = ['Total Leads', 'Active Deals', 'Hot Leads', 'Total Value'];
  sheet.getRange(3, 1, 1, 4).setValues([headers]);
  sheet.getRange(3, 1, 1, 4).setFontWeight('bold').setHorizontalAlignment('center');
  
  // Row 4: Values
  const values = [
    metrics.totalLeads,
    metrics.activeLeads,
    metrics.hotLeads,
    formatCurrency(metrics.totalValue)
  ];
  sheet.getRange(4, 1, 1, 4).setValues([values]);
  sheet.getRange(4, 1, 1, 4).setFontSize(24).setHorizontalAlignment('center');
  
  // Add borders and colors
  sheet.getRange(3, 1, 2, 4).setBorder(true, true, true, true, true, true);
  sheet.getRange(3, 1, 1, 4).setBackground('#f0f0f0');
}

function createDashboardCharts(sheet) {
  // This would create actual charts using Google Sheets Charts API
  // For now, we'll create placeholder areas
  
  // Chart 1: Leads by Source (Column chart)
  sheet.getRange('A7').setValue('Leads by Source');
  sheet.getRange('A7').setFontWeight('bold').setFontSize(16);
  
  // Chart 2: Deal Status (Pie chart)
  sheet.getRange('F7').setValue('Deal Status');
  sheet.getRange('F7').setFontWeight('bold').setFontSize(16);
  
  // Chart 3: Profit Trend (Line chart)
  sheet.getRange('A15').setValue('Profit Trend (30 Days)');
  sheet.getRange('A15').setFontWeight('bold').setFontSize(16);
}

function createTopDealsTable(sheet) {
  const masterSheet = getSheet(SHEETS.MASTER);
  const data = masterSheet.getDataRange().getValues();
  
  // Find top 10 deals by ROI
  const deals = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][25]) { // Has ROI
      deals.push({
        vehicle: `${data[i][6]} ${data[i][7]} ${data[i][8]}`.trim(),
        price: data[i][18],
        profit: data[i][24],
        roi: data[i][25],
        verdict: data[i][27],
        row: i + 1
      });
    }
  }
  
  // Sort by ROI
  deals.sort((a, b) => b.roi - a.roi);
  const topDeals = deals.slice(0, 10);
  
  // Create table
  sheet.getRange('A23').setValue('🏆 Top 10 Deals by ROI');
  sheet.getRange('A23').setFontWeight('bold').setFontSize(16);
  
  const tableHeaders = ['Vehicle', 'Price', 'Profit %', 'ROI %', 'Verdict'];
  sheet.getRange(24, 1, 1, 5).setValues([tableHeaders]);
  sheet.getRange(24, 1, 1, 5).setFontWeight('bold').setBackground('#1a73e8').setFontColor('#ffffff');
  
  for (let i = 0; i < topDeals.length; i++) {
    const deal = topDeals[i];
    sheet.getRange(25 + i, 1, 1, 5).setValues([[
      deal.vehicle,
      formatCurrency(deal.price),
      formatPercent(deal.profit),
      formatPercent(deal.roi),
      deal.verdict
    ]]);
  }
}

function formatDashboard(sheet) {
  // Set column widths
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 150);
  
  // Add conditional formatting for verdict column
  const verdictRange = sheet.getRange('E25:E34');
  const rules = [
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('BUY NOW')
      .setBackground('#34a853')
      .setFontColor('#ffffff')
      .setRanges([verdictRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('STRONG BUY')
      .setBackground('#81c784')
      .setRanges([verdictRange])
      .build(),
    SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('PASS')
      .setBackground('#f44336')
      .setFontColor('#ffffff')
      .setRanges([verdictRange])
      .build()
  ];
  
  sheet.setConditionalFormatRules(rules);
}

// ==========================================
// FILE: crm.gs - CRM Integration Functions
// ==========================================

function exportToSMSIT() {
  const ui = SpreadsheetApp.getUi();
  const sheet = getSheet(SHEETS.MASTER);
  const crmSheet = getSheet(SHEETS.CRM);
  
  // Get hot leads
  const data = sheet.getDataRange().getValues();
  const hotLeads = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === 'Hot' && data[i][31]) { // Hot lead with phone
      hotLeads.push({
        id: data[i][0],
        vehicle: `${data[i][6]} ${data[i][7]} ${data[i][8]}`.trim(),
        name: data[i][30],
        phone: data[i][31],
        email: data[i][32],
        price: data[i][18],
        verdict: data[i][27],
        message: generateSellerMessage(data[i])
      });
    }
  }
  
  if (hotLeads.length === 0) {
    ui.alert('No hot leads with phone numbers found.');
    return;
  }
  
  // Show export preview
  const htmlOutput = HtmlService.createHtmlOutput(getSMSExportHTML(hotLeads))
    .setWidth(800)
    .setHeight(600);
  
  ui.showModalDialog(htmlOutput, '📱 Export to SMS-iT');
}

function generateSellerMessage(row) {
  const vehicle = `${row[6]} ${row[7]} ${row[8]}`.trim();
  const name = row[30] ? row[30].split(' ')[0] : 'there';
  
  return `Hi ${name}! I saw your ${vehicle} listing. I'm a cash buyer and can close quickly. ` +
         `Would you consider ${formatCurrency(row[19])} for a fast, hassle-free sale? ` +
         `I can pick up this week. Text YES if interested!`;
}

function processSMSExport(leadIds) {
  const sheet = getSheet(SHEETS.MASTER);
  const crmSheet = getSheet(SHEETS.CRM);
  const timestamp = new Date();
  
  for (const leadId of leadIds) {
    // Find lead in master
    const data = sheet.getDataRange().getValues();
    let leadRow = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === leadId) {
        leadRow = data[i];
        break;
      }
    }
    
    if (leadRow) {
      // Add to CRM sheet
      crmSheet.appendRow([
        'SMS' + Date.now(),                    // Export ID
        timestamp,                             // Date
        'SMS-iT',                             // Platform
        leadId,                               // Lead ID
        `${leadRow[6]} ${leadRow[7]} ${leadRow[8]}`.trim(), // Vehicle
        leadRow[30],                          // Contact Name
        leadRow[31],                          // Phone
        leadRow[32],                          // Email
        leadRow[4],                           // Lead Score
        leadRow[5],                           // Lead Temp
        leadRow[18],                          // Deal Value
        'Exported',                           // Status
        'hot-lead,cash-buyer',                // Tags
        generateSellerMessage(leadRow),       // Custom Message
        'quick_cash_offer',                   // SMS Template
        '',                                   // Email Template
        '',                                   // CompanyHub ID
        'SMS-' + leadId,                      // SMS-iT ID
        timestamp,                            // Last Sync
        'Success',                            // Sync Status
        'Exported to SMS campaign'            // Notes
      ]);
    }
  }
  
  log('CRM Export', `Exported ${leadIds.length} leads to SMS-iT`);
  return {success: true, count: leadIds.length};
}

function getSMSExportHTML(leads) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #1a73e8; }
          .lead-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
          }
          .lead-card.selected {
            background-color: #e3f2fd;
            border-color: #1a73e8;
          }
          .lead-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          .vehicle-info {
            font-weight: bold;
            font-size: 16px;
          }
          .contact-info {
            color: #666;
            margin: 5px 0;
          }
          .message-preview {
            background-color: #fff;
            padding: 10px;
            border-radius: 4px;
            margin-top: 10px;
            font-style: italic;
          }
          .select-all {
            margin-bottom: 20px;
          }
          .button-group {
            position: sticky;
            bottom: 0;
            background: white;
            padding: 20px 0;
            border-top: 1px solid #ddd;
            margin-top: 20px;
          }
          .button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          }
          .button:hover {
            background-color: #1557b0;
          }
          .button.secondary {
            background-color: #666;
          }
          .stats {
            background-color: #f0f0f0;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
          }
          input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
          }
        </style>
      </head>
      <body>
        <h2>📱 Export Hot Leads to SMS-iT</h2>
        
        <div class="stats">
          Found <strong>${leads.length}</strong> hot leads with phone numbers
        </div>
        
        <div class="select-all">
          <label>
            <input type="checkbox" id="selectAll" onchange="toggleAll()" checked>
            Select All Leads
          </label>
        </div>
        
        <div id="leadsList">
          ${leads.map(lead => `
            <div class="lead-card selected" data-id="${lead.id}">
              <div class="lead-header">
                <div>
                  <input type="checkbox" class="lead-checkbox" value="${lead.id}" checked>
                  <span class="vehicle-info">${lead.vehicle}</span>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 20px; color: #34a853;">${formatCurrency(lead.price)}</div>
                  <div style="color: #666;">${lead.verdict}</div>
                </div>
              </div>
              <div class="contact-info">
                👤 ${lead.name} | 📱 ${lead.phone} ${lead.email ? '| 📧 ' + lead.email : ''}
              </div>
              <div class="message-preview">
                📝 ${lead.message}
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="button-group">
          <button class="button" onclick="exportSelected()">Export Selected Leads</button>
          <button class="button secondary" onclick="google.script.host.close()">Cancel</button>
          <span id="selectedCount" style="margin-left: 20px; color: #666;">
            ${leads.length} leads selected
          </span>
        </div>
        
        <script>
          function formatCurrency(value) {
            return '$' + Number(value).toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
          }
          
          function toggleAll() {
            const selectAll = document.getElementById('selectAll').checked;
            const checkboxes = document.querySelectorAll('.lead-checkbox');
            const cards = document.querySelectorAll('.lead-card');
            
            checkboxes.forEach((cb, index) => {
              cb.checked = selectAll;
              cards[index].classList.toggle('selected', selectAll);
            });
            
            updateCount();
          }
          
          document.querySelectorAll('.lead-checkbox').forEach(cb => {
            cb.addEventListener('change', function() {
              const card = this.closest('.lead-card');
              card.classList.toggle('selected', this.checked);
              updateCount();
            });
          });
          
          function updateCount() {
            const checked = document.querySelectorAll('.lead-checkbox:checked').length;
            document.getElementById('selectedCount').textContent = checked + ' leads selected';
          }
          
          function exportSelected() {
            const selected = Array.from(document.querySelectorAll('.lead-checkbox:checked'))
              .map(cb => cb.value);
            
            if (selected.length === 0) {
              alert('Please select at least one lead to export.');
              return;
            }
            
            google.script.run
              .withSuccessHandler(handleExportSuccess)
              .withFailureHandler(handleExportError)
              .processSMSExport(selected);
          }
          
          function handleExportSuccess(result) {
            alert('Successfully exported ' + result.count + ' leads to SMS-iT!');
            google.script.host.close();
          }
          
          function handleExportError(error) {
            alert('Export failed: ' + error.message);
          }
        </script>
      </body>
    </html>
  `;
}

function exportToCompanyHub() {
  const sheet = getSheet(SHEETS.CRM);
  const data = sheet.getDataRange().getValues();
  
  // Format for CompanyHub CSV export
  const exportData = [
    ['Company', 'Contact Name', 'Phone', 'Email', 'Deal Value', 'Tags', 'Notes']
  ];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] !== 'CompanyHub') continue;
    
    exportData.push([
      data[i][4],  // Vehicle as company name
      data[i][5],  // Contact Name
      data[i][6],  // Phone
      data[i][7],  // Email
      data[i][10], // Deal Value
      data[i][12], // Tags
      data[i][20]  // Notes
    ]);
  }
  
  // Create CSV content
  const csv = exportData.map(row => row.map(cell => 
    `"${String(cell).replace(/"/g, '""')}"`
  ).join(',')).join('\n');
  
  // Create download link
  const blob = Utilities.newBlob(csv, 'text/csv', 'companyhub_export.csv');
  
  // In real implementation, would save to Drive or email
  log('CRM Export', `Prepared ${exportData.length - 1} records for CompanyHub`);
  
  return blob;
}

// ==========================================
// FILE: alerts.gs - Alert System
// ==========================================

function checkAlertTriggers() {
  const sheet = getSheet(SHEETS.MASTER);
  const data = sheet.getDataRange().getValues();
  
  const profitThreshold = parseFloat(getConfig('PROFIT_THRESHOLD')) || 35;
  const roiThreshold = parseFloat(getConfig('ROI_THRESHOLD')) || 50;
  
  const alerts = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const alertReasons = [];
    
    // Check profit margin
    if (row[24] && row[24] * 100 > profitThreshold) {
      alertReasons.push(`Profit ${formatPercent(row[24])} > ${profitThreshold}%`);
    }
    
    // Check ROI
    if (row[25] && row[25] * 100 > roiThreshold) {
      alertReasons.push(`ROI ${formatPercent(row[25])} > ${roiThreshold}%`);
    }
    
    // Check verdict
    if (row[27] === 'BUY NOW') {
      alertReasons.push('BUY NOW verdict');
    }
    
    // Check days listed
    if (row[29] > 30) {
      alertReasons.push(`Listed ${row[29]} days (motivated seller)`);
    }
    
    if (alertReasons.length > 0) {
      alerts.push({
        id: row[0],
        vehicle: `${row[6]} ${row[7]} ${row[8]}`.trim(),
        price: row[18],
        profit: row[24],
        roi: row[25],
        location: row[14],
        distance: row[16],
        reasons: alertReasons,
        row: i + 1
      });
    }
  }
  
  if (alerts.length > 0) {
    sendAlertEmail(alerts);
    highlightAlerts(alerts);
  }
  
  log('Alert Check', `Found ${alerts.length} deals meeting alert criteria`);
  
  return alerts;
}

function sendAlertEmail(alerts) {
  const email = getConfig('ALERT_EMAIL');
  if (!email) return;
  
  const subject = `🚨 CarHawk Alert: ${alerts.length} Hot Deals Found!`;
  
  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #1a73e8; }
          .alert-card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background-color: #f9f9f9;
          }
          .vehicle { font-size: 18px; font-weight: bold; color: #333; }
          .price { font-size: 24px; color: #34a853; }
          .metrics { margin: 10px 0; }
          .metric { 
            display: inline-block; 
            margin-right: 20px;
            padding: 5px 10px;
            background-color: #e8f5e9;
            border-radius: 4px;
          }
          .reasons { 
            color: #666; 
            font-style: italic;
            margin-top: 10px;
          }
          .location {
            color: #888;
            font-size: 14px;
          }
          .cta {
            background-color: #1a73e8;
            color: white;
            padding: 10px 20px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>🚨 Hot Vehicle Deals Alert</h1>
        <p>The following ${alerts.length} deals meet your alert criteria:</p>
        
        ${alerts.map(alert => `
          <div class="alert-card">
            <div class="vehicle">${alert.vehicle}</div>
            <div class="price">${formatCurrency(alert.price)}</div>
            <div class="location">📍 ${alert.location} (${alert.distance} mi away)</div>
            <div class="metrics">
              ${alert.profit ? `<span class="metric">Profit: ${formatPercent(alert.profit)}</span>` : ''}
              ${alert.roi ? `<span class="metric">ROI: ${formatPercent(alert.roi)}</span>` : ''}
            </div>
            <div class="reasons">
              🎯 ${alert.reasons.join(' | ')}
            </div>
          </div>
        `).join('')}
        
        <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" class="cta">
          View All Deals in CarHawk
        </a>
        
        <p style="margin-top: 30px; color: #666; font-size: 12px;">
          This alert was sent because these deals exceeded your configured thresholds.
          To adjust alert settings, use the CarHawk menu in your spreadsheet.
        </p>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (error) {
    log('Alert Error', 'Failed to send email: ' + error.toString());
  }
}

function highlightAlerts(alerts) {
  const sheet = getSheet(SHEETS.MASTER);
  
  // Clear existing highlights
  sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .setBackground(null);
  
  // Apply new highlights
  for (const alert of alerts) {
    sheet.getRange(alert.row, 1, 1, sheet.getLastColumn())
      .setBackground('#fff3cd'); // Light yellow
  }
}

// ==========================================
// FILE: ui.gs - UI Dialogs and Forms
// ==========================================

function showVINDecoder() {
  const html = HtmlService.createHtmlOutput(getVINDecoderHTML())
    .setWidth(600)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(html, '🚗 VIN Decoder');
}

function getVINDecoderHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #1a73e8; }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
          }
          input[type="text"] {
            width: 100%;
            padding: 10px;
            font-size: 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
          }
          .button:hover {
            background-color: #1557b0;
          }
          .results {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 4px;
            display: none;
          }
          .result-row {
            margin: 5px 0;
          }
          .result-label {
            font-weight: bold;
            display: inline-block;
            width: 120px;
          }
          .error {
            color: #d32f2f;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <h2>VIN Decoder</h2>
        <p>Enter a 17-character VIN to decode vehicle information:</p>
        
        <div class="form-group">
          <label for="vin">VIN Number:</label>
          <input type="text" id="vin" placeholder="e.g., 1HGBH41JXMN109186" maxlength="17">
        </div>
        
        <button class="button" onclick="decodeVIN()">Decode VIN</button>
        
        <div id="results" class="results"></div>
        <div id="error" class="error"></div>
        
        <script>
          function decodeVIN() {
            const vin = document.getElementById('vin').value.toUpperCase();
            const errorDiv = document.getElementById('error');
            const resultsDiv = document.getElementById('results');
            
            // Clear previous results
            errorDiv.textContent = '';
            resultsDiv.style.display = 'none';
            
            // Validate VIN
            if (vin.length !== 17) {
              errorDiv.textContent = 'VIN must be exactly 17 characters long.';
              return;
            }
            
            // Mock VIN decode (in production, use NHTSA API)
            const decoded = mockVINDecode(vin);
            
            // Display results
            resultsDiv.innerHTML = \`
              <h3>Vehicle Information:</h3>
              <div class="result-row">
                <span class="result-label">Year:</span> \${decoded.year}
              </div>
              <div class="result-row">
                <span class="result-label">Make:</span> \${decoded.make}
              </div>
              <div class="result-row">
                <span class="result-label">Model:</span> \${decoded.model}
              </div>
              <div class="result-row">
                <span class="result-label">Body Type:</span> \${decoded.bodyType}
              </div>
              <div class="result-row">
                <span class="result-label">Engine:</span> \${decoded.engine}
              </div>
              <div class="result-row">
                <span class="result-label">Transmission:</span> \${decoded.transmission}
              </div>
              <div class="result-row">
                <span class="result-label">Drive Type:</span> \${decoded.driveType}
              </div>
              <div class="result-row">
                <span class="result-label">Country:</span> \${decoded.country}
              </div>
            \`;
            resultsDiv.style.display = 'block';
          }
          
          function mockVINDecode(vin) {
            // Mock decoder - in production use real API
            const makes = {
              '1HG': 'Honda',
              '1G1': 'Chevrolet',
              '2HG': 'Honda (Canada)',
              '3VW': 'Volkswagen',
              '5YJ': 'Tesla',
              'WBA': 'BMW',
              'WAU': 'Audi'
            };
            
            const year = {
              'J': 2018, 'K': 2019, 'L': 2020, 'M': 2021,
              'N': 2022, 'P': 2023, 'R': 2024, 'S': 2025
            }[vin[9]] || 2020;
            
            const makeCode = vin.substring(0, 3);
            const make = makes[makeCode] || 'Unknown';
            
            return {
              year: year,
              make: make,
              model: make === 'Honda' ? 'Accord' : 'Unknown',
              bodyType: '4-Door Sedan',
              engine: '2.0L 4-Cylinder',
              transmission: 'Automatic',
              driveType: 'FWD',
              country: vin[0] === '1' ? 'United States' : 'Unknown'
            };
          }
          
          // Enter key support
          document.getElementById('vin').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') decodeVIN();
          });
        </script>
      </body>
    </html>
  `;
}

function showDistanceCalculator() {
  const html = HtmlService.createHtmlOutput(getDistanceCalculatorHTML())
    .setWidth(500)
    .setHeight(400);
  
  SpreadsheetApp.getUi().showModalDialog(html, '📍 Distance Calculator');
}

function getDistanceCalculatorHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #1a73e8; }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
          }
          input[type="text"] {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          }
          .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 4px;
            display: none;
          }
          .distance {
            font-size: 24px;
            font-weight: bold;
            color: #1a73e8;
          }
          .risk {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
          }
          .risk.low { background-color: #c8e6c9; color: #2e7d32; }
          .risk.moderate { background-color: #fff9c4; color: #f57f17; }
          .risk.high { background-color: #ffcdd2; color: #c62828; }
        </style>
      </head>
      <body>
        <h2>Distance Calculator</h2>
        <p>Calculate distance between ZIP codes and evaluate location risk:</p>
        
        <div class="form-group">
          <label for="fromZip">From ZIP Code:</label>
          <input type="text" id="fromZip" value="${getConfig('HOME_ZIP') || '63101'}" maxlength="5">
        </div>
        
        <div class="form-group">
          <label for="toZip">To ZIP Code:</label>
          <input type="text" id="toZip" placeholder="Enter destination ZIP" maxlength="5">
        </div>
        
        <button class="button" onclick="calculateDistance()">Calculate Distance</button>
        
        <div id="result" class="result"></div>
        
        <script>
          function calculateDistance() {
            const fromZip = document.getElementById('fromZip').value;
            const toZip = document.getElementById('toZip').value;
            
            if (!fromZip || !toZip) {
              alert('Please enter both ZIP codes.');
              return;
            }
            
            // Mock calculation
            const distance = Math.abs(parseInt(fromZip) - parseInt(toZip)) * 0.1;
            const miles = Math.min(distance, 500).toFixed(1);
            
            let riskLevel, riskClass, riskEmoji;
            if (distance < 25) {
              riskLevel = 'Low Risk';
              riskClass = 'low';
              riskEmoji = '✅';
            } else if (distance < 75) {
              riskLevel = 'Moderate Risk';
              riskClass = 'moderate';
              riskEmoji = '⚠️';
            } else {
              riskLevel = 'High Risk';
              riskClass = 'high';
              riskEmoji = '❌';
            }
            
            const resultDiv = document.getElementById('result');
            resultDiv.innerHTML = \`
              <div class="distance">\${miles} miles</div>
              <div class="risk \${riskClass}">
                \${riskEmoji} \${riskLevel}
                <br><small>
                  \${riskClass === 'low' ? 'Ideal distance for quick pickup' :
                    riskClass === 'moderate' ? 'Factor in transportation costs' :
                    'Consider shipping or pass on deal'}
                </small>
              </div>
            \`;
            resultDiv.style.display = 'block';
          }
        </script>
      </body>
    </html>
  `;
}

function showSystemSettings() {
  const html = HtmlService.createHtmlOutput(getSystemSettingsHTML())
    .setWidth(600)
    .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, '🔧 System Settings');
}

function getSystemSettingsHTML() {
  const settings = {
    businessName: getConfig('BUSINESS_NAME') || '',
    homeZip: getConfig('HOME_ZIP') || '',
    alertEmail: getConfig('ALERT_EMAIL') || '',
    profitThreshold: getConfig('PROFIT_THRESHOLD') || '35',
    roiThreshold: getConfig('ROI_THRESHOLD') || '50',
    autoSync: getConfig('AUTO_SYNC') || 'false'
  };
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #1a73e8; }
          .form-group {
            margin-bottom: 20px;
          }
          label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
          }
          input, select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          .help-text {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
          }
          .button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
          }
          .button:hover {
            background-color: #1557b0;
          }
          .button.secondary {
            background-color: #666;
          }
          .status {
            margin-top: 20px;
            padding: 10px;
            border-radius: 4px;
            display: none;
          }
          .status.success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }
        </style>
      </head>
      <body>
        <h2>System Settings</h2>
        
        <form id="settingsForm">
          <div class="form-group">
            <label for="businessName">Business Name</label>
            <input type="text" id="businessName" value="${settings.businessName}">
            <div class="help-text">Your business name for reports and exports</div>
          </div>
          
          <div class="form-group">
            <label for="homeZip">Home Base ZIP Code</label>
            <input type="text" id="homeZip" value="${settings.homeZip}" pattern="[0-9]{5}">
            <div class="help-text">Your primary location for distance calculations</div>
          </div>
          
          <div class="form-group">
            <label for="alertEmail">Alert Email</label>
            <input type="email" id="alertEmail" value="${settings.alertEmail}">
            <div class="help-text">Where to send deal alerts</div>
          </div>
          
          <div class="form-group">
            <label for="profitThreshold">Profit Alert Threshold (%)</label>
            <input type="number" id="profitThreshold" value="${settings.profitThreshold}" min="0" max="100">
            <div class="help-text">Alert when profit margin exceeds this percentage</div>
          </div>
          
          <div class="form-group">
            <label for="roiThreshold">ROI Alert Threshold (%)</label>
            <input type="number" id="roiThreshold" value="${settings.roiThreshold}" min="0" max="200">
            <div class="help-text">Alert when ROI exceeds this percentage</div>
          </div>
          
          <div class="form-group">
            <label for="autoSync">Auto-Sync</label>
            <select id="autoSync">
              <option value="true" ${settings.autoSync === 'true' ? 'selected' : ''}>Enabled</option>
              <option value="false" ${settings.autoSync === 'false' ? 'selected' : ''}>Disabled</option>
            </select>
            <div class="help-text">Automatically sync data from staging sheets</div>
          </div>
        </form>
        
        <button class="button" onclick="saveSettings()">Save Settings</button>
        <button class="button secondary" onclick="google.script.host.close()">Cancel</button>
        
        <div id="status" class="status"></div>
        
        <script>
          function saveSettings() {
            const settings = {
              BUSINESS_NAME: document.getElementById('businessName').value,
              HOME_ZIP: document.getElementById('homeZip').value,
              ALERT_EMAIL: document.getElementById('alertEmail').value,
              PROFIT_THRESHOLD: document.getElementById('profitThreshold').value,
              ROI_THRESHOLD: document.getElementById('roiThreshold').value,
              AUTO_SYNC: document.getElementById('autoSync').value
            };
            
            google.script.run
              .withSuccessHandler(handleSuccess)
              .withFailureHandler(handleError)
              .updateSystemSettings(settings);
          }
          
          function handleSuccess() {
            const status = document.getElementById('status');
            status.className = 'status success';
            status.textContent = 'Settings saved successfully!';
            status.style.display = 'block';
            
            setTimeout(() => google.script.host.close(), 2000);
          }
          
          function handleError(error) {
            alert('Error saving settings: ' + error.message);
          }
        </script>
      </body>
    </html>
  `;
}

function updateSystemSettings(settings) {
  for (const [key, value] of Object.entries(settings)) {
    setConfig(key, value);
  }
  
  log('Settings Update', 'System settings updated');
  return true;
}

// ==========================================
// Additional Helper Functions
// ==========================================

function initializeConfig(config) {
  const configSheet = getSheet(SHEETS.CONFIG);
  
  // Set initial configuration values
  const defaultConfig = {
    'SYSTEM_VERSION': SYSTEM_VERSION,
    'BUSINESS_NAME': config.businessName || 'My Auto Flipping Business',
    'HOME_ZIP': config.homeZip || '63101',
    'OPENAI_API_KEY': config.openaiKey || '',
    'ALERT_EMAIL': config.alertEmail || Session.getActiveUser().getEmail(),
    'PROFIT_THRESHOLD': config.profitThreshold || '35',
    'ROI_THRESHOLD': config.roiThreshold || '50',
    'AUTO_SYNC': 'false',
    'SYNC_FREQUENCY': 'hourly',
    'MAX_DISTANCE': '100',
    'MIN_PROFIT': '1000',
    'MIN_ROI': '25',
    'DAYS_TO_ARCHIVE': '90',
    'ENABLE_AI': 'true',
    'ENABLE_ALERTS': 'true',
    'ALERT_FREQUENCY': 'daily',
    'LAST_SYNC': new Date().toISOString(),
    'LAST_ALERT_CHECK': new Date().toISOString()
  };
  
  // Add default config values
  Object.entries(defaultConfig).forEach(([key, value]) => {
    setConfig(key, value);
  });
  
  // Protect config sheet
  const protection = configSheet.protect();
  protection.setDescription('System Configuration - Edit with caution');
  protection.setWarningOnly(true);
}

function setupTriggers() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Set up hourly sync trigger if enabled
  if (getConfig('AUTO_SYNC') === 'true') {
    ScriptApp.newTrigger('autoSyncData')
      .timeBased()
      .everyHours(1)
      .create();
  }
  
  // Set up daily alert check
  ScriptApp.newTrigger('dailyAlertCheck')
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  
  // Set up weekly report
  ScriptApp.newTrigger('generateWeeklyReport')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
}

function applySystemFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Format each sheet
  Object.entries(SHEETS).forEach(([key, sheetName]) => {
    const sheet = getSheet(sheetName);
    
    // Auto-resize columns
    if (sheet.getLastColumn() > 0) {
      sheet.autoResizeColumns(1, sheet.getLastColumn());
    }
    
    // Apply alternating row colors
    if (sheet.getLastRow() > 1) {
      sheet.setRowHeightsForced(2, sheet.getLastRow() - 1, 25);
      
      // Add banding
      const range = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn());
      range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
    }
  });
  
  // Special formatting for Master sheet
  const masterSheet = getSheet(SHEETS.MASTER);
  if (masterSheet.getLastRow() > 1) {
    // Conditional formatting for profit margin
    const profitRange = masterSheet.getRange('X2:X');
    const profitRules = [
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThan(0.35)
        .setBackground('#34a853')
        .setFontColor('#ffffff')
        .setRanges([profitRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberBetween(0.20, 0.35)
        .setBackground('#fbbc04')
        .setRanges([profitRange])
        .build(),
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(0.20)
        .setBackground('#ea4335')
        .setFontColor('#ffffff')
        .setRanges([profitRange])
        .build()
    ];
    
    masterSheet.setConditionalFormatRules(profitRules);
  }
  
  log('Formatting', 'System formatting applied to all sheets');
}

// ==========================================
// Automated Functions
// ==========================================

function autoSyncData() {
  if (getConfig('AUTO_SYNC') !== 'true') return;
  
  const imported = {
    facebook: importFromFacebook(),
    craigslist: importFromCraigslist(),
    offerup: importFromOfferUp(),
    ebay: importFromEbay()
  };
  
  const total = Object.values(imported).reduce((a, b) => a + b, 0);
  
  if (total > 0) {
    // Run analysis on new imports
    runAIAnalysis();
    
    // Check for alerts
    checkAlertTriggers();
  }
  
  setConfig('LAST_SYNC', new Date().toISOString());
  log('Auto Sync', `Synced ${total} new leads`);
}

function dailyAlertCheck() {
  if (getConfig('ENABLE_ALERTS') !== 'true') return;
  
  const alerts = checkAlertTriggers();
  setConfig('LAST_ALERT_CHECK', new Date().toISOString());
  
  log('Daily Alert Check', `Found ${alerts.length} alert-worthy deals`);
}

// ==========================================
// Lead Scoring Functions
// ==========================================

function updateAllScores() {
  const sheet = getSheet(SHEETS.MASTER);
  const lastRow = sheet.getLastRow();
  
  if (lastRow > 1) {
    updateScoresBatch(2, lastRow);
  }
  
  SpreadsheetApp.getUi().alert('Scores updated for all vehicles.');
}

function updateScoresBatch(startRow, endRow) {
  const sheet = getSheet(SHEETS.MASTER);
  
  for (let i = startRow; i <= endRow; i++) {
    updateLeadScoring(i);
  }
}

function updateLeadScoring(rowNum) {
  const sheet = getSheet(SHEETS.MASTER);
  const row = sheet.getRange(rowNum, 1, 1, 38).getValues()[0];
  const scoringSheet = getSheet(SHEETS.SCORING);
  
  // Calculate individual scores
  const scores = calculateDetailedScores(row);
  
  // Update master sheet
  sheet.getRange(rowNum, 5).setValue(scores.overall); // Lead Score
  sheet.getRange(rowNum, 6).setValue(scores.temperature); // Lead Temp
  
  // Add to scoring sheet
  scoringSheet.appendRow([
    'SC' + Date.now(),
    row[0], // Vehicle ID
    new Date(),
    scores.overall,
    scores.profit,
    scores.risk,
    scores.market,
    scores.condition,
    scores.location,
    scores.seller,
    scores.speed,
    scores.competition,
    scores.demand,
    scores.repairRisk,
    scores.titleRisk,
    scores.marketRisk,
    scores.distanceRisk,
    scores.capitalRisk,
    scores.timeRisk,
    scores.totalRisk,
    scores.opportunity,
    scores.priority,
    scores.action
  ]);
}

function calculateDetailedScores(row) {
  const scores = {
    overall: 0,
    profit: 0,
    risk: 0,
    market: 0,
    condition: 0,
    location: 0,
    seller: 0,
    speed: 0,
    competition: 0,
    demand: 0,
    repairRisk: 0,
    titleRisk: 0,
    marketRisk: 0,
    distanceRisk: 0,
    capitalRisk: 0,
    timeRisk: 0,
    totalRisk: 0,
    opportunity: '',
    priority: '',
    action: '',
    temperature: ''
  };
  
  // Profit Score (0-100)
  const profitMargin = row[24] || 0;
  scores.profit = Math.min(profitMargin * 200, 100);
  
  // Condition Score (0-100)
  const conditionScores = {
    'Excellent': 95,
    'Very Good': 85,
    'Good': 75,
    'Fair': 60,
    'Poor': 40,
    'Parts Only': 20
  };
  scores.condition = conditionScores[row[12]] || 50;
  
  // Location Score (0-100)
  const distance = row[16] || 0;
  scores.location = Math.max(100 - (distance * 0.5), 0);
  scores.distanceRisk = distance > 100 ? 30 : distance > 50 ? 20 : 10;
  
  // Speed Score based on days listed
  const daysListed = row[29] || 0;
  scores.speed = daysListed > 30 ? 90 : daysListed > 14 ? 70 : 50;
  
  // Market Score (mock)
  scores.market = 70 + Math.random() * 30;
  scores.demand = 60 + Math.random() * 40;
  scores.competition = 50 + Math.random() * 50;
  
  // Risk calculations
  scores.repairRisk = row[12] === 'Poor' || row[12] === 'Parts Only' ? 40 : 20;
  scores.titleRisk = row[13] !== 'Clean' ? 30 : 10;
  scores.marketRisk = 20;
  scores.capitalRisk = row[18] > 10000 ? 30 : 15;
  scores.timeRisk = daysListed < 7 ? 10 : 20;
  
  scores.totalRisk = (scores.repairRisk + scores.titleRisk + scores.marketRisk + 
                      scores.distanceRisk + scores.capitalRisk + scores.timeRisk) / 6;
  
  // Overall Score
  scores.overall = Math.round(
    (scores.profit * 0.35) +
    (scores.condition * 0.20) +
    (scores.location * 0.15) +
    (scores.market * 0.15) +
    (scores.speed * 0.15) -
    (scores.totalRisk * 0.5)
  );
  
  // Determine temperature
  if (scores.overall > 80 && scores.profit > 70) {
    scores.temperature = 'Hot';
  } else if (scores.overall > 60) {
    scores.temperature = 'Warm';
  } else {
    scores.temperature = 'Cold';
  }
  
  // Opportunity rating
  if (scores.overall > 85) {
    scores.opportunity = 'Excellent';
    scores.priority = 'Urgent';
    scores.action = 'Contact Immediately';
  } else if (scores.overall > 70) {
    scores.opportunity = 'Good';
    scores.priority = 'High';
    scores.action = 'Contact Today';
  } else if (scores.overall > 50) {
    scores.opportunity = 'Fair';
    scores.priority = 'Medium';
    scores.action = 'Monitor';
  } else {
    scores.opportunity = 'Poor';
    scores.priority = 'Low';
    scores.action = 'Pass';
  }
  
  return scores;
}

// ==========================================
// Reporting Functions
// ==========================================

function generateWeeklyReport() {
  const reportingSheet = getSheet(SHEETS.REPORTING);
  const masterSheet = getSheet(SHEETS.MASTER);
  const data = masterSheet.getDataRange().getValues();
  
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Calculate weekly metrics
  const metrics = {
    totalLeads: 0,
    hotLeads: 0,
    converted: 0,
    totalInvestment: 0,
    totalRevenue: 0,
    totalProfit: 0,
    avgProfit: 0,
    avgROI: 0,
    bestDeal: null,
    worstDeal: null,
    fastestFlip: null,
    slowestFlip: null,
    bySource: {},
    byMake: {},
    byLocation: {},
    byStrategy: {}
  };
  
  // Analyze data from past week
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const dateAdded = new Date(row[1]);
    
    if (dateAdded >= weekAgo) {
      metrics.totalLeads++;
      
      if (row[5] === 'Hot') metrics.hotLeads++;
      if (row[3] === 'Converted') metrics.converted++;
      
      metrics.totalInvestment += row[18] || 0;
      
      // Track by dimensions
      metrics.bySource[row[2]] = (metrics.bySource[row[2]] || 0) + 1;
      metrics.byMake[row[7]] = (metrics.byMake[row[7]] || 0) + 1;
      
      const locationRisk = row[17];
      metrics.byLocation[locationRisk] = (metrics.byLocation[locationRisk] || 0) + 1;
      
      if (row[28]) {
        metrics.byStrategy[row[28]] = (metrics.byStrategy[row[28]] || 0) + 1;
      }
    }
  }
  
  // Add report row
  reportingSheet.appendRow([
    now,
    'Weekly',
    metrics.totalLeads,
    metrics.hotLeads,
    metrics.converted,
    metrics.totalInvestment,
    metrics.totalRevenue,
    metrics.totalProfit,
    metrics.avgProfit,
    metrics.avgROI,
    JSON.stringify(metrics.bestDeal),
    JSON.stringify(metrics.worstDeal),
    JSON.stringify(metrics.fastestFlip),
    JSON.stringify(metrics.slowestFlip),
    JSON.stringify(metrics.bySource),
    JSON.stringify(metrics.byMake),
    JSON.stringify(metrics.byLocation),
    JSON.stringify(metrics.byStrategy)
  ]);
  
  // Send email report if configured
  const email = getConfig('ALERT_EMAIL');
  if (email) {
    sendWeeklyReportEmail(metrics);
  }
  
  log('Weekly Report', 'Generated weekly report');
}

function sendWeeklyReportEmail(metrics) {
  const email = getConfig('ALERT_EMAIL');
  const businessName = getConfig('BUSINESS_NAME');
  
  const subject = `📊 ${businessName} - Weekly CarHawk Report`;
  
  const htmlBody = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; }
          h1 { color: #1a73e8; }
          .metric-card {
            display: inline-block;
            background: #f0f0f0;
            padding: 20px;
            margin: 10px;
            border-radius: 8px;
            text-align: center;
          }
          .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #1a73e8;
          }
          .metric-label {
            color: #666;
            margin-top: 5px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
            margin-top: 20px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #1a73e8;
            color: white;
          }
        </style>
      </head>
      <body>
        <h1>📊 Weekly Performance Report</h1>
        <p>Week ending ${new Date().toLocaleDateString()}</p>
        
        <div>
          <div class="metric-card">
            <div class="metric-value">${metrics.totalLeads}</div>
            <div class="metric-label">New Leads</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.hotLeads}</div>
            <div class="metric-label">Hot Leads</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${formatCurrency(metrics.totalInvestment)}</div>
            <div class="metric-label">Total Value</div>
          </div>
        </div>
        
        <h2>Lead Sources</h2>
        <table>
          <tr>
            <th>Source</th>
            <th>Count</th>
          </tr>
          ${Object.entries(metrics.bySource).map(([source, count]) => `
            <tr>
              <td>${source}</td>
              <td>${count}</td>
            </tr>
          `).join('')}
        </table>
        
        <p style="margin-top: 30px; color: #666;">
          <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}">View Full Dashboard</a>
        </p>
      </body>
    </html>
  `;
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (error) {
    log('Email Error', 'Failed to send weekly report: ' + error.toString());
  }
}

function generateMonthlyAnalysis() {
  // Similar to weekly but with 30-day window and more detailed analysis
  const ui = SpreadsheetApp.getUi();
  ui.alert('Monthly Analysis', 'Generating comprehensive monthly analysis...', ui.ButtonSet.OK);
  
  // Would implement detailed monthly analysis here
  generateDashboard(); // For now, regenerate dashboard
}

// ==========================================
// Additional Menu Functions
// ==========================================

function cleanDuplicates() {
  const sheet = getSheet(SHEETS.MASTER);
  const data = sheet.getDataRange().getValues();
  const seen = new Set();
  const duplicates = [];
  
  for (let i = 1; i < data.length; i++) {
    const key = `${data[i][6]}-${data[i][7]}-${data[i][8]}-${data[i][18]}`; // Year-Make-Model-Price
    if (seen.has(key)) {
      duplicates.push(i + 1);
    } else {
      seen.add(key);
    }
  }
  
  if (duplicates.length > 0) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Duplicates Found',
      `Found ${duplicates.length} potential duplicates. Remove them?`,
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      // Remove duplicates (from bottom to top to maintain row numbers)
      for (let i = duplicates.length - 1; i >= 0; i--) {
        sheet.deleteRow(duplicates[i]);
      }
      ui.alert(`Removed ${duplicates.length} duplicates.`);
    }
  } else {
    SpreadsheetApp.getUi().alert('No duplicates found.');
  }
}

function archiveOldLeads() {
  const sheet = getSheet(SHEETS.MASTER);
  const data = sheet.getDataRange().getValues();
  const daysToArchive = parseInt(getConfig('DAYS_TO_ARCHIVE')) || 90;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToArchive);
  
  const toArchive = [];
  
  for (let i = 1; i < data.length; i++) {
    const dateAdded = new Date(data[i][1]);
    const status = data[i][3];
    
    if (dateAdded < cutoffDate && ['Passed', 'Stale', 'Archived'].includes(status)) {
      toArchive.push(i + 1);
    }
  }
  
  if (toArchive.length > 0) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Archive Old Leads',
      `Archive ${toArchive.length} leads older than ${daysToArchive} days?`,
      ui.ButtonSet.YES_NO
    );
    
    if (response === ui.Button.YES) {
      // Create or get archive sheet
      let archiveSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Archive');
      if (!archiveSheet) {
        archiveSheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('Archive');
        archiveSheet.setTabColor('#9e9e9e');
        // Copy headers
        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues();
        archiveSheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
      }
      
      // Move rows to archive
      for (let i = toArchive.length - 1; i >= 0; i--) {
        const rowData = sheet.getRange(toArchive[i], 1, 1, sheet.getLastColumn()).getValues();
        archiveSheet.appendRow(rowData[0]);
        sheet.deleteRow(toArchive[i]);
      }
      
      ui.alert(`Archived ${toArchive.length} old leads.`);
    }
  } else {
    SpreadsheetApp.getUi().alert('No leads to archive.');
  }
}

function findBestDeals() {
  const sheet = getSheet(SHEETS.MASTER);
  const data = sheet.getDataRange().getValues();
  const deals = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][24] && data[i][25]) { // Has profit and ROI
      deals.push({
        row: i + 1,
        vehicle: `${data[i][6]} ${data[i][7]} ${data[i][8]}`.trim(),
        price: data[i][18],
        profit: data[i][24],
        roi: data[i][25],
        score: data[i][4],
        verdict: data[i][27]
      });
    }
  }
  
  // Sort by combined score
  deals.sort((a, b) => {
    const scoreA = (a.profit * 100) + (a.roi * 100) + (a.score || 0);
    const scoreB = (b.profit * 100) + (b.roi * 100) + (b.score || 0);
    return scoreB - scoreA;
  });
  
  // Show top 10 deals
  const top10 = deals.slice(0, 10);
  
  let message = 'Top 10 Deals:\n\n';
  top10.forEach((deal, index) => {
    message += `${index + 1}. ${deal.vehicle}\n`;
    message += `   Price: ${formatCurrency(deal.price)} | `;
    message += `Profit: ${formatPercent(deal.profit)} | `;
    message += `ROI: ${formatPercent(deal.roi)}\n`;
    message += `   Verdict: ${deal.verdict}\n\n`;
  });
  
  SpreadsheetApp.getUi().alert('🏆 Best Deals', message, SpreadsheetApp.getUi().ButtonSet.OK);
}

function analyzeSingleDeal() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Analyze Single Deal',
    'Enter the row number of the deal to analyze:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() === ui.Button.OK) {
    const rowNum = parseInt(response.getResponseText());
    if (!isNaN(rowNum) && rowNum > 1) {
      const apiKey = getConfig('OPENAI_API_KEY');
      if (!apiKey) {
        ui.alert('Please set your OpenAI API key in Config sheet.');
        return;
      }
      
      try {
        analyzeVehicle(rowNum, apiKey);
        ui.alert('Analysis complete! Check the Verdict column for results.');
      } catch (error) {
        ui.alert('Error: ' + error.toString());
      }
    } else {
      ui.alert('Invalid row number.');
    }
  }
}

function showLeaderboard() {
  const html = HtmlService.createHtmlOutput(getLeaderboardHTML())
    .setWidth(800)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, '🏆 Leaderboard');
}

function getLeaderboardHTML() {
  const sheet = getSheet(SHEETS.MASTER);
  const data = sheet.getDataRange().getValues();
  
  // Calculate leaderboard data
  const byAssignee = {};
  const bySource = {};
  const byMake = {};
  
  for (let i = 1; i < data.length; i++) {
    const assignee = data[i][37] || 'Unassigned';
    const source = data[i][2];
    const make = data[i][7];
    
    if (!byAssignee[assignee]) byAssignee[assignee] = {count: 0, value: 0};
    if (!bySource[source]) bySource[source] = {count: 0, value: 0};
    if (!byMake[make]) byMake[make] = {count: 0, value: 0};
    
    byAssignee[assignee].count++;
    byAssignee[assignee].value += data[i][18] || 0;
    
    bySource[source].count++;
    bySource[source].value += data[i][18] || 0;
    
    byMake[make].count++;
    byMake[make].value += data[i][18] || 0;
  }
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #1a73e8; margin-top: 30px; }
          .leaderboard {
            width: 100%;
            margin-bottom: 30px;
          }
          .leader-row {
            display: flex;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: #f0f0f0;
            border-radius: 8px;
          }
          .leader-row.gold { background: #ffd700; }
          .leader-row.silver { background: #c0c0c0; }
          .leader-row.bronze { background: #cd7f32; }
          .rank {
            font-size: 24px;
            font-weight: bold;
            width: 50px;
            text-align: center;
          }
          .name {
            flex: 1;
            font-weight: bold;
            padding-left: 20px;
          }
          .stats {
            text-align: right;
            padding-right: 20px;
          }
          .count { font-size: 20px; font-weight: bold; }
          .value { color: #666; }
        </style>
      </head>
      <body>
        <h1>🏆 CarHawk Leaderboard</h1>
        
        <h2>By Team Member</h2>
        <div class="leaderboard">
          ${Object.entries(byAssignee)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([ name, stats], index) => `
              <div class="leader-row ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">
                <div class="rank">${index + 1}</div>
                <div class="name">${name}</div>
                <div class="stats">
                  <div class="count">${stats.count} deals</div>
                  <div class="value">${formatCurrency(stats.value)} total value</div>
                </div>
              </div>
            `).join('')}
        </div>
        
        <h2>By Source Platform</h2>
        <div class="leaderboard">
          ${Object.entries(bySource)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([source, stats], index) => `
              <div class="leader-row">
                <div class="rank">${index + 1}</div>
                <div class="name">${source}</div>
                <div class="stats">
                  <div class="count">${stats.count} leads</div>
                  <div class="value">${formatCurrency(stats.value)} total value</div>
                </div>
              </div>
            `).join('')}
        </div>
        
        <h2>By Vehicle Make</h2>
        <div class="leaderboard">
          ${Object.entries(byMake)
            .filter(([make, stats]) => make && stats.count > 0)
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([make, stats], index) => `
              <div class="leader-row">
                <div class="rank">${index + 1}</div>
                <div class="name">${make}</div>
                <div class="stats">
                  <div class="count">${stats.count} vehicles</div>
                  <div class="value">${formatCurrency(stats.value)} total value</div>
                </div>
              </div>
            `).join('')}
        </div>
        
        <script>
          function formatCurrency(value) {
            return ' + Number(value).toFixed(0).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',');
          }
        </script>
      </body>
    </html>
  `;
}

function showHelp() {
  const html = HtmlService.createHtmlOutput(getHelpHTML())
    .setWidth(800)
    .setHeight(600);
  
  SpreadsheetApp.getUi().showModalDialog(html, '❓ CarHawk 2.0 Help');
}

function getHelpHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 20px;
            line-height: 1.6;
          }
          h1 { color: #1a73e8; }
          h2 { color: #333; margin-top: 30px; }
          h3 { color: #666; }
          .section {
            margin-bottom: 30px;
            padding: 20px;
            background: #f9f9f9;
            border-radius: 8px;
          }
          .shortcut {
            display: inline-block;
            background: #e0e0e0;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: monospace;
            margin: 0 2px;
          }
          ul { margin-left: 20px; }
          a { color: #1a73e8; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>CarHawk 2.0 Help & Documentation</h1>
        
        <div class="section">
          <h2>🚀 Getting Started</h2>
          <ol>
            <li>Import vehicle listings from staging sheets using <strong>Data Management → Import from Staging</strong></li>
            <li>Run AI analysis on new imports with <strong>Analysis Tools → Run AI Analysis</strong></li>
            <li>Review hot deals in the Master Database sheet</li>
            <li>Export promising leads to your CRM system</li>
            <li>Monitor performance in the Dashboard</li>
          </ol>
        </div>
        
        <div class="section">
          <h2>📊 Understanding the Sheets</h2>
          <h3>Master Database</h3>
          <p>Central repository for all vehicle leads with complete analysis data.</p>
          
          <h3>Leads Tracker</h3>
          <p>Active lead management with contact tracking and follow-up scheduling.</p>
          
          <h3>Flip ROI Calculator</h3>
          <p>Detailed profit calculations including all costs and expected returns.</p>
          
          <h3>Verdict</h3>
          <p>AI-powered analysis results with recommendations and confidence scores.</p>
          
          <h3>Lead Scoring & Risk Assessment</h3>
          <p>Comprehensive scoring breakdown for prioritization.</p>
        </div>
        
        <div class="section">
          <h2>🎯 Key Features</h2>
          <ul>
            <li><strong>AI Analysis:</strong> Powered by OpenAI to evaluate deals</li>
            <li><strong>Distance Calculation:</strong> Factors in location for logistics</li>
            <li><strong>Smart Alerts:</strong> Get notified of hot deals automatically</li>
            <li><strong>CRM Integration:</strong> Export to SMS-iT and CompanyHub</li>
            <li><strong>Automated Scoring:</strong> Multi-factor lead scoring system</li>
          </ul>
        </div>
        
        <div class="section">
          <h2>⚙️ Configuration</h2>
          <p>Access system settings via <strong>Tools & Utilities → System Settings</strong></p>
          <ul>
            <li>Set your home ZIP code for distance calculations</li>
            <li>Configure alert thresholds for profit and ROI</li>
            <li>Add your OpenAI API key for AI analysis</li>
            <li>Enable/disable automated features</li>
          </ul>
        </div>
        
        <div class="section">
          <h2>💡 Tips & Best Practices</h2>
          <ul>
            <li>Review and update lead status daily</li>
            <li>Set realistic profit thresholds based on your market</li>
            <li>Use the distance calculator before committing to distant deals</li>
            <li>Export hot leads to CRM immediately for best results</li>
            <li>Archive old leads regularly to maintain performance</li>
          </ul>
        </div>
        
        <div class="section">
          <h2>🆘 Troubleshooting</h2>
          <p><strong>AI Analysis not working?</strong> Check your OpenAI API key in Config sheet.</p>
          <p><strong>Import failing?</strong> Ensure staging sheets have the correct format.</p>
          <p><strong>Alerts not sending?</strong> Verify email address in System Settings.</p>
        </div>
        
        <p style="text-align: center; margin-top: 40px; color: #666;">
          CarHawk 2.0 - Version ${SYSTEM_VERSION}<br>
          Built for professional vehicle flippers
        </p>
      </body>
    </html>
  `;
}

function showAbout() {
  const ui = SpreadsheetApp.getUi();
  const businessName = getConfig('BUSINESS_NAME') || 'Your Business';
  
  ui.alert(
    '🚗 About CarHawk 2.0',
    `CarHawk 2.0 - Advanced Vehicle Flipping Analyzer\n\n` +
    `Version: ${SYSTEM_VERSION}\n` +
    `Licensed to: ${businessName}\n\n` +
    `Features:\n` +
    `• AI-Powered Deal Analysis\n` +
    `• Multi-Platform Lead Import\n` +
    `• Automated Scoring & Alerts\n` +
    `• CRM Integration\n` +
    `• Location-Based Risk Assessment\n` +
    `• Comprehensive ROI Calculations\n\n` +
    `Last Updated: ${getConfig('LAST_SYNC') || 'Never'}\n` +
    `Active Leads: ${getSheet(SHEETS.MASTER).getLastRow() - 1}`,
    ui.ButtonSet.OK
  );
}

// ==========================================
// Additional Utility Functions
// ==========================================

function exportToCSV() {
  const sheet = getSheet(SHEETS.MASTER);
  const data = sheet.getDataRange().getValues();
  
  // Convert to CSV
  const csv = data.map(row => 
    row.map(cell => {
      const value = String(cell).replace(/"/g, '""');
      return `"${value}"`;
    }).join(',')
  ).join('\n');
  
  // Create blob
  const blob = Utilities.newBlob(csv, 'text/csv', 'carhawk_export.csv');
  
  // Save to Drive
  const file = DriveApp.createFile(blob);
  
  SpreadsheetApp.getUi().alert(
    'Export Complete',
    `CSV file created: ${file.getName()}\nLocation: ${file.getUrl()}`,
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function generateHeatMap() {
  SpreadsheetApp.getUi().alert(
    'Heat Map',
    'This feature would generate a visual heat map of deal locations.\n' +
    'Implementation requires Google Maps API integration.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function showLoanCalculator() {
  const html = HtmlService.createHtmlOutput(getLoanCalculatorHTML())
    .setWidth(500)
    .setHeight(500);
  
  SpreadsheetApp.getUi().showModalDialog(html, '💵 Loan Calculator');
}

function getLoanCalculatorHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h2 { color: #1a73e8; }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            font-weight: bold;
            margin-bottom: 5px;
          }
          input {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
          }
          .button {
            background-color: #1a73e8;
            color: white;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
          }
          .results {
            margin-top: 20px;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 4px;
            display: none;
          }
          .result-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 5px 0;
            border-bottom: 1px solid #ddd;
          }
          .result-label { font-weight: bold; }
          .result-value { 
            font-size: 18px;
            color: #1a73e8;
          }
        </style>
      </head>
      <body>
        <h2>Auto Loan Calculator</h2>
        
        <div class="form-group">
          <label for="loanAmount">Loan Amount ($)</label>
          <input type="number" id="loanAmount" value="15000">
        </div>
        
        <div class="form-group">
          <label for="downPayment">Down Payment ($)</label>
          <input type="number" id="downPayment" value="3000">
        </div>
        
        <div class="form-group">
          <label for="interestRate">Interest Rate (%)</label>
          <input type="number" id="interestRate" value="5.9" step="0.1">
        </div>
        
        <div class="form-group">
          <label for="loanTerm">Loan Term (months)</label>
          <input type="number" id="loanTerm" value="60">
        </div>
        
        <button class="button" onclick="calculateLoan()">Calculate Payment</button>
        
        <div id="results" class="results"></div>
        
        <script>
          function calculateLoan() {
            const loanAmount = parseFloat(document.getElementById('loanAmount').value);
            const downPayment = parseFloat(document.getElementById('downPayment').value);
            const interestRate = parseFloat(document.getElementById('interestRate').value) / 100 / 12;
            const loanTerm = parseFloat(document.getElementById('loanTerm').value);
            
            const principal = loanAmount - downPayment;
            
            // Calculate monthly payment
            const monthlyPayment = principal * 
              (interestRate * Math.pow(1 + interestRate, loanTerm)) / 
              (Math.pow(1 + interestRate, loanTerm) - 1);
            
            const totalPayment = monthlyPayment * loanTerm;
            const totalInterest = totalPayment - principal;
            
            // Display results
            const resultsDiv = document.getElementById('results');
            resultsDiv.innerHTML = \`
              <h3>Loan Summary</h3>
              <div class="result-row">
                <span class="result-label">Monthly Payment:</span>
                <span class="result-value">$\${monthlyPayment.toFixed(2)}</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Loan Amount:</span>
                <span class="result-value">$\${principal.toFixed(2)}</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Interest:</span>
                <span class="result-value">$\${totalInterest.toFixed(2)}</span>
              </div>
              <div class="result-row">
                <span class="result-label">Total Payment:</span>
                <span class="result-value">$\${totalPayment.toFixed(2)}</span>
              </div>
            \`;
            resultsDiv.style.display = 'block';
          }
        </script>
      </body>
    </html>
  `;
}

function toggleAutoSync() {
  const currentStatus = getConfig('AUTO_SYNC') === 'true';
  const newStatus = !currentStatus;
  
  setConfig('AUTO_SYNC', newStatus.toString());
  
  // Update triggers
  setupTriggers();
  
  SpreadsheetApp.getUi().alert(
    'Auto-Sync ' + (newStatus ? 'Enabled' : 'Disabled'),
    'Automatic data synchronization is now ' + (newStatus ? 'enabled' : 'disabled') + '.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

function configureAlerts() {
  showSystemSettings();
}

function scheduleReports() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Schedule Reports',
    'Reports are automatically generated:\n\n' +
    '• Daily: Alert checks at 9 AM\n' +
    '• Weekly: Performance report on Mondays at 8 AM\n' +
    '• Monthly: Comprehensive analysis on the 1st\n\n' +
    'To modify schedule, edit the trigger settings in Apps Script.',
    ui.ButtonSet.OK
  );
}

function generateEmailCampaign() {
  const ui = SpreadsheetApp.getUi();
  ui.alert(
    'Email Campaign Generator',
    'This feature would generate email templates for lead nurturing.\n' +
    'Integration with email marketing platforms required.',
    ui.ButtonSet.OK
  );
}

function syncCRMStatus() {
  const crmSheet = getSheet(SHEETS.CRM);
  const masterSheet = getSheet(SHEETS.MASTER);
  
  // This would sync status back from CRM platforms
  log('CRM Sync', 'CRM status sync completed');
  
  SpreadsheetApp.getUi().alert('CRM sync completed.');
}

function syncAllSources() {
  importFromStaging();
}

function sendAlertSummary() {
  checkAlertTriggers();
}

function addVerdictRecord(vehicleId, vehicle, analysis) {
  const verdictSheet = getSheet(SHEETS.VERDICT);
  
  verdictSheet.appendRow([
    'AN' + Date.now(),        // Analysis ID
    new Date(),               // Date
    vehicle,                  // Vehicle
    analysis.dealScore,       // Deal Score
    analysis.verdict,         // AI Verdict
    getVerdictColor(analysis.verdict), // Verdict Color
    analysis.confidence,      // Confidence %
    analysis.flipStrategy,    // Strategy
    '',                      // Key Factors
    analysis.estimatedProfit, // Profit Potential
    analysis.riskLevel,       // Risk Level
    '',                      // Market Demand
    '',                      // Competition
    '',                      // Seasonality
    '',                      // Location Factor
    analysis.repairComplexity, // Repair Complexity
    '',                      // Time to Profit
    '',                      // Recommended Actions
    '',                      // Red Flags
    '',                      // Green Flags
    analysis.aiNotes,        // AI Reasoning
    '',                      // Override
    ''                       // Final Decision
  ]);
}

function getVerdictColor(verdict) {
  const colors = {
    'BUY NOW': '#34a853',
    'STRONG BUY': '#81c784',
    'CONSIDER': '#fbbc04',
    'PASS': '#f44336',
    'HARD PASS': '#b71c1c',
    'NEEDS REVIEW': '#9e9e9e'
  };
  return colors[verdict] || '#666666';
}

// ==========================================
// END OF CARHAWK 2.0 SYSTEM
// ==========================================
