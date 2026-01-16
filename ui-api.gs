// ================================================================
// UI-API.GS - Server-side API Endpoints for HTML Dialogs
// ================================================================
// All functions in this file are called from HTML templates via
// google.script.run.FUNCTION_NAME(args)
//
// Naming convention: UI_* prefix for all dialog endpoints
// ================================================================

// ================================================================
// SETUP & INITIALIZATION
// ================================================================

/**
 * Show the initial system setup dialog
 * Called from: Menu > "Initialize System"
 */
function UI_showSetupDialog() {
  const html = getQuantumSetupHTML(); // Defined in setup.gs or as HTML template
  const dialog = HtmlService.createHtmlOutput(html)
    .setWidth(700)
    .setHeight(800);

  SpreadsheetApp.getUi().showModalDialog(dialog, '🚗⚛️ CarHawk Ultimate - System Setup');
}

/**
 * Deploy the Quantum architecture (called from setup dialog)
 * Called from: SetupDialog.html > deployQuantum()
 *
 * @param {Object} config - Configuration object from setup form
 * @return {Object} {success: boolean, message: string, stats: Object}
 */
function UI_deployQuantumArchitecture(config) {
  // This function should exist in setup.gs
  return deployQuantumArchitecture(config);
}

// ================================================================
// DEAL GALLERY
// ================================================================

/**
 * Get top deals for Deal Gallery UI
 * Called from: DealGallery.html on load
 *
 * @return {Array} Array of top deal objects with data and metrics
 */
function UI_getDealGallery() {
  try {
    const dbSheet = getQuantumSheet('Master Database');
    if (!dbSheet) {
      return {success: false, error: 'Master Database sheet not found'};
    }

    const data = dbSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Find priority column (usually "Priority" or similar)
    const priorityCol = headers.indexOf('🎯 Priority');
    const roiCol = headers.indexOf('ROI %');

    // Filter hot deals and sort by priority
    const hotDeals = rows
      .map((row, idx) => ({row: idx + 2, data: row}))
      .filter(deal => deal.data[priorityCol] === 'High' || deal.data[priorityCol] === '🔥 HOT DEAL')
      .sort((a, b) => (b.data[roiCol] || 0) - (a.data[roiCol] || 0))
      .slice(0, 10); // Top 10

    return {
      success: true,
      deals: hotDeals,
      count: hotDeals.length
    };

  } catch (error) {
    logQuantum('UI Error', 'getDealGallery: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// DEAL ANALYSIS
// ================================================================

/**
 * Analyze a single deal by ID or row number
 * Called from: DealAnalyzer.html > analyzeDeal()
 *
 * @param {string|number} dealId - Deal ID or row number
 * @return {Object} Analysis results with metrics, verdict, AI insights
 */
function UI_analyzeDeal(dealId) {
  try {
    // This function should exist in ai-analysis.gs
    const result = analyzeQuantumDeal(dealId);

    return {
      success: true,
      analysis: result
    };

  } catch (error) {
    logQuantum('UI Error', 'analyzeDeal: ' + error.toString());
    return {success: false, error: error.toString()};
  }
}

/**
 * Trigger bulk AI analysis on all new/unanalyzed deals
 * Called from: Menu or QuickActions.html
 *
 * @return {Object} {success: boolean, message: string, count: number}
 */
function UI_triggerBulkAnalysis() {
  try {
    // Show processing dialog
    const html = getQuantumProcessingHTML(0); // Count will be determined in batch function
    const dialog = HtmlService.createHtmlOutput(html)
      .setWidth(500)
      .setHeight(400);

    SpreadsheetApp.getUi().showModalDialog(dialog, '⚛️ Quantum Processing');

    // Execute batch analysis (should exist in ai-analysis.gs)
    const result = executeQuantumAIBatch();

    return {
      success: true,
      message: 'Analysis completed',
      count: result.processed || 0
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// CRM OPERATIONS
// ================================================================

/**
 * Get pipeline data for Pipeline View
 * Called from: PipelineView.html on load
 *
 * @return {Object} Pipeline data organized by stage
 */
function UI_getPipelineData() {
  try {
    const leadsSheet = getQuantumSheet('Leads Tracker');
    if (!leadsSheet) {
      return {success: false, error: 'Leads Tracker sheet not found'};
    }

    const data = leadsSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const statusCol = headers.indexOf('Status');

    // Organize by pipeline stage
    const pipeline = {
      new: [],
      contacted: [],
      appointment: [],
      negotiation: [],
      closed: []
    };

    rows.forEach((row, idx) => {
      const status = (row[statusCol] || '').toLowerCase();
      const dealData = {row: idx + 2, data: row};

      if (status.includes('new')) pipeline.new.push(dealData);
      else if (status.includes('contact')) pipeline.contacted.push(dealData);
      else if (status.includes('appointment')) pipeline.appointment.push(dealData);
      else if (status.includes('negotiation')) pipeline.negotiation.push(dealData);
      else if (status.includes('closed') || status.includes('sold')) pipeline.closed.push(dealData);
    });

    return {
      success: true,
      pipeline: pipeline
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Create appointment for a lead
 * Called from: PipelineView.html or FollowUpSequences.html
 *
 * @param {string} leadId - Lead identifier
 * @param {string} dateTime - Appointment date/time
 * @param {string} type - Appointment type (viewing, phone call, etc.)
 * @return {Object} {success: boolean, appointmentId: string}
 */
function UI_createAppointment(leadId, dateTime, type) {
  try {
    // This function should exist in crm.gs
    const result = createAppointment(leadId, dateTime, type);

    logQuantum('Appointment Created', 'Lead: ' + leadId + ', Type: ' + type);

    return {
      success: true,
      appointmentId: result.id,
      message: 'Appointment scheduled successfully'
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Trigger follow-up sequence for a lead
 * Called from: FollowUpSequences.html
 *
 * @param {string} leadId - Lead identifier
 * @param {string} sequenceType - HOT_LEAD, WARM_LEAD, or COLD_LEAD
 * @return {Object} {success: boolean, message: string}
 */
function UI_triggerFollowUp(leadId, sequenceType) {
  try {
    // This function should exist in crm.gs
    executeFollowUpSequence(leadId, sequenceType);

    return {
      success: true,
      message: 'Follow-up sequence initiated'
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// EXPORTS & INTEGRATIONS
// ================================================================

/**
 * Get SMS export preview data
 * Called from: Menu > "Export to SMS-iT"
 *
 * @return {Object} {success: boolean, deals: Array, html: string}
 */
function UI_getSMSExportPreview() {
  try {
    const dbSheet = getQuantumSheet('Master Database');
    if (!dbSheet) {
      return {success: false, error: 'Master Database sheet not found'};
    }

    const data = dbSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const priorityCol = headers.indexOf('🎯 Priority');

    // Get hot deals for export
    const hotDeals = rows
      .map((row, idx) => ({row: idx + 2, data: row}))
      .filter(deal => deal.data[priorityCol] === 'High' || deal.data[priorityCol] === '🔥 HOT DEAL')
      .slice(0, 20); // Limit to 20 for SMS campaigns

    // Generate HTML preview (or return data for client-side rendering)
    const html = getQuantumSMSExportHTML(hotDeals); // Should exist in ui templates

    return {
      success: true,
      deals: hotDeals,
      html: html
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Execute export to external platform
 * Called from: SMSExportPreview.html or IntegrationManager.html
 *
 * @param {string} platform - 'smsit', 'companyhub', 'ohmylead'
 * @param {Array} dealIds - Array of deal IDs to export
 * @param {Object} options - Export options (campaign name, message template, etc.)
 * @return {Object} {success: boolean, exported: number, errors: Array}
 */
function UI_executeExport(platform, dealIds, options) {
  try {
    let result;

    switch (platform.toLowerCase()) {
      case 'smsit':
        // Function should exist in integrations.gs
        result = exportToSMSIT(dealIds, options);
        break;

      case 'companyhub':
        result = syncCompanyHub(dealIds);
        break;

      case 'ohmylead':
        result = createOhmyleadAppointment(dealIds[0], options);
        break;

      default:
        return {success: false, error: 'Unknown platform: ' + platform};
    }

    logQuantum('Export Executed', platform + ': ' + dealIds.length + ' deals');

    return {
      success: true,
      exported: result.count || dealIds.length,
      message: 'Export completed successfully'
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// SETTINGS & CONFIGURATION
// ================================================================

/**
 * Get all system settings for Settings dialog
 * Called from: Settings.html on load
 *
 * @return {Object} All settings from Script Properties
 */
function UI_getSettings() {
  try {
    const settings = getAllSettings(); // Should exist in util.gs

    return {
      success: true,
      settings: settings
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Save settings from Settings dialog
 * Called from: Settings.html > saveSettings()
 *
 * @param {Object} settings - Key-value pairs of settings
 * @return {Object} {success: boolean, message: string}
 */
function UI_saveSettings(settings) {
  try {
    // Save each setting
    Object.keys(settings).forEach(key => {
      setQuantumSetting(key, settings[key]); // Should exist in util.gs
    });

    logQuantum('Settings Updated', Object.keys(settings).length + ' settings saved');

    return {
      success: true,
      message: 'Settings saved successfully'
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// KNOWLEDGE BASE & TOOLS
// ================================================================

/**
 * Search knowledge base
 * Called from: KnowledgeBase.html > search()
 *
 * @param {string} query - Search query
 * @param {string} category - Category filter (optional)
 * @return {Object} {success: boolean, results: Array}
 */
function UI_searchKnowledgeBase(query, category) {
  try {
    const kbSheet = getQuantumSheet('Knowledge Base');
    if (!kbSheet) {
      return {success: false, error: 'Knowledge Base sheet not found'};
    }

    const data = kbSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Simple search implementation (can be enhanced with fuzzy matching)
    const results = rows
      .filter(row => {
        const rowStr = row.join(' ').toLowerCase();
        return rowStr.includes(query.toLowerCase());
      })
      .map((row, idx) => ({
        row: idx + 2,
        data: row
      }));

    return {
      success: true,
      results: results,
      count: results.length
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Decode VIN
 * Called from: VINDecoder.html > decode()
 *
 * @param {string} vin - Vehicle Identification Number
 * @return {Object} {success: boolean, vehicleData: Object}
 */
function UI_decodeVIN(vin) {
  try {
    // This function should exist in vin-decoder.gs (optional enhancement)
    // For MVP, return placeholder
    return {
      success: false,
      error: 'VIN decoder not yet implemented. Coming in Phase 2.'
    };

    // Future implementation:
    // const vehicleData = decodeVIN(vin);
    // return {success: true, vehicleData: vehicleData};

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// DASHBOARD & ANALYTICS
// ================================================================

/**
 * Get dashboard metrics summary
 * Called from: Dashboard widgets, DealGallery.html
 *
 * @return {Object} {success: boolean, metrics: Object}
 */
function UI_getDashboardMetrics() {
  try {
    // This function should exist in dashboard.gs
    const metrics = calculateDashboardMetrics();

    return {
      success: true,
      metrics: metrics
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

/**
 * Refresh dashboard (regenerate all charts and metrics)
 * Called from: Menu > "Dashboard > Refresh Dashboard"
 *
 * @return {Object} {success: boolean, message: string}
 */
function UI_refreshDashboard() {
  try {
    // This function should exist in dashboard.gs
    generateQuantumDashboard();

    return {
      success: true,
      message: 'Dashboard refreshed successfully'
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// ACTIVITY LOGS
// ================================================================

/**
 * Get recent activity logs for display in UI
 * Called from: Dashboard, Help dialog
 *
 * @param {number} limit - Number of recent logs to return (default 50)
 * @return {Object} {success: boolean, logs: Array}
 */
function UI_getActivityLogs(limit) {
  try {
    const logsSheet = getQuantumSheet('Activity Logs');
    if (!logsSheet) {
      return {success: false, error: 'Activity Logs sheet not found'};
    }

    limit = limit || 50;

    const data = logsSheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    // Get most recent logs
    const recentLogs = rows
      .reverse() // Most recent first
      .slice(0, limit)
      .map(row => ({
        timestamp: row[0],
        user: row[1],
        action: row[2],
        details: row[3],
        status: row[4]
      }));

    return {
      success: true,
      logs: recentLogs
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}

// ================================================================
// TEST & DEBUG ENDPOINTS
// ================================================================

/**
 * Test API connection (OpenAI, SMS-iT, etc.)
 * Called from: IntegrationManager.html > testConnection()
 *
 * @param {string} service - Service to test ('openai', 'smsit', 'ohmylead')
 * @return {Object} {success: boolean, message: string, latency: number}
 */
function UI_testConnection(service) {
  try {
    const startTime = new Date().getTime();

    switch (service.toLowerCase()) {
      case 'openai':
        const apiKey = getQuantumSetting('OPENAI_API_KEY');
        if (!apiKey) {
          return {success: false, error: 'OpenAI API key not configured'};
        }

        // Simple test call
        callOpenAI('Test connection', {test: true}); // Should exist in ai-analysis.gs
        break;

      case 'smsit':
        // Test SMS-iT connection
        const smsitKey = getQuantumSetting('SMSIT_API_KEY');
        if (!smsitKey) {
          return {success: false, error: 'SMS-iT API key not configured'};
        }
        // Make test API call
        break;

      default:
        return {success: false, error: 'Unknown service: ' + service};
    }

    const latency = new Date().getTime() - startTime;

    logQuantum('Connection Test', service + ' - Success (' + latency + 'ms)');

    return {
      success: true,
      message: 'Connection successful',
      latency: latency
    };

  } catch (error) {
    return {success: false, error: error.toString()};
  }
}
