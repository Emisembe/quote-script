// Configuration for document templates and field mappings
const CONFIG = {
  SHEET_ID: SpreadsheetApp.getActiveSpreadsheet().getId(),
  DOCUMENT_TYPE_COLUMN: 'Document Type',
  OUTPUT_FOLDER_NAME: 'Generated Documents',

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

  // Add document header
  body.appendParagraph(docType.toUpperCase())
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);

  // Add metadata
  const createdDate = new Date().toLocaleDateString();
  body.appendParagraph(`Generated on: ${createdDate}`)
    .setFontSize(10)
    .setItalic(true);

  body.appendParagraph(''); // Spacing

  // Add data fields
  for (const [key, value] of Object.entries(rowData)) {
    if (key !== CONFIG.DOCUMENT_TYPE_COLUMN && value) {
      body.appendParagraph(`${key}: ${value}`);
    }
  }

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
