// ============================================================
// CHART OF ACCOUNTS
// Based on standard small-business account structure.
// Extend or rename accounts to match your organisation.
// ============================================================

const COA = {
  // ── INCOME STATEMENT accounts ──────────────────────────────
  REVENUE: {
    label: 'Revenue',
    codes: ['40100','40200','40300'],
    names: ['Revenue Stream 1','Revenue Stream 2','Revenue Stream 3'],
    section: 'PL', group: 'Revenue'
  },
  COGS: {
    label: 'Cost of Goods Sold',
    codes: ['50100','50200'],
    names: ['Web Domain & Hosting Fees','Merchant Account Fees'],
    section: 'PL', group: 'COGS'
  },
  OPEX: {
    label: 'Operating Expenses',
    codes: ['60100','60200','60300','60410','60420','60510','60520'],
    names: [
      'Advertising & Marketing','Bank Charges & Fees','Insurance',
      'Office Supplies & Software','Rent & Lease',
      'Accounting Fees','Consulting Fees'
    ],
    section: 'PL', group: 'Expenses'
  },
  OTHER_INCOME: {
    label: 'Other Income',
    codes: ['70100','70200'],
    names: ['Interest Income','Other Income'],
    section: 'PL', group: 'OtherIncome'
  },
  OTHER_EXPENSE: {
    label: 'Other Expenses',
    codes: ['80100','80200'],
    names: ['Depreciation Expense','Interest Expense'],
    section: 'PL', group: 'OtherExpense'
  },

  // ── BALANCE SHEET accounts ─────────────────────────────────
  CURRENT_ASSETS: {
    label: 'Current Assets',
    codes: ['10100','10200','10310','10320','10330'],
    names: ['Cash','Accounts Receivable','Prepaid Expenses','Security Deposit','Due to/from Officers'],
    section: 'BS', group: 'Assets'
  },
  FIXED_ASSETS: {
    label: 'Fixed Assets',
    codes: ['10410','10420','10430','10440'],
    names: ['Computers','Furniture','Equipment','Accumulated Depreciation'],
    section: 'BS', group: 'Assets'
  },
  LONG_TERM_ASSETS: {
    label: 'Long Term Assets',
    codes: ['10500'],
    names: ['Long Term Investments'],
    section: 'BS', group: 'Assets'
  },
  CURRENT_LIABILITIES: {
    label: 'Current Liabilities',
    codes: ['20100','20310','20320'],
    names: ['Accounts Payable','Accrued Expenses','Accrued Payroll'],
    section: 'BS', group: 'Liabilities'
  },
  LONG_TERM_LIABILITIES: {
    label: 'Long Term Liabilities',
    codes: ['20410','20411','20412'],
    names: ['Convertible Notes','Principal','Accrued Interest'],
    section: 'BS', group: 'Liabilities'
  },
  EQUITY: {
    label: 'Equity',
    codes: ['30100','30200','30300','30400'],
    names: ['Common Stock','Preferred Stock','Additional Paid in Capital','Retained Earnings'],
    section: 'BS', group: 'Equity'
  }
};

// Flat lookup: account name → category key
function buildAccountLookup() {
  const map = {};
  Object.keys(COA).forEach(key => {
    COA[key].names.forEach(name => { map[name] = key; });
    COA[key].codes.forEach(code => { map[code] = key; });
  });
  return map;
}

// Returns all account names for a given category key
function getAccountNames(categoryKey) {
  return COA[categoryKey] ? COA[categoryKey].names : [];
}

// Returns all category display labels grouped for form dropdowns
function getAllTypeChoices() {
  return Object.keys(COA).map(k => COA[k].label);
}

function getCategoryKeyByLabel(label) {
  return Object.keys(COA).find(k => COA[k].label === label) || null;
}
