/**
 * Affinity, Interrelationship, Matrix, Tree and PDPC logic.
 *
 * Pure functions, no Apps Script services, so they run (and are tested) in Node too.
 */

function cleanText(v) {
  return String(v == null ? '' : v).trim();
}

/** Splits "a; b" or multi-line cell text into a list, keeping empty slots so lists can be paired. */
function splitList(v) {
  var s = cleanText(v);
  return s ? s.split(/\s*(?:;|\n)\s*/) : [];
}

// ------------------------------------------------------------------ Affinity Diagram

/**
 * ideas: [{ idea, category }]  ->  { errors, ideas, categories: [{ name, ideas: [text] }], unsorted: [text], total }
 * Categories keep the order in which they first appear.
 */
function groupAffinity(ideas) {
  var list = (ideas || [])
    .map(function (i) { return { idea: cleanText(i.idea), category: cleanText(i.category), source: cleanText(i.source) }; })
    .filter(function (i) { return i.idea; });

  var categories = [];
  var byName = {};
  var unsorted = [];
  list.forEach(function (i) {
    if (!i.category) return unsorted.push(i.idea);
    var key = i.category.toLowerCase();
    if (!byName[key]) {
      byName[key] = { name: i.category, ideas: [] };
      categories.push(byName[key]);
    }
    byName[key].ideas.push(i.idea);
  });

  return { errors: [], ideas: list, categories: categories, unsorted: unsorted, total: list.length };
}

// ------------------------------------------------------------------ Interrelationship Diagram

/**
 * rows: [{ id, idea, causes: "2, 5" }]  (this idea causes ideas 2 and 5)
 * -> { errors, warnings, items: [{ id, idea, causes, out, in, role }], links: [{ from, to }],
 *      keyDrivers: [id], keyOutcomes: [id] }
 * Most outgoing arrows = key driver (root cause). Most incoming arrows = key outcome.
 */
function analyzeInterrelationships(rows) {
  var errors = [];
  var warnings = [];
  var items = [];
  var byId = {};

  (rows || []).forEach(function (r, i) {
    var id = cleanText(r.id).toUpperCase();
    var idea = cleanText(r.idea);
    if (!id && !idea && !cleanText(r.causes)) return;
    if (!id) return errors.push('Row ' + (i + 1) + ': idea has no ID.');
    if (byId[id]) return errors.push('ID "' + id + '" is used more than once.');
    var item = { id: id, idea: idea, causes: parseIdList(r.causes) };
    byId[id] = item;
    items.push(item);
  });

  var links = [];
  var seen = {};
  items.forEach(function (item) {
    item.causes = item.causes.filter(function (to) {
      if (to === item.id) { errors.push('"' + item.id + '" cannot cause itself.'); return false; }
      if (!byId[to]) { errors.push('"' + item.id + '" causes "' + to + '", which does not exist.'); return false; }
      if (seen[item.id + '>' + to]) return false;
      seen[item.id + '>' + to] = true;
      links.push({ from: item.id, to: to });
      return true;
    });
  });

  links.forEach(function (l) {
    if (l.from < l.to && seen[l.to + '>' + l.from]) {
      warnings.push('"' + l.from + '" and "' + l.to + '" cause each other. Keep only the stronger direction.');
    }
  });

  items.forEach(function (item) { item.out = item.causes.length; item['in'] = 0; });
  links.forEach(function (l) { byId[l.to]['in'] += 1; });

  var maxOut = items.reduce(function (m, i) { return Math.max(m, i.out); }, 0);
  var maxIn = items.reduce(function (m, i) { return Math.max(m, i['in']); }, 0);
  items.forEach(function (i) {
    i.role = i.out > i['in'] ? 'Driver' : i['in'] > i.out ? 'Outcome' : i.out ? 'Link' : '';
    if (maxOut && i.out === maxOut) i.role = 'Key driver';
    else if (maxIn && i['in'] === maxIn) i.role = 'Key outcome';
  });

  return {
    errors: errors,
    warnings: warnings,
    items: items,
    links: links,
    keyDrivers: items.filter(function (i) { return i.role === 'Key driver'; }).map(function (i) { return i.id; }),
    keyOutcomes: items.filter(function (i) { return i.role === 'Key outcome'; }).map(function (i) { return i.id; })
  };
}

function parseIdList(value) {
  return String(value == null ? '' : value)
    .split(/[\s,;]+/)
    .map(function (s) { return s.trim().toUpperCase(); })
    .filter(Boolean);
}

// ------------------------------------------------------------------ Matrix Diagram

var MATRIX_SYMBOLS = [
  { symbol: '◎', label: 'Strong', value: 9, aliases: ['S', '9', 'STRONG'] },
  { symbol: '○', label: 'Medium', value: 3, aliases: ['M', '3', 'O', 'MEDIUM'] },
  { symbol: '△', label: 'Weak', value: 1, aliases: ['W', '1', 'WEAK'] },
  { symbol: '✕', label: 'Negative / conflict', value: -3, aliases: ['X', 'N', '-', '-3', 'NEGATIVE'] }
];

function normalizeMatrixSymbol(v) {
  var s = cleanText(v).toUpperCase();
  if (!s) return '';
  for (var i = 0; i < MATRIX_SYMBOLS.length; i++) {
    var m = MATRIX_SYMBOLS[i];
    if (s === m.symbol || m.aliases.indexOf(s) !== -1) return m.symbol;
  }
  return null;
}

/**
 * data: { rows: [name], columns: [name], cells: [[symbol]] }
 * -> { errors, rows, columns, cells, rowTotals, columnTotals, rowConflicts, columnConflicts, symbols }
 * Totals add the strengths (◎ 9, ○ 3, △ 1); ✕ marks a negative relationship (−3) and is also counted.
 */
function analyzeMatrix(data) {
  var errors = [];
  var rows = (data.rows || []).map(cleanText);
  var columns = (data.columns || []).map(cleanText);
  rows.forEach(function (r, i) { if (!r) errors.push('Row ' + (i + 1) + ' has no name.'); });
  columns.forEach(function (c, i) { if (!c) errors.push('Column ' + (i + 1) + ' has no name.'); });
  if (!rows.length) errors.push('Add at least one row.');
  if (!columns.length) errors.push('Add at least one column.');

  var value = {};
  MATRIX_SYMBOLS.forEach(function (m) { value[m.symbol] = m.value; });

  var rowTotals = rows.map(function () { return 0; });
  var columnTotals = columns.map(function () { return 0; });
  var rowConflicts = rows.map(function () { return 0; });
  var columnConflicts = columns.map(function () { return 0; });

  var cells = rows.map(function (r, i) {
    return columns.map(function (c, j) {
      var raw = data.cells && data.cells[i] ? data.cells[i][j] : '';
      var sym = normalizeMatrixSymbol(raw);
      if (sym === null) {
        errors.push('"' + raw + '" (' + r + ' / ' + c + ') is not a known symbol. Use ◎ ○ △ ✕ or S M W X.');
        return '';
      }
      if (sym) {
        rowTotals[i] += value[sym];
        columnTotals[j] += value[sym];
        if (value[sym] < 0) { rowConflicts[i] += 1; columnConflicts[j] += 1; }
      }
      return sym;
    });
  });

  return {
    errors: errors,
    rows: rows,
    columns: columns,
    cells: cells,
    rowTotals: rowTotals,
    columnTotals: columnTotals,
    rowConflicts: rowConflicts,
    columnConflicts: columnConflicts,
    symbols: MATRIX_SYMBOLS.map(function (m) { return { symbol: m.symbol, label: m.label, value: m.value }; })
  };
}

// ------------------------------------------------------------------ Tree Diagram

/**
 * rows: [{ id, parent, text, ...anything }]
 * -> { errors, nodes (depth-first order, each with depth, children, leaves), roots: [id] }
 * Extra fields on the rows are kept on the nodes.
 */
function buildTree(rows) {
  var errors = [];
  var nodes = [];
  var byId = {};

  (rows || []).forEach(function (r, i) {
    var id = cleanText(r.id).toUpperCase();
    if (!id && !cleanText(r.text) && !cleanText(r.parent)) return;
    if (!id) return errors.push('Row ' + (i + 1) + ': item has no ID.');
    if (byId[id]) return errors.push('ID "' + id + '" is used more than once.');
    var node = {};
    Object.keys(r).forEach(function (k) { node[k] = r[k]; });
    node.id = id;
    node.parent = cleanText(r.parent).toUpperCase();
    node.text = cleanText(r.text);
    node.children = [];
    byId[id] = node;
    nodes.push(node);
  });

  nodes.forEach(function (n) {
    if (!n.parent) return;
    if (n.parent === n.id) { errors.push('"' + n.id + '" cannot be its own parent.'); n.parent = ''; return; }
    if (!byId[n.parent]) { errors.push('"' + n.id + '" has parent "' + n.parent + '", which does not exist.'); n.parent = ''; return; }
    byId[n.parent].children.push(n.id);
  });

  // A loop means some items never connect to a root.
  var ordered = [];
  var visited = {};
  function visit(id, depth) {
    var n = byId[id];
    visited[id] = true;
    n.depth = depth;
    ordered.push(n);
    n.children.forEach(function (c) { visit(c, depth + 1); });
    n.leaves = n.children.length
      ? n.children.reduce(function (sum, c) { return sum + byId[c].leaves; }, 0)
      : 1;
  }
  var roots = nodes.filter(function (n) { return !n.parent; }).map(function (n) { return n.id; });
  roots.forEach(function (id) { visit(id, 0); });

  var orphans = nodes.filter(function (n) { return !visited[n.id]; }).map(function (n) { return n.id; });
  if (orphans.length) errors.push('These items are parents of each other in a loop: ' + orphans.join(', ') + '.');
  if (!nodes.length) errors.push('Add at least one item.');

  return { errors: errors, nodes: errors.length ? nodes : ordered, roots: roots };
}

// ------------------------------------------------------------------ Process Decision Program Chart

/**
 * rows: [{ id, parent, text, risks: "r1; r2", countermeasures: "c1; c2" }]
 * Risks and countermeasures are paired by position. A risk with no countermeasure is "open".
 * -> buildTree(...) result + node.pairs [{ risk, countermeasure }], totalRisks, openRisks: [{ id, text, risk }]
 */
function analyzePdpc(rows) {
  var tree = buildTree(rows);
  var total = 0;
  var open = [];
  tree.nodes.forEach(function (n) {
    var risks = splitList(n.risks);
    var cms = splitList(n.countermeasures);
    n.pairs = [];
    risks.forEach(function (risk, i) {
      if (!risk) return;
      var cm = cms[i] || '';
      n.pairs.push({ risk: risk, countermeasure: cm });
      total += 1;
      if (!cm) open.push({ id: n.id, text: n.text, risk: risk });
    });
    var extra = cms.slice(risks.length).filter(Boolean);
    if (extra.length) tree.errors.push('"' + n.id + '" has more countermeasures than risks.');
  });
  tree.totalRisks = total;
  tree.openRisks = open;
  return tree;
}
