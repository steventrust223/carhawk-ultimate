// FILE: quantum-setup-html.gs - Setup HTML Generator
// =========================================================

function getQuantumSetupHTML() {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <base target="_top">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
            color: #ffffff;
            padding: 40px;
            min-height: 100vh;
          }
          
          .quantum-container {
            max-width: 600px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          
          .quantum-header {
            text-align: center;
            margin-bottom: 40px;
          }
          
          .quantum-logo {
            font-size: 60px;
            margin-bottom: 20px;
            animation: pulse 2s infinite;
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          
          h1 {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          
          .version {
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          
          .form-group {
            margin-bottom: 24px;
          }
          
          label {
            display: block;
            font-weight: 500;
            margin-bottom: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
          }
          
          input, select {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            color: #ffffff;
            font-size: 15px;
            transition: all 0.3s ease;
          }
          
          input:focus, select:focus {
            outline: none;
            border-color: #00d2ff;
            background: rgba(255, 255, 255, 0.15);
            box-shadow: 0 0 0 3px rgba(0, 210, 255, 0.2);
          }
          
          input::placeholder {
            color: rgba(255, 255, 255, 0.4);
          }
          
          .help-text {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.5);
            margin-top: 4px;
          }
          
          .quantum-features {
            background: rgba(0, 210, 255, 0.1);
            border: 1px solid rgba(0, 210, 255, 0.3);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }
          
          .feature-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-top: 12px;
          }
          
          .feature-item {
            display: flex;
            align-items: center;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
          }
          
          .feature-icon {
            margin-right: 8px;
            font-size: 16px;
          }
          
          .button-group {
            display: flex;
            gap: 12px;
            margin-top: 40px;
          }
          
          .quantum-button {
            flex: 1;
            padding: 14px 24px;
            border: none;
            border-radius: 8px;
            font-size: 15px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .quantum-button.primary {
            background: linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%);
            color: #ffffff;
          }
          
          .quantum-button.primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0, 210, 255, 0.3);
          }
          
          .quantum-button.secondary {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          
          .quantum-button.secondary:hover {
            background: rgba(255, 255, 255, 0.15);
          }
          
          .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 12, 41, 0.95);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }
          
          .quantum-loader {
            text-align: center;
          }
          
          .loader-animation {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            border: 3px solid rgba(0, 210, 255, 0.2);
            border-top-color: #00d2ff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .loader-text {
            font-size: 16px;
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 8px;
          }
          
          .loader-status {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.5);
          }
          
          .success-message {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
            display: none;
          }
          
          .error-message {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="quantum-container">
          <div class="quantum-header">
            <div class="quantum-logo">🚗⚛️</div>
            <h1>CarHawk Ultimate</h1>
            <div class="version">Quantum CRM Edition</div>
          </div>
          
          <div class="quantum-features">
            <strong>Quantum Features Included:</strong>
            <div class="feature-grid">
              <div class="feature-item">
                <span class="feature-icon">🧠</span>
                <span>AI-Powered Analysis</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📡</span>
                <span>Real-time Market Data</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🎯</span>
                <span>Predictive Scoring</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🚀</span>
                <span>Automated Workflows</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📊</span>
                <span>Advanced Analytics</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">🔔</span>
                <span>Smart Alerts</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">💬</span>
                <span>SMS-iT Integration</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">📅</span>
                <span>Ohmylead Booking</span>
              </div>
            </div>
          </div>
          
          <form id="quantumSetupForm">
            <div class="form-group">
              <label for="businessName">Business Name</label>
              <input type="text" id="businessName" placeholder="Quantum Auto Investments" required>
              <div class="help-text">Your company name for reports and branding</div>
            </div>
            
            <div class="form-group">
              <label for="homeZip">Base Location ZIP</label>
              <input type="text" id="homeZip" value="63101" pattern="[0-9]{5}" required>
              <div class="help-text">Primary location for distance calculations</div>
            </div>
            
            <div class="form-group">
              <label for="openaiKey">OpenAI API Key</label>
              <input type="password" id="openaiKey" placeholder="sk-..." required>
              <div class="help-text">Required for quantum AI analysis</div>
            </div>
            
            <div class="form-group">
              <label for="smsitKey">SMS-iT API Key (Optional)</label>
              <input type="password" id="smsitKey" placeholder="Your SMS-iT key">
              <div class="help-text">For SMS automation and campaigns</div>
            </div>
            
            <div class="form-group">
              <label for="ohmyleadWebhook">Ohmylead Webhook (Optional)</label>
              <input type="url" id="ohmyleadWebhook" placeholder="https://...">
              <div class="help-text">For appointment booking integration</div>
            </div>
            
            <div class="form-group">
              <label for="profitTarget">Minimum Profit Target</label>
              <input type="number" id="profitTarget" value="2000" min="500" required>
              <div class="help-text">Deals below this won't trigger quantum analysis</div>
            </div>
            
            <div class="form-group">
              <label for="analysisDepth">Analysis Depth</label>
              <select id="analysisDepth" required>
                <option value="QUANTUM" selected>Quantum (Maximum Intelligence)</option>
                <option value="ADVANCED">Advanced (Balanced)</option>
                <option value="BASIC">Basic (Fast)</option>
              </select>
              <div class="help-text">Higher depth = better predictions but slower</div>
            </div>
            
            <div class="form-group">
              <label for="alertEmail">Alert Email</label>
              <input type="email" id="alertEmail" placeholder="alerts@yourdomain.com">
              <div class="help-text">Receive instant notifications for hot deals</div>
            </div>
          </form>
          
          <div class="button-group">
            <button class="quantum-button primary" onclick="deployQuantum()">
              Deploy Quantum System
            </button>
            <button class="quantum-button secondary" onclick="google.script.host.close()">
              Cancel
            </button>
          </div>
          
          <div id="successMessage" class="success-message"></div>
          <div id="errorMessage" class="error-message"></div>
        </div>
        
        <div id="loadingOverlay" class="loading-overlay">
          <div class="quantum-loader">
            <div class="loader-animation"></div>
            <div class="loader-text">Initializing Quantum System...</div>
            <div class="loader-status" id="loaderStatus">Preparing quantum cores</div>
          </div>
        </div>
        
        <script>
          let statusMessages = [
            'Preparing quantum cores...',
            'Creating sheet architecture...',
            'Deploying AI models...',
            'Configuring real-time sync...',
            'Building analytics engine...',
            'Establishing CRM connections...',
            'Setting up SMS-iT integration...',
            'Configuring Ohmylead webhooks...',
            'Generating dashboards...',
            'Finalizing quantum setup...'
          ];
          
          let currentStatus = 0;
          
          function updateStatus() {
            if (currentStatus < statusMessages.length) {
              document.getElementById('loaderStatus').textContent = statusMessages[currentStatus];
              currentStatus++;
              setTimeout(updateStatus, 2000);
            }
          }
          
          function deployQuantum() {
            const form = document.getElementById('quantumSetupForm');
            if (!form.checkValidity()) {
              form.reportValidity();
              return;
            }
            
            const config = {
              businessName: document.getElementById('businessName').value,
              homeZip: document.getElementById('homeZip').value,
              openaiKey: document.getElementById('openaiKey').value,
              profitTarget: parseInt(document.getElementById('profitTarget').value),
              analysisDepth: document.getElementById('analysisDepth').value,
              alertEmail: document.getElementById('alertEmail').value,
              smsitKey: document.getElementById('smsitKey').value,
              smsitWebhook: '', // Would be configured separately
              ohmyleadWebhook: document.getElementById('ohmyleadWebhook').value,
              twilioSid: '', // Optional - for fallback SMS
              twilioToken: '',
              twilioPhone: '',
              sendgridKey: '' // Optional - for email campaigns
            };
            
            document.getElementById('loadingOverlay').style.display = 'flex';
            currentStatus = 0;
            updateStatus();
            
            google.script.run
              .withSuccessHandler(handleDeploymentSuccess)
              .withFailureHandler(handleDeploymentError)
              .deployQuantumArchitecture(config);
          }
          
          function handleDeploymentSuccess(result) {
            document.getElementById('loadingOverlay').style.display = 'none';
            
            if (result.success) {
              const successMsg = document.getElementById('successMessage');
              successMsg.innerHTML = \`
                <strong>🎉 Quantum System Deployed!</strong><br>
                <div style="margin-top: 10px; font-size: 14px;">
                  ✓ \${result.stats.sheets} sheets created<br>
                  ✓ \${result.stats.formulas} formulas deployed<br>
                  ✓ \${result.stats.aiModels} AI models initialized<br>
                  ✓ \${result.stats.triggers} automation triggers set<br>
                  ✓ \${result.stats.crmFeatures} CRM features enabled
                </div>
              \`;
              successMsg.style.display = 'block';
              
              setTimeout(() => google.script.host.close(), 5000);
            } else {
              showError(result.message);
            }
          }
          
          function handleDeploymentError(error) {
            document.getElementById('loadingOverlay').style.display = 'none';
            showError(error.message);
          }
          
          function showError(message) {
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.innerHTML = '<strong>⚠️ Deployment Error:</strong><br>' + message;
            errorMsg.style.display = 'block';
          }
        </script>
      </body>
    </html>
  `;
}

// =========================================================
