# CompanyHub CRM Architecture Audit
## Honeycomb Investors LLC — Pattern C Implementation Review
**Auditor:** CRM Systems Audit
**Date:** February 16, 2026
**Document Under Review:** CompanyHub Multi-Strategy Real Estate Architecture (Feb 15, 2026)

---

# A) EXECUTIVE VERDICT: SAFE WITH CHANGES

The Pattern C (Acquisition Pipeline + Portfolio Table) design is architecturally correct. The separation of Deal-as-transaction from Property-as-asset is the right call. The pipeline stage sequence is sound for acquisition. The Properties table concept solves the "performing assets clogging the pipeline" problem that kills most RE CRM setups.

However, there are **11 execution-critical gaps** that will cause failures in production if not addressed before go-live. The most dangerous are: (1) creative finance deals have almost no term-tracking fields, (2) there is no deduplication or external ID strategy, (3) the most important automation (UTron #7) is a reminder email when it should be an auto-update, and (4) several UTron triggers assume CompanyHub capabilities that need verification.

None of these are architectural flaws. They are field omissions and automation assumptions that can be fixed within the existing Pattern C structure with ~15 new fields and 3 automation adjustments.

---

# B) TOP 15 OVERLOOKED ISSUES (Ranked by Severity)

### 1. CRITICAL — Creative Finance Deals Have No Term-Tracking Fields
**Severity: DEAL-BREAKING**

Sub-To, Seller Finance, and Wrap deals are note-servicing operations. The current architecture gives them `Monthly Rent/Income`, `Monthly Expenses`, and `Monthly Cash Flow`. That tracks the SPREAD but not the INSTRUMENT.

For Sub-To you need: existing lender, loan number, interest rate, monthly PITI, loan maturity date, due-on-sale risk assessment, payment authorization status.

For Seller Finance you need: note principal, interest rate, amortization period, balloon date, monthly payment amount, payment due day, payments received to date, remaining balance.

For Wraps you need ALL of the above — the underlying loan terms AND the wrap note terms, plus the spread.

Without these fields, you cannot service creative finance notes from this CRM. You will track them in a separate spreadsheet, which defeats the purpose of the CRM. A missed balloon date on a seller finance note is a default event. This is not optional.

---

### 2. CRITICAL — No Deduplication or External ID Strategy
**Severity: DATA INTEGRITY**

The architecture has no mechanism to prevent duplicate Property records. If the same property enters from Quantum (via SyncSpyder), from a manual entry, and from an SMS-iT response, you get three Property records for 123 Main St.

There is no `Quantum Row ID` or `External ID` field on the Deal table for SyncSpyder to match against. There is no address normalization strategy ("123 Main St" vs "123 Main Street" vs "123 main st"). The `Property Address` field is free text, not validated.

Without a dedup strategy, your reporting will double-count properties, your lookup fields will link to the wrong record, and your portfolio dashboard will be unreliable within 60 days of production use.

---

### 3. CRITICAL — UTron #7 (Portfolio Update) Is a Reminder, Not an Automation
**Severity: SYSTEM DESIGN**

UTron #7 fires when a Deal moves to Closed and sends you an EMAIL telling you to manually update the Property's Asset Status. This is the single most important hand-off in the entire architecture — the bridge between acquisition and portfolio — and it relies on you reading an email and remembering to open the Property record.

If CompanyHub UTrons can update fields on linked records (through the Property lookup), this MUST be an auto-update, not a notification. If they cannot, you need a two-click workflow: close the deal, then immediately update the property — and the email should include a DIRECT LINK to the property record, not just instructions.

A busy operator running 10+ deals will miss this email within the first month. When they do, the Properties table becomes stale and the entire Pattern C advantage collapses.

---

### 4. HIGH — No Document/File Tracking
**Severity: COMPLIANCE**

There is no field anywhere in the architecture for tracking:
- Purchase and Sale Agreement (PSA)
- Inspection reports
- Title commitment / title search
- Closing disclosure (CD) / HUD-1
- Insurance policy
- Deed
- Promissory note (for creative finance)
- Assignment contract (for wholesale)

For a production system handling real transactions with real money, you need at minimum a `Documents Link` field (URL to Google Drive/Dropbox folder) on both the Deal and Property tables. For creative finance, the promissory note and deed are legal instruments that must be retrievable.

---

### 5. HIGH — Dead Reason Field Is Referenced but Never Defined
**Severity: FIELD OMISSION**

The pipeline spec for Stage 9 (Dead) says "Record Dead Reason." But no `Dead Reason` field exists in any section of the Deal table field list. This field is needed for dead-deal analysis reporting (why do deals die? at what stage? which lead sources produce the most dead deals?).

---

### 6. HIGH — No Earnest Money Deposit (EMD) Field
**Severity: FINANCIAL TRACKING**

When a deal goes Under Contract, you typically put down earnest money ($500-$5,000+). This is cash at risk until closing. There is no EMD field on the Deal table. For a solo operator managing multiple deals Under Contract simultaneously, knowing total EMD exposure is critical. If a deal dies, you need to know if the EMD is refundable or forfeited.

---

### 7. HIGH — Motivated Seller Fields Are on Wrong Table
**Severity: DATA MODEL**

`Motivated Seller?` (field 21) and `Motivation Reason` (field 22) are on the Properties table. These are DEAL-SPECIFIC, not property-specific. A seller who was not motivated when you first approached in January may be highly motivated in June due to a divorce filing, job loss, or new code violation.

If you approach the same property through two separate deals (first attempt dead, second attempt succeeds months later), the motivation data from Deal #1 is now overwritten by Deal #2. You lose the history.

These fields should be on the Deal table, in the Deal Details section, where they describe the seller's state during THIS specific transaction.

---

### 8. HIGH — No Entity/LLC Tracking
**Severity: COMPLIANCE AND TAX**

There is no field for tracking which legal entity holds title to a property. Most RE investors use multiple LLCs for liability isolation (one LLC per property or per strategy type). Without an `Entity / LLC` field on the Properties table, you cannot:
- Track which entity owns which asset
- Ensure insurance is in the correct entity name
- File taxes correctly per entity
- Know which operating agreement governs a property

---

### 9. MEDIUM — No "Nurture / Long-Term Follow-Up" Stage or Flag
**Severity: PIPELINE MANAGEMENT**

A seller says "call me in 6 months." Where does this deal go?
- If you keep it in Contacted/Negotiating → it clogs your active pipeline and appears on daily action lists.
- If you move it to Dead → you lose it and the reason it died is not "dead" — it is "not yet."
- If you set Next Follow-Up to 6 months out → it disappears from daily views but still sits in your active pipeline count, inflating your numbers.

You need either a 10th stage (`Nurture`) or a boolean flag (`Long-Term Follow-Up = Yes`) with a corresponding filter that excludes nurture deals from active pipeline counts.

---

### 10. MEDIUM — No Insurance Tracking on Properties
**Severity: ASSET MANAGEMENT**

For any owned property, insurance is a recurring expense, a lender requirement, and a compliance obligation. The architecture has no fields for:
- Insurance provider
- Policy number
- Annual premium
- Policy expiration date

A lapsed insurance policy on a Sub-To property can trigger the lender's force-placed insurance (3-5x the cost) or even accelerate the loan via the due-on-sale clause. This needs at minimum `Insurance Expiration` (Date) and `Annual Insurance Premium` (Currency) on the Properties table.

---

### 11. MEDIUM — No Status Change Date on Properties
**Severity: REPORTING**

When did the property move from "Owned—Rehab" to "Owned—Tenant Search"? There is no timestamp field for Asset Status changes. Without this, you cannot measure:
- Average rehab duration
- Time from purchase to tenant placement
- Time from tenant placement to refinance
- Days on market for listed flips

Add `Status Changed Date` (Date) to the Properties table. Update it manually (or via UTron) each time Asset Status changes.

---

### 12. MEDIUM — SyncSpyder Field Mapping Is Undefined
**Severity: INTEGRATION**

Phase 8 says "SyncSpyder integrations" but provides zero field mapping specification. Which Quantum spreadsheet columns map to which CompanyHub fields? What is the sync direction (one-way? bidirectional?)? What is the conflict resolution when both systems have different values?

Without a field mapping spec, the SyncSpyder implementation will be guesswork. Recommend creating an explicit mapping table before Phase 8 begins.

---

### 13. MEDIUM — UTron #2 and #6 Assume Date-Math Capabilities
**Severity: AUTOMATION**

UTron #2 (Skip Trace Nudge): Triggers on "Stage unchanged for 24+ hours." This requires CompanyHub to expose a `Stage Changed Date` or `Last Modified Date` field in UTron trigger conditions.

UTron #6 (Stale Deal Killer): Triggers on "Next Follow-Up < 14 days ago." This requires date subtraction in the trigger condition (today minus field value > 14 days).

UTron #8 (Rehab Budget Watchdog): Triggers on "Rehab Spent > Rehab Budget × 0.8." This requires arithmetic comparison between two fields in the trigger.

All three need to be verified against CompanyHub's actual UTron capabilities. If any cannot be done natively, the fallback is a weekly manual review with a saved filter — functional but not automated.

---

### 14. LOW — Comp Fields Are Unstructured
**Severity: DATA QUALITY**

Comps 1-3 (fields 42-44) are `Single Line Text` formatted as "123 Oak St — $185K — Sold 01/2026." This works for human reading but cannot be queried, filtered, or used in calculations. If you ever want to compare your purchase price against average comp value, you cannot.

This is acceptable for v1 since comps are primarily reference data from Quantum. Flag for future improvement: consider separate Comp Address / Comp Price / Comp Date fields, or accept that comps live in Quantum and the CRM fields are for quick reference only.

---

### 15. LOW — Multi-Family Properties Need Unit-Level Tracking
**Severity: SCALABILITY**

The Properties table has `Property Type` including `Duplex`, `Triplex`, `Fourplex`, and `Multi-Family`. But there is only one set of Tenant/Buyer Name, Lease Start, Lease End, Monthly Rent fields. A duplex has two units. A fourplex has four tenants with four different lease dates and four different rent amounts.

For v1 with a solo operator, this can be managed through notes or by creating one Property record per unit (treating "Unit A" and "Unit B" as separate records). But acknowledge this as a scaling limitation. Document the convention you choose.

---

# C) MISSING FIELDS (What Must Be Added, and Where)

## Deal Table — Add These Fields (8 new fields)

| # | Field | Type | Section | Rationale |
|---|-------|------|---------|-----------|
| 1 | Dead Reason | Picklist: `Seller Unresponsive`, `Price Too High`, `Title Issues`, `Inspection Failed`, `Financing Fell Through`, `Seller Backed Out`, `Buyer Backed Out (wholesale)`, `Better Deal Found`, `Market Changed`, `Could Not Locate Owner`, `Other` | Deal Details | Referenced in pipeline spec but never defined. Needed for dead-deal analysis. |
| 2 | Earnest Money Deposit | Currency | Deal Details | Cash at risk during Under Contract phase. |
| 3 | EMD Refundable? | Picklist: `Yes — Before DD Deadline`, `Yes — Full`, `No — Hard EMD`, `Partial` | Deal Details | Tracks your risk exposure if the deal dies. |
| 4 | Title Company | Single Line Text | Deal Details | Closing coordination. Who to call? |
| 5 | Documents Folder Link | Single Line Text (URL) | Deal Details | Link to Google Drive / Dropbox folder with PSA, inspections, title work. |
| 6 | Quantum Row ID | Single Line Text | Deal Details | External ID for SyncSpyder matching. Prevents duplicates. |
| 7 | Motivated Seller? | Picklist (moved from Properties) | Deal Details | Deal-specific, not property-specific. |
| 8 | Motivation Reason | Picklist (moved from Properties) | Deal Details | Deal-specific, not property-specific. |

**Revised Deal Table Total: 56 fields** (50 original + 8 new − 2 moved from Properties here are new fields on Deal, the Properties ones get removed)

## Properties Table — Add These Fields (12 new fields)

| # | Field | Type | Section | Rationale |
|---|-------|------|---------|-----------|
| 1 | Entity / LLC | Single Line Text | Property Identity | Which legal entity holds title. |
| 2 | Documents Folder Link | Single Line Text (URL) | Property Identity | Link to deed, insurance policy, lease, closing docs. |
| 3 | Insurance Expiration | Date | Property Financials | Prevent lapsed coverage. |
| 4 | Annual Insurance Premium | Currency | Property Financials | For expense tracking and cash flow accuracy. |
| 5 | HOA Monthly | Currency | Property Financials | Often missed expense that kills cash flow projections. |
| 6 | Status Changed Date | Date | Asset Management | When Asset Status last changed. Enables time-in-phase reporting. |
| 7 | Existing Loan — Lender | Single Line Text | New Section: Creative Finance Terms | For Sub-To and Wrap deals. |
| 8 | Existing Loan — Rate | Percent or Text | Creative Finance Terms | Interest rate on the loan you are taking subject-to. |
| 9 | Existing Loan — Monthly Payment | Currency | Creative Finance Terms | PITI on the underlying loan. |
| 10 | Existing Loan — Maturity Date | Date | Creative Finance Terms | When the underlying loan balloons or matures. |
| 11 | Note / Wrap — Balloon Date | Date | Creative Finance Terms | THE most critical date in any seller-finance or wrap deal. Miss this and you default. |
| 12 | Note / Wrap — Rate | Percent or Text | Creative Finance Terms | Interest rate on the note you are collecting. |

**Revised Properties Table Total: 56 fields** (46 original − 2 removed + 12 new)

## Buyers Table — No Changes Required
The 15-field spec from v2 is adequate for wholesale buyer management.

---

# D) WRONG PLACEMENT ISSUES

| Field(s) | Currently In | Should Be In | Reason |
|----------|-------------|-------------|--------|
| Motivated Seller? (field 21) | Properties table | Deal table — Deal Details section | Motivation is time-sensitive and deal-specific. A seller's motivation level changes over time and between different transaction attempts. Putting it on the Property means Deal #2 overwrites Deal #1's data. |
| Motivation Reason (field 22) | Properties table | Deal table — Deal Details section | Same as above. Motivation reason (divorce, pre-foreclosure, etc.) is a snapshot of the seller's situation during a specific deal, not a permanent property attribute. |

**No other placement issues found.** The remaining field assignments are correct. Specifically:
- Owner & Skip Trace data on Properties = correct (property-level research data)
- Rehab fields on Properties = correct (rehab is done to the property, not the deal)
- Financial fields on Properties = correct (ongoing asset performance)

---

# E) PIPELINE / STAGE RISKS

### Risk 1: No Nurture Stage — Warm Leads Have Nowhere to Live
**Impact: Pipeline clogging + lost deals**

Sellers who say "not now, call me later" have no home. They either clog the active pipeline or get killed prematurely.

**Fix:** Add a 10th stage: `Nurture` — positioned after Contacted and before Dead. Deals in Nurture have a Next Follow-Up date set months out. The "Stale Deal Killer" UTron (#6) should EXCLUDE nurture deals. Create a dedicated filter: "Nurture — Follow-Up Due This Month."

**Revised Pipeline:**
New Lead → Analyzed → Skip Traced → Contacted → Negotiating → Under Contract → Closing → Closed → Dead + **Nurture** (branch off after Contacted or Negotiating)

### Risk 2: "Closing" Stage May Confuse Wholesale Deals
**Impact: Low — process friction only**

For wholesale assignments, "Closing" means "assigning to the buyer and collecting the fee." For purchases, "Closing" means "going to the title company and wiring funds." These are different processes with different checklists.

**Fix (minimal):** Accept the ambiguity. The RE Strategy field clarifies context. No stage change needed. If it becomes a problem, add a `Closing Type` picklist: `Purchase Close`, `Assignment Close`, `Refinance Close`.

### Risk 3: "Analyzed" and "Skip Traced" Are Often Simultaneous
**Impact: Low — process friction for high-volume operators**

In practice, you often analyze a lead and skip trace it in the same session. Having two separate stages forces two stage moves for what feels like one action.

**Fix:** Keep both stages. They represent genuinely different readiness states (analyzed = you know the numbers; skip traced = you have contact info). The two-click cost is worth the pipeline clarity. But if this becomes friction, combine into "Qualified" (analyzed + skip traced).

### Risk 4: No Time-Bomb Visibility for Under Contract Deals
**Impact: Medium — missed deadlines**

Deals can sit in "Under Contract" for weeks. The pipeline board shows them all in one column with no indication of which ones have deadlines expiring tomorrow vs. next month.

**Fix:** UTron #4 (Contract Clock) partially addresses this. Additionally, the saved filter "Under Contract — Deadline This Week" should be created to surface urgent deals.

---

# F) STR / MTR / LTR HANDLING AUDIT

## Verdict: WORKS FOR ACQUISITION AND BASIC TRACKING. FAILS FOR OPERATIONAL MANAGEMENT.

### What Works
- The Deal pipeline correctly handles rental acquisitions (same front-half as any strategy).
- Properties table Asset Status correctly differentiates STR vs MTR vs LTR.
- Basic income/expense/cash flow tracking is present.
- Lease Start/End fields enable renewal tracking.
- UTron #9 (Lease Expiration Early Warning) catches renewals at 90 days.

### What Fails

**STR-Specific Gaps:**
- No `Listing Platform` field (Airbnb, VRBO, Furnished Finder, direct booking). You need to know where the property is listed.
- No `Average Daily Rate (ADR)` field. Monthly Rent/Income works for LTR but STR income fluctuates. ADR is the industry-standard STR metric.
- No `Occupancy Rate` field. A STR making $3,000/month at 90% occupancy is healthy. A STR making $3,000/month at 40% occupancy is underperforming but has upside. You cannot tell the difference.
- No cleaning/turnover cost tracking. For STR, cleaning costs are a major expense line item that directly affects profitability.
- **Reality check:** STR operational management (calendar, messaging, pricing, cleaning coordination) requires a dedicated tool like Hospitable, Guesty, or OwnerRez. The CRM should track STR as a portfolio asset, not try to manage bookings. The current architecture correctly does NOT try to manage bookings, which is good. But it should at minimum track ADR and occupancy for portfolio-level performance reporting.

**MTR-Specific Gaps:**
- No `Furnished?` flag. MTR properties are typically furnished. This affects rehab scope, insurance type, and listing approach.
- No `Target Tenant Type` field (traveling nurse, corporate relocation, insurance displacement, student). MTR tenant sourcing varies by type.

**LTR-Specific Gaps:**
- No `Security Deposit` field. This is a liability you hold and must return. Track it.
- No `Tenant Screening Status` picklist (Not Started, Application Received, Screening, Approved, Rejected). Tenant placement is a multi-step process that the current architecture compresses into "Owned—Tenant Search" → "Performing—LTR" with no intermediate visibility.

**Multi-Family Gap (all rental types):**
- Single tenant/lease field set per property. A duplex has two tenants. Current architecture cannot track Unit A and Unit B separately without creating duplicate property records. See Issue #15.

### Recommended Fix (Minimal)
Add to Properties table:
- `Furnished?` (Picklist: Yes, No, Partial) — 1 field
- `Security Deposit Held` (Currency) — 1 field
- `Listing Platform` (Picklist: Airbnb, VRBO, Furnished Finder, Zillow, MLS, Facebook Marketplace, Direct, Other) — 1 field

Accept that detailed STR operations (ADR, occupancy, cleaning) will be tracked in a dedicated STR tool. The CRM tracks the property as a portfolio asset.

For multi-family: document the convention "one Property record per unit" in your CRM playbook if you acquire multi-family properties.

---

# G) SUB-TO / SELLER FINANCE / WRAP HANDLING AUDIT

## Verdict: DOES NOT WORK AS-IS. REQUIRES A NEW FIELD SECTION.

This is the single largest gap in the architecture. Creative finance is not a side strategy — it is increasingly the PRIMARY acquisition method for deals where traditional financing does not work. The architecture treats creative finance the same as a cash purchase (close the deal, track income/expenses). That is fundamentally wrong.

### What Is Missing

**Sub-To Deals Need:**
A Sub-To deal means you are taking over an existing mortgage without the lender's knowledge (or consent). You are making someone else's mortgage payments. If you miss a payment, the seller's credit gets destroyed and they will sue you. If the lender discovers the transfer, they can call the loan due.

| Missing Field | Why It Is Critical |
|---------------|-------------------|
| Existing Lender Name | You need to know who you are paying every month |
| Existing Loan Number | For payment identification |
| Existing Interest Rate | Affects your true cost of capital |
| Existing Monthly Payment (PITI) | This is your primary expense — must be exact |
| Existing Loan Maturity Date | When does this loan expire? ARM adjustment dates? |
| Due-on-Sale Risk | Picklist: Low / Medium / High / Triggered — if lender calls the note, you must be prepared |
| Insurance in Your Name? | Did you add yourself as additional insured? Lapsed coverage = loan acceleration risk |

**Seller Finance Deals Need:**
A Seller Finance deal means the seller IS the bank. They gave you a note. You make payments to them.

| Missing Field | Why It Is Critical |
|---------------|-------------------|
| Note Principal Amount | How much you owe |
| Note Interest Rate | Your cost of capital |
| Note Amortization (months) | Payment calculation basis |
| Balloon Date | **THE MOST DANGEROUS DATE IN YOUR PORTFOLIO.** If you have a 5-year balloon and forget about it, you default. |
| Monthly Payment Amount | What you pay the seller each month |
| Payment Due Day | 1st of the month? 15th? Late fees? |
| Payments Made | How many payments completed |
| Remaining Balance | What you still owe (ideally calculated) |

**Wrap Deals Need:**
A Wrap is a Seller Finance deal layered on TOP of a Sub-To. You need BOTH sets of fields — the underlying loan terms AND the wrap note terms. The spread between what you collect from the wrap buyer and what you pay on the underlying loan is your profit.

| Missing Field | Why It Is Critical |
|---------------|-------------------|
| All Sub-To fields | The underlying loan you are servicing |
| All Seller Finance fields | The wrap note you are collecting |
| Monthly Spread | What you collect minus what you pay (your profit) |

### Recommended Fix

Add a new section to the Properties table: **"Creative Finance Terms"** (6-8 fields minimum).

At minimum, these 6 fields from the Missing Fields section (C) above:
1. Existing Loan — Lender
2. Existing Loan — Rate
3. Existing Loan — Monthly Payment
4. Existing Loan — Maturity Date
5. Note / Wrap — Balloon Date
6. Note / Wrap — Rate

For the remaining details (loan number, amortization, payments made, remaining balance), use the `Documents Folder Link` field to link to a dedicated amortization tracker spreadsheet. This prevents over-bloating the Properties table while ensuring the most CRITICAL dates and amounts are visible in the CRM at a glance.

**Non-negotiable minimum:** The Balloon Date and Loan Maturity Date fields MUST exist in the CRM. These are the two dates that, if missed, result in legal default. They need to be filterable, reportable, and tied to a UTron automation:

**NEW UTron — BALLOON DATE WARNING:**
- Type: Scheduled workflow (monthly)
- Trigger: Properties table: `Note / Wrap — Balloon Date` ≤ 6 months from today
- Action: Send email: "BALLOON DATE APPROACHING — {{PropertyRecord.Name}} balloon is due {{Balloon Date}}. Start refinance planning NOW. You have {{months remaining}} months."

This should be UTron #11. It is more important than several of the existing 10.

---

# H) AUTOMATION REALITY CHECK

| UTron # | Name | Will It Work? | Issue | Fix |
|---------|------|--------------|-------|-----|
| 1 | Hot Lead Fast-Track | YES | No issues. Simple field-value trigger. | None needed. |
| 2 | Skip Trace Nudge | MAYBE | Requires "stage unchanged for 24+ hours." CompanyHub may not expose stage-change timestamps in UTron conditions. | **Verify with CompanyHub support.** Fallback: scheduled query where Stage = Analyzed AND record Modified Date < yesterday. |
| 3 | Daily Action Briefing | MAYBE | Requires listing multiple records in an email body with counts. Verify CompanyHub email templates support record-list rendering. | **Verify template capabilities.** Fallback: send a simpler email with just the counts and a link to the saved filter. |
| 4 | Contract Clock | MAYBE | "Schedule follow-up emails at 7 days before deadline" requires date-relative scheduled actions — essentially creating future-dated emails from a single trigger. Many CRMs support this; verify CompanyHub does. | **Verify date-relative scheduling.** Fallback: create three separate UTrons: one triggering 7 days before Contract Deadline, one at 3 days, one on the day. |
| 5 | Wholesale Buyer Blast | YES, BUT LIMITED | Works as a notification. Does NOT actually blast buyers. The "eventually trigger SMS-iT campaign via SyncSpyder" note is aspirational — that integration does not exist yet. | Accept as a reminder for v1. Plan the SMS-iT auto-blast as a Phase 8+ enhancement. |
| 6 | Stale Deal Killer | MAYBE | Requires "Next Follow-Up < 14 days ago" — date subtraction in trigger. | **Verify date math support.** Fallback: use a saved filter "Stale Deals" and set a weekly calendar reminder to review it. |
| 7 | Deal Closed — Portfolio Update | WORKS BUT WRONG APPROACH | Sends a reminder email instead of auto-updating the Property. This is the most critical automation in the system and it relies on human memory. | **If CompanyHub UTrons can update linked records:** auto-set Property Asset Status based on RE Strategy value. **If not:** the email MUST include a direct clickable link to the Property record, not just instructions. |
| 8 | Rehab Budget Watchdog | MAYBE | Requires "Rehab Spent > Rehab Budget × 0.8" — cross-field arithmetic in trigger condition. | **Verify formula support in triggers.** Fallback: create a calculated field `Rehab Budget Used %` (ask support) and trigger on that field > 80. |
| 9 | Lease Expiration Warning | YES | Standard date-field comparison. Should work in any CRM with scheduled workflows. | None needed. |
| 10 | BRRRR Refinance Trigger | YES | Date-field comparison on a scheduled workflow. Standard capability. | None needed. |

**Summary:** 4 confirmed working, 5 need verification, 1 works but is architecturally wrong.

**Missing Automations That Should Exist:**

| # | New UTron | Type | Trigger | Action |
|---|-----------|------|---------|--------|
| 11 | Balloon Date Warning | Scheduled (monthly) | `Note/Wrap — Balloon Date` ≤ 6 months from today | Email alert: balloon approaching, start refi planning |
| 12 | Insurance Expiration Warning | Scheduled (monthly) | `Insurance Expiration` ≤ 60 days from today | Email alert: renew insurance before lapse |
| 13 | Nurture Re-engagement | Scheduled (weekly) | Stage = Nurture AND `Next Follow-Up` ≤ Today | Email: these nurture leads are ready for re-contact |

---

# I) REPORTING + DASHBOARD GAPS

## Currently Possible (with existing fields)
- Deal count by stage (pipeline report)
- Deal count by RE Strategy
- Revenue from closed deals (if final sale price and purchase price are tracked)
- Active portfolio by Asset Status
- Monthly cash flow across performing assets

## Missing KPIs That Should Be Tracked

| # | KPI | Why It Matters | Required Data |
|---|-----|---------------|---------------|
| 1 | **Lead-to-Close Conversion Rate** (overall and by strategy) | Tells you if you are wasting time on bad leads or bad strategies. | Deal count at New Lead vs Deal count at Closed, grouped by RE Strategy. Requires completed deals over time. |
| 2 | **Lead-to-Close Conversion by Lead Source** | Tells you which marketing channels produce deals, not just leads. | Deal count at Closed grouped by Lead Source. |
| 3 | **Average Days per Stage** | Identifies pipeline bottlenecks. If deals sit 30 days in "Negotiating," your follow-up game is weak. | Requires stage-change timestamps (not currently tracked — CompanyHub may log these internally). |
| 4 | **Cost per Lead by Source** | Tells you marketing ROI. $5,000 on direct mail producing 100 leads = $50/lead. If none close, that channel is dead. | Requires a marketing spend field or separate tracking. Not in CRM scope — track in a marketing spreadsheet, report in CRM via Lead Source conversion. |
| 5 | **Deal Velocity** | Deals closed per month, per quarter. Trend line shows if you are accelerating or stalling. | Close Date field, grouped by month. Achievable with current fields. |
| 6 | **Portfolio Cash-on-Cash Return** | Total annual cash flow ÷ total cash invested. The single most important portfolio metric. | Requires: total Monthly Cash Flow × 12, divided by total cash invested (Purchase Price + Rehab Spent − loan proceeds). Partially calculable. |
| 7 | **Vacancy Rate** | % of rental properties without tenants. Industry benchmark: <5% for LTR, <25% idle nights for STR. | Requires: count of properties in "Owned—Tenant Search" vs total rental properties. Achievable with current fields using filters. |
| 8 | **Rehab Budget Accuracy** | Rehab Budget vs Rehab Spent, averaged across completed rehabs. Tells you if your estimates are reliable. | Both fields exist. Need a report comparing them for properties where Rehab Status = Complete. |
| 9 | **Wholesale Assignment Speed** | Days from Under Contract to Assigned. Faster = less risk of deal falling through. | Requires stage-change timestamps. |
| 10 | **Dead Deal Analysis** | Why do deals die? At what stage? Which strategies have the highest death rate? | Requires Dead Reason field (currently missing — see Issue #5). |
| 11 | **Buyer Reliability Rate** | For wholesale: which buyers say "yes" and actually close? | Requires tracking buyer commitment vs. close on Buyers table. Consider adding `Deals Committed` and `Deals Closed` number fields to Buyers table. |

## Dashboard Recommendations

**Dashboard 1: Acquisition Command Center**
- Active deals by stage (pipeline view, already default)
- This week's follow-ups due (filter #4)
- Deals under contract with approaching deadlines
- Hot leads requiring action (filter #1)
- Monthly closed deals count + value

**Dashboard 2: Portfolio Performance**
- All performing assets with monthly cash flow
- Properties in rehab with budget status
- Leases expiring in next 90 days
- Creative finance notes with upcoming balloon dates
- Total portfolio monthly cash flow (sum)

**Dashboard 3: Business Health (Monthly Review)**
- Lead-to-close conversion rate trend
- Deals closed by strategy (pie chart)
- Revenue by strategy
- Dead deal reasons (bar chart)
- Lead source effectiveness

---

# J) SYNC / INTEGRATION RISK MAP

## Risk 1: SyncSpyder — No Field Mapping Defined
**Severity: HIGH**

The architecture says SyncSpyder will sync Quantum RE Analyzer ↔ CompanyHub. But there is no field-by-field mapping specification. Without this:
- SyncSpyder implementer must guess which columns map where
- Data types may not match (Quantum has formulas; CompanyHub has static fields)
- Sync direction is ambiguous (if you change ARV in CompanyHub, does it overwrite Quantum?)

**Fix:** Before Phase 8, create a mapping table:

| Quantum Column | CompanyHub Field | Table | Sync Direction | Notes |
|---------------|-----------------|-------|---------------|-------|
| Row ID | Quantum Row ID | Deal | Quantum → CRM | Unique key for matching |
| Property Address | Property Address | Properties | Quantum → CRM | Used for dedup |
| ARV | Estimated Resale | Deal | Quantum → CRM | One-way: Quantum is source of truth |
| Lead Score | Lead Score | Deal | Quantum → CRM | One-way |
| ... | ... | ... | ... | ... |

## Risk 2: Duplicate Records Across Systems
**Severity: HIGH**

Three systems can create contact/property data: Quantum (via SyncSpyder), SMS-iT (via response syncing), and CompanyHub (manual entry). Without a shared unique key and dedup logic:
- Same property address → multiple Property records
- Same seller phone number → multiple Deal records
- Same buyer → duplicate Buyer records

**Fix:**
1. Add `Quantum Row ID` to Deal table (already recommended in Missing Fields).
2. Establish property address as the dedup key on Properties table. Require standardized format: "123 Main St" (no "Street", no "St.", consistent capitalization). Consider if CompanyHub has dedup rules — if so, configure them on Property Address.
3. For SMS-iT syncing: use phone number as the match key to existing Deal records. Do not create new deals from SMS responses — only update existing ones.

## Risk 3: Lookup Field Limitations (Many-to-One)
**Severity: MEDIUM**

The Deal table has a `Property` lookup pointing to Properties. BRRRR explicitly requires multiple Deals pointing to the same Property (acquisition deal + refi deal). Verify that CompanyHub supports many-to-one lookups (multiple Deal records can reference the same Property record).

If CompanyHub's lookup is one-to-one (only one Deal can reference a given Property), the BRRRR refi tracking and the "Related Deal" chain concept both break.

**Likely fine** — most CRM lookup fields support many-to-one by default. But verify.

## Risk 4: SMS-iT Activity Does Not Flow to CompanyHub
**Severity: MEDIUM**

The architecture assumes SMS-iT outreach activity (messages sent, responses received) will appear in deal history. But the mechanism is undefined. SyncSpyder syncs spreadsheet ↔ CRM. SMS-iT ↔ CompanyHub sync is a separate integration path.

**Fix:** Define the SMS-iT → CompanyHub sync path:
- Option A: SMS-iT has a native CompanyHub integration (check).
- Option B: SyncSpyder can sync SMS-iT data (check).
- Option C: Manual — log SMS activity in Deal notes. Functional but slow.
- Option D: Zapier / Make.com as middleware between SMS-iT and CompanyHub.

## Risk 5: Calculated Fields Depend on CompanyHub Support
**Severity: LOW**

`Monthly Cash Flow` (field 37) is marked as "ideally a Calculated Field — ask support." If CompanyHub does not support calculated fields, this field must be manually updated every time income or expenses change. For a portfolio of 10+ properties, this means 10+ fields manually recalculated whenever a rent amount changes.

**Fix:** If calculated fields are not supported, accept manual entry for v1. Revisit when CompanyHub adds the feature, or maintain a parallel portfolio spreadsheet for financial calculations and use the CRM for status tracking only.

---

# K) RECOMMENDED CORRECTIONS (Exact Edits to Apply)

## Priority 1 — Must Fix Before Go-Live

| # | Action | Effort |
|---|--------|--------|
| 1 | Add "Creative Finance Terms" section to Properties table (6 fields: Existing Loan Lender, Existing Loan Rate, Existing Loan Monthly Payment, Existing Loan Maturity Date, Note/Wrap Balloon Date, Note/Wrap Rate) | 6 fields |
| 2 | Add `Quantum Row ID` (Single Line Text) to Deal table, Deal Details section | 1 field |
| 3 | Add `Dead Reason` picklist to Deal table, Deal Details section | 1 field |
| 4 | Move `Motivated Seller?` and `Motivation Reason` from Properties table to Deal table | 2 fields moved |
| 5 | Add `Documents Folder Link` (URL) to both Deal table and Properties table | 2 fields |
| 6 | Add `Earnest Money Deposit` (Currency) and `EMD Refundable?` (Picklist) to Deal table | 2 fields |
| 7 | Add `Entity / LLC` (Text) to Properties table, Property Identity section | 1 field |
| 8 | Upgrade UTron #7 from reminder email to auto-update (or add direct Property link in email) | Config change |
| 9 | Add `Nurture` stage to pipeline (after Contacted, before Dead) | Stage config |
| 10 | Create UTron #11: Balloon Date Warning (monthly, 6-month lookahead) | New automation |

## Priority 2 — Add Within First Month

| # | Action | Effort |
|---|--------|--------|
| 11 | Add `Status Changed Date` (Date) to Properties table | 1 field |
| 12 | Add `Insurance Expiration` (Date) and `Annual Insurance Premium` (Currency) to Properties table | 2 fields |
| 13 | Add `HOA Monthly` (Currency) to Properties table | 1 field |
| 14 | Add `Title Company` (Text) to Deal table | 1 field |
| 15 | Add `Security Deposit Held` (Currency) to Properties table | 1 field |
| 16 | Add `Furnished?` (Picklist) and `Listing Platform` (Picklist) to Properties table | 2 fields |
| 17 | Create UTron #12: Insurance Expiration Warning | New automation |
| 18 | Create UTron #13: Nurture Re-engagement | New automation |
| 19 | Verify UTrons #2, #3, #4, #6, #8 capabilities with CompanyHub support — document which work natively and which need workarounds | Verification |
| 20 | Create SyncSpyder field mapping specification (before Phase 8) | Document |

## Priority 3 — Optimization

| # | Action | Effort |
|---|--------|--------|
| 21 | Add `Deals Committed` and `Deals Closed` to Buyers table for reliability tracking | 2 fields |
| 22 | Add saved filter: "Balloon Dates Next 12 Months" on Properties | Filter config |
| 23 | Add saved filter: "Insurance Expiring Next 60 Days" on Properties | Filter config |
| 24 | Add saved filter: "Nurture — Follow-Up Due This Month" on Deals | Filter config |
| 25 | Add saved filter: "Under Contract — Deadline This Week" on Deals | Filter config |
| 26 | Build Dashboard 1 (Acquisition Command Center) report | Report config |
| 27 | Build Dashboard 2 (Portfolio Performance) report | Report config |
| 28 | Define multi-family unit tracking convention and document it | Process doc |

---

# L) FINAL OPTIMIZED CRM BLUEPRINT SUMMARY

## Architecture: Pattern C (Acquisition Pipeline + Portfolio Table) — CONFIRMED CORRECT

### Deal Table — 58 Fields (50 original + 8 new)

| Section | Fields | Changes |
|---------|--------|---------|
| A: Default Fields | 7 | No change |
| B: Deal Analysis | 16 | No change |
| C: Deal Details | 18 | +Dead Reason, +EMD, +EMD Refundable?, +Title Company, +Documents Folder Link, +Quantum Row ID, +Motivated Seller?, +Motivation Reason (last 2 moved from Properties) |
| D: Vehicle Info | 12 | No change (CarHawk) |
| E: Property Link | 3 | No change |
| **Total** | **58** | |

### Properties Table — 58 Fields (46 original − 2 moved + 14 new)

| Section | Fields | Changes |
|---------|--------|---------|
| Property Identity | 9 | +Entity/LLC, +Documents Folder Link |
| Property Details | 7 | No change |
| Owner & Skip Trace | 6 | −Motivated Seller?, −Motivation Reason (moved to Deal) |
| Property Financials | 8 | +Insurance Expiration, +Annual Insurance Premium, +HOA Monthly |
| Asset Management | 15 | +Status Changed Date |
| Creative Finance Terms | 6 | NEW SECTION: Existing Loan Lender, Rate, Monthly Payment, Maturity Date; Note/Wrap Balloon Date, Rate |
| Rental Operations | 3 | NEW: Furnished?, Security Deposit Held, Listing Platform |
| Comps & Links | 5 | No change (rename Property Notes to Property Notes/History for clarity) |
| **Total** | **58** | |

### Buyers Table — 17 Fields (15 original + 2 new)
- +Deals Committed (Number)
- +Deals Closed (Number)

### Pipeline — 10 Stages
New Lead → Analyzed → Skip Traced → Contacted → Negotiating → Under Contract → Closing → Closed → Dead → **Nurture**

### Saved Filters — 31 Total (27 original + 4 new)
- +Balloon Dates Next 12 Months (Properties)
- +Insurance Expiring Next 60 Days (Properties)
- +Nurture — Follow-Up Due This Month (Deals)
- +Under Contract — Deadline This Week (Deals)

### UTron Automations — 13 Total (10 original + 3 new)
- UTron #7: UPGRADED from reminder email to auto-update (or direct-link email)
- +UTron #11: Balloon Date Warning
- +UTron #12: Insurance Expiration Warning
- +UTron #13: Nurture Re-engagement

### Grand Total Field Count

| Table | Original | Revised | Delta |
|-------|----------|---------|-------|
| Deal | 50 | 58 | +8 |
| Properties | 46 | 58 | +12 net |
| Buyers | 15 | 17 | +2 |
| **Total** | **111** | **133** | **+22** |

22 additional fields across 3 tables. No table is bloated. The largest table (Properties at 58) is well within CRM limits and logically organized into 8 sections. The Deal table at 58 fields is clean — most operators will only interact with 15-20 fields on any given deal depending on strategy.

### Implementation Roadmap Revision
Add between Phase 1 and Phase 2:
- **Phase 1.5:** Add Creative Finance Terms section to Properties table spec (6 fields). Add missing Deal fields (Dead Reason, EMD, Documents Link, Quantum Row ID). Move Motivated Seller fields from Properties to Deal.

Add after Phase 7:
- **Phase 7.5:** Create UTrons #11 (Balloon Date), #12 (Insurance), #13 (Nurture). Verify UTrons #2, #3, #4, #6, #8 with CompanyHub support.

Add before Phase 8:
- **Phase 7.9:** Create SyncSpyder field mapping specification. Define dedup strategy and address normalization convention.

---

**END OF AUDIT**

*This architecture, with the corrections above, will support CarHawk + Real Estate dual-vertical operations inside CompanyHub without bloating any single table, without clogging the pipeline with performing assets, and without losing creative finance compliance data. The 22 additional fields are the minimum required to make this production-safe.*
