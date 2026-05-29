// ===== ULTIMATE EMAIL AUTOMATION SYSTEM =====
// With sheet preparation, custom messages, and rich templates

class BusinessEmailAutomation {
  constructor() {
    this.businesses = {
      "default": {
        name: "Your Business Name",
        email: "your-email@example.com",
        phone: "+1 (555) 000-0000",
        website: "https://yourwebsite.com",
        colors: {
          primary: "#0066cc",
          accent: "#ff6600"
        }
      }
    };

    this.templates = {
      "quote-sent": this.getQuoteSentTemplate(),
      "follow-up": this.getFollowUpTemplate(),
      "special-offer": this.getSpecialOfferTemplate(),
      "video-demo": this.getVideoDemoTemplate()
    };
  }

  getQuoteSentTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Your Quote is Ready!</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">Thank you for reaching out to {{businessName}}! We're excited to provide you with a quote tailored to your needs.</p>{{#if customMessage}}<div style="background-color: #fff3cd; border-left: 4px solid {{accentColor}}; padding: 15px; margin: 20px 0;"><p style="color: #333; font-style: italic;">{{customMessage}}</p></div>{{/if}}<div style="background-color: #f5f5f5; border-left: 4px solid {{accentColor}}; padding: 15px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Quote ID:</strong> {{quoteId}}</p><p style="margin: 5px 0;"><strong>Date:</strong> {{quoteDate}}</p><p style="margin: 5px 0;"><strong>Total:</strong> {{totalAmount}}</p></div><p style="color: #666; line-height: 1.6;">Please review the attached quote. If you have any questions, feel free to reach out to us.</p><div style="text-align: center; margin: 30px 0;"><a href="{{quoteLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Quote</a></div></div><div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;"><p style="margin: 5px 0;">📧 {{businessEmail}} | 📞 {{businessPhone}}</p></div></div></body></html>`;
  }

  getFollowUpTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Following Up on Your Quote</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">I hope this finds you well! I wanted to follow up on quote <strong>{{quoteId}}</strong>.</p>{{#if customMessage}}<div style="background-color: #e3f2fd; border-left: 4px solid {{primaryColor}}; padding: 15px; margin: 20px 0;"><p style="color: #333; font-style: italic;">💬 {{customMessage}}</p></div>{{/if}}<p style="color: #666; line-height: 1.6;">If you have questions or want to discuss, I'm here to help!</p><div style="text-align: center; margin: 30px 0;"><a href="{{calendarLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule a Call</a></div></div></div></body></html>`;
  }

  getSpecialOfferTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background: linear-gradient(135deg, {{primaryColor}}, {{accentColor}}); color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">🎉 SPECIAL OFFER</h1></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">We have an exclusive offer just for you!</p><div style="background-color: #fff3cd; border: 2px solid {{accentColor}}; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;"><p style="font-size: 24px; font-weight: bold; color: {{primaryColor}};">{{offerTitle}}</p><p style="font-size: 14px; color: #666;">{{offerDescription}}</p><p style="font-size: 12px; color: #666;"><strong>Valid until:</strong> {{offerExpiry}}</p></div>{{#if customMessage}}<p style="color: #333; background-color: #f5f5f5; padding: 15px; border-radius: 5px;">{{customMessage}}</p>{{/if}}<div style="text-align: center; margin: 30px 0;"><a href="{{offerLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Claim Offer</a></div></div></div></body></html>`;
  }

  getVideoDemoTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Check Out Our Demo Video</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">I wanted to show you a quick demo of our service!</p>{{#if videoUrl}}<div style="background-color: #000; border-radius: 8px; overflow: hidden; margin: 20px 0; max-width: 100%;"><iframe width="100%" height="315" src="{{videoUrl}}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: block;"></iframe></div>{{/if}}{{#if customMessage}}<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="color: #333;">{{customMessage}}</p></div>{{/if}}<p style="color: #666; line-height: 1.6;">Let me know if you have any questions!</p><div style="text-align: center; margin: 30px 0;"><a href="{{demoLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Learn More</a></div></div></div></body></html>`;
  }

  sendEmail(recipientEmail, templateName, businessKey, emailSubject, data) {
    try {
      if (!this.businesses[businessKey]) throw new Error(`Business "${businessKey}" not found`);
      if (!this.templates[templateName]) throw new Error(`Template "${templateName}" not found`);

      const business = this.businesses[businessKey];
      const template = this.templates[templateName];

      const emailData = {
        ...data,
        businessName: business.name,
        businessEmail: business.email,
        businessPhone: business.phone,
        businessWebsite: business.website,
        primaryColor: business.colors.primary,
        accentColor: business.colors.accent
      };

      let htmlContent = template;
      Object.keys(emailData).forEach(key => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, emailData[key] || '');
      });

      // Handle conditionals: {{#if variable}} ... {{/if}}
      htmlContent = htmlContent.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, key, content) => {
        return emailData[key] ? content : '';
      });

      GmailApp.sendEmail(recipientEmail, emailSubject, '', { htmlBody: htmlContent });
      return { success: true, message: `Email sent to ${recipientEmail}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  addTemplate(templateName, htmlContent) {
    this.templates[templateName] = htmlContent;
    return { success: true };
  }

  addBusiness(businessKey, businessData) {
    this.businesses[businessKey] = businessData;
    return { success: true };
  }

  getTemplateList() {
    return Object.keys(this.templates);
  }

  getBusinessList() {
    return Object.keys(this.businesses);
  }

  getBusiness(businessKey) {
    return this.businesses[businessKey];
  }

  getTemplate(templateName) {
    return this.templates[templateName];
  }
}

// ===== EMAIL LOGGING SYSTEM =====
class EmailLogger {
  constructor() {
    this.logSheetName = "📊 Email Logs";
    this.ensureLogSheetExists();
  }

  ensureLogSheetExists() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.logSheetName);

    if (!sheet) {
      sheet = ss.insertSheet(this.logSheetName);
      sheet.appendRow([
        "Timestamp",
        "Recipient Email",
        "First Name",
        "Template",
        "Business",
        "Subject",
        "Status",
        "Error Message",
        "Sheet Source"
      ]);

      const headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#0066cc");
      headerRange.setFontColor("white");
      headerRange.setFontWeight("bold");
    }
    return sheet;
  }

  logEmail(recipientEmail, firstName, template, business, subject, status, errorMsg = "", sheetSource = "") {
    const sheet = this.ensureLogSheetExists();
    const timestamp = new Date().toLocaleString();
    sheet.appendRow([timestamp, recipientEmail, firstName, template, business, subject, status, errorMsg, sheetSource]);
  }

  getStats() {
    const sheet = this.ensureLogSheetExists();
    const data = sheet.getDataRange().getValues();

    let sent = 0;
    let failed = 0;
    let today = new Date().toLocaleDateString();

    for (let i = 1; i < data.length; i++) {
      const timestamp = data[i][0];
      if (timestamp.toString().includes(today)) {
        if (data[i][6] === "✅ Sent") sent++;
        else if (data[i][6] === "❌ Failed") failed++;
      }
    }

    return { sent, failed, today };
  }

  getQuotaStats() {
    const stats = this.getStats();
    const dailyLimit = 500;
    const remaining = Math.max(0, dailyLimit - stats.sent);

    return {
      sent: stats.sent,
      failed: stats.failed,
      dailyLimit: dailyLimit,
      remaining: remaining,
      percentUsed: Math.round((stats.sent / dailyLimit) * 100)
    };
  }
}

// ===== TEMPLATE STORAGE SYSTEM =====
class TemplateStorage {
  constructor() {
    this.sheetName = "📋 Templates Storage";
    this.ensureStorageSheetExists();
  }

  ensureStorageSheetExists() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(this.sheetName);

    if (!sheet) {
      sheet = ss.insertSheet(this.sheetName);
      sheet.appendRow(["Template Name", "HTML Content"]);

      const headerRange = sheet.getRange(1, 1, 1, 2);
      headerRange.setBackground("#667eea");
      headerRange.setFontColor("white");
      headerRange.setFontWeight("bold");
    }
    return sheet;
  }

  saveTemplate(templateName, htmlContent) {
    const sheet = this.ensureStorageSheetExists();
    const data = sheet.getDataRange().getValues();

    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateName) {
        sheet.getRange(i + 1, 2).setValue(htmlContent);
        found = true;
        break;
      }
    }

    if (!found) {
      sheet.appendRow([templateName, htmlContent]);
    }
  }

  loadAllTemplates() {
    const sheet = this.ensureStorageSheetExists();
    const data = sheet.getDataRange().getValues();
    const templates = {};

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] && data[i][1]) {
        templates[data[i][0]] = data[i][1];
      }
    }

    return templates;
  }

  deleteTemplate(templateName) {
    const sheet = this.ensureStorageSheetExists();
    const data = sheet.getDataRange().getValues();

    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === templateName) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
  }
}

// ===== SHEET PREPARATION SYSTEM =====
class SheetPreparer {
  static createDataSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetName = "📧 Email Campaign Data";

    // Check if sheet exists
    let sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      SpreadsheetApp.getUi().alert(`✅ Sheet "${sheetName}" already exists! Check the tab at the bottom.`);
      return;
    }

    // Create new sheet
    sheet = ss.insertSheet(sheetName, 0); // Insert at beginning

    // Add headers
    const headers = [
      "Email",
      "First Name",
      "Last Name",
      "Company",
      "Quote ID",
      "Amount",
      "Custom Message",
      "Video URL (optional)",
      "Link URL (optional)",
      "Notes"
    ];

    sheet.appendRow(headers);

    // Format header row
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground("#0066cc");
    headerRange.setFontColor("white");
    headerRange.setFontWeight("bold");
    headerRange.setFontSize(12);

    // Add sample data
    sheet.appendRow([
      "john@example.com",
      "John",
      "Smith",
      "ACME Corp",
      "Q-001",
      "5000",
      "John, I have a special offer for you as a valued client!",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
      "https://example.com/demo",
      "Hot lead"
    ]);

    sheet.appendRow([
      "jane@example.com",
      "Jane",
      "Doe",
      "Tech Inc",
      "Q-002",
      "7500",
      "Jane, this quote includes our premium features!",
      "",
      "",
      "Warm lead"
    ]);

    // Set column widths
    sheet.setColumnWidth(1, 200); // Email
    sheet.setColumnWidth(2, 100); // First Name
    sheet.setColumnWidth(3, 100); // Last Name
    sheet.setColumnWidth(4, 120); // Company
    sheet.setColumnWidth(5, 100); // Quote ID
    sheet.setColumnWidth(6, 100); // Amount
    sheet.setColumnWidth(7, 250); // Custom Message
    sheet.setColumnWidth(8, 250); // Video URL
    sheet.setColumnWidth(9, 200); // Link URL
    sheet.setColumnWidth(10, 150); // Notes

    SpreadsheetApp.getUi().alert(`✅ Sheet "${sheetName}" created with sample data!\n\nColumns included:\n• Email\n• First Name\n• Custom Message\n• Quote ID\n• Video URL\n• And more!\n\nEdit the sample data and add your own customers.`);
  }
}

// ===== FORM BUILDER SYSTEM =====
class FormBuilder {
  static createEmailCollectionForm() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const formName = "📧 Customer Email Collection Form";

    // Create new form
    const form = FormApp.create(formName);

    // Set form description
    form.setDescription('Share your information so we can send you a personalized email and quote. All fields marked * are required.');

    // Set form theme
    form.setCollectEmail(true);
    form.setLimitOneResponsePerUser(false);

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

    // Get the form URL
    const formUrl = form.getPublishedUrl();

    // Add form info to spreadsheet
    FormBuilder.addFormInfoSheet(ss, formUrl);

    SpreadsheetApp.getUi().alert(
      '✅ Google Form Created!\n\n' +
      'Form Name: ' + formName + '\n\n' +
      'The form is ready to share with customers!\n\n' +
      'Responses will automatically appear in a new sheet.\n\n' +
      'Then you can import and send personalized emails!\n\n' +
      'Click "🔗 View Form Link" to see the link.'
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
      infoSheet.getRange('A6').setValue('1. Share the form link with customers');
      infoSheet.getRange('A7').setValue('2. They fill it out with their information');
      infoSheet.getRange('A8').setValue('3. Responses auto-populate in a new sheet');
      infoSheet.getRange('A9').setValue('4. Import that sheet using "📋 Import from Sheets"');
      infoSheet.getRange('A10').setValue('5. Send personalized emails!');
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
            <li>Responses appear in a new sheet</li>
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

// ===== BULK EMAIL SENDER =====
class BulkEmailSender {
  static showBulkSendDialog() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets().map(s => s.getName()).filter(name =>
      !name.includes("📊") && !name.includes("📋") && !name.includes("📧")
    );

    let sheetOptions = sheets.map(s => `<option value="${s}">${s}</option>`).join('');

    const templates = emailSystem.getTemplateList();
    let templateOptions = templates.map(t => `<option value="${t}">${t}</option>`).join('');

    const businesses = emailSystem.getBusinessList();
    let businessOptions = businesses.map(b => `<option value="${b}">${b}</option>`).join('');

    const html = HtmlService.createHtmlOutput(`
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header-section h2 { font-size: 1.6em; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
        .header-section p { font-size: 0.9em; margin: 8px 0 0 0; opacity: 0.95; }
        .content { padding: 30px; }
        .section { margin-bottom: 28px; }
        .section h3 { font-size: 1.05em; font-weight: 600; color: #222; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        label { display: block; margin-top: 12px; font-weight: 500; color: #555; font-size: 0.95em; }
        input, select, textarea { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.95em; transition: all 0.3s ease; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        textarea { resize: vertical; height: 80px; }
        button { background-color: #667eea; color: white; padding: 12px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; }
        button:hover { background-color: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
        .button-group { display: flex; gap: 10px; margin-top: 25px; }
        .button-group button { flex: 1; }
        .warning { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; border-radius: 6px; margin: 20px 0; color: #856404; font-weight: 500; }
        .info { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 12px; border-radius: 6px; margin-top: 8px; color: #555; font-size: 0.9em; line-height: 1.5; }
        .progress { display: none; margin-top: 20px; }
        .progress-bar { background-color: #f0f0f0; border-radius: 6px; height: 30px; overflow: hidden; }
        .progress-fill { background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: 0%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; transition: width 0.3s ease; }
        #resultsSection { display: none; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); border-left: 4px solid #667eea; border-radius: 6px; }
        #resultsSection h3 { color: #667eea; margin-bottom: 10px; }
        #resultsSummary { color: #555; line-height: 1.6; }
      </style>
      <div class="container">
        <div class="header-section">
          <h2>📤 Bulk Send Emails</h2>
          <p>Send personalized emails to all customers</p>
        </div>
        <div class="content">

        <div class="warning">
          ⚠️ <strong>Warning:</strong> This will send emails to ALL customers in the selected sheet!
        </div>

        <div class="section">
          <h3>Step 1: Select Sheet</h3>
          <label>Sheet name (type the exact name):</label>
          <input type="text" id="sheetNameSelect" placeholder="e.g., Payment Reminders" value="">
          <div class="info">
            ℹ️ Type your sheet name exactly as it appears in the tabs. Must have: Email, First Name columns
          </div>
        </div>

        <div class="section">
          <h3>Step 2: Configure Email</h3>

          <label>Email Template:</label>
          <select id="bulkTemplateSelect">
            ${templateOptions}
          </select>

          <label>Business:</label>
          <select id="bulkBusinessSelect">
            ${businessOptions}
          </select>

          <label>Email Subject:</label>
          <input type="text" id="bulkEmailSubject" placeholder="Your Quote is Ready!" value="Your Quote is Ready!">

          <label>Additional Data (JSON - optional):</label>
          <textarea id="bulkAdditionalData" placeholder='{"quoteId": "Q-001", "totalAmount": "5000"}
(Leave empty to use data from sheet)
(Or provide static data for all emails)'></textarea>

          <div class="info">
            💡 Additional data will be added to EVERY email.
            Leave empty if your sheet has the data in columns.
          </div>
        </div>

        <div class="section">
          <h3>Step 3: Preview & Send</h3>
          <div class="button-group">
            <button onclick="previewBulkEmail()">👁️ Preview First</button>
            <button onclick="confirmBulkSend()" style="background-color: #f44336;">📤 Send to All</button>
          </div>
        </div>

        <div class="progress" id="progressSection">
          <p>Sending emails...</p>
          <div class="progress-bar">
            <div class="progress-fill" id="progressFill">0%</div>
          </div>
          <p id="progressText">0 of 0 sent</p>
        </div>

        <div id="resultsSection" style="display: none; margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3>✅ Sending Complete!</h3>
          <p id="resultsSummary"></p>
        </div>
      </div>

      <script>
        function previewBulkEmail() {
          const sheetName = document.getElementById('sheetNameSelect').value;
          if (!sheetName) {
            alert('❌ Please select a sheet!');
            return;
          }

          let additionalData = {};
          try {
            const data = document.getElementById('bulkAdditionalData').value;
            if (data) additionalData = JSON.parse(data);
          } catch (e) {
            alert('❌ Invalid JSON in Additional Data!');
            return;
          }

          google.script.run.previewBulkSend(
            sheetName,
            document.getElementById('bulkTemplateSelect').value,
            document.getElementById('bulkBusinessSelect').value,
            additionalData,
            function(result) {
              if (result.success) {
                alert('✅ Preview:\\n\\nSheet: ' + sheetName + '\\n' +
                      'Customers found: ' + result.count + '\\n' +
                      'First customer: ' + result.firstCustomer + '\\n\\n' +
                      'Ready to send to all ' + result.count + ' customers?');
              } else {
                alert('❌ Error: ' + result.error);
              }
            }
          );
        }

        function confirmBulkSend() {
          const sheetName = document.getElementById('sheetNameSelect').value;
          if (!sheetName) {
            alert('❌ Please select a sheet!');
            return;
          }

          const count = prompt('How many customers are in this sheet? (This is a safety check)', '');
          if (!count) return;

          if (confirm('⚠️ You are about to send ' + count + ' emails to all customers in "' + sheetName + '"!\\n\\nThis cannot be undone.\\n\\nAre you SURE?')) {
            sendBulkEmails();
          }
        }

        function sendBulkEmails() {
          const sheetName = document.getElementById('sheetNameSelect').value;

          let additionalData = {};
          try {
            const data = document.getElementById('bulkAdditionalData').value;
            if (data) additionalData = JSON.parse(data);
          } catch (e) {
            alert('❌ Invalid JSON!');
            return;
          }

          document.getElementById('progressSection').style.display = 'block';
          document.getElementById('resultsSection').style.display = 'none';

          google.script.run.withSuccessHandler(onBulkSendComplete).executeBulkSend(
            sheetName,
            document.getElementById('bulkTemplateSelect').value,
            document.getElementById('bulkBusinessSelect').value,
            document.getElementById('bulkEmailSubject').value,
            additionalData
          );
        }

        function onBulkSendComplete(result) {
          document.getElementById('progressSection').style.display = 'none';
          document.getElementById('resultsSection').style.display = 'block';

          let summary = 'Sent: <strong>' + result.sent + '</strong><br>';
          summary += 'Failed: <strong>' + result.failed + '</strong><br>';
          summary += 'Total: <strong>' + (result.sent + result.failed) + '</strong>';

          if (result.failed > 0) {
            summary += '<br><br>Failed emails:<br>';
            result.failedEmails.forEach(f => {
              summary += '• ' + f.email + ' - ' + f.error + '<br>';
            });
          }

          document.getElementById('resultsSummary').innerHTML = summary;
        }
      </script>
    `);

    SpreadsheetApp.getUi().showModelessDialog(html, '📤 Bulk Send Emails');
  }

  static previewBulkSend(sheetName, templateName, businessKey, additionalData) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        return { success: false, error: `Sheet "${sheetName}" not found` };
      }

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const emailIndex = headers.indexOf('Email');
      const nameIndex = headers.indexOf('First Name');

      if (emailIndex === -1 || nameIndex === -1) {
        return { success: false, error: 'Sheet must have "Email" and "First Name" columns' };
      }

      let count = 0;
      let firstCustomer = '';

      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIndex]) {
          count++;
          if (count === 1) firstCustomer = data[i][nameIndex] + ' (' + data[i][emailIndex] + ')';
        }
      }

      return { success: true, count: count, firstCustomer: firstCustomer };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static executeBulkSend(sheetName, templateName, businessKey, emailSubject, additionalData) {
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(sheetName);

      if (!sheet) throw new Error(`Sheet "${sheetName}" not found`);

      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      const emailIndex = headers.indexOf('Email');
      const nameIndex = headers.indexOf('First Name');
      const customMsgIndex = headers.indexOf('Custom Message');

      if (emailIndex === -1 || nameIndex === -1) {
        throw new Error('Sheet must have "Email" and "First Name" columns');
      }

      let sent = 0;
      let failed = 0;
      let failedEmails = [];

      for (let i = 1; i < data.length; i++) {
        const email = data[i][emailIndex];

        if (!email) continue;

        try {
          const emailData = {
            firstName: data[i][nameIndex] || 'Customer',
            customMessage: customMsgIndex !== -1 ? data[i][customMsgIndex] : '',
            ...additionalData
          };

          const result = emailSystem.sendEmail(email, templateName, businessKey, emailSubject, emailData);

          if (result.success) {
            emailLogger.logEmail(email, emailData.firstName, templateName, businessKey, emailSubject, '✅ Sent', '', sheetName);
            sent++;
          } else {
            emailLogger.logEmail(email, emailData.firstName, templateName, businessKey, emailSubject, '❌ Failed', result.error, sheetName);
            failed++;
            failedEmails.push({ email: email, error: result.error });
          }
        } catch (error) {
          failed++;
          failedEmails.push({ email: email, error: error.message });
          emailLogger.logEmail(email, data[i][nameIndex], templateName, businessKey, emailSubject, '❌ Failed', error.message, sheetName);
        }
      }

      return { sent: sent, failed: failed, failedEmails: failedEmails };
    } catch (error) {
      return { sent: 0, failed: 0, failedEmails: [{ email: 'ALL', error: error.message }] };
    }
  }
}

// ===== FILE UPLOAD IMPORTER =====
class FileUploadImporter {
  static showUploadDialog() {
    const html = HtmlService.createHtmlOutput(`
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
        .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .header-section h2 { font-size: 1.6em; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
        .header-section p { font-size: 0.9em; margin: 8px 0 0 0; opacity: 0.95; }
        .content { padding: 30px; }
        .section { margin-bottom: 28px; }
        .section h3 { font-size: 1.05em; font-weight: 600; color: #222; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }
        label { display: block; margin-top: 12px; font-weight: 500; color: #555; font-size: 0.95em; }
        input[type="file"] { padding: 10px; cursor: pointer; }
        input[type="text"] { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.95em; transition: all 0.3s ease; }
        input[type="text"]:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
        button { background-color: #667eea; color: white; padding: 12px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; margin-top: 15px; }
        button:hover { background-color: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
        .info { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 12px; border-radius: 6px; margin-top: 8px; color: #555; font-size: 0.9em; line-height: 1.6; }
        .progress { display: none; margin-top: 20px; }
        .progress-text { color: #667eea; font-weight: 600; }
        #resultsSection { display: none; margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); border-left: 4px solid #667eea; border-radius: 6px; }
        #resultsSection h3 { color: #667eea; margin-bottom: 10px; font-size: 1.1em; }
        #resultsSummary { color: #555; line-height: 1.6; }
      </style>
      <div class="container">
        <div class="header-section">
          <h2>📁 Import Customer Data</h2>
          <p>Upload CSV or Excel file from your computer</p>
        </div>
        <div class="content">

        <div class="section">
          <h3>📥 Choose File</h3>
          <label>Select a CSV or Excel file:</label>
          <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" />

          <div class="info">
            ✅ Supported formats: CSV, Excel (.xlsx, .xls)<br>
            ✅ Required columns: Email, First Name<br>
            ✅ Optional columns: Last Name, Company, Custom Message, etc.
          </div>
        </div>

        <div class="section">
          <h3>⚙️ Configure Import</h3>

          <label>New Sheet Name:</label>
          <input type="text" id="sheetNameInput" placeholder="Imported Customers" value="Imported Customers">

          <div class="info">
            💡 The data will be imported into a new sheet with this name.
            If the sheet exists, it will be overwritten.
          </div>
        </div>

        <div class="section">
          <button onclick="uploadFile()">📤 Upload & Import File</button>
        </div>

        <div class="progress" id="progressSection">
          <p class="progress-text" id="progressText">Uploading file...</p>
        </div>

        <div id="resultsSection" style="display: none; margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 5px;">
          <h3 id="resultsTitle"></h3>
          <p id="resultsSummary"></p>
        </div>
      </div>

      <script>
        function uploadFile() {
          const fileInput = document.getElementById('fileInput');
          const sheetName = document.getElementById('sheetNameInput').value;

          if (!fileInput.files.length) {
            alert('❌ Please select a file!');
            return;
          }

          if (!sheetName) {
            alert('❌ Please enter a sheet name!');
            return;
          }

          const file = fileInput.files[0];

          document.getElementById('progressSection').style.display = 'block';
          document.getElementById('resultsSection').style.display = 'none';
          document.getElementById('progressText').textContent = 'Uploading ' + file.name + '...';

          const reader = new FileReader();
          reader.onload = function(e) {
            google.script.run.importFileData(
              file.name,
              e.target.result,
              sheetName,
              function(result) {
                onUploadComplete(result);
              }
            );
          };
          reader.readAsArrayBuffer(file);
        }

        function onUploadComplete(result) {
          document.getElementById('progressSection').style.display = 'none';
          document.getElementById('resultsSection').style.display = 'block';

          if (result.success) {
            document.getElementById('resultsTitle').textContent = '✅ Import Successful!';
            let summary = '<strong>Sheet Name:</strong> ' + result.sheetName + '<br>';
            summary += '<strong>Rows Imported:</strong> ' + result.rowCount + '<br>';
            summary += '<strong>Columns:</strong> ' + result.columns.join(', ') + '<br>';
            if (result.invalidRows > 0) {
              summary += '<strong>Invalid Rows (skipped):</strong> ' + result.invalidRows + '<br>';
            }
            summary += '<br><strong>Next Step:</strong> Go to Email Tools → Import from Sheets';
            document.getElementById('resultsSummary').innerHTML = summary;
          } else {
            document.getElementById('resultsTitle').textContent = '❌ Import Failed';
            document.getElementById('resultsSummary').textContent = result.error;
          }
        }
      </script>
    `);

    SpreadsheetApp.getUi().showModelessDialog(html, '📁 Import File');
  }

  static importFileData(fileName, fileData, sheetName) {
    try {
      const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
      const isCSV = fileName.endsWith('.csv');

      let rows = [];

      if (isCSV) {
        const text = new TextDecoder().decode(fileData);
        const lines = text.split('\n');

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const row = [];
          let current = '';
          let inQuotes = false;

          for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              row.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          row.push(current.trim());

          rows.push(row);
        }
      } else if (isExcel) {
        return {
          success: false,
          error: 'Excel import requires converting to CSV first. Please save your Excel file as CSV and try again.'
        };
      } else {
        return {
          success: false,
          error: 'Unsupported file format. Please use CSV or Excel (.xlsx, .xls)'
        };
      }

      if (rows.length === 0) {
        return { success: false, error: 'File is empty' };
      }

      const headers = rows[0];

      const emailIndex = headers.findIndex(h => h.toLowerCase() === 'email');
      const firstNameIndex = headers.findIndex(h => h.toLowerCase() === 'first name');

      if (emailIndex === -1 || firstNameIndex === -1) {
        return {
          success: false,
          error: 'File must contain "Email" and "First Name" columns'
        };
      }

      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(sheetName);

      if (sheet) {
        ss.deleteSheet(sheet);
      }

      sheet = ss.insertSheet(sheetName, 0);

      sheet.appendRow(headers);

      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#0066cc');
      headerRange.setFontColor('white');
      headerRange.setFontWeight('bold');

      let validRows = 0;
      let invalidRows = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];

        if (row[emailIndex] && row[firstNameIndex]) {
          sheet.appendRow(row);
          validRows++;
        } else {
          invalidRows++;
        }
      }

      for (let i = 0; i < headers.length; i++) {
        sheet.setColumnWidth(i + 1, 150);
      }

      return {
        success: true,
        sheetName: sheetName,
        rowCount: validRows,
        invalidRows: invalidRows,
        columns: headers
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// ===== GLOBAL VARIABLES =====
let emailSystem = new BusinessEmailAutomation();
let emailLogger = new EmailLogger();
let templateStorage = new TemplateStorage();
let importedData = [];

// ===== LOAD TEMPLATES FROM STORAGE =====
function loadTemplatesFromStorage() {
  const savedTemplates = templateStorage.loadAllTemplates();
  for (let templateName in savedTemplates) {
    emailSystem.addTemplate(templateName, savedTemplates[templateName]);
  }
}

// ===== CREATE MENU =====
function onOpen() {
  loadTemplatesFromStorage();
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 Email Tools')
    .addItem('🆕 Prepare Email Campaign Sheet', 'prepareSheet')
    .addItem('📝 Create Google Form', 'createCustomerForm')
    .addItem('🔗 View Form Link', 'viewFormLink')
    .addSeparator()
    .addItem('📁 Import File from Computer', 'showFileUploadDialog')
    .addItem('📋 Import from Sheets', 'showMultiSheetImportDialog')
    .addSeparator()
    .addItem('⚙️ Setup Business Info', 'showBusinessSetup')
    .addItem('✉️ Send Email', 'showSendEmailDialog')
    .addItem('📤 Send Emails to All in Sheet', 'showBulkSendDialog')
    .addItem('🎨 Manage Templates', 'showTemplateManager')
    .addSeparator()
    .addItem('📊 Email Stats Dashboard', 'showStatsDashboard')
    .addItem('📋 View Email Logs', 'showEmailLogs')
    .addSeparator()
    .addItem('📧 View Businesses', 'showBusinessesList')
    .addItem('📧 View Templates', 'showTemplatesList')
    .addToUi();
}

// ===== SHEET PREPARATION =====
function prepareSheet() {
  SpreadsheetApp.getUi().alert('🎯 Creating email campaign data sheet...');
  SheetPreparer.createDataSheet();
}

// ===== FORM BUILDER =====
function createCustomerForm() {
  SpreadsheetApp.getUi().alert('📝 Creating Google Form...');
  FormBuilder.createEmailCollectionForm();
}

function viewFormLink() {
  FormBuilder.viewFormLink();
}

// ===== FILE UPLOAD =====
function showFileUploadDialog() {
  FileUploadImporter.showUploadDialog();
}

// ===== BULK EMAIL SENDER =====
function showBulkSendDialog() {
  BulkEmailSender.showBulkSendDialog();
}

// ===== SETUP BUSINESS INFO =====
function showBusinessSetup() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.5em; margin: 0; font-weight: 700; }
      .content { padding: 30px; }
      label { display: block; margin-top: 14px; font-weight: 500; color: #555; font-size: 0.95em; }
      input, textarea { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.95em; transition: all 0.3s ease; }
      input:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
      button { background-color: #667eea; color: white; padding: 11px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; margin-top: 20px; width: 100%; }
      button:hover { background-color: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
      .color-input { display: flex; gap: 10px; margin-top: 6px; }
      .color-input input[type="color"] { width: 50px; height: 40px; padding: 2px; border-radius: 6px; border: 1px solid #ddd; cursor: pointer; }
      .color-input input[type="text"] { flex: 1; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>⚙️ Business Setup</h2>
      </div>
      <div class="content">
      <label>Business Name:</label>
      <input type="text" id="businessName" placeholder="Your Business Name">
      <label>Email Address:</label>
      <input type="email" id="businessEmail" placeholder="email@business.com">
      <label>Phone Number:</label>
      <input type="text" id="businessPhone" placeholder="+1 (555) 000-0000">
      <label>Website:</label>
      <input type="text" id="businessWebsite" placeholder="https://yourwebsite.com">
      <label>Primary Color:</label>
      <div class="color-input">
        <input type="color" id="primaryColor" value="#0066cc">
        <input type="text" id="primaryColorHex" value="#0066cc" readonly>
      </div>
      <label>Accent Color:</label>
      <div class="color-input">
        <input type="color" id="accentColor" value="#ff6600">
        <input type="text" id="accentColorHex" value="#ff6600" readonly>
      </div>
      <button onclick="saveBusinessInfo()">💾 Save Business Info</button>
    </div>
    <script>
      document.getElementById('primaryColor').addEventListener('change', function() {
        document.getElementById('primaryColorHex').value = this.value;
      });
      document.getElementById('accentColor').addEventListener('change', function() {
        document.getElementById('accentColorHex').value = this.value;
      });
      function saveBusinessInfo() {
        google.script.run.saveBusinessInfo({
          name: document.getElementById('businessName').value,
          email: document.getElementById('businessEmail').value,
          phone: document.getElementById('businessPhone').value,
          website: document.getElementById('businessWebsite').value,
          colors: {
            primary: document.getElementById('primaryColor').value,
            accent: document.getElementById('accentColor').value
          }
        });
      }
    </script>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '⚙️ Business Setup');
}

function saveBusinessInfo(data) {
  emailSystem.addBusiness('default', data);
  SpreadsheetApp.getUi().alert('✅ Business info saved!');
}

// ===== MULTI-SHEET IMPORT DIALOG =====
function showMultiSheetImportDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.5em; margin: 0; font-weight: 700; }
      .content { padding: 30px; }
      .tabs { display: flex; gap: 8px; margin-bottom: 20px; }
      .tab-btn { padding: 10px 16px; border: 2px solid #ddd; background-color: white; cursor: pointer; border-radius: 6px; font-weight: 600; transition: all 0.3s ease; color: #555; }
      .tab-btn:hover { border-color: #667eea; }
      .tab-btn.active { background-color: #667eea; color: white; border-color: #667eea; }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
      label { display: block; margin-top: 12px; font-weight: 500; color: #555; font-size: 0.95em; }
      input, select { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.95em; transition: all 0.3s ease; }
      input:focus, select:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
      button { background-color: #667eea; color: white; padding: 11px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; margin-top: 15px; }
      button:hover { background-color: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
      .sheet-list { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 12px; border-radius: 6px; margin-top: 10px; max-height: 300px; overflow-y: auto; border-left: 4px solid #667eea; }
      .sheet-checkbox { display: flex; align-items: center; padding: 10px; margin: 6px 0; background-color: white; border-radius: 6px; transition: all 0.3s ease; }
      .sheet-checkbox:hover { background-color: #f9f9f9; }
      .sheet-checkbox input { width: 18px; height: 18px; margin-right: 10px; cursor: pointer; }
      .info { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 12px; border-radius: 6px; margin-top: 10px; font-size: 0.9em; color: #555; line-height: 1.5; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>📋 Import Customer Data</h2>
      </div>
      <div class="content">
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('single')">Single Sheet</button>
        <button class="tab-btn" onclick="switchTab('multiple')">Multiple Sheets</button>
      </div>
      <div id="single" class="tab-content active">
        <label>Select a Sheet:</label>
        <select id="sheetSelector">
          <option value="">-- Choose a sheet --</option>
        </select>
        <label>Column for Email:</label>
        <input type="text" id="emailColumn" placeholder="Email" value="Email">
        <label>Column for First Name:</label>
        <input type="text" id="nameColumn" placeholder="First Name" value="First Name">
        <div class="info">ℹ️ This will import from one sheet.</div>
        <button onclick="importSingleSheet()">📥 Import Single Sheet</button>
      </div>
      <div id="multiple" class="tab-content">
        <p><strong>Select sheets to import from:</strong></p>
        <div id="sheetCheckboxes" class="sheet-list"></div>
        <label style="margin-top: 15px;">Column for Email:</label>
        <input type="text" id="emailColumnMulti" placeholder="Email" value="Email">
        <label>Column for First Name:</label>
        <input type="text" id="nameColumnMulti" placeholder="First Name" value="First Name">
        <div class="info">ℹ️ This will combine customers from multiple sheets.</div>
        <button onclick="importMultipleSheets()">📥 Import All Selected Sheets</button>
      </div>
    </div>
    <script>
      function switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');
        if (tabName === 'multiple') loadSheetCheckboxes();
      }
      function loadSheetCheckboxes() {
        google.script.run.getSheetList(function(sheets) {
          const container = document.getElementById('sheetCheckboxes');
          container.innerHTML = sheets.map(sheet =>
            '<div class="sheet-checkbox"><input type="checkbox" name="sheet" value="' + sheet + '"><label>' + sheet + '</label></div>'
          ).join('');
        });
      }
      google.script.run.getSheetList(function(sheets) {
        const selector = document.getElementById('sheetSelector');
        sheets.forEach(sheet => {
          const option = document.createElement('option');
          option.value = sheet;
          option.text = sheet;
          selector.appendChild(option);
        });
      });
      function importSingleSheet() {
        const sheet = document.getElementById('sheetSelector').value;
        if (!sheet) {
          alert('❌ Please select a sheet!');
          return;
        }
        google.script.run.importSheetData(sheet,
          document.getElementById('emailColumn').value,
          document.getElementById('nameColumn').value,
          [sheet]
        );
      }
      function importMultipleSheets() {
        const checkboxes = document.querySelectorAll('input[name="sheet"]:checked');
        const sheets = Array.from(checkboxes).map(cb => cb.value);
        if (sheets.length === 0) {
          alert('❌ Please select at least one sheet!');
          return;
        }
        google.script.run.importMultipleSheetData(
          sheets,
          document.getElementById('emailColumnMulti').value,
          document.getElementById('nameColumnMulti').value
        );
      }
    </script>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '📋 Import Customer Data');
}

function getSheetList() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  return sheets.map(sheet => sheet.getName()).filter(name => !name.includes("📊") && !name.includes("📧"));
}

function importSheetData(sheetName, emailColumn, nameColumn, sheetList) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();

    const headers = data[0];
    const emailIndex = headers.indexOf(emailColumn);
    const nameIndex = headers.indexOf(nameColumn);
    const customMsgIndex = headers.indexOf("Custom Message");

    if (emailIndex === -1 || nameIndex === -1) {
      SpreadsheetApp.getUi().alert('❌ Column not found! Check your column names.');
      return;
    }

    importedData = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex]) {
        importedData.push({
          email: data[i][emailIndex],
          firstName: data[i][nameIndex] || 'Customer',
          customMessage: customMsgIndex !== -1 ? data[i][customMsgIndex] : '',
          fullRow: data[i],
          sheetSource: sheetName
        });
      }
    }

    SpreadsheetApp.getUi().alert(`✅ Imported ${importedData.length} customers from ${sheetList.length} sheet(s)!`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`❌ Error: ${error.message}`);
  }
}

function importMultipleSheetData(sheetNames, emailColumn, nameColumn) {
  try {
    importedData = [];
    let totalCustomers = 0;

    sheetNames.forEach(sheetName => {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();

      const headers = data[0];
      const emailIndex = headers.indexOf(emailColumn);
      const nameIndex = headers.indexOf(nameColumn);
      const customMsgIndex = headers.indexOf("Custom Message");

      if (emailIndex === -1 || nameIndex === -1) {
        SpreadsheetApp.getUi().alert(`⚠️ Column not found in sheet "${sheetName}". Skipping.`);
        return;
      }

      for (let i = 1; i < data.length; i++) {
        if (data[i][emailIndex]) {
          importedData.push({
            email: data[i][emailIndex],
            firstName: data[i][nameIndex] || 'Customer',
            customMessage: customMsgIndex !== -1 ? data[i][customMsgIndex] : '',
            fullRow: data[i],
            sheetSource: sheetName
          });
          totalCustomers++;
        }
      }
    });

    SpreadsheetApp.getUi().alert(`✅ Imported ${totalCustomers} customers from ${sheetNames.length} sheet(s)!`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`❌ Error: ${error.message}`);
  }
}

// ===== SEND EMAIL DIALOG =====
// ===== IMPORT GUIDE DIALOG =====
function showImportGuideDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.6em; margin: 0; font-weight: 700; }
      .header-section p { margin: 10px 0 0 0; opacity: 0.95; }
      .content { padding: 30px; }
      .message-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; border-radius: 6px; margin-bottom: 20px; color: #856404; }
      .steps { margin: 20px 0; }
      .step { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); border-left: 4px solid #667eea; padding: 15px; margin: 12px 0; border-radius: 6px; }
      .step-num { background: #667eea; color: white; width: 28px; height: 28px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 10px; }
      .step-text { color: #555; margin: 5px 0; }
      .button-group { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
      button { width: 100%; padding: 13px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; }
      .btn-primary { background: #667eea; color: white; }
      .btn-primary:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
      .btn-secondary { background: #f0f4ff; color: #667eea; border: 2px solid #667eea; }
      .btn-secondary:hover { background: #e3ecff; }
      .btn-success { background: #4caf50; color: white; }
      .btn-success:hover { background: #45a049; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>📥 Import Customer Data First</h2>
        <p>No customer data found. Let's get you set up!</p>
      </div>
      <div class="content">
        <div class="message-box">
          ⚠️ You need to import customer data before sending emails. Choose one of the options below!
        </div>

        <div class="steps">
          <div class="step">
            <span class="step-num">1</span>
            <strong style="color: #667eea;">Option A: Import from Your Computer</strong>
            <div class="step-text">Upload a CSV or Excel file with your customer list</div>
          </div>

          <div class="step">
            <span class="step-num">2</span>
            <strong style="color: #667eea;">Option B: Import from Google Sheets</strong>
            <div class="step-text">Import data from an existing sheet in this spreadsheet</div>
          </div>

          <div class="step">
            <span class="step-num">3</span>
            <strong style="color: #667eea;">Option C: Create a Google Form</strong>
            <div class="step-text">Auto-create a form to collect customer information</div>
          </div>
        </div>

        <div class="button-group">
          <button class="btn-primary" onclick="importFileAction()">📁 Import File from Computer</button>
          <button class="btn-secondary" onclick="importFromSheetsAction()">📋 Import from Sheets</button>
          <button class="btn-success" onclick="createFormAction()">📝 Create Google Form</button>
        </div>
      </div>
    </div>

    <script>
      function importFileAction() {
        google.script.run.showFileUploadDialog();
      }
      function importFromSheetsAction() {
        google.script.run.showMultiSheetImportDialog();
      }
      function createFormAction() {
        google.script.run.createCustomerForm();
      }
    </script>
  `);

  SpreadsheetApp.getUi().showModelessDialog(html, '📥 Import Data');
}

function showSendEmailDialog() {
  if (importedData.length === 0) {
    showImportGuideDialog();
    return;
  }

  const templates = emailSystem.getTemplateList();
  const businesses = emailSystem.getBusinessList();

  let templateOptions = templates.map(t => `<option value="${t}">${t}</option>`).join('');
  let businessOptions = businesses.map(b => `<option value="${b}">${b}</option>`).join('');
  let customerOptions = importedData.map((c, i) => {
    const msg = c.customMessage ? ` - "${c.customMessage.substring(0, 30)}..."` : '';
    return `<option value="${i}">${c.firstName} (${c.email})${msg}</option>`;
  }).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.6em; margin: 0; font-weight: 700; letter-spacing: -0.5px; }
      .content { padding: 30px; }
      label { display: block; margin-top: 14px; font-weight: 500; color: #555; font-size: 0.95em; }
      input, select, textarea { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.95em; transition: all 0.3s ease; }
      input:focus, select:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
      textarea { resize: vertical; height: 100px; }
      button { background-color: #667eea; color: white; padding: 11px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; margin-top: 15px; }
      button:hover { background-color: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
      .button-group { display: flex; gap: 10px; margin-top: 24px; }
      .button-group button { flex: 1; }
      .preview { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 15px; border-left: 4px solid #667eea; border-radius: 6px; margin-top: 20px; max-height: 300px; overflow-y: auto; font-size: 12px; color: #555; }
      .info { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 12px; border-radius: 6px; margin-top: 10px; font-size: 0.9em; color: #555; line-height: 1.5; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>✉️ Send Email</h2>
      </div>
      <div class="content">

      <label>Select Customer:</label>
      <select id="customerSelect">
        <option value="">-- Choose a customer --</option>
        ${customerOptions}
      </select>

      <label>Email Template:</label>
      <select id="templateSelect">
        ${templateOptions}
      </select>

      <label>Business:</label>
      <select id="businessSelect">
        ${businessOptions}
      </select>

      <label>Email Subject:</label>
      <input type="text" id="emailSubject" placeholder="Your Quote is Ready!" value="Your Quote is Ready!">

      <label>Additional Data (JSON - optional):</label>
      <textarea id="additionalData" placeholder='{"quoteId": "Q-001", "totalAmount": "5000", "videoUrl": "https://..."}'></textarea>

      <div class="info">
        ℹ️ Custom message will be auto-filled from sheet if available
      </div>

      <div class="button-group">
        <button onclick="previewEmail()">👁️ Preview</button>
        <button onclick="sendEmail()" style="background-color: #4caf50;">📤 Send Email</button>
      </div>

      <div id="preview" class="preview" style="display:none;"></div>
    </div>

    <script>
      function previewEmail() {
        const customerIndex = document.getElementById('customerSelect').value;
        if (!customerIndex) {
          alert('❌ Please select a customer!');
          return;
        }

        let additionalData = {};
        try {
          const data = document.getElementById('additionalData').value;
          if (data) additionalData = JSON.parse(data);
        } catch (e) {
          alert('❌ Invalid JSON in Additional Data!');
          return;
        }

        google.script.run.previewEmailFunction(
          parseInt(customerIndex),
          document.getElementById('templateSelect').value,
          document.getElementById('businessSelect').value,
          additionalData,
          function(result) {
            const preview = document.getElementById('preview');
            if (result.success) {
              preview.innerHTML = '<strong>Preview:</strong><br>' + result.html.substring(0, 800) + '...';
              preview.style.display = 'block';
              alert('✅ Preview generated (check below)');
            } else {
              alert('❌ Error: ' + result.error);
            }
          }
        );
      }

      function sendEmail() {
        const customerIndex = document.getElementById('customerSelect').value;
        if (!customerIndex) {
          alert('❌ Please select a customer!');
          return;
        }

        let additionalData = {};
        try {
          const data = document.getElementById('additionalData').value;
          if (data) additionalData = JSON.parse(data);
        } catch (e) {
          alert('❌ Invalid JSON in Additional Data!');
          return;
        }

        google.script.run.sendEmailFunction(
          parseInt(customerIndex),
          document.getElementById('templateSelect').value,
          document.getElementById('businessSelect').value,
          document.getElementById('emailSubject').value,
          additionalData,
          function(result) {
            if (result.success) {
              alert('✅ ' + result.message);
              document.getElementById('customerSelect').value = '';
              document.getElementById('additionalData').value = '';
            } else {
              alert('❌ Error: ' + result.error);
            }
          }
        );
      }
    </script>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '✉️ Send Email');
}

function previewEmailFunction(customerIndex, templateName, businessKey, additionalData) {
  try {
    const customer = importedData[customerIndex];
    const business = emailSystem.getBusiness(businessKey);
    const template = emailSystem.getTemplate(templateName);

    const emailData = {
      firstName: customer.firstName,
      customMessage: customer.customMessage,
      ...additionalData,
      businessName: business.name,
      businessEmail: business.email,
      businessPhone: business.phone,
      businessWebsite: business.website,
      primaryColor: business.colors.primary,
      accentColor: business.colors.accent
    };

    let htmlContent = template;

    // Replace variables
    Object.keys(emailData).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      htmlContent = htmlContent.replace(regex, emailData[key] || '');
    });

    // Handle conditionals
    htmlContent = htmlContent.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, key, content) => {
      return emailData[key] ? content : '';
    });

    return { success: true, html: htmlContent };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function sendEmailFunction(customerIndex, templateName, businessKey, emailSubject, additionalData) {
  try {
    const customer = importedData[customerIndex];
    const result = emailSystem.sendEmail(
      customer.email,
      templateName,
      businessKey,
      emailSubject,
      {
        firstName: customer.firstName,
        customMessage: customer.customMessage,
        ...additionalData
      }
    );

    // Log the email
    if (result.success) {
      emailLogger.logEmail(
        customer.email,
        customer.firstName,
        templateName,
        businessKey,
        emailSubject,
        "✅ Sent",
        "",
        customer.sheetSource
      );
    } else {
      emailLogger.logEmail(
        customer.email,
        customer.firstName,
        templateName,
        businessKey,
        emailSubject,
        "❌ Failed",
        result.error,
        customer.sheetSource
      );
    }

    return result;
  } catch (error) {
    emailLogger.logEmail(
      customer.email,
      customer.firstName,
      templateName,
      businessKey,
      emailSubject,
      "❌ Failed",
      error.message,
      customer.sheetSource
    );
    return { success: false, error: error.message };
  }
}

// ===== STATS DASHBOARD =====
function showStatsDashboard() {
  const stats = emailLogger.getQuotaStats();

  const quotaBar = '<div style="background-color: #f5f5f5; border-radius: 5px; height: 30px; overflow: hidden; margin: 10px 0;">' +
    '<div style="background-color: #4caf50; height: 100%; width: ' + stats.percentUsed + '%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">' +
    stats.percentUsed + '%</div>' +
    '</div>';

  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.6em; margin: 0; font-weight: 700; }
      .content { padding: 30px; }
      .stat-box { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
      .stat-box h3 { font-size: 1.1em; font-weight: 600; color: #667eea; margin-bottom: 15px; }
      .stat-item { display: flex; justify-content: space-between; align-items: center; margin: 12px 0; font-size: 15px; }
      .stat-label { font-weight: 500; color: #555; }
      .stat-value { color: #667eea; font-weight: 700; font-size: 1.1em; }
      .success { color: #4caf50; }
      .warning { color: #ff9800; }
      .danger { color: #f44336; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>📊 Email Statistics</h2>
      </div>
      <div class="content">
        <div class="stat-box">
          <h3>Today's Email Activity</h3>
        <div class="stat-item">
          <span class="stat-label">Emails Sent:</span>
          <span class="stat-value success">` + stats.sent + `</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Emails Failed:</span>
          <span class="stat-value danger">` + stats.failed + `</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Daily Limit:</span>
          <span class="stat-value">` + stats.dailyLimit + `</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Remaining Quota:</span>
          <span class="stat-value` + (stats.remaining < 50 ? ' warning' : '') + `">` + stats.remaining + ` emails</span>
        </div>
      </div>
      <div class="stat-box">
        <h3 style="margin-top: 0; color: #0066cc;">Usage Progress</h3>
        ` + quotaBar + `
        <p style="text-align: center; margin: 10px 0; font-size: 12px; color: #666;">
          You've used <strong>` + stats.percentUsed + `%</strong> of your daily quota
        </p>
      </div>
    </div>
  `);

  SpreadsheetApp.getUi().showModelessDialog(html, '📊 Dashboard');
}

// ===== EMAIL LOGS SHEET =====
function showEmailLogs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("📊 Email Logs");

  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ Email logs sheet not found!');
    return;
  }

  SpreadsheetApp.getUi().alert('✅ Email logs sheet opened! Check the "📊 Email Logs" tab.');
}

// ===== TEMPLATE MANAGER =====
function showTemplateManager() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 900px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.6em; margin: 0; font-weight: 700; }
      .content { padding: 30px; }
      .tabs { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
      .tab-btn { padding: 10px 16px; border: 2px solid #ddd; background-color: white; cursor: pointer; border-radius: 6px; font-weight: 600; transition: all 0.3s ease; color: #555; }
      .tab-btn:hover { border-color: #667eea; }
      .tab-btn.active { background-color: #667eea; color: white; border-color: #667eea; }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
      label { display: block; margin-top: 12px; font-weight: 500; color: #555; font-size: 0.95em; }
      input, select, textarea { width: 100%; padding: 10px 12px; margin-top: 6px; border: 1px solid #ddd; border-radius: 6px; font-family: inherit; font-size: 0.95em; transition: all 0.3s ease; }
      input:focus, select:focus, textarea:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
      textarea { resize: vertical; height: 300px; font-family: 'Courier New', monospace; font-size: 12px; }
      button { background-color: #667eea; color: white; padding: 11px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; transition: all 0.3s ease; margin-top: 15px; }
      button:hover { background-color: #5568d3; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3); }
      .template-list { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 12px; border-radius: 6px; margin-top: 10px; border-left: 4px solid #667eea; }
      .template-item { padding: 10px; margin: 6px 0; background-color: white; border-radius: 6px; transition: all 0.3s ease; }
      .template-item:hover { box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15); }
      .help { background-color: #f0f4ff; padding: 12px; border-radius: 6px; margin-top: 10px; font-size: 12px; color: #555; border-left: 4px solid #667eea; line-height: 1.5; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>🎨 Manage Templates</h2>
      </div>
      <div class="content">
        <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('view')">📋 View Templates</button>
        <button class="tab-btn" onclick="switchTab('edit')">✏️ Edit Template</button>
        <button class="tab-btn" onclick="switchTab('create')">➕ Create New</button>
        <button class="tab-btn" onclick="switchTab('help')">❓ Help</button>
      </div>

      <div id="view" class="tab-content active">
        <h3>Current Templates:</h3>
        <div id="templateList" class="template-list"></div>
      </div>

      <div id="edit" class="tab-content">
        <label>Select Template to Edit:</label>
        <select id="editTemplateSelect">
          <option value="">-- Choose a template --</option>
        </select>

        <label>Template HTML Code:</label>
        <textarea id="editTemplateCode"></textarea>

        <div class="help">
          💡 Use {{variables}} like {{firstName}}, {{customMessage}}, {{videoUrl}}<br>
          Use conditionals: {{#if customMessage}}...{{/if}}
        </div>

        <button onclick="saveEditTemplate()">💾 Save Changes</button>
      </div>

      <div id="create" class="tab-content">
        <label>Template Name (e.g., "thank-you"):</label>
        <input type="text" id="newTemplateName" placeholder="thank-you">

        <label>Template HTML Code:</label>
        <textarea id="newTemplateCode" placeholder="<html><body>Hi {{firstName}},<br>{{customMessage}}</body></html>"></textarea>

        <div class="help">
          💡 Use {{variables}} like {{firstName}}, {{customMessage}}, {{videoUrl}}<br>
          Use conditionals: {{#if customMessage}}...{{/if}}
        </div>

        <button onclick="createNewTemplate()">✅ Create Template</button>
      </div>

      <div id="help" class="tab-content">
        <h3>📖 Template Variables & Tips</h3>

        <h4>Standard Variables:</h4>
        <ul>
          <li><code>{{firstName}}</code> - Customer's first name</li>
          <li><code>{{customMessage}}</code> - Custom message from sheet</li>
          <li><code>{{businessName}}</code> - Your business name</li>
          <li><code>{{businessEmail}}</code> - Your business email</li>
          <li><code>{{businessPhone}}</code> - Your business phone</li>
          <li><code>{{primaryColor}}</code> - Your primary brand color</li>
          <li><code>{{accentColor}}</code> - Your accent color</li>
        </ul>

        <h4>Custom Data Variables:</h4>
        <ul>
          <li><code>{{quoteId}}</code> - Add in "Additional Data"</li>
          <li><code>{{totalAmount}}</code> - Add in "Additional Data"</li>
          <li><code>{{videoUrl}}</code> - Add in "Additional Data" or sheet</li>
          <li><code>{{demoLink}}</code> - Add in "Additional Data"</li>
          <li>Any other data you add!</li>
        </ul>

        <h4>Adding Videos:</h4>
        <pre>&lt;iframe width="100%" height="315" src="{{videoUrl}}" frameborder="0" allow="accelerometer; autoplay" allowfullscreen&gt;&lt;/iframe&gt;</pre>

        <h4>Adding Links:</h4>
        <pre>&lt;a href="{{demoLink}}" style="color: {{primaryColor}};"&gt;Click Here&lt;/a&gt;</pre>

        <h4>Conditionals:</h4>
        <pre>{{#if customMessage}}
  &lt;p&gt;{{customMessage}}&lt;/p&gt;
{{/if}}</pre>

        <h4>Example: Quote Template with Video & Custom Message</h4>
        <pre>&lt;html&gt;
  &lt;body&gt;
    &lt;h1&gt;Hi {{firstName}},&lt;/h1&gt;
    {{#if customMessage}}
      &lt;p&gt;{{customMessage}}&lt;/p&gt;
    {{/if}}
    &lt;iframe src="{{videoUrl}}"&gt;&lt;/iframe&gt;
    &lt;a href="{{demoLink}}"&gt;Learn More&lt;/a&gt;
  &lt;/body&gt;
&lt;/html&gt;</pre>
      </div>
    </div>

    <script>
      function switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');
        event.target.classList.add('active');

        if (tabName === 'view') loadTemplatesList();
        if (tabName === 'edit') loadEditTemplates();
      }

      function loadTemplatesList() {
        google.script.run.getTemplatesList(function(templates) {
          const html = templates.map(t => '<div class="template-item"><strong>📧 ' + t + '</strong></div>').join('');
          document.getElementById('templateList').innerHTML = html;
        });
      }

      function loadEditTemplates() {
        google.script.run.getTemplatesList(function(templates) {
          const select = document.getElementById('editTemplateSelect');
          select.innerHTML = '<option value="">-- Choose --</option>';
          templates.forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            option.text = t;
            select.appendChild(option);
          });
        });
      }

      function saveEditTemplate() {
        const name = document.getElementById('editTemplateSelect').value;
        const code = document.getElementById('editTemplateCode').value;
        if (!name) {
          alert('❌ Please select a template!');
          return;
        }
        google.script.run.updateTemplate(name, code);
      }

      function createNewTemplate() {
        const name = document.getElementById('newTemplateName').value;
        const code = document.getElementById('newTemplateCode').value;
        if (!name || !code) {
          alert('❌ Please fill in all fields!');
          return;
        }
        google.script.run.addNewTemplate(name, code);
      }

      loadTemplatesList();
    </script>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '🎨 Template Manager');
}

function getTemplatesList() {
  return emailSystem.getTemplateList();
}

function updateTemplate(templateName, htmlCode) {
  emailSystem.addTemplate(templateName, htmlCode);
  templateStorage.saveTemplate(templateName, htmlCode);
  SpreadsheetApp.getUi().alert(`✅ Template "${templateName}" updated and saved!`);
}

function addNewTemplate(templateName, htmlCode) {
  emailSystem.addTemplate(templateName, htmlCode);
  templateStorage.saveTemplate(templateName, htmlCode);
  SpreadsheetApp.getUi().alert(`✅ Template "${templateName}" created and saved!`);
}

// ===== VIEW LISTS =====
function showBusinessesList() {
  const businesses = emailSystem.getBusinessList();
  const list = businesses.map(b => {
    const biz = emailSystem.getBusiness(b);
    return `<div class="item"><strong>${b}:</strong> ${biz.name} (${biz.email})</div>`;
  }).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.5em; margin: 0; font-weight: 700; }
      .content { padding: 30px; }
      .item { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; color: #555; }
      .item strong { color: #667eea; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>📧 Your Businesses</h2>
      </div>
      <div class="content">
        ${list}
      </div>
    </div>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '📧 Businesses');
}

function showTemplatesList() {
  const templates = emailSystem.getTemplateList();
  const list = templates.map(t => `<div class="item">📧 <strong>${t}</strong></div>`).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 0; background: #f9f9f9; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
      .header-section { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
      .header-section h2 { font-size: 1.5em; margin: 0; font-weight: 700; }
      .content { padding: 30px; }
      .item { background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%); padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #667eea; color: #667eea; font-weight: 500; }
    </style>
    <div class="container">
      <div class="header-section">
        <h2>📧 Your Templates</h2>
      </div>
      <div class="content">
        ${list}
      </div>
    </div>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '📧 Templates');
}
