// =========================================================
// UI API LAYER - Phase 1 Stub Functions
// =========================================================
// This file provides stub implementations for all UI_* functions
// referenced by the HTML templates. Each function returns realistic
// placeholder data matching the documented data contracts.
//
// DEPLOYMENT INSTRUCTIONS:
// 1. Copy this entire file content
// 2. In Google Apps Script, create a new .gs file named "ui-api"
// 3. Paste this content
// 4. Save
//
// The UI will now work without errors, displaying placeholder data.
// See Phase 2 Wiring Checklist (end of file) for production integration.
// =========================================================

// =========================================================
// UTILITY: include() function
// =========================================================
// This function should already exist in your codebase at line 6169
// of "most complete". If not, uncomment this:

/*
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
*/

// =========================================================
// DEAL GALLERY
// =========================================================

function UI_getDealGalleryData() {
  // TODO Phase 2: Replace with real data from Master Database and Verdict sheets

  return {
    deals: [
      {
        rank: 1,
        dealId: "D-001",
        title: "2018 Honda Accord EX",
        platform: "Facebook Marketplace",
        location: "St. Louis, MO",
        distance: 12.5,
        listingUrl: "https://facebook.com/marketplace/item/123",
        askingPrice: 15000,
        estimatedValue: 18000,
        profitMargin: 62,
        riskScore: 2.1,
        hot: true,
        timestamp: new Date().toISOString()
      },
      {
        rank: 2,
        dealId: "D-002",
        title: "2019 Toyota Camry SE",
        platform: "Craigslist",
        location: "Clayton, MO",
        distance: 8.3,
        listingUrl: "https://stlouis.craigslist.org/cto/d/123",
        askingPrice: 17500,
        estimatedValue: 21000,
        profitMargin: 48,
        riskScore: 3.2,
        hot: true,
        timestamp: new Date().toISOString()
      },
      {
        rank: 3,
        dealId: "D-003",
        title: "2017 Ford F-150 XLT",
        platform: "OfferUp",
        location: "Chesterfield, MO",
        distance: 18.7,
        listingUrl: "https://offerup.com/item/123",
        askingPrice: 22000,
        estimatedValue: 26500,
        profitMargin: 35,
        riskScore: 4.5,
        hot: false,
        timestamp: new Date().toISOString()
      }
    ],
    stats: {
      total: 150,
      hot: 23,
      avgProfit: 4200,
      analyzedToday: 45
    }
  };
}

// =========================================================
// DEAL ANALYZER
// =========================================================

function UI_analyzeDeal(payload) {
  // TODO Phase 2: Wire to analyzeQuantumDeal() or create new AI analysis

  const askingPrice = payload.askingPrice || 15000;
  const estimatedValue = askingPrice * 1.3;
  const profitMargin = ((estimatedValue - askingPrice) / estimatedValue) * 100;

  return {
    verdict: profitMargin >= 50 ? "BUY" : profitMargin >= 30 ? "MAYBE" : "PASS",
    offerTarget: Math.round(askingPrice * 0.8),
    profitMargin: Math.round(profitMargin),
    riskScore: 2.3 + (Math.random() * 2),
    rank: Math.floor(Math.random() * 10) + 1,
    aiMessage: `Based on the asking price of $${askingPrice.toLocaleString()}, this appears to be a ${profitMargin >= 50 ? 'excellent' : profitMargin >= 30 ? 'decent' : 'marginal'} deal. Consider offering around $${Math.round(askingPrice * 0.8).toLocaleString()} to maintain a healthy profit margin.`,
    marketValue: Math.round(estimatedValue)
  };
}

function UI_saveDeal(payload) {
  // TODO Phase 2: Save to Master Database sheet

  Logger.log('Saving deal: ' + JSON.stringify(payload));
  return {
    success: true,
    dealId: 'D-' + Date.now(),
    message: 'Deal saved successfully'
  };
}

// =========================================================
// DEAL CALCULATOR
// =========================================================

function UI_saveCalculation(data) {
  // TODO Phase 2: Save to Flip ROI Calculator sheet

  Logger.log('Saving calculation: ' + JSON.stringify(data));
  return {
    success: true,
    calculationId: 'CALC-' + Date.now()
  };
}

// =========================================================
// SPEED TO LEAD
// =========================================================

function UI_getSpeedToLeadQueue() {
  // TODO Phase 2: Read from Leads Tracker and calculate age/priority

  const now = new Date();

  return {
    leads: [
      {
        leadId: "L-001",
        name: "John Smith",
        phone: "(314) 555-0123",
        dealTitle: "2018 Honda Accord EX",
        platform: "Facebook",
        firstContact: new Date(now - 75 * 60000).toISOString(),
        lastTouch: new Date(now - 75 * 60000).toISOString(),
        ageMinutes: 75,
        priority: "urgent",
        status: "new"
      },
      {
        leadId: "L-002",
        name: "Sarah Johnson",
        phone: "(314) 555-0456",
        dealTitle: "2019 Toyota Camry SE",
        platform: "Craigslist",
        firstContact: new Date(now - 45 * 60000).toISOString(),
        lastTouch: new Date(now - 45 * 60000).toISOString(),
        ageMinutes: 45,
        priority: "warning",
        status: "new"
      },
      {
        leadId: "L-003",
        name: "Mike Davis",
        phone: "(314) 555-0789",
        dealTitle: "2020 Ford F-150 XLT",
        platform: "OfferUp",
        firstContact: new Date(now - 15 * 60000).toISOString(),
        lastTouch: new Date(now - 15 * 60000).toISOString(),
        ageMinutes: 15,
        priority: "normal",
        status: "new"
      }
    ],
    stats: {
      pending: 12,
      urgent: 3,
      avgResponseTime: 32,
      contactedToday: 45
    }
  };
}

function UI_contactLead(leadId, method) {
  // TODO Phase 2: Update Leads Tracker, log to SMS Conversations or AI Call Logs

  Logger.log('Contact lead ' + leadId + ' via ' + method);
  return {
    success: true,
    leadId: leadId,
    method: method,
    timestamp: new Date().toISOString()
  };
}

function UI_snoozeLead(leadId, minutes) {
  // TODO Phase 2: Update Leads Tracker with snooze time

  Logger.log('Snooze lead ' + leadId + ' for ' + minutes + ' minutes');
  return {
    success: true,
    leadId: leadId,
    snoozeUntil: new Date(Date.now() + minutes * 60000).toISOString()
  };
}

// =========================================================
// PIPELINE VIEW
// =========================================================

function UI_getPipelineData() {
  // TODO Phase 2: Read from Leads Tracker, group by stage

  return {
    new: [
      {
        dealId: "D-001",
        title: "2018 Honda Accord EX",
        seller: "John Smith",
        value: 15000,
        profit: 4500,
        hot: true,
        daysInStage: 1,
        lastUpdate: new Date().toISOString()
      },
      {
        dealId: "D-002",
        title: "2019 Toyota Camry SE",
        seller: "Sarah Johnson",
        value: 17500,
        profit: 5200,
        hot: false,
        daysInStage: 2,
        lastUpdate: new Date().toISOString()
      }
    ],
    contacted: [
      {
        dealId: "D-003",
        title: "2020 Ford F-150 XLT",
        seller: "Mike Davis",
        value: 22000,
        profit: 6800,
        hot: true,
        daysInStage: 3,
        lastUpdate: new Date().toISOString()
      }
    ],
    negotiating: [
      {
        dealId: "D-004",
        title: "2017 Chevy Silverado",
        seller: "Tom Wilson",
        value: 18500,
        profit: 5500,
        hot: false,
        daysInStage: 5,
        lastUpdate: new Date().toISOString()
      }
    ],
    won: [
      {
        dealId: "D-005",
        title: "2019 Nissan Altima S",
        seller: "Lisa Brown",
        value: 14000,
        profit: 4200,
        hot: false,
        daysInStage: 7,
        lastUpdate: new Date().toISOString()
      }
    ],
    lost: [
      {
        dealId: "D-006",
        title: "2016 Honda CR-V",
        seller: "Robert Lee",
        value: 13000,
        profit: 0,
        hot: false,
        daysInStage: 4,
        lastUpdate: new Date().toISOString()
      }
    ],
    stats: {
      totalDeals: 45,
      totalValue: 675000,
      wonThisMonth: 12,
      conversionRate: 34.5
    }
  };
}

// =========================================================
// FOLLOW-UP SEQUENCES
// =========================================================

function UI_getFollowUpSequences() {
  // TODO Phase 2: Read from Campaign Queue or new Sequences configuration

  return {
    sequences: [
      {
        sequenceId: "SEQ-001",
        name: "Hot Lead Follow-Up",
        type: "HOT",
        description: "Immediate follow-up for hot leads",
        steps: [
          {day: 0, action: "SMS", template: "Hi {name}, I'm interested in your {vehicle}..."},
          {day: 1, action: "Call", template: "Follow-up call"},
          {day: 3, action: "Email", template: "Final check-in"}
        ],
        activeContacts: 12,
        completedContacts: 45,
        conversionRate: 34.5
      },
      {
        sequenceId: "SEQ-002",
        name: "Warm Lead Nurture",
        type: "WARM",
        description: "Regular follow-up for warm leads",
        steps: [
          {day: 0, action: "Email", template: "Introduction email"},
          {day: 3, action: "SMS", template: "Quick check-in"},
          {day: 7, action: "Call", template: "Follow-up call"}
        ],
        activeContacts: 23,
        completedContacts: 67,
        conversionRate: 28.3
      }
    ]
  };
}

function UI_saveFollowUpSequence(payload) {
  // TODO Phase 2: Save to Campaign Queue or Settings sheet

  Logger.log('Saving sequence: ' + JSON.stringify(payload));
  return {
    success: true,
    sequenceId: payload.sequenceId || 'SEQ-' + Date.now()
  };
}

function UI_deleteFollowUpSequence(sequenceId) {
  // TODO Phase 2: Delete from Campaign Queue or Settings

  Logger.log('Deleting sequence: ' + sequenceId);
  return {
    success: true,
    sequenceId: sequenceId
  };
}

function UI_launchSequence(sequenceId) {
  // TODO Phase 2: Add contacts to Campaign Queue with sequence steps

  Logger.log('Launching sequence: ' + sequenceId);
  return {
    success: true,
    sequenceId: sequenceId,
    contactsAdded: 5
  };
}

// =========================================================
// KNOWLEDGE BASE
// =========================================================

function UI_getKnowledgeBaseItems() {
  // TODO Phase 2: Read from Knowledge Base sheet

  return {
    items: [
      {
        id: "KB-001",
        title: "Deal Analysis Standard Operating Procedure",
        summary: "Complete SOP for analyzing vehicle deals including AI scoring, market analysis, and risk assessment procedures.",
        category: "sop",
        url: "https://docs.google.com/document/d/YOUR_DOC_ID",
        lastUpdated: "2026-01-10",
        views: 145
      },
      {
        id: "KB-002",
        title: "SMS Campaign Best Practices",
        summary: "Guidelines for creating effective SMS campaigns including messaging templates, timing strategies, and compliance requirements.",
        category: "guide",
        url: "https://docs.google.com/document/d/YOUR_DOC_ID",
        lastUpdated: "2026-01-08",
        views: 89
      },
      {
        id: "KB-003",
        title: "Hot Lead Follow-Up Playbook",
        summary: "Step-by-step playbook for following up with hot leads to maximize conversion rates. Includes scripts and timing recommendations.",
        category: "playbook",
        url: "https://docs.google.com/document/d/YOUR_DOC_ID",
        lastUpdated: "2026-01-05",
        views: 203
      }
    ]
  };
}

// =========================================================
// SETTINGS
// =========================================================

function UI_getSettings() {
  // TODO Phase 2: Read from Settings sheet

  // Try to read from Settings sheet if it exists
  try {
    const settingsSheet = getQuantumSheet('Settings');
    // If sheet exists, parse settings from it
    // For now, return defaults
  } catch (e) {
    Logger.log('Settings sheet not found, using defaults');
  }

  return {
    thresholds: {
      hotProfitThreshold: 50,
      maxDistance: 50,
      riskCutoff: 7,
      minDealValue: 5000
    },
    features: {
      enableAI: true,
      enableSMS: true,
      enableCRM: true,
      autoImport: false,
      realtimeMode: false
    },
    notifications: {
      hotDealAlerts: true,
      weeklyReports: true,
      alertEmail: ""
    },
    system: {
      homeZip: "63101",
      businessName: "CarHawk Auto"
    }
  };
}

function UI_saveSettings(settings) {
  // TODO Phase 2: Write to Settings sheet

  Logger.log('Saving settings: ' + JSON.stringify(settings));

  // Try to save to Settings sheet if it exists
  try {
    const settingsSheet = getQuantumSheet('Settings');
    // Save settings to sheet
  } catch (e) {
    Logger.log('Settings sheet not found');
  }

  return {
    success: true,
    timestamp: new Date().toISOString()
  };
}

// =========================================================
// INTEGRATION MANAGER
// =========================================================

function UI_getIntegrations() {
  // TODO Phase 2: Read from Integrations sheet

  return {
    openai: {
      apiKey: "",
      model: "gpt-4",
      connected: false
    },
    smsit: {
      apiKey: "",
      endpoint: "",
      connected: false
    },
    companyhub: {
      apiKey: "",
      accountId: "",
      connected: false
    },
    browseai: {
      apiKey: "",
      robotId: "",
      connected: false
    },
    googlemaps: {
      apiKey: "",
      connected: false
    }
  };
}

function UI_testIntegration(name, config) {
  // TODO Phase 2: Actually test the API connection

  Logger.log('Testing integration: ' + name);
  Logger.log('Config: ' + JSON.stringify(config));

  // Simulate a test (in real implementation, actually call the API)
  return {
    success: false,
    error: "Integration testing not implemented yet. Please wire to actual API calls."
  };
}

function UI_saveIntegrations(integrations) {
  // TODO Phase 2: Save to Integrations sheet (encrypted)

  Logger.log('Saving integrations');

  // WARNING: In production, encrypt API keys before storing
  return {
    success: true,
    timestamp: new Date().toISOString()
  };
}

// =========================================================
// VIN DECODER
// =========================================================

function UI_decodeVIN(vin) {
  // TODO Phase 2: Use NHTSA API or paid VIN decoder service

  Logger.log('Decoding VIN: ' + vin);

  // This is placeholder data - real implementation should call:
  // https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json

  return {
    vin: vin,
    year: 2021,
    make: "Honda",
    model: "Accord",
    trim: "EX",
    bodyType: "Sedan",
    engine: "2.0L 4-Cylinder",
    transmission: "CVT",
    drivetrain: "FWD",
    fuelType: "Gasoline",
    manufacturer: "Honda Motor Co., Ltd.",
    plantCountry: "United States"
  };
}

// =========================================================
// MISSING EXISTING FUNCTIONS (Stubs for QuickActions)
// =========================================================
// These functions are called by QuickActions but may not exist yet

function runImportPipeline() {
  // TODO Phase 2: Wire to quantumImportSync() which already exists
  quantumImportSync();
  return {
    success: true,
    imported: 15
  };
}

function runDeduplication() {
  // TODO Phase 2: Create deduplication logic for Master Database
  Logger.log('Running deduplication');
  return {
    success: true,
    removed: 5
  };
}

function updateAllVerdicts() {
  // TODO Phase 2: Recalculate all deal verdicts in Verdict sheet
  Logger.log('Updating all verdicts');
  return {
    success: true,
    updated: 150
  };
}

// =========================================================
// PHASE 2 WIRING CHECKLIST
// =========================================================
/*

## PHASE 2: REPLACE STUBS WITH REAL DATA

### 1. DEAL GALLERY (UI_getDealGalleryData)
**Data Sources:**
- Master Database sheet (QUANTUM_SHEETS.DATABASE)
- Verdict sheet (QUANTUM_SHEETS.VERDICT)

**Steps:**
a) Read all rows from Master Database
b) Join with Verdict sheet on Deal ID
c) Filter for deals with verdicts
d) Sort by rank/score
e) Calculate stats (total, hot count, avg profit)
f) Return top 50-100 deals

**Key Fields to Map:**
- Column A (Deal ID) → dealId
- Columns 5-7 (Year/Make/Model) → title
- Column 13 (Asking Price) → askingPrice
- Column 27 (Profit Margin) → profitMargin
- Column 42 (Platform) → platform
- Verdict sheet Score → rank

---

### 2. DEAL ANALYZER (UI_analyzeDeal)
**Data Sources:**
- Use existing analyzeQuantumDeal() or create wrapper

**Steps:**
a) Call existing AI analysis functions
b) Extract verdict, scores, and recommendations
c) Format response to match UI contract

**Existing Function to Wire:**
- analyzeQuantumDeal() (if exists)
- Or use OpenAI API directly with deal data

---

### 3. SPEED TO LEAD (UI_getSpeedToLeadQueue)
**Data Sources:**
- Leads Tracker sheet (QUANTUM_SHEETS.LEADS)
- CRM Integration sheet (QUANTUM_SHEETS.CRM)

**Steps:**
a) Read all leads with status "new" or "contacted"
b) Calculate age: now - firstContactTimestamp
c) Determine priority: urgent (>60min), warning (30-60min), normal (<30min)
d) Sort by age descending
e) Calculate stats

**Key Fields to Map:**
- Lead ID, Name, Phone from Leads Tracker
- Deal Title from linked Deal ID
- First Contact timestamp
- Last Touch timestamp

---

### 4. PIPELINE VIEW (UI_getPipelineData)
**Data Sources:**
- Leads Tracker sheet (QUANTUM_SHEETS.LEADS)
- Or create new "stage" column in Master Database

**Steps:**
a) Read all active deals
b) Group by stage: new, contacted, negotiating, won, lost
c) Calculate days in stage
d) Calculate stats (total value, won count, conversion rate)

**Key Fields to Map:**
- Deal stage/status
- Deal value (asking price or agreed price)
- Seller name/contact
- Days since stage change

---

### 5. FOLLOW-UP SEQUENCES (UI_getFollowUpSequences)
**Data Sources:**
- Campaign Queue sheet (QUANTUM_SHEETS.CAMPAIGNS)
- Or create new Sequences config in Settings

**Steps:**
a) Define sequences as JSON in Settings sheet
b) Read active campaigns
c) Count contacts in each sequence
d) Calculate completion and conversion rates

**Data Structure:**
Store sequences as JSON string in Settings:
{
  "sequences": [
    {"id": "SEQ-001", "name": "Hot Lead", "steps": [...]}
  ]
}

---

### 6. SETTINGS (UI_getSettings / UI_saveSettings)
**Data Sources:**
- Settings sheet (QUANTUM_SHEETS.SETTINGS)

**Steps:**
a) Use existing getQuantumSetting() / setQuantumSetting() functions
b) Read all settings into object
c) Organize by category (thresholds, features, notifications, system)

**Existing Functions to Use:**
- getQuantumSetting(key)
- setQuantumSetting(key, value)

---

### 7. INTEGRATION MANAGER (UI_getIntegrations / UI_saveIntegrations)
**Data Sources:**
- Integrations sheet (QUANTUM_SHEETS.INTEGRATIONS)
- Or Settings sheet

**SECURITY WARNING:**
- NEVER store API keys in plain text
- Use PropertiesService.getScriptProperties() for secure storage
- Or encrypt before storing in sheet

**Steps:**
a) Read from PropertiesService (recommended):
   PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY')
b) Or read from Integrations sheet (encrypted)
c) Test connections before saving
d) Store encrypted values

---

### 8. VIN DECODER (UI_decodeVIN)
**Data Sources:**
- NHTSA API (free): https://vpic.nhtsa.dot.gov/api/
- Or paid service: Carfax, Edmunds, etc.

**Steps:**
a) Call NHTSA API:
   https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json
b) Parse response
c) Map to UI data contract
d) Handle errors (invalid VIN)

**Implementation:**
function UI_decodeVIN(vin) {
  const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`;
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  // Parse and return formatted data
}

---

### 9. KNOWLEDGE BASE (UI_getKnowledgeBaseItems)
**Data Sources:**
- Knowledge Base sheet (QUANTUM_SHEETS.KNOWLEDGE)

**Steps:**
a) Read all rows from Knowledge Base
b) Parse category, title, summary, URL
c) Track views (optional)
d) Return formatted items

**Sheet Structure:**
Column A: ID
Column B: Title
Column C: Summary
Column D: Category
Column E: URL
Column F: Last Updated
Column G: Views

---

### 10. QUICK ACTIONS - EXISTING FUNCTIONS
These already exist in codebase:
✓ syncQuantumCRM() - line 4740
✓ executeQuantumAIBatch() - need to verify
✓ exportQuantumSMS() - line 1721
✓ exportQuantumCRM() - line 1981
✓ generateQuantumCampaigns() - line 4826
✓ runDeepMarketScan() - line 4726
✓ runSystemDiagnostics() - line 4998
✓ generateQuantumWeekly() - line 4563

Need to create:
- runImportPipeline() → wire to quantumImportSync() (line 592)
- runDeduplication() → create new
- updateAllVerdicts() → create new

---

## TESTING CHECKLIST

After wiring each function:
1. Test with empty sheets (should not crash)
2. Test with 1 row of data
3. Test with 100+ rows (performance)
4. Test with missing columns (graceful degradation)
5. Test error handling (API failures, invalid data)
6. Verify UI displays data correctly
7. Check for script timeout (30s limit for UI functions)

---

## PRIORITY ORDER

**Phase 2A - Core Data Display (Week 1):**
1. UI_getDealGalleryData (most visible)
2. UI_getSettings / UI_saveSettings (needed for configuration)
3. UI_getPipelineData (important for workflow)

**Phase 2B - Actions & Tools (Week 2):**
4. UI_analyzeDeal (AI integration)
5. UI_getSpeedToLeadQueue (lead management)
6. UI_decodeVIN (utility feature)

**Phase 2C - Advanced Features (Week 3):**
7. UI_getFollowUpSequences + actions
8. UI_getIntegrations + save/test
9. UI_getKnowledgeBaseItems

**Phase 2D - Calculations & Stubs (Week 4):**
10. Wire QuickActions stubs to real functions
11. UI_saveCalculation
12. UI_saveDeal
13. UI_contactLead / UI_snoozeLead

---

## PERFORMANCE OPTIMIZATION

For functions that read large datasets:
1. Limit rows returned (max 100-500)
2. Use pagination if needed
3. Cache results for 5-10 minutes
4. Use batch operations for writing

Example caching:
const cache = CacheService.getScriptCache();
const cacheKey = 'deals_gallery_data';
const cached = cache.get(cacheKey);
if (cached) return JSON.parse(cached);

// Fetch data...
cache.put(cacheKey, JSON.stringify(data), 300); // 5 min cache
return data;

*/
