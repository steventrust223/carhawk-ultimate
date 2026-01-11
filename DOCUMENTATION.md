# 🦅 CarHawk Ultimate - Complete Documentation

**Version:** 1.0.0
**Vehicle Intelligence, Flipping & Rental Optimization OS**

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Quick Start Guide](#quick-start-guide)
4. [Module Reference](#module-reference)
5. [Sheet Guide](#sheet-guide)
6. [Configuration](#configuration)
7. [Workflows](#workflows)
8. [API Integration](#api-integration)
9. [Troubleshooting](#troubleshooting)

---

## Overview

CarHawk Ultimate is a comprehensive Google Apps Script platform for vehicle flipping and rental business optimization. It automates the entire deal analysis pipeline from listing ingestion to CRM integration.

### Core Capabilities

- **Multi-Platform Aggregation**: Facebook, Craigslist, OfferUp, eBay Motors
- **Speed-to-Lead Tracking**: Exponential decay scoring with email alerts
- **MAO Calculation**: Industry-standard formulas (65-80% rules)
- **Rental Analysis**: Complete Turo/rental ROI with breakeven calculations
- **Lead Scoring**: Weighted 8-factor scoring algorithm
- **AI Integration**: OpenAI-powered seller messaging and condition analysis
- **CRM Sync**: SMS-iT and CompanyHub integration
- **Automated Verdicts**: 🔥 HOT / ✅ SOLID / 💎 RENTAL GEM classification

---

## System Architecture

### Modular Design

CarHawk Ultimate uses a modular architecture with specialized engines:

```
┌─────────────────────────────────────────────────────┐
│                    Main.gs                          │
│         (Orchestrator & Menu System)                │
└─────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  DataImport.gs │ │ Analysis    │ │ VerdictEngine  │
│  (Staging→DB)  │ │ Engines     │ │ (Rankings)     │
└────────────────┘ └──────┬──────┘ └────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│  MAOEngine.gs  │ │SpeedToLead │ │ RentalEngine   │
│  (Offers)      │ │(Urgency)   │ │ (Turo ROI)     │
└────────────────┘ └─────────────┘ └────────────────┘
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌───────▼────────┐
│LeadScoring.gs  │ │ AIEngine.gs │ │CRMIntegration  │
│(Ranking)       │ │(Messages)   │ │(SMS-iT)        │
└────────────────┘ └─────────────┘ └────────────────┘
```

### File Structure

| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| `Config.gs` | Constants, settings, parameters | ~900 | System configuration |
| `Utils.gs` | Shared utilities, formatting | ~500 | Helper functions |
| `SheetSetup.gs` | Sheet initialization | ~600 | `setupCarHawkUltimate()` |
| `SpeedToLead.gs` | Lead urgency tracking | ~500 | `calculateSpeedToLead()` |
| `RentalEngine.gs` | Turo/rental analysis | ~500 | `calculateRentalAnalysis()` |
| `MAOEngine.gs` | Offer calculation | ~400 | `calculateMAO()` |
| `LeadScoring.gs` | Weighted scoring | ~400 | `calculateLeadScore()` |
| `VerdictEngine.gs` | Final classification | ~400 | `generateVerdict()` |
| `AIEngine.gs` | OpenAI integration | ~300 | `analyzeVehicleWithAI()` |
| `DataImport.gs` | Staging sheet import | ~350 | `importFromStagingSheet()` |
| `CRMIntegration.gs` | CRM sync | ~300 | `syncTopDealsToCRM()` |
| `Main.gs` | Menu & orchestration | ~250 | `onOpen()`, `runCompleteAnalysisPipeline()` |

---

## Quick Start Guide

### 1. Initial Setup (5 minutes)

1. **Open Google Sheets** and create a new spreadsheet
2. **Open Apps Script**: Extensions → Apps Script
3. **Copy all `.gs` files** into the Apps Script editor
4. **Copy `appsscript.json`** (replace existing file)
5. **Save** and close the editor
6. **Reload** the spreadsheet

### 2. System Initialization (1 minute)

1. Click **🦅 CarHawk Ultimate** menu
2. Select **⚙️ Setup System**
3. Confirm the initialization
4. Wait for all sheets to be created (~30 seconds)

### 3. Configuration (3 minutes)

Open the **Config** sheet and set:

- `HOME_ZIP`: Your base location (e.g., "63101")
- `ALERT_EMAIL`: Your email for notifications
- `OPENAI_API_KEY`: (Optional) For AI seller messages
- `SMSIT_API_KEY` + `SMSIT_ENDPOINT`: (Optional) For CRM sync

### 4. Import Data (Ongoing)

**Option A: Manual Entry**
- Open staging sheets (Staging - Facebook, etc.)
- Paste vehicle listings from Browse AI or manual scraping

**Option B: Browse AI Integration** (Recommended)
- Set up Browse AI robots for each platform
- Configure to export directly to Google Sheets
- Link to staging sheets

### 5. Run Analysis

From the **🦅 CarHawk Ultimate** menu:

**Option A: Full Pipeline (Recommended for first run)**
```
Automation → Run Complete Analysis Pipeline
```

**Option B: Step-by-Step**
```
1. Import Data → Import from All Staging Sheets
2. Analysis → Calculate MAO for All
3. Analysis → Update Speed-to-Lead
4. Analysis → Analyze Rental Viability
5. Analysis → Calculate Lead Scores
6. Analysis → Generate Seller Messages
7. Reports & Dashboards → Generate Verdict Sheet
```

### 6. Review Results

Check these sheets in order:

1. **Verdict** → Top opportunities ranked by priority
2. **Speed-to-Lead Dashboard** → Urgent leads (<30 min)
3. **Rental Analysis** → Best Turo candidates

---

## Module Reference

### Config.gs

**Purpose**: Central configuration for all system constants

**Key Constants**:
- `SYSTEM`: Version, name, home coordinates
- `SHEETS`: All sheet definitions with colors/icons
- `MASTER_COLUMNS`: Complete column schema
- `SCORING_WEIGHTS`: Lead scoring algorithm weights
- `SPEED_CONFIG`: Time thresholds and decay parameters
- `RENTAL_CONFIG`: Turo fees, utilization rates, daily rates
- `MAO_CONFIG`: Rule percentages, fixed costs
- `ENTHUSIAST_MARKERS`: Keywords for collector vehicles
- `HAZARD_FLAGS`: Red flag keywords

### SpeedToLead.gs

**Purpose**: Track listing freshness and calculate urgency

**Key Functions**:

```javascript
calculateSpeedToLead(timestamp)
// Returns: { score, status, icon, urgency, minutesAgo, decayMultiplier }
// Urgency levels: IMMEDIATE (🔥), WARM (⚠️), COOLING (⏰), COLD (❄️), DEAD (💀)

calculateLeadScore(minutesAgo)
// Returns: 0-100 score using exponential decay curve
// Formula: MAX_SCORE * (DECAY_RATE ^ hours)

generateSpeedToLeadDashboard()
// Creates urgency-sorted dashboard in Speed-to-Lead sheet
```

**Thresholds**:
- 🔥 **IMMEDIATE**: 0-30 minutes (score: 95-100)
- ⚠️ **WARM**: 30-120 minutes (score: 80-94)
- ⏰ **COOLING**: 2-6 hours (score: 60-79)
- ❄️ **COLD**: 6-24 hours (score: 30-59)
- 💀 **DEAD**: >24 hours (score: 10-29)

### RentalEngine.gs

**Purpose**: Analyze Turo/rental viability and calculate ROI

**Key Functions**:

```javascript
calculateRentalAnalysis(vehicle)
// Returns: {
//   viable, dailyRate, monthlyGross, monthlyNet,
//   annualNet, breakevenMonths, rentalRisk, verdict
// }

checkRentalViability(bodyType, year, condition, mileage)
// Checks: age ≤12 years, condition ≥70, mileage ≤150k

estimateDailyRate(bodyType, year, make, model, isEnthusiast)
// Base rates by body type × age multiplier × luxury multiplier × enthusiast bonus

calculateRentalCosts(monthlyGross, rentalDays)
// Returns: { turoFee, insurance, maintenance, cleaning, total }
```

**Viability Criteria**:
- Vehicle age: ≤12 years (Turo requirement)
- Condition score: ≥70
- Mileage: ≤150,000
- Monthly net: ≥$400
- Breakeven: ≤18 months

**Cost Assumptions**:
- Turo fee: 15% (Premier plan)
- Insurance: $150/month
- Maintenance reserve: 8% of gross
- Cleaning: $30/rental
- Utilization: 65% (moderate)

### MAOEngine.gs

**Purpose**: Calculate Maximum Allowable Offer using proven formulas

**Key Functions**:

```javascript
calculateMAO(vehicle, strategy)
// Formula: (Estimated Resale × Rule %) - Repair Costs - Fixed Costs
// Returns: { mao, offerTarget, profit, profitPercent, breakdown }

estimateResaleValue(vehicle)
// Uses asking price baseline + adjustments for mileage, condition, body type

estimateRepairCosts(vehicle)
// Scans description for repair keywords, adds condition-based baseline
```

**Rule Percentages by Strategy**:
- Quick Flip: 75% rule
- Repair Flip: 65% rule
- Enthusiast: 70% rule
- Rental Hold: 80% rule (higher because held longer)

**Fixed Costs** (per deal):
```
Title Transfer:     $200
Registration:       $150
Inspection:         $100
Detailing:          $150
Photos:             $50
Listing Fees:       $50
Contingency:        $200
──────────────────────
Total:              $900
```

### LeadScoring.gs

**Purpose**: Calculate comprehensive lead scores using weighted factors

**Scoring Weights**:
```
Profit Margin:     30%  (most important)
Speed-to-Lead:     20%  (critical for conversions)
Distance:          10%  (logistics)
Market Demand:     10%  (sellability)
Condition:         10%  (risk factor)
Mileage:           8%   (depreciation)
Title Status:      7%   (legal risk)
Platform:          5%   (source reliability)
Rental Bonus:      +10% (if rental-viable)
```

**Opportunity Grades**:
- A+ (95-100): Exceptional deal
- A (90-94): Excellent opportunity
- B (75-89): Good deal
- C (60-74): Acceptable
- D (50-59): Marginal
- F (<50): Pass

### VerdictEngine.gs

**Purpose**: Generate final classifications and populate Verdict sheet

**Verdict Types**:

| Verdict | Criteria | Action |
|---------|----------|--------|
| 🔥 **HOT** | Score ≥80, no critical flags | Contact immediately |
| 💎 **RENTAL GEM** | Rental viable, net ≥$600/mo | Buy & hold for Turo |
| ✅ **SOLID** | Score 65-79, good margins | Follow up this week |
| 🤔 **MAYBE** | Score 50-64, borderline | Low priority |
| ❌ **PASS** | Score <50 or critical flags | Skip |

**Critical Disqualifiers** (automatic PASS):
- 🚨 Critical hazard flags (flood, no title, stolen)
- Profit < $300
- Distance > 200 miles

### AIEngine.gs

**Purpose**: OpenAI integration for condition analysis and seller messaging

**AI Use Cases** (AI assists decisions, doesn't replace math):
1. ✅ Condition inference from descriptions
2. ✅ Repair risk estimation
3. ✅ Personalized seller messages
4. ✅ Negotiation angle identification
5. ❌ MAO calculation (math-based, not AI)
6. ❌ Speed-to-lead calculation (math-based)
7. ❌ Rental ROI (math-based)

**Key Functions**:

```javascript
analyzeVehicleWithAI(vehicle)
// Calls OpenAI GPT-4 Turbo with vehicle context
// Returns: { aiCondition, sellerMessage, negotiationAngle, aiNotes }

generateSellerMessageTemplate(vehicle)
// Fallback template if AI unavailable
// Platform-specific templates (Facebook, Craigslist, etc.)
```

**Seller Message Guidelines** (enforced in AI prompt):
- 2-3 sentences max
- Mention "cash buyer" (no financing delays)
- Express genuine interest
- Suggest meeting soon
- Don't mention exact offer amount yet
- Friendly and respectful tone

---

## Sheet Guide

### 1. Verdict Sheet

**Purpose**: Top-ranked opportunities - **START HERE**

**Columns**:
- Rank (1, 2, 3...)
- Verdict (🔥 HOT, ✅ SOLID, 💎 RENTAL GEM)
- Vehicle (2018 Honda Civic)
- Asking Price
- Profit $ / %
- Lead Speed Status (🔥, ⚠️, ⏰)
- Distance
- Rental Viable?
- Monthly Net (if rental)
- Flip Strategy
- Offer Target
- Seller Message
- Action

**How to Use**:
1. Sort by Rank (ascending)
2. Focus on 🔥 HOT and 💎 RENTAL GEM first
3. Copy seller message
4. Click listing URL
5. Contact seller immediately (if 🔥)

### 2. Master Database

**Purpose**: Single source of truth for all vehicle data

**Column Groups**:

**Identity** (7 cols): Listing ID, Year, Make, Model, Trim, Body Type, Enthusiast Flag
**Pricing** (6 cols): Asking, Resale, MAO, Offer, Profit $, Profit %
**Condition** (7 cols): Mileage, Condition, AI Condition, Title, Repair Risk, Repair Cost, Hazards
**Market** (5 cols): Platform, Demand Score, Velocity, Advantage, Days-to-Sell
**Location** (4 cols): City, ZIP, Distance, Risk Tier
**Speed** (4 cols): First Seen, Minutes Ago, Speed Score, Cooling Risk
**Strategy** (3 cols): Capital Tier, Flip Strategy, Verdict
**Rental** (6 cols): Viable?, Daily Rate, Monthly Gross, Monthly Net, Breakeven, Risk
**AI** (3 cols): Seller Message, Negotiation Angle, Notes
**CRM** (4 cols): Synced?, Platform, Deal ID, Contacted At
**Meta** (8 cols): URL, Seller Name/Phone/Email, Description, Images, Created, Updated

**Total**: 57 columns

### 3. Speed-to-Lead Dashboard

**Purpose**: Urgent leads requiring immediate action

**Use Case**: Check every 30-60 minutes for new 🔥 IMMEDIATE leads

**Sorted by**: Speed Score (descending) → Profit (descending)

**Action Priority**:
- 🚨 **CRITICAL**: Contact within 10 minutes
- ⚡ **HIGH**: Contact today
- 📍 **MEDIUM**: Contact this week
- 📋 **LOW**: Follow up when convenient

### 4. Rental Analysis

**Purpose**: Best Turo/rental opportunities

**Key Metrics**:
- Estimated Daily Rate
- Monthly Gross (at 65% utilization)
- Monthly Net (after all costs)
- Annual Net
- Break-Even Months
- Rental Risk (🟢 Low, 🟡 Medium, 🔴 High)

**Viability Verdict**:
- 💎 **RENTAL GEM**: Net ≥$800/mo
- ✅ **SOLID RENTAL**: Net $600-799/mo
- 🤔 **MARGINAL**: Net $400-599/mo
- ❌ **NOT VIABLE**: Net <$400/mo

### 5. Staging Sheets (Read-Only)

**Purpose**: Raw import data from Browse AI

**Sheets**:
- Staging - Facebook
- Staging - Craigslist
- Staging - OfferUp
- Staging - eBay

**Structure**:
| Import Timestamp | Title | Price | Location | Seller | Posted | Description | URL | Images | Contact | Processed? |

**Do not manually edit** - these are auto-populated by Browse AI

### 6. Config Sheet

**Purpose**: System settings and API keys

**Key Settings**:

| Setting | Default | Description |
|---------|---------|-------------|
| `OPENAI_API_KEY` | (empty) | OpenAI API key for AI analysis |
| `HOME_ZIP` | 63101 | Your base location ZIP |
| `ALERT_EMAIL` | (auto) | Email for hot deal alerts |
| `SMSIT_API_KEY` | (empty) | SMS-iT CRM API key |
| `SMSIT_ENDPOINT` | (empty) | SMS-iT API endpoint URL |
| `AUTO_IMPORT_ENABLED` | FALSE | Auto-import from staging |
| `EMAIL_ALERTS_ENABLED` | TRUE | Send speed-to-lead alerts |
| `MIN_PROFIT_ALERT` | 2000 | Min profit for email alert |
| `SPEED_ALERT_THRESHOLD` | 30 | Alert if posted <X minutes |
| `RENTAL_UTILIZATION` | 0.65 | Assumed utilization rate |
| `TURO_FEE_RATE` | 0.15 | Turo fee (15% Premier) |

### 7. System Logs

**Purpose**: Audit trail and debugging

**Columns**: Timestamp | Action | Details | User

**Common Actions**:
- `SYSTEM_INIT`: System initialized
- `DATA_IMPORT`: New listings imported
- `MAO_CALCULATION_UPDATE`: MAO calculations updated
- `SPEED_TO_LEAD_UPDATE`: Speed-to-lead updated
- `VERDICT_SHEET_GENERATED`: Verdict sheet created
- `CRM_SYNC`: Deals synced to CRM
- `ERROR`: System error occurred

---

## Workflows

### Workflow 1: Daily Deal Review (10 minutes)

```
1. Open Verdict sheet
2. Sort by Rank
3. Review top 10 HOT deals
4. Check Speed-to-Lead Dashboard for new listings
5. Contact sellers for 🔥 IMMEDIATE leads
6. Update CRM status for contacted leads
```

### Workflow 2: Weekly Batch Import (30 minutes)

```
1. CarHawk Menu → Import Data → Import from All Staging Sheets
2. Wait for import to complete
3. CarHawk Menu → Automation → Run Complete Analysis Pipeline
4. Review Verdict sheet
5. Review Rental Analysis for portfolio holds
6. CRM Integration → Sync Top Deals to CRM
```

### Workflow 3: New Listing Alert Response (<5 minutes)

**Triggered by**: Email alert for 🔥 IMMEDIATE lead

```
1. Open email alert
2. Click listing URL
3. Copy seller message from Verdict sheet
4. Contact seller via phone/SMS/platform
5. Note response in CRM Integration sheet
```

### Workflow 4: Rental Portfolio Building (Monthly)

```
1. Open Rental Analysis sheet
2. Filter for 💎 RENTAL GEM verdicts
3. Check Break-Even Months (<12 preferred)
4. Review Rental Risk (prefer 🟢 Low)
5. Calculate capital allocation
6. Prioritize by Monthly Net (descending)
7. Acquire top 2-3 vehicles for Turo fleet
```

---

## API Integration

### OpenAI (GPT-4 Turbo)

**Purpose**: AI-powered seller messages and condition analysis

**Setup**:
1. Create OpenAI account at platform.openai.com
2. Generate API key
3. Add to Config sheet: `OPENAI_API_KEY`

**Cost**: ~$0.01-0.02 per analysis (very affordable)

**Usage**:
```
CarHawk Menu → Analysis → Run AI Analysis (Top 10)
```

**Rate Limits**: 1 second delay between requests (built-in)

### Google Maps API

**Purpose**: Accurate distance calculations

**Setup**:
1. Already enabled in `appsscript.json`
2. Enable in Google Cloud Console if needed
3. No API key required (uses project quota)

**Free Tier**: 40,000 requests/month

### SMS-iT CRM

**Purpose**: Push hot leads for automated follow-up

**Setup**:
1. Create SMS-iT account
2. Get API credentials
3. Add to Config sheet:
   - `SMSIT_API_KEY`
   - `SMSIT_ENDPOINT`

**Sync Rules** (configurable):
- Only 🔥 HOT and 💎 RENTAL GEM deals
- Minimum lead score: 70
- Not already synced

**Usage**:
```
CarHawk Menu → CRM Integration → Sync Top Deals to CRM
```

### Browse AI (Recommended)

**Purpose**: Automated listing scraping from all platforms

**Setup**:
1. Create Browse AI account
2. Create robots for:
   - Facebook Marketplace (vehicle category, your region)
   - Craigslist (cars+trucks section)
   - OfferUp (auto section)
   - eBay Motors (local pickups)
3. Configure output to Google Sheets
4. Link to staging sheets
5. Schedule: Every 2-4 hours

**Cost**: ~$50-100/month for multiple robots

---

## Troubleshooting

### Issue: "Script timeout" error during analysis

**Cause**: Too many records to process in 6 minutes

**Solutions**:
1. Process in batches (100-200 records at a time)
2. Run individual analysis steps instead of complete pipeline
3. Use filtering to focus on recent listings only

### Issue: Distance calculations showing 0

**Cause**: Google Maps API not enabled or ZIP codes invalid

**Solutions**:
1. Enable Maps API in Google Cloud Console
2. Check ZIP codes in staging data are 5 digits
3. Verify HOME_ZIP is set in Config

### Issue: AI analysis not working

**Cause**: Invalid API key or rate limit exceeded

**Solutions**:
1. Verify OPENAI_API_KEY in Config sheet
2. Check OpenAI account has credits
3. Use template messages instead: `Generate Seller Messages`

### Issue: Speed-to-Lead alerts not sending

**Cause**: Trigger not configured or email disabled

**Solutions**:
1. Run: `Automation → Setup Speed-to-Lead Alerts`
2. Check Config: `EMAIL_ALERTS_ENABLED = TRUE`
3. Verify ALERT_EMAIL is correct

### Issue: CRM sync failing

**Cause**: Invalid credentials or endpoint

**Solutions**:
1. Test connection: `CRM Integration → Test CRM Connection`
2. Verify SMSIT_API_KEY and SMSIT_ENDPOINT
3. Check CRM account is active

### Issue: Rental analysis showing "Not Viable" for all vehicles

**Cause**: Viability thresholds too strict or missing data

**Solutions**:
1. Check vehicles meet criteria: age ≤12 years, condition ≥70, mileage ≤150k
2. Adjust thresholds in Config.gs if needed
3. Ensure condition and mileage data is imported correctly

---

## Advanced Topics

### Custom Scoring Weights

Edit `SCORING_WEIGHTS` in `Config.gs`:

```javascript
const SCORING_WEIGHTS = {
  PROFIT_MARGIN: 0.40,      // Increase if profit is most important
  SPEED_TO_LEAD: 0.10,      // Decrease if speed less critical
  DISTANCE: 0.15,           // Increase if local deals preferred
  // ... adjust others to total 1.0 (excluding rental bonus)
};
```

### Custom Rental Rates

Edit `RENTAL_CONFIG.DAILY_RATES` in `Config.gs`:

```javascript
DAILY_RATES: {
  'SUV': 75,              // Increase if local SUV demand is high
  'Luxury Sedan': 120,    // Adjust for local market
  'Sports Car': 200,      // Premium for performance vehicles
  // ...
}
```

### Webhook Integration (Advanced)

Add a `doPost()` function to receive webhooks from Browse AI:

```javascript
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  // Process webhook data
  // Auto-import new listings
  importFromAllStagingSheets();
  runCompleteAnalysisPipeline();
}
```

---

## Appendix

### System Specifications

- **Language**: Google Apps Script (JavaScript ES6+)
- **Runtime**: V8
- **Execution Limit**: 6 minutes per run
- **Storage**: Google Sheets (2M cells)
- **API Calls**: UrlFetchApp for external APIs

### Dependencies

- Google Sheets API (built-in)
- Google Maps API v3 (distance calculations)
- UrlFetchApp (HTTP requests)
- MailApp (email alerts)

### Performance

- **Import**: ~100 listings/minute
- **Analysis**: ~200 vehicles/minute
- **AI Analysis**: 1 vehicle/second (rate limited)
- **CRM Sync**: 2 deals/second (rate limited)

### Security

- API keys stored in Config sheet (user-level access)
- OAuth scopes limited to necessary permissions
- No external data storage (all in Google Sheets)
- Audit trail in System Logs

---

**Built with Claude (Opus-level) AI assistance**
**CarHawk Ultimate v1.0.0 - © 2025**
