// Utility Functions
// General purpose functions used across the system

// Format date to readable string
function formatDate(date) {
  if (!date) return 'N/A';
  if (typeof date === 'string') return date;
  try {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
}

// Create new year sheet for contributions
function createNewYearSheet(year) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const currentSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);

    if (!currentSheet) {
      return { success: false, error: 'Contributions sheet not found' };
    }

    // Get all members
    const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const memberData = membersSheet.getDataRange().getValues();

    // Create new sheet with year in name
    const newSheetName = `Contributions_${year}`;
    let newSheet = ss.getSheetByName(newSheetName);

    if (newSheet) {
      return { success: false, error: `Sheet for ${year} already exists` };
    }

    newSheet = ss.insertSheet(newSheetName);

    // Add headers
    newSheet.appendRow(['Member ID', 'Member Name', 'Contribution Type', 'Amount Due', 'Amount Paid', 'Payment Status', 'Due Date', 'Payment Date', 'Balance']);

    // Add all active members
    let addedCount = 0;
    for (let i = 1; i < memberData.length; i++) {
      const memberId = memberData[i][CONFIG.COLUMNS.MEMBERS.MEMBER_ID];
      const memberName = memberData[i][CONFIG.COLUMNS.MEMBERS.FULL_NAME];
      const status = memberData[i][CONFIG.COLUMNS.MEMBERS.STATUS];

      if (status === 'ACTIVE') {
        newSheet.appendRow([
          memberId,
          memberName,
          'Monthly Contribution',
          0,
          0,
          'UNPAID',
          '',
          '',
          0
        ]);
        addedCount++;
      }
    }

    logAction('Create New Year Sheet', `Created ${newSheetName} with ${addedCount} members`);
    return { success: true, message: `Created sheet for ${year} with ${addedCount} members`, sheetName: newSheetName };
  } catch (error) {
    logAction('Create New Year Sheet Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Archive previous year data
function archiveYearSheet(year) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = `Contributions_${year}`;
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return { success: false, error: `Sheet for year ${year} not found` };
    }

    const archiveSheetName = `${CONFIG.SHEET_NAMES.ARCHIVE_PREFIX}${year}`;
    const existingArchive = ss.getSheetByName(archiveSheetName);

    if (existingArchive) {
      return { success: false, error: `Archive for ${year} already exists` };
    }

    // Copy sheet
    const archiveSheet = sheet.copyTo(ss);
    archiveSheet.setName(archiveSheetName);

    // Move archive sheet to end
    ss.moveSheet(archiveSheet, ss.getSheets().length);

    logAction('Archive Year', `Archived ${year} data to ${archiveSheetName}`);
    return { success: true, message: `Year ${year} archived successfully` };
  } catch (error) {
    logAction('Archive Year Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Export data to CSV
function exportToCSV(sheetName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      return null;
    }

    const data = sheet.getDataRange().getValues();
    let csv = [];

    data.forEach(row => {
      const csvRow = row.map(cell => {
        if (cell === null || cell === undefined) return '';
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return '"' + cellStr.replace(/"/g, '""') + '"';
        }
        return cellStr;
      });
      csv.push(csvRow.join(','));
    });

    return csv.join('\n');
  } catch (error) {
    console.log('Error exporting to CSV: ' + error.toString());
    return null;
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone number format (basic)
function isValidPhone(phone) {
  const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Get member count
function getMemberCount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
  return sheet.getDataRange().getValues().length - 1; // Subtract header
}

// Get active member count
function getActiveMemberCount() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
  const data = sheet.getDataRange().getValues();

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][CONFIG.COLUMNS.MEMBERS.STATUS] === 'ACTIVE') {
      count++;
    }
  }
  return count;
}

// Clear old logs (keep last 30 days)
function clearOldLogs(daysToKeep = 30) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LOGS);

    if (!logsSheet) return { success: false, error: 'Logs sheet not found' };

    const data = logsSheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    let rowsToDelete = [];

    for (let i = data.length - 1; i > 0; i--) {
      const logDate = new Date(data[i][0]);
      if (logDate < cutoffDate) {
        rowsToDelete.push(i + 1);
      }
    }

    // Delete rows in reverse order to maintain indices
    rowsToDelete.forEach(row => {
      logsSheet.deleteRow(row);
    });

    logAction('Clear Old Logs', `Deleted ${rowsToDelete.length} logs older than ${daysToKeep} days`);
    return { success: true, deletedCount: rowsToDelete.length };
  } catch (error) {
    logAction('Clear Old Logs Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Backup data (create a copy of current sheet)
function backupData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
    const backupName = `Backup_${timestamp}`;

    // Create backup folder
    const folders = DriveApp.getRootFolder().getFoldersByName('Membership System Backups');
    let backupFolder;

    if (folders.hasNext()) {
      backupFolder = folders.next();
    } else {
      backupFolder = DriveApp.createFolder('Membership System Backups');
    }

    // Copy the spreadsheet to backup folder
    const file = DriveApp.getFileById(ss.getId());
    const backup = file.makeCopy(backupName, backupFolder);

    logAction('Backup Data', `Created backup: ${backupName}`);
    return { success: true, backupId: backup.getId(), backupName: backupName };
  } catch (error) {
    logAction('Backup Data Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Test email configuration
function testEmailConfiguration() {
  try {
    const userEmail = Session.getEffectiveUser().getEmail();
    const subject = 'Community Management System - Email Test';
    const htmlBody = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>✓ Email Configuration Test Successful!</h2>
        <p>This email confirms that your Community Management System email automation is properly configured.</p>
        <p><strong>System Email:</strong> ${userEmail}</p>
        <p><strong>Test Date/Time:</strong> ${new Date()}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          This is an automated test message. If you received this, your email setup is working correctly.
        </p>
      </div>
    `;

    GmailApp.sendEmail(userEmail, subject, '', { htmlBody: htmlBody });

    logAction('Email Test', 'Test email sent successfully to ' + userEmail);
    return { success: true, message: 'Test email sent to ' + userEmail };
  } catch (error) {
    logAction('Email Test Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Generate system health report
function generateHealthReport() {
  try {
    const report = {
      timestamp: new Date(),
      spreadsheetId: SpreadsheetApp.getActiveSpreadsheet().getId(),
      spreadsheetUrl: SpreadsheetApp.getActiveSpreadsheet().getUrl(),
      totalMembers: getMemberCount(),
      activeMembers: getActiveMemberCount(),
      paymentStats: calculatePaymentStats(),
      triggers: listCurrentTriggers(),
      recentLogs: getRecentLogs(10)
    };

    return report;
  } catch (error) {
    console.log('Error generating health report: ' + error.toString());
    return { error: error.toString() };
  }
}

// Get recent logs
function getRecentLogs(count = 10) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.LOGS);

    if (!logsSheet) return [];

    const data = logsSheet.getDataRange().getValues();
    const recentLogs = [];

    for (let i = Math.max(1, data.length - count); i < data.length; i++) {
      recentLogs.push({
        timestamp: data[i][0],
        action: data[i][1],
        details: data[i][2],
        user: data[i][3]
      });
    }

    return recentLogs.reverse(); // Show most recent first
  } catch (error) {
    console.log('Error getting recent logs: ' + error.toString());
    return [];
  }
}

// Check system permissions
function checkSystemPermissions() {
  try {
    const checks = {
      spreadsheetAccess: true,
      gmailAccess: true,
      formAccess: true,
      driveAccess: true
    };

    // Test spreadsheet access
    try {
      SpreadsheetApp.getActiveSpreadsheet().getSheets();
    } catch (e) {
      checks.spreadsheetAccess = false;
    }

    // Test Gmail access
    try {
      GmailApp.getInboxUnreadCount();
    } catch (e) {
      checks.gmailAccess = false;
    }

    // Test Drive access
    try {
      DriveApp.getRootFolder();
    } catch (e) {
      checks.driveAccess = false;
    }

    return checks;
  } catch (error) {
    console.log('Error checking permissions: ' + error.toString());
    return null;
  }
}

// Utility to pause execution (useful for rate limiting)
function sleep(milliseconds) {
  const start = new Date().getTime();
  while (new Date().getTime() - start < milliseconds) {
    // Wait
  }
}
