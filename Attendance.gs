// Attendance Tracking Functions

// Record attendance for a meeting
function recordAttendance(meetingId, speakerName, attended, participationLevel, feedback) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.ATTENDANCE);
    const attendanceData = sheet.getDataRange().getValues();

    // Check if already recorded
    for (let i = 1; i < attendanceData.length; i++) {
      if (attendanceData[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.MEETING_ID] === meetingId &&
          attendanceData[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.SPEAKER_NAME] === speakerName) {
        // Update existing record
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.ATTENDANCE.ATTENDED + 1).setValue(attended);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.ATTENDANCE.PARTICIPATED + 1).setValue(participationLevel);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.ATTENDANCE.FEEDBACK_SCORE + 1).setValue(feedback);
        logMeetingAction('Update Attendance', `${meetingId}: ${speakerName}`);
        return { success: true, updated: true };
      }
    }

    // Add new record
    sheet.appendRow([
      meetingId,
      '', // Speaker ID
      speakerName,
      attended ? 'Yes' : 'No',
      '', // Arrival time
      '', // Departure time
      participationLevel,
      feedback,
      ''
    ]);

    logMeetingAction('Record Attendance', `${meetingId}: ${speakerName} - ${attended ? 'Present' : 'Absent'}`);
    return { success: true, updated: false };
  } catch (error) {
    logMeetingAction('Record Attendance Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get attendance for a meeting
function getMeetingAttendance(meetingId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.ATTENDANCE);
    const data = sheet.getDataRange().getValues();

    const attendance = [];
    let presentCount = 0;
    let absentCount = 0;

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.MEETING_ID] === meetingId) {
        const attended = data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.ATTENDED] === 'Yes';
        attendance.push({
          name: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.SPEAKER_NAME],
          attended: attended,
          participation: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.PARTICIPATED],
          feedback: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.FEEDBACK_SCORE]
        });

        if (attended) presentCount++;
        else absentCount++;
      }
    }

    return {
      meetingId: meetingId,
      attendance: attendance,
      presentCount: presentCount,
      absentCount: absentCount,
      totalAttendees: presentCount + absentCount
    };
  } catch (error) {
    console.log('Error getting attendance: ' + error.toString());
    return null;
  }
}

// Get speaker attendance statistics
function getSpeakerAttendanceStats(speakerName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.ATTENDANCE);
    const data = sheet.getDataRange().getValues();

    let attended = 0;
    let notAttended = 0;
    const meetings = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.SPEAKER_NAME] === speakerName) {
        const didAttend = data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.ATTENDED] === 'Yes';
        if (didAttend) {
          attended++;
        } else {
          notAttended++;
        }

        meetings.push({
          meetingId: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.MEETING_ID],
          attended: didAttend,
          participation: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.PARTICIPATED],
          feedback: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.FEEDBACK_SCORE]
        });
      }
    }

    const total = attended + notAttended;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return {
      speaker: speakerName,
      attended: attended,
      notAttended: notAttended,
      total: total,
      attendanceRate: attendanceRate,
      meetings: meetings
    };
  } catch (error) {
    console.log('Error getting attendance stats: ' + error.toString());
    return null;
  }
}

// Get meeting attendance rate
function getMeetingAttendanceRate(meetingId) {
  try {
    const attendance = getMeetingAttendance(meetingId);
    if (!attendance || attendance.totalAttendees === 0) {
      return 0;
    }

    return Math.round((attendance.presentCount / attendance.totalAttendees) * 100);
  } catch (error) {
    console.log('Error calculating rate: ' + error.toString());
    return 0;
  }
}

// Mark all attendees for a meeting
function markAllAttendees(meetingId, attendeeList) {
  try {
    let count = 0;
    attendeeList.forEach(attendee => {
      recordAttendance(meetingId, attendee.name, attendee.attended, attendee.participation, attendee.feedback);
      count++;
    });

    logMeetingAction('Bulk Mark Attendance', `${meetingId}: ${count} attendees marked`);
    return { success: true, count: count };
  } catch (error) {
    logMeetingAction('Bulk Mark Attendance Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get attendees for a meeting (for display)
function getMeetingAttendeesForDisplay(meetingId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.ATTENDANCE);
    const data = sheet.getDataRange().getValues();

    const attendees = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.MEETING_ID] === meetingId) {
        attendees.push({
          name: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.SPEAKER_NAME],
          attended: data[i][MEETING_CONFIG.COLUMNS.ATTENDANCE.ATTENDED]
        });
      }
    }

    return attendees;
  } catch (error) {
    console.log('Error getting attendees: ' + error.toString());
    return [];
  }
}

// Calculate attendance trends over time
function calculateAttendanceTrends(numberOfMeetings = 5) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const scheduleData = scheduleSheet.getDataRange().getValues();

    // Get recent meetings
    const meetings = [];
    for (let i = Math.max(1, scheduleData.length - numberOfMeetings); i < scheduleData.length; i++) {
      meetings.push({
        id: scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID],
        date: scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DATE],
        topic: scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TOPIC_TITLE]
      });
    }

    // Get attendance rates for each
    const trends = [];
    meetings.forEach(meeting => {
      const rate = getMeetingAttendanceRate(meeting.id);
      trends.push({
        id: meeting.id,
        date: meeting.date,
        topic: meeting.topic,
        rate: rate
      });
    });

    return trends;
  } catch (error) {
    console.log('Error calculating trends: ' + error.toString());
    return [];
  }
}

// Export attendance report as CSV
function exportAttendanceReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.ATTENDANCE);
    const data = sheet.getDataRange().getValues();

    let csv = 'Meeting ID,Speaker Name,Attended,Participation,Feedback Score\n';

    for (let i = 1; i < data.length; i++) {
      csv += `"${data[i][0]}","${data[i][2]}","${data[i][3]}","${data[i][5]}","${data[i][6]}"\n`;
    }

    return csv;
  } catch (error) {
    console.log('Error exporting: ' + error.toString());
    return null;
  }
}
