// =========================================================
// FILE: quantum-companyhub.gs - CompanyHub Integration
// =========================================================

/**
 * Verdict literals as written to the Master Database by quantum_ai.gs.
 * The emoji prefix is part of the stored value, not decoration.
 */
var COMPANYHUB_PASS_VERDICTS = Object.freeze(['❌ PASS', 'PASS']);

/**
 * Flip Strategy value written by generateFallbackAnalysis() when AI
 * analysis could not complete. Such rows are incomplete and must not
 * create CRM records: there is no CompanyHub stage or field meaning
 * "incomplete".
 */
var COMPANYHUB_INCOMPLETE_STRATEGY = 'Needs Review';

/**
 * Decides whether a Master Database row should be exported to CompanyHub.
 *
 * Previously this gated on Recommended? === 'YES' (column 44). Nothing in
 * the codebase ever writes that column — the only two references to it
 * were read-side gates — so the export returned zero rows every time it
 * ran. The gate is now deterministic and independent of the AI layer.
 *
 * @param {Array} row - A Master Database row.
 * @return {boolean} True if the row should be exported.
 */
function isQuantumDealExportable(row) {
  const C = QUANTUM_DB_COL;

  if (row[C.PRIORITY] !== 'High') return false;

  const verdict = String(row[C.VERDICT] || '').trim();
  if (COMPANYHUB_PASS_VERDICTS.indexOf(verdict) !== -1) return false;

  // Incomplete analysis: no usable numbers behind the deal.
  if (row[C.FLIP_STRATEGY] === COMPANYHUB_INCOMPLETE_STRATEGY) return false;

  // Essential identity and pricing must be present.
  if (!row[C.PRICE] || !row[C.YEAR]) return false;

  return true;
}

function exportQuantumCRM() {
  const ui = SpreadsheetApp.getUi();
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);

  // Get deals for export
  const response = ui.alert(
    'Export to CompanyHub',
    'Export high-priority deals (excluding PASS verdicts and rows with ' +
      'incomplete analysis) to CompanyHub CRM?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) return;

  const data = dbSheet.getDataRange().getValues();
  const exportDeals = [];

  // Find Turo column start for enrichment
  const headers = data[0];
  let turoScoreColIdx = -1;
  for (let h = 0; h < headers.length; h++) {
    if (headers[h] === 'Turo Hold Score') { turoScoreColIdx = h; break; }
  }

  const C = QUANTUM_DB_COL;

  for (let i = 1; i < data.length; i++) {
    if (isQuantumDealExportable(data[i])) {
      const dealExport = {
        dealId: data[i][C.DEAL_ID],
        vehicle: `${data[i][C.YEAR]} ${data[i][C.MAKE]} ${data[i][C.MODEL]}`,
        price: data[i][C.PRICE],
        profit: data[i][C.PROFIT_MARGIN],
        roi: data[i][C.ROI],
        verdict: data[i][C.VERDICT],
        stage: data[i][C.STAGE],
        sellerName: data[i][C.SELLER_NAME],
        sellerPhone: data[i][C.SELLER_PHONE],
        sellerEmail: data[i][C.SELLER_EMAIL],
        platform: data[i][C.PLATFORM],
        location: data[i][C.LOCATION],
        distance: data[i][C.DISTANCE],
        daysListed: data[i][C.DAYS_LISTED],
        contactCount: data[i][C.CONTACT_COUNT],
        responseRate: data[i][C.RESPONSE_RATE],
        quantumScore: data[i][C.AI_CONFIDENCE],
        flipStrategy: data[i][C.FLIP_STRATEGY]
      };

      // If this deal is a Turo Hold, include Turo-specific fields
      if (dealExport.flipStrategy === 'Turo Hold' && turoScoreColIdx >= 0) {
        dealExport.turoHoldScore = data[i][turoScoreColIdx];
        dealExport.turoMonthlyNet = data[i][turoScoreColIdx + 1];
        dealExport.turoPaybackMonths = data[i][turoScoreColIdx + 2];
        dealExport.turoRiskTier = data[i][turoScoreColIdx + 4];
        dealExport.turoStatus = data[i][turoScoreColIdx + 7];
        dealExport.fleetId = data[i][turoScoreColIdx + 8];
      }

      exportDeals.push(dealExport);
    }
  }

  if (exportDeals.length === 0) {
    ui.alert(
      'No deals matched the export criteria: Priority = High, verdict not ' +
      'PASS, analysis complete.'
    );
    return;
  }

  // Format for CompanyHub. Stage mapping throws on an unrecognized stage
  // rather than defaulting, so surface that instead of failing silently.
  let companyHubData;
  try {
    companyHubData = formatForCompanyHub(exportDeals);
  } catch (error) {
    ui.alert(
      'Export Aborted',
      error.message + '\n\nNo file was written. Correct the deal stage and ' +
      'run the export again.',
      ui.ButtonSet.OK
    );
    return;
  }

  // Generate CSV
  const csv = generateCompanyHubCSV(companyHubData);

  // Save to Drive
  const blob = Utilities.newBlob(csv, 'text/csv', `companyhub_export_${new Date().getTime()}.csv`);
  const file = DriveApp.createFile(blob);

  // Log export
  logCRMExport('CompanyHub', exportDeals.length, file.getId());

  // Show success
  ui.alert(
    'Export Complete!',
    `Successfully exported ${exportDeals.length} deals to CompanyHub.\n\nFile: ${file.getName()}`,
    ui.ButtonSet.OK
  );
}

function formatForCompanyHub(deals) {
  // CompanyHub expects specific field mapping
  return deals.map(deal => {
    // Name the offending deal: mapToCompanyHubStage throws by design, and
    // "unrecognized stage" is not actionable without knowing which row.
    let stage;
    try {
      stage = mapToCompanyHubStage(deal.stage);
    } catch (error) {
      throw new Error('Deal ' + deal.dealId + ': ' + error.message);
    }

    return {
      'Company': deal.sellerName || `${deal.vehicle} Seller`,
      'Contact Name': deal.sellerName || 'Unknown',
      'Phone': deal.sellerPhone,
      'Email': deal.sellerEmail,
      'Deal Name': deal.vehicle,
      'Deal Value': deal.price,
      'Expected Profit': deal.profit,
      'ROI %': deal.roi,
      'Stage': stage,
      'Probability': calculateDealProbability(deal),
      'Expected Close Date': calculateExpectedCloseDate(deal),
      'Lead Score': deal.quantumScore,
      'Source': deal.platform,
      'Location': deal.location,
      'Distance': deal.distance,
      'Days on Market': deal.daysListed,
      'Contact Attempts': deal.contactCount,
      'Response Rate': deal.responseRate,
      'Tags': generateCompanyHubTags(deal),
      'Custom Fields': {
        'CarHawk ID': deal.dealId,
        'Verdict': deal.verdict,
        'Vehicle': deal.vehicle
      }
    };
  });
}

/**
 * Translates a CarHawk pipeline stage into its CompanyHub stage name.
 *
 * This function previously emitted five stage names that exist in no
 * CompanyHub pipeline — Qualified, Meeting Scheduled, Negotiation,
 * Closed Won, Closed Lost. Only 'New Lead' and 'Contacted' were valid.
 * 'Negotiation' against a pipeline stage named 'Negotiating' was the
 * dangerous case: importers commonly accept a near-miss silently and
 * file the record to a default stage rather than rejecting it, so a
 * partially-successful import looked like a working one.
 *
 * It now throws rather than falling back. A stage this function cannot
 * map is a data or schema problem that must surface at export time, not
 * a row quietly filed under 'New Lead'.
 *
 * @param {string} stage - A CarHawk stage constant.
 * @return {string} The CompanyHub stage name.
 * @throws {Error} If the stage is empty, unknown, or maps outside the
 *     published CompanyHub pipeline.
 */
function mapToCompanyHubStage(stage) {
  if (!stage) {
    throw new Error(
      'CompanyHub export: deal has no stage value. Expected one of: ' +
      CARHAWK_STAGES.join(', ') + '.'
    );
  }

  const mapped = CARHAWK_TO_COMPANYHUB_STAGE[stage];

  if (!mapped) {
    throw new Error(
      'CompanyHub export: unrecognized CarHawk stage "' + stage +
      '". Valid stages: ' + CARHAWK_STAGES.join(', ') + '.'
    );
  }

  // Guards against the original defect returning by a different route:
  // a mapping edited to a name the pipeline does not define.
  if (COMPANYHUB_STAGES.indexOf(mapped) === -1) {
    throw new Error(
      'CompanyHub export: stage "' + stage + '" maps to "' + mapped +
      '", which is not a stage in the CompanyHub pipeline. Valid stages: ' +
      COMPANYHUB_STAGES.join(', ') + '.'
    );
  }

  return mapped;
}

function calculateDealProbability(deal) {
  let probability = 10; // Base probability

  if (deal.verdict && deal.verdict === '🔥 HOT DEAL') probability = 80;
  else if (deal.verdict && deal.verdict === '✅ SOLID DEAL') probability = 60;
  else if (deal.verdict && deal.verdict === '⚠️ PORTFOLIO FOUNDATION') probability = 40;
  else if (deal.verdict && deal.verdict === '❌ PASS') probability = 5;

  // Adjust based on stage
  if (deal.stage === 'APPOINTMENT_SET') probability += 20;
  else if (deal.stage === 'RESPONDED') probability += 10;

  // Adjust based on response rate
  if (deal.responseRate > 80) probability += 10;

  return Math.min(probability, 95);
}

function calculateExpectedCloseDate(deal) {
  const today = new Date();
  let daysToClose = 14; // Default

  // Check knowledge base for vehicle-specific timeline
  const knowledge = getVehicleKnowledge(
    deal.vehicle.split(' ')[1], // Make
    deal.vehicle.split(' ')[2], // Model
    deal.vehicle.split(' ')[0]  // Year
  );

  if (knowledge) {
    daysToClose = knowledge.avgDaysToSell;
  }

  // Adjust based on deal quality
  if (deal.verdict && deal.verdict === '🔥 HOT DEAL') daysToClose = Math.floor(daysToClose * 0.7);
  else if (deal.verdict && deal.verdict === '❌ PASS') daysToClose = Math.floor(daysToClose * 2);

  const closeDate = new Date(today);
  closeDate.setDate(closeDate.getDate() + daysToClose);

  return closeDate.toISOString().split('T')[0];
}

function generateCompanyHubTags(deal) {
  const tags = [];

  // Verdict tags
  if (deal.verdict && deal.verdict.includes('HOT')) tags.push('hot-deal');
  if (deal.verdict && deal.verdict.includes('SOLID')) tags.push('solid-deal');

  // Platform tag
  tags.push(deal.platform.toLowerCase());

  // Distance tag
  if (deal.distance < 25) tags.push('local');
  else if (deal.distance < 75) tags.push('regional');
  else tags.push('distant');

  // Performance tags
  if (deal.roi > 50) tags.push('high-roi');
  if (deal.profit > 5000) tags.push('high-profit');

  // Stage tags
  if (deal.contactCount > 0) tags.push('contacted');
  if (deal.responseRate > 0) tags.push('responsive');

  return tags.join(',');
}

function generateCompanyHubCSV(data) {
  if (data.length === 0) return '';

  // Get all unique headers
  const headers = Object.keys(data[0]).filter(key => key !== 'Custom Fields');

  // Add custom field headers
  const customFields = Object.keys(data[0]['Custom Fields'] || {});
  customFields.forEach(field => headers.push(`Custom: ${field}`));

  // Create CSV rows
  const rows = [headers];

  data.forEach(record => {
    const row = headers.map(header => {
      if (header.startsWith('Custom: ')) {
        // Handle custom fields
        const customField = header.replace('Custom: ', '');
        return record['Custom Fields'][customField] || '';
      } else {
        const value = record[header];
        // Escape CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }
    });
    rows.push(row);
  });

  // Convert to CSV string
  return rows.map(row => row.join(',')).join('\n');
}
