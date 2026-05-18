// ============================================================
// FORM SETUP
// Run createFinancialForm() ONCE from the Apps Script editor
// to create the Google Form linked to this spreadsheet.
// ============================================================

function createFinancialForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const form = FormApp.create('Financial Transaction Entry – ' + ss.getName());
  form.setDescription(
    'Record every financial transaction here. ' +
    'Use the Financial Statements menu in the spreadsheet to generate P&L, Balance Sheet, and Cash Flow reports.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);

  // ── 1. Transaction Date ──────────────────────────────────
  form.addDateItem()
    .setTitle('Transaction Date')
    .setRequired(true);

  // ── 2. Account Type (top-level category) ────────────────
  const typeItem = form.addListItem().setTitle('Account Type').setRequired(true);
  typeItem.setChoiceValues(getAllTypeChoices());

  // ── 3. Account Name ──────────────────────────────────────
  // Flat list of all accounts across all categories.
  const allNames = [];
  Object.keys(COA).forEach(k => allNames.push(...COA[k].names));
  allNames.push('Other (specify below)');
  form.addListItem()
    .setTitle('Account Name')
    .setRequired(true)
    .setChoiceValues(allNames);

  // ── 4. Custom account name (if Other) ───────────────────
  form.addTextItem()
    .setTitle('If "Other", enter account name')
    .setRequired(false);

  // ── 5. Amount ────────────────────────────────────────────
  form.addTextItem()
    .setTitle('Amount (numbers only, no currency symbol)')
    .setRequired(true);

  // ── 6. Direction ─────────────────────────────────────────
  form.addMultipleChoiceItem()
    .setTitle('Direction')
    .setRequired(true)
    .setChoiceValues([
      'Income / Asset Increase / Liability Decrease / Equity Increase',
      'Expense / Asset Decrease / Liability Increase / Equity Decrease'
    ]);

  // ── 7. Cash Flow Category ────────────────────────────────
  form.addMultipleChoiceItem()
    .setTitle('Cash Flow Category')
    .setRequired(true)
    .setChoiceValues([
      'Operating Activities',
      'Investing Activities',
      'Financing Activities',
      'Not a cash transaction (non-cash / balance sheet only)'
    ]);

  // ── 8. Vendor / Customer ─────────────────────────────────
  form.addTextItem()
    .setTitle('Vendor or Customer Name')
    .setRequired(false);

  // ── 9. Reference / Invoice number ───────────────────────
  form.addTextItem()
    .setTitle('Reference / Invoice Number')
    .setRequired(false);

  // ── 10. Description ──────────────────────────────────────
  form.addParagraphTextItem()
    .setTitle('Description / Notes')
    .setRequired(false);

  // Link form responses to the spreadsheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Store the form URL in a config sheet for easy access
  let config = ss.getSheetByName('Config');
  if (!config) {
    config = ss.insertSheet('Config');
    config.appendRow(['Setting', 'Value']);
  }
  config.appendRow(['Form URL (for data entry)', form.getPublishedUrl()]);
  config.appendRow(['Form Edit URL', form.getEditUrl()]);
  config.autoResizeColumns(1, 2);

  SpreadsheetApp.getUi().alert(
    'Form Created!\n\n' +
    'Form URL (share this for data entry):\n' + form.getPublishedUrl() + '\n\n' +
    'The URL has also been saved in the Config sheet.'
  );
}
