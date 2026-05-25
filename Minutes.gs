// Meeting Minutes and Action Items Functions

// Add or update meeting minutes
function updateMeetingMinutes(meetingId, keyPoints, decisions, actionItems, nextSteps) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    // Check if minutes exist
    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID] === meetingId) {
        // Update existing minutes
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.KEY_POINTS + 1).setValue(keyPoints);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.DECISIONS + 1).setValue(decisions);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.ACTION_ITEMS + 1).setValue(actionItems);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.NEXT_STEPS + 1).setValue(nextSteps);
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.STATUS + 1).setValue('Draft');
        logMeetingAction('Update Minutes', `${meetingId} updated`);
        return { success: true, updated: true };
      }
    }

    // Add new minutes
    sheet.appendRow([
      meetingId,
      new Date(),
      keyPoints,
      decisions,
      actionItems,
      '', // Owners
      '', // Due dates
      nextSteps,
      Session.getEffectiveUser().getEmail(),
      'Draft'
    ]);

    logMeetingAction('Record Minutes', `${meetingId} minutes created`);
    return { success: true, updated: false };
  } catch (error) {
    logMeetingAction('Update Minutes Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get meeting minutes
function getMeetingMinutes(meetingId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID] === meetingId) {
        return {
          meetingId: meetingId,
          date: data[i][MEETING_CONFIG.COLUMNS.MINUTES.DATE],
          keyPoints: data[i][MEETING_CONFIG.COLUMNS.MINUTES.KEY_POINTS],
          decisions: data[i][MEETING_CONFIG.COLUMNS.MINUTES.DECISIONS],
          actionItems: data[i][MEETING_CONFIG.COLUMNS.MINUTES.ACTION_ITEMS],
          owners: data[i][MEETING_CONFIG.COLUMNS.MINUTES.OWNERS],
          dueDates: data[i][MEETING_CONFIG.COLUMNS.MINUTES.DUE_DATES],
          nextSteps: data[i][MEETING_CONFIG.COLUMNS.MINUTES.NEXT_STEPS],
          recordedBy: data[i][MEETING_CONFIG.COLUMNS.MINUTES.RECORDED_BY],
          status: data[i][MEETING_CONFIG.COLUMNS.MINUTES.STATUS]
        };
      }
    }

    return null;
  } catch (error) {
    console.log('Error getting minutes: ' + error.toString());
    return null;
  }
}

// Parse action items from minutes
function parseActionItems(actionItemsText) {
  try {
    const lines = actionItemsText.split('\n').filter(line => line.trim());
    const items = [];

    lines.forEach(line => {
      // Format: "Task - Owner - Due Date" or "Task"
      const parts = line.split('-').map(part => part.trim());

      if (parts.length >= 2) {
        items.push({
          task: parts[0],
          owner: parts[1],
          dueDate: parts[2] || ''
        });
      } else if (parts.length === 1) {
        items.push({
          task: parts[0],
          owner: '',
          dueDate: ''
        });
      }
    });

    return items;
  } catch (error) {
    console.log('Error parsing action items: ' + error.toString());
    return [];
  }
}

// Add action item
function addActionItem(meetingId, task, owner, dueDate) {
  try {
    const minutes = getMeetingMinutes(meetingId);
    if (!minutes) {
      return { success: false, error: 'Minutes not found for meeting' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID] === meetingId) {
        const row = i + 1;
        const currentItems = data[i][MEETING_CONFIG.COLUMNS.MINUTES.ACTION_ITEMS] || '';
        const newItem = `${task} - ${owner} - ${dueDate}`;
        const updatedItems = currentItems ? currentItems + '\n' + newItem : newItem;

        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.ACTION_ITEMS + 1).setValue(updatedItems);
        logMeetingAction('Add Action Item', `${meetingId}: ${task}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Minutes not found' };
  } catch (error) {
    logMeetingAction('Add Action Item Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Approve meeting minutes
function approveMinutes(meetingId, approvingOfficer) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID] === meetingId) {
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.MINUTES.STATUS + 1).setValue('Approved');
        logMeetingAction('Approve Minutes', `${meetingId} approved by ${approvingOfficer}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Minutes not found' };
  } catch (error) {
    logMeetingAction('Approve Minutes Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get open action items
function getOpenActionItems() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    const openItems = [];

    for (let i = 1; i < data.length; i++) {
      const actionItems = data[i][MEETING_CONFIG.COLUMNS.MINUTES.ACTION_ITEMS] || '';
      if (actionItems) {
        const items = parseActionItems(actionItems);
        items.forEach(item => {
          if (item.dueDate) {
            const dueDate = new Date(item.dueDate);
            if (dueDate >= new Date()) {
              openItems.push({
                meetingId: data[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID],
                task: item.task,
                owner: item.owner,
                dueDate: item.dueDate,
                status: 'Open'
              });
            }
          }
        });
      }
    }

    // Sort by due date
    openItems.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return openItems;
  } catch (error) {
    console.log('Error getting open items: ' + error.toString());
    return [];
  }
}

// Get overdue action items
function getOverdueActionItems() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    const overdueItems = [];
    const today = new Date();

    for (let i = 1; i < data.length; i++) {
      const actionItems = data[i][MEETING_CONFIG.COLUMNS.MINUTES.ACTION_ITEMS] || '';
      if (actionItems) {
        const items = parseActionItems(actionItems);
        items.forEach(item => {
          if (item.dueDate) {
            const dueDate = new Date(item.dueDate);
            if (dueDate < today) {
              overdueItems.push({
                meetingId: data[i][MEETING_CONFIG.COLUMNS.MINUTES.MEETING_ID],
                task: item.task,
                owner: item.owner,
                dueDate: item.dueDate,
                status: 'Overdue',
                daysOverdue: Math.floor((today - dueDate) / (1000 * 60 * 60 * 24))
              });
            }
          }
        });
      }
    }

    // Sort by days overdue (descending)
    overdueItems.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return overdueItems;
  } catch (error) {
    console.log('Error getting overdue items: ' + error.toString());
    return [];
  }
}

// Send action item reminders
function sendActionItemReminders() {
  try {
    const openItems = getOpenActionItems();
    const settings = getMeetingSettings();
    let sentCount = 0;

    openItems.forEach(item => {
      const daysUntilDue = Math.floor((new Date(item.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

      // Send reminder if due within 3 days
      if (daysUntilDue <= 3 && daysUntilDue > 0) {
        sendActionItemReminderEmail(item.owner, item.task, item.dueDate, settings);
        sentCount++;
      }
    });

    logMeetingAction('Send Action Item Reminders', `Sent ${sentCount} reminders`);
    return { success: true, count: sentCount };
  } catch (error) {
    logMeetingAction('Action Item Reminder Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get action items for a specific owner
function getActionItemsForOwner(ownerName) {
  try {
    const openItems = getOpenActionItems();
    return openItems.filter(item => item.owner === ownerName);
  } catch (error) {
    console.log('Error getting items: ' + error.toString());
    return [];
  }
}

// Export minutes report
function exportMinutesReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.MINUTES);
    const data = sheet.getDataRange().getValues();

    let csv = 'Meeting ID,Date,Status,Key Points,Decisions\n';

    for (let i = 1; i < data.length; i++) {
      csv += `"${data[i][0]}","${data[i][1]}","${data[i][9]}","${data[i][2]}","${data[i][3]}"\n`;
    }

    return csv;
  } catch (error) {
    console.log('Error exporting: ' + error.toString());
    return null;
  }
}
