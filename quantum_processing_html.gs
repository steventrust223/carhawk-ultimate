// ============================================================================
// QUANTUM PROCESSING HTML - Processing Dialog Generator
// ============================================================================
// Generates the HTML for the quantum processing/progress dialog.
// ============================================================================

/**
 * Returns the HTML for the quantum processing dialog.
 * Displays a gradient background with a spinning loader,
 * progress bar, and stats text.
 *
 * @param {number} count - The number of items being processed.
 * @return {string} Complete HTML string for the processing dialog.
 */
function getQuantumProcessingHTML(count) {
  var html = '<!DOCTYPE html>'
    + '<html>'
    + '<head>'
    + '<style>'
    + '* { margin: 0; padding: 0; box-sizing: border-box; }'
    + 'body {'
    + '  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;'
    + '  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);'
    + '  min-height: 100vh;'
    + '  display: flex;'
    + '  justify-content: center;'
    + '  align-items: center;'
    + '  flex-direction: column;'
    + '  color: #fff;'
    + '}'
    + '.loader {'
    + '  width: 80px;'
    + '  height: 80px;'
    + '  border: 5px solid rgba(255, 255, 255, 0.2);'
    + '  border-top-color: #fff;'
    + '  border-radius: 50%;'
    + '  animation: spin 1s linear infinite;'
    + '  margin-bottom: 30px;'
    + '}'
    + '@keyframes spin { to { transform: rotate(360deg); } }'
    + 'h1 {'
    + '  font-size: 24px;'
    + '  font-weight: bold;'
    + '  margin-bottom: 20px;'
    + '  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);'
    + '}'
    + '.progress-container {'
    + '  width: 400px;'
    + '  max-width: 90%;'
    + '  background: rgba(255, 255, 255, 0.15);'
    + '  border-radius: 20px;'
    + '  padding: 4px;'
    + '  margin-bottom: 20px;'
    + '}'
    + '.progress-bar {'
    + '  height: 24px;'
    + '  border-radius: 16px;'
    + '  background: linear-gradient(90deg, #f093fb, #f5576c, #667eea);'
    + '  background-size: 200% 100%;'
    + '  animation: progressFill 2s ease-in-out infinite;'
    + '  width: 0%;'
    + '  transition: width 0.5s ease;'
    + '}'
    + '@keyframes progressFill {'
    + '  0% { background-position: 0% 50%; }'
    + '  50% { background-position: 100% 50%; }'
    + '  100% { background-position: 0% 50%; }'
    + '}'
    + '.stats {'
    + '  font-size: 16px;'
    + '  color: rgba(255, 255, 255, 0.85);'
    + '  text-align: center;'
    + '}'
    + '</style>'
    + '</head>'
    + '<body>'
    + '  <div class="loader"></div>'
    + '  <h1>Quantum Processing Active</h1>'
    + '  <div class="progress-container">'
    + '    <div class="progress-bar" id="progressBar"></div>'
    + '  </div>'
    + '  <div class="stats" id="statsText">Processing ' + count + ' items...</div>'
    + '</body>'
    + '</html>';

  return html;
}
