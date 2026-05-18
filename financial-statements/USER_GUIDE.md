# Financial Statements System – User Guide

**Who this is for:** Business owners, finance managers, and bookkeepers who want
to record transactions and produce professional financial statements using only
Google Forms and Google Sheets — no accounting software required.

---

## Table of Contents

1. [What the System Does](#1-what-the-system-does)
2. [How It All Connects](#2-how-it-all-connects)
3. [First-Time Setup](#3-first-time-setup)
4. [Understanding the Google Form](#4-understanding-the-google-form)
5. [Recording Transactions — Step by Step](#5-recording-transactions--step-by-step)
6. [Transaction Examples](#6-transaction-examples)
7. [Generating Financial Statements](#7-generating-financial-statements)
8. [Reading the P&L Statement](#8-reading-the-pl-statement)
9. [Reading the Balance Sheet](#9-reading-the-balance-sheet)
10. [Reading the Cash Flow Statement](#10-reading-the-cash-flow-statement)
11. [Reading the Financial Ratios Dashboard](#11-reading-the-financial-ratios-dashboard)
12. [Customising the Chart of Accounts](#12-customising-the-chart-of-accounts)
13. [Month-End and Quarter-End Routine](#13-month-end-and-quarter-end-routine)
14. [Troubleshooting](#14-troubleshooting)
15. [Glossary](#15-glossary)

---

## 1. What the System Does

This system gives any business or organisation three core financial statements:

| Statement | What It Tells You |
|---|---|
| **Profit & Loss (P&L)** | How much you earned and spent over a period — your profit or loss |
| **Balance Sheet** | A snapshot of everything you own (assets), owe (liabilities), and the net worth left for owners (equity) |
| **Cash Flow Statement** | Where cash actually came from and went — operating, investing, and financing |

You enter every transaction once via a simple Google Form. The system then
processes those entries and produces all three statements for any time period
you choose — a single month, a quarter, a full year, or any custom date range.

---

## 2. How It All Connects

```
┌─────────────────────┐
│   Google Form       │  ← Team members enter transactions here
│ (data entry screen) │
└────────┬────────────┘
         │  Responses flow automatically
         ▼
┌─────────────────────┐
│  Google Sheet       │  ← All transactions stored as rows
│  Form Responses tab │
└────────┬────────────┘
         │  Apps Script reads and groups the data
         ▼
┌─────────────────────────────────────────────────────┐
│  📊 Financial Statements menu (inside the sheet)    │
│                                                     │
│  Generate – This Month  →  P&L  |  BS  |  CF       │
│  Generate – This Quarter →  P&L  |  BS  |  CF      │
│  Generate – This Year   →  P&L  |  BS  |  CF       │
│  Generate – Custom Range →  P&L  |  BS  |  CF      │
└─────────────────────────────────────────────────────┘
         │  Results written as colour-coded sheet tabs
         ▼
┌──────────────────────────────────────┐
│  P&L tab  |  Balance Sheet  |  Cash Flow  │
└──────────────────────────────────────┘
```

---

## 3. First-Time Setup

You only do this once. It takes about five minutes.

### Step 1 — Create a Google Sheet

1. Go to **sheets.new** in your browser.
2. A blank spreadsheet opens. Click the title at the top and name it something
   like **"ABC Company – Financials 2025"**.

### Step 2 — Open the Apps Script Editor

1. In the spreadsheet menu bar, click **Extensions**.
2. Click **Apps Script**.
3. A new browser tab opens showing a code editor with an empty `Code.gs` file.
4. **Select all the default text and delete it.**

### Step 3 — Add the Five Script Files

You need to create five files in the Apps Script editor. For each one:

1. Click the **+** button next to "Files" in the left sidebar.
2. Choose **Script**.
3. Name the file exactly as shown below (without the `.gs` extension — Apps
   Script adds that automatically).
4. Paste the full contents of the corresponding `.gs` file from this folder.
5. Click the **Save** icon (or press `Ctrl+S` / `Cmd+S`).

Create them in this order:

| # | File name to create | Source file to paste from |
|---|---|---|
| 1 | `ChartOfAccounts` | `ChartOfAccounts.gs` |
| 2 | `Utils` | `Utils.gs` |
| 3 | `FormSetup` | `FormSetup.gs` |
| 4 | `StatementGenerator` | `StatementGenerator.gs` |
| 5 | `Code` | `Code.gs` |

> The original empty file is already named `Code`. Paste `Code.gs` content
> into that one — no need to create a new file for it.

### Step 4 — Authorise the Script

1. With all five files saved, click the **Run** button (▶) at the top of the
   editor. It will ask you to select a function — choose `onOpen`.
2. A pop-up appears: **"Authorization required"**. Click **Review permissions**.
3. Choose your Google account.
4. You may see a warning saying the app is unverified — this is normal for
   personal scripts. Click **Advanced**, then **Go to [your project name]
   (unsafe)**.
5. Click **Allow**.

> The script only accesses the spreadsheet and form it creates — nothing else.

### Step 5 — Create the Data-Entry Form

1. Close the Apps Script tab and go back to your spreadsheet.
2. **Reload the page** (press `F5` or `Ctrl+R`).
3. A new menu item called **📊 Financial Statements** appears in the menu bar.
4. Click **📊 Financial Statements → Setup: Create Data-Entry Form**.
5. A pop-up confirms the form was created and shows its URL.
6. That URL is also saved in a new **Config** tab in your spreadsheet.

**Your setup is complete.** Share the form URL with anyone on your team
who needs to record transactions.

---

## 4. Understanding the Google Form

When someone opens the form, they see ten fields:

| Field | Required? | Notes |
|---|---|---|
| **Transaction Date** | Yes | The date the transaction actually happened — not today |
| **Account Type** | Yes | The broad financial category |
| **Account Name** | Yes | The specific account within that category |
| If "Other", enter account name | No | Only fill this if you chose "Other" above |
| **Amount** | Yes | Positive number only — no £, $, or commas |
| **Direction** | Yes | Is this money coming in or going out? |
| **Cash Flow Category** | Yes | Which section of the Cash Flow Statement it belongs to |
| Vendor or Customer Name | No | Useful for tracking who you paid or who paid you |
| Reference / Invoice Number | No | For matching against invoices or bank statements |
| Description / Notes | No | Any extra context |

---

## 5. Recording Transactions — Step by Step

### Choosing the Account Type

The **Account Type** field groups transactions into the major financial
categories. Pick whichever best describes what the transaction is:

| Account Type | Use it for |
|---|---|
| **Revenue** | Sales income, service fees, subscription income — money earned from your core business |
| **Cost of Goods Sold** | Direct costs of producing what you sell — hosting fees, materials, merchant fees |
| **Operating Expenses** | Day-to-day running costs — rent, salaries, marketing, insurance |
| **Other Income** | Interest earned, one-off gains — income not from your core business |
| **Other Expenses** | Depreciation, interest paid on loans |
| **Current Assets** | Cash, accounts receivable, prepaid expenses |
| **Fixed Assets** | Computers, furniture, equipment you bought |
| **Long Term Assets** | Long-term investments |
| **Current Liabilities** | Bills you owe in the short term — accounts payable, accrued payroll |
| **Long Term Liabilities** | Loans, convertible notes |
| **Equity** | Capital put in by owners, retained earnings |

### Choosing the Direction

This tells the system whether the amount increases or decreases your position:

| Choose this | When |
|---|---|
| **Income / Asset Increase / Liability Decrease / Equity Increase** | You received money, bought an asset, paid off a debt, or an owner put money in |
| **Expense / Asset Decrease / Liability Increase / Equity Decrease** | You spent money, an asset decreased in value, you took on a new debt |

**Simple rule of thumb:**
- Money flows IN to the business → "Income / Asset Increase…"
- Money flows OUT of the business → "Expense / Asset Decrease…"

### Choosing the Cash Flow Category

Every transaction must be tagged so the Cash Flow Statement knows where to
place it:

| Category | Typical transactions |
|---|---|
| **Operating Activities** | Day-to-day income and expenses — sales collected, wages paid, supplier invoices, rent |
| **Investing Activities** | Buying or selling long-term assets — purchasing computers, equipment, furniture |
| **Financing Activities** | Borrowing or repaying money — bank loans, owner investments, dividends paid |
| **Not a cash transaction** | Depreciation, accruals, journal adjustments — anything that affects the P&L or Balance Sheet but does not move actual cash |

---

## 6. Transaction Examples

These examples show exactly how to fill in the form for common situations.

---

### Example A — Customer Invoice Paid: £5,000

> You raised an invoice for a consulting project and the client paid.

| Field | Value |
|---|---|
| Transaction Date | 2025-03-14 |
| Account Type | Revenue |
| Account Name | Revenue Stream 1 |
| Amount | 5000 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Operating Activities |
| Vendor or Customer | Acme Ltd |
| Reference | INV-0042 |
| Description | Consulting project — March delivery |

---

### Example B — Office Rent Payment: £1,200

> Monthly rent paid by bank transfer.

| Field | Value |
|---|---|
| Transaction Date | 2025-03-01 |
| Account Type | Operating Expenses |
| Account Name | Rent & Lease |
| Amount | 1200 |
| Direction | Expense / Asset Decrease… |
| Cash Flow Category | Operating Activities |
| Vendor or Customer | Property Holdings Ltd |
| Reference | DD-RENT-MAR |
| Description | March office rent |

---

### Example C — New Laptop Purchased: £1,800

> You bought a laptop for a team member.

| Field | Value |
|---|---|
| Transaction Date | 2025-02-20 |
| Account Type | Fixed Assets |
| Account Name | Computers |
| Amount | 1800 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Investing Activities |
| Vendor or Customer | Apple Store |
| Reference | PO-2025-011 |
| Description | MacBook Pro for design team |

---

### Example D — Bank Loan Received: £10,000

> The business received a £10,000 loan from the bank.

| Field | Value |
|---|---|
| Transaction Date | 2025-01-10 |
| Account Type | Long Term Liabilities |
| Account Name | Principal |
| Amount | 10000 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Financing Activities |
| Vendor or Customer | Barclays Bank |
| Reference | LOAN-2025-01 |
| Description | 3-year business loan |

---

### Example E — Depreciation: £150 (non-cash)

> Monthly depreciation charged on equipment.

| Field | Value |
|---|---|
| Transaction Date | 2025-03-31 |
| Account Type | Other Expenses |
| Account Name | Depreciation Expense |
| Amount | 150 |
| Direction | Expense / Asset Decrease… |
| Cash Flow Category | Not a cash transaction |
| Description | Monthly equipment depreciation |

---

### Example F — Owner Puts in Capital: £20,000

> A founder transfers personal funds into the business account.

| Field | Value |
|---|---|
| Transaction Date | 2025-01-02 |
| Account Type | Equity |
| Account Name | Common Stock |
| Amount | 20000 |
| Direction | Income / Asset Increase… |
| Cash Flow Category | Financing Activities |
| Vendor or Customer | Jane Smith (founder) |
| Description | Initial capital injection |

---

## 7. Generating Financial Statements

Once transactions are in, generating statements takes seconds.

### Quick Access — Pre-set Periods

Click **📊 Financial Statements** in the menu bar and choose a period:

```
📊 Financial Statements
├── 🛠  Setup: Create Data-Entry Form
├── Generate – This Month
│   ├── All Three Statements      ← best starting point
│   ├── P&L Only
│   ├── Balance Sheet Only
│   └── Cash Flow Only
├── Generate – This Quarter
│   └── (same sub-options)
├── Generate – This Year
│   └── (same sub-options)
├── Generate – Custom Date Range
│   └── (same sub-options)
├── 📋 View Chart of Accounts
└── ℹ️  Help & Instructions
```

**Always use "All Three Statements"** when you can. The Balance Sheet and
Cash Flow Statement both use the Net Income figure produced by the P&L, so
running them together ensures the numbers link correctly.

### Custom Date Range

1. Click **Generate – Custom Date Range → All Three Statements**.
2. A box asks for the start date — type it in `YYYY-MM-DD` format, e.g. `2025-01-01`.
3. Click **OK**.
4. A second box asks for the end date — type it in the same format, e.g. `2025-03-31`.
5. Click **OK**.
6. All three statement tabs are generated and a confirmation message appears.

### Where the Results Appear

Each time you generate statements, three sheet tabs are created (or refreshed):

| Tab name | Contains |
|---|---|
| **P&L** | Profit & Loss Statement |
| **Balance Sheet** | Balance Sheet |
| **Cash Flow** | Cash Flow Statement |

The tabs are overwritten each time, so you always see the latest numbers.
If you want to keep a historical copy, duplicate the tab before generating again
(**right-click the tab → Duplicate**).

---

## 8. Reading the P&L Statement

The P&L tab shows how the business performed over the chosen period.

```
PROFIT & LOSS STATEMENT
01 Jan 2025 – 31 Mar 2025
─────────────────────────────────────────────────────
REVENUE
    Revenue Stream 1                           8,500.00
    Revenue Stream 2                           3,200.00
Total Revenue                                 11,700.00
─────────────────────────────────────────────────────
COST OF GOODS SOLD
    Web Domain & Hosting Fees                    320.00
    Merchant Account Fees                        185.00
Total COGS                                       505.00
─────────────────────────────────────────────────────
GROSS PROFIT                                  11,195.00
    Gross Margin                                  95.7%
─────────────────────────────────────────────────────
OPERATING EXPENSES
    Advertising & Marketing                    1,200.00
    Rent & Lease                               3,600.00
    Accounting Fees                              600.00
Total Operating Expenses                       5,400.00
─────────────────────────────────────────────────────
NET OPERATING INCOME                           5,795.00
─────────────────────────────────────────────────────
OTHER INCOME & EXPENSES
    Interest Income                               45.00
    Depreciation Expense                        -450.00
Net Other Income                                -405.00
─────────────────────────────────────────────────────
NET INCOME                                     5,390.00
```

### What Each Line Means

| Line | Meaning |
|---|---|
| **Total Revenue** | Everything earned from your core business activity |
| **Total COGS** | Direct costs tied to delivering that revenue |
| **Gross Profit** | Revenue minus COGS — what's left before overhead |
| **Gross Margin %** | Gross Profit as a percentage of Revenue — higher is better |
| **Total Operating Expenses** | All overhead costs of running the business |
| **Net Operating Income** | Profit from operations before non-operating items |
| **Net Other Income** | Interest, depreciation, and other non-operating items |
| **Net Income** | The bottom line — profit (green) or loss (red) for the period |

**Red numbers** mean that line is negative (a loss or cost larger than income).

---

## 9. Reading the Balance Sheet

The Balance Sheet is a snapshot **as of the end date** you chose. It shows
everything the business owns, owes, and the owners' stake.

```
BALANCE SHEET
As of 31 Mar 2025
─────────────────────────────────────────────────────
ASSETS
  Current Assets
    Cash                                      44,125.00
    Accounts Receivable                        8,200.00
    Prepaid Expenses                           1,500.00
  Total Current Assets                        53,825.00

  Fixed Assets
    Computers                                  5,400.00
    Furniture                                  2,200.00
    Accumulated Depreciation                  -1,350.00
  Total Fixed Assets                           6,250.00

TOTAL ASSETS                                  60,075.00
─────────────────────────────────────────────────────
LIABILITIES
  Current Liabilities
    Accounts Payable                           4,200.00
    Accrued Payroll                            2,100.00
  Total Current Liabilities                    6,300.00

  Long Term Liabilities
    Principal                                 10,000.00
  Total Long Term Liabilities                 10,000.00

TOTAL LIABILITIES                             16,300.00
─────────────────────────────────────────────────────
OWNERS EQUITY
    Common Stock                              38,385.00
    Retained Earnings (period)                 5,390.00
TOTAL EQUITY                                  43,775.00
─────────────────────────────────────────────────────
TOTAL LIABILITIES & EQUITY                    60,075.00

✓ Balance Sheet is balanced
```

### The Golden Rule

> **Total Assets must always equal Total Liabilities + Total Equity**

If they match, you see **✓ Balance Sheet is balanced**.
If they do not match, you see a ⚠ warning with the difference — this usually
means an opening balance is missing (see Troubleshooting).

### Key Things to Check

| Check | Healthy sign |
|---|---|
| Cash is positive | Business has money in the bank |
| Accounts Receivable is reasonable | Customers aren't taking too long to pay |
| Total Liabilities < Total Assets | Business is solvent |
| Equity is growing over time | Retained earnings are building up |

### Note on "Retained Earnings (period)"

This line is automatically pulled from the Net Income on the P&L for the
period you selected. It represents the profit earned during that period that
has been added to the owners' stake. If you ran P&L and Balance Sheet
separately, this line will show 0 — always use **All Three Statements**
so they link correctly.

---

## 10. Reading the Cash Flow Statement

The Cash Flow Statement explains the movement of actual cash during the period.
Profit on the P&L does not always equal cash — this statement bridges that gap.

```
CASH FLOW STATEMENT
01 Jan 2025 – 31 Mar 2025
─────────────────────────────────────────────────────
CASH FROM OPERATING ACTIVITIES
    Net Income                                 5,390.00
    Depreciation Expense                         450.00
    Accounts Receivable (increase)            -8,200.00
Net Cash from Operating Activities            -2,360.00
─────────────────────────────────────────────────────
CASH FROM INVESTING ACTIVITIES
    Computers                                 -5,400.00
    Furniture                                 -2,200.00
Net Cash from Investing Activities            -7,600.00
─────────────────────────────────────────────────────
CASH FROM FINANCING ACTIVITIES
    Common Stock                              38,385.00
    Principal (loan received)                 10,000.00
Net Cash from Financing Activities            48,385.00
─────────────────────────────────────────────────────
NET CHANGE IN CASH                            38,425.00

Beginning Cash Balance   ← enter manually
Ending Cash Balance      = Beginning + Net Change
```

### The Three Sections

| Section | What it includes | Healthy sign |
|---|---|---|
| **Operating Activities** | Cash from your core business — collecting from customers, paying suppliers and staff | Positive and growing |
| **Investing Activities** | Cash spent on or received from long-term assets | Negative is normal when growing (buying equipment) |
| **Financing Activities** | Cash from owners or lenders, or paid back to them | Positive when raising funds, negative when repaying |

### Completing the Cash Balance Lines

The last two rows require a manual entry:

1. Find your **Beginning Cash Balance** from your previous period's balance
   sheet or bank statement.
2. Click the cell next to "Beginning Cash Balance" and type the number.
3. Click the cell next to "Ending Cash Balance" and type a formula:
   `= [beginning cash cell] + [net change in cash cell]`
   For example, if beginning cash is in C32 and net change is in C30:
   `=C32+C30`

This ending balance should match the Cash figure on your Balance Sheet.

---

## 11. Reading the Financial Ratios Dashboard

The **Financial Ratios** tab is generated alongside the three statements whenever
you run **All Three Statements**, or independently via
**📊 Financial Statements → Health Ratios**.

It contains 19 ratios across five categories, each with a colour-coded health status.

---

### The Traffic Light System

Every ratio is assessed against general business benchmarks and rated:

| Status | Colour | Meaning |
|---|---|---|
| **✓ Healthy** | Dark green | The ratio is within a strong range |
| **! Watch** | Dark amber | The ratio is borderline — monitor and investigate |
| **✗ Concern** | Dark red | The ratio is outside healthy norms — action may be needed |
| **— N/A** | Grey | Not enough data to calculate (e.g. zero revenue) |

> Hover over any ratio name in the sheet to read a one-line explanation of
> what it measures.

---

### Category 1 — Liquidity Ratios

These answer: *Can the business pay its short-term bills?*

| Ratio | Formula | Healthy | What it tells you |
|---|---|---|---|
| **Current Ratio** | Current Assets ÷ Current Liabilities | > 2.0x | For every £1 owed short-term, how many £ of liquid assets exist |
| **Quick Ratio** | (Current Assets − Prepaid) ÷ Current Liabilities | > 1.0x | Stricter liquidity — excludes the least-liquid current assets |
| **Cash Ratio** | Cash ÷ Current Liabilities | > 0.5x | The strictest test — cash on hand versus immediate debts |
| **Net Working Capital** | Current Assets − Current Liabilities | Positive | The raw cash buffer available after paying all short-term debts |

**What to do if these are red:**
- Current and Quick Ratio below 1 means you cannot cover short-term debts —
  chase outstanding invoices, delay non-essential purchases, or arrange a credit facility.
- Cash Ratio near zero means a single late payment from a customer could cause a problem.

---

### Category 2 — Profitability Ratios

These answer: *Is the business making money, and how efficiently?*

| Ratio | Formula | Healthy | What it tells you |
|---|---|---|---|
| **Gross Profit Margin** | Gross Profit ÷ Revenue × 100 | > 40% | What percentage of each sale survives after direct costs |
| **Net Profit Margin** | Net Income ÷ Revenue × 100 | > 10% | The final profit kept from every £1 of sales |
| **Operating Profit Margin** | Net Operating Income ÷ Revenue × 100 | > 15% | Profitability from core operations, before interest and non-operating items |
| **EBITDA Margin** | EBITDA ÷ Revenue × 100 | > 20% | Operational cash-generating power before accounting adjustments |
| **Return on Assets (ROA)** | Net Income ÷ Total Assets × 100 | > 5% | How hard every £1 of assets is working to produce profit |
| **Return on Equity (ROE)** | Net Income ÷ Total Equity × 100 | > 15% | The return owners receive on money they put into the business |

**What to do if these are red:**
- Low Gross Margin → your pricing or direct costs need work. Either raise prices
  or renegotiate supplier/production costs.
- Low Net Margin with a healthy Gross Margin → operating expenses are too high.
  Review your OpEx line by line.
- Low ROA or ROE → the business is sitting on too many assets relative to the
  profit they generate, or equity is too large compared to returns.

---

### Category 3 — Leverage & Solvency Ratios

These answer: *How much debt does the business carry, and is it sustainable long-term?*

| Ratio | Formula | Healthy | What it tells you |
|---|---|---|---|
| **Debt-to-Equity** | Total Liabilities ÷ Total Equity | < 1.0x | How much of the business is funded by debt versus owners |
| **Debt-to-Assets** | Total Liabilities ÷ Total Assets | < 0.5x | The proportion of assets financed by creditors |
| **Equity Multiplier** | Total Assets ÷ Total Equity | < 2.0x | Financial leverage — higher means more assets funded by debt |
| **Debt-to-Capitalisation** | Total Liabilities ÷ (Liabilities + Equity) | < 40% | Debt as a share of the total capital structure |

**What to do if these are red:**
- High Debt-to-Equity (above 2) means creditors own more of the business than
  the owners — a risk to lenders and a constraint on future borrowing.
- Pay down debt, retain more profit rather than distributing it, or raise equity.

---

### Category 4 — Efficiency Ratios

These answer: *How well is the business using what it has?*

| Ratio | Formula | Healthy | What it tells you |
|---|---|---|---|
| **Asset Turnover** | Revenue ÷ Total Assets | > 1.0x | How many £1 of sales each £1 of assets generates |
| **Revenue per £ of Equity** | Revenue ÷ Total Equity | > 1.5x | How effectively owner capital drives sales volume |

**What to do if these are red:**
- Low Asset Turnover can mean idle assets (unused equipment, excess stock, uncollected
  receivables). Dispose of surplus assets or accelerate collections.

---

### Category 5 — Cash Flow Ratios

These answer: *Is the profit real — backed by actual cash?*

| Ratio | Formula | Healthy | What it tells you |
|---|---|---|---|
| **Operating CF to Sales** | Operating Cash Flow ÷ Revenue | > 0.10x | Quality check — does profit convert to real cash? |
| **Free Cash Flow** | Operating CF + Investing CF | Positive | Cash left after investing — funds growth and debt repayment |
| **Cash Flow Coverage** | Operating CF ÷ Total Liabilities | > 0.20x | Can the business service all its debt from cash generated? |

**What to do if these are red:**
- Negative Operating CF to Sales while the P&L shows profit usually means
  customers aren't paying on time. Focus on receivables collection.
- Negative Free Cash Flow is sometimes fine during a growth phase (heavy investment),
  but sustained negative FCF requires a funding plan.

---

### The Scorecard

At the bottom of the Ratios tab, a scorecard summarises:

```
✓  Healthy     12
!  Watch        4
✗  Concern      3
Total scored   19

74% of ratios healthy  –  Good overall health
```

A score of 70 %+ is generally solid. Below 40 % warrants a structured review
with your accountant or CFO.

---

### Important Note on Benchmarks

The benchmarks shown are **general guidelines** for most small and medium
businesses. They vary significantly by industry:

- **Retail** typically has low margins but high asset turnover.
- **Professional services** typically have high margins but low asset values.
- **Manufacturing** typically carries more debt and fixed assets.

Always compare your ratios against others in your specific sector, not just
the generic benchmarks in the sheet.

---

## 12. Customising the Chart of Accounts


The default Chart of Accounts covers most small businesses. To adapt it to
your organisation, edit `ChartOfAccounts.gs` in the Apps Script editor.

### Adding a New Account to an Existing Category

Open `ChartOfAccounts.gs` and find the category you want to extend.
Add a new code and name to the arrays:

**Before:**
```js
REVENUE: {
  codes: ['40100','40200','40300'],
  names: ['Revenue Stream 1','Revenue Stream 2','Revenue Stream 3'],
  ...
}
```

**After (added "Product Sales" as 40400):**
```js
REVENUE: {
  codes: ['40100','40200','40300','40400'],
  names: ['Revenue Stream 1','Revenue Stream 2','Revenue Stream 3','Product Sales'],
  ...
}
```

### Adding an Entirely New Category

Copy an existing block and change the key, label, codes, names, section, and group:

```js
GRANTS: {
  label: 'Grant Income',
  codes: ['75100','75200'],
  names: ['Government Grant','Foundation Grant'],
  section: 'PL',      // 'PL' for Income Statement, 'BS' for Balance Sheet
  group:  'OtherIncome'
},
```

### After Any Changes

Run **📊 Financial Statements → Setup: Create Data-Entry Form** again to
regenerate the form with your updated account list. Old form responses are
not affected.

---

## 12. Month-End and Quarter-End Routine

Follow this simple process at the end of each period:

### During the Month

- Enter every transaction via the form as it happens, or at least weekly.
- Use the Description and Reference fields — they save time when reviewing later.

### At Month-End

1. Check the **Form Responses 1** tab to make sure no transactions are missing.
2. Enter any end-of-month adjustments (accruals, depreciation) via the form,
   tagged as **"Not a cash transaction"** for the Cash Flow Category.
3. Click **📊 Financial Statements → Generate – This Month → All Three Statements**.
4. Review the P&L — does Gross Profit look right? Does Net Income make sense?
5. Check the Balance Sheet for the ✓ balanced confirmation.
6. Fill in the Beginning Cash Balance on the Cash Flow tab.
7. **Duplicate all three tabs** before next month to preserve the record:
   right-click each tab → Duplicate → rename to e.g. "P&L Jan 2025".

### At Quarter-End

1. Run **Generate – This Quarter → All Three Statements**.
2. Compare to the previous quarter — look for trends in revenue growth and
   expense control.
3. Save a copy of the spreadsheet file (**File → Make a copy**) as your
   quarterly archive.

### At Year-End

1. Run **Generate – This Year → All Three Statements**.
2. This is your annual financial package — share the three tabs with your
   accountant or board.
3. Create a new spreadsheet for the following year and start fresh.

---

## 13. Troubleshooting

### The 📊 Financial Statements menu doesn't appear

- Reload the spreadsheet (press `F5`).
- If it still doesn't appear, go to **Extensions → Apps Script** and run the
  `onOpen` function manually by selecting it from the function dropdown and
  clicking ▶.

### "Form Responses sheet not found" message

You generated statements before creating the form. Click
**📊 Financial Statements → Setup: Create Data-Entry Form** first,
then submit at least one test entry via the form before generating statements.

### The Balance Sheet shows a ⚠ warning

The most common cause is missing opening balances. If your business had cash,
assets, or liabilities before you started using this system, you need to enter
them as transactions with a date of your start date:

- Cash in bank: Account Type = Current Assets, Account Name = Cash,
  Direction = Income / Asset Increase
- Outstanding loan: Account Type = Long Term Liabilities, Account Name = Principal,
  Direction = Income / Asset Increase (liability going up)

### All amounts show as 0

The Amount field must contain only digits and a decimal point — no currency
symbols (£, $), no commas, no spaces. Edit the form responses directly in the
**Form Responses 1** tab to correct any badly formatted entries.

### Negative numbers on the P&L

Check the Direction field for those entries. Expenses must use
"Expense / Asset Decrease…", not "Income / Asset Increase…". You can correct
entries directly in the Form Responses 1 tab — find the Direction column and
update the cell.

### The Gross Margin shows as "—"

This means Total Revenue is zero for the period. Check that revenue
transactions were entered with the correct date and Account Type = Revenue.

### A new account I added doesn't appear in reports

After editing `ChartOfAccounts.gs`, make sure you saved the file in the Apps
Script editor. Then regenerate statements — the account will appear once a
transaction uses it.

---

## 14. Glossary

| Term | Plain-English meaning |
|---|---|
| **Revenue** | Money earned from your core business activity |
| **COGS (Cost of Goods Sold)** | Direct costs of producing what you sell |
| **Gross Profit** | Revenue minus COGS — what's left before overhead |
| **Gross Margin** | Gross Profit as a percentage of Revenue |
| **Operating Expenses (OpEx)** | Overhead costs of running the business (rent, salaries, marketing) |
| **Net Operating Income** | Profit from operations before interest, depreciation, and tax |
| **Net Income** | The final profit or loss after all income and expenses |
| **Assets** | Everything the business owns or is owed |
| **Current Assets** | Assets convertible to cash within 12 months (cash, receivables) |
| **Fixed Assets** | Long-lived physical assets (equipment, furniture) |
| **Liabilities** | Everything the business owes to others |
| **Current Liabilities** | Debts due within 12 months (supplier invoices, accrued payroll) |
| **Long Term Liabilities** | Debts due beyond 12 months (bank loans) |
| **Equity** | Owners' stake = Total Assets minus Total Liabilities |
| **Retained Earnings** | Accumulated profits kept in the business (not paid out) |
| **Accounts Receivable** | Money customers owe you for work already done |
| **Accounts Payable** | Money you owe suppliers for goods/services already received |
| **Depreciation** | Spreading the cost of an asset across its useful life (non-cash) |
| **Accrual** | Recording income or expense when it is earned/incurred, not when cash moves |
| **Cash Flow** | The actual movement of cash in and out of the business |
| **Operating Activities** | Day-to-day business cash movements |
| **Investing Activities** | Cash spent on or received from long-term assets |
| **Financing Activities** | Cash from or returned to owners and lenders |
| **Chart of Accounts** | The master list of all account names used in the system |
| **Apps Script** | Google's built-in scripting tool — the engine behind the Financial Statements menu |
