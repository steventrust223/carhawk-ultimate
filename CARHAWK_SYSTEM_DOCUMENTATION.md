# CarHawk Ultimate — Complete System Documentation

**Document purpose:** Comprehensive reference covering every feature, module, data flow, and planned capability across all software in the CarHawk Ultimate workflow.

**System version:** QUANTUM-2.0.0
**Application name:** CarHawk Ultimate CRM
**Last updated:** August 2026

---

## 1. Executive Summary

CarHawk Ultimate is an automated vehicle-and-asset arbitrage system. It discovers underpriced listings on online marketplaces, scrapes their full details, scores them for profit potential, and manages seller outreach through to a closed deal.

The system answers one question repeatedly and at scale: **"Is this listing worth buying, and how much should I pay?"**

It operates across three asset categories:
1. **Automotive** — cars, trucks, SUVs, vans
2. **Powersports** — ATVs, motorcycles, UTVs, tractors
3. **E-Bikes** — electric bicycles and scooters

Beyond flipping, the system supports a **Turo rental-fleet strategy** (buy-and-hold vehicles for car sharing) and a **project-arbitrage module** for matching sourced parts and materials to active projects.

---

## 2. Software Stack

The workflow spans five distinct pieces of software. Each has a specific role.

### 2.1 Browse.AI — Data Acquisition Layer
A no-code web-scraping service. Robots are trained by clicking elements on a web page; Browse.AI then replays those selections on a schedule.

- **Role:** Extracts raw listing data from marketplaces
- **Output:** Writes to a Google Sheet, or pushes via API/webhook
- **Key features used:** Robot Studio, Workflows (deep scraping), Google Sheets integration, REST API v2
- **Account structure:** One workspace containing multiple robots

### 2.2 Google Sheets — Data Store & Interface
The system of record. Every piece of data lives in a spreadsheet tab.

- **Workbook name:** CarHawk Ultimate – Quantum CRM
- **Role:** Database, dashboard, and user interface
- **Tab count:** 21 core tabs, plus 5 Turo tabs and 5 PAM tabs

### 2.3 Google Apps Script — Application Logic
JavaScript running on Google's servers, bound to the spreadsheet.

- **Role:** All business logic — parsing, scoring, valuation, CRM, integrations
- **File count:** ~50 `.gs` logic files and ~18 `.html` interface files
- **Entry point:** `onOpen()` builds the custom CarHawk menu

### 2.4 clasp — Deployment Tool
Google's command-line tool for Apps Script. Runs on the operator's local machine.

- **Role:** Pushes code from the Git repository into the live Apps Script project
- **Command:** `clasp push`

### 2.5 GitHub — Version Control
- **Repository:** `steventrust223/carhawk-ultimate`
- **Role:** Source of truth for all code; enables review and rollback

### 2.6 Third-Party Integrations (Optional)
- **OpenAI API** — narrative deal analysis and seller message generation
- **SMS-iT** — SMS messaging platform
- **OhMyLead** — appointment booking and lead sync
- **CompanyHub** — external CRM (CSV export)
- **Twilio / SendGrid** — telephony and email delivery

---

## 3. End-to-End Data Pipeline

This is the core flow. Understanding it explains most of the system.

```
STEP 1  Marketplace search page (e.g. Facebook Marketplace vehicles)
           |
STEP 2  LIST ROBOT (Browse.AI)
        Scrapes the results grid. Captures each listing's URL,
        plus basic card data (title, price, location).
           |
STEP 3  BROWSE.AI WORKFLOW
        Passes each captured URL into the detail robot as its Origin URL.
           |
STEP 4  DETAIL ROBOT (Browse.AI)
        Visits each individual listing page. Captures full data:
        description, mileage, condition, seller, transmission, colour.
           |
STEP 5  GOOGLE SHEETS EXPORT
        Browse.AI writes detail-robot results into a standalone
        export spreadsheet (separate file from the CarHawk workbook).
           |
STEP 6  CARHAWK IMPORT  (menu: Import from Sheets)
        Reads the export sheet, maps columns to CarHawk's schema,
        de-duplicates by URL, and writes rows into Master Import.
           |
STEP 7  QUANTUM SYNC  (menu: Run Quantum Sync)
        Parses raw text into structured fields (year/make/model/mileage),
        calculates valuation and profit metrics, writes to Master Database.
           |
STEP 8  AI ANALYSIS  (optional, requires OpenAI key)
        Generates verdict, flip strategy, and seller outreach message.
           |
STEP 9  CRM & OUTREACH
        Seller contact, appointments, follow-ups, closed-deal tracking.
```

### 3.1 Why Two Robots Are Required

A search results page shows only a card — title, price, thumbnail. It does not show mileage, description, seller name, or condition. Those live on the individual listing page.

Therefore:
- **One robot cannot do both jobs.** It scrapes either a list or a single page.
- The **List robot** harvests URLs.
- The **Detail robot** visits each URL.
- A **Workflow** connects them, mapping the list robot's `url` field to the detail robot's Origin URL.

**Critical constraint:** Facebook Marketplace *vehicle* pages have an "About this vehicle" panel. Facebook *merchandise* pages (used for e-bikes) do not. The two page layouts differ, so **e-bikes require their own separate robot pair.** A vehicle detail robot will not work on an e-bike listing.

### 3.2 Two Connection Methods

| Method | How it works | Requires | Best for |
|---|---|---|---|
| **Google Sheets export** | Browse.AI writes to a sheet; CarHawk reads it | Nothing extra | Getting running quickly |
| **API + Webhook** | Browse.AI pushes to a CarHawk web app on completion | API key, deployed web app | Full automation at volume |

Both are implemented. The Sheets method is the recommended starting point because it requires no web-app deployment.

### 3.3 Two Chaining Methods

| Method | Orchestrator | When to use |
|---|---|---|
| **Browse.AI Workflows** (native) | Browse.AI | Default. Simpler. Link only the DETAIL robot in CarHawk. |
| **API-orchestrated chain** | CarHawk | When CarHawk should drive the handoff itself. Uses "Link Robot Chain". |

**Use one or the other, never both.** Running both causes the detail robot to fire twice.

---

## 4. Browse.AI Layer — Detailed

### 4.1 Robot Types
- **List robot** — "Extract data from a list of elements on a page"
- **Detail robot** — single-page extraction

### 4.2 Field Naming Convention
Field names must match exactly (lowercase) for CarHawk's importer to map them automatically.

**Required fields (drive scoring):**
| Field name | Source on page |
|---|---|
| `title` | Vehicle/item title |
| `price` | Asking price |
| `mileage` | "Driven X miles" |
| `location` | City, State |
| `description` | Seller's description (expand "See more") |
| `posted` | "Listed X ago" |

**High-value additional fields:**
| Field name | Source | Why it matters |
|---|---|---|
| `seller` | Seller name | Contact + dealer/private detection |
| `seller_rating` | Rating count, e.g. "(21)" | Strongest dealer signal available |
| `seller_joined` | "Joined Facebook in 2009" | Account-age trust signal |
| `condition` | "Excellent condition" | Swings valuation ±15–35% |
| `title_status` | "Clean title" | Salvage detection |
| `color` | "Exterior color: White" | Descriptive |
| `transmission` | "Automatic transmission" | Descriptive |

**Do not capture:** the listing URL on a detail robot. In a Workflow, Browse.AI supplies it automatically as **Origin URL**.

**Not available on Facebook:** VIN. Facebook does not publish VINs on Marketplace listings.

### 4.3 Registered Platforms (14 total)

**Automotive (6):** Facebook Marketplace, Craigslist, OfferUp, eBay Motors, AutoTrader, Cars.com

**Powersports (4):** ATV Trader, Cycle Trader, Tractor House, Powersports Listings

**E-Bikes (4):** Facebook E-Bikes, Craigslist E-Bikes, OfferUp E-Bikes, eBay E-Bikes

Each platform registry entry defines:
- `urlPatterns` — regex to identify the platform from a URL
- `searchConfig` — default price/year/radius filters, refresh interval
- `columnMap` — accepted header-name variants for each field
- `sellerDetection` — dealer vs private keyword lists
- `listingIdPattern` — regex to extract a unique listing ID
- `trainingGuide` — step-by-step robot training instructions, surfaced in-app

### 4.4 Robot Retraining
To add or change captured fields on an existing robot:
`Robot → Settings tab → Re-train robot → Robot Studio`

Retraining **preserves** run history, schedules, and workflow links. Only the capture configuration changes. After adding fields, the Google Sheets integration mapping must be updated or the new fields never reach the sheet.

---

## 5. Google Sheets Workbook — All Tabs

### 5.1 Core Pipeline Tabs

| Tab | Purpose |
|---|---|
| **Master Import** | Landing zone for raw scraped rows. 19 columns. Staging only. |
| **Master Database** | The deal ledger. 66 columns. Every parsed, scored deal. |
| **Verdict** | AI-generated verdicts and reasoning per deal |
| **Leads Tracker** | Deals being actively worked as leads |
| **Flip ROI Calculator** | Manual ROI modelling |
| **Lead Scoring & Risk Assessment** | Scoring breakdown and risk factors |
| **Parts Needed** | Parts required per vehicle |
| **Post-Sale Tracker** | Performance after a sale completes |
| **Closed Deals** | Completed transactions |

### 5.2 CRM Tabs

| Tab | Purpose |
|---|---|
| **CRM Integration** | External CRM sync state |
| **Appointments** | Scheduled seller meetings and viewings |
| **Follow Ups** | Follow-up queue and cadence |
| **Campaign Queue** | Outbound messaging campaigns |
| **SMS Conversations** | SMS message threads with sellers |
| **AI Call Logs** | Call records and transcripts |

### 5.3 System Tabs

| Tab | Purpose |
|---|---|
| **Settings** | Configuration key/value store |
| **Activity Logs** | System event and error log — first place to check when debugging |
| **Integrations** | Registered third-party connections, including Browse.AI robots |
| **Knowledge Base** | Vehicle-specific market knowledge that overrides estimates |
| **Reporting & Charts** | Generated reports and visualisations |

### 5.4 Turo Module Tabs

| Tab | Purpose |
|---|---|
| **Turo Engine** | Rental-yield analysis per candidate vehicle |
| **Fleet Manager** | Active rental fleet inventory |
| **Maintenance & Turnovers** | Service schedule and turnover records |
| **Turo Pricing & Seasonality** | Daily-rate modelling by season |
| **Insurance & Compliance** | Coverage tracking and compliance alerts |

### 5.5 PAM Module Tabs

| Tab | Purpose |
|---|---|
| **PAM_Projects** | Active projects with material requirements |
| **PAM_Needs** | Specific items each project needs |
| **PAM_Matches** | Listings matched to project needs |
| **PAM_Purchases** | Purchase decisions and records |
| **PAM_Dashboard** | PAM command centre |

**Important architectural note:** The raw tabs are the *database layer*, not the intended interface. Users interact through the custom **CarHawk Ultimate** menu and its HTML panels. Editing raw tabs by hand risks schema corruption.

---

## 6. Master Import Schema (19 Columns)

| # | Column | Source |
|---|---|---|
| 1 | Import ID | Generated (`IMP-…`) |
| 2 | Date (GMT) | Import timestamp |
| 3 | Job Link | Browse.AI dashboard task link |
| 4 | Origin URL | The listing URL — **the unique key** |
| 5 | Platform | Detected marketplace |
| 6 | Raw Title | Scraped |
| 7 | Raw Price | Scraped |
| 8 | Raw Location | Scraped |
| 9 | Raw Description | Scraped + structured tags appended |
| 10 | Seller Info | Scraped + seller type appended |
| 11 | Posted Date | Scraped |
| 12 | Images Count | Scraped |
| 13 | Raw Mileage | Scraped |
| 14 | Raw Year | Scraped |
| 15 | Raw Condition | Scraped |
| 16 | Import Status | Pending / Processed |
| 17 | Processed | Boolean flag |
| 18 | Master ID | Resulting Deal ID |
| 19 | Error Log | Import errors |

**Origin URL is mandatory.** Rows without a resolvable URL are skipped, because URL is the de-duplication key. The importer resolves it in this order: trained `url` field → `Origin URL` column → any http value in the row (excluding Browse.AI dashboard links).

---

## 7. Master Database Schema (66 Columns)

Grouped by function:

**Identity (1–5):** Deal ID, Import Date, Platform, Status, Priority

**Vehicle (6–13):** Year, Make, Model, Trim, VIN, Mileage, Color, Title

**Commercial (14–16):** Price, Location, ZIP

**Location analysis (17–19):** Distance (mi), Location Risk, Location Flag

**Condition (20–24):** Condition, Condition Score, Repair Keywords, Repair Risk Score, Est. Repair Cost

**Valuation (25–29):** Market Value, MAO, Profit Margin, ROI %, Capital Tier

**Strategy (30–33):** Flip Strategy, Sales Velocity Score, Market Advantage, Days Listed

**Seller (34–37):** Seller Name, Seller Phone, Seller Email, Seller Type

**Assessment (38–45):** Deal Flag, Hot Seller?, Multiple Vehicles?, Seller Message, AI Confidence, Verdict, Verdict Icon, Recommended?

**Engagement (46–51):** Image Score, Engagement Score, Competition Level, Last Updated, spare, spare

**CRM (52–61):** Stage, Contact Count, Last Contact, Next Action, Response Rate, SMS Count, Call Count, Email Count, Meeting Scheduled, Follow-up Status

**Turo extension (62–66):** Turo Hold Score, Turo Monthly Net, Turo Payback Months, Turo Risk Tier, Turo Status, Fleet ID

---

## 8. The Scoring & Valuation Engine

This is the analytical core. Every number below feeds the final deal ranking.

### 8.1 Market Value Estimation — Vehicles

Vehicles are classified into **segments**, each with its own new-price baseline, annual value-retention rate, and floor.

| Segment | New price | Retention/yr | Floor |
|---|---|---|---|
| Performance | $48,000 | 0.95 | $5,000 |
| Heavy truck | $58,000 | 0.91 | $4,000 |
| Light truck | $44,000 | 0.90 | $2,500 |
| Large SUV | $46,000 | 0.88 | $2,200 |
| Small SUV | $34,000 | 0.88 | $1,800 |
| Minivan | $38,000 | 0.87 | $1,400 |
| Luxury | $58,000 | 0.83 | $2,200 |
| Powersports | $11,000 | 0.86 | $800 |
| Economy | $24,000 | 0.89 | $900 |

Reliable makes (Toyota, Honda, Lexus, Subaru, Acura) receive +0.025 retention.

**Formula:**
```
value = segmentBase × (retention ^ age)
        × mileageFactor
        × conditionMultiplier
```

**Mileage factor** combines two readings:
- *Relative* — odometer versus typical use for the vehicle's age (expected = age × 12,000, floored at 15,000)
- *Absolute* — beyond ~150k miles a vehicle loses value regardless of age

| Relative ratio | Factor | | Absolute miles | Factor |
|---|---|---|---|---|
| < 0.25 | 1.35 | | > 250,000 | 0.60 |
| < 0.5 | 1.20 | | > 200,000 | 0.70 |
| < 0.8 | 1.08 | | > 150,000 | 0.82 |
| 0.8–1.2 | 1.00 | | > 120,000 | 0.90 |
| < 1.6 | 0.94 | | | |
| < 2.2 | 0.88 | | | |
| ≥ 2.2 | 0.80 | | | |

**Implausible-odometer guard:** on a vehicle 10+ years old averaging under 1,000 miles/year, the low-mileage bonus is capped at 1.10. Rolled-over and mistyped odometers are common. The threshold is deliberately low — genuine collector cars do cover 1,000–2,000 miles a year and must not be penalised.

**Condition multipliers:** Excellent 1.15 · Very Good 1.08 · Like new 1.12 · Good 1.00 · Fair 0.85 · Poor 0.62 · Salvage 0.40

**Accuracy:** Measured against 11 real listings, mean absolute error is **8%** (previously 28% under an age-only model).

### 8.2 Market Value Estimation — E-Bikes

E-bikes use an entirely separate model. A used e-bike is worth $150–$5,000; running one through vehicle curves overvalues it by roughly an order of magnitude.

| Tier | Example brands | New price | Retention | Floor |
|---|---|---|---|---|
| Premium | Specialized, Trek, Riese & Müller, Gazelle | $6,500 | 0.83 | $700 |
| Mid | Aventon, Super73, Ride1Up, Velotric, Juiced | $2,200 | 0.82 | $350 |
| Value | Rad Power, Lectric, Himiway, Heybike | $1,400 | 0.82 | $250 |
| Budget | Ancheer, Gotrax, Swagtron, Jetson, Razor | $800 | 0.75 | $120 |

**Differences from vehicles:**
- **Battery language is read directly.** "New battery" → ×1.20. "Battery is dead" / "needs battery" → ×0.45. This is the single largest value driver.
- **Mileage rarely stated** and matters far less. Gentle penalties only (>5,000 mi → 0.78); never a low-mileage bonus.
- **Year often absent.** When missing, a 3-year-old example is assumed.
- **Detection is conservative** — an explicit e-bike phrase, or a known brand plus a bike word. This prevents "electric windows" on a truck from misclassifying it.

### 8.3 Distance & Location Risk

Marketplace listings supply "City, ST" and rarely a ZIP code. The system geocodes the city name to coordinates and measures **great-circle (haversine) distance** from a configured home base (default: St. Louis, 38.6270 / −90.1994).

- Coverage: full St. Louis trading area plus outstate Missouri/Illinois; state centroids as a coarse fallback
- **Unresolvable location returns `null`, not a large number.** It is reported as "Unknown ⚪", never as worst-case.

| Distance | Risk | Flag |
|---|---|---|
| < 25 mi | Low | 🟢 |
| 25–75 mi | Moderate | 🟡 |
| > 75 mi | High | 🔴 |
| Unknown | Unknown | ⚪ |

### 8.4 Profit, MAO, and ROI

```
holdingCost  = clamp(marketValue × 5%, $50, $500)
profit       = marketValue − price − repairCost − holdingCost
profitMargin = profit / marketValue × 100
ROI %        = profit / (price + repairCost + holdingCost) × 100

MAO = (marketValue × 0.75) − repairCost − holdingCost − (marketValue × 15%)
```

**MAO** (Maximum Allowable Offer) is the ceiling price that still preserves a 15% profit target.

Holding cost scales with item value. A flat $500 is correct for a car but consumes 40% of the margin on a $1,200 e-bike.

### 8.5 Repair Risk Detection

Descriptions are scanned for known repair keywords, each carrying a severity and estimated cost:

| Keyword | Severity | Est. cost |
|---|---|---|
| needs motor | CRITICAL | $4,000 |
| transmission | HIGH | $3,000 |
| engine knock | HIGH | $2,500 |
| blown head | HIGH | $1,500 |
| no reverse | MEDIUM | $2,000 |
| overheating | MEDIUM | $800 |
| ac broken | LOW | $500 |
| minor dents | LOW | $300 |

Severity scores (CRITICAL 40 / HIGH 30 / MEDIUM 20 / LOW 10) accumulate into a Repair Risk Score capped at 100.

### 8.6 Capital Tiers

| Tier | Price range | Label |
|---|---|---|
| Micro | $0 – $1,000 | Micro Flip 🔸 |
| Budget | $1,000 – $4,000 | Budget Flip 💵 |
| Standard | $4,000 – $10,000 | Standard Flip 💰 |
| Dealer | $10,000+ | Dealer Flip 🏦 |

### 8.7 Priority Score

```
score = ROI × 0.30
      + profitMargin × 0.20
      + salesVelocity × 0.20
      + marketAdvantage × 0.15
      + (100 − repairRiskScore) × 0.15
```
`> 70` → High · `> 40` → Medium · otherwise Low

### 8.8 Data Quality Gate

**This is a safety mechanism, not a scoring input.**

Missing fields default to zero, and zero is not neutral: a price of 0 produces a fake profit equal to the entire market value, and the *worst* listings rank *highest*.

When price, mileage, or year is missing, the deal is:
- Assigned **Priority: "Needs Review"**
- Given zeroed profit and ROI
- Flagged in the **Deal Flag** column with the specific missing field

**Exemptions:** powersports listings measured in hours; e-bike listings (which routinely omit both mileage and year).

### 8.9 Seller Type Detection

Each platform defines dealer and private keyword lists, matched against seller info and description.

- Dealer signals: "dealership", "auto sales", "financing available", "buy here pay here", "we finance"
- Private signals: "private seller", "selling my", "one owner", "cash only"

**Planned enhancement:** seller rating count and account-join year are far stronger signals than description keywords. A seller with 21 ratings is almost certainly a dealer. Awaiting robot capture of `seller_rating` and `seller_joined`.

---

## 9. Feature Catalog by Menu

### ⚛️ Quantum Operations
| Feature | Function |
|---|---|
| Initialize System | Creates all tabs, headers, and formatting |
| Run Quantum Sync | Processes Master Import → Master Database |
| Execute AI Analysis | Batch OpenAI analysis on scored deals |
| Real-time Mode | Toggles continuous monitoring |
| Analyze Single Deal | Deep analysis of one selected row |
| Deep Market Scan | Broad market sweep |

### 🎯 CRM Operations
Appointment manager · Follow-up centre · Campaign manager · SMS conversations · AI call logs · Campaign launcher · CRM analytics

### 🤝 CRM & Export
Export to SMS-iT · Export to CompanyHub (CSV to Drive) · Sync OhMyLead appointments · Generate campaigns · Sync CRM status · Export analytics

### 👥 Lead Management
Lead tracker · Lead scoring · Hot leads · Cold leads · Speed to Lead · Pipeline view

### 🔔 Alerts & Automation
Alert queue · Alert digest email · Trigger configuration · Automation status · Schedule manager · Follow-up sequences

### 📊 Analytics & Reports
Quantum dashboard · Performance matrix · Market intelligence · Weekly report · Monthly deep dive · ROI optimiser · Closed deals report

### 🤖 Browse.ai Robots
| Feature | Purpose |
|---|---|
| Set API Key | Stores Browse.AI key in Script Properties |
| View My Robots | Lists robots from the API |
| Link Robot to Marketplace | Connects one robot to a platform |
| Register Robot (Sheet-based) | Registers an export sheet by Sheet ID |
| Robot Setup Guide | Full training instructions per platform |
| Link Robot Chain | Connects a List + Detail robot pair |
| Register Chain Webhooks | Registers webhooks on both robots |
| Deploy Robot Chain | Runs the list robot; webhook drives the rest |
| Process Chains (no webhook) | Polling fallback |
| Deploy Robot | Generates search URLs and bulk-runs |
| Fetch & Import Data | Pulls completed tasks via API |
| Import from Sheets | Reads the Browse.AI export sheet |
| Robot Status | Shows all robots and sync state |
| Reset Imports | Clears Master Import and URL cache for a clean re-import |

### 🛠️ Tools & Utilities
VIN decoder · Deal Calculator Pro · Market heat map · Knowledge base · System diagnostics · Settings · Integration Manager

### 🚗 Turo Module
Analyze selected deal for Turo · Batch analyze candidates · Refresh fleet dashboard · Add vehicle to fleet · Update fleet financials · Log maintenance event · Check compliance alerts · Setup module

### ⚡ PAM Module (separate menu)
Open command centre · Run logic engine · Run AI evaluation · Full cycle · Initialize sheets

### Standalone
Deal Gallery (visual card view) · Quick Actions (sidebar) · Deal Analyzer · Quantum Help · About

---

## 10. Turo Module — Buy-and-Hold Strategy

Evaluates whether a vehicle is better **rented on Turo** than flipped.

- **Turo Engine** — models rental yield: daily rate, occupancy, monthly net, payback period
- **Fleet Manager** — active fleet inventory and status
- **Maintenance & Turnovers** — service scheduling and turnover logging
- **Pricing & Seasonality** — seasonal daily-rate adjustment
- **Insurance & Compliance** — coverage tracking and alerting

Outputs written back to Master Database: Turo Hold Score, Turo Monthly Net, Turo Payback Months, Turo Risk Tier, Turo Status, Fleet ID.

When a deal's Flip Strategy resolves to "Turo Hold", these fields are included in CRM exports.

---

## 11. PAM — Project Arbitrage Module

A two-layer matching engine that connects sourced listings to active project requirements.

**Layer 1 — Logic Engine** (keyword/rule matching), weighted:
| Factor | Default weight |
|---|---|
| Keyword | 40 |
| Category | 20 |
| Price | 20 |
| Brand | 10 |
| Distance | 5 |
| Condition | 5 |

Default search radius: 30 miles.

**Layer 2 — AI Engine** — evaluates Layer 1 candidates for genuine fit.

**Flow:** Projects → Needs → (Logic Engine) → Matches → (AI Engine) → Purchases

---

## 12. Integrations

### 12.1 Integration Manager
An HTML panel showing live status and providing configuration:
- Browse.AI — registered robots, last sync, register new sheet-based robot, import now, save API key
- OhMyLead — save webhook URL, sync appointments
- SMS-iT — save API key
- CompanyHub — CSV export (menu-driven, requires confirmation)

Secrets are write-only — never displayed back to the panel. Only whitelisted keys can be written.

### 12.2 Configuration Keys

| Key | Purpose |
|---|---|
| `BROWSE_AI_API_KEY` | Browse.AI API (Script Properties) |
| `OPENAI_API_KEY` | AI analysis layer |
| `SMSIT_API_KEY`, `SMSIT_WEBHOOK_URL` | SMS platform |
| `OHMYLEAD_WEBHOOK_URL` | Appointment sync |
| `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE` | Telephony |
| `SENDGRID_API_KEY` | Email delivery |
| `HOME_ZIP`, `HOME_LAT`, `HOME_LNG` | Distance calculation origin |
| `PROFIT_TARGET` | Minimum profit threshold |
| `ANALYSIS_DEPTH` | BASIC / ADVANCED / QUANTUM |
| `ALERT_EMAIL`, `NOTIFICATION_EMAIL`, `OPERATOR_EMAIL` | Notification routing |
| `ALERTS_ENABLED`, `REALTIME_MODE`, `AUTO_FOLLOW_UP`, `CRM_SYNC_ENABLED` | Feature toggles |

### 12.3 What Requires an OpenAI Key

**Blocked without it:** Verdict, Verdict Icon, **Recommended?**, Flip Strategy, Deal Flag (AI portion), Seller Message, AI Confidence.

**Unaffected:** all numeric scoring — price, mileage, market value, MAO, profit margin, ROI, distance, condition score, priority.

**Consequence:** CompanyHub export filters on `Recommended? = YES`, which only the AI sets. That export returns empty until a key is configured.

---

## 13. Deployment

### 13.1 One-Time Setup
```
npm install -g @google/clasp
clasp login
```
Enable the Apps Script API at `script.google.com/home/usersettings`.

### 13.2 Routine Deployment
```
git pull
clasp push
```
Then reload the spreadsheet (Ctrl+R) so `onOpen()` rebuilds the menu.

### 13.3 Critical Deployment Constraint

**`main.gs` must never be deployed.**

Apps Script places every file in a single shared global scope. The **last-loaded definition of a function wins**. `main.gs` is a stale full copy of the system — all 184 of its functions are duplicated in the modular `quantum_*` files, and it declares no unique constants. Because it sits outside `filePushOrder`, it loaded last and silently replaced newer modular code with older versions.

This caused a class of bug where fixes appeared to deploy but had no effect. It is excluded via `.claspignore`. The file remains in the repository for reference only.

**Load order** is controlled by `filePushOrder` in `.clasp.json`. `quantum_config.gs` must load first.

---

## 14. Known Data-Quality Behaviours

| Behaviour | Cause | Handling |
|---|---|---|
| Price arrives as a number, not "$8,995" | Sheets returns numeric cells as numbers | Parser accepts both |
| "17 hours ago" is not a parseable date | Marketplaces publish relative times | Relative-time parser; returns 0, never NaN |
| Blank `url` column on detail exports | Workflow supplies Origin URL instead | Falls back to Origin URL, then row scan |
| "Job Link" mistaken for listing URL | Dashboard link appears before Origin URL | browse.ai hosts excluded from URL scan |
| Mileage equals model year | Robot captured the year field | Value discarded as a capture error |
| Mileage captures "Exterior color: …" | Facebook's detail grid reorders when fields are absent | Parses to no digits → flagged as missing |
| Model truncates ("F-150" → "F") | Word boundary stopped at the hyphen | Model tokens accept hyphens |

---

## 15. Current Status & Roadmap

### 15.1 Operational
- Full Facebook Marketplace vehicle pipeline, list → workflow → detail → sheet → import → scored deals
- Segment-based vehicle valuation (8% mean error)
- E-bike valuation engine with four brand tiers and battery-condition detection
- City-level geocoding with real distance
- Data-quality gate preventing incomplete listings from mis-ranking
- clasp deployment
- Functional Integration Manager

### 15.2 In Progress
- **Vehicle detail robot retraining** — adding `seller`, `seller_rating`, `seller_joined`, `condition`, `title_status`, `color`, `transmission`; re-selecting `mileage` to stop it capturing the wrong grid element

### 15.3 Planned
| Item | Detail |
|---|---|
| **E-bike robot pairs** | Facebook first, then Craigslist, OfferUp, eBay. Merchandise pages need their own robots. |
| **Seller-signal scoring** | Wire `seller_rating` and `seller_joined` into dealer/private detection |
| **Powersports valuation depth** | Currently uses one generic segment; needs class-specific curves (dirt bike vs cruiser vs UTV) |
| **AI layer activation** | Add OpenAI key to enable verdicts, recommendations, seller messages |
| **Webhook automation** | Deploy web app for real-time import |
| **Knowledge Base population** | `getVehicleKnowledge` already overrides estimates when data exists — feeding real comps improves accuracy beyond heuristics |
| **Additional metros** | Geocoder covers the St. Louis trading area; expansion requires adding cities |

### 15.4 Acknowledged Limitations
- **Valuation is a calibrated heuristic, not market data.** It is tuned for ranking, not appraisal. Individual estimates may be 10–20% off.
- **No VIN on Facebook** — exact trim cannot be confirmed, so trim is inferred from title text.
- **Distance uses city centroids** — accurate to a few miles, not door-to-door.
- **Dealer filtering is imperfect** — dealers appear despite individual-seller filters.

---

## 16. Glossary

| Term | Definition |
|---|---|
| **ARV** | After Repair Value — resale value once repairs are done |
| **MAO** | Maximum Allowable Offer — highest price preserving target profit |
| **Capital Tier** | Deal size bracket (Micro/Budget/Standard/Dealer) |
| **Deep scraping** | Chaining a list robot to a detail robot to gather multi-page data |
| **List robot** | Scrapes a search results page for listing URLs |
| **Detail robot** | Scrapes one individual listing page |
| **Workflow** | Browse.AI feature passing one robot's output into another |
| **Origin URL** | The URL a Browse.AI task ran against |
| **Sheet ID** | The long string in a Google Sheets URL identifying a workbook |
| **Quantum Sync** | Processing Master Import into scored Master Database deals |
| **Needs Review** | Priority assigned when core data is missing |
| **Flip Strategy** | Planned exit: quick flip, hold, Turo, parts |
| **Turo Hold** | Vehicle better rented than resold |
| **PAM** | Project Arbitrage Module |
| **clasp** | Google's CLI for deploying Apps Script |
| **Haversine** | Great-circle distance formula between two coordinates |

---

## 17. Operating Runbook

**Daily:** Deploy robots (or let schedules run) → Import from Sheets → Run Quantum Sync → review High-priority deals → contact sellers.

**When something looks wrong:** Check **Activity Logs** first. It records every import error with the row number and exact exception.

**After any code change:** `git pull` → `clasp push` → reload the spreadsheet.

**After a schema change:** Reset Imports → Import from Sheets → Run Quantum Sync. Rows written under an older column layout will otherwise sit misaligned under new headers.

**Golden rules:**
1. Never point Browse.AI's export at the CarHawk workbook — it needs its own file.
2. Register the **detail** robot's sheet in CarHawk, not the list robot's.
3. Choose one chaining method — Browse.AI Workflows *or* CarHawk's API chain.
4. Never deploy `main.gs`.
