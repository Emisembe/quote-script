// Trigger Management Functions
// Handles automation and scheduled tasks

// Setup all triggers
function setupAllTriggers() {
  try {
    removeAllTriggers();

    // Daily overdue reminder check at 8 AM
    ScriptApp.newTrigger('dailyOverdueReminderCheck')
      .timeBased()
      .atHour(8)
      .everyDays(1)
      .create();

    // Weekly payment report on Monday at 9 AM
    ScriptApp.newTrigger('weeklyPaymentReport')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(9)
      .create();

    // Batch payment processing daily at 5 PM
    ScriptApp.newTrigger('processBatchPayments')
      .timeBased()
      .atHour(17)
      .everyDays(1)
      .create();

    logAction('Trigger Setup', 'All triggers set up successfully');
  } catch (error) {
    logAction('Trigger Setup Error', error.toString());
  }
}

// Remove all existing triggers
function removeAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
}

// Daily overdue reminder check (trigger function)
function dailyOverdueReminderCheck() {
  try {
    const sent = sendOverduePaymentReminders();
    logAction('Scheduled Task: Overdue Reminders', `Checked and sent ${sent} overdue reminders`);
  } catch (error) {
    logAction('Scheduled Task Error: Overdue Reminders', error.toString());
  }
}

// Weekly payment report (trigger function)
function weeklyPaymentReport() {
  try {
    const report = generatePaymentReport();
    const stats = calculatePaymentStats();

    // Send report to admin email (get from settings)
    const adminEmail = getAdminEmail();
    if (adminEmail) {
      sendWeeklyReportEmail(adminEmail, report, stats);
    }

    logAction('Scheduled Task: Weekly Report', 'Weekly payment report generated');
  } catch (error) {
    logAction('Scheduled Task Error: Weekly Report', error.toString());
  }
}

// Send weekly report email
function sendWeeklyReportEmail(adminEmail, report, stats) {
  try {
    const orgName = getEmailSettings().orgName || 'Our Community';

    const subject = `Weekly Payment Report - ${orgName}`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; color: white; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">📊 Weekly Payment Report</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">${new Date().toLocaleDateString()}</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef; border-top: none;">
          <h2 style="color: #333; margin-top: 0;">Summary</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin: 20px 0;">
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #4285F4;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Total Members</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #333;">${stats.totalMembers}</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #22c55e;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Paid</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #22c55e;">${stats.paidCount} (${stats.paidPercentage}%)</p>
            </div>
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #ef4444;">
              <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Outstanding</p>
              <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #ef4444;">${stats.unpaidCount}</p>
            </div>
          </div>

          <h2 style="color: #333;">Financial Summary</h2>
          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <tr style="background: #e3f2fd;">
              <td style="border: 1px solid #ddd; padding: 10px;"><strong>Total Due</strong></td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right;"><strong>${stats.totalDue}</strong></td>
            </tr>
            <tr>
              <td style="border: 1px solid #ddd; padding: 10px;"><strong>Total Paid</strong></td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #22c55e;"><strong>${stats.totalPaid}</strong></td>
            </tr>
            <tr style="background: #fef3c7;">
              <td style="border: 1px solid #ddd; padding: 10px;"><strong>Outstanding Balance</strong></td>
              <td style="border: 1px solid #ddd; padding: 10px; text-align: right; color: #ef4444;"><strong>${stats.totalOutstanding}</strong></td>
            </tr>
          </table>

          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

          <p style="color: #666; font-size: 12px; margin: 0;">
            This is an automated weekly report from ${orgName}.<br>
            Login to your spreadsheet to view detailed payment information.
          </p>
        </div>
      </div>
    `;

    GmailApp.sendEmail(adminEmail, subject, '', {
      htmlBody: htmlBody,
      noReply: true
    });

    logAction('Weekly Report Email', `Sent to ${adminEmail}`);
  } catch (error) {
    logAction('Weekly Report Email Error', error.toString());
  }
}

// Get admin email from settings
function getAdminEmail() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    if (!settingsSheet) return null;

    const data = settingsSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === 'Admin Email') {
        return data[i][1];
      }
    }
  } catch (e) {
    console.log('Error getting admin email: ' + e.toString());
  }
  return null;
}

// Set admin email in settings
function setAdminEmail(email) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let settingsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);

    if (!settingsSheet) {
      settingsSheet = ss.insertSheet(CONFIG.SHEET_NAMES.SETTINGS);
      settingsSheet.appendRow(['Setting', 'Value']);
    }

    const data = settingsSheet.getDataRange().getValues();
    let found = false;

    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === 'Admin Email') {
        settingsSheet.getRange(i + 1, 2).setValue(email);
        found = true;
        break;
      }
    }

    if (!found) {
      settingsSheet.appendRow(['Admin Email', email]);
    }

    logAction('Set Admin Email', email);
  } catch (error) {
    console.log('Error setting admin email: ' + error.toString());
  }
}

// Initialize system setup
function initializeSystem() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create required sheets if they don't exist
    const requiredSheets = [
      CONFIG.SHEET_NAMES.MEMBERS,
      CONFIG.SHEET_NAMES.CONTRIBUTIONS,
      CONFIG.SHEET_NAMES.EVENTS,
      CONFIG.SHEET_NAMES.PAYMENTS,
      CONFIG.SHEET_NAMES.SETTINGS,
      CONFIG.SHEET_NAMES.LOGS
    ];

    requiredSheets.forEach(sheetName => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);

        // Add headers based on sheet type
        if (sheetName === CONFIG.SHEET_NAMES.MEMBERS) {
          sheet.appendRow(['Member ID', 'Full Name', 'Phone Number', 'Email', 'Membership Status', 'Join Date', 'Group/Region', 'Notes']);
        } else if (sheetName === CONFIG.SHEET_NAMES.CONTRIBUTIONS) {
          sheet.appendRow(['Member ID', 'Member Name', 'Contribution Type', 'Amount Due', 'Amount Paid', 'Payment Status', 'Due Date', 'Payment Date', 'Balance']);
        } else if (sheetName === CONFIG.SHEET_NAMES.EVENTS) {
          sheet.appendRow(['Event Title', 'Event Date', 'Event Time', 'Event Details', 'Created Date', 'Recipients Count']);
        } else if (sheetName === CONFIG.SHEET_NAMES.PAYMENTS) {
          sheet.appendRow(['Member ID', 'Amount Paid', 'Payment Date', 'Status', 'Processed Date']);
        } else if (sheetName === CONFIG.SHEET_NAMES.SETTINGS) {
          sheet.appendRow(['Setting', 'Value']);
        } else if (sheetName === CONFIG.SHEET_NAMES.LOGS) {
          sheet.appendRow(['Timestamp', 'Action', 'Details', 'User']);
        }
      }
    });

    // Create form if doesn't exist
    const formUrl = getFormUrl();
    if (!formUrl) {
      getOrCreateMemberForm();
    }

    logAction('System Initialization', 'All required sheets and form created');
  } catch (error) {
    logAction('System Initialization Error', error.toString());
  }
}

// List all current triggers
function listCurrentTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let triggerList = [];

  triggers.forEach((trigger, index) => {
    triggerList.push({
      number: index + 1,
      function: trigger.getHandlerFunction(),
      type: trigger.getTriggerSource().toString(),
      eventType: trigger.getEventType ? trigger.getEventType().toString() : 'N/A'
    });
  });

  return triggerList;
}
