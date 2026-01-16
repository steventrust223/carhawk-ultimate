// FILE: quantum-testing.gs - Testing Functions
// =========================================================

function testCRMFunctions() {
  // Test appointment scheduling
  const testDealId = createTestDeal();
  
  const appointmentId = scheduleAppointment(testDealId, {
    scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    location: '123 Test St, St. Louis, MO',
    type: 'Viewing',
    notes: 'Test appointment'
  });
  
  console.log('Test appointment created:', appointmentId);
  
  // Test SMS logging
  const smsId = logSMSConversation(
    testDealId,
    '555-123-4567',
    'Test SMS message',
    'OUTBOUND',
    'TEST'
  );
  
  console.log('Test SMS logged:', smsId);
  
  // Test follow-up sequence
  const campaignId = createFollowUpSequence(testDealId, 'HOT_LEAD');
  
  console.log('Test follow-up sequence created:', campaignId);
  
  SpreadsheetApp.getUi().alert('CRM Test Complete', 
    `Created:\n- Appointment: ${appointmentId}\n- SMS: ${smsId}\n- Campaign: ${campaignId}`,
    SpreadsheetApp.getUi().ButtonSet.OK);
}

function createTestDeal() {
  const dbSheet = getQuantumSheet(QUANTUM_SHEETS.DATABASE.name);
  const dealId = generateQuantumId('TEST');
  
  const testRow = [
    dealId,
    new Date(),
    'Test Platform',
    'Test',
    'High',
    '2020',
    'Honda',
    'Civic',
    'EX',
    '',
    50000,
    'Silver',
    '2020 Honda Civic EX',
    15000,
    'St. Louis, MO',
    '63101',
    10,
    'Low',
    '🟢',
    'Excellent',
    95,
    '',
    0,
    0,
    18000,
    16000,
    3000,
    20,
    'Standard Flip'
  ];
  
  // Pad the row to match column count
  while (testRow.length < 60) {
    testRow.push('');
  }
  
  dbSheet.appendRow(testRow);
  
  return dealId;
}

function simulateInboundSMS() {
  const testResponses = [
    {phone: '555-123-4567', message: 'Yes it\'s still available', dealId: createTestDeal()},
    {phone: '555-234-5678', message: 'Sorry, already sold', dealId: createTestDeal()},
    {phone: '555-345-6789', message: 'Can you do $8000?', dealId: createTestDeal()},
    {phone: '555-456-7890', message: 'When can we meet?', dealId: createTestDeal()}
  ];
  
  testResponses.forEach(response => {
    logSMSConversation(
      response.dealId,
      response.phone,
      response.message,
      'INBOUND'
    );
  });
  
  SpreadsheetApp.getUi().alert('Simulated 4 inbound SMS messages');
}

function simulateCallLog() {
  const dealId = createTestDeal();
  
  const testCall = {
    phoneNumber: '555-123-4567',
    direction: 'INBOUND',
    startTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
    endTime: new Date(),
    duration: 300, // 5 minutes
    transcription: 'Hi, I\'m calling about the Honda Civic you have for sale. Is it still available? Great! I\'d like to come see it tomorrow. What time works for you? How about 2 PM? Perfect, see you then.',
    outcome: 'Appointment Set'
  };
  
  const callId = logAICall(dealId, testCall);
  
  SpreadsheetApp.getUi().alert('Test call logged: ' + callId);
}

function simulateCampaignRun() {
  // Create test deals
  const dealIds = [];
  for (let i = 0; i < 3; i++) {
    dealIds.push(createTestDeal());
  }
  
  // Launch campaign
  const campaignId = launchCampaign(dealIds, 'HOT_LEAD', 'Test Campaign');
  
  SpreadsheetApp.getUi().alert('Test campaign launched: ' + campaignId);
}

function testBrowseAIImport() {
  // Create test Browse.ai integration
  const integrationId = addIntegration({
    provider: 'Browse.ai',
    type: 'Robot',
    name: 'Test Facebook Robot',
    key: 'YOUR_SHEET_ID_HERE', // Replace with actual test sheet ID
    notes: 'Facebook',
    syncFrequency: '60'
  });
  
  SpreadsheetApp.getUi().alert(
    'Browse.ai Test',
    'Test integration created. Replace the sheet ID with your actual Browse.ai export sheet ID.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

// =========================================================
