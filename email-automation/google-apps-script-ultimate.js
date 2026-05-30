// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL AUTOMATION SYSTEM v4.0  —  Production Ready
//  Based on proven architectural patterns from Election Manager + Template System
// ═══════════════════════════════════════════════════════════════════════════

// ── §CONFIG ───────────────────────────────────────────────────────────────────
const CONFIG = {
  // ── Business information ──────────────────────────────────────────────────
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

  // ── Email templates ───────────────────────────────────────────────────────
  TEMPLATES: {
    "general-update": "Standard update with headline and message",
    "video-update": "Video sharing with YouTube thumbnail detection",
    "announcement": "Important announcement with urgent styling",
    "newsletter": "Multi-section newsletter with sections",
    "form-request": "Form/Survey with CTA button"
  },

  // ── Contact sheet columns ─────────────────────────────────────────────────
  CONTACT_COL: {
    NAME: 1,
    EMAIL: 2,
    GROUP: 3,
    ACTIVE: 4,
    TAGS: 5,
    MEMBER_NO: 6
  },

  // ── Email log columns ─────────────────────────────────────────────────────
  LOG_COL: {
    TIMESTAMP: 1,
    TEMPLATE: 2,
    SUBJECT: 3,
    COUNT: 4,
    STATUS: 5
  },

  // ── Sheet names ───────────────────────────────────────────────────────────
  SHEET_CONTACTS: 'Contacts',
  SHEET_LOG: 'Email Log',

  // ── Validation rules ──────────────────────────────────────────────────────
  VALIDATION: {
    MIN_EMAIL_LENGTH: 5,
    MAX_EMAIL_LENGTH: 254,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },

  // ── Limits ────────────────────────────────────────────────────────────────
  LIMITS: {
    MAX_BATCH_SIZE: 50,
    MAX_RETRIES: 3
  }
};

// ── SHEET NAMES ────────────────────────────────────────────────────────────
const SHEET_CONTACTS = CONFIG.SHEET_CONTACTS;
const SHEET_LOG = CONFIG.SHEET_LOG;
const CON_COL = CONFIG.CONTACT_COL;
const LOG_COL = CONFIG.LOG_COL;

// ── GLOBAL VARIABLES ───────────────────────────────────────────────────────
let emailSystem = null;
let emailLogger = null;
let templateStorage = null;

// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL SYSTEM CLASS
// ═══════════════════════════════════════════════════════════════════════════

class EmailAutomationSystem {
  constructor() {
    this.businesses = CONFIG.BUSINESS;
    this.templates = {};
    this.loadTemplates();
  }

  loadTemplates() {
    this.templates = {
      "general-update": this.getGeneralTemplate(),
      "video-update": this.getVideoTemplate(),
      "announcement": this.getAnnouncementTemplate(),
      "newsletter": this.getNewsletterTemplate(),
      "form-request": this.getFormTemplate()
    };
  }

  getGeneralTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">{{body}}</p>{{#if customMessage}}<div style="background-color: #fff3cd; border-left: 4px solid {{accentColor}}; padding: 15px; margin: 20px 0;"><p style="color: #333; font-style: italic;">{{customMessage}}</p></div>{{/if}}{{#if ctaUrl}}<div style="text-align: center; margin: 30px 0;"><a href="{{ctaUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">{{ctaText}}</a></div>{{/if}}</div><div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;"><p style="margin: 5px 0;">{{businessEmail}} | {{businessPhone}}</p></div></div></body></html>`;
  }

  getVideoTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Watch This Video</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">{{body}}</p>{{#if videoUrl}}<div style="background-color: #000; border-radius: 8px; overflow: hidden; margin: 20px 0; text-align: center;"><a href="{{videoUrl}}" style="display: inline-block;"><img src="https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" alt="Watch video" style="width: 100%; display: block; border-radius: 8px;"></a></div>{{/if}}{{#if customMessage}}<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;"><p style="color: #333;">{{customMessage}}</p></div>{{/if}}</div></div></body></html>`;
  }

  getAnnouncementTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background: linear-gradient(135deg, {{primaryColor}}, {{accentColor}}); color: white; padding: 40px 30px; text-align: center;"><div style="color: rgba(255,255,255,0.9); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 10px;">Important Announcement</div><h1 style="margin: 0; font-size: 28px;">{{headline}}</h1></div><div style="padding: 30px;"><p style="color: #666; line-height: 1.6;">{{body}}</p>{{#if ctaUrl}}<div style="text-align: center; margin: 30px 0;"><a href="{{ctaUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">{{ctaText}}</a></div>{{/if}}</div></div></body></html>`;
  }

  getNewsletterTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{headline}}</h1></div><div style="padding: 30px;"><p style="color: #666; line-height: 1.6;">{{body}}</p></div>{{#if section2}}<div style="background-color: #f5f5f5; border-top: 1px solid #e0e0e0; padding: 28px 30px;"><h2 style="color: {{primaryColor}}; font-size: 18px; margin: 0 0 12px;">{{section2headline}}</h2><p style="color: #666; line-height: 1.6;">{{section2body}}</p></div>{{/if}}{{#if section3}}<div style="padding: 28px 30px; border-top: 1px solid #e0e0e0;"><h2 style="color: {{primaryColor}}; font-size: 18px; margin: 0 0 12px;">{{section3headline}}</h2><p style="color: #666; line-height: 1.6;">{{section3body}}</p></div>{{/if}}</div></body></html>`;
  }

  getFormTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{headline}}</h1></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">{{body}}</p><div style="background-color: #F3F6FD; border: 2px solid {{primaryColor}}; border-radius: 8px; padding: 28px; margin: 26px 0; text-align: center;">{{#if formTitle}}<div style="font-size: 15px; font-weight: bold; color: #333; margin-bottom: 14px;">{{formTitle}}</div>{{/if}}<a href="{{formUrl}}" style="background-color: {{primaryColor}}; color: white; padding: 14px 36px; border-radius: 5px; text-decoration: none; font-size: 15px; font-weight: bold; display: inline-block;">{{formButtonText}}</a>{{#if formNote}}<div style="font-size: 12px; color: #777; margin-top: 14px;">{{formNote}}</div>{{/if}}</div></div></div></body></html>`;
  }

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
    if (email.length < CONFIG.VALIDATION.MIN_EMAIL_LENGTH) return `Email too short`;
    if (email.length > CONFIG.VALIDATION.MAX_EMAIL_LENGTH) return `Email too long`;
    if (!CONFIG.VALIDATION.EMAIL_REGEX.test(email)) return `Invalid email format`;
    return null;
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

// ═══════════════════════════════════════════════════════════════════════════
//  EMAIL LOGGER CLASS
// ═══════════════════════════════════════════════════════════════════════════

class EmailLogger {
  constructor() {
    this.sheet = null;
    this.ensureSheet_();
  }

  ensureSheet_() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_LOG);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_LOG);
      sheet.appendRow(["Timestamp", "Template", "Subject", "Count", "Status"]);
      sheet.getRange(1, 1, 1, 5).setFontWeight("bold").setBackground("#0066cc").setFontColor("white");
    }
    this.sheet = sheet;
  }

  logSuccess(email, business, template, subject) {
    this.sheet.appendRow([new Date(), template, subject, 1, "✅ Sent"]);
  }

  logError(email, business, template, subject, error) {
    this.sheet.appendRow([new Date(), template, subject, 0, "❌ Failed: " + error]);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CONTACT MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

class ContactManager {
  static ensureContactsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_CONTACTS);

    if (!sheet) {
      sheet = ss.insertSheet(SHEET_CONTACTS);
      sheet.appendRow(["Name", "Email", "Group", "Active (Y/N)", "Tags", "Member / Customer No."]);
      sheet.getRange(1, 1, 1, 6).setFontWeight("bold").setBackground("#0066cc").setFontColor("white");

      // Sample data
      sheet.appendRow(["Alice Johnson", "alice@example.com", "Members", "Y", "Finance,Events", "MEM-0001"]);
      sheet.appendRow(["Bob Mensah", "bob@example.com", "Members", "Y", "Events", "MEM-0002"]);
      sheet.appendRow(["Carol Osei", "carol@example.com", "Board", "Y", "Finance", "MEM-0003"]);

      sheet.setColumnWidth(1, 180);
      sheet.setColumnWidth(2, 230);
      sheet.setColumnWidth(3, 130);
      sheet.setColumnWidth(4, 110);
      sheet.setColumnWidth(5, 200);
      sheet.setColumnWidth(6, 170);
    }
    return sheet;
  }

  static addContact(data) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = this.ensureContactsSheet();

    const email = (data.email || '').toString().trim().toLowerCase();
    if (!email || email.indexOf('@') === -1) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    // Check if exists
    const lastRow = sh.getLastRow();
    if (lastRow >= 2) {
      const emails = sh.getRange(2, CON_COL.EMAIL, lastRow - 1, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if ((emails[i][0] || '').toString().trim().toLowerCase() === email) {
          const row = i + 2;
          sh.getRange(row, 1, 1, 6).setValues([[
            data.name || '',
            email,
            data.group || '',
            (data.active || 'Y').toUpperCase(),
            data.tags || '',
            data.memberNo || ''
          ]]);
          return { success: true, action: 'updated' };
        }
      }
    }

    sh.appendRow([
      data.name || '',
      email,
      data.group || '',
      (data.active || 'Y').toUpperCase(),
      data.tags || '',
      data.memberNo || ''
    ]);
    return { success: true, action: 'added' };
  }

  static getGroups() {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
    if (!sh || sh.getLastRow() < 2) return [];
    const vals = sh.getRange(2, CON_COL.GROUP, sh.getLastRow() - 1, 1).getValues();
    const seen = {};
    vals.forEach(r => {
      const g = (r[0] || '').toString().trim();
      if (g) seen[g] = 1;
    });
    return Object.keys(seen).sort();
  }

  static getTags() {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
    if (!sh || sh.getLastRow() < 2) return [];
    const vals = sh.getRange(2, CON_COL.TAGS, sh.getLastRow() - 1, 1).getValues();
    const seen = {};
    vals.forEach(r => {
      (r[0] || '').toString().split(',').forEach(t => {
        const tag = t.trim();
        if (tag) seen[tag] = 1;
      });
    });
    return Object.keys(seen).sort();
  }

  static resolveRecipients(mode, targetGroup, targetTag, manualEmails) {
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
    if (!sh || sh.getLastRow() < 2) return [];

    const data = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues();

    switch (mode) {
      case 'active':
        return data
          .filter(r => (r[CON_COL.EMAIL - 1] || '').toString().trim().indexOf('@') !== -1 && (r[CON_COL.ACTIVE - 1] || '').toString().toUpperCase() === 'Y')
          .map(r => ({
            name: (r[CON_COL.NAME - 1] || '').toString().trim(),
            email: (r[CON_COL.EMAIL - 1] || '').toString().trim(),
            group: (r[CON_COL.GROUP - 1] || '').toString().trim(),
            memberNo: (r[CON_COL.MEMBER_NO - 1] || '').toString().trim()
          }));

      case 'all':
        return data
          .filter(r => (r[CON_COL.EMAIL - 1] || '').toString().trim().indexOf('@') !== -1)
          .map(r => ({
            name: (r[CON_COL.NAME - 1] || '').toString().trim(),
            email: (r[CON_COL.EMAIL - 1] || '').toString().trim(),
            group: (r[CON_COL.GROUP - 1] || '').toString().trim(),
            memberNo: (r[CON_COL.MEMBER_NO - 1] || '').toString().trim()
          }));

      case 'group':
        const gTarget = targetGroup.trim().toLowerCase();
        return data
          .filter(r => {
            const email = (r[CON_COL.EMAIL - 1] || '').toString().trim();
            const group = (r[CON_COL.GROUP - 1] || '').toString().trim().toLowerCase();
            const active = (r[CON_COL.ACTIVE - 1] || '').toString().toUpperCase();
            return email.indexOf('@') !== -1 && active === 'Y' && group === gTarget;
          })
          .map(r => ({
            name: (r[CON_COL.NAME - 1] || '').toString().trim(),
            email: (r[CON_COL.EMAIL - 1] || '').toString().trim(),
            group: (r[CON_COL.GROUP - 1] || '').toString().trim(),
            memberNo: (r[CON_COL.MEMBER_NO - 1] || '').toString().trim()
          }));

      case 'tag':
        const tTarget = targetTag.trim().toLowerCase();
        return data
          .filter(r => {
            const email = (r[CON_COL.EMAIL - 1] || '').toString().trim();
            const tags = (r[CON_COL.TAGS - 1] || '').toString().toLowerCase();
            const active = (r[CON_COL.ACTIVE - 1] || '').toString().toUpperCase();
            const tagList = tags.split(',').map(t => t.trim());
            return email.indexOf('@') !== -1 && active === 'Y' && tagList.indexOf(tTarget) !== -1;
          })
          .map(r => ({
            name: (r[CON_COL.NAME - 1] || '').toString().trim(),
            email: (r[CON_COL.EMAIL - 1] || '').toString().trim(),
            group: (r[CON_COL.GROUP - 1] || '').toString().trim(),
            memberNo: (r[CON_COL.MEMBER_NO - 1] || '').toString().trim()
          }));

      case 'manual':
        return (manualEmails || '')
          .split(/[\n,;]+/)
          .map(e => e.trim())
          .filter(e => e.indexOf('@') !== -1)
          .map(e => ({ name: '', email: e, group: '', memberNo: '' }));

      default:
        return [];
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  SCHEDULING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

function scheduleEmail(data) {
  try {
    const fireAt = new Date(data.scheduledTime);
    if (isNaN(fireAt.getTime())) {
      return { success: false, error: 'Invalid date/time value.' };
    }
    if (fireAt <= new Date()) {
      return { success: false, error: 'Scheduled time must be in the future.' };
    }

    const trigger = ScriptApp.newTrigger('runScheduledEmail')
      .timeBased()
      .at(fireAt)
      .create();

    const key = 'SCHED_' + trigger.getUniqueId();
    data._schedKey = key;
    data._schedTime = fireAt.toISOString();
    PropertiesService.getScriptProperties().setProperty(key, JSON.stringify(data));

    const formatted = Utilities.formatDate(fireAt, Session.getScriptTimeZone(), 'EEE d MMM yyyy \'at\' HH:mm');
    return { success: true, scheduledTime: formatted };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function runScheduledEmail() {
  const props = PropertiesService.getScriptProperties();
  const allKeys = props.getKeys();
  const cfg = CONFIG;
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  allKeys.forEach(key => {
    if (key.indexOf('SCHED_') !== 0) return;

    let raw;
    try {
      raw = JSON.parse(props.getProperty(key));
    } catch (e) {
      props.deleteProperty(key);
      return;
    }

    const fireAt = new Date(raw._schedTime);
    if (fireAt > new Date(new Date().getTime() + 5 * 60 * 1000)) return;

    try {
      const recipients = ContactManager.resolveRecipients(raw.recipientMode, raw.targetGroup, raw.targetTag, raw.manualEmails);
      let sent = 0;

      recipients.forEach(contact => {
        const emailData = {
          ...raw,
          firstName: contact.name.split(/\s+/)[0] || 'Member',
          customMessage: raw.customMessage || '',
          memberNo: contact.memberNo || ''
        };

        const result = emailSystem.sendEmail(contact.email, raw.template, raw.business, raw.subject, emailData);
        if (result.success) sent++;
        Utilities.sleep(100);
      });

      emailLogger.logSuccess('', raw.business, raw.template, raw.subject);
    } catch (sendErr) {
      emailLogger.logError('', '', raw.template, raw.subject, sendErr.message);
    }

    ScriptApp.getProjectTriggers().forEach(t => {
      if ('SCHED_' + t.getUniqueId() === key) ScriptApp.deleteTrigger(t);
    });
    props.deleteProperty(key);
  });
}

function cancelScheduledEmail(schedKey) {
  try {
    const uid = schedKey.replace('SCHED_', '');
    ScriptApp.getProjectTriggers().forEach(t => {
      if (t.getUniqueId() === uid) ScriptApp.deleteTrigger(t);
    });
    PropertiesService.getScriptProperties().deleteProperty(schedKey);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function getScheduledEmails() {
  const props = PropertiesService.getScriptProperties();
  const allKeys = props.getKeys();
  const list = [];
  const tz = Session.getScriptTimeZone();

  allKeys.forEach(key => {
    if (key.indexOf('SCHED_') !== 0) return;
    let raw;
    try {
      raw = JSON.parse(props.getProperty(key));
    } catch (e) {
      return;
    }

    const fireAt = new Date(raw._schedTime);
    const formatted = Utilities.formatDate(fireAt, tz, 'EEE d MMM yyyy \'at\' HH:mm');

    list.push({
      schedKey: key,
      subject: raw.subject || '(no subject)',
      template: raw.template || '',
      scheduledTime: formatted,
      recipientMode: raw.recipientMode || ''
    });
  });

  list.sort((a, b) => a.scheduledTime < b.scheduledTime ? -1 : 1);
  return list;
}

// ═══════════════════════════════════════════════════════════════════════════
//  MENU & INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

function onOpen() {
  emailSystem = new EmailAutomationSystem();
  emailLogger = new EmailLogger();
  ContactManager.ensureContactsSheet();

  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 Email Automation')
    .addItem('✉️ Compose & Send', 'openComposeDialog')
    .addItem('📅 Scheduled Emails', 'openScheduleManager')
    .addSeparator()
    .addItem('👤 Add Contact', 'openAddContactDialog')
    .addItem('👥 View Contacts', 'goToContacts')
    .addItem('📋 View Email Log', 'goToLog')
    .addToUi();
}

function goToContacts() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_CONTACTS);
  if (sh) SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sh);
}

function goToLog() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_LOG);
  if (sh) SpreadsheetApp.getActiveSpreadsheet().setActiveSheet(sh);
}

// ═══════════════════════════════════════════════════════════════════════════
//  DIALOGS
// ═══════════════════════════════════════════════════════════════════════════

function openAddContactDialog() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html><html><head><style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 16px 20px; background: #f5f5f5; color: #333; }
    label { display: block; font-weight: bold; margin: 10px 0 3px; }
    label span { font-weight: normal; color: #777; }
    input, select { width: 100%; padding: 7px 10px; border: 1px solid #CCC; border-radius: 4px; font-size: 13px; }
    .row { display: flex; gap: 12px; margin-bottom: 10px; }
    .row > div { flex: 1; }
    .btn { padding: 9px 20px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
    .btn-primary { background: #0D47A1; color: white; width: 100%; margin-top: 10px; }
    .btn-cancel { background: #DDD; color: #444; }
    .status { margin-top: 10px; padding: 9px; border-radius: 4px; display: none; }
    .ok { background: #E8F5E9; color: #1B5E20; }
    .err { background: #FFCDD2; color: #B71C1C; }
    </style></head><body>
    <h2 style="color: #0D47A1; margin-top: 0;">Add / Update Contact</h2>
    <div class="row">
      <div><label>Full Name</label><input id="name" placeholder="Alice Johnson"></div>
      <div><label>Email</label><input id="email" type="email" placeholder="alice@example.com"></div>
    </div>
    <div class="row">
      <div><label>Group</label><input id="group" placeholder="Members, Board, etc."></div>
      <div><label>Active</label><select id="active"><option value="Y">Y — Yes</option><option value="N">N — No</option></select></div>
    </div>
    <label>Tags <span>(comma-separated)</span></label>
    <input id="tags" placeholder="Finance,Events">
    <label style="margin-top: 8px;">Member / Customer No.</label>
    <input id="memberNo" placeholder="MEM-0001">
    <div style="display: flex; gap: 10px; margin-top: 12px;">
      <button class="btn btn-cancel" onclick="google.script.host.close()">Cancel</button>
      <button class="btn btn-primary" id="saveBtn" onclick="doSave()">💾 Save</button>
    </div>
    <div class="status" id="statusBox"></div>

    <script>
      function doSave() {
        const email = document.getElementById('email').value.trim();
        if (!email || email.indexOf('@') === -1) { show('❌ Invalid email', 'err'); return; }
        const btn = document.getElementById('saveBtn');
        btn.disabled = true;
        google.script.run
          .withSuccessHandler(r => {
            if (r.success) { show('✅ Contact ' + r.action, 'ok'); btn.textContent = '✅ Done'; }
            else { show('❌ ' + r.error, 'err'); btn.disabled = false; }
          })
          .addContactData({
            name: document.getElementById('name').value.trim(),
            email: email,
            group: document.getElementById('group').value.trim(),
            active: document.getElementById('active').value,
            tags: document.getElementById('tags').value.trim(),
            memberNo: document.getElementById('memberNo').value.trim()
          });
      }
      function show(msg, cls) {
        const s = document.getElementById('statusBox');
        s.className = 'status ' + cls;
        s.textContent = msg;
        s.style.display = 'block';
      }
    </script>
    </body></html>
  `).setWidth(500).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, '👤 Add Contact');
}

function addContactData(data) {
  return ContactManager.addContact(data);
}

function openComposeDialog() {
  const html = HtmlService.createHtmlOutput(composeDialogHtml_())
    .setWidth(720).setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, '✉️ Compose & Send Email');
}

function getContactGroups() {
  return ContactManager.getGroups();
}

function getContactTags() {
  return ContactManager.getTags();
}

function sendEmailNow(data) {
  const recipients = ContactManager.resolveRecipients(data.recipientMode, data.targetGroup, data.targetTag, data.manualEmails);

  if (!recipients.length) {
    return { success: false, error: 'No valid recipients found.' };
  }

  let sent = 0, failed = [];

  recipients.forEach(contact => {
    const firstName = contact.name.split(/\s+/)[0] || 'Member';
    const emailData = {
      firstName: firstName,
      body: data.body || '',
      customMessage: data.customMessage || '',
      headline: data.headline || '',
      ctaText: data.ctaText || '',
      ctaUrl: data.ctaUrl || '',
      videoUrl: data.videoUrl || '',
      section2headline: data.section2headline || '',
      section2body: data.section2body || '',
      section3headline: data.section3headline || '',
      section3body: data.section3body || '',
      formUrl: data.formUrl || '',
      formButtonText: data.formButtonText || '',
      formTitle: data.formTitle || '',
      formNote: data.formNote || '',
      memberNo: contact.memberNo || ''
    };

    const result = emailSystem.sendEmail(contact.email, data.template, data.business, data.subject, emailData);
    if (result.success) sent++;
    else failed.push(contact.email);

    Utilities.sleep(100);
  });

  return { success: failed.length === 0, sent: sent, failed: failed.length, total: recipients.length };
}

function openScheduleManager() {
  const html = HtmlService.createHtmlOutput(scheduleManagerHtml_())
    .setWidth(700).setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(html, '📅 Scheduled Emails');
}

function scheduleManagerHtml_() {
  return `<!DOCTYPE html><html><head><style>
  body { font-family: Arial, sans-serif; font-size: 13px; color: #333; margin: 0; padding: 16px; background: #FAFAFA; }
  table { width: 100%; border-collapse: collapse; background: white; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
  th { background: #0D47A1; color: white; padding: 9px 10px; text-align: left; font-size: 12px; }
  td { padding: 9px 10px; border-bottom: 1px solid #EEE; }
  button { background: #C62828; color: white; border: none; border-radius: 4px; padding: 5px 12px; cursor: pointer; font-size: 12px; font-weight: bold; }
  button:hover { background: #B71C1C; }
  .empty { text-align: center; padding: 40px; color: #888; }
  </style></head><body>
  <h2 style="color: #0D47A1; margin: 0 0 12px;">📅 Scheduled Emails</h2>
  <div id="tableArea"><div class="empty">Loading...</div></div>

  <script>
    function load() {
      google.script.run.withSuccessHandler(render).getScheduledEmails();
    }
    function render(list) {
      const area = document.getElementById('tableArea');
      if (!list || list.length === 0) {
        area.innerHTML = '<div class="empty">No scheduled emails</div>';
        return;
      }
      const rows = list.map(item =>
        '<tr><td>' + item.subject + '</td><td>' + item.scheduledTime +
        '</td><td><button onclick="cancel(this, \'' + item.schedKey + '\')">Cancel</button></td></tr>'
      ).join('');
      area.innerHTML = '<table><thead><tr><th>Subject</th><th>Scheduled For</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table>';
    }
    function cancel(btn, key) {
      if (!confirm('Cancel this scheduled email?')) return;
      btn.disabled = true;
      google.script.run.withSuccessHandler(r => { if (r.success) load(); else alert('Error: ' + r.error); }).cancelScheduledEmail(key);
    }
    load();
  </script>
  </body></html>`;
}

function composeDialogHtml_() {
  return `<!DOCTYPE html><html><head><style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; margin: 0; padding: 14px 18px; background: #F8F8F8; color: #333; }
  label { display: block; font-weight: bold; margin: 10px 0 3px; color: #222; }
  label span { font-weight: normal; color: #777; }
  input, textarea, select { width: 100%; padding: 7px 10px; border: 1px solid #CCC; border-radius: 4px; font-size: 13px; }
  .row { display: flex; gap: 12px; }
  .row > div { flex: 1; }
  .section { display: none; }
  .panel { background: white; border: 1px solid #E0E0E0; border-radius: 6px; padding: 14px; margin: 10px 0; }
  .hint { font-size: 11px; color: #888; margin-top: 3px; }
  hr { border: none; border-top: 1px solid #E0E0E0; margin: 10px 0; }
  .btn { padding: 9px 22px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
  .btn-primary { background: #0D47A1; color: white; width: 100%; margin-top: 10px; }
  .btn-cancel { background: #DDD; color: #444; width: 100%; margin-top: 10px; }
  .status { padding: 10px; margin-top: 10px; border-radius: 4px; display: none; }
  .ok { background: #E8F5E9; color: #1B5E20; }
  .err { background: #FFCDD2; color: #B71C1C; }
  </style></head><body>

  <div class="panel">
    <div class="row">
      <div><label>Template</label><select id="tmpl" onchange="switchTemplate()">
        <option value="general-update">General Update</option>
        <option value="video-update">Video Update</option>
        <option value="announcement">Announcement</option>
        <option value="newsletter">Newsletter</option>
        <option value="form-request">Form / Survey</option>
      </select></div>
      <div><label>Subject</label><input id="subject" placeholder="Email subject..."></div>
    </div>

    <label>Business</label>
    <select id="business">
      <option value="default">Default Business</option>
    </select>

    <label style="margin-top: 10px;">Headline</label>
    <input id="headline" placeholder="Main heading...">

    <label style="margin-top: 10px;">Main Message</label>
    <textarea id="body" rows="3" placeholder="Email body text..."></textarea>

    <div id="sec-video" class="section">
      <label>Video URL</label>
      <input id="videoUrl" placeholder="https://youtube.com/watch?v=...">
      <div class="hint">YouTube links show real thumbnail</div>
    </div>

    <div id="sec-newsletter" class="section">
      <hr>
      <label>Section 2 Headline</label>
      <input id="s2headline" placeholder="Optional second section">
      <label style="margin-top: 8px;">Section 2 Body</label>
      <textarea id="s2body" rows="2"></textarea>
      <label style="margin-top: 8px;">Section 3 Headline</label>
      <input id="s3headline" placeholder="Optional third section">
      <label style="margin-top: 8px;">Section 3 Body</label>
      <textarea id="s3body" rows="2"></textarea>
    </div>

    <div id="sec-form" class="section">
      <hr>
      <label>Form URL</label>
      <input id="formUrl" placeholder="https://forms.gle/...">
      <label style="margin-top: 8px;">Button Text</label>
      <input id="formButtonText" placeholder="Open the Form">
      <label style="margin-top: 8px;">Panel Title</label>
      <input id="formTitle" placeholder="Optional panel title">
      <label style="margin-top: 8px;">Note under button</label>
      <input id="formNote" placeholder="Optional note">
    </div>

    <div id="sec-cta">
      <hr>
      <div class="row">
        <div><label>Button Text</label><input id="ctaText" placeholder="Learn More"></div>
        <div><label>Button URL</label><input id="ctaUrl" placeholder="https://..."></div>
      </div>
    </div>

    <hr>
    <label>Send To</label>
    <select id="recipMode" onchange="switchRecip()">
      <option value="active">All Active Contacts</option>
      <option value="all">All Contacts</option>
      <option value="group">Specific Group</option>
      <option value="tag">Specific Tag</option>
      <option value="manual">Manual Email Addresses</option>
    </select>

    <div id="sec-group" class="section" style="margin-top: 6px;">
      <input id="targetGroup" list="groupList" placeholder="Select group...">
      <datalist id="groupList"></datalist>
    </div>

    <div id="sec-tag" class="section" style="margin-top: 6px;">
      <input id="targetTag" list="tagList" placeholder="Select tag...">
      <datalist id="tagList"></datalist>
    </div>

    <div id="sec-manual" class="section" style="margin-top: 8px;">
      <textarea id="manualEmails" rows="3" placeholder="Email addresses (comma or newline separated)"></textarea>
    </div>

    <hr>
    <div style="display: flex; gap: 10px; align-items: center; margin-bottom: 6px;">
      <label style="margin: 0; display: flex; gap: 7px; cursor: pointer;">
        <input type="checkbox" id="scheduleToggle" onchange="toggleSchedule()" style="width: auto; margin: 0;">
        Schedule for later
      </label>
    </div>

    <div id="sec-schedule" class="section">
      <input type="datetime-local" id="scheduleTime">
      <div class="hint">Email will send automatically at this time</div>
    </div>

    <button class="btn btn-primary" id="sendBtn" onclick="doSendNow()">✉️ Send Now</button>
    <button class="btn btn-primary" id="schedBtn" onclick="doSchedule()" style="background: #6A1B9A; display: none;">📅 Schedule Email</button>
    <button class="btn btn-cancel" onclick="google.script.host.close()">Cancel</button>
  </div>

  <div class="status" id="statusBox"></div>

  <script>
    google.script.run.withSuccessHandler(g => {
      const dl = document.getElementById('groupList');
      g.forEach(gr => { const o = document.createElement('option'); o.value = gr; dl.appendChild(o); });
    }).getContactGroups();

    google.script.run.withSuccessHandler(t => {
      const dl = document.getElementById('tagList');
      t.forEach(tag => { const o = document.createElement('option'); o.value = tag; dl.appendChild(o); });
    }).getContactTags();

    function switchTemplate() {
      const t = document.getElementById('tmpl').value;
      document.getElementById('sec-video').style.display = (t === 'video-update') ? 'block' : 'none';
      document.getElementById('sec-newsletter').style.display = (t === 'newsletter') ? 'block' : 'none';
      document.getElementById('sec-form').style.display = (t === 'form-request') ? 'block' : 'none';
      document.getElementById('sec-cta').style.display = (t === 'form-request') ? 'none' : 'block';
    }

    function switchRecip() {
      const m = document.getElementById('recipMode').value;
      document.getElementById('sec-group').style.display = (m === 'group') ? 'block' : 'none';
      document.getElementById('sec-tag').style.display = (m === 'tag') ? 'block' : 'none';
      document.getElementById('sec-manual').style.display = (m === 'manual') ? 'block' : 'none';
    }

    function toggleSchedule() {
      const on = document.getElementById('scheduleToggle').checked;
      document.getElementById('sec-schedule').style.display = on ? 'block' : 'none';
      document.getElementById('sendBtn').style.display = on ? 'none' : 'block';
      document.getElementById('schedBtn').style.display = on ? 'block' : 'none';
    }

    function doSendNow() {
      const data = collectData();
      if (!data) return;
      const btn = document.getElementById('sendBtn');
      btn.disabled = true;
      google.script.run
        .withSuccessHandler(r => {
          if (r.success) show('✅ Sent to ' + r.sent + ' recipients', 'ok');
          else show('❌ ' + r.error, 'err');
          btn.disabled = false;
        })
        .sendEmailNow(data);
    }

    function doSchedule() {
      const data = collectData();
      if (!data) return;
      const time = document.getElementById('scheduleTime').value;
      if (!time) { show('❌ Pick a date/time', 'err'); return; }
      data.scheduledTime = time;
      const btn = document.getElementById('schedBtn');
      btn.disabled = true;
      google.script.run
        .withSuccessHandler(r => {
          if (r.success) show('✅ Scheduled for ' + r.scheduledTime, 'ok');
          else show('❌ ' + r.error, 'err');
          btn.disabled = false;
        })
        .scheduleEmail(data);
    }

    function collectData() {
      return {
        template: document.getElementById('tmpl').value,
        subject: document.getElementById('subject').value.trim(),
        business: document.getElementById('business').value,
        headline: document.getElementById('headline').value.trim(),
        body: document.getElementById('body').value.trim(),
        videoUrl: document.getElementById('videoUrl').value.trim(),
        section2headline: document.getElementById('s2headline').value.trim(),
        section2body: document.getElementById('s2body').value.trim(),
        section3headline: document.getElementById('s3headline').value.trim(),
        section3body: document.getElementById('s3body').value.trim(),
        formUrl: document.getElementById('formUrl').value.trim(),
        formButtonText: document.getElementById('formButtonText').value.trim(),
        formTitle: document.getElementById('formTitle').value.trim(),
        formNote: document.getElementById('formNote').value.trim(),
        ctaText: document.getElementById('ctaText').value.trim(),
        ctaUrl: document.getElementById('ctaUrl').value.trim(),
        recipientMode: document.getElementById('recipMode').value,
        targetGroup: document.getElementById('targetGroup').value.trim(),
        targetTag: document.getElementById('targetTag').value.trim(),
        manualEmails: document.getElementById('manualEmails').value
      };
    }

    function show(msg, cls) {
      const s = document.getElementById('statusBox');
      s.className = 'status ' + cls;
      s.textContent = msg;
      s.style.display = 'block';
    }
  </script>
  </body></html>`;
}
