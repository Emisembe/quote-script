/*
 * Birth-chart calculation engine.
 *
 * Works in the browser (expects the global `Astronomy` from astronomy-engine)
 * and in Node (set globalThis.Astronomy = require('astronomy-engine') first).
 * All longitudes are tropical, true ecliptic of date, in degrees 0–360.
 */
(function (root) {
  'use strict';

  const A = root.Astronomy;
  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;

  const norm = d => ((d % 360) + 360) % 360;
  const sind = d => Math.sin(d * D2R);
  const cosd = d => Math.cos(d * D2R);
  const tand = d => Math.tan(d * D2R);
  const atan2d = (y, x) => Math.atan2(y, x) * R2D;
  const asind = x => Math.asin(Math.max(-1, Math.min(1, x))) * R2D;
  const acosd = x => Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
  // Signed smallest difference a - b in (-180, 180].
  const angDiff = (a, b) => { const d = norm(a - b); return d > 180 ? d - 360 : d; };

  const SIGNS = [
    { key: 'ari', name: 'Aries', short: 'Ari', glyph: '♈', element: 'fire', mode: 'cardinal', ruler: 'mars' },
    { key: 'tau', name: 'Taurus', short: 'Tau', glyph: '♉', element: 'earth', mode: 'fixed', ruler: 'venus' },
    { key: 'gem', name: 'Gemini', short: 'Gem', glyph: '♊', element: 'air', mode: 'mutable', ruler: 'mercury' },
    { key: 'can', name: 'Cancer', short: 'Can', glyph: '♋', element: 'water', mode: 'cardinal', ruler: 'moon' },
    { key: 'leo', name: 'Leo', short: 'Leo', glyph: '♌', element: 'fire', mode: 'fixed', ruler: 'sun' },
    { key: 'vir', name: 'Virgo', short: 'Vir', glyph: '♍', element: 'earth', mode: 'mutable', ruler: 'mercury' },
    { key: 'lib', name: 'Libra', short: 'Lib', glyph: '♎', element: 'air', mode: 'cardinal', ruler: 'venus' },
    { key: 'sco', name: 'Scorpio', short: 'Sco', glyph: '♏', element: 'water', mode: 'fixed', ruler: 'pluto' },
    { key: 'sag', name: 'Sagittarius', short: 'Sag', glyph: '♐', element: 'fire', mode: 'mutable', ruler: 'jupiter' },
    { key: 'cap', name: 'Capricorn', short: 'Cap', glyph: '♑', element: 'earth', mode: 'cardinal', ruler: 'saturn' },
    { key: 'aqu', name: 'Aquarius', short: 'Aqu', glyph: '♒', element: 'air', mode: 'fixed', ruler: 'uranus' },
    { key: 'pis', name: 'Pisces', short: 'Pis', glyph: '♓', element: 'water', mode: 'mutable', ruler: 'neptune' }
  ];

  const PLANET_BODIES = {
    sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars',
    jupiter: 'Jupiter', saturn: 'Saturn', uranus: 'Uranus', neptune: 'Neptune', pluto: 'Pluto'
  };

  function signOf(lon) {
    lon = norm(lon);
    const i = Math.floor(lon / 30);
    return { index: i, sign: SIGNS[i], deg: lon - i * 30 };
  }

  // 22°43′ style, rounded to the nearest minute.
  function fmtDeg(lon, withSign = true) {
    const s = signOf(norm(Math.round(norm(lon) * 60) / 60));
    const totalMin = Math.round(s.deg * 60);
    const d = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const body = `${d}°${String(m).padStart(2, '0')}′`;
    return withSign ? `${body} ${s.sign.name}` : body;
  }

  // ---------- time ----------

  // Build an astronomy-engine time from civil date/time + UTC offset in hours.
  function makeTime(dateStr, timeStr, utcOffsetHours) {
    const [y, mo, d] = dateStr.split('-').map(Number);
    const [h, mi] = (timeStr || '12:00').split(':').map(Number);
    const ms = Date.UTC(y, mo - 1, d, h, mi) - utcOffsetHours * 3600e3;
    return A.MakeTime(new Date(ms));
  }

  // ---------- bodies ----------

  function eclipticOfDate(vecEqj, time) {
    const rot = A.Rotation_EQJ_ECT(time);
    const v = A.RotateVector(rot, vecEqj);
    const sph = A.SphereFromVector(v);
    return { lon: norm(sph.lon), lat: sph.lat, dist: sph.dist };
  }

  function bodyLon(key, time) {
    return eclipticOfDate(A.GeoVector(A.Body[PLANET_BODIES[key]], time, true), time).lon;
  }

  function speedOf(fn, time) {
    // degrees per day, central difference over ±6 h
    const a = fn(time.AddDays(-0.25));
    const b = fn(time.AddDays(0.25));
    return angDiff(b, a) / 0.5;
  }

  function julianCenturies(time) { return time.tt / 36525; }

  function meanNode(time) {
    const T = julianCenturies(time);
    return norm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T * T * T / 467441 - T ** 4 / 60616000);
  }

  // True (osculating) node from the Moon's geocentric state vector.
  function trueNode(time) {
    const st = A.GeoMoonState(time);
    const rot = A.Rotation_EQJ_ECT(time);
    const r = A.RotateVector(rot, new A.Vector(st.x, st.y, st.z, time));
    const v = A.RotateVector(rot, new A.Vector(st.vx, st.vy, st.vz, time));
    const hx = r.y * v.z - r.z * v.y;
    const hy = r.z * v.x - r.x * v.z;
    return norm(atan2d(hx, -hy));
  }

  // Mean Black Moon Lilith (mean lunar apogee).
  function meanLilith(time) {
    const T = julianCenturies(time);
    const perigee = 83.3532465 + 4069.0137287 * T - 0.01032 * T * T - T ** 3 / 80053 + T ** 4 / 18999000;
    return norm(perigee + 180);
  }

  // ---------- Chiron ----------
  // astronomy-engine has no Chiron, so we integrate its heliocentric orbit with
  // the library's N-body GravitySimulator (Sun + major planets) starting from
  // osculating elements. Accurate to well under a degree across 1900–2100.
  const CHIRON_EL = {
    // Osculating elements (heliocentric ecliptic J2000) at perihelion, Feb 1996.
    epochJd: 2450119.7,
    a: 13.6700, e: 0.38318, i: 6.9350, node: 209.3805, peri: 339.5240, M: 0
  };
  const chironCache = new Map();

  function chironStateAtEpoch() {
    const el = CHIRON_EL;
    const GM = 0.2959122082855911e-3; // AU^3/day^2, Sun
    let E = el.M * D2R;
    for (let k = 0; k < 50; k++) E = E - (E - el.e * Math.sin(E) - el.M * D2R) / (1 - el.e * Math.cos(E));
    const xv = el.a * (Math.cos(E) - el.e);
    const yv = el.a * Math.sqrt(1 - el.e * el.e) * Math.sin(E);
    const n = Math.sqrt(GM / el.a ** 3);
    const r = el.a * (1 - el.e * Math.cos(E));
    const vxv = -el.a * n * Math.sin(E) / (1 - el.e * Math.cos(E)) * el.a / el.a;
    const vyv = el.a * n * Math.sqrt(1 - el.e * el.e) * Math.cos(E) / (1 - el.e * Math.cos(E));
    void r;
    const O = el.node * D2R, w = el.peri * D2R, I = el.i * D2R;
    const rot = (x, y) => {
      const cO = Math.cos(O), sO = Math.sin(O), cw = Math.cos(w), sw = Math.sin(w), cI = Math.cos(I), sI = Math.sin(I);
      return [
        (cO * cw - sO * sw * cI) * x + (-cO * sw - sO * cw * cI) * y,
        (sO * cw + cO * sw * cI) * x + (-sO * sw + cO * cw * cI) * y,
        (sw * sI) * x + (cw * sI) * y
      ];
    };
    const p = rot(xv, yv);
    const v = rot(vxv, vyv);
    // ecliptic J2000 -> equatorial J2000
    const eps = 23.4392911 * D2R;
    const toEq = ([x, y, z]) => [x, y * Math.cos(eps) - z * Math.sin(eps), y * Math.sin(eps) + z * Math.cos(eps)];
    const pe = toEq(p), ve = toEq(v);
    // elements are heliocentric; simulator wants barycentric
    const t0 = A.MakeTime(el.epochJd - 2451545.0);
    const sunB = A.HelioState(A.Body.SSB, t0); // SSB relative to Sun
    return new A.StateVector(pe[0] - sunB.x, pe[1] - sunB.y, pe[2] - sunB.z,
      ve[0] - sunB.vx, ve[1] - sunB.vy, ve[2] - sunB.vz, t0);
  }

  function chironHelioEqj(time) {
    const key = Math.round(time.ut * 4) / 4; // cache per 6 h
    if (chironCache.has(key)) return chironCache.get(key);
    const start = chironStateAtEpoch();
    const sim = new A.GravitySimulator(A.Body.SSB, start.t, [start]);
    const span = time.tt - start.t.tt;
    const steps = Math.max(1, Math.ceil(Math.abs(span) / 5));
    let st;
    for (let k = 1; k <= steps; k++) {
      st = sim.Update(start.t.AddDays(span * k / steps))[0];
    }
    const sunB = A.HelioState(A.Body.SSB, time);
    const vec = new A.Vector(st.x + sunB.x, st.y + sunB.y, st.z + sunB.z, time);
    if (chironCache.size > 200) chironCache.clear();
    chironCache.set(key, vec);
    return vec;
  }

  function chironLon(time) {
    // Geocentric = heliocentric(Chiron) - heliocentric(Earth), with light time.
    let t = time;
    let lon;
    for (let k = 0; k < 2; k++) {
      const c = chironHelioEqj(t);
      const e = A.HelioVector(A.Body.Earth, time);
      const g = new A.Vector(c.x - e.x, c.y - e.y, c.z - e.z, time);
      lon = eclipticOfDate(g, time).lon;
      const dist = Math.hypot(g.x, g.y, g.z);
      t = time.AddDays(-dist * 0.0057755183);
    }
    return lon;
  }

  // ---------- angles & houses ----------

  function obliquity(time) { return A.e_tilt(time).tobl; }

  function ramcOf(time, lonEast) { return norm(A.SiderealTime(time) * 15 + lonEast); }

  function mcFrom(ramc, eps) { return norm(atan2d(sind(ramc), cosd(ramc) * cosd(eps))); }

  function ascFrom(ramc, eps, lat) {
    return norm(atan2d(cosd(ramc), -(sind(ramc) * cosd(eps) + tand(lat) * sind(eps))));
  }

  // Ecliptic longitude of the point with the given right ascension.
  const lonFromRA = (ra, eps) => norm(atan2d(sind(ra), cosd(ra) * cosd(eps)));

  function placidus(ramc, eps, lat) {
    const asc = ascFrom(ramc, eps, lat);
    const mc = mcFrom(ramc, eps);
    // Placidus is undefined inside the polar circles; caller falls back.
    if (Math.abs(lat) >= 90 - eps) return null;
    const cusp = (frac, below) => {
      let ra = ramc + (below ? 90 + 90 * frac : 90 * frac);
      for (let k = 0; k < 60; k++) {
        const lon = lonFromRA(ra, eps);
        const dec = asind(sind(eps) * sind(lon));
        const sda = acosd(-tand(lat) * tand(dec)); // semi-diurnal arc
        const next = below ? ramc + sda + (180 - sda) * frac : ramc + sda * frac;
        if (Math.abs(angDiff(next, ra)) < 1e-9) { ra = next; break; }
        ra = next;
      }
      return lonFromRA(ra, eps);
    };
    const c = new Array(12);
    c[0] = asc; c[9] = mc;
    c[10] = cusp(1 / 3, false); c[11] = cusp(2 / 3, false);
    c[1] = cusp(1 / 3, true); c[2] = cusp(2 / 3, true);
    c[3] = norm(mc + 180); c[6] = norm(asc + 180);
    c[4] = norm(c[10] + 180); c[5] = norm(c[11] + 180);
    c[7] = norm(c[1] + 180); c[8] = norm(c[2] + 180);
    return c;
  }

  function housesFor(system, ramc, eps, lat) {
    const asc = ascFrom(ramc, eps, lat);
    const mc = mcFrom(ramc, eps);
    if (system === 'placidus') {
      const p = placidus(ramc, eps, lat);
      if (p) return { system, cusps: p };
      system = 'porphyry';
    }
    if (system === 'whole') {
      const start = Math.floor(asc / 30) * 30;
      return { system, cusps: Array.from({ length: 12 }, (_, i) => norm(start + i * 30)) };
    }
    if (system === 'equal') {
      return { system, cusps: Array.from({ length: 12 }, (_, i) => norm(asc + i * 30)) };
    }
    // Porphyry: trisect each quadrant.
    const c = new Array(12);
    const q1 = norm(mc + 180 - asc) / 3; // ASC -> IC
    const q2 = norm(asc - mc) / 3;       // MC -> ASC
    c[0] = asc; c[1] = norm(asc + q1); c[2] = norm(asc + 2 * q1); c[3] = norm(mc + 180);
    c[9] = mc; c[10] = norm(mc + q2); c[11] = norm(mc + 2 * q2);
    for (let i = 4; i < 9; i++) c[i] = norm(c[(i + 6) % 12] + 180);
    return { system: 'porphyry', cusps: c };
  }

  function houseOf(lon, cusps) {
    for (let i = 0; i < 12; i++) {
      const a = cusps[i], b = cusps[(i + 1) % 12];
      const span = norm(b - a);
      if (norm(lon - a) < span) return i + 1;
    }
    return 1;
  }

  // ---------- aspects ----------

  const ASPECTS = [
    { key: 'conjunction', name: 'Conjunction', angle: 0, orb: 8, glyph: '☌', major: true, tone: 'blend' },
    { key: 'opposition', name: 'Opposition', angle: 180, orb: 8, glyph: '☍', major: true, tone: 'tension' },
    { key: 'trine', name: 'Trine', angle: 120, orb: 7, glyph: '△', major: true, tone: 'flow' },
    { key: 'square', name: 'Square', angle: 90, orb: 7, glyph: '□', major: true, tone: 'tension' },
    { key: 'sextile', name: 'Sextile', angle: 60, orb: 5, glyph: '⚹', major: true, tone: 'flow' },
    { key: 'quincunx', name: 'Quincunx', angle: 150, orb: 3, glyph: '⚻', major: false, tone: 'adjust' },
    { key: 'semisextile', name: 'Semi-sextile', angle: 30, orb: 2, glyph: '⚺', major: false, tone: 'adjust' },
    { key: 'semisquare', name: 'Semi-square', angle: 45, orb: 2, glyph: '∠', major: false, tone: 'tension' },
    { key: 'sesquiquadrate', name: 'Sesquiquadrate', angle: 135, orb: 2, glyph: '⚼', major: false, tone: 'tension' }
  ];

  function findAspects(points, opts = {}) {
    const orbScale = opts.orbScale ?? 1;
    const includeMinor = opts.includeMinor ?? false;
    const out = [];
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const p = points[i], q = points[j];
        if (p.pair === q.key || q.pair === p.key) continue; // node axis, ASC/DSC, MC/IC
        const sep = Math.abs(angDiff(p.lon, q.lon));
        for (const asp of ASPECTS) {
          if (!asp.major && !includeMinor) continue;
          // lights get wider orbs, calculated points tighter ones
          let orb = asp.orb * orbScale;
          if (p.kind === 'point' || q.kind === 'point') orb *= 0.6;
          if (p.key === 'sun' || p.key === 'moon' || q.key === 'sun' || q.key === 'moon') orb += asp.major ? 2 : 0.5;
          const off = Math.abs(sep - asp.angle);
          if (off <= orb) {
            // applying if the faster body is moving toward exactness
            let applying = null;
            if (p.speed != null && q.speed != null) {
              const future = Math.abs(Math.abs(angDiff(p.lon + p.speed * 0.01, q.lon + q.speed * 0.01)) - asp.angle);
              applying = future < off;
            }
            out.push({ a: p.key, b: q.key, aspect: asp, orb: off, applying });
            break;
          }
        }
      }
    }
    return out.sort((x, y) => x.orb - y.orb);
  }

  // ---------- patterns ----------

  function findPatterns(points, aspects) {
    const has = (a, b, k) => aspects.some(x => ((x.a === a && x.b === b) || (x.a === b && x.b === a)) && x.aspect.key === k);
    const keys = points.filter(p => p.kind !== 'angle-derived').map(p => p.key);
    const out = [];
    const seen = new Set();
    const add = (type, members, note) => {
      const id = type + ':' + [...members].sort().join(',');
      if (seen.has(id)) return;
      seen.add(id);
      out.push({ type, members, note });
    };
    for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) for (let k = j + 1; k < keys.length; k++) {
      const [a, b, c] = [keys[i], keys[j], keys[k]];
      const tri = [[a, b, c], [b, c, a], [c, a, b]];
      if (has(a, b, 'trine') && has(b, c, 'trine') && has(a, c, 'trine')) add('Grand Trine', [a, b, c], 'Three points in easy, self-sustaining flow.');
      for (const [x, y, z] of tri) {
        if (has(x, y, 'opposition') && has(x, z, 'square') && has(y, z, 'square')) add('T-Square', [x, y, z], `${z} is the focal point where the opposition's tension is worked out.`);
        if (has(x, z, 'quincunx') && has(y, z, 'quincunx') && has(x, y, 'sextile')) add('Yod', [x, y, z], `${z} is the apex: an adjustment the chart keeps returning to.`);
      }
    }
    // Stelliums: 3+ planets in the same sign.
    const bySign = {};
    points.filter(p => p.kind === 'planet').forEach(p => {
      const s = signOf(p.lon).sign.name;
      (bySign[s] = bySign[s] || []).push(p.key);
    });
    Object.entries(bySign).forEach(([s, m]) => { if (m.length >= 3) add('Stellium', m, `Concentration of energy in ${s}.`); });
    return out;
  }

  // ---------- main ----------

  /**
   * input: { date:'YYYY-MM-DD', time:'HH:MM', utcOffset:Number, lat:Number, lon:Number,
   *          houseSystem:'placidus'|'whole'|'equal'|'porphyry', nodeType:'true'|'mean' }
   */
  function computeChart(input) {
    const time = makeTime(input.date, input.time, input.utcOffset);
    const eps = obliquity(time);
    const ramc = ramcOf(time, input.lon);
    const asc = ascFrom(ramc, eps, input.lat);
    const mc = mcFrom(ramc, eps);
    const houses = housesFor(input.houseSystem || 'placidus', ramc, eps, input.lat);
    // Vertex: ascendant of the co-latitude, on the western side.
    const coLat = input.lat >= 0 ? 90 - input.lat : -90 - input.lat;
    let vertex = ascFrom(norm(ramc + 180), eps, coLat);
    // The Vertex always falls in the western half of the chart.
    if (Math.abs(angDiff(vertex, asc + 180)) > 90) vertex = norm(vertex + 180);

    const pts = [];
    for (const key of Object.keys(PLANET_BODIES)) {
      const fn = t => bodyLon(key, t);
      pts.push({ key, kind: 'planet', lon: fn(time), speed: speedOf(fn, time) });
    }
    const nodeFn = input.nodeType === 'mean' ? meanNode : trueNode;
    const nn = nodeFn(time);
    pts.push({ key: 'nnode', kind: 'point', lon: nn, speed: speedOf(nodeFn, time), pair: 'snode' });
    pts.push({ key: 'snode', kind: 'point', lon: norm(nn + 180), speed: speedOf(nodeFn, time), pair: 'nnode' });
    pts.push({ key: 'chiron', kind: 'point', lon: chironLon(time), speed: speedOf(chironLon, time), approx: true });
    pts.push({ key: 'lilith', kind: 'point', lon: meanLilith(time), speed: speedOf(meanLilith, time) });
    pts.push({ key: 'asc', kind: 'angle', lon: asc, pair: 'dsc' });
    pts.push({ key: 'dsc', kind: 'angle', lon: norm(asc + 180), pair: 'asc' });
    pts.push({ key: 'mc', kind: 'angle', lon: mc, pair: 'ic' });
    pts.push({ key: 'ic', kind: 'angle', lon: norm(mc + 180), pair: 'mc' });
    pts.push({ key: 'vertex', kind: 'point', lon: vertex });

    // Part of Fortune: day chart if the Sun is above the horizon (houses 7–12).
    const sun = pts.find(p => p.key === 'sun').lon;
    const moon = pts.find(p => p.key === 'moon').lon;
    const sunHouse = houseOf(sun, placidus(ramc, eps, input.lat) || houses.cusps);
    const isDay = sunHouse >= 7;
    pts.push({ key: 'fortune', kind: 'point', lon: norm(isDay ? asc + moon - sun : asc + sun - moon) });

    for (const p of pts) {
      p.house = houseOf(p.lon, houses.cusps);
      p.retrograde = p.speed != null && p.speed < 0 && p.kind === 'planet' || (p.key === 'nnode' || p.key === 'snode' || p.key === 'chiron') && p.speed < 0;
    }
    return { input, time, eps, ramc, houses, points: pts, isDay };
  }

  // Positions of the slow and personal planets at an arbitrary moment (for transits).
  function positionsAt(date) {
    const time = A.MakeTime(date);
    return Object.keys(PLANET_BODIES).map(key => {
      const fn = t => bodyLon(key, t);
      return { key, kind: 'planet', lon: fn(time), speed: speedOf(fn, time) };
    });
  }

  // ---------- timing ----------

  // Find moments when fn(t) (a signed angle, degrees) crosses zero between t0 and t1.
  function zeroCrossings(fn, startMs, endMs, stepDays) {
    const hits = [];
    const step = stepDays * 86400e3;
    let prevT = startMs, prevV = fn(prevT);
    for (let t = startMs + step; t <= endMs; t += step) {
      const v = fn(t);
      // ignore the jump at ±180 by requiring both samples to be close to zero
      if (Math.sign(v) !== Math.sign(prevV) && Math.abs(v) < 20 && Math.abs(prevV) < 20) {
        let lo = prevT, hi = t, vlo = prevV;
        for (let k = 0; k < 30; k++) {
          const mid = (lo + hi) / 2, vm = fn(mid);
          if (Math.sign(vm) === Math.sign(vlo)) { lo = mid; vlo = vm; } else hi = mid;
        }
        hits.push(new Date((lo + hi) / 2));
      }
      prevT = t; prevV = v;
    }
    return hits;
  }

  const lonAtMs = (key, ms) => bodyLon(key, A.MakeTime(new Date(ms)));

  /** Exact transits from slow planets to natal points between two dates. */
  function transitsBetween(natalPoints, from, to, opts = {}) {
    const movers = opts.movers || ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const majors = ASPECTS.filter(a => a.major);
    const out = [];
    // Sample each mover once per day, reuse the samples for every natal point.
    const step = 86400e3;
    const start = from.getTime(), end = to.getTime();
    for (const m of movers) {
      const samples = [];
      for (let t = start; t <= end + step; t += step) samples.push([t, lonAtMs(m, t)]);
      for (const n of natalPoints) {
        for (const asp of majors) {
          const targets = asp.angle === 0 || asp.angle === 180 ? [asp.angle] : [asp.angle, -asp.angle];
          for (const off of targets) {
            const target = norm(n.lon + off);
            for (let i = 1; i < samples.length; i++) {
              const a = angDiff(samples[i - 1][1], target), b = angDiff(samples[i][1], target);
              if (Math.sign(a) !== Math.sign(b) && Math.abs(a) < 5 && Math.abs(b) < 5) {
                const frac = a / (a - b);
                const when = new Date(samples[i - 1][0] + frac * step);
                const speed = angDiff(samples[i][1], samples[i - 1][1]);
                out.push({ mover: m, natal: n.key, aspect: asp, date: when, retrograde: speed < 0 });
              }
            }
          }
        }
      }
    }
    return out.sort((x, y) => x.date - y.date);
  }

  /** Transiting planets currently within orb of natal points. */
  function activeTransits(natalPoints, date, orb = 1.5) {
    const now = positionsAt(date);
    const out = [];
    for (const m of now) {
      if (m.key === 'moon') continue;
      for (const n of natalPoints) {
        for (const asp of ASPECTS.filter(a => a.major)) {
          const sep = Math.abs(angDiff(m.lon, n.lon));
          const off = Math.abs(sep - asp.angle);
          const limit = ['sun', 'mercury', 'venus', 'mars'].includes(m.key) ? orb * 0.7 : orb;
          if (off <= limit) {
            const later = Math.abs(Math.abs(angDiff(m.lon + m.speed, n.lon)) - asp.angle);
            out.push({ mover: m.key, natal: n.key, aspect: asp, orb: off, applying: later < off, retrograde: m.speed < 0 });
          }
        }
      }
    }
    return out.sort((a, b) => a.orb - b.orb);
  }

  /** Major life cycles measured from birth: returns, oppositions and squares. */
  function lifeCycles(chart, years = 90) {
    const birth = chart.time.date.getTime();
    const end = birth + years * 365.25 * 86400e3;
    const natal = k => chart.points.find(p => p.key === k).lon;
    const defs = [
      { key: 'jupiter', angle: 0, name: 'Jupiter return', note: 'A new twelve-year cycle of growth and opportunity.' },
      { key: 'saturn', angle: 90, name: 'Saturn square', note: 'A test of the structures you have been building.', waxingOnly: false },
      { key: 'saturn', angle: 180, name: 'Saturn opposition', note: 'Mid-cycle review of commitments and ambitions.' },
      { key: 'saturn', angle: 0, name: 'Saturn return', note: 'Adulthood recalibrated. What is truly yours becomes clear.' },
      { key: 'uranus', angle: 90, name: 'Uranus square', note: 'A push for independence and self-definition.' },
      { key: 'uranus', angle: 180, name: 'Uranus opposition', note: 'The midlife awakening: change what feels false.' },
      { key: 'neptune', angle: 90, name: 'Neptune square', note: 'Old certainties dissolve; ideals are re-examined.' },
      { key: 'pluto', angle: 90, name: 'Pluto square', note: 'A deep reckoning with power and control.' }
    ];
    const out = [];
    for (const d of defs) {
      const base = natal(d.key);
      const targets = d.angle === 0 || d.angle === 180 ? [d.angle] : [d.angle, -d.angle];
      for (const off of targets) {
        const target = norm(base + off);
        const skip = d.angle === 0 ? 400 * 86400e3 : 0; // skip the planet sitting on itself at birth
        const hits = zeroCrossings(t => angDiff(lonAtMs(d.key, t), target), birth + skip, end, d.key === 'jupiter' ? 10 : 20);
        // Group retrograde passes that fall within 18 months of each other.
        let group = [];
        const flush = () => {
          if (!group.length) return;
          out.push({ ...d, angleSigned: off, dates: group.slice(), age: (group[0] - birth) / (365.25 * 86400e3) });
          group = [];
        };
        for (const h of hits) {
          if (group.length && h - group[group.length - 1] > 540 * 86400e3) flush();
          group.push(h);
        }
        flush();
      }
    }
    return out.sort((a, b) => a.dates[0] - b.dates[0]);
  }

  root.ChartEngine = {
    SIGNS, ASPECTS, norm, angDiff, signOf, fmtDeg, computeChart, positionsAt,
    findAspects, findPatterns, houseOf, transitsBetween, activeTransits, lifeCycles,
    _internal: { placidus, ascFrom, mcFrom, meanNode, trueNode, meanLilith, chironLon, makeTime }
  };
})(typeof window !== 'undefined' ? window : globalThis);
