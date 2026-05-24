# Google Apps Script - Document Generator Setup

This Google Apps Script automatically generates documents (Invoices, Receipts, Purchase Orders, etc.) based on data in your Google Sheet.

## 🚀 Quick Start

### Step 1: Deploy to Google Sheet

1. Open your Google Sheet
2. Go to **Extensions → Apps Script**
3. Copy the entire code from `AppsScript.gs` and paste it into the Apps Script editor
4. Save the project
5. Refresh your Google Sheet

### Step 2: Configure Organization Settings

⚠️ **IMPORTANT - Do This First!**

1. Click the **"📄 Document Generator"** menu
2. Select **"⚙️ Organization Settings"**
3. Fill in your company details:
   - Company Name, Address, Phone, Email, Website
   - Tax ID / VAT Number
   - Bank Details (for payment info on documents)
   - Default Currency and Payment Terms
   - Footer text and other preferences
4. Click **"💾 Save Settings"**

✅ This information will automatically appear on all generated documents!

### Step 3: Set Up Sheet Structure

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

### Step 4: Generate Documents

A **"📄 Document Generator"** menu will appear in your sheet:

- **Generate Document** - Select a row and click to create one document
- **Batch Generate All** - Generate all rows with Document Types at once
- **⚙️ Organization Settings** - Configure company details (appears on all documents)
- **Setup Templates Folder** - Create template folder structure
- **Help** - View this help dialog

## 🏢 Organization Configuration System

The script automatically creates a **"Settings"** sheet to store your organization details. This is the most powerful feature!

### What Gets Stored

```
Company Information
├── Company Name
├── Company Address
├── Company Phone
├── Company Email
└── Company Website

Identification
├── Tax ID / VAT Number
└── Registration Number

Banking Information
├── Bank Name
├── Bank Account Number
├── Bank Routing Number
└── Bank SWIFT Code

Document Defaults
├── Default Currency
├── Default Payment Terms
├── Company Logo URL
├── Company Registration Details
└── Footer Text
```

### How It Works

1. **First Run**: Click "⚙️ Organization Settings" to open the configuration form
2. **Fill Details**: Enter your company information in the user-friendly form
3. **Save**: Click "💾 Save Settings" - details are stored in the hidden "Settings" sheet
4. **Auto-Insert**: Every document generated automatically includes these details
5. **Update Anytime**: Change your company info by reopening the settings dialog
6. **Instant Effect**: All future documents use the updated information

### What Appears on Documents

When you generate a document, it automatically includes:

```
═════════════════════════════════
    YOUR COMPANY NAME (from settings)
    123 Business Street, City, State 12345
    Phone: (555) 000-0000
    Email: info@company.com
    Website: www.company.com
═════════════════════════════════

                    INVOICE
                 Generated on: 5/24/2026

[Document-specific data from sheet]

═════════════════════════════════
Tax ID: XX-XXXXXXX
Bank: Your Bank Name
Account: XXXXXXXX
Thank you for your business!
```

### Configuration Fields Explained

| Field | Purpose | Example |
|-------|---------|---------|
| **Company Name** | Main company identifier | "ABC Corporation Ltd" |
| **Company Address** | Physical/mailing address | "123 Business Ave, New York, NY 10001" |
| **Company Phone** | Contact phone number | "+1 (555) 000-0000" |
| **Company Email** | Official email address | "billing@company.com" |
| **Company Website** | Company website URL | "www.company.com" |
| **Tax ID / VAT Number** | Tax identifier | "12-3456789" or "VAT: IE1234567AB" |
| **Registration Number** | Business registration | "REG-123456789" |
| **Bank Name** | Bank institution name | "First National Bank" |
| **Bank Account Number** | Account for payments | "1234567890" |
| **Bank Routing Number** | Routing/Sort code | "021000021" |
| **Bank SWIFT Code** | International bank code | "FNBAUS33" |
| **Default Currency** | Currency symbol/code | "$" or "USD" or "€" |
| **Default Payment Terms** | Payment deadline | "Net 30" or "Due on Receipt" |
| **Company Logo URL** | Logo image URL | "https://example.com/logo.png" |
| **Company Registration Details** | Additional legal info | "Registered in California, License #XX" |
| **Footer Text** | Closing message | "Thank you for your business!" |

### Update Company Information

**To change company details:**

1. Open your Google Sheet
2. Click **"📄 Document Generator" → "⚙️ Organization Settings"**
3. Update any fields you need to change
4. Click **"💾 Save Settings"**
5. Generate new documents - they'll automatically use the updated information

✅ **No need to edit code or recreate documents!**

### View Stored Configuration

If you want to see the raw configuration:

1. Open your Google Sheet
2. Look for the hidden **"Settings"** sheet tab
3. You'll see a Key-Value table with all your settings

**Note**: Manually editing the Settings sheet is possible but not recommended - use the settings dialog instead!

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
