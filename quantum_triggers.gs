// ============================================================================
// QUANTUM TRIGGERS - Time-based Automation Module
// ============================================================================
// Manages scheduled triggers for automated sync, analysis, and CRM operations.
// ============================================================================

/**
 * Deploys all quantum triggers for automated operations.
 * Clears existing triggers and creates hourly sync, daily analysis,
 * and CRM-specific triggers.
 */
function deployQuantumTriggers() {
  // Clear all existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }

  // Create hourly sync trigger
  ScriptApp.newTrigger('quantumHourlySync')
    .timeBased()
    .everyHours(1)
    .create();

  // Create daily analysis trigger at 6 AM
  ScriptApp.newTrigger('quantumDailyAnalysis')
    .timeBased()
    .atHour(6)
    .everyDays(1)
    .create();

  // Setup CRM-specific triggers
  setupCRMTriggers();

  Logger.log('Quantum triggers deployed successfully.');
}

/**
 * Hourly sync operation.
 * Runs Browse.ai integrations and import sync when REALTIME_MODE is enabled.
 */
function quantumHourlySync() {
  var settings = getQuantumSettings();
  var realtimeMode = settings['REALTIME_MODE'];

  if (realtimeMode === 'true' || realtimeMode === true) {
    // Run Browse.ai integrations
    runBrowseAIIntegrations();

    // Run import sync
    runImportSync();

    // Update last sync timestamp
    updateQuantumSetting('LAST_SYNC', new Date().toISOString());

    Logger.log('Quantum hourly sync completed.');
  } else {
    Logger.log('Realtime mode is disabled. Skipping hourly sync.');
  }
}

/**
 * Daily analysis operation.
 * Executes batch AI analysis, generates dashboard, checks alerts,
 * syncs CRM if enabled, and runs Turo module if available.
 */
function quantumDailyAnalysis() {
  // Execute quantum AI batch analysis
  executeQuantumAIBatch();

  // Generate dashboard
  generateQuantumDashboard();

  // Check alerts
  checkQuantumAlerts();

  // Sync CRM if enabled
  var settings = getQuantumSettings();
  if (settings['CRM_ENABLED'] === 'true' || settings['CRM_ENABLED'] === true) {
    syncCRMData();
  }

  // Update last analysis timestamp
  updateQuantumSetting('LAST_ANALYSIS', new Date().toISOString());

  // Run Turo module if Turo Engine sheet exists
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var turoSheet = ss.getSheetByName('Turo Engine');
    if (turoSheet) {
      batchAnalyzeTuro();
      checkComplianceAlerts();
      Logger.log('Turo module analysis completed.');
    }
  } catch (e) {
    Logger.log('Turo module skipped or encountered an error: ' + e.message);
  }

  Logger.log('Quantum daily analysis completed.');
}
