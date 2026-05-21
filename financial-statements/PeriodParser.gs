// ============================================================
// PERIOD PARSER
// Single-prompt natural language period input.
// Understands quarters, months, years, half-years, relative
// terms, and custom ranges — no YYYY-MM-DD required.
// ============================================================

const MONTHS = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8,
  sep:9, oct:10, nov:11, dec:12
};

// ── Main entry point ───────────────────────────────────────────

// Shows the combined sheet-picker + period-input dialog.
// Returns { startDate, endDate, sheetName } or null if cancelled.
function promptPeriodAndSheet() {
  const ui  = SpreadsheetApp.getUi();
  const ss  = SpreadsheetApp.getActiveSpreadsheet();

  // ── Step 1: pick the data sheet ──────────────────────────
  const sheetName = pickDataSheet(ui, ss);
  if (!sheetName) return null;

  // ── Step 2: type the period ───────────────────────────────
  const resp = ui.prompt(
    '📅  Enter Period',
    'Type any of the following:\n\n' +
    '  Q1 2025       Q2 2024       Q3      Q4\n' +
    '  H1 2025       H2 2024\n' +
    '  January 2025  Feb 2024      March\n' +
    '  2024          2025\n' +
    '  last month    last quarter  last year\n' +
    '  this month    this quarter  this year\n' +
    '  Jan to Mar 2025\n' +
    '  January 2024 to June 2024\n' +
    '  2025-01-01 to 2025-06-30',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return null;

  const input = resp.getResponseText().trim();
  if (!input) { ui.alert('No period entered.'); return null; }

  const range = parsePeriod(input);
  if (!range) {
    ui.alert(
      'Could not understand "' + input + '".\n\n' +
      'Try examples like: Q1 2025  |  January 2024  |  2024  |  last quarter  |  Jan to Mar 2025'
    );
    return null;
  }

  return { startDate: range.startDate, endDate: range.endDate, sheetName: sheetName };
}

// ── Sheet picker ───────────────────────────────────────────────

// Lists available Form Response sheets and lets the user choose.
// Returns the sheet name string, or null if cancelled.
function pickDataSheet(ui, ss) {
  const allSheets = ss.getSheets().map(s => s.getName());

  // Auto-collect candidates: any sheet starting with "Form Responses"
  const candidates = allSheets.filter(n => n.startsWith('Form Responses'));

  if (candidates.length === 0) {
    ui.alert(
      'No data sheet found.\n\n' +
      'Please run Setup: Create Data-Entry Form first, then submit at least one transaction.'
    );
    return null;
  }

  if (candidates.length === 1) return candidates[0]; // only one — skip the dialog

  // Multiple sheets: ask user to pick
  const resp = ui.prompt(
    '📋  Select Data Sheet',
    'Multiple Form Response sheets found. Type the number of the sheet to use:\n\n' +
    candidates.map((n, i) => '  ' + (i + 1) + '.  ' + n).join('\n') +
    '\n\nOr type the full sheet name:',
    ui.ButtonSet.OK_CANCEL
  );
  if (resp.getSelectedButton() !== ui.Button.OK) return null;

  const raw = resp.getResponseText().trim();
  const idx = parseInt(raw, 10);

  if (!isNaN(idx) && idx >= 1 && idx <= candidates.length) {
    return candidates[idx - 1];
  }
  if (allSheets.includes(raw)) {
    return raw;
  }
  ui.alert('"' + raw + '" does not match any sheet. Try again.');
  return null;
}

// ── Period parser ──────────────────────────────────────────────

// Returns { startDate, endDate } or null.
function parsePeriod(raw) {
  const s = raw.toLowerCase().replace(/\s+/g, ' ').trim();
  const now = new Date();
  const yr  = now.getFullYear();

  // ── Relative shorthand ──────────────────────────────────
  if (s === 'this month')    return currentMonthRange();
  if (s === 'this quarter')  return currentQuarterRange();
  if (s === 'this year')     return currentYearRange();

  if (s === 'last month') {
    const m = now.getMonth() === 0
      ? new Date(yr - 1, 11, 1)
      : new Date(yr, now.getMonth() - 1, 1);
    const e = new Date(m.getFullYear(), m.getMonth() + 1, 0, 23, 59, 59);
    return { startDate: m, endDate: e };
  }
  if (s === 'last quarter') {
    const q  = Math.floor(now.getMonth() / 3);
    const pq = q === 0 ? 3 : q - 1;
    const py = q === 0 ? yr - 1 : yr;
    return quarterRange(pq + 1, py);
  }
  if (s === 'last year') {
    return yearRange(yr - 1);
  }

  // ── Full year: "2024" ────────────────────────────────────
  if (/^\d{4}$/.test(s)) {
    return yearRange(parseInt(s, 10));
  }

  // ── Quarter: "Q1", "Q1 2025", "q3 2024" ─────────────────
  const qMatch = s.match(/^q([1-4])(?:\s+(\d{4}))?$/);
  if (qMatch) {
    const q = parseInt(qMatch[1], 10);
    const y = qMatch[2] ? parseInt(qMatch[2], 10) : yr;
    return quarterRange(q, y);
  }

  // ── Half-year: "H1 2025", "h2 2024" ─────────────────────
  const hMatch = s.match(/^h([12])(?:\s+(\d{4}))?$/);
  if (hMatch) {
    const h = parseInt(hMatch[1], 10);
    const y = hMatch[2] ? parseInt(hMatch[2], 10) : yr;
    if (h === 1) return { startDate: d(y, 1, 1), endDate: d(y, 6, 30) };
    return { startDate: d(y, 7, 1), endDate: d(y, 12, 31) };
  }

  // ── Single month: "January", "Jan", "March 2024" ─────────
  const mMatch = s.match(/^([a-z]+)(?:\s+(\d{4}))?$/);
  if (mMatch && MONTHS[mMatch[1]]) {
    const m = MONTHS[mMatch[1]];
    const y = mMatch[2] ? parseInt(mMatch[2], 10) : yr;
    return monthRange(m, y);
  }

  // ── YYYY-MM or YYYY-MM-DD exact ───────────────────────────
  const yymm = s.match(/^(\d{4})-(\d{2})$/);
  if (yymm) return monthRange(parseInt(yymm[2], 10), parseInt(yymm[1], 10));

  const yymmdd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (yymmdd) {
    const sd = new Date(parseInt(yymmdd[1]), parseInt(yymmdd[2]) - 1, parseInt(yymmdd[3]));
    sd.setHours(0, 0, 0, 0);
    const ed = new Date(sd); ed.setHours(23, 59, 59, 999);
    return { startDate: sd, endDate: ed };
  }

  // ── Range with "to" or "–" ────────────────────────────────
  // Normalise dash variants to "to"
  const normalised = s.replace(/\s*[–—-]\s*/g, ' to ');
  const toIdx = normalised.indexOf(' to ');
  if (toIdx !== -1) {
    const leftRaw  = normalised.slice(0, toIdx).trim();
    const rightRaw = normalised.slice(toIdx + 4).trim();
    return parseRangeExpression(leftRaw, rightRaw, yr);
  }

  return null;
}

// ── Range expression resolver ─────────────────────────────────

// Handles: "Jan 2025 to Jun 2025", "Q1 to Q3 2024",
//          "2025-01-01 to 2025-06-30", "January to March 2025"
function parseRangeExpression(leftRaw, rightRaw, defaultYear) {
  // Each side can carry its own year; if left has no year, borrow from right
  const rightYear = extractYear(rightRaw) || defaultYear;
  const leftYear  = extractYear(leftRaw)  || rightYear;

  const startRange = parseSingleBound(leftRaw,  leftYear,  'start');
  const endRange   = parseSingleBound(rightRaw, rightYear, 'end');

  if (!startRange || !endRange) return null;
  return { startDate: startRange, endDate: endRange };
}

function extractYear(s) {
  const m = s.match(/\d{4}/);
  return m ? parseInt(m[0], 10) : null;
}

// Parses one side of a range ("Jan 2025", "Q1", "2025-06-30", "March")
// Returns a Date for the start or end of that period.
function parseSingleBound(s, year, side) {
  const clean = s.replace(/\d{4}/, '').trim().toLowerCase();

  // Exact date YYYY-MM-DD
  const exact = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (exact) {
    const dt = new Date(parseInt(exact[1]), parseInt(exact[2]) - 1, parseInt(exact[3]));
    dt.setHours(side === 'start' ? 0 : 23, side === 'start' ? 0 : 59, side === 'start' ? 0 : 59);
    return dt;
  }

  // Quarter
  const qm = clean.match(/^q([1-4])$/);
  if (qm) {
    const r = quarterRange(parseInt(qm[1], 10), year);
    return side === 'start' ? r.startDate : r.endDate;
  }

  // Month name
  const mm = clean.match(/^([a-z]+)$/);
  if (mm && MONTHS[mm[1]]) {
    const r = monthRange(MONTHS[mm[1]], year);
    return side === 'start' ? r.startDate : r.endDate;
  }

  // Full year
  if (/^\d{4}$/.test(s.trim())) {
    const r = yearRange(parseInt(s.trim(), 10));
    return side === 'start' ? r.startDate : r.endDate;
  }

  return null;
}

// ── Low-level date builders ────────────────────────────────────

function d(year, month, day) {
  const dt = new Date(year, month - 1, day);
  dt.setHours(0, 0, 0, 0);
  return dt;
}

function quarterRange(q, year) {
  const startMonth = (q - 1) * 3 + 1;
  const endMonth   = q * 3;
  return {
    startDate: d(year, startMonth, 1),
    endDate:   new Date(year, endMonth, 0, 23, 59, 59)
  };
}

function monthRange(month, year) {
  return {
    startDate: d(year, month, 1),
    endDate:   new Date(year, month, 0, 23, 59, 59)
  };
}

function yearRange(year) {
  return {
    startDate: d(year, 1, 1),
    endDate:   new Date(year, 11, 31, 23, 59, 59)
  };
}
