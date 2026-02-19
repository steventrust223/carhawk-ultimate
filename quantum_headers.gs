// =========================================================
// FILE: quantum_headers.gs - Enhanced Headers with CRM
// =========================================================

function deployQuantumHeaders() {
  // Existing headers
  setupImportHeaders();
  setupDatabaseHeaders();
  setupVerdictHeaders();
  setupLeadsTrackerHeaders();
  setupROICalculatorHeaders();
  setupScoringHeaders();
  setupCRMHeaders();
  setupPartsHeaders();
  setupPostSaleHeaders();
  setupReportingHeaders();
  setupSettingsHeaders();
  setupLogsHeaders();

  // NEW CRM headers
  setupAppointmentHeaders();
  setupFollowUpHeaders();
  setupCampaignHeaders();
  setupSMSHeaders();
  setupCallLogHeaders();
  setupClosedDealsHeaders();
  setupKnowledgeBaseHeaders();
  setupIntegrationHeaders();
}

function setupImportHeaders() {
  const headers = [
    'Import ID', 'Date (GMT)', 'Job Link', 'Origin URL', 'Platform',
    'Raw Title', 'Raw Price', 'Raw Location', 'Raw Description',
    'Seller Info', 'Posted Date', 'Images Count', 'Import Status',
    'Processed', 'Master ID', 'Error Log'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.IMPORT.name, headers, '#4285f4');
}

function setupDatabaseHeaders() {
  const headers = [
    'Deal ID', 'Import Date', 'Platform', 'Status', 'Priority',
    'Year', 'Make', 'Model', 'Trim', 'VIN', 'Mileage', 'Color',
    'Title', 'Price', 'Location', 'ZIP', 'Distance (mi)', 'Location Risk', 'Location Flag',
    'Condition', 'Condition Score', 'Repair Keywords', 'Repair Risk Score', 'Est. Repair Cost',
    'Market Value', 'MAO', 'Profit Margin', 'ROI %', 'Capital Tier',
    'Flip Strategy', 'Sales Velocity Score', 'Market Advantage', 'Days Listed',
    'Seller Name', 'Seller Phone', 'Seller Email', 'Seller Type',
    'Deal Flag', 'Hot Seller?', 'Multiple Vehicles?', 'Seller Message',
    'AI Confidence', 'Verdict', 'Verdict Icon', 'Recommended?',
    'Image Score', 'Engagement Score', 'Competition Level',
    'Last Updated', 'Assigned To', 'Notes',
    // NEW CRM fields
    'Stage', 'Contact Count', 'Last Contact', 'Next Action', 'Response Rate',
    'SMS Count', 'Call Count', 'Email Count', 'Meeting Scheduled', 'Follow-up Status'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.DATABASE.name, headers, '#0f9d58');
}

function setupVerdictHeaders() {
  const headers = [
    'Analysis ID', 'Deal ID', 'Analysis Date', 'Model Version',
    'Quantum Score', 'AI Verdict', 'Confidence %', 'Profit Potential',
    'Risk Assessment', 'Market Timing', 'Competition Analysis',
    'Price Optimization', 'Negotiation Strategy', 'Quick Sale Probability',
    'Repair Complexity', 'Hidden Cost Risk', 'Flip Timeline',
    'Success Probability', 'Alternative Strategies', 'Key Insights',
    'Red Flags', 'Green Lights', 'Market Comparables', 'Decision Matrix'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.VERDICT.name, headers, '#ea4335');
}

function setupLeadsTrackerHeaders() {
  const headers = [
    'Lead ID', 'Deal ID', 'Date Added', 'Status', 'Priority', 'Stage',
    'Vehicle', 'Price', 'Profit Potential', 'ROI %', 'Location', 'Distance',
    'Seller Name', 'Phone', 'Email', 'Best Contact Time', 'Contact Attempts',
    'Last Contact', 'Next Action', 'Action Date', 'Response Rate',
    'Interest Level', 'Negotiation Notes', 'Final Offer', 'Close Probability',
    'Assigned To', 'Tags', 'Follow-up Required', 'SMS Sent', 'Email Sent'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.LEADS.name, headers, '#fbbc04');
}

function setupROICalculatorHeaders() {
  const headers = [
    'Calc ID', 'Deal ID', 'Vehicle', 'Scenario', 'Purchase Price', 'Transport Cost',
    'Inspection Cost', 'Repair Labor', 'Parts Cost', 'Detail Cost', 'Marketing Cost',
    'Listing Fees', 'Other Costs', 'Total Investment', 'Target Sale Price',
    'Market Comp Avg', 'Days to Sell Est', 'Holding Cost/Day', 'Total Holding',
    'Transaction Fees', 'Total Costs', 'Net Profit', 'Profit Margin %', 'ROI %',
    'Cash on Cash', 'Break Even Price', 'Min Acceptable', 'Max Acceptable',
    'Risk Score', 'Confidence Level', 'Scenario Notes'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.CALCULATOR.name, headers, '#673ab7');
}

function setupScoringHeaders() {
  const headers = [
    'Score ID', 'Deal ID', 'Analysis Date', 'Quantum Score', 'Component Scores',
    'Market Score', 'Vehicle Score', 'Seller Score', 'Timing Score', 'Location Score',
    'Competition Score', 'Profit Score', 'Risk Score', 'Velocity Score', 'Condition Score',
    'Total Weighted Score', 'Percentile Rank', 'Category', 'Investment Grade',
    'Risk Factors', 'Opportunity Factors', 'Score Trend', 'Previous Score',
    'Score Change', 'Analyst Notes', 'Override', 'Final Grade'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.SCORING.name, headers, '#ff6d00');
}

function setupCRMHeaders() {
  const headers = [
    'Export ID', 'Export Date', 'Platform', 'Deal IDs', 'Record Count',
    'Export Type', 'Include Fields', 'Filters Applied', 'Total Value',
    'Avg Deal Value', 'Hot Leads Count', 'Contact Info Complete', 'SMS Ready',
    'Email Ready', 'Campaign Name', 'Template Used', 'Tags Applied',
    'CRM Record IDs', 'Sync Status', 'Sync Errors', 'Last Sync', 'Next Sync',
    'Automation Enabled', 'Response Tracking', 'Conversion Count', 'Revenue Generated'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.CRM.name, headers, '#00acc1');
}

function setupPartsHeaders() {
  const headers = [
    'Part ID', 'Deal ID', 'Vehicle', 'Category', 'Subcategory', 'Part Name',
    'Part Number', 'OEM Number', 'Condition Needed', 'New Price', 'Used Price',
    'Reman Price', 'Selected Option', 'Quantity', 'Unit Cost', 'Total Cost',
    'Supplier', 'Supplier Part #', 'Lead Time', 'In Stock', 'Ordered',
    'Order Date', 'Expected Date', 'Received Date', 'Quality Check',
    'Installation Hours', 'Labor Rate', 'Labor Cost', 'Core Charge', 'Core Return',
    'Warranty', 'Notes'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.PARTS.name, headers, '#795548');
}

function setupPostSaleHeaders() {
  const headers = [
    'Sale ID', 'Deal ID', 'Vehicle', 'Sale Date', 'Days to Sell', 'Buyer Name',
    'Buyer Type', 'Sale Platform', 'Listed Price', 'Sale Price', 'Negotiation %',
    'Purchase Price', 'Total Investment', 'Gross Profit', 'Net Profit',
    'Actual ROI %', 'vs Projected ROI', 'Payment Method', 'Payment Status',
    'Title Transfer', 'Delivery Method', 'Buyer Satisfaction', 'Would Refer',
    'Lessons Learned', 'What Worked', 'What Didn\'t', 'Strategy Used',
    'Market Conditions', 'Seasonal Impact', 'Repeat Buyer', 'Referral Source',
    'Follow-up Date', 'Testimonial', 'Case Study', 'Performance Grade'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.POSTSALE.name, headers, '#607d8b');
}

function setupReportingHeaders() {
  const headers = [
    'Metric', 'Value', 'Change', 'Trend', 'Target', 'Status', 'Period',
    'Comparison', 'Percentile', 'Grade', 'Action Required', 'Notes'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.REPORTING.name, headers, '#9e9e9e');
}

function setupSettingsHeaders() {
  const headers = [
    'Setting Key', 'Value', 'Updated', 'Description', 'Category', 'Data Type',
    'Validation', 'Default', 'Required', 'Affects', 'Restart Required'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.SETTINGS.name, headers, '#424242');
}

function setupLogsHeaders() {
  const headers = [
    'Timestamp', 'Level', 'Action', 'Category', 'Details', 'User',
    'Deal ID', 'Duration (ms)', 'Success', 'Error', 'Stack Trace'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.LOGS.name, headers, '#212121');
}

function setupAppointmentHeaders() {
  const headers = [
    'Appointment ID', 'Deal ID', 'Vehicle', 'Seller Name', 'Phone', 'Email',
    'Scheduled Time', 'Location', 'Location Type', 'Duration', 'Status',
    'Type', 'Notes', 'Reminder Sent', 'Created Date', 'Created By',
    'Updated Date', 'Confirmed', 'Show Rate', 'Outcome', 'Follow-up Required'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.APPOINTMENTS.name, headers, '#4caf50');
}

function setupFollowUpHeaders() {
  const headers = [
    'Follow-up ID', 'Deal ID', 'Campaign ID', 'Sequence Type', 'Step Number',
    'Scheduled Time', 'Type', 'Template', 'Status', 'Sent Time',
    'Response', 'Response Time', 'Opened', 'Clicked', 'Replied',
    'Created Date', 'Priority', 'Retry Count', 'Error Message', 'Next Step'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.FOLLOWUPS.name, headers, '#ff9800');
}

function setupCampaignHeaders() {
  const headers = [
    'Touch ID', 'Campaign ID', 'Deal ID', 'Sequence Type', 'Touch Index',
    'Type', 'Template', 'Subject', 'Message', 'Scheduled Time',
    'Status', 'Sent Time', 'Delivered', 'Response', 'Response Type',
    'Created Date', 'Tags', 'A/B Test', 'Performance Score', 'Cost'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.CAMPAIGNS.name, headers, '#9c27b0');
}

function setupSMSHeaders() {
  const headers = [
    'Conversation ID', 'Deal ID', 'Phone Number', 'Direction', 'Message',
    'Timestamp', 'Status', 'Intent', 'Sentiment', 'Type',
    'Campaign ID', 'Template Used', 'Response Time', 'Character Count',
    'Media URL', 'Error Code', 'Cost', 'Provider', 'Thread ID', 'Tags'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.SMS.name, headers, '#00bcd4');
}

function setupCallLogHeaders() {
  const headers = [
    'Call ID', 'Deal ID', 'Phone Number', 'Direction', 'Start Time',
    'End Time', 'Duration', 'Recording URL', 'Transcription', 'Summary',
    'Sentiment', 'Intent', 'Outcome', 'Next Action', 'Appointment Detected',
    'Price Discussed', 'Objections', 'AI Score', 'Cost', 'Tags'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.CALLS.name, headers, '#f44336');
}

function setupClosedDealsHeaders() {
  const headers = [
    'Close ID', 'Deal ID', 'Vehicle', 'Year', 'Make', 'Model',
    'Mileage', 'Condition', 'Original Price', 'Purchase Price', 'Sale Price',
    'Platform', 'Days to Close', 'Days on Market', 'Profit', 'ROI %',
    'Close Date', 'Payment Method', 'Buyer Type', 'Marketing Cost',
    'Repair Cost', 'Total Investment', 'Net Profit', 'Commission',
    'Success Factors', 'Lessons Learned', 'Rating', 'Tags'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.CLOSED.name, headers, '#4caf50');
}

function setupKnowledgeBaseHeaders() {
  const headers = [
    'KB ID', 'Make', 'Model', 'Years', 'Category', 'Common Issues',
    'Repair Costs', 'Market Demand', 'Quick Flip Score', 'Avg Days to Sell',
    'Price Range Low', 'Price Range High', 'Best Months', 'Target Buyer',
    'Negotiation Tips', 'Red Flags', 'Success Rate', 'Updated Date',
    'Data Points', 'Confidence Score'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.KNOWLEDGE.name, headers, '#3f51b5');
}

function setupIntegrationHeaders() {
  const headers = [
    'Integration ID', 'Provider', 'Type', 'Name', 'API Key', 'Secret',
    'Status', 'Last Sync', 'Next Sync', 'Sync Frequency', 'Records Synced',
    'Error Count', 'Last Error', 'Configuration', 'Webhook URL',
    'Features', 'Limits', 'Cost', 'Notes', 'Created Date'
  ];
  applyQuantumHeaders(QUANTUM_SHEETS.INTEGRATIONS.name, headers, '#009688');
}

function applyQuantumHeaders(sheetName, headers, color) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) return;

  // Set headers
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Quantum styling
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange
    .setBackground(color)
    .setFontColor('#ffffff')
    .setFontWeight('bold')
    .setFontFamily('Google Sans')
    .setFontSize(11)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true);

  // Set row height
  sheet.setRowHeight(1, 40);

  // Freeze header
  sheet.setFrozenRows(1);

  // Auto-resize columns
  sheet.autoResizeColumns(1, headers.length);
}
