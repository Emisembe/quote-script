// Community Management System - Main Code
// This is the entry point for the membership management system

const CONFIG = {
  SHEET_NAMES: {
    MEMBERS: 'Members',
    CONTRIBUTIONS: 'Contributions',
    EVENTS: 'Events',
    PAYMENTS: 'Payments',
    SETTINGS: 'Settings',
    LOGS: 'Logs',
    ARCHIVE_PREFIX: 'Archive_'
  },
  COLUMNS: {
    MEMBERS: {
      MEMBER_ID: 0,
      FULL_NAME: 1,
      PHONE: 2,
      EMAIL: 3,
      STATUS: 4,
      JOIN_DATE: 5,
      GROUP: 6,
      NOTES: 7
    },
    CONTRIBUTIONS: {
      MEMBER_ID: 0,
      MEMBER_NAME: 1,
      CONTRIBUTION_TYPE: 2,
      AMOUNT_DUE: 3,
      AMOUNT_PAID: 4,
      PAYMENT_STATUS: 5,
      DUE_DATE: 6,
      PAYMENT_DATE: 7,
      BALANCE: 8
    }
  }
};

// Initialize custom menu when spreadsheet opens
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Community Management')
    .addItem('📝 Send Contribution Reminders', 'menuSendReminders')
    .addSeparator()
    .addItem('📧 Send Event Notifications', 'menuSendEventNotification')
    .addSeparator()
    .addItem('✅ Mark Payment as Paid', 'menuMarkPaymentPaid')
    .addItem('📊 Generate Payment Report', 'menuGeneratePaymentReport')
    .addSeparator()
    .addItem('📆 Create New Year Sheet', 'menuCreateNewYearSheet')
    .addItem('🗂️ Archive Previous Year', 'menuArchiveYear')
    .addSeparator()
    .addItem('🔄 Sync Member Records', 'menuSyncMembers')
    .addItem('🎫 Generate Member IDs', 'menuGenerateMemberIDs')
    .addSeparator()
    .addItem('📧 Send Welcome Emails', 'menuSendWelcomeEmails')
    .addSeparator()
    .addItem('⚙️ Setup & Documentation', 'menuShowDocumentation')
    .addToUi();
}

// Menu action: Send contribution reminders
function menuSendReminders() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Send reminders for members with status:\n(Type: UNPAID or ALL)', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const status = response.getResponseText().toUpperCase();
    const count = sendContributionReminders(status);
    ui.alert(`Reminder emails sent to ${count} members.`);
  }
}

// Menu action: Send event notifications
function menuSendEventNotification() {
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      label { display: block; margin: 10px 0; }
      input, textarea { width: 100%; padding: 8px; margin: 5px 0; }
      button { padding: 10px 20px; background: #4285F4; color: white; border: none; cursor: pointer; }
      button:hover { background: #357AE8; }
    </style>
    <h2>Send Event Notification</h2>
    <form>
      <label>Event Title:
        <input type="text" id="title" placeholder="e.g., Monthly Meeting" required>
      </label>
      <label>Event Date:
        <input type="date" id="date" required>
      </label>
      <label>Event Time:
        <input type="time" id="time" required>
      </label>
      <label>Event Details:
        <textarea id="details" placeholder="Event description..." rows="4" required></textarea>
      </label>
      <label>Send to:
        <select id="recipients" required>
          <option value="all">All Members</option>
          <option value="paid">Paid Members Only</option>
          <option value="unpaid">Unpaid Members Only</option>
        </select>
      </label>
      <button onclick="sendEvent()">Send Notifications</button>
    </form>
    <script>
      function sendEvent() {
        const title = document.getElementById('title').value;
        const date = document.getElementById('date').value;
        const time = document.getElementById('time').value;
        const details = document.getElementById('details').value;
        const recipients = document.getElementById('recipients').value;
        google.script.run.sendEventNotificationFromUI(title, date, time, details, recipients, function(result) {
          alert('Event notifications sent to ' + result + ' members');
          google.script.host.close();
        });
      }
    </script>
  `);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Send Event Notification');
}

// Menu action: Mark payment as paid
function menuMarkPaymentPaid() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);
  const ui = SpreadsheetApp.getUi();

  const response = ui.prompt('Enter Member ID to mark as paid:', ui.ButtonSet.OK_CANCEL);
  if (response.getSelectedButton() === ui.Button.OK) {
    const memberId = response.getResponseText();
    const data = sheet.getDataRange().getValues();
    let found = false;

    for (let i = 1; i < data.length; i++) {
      if (data[i][CONFIG.COLUMNS.CONTRIBUTIONS.MEMBER_ID] == memberId) {
        const row = i + 1;
        const amountDue = data[i][CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_DUE];

        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.AMOUNT_PAID + 1).setValue(amountDue);
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_STATUS + 1).setValue('PAID');
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.PAYMENT_DATE + 1).setValue(new Date());
        sheet.getRange(row, CONFIG.COLUMNS.CONTRIBUTIONS.BALANCE + 1).setValue(0);

        logAction(`Payment Marked Paid`, `Member ID: ${memberId}, Amount: ${amountDue}`);
        found = true;
        break;
      }
    }

    if (found) {
      ui.alert('Payment marked as paid successfully.');
      sendPaymentConfirmationEmail(memberId);
    } else {
      ui.alert('Member ID not found.');
    }
  }
}

// Menu action: Generate payment report
function menuGeneratePaymentReport() {
  const report = generatePaymentReport();
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; background: #f5f5f5; }
      h2 { color: #1f2937; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      th { background: #4285F4; color: white; padding: 12px; text-align: left; }
      td { border-bottom: 1px solid #ddd; padding: 10px; }
      tr:hover { background: #f9f9f9; }
      .paid { color: #22c55e; font-weight: bold; }
      .unpaid { color: #ef4444; font-weight: bold; }
      .summary { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
    <h2>Payment Report - ${new Date().toLocaleDateString()}</h2>
    <div class="summary">
      <p><strong>Total Members:</strong> ${report.totalMembers}</p>
      <p><strong>Paid Members:</strong> <span class="paid">${report.paidCount}</span></p>
      <p><strong>Unpaid Members:</strong> <span class="unpaid">${report.unpaidCount}</span></p>
      <p><strong>Total Amount Due:</strong> ${report.totalDue}</p>
      <p><strong>Total Amount Paid:</strong> ${report.totalPaid}</p>
      <p><strong>Total Outstanding:</strong> ${report.totalOutstanding}</p>
    </div>
    ${report.html}
  `);
  ui.showModalDialog(htmlOutput, 'Payment Report');
}

// Menu action: Create new year sheet
function menuCreateNewYearSheet() {
  const ui = SpreadsheetApp.getUi();
  const year = new Date().getFullYear() + 1;
  const response = ui.alert(
    `Create new contribution sheet for ${year}?`,
    ui.ButtonSet.YES_NO
  );

  if (response === ui.Button.YES) {
    createNewYearSheet(year);
    ui.alert(`New contribution sheet created for ${year}`);
  }
}

// Menu action: Archive previous year
function menuArchiveYear() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Enter year to archive (e.g., 2024):', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const year = response.getResponseText();
    archiveYearSheet(year);
    ui.alert(`Year ${year} archived successfully`);
  }
}

// Menu action: Sync member records
function menuSyncMembers() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Sync member records from form submissions?', ui.ButtonSet.YES_NO);

  if (response === ui.Button.YES) {
    processPendingFormSubmissions();
    ui.alert('Member records synchronized');
  }
}

// Menu action: Generate member IDs
function menuGenerateMemberIDs() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Generate member IDs for members without IDs?', ui.ButtonSet.YES_NO);

  if (response === ui.Button.YES) {
    const count = generateMissingMemberIDs();
    ui.alert(`Generated ${count} member IDs`);
  }
}

// Menu action: Send welcome emails
function menuSendWelcomeEmails() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Send welcome emails to new members without welcome email sent?', ui.ButtonSet.YES_NO);

  if (response === ui.Button.YES) {
    const count = sendPendingWelcomeEmails();
    ui.alert(`Welcome emails sent to ${count} members`);
  }
}

// Menu action: Show documentation
function menuShowDocumentation() {
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 30px; max-width: 900px; margin: 0 auto; line-height: 1.6; }
      h1 { color: #1f2937; border-bottom: 3px solid #4285F4; padding-bottom: 10px; }
      h2 { color: #374151; margin-top: 30px; }
      h3 { color: #6b7280; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
      .feature-box { background: #f0f9ff; border-left: 4px solid #4285F4; padding: 15px; margin: 15px 0; }
      .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; }
      ul { padding-left: 20px; }
      li { margin: 8px 0; }
    </style>
    <h1>📘 Community Management System - Quick Start Guide</h1>

    <h2>✨ Features</h2>
    <ul>
      <li>Automated member registration via Google Forms</li>
      <li>Unique member ID generation</li>
      <li>Contribution tracking and reminders</li>
      <li>Payment confirmation emails</li>
      <li>Event notifications</li>
      <li>Annual archiving and new year setup</li>
      <li>Comprehensive reporting</li>
      <li>Activity logging</li>
    </ul>

    <h2>🚀 Getting Started</h2>
    <div class="feature-box">
      <h3>1. Setup Your Spreadsheet</h3>
      <p>Create sheets named: Members, Contributions, Events, Payments, Settings, Logs</p>
      <p>See SPREADSHEET_SETUP.md for detailed structure</p>
    </div>

    <div class="feature-box">
      <h3>2. Create a Google Form</h3>
      <p>Create a form for member registration with fields like Name, Email, Phone, etc.</p>
      <p>Link the form to your spreadsheet in the Contributions sheet</p>
    </div>

    <div class="feature-box">
      <h3>3. Setup Automated Triggers</h3>
      <p>Use Extensions > Apps Script Triggers to set up:</p>
      <ul>
        <li>Daily reminder checks</li>
        <li>Form submission processing</li>
        <li>Scheduled reports</li>
      </ul>
    </div>

    <h2>⚠️ Important Notes</h2>
    <div class="warning">
      <ul>
        <li>Ensure "Display name and email address" is enabled in project settings</li>
        <li>Grant necessary permissions when prompted</li>
        <li>Test emails with your own address first</li>
        <li>Keep the spreadsheet organized and don't delete system sheets</li>
      </ul>
    </div>

    <h2>📞 Support</h2>
    <p>For issues or questions, refer to the DEPLOYMENT.md file for detailed setup instructions.</p>
  `);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'System Documentation');
}

// Generate missing member IDs
function generateMissingMemberIDs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();
  let count = 0;

  for (let i = 1; i < data.length; i++) {
    if (!data[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID]) {
      const memberId = `MEM-${String(i).padStart(4, '0')}`;
      sheet.getRange(i + 1, CONFIG.COLUMNS.MEMBERS.MEMBER_ID + 1).setValue(memberId);
      count++;
    }
  }

  logAction('Generate Member IDs', `Generated ${count} member IDs`);
  return count;
}

// Send pending welcome emails
function sendPendingWelcomeEmails() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();
  let count = 0;

  const hasWelcomeColumn = data[0].length > 8; // Check if welcome email column exists

  for (let i = 1; i < data.length; i++) {
    const memberId = data[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID];
    const name = data[i][CONFIG.COLUMNS.MEMBERS.FULL_NAME];
    const email = data[i][CONFIG.COLUMNS.MEMBERS.EMAIL];

    if (email && memberId && (!hasWelcomeColumn || !data[i][8])) {
      sendWelcomeEmail(name, email, memberId);
      if (hasWelcomeColumn) {
        sheet.getRange(i + 1, 9).setValue(new Date());
      }
      count++;
    }
  }

  logAction('Send Welcome Emails', `Sent ${count} welcome emails`);
  return count;
}

// Log actions in the Logs sheet
function logAction(action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LOGS);

    if (!logsSheet) {
      logsSheet = ss.insertSheet(CONFIG.SHEET_NAMES.LOGS);
      logsSheet.appendRow(['Timestamp', 'Action', 'Details', 'User']);
    }

    const user = Session.getEffectiveUser().getEmail();
    logsSheet.appendRow([new Date(), action, details, user]);
  } catch (e) {
    // Fail silently to not interrupt the main function
    console.log('Error logging action: ' + e.toString());
  }
}
