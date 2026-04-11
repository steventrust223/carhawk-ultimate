# CarHawk Ultimate -- UI Components & HTML Dialogs
## Spec Pack Part 7 of 8 | QUANTUM-2.0.0

---

### A) UI Architecture

**Source Files:** quantum_ui.gs (224 lines), quantum_menu_handlers.gs (538 lines), quantum_setup_html.gs (309 lines), quantum_processing_html.gs (87 lines), quantum_sms_export_html.gs (322 lines), plus 18 standalone HTML files.

**Design System:**
- Dark theme: #1a1a2e background, #00d4ff cyan accent, #e0e0e0 text
- Font: Segoe UI, Arial, sans-serif (monospace for VIN input)
- Card-based layouts with consistent styling
- Status badges with color coding
- No external CSS/JS libraries -- all custom inline
- All dialogs use `google.script.host.close()` for dismissal

---

### B) Server-Side Generated HTML (3 files)

#### Setup Wizard (quantum_setup_html.gs -- 309 lines)

| Property | Value |
|----------|-------|
| Type | Modal dialog |
| Size | 800 x 600 |
| Function | `getQuantumSetupHTML()` |
| Launched by | `initializeQuantumSystem()` |

**Features:**
- Glassmorphism container with backdrop blur
- Pulsing quantum logo animation
- 8-item feature grid: AI Analysis, Market Data, Scoring, Workflows, Analytics, Alerts, SMS-iT, Ohmylead
- Configuration form: Business Name, Home ZIP, OpenAI API Key, SMS-iT Key, Ohmylead Webhook, Profit Target, Analysis Depth, Alert Email
- Calls `google.script.run.deployQuantumArchitecture(config)` on submit
- Loading overlay with spinner and status updates

#### Processing Dialog (quantum_processing_html.gs -- 87 lines)

| Property | Value |
|----------|-------|
| Type | Modal dialog |
| Function | `getQuantumProcessingHTML(count)` |

**Features:**
- Gradient background (#667eea to #764ba2)
- Animated spinner (rotating border)
- Animated progress bar (gradient pink-red-purple)
- Stats text: "Processing X items..."

#### SMS Export Dialog (quantum_sms_export_html.gs -- 322 lines)

| Property | Value |
|----------|-------|
| Type | Modal dialog |
| Function | `getQuantumSMSExportHTML(hotDeals)` |
| Launched by | `exportQuantumSMS()` |

**Features:**
- 3-card stats bar: Total Leads, Total Value, Avg ROI
- Campaign settings form: name, message template, send delay, include AI analysis, create follow-ups
- Deal selection table with select all/none toggle, checkboxes per row
- Columns: Deal ID, Vehicle, Price, ROI %, Seller Name, Phone, Verdict
- Live message preview with placeholder interpolation ({name}, {year}, {make}, {model}, {price})
- Calls `google.script.run.processQuantumSMSExport(config)` on export

---

### C) Standalone HTML Components (18 files)

#### Appointments & Scheduling

| File | Type | Size | Launcher | Dimensions |
|------|------|------|----------|-----------|
| AppointmentManager.html | Modal | 68 lines | `openAppointmentManager()` | 800 x 600 |

- Today's appointments list with time, customer, vehicle, type
- Color-coded badges: test-drive, delivery, inspection
- New Appointment button

#### CRM & Communication

| File | Type | Size | Launcher | Dimensions |
|------|------|------|----------|-----------|
| CallLogs.html | Modal | 88 lines | `openCallLogs()` | 800 x 600 |
| SMSConversations.html | Modal | 86 lines | `openSMSConversations()` | 800 x 600 |
| CampaignManager.html | Modal | 78 lines | `openCampaignManager()` | 800 x 600 |
| FollowUpCenter.html | Modal | 29 lines | `openFollowUpCenter()` | 800 x 600 |
| FollowUpSequences.html | Modal | 64 lines | `manageFollowUpSequences()` | 800 x 600 |

**CallLogs.html:**
- 4-metric grid: Total Calls (47), Outbound (28), Inbound (15), Missed (4)
- Call log entries with direction icons (green inbound, cyan outbound, red missed)
- Duration, customer, purpose, timestamp

**SMSConversations.html:**
- Conversation list with 4 contacts, avatar initials, last message preview, unread indicator
- Expandable chat view with incoming/outgoing message bubbles and timestamps

**CampaignManager.html:**
- Campaign list: name, channel (SMS/Email), start date, stats (sent, open rate, reply rate)
- Status badges: Active, Completed, Draft

**FollowUpCenter.html:**
- Active follow-ups and scheduled actions sections (stub for expansion)

**FollowUpSequences.html:**
- Active sequences with step counts and contact counts
- Detailed 5-step sequence view: Welcome SMS (immediate), Follow-up Call (1hr), Vehicle Details Email (1 day), Check-in SMS (3 days), Final Offer (7 days)
- Status badges: Active, Paused

#### Deal Analysis & Calculators

| File | Type | Size | Launcher | Dimensions |
|------|------|------|----------|-----------|
| DealAnalyzer.html | Modal | 90 lines | `showDealAnalyzer()` | 800 x 600 |
| DealCalculator.html | Modal | 79 lines | `openDealCalculatorPro()` | 600 x 800 (sidebar) |
| DealGallery.html | Full Page | 115 lines | `showDealGallery()` | 1200 x 800 |
| VINDecoder.html | Modal | 81 lines | `openQuantumVINDecoder()` | 600 x 500 |

**DealAnalyzer.html:**
- Form: Platform (dropdown from server), Vehicle, Listing Price, Market Value, Notes
- Client-side analysis: spread, margin %, risk score (Low/Medium/High)
- Results hidden until "Analyze Deal" clicked
- Template injection: `<?!= JSON.stringify(platforms || []) ?>`

**DealCalculator.html:**
- Real-time calculator with oninput triggers
- Inputs: Purchase Price, Repair/Reconditioning, Transport/Fees, Expected Sale Price
- Live results: Total Cost, Gross Profit, Margin %, Net Profit
- Color-coded profit (green positive, red negative)

**DealGallery.html:**
- Stats bar: Total Deals, Hot Deals, Total Profit Potential, Avg ROI
- Auto-fill grid of deal cards (280px min width)
- Card fields: Year/Make/Model, Platform, Location, Price, Profit, ROI, Mileage, Verdict
- Verdict badges: red (HOT), green (SOLID), gray (PASS)
- Action buttons: View, Analyze, Contact
- Server calls: `<?!= JSON.stringify(deals || []) ?>`, `google.script.run.processDealAction(action, dealId)`

**VINDecoder.html:**
- 17-character VIN input with live character counter
- Monospace font, uppercase transformation
- Results card: Year, Make, Model, Engine, Drive Type, Plant, Country
- Server call: `google.script.run.decodeVIN(vin)`

#### Analytics & Pipeline

| File | Type | Size | Launcher | Dimensions |
|------|------|------|----------|-----------|
| CRMAnalytics.html | Modal | 85 lines | `openCRMAnalytics()` | 1000 x 700 |
| PipelineView.html | Modal | 54 lines | `openPipelineView()` | 1200 x 800 |
| SpeedToLead.html | Modal | 51 lines | `openSpeedToLead()` | 600 x 800 |

**CRMAnalytics.html:**
- 4-metric KPI grid: Revenue MTD ($142K), Deals Closed (23), Close Rate (34%), Avg Deal Profit ($6.2K)
- Change indicators (up/down percentages)
- Horizontal bar chart: deals by source (Facebook, Website, Referral, Walk-in, Other)
- Sales funnel: 85 leads → 62 contacted → 41 qualified → 29 negotiating → 23 closed

**PipelineView.html:**
- Kanban-style 4-column pipeline: New Leads (3), Contacted (2), Negotiating (1), Closed Won (1)
- Deal cards with customer name, vehicle, price
- Horizontal scroll layout

**SpeedToLead.html:**
- 3 metric cards: Avg Response (2.4 min), Under 5 Min (87%), Today's Leads (14)
- Lead response time list, color-coded: Fast (green <5min), Medium (yellow 5-10min), Slow (red >10min)

#### System & Configuration

| File | Type | Size | Launcher | Dimensions |
|------|------|------|----------|-----------|
| Settings.html | Sidebar | 90 lines | `openQuantumSettings()` | 600 x 800 |
| IntegrationManager.html | Modal | 87 lines | `openIntegrationManager()` | 800 x 600 |
| KnowledgeBase.html | Modal | 57 lines | `openKnowledgeBase()` | 800 x 600 |
| QuantumHelp.html | Modal | 56 lines | `showQuantumHelp()` | 900 x 700 |
| QuickActions.html | Sidebar | 46 lines | `showQuickActions()` | 350 (sidebar) |

**Settings.html:**
- General toggles: Auto-Sync Inventory (on), Email Notifications (on), SMS Notifications (off)
- API Configuration: Browse.ai API Key, SMS-iT API Key inputs
- Thresholds: Min Profit Target ($1500), Speed-to-Lead Goal (5 min)
- Custom toggle switch components

**IntegrationManager.html:**
- 5 integration cards: Browse.ai (Connected), SMS-iT (Connected), VoIP (Setup Required), Email (Disconnected), Payment Gateway (Disconnected)
- Status indicators: green/red/yellow

**KnowledgeBase.html:**
- Search box for vehicles, guides, market data
- 4 reference cards: Common Recalls (2020-2024), Pricing Guide: Trucks & SUVs, Title Status Explained, EV Battery Health
- Tag system for categorization

**QuantumHelp.html:**
- 4 guide cards: Getting Started, Deal Workflow, Inventory Management, Analytics & Reports
- Keyboard shortcuts: Ctrl+Q (Quick Actions), Ctrl+N (New Deal), Ctrl+K (Search), Ctrl+S (Sync)

**QuickActions.html:**
- 4 action buttons: Sync Inventory, Analyze Deals, Check Alerts, Export Data
- Server call: `google.script.run.handleQuickAction(action)`

---

### D) Server-Side UI Functions

**File:** quantum_ui.gs (224 lines)

#### Data Retrieval

| Function | Purpose | Returns |
|----------|---------|---------|
| `getTopDeals(limit=20)` | Top deals from DB (verdict != PASS) | Array of deal objects |
| `getQuickStats()` | Aggregate stats from top 100 deals | `{ totalDeals, hotDeals, totalProfit, avgROI, platforms }` |

#### Action Routing

`processDealAction(action, dealId)`:

| Action | Routes To |
|--------|----------|
| 'view' | `navigateToDeal()` -- scrolls to deal row |
| 'export' | `exportSingleDeal()` -- SMS export single deal |
| 'analyze' | `analyzeSingleDeal()` -- AI analysis |
| 'contact' | `initiateDealContact()` -- HOT_LEAD follow-up |
| 'schedule' | `scheduleDealAppointment()` -- open scheduler |

`runQuickAction(action)`:

| Action | Routes To |
|--------|----------|
| 'sync' | `runQuantumSync()` -- Browse.AI + import |
| 'analyze' | `executeQuantumAIBatch()` -- batch AI |
| 'alerts' | Returns alert count |
| 'export' | `exportQuantumSMS()` -- hot deal export |

---

### E) System Diagnostics

`runSystemDiagnostics()` checks 5 health categories:

| Check | Function | Healthy When |
|-------|----------|-------------|
| Sheets | `checkSheets()` | All QUANTUM_SHEETS exist |
| Settings | `checkSettings()` | Settings sheet has rows |
| Integrations | `checkIntegrations()` | Active integrations > 0 |
| Triggers | `checkTriggers()` | Project triggers >= 3 |
| Performance | `checkPerformance()` | Sheet response < 3 seconds |

Returns overall health status report via alert dialog.
