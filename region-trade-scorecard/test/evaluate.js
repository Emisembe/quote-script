/**
 * Calculates the workbook's sheet formulas with HyperFormula (an open-source spreadsheet engine),
 * after building it with the mock. Complements run.js, which cannot evaluate formulas.
 *   npm install hyperformula   (once, in any folder on NODE_PATH)
 *   node region-trade-scorecard/test/evaluate.js [EUROPE|AFRICA]
 *
 * Google-only functions (QUERY, SORT, ARRAY_CONSTRAIN, SPARKLINE, COUNTUNIQUE) are not in
 * HyperFormula; formulas using them are counted as "Google-only" and checked by run.js only.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { HyperFormula } = require('hyperformula');
const { createEnv, colLetter } = require('./mock');

const REGION = (process.argv[2] || 'EUROPE').toUpperCase();
const env = createEnv();
env.state.props.REGION = REGION;
const ctx = vm.createContext(Object.assign({}, env.globals));
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8') +
  '\nthis.__T = { APP, L, REGIONS };', ctx);
ctx.quickStart();
const T = ctx.__T;

let failures = 0, passes = 0;
const check = (c, m) => { if (c) passes++; else { failures++; console.log('FAIL: ' + m); } };

// ------------------------------------------------------------------ build HyperFormula sheets
const GOOGLE_ONLY = /\b(QUERY|SORT|ARRAY_CONSTRAIN|SPARKLINE|COUNTUNIQUE)\(/;
const sheets = env.state.sheets.map(s => s.__sh);
const maxRow = {};
sheets.forEach(sh => {
  let m = 0;
  sh.cells.forEach((v, k) => { m = Math.max(m, Number(k.split(',')[0])); });
  maxRow[sh.name] = m;
});
const named = env.state.named;

/** HyperFormula has no RANK: RANK(x, range) = COUNTIF(range, ">"&x) + 1 (same result for descending rank). */
function rewriteRank(g) {
  let i;
  while ((i = g.search(/\bRANK\(/)) >= 0) {
    let depth = 0, j = i + 4, comma = -1, inStr = false;
    for (; j < g.length; j++) {
      const ch = g[j];
      if (ch === '"') inStr = !inStr;
      if (inStr) continue;
      if (ch === '(') depth++;
      else if (ch === ')') { depth--; if (depth === 0) break; }
      else if (ch === ',' && depth === 1 && comma < 0) comma = j;
    }
    const x = g.slice(i + 5, comma), range = g.slice(comma + 1, j);
    g = g.slice(0, i) + `(COUNTIF(${range},">"&${x})+1)` + g.slice(j + 1);
  }
  return g;
}

function rewrite(f, own) {
  let g = f.slice(1);
  // Named ranges → absolute references.
  Object.keys(named).sort((a, b) => b.length - a.length).forEach(n => {
    const p = named[n];
    const ref = `'${p.sheet}'!$${colLetter(p.c)}$${p.r}` + (p.nr > 1 || p.nc > 1 ? `:$${colLetter(p.c + p.nc - 1)}$${p.r + p.nr - 1}` : '');
    g = g.replace(new RegExp(`(?<![A-Za-z_!$'])${n}(?![A-Za-z_0-9(])`, 'g'), ref);
  });
  // Open-ended ranges (A8:A) → closed ranges up to the sheet's last row.
  g = g.replace(/((?:'[^']+'|[A-Za-z_][A-Za-z0-9_]*)!)?(\$?[A-Z]{1,2}\$?)(\d+):(\$?[A-Z]{1,2})(?![$\d])/g, (m, sh, c1, r1, c2) => {
    const name = sh ? sh.replace(/[!']/g, '') : own;
    const last = Math.max(maxRow[name] || 0, Number(r1)) + 5;
    return `${sh || ''}${c1}${r1}:${c2}${last}`;
  });
  // Whole-column references (A:A) → closed ranges.
  g = g.replace(/((?:'[^']+'|[A-Za-z_][A-Za-z0-9_]*)!)(\$?[A-Z]{1,2}):(\$?[A-Z]{1,2})(?![$\d])/g, (m, sh, c1, c2) => {
    const name = sh.replace(/[!']/g, '');
    return `${sh}${c1}1:${c2}${(maxRow[name] || 1) + 5}`;
  });
  // HyperFormula limits (Google Sheets accepts all of these): a bare TRUE/FALSE argument, doubled quotes
  // inside text, and the thousands separator in TEXT().
  g = g.replace(/"(?:[^"]|"")*"/g, m => m.slice(0, 1) + m.slice(1, -1).replace(/""/g, "'") + m.slice(-1));
  g = g.replace(/([,(])(TRUE|FALSE)(?=[,)])/g, '$1$2()');
  g = g.replace(/"\$#,##0"/g, '"$0"');
  g = rewriteRank(g);
  return '=' + g;
}

const hfSheets = {};
const formulaCells = [];
sheets.forEach(sh => {
  const rows = [];
  let lastCol = 1;
  sh.cells.forEach((v, k) => { lastCol = Math.max(lastCol, Number(k.split(',')[1])); });
  for (let r = 1; r <= maxRow[sh.name]; r++) rows.push(new Array(lastCol).fill(null));
  sh.cells.forEach((v, k) => {
    const [r, c] = k.split(',').map(Number);
    if (typeof v === 'string' && v.charAt(0) === '=') {
      const googleOnly = GOOGLE_ONLY.test(v);
      formulaCells.push({ sheet: sh.name, r, c, f: v, googleOnly });
      rows[r - 1][c - 1] = googleOnly ? '#GOOGLE_ONLY' : rewrite(v, sh.name);
    } else {
      rows[r - 1][c - 1] = v;
    }
  });
  hfSheets[sh.name] = rows;
});

console.log(`Region ${REGION}: ${formulaCells.length} formulas, ${formulaCells.filter(x => x.googleOnly).length} use Google-only functions.`);
const hf = HyperFormula.buildFromSheets(hfSheets, { licenseKey: 'gpl-v3', useArrayArithmetic: true, maxRows: 100000 });
const sid = n => hf.getSheetId(n);
const val = (n, r, c) => hf.getCellValue({ sheet: sid(n), row: r - 1, col: c - 1 });
const isErr = v => v && typeof v === 'object' && v.type;

// ------------------------------------------------------------------ 1. errors in evaluated formulas
const googleCells = new Set(formulaCells.filter(x => x.googleOnly).map(x => `${x.sheet}!${x.r},${x.c}`));
let evaluated = 0;
const errors = [];
formulaCells.filter(x => !x.googleOnly).forEach(x => {
  evaluated++;
  const v = val(x.sheet, x.r, x.c);
  if (isErr(v)) errors.push({ x, v });
});
// An error is expected only if the formula reads a cell whose formula HyperFormula cannot run.
const dependsOnGoogle = x => {
  const deps = hf.getCellPrecedents({ sheet: sid(x.sheet), row: x.r - 1, col: x.c - 1 });
  const seen = new Set();
  const walk = list => list.some(d => {
    const key = JSON.stringify(d);
    if (seen.has(key)) return false;
    seen.add(key);
    if (d.start) {
      const nm = hf.getSheetName(d.start.sheet);
      for (let r = d.start.row; r <= Math.min(d.end.row, d.start.row + 60); r++) {
        for (let c = d.start.col; c <= d.end.col; c++) if (googleCells.has(`${nm}!${r + 1},${c + 1}`)) return true;
      }
      return false;
    }
    const nm = hf.getSheetName(d.sheet);
    if (googleCells.has(`${nm}!${d.row + 1},${d.col + 1}`)) return true;
    return walk(hf.getCellPrecedents(d));
  });
  return walk(deps);
};
const real = errors.filter(e => !dependsOnGoogle(e.x));
real.slice(0, 15).forEach(e => console.log(`   ${e.x.sheet}!${colLetter(e.x.c)}${e.x.r}: ${e.v.type} ${e.v.message || ''} :: ${e.x.f.slice(0, 160)}`));
check(real.length === 0, `${evaluated} formulas calculated; errors not caused by Google-only functions: ${real.length} ` +
  `(errors downstream of Google-only functions, checked in Sheets only: ${errors.length - real.length})`);

// ------------------------------------------------------------------ 2. key live results
const L = T.L;
const R = T.REGIONS[REGION];
const findRow = (sheet, re, col) => {
  for (let r = 1; r <= maxRow[sheet]; r++) {
    const v = val(sheet, r, col || 1);
    if (typeof v === 'string' && re.test(v)) return { r, v };
  }
  return null;
};

// Health_Check live checks.
const hcStart = findRow('Health_Check', /^Check$/);
const hc = [];
for (let r = hcStart.r + 1; ; r++) {
  const label = val('Health_Check', r, 1);
  if (!label || /ALL CHECKS|need attention/.test(String(label))) break;
  hc.push([label, val('Health_Check', r, 2), val('Health_Check', r, 3)]);
}
const summary = findRow('Health_Check', /ALL CHECKS|need attention/);
console.log('   Health_Check summary: ' + (summary ? summary.v : '(not found)'));
hc.forEach(([l, v, s]) => console.log(`   Health_Check: ${String(l).padEnd(52)} ${String(isErr(v) ? v.type : v).slice(0, 60).padEnd(62)} ${isErr(s) ? s.type : s}`));
const evaluable = hc.filter(h => !isErr(h[2]));
const expectCheck = ['Trade data source', 'Enabler data source']; // SAMPLE data is flagged on purpose
evaluable.forEach(([l, , s]) => check(s === 'OK' || s === 'INFO' || expectCheck.indexOf(l) >= 0,
  `Health_Check "${l}" is OK (got ${s})`));
check(evaluable.filter(h => expectCheck.indexOf(h[0]) >= 0).every(h => h[2] === 'CHECK'), 'SAMPLE data is flagged CHECK on the data-source lines, as intended');

// NOW SHOWING lines.
['Country_View', 'Country_Needs', 'Top_Gaps', 'Explain_Score', 'Value_Lost_Charts'].forEach(tab => {
  const f = formulaCells.find(x => x.sheet === tab && /NOW SHOWING/.test(x.f));
  if (!f) { check(false, `${tab} has a NOW SHOWING line`); return; }
  const v = val(tab, f.r, f.c);
  const text = isErr(v) ? (f.googleOnly ? '(uses a Google-only function)' : v.type) : v;
  console.log(`   ${tab}: ${String(text).slice(0, 170)}`);
  if (!f.googleOnly && !dependsOnGoogle(f)) check(typeof v === 'string' && /NOW SHOWING/.test(v), `${tab} NOW SHOWING line calculates`);
});

// Country_View KPIs for the default country.
const cv = findRow('Country_View', /^Exports to the world/);
const exp = val('Country_View', cv.r, 2), imp = val('Country_View', cv.r + 1, 2), share = val('Country_View', cv.r + 4, 2);
console.log(`   Country_View ${R.defaults.country}: exports ${exp}, imports ${imp}, share to region ${share}`);
check(exp > 0 && imp > 0 && share >= 0 && share <= 1, 'Country_View totals calculate for the default country');

// Explain_Score: row found, points add up to the composite score.
const ex = findRow('Explain_Score', /^Row in Scorecard/);
const rowIdx = val('Explain_Score', ex.r, 2);
check(typeof rowIdx === 'number' && rowIdx >= 1, `Explain_Score finds the pre-selected opportunity (row ${rowIdx})`);
const tot = findRow('Explain_Score', /^Composite score$/);
const points = val('Explain_Score', tot.r, 6);
const sc = env.sheet('Scorecard').getRange(L.scoreFirst + rowIdx - 1, 1, 1, 23).getValues()[0];
const composite = val('Scorecard', L.scoreFirst + rowIdx - 1, 21);
console.log(`   Explain_Score: ${sc[1]} → ${sc[3]} · ${sc[5]}: points ${Number(points).toFixed(2)}, composite ${composite}`);
check(Math.abs(points - composite) < 0.11, 'Explain_Score points add up to the Scorecard composite score');

// Composite score formula = weighted average, checked on 200 rows.
const w = T.L && ctx.__T ? null : null; void w;
const weights = [];
for (let i = 0; i < 7; i++) weights.push(val('Settings', L.settingsWeight + i, 2));
const wsum = weights.reduce((a, b) => a + b, 0);
let bad = 0;
const nSc = maxRow.Scorecard - L.scoreFirst + 1;
for (let i = 0; i < Math.min(nSc, 200); i++) {
  const row = env.sheet('Scorecard').getRange(L.scoreFirst + i, 14, 1, 7).getValues()[0];
  const expect = Math.round(row.reduce((a, s, j) => a + s * weights[j], 0) / wsum * 100 * 10) / 10;
  if (Math.abs(val('Scorecard', L.scoreFirst + i, 21) - expect) > 0.051) bad++;
}
check(bad === 0, `Scorecard composite score equals the weighted average of the 7 sub-scores (200 rows checked, ${bad} off)`);
let badVa = 0;
const vaW = []; for (let i = 0; i < 5; i++) vaW.push(val('Settings', L.settingsVa + i, 2));
const vaSum = vaW.reduce((a, b) => a + b, 0);
const nVa = maxRow.VA_Scorecard - L.vaFirst + 1;
for (let i = 0; i < Math.min(nVa, 200); i++) {
  const row = env.sheet('VA_Scorecard').getRange(L.vaFirst + i, 13, 1, 5).getValues()[0];
  const expect = Math.round(row.reduce((a, s, j) => a + s * vaW[j], 0) / vaSum * 100 * 10) / 10;
  if (Math.abs(val('VA_Scorecard', L.vaFirst + i, 18) - expect) > 0.051) badVa++;
}
check(badVa === 0, `VA_Scorecard value-addition score equals the weighted average (${Math.min(nVa, 200)} rows checked, ${badVa} off)`);

// Weight change re-ranks live.
hf.setCellContents({ sheet: sid('Settings'), row: L.settingsWeight + 4 - 1, col: 1 }, [[80]]);
const after = val('Scorecard', L.scoreFirst, 21);
check(typeof after === 'number', `changing a weight on Settings recalculates the Scorecard (first row now ${after})`);

// Country_Needs: indicators, medians and GAP flags.
const cnHead = findRow('Country_Needs', /^Enabler$/);
const nInd = (R.indicators || []).length || 7;
let flags = 0, okc = 0;
for (let i = 1; i <= nInd; i++) {
  const [lab, me, med, st] = [1, 2, 3, 4].map(c => val('Country_Needs', cnHead.r + i, c));
  console.log(`   Country_Needs ${R.defaults.needs}: ${String(lab).padEnd(26)} ${String(me).padEnd(6)} median ${String(isErr(med) ? med.type : med).padEnd(6)} ${st}`);
  check(typeof me === 'number' && typeof med === 'number', `Country_Needs "${lab}" has a value and a median`);
  const lower = (R.indicators ? R.indicators[i - 1][5] : 1) < 0;
  const expectGap = lower ? me > med : me < med;
  check((/^GAP/.test(st)) === expectGap, `Country_Needs "${lab}" GAP flag follows the ${lower ? 'lower' : 'higher'}-is-better rule`);
  if (/^GAP/.test(st)) flags++; else okc++;
}
console.log(`   GAP flags: ${flags}, OK: ${okc}`);

// Dashboard best score per country (MAXIFS).
const dh = findRow('Dashboard', /^ISO3$/);
const best = val('Dashboard', dh.r + 1, 13);
check(typeof best === 'number' && best > 0 && best <= 100, `Dashboard "Best score" calculates (${best})`);

// Charts tab: live weights diagram and score bands.
const cw = findRow('Charts', /^Criterion$/, 2);
const shareSum = [0, 1, 2, 3, 4, 5, 6].reduce((a, i) => a + val('Charts', cw.r + 1 + i, 4), 0);
check(Math.abs(shareSum - 1) < 1e-9, `Charts: live weight shares add up to 100% (${shareSum})`);

// ------------------------------------------------------------------ 3. every chart points at filled data
let chartCount = 0;
env.state.sheets.forEach(s => s.__sh.charts.forEach(ch => {
  chartCount++;
  const spec = ch.spec;
  const title = spec.options.title || `chart at row ${spec.pos[0]}`;
  spec.ranges.forEach((p, i) => {
    const head = s.__sh.cells.get(`${p.r},${p.c}`);
    const firstData = s.__sh.cells.get(`${p.r + 1},${p.c}`);
    let filled = 0, liveFormula = false;
    for (let r = p.r + 1; r < p.r + p.nr; r++) {
      for (let c = p.c; c < p.c + p.nc; c++) {
        const v = s.__sh.cells.get(`${r},${c}`);
        if (v !== undefined && v !== '') filled++;
        if (typeof v === 'string' && v.charAt(0) === '=') liveFormula = true;
      }
    }
    const ok = head !== undefined && head !== '' && (filled > 0);
    if (!ok) console.log(`   ${s.getName()} "${title}" range ${i + 1}: header=${head} first=${firstData} filled=${filled}`);
    check(ok, `${s.getName()}: "${title}" data range ${i + 1} has a header and ${liveFormula ? 'live formulas' : filled + ' filled cells'}`);
  });
}));
console.log(`   ${chartCount} charts checked.`);

console.log(`\n${passes} checks passed, ${failures} failed.`);
process.exit(failures ? 1 : 0);
