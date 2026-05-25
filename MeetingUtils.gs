// Utility Functions for Meeting Management System

// Initialize system
function initializeMeetingSystem() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Create required sheets
    const requiredSheets = [
      MEETING_CONFIG.SHEET_NAMES.SCHEDULE,
      MEETING_CONFIG.SHEET_NAMES.TOPICS,
      MEETING_CONFIG.SHEET_NAMES.SPEAKERS,
      MEETING_CONFIG.SHEET_NAMES.ATTENDANCE,
      MEETING_CONFIG.SHEET_NAMES.MINUTES,
      MEETING_CONFIG.SHEET_NAMES.RESOURCES,
      MEETING_CONFIG.SHEET_NAMES.SETTINGS,
      MEETING_CONFIG.SHEET_NAMES.LOGS
    ];

    requiredSheets.forEach(sheetName => {
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        sheet = ss.insertSheet(sheetName);

        // Add headers based on sheet type
        if (sheetName === MEETING_CONFIG.SHEET_NAMES.SCHEDULE) {
          sheet.appendRow(['Meeting ID', 'Date', 'Time', 'Location', 'Topic ID', 'Topic Title', 'Primary Speaker', 'Facilitator', 'Expected Attendance', 'Status', 'Description', 'Notes', 'Resources', 'Created Date']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.TOPICS) {
          sheet.appendRow(['Topic ID', 'Title', 'Category', 'Description', 'Duration (min)', 'Difficulty', 'Resource Links', 'Last Discussed', 'Frequency', 'Status']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.SPEAKERS) {
          sheet.appendRow(['Speaker ID', 'Speaker Name', 'Times Spoken', 'Last Speaking Date', 'Topics Spoken', 'Rating', 'Expertise Areas', 'Willing to Speak', 'Preferred Topics', 'Email']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.ATTENDANCE) {
          sheet.appendRow(['Meeting ID', 'Speaker ID', 'Speaker Name', 'Attended', 'Arrival Time', 'Departure Time', 'Participation Level', 'Feedback Score', 'Notes']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.MINUTES) {
          sheet.appendRow(['Meeting ID', 'Date Recorded', 'Key Discussion Points', 'Decisions Made', 'Action Items', 'Owners', 'Due Dates', 'Next Steps', 'Recorded By', 'Status']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.RESOURCES) {
          sheet.appendRow(['Resource ID', 'Meeting ID', 'Topic ID', 'Title', 'Resource Type', 'Link', 'Description', 'Added Date', 'Uploaded By']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.SETTINGS) {
          sheet.appendRow(['Setting', 'Value']);
        } else if (sheetName === MEETING_CONFIG.SHEET_NAMES.LOGS) {
          sheet.appendRow(['Timestamp', 'Action', 'Details', 'User']);
        }
      }
    });

    logMeetingAction('System Initialization', 'All required sheets created');
    return { success: true };
  } catch (error) {
    logMeetingAction('System Initialization Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get all meetings
function getAllMeetings() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const data = sheet.getDataRange().getValues();

    const meetings = [];
    for (let i = 1; i < data.length; i++) {
      meetings.push({
        id: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID],
        date: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DATE],
        time: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TIME],
        location: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.LOCATION],
        topic: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TOPIC_TITLE],
        speaker: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.PRIMARY_SPEAKER],
        status: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.STATUS]
      });
    }

    return meetings;
  } catch (error) {
    console.log('Error getting meetings: ' + error.toString());
    return [];
  }
}

// Get upcoming meetings
function getUpcomingMeetings(daysAhead = 30) {
  try {
    const meetings = getAllMeetings();
    const today = new Date();
    const cutoffDate = new Date(today.getTime() + daysAhead * 24 * 60 * 60 * 1000);

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= today && meetingDate <= cutoffDate;
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    console.log('Error getting upcoming meetings: ' + error.toString());
    return [];
  }
}

// Get past meetings
function getPastMeetings() {
  try {
    const meetings = getAllMeetings();
    const today = new Date();

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate < today;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  } catch (error) {
    console.log('Error getting past meetings: ' + error.toString());
    return [];
  }
}

// Get meeting by ID
function getMeetingById(meetingId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID] === meetingId) {
        return {
          id: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID],
          date: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DATE],
          time: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TIME],
          location: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.LOCATION],
          topic: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TOPIC_TITLE],
          speaker: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.PRIMARY_SPEAKER],
          facilitator: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.FACILITATOR],
          expectedAttendance: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.EXPECTED_ATTENDANCE],
          status: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.STATUS],
          description: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DESCRIPTION],
          notes: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.NOTES]
        };
      }
    }

    return null;
  } catch (error) {
    console.log('Error getting meeting: ' + error.toString());
    return null;
  }
}

// Update meeting status
function updateMeetingStatus(meetingId, newStatus) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID] === meetingId) {
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SCHEDULE.STATUS + 1).setValue(newStatus);
        logMeetingAction('Update Meeting Status', `${meetingId} → ${newStatus}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Meeting not found' };
  } catch (error) {
    logMeetingAction('Update Status Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Cancel a meeting
function cancelMeeting(meetingId, reason) {
  try {
    updateMeetingStatus(meetingId, 'Cancelled');

    // Send notification emails
    const meeting = getMeetingById(meetingId);
    if (meeting) {
      const speakers = getAllSpeakers();
      speakers.forEach(speaker => {
        if (speaker.email) {
          sendMeetingCancellationEmail(speaker.email, speaker.name, meeting, reason);
        }
      });
    }

    logMeetingAction('Cancel Meeting', `${meetingId}: ${reason}`);
    return { success: true };
  } catch (error) {
    logMeetingAction('Cancel Meeting Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Send meeting cancellation email
function sendMeetingCancellationEmail(email, name, meeting, reason) {
  try {
    const settings = getMeetingSettings();
    const subject = `Meeting Cancelled: ${meeting.topic}`;
    const htmlBody = `
      <div style="font-family: Arial; padding: 20px; background: #fee2e2;">
        <h2>❌ Meeting Cancelled</h2>
        <p>Dear ${name},</p>
        <p>The following meeting has been cancelled:</p>
        <p><strong>Topic:</strong> ${meeting.topic}<br>
           <strong>Date:</strong> ${formatMeetingDate(meeting.date)}<br>
           <strong>Time:</strong> ${meeting.time}</p>
        <p><strong>Reason:</strong> ${reason}</p>
        <p>We apologize for any inconvenience this may cause.</p>
      </div>
    `;

    GmailApp.sendEmail(email, subject, '', { htmlBody: htmlBody, noReply: true });
  } catch (error) {
    console.log('Error sending cancellation email: ' + error.toString());
  }
}

// Backup meeting data
function backupMeetingData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmmss');
    const backupName = `Meeting_Backup_${timestamp}`;

    // Create backup folder if doesn't exist
    const folders = DriveApp.getRootFolder().getFoldersByName('Meeting Management Backups');
    let backupFolder;

    if (folders.hasNext()) {
      backupFolder = folders.next();
    } else {
      backupFolder = DriveApp.createFolder('Meeting Management Backups');
    }

    // Copy the spreadsheet
    const file = DriveApp.getFileById(ss.getId());
    const backup = file.makeCopy(backupName, backupFolder);

    logMeetingAction('Backup Data', `Created backup: ${backupName}`);
    return { success: true, backupId: backup.getId(), backupName: backupName };
  } catch (error) {
    logMeetingAction('Backup Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Clear old logs
function clearOldMeetingLogs(daysToKeep = 30) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const logsSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.LOGS);

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

    // Delete in reverse order
    rowsToDelete.forEach(row => {
      logsSheet.deleteRow(row);
    });

    logMeetingAction('Clear Old Logs', `Deleted ${rowsToDelete.length} logs older than ${daysToKeep} days`);
    return { success: true, deletedCount: rowsToDelete.length };
  } catch (error) {
    logMeetingAction('Clear Logs Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Generate health report
function generateMeetingHealthReport() {
  try {
    const meetings = getAllMeetings();
    const upcomingMeetings = getUpcomingMeetings(30);
    const speakers = getAllSpeakers();
    const topics = getAllTopics();

    const report = {
      timestamp: new Date(),
      totalMeetings: meetings.length,
      upcomingMeetings: upcomingMeetings.length,
      totalSpeakers: speakers.length,
      availableSpeakers: speakers.filter(s => s.willing === 'Yes').length,
      totalTopics: topics.length,
      activeTopics: topics.filter(t => t.status === 'Active').length
    };

    return report;
  } catch (error) {
    console.log('Error generating report: ' + error.toString());
    return null;
  }
}

// Log meeting action
function logMeetingAction(action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logsSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.LOGS);

    if (!logsSheet) {
      logsSheet = ss.insertSheet(MEETING_CONFIG.SHEET_NAMES.LOGS);
      logsSheet.appendRow(['Timestamp', 'Action', 'Details', 'User']);
    }

    const user = Session.getEffectiveUser().getEmail();
    logsSheet.appendRow([new Date(), action, details, user]);
  } catch (e) {
    console.log('Error logging action: ' + e.toString());
  }
}

// Utility to pause execution
function sleep(milliseconds) {
  const start = new Date().getTime();
  while (new Date().getTime() - start < milliseconds) {
    // Wait
  }
}
