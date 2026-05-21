# Complete Guide
# Financial Statements & Budget System
## Google Sheets + Apps Script

---

> **Who this guide is for**
> Anyone — business owner, finance manager, bookkeeper, or team member — who
> needs to record financial transactions, produce professional financial
> statements, track a budget, and plan for the next year. No accounting
> software or programming knowledge required.

---

## Contents

**Part 1 — Understanding the System**
1. What the system is and what it does
2. How all the pieces connect
3. What files you need and where to get them

**Part 2 — One-Time Setup**
4. Creating your Google Sheet
5. Adding the scripts
6. Creating the data-entry form

**Part 3 — Recording Transactions**
7. How to fill in the Google Form
8. How to paste data from another source
9. Transaction examples

**Part 4 — Generating Financial Statements**
10. Using the menu
11. Typing your period (month, quarter, year, custom)
12. Choosing your data sheet
13. The Profit & Loss Statement explained
14. The Balance Sheet explained
15. The Cash Flow Statement explained
16. The Financial Health Ratios explained

**Part 5 — Budget**
17. Creating a budget template
18. Filling in your budget figures
19. Budget vs Actual report
20. Planning next year's budget from last year's actuals
21. Exporting a budget document

**Part 6 — Reference**
22. Chart of Accounts — full list
23. Adding or changing accounts
24. Month-end and year-end routine
25. Troubleshooting
26. Glossary

---

# PART 1 — UNDERSTANDING THE SYSTEM

---

## 1. What the System Is and What It Does

This system turns Google Sheets into a complete financial reporting tool.
You enter transactions — one at a time through a form, or by pasting a
batch from any other system — and then use a menu inside the spreadsheet
to produce:

| Report | What it shows |
|---|---|
| **Profit & Loss (P&L)** | Income, costs, and profit or loss over any period |
| **Balance Sheet** | Everything owned, owed, and the owners' net stake — as of any date |
| **Cash Flow Statement** | Where money actually moved — operating, investing, financing |
| **Financial Health Ratios** | 19 ratios that diagnose business health with traffic-light indicators |
| **Budget vs Actual** | How actual spending compares to targets, with variance analysis |
| **Budget Plan** | Next year's budget built from last year's real numbers |
| **Budget Document** | A formatted Google Doc ready to share with stakeholders or a board |

Everything runs inside Google Sheets. There is no subscription, no
third-party app, and no data leaving your Google account.

---

## 2. How All the Pieces Connect

```
┌──────────────────────────────────────────────────────────────┐
│                     YOUR GOOGLE SHEET                        │
│                                                              │
│  ┌─────────────────┐    ┌──────────────────────────────────┐ │
│  │  Data Sheet(s)  │    │  📊 Financial Statements Menu    │ │
│  │                 │    │                                  │ │
│  │  Transactions   │───▶│  Type any period + sheet name   │ │
│  │  (from form,    │    │  ↓                               │ │
│  │  paste, import) │    │  P&L | Balance Sheet | Cash Flow │ │
│  └─────────────────┘    │  Ratios | Budget vs Actual       │ │
│                         │  Budget Plan | Budget Doc        │ │
│  ┌─────────────────┐    └──────────────────────────────────┘ │
│  │  Budget Sheet   │                                         │
│  │  (your targets) │───▶  Budget vs Actual Report           │
│  └─────────────────┘                                         │
└──────────────────────────────────────────────────────────────┘
                │
                │ Export
                ▼
        Google Doc (Budget Document)
```

The system reads whatever sheet you point it at. It does not care what
the sheet is called or how the data arrived there — as long as the columns
match the expected structure (explained in Part 3).

---

## 3. What Files You Need

Six script files power the system. They live in the `financial-statements/`
folder of the repository:

| File | What it does |
|---|---|
| `ChartOfAccounts.gs` | Defines all account names and categories |
| `Utils.gs` | Shared tools — date filtering, number formatting, sheet helpers |
| `FormSetup.gs` | Creates the Google Form for data entry |
| `StatementGenerator.gs` | Generates P&L, Balance Sheet, Cash Flow |
| `RatiosGenerator.gs` | Calculates and displays 19 financial health ratios |
| `PeriodParser.gs` | Handles the natural-language period input and sheet picker |
| `BudgetGenerator.gs` | Budget template and Budget vs Actual report |
| `BudgetPlanner.gs` | Budget planning from last year's actuals + Google Doc export |
| `Code.gs` | Wires everything into the menu |

---

# PART 2 — ONE-TIME SETUP

---

## 4. Creating Your Google Sheet

1. Open a browser and go to **sheets.new** — this creates a blank spreadsheet instantly.
2. Click the title at the top left (it says "Untitled spreadsheet") and rename it.
   Use something like **"ABC Company — Financials 2025"**.
3. Keep this tab open — you will return to it after adding the scripts.

---

## 5. Adding the Scripts

### Open the script editor

1. In your spreadsheet, click the menu bar item **Extensions**.
2. Click **Apps Script**.
3. A new browser tab opens. On the left you see a file called `Code.gs` with
   some default text inside. **Select all that text and delete it** — you will
   replace it with the correct code.

### Add each file

For each of the nine `.gs` files listed in section 3, do the following:

1. Click the **+** button next to "Files" in the left sidebar.
2. Select **Script**.
3. Type the file name exactly (without `.gs` — Apps Script adds that
   automatically). For example: `ChartOfAccounts`
4. Open the corresponding `.gs` file from the repository.
5. Copy all of its contents.
6. Paste it into the new file in the Apps Script editor.
7. Press **Ctrl+S** (Windows) or **Cmd+S** (Mac) to save.

Repeat for all nine files. The file named `Code` already exists — paste
the `Code.gs` contents into that one rather than creating a new file.

> **File order does not matter** for how the code runs. Organising them
> in the order listed is simply easier for reading later.

### Authorise the script

1. In the Apps Script editor, click the **Run** button (▶) at the top.
2. A dropdown appears — select `onOpen` and click Run.
3. A pop-up says **"Authorisation required"** — click **Review permissions**.
4. Select your Google account.
5. You may see a warning: "Google hasn't verified this app." This is normal
   for personal scripts. Click **Advanced**, then **Go to [project name] (unsafe)**.
6. Click **Allow**.

The script now has permission to access your spreadsheet and create forms.

### Verify the menu appears

1. Close the Apps Script tab.
2. Go back to your spreadsheet tab and **reload the page** (press F5).
3. Look at the menu bar — a new item called **📊 Financial Statements**
   should appear between "Help" and the last menu item.

If it does not appear, go back to Apps Script and run `onOpen` manually
from the function dropdown.

---

## 6. Creating the Data-Entry Form

> **Skip this step if you are going to paste data directly into a sheet.**
> The form is only needed if you want people to enter transactions one
> at a time through a web link.

1. In your spreadsheet, click **📊 Financial Statements**.
2. Click **Setup: Create Data-Entry Form**.
3. A confirmation message appears with the form's web address (URL).
4. That URL is also saved in a new **Config** tab in your spreadsheet.
5. Share the URL with anyone on your team who needs to enter transactions.

Every time someone submits the form, a new row appears in a sheet called
**Form Responses 1** — this is the data the system reads.

---

# PART 3 — RECORDING TRANSACTIONS

---

## 7. How to Fill In the Google Form

The form has ten fields. Here is what each one means:

### Transaction Date
The date the transaction actually happened. This is the date used for
filtering by period — not the date you are filling in the form.

### Account Type
The broad financial category. Choose the one that best describes the
transaction:

| Account Type | Use it for |
|---|---|
| Revenue | Sales income, service fees, subscriptions |
| Cost of Goods Sold | Direct costs of producing what you sell |
| Operating Expenses | Day-to-day running costs — rent, salaries, marketing |
| Other Income | Interest earned, one-off gains not from core business |
| Other Expenses | Depreciation, interest paid on loans |
| Current Assets | Cash, money owed to you, prepaid items |
| Fixed Assets | Equipment, furniture, computers you purchased |
| Long Term Assets | Long-term investments |
| Current Liabilities | Bills you owe within the next 12 months |
| Long Term Liabilities | Loans and debts due beyond 12 months |
| Equity | Capital put in by owners |

### Account Name
The specific account within that category — for example, under
"Operating Expenses" you might choose "Rent & Lease" or "Accounting Fees".
If the account you need is not listed, choose **"Other (specify below)"**
and type the name in the next field.

### Amount
A positive number only. Do not include a currency symbol (£, $, €) or
commas. For example: `1200` or `4500.50`

### Direction
This tells the system whether the transaction increases or decreases
your financial position:

| Choose this | When |
|---|---|
| Income / Asset Increase / Liability Decrease / Equity Increase | Money comes IN — a sale, a loan received, an asset purchase, owner putting money in |
| Expense / Asset Decrease / Liability Increase / Equity Decrease | Money goes OUT — a cost, a payment, taking on a new debt |

**Simple rule:** money arriving → "Income / Asset Increase". Money leaving → "Expense / Asset Decrease".

### Cash Flow Category
Tags the transaction for the Cash Flow Statement:

| Category | Typical examples |
|---|---|
| Operating Activities | Sales collected, wages paid, supplier bills, rent |
| Investing Activities | Buying or selling equipment, computers, property |
| Financing Activities | Bank loans received or repaid, owner investments, dividends |
| Not a cash transaction | Depreciation, accruals — affects accounts but no cash moves |

### Vendor or Customer Name *(optional)*
Who you paid, or who paid you. Useful for reviewing transactions later.

### Reference / Invoice Number *(optional)*
The invoice number, receipt number, or bank reference. Helps match
transactions against bank statements.

### Description / Notes *(optional)*
Any extra context that is not captured by the other fields.

---

## 8. How to Paste Data from Another Source

If your data comes from a bank export, accounting software, Excel, or
any other system, you can paste it directly into a sheet.

### Required column structure

Your data sheet must have columns in this exact order:

| Column | Header name (can be anything) | What goes here |
|---|---|---|
| A | Timestamp | Any value — can be left blank |
| B | Transaction Date | Date of the transaction |
| C | Account Type | One of the Account Type labels from section 7 |
| D | Account Name | The specific account name |
| E | Account Name (Other) | Only if column D is "Other (specify below)" |
| F | Amount | Positive number, no currency symbol |
| G | Direction | Exactly as shown in section 7 |
| H | Cash Flow Category | Exactly as shown in section 7 |
| I | Vendor / Customer | Optional |
| J | Reference | Optional |
| K | Description | Optional |

> **Row 1 must be headers.** Data starts from row 2.
> The header names can be anything — the system reads by column
> position, not by header name.

### Steps to paste data

1. Open your spreadsheet.
2. Create a new sheet (click the **+** button at the bottom left).
3. Name the sheet clearly — for example: `Sales Jan 2025` or `Bank Export Q1`.
4. Paste your data starting from cell A1, with headers in row 1.
5. Make sure the columns match the order above.
6. When you generate statements, the system will ask you to type this
   sheet name so it knows where to look.

---

## 9. Transaction Examples

### Example 1 — Customer pays an invoice: £8,500

| Field | Value |
|---|---|
| Transaction Date | 2025-03-15 |
| Account Type | Revenue |
| Account Name | Revenue Stream 1 |
| Amount | 8500 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Operating Activities |
| Vendor or Customer | Acme Ltd |
| Reference | INV-2025-042 |

### Example 2 — Monthly rent paid: £1,200

| Field | Value |
|---|---|
| Transaction Date | 2025-03-01 |
| Account Type | Operating Expenses |
| Account Name | Rent & Lease |
| Amount | 1200 |
| Direction | Expense / Asset Decrease… |
| Cash Flow Category | Operating Activities |
| Vendor or Customer | Property Holdings Ltd |

### Example 3 — New laptop purchased: £1,800

| Field | Value |
|---|---|
| Transaction Date | 2025-02-18 |
| Account Type | Fixed Assets |
| Account Name | Computers |
| Amount | 1800 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Investing Activities |
| Description | MacBook for new team member |

### Example 4 — Bank loan received: £20,000

| Field | Value |
|---|---|
| Transaction Date | 2025-01-10 |
| Account Type | Long Term Liabilities |
| Account Name | Principal |
| Amount | 20000 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Financing Activities |
| Vendor or Customer | Barclays |

### Example 5 — Monthly depreciation: £300 (non-cash)

| Field | Value |
|---|---|
| Transaction Date | 2025-03-31 |
| Account Type | Other Expenses |
| Account Name | Depreciation Expense |
| Amount | 300 |
| Direction | Expense / Asset Decrease… |
| Cash Flow Category | Not a cash transaction |

---

# PART 4 — GENERATING FINANCIAL STATEMENTS

---

## 10. Using the Menu

Click **📊 Financial Statements** in the spreadsheet menu bar. The full
menu looks like this:

```
📊 Financial Statements
│
├── 🛠  Setup: Create Data-Entry Form
│
├── 📊 Generate All Statements…          ← type any period + sheet name
├──      P&L Statement…
├──      Balance Sheet…
├──      Cash Flow Statement…
├── 📈 Health Ratios…
│
├── ⚡ Quick – This Month
│   ├── All Statements
│   ├── P&L Only
│   ├── Balance Sheet
│   ├── Cash Flow
│   └── Health Ratios
├── ⚡ Quick – This Quarter   (same sub-options)
├── ⚡ Quick – This Year      (same sub-options)
│
├── 💰 Budget
│   ├── 1. Create Budget Template
│   ├── 2. Generate Budget vs Actual Report
│   ├── ─────────────────────────────────
│   ├── 3. Create Budget Plan from Last Year
│   └── 4. Export Budget Plan to Google Doc
│
├── 📋 View Chart of Accounts
└── ℹ️  Help & Instructions
```

**Best starting point:** Click **Generate All Statements…** — this runs
the P&L, Balance Sheet, Cash Flow, and Health Ratios all at once,
and the numbers link to each other correctly.

---

## 11. Typing Your Period

When you click any of the main Generate items, a box appears asking
for the period. Type it in plain language:

| What you type | Period produced |
|---|---|
| `Q1 2025` | 1 Jan 2025 – 31 Mar 2025 |
| `Q2 2024` | 1 Apr 2024 – 30 Jun 2024 |
| `Q3` | Q3 of the current year |
| `Q4` | Q4 of the current year |
| `H1 2025` | 1 Jan 2025 – 30 Jun 2025 |
| `H2 2024` | 1 Jul 2024 – 31 Dec 2024 |
| `January 2025` | 1 Jan 2025 – 31 Jan 2025 |
| `March` | March of the current year |
| `Feb 2024` | February 2024 |
| `2024` | Full calendar year 2024 |
| `2025` | Full calendar year 2025 |
| `last month` | The previous calendar month |
| `last quarter` | The previous calendar quarter |
| `last year` | The previous calendar year |
| `this month` | The current calendar month |
| `this quarter` | The current calendar quarter |
| `this year` | The current calendar year |
| `Jan to Mar 2025` | 1 Jan 2025 – 31 Mar 2025 |
| `January 2024 to June 2024` | 1 Jan 2024 – 30 Jun 2024 |
| `Q1 to Q3 2024` | 1 Jan 2024 – 30 Sep 2024 |
| `2025-01-01 to 2025-06-30` | Exact dates |

If the system cannot understand what you typed, it shows examples and
asks you to try again.

---

## 12. Choosing Your Data Sheet

After the period prompt, or sometimes before it, the system shows a list
of all sheets in your spreadsheet and asks you to type the name of the one
containing your data. Type it exactly as shown — sheet names are
**case-sensitive**.

This means the system works with any sheet, regardless of what it is
called or how the data got there.

---

## 13. The Profit & Loss Statement Explained

The P&L tab is refreshed every time you generate it. It shows how the
business performed over the period you chose.

```
PROFIT & LOSS STATEMENT
01 Jan 2025 – 31 Mar 2025

REVENUE
    Revenue Stream 1                        8,500.00
    Revenue Stream 2                        3,200.00
Total Revenue                              11,700.00

COST OF GOODS SOLD
    Web Domain & Hosting Fees                 320.00
Total COGS                                    320.00

GROSS PROFIT                               11,380.00
    Gross Margin                               97.3%

OPERATING EXPENSES
    Rent & Lease                            3,600.00
    Advertising & Marketing                 1,200.00
Total Operating Expenses                    4,800.00

NET OPERATING INCOME                        6,580.00

OTHER INCOME & EXPENSES
    Depreciation Expense                     -450.00
Net Other Income                             -450.00

NET INCOME                                  6,130.00
```

| Line | What it means |
|---|---|
| Total Revenue | All income from core business activities |
| Total COGS | Direct costs of delivering that revenue |
| Gross Profit | Revenue minus COGS |
| Gross Margin % | Gross Profit as a percentage of Revenue |
| Total Operating Expenses | All overhead costs |
| Net Operating Income | Profit from operations before non-operating items |
| Net Income | The final bottom line — green means profit, red means loss |

---

## 14. The Balance Sheet Explained

The Balance Sheet is always calculated as of the **end date** you chose.
It uses all transactions ever entered, not just the period — because
balances accumulate over time.

The fundamental rule that must always hold:

> **Total Assets = Total Liabilities + Total Equity**

The sheet shows a ✓ or ⚠ at the bottom telling you whether it balances.
A ⚠ usually means opening balances (cash, a loan, capital) have not
been entered yet.

**Assets** — everything the business owns or is owed:
- *Current Assets*: cash, money owed by customers, prepaid items
- *Fixed Assets*: equipment, furniture, computers
- *Long Term Assets*: long-term investments

**Liabilities** — everything the business owes to others:
- *Current Liabilities*: bills due within 12 months
- *Long Term Liabilities*: loans due beyond 12 months

**Equity** — what belongs to the owners after all debts are paid:
- Capital contributed by owners
- Retained Earnings — accumulated profits kept in the business

---

## 15. The Cash Flow Statement Explained

The Cash Flow Statement answers a question the P&L cannot: **where did
the money actually go?** A business can show a profit on the P&L but
still run out of cash. This statement bridges that gap.

Three sections:

| Section | What it includes |
|---|---|
| **Cash from Operating Activities** | Day-to-day cash — collecting from customers, paying suppliers and staff |
| **Cash from Investing Activities** | Buying or selling long-term assets |
| **Cash from Financing Activities** | Borrowing money, repaying loans, owner investments, dividends |

At the bottom:
- **Net Change in Cash** = Operating + Investing + Financing
- **Beginning Cash Balance** — type this manually from your previous
  period's balance or bank statement
- **Ending Cash Balance** = Beginning + Net Change

The Ending Cash should match the Cash line on your Balance Sheet.

---

## 16. The Financial Health Ratios Explained

The Financial Ratios tab runs alongside the three statements and produces
19 ratios in five categories, each with a colour-coded status:

| Colour | Status | Meaning |
|---|---|---|
| Dark green | ✓ Healthy | Within a strong range |
| Dark amber | ! Watch | Borderline — monitor it |
| Dark red | ✗ Concern | Outside healthy norms — investigate |

**Category 1 — Liquidity** (can we pay our short-term bills?)
- Current Ratio, Quick Ratio, Cash Ratio, Net Working Capital

**Category 2 — Profitability** (are we making money efficiently?)
- Gross/Net/Operating Margin, EBITDA Margin, Return on Assets, Return on Equity

**Category 3 — Leverage & Solvency** (how much debt do we carry?)
- Debt-to-Equity, Debt-to-Assets, Equity Multiplier, Debt-to-Capitalisation

**Category 4 — Efficiency** (are we using our assets well?)
- Asset Turnover, Revenue per £ of Equity

**Category 5 — Cash Flow** (is our profit backed by real cash?)
- Operating CF to Sales, Free Cash Flow, Cash Flow Coverage

A **scorecard** at the bottom shows the percentage of ratios that are
healthy and an overall verdict.

> **Hover over any ratio name** in the sheet to see a one-line explanation
> of what it measures.

Benchmarks are general guidelines. Compare your ratios against others
in your specific industry for the most meaningful picture.

---

# PART 5 — BUDGET

---

## 17. Creating a Budget Template

**📊 Financial Statements → 💰 Budget → 1. Create Budget Template**

1. You are asked for the year (e.g. `2025`).
2. A sheet called **"Budget 2025"** is created with every account from
   your Chart of Accounts already listed.
3. Yellow cells are where you type your target figures — one annual
   total per account.
4. Leave any account at `0` if you are not budgeting for it.

---

## 18. Filling In Your Budget Figures

Simply click on any yellow cell in the Budget sheet and type a number.
The subtotals update automatically.

You can also paste figures from Excel or another system — just make sure
the amounts land in the correct yellow cells in column C.

---

## 19. Budget vs Actual Report

**📊 Financial Statements → 💰 Budget → 2. Generate Budget vs Actual Report**

The system asks:
1. The name of your Budget sheet (e.g. `Budget 2025`)
2. The name of your actuals data sheet
3. The period (type `Q1 2025`, `January 2025`, `2025`, etc.)

The **Budget vs Actual** tab then shows every account side by side:

```
Account              Annual Budget    Actual       Variance      Var %    Status
─────────────────────────────────────────────────────────────────────────────────
REVENUE
    Revenue Stream 1     50,000.00    43,200.00    -6,800.00    -13.6%   ✗ Under
    Revenue Stream 2     30,000.00    33,500.00    +3,500.00    +11.7%   ↑ Above
Total Revenue            80,000.00    76,700.00    -3,300.00     -4.1%

OPERATING EXPENSES
    Rent & Lease          3,600.00     3,600.00         0.00      0.0%   ✓ On target
    Advertising           5,000.00     7,200.00    +2,200.00    +44.0%   ✗ Over
─────────────────────────────────────────────────────────────────────────────────
NET INCOME               25,000.00    21,400.00    -3,600.00    -14.4%

✗ Behind — Net Income -3,600.00 vs budget (-14.4%)
```

**Colour coding:**
- Revenue: green = actual above budget, red = actual below budget
- Expenses: green = actual below budget (underspend), red = actual above budget (overspend)

---

## 20. Planning Next Year's Budget from Last Year's Actuals

This is the most powerful budget tool in the system.

**📊 Financial Statements → 💰 Budget → 3. Create Budget Plan from Last Year**

### What it asks
1. Which sheet contains last year's transaction data
2. Which year that data covers (e.g. `2024`)

### What it creates
A sheet called **"Budget Plan 2025"** (or whatever year comes next) with:

- **Column C — Last Year Actual**: pulled automatically from your data
- **Column D — % Change**: yellow cell you can edit. Type a number:
  - `10` means budget 10% more than last year
  - `-5` means budget 5% less (a cost cut)
  - `0` means same as last year
- **Column E — Proposed Budget**: calculated automatically from Actual × (1 + % Change)
- **Column F — Change £**: the monetary difference
- **Column G — Notes & Assumptions**: blue cell — type your reasoning

### How to use it
1. Open the Budget Plan sheet.
2. Review each account. For each one, decide whether you expect it to be
   higher, lower, or the same as last year.
3. Type your % change in the yellow cell. The proposed budget updates live.
4. Add a note explaining why — for example: "Rent increase agreed at 8%"
   or "Reducing marketing spend by 15% as brand is established".
5. Review the Net Income Summary at the bottom to see the projected outcome.
6. Adjust until the projected net income meets your targets.

---

## 21. Exporting a Budget Document

Once the planner sheet looks right, export it as a formal document.

**📊 Financial Statements → 💰 Budget → 4. Export Budget Plan to Google Doc**

### What it asks
1. Which Budget Plan sheet to export
2. Your organisation or business name

### What it produces
A Google Doc saved to your Google Drive containing:

**Page 1 — Cover page**
- Organisation name, budget year, date prepared
- "Based on [year] Actual Results"

**Page 2 — Budget Detail**
- Full table: every account with Last Year Actual, Proposed Budget,
  Change amount, and Notes

**Page 3 — Key Assumptions**
- All the notes you typed in the blue cells, compiled into a readable list
- If no notes were added, a placeholder reminds you to add them

**Page 4 — Approval Section**
- Signature lines for Prepared by, Reviewed by, and Approved by

### After export
The document URL is saved in the **Config** tab of your spreadsheet.
You can share it, print it, or present it directly from Google Docs.

> **Tip:** Fill in all the Notes cells before exporting. The Key Assumptions
> page is what makes the document useful for discussion — empty notes
> produce an empty page.

---

# PART 6 — REFERENCE

---

## 22. Chart of Accounts — Full List

### Income Statement Accounts

**Revenue (Account Type: Revenue)**
| Code | Account Name |
|---|---|
| 40100 | Revenue Stream 1 |
| 40200 | Revenue Stream 2 |
| 40300 | Revenue Stream 3 |

**Cost of Goods Sold (Account Type: Cost of Goods Sold)**
| Code | Account Name |
|---|---|
| 50100 | Web Domain & Hosting Fees |
| 50200 | Merchant Account Fees |

**Operating Expenses (Account Type: Operating Expenses)**
| Code | Account Name |
|---|---|
| 60100 | Advertising & Marketing |
| 60200 | Bank Charges & Fees |
| 60300 | Insurance |
| 60410 | Office Supplies & Software |
| 60420 | Rent & Lease |
| 60510 | Accounting Fees |
| 60520 | Consulting Fees |

**Other Income (Account Type: Other Income)**
| Code | Account Name |
|---|---|
| 70100 | Interest Income |
| 70200 | Other Income |

**Other Expenses (Account Type: Other Expenses)**
| Code | Account Name |
|---|---|
| 80100 | Depreciation Expense |
| 80200 | Interest Expense |

### Balance Sheet Accounts

**Current Assets**
| Code | Account Name |
|---|---|
| 10100 | Cash |
| 10200 | Accounts Receivable |
| 10310 | Prepaid Expenses |
| 10320 | Security Deposit |
| 10330 | Due to/from Officers |

**Fixed Assets**
| Code | Account Name |
|---|---|
| 10410 | Computers |
| 10420 | Furniture |
| 10430 | Equipment |
| 10440 | Accumulated Depreciation |

**Long Term Assets**
| Code | Account Name |
|---|---|
| 10500 | Long Term Investments |

**Current Liabilities**
| Code | Account Name |
|---|---|
| 20100 | Accounts Payable |
| 20310 | Accrued Expenses |
| 20320 | Accrued Payroll |

**Long Term Liabilities**
| Code | Account Name |
|---|---|
| 20410 | Convertible Notes |
| 20411 | Principal |
| 20412 | Accrued Interest |

**Equity**
| Code | Account Name |
|---|---|
| 30100 | Common Stock |
| 30200 | Preferred Stock |
| 30300 | Additional Paid in Capital |
| 30400 | Retained Earnings |

---

## 23. Adding or Changing Accounts

Open `ChartOfAccounts.gs` in the Apps Script editor.

### Add an account to an existing category

Find the category block and add a new code and name:

```javascript
REVENUE: {
  codes: ['40100', '40200', '40300', '40400'],
  names: ['Revenue Stream 1', 'Revenue Stream 2', 'Revenue Stream 3', 'Product Sales'],
  ...
}
```

Codes and names must stay in the same order — the first code matches
the first name, and so on.

### Add an entirely new category

Copy an existing block and change all the values:

```javascript
GRANT_INCOME: {
  label: 'Grant Income',
  codes: ['75100', '75200'],
  names: ['Government Grant', 'Foundation Grant'],
  section: 'PL',         // PL = Income Statement, BS = Balance Sheet
  group:  'OtherIncome'
},
```

### After making changes

Save the file in Apps Script, then run
**📊 Financial Statements → Setup: Create Data-Entry Form** again to
regenerate the form with the updated account list.

---

## 24. Month-End and Year-End Routine

### During the month
- Enter transactions as they happen, or at least weekly.
- Use the Description and Reference fields — they save time when reviewing.

### At month-end
1. Check your data sheet — are there any missing transactions?
2. Enter any end-of-month adjustments (depreciation, accruals) tagged as
   "Not a cash transaction" in the Cash Flow Category field.
3. Click **Generate All Statements…** → type `last month`.
4. Check the P&L net income looks right.
5. Check the Balance Sheet shows ✓ balanced.
6. Fill in the Beginning Cash Balance on the Cash Flow tab.
7. **Duplicate all four tabs** before next month to preserve the record:
   right-click each tab → Duplicate → rename to e.g. "P&L Jan 2025".

### At year-end
1. Click **Generate All Statements…** → type `last year`.
2. Review the Health Ratios scorecard — note any ✗ Concern areas.
3. Run **Create Budget Plan from Last Year** to start planning the new year.
4. Save a copy of the full spreadsheet: **File → Make a copy**.
5. Share the P&L, Balance Sheet, and Cash Flow tabs with your accountant.

---

## 25. Troubleshooting

| Problem | Solution |
|---|---|
| The 📊 Financial Statements menu does not appear | Reload the spreadsheet (F5). If still missing, open Apps Script and run `onOpen` manually. |
| "Sheet not found" error | Check the spelling of the sheet name — it is case-sensitive. |
| Balance Sheet shows ⚠ out of balance | Enter opening balances for any assets or liabilities that existed before you started using this system. |
| All amounts show as 0 | Check the Amount column contains only numbers — no £, $, commas, or spaces. |
| Negative totals on the P&L | Check the Direction field — expenses must use "Expense / Asset Decrease…" not "Income / Asset Increase…". |
| Health Ratios show all N/A | No transactions found for the period. Check the date range and sheet name. |
| Budget vs Actual shows no rows | Make sure the account names in the Budget sheet exactly match the account names in the transaction data. |
| "Authorisation required" appears again | The script's permissions were revoked. Re-authorise by running any function from the Apps Script editor. |
| Google Doc export produces blank assumption page | Add notes to the blue Notes cells in the Budget Plan sheet, then re-export. |
| Period not understood | Use the formats in the table in section 11. The system does not understand phrases like "first half" — use "H1 2025" instead. |

---

## 26. Glossary

| Term | Plain-English meaning |
|---|---|
| **Revenue** | Money earned from your core business activity |
| **COGS** | Direct costs of producing what you sell |
| **Gross Profit** | Revenue minus COGS |
| **Gross Margin** | Gross Profit as a percentage of Revenue |
| **Operating Expenses (OpEx)** | Overhead costs — rent, salaries, marketing |
| **Net Operating Income** | Profit from operations before interest, depreciation, other items |
| **Net Income** | Final profit or loss after everything |
| **Assets** | Everything the business owns or is owed |
| **Current Assets** | Assets convertible to cash within 12 months |
| **Fixed Assets** | Long-lived physical assets |
| **Liabilities** | Everything the business owes |
| **Current Liabilities** | Debts due within 12 months |
| **Long Term Liabilities** | Debts due beyond 12 months |
| **Equity** | Owners' stake = Assets minus Liabilities |
| **Retained Earnings** | Accumulated profits kept in the business |
| **Accounts Receivable** | Money customers owe you |
| **Accounts Payable** | Money you owe suppliers |
| **Depreciation** | Spreading an asset's cost over its useful life — non-cash |
| **Accrual** | Recording income or expense when earned, not when cash moves |
| **Cash Flow** | Actual movement of cash in and out |
| **Operating Activities** | Day-to-day cash movements |
| **Investing Activities** | Cash from buying or selling long-term assets |
| **Financing Activities** | Cash from owners and lenders, or returned to them |
| **Chart of Accounts** | Master list of all account names in the system |
| **P&L** | Profit & Loss Statement — also called the Income Statement |
| **Balance Sheet** | Snapshot of assets, liabilities, and equity at a point in time |
| **Current Ratio** | Current Assets ÷ Current Liabilities — measures short-term solvency |
| **Debt-to-Equity** | Total Liabilities ÷ Total Equity — measures leverage |
| **ROE** | Return on Equity — net income as a % of owners' investment |
| **ROA** | Return on Assets — net income as a % of total assets |
| **EBITDA** | Earnings before interest, tax, depreciation, amortisation |
| **Free Cash Flow** | Operating cash flow minus capital expenditure |
| **Variance** | The difference between budgeted and actual amounts |
| **Apps Script** | Google's built-in scripting tool that powers this system |
| **Container-bound script** | A script that belongs to one specific spreadsheet |
