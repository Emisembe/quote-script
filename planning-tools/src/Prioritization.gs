/**
 * Prioritization Matrix — weighted scoring.
 *
 * Pure functions, no Apps Script services, so they run (and are tested) in Node too.
 *
 * Each criterion has a weight in percent (100 = normal importance, 150 = matters more,
 * 50 = matters less). Each option gets a score per criterion where HIGHER IS BETTER.
 * Weighted total = sum(score x weight / 100). Highest total wins.
 *
 * Input:  criteria [{ name, weight }], options [{ name, scores: [number per criterion] }]
 * Output: { errors, criteria, options: [{ name, scores, weighted, total, rank }], ranking }
 */

function scorePrioritization(criteria, options) {
  var errors = [];
  criteria = (criteria || []).map(function (c, i) {
    var name = String(c.name == null ? '' : c.name).trim();
    var weight = c.weight === '' || c.weight == null ? 100 : Number(c.weight);
    if (!name) errors.push('Criterion ' + (i + 1) + ' has no name.');
    if (!isFinite(weight) || weight < 0) {
      errors.push('Criterion "' + (name || i + 1) + '" needs a weight of 0 or more.');
      weight = 0;
    }
    return { name: name, weight: weight };
  });
  if (!criteria.length) errors.push('Add at least one criterion.');

  options = (options || []).map(function (o, i) {
    var name = String(o.name == null ? '' : o.name).trim();
    if (!name) errors.push('Option ' + (i + 1) + ' has no name.');
    var scores = criteria.map(function (c, j) {
      var raw = o.scores ? o.scores[j] : '';
      if (raw === '' || raw == null) return 0;
      var n = Number(raw);
      if (!isFinite(n)) {
        errors.push('Option "' + (name || i + 1) + '" has a non-number score for "' + c.name + '".');
        return 0;
      }
      return n;
    });
    var weighted = scores.map(function (s, j) { return roundScore(s * criteria[j].weight / 100); });
    var total = roundScore(weighted.reduce(function (a, b) { return a + b; }, 0));
    return { name: name, scores: scores, weighted: weighted, total: total };
  });
  if (!options.length) errors.push('Add at least one option.');

  // Competition ranking: equal totals share a rank (1, 1, 3).
  var sorted = options.slice().sort(function (a, b) { return b.total - a.total; });
  sorted.forEach(function (o, i) {
    o.rank = i > 0 && o.total === sorted[i - 1].total ? sorted[i - 1].rank : i + 1;
  });

  return {
    errors: errors,
    criteria: criteria,
    options: options,
    ranking: sorted.map(function (o) { return { name: o.name, total: o.total, rank: o.rank }; })
  };
}

function roundScore(n) {
  return Math.round(n * 100) / 100;
}
