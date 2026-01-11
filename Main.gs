// ==========================================
// CARHAWK ULTIMATE - MAIN ORCHESTRATOR
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Main entry point, custom menu, and workflow orchestration
// ==========================================

/**
 * On spreadsheet open - create custom menu
 */
function onOpen() {
  createCustomMenu();
}

/**
 * Create custom CarHawk menu
 */
function createCustomMenu() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('🦅 CarHawk Ultimate')
    .addItem('⚙️ Setup System', 'setupCarHawkUltimate')
    .addSeparator()
    .addSubMenu(ui.createMenu('📥 Import Data')
      .addItem('Import from All Staging Sheets', 'importFromAllStagingSheets')
      .addItem('Import & Run Full Analysis', 'importAndAnalyze'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🔍 Analysis')
      .addItem('Calculate MAO for All', 'updateMAOCalculations')
      .addItem('Update Speed-to-Lead', 'updateSpeedToLeadData')
      .addItem('Analyze Rental Viability', 'updateRentalAnalysis')
      .addItem('Calculate Lead Scores', 'updateLeadScores')
      .addItem('Run AI Analysis (Top 10)', 'runBatchAIAnalysisTen')
      .addItem('Generate Seller Messages', 'generateAllSellerMessages'))
    .addSeparator()
    .addSubMenu(ui.createMenu('📊 Reports & Dashboards')
      .addItem('Generate Verdict Sheet', 'generateVerdictSheet')
      .addItem('Generate Speed-to-Lead Dashboard', 'generateSpeedToLeadDashboard')
      .addItem('Generate Rental Dashboard', 'generateRentalDashboard')
      .addItem('Generate Scoring Breakdown', 'generateScoringBreakdown')
      .addItem('Generate CRM Summary', 'generateCRMSummary'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🤝 CRM Integration')
      .addItem('Sync Top Deals to CRM', 'syncTopDealsToCRM')
      .addItem('Test CRM Connection', 'testCRMConnection'))
    .addSeparator()
    .addSubMenu(ui.createMenu('⚡ Automation')
      .addItem('Setup Speed-to-Lead Alerts', 'setupSpeedToLeadTrigger')
      .addItem('Remove Speed-to-Lead Alerts', 'removeSpeedToLeadTrigger')
      .addItem('Run Complete Analysis Pipeline', 'runCompleteAnalysisPipeline'))
    .addSeparator()
    .addItem('📚 Documentation', 'showDocumentation')
    .addItem('❓ About', 'showAbout')
    .addToUi();
}

/**
 * Run complete analysis pipeline
 * This is the "master function" that runs everything in sequence
 */
function runCompleteAnalysisPipeline() {
  const ui = SpreadsheetApp.getUi();

  const response = ui.alert(
    '⚡ Complete Analysis Pipeline',
    'This will run the complete analysis pipeline:\n\n' +
    '1. Calculate MAO for all vehicles\n' +
    '2. Update Speed-to-Lead data\n' +
    '3. Analyze rental viability\n' +
    '4. Calculate lead scores\n' +
    '5. Generate seller messages\n' +
    '6. Update verdicts\n' +
    '7. Generate all dashboards\n\n' +
    'This may take 2-5 minutes.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    ui.alert('⏳ Running Pipeline', 'Step 1/7: Calculating MAO...', ui.ButtonSet.OK);
    updateMAOCalculations();

    ui.alert('⏳ Running Pipeline', 'Step 2/7: Updating Speed-to-Lead...', ui.ButtonSet.OK);
    updateSpeedToLeadData();

    ui.alert('⏳ Running Pipeline', 'Step 3/7: Analyzing Rental Viability...', ui.ButtonSet.OK);
    updateRentalAnalysis();

    ui.alert('⏳ Running Pipeline', 'Step 4/7: Calculating Lead Scores...', ui.ButtonSet.OK);
    updateLeadScores();

    ui.alert('⏳ Running Pipeline', 'Step 5/7: Generating Seller Messages...', ui.ButtonSet.OK);
    generateAllSellerMessages();

    ui.alert('⏳ Running Pipeline', 'Step 6/7: Updating Verdicts...', ui.ButtonSet.OK);
    updateVerdictColumn();

    ui.alert('⏳ Running Pipeline', 'Step 7/7: Generating Dashboards...', ui.ButtonSet.OK);
    generateVerdictSheet();
    generateSpeedToLeadDashboard();
    generateRentalDashboard();

    logSystem('PIPELINE_COMPLETE', 'Complete analysis pipeline finished successfully');

    ui.alert(
      '✅ Pipeline Complete!',
      'All analysis has been completed successfully!\n\n' +
      'Check these sheets for results:\n' +
      '• Verdict - Top opportunities\n' +
      '• Speed-to-Lead Dashboard - Urgent leads\n' +
      '• Rental Analysis - Rental opportunities\n\n' +
      'Next step: Review top deals and contact sellers!',
      ui.ButtonSet.OK
    );

  } catch (error) {
    logError('PIPELINE_ERROR', error.message);
    ui.alert('❌ Pipeline Error', 'An error occurred:\n' + error.message, ui.ButtonSet.OK);
  }
}

/**
 * Wrapper for AI analysis with fixed limit
 */
function runBatchAIAnalysisTen() {
  runBatchAIAnalysis(10);
}

/**
 * Show documentation
 */
function showDocumentation() {
  const ui = SpreadsheetApp.getUi();

  const html = HtmlService.createHtmlOutput(`
    <h2>🦅 CarHawk Ultimate Documentation</h2>

    <h3>Quick Start</h3>
    <ol>
      <li><strong>Setup:</strong> Run "Setup System" to create all sheets</li>
      <li><strong>Configure:</strong> Add API keys in the Config sheet</li>
      <li><strong>Import:</strong> Add data to staging sheets (Facebook, Craigslist, etc.)</li>
      <li><strong>Analyze:</strong> Run "Import & Run Full Analysis"</li>
      <li><strong>Review:</strong> Check Verdict sheet for top deals</li>
      <li><strong>Act:</strong> Contact sellers using generated messages</li>
    </ol>

    <h3>Core Features</h3>
    <ul>
      <li><strong>Speed-to-Lead:</strong> Tracks listing freshness, prioritizes immediate action</li>
      <li><strong>MAO Calculation:</strong> Maximum allowable offer using proven formulas</li>
      <li><strong>Rental Analysis:</strong> Turo/rental viability with ROI projections</li>
      <li><strong>Lead Scoring:</strong> Weighted scoring across 8+ factors</li>
      <li><strong>AI Integration:</strong> Seller messages and condition analysis</li>
      <li><strong>CRM Sync:</strong> Push hot leads to SMS-iT CRM</li>
    </ul>

    <h3>Sheet Guide</h3>
    <ul>
      <li><strong>Verdict:</strong> Top-ranked opportunities - START HERE</li>
      <li><strong>Master Database:</strong> Complete vehicle data</li>
      <li><strong>Speed-to-Lead Dashboard:</strong> Urgent leads requiring immediate action</li>
      <li><strong>Rental Analysis:</strong> Best rental/Turo candidates</li>
      <li><strong>Staging Sheets:</strong> Raw import data (read-only)</li>
      <li><strong>Config:</strong> System settings and API keys</li>
    </ul>

    <h3>Automation</h3>
    <p>Enable "Speed-to-Lead Alerts" to get email notifications when fresh, high-value listings appear.</p>

    <h3>Support</h3>
    <p>For issues or questions, check the System Logs sheet or contact support.</p>

    <hr>
    <p style="text-align: center; color: #666;">
      CarHawk Ultimate v${SYSTEM.VERSION}<br>
      Vehicle Intelligence, Flipping & Rental Optimization OS
    </p>
  `)
    .setWidth(600)
    .setHeight(500);

  ui.showModalDialog(html, '📚 CarHawk Ultimate Documentation');
}

/**
 * Show about dialog
 */
function showAbout() {
  const ui = SpreadsheetApp.getUi();

  ui.alert(
    '🦅 CarHawk Ultimate',
    `${SYSTEM.NAME}\n` +
    `Version: ${SYSTEM.VERSION}\n\n` +
    `${SYSTEM.DESCRIPTION}\n\n` +
    `Features:\n` +
    `• Multi-platform vehicle listing aggregation\n` +
    `• Speed-to-Lead tracking & alerts\n` +
    `• MAO calculation with flip strategy optimization\n` +
    `• Turo/rental viability analysis\n` +
    `• AI-powered seller messaging\n` +
    `• CRM integration (SMS-iT, CompanyHub)\n` +
    `• Automated lead scoring & ranking\n\n` +
    `Created with Claude (Opus-level) AI assistance`,
    ui.ButtonSet.OK
  );
}

/**
 * Show setup wizard on first run
 */
function showSetupWizard() {
  const ui = SpreadsheetApp.getUi();

  const html = HtmlService.createHtmlOutput(`
    <h2>Welcome to CarHawk Ultimate! 🦅</h2>

    <p>Let's get you set up in 3 easy steps:</p>

    <h3>Step 1: System Setup</h3>
    <p>Click <strong>"Setup System"</strong> in the CarHawk menu to create all sheets and initialize the database.</p>

    <h3>Step 2: Configuration</h3>
    <p>Open the <strong>Config</strong> sheet and configure:</p>
    <ul>
      <li>Your home base ZIP code</li>
      <li>Email for alerts</li>
      <li>OpenAI API key (optional, for AI analysis)</li>
      <li>CRM credentials (optional, for SMS-iT integration)</li>
    </ul>

    <h3>Step 3: Import Data</h3>
    <p>Add vehicle listings to the staging sheets, then run <strong>"Import & Run Full Analysis"</strong> from the menu.</p>

    <hr>

    <p><strong>Need help?</strong> Check the Documentation in the CarHawk menu.</p>

    <p style="text-align: center; margin-top: 20px;">
      <button onclick="google.script.host.close()">Get Started</button>
    </p>
  `)
    .setWidth(500)
    .setHeight(400);

  ui.showModalDialog(html, '🎉 Welcome to CarHawk Ultimate');
}
