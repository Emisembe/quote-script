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
console.log('All workflows passed.');
