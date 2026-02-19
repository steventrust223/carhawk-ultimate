// =========================================================
// FILE: quantum_menu.gs - Enhanced Menu System with CRM
// =========================================================

function onOpen() {
  createQuantumMenu();
}

function createQuantumMenu() {
  const ui = SpreadsheetApp.getUi();

  ui.createMenu('⚙️ CarHawk Ultimate')
    // Quantum Operations
    .addSubMenu(ui.createMenu('⚛️ Quantum Operations')
      .addItem('🚀 Initialize System', 'initializeQuantumSystem')
      .addItem('🔄 Run Quantum Sync', 'quantumImportSync')
      .addItem('🧠 Execute AI Analysis', 'executeQuantumAIBatch')
      .addItem('⚡ Real-time Mode', 'toggleRealTimeMode')
      .addSeparator()
      .addItem('🎯 Analyze Single Deal', 'analyzeQuantumDeal')
      .addItem('🔍 Deep Market Scan', 'runDeepMarketScan'))

    // CRM Operations - NEW
    .addSubMenu(ui.createMenu('🎯 CRM Operations')
      .addItem('📅 Manage Appointments', 'openAppointmentManager')
      .addItem('🔄 Follow-up Center', 'openFollowUpCenter')
      .addItem('📧 Campaign Manager', 'openCampaignManager')
      .addItem('💬 SMS Conversations', 'openSMSConversations')
      .addItem('📞 AI Call Logs', 'openCallLogs')
      .addSeparator()
      .addItem('🚀 Launch Campaign', 'launchCampaignUI')
      .addItem('📊 CRM Analytics', 'openCRMAnalytics'))

    // CRM & Export
    .addSubMenu(ui.createMenu('🤝 CRM & Export')
      .addItem('📱 Export to SMS-iT', 'exportQuantumSMS')
      .addItem('🏢 Export to CompanyHub', 'exportQuantumCRM')
      .addItem('📧 Generate Campaigns', 'generateQuantumCampaigns')
      .addSeparator()
      .addItem('🔄 Sync CRM Status', 'syncQuantumCRM')
      .addItem('📊 Export Analytics', 'exportQuantumAnalytics'))

    // Lead Management - NEW
    .addSubMenu(ui.createMenu('👥 Lead Management')
      .addItem('🎯 Lead Tracker', 'openLeadTracker')
      .addItem('📊 Lead Scoring', 'openLeadScoring')
      .addItem('🔥 Hot Leads', 'viewHotLeads')
      .addItem('❄️ Cold Leads', 'viewColdLeads')
      .addSeparator()
      .addItem('📞 Speed to Lead', 'openSpeedToLead')
      .addItem('💰 Pipeline View', 'openPipelineView'))

    // Alerts & Automation
    .addSubMenu(ui.createMenu('🔔 Alerts & Automation')
      .addItem('⚡ Check Alert Queue', 'checkQuantumAlerts')
      .addItem('📬 Send Alert Digest', 'sendQuantumDigest')
      .addItem('🎯 Configure Triggers', 'configureQuantumTriggers')
      .addSeparator()
      .addItem('🤖 Automation Status', 'showAutomationStatus')
      .addItem('📅 Schedule Manager', 'openScheduleManager')
      .addItem('🔄 Follow-up Sequences', 'manageFollowUpSequences'))

    // Analytics & Reports
    .addSubMenu(ui.createMenu('📊 Analytics & Reports')
      .addItem('📈 Quantum Dashboard', 'openQuantumDashboard')
      .addItem('🏆 Performance Matrix', 'generatePerformanceMatrix')
      .addItem('📊 Market Intelligence', 'generateMarketIntelligence')
      .addSeparator()
      .addItem('📑 Weekly Quantum Report', 'generateQuantumWeekly')
      .addItem('📋 Monthly Deep Dive', 'generateQuantumMonthly')
      .addItem('🎯 ROI Optimizer', 'runROIOptimizer')
      .addItem('💰 Closed Deals Report', 'generateClosedDealsReport'))

    // Tools & Utilities
    .addSubMenu(ui.createMenu('🛠️ Tools & Utilities')
      .addItem('🚗 Quantum VIN Decoder', 'openQuantumVINDecoder')
      .addItem('💰 Deal Calculator Pro', 'openDealCalculatorPro')
      .addItem('📍 Market Heat Map', 'generateMarketHeatMap')
      .addItem('📚 Knowledge Base', 'openKnowledgeBase')
      .addSeparator()
      .addItem('🔧 System Diagnostics', 'runSystemDiagnostics')
      .addItem('⚙️ Quantum Settings', 'openQuantumSettings')
      .addItem('🔌 Integration Manager', 'openIntegrationManager'))

    .addSeparator()
    .addItem('🎴 Deal Gallery', 'showDealGallery')
    .addItem('⚡ Quick Actions', 'showQuickActions')
    .addItem('🧠 Deal Analyzer', 'showDealAnalyzer')

    // Turo Module
    .addSeparator()
    .addSubMenu(ui.createMenu('🚗 Turo Module')
      .addItem('🔍 Analyze Selected Deal for Turo', 'analyzeTuroSelected')
      .addItem('📊 Batch Analyze All Turo Candidates', 'batchAnalyzeTuro')
      .addSeparator()
      .addItem('📋 Refresh Fleet Dashboard', 'refreshFleetManager')
      .addItem('➕ Add Vehicle to Fleet', 'addToFleetSelected')
      .addItem('💰 Update Fleet Financials', 'updateFleetFinancials')
      .addSeparator()
      .addItem('🔧 Log Maintenance Event', 'logMaintenanceEvent')
      .addItem('🛡️ Check Compliance Alerts', 'checkComplianceAlerts')
      .addSeparator()
      .addItem('⚙️ Setup Turo Module', 'setupTuroModule'))

    .addSeparator()
    .addItem('❓ Quantum Help', 'showQuantumHelp')
    .addItem('ℹ️ About CarHawk Ultimate', 'showQuantumAbout')
    .addToUi();
}
