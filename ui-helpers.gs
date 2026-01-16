// ================================================================
// UI-HELPERS.GS - Template Include System
// ================================================================
// This file provides the include() function that allows HTML
// templates to load shared components (like UI_Components.html)
// ================================================================

/**
 * Load HTML partial/component by filename
 *
 * Usage in HTML templates:
 *   <?!= include('UI_Components') ?>
 *   <?!= include('Header') ?>
 *
 * @param {string} filename - Name of the HTML file (without .html extension)
 * @return {string} HTML content of the file
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Show a modal dialog
 *
 * @param {string} title - Dialog title
 * @param {string} htmlContent - HTML content (from template function)
 * @param {number} width - Dialog width in pixels
 * @param {number} height - Dialog height in pixels
 */
function showModal(title, htmlContent, width, height) {
  const html = HtmlService.createHtmlOutput(htmlContent)
    .setWidth(width || 600)
    .setHeight(height || 400);

  SpreadsheetApp.getUi().showModalDialog(html, title);
}

/**
 * Show a sidebar
 *
 * @param {string} title - Sidebar title
 * @param {string} htmlContent - HTML content (from template function)
 */
function showSidebar(title, htmlContent) {
  const html = HtmlService.createHtmlOutput(htmlContent)
    .setTitle(title);

  SpreadsheetApp.getUi().showSidebar(html);
}

/**
 * Show a simple alert
 *
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {string} buttonSet - Button set (OK, OK_CANCEL, YES_NO, YES_NO_CANCEL)
 * @return {string} Button clicked
 */
function showAlert(title, message, buttonSet) {
  const ui = SpreadsheetApp.getUi();
  const buttons = buttonSet === 'YES_NO' ? ui.ButtonSet.YES_NO :
                  buttonSet === 'OK_CANCEL' ? ui.ButtonSet.OK_CANCEL :
                  buttonSet === 'YES_NO_CANCEL' ? ui.ButtonSet.YES_NO_CANCEL :
                  ui.ButtonSet.OK;

  const response = ui.alert(title, message, buttons);

  // Return string representation
  if (response === ui.Button.YES) return 'YES';
  if (response === ui.Button.NO) return 'NO';
  if (response === ui.Button.OK) return 'OK';
  if (response === ui.Button.CANCEL) return 'CANCEL';
  if (response === ui.Button.CLOSE) return 'CLOSE';

  return 'UNKNOWN';
}

/**
 * Show a toast notification (bottom-right corner, auto-dismiss)
 *
 * @param {string} message - Toast message
 * @param {string} title - Toast title (optional)
 * @param {number} timeoutSeconds - Auto-dismiss timeout (default 5)
 */
function showToastNotification(message, title, timeoutSeconds) {
  SpreadsheetApp.getActiveSpreadsheet().toast(
    message,
    title || 'CarHawk Ultimate',
    timeoutSeconds || 5
  );
}
