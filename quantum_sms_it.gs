// =========================================================
// FILE: quantum-sms-it.gs - SMS-iT Integration
// =========================================================

function exportQuantumSMS() {
  const ui = SpreadsheetApp.getUi();
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const data = dbSheet.getDataRange().getValues();

  // Filter hot deals with phone numbers
  const hotDeals = [];
  for (let i = 1; i < data.length; i++) {
    if ((data[i][42] === '🔥 HOT DEAL' || data[i][42] === '✅ SOLID DEAL') && data[i][34]) {
      hotDeals.push({
        row: i,
        data: data[i]
      });
    }
  }

  if (hotDeals.length === 0) {
    ui.alert('No hot deals with phone numbers to export.');
    return;
  }

  // Show export preview
  const htmlOutput = HtmlService.createHtmlOutput(getQuantumSMSExportHTML(hotDeals))
    .setWidth(800)
    .setHeight(600);

  ui.showModalDialog(htmlOutput, '📱 Export to SMS-iT');
}

function processQuantumSMSExport(config) {
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const crmSheet = getQuantumSheet(QUANTUM_SHEETS.CRM.name);
  const exportData = [];

  for (const rowNum of config.selectedRows) {
    const rowData = dbSheet.getRange(rowNum, 1, 1, 60).getValues()[0];

    // Prepare SMS-iT data format
    const smsData = {
      dealId: rowData[0],
      phone: formatPhoneForSMSIT(rowData[34]),
      name: rowData[33] || 'Seller',
      customFields: {
        vehicle: `${rowData[5]} ${rowData[6]} ${rowData[7]}`,
        year: rowData[5],
        make: rowData[6],
        model: rowData[7],
        price: rowData[13],
        platform: rowData[2],
        verdict: rowData[42],
        roi: rowData[27],
        profit: rowData[26],
        distance: rowData[16]
      },
      tags: [
        'carhawk',
        rowData[42].replace(/[^\w]/g, '').toLowerCase(),
        rowData[2].toLowerCase(),
        rowData[28]
      ].filter(Boolean),
      message: config.includeAI && rowData[40] ? rowData[40] : config.messageTemplate,
      campaignName: config.campaignName,
      sequenceType: determineSequenceType(rowData)
    };

    exportData.push(smsData);
  }

  // Send to SMS-iT via webhook or API
  const smsitWebhook = getQuantumSetting('SMSIT_WEBHOOK_URL');
  if (smsitWebhook) {
    sendToSMSIT(exportData, smsitWebhook);
  }

  // Log export
  const exportId = generateQuantumId('EXP');
  crmSheet.appendRow([
    exportId,
    new Date(),
    'SMS-iT',
    config.selectedRows.join(','),
    config.selectedRows.length,
    'Campaign',
    'All Fields',
    'Hot Deals',
    exportData.reduce((sum, d) => sum + d.customFields.price, 0),
    exportData.reduce((sum, d) => sum + d.customFields.price, 0) / exportData.length,
    exportData.filter(d => d.customFields.verdict.includes('🔥')).length,
    exportData.length,
    exportData.length,
    0,
    config.campaignName,
    config.messageTemplate,
    'quantum,hot-deals',
    '', // CRM Record IDs (filled after SMS-iT response)
    'Pending',
    '',
    new Date(),
    '', // Next sync
    'true',
    'true',
    0,
    0
  ]);

  // Create follow-up sequences for exported deals
  if (config.createFollowUps) {
    exportData.forEach(data => {
      createFollowUpSequence(data.dealId, data.sequenceType);
    });
  }

  logQuantum('SMS-iT Export', `Exported ${exportData.length} leads to SMS-iT`);

  return exportData;
}

function sendToSMSIT(data, webhookUrl) {
  const payload = {
    source: 'CarHawk Ultimate',
    version: QUANTUM.VERSION,
    timestamp: new Date().toISOString(),
    leads: data
  };

  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload)
    });

    const result = JSON.parse(response.getContentText());

    // Process SMS-iT response
    if (result.success && result.leadIds) {
      updateExportRecordIds(result.leadIds);
    }

  } catch (error) {
    logQuantum('SMS-iT Error', error.toString());
  }
}

function formatPhoneForSMSIT(phone) {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');

  // Add country code if missing
  if (cleaned.length === 10) {
    return '+1' + cleaned;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return '+' + cleaned;
  }

  return phone; // Return as-is if format is unclear
}

function determineSequenceType(dealData) {
  const verdict = dealData[42];
  const confidence = dealData[41];
  const daysListed = dealData[32];

  if (verdict === '🔥 HOT DEAL' && confidence > 85) {
    return 'HOT_LEAD';
  } else if (verdict === '✅ SOLID DEAL' || (confidence > 70 && daysListed < 30)) {
    return 'WARM_LEAD';
  } else {
    return 'COLD_LEAD';
  }
}
