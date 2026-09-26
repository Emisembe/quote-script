// Runs the built single file, PlanningTools.gs, in a sandbox with fake Google services.
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const createFakeGoogle = require('./fake-google');

module.exports = function load() {
  const fake = createFakeGoogle();
  const ctx = vm.createContext(Object.assign({}, fake.globals));
  const code = fs.readFileSync(path.join(__dirname, '..', 'PlanningTools.gs'), 'utf8');
  vm.runInContext(code, ctx, { filename: 'PlanningTools.gs' });
  ctx.fake = fake;
  return ctx;
};
