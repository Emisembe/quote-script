/* Natal Chart Studio: UI layer. Depends on ChartEngine, ChartContent, ChartCities. */
(function () {
  'use strict';

  const E = window.ChartEngine;
  const C = window.ChartContent;
  const CITY = window.ChartCities;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const VS = '︎'; // force text (not emoji) presentation

  // Shown on first visit so the page opens in a working state. Clearly labelled as an example.
  const EXAMPLE_INPUT = {
    name: 'Example chart', date: '2000-01-01', time: '12:00', timeUnknown: false,
    place: 'London, United Kingdom', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', utcOffset: 0, example: true
  };
  const EMPTY_INPUT = { name: '', date: '', time: '', timeUnknown: false, place: '', lat: '', lon: '', tz: '', utcOffset: 0 };

  const ST = window.ChartSignText, HT = window.ChartHouseText, AT = window.ChartAspectText, L = window.ChartLearn;
  const signReading = (key, lon) => ST[key] ? ST[key][E.signOf(lon).index] : null;
  const houseReading = (key, h) => (HT[key] && h) ? HT[key][h - 1] : null;

  const DEFAULT_PREFS = {
    houseSystem: 'placidus', nodeType: 'true', lines: true, minor: false, orbScale: 1,
    glyphs: 'symbols', show: { nodes: true, chiron: true, lilith: true, vertex: true, fortune: false }
  };

  const store = {
    get(k, fallback) { try { const v = localStorage.getItem('ncs:' + k); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } },
    set(k, v) { try { localStorage.setItem('ncs:' + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
  };

  const state = {
    input: store.get('input', EXAMPLE_INPUT),
    prefs: Object.assign({}, DEFAULT_PREFS, store.get('prefs', {})),
    tab: 'chart',
    chart: null,
    aspects: [],
    active: null,   // { kind, key } currently shown in the detail panel
    pinned: false,
    timingCache: null
  };
  state.prefs.show = Object.assign({}, DEFAULT_PREFS.show, state.prefs.show || {});

  // ---------- helpers ----------
  const P = key => C.POINTS[key] || { name: key, glyph: key, letters: key };
  const GLYPHABLE = new Set(['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'nnode', 'snode', 'chiron', 'lilith', 'fortune']);
  const glyphOf = key => (state.prefs.glyphs === 'letters' || !GLYPHABLE.has(key)) ? P(key).letters : P(key).glyph + VS;
  const signGlyph = s => s.glyph + VS;
  const pt = key => state.chart.points.find(p => p.key === key);
  const posText = lon => E.fmtDeg(lon);
  const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th');
  const fmtDate = d => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  const houseCount = () => !state.chart.noHouses;

  const DOMICILE = { sun: ['leo'], moon: ['can'], mercury: ['gem', 'vir'], venus: ['tau', 'lib'], mars: ['ari', 'sco'], jupiter: ['sag', 'pis'], saturn: ['cap', 'aqu'], uranus: ['aqu'], neptune: ['pis'], pluto: ['sco'] };
  const EXALT = { sun: 'ari', moon: 'tau', mercury: 'vir', venus: 'pis', mars: 'cap', jupiter: 'can', saturn: 'lib' };
  const OPP = k => E.SIGNS[(E.SIGNS.findIndex(s => s.key === k) + 6) % 12].key;
  function dignity(key, signKey) {
    if (DOMICILE[key]?.includes(signKey)) return 'Domicile';
    if (EXALT[key] === signKey) return 'Exaltation';
    if (DOMICILE[key]?.some(s => OPP(s) === signKey)) return 'Detriment';
    if (EXALT[key] && OPP(EXALT[key]) === signKey) return 'Fall';
    return null;
  }

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, 2600);
  }

  // ---------- compute ----------
  function visibleKeys() {
    const s = state.prefs.show;
    const keys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    if (s.nodes) keys.push('nnode', 'snode');
    if (s.chiron) keys.push('chiron');
    if (s.lilith) keys.push('lilith');
    if (!state.chart.noHouses) {
      keys.push('asc', 'dsc', 'mc', 'ic');
      if (s.vertex) keys.push('vertex');
      if (s.fortune) keys.push('fortune');
    }
    return keys;
  }

  function compute() {
    const i = state.input;
    const chart = E.computeChart({
      date: i.date, time: i.timeUnknown ? '12:00' : i.time, utcOffset: i.utcOffset,
      lat: i.lat, lon: i.lon, houseSystem: state.prefs.houseSystem, nodeType: state.prefs.nodeType
    });
    chart.noHouses = !!i.timeUnknown;
    if (chart.noHouses) chart.points.forEach(p => { p.house = null; });
    state.chart = chart;
    const keys = visibleKeys();
    const aspectable = chart.points.filter(p => keys.includes(p.key) && !['dsc', 'ic', 'vertex', 'fortune'].includes(p.key));
    state.aspects = E.findAspects(aspectable, { includeMinor: state.prefs.minor, orbScale: state.prefs.orbScale });
    state.timingCache = null;
  }

  // ---------- header ----------
  function renderHeader() {
    const i = state.input;
    $('#chart-name').textContent = i.name || 'Unnamed chart';
    const off = i.utcOffset;
    const offTxt = 'UTC' + (off >= 0 ? '+' : '−') + Math.abs(off).toString().replace('.5', ':30').replace('.75', ':45').replace('.25', ':15');
    const d = new Date(i.date + 'T12:00:00Z');
    const dateTxt = d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const sysName = { placidus: 'Placidus', whole: 'Whole sign', equal: 'Equal', porphyry: 'Porphyry' }[state.chart.houses.system];
    $('#birthline').innerHTML = [
      `<span>${esc(dateTxt)}</span>`,
      `<span>${i.timeUnknown ? 'Time unknown (noon chart)' : esc(i.time) + ' ' + offTxt}</span>`,
      `<span>${esc(i.place || `${i.lat.toFixed(2)}°, ${i.lon.toFixed(2)}°`)}</span>`,
      i.timeUnknown ? '' : `<span>${sysName} houses</span>`
    ].join('');
    document.title = (i.name ? i.name + ' · ' : '') + 'Natal Chart Studio';
    $('#example-banner').hidden = !i.example;
  }

  // ---------- wheel ----------
  const CX = 410;
  const R = { out: 400, signIn: 342, tickIn: 332, planet: 300, degree: 268, houseOut: 244, houseIn: 212, field: 212 };
  const D2R = Math.PI / 180;

  function rotation() { return state.chart.noHouses ? 0 : pt('asc').lon; }
  function xy(lon, r) {
    const th = (180 + (lon - rotation())) * D2R;
    return [CX + r * Math.cos(th), CX - r * Math.sin(th)];
  }
  const f = n => n.toFixed(2);

  function sector(a, b, r1, r2) {
    const [x1, y1] = xy(a, r2), [x2, y2] = xy(b, r2), [x3, y3] = xy(b, r1), [x4, y4] = xy(a, r1);
    const large = E.norm(b - a) > 180 ? 1 : 0;
    return `M${f(x1)} ${f(y1)} A${r2} ${r2} 0 ${large} 0 ${f(x2)} ${f(y2)} L${f(x3)} ${f(y3)} A${r1} ${r1} 0 ${large} 1 ${f(x4)} ${f(y4)} Z`;
  }

  // Push glyphs apart so they never overlap; returns display longitude per key.
  function spread(items, minGap) {
    const n = items.length;
    if (n < 2) return Object.fromEntries(items.map(p => [p.key, p.lon]));
    minGap = Math.min(minGap, 360 / n);
    const sorted = items.slice().sort((a, b) => a.lon - b.lon);
    const pos = sorted.map(p => p.lon);
    for (let iter = 0; iter < 200; iter++) {
      let moved = false;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const gap = E.norm(pos[j] - pos[i]);
        if (gap < minGap - 0.01) {
          const push = (minGap - gap) / 2;
          pos[i] = E.norm(pos[i] - push); pos[j] = E.norm(pos[j] + push);
          moved = true;
        }
      }
      if (!moved) break;
    }
    return Object.fromEntries(sorted.map((p, i) => [p.key, pos[i]]));
  }

  function aspectTone(asp) { return asp.major ? asp.tone : 'adjust'; }

  // The wheel is drawn in an 820-unit viewBox. On small screens those units shrink,
  // so text and symbols are sized from the rendered width to stay readable and tappable.
  function wheelMetrics() {
    const w = $('#wheel').getBoundingClientRect().width || 760;
    const k = 820 / w; // viewBox units per screen pixel
    const compact = w < 560;
    return {
      w, k, compact,
      glyph: Math.max(19, Math.min(44, 16 * k)),
      letters: Math.max(12, Math.min(30, 11 * k)),
      radius: Math.max(16, Math.min(30, 12 * k)),
      sign: Math.max(18, Math.min(34, 12 * k)),
      house: Math.max(12, Math.min(28, 10 * k))
    };
  }

  function renderWheel() {
    const chart = state.chart;
    const keys = visibleKeys();
    const shown = chart.points.filter(p => keys.includes(p.key));
    const out = [];
    const M = wheelMetrics();
    state.wheelWidth = M.w;

    out.push(`<circle class="ring-outer" cx="${CX}" cy="${CX}" r="${R.out}"/>`);
    // zodiac ring
    E.SIGNS.forEach((s, i) => {
      const a = i * 30;
      out.push(`<path class="sign-seg ${s.element}" data-kind="sign" data-key="${s.key}" d="${sector(a, a + 30, R.signIn, R.out)}"><title>${s.name}</title></path>`);
      // glyph stacked above the name so the pair never collides, whatever the angle
      const [nx, ny] = xy(a + 15, (R.signIn + R.out) / 2);
      if (M.compact) {
        // one label only on phones: the name, large enough to read
        out.push(`<text class="sign-name" x="${f(nx)}" y="${f(ny)}" text-anchor="middle" dominant-baseline="central" style="font-size:${f(M.sign)}px">${s.short}</text>`);
      } else {
        out.push(`<text class="sign-glyph" x="${f(nx)}" y="${f(ny - 11)}" text-anchor="middle" dominant-baseline="central">${signGlyph(s)}</text>`);
        out.push(`<text class="sign-name" x="${f(nx)}" y="${f(ny + 9)}" text-anchor="middle" dominant-baseline="central">${s.short}</text>`);
      }
    });
    // degree ticks
    for (let d = 0; d < 360; d++) {
      const len = d % 10 === 0 ? 12 : d % 5 === 0 ? 8 : 4;
      const [x1, y1] = xy(d, R.signIn), [x2, y2] = xy(d, R.signIn - len);
      out.push(`<line class="tick${d % 10 === 0 ? ' major' : ''}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`);
    }
    out.push(`<circle class="body-disc" cx="${CX}" cy="${CX}" r="${R.signIn - 12}"/>`);

    // houses
    if (!chart.noHouses) {
      const cusps = chart.houses.cusps;
      out.push(`<circle class="house-band" cx="${CX}" cy="${CX}" r="${R.houseOut}"/>`);
      cusps.forEach((c, i) => {
        const next = cusps[(i + 1) % 12];
        out.push(`<path class="house-hit" data-kind="house" data-key="${i + 1}" d="${sector(c, next, R.houseIn, R.houseOut)}"><title>House ${i + 1}</title></path>`);
        const mid = c + E.norm(next - c) / 2;
        const [hx, hy] = xy(mid, (R.houseIn + R.houseOut) / 2);
        out.push(`<text class="house-num" x="${f(hx)}" y="${f(hy)}" text-anchor="middle" dominant-baseline="central" style="font-size:${f(M.house)}px">${i + 1}</text>`);
        const isAngle = i % 3 === 0;
        const [x1, y1] = xy(c, R.houseIn), [x2, y2] = xy(c, R.signIn - 12);
        out.push(`<line class="cusp${isAngle ? ' angle' : ''}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`);
      });
    }
    out.push(`<circle class="aspect-field" cx="${CX}" cy="${CX}" r="${chart.noHouses ? R.houseOut : R.field}"/>`);

    // aspect lines
    const fieldR = chart.noHouses ? R.houseOut : R.field;
    if (state.prefs.lines) {
      state.aspects.forEach((a, idx) => {
        const [x1, y1] = xy(pt(a.a).lon, fieldR - 2), [x2, y2] = xy(pt(a.b).lon, fieldR - 2);
        const cls = `asp ${aspectTone(a.aspect)}${a.aspect.major ? '' : ' minor'}`;
        out.push(`<g data-kind="aspect" data-key="${idx}" data-a="${a.a}" data-b="${a.b}"><line class="${cls}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/><line class="asp-hit" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/></g>`);
      });
    }
    out.push(`<circle class="center-dot" cx="${CX}" cy="${CX}" r="4"/>`);

    // points
    // minimum angular gap so neighbouring symbols never overlap at this size
    const display = spread(shown, Math.max(6.6, (2 * M.radius + 4) / R.planet * 180 / Math.PI));
    const order = shown.slice().sort((a, b) => a.lon - b.lon);
    order.forEach(p => {
      const dl = display[p.key];
      const [mx1, my1] = xy(p.lon, R.signIn - 12), [mx2, my2] = xy(p.lon, R.signIn - 22);
      out.push(`<line class="marker" x1="${f(mx1)}" y1="${f(my1)}" x2="${f(mx2)}" y2="${f(my2)}"/>`);
      const [gx, gy] = xy(dl, R.planet);
      if (Math.abs(E.angDiff(dl, p.lon)) > 0.8) {
        const [lx, ly] = xy(p.lon, R.signIn - 22), [lx2, ly2] = xy(dl, R.planet + 17);
        out.push(`<line class="leader" x1="${f(lx)}" y1="${f(ly)}" x2="${f(lx2)}" y2="${f(ly2)}"/>`);
      }
      const [dx, dy] = xy(dl, R.degree);
      const s = E.signOf(p.lon);
      const kindCls = p.kind === 'angle' ? 'angle' : p.kind === 'point' ? 'point' : 'planet';
      const light = p.key === 'sun' || p.key === 'moon' ? ' light' : '';
      const glyphable = GLYPHABLE.has(p.key) && state.prefs.glyphs !== 'letters' ? ' glyphable' : '';
      const letters = state.prefs.glyphs === 'letters' ? ' letters' : '';
      const textSize = glyphable ? M.glyph * (p.kind === 'planet' ? 1 : 0.9) : M.letters;
      const label = `${P(p.key).name}, ${posText(p.lon)}${p.house ? ', house ' + p.house : ''}${p.retrograde ? ', retrograde' : ''}`;
      out.push(`<g class="pt ${kindCls}${light}${glyphable}" data-kind="point" data-key="${p.key}" tabindex="0" role="button" aria-label="${esc(label)}">` +
        `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(M.radius)}"/>` +
        `<text class="g${letters}" x="${f(gx)}" y="${f(gy)}" style="font-size:${f(textSize)}px">${esc(glyphOf(p.key))}</text>` +
        (M.compact ? '' : `<text class="deg" x="${f(dx)}" y="${f(dy)}">${Math.floor(s.deg)}°</text>`) +
        ((p.retrograde && (p.kind !== 'point' || p.key === 'chiron')) ? `<text class="rx" x="${f(gx + M.radius * 0.8)}" y="${f(gy - M.radius * 0.8)}" style="font-size:${f(Math.max(10, M.letters * 0.8))}px">R</text>` : '') +
        `</g>`);
    });

    const svg = $('#wheel');
    svg.innerHTML = out.join('');
    svg.setAttribute('aria-label', `Birth chart wheel for ${state.input.name || 'this chart'}. ${shown.length} points.`);
    applyHighlight();
  }

  // Highlight the active item and everything connected to it.
  function applyHighlight() {
    const svg = $('#wheel');
    svg.querySelectorAll('.is-active, .is-related').forEach(el => el.classList.remove('is-active', 'is-related'));
    svg.classList.remove('focusing');
    const a = state.active;
    if (!a) return;
    if (a.kind === 'point') {
      const g = svg.querySelector(`.pt[data-key="${a.key}"]`);
      if (!g) return;
      g.classList.add('is-active');
      svg.classList.add('focusing');
      svg.querySelectorAll(`g[data-kind="aspect"]`).forEach(line => {
        if (line.dataset.a === a.key || line.dataset.b === a.key) {
          line.querySelector('.asp').classList.add('is-related');
          const other = line.dataset.a === a.key ? line.dataset.b : line.dataset.a;
          svg.querySelector(`.pt[data-key="${other}"]`)?.classList.add('is-related');
        }
      });
    } else if (a.kind === 'aspect') {
      const line = svg.querySelector(`g[data-kind="aspect"][data-key="${a.key}"]`);
      if (!line) return;
      svg.classList.add('focusing');
      line.querySelector('.asp').classList.add('is-related');
      svg.querySelector(`.pt[data-key="${line.dataset.a}"]`)?.classList.add('is-related');
      svg.querySelector(`.pt[data-key="${line.dataset.b}"]`)?.classList.add('is-related');
    } else if (a.kind === 'house') {
      svg.querySelector(`.house-hit[data-key="${a.key}"]`)?.classList.add('is-active');
      svg.classList.add('focusing');
      state.chart.points.filter(p => p.house === +a.key).forEach(p => svg.querySelector(`.pt[data-key="${p.key}"]`)?.classList.add('is-related'));
    } else if (a.kind === 'sign') {
      svg.querySelector(`.sign-seg[data-key="${a.key}"]`)?.classList.add('is-active');
      svg.classList.add('focusing');
      state.chart.points.filter(p => E.signOf(p.lon).sign.key === a.key).forEach(p => svg.querySelector(`.pt[data-key="${p.key}"]`)?.classList.add('is-related'));
    }
  }

  // ---------- detail panel ----------
  function aspectsOf(key) {
    return state.aspects.map((a, idx) => ({ ...a, idx })).filter(a => a.a === key || a.b === key);
  }

  function rulerOfSign(signKey) { return E.SIGNS.find(s => s.key === signKey).ruler; }

  // Returns paragraphs: meaning of the point, the sign reading, the house reading, retrograde note.
  function pointParagraphs(p) {
    const s = E.signOf(p.lon).sign;
    const out = [P(p.key).core];
    out.push(signReading(p.key, p.lon) || C.SIGN_STYLE[s.key]);
    if (p.house && !['asc', 'dsc', 'mc', 'ic'].includes(p.key)) {
      out.push(houseReading(p.key, p.house) || `In house ${p.house} it points toward ${C.HOUSES[p.house - 1].area}.`);
    }
    if (p.retrograde && L.RETRO[p.key]) out.push(L.RETRO[p.key]);
    return out;
  }
  const pointNarrative = p => pointParagraphs(p).join(' ');

  function detailPoint(key) {
    const p = pt(key);
    const info = P(key);
    const s = E.signOf(p.lon);
    const dig = p.kind === 'planet' ? dignity(key, s.sign.key) : null;
    const ruled = !state.chart.noHouses && p.kind === 'planet'
      ? state.chart.houses.cusps.map((c, i) => ({ h: i + 1, sign: E.signOf(c).sign })).filter(x => x.sign.ruler === key).map(x => x.h)
      : [];
    const conns = aspectsOf(key);
    const glyphText = GLYPHABLE.has(key) && state.prefs.glyphs !== 'letters';
    const speed = p.speed != null ? `${Math.abs(p.speed) < 0.1 ? (p.speed * 60).toFixed(1) + '′' : p.speed.toFixed(2) + '°'} per day` : null;
    const chips = [
      `<span class="chip"><span class="glyph">${signGlyph(s.sign)}</span>${posText(p.lon)}</span>`,
      p.house ? `<span class="chip">House ${p.house}</span>` : '',
      p.retrograde ? '<span class="chip rx">Retrograde</span>' : '',
      dig ? `<span class="chip ${dig === 'Domicile' || dig === 'Exaltation' ? 'good' : 'rx'}">${dig}</span>` : '',
      p.approx ? '<span class="chip">± 0.5°</span>' : ''
    ].join('');
    let extra = '';
    if (ruled.length) extra += `<p>Rules your ${ruled.map(h => ordinal(h)).join(' and ')} house${ruled.length > 1 ? 's' : ''}, so its condition colours ${ruled.map(h => C.HOUSES[h - 1].title.toLowerCase()).join(' and ')} too.</p>`;
    if (dig) extra += `<p class="faint">${{ Domicile: 'At home in this sign: it acts freely and in character.', Exaltation: 'Exalted here: it tends to show its best face.', Detriment: 'In detriment: it has to work outside its comfort zone, which can build unusual skill.', Fall: 'In fall: its expression is muted or self-conscious until it is consciously developed.' }[dig]}</p>`;
    return `
      <div class="detail-head">
        <div class="badge-glyph${glyphText ? '' : ' text'}">${esc(glyphOf(key))}</div>
        <div>
          <div class="eyebrow">${esc(info.group || '')}</div>
          <h3>${esc(info.name)} in ${s.sign.name}</h3>
        </div>
      </div>
      <div class="chips">${chips}</div>
      ${pointParagraphs(p).map(t => `<p>${esc(t)}</p>`).join('')}
      ${extra}
      ${speed && p.kind !== 'angle' ? `<p class="faint">Moving ${p.speed < 0 ? 'backward' : 'forward'} at ${speed}.</p>` : ''}
      ${conns.length ? `<div class="eyebrow">Connections · ${conns.length}</div><ul class="conn-list">${conns.map(a => {
        const other = a.a === key ? a.b : a.a;
        return `<li><button type="button" data-goto-aspect="${a.idx}"><span class="asp-g ${aspectTone(a.aspect)}">${a.aspect.glyph}${VS}</span><span>${esc(C.ASPECT_TEXT[a.aspect.key])} <b>${esc(P(other).name)}</b></span><span class="num">${a.orb.toFixed(1)}°${a.applying == null ? '' : a.applying ? ' ap' : ' sep'}</span></button></li>`;
      }).join('')}</ul>` : '<p class="faint">No major aspects within orb. This part of you works more independently.</p>'}
    `;
  }

  function detailAspect(idx) {
    const a = state.aspects[idx];
    if (!a) return detailEmpty();
    const pa = pt(a.a), pb = pt(a.b);
    return `
      <div class="detail-head">
        <div class="badge-glyph"><span class="asp-g ${aspectTone(a.aspect)}">${a.aspect.glyph}${VS}</span></div>
        <div><div class="eyebrow">Aspect · ${a.aspect.angle}°</div><h3>${esc(P(a.a).name)} ${a.aspect.name.toLowerCase()} ${esc(P(a.b).name)}</h3></div>
      </div>
      <div class="chips">
        <span class="chip">Orb ${a.orb.toFixed(2)}°</span>
        ${a.applying == null ? '' : `<span class="chip">${a.applying ? 'Applying' : 'Separating'}</span>`}
        <span class="chip">${a.aspect.major ? 'Major' : 'Minor'}</span>
      </div>
      <p>${esc(P(a.a).name)} ${esc(C.ASPECT_TEXT[a.aspect.key])} ${esc(P(a.b).name)}. ${esc(C.ASPECT_MEANING[a.aspect.key])}</p>
      <p>${esc(AT.readAspect(a.a, a.b, a.aspect.key, a.aspect.major ? a.aspect.tone : 'adjust', [P(a.a).name, P(a.b).name]))}</p>
      <p class="faint">${esc(P(a.a).name)}: ${esc(P(a.a).keywords?.join(', ') || '')}. ${esc(P(a.b).name)}: ${esc(P(a.b).keywords?.join(', ') || '')}.</p>
      <div class="chips">
        <button class="chip" type="button" data-goto-point="${a.a}">${esc(P(a.a).name)} · ${posText(pa.lon)}</button>
        <button class="chip" type="button" data-goto-point="${a.b}">${esc(P(a.b).name)} · ${posText(pb.lon)}</button>
      </div>`;
  }

  function detailHouse(n) {
    const cusps = state.chart.houses.cusps;
    const cusp = cusps[n - 1];
    const s = E.signOf(cusp).sign;
    const ruler = pt(s.ruler);
    const occupants = state.chart.points.filter(p => p.house === n && p.kind !== 'angle' && visibleKeys().includes(p.key));
    const size = E.norm(cusps[n % 12] - cusp);
    return `
      <div class="detail-head">
        <div class="badge-glyph text">${n}</div>
        <div><div class="eyebrow">Astrological house</div><h3>House ${n} · ${C.HOUSES[n - 1].title}</h3></div>
      </div>
      <div class="chips">
        <span class="chip">Cusp ${posText(cusp)}</span>
        <span class="chip">${size.toFixed(1)}° wide</span>
      </div>
      <p>This house covers ${C.HOUSES[n - 1].area}. Planets here show which parts of you are most active in this area.</p>
      <p>${s.name} on the cusp brings its style: ${esc(C.SIGN_STYLE[s.key].replace(/^In \w+ it /, 'it '))} Its ruler, ${P(s.ruler).name}, sits in ${E.signOf(ruler.lon).sign.name}${ruler.house ? ', house ' + ruler.house : ''}.</p>
      ${occupants.length ? `<div class="eyebrow">In this house</div><div class="chips">${occupants.map(p => `<button class="chip" type="button" data-goto-point="${p.key}"><span class="glyph">${esc(glyphOf(p.key))}</span>${esc(P(p.key).name)}</button>`).join('')}</div>` : `<p class="faint">No planets here. Read this house through its ruler.</p>`}
      <div><button class="chip" type="button" data-goto-point="${s.ruler}">Go to ${P(s.ruler).name}</button></div>`;
  }

  function detailSign(key) {
    const idx = E.SIGNS.findIndex(s => s.key === key);
    const s = E.SIGNS[idx];
    const inSign = state.chart.points.filter(p => E.signOf(p.lon).sign.key === key && visibleKeys().includes(p.key));
    return `
      <div class="detail-head">
        <div class="badge-glyph">${signGlyph(s)}</div>
        <div><div class="eyebrow">Zodiac sign</div><h3>${s.name}</h3></div>
      </div>
      <div class="chips">
        <span class="chip">${idx * 30}°–${idx * 30 + 30}°</span>
        <span class="chip">${C.ELEMENTS[s.element].name}</span>
        <span class="chip">${C.MODES[s.mode].name}</span>
        <button class="chip" type="button" data-goto-point="${s.ruler}">Ruled by ${P(s.ruler).name}</button>
      </div>
      <p>${esc(C.SIGN_TEXT[key])}</p>
      ${inSign.length ? `<div class="eyebrow">Your placements in ${s.name}</div><div class="chips">${inSign.map(p => `<button class="chip" type="button" data-goto-point="${p.key}"><span class="glyph">${esc(glyphOf(p.key))}</span>${esc(P(p.key).name)} ${E.fmtDeg(p.lon, false)}</button>`).join('')}</div>` : '<p class="faint">No placements in this sign.</p>'}`;
  }

  function detailEmpty() {
    const sun = pt('sun'), moon = pt('moon');
    const asc = state.chart.noHouses ? null : pt('asc');
    return `
      <div class="eyebrow">Start here</div>
      <h3>Your Big Three</h3>
      <div class="chips">
        <button class="chip" type="button" data-goto-point="sun"><span class="glyph">☉${VS}</span>Sun in ${E.signOf(sun.lon).sign.name}</button>
        <button class="chip" type="button" data-goto-point="moon"><span class="glyph">☽${VS}</span>Moon in ${E.signOf(moon.lon).sign.name}</button>
        ${asc ? `<button class="chip" type="button" data-goto-point="asc">Rising ${E.signOf(asc.lon).sign.name}</button>` : ''}
      </div>
      <p>Hover over any symbol, sign or house number on the wheel to read about it. Click or tap to keep it open while you look around.</p>
      <p class="faint">Lines through the centre are aspects. Hover a planet to isolate its connections.</p>`;
  }

  function renderDetail() {
    const a = state.active;
    let html;
    if (!a) html = detailEmpty();
    else if (a.kind === 'point') html = detailPoint(a.key);
    else if (a.kind === 'aspect') html = detailAspect(+a.key);
    else if (a.kind === 'house') html = detailHouse(+a.key);
    else if (a.kind === 'sign') html = detailSign(a.key);
    const touch = !window.matchMedia('(hover: hover)').matches;
    const foot = a ? `<div class="detail-foot"><span>${state.pinned ? (touch ? 'Tap another symbol to switch.' : 'Pinned. Press Esc to release.') : 'Click to keep this open.'}</span>${state.pinned ? '<button class="btn small" type="button" id="unpin">Close</button>' : ''}</div>` : '';
    // On narrow screens a pinned detail slides up as a bottom sheet so it is visible next to the wheel.
    // It is a separate element, so the page layout underneath never moves.
    const useSheet = !!(a && state.pinned && window.matchMedia('(max-width: 900px)').matches);
    const sheet = $('#sheet');
    if (useSheet) {
      sheet.innerHTML = html + foot;
      sheet.hidden = false;
      sheet.scrollTop = 0;
      $('#detail').innerHTML = detailEmpty();
    } else {
      sheet.hidden = true;
      $('#detail').innerHTML = html + foot;
    }
  }

  function setActive(item, pin) {
    if (pin === undefined) pin = state.pinned;
    state.active = item;
    state.pinned = !!(item && pin);
    renderDetail();
    applyHighlight();
  }

  // ---------- wheel interaction ----------
  function itemFromEvent(e) {
    const el = e.target.closest('[data-kind]');
    if (!el || !$('#wheel').contains(el)) return null;
    return { kind: el.dataset.kind, key: el.dataset.key };
  }

  function bindWheel() {
    const svg = $('#wheel');
    const canHover = window.matchMedia('(hover: hover)').matches;
    svg.addEventListener('pointerover', e => {
      if (!canHover || state.pinned) return;
      const it = itemFromEvent(e);
      if (it) setActive(it, false);
    });
    svg.addEventListener('pointerleave', () => {
      if (!state.pinned) setActive(null, false);
    });
    svg.addEventListener('click', e => {
      const it = itemFromEvent(e);
      if (!it) { setActive(null, false); return; }
      const same = state.pinned && state.active && state.active.kind === it.kind && state.active.key === it.key;
      setActive(same ? null : it, !same);
    });
    svg.addEventListener('focusin', e => {
      const it = itemFromEvent(e);
      if (it) setActive(it, state.pinned);
    });
    svg.addEventListener('keydown', e => {
      const g = e.target.closest('.pt');
      if (!g) return;
      const pts = [...svg.querySelectorAll('.pt')];
      const i = pts.indexOf(g);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); pts[(i + 1) % pts.length].focus(); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); pts[(i - 1 + pts.length) % pts.length].focus(); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActive({ kind: 'point', key: g.dataset.key }, true); }
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && state.pinned && !$('#birth-dialog').open) setActive(null, false);
    });
    const detailClick = e => {
      if (e.target.closest('#unpin')) { setActive(null, false); return; }
      const gp = e.target.closest('[data-goto-point]');
      if (gp) { setActive({ kind: 'point', key: gp.dataset.gotoPoint }, true); return; }
      const ga = e.target.closest('[data-goto-aspect]');
      if (ga) setActive({ kind: 'aspect', key: ga.dataset.gotoAspect }, true);
    };
    $('#detail').addEventListener('click', detailClick);
    $('#sheet').addEventListener('click', detailClick);
  }

  // ---------- Chart data tab ----------
  function renderData() {
    const ch = state.chart;
    const keys = visibleKeys();
    const rows = ch.points.filter(p => keys.includes(p.key)).map(p => {
      const s = E.signOf(p.lon);
      return `<tr data-goto="${p.key}">
        <td><span class="glyph">${esc(glyphOf(p.key))}</span>${esc(P(p.key).name)}</td>
        <td class="num">${E.fmtDeg(p.lon, false)}</td>
        <td><span class="glyph">${signGlyph(s.sign)}</span>${s.sign.name}</td>
        <td class="num">${p.house ?? '–'}</td>
        <td class="num wide-only">${p.lon.toFixed(3)}°</td>
        <td>${p.speed == null ? '–' : (p.retrograde ? '<span class="pill bad">R</span> ' : '') + `<span class="num">${p.speed.toFixed(3)}°/d</span>`}</td>
      </tr>`;
    }).join('');

    // aspect grid (lower triangle)
    const gk = keys.filter(k => !['dsc', 'ic', 'vertex', 'fortune'].includes(k));
    const find = (a, b) => state.aspects.findIndex(x => (x.a === a && x.b === b) || (x.a === b && x.b === a));
    let grid = '<table class="asp-grid" aria-label="Aspect grid"><tbody>';
    gk.forEach((row, i) => {
      grid += '<tr>';
      for (let j = 0; j < i; j++) {
        const idx = find(row, gk[j]);
        if (idx < 0) grid += '<td></td>';
        else {
          const a = state.aspects[idx];
          grid += `<td class="hit" data-aspect="${idx}" title="${esc(P(a.a).name + ' ' + a.aspect.name + ' ' + P(a.b).name)}"><span class="asp-g ${aspectTone(a.aspect)}">${a.aspect.glyph}${VS}</span><small>${a.orb.toFixed(0)}°</small></td>`;
        }
      }
      grid += `<th scope="row" title="${esc(P(row).name)}">${esc(glyphOf(row))}</th>`;
      for (let j = i + 1; j < gk.length; j++) grid += '<td class="empty"></td>';
      grid += '</tr>';
    });
    grid += '</tbody></table>';

    const aspRows = state.aspects.map((a, idx) => `<tr data-aspect="${idx}">
      <td><span class="glyph">${esc(glyphOf(a.a))}</span>${esc(P(a.a).name)}</td>
      <td><span class="asp-g ${aspectTone(a.aspect)} glyph">${a.aspect.glyph}${VS}</span> ${a.aspect.name}</td>
      <td><span class="glyph">${esc(glyphOf(a.b))}</span>${esc(P(a.b).name)}</td>
      <td class="num">${a.orb.toFixed(2)}°</td>
      <td>${a.applying == null ? '–' : a.applying ? 'Applying' : 'Separating'}</td></tr>`).join('');

    const patterns = E.findPatterns(ch.points.filter(p => ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'].includes(p.key)), state.aspects);

    const cuspRows = ch.noHouses ? '' : ch.houses.cusps.map((c, i) => `<tr data-house="${i + 1}"><td>House ${i + 1}</td><td class="num">${E.fmtDeg(c, false)}</td><td>${E.signOf(c).sign.name}</td><td class="num">${E.norm(ch.houses.cusps[(i + 1) % 12] - c).toFixed(2)}°</td></tr>`).join('');

    $('#panel-data').innerHTML = `
      <div class="section">
        <div class="section-head"><div><span class="eyebrow">The chart data, made readable</span><h2>Every exact degree behind the wheel</h2></div></div>
        <div class="stat-row">
          <div class="stat"><b>${ch.points.filter(p => keys.includes(p.key)).length}</b><span>Positions</span></div>
          <div class="stat"><b>${state.aspects.length}</b><span>Aspects in orb</span></div>
          <div class="stat"><b>${patterns.length}</b><span>Patterns</span></div>
          <div class="stat"><b>${ch.isDay ? 'Day' : 'Night'}</b><span>Sect (Sun ${ch.isDay ? 'above' : 'below'} horizon)</span></div>
        </div>
      </div>
      <div class="section">
        <h3>Positions</h3>
        <div class="table-wrap"><table><thead><tr><th>Point</th><th>Degree</th><th>Sign</th><th>House</th><th class="wide-only">Longitude</th><th>Daily motion</th></tr></thead><tbody>${rows}</tbody></table></div>
      </div>
      ${ch.noHouses ? '' : `<div class="section"><h3>House cusps</h3><div class="table-wrap"><table><thead><tr><th>House</th><th>Cusp</th><th>Sign</th><th>Width</th></tr></thead><tbody>${cuspRows}</tbody></table></div></div>`}
      <div class="section">
        <h3>Aspect grid</h3>
        <div class="table-wrap" style="padding:12px">${grid}</div>
      </div>
      <div class="section">
        <h3>All aspects, tightest first</h3>
        <div class="table-wrap"><table><thead><tr><th>Point</th><th>Aspect</th><th>Point</th><th>Orb</th><th>Phase</th></tr></thead><tbody>${aspRows || '<tr><td colspan="5">No aspects in orb.</td></tr>'}</tbody></table></div>
      </div>
      <div class="section">
        <h3>Multi-planet patterns</h3>
        ${patterns.length ? `<div class="grid-3">${patterns.map(pp => `<div class="card"><div class="eyebrow">${esc(pp.type)}</div><p style="margin:6px 0">${pp.members.map(m => `<span class="glyph">${esc(glyphOf(m))}</span> ${esc(P(m).name)}`).join(' · ')}</p><p class="faint">${esc(pp.note.replace(/^(\w+) is/, (x, k) => P(k).name + ' is'))}</p><p class="muted">${esc(L.PATTERN_INFO[pp.type] || '')}</p></div>`).join('')}</div>` : '<p class="muted">No grand trines, T-squares, yods or stelliums with the current orbs.</p>'}
      </div>
      <div class="section">
        <h3>Export</h3>
        <div class="actions"><button class="btn small" type="button" id="copy-csv">Copy positions as CSV</button><button class="btn small" type="button" id="copy-json">Copy full chart as JSON</button></div>
      </div>`;
  }

  // ---------- Characteristics ----------
  const WEIGHTS = { sun: 3, moon: 3, asc: 3, mercury: 2, venus: 2, mars: 2, jupiter: 1.5, saturn: 1.5, uranus: 0.5, neptune: 0.5, pluto: 0.5, mc: 1 };
  function balance() {
    const el = { fire: 0, earth: 0, air: 0, water: 0 }, md = { cardinal: 0, fixed: 0, mutable: 0 };
    const members = { fire: [], earth: [], air: [], water: [] };
    Object.entries(WEIGHTS).forEach(([k, w]) => {
      if (state.chart.noHouses && (k === 'asc' || k === 'mc')) return;
      const s = E.signOf(pt(k).lon).sign;
      el[s.element] += w; md[s.mode] += w; members[s.element].push(k);
    });
    const tot = Object.values(el).reduce((a, b) => a + b, 0);
    return { el, md, tot, members };
  }

  function chartShape() {
    const lons = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map(k => pt(k).lon).sort((a, b) => a - b);
    const gaps = lons.map((l, i) => E.norm(lons[(i + 1) % lons.length] - l)).sort((a, b) => b - a);
    const span = 360 - gaps[0];
    if (span <= 125) return 'Bundle';
    if (span <= 185) return 'Bowl';
    // bucket: one planet separated from a group that fits in 180°
    for (let i = 0; i < lons.length; i++) {
      const rest = lons.filter((_, j) => j !== i);
      const g = rest.map((l, k) => E.norm(rest[(k + 1) % rest.length] - l)).sort((a, b) => b - a);
      if (360 - g[0] <= 185) return 'Bucket';
    }
    if (span <= 245) return 'Locomotive';
    if (gaps[0] >= 60 && gaps[1] >= 60) return 'Seesaw';
    if (gaps[0] < 60) return 'Splash';
    return 'Splay';
  }

  function moonPhase() {
    const el = E.norm(pt('moon').lon - pt('sun').lon);
    return { el, phase: C.MOON_PHASES.find(p => el < p.max) };
  }

  function renderTraits() {
    const b = balance();
    const pct = v => Math.round(v / b.tot * 100);
    const elBars = Object.keys(b.el).map(k => `<div class="bar ${k}"><span>${C.ELEMENTS[k].name}</span><div class="track"><div class="fill" style="width:${pct(b.el[k])}%"></div></div><span class="num">${pct(b.el[k])}%</span></div>`).join('');
    const mdBars = Object.keys(b.md).map(k => `<div class="bar"><span>${C.MODES[k].name}</span><div class="track"><div class="fill" style="width:${pct(b.md[k])}%"></div></div><span class="num">${pct(b.md[k])}%</span></div>`).join('');
    const topEl = Object.keys(b.el).sort((x, y) => b.el[y] - b.el[x]);
    const topMd = Object.keys(b.md).sort((x, y) => b.md[y] - b.md[x]);
    const lacking = topEl.filter(k => b.el[k] === 0);
    const mp = moonPhase();
    const shape = chartShape();
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'].map(pt);
    let hemi = '';
    if (!state.chart.noHouses) {
      const above = planets.filter(p => p.house >= 7).length;
      const east = planets.filter(p => p.house >= 10 || p.house <= 3).length;
      hemi = `<div class="card"><div class="eyebrow">Hemispheres</div>
        <div class="bars" style="margin-top:10px">
          <div class="bar"><span>Above</span><div class="track"><div class="fill" style="width:${above * 10}%"></div></div><span class="num">${above}/10</span></div>
          <div class="bar"><span>Below</span><div class="track"><div class="fill" style="width:${(10 - above) * 10}%"></div></div><span class="num">${10 - above}/10</span></div>
          <div class="bar"><span>East</span><div class="track"><div class="fill" style="width:${east * 10}%"></div></div><span class="num">${east}/10</span></div>
          <div class="bar"><span>West</span><div class="track"><div class="fill" style="width:${(10 - east) * 10}%"></div></div><span class="num">${10 - east}/10</span></div>
        </div>
        <p class="muted" style="margin-top:10px">${above >= 6 ? 'Most planets sit above the horizon: life tends to be lived in public, through visible roles and other people.' : above <= 4 ? 'Most planets sit below the horizon: you develop privately first, and home and inner life carry a lot of weight.' : 'Planets are split evenly above and below the horizon: public and private life both get attention.'}
        ${east >= 6 ? ' The eastern emphasis favours self-direction: you prefer to set your own course.' : east <= 4 ? ' The western emphasis means much of your life is shaped through partnership and response to others.' : ''}</p></div>`;
    }
    const ascSign = state.chart.noHouses ? null : E.signOf(pt('asc').lon).sign;
    const ruler = ascSign ? pt(ascSign.ruler) : null;
    const counts = {};
    state.aspects.forEach(a => { counts[a.a] = (counts[a.a] || 0) + 1; counts[a.b] = (counts[a.b] || 0) + 1; });
    const most = Object.entries(counts).filter(([k]) => planets.some(p => p.key === k)).sort((a, b) => b[1] - a[1])[0];
    $('#panel-traits').innerHTML = `
      <div class="section">
        <div><span class="eyebrow">Characteristics</span><h2>The overall balance of the chart</h2></div>
        <p class="muted">Weighted by importance: Sun, Moon and Ascendant count 3, personal planets 2, Jupiter and Saturn 1.5, outer planets 0.5.</p>
        <div class="grid-2">
          <div class="card"><div class="eyebrow">Elements</div><div class="bars" style="margin-top:10px">${elBars}</div>
            <p class="muted" style="margin-top:10px">Strongest in ${C.ELEMENTS[topEl[0]].name.toLowerCase()}. ${esc(C.ELEMENTS[topEl[0]].text)}${lacking.length ? ` No weight in ${lacking.map(k => C.ELEMENTS[k].name.toLowerCase()).join(' or ')}: those qualities may be sought in other people or developed deliberately.` : ''}</p></div>
          <div class="card"><div class="eyebrow">Modalities</div><div class="bars" style="margin-top:10px">${mdBars}</div>
            <p class="muted" style="margin-top:10px">${esc(C.MODES[topMd[0]].text)}</p></div>
        </div>
      </div>
      <div class="section">
        <div class="grid-3">
          <div class="card"><div class="eyebrow">Moon phase at birth</div><h3 style="margin:6px 0">${mp.phase.name}</h3><p class="muted">${esc(mp.phase.text)}</p><p class="faint">Moon ${mp.el.toFixed(0)}° ahead of the Sun.</p></div>
          <div class="card"><div class="eyebrow">Chart shape</div><h3 style="margin:6px 0">${shape}</h3><p class="muted">${esc(C.SHAPES[shape])}</p></div>
          ${ruler ? `<div class="card"><div class="eyebrow">Chart ruler</div><h3 style="margin:6px 0">${P(ascSign.ruler).name} in ${E.signOf(ruler.lon).sign.name}</h3><p class="muted">${ascSign.name} rising is ruled by ${P(ascSign.ruler).name}. Its placement in house ${ruler.house} makes ${C.HOUSES[ruler.house - 1].area} central to how you steer your life.</p></div>` : ''}
          ${most ? `<div class="card"><div class="eyebrow">Most connected planet</div><h3 style="margin:6px 0">${P(most[0]).name}</h3><p class="muted">${most[1]} aspects. ${esc(P(most[0]).core)} It is involved in much of what the chart does.</p></div>` : ''}
          <div class="card"><div class="eyebrow">Sect</div><h3 style="margin:6px 0">${state.chart.isDay ? 'Day chart' : 'Night chart'}</h3><p class="muted">${state.chart.isDay ? 'Born with the Sun above the horizon. The Sun, Jupiter and Saturn tend to work more constructively.' : 'Born with the Sun below the horizon. The Moon, Venus and Mars tend to work more constructively.'}</p></div>
        </div>
      </div>
      ${hemi ? `<div class="section">${hemi}</div>` : ''}`;
  }

  // ---------- Signature ----------
  function dominance() {
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    const score = {}; const why = {};
    const add = (k, v, r) => { score[k] = (score[k] || 0) + v; (why[k] = why[k] || []).push(r); };
    planets.forEach(k => { score[k] = 0; why[k] = []; });
    const ruleOf = key => E.signOf(pt(key).lon).sign.ruler;
    if (!state.chart.noHouses) {
      add(ruleOf('asc'), 3, 'rules the Ascendant');
      add(ruleOf('mc'), 2, 'rules the Midheaven');
    }
    add(ruleOf('sun'), 2, 'rules the Sun sign');
    add(ruleOf('moon'), 1, 'rules the Moon sign');
    planets.forEach(k => {
      const p = pt(k);
      const d = dignity(k, E.signOf(p.lon).sign.key);
      if (d === 'Domicile') add(k, 2, 'in its own sign');
      if (d === 'Exaltation') add(k, 1.5, 'exalted');
      if (p.house && [1, 4, 7, 10].includes(p.house)) add(k, 2, `angular (house ${p.house})`);
      if (!state.chart.noHouses) {
        ['asc', 'mc', 'dsc', 'ic'].forEach(a => { if (Math.abs(E.angDiff(p.lon, pt(a).lon)) < 8) add(k, 2, `close to the ${P(a).name}`); });
      }
      const n = state.aspects.filter(a => (a.a === k || a.b === k) && a.aspect.major).length;
      if (n) add(k, n * 0.5, `${n} aspects`);
      const disp = planets.filter(o => o !== k && ruleOf(o) === k).length;
      if (disp) add(k, disp * 0.5, `disposes ${disp} planet${disp > 1 ? 's' : ''}`);
    });
    return planets.map(k => ({ key: k, score: score[k], why: why[k] })).sort((a, b) => b.score - a.score);
  }

  function renderSignature() {
    const b = balance();
    const topEl = Object.keys(b.el).sort((x, y) => b.el[y] - b.el[x])[0];
    const topMd = Object.keys(b.md).sort((x, y) => b.md[y] - b.md[x])[0];
    const sigKey = C.SIGNATURE[`${topEl}-${topMd}`];
    const sig = E.SIGNS.find(s => s.key === sigKey);
    const dom = dominance();
    const max = dom[0].score || 1;
    $('#panel-signature').innerHTML = `
      <div class="section">
        <div><span class="eyebrow">Signature</span><h2>The sign your whole chart leans toward</h2></div>
        <div class="grid-2">
          <div class="card" style="display:grid;gap:10px;align-content:start">
            <div class="big-glyph">${signGlyph(sig)}</div>
            <h3>${sig.name} signature</h3>
            <p class="muted">Your strongest element is ${C.ELEMENTS[topEl].name.toLowerCase()} and your strongest modality is ${C.MODES[topMd].name.toLowerCase()}. Together they describe ${sig.name}, even if no planet sits there.</p>
            <p>${esc(C.SIGN_TEXT[sigKey])}</p>
          </div>
          <div class="card">
            <div class="eyebrow">Dominant planets</div>
            <div class="bars" style="margin-top:12px">${dom.slice(0, 6).map(d => `<div class="bar"><span><span class="glyph">${esc(glyphOf(d.key))}</span> ${P(d.key).name}</span><div class="track"><div class="fill" style="width:${Math.max(4, d.score / max * 100)}%"></div></div><span class="num">${d.score.toFixed(1)}</span></div>`).join('')}</div>
            <p class="muted" style="margin-top:12px"><b>${P(dom[0].key).name}</b> leads: ${esc(dom[0].why.join(', '))}. ${esc(P(dom[0].key).core)}</p>
          </div>
        </div>
      </div>`;
  }

  // ---------- Big Three ----------
  function renderBig3() {
    const items = [
      { key: 'sun', role: 'Sun · Core self', lead: 'What you are here to become.' },
      { key: 'moon', role: 'Moon · Emotional nature', lead: 'What you need in order to feel okay.' }
    ];
    if (!state.chart.noHouses) items.push({ key: 'asc', role: 'Rising · Approach to life', lead: 'How you meet the world and how it first meets you.' });
    const cards = items.map(it => {
      const p = pt(it.key); const s = E.signOf(p.lon).sign;
      return `<div class="card">
        <div class="role">${it.role}</div>
        <div class="big-glyph">${signGlyph(s)}</div>
        <h3>${s.name}</h3>
        <div class="chips"><span class="chip">${posText(p.lon)}</span>${p.house ? `<span class="chip">House ${p.house}</span>` : ''}<span class="chip">${C.ELEMENTS[s.element].name} · ${C.MODES[s.mode].name}</span></div>
        <p class="muted">${it.lead} ${esc(C.SIGN_TEXT[s.key])}</p>
        <p>${esc(signReading(it.key, p.lon) || '')}</p>
        ${p.house ? `<p class="faint">Lived out mainly through ${C.HOUSES[p.house - 1].area}.</p>` : ''}
      </div>`;
    }).join('');
    const signs = items.map(it => E.signOf(pt(it.key).lon).sign);
    const els = signs.map(s => s.element);
    const shared = els.filter((e, i) => els.indexOf(e) !== i);
    let synth;
    if (new Set(els).size === 1) synth = `All three share ${C.ELEMENTS[els[0]].name.toLowerCase()}, so what you want, what you need and how you come across point the same way. That makes you consistent and easy to read, with one element doing most of the work.`;
    else if (shared.length) synth = `Two of the three share ${C.ELEMENTS[shared[0]].name.toLowerCase()}, which sets the dominant tone. The third adds a different register that people may only notice once they know you well.`;
    else synth = `Each of the three sits in a different element, so there are real differences between your purpose, your needs and your manner. People who meet you once may read you differently from those who know you well.`;
    if (state.chart.noHouses) synth += ' Add a birth time to include your rising sign.';
    const moonRange = state.input.timeUnknown ? (() => {
      const lo = E.computeChart({ ...state.input, time: '00:00', houseSystem: 'equal', nodeType: 'true' }).points.find(p => p.key === 'moon').lon;
      const hi = E.computeChart({ ...state.input, time: '23:59', houseSystem: 'equal', nodeType: 'true' }).points.find(p => p.key === 'moon').lon;
      return `<p class="note">Without a birth time the Moon could be anywhere from ${posText(lo)} to ${posText(hi)} on that day.</p>`;
    })() : '';
    $('#panel-big3').innerHTML = `
      <div class="section">
        <div><span class="eyebrow">Big Three</span><h2>${signs.map(s => s.name).join(', ')}</h2></div>
        <div class="grid-3 big3">${cards}</div>
        ${moonRange}
        <div class="card"><div class="eyebrow">How they work together</div><p style="margin-top:6px">${esc(synth)}</p></div>
      </div>`;
  }

  // ---------- Timing ----------
  function renderTiming(force) {
    const panel = $('#panel-timing');
    const dateVal = (document.getElementById('timing-date') || {}).value || new Date().toISOString().slice(0, 10);
    if (!state.timingCache || force) {
      panel.innerHTML = `<div class="section"><div><span class="eyebrow">Timing</span><h2>Working out transits…</h2></div></div>`;
      // let the message paint before the heavy calculation
      setTimeout(() => {
        const natalKeys = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].concat(state.chart.noHouses ? [] : ['asc', 'mc']);
        const natal = state.chart.points.filter(p => natalKeys.includes(p.key));
        const from = new Date(dateVal + 'T12:00:00Z');
        const to = new Date(from.getTime() + 365 * 86400e3);
        state.timingCache = {
          date: dateVal,
          active: E.activeTransits(natal, from),
          upcoming: E.transitsBetween(natal, from, to),
          cycles: E.lifeCycles(state.chart)
        };
        drawTiming();
      }, 30);
      return;
    }
    drawTiming();
  }

  function drawTiming() {
    const t = state.timingCache;
    const now = Date.now();
    const act = t.active.map(a => `<li><button type="button" data-goto-point="${a.natal}"><span class="asp-g ${a.aspect.tone}">${a.aspect.glyph}${VS}</span><span>Transiting <b>${P(a.mover).name}</b>${a.retrograde ? ' (R)' : ''} ${esc(C.ASPECT_TEXT[a.aspect.key])} your <b>${P(a.natal).name}</b></span><span class="num">${a.orb.toFixed(1)}° ${a.applying ? 'ap' : 'sep'}</span></button></li>`).join('');
    const up = t.upcoming.map(x => `<div class="tl-item${x.date.getTime() < now ? ' past' : ''}"><span class="when">${fmtDate(x.date)}</span><span><b>${P(x.mover).name}</b>${x.retrograde ? ' (R)' : ''} ${x.aspect.name.toLowerCase()} natal <b>${P(x.natal).name}</b></span><span class="faint">${esc(L.TRANSIT[x.mover] ? `A period of ${L.TRANSIT[x.mover].theme} for your ${P(x.natal).name.toLowerCase()} (${P(x.natal).keywords.join(', ')}). ${L.TRANSIT[x.mover].length}` : '')}</span></div>`).join('');
    const cyc = t.cycles.map(c => {
      const label = c.angle === 90 ? `${c.name} (${c.angleSigned > 0 ? 'opening' : 'closing'})` : c.name;
      return `<div class="tl-item${c.dates[c.dates.length - 1].getTime() < now ? ' past' : ''}"><span class="when">Age ${Math.floor(c.age)} · ${c.dates.map(fmtDate).join(', ')}</span><span><b>${label}</b>${c.dates.length > 1 ? ` <span class="faint">(${c.dates.length} passes)</span>` : ''}</span><span class="faint">${esc(c.note)}</span></div>`;
    }).join('');
    $('#panel-timing').innerHTML = `
      <div class="section">
        <div class="section-head">
          <div><span class="eyebrow">Timing</span><h2>Where the sky is touching your chart</h2></div>
          <div class="field" style="min-width:180px"><label for="timing-date">Check from date</label><input type="date" id="timing-date" value="${t.date}"></div>
        </div>
        <div class="grid-2">
          <div class="card"><div class="eyebrow">Active on ${fmtDate(new Date(t.date + 'T12:00:00Z'))}</div>
            ${act ? `<ul class="conn-list" style="margin-top:10px">${act}</ul>` : '<p class="muted" style="margin-top:8px">No major transits within orb on this date.</p>'}
            <p class="faint" style="margin-top:10px">Orb 1.5° for slow planets, about 1° for fast ones. The Moon is left out because it changes too quickly.</p>
          </div>
          <div class="card"><div class="eyebrow">Exact hits in the next 12 months</div>
            <p class="faint" style="margin:4px 0 12px">Jupiter to Pluto against your personal planets${state.chart.noHouses ? '' : ' and angles'}. Retrograde motion can bring the same transit back up to three times.</p>
            ${up ? `<div class="timeline">${up}</div>` : '<p class="muted">No exact slow-planet hits in this window.</p>'}
          </div>
        </div>
      </div>
      <div class="section">
        <div><span class="eyebrow">Life cycles</span><h3>Returns, squares and oppositions across a lifetime</h3></div>
        <div class="card"><div class="timeline">${cyc}</div></div>
      </div>`;
  }

  // ---------- Houses ----------
  function renderHouses() {
    const panel = $('#panel-houses');
    if (state.chart.noHouses) {
      panel.innerHTML = `<div class="section"><div><span class="eyebrow">Houses</span><h2>Houses need a birth time</h2></div><p class="muted">The houses turn once a day, so without the time of birth they cannot be placed. Add a time with Edit birth data, even an approximate one, to see them.</p></div>`;
      return;
    }
    const cusps = state.chart.houses.cusps;
    const keys = visibleKeys();
    const rows = cusps.map((c, i) => {
      const n = i + 1;
      const s = E.signOf(c).sign;
      const ruler = pt(s.ruler);
      const occ = state.chart.points.filter(p => p.house === n && keys.includes(p.key) && p.kind !== 'angle');
      return `<div class="house-row">
        <div class="hn">${n}</div>
        <div class="body">
          <h3>${C.HOUSES[i].title}</h3>
          <div class="chips"><span class="chip"><span class="glyph">${signGlyph(s)}</span>Cusp ${posText(c)}</span><span class="chip">Ruler ${P(s.ruler).name} in ${E.signOf(ruler.lon).sign.name}, house ${ruler.house}</span></div>
          <p class="muted">Covers ${C.HOUSES[i].area}. ${occ.length ? `Occupied by ${occ.map(p => P(p.key).name).join(', ')}, so this area is active and personal.` : `Empty, which is common. It works through ${P(s.ruler).name}, which carries this area into house ${ruler.house} (${C.HOUSES[ruler.house - 1].title.toLowerCase()}).`}</p>
        </div>
      </div>`;
    }).join('');
    const counts = cusps.map((_, i) => state.chart.points.filter(p => p.house === i + 1 && p.kind === 'planet').length);
    const busiest = counts.indexOf(Math.max(...counts)) + 1;
    panel.innerHTML = `
      <div class="section">
        <div><span class="eyebrow">Houses</span><h2>Twelve areas of life, and what fills them</h2></div>
        <p class="muted">The busiest house is the ${ordinal(busiest)} (${C.HOUSES[busiest - 1].title.toLowerCase()}) with ${counts[busiest - 1]} planets. Change the house system under Customize chart on the Chart tab.</p>
        <div class="houses-list">${rows}</div>
      </div>`;
  }

  // ---------- Full reading ----------
  function renderReading() {
    const keys = visibleKeys().filter(k => k !== 'dsc' && k !== 'ic');
    const pts = keys.map(pt);
    const section = p => {
      const s = E.signOf(p.lon).sign;
      const conns = aspectsOf(p.key);
      const dig = p.kind === 'planet' ? dignity(p.key, s.key) : null;
      return `<article class="card reading-item" id="read-${p.key}">
        <div class="detail-head"><div class="badge-glyph${GLYPHABLE.has(p.key) && state.prefs.glyphs !== 'letters' ? '' : ' text'}">${esc(glyphOf(p.key))}</div>
        <div><div class="eyebrow">${esc(P(p.key).group || '')}</div><h3>${esc(P(p.key).name)} in ${s.name}${p.house ? `, house ${p.house}` : ''}</h3></div></div>
        <div class="chips" style="margin:10px 0"><span class="chip">${posText(p.lon)}</span>${p.retrograde ? '<span class="chip rx">Retrograde</span>' : ''}${dig ? `<span class="chip">${dig}</span>` : ''}</div>
        ${pointParagraphs(p).map(t => `<p style="margin-top:6px">${esc(t)}</p>`).join('')}
        ${conns.length ? `<div class="eyebrow" style="margin-top:12px">Aspects</div>${conns.map(a => {
          const other = a.a === p.key ? a.b : a.a;
          return `<p style="margin-top:6px"><b><span class="asp-g ${aspectTone(a.aspect)}">${a.aspect.glyph}${VS}</span> ${a.aspect.name} ${esc(P(other).name)}</b> <span class="faint">(orb ${a.orb.toFixed(1)}°)</span>. ${esc(AT.readAspect(p.key, other, a.aspect.key, a.aspect.major ? a.aspect.tone : 'adjust', [P(p.key).name, P(other).name]))}</p>`;
        }).join('')}` : ''}
      </article>`;
    };
    const groups = [
      ['The lights', ['sun', 'moon']],
      ['Angles', ['asc', 'mc']],
      ['Personal planets', ['mercury', 'venus', 'mars']],
      ['Social planets', ['jupiter', 'saturn']],
      ['Outer planets', ['uranus', 'neptune', 'pluto']],
      ['Points', ['nnode', 'snode', 'chiron', 'lilith', 'vertex', 'fortune']]
    ];
    const patterns = E.findPatterns(state.chart.points.filter(p => ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron'].includes(p.key)), state.aspects);
    const toc = pts.map(p => `<a class="chip" href="#read-${p.key}" data-scroll="read-${p.key}"><span class="glyph">${esc(glyphOf(p.key))}</span>${esc(P(p.key).name)}</a>`).join('');
    $('#panel-reading').innerHTML = `
      <div class="section">
        <div><span class="eyebrow">Full reading</span><h2>Every placement, explained</h2></div>
        <p class="muted">Each placement is read in layers: what the planet or point stands for, how its sign colours it, the area of life its house points to, and the aspects that connect it to the rest of the chart. Start with the lights and angles, then read outward.</p>
        <div class="chips">${toc}</div>
        <div class="actions no-print"><button class="btn small" type="button" id="reading-print">Print reading</button></div>
      </div>
      ${groups.map(([title, ks]) => {
        const items = ks.filter(k => keys.includes(k)).map(pt);
        return items.length ? `<div class="section"><h3>${title}</h3><div class="reading-list">${items.map(section).join('')}</div></div>` : '';
      }).join('')}
      ${patterns.length ? `<div class="section"><h3>Patterns</h3><div class="grid-2">${patterns.map(pp => `<div class="card"><div class="eyebrow">${esc(pp.type)}</div><p style="margin:6px 0">${pp.members.map(m => esc(P(m).name)).join(' · ')}</p><p class="muted">${esc(L.PATTERN_INFO[pp.type] || '')}</p></div>`).join('')}</div></div>` : ''}`;
  }

  function renderLearn() {
    $('#panel-learn').innerHTML = `
      <div class="section">
        <div><span class="eyebrow">Learn</span><h2>How to read a birth chart</h2></div>
        <p class="muted">A chart is read by combining three things: planets (what), signs (how) and houses (where). Aspects show how the parts talk to each other.</p>
        <div class="grid-2">${L.GLOSSARY.map(g => `<div class="card"><h3>${esc(g.term)}</h3><p class="muted" style="margin-top:6px">${esc(g.text)}</p></div>`).join('')}</div>
      </div>
      <div class="section">
        <h3>The twelve houses</h3>
        <div class="grid-3">${C.HOUSES.map((h, i) => `<div class="card"><div class="eyebrow">House ${i + 1}</div><h3>${esc(h.title)}</h3><p class="muted" style="margin-top:6px">Covers ${esc(h.area)}.</p></div>`).join('')}</div>
      </div>
      <div class="section">
        <h3>The twelve signs</h3>
        <div class="grid-3">${E.SIGNS.map(s => `<div class="card"><div class="big-glyph" style="font-size:30px">${signGlyph(s)}</div><h3>${s.name}</h3><p class="muted" style="margin-top:6px">${esc(C.SIGN_TEXT[s.key])} Ruled by ${P(s.ruler).name}.</p></div>`).join('')}</div>
      </div>
      <div class="section">
        <h3>Aspects</h3>
        <div class="grid-3">${E.ASPECTS.map(a => `<div class="card"><div class="big-glyph asp-g ${aspectTone(a)}" style="font-size:30px">${a.glyph}${VS}</div><h3>${a.name} · ${a.angle}°</h3><p class="muted" style="margin-top:6px">${esc(C.ASPECT_MEANING[a.key])} Default orb ${a.orb}°.</p></div>`).join('')}</div>
      </div>
      <div class="section">
        <h3>Elements and modalities</h3>
        <div class="grid-2">${Object.values(C.ELEMENTS).concat(Object.values(C.MODES)).map(x => `<div class="card"><h3>${esc(x.name)}</h3><p class="muted" style="margin-top:6px">${esc(x.text)}</p></div>`).join('')}</div>
      </div>
      <div class="section">
        <h3>Planets and points</h3>
        <div class="grid-3">${Object.entries(C.POINTS).map(([k, v]) => `<div class="card"><div class="eyebrow">${esc(v.group)}</div><h3><span class="glyph">${GLYPHABLE.has(k) ? esc(v.glyph + VS) : ''}</span> ${esc(v.name)}</h3><p class="muted" style="margin-top:6px">${esc(v.core)}</p></div>`).join('')}</div>
      </div>`;
  }

  // ---------- Life guidance ----------
  const T = window.ChartTopics;
  state.guide = { topic: store.get('guideTopic', 'career'), question: '' };

  const cuspSign = h => E.signOf(state.chart.houses.cusps[h - 1]).sign;
  const houseRuler = h => pt(cuspSign(h).ruler);
  const PLANET_KEYS = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'nnode'];
  const occupants = h => state.chart.points.filter(p => p.house === h && PLANET_KEYS.includes(p.key));
  const sgn = k => E.signOf(pt(k).lon).sign;
  function houseLine(h) {
    const sg = cuspSign(h);
    const style = C.SIGN_STYLE[sg.key].replace(/^In \w+ it (\w+?)s /, 'you tend to $1 ');
    return `Your ${ordinal(h)} house (${C.HOUSES[h - 1].area}) begins in ${sg.name}: here ${style}`;
  }
  function rulerLine(h, label) {
    const r = houseRuler(h);
    return `The ruler of ${label}, ${P(r.key).name}, sits in ${E.signOf(r.lon).sign.name}${r.house ? ` in your ${ordinal(r.house)} house, which links ${label} to ${C.HOUSES[r.house - 1].area}` : ''}.`;
  }
  const occupantLines = h => occupants(h).map(p => `<li><b>${esc(P(p.key).name)} in house ${h}.</b> ${esc(houseReading(p.key, h) || '')}</li>`).join('');
  function aspectsInvolving(keys, tone) {
    return state.aspects.filter(a => a.aspect.major && (keys.includes(a.a) || keys.includes(a.b)) && (tone === 'flow' ? ['trine', 'sextile'].includes(a.aspect.key) : tone === 'tension' ? ['square', 'opposition'].includes(a.aspect.key) : a.aspect.key === 'conjunction')).slice(0, 4);
  }
  const aspectItems = list => list.map(a => `<li><b>${esc(P(a.a).name)} ${a.aspect.name.toLowerCase()} ${esc(P(a.b).name)}</b> <span class="faint">(orb ${a.orb.toFixed(1)}°)</span>. ${esc(AT.readAspect(a.a, a.b, a.aspect.key, aspectTone(a.aspect), [P(a.a).name, P(a.b).name]))}</li>`).join('');
  const dominantEl = () => { const b = balance(); return Object.keys(b.el).sort((x, y) => b.el[y] - b.el[x])[0]; };
  const dominantMd = () => { const b = balance(); return Object.keys(b.md).sort((x, y) => b.md[y] - b.md[x])[0]; };
  const upcomingFor = keys => {
    const natal = state.chart.points.filter(p => keys.includes(p.key));
    if (!natal.length) return [];
    const now = new Date();
    return E.transitsBetween(natal, now, new Date(now.getTime() + 365 * 86400e3));
  };
  const timingList = list => list.length ? `<ul class="syn-list">${list.slice(0, 8).map(x => {
    const good = x.mover === 'jupiter' || ['trine', 'sextile'].includes(x.aspect.key);
    return `<li><span class="pill ${good ? 'ok' : 'warn'}">${good ? 'Opening' : 'Test'}</span> <b>${fmtDate(x.date)}</b>: ${P(x.mover).name}${x.retrograde ? ' (R)' : ''} ${x.aspect.name.toLowerCase()} your ${P(x.natal).name}. <span class="muted">${esc(L.TRANSIT[x.mover] ? 'A period of ' + L.TRANSIT[x.mover].theme + '.' : '')}</span></li>`;
  }).join('')}</ul>` : '<p class="muted">No slow-planet transits to these points in the next 12 months. It is a steadier period for this area.</p>';
  // Drops empty lists, and the whole section when nothing is left to say.
  const sectionHtml = (title, body) => {
    body = (body || '').replace(/<ul class="syn-list"><\/ul>/g, '').trim();
    return body ? `<div class="card guide-section"><h3>${title}</h3>${body}</div>` : '';
  };
  const para = t => t ? `<p>${esc(t)}</p>` : '';

  function careerFields() {
    const score = {}, why = {};
    const add = (list, w, reason) => list.forEach(f => { score[f] = (score[f] || 0) + w; (why[f] = why[f] || new Set()).add(reason); });
    if (!state.chart.noHouses) {
      add(T.CAREER_BY_SIGN[E.signOf(pt('mc').lon).index], 3, `Midheaven in ${sgn('mc').name}`);
      const mr = houseRuler(10);
      if (T.CAREER_BY_PLANET[mr.key]) add(T.CAREER_BY_PLANET[mr.key].fields, 2, `${P(mr.key).name} rules your career house`);
      occupants(10).forEach(p => T.CAREER_BY_PLANET[p.key] && add(T.CAREER_BY_PLANET[p.key].fields, 2, `${P(p.key).name} in the 10th house`));
      occupants(6).forEach(p => T.CAREER_BY_PLANET[p.key] && add(T.CAREER_BY_PLANET[p.key].fields, 1, `${P(p.key).name} in the 6th house`));
    }
    add(T.CAREER_BY_SIGN[E.signOf(pt('sun').lon).index], 1.5, `Sun in ${sgn('sun').name}`);
    const dom = dominance()[0];
    if (T.CAREER_BY_PLANET[dom.key]) add(T.CAREER_BY_PLANET[dom.key].fields, 1.5, `${P(dom.key).name} is your dominant planet`);
    return Object.keys(score).sort((a, b) => score[b] - score[a]).slice(0, 9).map(f => ({ field: f, why: [...why[f]] }));
  }

  function independenceLean() {
    let ind = 0, str = 0;
    const b = balance();
    ind += (b.el.fire + b.md.cardinal) / b.tot * 4;
    str += (b.el.earth + b.md.fixed) / b.tot * 4;
    ['sun', 'mars', 'uranus'].forEach(k => { const h = pt(k).house; if ([1, 10].includes(h)) ind += 1.5; });
    ['saturn', 'moon'].forEach(k => { const h = pt(k).house; if ([6, 10].includes(h)) str += 1; });
    if (!state.chart.noHouses && ['ari', 'leo', 'aqu', 'sag'].includes(sgn('mc').key)) ind += 1.5;
    if (!state.chart.noHouses && ['cap', 'vir', 'tau', 'can'].includes(sgn('mc').key)) str += 1.5;
    if (ind > str + 1) return 'Your chart leans toward independence. Self-employment, freelancing or roles with a lot of autonomy suit you better than tightly managed jobs.';
    if (str > ind + 1) return 'Your chart leans toward structure. You tend to do well inside established organisations, where clear roles and steady advancement reward your reliability.';
    return 'Your chart is balanced between independence and structure. A stable base plus a side project, or an autonomous role inside an organisation, often works best.';
  }

  function guideTopic(key) {
    const nh = state.chart.noHouses;
    const noTime = nh ? '<p class="note">No birth time, so houses, the Midheaven and the Ascendant are left out. The answer uses planets and signs only.</p>' : '';
    const factor = (label, k) => `<button class="chip" type="button" data-goto-point="${k}"><span class="glyph">${esc(glyphOf(k))}</span>${esc(label)}</button>`;
    let factors = [], body = '', timing = [], reflect = [];
    if (key === 'career') {
      factors = [factor(`Sun in ${sgn('sun').name}`, 'sun'), factor(`Saturn in ${sgn('saturn').name}`, 'saturn')];
      if (!nh) factors.unshift(factor(`Midheaven in ${sgn('mc').name}`, 'mc'), factor(`Career ruler ${P(houseRuler(10).key).name}`, houseRuler(10).key));
      const fields = careerFields();
      body += sectionHtml('Your direction', (nh ? '' : para(signReading('mc', pt('mc').lon)) + para(rulerLine(10, 'your career house'))) + para(signReading('sun', pt('sun').lon)) + (nh ? '' : (occupants(10).length ? `<ul class="syn-list">${occupantLines(10)}</ul>` : '')));
      body += sectionHtml('Work style', para(T.WORK_STYLE[dominantEl()] + ' ' + T.WORK_STYLE[dominantMd()]) + (nh ? '' : para(houseLine(6))) + (nh ? '' : (occupants(6).length ? `<ul class="syn-list">${occupantLines(6)}</ul>` : '')) + para(houseReading('saturn', pt('saturn').house)));
      body += sectionHtml('Fields to consider', `<p class="muted">Ranked by how many chart factors point to them. Treat these as themes to explore, not a fixed list.</p><ul class="field-list">${fields.map(f => `<li><b>${esc(f.field.charAt(0).toUpperCase() + f.field.slice(1))}</b><span class="faint">${esc(f.why.join(' · '))}</span></li>`).join('')}</ul>`);
      body += sectionHtml('Employed or self-employed?', para(independenceLean()));
      body += sectionHtml('Professional strengths', `<ul class="syn-list">${aspectItems(aspectsInvolving(['sun', 'mc', 'saturn', 'mercury', 'mars', 'jupiter'], 'flow'))}</ul>`);
      body += sectionHtml('Where work gets hard', `<ul class="syn-list">${aspectItems(aspectsInvolving(['sun', 'mc', 'saturn', 'mars'], 'tension'))}</ul>`);
      timing = upcomingFor(nh ? ['sun', 'saturn'] : ['mc', 'sun', 'saturn', houseRuler(10).key]);
      reflect = ['Which of the suggested fields already excites you, and why?', 'Do you do your best work alone, or inside a team with clear roles?', 'What would you want to be known for in ten years?'];
    } else if (key === 'love') {
      const v = sgn('venus'), mo = sgn('moon');
      const ll = T.LOVE_LANGUAGE[v.element], lm = T.LOVE_LANGUAGE[mo.element];
      factors = [factor(`Venus in ${v.name}`, 'venus'), factor(`Mars in ${sgn('mars').name}`, 'mars'), factor(`Moon in ${mo.name}`, 'moon')];
      if (!nh) factors.push(factor(`Descendant in ${sgn('dsc').name}`, 'dsc'));
      const compatibleSigns = E.SIGNS.filter(s => s.element === v.element || ({ fire: 'air', air: 'fire', earth: 'water', water: 'earth' })[v.element] === s.element).map(s => s.name);
      body += sectionHtml('How you love', para(signReading('venus', pt('venus').lon)) + para(houseReading('venus', pt('venus').house)));
      body += sectionHtml('Love language', `<p>You show love through <b>${ll.gives}</b>. You feel loved through <b>${lm.needs}</b>${lm !== ll ? ` and ${ll.needs}` : ''}.</p><p class="muted">Tell a partner this directly. Many relationship misunderstandings come from giving love in your own language rather than theirs.</p>`);
      body += sectionHtml('What you need to feel secure', para(signReading('moon', pt('moon').lon)));
      body += sectionHtml('What attracts you', para(signReading('mars', pt('mars').lon)) + (nh ? '' : para(signReading('dsc', pt('dsc').lon))));
      if (!nh) body += sectionHtml('The partner who suits you', para(houseLine(7)) + para(rulerLine(7, 'partnership')) + (occupants(7).length ? `<ul class="syn-list">${occupantLines(7)}</ul>` : '') + para(houseLine(5)));
      body += sectionHtml('Relationship strengths', `<ul class="syn-list">${aspectItems(aspectsInvolving(['venus', 'moon'], 'flow'))}</ul>`);
      body += sectionHtml('Patterns to watch', `<ul class="syn-list">${aspectItems(aspectsInvolving(['venus', 'moon', 'mars'], 'tension'))}</ul>`);
      body += sectionHtml('Signs that harmonise with your Venus', `<p>Traditionally ${compatibleSigns.join(', ')}. Real compatibility depends on the whole chart, so compare two charts on the <b>Compatibility</b> tab for a full answer.</p>`);
      timing = upcomingFor(nh ? ['venus', 'moon'] : ['venus', 'moon', 'dsc', houseRuler(7).key]);
      reflect = ['Do your partners usually get love in the form you give it, or the form they need?', 'Which of the patterns to watch have you seen repeat?', 'What does feeling safe with someone look like for you?'];
    } else if (key === 'money') {
      factors = [factor(`Venus in ${sgn('venus').name}`, 'venus'), factor(`Jupiter in ${sgn('jupiter').name}`, 'jupiter')];
      if (!nh) factors.unshift(factor(`Money ruler ${P(houseRuler(2).key).name}`, houseRuler(2).key));
      if (!nh) body += sectionHtml('How you earn and spend', para(T.MONEY_BY_SIGN[E.signOf(state.chart.houses.cusps[1]).index]) + para(rulerLine(2, 'your money house')) + (occupants(2).length ? `<ul class="syn-list">${occupantLines(2)}</ul>` : ''));
      body += sectionHtml('Where abundance comes from', para(signReading('jupiter', pt('jupiter').lon)) + para(houseReading('jupiter', pt('jupiter').house)));
      body += sectionHtml('Values and spending', para(signReading('venus', pt('venus').lon)));
      if (!nh) body += sectionHtml('Shared money, loans and investments', para(houseLine(8)) + (occupants(8).length ? `<ul class="syn-list">${occupantLines(8)}</ul>` : ''));
      body += sectionHtml('Financial strengths', `<ul class="syn-list">${aspectItems(aspectsInvolving(['jupiter', 'venus', 'saturn'], 'flow'))}</ul>`);
      body += sectionHtml('Financial pitfalls', `<ul class="syn-list">${aspectItems(aspectsInvolving(['jupiter', 'venus', 'neptune'], 'tension'))}</ul>`);
      timing = upcomingFor(nh ? ['jupiter', 'venus'] : ['jupiter', 'venus', houseRuler(2).key]);
      reflect = ['Is your income style steady or in bursts, and do your savings match that?', 'What do you spend on that truly reflects your values?'];
    } else if (key === 'home') {
      factors = [factor(`Moon in ${sgn('moon').name}`, 'moon')];
      if (!nh) factors.unshift(factor(`IC in ${sgn('ic').name}`, 'ic'));
      if (!nh) body += sectionHtml('Roots and the home you need', para(signReading('ic', pt('ic').lon)) + para(rulerLine(4, 'home')) + (occupants(4).length ? `<ul class="syn-list">${occupantLines(4)}</ul>` : ''));
      body += sectionHtml('Emotional needs at home', para(signReading('moon', pt('moon').lon)) + para(houseReading('moon', pt('moon').house)));
      if (!nh) body += sectionHtml('Children and creativity', para(houseLine(5)) + (occupants(5).length ? `<ul class="syn-list">${occupantLines(5)}</ul>` : ''));
      body += sectionHtml('Family patterns', `<ul class="syn-list">${aspectItems(aspectsInvolving(['moon', 'saturn'], 'tension').concat(aspectsInvolving(['moon'], 'flow')))}</ul>`);
      timing = upcomingFor(nh ? ['moon'] : ['moon', 'ic']);
      reflect = ['What did home feel like growing up, and what do you want it to feel like now?'];
    } else if (key === 'health') {
      factors = [factor(`Sun in ${sgn('sun').name}`, 'sun'), factor(`Mars in ${sgn('mars').name}`, 'mars'), factor(`Moon in ${sgn('moon').name}`, 'moon')];
      body += '<p class="note">This is traditional astrology about energy and habits, not medical advice. See a doctor for any health concern.</p>';
      if (!nh) body += sectionHtml('Your constitution', para(T.WELLBEING[E.signOf(pt('asc').lon).index]) + para(houseLine(6)) + (occupants(6).length ? `<ul class="syn-list">${occupantLines(6)}</ul>` : ''));
      body += sectionHtml('Vitality', para(T.WELLBEING[E.signOf(pt('sun').lon).index]));
      body += sectionHtml('How your energy works', para(signReading('mars', pt('mars').lon)));
      body += sectionHtml('Emotional wellbeing', para(signReading('moon', pt('moon').lon)));
      body += sectionHtml('What drains you', `<ul class="syn-list">${aspectItems(aspectsInvolving(['sun', 'moon', 'mars'], 'tension'))}</ul>`);
      timing = upcomingFor(nh ? ['sun', 'moon', 'mars'] : ['sun', 'moon', 'mars', 'asc']);
      reflect = ['Which activity reliably restores your energy?', 'Where in your week could you add one of the recharge suggestions?'];
    } else if (key === 'purpose') {
      factors = [factor(`Sun in ${sgn('sun').name}`, 'sun'), factor(`North Node in ${sgn('nnode').name}`, 'nnode'), factor(`Saturn in ${sgn('saturn').name}`, 'saturn'), factor(`Chiron in ${sgn('chiron').name}`, 'chiron')];
      body += sectionHtml('Who you are becoming', para(signReading('sun', pt('sun').lon)) + para(houseReading('sun', pt('sun').house)));
      body += sectionHtml('Your growth direction', para(signReading('nnode', pt('nnode').lon)) + para(houseReading('nnode', pt('nnode').house)));
      body += sectionHtml('Your life lesson', para(signReading('saturn', pt('saturn').lon)) + para(houseReading('saturn', pt('saturn').house)));
      body += sectionHtml('The wound that becomes wisdom', para(signReading('chiron', pt('chiron').lon)) + para(houseReading('chiron', pt('chiron').house)));
      const cyc = E.lifeCycles(state.chart).filter(c => c.dates[c.dates.length - 1] > new Date()).slice(0, 4);
      body += sectionHtml('Turning points ahead', cyc.length ? `<ul class="syn-list">${cyc.map(c => `<li><b>${esc(c.name)}</b>, age ${Math.floor(c.age)} (${c.dates.map(fmtDate).join(', ')}). ${esc(c.note)}</li>`).join('')}</ul>` : '');
      timing = upcomingFor(['sun', 'nnode', 'saturn']);
      reflect = ['When have you felt most "on path"? What were you doing?', 'Which familiar habit (your South Node) do you lean on when stressed?'];
    } else if (key === 'friends') {
      factors = [factor(`Uranus in ${sgn('uranus').name}`, 'uranus'), factor(`Venus in ${sgn('venus').name}`, 'venus')];
      if (!nh) body += sectionHtml('Your circle', para(houseLine(11)) + para(rulerLine(11, 'friendship')) + (occupants(11).length ? `<ul class="syn-list">${occupantLines(11)}</ul>` : ''));
      body += sectionHtml('How you connect socially', para(`Your Venus is in ${sgn('venus').element}: you offer friends ${T.LOVE_LANGUAGE[sgn('venus').element].gives}, and you need ${T.LOVE_LANGUAGE[sgn('moon').element].needs} from the people close to you.`));
      body += sectionHtml('Social strengths and friction', `<ul class="syn-list">${aspectItems(aspectsInvolving(['venus', 'uranus', 'jupiter'], 'flow').concat(aspectsInvolving(['venus', 'uranus'], 'tension')))}</ul>`);
      timing = upcomingFor(nh ? ['venus'] : ['venus', houseRuler(11).key]);
      reflect = ['Which friendships give you energy, and which cost it?'];
    } else if (key === 'mind') {
      const m = sgn('mercury');
      const learn = { fire: 'by doing, trying and competing', earth: 'through hands-on practice and concrete examples', air: 'by reading, discussing and connecting ideas', water: 'through stories, images and emotional connection to the subject' }[m.element];
      factors = [factor(`Mercury in ${m.name}`, 'mercury'), factor(`Jupiter in ${sgn('jupiter').name}`, 'jupiter')];
      body += sectionHtml('How you think', para(signReading('mercury', pt('mercury').lon)) + para(houseReading('mercury', pt('mercury').house)) + (pt('mercury').retrograde ? para(L.RETRO.mercury) : ''));
      body += sectionHtml('How you learn best', `<p>You learn best ${learn}.</p>` + (nh ? '' : para(houseLine(3)) + para(houseLine(9))));
      body += sectionHtml('Communication strengths', `<ul class="syn-list">${aspectItems(aspectsInvolving(['mercury'], 'flow'))}</ul>`);
      body += sectionHtml('Communication pitfalls', `<ul class="syn-list">${aspectItems(aspectsInvolving(['mercury'], 'tension'))}</ul>`);
      timing = upcomingFor(['mercury', 'jupiter']);
      reflect = ['Which learning method has actually worked for you before?'];
    } else if (key === 'strengths') {
      const digs = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn'].map(k => ({ k, d: dignity(k, sgn(k).key) })).filter(x => x.d);
      const b = balance();
      const lacking = Object.keys(b.el).filter(k => b.el[k] / b.tot < 0.1);
      factors = [factor(`Dominant: ${P(dominance()[0].key).name}`, dominance()[0].key)];
      body += sectionHtml('Natural talents', `<ul class="syn-list">${aspectItems(state.aspects.filter(a => ['trine', 'sextile'].includes(a.aspect.key) && PLANET_KEYS.includes(a.a) && PLANET_KEYS.includes(a.b)).slice(0, 5))}</ul>` + (digs.filter(x => ['Domicile', 'Exaltation'].includes(x.d)).map(x => para(`${P(x.k).name} is strong in ${sgn(x.k).name} (${x.d.toLowerCase()}): ${P(x.k).core.toLowerCase()}`)).join('')));
      body += sectionHtml('Growth edges', `<ul class="syn-list">${aspectItems(state.aspects.filter(a => ['square', 'opposition'].includes(a.aspect.key) && PLANET_KEYS.includes(a.a) && PLANET_KEYS.includes(a.b)).slice(0, 5))}</ul>` + digs.filter(x => ['Detriment', 'Fall'].includes(x.d)).map(x => para(`${P(x.k).name} in ${sgn(x.k).name} (${x.d.toLowerCase()}) has to work harder, which can turn into unusual skill.`)).join(''));
      body += sectionHtml('Balance', para(`Your strongest element is ${dominantEl()}. ${C.ELEMENTS[dominantEl()].text}`) + (lacking.length ? para(`Little ${lacking.join(' or ')} in the chart: ${lacking.map(k => C.ELEMENTS[k].text.split('.')[0].toLowerCase()).join('; ')} may need deliberate practice, or come through other people.`) : ''));
      reflect = ['Which talent do you take for granted?', 'Which tension has pushed you to grow the most?'];
    }
    const topic = T.TOPICS.find(t => t.key === key);
    return `<div class="section guide-answer">
      <div class="print-only"><span class="eyebrow">Life guidance · ${esc(state.input.name || '')}</span></div>
      <div class="section-head"><div><span class="eyebrow">Answer</span><h2>${esc(topic.name)}</h2></div><button class="btn small no-print" type="button" id="guide-print">Print this answer</button></div>
      ${noTime}
      <div class="chips"><span class="faint">Based on:</span> ${factors.join('')}</div>
      <div class="guide-grid">${body}</div>
      ${key !== 'strengths' ? sectionHtml('Timing: the next 12 months', timingList(timing)) : ''}
      ${reflect.length ? sectionHtml('Questions to reflect on', `<ul class="syn-list">${reflect.map(r => `<li>${esc(r)}</li>`).join('')}</ul>`) : ''}
    </div>`;
  }

  function renderGuide() {
    const g = state.guide;
    const topic = T.TOPICS.find(t => t.key === g.topic) || T.TOPICS[0];
    $('#panel-guide').innerHTML = `
      <div class="section no-print">
        <div><span class="eyebrow">Life guidance</span><h2>Ask the chart a question</h2></div>
        <p class="muted">Type a question about career, love, money, family, health, purpose, friends or learning, or pick a topic. The answer is built from the placements astrologers traditionally read for that area of life.</p>
        <form class="ask" id="ask-form">
          <label class="sr-only" for="ask-input">Your question</label>
          <input type="text" id="ask-input" placeholder="For example: What career suits me?" value="${esc(g.question)}" autocomplete="off">
          <button class="btn primary" type="submit">Ask</button>
        </form>
        <p class="form-error" id="ask-error" hidden></p>
        <div class="chips topic-chips">${T.TOPICS.map(t => `<button class="chip${t.key === topic.key ? ' on' : ''}" type="button" data-topic="${t.key}">${esc(t.name)}</button>`).join('')}</div>
        <div class="chips">${topic.examples.map(q => `<button class="chip ghost" type="button" data-ask="${esc(q)}">${esc(q)}</button>`).join('')}</div>
      </div>
      <div id="guide-answer">${guideTopic(topic.key)}</div>`;
  }

  function bindGuide() {
    const panel = $('#panel-guide');
    const ask = q => {
      const t = T.routeQuestion(q);
      state.guide.question = q;
      if (!t) {
        const el = $('#ask-error');
        el.textContent = 'That question did not match a topic. Try words like career, love, money, family, health, purpose, friends or learning, or pick a topic below.';
        el.hidden = false;
        return;
      }
      state.guide.topic = t.key; store.set('guideTopic', t.key);
      renderGuide();
      $('#guide-answer').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    panel.addEventListener('submit', e => { if (e.target.id === 'ask-form') { e.preventDefault(); ask($('#ask-input').value); } });
    panel.addEventListener('click', e => {
      const tb = e.target.closest('[data-topic]');
      if (tb) { state.guide.topic = tb.dataset.topic; state.guide.question = ''; store.set('guideTopic', tb.dataset.topic); renderGuide(); return; }
      const qb = e.target.closest('[data-ask]');
      if (qb) { ask(qb.dataset.ask); return; }
      if (e.target.id === 'guide-print') printPanel();
    });
  }

  // ---------- Compatibility ----------
  const PARTNER_EXAMPLE = {
    name: 'Example partner', date: '1998-06-21', time: '18:30', timeUnknown: false,
    place: 'Paris, France', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', utcOffset: 2, example: true
  };
  state.compat = { A: null, B: store.get('compatB', PARTNER_EXAMPLE), result: null };

  function personForm(id, who, i) {
    const saved = store.get('saved', []);
    return `<div class="card person" id="${id}">
      <div class="section-head"><h3>${who}</h3>
        <select class="load-select" data-person="${id}" aria-label="Load a chart for ${who}">
          <option value="">Load a chart…</option>
          <option value="current">Chart on the Chart tab</option>
          ${saved.map((c, n) => `<option value="${n}">${esc(c.name || 'Unnamed')} · ${esc(c.date)}</option>`).join('')}
        </select>
      </div>
      <div class="form-grid">
        <div class="field full"><label for="${id}-name">Name</label><input type="text" id="${id}-name" value="${esc(i.name || '')}" autocomplete="off"></div>
        <div class="field"><label for="${id}-date">Date of birth</label><input type="date" id="${id}-date" value="${esc(i.date || '')}" min="1800-01-01" max="2199-12-31"></div>
        <div class="field"><label for="${id}-time">Time of birth</label><input type="time" id="${id}-time" value="${i.timeUnknown ? '' : esc(i.time || '')}" ${i.timeUnknown ? 'disabled' : ''}></div>
        <div class="field full"><label class="checks"><input type="checkbox" id="${id}-unknown" ${i.timeUnknown ? 'checked' : ''}> Birth time unknown</label></div>
        <div class="field full"><label for="${id}-place">Place of birth</label><input type="text" id="${id}-place" list="city-options" value="${esc(i.place || '')}" autocomplete="off" placeholder="Start typing a city"></div>
      </div>
      <details class="coords">
        <summary>Coordinates and time zone</summary>
        <div class="form-grid" style="margin-top:10px">
          <div class="field"><label for="${id}-lat">Latitude (north +)</label><input type="number" id="${id}-lat" step="0.0001" value="${i.lat ?? ''}"></div>
          <div class="field"><label for="${id}-lon">Longitude (east +)</label><input type="number" id="${id}-lon" step="0.0001" value="${i.lon ?? ''}"></div>
          <div class="field"><label for="${id}-tz">Time zone</label><select id="${id}-tz"><option value="">Manual offset</option>${TZS.map(z => `<option value="${z}" ${z === i.tz ? 'selected' : ''}>${z.replace(/_/g, ' ')}</option>`).join('')}</select></div>
          <div class="field"><label for="${id}-offset">UTC offset (hours)</label><input type="number" id="${id}-offset" step="0.25" value="${i.utcOffset ?? 0}"></div>
        </div>
      </details>
    </div>`;
  }

  function readPerson(id, who) {
    const v = sel => $(`#${id}-${sel}`);
    const unknown = v('unknown').checked;
    const i = {
      name: v('name').value.trim() || who, date: v('date').value, time: unknown ? '12:00' : v('time').value, timeUnknown: unknown,
      place: v('place').value.trim(), lat: parseFloat(v('lat').value), lon: parseFloat(v('lon').value), tz: v('tz').value, utcOffset: parseFloat(v('offset').value)
    };
    if (!i.date) return { error: `Enter a date of birth for ${who}.` };
    if (!unknown && !i.time) return { error: `Enter a birth time for ${who}, or tick "Birth time unknown".` };
    if (!Number.isFinite(i.lat) || !Number.isFinite(i.lon)) return { error: `Choose a city from the list for ${who}, or enter coordinates under "Coordinates and time zone".` };
    if (i.tz) { const off = CITY.utcOffsetFor(i.tz, i.date, i.time); if (off != null) i.utcOffset = off; }
    if (!Number.isFinite(i.utcOffset)) return { error: `Enter a UTC offset for ${who}.` };
    return { value: i };
  }

  function fillPerson(id, i) {
    const v = sel => $(`#${id}-${sel}`);
    v('name').value = i.name || ''; v('date').value = i.date || '';
    v('time').value = i.timeUnknown ? '' : (i.time || ''); v('unknown').checked = !!i.timeUnknown; v('time').disabled = !!i.timeUnknown;
    v('place').value = i.place || ''; v('lat').value = i.lat ?? ''; v('lon').value = i.lon ?? '';
    v('tz').value = TZS.includes(i.tz) ? i.tz : ''; v('offset').value = i.utcOffset ?? 0;
  }

  function chartFor(i) {
    const c = E.computeChart({ date: i.date, time: i.timeUnknown ? '12:00' : i.time, utcOffset: i.utcOffset, lat: i.lat, lon: i.lon, houseSystem: 'placidus', nodeType: 'true' });
    c.noHouses = !!i.timeUnknown;
    if (c.noHouses) c.points.forEach(p => { p.house = null; });
    return c;
  }

  function renderCompat() {
    const panel = $('#panel-compat');
    const A = state.compat.A || state.input;
    const B = state.compat.B;
    const names = [A.name || 'Person A', B.name || 'Person B'];
    panel.innerHTML = `
      <div class="section no-print">
        <div><span class="eyebrow">Compatibility</span><h2>Compare two birth charts</h2></div>
        <p class="muted">Enter two people's birth data to see how their charts connect across seven areas of life, and how similar they are. It works for partners, friends, family or colleagues.</p>
        <datalist id="city-options">${CITY.CITIES.map(c => `<option value="${esc(c.name)}, ${esc(c.country)}"></option>`).join('')}</datalist>
        <div class="grid-2">${personForm('pa', 'Person A', A)}${personForm('pb', 'Person B', B)}</div>
        <p class="form-error" id="compat-error" hidden></p>
        <div class="actions">
          <button class="btn primary" type="button" id="compat-run">Compare charts</button>
          <button class="btn" type="button" id="compat-swap">Swap people</button>
          <button class="btn" type="button" id="compat-print">Print report</button>
        </div>
      </div>
      <div id="compat-report"></div>`;
    runCompat(A, B);
  }

  function runCompat(A, B) {
    let CA, CB;
    try { CA = chartFor(A); CB = chartFor(B); } catch (err) {
      const el = $('#compat-error'); el.textContent = 'One of the charts could not be calculated. Check the dates and coordinates.'; el.hidden = false; return;
    }
    const r = window.ChartCompat.compare(CA, CB);
    state.compat.result = r;
    const nA = A.name || 'Person A', nB = B.name || 'Person B';
    const ownerA = k => `${esc(nA)}'s ${P(k).name}`;
    const ownerB = k => `${esc(nB)}'s ${P(k).name}`;
    const L2 = window.ChartCompat.label;
    const aspLine = x => `<li><span class="asp-g ${x.weight >= 0 ? 'flow' : 'tension'}">${x.aspect.glyph}${VS}</span> <b>${ownerA(x.a)} ${x.aspect.name.toLowerCase()} ${ownerB(x.b)}</b> <span class="faint">(orb ${x.orb.toFixed(1)}°)</span><br><span class="muted">${esc(AT.readAspect(x.a, x.b, x.aspect.key, ['trine', 'sextile'].includes(x.aspect.key) ? 'flow' : ['square', 'opposition'].includes(x.aspect.key) ? 'tension' : 'blend', [nA + "'s " + P(x.a).name, nB + "'s " + P(x.b).name]))}</span></li>`;
    const areaCard = a => {
      const lb = L2(a.score);
      const top = a.support.slice(0, 3), low = a.strain.slice(0, 3);
      return `<article class="card area-card">
        <div class="section-head"><h3>${esc(a.name)}</h3><span class="pill ${lb.cls}">${lb.text}</span></div>
        <div class="bar score-bar"><span class="num">${a.score}</span><div class="track"><div class="fill" style="width:${a.score}%"></div></div><span></span></div>
        <p class="faint">${esc(a.about)}</p>
        ${a.elements.length ? `<p class="muted">${a.elements.map(e => esc(e.note) + '.').join('<br>')}</p>` : ''}
        ${top.length ? `<div class="eyebrow good-eyebrow">What helps</div><ul class="syn-list">${top.map(aspLine).join('')}</ul>` : ''}
        ${low.length ? `<div class="eyebrow bad-eyebrow">What needs care</div><ul class="syn-list">${low.map(aspLine).join('')}</ul>` : ''}
        ${!top.length && !low.length ? '<p class="muted">No close contacts between the planets that describe this area. It is neutral: neither a strong pull nor a source of friction.</p>' : ''}
      </article>`;
    };
    const sim = r.similarity;
    const elBars = ['fire', 'earth', 'air', 'water'].map(k => `<div class="bar dual ${k}"><span>${C.ELEMENTS[k].name}</span>
      <div class="dual-tracks"><div class="track"><div class="fill" style="width:${Math.round(sim.mixA.el[k] * 100)}%"></div></div><div class="track b"><div class="fill" style="width:${Math.round(sim.mixB.el[k] * 100)}%"></div></div></div>
      <span class="num">${Math.round(sim.mixA.el[k] * 100)} / ${Math.round(sim.mixB.el[k] * 100)}</span></div>`).join('');
    const overlayList = (list, guest, host) => list.map(o => `<li><b>${esc(guest)}'s ${P(o.key).name}</b> in ${esc(host)}'s house ${o.house} (${C.HOUSES[o.house - 1].title.toLowerCase()}): ${esc(window.ChartCompat.OVERLAY_TEXT[o.house - 1])}</li>`).join('');
    const best = r.areas.slice().sort((x, y) => y.score - x.score);
    const ol = L2(r.overall);
    const dateTxt = i => `${new Date(i.date + 'T12:00:00Z').toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}${i.timeUnknown ? ', time unknown' : ', ' + i.time}${i.place ? ', ' + i.place : ''}`;
    const sign = (c, k) => E.signOf(c.points.find(p => p.key === k).lon).sign.name;
    $('#compat-report').innerHTML = `
      <div class="section report">
        <div class="print-only print-title"><span class="eyebrow">Compatibility report</span></div>
        <div class="card report-head">
          <div class="pair">
            <div><span class="eyebrow">Person A</span><h3>${esc(nA)}</h3><p class="faint">${esc(dateTxt(A))}</p><p class="muted">Sun ${sign(CA, 'sun')} · Moon ${sign(CA, 'moon')}${CA.noHouses ? '' : ' · Rising ' + sign(CA, 'asc')}</p></div>
            <div class="amp">&amp;</div>
            <div><span class="eyebrow">Person B</span><h3>${esc(nB)}</h3><p class="faint">${esc(dateTxt(B))}</p><p class="muted">Sun ${sign(CB, 'sun')} · Moon ${sign(CB, 'moon')}${CB.noHouses ? '' : ' · Rising ' + sign(CB, 'asc')}</p></div>
          </div>
          <div class="stat-row">
            <div class="stat"><b>${r.overall}<small>/100</small></b><span>Overall compatibility · <span class="pill ${ol.cls}">${ol.text}</span></span></div>
            <div class="stat"><b>${sim.score}<small>%</small></b><span>Chart similarity</span></div>
            <div class="stat"><b>${r.aspects.length}</b><span>Connections between the charts</span></div>
          </div>
          <p>Strongest area: <b>${esc(best[0].name.toLowerCase())}</b> (${best[0].score}). Area that needs the most care: <b>${esc(best[best.length - 1].name.toLowerCase())}</b> (${best[best.length - 1].score}).</p>
          ${A.timeUnknown || B.timeUnknown ? '<p class="note">At least one birth time is unknown, so rising signs and house overlays are left out and Moon contacts use tighter orbs.</p>' : ''}
        </div>

        <h3>Compatibility by area of life</h3>
        <div class="area-summary card">${r.areas.map(a => `<div class="bar"><span>${esc(a.name)}</span><div class="track"><div class="fill" style="width:${a.score}%"></div></div><span class="num">${a.score}</span></div>`).join('')}</div>
        <div class="grid-2 areas">${r.areas.map(areaCard).join('')}</div>

        <h3>Similarity</h3>
        <div class="grid-2">
          <div class="card">
            <div class="eyebrow">Element balance · ${esc(nA)} / ${esc(nB)}</div>
            <div class="bars" style="margin-top:10px">${elBars}</div>
            <p class="muted" style="margin-top:10px">Element mix is ${Math.round(sim.elementSim * 100)}% alike and modality mix is ${Math.round(sim.modeSim * 100)}% alike. ${esc(nA)} leans ${sim.topA[0]} and ${sim.topA[1]}; ${esc(nB)} leans ${sim.topB[0]} and ${sim.topB[1]}.
            ${sim.topA[0] === sim.topB[0] ? ' You share the same dominant element, so you tend to approach life in a similar way.' : COMPATIBLE_EL[sim.topA[0]] === sim.topB[0] ? ' Your dominant elements complement each other.' : ' Your dominant elements differ, which brings variety and some misunderstanding.'}</p>
          </div>
          <div class="card">
            <div class="eyebrow">Shared placements</div>
            ${sim.same.length ? `<ul class="syn-list">${sim.same.map(x => `<li><b>${P(x.key).name} in ${x.sign.name}</b> for both of you. ${esc(P(x.key).core)}</li>`).join('')}</ul>` : '<p class="muted" style="margin-top:6px">No personal planets in the same sign.</p>'}
            ${sim.sameElement.length ? `<p class="muted" style="margin-top:8px">Same element: ${sim.sameElement.map(x => `${P(x.key).name} (${x.element})`).join(', ')}.</p>` : ''}
            <p class="faint" style="margin-top:8px">Similarity is not the same as compatibility. Very similar charts understand each other easily, while different charts can complete each other.</p>
          </div>
        </div>

        ${r.overlaysBinA.length || r.overlaysAinB.length ? `<h3>How you land in each other's lives</h3>
        <p class="muted">Each person's planets fall into the other person's houses, showing which areas of life the other person activates.</p>
        <div class="grid-2">
          ${r.overlaysBinA.length ? `<div class="card"><div class="eyebrow">${esc(nB)} in ${esc(nA)}'s chart</div><ul class="syn-list">${overlayList(r.overlaysBinA, nB, nA)}</ul></div>` : ''}
          ${r.overlaysAinB.length ? `<div class="card"><div class="eyebrow">${esc(nA)} in ${esc(nB)}'s chart</div><ul class="syn-list">${overlayList(r.overlaysAinB, nA, nB)}</ul></div>` : ''}
        </div>` : ''}

        <h3>Every connection between the charts</h3>
        <div class="table-wrap"><table><thead><tr><th>${esc(nA)}</th><th>Aspect</th><th>${esc(nB)}</th><th>Orb</th></tr></thead><tbody>
          ${r.aspects.map(x => `<tr class="static"><td><span class="glyph">${esc(glyphOf(x.a))}</span>${esc(P(x.a).name)}</td><td><span class="asp-g ${['trine', 'sextile'].includes(x.aspect.key) ? 'flow' : ['square', 'opposition'].includes(x.aspect.key) ? 'tension' : 'blend'}">${x.aspect.glyph}${VS}</span> ${x.aspect.name}</td><td><span class="glyph">${esc(glyphOf(x.b))}</span>${esc(P(x.b).name)}</td><td class="num">${x.orb.toFixed(1)}°</td></tr>`).join('')}
        </tbody></table></div>
        <p class="faint">Scores combine the aspects between the two charts (closer aspects count more), element harmony between key placements, and weights for each area. Astrology describes tendencies, not destiny. Use this for reflection and conversation.</p>
      </div>`;
  }
  const COMPATIBLE_EL = { fire: 'air', air: 'fire', earth: 'water', water: 'earth' };

  function bindCompat() {
    const panel = $('#panel-compat');
    panel.addEventListener('change', e => {
      const t = e.target;
      if (t.classList.contains('load-select') && t.value !== '') {
        const src = t.value === 'current' ? state.input : store.get('saved', [])[+t.value];
        if (src) fillPerson(t.dataset.person, src);
        t.value = '';
      }
      const m = t.id && t.id.match(/^(pa|pb)-(place|unknown)$/);
      if (m && m[2] === 'place') {
        const c = CITY.CITIES.find(x => `${x.name}, ${x.country}`.toLowerCase() === t.value.trim().toLowerCase());
        if (c) { $(`#${m[1]}-lat`).value = c.lat; $(`#${m[1]}-lon`).value = c.lon; $(`#${m[1]}-tz`).value = c.tz; }
      }
      if (m && m[2] === 'unknown') $(`#${m[1]}-time`).disabled = t.checked;
    });
    panel.addEventListener('click', e => {
      if (e.target.id === 'compat-run') {
        const a = readPerson('pa', 'Person A'), b = readPerson('pb', 'Person B');
        const err = a.error || b.error;
        const el = $('#compat-error');
        if (err) { el.textContent = err; el.hidden = false; return; }
        el.hidden = true;
        state.compat.A = a.value; state.compat.B = b.value;
        delete state.compat.B.example;
        store.set('compatB', state.compat.B);
        runCompat(a.value, b.value);
        $('#compat-report').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (e.target.id === 'compat-swap') {
        const a = readPerson('pa', 'Person A'), b = readPerson('pb', 'Person B');
        if (a.value && b.value) { fillPerson('pa', b.value); fillPerson('pb', a.value); }
      }
      if (e.target.id === 'compat-print') printPanel();
    });
  }

  // Printing shows only the current tab's content, in light colours.
  function printPanel() {
    document.body.classList.add('printing', 'print-' + state.tab);
    const done = () => { document.body.classList.remove('printing', 'print-' + state.tab); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    try { window.print(); } catch (e) { /* print unavailable in this viewer */ }
    setTimeout(done, 1500);
  }

  // ---------- tabs ----------
  const RENDER = { guide: renderGuide, compat: renderCompat, reading: renderReading, learn: renderLearn, data: renderData, traits: renderTraits, signature: renderSignature, big3: renderBig3, timing: () => renderTiming(false), houses: renderHouses };

  function showTab(tab) {
    state.tab = tab;
    document.querySelectorAll('.tab').forEach(b => {
      const on = b.dataset.tab === tab;
      b.setAttribute('aria-selected', on);
      b.tabIndex = on ? 0 : -1;
    });
    document.querySelectorAll('.panel').forEach(p => { p.hidden = p.id !== 'panel-' + tab; });
    if (RENDER[tab]) RENDER[tab]();
    store.set('tab', tab);
  }

  function bindTabs() {
    const tabs = [...document.querySelectorAll('.tab')];
    tabs.forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
    $('.tabs').addEventListener('keydown', e => {
      const i = tabs.findIndex(t => t.dataset.tab === state.tab);
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        showTab(n.dataset.tab); n.focus();
      }
    });
    // Table rows and aspect cells jump back to the wheel with that item pinned.
    document.querySelector('main').addEventListener('click', e => {
      if (e.target.closest('#panel-chart')) return;
      const row = e.target.closest('[data-goto], [data-aspect], [data-house], [data-goto-point]');
      if (!row) return;
      if (row.dataset.goto || row.dataset.gotoPoint) { showTab('chart'); setActive({ kind: 'point', key: row.dataset.goto || row.dataset.gotoPoint }, true); }
      else if (row.dataset.aspect) { showTab('chart'); setActive({ kind: 'aspect', key: row.dataset.aspect }, true); }
      else if (row.dataset.house) { showTab('chart'); setActive({ kind: 'house', key: row.dataset.house }, true); }
    });
    document.querySelector('main').addEventListener('click', e => {
      const a = e.target.closest('[data-scroll]');
      if (a) { e.preventDefault(); document.getElementById(a.dataset.scroll)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    }, true);
    document.querySelector('main').addEventListener('change', e => {
      if (e.target.id === 'timing-date') renderTiming(true);
    });
    document.querySelector('main').addEventListener('click', e => {
      if (e.target.id === 'copy-csv') {
        const lines = ['point,sign,degree,longitude,house,retrograde'].concat(state.chart.points.map(p => `${P(p.key).name},${E.signOf(p.lon).sign.name},${E.fmtDeg(p.lon, false)},${p.lon.toFixed(4)},${p.house ?? ''},${p.retrograde ? 'yes' : 'no'}`));
        copyText(lines.join('\n'), 'Positions copied as CSV');
      }
      if (e.target.id === 'copy-json') {
        copyText(JSON.stringify({ input: state.input, houses: state.chart.houses, points: state.chart.points, aspects: state.aspects.map(a => ({ a: a.a, b: a.b, aspect: a.aspect.key, orb: +a.orb.toFixed(3) })) }, null, 2), 'Chart copied as JSON');
      }
    });
  }

  function copyText(text, msg) {
    const done = () => toast(msg);
    try {
      navigator.clipboard.writeText(text).then(done, () => fallbackCopy(text, msg));
    } catch (e) { fallbackCopy(text, msg); }
  }
  function fallbackCopy(text, msg) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
    ta.remove();
    toast(ok ? msg : 'Copy was blocked. Select the text manually.');
  }

  // ---------- customize ----------
  function syncCustomize() {
    const p = state.prefs;
    $('#opt-house').value = p.houseSystem;
    $('#opt-node').value = p.nodeType;
    $('#opt-lines').checked = p.lines;
    $('#opt-minor').checked = p.minor;
    $('#opt-orb').value = p.orbScale;
    $('#orb-val').textContent = '×' + (+p.orbScale).toFixed(1);
    document.querySelectorAll('[data-pt]').forEach(cb => { cb.checked = !!p.show[cb.dataset.pt]; });
    document.querySelectorAll('[data-glyph]').forEach(b => b.setAttribute('aria-pressed', b.dataset.glyph === p.glyphs));
  }

  function bindCustomize() {
    const btn = $('#toggle-customize');
    btn.addEventListener('click', () => {
      const open = $('#customize').hidden;
      $('#customize').hidden = !open;
      btn.setAttribute('aria-expanded', open);
      btn.setAttribute('aria-pressed', open);
    });
    const update = () => { store.set('prefs', state.prefs); refresh(); };
    $('#opt-house').addEventListener('change', e => { state.prefs.houseSystem = e.target.value; update(); });
    $('#opt-node').addEventListener('change', e => { state.prefs.nodeType = e.target.value; update(); });
    $('#opt-lines').addEventListener('change', e => { state.prefs.lines = e.target.checked; update(); });
    $('#opt-minor').addEventListener('change', e => { state.prefs.minor = e.target.checked; update(); });
    $('#opt-orb').addEventListener('input', e => { state.prefs.orbScale = +e.target.value; update(); });
    document.querySelectorAll('[data-pt]').forEach(cb => cb.addEventListener('change', () => { state.prefs.show[cb.dataset.pt] = cb.checked; update(); }));
    document.querySelectorAll('[data-glyph]').forEach(b => b.addEventListener('click', () => { state.prefs.glyphs = b.dataset.glyph; update(); }));
  }

  // ---------- birth data dialog ----------
  const TZS = (() => {
    try { if (Intl.supportedValuesOf) return Intl.supportedValuesOf('timeZone'); } catch (e) { /* older browser */ }
    return [...new Set(CITY.CITIES.map(c => c.tz))].sort();
  })();

  function fillForm(i) {
    $('#f-name').value = i.name || '';
    $('#f-date').value = i.date;
    $('#f-time').value = i.timeUnknown ? '' : i.time;
    $('#f-unknown').checked = !!i.timeUnknown;
    $('#f-time').disabled = !!i.timeUnknown;
    $('#f-place').value = i.place || '';
    $('#f-lat').value = i.lat;
    $('#f-lon').value = i.lon;
    $('#birth-title').textContent = i.date ? 'Birth data' : 'New chart';
    const sel = $('#f-tz');
    sel.innerHTML = `<option value="">Manual offset</option>` + TZS.map(z => `<option value="${z}">${z.replace(/_/g, ' ')}</option>`).join('');
    sel.value = TZS.includes(i.tz) ? i.tz : '';
    $('#f-offset').value = i.utcOffset;
    if (i.date) updateOffsetNote(); else $('#offset-note').textContent = 'Pick a city and the offset, including daylight saving time, is filled in for you.';
    $('#form-error').hidden = true;
    renderSaved();
  }

  function updateOffsetNote() {
    const tz = $('#f-tz').value;
    const note = $('#offset-note');
    if (!tz) { note.textContent = 'Using the UTC offset you entered. Remember daylight saving time if it applied.'; return; }
    const off = CITY.utcOffsetFor(tz, $('#f-date').value || '2000-01-01', $('#f-time').value || '12:00');
    if (off == null) { note.textContent = 'This browser cannot look up that time zone. Enter the offset manually.'; return; }
    $('#f-offset').value = off;
    note.textContent = `${tz.replace(/_/g, ' ')} was UTC${off >= 0 ? '+' : '−'}${Math.abs(off)} on that date, including any daylight saving time.`;
  }

  function readForm() {
    const name = $('#f-name').value.trim();
    const date = $('#f-date').value;
    const timeUnknown = $('#f-unknown').checked;
    const time = $('#f-time').value;
    const lat = parseFloat($('#f-lat').value);
    const lon = parseFloat($('#f-lon').value);
    const off = parseFloat($('#f-offset').value);
    if (!date) return { error: 'Enter a date of birth.' };
    if (!timeUnknown && !time) return { error: 'Enter a birth time, or tick "I don\'t know the birth time".' };
    if (!Number.isFinite(lat) || lat < -89.9 || lat > 89.9) return { error: 'Latitude must be between −89.9 and 89.9. Pick a city or type coordinates.' };
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) return { error: 'Longitude must be between −180 and 180.' };
    if (!Number.isFinite(off) || off < -14 || off > 14) return { error: 'UTC offset must be between −14 and 14 hours.' };
    const y = +date.slice(0, 4);
    if (y < 1800 || y > 2199) return { error: 'Dates between 1800 and 2199 are supported.' };
    return { value: { name, date, time: timeUnknown ? '12:00' : time, timeUnknown, place: $('#f-place').value.trim(), lat, lon, tz: $('#f-tz').value, utcOffset: off } };
  }

  let suggestIdx = -1, suggestions = [];
  function renderSuggest() {
    const list = $('#place-list');
    const input = $('#f-place');
    if (!suggestions.length) { list.hidden = true; input.setAttribute('aria-expanded', 'false'); return; }
    list.innerHTML = suggestions.map((c, i) => `<li role="option" id="opt-${i}" aria-selected="${i === suggestIdx}" data-i="${i}">${esc(c.name)}, <span class="faint">${esc(c.country)}</span></li>`).join('');
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    if (suggestIdx >= 0) input.setAttribute('aria-activedescendant', 'opt-' + suggestIdx); else input.removeAttribute('aria-activedescendant');
  }
  function pickCity(c) {
    $('#f-place').value = `${c.name}, ${c.country}`;
    $('#f-lat').value = c.lat;
    $('#f-lon').value = c.lon;
    $('#f-tz').value = c.tz;
    suggestions = []; suggestIdx = -1; renderSuggest();
    updateOffsetNote();
  }

  function renderSaved() {
    const saved = store.get('saved', []);
    $('#saved-list').innerHTML = saved.length
      ? saved.map((s, i) => `<div class="row"><span><b>${esc(s.name || 'Unnamed')}</b> <span class="faint">${esc(s.date)} ${s.timeUnknown ? '' : esc(s.time)} · ${esc(s.place || '')}</span></span><span class="actions"><button class="btn small" type="button" data-load="${i}">Open</button><button class="btn small" type="button" data-del="${i}">Remove</button></span></div>`).join('')
      : '<p class="faint">Charts you save appear here. They stay in this browser only.</p>';
  }

  function bindDialog() {
    const dlg = $('#birth-dialog');
    $('#edit-birth').addEventListener('click', () => { fillForm(state.input); dlg.showModal(); });
    $('#new-chart').addEventListener('click', () => { fillForm(EMPTY_INPUT); dlg.showModal(); $('#f-name').focus(); });
    $('#example-new').addEventListener('click', () => { fillForm(EMPTY_INPUT); dlg.showModal(); $('#f-name').focus(); });
    $('#close-dialog').addEventListener('click', () => dlg.close());
    $('#f-unknown').addEventListener('change', e => { $('#f-time').disabled = e.target.checked; });
    $('#f-tz').addEventListener('change', updateOffsetNote);
    $('#f-date').addEventListener('change', updateOffsetNote);
    $('#f-time').addEventListener('change', updateOffsetNote);
    $('#f-offset').addEventListener('input', () => { $('#f-tz').value = ''; $('#offset-note').textContent = 'Using the UTC offset you entered.'; });
    const place = $('#f-place');
    place.addEventListener('input', () => { suggestions = CITY.searchCities(place.value); suggestIdx = -1; renderSuggest(); });
    place.addEventListener('keydown', e => {
      if (!suggestions.length) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); suggestIdx = (suggestIdx + 1) % suggestions.length; renderSuggest(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); suggestIdx = (suggestIdx - 1 + suggestions.length) % suggestions.length; renderSuggest(); }
      else if (e.key === 'Enter' && suggestIdx >= 0) { e.preventDefault(); pickCity(suggestions[suggestIdx]); }
      else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); suggestions = []; renderSuggest(); }
    });
    $('#place-list').addEventListener('mousedown', e => {
      const li = e.target.closest('li');
      if (li) { e.preventDefault(); pickCity(suggestions[+li.dataset.i]); }
    });
    place.addEventListener('blur', () => setTimeout(() => { suggestions = []; renderSuggest(); }, 120));

    $('#birth-form').addEventListener('submit', e => {
      e.preventDefault();
      const r = readForm();
      if (r.error) { const el = $('#form-error'); el.textContent = r.error; el.hidden = false; return; }
      state.input = r.value;
      store.set('input', state.input);
      dlg.close();
      setActive(null, false);
      refresh();
      toast('Chart drawn');
    });

    $('#saved-list').addEventListener('click', e => {
      const saved = store.get('saved', []);
      const ld = e.target.closest('[data-load]'), dl = e.target.closest('[data-del]');
      if (ld) { fillForm(saved[+ld.dataset.load]); }
      if (dl) { saved.splice(+dl.dataset.del, 1); store.set('saved', saved); renderSaved(); }
    });
    $('#import-code').addEventListener('click', () => {
      try {
        const raw = $('#f-code').value.trim();
        const obj = JSON.parse(decodeURIComponent(escape(atob(raw))));
        if (!obj.date || obj.lat == null || obj.lon == null) throw new Error('bad');
        fillForm(Object.assign({}, EMPTY_INPUT, obj));
        toast('Code loaded. Check the details, then draw the chart.');
      } catch (err) {
        const el = $('#form-error'); el.textContent = 'That code could not be read. Copy it again with Copy chart code.'; el.hidden = false;
      }
    });

    $('#save-chart').addEventListener('click', () => {
      const saved = store.get('saved', []);
      const i = Object.assign({}, state.input); delete i.example;
      const idx = saved.findIndex(s => s.name === i.name && s.date === i.date && s.time === i.time);
      if (idx >= 0) saved[idx] = i; else saved.unshift(i);
      store.set('saved', saved.slice(0, 30));
      toast(`Saved ${i.name || 'chart'} in this browser`);
    });
    $('#copy-code').addEventListener('click', () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(state.input))));
      copyText(code, 'Chart code copied. Paste it under Edit birth data to reopen.');
    });
  }

  // ---------- boot ----------
  function refresh() {
    compute();
    renderHeader();
    syncCustomize();
    if (state.active && state.active.kind === 'aspect' && !state.aspects[+state.active.key]) state.active = null;
    if (state.active && state.active.kind === 'point' && !visibleKeys().includes(state.active.key)) state.active = null;
    renderWheel();
    renderDetail();
    if (state.tab !== 'chart' && RENDER[state.tab]) RENDER[state.tab]();
  }

  function boot() {
    if (!window.Astronomy) {
      document.querySelector('main').innerHTML = '<div class="card"><h2>The astronomy library did not load</h2><p class="muted">Check your internet connection and reload. The chart is calculated in your browser with astronomy-engine, loaded from cdn.jsdelivr.net.</p></div>';
      return;
    }
    bindWheel(); bindTabs(); bindCustomize(); bindDialog(); bindCompat(); bindGuide();
    $('main').addEventListener('click', e => { if (e.target.id === 'reading-print') printPanel(); });
    if (!window.matchMedia('(hover: hover)').matches) {
      $('#wheel-hint').textContent = 'Tap any symbol, sign or house number to read about it. Tap the centre to close.';
    }
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const w = $('#wheel').getBoundingClientRect().width;
        if (state.chart && w && Math.abs(w - (state.wheelWidth || 0)) > 24) renderWheel();
        renderDetail();
      }, 150);
    });
    try { refresh(); } catch (err) {
      console.error(err);
      state.input = EXAMPLE_INPUT; refresh();
    }
    const tab = location.hash.replace('#', '');
    showTab(RENDER[tab] || tab === 'chart' ? tab : store.get('tab', 'chart'));
  }

  boot();
})();
