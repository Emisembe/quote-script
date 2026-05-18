# Financial Statements – Google Apps Script

Capture financial transactions via a Google Form and generate
**P&L, Balance Sheet, and Cash Flow** statements for any period —
all inside Google Sheets with zero third-party software.

---

## How It Works

```
Google Form  →  Form Responses sheet  →  Apps Script  →  Statement tabs
 (data entry)     (raw transaction log)    (menu-driven)   (P&L / BS / CF)
```

---

## One-Time Setup (5 minutes)

### Step 1 – Create the Spreadsheet

1. Go to [sheets.new](https://sheets.new) and create a blank spreadsheet.
2. Name it anything (e.g. **"Company Financials 2025"**).

### Step 2 – Open Apps Script

1. Click **Extensions → Apps Script**.
2. Delete the default empty `Code.gs` content.

### Step 3 – Add the Script Files

Copy each `.gs` file from this folder into the Apps Script editor,
**in this order** (create a new file for each via the `+` button → Script):

| File | Purpose |
|---|---|
| `ChartOfAccounts.gs` | Account definitions (edit to customise) |
| `Utils.gs` | Shared helpers, date filtering, formatting |
| `FormSetup.gs` | Creates the Google Form |
| `StatementGenerator.gs` | Generates P&L, Balance Sheet, Cash Flow |
| `Code.gs` | Menu wiring and entry points |

> **Tip:** File order doesn't matter for execution but keeping it logical
> helps when editing later.

### Step 4 – Save and Authorise

1. Click **Save all** (💾).
2. Run any function once (e.g. `onOpen`) — Google will ask for permissions.
3. Accept the permissions (the script only accesses your own spreadsheet and form).

### Step 5 – Create the Form

1. Close the Apps Script tab and return to your spreadsheet.
2. Reload the page — a new **📊 Financial Statements** menu appears.
3. Click **📊 Financial Statements → Setup: Create Data-Entry Form**.
4. The form is created and linked. Its URL is saved in the **Config** tab.

---

## Daily Use

### Entering Transactions

Share the Form URL (from the Config tab) with your team.
Each submission creates a row in **Form Responses 1**.

| Field | What to Enter |
|---|---|
| Transaction Date | Actual date of the transaction |
| Account Type | Broad category (Revenue, COGS, Operating Expense …) |
| Account Name | Specific account from the Chart of Accounts |
| Amount | Positive number, no $ sign |
| Direction | Income/Asset Increase **or** Expense/Asset Decrease |
| Cash Flow Category | Operating / Investing / Financing / Non-cash |
| Vendor or Customer | Optional but useful |
| Reference / Invoice # | Optional |
| Description | Optional notes |

### Generating Statements

Use the **📊 Financial Statements** menu:

- **Generate – This Month** → current calendar month
- **Generate – This Quarter** → current calendar quarter
- **Generate – This Year** → full calendar year
- **Generate – Custom Date Range** → you type start and end dates

Each option has sub-choices:
- **All Three Statements** (recommended) — runs P&L, Balance Sheet, Cash Flow together
- Individual statement options

Results appear as colour-coded tabs: **P&L**, **Balance Sheet**, **Cash Flow**.

---

## Customising the Chart of Accounts

Edit `ChartOfAccounts.gs`. Each entry looks like:

```js
REVENUE: {
  label: 'Revenue',
  codes: ['40100','40200','40300'],
  names: ['Revenue Stream 1','Revenue Stream 2','Revenue Stream 3'],
  section: 'PL',   // 'PL' = Income Statement, 'BS' = Balance Sheet
  group:  'Revenue'
},
```

Add new codes/names to any category, or add entirely new categories.
After editing, run **Setup: Create Data-Entry Form** again to regenerate
the form with the updated account list.

---

## Financial Statement Logic

### P&L (Income Statement)
```
Revenue
− Cost of Goods Sold
= Gross Profit
− Operating Expenses
= Net Operating Income
± Other Income / Other Expenses
= Net Income
```

### Balance Sheet
- Uses **all transactions up to the end date** (not just the period).
- Assets = Liabilities + Equity.
- Retained Earnings for the period = Net Income from P&L.
- A ✓ or ⚠ message confirms whether it balances.

### Cash Flow Statement
- **Operating**: Net Income + items tagged "Operating Activities".
- **Investing**: Items tagged "Investing Activities".
- **Financing**: Items tagged "Financing Activities".
- Fill in **Beginning Cash Balance** manually in the sheet.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Menu doesn't appear | Reload the spreadsheet; re-run `onOpen` from Apps Script |
| "Form Responses sheet not found" | Run Setup to create and link the form first |
| Balance Sheet doesn't balance | Check that opening balances for assets/liabilities were entered |
| Negative totals on P&L | Check the Direction field — expenses should be "Expense / Asset Decrease" |
| Amounts show as 0 | Ensure Amount field contains only numbers (no $ or commas) |
