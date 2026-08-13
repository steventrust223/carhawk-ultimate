# CarHawk Ultimate -- Project Arbitrage Module (PAM)
## Spec Pack Part 9 of 9 | QUANTUM-2.0.0

---

### A) Module Overview

The Project Arbitrage Module (PAM) extends CarHawk Ultimate with a project-based sourcing engine. Instead of analyzing individual vehicle deals, PAM lets you define **projects** (vehicle builds, property rehabs, ATV builds, etc.) with specific **needs** (parts, materials, components), then automatically **matches** those needs against scraped marketplace listings using a 2-layer scoring system: rule-based keyword matching (Layer 1) followed by OpenAI evaluation (Layer 2).

**Architecture Role:** Additive module -- zero breaking changes to existing CarHawk core. All PAM logic lives in 7 dedicated `.gs` files plus 1 HTML dashboard. The module reads from the existing Master Database (or any configured source sheet) and writes results to its own 6 sheets.

**Workflow:**
1. Create projects with budgets and timelines
2. Define needs per project (parts, materials, components with keywords and price targets)
3. Run Logic Engine -- scores every scraped listing against every open need
4. Run AI Evaluation -- OpenAI evaluates top matches for fit, strategy, and negotiation
5. Review matches in the Command Center dashboard
6. Record purchases, track budgets, monitor fulfillment

---

### B) File Inventory

| # | File | Lines | Purpose |
|---|------|-------|----------|
| 1 | PAM_Settings.gs | 113 | Settings sheet management and defaults |
| 2 | PAM_Utils.gs | 154 | ID generation, keyword scoring, formatting helpers |
| 3 | PAM_Sheets.gs | 258 | Idempotent sheet creation for 6 PAM sheets |
| 4 | PAM_DataAccess.gs | 310 | CRUD operations for all PAM sheets (UI data layer) |
| 5 | PAM_LogicEngine.gs | 228 | Layer 1 rule-based keyword + scoring engine |
| 6 | PAM_AIEngine.gs | 258 | Layer 2 OpenAI gpt-4o-mini evaluation |
| 7 | PAM_Menu.gs | 61 | Menu registration and test data seeder |
| 8 | PAM_UI.html | 1,654 | Full Command Center dashboard (5 tabs) |
|   | **Total** | **3,036** | |

---

### C) Sheet Inventory

| # | Sheet Name | Columns | Purpose |
|---|-----------|---------|----------|
| 1 | PAM_Projects | 13 (A-M) | Project definitions with budgets |
| 2 | PAM_Needs | 19 (A-S) | Item needs per project with keywords |
| 3 | PAM_Matches | 25 (A-Y) | Scored listing-to-need matches |
| 4 | PAM_Purchases | 15 (A-O) | Recorded purchases |
| 5 | PAM_Dashboard | Query-driven | Read-only command view with 5 sections |
| 6 | PAM_Settings | 3 (A-C) | Key-value configuration store |

**Theme:** Dark background `#0A0A0C`, gold accents `#C9A84C`, surface `#141418`, gridlines hidden.

---

### D) Schema -- PAM_Projects (13 columns)

| Col | Header | Type | Calc/Manual |
|-----|--------|------|-------------|
| A | Project ID | String | CALC (P001, P002...) |
| B | Project Name | String | Manual |
| C | Project Type | String | Dropdown |
| D | Category | String | Manual |
| E | Description | String | Manual |
| F | Budget | Currency | Manual |
| G | Spent So Far | Currency | CALC (SUMIFS from PAM_Purchases) |
| H | Remaining Budget | Currency | CALC (F - G) |
| I | Priority | String | Dropdown |
| J | Status | String | Dropdown |
| K | Start Date | Date | Manual |
| L | Target Completion | Date | Manual |
| M | Notes | String | Manual |

**Project Type Dropdown:** Vehicle Flip, Vehicle Build, Property Rehab, ATV/Powersports Build, Solar/Off-Grid, Electronics Bundle, General Arbitrage, Other

**Priority Dropdown:** Critical, High, Medium, Low

**Status Dropdown:** Planning, Active, Paused, Complete, Cancelled

**Formulas:**
- G (Spent): `=SUMIFS(PAM_Purchases!F:F, PAM_Purchases!B:B, A{row})`
- H (Remaining): `=F{row}-G{row}`

**Conditional Formatting:** Row turns `#3A0A0A` with red font `#FF6B6B` when remaining budget < 10% of budget.

---

### E) Schema -- PAM_Needs (19 columns)

| Col | Header | Type | Calc/Manual |
|-----|--------|------|-------------|
| A | Need ID | String | CALC (N001, N002...) |
| B | Project ID | String | Foreign key |
| C | Project Name | String | CALC (VLOOKUP from PAM_Projects) |
| D | Item Needed | String | Manual |
| E | Keyword Set | String | Manual (CSV keywords for matching) |
| F | Category | String | Dropdown |
| G | Subcategory | String | Manual |
| H | Preferred Brand | String | Manual |
| I | Preferred Model | String | Manual |
| J | Acceptable Alternatives | String | Manual |
| K | Condition Needed | String | Dropdown |
| L | Qty Needed | Number | Manual |
| M | Qty Acquired | Number | CALC (COUNTIFS from PAM_Purchases) |
| N | Target Price | Currency | Manual |
| O | Max Price | Currency | Manual |
| P | Priority | String | Dropdown |
| Q | Required | Boolean | Checkbox |
| R | Notes | String | Manual |
| S | Status | String | Dropdown |

**Category Dropdown (17 options):** HVAC, Electrical, Plumbing, Body/Cosmetic, Drivetrain, Engine, Suspension, Wheels/Tires, Interior, Exterior, Appliance, Flooring, Solar, Battery, Electronics, Tools, Other

**Condition Dropdown:** New, Like New, Good, Fair, Any

**Priority Dropdown:** Critical, Important, Nice to Have

**Status Dropdown:** Open, Partially Filled, Fulfilled, Cancelled

**Formulas:**
- C (Project Name): `=VLOOKUP(B{row}, PAM_Projects!A:B, 2, FALSE)`
- M (Qty Acquired): `=COUNTIFS(PAM_Purchases!C:C, B{row}, PAM_Purchases!D:D, D{row})`

---

### F) Schema -- PAM_Matches (25 columns)

| Col | Header | Type | Source |
|-----|--------|------|--------|
| A | Match ID | String | CALC (M001, M002...) |
| B | Scraped Row ID | String | Layer 1 |
| C | Project ID | String | Layer 1 |
| D | Project Name | String | CALC (VLOOKUP) |
| E | Need ID | String | Layer 1 |
| F | Need Item | String | CALC (VLOOKUP) |
| G | Secondary Need ID | String | Layer 1 (cross-project) |
| H | Listing Title | String | Layer 1 (from source) |
| I | Listing Description | String | Layer 1 (from source) |
| J | Platform | String | Layer 1 (from source) |
| K | Listing URL | URL | Layer 1 (from source) |
| L | Asking Price | Currency | Layer 1 (from source) |
| M | Estimated Value | Currency | Layer 1 |
| N | Distance | String | Layer 1 (from source) |
| O | Logic Match | Boolean | Layer 1 |
| P | Match Score | Number 0-100 | Layer 1 |
| Q | Match Tier | String | Layer 1 (Strong/Good/Weak) |
| R | AI Fit Verdict | String | Layer 2 |
| S | AI Compatibility Insight | String | Layer 2 |
| T | AI Strategy | String | Layer 2 |
| U | AI Risk Flags | String | Layer 2 |
| V | AI Negotiation Angle | String | Layer 2 |
| W | Recommended Action | String | Layer 2 |
| X | Review Status | String | Dropdown |
| Y | Timestamp | DateTime | CALC |

**Review Status Dropdown:** New, Reviewed, Acted On, Dismissed

**AI Fit Verdict Values:** Perfect Fit, Likely Fit, Possible Fit, Not Recommended

**AI Strategy Values:** Buy for Project, Buy + Flip Extra, Watch, Pass

**Match Tier Classification:**
- Strong: score >= 80
- Good: score >= 60
- Weak: score < 60

---

### G) Schema -- PAM_Purchases (15 columns)

| Col | Header | Type | Calc/Manual |
|-----|--------|------|-------------|
| A | Purchase ID | String | CALC (PUR001, PUR002...) |
| B | Project ID | String | Manual |
| C | Need ID | String | Manual |
| D | Item Bought | String | Manual |
| E | Source / Platform | String | Manual |
| F | Purchase Price | Currency | Manual |
| G | Date Bought | Date | Manual |
| H | Seller | String | Manual |
| I | Listing URL | URL | Manual |
| J | Match ID | String | Manual (links back to match) |
| K | Installed Yet | Boolean | Checkbox |
| L | Resellable Later | Boolean | Checkbox |
| M | Estimated Resale Value | Currency | Manual |
| N | Condition | String | Dropdown |
| O | Notes | String | Manual |

**Condition Dropdown:** New, Like New, Good, Fair, Poor

**Side Effects:** Recording a purchase auto-updates:
- Match status → "Acted On" (if Match ID provided)
- Need status → "Partially Filled" or "Fulfilled" (based on qty comparison)
- Project "Spent So Far" → recalculated via SUMIFS formula

---

### H) Schema -- PAM_Dashboard (Query-Driven)

Read-only sheet with 5 QUERY-driven sections:

| Section | Rows | Source | Content |
|---------|------|--------|----------|
| Active Projects | 3-21 | PAM_Projects | WHERE Status = 'Active' |
| Top Unfilled Needs | 22-41 | PAM_Needs | WHERE Status = 'Open' AND Priority IN ('Critical','Important'), LIMIT 15 |
| Newest Strong/Good Matches | 42-61 | PAM_Matches | WHERE Tier IN ('Strong','Good'), ORDER BY timestamp DESC, LIMIT 15 |
| Recent Purchases | 62-76 | PAM_Purchases | ORDER BY date DESC, LIMIT 10 |
| Budget Health | 77+ | PAM_Projects | Budget bars for Active projects |

---

### I) Schema -- PAM_Settings (3 columns)

| Col | Header |
|-----|--------|
| A | Setting |
| B | Value |
| C | Notes |

#### Settings Keys & Defaults

| Key | Default | Type | Purpose |
|-----|---------|------|----------|
| PAM_SourceSheet | Master DB | String | Sheet to scan for scraped listings |
| PAM_KeywordWeight | 40 | Number | Keyword match scoring weight |
| PAM_CategoryWeight | 20 | Number | Category match scoring weight |
| PAM_PriceWeight | 20 | Number | Price vs target scoring weight |
| PAM_BrandWeight | 10 | Number | Brand/model match bonus weight |
| PAM_DistanceWeight | 5 | Number | Distance scoring weight |
| PAM_ConditionWeight | 5 | Number | Condition clue scoring weight |
| PAM_AIThreshold | 60 | Number | Min score to trigger AI evaluation |
| PAM_AIModel | gpt-4o-mini | String | OpenAI model for evaluations |
| PAM_MaxAIPerRun | 20 | Number | Max AI calls per engine run |
| PAM_DistanceRadius | 30 | Number | Max distance in miles |
| PAM_APIKeyCell | Settings!B2 | String | Cell reference for OpenAI API key |

**Note:** Scoring weights should sum to 100. The UI validates this with a live indicator.

---

### J) Layer 1 -- Logic Engine

**File:** PAM_LogicEngine.gs (228 lines)

`runPAMLogicEngine()` -- the rule-based matching engine.

#### How It Works

1. Loads settings (weights, source sheet, distance radius)
2. Reads source sheet with flexible column mapping (case-insensitive header detection)
3. Loads all open needs (Status = 'Open' or 'Partially Filled')
4. For each scraped listing, scores against every open need using 6 criteria:

| Criterion | Weight (default) | Scoring Logic |
|-----------|-----------------|---------------|
| Keyword Match | 40 | `pamKeywordScore_()` ratio × weight |
| Category Match | 20 | Case-insensitive substring containment |
| Price Score | 20 | Full points if asking <= target; half if <= max |
| Brand/Model Bonus | 10 | Any brand/model token (>2 chars) found in text |
| Distance Score | 5 | Full points if within radius; half if no data |
| Condition Score | 5 | Hierarchy check: New > Like New > Good > Fair > Any |

5. Best match selected per listing; secondary need tracked if different project scores >= 40
6. **Minimum threshold: 40** -- listings below 40 are skipped
7. **Deduplication:** skips if same scraped row + need already matched
8. **Tier assignment:** Strong (>= 80), Good (>= 60), Weak (< 60)
9. Writes to PAM_Matches with AI columns (R-W) left empty for Layer 2

#### Source Column Mapping (Flexible)

| Field | Accepted Headers |
|-------|------------------|
| Title | title, listing title, name, item |
| Description | description, desc, details, body |
| Price | price, asking, ask price, cost |
| Category | category, type |
| Distance | distance, miles, mi |
| Platform | platform, source, site, marketplace |
| URL | url, link, listing url |
| Row ID | row id, id, row, listing id |

#### Condition Hierarchy

```
New > Like New > Good > Fair > Any
```

Condition keyword map:
- **New:** new, brand new, unopened, sealed, oem
- **Like New:** like new, excellent, mint, pristine, barely used
- **Good:** good, great condition, works great, fully functional
- **Fair:** fair, some wear, used, functional

Returns: `{ success, log, summary, written, strong, good, weak, skipped }`

---

### K) Layer 2 -- AI Engine

**File:** PAM_AIEngine.gs (258 lines)

`runPAMAIEvaluation()` -- the OpenAI evaluation engine.

#### How It Works

1. Loads settings (AI threshold, model, max calls per run)
2. Fetches OpenAI API key from `Settings!B2`
3. Identifies qualifying matches: score >= threshold AND no AI verdict yet (or "AI Error")
4. For each match (up to max per run):
   - Builds context prompt with project, need, listing, and secondary need info
   - Calls OpenAI with JSON mode
   - Rate limits: 1.1 second sleep between calls
   - Writes AI response to columns R-W
5. On error: writes "AI Error -- retry" (eligible for re-evaluation next run)

#### OpenAI API Configuration

| Setting | Value |
|---------|-------|
| Endpoint | `https://api.openai.com/v1/chat/completions` |
| Default Model | gpt-4o-mini |
| Supported Models | gpt-4o-mini, gpt-4o, gpt-4-turbo |
| Temperature | 0.3 |
| Max Tokens | 500 |
| Response Format | JSON object (structured output) |

#### AI Response JSON Schema

```javascript
{
  fit_verdict: "Perfect Fit | Likely Fit | Possible Fit | Not Recommended",
  compatibility_insight: "string (why it fits or doesn't)",
  strategy: "Buy for Project | Buy + Flip Extra | Watch | Pass",
  risk_flags: "string (potential issues)",
  negotiation_angle: "string (how to approach the seller)"
}
```

#### Strategy → Recommended Action Mapping

The AI strategy maps to a user-facing Recommended Action in column W.

#### Full Cycle

`runPAMFullCycle()` runs both engines sequentially:
1. `runPAMLogicEngine()` (Layer 1)
2. 500ms pause
3. `runPAMAIEvaluation()` (Layer 2)

Returns: `{ success, logic, ai, log }`

---

### L) Menu Structure

**Menu: PAM** (top-level, registered via `addPAMMenu()`)

| Item | Function |
|------|----------|
| Open Command Center | `openPAMDashboard()` |
| -- separator -- | |
| Run Logic Engine | `runPAMLogicEngine()` |
| Run AI Evaluation | `runPAMAIEvaluation()` |
| Full Cycle (Logic → AI) | `runPAMFullCycle()` |
| -- separator -- | |
| Initialize PAM Sheets | `initializePAMSheets()` |

---

### M) Command Center UI (PAM_UI.html)

**Type:** Modal dialog (1400 x 900)
**Lines:** 1,654
**External Libraries:** Google Fonts (Playfair Display)

#### Design System

| Token | Value |
|-------|-------|
| --bg | #0A0A0C |
| --surface | #141418 |
| --surface2 | #1A1A20 |
| --gold | #C9A84C |
| --blue | #4080C4 |
| --green | #40A060 |
| --amber | #C48840 |
| --red | #C44040 |
| --mono | SF Mono, Cascadia Code, JetBrains Mono, Consolas |
| --serif | Playfair Display |

Includes noise overlay (inline SVG fractal noise for texture).

#### Tab 1: Projects

- Stats row: Total Projects, Active, Total Budget, Total Spent
- Search filter
- Inline "New Project" form with all 13 fields
- Expandable project cards with budget bar visualization
- Linked needs shown inline when expanded
- "Add Need" button within project expansion

#### Tab 2: Needs

- Filter bar: text search, priority dropdown, status dropdown
- Inline "Add Need" form with all 19 fields
- Needs grouped by project name with collapsible headers
- Each need shows: ID, item, keywords excerpt, priority/status badges, qty bar, price range

#### Tab 3: Matches

- Stats row: Total Matches, Strong (green), Awaiting AI (amber), Acted Today (blue)
- Filter bar: Project, Tier, AI Verdict, Status dropdowns + Refresh button
- Expandable match cards showing:
  - Score badge (circular, color-coded), tier, listing title, platform, project/need, distance, price
  - AI verdict, review status
  - Expanded: description, AI compatibility, strategy, risk flags, negotiation angle, listing URL
  - Action buttons: Buy for Project (green), Buy + Flip (blue), Watch (amber), Dismiss (ghost)

#### Purchase Modal

- Overlay triggered from match action buttons
- Pre-populates from match data
- Fields: Item, Project, Price, Platform, Seller, Date, Condition, URL, Resale Value, Notes

#### Tab 4: Run Engine

- 3 action buttons: Logic Engine, AI Evaluation, Full Cycle (all with pulsing animations)
- Two-column layout:
  - Left: Execution log console (terminal-style, color-coded by category)
  - Right: Current settings preview + "Initialize/Repair PAM Sheets" button
- Log categories: START (gold), SCAN (blue), EVAL (amber), OK (green), DONE (green bold), ERROR (red), WARN (amber), INFO (muted)

#### Tab 5: Settings

- Data Source: source sheet name, API key cell reference
- Scoring Weights: 6 number inputs with live sum validation (green at 100, red otherwise)
- AI Evaluation: threshold slider with live tier preview, model dropdown, max calls, distance radius
- Save Settings / Reset to Defaults buttons

#### Server Calls (google.script.run)

| Call | Purpose |
|------|----------|
| `getPAMProjects()` | Fetch all projects |
| `getPAMNextIds()` | Get next auto-increment IDs |
| `getPAMNeeds(projectId)` | Fetch needs (optionally by project) |
| `getPAMMatches(null)` | Fetch all matches |
| `getPAMStats()` | Fetch aggregate match statistics |
| `getPAMSettings()` | Fetch current settings |
| `addProject(data)` | Create a new project |
| `addNeed(data)` | Create a new need |
| `recordPurchase(data)` | Record a purchase |
| `updateMatchStatus(id, status)` | Update match review status |
| `runPAMLogicEngine()` | Execute Layer 1 |
| `runPAMAIEvaluation()` | Execute Layer 2 |
| `runPAMFullCycle()` | Execute both layers |
| `savePAMSettings(data)` | Persist settings |
| `initializePAMSheets()` | Create/repair sheets |

---

### N) Test Data Seeder

`seedPAMTestData()` creates sample data for demonstration:

**3 Test Projects:**

| Name | Type | Budget |
|------|------|--------|
| Berkeley House Rebuild | Property Rehab | $15,000 |
| Yamaha Blaster Build | ATV/Powersports Build | $2,500 |
| CarHawk Flip 04 -- Mustang | Vehicle Flip | $4,000 |

**7 Test Needs:**

| Project | Item | Priority | Target | Max | Keywords |
|---------|------|----------|--------|-----|----------|
| Berkeley House | Mini Split AC Unit | Critical | $250 | $500 | mini split, ductless, heat pump, condenser, air handler, mr slim, mrcool, mitsubishi mini split |
| Berkeley House | Exterior Entry Door | Important | $100 | $250 | entry door, exterior door, front door, steel door, fiberglass door, prehung |
| Berkeley House | Bathroom Vanity | Nice to Have | $75 | $200 | bathroom vanity, vanity cabinet, sink vanity, bath cabinet |
| Yamaha Blaster | Front Plastics Set | Critical | $40 | $80 | blaster plastics, front fender, blaster fender, yfs200 plastics, blaster body |
| Yamaha Blaster | Brake Setup | Important | $30 | $60 | blaster brakes, brake caliper, brake pads, yfs200 brakes, rear brake |
| Mustang Flip | Headlight Assembly | Critical | $80 | $150 | mustang headlight, headlamp, headlight assembly, ford headlight |
| Mustang Flip | Front Seat Set | Important | $150 | $300 | mustang seats, front seats, bucket seats, ford seats, leather seats |

---

### O) Function Index

| File | Function | Visibility |
|------|----------|------------|
| PAM_Settings.gs | `getPAMSettingsSheet_()` | Private |
| PAM_Settings.gs | `getPAMSettings()` | Public |
| PAM_Settings.gs | `savePAMSettings(data)` | Public |
| PAM_Settings.gs | `getPAMSetting_(key)` | Private |
| PAM_Settings.gs | `getOpenAIKey_()` | Private |
| PAM_Settings.gs | `initPAMSettings()` | Public |
| PAM_Utils.gs | `pamNextId_(sheet, prefix, col)` | Private |
| PAM_Utils.gs | `pamNextProjectId()` | Public |
| PAM_Utils.gs | `pamNextNeedId()` | Public |
| PAM_Utils.gs | `pamNextMatchId()` | Public |
| PAM_Utils.gs | `pamNextPurchaseId()` | Public |
| PAM_Utils.gs | `pamMatchExists_(scrapedRowId, needId)` | Private |
| PAM_Utils.gs | `pamFormatCurrency_(val)` | Private |
| PAM_Utils.gs | `pamFormatDate_(val)` | Private |
| PAM_Utils.gs | `pamSafeStr_(v)` | Private |
| PAM_Utils.gs | `pamKeywordScore_(text, keywordCsv)` | Private |
| PAM_Utils.gs | `pamContainsCondition_(text, conditionNeeded)` | Private |
| PAM_Utils.gs | `pamStyleHeader_(sheet, numCols)` | Private |
| PAM_Utils.gs | `pamApplyDropdown_(sheet, row, col, options)` | Private |
| PAM_Utils.gs | `pamApplyDropdownColumn_(sheet, col, options, startRow, endRow)` | Private |
| PAM_Utils.gs | `pamLog_(message, category)` | Private |
| PAM_Utils.gs | `pamGetLog()` | Public |
| PAM_Utils.gs | `pamParseJSON_(str)` | Private |
| PAM_Sheets.gs | `initializePAMSheets()` | Public |
| PAM_Sheets.gs | `createPAMProjectsSheet_()` | Private |
| PAM_Sheets.gs | `createPAMNeedsSheet_()` | Private |
| PAM_Sheets.gs | `createPAMMatchesSheet_()` | Private |
| PAM_Sheets.gs | `createPAMPurchasesSheet_()` | Private |
| PAM_Sheets.gs | `createPAMDashboardSheet_()` | Private |
| PAM_DataAccess.gs | `getPAMProjects()` | Public |
| PAM_DataAccess.gs | `addProject(data)` | Public |
| PAM_DataAccess.gs | `getPAMNeeds(projectId)` | Public |
| PAM_DataAccess.gs | `addNeed(data)` | Public |
| PAM_DataAccess.gs | `getPAMMatches(filters)` | Public |
| PAM_DataAccess.gs | `updateMatchStatus(matchId, status)` | Public |
| PAM_DataAccess.gs | `recordPurchase(data)` | Public |
| PAM_DataAccess.gs | `refreshNeedStatus_(needId)` | Private |
| PAM_DataAccess.gs | `getPAMStats()` | Public |
| PAM_DataAccess.gs | `getPAMNextIds()` | Public |
| PAM_LogicEngine.gs | `runPAMLogicEngine()` | Public |
| PAM_AIEngine.gs | `runPAMAIEvaluation()` | Public |
| PAM_AIEngine.gs | `buildAIPrompt_(...)` | Private |
| PAM_AIEngine.gs | `callOpenAI_(apiKey, model, prompt)` | Private |
| PAM_AIEngine.gs | `buildNeedsMap_()` | Private |
| PAM_AIEngine.gs | `buildProjectsMap_()` | Private |
| PAM_AIEngine.gs | `runPAMFullCycle()` | Public |
| PAM_Menu.gs | `addPAMMenu()` | Public |
| PAM_Menu.gs | `openPAMDashboard()` | Public |
| PAM_Menu.gs | `seedPAMTestData()` | Public |

**Total: 49 functions across 7 .gs files + 29 client-side JS functions in PAM_UI.html**

---

### P) Implementation Status

All items are **COMPLETE** [x]:

- [x] PAM_Settings.gs -- 12 configurable settings with defaults
- [x] PAM_Utils.gs -- ID generation, keyword scoring, condition hierarchy, formatting
- [x] PAM_Sheets.gs -- 6 sheets with schemas, formulas, dropdowns, conditional formatting
- [x] PAM_DataAccess.gs -- Full CRUD for all sheets, stats aggregation, status tracking
- [x] PAM_LogicEngine.gs -- 6-criterion weighted scoring with flexible column mapping
- [x] PAM_AIEngine.gs -- OpenAI gpt-4o-mini evaluation with JSON structured output
- [x] PAM_Menu.gs -- Menu registration, dashboard launcher, test data seeder
- [x] PAM_UI.html -- 5-tab Command Center with full CRUD, engine controls, settings

---

## Updated Spec Pack Index

| Part | File | Covers |
|------|------|--------|
| 1 | SPEC_PACK_PART1_SYSTEM_OVERVIEW.md | Identity, architecture, file inventory, config, menu, initialization |
| 2 | SPEC_PACK_PART2_SHEET_SCHEMAS.md | 25 core + Turo sheet schemas |
| 3 | SPEC_PACK_PART3_AI_ENGINE.md | OpenAI integration, calculations, scoring, knowledge base |
| 4 | SPEC_PACK_PART4_CRM_ENGINE.md | CRM pipeline, follow-ups, SMS/email, automation, API layer |
| 5 | SPEC_PACK_PART5_BROWSE_AI.md | Browse.AI robots, import pipeline, 10 platforms, URL builders |
| 6 | SPEC_PACK_PART6_INTEGRATIONS.md | SMS-iT, Ohmylead, CompanyHub, Twilio, SendGrid, credentials |
| 7 | SPEC_PACK_PART7_UI_COMPONENTS.md | 18 HTML dialogs, server-side HTML, design system |
| 8 | SPEC_PACK_PART8_TRIGGERS_ALERTS.md | Triggers, alerts, reporting, dashboard, testing, utilities |
| **9** | **SPEC_PACK_PART9_PAM.md** | **Project Arbitrage Module -- projects, needs, matching, AI evaluation** |
| Turo | TURO_SPEC_PACK.md | Complete Turo Rental Hold Module specification |
