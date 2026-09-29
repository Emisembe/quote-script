// Minimal Google Sheets formula evaluator for the functions the workbook uses.
// Semantics follow Google Sheets: array broadcasting, spills (#REF! on collision), blanks, case-insensitive text compare.
'use strict';

const ERR = (code, msg) => ({ err: code, msg: msg || '' });
const isErr = v => v && typeof v === 'object' && 'err' in v;
const isArr = v => Array.isArray(v);
const colNum = s => { let n = 0; for (const ch of s) n = n * 26 + ch.charCodeAt(0) - 64; return n; };

// ---------------- Tokenizer ----------------
function tokenize(src) {
  const toks = []; let i = 0;
  const refRe = /^(?:([A-Za-z_][A-Za-z0-9_]*)!)?(\$?[A-Z]{1,3}\$?\d+(?::\$?[A-Z]{1,3}(?:\$?\d+)?)?|\$?[A-Z]{1,3}:\$?[A-Z]{1,3})(?![A-Za-z0-9_(])/;
  while (i < src.length) {
    const ch = src[i];
    if (ch === ' ' || ch === '\n') { i++; continue; }
    if (ch === '"') {
      let j = i + 1, s = '';
      while (j < src.length) { if (src[j] === '"') { if (src[j + 1] === '"') { s += '"'; j += 2; continue; } break; } s += src[j++]; }
      toks.push({ t: 'str', v: s }); i = j + 1; continue;
    }
    const rest = src.slice(i);
    let m;
    if ((m = /^\d+(\.\d+)?([eE][+-]?\d+)?/.exec(rest))) { toks.push({ t: 'num', v: Number(m[0]) }); i += m[0].length; continue; }
    if ((m = refRe.exec(rest))) { toks.push({ t: 'ref', sheet: m[1] || null, a1: m[2] }); i += m[0].length; continue; }
    if ((m = /^[A-Za-z_][A-Za-z0-9_.]*/.exec(rest))) {
      const name = m[0]; i += name.length;
      if (src[i] === '(') toks.push({ t: 'fn', v: name.toUpperCase() });
      else toks.push({ t: 'name', v: name });
      continue;
    }
    const two = src.substr(i, 2);
    if (['<=', '>=', '<>'].includes(two)) { toks.push({ t: 'op', v: two }); i += 2; continue; }
    if ('+-*/&=<>(),;{}^%'.includes(ch)) { toks.push({ t: 'op', v: ch }); i++; continue; }
    throw new Error('Bad char ' + ch + ' in ' + src);
  }
  return toks;
}

// ---------------- Parser ----------------
function parse(src) {
  const toks = tokenize(src); let p = 0;
  const peek = () => toks[p], next = () => toks[p++];
  const isOp = v => peek() && peek().t === 'op' && peek().v === v;
  function expr() { return cmp(); }
  function cmp() {
    let l = concat();
    while (peek() && peek().t === 'op' && ['=', '<>', '<', '>', '<=', '>='].includes(peek().v)) { const op = next().v; l = { k: 'bin', op, l, r: concat() }; }
    return l;
  }
  function concat() { let l = add(); while (isOp('&')) { next(); l = { k: 'bin', op: '&', l, r: add() }; } return l; }
  function add() { let l = mul(); while (isOp('+') || isOp('-')) { const op = next().v; l = { k: 'bin', op, l, r: mul() }; } return l; }
  function mul() { let l = unary(); while (isOp('*') || isOp('/')) { const op = next().v; l = { k: 'bin', op, l, r: unary() }; } return l; }
  function unary() { if (isOp('-')) { next(); return { k: 'neg', e: unary() }; } if (isOp('+')) { next(); return unary(); } return prim(); }
  function prim() {
    const t = next();
    if (!t) throw new Error('Unexpected end: ' + src);
    if (t.t === 'num') return { k: 'lit', v: t.v };
    if (t.t === 'str') return { k: 'lit', v: t.v };
    if (t.t === 'ref') return { k: 'ref', sheet: t.sheet, a1: t.a1 };
    if (t.t === 'name') { const u = t.v.toUpperCase(); if (u === 'TRUE') return { k: 'lit', v: true }; if (u === 'FALSE') return { k: 'lit', v: false }; return { k: 'name', v: t.v }; }
    if (t.t === 'fn') {
      next(); // (
      const args = [];
      if (isOp(')')) { next(); return { k: 'fn', f: t.v, args }; }
      while (true) {
        if (isOp(',')) { args.push({ k: 'empty' }); next(); continue; }
        if (isOp(')')) { args.push({ k: 'empty' }); next(); break; }
        args.push(expr());
        if (isOp(',')) { next(); if (isOp(')')) { args.push({ k: 'empty' }); next(); break; } continue; }
        if (isOp(')')) { next(); break; }
        throw new Error('Expected , or ) in ' + src + ' at token ' + p);
      }
      return { k: 'fn', f: t.v, args };
    }
    if (t.t === 'op' && t.v === '(') { const e = expr(); if (!isOp(')')) throw new Error('Expected ) in ' + src); next(); return e; }
    if (t.t === 'op' && t.v === '{') {
      const rows = [[]];
      while (true) {
        rows[rows.length - 1].push(expr());
        if (isOp(',')) { next(); continue; }
        if (isOp(';')) { next(); rows.push([]); continue; }
        if (isOp('}')) { next(); break; }
        throw new Error('Bad array literal in ' + src);
      }
      return { k: 'arr', rows };
    }
    throw new Error('Unexpected token ' + JSON.stringify(t) + ' in ' + src);
  }
  const ast = expr();
  if (p !== toks.length) throw new Error('Trailing tokens in ' + src);
  return ast;
}

// ---------------- Values ----------------
const toArr = v => (isArr(v) ? v : [[v]]);
const unwrap = v => (isArr(v) && v.length === 1 && v[0].length === 1 ? v[0][0] : v);
const flat = v => { if (!isArr(v)) return [v]; const o = []; for (const r of v) for (const x of r) o.push(x); return o; };
const num = v => {
  if (isErr(v)) return v;
  if (v === null || v === '' || v === undefined) return 0;
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v === 'number') return v;
  const n = Number(v); return isNaN(n) ? ERR('#VALUE!', `"${v}" is text, not a number`) : n;
};
const str = v => (v === null || v === undefined ? '' : typeof v === 'boolean' ? (v ? 'TRUE' : 'FALSE') : String(v));
const truthy = v => (typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : v === null ? false : typeof v === 'string' ? false : false);

function broadcast(a, b, f) {
  if (!isArr(a) && !isArr(b)) return f(a, b);
  const A = toArr(a), B = toArr(b);
  const R = Math.max(A.length, B.length), C = Math.max(A[0].length, B[0].length);
  const ok = (X) => (X.length === R || X.length === 1) && (X[0].length === C || X[0].length === 1);
  if (!ok(A) || !ok(B)) return ERR('#VALUE!', `Array sizes differ: ${A.length}x${A[0].length} vs ${B.length}x${B[0].length}`);
  const out = [];
  for (let i = 0; i < R; i++) {
    const row = [];
    for (let j = 0; j < C; j++) row.push(f(A[A.length === 1 ? 0 : i][A[0].length === 1 ? 0 : j], B[B.length === 1 ? 0 : i][B[0].length === 1 ? 0 : j]));
    out.push(row);
  }
  return out;
}
const mapArr = (v, f) => (isArr(v) ? v.map(r => r.map(f)) : f(v));

function compare(a, b, op) {
  if (isErr(a)) return a; if (isErr(b)) return b;
  const blank = x => x === null || x === undefined;
  let x = a, y = b;
  if (blank(x) && blank(y)) { x = 0; y = 0; }
  else if (blank(x)) x = typeof y === 'string' ? '' : typeof y === 'boolean' ? false : 0;
  else if (blank(y)) y = typeof x === 'string' ? '' : typeof x === 'boolean' ? false : 0;
  let c;
  if (typeof x === 'number' && typeof y === 'number') c = x < y ? -1 : x > y ? 1 : 0;
  else if (typeof x === 'string' && typeof y === 'string') { const X = x.toLowerCase(), Y = y.toLowerCase(); c = X < Y ? -1 : X > Y ? 1 : 0; }
  else if (typeof x === 'boolean' && typeof y === 'boolean') c = x === y ? 0 : x ? 1 : -1;
  else { const rank = v => (typeof v === 'number' ? 0 : typeof v === 'string' ? 1 : 2); c = rank(x) < rank(y) ? -1 : 1; }
  return { '=': c === 0, '<>': c !== 0, '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0 }[op];
}

function fmtText(v, f) {
  if (typeof v !== 'number') return str(v);
  const grp = n => Math.round(n).toLocaleString('en-US');
  const pct = /%$/.test(f);
  const x = pct ? v * 100 : v;
  const dec = (/0\.(0+)/.exec(f) || [null, ''])[1].length;
  let s = /#,##0/.test(f) ? (dec ? Number(x.toFixed(dec)).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) : grp(x)) : x.toFixed(dec);
  if (f.startsWith('$')) s = (v < 0 ? '-$' : '$') + s.replace('-', '');
  return s + (pct ? '%' : '');
}

function critMatcher(crit) {
  if (isErr(crit)) return () => false;
  if (typeof crit === 'number') return v => typeof v === 'number' && v === crit;
  if (typeof crit === 'boolean') return v => v === crit;
  const s = str(crit);
  const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(s);
  const op = m[1] || '=', rest = m[2];
  const n = rest !== '' && !isNaN(Number(rest)) ? Number(rest) : null;
  return v => {
    if (n !== null) {
      if (typeof v !== 'number') return op === '<>';
      return compare(v, n, op);
    }
    if (rest === '') { const empty = v === null || v === ''; return op === '<>' ? !empty : op === '=' ? empty : false; }
    if (typeof v !== 'string') return op === '<>';
    return compare(v, rest, op);
  };
}

// ---------------- Simulator ----------------
class Sim {
  constructor(sheets, named) {
    this.sheets = sheets;   // name -> {cells: Map('r,c' -> raw), maxRows, maxCols}
    this.named = named;     // name -> {sheet, r, c, nr, nc}
    this.computed = new Map(); this.spill = new Map(); this.owner = new Map(); this.formulas = []; this._rc = new Map();
    for (const [name, sh] of Object.entries(sheets)) {
      for (const [k, v] of sh.cells) if (typeof v === 'string' && v[0] === '=') {
        const [r, c] = k.split(',').map(Number);
        let ast = null, perr = null;
        try { ast = parse(v.slice(1)); } catch (e) { perr = e.message; }
        this.formulas.push({ sheet: name, r, c, src: v, ast, perr });
      }
    }
  }
  key(s, r, c) { return s + '!' + r + ',' + c; }
  get(s, r, c) {
    const k = this.key(s, r, c);
    if (this.spill.has(k)) return this.spill.get(k);
    const raw = this.sheets[s].cells.get(r + ',' + c);
    if (typeof raw === 'string' && raw[0] === '=') { if (!this.computed.has(k)) return null; const v = this.computed.get(k); return isArr(v) ? v[0][0] : v; }
    return raw === undefined || raw === '' ? null : raw;
  }
  rangeObj(node, cur) {
    const s = node.sheet || cur; const sh = this.sheets[s];
    if (!sh) return ERR('#REF!', 'Unknown sheet ' + s);
    const parts = node.a1.replace(/\$/g, '').split(':');
    const p1 = /^([A-Z]+)(\d*)$/.exec(parts[0]), p2 = parts[1] ? /^([A-Z]+)(\d*)$/.exec(parts[1]) : p1;
    const c1 = colNum(p1[1]), c2 = colNum(p2[1]);
    const r1 = p1[2] ? Number(p1[2]) : 1;
    const r2 = p2[2] ? Number(p2[2]) : sh.maxRows;
    return { range: true, s, r1, c1, r2, c2 };
  }
  rangeVals(R) {
    const ck = R.s + '|' + R.r1 + '|' + R.c1 + '|' + R.r2 + '|' + R.c2;
    if (this._rc.has(ck)) return this._rc.get(ck);
    const out = [];
    for (let r = R.r1; r <= R.r2; r++) { const row = []; for (let c = R.c1; c <= R.c2; c++) row.push(this.get(R.s, r, c)); out.push(row); }
    this._rc.set(ck, out);
    return out;
  }
  ev(n, cur) {
    switch (n.k) {
      case 'lit': return n.v;
      case 'empty': return null;
      case 'ref': { const R = this.rangeObj(n, cur); if (isErr(R)) return R; return R.r1 === R.r2 && R.c1 === R.c2 ? this.get(R.s, R.r1, R.c1) : this.rangeVals(R); }
      case 'name': {
        const nm = this.named[n.v];
        if (!nm) return ERR('#NAME?', 'Unknown name ' + n.v);
        if (nm.nr === 1 && nm.nc === 1) return this.get(nm.sheet, nm.r, nm.c);
        return this.rangeVals({ s: nm.sheet, r1: nm.r, c1: nm.c, r2: nm.r + nm.nr - 1, c2: nm.c + nm.nc - 1 });
      }
      case 'neg': return mapArr(this.ev(n.e, cur), v => { const x = num(v); return isErr(x) ? x : -x; });
      case 'arr': {
        const rows = n.rows.map(r => r.map(e => toArr(this.ev(e, cur))));
        const out = [];
        for (const row of rows) {
          const h = row[0].length;
          if (row.some(b => b.length !== h)) return ERR('#VALUE!', 'Array literal: heights differ');
          for (let i = 0; i < h; i++) out.push(row.reduce((a, b) => a.concat(b[i]), []));
        }
        const w = out[0].length; if (out.some(r => r.length !== w)) return ERR('#VALUE!', 'Array literal: widths differ');
        return out;
      }
      case 'bin': {
        const a = this.ev(n.l, cur), b = this.ev(n.r, cur);
        if (isErr(a)) return a; if (isErr(b)) return b;
        const op = n.op;
        return broadcast(a, b, (x, y) => {
          if (isErr(x)) return x; if (isErr(y)) return y;
          if (op === '&') return str(x) + str(y);
          if (['=', '<>', '<', '>', '<=', '>='].includes(op)) return compare(x, y, op);
          const X = num(x), Y = num(y); if (isErr(X)) return X; if (isErr(Y)) return Y;
          if (op === '+') return X + Y; if (op === '-') return X - Y; if (op === '*') return X * Y;
          if (op === '/') return Y === 0 ? ERR('#DIV/0!', 'Division by zero') : X / Y;
          return ERR('#ERROR!', 'op ' + op);
        });
      }
      case 'fn': return this.fn(n, cur);
    }
    throw new Error('node ' + n.k);
  }
  fn(n, cur) {
    const A = n.args, E = i => this.ev(A[i], cur);
    const F = n.f;
    const need = k => { if (A.length < k) throw new Error(F + ' needs ' + k + ' args'); };
    const firstErr = arr => flat(arr).find(isErr);
    const nums = vals => { const out = []; for (const v of vals) { for (const x of flat(v)) { if (isErr(x)) return x; if (typeof x === 'number') out.push(x); } } return out; };
    switch (F) {
      case 'ARRAYFORMULA': return E(0);
      case 'IF': {
        const c = E(0); if (isErr(c)) return c;
        const a = A.length > 1 ? E(1) : true, b = A.length > 2 ? E(2) : false;
        if (!isArr(c)) { const cc = typeof c === 'string' ? ERR('#VALUE!', 'IF condition is text') : truthy(c) || (typeof c === 'number' && c !== 0); if (isErr(cc)) return cc; return cc ? a : b; }
        const ab = broadcast(broadcast(c, a, (x, y) => [x, y]), b, (xy, z) => [xy[0], xy[1], z]);
        if (isErr(ab)) return ab;
        return ab.map(r => r.map(([x, y, z]) => (isErr(x) ? x : truthy(x) ? y : z)));
      }
      case 'IFERROR': { const v = E(0), alt = A.length > 1 ? E(1) : null; if (isErr(v)) return alt; if (isArr(v)) return v.map(r => r.map(x => (isErr(x) ? unwrap(alt) : x))); return v; }
      case 'ISNUMBER': return mapArr(E(0), v => typeof v === 'number');
      case 'AND': { const v = A.map((_, i) => E(i)); const e = v.map(firstErr).find(Boolean); if (e) return e; return v.every(x => flat(x).every(y => truthy(y) || (typeof y === 'number' && y !== 0))); }
      case 'OR': { const v = A.map((_, i) => E(i)); const e = v.map(firstErr).find(Boolean); if (e) return e; return v.some(x => flat(x).some(truthy)); }
      case 'SUM': { const x = nums(A.map((_, i) => E(i))); return isErr(x) ? x : x.reduce((a, b) => a + b, 0); }
      case 'MAX': { const x = nums(A.map((_, i) => E(i))); return isErr(x) ? x : x.length ? Math.max(...x) : 0; }
      case 'MIN': { const x = nums(A.map((_, i) => E(i))); return isErr(x) ? x : x.length ? Math.min(...x) : 0; }
      case 'MEDIAN': { const x = nums([E(0)]); if (isErr(x)) return x; if (!x.length) return ERR('#NUM!', 'MEDIAN of no numbers'); x.sort((a, b) => a - b); const m = x.length >> 1; return x.length % 2 ? x[m] : (x[m - 1] + x[m]) / 2; }
      case 'COUNT': return flat(E(0)).filter(v => typeof v === 'number').length;
      case 'COUNTA': return flat(E(0)).filter(v => v !== null && v !== undefined).length;
      case 'COUNTUNIQUE': { const s = new Set(flat(E(0)).filter(v => v !== null && v !== '').map(v => (typeof v === 'string' ? v.toLowerCase() : v))); return s.size; }
      case 'ROUND': { const v = E(0), d = A.length > 1 ? num(E(1)) : 0; return mapArr(v, x => { const X = num(x); if (isErr(X)) return X; const f = Math.pow(10, d); return Math.round(X * f) / f; }); }
      case 'LOWER': return mapArr(E(0), v => (isErr(v) ? v : str(v).toLowerCase()));
      case 'LEFT': { const t = E(0), k = A.length > 1 ? E(1) : 1; return broadcast(t, k, (x, y) => { if (isErr(x)) return x; if (isErr(y)) return y; return str(x).slice(0, Math.max(0, num(y))); }); }
      case 'FIND': { const f = E(0), t = E(1); return broadcast(f, t, (x, y) => { if (isErr(x)) return x; if (isErr(y)) return y; const i = str(y).indexOf(str(x)); return i < 0 ? ERR('#VALUE!', `FIND: "${x}" not found`) : i + 1; }); }
      case 'SEARCH': { const f = E(0), t = E(1); return broadcast(f, t, (x, y) => { if (isErr(x)) return x; if (isErr(y)) return y; const i = str(y).toLowerCase().indexOf(str(x).toLowerCase()); return i < 0 ? ERR('#VALUE!', 'SEARCH: not found') : i + 1; }); }
      case 'TEXT': { const v = E(0), f = str(E(1)); return mapArr(v, x => (isErr(x) ? x : fmtText(x, f))); }
      case 'TEXTJOIN': { const d = str(E(0)), ign = truthy(E(1)); const parts = []; for (let i = 2; i < A.length; i++) { const v = E(i); const e = firstErr(v); if (e) return e; flat(v).forEach(x => { if (ign && (x === null || x === '')) return; parts.push(str(x)); }); } return parts.join(d); }
      case 'ROW': { const R = this.rangeObj(A[0], cur); const out = []; for (let r = R.r1; r <= R.r2; r++) out.push([r]); return out.length === 1 ? out[0][0] : out; }
      case 'INDEX': {
        let arr = toArr(E(0)); if (isErr(arr)) return arr; const e = firstErr(arr);
        let r = A.length > 1 && A[1].k !== 'empty' ? num(unwrap(E(1))) : 0, c = A.length > 2 && A[2].k !== 'empty' ? num(unwrap(E(2))) : null;
        if (isErr(r)) return r; if (isErr(c)) return c;
        if (c === null) { if (arr[0].length === 1) c = 1; else if (arr.length === 1) { c = r; r = 1; } else c = 0; }
        if (r > arr.length || c > arr[0].length || r < 0 || c < 0) return ERR('#REF!', `INDEX ${r},${c} out of ${arr.length}x${arr[0].length}`);
        let rows = r === 0 ? arr : [arr[r - 1]];
        rows = c === 0 ? rows : rows.map(x => [x[c - 1]]);
        return unwrap(rows);
      }
      case 'MATCH': {
        const key = unwrap(E(0)), arr = flat(E(1)), type = A.length > 2 ? num(E(2)) : 1;
        if (isErr(key)) return key; if (type !== 0) return ERR('#N/A', 'MATCH non-exact not simulated');
        for (let i = 0; i < arr.length; i++) { if (isErr(arr[i])) continue; if (compare(arr[i], key, '=') === true && arr[i] !== null) return i + 1; }
        return ERR('#N/A', 'MATCH: not found');
      }
      case 'VLOOKUP': {
        const keys = E(0), tbl = toArr(E(1)), ci = num(unwrap(E(2)));
        if (isErr(tbl)) return tbl;
        const look = k => { if (isErr(k)) return k; for (const row of tbl) if (row[0] !== null && compare(row[0], k, '=') === true) return ci > row.length ? ERR('#REF!', 'VLOOKUP col') : row[ci - 1]; return ERR('#N/A', `VLOOKUP: ${str(k)} not found`); };
        return mapArr(keys, look);
      }
      case 'FILTER': {
        const data = toArr(E(0)); if (isErr(data)) return data;
        let keep = data.map(() => true);
        for (let i = 1; i < A.length; i++) {
          const cnd = toArr(E(i)); if (isErr(cnd)) return cnd;
          if (cnd.length !== data.length) return ERR('#VALUE!', `FILTER has mismatched range sizes. Expected row count: ${data.length}. column count: 1. Actual row count: ${cnd.length}, column count: ${cnd[0].length}.`);
          cnd.forEach((r, j) => { const x = r[0]; if (isErr(x) || !(truthy(x) || (typeof x === 'number' && x !== 0))) keep[j] = false; });
        }
        const out = data.filter((_, j) => keep[j]);
        return out.length ? out : ERR('#N/A', 'No matches are found in FILTER evaluation.');
      }
      case 'SORT': {
        const data = toArr(E(0)); if (isErr(data)) return data;
        const col = A.length > 1 ? num(E(1)) : 1, asc = A.length > 2 ? truthy(E(2)) : true;
        return data.slice().sort((x, y) => { const a = x[col - 1], b = y[col - 1]; const c = compare(a, b, '<') ? -1 : compare(a, b, '>') ? 1 : 0; return asc ? c : -c; });
      }
      case 'ARRAY_CONSTRAIN': { const d = toArr(E(0)); if (isErr(d)) return d; const r = num(E(1)), c = num(E(2)); return d.slice(0, r).map(x => x.slice(0, c)); }
      case 'RANK': { const v = unwrap(E(0)); if (isErr(v)) return v; const x = nums([E(1)]); if (isErr(x)) return x; if (!x.includes(v)) return ERR('#N/A', 'RANK: value not in range'); return x.filter(y => y > v).length + 1; }
      case 'SUMPRODUCT': { const arrs = A.map((_, i) => flat(E(i))); const n0 = arrs[0].length; if (arrs.some(a => a.length !== n0)) return ERR('#VALUE!', 'SUMPRODUCT sizes'); let s = 0; for (let i = 0; i < n0; i++) { let p = 1; for (const a of arrs) { const x = a[i]; if (isErr(x)) return x; p *= typeof x === 'number' ? x : typeof x === 'boolean' ? (x ? 1 : 0) : 0; } s += p; } return s; }
      case 'COUNTIF': case 'COUNTIFS': case 'SUMIF': case 'SUMIFS': case 'MAXIFS': {
        let target = null, pairs = [];
        if (F === 'SUMIFS' || F === 'MAXIFS') { target = flat(E(0)); for (let i = 1; i < A.length; i += 2) pairs.push([flat(E(i)), E(i + 1)]); }
        else if (F === 'SUMIF') { pairs.push([flat(E(0)), E(1)]); target = A.length > 2 ? flat(E(2)) : pairs[0][0]; }
        else for (let i = 0; i < A.length; i += 2) pairs.push([flat(E(i)), E(i + 1)]);
        const len = pairs[0][0].length;
        if (pairs.some(p => p[0].length !== len) || (target && target.length !== len)) return ERR('#VALUE!', F + ' ranges differ in size');
        const multi = pairs.map(p => p[1]).find(isArr);
        const run = crits => {
          const ms = crits.map(critMatcher); let cnt = 0, sum = 0, mx = null;
          for (let i = 0; i < len; i++) {
            if (!pairs.every((p, j) => ms[j](p[0][i]))) continue;
            cnt++; if (target) { const t = target[i]; if (typeof t === 'number') { sum += t; mx = mx === null ? t : Math.max(mx, t); } }
          }
          return F.startsWith('COUNT') ? cnt : F.startsWith('SUM') ? sum : mx === null ? 0 : mx;
        };
        if (multi) { return multi.map(row => row.map(cv => run(pairs.map(p => (isArr(p[1]) ? cv : unwrap(p[1])))))); }
        return run(pairs.map(p => unwrap(p[1])));
      }
      case 'SPARKLINE': {
        const d = E(0); if (isErr(d)) return d; const e = firstErr(d); if (e) return e;
        if (A.length > 1) { const o = toArr(E(1)); if (isErr(o)) return o; if (o[0].length !== 2) return ERR('#VALUE!', 'SPARKLINE options must be 2 columns'); const oe = firstErr(o); if (oe) return oe; }
        if (flat(d).some(x => typeof x === 'string' && x !== '')) return ERR('#VALUE!', 'SPARKLINE data is text');
        return '[sparkline]';
      }
      case 'QUERY': return this.query(toArr(E(0)), str(E(1)));
    }
    return ERR('#NAME?', 'Unknown function ' + F);
  }
  query(data, q) {
    const col = L => colNum(L) - 1;
    const m = /^select (\w), sum\((\w)\) where (.*) group by (\w) order by sum\((\w)\) desc limit (\d+) label (\w) '([^']*)', sum\((\w)\) '([^']*)'$/.exec(q.trim());
    if (!m) return ERR('#VALUE!', 'QUERY pattern not simulated: ' + q);
    const [, sel, sumc, where, grp, , lim, , l1, , l2] = m;
    const conds = where.split(' and ').map(s => { const mm = /^(\w) (=|<>) (?:'([^']*)'|(-?\d+(?:\.\d+)?))$/.exec(s.trim()); if (!mm) throw new Error('QUERY where: ' + s); return [col(mm[1]), mm[2], mm[3] !== undefined ? mm[3] : Number(mm[4])]; });
    const acc = new Map();
    for (const row of data) {
      if (!conds.every(([c, op, v]) => { const x = row[c]; const eq = typeof v === 'number' ? x === v : x === v; return op === '=' ? eq : !eq && x !== null; })) continue;
      const k = row[col(grp)]; const s = typeof row[col(sumc)] === 'number' ? row[col(sumc)] : 0;
      acc.set(k, (acc.get(k) || 0) + s);
    }
    if (!acc.size) return ERR('#N/A', 'Query completed with an empty output.');
    const rows = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, Number(lim)).map(([k, v]) => [k, v]);
    return [[l1, l2]].concat(rows);
  }
  run(maxPass, onlySheets) {
    const list = onlySheets ? this.formulas.filter(f => onlySheets.includes(f.sheet)) : this.formulas;
    for (let pass = 1; pass <= (maxPass || 12); pass++) {
      let changed = 0;
      this._rc = new Map();
      for (const f of list) {
        const k = this.key(f.sheet, f.r, f.c);
        let v;
        if (f.perr) v = ERR('#ERROR!', 'Parse error: ' + f.perr);
        else { try { v = this.ev(f.ast, f.sheet); } catch (e) { v = ERR('#ERROR!', 'Sim exception: ' + e.message); } }
        // remove old spill
        const old = this.computed.get(k);
        this.spillsOf = this.spillsOf || new Map();
        for (const sk of this.spillsOf.get(k) || []) { this.spill.delete(sk); this.owner.delete(sk); }
        this.spillsOf.set(k, []);
        if (isArr(v)) {
          const sh = this.sheets[f.sheet]; let blocked = null;
          for (let i = 0; i < v.length && !blocked; i++) for (let j = 0; j < v[0].length; j++) {
            if (!i && !j) continue;
            const r = f.r + i, c = f.c + j;
            if (r > sh.maxRows || c > sh.maxCols) { blocked = `spill beyond sheet edge at ${r},${c}`; break; }
            const raw = sh.cells.get(r + ',' + c);
            if (raw !== undefined && raw !== '') { blocked = `would overwrite data at row ${r}, col ${c} ("${String(raw).slice(0, 30)}")`; break; }
            const sk = this.key(f.sheet, r, c); if (this.owner.has(sk) && this.owner.get(sk) !== k) { blocked = `spill collides with another formula at ${r},${c}`; break; }
          }
          if (blocked) v = ERR('#REF!', 'Array result was not expanded because it ' + blocked);
          else v.forEach((row, i) => row.forEach((x, j) => { if (!i && !j) return; const sk = this.key(f.sheet, f.r + i, f.c + j); this.spill.set(sk, x); this.owner.set(sk, k); this.spillsOf.get(k).push(sk); }));
        }
        const sig = JSON.stringify(v);
        if (JSON.stringify(old) !== sig) changed++;
        this.computed.set(k, v);
      }
      if (!changed) return pass;
    }
    return -1;
  }
  value(s, r, c) { const k = this.key(s, r, c); if (this.spill.has(k)) return this.spill.get(k); const v = this.computed.get(k); if (v !== undefined) return isArr(v) ? v[0][0] : v; const raw = this.sheets[s].cells.get(r + ',' + c); return raw === undefined ? null : raw; }
  errors() {
    const out = [];
    for (const f of this.formulas) {
      const v = this.computed.get(this.key(f.sheet, f.r, f.c));
      const bad = isErr(v) ? v : isArr(v) ? flat(v).find(isErr) : null;
      if (bad) out.push({ sheet: f.sheet, r: f.r, c: f.c, err: bad.err, msg: bad.msg, src: f.src });
    }
    return out;
  }
}

/** Build a Sim from the mock module's sheets and named ranges. */
function fromMock(m) {
  const sheets = {};
  m.sheets.forEach(s => { sheets[s.name] = { cells: s.cells, maxRows: s.maxRows, maxCols: s.maxCols }; });
  const named = {};
  Object.entries(m.named).forEach(([k, r]) => { named[k] = { sheet: r.sh.name, r: r.r, c: r.c, nr: r.nr, nc: r.nc }; });
  return new Sim(sheets, named);
}

module.exports = { Sim, fromMock, parse, isErr, flat };
