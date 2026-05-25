// Analytics and Reporting Functions

// Generate speaker report
function generateSpeakerReport() {
  try {
    const speakers = getAllSpeakers();

    // Sort by times spoken
    speakers.sort((a, b) => b.timeSpoken - a.timeSpoken);

    let html = `<style>
      body { font-family: Arial; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #4285F4; color: white; padding: 12px; text-align: left; }
      td { border-bottom: 1px solid #ddd; padding: 10px; }
      tr:hover { background: #f5f5f5; }
      .rating { color: #f59e0b; font-weight: bold; }
      .summary { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
    <h2>🎤 Speaker Report</h2>
    <div class="summary">
      <p><strong>Total Speakers:</strong> ${speakers.length}</p>
      <p><strong>Willing to Speak:</strong> ${speakers.filter(s => s.willing === 'Yes').length}</p>
      <p><strong>Average Times Spoken:</strong> ${speakers.length > 0 ? (speakers.reduce((a, b) => a + b.timeSpoken, 0) / speakers.length).toFixed(1) : 0}</p>
    </div>
    <table>
      <tr>
        <th>Speaker Name</th>
        <th>Times Spoken</th>
        <th>Rating</th>
        <th>Expertise</th>
        <th>Available</th>
      </tr>`;

    speakers.forEach(speaker => {
      html += `<tr>
        <td><strong>${speaker.name}</strong></td>
        <td>${speaker.timeSpoken}</td>
        <td class="rating">${speaker.rating ? speaker.rating.toFixed(1) + '/5' : 'N/A'}</td>
        <td>${speaker.expertise}</td>
        <td>${speaker.willing === 'Yes' ? '✓' : '✗'}</td>
      </tr>`;
    });

    html += '</table>';

    return { html: html, count: speakers.length };
  } catch (error) {
    console.log('Error generating report: ' + error.toString());
    return { html: '<p>Error generating report</p>', count: 0 };
  }
}

// Generate attendance report
function generateAttendanceReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const scheduleData = scheduleSheet.getDataRange().getValues();

    let totalAttendance = 0;
    let totalMeetings = 0;
    let html = `<style>
      body { font-family: Arial; padding: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #4285F4; color: white; padding: 12px; text-align: left; }
      td { border-bottom: 1px solid #ddd; padding: 10px; }
      tr:hover { background: #f5f5f5; }
      .summary { background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; }
      .high { color: #22c55e; }
      .medium { color: #f59e0b; }
      .low { color: #ef4444; }
    </style>
    <h2>👥 Attendance Report</h2>`;

    const meetingAttendance = [];

    for (let i = 1; i < scheduleData.length; i++) {
      const meetingId = scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID];
      const date = scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DATE];
      const topic = scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TOPIC_TITLE];

      const attendance = getMeetingAttendance(meetingId);
      if (attendance) {
        const rate = attendance.totalAttendees > 0 ? Math.round((attendance.presentCount / attendance.totalAttendees) * 100) : 0;
        meetingAttendance.push({
          meetingId: meetingId,
          date: date,
          topic: topic,
          present: attendance.presentCount,
          absent: attendance.absentCount,
          total: attendance.totalAttendees,
          rate: rate
        });
        totalAttendance += rate;
        totalMeetings++;
      }
    }

    const avgAttendance = totalMeetings > 0 ? Math.round(totalAttendance / totalMeetings) : 0;

    html += `<div class="summary">
      <p><strong>Total Meetings:</strong> ${totalMeetings}</p>
      <p><strong>Average Attendance Rate:</strong> <span class="high">${avgAttendance}%</span></p>
      <p><strong>Total Attendees:</strong> ${meetingAttendance.reduce((a, b) => a + b.total, 0)}</p>
    </div>
    <table>
      <tr>
        <th>Meeting</th>
        <th>Date</th>
        <th>Present</th>
        <th>Absent</th>
        <th>Rate</th>
      </tr>`;

    meetingAttendance.sort((a, b) => new Date(b.date) - new Date(a.date));

    meetingAttendance.forEach(meeting => {
      const rateClass = meeting.rate >= 80 ? 'high' : meeting.rate >= 60 ? 'medium' : 'low';
      html += `<tr>
        <td>${meeting.topic}</td>
        <td>${formatMeetingDate(meeting.date)}</td>
        <td>${meeting.present}</td>
        <td>${meeting.absent}</td>
        <td class="${rateClass}">${meeting.rate}%</td>
      </tr>`;
    });

    html += '</table>';

    return { html: html };
  } catch (error) {
    console.log('Error generating report: ' + error.toString());
    return { html: '<p>Error generating report</p>' };
  }
}

// Generate meeting analytics
function generateMeetingAnalytics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const scheduleData = scheduleSheet.getDataRange().getValues();

    const topicStats = getTopicStatistics();
    const speakerStats = generateSpeakerStatsForAnalytics();
    const trends = calculateAttendanceTrends(10);

    let html = `<style>
      body { font-family: Arial; padding: 20px; }
      h2 { color: #333; border-bottom: 2px solid #4285F4; padding-bottom: 10px; }
      .stat-box { display: inline-block; background: #f5f5f5; padding: 15px; margin: 10px; border-radius: 5px; min-width: 150px; }
      .stat-number { font-size: 28px; font-weight: bold; color: #4285F4; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th { background: #4285F4; color: white; padding: 12px; text-align: left; }
      td { border-bottom: 1px solid #ddd; padding: 10px; }
    </style>
    <h1>📊 Meeting Management Analytics</h1>

    <h2>📈 Key Metrics</h2>
    <div>
      <div class="stat-box">
        <div class="stat-number">${scheduleData.length - 1}</div>
        <div>Total Meetings</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${topicStats.total}</div>
        <div>Topics in Library</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${speakerStats.total}</div>
        <div>Speakers</div>
      </div>
      <div class="stat-box">
        <div class="stat-number">${speakerStats.willingCount}</div>
        <div>Available Speakers</div>
      </div>
    </div>

    <h2>Topics by Category</h2>
    <table>
      <tr>
        <th>Category</th>
        <th>Count</th>
      </tr>`;

    Object.keys(topicStats.byCategory).forEach(category => {
      html += `<tr>
        <td>${category}</td>
        <td>${topicStats.byCategory[category]}</td>
      </tr>`;
    });

    html += `</table>

    <h2>Attendance Trend (Last 10 Meetings)</h2>
    <table>
      <tr>
        <th>Meeting</th>
        <th>Attendance Rate</th>
      </tr>`;

    trends.forEach(trend => {
      html += `<tr>
        <td>${trend.topic}</td>
        <td>${trend.rate}%</td>
      </tr>`;
    });

    html += `</table>

    <h2>Top Speakers</h2>
    <table>
      <tr>
        <th>Speaker</th>
        <th>Times Spoken</th>
        <th>Rating</th>
      </tr>`;

    speakerStats.topSpeakers.forEach(speaker => {
      html += `<tr>
        <td>${speaker.name}</td>
        <td>${speaker.timeSpoken}</td>
        <td>${speaker.rating ? speaker.rating.toFixed(1) : 'N/A'}/5</td>
      </tr>`;
    });

    html += '</table>';

    return { html: html };
  } catch (error) {
    console.log('Error generating analytics: ' + error.toString());
    return { html: '<p>Error generating analytics</p>' };
  }
}

// Helper function for speaker stats
function generateSpeakerStatsForAnalytics() {
  try {
    const speakers = getAllSpeakers();
    const topSpeakers = speakers.sort((a, b) => b.timeSpoken - a.timeSpoken).slice(0, 5);

    return {
      total: speakers.length,
      willingCount: speakers.filter(s => s.willing === 'Yes').length,
      topSpeakers: topSpeakers
    };
  } catch (error) {
    return { total: 0, willingCount: 0, topSpeakers: [] };
  }
}

// Format date for display
function formatMeetingDate(date) {
  if (!date) return 'N/A';
  if (typeof date === 'string') return date;
  try {
    return Utilities.formatDate(date, Session.getScriptTimeZone(), 'MMM dd, yyyy');
  } catch (e) {
    return 'Invalid Date';
  }
}

// Get meeting completion rate
function getMeetingCompletionStats() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const scheduleSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const scheduleData = scheduleSheet.getDataRange().getValues();

    const minorSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const minutesData = minorSheet.getDataRange().getValues();

    const minutesIds = new Set();
    for (let i = 1; i < minutesData.length; i++) {
      minutesIds.add(minutesData[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID]);
    }

    let completedMeetings = 0;
    for (let i = 1; i < scheduleData.length; i++) {
      if (minutesIds.has(scheduleData[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID])) {
        completedMeetings++;
      }
    }

    const totalMeetings = scheduleData.length - 1;
    const completionRate = totalMeetings > 0 ? Math.round((completedMeetings / totalMeetings) * 100) : 0;

    return {
      totalMeetings: totalMeetings,
      completedMeetings: completedMeetings,
      completionRate: completionRate
    };
  } catch (error) {
    console.log('Error: ' + error.toString());
    return { totalMeetings: 0, completedMeetings: 0, completionRate: 0 };
  }
}

// Export all analytics as CSV
function exportAnalyticsReport() {
  try {
    let csv = 'MEETING MANAGEMENT ANALYTICS REPORT\n';
    csv += `Generated: ${new Date()}\n\n`;

    const completion = getMeetingCompletionStats();
    csv += 'MEETING COMPLETION\n';
    csv += `Total Meetings,${completion.totalMeetings}\n`;
    csv += `Completed,${completion.completedMeetings}\n`;
    csv += `Completion Rate,${completion.completionRate}%\n\n`;

    const topicStats = getTopicStatistics();
    csv += 'TOPIC STATISTICS\n';
    csv += `Total Topics,${topicStats.total}\n`;
    csv += `Active,${topicStats.active}\n`;
    csv += `Archived,${topicStats.archived}\n\n`;

    return csv;
  } catch (error) {
    console.log('Error exporting: ' + error.toString());
    return null;
  }
}
