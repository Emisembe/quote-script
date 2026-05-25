// Topic Library Management Functions

// Get all topics
function getAllTopics() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const data = sheet.getDataRange().getValues();

    const topics = [];
    for (let i = 1; i < data.length; i++) {
      topics.push({
        id: data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID],
        title: data[i][MEETING_CONFIG.COLUMNS.TOPICS.TITLE],
        category: data[i][MEETING_CONFIG.COLUMNS.TOPICS.CATEGORY],
        description: data[i][MEETING_CONFIG.COLUMNS.TOPICS.DESCRIPTION],
        duration: data[i][MEETING_CONFIG.COLUMNS.TOPICS.DURATION_MIN],
        difficulty: data[i][MEETING_CONFIG.COLUMNS.TOPICS.DIFFICULTY],
        resourceLinks: data[i][MEETING_CONFIG.COLUMNS.TOPICS.RESOURCE_LINKS],
        lastDiscussed: data[i][MEETING_CONFIG.COLUMNS.TOPICS.LAST_DISCUSSED],
        frequency: data[i][MEETING_CONFIG.COLUMNS.TOPICS.FREQUENCY],
        status: data[i][MEETING_CONFIG.COLUMNS.TOPICS.STATUS]
      });
    }

    return topics;
  } catch (error) {
    console.log('Error getting topics: ' + error.toString());
    return [];
  }
}

// Get topics by category
function getTopicsByCategory(category) {
  try {
    const topics = getAllTopics();
    return topics.filter(topic => topic.category === category && topic.status === 'Active');
  } catch (error) {
    console.log('Error getting topics by category: ' + error.toString());
    return [];
  }
}

// Get topic by ID
function getTopicById(topicId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID] === topicId) {
        return {
          id: data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID],
          title: data[i][MEETING_CONFIG.COLUMNS.TOPICS.TITLE],
          category: data[i][MEETING_CONFIG.COLUMNS.TOPICS.CATEGORY],
          description: data[i][MEETING_CONFIG.COLUMNS.TOPICS.DESCRIPTION],
          duration: data[i][MEETING_CONFIG.COLUMNS.TOPICS.DURATION_MIN],
          difficulty: data[i][MEETING_CONFIG.COLUMNS.TOPICS.DIFFICULTY],
          resourceLinks: data[i][MEETING_CONFIG.COLUMNS.TOPICS.RESOURCE_LINKS],
          lastDiscussed: data[i][MEETING_CONFIG.COLUMNS.TOPICS.LAST_DISCUSSED],
          frequency: data[i][MEETING_CONFIG.COLUMNS.TOPICS.FREQUENCY],
          status: data[i][MEETING_CONFIG.COLUMNS.TOPICS.STATUS]
        };
      }
    }

    return null;
  } catch (error) {
    console.log('Error getting topic: ' + error.toString());
    return null;
  }
}

// Update topic last discussed date
function updateTopicLastDiscussed(topicId, discussionDate) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID] === topicId) {
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.TOPICS.LAST_DISCUSSED + 1).setValue(new Date(discussionDate));
        logMeetingAction('Update Topic', `${topicId} last discussed on ${discussionDate}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Topic not found' };
  } catch (error) {
    logMeetingAction('Update Topic Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Archive a topic
function archiveTopic(topicId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID] === topicId) {
        const row = i + 1;
        sheet.getRange(row, MEETING_CONFIG.COLUMNS.TOPICS.STATUS + 1).setValue('Archived');
        logMeetingAction('Archive Topic', `${topicId} archived`);
        return { success: true };
      }
    }

    return { success: false, error: 'Topic not found' };
  } catch (error) {
    logMeetingAction('Archive Topic Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get topics due for discussion
function getTopicsDueForDiscussion() {
  try {
    const topics = getAllTopics().filter(t => t.status === 'Active');
    const dueTopics = [];
    const today = new Date();

    topics.forEach(topic => {
      const lastDiscussed = topic.lastDiscussed ? new Date(topic.lastDiscussed) : new Date(2000, 0, 1);
      let daysSinceDiscussed = Math.floor((today - lastDiscussed) / (1000 * 60 * 60 * 24));

      // Determine days until due based on frequency
      let daysDue = 0;
      switch (topic.frequency) {
        case 'Weekly':
          daysDue = 7;
          break;
        case 'Bi-Weekly':
          daysDue = 14;
          break;
        case 'Monthly':
          daysDue = 30;
          break;
        case 'Quarterly':
          daysDue = 90;
          break;
        case 'Annual':
          daysDue = 365;
          break;
        default:
          daysDue = Infinity; // As needed
      }

      if (daysSinceDiscussed >= daysDue) {
        dueTopics.push({
          id: topic.id,
          title: topic.title,
          category: topic.category,
          daysSinceLast: daysSinceDiscussed,
          daysOverdue: daysSinceDiscussed - daysDue
        });
      }
    });

    // Sort by days overdue
    dueTopics.sort((a, b) => b.daysOverdue - a.daysOverdue);

    return dueTopics;
  } catch (error) {
    console.log('Error getting due topics: ' + error.toString());
    return [];
  }
}

// Suggest next topic based on recency and frequency
function suggestNextTopic() {
  try {
    const dueTopics = getTopicsDueForDiscussion();

    if (dueTopics.length > 0) {
      return dueTopics[0]; // Most overdue
    }

    // If no overdue topics, suggest newest active topic
    const activeTopics = getAllTopics().filter(t => t.status === 'Active');
    if (activeTopics.length > 0) {
      return activeTopics[0];
    }

    return null;
  } catch (error) {
    console.log('Error suggesting topic: ' + error.toString());
    return null;
  }
}

// Add resource to topic
function addTopicResource(topicId, resourceTitle, resourceLink) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(MEETING_CONFIG.SHEET_NAMES.TOPICS);
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][MEETING_CONFIG.COLUMNS.TOPICS.TOPIC_ID] === topicId) {
        const row = i + 1;
        const currentResources = data[i][MEETING_CONFIG.COLUMNS.TOPICS.RESOURCE_LINKS] || '';
        const newResource = `${resourceTitle}: ${resourceLink}`;
        const updatedResources = currentResources ? currentResources + '\n' + newResource : newResource;

        sheet.getRange(row, MEETING_CONFIG.COLUMNS.TOPICS.RESOURCE_LINKS + 1).setValue(updatedResources);
        logMeetingAction('Add Topic Resource', `${topicId}: ${resourceTitle}`);
        return { success: true };
      }
    }

    return { success: false, error: 'Topic not found' };
  } catch (error) {
    logMeetingAction('Add Resource Error', error.toString());
    return { success: false, error: error.toString() };
  }
}

// Get topic categories
function getTopicCategories() {
  try {
    const topics = getAllTopics();
    const categories = [...new Set(topics.map(t => t.category))];
    return categories.sort();
  } catch (error) {
    console.log('Error getting categories: ' + error.toString());
    return [];
  }
}

// Get topic statistics
function getTopicStatistics() {
  try {
    const topics = getAllTopics();
    const stats = {
      total: topics.length,
      active: topics.filter(t => t.status === 'Active').length,
      archived: topics.filter(t => t.status === 'Archived').length,
      byCategory: {},
      byDifficulty: {}
    };

    topics.forEach(topic => {
      // By category
      if (!stats.byCategory[topic.category]) {
        stats.byCategory[topic.category] = 0;
      }
      stats.byCategory[topic.category]++;

      // By difficulty
      if (!stats.byDifficulty[topic.difficulty]) {
        stats.byDifficulty[topic.difficulty] = 0;
      }
      stats.byDifficulty[topic.difficulty]++;
    });

    return stats;
  } catch (error) {
    console.log('Error getting statistics: ' + error.toString());
    return null;
  }
}

// Export topics as CSV
function exportTopicsReport() {
  try {
    const topics = getAllTopics();

    let csv = 'ID,Title,Category,Difficulty,Duration (min),Frequency,Last Discussed,Status\n';

    topics.forEach(topic => {
      csv += `"${topic.id}","${topic.title}","${topic.category}","${topic.difficulty}","${topic.duration}","${topic.frequency}","${topic.lastDiscussed}","${topic.status}"\n`;
    });

    return csv;
  } catch (error) {
    console.log('Error exporting: ' + error.toString());
    return null;
  }
}

// Get topics due for discussion (detailed)
function getTopicsDueDetails() {
  try {
    const dueTopics = getTopicsDueForDiscussion();

    let html = '<table style="width:100%; border-collapse: collapse;"><tr style="background: #4285F4; color: white;"><th style="border: 1px solid #ddd; padding: 10px;">Topic</th><th style="border: 1px solid #ddd; padding: 10px;">Category</th><th style="border: 1px solid #ddd; padding: 10px;">Days Since Discussed</th><th style="border: 1px solid #ddd; padding: 10px;">Priority</th></tr>';

    dueTopics.forEach((topic, index) => {
      const priority = topic.daysOverdue > 90 ? 'High' : topic.daysOverdue > 30 ? 'Medium' : 'Low';
      const bgColor = priority === 'High' ? '#fee2e2' : priority === 'Medium' ? '#fef3c7' : '#f0fdf4';

      html += `<tr style="background: ${bgColor};">
        <td style="border: 1px solid #ddd; padding: 10px;">${topic.title}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${topic.category}</td>
        <td style="border: 1px solid #ddd; padding: 10px;">${topic.daysSinceLast}</td>
        <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${priority}</td>
      </tr>`;
    });

    html += '</table>';
    return html;
  } catch (error) {
    console.log('Error: ' + error.toString());
    return '<p>Error generating report</p>';
  }
}
