/*
 * Compatibility (synastry) and similarity between two birth charts.
 * Scores are built from aspects between the two charts, element harmony
 * between key placements, and house overlays when birth times are known.
 */
(function (root) {
  'use strict';
  const E = root.ChartEngine;

  const PLANETS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
  const SYN_POINTS = PLANETS.concat(['nnode', 'juno', 'asc', 'mc']);

  const SYN_ASPECTS = [
    { key: 'conjunction', name: 'Conjunction', angle: 0, orb: 7, glyph: '☌' },
    { key: 'opposition', name: 'Opposition', angle: 180, orb: 7, glyph: '☍' },
    { key: 'trine', name: 'Trine', angle: 120, orb: 6, glyph: '△' },
    { key: 'square', name: 'Square', angle: 90, orb: 6, glyph: '□' },
    { key: 'sextile', name: 'Sextile', angle: 60, orb: 4, glyph: '⚹' }
  ];

  // Each area lists the cross-chart pairs that describe it, with weights.
  const AREAS = [
    {
      key: 'emotional', name: 'Emotional connection',
      about: 'How safe, understood and at ease you feel with each other. Driven mainly by the Moons.',
      pairs: [['moon', 'moon', 3], ['sun', 'moon', 3], ['moon', 'venus', 2], ['moon', 'asc', 1.5], ['moon', 'jupiter', 1.2], ['moon', 'neptune', 1], ['moon', 'saturn', 1.5], ['moon', 'pluto', 1], ['moon', 'mars', 1.2]],
      elements: ['moon']
    },
    {
      key: 'romance', name: 'Romance and attraction',
      about: 'Chemistry, desire and romantic spark. Driven mainly by Venus and Mars.',
      pairs: [['venus', 'mars', 3], ['sun', 'venus', 2], ['venus', 'venus', 1.5], ['mars', 'mars', 1.2], ['venus', 'pluto', 1.5], ['mars', 'pluto', 1], ['venus', 'uranus', 1], ['sun', 'mars', 1.5], ['venus', 'asc', 1.2], ['mars', 'asc', 1], ['moon', 'mars', 1]],
      elements: ['venus', 'mars']
    },
    {
      key: 'communication', name: 'Communication',
      about: 'How easily you talk, listen, plan and understand each other\'s thinking. Driven mainly by Mercury.',
      pairs: [['mercury', 'mercury', 3], ['mercury', 'sun', 2], ['mercury', 'moon', 2], ['mercury', 'venus', 1.2], ['mercury', 'jupiter', 1.5], ['mercury', 'saturn', 1], ['mercury', 'uranus', 1], ['mercury', 'mars', 1.5], ['mercury', 'asc', 1]],
      elements: ['mercury']
    },
    {
      key: 'values', name: 'Values and lifestyle',
      about: 'Shared tastes, priorities, money habits and the way you like to live day to day.',
      pairs: [['venus', 'venus', 2], ['moon', 'moon', 1.5], ['sun', 'sun', 2], ['jupiter', 'jupiter', 1], ['venus', 'jupiter', 1.5], ['saturn', 'saturn', 1], ['venus', 'saturn', 1]],
      elements: ['sun', 'venus']
    },
    {
      key: 'commitment', name: 'Long-term commitment',
      about: 'Staying power, loyalty and the ability to build a future together. Saturn contacts and Sun–Moon links matter most.',
      pairs: [['saturn', 'sun', 2.5], ['saturn', 'moon', 2.5], ['saturn', 'venus', 2.5], ['sun', 'moon', 2], ['nnode', 'sun', 1], ['nnode', 'moon', 1], ['nnode', 'venus', 1], ['saturn', 'asc', 1], ['saturn', 'mars', 1], ['jupiter', 'saturn', 1], ['juno', 'sun', 2], ['juno', 'moon', 1.5], ['juno', 'venus', 2], ['juno', 'asc', 1]],
      elements: []
    },
    {
      key: 'growth', name: 'Friendship and growth',
      about: 'Encouragement, shared humour and how much you help each other grow. Jupiter contacts matter most.',
      pairs: [['jupiter', 'sun', 2], ['jupiter', 'moon', 1.5], ['jupiter', 'venus', 1.5], ['jupiter', 'mercury', 1], ['sun', 'sun', 1.5], ['uranus', 'sun', 1], ['nnode', 'jupiter', 1], ['jupiter', 'asc', 1]],
      elements: ['sun']
    },
    {
      key: 'harmony', name: 'Handling conflict',
      about: 'How smoothly you handle disagreements and daily friction. Mars and Saturn contacts matter most. A high score means conflict is easier to manage.',
      pairs: [['mars', 'mars', 2], ['mars', 'sun', 2], ['mars', 'moon', 2], ['mars', 'saturn', 2], ['mars', 'pluto', 1.5], ['sun', 'sun', 1], ['moon', 'moon', 1], ['saturn', 'sun', 1], ['mars', 'mercury', 1.2]],
      elements: ['moon', 'mars']
    }
  ];

  const HEAVY = new Set(['saturn', 'pluto', 'mars']);

  // Value of one cross aspect for one area: positive supports, negative strains.
  function aspectValue(area, a, b, asp) {
    const heavy = HEAVY.has(a) || HEAVY.has(b);
    const attraction = area === 'romance' && ((a === 'venus' && b === 'mars') || (a === 'mars' && b === 'venus') || a === 'pluto' || b === 'pluto');
    switch (asp) {
      case 'trine': return 1;
      case 'sextile': return 0.8;
      case 'conjunction':
        if (area === 'harmony' && heavy) return -0.4;
        if ((a === 'saturn' || b === 'saturn') && area !== 'commitment') return 0.2;
        return heavy && !attraction ? 0.5 : 1;
      case 'square':
        if (attraction) return 0.3;
        if (a === 'saturn' || b === 'saturn') return -1;
        return -0.8;
      case 'opposition':
        if (attraction) return 0.4;
        if (a === 'saturn' || b === 'saturn') return -0.8;
        return -0.5;
      default: return 0;
    }
  }

  function crossAspects(A, B) {
    const out = [];
    const pa = A.points.filter(p => SYN_POINTS.includes(p.key) && !(A.noHouses && ['asc', 'mc'].includes(p.key)));
    const pb = B.points.filter(p => SYN_POINTS.includes(p.key) && !(B.noHouses && ['asc', 'mc'].includes(p.key)));
    for (const p of pa) for (const q of pb) {
      const sep = Math.abs(E.angDiff(p.lon, q.lon));
      for (const asp of SYN_ASPECTS) {
        let orb = asp.orb;
        if (['sun', 'moon'].includes(p.key) || ['sun', 'moon'].includes(q.key)) orb += 1;
        if (['nnode', 'juno', 'asc', 'mc'].includes(p.key) || ['nnode', 'juno', 'asc', 'mc'].includes(q.key)) orb -= 2;
        // Moon moves fast; without a birth time its position is uncertain, so tighten.
        if ((p.key === 'moon' && A.noHouses) || (q.key === 'moon' && B.noHouses)) orb -= 2;
        const off = Math.abs(sep - asp.angle);
        if (off <= orb) { out.push({ a: p.key, b: q.key, aspect: asp, orb: off, maxOrb: orb }); break; }
      }
    }
    return out.sort((x, y) => x.orb - y.orb);
  }

  const ELEMENT_OF = lon => E.signOf(lon).sign.element;
  const MODE_OF = lon => E.signOf(lon).sign.mode;
  const COMPATIBLE = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };

  const PLACEMENT_LABEL = { sun: 'Suns', moon: 'Moons', mercury: 'Mercury placements', venus: 'Venus placements', mars: 'Mars placements' };
  function elementHarmony(A, B, key) {
    const la = A.points.find(p => p.key === key).lon, lb = B.points.find(p => p.key === key).lon;
    const ea = ELEMENT_OF(la), eb = ELEMENT_OF(lb);
    const who = PLACEMENT_LABEL[key] || key;
    if (ea === eb) return { value: 0.8, note: `${who}: both in ${ea} signs, so this part of you works in a similar way` };
    if (COMPATIBLE[ea] === eb) return { value: 0.5, note: `${who}: ${ea} and ${eb}, which support and feed each other` };
    if (MODE_OF(la) === MODE_OF(lb)) return { value: -0.4, note: `${who}: ${ea} and ${eb} in the same modality, which tends to create friction` };
    return { value: 0, note: `${who}: ${ea} and ${eb}, which work differently without clashing` };
  }

  const squash = raw => Math.round(50 + 45 * Math.tanh(raw / 5));

  function scoreArea(area, aspects, A, B) {
    let raw = 0;
    const support = [], strain = [];
    for (const x of aspects) {
      const spec = area.pairs.find(([p, q]) => (p === x.a && q === x.b) || (p === x.b && q === x.a));
      if (!spec) continue;
      const tight = 1 - x.orb / (x.maxOrb + 1);
      const v = aspectValue(area.key, x.a, x.b, x.aspect.key) * spec[2] * tight;
      raw += v;
      (v >= 0 ? support : strain).push({ ...x, weight: v });
    }
    const elements = area.elements.map(k => ({ key: k, ...elementHarmony(A, B, k) }));
    elements.forEach(e => { raw += e.value; });
    support.sort((x, y) => y.weight - x.weight);
    strain.sort((x, y) => x.weight - y.weight);
    return { ...area, score: squash(raw), raw, support, strain, elements };
  }

  // Element and modality mix, weighted like the Characteristics tab.
  const WEIGHTS = { sun: 3, moon: 3, asc: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 0.5, neptune: 0.5, pluto: 0.5 };
  function mix(chart) {
    const el = { fire: 0, earth: 0, air: 0, water: 0 }, md = { cardinal: 0, fixed: 0, mutable: 0 };
    let tot = 0;
    Object.entries(WEIGHTS).forEach(([k, w]) => {
      if (chart.noHouses && k === 'asc') return;
      const s = E.signOf(chart.points.find(p => p.key === k).lon).sign;
      el[s.element] += w; md[s.mode] += w; tot += w;
    });
    Object.keys(el).forEach(k => { el[k] /= tot; });
    Object.keys(md).forEach(k => { md[k] /= tot; });
    return { el, md };
  }

  function similarity(A, B) {
    const ma = mix(A), mb = mix(B);
    const dist = (x, y) => Object.keys(x).reduce((s, k) => s + Math.abs(x[k] - y[k]), 0) / 2;
    const elementSim = 1 - dist(ma.el, mb.el);
    const modeSim = 1 - dist(ma.md, mb.md);
    const keys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].concat(A.noHouses || B.noHouses ? [] : ['asc', 'mc']);
    const sign = (c, k) => E.signOf(c.points.find(p => p.key === k).lon).sign;
    const same = keys.filter(k => sign(A, k).key === sign(B, k).key).map(k => ({ key: k, sign: sign(A, k) }));
    const sameElement = keys.filter(k => sign(A, k).key !== sign(B, k).key && sign(A, k).element === sign(B, k).element).map(k => ({ key: k, element: sign(A, k).element }));
    // Outer planets and Jupiter–Saturn are shared by people born close together, so leave them out of the score.
    const personal = ['sun', 'moon', 'mercury', 'venus', 'mars'].concat(A.noHouses || B.noHouses ? [] : ['asc']);
    const signMatch = personal.reduce((s, k) => s + (sign(A, k).key === sign(B, k).key ? 1 : sign(A, k).element === sign(B, k).element ? 0.5 : 0), 0) / personal.length;
    const score = Math.round((elementSim * 0.4 + modeSim * 0.2 + signMatch * 0.4) * 100);
    const topEl = m => Object.keys(m.el).sort((x, y) => m.el[y] - m.el[x])[0];
    const topMd = m => Object.keys(m.md).sort((x, y) => m.md[y] - m.md[x])[0];
    return { score, elementSim, modeSim, same, sameElement, mixA: ma, mixB: mb, topA: [topEl(ma), topMd(ma)], topB: [topEl(mb), topMd(mb)] };
  }

  // Where one person's planets land in the other person's houses.
  function overlays(host, guest) {
    if (host.noHouses) return [];
    return ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].map(k => {
      const p = guest.points.find(x => x.key === k);
      return { key: k, house: E.houseOf(p.lon, host.houses.cusps) };
    });
  }

  function compare(A, B) {
    const aspects = crossAspects(A, B);
    const areas = AREAS.map(area => scoreArea(area, aspects, A, B));
    const weights = { emotional: 1.3, romance: 1.1, communication: 1.1, values: 1, commitment: 1.2, growth: 0.8, harmony: 1 };
    const overall = Math.round(areas.reduce((s, a) => s + a.score * weights[a.key], 0) / areas.reduce((s, a) => s + weights[a.key], 0));
    return {
      aspects, areas, overall,
      similarity: similarity(A, B),
      overlaysAinB: overlays(B, A),
      overlaysBinA: overlays(A, B)
    };
  }

  function label(score) {
    if (score >= 80) return { text: 'Very strong', cls: 'ok' };
    if (score >= 65) return { text: 'Strong', cls: 'ok' };
    if (score >= 50) return { text: 'Balanced', cls: 'warn' };
    if (score >= 35) return { text: 'Takes work', cls: 'warn' };
    return { text: 'Challenging', cls: 'bad' };
  }

  const OVERLAY_TEXT = [
    'feels strongly personal: they affect how the other sees themselves and even how they present themselves.',
    'touches money, possessions and self-worth. Shared finances and values come into focus.',
    'stimulates conversation, ideas and everyday exchange.',
    'feels like home and family. This can create a deep sense of belonging.',
    'brings romance, fun, play and creativity. A classic sign of enjoyment together.',
    'shows up in daily routines, work and health. Practical and helpful, sometimes critical.',
    'lands in the house of partnership, which is a strong indicator of commitment and one-to-one bonding.',
    'stirs intimacy, trust and transformation. Intense and hard to ignore.',
    'expands horizons through travel, study and shared beliefs.',
    'affects career, status and public life. One supports or shapes the other\'s ambitions.',
    'feels like friendship, with shared goals and social circles.',
    'touches the private, hidden or spiritual side. It can be deeply intimate or confusing.'
  ];

  root.ChartCompat = { compare, label, AREAS, OVERLAY_TEXT };
})(typeof window !== 'undefined' ? window : globalThis);
