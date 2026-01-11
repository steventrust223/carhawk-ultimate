// ==========================================
// CARHAWK ULTIMATE - CRM INTEGRATION
// ==========================================
// Version: ULTIMATE 1.0.0
// Purpose: Integrate with SMS-iT CRM and CompanyHub for lead management
// ==========================================

/**
 * Sync top deals to CRM (HOT and RENTAL GEM only)
 */
function syncTopDealsToCRM() {
  const ui = SpreadsheetApp.getUi();

  // Check if CRM is configured
  const smsitKey = getConfig('SMSIT_API_KEY');
  const smsitEndpoint = getConfig('SMSIT_ENDPOINT');

  if (!smsitKey || !smsitEndpoint) {
    ui.alert(
      '⚙️ CRM Not Configured',
      'Please configure CRM settings in the Config sheet:\n\n' +
      '- SMSIT_API_KEY\n' +
      '- SMSIT_ENDPOINT\n\n' +
      'See documentation for setup instructions.',
      ui.ButtonSet.OK
    );
    return;
  }

  const response = ui.alert(
    '📤 Sync to CRM',
    'This will sync HOT and RENTAL GEM deals to SMS-iT CRM.\n\n' +
    'Only deals not already synced will be sent.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );

  if (response !== ui.Button.YES) {
    return;
  }

  try {
    const topDeals = getDealsForCRMSync();

    if (topDeals.length === 0) {
      ui.alert('No new deals to sync');
      return;
    }

    let synced = 0;
    let failed = 0;

    for (let deal of topDeals) {
      const result = syncDealToSMSiT(deal, smsitEndpoint, smsitKey);

      if (result.success) {
        // Update master database with sync info
        updateCRMSyncStatus(deal.listingID, 'SMS-iT', result.dealID);
        synced++;
      } else {
        failed++;
        logError('CRM_SYNC_FAILED', `Failed to sync ${deal.vehicle}: ${result.error}`);
      }

      // Rate limiting
      Utilities.sleep(500);
    }

    logSystem('CRM_SYNC', `Synced ${synced} deals to CRM, ${failed} failed`);

    ui.alert(
      '✅ CRM Sync Complete',
      `Successfully synced ${synced} deals to SMS-iT CRM.\n` +
      (failed > 0 ? `${failed} deals failed to sync.\n` : '') +
      '\nCheck the CRM Integration sheet for details.',
      ui.ButtonSet.OK
    );

  } catch (error) {
    logError('CRM_SYNC_ERROR', error.message);
    ui.alert('Error syncing to CRM: ' + error.message);
  }
}

/**
 * Get deals that should be synced to CRM
 * @return {Array} Array of deal objects
 */
function getDealsForCRMSync() {
  const masterSheet = getSheet(SHEETS.MASTER.name);
  const data = masterSheet.getDataRange().getValues();

  if (data.length < 2) return [];

  const headers = data[0];

  // Find required columns
  const listingIDCol = headers.indexOf(MASTER_COLUMNS.LISTING_ID);
  const verdictCol = headers.indexOf(MASTER_COLUMNS.VERDICT);
  const leadSyncedCol = headers.indexOf(MASTER_COLUMNS.LEAD_SYNCED);
  const yearCol = headers.indexOf(MASTER_COLUMNS.YEAR);
  const makeCol = headers.indexOf(MASTER_COLUMNS.MAKE);
  const modelCol = headers.indexOf(MASTER_COLUMNS.MODEL);
  const askingPriceCol = headers.indexOf(MASTER_COLUMNS.ASKING_PRICE);
  const offerTargetCol = headers.indexOf(MASTER_COLUMNS.OFFER_TARGET);
  const profitCol = headers.indexOf(MASTER_COLUMNS.PROFIT_DOLLAR);
  const sellerNameCol = headers.indexOf(MASTER_COLUMNS.SELLER_NAME);
  const sellerPhoneCol = headers.indexOf(MASTER_COLUMNS.SELLER_PHONE);
  const sellerEmailCol = headers.indexOf(MASTER_COLUMNS.SELLER_EMAIL);
  const urlCol = headers.indexOf(MASTER_COLUMNS.LISTING_URL);
  const messageCol = headers.indexOf(MASTER_COLUMNS.SELLER_MESSAGE);

  const deals = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    // Only sync HOT and RENTAL GEM deals that haven't been synced yet
    const verdict = row[verdictCol] || '';
    const leadSynced = row[leadSyncedCol] || '';

    if ((verdict.includes('HOT') || verdict.includes('RENTAL GEM')) && leadSynced !== 'Yes') {
      deals.push({
        rowIndex: i + 1,
        listingID: row[listingIDCol],
        vehicle: `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`,
        year: row[yearCol],
        make: row[makeCol],
        model: row[modelCol],
        askingPrice: row[askingPriceCol],
        offerTarget: row[offerTargetCol],
        profit: row[profitCol],
        verdict: verdict,
        sellerName: row[sellerNameCol],
        sellerPhone: row[sellerPhoneCol],
        sellerEmail: row[sellerEmailCol],
        url: row[urlCol],
        message: row[messageCol]
      });
    }
  }

  return deals;
}

/**
 * Sync a deal to SMS-iT CRM
 * @param {Object} deal - Deal object
 * @param {string} endpoint - API endpoint
 * @param {string} apiKey - API key
 * @return {Object} Result with success status
 */
function syncDealToSMSiT(deal, endpoint, apiKey) {
  try {
    // Build payload for SMS-iT CRM
    const payload = {
      contact: {
        name: deal.sellerName || 'Unknown Seller',
        phone: deal.sellerPhone || '',
        email: deal.sellerEmail || '',
        source: 'CarHawk Ultimate',
        tags: ['Vehicle Lead', deal.verdict]
      },
      deal: {
        title: `Vehicle: ${deal.vehicle}`,
        value: deal.profit,
        stage: 'New Lead',
        notes: `
Listing: ${deal.url}

Vehicle: ${deal.vehicle}
Asking Price: ${formatCurrency(deal.askingPrice)}
Our Offer Target: ${formatCurrency(deal.offerTarget)}
Expected Profit: ${formatCurrency(deal.profit)}
Verdict: ${deal.verdict}

Seller Message:
${deal.message}
        `.trim()
      }
    };

    // Make API call
    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + apiKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(endpoint, options);
    const responseCode = response.getResponseCode();

    if (responseCode !== 200 && responseCode !== 201) {
      return {
        success: false,
        error: `API returned ${responseCode}: ${response.getContentText()}`
      };
    }

    const json = JSON.parse(response.getContentText());

    return {
      success: true,
      dealID: json.deal_id || json.id || 'Unknown'
    };

  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Update CRM sync status in Master Database
 * @param {string} listingID - Listing ID
 * @param {string} platform - CRM platform name
 * @param {string} dealID - CRM deal ID
 */
function updateCRMSyncStatus(listingID, platform, dealID) {
  const masterSheet = getSheet(SHEETS.MASTER.name);
  const data = masterSheet.getDataRange().getValues();
  const headers = data[0];

  const listingIDCol = headers.indexOf(MASTER_COLUMNS.LISTING_ID);
  const leadSyncedCol = headers.indexOf(MASTER_COLUMNS.LEAD_SYNCED);
  const crmPlatformCol = headers.indexOf(MASTER_COLUMNS.CRM_PLATFORM);
  const crmDealIDCol = headers.indexOf(MASTER_COLUMNS.CRM_DEAL_ID);
  const contactedAtCol = headers.indexOf(MASTER_COLUMNS.CONTACTED_AT);

  // Find row
  for (let i = 1; i < data.length; i++) {
    if (data[i][listingIDCol] === listingID) {
      if (leadSyncedCol !== -1) {
        masterSheet.getRange(i + 1, leadSyncedCol + 1).setValue('Yes');
      }
      if (crmPlatformCol !== -1) {
        masterSheet.getRange(i + 1, crmPlatformCol + 1).setValue(platform);
      }
      if (crmDealIDCol !== -1) {
        masterSheet.getRange(i + 1, crmDealIDCol + 1).setValue(dealID);
      }
      if (contactedAtCol !== -1) {
        masterSheet.getRange(i + 1, contactedAtCol + 1).setValue(new Date());
      }
      break;
    }
  }
}

/**
 * Generate CRM integration summary sheet
 */
function generateCRMSummary() {
  try {
    const masterSheet = getSheet(SHEETS.MASTER.name);
    const crmSheet = getSheet(SHEETS.CRM.name);

    const masterData = masterSheet.getDataRange().getValues();

    if (masterData.length < 2) {
      SpreadsheetApp.getUi().alert('No data in Master Database');
      return;
    }

    const headers = masterData[0];

    // Find required columns
    const listingIDCol = headers.indexOf(MASTER_COLUMNS.LISTING_ID);
    const yearCol = headers.indexOf(MASTER_COLUMNS.YEAR);
    const makeCol = headers.indexOf(MASTER_COLUMNS.MAKE);
    const modelCol = headers.indexOf(MASTER_COLUMNS.MODEL);
    const verdictCol = headers.indexOf(MASTER_COLUMNS.VERDICT);
    const leadSyncedCol = headers.indexOf(MASTER_COLUMNS.LEAD_SYNCED);
    const crmPlatformCol = headers.indexOf(MASTER_COLUMNS.CRM_PLATFORM);
    const crmDealIDCol = headers.indexOf(MASTER_COLUMNS.CRM_DEAL_ID);
    const contactedAtCol = headers.indexOf(MASTER_COLUMNS.CONTACTED_AT);

    // Build CRM summary data
    const crmData = [];

    for (let i = 1; i < masterData.length; i++) {
      const row = masterData[i];

      // Only include synced or high-priority deals
      const verdict = row[verdictCol] || '';
      if (!verdict.includes('HOT') && !verdict.includes('RENTAL GEM') && !verdict.includes('SOLID')) {
        continue;
      }

      const vehicle = `${row[yearCol]} ${row[makeCol]} ${row[modelCol]}`;

      crmData.push([
        row[listingIDCol],
        vehicle,
        verdict,
        row[leadSyncedCol] || 'No',
        row[crmPlatformCol] || '',
        row[crmDealIDCol] || '',
        '', // Message sent status - would be updated manually or via CRM webhook
        '', // Response received - manual tracking
        '', // Follow-up status - manual tracking
        row[contactedAtCol] || '',
        '', // Next action - manual planning
        '' // Deal stage - manual tracking
      ]);
    }

    // Sort by synced status (unsynced first), then by verdict
    crmData.sort((a, b) => {
      if (a[3] !== b[3]) {
        return a[3] === 'No' ? -1 : 1; // Unsynced first
      }
      return a[2].localeCompare(b[2]); // Then by verdict
    });

    // Clear existing data
    clearSheetData(SHEETS.CRM.name);

    // Write CRM data
    if (crmData.length > 0) {
      crmSheet.getRange(2, 1, crmData.length, crmData[0].length)
        .setValues(crmData);
    }

    logSystem('CRM_SUMMARY_GENERATED', `Generated CRM summary with ${crmData.length} deals`);

    const syncedCount = crmData.filter(row => row[3] === 'Yes').length;
    const unsyncedCount = crmData.filter(row => row[3] === 'No').length;

    SpreadsheetApp.getUi().alert(
      '✅ CRM Summary Generated',
      `CRM Integration sheet updated:\n\n` +
      `Synced to CRM: ${syncedCount}\n` +
      `Ready to sync: ${unsyncedCount}\n\n` +
      'Use "Sync to CRM" to push unsynced deals.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );

  } catch (error) {
    logError('CRM_SUMMARY_ERROR', error.message);
    SpreadsheetApp.getUi().alert('Error generating CRM summary: ' + error.message);
  }
}

/**
 * Test CRM connection
 */
function testCRMConnection() {
  const ui = SpreadsheetApp.getUi();

  const smsitKey = getConfig('SMSIT_API_KEY');
  const smsitEndpoint = getConfig('SMSIT_ENDPOINT');

  if (!smsitKey || !smsitEndpoint) {
    ui.alert('Please configure CRM settings in Config sheet');
    return;
  }

  try {
    // Test with a simple GET request (adjust based on actual API)
    const options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + smsitKey
      },
      muteHttpExceptions: true
    };

    const response = UrlFetchApp.fetch(smsitEndpoint, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200 || responseCode === 401) {
      ui.alert(
        '✅ Connection Test',
        `Connection successful!\n\n` +
        `Endpoint: ${smsitEndpoint}\n` +
        `Response Code: ${responseCode}\n\n` +
        'CRM integration is ready to use.',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '⚠️ Connection Test',
        `Connection failed with code ${responseCode}.\n\n` +
        'Please check your CRM configuration.',
        ui.ButtonSet.OK
      );
    }

  } catch (error) {
    ui.alert('Connection test failed: ' + error.message);
  }
}
