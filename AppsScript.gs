// Configuration for document templates and field mappings
const CONFIG = {
  SHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  DOCUMENT_TYPE_COLUMN: 'Document Type',
  OUTPUT_FOLDER_NAME: 'Generated Documents',
  SETTINGS_SHEET_NAME: 'Settings',

  // Document type templates
  TEMPLATES: {
    'Invoice': { folder: 'Invoice Templates', fields: ['Invoice Number', 'Date', 'Customer Name', 'Amount', 'Description'] },
    'Receipt': { folder: 'Receipt Templates', fields: ['Receipt Number', 'Date', 'Customer Name', 'Amount'] },
    'Credit Note': { folder: 'Credit Note Templates', fields: ['Credit Note Number', 'Date', 'Customer Name', 'Amount', 'Reason'] },
    'Purchase Order': { folder: 'PO Templates', fields: ['PO Number', 'Date', 'Vendor Name', 'Items', 'Amount'] },
    'Proforma Invoice': { folder: 'Proforma Templates', fields: ['Proforma Number', 'Date', 'Customer Name', 'Amount'] },
    'Quotation': { folder: 'Quotation Templates', fields: ['Quote Number', 'Date', 'Customer Name', 'Items', 'Amount'] },
    'Delivery Note': { folder: 'Delivery Templates', fields: ['Delivery Number', 'Date', 'Customer Name', 'Items'] },
    'Payment Receipt': { folder: 'Payment Templates', fields: ['Payment Number', 'Date', 'Customer Name', 'Amount'] },
    'Debit Note': { folder: 'Debit Templates', fields: ['Debit Number', 'Date', 'Customer Name', 'Amount', 'Reason'] },
    'Packing Slip': { folder: 'Packing Templates', fields: ['Slip Number', 'Date', 'Items', 'Quantity'] },
    'Sales Order': { folder: 'Sales Templates', fields: ['Order Number', 'Date', 'Customer Name', 'Items', 'Amount'] },
    'Refund Receipt': { folder: 'Refund Templates', fields: ['Refund Number', 'Date', 'Customer Name', 'Amount', 'Reason'] },
    'Expense Report': { folder: 'Expense Templates', fields: ['Report Number', 'Date', 'Employee Name', 'Items', 'Amount'] },
    'Petty Cash Voucher': { folder: 'Petty Templates', fields: ['Voucher Number', 'Date', 'Description', 'Amount'] },
    'Payment Voucher': { folder: 'Payment Voucher Templates', fields: ['Voucher Number', 'Date', 'Payee Name', 'Amount', 'Purpose'] },
    'Bill of Lading': { folder: 'BOL Templates', fields: ['BOL Number', 'Date', 'Shipper', 'Receiver', 'Items'] }
  }
};

// Default organization configuration structure
const DEFAULT_ORG_CONFIG = {
  'Company Name': 'Your Company Name',
  'Company Address': 'Street Address, City, State, ZIP',
  'Company Phone': '+1 (555) 000-0000',
  'Company Email': 'info@company.com',
  'Company Website': 'www.company.com',
  'Tax ID / VAT Number': 'XX-XXXXXXX',
  'Registration Number': 'REG-123456',
  'Bank Name': 'Your Bank Name',
  'Bank Account Number': 'XXXXXXXX',
  'Bank Routing Number': 'XXXXXX',
  'Bank SWIFT Code': 'SWIFTXXX',
  'Company Logo URL': '',
  'Default Currency': '$',
  'Default Terms': 'Net 30',
  'Company Registration Details': 'Your company registration info',
  'Footer Text': 'Thank you for your business!'
};

/**
 * Add menu to spreadsheet for generating documents
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('📄 Document Generator')
    .addItem('Generate Document', 'generateDocumentFromRow')
    .addItem('Batch Generate All', 'batchGenerateDocuments')
    .addItem('Setup Templates Folder', 'setupTemplatesFolder')
    .addSeparator()
    .addItem('⚙️ Organization Settings', 'showOrgSettingsDialog')
    .addItem('Help', 'showHelp')
    .addToUi();
}

/**
 * Generate a single document from the current row
 */
function generateDocumentFromRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const range = sheet.getActiveRange();
  const row = range.getRow();

  if (row === 1) {
    SpreadsheetApp.getUi().alert('Please select a data row (not the header)');
    return;
  }

  try {
    const rowData = getRowData(sheet, row);
    const docType = rowData[CONFIG.DOCUMENT_TYPE_COLUMN];

    if (!docType) {
      SpreadsheetApp.getUi().alert('Please specify a Document Type in the row');
      return;
    }

    if (!CONFIG.TEMPLATES[docType]) {
      SpreadsheetApp.getUi().alert(`Document type "${docType}" not supported.\nSupported types: ${Object.keys(CONFIG.TEMPLATES).join(', ')}`);
      return;
    }

    const doc = createDocumentFromTemplate(docType, rowData);
    SpreadsheetApp.getUi().alert(`✓ Document created: ${doc.getName()}\n\nID: ${doc.getId()}`);
  } catch (error) {
    SpreadsheetApp.getUi().alert(`Error: ${error.message}`);
    Logger.log(error);
  }
}

/**
 * Batch generate documents for all rows with a document type
 */
function batchGenerateDocuments() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let docTypeIndex = -1;

  for (let i = 0; i < headers.length; i++) {
    if (headers[i] === CONFIG.DOCUMENT_TYPE_COLUMN) {
      docTypeIndex = i;
      break;
    }
  }

  if (docTypeIndex === -1) {
    SpreadsheetApp.getUi().alert(`No "${CONFIG.DOCUMENT_TYPE_COLUMN}" column found`);
    return;
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  for (let i = 1; i < data.length; i++) {
    if (!data[i][docTypeIndex]) continue;

    try {
      const rowData = getRowDataByIndex(headers, data[i]);
      const docType = rowData[CONFIG.DOCUMENT_TYPE_COLUMN];

      if (CONFIG.TEMPLATES[docType]) {
        createDocumentFromTemplate(docType, rowData);
        successCount++;
      }
    } catch (error) {
      errorCount++;
      errors.push(`Row ${i + 1}: ${error.message}`);
    }
  }

  let message = `Generated ${successCount} documents`;
  if (errorCount > 0) {
    message += `\nErrors: ${errorCount}\n${errors.slice(0, 5).join('\n')}`;
  }
  SpreadsheetApp.getUi().alert(message);
}

/**
 * Create document from template with data replacement
 */
function createDocumentFromTemplate(docType, rowData) {
  const outputFolder = getOrCreateFolder(CONFIG.OUTPUT_FOLDER_NAME);

  // Generate document name from data
  const docName = generateDocumentName(docType, rowData);

  // Create a new Google Doc with the appropriate content
  const doc = DocumentApp.create(docName);
  const body = doc.getBody();

  // Get organization config
  const orgConfig = getOrgConfig();

  // Add organization header
  const companyName = orgConfig['Company Name'];
  body.appendParagraph(companyName)
    .setHeading(DocumentApp.ParagraphHeading.HEADING1)
    .setBold(true);

  // Add company details (address, contact)
  const companyAddress = orgConfig['Company Address'];
  const companyPhone = orgConfig['Company Phone'];
  const companyEmail = orgConfig['Company Email'];
  const companyWebsite = orgConfig['Company Website'];

  if (companyAddress) body.appendParagraph(companyAddress).setFontSize(10);
  if (companyPhone) body.appendParagraph(`Phone: ${companyPhone}`).setFontSize(10);
  if (companyEmail) body.appendParagraph(`Email: ${companyEmail}`).setFontSize(10);
  if (companyWebsite) body.appendParagraph(`Website: ${companyWebsite}`).setFontSize(10);

  body.appendParagraph(''); // Spacing
  body.appendHorizontalRule();
  body.appendParagraph(''); // Spacing

  // Add document title
  body.appendParagraph(docType.toUpperCase())
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  // Add metadata
  const createdDate = new Date().toLocaleDateString();
  body.appendParagraph(`Date: ${createdDate}`)
    .setFontSize(10)
    .setItalic(true);

  body.appendParagraph(''); // Spacing

  // Add document-specific data fields
  for (const [key, value] of Object.entries(rowData)) {
    if (key !== CONFIG.DOCUMENT_TYPE_COLUMN && value) {
      body.appendParagraph(`${key}: ${value}`);
    }
  }

  body.appendParagraph(''); // Spacing
  body.appendHorizontalRule();

  // Add footer with bank and tax details
  const taxId = orgConfig['Tax ID / VAT Number'];
  const bankName = orgConfig['Bank Name'];
  const bankAccount = orgConfig['Bank Account Number'];
  const footerText = orgConfig['Footer Text'];

  if (taxId) body.appendParagraph(`Tax ID: ${taxId}`).setFontSize(9);
  if (bankName) body.appendParagraph(`Bank: ${bankName}`).setFontSize(9);
  if (bankAccount) body.appendParagraph(`Account: ${bankAccount}`).setFontSize(9);
  if (footerText) body.appendParagraph(footerText).setFontSize(9).setItalic(true);

  // Move to output folder
  const file = DriveApp.getFileById(doc.getId());
  outputFolder.addFile(file);
  DriveApp.getRootFolder().removeFile(file);

  return doc;
}

/**
 * Get all data from a row as an object
 */
function getRowData(sheet, row) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  return getRowDataByIndex(headers, values);
}

/**
 * Convert array data to object using headers
 */
function getRowDataByIndex(headers, values) {
  const data = {};
  for (let i = 0; i < headers.length; i++) {
    data[headers[i]] = values[i] || '';
  }
  return data;
}

/**
 * Generate document name based on type and data
 */
function generateDocumentName(docType, rowData) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  let name = docType;

  // Try to use relevant ID field if available
  if (rowData['Invoice Number']) name += ` - ${rowData['Invoice Number']}`;
  else if (rowData['Receipt Number']) name += ` - ${rowData['Receipt Number']}`;
  else if (rowData['Quote Number']) name += ` - ${rowData['Quote Number']}`;
  else if (rowData['Order Number']) name += ` - ${rowData['Order Number']}`;
  else if (rowData['Customer Name']) name += ` - ${rowData['Customer Name']}`;

  return name;
}

/**
 * Get or create a folder
 */
function getOrCreateFolder(folderName) {
  const folders = DriveApp.getRootFolder().getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return DriveApp.getRootFolder().createFolder(folderName);
}

/**
 * Setup templates folder structure
 */
function setupTemplatesFolder() {
  const templatesFolder = getOrCreateFolder('Document Templates');

  for (const [docType, config] of Object.entries(CONFIG.TEMPLATES)) {
    const typeFolder = getOrCreateFolderIn(templatesFolder, docType);
    Logger.log(`Created template folder: ${docType}`);
  }

  SpreadsheetApp.getUi().alert('Template folders created in "Document Templates" folder');
}

/**
 * Get or create a folder within another folder
 */
function getOrCreateFolderIn(parentFolder, folderName) {
  const folders = parentFolder.getFoldersByName(folderName);

  if (folders.hasNext()) {
    return folders.next();
  }

  return parentFolder.createFolder(folderName);
}

/**
 * Show organization settings dialog
 */
function showOrgSettingsDialog() {
  const orgConfig = getOrgConfig();

  let html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 20px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
          h2 { color: #1f73e8; margin-top: 0; }
          .form-group { margin-bottom: 15px; }
          label { display: block; font-weight: bold; margin-bottom: 5px; color: #333; }
          input, textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: Arial; box-sizing: border-box; }
          textarea { resize: vertical; min-height: 60px; }
          input:focus, textarea:focus { border-color: #1f73e8; outline: none; box-shadow: 0 0 5px rgba(31,115,232,0.3); }
          .button-group { display: flex; gap: 10px; margin-top: 20px; }
          button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; }
          .btn-save { background: #1f73e8; color: white; }
          .btn-save:hover { background: #1557b0; }
          .btn-reset { background: #ddd; color: #333; }
          .btn-reset:hover { background: #ccc; }
          .section-title { font-weight: bold; color: #1f73e8; margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #e0e0e0; padding-bottom: 5px; }
          .success { display: none; background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>⚙️ Organization Configuration</h2>
          <div class="success" id="successMsg">✓ Settings saved successfully!</div>

          <form id="orgForm">
            <div class="section-title">Company Information</div>

            <div class="form-group">
              <label>Company Name *</label>
              <input type="text" id="companyName" value="${orgConfig['Company Name'] || ''}" required>
            </div>

            <div class="form-group">
              <label>Company Address</label>
              <textarea id="companyAddress">${orgConfig['Company Address'] || ''}</textarea>
            </div>

            <div class="form-group">
              <label>Company Phone</label>
              <input type="text" id="companyPhone" value="${orgConfig['Company Phone'] || ''}">
            </div>

            <div class="form-group">
              <label>Company Email</label>
              <input type="email" id="companyEmail" value="${orgConfig['Company Email'] || ''}">
            </div>

            <div class="form-group">
              <label>Company Website</label>
              <input type="text" id="companyWebsite" value="${orgConfig['Company Website'] || ''}">
            </div>

            <div class="section-title">Identification</div>

            <div class="form-group">
              <label>Tax ID / VAT Number</label>
              <input type="text" id="taxId" value="${orgConfig['Tax ID / VAT Number'] || ''}">
            </div>

            <div class="form-group">
              <label>Registration Number</label>
              <input type="text" id="registrationNumber" value="${orgConfig['Registration Number'] || ''}">
            </div>

            <div class="section-title">Banking Information</div>

            <div class="form-group">
              <label>Bank Name</label>
              <input type="text" id="bankName" value="${orgConfig['Bank Name'] || ''}">
            </div>

            <div class="form-group">
              <label>Bank Account Number</label>
              <input type="text" id="bankAccount" value="${orgConfig['Bank Account Number'] || ''}">
            </div>

            <div class="form-group">
              <label>Bank Routing Number</label>
              <input type="text" id="bankRouting" value="${orgConfig['Bank Routing Number'] || ''}">
            </div>

            <div class="form-group">
              <label>Bank SWIFT Code</label>
              <input type="text" id="bankSwift" value="${orgConfig['Bank SWIFT Code'] || ''}">
            </div>

            <div class="section-title">Document Defaults</div>

            <div class="form-group">
              <label>Default Currency</label>
              <input type="text" id="defaultCurrency" value="${orgConfig['Default Currency'] || '$'}">
            </div>

            <div class="form-group">
              <label>Default Payment Terms</label>
              <input type="text" id="defaultTerms" value="${orgConfig['Default Terms'] || 'Net 30'}">
            </div>

            <div class="form-group">
              <label>Company Logo URL</label>
              <input type="text" id="logoUrl" value="${orgConfig['Company Logo URL'] || ''}" placeholder="https://example.com/logo.png">
            </div>

            <div class="form-group">
              <label>Company Registration Details</label>
              <textarea id="registrationDetails">${orgConfig['Company Registration Details'] || ''}</textarea>
            </div>

            <div class="form-group">
              <label>Footer Text (appears in all documents)</label>
              <textarea id="footerText">${orgConfig['Footer Text'] || ''}</textarea>
            </div>

            <div class="button-group">
              <button type="button" class="btn-save" onclick="saveSettings()">💾 Save Settings</button>
              <button type="button" class="btn-reset" onclick="resetForm()">↻ Reset Form</button>
            </div>
          </form>
        </div>

        <script>
          function saveSettings() {
            const data = {
              'Company Name': document.getElementById('companyName').value,
              'Company Address': document.getElementById('companyAddress').value,
              'Company Phone': document.getElementById('companyPhone').value,
              'Company Email': document.getElementById('companyEmail').value,
              'Company Website': document.getElementById('companyWebsite').value,
              'Tax ID / VAT Number': document.getElementById('taxId').value,
              'Registration Number': document.getElementById('registrationNumber').value,
              'Bank Name': document.getElementById('bankName').value,
              'Bank Account Number': document.getElementById('bankAccount').value,
              'Bank Routing Number': document.getElementById('bankRouting').value,
              'Bank SWIFT Code': document.getElementById('bankSwift').value,
              'Default Currency': document.getElementById('defaultCurrency').value,
              'Default Terms': document.getElementById('defaultTerms').value,
              'Company Logo URL': document.getElementById('logoUrl').value,
              'Company Registration Details': document.getElementById('registrationDetails').value,
              'Footer Text': document.getElementById('footerText').value
            };

            google.script.run.saveOrgConfig(data);

            const successMsg = document.getElementById('successMsg');
            successMsg.style.display = 'block';
            setTimeout(() => {
              successMsg.style.display = 'none';
            }, 3000);
          }

          function resetForm() {
            document.getElementById('orgForm').reset();
          }
        </script>
      </body>
    </html>
  `;

  const ui = SpreadsheetApp.getUi();
  ui.showModelessDialog(HtmlService.createHtmlOutput(html).setWidth(700).setHeight(1200), '⚙️ Organization Settings');
}

/**
 * Get organization configuration from Settings sheet
 */
function getOrgConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let settingsSheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET_NAME);

  if (!settingsSheet) {
    settingsSheet = createSettingsSheet();
  }

  const data = settingsSheet.getDataRange().getValues();
  const config = {};

  for (let i = 0; i < data.length; i++) {
    const key = data[i][0];
    const value = data[i][1];
    if (key && key !== 'Key') {
      config[key] = value || '';
    }
  }

  return config;
}

/**
 * Save organization configuration to Settings sheet
 */
function saveOrgConfig(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let settingsSheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET_NAME);

  if (!settingsSheet) {
    settingsSheet = createSettingsSheet();
  }

  // Clear existing data (keep header)
  const lastRow = settingsSheet.getLastRow();
  if (lastRow > 1) {
    settingsSheet.deleteRows(2, lastRow - 1);
  }

  // Write new data
  let rowIndex = 2;
  for (const [key, value] of Object.entries(data)) {
    settingsSheet.getRange(rowIndex, 1).setValue(key);
    settingsSheet.getRange(rowIndex, 2).setValue(value);
    rowIndex++;
  }

  SpreadsheetApp.getUi().alert('✓ Organization settings saved successfully!');
}

/**
 * Create Settings sheet with default values
 */
function createSettingsSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const settingsSheet = ss.insertSheet(CONFIG.SETTINGS_SHEET_NAME, 0);

  // Add headers
  settingsSheet.getRange(1, 1).setValue('Key');
  settingsSheet.getRange(1, 2).setValue('Value');

  // Add default configuration
  let rowIndex = 2;
  for (const [key, value] of Object.entries(DEFAULT_ORG_CONFIG)) {
    settingsSheet.getRange(rowIndex, 1).setValue(key);
    settingsSheet.getRange(rowIndex, 2).setValue(value);
    rowIndex++;
  }

  // Format header row
  const headerRange = settingsSheet.getRange(1, 1, 1, 2);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#1f73e8');
  headerRange.setFontColor('white');

  // Auto-resize columns
  settingsSheet.autoResizeColumns(1, 2);

  return settingsSheet;
}

/**
 * Show help dialog
 */
function showHelp() {
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial; padding: 15px; }
          h2 { color: #1f73e8; }
          .section { margin-bottom: 15px; }
          code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; }
        </style>
      </head>
      <body>
        <h2>📄 Document Generator Help</h2>

        <div class="section">
          <h3>Setup</h3>
          <ol>
            <li>Create a column titled <code>Document Type</code> in your sheet</li>
            <li>Add columns for document data (Customer Name, Amount, Date, etc.)</li>
            <li>Enter the document type (Invoice, Receipt, etc.) for each row</li>
          </ol>
        </div>

        <div class="section">
          <h3>Organization Settings</h3>
          <p>Click <strong>⚙️ Organization Settings</strong> to configure your company details. These will automatically appear on all generated documents.</p>
          <p>You can update:</p>
          <ul>
            <li>Company name, address, phone, email, website</li>
            <li>Tax ID, registration number</li>
            <li>Bank details (for payment information)</li>
            <li>Default currency and payment terms</li>
            <li>Company logo and footer text</li>
          </ul>
        </div>

        <div class="section">
          <h3>Generate Documents</h3>
          <ul>
            <li><strong>Generate Document:</strong> Select a row and click to generate one document</li>
            <li><strong>Batch Generate:</strong> Generate all rows at once</li>
          </ul>
        </div>

        <div class="section">
          <h3>Supported Document Types</h3>
          <p>Invoice, Receipt, Credit Note, Purchase Order, Proforma Invoice, Quotation, Delivery Note, Payment Receipt, Debit Note, Packing Slip, Sales Order, Refund Receipt, Expense Report, Petty Cash Voucher, Payment Voucher, Bill of Lading</p>
        </div>
      </body>
    </html>
  `;

  const ui = SpreadsheetApp.getUi();
  ui.showModelessDialog(HtmlService.createHtmlOutput(html), 'Help');
}
