// Kreislo 2D animation engine: everything is a pure function of time t (seconds), so every frame renders exactly.
// Needs logo.js (LOGO = letter paths, symbol K, icons). Scenes call K.* helpers and set window.renderFrame(t).
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var K = window.K = {};
  K.C = { ink: '#111111', orange: '#FF3300', paper: '#F7F5F2', white: '#FFFFFF', grey: '#CFCFCF', stone: '#6B6B6B', panel: '#1C1C1C' };
  K.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  K.lerp = function (a, b, p) { return a + (b - a) * p; };
  // progress of t between t0 and t1 (0..1)
  K.p = function (t, t0, t1) { return K.clamp((t - t0) / (t1 - t0), 0, 1); };
  K.ease = {
    out: function (x) { return 1 - Math.pow(1 - x, 3); },
    inOut: function (x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
    back: function (x) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
    in: function (x) { return x * x * x; }
  };
  K.el = function (tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs || {}) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  K.set = function (n, attrs) { for (var k in attrs) n.setAttribute(k, attrs[k]); return n; };

  // The Kreislo arrow ring, drawn up to `progress` (0..1) of its sweep, with the arrowhead at the growing end.
  // Geometry matches the logo: gap from -32° to 264°, arrowhead 0.92 x 1.12 stroke widths.
  K.RING = { g0: -32, g1: 264, headW: 0.92, headL: 1.12 };
  K.ringShapes = function (cx, cy, r, sw, progress) {
    var a0 = K.RING.g0 * Math.PI / 180, a1 = K.RING.g1 * Math.PI / 180;
    var sweep = (a1 - a0) * K.clamp(progress, 0.0001, 1), t1 = a0 + sweep;
    var p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)], p1 = [cx + r * Math.cos(t1), cy + r * Math.sin(t1)];
    var arc = 'M' + p0[0].toFixed(2) + ' ' + p0[1].toFixed(2) + 'A' + r + ' ' + r + ' 0 ' + (sweep > Math.PI ? 1 : 0) + ' 1 ' + p1[0].toFixed(2) + ' ' + p1[1].toFixed(2);
    var tx = -Math.sin(t1), ty = Math.cos(t1), nx = Math.cos(t1), ny = Math.sin(t1);
    var hw = sw * K.RING.headW, tip = sw * K.RING.headL;
    var head = 'M' + (p1[0] + nx * hw).toFixed(2) + ' ' + (p1[1] + ny * hw).toFixed(2) + 'L' + (p1[0] + tx * tip).toFixed(2) + ' ' + (p1[1] + ty * tip).toFixed(2) +
      'L' + (p1[0] - nx * hw).toFixed(2) + ' ' + (p1[1] - ny * hw).toFixed(2) + 'Z';
    return { arc: arc, head: head };
  };
  K.makeRing = function (parent, color) {
    var g = K.el('g', {}, parent);
    var arc = K.el('path', { fill: 'none', stroke: color || K.C.orange, 'stroke-linecap': 'butt' }, g);
    var head = K.el('path', { fill: color || K.C.orange }, g);
    return {
      g: g, update: function (cx, cy, r, sw, progress, headScale) {
        var s = K.ringShapes(cx, cy, r, sw * 1, progress);
        arc.setAttribute('d', s.arc); arc.setAttribute('stroke-width', sw);
        head.setAttribute('d', s.head);
        head.setAttribute('opacity', progress > 0.02 ? 1 : 0);
      }
    };
  };

  // The wordmark: 6 letters + the ring as the O. Logo units: cap height 100, baseline 130, ring centre (468.47, 80), r 40.5, stroke 19.
  K.WORD = { ringX: 468.47, ringY: 80, r: 40.5, sw: 19, left: 37.5, right: 518.5, top: 22, bottom: 131 };
  K.makeWordmark = function (parent, letterColor) {
    var g = K.el('g', {}, parent);
    var letters = LOGO.letters.map(function (L) {
      var lg = K.el('g', {}, g);
      var p = K.el('path', { d: L.d, fill: letterColor || K.C.white }, lg);
      return { g: lg, path: p };
    });
    var ringHolder = K.el('g', {}, g);
    var ring = K.makeRing(ringHolder);
    return { g: g, letters: letters, ringHolder: ringHolder, ring: ring };
  };
  K.icon = function (parent, name, x, y, size, color) {
    var g = K.el('g', { transform: 'translate(' + x + ',' + y + ') scale(' + (size / 24) + ')' }, parent);
    var stroke = LOGO.stroke.indexOf(name) > -1;
    K.el('path', stroke ? { d: LOGO.icons[name], fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }
      : { d: LOGO.icons[name], fill: color }, g);
    return g;
  };
  // Background: ink with a soft glow and a faint, slowly turning ring.
  K.makeBackground = function (svg, W, H) {
    var defs = K.el('defs', {}, svg);
    var rg = K.el('radialGradient', { id: 'kglow', cx: '50%', cy: '45%', r: '70%' }, defs);
    K.el('stop', { offset: '0', 'stop-color': '#2A2A2A' }, rg);
    K.el('stop', { offset: '1', 'stop-color': K.C.ink }, rg);
    K.el('rect', { width: W, height: H, fill: K.C.ink }, svg);
    var glow = K.el('rect', { width: W, height: H, fill: 'url(#kglow)', opacity: 0 }, svg);
    var big = K.makeRing(K.el('g', { opacity: 0.05 }, svg), K.C.white);
    return { defs: defs, glow: glow, big: big };
  };
  K.text = function (parent, str, attrs) {
    var n = K.el('text', attrs, parent);
    n.textContent = str;
    return n;
  };
  K.ready = function () { return document.fonts ? document.fonts.ready : Promise.resolve(); };
})();
