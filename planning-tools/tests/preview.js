// Builds tests/preview.html: the real app page, with the real PlanningTools.gs running
// in the browser against fake Google services — try the whole tool without Google.
const fs = require('fs');
const path = require('path');
const { buildHtml } = require('../build');

const code = fs.readFileSync(path.join(__dirname, '..', 'PlanningTools.gs'), 'utf8');
const fakeGoogle = fs.readFileSync(path.join(__dirname, 'fake-google.js'), 'utf8');

const stub = `<script>
  var backend = (function () {
    ${fakeGoogle}
    var fake = createFakeGoogle();
    var SpreadsheetApp = fake.globals.SpreadsheetApp, PropertiesService = fake.globals.PropertiesService,
        FormApp = fake.globals.FormApp, HtmlService = fake.globals.HtmlService,
        DriveApp = fake.globals.DriveApp, Utilities = fake.globals.Utilities;
    ${code.replace(/<\/script>/g, '<\\/script>')}
    var api = {};
    Object.keys(this || {}).length; // keep strict-mode linters quiet
    ['apiGetAll', 'apiSaveAffinity', 'apiSaveRelations', 'apiSaveMatrix', 'apiSavePrioritization', 'apiSaveTree',
     'apiSavePdpc', 'apiSaveActivities', 'apiCreateForm', 'apiImportFormIdeas', 'apiSaveChartToDrive'].forEach(function (k) { api[k] = eval(k); });
    return { api: api, fake: fake };
  })();
  function runner(ok, fail) {
    var r = {
      withSuccessHandler: function (f) { return runner(f, fail); },
      withFailureHandler: function (f) { return runner(ok, f); }
    };
    Object.keys(backend.api).forEach(function (k) {
      r[k] = function () {
        var args = JSON.parse(JSON.stringify([].slice.call(arguments)));
        setTimeout(function () {
          try { ok && ok(JSON.parse(JSON.stringify(backend.api[k].apply(null, args)))); } catch (e) { fail && fail(e); }
        }, 30);
      };
    });
    return r;
  }
  window.google = { script: { run: runner() } };
</script>`;

fs.writeFileSync(path.join(__dirname, 'preview.html'), buildHtml().replace('</head>', stub + '\n</head>'));
console.log('wrote tests/preview.html');
