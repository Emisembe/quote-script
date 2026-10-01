// Runs every menu workflow against the Sheets mock (no formula evaluation). Usage: node tests/workflows.js
const assert = require('assert');
const fresh = () => { delete require.cache[require.resolve('./mock.js')]; return require('./mock.js'); };
const step = (name, fn) => { const t = Date.now(); fn(); console.log('OK', name, (Date.now() - t) + 'ms'); };
{ const m = fresh(), c = m.ctx;
  step('quickStart', () => c.quickStart());
  step('upgradeWorkbook', () => c.upgradeWorkbook());
  step('refreshData (sample)', () => c.refreshData());
  step('toggleAutoRefresh on/off', () => { c.toggleAutoRefresh(); c.toggleAutoRefresh(); });
  step('runFullAudit', () => c.runFullAudit());
  step('clearRawTrade + refresh', () => { c.clearRawTrade(); c.refreshData(); });
  step('fetchComtradeData without key', () => c.fetchComtradeData()); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  c.clearSheetBody_(m.sheets.find(s => s.name === 'Raw_HS4'), c.L.hs4First);
  step('update from a workbook without HS4 data', () => c.upgradeWorkbook());
  assert(c.hs4Count_() > 0, 'HS4 data restored'); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  assert(c.euBenchmarkCount_() === 27, 'EU benchmark after quick start');
  const en = m.sheets.find(s => s.name === 'Enablers');
  en.getRange(c.L.enFirst, require('vm').runInContext('EU_COL', c), 27, 10).clearContent();
  step('update from a workbook without the European benchmark', () => c.upgradeWorkbook());
  assert(c.euBenchmarkCount_() === 27, 'EU benchmark restored by update'); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  c.UrlFetchApp = { fetch: url => {
    if (url.includes('worldbank')) return { getResponseCode: () => 200, getContentText: () => JSON.stringify([{}, [{ countryiso3code: 'NGA', date: '2023', value: 55 }]]) };
    const d = url.includes('AG2') ? [{ flowCode: 'X', cmdCode: '18', partnerCode: 0, period: 2023, primaryValue: 1e9, motCode: 0, partner2Code: 0, customsCode: 'C00' }]
      : [{ flowCode: 'X', cmdCode: '1801', partnerCode: 0, period: 2023, primaryValue: 1e9, motCode: 0, partner2Code: 0, customsCode: 'C00' }];
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ data: d }) }; } };
  c.setParam_('P_API_KEY', 'fake');
  step('UN Comtrade + World Bank download (fake API)', () => c.fetchComtradeData());
  assert(/UN Comtrade/.test(c.getParam_('P_STATUS')) && /World Bank/.test(c.getParam_('P_WB_STATUS'))); }

// Menu, version reminder, reset, sample menu, World Bank menu, auto-refresh on sample data.
{ const m = fresh(), c = m.ctx; c.quickStart();
  step('onOpen (menu + version check)', () => c.onOpen());
  c.PropertiesService.getDocumentProperties().setProperty(c.APP.versionProp, '0.0.1');
  c.checkVersion_();
  assert(m.toasts.some(t => /This code is version .* built with 0\.0\.1/.test(t)), 'version reminder toast');
  step('loadSampleData (2a)', () => c.loadSampleData());
  step('autoRefresh on sample data', () => c.autoRefresh());
  step('buildWorkbook (reset)', () => c.buildWorkbook());
  assert(c.rawCount_() === 0, 'reset clears data'); }

// Fake UN Comtrade + World Bank: chunked background fetch, a failing country, stop, and a World Bank error.
const fakeApi = (c, opts) => { c.UrlFetchApp = { fetch: url => {
  if (url.includes('worldbank')) {
    if (opts.wbError) return { getResponseCode: () => 200, getContentText: () => JSON.stringify([{ message: [{ id: '120', value: 'Invalid value' }] }]) };
    const isos = decodeURIComponent(url.split('/country/')[1].split('/')[0]).split(';');
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify([{}, isos.map((iso, i) => ({ countryiso3code: iso, date: '2023', value: 10 + i }))]) };
  }
  const rep = Number((url.match(/reporterCode=(\d+)/) || [])[1]);
  if (opts.fail && opts.fail(rep)) return { getResponseCode: () => 500, getContentText: () => 'server error' };
  const d = url.includes('AG2') ? [{ flowCode: 'X', cmdCode: '18', partnerCode: 0, period: 2023, primaryValue: 1e9, motCode: 0, partner2Code: 0, customsCode: 'C00' }]
    : [{ flowCode: 'X', cmdCode: '1801', partnerCode: 0, period: 2023, primaryValue: 1e9, motCode: 0, partner2Code: 0, customsCode: 'C00' }];
  return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ data: d }) }; } };
  c.setParam_('P_API_KEY', 'fake');
  // Each Date.now() call moves the clock 50 seconds, so a run stops after a few countries.
  let t = 0; const RealDate = Date; c.Date = class extends RealDate { static now() { t += 50000; return t; } };
};
const drain = (m, c) => { let runs = 1, guard = 0;
  while (m.triggers.length && guard++ < 200) {
    assert(m.triggers.length === 1, 'exactly one pending fetch trigger, got ' + m.triggers.length);
    c.continueComtradeFetch(); runs++; }
  return runs; };
{ const m = fresh(), c = m.ctx; c.quickStart(); fakeApi(c, { fail: rep => rep === 24 });
  step('Comtrade fetch in background chunks, one failing country', () => c.fetchComtradeData());
  const runs = drain(m, c);
  const st = String(c.getParam_('P_STATUS'));
  assert(runs > 3, 'fetch used several chunks: ' + runs);
  assert(/^UN Comtrade \(fetched/.test(st) && /AGO \(error/.test(st), 'finished with Angola recorded as error: ' + st);
  assert(c.PropertiesService.getDocumentProperties().getProperty(c.APP.fetchProp) === null, 'cursor cleared');
  assert(c.euBenchmarkCount_() === 27 && /World Bank/.test(c.getParam_('P_WB_STATUS')), 'World Bank incl. EU loaded');
  console.log('   chunks:', runs); }
{ const m = fresh(), c = m.ctx; c.quickStart(); fakeApi(c, { fail: () => true });
  step('Comtrade fetch stops after 3 failures in a row', () => c.fetchComtradeData());
  assert(/stopped at/.test(c.getParam_('P_STATUS')) && m.triggers.length === 0, 'stopped cleanly: ' + c.getParam_('P_STATUS')); }
{ const m = fresh(), c = m.ctx; c.quickStart(); fakeApi(c, {});
  c.fetchComtradeData();
  step('stopComtradeFetch', () => c.stopComtradeFetch());
  assert(m.triggers.length === 0 && /stopped by user/.test(c.getParam_('P_STATUS')), 'stop removes triggers'); }
{ const m = fresh(), c = m.ctx; c.quickStart(); fakeApi(c, {});
  c.setParam_('P_SOURCE', 'COMTRADE');
  step('autoRefresh with UN Comtrade source', () => { c.autoRefresh(); drain(m, c); });
  assert(/^UN Comtrade \(fetched/.test(c.getParam_('P_STATUS')), 'auto-refresh completed'); }
{ const m = fresh(), c = m.ctx; c.quickStart(); fakeApi(c, {});
  step('fetchWorldBankData (2d)', () => c.fetchWorldBankData());
  assert(c.euBenchmarkCount_() === 27 && /World Bank WDI/.test(c.getParam_('P_WB_STATUS')), '2d loads Africa and EU');
  const before = c.getParam_('P_WB_STATUS'); fakeApi(c, { wbError: true });
  step('fetchWorldBankData with an API error', () => c.fetchWorldBankData());
  assert(m.alerts.some(a => /World Bank: /.test(a)) && c.getParam_('P_WB_STATUS') === before, 'error reported, data kept'); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  const all = m.sheets.flatMap(sh => sh.getCharts().map(ch => ({ sheet: sh.name, opts: ch.opts || {} })));
  const untitled = all.filter(x => !String(x.opts.title || '').trim() || !x.opts.titleTextStyle);
  console.log('   charts:', all.length, 'without a heading inside:', untitled.length);
  assert(all.length >= 25 && !untitled.length, 'every chart has its heading inside: ' + untitled.map(x => x.sheet).join(', ')); }

// Staged Update: data stays in place and identical, edits and settings are kept, layout shifts are handled.
const vmK = (c, n) => require('vm').runInContext(n, c);
const dump = (sh) => JSON.stringify([...sh.cells.entries()].filter(([k]) => +k.split(',')[0] > 0).sort());
const dataOf = (m, name, first) => { const sh = m.sheets.find(x => x.name === name); const rows = [];
  const last = sh.getLastRow(); for (let r = first; r <= last; r++) { const row = []; for (let col = 1; col <= 22; col++) row.push(sh.get(r, col)); rows.push(row.join('|')); }
  return rows; };
{ const m = fresh(), c = m.ctx; c.quickStart();
  const L = c.L;
  const before = { raw: dataOf(m, 'Raw_Trade', L.rawFirst), hs4: dataOf(m, 'Raw_HS4', L.hs4First), en: dataOf(m, 'Enablers', L.enFirst) };
  // user edits
  const st = m.sheets.find(x => x.name === 'Settings'); st.set(L.settingsWeight, 2, 33);
  c.setParam_('P_MIN_GAP', 250000);
  const sup = m.sheets.find(x => x.name === 'Suppliers'); sup.set(L.supFirst, 1, 'My own supplier');
  const ct = m.sheets.find(x => x.name === 'Countries'); ct.set(L.ctryFirst, 6, 'MY-REC');
  // an older layout: Raw_Trade data two rows lower, Raw_HS4 one row higher
  m.sheets.find(x => x.name === 'Raw_Trade').insertRowsBefore(1, 2);
  m.sheets.find(x => x.name === 'Raw_HS4').deleteRows(1, 1);
  step('Update keeps data in place (staged)', () => c.upgradeWorkbook());
  assert.deepStrictEqual(dataOf(m, 'Raw_Trade', L.rawFirst), before.raw, 'Raw_Trade identical and at the right row');
  assert.deepStrictEqual(dataOf(m, 'Raw_HS4', L.hs4First), before.hs4, 'Raw_HS4 identical and at the right row');
  assert.deepStrictEqual(dataOf(m, 'Enablers', L.enFirst), before.en, 'Enablers (incl. EU) identical');
  assert(st.get(L.settingsWeight, 2) === 33 && c.getParam_('P_MIN_GAP') === 250000, 'weights and parameters kept');
  assert(sup.get(L.supFirst, 1) === 'My own supplier' && ct.get(L.ctryFirst, 6) === 'MY-REC', 'edits kept');
  assert(/^Done \(update/.test(c.getParam_('P_BUILD')), 'status Done: ' + c.getParam_('P_BUILD'));
  assert(!m.sheets.find(x => x.name === '_Update_Backup') && m.triggers.length === 0, 'backup removed, no triggers left');
  assert(m.sheets.find(x => x.name === 'Raw_Trade').get(L.rawHead, 1) === 'Year', 'Raw_Trade header in place');
  assert(c.PropertiesService.getDocumentProperties().getProperty(c.APP.buildProp) === null, 'build state cleared'); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  const before = dataOf(m, 'Raw_Trade', c.L.rawFirst);
  let t = 0; const RealDate = Date; c.Date = class extends RealDate { static now() { t += 40000; return t; } };
  step('Update spread over several background runs', () => {
    c.upgradeWorkbook();
    let runs = 1;
    while (m.triggers.length) { assert(m.triggers.length === 1, 'one pending trigger'); c.continueBuild(); runs++; }
    console.log('   runs:', runs);
    assert(runs > 3, 'used several runs');
  });
  assert.deepStrictEqual(dataOf(m, 'Raw_Trade', c.L.rawFirst), before, 'data kept across runs');
  assert(/^Done/.test(c.getParam_('P_BUILD')), 'finished'); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  const props = c.PropertiesService.getDocumentProperties();
  // Simulate a run that Google stopped half-way: state saved at step 6, only the safety-net trigger left.
  props.setProperty(c.APP.buildProp, JSON.stringify({ mode: 'update', step: 0, tries: 0, messages: [] }));
  c.backupSettings_(c.SpreadsheetApp.getActive());
  props.setProperty(c.APP.buildProp, JSON.stringify({ mode: 'update', step: 6, tries: 1, messages: [] }));
  step('Safety net resumes an interrupted update', () => c.continueBuild());
  assert(/^Done/.test(c.getParam_('P_BUILD')) && m.triggers.length === 0, 'resumed and finished'); }
{ const m = fresh(), c = m.ctx; c.quickStart();
  const orig = c.buildCharts_; c.buildCharts_ = () => { throw new Error('test failure'); };
  step('A failing step stops cleanly', () => c.upgradeWorkbook());
  c.buildCharts_ = orig;
  assert(/Stopped at step .*test failure/.test(c.getParam_('P_BUILD')) && m.triggers.length === 0, 'stopped: ' + c.getParam_('P_BUILD'));
  step('Running Update again after a failure', () => c.upgradeWorkbook());
  assert(/^Done/.test(c.getParam_('P_BUILD')), 'recovered'); }
console.log('All workflows passed.');
