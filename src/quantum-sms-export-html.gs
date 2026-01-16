// FILE: quantum-sms-export-html.gs - SMS Export HTML
// =========================================================

function getQuantumSMSExportHTML(hotDeals) {
  const dealsHTML = hotDeals.map(deal => {
    const d = deal.data;
    return `
      <tr>
        <td><input type="checkbox" class="deal-select" value="${deal.row}" checked></td>
        <td>${d[0]}</td>
        <td>${d[5]} ${d[6]} ${d[7]}</td>
        <td>$${d[13].toLocaleString()}</td>
        <td>${d[27] ? Math.round(d[27]) + '%' : 'N/A'}</td>
        <td>${d[33] || ''}</td>
        <td>${d[34] || ''}</td>
        <td>${d[42]}</td>
      </tr>
    `;
  }).join('');
  
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Google Sans', Arial, sans-serif;
            padding: 20px;
            background: #f5f5f5;
          }
          h2 {
            color: #1a73e8;
            margin-bottom: 20px;
          }
          .export-container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f0f0f0;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #ddd;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #eee;
          }
          tr:hover {
            background: #f9f9f9;
          }
          .campaign-settings {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .form-group {
            margin-bottom: 15px;
          }
          label {
            display: block;
            font-weight: 600;
            margin-bottom: 5px;
            color: #333;
          }
          input[type="text"], textarea, select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 14px;
          }
          textarea {
            min-height: 100px;
            resize: vertical;
          }
          .button-group {
            display: flex;
            gap: 10px;
            margin-top: 20px;
          }
          .btn {
            padding: 10px 24px;
            border: none;
            border-radius: 4px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }
          .btn-primary {
            background: #1a73e8;
            color: white;
          }
          .btn-primary:hover {
            background: #1557b0;
          }
          .btn-secondary {
            background: #f1f3f4;
            color: #5f6368;
          }
          .btn-secondary:hover {
            background: #e8eaed;
          }
          .stats {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-around;
            text-align: center;
          }
          .stat-item {
            flex: 1;
          }
          .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #1a73e8;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
          }
          .message-preview {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            margin-top: 10px;
            font-family: monospace;
            font-size: 13px;
            white-space: pre-wrap;
          }
        </style>
      </head>
      <body>
        <div class="export-container">
          <h2>📱 Export to SMS-iT Campaign</h2>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${hotDeals.length}</div>
              <div class="stat-label">Total Leads</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">$${Math.round(hotDeals.reduce((sum, d) => sum + (d.data[13] || 0), 0)).toLocaleString()}</div>
              <div class="stat-label">Total Value</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${Math.round(hotDeals.reduce((sum, d) => sum + (d.data[27] || 0), 0) / hotDeals.length)}%</div>
              <div class="stat-label">Avg ROI</div>
            </div>
          </div>
          
          <div class="campaign-settings">
            <h3>Campaign Configuration</h3>
            
            <div class="form-group">
              <label for="campaignName">Campaign Name</label>
              <input type="text" id="campaignName" value="Quantum Hot Deals - ${new Date().toLocaleDateString()}">
            </div>
            
            <div class="form-group">
              <label for="messageTemplate">Message Template</label>
              <textarea id="messageTemplate">Hi {name}, I saw your {year} {make} {model} listed for ${price}. I'm a cash buyer and can close quickly. Is it still available? I can meet today if it works for you.</textarea>
              <div class="message-preview" id="messagePreview"></div>
            </div>
            
            <div class="form-group">
              <label for="sendDelay">Send Delay (seconds)</label>
              <select id="sendDelay">
                <option value="0">No delay</option>
                <option value="30" selected>30 seconds</option>
                <option value="60">1 minute</option>
                <option value="300">5 minutes</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="includeAI" checked>
                Include AI-generated seller message
              </label>
            </div>
            
            <div class="form-group">
              <label>
                <input type="checkbox" id="createFollowUps" checked>
                Create follow-up sequences
              </label>
            </div>
          </div>
          
          <h3>Select Leads to Export</h3>
          <table>
            <thead>
              <tr>
                <th width="40">
                  <input type="checkbox" id="selectAll" checked>
                </th>
                <th>Deal ID</th>
                <th>Vehicle</th>
                <th>Price</th>
                <th>ROI</th>
                <th>Seller</th>
                <th>Phone</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              ${dealsHTML}
            </tbody>
          </table>
          
          <div class="button-group">
            <button class="btn btn-primary" onclick="exportToSMS()">
              Export Selected to SMS-iT
            </button>
            <button class="btn btn-secondary" onclick="previewMessages()">
              Preview Messages
            </button>
            <button class="btn btn-secondary" onclick="google.script.host.close()">
              Cancel
            </button>
          </div>
        </div>
        
        <script>
          // Select all functionality
          document.getElementById('selectAll').addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.deal-select');
            checkboxes.forEach(cb => cb.checked = this.checked);
          });
          
          // Update message preview
          function updatePreview() {
            const template = document.getElementById('messageTemplate').value;
            const preview = template
              .replace(/{name}/g, 'John')
              .replace(/{year}/g, '2018')
              .replace(/{make}/g, 'Honda')
              .replace(/{model}/g, 'Civic')
              .replace(/{price}/g, '12,500');
            
            document.getElementById('messagePreview').textContent = 'Preview: ' + preview;
          }
          
          document.getElementById('messageTemplate').addEventListener('input', updatePreview);
          updatePreview();
          
          function exportToSMS() {
            const selected = [];
            document.querySelectorAll('.deal-select:checked').forEach(cb => {
              selected.push(parseInt(cb.value));
            });
            
            if (selected.length === 0) {
              alert('Please select at least one lead.');
              return;
            }
            
            const config = {
              campaignName: document.getElementById('campaignName').value,
              messageTemplate: document.getElementById('messageTemplate').value,
              sendDelay: parseInt(document.getElementById('sendDelay').value),
              includeAI: document.getElementById('includeAI').checked,
              createFollowUps: document.getElementById('createFollowUps').checked,
              selectedRows: selected
            };
            
            google.script.run
              .withSuccessHandler(() => {
                alert('Successfully exported ' + selected.length + ' leads to SMS-iT!');
                google.script.host.close();
              })
              .withFailureHandler(error => {
                alert('Export failed: ' + error.message);
              })
              .processQuantumSMSExport(config);
          }
          
          function previewMessages() {
            const selected = document.querySelectorAll('.deal-select:checked').length;
            alert('Preview: ' + selected + ' personalized messages will be generated based on the template.');
          }
        </script>
      </body>
    </html>
  `;
}

// =========================================================
