// ============================================================
//  SACCO Manager – Google Apps Script
//  Savings & Credit Cooperative Organization (Kenya)
//
//  HOW TO USE:
//  1. Open your Google Spreadsheet.
//  2. Go to Extensions > Apps Script and paste this file.
//  3. Run "setupSacco" once to create the form and configure sheets.
//  4. The "SACCO Management" menu will appear on every open.
// ============================================================

// ─── CONFIGURATION ───────────────────────────────────────────
var CONFIG = {
  FORM_TITLE: "SACCO Contribution & Transaction Form",
  SHEET_RESPONSES: "Transactions",
  SHEET_MEMBERS: "Members",
  SHEET_LOANS: "Loans",
  INTEREST_RATE_MONTHLY: 1.0,   // 1% per month on reducing balance
  LOAN_MULTIPLIER: 3,           // max loan = 3× total savings
  CURRENCY: "KES",
};

// ─── MENU ────────────────────────────────────────────────────
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("SACCO Management")
    .addItem("Setup SACCO (run once)", "setupSacco")
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("Members")
        .addItem("Look up member", "promptMemberLookup")
        .addItem("Show all members", "showAllMembers")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("Loans")
        .addItem("Check loan eligibility", "promptLoanEligibility")
        .addItem("Calculate loan repayment", "promptLoanCalculator")
        .addItem("View active loans", "viewActiveLoans")
    )
    .addSubMenu(
      SpreadsheetApp.getUi().createMenu("Reports")
        .addItem("Member statement", "promptMemberStatement")
        .addItem("Branch / area summary", "promptAreaReport")
        .addItem("Monthly summary", "promptMonthlySummary")
    )
    .addSeparator()
    .addItem("Open contribution form", "openForm")
    .addToUi();
}

// ─── FIRST-TIME SETUP ────────────────────────────────────────
function setupSacco() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ui = SpreadsheetApp.getUi();

  _ensureSheets(ss);
  var form = _createOrGetForm(ss);

  PropertiesService.getDocumentProperties().setProperty("FORM_URL", form.getPublishedUrl());
  PropertiesService.getDocumentProperties().setProperty("FORM_EDIT_URL", form.getEditUrl());

  ui.alert(
    "Setup complete!",
    "Form created: " + form.getPublishedUrl() +
    "\n\nShare this link with your accountant to record transactions." +
    "\nAll responses flow into the '" + CONFIG.SHEET_RESPONSES + "' sheet.",
    ui.ButtonSet.OK
  );
}

function _ensureSheets(ss) {
  var needed = [CONFIG.SHEET_RESPONSES, CONFIG.SHEET_MEMBERS, CONFIG.SHEET_LOANS];
  needed.forEach(function (name) {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });
  _setupMembersSheet(ss.getSheetByName(CONFIG.SHEET_MEMBERS));
  _setupLoansSheet(ss.getSheetByName(CONFIG.SHEET_LOANS));
}

function _setupMembersSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = ["Member ID", "Full Name", "ID Number", "Phone", "Branch/Area", "Date Joined", "Status"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1a73e8").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

function _setupLoansSheet(sheet) {
  if (sheet.getLastRow() === 0) {
    var headers = [
      "Loan ID", "Member Name", "Principal (KES)", "Monthly Rate (%)",
      "Term (Months)", "Monthly Payment (KES)", "Date Issued",
      "Date Due", "Status", "Notes"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1a73e8").setFontColor("#ffffff");
    sheet.setFrozenRows(1);
  }
}

// ─── FORM CREATION ───────────────────────────────────────────
function _createOrGetForm(ss) {
  var savedUrl = PropertiesService.getDocumentProperties().getProperty("FORM_EDIT_URL");
  if (savedUrl) {
    try {
      return FormApp.openByUrl(savedUrl);
    } catch (e) {
      // form was deleted — recreate
    }
  }
  return _buildForm(ss);
}

function _buildForm(ss) {
  var form = FormApp.create(CONFIG.FORM_TITLE);
  form.setDescription(
    "Record member contributions, deposits, and repayments.\n" +
    "Fill in all fields accurately. All amounts in Kenya Shillings (KES)."
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);

  // Section 1 – Member details
  form.addSectionHeaderItem()
    .setTitle("Member Details")
    .setHelpText("Identify the member making this transaction.");

  form.addTextItem()
    .setTitle("Full Name")
    .setHelpText("As registered in the SACCO records")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Member ID / Phone Number")
    .setHelpText("Your SACCO membership number or M-Pesa phone (07XXXXXXXX)")
    .setRequired(true);

  var branchItem = form.addListItem().setTitle("Branch / Area").setRequired(true);
  branchItem.setChoiceValues([
    "Nairobi Central", "Westlands", "Eastlands", "Ngong Road",
    "Thika Road", "Mombasa Road", "Kiambu", "Machakos",
    "Nakuru", "Kisumu", "Eldoret", "Meru", "Other"
  ]);

  // Section 2 – Transaction
  form.addSectionHeaderItem()
    .setTitle("Transaction Details")
    .setHelpText("What type of payment is this?");

  var txnType = form.addListItem().setTitle("Transaction Type").setRequired(true);
  txnType.setChoiceValues([
    "Monthly Contribution",
    "Registration / Joining Fee",
    "Loan Repayment",
    "Shares Purchase",
    "Development Levy",
    "Penalty / Fine",
    "Other Deposit"
  ]);

  form.addTextItem()
    .setTitle("Amount (KES)")
    .setHelpText("Numbers only, e.g. 5000")
    .setRequired(true);

  // Section 3 – Payment method
  form.addSectionHeaderItem()
    .setTitle("Payment Method")
    .setHelpText("How was the money paid?");

  var methodItem = form.addMultipleChoiceItem().setTitle("Payment Method").setRequired(true);
  methodItem.setChoiceValues(["M-Pesa", "Cash", "Bank Transfer", "Cheque"]);

  form.addTextItem()
    .setTitle("M-Pesa / Reference Number")
    .setHelpText("Transaction code, e.g. QJK7XYZ123 (leave blank for cash)");

  // Section 4 – Transaction date & notes
  form.addSectionHeaderItem()
    .setTitle("Additional Information");

  form.addDateItem()
    .setTitle("Transaction Date")
    .setHelpText("When was this payment made?")
    .setRequired(true);

  form.addTextItem()
    .setTitle("Received By (Accountant Name)")
    .setHelpText("Full name of the person recording this entry")
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle("Notes / Remarks")
    .setHelpText("Any extra information (optional)");

  // Link form responses to the Transactions sheet
  var txnSheet = ss.getSheetByName(CONFIG.SHEET_RESPONSES);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // Google creates a new sheet named "Form Responses 1" — rename it
  SpreadsheetApp.flush();
  Utilities.sleep(2000);
  ss.getSheets().forEach(function (s) {
    if (s.getName().startsWith("Form Responses")) {
      s.setName(CONFIG.SHEET_RESPONSES);
    }
  });

  return form;
}

function openForm() {
  var url = PropertiesService.getDocumentProperties().getProperty("FORM_URL");
  if (!url) {
    SpreadsheetApp.getUi().alert("Please run Setup first (SACCO Management > Setup SACCO).");
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<p>Click the link to open the contribution form:</p>' +
    '<p><a href="' + url + '" target="_blank">' + url + '</a></p>'
  ).setWidth(480).setHeight(120);
  SpreadsheetApp.getUi().showModalDialog(html, "Contribution Form");
}

// ─── MEMBER LOOKUP ───────────────────────────────────────────
function promptMemberLookup() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt("Member Lookup", "Enter member name or ID:", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var query = resp.getResponseText().trim();
  if (!query) return;
  _showMemberSummary(query);
}

function _showMemberSummary(query) {
  var data = _getTransactions();
  var matches = data.filter(function (row) {
    return _rowMatchesQuery(row, query);
  });

  if (matches.length === 0) {
    SpreadsheetApp.getUi().alert("No transactions found for: " + query);
    return;
  }

  var name = matches[0][1] || query;
  var totals = {};
  var grandTotal = 0;

  matches.forEach(function (row) {
    var type = row[5] || "Unknown";
    var amount = parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0;
    totals[type] = (totals[type] || 0) + amount;
    grandTotal += amount;
  });

  var lines = ["<b>Member: " + name + "</b>", "<b>Transactions: " + matches.length + "</b>", ""];
  lines.push("<u>Breakdown by type:</u>");
  Object.keys(totals).forEach(function (type) {
    lines.push("&nbsp;&nbsp;" + type + ": KES " + _fmt(totals[type]));
  });
  lines.push("");
  lines.push("<b>Total contributions: KES " + _fmt(grandTotal) + "</b>");

  var monthly = grandTotal / CONFIG.LOAN_MULTIPLIER;
  lines.push("<i>Max eligible loan: KES " + _fmt(grandTotal * CONFIG.LOAN_MULTIPLIER) + " (" + CONFIG.LOAN_MULTIPLIER + "× savings)</i>");

  var html = HtmlService.createHtmlOutput(lines.join("<br>")).setWidth(400).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, "Member Summary");
}

function showAllMembers() {
  var data = _getTransactions();
  if (data.length === 0) {
    SpreadsheetApp.getUi().alert("No transactions recorded yet.");
    return;
  }

  var memberTotals = {};
  data.forEach(function (row) {
    var name = (row[1] || "").trim();
    if (!name) return;
    if (!memberTotals[name]) memberTotals[name] = 0;
    memberTotals[name] += parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0;
  });

  var lines = ["<b>All Members — Total Contributions</b><br>"];
  var sorted = Object.keys(memberTotals).sort();
  sorted.forEach(function (name) {
    lines.push(name + ": <b>KES " + _fmt(memberTotals[name]) + "</b>");
  });

  var html = HtmlService.createHtmlOutput(lines.join("<br>")).setWidth(420).setHeight(400);
  SpreadsheetApp.getUi().showModalDialog(html, "All Members (" + sorted.length + ")");
}

// ─── LOAN TOOLS ──────────────────────────────────────────────
function promptLoanEligibility() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt("Loan Eligibility", "Enter member name or ID:", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var query = resp.getResponseText().trim();
  if (!query) return;

  var data = _getTransactions();
  var matches = data.filter(function (row) { return _rowMatchesQuery(row, query); });

  if (matches.length === 0) {
    ui.alert("No records found for: " + query);
    return;
  }

  var savings = 0;
  matches.forEach(function (row) {
    var type = (row[5] || "").toLowerCase();
    if (type.indexOf("repayment") === -1) {
      savings += parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0;
    }
  });

  var maxLoan = savings * CONFIG.LOAN_MULTIPLIER;
  var name = matches[0][1] || query;

  var html = HtmlService.createHtmlOutput(
    "<b>Member:</b> " + name + "<br><br>" +
    "<b>Total savings:</b> KES " + _fmt(savings) + "<br>" +
    "<b>Maximum loan:</b> KES " + _fmt(maxLoan) + " (" + CONFIG.LOAN_MULTIPLIER + "× savings)<br><br>" +
    "<i>Interest rate: " + CONFIG.INTEREST_RATE_MONTHLY + "% per month (reducing balance)</i>"
  ).setWidth(380).setHeight(200);
  ui.showModalDialog(html, "Loan Eligibility");
}

function promptLoanCalculator() {
  var ui = SpreadsheetApp.getUi();

  var princResp = ui.prompt("Loan Calculator (1/2)", "Enter loan amount (KES):", ui.ButtonSet.OK_CANCEL);
  if (princResp.getSelectedButton() !== ui.Button.OK) return;
  var principal = parseFloat(princResp.getResponseText().replace(/[^0-9.]/g, ""));
  if (isNaN(principal) || principal <= 0) { ui.alert("Invalid amount."); return; }

  var termResp = ui.prompt("Loan Calculator (2/2)", "Repayment period in months:", ui.ButtonSet.OK_CANCEL);
  if (termResp.getSelectedButton() !== ui.Button.OK) return;
  var months = parseInt(termResp.getResponseText());
  if (isNaN(months) || months <= 0) { ui.alert("Invalid term."); return; }

  var rate = CONFIG.INTEREST_RATE_MONTHLY / 100;
  var monthlyPayment = (principal * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
  var totalPayable = monthlyPayment * months;
  var totalInterest = totalPayable - principal;

  var schedule = _buildRepaymentSchedule(principal, rate, months, monthlyPayment);

  var html = HtmlService.createHtmlOutput(
    "<b>Loan Summary</b><br><br>" +
    "Principal: KES " + _fmt(principal) + "<br>" +
    "Term: " + months + " months<br>" +
    "Monthly interest rate: " + CONFIG.INTEREST_RATE_MONTHLY + "%<br>" +
    "Monthly payment: <b>KES " + _fmt(monthlyPayment) + "</b><br>" +
    "Total payable: KES " + _fmt(totalPayable) + "<br>" +
    "Total interest: KES " + _fmt(totalInterest) + "<br><br>" +
    "<u>Repayment Schedule:</u><br>" +
    schedule
  ).setWidth(480).setHeight(500);
  ui.showModalDialog(html, "Loan Repayment Schedule");
}

function _buildRepaymentSchedule(principal, rate, months, monthlyPayment) {
  var balance = principal;
  var lines = [];
  lines.push("<table style='font-size:12px;border-collapse:collapse'>");
  lines.push("<tr style='background:#1a73e8;color:white'><th style='padding:4px 8px'>Month</th><th style='padding:4px 8px'>Payment</th><th style='padding:4px 8px'>Interest</th><th style='padding:4px 8px'>Principal</th><th style='padding:4px 8px'>Balance</th></tr>");
  for (var i = 1; i <= months; i++) {
    var interest = balance * rate;
    var principalPaid = monthlyPayment - interest;
    balance -= principalPaid;
    if (balance < 0) balance = 0;
    var bg = i % 2 === 0 ? "#f0f4ff" : "#ffffff";
    lines.push(
      "<tr style='background:" + bg + "'>" +
      "<td style='padding:3px 8px;text-align:center'>" + i + "</td>" +
      "<td style='padding:3px 8px;text-align:right'>" + _fmt(monthlyPayment) + "</td>" +
      "<td style='padding:3px 8px;text-align:right'>" + _fmt(interest) + "</td>" +
      "<td style='padding:3px 8px;text-align:right'>" + _fmt(principalPaid) + "</td>" +
      "<td style='padding:3px 8px;text-align:right'>" + _fmt(balance) + "</td>" +
      "</tr>"
    );
  }
  lines.push("</table>");
  return lines.join("");
}

function viewActiveLoans() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_LOANS);
  if (!sheet || sheet.getLastRow() <= 1) {
    SpreadsheetApp.getUi().alert("No loans recorded in the Loans sheet yet.\n\nAdd loans manually to the '" + CONFIG.SHEET_LOANS + "' sheet.");
    return;
  }
  ss.setActiveSheet(sheet);
}

// ─── REPORTS ─────────────────────────────────────────────────
function promptMemberStatement() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt("Member Statement", "Enter member name or ID:", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var query = resp.getResponseText().trim();
  if (!query) return;

  var data = _getTransactions();
  var matches = data.filter(function (row) { return _rowMatchesQuery(row, query); });

  if (matches.length === 0) {
    ui.alert("No records found for: " + query);
    return;
  }

  var name = matches[0][1] || query;
  var rows = ["<b>SACCO Member Statement</b><br><b>Member: " + name + "</b><br>Generated: " + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd MMM yyyy") + "<br><br>"];

  rows.push("<table style='font-size:12px;border-collapse:collapse;width:100%'>");
  rows.push("<tr style='background:#1a73e8;color:white'><th style='padding:4px 8px'>Date</th><th style='padding:4px 8px'>Type</th><th style='padding:4px 8px'>Method</th><th style='padding:4px 8px'>Ref</th><th style='padding:4px 8px;text-align:right'>Amount (KES)</th></tr>");

  var total = 0;
  matches.forEach(function (row, i) {
    var bg = i % 2 === 0 ? "#f0f4ff" : "#ffffff";
    var amount = parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0;
    total += amount;
    rows.push(
      "<tr style='background:" + bg + "'>" +
      "<td style='padding:3px 8px'>" + (row[9] || "") + "</td>" +
      "<td style='padding:3px 8px'>" + (row[5] || "") + "</td>" +
      "<td style='padding:3px 8px'>" + (row[7] || "") + "</td>" +
      "<td style='padding:3px 8px'>" + (row[8] || "") + "</td>" +
      "<td style='padding:3px 8px;text-align:right'>" + _fmt(amount) + "</td>" +
      "</tr>"
    );
  });

  rows.push("<tr style='background:#e8f0fe;font-weight:bold'><td colspan='4' style='padding:4px 8px'>TOTAL</td><td style='padding:4px 8px;text-align:right'>" + _fmt(total) + "</td></tr>");
  rows.push("</table>");

  var html = HtmlService.createHtmlOutput(rows.join("")).setWidth(580).setHeight(480);
  ui.showModalDialog(html, "Statement – " + name);
}

function promptAreaReport() {
  var ui = SpreadsheetApp.getUi();
  var resp = ui.prompt("Branch / Area Report", "Enter branch/area name (or leave blank for all):", ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var area = resp.getResponseText().trim();

  var data = _getTransactions();
  var filtered = area
    ? data.filter(function (row) { return String(row[3] || "").toLowerCase().indexOf(area.toLowerCase()) !== -1; })
    : data;

  if (filtered.length === 0) {
    ui.alert("No records found" + (area ? " for area: " + area : "") + ".");
    return;
  }

  var byArea = {};
  filtered.forEach(function (row) {
    var a = row[3] || "Unknown";
    var amount = parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0;
    if (!byArea[a]) byArea[a] = { total: 0, count: 0, members: {} };
    byArea[a].total += amount;
    byArea[a].count++;
    byArea[a].members[row[1]] = true;
  });

  var lines = ["<b>Branch / Area Report</b>" + (area ? " — " + area : " — All Branches") + "<br><br>"];
  lines.push("<table style='font-size:12px;border-collapse:collapse'>");
  lines.push("<tr style='background:#1a73e8;color:white'><th style='padding:4px 8px'>Branch/Area</th><th style='padding:4px 8px'>Members</th><th style='padding:4px 8px'>Transactions</th><th style='padding:4px 8px;text-align:right'>Total (KES)</th></tr>");
  Object.keys(byArea).sort().forEach(function (a, i) {
    var d = byArea[a];
    var bg = i % 2 === 0 ? "#f0f4ff" : "#ffffff";
    lines.push("<tr style='background:" + bg + "'><td style='padding:3px 8px'>" + a + "</td><td style='padding:3px 8px;text-align:center'>" + Object.keys(d.members).length + "</td><td style='padding:3px 8px;text-align:center'>" + d.count + "</td><td style='padding:3px 8px;text-align:right'>" + _fmt(d.total) + "</td></tr>");
  });
  lines.push("</table>");

  var html = HtmlService.createHtmlOutput(lines.join("")).setWidth(480).setHeight(380);
  ui.showModalDialog(html, "Area Report");
}

function promptMonthlySummary() {
  var data = _getTransactions();
  if (data.length === 0) {
    SpreadsheetApp.getUi().alert("No transactions recorded yet.");
    return;
  }

  var byMonth = {};
  data.forEach(function (row) {
    var dateStr = String(row[9] || row[0] || "");
    var month = dateStr.substring(0, 7) || "Unknown";
    var amount = parseFloat(String(row[6]).replace(/[^0-9.]/g, "")) || 0;
    if (!byMonth[month]) byMonth[month] = { total: 0, count: 0 };
    byMonth[month].total += amount;
    byMonth[month].count++;
  });

  var lines = ["<b>Monthly Summary</b><br><br>"];
  lines.push("<table style='font-size:12px;border-collapse:collapse'>");
  lines.push("<tr style='background:#1a73e8;color:white'><th style='padding:4px 8px'>Month</th><th style='padding:4px 8px'>Transactions</th><th style='padding:4px 8px;text-align:right'>Total (KES)</th></tr>");

  var grand = 0;
  Object.keys(byMonth).sort().forEach(function (m, i) {
    var d = byMonth[m];
    grand += d.total;
    var bg = i % 2 === 0 ? "#f0f4ff" : "#ffffff";
    lines.push("<tr style='background:" + bg + "'><td style='padding:3px 8px'>" + m + "</td><td style='padding:3px 8px;text-align:center'>" + d.count + "</td><td style='padding:3px 8px;text-align:right'>" + _fmt(d.total) + "</td></tr>");
  });
  lines.push("<tr style='background:#e8f0fe;font-weight:bold'><td style='padding:4px 8px'>GRAND TOTAL</td><td></td><td style='padding:4px 8px;text-align:right'>" + _fmt(grand) + "</td></tr>");
  lines.push("</table>");

  var html = HtmlService.createHtmlOutput(lines.join("")).setWidth(400).setHeight(380);
  SpreadsheetApp.getUi().showModalDialog(html, "Monthly Summary");
}

// ─── HELPERS ─────────────────────────────────────────────────

// Returns all transaction rows (skipping header).
// Expected columns (0-indexed) from the form response sheet:
//   0: Timestamp, 1: Full Name, 2: Member ID/Phone, 3: Branch/Area,
//   4: Transaction Type (col index may shift — we search flexibly),
//   5: Transaction Type, 6: Amount, 7: Payment Method,
//   8: M-Pesa Ref, 9: Transaction Date, 10: Received By, 11: Notes
function _getTransactions() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SHEET_RESPONSES);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function _rowMatchesQuery(row, query) {
  var q = query.toLowerCase();
  return String(row[1] || "").toLowerCase().indexOf(q) !== -1 ||
         String(row[2] || "").toLowerCase().indexOf(q) !== -1;
}

function _fmt(n) {
  return Number(n.toFixed(2)).toLocaleString("en-KE");
}
