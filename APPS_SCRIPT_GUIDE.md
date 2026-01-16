# CarHawk Ultimate - Google Apps Script Setup Guide

## 📁 Project Structure

This repository contains the complete **CarHawk Ultimate Quantum CRM** system for Google Apps Script. All code has been modularized into 31 separate `.gs` files for optimal organization and maintainability.

## 🚀 Deployment Instructions

### Step 1: Create a New Google Sheets Document

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it: **CarHawk Ultimate CRM**

### Step 2: Open Apps Script Editor

1. In your spreadsheet, click **Extensions** > **Apps Script**
2. Delete the default `Code.gs` file

### Step 3: Upload All Script Files

Upload all 31 files from the `src/` directory to your Apps Script project:

#### Core System Files (8 files)
- `quantum-core.gs` - Core constants, configurations, and state management
- `quantum-menu.gs` - Menu system with 50+ menu items
- `quantum-setup.gs` - System initialization and deployment
- `quantum-headers.gs` - Sheet header definitions for all 21 sheets
- `quantum-utilities.gs` - Helper functions and utilities
- `quantum-formulas.gs` - Formula deployment engine
- `quantum-triggers.gs` - Time-based automation triggers
- `quantum-fallback.gs` - Error handling and fallbacks

#### Import & Processing Files (2 files)
- `quantum-import.gs` - Data import and synchronization
- `quantum-browse-ai.gs` - Browse.AI web scraping integration

#### AI Analysis Files (2 files)
- `quantum-ai.gs` - AI-powered deal analysis engine
- `quantum-calculations.gs` - 15+ metric calculation functions

#### CRM System Files (5 files)
- `quantum-crm-engine.gs` - Core CRM functions
- `quantum-crm-helpers.gs` - CRM helper utilities
- `quantum-crm-automation.gs` - Automated follow-up sequences
- `quantum-crm-api.gs` - External API framework
- `quantum-knowledge-base.gs` - Vehicle knowledge base

#### Integration Files (4 files)
- `quantum-sms-it.gs` - SMS-iT CRM integration
- `quantum-ohmylead.gs` - Ohmylead appointment booking
- `quantum-companyhub.gs` - CompanyHub CRM export
- `quantum-integrations.gs` - Integration management UI

#### UI & Dialog Files (4 files)
- `quantum-ui-functions.gs` - 20+ dialog functions
- `quantum-setup-html.gs` - Setup wizard HTML
- `quantum-processing-html.gs` - Processing status UI
- `quantum-sms-export-html.gs` - SMS export interface

#### Reporting & Analytics Files (3 files)
- `quantum-dashboard.gs` - Interactive dashboard
- `quantum-reports.gs` - Report generation functions
- `quantum-menu-handlers.gs` - Menu action handlers

#### Alerts & Testing Files (2 files)
- `quantum-alerts.gs` - Alert system and notifications
- `quantum-testing.gs` - Testing and diagnostics

#### Configuration File
- `appsscript.json` - OAuth scopes and project configuration

### Step 4: Configure OAuth Scopes

The `appsscript.json` file includes all required OAuth scopes:

- `spreadsheets` - Read/write spreadsheet data
- `script.external_request` - Make external API calls
- `script.scriptapp` - Manage triggers
- `drive` - Access Google Drive files
- `script.send_mail` - Send email notifications
- `userinfo.email` - Get user email

### Step 5: Initialize the System

1. Save all files in Apps Script
2. Refresh your Google Sheet
3. Click **⚙️ CarHawk Ultimate** menu (appears after refresh)
4. Select **⚛️ Quantum Operations** > **🚀 Initialize System**
5. Follow the setup wizard prompts

The initialization will:
- Create all 21 sheet tabs
- Deploy headers for all sheets
- Setup formulas and conditional formatting
- Configure automation triggers
- Generate the dashboard

## 📊 System Architecture

### 21 Google Sheets Tabs

The system creates the following sheets:

**Core Operations (9 sheets)**
1. Master Import - Raw import staging
2. Master Database - Main deal database (57 columns)
3. Verdict - AI analysis results
4. Leads Tracker - Lead management
5. Flip ROI Calculator - Deal calculations
6. Lead Scoring & Risk Assessment - Scoring metrics
7. Parts Needed - Repair parts tracking
8. Post-Sale Tracker - Closed deal tracking
9. Reporting & Charts - Analytics dashboard

**CRM Sheets (8 sheets - NEW)**
10. Appointments - Scheduled appointments (21 columns)
11. Follow Ups - Follow-up sequences (20 columns)
12. Campaign Queue - Marketing campaigns (20 columns)
13. SMS Conversations - SMS logs (20 columns)
14. AI Call Logs - Call transcripts (20 columns)
15. Closed Deals - Post-sale metrics (28 columns)
16. Knowledge Base - Vehicle market data (20 columns)
17. CRM Integration - Export logs (26 columns)

**System Sheets (4 sheets)**
18. Integrations - API configuration
19. Settings - System settings
20. Activity Logs - System logs
21. Reporting & Charts - Dashboard data

### Key Features

#### 🎯 CRM Operations
- Appointment scheduling and management
- Automated follow-up sequences (Hot, Warm, Cold leads)
- Multi-channel campaigns (SMS, Email)
- SMS conversation tracking with sentiment analysis
- AI call log analysis with transcription

#### 🧠 AI Analysis
- Quantum metrics scoring (15+ dimensions)
- Market value estimation
- MAO (Maximum Allowable Offer) calculation
- Repair risk assessment
- Sales velocity prediction
- Competition analysis

#### 🔌 Integrations
- **Browse.AI** - Automated web scraping from Facebook, Craigslist, OfferUp, eBay
- **SMS-iT** - SMS marketing and automation
- **Ohmylead** - Appointment booking system
- **CompanyHub** - Full CRM export
- **Custom APIs** - Extensible API framework

#### 📊 Analytics & Reporting
- Real-time dashboard with KPIs
- Weekly/monthly reports
- Market intelligence and heat maps
- ROI optimization
- Closed deals analysis

#### 🔔 Automation
- Time-based triggers for follow-ups
- Campaign scheduling
- Appointment reminders
- Alert notifications
- Real-time processing mode

## 🔧 Configuration

### Home Location Setup

Update your home coordinates in `quantum-core.gs`:

```javascript
const QUANTUM_CONFIG = {
  HOME_COORDINATES: {lat: 38.6270, lng: -90.1994}, // Update to your location
  HOME_ZIP: '63101', // Update to your ZIP code
  // ... other settings
};
```

### CRM Templates

Customize SMS templates in `quantum-core.gs`:

```javascript
const CRM_CONFIG = {
  SMS_TEMPLATES: {
    initial_hot: 'Your custom message here...',
    // ... other templates
  }
};
```

### Integration Credentials

Configure integration credentials via:
- Menu: **🛠️ Tools & Utilities** > **🔌 Integration Manager**

## 📖 Usage Guide

### Importing Deals

1. **Manual Import**: Use **⚛️ Quantum Operations** > **🔄 Run Quantum Sync**
2. **Browse.AI Import**: Configure Browse.AI to export to a sheet, system auto-imports

### Analyzing Deals

1. **Batch Analysis**: **⚛️ Quantum Operations** > **🧠 Execute AI Analysis**
2. **Single Deal**: **⚛️ Quantum Operations** > **🎯 Analyze Single Deal**

### Managing Leads

1. **View Hot Leads**: **👥 Lead Management** > **🔥 Hot Leads**
2. **Lead Tracker**: **👥 Lead Management** > **🎯 Lead Tracker**
3. **Pipeline View**: **👥 Lead Management** > **💰 Pipeline View**

### CRM Operations

1. **Schedule Appointment**: **🎯 CRM Operations** > **📅 Manage Appointments**
2. **Launch Campaign**: **🎯 CRM Operations** > **🚀 Launch Campaign**
3. **View SMS**: **🎯 CRM Operations** > **💬 SMS Conversations**
4. **Call Logs**: **🎯 CRM Operations** > **📞 AI Call Logs**

### Exporting Data

1. **SMS-iT Export**: **🤝 CRM & Export** > **📱 Export to SMS-iT**
2. **CompanyHub Export**: **🤝 CRM & Export** > **🏢 Export to CompanyHub**

### Reports

1. **Dashboard**: **📊 Analytics & Reports** > **📈 Quantum Dashboard**
2. **Weekly Report**: **📊 Analytics & Reports** > **📑 Weekly Quantum Report**
3. **Closed Deals**: **📊 Analytics & Reports** > **💰 Closed Deals Report**

## 🔍 System Requirements

- Google Account with Google Sheets access
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Recommended: External integrations configured (Browse.AI, SMS-iT, etc.)

## 🆘 Support

### Menu Items

- **❓ Quantum Help** - Built-in help system
- **🔧 System Diagnostics** - Run system health check
- **ℹ️ About CarHawk Ultimate** - Version and info

### Common Issues

**Menu not appearing?**
- Refresh the spreadsheet
- Check that all .gs files are uploaded
- Verify appsscript.json is configured

**Authorization errors?**
- Click any menu item to trigger OAuth authorization
- Grant all requested permissions

**Import not working?**
- Check Browse.AI configuration
- Verify sheet names match QUANTUM_SHEETS configuration
- Check Activity Logs sheet for errors

## 📝 Version Information

- **Version**: QUANTUM-2.0.0
- **Architecture**: Next-Generation AI-Powered Deal Analysis with Complete CRM
- **Performance**: Enterprise-Grade with Predictive Analytics & Marketing Automation

## 🎯 Module Dependencies

```
quantum-core.gs (base)
├── quantum-menu.gs
├── quantum-setup.gs
│   ├── quantum-headers.gs
│   ├── quantum-formulas.gs
│   └── quantum-triggers.gs
├── quantum-import.gs
│   └── quantum-browse-ai.gs
├── quantum-ai.gs
│   └── quantum-calculations.gs
├── quantum-crm-engine.gs
│   ├── quantum-crm-helpers.gs
│   ├── quantum-crm-automation.gs
│   └── quantum-crm-api.gs
├── quantum-sms-it.gs
├── quantum-ohmylead.gs
├── quantum-companyhub.gs
├── quantum-integrations.gs
├── quantum-knowledge-base.gs
├── quantum-alerts.gs
├── quantum-dashboard.gs
├── quantum-reports.gs
├── quantum-menu-handlers.gs
├── quantum-ui-functions.gs
│   ├── quantum-setup-html.gs
│   ├── quantum-processing-html.gs
│   └── quantum-sms-export-html.gs
├── quantum-testing.gs
├── quantum-utilities.gs
└── quantum-fallback.gs
```

## 🚀 Deployment Checklist

- [ ] Create Google Sheets document
- [ ] Upload all 31 .gs files to Apps Script
- [ ] Upload appsscript.json
- [ ] Save all files
- [ ] Refresh spreadsheet
- [ ] Authorize OAuth scopes
- [ ] Run initialization: **🚀 Initialize System**
- [ ] Configure home location in quantum-core.gs
- [ ] Set up integrations (optional)
- [ ] Test import functionality
- [ ] Run first AI analysis

## 📚 Additional Resources

- Source repository: [carhawk-ultimate](https://github.com/steventrust223/carhawk-ultimate)
- Branch: `claude/init-carhawk-latest-lNKKY`
- Source file: `most complete` (monolithic version)
- Modular version: `src/` directory (31 files)

---

**Ready to revolutionize your vehicle flipping business? Start with the initialization wizard!**

🚗⚛️ **CarHawk Ultimate - Quantum CRM for Vehicle Flippers**
