// ============================================================================
// QUANTUM FALLBACK - Fallback Functions Module
// ============================================================================
// Provides fallback analysis, verdict logging, realtime sync setup,
// AI model initialization, and HTML include utility.
// ============================================================================

/**
 * Generates a default analysis object when AI processing fails.
 * Returns safe default values to ensure the system continues operating.
 *
 * @param {Object} context - The context object for the failed analysis.
 * @return {Object} Default analysis object with baseline values.
 */
function generateFallbackAnalysis(context) {
  return {
    score: 50,
    verdict: 'PORTFOLIO FOUNDATION',
    confidence: 0,
    flipStrategy: 'Needs Review',
    sellerMessage: 'Thank you for your listing. We are currently reviewing this vehicle and will follow up with more details shortly.',
    context: context || {}
  };
}

/**
 * Appends a verdict row to the Verdict sheet with analysis details.
 *
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet - The Verdict sheet.
 * @param {string} dealId - The deal identifier.
 * @param {Object} analysis - The analysis object containing verdict data.
 */
function logQuantumVerdict(sheet, dealId, analysis) {
  var verdictId = 'VER-' + dealId;
  var timestamp = new Date();

  sheet.appendRow([
    verdictId,
    dealId,
    timestamp,
    analysis.score || 0,
    analysis.verdict || '',
    analysis.confidence || 0,
    analysis.flipStrategy || '',
    analysis.sellerMessage || '',
    analysis.marketValue || '',
    analysis.estimatedProfit || '',
    analysis.roi || '',
    analysis.daysToSell || '',
    analysis.riskLevel || '',
    analysis.notes || ''
  ]);
}

/**
 * Sets up realtime sync configuration with default values.
 * Initializes sync as disabled with a 300-second interval.
 */
function setupRealtimeSync() {
  updateQuantumSetting('REALTIME_SYNC', 'false');
  updateQuantumSetting('SYNC_INTERVAL', '300');
}

/**
 * Initializes AI models and stores configuration values in settings.
 * Persists all provided config values along with system metadata.
 *
 * @param {Object} config - Configuration object with deployment settings.
 */
function initializeAIModels(config) {
  updateQuantumSetting('BUSINESS_NAME', config.businessName || '');
  updateQuantumSetting('HOME_ZIP', config.homeZip || '');
  updateQuantumSetting('OPENAI_API_KEY', config.openaiKey || '');
  updateQuantumSetting('PROFIT_TARGET', config.profitTarget || '2000');
  updateQuantumSetting('ANALYSIS_DEPTH', config.analysisDepth || 'Quantum');
  updateQuantumSetting('ALERT_EMAIL', config.alertEmail || '');
  updateQuantumSetting('SYSTEM_VERSION', '1.0.0');
  updateQuantumSetting('INSTALL_DATE', new Date().toISOString());
  updateQuantumSetting('REALTIME_ALERTS', 'true');
}

/**
 * Includes the content of an HTML file for use in templated HTML.
 * Utility function for modular HTML includes in the Apps Script UI.
 *
 * @param {string} filename - The name of the HTML file to include.
 * @return {string} The HTML content of the specified file.
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
