// =========================================================
// FILE: quantum-crm-automation.gs - Automation Functions
// =========================================================

function setupCRMTriggers() {
  // Clear existing CRM triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction().includes('CRM') ||
        trigger.getHandlerFunction().includes('process')) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Follow-up processor - every 5 minutes
  ScriptApp.newTrigger('processFollowUps')
    .timeBased()
    .everyMinutes(5)
    .create();

  // Campaign processor - every 10 minutes
  ScriptApp.newTrigger('processCampaigns')
    .timeBased()
    .everyMinutes(10)
    .create();

  // Appointment reminders - every hour
  ScriptApp.newTrigger('processAppointmentReminders')
    .timeBased()
    .everyHours(1)
    .create();
}

function processFollowUps() {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.FOLLOWUPS.name);
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < data.length; i++) {
    const scheduledTime = new Date(data[i][5]);
    const status = data[i][8];

    if (status === 'Scheduled' && scheduledTime <= now) {
      const followUpId = data[i][0];
      const dealId = data[i][1];
      const type = data[i][6];
      const template = data[i][7];

      try {
        if (type === 'SMS') {
          sendFollowUpSMS(dealId, template);
        } else if (type === 'EMAIL') {
          sendFollowUpEmail(dealId, template);
        }

        // Update status
        sheet.getRange(i + 1, 9).setValue('Sent');
        sheet.getRange(i + 1, 10).setValue(new Date());

      } catch (error) {
        sheet.getRange(i + 1, 9).setValue('Failed');
        sheet.getRange(i + 1, 19).setValue(error.toString());

        // Increment retry count
        const retryCount = sheet.getRange(i + 1, 18).getValue() || 0;
        sheet.getRange(i + 1, 18).setValue(retryCount + 1);
      }
    }
  }
}

function processCampaigns() {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.CAMPAIGNS.name);
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < data.length; i++) {
    const scheduledTime = new Date(data[i][9]);
    const status = data[i][10];

    if (status === 'Scheduled' && scheduledTime <= now) {
      const touchId = data[i][0];
      const dealId = data[i][2];
      const type = data[i][5];
      const message = data[i][8];
      const subject = data[i][7];

      try {
        const deal = getDealById(dealId);
        if (!deal) continue;

        if (type === 'SMS' && deal.sellerPhone) {
          sendCampaignSMS(deal.sellerPhone, message);
          logSMSConversation(dealId, deal.sellerPhone, message, 'OUTBOUND');
        } else if (type === 'EMAIL' && deal.sellerEmail) {
          sendCampaignEmail(deal.sellerEmail, subject, message);
          incrementContactCount(dealId, 'EMAIL');
        }

        // Update status
        sheet.getRange(i + 1, 11).setValue('Sent');
        sheet.getRange(i + 1, 12).setValue(new Date());
        sheet.getRange(i + 1, 13).setValue(true); // Delivered

      } catch (error) {
        sheet.getRange(i + 1, 11).setValue('Failed');
        logQuantum('Campaign Error', error.toString());
      }
    }
  }
}

function processAppointmentReminders() {
  const sheet = getQuantumSheet(QUANTUM_SHEETS.APPOINTMENTS.name);
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let i = 1; i < data.length; i++) {
    const scheduledTime = new Date(data[i][6]);
    const reminderSent = data[i][13];
    const status = data[i][10];

    // Send reminder 1 hour before appointment
    const reminderTime = new Date(scheduledTime.getTime() - 60 * 60 * 1000);

    if (!reminderSent && status === 'Scheduled' && now >= reminderTime && now < scheduledTime) {
      const dealId = data[i][1];
      const deal = getDealById(dealId);

      if (deal && deal.sellerPhone) {
        const message = `Reminder: We're scheduled to meet about your ${deal.make} ${deal.model} at ${formatTime(scheduledTime)}. Looking forward to it!`;

        try {
          sendReminderSMS(deal.sellerPhone, message);
          sheet.getRange(i + 1, 14).setValue(true); // Mark reminder sent
          logSMSConversation(dealId, deal.sellerPhone, message, 'OUTBOUND', 'REMINDER');
        } catch (error) {
          logQuantum('Reminder Error', error.toString());
        }
      }
    }
  }
}
