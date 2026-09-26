/**
 * Activity Network Diagram — Critical Path Method (CPM).
 *
 * Pure functions, no Apps Script services, so they run (and are tested) in Node too.
 *
 * Input:  [{ id: 'A', name: 'Design', duration: 5, predecessors: ['X', 'Y'] }, ...]
 * Output: {
 *   errors:        [string]            // non-empty => nothing else is computed
 *   tasks:         [{ ...input, es, ef, ls, lf, slack, critical, level }]
 *   duration:      number              // project length
 *   criticalPaths: [{ ids: [..], duration }]
 *   paths:         [{ ids: [..], duration, critical }]   // every start-to-end path, longest first
 * }
 */

var CPM_MAX_PATHS = 200;
var CPM_EPSILON = 1e-9;

/** Turns "A, B;C  D" into ['A', 'B', 'C', 'D']. */
function parsePredecessors(value) {
  if (Array.isArray(value)) return value.map(normalizeTaskId).filter(Boolean);
  return String(value == null ? '' : value)
    .split(/[\s,;]+/)
    .map(normalizeTaskId)
    .filter(Boolean);
}

function normalizeTaskId(id) {
  return String(id == null ? '' : id).trim().toUpperCase();
}

function computeCriticalPath(input) {
  var errors = [];
  var tasks = [];
  var byId = {};

  (input || []).forEach(function (raw, index) {
    var id = normalizeTaskId(raw.id);
    var row = 'Row ' + (index + 1);
    if (!id) {
      errors.push(row + ': task has no ID.');
      return;
    }
    if (byId[id]) {
      errors.push('Task ID "' + id + '" is used more than once.');
      return;
    }
    var duration = Number(raw.duration);
    if (raw.duration === '' || raw.duration == null || !isFinite(duration) || duration < 0) {
      errors.push('Task "' + id + '" needs a duration of 0 or more.');
      duration = 0;
    }
    var task = {
      id: id,
      name: String(raw.name == null ? '' : raw.name).trim(),
      duration: duration,
      predecessors: parsePredecessors(raw.predecessors)
    };
    byId[id] = task;
    tasks.push(task);
  });

  if (!tasks.length && !errors.length) errors.push('Add at least one task.');

  tasks.forEach(function (task) {
    task.predecessors.forEach(function (p) {
      if (p === task.id) errors.push('Task "' + task.id + '" cannot depend on itself.');
      else if (!byId[p]) errors.push('Task "' + task.id + '" depends on "' + p + '", which does not exist.');
    });
  });

  if (errors.length) return { errors: errors, tasks: tasks, duration: 0, criticalPaths: [], paths: [] };

  // Successor lists and a topological order (Kahn's algorithm).
  var successors = {};
  var remaining = {};
  tasks.forEach(function (t) {
    successors[t.id] = [];
    remaining[t.id] = t.predecessors.length;
  });
  tasks.forEach(function (t) {
    t.predecessors.forEach(function (p) { successors[p].push(t.id); });
  });

  var queue = tasks.filter(function (t) { return remaining[t.id] === 0; }).map(function (t) { return t.id; });
  var order = [];
  while (queue.length) {
    var id = queue.shift();
    order.push(id);
    successors[id].forEach(function (s) {
      remaining[s] -= 1;
      if (remaining[s] === 0) queue.push(s);
    });
  }
  if (order.length !== tasks.length) {
    // Stuck tasks are either in a loop or merely downstream of one; peel off the latter.
    var stuck = {};
    tasks.forEach(function (t) { if (remaining[t.id] > 0) stuck[t.id] = true; });
    var pruned = true;
    while (pruned) {
      pruned = false;
      Object.keys(stuck).forEach(function (id) {
        if (!successors[id].some(function (s) { return stuck[s]; })) {
          delete stuck[id];
          pruned = true;
        }
      });
    }
    var looped = tasks.filter(function (t) { return stuck[t.id]; }).map(function (t) { return t.id; });
    return {
      errors: ['These tasks depend on each other in a loop: ' + looped.join(', ') + '.'],
      tasks: tasks, duration: 0, criticalPaths: [], paths: []
    };
  }

  // Forward pass: earliest start / finish, and a column level for drawing.
  order.forEach(function (id) {
    var t = byId[id];
    t.es = 0;
    t.level = 0;
    t.predecessors.forEach(function (p) {
      t.es = Math.max(t.es, byId[p].ef);
      t.level = Math.max(t.level, byId[p].level + 1);
    });
    t.ef = t.es + t.duration;
  });

  var projectDuration = tasks.reduce(function (max, t) { return Math.max(max, t.ef); }, 0);

  // Backward pass: latest start / finish.
  order.slice().reverse().forEach(function (id) {
    var t = byId[id];
    t.lf = projectDuration;
    successors[id].forEach(function (s) { t.lf = Math.min(t.lf, byId[s].ls); });
    t.ls = t.lf - t.duration;
    t.slack = round2(t.ls - t.es);
    t.critical = Math.abs(t.ls - t.es) < CPM_EPSILON;
  });

  // Every start-to-end path with its total length (what you add up by hand).
  var paths = [];
  var truncated = false;
  function walk(id, trail, total) {
    if (paths.length >= CPM_MAX_PATHS) {
      truncated = true;
      return;
    }
    var nextTrail = trail.concat(id);
    var nextTotal = total + byId[id].duration;
    if (!successors[id].length) {
      paths.push({ ids: nextTrail, duration: round2(nextTotal) });
      return;
    }
    successors[id].forEach(function (s) { walk(s, nextTrail, nextTotal); });
  }
  tasks.filter(function (t) { return !t.predecessors.length; }).forEach(function (t) { walk(t.id, [], 0); });

  paths.sort(function (a, b) { return b.duration - a.duration; });
  paths.forEach(function (p) { p.critical = Math.abs(p.duration - projectDuration) < CPM_EPSILON; });

  return {
    errors: [],
    warnings: truncated ? ['Only the first ' + CPM_MAX_PATHS + ' paths are listed.'] : [],
    tasks: tasks,
    duration: round2(projectDuration),
    criticalPaths: paths.filter(function (p) { return p.critical; }),
    paths: paths
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
