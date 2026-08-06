// =========================================================
// FILE: quantum_integration_manager.gs - Integration Manager API
// =========================================================
// Dialog-safe server functions backing IntegrationManager.html.
// IMPORTANT: These run via google.script.run from an HTML dialog,
// so they must NOT call SpreadsheetApp.getUi() (no alerts/prompts).
// All results are returned as plain objects for the client to render.
// =========================================================

/**
 * Snapshot of every integration + configuration state for the panel.
 */
function getIntegrationManagerData() {
  // Registered integrations from the Integrations sheet
  let integrations = [];
  try {
    integrations = getActiveIntegrations().map(function (i) {
      let config = {};
      try { config = JSON.parse(i.configuration || '{}'); } catch (e) {}
      return {
        integrationId: i.integrationId,
        provider: i.provider,
        type: i.type,
        name: i.name,
        platform: i.notes || config.platform || '',
        lastSync: i.lastSync ? String(i.lastSync) : '',
        chainMode: !!config.chainMode
      };
    });
  } catch (e) {
    // Sheet may not exist yet — return empty rather than crash the panel
  }

  // Configuration flags (never return the secrets themselves)
  const browseKeySet = !!getBrowseAIApiKey();
  const ohmyleadSet = !!getQuantumSetting('OHMYLEAD_WEBHOOK_URL');
  const smsitSet = !!getQuantumSetting('SMSIT_API_KEY');

  // Platforms for the robot-registration dropdown
  const platforms = Object.values(ROBOT_REGISTRY).map(function (r) {
    return { platform: r.platform, displayName: r.displayName, category: r.category };
  });

  return {
    integrations: integrations,
    config: {
      browseAI: browseKeySet,
      ohmylead: ohmyleadSet,
      smsit: smsitSet
    },
    platforms: platforms
  };
}

/**
 * Register a sheet-based Browse.ai robot from the panel form.
 */
function imRegisterRobot(platform, sheetId, robotName) {
  if (!platform) throw new Error('Platform is required');
  if (!sheetId) throw new Error('Google Sheet ID is required');

  // Validate the sheet is reachable before registering
  try {
    SpreadsheetApp.openById(sheetId.trim());
  } catch (e) {
    throw new Error('Cannot open that Sheet ID. Check the ID and sharing permissions.');
  }

  const integrationId = registerBrowseAIRobot(platform, sheetId.trim(), robotName || null);
  return { integrationId: integrationId, platform: platform };
}

/**
 * Import from all sheet-based Browse.ai integrations (quiet version of
 * importFromBrowseAI — no UI alerts, returns a summary object).
 */
function imImportBrowseAI() {
  const integrations = getActiveIntegrations().filter(function (i) {
    return i.provider === 'Browse.ai' && i.key; // sheet-based only
  });

  if (integrations.length === 0) {
    return { totalImported: 0, results: [], message: 'No sheet-based Browse.ai robots registered yet.' };
  }

  let totalImported = 0;
  const results = [];

  for (const integration of integrations) {
    try {
      const result = processBrowseAIIntegration(integration);
      totalImported += result.imported;
      updateIntegrationSync(integration.integrationId, result.imported);
      results.push({
        platform: integration.notes || 'Unknown',
        imported: result.imported,
        skipped: result.skipped,
        errors: (result.errors || []).length
      });
    } catch (error) {
      updateIntegrationError(integration.integrationId, error.toString());
      results.push({ platform: integration.notes || 'Unknown', imported: 0, skipped: 0, errors: 1, message: error.toString() });
    }
  }

  return { totalImported: totalImported, results: results };
}

/**
 * Sync appointments to OhMyLead (quiet — logs internally).
 */
function imSyncOhmylead() {
  if (!getQuantumSetting('OHMYLEAD_WEBHOOK_URL')) {
    throw new Error('OhMyLead webhook URL is not configured. Save it below first.');
  }
  syncOhmyleadAppointments();
  return { status: 'ok' };
}

/**
 * Save a configuration value from the panel.
 * Whitelisted keys only — never allow arbitrary settings writes from the client.
 */
function imSaveSetting(key, value) {
  const allowed = {
    'BROWSE_AI_API_KEY': true,
    'OHMYLEAD_WEBHOOK_URL': true,
    'SMSIT_API_KEY': true
  };
  if (!allowed[key]) throw new Error('Setting not allowed: ' + key);

  const trimmed = String(value || '').trim();
  if (!trimmed) throw new Error('Value is required');

  if (key === 'BROWSE_AI_API_KEY') {
    setBrowseAIApiKey(trimmed); // stored in script properties (secure)
  } else {
    setQuantumSetting(key, trimmed);
  }

  logQuantum('Integration Config', key + ' updated via Integration Manager');
  return { status: 'ok', key: key };
}
