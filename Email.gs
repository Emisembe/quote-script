// Email Automation Functions
// Handles all email communications for the system

// Send contribution reminder emails
function sendContributionReminders(status = 'UNPAID') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();
    let emailsSent = 0;

    // Get sender's email and organization name from settings
    const senderInfo = getEmailSettings();

    for (let i = 1; i < data.length; i++) {
      const paymentStatus = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS];

      // Check if we should send this reminder
      if (status === 'ALL' || paymentStatus === status) {
        const email = getMemberEmail(data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID]);
        if (email) {
          const memberName = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_NAME];
          const amountDue = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE];
          const dueDate = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.DUE_DATE];
          const balance = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE];

          sendReminderEmail(email, memberName, amountDue, dueDate, balance, senderInfo);
          emailsSent++;
        }
      }
    }

    logAction('Send Reminders', `Sent ${emailsSent} contribution reminders`);
    return emailsSent;
  } catch (error) {
    logAction('Send Reminders Error', error.toString());
    console.log('Error sending reminders: ' + error.toString());
    return 0;
  }
}

// Send individual reminder email
function sendReminderEmail(memberEmail, memberName, amount, dueDate, balance, senderInfo) {
  const orgName = senderInfo.orgName || 'Our Community';
  const treasurerEmail = senderInfo.treasurerEmail || 'treasurer@community.org';
  const paymentInfo = senderInfo.paymentInfo || 'Bank details to be provided';

  const subject = `Payment Reminder - ${orgName}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">${orgName}</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Payment Reminder</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
        <p>Dear ${memberName},</p>

        <p>This is a friendly reminder that you have a pending contribution payment.</p>

        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Amount Due:</strong> ${amount}</p>
          <p style="margin: 5px 0;"><strong>Due Date:</strong> ${formatDate(dueDate)}</p>
          <p style="margin: 5px 0;"><strong>Outstanding Balance:</strong> ${balance}</p>
        </div>

        <h3 style="color: #333;">Payment Instructions:</h3>
        <p>${paymentInfo}</p>

        <h3 style="color: #333;">Questions?</h3>
        <p>Please contact our treasurer:</p>
        <p>
          <strong>Email:</strong> <a href="mailto:${treasurerEmail}">${treasurerEmail}</a><br>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #666; font-size: 12px; margin: 0;">
          This is an automated message. Please do not reply to this email.<br>
          Thank you for being part of ${orgName}!
        </p>
      </div>
    </div>
  `;

  try {
    GmailApp.sendEmail(memberEmail, subject, '', {
      htmlBody: htmlBody,
      noReply: true
    });
  } catch (error) {
    logAction('Email Send Error', `Failed to send to ${memberEmail}: ${error.toString()}`);
  }
}

// Send payment confirmation email
function sendPaymentConfirmationEmail(memberId) {
  try {
    const email = getMemberEmail(memberId);
    const memberName = getMemberName(memberId);

    if (!email) return;

    const senderInfo = getEmailSettings();
    const orgName = senderInfo.orgName || 'Our Community';
    const treasurerEmail = senderInfo.treasurerEmail || 'treasurer@community.org';

    // Get payment details
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
    const data = sheet.getDataRange().getValues();
    let paymentAmount = 0;
    let paymentDate = new Date();

    for (let i = 1; i < data.length; i++) {
      if (data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID] == memberId) {
        paymentAmount = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID];
        paymentDate = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_DATE];
        break;
      }
    }

    const subject = `Payment Confirmation - ${orgName}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✓ Payment Confirmed</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${orgName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
          <p>Dear ${memberName},</p>

          <p>Thank you for your payment! We have received your contribution.</p>

          <div style="background: white; padding: 20px; border-left: 4px solid #22c55e; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Amount Paid:</strong> ${paymentAmount}</p>
            <p style="margin: 5px 0;"><strong>Payment Date:</strong> ${formatDate(paymentDate)}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #22c55e; font-weight: bold;">PAID</span></p>
          </div>

          <p>Your payment has been recorded in our system. If you have any questions about this payment, please contact:</p>

          <p>
            <strong>Email:</strong> <a href="mailto:${treasurerEmail}">${treasurerEmail}</a>
          </p>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            Thank you for your support of ${orgName}!
          </p>
        </div>
      </div>
    `;

    GmailApp.sendEmail(email, subject, '', {
      htmlBody: htmlBody,
      noReply: true
    });

    logAction('Payment Confirmation Email', `Sent to ${memberName} (${memberId})`);
  } catch (error) {
    logAction('Email Error', `Failed to send confirmation: ${error.toString()}`);
  }
}

// Send welcome email to new member
function sendWelcomeEmail(memberName, memberEmail, memberId) {
  try {
    const senderInfo = getEmailSettings();
    const orgName = senderInfo.orgName || 'Our Community';
    const orgDescription = senderInfo.orgDescription || 'A member-based community organization';
    const website = senderInfo.website || '';
    const treasurerEmail = senderInfo.treasurerEmail || 'treasurer@community.org';

    const subject = `Welcome to ${orgName}!`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Welcome!</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">You're now a member of ${orgName}</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
          <p>Dear ${memberName},</p>

          <p>Welcome to <strong>${orgName}</strong>! We're excited to have you as part of our community.</p>

          <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Your Member ID:</strong> <code style="background: #f0f0f0; padding: 3px 6px; border-radius: 3px;">${memberId}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 12px; color: #666;">Please keep this ID safe. You'll need it for payments and communications.</p>
          </div>

          <h3 style="color: #333;">What's Next?</h3>
          <ul style="color: #555; line-height: 1.8;">
            <li>Check your email regularly for community updates and event notifications</li>
            <li>Make your contributions on time to keep your membership active</li>
            <li>Participate in community events and activities</li>
          </ul>

          <h3 style="color: #333;">Need Help?</h3>
          <p>If you have any questions about membership, payments, or events, please reach out to:</p>
          <p>
            <strong>Email:</strong> <a href="mailto:${treasurerEmail}">${treasurerEmail}</a>
          </p>

          ${website ? `<p><strong>Website:</strong> <a href="${website}">${website}</a></p>` : ''}

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            ${orgDescription}<br>
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    GmailApp.sendEmail(memberEmail, subject, '', {
      htmlBody: htmlBody,
      noReply: true
    });

    logAction('Welcome Email', `Sent to new member ${memberName} (${memberId})`);
  } catch (error) {
    logAction('Email Error', `Failed to send welcome email: ${error.toString()}`);
  }
}

// Send event notification emails
function sendEventNotificationFromUI(title, date, time, details, recipients) {
  return sendEventNotification(title, date, time, details, recipients);
}

// Send event notification emails
function sendEventNotification(eventTitle, eventDate, eventTime, eventDetails, recipientType = 'all') {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const data = membersSheet.getDataRange().getValues();
    let emailsSent = 0;

    const senderInfo = getEmailSettings();
    const orgName = senderInfo.orgName || 'Our Community';
    const website = senderInfo.website || '';

    for (let i = 1; i < data.length; i++) {
      const memberEmail = data[i][CONFIG.COLUMNS.MEMBERS.EMAIL];
      const memberName = data[i][CONFIG.COLUMNS.MEMBERS.FULL_NAME];
      const memberStatus = data[i][CONFIG.COLUMNS.MEMBERS.STATUS];

      if (!memberEmail || memberStatus !== 'ACTIVE') continue;

      // Check if member should receive this notification
      let shouldSend = false;
      if (recipientType === 'all') {
        shouldSend = true;
      } else if (recipientType === 'paid' || recipientType === 'unpaid') {
        const memberPaymentStatus = getMemberPaymentStatus(data[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID]);
        if (recipientType === 'paid' && memberPaymentStatus === 'PAID') {
          shouldSend = true;
        } else if (recipientType === 'unpaid' && memberPaymentStatus === 'UNPAID') {
          shouldSend = true;
        }
      }

      if (shouldSend) {
        sendEventEmail(memberEmail, memberName, eventTitle, eventDate, eventTime, eventDetails, orgName, website);
        emailsSent++;
      }
    }

    // Save event to Events sheet
    const eventsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.EVENTS);
    if (eventsSheet) {
      eventsSheet.appendRow([eventTitle, eventDate, eventTime, eventDetails, new Date(), emailsSent]);
    }

    logAction('Send Event Notifications', `Sent ${emailsSent} event notifications for "${eventTitle}"`);
    return emailsSent;
  } catch (error) {
    logAction('Event Notification Error', error.toString());
    console.log('Error sending event notifications: ' + error.toString());
    return 0;
  }
}

// Send individual event email
function sendEventEmail(memberEmail, memberName, eventTitle, eventDate, eventTime, eventDetails, orgName, website) {
  const subject = `Event Notification: ${eventTitle} - ${orgName}`;

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">📅 ${eventTitle}</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Upcoming Event</p>
      </div>

      <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
        <p>Dear ${memberName},</p>

        <p>You're invited to an upcoming community event!</p>

        <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>📌 Event:</strong> ${eventTitle}</p>
          <p style="margin: 5px 0;"><strong>📅 Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0;"><strong>🕐 Time:</strong> ${eventTime}</p>
        </div>

        <h3 style="color: #333;">Event Details:</h3>
        <p style="white-space: pre-wrap; color: #555;">${eventDetails}</p>

        <div style="background: #fffbeb; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
          <p style="margin: 0; color: #92400e;"><strong>📝 Note:</strong> Please mark your calendar and plan to attend. More details will be shared as the date approaches.</p>
        </div>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #666; font-size: 12px; margin: 0;">
          ${website ? `Visit our website: <a href="${website}">${website}</a><br>` : ''}
          This is an automated message from ${orgName}.
        </p>
      </div>
    </div>
  `;

  try {
    GmailApp.sendEmail(memberEmail, subject, '', {
      htmlBody: htmlBody,
      noReply: true
    });
  } catch (error) {
    logAction('Event Email Error', `Failed to send to ${memberEmail}: ${error.toString()}`);
  }
}

// Helper functions

function getMemberEmail(memberId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID] == memberId) {
      return data[i][CONFIG.COLUMNS.MEMBERS.EMAIL];
    }
  }
  return null;
}

function getMemberName(memberId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID] == memberId) {
      return data[i][CONFIG.COLUMNS.MEMBERS.FULL_NAME];
    }
  }
  return null;
}

function getMemberPaymentStatus(memberId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID] == memberId) {
      return data[i][CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS];
    }
  }
  return 'UNKNOWN';
}

function getEmailSettings() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    if (!settingsSheet) {
      return {
        orgName: 'Our Community',
        treasurerEmail: '',
        paymentInfo: '',
        orgDescription: '',
        website: ''
      };
    }

    const data = settingsSheet.getDataRange().getValues();
    const settings = {};

    for (let i = 0; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }

    return {
      orgName: settings['Organization Name'] || 'Our Community',
      treasurerEmail: settings['Treasurer Email'] || '',
      paymentInfo: settings['Payment Instructions'] || '',
      orgDescription: settings['Organization Description'] || '',
      website: settings['Website URL'] || ''
    };
  } catch (e) {
    return {
      orgName: 'Our Community',
      treasurerEmail: '',
      paymentInfo: '',
      orgDescription: '',
      website: ''
    };
  }
}

function formatDate(date) {
  if (!date) return 'N/A';
  if (typeof date === 'string') return date;
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy');
}
