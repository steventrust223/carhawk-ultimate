# CarHawk Ultimate -- CRM Engine & Automation
## Spec Pack Part 4 of 8 | QUANTUM-2.0.0

---

### A) CRM Architecture Overview

**Source Files:** quantum_crm_engine.gs (379 lines), quantum_crm_helpers.gs (220 lines), quantum_crm_automation.gs (143 lines), quantum_crm_api.gs (139 lines)

**Pipeline Stages:**
```
IMPORTED → CONTACTED → RESPONDED → SCHEDULING → APPOINTMENT_SET → NEGOTIATING → CLOSED_WON
                                                                                 → LOST
```

**CRM Capabilities:**
- Appointment scheduling with reminders
- Automated follow-up sequences (SMS + Email)
- SMS conversation logging
- AI call logging with transcription analysis
- Multi-deal campaign management
- Closed deal recording with profit tracking
- Lead scoring and pipeline management
- Multi-channel outreach (SMS, Email, Phone)

---

### B) Follow-Up Sequences

**Defined in:** quantum_core.gs (CRM_CONFIG)

#### HOT_LEAD Sequence (4 touches)

| Step | Delay | Channel | Template |
|------|-------|---------|----------|
| 1 | Immediate | SMS | initial_hot |
| 2 | +30 min | SMS | follow_up_1 |
| 3 | +24 hours | SMS | follow_up_2 |
| 4 | +72 hours | EMAIL | follow_up_3 |

#### WARM_LEAD Sequence (3 touches)

| Step | Delay | Channel | Template |
|------|-------|---------|----------|
| 1 | Immediate | SMS | initial_warm |
| 2 | +24 hours | SMS | follow_up_1 |
| 3 | +5 days | EMAIL | follow_up_2 |

#### COLD_LEAD Sequence (2 touches)

| Step | Delay | Channel | Template |
|------|-------|---------|----------|
| 1 | Immediate | EMAIL | initial_cold |
| 2 | +7 days | SMS | reengagement |

---

### C) SMS Templates

Variables: `{name}`, `{year}`, `{make}`, `{model}`, `{price}`, `{vehicle}`

| Template | Message |
|----------|---------|
| initial_hot | "Hi {name}! I saw your {year} {make} {model} for ${price}. I'm a cash buyer ready to meet today. Is it still available?" |
| initial_warm | "Hi {name}, interested in your {make} {model}. Is it still for sale? I can come take a look this week." |
| initial_cold | "Hi, is your {year} {make} {model} still available? I'm looking for something like this." |
| follow_up_1 | "Hi {name}, following up on your {make} {model}. I'm still interested if it's available." |
| follow_up_2 | "Last check - is your {vehicle} still for sale? I have cash ready." |
| reengagement | "Hi {name}, still have your {vehicle}? Market conditions have improved, I can make a better offer now." |

---

### D) CRM Engine Functions

**File:** quantum_crm_engine.gs (379 lines)

| Function | Purpose | Returns |
|----------|---------|---------|
| `initializeCRMSystem(config)` | Sets up CRM with API credentials | void |
| `scheduleAppointment(dealId, data)` | Creates appointment in sheet | appointmentId |
| `createFollowUpSequence(dealId, type)` | Creates automated follow-up | campaignId |
| `logSMSConversation(dealId, phone, msg, dir, intent)` | Records SMS interaction | conversationId |
| `logAICall(dealId, callData)` | Logs call with transcription insights | callId |
| `launchCampaign(dealIds, type, name)` | Launches multi-deal campaign | campaignId |
| `recordClosedDeal(dealId, saleData)` | Records completed sale | closeId |
| `calculateDaysToClose(importDate)` | Days between import and close | number |
| `addToLeadsTracker(dealId, parsed, metrics)` | Adds deal to lead pipeline | leadId |
| `generateLeadTags(parsed, metrics)` | Creates searchable tags | string (CSV) |

---

### E) CRM Helpers -- NLP & Contact Management

**File:** quantum_crm_helpers.gs (220 lines)

#### Message Intent Detection

`analyzeMessageIntent(message)` classifies seller responses:

| Intent | Keywords |
|--------|----------|
| SOLD | "sold", "no longer available" |
| AVAILABLE | "yes", "still available" |
| SCHEDULING | "when", "time", "meet" |
| NEGOTIATION | "price", "negotiable", "offer" |
| OPT_OUT | "stop", "remove", "unsubscribe" |
| GENERAL | (default) |

#### Sentiment Analysis

`analyzeSentiment(text)` scores tone:

| Category | Keywords |
|----------|----------|
| POSITIVE | great, excellent, perfect, yes, interested, available, sure |
| NEGATIVE | sold, no, not, stop, dont, remove, spam |

Score > 0 = POSITIVE, < 0 = NEGATIVE, 0 = NEUTRAL

#### Call Analysis Functions

| Function | Purpose |
|----------|---------|
| `generateCallSummary(transcription)` | Extracts key sentences |
| `analyzeCallIntent(transcription)` | APPOINTMENT_REQUEST, PRICE_INQUIRY, CONDITION_INQUIRY, GENERAL_INQUIRY |
| `detectAppointmentInCall(transcription)` | Boolean: appointment scheduling detected |
| `detectPriceDiscussion(transcription)` | `{ discussed, keywords[], pricesMentioned }` |
| `extractObjections(transcription)` | PRICE, CONSIDERATION, DECISION_MAKER, NO_NEED, LOCATION |

#### Objection Patterns

| Objection | Regex Pattern |
|-----------|--------------|
| PRICE | "too high\|too much\|expensive" |
| CONSIDERATION | "need to think\|think about it" |
| DECISION_MAKER | "check with\|ask my" |
| NO_NEED | "already have\|don't need" |
| LOCATION | "too far\|distance" |

#### AI Call Scoring (0-100)

Base: 50 points

| Factor | Adjustment |
|--------|-----------|
| Outcome = "Appointment Set" | +30 |
| Sentiment = POSITIVE | +20 |
| Duration > 180 seconds | +10 |
| Sentiment = NEGATIVE | -20 |
| Outcome = "Not Interested" | -30 |
| Duration < 30 seconds | -10 |

#### Contact Management

| Function | Purpose | DB Columns Updated |
|----------|---------|-------------------|
| `incrementContactCount(dealId, type)` | Tracks contact metrics | 52 (count), 53 (last contact), 56-58 (SMS/Call/Email counts) |
| `updateDealStage(dealId, newStage)` | Changes pipeline stage | 51 (Stage) |
| `updateDealFollowUpStatus(dealId, status)` | Updates follow-up state | 60 (Follow-up Status) |
| `getDealById(dealId)` | Retrieves deal data | Returns object with all key fields |
| `fillTemplate(template, deal)` | Interpolates deal data into message templates | -- |

#### Deal Object (from getDealById)

```javascript
{
  dealId, year, make, model, price,
  sellerName, sellerPhone, sellerEmail,
  stage, rowNum
}
```

---

### F) CRM Automation

**File:** quantum_crm_automation.gs (143 lines)

#### Automated Triggers

| Trigger | Frequency | Function |
|---------|-----------|----------|
| Follow-Up Processor | Every 5 minutes | `processFollowUps()` |
| Campaign Processor | Every 10 minutes | `processCampaigns()` |
| Appointment Reminders | Every hour | `processAppointmentReminders()` |

#### Follow-Up Processing Logic

1. Query Follow Ups sheet for rows where Status = "Scheduled" AND scheduledTime <= now
2. Send via SMS or Email depending on type column
3. Update Status to "Sent" with sent timestamp
4. On error: increment retry count (col 18), log error message (col 19)

#### Campaign Processing Logic

1. Query Campaign Queue for rows where Status = "Scheduled" AND scheduledTime <= now
2. Look up deal's seller phone/email
3. Send SMS to sellerPhone or EMAIL to sellerEmail
4. Update Status (col 11), sent time (col 12), delivered flag (col 13)

#### Appointment Reminders

1. Query Appointments sheet for Status = "Scheduled" AND scheduledTime within next hour
2. Check Reminder Sent flag (col 14) is false
3. Send SMS: "Reminder: We're scheduled to meet about your {make} {model} at {time}"
4. Mark Reminder Sent = true
5. Log as REMINDER intent

---

### G) CRM API Layer

**File:** quantum_crm_api.gs (139 lines)

#### Delivery Channels

| Service | Purpose | Auth Keys | Priority |
|---------|---------|-----------|----------|
| SMS-iT | Primary SMS | SMSIT_API_KEY, SMSIT_WEBHOOK_URL | 1st |
| Twilio | Fallback SMS | TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE | 2nd |
| SendGrid | Primary Email | SENDGRID_API_KEY | 1st |
| Google MailApp | Fallback Email | (built-in) | 2nd |

#### Fallback Strategy

**SMS delivery order:**
1. SMS-iT webhook → 2. SMS-iT API → 3. Twilio

**Email delivery order:**
1. SendGrid → 2. Google MailApp

#### SMS-iT Webhook Payload

```javascript
POST {SMSIT_WEBHOOK_URL}
{
  phone: "+1XXXXXXXXXX",
  message: "string",
  dealId: "string",
  source: "CarHawk Ultimate"
}
```

#### Twilio SMS Payload

```javascript
POST https://api.twilio.com/2010-04-01/Accounts/{SID}/Messages.json
Authorization: Basic (SID:TOKEN)
{
  To: phoneNumber,
  From: twilioPhone,
  Body: message
}
```

#### SendGrid Email Payload

```javascript
POST https://api.sendgrid.com/v3/mail/send
Authorization: Bearer {SENDGRID_API_KEY}
{
  personalizations: [{ to: [{ email: to }] }],
  from: { email: alertEmail, name: businessName },
  subject: subject,
  content: [{ type: "text/html", value: body }]
}
```

---

### H) Inbound Response Handling

**File:** quantum_utilities.gs

`analyzeInboundResponse(dealId, message)` processes seller replies:

1. Analyzes message intent via `analyzeMessageIntent()`
2. Analyzes sentiment via `analyzeSentiment()`
3. Updates deal stage based on intent:
   - SOLD → LOST
   - AVAILABLE → RESPONDED
   - SCHEDULING → SCHEDULING
4. Sets response rate to 100% (column 55)
5. Logs SMS conversation

`processCallInsights(dealId, callData)` analyzes call transcriptions:

1. Detects appointment mentions → updates stage to APPOINTMENT_SET
2. Detects price discussions → logs to deal notes (column 50)

---

### I) Email Templates

**File:** quantum_utilities.gs

`getEmailTemplate(templateName, deal)` returns HTML emails with variable interpolation:

**Variables:** `{deal.sellerName}`, `{deal.year}`, `{deal.make}`, `{deal.model}`, `{YOUR_NAME}`

**Supported templates:** follow_up_3, follow_up_2, initial_cold

---

### J) Closed Deal Recording

`recordClosedDeal(dealId, saleData)` writes to Closed Deals sheet (28 columns):

- Generates Close ID (CLOSE-timestamp-random)
- Calculates days to close from import date
- Calculates profit, ROI, net profit after commission
- Also calls `updatePostSaleTracker()` for Post-Sale Tracker (34 columns)

---

### K) Campaign Launch

`launchCampaign(dealIds, campaignType, campaignName)`:

1. Generates Campaign ID
2. For each deal: looks up seller contact info
3. Creates follow-up sequence entries in Campaign Queue
4. Schedules SMS/Email touches per sequence type
5. Returns campaignId

`launchCampaignUI()` (quick launch):
- Gets top 50 deals via `getTopDeals()`
- Filters to hot deals (verdict contains 🔥 or ✅)
- Launches HOT_LEAD campaign on first 10 deals
