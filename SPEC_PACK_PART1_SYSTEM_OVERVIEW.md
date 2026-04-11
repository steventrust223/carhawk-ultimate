# CarHawk Ultimate -- System Overview & Architecture
## Spec Pack Part 1 of 8 | QUANTUM-2.0.0

---

### A) System Identity

| Property | Value |
|----------|-------|
| Name | CarHawk Ultimate CRM |
| Version | QUANTUM-2.0.0 |
| Signature | 🚗⚛️ |
| Runtime | Google Apps Script V8 |
| Timezone | America/Chicago |
| Home Base | St. Louis, MO (38.6270, -90.1994) |
| Home ZIP | 63101 |
| AI Engine | OpenAI GPT-4 Turbo Preview |
| Support | quantumsupport@carhawkultra.com |

---

### B) What It Does

CarHawk Ultimate is an enterprise-grade Google Apps Script suite for AI-powered vehicle deal analysis, CRM automation, rental fleet management, marketing campaigns, and pipeline intelligence. It turns a Google Sheet into a full deal-sourcing and CRM platform for car flippers and small dealers.

**Core Workflow:**
1. **Source** -- Browse.AI robots scrape 10+ marketplaces automatically
2. **Import** -- Raw listings flow into Master Import, get parsed and enriched
3. **Analyze** -- OpenAI GPT-4 scores every deal across 15+ dimensions
4. **Verdict** -- Each deal gets a verdict: HOT DEAL / SOLID DEAL / PORTFOLIO FOUNDATION / PASS
5. **Engage** -- Automated SMS/Email follow-up sequences contact sellers
6. **Track** -- Full CRM pipeline: leads, appointments, calls, campaigns, closed deals
7. **Decide** -- Flip vs. Hold (Turo) decision framework with financial modeling
8. **Report** -- Dashboards, weekly/monthly reports, ROI optimization

---

### C) File Inventory

**Total Codebase: ~18,400 lines across 56 files**

#### Quantum CRM Core (31 .gs files)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | quantum_config.gs | 24 | Central version & identity constants |
| 2 | quantum_core.gs | 110 | State management, sheet definitions, config, capital tiers |
| 3 | quantum_utilities.gs | 392 | Settings, logging, ID generation, data helpers |
| 4 | quantum_headers.gs | 286 | Header deployment for all 20 sheets (444+ columns) |
| 5 | quantum_setup.gs | 97 | System initialization and 8-phase deployment |
| 6 | quantum_menu.gs | 125 | Main menu with 9 submenus (63+ items) |
| 7 | quantum_menu_handlers.gs | 538 | All menu action handlers and UI launchers |
| 8 | quantum_formulas.gs | 18 | Formula deployment (placeholder) |
| 9 | quantum_fallback.gs | 92 | AI fallback analysis, verdict logging, model init |
| 10 | quantum_import.gs | 604 | Browse.AI import pipeline and vehicle parsing |
| 11 | quantum_ai.gs | 299 | OpenAI-powered deal analysis engine |
| 12 | quantum_calculations.gs | 371 | ROI, MAO, scoring, market advantage |
| 13 | quantum_browse_ai.gs | 421 | Browse.AI sheet-based robot integration |
| 14 | quantum_browse_ai_api.gs | 979 | Browse.AI v2 API: tasks, bulk runs, webhooks |
| 15 | quantum_robots.gs | 1584 | Master robot registry for 10 marketplace platforms |
| 16 | quantum_sms_it.gs | 175 | SMS-iT campaign export and messaging |
| 17 | quantum_ohmylead.gs | 83 | Ohmylead appointment sync |
| 18 | quantum_companyhub.gs | 237 | CompanyHub CRM export with CSV generation |
| 19 | quantum_crm_engine.gs | 379 | CRM core: appointments, follow-ups, campaigns, SMS, calls |
| 20 | quantum_crm_helpers.gs | 220 | Intent analysis, sentiment, template filling, deal lookup |
| 21 | quantum_crm_automation.gs | 143 | Trigger-based follow-up, campaign, reminder processing |
| 22 | quantum_crm_api.gs | 139 | Twilio SMS, SendGrid email, SMS-iT API |
| 23 | quantum_knowledge_base.gs | 65 | Vehicle knowledge base with 10 model profiles |
| 24 | quantum_integrations.gs | 93 | Integration CRUD and sync tracking |
| 25 | quantum_alerts.gs | 272 | Real-time alerts, email notifications, digest |
| 26 | quantum_ui.gs | 224 | Deal gallery, quick actions, deal analyzer |
| 27 | quantum_dashboard.gs | 202 | Dashboard generation with metrics and leaderboard |
| 28 | quantum_testing.gs | 152 | CRM test functions and simulation |
| 29 | quantum_reports.gs | 196 | Closed deals, weekly, monthly reports, ROI optimizer |
| 30 | quantum_triggers.gs | 101 | Time-based automation (hourly sync, daily analysis) |
| 31 | quantum_setup_html.gs | 309 | Setup wizard HTML (glassmorphism UI) |
|    | quantum_processing_html.gs | 87 | Import progress dialog |
|    | quantum_sms_export_html.gs | 322 | SMS export campaign builder dialog |

#### Turo Rental Module (7 .gs files -- see TURO_SPEC_PACK.md)

| # | File | Lines | Purpose |
|---|------|-------|---------|
| 1 | turo_config.gs | 563 | Vehicle classification, pricing, seasonality |
| 2 | turo_setup.gs | 603 | Idempotent sheet creation for 5 Turo sheets |
| 3 | turo_engine.gs | 872 | Turo economics, hold score, risk tiers |
| 4 | turo_fleet.gs | 448 | Fleet lifecycle management and ROI tracking |
| 5 | turo_maintenance.gs | 239 | Maintenance event logging with HTML dialog |
| 6 | turo_compliance.gs | 235 | Insurance, registration, inspection alerts |
| 7 | turo_tests.gs | 565 | 7-test acceptance suite |

#### HTML UI Components (18 files)

| File | Type | Purpose |
|------|------|---------|
| AppointmentManager.html | Modal | Schedule test drives, deliveries, inspections |
| CallLogs.html | Modal | Call history with inbound/outbound/missed tracking |
| CampaignManager.html | Modal | SMS/Email campaign management |
| CRMAnalytics.html | Modal | KPIs, conversion rates, sales funnel |
| DealAnalyzer.html | Modal | Evaluate deals with spread/margin/risk |
| DealCalculator.html | Modal | Real-time profit calculator |
| DealGallery.html | Full Page | Card-view deal gallery with actions |
| FollowUpCenter.html | Modal | Active follow-up monitoring |
| FollowUpSequences.html | Modal | Automated sequence management |
| IntegrationManager.html | Modal | Third-party service connections |
| KnowledgeBase.html | Modal | Vehicle data and market insights |
| PipelineView.html | Modal | Kanban-style deal pipeline |
| QuantumHelp.html | Modal | Guides, tips, keyboard shortcuts |
| QuickActions.html | Sidebar | One-click common tasks |
| Settings.html | Sidebar | System preferences, API keys, thresholds |
| SMSConversations.html | Modal | SMS thread viewer |
| SpeedToLead.html | Modal | Lead response time tracking |
| VINDecoder.html | Modal | VIN decode with vehicle details |

#### Config Files

| File | Purpose |
|------|---------|
| appsscript.json | GAS manifest: timezone, scopes, runtime |
| .clasp.json | clasp CLI: script ID, push order (56 files) |

---

### D) OAuth Scopes Required

| Scope | Purpose |
|-------|---------|
| spreadsheets.currentonly | Current spreadsheet access |
| spreadsheets | Full Sheets access |
| drive | Google Drive (file exports) |
| script.external_request | HTTP requests (OpenAI, Browse.AI, SMS-iT, etc.) |
| script.scriptapp | Trigger management |
| userinfo.email | User identification |
| gmail.send | Email notifications and campaigns |
| script.container.ui | Dialogs, modals, sidebars |

---

### E) Global Configuration Constants

```javascript
// quantum_config.gs
const QUANTUM = {
  VERSION: 'QUANTUM-2.0.0',
  NAME: 'CarHawk Ultimate CRM',
  SIGNATURE: '🚗⚛️'
}

// quantum_core.gs
const QUANTUM_CONFIG = {
  HOME_COORDINATES: { lat: 38.6270, lng: -90.1994 },
  HOME_ZIP: '63101',
  ANALYSIS_DEPTH: 'QUANTUM',        // BASIC | ADVANCED | QUANTUM
  PREDICTION_WINDOW: 30,             // days
  MARKET_REFRESH_RATE: 3600,         // seconds
  AI_CONFIDENCE_THRESHOLD: 0.85,     // 85%
  PROFIT_QUANTUM: 2000,              // min profit threshold ($)
  VELOCITY_THRESHOLD: 14,            // days for quick flip
  REPAIR_KEYWORDS: [
    { keyword: 'transmission',  severity: 'HIGH',     cost: 3000 },
    { keyword: 'engine knock',  severity: 'HIGH',     cost: 2500 },
    { keyword: 'needs motor',   severity: 'CRITICAL', cost: 4000 },
    { keyword: 'blown head',    severity: 'HIGH',     cost: 1500 },
    { keyword: 'no reverse',    severity: 'MEDIUM',   cost: 2000 },
    { keyword: 'overheating',   severity: 'MEDIUM',   cost: 800  },
    { keyword: 'ac broken',     severity: 'LOW',      cost: 500  },
    { keyword: 'minor dents',   severity: 'LOW',      cost: 300  }
  ]
}

const CAPITAL_TIERS = {
  MICRO:    { min: 0,     max: 1000,  label: 'Micro Flip',    multiplier: 2.5 },
  BUDGET:   { min: 1000,  max: 4000,  label: 'Budget Flip',   multiplier: 2.0 },
  STANDARD: { min: 4000,  max: 10000, label: 'Standard Flip',  multiplier: 1.5 },
  DEALER:   { min: 10000, max: Infinity, label: 'Dealer Flip', multiplier: 1.2 }
}
```

---

### F) Global State Object

```javascript
const QuantumState = {
  analysisQueue: [],
  activeProcessors: 0,
  maxProcessors: 5,
  marketIntelligence: {},
  predictiveModels: {},
  realTimeAlerts: [],
  campaignQueue: [],
  followUpQueue: []
}
```

---

### G) Settings Sheet Keys

Settings stored in the Settings sheet (key-value):

| Key | Default | Type | Purpose |
|-----|---------|------|---------|
| BUSINESS_NAME | (required) | String | Company name for branding |
| HOME_ZIP | 63101 | String | Base location for distance calc |
| OPENAI_API_KEY | (required) | String | GPT-4 API access |
| SMSIT_API_KEY | (optional) | String | SMS-iT API key |
| SMSIT_WEBHOOK_URL | (optional) | URL | SMS-iT webhook endpoint |
| OHMYLEAD_WEBHOOK_URL | (optional) | URL | Ohmylead sync endpoint |
| SENDGRID_API_KEY | (optional) | String | Email delivery |
| TWILIO_ACCOUNT_SID | (optional) | String | Fallback SMS |
| TWILIO_AUTH_TOKEN | (optional) | String | Fallback SMS |
| TWILIO_PHONE | (optional) | String | Fallback SMS sender |
| PROFIT_TARGET | 2000 | Number | Min profit for alerts |
| ANALYSIS_DEPTH | Quantum | String | AI depth level |
| ALERT_EMAIL | (required) | Email | Notification recipient |
| REALTIME_MODE | false | Boolean | Enable hourly sync |
| REALTIME_SYNC | false | Boolean | Sync enabled flag |
| SYNC_INTERVAL | 300 | Number | Sync interval (seconds) |
| REALTIME_ALERTS | true | Boolean | Enable push alerts |
| CRM_ENABLED | false | Boolean | Enable CRM sync |
| ALERTS_ENABLED | true | Boolean | Enable alert system |
| AUTO_FOLLOW_UP | true | Boolean | Auto-create follow-ups for hot deals |
| YOUR_NAME | (optional) | String | Name for email templates |
| SYSTEM_VERSION | 1.0.0 | String | Installed version |
| INSTALL_DATE | (auto) | ISO Date | First deployment |
| LAST_SYNC | (auto) | ISO Date | Last hourly sync |
| LAST_ANALYSIS | (auto) | ISO Date | Last daily analysis |

Plus 20 Turo-specific settings (see TURO_SPEC_PACK.md).

---

### H) Menu Structure

**Main Menu: ⚙️ CarHawk Ultimate**

| Submenu | Items | Key Functions |
|---------|-------|---------------|
| ⚛️ Quantum Operations | 6 | initializeQuantumSystem, quantumImportSync, executeQuantumAIBatch, toggleRealTimeMode, analyzeQuantumDeal, runDeepMarketScan |
| 🎯 CRM Operations | 7 | openAppointmentManager, openFollowUpCenter, openCampaignManager, openSMSConversations, openCallLogs, launchCampaignUI, openCRMAnalytics |
| 🤝 CRM & Export | 5 | exportQuantumSMS, exportQuantumCRM, generateQuantumCampaigns, syncQuantumCRM, exportQuantumAnalytics |
| 👥 Lead Management | 7 | openLeadTracker, openLeadScoring, viewHotLeads, viewColdLeads, openSpeedToLead, openPipelineView |
| 🔔 Alerts & Automation | 6 | checkQuantumAlerts, sendQuantumDigest, configureQuantumTriggers, showAutomationStatus, openScheduleManager, manageFollowUpSequences |
| 📊 Analytics & Reports | 7 | openQuantumDashboard, generatePerformanceMatrix, generateMarketIntelligence, generateQuantumWeekly, generateQuantumMonthly, runROIOptimizer, generateClosedDealsReport |
| 🤖 Browse.ai Robots | 9 | setBrowseAIApiKeyUI, showBrowseAIRobotsUI, linkBrowseAIRobotUI, registerRobotUI, showRobotSetupGuide, deployRobotUI, fetchAndImportBrowseAIDataUI, importFromBrowseAI, showRobotStatusUI |
| 🛠️ Tools & Utilities | 7 | openQuantumVINDecoder, openDealCalculatorPro, generateMarketHeatMap, openKnowledgeBase, runSystemDiagnostics, openQuantumSettings, openIntegrationManager |
| 🚗 Turo Module | 8 | analyzeTuroSelected, batchAnalyzeTuro, refreshFleetManager, addToFleetSelected, updateFleetFinancials, logMaintenanceEvent, checkComplianceAlerts, setupTuroModule |

**Quick Access (top-level):**
- Deal Gallery, Quick Actions, Deal Analyzer, Quantum Help, About CarHawk Ultimate

---

### I) System Initialization (8-Phase Deploy)

`deployQuantumArchitecture(config)` runs these phases in order:

| Phase | Function | What It Does |
|-------|----------|-------------|
| 1 | createQuantumSheets() | Creates 20 sheets with colors, icons, protection |
| 2 | deployQuantumHeaders() | Deploys 444+ column headers across 18 sheets |
| 3 | deployQuantumFormulas() | Deploys ROI/scoring formulas (placeholder) |
| 4 | initializeAIModels(config) | Stores API keys and config to Settings |
| 5 | setupRealtimeSync() | Initializes sync settings |
| 6 | initializeCRMSystem(config) | Sets up CRM credentials and defaults |
| 7 | deployQuantumTriggers() | Creates hourly, daily, and CRM triggers |
| 8 | generateQuantumDashboard() | Builds initial dashboard |

---

### J) clasp Push Order

Files deploy in this dependency order (56 total):
1. quantum_config.gs (identity)
2. quantum_core.gs (constants)
3. quantum_utilities.gs (helpers)
4. quantum_headers.gs → quantum_setup.gs → quantum_menu.gs
5. All remaining quantum_*.gs modules
6. All turo_*.gs modules
7. All *.html UI files
