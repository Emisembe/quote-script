// ============================================================
// BUDGET PLANNER
// Step 1: generateBudgetPlan()
//   Pulls last year's actuals and creates a working planner
//   sheet where you adjust the proposed budget for next year.
//
// Step 2: exportBudgetDocument()
//   Takes the approved planner sheet and produces a formatted
//   Google Doc — ready to share, print, or present.
// ============================================================

// ── COLUMN POSITIONS in the planner sheet (1-based) ──────────
const PC = {
  CATEGORY:  1,
  ACCOUNT:   2,
  ACTUAL:    3,
  PCT_CHANGE:4,
  PROPOSED:  5,
  CHANGE_AMT:6,
  NOTES:     7
};

// ── STEP 1: Generate the Budget Planner ───────────────────────

function generateBudgetPlan() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Ask for last year's actuals sheet
  const allSheets = ss.getSheets().map(s => s.getName());
  const srcResp = ui.prompt(
    '📂  Last Year — Actuals Sheet',
    'Which sheet contains last year\'s transaction data?\n\n' +
    'Available sheets:\n' +
    allSheets.map((n, i) => '  ' + (i + 1) + '.  ' + n).join('\n') +
    '\n\nType the sheet name exactly:',
    ui.ButtonSet.OK_CANCEL
  );
  if (srcResp.getSelectedButton() !== ui.Button.OK) return;
  const srcSheet = srcResp.getResponseText().trim();
  if (!allSheets.includes(srcSheet)) {
    ui.alert('"' + srcSheet + '" not found. Check the spelling.'); return;
  }

  // Ask for the year being reviewed
  const yearResp = ui.prompt(
    '📅  Last Year',
    'Enter the year of actual data you are reviewing (e.g. 2024):',
    ui.ButtonSet.OK_CANCEL
  );
  if (yearResp.getSelectedButton() !== ui.Button.OK) return;
  const lastYear = yearResp.getResponseText().trim();
  if (!/^\d{4}$/.test(lastYear)) { ui.alert('Please enter a 4-digit year.'); return; }

  const nextYear   = String(parseInt(lastYear) + 1);
  const plannerName = 'Budget Plan ' + nextYear;

  if (ss.getSheetByName(plannerName)) {
    const ow = ui.alert(
      '"' + plannerName + '" already exists.',
      'Overwrite it?', ui.ButtonSet.YES_NO
    );
    if (ow !== ui.Button.YES) return;
  }

  // Pull actuals for the full last year
  const start = new Date(parseInt(lastYear), 0, 1);
  const end   = new Date(parseInt(lastYear), 11, 31, 23, 59, 59);
  const rows  = getRowsInRange(start, end, srcSheet);

  // Build the planner sheet
  const sheet = getOrCreateSheet(ss, plannerName);
  buildPlannerSheet(sheet, rows, lastYear, nextYear, ss);

  ss.setActiveSheet(sheet);
  ui.alert(
    '✅ Budget Planner created: "' + plannerName + '"\n\n' +
    '• YELLOW cells = % Change — adjust these to set your targets.\n' +
    '  Enter a positive number to increase (e.g. 10 for +10%)\n' +
    '  Enter a negative number to cut (e.g. -5 for -5%)\n' +
    '  Leave at 0 to keep the same as last year.\n\n' +
    '• BLUE cells = Notes — add your reasoning for each change.\n\n' +
    'When finalised:\n' +
    '📊 Financial Statements → 💰 Budget → Export Budget Document'
  );
}

// ── Planner sheet builder ──────────────────────────────────────

function buildPlannerSheet(sheet, rows, lastYear, nextYear, ss) {
  sheet.setColumnWidth(PC.CATEGORY,   190);
  sheet.setColumnWidth(PC.ACCOUNT,    220);
  sheet.setColumnWidth(PC.ACTUAL,     140);
  sheet.setColumnWidth(PC.PCT_CHANGE, 110);
  sheet.setColumnWidth(PC.PROPOSED,   140);
  sheet.setColumnWidth(PC.CHANGE_AMT, 140);
  sheet.setColumnWidth(PC.NOTES,      280);

  let r = 1;

  // ── Title block ────────────────────────────────────────────
  sheet.getRange(r, 1, 1, 7).merge()
    .setValue('BUDGET PLAN — ' + nextYear)
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(15).setHorizontalAlignment('center');
  r++;
  sheet.getRange(r, 1, 1, 7).merge()
    .setValue('Based on ' + lastYear + ' actuals   |   Prepared: ' + formatDate(new Date()))
    .setBackground('#16213e').setFontColor('#aaaaaa')
    .setFontSize(9).setHorizontalAlignment('center');
  r++; r++;

  // ── Legend ─────────────────────────────────────────────────
  sheet.getRange(r, 1, 1, 7).merge()
    .setValue('HOW TO USE:   Yellow cells = type your % change target  |  ' +
              'Positive % = increase  |  Negative % = cut  |  0 = same as last year  |  ' +
              'Blue cells = add your notes and assumptions')
    .setBackground('#fff8e1').setFontColor('#555500')
    .setFontSize(9).setWrap(true).setFontStyle('italic');
  r++; r++;

  // ── Column headers ─────────────────────────────────────────
  const headers = [
    'Category',
    'Account Name',
    lastYear + ' Actual',
    '% Change',
    nextYear + ' Proposed',
    'Change (£/$)',
    'Notes & Assumptions'
  ];
  sheet.getRange(r, 1, 1, 7)
    .setValues([headers])
    .setBackground('#0d3b4f').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(10);
  sheet.setFrozenRows(r);
  const headerRow = r;
  r++;

  // Totals accumulators for summary
  const summary = {};

  // ── Categories to render ───────────────────────────────────
  const sections = [
    {
      header: 'INCOME STATEMENT',
      headerColor: '#2d3748',
      categories: [
        { key: 'REVENUE',       label: 'Revenue',            color: '#d4edda', isRevenue: true  },
        { key: 'COGS',          label: 'Cost of Goods Sold', color: '#fde8d8', isRevenue: false },
        { key: 'OPEX',          label: 'Operating Expenses', color: '#dce4f5', isRevenue: false },
        { key: 'OTHER_INCOME',  label: 'Other Income',       color: '#f5e6ff', isRevenue: true  },
        { key: 'OTHER_EXPENSE', label: 'Other Expenses',     color: '#ffe0e0', isRevenue: false }
      ]
    },
    {
      header: 'BALANCE SHEET (Capital & Asset Planning)',
      headerColor: '#2d3748',
      categories: [
        { key: 'CURRENT_ASSETS',      label: 'Current Assets',      color: '#dbeafe', isRevenue: true  },
        { key: 'FIXED_ASSETS',        label: 'Fixed Assets',        color: '#dbeafe', isRevenue: true  },
        { key: 'CURRENT_LIABILITIES', label: 'Current Liabilities', color: '#fde8e8', isRevenue: false },
        { key: 'LONG_TERM_LIABILITIES','label':'Long Term Liabilities',color:'#fde8e8',isRevenue: false },
        { key: 'EQUITY',              label: 'Equity',              color: '#d1fae5', isRevenue: true  }
      ]
    }
  ];

  sections.forEach(section => {
    // Section divider
    sheet.getRange(r, 1, 1, 7).merge()
      .setValue(section.header)
      .setBackground(section.headerColor).setFontColor('#ffffff')
      .setFontWeight('bold').setFontSize(10);
    r++;

    section.categories.forEach(cat => {
      const actualItems = groupByAccount(rows, cat.key);
      const actualMap   = {};
      actualItems.forEach(i => { actualMap[i.name] = i.total; });

      const allAccounts = [...new Set([
        ...(COA[cat.key] ? COA[cat.key].names : []),
        ...actualItems.map(i => i.name)
      ])];

      // Only render if there's something to show
      const hasData = allAccounts.some(n => (actualMap[n] || 0) !== 0);
      if (!hasData && actualItems.length === 0) return;

      // Category sub-header
      sheet.getRange(r, 1, 1, 7).merge()
        .setValue(cat.label.toUpperCase())
        .setBackground(cat.color).setFontColor('#333333')
        .setFontWeight('bold').setFontSize(10);
      r++;

      const catFirstRow = r;
      const altBg = ['#f8f9fa', '#ffffff'];

      allAccounts.forEach((name, i) => {
        const actual = actualMap[name] || 0;

        // Actual value
        sheet.getRange(r, PC.CATEGORY).setValue(cat.label).setBackground(altBg[i % 2])
          .setFontColor('#888888').setFontSize(9);
        sheet.getRange(r, PC.ACCOUNT).setValue(name).setBackground(altBg[i % 2]).setFontSize(10);
        sheet.getRange(r, PC.ACTUAL).setValue(actual).setBackground(altBg[i % 2])
          .setNumberFormat('#,##0.00').setHorizontalAlignment('right')
          .setFontColor(actual < 0 ? '#c0392b' : '#000000');

        // % Change — editable yellow cell, default 0
        sheet.getRange(r, PC.PCT_CHANGE).setValue(0)
          .setBackground('#fff9c4').setNumberFormat('0.0"%"')
          .setHorizontalAlignment('center').setFontWeight('bold').setFontSize(10);

        // Proposed — formula: Actual × (1 + PctChange/100)
        const actualCell = sheet.getRange(r, PC.ACTUAL).getA1Notation();
        const pctCell    = sheet.getRange(r, PC.PCT_CHANGE).getA1Notation();
        sheet.getRange(r, PC.PROPOSED)
          .setFormula('=ROUND(' + actualCell + '*(1+' + pctCell + '/100),2)')
          .setBackground('#e8f5e9').setNumberFormat('#,##0.00')
          .setHorizontalAlignment('right').setFontWeight('bold');

        // Change amount — formula: Proposed - Actual
        const propCell = sheet.getRange(r, PC.PROPOSED).getA1Notation();
        sheet.getRange(r, PC.CHANGE_AMT)
          .setFormula('=' + propCell + '-' + actualCell)
          .setBackground(altBg[i % 2]).setNumberFormat('#,##0.00')
          .setHorizontalAlignment('right').setFontColor('#1565a0');

        // Notes — editable blue-tinted cell
        sheet.getRange(r, PC.NOTES).setValue('')
          .setBackground('#e3f2fd').setFontSize(9).setWrap(true);

        r++;
      });

      const catLastRow = r - 1;

      // Subtotal row
      const subFormulas = [
        '=SUM(C' + catFirstRow + ':C' + catLastRow + ')',
        '',
        '=SUM(E' + catFirstRow + ':E' + catLastRow + ')',
        '=SUM(F' + catFirstRow + ':F' + catLastRow + ')',
        ''
      ];
      sheet.getRange(r, PC.ACCOUNT).setValue('Total ' + cat.label)
        .setBackground(cat.color).setFontWeight('bold').setFontSize(10);
      sheet.getRange(r, PC.ACTUAL).setFormula(subFormulas[0])
        .setBackground(cat.color).setNumberFormat('#,##0.00')
        .setFontWeight('bold').setHorizontalAlignment('right');
      sheet.getRange(r, PC.PCT_CHANGE).setValue('')
        .setBackground(cat.color);
      sheet.getRange(r, PC.PROPOSED).setFormula(subFormulas[2])
        .setBackground(cat.color).setNumberFormat('#,##0.00')
        .setFontWeight('bold').setHorizontalAlignment('right');
      sheet.getRange(r, PC.CHANGE_AMT).setFormula(subFormulas[3])
        .setBackground(cat.color).setNumberFormat('#,##0.00')
        .setFontWeight('bold').setHorizontalAlignment('right').setFontColor('#1565a0');
      sheet.getRange(r, PC.NOTES).setValue('').setBackground(cat.color);

      summary[cat.key] = {
        actualRow:   'C' + r,
        proposedRow: 'E' + r,
        isRevenue:   cat.isRevenue
      };
      r++; r++;
    });
  });

  // ── Net Income summary ─────────────────────────────────────
  r++;
  sheet.getRange(r, 1, 1, 7).merge()
    .setValue('NET INCOME SUMMARY')
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  r++;

  const niRows = [
    { label: 'Total Revenue',          key: 'REVENUE'       },
    { label: 'Total Cost of Goods Sold', key: 'COGS'        },
    { label: 'Total Operating Expenses', key: 'OPEX'        },
    { label: 'Total Other Income',      key: 'OTHER_INCOME' },
    { label: 'Total Other Expenses',    key: 'OTHER_EXPENSE'}
  ];

  let niActualFormula    = '';
  let niProposedFormula  = '';

  niRows.forEach(row => {
    const s = summary[row.key];
    if (!s) return;
    const sign = s.isRevenue ? '+' : '-';
    niActualFormula   += (niActualFormula   ? sign : (s.isRevenue ? '' : '-')) + s.actualRow;
    niProposedFormula += (niProposedFormula ? sign : (s.isRevenue ? '' : '-')) + s.proposedRow;
    niActualFormula   = niActualFormula.replace('+-', '-');
    niProposedFormula = niProposedFormula.replace('+-', '-');
  });

  sheet.getRange(r, PC.ACCOUNT).setValue(lastYear + ' Net Income (Actual)')
    .setFontWeight('bold').setBackground('#fff3cd').setFontSize(10);
  if (niActualFormula) {
    sheet.getRange(r, PC.ACTUAL).setFormula('=' + niActualFormula)
      .setBackground('#fff3cd').setNumberFormat('#,##0.00')
      .setFontWeight('bold').setHorizontalAlignment('right').setFontSize(11);
  }
  r++;

  sheet.getRange(r, PC.ACCOUNT).setValue(nextYear + ' Net Income (Proposed)')
    .setFontWeight('bold').setBackground('#d4edda').setFontSize(10);
  if (niProposedFormula) {
    sheet.getRange(r, PC.PROPOSED).setFormula('=' + niProposedFormula)
      .setBackground('#d4edda').setNumberFormat('#,##0.00')
      .setFontWeight('bold').setHorizontalAlignment('right').setFontSize(11);
  }
  r++;

  // Store metadata in a hidden row so the exporter can find key info
  sheet.getRange(r + 2, 1).setValue('__META__');
  sheet.getRange(r + 2, 2).setValue(lastYear);
  sheet.getRange(r + 2, 3).setValue(nextYear);
  sheet.getRange(r + 2, 4).setValue(headerRow);
  sheet.getRange(r + 2, 1, 1, 4).setFontColor('#ffffff'); // hide visually
}

// ── STEP 2: Export to Google Doc ──────────────────────────────

function exportBudgetDocument() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Find planner sheets
  const plannerSheets = ss.getSheets()
    .map(s => s.getName())
    .filter(n => n.startsWith('Budget Plan '));

  if (plannerSheets.length === 0) {
    ui.alert('No Budget Plan sheet found.\n\nRun "Create Budget Plan from Last Year" first.');
    return;
  }

  // Let user pick the planner sheet
  const allSheets = ss.getSheets().map(s => s.getName());
  const pickResp = ui.prompt(
    '📋  Select Budget Plan Sheet',
    'Available sheets:\n\n' +
    allSheets.map((n, i) => '  ' + (i + 1) + '.  ' + n).join('\n') +
    '\n\nType the Budget Plan sheet name:',
    ui.ButtonSet.OK_CANCEL
  );
  if (pickResp.getSelectedButton() !== ui.Button.OK) return;
  const plannerName = pickResp.getResponseText().trim();
  if (!allSheets.includes(plannerName)) {
    ui.alert('"' + plannerName + '" not found.'); return;
  }

  // Ask for organisation name
  const orgResp = ui.prompt(
    '🏢  Organisation Name',
    'Enter your organisation or business name (for the document header):',
    ui.ButtonSet.OK_CANCEL
  );
  if (orgResp.getSelectedButton() !== ui.Button.OK) return;
  const orgName = orgResp.getResponseText().trim() || 'Organisation';

  // Read planner data
  const planSheet = ss.getSheetByName(plannerName);
  const planData  = planSheet.getDataRange().getValues();

  // Extract metadata
  let lastYear = '', nextYear = '', headerRowNum = 0;
  planData.forEach(row => {
    if (String(row[0]) === '__META__') {
      lastYear    = String(row[1]);
      nextYear    = String(row[2]);
      headerRowNum = parseInt(row[3]) || 0;
    }
  });
  if (!nextYear) { ui.alert('Could not read budget metadata. Was this sheet created by the Budget Planner?'); return; }

  // Create Google Doc
  const docTitle = orgName + ' — Annual Budget ' + nextYear;
  const doc  = DocumentApp.create(docTitle);
  const body = doc.getBody();

  // ── Cover page ─────────────────────────────────────────────
  body.clear();
  const titlePara = body.appendParagraph(orgName.toUpperCase());
  titlePara.setHeading(DocumentApp.ParagraphHeading.TITLE);
  titlePara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  const subPara = body.appendParagraph('Annual Budget — ' + nextYear);
  subPara.setHeading(DocumentApp.ParagraphHeading.SUBTITLE);
  subPara.setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendParagraph('Prepared: ' + formatDate(new Date()))
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  body.appendParagraph('Based on: ' + lastYear + ' Actual Results')
    .setAlignment(DocumentApp.HorizontalAlignment.CENTER);

  body.appendPageBreak();

  // ── Executive Summary ──────────────────────────────────────
  body.appendParagraph('Executive Summary').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(
    'This document presents the proposed annual budget for ' + nextYear + ' for ' + orgName + '. ' +
    'The budget has been prepared using ' + lastYear + ' actual results as a baseline. ' +
    'Each account line has been reviewed and adjusted to reflect anticipated changes in ' +
    'business activity, market conditions, and strategic priorities.'
  );
  body.appendParagraph(''); // spacer

  // ── Budget table ───────────────────────────────────────────
  body.appendParagraph('Budget Detail — ' + nextYear).setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(
    'The table below shows each account, the ' + lastYear + ' actual amount, ' +
    'the proposed ' + nextYear + ' budget, the change in monetary terms, and the ' +
    'rationale for each adjustment.'
  );
  body.appendParagraph('');

  // Build table from planner sheet
  // Columns in doc table: Account | lastYear Actual | nextYear Proposed | Change | Notes
  const tableHeaders = [
    'Account', lastYear + ' Actual', nextYear + ' Budget', 'Change', 'Notes & Assumptions'
  ];
  const tableData = [tableHeaders];

  let currentCategory = '';
  for (let i = headerRowNum; i < planData.length; i++) {
    const row = planData[i];
    if (String(row[0]) === '__META__') break;

    const category = String(row[PC.CATEGORY - 1]).trim();
    const account  = String(row[PC.ACCOUNT  - 1]).trim();
    const actual   = row[PC.ACTUAL    - 1];
    const proposed = row[PC.PROPOSED  - 1];
    const change   = row[PC.CHANGE_AMT- 1];
    const notes    = String(row[PC.NOTES - 1]).trim();

    if (!account || account === '' || account === 'Account Name') continue;

    // Insert category row when it changes
    if (category && category !== currentCategory && !account.startsWith('Total')) {
      currentCategory = category;
      tableData.push([category.toUpperCase(), '', '', '', '']);
    }

    const fmtAmt = v => {
      if (typeof v !== 'number') return '';
      return (v < 0 ? '(' : '') +
             Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 2 }) +
             (v < 0 ? ')' : '');
    };

    tableData.push([
      account.startsWith('Total') ? account : '    ' + account,
      fmtAmt(actual),
      fmtAmt(proposed),
      fmtAmt(change),
      notes
    ]);
  }

  // Insert the table
  const table = body.appendTable(tableData);
  table.setBorderWidth(0.5);

  // Style header row
  const headerTableRow = table.getRow(0);
  for (let c = 0; c < tableHeaders.length; c++) {
    headerTableRow.getCell(c)
      .setBackgroundColor('#16213e')
      .editAsText().setForegroundColor('#ffffff').setBold(true);
  }

  // Style category rows (bold, light bg)
  for (let i = 1; i < tableData.length; i++) {
    if (tableData[i][1] === '' && tableData[i][2] === '') {
      const catRow = table.getRow(i);
      for (let c = 0; c < 5; c++) {
        catRow.getCell(c).setBackgroundColor('#e8eaed')
          .editAsText().setBold(true);
      }
    } else if (tableData[i][0].startsWith('Total')) {
      const totRow = table.getRow(i);
      for (let c = 0; c < 5; c++) {
        totRow.getCell(c).setBackgroundColor('#f5f5f5')
          .editAsText().setBold(true);
      }
    }
  }

  // Column widths
  table.getRow(0).getCell(0).setWidth(150);
  table.getRow(0).getCell(1).setWidth(90);
  table.getRow(0).getCell(2).setWidth(90);
  table.getRow(0).getCell(3).setWidth(90);

  body.appendPageBreak();

  // ── Key Assumptions page ──────────────────────────────────
  body.appendParagraph('Key Assumptions').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(
    'The following assumptions underpin this budget. These should be reviewed ' +
    'and agreed by the relevant stakeholders before the budget is adopted.'
  );
  body.appendParagraph('');

  // Pull notes from planner sheet
  const notesFound = [];
  for (let i = headerRowNum; i < planData.length; i++) {
    const row   = planData[i];
    if (String(row[0]) === '__META__') break;
    const acct  = String(row[PC.ACCOUNT   - 1]).trim();
    const notes = String(row[PC.NOTES     - 1]).trim();
    if (notes && notes !== '' && !acct.startsWith('Total')) {
      notesFound.push({ account: acct, note: notes });
    }
  }

  if (notesFound.length > 0) {
    notesFound.forEach(n => {
      body.appendParagraph(n.account + ':').setBold(true);
      body.appendParagraph('    ' + n.note);
      body.appendParagraph('');
    });
  } else {
    body.appendParagraph(
      '[No notes were added in the planner sheet. ' +
      'Fill in the Notes column in "' + plannerName + '" and re-export to include assumptions here.]'
    ).setItalic(true).setForegroundColor('#888888');
  }

  body.appendPageBreak();

  // ── Approval section ──────────────────────────────────────
  body.appendParagraph('Budget Approval').setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph(
    'This budget has been reviewed and is approved for implementation in ' + nextYear + '.'
  );
  body.appendParagraph('');

  const approvalLines = [
    'Prepared by:   ____________________________   Date: ___________',
    '',
    'Reviewed by:   ____________________________   Date: ___________',
    '',
    'Approved by:   ____________________________   Date: ___________'
  ];
  approvalLines.forEach(l => body.appendParagraph(l));

  doc.saveAndClose();

  // Save doc URL to Config sheet
  let config = ss.getSheetByName('Config');
  if (!config) { config = ss.insertSheet('Config'); config.appendRow(['Setting','Value']); }
  config.appendRow(['Budget Document — ' + nextYear, doc.getUrl()]);

  ui.alert(
    '✅ Budget document created!\n\n' +
    '"' + docTitle + '"\n\n' +
    'Open it from your Google Drive, or find the link in the Config sheet.\n\n' +
    'Tip: before sharing, fill in the Notes column in the planner sheet\n' +
    'and re-export — the Key Assumptions page will populate automatically.'
  );
}
