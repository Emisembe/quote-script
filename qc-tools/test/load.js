// Loads Code.gs into a sandbox with minimal Apps Script stubs so the pure functions can be tested in Node.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

module.exports = function load() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
  const ctx = {
    console,
    Utilities: {
      formatDate(d, tz, pattern) {
        const p = (n) => String(n).padStart(2, '0');
        const s = d.getUTCFullYear() + '-' + p(d.getUTCMonth() + 1) + '-' + p(d.getUTCDate());
        return pattern === 'yyyy-MM-dd' ? s : s + ' ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes());
      }
    },
    Session: { getScriptTimeZone: () => 'UTC' }
  };
  vm.createContext(ctx);
  vm.runInContext(src, ctx, { filename: 'Code.gs' });
  // Return plain copies so assert.deepEqual is not tripped up by the sandbox's own Array/Object.
  return new Proxy(ctx, {
    get(target, name) {
      const v = target[name];
      if (typeof v !== 'function') return v;
      return (...args) => {
        const out = v(...args);
        return out === undefined ? out : JSON.parse(JSON.stringify(out));
      };
    }
  });
};
