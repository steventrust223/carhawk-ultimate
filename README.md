# CarHawk Ultimate - Quantum CRM System

Enterprise-grade Google Apps Script suite for AI-powered vehicle deal analysis, CRM automation, rental fleet management, marketing campaigns, and pipeline intelligence.

**Version:** QUANTUM-2.0.0 with Turo Module v1.0.0

## Architecture

CarHawk Ultimate is a modular Google Sheets add-on system with 37 script files organized into distinct functional domains:

### Quantum CRM Core (28 modules)

| File | Purpose |
|------|---------|
| `quantum_core.gs` | Constants, configuration, sheet architecture, capital tiers |
| `quantum_menu.gs` | Full menu system with 8 submenus + Turo module |
| `quantum_setup.gs` | System initialization and sheet creation |
| `quantum_headers.gs` | Header deployment for all 20 sheets |
| `quantum_import.gs` | Browse.AI import pipeline and vehicle parsing |
| `quantum_ai.gs` | OpenAI-powered deal analysis engine |
| `quantum_calculations.gs` | Metrics: ROI, MAO, scoring, market advantage |
| `quantum_browse_ai.gs` | Browse.AI robot integration |
| `quantum_sms_it.gs` | SMS-iT campaign export and messaging |
| `quantum_ohmylead.gs` | Ohmylead appointment booking integration |
| `quantum_companyhub.gs` | CompanyHub CRM export with CSV generation |
| `quantum_crm_engine.gs` | CRM core: appointments, follow-ups, campaigns, SMS, calls |
| `quantum_crm_helpers.gs` | Intent analysis, sentiment, template filling, deal lookup |
| `quantum_crm_automation.gs` | Trigger-based follow-up, campaign, and reminder processing |
| `quantum_crm_api.gs` | Twilio SMS, SendGrid email, SMS-iT API |
| `quantum_knowledge_base.gs` | Vehicle knowledge base with 10+ model profiles |
| `quantum_integrations.gs` | Integration management (add, sync, error tracking) |
| `quantum_alerts.gs` | Real-time alerts, email notifications, digest system |
| `quantum_ui.gs` | Deal gallery, quick actions, deal analyzer dialogs |
| `quantum_dashboard.gs` | Dashboard generation with metrics, charts, leaderboard |
| `quantum_testing.gs` | CRM test functions and simulation |
| `quantum_utilities.gs` | Shared helpers: settings, logging, ID generation |
| `quantum_reports.gs` | Closed deals, weekly, monthly reports, ROI optimizer |
| `quantum_menu_handlers.gs` | All menu action handlers and UI launchers |
| `quantum_triggers.gs` | Time-based automation (hourly sync, daily analysis) |
| `quantum_formulas.gs` | Formula deployment engine |
| `quantum_setup_html.gs` | Setup wizard HTML (dark gradient UI) |
| `quantum_processing_html.gs` | Import processing progress dialog |
| `quantum_sms_export_html.gs` | SMS-iT export dialog with campaign builder |
| `quantum_fallback.gs` | AI fallback analysis, verdict logging, model init |

### Turo Rental Module (7 modules)

| File | Purpose |
|------|---------|
| `turo_config.gs` | Vehicle classification (8 classes, 300+ models), pricing, seasonality |
| `turo_engine.gs` | Turo economics computation, hold score, risk tiers |
| `turo_setup.gs` | Idempotent sheet creation for 5 Turo sheets |
| `turo_fleet.gs` | Fleet lifecycle management and ROI tracking |
| `turo_maintenance.gs` | Maintenance event logging with HTML dialog |
| `turo_compliance.gs` | Insurance, registration, inspection alerts |
| `turo_tests.gs` | 7-test acceptance suite |

### Project Configuration

| File | Purpose |
|------|---------|
| `appsscript.json` | Apps Script manifest (timezone, scopes, V8 runtime) |
| `.clasp.json` | clasp CLI config for push/pull |
| `main.gs` | Legacy monolithic file (kept for reference) |

## Sheet Architecture (20 Core + 5 Turo)

### Core Sheets
1. **Master Import** - Browse.AI raw data ingestion
2. **Master Database** - Central deal repository (60 columns)
3. **Verdict** - AI analysis results and scoring
4. **Leads Tracker** - Lead pipeline with contact tracking
5. **Flip ROI Calculator** - Multi-scenario profit modeling
6. **Lead Scoring & Risk Assessment** - Weighted scoring matrix
7. **CRM Integration** - Export logs and sync tracking
8. **Parts Needed** - Repair parts catalog with suppliers
9. **Post-Sale Tracker** - Closed deal performance analysis
10. **Reporting & Charts** - Dashboard and metrics
11. **Settings** - System configuration key-value store
12. **Activity Logs** - Comprehensive audit trail
13. **Appointments** - Scheduling with reminders
14. **Follow Ups** - Automated sequence management
15. **Campaign Queue** - Multi-touch campaign execution
16. **SMS Conversations** - Full SMS thread tracking
17. **AI Call Logs** - Call transcription and analysis
18. **Closed Deals** - Deal outcome recording
19. **Knowledge Base** - Vehicle-specific market intelligence
20. **Integrations** - External service management

### Turo Sheets
21. **Turo Engine** - Rental analysis (39 columns)
22. **Fleet Manager** - Active fleet tracking (26 columns)
23. **Maintenance & Turnovers** - Service logging
24. **Turo Pricing & Seasonality** - Rate tables and multipliers
25. **Insurance & Compliance** - Registration/insurance tracking

## Key Features

### AI-Powered Analysis
- OpenAI GPT-4 Turbo integration with 3 depth levels (Basic, Advanced, Quantum)
- 15+ dimension scoring: market, vehicle, seller, timing, location, competition
- Automated verdict classification: HOT DEAL / SOLID DEAL / PORTFOLIO FOUNDATION / PASS
- Personalized seller message generation

### CRM Pipeline
- Full deal lifecycle: IMPORTED → CONTACTED → RESPONDED → APPOINTMENT_SET → NEGOTIATING → CLOSED_WON
- Automated follow-up sequences (HOT_LEAD, WARM_LEAD, COLD_LEAD)
- Multi-channel outreach (SMS, Email, Phone)
- Response intent analysis and sentiment detection

### Marketing Automation
- SMS-iT integration for campaign management
- Ohmylead appointment booking
- CompanyHub CRM export with CSV generation
- Campaign builder with A/B testing support
- Staggered message delivery

### Turo Rental Analysis
- Vehicle classification across 8 classes (300+ models)
- Full economics: revenue, expenses, cash flow, payback
- 6-component Turo Hold Score (0-100)
- Risk tiers: Low, Medium, High, Critical
- Turo vs Flip 12-month comparison
- Fleet lifecycle management
- Maintenance tracking with HTML dialogs
- Compliance alerts (registration, insurance, inspection)

### Reporting & Analytics
- Real-time quantum dashboard
- Weekly and monthly reports
- ROI optimizer with pattern analysis
- Market intelligence and insights
- Closed deals performance tracking

## Capital Tier Classification

| Tier | Range | Multiplier |
|------|-------|------------|
| Micro Flip | $0 - $1,000 | 2.5x |
| Budget Flip | $1,000 - $4,000 | 2.0x |
| Standard Flip | $4,000 - $10,000 | 1.5x |
| Dealer Flip | $10,000+ | 1.2x |

## Integrations

- **OpenAI** - GPT-4 Turbo for deal analysis
- **Browse.AI** - Automated listing scraping
- **SMS-iT** - SMS campaign management
- **Ohmylead** - Appointment booking
- **CompanyHub** - CRM export
- **Twilio** - Fallback SMS delivery
- **SendGrid** - Email campaigns
- **Google Drive** - Report storage

## Installation

1. Create a new Google Sheet
2. Open the Apps Script editor: **Extensions → Apps Script**
3. Create a script file for each `.gs` file in this repo and paste the contents
4. Copy `appsscript.json` to the project manifest (View → Show manifest file)
5. Save all files
6. Reload the spreadsheet - the **CarHawk Ultimate** menu will appear
7. Run **⚛️ Quantum Operations → Initialize System** to deploy all sheets
8. Run **🚗 Turo Module → Setup Turo Module** to add Turo sheets

### Using clasp (Alternative)

```bash
npm install -g @google/clasp
clasp login
# Update .clasp.json with your script ID
clasp push
```

## Configuration

On first run, the setup wizard will prompt for:

- **Business Name** - Used in reports and emails
- **Home ZIP** - Base location for distance calculations (default: 63101, St. Louis)
- **OpenAI API Key** - Required for AI analysis
- **SMS-iT API Key** - Optional, for SMS campaigns
- **Ohmylead Webhook** - Optional, for appointment booking
- **Profit Target** - Minimum profit threshold (default: $2,000)
- **Analysis Depth** - Quantum (max), Advanced (balanced), or Basic (fast)
- **Alert Email** - For real-time deal notifications

## Automated Triggers

| Trigger | Frequency | Function |
|---------|-----------|----------|
| Import Sync | Hourly (if real-time mode) | Browse.AI ingestion |
| Daily Analysis | 6:00 AM | Full AI batch + dashboard |
| Follow-up Processor | Every 5 minutes | Send scheduled follow-ups |
| Campaign Processor | Every 10 minutes | Execute campaign touches |
| Appointment Reminders | Hourly | Send 1-hour reminders |
| Turo Batch Analysis | Daily | Re-analyze Turo candidates |
| Compliance Alerts | Daily | Check expirations |

## Menu Structure

```
⚙️ CarHawk Ultimate
├── ⚛️ Quantum Operations (7 items)
├── 🎯 CRM Operations (7 items)
├── 🤝 CRM & Export (5 items)
├── 👥 Lead Management (6 items)
├── 🔔 Alerts & Automation (6 items)
├── 📊 Analytics & Reports (7 items)
├── 🛠️ Tools & Utilities (7 items)
├── 🎴 Deal Gallery
├── ⚡ Quick Actions
├── 🧠 Deal Analyzer
├── 🚗 Turo Module (8 items)
├── ❓ Quantum Help
└── ℹ️ About CarHawk Ultimate
```

## Development

- **Runtime:** Google Apps Script V8
- **Timezone:** America/Chicago (St. Louis, MO)
- **Home Base:** 38.6270, -90.1994
- **AI Model:** GPT-4 Turbo Preview (Quantum depth)

## License

Proprietary - All rights reserved.
