/**
 * Runs every menu flow of Code.gs against the mock in mock.js.
 *   node region-trade-scorecard/test/run.js [path/to/old-africa/Code.gs]
 * The optional old Africa v3.x Code.gs enables the "update from an older version" and
 * "Africa gives the same scores as before" tests.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createEnv, calls, colLetter } = require('./mock');

const CODE = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const OLD = process.argv[2] && fs.existsSync(process.argv[2]) ? fs.readFileSync(process.argv[2], 'utf8') : null;

let failures = 0, passes = 0;
const log = [];
function check(cond, msg) {
  if (cond) { passes++; } else { failures++; log.push('FAIL: ' + msg); console.log('FAIL: ' + msg); }
}
function section(t) { console.log('\n== ' + t); }

/** Loads a Code.gs into a fresh context bound to env; exposes consts through __T. */
function load(env, code, isNew) {
  const ctx = vm.createContext(Object.assign({}, env.globals));
  const expose = isNew
    ? '\nthis.__T = { REGIONS, APP, L, CRITERIA, VA_CRITERIA, HS2, TAB_HELP, NEED_LABELS, DEFAULT_INDICATORS, BASE_ABBREVIATIONS };'
    : '\nthis.__T = { APP, L, CRITERIA };';
  vm.runInContext(code + expose, ctx, { filename: isNew ? 'Code.gs' : 'old-Code.gs' });
  return ctx;
}

function values(env, name, firstRow, cols) {
  const sh = env.sheet(name);
  const last = sh.getLastRow();
  if (last < firstRow) return [];
  return sh.getRange(firstRow, 1, last - firstRow + 1, cols).getValues().filter(r => r[0] !== '');
}

// ------------------------------------------------------------------
// Fake network responses
// ------------------------------------------------------------------
function hash(s) { let h = 2166136261; for (const ch of s) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0); }

function fakeNetwork(env, mode) {
  env.state.fetchHandler = (url, o) => {
    if (url.indexOf('comtradeapi.un.org') >= 0) {
      if (mode === 'badkey') return { code: 401, body: 'denied' };
      if (!o.headers || !o.headers['Ocp-Apim-Subscription-Key']) return { code: 401, body: 'no key' };
      const q = {};
      url.split('?')[1].split('&').forEach(kv => { const [k, v] = kv.split('='); q[k] = decodeURIComponent(v); });
      const periods = String(q.period).split(',');
      const partners = String(q.partnerCode).split(',');
      const cmds = q.cmdCode === 'AG2' ? Array.from({ length: 97 }, (_, i) => String(i + 1).padStart(2, '0')).filter(x => x !== '77') : q.cmdCode.split(',');
      const data = [];
      periods.forEach(per => ['X', 'M'].forEach(flow => cmds.forEach(cmd => partners.forEach(pc => {
        const h = hash([q.reporterCode, per, flow, cmd, pc].join('|'));
        if (pc !== '0' && h % 9 !== 0) return; // sparse bilateral
        if (h % 5 === 0) return;
        data.push({ period: Number(per), flowCode: flow, cmdCode: cmd, partnerCode: Number(pc), partner2Code: 0,
          motCode: 0, customsCode: 'C00', primaryValue: (h % 100000) * (pc === '0' ? 5000 : 300) + 1000 });
        if (h % 17 === 0) data.push({ period: Number(per), flowCode: flow, cmdCode: cmd, partnerCode: Number(pc), partner2Code: 0,
          motCode: 1000, customsCode: 'C00', primaryValue: 1 }); // a transport-mode breakdown row that must be ignored
      }))));
      return { code: 200, body: JSON.stringify({ data }) };
    }
    if (url.indexOf('api.worldbank.org') >= 0) {
      const isoList = url.split('/country/')[1].split('/')[0].split(';');
      const ind = url.split('/indicator/')[1].split('?')[0];
      const rows = isoList.filter(iso => hash(iso + ind) % 11 !== 0)
        .map(iso => ({ countryiso3code: iso, value: (hash(iso + ind) % 900) / 10 + 0.5, date: String(2019 + hash(iso) % 5) }));
      return { code: 200, body: JSON.stringify([{ page: 1 }, rows]) };
    }
    return { code: 404, body: 'unknown' };
  };
}

// ------------------------------------------------------------------
// Static checks on formulas and texts
// ------------------------------------------------------------------
function checkFormulas(env, T, label) {
  const tabs = new Set(Object.values(T.APP.sheets));
  let n = 0;
  const bad = [];
  env.state.formulas.forEach(({ sheet, cell, f }) => {
    n++;
    let depth = { '(': 0, '{': 0, '[': 0 }, inStr = false, ok = true;
    const close = { ')': '(', '}': '{', ']': '[' };
    for (let i = 0; i < f.length; i++) {
      const ch = f[i];
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (depth[ch] !== undefined) depth[ch]++;
      else if (close[ch]) { depth[close[ch]]--; if (depth[close[ch]] < 0) ok = false; }
    }
    if (inStr) bad.push(`${sheet}!${cell}: unbalanced double quotes: ${f.slice(0, 140)}`);
    if (!ok || depth['('] || depth['{'] || depth['[']) bad.push(`${sheet}!${cell}: unbalanced brackets: ${f.slice(0, 140)}`);
    const code = f.replace(/"[^"]*"/g, '""');
    if (/undefined|NaN|\[object|null/.test(f)) bad.push(`${sheet}!${cell}: bad token in ${f.slice(0, 140)}`);
    if (/\{[A-Z][A-Z_]*\}/.test(f.replace(/\{B\}/g, ''))) bad.push(`${sheet}!${cell}: unresolved {TOKEN}: ${f.slice(0, 140)}`);
    (code.match(/([A-Za-z][A-Za-z_&]*)!/g) || []).forEach(m => {
      const t = m.slice(0, -1);
      if (!tabs.has(t)) bad.push(`${sheet}!${cell}: unknown tab "${t}" in ${f.slice(0, 120)}`);
    });
    (code.match(/\b(P_[A-Z_0-9]+|VA_WEIGHTS|WEIGHTS)\b/g) || []).forEach(nm => {
      if (!env.state.named[nm]) bad.push(`${sheet}!${cell}: unknown named range ${nm}`);
    });
    (code.match(/\$?[A-Z]{1,2}\$?\d+/g) || []).forEach(ref => {
      const row = Number(ref.replace(/[^0-9]/g, ''));
      if (row < 1 || row > 100000) bad.push(`${sheet}!${cell}: odd row ${ref}`);
    });
    // Functions used must be real Google Sheets functions.
    const known = ['IF', 'IFERROR', 'INDEX', 'MATCH', 'SUM', 'SUMIFS', 'SUMIF', 'COUNTIFS', 'COUNTIF', 'COUNT', 'COUNTA', 'COUNTUNIQUE',
      'FILTER', 'SORT', 'ARRAY_CONSTRAIN', 'ARRAYFORMULA', 'ISNUMBER', 'ROW', 'QUERY', 'VLOOKUP', 'TEXT', 'RANK', 'LOWER', 'SPARKLINE',
      'MAX', 'MIN', 'MAXIFS', 'MEDIAN', 'ROUND', 'TEXTJOIN', 'LEFT', 'SEARCH', 'AND', 'OR', 'TRUE', 'FALSE'];
    (code.match(/\b([A-Z_0-9]+)\(/g) || []).forEach(fn => {
      const name = fn.slice(0, -1);
      if (known.indexOf(name) < 0) bad.push(`${sheet}!${cell}: unknown function ${name}`);
    });
  });
  bad.slice(0, 15).forEach(b => console.log('   ' + b));
  check(bad.length === 0, `${label}: ${n} formulas have balanced brackets/quotes, real tabs, named ranges and functions (${bad.length} problems)`);
  return n;
}

function allTexts(env) {
  return env.state.texts.map(x => x.t)
    .concat(env.state.formulas.map(x => x.f))
    .concat(env.state.menus.map(m => m.title + ' ' + m.items.map(i => i[0]).join(' ')))
    .concat(env.state.toasts).concat(env.state.alerts);
}

function checkTexts(env, label, regionName) {
  const texts = allTexts(env);
  const emoji = texts.filter(t => /\p{Extended_Pictographic}/u.test(t.replace(/[→−–—·×÷≥≤…Σ½]/g, '')));
  emoji.slice(0, 5).forEach(t => console.log('   emoji: ' + t.slice(0, 100)));
  check(emoji.length === 0, `${label}: no emojis in ${texts.length} texts`);
  const tokens = texts.filter(t => /\{[A-Z][A-Z_]*\}/.test(t.replace(/\{B\}/g, '')));
  tokens.slice(0, 5).forEach(t => console.log('   token: ' + t.slice(0, 120)));
  check(tokens.length === 0, `${label}: no unresolved {TOKENS}`);
  const junk = texts.filter(t => /undefined|NaN|\[object Object\]/.test(t));
  junk.slice(0, 5).forEach(t => console.log('   junk: ' + t.slice(0, 120)));
  check(junk.length === 0, `${label}: no "undefined", "NaN" or "[object Object]" in texts`);
  if (regionName === 'Europe') {
    // Listing the other regions you can switch to is allowed; anything else is not.
    const afr = texts.filter(t => /Afric|AfCFTA|\bAU\b|REC\b|ECOWAS|SADC/.test(t.replace(/Available: [^.]*\./, '').replace(/e\.g\. EUROPE, AFRICA/, '')));
    afr.slice(0, 8).forEach(t => console.log('   africa wording: ' + t.slice(0, 140)));
    check(afr.length === 0, `${label}: no Africa wording anywhere in the Europe workbook`);
  }
}

function checkAbbreviations(env, T, R, label) {
  const known = new Set(T.BASE_ABBREVIATIONS.concat(R.abbreviations || []).map(a => a[0]).join(' / ').split(/[\s/]+/));
  R.countries.forEach(c => known.add(c[0]));
  const plain = ['OK', 'CHECK', 'INFO', 'GAP', 'NOW', 'SHOWING', 'SAMPLE', 'DATA', 'WHAT', 'YOU', 'SEE', 'HOW', 'TO', 'READ', 'IT', 'SAY',
    'LIKE', 'THIS', 'WATCH', 'OUT', 'START', 'HERE', 'NOT', 'RESET', 'DELETES', 'ALL', 'RAW', 'MATERIAL', 'LEAVES', 'PROCESSED', 'ABROAD',
    'PRODUCT', 'COMES', 'BACK', 'VALUE', 'LOST', 'FIND', 'GAPS', 'SCORE', 'WEIGHT', 'RANK', 'SELL', 'ASSUMPTION', 'ESTIMATE', 'REAL',
    'REBUILDS', 'COMTRADE', 'OWN', 'NONE', 'ON', 'OFF', 'DO', 'LOWER', 'AND', 'WHY', 'ONE', 'OR', 'IS', 'THE', 'NO', 'WLD', 'USD', 'HS',
    'SUM', 'TRUE', 'FALSE', 'ALREADY', 'A', 'B', 'C', 'D', 'E', 'G', 'I', 'J', 'K', 'N', 'M', 'S', 'U', 'V', 'W', 'X', 'Y', 'T', 'P', 'O',
    'Q', 'R', 'F', 'H', 'L', 'VA', 'KB', 'NEW', 'RCA', 'EU', 'UN', 'API', 'FAQ', 'HS2', 'HS4', 'ISO3', 'M49', 'LPI', 'GDP', 'WDI',
    'ISO', 'PDF', 'DR', 'US', 'HACCP', 'ESG', 'CET', 'FTA', 'CU', 'KPI', 'WITS', 'ITC', 'BACI', 'CEPII', 'UNCTAD', 'WTO', 'MJ', 'PPP',
    'GL', 'EDIT', 'LBMA', 'CE', 'ETS', 'FSC', 'PEFC', 'R&D', 'TCA', 'SAA', 'SAAs', 'DCFTA', 'DCFTAs', 'CEFTA', 'EFTA', 'EEA', 'CIS',
    'EAEU', 'CBAM', 'UNMIK', 'PDO', 'REACH', 'UK', 'CH', 'TR', 'UA', 'MD', 'CU', 'FTAs', 'CSV', 'WWW', 'OECD', 'XLSX', 'EDT', 'AM', 'PM',
    'DEU', 'BTC', 'FOR', 'IN', 'OF', 'BE', 'MAY', 'AS', 'AT', 'BY', 'IF', 'AN', 'IMPORTANT', 'REF', 'WHERE', 'RELATIVE',
    'NOTHING', 'INSIDE', 'TEST', 'BAD', 'ATLANTIS'].concat(Object.keys(T.REGIONS));
  plain.forEach(p => known.add(p));
  const unknown = {};
  env.state.texts.forEach(({ t }) => {
    (t.replace(/\b[A-Z]{2}(\.[A-Z0-9]+)+\b/g, '').match(/\b[A-Z][A-Z0-9&]{1,}s?\b/g) || []).forEach(w => {
      const base = w.replace(/s$/, '');
      if (!known.has(w) && !known.has(base)) unknown[w] = (unknown[w] || 0) + 1;
    });
  });
  const list = Object.keys(unknown);
  if (list.length) console.log('   capitalised words not in the abbreviations list: ' + list.join(', '));
  check(list.length === 0, `${label}: every abbreviation used is in the abbreviations list`);
}

// ------------------------------------------------------------------
// Region data checks
// ------------------------------------------------------------------
function checkRegionData(T) {
  section('Region data blocks');
  const hs2 = new Set(T.HS2.map(h => h[1]));
  Object.keys(T.REGIONS).forEach(key => {
    const R = T.REGIONS[key];
    const isos = R.countries.map(c => c[0]);
    check(new Set(isos).size === isos.length, `${key}: ISO3 codes unique`);
    check(R.countries.every(c => c.length === 10), `${key}: every country row has 10 fields`);
    check(R.countries.every(c => /^[A-Z]{3}$/.test(c[0])), `${key}: ISO3 format`);
    const m49 = R.countries.map(c => c[1]).filter(x => x !== '');
    check(new Set(m49).size === m49.length, `${key}: UN M49 codes unique`);
    const ct = R.countries.map(c => c[2]).filter(x => x !== '');
    check(new Set(ct).size === ct.length, `${key}: UN Comtrade codes unique`);
    check(R.countries.every(c => typeof c[6] === 'number' && typeof c[7] === 'number' && Math.abs(c[6]) <= 90 && Math.abs(c[7]) <= 180),
      `${key}: capital coordinates are numbers in range`);
    check(R.countries.every(c => typeof c[8] === 'boolean' && c[5]), `${key}: landlocked flag and capital name present`);
    const groups = new Set();
    R.countries.forEach(c => String(c[9]).split(/[;,]/).map(s => s.trim()).filter(String).forEach(g => groups.add(g.toUpperCase())));
    const tiers = R.tiers.map(t => t[0]);
    check(R.tiers.every(t => t[1] >= 0 && t[1] <= 1), `${key}: tier scores between 0 and 1`);
    R.agreements.forEach(a => {
      check(a.length === 6, `${key}: agreement ${a[0]} has 6 fields`);
      check(tiers.indexOf(a[2]) >= 0 && tiers.indexOf(a[2]) < tiers.length - 1, `${key}: agreement ${a[0]} uses a real tier (${a[2]})`);
      [a[3], a[4]].forEach(side => String(side).split(/[;,]/).map(s => s.trim()).filter(String).forEach(tok => {
        check(isos.indexOf(tok) >= 0 || groups.has(tok.toUpperCase()), `${key}: agreement ${a[0]} side token "${tok}" is a country or group`);
      }));
    });
    const needKeys = Object.keys(T.NEED_LABELS);
    (R.indicators || T.DEFAULT_INDICATORS).forEach(i => {
      check(i.length === 7 && (i[5] === 1 || i[5] === -1) && i[6].length === 2 && i[6][0] < i[6][1], `${key}: indicator ${i[0]} well-formed`);
      check(needKeys.indexOf(i[3]) >= 0, `${key}: indicator ${i[0]} need key ${i[3]} is known`);
    });
    const raws = {};
    R.chains.forEach((c, i) => {
      check(c.length === 8, `${key}: chain ${i + 1} has 8 fields`);
      check(typeof c[5] === 'number' && c[5] >= 1, `${key}: chain "${c[0]}" multiplier >= 1`);
      [c[2], c[3], c[4]].forEach(codes => String(codes).split(/[^0-9]+/).filter(String).forEach(code => {
        check(/^\d{4}$/.test(code) && Number(code.slice(0, 2)) >= 1 && Number(code.slice(0, 2)) <= 97 && code.slice(0, 2) !== '77',
          `${key}: chain "${c[0]}" HS4 code ${code} valid`);
      }));
      check(String(c[2]).trim() || String(c[3]).trim(), `${key}: chain "${c[0]}" has raw or semi-processed codes`);
      String(c[2]).split(/[^0-9]+/).filter(String).forEach(code => {
        check(!raws[code], `${key}: raw code ${code} used by only one chain (${c[0]} / ${raws[code] || ''})`);
        raws[code] = c[0];
      });
      c[6].split(',').map(s => s.trim()).forEach(k => check(needKeys.indexOf(k) >= 0, `${key}: chain "${c[0]}" need "${k}" is known`));
    });
    check(R.sample.producers.length === R.chains.length && R.sample.processors.length === R.chains.length,
      `${key}: sample producers/processors listed for every chain`);
    R.sample.producers.concat(R.sample.processors).forEach(list => list.forEach(iso =>
      check(isos.indexOf(iso) >= 0, `${key}: sample list uses a listed country (${iso})`)));
    Object.keys(R.sample.size).concat(Object.keys(R.sample.spec)).forEach(iso =>
      check(isos.indexOf(iso) >= 0, `${key}: sample size/spec uses a listed country (${iso})`));
    const names = R.countries.map(c => c[3]);
    ['country', 'exporter', 'importer', 'needs'].forEach(k => check(names.indexOf(R.defaults[k]) >= 0, `${key}: default ${k} is a listed country`));
    check(hs2.has(R.defaults.product), `${key}: default product is an HS2 name`);
    check(R.exampleRows.every(r => r.length === 6), `${key}: example rows have 6 columns`);
  });
  const E = T.REGIONS.EUROPE;
  check(E.countries.length === 42, 'EUROPE: 42 countries');
  const eu = E.countries.filter(c => /\bEU\b/.test(c[9])).length;
  check(eu === 27, `EUROPE: 27 EU members (found ${eu})`);
  check(E.chains.length === 25, `EUROPE: 25 value chains (found ${E.chains.length})`);
  check(T.REGIONS.AFRICA.countries.length === 54, 'AFRICA: 54 countries');
}

// ------------------------------------------------------------------
// Flows
// ------------------------------------------------------------------
function tabsOk(env, T, label) {
  const names = env.state.sheets.map(s => s.getName());
  const want = Object.values(T.APP.sheets);
  check(want.every(n => names.indexOf(n) >= 0), `${label}: all ${want.length} tabs exist`);
  check(names.indexOf('Sheet1') < 0, `${label}: empty Sheet1 removed`);
}

function europeFlows(T0) {
  section('EUROPE — fresh workbook, every menu flow');
  const env = createEnv({ sleepScale: 1 });
  let g = load(env, CODE, true);
  const T = g.__T;
  g.onOpen();
  check(env.state.menus[0].title === 'Europe Trade', 'menu is called "Europe Trade"');
  const menuFns = env.state.menus[0].items.map(i => i[1]);
  menuFns.forEach(fn => check(typeof g[fn] === 'function', `menu item calls an existing function: ${fn}`));

  g.quickStart();
  tabsOk(env, T, 'quick start');
  check(env.state.props.REGION === 'EUROPE', 'region stored in document properties');
  check(env.state.props.APP_VERSION === T.APP.version, 'version stored');
  const L = T.L;
  const raw = values(env, 'Raw_Trade', L.rawFirst, 6);
  check(raw.length > 10000, `sample Raw_Trade rows: ${raw.length}`);
  const isos = new Set(T.REGIONS.EUROPE.countries.map(c => c[0]));
  check(raw.every(r => isos.has(r[1]) && (r[2] === 'WLD' || isos.has(r[2]))), 'sample rows only use European countries');
  const sc = values(env, 'Scorecard', L.scoreFirst, 23);
  check(sc.length > 1000, `Scorecard rows: ${sc.length}`);
  const tiers = T.REGIONS.EUROPE.tiers.map(t => t[0]);
  const tierCount = {};
  sc.forEach(r => { const t = String(r[12]).split(':')[0]; tierCount[t] = (tierCount[t] || 0) + 1; });
  console.log('   market access in Scorecard: ' + JSON.stringify(tierCount));
  check(Object.keys(tierCount).every(t => tiers.indexOf(t) >= 0), 'every Market access label is a Europe tier');
  check(tiers.every(t => tierCount[t] > 0), 'all five Europe tiers occur in the sample Scorecard');
  const pair = (a, b) => sc.find(r => r[0] === a && r[2] === b);
  const expect = [['DEU', 'FRA', 'EU single market'], ['NOR', 'DEU', 'EEA / EFTA'], ['CHE', 'ITA', 'EEA / EFTA'], ['TUR', 'DEU', 'EU–Türkiye customs union'],
    ['GBR', 'FRA', 'Free trade agreement'], ['UKR', 'POL', 'Free trade agreement'], ['SRB', 'ALB', 'Free trade agreement'],
    ['BLR', 'POL', 'Other'], ['UKR', 'SRB', 'Other']];
  expect.forEach(([a, b, t]) => {
    const r = pair(a, b);
    if (r) check(String(r[12]).split(':')[0] === t, `${a} → ${b} market access = ${t} (got ${r[12]})`);
  });
  sc.forEach(r => {
    if (!(r[13] >= 0 && r[13] <= 1 && r[19] >= 0 && r[19] <= 1)) check(false, 'sub-scores within 0–1: ' + r.slice(0, 6).join(','));
  });
  const va = values(env, 'VA_Scorecard', L.vaFirst, 20);
  check(va.length > 50, `VA_Scorecard rows: ${va.length}`);
  check(va.every(r => r[8] >= 0 && r[8] <= 1 && r[16] >= 0 && r[16] <= 1), 'processing share and readiness within 0–1');
  const en = values(env, 'Enablers', L.enFirst, 11);
  check(en.length === 42 && en[0].length === 11, `Enablers: 42 rows × 8 indicators (+ISO, name, years)`);
  const charts = n => env.sheet(n).getCharts().length;
  check(charts('Dashboard') === 2 && charts('Charts') === 6 && charts('Value_Addition') === 3 && charts('Value_Lost_Charts') === 7,
    `charts drawn: Dashboard ${charts('Dashboard')}, Charts ${charts('Charts')}, Value_Addition ${charts('Value_Addition')}, Value_Lost_Charts ${charts('Value_Lost_Charts')}`);
  check(env.sheet('Settings').getRange(env.state.named.P_REGION.r, 2).getValue() === 'Europe', 'Settings shows Region = Europe');
  check(env.state.named.P_ACC_5 && !env.state.named.P_ACC_6, 'five access-score parameters (P_ACC_1…P_ACC_5)');

  // Explain_Score picks the top opportunity.
  const ex = env.sheet('Explain_Score').getRange(T.L.scoreHead === 0 ? 1 : 1, 1, 1, 1);
  void ex;

  section('EUROPE — compute, refresh, auto-refresh, clear');
  g.computeScorecard();
  check(values(env, 'Scorecard', L.scoreFirst, 23).length === sc.length, 'recompute gives the same number of rows');
  g.refreshData();
  check(values(env, 'Raw_Trade', L.rawFirst, 6).length === raw.length, 'Refresh (SAMPLE) regenerates the same sample');
  g.toggleAutoRefresh();
  check(env.state.triggers.filter(t => t.getHandlerFunction() === 'autoRefresh').length === 1, 'auto-refresh ON creates one monthly trigger');
  check(/^ON/.test(env.sheet('Settings').getRange(env.state.named.P_AUTO.r, 2).getValue()), 'Settings shows auto-refresh ON');
  env.state.noUi = true;
  g.autoRefresh();
  env.state.noUi = false;
  check(values(env, 'Scorecard', L.scoreFirst, 23).length > 0, 'autoRefresh handler (no UI) recomputes');
  g.toggleAutoRefresh();
  check(env.state.triggers.length === 0, 'auto-refresh OFF removes the trigger');

  section('EUROPE — update workbook keeps data and settings');
  const st = env.sheet('Settings');
  st.getRange(L.settingsWeight, 2).setValue(33);
  st.getRange(env.state.named.P_ACC_2.r, 2).setValue(0.85);
  env.sheet('Agreements').getRange(L.agrFirst + 30, 1, 1, 6).setValues([['TEST', 'Test agreement', 'Free trade agreement', 'UKR', 'SRB', 'test']]);
  const rawBefore = values(env, 'Raw_Trade', L.rawFirst, 6).length;
  g.upgradeWorkbook();
  check(values(env, 'Raw_Trade', L.rawFirst, 6).length === rawBefore, 'Raw_Trade kept');
  check(env.sheet('Settings').getRange(L.settingsWeight, 2).getValue() === 33, 'edited weight kept');
  check(env.sheet('Settings').getRange(env.state.named.P_ACC_2.r, 2).getValue() === 0.85, 'edited access score kept');
  const agr = values(env, 'Agreements', L.agrFirst, 6);
  check(agr.some(r => r[0] === 'TEST'), 'added agreement kept');
  const sc2 = values(env, 'Scorecard', L.scoreFirst, 23);
  const us = sc2.find(r => r[0] === 'UKR' && r[2] === 'SRB');
  if (us) check(/^Free trade agreement: TEST/.test(us[12]), 'the added agreement changes UKR → SRB to Free trade agreement');
  check(env.state.props.REGION === 'EUROPE', 'region unchanged after update');

  section('EUROPE — clear data, own data, empty refresh');
  g.clearRawTrade();
  check(values(env, 'Raw_Trade', L.rawFirst, 6).length === 0 && values(env, 'Raw_HS4', L.hs4First, 6).length === 0, 'clear empties Raw_Trade and Raw_HS4');
  const before = env.state.alerts.length;
  g.refreshData();
  check(env.state.alerts.slice(before).some(a => /no data yet/i.test(a)), 'Refresh with no data explains what to do');
  g.computeScorecard();
  check(env.state.alerts.slice(before).some(a => /Raw_Trade is empty/.test(a)), 'Compute with no data explains what to do');

  section('EUROPE — UN Comtrade fetch (fake API), resumes in the background');
  fakeNetwork(env, 'ok');
  let before2 = env.state.alerts.length;
  g.fetchComtradeData();
  check(env.state.alerts.slice(before2).some(a => /API key/.test(a)), 'fetch without a key asks for one');
  env.sheet('Settings').getRange(env.state.named.P_API_KEY.r, 2).setValue('test-key');
  const envSlow = env; envSlow.state.clock = 0;
  // Make each sleep cost 40 s so one run covers only a few countries and must continue by trigger.
  const origSleep = env.globals.Utilities.sleep;
  env.state.sleepCost = 40000;
  g.Utilities = env.globals.Utilities;
  const u = env.globals.Utilities.__raw;
  u.sleep = ms => { env.state.clock += Math.max(ms, 40000); };
  g.fetchComtradeData();
  let rounds = 1;
  while (env.state.triggers.some(t => t.getHandlerFunction() === 'continueComtradeFetch') && rounds < 60) {
    env.state.clock += 60000;
    env.state.noUi = true;
    g.continueComtradeFetch();
    env.state.noUi = false;
    rounds++;
  }
  u.sleep = origSleep.__raw || (ms => { env.state.clock += ms; });
  console.log(`   fetch finished after ${rounds} runs`);
  check(rounds > 2, 'the fetch ran in several background chunks');
  const status = String(env.sheet('Settings').getRange(env.state.named.P_STATUS.r, 2).getValue());
  console.log('   status: ' + status);
  check(/^UN Comtrade \(fetched/.test(status), 'data status says UN Comtrade');
  check(/LIE \(no Comtrade code\)/.test(status) && /XKX \(no Comtrade code\)/.test(status), 'Liechtenstein and Kosovo listed as having no Comtrade code');
  const ctUrls = env.state.fetchLog.filter(u2 => /comtradeapi/.test(u2));
  check(ctUrls.some(u2 => /reporterCode=251&/.test(u2)) && ctUrls.some(u2 => /reporterCode=757&/.test(u2)) && ctUrls.some(u2 => /reporterCode=579&/.test(u2)),
    'France, Switzerland and Norway are fetched with their Comtrade codes 251, 757, 579');
  check(!ctUrls.some(u2 => /reporterCode=250&|reporterCode=756&|reporterCode=578&/.test(u2)), 'M49 codes 250/756/578 are not used for Comtrade');
  const raw2 = values(env, 'Raw_Trade', L.rawFirst, 6);
  const hs4 = values(env, 'Raw_HS4', L.hs4First, 6);
  check(raw2.length > 1000 && hs4.length > 100, `Comtrade rows written: HS2 ${raw2.length}, HS4 ${hs4.length}`);
  check(raw2.every(r => r[3] === 'X' || r[3] === 'M') && raw2.every(r => r[5] > 1), 'transport-mode breakdown rows ignored');
  check(raw2.some(r => r[1] === 'FRA') && raw2.some(r => r[2] === 'CHE'), 'Comtrade codes mapped back to ISO3 (FRA, CHE)');
  const wbStatus = String(env.sheet('Settings').getRange(env.state.named.P_WB_STATUS.r, 2).getValue());
  check(/World Bank WDI/.test(wbStatus), 'World Bank indicators fetched after Comtrade: ' + wbStatus);
  check(values(env, 'Scorecard', L.scoreFirst, 23).length > 0, 'Scorecard recomputed from Comtrade data');
  check(env.state.fetchLog.some(u2 => /indicator\/GB\.XPD\.RSDV\.GD\.ZS/.test(u2)) && env.state.fetchLog.some(u2 => /country\/[^/]*XKX/.test(u2)),
    'World Bank request includes the Europe indicators and Kosovo (XKX)');

  section('EUROPE — refresh with Comtrade as source, World Bank alone, stop, bad key');
  g.refreshData();
  let r2 = 0;
  while (env.state.triggers.some(t => t.getHandlerFunction() === 'continueComtradeFetch') && r2 < 60) { g.continueComtradeFetch(); r2++; }
  check(/^UN Comtrade/.test(String(env.sheet('Settings').getRange(env.state.named.P_STATUS.r, 2).getValue())), 'Refresh (COMTRADE) re-downloads');
  g.fetchWorldBankData();
  check(/World Bank WDI/.test(String(env.sheet('Settings').getRange(env.state.named.P_WB_STATUS.r, 2).getValue())), 'menu 2d loads World Bank data');
  const enRows = values(env, 'Enablers', L.enFirst, 11);
  check(enRows.some(r => r[2] === ''), 'missing World Bank values stay blank (not zero)');
  u.sleep = ms => { env.state.clock += 300000; };
  g.fetchComtradeData();
  check(env.state.triggers.some(t => t.getHandlerFunction() === 'continueComtradeFetch'), 'a long fetch schedules a continuation');
  g.stopComtradeFetch();
  check(!env.state.triggers.some(t => t.getHandlerFunction() === 'continueComtradeFetch') && !env.state.props.CT_CURSOR, 'Stop removes the trigger and the cursor');
  u.sleep = ms => { env.state.clock += ms; };
  fakeNetwork(env, 'badkey');
  g.fetchComtradeData();
  check(/rejected/.test(String(env.sheet('Settings').getRange(env.state.named.P_STATUS.r, 2).getValue())), 'a rejected key is reported in the data status');
  fakeNetwork(env, 'ok');

  section('EUROPE — full audit and Health_Check');
  g.loadSampleData();
  g.computeScorecard();
  g.runFullAudit();
  const hc = values(env, 'Health_Check', 1, 4).map(r => String(r[0]));
  check(hc.some(t => /^Audit run .*no problems found/.test(t)), 'full audit finds no problems');

  // Broken edits on the input tabs must be reported by the audit (checks built into Code.gs).
  const agRow = L.agrFirst + 40;
  env.sheet('Agreements').getRange(agRow, 1, 1, 6).setValues([['BAD', 'Broken row', 'Customs heaven', 'EU', 'ATLANTIS', 'test']]);
  const chRow = L.chainsFirst + 30;
  env.sheet('Value_Chains').getRange(chRow, 1, 1, 8).setValues([['Bad chain', 'Metals', '7702', '', '9999', 0.5, 'magic', '']]);
  g.runFullAudit();
  const probs = values(env, 'Health_Check', 1, 4).map(r => r.join(' | '));
  check(probs.some(t => /Customs heaven/.test(t)), 'audit reports an agreement with an unknown tier');
  check(probs.some(t => /ATLANTIS/.test(t)), 'audit reports an agreement side that is not a country or group');
  check(probs.some(t => /7702/.test(t)) && probs.some(t => /multiplier below 1/.test(t)) && probs.some(t => /Unknown need "magic"/.test(t)),
    'audit reports a bad HS4 code, a multiplier below 1 and an unknown need');
  env.sheet('Agreements').getRange(agRow, 1, 1, 6).setValues([['', '', '', '', '', '']]);
  env.sheet('Value_Chains').getRange(chRow, 1, 1, 8).setValues([['', '', '', '', '', '', '', '']]);
  g.runFullAudit();
  check(values(env, 'Health_Check', 1, 4).some(r => /no problems found/.test(String(r[0]))), 'audit is clean again after removing the broken rows');

  checkFormulas(env, T, 'EUROPE');
  checkTexts(env, 'EUROPE', 'Europe');
  checkAbbreviations(env, T, T.REGIONS.EUROPE, 'EUROPE');

  section('EUROPE — reset');
  g.buildWorkbook();
  check(values(env, 'Raw_Trade', L.rawFirst, 6).length === 0, 'Reset deletes data');
  check(env.sheet('Settings').getRange(env.state.named.P_API_KEY.r, 2).getValue() === 'test-key', 'Reset keeps the API key');
  return env;
}

function switchFlow() {
  section('SWITCH REGION — Europe → Africa → Europe');
  const env = createEnv();
  const g = load(env, CODE, true);
  const T = g.__T;
  g.quickStart();
  env.sheet('Settings').getRange(T.L.settingsWeight + 2, 2).setValue(40);
  env.state.promptAnswer = 'narnia';
  g.switchRegion();
  check(env.state.props.REGION === 'EUROPE', 'an unknown region is refused');
  env.state.promptAnswer = ' africa ';
  g.switchRegion();
  check(env.state.props.REGION === 'AFRICA', 'switched to AFRICA');
  check(values(env, 'Countries', T.L.ctryFirst, 10).length === 54, 'Countries now lists 54 African countries');
  check(values(env, 'Raw_Trade', T.L.rawFirst, 6).length === 0, 'trade data cleared on switch');
  check(env.sheet('Settings').getRange(T.L.settingsWeight + 2, 2).getValue() === 40, 'weights kept on switch');
  check(env.state.named.P_ACC_4 && !env.state.named.P_ACC_5, 'Africa has four access-score parameters');
  g.onOpen();
  check(env.state.menus[env.state.menus.length - 1].title === 'Africa Trade', 'menu becomes "Africa Trade"');
  env.state.promptAnswer = 'EUROPE';
  const g2 = load(env, CODE, true); // a new execution (fresh globals), as after a reload
  g2.switchRegion();
  check(env.state.props.REGION === 'EUROPE' && values(env, 'Countries', T.L.ctryFirst, 10).length === 42, 'switched back to Europe');
}

function africaFlows() {
  section('AFRICA — same results as the Africa Trade Scorecard v3.2 (sample data)');
  const envNew = createEnv();
  envNew.state.props.REGION = 'AFRICA';
  const g = load(envNew, CODE, true);
  const T = g.__T;
  g.quickStart();
  tabsOk(envNew, T, 'Africa quick start');
  checkFormulas(envNew, T, 'AFRICA');
  checkTexts(envNew, 'AFRICA', 'Africa');
  checkAbbreviations(envNew, T, T.REGIONS.AFRICA, 'AFRICA');
  g.runFullAudit();
  check(values(envNew, 'Health_Check', 1, 4).some(r => /^Audit run .*no problems found/.test(String(r[0]))), 'Africa full audit finds no problems');
  if (!OLD) { console.log('   (old Africa Code.gs not given: comparison skipped)'); return; }

  const envOld = createEnv();
  const o = load(envOld, OLD, false);
  o.quickStart();
  const O = o.__T;
  const oldSc = values(envOld, 'Scorecard', O.L.scoreFirst, 23);
  const newSc = values(envNew, 'Scorecard', T.L.scoreFirst, 23);
  check(oldSc.length === newSc.length, `same number of opportunities (old ${oldSc.length}, new ${newSc.length})`);
  let diff = 0, labelDiff = 0;
  for (let i = 0; i < Math.min(oldSc.length, newSc.length); i++) {
    for (let j = 0; j < 23; j++) {
      if (j === 12) { if (oldSc[i][j] !== newSc[i][j]) labelDiff++; continue; }
      if (oldSc[i][j] !== newSc[i][j]) { if (diff < 3) console.log(`   diff row ${i} col ${j}: ${oldSc[i][j]} vs ${newSc[i][j]}`); diff++; }
    }
  }
  check(diff === 0, `Scorecard values identical to v3.2 (${diff} differing cells)`);
  console.log(`   market-access labels that differ only in wording (EAC/ECOWAS customs-union names): ${labelDiff}`);
  const oldVa = values(envOld, 'VA_Scorecard', O.L.vaFirst || 0, 20);
  const newVa = values(envNew, 'VA_Scorecard', T.L.vaFirst, 20);
  let vdiff = 0;
  for (let i = 0; i < Math.min(oldVa.length, newVa.length); i++) {
    for (let j = 0; j < 20; j++) if (j !== 17 && j !== 18 && oldVa[i][j] !== newVa[i][j]) vdiff++;
  }
  check(oldVa.length === newVa.length && vdiff === 0, `VA_Scorecard identical to v3.2 (${oldVa.length} vs ${newVa.length} rows, ${vdiff} differing cells)`);

  section('UPDATE FROM AN OLDER VERSION — Africa v3.2 workbook, then paste the new code');
  const st = envOld.sheet('Settings');
  const oldParamRow = n => envOld.state.named[n].r;
  st.getRange(oldParamRow('P_ACC_CU'), 2).setValue(0.95);
  st.getRange(oldParamRow('P_ACC_AFCFTA'), 2).setValue(0.55);
  st.getRange(oldParamRow('P_YEAR'), 2).setValue(2023);
  st.getRange(O.L.settingsWeight + 1, 2).setValue(17);
  st.getRange(oldParamRow('P_API_KEY'), 2).setValue('kept-key');
  const oldRaw = values(envOld, 'Raw_Trade', O.L.rawFirst, 6).length;
  const oldHs4 = values(envOld, 'Raw_HS4', O.L.hs4First, 6).length;
  const oldEn = values(envOld, 'Enablers', O.L.enFirst, 10);
  const oldCtry = values(envOld, 'Countries', O.L.ctryFirst, 10);
  // Edit a membership in the old workbook: it must survive the update.
  const civRow = oldCtry.findIndex(r => r[0] === 'CIV');
  envOld.sheet('Countries').getRange(O.L.ctryFirst + civRow, 9).setValue('ECOWAS;COMESA');

  envOld.state.formulas = []; envOld.state.texts = []; envOld.state.menus = [];
  const n = load(envOld, CODE, true);
  n.onOpen();
  check(envOld.state.menus[0].title === 'Africa Trade', 'old Africa workbook opens with the "Africa Trade" menu (region detected)');
  check(envOld.state.toasts.some(t => /New code detected/.test(t) || /version 4/.test(t)), 'reminder to run Update appears');
  n.upgradeWorkbook();
  const T2 = n.__T;
  tabsOk(envOld, T2, 'after update');
  check(envOld.state.props.REGION === 'AFRICA', 'region stored as AFRICA after the update');
  check(values(envOld, 'Raw_Trade', T2.L.rawFirst, 6).length === oldRaw, `Raw_Trade kept (${oldRaw} rows)`);
  check(values(envOld, 'Raw_HS4', T2.L.hs4First, 6).length === oldHs4, `Raw_HS4 kept (${oldHs4} rows)`);
  check(values(envOld, 'Enablers', T2.L.enFirst, 10).length === oldEn.length, 'Enablers kept');
  const p = nm => envOld.sheet('Settings').getRange(envOld.state.named[nm].r, 2).getValue();
  check(p('P_ACC_1') === 0.95 && p('P_ACC_3') === 0.55, `old access scores moved to the new tiers (${p('P_ACC_1')}, ${p('P_ACC_3')})`);
  check(p('P_API_KEY') === 'kept-key', 'API key kept');
  check(p('P_REGION') === 'Africa', 'Settings shows Region = Africa');
  check(envOld.sheet('Settings').getRange(T2.L.settingsWeight + 1, 2).getValue() === 17, 'edited weight kept');
  const newCtry = values(envOld, 'Countries', T2.L.ctryFirst, 10);
  const civ = newCtry.find(r => r[0] === 'CIV');
  check(newCtry.length === 54 && civ && civ[5] === 'Yamoussoukro' && /COMESA/.test(civ[9]) && /AfCFTA/.test(civ[9]),
    'Countries converted to the new layout, capital added, edited membership kept');
  const agr = values(envOld, 'Agreements', T2.L.agrFirst, 6);
  check(agr.length === T2.REGIONS.AFRICA.agreements.length, 'Agreements tab filled with the Africa agreements');
  const upSc = values(envOld, 'Scorecard', T2.L.scoreFirst, 23);
  check(upSc.length > 0, `Scorecard recomputed after the update (${upSc.length} rows)`);
  checkFormulas(envOld, T2, 'AFTER UPDATE');
  n.runFullAudit();
  check(values(envOld, 'Health_Check', 1, 4).some(r => /^Audit run .*no problems found/.test(String(r[0]))), 'audit after update finds no problems');
}

// ------------------------------------------------------------------
const t0 = load(createEnv(), CODE, true).__T;
checkRegionData(t0);
europeFlows(t0);
switchFlow();
africaFlows();

section('Apps Script members used (all on the whitelist of real methods)');
console.log('   ' + Object.keys(calls).sort().join(', '));
console.log(`\n${passes} checks passed, ${failures} failed.`);
process.exit(failures ? 1 : 0);
