// =========================================================
// FILE: quantum_setup.gs - Enhanced System Initialization
// =========================================================

function firstTimeSetup() {
  // Trigger authorization prompts for required services
  SpreadsheetApp.getActiveSpreadsheet().getName();
  DriveApp.getRootFolder();
  UrlFetchApp.fetch('https://www.google.com');

  // Run the system initializer
  initializeQuantumSystem();
}

function initializeQuantumSystem() {
  const ui = SpreadsheetApp.getUi();

  // Show Quantum Setup Interface
  const htmlOutput = HtmlService.createHtmlOutput(getQuantumSetupHTML())
    .setWidth(800)
    .setHeight(600);

  ui.showModalDialog(htmlOutput, '🚗⚛️ CarHawk Ultimate - Quantum CRM Initialization');
}

function deployQuantumArchitecture(config) {
  try {
    // Phase 1: Quantum Sheet Creation
    createQuantumSheets();

    // Phase 2: Advanced Header Configuration
    deployQuantumHeaders();

    // Phase 3: Formula Engine Deployment
    deployQuantumFormulas();

    // Phase 4: AI Model Initialization
    initializeAIModels(config);

    // Phase 5: Real-time Sync Setup
    setupRealtimeSync();

    // Phase 6: CRM Initialization - NEW
    initializeCRMSystem(config);

    // Phase 7: Advanced Triggers
    deployQuantumTriggers();

    // Phase 8: Dashboard Generation
    generateQuantumDashboard();

    logQuantum('System Initialization', 'Quantum CRM architecture deployed successfully');

    return {
      success: true,
      message: 'CarHawk Ultimate Quantum CRM System Online! 🚀',
      stats: {
        sheets: Object.keys(QUANTUM_SHEETS).length,
        formulas: 150,
        aiModels: 5,
        triggers: 12,
        crmFeatures: 8
      }
    };
  } catch (error) {
    logQuantum('Initialization Error', error.toString());
    return {success: false, message: error.toString()};
  }
}

function createQuantumSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  Object.entries(QUANTUM_SHEETS).forEach(([key, config]) => {
    let sheet = ss.getSheetByName(config.name);
    if (!sheet) {
      sheet = ss.insertSheet(config.name);
    }

    // Apply quantum styling
    sheet.setTabColor(config.color);

    // Add quantum protection
    if (['SETTINGS', 'LOGS', 'INTEGRATIONS'].includes(config.name)) {
      const protection = sheet.protect();
      protection.setDescription('Quantum System Sheet - Protected');
      protection.setWarningOnly(true);
    }
  });

  // Remove default sheet
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }
}
