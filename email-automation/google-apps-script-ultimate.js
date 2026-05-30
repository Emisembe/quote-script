// ===== EMAIL AUTOMATION SYSTEM v3.0 =====
// Configuration-driven, flawless email automation with personalization
// Based on proven Election Manager architectural patterns

// ===== CONFIGURATION =====
const CONFIG = {
  // Business information
  BUSINESS: {
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
  },

  // Email templates
  TEMPLATES: {
    "quote-sent": "Quote notification with custom message support",
    "follow-up": "Follow-up reminder with call scheduling",
    "special-offer": "Limited-time offer with urgency",
    "payment-reminder": "Payment due reminder with amount",
    "video-demo": "Video demo with embedded player"
  },

  // Column definitions for imported data
  DATA_COL: {
    EMAIL: 1,
    FIRST_NAME: 2,
    LAST_NAME: 3,
    AMOUNT: 4,
    CUSTOM_MESSAGE: 5,
    ADDITIONAL_DATA: 6
  },

  // Sheet names for system sheets
  SYSTEM_SHEETS: [
    "📊 Email Logs",
    "📋 Templates Storage",
    "📋 Instructions"
  ],

  // Campaign sheet pattern
  CAMPAIGN_PATTERN: "📧",

  // Validation rules
  VALIDATION: {
    MIN_EMAIL_LENGTH: 5,
    MAX_EMAIL_LENGTH: 254,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // Email sending limits (per execution)
  LIMITS: {
    MAX_BATCH_SIZE: 50,
    MAX_RETRIES: 3
  }
};

// ===== GLOBAL VARIABLES =====
let emailSystem = null;
let emailLogger = null;
let templateStorage = null;
let importedData = {
  data: [],
  dataLoaded: false,
  errorMessage: null
};

// ===== EMAIL SYSTEM CLASS =====
class EmailAutomationSystem {
  constructor() {
    this.businesses = CONFIG.BUSINESS;
    this.templates = {};
    this.loadTemplates();
  }

  loadTemplates() {
    this.templates = {
      "quote-sent": this.getQuoteSentTemplate(),
      "follow-up": this.getFollowUpTemplate(),
      "special-offer": this.getSpecialOfferTemplate(),
      "payment-reminder": this.getPaymentReminderTemplate(),
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

  getPaymentReminderTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background-color: #d32f2f; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">💳 Payment Reminder</h1></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">This is a friendly reminder that your payment is now due.</p><div style="background-color: #fff3cd; border-left: 4px solid #d32f2f; padding: 20px; margin: 20px 0; border-radius: 5px;"><p style="margin: 5px 0;"><strong>Amount Due:</strong> {{amount}}</p><p style="margin: 5px 0;"><strong>Customer #:</strong> {{customerNumber}}</p><p style="margin: 5px 0;"><strong>Due Date:</strong> {{dueDate}}</p></div>{{#if customMessage}}<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;"><p style="color: #333;">{{customMessage}}</p></div>{{/if}}<p style="color: #666; line-height: 1.6;">Thank you for your prompt attention to this matter. If you have questions, please contact us immediately.</p><div style="text-align: center; margin: 30px 0;"><a href="{{paymentLink}}" style="background-color: #d32f2f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Make Payment</a></div></div></div></body></html>`;
  }

  getVideoDemoTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Check Out Our Demo Video</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">I wanted to show you a quick demo of our service!</p>{{#if videoUrl}}<div style="background-color: #000; border-radius: 8px; overflow: hidden; margin: 20px 0; max-width: 100%;"><iframe width="100%" height="315" src="{{videoUrl}}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="display: block;"></iframe></div>{{/if}}{{#if customMessage}}<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="color: #333;">{{customMessage}}</p></div>{{/if}}<p style="color: #666; line-height: 1.6;">Let me know if you have any questions!</p><div style="text-align: center; margin: 30px 0;"><a href="{{demoLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Learn More</a></div></div></div></body></html>`;
  }

  // Send email with validation
  sendEmail(recipientEmail, templateName, businessKey, emailSubject, data) {
    const validationError = this.validateEmail_(recipientEmail);
    if (validationError) {
      return { success: false, error: validationError, email: recipientEmail };
    }

    if (!this.businesses[businessKey]) {
      return { success: false, error: `Business "${businessKey}" not found`, email: recipientEmail };
    }

    if (!this.templates[templateName]) {
      return { success: false, error: `Template "${templateName}" not found`, email: recipientEmail };
    }

    if (!emailSubject || emailSubject.trim() === '') {
      return { success: false, error: "Subject cannot be empty", email: recipientEmail };
    }

    try {
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

      // Handle conditionals
      htmlContent = htmlContent.replace(/{{#if (\w+)}}(.*?){{\/if}}/gs, (match, key, content) => {
        return emailData[key] ? content : '';
      });

      GmailApp.sendEmail(recipientEmail, emailSubject, '', { htmlBody: htmlContent });

      emailLogger.logSuccess(recipientEmail, businessKey, templateName, emailSubject);
      return { success: true, message: `Email sent to ${recipientEmail}` };
    } catch (error) {
      emailLogger.logError(recipientEmail, businessKey, templateName, emailSubject, error.message);
      return { success: false, error: error.message, email: recipientEmail };
    }
  }

  validateEmail_(email) {
    if (!email) return "Email is required";
    if (email.length < CONFIG.VALIDATION.MIN_EMAIL_LENGTH) return `Email too short (min ${CONFIG.VALIDATION.MIN_EMAIL_LENGTH} chars)`;
    if (email.length > CONFIG.VALIDATION.MAX_EMAIL_LENGTH) return `Email too long (max ${CONFIG.VALIDATION.MAX_EMAIL_LENGTH} chars)`;
    if (!CONFIG.VALIDATION.EMAIL_REGEX.test(email)) return `Invalid email format: ${email}`;
    return null;
  }

  addTemplate(templateName, htmlContent) {
    if (!templateName || templateName.trim() === '') return { success: false, error: "Template name required" };
    if (!htmlContent || htmlContent.trim() === '') return { success: false, error: "Template content required" };
    this.templates[templateName] = htmlContent;
    templateStorage.saveTemplate(templateName, htmlContent);
    return { success: true, message: `Template "${templateName}" saved` };
  }

  addBusiness(businessKey, businessData) {
    if (!businessKey || businessKey.trim() === '') return { success: false, error: "Business key required" };
    if (!businessData.name) return { success: false, error: "Business name required" };
    if (!businessData.email) return { success: false, error: "Business email required" };
    this.businesses[businessKey] = businessData;
    return { success: true, message: `Business "${businessKey}" added` };
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
}

// ===== EMAIL LOGGER CLASS =====
class EmailLogger {
  constructor() {
    this.sheet = null;
    this.ensureSheet_();
  }

  ensureSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("📊 Email Logs");
    if (!sheet) {
      sheet = ss.insertSheet("📊 Email Logs");
      sheet.appendRow(["Timestamp", "Email", "Business", "Template", "Subject", "Status", "Details"]);
      sheet.getRange(1, 1, 1, 7).setFontWeight("bold").setBackground("#0066cc").setFontColor("white");
    }
    this.sheet = sheet;
  }

  logSuccess(email, business, template, subject) {
    this.sheet.appendRow([
      new Date(),
      email,
      business,
      template,
      subject,
      "✅ Sent",
      ""
    ]);
  }

  logError(email, business, template, subject, error) {
    this.sheet.appendRow([
      new Date(),
      email,
      business,
      template,
      subject,
      "❌ Failed",
      error
    ]);
  }

  logImport(filename, recordCount, successCount, errorCount) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("📊 Email Logs");
    if (sheet) {
      sheet.appendRow([
        new Date(),
        `[IMPORT: ${filename}]`,
        "-",
        "-",
        `${recordCount} records`,
        `${successCount}✅ ${errorCount}❌`,
        ""
      ]);
    }
  }
}

// ===== TEMPLATE STORAGE CLASS =====
class TemplateStorage {
  constructor() {
    this.sheet = null;
    this.ensureSheet_();
    this.loadTemplates_();
  }

  ensureSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("📋 Templates Storage");
    if (!sheet) {
      sheet = ss.insertSheet("📋 Templates Storage");
      sheet.appendRow(["Template Name", "HTML Content", "Created", "Modified"]);
      sheet.getRange(1, 1, 1, 4).setFontWeight("bold").setBackground("#ff6600").setFontColor("white");
      sheet.setColumnWidth(1, 200);
      sheet.setColumnWidth(2, 800);
    }
    this.sheet = sheet;
  }

  loadTemplates_() {
    const data = this.sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const [name, content] = data[i];
      if (name && content) {
        emailSystem.templates[name] = content;
      }
    }
  }

  saveTemplate(name, content) {
    const data = this.sheet.getDataRange().getValues();
    let found = false;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === name) {
        this.sheet.getRange(i + 1, 2).setValue(content);
        this.sheet.getRange(i + 1, 4).setValue(new Date());
        found = true;
        break;
      }
    }
    if (!found) {
      this.sheet.appendRow([name, content, new Date(), new Date()]);
    }
  }

  getTemplate(name) {
    const data = this.sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === name) return data[i][1];
    }
    return null;
  }
}

// ===== SHEET PREPARER CLASS =====
class SheetPreparer {
  static createDataSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("📧 Email Campaign Data");

    if (!sheet) {
      sheet = ss.insertSheet("📧 Email Campaign Data");

      // Headers
      const headers = ["Email", "First Name", "Last Name", "Amount", "Custom Message", "Additional Data"];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0066cc").setFontColor("white");

      // Sample data
      const sampleData = [
        ["emisembe@gmail.com", "Emisembe", "Smith", "5000", "Special note about the quote", ""],
        ["emisembe@gmail.com", "John", "Doe", "3500", "First-time customer - needs explanation", ""],
        ["emisembe@gmail.com", "Jane", "Johnson", "7200", "", ""],
        ["emisembe@gmail.com", "Michael", "Brown", "4100", "Referred by Jane Johnson", ""]
      ];

      sampleData.forEach(row => sheet.appendRow(row));

      // Format columns
      sheet.setColumnWidth(1, 200);
      sheet.setColumnWidth(2, 120);
      sheet.setColumnWidth(3, 120);
      sheet.setColumnWidth(4, 100);
      sheet.setColumnWidth(5, 300);
      sheet.setColumnWidth(6, 200);
    }

    return sheet;
  }

  static createInstructionsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("📋 Instructions");

    if (!sheet) {
      sheet = ss.insertSheet("📋 Instructions");

      sheet.appendRow(["EMAIL AUTOMATION SYSTEM - INSTRUCTIONS"]);
      sheet.getRange(1, 1).setFontSize(16).setFontWeight("bold");

      sheet.appendRow([""]);
      sheet.appendRow(["QUICK START:"]);
      sheet.getRange(3, 1).setFontSize(12).setFontWeight("bold");

      sheet.appendRow(["1. Click 'Prepare Email Campaign Sheet' to see a sample data format"]);
      sheet.appendRow(["2. Edit the sample data with your recipients' emails and details"]);
      sheet.appendRow(["3. Select a template (or create a new one using 'Add Custom Template')"]);
      sheet.appendRow(["4. Configure your business settings"]);
      sheet.appendRow(["5. Click 'Send Bulk Emails' and select your campaign sheet"]);

      sheet.appendRow([""]);
      sheet.appendRow(["COLUMN DEFINITIONS:"]);
      sheet.getRange(9, 1).setFontSize(12).setFontWeight("bold");

      const columnDefs = [
        ["Email", "REQUIRED", "Recipient email address", "john@example.com"],
        ["First Name", "REQUIRED", "Recipient's first name for personalization", "John"],
        ["Last Name", "OPTIONAL", "Recipient's last name", "Doe"],
        ["Amount", "OPTIONAL", "Amount/value field (e.g., payment due)", "5000"],
        ["Custom Message", "OPTIONAL", "Custom message specific to this recipient", "VIP customer - special pricing"],
        ["Additional Data", "OPTIONAL", "Extra data as JSON (e.g., {'id': '123'})", ""]
      ];

      columnDefs.forEach((row, idx) => {
        sheet.appendRow(row);
        if (idx === 0) sheet.getRange(10 + idx, 1, 1, 4).setFontWeight("bold").setBackground("#f0f0f0");
      });

      // Format
      sheet.setColumnWidth(1, 150);
      sheet.setColumnWidth(2, 120);
      sheet.setColumnWidth(3, 300);
      sheet.setColumnWidth(4, 200);
    }

    return sheet;
  }
}

// ===== FILE IMPORT CLASS =====
class FileImporter {
  static parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    if (lines.length < 2) {
      return { success: false, error: "CSV file is empty or has no headers", data: [] };
    }

    const headers = lines[0].split(',').map(h => h.toString().trim().toLowerCase());
    const emailIndex = headers.findIndex(h => h === 'email');

    if (emailIndex === -1) {
      return { success: false, error: "CSV must have an 'Email' column", data: [] };
    }

    const data = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip blank lines

      try {
        const values = this.parseCSVLine_(line);
        if (values.length === 0) continue;

        const email = values[emailIndex] ? values[emailIndex].trim() : '';
        if (!email) {
          errors.push(`Row ${i + 1}: Missing email`);
          continue;
        }

        const record = {
          email: email,
          firstName: values[1] ? values[1].trim() : '',
          lastName: values[2] ? values[2].trim() : '',
          amount: values[3] ? values[3].trim() : '',
          customMessage: values[4] ? values[4].trim() : '',
          additionalData: values[5] ? values[5].trim() : ''
        };

        const emailError = emailSystem.validateEmail_(record.email);
        if (emailError) {
          errors.push(`Row ${i + 1}: ${emailError}`);
          continue;
        }

        data.push(record);
      } catch (e) {
        errors.push(`Row ${i + 1}: ${e.message}`);
      }
    }

    return {
      success: data.length > 0,
      data: data,
      errors: errors,
      message: `Loaded ${data.length} records${errors.length > 0 ? `, ${errors.length} errors` : ''}`
    };
  }

  static parseCSVLine_(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);

    return result;
  }
}

// ===== BULK EMAIL SENDER CLASS =====
class BulkEmailSender {
  static previewEmails(sheetName, templateName, businessKey, subject) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) return { success: false, error: `Sheet "${sheetName}" not found` };

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) return { success: false, error: "Sheet has no data rows" };

    const preview = [];
    for (let i = 1; i < Math.min(data.length, 4); i++) {
      preview.push({
        email: data[i][CONFIG.DATA_COL.EMAIL - 1] || '',
        firstName: data[i][CONFIG.DATA_COL.FIRST_NAME - 1] || ''
      });
    }

    return {
      success: true,
      totalRecords: data.length - 1,
      preview: preview,
      templateName: templateName,
      businessKey: businessKey,
      subject: subject
    };
  }

  static sendBulkEmails(sheetName, templateName, businessKey, subject) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    if (!sheet) {
      return { success: false, error: `Sheet "${sheetName}" not found`, sent: 0, failed: 0 };
    }

    const data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return { success: false, error: "Sheet has no data rows", sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;
    const errors = [];

    for (let i = 1; i < data.length; i++) {
      const email = data[i][CONFIG.DATA_COL.EMAIL - 1];
      const firstName = data[i][CONFIG.DATA_COL.FIRST_NAME - 1];
      const lastName = data[i][CONFIG.DATA_COL.LAST_NAME - 1];
      const amount = data[i][CONFIG.DATA_COL.AMOUNT - 1];
      const customMessage = data[i][CONFIG.DATA_COL.CUSTOM_MESSAGE - 1];
      const additionalData = data[i][CONFIG.DATA_COL.ADDITIONAL_DATA - 1];

      if (!email) continue;

      const emailData = {
        firstName: firstName || '',
        lastName: lastName || '',
        amount: amount || '',
        customMessage: customMessage || '',
        additionalData: additionalData || ''
      };

      const result = emailSystem.sendEmail(email, templateName, businessKey, subject, emailData);

      if (result.success) {
        sent++;
      } else {
        failed++;
        errors.push(result.error);
      }

      if (sent + failed >= CONFIG.LIMITS.MAX_BATCH_SIZE) break;
    }

    const timestamp = new Date().toLocaleString();
    emailLogger.logImport(sheetName, data.length - 1, sent, failed);

    return {
      success: failed === 0,
      sent: sent,
      failed: failed,
      totalAttempted: sent + failed,
      timestamp: timestamp,
      errors: errors.length > 0 ? errors.slice(0, 5) : []
    };
  }
}

// ===== UI DIALOGS =====
function showMainMenu() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333; }
        .container { background: white; border-radius: 10px; padding: 30px; max-width: 500px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
        h1 { color: #667eea; text-align: center; margin-top: 0; }
        .button-group { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        button { padding: 12px 20px; border: none; border-radius: 6px; font-size: 14px; font-weight: bold; cursor: pointer; transition: all 0.3s; }
        .btn-primary { background: #667eea; color: white; grid-column: 1 / -1; }
        .btn-primary:hover { background: #5568d3; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4); }
        .btn-secondary { background: #f0f0f0; color: #333; border: 2px solid #667eea; }
        .btn-secondary:hover { background: #667eea; color: white; }
        .section-title { font-weight: bold; margin-top: 20px; margin-bottom: 10px; color: #667eea; font-size: 14px; text-transform: uppercase; }
        .info-box { background: #e3f2fd; border-left: 4px solid #667eea; padding: 12px; margin: 10px 0; border-radius: 4px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📧 Email Automation</h1>
        <p style="text-align: center; color: #666;">Manage your email campaigns with ease</p>

        <div class="section-title">📋 Data Management</div>
        <div class="button-group">
          <button class="btn-secondary" onclick="google.script.run.showPrepareSheetDialog()">📊 Prepare Sheet</button>
          <button class="btn-secondary" onclick="google.script.run.showImportDialog()">📥 Import CSV</button>
        </div>

        <div class="section-title">✉️ Email Sending</div>
        <div class="button-group">
          <button class="btn-secondary" onclick="google.script.run.showSendBulkDialog()">🚀 Send Bulk</button>
          <button class="btn-secondary" onclick="google.script.run.showConfigDialog()">⚙️ Config</button>
        </div>

        <div class="section-title">🎨 Templates</div>
        <div class="button-group">
          <button class="btn-secondary" onclick="google.script.run.showTemplateDialog()">📝 View Templates</button>
          <button class="btn-secondary" onclick="google.script.run.showAddTemplateDialog()">➕ Add Template</button>
        </div>

        <div class="info-box">
          💡 New to this system? Start by clicking "Prepare Sheet" to see sample data format
        </div>
      </div>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModelessDialog(ui, "Email Automation System");
}

function showPrepareSheetDialog() {
  SheetPreparer.createDataSheet();
  SheetPreparer.createInstructionsSheet();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        h2 { color: #0066cc; margin-top: 0; }
        .success { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; border-radius: 4px; color: #2e7d32; }
        p { line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>✅ Sheet Prepared Successfully!</h2>
        <div class="success">
          <p><strong>Two sheets have been created:</strong></p>
          <ul>
            <li><strong>📧 Email Campaign Data</strong> - Your data sheet with sample recipients</li>
            <li><strong>📋 Instructions</strong> - Complete guide on how to format your data</li>
          </ul>
          <p><strong>Next steps:</strong></p>
          <ul>
            <li>Edit the email addresses and replace with your actual recipients</li>
            <li>Fill in First Name, Last Name, Amount, and Custom Message for each row</li>
            <li>Go to "Send Bulk Emails" to configure and send</li>
          </ul>
        </div>
      </div>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, "Sheet Prepared");
}

function showImportDialog() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
        h2 { color: #0066cc; margin-top: 0; text-align: center; }
        input[type="file"] { padding: 8px; margin: 10px 0; border: 2px solid #e0e0e0; border-radius: 4px; width: 100%; box-sizing: border-box; }
        button { background: #0066cc; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; width: 100%; }
        button:hover { background: #0052a3; }
        .info { background: #e3f2fd; border-left: 4px solid #0066cc; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
        .status { margin-top: 15px; padding: 10px; border-radius: 4px; display: none; }
        .status.success { background: #e8f5e9; color: #2e7d32; border-left: 4px solid #4caf50; }
        .status.error { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
        .loading { display: none; text-align: center; color: #666; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>📥 Import Data from CSV</h2>
        <div class="info">
          <strong>Supported formats:</strong> CSV or Excel files with columns: Email, First Name, Last Name, Amount, Custom Message, Additional Data
        </div>

        <input type="file" id="fileInput" accept=".csv,.xlsx,.xls" onchange="handleFileSelect(event)">

        <button onclick="uploadFile()">📤 Upload & Import</button>

        <div class="loading" id="loading">⏳ Processing file... this may take a moment</div>
        <div class="status" id="status"></div>
      </div>

      <script>
        function handleFileSelect(event) {
          const file = event.target.files[0];
          if (!file) return;
          if (!file.name.match(/\\.(csv|xlsx|xls)$/)) {
            showStatus('❌ Invalid file type. Please upload CSV or Excel file.', 'error');
            event.target.value = '';
          }
        }

        function uploadFile() {
          const file = document.getElementById('fileInput').files[0];
          if (!file) {
            showStatus('❌ Please select a file first', 'error');
            return;
          }

          document.getElementById('loading').style.display = 'block';
          document.getElementById('status').style.display = 'none';

          const reader = new FileReader();
          reader.onload = function(e) {
            const content = e.target.result;
            google.script.run.withSuccessHandler(function(result) {
              document.getElementById('loading').style.display = 'none';
              if (result.success) {
                showStatus('✅ Data loaded: ' + result.message, 'success');
              } else {
                showStatus('⚠️ ' + result.message + (result.errors && result.errors.length > 0 ? '\\n' + result.errors.join('\\n') : ''), 'error');
              }
            }).processImportedFile(file.name, content);
          };
          reader.readAsText(file);
        }

        function showStatus(msg, type) {
          const status = document.getElementById('status');
          status.textContent = msg;
          status.className = 'status ' + type;
          status.style.display = 'block';
        }
      </script>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, "Import CSV Data");
}

function showSendBulkDialog() {
  const sheets = getSheetList_();
  const templates = emailSystem.getTemplateList();
  const businesses = emailSystem.getBusinessList();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 700px; margin: 0 auto; }
        h2 { color: #0066cc; margin-top: 0; text-align: center; }
        .form-group { margin: 20px 0; }
        label { display: block; font-weight: bold; color: #333; margin-bottom: 6px; font-size: 14px; }
        select, input[type="text"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; }
        select:focus, input[type="text"]:focus { outline: none; border-color: #0066cc; box-shadow: 0 0 5px rgba(0, 102, 204, 0.3); }
        .button-group { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px; }
        button { padding: 12px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: bold; }
        .btn-preview { background: #ff9800; color: white; }
        .btn-preview:hover { background: #f57c00; }
        .btn-send { background: #4caf50; color: white; grid-column: 1 / -1; }
        .btn-send:hover { background: #45a049; }
        .info { background: #e3f2fd; border-left: 4px solid #0066cc; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
        .error { background: #ffebee; border-left: 4px solid #f44336; color: #c62828; }
        .status { margin-top: 15px; padding: 10px; border-radius: 4px; display: none; }
        .status.success { background: #e8f5e9; color: #2e7d32; border-left: 4px solid #4caf50; }
        .status.error { background: #ffebee; color: #c62828; border-left: 4px solid #f44336; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>🚀 Send Bulk Emails</h2>

        <div class="form-group">
          <label for="sheet">📋 Select Data Sheet:</label>
          <select id="sheet" onchange="validateForm()">
            <option value="">-- Choose a sheet --</option>`;

  sheets.forEach(name => {
    html += `<option value="${name}">${name}</option>`;
  });

  html += `
          </select>
        </div>

        <div class="form-group">
          <label for="template">✉️ Select Template:</label>
          <select id="template" onchange="validateForm()">
            <option value="">-- Choose a template --</option>`;

  templates.forEach(name => {
    html += `<option value="${name}">${name}</option>`;
  });

  html += `
          </select>
        </div>

        <div class="form-group">
          <label for="business">🏢 Select Business:</label>
          <select id="business" onchange="validateForm()">
            <option value="">-- Choose a business --</option>`;

  businesses.forEach(key => {
    const biz = google.script.run.getBusiness(key);
    html += `<option value="${key}">${key} (${biz.name})</option>`;
  });

  html += `
          </select>
        </div>

        <div class="form-group">
          <label for="subject">📌 Email Subject:</label>
          <input type="text" id="subject" placeholder="e.g., Your Quote is Ready!">
        </div>

        <div class="info">
          💡 <strong>Tip:</strong> Click "Preview" first to see how many emails will be sent and verify your selection
        </div>

        <div class="button-group">
          <button class="btn-preview" onclick="previewSend()">👁️ Preview</button>
          <button class="btn-send" id="sendBtn" onclick="sendEmails()" disabled>🚀 Send Now</button>
        </div>

        <div class="status" id="status"></div>
      </div>

      <script>
        function validateForm() {
          const sheet = document.getElementById('sheet').value;
          const template = document.getElementById('template').value;
          const subject = document.getElementById('subject').value.trim();
          document.getElementById('sendBtn').disabled = !(sheet && template && subject);
        }

        function previewSend() {
          const sheet = document.getElementById('sheet').value;
          const template = document.getElementById('template').value;
          const subject = document.getElementById('subject').value;

          if (!sheet || !template || !subject) {
            showStatus('❌ Please fill in all fields first', 'error');
            return;
          }

          google.script.run.withSuccessHandler(function(result) {
            if (result.success) {
              let msg = '✅ Preview: ' + result.totalRecords + ' emails ready to send\\n\\nFirst 3 recipients:\\n';
              result.preview.forEach((p, i) => {
                msg += '- ' + p.firstName + ' (' + p.email + ')\\n';
              });
              showStatus(msg, 'success');
            } else {
              showStatus('❌ ' + result.error, 'error');
            }
          }).previewBulkSend(sheet, template, document.getElementById('business').value, subject);
        }

        function sendEmails() {
          const sheet = document.getElementById('sheet').value;
          const template = document.getElementById('template').value;
          const business = document.getElementById('business').value;
          const subject = document.getElementById('subject').value;

          if (confirm('Are you sure you want to send ' + document.getElementById('sheet').options[document.getElementById('sheet').selectedIndex].text + '?')) {
            google.script.run.withSuccessHandler(function(result) {
              if (result.success) {
                showStatus('✅ SUCCESS: ' + result.sent + ' emails sent\\n📧 Timestamp: ' + result.timestamp, 'success');
              } else {
                showStatus('⚠️ Completed with ' + result.failed + ' failures out of ' + result.totalAttempted + '\\n✅ Sent: ' + result.sent, 'error');
              }
              setTimeout(() => google.script.host.close(), 2000);
            }).sendBulkEmails(sheet, template, business, subject);
          }
        }

        function showStatus(msg, type) {
          const status = document.getElementById('status');
          status.textContent = msg;
          status.className = 'status ' + type;
          status.style.display = 'block';
        }
      </script>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, "Send Bulk Emails");
}

function showConfigDialog() {
  const businesses = CONFIG.BUSINESS;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 700px; margin: 0 auto; }
        h2 { color: #0066cc; margin-top: 0; text-align: center; }
        .business-card { border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 15px 0; background: #f9f9f9; }
        .business-card h3 { margin-top: 0; color: #333; }
        .field { margin: 12px 0; }
        label { display: block; font-weight: bold; color: #555; margin-bottom: 5px; font-size: 13px; }
        input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px; box-sizing: border-box; }
        button { background: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; margin-top: 15px; width: 100%; }
        button:hover { background: #0052a3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>⚙️ Business Configuration</h2>
        <p style="color: #666; text-align: center;">Edit your business settings that appear in emails</p>`;

  Object.keys(businesses).forEach(key => {
    const biz = businesses[key];
    html += `
      <div class="business-card">
        <h3>${key}</h3>
        <div class="field">
          <label>Business Name:</label>
          <input type="text" id="name_${key}" value="${biz.name || ''}">
        </div>
        <div class="field">
          <label>Email:</label>
          <input type="email" id="email_${key}" value="${biz.email || ''}">
        </div>
        <div class="field">
          <label>Phone:</label>
          <input type="text" id="phone_${key}" value="${biz.phone || ''}">
        </div>
        <div class="field">
          <label>Website:</label>
          <input type="url" id="website_${key}" value="${biz.website || ''}">
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div class="field" style="margin: 0;">
            <label>Primary Color:</label>
            <input type="color" id="primary_${key}" value="${biz.colors.primary || '#0066cc'}">
          </div>
          <div class="field" style="margin: 0;">
            <label>Accent Color:</label>
            <input type="color" id="accent_${key}" value="${biz.colors.accent || '#ff6600'}">
          </div>
        </div>
      </div>`;
  });

  html += `
        <button onclick="saveConfig()">💾 Save Configuration</button>
      </div>

      <script>
        function saveConfig() {
          const businesses = ${JSON.stringify(Object.keys(businesses))};
          const config = {};

          businesses.forEach(key => {
            config[key] = {
              name: document.getElementById('name_' + key).value,
              email: document.getElementById('email_' + key).value,
              phone: document.getElementById('phone_' + key).value,
              website: document.getElementById('website_' + key).value,
              colors: {
                primary: document.getElementById('primary_' + key).value,
                accent: document.getElementById('accent_' + key).value
              }
            };
          });

          google.script.run.saveBusinessConfig(config);
          alert('✅ Configuration saved successfully!');
          google.script.host.close();
        }
      </script>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, "Business Configuration");
}

function showTemplateDialog() {
  const templates = emailSystem.getTemplateList();

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; }
        h2 { color: #0066cc; margin-top: 0; text-align: center; }
        .template-list { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .template-item { padding: 12px; background: #f5f5f5; border-radius: 6px; cursor: pointer; border: 2px solid transparent; transition: all 0.3s; }
        .template-item:hover { border-color: #0066cc; background: #e3f2fd; }
        .info { background: #e3f2fd; border-left: 4px solid #0066cc; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>📝 Email Templates</h2>
        <p style="color: #666;">Click a template to edit or view its content</p>

        <div class="template-list">`;

  templates.forEach(name => {
    html += `<div class="template-item" onclick="google.script.run.editTemplate('${name}')">${name}</div>`;
  });

  html += `
        </div>

        <div class="info">
          💡 Templates use placeholders like {{firstName}}, {{amount}}, {{customMessage}}<br>
          Use {{#if variable}}...{{/if}} for conditional content
        </div>

        <button style="background: #0066cc; color: white; padding: 12px; width: 100%; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;" onclick="google.script.run.showAddTemplateDialog()">➕ Create New Template</button>
      </div>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, "Templates");
}

function showAddTemplateDialog() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { background: white; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); max-width: 900px; margin: 0 auto; }
        h2 { color: #0066cc; margin-top: 0; }
        .form-group { margin: 20px 0; }
        label { display: block; font-weight: bold; color: #333; margin-bottom: 8px; }
        input[type="text"], textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; box-sizing: border-box; font-family: monospace; }
        textarea { min-height: 300px; }
        .info { background: #fff3cd; border-left: 4px solid #ff9800; padding: 12px; margin: 15px 0; border-radius: 4px; font-size: 13px; }
        button { background: #4caf50; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
        button:hover { background: #45a049; }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>➕ Create New Template</h2>

        <div class="form-group">
          <label for="templateName">Template Name:</label>
          <input type="text" id="templateName" placeholder="e.g., welcome-email">
        </div>

        <div class="form-group">
          <label for="templateContent">HTML Content:</label>
          <textarea id="templateContent" placeholder="Enter HTML template..."></textarea>
        </div>

        <div class="info">
          <strong>Available placeholders:</strong><br>
          {{firstName}}, {{lastName}}, {{email}}, {{amount}}, {{customMessage}}<br>
          {{businessName}}, {{businessEmail}}, {{businessPhone}}, {{businessWebsite}}<br>
          {{primaryColor}}, {{accentColor}}<br><br>
          <strong>Conditionals:</strong> {{#if customMessage}}...{{/if}}
        </div>

        <button onclick="saveTemplate()">💾 Save Template</button>
      </div>

      <script>
        function saveTemplate() {
          const name = document.getElementById('templateName').value.trim();
          const content = document.getElementById('templateContent').value.trim();

          if (!name) { alert('❌ Template name required'); return; }
          if (!content) { alert('❌ Template content required'); return; }

          google.script.run.saveCustomTemplate(name, content);
          alert('✅ Template saved!');
          google.script.host.close();
        }
      </script>
    </body>
    </html>
  `;

  const ui = HtmlService.createHtmlOutput(html);
  SpreadsheetApp.getUi().showModalDialog(ui, "Create Template");
}

// ===== GOOGLE APPS SCRIPT ENTRY POINTS =====
function onOpen() {
  initializeSystems_();
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("📧 Email Automation")
    .addItem("📧 Open Main Menu", "showMainMenu")
    .addSeparator()
    .addItem("📋 Prepare Email Sheet", "showPrepareSheetDialog")
    .addItem("📥 Import CSV", "showImportDialog")
    .addSeparator()
    .addItem("🚀 Send Bulk Emails", "showSendBulkDialog")
    .addItem("⚙️ Business Config", "showConfigDialog")
    .addSeparator()
    .addItem("📝 Manage Templates", "showTemplateDialog")
    .addToUi();
}

function initializeSystems_() {
  emailSystem = new EmailAutomationSystem();
  emailLogger = new EmailLogger();
  templateStorage = new TemplateStorage();
}

function processImportedFile(filename, csvContent) {
  const result = FileImporter.parseCSV(csvContent);

  if (result.success && result.data.length > 0) {
    importedData.data = result.data;
    importedData.dataLoaded = true;
    importedData.errorMessage = null;
  } else {
    importedData.dataLoaded = false;
    importedData.errorMessage = result.message;
  }

  return {
    success: importedData.dataLoaded,
    message: result.message,
    errors: result.errors.slice(0, 10),
    dataLoaded: importedData.dataLoaded
  };
}

function previewBulkSend(sheetName, templateName, businessKey, subject) {
  return BulkEmailSender.previewEmails(sheetName, templateName, businessKey, subject);
}

function sendBulkEmails(sheetName, templateName, businessKey, subject) {
  return BulkEmailSender.sendBulkEmails(sheetName, templateName, businessKey, subject);
}

function saveBusinessConfig(config) {
  Object.assign(emailSystem.businesses, config);
  CONFIG.BUSINESS = config;
}

function getBusiness(key) {
  return emailSystem.getBusiness(key);
}

function saveCustomTemplate(name, content) {
  emailSystem.addTemplate(name, content);
}

function editTemplate(name) {
  alert(`Edit "${name}" template - Feature coming soon`);
}

function getSheetList_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const systemSheets = CONFIG.SYSTEM_SHEETS;

  return sheets
    .map(s => s.getName())
    .filter(name => !systemSheets.includes(name));
}
