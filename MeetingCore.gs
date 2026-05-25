// Community Meeting Management System - Main Core
// Complete system for organizing, tracking, and managing community meetings

const MEETING_CONFIG = {
  SHEET_NAMES: {
    SCHEDULE: 'Meeting_Schedule',
    TOPICS: 'Topics',
    SPEAKERS: 'Speaker_Rotation',
    ATTENDANCE: 'Attendance',
    MINUTES: 'Meeting_Minutes',
    RESOURCES: 'Discussion_Resources',
    SETTINGS: 'Settings',
    LOGS: 'Logs'
  },
  COLUMNS: {
    SCHEDULE: {
      MEETING_ID: 0,
      DATE: 1,
      TIME: 2,
      LOCATION: 3,
      TOPIC_ID: 4,
      TOPIC_TITLE: 5,
      PRIMARY_SPEAKER: 6,
      FACILITATOR: 7,
      EXPECTED_ATTENDANCE: 8,
      STATUS: 9,
      DESCRIPTION: 10,
      NOTES: 11,
      RESOURCES: 12,
      CREATED_DATE: 13
    },
    TOPICS: {
      TOPIC_ID: 0,
      TITLE: 1,
      CATEGORY: 2,
      DESCRIPTION: 3,
      DURATION_MIN: 4,
      DIFFICULTY: 5,
      RESOURCE_LINKS: 6,
      LAST_DISCUSSED: 7,
      FREQUENCY: 8,
      STATUS: 9
    },
    SPEAKERS: {
      SPEAKER_ID: 0,
      SPEAKER_NAME: 1,
      TIMES_SPOKEN: 2,
      LAST_SPEAKING_DATE: 3,
      TOPICS_SPOKEN: 4,
      RATING: 5,
      EXPERTISE_AREAS: 6,
      WILLING_TO_SPEAK: 7,
      PREFERRED_TOPICS: 8,
      EMAIL: 9
    },
    ATTENDANCE: {
      MEETING_ID: 0,
      SPEAKER_ID: 1,
      SPEAKER_NAME: 2,
      ATTENDED: 3,
      ARRIVAL_TIME: 4,
      DEPARTURE_TIME: 5,
      PARTICIPATED: 6,
      FEEDBACK_SCORE: 7,
      NOTES: 8
    },
    MINUTES: {
      MEETING_ID: 0,
      DATE: 1,
      KEY_POINTS: 2,
      DECISIONS: 3,
      ACTION_ITEMS: 4,
      OWNERS: 5,
      DUE_DATES: 6,
      NEXT_STEPS: 7,
      RECORDED_BY: 8,
      STATUS: 9
    },
    RESOURCES: {
      RESOURCE_ID: 0,
      MEETING_ID: 1,
      TOPIC_ID: 2,
      TITLE: 3,
      RESOURCE_TYPE: 4,
      LINK: 5,
      DESCRIPTION: 6,
      ADDED_DATE: 7,
      UPLOADED_BY: 8
    }
  },
  STATUS: {
    MEETING: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
    MINUTES: ['Draft', 'Approved', 'Archived'],
    TOPIC: ['Active', 'Archived', 'Suggested'],
    PARTICIPATION: ['Yes', 'No', 'Moderate', 'Partial'],
    DIFFICULTY: ['Beginner', 'Intermediate', 'Advanced'],
    FREQUENCY: ['Weekly', 'Bi-Weekly', 'Monthly', 'Quarterly', 'Annual', 'As Needed']
  }
};

// Initialize when spreadsheet opens
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Meeting Management')
    .addItem('📅 Schedule New Meeting', 'menuScheduleMeeting')
    .addItem('🎤 Assign Speaker to Topic', 'menuAssignSpeaker')
    .addSeparator()
    .addItem('📜 Generate Speaker Rotation', 'menuGenerateRotation')
    .addItem('📧 Send Meeting Agenda', 'menuSendAgenda')
    .addSeparator()
    .addItem('✅ Record Attendance', 'menuRecordAttendance')
    .addItem('📝 Record Meeting Minutes', 'menuRecordMinutes')
    .addSeparator()
    .addItem('📚 Add Topic to Library', 'menuAddTopic')
    .addItem('🗳️ View Topic History', 'menuViewTopics')
    .addSeparator()
    .addItem('📊 Speaker Report', 'menuSpeakerReport')
    .addItem('👥 Attendance Report', 'menuAttendanceReport')
    .addItem('📈 Meeting Analytics', 'menuAnalytics')
    .addSeparator()
    .addItem('⚙️ Settings & Documentation', 'menuShowDocumentation')
    .addToUi();
}

// Menu: Schedule New Meeting
function menuScheduleMeeting() {
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      input, select, textarea { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
      label { display: block; margin-top: 15px; font-weight: bold; }
      button { padding: 12px 24px; background: #4285F4; color: white; border: none; cursor: pointer; font-size: 16px; border-radius: 4px; }
      button:hover { background: #357AE8; }
      .section { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 4px; }
      .help { font-size: 12px; color: #666; margin-top: 5px; }
    </style>
    <h2>📅 Schedule New Meeting</h2>
    <form>
      <div class="section">
        <label>Meeting Date: *
          <input type="date" id="date" required>
        </label>

        <label>Meeting Time: *
          <input type="time" id="time" required>
        </label>

        <label>Location: *
          <input type="text" id="location" placeholder="e.g., Community Hall, Zoom Link" required>
        </label>
      </div>

      <div class="section">
        <label>Select Topic: *
          <select id="topic" required>
            <option value="">Loading topics...</option>
          </select>
        </label>
        <div class="help">Or leave blank to select new topic below</div>
      </div>

      <div class="section">
        <label>Primary Speaker: *
          <input type="text" id="speaker" placeholder="Speaker name" required>
        </label>

        <label>Facilitator: (Optional)
          <input type="text" id="facilitator" placeholder="Who will facilitate the discussion">
        </label>
      </div>

      <div class="section">
        <label>Expected Attendance:
          <input type="number" id="attendance" placeholder="e.g., 25" min="0">
        </label>

        <label>Description / Agenda:
          <textarea id="description" placeholder="Meeting agenda and discussion points..." rows="4"></textarea>
        </label>
      </div>

      <button onclick="scheduleMeeting()">Schedule Meeting</button>
    </form>

    <script>
      function scheduleMeeting() {
        const data = {
          date: document.getElementById('date').value,
          time: document.getElementById('time').value,
          location: document.getElementById('location').value,
          topic: document.getElementById('topic').value,
          speaker: document.getElementById('speaker').value,
          facilitator: document.getElementById('facilitator').value,
          attendance: document.getElementById('attendance').value,
          description: document.getElementById('description').value
        };

        if (!data.date || !data.time || !data.location || !data.speaker) {
          alert('Please fill in all required fields');
          return;
        }

        google.script.run.createMeeting(data, function(result) {
          if (result.success) {
            alert('Meeting scheduled successfully! Meeting ID: ' + result.meetingId);
            google.script.host.close();
          } else {
            alert('Error: ' + result.error);
          }
        });
      }

      google.script.run.getTopicsForDropdown(function(topics) {
        const select = document.getElementById('topic');
        select.innerHTML = '<option value="">-- Select Existing Topic --</option>';
        topics.forEach(topic => {
          const option = document.createElement('option');
          option.value = topic.id;
          option.text = topic.title + ' (' + topic.category + ')';
          select.appendChild(option);
        });
      });
    </script>
  `);
  ui.showModalDialog(htmlOutput, 'Schedule New Meeting');
}

// Create new meeting
function createMeeting(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const existingData = sheet.getDataRange().getValues();

    // Generate Meeting ID
    const meetingId = `MET-${String(existingData.length).padStart(4, '0')}`;
    const createdDate = new Date();

    // Get topic title if selected
    let topicTitle = 'Other';
    if (data.topic) {
      const topicSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
      const topicData = topicSheet.getDataRange().getValues();
      for (let i = 1; i < topicData.length; i++) {
        if (topicData[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID] === data.topic) {
          topicTitle = topicData[i][MEETING_CONFIG.COLUMNS.TOPICS.TITLE];
          break;
        }
      }
    } else {
      topicTitle = data.speaker + ' - ' + data.description.substring(0, 20);
    }

    // Add meeting to schedule
    sheet.appendRow([
      meetingId,
      new Date(data.date),
      data.time,
      data.location,
      data.topic || '',
      topicTitle,
      data.speaker,
      data.facilitator,
      data.attendance || '',
      'Scheduled',
      data.description,
      '',
      '',
      createdDate
    ]);

    logMeetingAction('Schedule Meeting', `${meetingId}: ${topicTitle} on ${data.date} at ${data.time}`);

    return { success: true, meetingId: meetingId };
  } catch (error) {
    logMeetingAction('Schedule Meeting Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get topics for dropdown
function getTopicsForDropdown() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const data = sheet.getDataRange().getValues();
    const topics = [];

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.TOPICS.STATUS] === 'Active') {
        topics.push({
          id: data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID],
          title: data[i][MEETING_CONFIG.COLUMNS.TOPICS.TITLE],
          category: data[i][MEETING_CONFIG.COLUMNS.TOPICS.CATEGORY]
        });
      }
    }

    return topics;
  } catch (error) {
    console.log('Error getting topics: ' + error.toString());
    return [];
  }
}

// Menu: Assign Speaker
function menuAssignSpeaker() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Enter Meeting ID to assign speaker:\n(e.g., MET-0001)', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const meetingId = response.getResponseText();
    const speakerResponse = ui.prompt('Enter speaker name:', ui.ButtonSet.OK_CANCEL);

    if (speakerResponse.getSelectedButton() === ui.Button.OK) {
      const speaker = speakerResponse.getResponseText();
      const result = assignSpeaker(meetingId, speaker);
      if (result.success) {
        ui.alert('Speaker assigned successfully!');
      } else {
        ui.alert('Error: ' + result.error);
      }
    }
  }
}

// Assign speaker to meeting
function assignSpeaker(meetingId, speaker) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID] === meetingId) {
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SCHEDULE.PRIMARY_SPEAKER + 1).setValue(speaker);
        logMeetingAction('Assign Speaker', `${meetingId} → ${speaker}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Meeting not found' };
  } catch (error) {
    logMeetingAction('Assign Speaker Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Menu: Generate Speaker Rotation
function menuGenerateRotation() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.alert('Generate speaker rotation based on fairness and availability?', ui.ButtonSet.YES_NO);

  if (response === ui.Button.YES) {
    const result = generateSpeakerRotation();
    ui.alert(`Generated rotation: ${result.count} speakers ready.\n\nNext 3 speakers:\n1. ${result.nextThree[0]}\n2. ${result.nextThree[1]}\n3. ${result.nextThree[2]}`);
  }
}

// Generate speaker rotation
function generateSpeakerRotation() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const speakersSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = speakersSheet.getDataRange().getValues();

    const speakers = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.WILLING_TO_SPEAK] !== false &&
          data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.WILLING_TO_SPEAK] !== 'No') {
        speakers.push({
          name: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME],
          timeSpoken: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN] || 0,
          lastDate: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.LAST_SPEAKING_DATE] || new Date(2000, 0, 1)
        });
      }
    }

    // Sort by times spoken (ascending) then by last speaking date
    speakers.sort((a, b) => {
      if (a.timeSpoken !== b.timeSpoken) {
        return a.timeSpoken - b.timeSpoken;
      }
      return new Date(a.lastDate) - new Date(b.lastDate);
    });

    const nextThree = speakers.slice(0, 3).map(s => s.name);

    logMeetingAction('Generate Rotation', `Created rotation. Next speakers: ${nextThree.join(', ')}`);

    return { success: true, count: speakers.length, nextThree: nextThree };
  } catch (error) {
    logMeetingAction('Generate Rotation Error', error.toString());
    return { success: false, count: 0, nextThree: ['Error', 'Error', 'Error'] };
  }
}

// Menu: Send Agenda
function menuSendAgenda() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Send agenda for which Meeting ID?\n(e.g., MET-0001)', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const meetingId = response.getResponseText();
    const result = sendMeetingAgenda(meetingId);
    if (result.success) {
      ui.alert(`Agenda sent to ${result.recipients} members`);
    } else {
      ui.alert('Error: ' + result.error);
    }
  }
}

// Send meeting agenda
function sendMeetingAgenda(meetingId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID] === meetingId) {
        const meeting = {
          id: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID],
          date: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DATE],
          time: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TIME],
          location: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.LOCATION],
          topic: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.TOPIC_TITLE],
          speaker: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.PRIMARY_SPEAKER],
          description: data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.DESCRIPTION]
        };

        // Get all speakers (from SPEAKERS sheet or from meeting attendees)
        const speakersSheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
        const speakersData = speakersSheet.getDataRange().getValues();
        let sentCount = 0;

        for (let j = 1; j < speakersData.length; j++) {
          const email = speakersData[j][MEETING_CONFIG.COLUMNS.SPEAKERS.EMAIL];
          const name = speakersData[j][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME];

          if (email) {
            sendAgendaEmail(email, name, meeting);
            sentCount++;
          }
        }

        logMeetingAction('Send Agenda', `${meetingId} sent to ${sentCount} recipients`);
        return { success: true, recipients: sentCount };
      }
    }

    return { success: false, error: 'Meeting not found' };
  } catch (error) {
    logMeetingAction('Send Agenda Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Menu: Record Attendance
function menuRecordAttendance() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt('Enter Meeting ID for attendance recording:\n(e.g., MET-0001)', ui.ButtonSet.OK_CANCEL);

  if (response.getSelectedButton() === ui.Button.OK) {
    const meetingId = response.getResponseText();
    ui.alert('Go to Attendance sheet and add rows:\nMeeting ID | Speaker Name | Attended (Yes/No) | Notes');
  }
}

// Menu: Record Minutes
function menuRecordMinutes() {
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      input, select, textarea { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
      label { display: block; margin-top: 15px; font-weight: bold; }
      button { padding: 12px 24px; background: #4285F4; color: white; border: none; cursor: pointer; font-size: 16px; border-radius: 4px; }
      button:hover { background: #357AE8; }
    </style>
    <h2>📝 Record Meeting Minutes</h2>
    <form>
      <label>Meeting ID: *
        <input type="text" id="meetingId" placeholder="e.g., MET-0001" required>
      </label>

      <label>Key Discussion Points:
        <textarea id="keyPoints" placeholder="Main topics discussed..." rows="3"></textarea>
      </label>

      <label>Decisions Made:
        <textarea id="decisions" placeholder="What was decided..." rows="3"></textarea>
      </label>

      <label>Action Items (What, Who, By When):
        <textarea id="actionItems" placeholder="1. Task - Owner - Due Date
2. Task - Owner - Due Date" rows="4"></textarea>
      </label>

      <label>Next Steps:
        <textarea id="nextSteps" placeholder="What happens next..." rows="3"></textarea>
      </label>

      <button onclick="saveMinutes()">Save Minutes</button>
    </form>

    <script>
      function saveMinutes() {
        const data = {
          meetingId: document.getElementById('meetingId').value,
          keyPoints: document.getElementById('keyPoints').value,
          decisions: document.getElementById('decisions').value,
          actionItems: document.getElementById('actionItems').value,
          nextSteps: document.getElementById('nextSteps').value
        };

        if (!data.meetingId) {
          alert('Please enter Meeting ID');
          return;
        }

        google.script.run.saveMinutes(data, function(result) {
          if (result.success) {
            alert('Minutes saved successfully!');
            google.script.host.close();
          } else {
            alert('Error: ' + result.error);
          }
        });
      }
    </script>
  `);
  ui.showModalDialog(htmlOutput, 'Record Meeting Minutes');
}

// Save meeting minutes
function saveMinutes(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);

    sheet.appendRow([
      data.meetingId,
      new Date(),
      data.keyPoints,
      data.decisions,
      data.actionItems,
      '', // Owners extracted from action items
      '', // Due dates extracted from action items
      data.nextSteps,
      Session.getEffectiveUser().getEmail(),
      'Draft'
    ]);

    logMeetingAction('Record Minutes', `${data.meetingId} minutes saved as draft`);
    return { success: true };
  } catch (error) {
    logMeetingAction('Record Minutes Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Menu: Add Topic
function menuAddTopic() {
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 20px; }
      input, select, textarea { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
      label { display: block; margin-top: 15px; font-weight: bold; }
      button { padding: 12px 24px; background: #4285F4; color: white; border: none; cursor: pointer; font-size: 16px; border-radius: 4px; }
      button:hover { background: #357AE8; }
    </style>
    <h2>📚 Add Topic to Library</h2>
    <form>
      <label>Topic Title: *
        <input type="text" id="title" placeholder="e.g., Financial Planning for Communities" required>
      </label>

      <label>Category: *
        <select id="category" required>
          <option value="">Select Category</option>
          <option value="Finance">Finance & Budgeting</option>
          <option value="Growth">Growth & Development</option>
          <option value="Leadership">Leadership</option>
          <option value="Wellness">Wellness & Health</option>
          <option value="Culture">Culture & Values</option>
          <option value="Governance">Governance</option>
          <option value="Social">Social Impact</option>
          <option value="Other">Other</option>
        </select>
      </label>

      <label>Description:
        <textarea id="description" placeholder="What is this topic about?" rows="3"></textarea>
      </label>

      <label>Expected Duration (minutes):
        <input type="number" id="duration" placeholder="45" min="15" max="300">
      </label>

      <label>Difficulty Level:
        <select id="difficulty">
          <option value="Beginner">Beginner</option>
          <option value="Intermediate" selected>Intermediate</option>
          <option value="Advanced">Advanced</option>
        </select>
      </label>

      <label>Recommended Frequency:
        <select id="frequency">
          <option value="As Needed" selected>As Needed</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Annual">Annual</option>
        </select>
      </label>

      <button onclick="addTopic()">Add to Library</button>
    </form>

    <script>
      function addTopic() {
        const data = {
          title: document.getElementById('title').value,
          category: document.getElementById('category').value,
          description: document.getElementById('description').value,
          duration: document.getElementById('duration').value || 45,
          difficulty: document.getElementById('difficulty').value,
          frequency: document.getElementById('frequency').value
        };

        if (!data.title || !data.category) {
          alert('Please fill in required fields');
          return;
        }

        google.script.run.addTopic(data, function(result) {
          if (result.success) {
            alert('Topic added: ' + result.topicId);
            google.script.host.close();
          } else {
            alert('Error: ' + result.error);
          }
        });
      }
    </script>
  `);
  ui.showModalDialog(htmlOutput, 'Add Topic to Library');
}

// Add topic to library
function addTopic(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const existingData = sheet.getDataRange().getValues();

    const topicId = `TOP-${String(existingData.length).padStart(4, '0')}`;

    sheet.appendRow([
      topicId,
      data.title,
      data.category,
      data.description,
      data.duration,
      data.difficulty,
      '',
      '',
      data.frequency,
      'Active'
    ]);

    logMeetingAction('Add Topic', `${topicId}: ${data.title}`);
    return { success: true, topicId: topicId };
  } catch (error) {
    logMeetingAction('Add Topic Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Menu: View Topics
function menuViewTopics() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
  const data = sheet.getDataRange().getValues();

  let html = '<table style="width:100%; border-collapse: collapse;"><tr style="background: #4285F4; color: white;"><th style="border: 1px solid #ddd; padding: 10px;">ID</th><th style="border: 1px solid #ddd; padding: 10px;">Title</th><th style="border: 1px solid #ddd; padding: 10px;">Category</th><th style="border: 1px solid #ddd; padding: 10px;">Difficulty</th><th style="border: 1px solid #ddd; padding: 10px;">Status</th></tr>';

  for (let i = 1; i < data.length; i++) {
    html += `<tr style="background: ${i % 2 === 0 ? '#f9f9f9' : 'white'};">
      <td style="border: 1px solid #ddd; padding: 10px;">${data[i][0]}</td>
      <td style="border: 1px solid #ddd; padding: 10px;">${data[i][1]}</td>
      <td style="border: 1px solid #ddd; padding: 10px;">${data[i][2]}</td>
      <td style="border: 1px solid #ddd; padding: 10px;">${data[i][5]}</td>
      <td style="border: 1px solid #ddd; padding: 10px;">${data[i][9]}</td>
    </tr>`;
  }

  html += '</table>';

  const htmlOutput = HtmlService.createHtmlOutput(html);
  ui.showModalDialog(htmlOutput, 'Topic Library');
}

// Menu: Speaker Report
function menuSpeakerReport() {
  const report = generateSpeakerReport();
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(report.html);
  ui.showModalDialog(htmlOutput, 'Speaker Report');
}

// Menu: Attendance Report
function menuAttendanceReport() {
  const report = generateAttendanceReport();
  const ui = SpreadsheetApp.getUi();
  const htmlOutput = HtmlService.createHtmlOutput(report.html);
  ui.showModalDialog(htmlOutput, 'Attendance Report');
}

// Menu: Analytics
function menuAnalytics() {
  const ui = SpreadsheetApp.getUi();
  const analytics = generateMeetingAnalytics();
  const htmlOutput = HtmlService.createHtmlOutput(analytics.html);
  ui.showModalDialog(htmlOutput, 'Meeting Analytics');
}

// Menu: Settings & Documentation
function menuShowDocumentation() {
  const htmlOutput = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial; padding: 30px; max-width: 900px; line-height: 1.6; }
      h1 { color: #1f2937; border-bottom: 3px solid #4285F4; padding-bottom: 10px; }
      h2 { color: #374151; margin-top: 30px; }
      code { background: #f3f4f6; padding: 2px 6px; border-radius: 3px; }
      .feature-box { background: #f0f9ff; border-left: 4px solid #4285F4; padding: 15px; margin: 15px 0; }
      ul { padding-left: 20px; }
      li { margin: 8px 0; }
    </style>
    <h1>📘 Meeting Management System - Quick Start</h1>

    <h2>✨ Features</h2>
    <ul>
      <li>Schedule meetings with dates, times, topics, and speakers</li>
      <li>Automated speaker rotation and fair assignment</li>
      <li>Send meeting agendas to all members</li>
      <li>Track attendance and participation</li>
      <li>Record meeting minutes and action items</li>
      <li>Maintain topic library for future discussions</li>
      <li>Generate reports on speakers and attendance</li>
      <li>Complete meeting analytics</li>
    </ul>

    <h2>🚀 Getting Started</h2>
    <div class="feature-box">
      <h3>1. Setup Your Spreadsheet</h3>
      <p>Create a new Google Sheet for "Community Meeting Manager"</p>
      <p>Create these sheets: Meeting_Schedule, Topics, Speaker_Rotation, Attendance, Meeting_Minutes, Discussion_Resources, Settings, Logs</p>
    </div>

    <div class="feature-box">
      <h3>2. Deploy the Apps Script</h3>
      <p>Go to Extensions → Apps Script</p>
      <p>Paste all .gs files and save</p>
      <p>Authorize permissions when prompted</p>
    </div>

    <div class="feature-box">
      <h3>3. Configure Settings</h3>
      <p>Add to Settings sheet:</p>
      <p>Organization Name | Meeting Time | Default Location | etc.</p>
    </div>

    <h2>📞 Support</h2>
    <p>See MEETING_USER_GUIDE.md for detailed instructions</p>
  `);
  SpreadsheetApp.getUi().showModalDialog(htmlOutput, 'Meeting Management System Documentation');
}

// Log actions
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
