# CarHawk Ultimate -- Sheet Architecture & Column Schemas
## Spec Pack Part 2 of 8 | QUANTUM-2.0.0

---

### A) Sheet Inventory (20 Core + 5 Turo)

| # | Sheet Name | Columns | Tab Color | Icon | Source File |
|---|-----------|---------|-----------|------|-------------|
| 1 | Master Import | 19 | #4285f4 | 📥 | quantum_headers.gs |
| 2 | Master Database | 61 | #0f9d58 | 🗄️ | quantum_headers.gs |
| 3 | Verdict | 24 | #ea4335 | ⚖️ | quantum_headers.gs |
| 4 | Leads Tracker | 29 | #fbbc04 | 🎯 | quantum_headers.gs |
| 5 | Flip ROI Calculator | 32 | #673ab7 | 💰 | quantum_headers.gs |
| 6 | Lead Scoring & Risk Assessment | 26 | #ff6d00 | 📊 | quantum_headers.gs |
| 7 | CRM Integration | 24 | #00acc1 | 🤝 | quantum_headers.gs |
| 8 | Parts Needed | 31 | #795548 | 🔧 | quantum_headers.gs |
| 9 | Post-Sale Tracker | 34 | #607d8b | 📈 | quantum_headers.gs |
| 10 | Reporting & Charts | 12 | #9e9e9e | 📊 | quantum_headers.gs |
| 11 | Settings | 11 | #424242 | ⚙️ | quantum_headers.gs |
| 12 | Activity Logs | 11 | #212121 | 🤖 | quantum_headers.gs |
| 13 | Appointments | 20 | #4caf50 | 📅 | quantum_headers.gs |
| 14 | Follow Ups | 20 | #ff9800 | 🔄 | quantum_headers.gs |
| 15 | Campaign Queue | 20 | #9c27b0 | 📧 | quantum_headers.gs |
| 16 | SMS Conversations | 20 | #00bcd4 | 💬 | quantum_headers.gs |
| 17 | AI Call Logs | 20 | #f44336 | 📞 | quantum_headers.gs |
| 18 | Closed Deals | 28 | #4caf50 | ✅ | quantum_headers.gs |
| 19 | Knowledge Base | 20 | #3f51b5 | 📚 | quantum_headers.gs |
| 20 | Integrations | 19 | #009688 | 🔌 | quantum_headers.gs |
| 21 | Turo Engine | 39 | #00BCD4 | -- | turo_setup.gs |
| 22 | Fleet Manager | 26 | #4CAF50 | -- | turo_setup.gs |
| 23 | Maintenance & Turnovers | 14 | #FF9800 | -- | turo_setup.gs |
| 24 | Turo Pricing & Seasonality | Matrix | #9C27B0 | -- | turo_setup.gs |
| 25 | Insurance & Compliance | 17 | #F44336 | -- | turo_setup.gs |

**Notes:**
- Sheets 21-25 are Turo Module sheets -- see TURO_SPEC_PACK.md for full schemas.
- System sheets (Settings, Activity Logs, Integrations) have warning-only protection.
- All headers are frozen in row 1, bold, white text, colored backgrounds, Google Sans 11pt.

---

### B) Master Import (19 columns)

Source: `setupImportHeaders()` in quantum_headers.gs

| Col | Header | Type | Source |
|-----|--------|------|--------|
| A (0) | Import ID | String | Auto-generated |
| B (1) | Date (GMT) | DateTime | Import timestamp |
| C (2) | Job Link | URL | Browse.AI job URL |
| D (3) | Origin URL | URL | Original listing URL |
| E (4) | Platform | String | Detected from URL |
| F (5) | Raw Title | String | Listing title as scraped |
| G (6) | Raw Price | String | Price text as scraped |
| H (7) | Raw Location | String | Location as scraped |
| I (8) | Raw Description | String | Enhanced with [TAG: value] |
| J (9) | Seller Info | String | Enhanced with type detection |
| K (10) | Posted Date | String | Original post date |
| L (11) | Images Count | Number | Photo count |
| M (12) | Raw Mileage | String | Mileage as scraped |
| N (13) | Raw Year | String | Year as scraped |
| O (14) | Raw Condition | String | Condition as scraped |
| P (15) | Import Status | String | Processing status |
| Q (16) | Processed | Boolean | Has been synced to DB |
| R (17) | Master ID | String | Linked Deal ID in DB |
| S (18) | Error Log | String | Any import errors |

---

### C) Master Database (61 columns)

Source: `setupDatabaseHeaders()` in quantum_headers.gs

This is the central deal repository. Every deal lives here after import processing.

| Col | Header | Type | Category |
|-----|--------|------|----------|
| A (0) | Deal ID | String | Metadata |
| B (1) | Import Date | DateTime | Metadata |
| C (2) | Platform | String | Metadata |
| D (3) | Status | String | Metadata |
| E (4) | Priority | String | Metadata |
| F (5) | Year | Number | Vehicle Specs |
| G (6) | Make | String | Vehicle Specs |
| H (7) | Model | String | Vehicle Specs |
| I (8) | Trim | String | Vehicle Specs |
| J (9) | VIN | String | Vehicle Specs |
| K (10) | Mileage | Number | Vehicle Specs |
| L (11) | Color | String | Vehicle Specs |
| M (12) | Title | String | Listing Info |
| N (13) | Price | Currency | Listing Info |
| O (14) | Location | String | Listing Info |
| P (15) | ZIP | String | Listing Info |
| Q (16) | Distance | Number | Listing Info |
| R (17) | Location Risk | String | Listing Info |
| S (18) | -- | -- | -- |
| T (19) | Condition | String | Condition |
| U (20) | Condition Score | Number | Condition |
| V (21) | Repair Keywords | String | Condition |
| W (22) | Repair Risk Score | Number | Condition |
| X (23) | Est. Repair Cost | Currency | Condition |
| Y (24) | -- | -- | -- |
| Z (25) | Market Value | Currency | Market Analysis |
| AA (26) | MAO | Currency | Market Analysis |
| AB (27) | Profit Margin | Currency | Market Analysis |
| AC (28) | ROI % | Percent | Market Analysis |
| AD (29) | Capital Tier | String | Market Analysis |
| AE (30) | Flip Strategy | String | Sales Velocity |
| AF (31) | Sales Velocity Score | Number | Sales Velocity |
| AG (32) | Market Advantage | Number | Sales Velocity |
| AH (33) | Days Listed | Number | Sales Velocity |
| AI (34) | Seller Name | String | Seller Info |
| AJ (35) | Seller Phone | String | Seller Info |
| AK (36) | Seller Email | String | Seller Info |
| AL (37) | Seller Type | String | Seller Info |
| AM (38) | Deal Flag | String | Deal Flags |
| AN (39) | Hot Seller? | Boolean | Deal Flags |
| AO (40) | Multiple Vehicles? | Boolean | Deal Flags |
| AP (41) | Seller Message | String | Deal Flags |
| AQ (42) | AI Confidence | Number | Verdict |
| AR (43) | Verdict | String | Verdict |
| AS (44) | Verdict Icon | String | Verdict |
| AT (45) | Recommended? | String | Verdict |
| AU (46) | Image Score | Number | Engagement |
| AV (47) | Engagement Score | Number | Engagement |
| AW (48) | Competition Level | Number | Engagement |
| AX (49) | Last Updated | DateTime | CRM Fields |
| AY (50) | Assigned To | String | CRM Fields |
| AZ (51) | Notes | String | CRM Fields |
| BA (52) | Stage | String | CRM Fields |
| BB (53) | Contact Count | Number | CRM Fields |
| BC (54) | Last Contact | DateTime | CRM Fields |
| BD (55) | Next Action | String | CRM Fields |
| BE (56) | Response Rate | Percent | CRM Fields |
| BF (57) | SMS Count | Number | CRM Fields |
| BG (58) | Call Count | Number | CRM Fields |
| BH (59) | Email Count | Number | CRM Fields |
| BI (60) | Meeting Scheduled | Boolean | CRM Fields |
| BJ (61) | Follow-up Status | String | CRM Fields |

**Turo Writeback Columns (appended by Turo Module -- BJ-BS):**

| Col | Header | Type |
|-----|--------|------|
| BK | Turo Hold Score | Integer 0-100 |
| BL | Turo Monthly Net | Currency |
| BM | Turo Payback Months | Decimal |
| BN | Turo Break-Even Util % | Percent |
| BO | Turo Risk Tier | String |
| BP | Turo vs Flip Delta | Currency |
| BQ | Turo Recommended? | String |
| BR | Turo Status | String |
| BS | Fleet ID | String |
| BT | Turo Notes | String |

**Deal Stages (pipeline lifecycle):**
```
IMPORTED → CONTACTED → RESPONDED → SCHEDULING → APPOINTMENT_SET → NEGOTIATING → CLOSED_WON
                                                                                → LOST
```

**Verdict Values:**
- 🔥 HOT DEAL
- ✅ SOLID DEAL
- ⚠️ PORTFOLIO FOUNDATION
- ❌ PASS

---

### D) Verdict (24 columns)

Source: `setupVerdictHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Analysis ID | String |
| B | Deal ID | String |
| C | Analysis Date | DateTime |
| D | Model Version | String |
| E | Quantum Score | Number 0-100 |
| F | AI Verdict | String |
| G | Confidence % | Number |
| H | Profit Potential | Currency |
| I | Risk Assessment | String |
| J | Market Timing | String |
| K | Competition Analysis | String |
| L | Price Optimization | String |
| M | Negotiation Strategy | String |
| N | Quick Sale Probability | Percent |
| O | Repair Complexity | String |
| P | Hidden Cost Risk | Number 0-100 |
| Q | Flip Timeline | String |
| R | Success Probability | Percent |
| S | Alternative Strategies | String |
| T | Key Insights | String |
| U | Red Flags | String |
| V | Green Lights | String |
| W | Market Comparables | String |
| X | Decision Matrix | String |

---

### E) Leads Tracker (29 columns)

Source: `setupLeadsTrackerHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Lead ID | String |
| B | Deal ID | String |
| C | Date Added | DateTime |
| D | Status | String |
| E | Priority | String (High/Medium/Low) |
| F | Stage | String |
| G | Vehicle | String |
| H | Price | Currency |
| I | Profit Potential | Currency |
| J | ROI % | Percent |
| K | Location | String |
| L | Distance | Number |
| M | Seller Name | String |
| N | Phone | String |
| O | Email | String |
| P | Best Contact Time | String |
| Q | Contact Attempts | Number |
| R | Last Contact | DateTime |
| S | Next Action | String |
| T | Action Date | DateTime |
| U | Response Rate | Percent |
| V | Interest Level | String |
| W | Negotiation Notes | String |
| X | Final Offer | Currency |
| Y | Close Probability | Percent |
| Z | Assigned To | String |
| AA | Tags | String |
| AB | Follow-up Required | Boolean |
| AC | SMS/Email Sent | Boolean |

---

### F) Flip ROI Calculator (32 columns)

Source: `setupROICalculatorHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Calc ID | String |
| B | Deal ID | String |
| C | Vehicle | String |
| D | Scenario | String |
| E | Purchase Price | Currency |
| F | Transport Cost | Currency |
| G | Inspection Cost | Currency |
| H | Repair Labor | Currency |
| I | Parts Cost | Currency |
| J | Detail Cost | Currency |
| K | Marketing Cost | Currency |
| L | Listing Fees | Currency |
| M | Other Costs | Currency |
| N | Total Investment | Currency |
| O | Target Sale Price | Currency |
| P | Market Comp Avg | Currency |
| Q | Days to Sell Est | Number |
| R | Holding Cost/Day | Currency |
| S | Total Holding | Currency |
| T | Transaction Fees | Currency |
| U | Total Costs | Currency |
| V | Net Profit | Currency |
| W | Profit Margin % | Percent |
| X | ROI % | Percent |
| Y | Cash on Cash | Percent |
| Z | Break Even Price | Currency |
| AA | Min Acceptable | Currency |
| AB | Max Acceptable | Currency |
| AC | Risk Score | Number |
| AD | Confidence Level | Percent |
| AE | Scenario Notes | String |

---

### G) Lead Scoring & Risk Assessment (26 columns)

Source: `setupScoringHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Score ID | String |
| B | Deal ID | String |
| C | Analysis Date | DateTime |
| D | Quantum Score | Number |
| E | Component Scores | String (JSON) |
| F | Market Score | Number |
| G | Vehicle Score | Number |
| H | Seller Score | Number |
| I | Timing Score | Number |
| J | Location Score | Number |
| K | Competition Score | Number |
| L | Profit Score | Number |
| M | Risk Score | Number |
| N | Velocity Score | Number |
| O | Condition Score | Number |
| P | Total Weighted Score | Number |
| Q | Percentile Rank | Number |
| R | Category | String |
| S | Investment Grade | String |
| T | Risk Factors | String |
| U | Opportunity Factors | String |
| V | Score Trend | String |
| W | Previous Score | Number |
| X | Score Change | Number |
| Y | Analyst Notes | String |
| Z | Override / Final Grade | String |

---

### H) CRM Integration (24 columns)

Source: `setupCRMHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Export ID | String |
| B | Export Date | DateTime |
| C | Platform | String |
| D | Deal IDs | String (CSV) |
| E | Record Count | Number |
| F | Export Type | String |
| G | Include Fields | String |
| H | Filters Applied | String |
| I | Total Value | Currency |
| J | Avg Deal Value | Currency |
| K | Hot Leads Count | Number |
| L | Contact Info Complete | Boolean |
| M | SMS/Email Ready | Boolean |
| N | Campaign Name | String |
| O | Template Used | String |
| P | Tags Applied | String |
| Q | CRM Record IDs | String |
| R | Sync Status | String |
| S | Sync Errors | String |
| T | Last Sync | DateTime |
| U | Next Sync | DateTime |
| V | Automation Enabled | Boolean |
| W | Response Tracking | Boolean |
| X | Conversion Count / Revenue | Number |

---

### I) Parts Needed (31 columns)

Source: `setupPartsHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Part ID | String |
| B | Deal ID | String |
| C | Vehicle | String |
| D | Category | String |
| E | Subcategory | String |
| F | Part Name | String |
| G | Part Number | String |
| H | OEM Number | String |
| I | Condition Needed | String |
| J | Price (New) | Currency |
| K | Price (Used) | Currency |
| L | Price (Reman) | Currency |
| M | Selected Option | String |
| N | Quantity | Number |
| O | Unit Cost | Currency |
| P | Total Cost | Currency |
| Q | Supplier Name | String |
| R | Supplier Contact | String |
| S | Lead Time (days) | Number |
| T | Stock Status | String |
| U | Order Date | DateTime |
| V | Delivery Date | DateTime |
| W | Quality Check | Boolean |
| X | Labor Hours | Number |
| Y | Labor Rate | Currency |
| Z | Labor Total | Currency |
| AA | Core Charge | Currency |
| AB | Warranty | String |
| AC | Notes | String |

---

### J) Post-Sale Tracker (34 columns)

Source: `setupPostSaleHeaders()` in quantum_headers.gs

| Col | Header | Type |
|-----|--------|------|
| A | Sale ID | String |
| B | Deal ID | String |
| C | Vehicle | String |
| D | Sale Date | DateTime |
| E | Days to Sell | Number |
| F | Buyer Name | String |
| G | Buyer Type | String |
| H | Sale Platform | String |
| I | Listed Price | Currency |
| J | Sale Price | Currency |
| K | Negotiation % | Percent |
| L | Purchase Price | Currency |
| M | Total Investment | Currency |
| N | Gross Profit | Currency |
| O | Net Profit | Currency |
| P | Actual ROI | Percent |
| Q | Projected ROI | Percent |
| R | Payment Method | String |
| S | Payment Status | String |
| T | Title Transfer | Boolean |
| U | Delivery Method | String |
| V | Buyer Satisfaction | Number 1-5 |
| W | Lessons Learned | String |
| X | Strategy Used | String |
| Y | Market Conditions | String |
| Z | Seasonal Impact | String |
| AA | Repeat Buyer | Boolean |
| AB | Referral Source | String |
| AC | Follow-up Date | DateTime |
| AD | Testimonial | String |
| AE | Case Study | Boolean |
| AF | Performance Grade | String |

---

### K) Remaining Sheets (Compact)

#### Reporting & Charts (12 columns)
Metric, Value, Change, Trend, Target, Status, Period, Comparison, Percentile, Grade, Action Required, Notes

#### Settings (11 columns)
Setting Key, Value, Updated, Description, Category, Data Type, Validation, Default, Required, Affects, Restart Required

#### Activity Logs (11 columns)
Timestamp, Level, Action, Category, Details, User, Deal ID, Duration (ms), Success, Error, Stack Trace

#### Appointments (20 columns)
Appointment ID, Deal ID, Vehicle, Seller Name, Phone, Email, Scheduled Time, Location, Location Type, Duration, Status, Type, Notes, Reminder Sent, Created Date, Created By, Updated Date, Confirmed, Show Rate, Outcome, Follow-up Required

#### Follow Ups (20 columns)
Follow-up ID, Deal ID, Campaign ID, Sequence Type, Step Number, Scheduled Time, Type, Template, Status, Sent Time, Response, Response Time, Opened, Clicked, Replied, Created Date, Priority, Retry Count, Error Message, Next Step

#### Campaign Queue (20 columns)
Touch ID, Campaign ID, Deal ID, Sequence Type, Touch Index, Type, Template, Subject, Message, Scheduled Time, Status, Sent Time, Delivered, Response, Response Type, Created Date, Tags, A/B Test, Performance Score, Cost

#### SMS Conversations (20 columns)
Conversation ID, Deal ID, Phone Number, Direction, Message, Timestamp, Status, Intent, Sentiment, Type, Campaign ID, Template Used, Response Time, Character Count, Media URL, Error Code, Cost, Provider, Thread ID, Tags

#### AI Call Logs (20 columns)
Call ID, Deal ID, Phone Number, Direction, Start Time, End Time, Duration, Recording URL, Transcription, Summary, Sentiment, Intent, Outcome, Next Action, Appointment Detected, Price Discussed, Objections, AI Score, Cost, Tags

#### Closed Deals (28 columns)
Close ID, Deal ID, Vehicle, Year, Make, Model, Mileage, Condition, Original Price, Purchase Price, Sale Price, Platform, Days to Close, Days on Market, Profit, ROI %, Close Date, Payment Method, Buyer Type, Marketing Cost, Repair Cost, Total Investment, Net Profit, Commission, Success Factors, Lessons Learned, Rating, Tags

#### Knowledge Base (20 columns)
KB ID, Make, Model, Years, Category, Common Issues, Repair Costs, Market Demand, Quick Flip Score, Avg Days to Sell, Price Range Low, Price Range High, Best Months, Target Buyer, Negotiation Tips, Red Flags, Success Rate, Updated Date, Data Points, Confidence Score

#### Integrations (19 columns)
Integration ID, Provider, Type, Name, API Key, Secret, Status, Last Sync, Next Sync, Sync Frequency, Records Synced, Error Count, Last Error, Configuration, Webhook URL, Features, Limits, Cost, Notes, Created Date

---

### L) Header Formatting Standard

Applied by `applyQuantumHeaders()` to every sheet:

| Property | Value |
|----------|-------|
| Font | Google Sans, 11pt |
| Weight | Bold |
| Text Color | White |
| Background | Sheet-specific color |
| Alignment | Center, Wrap |
| Row Height | 40px |
| Frozen Rows | 1 (header row) |
| Auto-resize | All columns |
