# CarHawk Ultimate -- Triggers, Alerts & Reporting
## Spec Pack Part 8 of 8 | QUANTUM-2.0.0

---

### A) Trigger System

**Source File:** quantum_triggers.gs (101 lines)

#### Trigger Deployment

`deployQuantumTriggers()`:
1. Clears all existing project triggers via `ScriptApp.deleteTrigger()`
2. Creates 3 trigger groups:

| Trigger | Frequency | Function | Purpose |
|---------|-----------|----------|----------|
| Hourly Sync | Every 1 hour | `quantumHourlySync()` | Import + data refresh |
| Daily Analysis | Daily at 6 AM | `quantumDailyAnalysis()` | Batch AI + reports |
| CRM Triggers | Variable | `setupCRMTriggers()` | Follow-ups + campaigns |

#### CRM Sub-Triggers (from quantum_crm_automation.gs)

| Trigger | Frequency | Function |
|---------|-----------|----------|
| Follow-Up Processor | Every 5 minutes | `processFollowUps()` |
| Campaign Processor | Every 10 minutes | `processCampaigns()` |
| Appointment Reminders | Every 1 hour | `processAppointmentReminders()` |

---

### B) Hourly Sync

`quantumHourlySync()`:

**Condition:** Only runs if `REALTIME_MODE` setting = true

**Steps:**
1. `runBrowseAIIntegrations()` -- Fetch data from all Browse.AI robots
2. `runImportSync()` -- Process import queue to Master Database
3. Update `LAST_SYNC` setting with current timestamp

**Skips execution entirely if realtime mode is disabled.**

---

### C) Daily Analysis (6 AM)

`quantumDailyAnalysis()`:

**Steps (always run):**
1. `executeQuantumAIBatch()` -- AI analysis on all unanalyzed deals
2. `generateQuantumDashboard()` -- Refresh dashboard metrics
3. `checkQuantumAlerts()` -- Process alert queue

**Conditional steps:**
4. `syncCRMData()` -- Only if `CRM_ENABLED` = true
5. `batchAnalyzeTuro()` -- Only if Turo Engine sheet exists
6. `checkComplianceAlerts()` -- Only if Turo Engine sheet exists

**Post-run:**
7. Update `LAST_ANALYSIS` setting with current timestamp
8. Log completion to Activity Logs

---

### D) Alert System

**Source File:** quantum_alerts.gs (272 lines)

#### Alert Conditions

`checkQuantumAlerts(dealData, analysis)` evaluates 3 alert types:

| Alert Type | Condition | Priority |
|-----------|-----------|----------|
| HOT_DEAL | verdict = '🔥 HOT DEAL' AND confidence > 85% | URGENT |
| HIGH_PROFIT | profitPotential > PROFIT_TARGET setting | HIGH |
| QUICK_FLIP | strategy = 'Quick Flip' AND quickSaleProbability > 80% | MEDIUM |

#### Alert Object Structure

```javascript
{
  type: 'HOT_DEAL' | 'HIGH_PROFIT' | 'QUICK_FLIP',
  priority: 'URGENT' | 'HIGH' | 'MEDIUM',
  title: string,
  message: string,
  actions: ['View Deal', 'Contact Seller', 'Export to CRM']
}
```

#### Alert Processing Pipeline

```
Deal analyzed
      ↓
checkQuantumAlerts()  → evaluate 3 conditions
      ↓
processQuantumAlerts() → log to Activity Logs
      ↓ if REALTIME_ALERTS = true
sendQuantumNotifications() → filter URGENT alerts
      ↓ if ALERT_EMAIL configured
sendQuantumAlertEmail()
```

#### Alert Email Format

HTML email with:
- Gradient header with ⚛️ Quantum Alert branding
- Alert cards (URGENT = red background, others = blue)
- Metrics display: Asking Price, Distance, Days Listed
- CTA button linking to spreadsheet
- Footer with business name

#### Alert Digest

`sendQuantumDigest()`:
- Collects all queued alerts from `QuantumState.realTimeAlerts`
- Sends as single digest email
- Clears queue after sending

---

### E) Reporting System

**Source File:** quantum_reports.gs (196 lines)

#### Closed Deals Report

`generateClosedDealsReport()`:
- Reads Closed Deals sheet
- Creates summary report sheet with:

| Metric | Source |
|--------|--------|
| Total Closed Deals | Row count |
| Total Profit | Sum of column 14 (Profit) |
| Average Profit | Total / count |
| Average ROI | Average of column 15 (ROI %) |
| Average Days to Close | Average of column 12 |

#### Weekly Report

`generateQuantumWeekly()`:
- Creates "Weekly Report" sheet with metrics for the past 7 days:

| Metric | Calculation |
|--------|-------------|
| Week Ending | Current date |
| Deals Analyzed | Deals imported in past 7 days |
| Deals Contacted | Contact count > 0 |
| Appointments Set | Stage = APPOINTMENT_SET |
| Deals Closed | Stage = CLOSED_WON |
| Total Profit | Sum of closed deal profits |

#### Monthly Report

`generateQuantumMonthly()`:
- Shows alert with monthly summary (placeholder for expanded implementation)

#### Performance Matrix

`generatePerformanceMatrix()`:
- Shows alert dialog with:

| Metric | Value |
|--------|-------|
| Deals Analyzed | Queue length |
| Hot Deals Found | From `getQuickStats()` |
| Avg Response Time | < 5 minutes |
| Conversion Rate | 23% |
| Avg Profit | $3,200 |

#### ROI Optimizer

`runROIOptimizer()`:
- Analyzes ROI patterns across all deals
- Shows alert with:
  - Average ROI % across all deals
  - High ROI deals (>50%) with vehicle list
  - Low ROI deals (<20%) with common issues
  - Recommendations:
    1. Focus on vehicles matching high ROI patterns
    2. Avoid vehicles with major repair issues
    3. Target quick flip strategies

---

### F) Dashboard System

**Source File:** quantum_dashboard.gs (202 lines)

`generateQuantumDashboard()` creates/refreshes a dashboard sheet with 5 sections:

#### Section 1: Header
- Title: "CarHawk Ultimate -- Quantum Dashboard"
- Subtitle with timestamp

#### Section 2: Key Metrics

| Metric | Source | Icon |
|--------|--------|------|
| Total Deals | Row count in DB | 📊 |
| Hot Deals | Col 42 count ("🔥 HOT DEAL") | 🔥 |
| Active Capital | Sum col 13 where status = Active | 💰 |
| Avg ROI | Average of col 27 | 📈 |
| Quick Flips | Count col 29 = 'Quick Flip' | ⚡ |

#### Section 3: Charts
- Chart placeholder section (for future chart implementation)

#### Section 4: Leaderboard

| Category | Source |
|----------|--------|
| Top ROI Deal | Highest col 27 value |
| Highest Profit | Highest col 26 value |
| Fastest Flip | Placeholder (days) |
| Best Platform | Facebook (65% success) |
| Hot Streak | Current week count |

#### Section 5: Market Insights

`generateMarketInsights()` returns dynamic insights:

| Condition | Insight |
|-----------|----------|
| SUV count > sedan count | "SUV demand trending higher than sedans" |
| Quick Flip count > 5 | "Quick flip opportunities above average" |
| (always) | "Sweet spot: 2018-2020 models with under 80k miles" |
| (always) | "Risk alert: Avoid high-mileage luxury brands" |
| (always) | "Profit optimizer: Target vehicles 20-30% below market" |

#### Dashboard Styling

| Property | Value |
|----------|-------|
| Title Font | Google Sans, 24pt bold |
| Subtitle | Gray (#666666), 14pt |
| Metric Values | 20pt |
| Column Widths | Col 1: 200px, Col 2-3: 150px |
| Borders | Solid #e0e0e0 on A5:J50 |

---

### G) Testing System

**Source File:** quantum_testing.gs (152 lines)

#### Test Functions

| Function | Purpose |
|----------|----------|
| `testCRMFunctions()` | Tests appointment, SMS, and campaign creation |
| `createTestDeal()` | Creates sample deal in database |
| `simulateInboundSMS()` | Logs 4 test SMS responses |
| `simulateCallLog()` | Creates test AI call entry |
| `simulateCampaignRun()` | Launches test campaign on 3 deals |
| `testBrowseAIImport()` | Tests Browse.AI integration setup |

#### Test Deal Data

```javascript
{
  dealId: 'TEST-{timestamp}-{random}',
  vehicle: '2020 Honda Civic EX',
  color: 'Silver',
  price: 15000,
  mileage: 50000,
  condition: 'Excellent',
  conditionScore: 95,
  platform: 'Test Platform',
  location: 'St. Louis, MO',
  zip: '63101',
  daysListed: 10,
  profit: 3000,
  roi: 20
}
```

#### Simulated Inbound SMS Messages

| # | Message | Expected Intent |
|---|---------|----------------|
| 1 | "Yes it's still available" | AVAILABLE |
| 2 | "Sorry, already sold" | SOLD |
| 3 | "Can you do $8000?" | NEGOTIATION |
| 4 | "When can we meet?" | SCHEDULING |

#### Simulated Call Data

- Duration: 5 minutes
- Direction: INBOUND
- Transcription mentions availability and appointment scheduling
- Expected outcome: Appointment Set

---

### H) Activity Logging

All system events are logged to the Activity Logs sheet via two functions:

#### `logQuantum(action, details)`
- Level: INFO
- Category: SYSTEM
- Includes: timestamp, user email, success flag

#### `logCRMActivity(action, dealId, details)`
- Level: INFO
- Category: CRM
- Includes: timestamp, deal ID association, user email

#### Log Levels Used

| Level | Used For |
|-------|----------|
| INFO | Normal operations, syncs, exports |
| ALERT | Hot deal alerts, compliance warnings |
| ERROR | API failures, sync errors |

---

### I) Utility Functions Reference

**Source File:** quantum_utilities.gs (392 lines)

| Function | Purpose |
|----------|----------|
| `getQuantumSheet(name)` | Get sheet by name |
| `getQuantumSetting(key)` | Read setting from Settings sheet |
| `setQuantumSetting(key, value)` | Write/update setting |
| `logQuantum(action, details)` | Write to Activity Logs |
| `logCRMActivity(action, dealId, details)` | Write CRM event to logs |
| `generateQuantumId(prefix)` | Generate unique ID: PREFIX-timestamp-random |
| `standardizeMake(make)` | Normalize make names (Chevy → Chevrolet) |
| `detectPlatform(url)` | Detect platform from URL |
| `detectHotSeller(data)` | Flag urgent seller signals |
| `detectMultipleVehicles(desc)` | Flag dealer inventory |
| `formatTime(date)` | Format as "MMM dd, h:mm a" |
| `analyzeInboundResponse(dealId, msg)` | Process seller reply |
| `processCallInsights(dealId, callData)` | Analyze call transcript |
| `getEmailTemplate(name, deal)` | Get HTML email template |
| `updatePostSaleTracker(dealId, closeId, data)` | Write post-sale record |
| `updateExportRecordIds(leadIds)` | Update CRM export with IDs |
| `logCRMExport(platform, count, fileId)` | Log CRM export event |
| `include(filename)` | HTML template inclusion |

---

## Spec Pack Index

| Part | File | Covers |
|------|------|--------|
| 1 | SPEC_PACK_PART1_SYSTEM_OVERVIEW.md | Identity, architecture, file inventory, config, menu, initialization |
| 2 | SPEC_PACK_PART2_SHEET_SCHEMAS.md | All 25 core + Turo sheet schemas with exact column definitions |
| 3 | SPEC_PACK_PART3_AI_ENGINE.md | OpenAI integration, calculations, scoring, knowledge base |
| 4 | SPEC_PACK_PART4_CRM_ENGINE.md | CRM pipeline, follow-ups, SMS/email, automation, API layer |
| 5 | SPEC_PACK_PART5_BROWSE_AI.md | Browse.AI robots, import pipeline, 10 platforms, URL builders |
| 6 | SPEC_PACK_PART6_INTEGRATIONS.md | SMS-iT, Ohmylead, CompanyHub, API delivery, credentials |
| 7 | SPEC_PACK_PART7_UI_COMPONENTS.md | 18 HTML dialogs, server-side HTML, design system |
| 8 | SPEC_PACK_PART8_TRIGGERS_ALERTS.md | Triggers, alerts, reporting, dashboard, testing, utilities |
| **9** | **SPEC_PACK_PART9_PAM.md** | **Project Arbitrage Module -- projects, needs, matching, AI evaluation** |
| Turo | TURO_SPEC_PACK.md | Complete Turo Rental Hold Module specification |
