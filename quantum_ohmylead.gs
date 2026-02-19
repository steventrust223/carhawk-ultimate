// =========================================================
// FILE: quantum-ohmylead.gs - Ohmylead Integration
// =========================================================

function syncOhmyleadAppointments() {
  const webhookUrl = getQuantumSetting('OHMYLEAD_WEBHOOK_URL');
  if (!webhookUrl) {
    logQuantum('Ohmylead Sync', 'Webhook URL not configured');
    return;
  }

  // Get recent appointments
  const appointmentSheet = getQuantumSheet(QUANTUM_SHEETS.APPOINTMENTS.name);
  const data = appointmentSheet.getDataRange().getValues();

  const appointments = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][10] === 'Scheduled' && !data[i][17]) { // Not yet synced
      appointments.push({
        appointmentId: data[i][0],
        dealId: data[i][1],
        vehicle: data[i][2],
        sellerName: data[i][3],
        phone: data[i][4],
        scheduledTime: data[i][6],
        location: data[i][7],
        notes: data[i][12]
      });
    }
  }

  if (appointments.length === 0) return;

  // Send to Ohmylead
  try {
    const response = UrlFetchApp.fetch(webhookUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        source: 'CarHawk Ultimate',
        appointments: appointments
      })
    });

    // Mark as synced
    appointments.forEach(apt => {
      markAppointmentSynced(apt.appointmentId);
    });

    logQuantum('Ohmylead Sync', `Synced ${appointments.length} appointments`);

  } catch (error) {
    logQuantum('Ohmylead Error', error.toString());
  }
}

function receiveOhmyleadBooking(bookingData) {
  // Webhook receiver for Ohmylead bookings
  const appointmentId = scheduleAppointment(bookingData.dealId, {
    scheduledTime: new Date(bookingData.scheduledTime),
    location: bookingData.location,
    locationType: bookingData.locationType || 'In-Person',
    duration: bookingData.duration || 30,
    type: bookingData.type || 'Viewing',
    notes: `Booked via Ohmylead: ${bookingData.notes || ''}`
  });

  // Update deal stage
  updateDealStage(bookingData.dealId, 'APPOINTMENT_SET');

  // Log SMS conversation if booking came from SMS
  if (bookingData.source === 'SMS') {
    logSMSConversation(
      bookingData.dealId,
      bookingData.phone,
      `Appointment confirmed for ${bookingData.scheduledTime}`,
      'INBOUND',
      'APPOINTMENT_CONFIRMATION'
    );
  }

  return appointmentId;
}
