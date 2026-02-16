# CARHAWK SPEC PACK

**Source of truth:** `main.gs` (6,174 lines — QUANTUM-2.0.0)
**Generated:** 2026-02-16
**Scope:** CarHawk Ultimate workbook only. No CRM design. No Quantum Real Estate.

---

## A) CarHawk Workbook Overview

### A1) Purpose

CarHawk Ultimate is a Google Sheets + Apps Script system that automates the end-to-end vehicle flipping and Turo rental business. It ingests vehicle listings from multiple platforms via Browse.AI web scraping, runs AI-powered deal analysis through OpenAI, scores and ranks every deal on 10 weighted dimensions, produces a go/no-go verdict with an AI-generated seller message, and manages the full contact-to-close pipeline including SMS, email, calls, appointments, and follow-up sequences.

### A2) End-to-End Workflow

```
IMPORT
  Browse.AI scrapes Facebook Marketplace, Craigslist, OfferUp, eBay
  → Raw data lands in "Master Import" (16 cols)
  → Dedup check against PropertiesService URL cache

CLEANING & PARSING
  → Apps Script parses Raw Title → Year, Make, Model, Trim
  → Parses Raw Price → numeric Price
  → Parses Raw Location → Location, ZIP, Distance from HOME_ZIP
  → Parses Raw Description → Mileage, Color, Condition, Repair Keywords
  → Writes clean row to "Master Database" (61 cols)

SCORING
  → 10-dimension scoring engine runs per deal:
    Market, Vehicle, Seller, Timing, Location,
    Competition, Profit, Risk, Velocity, Condition
  → Each sub-score 0–10, weighted composite = Quantum Score (0–100)
  → Results stored in "Lead Scoring & Risk Assessment" (27 cols)

VERDICT
  → OpenAI API generates full analysis per deal
  → Outputs: Verdict, Confidence %, Profit Potential, Risk Assessment,
    Negotiation Strategy, Red Flags, Green Lights, Decision Matrix
  → Stored in "Verdict" sheet (24 cols)
  → Verdict + Seller Message + Recommended? written back to Master Database

ACTIONS
  → Qualified deals flow to "Leads Tracker" for pipeline management
  → Follow-up sequences auto-fire (HOT/WARM/COLD templates)
  → SMS via SMS-iT or Twilio → logged in "SMS Conversations"
  → Calls tracked in "AI Call Logs" with AI transcription
  → Appointments booked via Ohmylead → "Appointments" sheet
  → Campaign touches tracked in "Campaign Queue"

CLOSE & REPORTING
  → Won deals move to "Closed Deals" and "Post-Sale Tracker"
  → Actual ROI compared to projected ROI
  → "Reporting & Charts" aggregates KPIs
  → "Knowledge Base" stores vehicle intelligence for future scoring
```

---

## B) Sheet Inventory

| # | Exact Sheet Name | Purpose |
|---|-----------------|---------|
| 1 | **Master Import** | Raw data landing zone — Browse.AI scraped listings arrive here before parsing |
| 2 | **Master Database** | Single source of truth — every cleaned, scored, and AI-analyzed vehicle deal lives here |
| 3 | **Verdict** | Full AI analysis output per deal — profit potential, risk, negotiation strategy, red/green flags |
| 4 | **Leads Tracker** | Active lead pipeline — tracks contact attempts, stages, interest level, and next actions |
| 5 | **Flip ROI Calculator** | Per-deal investment scenario builder — purchase price through net profit with multiple cost lines |
| 6 | **Lead Scoring & Risk Assessment** | Quantified 10-dimension scoring engine output — sub-scores, percentile rank, investment grade |
| 7 | **CRM Integration** | Export batch tracking — what was synced to CompanyHub/SMS-iT, sync status, errors |
| 8 | **Parts Needed** | Vehicle repair parts sourcing — part numbers, pricing (new/used/reman), supplier, order status |
| 9 | **Post-Sale Tracker** | Closed deal performance documentation — actual profit, ROI, buyer satisfaction, lessons learned |
| 10 | **Reporting & Charts** | Analytics dashboard — KPI metrics, trends, targets, grades |
| 11 | **Settings** | System configuration — API keys, business parameters, thresholds, feature flags |
| 12 | **Activity Logs** | Audit trail — every system action with timestamp, level, duration, success/error |
| 13 | **Appointments** | Scheduled seller meetings — time, location, type, status, outcome |
| 14 | **Follow Ups** | Automated follow-up sequence management — step-by-step cadence per lead (HOT/WARM/COLD) |
| 15 | **Campaign Queue** | Individual SMS/email touch records — message content, delivery status, response tracking |
| 16 | **SMS Conversations** | Two-way SMS log — inbound/outbound messages with AI-classified intent and sentiment |
| 17 | **AI Call Logs** | Call tracking with AI transcription — duration, summary, sentiment, outcome, objections |
| 18 | **Closed Deals** | Final deal closure records — purchase price, sale price, all costs, net profit, ROI |
| 19 | **Knowledge Base** | Vehicle market intelligence — make/model profiles with repair costs, demand, flip scores, tips |
| 20 | **Integrations** | Third-party service registry — Browse.AI, SMS-iT, CompanyHub, Twilio, SendGrid, Ohmylead |

---

## C) Core Data Schemas (Exact Headers)

### C1) Master Database — 61 columns

| Col | Header | Calc / Manual |
|-----|--------|---------------|
| A | Deal ID | CALC — `QD-{timestamp}-{random}` |
| B | Import Date | CALC |
| C | Platform | CALC — parsed from import URL |
| D | Status | MANUAL — New / Active / Contacted / Offer Made / Under Contract / Closed / Lost |
| E | Priority | CALC — 🔥 HOT / ⭐ HIGH / 📊 MEDIUM / 📉 LOW |
| F | Year | CALC — parsed from Raw Title |
| G | Make | CALC — parsed from Raw Title |
| H | Model | CALC — parsed from Raw Title |
| I | Trim | CALC — parsed from Raw Title or Description |
| J | VIN | CALC/MANUAL — extracted from description when present |
| K | Mileage | CALC — parsed from description |
| L | Color | CALC — parsed from description |
| M | Title | CALC/MANUAL — Clean / Salvage / Rebuilt / No Title |
| N | Price | CALC — parsed from Raw Price |
| O | Location | CALC — parsed from Raw Location |
| P | ZIP | CALC — extracted from location string |
| Q | Distance (mi) | CALC — haversine distance from HOME_ZIP |
| R | Location Risk | CALC — 🟢 Low / 🟡 Medium / 🔴 High |
| S | Location Flag | CALC — risk explanation text |
| T | Condition | CALC — Excellent / Very Good / Good / Fair / Poor |
| U | Condition Score | CALC — 0–10 from keyword analysis |
| V | Repair Keywords | CALC — matched repair terms from description |
| W | Repair Risk Score | CALC — 0–10 severity-weighted |
| X | Est. Repair Cost | CALC — sum of matched keyword cost estimates |
| Y | Market Value | CALC — estimated ARV from year/make/model/condition |
| Z | MAO | CALC — `(Market Value × 0.75) − Est. Repair Cost − Holding Costs − Desired Profit` |
| AA | Profit Margin | CALC — `Market Value − Price − Est. Repair Cost` |
| AB | ROI % | CALC — `(Profit Margin / Price) × 100` × Capital Tier multiplier |
| AC | Capital Tier | CALC — MICRO $0–1K / BUDGET $1K–4K / STANDARD $4K–10K / DEALER $10K+ |
| AD | Flip Strategy | CALC — Quick Flip / Repair + Resell / Wholesale / Part Out / Turo Hold / Pass |
| AE | Sales Velocity Score | CALC — from Knowledge Base avg days to sell |
| AF | Market Advantage | CALC — competitive positioning note |
| AG | Days Listed | CALC — Posted Date to current date |
| AH | Seller Name | CALC — parsed from Seller Info |
| AI | Seller Phone | CALC — parsed from Seller Info |
| AJ | Seller Email | CALC — parsed from Seller Info |
| AK | Seller Type | CALC — Private / Dealer / Wholesaler / Unknown |
| AL | Deal Flag | CALC — special flags (estate sale, multiple vehicles, etc.) |
| AM | Hot Seller? | CALC — TRUE if urgency signals detected |
| AN | Multiple Vehicles? | CALC — TRUE if seller has other listings |
| AO | Seller Message | CALC (AI) — personalized outreach message generated by OpenAI |
| AP | AI Confidence | CALC (AI) — 0–100 confidence in verdict |
| AQ | Verdict | CALC (AI) — 🔥 HOT DEAL / ✅ SOLID DEAL / ⚠️ PORTFOLIO FOUNDATION / ❌ PASS |
| AR | Verdict Icon | CALC — emoji for verdict |
| AS | Recommended? | CALC — TRUE if Quantum Score ≥ threshold |
| AT | Image Score | CALC — 0–10 based on image count and quality signals |
| AU | Engagement Score | CALC — 0–10 composite |
| AV | Competition Level | CALC — Low / Medium / High |
| AW | Last Updated | CALC — auto-set on row change |
| AX | Assigned To | MANUAL |
| AY | Notes | MANUAL |
| AZ | Stage (CRM) | CALC/MANUAL — mirrors CompanyHub pipeline stage |
| BA | Contact Count | CALC — total contact attempts |
| BB | Last Contact | CALC — most recent contact timestamp |
| BC | Next Action | MANUAL/CALC — next recommended step |
| BD | Response Rate | CALC — responses / attempts |
| BE | SMS Count | CALC — total SMS sent |
| BF | Call Count | CALC — total calls |
| BG | Email Count | CALC — total emails |
| BH | Meeting Scheduled | CALC — TRUE if appointment exists |
| BI | Follow-up Status | CALC — Active / Paused / Completed / None |

---

### C2) Verdict — 24 columns

| Col | Header | Calc / Manual |
|-----|--------|---------------|
| A | Analysis ID | CALC — `VER-{timestamp}-{random}` |
| B | Deal ID | CALC — FK to Master Database |
| C | Analysis Date | CALC |
| D | Model Version | CALC — OpenAI model used |
| E | Quantum Score | CALC (AI) — 0–100 composite |
| F | AI Verdict | CALC (AI) — 🔥 HOT DEAL / ✅ SOLID DEAL / ⚠️ PORTFOLIO FOUNDATION / ❌ PASS |
| G | Confidence % | CALC (AI) — 0–100 |
| H | Profit Potential | CALC (AI) — dollar amount |
| I | Risk Assessment | CALC (AI) — risk narrative |
| J | Market Timing | CALC (AI) — buy / wait / pass signal |
| K | Competition Analysis | CALC (AI) — competitive landscape |
| L | Price Optimization | CALC (AI) — recommended offer price |
| M | Negotiation Strategy | CALC (AI) — tactical approach |
| N | Quick Sale Probability | CALC (AI) — percent |
| O | Repair Complexity | CALC (AI) — Low / Medium / High / Critical |
| P | Hidden Cost Risk | CALC (AI) — estimated hidden costs |
| Q | Flip Timeline | CALC (AI) — estimated days to complete |
| R | Success Probability | CALC (AI) — percent |
| S | Alternative Strategies | CALC (AI) — fallback approaches |
| T | Key Insights | CALC (AI) — most important observations |
| U | Red Flags | CALC (AI) — warnings |
| V | Green Lights | CALC (AI) — positive indicators |
| W | Market Comparables | CALC (AI) — comparable recent sales |
| X | Decision Matrix | CALC (AI) — weighted factor breakdown |

---

### C3) Master Import (Staging) — 16 columns

| Col | Header | Calc / Manual |
|-----|--------|---------------|
| A | Import ID | CALC — `IMP-{timestamp}-{random}` |
| B | Date (GMT) | CALC — auto-set on import |
| C | Job Link | MANUAL — Browse.AI job URL |
| D | Origin URL | MANUAL — original listing URL |
| E | Platform | CALC — parsed from Origin URL |
| F | Raw Title | MANUAL — scraped listing title |
| G | Raw Price | MANUAL — scraped price string |
| H | Raw Location | MANUAL — scraped location string |
| I | Raw Description | MANUAL — scraped description |
| J | Seller Info | MANUAL — scraped seller details |
| K | Posted Date | MANUAL — scraped post date |
| L | Images Count | MANUAL — scraped image count |
| M | Import Status | CALC — pending / processed / error / duplicate |
| N | Processed | CALC — flips to TRUE after processing |
| O | Master ID | CALC — links to Deal ID in Master Database |
| P | Error Log | CALC — error message if processing fails |

---

### C4) Flip ROI Calculator (Valuation) — 31 columns

| Col | Header | Calc / Manual |
|-----|--------|---------------|
| A | Calc ID | CALC |
| B | Deal ID | CALC — FK |
| C | Vehicle | CALC — `{Year} {Make} {Model}` |
| D | Scenario | MANUAL — scenario name |
| E | Purchase Price | MANUAL |
| F | Transport Cost | MANUAL |
| G | Inspection Cost | MANUAL |
| H | Repair Labor | MANUAL |
| I | Parts Cost | MANUAL |
| J | Detail Cost | MANUAL |
| K | Marketing Cost | MANUAL |
| L | Listing Fees | MANUAL |
| M | Other Costs | MANUAL |
| N | Total Investment | CALC — sum of E through M |
| O | Target Sale Price | MANUAL |
| P | Market Comp Avg | CALC — from Knowledge Base |
| Q | Days to Sell Est | CALC — from Knowledge Base |
| R | Holding Cost/Day | MANUAL/SETTINGS |
| S | Total Holding | CALC — Q × R |
| T | Transaction Fees | MANUAL |
| U | Total Costs | CALC — N + S + T |
| V | Net Profit | CALC — O − U |
| W | Profit Margin % | CALC — V / O × 100 |
| X | ROI % | CALC — V / N × 100 |
| Y | Cash on Cash | CALC |
| Z | Break Even Price | CALC — U (minimum sale price to not lose money) |
| AA | Min Acceptable | MANUAL |
| AB | Max Acceptable | MANUAL |
| AC | Risk Score | CALC — 0–10 based on margin and unknowns |
| AD | Confidence Level | MANUAL |
| AE | Scenario Notes | MANUAL |

---

### C5) Lead Scoring & Risk Assessment — 27 columns

| Col | Header | Calc / Manual |
|-----|--------|---------------|
| A | Score ID | CALC |
| B | Deal ID | CALC — FK |
| C | Analysis Date | CALC |
| D | Quantum Score | CALC — weighted composite 0–100 |
| E | Component Scores | CALC — summary/JSON |
| F | Market Score | CALC — 0–10 |
| G | Vehicle Score | CALC — 0–10 |
| H | Seller Score | CALC — 0–10 |
| I | Timing Score | CALC — 0–10 |
| J | Location Score | CALC — 0–10 |
| K | Competition Score | CALC — 0–10 |
| L | Profit Score | CALC — 0–10 |
| M | Risk Score | CALC — 0–10 |
| N | Velocity Score | CALC — 0–10 |
| O | Condition Score | CALC — 0–10 |
| P | Total Weighted Score | CALC |
| Q | Percentile Rank | CALC |
| R | Category | CALC — HOT DEAL / SOLID / FOUNDATION / PASS |
| S | Investment Grade | CALC — A+ / A / B / C / D / F |
| T | Risk Factors | CALC — identified risks |
| U | Opportunity Factors | CALC — identified opportunities |
| V | Score Trend | CALC — ↑ / → / ↓ |
| W | Previous Score | CALC |
| X | Score Change | CALC |
| Y | Analyst Notes | MANUAL |
| Z | Override | MANUAL — boolean |
| AA | Final Grade | CALC/MANUAL |

---

### C6) AI Output Fields (Seller Message, Negotiation, Recommended Action)

AI outputs are **not on a separate sheet** — they live directly on Master Database and Verdict:

| Field | Sheet | Col | What It Contains |
|-------|-------|-----|------------------|
| Seller Message | Master Database | AO | AI-generated personalized SMS/email outreach (uses templates: initial_hot, initial_warm, initial_cold, follow_up_1, follow_up_2, reengagement) |
| AI Confidence | Master Database | AP | 0–100 confidence score |
| Verdict | Master Database | AQ | Emoji verdict classification |
| Recommended? | Master Database | AS | Boolean — passes Quantum Score threshold |
| Negotiation Strategy | Verdict | M | Tactical negotiation approach |
| Price Optimization | Verdict | L | Recommended offer price |
| Key Insights | Verdict | T | Most important observations |
| Red Flags | Verdict | U | Warnings and concerns |
| Green Lights | Verdict | V | Positive indicators |
| Alternative Strategies | Verdict | S | Fallback approaches |

**Template variables used in Seller Message:** `{name}`, `{year}`, `{make}`, `{model}`, `{price}`

---

### C7) Reporting & Charts — 12 columns

| Col | Header | Calc / Manual |
|-----|--------|---------------|
| A | Metric | Text — metric name |
| B | Value | Number/Currency |
| C | Change | CALC — period-over-period delta |
| D | Trend | CALC — ↑ / → / ↓ |
| E | Target | MANUAL |
| F | Status | CALC — On Track / Behind / Ahead |
| G | Period | MANUAL — Daily / Weekly / Monthly |
| H | Comparison | CALC — vs previous period |
| I | Percentile | CALC |
| J | Grade | CALC — letter grade |
| K | Action Required | CALC — boolean |
| L | Notes | MANUAL |

---

### C8) Remaining Sheets — Abbreviated Headers

**Settings** (11 cols): Setting Key | Value | Updated | Description | Category | Data Type | Validation | Default | Required | Affects | Restart Required

**Activity Logs** (11 cols): Timestamp | Level | Action | Category | Details | User | Deal ID | Duration (ms) | Success | Error | Stack Trace

**Appointments** (21 cols): Appointment ID | Deal ID | Vehicle | Seller Name | Phone | Email | Scheduled Time | Location | Location Type | Duration | Status | Type | Notes | Reminder Sent | Created Date | Created By | Updated Date | Confirmed | Show Rate | Outcome | Follow-up Required

**Follow Ups** (20 cols): Follow-up ID | Deal ID | Campaign ID | Sequence Type | Step Number | Scheduled Time | Type | Template | Status | Sent Time | Response | Response Time | Opened | Clicked | Replied | Created Date | Priority | Retry Count | Error Message | Next Step

**Campaign Queue** (20 cols): Touch ID | Campaign ID | Deal ID | Sequence Type | Touch Index | Type | Template | Subject | Message | Scheduled Time | Status | Sent Time | Delivered | Response | Response Type | Created Date | Tags | A/B Test | Performance Score | Cost

**SMS Conversations** (20 cols): Conversation ID | Deal ID | Phone Number | Direction | Message | Timestamp | Status | Intent | Sentiment | Type | Campaign ID | Template Used | Response Time | Character Count | Media URL | Error Code | Cost | Provider | Thread ID | Tags

**AI Call Logs** (20 cols): Call ID | Deal ID | Phone Number | Direction | Start Time | End Time | Duration | Recording URL | Transcription | Summary | Sentiment | Intent | Outcome | Next Action | Appointment Detected | Price Discussed | Objections | AI Score | Cost | Tags

**Closed Deals** (28 cols): Close ID | Deal ID | Vehicle | Year | Make | Model | Mileage | Condition | Original Price | Purchase Price | Sale Price | Platform | Days to Close | Days on Market | Profit | ROI % | Close Date | Payment Method | Buyer Type | Marketing Cost | Repair Cost | Total Investment | Net Profit | Commission | Success Factors | Lessons Learned | Rating | Tags

**Post-Sale Tracker** (35 cols): Sale ID | Deal ID | Vehicle | Sale Date | Days to Sell | Buyer Name | Buyer Type | Sale Platform | Listed Price | Sale Price | Negotiation % | Purchase Price | Total Investment | Gross Profit | Net Profit | Actual ROI % | vs Projected ROI | Payment Method | Payment Status | Title Transfer | Delivery Method | Buyer Satisfaction | Would Refer | Lessons Learned | What Worked | What Didn't | Strategy Used | Market Conditions | Seasonal Impact | Repeat Buyer | Referral Source | Follow-up Date | Testimonial | Case Study | Performance Grade

**Parts Needed** (32 cols): Part ID | Deal ID | Vehicle | Category | Subcategory | Part Name | Part Number | OEM Number | Condition Needed | New Price | Used Price | Reman Price | Selected Option | Quantity | Unit Cost | Total Cost | Supplier | Supplier Part # | Lead Time | In Stock | Ordered | Order Date | Expected Date | Received Date | Quality Check | Installation Hours | Labor Rate | Labor Cost | Core Charge | Core Return | Warranty | Notes

**Knowledge Base** (20 cols): KB ID | Make | Model | Years | Category | Common Issues | Repair Costs | Market Demand | Quick Flip Score | Avg Days to Sell | Price Range Low | Price Range High | Best Months | Target Buyer | Negotiation Tips | Red Flags | Success Rate | Updated Date | Data Points | Confidence Score

**CRM Integration** (26 cols): Export ID | Export Date | Platform | Deal IDs | Record Count | Export Type | Include Fields | Filters Applied | Total Value | Avg Deal Value | Hot Leads Count | Contact Info Complete | SMS Ready | Email Ready | Campaign Name | Template Used | Tags Applied | CRM Record IDs | Sync Status | Sync Errors | Last Sync | Next Sync | Automation Enabled | Response Tracking | Conversion Count | Revenue Generated

**Integrations** (20 cols): Integration ID | Provider | Type | Name | API Key | Secret | Status | Last Sync | Next Sync | Sync Frequency | Records Synced | Error Count | Last Error | Configuration | Webhook URL | Features | Limits | Cost | Notes | Created Date

---

## D) Key Outputs & Calculations

### D1) Computed Outputs

| Output | Where Produced | Formula / Logic |
|--------|---------------|-----------------|
| **MAO** | Master Database col Z | `(Market Value × 0.75) − Est. Repair Cost − Holding Costs − Desired Profit`. Holding Costs default $500. Desired Profit = Market Value × 0.15 |
| **ROI %** | Master Database col AB | `(Profit Margin / Price) × 100` multiplied by Capital Tier factor (MICRO ×2.5, BUDGET ×2.0, STANDARD ×1.5, DEALER ×1.2) |
| **Quantum Score** | Lead Scoring col D | Weighted composite of 10 sub-scores (each 0–10): Market, Vehicle, Seller, Timing, Location, Competition, Profit, Risk, Velocity, Condition. Normalized to 0–100 |
| **Verdict** | Master Database col AQ | Quantum Score ≥80 → 🔥 HOT DEAL · 60–79 → ✅ SOLID DEAL · 40–59 → ⚠️ PORTFOLIO FOUNDATION · <40 → ❌ PASS |
| **Profit Margin** | Master Database col AA | `Market Value − Price − Est. Repair Cost` |
| **Est. Repair Cost** | Master Database col X | Sum of matched keyword costs from repair library scan of description |
| **Market Value (ARV)** | Master Database col Y | Lookup by year/make/model/condition against Knowledge Base and market data |
| **Distance** | Master Database col Q | Haversine formula from HOME_ZIP (Settings) to listing ZIP |
| **Capital Tier** | Master Database col AC | Price brackets: $0–1K = MICRO, $1K–4K = BUDGET, $4K–10K = STANDARD, $10K+ = DEALER |
| **Flip Strategy** | Master Database col AD | Rule-based: price, condition, repair cost, and Knowledge Base quick-flip score determine Quick Flip / Repair+Resell / Wholesale / Part Out / Turo Hold / Pass |
| **Seller Message** | Master Database col AO | OpenAI-generated from deal data using template variables: `{name}`, `{year}`, `{make}`, `{model}`, `{price}` |
| **Net Profit (actual)** | Closed Deals col W / Post-Sale col O | `Sale Price − Total Investment` |
| **Actual ROI %** | Post-Sale col P | `Net Profit / Total Investment × 100` |

### D2) Repair Keyword Library (Hardcoded Costs)

| Keyword | Severity | Cost Estimate |
|---------|----------|---------------|
| transmission | HIGH | $3,000 |
| engine knock | HIGH | $2,500 |
| needs motor | CRITICAL | $4,000 |
| blown head | HIGH | $1,500 |
| no reverse | MEDIUM | $2,000 |
| overheating | MEDIUM | $800 |
| ac broken | LOW | $500 |
| minor dents | LOW | $300 |

### D3) Follow-Up Sequence Definitions

| Sequence | Step 1 | Step 2 | Step 3 | Step 4 |
|----------|--------|--------|--------|--------|
| HOT_LEAD | SMS now | SMS +30 min | SMS +24 hr | EMAIL +72 hr |
| WARM_LEAD | SMS now | SMS +24 hr | EMAIL +120 hr | — |
| COLD_LEAD | EMAIL now | SMS +7 days | — | — |

---

## E) IDs & Deduplication

### E1) Unique Identifiers

| ID Prefix | Sheet | Format | Example |
|-----------|-------|--------|---------|
| QD | Master Database | `QD-{timestamp}-{random4}` | `QD-1708099200000-a3f2` |
| IMP | Master Import | `IMP-{timestamp}-{random4}` | `IMP-1708099200000-b7c1` |
| VER | Verdict | `VER-{timestamp}-{random4}` | `VER-1708099200000-f6g7` |
| LEAD | Leads Tracker | `LEAD-{timestamp}-{random4}` | `LEAD-1708099200000-d4e5` |
| EXP | CRM Integration | `EXP-{timestamp}-{random4}` | `EXP-1708099200000-h8i9` |
| SALE | Post-Sale Tracker | `SALE-{timestamp}-{random4}` | `SALE-1708099200000-j0k1` |
| CLS | Closed Deals | `CLS-{timestamp}-{random4}` | `CLS-1708099200000-l2m3` |
| APT | Appointments | `APT-{timestamp}-{random4}` | `APT-1708099200000-n4o5` |
| FUP | Follow Ups | `FUP-{timestamp}-{random4}` | `FUP-1708099200000-p6q7` |
| CAMP | Campaign Queue | `CAMP-{timestamp}-{random4}` | `CAMP-1708099200000-r8s9` |
| SMS | SMS Conversations | `SMS-{timestamp}-{random4}` | `SMS-1708099200000-t0u1` |
| CALL | AI Call Logs | `CALL-{timestamp}-{random4}` | `CALL-1708099200000-v2w3` |
| KB | Knowledge Base | `KB-{timestamp}-{random4}` | `KB-1708099200000-x4y5` |
| INT | Integrations | `INT-{timestamp}-{random4}` | `INT-1708099200000-z6a7` |

### E2) Foreign Key Relationships

```
Master Import.Master ID ──→ Master Database.Deal ID
Verdict.Deal ID ──→ Master Database.Deal ID
Leads Tracker.Deal ID ──→ Master Database.Deal ID
Lead Scoring.Deal ID ──→ Master Database.Deal ID
Flip ROI Calculator.Deal ID ──→ Master Database.Deal ID
Parts Needed.Deal ID ──→ Master Database.Deal ID
Appointments.Deal ID ──→ Master Database.Deal ID
Follow Ups.Deal ID ──→ Master Database.Deal ID
Campaign Queue.Deal ID ──→ Master Database.Deal ID
SMS Conversations.Deal ID ──→ Master Database.Deal ID
AI Call Logs.Deal ID ──→ Master Database.Deal ID
Closed Deals.Deal ID ──→ Master Database.Deal ID
Post-Sale Tracker.Deal ID ──→ Master Database.Deal ID
CRM Integration.Deal IDs ──→ Master Database.Deal ID (comma-separated list)
```

### E3) Dedup Strategy

1. **Import-level dedup**: Before writing to Master Import, Origin URL is checked against Google Apps Script `PropertiesService` (persistent key-value cache). If URL exists → row marked `Import Status = "duplicate"` and skipped.
2. **Processing-level dedup**: `Processed` boolean flag in Master Import prevents re-processing. `Master ID` links import row to its Master Database row.
3. **Known gap**: No VIN-based cross-platform dedup. The same vehicle listed on Facebook AND Craigslist will create two Master Database rows. VIN field exists (col J) but is not reliably populated from scraping.

---

## F) Automation Touchpoints

### F1) Triggers & Processes

| Trigger | What Happens | Sheets Affected |
|---------|-------------|-----------------|
| Browse.AI export lands in Master Import | `processImports()` — parse raw fields, dedup, write to Master Database | Master Import → Master Database |
| New row in Master Database | `runQuantumAnalysis()` — call OpenAI API, generate scoring + verdict + seller message | Master Database, Verdict, Lead Scoring |
| Deal qualifies (Recommended? = TRUE) | `createLead()` — adds row to Leads Tracker, starts follow-up sequence | Leads Tracker, Follow Ups |
| Follow-up step scheduled time reached | `processFollowUps()` — sends SMS/email via SMS-iT or Twilio/SendGrid | Follow Ups, Campaign Queue, SMS Conversations |
| Inbound SMS received (webhook) | `handleInboundSMS()` — logs message, classifies intent/sentiment via AI | SMS Conversations, Leads Tracker |
| Inbound call recorded | `processCallRecording()` — AI transcription, summary, sentiment, next action | AI Call Logs |
| Ohmylead booking webhook | `handleAppointment()` — creates appointment row | Appointments |
| Deal closed manually | `closeDeal()` — moves data to Closed Deals and Post-Sale Tracker | Closed Deals, Post-Sale Tracker |
| CRM sync triggered (manual or scheduled) | `syncToCompanyHub()` — exports qualified deals to CompanyHub API | CRM Integration |
| CRM sync triggered | `syncToSMSiT()` — exports leads to SMS-iT for campaign management | CRM Integration |

### F2) Integrated Services

| Service | Purpose | Config Location |
|---------|---------|----------------|
| OpenAI API | AI analysis engine (scoring, verdict, seller message, call transcription) | Settings: `OPENAI_API_KEY` |
| Browse.AI | Web scraping → Google Sheets export | Integrations sheet |
| SMS-iT | SMS campaign management and lead export | Settings: `SMSIT_API_KEY` |
| CompanyHub | CRM sync (deals, contacts) | Settings: `COMPANYHUB_API_KEY` |
| Twilio | SMS fallback provider | Settings: `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_PHONE` |
| SendGrid | Email automation | Settings: `SENDGRID_API_KEY` |
| Ohmylead | Appointment booking webhook | Integrations sheet |

### F3) Outputs Synced Outward (CRM-Relevant)

The `syncToCompanyHub()` function exports these data points per deal:
- Deal identification (Deal ID, vehicle info, platform)
- Seller contact (name, phone, email)
- Financial analysis (MAO, ROI %, profit margin, price)
- AI outputs (verdict, confidence, quantum score, seller message)
- Pipeline state (status, stage, priority)
- Engagement metrics (contact count, response rate, SMS/call/email counts)

---

## G) Lean CRM Sync Export Set (CarHawk Only)

Minimum columns required in a CRM "Deal" record to execute on a vehicle deal:

### Contact & Identification (to reach the seller)

| # | Spreadsheet Column | Source | Purpose |
|---|-------------------|--------|---------|
| 1 | Deal ID | Master Database col A | Unique key, prevents duplicates |
| 2 | Seller Name | Master Database col AH | Who to contact |
| 3 | Seller Phone | Master Database col AI | Primary contact method |
| 4 | Seller Email | Master Database col AJ | Secondary contact method |
| 5 | Origin URL | Master Import col D | Link to original listing |

### Vehicle & Numbers (to evaluate the deal)

| # | Spreadsheet Column | Source | Purpose |
|---|-------------------|--------|---------|
| 6 | Year | Master Database col F | Vehicle ID |
| 7 | Make | Master Database col G | Vehicle ID |
| 8 | Model | Master Database col H | Vehicle ID |
| 9 | Price | Master Database col N | Asking price |
| 10 | MAO | Master Database col Z | Max you should pay |
| 11 | ROI % | Master Database col AB | Return on investment |
| 12 | Profit Margin | Master Database col AA | Dollar profit expected |
| 13 | Est. Repair Cost | Master Database col X | Repair budget |

### AI Outputs (to act fast and smart)

| # | Spreadsheet Column | Source | Purpose |
|---|-------------------|--------|---------|
| 14 | Verdict | Master Database col AQ | Go / no-go decision |
| 15 | Quantum Score | Lead Scoring col D | Numeric rank for sorting |
| 16 | AI Confidence | Master Database col AP | Trust level in the verdict |
| 17 | Seller Message | Master Database col AO | Copy-paste outreach text |
| 18 | Red Flags | Verdict col U | Know the risks before calling |

### Pipeline & Next Step (to manage workflow)

| # | Spreadsheet Column | Source | Purpose |
|---|-------------------|--------|---------|
| 19 | Status | Master Database col D | Current pipeline stage |
| 20 | Priority | Master Database col E | Urgency ranking |
| 21 | Next Action | Master Database col BC | What to do next |
| 22 | Follow-up Status | Master Database col BI | Is automation running |
| 23 | Platform | Master Database col C | Where the listing is from |
| 24 | Days Listed | Master Database col AG | Urgency signal |

**Total: 24 columns** — enough to contact, evaluate, decide, and act on any deal without opening the spreadsheet.

---

*END OF CARHAWK SPEC PACK*
