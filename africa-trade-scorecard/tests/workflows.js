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
  c.UrlFetchApp = { fetch: url => {
    if (url.includes('worldbank')) return { getResponseCode: () => 200, getContentText: () => JSON.stringify([{}, [{ countryiso3code: 'NGA', date: '2023', value: 55 }]]) };
    const d = url.includes('AG2') ? [{ flowCode: 'X', cmdCode: '18', partnerCode: 0, period: 2023, primaryValue: 1e9, motCode: 0, partner2Code: 0, customsCode: 'C00' }]
      : [{ flowCode: 'X', cmdCode: '1801', partnerCode: 0, period: 2023, primaryValue: 1e9, motCode: 0, partner2Code: 0, customsCode: 'C00' }];
    return { getResponseCode: () => 200, getContentText: () => JSON.stringify({ data: d }) }; } };
  c.setParam_('P_API_KEY', 'fake');
  step('UN Comtrade + World Bank download (fake API)', () => c.fetchComtradeData());
  assert(/UN Comtrade/.test(c.getParam_('P_STATUS')) && /World Bank/.test(c.getParam_('P_WB_STATUS'))); }
console.log('All workflows passed.');
