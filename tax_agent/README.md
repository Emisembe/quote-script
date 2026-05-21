# Offline Accounting Tax Agent

A fully offline, any-country accounting system. Upload your transactions as CSV, configure your country's tax rules in a JSON file, and generate professional financial statements.

## What it produces

| Statement | Description |
|-----------|-------------|
| **P&L** | Revenue, COGS, Gross Profit, EBIT, Net Profit |
| **Balance Sheet** | Assets = Liabilities + Equity |
| **Cash Flow** | Operating, Investing, Financing |
| **Budget vs Actuals** | Variance & % by account |
| **Trial Balance** | All accounts, total debits = total credits |
| **Bank Reconciliation** | Unmatched items between bank & books |
| **Key Ratios** | Gross margin, net margin, interest coverage, etc. |

## Quick Start

```bash
# Full report
python main.py report \
  --data data/sample_transactions.csv \
  --country template \
  --budget data/sample_budget.csv \
  --opening data/opening_balances.csv \
  --bank-rec data/sample_bank_reconciliation.csv \
  --period 2024-01 --period 2024-02 --period 2024-03 \
  --output reports/report.html

# Trial balance (console)
python main.py trial-balance \
  --data data/sample_transactions.csv \
  --opening data/opening_balances.csv

# See chart of accounts
python main.py list-accounts
```

Open `reports/report.html` in any browser — no internet required.

## Adding a new country

Copy the template and fill in your values:

```bash
cp config/countries/template.json config/countries/za.json
```

Edit `za.json`:
```json
{
  "country_name": "South Africa",
  "currency_symbol": "R",
  "currency_code": "ZAR",
  "bookkeeping": {
    "accounting_method": "accrual",
    "entity_type": "llc"
  },
  "tax": {
    "vat": { "standard_rate": 0.15, "label": "VAT" },
    "corporate_income_tax": {
      "method": "brackets",
      "brackets": [
        { "from": 0,      "to": 365000, "rate": 0.0 },
        { "from": 365000, "to": null,   "rate": 0.27 }
      ]
    }
  }
}
```

Then run:
```bash
python main.py report --data data/my_transactions.csv --country za
```

## Transaction CSV format

```
date,account_code,account_name,description,debit,credit,source_type,period
2024-01-05,40100,Revenue Stream 1,Client invoice,0,15000,invoice,2024-01
2024-01-15,60600,Salaries & Wages,January payroll,12000,0,bank_transaction,2024-01
```

**Source types:** `invoice`, `bill`, `bank_transaction`, `credit_card`, `journal_entry`

Use **double-entry**: every transaction should have a matching debit and credit entry so the Trial Balance balances.

## Budget CSV format

```
period,account_code,account_name,budget_amount
2024-01,40100,Revenue Stream 1,14000
2024-01,60600,Salaries & Wages,12000
```

## Opening Balances CSV format

```
account_code,account_name,debit,credit
10100,Cash,44125,0
20100,Accounts Payable,0,8500
30400,Retained Earnings,0,39125
```

## Entity Types (affects tax treatment)

Set `entity_type` in your country config:

| Code | Entity | Tax Method | Double Taxation |
|------|--------|-----------|----------------|
| `sole_proprietor` | Sole Proprietorship | Pass-through | No |
| `llc` | LLC | Pass-through | No |
| `s_corp` | S Corporation | Pass-through | No |
| `c_corp` | C Corporation | Corporate | **Yes** |
| `partnership` | General Partnership | Pass-through | No |
| `nonprofit` | Nonprofit | Exempt | No |

## Accounting Methods

- **Accrual**: Records income when earned, expenses when incurred (standard)
- **Cash**: Records only when money actually moves

Set `accounting_method` to `"cash"` or `"accrual"` in your country config.

## The Bookkeeping Process (10 Steps)

1. Use a dedicated bank account for business
2. Choose Cash vs Accrual (set in config)
3. Design your Chart of Accounts (`config/chart_of_accounts.json`)
4. Import transactions into `data/`
5. Classify each transaction to the correct account code
6. Perform bank reconciliation (`--bank-rec`)
7. Book adjusting journal entries (depreciation, accruals, prepayments)
8. Run trial balance to verify books balance
9. Generate financial statements (`python main.py report`)
10. Analyse ratios and drive decisions

## No dependencies required

Pure Python 3 stdlib only — runs fully offline, no pip installs needed.
