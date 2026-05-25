// Email Functions for Meeting Management System

// Send meeting agenda email
function sendAgendaEmail(email, name, meeting) {
  try {
    const settings = getMeetingSettings();
    const orgName = settings.orgName || 'Community';

    const subject = `Meeting Agenda: ${meeting.topic} - ${orgName}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📅 Meeting Agenda</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${orgName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
          <p>Dear ${name},</p>

          <p>We're excited to invite you to our upcoming meeting!</p>

          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📌 Topic:</strong> ${meeting.topic}</p>
            <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${formatMeetingDate(meeting.date)}</p>
            <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${meeting.time}</p>
            <p style="margin: 5px 0;"><strong>📍 Location:</strong> ${meeting.location}</p>
            <p style="margin: 5px 0;"><strong>🎤 Speaker:</strong> ${meeting.speaker}</p>
          </div>

          <h3 style="color: #333;">Meeting Details:</h3>
          <p style="white-space: pre-wrap; color: #555; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${meeting.description}
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            Please mark your calendar and plan to attend. If you have any questions, feel free to reach out.<br>
            Looking forward to seeing you there!
          </p>
        </div>
      </div>
    `;

    GmailApp.sendEmail(email, subject, '', { htmlBody: htmlBody, noReply: true });
    logMeetingAction('Send Agenda Email', `${meeting.id} sent to ${name}`);
  } catch (error) {
    logMeetingAction('Agenda Email Error', `Failed to send to ${email}: ${error.toString()}`);
  }
}

// Send action item reminder
function sendActionItemReminderEmail(ownerName, task, dueDate, settings) {
  try {
    // Get owner email from speakers sheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const speakersSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const speakersData = speakersSheet.getDataRange().getValues();

    let ownerEmail = null;
    for (let i = 1; i < speakersData.length; i++) {
      if (speakersData[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME] === ownerName) {
        ownerEmail = speakersData[i][MEETING_CONFIG.COLUMNS.SPEAKERS.EMAIL];
        break;
      }
    }

    if (!ownerEmail) return;

    const daysUntilDue = Math.floor((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    const orgName = settings.orgName || 'Community';

    const subject = `Action Item Reminder: ${task}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⏰ Action Item Reminder</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${orgName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
          <p>Hi ${ownerName},</p>

          <p>This is a friendly reminder about your action item.</p>

          <div style="background: white; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>📝 Task:</strong> ${task}</p>
            <p style="margin: 5px 0;"><strong>📅 Due Date:</strong> ${formatMeetingDate(dueDate)}</p>
            <p style="margin: 5px 0;"><strong>⏳ Days Until Due:</strong> ${daysUntilDue}</p>
          </div>

          ${daysUntilDue <= 1 ? '<p style="color: #d97706; font-weight: bold;">⚠ This item is due very soon!</p>' : ''}

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            Please ensure this action item is completed by the due date. Contact the meeting organizer if you need assistance.
          </p>
        </div>
      </div>
    `;

    GmailApp.sendEmail(ownerEmail, subject, '', { htmlBody: htmlBody, noReply: true });
    logMeetingAction('Send Action Item Reminder', `${task} reminder sent to ${ownerName}`);
  } catch (error) {
    logMeetingAction('Action Item Email Error', error.toString());
  }
}

// Send meeting minutes to attendees
function sendMeetingMinutesEmail(meetingId) {
  try {
    const minutes = getMeetingMinutes(meetingId);
    if (!minutes) return { success: false, error: 'Minutes not found' };

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const scheduleData = scheduleSheet.getDataRange().getValues();

    const speakersSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const speakersData = speakersSheet.getDataRange().getValues();

    const settings = getMeetingSettings();
    const orgName = settings.orgName || 'Community';

    // Find meeting details
    let meeting = null;
    for (let i = 1; i < scheduleData.length; i++) {
      if (scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID] === meetingId) {
        meeting = {
          date: scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DATE],
          topic: scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TOPIC_TITLE],
          speaker: scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.PRIMARY_SPEAKER]
        };
        break;
      }
    }

    if (!meeting) return { success: false, error: 'Meeting not found' };

    const subject = `Meeting Minutes: ${meeting.topic} - ${formatMeetingDate(meeting.date)}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📝 Meeting Minutes</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${orgName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Topic:</strong> ${meeting.topic}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formatMeetingDate(meeting.date)}</p>
            <p style="margin: 5px 0;"><strong>Speaker:</strong> ${meeting.speaker}</p>
          </div>

          <h3 style="color: #333;">Key Discussion Points:</h3>
          <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${minutes.keyPoints || 'N/A'}
          </p>

          ${minutes.decisions ? `
          <h3 style="color: #333;">Decisions Made:</h3>
          <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${minutes.decisions}
          </p>
          ` : ''}

          ${minutes.actionItems ? `
          <h3 style="color: #333;">Action Items:</h3>
          <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">
${minutes.actionItems}
          </p>
          ` : ''}

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            These minutes are in draft status. Please review and provide feedback.<br>
            Status: ${minutes.status}
          </p>
        </div>
      </div>
    `;

    let sentCount = 0;
    for (let i = 1; i < speakersData.length; i++) {
      const email = speakersData[i][MEETING_CONFIG.COLUMNS.SPEAKERS.EMAIL];
      const name = speakersData[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME];

      if (email) {
        GmailApp.sendEmail(email, subject, '', { htmlBody: htmlBody, noReply: true });
        sentCount++;
      }
    }

    logMeetingAction('Send Minutes Email', `${meetingId} minutes sent to ${sentCount} recipients`);
    return { success: true, sentCount: sentCount };
  } catch (error) {
    logMeetingAction('Minutes Email Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get meeting settings
function getMeetingSettings() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SETTINGS);
    if (!settingsSheet) {
      return {
        orgName: 'Community',
        meetingTime: '7:00 PM',
        defaultLocation: 'Community Hall',
        reminderTemplate: ''
      };
    }

    const data = settingsSheet.getDataRange().getValues();
    const settings = {};

    for (let i = 0; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }

    return {
      orgName: settings['Organization Name'] || 'Community',
      meetingTime: settings['Default Meeting Time'] || '7:00 PM',
      defaultLocation: settings['Default Location'] || 'Community Hall',
      reminderTemplate: settings['Reminder Template'] || '',
      adminEmail: settings['Admin Email'] || ''
    };
  } catch (e) {
    return {
      orgName: 'Community',
      meetingTime: '7:00 PM',
      defaultLocation: 'Community Hall',
      reminderTemplate: ''
    };
  }
}

// Test email configuration
function testMeetingEmailConfiguration() {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    const subject = 'Meeting Management System - Email Test';
    const htmlBody = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>✓ Email Configuration Test Successful!</h2>
        <p>This email confirms that your Meeting Management System email automation is properly configured.</p>
        <p><strong>System Email:</strong> ${userEmail}</p>
        <p><strong>Test Date/Time:</strong> ${new Date()}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated test message. If you received this, your email setup is working correctly.
        </p>
      </div>
    `;

    GmailApp.sendEmail(userEmail, subject, '', { htmlBody: htmlBody });

    logMeetingAction('Email Test', 'Test email sent successfully to ' + userEmail);
    return { success: true, message: 'Test email sent to ' + userEmail };
  } catch (error) {
    logMeetingAction('Email Test Error', error.toString());
    return { success: false, error: error.toString() };
  }
}
