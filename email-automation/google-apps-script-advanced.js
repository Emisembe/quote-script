// ===== EMAIL AUTOMATION WITH MENU INTERFACE =====
// Install this in Google Apps Script - NO CODE EDITING NEEDED!

// ===== MAIN CLASS =====
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
      "special-offer": this.getSpecialOfferTemplate()
    };
  }

  getQuoteSentTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Your Quote is Ready!</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold; color: #333;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">Thank you for reaching out to {{businessName}}! We're excited to provide you with a quote tailored to your needs.</p><div style="background-color: #f5f5f5; border-left: 4px solid {{accentColor}}; padding: 15px; margin: 20px 0;"><p style="margin: 5px 0;"><strong>Quote ID:</strong> {{quoteId}}</p><p style="margin: 5px 0;"><strong>Date:</strong> {{quoteDate}}</p><p style="margin: 5px 0;"><strong>Total:</strong> ${{totalAmount}}</p></div><p style="color: #666; line-height: 1.6;">Please review the attached quote. If you have any questions, feel free to reach out to us.</p><div style="text-align: center; margin: 30px 0;"><a href="{{quoteLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">View Full Quote</a></div></div><div style="background-color: #f9f9f9; padding: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #666; text-align: center;"><p style="margin: 5px 0;">📧 {{businessEmail}} | 📞 {{businessPhone}}</p></div></div></body></html>`;
  }

  getFollowUpTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background-color: {{primaryColor}}; color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">{{businessName}}</h1><p style="margin: 10px 0 0 0; font-size: 14px;">Following Up on Your Quote</p></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">I hope this finds you well! I wanted to follow up on quote <strong>{{quoteId}}</strong>.</p><p style="color: #666; line-height: 1.6;">If you have questions or want to discuss, I'm here to help!</p><div style="text-align: center; margin: 30px 0;"><a href="{{calendarLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule a Call</a></div></div></div></body></html>`;
  }

  getSpecialOfferTemplate() {
    return `<html><body style="font-family: Arial, sans-serif; color: #333; background-color: #f9f9f9;"><div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px;"><div style="background: linear-gradient(135deg, {{primaryColor}}, {{accentColor}}); color: white; padding: 30px; text-align: center;"><h1 style="margin: 0;">🎉 SPECIAL OFFER</h1></div><div style="padding: 30px;"><p style="font-size: 18px; font-weight: bold;">Hi {{firstName}},</p><p style="color: #666; line-height: 1.6;">We have an exclusive offer just for you!</p><div style="background-color: #fff3cd; border: 2px solid {{accentColor}}; border-radius: 5px; padding: 20px; margin: 20px 0; text-align: center;"><p style="font-size: 24px; font-weight: bold; color: {{primaryColor}};">{{offerTitle}}</p><p style="font-size: 14px; color: #666;">{{offerDescription}}</p><p style="font-size: 12px; color: #666;"><strong>Valid until:</strong> {{offerExpiry}}</p></div><div style="text-align: center; margin: 30px 0;"><a href="{{offerLink}}" style="background-color: {{primaryColor}}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Claim Offer</a></div></div></div></body></html>`;
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

      GmailApp.sendEmail(recipientEmail, emailSubject, '', { htmlBody: htmlContent });
      return { success: true, message: `Email sent to ${recipientEmail}` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  addTemplate(templateName, htmlContent) {
    this.templates[templateName] = htmlContent;
    return { success: true, message: `Template "${templateName}" added` };
  }

  addBusiness(businessKey, businessData) {
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

  getTemplate(templateName) {
    return this.templates[templateName];
  }
}

// ===== GLOBAL VARIABLE TO STORE DATA =====
let emailSystem = new BusinessEmailAutomation();
let importedData = [];

// ===== CREATE MENU =====
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📧 Email Tools')
    .addItem('⚙️ Setup Business Info', 'showBusinessSetup')
    .addItem('📋 Import Customer Sheet', 'showImportDialog')
    .addItem('✉️ Send Email to Customer', 'showSendEmailDialog')
    .addItem('🎨 Manage Email Templates', 'showTemplateManager')
    .addSeparator()
    .addItem('📧 View Businesses', 'showBusinessesList')
    .addItem('📧 View Templates', 'showTemplatesList')
    .addToUi();
}

// ===== SETUP BUSINESS INFO =====
function showBusinessSetup() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 15px; }
      .container { max-width: 500px; }
      h2 { color: #0066cc; margin-top: 0; }
      label { display: block; margin-top: 12px; font-weight: bold; color: #333; }
      input, textarea { width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      textarea { resize: vertical; height: 60px; }
      button { background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px; font-size: 14px; }
      button:hover { background-color: #004499; }
      .color-input { display: flex; gap: 10px; }
      .color-input input[type="color"] { width: 50px; height: 40px; padding: 2px; }
      .color-input input[type="text"] { flex: 1; }
    </style>
    <div class="container">
      <h2>⚙️ Setup Your Business Information</h2>

      <label>Business Name:</label>
      <input type="text" id="businessName" placeholder="Your Business Name">

      <label>Email Address:</label>
      <input type="email" id="businessEmail" placeholder="email@business.com">

      <label>Phone Number:</label>
      <input type="text" id="businessPhone" placeholder="+1 (555) 000-0000">

      <label>Website:</label>
      <input type="text" id="businessWebsite" placeholder="https://yourwebsite.com">

      <label>Primary Color (for emails):</label>
      <div class="color-input">
        <input type="color" id="primaryColor" value="#0066cc">
        <input type="text" id="primaryColorHex" value="#0066cc" readonly>
      </div>

      <label>Accent Color (for highlights):</label>
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

// ===== IMPORT SHEET DIALOG =====
function showImportDialog() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 15px; }
      .container { max-width: 500px; }
      h2 { color: #0066cc; margin-top: 0; }
      label { display: block; margin-top: 12px; font-weight: bold; color: #333; }
      input, select { width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      button { background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px; font-size: 14px; }
      button:hover { background-color: #004499; }
      .info { background-color: #e3f2fd; padding: 10px; border-radius: 4px; margin-top: 10px; font-size: 12px; color: #0066cc; }
    </style>
    <div class="container">
      <h2>📋 Import Customer Data</h2>

      <label>Select a Sheet:</label>
      <select id="sheetSelector">
        <option value="">-- Choose a sheet --</option>
      </select>

      <label>Column for Email (e.g., "Email" or "A"):</label>
      <input type="text" id="emailColumn" placeholder="Email" value="Email">

      <label>Column for First Name (e.g., "First Name" or "B"):</label>
      <input type="text" id="nameColumn" placeholder="First Name" value="First Name">

      <div class="info">
        ℹ️ This will import all rows from your selected sheet. You'll use this data to send emails.
      </div>

      <button onclick="importSheet()">📥 Import Sheet</button>
    </div>

    <script>
      google.script.run.getSheetList(function(sheets) {
        const selector = document.getElementById('sheetSelector');
        sheets.forEach(sheet => {
          const option = document.createElement('option');
          option.value = sheet;
          option.text = sheet;
          selector.appendChild(option);
        });
      });

      function importSheet() {
        const sheet = document.getElementById('sheetSelector').value;
        if (!sheet) {
          alert('❌ Please select a sheet!');
          return;
        }
        google.script.run.importSheetData(sheet,
          document.getElementById('emailColumn').value,
          document.getElementById('nameColumn').value
        );
      }
    </script>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '📋 Import Customer Sheet');
}

function getSheetList() {
  const sheets = SpreadsheetApp.getActiveSpreadsheet().getSheets();
  return sheets.map(sheet => sheet.getName());
}

function importSheetData(sheetName, emailColumn, nameColumn) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();

    // Find column indices
    const headers = data[0];
    const emailIndex = headers.indexOf(emailColumn);
    const nameIndex = headers.indexOf(nameColumn);

    if (emailIndex === -1 || nameIndex === -1) {
      SpreadsheetApp.getUi().alert('❌ Column not found! Check your column names.');
      return;
    }

    // Import data
    importedData = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][emailIndex]) {
        importedData.push({
          email: data[i][emailIndex],
          firstName: data[i][nameIndex] || 'Customer',
          fullRow: data[i]
        });
      }
    }

    SpreadsheetApp.getUi().alert(`✅ Imported ${importedData.length} customers!`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`❌ Error: ${error.message}`);
  }
}

// ===== SEND EMAIL DIALOG =====
function showSendEmailDialog() {
  if (importedData.length === 0) {
    SpreadsheetApp.getUi().alert('❌ Please import customer data first!');
    return;
  }

  const templates = emailSystem.getTemplateList();
  const businesses = emailSystem.getBusinessList();

  let templateOptions = templates.map(t => `<option value="${t}">${t}</option>`).join('');
  let businessOptions = businesses.map(b => `<option value="${b}">${b}</option>`).join('');
  let customerOptions = importedData.map((c, i) => `<option value="${i}">${c.firstName} (${c.email})</option>`).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 15px; }
      .container { max-width: 500px; }
      h2 { color: #0066cc; margin-top: 0; }
      label { display: block; margin-top: 12px; font-weight: bold; color: #333; }
      input, select, textarea { width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      textarea { resize: vertical; height: 80px; }
      button { background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px; font-size: 14px; }
      button:hover { background-color: #004499; }
      .button-group { display: flex; gap: 10px; }
      .button-group button { flex: 1; }
      .preview { background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; max-height: 200px; overflow-y: auto; font-size: 12px; }
    </style>
    <div class="container">
      <h2>✉️ Send Email</h2>

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
      <textarea id="additionalData" placeholder='{"quoteId": "Q-001", "totalAmount": "5000"}'></textarea>

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
              preview.innerHTML = '<strong>Preview:</strong><br>' + result.html.substring(0, 500) + '...';
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
      ...additionalData,
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
      { firstName: customer.firstName, ...additionalData }
    );
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ===== TEMPLATE MANAGER =====
function showTemplateManager() {
  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 15px; }
      .container { max-width: 700px; }
      h2 { color: #0066cc; margin-top: 0; }
      .tabs { display: flex; gap: 10px; margin-bottom: 15px; }
      .tab-btn { padding: 10px 15px; border: 1px solid #ddd; background-color: #f5f5f5; cursor: pointer; border-radius: 4px; }
      .tab-btn.active { background-color: #0066cc; color: white; }
      .tab-content { display: none; }
      .tab-content.active { display: block; }
      label { display: block; margin-top: 12px; font-weight: bold; color: #333; }
      input, textarea { width: 100%; padding: 8px; margin-top: 5px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
      textarea { resize: vertical; height: 300px; font-family: monospace; font-size: 12px; }
      button { background-color: #0066cc; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 15px; font-size: 14px; }
      button:hover { background-color: #004499; }
      .template-list { background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; }
      .template-item { padding: 8px; margin: 5px 0; background-color: white; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; }
    </style>
    <div class="container">
      <h2>🎨 Manage Email Templates</h2>

      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('view')">📋 View Templates</button>
        <button class="tab-btn" onclick="switchTab('edit')">✏️ Edit Template</button>
        <button class="tab-btn" onclick="switchTab('create')">➕ Create New</button>
      </div>

      <!-- View Templates Tab -->
      <div id="view" class="tab-content active">
        <h3>Current Templates:</h3>
        <div id="templateList" class="template-list"></div>
      </div>

      <!-- Edit Template Tab -->
      <div id="edit" class="tab-content">
        <label>Select Template to Edit:</label>
        <select id="editTemplateSelect">
          <option value="">-- Choose a template --</option>
        </select>

        <label>Template HTML Code:</label>
        <textarea id="editTemplateCode"></textarea>

        <button onclick="saveEditTemplate()">💾 Save Changes</button>
      </div>

      <!-- Create New Tab -->
      <div id="create" class="tab-content">
        <label>Template Name (e.g., "thank-you"):</label>
        <input type="text" id="newTemplateName" placeholder="thank-you">

        <label>Template HTML Code:</label>
        <textarea id="newTemplateCode" placeholder="<html><body>Hi {{firstName}},<br>{{customMessage}}</body></html>"></textarea>

        <button onclick="createNewTemplate()">✅ Create Template</button>
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
          const html = templates.map(t => `<div class="template-item"><strong>${t}</strong></div>`).join('');
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
  SpreadsheetApp.getUi().alert(`✅ Template "${templateName}" updated!`);
}

function addNewTemplate(templateName, htmlCode) {
  emailSystem.addTemplate(templateName, htmlCode);
  SpreadsheetApp.getUi().alert(`✅ Template "${templateName}" created!`);
}

// ===== VIEW LISTS =====
function showBusinessesList() {
  const businesses = emailSystem.getBusinessList();
  const list = businesses.map(b => {
    const biz = emailSystem.getBusiness(b);
    return `<b>${b}:</b> ${biz.name} (${biz.email})<br>`;
  }).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 15px; }
      div { background-color: #f5f5f5; padding: 15px; border-radius: 4px; }
    </style>
    <h2>Your Businesses:</h2>
    <div>${list}</div>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '📧 Businesses');
}

function showTemplatesList() {
  const templates = emailSystem.getTemplateList();
  const list = templates.map(t => `<li>${t}</li>`).join('');

  const html = HtmlService.createHtmlOutput(`
    <style>
      body { font-family: Arial, sans-serif; padding: 15px; }
      ul { background-color: #f5f5f5; padding: 15px; border-radius: 4px; }
    </style>
    <h2>Your Templates:</h2>
    <ul>${list}</ul>
  `);
  SpreadsheetApp.getUi().showModelessDialog(html, '📧 Templates');
}
