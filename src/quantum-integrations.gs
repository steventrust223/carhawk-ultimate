// FILE: quantum-integrations.gs - Integration Management
// =========================================================

function getActiveIntegrations() {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.INTEGRATIONS.name);
  if (!sheet || sheet.getLastRow() < 2) return [];
  
  const data = sheet.getDataRange().getValues();
  const integrations = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][6] === 'Active') { // Status column
      integrations.push({
        integrationId: data[i][0],
        provider: data[i][1],
        type: data[i][2],
        name: data[i][3],
        key: data[i][4],
        secret: data[i][5],
        status: data[i][6],
        lastSync: data[i][7],
        configuration: data[i][13],
        webhookUrl: data[i][14],
        notes: data[i][18]
      });
    }
  }
  
  return integrations;
}

function addIntegration(integrationData) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.INTEGRATIONS.name);
  const integrationId = generateQuantumId('INT');
  
  const row = [
    integrationId,
    integrationData.provider,
    integrationData.type,
    integrationData.name,
    integrationData.key || '',
    integrationData.secret || '',
    'Active',
    '', // Last sync
    '', // Next sync
    integrationData.syncFrequency || '60', // minutes
    0, // Records synced
    0, // Error count
    '', // Last error
    integrationData.configuration || '',
    integrationData.webhookUrl || '',
    integrationData.features || '',
    integrationData.limits || '',
    integrationData.cost || 0,
    integrationData.notes || '',
    new Date()
  ];
  
  sheet.appendRow(row);
  
  logQuantum('Integration Added', `${integrationData.provider} - ${integrationData.name}`);
  
  return integrationId;
}

function updateIntegrationSync(integrationId, recordsSynced) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.INTEGRATIONS.name);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === integrationId) {
      sheet.getRange(i + 1, 8).setValue(new Date()); // Last sync
      const totalSynced = (sheet.getRange(i + 1, 11).getValue() || 0) + recordsSynced;
      sheet.getRange(i + 1, 11).setValue(totalSynced); // Records synced
      break;
    }
  }
}

function updateIntegrationError(integrationId, error) {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.INTEGRATIONS.name);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === integrationId) {
      const errorCount = (sheet.getRange(i + 1, 12).getValue() || 0) + 1;
      sheet.getRange(i + 1, 12).setValue(errorCount); // Error count
      sheet.getRange(i + 1, 13).setValue(error); // Last error
      break;
    }
  }
}

// =========================================================
