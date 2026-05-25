// Speaker Rotation and Management Functions

// Add speaker to rotation
function addSpeaker(name, email, expertise, willingSpeaker) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    const speakerId = `SPK-${String(data.length).padStart(4, '0')}`;

    sheet.appendRow([
      speakerId,
      name,
      0, // Times spoken
      '', // Last speaking date
      '', // Topics spoken
      0, // Rating (out of 5)
      expertise,
      willingSpeaker ? 'Yes' : 'No',
      '', // Preferred topics
      email
    ]);

    logMeetingAction('Add Speaker', `${speakerId}: ${name}`);
    return { success: true, speakerId: speakerId };
  } catch (error) {
    logMeetingAction('Add Speaker Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get next fair speaker based on rotation
function getNextFairSpeaker() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    const speakers = [];
    for (let i = 1; i < data.length; i++) {
      const willing = data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.WILLING_TO_SPEAK];
      if (willing !== false && willing !== 'No') {
        speakers.push({
          index: i + 1,
          name: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME],
          timeSpoken: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN] || 0,
          lastDate: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.LAST_SPEAKING_DATE] || new Date(2000, 0, 1)
        });
      }
    }

    // Sort by times spoken (ascending) then by last date
    speakers.sort((a, b) => {
      if (a.timeSpoken !== b.timeSpoken) {
        return a.timeSpoken - b.timeSpoken;
      }
      return new Date(a.lastDate) - new Date(b.lastDate);
    });

    return speakers.length > 0 ? speakers[0] : null;
  } catch (error) {
    console.log('Error getting next speaker: ' + error.toString());
    return null;
  }
}

// Auto-assign next speaker to meeting
function autoAssignNextSpeaker(meetingId) {
  try {
    const nextSpeaker = getNextFairSpeaker();
    if (!nextSpeaker) {
      return { success: false, error: 'No speakers available' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SCHEDULE);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SCHEDULE.MEETING_ID] === meetingId) {
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SCHEDULE.PRIMARY_SPEAKER + 1).setValue(nextSpeaker.name);
        logMeetingAction('Auto-Assign Speaker', `${meetingId} → ${nextSpeaker.name}`);
        return { success: true, speaker: nextSpeaker.name };
      }
    }

    return { success: false, error: 'Meeting not found' };
  } catch (error) {
    logMeetingAction('Auto-Assign Speaker Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Update speaker stats after meeting
function updateSpeakerStats(speakerName, meetingDate, topicSpoken) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME] === speakerName) {
        const row = i + 1;
        const currentCount = (data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN] || 0) + 1;
        const currentTopics = data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TOPICS_SPOKEN] || '';
        const topicsList = currentTopics ? currentTopics + ', ' + topicSpoken : topicSpoken;

        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN + 1).setValue(currentCount);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SPEAKERS.LAST_SPEAKING_DATE + 1).setValue(new Date(meetingDate));
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SPEAKERS.TOPICS_SPOKEN + 1).setValue(topicsList);

        logMeetingAction('Update Speaker Stats', `${speakerName}: ${currentCount} times`);
        return { success: true };
      }
    }

    return { success: false, error: 'Speaker not found' };
  } catch (error) {
    logMeetingAction('Update Speaker Stats Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Rate a speaker after meeting
function rateSpeaker(speakerName, rating, feedback) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME] === speakerName) {
        const row = i + 1;
        // Calculate new average rating
        const currentRating = parseFloat(data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.RATING]) || 0;
        const timesSpoken = parseFloat(data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN]) || 1;
        const newAverage = (currentRating * (timesSpoken - 1) + rating) / timesSpoken;

        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SPEAKERS.RATING + 1).setValue(newAverage.toFixed(2));

        logMeetingAction('Rate Speaker', `${speakerName}: ${rating}/5 - ${feedback}`);
        return { success: true, newRating: newAverage.toFixed(2) };
      }
    }

    return { success: false, error: 'Speaker not found' };
  } catch (error) {
    logMeetingAction('Rate Speaker Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get all speakers
function getAllSpeakers() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    const speakers = [];
    for (let i = 1; i < data.length; i++) {
      speakers.push({
        id: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_ID],
        name: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME],
        timeSpoken: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN] || 0,
        lastDate: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.LAST_SPEAKING_DATE],
        rating: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.RATING] || 0,
        expertise: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.EXPERTISE_AREAS],
        willing: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.WILLING_TO_SPEAK],
        email: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.EMAIL]
      });
    }

    return speakers;
  } catch (error) {
    console.log('Error getting speakers: ' + error.toString());
    return [];
  }
}

// Get speaker by name
function getSpeakerByName(name) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME] === name) {
        return {
          id: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_ID],
          name: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME],
          timeSpoken: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.TIMES_SPOKEN] || 0,
          rating: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.RATING] || 0,
          email: data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.EMAIL]
        };
      }
    }

    return null;
  } catch (error) {
    console.log('Error getting speaker: ' + error.toString());
    return null;
  }
}

// Toggle speaker availability
function toggleSpeakerAvailability(speakerName) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.SPEAKERS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.SPEAKER_NAME] === speakerName) {
        const row = i + 1;
        const currentStatus = data[i][MEETING_CONFIG.COLUMNS.SPEAKERS.WILLING_TO_SPEAK];
        const newStatus = currentStatus === 'Yes' ? 'No' : 'Yes';

        sheet.getRange(row, MEETING_CONFIG.COLUMNS.SPEAKERS.WILLING_TO_SPEAK + 1).setValue(newStatus);
        logMeetingAction('Toggle Speaker Availability', `${speakerName}: ${newStatus}`);
        return { success: true, newStatus: newStatus };
      }
    }

    return { success: false, error: 'Speaker not found' };
  } catch (error) {
    logMeetingAction('Toggle Availability Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get speaker statistics
function getSpeakerStats(speakerName) {
  try {
    const speaker = getSpeakerByName(speakerName);
    if (!speaker) {
      return { success: false, error: 'Speaker not found' };
    }

    return {
      success: true,
      name: speaker.name,
      timeSpoken: speaker.timeSpoken,
      rating: speaker.rating,
      nextToSpeak: getNextFairSpeaker()?.name === speakerName
    };
  } catch (error) {
    console.log('Error getting speaker stats: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// Export speaker report
function exportSpeakerReport() {
  try {
    const speakers = getAllSpeakers();
    speakers.sort((a, b) => {
      if (a.timeSpoken !== b.timeSpoken) {
        return b.timeSpoken - a.timeSpoken;
      }
      return b.rating - a.rating;
    });

    let csv = 'Speaker Name,Times Spoken,Rating,Last Date,Expertise,Willing\n';
    speakers.forEach(speaker => {
      csv += `"${speaker.name}",${speaker.timeSpoken},${speaker.rating},"${speaker.lastDate}","${speaker.expertise}","${speaker.willing}"\n`;
    });

    return csv;
  } catch (error) {
    console.log('Error exporting: ' + error.toString());
    return null;
  }
}
