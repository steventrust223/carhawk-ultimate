# CarHawk Ultimate -- Turo Rental Hold Add-On Module
## Spec Pack v1.0.0

---

### A) Module Overview

The Turo Module extends CarHawk Ultimate (Quantum-2.0.0) with rental fleet analysis capabilities. It enables dealers and car flippers to evaluate whether a vehicle should be held for Turo rental income rather than flipped immediately, providing a data-driven Flip vs. Hold decision framework.

**Architecture Role:** Additive module -- zero breaking changes to existing CarHawk core. All Turo logic lives in 7 dedicated `.gs` files plus minor integration hooks in `main.gs`. The module reads from the existing Master Database and writes results back to 10 new appended columns.

**Workflow Integration:**
1. Import deals via existing Quantum pipeline -> Master Database
2. Run Turo analysis (single or batch) from the menu
3. Turo Engine computes economics, scores, and recommendations
4. Results write to both Turo Engine sheet and Master Database writeback columns
5. Qualifying vehicles can be added to the Fleet Manager for ongoing tracking
6. Maintenance events and compliance alerts tracked separately
7. Nightly trigger auto-runs batch analysis and compliance checks

---

### B) Sheet Inventory

| # | Sheet Name | Columns | Tab Color | Purpose |
|---|-----------|---------|-----------|---------|
| 1 | Turo Engine | 39 (A-AM) | #00BCD4 (Teal) | Core analysis -- economics, scoring, recommendations |
| 2 | Fleet Manager | 26 (A-Z) | #4CAF50 (Green) | Active fleet tracking, financials, ROI |
| 3 | Maintenance & Turnovers | 14 (A-N) | #FF9800 (Orange) | Service logging, cost tracking, downtime |
| 4 | Turo Pricing & Seasonality | Matrix | #9C27B0 (Purple) | Base rates by class + seasonal multipliers |
| 5 | Insurance & Compliance | 17 (A-Q) | #F44336 (Red) | Registration, insurance, inspection tracking |

---

### C) Schema -- Exact Headers Per Sheet

#### Turo Engine (39 columns)
| Col | Header | Type | Calc/Manual |
|-----|--------|------|-------------|
| A | Row ID | String | CALC (MD-{row}) |
| B | VIN | String | COPY from MD |
| C | Vehicle | String | CALC (Year Make Model Trim) |
| D | Vehicle Class | String | CALC (classifyVehicle) |
| E | Asking Price | Currency | COPY from MD |
| F | Estimated Repair Cost | Currency | COPY from MD |
| G | Total Acquisition Cost | Currency | CALC (E+F) |
| H | Estimated Resale Value | Currency | COPY from MD |
| I | Flip Net Profit | Currency | COPY from MD |
| J | Flip Timeline (days) | Integer | LOOKUP from pricing |
| K | Daily Rate | Currency | LOOKUP/OVERRIDE |
| L | Utilization % | Percent | LOOKUP/OVERRIDE |
| M | Gross Monthly Revenue | Currency | CALC (K x 30.44 x L) |
| N | Turo Platform Fee % | Percent | SETTINGS |
| O | Turo Platform Fee $ | Currency | CALC (M x N) |
| P | Insurance Monthly | Currency | LOOKUP/OVERRIDE |
| Q | Cleaning Per Trip | Currency | SETTINGS |
| R | Trips Per Month | Decimal | CALC |
| S | Total Cleaning Monthly | Currency | CALC (Q x R) |
| T | Maintenance Reserve Monthly | Currency | CALC |
| U | Depreciation Monthly | Currency | CALC |
| V | Financing Payment Monthly | Currency | CALC (PMT) |
| W | Registration & Tax Monthly | Currency | CALC |
| X | Total Monthly Expenses | Currency | CALC (sum O-W) |
| Y | Net Monthly Cash Flow | Currency | CALC (M - X) |
| Z | Net Annual Cash Flow | Currency | CALC (Y x 12) |
| AA | Payback Months | Decimal | CALC (G / Y) |
| AB | Break-Even Utilization % | Percent | CALC |
| AC | 12-Month Total Profit (Turo) | Currency | CALC |
| AD | 12-Month Total Profit (Flip) | Currency | COPY |
| AE | Turo vs Flip Delta | Currency | CALC (AC - AD) |
| AF | Turo Hold Score | Integer | CALC (0-100) |
| AG | Risk Tier | String | CALC |
| AH | Recommended Strategy | String | CALC |
| AI | Rationale | String | CALC |
| AJ | Exit Plan | String | CALC |
| AK | Turo Status | String | MANUAL/CALC |
| AL | Date Evaluated | Date | CALC (now) |
| AM | Override? | Boolean | MANUAL |

#### Fleet Manager (26 columns)
| Col | Header | Type |
|-----|--------|------|
| A | Fleet ID | String (TF-NNN) |
| B | VIN | String |
| C | Vehicle | String |
| D | Vehicle Class | String |
| E | Turo Status | Dropdown |
| F | Date Acquired | Date |
| G | Date Listed on Turo | Date |
| H | Acquisition Cost | Currency |
| I | Total Revenue to Date | Currency |
| J | Total Expenses to Date | Currency |
| K | Net Profit to Date | Currency (CALC) |
| L | ROI to Date % | Percent (CALC) |
| M | Months Active | Integer (CALC) |
| N | Avg Monthly Revenue | Currency (CALC) |
| O | Avg Monthly Net | Currency (CALC) |
| P | Utilization to Date % | Percent |
| Q | Trips to Date | Integer |
| R | Avg Trip Length (days) | Decimal |
| S | Current Daily Rate | Currency |
| T | Monthly Insurance | Currency |
| U | Last Service Date | Date |
| V | Next Service Due | Date |
| W | Current Estimated Value | Currency (CALC) |
| X | Projected Payoff Date | Date (CALC) |
| Y | On Track? | String (CALC) |
| Z | Fleet Notes | String |

#### Maintenance & Turnovers (14 columns)
| Col | Header | Type |
|-----|--------|------|
| A | Log ID | String (MT-NNN) |
| B | Fleet ID | String |
| C | Vehicle | String |
| D | Date | Date |
| E | Type | Dropdown |
| F | Description | String |
| G | Cost | Currency |
| H | Vendor | String |
| I | Mileage at Service | Integer |
| J | Downtime Days | Integer |
| K | Next Service Type | Dropdown |
| L | Next Service Date | Date |
| M | Next Service Mileage | Integer |
| N | Notes | String |

Rows 2-5 contain summary formulas (Total Spend, Total Downtime, Avg Cost, Avg Downtime).

#### Insurance & Compliance (17 columns)
| Col | Header | Type |
|-----|--------|------|
| A | Fleet ID | String |
| B | Vehicle | String |
| C | Registration State | String |
| D | Registration Expiry | Date |
| E | Registration Cost | Currency |
| F | Insurance Provider | String |
| G | Insurance Policy # | String |
| H | Insurance Expiry | Date |
| I | Insurance Monthly Premium | Currency |
| J | Insurance Type | Dropdown |
| K | Inspection Due | Date |
| L | Inspection Status | Dropdown |
| M | Emissions Due | Date |
| N | Annual Property Tax | Currency |
| O | LLC/Business Entity | String |
| P | Title Status | Dropdown |
| Q | Compliance Notes | String |

---

### D) New Master Database Columns (BJ-BS)

| Col | Header | Type | Source |
|-----|--------|------|--------|
| BJ | Turo Hold Score | Integer (0-100) | CALC by Turo Engine |
| BK | Turo Monthly Net | Currency | CALC by Turo Engine |
| BL | Turo Payback Months | Decimal | CALC by Turo Engine |
| BM | Turo Break-Even Util % | Percent | CALC by Turo Engine |
| BN | Turo Risk Tier | String | CALC by Turo Engine |
| BO | Turo vs Flip Delta | Currency | CALC by Turo Engine |
| BP | Turo Recommended? | String | CALC by Turo Engine |
| BQ | Turo Status | String | CALC/MANUAL |
| BR | Fleet ID | String | Set by addToFleet() |
| BS | Turo Notes | String | MANUAL |

---

### E) Turo Engine -- Formulas & Logic

#### Gross Monthly Revenue
```
grossMonthlyRevenue = dailyRate x 30.44 x utilization
```

#### Platform Fee
```
platformFeeAmt = grossMonthlyRevenue x platformFeePct (default 25%)
```

#### Total Monthly Expenses
```
totalMonthlyExpenses = platformFee + insurance + cleaning + maintenance + depreciation + financing + registration
```

#### Net Monthly Cash Flow
```
netMonthlyCashFlow = grossMonthlyRevenue - totalMonthlyExpenses
```

#### Payback Months
```
paybackMonths = totalAcquisitionCost / netMonthlyCashFlow (Infinity if negative)
```

#### Break-Even Utilization
```
breakEvenUtilization = fixedMonthlyExpenses / (dailyRate x 30.44 x (1 - platformFeePct) - cleaningPerMonth)
```

#### 12-Month Comparison
```
turo12MonthProfit = (netMonthlyCashFlow x 12) + depreciatedResale12 - totalAcquisitionCost
flip12MonthProfit = flipNetProfit (one-time)
turoVsFlipDelta = turo12MonthProfit - flip12MonthProfit
```

#### Turo Hold Score (0-100)
Weighted composite of 6 sub-scores:

| Component | Weight | Sub-Score Formula |
|-----------|--------|-------------------|
| Payback | 0.25 | max(0, 100 - paybackMonths x 4) |
| Cash Flow | 0.25 | min(100, netMonthlyCashFlow / 5) |
| Utilization | 0.15 | utilization x 100 |
| Depreciation | 0.15 | max(0, 100 - annualDepRate x 500) |
| Flip Comparison | 0.10 | 100 if delta > 0, else max(0, 100 - |delta|/20) |
| Mileage | 0.10 | max(0, 100 - mileage/2000) |

#### Risk Tiers
| Score Range | Tier | Description |
|------------|------|-------------|
| 70-100 | Low | Strong Turo candidate |
| 50-69 | Medium | Viable but monitor |
| 30-49 | High | Consider flipping |
| 0-29 | Critical | Do not Turo |

#### Flip Strategy Override Rules
- Score >= 70 AND delta > 0: Set Flip Strategy to "Turo Hold"
- Score >= 50 AND delta > -500: Keep existing strategy (marginal)
- Below 50: Keep existing strategy (flip is better)
- Override? checkbox prevents any automatic changes

#### Turo Recommended? Labels
- "YES -- Turo Hold": score >= 70 AND delta > 0
- "MARGINAL": score >= 50 AND delta > -500
- "INSUFFICIENT DATA": missing price or resale data
- "NO -- Flip Better": all other cases

---

### F) Vehicle Classification Logic

Priority order (first match wins):
1. **Luxury**: Make in LUXURY_BRANDS list (24 brands)
2. **Sports/Exotic**: Model matches SPORTS_MODELS list (50+ models)
3. **Truck**: Model matches TRUCK_MODELS list
4. **SUV**: Model matches SUV_MODELS list
5. **Van/Minivan**: Model matches VAN_MODELS list
6. **Economy**: Model matches ECONOMY_MODELS list
7. **Full-Size**: Model matches FULL_SIZE_MODELS list
8. **Midsize**: Model matches MIDSIZE_MODELS list
9. **Body Type Fallback**: truck/pickup -> Truck, suv/crossover -> SUV, van/minivan -> Van/Minivan, hatchback -> Economy
10. **Default**: Midsize

---

### G) Fleet Lifecycle Model

```
Candidate -> Acquired -> Listed -> Active -> In Maintenance
                |           |        |           |
                |           |        +-> Paused   +-> Paused
                |           |        |               |
                |           +--------+-> Retired     +-> Active
                |                                    +-> Retired
                +-> Retired
                                                Retired -> Sold (terminal)
```

Valid transitions:
| From | Valid Next States |
|------|-------------------|
| Candidate | Acquired |
| Acquired | Listed, Retired |
| Listed | Active, Paused, Retired |
| Active | In Maintenance, Paused, Retired |
| In Maintenance | Active, Paused, Retired |
| Paused | Active, Listed, Retired |
| Retired | Sold |
| Sold | (terminal) |

---

### H) Settings Keys & Defaults

| Key | Default | Description |
|-----|---------|-------------|
| TURO_PLATFORM_FEE_PCT | 0.25 | Turo's host cut (25% for Go plan) |
| TURO_PROTECTION_PLAN | Go | Go (25%), Standard (15%), Premium (10%) |
| TURO_AVG_TRIP_LENGTH | 3 | Average trip length in days |
| TURO_CLEANING_PER_TRIP | 30 | Cleaning cost between renters |
| TURO_MAINTENANCE_RESERVE_PCT | 0.06 | Annual maintenance reserve % |
| TURO_DEPRECIATION_MODEL | Tiered | Tiered (by age), Straight-Line, or None |
| TURO_RENTAL_DEPRECIATION_ADD | 0.02 | Additional annual dep from rental wear |
| TURO_FINANCING_APR | 0 | 0 = cash purchase |
| TURO_FINANCING_TERM | 0 | 0 = cash, else months |
| TURO_ANNUAL_REGISTRATION | 275 | Average annual registration cost |
| TURO_ANNUAL_INSPECTION | 50 | State inspection cost |
| TURO_USE_SEASONAL | false | Apply monthly seasonal multipliers |
| TURO_MIN_SCORE | 50 | Minimum acceptable Turo score |
| TURO_WEIGHT_PAYBACK | 0.25 | Score weight: payback |
| TURO_WEIGHT_CASHFLOW | 0.25 | Score weight: cash flow |
| TURO_WEIGHT_UTILIZATION | 0.15 | Score weight: utilization |
| TURO_WEIGHT_DEPRECIATION | 0.15 | Score weight: depreciation |
| TURO_WEIGHT_FLIP_COMPARISON | 0.10 | Score weight: flip comparison |
| TURO_WEIGHT_MILEAGE | 0.10 | Score weight: mileage |
| TURO_MODULE_ENABLED | true | Master toggle for Turo module |

---

### I) Turo Pricing & Seasonality Defaults

#### Base Rates by Vehicle Class
| Class | Daily Rate | Util % | Trip Len | Insurance/mo | Reg/yr | Clean/trip | Maint % | Flip Days |
|-------|-----------|--------|----------|-------------|--------|-----------|---------|-----------|
| Economy | $35 | 65% | 3 | $150 | $200 | $25 | 5% | 14 |
| Midsize | $50 | 60% | 3 | $175 | $250 | $30 | 5% | 21 |
| Full-Size | $60 | 55% | 4 | $200 | $300 | $35 | 6% | 21 |
| SUV | $70 | 58% | 4 | $225 | $350 | $40 | 6% | 28 |
| Truck | $65 | 52% | 3 | $200 | $300 | $40 | 7% | 21 |
| Luxury | $120 | 45% | 2 | $350 | $500 | $60 | 8% | 35 |
| Sports/Exotic | $175 | 35% | 2 | $500 | $600 | $60 | 10% | 45 |
| Van/Minivan | $55 | 50% | 5 | $175 | $275 | $35 | 6% | 30 |

#### Seasonal Multipliers
| | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec |
|---|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| Rate | 0.80 | 0.85 | 0.90 | 1.00 | 1.10 | 1.20 | 1.25 | 1.20 | 1.00 | 0.90 | 0.85 | 0.95 |
| Util | 0.75 | 0.80 | 0.90 | 1.00 | 1.10 | 1.15 | 1.20 | 1.15 | 1.00 | 0.85 | 0.80 | 0.90 |

---

### J) Menu Commands

| # | Menu Item | Function |
|---|-----------|----------|
| 1 | Analyze Selected Deal for Turo | `analyzeTuroSelected` |
| 2 | Batch Analyze All Turo Candidates | `batchAnalyzeTuro` |
| 3 | Refresh Fleet Dashboard | `refreshFleetManager` |
| 4 | Add Vehicle to Fleet | `addToFleetSelected` |
| 5 | Update Fleet Financials | `updateFleetFinancials` |
| 6 | Log Maintenance Event | `logMaintenanceEvent` |
| 7 | Check Compliance Alerts | `checkComplianceAlerts` |
| 8 | Setup Turo Module | `setupTuroModule` |

All items are under the "Turo Module" submenu within the main "CarHawk Ultimate" menu.

---

### K) Triggers & Automation

#### Nightly Trigger Extension
Added to `quantumDailyAnalysis()`:
- `batchAnalyzeTuro()` -- Re-analyzes all qualifying candidates
- `checkComplianceAlerts()` -- Scans for expiring registrations, insurance, inspections

Only runs if the Turo Engine sheet exists (module installed check).

---

### L) CRM Field Mapping

When Flip Strategy = "Turo Hold", the CompanyHub export includes:

| CRM Field | Source |
|-----------|--------|
| turoHoldScore | Master DB: Turo Hold Score |
| turoMonthlyNet | Master DB: Turo Monthly Net |
| turoPaybackMonths | Master DB: Turo Payback Months |
| turoRiskTier | Master DB: Turo Risk Tier |
| turoStatus | Master DB: Turo Status |
| fleetId | Master DB: Fleet ID |

Plus all existing 16 CompanyHub fields (Company, Contact, Phone, Email, Deal Name, Deal Value, Expected Profit, ROI%, Stage, Probability, Expected Close Date, Lead Score, Source, Location, Distance, Days on Market, Contact Attempts, Response Rate, Tags).

---

### M) GAS File Inventory

| File | Lines | Purpose |
|------|-------|---------|
| `turo_config.gs` | 563 | Constants, vehicle classification maps, column indices, picklists, defaults |
| `turo_setup.gs` | 603 | Idempotent sheet creation, MD column append, settings injection |
| `turo_engine.gs` | 872 | Core analysis: classification, economics, scoring, writeback |
| `turo_fleet.gs` | 448 | Fleet management: add vehicles, refresh financials, lifecycle |
| `turo_maintenance.gs` | 239 | Maintenance event logging with HTML dialog |
| `turo_compliance.gs` | 235 | Insurance/compliance alerts, email notifications |
| `turo_tests.gs` | 565 | 7 acceptance tests with master runner |
| **Total** | **3,525** | |

Modified existing file:
- `main.gs` -- Added Turo submenu (9 items), nightly trigger extension, CRM export extension

---

### N) Implementation Status

- [x] Configuration constants and vehicle classification maps (`turo_config.gs`)
- [x] Idempotent sheet setup with headers, formatting, validation (`turo_setup.gs`)
- [x] Vehicle classification algorithm (8 classes, 300+ models) (`turo_engine.gs`)
- [x] Turo economics computation with full expense breakdown (`turo_engine.gs`)
- [x] Turo Hold Score with 6 weighted sub-scores (`turo_engine.gs`)
- [x] Risk tier classification (Low/Medium/High/Critical) (`turo_engine.gs`)
- [x] Recommended Strategy with override protection (`turo_engine.gs`)
- [x] Rationale and Exit Plan generation (`turo_engine.gs`)
- [x] Single-row and batch analysis (`turo_engine.gs`)
- [x] Master Database writeback (10 columns) (`turo_engine.gs`)
- [x] Fleet ID generation (TF-NNN) (`turo_fleet.gs`)
- [x] Add to Fleet with Insurance & Compliance row creation (`turo_fleet.gs`)
- [x] Fleet Manager refresh with ROI, On Track?, depreciation (`turo_fleet.gs`)
- [x] Status lifecycle validation (`turo_fleet.gs`)
- [x] Maintenance event HTML dialog with dropdowns (`turo_maintenance.gs`)
- [x] Compliance alert scanning (60-day insurance/reg, 30-day inspection) (`turo_compliance.gs`)
- [x] Compliance email notifications (`turo_compliance.gs`)
- [x] Menu integration (8 items under Turo Module submenu) (`main.gs`)
- [x] Nightly trigger extension (`main.gs`)
- [x] CRM export Turo field enrichment (`main.gs`)
- [x] Settings injection (20 configurable settings) (`turo_setup.gs`)
- [x] Conditional formatting (Risk Tier, Turo Status, On Track?) (`turo_setup.gs`)
- [x] Data validation dropdowns (status, maintenance types, insurance types) (`turo_setup.gs`)
- [x] Acceptance test suite (7 tests) (`turo_tests.gs`)
- [x] Structured logging to Activity Logs sheet (all modules)
- [x] LockService for concurrent access protection (all write operations)
- [x] TURO_SPEC_PACK.md documentation

---

### O) Acceptance Test Results

Tests are designed to run in a live Google Sheets environment via the Apps Script editor.
Run `runAllTuroTests()` from the script editor to execute all 7 tests:

| # | Test | What It Validates |
|---|------|-------------------|
| 1 | testSetupIdempotent | Setup runs twice without duplicating sheets/columns/settings |
| 2 | testVehicleClassification | 8 vehicle classification cases (Luxury, Midsize, Economy, Truck, SUV, Sports, Van, Full-Size) |
| 3 | testTuroEngineAnalysis | Full analysis pipeline: economics, score, tier, rationale, writeback |
| 4 | testFleetCreation | Fleet ID generation, Fleet Manager row, Insurance row, MD writeback |
| 5 | testMasterDbIntegrity | Existing columns unchanged, Turo columns appended correctly, no duplicates |
| 6 | testScoreWeights | Score weights sum to 1.0 |
| 7 | testLifecycleValidation | 6 status transition cases (valid and invalid) |

---

### P) Remaining Integration Work

#### For Full CRM Sync
- CompanyHub API integration for real-time Turo field push (currently CSV export)
- SMS-iT template for Turo Hold notification to buyers

#### For Live Spreadsheet Testing
- Run `setupTuroModule()` on a production spreadsheet with real deal data
- Run `runAllTuroTests()` to validate in the GAS runtime environment
- Verify conditional formatting renders correctly in Google Sheets
- Test the Maintenance Event HTML dialog in the Sheets UI
- Verify email delivery for compliance alerts

#### Future Enhancements
- Turo API integration for real revenue/booking data import
- Automated daily rate adjustment based on market data
- Fleet performance dashboards with charts
- Multi-market pricing support (different cities)
- Integration with fleet insurance providers for automated renewal tracking
