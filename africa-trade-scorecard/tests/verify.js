const m = require('./mock.js'); const c = m.ctx; const { fromMock, isErr } = require('./sheetsim.js');
const vm = require('vm'); const K = n => vm.runInContext(n, c); const L = c.L;
c.quickStart(); c.setParam_('P_MAX_ROWS', 1500); c.computeScorecard();
const sim = fromMock(m); sim.run();
const S = n => m.sheets.find(s => s.name === n);
const V = (sh, r, col) => sim.value(sh, r, col);
let fails = 0, oks = 0;
const ok = (cond, msg) => { if (cond) oks++; else { fails++; console.log('FAIL:', msg); } };
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 0.101); // allows ROUND ties (e.g. 33.05)

// 1. Scorecard composite = weighted average of sub-scores
const w = K('CRITERIA').map((x, i) => S('Settings').get(L.settingsWeight + i, 2)); const ws = w.reduce((a, b) => a + b);
const nsc = S('Scorecard').getLastRow() - L.scoreHead;
for (let r = L.scoreFirst; r < L.scoreFirst + nsc; r += 37) {
  const exp = Math.round([14, 15, 16, 17, 18, 19, 20].reduce((a, col, i) => a + S('Scorecard').get(r, col) * w[i], 0) / ws * 1000) / 10;
  ok(near(V('Scorecard', r, 21), exp), `Scorecard U${r} ${V('Scorecard', r, 21)} vs ${exp}`);
}
const comps = []; for (let r = L.scoreFirst; r < L.scoreFirst + nsc; r++) comps.push([V('Scorecard', r, 21), r]);
comps.sort((a, b) => b[0] - a[0]);

// 2. Top_Gaps
const TT = c.top_('top'), F = TT + 6;
let n = 0; const sc = []; while (V('Top_Gaps', F + n, 9) !== null && typeof V('Top_Gaps', F + n, 9) === 'number') { sc.push(V('Top_Gaps', F + n, 9)); n++; }
ok(n === 50, `Top_Gaps rows ${n} (expected 50)`);
ok(sc.every((x, i) => !i || sc[i - 1] >= x), 'Top_Gaps sorted by score');
ok(near(sc[0], comps[0][0]), `Top_Gaps #1 score ${sc[0]} = best composite ${comps[0][0]}`);
ok(V('Top_Gaps', F, 1) === 1 && V('Top_Gaps', F + 49, 1) === 50, 'Top_Gaps rank column 1..50');
ok(/NOW SHOWING: 50 opportunities/.test(V('Top_Gaps', TT + 3, 4)), 'Top_Gaps NOW SHOWING: ' + V('Top_Gaps', TT + 3, 4));

// 3. Explain_Score
const TE = c.top_('explain'), idx = V('Explain_Score', TE + 3, 2);
ok(typeof idx === 'number', 'Explain_Score found row ' + idx);
const H = TE + 9, tot = H + 8;
let pts = 0; for (let i = 1; i <= 7; i++) pts += V('Explain_Score', H + i, 6);
const compE = V('Scorecard', L.scoreFirst + idx - 1, 21);
ok(near(pts, compE, 0.06), `Explain points ${pts.toFixed(2)} = composite ${compE}`);
ok(near(V('Explain_Score', tot, 5), 1, 1e-9), 'Explain share of weight sums to 100%');
ok(/rank 1 of/.test(V('Explain_Score', TE + 4, 1)), 'Explain NOW SHOWING rank: ' + V('Explain_Score', TE + 4, 1));
ok(/Strongest factor/.test(V('Explain_Score', tot + 2, 1)), 'Explain strongest/weakest line');

// 4. Country_View (Nigeria)
const TC = c.top_('country'), raw = S('Raw_Trade'); const rows = [];
for (let r = L.rawFirst; r <= raw.getLastRow(); r++) rows.push([1, 2, 3, 4, 5, 6].map(k => raw.get(r, k)));
const sumRaw = f => rows.filter(f).reduce((a, x) => a + x[5], 0);
ok(near(V('Country_View', TC + 3, 2), sumRaw(x => x[0] === 2023 && x[1] === 'NGA' && x[2] === 'WLD' && x[3] === 'X'), 1), 'Country_View Nigeria exports');
ok(near(V('Country_View', TC + 6, 2), sumRaw(x => x[0] === 2023 && x[1] === 'NGA' && x[2] !== 'WLD' && x[3] === 'X'), 1), 'Country_View Nigeria exports to Africa');
ok(V('Country_View', TC + 11, 1) === 'HS2' && typeof V('Country_View', TC + 12, 2) === 'number' && V('Country_View', TC + 12, 3) !== '', 'Country_View top exports QUERY + names: ' + V('Country_View', TC + 12, 3));
ok(typeof V('Country_View', TC + 26, 2) === 'number' && String(V('Country_View', TC + 26, 3)).length > 2, 'Country_View African buyers: ' + V('Country_View', TC + 26, 3));
ok(typeof V('Country_View', TC + 40, 3) === 'number', 'Country_View best opportunities to sell');
ok(/NOW SHOWING: Nigeria/.test(V('Country_View', TC + 2, 1)), 'Country_View NOW SHOWING');

// 5. Dashboard best score per country = max composite of that exporter
const TD = c.top_('dashboard'); for (let r = TD + 7; r < TD + 12; r++) {
  const iso = V('Dashboard', r, 1); let mx = 0; for (let q = L.scoreFirst; q < L.scoreFirst + nsc; q++) if (S('Scorecard').get(q, 1) === iso) mx = Math.max(mx, V('Scorecard', q, 21));
  ok(near(V('Dashboard', r, 13), mx), `Dashboard best score ${iso}`);
}

// 6. Charts tab: live tables
const G0 = c.chartsGridTop_(); let bandsRow = null, topRow = null;
for (let r = G0; r < G0 + 120; r++) { const v = S('Charts').get(r, 14); if (/score bands/.test(v)) bandsRow = r; if (/top 15 opportunities/.test(v)) topRow = r; }
let bandSum = 0; for (let i = 0; i < 10; i++) bandSum += V('Charts', bandsRow + 2 + i, 15);
ok(bandSum === nsc, `Charts score bands sum ${bandSum} = ${nsc}`);
ok(near(V('Charts', topRow + 2, 15), comps[0][0]) && /→/.test(V('Charts', topRow + 2, 14)), 'Charts live top 15: ' + V('Charts', topRow + 2, 14));
const W0 = c.top_('charts') + 6; let share = 0; for (let i = 0; i < 7; i++) share += V('Charts', W0 + 2 + i, 4); ok(near(share, 1, 1e-9), 'Charts weight shares = 100%');

// 7. Value_Addition best VA score & VA composite
const va = S('VA_Scorecard'), nva = va.getLastRow() - L.vaHead;
const vw = K('VA_CRITERIA').map((x, i) => S('Settings').get(L.settingsVa + i, 2)); const vws = vw.reduce((a, b) => a + b);
for (let r = L.vaFirst; r < L.vaFirst + nva; r += 41) { const e = Math.round([13, 14, 15, 16, 17].reduce((a, col, i) => a + va.get(r, col) * vw[i], 0) / vws * 1000) / 10; ok(near(V('VA_Scorecard', r, 18), e), `VA score R${r}`); }
ok(typeof V('Value_Addition', c.top_('vaSummary') + 7, 12) === 'number', 'Value_Addition best VA score');

// 7b. Estimated revenue (VA column W) = H*home + U*Africa + V*outside, and it is live
const sh = k => c.getParam_(k);
const revOk = () => { for (let r = L.vaFirst; r < L.vaFirst + nva; r += 29) { const e = Math.round(va.get(r, 8) * sh('P_SH_HOME') + va.get(r, 21) * sh('P_SH_AF') + va.get(r, 22) * sh('P_SH_EXT')); if (!near(V('VA_Scorecard', r, 23), e, 1)) return `row ${r}: ${V('VA_Scorecard', r, 23)} vs ${e}`; } return true; };
ok(revOk() === true, 'Estimated revenue formula ' + revOk());
c.setParam_('P_SH_AF', 0.2); sim.run(8, ['VA_Scorecard']);
ok(revOk() === true, 'Estimated revenue follows a new Africa share (20%) ' + revOk());
c.setParam_('P_SH_AF', 0.1); sim.run(8, ['VA_Scorecard']);
const G2 = c.mkGridTop_(); ok(typeof V('Market_Opportunity', G2 + 1, 3) === 'number' && V('Market_Opportunity', G2 + 1, 5) >= V('Market_Opportunity', G2 + 2, 5), 'Market table filled and sorted by outside-Africa imports');
ok(/Target share|capture 25%/.test(V('Market_Opportunity', c.top_('market') + 1, 1)), 'Market assumptions line: ' + V('Market_Opportunity', c.top_('market') + 1, 1));

// 8/9. Country pickers across ALL countries
const names = K('COUNTRIES').map(x => x[2]);
const setCell = (sheet, r, col, v) => S(sheet).set(r, col, v);
const Vc = c.vlcLayout_();
const TN = c.top_('needs');
let needsStats = { eq: 0, sup: 0, help: 0, mach: 0, none: 0 };
for (const name of names) {
  const PM = c.top_('market') + 3;
  setCell('Value_Lost_Charts', Vc.country + 1, 2, name); setCell('Country_Needs', TN, 2, name); setCell('Country_View', TC, 2, name);
  setCell('Market_Opportunity', PM + 1, 2, name);
  sim.run(8, ['Value_Lost_Charts', 'Country_Needs', 'Country_View', 'Market_Opportunity']);
  const errs = sim.errors().filter(e => ['Value_Lost_Charts', 'Country_Needs', 'Country_View', 'Market_Opportunity'].includes(e.sheet));
  ok(!errs.length, `${name}: ${errs.length} errors ${errs[0] ? errs[0].sheet + ' r' + errs[0].r + ' ' + errs[0].msg : ''}`);
  const iso = K('COUNTRIES').find(x => x[2] === name)[0];
  const nChains = [...va.cells.entries()].filter(([k, v]) => k.endsWith(',1') && v === iso).length;
  // VLC now showing + table rows
  const ns = V('Value_Lost_Charts', Vc.country + 3, 2);
  ok(nChains ? new RegExp('NOW SHOWING: ' + name.replace(/[()']/g, '.') + ' \\(' + iso + '\\) — ' + nChains + ' value chains').test(ns) : /no value chains/.test(ns), `${name} VLC now showing: ${ns.slice(0, 80)}`);
  let tr = 0; while (V('Value_Lost_Charts', Vc.country + 5 + tr, 2) && tr < 12) tr++;
  ok(tr === Math.min(nChains, 10), `${name} VLC table rows ${tr} vs ${Math.min(nChains, 10)}`);
  ok(String(V('Value_Lost_Charts', Vc.country + 4, 8)).endsWith(name), `${name} chart legend header`);
  // Country_Needs
  const E = TN + 3 + K('NEEDS_CHART_ROWS'), O = E + 2 + 7 + 1; const Rq = O + 13, Sx = Rq + 13, Q = Sx + 5, P = Q + 22, Hh = P + 44, Mm = Hh + 38;
  ok(new RegExp('NOW SHOWING: ' + name.replace(/[()']/g, '.')).test(V('Country_Needs', TN + 2, 1)), `${name} needs NOW SHOWING`);
  const topChains = []; for (let i = 0; i < 3; i++) { const v = V('Country_Needs', O + 2 + i, 1); if (typeof V('Country_Needs', O + 2 + i, 4) === 'number') topChains.push(v); }
  ok(topChains.length === Math.min(3, nChains), `${name} top chains ${topChains.length}`);
  const expEq = K('EQUIPMENT').filter(e => topChains.includes(e[0])).length;
  let eqRows = 0; while (typeof V('Country_Needs', Q + 2 + eqRows, 2) === 'number') eqRows++;
  ok(eqRows === expEq, `${name} equipment rows ${eqRows} vs ${expEq}`);
  const keys = topChains.map(x => x.split(' → ')[0]);
  const expSup = K('SUPPLIERS').filter(s => keys.some(k => s[4].toLowerCase().includes(k.toLowerCase()))).length;
  let supRows = 0; while (V('Country_Needs', P + 2 + supRows, 3) && !/No suppliers/.test(V('Country_Needs', P + 2, 1))) supRows++;
  ok(supRows === expSup, `${name} supplier rows ${supRows} vs ${expSup}`);
  const expHelp = K('SUPPLIERS').filter(s => s[4] === 'All' || s[2] === 'Trade fair' || s[2] === 'Industry association').length;
  let hRows = 0; while (V('Country_Needs', Hh + 2 + hRows, 3)) hRows++;
  ok(hRows === expHelp, `${name} help rows ${hRows} vs ${expHelp}`);
  let mach = 0; for (let i = 0; i < K('MACHINERY').length; i++) mach += V('Country_Needs', Mm + 2 + i, 3);
  const expM = [...S('Raw_HS4').cells.entries()].length ? null : 0;
  if (mach > 0) needsStats.mach++;
  if (eqRows) needsStats.eq++; if (supRows) needsStats.sup++; if (!nChains) needsStats.none++;
  // Country_Needs charts (data tables from column I)
  const CA = TN + 5, CB = CA + 10, CD = CB + 13;
  ok(String(V('Country_Needs', CA + 1, 10)).startsWith(name + ' ('), `${name} needs chart A legend`);
  ok(String(V('Country_Needs', CB + 1, 12)).endsWith(name) && String(V('Country_Needs', CD + 1, 12)).endsWith(name), `${name} needs charts B-D legends`);
  for (let i = 0; i < 7; i++) {
    const b = V('Country_Needs', E + 2 + i, 2), m = V('Country_Needs', E + 2 + i, 3), x = V('Country_Needs', CA + 2 + i, 10);
    const want = typeof b === 'number' && typeof m === 'number' && m > 0 ? Math.round(b / m * 100) : '';
    ok(want === '' ? (x === '' || x == null) : Math.abs(x - want) <= 1, `${name} chart A enabler ${i}: ${x} vs ${want}`);
    ok(V('Country_Needs', CA + 2 + i, 11) === 100, `${name} chart A median`);
  }
  let chartRows = 0, revSum = 0;
  for (let i = 0; i < 10; i++) {
    const lost = V('Country_Needs', CB + 2 + i, 11);
    if (typeof lost !== 'number') continue;
    chartRows++;
    ok(lost === V('Country_Needs', O + 2 + i, 4) && V('Country_Needs', CB + 2 + i, 10) === V('Country_Needs', O + 2 + i, 5), `${name} chart B/C row ${i}`);
    const chain = V('Country_Needs', O + 2 + i, 1);
    let want = 0; for (let r = L.vaFirst; ; r++) { const a = V('VA_Scorecard', r, 1); if (!a) break; if (a === iso && V('VA_Scorecard', r, 3) === chain) want += V('VA_Scorecard', r, 23); }
    ok(Math.abs(V('Country_Needs', CB + 2 + i, 12) - want) < 1, `${name} chart C revenue ${i}`);
    revSum += V('Country_Needs', CB + 2 + i, 12);
  }
  ok(chartRows === Math.min(nChains, 10), `${name} chart B rows ${chartRows}`);
  let steps = 0; for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) { const v = V('Country_Needs', CD + 2 + i, 10 + j); if (typeof v === 'number') steps += v; }
  ok(steps === eqRows, `${name} chart D steps ${steps} vs equipment rows ${eqRows}`);
  if (chartRows) needsStats.charts = (needsStats.charts || 0) + 1;
  // Country_View
  ok(new RegExp('NOW SHOWING: ' + name.replace(/[()']/g, '.')).test(V('Country_View', TC + 2, 1)), `${name} Country_View NOW SHOWING`);
  // Market_Opportunity section 1
  ok(new RegExp('NOW SHOWING: ' + name.replace(/[()']/g, '.')).test(V('Market_Opportunity', PM + 3, 1)), `${name} Market NOW SHOWING`);
  let mr = 0; const revs = []; while (typeof V('Market_Opportunity', PM + 7 + mr, 6) === 'number') { revs.push(V('Market_Opportunity', PM + 7 + mr, 6)); mr++; }
  ok(mr === Math.min(nChains, 10), `${name} market rows ${mr} vs ${Math.min(nChains, 10)}`);
  ok(revs.every((x, i) => !i || revs[i - 1] >= x), `${name} market rows sorted by revenue`);
  ok(!nChains || /^Value proposition: if /.test(V('Market_Opportunity', PM + 4, 1)), `${name} value proposition sentence`);
  ok(String(V('Market_Opportunity', PM + 6, 6)).endsWith(name), `${name} market chart legend header`);
  ok(!nChains || /^Market waiting for its processed goods/.test(V('Country_Needs', Sx + 4, 1)), `${name} Country_Needs market line`);
}
ok(S('Country_Needs').charts ? S('Country_Needs').charts.length === 4 : true, 'Country_Needs has 4 charts');
console.log('countries with needs charts filled', needsStats.charts, '| with equipment rows', needsStats.eq, '| with suppliers', needsStats.sup, '| with machinery imports', needsStats.mach, '| with no value chains', needsStats.none, 'of', names.length);

// 10. Explain_Score for 25 random opportunities + one that does not exist
for (let t = 0; t < 26; t++) {
  const r = t < 25 ? L.scoreFirst + Math.floor((t * 7919) % nsc) : null;
  const ex = r ? S('Scorecard').get(r, 2) : 'Chad', im = r ? S('Scorecard').get(r, 4) : 'Chad', pr = r ? S('Scorecard').get(r, 6) : 'Cocoa';
  setCell('Explain_Score', TE, 2, ex); setCell('Explain_Score', TE + 1, 2, im); setCell('Explain_Score', TE + 2, 2, pr);
  sim.run(8, ['Explain_Score']);
  const errs = sim.errors().filter(e => e.sheet === 'Explain_Score'); ok(!errs.length, `Explain ${ex}→${im} ${pr}: errors ${errs.length} ${errs[0] ? errs[0].msg : ''}`);
  if (r) { let p = 0; for (let i = 1; i <= 7; i++) p += V('Explain_Score', H + i, 6); ok(near(p, V('Scorecard', r, 21), 0.06), `Explain points ${ex}→${im} ${pr}`); }
  else ok(/not in the Scorecard/.test(V('Explain_Score', TE + 4, 1)), 'Explain not-found message');
}

// 11. Top_Gaps filter combinations
const sectors = K('SECTORS').map(x => x[2]);
for (let t = 0; t < 20; t++) {
  const ex = t % 3 ? names[(t * 7) % 54] : 'All', im = t % 4 ? 'All' : names[(t * 11) % 54], sec = t % 2 ? sectors[t % sectors.length] : 'All';
  setCell('Top_Gaps', TT, 2, ex); setCell('Top_Gaps', TT + 1, 2, im); setCell('Top_Gaps', TT + 2, 2, sec);
  sim.run(8, ['Top_Gaps']);
  let exp = 0; for (let q = L.scoreFirst; q < L.scoreFirst + nsc; q++) { const s = S('Scorecard'); if ((ex === 'All' || s.get(q, 2) === ex) && (im === 'All' || s.get(q, 4) === im) && (sec === 'All' || s.get(q, 7) === sec)) exp++; }
  let got = 0; while (typeof V('Top_Gaps', F + got, 9) === 'number') got++;
  ok(got === Math.min(exp, 50), `Top_Gaps ${ex}/${im}/${sec}: ${got} vs ${Math.min(exp, 50)}`);
  ok(new RegExp(exp ? 'NOW SHOWING: ' + Math.min(exp, 50) + ' opportunities' : 'no opportunities').test(V('Top_Gaps', TT + 3, 4)), 'Top_Gaps now showing ' + ex);
}

// 12. Health_Check statuses
const TH = c.top_('health'); c.healthChecks_().forEach((h, i) => {
  const st = V('Health_Check', TH + 2 + i, 3);
  const expected = /data source/i.test(h[0]) ? 'CHECK' : h[0] === 'Monthly auto-refresh' ? 'INFO' : 'OK';
  ok(st === expected, `Health "${h[0]}" = ${st} (result ${V('Health_Check', TH + 2 + i, 2)}), expected ${expected}`);
});
console.log(`\nRESULT: ${oks} checks passed, ${fails} failed`);
