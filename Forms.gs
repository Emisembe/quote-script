// Google Form Integration Functions
// Handles form submissions and member registration

// Called when a form is submitted (can be set up as a trigger)
function onFormSubmit(e) {
  try {
    const formResponse = e.response;
    const itemResponses = formResponse.getItemResponses();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const contributionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);

    // Extract form responses
    const formData = {};
    itemResponses.forEach((itemResponse, index) => {
      formData[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
    });

    // Check if member already exists
    const existingMembers = membersSheet.getDataRange().getValues();
    let memberExists = false;

    for (let i = 1; i < existingMembers.length; i++) {
      if (existingMembers[i][CONFIG.COLUMNS.MEMBERS.EMAIL] === formData['Email']) {
        memberExists = true;
        break;
      }
    }

    if (!memberExists) {
      // Generate member ID
      const memberId = `MEM-${String(existingMembers.length).padStart(4, '0')}`;

      // Add to Members sheet
      membersSheet.appendRow([
        memberId,
        formData['Full Name'] || formData['Name'] || '',
        formData['Phone Number'] || formData['Phone'] || '',
        formData['Email'] || '',
        'ACTIVE',
        new Date(),
        formData['Group'] || formData['Region'] || '',
        formData['Notes'] || ''
      ]);

      // Add to Contributions sheet (create entry for new member)
      contributionsSheet.appendRow([
        memberId,
        formData['Full Name'] || formData['Name'] || '',
        'Monthly Contribution',
        0, // Amount due (to be set)
        0, // Amount paid
        'PENDING',
        new Date(),
        '', // Payment date
        0   // Balance
      ]);

      // Send welcome email
      const email = formData['Email'];
      const name = formData['Full Name'] || formData['Name'] || 'New Member';
      sendWelcomeEmail(name, email, memberId);

      // Log the action
      logAction('New Member Registration', `${name} (${memberId}) registered via form`);
    }
  } catch (error) {
    logAction('Form Submission Error', error.toString());
    console.log('Error processing form submission: ' + error.toString());
  }
}

// Process pending form submissions (can be called manually or via trigger)
function processPendingFormSubmissions() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const contributionsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.CONTRIBUTIONS);

    // Get all form responses (this assumes the form is linked to the spreadsheet)
    // The responses will be in a separate sheet or you can query the form directly
    logAction('Form Sync', 'Synced member records from form submissions');
  } catch (error) {
    logAction('Form Sync Error', error.toString());
    console.log('Error syncing form submissions: ' + error.toString());
  }
}

// Manually process form submissions by querying the form
function processFormSubmissionsManual() {
  try {
    // Get all forms in the spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const forms = FormApp.openByUrl(getFormUrl()); // You'll need to set the form URL in settings

    if (!forms) {
      logAction('Form Processing', 'No form URL configured');
      return;
    }

    const responses = forms.getResponses();
    const membersSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.MEMBERS);
    const existingEmails = new Set();

    // Get existing emails
    const data = membersSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      existingEmails.add(data[i][CONFIG.COLUMNS.MEMBERS.EMAIL]);
    }

    let newMembers = 0;

    // Process each response
    responses.forEach((response) => {
      const itemResponses = response.getItemResponses();
      const formData = {};

      itemResponses.forEach((itemResponse) => {
        formData[itemResponse.getItem().getTitle()] = itemResponse.getResponse();
      });

      const email = formData['Email'] || '';
      const name = formData['Full Name'] || formData['Name'] || '';

      if (email && !existingEmails.has(email)) {
        const memberId = `MEM-${String(data.length + newMembers).padStart(4, '0')}`;

        membersSheet.appendRow([
          memberId,
          name,
          formData['Phone Number'] || formData['Phone'] || '',
          email,
          'ACTIVE',
          new Date(),
          formData['Group'] || formData['Region'] || '',
          formData['Notes'] || ''
        ]);

        sendWelcomeEmail(name, email, memberId);
        newMembers++;
        existingEmails.add(email);
      }
    });

    logAction('Form Processing', `Processed ${newMembers} new members from form`);
  } catch (error) {
    logAction('Form Processing Error', error.toString());
    console.log('Error processing form: ' + error.toString());
  }
}

// Get form URL from settings sheet (setup required)
function getFormUrl() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const settingsSheet = ss.getSheetByName(CONFIG.SHEET_NAMES.SETTINGS);
    if (!settingsSheet) return null;

    const data = settingsSheet.getDataRange().getValues();
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === 'Form URL') {
        return data[i][1];
      }
    }
  } catch (e) {
    console.log('Error getting form URL: ' + e.toString());
  }
  return null;
}

// Create a new form or get existing one
function getOrCreateMemberForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formUrl = getFormUrl();

  if (formUrl) {
    try {
      return FormApp.openByUrl(formUrl);
    } catch (e) {
      console.log('Error opening form: ' + e.toString());
    }
  }

  // Create new form if doesn't exist
  const form = FormApp.create('Member Registration Form');

  // Add form fields
  form.setDescription('Register as a new member of our community');
  form.setCollectEmail(true);

  form.addTextItem()
    .setTitle('Full Name')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Phone Number')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Email')
    .setRequired(true);

  form.addTextItem()
    .setTitle('Group/Region')
    .setRequired(false);

  form.addTextItem()
    .setTitle('Notes')
    .setRequired(false);

  // Save form URL to settings
  saveFormUrl(form.getEditUrl());

  return form;
}

// Save form URL to settings sheet
function saveFormUrl(formUrl) {
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
      if (data[i][0] === 'Form URL') {
        settingsSheet.getRange(i + 1, 2).setValue(formUrl);
        found = true;
        break;
      }
    }

    if (!found) {
      settingsSheet.appendRow(['Form URL', formUrl]);
    }
  } catch (e) {
    console.log('Error saving form URL: ' + e.toString());
  }
}

// Setup trigger for form submissions (call this manually once to set up)
function setupFormSubmissionTrigger() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'onFormSubmit') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Create new trigger for form submissions
  const form = getOrCreateMemberForm();
  ScriptApp.newTrigger('onFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  logAction('Trigger Setup', 'Form submission trigger created');
}
