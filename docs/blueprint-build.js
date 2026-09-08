const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, TableOfContents, LevelFormat, PageOrientation,
  Header, Footer, PageNumber, convertInchesToTwip
} = require('docx');
const fs = require('fs');

// ---------- constants ----------
const CONTENT_W = 9360;            // 12240 letter - 2*1440 margins
const NAVY = '1F3352';
const SLATE = '4A5568';
const RULE = 'C8CFD9';
const HDR_BG = '1F3352';
const ALT_BG = 'F2F5F9';
const WARN_BG = 'FBE9E7';
const OK_BG = 'EAF4EC';

// ---------- helpers ----------
const P = (text, opts = {}) => new Paragraph({
  spacing: { after: opts.after === undefined ? 120 : opts.after, line: 276 },
  alignment: opts.align,
  indent: opts.indent,
  children: [new TextRun({
    text,
    size: opts.size || 21,
    bold: opts.bold,
    italics: opts.italics,
    color: opts.color || '222222',
    font: 'Calibri'
  })]
});

// paragraph from array of {text,bold,italics,color}
const PR = (runs, opts = {}) => new Paragraph({
  spacing: { after: opts.after === undefined ? 120 : opts.after, line: 276 },
  alignment: opts.align,
  children: runs.map(r => new TextRun({
    text: r.text, bold: r.bold, italics: r.italics,
    color: r.color || '222222', size: r.size || 21, font: 'Calibri'
  }))
});

const H1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  keepNext: true,
  spacing: { before: 360, after: 160 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: RULE, space: 6 } },
  children: [new TextRun({ text, bold: true, size: 30, color: NAVY, font: 'Calibri' })]
});

const H2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  keepNext: true,
  spacing: { before: 260, after: 110 },
  children: [new TextRun({ text, bold: true, size: 24, color: NAVY, font: 'Calibri' })]
});

const H3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  keepNext: true,
  spacing: { before: 200, after: 90 },
  children: [new TextRun({ text, bold: true, size: 21, color: SLATE, font: 'Calibri' })]
});

const BULLET = (text, opts = {}) => new Paragraph({
  numbering: { reference: 'bullets', level: 0 },
  spacing: { after: 70, line: 276 },
  children: [new TextRun({ text, size: 21, font: 'Calibri', bold: opts.bold })]
});

const cell = (text, w, o = {}) => new TableCell({
  width: { size: w, type: WidthType.DXA },
  shading: o.bg ? { type: ShadingType.CLEAR, fill: o.bg, color: 'auto' } : undefined,
  margins: { top: 70, bottom: 70, left: 100, right: 100 },
  verticalAlign: 'center',
  children: [new Paragraph({
    spacing: { after: 0, line: 250 },
    alignment: o.align,
    children: [new TextRun({
      text: String(text),
      bold: o.bold,
      italics: o.italics,
      color: o.color || (o.head ? 'FFFFFF' : '222222'),
      size: o.size || 18,
      font: 'Calibri'
    })]
  })]
});

// rows: array of arrays. First row = header. rowMeta[i] optional {bg}
function table(widths, rows, rowMeta = {}) {
  const total = widths.reduce((a, b) => a + b, 0);
  const trs = rows.map((r, i) => {
    const isHead = i === 0;
    const meta = rowMeta[i] || {};
    const bg = isHead ? HDR_BG : (meta.bg || (i % 2 === 0 ? ALT_BG : undefined));
    return new TableRow({
      tableHeader: isHead,
      cantSplit: true,
      children: r.map((c, j) => {
        const isObj = c !== null && typeof c === 'object';
        const txt = isObj ? c.t : c;
        return cell(txt, widths[j], {
          head: isHead,
          bold: isHead || (isObj && c.bold),
          italics: isObj && c.italics,
          color: isHead ? 'FFFFFF' : (isObj && c.color),
          bg,
          align: (isObj && c.align) || meta.align
        });
      })
    });
  });
  return new Table({
    columnWidths: widths,
    width: { size: total, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: RULE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: RULE }
    },
    rows: trs
  });
}

const SPACER = (h = 120) => new Paragraph({ spacing: { after: h }, children: [] });

// callout box
function callout(title, lines, bg) {
  return new Table({
    columnWidths: [CONTENT_W],
    width: { size: CONTENT_W, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      left: { style: BorderStyle.SINGLE, size: 18, color: NAVY },
      right: { style: BorderStyle.SINGLE, size: 4, color: RULE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE }
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [new TableCell({
        width: { size: CONTENT_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: bg || ALT_BG, color: 'auto' },
        margins: { top: 140, bottom: 140, left: 180, right: 160 },
        children: [
          new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: title, bold: true, size: 20, color: NAVY, font: 'Calibri' })]
          }),
          ...lines.map(l => new Paragraph({
            spacing: { after: 60, line: 264 },
            children: [new TextRun({ text: l, size: 19, font: 'Calibri' })]
          }))
        ]
      })]
    })]
  });
}

// ================= CONTENT =================
const children = [];

// ---- Cover ----
children.push(
  new Paragraph({ spacing: { before: 1900, after: 0 }, children: [
    new TextRun({ text: 'UNIFIED CRM BLUEPRINT', bold: true, size: 52, color: NAVY, font: 'Calibri' })
  ]}),
  new Paragraph({ spacing: { after: 300 }, border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 8 } }, children: [
    new TextRun({ text: 'One CompanyHub Instance — Real Estate + Auto Verticals', size: 28, color: SLATE, font: 'Calibri' })
  ]}),
  P('Honeycomb Investors LLC', { size: 24, bold: true, after: 60 }),
  P('CompanyHub CRM — Pattern C Extended', { size: 22, color: SLATE, after: 400 }),
  SPACER(600)
);

children.push(table([2400, 6960], [
  ['Field', 'Value'],
  ['Document', 'Unified CRM Blueprint — Real Estate + Auto'],
  ['Version', 'v1.0 (unified)'],
  ['Date', 'September 8, 2026'],
  ['Supersedes', 'CompanyHub Multi-Strategy Real Estate Architecture (Feb 15, 2026) — real-estate only'],
  ['Incorporates', 'CRM-ARCHITECTURE-AUDIT.md (Feb 16, 2026), branch claude/audit-crm-config-OBJc0'],
  ['Code reconciled', 'quantum_companyhub.gs, quantum_crm_engine.gs, main.gs, TURO_SPEC_PACK.md'],
  ['Status', 'DRAFT — requires CompanyHub capability verification (Section N)']
]));


children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- TOC ----
children.push(H1('Contents'));
children.push(new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }));
children.push(P('If this page is blank, right-click it in Word and choose Update Field to build the table of contents.', { italics: true, color: SLATE, size: 18 }));
children.push(new Paragraph({ children: [new PageBreak()] }));

// ---- A. Executive summary ----
children.push(H1('A. Executive Summary'));

children.push(P('This document specifies a single CompanyHub instance that runs both the real estate and the automotive acquisition businesses. It replaces two partial designs: a real-estate architecture that reserved a slot for vehicles but never specified them, and a working CarHawk export that writes into pipeline stages which do not exist.'));

children.push(H2('The decision'));
children.push(P('One CompanyHub. One Deal pipeline. Two asset tables. The verticals share a transaction model and diverge only at the asset layer — which is exactly where they genuinely differ, and nowhere else.'));

children.push(callout('Why one CRM works here', [
  'Both verticals run the same transaction shape: source a lead, analyze the numbers, make contact, negotiate, close, then either flip the asset or hold it for income.',
  'Both verticals have a "performing asset" problem: a rented property and a Turo-held vehicle both stop being deals and start being assets. Pattern C already solves this — it just needs a second asset table.',
  'Both verticals feed from an external analyzer (Quantum RE Analyzer; CarHawk Quantum) and both need the same external-ID discipline to avoid duplicate records.'
], OK_BG));

children.push(SPACER());
children.push(H2('What changes from the February design'));
children.push(table([600, 4400, 4360], [
  ['#', 'Change', 'Why'],
  ['1', 'Add a Vehicles table (asset layer for the auto vertical)', 'Turo Hold vehicles are performing assets. Without this they clog the Deal pipeline exactly as performing properties would.'],
  ['2', 'Unify the pipeline to 12 stages with dual semantics', 'The RE pipeline has no home for a test drive; the auto code writes 5 stage names that do not exist. Neither runs today.'],
  ['3', 'Add Vertical to the Deal table', 'Drives conditional field visibility, filters, dashboards and automation scoping. Nothing else separates the two businesses.'],
  ['4', 'Replace Quantum Row ID with Source System + External ID', 'One key pair serves both analyzers instead of a RE-only field. Fixes dedup for the auto side, which the audit never covered.'],
  ['5', 'Add 3 automations for the auto asset layer', 'Vehicle compliance, Turo hand-off, aging inventory — the auto analogues of the RE portfolio automations.'],
  ['6', 'Correct the inherited field counts', 'The source audit states conflicting totals in two places (see Section P).']
]));

children.push(SPACER());
children.push(H2('Blocking issue'));
children.push(callout('The CarHawk export cannot work against any published pipeline', [
  'quantum_companyhub.gs writes 7 stage values. Two exist in the blueprint pipeline; five do not. One of the five, "Negotiation" against a stage named "Negotiating", is a near-miss string that most CRM imports accept silently and file wrong rather than reject.',
  'This is specified in Section D and must be fixed in code before any import runs. It is not a configuration problem and cannot be fixed inside CompanyHub.'
], WARN_BG));


// ---- B. Architecture ----
children.push(H1('B. Architecture — Pattern C Extended'));

children.push(P('Pattern C separates the deal-as-transaction from the asset-as-holding. The original design had one asset table (Properties). The unified design has two, selected by the Deal\'s Vertical value.'));

children.push(H2('Table map'));
children.push(table([1900, 1500, 2100, 3860], [
  ['Table', 'Scope', 'Populated by', 'Purpose'],
  ['Deal', 'Both verticals', 'Quantum RE, CarHawk, manual', 'Every transaction, from lead through close. Single shared pipeline.'],
  ['Properties', 'Real estate', 'On close, or manual', 'RE portfolio assets: rentals, BRRRR holds, creative-finance notes.'],
  ['Vehicles', 'Auto', 'On close, or manual', 'Auto portfolio assets: Turo fleet, held inventory, in-reconditioning units.'],
  ['Buyers', 'Both verticals', 'Manual', 'Disposition buyers. Wholesale RE buyers and auto retail/dealer buyers share the table, separated by a Vertical Interest field.']
]));

children.push(SPACER());
children.push(H2('Record flow'));
children.push(table([1500, 3900, 3960], [
  ['Phase', 'Real estate', 'Auto'],
  ['Intake', 'Quantum RE Analyzer row syncs to a Deal (Vertical = Real Estate)', 'CarHawk Quantum row exports to a Deal (Vertical = Auto)'],
  ['Pipeline', 'Deal moves New Lead through Closing', 'Deal moves New Lead through Closing'],
  ['Close — flip', 'Deal set to Closed. No asset record. Wholesale assignment or fix-and-flip resale.', 'Deal set to Closed. No asset record. Retail flip completed.'],
  ['Close — hold', 'Deal set to Closed. Property record created or activated. Asset Status set from RE Strategy.', 'Deal set to Closed with Flip Strategy = Turo Hold. Vehicle record created or activated. Asset Status set to Performing — Turo.'],
  ['Ongoing', 'Property tracks cash flow, leases, insurance, balloon dates', 'Vehicle tracks Turo revenue, registration, insurance, inspection']
]));

children.push(SPACER());
children.push(callout('The hand-off is the fragile point in both verticals', [
  'The Closed-to-asset transition is the single most important event in Pattern C, and in the February design it was an email asking a human to remember to go update a record. Section J upgrades both hand-offs (UTron 7 for property, UTron 15 for vehicle) to auto-update where CompanyHub supports writing to a linked record, and to a direct-link email where it does not.',
  'If both hand-offs stay manual, the asset tables go stale within a month and the entire Pattern C advantage collapses.'
], WARN_BG));


// ---- C. Pipeline ----
children.push(H1('C. The Unified Pipeline'));

children.push(P('Twelve stages: nine active, plus Closed, Dead and Nurture. Every stage carries a defined meaning in both verticals — no stage is vertical-exclusive, which keeps one board readable for both businesses.'));

children.push(table([1500, 2450, 2450, 2100, 860], [
  ['Stage', 'Real estate meaning', 'Auto meaning', 'CarHawk constant', 'Prob.'],
  ['New Lead', 'Lead captured, not yet analyzed', 'Listing imported from marketplace robot', 'IMPORTED', '10%'],
  ['Analyzed', 'ARV, comps and offer range computed', 'Quantum score, profit and ROI computed', '(new)', '20%'],
  ['Contact Ready', 'Skip trace complete, owner contact obtained', 'Seller contact captured from listing', '(new)', '30%'],
  ['Contacted', 'Outreach sent, no reply yet', 'Outreach sent, no reply yet', 'CONTACTED', '35%'],
  ['Engaged', 'Seller replied, dialogue open', 'Seller replied, dialogue open', 'RESPONDED', '45%'],
  ['Appointment Set', 'Walkthrough or inspection scheduled', 'Test drive or inspection scheduled', 'APPOINTMENT_SET', '60%'],
  ['Negotiating', 'Offer and counters in progress', 'Offer and counters in progress', 'NEGOTIATING', '65%'],
  ['Under Contract', 'PSA signed, due diligence running', 'Purchase agreed, deposit placed', '(new)', '80%'],
  ['Closing', 'Title, escrow, funding', 'Payment and title transfer', '(new)', '90%'],
  ['Closed', 'Deal completed', 'Deal completed', 'CLOSED_WON', '100%'],
  ['Dead', 'Deal lost — Dead Reason required', 'Deal lost — Dead Reason required', 'LOST', '0%'],
  ['Nurture', 'Not now, follow up later', 'Not now, follow up later', '(new)', '15%']
], { 11: { bg: 'F7ECEC' }, 12: { bg: 'F4F0E4' } }));

children.push(SPACER());
children.push(H2('Notes on the stage set'));
children.push(BULLET('Skip Traced was renamed Contact Ready. The audit itself offered this consolidation as a fallback (Risk 3); renaming makes the stage meaningful to the auto vertical, where contact usually arrives with the listing and the deal auto-advances on import.'));
children.push(BULLET('Engaged and Appointment Set are the two stages added beyond the audit\'s ten. Both already exist as CarHawk constants (RESPONDED, APPOINTMENT_SET) and both are used in live code for probability weighting and appointment reporting, so dropping them would break existing reports.'));
children.push(BULLET('Auto deals routinely pass Under Contract and Closing on the same day. That is acceptable — a stage that takes an hour still records that the step happened. Do not collapse them; RE needs both distinct.'));
children.push(BULLET('Nurture branches off after Contacted or Negotiating and must be excluded from the Stale Deal Killer automation (UTron 6).'));


// ---- D. Defect ----
children.push(H1('D. Blocking Defect — Stage Mapping Mismatch'));

children.push(PR([
  { text: 'Location: ' , bold: true },
  { text: 'quantum_companyhub.gs, function mapToCompanyHubStage (also duplicated at main.gs line 1908).' }
]));

children.push(P('The function translates CarHawk internal stages into CompanyHub stage names. Five of its seven outputs name stages that do not exist in the blueprint pipeline.'));

children.push(table([1900, 2100, 2100, 3260], [
  ['CarHawk constant', 'Code writes', 'Unified stage', 'Status'],
  ['IMPORTED', 'New Lead', 'New Lead', { t: 'Correct', color: '2C6E49', bold: true }],
  ['CONTACTED', 'Contacted', 'Contacted', { t: 'Correct', color: '2C6E49', bold: true }],
  ['RESPONDED', 'Qualified', 'Engaged', { t: 'Broken — no such stage', color: 'A32E2E', bold: true }],
  ['APPOINTMENT_SET', 'Meeting Scheduled', 'Appointment Set', { t: 'Broken — no such stage', color: 'A32E2E', bold: true }],
  ['NEGOTIATING', 'Negotiation', 'Negotiating', { t: 'Near-miss — fails silently', color: 'A32E2E', bold: true }],
  ['CLOSED_WON', 'Closed Won', 'Closed', { t: 'Broken — no such stage', color: 'A32E2E', bold: true }],
  ['LOST', 'Closed Lost', 'Dead', { t: 'Broken — no such stage', color: 'A32E2E', bold: true }]
]));

children.push(SPACER());
children.push(callout('Why the near-miss is the dangerous one', [
  '"Negotiation" versus "Negotiating" differs by three characters. A CSV import that rejects an unknown stage outright is recoverable — you see the error and fix it. An import that coerces a near-miss to a default stage, or silently creates a stray twelfth stage, is not: every negotiating auto deal lands in the wrong column and the pipeline report is quietly wrong.',
  'Verify CompanyHub\'s behaviour on unknown picklist values during import before the first production run, and record the answer in Section N.'
], WARN_BG));

children.push(SPACER());
children.push(H2('Required correction'));
children.push(P('Replace the stage map with the values below. Do this before any import. The mapping is code, not CompanyHub configuration, and cannot be worked around inside the CRM.'));

children.push(table([2600, 3200, 3560], [
  ['CarHawk constant', 'Must write', 'Note'],
  ['IMPORTED', 'New Lead', 'No change'],
  ['CONTACTED', 'Contacted', 'No change'],
  ['RESPONDED', 'Engaged', 'Changed'],
  ['APPOINTMENT_SET', 'Appointment Set', 'Changed'],
  ['NEGOTIATING', 'Negotiating', 'Changed — spelling'],
  ['CLOSED_WON', 'Closed', 'Changed'],
  ['LOST', 'Dead', 'Changed — also set Dead Reason']
]));

children.push(SPACER());
children.push(H2('Two further code defects found while reconciling'));
children.push(BULLET('syncQuantumCRM is defined twice — main.gs line 4346 and quantum_menu_handlers.gs line 64 — and the two copies have already drifted. In Apps Script this is a redeclaration where file load order decides which wins. Pick one home before adding CompanyHub sync logic to it.'));
children.push(BULLET('CompanyHub has no credential setting anywhere in the codebase. SMSIT_API_KEY and OHMYLEAD_WEBHOOK_URL are both persisted through setQuantumSetting; no COMPANYHUB key exists, so syncQuantumCRM hardcodes companyhub: false and the sync dialog always reports "Not configured". Export to CompanyHub is CSV-to-Drive only today.'));


// ---- E. Deal table ----
children.push(H1('E. Deal Table'));

children.push(P('The shared transaction record. Sections A, B, C and E apply to both verticals; Section D is auto-only and hidden on real estate deals.'));

children.push(table([1200, 4900, 900, 2360], [
  ['Section', 'Contents', 'Fields', 'Vertical'],
  ['A', 'Default fields (owner, created, modified, name, stage, source, next follow-up)', '7', 'Both'],
  ['B', 'Deal Analysis (purchase price, ARV/market value, repair estimate, profit, ROI, lead score, comps)', '16', 'Both'],
  ['C', 'Deal Details (seller contact, motivation, EMD, title company, documents, identity keys)', '21', 'Both'],
  ['D', 'Vehicle Info (year, make, model, trim, mileage, VIN, title status, platform, days listed, flip strategy, distance, photos)', '12', { t: 'Auto only', bold: true }],
  ['E', 'Asset Link (Property lookup, Vehicle lookup, asset created flag, hand-off date)', '4', 'Both'],
  [{ t: 'Total', bold: true }, '', { t: '60', bold: true }, '']
], { 6: { bg: 'E7ECF3' } }));

children.push(SPACER());
children.push(H2('New and changed fields'));
children.push(P('Everything below is new in this revision or moved from another table. Fields carried forward from the February v2 spec are counted above but not re-enumerated — see Section P on provenance.'));

children.push(table([450, 1750, 2050, 1000, 4110], [
  ['#', 'Field', 'Type', 'Section', 'Purpose'],
  ['1', 'Vertical', 'Picklist: Real Estate, Auto', 'A', 'Drives field visibility, filters, dashboards, automation scope. The only field separating the businesses.'],
  ['2', 'Source System', 'Picklist: Quantum RE Analyzer, CarHawk, SMS-iT, Manual', 'C', 'Which system created the record. Half of the dedup key.'],
  ['3', 'External ID', 'Single line text', 'C', 'The source system\'s own row or deal id. Other half of the dedup key. Replaces the RE-only Quantum Row ID.'],
  ['4', 'Dead Reason', 'Picklist (11 values, see below)', 'C', 'Referenced by the original pipeline spec but never defined. Required on entry to Dead.'],
  ['5', 'Earnest Money Deposit', 'Currency', 'C', 'Cash at risk during Under Contract. RE-relevant; auto deposits use the same field.'],
  ['6', 'EMD Refundable?', 'Picklist: Yes — before DD deadline, Yes — full, No — hard, Partial', 'C', 'Risk exposure if the deal dies.'],
  ['7', 'Title Company', 'Single line text', 'C', 'RE closing coordination. On auto deals, the title/registration service used.'],
  ['8', 'Documents Folder Link', 'URL', 'C', 'Drive or Dropbox folder: PSA, inspections, title work, bill of sale.'],
  ['9', 'Motivated Seller?', 'Picklist', 'C', 'Moved from Properties. Motivation is deal-specific and time-sensitive; on the Property record a second deal overwrites the first.'],
  ['10', 'Motivation Reason', 'Picklist', 'C', 'Moved from Properties. Same reasoning.'],
  ['11', 'Vehicle', 'Lookup to Vehicles', 'E', 'Populated at hand-off when Flip Strategy = Turo Hold.'],
  ['12', 'Asset Hand-off Date', 'Date', 'E', 'When the asset record was created or activated. Enables hand-off latency reporting.']
]));

children.push(SPACER());
children.push(H3('Dead Reason values'));
children.push(P('Seller unresponsive · Price too high · Title issues · Inspection failed · Financing fell through · Seller backed out · Buyer backed out · Better deal found · Market changed · Could not locate owner · Other'));
children.push(P('Applies to both verticals. "Title issues" and "Inspection failed" are as common on a vehicle as on a house.', { italics: true, color: SLATE }));


// ---- F. Properties ----
children.push(H1('F. Properties Table'));
children.push(P('The real-estate asset layer. Unchanged from the February audit except for the count reconciliation in Section P.'));

children.push(table([2600, 1000, 5760], [
  ['Section', 'Fields', 'Contents'],
  ['Property Identity', '9', 'Address, APN, county, type, Entity/LLC, Documents Folder Link'],
  ['Property Details', '7', 'Beds, baths, square feet, lot, year built, condition'],
  ['Owner & Skip Trace', '6', 'Owner name, mailing address, phones, emails, trace date (Motivated Seller fields moved to Deal)'],
  ['Property Financials', '8', 'Purchase price, rehab budget/spent, monthly income/expense/cash flow, insurance expiration, annual premium, HOA monthly'],
  ['Asset Management', '15', 'Asset Status, Status Changed Date, lease start/end, tenant, rehab status, refinance data'],
  ['Creative Finance Terms', '6', { t: 'NEW SECTION — existing loan lender, rate, monthly payment, maturity date; note/wrap balloon date, rate', bold: true }],
  ['Rental Operations', '3', 'Furnished?, Security Deposit Held, Listing Platform'],
  ['Comps & Links', '5', 'Comp notes, Quantum link, photos, property notes/history'],
  [{ t: 'Total', bold: true }, { t: '59', bold: true }, '']
], { 9: { bg: 'E7ECF3' } }));

children.push(SPACER());
children.push(callout('Creative finance was the largest gap in the February design and remains the highest-value addition', [
  'Sub-To, seller finance and wrap deals are note-servicing operations. Tracking only the monthly spread records the outcome but not the instrument.',
  'A missed balloon date on a seller-financed note is a default event. Without Note/Wrap Balloon Date and its warning automation (UTron 11), these deals get tracked in a side spreadsheet — which defeats the purpose of consolidating into one CRM.'
], WARN_BG));

children.push(SPACER());
children.push(H2('Acknowledged limits'));
children.push(BULLET('STR operations (calendar, pricing, cleaning, messaging) belong in a dedicated tool such as Hospitable, Guesty or OwnerRez. This CRM tracks the property as a portfolio asset and deliberately does not manage bookings. Consider adding ADR and Occupancy Rate later for portfolio reporting only.'));
children.push(BULLET('Multi-family requires one Property record per unit. Document this convention in the operating playbook; the table cannot track Unit A and Unit B in a single record.'));
children.push(BULLET('Tenant screening is compressed into the Asset Status transition from Owned—Tenant Search to Performing—LTR, with no intermediate visibility. Accepted for v1.'));


// ---- G. Vehicles ----
children.push(H1('G. Vehicles Table (New)'));

children.push(P('The auto asset layer, and the piece the February design never specified. A Turo-held vehicle is a performing asset in exactly the sense a rented property is: it generates monthly income, carries compliance deadlines, and must not sit in the acquisition pipeline.'));

children.push(P('Field sources are noted so each can be traced to CarHawk\'s Master DB or to this specification.'));

children.push(H2('Vehicle Identity — 8 fields'));
children.push(table([500, 2400, 2600, 3860], [
  ['#', 'Field', 'Type', 'Source / purpose'],
  ['1', 'VIN', 'Single line text', 'Primary natural key. Enforce uniqueness — this is the vehicle equivalent of a normalized address.'],
  ['2', 'Year', 'Number', 'CarHawk Master DB'],
  ['3', 'Make', 'Single line text', 'CarHawk Master DB'],
  ['4', 'Model', 'Single line text', 'CarHawk Master DB'],
  ['5', 'Trim', 'Single line text', 'CarHawk Master DB'],
  ['6', 'Entity / LLC', 'Single line text', 'Which legal entity holds title. Mirrors Properties.'],
  ['7', 'Documents Folder Link', 'URL', 'Title, bill of sale, insurance policy, inspection records.'],
  ['8', 'Fleet ID', 'Single line text', 'CarHawk Master DB — Turo fleet identifier.']
]));

children.push(SPACER());
children.push(H2('Vehicle Condition — 5 fields'));
children.push(table([500, 2400, 2600, 3860], [
  ['#', 'Field', 'Type', 'Source / purpose'],
  ['9', 'Mileage at Acquisition', 'Number', 'CarHawk Master DB'],
  ['10', 'Current Mileage', 'Number', 'Updated at service intervals. Drives depreciation and Turo eligibility.'],
  ['11', 'Title Status', 'Picklist: Clean, Salvage, Rebuilt, Lien, Pending', 'CarHawk Master DB. Salvage and rebuilt titles are Turo-ineligible on most programs.'],
  ['12', 'Condition Grade', 'Picklist: Excellent, Good, Fair, Poor', 'Reconditioning scope.'],
  ['13', 'Reconditioning Spent', 'Currency', 'Auto analogue of Rehab Spent.']
]));

children.push(SPACER());
children.push(H2('Vehicle Financials — 7 fields'));
children.push(table([500, 2400, 2600, 3860], [
  ['#', 'Field', 'Type', 'Source / purpose'],
  ['14', 'Purchase Price', 'Currency', 'CarHawk Master DB'],
  ['15', 'Market Value', 'Currency', 'CarHawk Master DB — retail comp'],
  ['16', 'Monthly Revenue', 'Currency', 'Turo gross earnings'],
  ['17', 'Monthly Expenses', 'Currency', 'Insurance, maintenance, cleaning, platform fees'],
  ['18', 'Turo Monthly Net', 'Currency', 'CarHawk Master DB — Turo Monthly Net'],
  ['19', 'Turo Payback Months', 'Number', 'CarHawk Master DB — months to recover acquisition cost'],
  ['20', 'Annual Insurance Premium', 'Currency', 'Expense tracking and cash-flow accuracy']
]));

children.push(SPACER());
children.push(H2('Asset Management — 7 fields'));
children.push(table([500, 2400, 2600, 3860], [
  ['#', 'Field', 'Type', 'Source / purpose'],
  ['21', 'Asset Status', 'Picklist: In Reconditioning, Listed for Sale, Performing — Turo, Idle, Sold, Written Off', 'The auto analogue of Property Asset Status. Set by the hand-off automation.'],
  ['22', 'Status Changed Date', 'Date', 'Enables time-in-phase reporting. Mirrors Properties.'],
  ['23', 'Turo Status', 'Single line text', 'CarHawk Master DB — Turo Status'],
  ['24', 'Turo Hold Score', 'Number', 'CarHawk Master DB — hold-versus-flip score'],
  ['25', 'Turo Risk Tier', 'Picklist', 'CarHawk Master DB — Turo Risk Tier'],
  ['26', 'Acquired Date', 'Date', 'Drives aging-inventory reporting'],
  ['27', 'Days Held', 'Number or calculated', 'Auto analogue of days on market for owned inventory']
]));

children.push(SPACER());
children.push(H2('Compliance — 4 fields'));
children.push(P('CarHawk already runs checkComplianceAlerts() over expiring registrations, insurance and inspections. These fields give that scan a home in the CRM.', { italics: true, color: SLATE }));
children.push(table([500, 2400, 2600, 3860], [
  ['#', 'Field', 'Type', 'Source / purpose'],
  ['28', 'Registration Expiration', 'Date', 'Compliance. Drives UTron 14.'],
  ['29', 'Insurance Expiration', 'Date', 'Compliance. Drives UTron 14. Mirrors Properties.'],
  ['30', 'Next Inspection Due', 'Date', 'Compliance. Drives UTron 14.'],
  ['31', 'Commercial Use Authorized?', 'Picklist: Yes, No, Pending', 'Turo requires the policy to permit commercial use. A vehicle earning on a personal policy is an uncovered claim waiting to happen.']
]));

children.push(SPACER());
children.push(table([2600, 6760], [
  ['Vehicles table total', '31 fields across 5 sections']
], { 1: { bg: 'E7ECF3' } }));


// ---- H. Buyers ----
children.push(H1('H. Buyers Table'));

children.push(P('Shared across verticals. A wholesale RE buyer and an auto retail buyer differ in what they want, not in how you track them.'));

children.push(table([500, 2400, 2600, 3860], [
  ['#', 'Field', 'Type', 'Purpose'],
  ['—', 'Carried forward', '15 fields', 'Name, company, contact details, buy box, cash/financed, markets, notes — unchanged from the February v2 spec.'],
  ['16', 'Deals Committed', 'Number', 'How many times this buyer said yes.'],
  ['17', 'Deals Closed', 'Number', 'How many times they actually closed. Committed minus Closed is the reliability signal.'],
  ['18', 'Vertical Interest', 'Multi-select: Real Estate, Auto', { t: 'NEW for the unified design — lets one buyer list serve both businesses without cross-contaminating blasts.', bold: true }]
]));

children.push(SPACER());
children.push(table([2600, 6760], [
  ['Buyers table total', '18 fields (15 carried forward + 3 new)']
], { 1: { bg: 'E7ECF3' } }));

children.push(SPACER());
children.push(H2('Grand total'));
children.push(table([2800, 1600, 1600, 3360], [
  ['Table', 'February', 'Unified', 'Delta'],
  ['Deal', '50', '60', '+10'],
  ['Properties', '46', '59', '+13 net (−2 moved out, +15 added)'],
  ['Vehicles', '—', '31', '+31 (new table)'],
  ['Buyers', '15', '18', '+3'],
  [{ t: 'Total', bold: true }, { t: '111', bold: true }, { t: '168', bold: true }, { t: '+57', bold: true }]
], { 5: { bg: 'E7ECF3' } }));

children.push(SPACER(80));
children.push(P('No table is bloated. The largest, Deal at 60, presents roughly 20 fields on any given record once Vertical-based visibility hides the irrelevant section.'));


// ---- I. Identity ----
children.push(H1('I. Identity and Deduplication'));

children.push(P('Four systems can create records: Quantum RE Analyzer, CarHawk, SMS-iT and manual entry in CompanyHub. Without a shared key, the same property or vehicle enters three times, lookups bind to the wrong record, and portfolio reporting is unreliable within sixty days of production use.'));

children.push(H2('The key pair'));
children.push(table([2400, 3400, 3560], [
  ['Field', 'Values', 'Rule'],
  ['Source System', 'Quantum RE Analyzer, CarHawk, SMS-iT, Manual', 'Set on creation, never edited afterwards.'],
  ['External ID', 'The source system\'s own row or deal id', 'Set on creation. Together with Source System this is unique across the whole Deal table.']
]));

children.push(P('This replaces the audit\'s Quantum Row ID, which named one specific analyzer and left the auto vertical with no key at all.', { italics: true, color: SLATE }));

children.push(SPACER());
children.push(H2('Natural keys at the asset layer'));
children.push(table([2400, 6960], [
  ['Table', 'Natural key and normalization rule'],
  ['Properties', 'Normalized street address. Uppercase, strip punctuation, expand abbreviations to USPS standard (ST to STREET), append unit number for multi-family. "123 Main St", "123 Main Street" and "123 main st" must resolve to one record.'],
  ['Vehicles', 'VIN. Already unique, already standardized, 17 characters. Enforce uniqueness at entry and the auto vertical has no dedup problem at all.']
]));

children.push(SPACER());
children.push(callout('The auto vertical is the easy half here', [
  'VIN is a globally unique identifier that arrives with the listing. Real estate has no equivalent, which is why address normalization needs a written convention before the first sync.',
  'Write that convention down and apply it in the Quantum RE Analyzer before export, not in CompanyHub after import — normalizing on the way in is cheap, deduplicating afterwards is not.'
]));

children.push(SPACER());
children.push(H2('Sync field mapping'));
children.push(P('Phase 8 of the original roadmap called for SyncSpyder integration without specifying a single field mapping. The starting map below must be completed before that phase begins.'));

children.push(table([2600, 2600, 1500, 1300, 1360], [
  ['Source column', 'CompanyHub field', 'Table', 'Direction', 'Notes'],
  ['Row ID', 'External ID', 'Deal', 'In only', 'Unique key for matching'],
  ['Property Address', 'Property Address', 'Properties', 'In only', 'Normalized before send'],
  ['ARV', 'Estimated Resale', 'Deal', 'In only', 'Analyzer is source of truth'],
  ['Lead Score', 'Lead Score', 'Deal', 'In only', ''],
  ['Deal ID', 'External ID', 'Deal', 'In only', 'CarHawk side'],
  ['VIN', 'VIN', 'Vehicles', 'In only', 'CarHawk side, unique key'],
  ['Turo Hold Score', 'Turo Hold Score', 'Vehicles', 'In only', 'CarHawk side']
]));

children.push(P('Every mapping is one-way inbound. Bidirectional sync requires a conflict-resolution rule that does not exist yet; do not enable it until one is written.', { italics: true, color: SLATE }));


// ---- J. Automations ----
children.push(H1('J. Automations (UTrons)'));
children.push(P('Sixteen automations: ten from the original design, three added by the audit, three new for the auto asset layer. The Will it work column carries forward the audit\'s capability assessment — five items still need verification with CompanyHub support before go-live.'));

children.push(table([450, 2500, 1100, 1250, 4060], [
  ['#', 'Name', 'Vertical', 'Confidence', 'Note'],
  ['1', 'Hot Lead Fast-Track', 'Both', { t: 'Confirmed', color: '2C6E49' }, 'Simple field-value trigger.'],
  ['2', 'Skip Trace Nudge', 'RE', { t: 'Verify', color: 'B06A00' }, 'Needs stage-unchanged-for-24h. Fallback: scheduled query on Modified Date.'],
  ['3', 'Daily Action Briefing', 'Both', { t: 'Verify', color: 'B06A00' }, 'Needs record-list rendering in email templates. Fallback: counts plus a filter link.'],
  ['4', 'Contract Clock', 'Both', { t: 'Verify', color: 'B06A00' }, 'Needs date-relative scheduling. Fallback: three separate UTrons at 7, 3 and 0 days.'],
  ['5', 'Buyer Blast', 'Both', { t: 'Limited', color: 'B06A00' }, 'Notification only. Does not actually blast; the SMS-iT integration does not exist yet.'],
  ['6', 'Stale Deal Killer', 'Both', { t: 'Verify', color: 'B06A00' }, 'Needs date subtraction. Must exclude Nurture.'],
  ['7', 'Deal Closed — Property Hand-off', 'RE', { t: 'Redesign', color: 'A32E2E' }, 'Must auto-update the linked Property, not email a reminder. See Section B.'],
  ['8', 'Rehab Budget Watchdog', 'RE', { t: 'Verify', color: 'B06A00' }, 'Needs cross-field arithmetic. Fallback: a calculated percentage field.'],
  ['9', 'Lease Expiration Warning', 'RE', { t: 'Confirmed', color: '2C6E49' }, 'Standard date comparison.'],
  ['10', 'BRRRR Refinance Trigger', 'RE', { t: 'Confirmed', color: '2C6E49' }, 'Standard date comparison.'],
  ['11', 'Balloon Date Warning', 'RE', { t: 'Confirmed', color: '2C6E49' }, 'Monthly, 6-month lookahead. The highest-value addition in the audit.'],
  ['12', 'Insurance Expiration Warning', 'RE', { t: 'Confirmed', color: '2C6E49' }, 'Monthly, 60-day lookahead.'],
  ['13', 'Nurture Re-engagement', 'Both', { t: 'Confirmed', color: '2C6E49' }, 'Weekly, where Next Follow-Up is due.'],
  ['14', 'Vehicle Compliance Warning', { t: 'Auto', bold: true }, { t: 'Confirmed', color: '2C6E49' }, { t: 'NEW — monthly, 60-day lookahead across registration, insurance and inspection dates. Mirrors CarHawk checkComplianceAlerts().', bold: true }],
  ['15', 'Deal Closed — Vehicle Hand-off', { t: 'Auto', bold: true }, { t: 'Redesign', color: 'A32E2E' }, { t: 'NEW — on Closed with Flip Strategy = Turo Hold, create or activate the Vehicle record and set Asset Status. Same auto-update requirement as UTron 7.', bold: true }],
  ['16', 'Aging Inventory Alert', { t: 'Auto', bold: true }, { t: 'Confirmed', color: '2C6E49' }, { t: 'NEW — weekly, where Asset Status = Listed for Sale and Days Held exceeds threshold. Held vehicles depreciate while they sit.', bold: true }]
]));

children.push(SPACER());
children.push(P('Summary: 8 confirmed, 5 requiring verification, 2 requiring redesign, 1 accepted as limited.', { bold: true }));


// ---- K. Filters + dashboards ----
children.push(H1('K. Saved Filters and Dashboards'));

children.push(H2('Filters added for the unified design'));
children.push(table([3200, 1500, 4660], [
  ['Filter', 'Table', 'Purpose'],
  ['Balloon Dates Next 12 Months', 'Properties', 'Creative finance default prevention'],
  ['Insurance Expiring Next 60 Days', 'Properties', 'Coverage lapse prevention'],
  ['Nurture — Follow-Up Due This Month', 'Deals', 'Warm lead re-engagement'],
  ['Under Contract — Deadline This Week', 'Deals', 'Deadline visibility'],
  ['Auto Deals — Active Pipeline', 'Deals', { t: 'NEW — Vertical = Auto, stage not in Closed/Dead', bold: true }],
  ['RE Deals — Active Pipeline', 'Deals', { t: 'NEW — Vertical = Real Estate, stage not in Closed/Dead', bold: true }],
  ['Vehicle Compliance Due 60 Days', 'Vehicles', { t: 'NEW — any of registration, insurance or inspection expiring', bold: true }],
  ['Turo Fleet — Performing', 'Vehicles', { t: 'NEW — Asset Status = Performing — Turo', bold: true }],
  ['Aging Inventory', 'Vehicles', { t: 'NEW — Listed for Sale beyond the days-held threshold', bold: true }]
]));

children.push(P('Total: 31 filters carried forward plus 5 new = 36.', { bold: true }));

children.push(SPACER());
children.push(H2('Dashboards'));
children.push(table([2600, 6760], [
  ['Dashboard', 'Contents'],
  ['1. Acquisition Command Center', 'Active deals by stage, split by Vertical. This week\'s follow-ups. Deals under contract with approaching deadlines. Hot leads requiring action. Monthly closed count and value.'],
  ['2. Portfolio Performance', 'All performing assets across both tables with monthly cash flow. Properties in rehab with budget status. Leases expiring in 90 days. Creative finance notes with upcoming balloon dates. Turo fleet net by vehicle. Total portfolio monthly cash flow.'],
  ['3. Business Health (monthly review)', 'Lead-to-close conversion trend by vertical. Deals closed by strategy. Revenue by strategy. Dead deal reasons. Lead source effectiveness.']
]));

children.push(SPACER());
children.push(H2('KPIs the field set now supports'));
children.push(BULLET('Lead-to-close conversion, overall and split by vertical and by strategy'));
children.push(BULLET('Deal velocity — closes per month, trended'));
children.push(BULLET('Dead deal analysis by reason and by stage — newly possible once Dead Reason exists'));
children.push(BULLET('Portfolio cash-on-cash across both asset tables'));
children.push(BULLET('Rehab and reconditioning budget accuracy'));
children.push(BULLET('Buyer reliability — Deals Committed against Deals Closed'));
children.push(BULLET('Asset hand-off latency — Closed date against Asset Hand-off Date, which surfaces a decaying hand-off before the asset tables go stale'));

children.push(SPACER());
children.push(P('Average days per stage and wholesale assignment speed both require stage-change timestamps, which the design does not track. CompanyHub may log these internally — confirm in Section N.', { italics: true, color: SLATE }));


// ---- N. Open items ----
children.push(H1('N. Open Items Requiring Verification'));

children.push(P('None of the following can be resolved from the codebase or the source documents. Each needs an answer from CompanyHub support or a decision from the business before go-live.'));

children.push(table([450, 4400, 4510], [
  ['#', 'Question', 'Blocks'],
  ['1', 'Can a UTron write to a field on a linked record?', 'UTrons 7 and 15 — both asset hand-offs. This is the single most consequential answer in this document.'],
  ['2', 'What does CSV import do with an unrecognized picklist value — reject, default, or create?', 'Section D. Determines whether the stage mismatch fails loudly or silently.'],
  ['3', 'Do UTron conditions expose stage-change timestamps?', 'UTron 2, and the average-days-per-stage KPI.'],
  ['4', 'Do email templates render lists of records?', 'UTron 3.'],
  ['5', 'Does the platform support date-relative scheduled actions from one trigger?', 'UTron 4.'],
  ['6', 'Do trigger conditions support cross-field arithmetic?', 'UTron 8.'],
  ['7', 'Are calculated fields supported, and can automations trigger on them?', 'Several fallbacks depend on this.'],
  ['8', 'Is there a per-table field limit that 60 fields on Deal would approach?', 'Deal table sizing.'],
  ['9', 'Business decision: what is the aging-inventory threshold in days?', 'UTron 16.'],
  ['10', 'Business decision: does CarHawk get its own CompanyHub credential, or does export stay CSV-to-Drive for v1?', 'Whether Section D\'s fix ships with an API sync or a corrected CSV.']
]));


// ---- O. Roadmap ----
children.push(H1('O. Implementation Roadmap'));

children.push(table([1300, 3200, 4860], [
  ['Phase', 'Work', 'Notes'],
  ['0', 'Answer the Section N questions', 'Particularly items 1 and 2. Several later phases branch on the answers.'],
  ['1', 'Build the Deal table, 60 fields, with Vertical-based conditional visibility', 'Sections A through E.'],
  ['2', 'Configure the 12-stage pipeline', 'Section C. Exact stage names matter — Section D depends on them.'],
  ['3', { t: 'Fix mapToCompanyHubStage in code', bold: true }, { t: 'Section D. Independent of CompanyHub work and can start immediately. Also resolve the duplicate syncQuantumCRM.', bold: true }],
  ['4', 'Build the Properties table, 59 fields', 'Section F. Creative Finance Terms section first.'],
  ['5', 'Build the Vehicles table, 31 fields', 'Section G. Enforce VIN uniqueness.'],
  ['6', 'Build the Buyers table, 18 fields', 'Section H.'],
  ['7', 'Configure UTrons 1 through 13', 'Section J. Skip any blocked by an unanswered Section N item.'],
  ['8', 'Configure UTrons 14 through 16', 'Section J. The auto asset layer.'],
  ['9', 'Saved filters and dashboards', 'Section K.'],
  ['10', 'Write the address normalization convention', 'Section I. Must precede any sync.'],
  ['11', 'Complete the SyncSpyder field mapping', 'Section I. One-way inbound only.'],
  ['12', 'Pilot: 10 RE deals and 10 auto deals end to end, including both hand-offs', 'Verify the hand-offs fire before trusting the asset tables.']
]));

children.push(SPACER());
children.push(callout('Start with phase 3', [
  'The code fix is the only item on this roadmap that is already broken in production rather than merely unbuilt, it is independent of every CompanyHub decision, and it is roughly twenty lines.'
], OK_BG));


// ---- P. Provenance ----
children.push(H1('P. Provenance and Reconciliation'));

children.push(H2('Sources'));
children.push(table([3000, 6360], [
  ['Source', 'Status'],
  ['CompanyHub Multi-Strategy Real Estate Architecture (Feb 15, 2026)', { t: 'NOT AVAILABLE. Referenced by the audit as the document under review. Not present in the repository, Google Drive or email. Its field lists survive only as section names and counts quoted inside the audit.', bold: true }],
  ['CRM-ARCHITECTURE-AUDIT.md (Feb 16, 2026)', 'Available. 650 lines on branch claude/audit-crm-config-OBJc0, commit 9648780. Pushed but never merged and never opened as a pull request.'],
  ['quantum_companyhub.gs', 'Available. 237 lines, 7 functions. CSV export to Drive only.'],
  ['TURO_SPEC_PACK.md', 'Available. Turo field mapping, section L.'],
  ['quantum_crm_engine.gs, main.gs', 'Available. Stage constants and duplicate sync handler.']
]));

children.push(SPACER());
children.push(H2('Carried-forward fields'));
children.push(P('Because the February architecture document could not be located, fields described in this blueprint as carried forward are counted but not individually enumerated. Their existence and names come from section-level summaries inside the audit, not from a field list.'));

children.push(callout('Verify before building', [
  'Section A of the Deal table (7 fields), Section B (16), the unchanged parts of Section C, Section D Vehicle Info (12), and the carried-forward Properties and Buyers sections must be checked against the live CompanyHub instance or the original February document before anyone builds from these counts.',
  'Everything marked new or changed in this document is fully specified and needs no such check.'
], WARN_BG));

children.push(SPACER());
children.push(H2('Count reconciliation'));
children.push(P('The source audit states conflicting totals for both tables. The unified counts in this document are computed from the section breakdowns, which are the only internally consistent figures available.'));

children.push(table([2200, 1800, 1800, 3560], [
  ['Table', 'Audit §C', 'Audit §L', 'Resolution'],
  ['Deal', '56', '58', 'Audit §L\'s own section breakdown sums to 56, contradicting its stated 58. This document rebuilds the count explicitly: 60.'],
  ['Properties', '56', '58', 'Audit §L\'s section breakdown sums to 59, contradicting both figures. This document uses 59.'],
  ['Buyers', '15', '17', 'Audit §C says no change needed; §L adds two fields. This document takes §L and adds one: 18.']
]));

children.push(SPACER());
children.push(P('These are arithmetic slips in the source, not design disagreements. The field lists themselves are consistent — only the totals are wrong.', { italics: true, color: SLATE }));

// ================= DOCUMENT =================
const doc = new Document({
  creator: 'Honeycomb Investors LLC',
  title: 'Unified CRM Blueprint — Real Estate + Auto',
  description: 'One CompanyHub instance serving both verticals',
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{
        level: 0,
        format: LevelFormat.BULLET,
        text: '•',
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 360, hanging: 240 } } }
      }]
    }]
  },
  styles: {
    default: {
      document: { run: { font: 'Calibri', size: 21 } }
    }
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 0 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 4 } },
          children: [new TextRun({
            text: 'Unified CRM Blueprint  ·  Honeycomb Investors LLC',
            size: 16, color: SLATE, font: 'Calibri'
          })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 16, color: SLATE, font: 'Calibri' })]
        })]
      })
    },
    children
  }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('COMPANYHUB-UNIFIED-BLUEPRINT.docx', buf);
  console.log('written', buf.length, 'bytes');
});
