// ===== FORM BUILDER SYSTEM =====
class FormBuilder {
  static createEmailCollectionForm() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const formName = "📧 Customer Email Collection Form";

    // Check if form already exists
    try {
      const existingForms = FormApp.getOpenByUrl(
        ss.getUrl().replace(/\/edit.*/, '/forms')
      );
      SpreadsheetApp.getUi().alert('ℹ️ A form may already exist for this spreadsheet.');
    } catch (e) {
      // Form doesn't exist, create new one
    }

    // Create new form
    const form = FormApp.create(formName);

    // Set form description
    form.setDescription('Share your information so we can send you a personalized email and quote. All fields marked * are required.');

    // Set form theme
    form.setCollectEmail(true);
    form.setLimitOneResponsePerUser(false);

    // Add form sections and fields

    // SECTION 1: CONTACT INFORMATION
    form.addSectionHeaderItem()
      .setTitle('📧 Contact Information')
      .setHelpText('We\'ll use this to send you personalized updates');

    form.addTextItem()
      .setTitle('Email Address')
      .setHelpText('Your business email')
      .setRequired(true);

    form.addTextItem()
      .setTitle('First Name')
      .setRequired(true);

    form.addTextItem()
      .setTitle('Last Name')
      .setRequired(false);

    form.addTextItem()
      .setTitle('Company Name')
      .setRequired(false);

    form.addTextItem()
      .setTitle('Phone Number')
      .setHelpText('Optional - we may call with follow-up questions')
      .setRequired(false);

    // SECTION 2: PROJECT DETAILS
    form.addSectionHeaderItem()
      .setTitle('💼 Project Details')
      .setHelpText('Tell us about your project so we can customize our offer');

    form.addTextItem()
      .setTitle('What is your project about?')
      .setHelpText('Briefly describe what you need help with')
      .setRequired(false);

    form.addTextItem()
      .setTitle('Budget Range')
      .setHelpText('e.g., $5,000 - $10,000')
      .setRequired(false);

    form.addDateItem()
      .setTitle('When do you need this completed?')
      .setRequired(false);

    // SECTION 3: PERSONALIZATION
    form.addSectionHeaderItem()
      .setTitle('✨ Personalization')
      .setHelpText('Customize your email experience');

    form.addTextItem()
      .setTitle('Personal Message (optional)')
      .setHelpText('Anything special you\'d like us to know? We\'ll include this in your email!')
      .setRequired(false);

    form.addCheckboxItem()
      .setTitle('Interested in:')
      .setChoiceValues(['Product Demo', 'Case Study', 'Pricing Info', 'Free Consultation'])
      .setRequired(false);

    // SECTION 4: PREFERENCES
    form.addSectionHeaderItem()
      .setTitle('📬 Preferences')
      .setHelpText('How would you like us to contact you?');

    form.addCheckboxItem()
      .setTitle('How should we follow up?')
      .setChoiceValues(['Email', 'Phone', 'Meeting'])
      .setRequired(false);

    form.addMultipleChoiceItem()
      .setTitle('Best time to contact')
      .setChoiceValues(['Morning (9-12)', 'Afternoon (12-5)', 'Evening (5+)', 'Anytime'])
      .setRequired(false);

    // Set form confirmation message
    form.setConfirmationMessage('✅ Thank you! We\'ll review your information and send you a personalized email soon!');

    // Create response sheet
    const responseSheet = form.getDestinationId();

    // Get the form URL
    const formUrl = form.getPublishedUrl();

    // Add form info to spreadsheet
    FormBuilder.addFormInfoSheet(ss, formUrl);

    SpreadsheetApp.getUi().alert(
      '✅ Google Form Created!\n\n' +
      'Form Name: ' + formName + '\n\n' +
      'The form is ready to share with customers!\n\n' +
      'Responses will automatically appear in:\n' +
      '"' + formName + ' (Responses)"\n\n' +
      'Then you can import and send personalized emails!\n\n' +
      'Check the "📋 Form Info" sheet for the link.'
    );
  }

  static addFormInfoSheet(ss, formUrl) {
    let infoSheet = ss.getSheetByName('📋 Form Info');

    if (!infoSheet) {
      infoSheet = ss.insertSheet('📋 Form Info', 0);
      infoSheet.setColumnWidth(1, 300);
      infoSheet.setColumnWidth(2, 400);

      infoSheet.getRange('A1').setValue('📋 Form Information').setFontSize(14).setFontWeight('bold');
      infoSheet.getRange('A3').setValue('📧 Form Link:').setFontWeight('bold');
      infoSheet.getRange('B3').setValue(formUrl).setFontColor('blue').setTextDecoration('underline');

      infoSheet.getRange('A5').setValue('📋 How to Use:').setFontWeight('bold').setFontSize(12);
      infoSheet.getRange('A6').setValue('1. Share the form link above with customers');
      infoSheet.getRange('A7').setValue('2. They fill it out with their information');
      infoSheet.getRange('A8').setValue('3. Responses auto-populate in a new sheet');
      infoSheet.getRange('A9').setValue('4. Import that sheet using "📋 Import from Sheets"');
      infoSheet.getRange('A10').setValue('5. Send personalized emails!');

      infoSheet.getRange('A12').setValue('💡 Tips:').setFontWeight('bold').setFontSize(12);
      infoSheet.getRange('A13').setValue('• Share the form link in your email newsletter');
      infoSheet.getRange('A14').setValue('• Post it on your website');
      infoSheet.getRange('A15').setValue('• Include it in your business card or brochure');
      infoSheet.getRange('A16').setValue('• The "Personal Message" field becomes the {{customMessage}}');
    } else {
      infoSheet.getRange('B3').setValue(formUrl);
    }
  }

  static viewFormLink() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const infoSheet = ss.getSheetByName('📋 Form Info');

    if (!infoSheet) {
      SpreadsheetApp.getUi().alert('❌ Form info sheet not found. Create a form first!');
      return;
    }

    const formUrl = infoSheet.getRange('B3').getValue();

    if (!formUrl || formUrl === '') {
      SpreadsheetApp.getUi().alert('❌ No form URL found. Create a form first!');
      return;
    }

    const html = HtmlService.createHtmlOutput(`
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        .container { max-width: 600px; }
        h2 { color: #0066cc; }
        .link-box { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .link { color: #0066cc; text-decoration: underline; word-break: break-all; }
        button { background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
        button:hover { background-color: #004499; }
        .info { background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 15px; }
      </style>
      <div class="container">
        <h2>📧 Your Google Form</h2>

        <div class="link-box">
          <p><strong>Form URL:</strong></p>
          <p class="link">${formUrl}</p>
        </div>

        <button onclick="copyToClipboard()">📋 Copy Link</button>
        <button onclick="openForm()" style="background-color: #4caf50; margin-left: 10px;">📂 Open Form</button>

        <div class="info">
          <h3>How to Share:</h3>
          <ul>
            <li><strong>Email:</strong> Send the link to customers</li>
            <li><strong>Website:</strong> Embed it on your site</li>
            <li><strong>Social Media:</strong> Post the link</li>
            <li><strong>QR Code:</strong> Generate a QR code from the URL</li>
          </ul>
        </div>

        <div class="info">
          <h3>After Customers Submit:</h3>
          <ol>
            <li>Responses appear in a new sheet (Form Name + " (Responses)")</li>
            <li>Go to Email Tools → Import from Sheets</li>
            <li>Import the responses sheet</li>
            <li>Send personalized emails!</li>
          </ol>
        </div>
      </div>

      <script>
        function copyToClipboard() {
          const url = '${formUrl}';
          const textarea = document.createElement('textarea');
          textarea.value = url;
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          alert('✅ Link copied to clipboard!');
        }

        function openForm() {
          window.open('${formUrl}', '_blank');
        }
      </script>
    `);

    SpreadsheetApp.getUi().showModelessDialog(html, '📧 Form Link');
  }
}
