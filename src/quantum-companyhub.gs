// FILE: quantum-companyhub.gs - CompanyHub Integration
// =========================================================

function exportQuantumCRM() {
  const ui = SpreadsheetApp.getUi();
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  
  // Get deals for export
  const response = ui.alert(
    'Export to CompanyHub',
    'Export all recommended deals to CompanyHub CRM?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) return;
  
  const data = dbSheet.getDataRange().getValues();
  const exportDeals = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][44] === 'YES') { // Recommended = YES
      exportDeals.push({
        dealId: data[i][0],
        vehicle: `${data[i][5]} ${data[i][6]} ${data[i][7]}`,
        price: data[i][13],
        profit: data[i][26],
        roi: data[i][27],
        verdict: data[i][42],
        stage: data[i][50],
        sellerName: data[i][33],
        sellerPhone: data[i][34],
        sellerEmail: data[i][35],
        platform: data[i][2],
        location: data[i][14],
        distance: data[i][16],
        daysListed: data[i][32],
        contactCount: data[i][51],
        responseRate: data[i][54],
        quantumScore: data[i][41]
      });
    }
  }
  
  if (exportDeals.length === 0) {
    ui.alert('No recommended deals to export.');
    return;
  }
  
  // Format for CompanyHub
  const companyHubData = formatForCompanyHub(exportDeals);
  
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
  return deals.map(deal => ({
    'Company': deal.sellerName || `${deal.vehicle} Seller`,
    'Contact Name': deal.sellerName || 'Unknown',
    'Phone': deal.sellerPhone,
    'Email': deal.sellerEmail,
    'Deal Name': deal.vehicle,
    'Deal Value': deal.price,
    'Expected Profit': deal.profit,
    'ROI %': deal.roi,
    'Stage': mapToCompanyHubStage(deal.stage),
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
  }));
}

function mapToCompanyHubStage(stage) {
  const stageMap = {
    'IMPORTED': 'New Lead',
    'CONTACTED': 'Contacted',
    'RESPONDED': 'Qualified',
    'APPOINTMENT_SET': 'Meeting Scheduled',
    'NEGOTIATING': 'Negotiation',
    'CLOSED_WON': 'Closed Won',
    'LOST': 'Closed Lost'
  };
  
  return stageMap[stage] || 'New Lead';
}

function calculateDealProbability(deal) {
  let probability = 10; // Base probability
  
  if (deal.verdict === '🔥 HOT DEAL') probability = 80;
  else if (deal.verdict === '✅ SOLID DEAL') probability = 60;
  else if (deal.verdict === '⚠️ PORTFOLIO FOUNDATION') probability = 40;
  else if (deal.verdict === '❌ PASS') probability = 5;
  
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
  if (deal.verdict === '🔥 HOT DEAL') daysToClose = Math.floor(daysToClose * 0.7);
  else if (deal.verdict === '❌ PASS') daysToClose = Math.floor(daysToClose * 2);
  
  const closeDate = new Date(today);
  closeDate.setDate(closeDate.getDate() + daysToClose);
  
  return closeDate.toISOString().split('T')[0];
}

function generateCompanyHubTags(deal) {
  const tags = [];
  
  // Verdict tags
  if (deal.verdict.includes('HOT')) tags.push('hot-deal');
  if (deal.verdict.includes('SOLID')) tags.push('solid-deal');
  
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

// =========================================================
