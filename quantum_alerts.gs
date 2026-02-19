// =========================================================
// FILE: quantum-alerts.gs - Advanced Alert System
// =========================================================

function checkQuantumAlerts(dealData, analysis) {
  const alerts = [];

  // Hot deal alert
  if (analysis.verdict === '🔥 HOT DEAL' && analysis.confidence > 85) {
    alerts.push({
      type: 'HOT_DEAL',
      priority: 'URGENT',
      title: `🔥 HOT DEAL: ${dealData[5]} ${dealData[6]} ${dealData[7]}`,
      message: `Profit potential: $${analysis.profitPotential} | ROI: ${Math.round(dealData[27])}%`,
      actions: ['View Deal', 'Contact Seller', 'Export to CRM']
    });
  }

  // High profit alert
  const profitThreshold = getQuantumSetting('PROFIT_TARGET') || 2000;
  if (analysis.profitPotential > profitThreshold) {
    alerts.push({
      type: 'HIGH_PROFIT',
      priority: 'HIGH',
      title: `💰 High Profit: $${analysis.profitPotential}`,
      message: `${dealData[5]} ${dealData[6]} ${dealData[7]} - ${analysis.flipStrategy}`,
      actions: ['Analyze Further', 'Set Reminder']
    });
  }

  // Quick flip opportunity
  if (analysis.flipStrategy === 'Quick Flip' && analysis.quickSaleProbability > 80) {
    alerts.push({
      type: 'QUICK_FLIP',
      priority: 'MEDIUM',
      title: `⚡ Quick Flip Opportunity`,
      message: `${analysis.quickSaleProbability}% quick sale probability`,
      actions: ['Calculate Timeline', 'Check Inventory']
    });
  }

  // Process alerts
  if (alerts.length > 0) {
    processQuantumAlerts(alerts, dealData, analysis);
  }
}

function processQuantumAlerts(alerts, dealData, analysis) {
  // Log alerts
  const logSheet = getQuantumSheet(QUANTUM_SHEETS.LOGS.name);

  for (const alert of alerts) {
    logSheet.appendRow([
      new Date(),
      'ALERT',
      alert.type,
      alert.priority,
      alert.title,
      Session.getActiveUser().getEmail(),
      dealData[0], // Deal ID
      '', // Duration
      true, // Success
      '', // Error
      JSON.stringify(alert)
    ]);
  }

  // Send real-time notifications if enabled
  if (getQuantumSetting('REALTIME_ALERTS') === 'true') {
    sendQuantumNotifications(alerts, dealData);
  }

  // Update alert queue
  QuantumState.realTimeAlerts.push(...alerts);
}

function sendQuantumNotifications(alerts, dealData) {
  const email = getQuantumSetting('ALERT_EMAIL');
  if (!email) return;

  // Group alerts by priority
  const urgent = alerts.filter(a => a.priority === 'URGENT');

  if (urgent.length > 0) {
    // Send immediate email for urgent alerts
    sendQuantumAlertEmail(urgent, dealData);
  }
}

function sendQuantumAlertEmail(alerts, dealData) {
  const email = getQuantumSetting('ALERT_EMAIL');
  const businessName = getQuantumSetting('BUSINESS_NAME');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .quantum-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .content {
            padding: 30px;
          }
          .alert-card {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
          }
          .alert-card.urgent {
            border-left-color: #e74c3c;
            background: #fee;
          }
          .alert-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
          }
          .alert-message {
            color: #666;
            line-height: 1.6;
          }
          .metrics {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            text-align: center;
          }
          .metric {
            flex: 1;
          }
          .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #667eea;
          }
          .metric-label {
            font-size: 12px;
            color: #999;
            text-transform: uppercase;
            margin-top: 5px;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 20px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚛️ Quantum Alert</h1>
            <div class="quantum-badge">CarHawk Ultimate</div>
          </div>

          <div class="content">
            ${alerts.map(alert => `
              <div class="alert-card ${alert.priority.toLowerCase()}">
                <div class="alert-title">${alert.title}</div>
                <div class="alert-message">${alert.message}</div>
              </div>
            `).join('')}

            <div class="metrics">
              <div class="metric">
                <div class="metric-value">$${dealData[13].toLocaleString()}</div>
                <div class="metric-label">Asking Price</div>
              </div>
              <div class="metric">
                <div class="metric-value">${dealData[16]} mi</div>
                <div class="metric-label">Distance</div>
              </div>
              <div class="metric">
                <div class="metric-value">${dealData[32]} days</div>
                <div class="metric-label">Listed</div>
              </div>
            </div>

            <center>
              <a href="${SpreadsheetApp.getActiveSpreadsheet().getUrl()}" class="cta-button">
                View in CarHawk Ultimate
              </a>
            </center>
          </div>

          <div class="footer">
            ${businessName} • Powered by CarHawk Ultimate Quantum System<br>
            <a href="#" style="color: #667eea;">Manage Alerts</a> •
            <a href="#" style="color: #667eea;">Unsubscribe</a>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    MailApp.sendEmail({
      to: email,
      subject: `⚛️ ${alerts[0].title}`,
      htmlBody: htmlBody
    });
  } catch (error) {
    logQuantum('Email Error', error.toString());
  }
}

function sendQuantumDigest() {
  const alerts = QuantumState.realTimeAlerts;
  if (alerts.length === 0) {
    SpreadsheetApp.getUi().alert('No alerts to send.');
    return;
  }

  // Send digest email
  const email = getQuantumSetting('ALERT_EMAIL');
  if (email) {
    // Format and send alert digest
    sendQuantumAlertEmail(alerts, {});
    logQuantum('Alert Digest', `Sent ${alerts.length} alerts`);
  }

  // Clear sent alerts
  QuantumState.realTimeAlerts = [];
}
