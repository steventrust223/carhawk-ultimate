# CARHAWK TURO ADD-ON MODULE — SPEC PACK

> **Version:** TURO-ADDON-1.0.0
> **Base System:** CarHawk Ultimate Quantum-2.0.0
> **Date Generated:** 2026-02-17
> **Spec Type:** DESIGN SPEC, NOT YET IN WORKBOOK

---

## 1. IMPLEMENTATION STATUS

| Field | Value |
|---|---|
| **Module Name** | Turo Add-On Module |
| **Status** | **NOT IMPLEMENTED** |
| **Codebase Searched** | `main.gs` (6,174 lines), all branches, all commits |
| **Turo Code Found** | None — zero references to "Turo", "fleet", "rental", "utilization", "car-sharing", or "P2P" in any source file |
| **Branches Checked** | `master`, `remotes/origin/main`, `claude/turo-addon-spec-pack-IU3jG` (identical to master) |
| **Conclusion** | No Turo module exists in any branch or commit. This spec pack is a **DESIGN SPEC** based on the intended Turo fleet lifecycle integrated with the existing Quantum-2.0.0 architecture. |

The existing CarHawk system is a vehicle **flip/wholesale deal analyzer** with CRM. The Turo Add-On module extends it to support vehicles held for **peer-to-peer rental income** via the Turo platform, tracking fleet lifecycle, utilization, revenue, expenses, maintenance, and payback.

---

## 2. SHEETS ADDED OR MODIFIED

| Sheet Name | Purpose | New/Modified | Key Outputs |
|---|---|---|---|
| **Turo Fleet** | Master fleet registry — one row per vehicle in the Turo fleet | **New** | Vehicle ID, Turo Status, Acquisition Cost, Current Market Value, Turo Listing URL, Payback Months, Fleet Performance Flag |
| **Turo Revenue** | Monthly revenue log per vehicle | **New** | Monthly Gross Revenue, Trip Count, Avg Daily Rate, Utilization %, Revenue YTD |
| **Turo Expenses** | Monthly expense log per vehicle | **New** | Insurance, Maintenance, Depreciation, Cleaning, Tolls, Platform Fees, Total Monthly Expense |
| **Turo Cashflow** | Monthly net cash flow rollup per vehicle | **New** | Monthly Net Cash Flow, Cumulative Cash Flow, Payback Progress %, Months to Payback, ROI to Date |
| **Turo Maintenance** | Maintenance scheduling and service history | **New** | Next Service Due, Last Service Date, Service Type, Cost, Vendor, Odometer at Service |
| **Master Database** | Add Turo disposition columns to existing vehicle records | **Modified** | Turo Status, Turo Vehicle ID (new FK linking to Turo Fleet) |
| **Settings** | Add Turo-specific configuration keys | **Modified** | TURO_* settings keys |
| **Integrations** | Add Turo API integration entry | **Modified** | Turo API sync status and credentials |

---

## 3. COLUMN-LEVEL SCHEMA

### 3.1 Turo Fleet (NEW SHEET)

Primary Key: `Vehicle ID`
Foreign Keys: `Deal ID` → Master Database, `VIN` → Master Database

| # | Column Header | Type | Description |
|---|---|---|---|
| 1 | Vehicle ID | System | Auto-generated unique ID (TURO-0001, TURO-0002, ...) |
| 2 | Deal ID | Manual | FK to Master Database Deal ID (vehicle's original acquisition record) |
| 3 | VIN | Manual | Vehicle Identification Number (FK to Master Database) |
| 4 | Year | Manual | Model year |
| 5 | Make | Manual | Manufacturer |
| 6 | Model | Manual | Model name |
| 7 | Trim | Manual | Trim level |
| 8 | Color | Manual | Exterior color |
| 9 | Mileage at Acquisition | Manual | Odometer reading when acquired |
| 10 | Current Mileage | Manual | Current odometer reading (updated periodically) |
| 11 | Turo Status | Manual | Lifecycle status — see lifecycle values below |
| 12 | Turo Listing URL | Manual | Direct URL to the Turo listing |
| 13 | Turo Vehicle Slug | Manual | Turo platform vehicle identifier/slug |
| 14 | Date Acquired | Manual | Date vehicle was purchased |
| 15 | Date Listed on Turo | Manual | Date vehicle went live on Turo |
| 16 | Date Delisted | Manual | Date vehicle was removed from Turo (if applicable) |
| 17 | Date Sold / Disposed | Manual | Date vehicle was sold or otherwise disposed |
| 18 | Acquisition Cost | Manual | Total purchase price including transport, fees |
| 19 | Prep Cost | Manual | Detail, photos, minor repairs before listing |
| 20 | Total Basis | Calculated | = Acquisition Cost + Prep Cost |
| 21 | Current Market Value | Manual | Estimated current resale value |
| 22 | Depreciation to Date | Calculated | = Total Basis - Current Market Value |
| 23 | Daily Rate | Manual | Current Turo daily rental rate |
| 24 | Weekly Discount % | Manual | Turo weekly trip discount percentage |
| 25 | Monthly Discount % | Manual | Turo monthly trip discount percentage |
| 26 | Insurance Policy | Manual | Insurance provider and policy number |
| 27 | Insurance Monthly Cost | Manual | Monthly insurance premium |
| 28 | Insurance Expiry | Manual | Insurance policy expiration date |
| 29 | Registration Expiry | Manual | Vehicle registration expiration date |
| 30 | Last Service Date | Calculated | Pulled from latest Turo Maintenance record for this Vehicle ID |
| 31 | Next Service Due | Calculated | Pulled from Turo Maintenance schedule for this Vehicle ID |
| 32 | Lifetime Revenue | Calculated | SUM of Monthly Gross Revenue from Turo Revenue for this Vehicle ID |
| 33 | Lifetime Expenses | Calculated | SUM of Total Monthly Expense from Turo Expenses for this Vehicle ID |
| 34 | Lifetime Net Cash Flow | Calculated | = Lifetime Revenue - Lifetime Expenses |
| 35 | Payback Months | Calculated | Total Basis / Avg Monthly Net Cash Flow (from Turo Cashflow) |
| 36 | Months Active | Calculated | DATEDIF(Date Listed on Turo, TODAY(), "M") |
| 37 | Payback Progress % | Calculated | = Lifetime Net Cash Flow / Total Basis * 100 |
| 38 | Fleet Performance Flag | Calculated | ON TRACK / BEHIND / UNDERWATER — see flag logic below |
| 39 | Avg Monthly Utilization % | Calculated | AVG of Utilization % from Turo Revenue for this Vehicle ID |
| 40 | Avg Daily Rate Effective | Calculated | Lifetime Revenue / Total Rental Days |
| 41 | Location | Manual | Vehicle home/pickup location |
| 42 | Assigned To | Manual | Fleet manager or operator name |
| 43 | Notes | Manual | Free-text notes |
| 44 | Last Updated | System | Timestamp of last row modification |

**Turo Status Lifecycle Values (ordered):**

| Status Value | Meaning |
|---|---|
| `ACQUIRED` | Vehicle purchased, not yet prepped |
| `PREPPING` | Being detailed, photographed, minor repairs |
| `LISTED` | Live on Turo, accepting bookings |
| `BOOKED` | Currently on an active trip |
| `AVAILABLE` | Listed and idle, awaiting next booking |
| `MAINTENANCE` | Temporarily offline for scheduled/unscheduled service |
| `SUSPENDED` | Delisted by host or platform (insurance lapse, violation, etc.) |
| `DELISTED` | Intentionally removed from Turo (seasonal, strategic) |
| `SELLING` | Listed for sale, exiting fleet |
| `SOLD` | Disposed — vehicle no longer in fleet |

**Fleet Performance Flag Logic:**

| Flag | Condition |
|---|---|
| `ON TRACK` | Payback Progress % >= (Months Active / Payback Months) * 100 |
| `BEHIND` | Payback Progress % < (Months Active / Payback Months) * 100 AND Payback Progress % >= 50% of expected |
| `UNDERWATER` | Payback Progress % < 50% of expected OR Lifetime Net Cash Flow < 0 after 3+ months |

---

### 3.2 Turo Revenue (NEW SHEET)

Primary Key: Composite (`Vehicle ID` + `Month`)
Foreign Key: `Vehicle ID` → Turo Fleet

| # | Column Header | Type | Description |
|---|---|---|---|
| 1 | Revenue ID | System | Auto-generated (REV-0001, REV-0002, ...) |
| 2 | Vehicle ID | Manual | FK to Turo Fleet |
| 3 | Month | Manual | YYYY-MM format |
| 4 | Trip Count | Manual | Number of completed trips in the month |
| 5 | Rental Days | Manual | Total days the vehicle was rented |
| 6 | Days in Month | Calculated | Calendar days in the month |
| 7 | Utilization % | Calculated | = (Rental Days / Days in Month) * 100 |
| 8 | Gross Booking Revenue | Manual | Total booking revenue before Turo fees |
| 9 | Turo Platform Fee | Manual | Turo's commission/fee deducted |
| 10 | Turo Trip Fee Revenue | Manual | Any trip fee add-ons (delivery, extras) |
| 11 | Monthly Gross Revenue | Calculated | = Gross Booking Revenue - Turo Platform Fee + Turo Trip Fee Revenue |
| 12 | Avg Daily Rate | Calculated | = Monthly Gross Revenue / Rental Days |
| 13 | Revenue YTD | Calculated | Running sum of Monthly Gross Revenue for current year |
| 14 | vs Previous Month | Calculated | = (Current Monthly Gross Revenue - Previous Month) / Previous Month * 100 |
| 15 | Notes | Manual | Free-text notes |
| 16 | Last Updated | System | Timestamp of last row modification |

---

### 3.3 Turo Expenses (NEW SHEET)

Primary Key: Composite (`Vehicle ID` + `Month`)
Foreign Key: `Vehicle ID` → Turo Fleet

| # | Column Header | Type | Description |
|---|---|---|---|
| 1 | Expense ID | System | Auto-generated (EXP-0001, EXP-0002, ...) |
| 2 | Vehicle ID | Manual | FK to Turo Fleet |
| 3 | Month | Manual | YYYY-MM format |
| 4 | Insurance | Manual | Monthly insurance cost |
| 5 | Loan/Financing | Manual | Monthly loan or financing payment |
| 6 | Maintenance & Repairs | Calculated | SUM from Turo Maintenance for this Vehicle ID + Month |
| 7 | Cleaning & Detail | Manual | Monthly cleaning/detailing costs |
| 8 | Fuel / Charging | Manual | Fuel or EV charging costs (host-side) |
| 9 | Parking / Storage | Manual | Monthly parking or storage fees |
| 10 | Tolls & Tickets | Manual | Tolls, tickets, fines |
| 11 | Depreciation | Calculated | (Total Basis - Current Market Value) / Months Active — monthly amortization |
| 12 | Registration & Taxes | Manual | Prorated monthly registration, property tax |
| 13 | Turo Protection Plan | Manual | Cost of Turo host protection plan (if paying separately) |
| 14 | Miscellaneous | Manual | Any other costs |
| 15 | Total Monthly Expense | Calculated | SUM of columns 4-14 |
| 16 | vs Previous Month | Calculated | = (Current Total - Previous Month Total) / Previous Month Total * 100 |
| 17 | Notes | Manual | Free-text notes |
| 18 | Last Updated | System | Timestamp of last row modification |

---

### 3.4 Turo Cashflow (NEW SHEET)

Primary Key: Composite (`Vehicle ID` + `Month`)
Foreign Keys: `Vehicle ID` → Turo Fleet, references Turo Revenue + Turo Expenses

| # | Column Header | Type | Description |
|---|---|---|---|
| 1 | Cashflow ID | System | Auto-generated (CF-0001, CF-0002, ...) |
| 2 | Vehicle ID | Manual | FK to Turo Fleet |
| 3 | Month | Manual | YYYY-MM format |
| 4 | Monthly Revenue | Calculated | = Monthly Gross Revenue from Turo Revenue for this Vehicle ID + Month |
| 5 | Monthly Expenses | Calculated | = Total Monthly Expense from Turo Expenses for this Vehicle ID + Month |
| 6 | Monthly Net Cash Flow | Calculated | = Monthly Revenue - Monthly Expenses |
| 7 | Cumulative Cash Flow | Calculated | Running sum of Monthly Net Cash Flow for this Vehicle ID, all months |
| 8 | Total Basis | Calculated | Pulled from Turo Fleet Total Basis for this Vehicle ID |
| 9 | Payback Progress % | Calculated | = Cumulative Cash Flow / Total Basis * 100 |
| 10 | Months Active | Calculated | Count of months since first revenue month for this Vehicle ID |
| 11 | Avg Monthly Net | Calculated | = Cumulative Cash Flow / Months Active |
| 12 | Est Months to Payback | Calculated | = (Total Basis - Cumulative Cash Flow) / Avg Monthly Net (if Avg Monthly Net > 0, else "N/A") |
| 13 | ROI to Date % | Calculated | = Cumulative Cash Flow / Total Basis * 100 |
| 14 | Annualized ROI % | Calculated | = (ROI to Date % / Months Active) * 12 |
| 15 | Fleet Performance Flag | Calculated | Same logic as Turo Fleet flag, recalculated per month |
| 16 | Notes | Manual | Free-text notes |
| 17 | Last Updated | System | Timestamp of last row modification |

---

### 3.5 Turo Maintenance (NEW SHEET)

Primary Key: `Service ID`
Foreign Key: `Vehicle ID` → Turo Fleet

| # | Column Header | Type | Description |
|---|---|---|---|
| 1 | Service ID | System | Auto-generated (SVC-0001, SVC-0002, ...) |
| 2 | Vehicle ID | Manual | FK to Turo Fleet |
| 3 | Service Date | Manual | Date service was performed |
| 4 | Service Type | Manual | OIL_CHANGE / TIRE_ROTATION / BRAKE_SERVICE / TRANSMISSION / ENGINE / BODY / DETAIL / INSPECTION / OTHER |
| 5 | Description | Manual | Free-text description of work performed |
| 6 | Vendor | Manual | Service provider name |
| 7 | Odometer at Service | Manual | Mileage at time of service |
| 8 | Parts Cost | Manual | Cost of parts |
| 9 | Labor Cost | Manual | Cost of labor |
| 10 | Total Cost | Calculated | = Parts Cost + Labor Cost |
| 11 | Paid By | Manual | HOST / WARRANTY / INSURANCE / TURO_CLAIM |
| 12 | Receipt URL | Manual | Link to receipt or invoice |
| 13 | Next Service Type | Manual | Scheduled next service type |
| 14 | Next Service Due Date | Manual | Date next service is due |
| 15 | Next Service Due Mileage | Manual | Mileage at which next service is due |
| 16 | Service Interval Miles | Manual | Miles between this service type (e.g., 5000 for oil changes) |
| 17 | Service Interval Months | Manual | Months between this service type (e.g., 6 for oil changes) |
| 18 | Warranty Covered | Manual | YES / NO |
| 19 | Notes | Manual | Free-text notes |
| 20 | Last Updated | System | Timestamp of last row modification |

---

### 3.6 Master Database — Modified Columns (EXISTING SHEET)

The following columns are **appended** to the existing Master Database header row (after column 60 `Follow-up Status`):

| # | Column Header | Type | Description |
|---|---|---|---|
| 61 | Turo Disposition | Manual | FLIP_ONLY / TURO_CANDIDATE / TURO_ACTIVE / TURO_EXITED — indicates whether this vehicle entered the Turo fleet |
| 62 | Turo Vehicle ID | Manual | FK to Turo Fleet Vehicle ID (populated when vehicle enters fleet) |

---

### 3.7 Settings — New Keys (EXISTING SHEET)

Appended rows using existing Settings schema (`Setting Key`, `Value`, `Updated`, `Description`, `Category`, `Data Type`, `Validation`, `Default`, `Required`, `Affects`, `Restart Required`):

| Setting Key | Default | Category | Data Type | Description |
|---|---|---|---|---|
| `TURO_ENABLED` | `false` | Turo | Boolean | Master toggle for Turo Add-On module |
| `TURO_API_KEY` | (empty) | Turo | String | Turo API key (if API access is available) |
| `TURO_HOST_ID` | (empty) | Turo | String | Turo host account identifier |
| `TURO_DEFAULT_DAILY_RATE` | `75` | Turo | Number | Default daily rate for new listings |
| `TURO_WEEKLY_DISCOUNT` | `15` | Turo | Number | Default weekly discount % |
| `TURO_MONTHLY_DISCOUNT` | `30` | Turo | Number | Default monthly discount % |
| `TURO_TARGET_UTILIZATION` | `70` | Turo | Number | Target utilization % for performance flags |
| `TURO_PAYBACK_TARGET_MONTHS` | `18` | Turo | Number | Target months to full payback |
| `TURO_INSURANCE_PROVIDER` | (empty) | Turo | String | Default insurance provider name |
| `TURO_MAINTENANCE_INTERVAL_MILES` | `5000` | Turo | Number | Default oil change / service interval in miles |
| `TURO_MAINTENANCE_INTERVAL_MONTHS` | `6` | Turo | Number | Default service interval in months |
| `TURO_DEPRECIATION_METHOD` | `STRAIGHT_LINE` | Turo | String | STRAIGHT_LINE or DECLINING_BALANCE |
| `TURO_ALERT_INSURANCE_DAYS` | `30` | Turo | Number | Days before insurance expiry to trigger alert |
| `TURO_ALERT_REGISTRATION_DAYS` | `30` | Turo | Number | Days before registration expiry to trigger alert |
| `TURO_ALERT_SERVICE_MILES` | `500` | Turo | Number | Miles before next service due to trigger alert |
| `TURO_SYNC_REVENUE` | `false` | Turo | Boolean | Auto-sync revenue from Turo (if API available) |
| `TURO_FLEET_LOCATION` | (empty) | Turo | String | Default fleet home location |

---

### 3.8 Integrations — New Entry (EXISTING SHEET)

One new row appended using existing Integrations schema:

| Field | Value |
|---|---|
| Integration ID | Auto-generated |
| Provider | Turo |
| Type | MARKETPLACE |
| Name | Turo Fleet Sync |
| API Key | (from TURO_API_KEY setting) |
| Secret | (empty) |
| Status | INACTIVE (until configured) |
| Sync Frequency | DAILY |
| Features | Revenue Sync, Trip Data, Vehicle Status |
| Notes | Requires Turo API access or manual data entry |

---

### 3.9 Required Fields Checklist

| Required Field | Sheet | Column(s) |
|---|---|---|
| Turo Status lifecycle fields | Turo Fleet | Col 11: Turo Status (10 lifecycle values) |
| Utilization % | Turo Revenue | Col 7: Utilization % |
| Daily Rate | Turo Fleet Col 23 (listed rate); Turo Revenue Col 12 (effective avg) | Two locations |
| Monthly Revenue | Turo Revenue | Col 11: Monthly Gross Revenue |
| Monthly Expenses | Turo Expenses | Col 15: Total Monthly Expense |
| Monthly Net Cash Flow | Turo Cashflow | Col 6: Monthly Net Cash Flow |
| Payback Months | Turo Fleet Col 35; Turo Cashflow Col 12 | Two locations (summary + per-month) |
| Insurance Expiry | Turo Fleet | Col 28: Insurance Expiry |
| Registration Expiry | Turo Fleet | Col 29: Registration Expiry |
| Maintenance scheduling (Next Service Due) | Turo Fleet Col 31 (summary); Turo Maintenance Col 14 (detail) | Two locations |
| Maintenance scheduling (Last Service Date) | Turo Fleet Col 30 (summary); Turo Maintenance Col 3 (detail) | Two locations |
| Fleet performance flags | Turo Fleet Col 38; Turo Cashflow Col 15 | ON TRACK / BEHIND / UNDERWATER |

---

## 4. AUTOMATIONS / TRIGGERS / FUNCTIONS

### 4.1 New Functions

| Function Name | Purpose | Reads From | Writes To |
|---|---|---|---|
| `initializeTuroModule()` | One-time setup: creates Turo sheets, deploys headers, inserts Settings keys, adds Integrations entry | Settings, Integrations | Turo Fleet, Turo Revenue, Turo Expenses, Turo Cashflow, Turo Maintenance, Settings, Integrations |
| `addVehicleToTuroFleet(dealId)` | Moves a vehicle from Master Database into Turo Fleet, populates acquisition data, sets status to ACQUIRED | Master Database | Turo Fleet, Master Database (sets Turo Disposition + Turo Vehicle ID) |
| `updateTuroStatus(vehicleId, newStatus)` | Transitions a vehicle's Turo Status with validation (enforces valid transitions) | Turo Fleet | Turo Fleet, Activity Logs |
| `logTuroRevenue(vehicleId, month, data)` | Inserts or updates a monthly revenue record | Turo Fleet | Turo Revenue |
| `logTuroExpense(vehicleId, month, data)` | Inserts or updates a monthly expense record | Turo Fleet | Turo Expenses |
| `recalcTuroCashflow(vehicleId)` | Recalculates all Turo Cashflow rows for a vehicle from Revenue + Expenses data | Turo Revenue, Turo Expenses, Turo Fleet | Turo Cashflow |
| `recalcAllTuroCashflow()` | Batch recalculation of Turo Cashflow for all active vehicles | Turo Revenue, Turo Expenses, Turo Fleet | Turo Cashflow |
| `logTuroMaintenance(vehicleId, serviceData)` | Logs a completed maintenance event and calculates next service due | Turo Fleet | Turo Maintenance, Turo Fleet (updates Last Service Date, Next Service Due) |
| `checkTuroAlerts()` | Scans fleet for expiring insurance, registration, upcoming service, and underwater vehicles | Turo Fleet, Turo Maintenance, Settings | Activity Logs, (triggers email/SMS alerts if configured) |
| `generateTuroFleetReport()` | Produces a fleet summary: total vehicles, avg utilization, total revenue, total net cash flow, vehicles on track/behind/underwater | Turo Fleet, Turo Revenue, Turo Cashflow | Reporting & Charts |
| `generateTuroVehicleReport(vehicleId)` | Detailed single-vehicle performance report | Turo Fleet, Turo Revenue, Turo Expenses, Turo Cashflow, Turo Maintenance | Reporting & Charts |
| `updateTuroFleetFlags()` | Recalculates Fleet Performance Flag for all active vehicles | Turo Fleet, Turo Cashflow | Turo Fleet |
| `exportTuroFleetForCRM()` | Exports fleet data formatted for CompanyHub Vehicles table | Turo Fleet, Turo Revenue, Turo Cashflow | CRM Integration (log), generates CSV |
| `syncTuroRevenueFromAPI()` | Pulls trip/revenue data from Turo API (if available and TURO_SYNC_REVENUE = true) | Turo Fleet, Settings, Integrations | Turo Revenue, Integrations (updates sync status) |
| `openTuroFleetManager()` | UI: Opens fleet management sidebar/dialog | Turo Fleet | (UI only) |
| `openTuroRevenueEntry()` | UI: Opens monthly revenue entry form | Turo Fleet | (UI only) |
| `openTuroExpenseEntry()` | UI: Opens monthly expense entry form | Turo Fleet | (UI only) |
| `openTuroMaintenanceLog()` | UI: Opens maintenance logging form | Turo Fleet | (UI only) |
| `openTuroDashboard()` | UI: Opens fleet performance dashboard | Turo Fleet, Turo Revenue, Turo Cashflow | (UI only) |

### 4.2 New Triggers

| Trigger Name | Type | Frequency | Function Called | Purpose |
|---|---|---|---|---|
| Turo Daily Sync | Time-based | Every day at 7:00 AM | `turoDialySync()` | Runs `recalcAllTuroCashflow()`, `updateTuroFleetFlags()`, `checkTuroAlerts()` |
| Turo Revenue Sync | Time-based | Every day at 8:00 AM | `syncTuroRevenueFromAPI()` | Pulls latest trip data from Turo API (only if TURO_SYNC_REVENUE = true) |
| Turo Weekly Report | Time-based | Every Monday at 9:00 AM | `generateTuroFleetReport()` | Generates weekly fleet performance summary |

### 4.3 Menu Additions

New submenu added to the existing `CarHawk Ultimate` menu:

```
CarHawk Ultimate
  └── Turo Fleet Operations
        ├── Fleet Manager                    → openTuroFleetManager()
        ├── Add Vehicle to Fleet             → addVehicleToTuroFleetUI()
        ├── Update Vehicle Status            → updateTuroStatusUI()
        ├── ───────────────
        ├── Log Monthly Revenue              → openTuroRevenueEntry()
        ├── Log Monthly Expenses             → openTuroExpenseEntry()
        ├── Log Maintenance                  → openTuroMaintenanceLog()
        ├── ───────────────
        ├── Recalculate All Cashflow         → recalcAllTuroCashflow()
        ├── Fleet Performance Dashboard      → openTuroDashboard()
        ├── Fleet Report                     → generateTuroFleetReport()
        ├── ───────────────
        ├── Check Fleet Alerts               → checkTuroAlerts()
        └── Export Fleet to CompanyHub       → exportTuroFleetForCRM()
```

### 4.4 New Settings Keys Summary

17 new settings keys added (all prefixed `TURO_`). Full list in Section 3.7.

---

## 5. DIFF SUMMARY VS BASE CARHAWK SPEC PACK

### 5.1 New Sheets (+5)

| Sheet | Columns | Purpose |
|---|---|---|
| Turo Fleet | 44 | Master fleet registry with lifecycle, financials, and flags |
| Turo Revenue | 16 | Per-vehicle monthly revenue tracking |
| Turo Expenses | 18 | Per-vehicle monthly expense tracking |
| Turo Cashflow | 17 | Per-vehicle monthly net cash flow and payback tracking |
| Turo Maintenance | 20 | Service history and scheduling |

### 5.2 New Columns on Existing Sheets (+2)

| Sheet | New Columns | Details |
|---|---|---|
| Master Database | +2 columns (positions 61-62) | `Turo Disposition`, `Turo Vehicle ID` |

### 5.3 New Settings Keys (+17)

All prefixed `TURO_*`. See Section 3.7 for full list.

### 5.4 New Integrations Entry (+1)

| Provider | Type |
|---|---|
| Turo | MARKETPLACE |

### 5.5 New Functions (+19)

| Category | Count | Functions |
|---|---|---|
| Setup | 1 | `initializeTuroModule` |
| Data Operations | 8 | `addVehicleToTuroFleet`, `updateTuroStatus`, `logTuroRevenue`, `logTuroExpense`, `recalcTuroCashflow`, `recalcAllTuroCashflow`, `logTuroMaintenance`, `updateTuroFleetFlags` |
| Alerts & Reports | 3 | `checkTuroAlerts`, `generateTuroFleetReport`, `generateTuroVehicleReport` |
| Export | 2 | `exportTuroFleetForCRM`, `syncTuroRevenueFromAPI` |
| UI Functions | 5 | `openTuroFleetManager`, `openTuroRevenueEntry`, `openTuroExpenseEntry`, `openTuroMaintenanceLog`, `openTuroDashboard` |

### 5.6 New Triggers (+3)

| Trigger | Frequency |
|---|---|
| Turo Daily Sync | Daily 7:00 AM |
| Turo Revenue Sync | Daily 8:00 AM |
| Turo Weekly Report | Weekly Monday 9:00 AM |

### 5.7 New Menu Items (+12)

One new submenu `Turo Fleet Operations` with 12 items added to the CarHawk Ultimate menu.

### 5.8 Unchanged from Base

| Component | Status |
|---|---|
| Existing 20 sheets (schema) | Unchanged (except Master Database +2 cols) |
| Existing 26 settings keys | Unchanged |
| Existing 5 triggers | Unchanged |
| Existing CRM/export functions | Unchanged |
| Existing AI analysis pipeline | Unchanged |
| Existing follow-up/campaign system | Unchanged |

---

## 6. CRM MAPPING-READY EXPORT SET (CompanyHub Vehicles Table)

### 6.1 Field Map: Spreadsheet → CompanyHub

| # | Spreadsheet Source | Spreadsheet Field | CompanyHub Field Name | CompanyHub Type | CRM-Stored? |
|---|---|---|---|---|---|
| 1 | Turo Fleet | Vehicle ID | `vehicle_id` | Text (PK) | Yes |
| 2 | Turo Fleet | Deal ID | `deal_id` | Text (FK) | Yes |
| 3 | Turo Fleet | VIN | `vin` | Text | Yes |
| 4 | Turo Fleet | Year | `year` | Number | Yes |
| 5 | Turo Fleet | Make | `make` | Text | Yes |
| 6 | Turo Fleet | Model | `model` | Text | Yes |
| 7 | Turo Fleet | Trim | `trim` | Text | Yes |
| 8 | Turo Fleet | Color | `color` | Text | Yes |
| 9 | Turo Fleet | Turo Status | `turo_status` | Dropdown | Yes |
| 10 | Turo Fleet | Turo Listing URL | `turo_listing_url` | URL | Yes |
| 11 | Turo Fleet | Date Acquired | `date_acquired` | Date | Yes |
| 12 | Turo Fleet | Date Listed on Turo | `date_listed` | Date | Yes |
| 13 | Turo Fleet | Acquisition Cost | `acquisition_cost` | Currency | Yes |
| 14 | Turo Fleet | Prep Cost | `prep_cost` | Currency | Yes |
| 15 | Turo Fleet | Total Basis | `total_basis` | Currency | Yes |
| 16 | Turo Fleet | Current Market Value | `current_market_value` | Currency | Yes |
| 17 | Turo Fleet | Daily Rate | `daily_rate` | Currency | Yes |
| 18 | Turo Fleet | Insurance Expiry | `insurance_expiry` | Date | Yes |
| 19 | Turo Fleet | Registration Expiry | `registration_expiry` | Date | Yes |
| 20 | Turo Fleet | Next Service Due | `next_service_due` | Date | Yes |
| 21 | Turo Fleet | Last Service Date | `last_service_date` | Date | Yes |
| 22 | Turo Fleet | Lifetime Revenue | `lifetime_revenue` | Currency | Yes |
| 23 | Turo Fleet | Lifetime Expenses | `lifetime_expenses` | Currency | Yes |
| 24 | Turo Fleet | Lifetime Net Cash Flow | `lifetime_net_cashflow` | Currency | Yes |
| 25 | Turo Fleet | Payback Months | `payback_months` | Number | Yes |
| 26 | Turo Fleet | Payback Progress % | `payback_progress_pct` | Percent | Yes |
| 27 | Turo Fleet | Fleet Performance Flag | `fleet_flag` | Dropdown | Yes |
| 28 | Turo Fleet | Avg Monthly Utilization % | `avg_utilization_pct` | Percent | Yes |
| 29 | Turo Fleet | Location | `location` | Text | Yes |
| 30 | Turo Fleet | Assigned To | `assigned_to` | Text | Yes |

### 6.2 Spreadsheet-Only Fields (NOT synced to CRM)

These fields remain in the spreadsheet only — they are either too granular for CRM or are intermediate calculation fields:

| Spreadsheet Source | Field | Reason |
|---|---|---|
| Turo Fleet | Mileage at Acquisition | Historical reference, not actionable in CRM |
| Turo Fleet | Current Mileage | Changes too frequently, managed in spreadsheet |
| Turo Fleet | Turo Vehicle Slug | Internal platform identifier |
| Turo Fleet | Date Delisted | Operational detail |
| Turo Fleet | Date Sold / Disposed | Captured in deal closure workflow |
| Turo Fleet | Depreciation to Date | Accounting detail |
| Turo Fleet | Weekly Discount % | Pricing detail managed on Turo |
| Turo Fleet | Monthly Discount % | Pricing detail managed on Turo |
| Turo Fleet | Insurance Policy | Sensitive info, stays in spreadsheet |
| Turo Fleet | Insurance Monthly Cost | Expense detail, stays in spreadsheet |
| Turo Fleet | Avg Daily Rate Effective | Calculated metric, CRM has `daily_rate` (listed) |
| Turo Fleet | Notes | Free text, use CRM notes field separately |
| Turo Fleet | Months Active | Derived from dates already in CRM |
| Turo Revenue | All columns | Monthly granularity stays in spreadsheet; CRM gets `lifetime_revenue` summary |
| Turo Expenses | All columns | Monthly granularity stays in spreadsheet; CRM gets `lifetime_expenses` summary |
| Turo Cashflow | All columns | Monthly granularity stays in spreadsheet; CRM gets summary fields |
| Turo Maintenance | All columns | Service history stays in spreadsheet; CRM gets `next_service_due` and `last_service_date` |

### 6.3 Sync Direction and Frequency

| Direction | Fields | Frequency |
|---|---|---|
| Spreadsheet → CRM | All 30 CRM-stored fields | On demand via `exportTuroFleetForCRM()` or daily via trigger |
| CRM → Spreadsheet | `turo_status`, `assigned_to`, `notes` | Manual (CRM is not source of truth for calculated fields) |

### 6.4 CompanyHub Vehicles Table — Recommended Schema

```
Table: Vehicles
├── vehicle_id          (Text, Primary Key)
├── deal_id             (Text, Link to Deals table)
├── vin                 (Text, Unique)
├── year                (Number)
├── make                (Text)
├── model               (Text)
├── trim                (Text)
├── color               (Text)
├── turo_status         (Dropdown: ACQUIRED, PREPPING, LISTED, BOOKED, AVAILABLE, MAINTENANCE, SUSPENDED, DELISTED, SELLING, SOLD)
├── turo_listing_url    (URL)
├── date_acquired       (Date)
├── date_listed         (Date)
├── acquisition_cost    (Currency)
├── prep_cost           (Currency)
├── total_basis         (Currency)
├── current_market_value (Currency)
├── daily_rate          (Currency)
├── insurance_expiry    (Date)
├── registration_expiry (Date)
├── next_service_due    (Date)
├── last_service_date   (Date)
├── lifetime_revenue    (Currency)
├── lifetime_expenses   (Currency)
├── lifetime_net_cashflow (Currency)
├── payback_months      (Number)
├── payback_progress_pct (Percent)
├── fleet_flag          (Dropdown: ON TRACK, BEHIND, UNDERWATER)
├── avg_utilization_pct (Percent)
├── location            (Text)
└── assigned_to         (Text)
```

---

## 7. APPENDIX

### A. Entity-Relationship Summary

```
Master Database (Deal ID) ──1:0..1──> Turo Fleet (Vehicle ID)
                                           │
                           ┌───────────────┼───────────────┐───────────────┐
                           │               │               │               │
                      Turo Revenue    Turo Expenses   Turo Cashflow  Turo Maintenance
                      (1:N by month)  (1:N by month)  (1:N by month) (1:N by service)
```

### B. Turo Status State Machine — Valid Transitions

```
ACQUIRED ──> PREPPING ──> LISTED ──> AVAILABLE <──> BOOKED
                                        │   ↑
                                        │   │
                                        v   │
                                   MAINTENANCE
                                        │
                                        v
                              SUSPENDED ──> LISTED
                                   │
                                   v
                              DELISTED ──> LISTED
                                   │
                                   v
                               SELLING ──> SOLD
```

Valid transitions:

| From | To (allowed) |
|---|---|
| ACQUIRED | PREPPING |
| PREPPING | LISTED |
| LISTED | AVAILABLE, SUSPENDED, DELISTED |
| AVAILABLE | BOOKED, MAINTENANCE, SUSPENDED, DELISTED, SELLING |
| BOOKED | AVAILABLE, MAINTENANCE |
| MAINTENANCE | AVAILABLE, DELISTED, SELLING |
| SUSPENDED | LISTED, DELISTED, SELLING |
| DELISTED | LISTED, SELLING |
| SELLING | SOLD, LISTED |
| SOLD | (terminal — no transitions out) |

### C. Formula Reference for Calculated Fields

| Field | Formula Logic |
|---|---|
| Total Basis | `= Acquisition Cost + Prep Cost` |
| Depreciation to Date | `= Total Basis - Current Market Value` |
| Utilization % | `= (Rental Days / Days in Month) * 100` |
| Monthly Gross Revenue | `= Gross Booking Revenue - Turo Platform Fee + Turo Trip Fee Revenue` |
| Avg Daily Rate (Revenue) | `= Monthly Gross Revenue / Rental Days` |
| Total Monthly Expense | `= SUM(Insurance through Miscellaneous)` |
| Monthly Net Cash Flow | `= Monthly Revenue - Monthly Expenses` |
| Cumulative Cash Flow | `= Running SUM of Monthly Net Cash Flow for Vehicle` |
| Payback Progress % | `= Cumulative Cash Flow / Total Basis * 100` |
| Avg Monthly Net | `= Cumulative Cash Flow / Months Active` |
| Est Months to Payback | `= (Total Basis - Cumulative Cash Flow) / Avg Monthly Net` |
| ROI to Date % | `= Cumulative Cash Flow / Total Basis * 100` |
| Annualized ROI % | `= (ROI to Date % / Months Active) * 12` |
| Fleet Performance Flag | See flag logic table in Section 3.1 |
| Months Active | `= DATEDIF(Date Listed on Turo, TODAY(), "M")` |
| Lifetime Revenue | `= SUM(Monthly Gross Revenue) from Turo Revenue WHERE Vehicle ID matches` |
| Lifetime Expenses | `= SUM(Total Monthly Expense) from Turo Expenses WHERE Vehicle ID matches` |
| Lifetime Net Cash Flow | `= Lifetime Revenue - Lifetime Expenses` |
| Payback Months | `= Total Basis / Avg Monthly Net` |
| Avg Monthly Utilization % | `= AVG(Utilization %) from Turo Revenue WHERE Vehicle ID matches` |
| Avg Daily Rate Effective | `= Lifetime Revenue / Total Rental Days` |

---

*End of Spec Pack — CARHAWK TURO ADD-ON MODULE v1.0.0*
