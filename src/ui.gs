// ============================================================================
// CARHAWK ULTIMATE — UI.GS
// User Interface Components: Sidebars, Dialogs, Dashboards
// ============================================================================

// ============================================================================
// SIDEBAR FUNCTIONS
// ============================================================================

/**
 * Show add deal sidebar
 */
function showAddDealSidebar() {
  const html = HtmlService.createHtmlOutput(getAddDealSidebarHTML())
    .setTitle('Add New Deal')
    .setWidth(350);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show system settings sidebar
 */
function showSystemSettings() {
  const html = HtmlService.createHtmlOutput(getSystemSettingsHTML())
    .setTitle('System Settings')
    .setWidth(400);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show system logs
 */
function showSystemLogs() {
  const sheet = getSheet(SHEETS.LOGS);
  if (sheet) {
    SpreadsheetApp.setActiveSheet(sheet);
  } else {
    SpreadsheetApp.getUi().alert('System Logs sheet not found.');
  }
}

/**
 * Show CRM sync log
 */
function showCRMSyncLog() {
  const sheet = getSheet(SHEETS.CRM_SYNC_LOG);
  if (sheet) {
    SpreadsheetApp.setActiveSheet(sheet);
  } else {
    SpreadsheetApp.getUi().alert('CRM Sync Log sheet not found.');
  }
}

/**
 * Show help dialog
 */
function showHelp() {
  const html = HtmlService.createHtmlOutput(getHelpHTML())
    .setWidth(600)
    .setHeight(500);

  SpreadsheetApp.getUi().showModalDialog(html, '❓ CarHawk Help');
}

/**
 * Show about dialog
 */
function showAbout() {
  SpreadsheetApp.getUi().alert(
    '🚗 CarHawk Ultimate',
    `Version: ${CARHAWK_VERSION}\n\n` +
    'Vehicle Deal Intelligence Platform\n\n' +
    'Features:\n' +
    '• Automated deal analysis\n' +
    '• Real-time scoring engine\n' +
    '• CRM integration (SMS-iT, CompanyHub)\n' +
    '• AI-powered insights\n\n' +
    '© 2025 CarHawk',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// ============================================================================
// DASHBOARD GENERATION
// ============================================================================

/**
 * Generate dashboard with metrics
 */
function generateDashboard() {
  const sheet = getOrCreateSheet(SHEETS.DASHBOARD);
  sheet.clear();

  const masterSheet = getSheet(SHEETS.MASTER);
  if (!masterSheet) {
    sheet.getRange('A1').setValue('No data available. Import leads first.');
    return;
  }

  const data = masterSheet.getDataRange().getValues();
  const metrics = calculateDashboardMetrics(data);

  // Title
  sheet.getRange('A1').setValue('🚗 CarHawk Ultimate Dashboard');
  sheet.getRange('A1').setFontSize(24).setFontWeight('bold');
  sheet.getRange('A2').setValue(`Last updated: ${new Date().toLocaleString()}`);

  // Summary cards
  let row = 4;

  // Row 1: Key metrics
  const summaryData = [
    ['Total Leads', metrics.totalLeads],
    ['Hot Deals', metrics.hotDeals],
    ['Solid Deals', metrics.solidDeals],
    ['Avg Score', metrics.avgScore],
    ['Total Pipeline', formatCurrency(metrics.totalPipeline)]
  ];

  sheet.getRange(row, 1, 1, 5).setValues([summaryData.map(s => s[0])]);
  sheet.getRange(row, 1, 1, 5).setFontWeight('bold').setBackground('#f0f0f0');
  sheet.getRange(row + 1, 1, 1, 5).setValues([summaryData.map(s => s[1])]);
  sheet.getRange(row + 1, 1, 1, 5).setFontSize(18);

  row += 4;

  // By Platform
  sheet.getRange(row, 1).setValue('Leads by Platform').setFontWeight('bold');
  row++;
  for (const [platform, count] of Object.entries(metrics.byPlatform)) {
    sheet.getRange(row, 1).setValue(platform);
    sheet.getRange(row, 2).setValue(count);
    row++;
  }

  row += 2;

  // By Temperature
  sheet.getRange(row, 1).setValue('Leads by Temperature').setFontWeight('bold');
  row++;
  for (const [temp, count] of Object.entries(metrics.byTemperature)) {
    sheet.getRange(row, 1).setValue(temp);
    sheet.getRange(row, 2).setValue(count);
    row++;
  }

  row += 2;

  // Top deals
  sheet.getRange(row, 1).setValue('Top 10 Deals').setFontWeight('bold');
  row++;
  sheet.getRange(row, 1, 1, 6).setValues([['Vehicle', 'Score', 'MAO', 'Profit', 'Verdict', 'Strategy']]);
  sheet.getRange(row, 1, 1, 6).setFontWeight('bold').setBackground('#f0f0f0');
  row++;

  for (const deal of metrics.topDeals) {
    sheet.getRange(row, 1, 1, 6).setValues([[
      deal.vehicle,
      deal.score,
      formatCurrency(deal.mao),
      formatCurrency(deal.profit),
      deal.verdict,
      deal.strategy
    ]]);
    row++;
  }

  // Format
  sheet.autoResizeColumns(1, 6);

  logSystem('Dashboard', 'Dashboard generated');
}

/**
 * Calculate dashboard metrics
 */
function calculateDashboardMetrics(data) {
  const metrics = {
    totalLeads: 0,
    hotDeals: 0,
    solidDeals: 0,
    avgScore: 0,
    totalPipeline: 0,
    byPlatform: {},
    byTemperature: {},
    byStrategy: {},
    topDeals: []
  };

  let totalScore = 0;
  const deals = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue; // Skip empty rows

    metrics.totalLeads++;

    // Temperature
    const temp = row[5] || 'Unknown';
    metrics.byTemperature[temp] = (metrics.byTemperature[temp] || 0) + 1;

    if (temp === 'Hot') metrics.hotDeals++;
    if (row[26] && row[26].includes('SOLID')) metrics.solidDeals++;

    // Platform
    const platform = row[2] || 'Unknown';
    metrics.byPlatform[platform] = (metrics.byPlatform[platform] || 0) + 1;

    // Strategy
    const strategy = row[27] || 'Unknown';
    metrics.byStrategy[strategy] = (metrics.byStrategy[strategy] || 0) + 1;

    // Score
    const score = parseFloat(row[25]) || 0;
    totalScore += score;

    // Pipeline value
    const mao = parseFloat(row[19]) || 0;
    if (temp === 'Hot' || temp === 'Warm') {
      metrics.totalPipeline += mao;
    }

    // Collect for top deals
    deals.push({
      vehicle: `${row[6]} ${row[7]} ${row[8]}`.trim(),
      score: score,
      mao: mao,
      profit: parseFloat(row[23]) || 0,
      verdict: row[26] || '',
      strategy: row[27] || ''
    });
  }

  metrics.avgScore = metrics.totalLeads > 0 ? Math.round(totalScore / metrics.totalLeads) : 0;

  // Sort and get top deals
  deals.sort((a, b) => b.score - a.score);
  metrics.topDeals = deals.slice(0, 10);

  return metrics;
}

// ============================================================================
// REPORTING
// ============================================================================

/**
 * Generate weekly report
 */
function generateWeeklyReport() {
  const sheet = getOrCreateSheet(SHEETS.REPORTING);
  const masterSheet = getSheet(SHEETS.MASTER);

  if (!masterSheet) return;

  const data = masterSheet.getDataRange().getValues();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let weeklyLeads = 0;
  let weeklyHot = 0;
  let weeklyValue = 0;

  for (let i = 1; i < data.length; i++) {
    const dateAdded = new Date(data[i][1]);
    if (dateAdded >= weekAgo) {
      weeklyLeads++;
      if (data[i][5] === 'Hot') weeklyHot++;
      weeklyValue += parseFloat(data[i][19]) || 0;
    }
  }

  // Add report row
  sheet.appendRow([
    now,
    'Weekly',
    weeklyLeads,
    weeklyHot,
    weeklyValue,
    Math.round(weeklyValue / Math.max(weeklyLeads, 1))
  ]);

  // Send email if configured
  const email = getConfigValue('ALERT_EMAIL', '');
  if (email) {
    sendWeeklyReportEmail({
      leads: weeklyLeads,
      hot: weeklyHot,
      value: weeklyValue
    });
  }

  logSystem('Report', 'Weekly report generated');
}

/**
 * Send weekly report email
 */
function sendWeeklyReportEmail(metrics) {
  const email = getConfigValue('ALERT_EMAIL', '');
  if (!email) return;

  const subject = `CarHawk Weekly Report - ${new Date().toLocaleDateString()}`;
  const body = `
CarHawk Ultimate Weekly Report
==============================

New Leads This Week: ${metrics.leads}
Hot Deals: ${metrics.hot}
Pipeline Value: ${formatCurrency(metrics.value)}

View Dashboard: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}

---
CarHawk Ultimate v${CARHAWK_VERSION}
  `;

  try {
    MailApp.sendEmail(email, subject, body);
    logSystem('Email', `Weekly report sent to ${email}`);
  } catch (error) {
    logSystem('Email Error', error.toString());
  }
}

/**
 * Generate monthly analysis
 */
function generateMonthlyAnalysis() {
  SpreadsheetApp.getUi().alert('Monthly analysis will be generated. This may take a moment...');
  generateDashboard(); // For now, same as dashboard
  logSystem('Report', 'Monthly analysis generated');
}

// ============================================================================
// HTML TEMPLATES
// ============================================================================

/**
 * Add deal sidebar HTML
 */
function getAddDealSidebarHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: Arial, sans-serif; padding: 10px; }
    .form-group { margin-bottom: 12px; }
    label { display: block; font-weight: bold; margin-bottom: 4px; font-size: 12px; }
    input, select, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px; }
    button:hover { background: #1557b0; }
    .success { color: green; padding: 10px; background: #e8f5e9; border-radius: 4px; }
    .error { color: red; padding: 10px; background: #ffebee; border-radius: 4px; }
    h3 { margin-top: 0; color: #333; }
  </style>
</head>
<body>
  <h3>🚗 Add New Deal</h3>

  <div id="message"></div>

  <form id="dealForm">
    <div class="form-group">
      <label>Year *</label>
      <input type="text" id="year" required placeholder="2020">
    </div>
    <div class="form-group">
      <label>Make *</label>
      <input type="text" id="make" required placeholder="Toyota">
    </div>
    <div class="form-group">
      <label>Model *</label>
      <input type="text" id="model" required placeholder="Camry">
    </div>
    <div class="form-group">
      <label>Mileage</label>
      <input type="text" id="mileage" placeholder="85000">
    </div>
    <div class="form-group">
      <label>Condition</label>
      <select id="condition">
        <option value="Unknown">Unknown</option>
        <option value="Excellent">Excellent</option>
        <option value="Very Good">Very Good</option>
        <option value="Good">Good</option>
        <option value="Fair">Fair</option>
        <option value="Poor">Poor</option>
        <option value="Parts Only">Parts Only</option>
      </select>
    </div>
    <div class="form-group">
      <label>Title Status</label>
      <select id="titleStatus">
        <option value="Unknown">Unknown</option>
        <option value="Clean">Clean</option>
        <option value="Rebuilt">Rebuilt</option>
        <option value="Salvage">Salvage</option>
        <option value="No Title">No Title</option>
      </select>
    </div>
    <div class="form-group">
      <label>Asking Price *</label>
      <input type="text" id="askingPrice" required placeholder="12500">
    </div>
    <div class="form-group">
      <label>Location / ZIP</label>
      <input type="text" id="location" placeholder="St. Louis, MO 63101">
    </div>
    <div class="form-group">
      <label>Seller Name</label>
      <input type="text" id="sellerName" placeholder="John Smith">
    </div>
    <div class="form-group">
      <label>Seller Phone</label>
      <input type="text" id="sellerPhone" placeholder="314-555-0123">
    </div>
    <div class="form-group">
      <label>Seller Email</label>
      <input type="email" id="sellerEmail" placeholder="seller@email.com">
    </div>
    <div class="form-group">
      <label>Notes</label>
      <textarea id="notes" rows="3" placeholder="Any additional notes..."></textarea>
    </div>

    <button type="submit">Add Deal</button>
  </form>

  <script>
    document.getElementById('dealForm').addEventListener('submit', function(e) {
      e.preventDefault();

      const formData = {
        year: document.getElementById('year').value,
        make: document.getElementById('make').value,
        model: document.getElementById('model').value,
        mileage: document.getElementById('mileage').value,
        condition: document.getElementById('condition').value,
        titleStatus: document.getElementById('titleStatus').value,
        askingPrice: document.getElementById('askingPrice').value,
        location: document.getElementById('location').value,
        sellerName: document.getElementById('sellerName').value,
        sellerPhone: document.getElementById('sellerPhone').value,
        sellerEmail: document.getElementById('sellerEmail').value,
        notes: document.getElementById('notes').value
      };

      document.getElementById('message').innerHTML = '<p>Adding deal...</p>';

      google.script.run
        .withSuccessHandler(function(result) {
          if (result.success) {
            document.getElementById('message').innerHTML =
              '<div class="success">Deal added successfully! ID: ' + result.id + '</div>';
            document.getElementById('dealForm').reset();
          } else {
            document.getElementById('message').innerHTML =
              '<div class="error">Error: ' + result.error + '</div>';
          }
        })
        .withFailureHandler(function(error) {
          document.getElementById('message').innerHTML =
            '<div class="error">Error: ' + error.message + '</div>';
        })
        .addDealManually(formData);
    });
  </script>
</body>
</html>
  `;
}

/**
 * System settings HTML
 */
function getSystemSettingsHTML() {
  const originZip = getConfigValue('ORIGIN_ZIP', ORIGIN_ZIP);
  const openaiKey = getConfigValue('OPENAI_API_KEY', '') ? '••••••••' : '';
  const smsitKey = getConfigValue('SMSIT_API_KEY', '') ? '••••••••' : '';
  const companyhubKey = getConfigValue('COMPANYHUB_API_KEY', '') ? '••••••••' : '';
  const mapsKey = getConfigValue('GOOGLE_MAPS_API_KEY', '') ? '••••••••' : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: Arial, sans-serif; padding: 15px; }
    h3 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; font-weight: bold; margin-bottom: 4px; }
    input { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
    button { background: #1a73e8; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px; }
    button:hover { background: #1557b0; }
    .section { margin-bottom: 25px; }
    .hint { font-size: 11px; color: #666; margin-top: 2px; }
    #message { margin-top: 15px; padding: 10px; border-radius: 4px; }
    .success { background: #e8f5e9; color: green; }
  </style>
</head>
<body>
  <h3>⚙️ System Settings</h3>

  <div id="message"></div>

  <div class="section">
    <h4>📍 Location</h4>
    <div class="form-group">
      <label>Origin ZIP Code</label>
      <input type="text" id="originZip" value="${originZip}" maxlength="5">
      <div class="hint">Your base location for distance calculations</div>
    </div>
  </div>

  <div class="section">
    <h4>🔑 API Keys</h4>
    <div class="form-group">
      <label>OpenAI API Key</label>
      <input type="password" id="openaiKey" placeholder="${openaiKey || 'Not configured'}">
    </div>
    <div class="form-group">
      <label>SMS-iT API Key</label>
      <input type="password" id="smsitKey" placeholder="${smsitKey || 'Not configured'}">
    </div>
    <div class="form-group">
      <label>CompanyHub API Key</label>
      <input type="password" id="companyhubKey" placeholder="${companyhubKey || 'Not configured'}">
    </div>
    <div class="form-group">
      <label>Google Maps API Key</label>
      <input type="password" id="mapsKey" placeholder="${mapsKey || 'Not configured'}">
    </div>
  </div>

  <button onclick="saveSettings()">Save Settings</button>
  <button onclick="google.script.host.close()" style="background: #666;">Close</button>

  <script>
    function saveSettings() {
      const settings = {
        originZip: document.getElementById('originZip').value,
        openaiKey: document.getElementById('openaiKey').value,
        smsitKey: document.getElementById('smsitKey').value,
        companyhubKey: document.getElementById('companyhubKey').value,
        mapsKey: document.getElementById('mapsKey').value
      };

      google.script.run
        .withSuccessHandler(function() {
          document.getElementById('message').innerHTML =
            '<div class="success">Settings saved successfully!</div>';
        })
        .withFailureHandler(function(error) {
          document.getElementById('message').innerHTML =
            '<div style="background:#ffebee;color:red;">Error: ' + error.message + '</div>';
        })
        .saveSystemSettings(settings);
    }
  </script>
</body>
</html>
  `;
}

/**
 * Save system settings from sidebar
 */
function saveSystemSettings(settings) {
  if (settings.originZip) {
    setConfigValue('ORIGIN_ZIP', settings.originZip);
  }
  if (settings.openaiKey && !settings.openaiKey.includes('•')) {
    setConfigValue('OPENAI_API_KEY', settings.openaiKey);
  }
  if (settings.smsitKey && !settings.smsitKey.includes('•')) {
    setConfigValue('SMSIT_API_KEY', settings.smsitKey);
  }
  if (settings.companyhubKey && !settings.companyhubKey.includes('•')) {
    setConfigValue('COMPANYHUB_API_KEY', settings.companyhubKey);
  }
  if (settings.mapsKey && !settings.mapsKey.includes('•')) {
    setConfigValue('GOOGLE_MAPS_API_KEY', settings.mapsKey);
  }

  logSystem('Settings', 'System settings updated');
}

/**
 * Help HTML
 */
function getHelpHTML() {
  return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
    h2 { color: #1a73e8; }
    h3 { color: #333; margin-top: 20px; }
    ul { padding-left: 20px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
    .section { margin-bottom: 20px; }
  </style>
</head>
<body>
  <h2>🚗 CarHawk Ultimate Help</h2>

  <div class="section">
    <h3>Getting Started</h3>
    <ol>
      <li>Go to <strong>System → System Settings</strong> and configure your API keys</li>
      <li>Set your origin ZIP code for distance calculations</li>
      <li>Import leads from staging sheets or Browse.AI</li>
      <li>Run analysis on your deals</li>
    </ol>
  </div>

  <div class="section">
    <h3>Scoring System</h3>
    <ul>
      <li><strong>Hot</strong>: Score ≥80, Velocity ≥65, Profit ≥18%</li>
      <li><strong>Warm</strong>: Score ≥60, Profit ≥12%</li>
      <li><strong>Cold</strong>: Below thresholds</li>
    </ul>
  </div>

  <div class="section">
    <h3>Strategies</h3>
    <ul>
      <li><strong>Quick Flip</strong>: Fast turnaround, minimal work</li>
      <li><strong>Repair & Resell</strong>: Needs work but good profit potential</li>
      <li><strong>Part Out</strong>: Vehicle in poor condition, sell parts</li>
      <li><strong>Hold/Seasonal</strong>: Wait for better market timing</li>
    </ul>
  </div>

  <div class="section">
    <h3>CRM Integration</h3>
    <p>CarHawk integrates with SMS-iT and CompanyHub for automated outreach.</p>
    <p>Hot deals are automatically queued for contact. Configure API keys in System Settings.</p>
  </div>

  <div class="section">
    <h3>Support</h3>
    <p>Version: ${CARHAWK_VERSION}</p>
    <p>For issues, check the System Logs sheet.</p>
  </div>
</body>
</html>
  `;
}
