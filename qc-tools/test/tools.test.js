const test = require('node:test');
const assert = require('node:assert/strict');
const G = require('./load')();

const rec = (day, kind, item, value, extra) => Object.assign({ id: '', ts: day + ' 12:00', day, project: 'P', area: 'A', shift: 'Day', by: 'X', kind, item, value, notes: '', source: '' }, extra || {});

test('rowsToRecords_ parses, normalises kind and skips bad rows', () => {
  const rows = [
    ['1', '', new Date(Date.UTC(2026, 0, 5)), 'P', 'A', 'Day', 'X', 'count', 'Scratch', 3, '', ''],
    ['2', '', '2026-1-6', 'P', 'A', 'Day', 'X', 'Measure', 'Temp', '21.5', '', ''],
    ['3', '', '2026-01-06', 'P', 'A', 'Day', 'X', 'Bogus', 'Temp', 1, '', ''],
    ['4', '', '', 'P', 'A', 'Day', 'X', 'Count', 'Scratch', 1, '', ''],
    ['5', '', '2026-01-06', 'P', 'A', 'Day', 'X', 'Count', 'Scratch', '', '', '']
  ];
  const r = G.rowsToRecords_(rows, 'UTC');
  assert.equal(r.length, 2);
  assert.equal(r[0].kind, 'Count');
  assert.equal(r[0].day, '2026-01-05');
  assert.equal(r[1].day, '2026-01-06');
  assert.equal(r[1].value, 21.5);
});

test('answersToRecords_ writes zeros for blank counts only when a check was done', () => {
  const map = { 1: { role: 'date' }, 2: { role: 'project' }, 3: { role: 'by' }, 4: { role: 'units' },
    5: { role: 'count', name: 'Scratch' }, 6: { role: 'count', name: 'Dent' }, 7: { role: 'measure', name: 'Temp' }, 8: { role: 'measure', name: 'Hum' } };
  const base = { responseId: 'R1', timestamp: 'T', fallbackDay: '2026-02-02' };
  let rows = G.answersToRecords_(Object.assign({ answers: { 1: '2026-02-01', 2: 'P', 3: 'Ann', 5: '2', 7: '20.5' } }, base), map);
  assert.deepEqual(rows.map(r => [r[7], r[8], r[9]]), [['Count', 'Scratch', 2], ['Count', 'Dent', 0], ['Measure', 'Temp', 20.5]]);
  assert.equal(rows[0][0], 'R1#0');
  assert.equal(rows[0][2], '2026-02-01');
  // Measurement-only submission: no count rows at all.
  rows = G.answersToRecords_(Object.assign({ answers: { 2: 'P', 8: '44' } }, base), map);
  assert.deepEqual(rows.map(r => r[8]), ['Hum']);
  assert.equal(rows[0][2], '2026-02-02');
  // Units inspected alone counts as a zero-defect check.
  rows = G.answersToRecords_(Object.assign({ answers: { 4: '50' } }, base), map);
  assert.deepEqual(rows.map(r => [r[7], r[9]]), [['Inspected', 50], ['Count', 0], ['Count', 0]]);
});

test('filterRecords_ by dimension and date range', () => {
  const rs = [rec('2026-01-01', 'Count', 'a', 1), rec('2026-01-05', 'Count', 'a', 1, { area: 'B' })];
  assert.equal(G.filterRecords_(rs, { area: 'B' }).length, 1);
  assert.equal(G.filterRecords_(rs, { from: '2026-01-02' }).length, 1);
  assert.equal(G.filterRecords_(rs, { to: '2026-01-01' }).length, 1);
  assert.equal(G.filterRecords_(rs, {}).length, 2);
});

test('check sheet tallies by day with totals', () => {
  const rs = [rec('2026-01-01', 'Count', 'a', 2), rec('2026-01-01', 'Count', 'b', 1), rec('2026-01-02', 'Count', 'a', 3),
    rec('2026-01-02', 'Inspected', 'Units inspected', 100), rec('2026-01-02', 'Measure', 'T', 5)];
  const r = G.checkSheet_(rs, 'day');
  assert.deepEqual(r.columns, ['2026-01-01', '2026-01-02']);
  assert.deepEqual(r.rows[0], { item: 'a', cells: [2, 3], total: 5 });
  assert.deepEqual(r.colTotals, [3, 3]);
  assert.equal(r.grandTotal, 6);
  assert.equal(r.avgPerDay, 3);
  assert.deepEqual(r.unitsInspected, [0, 100]);
});

test('pareto sorts, accumulates and marks the vital few', () => {
  const rs = [['PCB', 58], ['Heat', 25], ['Timer', 20], ['Lever', 15], ['Tray', 12], ['Cord', 8], ['Other', 7]]
    .map(([k, v]) => rec('2026-01-01', 'Count', k, v));
  const r = G.pareto_(rs, 'item', 80);
  assert.equal(r.total, 145);
  assert.equal(r.rows[0].label, 'PCB');
  assert.equal(r.rows[0].pct, 40);
  assert.equal(r.rows[r.rows.length - 1].cumPct, 100);
  // 40, 57.2, 71, 81.4 -> the 4th crosses 80 and is still vital
  assert.deepEqual(r.vitalFew, ['PCB', 'Heat', 'Timer', 'Lever']);
});

test('scatter pairs daily series and computes Pearson r', () => {
  const rs = [];
  [[18, 6], [19, 4], [17, 1], [45, 12], [50, 14], [48, 13], [30, 8]].forEach(([h, d], i) => {
    const day = '2026-01-0' + (i + 1);
    rs.push(rec(day, 'Measure', 'Hum', h - 1), rec(day, 'Measure', 'Hum', h + 1), rec(day, 'Count', 'PCB', d));
  });
  const r = G.scatter_(rs, 'Measure|Hum', 'Count|All defects');
  assert.equal(r.n, 7);
  assert.equal(r.points[0].x, 18); // daily mean of the two readings
  // Reference value computed independently
  const xs = [18, 19, 17, 45, 50, 48, 30], ys = [6, 4, 1, 12, 14, 13, 8];
  const m = a => a.reduce((s, v) => s + v, 0) / a.length;
  const mx = m(xs), my = m(ys);
  const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
  const sxx = xs.reduce((s, x) => s + (x - mx) ** 2, 0), syy = ys.reduce((s, y) => s + (y - my) ** 2, 0);
  assert.ok(Math.abs(r.r - sxy / Math.sqrt(sxx * syy)) < 1e-3);
  assert.match(r.strength, /Very strong positive/);
  assert.equal(G.scatter_(rs.slice(0, 3), 'Measure|Hum', 'Count|PCB').r, null);
});

test('histogram bins every value and computes Pp/Ppk', () => {
  const vals = [];
  for (let i = 0; i < 100; i++) vals.push(20 + ((i * 37) % 11) - 5);
  const rs = vals.map((v, i) => rec('2026-01-01', 'Measure', 'Hum', v + 0.5));
  const r = G.histogram_(rs, 'Measure|Hum', { lsl: 10, target: 20, usl: 35 }, 0);
  assert.equal(r.n, 100);
  assert.equal(r.bins.reduce((s, b) => s + b.count, 0), 100);
  assert.ok(r.pp > 0 && r.ppk > 0 && r.ppk <= r.pp);
  assert.equal(r.outOfSpec, 0);
  assert.ok(r.axisMin <= 10 && r.axisMax >= 35);
  // integer daily totals with a small range -> one bar per value
  const c = G.histogram_([rec('2026-01-01', 'Count', 'a', 3), rec('2026-01-02', 'Count', 'a', 5)], 'Count|a', null, 0);
  assert.deepEqual(c.bins.map(b => b.count), [1, 0, 1]);
  assert.equal(G.histogram_([], 'Measure|x', null, 0).n, 0);
});

test('c chart limits, phases and rule 1', () => {
  const rs = [];
  const vals = [8, 7, 9, 8, 25, 8, 7, 9, 3, 2, 3, 4, 3, 2];
  vals.forEach((v, i) => rs.push(rec('2026-01-' + String(i + 1).padStart(2, '0'), 'Count', 'PCB', v)));
  const r = G.controlChart_(rs, 'Count|PCB', 'auto', [{ day: '2026-01-09', label: 'Fix' }]);
  assert.equal(r.chartType, 'c');
  assert.equal(r.phases.length, 2);
  const cbar = vals.slice(0, 8).reduce((a, b) => a + b) / 8;
  assert.ok(Math.abs(r.phases[0].center - cbar) < 1e-3);
  assert.ok(Math.abs(r.phases[0].ucl - (cbar + 3 * Math.sqrt(cbar))) < 1e-3);
  assert.deepEqual(r.signals.map(s => s.label), ['2026-01-05']);
  assert.ok(r.changePct < -50);
});

test('u chart is chosen automatically when units inspected exist', () => {
  const rs = [];
  for (let i = 1; i <= 10; i++) {
    const day = '2026-01-' + String(i).padStart(2, '0');
    rs.push(rec(day, 'Count', 'a', i % 3 + 1), rec(day, 'Inspected', 'Units inspected', 100 + i));
  }
  const r = G.controlChart_(rs, 'Count|All defects', 'auto', []);
  assert.equal(r.chartType, 'u');
  assert.ok(Math.abs(r.points[0].value - 2 / 101) < 1e-4);
  const c = G.controlChart_(rs.filter(x => x.kind === 'Count'), 'Count|a', 'u', []);
  assert.equal(c.chartType, 'c');
  assert.match(c.note, /u chart needs/);
});

test('I-MR chart constants and run / trend rules', () => {
  const vals = [10, 12, 11, 13, 12, 11, 10, 12, 11, 12];
  const rs = vals.map((v, i) => rec('2026-01-01', 'Measure', 'T', v, { ts: '2026-01-01 ' + String(i).padStart(2, '0') + ':00' }));
  const r = G.controlChart_(rs, 'Measure|T', 'auto', []);
  assert.equal(r.chartType, 'I-MR');
  const mr = vals.slice(1).map((v, i) => Math.abs(v - vals[i]));
  const mrbar = mr.reduce((a, b) => a + b) / mr.length, xbar = vals.reduce((a, b) => a + b) / vals.length;
  assert.ok(Math.abs(r.phases[0].ucl - (xbar + 2.66 * mrbar)) < 1e-3);
  assert.ok(Math.abs(r.points[1].mrUcl - 3.267 * mrbar) < 1e-3);
  assert.equal(r.points[0].mr, null);

  // Rule 2: 8 on one side (after a big excursion); rule 3: 6 rising.
  const run = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1];
  const r2 = G.controlChart_(run.map((v, i) => rec('2026-02-' + String(i + 1).padStart(2, '0'), 'Count', 'a', v)), 'Count|a', 'c', []);
  assert.ok(r2.points[17].rules.includes(2));
  const rise = [1, 2, 3, 4, 5, 6, 5, 4];
  const r3 = G.controlChart_(rise.map((v, i) => rec('2026-03-' + String(i + 1).padStart(2, '0'), 'Count', 'a', v)), 'Count|a', 'c', []);
  assert.ok(r3.points[5].rules.includes(3));
  assert.ok(!r3.points[4].rules.includes(3));
});

test('demo data tells the humidity story', () => {
  const demo = G.buildDemoRecords_('2026-08-01');
  const recs = G.rowsToRecords_(demo.rows, 'UTC');
  assert.equal(recs.length, demo.rows.length);
  const week1 = G.filterRecords_(recs, { to: '2026-08-07' });
  const p = G.pareto_(week1, 'item', 80);
  assert.equal(p.rows[0].label, 'Control PCB');
  const s = G.scatter_(recs, 'Measure|Humidity', 'Count|Control PCB');
  assert.ok(s.r > 0.6, 'humidity should correlate with PCB defects, r=' + s.r);
  const c = G.controlChart_(recs, 'Count|Control PCB', 'c', demo.events);
  assert.equal(c.phases.length, 2);
  assert.ok(c.changePct < -40, 'PCB defects should fall after the fix: ' + c.changePct);
  const h = G.histogram_(recs, 'Measure|Humidity', { lsl: 10, target: 20, usl: 35 }, 0);
  assert.equal(h.n, 35 * 4);
  console.log('demo: week1 total', p.total, 'PCB%', p.rows[0].pct, 'r', s.r, 'change', c.changePct, 'Ppk', h.ppk);
});

test('runTool_ dispatches and rejects unknown tools', () => {
  assert.equal(G.runTool_('pareto', [], {}, {}).tool, 'pareto');
  assert.throws(() => G.runTool_('nope', [], {}, {}));
});
