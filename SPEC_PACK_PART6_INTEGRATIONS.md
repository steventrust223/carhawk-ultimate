# CarHawk Ultimate -- Integrations & External APIs
## Spec Pack Part 6 of 8 | QUANTUM-2.0.0

---

### A) Integration Architecture

**Source Files:** quantum_integrations.gs (93 lines), quantum_sms_it.gs (175 lines), quantum_ohmylead.gs (83 lines), quantum_companyhub.gs (237 lines), quantum_crm_api.gs (139 lines)

All integrations are tracked in the **Integrations sheet** (20 columns) and managed via CRUD functions in quantum_integrations.gs.

---

### B) Integration Registry

#### `getActiveIntegrations()`

Returns array of active integration objects from Integrations sheet:

```javascript
{
  integrationId: string,
  provider: string,       // Browse.ai, SMS-iT, Ohmylead, CompanyHub
  type: string,           // Robot, Sheet, API, Webhook
  name: string,
  key: string,            // API key
  secret: string,
  status: string,         // Active, Inactive
  lastSync: DateTime,
  configuration: object,  // JSON parsed
  webhookUrl: string,
  notes: string
}
```

#### `addIntegration(data)`

Creates new record in Integrations sheet with auto-generated ID.

#### `updateIntegrationSync(id, recordsSynced)`

Updates last sync timestamp and accumulates records synced count.

#### `updateIntegrationError(id, error)`

Increments error count and stores last error message.

---

### C) SMS-iT Integration

**File:** quantum_sms_it.gs (175 lines)

**Purpose:** Export hot deals as leads to SMS-iT for campaign management.

#### Export Flow

```
Master Database
      ↓ filter: verdict = '🔥 HOT DEAL' or '✅ SOLID DEAL' AND phone exists
exportQuantumSMS()
      ↓ show preview dialog
getQuantumSMSExportHTML(hotDeals)
      ↓ user selects deals, writes message, configures campaign
processQuantumSMSExport(config)
      ↓ format data, send webhook
sendToSMSIT(data, webhookUrl)
      ↓
SMS-iT Platform → SMS delivery
      ↓
logCRMExport() + createFollowUpSequence() (optional)
```

#### SMS-iT Webhook Payload

```javascript
POST {SMSIT_WEBHOOK_URL}
{
  source: 'CarHawk Ultimate',
  version: QUANTUM.VERSION,
  timestamp: ISO string,
  leads: [
    {
      dealId: string,
      phone: '+1XXXXXXXXXX',
      name: string,
      customFields: {
        vehicle: '2020 Honda Civic',
        year: 2020,
        make: 'Honda',
        model: 'Civic',
        price: 15000,
        platform: 'Facebook',
        verdict: '🔥 HOT DEAL',
        roi: 45,
        profit: 3000,
        distance: 12
      },
      tags: ['carhawk', 'hot-deal', 'facebook', 'contacted'],
      message: string,
      campaignName: string,
      sequenceType: 'HOT_LEAD'
    }
  ]
}
```

#### Sequence Type Classification

`determineSequenceType(dealData)`:

| Condition | Sequence |
|-----------|----------|
| Verdict contains 🔥, confidence > 85 | HOT_LEAD |
| Verdict contains ✅, days listed < 14 | WARM_LEAD |
| Everything else | COLD_LEAD |

#### Database Columns Referenced

| Col Index | Field |
|-----------|-------|
| 0 | Deal ID |
| 2 | Platform |
| 5-7 | Year, Make, Model |
| 13 | Price |
| 16 | Distance |
| 26-27 | Profit, ROI |
| 28 | Flip Strategy |
| 32 | Days Listed |
| 33-34 | Seller Name, Phone |
| 40 | AI Analysis Message |
| 41-42 | Confidence, Verdict |

---

### D) Ohmylead Integration

**File:** quantum_ohmylead.gs (83 lines)

**Purpose:** Two-way appointment sync with Ohmylead booking platform.

#### Outbound Sync

`syncOhmyleadAppointments()`:
1. Reads Appointments sheet
2. Filters Status = "Scheduled" AND synced flag (col 17) = false
3. Sends each appointment to Ohmylead webhook
4. Marks as synced on success

**Payload sent:**

```javascript
POST {OHMYLEAD_WEBHOOK_URL}
{
  appointmentId: string,
  dealId: string,
  vehicle: string,
  sellerName: string,
  phone: string,
  scheduledTime: DateTime,
  location: string,
  notes: string
}
```

#### Inbound Booking

`receiveOhmyleadBooking(bookingData)`:
1. Receives booking from Ohmylead webhook callback
2. Creates appointment via `scheduleAppointment()`
3. Updates deal stage to APPOINTMENT_SET
4. Logs SMS conversation if booking originated from SMS

**Booking data received:**

```javascript
{
  dealId: string,
  scheduledTime: DateTime,
  location: string,
  locationType: 'In-Person',
  duration: 30,
  type: 'Viewing',
  notes: string,
  source: 'SMS' (optional)
}
```

---

### E) CompanyHub CRM Export

**File:** quantum_companyhub.gs (237 lines)

**Purpose:** Export recommended deals to CompanyHub CRM via CSV file on Google Drive.

#### Export Flow

```
Master Database
      ↓ filter: Recommended = 'YES' (col 44)
exportQuantumCRM()
      ↓ user confirms
formatForCompanyHub(deals)
      ↓ map stages, calculate probability
generateCompanyHubCSV(data)
      ↓ save to Google Drive
logCRMExport()
```

#### Stage Mapping

| CarHawk Stage | CompanyHub Stage |
|---------------|-----------------|
| IMPORTED | New Lead |
| CONTACTED | Contacted |
| RESPONDED | Qualified |
| APPOINTMENT_SET | Meeting Scheduled |
| NEGOTIATING | Negotiation |
| CLOSED_WON | Closed Won |
| LOST | Closed Lost |

#### Deal Probability Calculation

`calculateDealProbability(deal)`:

Base probability by verdict:

| Verdict | Base % |
|---------|--------|
| 🔥 HOT DEAL | 80% |
| ✅ SOLID DEAL | 60% |
| ⚠️ PORTFOLIO FOUNDATION | 40% |
| ❌ PASS | 5% |

Adjustments:
- +20% if stage = APPOINTMENT_SET
- +10% if stage = RESPONDED
- +10% if response rate > 80%
- Capped at 5-95%

#### Expected Close Date

`calculateExpectedCloseDate(deal)`:
- Uses knowledge base avg days to sell
- HOT DEAL: 70% of base time
- PASS: 200% of base time
- Returns ISO date string

#### Tag Generation

`generateCompanyHubTags(deal)`:

Tags applied based on deal attributes:
- Verdict: hot-deal, solid-deal
- Platform: facebook, craigslist, etc.
- Distance: local (<25mi), regional (25-75mi), distant (>75mi)
- Financial: high-roi (>50%), high-profit (>$3000)
- Engagement: contacted, responsive

#### CSV Export Fields

| Field | Source |
|-------|--------|
| Company | Seller Name |
| Contact Name | Seller Name |
| Phone | Seller Phone |
| Email | Seller Email |
| Deal Name | "Year Make Model" |
| Deal Value | Price |
| Expected Profit | Profit |
| ROI % | ROI |
| Stage | Mapped stage |
| Probability | Calculated |
| Expected Close Date | Calculated |
| Lead Score | Quantum Score |
| Source | Platform |
| Location | Location |
| Distance | Distance |
| Days on Market | Days Listed |
| Contact Attempts | Contact Count |
| Response Rate | Response Rate |
| Tags | Generated tags |
| CarHawk ID | Deal ID |
| Verdict | Verdict |
| Vehicle | "Year Make Model" |

**Turo fields (if module enabled):**
- Turo Score, Turo Monthly Net, Turo Payback Months
- Turo Risk Tier, Turo Status, Fleet ID

---

### F) API Delivery Layer

**File:** quantum_crm_api.gs (139 lines)

#### SMS Delivery

| Function | Service | Priority |
|----------|---------|----------|
| `sendViaSMSIT(phone, message, dealId)` | SMS-iT | 1st (webhook then API) |
| `sendSMS(phone, message)` | Twilio | 2nd (fallback) |

**Phone formatting:** `formatPhoneForSMSIT()` → +1XXXXXXXXXX

#### Email Delivery

| Function | Service | Priority |
|----------|---------|----------|
| `sendEmail(to, subject, body)` | SendGrid | 1st |
| (fallback) | Google MailApp | 2nd |

#### Combined Functions

| Function | Purpose |
|----------|---------|
| `sendFollowUpSMS(dealId, templateName)` | Look up deal, fill template, send SMS |
| `sendFollowUpEmail(dealId, templateName)` | Look up deal, fill template, send email |
| `sendReminderSMS(phone, message)` | Direct SMS for appointment reminders |
| `sendCampaignSMS(phone, message)` | Campaign SMS via SMS-iT |
| `sendCampaignEmail(email, subject, msg)` | Campaign email via SendGrid |

---

### G) Required API Credentials

All stored in the Settings sheet:

| Service | Required Keys | Purpose |
|---------|--------------|---------|
| OpenAI | OPENAI_API_KEY | AI deal analysis |
| Browse.AI | (script properties) | Web scraping |
| SMS-iT | SMSIT_API_KEY, SMSIT_WEBHOOK_URL | SMS campaigns |
| Ohmylead | OHMYLEAD_WEBHOOK_URL | Appointment sync |
| Twilio | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE | Fallback SMS |
| SendGrid | SENDGRID_API_KEY | Email delivery |
| CompanyHub | (file export, no API key) | CRM export |

**Minimum required:** OpenAI API key, Alert Email
**Recommended:** + SMS-iT for outreach
**Full CRM:** + Ohmylead + SendGrid/Twilio

---

### H) Google Services Used

| Service | Scope | Purpose |
|---------|-------|---------|
| SpreadsheetApp | spreadsheets | All sheet operations |
| DriveApp | drive | CSV exports, file storage |
| UrlFetchApp | script.external_request | All external API calls |
| MailApp | gmail.send | Fallback email delivery |
| ScriptApp | script.scriptapp | Trigger management |
| PropertiesService | (built-in) | URL deduplication, API key storage |
| HtmlService | script.container.ui | Dialogs, modals, sidebars |

---

### I) Sync Status Tracking

Every integration sync is tracked in the Integrations sheet:

| Column | Purpose |
|--------|---------|
| Last Sync | Timestamp of last successful sync |
| Next Sync | Calculated from sync frequency |
| Sync Frequency | Minutes between syncs |
| Records Synced | Cumulative count |
| Error Count | Number of failures |
| Last Error | Most recent error message |
| Status | Active / Inactive |

The `syncQuantumCRM()` menu handler checks each configured integration and runs its sync function:
- SMS-iT: `exportQuantumSMS()`
- Ohmylead: `syncOhmyleadAppointments()`
