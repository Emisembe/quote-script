// ============================================================
// FINANCIAL RATIOS GENERATOR
// Calculates 18 ratios across 5 categories directly from raw
// form response data. No dependency on the P&L / BS / CF tabs.
// ============================================================

function generateRatios(range) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // ── 1. Pull raw data ───────────────────────────────────────
  const periodRows = getRowsInRange(range.startDate, range.endDate, range.sheetName);
  const allRows    = getRowsInRange(new Date(2000, 0, 1), range.endDate, range.sheetName); // BS needs all history

  if (periodRows.length === 0 && allRows.length === 0) {
    SpreadsheetApp.getUi().alert('No transactions found for this period.');
    return;
  }

  // ── 2. Build all figures from first principles ─────────────
  const fig = buildFigures(periodRows, allRows);

  // ── 3. Define every ratio ──────────────────────────────────
  const ratios = buildRatioDefinitions(fig);

  // ── 4. Render the sheet ────────────────────────────────────
  renderRatiosSheet(ss, ratios, fig, range);
}

// ── Figure calculation ─────────────────────────────────────────

function buildFigures(periodRows, allRows) {
  const revenue      = sumByCategory(periodRows, 'REVENUE');
  const cogs         = sumByCategory(periodRows, 'COGS');
  const grossProfit  = revenue - cogs;
  const opex         = sumByCategory(periodRows, 'OPEX');
  const netOpIncome  = grossProfit - opex;
  const otherIncome  = sumByCategory(periodRows, 'OTHER_INCOME');
  const otherExpense = sumByCategory(periodRows, 'OTHER_EXPENSE');
  const netIncome    = netOpIncome + otherIncome - otherExpense;

  // Non-cash items (Depreciation, Amortisation) proxy for D&A in EBITDA
  const nonCash = periodRows
    .filter(r => r.cashflow === 'Not a cash transaction (non-cash / balance sheet only)')
    .reduce((s, r) => s + r.amount, 0);
  const ebitda = netOpIncome + nonCash;

  // Balance Sheet — cumulative up to end date
  const currentAssets  = sumByCategory(allRows, 'CURRENT_ASSETS');
  const fixedAssets    = sumByCategory(allRows, 'FIXED_ASSETS');
  const ltAssets       = sumByCategory(allRows, 'LONG_TERM_ASSETS');
  const totalAssets    = currentAssets + fixedAssets + ltAssets;

  const currentLiab    = sumByCategory(allRows, 'CURRENT_LIABILITIES');
  const ltLiab         = sumByCategory(allRows, 'LONG_TERM_LIABILITIES');
  const totalLiab      = currentLiab + ltLiab;

  const equityBase     = sumByCategory(allRows, 'EQUITY');
  const totalEquity    = equityBase + netIncome; // add period retained earnings

  // Cash = the "Cash" account specifically (code 10100)
  const lookup = buildAccountLookup();
  const cash = allRows
    .filter(r => r.account === 'Cash' || r.account === '10100')
    .reduce((s, r) => {
      return s + (r.direction && r.direction.startsWith('Income') ? r.amount : -r.amount);
    }, 0);

  // Cash Flow sections
  const opCFRows  = periodRows.filter(r => r.cashflow === 'Operating Activities');
  const invCFRows = periodRows.filter(r => r.cashflow === 'Investing Activities');
  const opCFAdjustments = opCFRows.reduce((s, r) => {
    return s + (r.direction && r.direction.startsWith('Income') ? r.amount : -r.amount);
  }, 0);
  const operatingCF  = netIncome + opCFAdjustments;
  const investingCF  = invCFRows.reduce((s, r) => {
    return s + (r.direction && r.direction.startsWith('Income') ? r.amount : -r.amount);
  }, 0);
  const freeCF = operatingCF + investingCF; // investing is usually negative (spending)

  return {
    revenue, cogs, grossProfit, opex, netOpIncome,
    otherIncome, otherExpense, netIncome, ebitda, nonCash,
    currentAssets, fixedAssets, ltAssets, totalAssets,
    currentLiab, ltLiab, totalLiab, totalEquity, equityBase, cash,
    operatingCF, investingCF, freeCF
  };
}

// ── Ratio definitions ──────────────────────────────────────────

function buildRatioDefinitions(f) {
  // safe division — returns null if denominator is 0
  function sd(num, den) { return (den && den !== 0) ? num / den : null; }
  function pct(num, den) { const v = sd(num, den); return v !== null ? v * 100 : null; }

  return [
    // ── LIQUIDITY ──────────────────────────────────────────────
    {
      category: 'LIQUIDITY RATIOS',
      categoryDesc: 'Measure the ability to meet short-term obligations',
      categoryColor: '#1565a0',
      name: 'Current Ratio',
      formula: 'Current Assets ÷ Current Liabilities',
      value: sd(f.currentAssets, f.currentLiab),
      format: '2dp',
      unit: 'x',
      benchmark: '> 2.0 healthy   1.0–2.0 caution   < 1.0 concern',
      explain: 'How many £/$ of current assets cover each £/$ of short-term debt',
      health: v => v === null ? 'N/A' : v >= 2 ? 'HEALTHY' : v >= 1 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'LIQUIDITY RATIOS',
      name: 'Quick Ratio',
      formula: '(Current Assets − Prepaid) ÷ Current Liabilities',
      value: sd(f.currentAssets - (f.currentAssets * 0.1), f.currentLiab), // approximation without inventory line
      format: '2dp',
      unit: 'x',
      benchmark: '> 1.0 healthy   0.5–1.0 caution   < 0.5 concern',
      explain: 'Liquidity excluding the least-liquid current assets',
      health: v => v === null ? 'N/A' : v >= 1 ? 'HEALTHY' : v >= 0.5 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'LIQUIDITY RATIOS',
      name: 'Cash Ratio',
      formula: 'Cash ÷ Current Liabilities',
      value: sd(f.cash, f.currentLiab),
      format: '2dp',
      unit: 'x',
      benchmark: '> 0.5 healthy   0.2–0.5 caution   < 0.2 concern',
      explain: 'The strictest liquidity test — cash only, no other assets',
      health: v => v === null ? 'N/A' : v >= 0.5 ? 'HEALTHY' : v >= 0.2 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'LIQUIDITY RATIOS',
      name: 'Net Working Capital',
      formula: 'Current Assets − Current Liabilities',
      value: f.currentAssets - f.currentLiab,
      format: 'currency',
      unit: '',
      benchmark: 'Positive = healthy   Negative = concern',
      explain: 'The buffer of liquid assets above short-term liabilities',
      health: v => v === null ? 'N/A' : v > 0 ? 'HEALTHY' : 'CONCERN'
    },

    // ── PROFITABILITY ──────────────────────────────────────────
    {
      category: 'PROFITABILITY RATIOS',
      categoryDesc: 'Measure how efficiently the business generates profit',
      categoryColor: '#1a4731',
      name: 'Gross Profit Margin',
      formula: 'Gross Profit ÷ Revenue × 100',
      value: pct(f.grossProfit, f.revenue),
      format: '1dp',
      unit: '%',
      benchmark: '> 40% healthy   20–40% caution   < 20% concern',
      explain: 'Percentage of revenue left after paying direct costs',
      health: v => v === null ? 'N/A' : v >= 40 ? 'HEALTHY' : v >= 20 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'PROFITABILITY RATIOS',
      name: 'Net Profit Margin',
      formula: 'Net Income ÷ Revenue × 100',
      value: pct(f.netIncome, f.revenue),
      format: '1dp',
      unit: '%',
      benchmark: '> 10% healthy   5–10% caution   < 5% concern',
      explain: 'The final profit as a percentage of every £/$ of sales',
      health: v => v === null ? 'N/A' : v >= 10 ? 'HEALTHY' : v >= 5 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'PROFITABILITY RATIOS',
      name: 'Operating Profit Margin',
      formula: 'Net Operating Income ÷ Revenue × 100',
      value: pct(f.netOpIncome, f.revenue),
      format: '1dp',
      unit: '%',
      benchmark: '> 15% healthy   5–15% caution   < 5% concern',
      explain: 'Profit from core operations before interest and non-operating items',
      health: v => v === null ? 'N/A' : v >= 15 ? 'HEALTHY' : v >= 5 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'PROFITABILITY RATIOS',
      name: 'EBITDA Margin',
      formula: 'EBITDA ÷ Revenue × 100',
      value: pct(f.ebitda, f.revenue),
      format: '1dp',
      unit: '%',
      benchmark: '> 20% healthy   10–20% caution   < 10% concern',
      explain: 'Earnings before interest, tax, depreciation, and amortisation as % of revenue',
      health: v => v === null ? 'N/A' : v >= 20 ? 'HEALTHY' : v >= 10 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'PROFITABILITY RATIOS',
      name: 'Return on Assets (ROA)',
      formula: 'Net Income ÷ Total Assets × 100',
      value: pct(f.netIncome, f.totalAssets),
      format: '1dp',
      unit: '%',
      benchmark: '> 5% healthy   2–5% caution   < 2% concern',
      explain: 'How effectively every £/$ of assets generates profit',
      health: v => v === null ? 'N/A' : v >= 5 ? 'HEALTHY' : v >= 2 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'PROFITABILITY RATIOS',
      name: 'Return on Equity (ROE)',
      formula: 'Net Income ÷ Total Equity × 100',
      value: pct(f.netIncome, f.totalEquity),
      format: '1dp',
      unit: '%',
      benchmark: '> 15% healthy   8–15% caution   < 8% concern',
      explain: 'The return generated on money invested by owners',
      health: v => v === null ? 'N/A' : v >= 15 ? 'HEALTHY' : v >= 8 ? 'WATCH' : 'CONCERN'
    },

    // ── LEVERAGE / SOLVENCY ────────────────────────────────────
    {
      category: 'LEVERAGE & SOLVENCY RATIOS',
      categoryDesc: 'Measure the degree of debt financing and long-term stability',
      categoryColor: '#5a1a1a',
      name: 'Debt-to-Equity Ratio',
      formula: 'Total Liabilities ÷ Total Equity',
      value: sd(f.totalLiab, f.totalEquity),
      format: '2dp',
      unit: 'x',
      benchmark: '< 1.0 healthy   1.0–2.0 caution   > 2.0 concern',
      explain: 'How much debt the business carries for every £/$ of owners\' equity',
      health: v => v === null ? 'N/A' : v < 1 ? 'HEALTHY' : v <= 2 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'LEVERAGE & SOLVENCY RATIOS',
      name: 'Debt-to-Assets Ratio',
      formula: 'Total Liabilities ÷ Total Assets',
      value: sd(f.totalLiab, f.totalAssets),
      format: '2dp',
      unit: 'x',
      benchmark: '< 0.5 healthy   0.5–0.75 caution   > 0.75 concern',
      explain: 'The proportion of assets financed by creditors rather than owners',
      health: v => v === null ? 'N/A' : v < 0.5 ? 'HEALTHY' : v <= 0.75 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'LEVERAGE & SOLVENCY RATIOS',
      name: 'Equity Multiplier',
      formula: 'Total Assets ÷ Total Equity',
      value: sd(f.totalAssets, f.totalEquity),
      format: '2dp',
      unit: 'x',
      benchmark: '< 2.0 healthy   2.0–4.0 caution   > 4.0 concern',
      explain: 'How many £/$ of assets each £/$ of equity supports — higher means more leverage',
      health: v => v === null ? 'N/A' : v < 2 ? 'HEALTHY' : v <= 4 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'LEVERAGE & SOLVENCY RATIOS',
      name: 'Debt-to-Capitalisation',
      formula: 'Total Liabilities ÷ (Total Liabilities + Total Equity)',
      value: sd(f.totalLiab, f.totalLiab + f.totalEquity),
      format: '1dp',
      unit: '%',
      // multiply by 100 for display
      displayTransform: v => v * 100,
      benchmark: '< 40% healthy   40–60% caution   > 60% concern',
      explain: 'Debt as a share of total capital (debt + equity)',
      health: v => {
        if (v === null) return 'N/A';
        const pv = v * 100;
        return pv < 40 ? 'HEALTHY' : pv <= 60 ? 'WATCH' : 'CONCERN';
      }
    },

    // ── EFFICIENCY ─────────────────────────────────────────────
    {
      category: 'EFFICIENCY RATIOS',
      categoryDesc: 'Measure how well the business uses its assets to generate revenue',
      categoryColor: '#4a3500',
      name: 'Asset Turnover',
      formula: 'Revenue ÷ Total Assets',
      value: sd(f.revenue, f.totalAssets),
      format: '2dp',
      unit: 'x',
      benchmark: '> 1.0 healthy   0.5–1.0 caution   < 0.5 concern',
      explain: 'How many £/$ of revenue each £/$ of assets generates per period',
      health: v => v === null ? 'N/A' : v >= 1 ? 'HEALTHY' : v >= 0.5 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'EFFICIENCY RATIOS',
      name: 'Revenue per £/$ of Equity',
      formula: 'Revenue ÷ Total Equity',
      value: sd(f.revenue, f.totalEquity),
      format: '2dp',
      unit: 'x',
      benchmark: '> 1.5 healthy   0.5–1.5 caution   < 0.5 concern',
      explain: 'How efficiently owner capital is being used to generate sales',
      health: v => v === null ? 'N/A' : v >= 1.5 ? 'HEALTHY' : v >= 0.5 ? 'WATCH' : 'CONCERN'
    },

    // ── CASH FLOW ──────────────────────────────────────────────
    {
      category: 'CASH FLOW RATIOS',
      categoryDesc: 'Measure cash generation quality and sustainability',
      categoryColor: '#2d3748',
      name: 'Operating CF to Sales',
      formula: 'Operating Cash Flow ÷ Revenue',
      value: sd(f.operatingCF, f.revenue),
      format: '2dp',
      unit: 'x',
      benchmark: '> 0.10 healthy   0–0.10 caution   < 0 concern',
      explain: 'How much of each £/$ of revenue becomes operating cash — higher shows quality earnings',
      health: v => v === null ? 'N/A' : v >= 0.10 ? 'HEALTHY' : v >= 0 ? 'WATCH' : 'CONCERN'
    },
    {
      category: 'CASH FLOW RATIOS',
      name: 'Free Cash Flow',
      formula: 'Operating CF + Investing CF',
      value: f.freeCF,
      format: 'currency',
      unit: '',
      benchmark: 'Positive = healthy   Negative = watch context',
      explain: 'Cash left after capital expenditure — funds growth, debt repayment, and dividends',
      health: v => v === null ? 'N/A' : v >= 0 ? 'HEALTHY' : 'WATCH'
    },
    {
      category: 'CASH FLOW RATIOS',
      name: 'Cash Flow Coverage',
      formula: 'Operating CF ÷ Total Liabilities',
      value: sd(f.operatingCF, f.totalLiab),
      format: '2dp',
      unit: 'x',
      benchmark: '> 0.20 healthy   0.10–0.20 caution   < 0.10 concern',
      explain: 'Ability to service all debt obligations from operating cash alone',
      health: v => v === null ? 'N/A' : v >= 0.20 ? 'HEALTHY' : v >= 0.10 ? 'WATCH' : 'CONCERN'
    }
  ];
}

// ── Sheet renderer ─────────────────────────────────────────────

function renderRatiosSheet(ss, ratios, fig, range) {
  const sheet = getOrCreateSheet(ss, 'Financial Ratios');
  const period = formatDate(range.startDate) + ' – ' + formatDate(range.endDate);

  // Column widths
  sheet.setColumnWidth(1, 230); // Ratio name
  sheet.setColumnWidth(2, 235); // Formula
  sheet.setColumnWidth(3, 110); // Value
  sheet.setColumnWidth(4, 220); // Benchmark
  sheet.setColumnWidth(5, 110); // Status

  let r = 1;

  // Title block
  sheet.getRange(r, 1, 1, 5).merge()
    .setValue('FINANCIAL HEALTH RATIOS')
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(14).setHorizontalAlignment('center');
  r++;
  sheet.getRange(r, 1, 1, 5).merge()
    .setValue('Period: ' + period)
    .setBackground('#16213e').setFontColor('#aaaaaa')
    .setFontSize(10).setHorizontalAlignment('center');
  r++;

  // Key figures summary banner
  r++;
  sheet.getRange(r, 1, 1, 5).merge()
    .setValue('KEY FIGURES USED IN CALCULATIONS')
    .setBackground('#2d3748').setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(10);
  r++;

  const figRows = [
    ['Revenue', fig.revenue],        ['Net Income', fig.netIncome],
    ['Gross Profit', fig.grossProfit],['EBITDA', fig.ebitda],
    ['Total Assets', fig.totalAssets],['Total Equity', fig.totalEquity],
    ['Total Liabilities', fig.totalLiab],['Operating Cash Flow', fig.operatingCF],
    ['Current Assets', fig.currentAssets],['Current Liabilities', fig.currentLiab],
    ['Cash', fig.cash],              ['Free Cash Flow', fig.freeCF]
  ];
  for (let i = 0; i < figRows.length; i += 2) {
    const left  = figRows[i];
    const right = figRows[i + 1] || ['', ''];
    sheet.getRange(r, 1).setValue(left[0]).setFontColor('#cccccc').setBackground('#1a2030').setFontSize(9);
    sheet.getRange(r, 2).setValue(typeof left[1] === 'number' ? left[1] : '').setBackground('#1a2030')
      .setFontColor('#e2b96f').setFontSize(9).setNumberFormat('#,##0.00').setHorizontalAlignment('right');
    sheet.getRange(r, 3).setValue(right[0]).setFontColor('#cccccc').setBackground('#1a2030').setFontSize(9);
    sheet.getRange(r, 4, 1, 2).merge().setValue(typeof right[1] === 'number' ? right[1] : '')
      .setBackground('#1a2030').setFontColor('#e2b96f').setFontSize(9)
      .setNumberFormat('#,##0.00').setHorizontalAlignment('right');
    r++;
  }

  // Column headers
  r++;
  const headers = ['Ratio', 'Formula', 'Value', 'Benchmark', 'Status'];
  const headerRange = sheet.getRange(r, 1, 1, 5);
  headerRange.setValues([headers]);
  headerRange.setBackground('#0d3b4f').setFontColor('#ffffff').setFontWeight('bold').setFontSize(10);
  r++;

  // Health colour maps
  const STATUS_STYLE = {
    'HEALTHY': { bg: '#1e4d2b', fg: '#ffffff', label: '✓  Healthy' },
    'WATCH':   { bg: '#7d5a00', fg: '#ffffff', label: '!  Watch'   },
    'CONCERN': { bg: '#7b2d2d', fg: '#ffffff', label: '✗  Concern' },
    'N/A':     { bg: '#444444', fg: '#cccccc', label: '—  N/A'     }
  };

  const ROW_ALT = ['#f8f9fa', '#ffffff'];
  let lastCategory = null;

  ratios.forEach((ratio, idx) => {
    // Category header — print when category changes
    if (ratio.category !== lastCategory) {
      lastCategory = ratio.category;
      // Spacer
      if (idx > 0) r++;
      const catRange = sheet.getRange(r, 1, 1, 5);
      catRange.merge().setValue(ratio.category + (ratio.categoryDesc ? '   –   ' + ratio.categoryDesc : ''));
      catRange.setBackground(ratio.categoryColor || '#333333')
        .setFontColor('#ffffff').setFontWeight('bold').setFontSize(10);
      r++;
    }

    // Calculate display value
    let displayValue = ratio.value;
    if (ratio.displayTransform && displayValue !== null) {
      displayValue = ratio.displayTransform(displayValue);
    }

    // Determine health
    const healthKey = ratio.health(ratio.value);
    const style     = STATUS_STYLE[healthKey] || STATUS_STYLE['N/A'];

    // Row background alternates within a category
    const rowBg = ROW_ALT[idx % 2];

    // Ratio name + explain tooltip via note
    const nameCell = sheet.getRange(r, 1);
    nameCell.setValue(ratio.name).setBackground(rowBg).setFontWeight('bold').setFontSize(10);
    if (ratio.explain) nameCell.setNote(ratio.explain);

    // Formula
    sheet.getRange(r, 2).setValue(ratio.formula)
      .setBackground(rowBg).setFontColor('#555555').setFontStyle('italic').setFontSize(9);

    // Value
    const valCell = sheet.getRange(r, 3);
    if (displayValue === null) {
      valCell.setValue('N/A').setFontColor('#999999');
    } else if (ratio.format === 'currency') {
      valCell.setValue(displayValue).setNumberFormat('#,##0.00')
        .setFontColor(displayValue < 0 ? '#c0392b' : '#000000').setFontWeight('bold');
    } else if (ratio.format === '1dp') {
      valCell.setValue(displayValue)
        .setNumberFormat(ratio.unit === '%' ? '0.0"%"' : '0.0')
        .setFontColor(displayValue < 0 ? '#c0392b' : '#000000').setFontWeight('bold');
    } else {
      valCell.setValue(displayValue)
        .setNumberFormat(ratio.unit === '%' ? '0.00"%"' : '0.00')
        .setFontColor(displayValue < 0 ? '#c0392b' : '#000000').setFontWeight('bold');
    }
    valCell.setBackground(rowBg).setFontSize(11).setHorizontalAlignment('center');

    // Benchmark
    sheet.getRange(r, 4).setValue(ratio.benchmark)
      .setBackground(rowBg).setFontColor('#666666').setFontSize(9).setWrap(true);

    // Status
    const statusCell = sheet.getRange(r, 5);
    statusCell.setValue(style.label)
      .setBackground(style.bg).setFontColor(style.fg)
      .setFontWeight('bold').setFontSize(10).setHorizontalAlignment('center');

    r++;
  });

  // Scorecard summary
  r += 2;
  const healthy = ratios.filter(rt => rt.health(rt.value) === 'HEALTHY').length;
  const watch   = ratios.filter(rt => rt.health(rt.value) === 'WATCH').length;
  const concern = ratios.filter(rt => rt.health(rt.value) === 'CONCERN').length;
  const na      = ratios.filter(rt => rt.health(rt.value) === 'N/A').length;
  const scored  = ratios.length - na;

  sheet.getRange(r, 1, 1, 5).merge()
    .setValue('OVERALL HEALTH SCORECARD')
    .setBackground('#16213e').setFontColor('#e2b96f')
    .setFontWeight('bold').setFontSize(11).setHorizontalAlignment('center');
  r++;

  const scoreData = [
    ['✓  Healthy',  healthy, '#1e4d2b', '#ffffff'],
    ['!  Watch',    watch,   '#7d5a00', '#ffffff'],
    ['✗  Concern',  concern, '#7b2d2d', '#ffffff'],
    ['Total scored', scored, '#0d3b4f', '#ffffff']
  ];
  scoreData.forEach(([label, count, bg, fg]) => {
    sheet.getRange(r, 1, 1, 3).merge().setValue(label)
      .setBackground(bg).setFontColor(fg).setFontWeight('bold').setFontSize(11);
    sheet.getRange(r, 4, 1, 2).merge().setValue(count)
      .setBackground(bg).setFontColor(fg).setFontWeight('bold')
      .setFontSize(14).setHorizontalAlignment('center');
    r++;
  });

  // Overall score percentage
  const scorePct = scored > 0 ? Math.round((healthy / scored) * 100) : 0;
  const scoreMsg = scorePct >= 70 ? 'Good overall health'
                 : scorePct >= 40 ? 'Areas need attention'
                 : 'Significant concerns — review urgently';
  const scoreBg  = scorePct >= 70 ? '#1e4d2b' : scorePct >= 40 ? '#7d5a00' : '#7b2d2d';
  r++;
  sheet.getRange(r, 1, 1, 5).merge()
    .setValue(scorePct + '% of ratios healthy   –   ' + scoreMsg)
    .setBackground(scoreBg).setFontColor('#ffffff')
    .setFontWeight('bold').setFontSize(12).setHorizontalAlignment('center');

  // Freeze header rows and set row heights
  sheet.setFrozenRows(3);
  sheet.setRowHeights(1, r, 22);

  // Footer note
  r += 2;
  sheet.getRange(r, 1, 1, 5).merge()
    .setValue('Note: Hover over any ratio name to see what it measures. Benchmarks are general guidelines — compare against your industry averages for best results.')
    .setFontColor('#999999').setFontSize(8).setWrap(true).setFontStyle('italic');

  ss.setActiveSheet(sheet);
}
