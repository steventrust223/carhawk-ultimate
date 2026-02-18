# TURO ADD-ON MODULE SPEC PACK

**Repository:** `carhawk-ultimate`
**Audit Date:** 2026-02-18
**Source Branch:** `claude/turo-rental-hold-addon-Dlkyc` (merged to `main` via PR #4)
**Auditor Context:** Automated code audit — repository is the sole source of truth

---

## 1) Module Status Overview

### Status: Configuration-Only (Not Operational)

The Turo module exists as a **single configuration file** (`turo_config.gs`, 563 lines) containing constants, header definitions, column mappings, picklists, and default values. It defines no functions, no triggers, and no executable logic.

### Files Defining the Turo Module

| File | Lines | Role | Contains Executable Logic? |
|---|---|---|---|
| `turo_config.gs` | 563 | Constants, column maps, headers, defaults, picklists, vehicle classification lists | **No** |
| `main.gs` | 6,174 | Core CarHawk system (Quantum CRM) | **No Turo references** (0 matches for any case variation of "Turo") |

### Configuration vs Executable Logic Breakdown

| Category | Present? | Details |
|---|---|---|
| Sheet name definitions | Yes | `TURO_SHEETS` — 5 sheet definitions |
| Column index maps | Yes | `TURO_DB_COLS` — 10 new columns (indices 61–70) + 24 existing column references |
| Header arrays | Yes | 4 sheet header arrays + 1 Master DB header array |
| Picklist constants | Yes | 4 picklist arrays |
| Lifecycle status machine | Yes | `TURO_STATUSES` (8 states) + `TURO_STATUS_TRANSITIONS` (directed graph) |
| Scoring weights | Yes | `TURO_SCORE_WEIGHTS` (6 dimensions) |
| Risk tier thresholds | Yes | `TURO_RISK_TIERS` (4 tiers) |
| Depreciation model | Yes | `DEPRECIATION_TIERS` (4 age brackets) + rental add-on constant |
| Vehicle classification lists | Yes | 8 class arrays (230+ model strings) + 1 luxury brand array (23 brands) |
| Pricing defaults | Yes | `TURO_PRICING_DEFAULTS` (8 vehicle classes) |
| Seasonal multipliers | Yes | Rate (12 months) + utilization (12 months) |
| Settings defaults | Yes | `TURO_SETTINGS_DEFAULTS` (20 key-value pairs) |
| **Any function definitions** | **No** | 0 functions in `turo_config.gs` |
| **Any trigger registrations** | **No** | No `onEdit`, `onOpen`, or installable triggers reference Turo |
| **Any references from main.gs** | **No** | `main.gs` does not import, call, or reference any `TURO_*` constant |

---

## 2) Turo Sheets & Data Model

### 2.1 Turo Engine (`TURO_SHEETS.ENGINE`)

- **Sheet Name:** `Turo Engine`
- **Tab Color:** `#00BCD4`
- **Purpose:** Per-vehicle Turo hold/flip analysis. Central calculation sheet comparing Turo rental income against flipping profit.
- **Columns:** 39 (A–AM)
- **Created Automatically:** No. Not referenced in `createQuantumSheets()` or `deployQuantumHeaders()` in `main.gs`.

| Col | Header | Type | Input/Calculated |
|---|---|---|---|
| A | Row ID | ID | Input (auto-assigned) |
| B | VIN | String | Input (from Master DB) |
| C | Vehicle | String | Input (from Master DB) |
| D | Vehicle Class | String | Calculated (via classification lists) |
| E | Asking Price | Currency | Input (from Master DB col 13) |
| F | Estimated Repair Cost | Currency | Input (from Master DB col 23) |
| G | Total Acquisition Cost | Currency | Calculated (E + F) |
| H | Estimated Resale Value | Currency | Input (from Master DB col 24) |
| I | Flip Net Profit | Currency | Calculated (H - G) |
| J | Flip Timeline (days) | Number | Input (from pricing defaults) |
| K | Daily Rate | Currency | Input/Default (from pricing defaults by class) |
| L | Utilization % | Percent | Input/Default (from pricing defaults by class) |
| M | Gross Monthly Revenue | Currency | Calculated (K * 30 * L) |
| N | Turo Platform Fee % | Percent | Input (from settings, default 25%) |
| O | Turo Platform Fee $ | Currency | Calculated (M * N) |
| P | Insurance Monthly | Currency | Input (from pricing defaults by class) |
| Q | Cleaning Per Trip | Currency | Input (from settings/defaults) |
| R | Trips Per Month | Number | Calculated (30 / trip_length * L) |
| S | Total Cleaning Monthly | Currency | Calculated (Q * R) |
| T | Maintenance Reserve Monthly | Currency | Calculated (G * maint_pct / 12) |
| U | Depreciation Monthly | Currency | Calculated (from depreciation model) |
| V | Financing Payment Monthly | Currency | Calculated (if APR > 0) |
| W | Registration & Tax Monthly | Currency | Calculated (annual / 12) |
| X | Total Monthly Expenses | Currency | Calculated (O+P+S+T+U+V+W) |
| Y | Net Monthly Cash Flow | Currency | Calculated (M - X) |
| Z | Net Annual Cash Flow | Currency | Calculated (Y * 12) |
| AA | Payback Months | Number | Calculated (G / Y) |
| AB | Break-Even Utilization % | Percent | Calculated |
| AC | 12-Month Total Profit (Turo) | Currency | Calculated (Z) |
| AD | 12-Month Total Profit (Flip) | Currency | Calculated (I, adjusted) |
| AE | Turo vs Flip Delta | Currency | Calculated (AC - AD) |
| AF | Turo Hold Score | Number (0-100) | Calculated (weighted scoring) |
| AG | Risk Tier | String | Calculated (from score thresholds) |
| AH | Recommended Strategy | String | Calculated |
| AI | Rationale | String | Calculated/Generated |
| AJ | Exit Plan | String | Calculated/Generated |
| AK | Turo Status | String | Input (lifecycle status) |
| AL | Date Evaluated | Date | Auto-stamped |
| AM | Override? | Boolean | Input (manual override flag) |

### 2.2 Fleet Manager (`TURO_SHEETS.FLEET`)

- **Sheet Name:** `Fleet Manager`
- **Tab Color:** `#4CAF50`
- **Purpose:** Active fleet tracking for vehicles that have been acquired for Turo rental. Tracks revenue, expenses, ROI, and operational metrics over time.
- **Columns:** 26 (A–Z)
- **Created Automatically:** No.

| Col | Header | Type | Input/Calculated |
|---|---|---|---|
| A | Fleet ID | ID | Input (auto-assigned) |
| B | VIN | String | Input |
| C | Vehicle | String | Input |
| D | Vehicle Class | String | Input |
| E | Turo Status | String | Input (lifecycle status) |
| F | Date Acquired | Date | Input |
| G | Date Listed on Turo | Date | Input |
| H | Acquisition Cost | Currency | Input |
| I | Total Revenue to Date | Currency | Aggregated |
| J | Total Expenses to Date | Currency | Aggregated |
| K | Net Profit to Date | Currency | Calculated (I - J) |
| L | ROI to Date % | Percent | Calculated (K / H) |
| M | Months Active | Number | Calculated |
| N | Avg Monthly Revenue | Currency | Calculated (I / M) |
| O | Avg Monthly Net | Currency | Calculated (K / M) |
| P | Utilization to Date % | Percent | Input/Tracked |
| Q | Trips to Date | Number | Input/Tracked |
| R | Avg Trip Length (days) | Number | Calculated (rented_days / Q) |
| S | Current Daily Rate | Currency | Input |
| T | Monthly Insurance | Currency | Input |
| U | Last Service Date | Date | Input |
| V | Next Service Due | Date | Input |
| W | Current Estimated Value | Currency | Input/Calculated |
| X | Projected Payoff Date | Date | Calculated |
| Y | On Track? | Boolean/String | Calculated |
| Z | Fleet Notes | String | Input |

### 2.3 Maintenance & Turnovers (`TURO_SHEETS.MAINTENANCE`)

- **Sheet Name:** `Maintenance & Turnovers`
- **Tab Color:** `#FF9800`
- **Purpose:** Service log for fleet vehicles. Tracks maintenance events, costs, downtime, and upcoming service schedules.
- **Columns:** 14 (A–N)
- **Created Automatically:** No.

| Col | Header | Type |
|---|---|---|
| A | Log ID | ID |
| B | Fleet ID | FK → Fleet Manager.A |
| C | Vehicle | String |
| D | Date | Date |
| E | Type | Picklist (`MAINTENANCE_TYPES`, 12 options) |
| F | Description | String |
| G | Cost | Currency |
| H | Vendor | String |
| I | Mileage at Service | Number |
| J | Downtime Days | Number |
| K | Next Service Type | Picklist |
| L | Next Service Date | Date |
| M | Next Service Mileage | Number |
| N | Notes | String |

### 2.4 Turo Pricing & Seasonality (`TURO_SHEETS.PRICING`)

- **Sheet Name:** `Turo Pricing & Seasonality`
- **Tab Color:** `#9C27B0`
- **Purpose:** Reference sheet for default daily rates, utilization assumptions, and seasonal multipliers by vehicle class. No headers are defined in code — this sheet is implied to be populated from `TURO_PRICING_DEFAULTS` and `SEASONAL_*_MULTIPLIERS`.
- **Columns:** No header array exists. Structure must be inferred from `TURO_PRICING_DEFAULTS` keys: `dailyRate`, `utilization`, `tripLength`, `insurance`, `registration`, `cleaning`, `maintenanceReserve`, `flipTimeline` per vehicle class, plus 12-month rate and utilization multiplier rows.
- **Created Automatically:** No.

### 2.5 Insurance & Compliance (`TURO_SHEETS.INSURANCE`)

- **Sheet Name:** `Insurance & Compliance`
- **Tab Color:** `#F44336`
- **Purpose:** Per-vehicle insurance policies, registration, inspection tracking, and compliance status.
- **Columns:** 17 (A–Q)
- **Created Automatically:** No.

| Col | Header | Type |
|---|---|---|
| A | Fleet ID | FK → Fleet Manager.A |
| B | Vehicle | String |
| C | Registration State | String |
| D | Registration Expiry | Date |
| E | Registration Cost | Currency |
| F | Insurance Provider | String |
| G | Insurance Policy # | String |
| H | Insurance Expiry | Date |
| I | Insurance Monthly Premium | Currency |
| J | Insurance Type | Picklist (`INSURANCE_TYPES`, 4 options) |
| K | Inspection Due | Date |
| L | Inspection Status | Picklist (`INSPECTION_STATUSES`, 4 options) |
| M | Emissions Due | Date |
| N | Annual Property Tax | Currency |
| O | LLC/Business Entity | String |
| P | Title Status | Picklist (`TITLE_STATUSES`, 4 options) |
| Q | Compliance Notes | String |

---

## 3) Master Database Integration

### Existing Columns Referenced by Turo Module

The `TURO_DB_COLS` object maps 24 existing Master Database columns by 0-based index. These are read-only inputs to the Turo Engine:

| Constant Key | Index | Master DB Header (from `setupDatabaseHeaders()`) |
|---|---|---|
| `DEAL_ID` | 0 | Deal ID |
| `IMPORT_DATE` | 1 | Import Date |
| `PLATFORM` | 2 | Platform |
| `STATUS` | 3 | Status |
| `YEAR` | 5 | Year |
| `MAKE` | 6 | Make |
| `MODEL` | 7 | Model |
| `TRIM` | 8 | Trim |
| `VIN` | 9 | VIN |
| `MILEAGE` | 10 | Mileage |
| `COLOR` | 11 | Color |
| `TITLE` | 12 | Title |
| `PRICE` | 13 | Price |
| `LOCATION` | 14 | Location |
| `ZIP` | 15 | ZIP |
| `DISTANCE` | 16 | Distance (mi) |
| `CONDITION` | 19 | Condition |
| `CONDITION_SCORE` | 20 | Condition Score |
| `REPAIR_KEYWORDS` | 21 | Repair Keywords |
| `REPAIR_RISK_SCORE` | 22 | Repair Risk Score |
| `EST_REPAIR_COST` | 23 | Est. Repair Cost |
| `MARKET_VALUE` | 24 | Market Value |
| `MAO` | 25 | MAO |
| `PROFIT_MARGIN` | 26 | Profit Margin |
| `ROI_PCT` | 27 | ROI % |
| `CAPITAL_TIER` | 28 | Capital Tier |
| `FLIP_STRATEGY` | 29 | Flip Strategy |
| `SALES_VELOCITY` | 30 | Sales Velocity Score |
| `MARKET_ADVANTAGE` | 31 | Market Advantage |
| `DAYS_LISTED` | 32 | Days Listed |
| `AI_CONFIDENCE` | 41 | AI Confidence |
| `VERDICT` | 42 | Verdict |
| `RECOMMENDED` | 44 | Recommended? |
| `NOTES` | 50 | Notes |

### New Turo-Specific Columns (Indices 61–70)

These 10 columns are defined in `TURO_DB_COLS` and `TURO_DB_HEADERS` as appended columns beyond the existing Master Database layout:

| Index | Constant Key | Header String | Purpose |
|---|---|---|---|
| 61 | `TURO_HOLD_SCORE` | Turo Hold Score | Weighted composite score (0–100) |
| 62 | `TURO_MONTHLY_NET` | Turo Monthly Net | Projected net monthly cash flow |
| 63 | `TURO_PAYBACK_MONTHS` | Turo Payback Months | Months to recover acquisition cost |
| 64 | `TURO_BREAKEVEN_UTIL` | Turo Break-Even Util % | Minimum utilization to break even |
| 65 | `TURO_RISK_TIER` | Turo Risk Tier | Low/Medium/High/Critical |
| 66 | `TURO_VS_FLIP_DELTA` | Turo vs Flip Delta | 12-month profit difference (Turo minus Flip) |
| 67 | `TURO_RECOMMENDED` | Turo Recommended? | Binary recommendation |
| 68 | `TURO_STATUS` | Turo Status | Lifecycle status string |
| 69 | `FLEET_ID` | Fleet ID | FK to Fleet Manager |
| 70 | `TURO_NOTES` | Turo Notes | Free-text notes |

### Column Gap Analysis

The existing `setupDatabaseHeaders()` in `main.gs` defines **60 columns** (indices 0–59: 50 original + 10 CRM fields at positions 51–60). The Turo config maps new columns starting at index 61.

**Assumed but not yet created:** These 10 columns (61–70) are not added by any existing function. The `setupDatabaseHeaders()` function in `main.gs` does not include them. No function exists to append them.

---

## 4) Configuration & Constants

### 4.1 `TURO_SHEETS` (line 14)

Defines 5 Google Sheets tabs for the Turo module. **Usage:** Referenced by nothing in `main.gs`. Not passed to `createQuantumSheets()`. These sheets will not be created by the existing system initialization flow.

### 4.2 `TURO_DB_COLS` (line 27)

Maps column indices for reading existing Master DB data and writing new Turo columns. **Usage:** No function reads this object. It is a reference map awaiting consumer code.

### 4.3 `TURO_DB_HEADERS` (line 81)

Array of 10 header strings for the new Master DB columns. **Usage:** No function calls this to append headers. Dead configuration.

### 4.4 `TURO_ENGINE_HEADERS` / `TE_COLS` (lines 98, 144)

39-column header array and matching index map for the Turo Engine sheet. **Usage:** No `setupTuroEngineHeaders()` function exists. Dead configuration.

### 4.5 `FLEET_MANAGER_HEADERS` (line 190)

26-column header array for Fleet Manager. **Usage:** No setup function exists. Dead configuration.

### 4.6 `MAINTENANCE_HEADERS` (line 223)

14-column header array. **Usage:** Dead configuration.

### 4.7 `INSURANCE_HEADERS` (line 244)

17-column header array. **Usage:** Dead configuration.

### 4.8 Picklists — `MAINTENANCE_TYPES`, `INSURANCE_TYPES`, `INSPECTION_STATUSES`, `TITLE_STATUSES` (lines 268–314)

Data validation lists for dropdown fields in Maintenance and Insurance sheets. **Usage:** No data validation rules are applied by any function.

### 4.9 `TURO_STATUSES` / `TURO_STATUS_TRANSITIONS` (lines 320–345)

8-state lifecycle machine with directed transition graph. **Usage:** No function enforces transitions. No `onEdit` trigger validates status changes.

### 4.10 `TURO_SCORE_WEIGHTS` (line 351)

6-dimension weight vector summing to 1.00:

| Dimension | Weight |
|---|---|
| Payback period | 0.25 |
| Cash flow | 0.25 |
| Utilization | 0.15 |
| Depreciation | 0.15 |
| Flip comparison | 0.10 |
| Mileage | 0.10 |

**Usage:** No scoring function exists to consume these weights.

### 4.11 `TURO_RISK_TIERS` (line 364)

| Tier | Score Range | Label | Description |
|---|---|---|---|
| LOW | 70–100 | Low | Strong Turo candidate |
| MEDIUM | 50–69 | Medium | Viable but monitor closely |
| HIGH | 30–49 | High | Consider flipping instead |
| CRITICAL | 0–29 | Critical | Do not Turo, flip or pass |

**Usage:** No function maps scores to tiers.

### 4.12 `DEPRECIATION_TIERS` / `TURO_DEPRECIATION_ADDON` (lines 376–387)

| Age Range | Base Annual Rate |
|---|---|
| 0–3 years | 15% |
| 4–7 years | 10% |
| 8–12 years | 7% |
| 13+ years | 4% |

Plus flat 2% annual add-on for Turo rental wear.

**Usage:** No depreciation calculation function exists.

### 4.13 `VEHICLE_CLASSES` + Classification Arrays (lines 393–502)

8 vehicle class labels + 9 classification arrays (23 luxury brands, 230+ model strings across Sports, Truck, SUV, Van, Economy, Midsize, Full-Size). **Usage:** No `classifyVehicle()` function exists to apply these lists.

### 4.14 `TURO_PRICING_DEFAULTS` (line 509)

Per-class default values:

| Class | Daily Rate | Utilization | Trip Length | Insurance/mo | Registration/yr | Cleaning/trip | Maint Reserve % | Flip Timeline (days) |
|---|---|---|---|---|---|---|---|---|
| Economy | $35 | 65% | 3 days | $150 | $200 | $25 | 5% | 14 |
| Midsize | $50 | 60% | 3 days | $175 | $250 | $30 | 5% | 21 |
| Full-Size | $60 | 55% | 4 days | $200 | $300 | $35 | 6% | 21 |
| SUV | $70 | 58% | 4 days | $225 | $350 | $40 | 6% | 28 |
| Truck | $65 | 52% | 3 days | $200 | $300 | $40 | 7% | 21 |
| Luxury | $120 | 45% | 2 days | $350 | $500 | $60 | 8% | 35 |
| Sports/Exotic | $175 | 35% | 2 days | $500 | $600 | $60 | 10% | 45 |
| Van/Minivan | $55 | 50% | 5 days | $175 | $275 | $35 | 6% | 30 |

**Usage:** No function reads these defaults to populate any sheet.

### 4.15 `SEASONAL_RATE_MULTIPLIERS` / `SEASONAL_UTIL_MULTIPLIERS` (lines 524–536)

12-month multiplier arrays (January = index 0). Rate multipliers range 0.80–1.25. Utilization multipliers range 0.75–1.20. Peak: July (index 6). Trough: January (index 0).

**Usage:** Gated behind `TURO_USE_SEASONAL` setting (default: `false`). No function applies these.

### 4.16 `TURO_SETTINGS_DEFAULTS` (line 542)

20 setting entries, each with `key`, `value`, `description`, `category`, `type`, `defaultVal`. All categorized as `'Turo'`. These are designed to be injected into the existing Settings sheet.

**Usage:** No function writes these to the Settings sheet. The existing `setupSettingsHeaders()` and settings infrastructure in `main.gs` does not reference them.

---

## 5) What Logic EXISTS

**No executable Turo logic exists.**

Specifically:

- `turo_config.gs` contains **zero function definitions**. Every line is a `const` declaration.
- `main.gs` contains **zero references** to any `TURO_*`, `TE_COLS`, `FLEET_MANAGER_*`, `MAINTENANCE_*`, `INSURANCE_*`, `DEPRECIATION_*`, `VEHICLE_CLASSES`, `LUXURY_BRANDS`, `*_MODELS`, `SEASONAL_*`, or `TURO_SETTINGS_DEFAULTS` constant.
- No function in `main.gs` calculates Turo metrics.
- No trigger in `main.gs` runs Turo logic.
- No automation in `main.gs` updates Turo status.
- The `onOpen()` menu in `main.gs` contains no Turo menu items.
- The `createQuantumSheets()` function iterates `QUANTUM_SHEETS` only — `TURO_SHEETS` is not included.
- The `deployQuantumHeaders()` function calls 20 `setup*Headers()` functions — none are Turo-related.
- The `initializeQuantumSystem()` function does not reference Turo.

---

## 6) What Is NOT Implemented (Critical)

### 6.1 Sheet Creation

No function creates the 5 Turo sheets (`Turo Engine`, `Fleet Manager`, `Maintenance & Turnovers`, `Turo Pricing & Seasonality`, `Insurance & Compliance`). Required:

- Register `TURO_SHEETS` entries in `createQuantumSheets()` or write a dedicated `createTuroSheets()` function.
- Write `setupTuroEngineHeaders()`, `setupFleetManagerHeaders()`, `setupMaintenanceHeaders()`, `setupPricingHeaders()`, `setupInsuranceHeaders()` functions.
- Call them from `deployQuantumHeaders()` or a new `deployTuroHeaders()`.

### 6.2 Master Database Column Extension

No function appends the 10 Turo columns (indices 61–70) to the Master Database. Required:

- Extend `setupDatabaseHeaders()` to include `TURO_DB_HEADERS` entries, or write a migration function.

### 6.3 Settings Registration

No function writes `TURO_SETTINGS_DEFAULTS` into the Settings sheet. Required:

- Inject 20 Turo settings rows into the existing Settings sheet during initialization.

### 6.4 Vehicle Classification Engine

No `classifyVehicle(make, model)` function exists. The 9 classification arrays (`LUXURY_BRANDS`, `SPORTS_MODELS`, `TRUCK_MODELS`, `SUV_MODELS`, `VAN_MODELS`, `ECONOMY_MODELS`, `MIDSIZE_MODELS`, `FULL_SIZE_MODELS`) and `VEHICLE_CLASSES` labels are defined but have no consumer. Required:

- A function that accepts `(make, model)` and returns a `VEHICLE_CLASSES` value using the classification arrays with proper priority ordering (Sports/Exotic overrides Luxury, etc.).

### 6.5 Turo Engine Calculations

No function implements the core Turo hold analysis. The following calculations are implied by the Turo Engine header structure but do not exist:

- `calculateTuroMetrics(vehicleData)` — Gross monthly revenue, expenses, net cash flow, payback period, break-even utilization
- `calculateTuroHoldScore(metrics)` — Weighted composite score using `TURO_SCORE_WEIGHTS`
- `assignRiskTier(score)` — Map score to `TURO_RISK_TIERS`
- `calculateDepreciation(vehicleAge, acquisitionCost)` — Apply `DEPRECIATION_TIERS` + `TURO_DEPRECIATION_ADDON`
- `calculateFinancingPayment(principal, apr, termMonths)` — Monthly payment if financed
- `generateRecommendation(metrics, score, tier)` — Strategy, rationale, exit plan
- `applySeasonalMultipliers(rate, utilization, month)` — Conditional on `TURO_USE_SEASONAL`

### 6.6 Turo Engine Population

No function populates the Turo Engine sheet from Master Database rows. Required:

- A function that reads qualifying vehicles from Master DB, runs them through the classification and calculation engines, and writes results to the Turo Engine sheet.

### 6.7 Master Database Write-Back

No function writes Turo results (score, monthly net, payback, risk tier, recommendation, status) back to Master DB columns 61–70. Required:

- A sync function that updates Master DB rows with Turo Engine outputs.

### 6.8 Fleet Manager Sync

No function moves vehicles from the Turo Engine to the Fleet Manager when status transitions to `Acquired` or `Listed`. Required:

- A function to create Fleet Manager rows from Turo Engine data.
- Revenue/expense aggregation logic from Maintenance sheet.

### 6.9 Lifecycle Status Enforcement

`TURO_STATUS_TRANSITIONS` defines valid transitions but no function enforces them. Required:

- An `onEdit` trigger or validation function that checks status changes against the transition map and rejects invalid transitions.

### 6.10 Data Validation / Picklist Application

Picklist constants (`MAINTENANCE_TYPES`, `INSURANCE_TYPES`, `INSPECTION_STATUSES`, `TITLE_STATUSES`) are defined but no function applies Google Sheets data validation rules to the relevant columns. Required:

- Data validation setup for each picklist column.

### 6.11 Pricing Sheet Population

No function populates the `Turo Pricing & Seasonality` sheet from `TURO_PRICING_DEFAULTS` and `SEASONAL_*_MULTIPLIERS`. The sheet has no defined header array. Required:

- Header definition.
- Population function.

### 6.12 Menu Integration

The `createQuantumMenu()` function in `main.gs` contains no Turo items. Required:

- Add a `Turo Operations` submenu with entries for running the Turo Engine, viewing Fleet Manager, managing maintenance, etc.

### 6.13 Trigger Registration

No installable or simple triggers exist for Turo logic. Required:

- Time-driven trigger for periodic Turo Engine recalculation.
- `onEdit` trigger for status transition enforcement.
- Optional trigger for Fleet Manager sync.

---

## 7) Dependencies & Assumptions

### 7.1 Assumptions About Existing Infrastructure

The Turo module assumes the following exist and function correctly in `main.gs`:

| Dependency | Location | Status |
|---|---|---|
| `QUANTUM_SHEETS.DATABASE` (Master Database sheet) | `main.gs:82` | Exists |
| `QUANTUM_SHEETS.SETTINGS` (Settings sheet) | `main.gs:91` | Exists |
| `setupDatabaseHeaders()` produces 60 columns (indices 0–60) | `main.gs:343` | Exists (60 columns verified) |
| `applyQuantumHeaders()` utility function | `main.gs:559` | Exists |
| `getQuantumSetting()` / `setQuantumSetting()` | `main.gs:4103` / `main.gs:4116` | Exist |
| `logQuantum()` logging utility | `main.gs:4132` | Exists |
| `generateQuantumId()` ID generator | `main.gs:4166` | Exists |
| Google Apps Script `SpreadsheetApp` runtime | GAS environment | Required |

### 7.2 Column Index Alignment

`TURO_DB_COLS` maps existing columns by hard-coded index. This creates **tight coupling** to the column order in `setupDatabaseHeaders()`. If columns are reordered, inserted, or removed in the Master Database, all Turo index references will silently break. There is no validation or dynamic column lookup.

Specific risks:

- Indices 4, 17, 18 are skipped in `TURO_DB_COLS` (Priority at 4, Location Risk at 17, Location Flag at 18). This is intentional — Turo does not need these fields. But any re-indexing of the Master DB would cascade.
- The gap between existing column 60 (Follow-up Status) and new Turo column 61 (Turo Hold Score) assumes no other module will claim indices 61+.

### 7.3 Vehicle Data Availability

The Turo Engine requires fields from Master DB that are populated by the existing import/analysis pipeline:

- `PRICE` (col 13) — From marketplace import
- `EST_REPAIR_COST` (col 23) — From condition analysis
- `MARKET_VALUE` (col 24) — From market valuation
- `YEAR` (col 5), `MAKE` (col 6), `MODEL` (col 7) — From vehicle parsing

If these fields are empty for a given row, Turo calculations will be incomplete. No null-handling strategy is defined.

### 7.4 No Cross-Module Function Coupling

`turo_config.gs` defines only constants. It does not call any `main.gs` function, and no `main.gs` function calls any Turo constant. The two files are **completely decoupled** at the code level. In a Google Apps Script project, all `.gs` files share a global scope, so the constants are technically accessible — but nothing accesses them.

---

## 8) Readiness Verdict

### **Configuration-only (not operational)**

The Turo add-on module is a well-structured, comprehensive configuration scaffold. It defines data models, column mappings, scoring parameters, lifecycle rules, vehicle classifications, and pricing defaults with sufficient specificity to serve as a complete blueprint for implementation.

However, **zero executable logic exists**. No sheets are created. No calculations run. No data flows. No triggers fire. The module cannot produce any output in its current state.

### Required Steps to Reach Operational Status

Listed in dependency order:

| Step | Description | Depends On |
|---|---|---|
| 1 | **Register Turo sheets** — Add `TURO_SHEETS` to sheet creation flow or write `createTuroSheets()` | — |
| 2 | **Deploy Turo headers** — Write setup functions for all 5 Turo sheets + append `TURO_DB_HEADERS` to Master DB | Step 1 |
| 3 | **Inject Turo settings** — Write `TURO_SETTINGS_DEFAULTS` into the Settings sheet | Step 1 |
| 4 | **Implement vehicle classifier** — `classifyVehicle(make, model)` using classification arrays | — |
| 5 | **Implement depreciation calculator** — Using `DEPRECIATION_TIERS` + `TURO_DEPRECIATION_ADDON` | — |
| 6 | **Implement Turo Engine calculations** — Revenue, expenses, cash flow, payback, break-even, scoring, risk tier, recommendation | Steps 4, 5 |
| 7 | **Implement Engine population** — Pull from Master DB, run calculations, write to Turo Engine sheet | Steps 2, 6 |
| 8 | **Implement Master DB write-back** — Sync Turo results to columns 61–70 | Steps 2, 7 |
| 9 | **Implement lifecycle enforcement** — `onEdit` trigger for `TURO_STATUS_TRANSITIONS` | Step 2 |
| 10 | **Implement Fleet Manager sync** — Create fleet rows on status transition to Acquired | Steps 2, 9 |
| 11 | **Apply data validation** — Picklists for Maintenance and Insurance sheets | Step 2 |
| 12 | **Populate Pricing sheet** — Write defaults and seasonal multipliers | Step 2 |
| 13 | **Add menu items** — Turo submenu in `createQuantumMenu()` | Steps 7, 8 |
| 14 | **Register triggers** — Time-driven recalculation, `onEdit` hooks | Steps 9, 13 |

---

*End of Turo Add-On Module Spec Pack*
*Generated from repository state at commit `450c629` (main branch, 2026-02-18)*
