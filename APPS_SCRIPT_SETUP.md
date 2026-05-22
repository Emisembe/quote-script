# Google Apps Script - Document Generator Setup

This Google Apps Script automatically generates documents (Invoices, Receipts, Purchase Orders, etc.) based on data in your Google Sheet.

## 🚀 Quick Start

### Step 1: Deploy to Google Sheet

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy the entire code from `AppsScript.gs` and paste it into the Apps Script editor
4. Save the project
5. Refresh your Google Sheet

### Step 2: Set Up Sheet Structure

Your Google Sheet needs a **"Document Type"** column and other relevant columns:

| Document Type | Customer Name | Amount | Date | Description |
|---|---|---|---|---|
| Invoice | Acme Corp | 5000 | 2026-05-22 | Monthly services |
| Receipt | ABC Ltd | 2500 | 2026-05-22 | Payment received |
| Quotation | XYZ Inc | 7500 | 2026-05-22 | Project quote |

**Column Headers (use exactly these names for best results):**
- `Document Type` (Required)
- `Invoice Number`, `Receipt Number`, `Quote Number`, etc.
- `Customer Name`, `Vendor Name`, `Employee Name`, `Payee Name`
- `Date`
- `Amount`
- `Description`, `Items`, `Reason`, `Purpose`, etc.

### Step 3: Generate Documents

A **"📄 Document Generator"** menu will appear in your sheet:

- **Generate Document** - Select a row and click to create one document
- **Batch Generate All** - Generate all rows with Document Types at once
- **Setup Templates Folder** - Create template folder structure
- **Help** - View this help dialog

## 📋 Supported Document Types

| Type | Common Fields |
|---|---|
| **Invoice** | Invoice Number, Customer Name, Amount, Description, Date |
| **Receipt** | Receipt Number, Customer Name, Amount, Date |
| **Credit Note** | Credit Note Number, Customer Name, Amount, Reason, Date |
| **Purchase Order** | PO Number, Vendor Name, Items, Amount, Date |
| **Proforma Invoice** | Proforma Number, Customer Name, Amount, Date |
| **Quotation** | Quote Number, Customer Name, Items, Amount, Date |
| **Delivery Note** | Delivery Number, Customer Name, Items, Date |
| **Payment Receipt** | Payment Number, Customer Name, Amount, Date |
| **Debit Note** | Debit Number, Customer Name, Amount, Reason, Date |
| **Packing Slip** | Slip Number, Items, Quantity, Date |
| **Sales Order** | Order Number, Customer Name, Items, Amount, Date |
| **Refund Receipt** | Refund Number, Customer Name, Amount, Reason, Date |
| **Expense Report** | Report Number, Employee Name, Items, Amount, Date |
| **Petty Cash Voucher** | Voucher Number, Description, Amount, Date |
| **Payment Voucher** | Voucher Number, Payee Name, Amount, Purpose, Date |
| **Bill of Lading** | BOL Number, Shipper, Receiver, Items, Date |

## 🎨 Customization

### Add Custom Fields

Edit the `CONFIG.TEMPLATES` object to customize which fields are used for each document type:

```javascript
TEMPLATES: {
  'Invoice': { 
    folder: 'Invoice Templates', 
    fields: ['Invoice Number', 'Date', 'Customer Name', 'Amount', 'Description', 'Tax', 'Total'] 
  }
}
```

### Change Output Folder

Edit this line in the `CONFIG` object:

```javascript
OUTPUT_FOLDER_NAME: 'Generated Documents' // Change to your preferred folder name
```

### Modify Document Template

In the `createDocumentFromTemplate()` function, customize how documents are formatted:

```javascript
// Add company header
body.appendParagraph('MY COMPANY NAME')
  .setHeading(DocumentApp.ParagraphHeading.HEADING1);

// Add more formatting
body.appendTable([...]);
```

## 🔧 Advanced Features

### Batch Generation

Select all your data and click "Batch Generate All" to create all documents at once. The script will:
- Skip empty Document Type cells
- Create one document per row
- Report success and error counts
- Move all files to the "Generated Documents" folder

### Custom Naming

Documents are named based on available identifiers:
- Invoice Number → "Invoice - INV-001"
- Receipt Number → "Receipt - REC-001"
- Customer Name → "Quotation - Acme Corp"
- Timestamp added for uniqueness

### Organization

Generated documents are automatically moved to:
```
📁 Generated Documents
  📄 Invoice - INV-001
  📄 Receipt - REC-001
  📄 Quotation - Acme Corp
```

## 📝 Example Workflow

1. **Create Sheet** with columns: Document Type, Customer Name, Amount, Date
2. **Enter Data**:
   ```
   | Document Type | Customer Name | Amount | Date |
   | Invoice | John's Coffee | 500 | 2026-05-22 |
   | Receipt | Jane's Store | 250 | 2026-05-22 |
   ```
3. **Select Row** for Invoice
4. **Click** Document Generator → Generate Document
5. **Done!** Document created in "Generated Documents" folder

## 🐛 Troubleshooting

**"Document Type" not found error**
- Ensure your column header is exactly "Document Type" (case-sensitive)
- Make sure it's in the first row (headers)

**Document type not supported**
- Check spelling matches the list above
- Use exact names like "Invoice", not "invoice"

**Script runs but no menu appears**
- Refresh your Google Sheet (F5 or Cmd+R)
- You may need to grant permissions on first run

**Files not appearing in "Generated Documents"**
- Check your Drive's "Generated Documents" folder
- The script creates this folder automatically if it doesn't exist

## 💡 Tips

- Use consistent column names across all sheets
- Leave empty cells for optional fields
- Run "Setup Templates Folder" to organize template documents
- Batch generate overnight for large datasets
- Generated documents are Google Docs by default (export as PDF if needed)

## 🔐 Permissions

The script requires these permissions:
- Read/write access to the spreadsheet
- Create and manage files in Google Drive
- Access to script properties and user information

These are requested automatically on first run.
