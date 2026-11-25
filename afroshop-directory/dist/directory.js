// Directory behaviour. Shops and events are ordinary Blogger posts with a details block
// (<div class="shop-info" ...> or <div class="event-info" ...>) at the top of the body.
// This script reads those blocks to power: the finder (search by product, city, near me),
// open-now status, shop and event pages (contact buttons, hours, structured data for Google),
// and the homepage feeds (featured shops, upcoming events). No dependencies.
(function () {
  'use strict';
  var doc = document;

  // ------------------------------------------------------------------ settings & words
  function readPairs(selector) {
    var out = {};
    var el = doc.querySelector(selector);
    if (!el) return out;
    var tmp = doc.createElement('div');
    tmp.innerHTML = el.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n');
    (tmp.textContent || '').split('\n').forEach(function (line) {
      var i = line.indexOf(':');
      if (i > 0) {
        var key = line.slice(0, i).trim();
        if (key) out[key] = line.slice(i + 1).trim();
      }
    });
    return out;
  }

  var S = readPairs('.dir-settings');
  var SET = {
    shop: S.shop_label || 'Shop',
    featured: S.featured_label || 'Featured',
    events: S.events_label || 'Events',
    listPage: S.list_page || '/p/list-your-shop.html',
    contactPage: S.contact_page || '/p/contact.html',
    lang: S.date_language || undefined,
    country: S.country || 'DE'
  };
  var WORDS = readPairs('.dir-words');
  function t(key) { return WORDS[key] || key; }

  // ------------------------------------------------------------------ languages
  // Each language is one hidden HTML gadget in Layout ("Language: Deutsch", ...). Its first line is
  // "lang: de", every other line is "English text = translation". The setting "languages: en, de, fr"
  // in Directory settings says which ones visitors can choose. The choice comes from ?lang=xx, then
  // the visitor's last choice, then their browser language, then the first language in the list.
  var LANGS = {
    en: { name: 'English', locale: 'en-GB' },
    de: { name: 'Deutsch', locale: 'de-DE' },
    fr: { name: 'Français', locale: 'fr-FR' },
    sw: { name: 'Kiswahili', locale: 'sw-KE' },
    am: { name: 'አማርኛ', locale: 'am-ET' },
    ti: { name: 'ትግርኛ', locale: 'ti-ER' }
  };
  var LANG_KEY = 'ak-lang';
  function readLangPacks() {
    var packs = {};
    var boxes = doc.querySelectorAll('.dir-lang');
    for (var i = 0; i < boxes.length; i++) {
      var tmp = doc.createElement('div');
      tmp.innerHTML = boxes[i].innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n');
      var code = '', words = {};
      (tmp.textContent || '').split('\n').forEach(function (line) {
        var m = /^\s*lang\s*:\s*([a-z]{2})\s*$/i.exec(line);
        if (m) { code = m[1].toLowerCase(); return; }
        var k = line.indexOf(' = ');
        if (k > 0) {
          var key = line.slice(0, k).replace(/\s+/g, ' ').trim();
          var val = line.slice(k + 3).trim();
          if (key && val) words[key] = val;
        }
      });
      if (code) packs[code] = words;
    }
    return packs;
  }
  var PACKS = readLangPacks();
  var ENABLED = list(S.languages || 'en').map(function (c) { return c.toLowerCase(); })
    .filter(function (c) { return LANGS[c] && (c === 'en' || PACKS[c]); });
  if (!ENABLED.length) ENABLED = ['en'];
  function pickLang() {
    var m = /[?&]lang=([a-z]{2})/i.exec(location.search);
    if (m && ENABLED.indexOf(m[1].toLowerCase()) > -1) {
      try { localStorage.setItem(LANG_KEY, m[1].toLowerCase()); } catch (e) {}
      return m[1].toLowerCase();
    }
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && ENABLED.indexOf(saved) > -1) return saved;
    } catch (e) {}
    var nav = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < nav.length; i++) {
      var c = String(nav[i] || '').slice(0, 2).toLowerCase();
      if (ENABLED.indexOf(c) > -1) return c;
    }
    return ENABLED[0];
  }
  var LANG = pickLang();
  // English keeps the optional "Site words" gadget (to rename English texts); other languages use their pack.
  if (LANG !== 'en') WORDS = PACKS[LANG] || {};
  SET.lang = LANGS[LANG].locale;
  SET.langCode = LANG;
  doc.documentElement.lang = LANG;
  doc.documentElement.setAttribute('data-lang', LANG);
  window.AK_T = t;

  // Fixed texts in the page itself (gadgets, menu, footer): swap exact matches.
  function trText(s) {
    var key = s.replace(/\s+/g, ' ').trim();
    if (!key) return null;
    if (WORDS[key]) return WORDS[key];
    var m = /^(.*\S)\s+(\d+)$/.exec(key);          // "Slide 2"
    if (m && WORDS[m[1]]) return WORDS[m[1]] + ' ' + m[2];
    return null;
  }
  var NO_TR = 'script, style, template, textarea, code, pre, .dir-admin, .entry-body, .post-body, .notranslate, .brand';
  function translateDom(root) {
    if (LANG === 'en') return;
    root = root || doc.body;
    var w = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    var n, todo = [];
    while ((n = w.nextNode())) {
      if (!/\S/.test(n.nodeValue)) continue;
      var p = n.parentElement;
      if (p && p.closest && p.closest(NO_TR)) continue;
      var tr = trText(n.nodeValue);
      if (tr) todo.push([n, tr]);
    }
    todo.forEach(function (x) {
      var v = x[0].nodeValue;
      x[0].nodeValue = v.match(/^\s*/)[0] + x[1] + v.match(/\s*$/)[0];
    });
    var attrs = ['placeholder', 'aria-label', 'title', 'alt'];
    var els = root.querySelectorAll('[placeholder], [aria-label], [title], img[alt]');
    for (var i = 0; i < els.length; i++) {
      if (els[i].closest(NO_TR)) continue;
      for (var a = 0; a < attrs.length; a++) {
        var v = els[i].getAttribute(attrs[a]);
        if (!v) continue;
        var tr = trText(v);
        if (tr) els[i].setAttribute(attrs[a], tr);
      }
    }
  }
  // Blog dates ("12 October 2026") in the chosen language.
  function localDates() {
    var dates = doc.querySelectorAll('time.js-date');
    for (var d = 0; d < dates.length; d++) {
      var when = new Date(dates[d].getAttribute('datetime'));
      if (!isNaN(when.getTime())) dates[d].textContent = when.toLocaleDateString(SET.lang, { year: 'numeric', month: 'long', day: 'numeric' });
    }
  }
  function langHref(c) {
    var q = location.search.replace(/^\?/, '').split('&').filter(function (x) { return x && !/^lang=/i.test(x); });
    q.push('lang=' + c);
    return location.pathname + '?' + q.join('&') + location.hash;
  }
  // The language button in the header (only when more than one language is switched on).
  function initLangSwitch() {
    if (ENABLED.length < 2) return;
    var inner = doc.querySelector('.header-inner');
    if (!inner || doc.querySelector('.lang-switch')) return;
    var box = el('div', 'lang-switch');
    var btn = el('button', 'lang-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', t('Language') + ': ' + LANGS[LANG].name);
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
    btn.appendChild(el('span', 'lang-code', LANG.toUpperCase()));
    var menu = el('ul', 'lang-menu');
    menu.hidden = true;
    ENABLED.forEach(function (c) {
      var li = el('li');
      var a = el('a', c === LANG ? 'is-current' : null, LANGS[c].name);
      a.lang = c;
      a.href = langHref(c);
      if (c === LANG) a.setAttribute('aria-current', 'true');
      a.addEventListener('click', function () { try { localStorage.setItem(LANG_KEY, c); } catch (e) {} });
      li.appendChild(a);
      menu.appendChild(li);
    });
    function close() { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.hidden = !menu.hidden;
      btn.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
    });
    doc.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    box.appendChild(btn);
    box.appendChild(menu);
    var before = inner.querySelector('.cart-btn') || inner.querySelector('.nav-toggle');
    inner.insertBefore(box, before || null);
  }
  // Run now, before the rest of the script reads category names and gadget titles from the page.
  translateDom();
  localDates();

  var DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var SCHEMA_DAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // ------------------------------------------------------------------ helpers
  function el(tag, cls, text) {
    var n = doc.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function norm(s) {
    s = String(s || '').toLowerCase();
    if (s.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return s.replace(/ß/g, 'ss').replace(/\s+/g, ' ').trim();
  }
  function list(s) {
    return String(s || '').split(/[,;|]/).map(function (x) { return x.trim(); }).filter(Boolean);
  }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (!u) return '';
    if (/^www\./i.test(u)) u = 'https://' + u;
    return /^https?:\/\//i.test(u) ? u : '';
  }
  function telUrl(phone) {
    var p = String(phone || '').replace(/[^\d+]/g, '');
    return p.length > 4 ? 'tel:' + p : '';
  }
  function waUrl(number, text) {
    var n = String(number || '').replace(/\D/g, '');
    if (!n) return '';
    if (n.indexOf('00') === 0) n = n.slice(2);
    else if (n.charAt(0) === '0') n = '49' + n.slice(1); // German national number
    return 'https://wa.me/' + n + (text ? '?text=' + encodeURIComponent(text) : '');
  }
  function mapsUrl(info) {
    if (info.lat && info.lng) return 'https://www.google.com/maps/dir/?api=1&destination=' + info.lat + ',' + info.lng;
    if (info.address) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(info.address);
    return '';
  }
  function labelFromHref(href) {
    var m = /\/search\/label\/([^?#]+)/.exec(href || '');
    if (!m) return '';
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch (e) { return m[1]; }
  }
  function labelUrl(label) { return '/search/label/' + encodeURIComponent(label); }
  function siteName() {
    var n = doc.querySelector('.brand-name') || doc.querySelector('.brand-logo img');
    return n ? (n.textContent || n.getAttribute('alt') || '').trim() : '';
  }
  var googleImage = /^https?:\/\/([a-z0-9-]+\.)*(googleusercontent\.com|blogspot\.com|ggpht\.com)\//i;
  function sizedImage(src) {
    if (!src || !googleImage.test(src)) return src;
    return src
      .replace(/\/s\d+(-[a-z]+)*\//i, '/w720-h405-c/')
      .replace(/\/w\d+-h\d+(-[a-z]+)*\//i, '/w720-h405-c/')
      .replace(/=s\d+(-[a-z]+)*$/i, '=w720-h405-c')
      .replace(/=w\d+-h\d+(-[a-z]+)*$/i, '=w720-h405-c');
  }
  function initials(title) {
    var words = String(title || '').replace(/[^A-Za-z0-9À-ɏ\s]/g, ' ').split(/\s+/).filter(Boolean);
    return words.slice(0, 2).map(function (w) { return w.charAt(0); }).join('').toUpperCase() || '•';
  }
  function storage(kind) {
    try { var s = window[kind]; var k = '__dir'; s.setItem(k, k); s.removeItem(k); return s; } catch (e) { return null; }
  }

  // Category and city names come from the homepage gadgets, so the owner edits them in one place.
  function linksIn(selector) {
    var out = [];
    var links = doc.querySelectorAll(selector + ' a');
    for (var i = 0; i < links.length; i++) {
      var label = labelFromHref(links[i].getAttribute('href'));
      if (label) out.push({ label: label, name: links[i].textContent.trim() || label });
    }
    return out;
  }
  var CITIES = linksIn('.js-cities');
  var STATES = linksIn('.js-states');
  // Big cities -> federal state, so a shop is found under its state even without a data-state
  // City → state code, latitude, longitude. Fills the state in the "Where?" list and places the dot on city tiles.
  var STATE_CODES = {BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern', NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen'};
  var CITY_GEO = {
    'berlin': 'BE 52.520 13.405',
    'hamburg': 'HH 53.551 9.994',
    'bremen': 'HB 53.079 8.802',
    'bremerhaven': 'HB 53.540 8.581',
    'munchen': 'BY 48.137 11.575',
    'nurnberg': 'BY 49.454 11.077',
    'augsburg': 'BY 48.371 10.898',
    'regensburg': 'BY 49.013 12.102',
    'wurzburg': 'BY 49.792 9.954',
    'ingolstadt': 'BY 48.766 11.426',
    'erlangen': 'BY 49.590 11.004',
    'furth': 'BY 49.477 10.989',
    'bamberg': 'BY 49.898 10.902',
    'stuttgart': 'BW 48.776 9.183',
    'mannheim': 'BW 49.487 8.466',
    'karlsruhe': 'BW 49.007 8.404',
    'freiburg': 'BW 47.999 7.842',
    'heidelberg': 'BW 49.399 8.672',
    'ulm': 'BW 48.401 9.987',
    'heilbronn': 'BW 49.142 9.219',
    'pforzheim': 'BW 48.892 8.694',
    'reutlingen': 'BW 48.491 9.204',
    'konstanz': 'BW 47.690 9.150',
    'frankfurt': 'HE 50.110 8.682',
    'frankfurt am main': 'HE 50.110 8.682',
    'wiesbaden': 'HE 50.078 8.240',
    'kassel': 'HE 51.312 9.480',
    'darmstadt': 'HE 49.873 8.651',
    'offenbach': 'HE 50.096 8.776',
    'offenbach am main': 'HE 50.096 8.776',
    'hanau': 'HE 50.133 8.917',
    'giessen': 'HE 50.584 8.678',
    'marburg': 'HE 50.810 8.771',
    'fulda': 'HE 50.551 9.676',
    'koln': 'NW 50.938 6.960',
    'dusseldorf': 'NW 51.227 6.774',
    'dortmund': 'NW 51.514 7.468',
    'essen': 'NW 51.456 7.012',
    'duisburg': 'NW 51.435 6.762',
    'bochum': 'NW 51.482 7.216',
    'wuppertal': 'NW 51.256 7.151',
    'bielefeld': 'NW 52.021 8.532',
    'bonn': 'NW 50.737 7.098',
    'munster': 'NW 51.961 7.626',
    'aachen': 'NW 50.776 6.084',
    'gelsenkirchen': 'NW 51.518 7.086',
    'monchengladbach': 'NW 51.180 6.443',
    'krefeld': 'NW 51.339 6.586',
    'oberhausen': 'NW 51.470 6.852',
    'hagen': 'NW 51.367 7.463',
    'hamm': 'NW 51.681 7.817',
    'leverkusen': 'NW 51.046 7.019',
    'solingen': 'NW 51.171 7.083',
    'paderborn': 'NW 51.719 8.755',
    'siegen': 'NW 50.874 8.024',
    'neuss': 'NW 51.198 6.692',
    'hannover': 'NI 52.376 9.732',
    'braunschweig': 'NI 52.269 10.521',
    'oldenburg': 'NI 53.144 8.214',
    'osnabruck': 'NI 52.279 8.047',
    'wolfsburg': 'NI 52.423 10.787',
    'gottingen': 'NI 51.541 9.916',
    'hildesheim': 'NI 52.154 9.957',
    'salzgitter': 'NI 52.154 10.333',
    'leipzig': 'SN 51.340 12.375',
    'dresden': 'SN 51.050 13.738',
    'chemnitz': 'SN 50.828 12.921',
    'zwickau': 'SN 50.718 12.496',
    'halle': 'ST 51.482 11.970',
    'halle (saale)': 'ST 51.482 11.970',
    'magdeburg': 'ST 52.120 11.628',
    'dessau': 'ST 51.835 12.246',
    'erfurt': 'TH 50.978 11.029',
    'jena': 'TH 50.927 11.589',
    'gera': 'TH 50.880 12.083',
    'weimar': 'TH 50.979 11.329',
    'potsdam': 'BB 52.391 13.064',
    'cottbus': 'BB 51.756 14.333',
    'frankfurt (oder)': 'BB 52.347 14.551',
    'rostock': 'MV 54.092 12.099',
    'schwerin': 'MV 53.635 11.401',
    'greifswald': 'MV 54.096 13.378',
    'kiel': 'SH 54.323 10.123',
    'lubeck': 'SH 53.866 10.687',
    'flensburg': 'SH 54.794 9.437',
    'neumunster': 'SH 54.074 9.984',
    'mainz': 'RP 49.993 8.247',
    'ludwigshafen': 'RP 49.477 8.445',
    'koblenz': 'RP 50.356 7.594',
    'trier': 'RP 49.750 6.637',
    'kaiserslautern': 'RP 49.444 7.769',
    'saarbrucken': 'SL 49.240 6.997'
  };
  function cityGeo(city) {
    var c = norm(city);
    var g = CITY_GEO[c] || CITY_GEO[c.split(' ')[0]];
    if (!g) return null;
    g = g.split(' ');
    return { state: STATE_CODES[g[0]], lat: +g[1], lng: +g[2] };
  }
  function stateOf(info) {
    if (!info) return '';
    if (info.state) return info.state;
    var g = cityGeo(info.city);
    return g ? g.state : '';
  }
  var CATEGORIES = linksIn('.js-categories');
  function findIn(arr, label) {
    var n = norm(label);
    for (var i = 0; i < arr.length; i++) if (norm(arr[i].label) === n) return arr[i];
    return null;
  }
  function sameCity(a, b) {
    a = norm(a); b = norm(b);
    if (!a || !b) return false;
    return a === b || a.indexOf(b + ' ') === 0 || b.indexOf(a + ' ') === 0;
  }

  // ------------------------------------------------------------------ reading details blocks
  function readBlock(root) {
    if (!root || !root.querySelector) return null;
    var b = root.querySelector('.shop-info');
    if (b) {
      return {
        type: 'shop',
        city: b.getAttribute('data-city') || '',
        state: b.getAttribute('data-state') || '',
        address: b.getAttribute('data-address') || '',
        lat: parseFloat(b.getAttribute('data-lat')) || 0,
        lng: parseFloat(b.getAttribute('data-lng')) || 0,
        phone: b.getAttribute('data-phone') || '',
        whatsapp: b.getAttribute('data-whatsapp') || '',
        hours: b.getAttribute('data-hours') || '',
        sells: list(b.getAttribute('data-sells')),
        origin: list(b.getAttribute('data-origin')),
        services: list(b.getAttribute('data-services')),
        website: safeUrl(b.getAttribute('data-website')),
        instagram: b.getAttribute('data-instagram') || '',
        email: b.getAttribute('data-email') || ''
      };
    }
    b = root.querySelector('.product-info');
    if (b) return readProduct(b);
    b = root.querySelector('.event-info');
    if (b) {
      return {
        type: 'event',
        date: b.getAttribute('data-date') || '',
        time: b.getAttribute('data-time') || '',
        place: b.getAttribute('data-place') || '',
        city: b.getAttribute('data-city') || '',
        price: b.getAttribute('data-price') || '',
        register: safeUrl(b.getAttribute('data-register'))
      };
    }
    return null;
  }
  function htmlRoot(html) {
    var d = doc.implementation.createHTMLDocument('');
    d.body.innerHTML = html || ''; // inert document: no scripts run, no images load
    return d.body;
  }
  function firstImage(root) {
    var img = root && root.querySelector('img');
    return img ? img.getAttribute('src') || '' : '';
  }

  // ------------------------------------------------------------------ opening hours
  var DAY_KEYS = { mo: 0, tu: 1, di: 1, we: 2, mi: 2, th: 3, do: 3, fr: 4, sa: 5, su: 6, so: 6 };
  function minutes(s) {
    var m = /^(\d{1,2})(?:[:.](\d{2}))?$/.exec(s.trim());
    if (!m) return null;
    var h = +m[1], mm = +(m[2] || 0);
    if (h > 24 || mm > 59) return null;
    return h * 60 + mm;
  }
  // "Mo-Fr 10:00-20:00; Sa 09:00-18:00; So closed"  (English or German day names)
  function parseHours(str) {
    if (!str) return null;
    var week = [[], [], [], [], [], [], []];
    var any = false;
    str.split(/[;\n]/).forEach(function (seg) {
      var m = /^\s*([A-Za-z]{2}[a-z]*\.?(?:\s*[-–,]\s*[A-Za-z]{2}[a-z]*\.?)*)\s*:?\s+(.+)$/.exec(seg);
      if (!m) return;
      var days = [];
      m[1].split(',').forEach(function (part) {
        var r = part.split(/[-–]/).map(function (d) { return DAY_KEYS[d.trim().slice(0, 2).toLowerCase()]; });
        if (r[0] == null) return;
        if (r.length === 1 || r[1] == null) { days.push(r[0]); return; }
        for (var d = r[0], n = 0; n < 7; d = (d + 1) % 7, n++) { days.push(d); if (d === r[1]) break; }
      });
      if (/closed|geschlossen|ferm/i.test(m[2])) { any = any || days.length > 0; return; }
      m[2].split(/[,&]|\s+und\s+|\s+and\s+/).forEach(function (range) {
        var p = range.split(/\s*[-–]\s*/);
        if (p.length !== 2) return;
        var a = minutes(p[0]), b = minutes(p[1]);
        if (a == null || b == null) return;
        if (b <= a) b = 24 * 60;
        days.forEach(function (d) { week[d].push([a, b]); any = true; });
      });
    });
    return any ? week : null;
  }
  function berlinNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Berlin', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var o = {};
      parts.forEach(function (p) { o[p.type] = p.value; });
      return { day: DAY_SHORT.indexOf(o.weekday), min: (+o.hour % 24) * 60 + (+o.minute) };
    } catch (e) {
      var d = new Date();
      return { day: (d.getDay() + 6) % 7, min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function hhmm(min) {
    var h = Math.floor(min / 60) % 24, m = min % 60;
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }
  function openStatus(week) {
    if (!week) return null;
    var now = berlinNow();
    if (now.day < 0) return null;
    var today = week[now.day];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) {
        return { open: true, text: t('Open now') + ' · ' + t('until') + ' ' + hhmm(today[i][1]) };
      }
    }
    for (var n = 0; n < 7; n++) {
      var d = (now.day + n) % 7;
      var ranges = week[d].slice().sort(function (a, b) { return a[0] - b[0]; });
      for (var j = 0; j < ranges.length; j++) {
        if (n > 0 || ranges[j][0] > now.min) {
          var when = n === 0 ? t('today') : n === 1 ? t('tomorrow') : t(DAY_SHORT[d]);
          return { open: false, text: t('Closed') + ' · ' + t('opens') + ' ' + when + ' ' + hhmm(ranges[j][0]) };
        }
      }
    }
    return { open: false, text: t('Closed') };
  }
  function statusNode(week) {
    var st = openStatus(week);
    if (!st) return null;
    return el('span', 'status ' + (st.open ? 'is-open' : 'is-closed'), st.text);
  }

  // ------------------------------------------------------------------ distance
  function km(a, b) {
    var R = 6371, rad = Math.PI / 180;
    var dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function kmText(d) {
    return (d < 10 ? d.toFixed(1) : Math.round(d)) + ' km';
  }

  // ------------------------------------------------------------------ cards
  function specialLabel(l) {
    var n = norm(l);
    return n === norm(SET.shop) || n === norm(SET.featured) || n === norm(SET.events);
  }
  function kickerFor(item) {
    var out = [];
    var cat = null;
    for (var i = 0; i < item.labels.length && !cat; i++) cat = findIn(CATEGORIES, item.labels[i]);
    if (cat) out.push(cat.label);
    else {
      for (var j = 0; j < item.labels.length; j++) {
        var l = item.labels[j];
        if (!specialLabel(l) && !findIn(CITIES, l) && !sameCity(l, item.info && item.info.city)) { out.push(l); break; }
      }
    }
    if (item.info && item.info.city) out.push(item.info.city);
    else {
      for (var k = 0; k < item.labels.length; k++) if (findIn(CITIES, item.labels[k])) { out.push(item.labels[k]); break; }
    }
    return out;
  }
  function isFeatured(item) {
    for (var i = 0; i < item.labels.length; i++) if (norm(item.labels[i]) === norm(SET.featured)) return true;
    return false;
  }
  function eventDate(info) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(info && info.date || '');
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }

  // Build a card skeleton like the theme's own (used for feed and search results)
  function buildCard(item) {
    var a = el('article', 'dcard');
    var media = el('a', 'dcard-media');
    media.href = item.url;
    media.setAttribute('aria-hidden', 'true');
    media.tabIndex = -1;
    if (item.img) {
      var img = el('img');
      img.src = sizedImage(item.img);
      img.alt = '';
      img.loading = 'lazy';
      media.appendChild(img);
    } else {
      media.appendChild(el('span', 'dcard-ph'));
    }
    a.appendChild(media);
    var body = el('div', 'dcard-body');
    body.appendChild(el('p', 'dcard-kicker'));
    var h = el('h3', 'dcard-title');
    var link = el('a', null, item.title);
    link.href = item.url;
    h.appendChild(link);
    body.appendChild(h);
    body.appendChild(el('p', 'dcard-meta'));
    body.appendChild(el('div', 'dcard-extra'));
    a.appendChild(body);
    enhanceCard(a, item);
    return a;
  }

  // Fill a card with shop or event details. opts: { match: [tokens], distance: km }
  function enhanceCard(card, item, opts) {
    opts = opts || {};
    var info = item.info;
    var kicker = card.querySelector('.dcard-kicker');
    var meta = card.querySelector('.dcard-meta');
    var extra = card.querySelector('.dcard-extra');
    var media = card.querySelector('.dcard-media');
    var ph = card.querySelector('.dcard-ph');
    if (ph) { ph.className = 'dcard-initials tone-' + (Math.abs(hash(item.title || '')) % 4); ph.textContent = initials(item.title); }

    if (kicker) {
      var server = kicker.querySelectorAll('.dcard-label');
      var want = kickerFor(item);
      if (server.length) {
        // theme-rendered card: reveal only the category and city labels
        for (var i = 0; i < server.length; i++) {
          var lab = server[i].getAttribute('data-label');
          if (want.indexOf(lab) >= 0 || (info && sameCity(lab, info.city))) {
            server[i].classList.add('is-shown');
            server[i].textContent = t(server[i].textContent.trim());   // label names can be translated too
          }
        }
        if (!kicker.querySelector('.is-shown') && info && info.city) {
          var c = el('span', 'dcard-label is-shown', info.city);
          kicker.appendChild(c);
        }
      } else {
        want.forEach(function (w) { kicker.appendChild(el('span', 'dcard-label is-shown', t(w))); });
      }
    }
    if (!info) { if (item.snippet && extra && !extra.textContent) extra.appendChild(el('p', 'dcard-snippet', item.snippet + '…')); return; }
    card.classList.add('is-rich', 'is-' + info.type);
    if (info.type === 'product') { productCard(card, item, opts); return; }

    if (info.type === 'event') {
      var d = eventDate(info);
      if (d && media) {
        var badge = el('span', 'dcard-date');
        badge.appendChild(el('b', null, String(d.getDate())));
        badge.appendChild(el('span', null, d.toLocaleDateString(SET.lang, { month: 'short' }).replace('.', '')));
        media.appendChild(badge);
      }
      if (meta) {
        meta.textContent = '';
        var bits = [];
        if (d) bits.push(d.toLocaleDateString(SET.lang, { weekday: 'short', day: 'numeric', month: 'long' }));
        if (info.time) bits.push(info.time);
        if (info.city || info.place) bits.push(info.city || info.place);
        meta.appendChild(el('span', null, bits.join(' · ')));
      }
      if (extra && info.price) extra.appendChild(el('p', 'dcard-meta', info.price));
      return;
    }

    // shop
    if (isFeatured(item) && media && !media.querySelector('.dcard-flag')) media.appendChild(el('span', 'dcard-flag', t('Featured')));
    if (meta) {
      meta.textContent = '';
      var st = statusNode(parseHours(info.hours));
      if (st) meta.appendChild(st);
      if (opts.distance != null) meta.appendChild(el('span', 'distance', kmText(opts.distance)));
    }
    if (!extra) return;
    extra.textContent = '';
    if (info.sells.length) {
      var match = opts.match || [];
      var chips = el('ul', 'chips');
      var sorted = info.sells.slice().sort(function (a, b) { return matches(b, match) - matches(a, match); });
      sorted.slice(0, 6).forEach(function (s) {
        chips.appendChild(el('li', matches(s, match) ? 'is-match' : '', s));
      });
      if (info.sells.length > 6) chips.appendChild(el('li', '', '+' + (info.sells.length - 6)));
      extra.appendChild(chips);
    }
    var actions = el('div', 'dcard-actions');
    var tel = telUrl(info.phone);
    if (tel) { var call = el('a', 'btn btn-call btn-sm', t('Call')); call.href = tel; actions.appendChild(call); }
    var wa = waUrl(info.whatsapp, t('Hello, I found your shop on') + ' ' + siteName() + '.');
    if (wa) { var w = el('a', 'btn btn-whatsapp btn-sm', 'WhatsApp'); w.href = wa; w.target = '_blank'; w.rel = 'noopener'; actions.appendChild(w); }
    if (actions.children.length) extra.appendChild(actions);
  }
  function matches(text, tokens) {
    var n = norm(text);
    for (var i = 0; i < tokens.length; i++) if (n.indexOf(tokens[i]) >= 0) return 1;
    return 0;
  }

  // Theme-rendered cards on list pages: details come from the inert <template>
  function enhanceListCards() {
    var cards = doc.querySelectorAll('.page-main .dcard');
    for (var i = 0; i < cards.length; i++) {
      var tpl = cards[i].querySelector('template.dcard-src');
      var root = tpl && tpl.content ? tpl.content : htmlRoot(tpl ? tpl.innerHTML : '');
      var labels = [];
      var ls = cards[i].querySelectorAll('.dcard-label');
      for (var j = 0; j < ls.length; j++) labels.push(ls[j].getAttribute('data-label'));
      var titleLink = cards[i].querySelector('.dcard-title a');
      var media0 = cards[i].querySelector('.dcard-media img');
      enhanceCard(cards[i], {
        id: cards[i].getAttribute('data-id') || '',
        img: media0 ? media0.getAttribute('src') : '',
        title: titleLink ? titleLink.textContent : '',
        url: cards[i].getAttribute('data-url') || '',
        labels: labels,
        info: readBlock(root)
      });
      if (tpl) tpl.parentNode.removeChild(tpl);
    }
  }

  // ------------------------------------------------------------------ feeds
  function fetchFeed(label, max, start) {
    // Preview pages answer feed requests with demo entries in Blogger's feed format
    if (typeof window.DIR_DEMO_FEED === 'function') return Promise.resolve(window.DIR_DEMO_FEED(label, max, start || 1).map(fromEntry));
    var url = '/feeds/posts/default' + (label ? '/-/' + encodeURIComponent(label) : '') +
      '?alt=json&max-results=' + (max || 25) + '&start-index=' + (start || 1);
    return fetch(url, { credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : {}; })
      .then(function (json) { return ((json.feed || {}).entry || []).map(fromEntry); })
      .catch(function () { return []; });
  }
  function fromEntry(e) {
    var link = (e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0];
    var root = htmlRoot((e.content || e.summary || {}).$t || '');
    var info = readBlock(root);
    var thumb = e.media$thumbnail ? e.media$thumbnail.url : '';
    var item = {
      id: (/post-(\d+)/.exec((e.id || {}).$t || '') || [])[1] || '',
      date: (e.published || {}).$t || '',
      snippet: '',
      title: (e.title || {}).$t || '',
      url: link ? link.href : '#',
      labels: (e.category || []).map(function (c) { return c.term; }),
      img: thumb || firstImage(root),
      info: info,
      text: ''
    };
    if (info && info.type === 'shop') {
      var block = root.querySelector('.shop-info');
      if (block) block.parentNode.removeChild(block);
      item.text = norm([item.title, info.sells.join(' '), info.origin.join(' '), info.services.join(' '),
        item.labels.join(' '), info.city, (root.textContent || '').slice(0, 1500)].join(' '));
      item.sellsText = norm(info.sells.join(' | '));
    }
    if (!info) item.snippet = (root.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 140);
    return item;
  }

  // All shops (for search). Cached for 20 minutes in the visitor's own browser.
  var shopsPromise = null;
  function loadShops() {
    if (shopsPromise) return shopsPromise;
    var store = storage('sessionStorage');
    var KEY = 'dir-shops-v1';
    if (store) {
      try {
        var cached = JSON.parse(store.getItem(KEY) || 'null');
        if (cached && Date.now() - cached.at < 20 * 60 * 1000) return (shopsPromise = Promise.resolve(cached.items));
      } catch (e) { /* ignore */ }
    }
    var PAGE = 150, MAX = 1500, all = [];
    function page(start) {
      return fetchFeed(SET.shop, PAGE, start).then(function (items) {
        all = all.concat(items);
        if (items.length === PAGE && all.length < MAX) return page(start + PAGE);
        return all;
      });
    }
    shopsPromise = page(1).then(function (items) {
      items = items.filter(function (i) { return i.info && i.info.type === 'shop'; });
      if (store) { try { store.setItem(KEY, JSON.stringify({ at: Date.now(), items: items })); } catch (e) { /* full */ } }
      return items;
    });
    return shopsPromise;
  }

  // ------------------------------------------------------------------ finder
  function initFinder() {
    var form = doc.getElementById('finder');
    if (!form) return;
    var q = doc.getElementById('finder-q');
    var city = doc.getElementById('finder-city');
    var near = doc.getElementById('finder-near');
    var box = doc.getElementById('finder-results');
    var title = doc.getElementById('finder-title');
    var status = doc.getElementById('finder-status');
    var listEl = doc.getElementById('finder-list');
    var clear = doc.getElementById('finder-clear');
    var here = null;

    // Finder words can be translated in the Site words gadget like every other word
    var wordOf = function (sel, key, attr) {
      var n = form.querySelector(sel) || doc.querySelector(sel);
      if (!n || !WORDS[key]) return;
      if (attr) n.setAttribute(attr, WORDS[key]); else n.textContent = WORDS[key];
    };
    wordOf('label[for=finder-q]', 'What are you looking for?');
    wordOf('label[for=finder-city]', 'Where?');
    wordOf('#finder-q', 'Search example', 'placeholder');
    wordOf('#finder-city option', 'All of Germany');
    wordOf('#finder-near span', 'Near me');
    wordOf('.finder-go span', 'Search');
    wordOf('#finder-clear', 'Clear search');

    function addGroup(label, items, prefix) {
      if (!items.length) return;
      var g = doc.createElement('optgroup');
      g.label = t(label);
      items.forEach(function (c) {
        var o = el('option', null, c.name);
        o.value = prefix + c.label;
        g.appendChild(o);
      });
      city.appendChild(g);
    }
    addGroup('Cities', CITIES, 'c|');
    addGroup('States', STATES, 's|');
    function where() {
      var v = city.value || '';
      return v ? { kind: v.charAt(0), label: v.slice(2) } : null;
    }
    function whereName(w) {
      var hit = findIn(w.kind === 's' ? STATES : CITIES, w.label);
      return hit ? hit.name : w.label;
    }
    function selectWhere(kind, label) {
      var list = kind === 's' ? STATES : CITIES;
      var hit = findIn(list, label);
      if (hit) { city.value = kind + '|' + hit.label; return true; }
      return false;
    }
    // On a city or state page, preselect it
    var pageLabel = labelFromHref(location.pathname);
    if (pageLabel) selectWhere('c', pageLabel) || selectWhere('s', pageLabel);

    function setNear(on) {
      near.classList.toggle('is-on', !!on);
      near.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    setNear(false);

    near.addEventListener('click', function () {
      if (here) { here = null; setNear(false); run(); return; }
      if (!navigator.geolocation) { show(t('Your browser cannot share its location. Choose a city instead.')); return; }
      near.disabled = true;
      show(t('Finding your location...'));
      navigator.geolocation.getCurrentPosition(function (pos) {
        near.disabled = false;
        here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setNear(true);
        city.value = '';
        run();
      }, function () {
        near.disabled = false;
        show(t('Location was not shared. Choose a city instead.'));
      }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 });
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); run(true); });
    city.addEventListener('change', function () { if (city.value) { here = null; setNear(false); } run(); });
    clear.addEventListener('click', function () {
      q.value = ''; city.value = ''; here = null; setNear(false);
      box.hidden = true;
      writeHash();
      q.focus();
    });

    function show(msg) {
      box.hidden = false;
      status.textContent = msg;
    }
    function writeHash() {
      var parts = [];
      if (q.value.trim()) parts.push('q=' + encodeURIComponent(q.value.trim()));
      var w0 = where();
      if (w0) parts.push((w0.kind === 's' ? 'state=' : 'city=') + encodeURIComponent(w0.label));
      var hash = parts.length ? '#find?' + parts.join('&') : '';
      if (history.replaceState) history.replaceState(null, '', location.pathname + location.search + hash);
    }

    var runId = 0;
    function run(scroll) {
      var text = q.value.trim();
      if (!text && !city.value && !here) { box.hidden = true; writeHash(); return; }
      writeHash();
      var id = ++runId;
      show(t('Searching...'));
      listEl.textContent = '';
      title.textContent = text ? t('Shops selling') + ' “' + text + '”' : t('Shops');
      var w1 = where();
      if (w1) title.textContent += ' ' + t('in') + ' ' + whereName(w1);
      else if (here) title.textContent += ' ' + t('near you');
      if (scroll) box.scrollIntoView({ behavior: 'smooth', block: 'start' });

      loadShops().then(function (shops) {
        if (id !== runId) return;
        var tokens = norm(text).split(' ').filter(function (x) { return x.length > 1; });
        var stems = tokens.map(function (x) { return x.length > 4 ? x.replace(/(es|s|n)$/, '') : x; });
        var results = [];
        shops.forEach(function (s) {
          var score = 0;
          for (var i = 0; i < stems.length; i++) {
            if (s.sellsText && s.sellsText.indexOf(stems[i]) >= 0) score += 3;
            else if (s.text.indexOf(stems[i]) >= 0) score += 1;
            else { score = -1; break; } // every word must match somewhere
          }
          if (score < 0) return;
          var w = where();
          if (w) {
            var byLabel = s.labels.some(function (l) { return norm(l) === norm(w.label); });
            var inside = w.kind === 's' ? (byLabel || norm(stateOf(s.info)) === norm(w.label)) : (byLabel || sameCity(s.info.city, w.label));
            if (!inside) return;
          }
          var dist = null;
          if (here && s.info.lat && s.info.lng) dist = km(here, s.info);
          if (here && dist == null) return;
          results.push({ s: s, score: score + (isFeatured(s) ? 0.5 : 0), dist: dist });
        });
        results.sort(function (a, b) {
          if (here) return a.dist - b.dist;
          return b.score - a.score || a.s.title.localeCompare(b.s.title);
        });
        render(results, stems);
      });
    }

    function render(results, stems) {
      listEl.textContent = '';
      if (!results.length) {
        status.textContent = t('No shops found. Try another word or a nearby city.');
        return;
      }
      status.textContent = results.length + ' ' + (results.length === 1 ? t('shop found') : t('shops found'));
      var shown = 0;
      function more() {
        results.slice(shown, shown + 18).forEach(function (r) {
          var card = buildCard(r.s);
          enhanceCard(card, r.s, { match: stems, distance: r.dist });
          listEl.appendChild(card);
        });
        shown += 18;
        var old = box.querySelector('.finder-more');
        if (old) old.parentNode.removeChild(old);
        if (shown < results.length) {
          var b = el('button', 'btn btn-ghost finder-more', t('Show more'));
          b.type = 'button';
          b.style.marginTop = '18px';
          b.addEventListener('click', more);
          listEl.parentNode.appendChild(b);
        }
      }
      more();
    }

    // Links like /#find?q=egusi&city=Berlin (used by the "We sell" chips on shop pages)
    function fromHash() {
      var m = /^#find\?(.*)$/.exec(location.hash);
      if (!m) return;
      m[1].split('&').forEach(function (p) {
        var kv = p.split('=');
        var v = '';
        try { v = decodeURIComponent((kv[1] || '').replace(/\+/g, ' ')); } catch (e) { v = kv[1] || ''; }
        if (kv[0] === 'q') q.value = v;
        if (kv[0] === 'city') { if (!selectWhere('c', v)) selectWhere('s', v); }
        if (kv[0] === 'state') selectWhere('s', v);
      });
      run(true);
    }
    fromHash();
    window.addEventListener('hashchange', fromHash);
  }

  // ------------------------------------------------------------------ homepage feeds
  function initFeeds() {
    var blocks = doc.querySelectorAll('.block-feed');
    for (var i = 0; i < blocks.length; i++) (function (block) {
      var kind = block.getAttribute('data-feed');
      var max = parseInt(block.getAttribute('data-max'), 10) || 6;
      var label = kind === 'events' ? SET.events : SET.featured;
      var listEl = block.querySelector('.js-feed-list');
      var moreLink = block.querySelector('.js-feed-more');
      if (moreLink) moreLink.href = labelUrl(label);
      // Only load when the block is about to be seen (the homepage blocks are hidden elsewhere)
      if (!block.offsetParent && block.getClientRects().length === 0) return;
      fetchFeed(label, kind === 'events' ? 50 : max, 1).then(function (items) {
        if (kind === 'events') {
          var today = new Date(); today.setHours(0, 0, 0, 0);
          items = items.filter(function (it) {
            var d = it.info && it.info.type === 'event' && eventDate(it.info);
            return d && d >= today;
          }).sort(function (a, b) { return eventDate(a.info) - eventDate(b.info); });
        }
        items = items.slice(0, max);
        if (!items.length) { block.classList.add('is-empty'); return; }
        items.forEach(function (it) { listEl.appendChild(buildCard(it)); });
      });
    })(blocks[i]);
  }

  // ------------------------------------------------------------------ single post (shop or event)
  function fact(icon, content) {
    var row = el('div');
    var dt = el('dt');
    dt.innerHTML = icon; // fixed SVG strings defined below, never blog text
    row.appendChild(dt);
    var dd = el('dd');
    if (typeof content === 'string') dd.textContent = content; else dd.appendChild(content);
    row.appendChild(dd);
    return row;
  }
  var ICON = {
    pin: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s7-7.2 7-12a7 7 0 0 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    phone: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>',
    globe: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/></svg>',
    flag: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22V4M4 4h13l-2 4 2 4H4"/></svg>',
    box: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/></svg>',
    cal: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
    ticket: '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9a3 3 0 0 0 0 6v3h18v-3a3 3 0 0 0 0-6V6H3z"/></svg>'
  };
  function link(text, href, cls, blank) {
    var a = el('a', cls || '', text);
    a.href = href;
    if (blank) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  function addJsonLd(data) {
    var s = doc.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(data);
    doc.head.appendChild(s);
  }
  function splitAddress(address, city) {
    var out = { '@type': 'PostalAddress', addressCountry: SET.country };
    var parts = String(address || '').split(',');
    if (parts.length > 1) {
      out.streetAddress = parts[0].trim();
      var m = /(\d{5})\s+(.+)/.exec(parts.slice(1).join(',').trim());
      if (m) { out.postalCode = m[1]; out.addressLocality = m[2].trim(); }
    } else if (address) {
      out.streetAddress = address.trim();
    }
    if (!out.addressLocality && city) out.addressLocality = city;
    return out;
  }

  function initSingle() {
    var entry = doc.querySelector('.pt-item .entry') || doc.querySelector('.entry');
    if (!entry) return;
    var body = entry.querySelector('.entry-body');
    var info = readBlock(body);
    if (!info) return;
    var panel = entry.querySelector('.entry-panel');
    var titleEl = entry.querySelector('.entry-title');
    var name = titleEl ? titleEl.textContent.trim() : '';
    var labels = [];
    var ls = entry.querySelectorAll('.entry-labels [data-label]');
    for (var i = 0; i < ls.length; i++) labels.push(ls[i].getAttribute('data-label'));
    var image = firstImage(body);
    var url = location.href.split('#')[0].split('?')[0];
    entry.classList.add('is-' + info.type);

    if (info.type === 'shop') shopPanel(entry, panel, info, name, labels, image, url);
    else if (info.type === 'product') productPanel(entry, panel, info, name, labels, image, url);
    else eventPanel(panel, info, name, image, url);
  }

  function shopPanel(entry, panel, info, name, labels, image, url) {
    var week = parseHours(info.hours);
    var wrap = el('div', 'panel');

    // Contact card
    var c = el('section', 'panel-card');
    c.appendChild(el('h2', null, t('Contact & location')));
    var actions = el('div', 'panel-actions');
    var tel = telUrl(info.phone);
    if (tel) actions.appendChild(link(t('Call'), tel, 'btn btn-call'));
    var wa = waUrl(info.whatsapp, t('Hello, I found your shop on') + ' ' + siteName() + '.');
    if (wa) actions.appendChild(link('WhatsApp', wa, 'btn btn-whatsapp', true));
    var maps = mapsUrl(info);
    if (maps) actions.appendChild(link(t('Directions'), maps, 'btn btn-ghost', true));
    if (actions.children.length) c.appendChild(actions);

    var facts = el('dl', 'facts');
    if (info.address) facts.appendChild(fact(ICON.pin, maps ? link(info.address, maps, '', true) : info.address));
    if (info.phone) facts.appendChild(fact(ICON.phone, tel ? link(info.phone, tel) : info.phone));
    if (info.website) facts.appendChild(fact(ICON.globe, link(info.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''), info.website, '', true)));
    if (info.instagram) {
      var handle = info.instagram.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '');
      if (/^[\w.]+$/.test(handle)) facts.appendChild(fact(ICON.globe, link('@' + handle, 'https://www.instagram.com/' + handle + '/', '', true)));
    }
    if (info.origin.length) facts.appendChild(fact(ICON.flag, t('Products from') + ': ' + info.origin.join(', ')));
    if (info.services.length) facts.appendChild(fact(ICON.box, t('Services') + ': ' + info.services.join(', ')));
    c.appendChild(facts);

    if (info.sells.length) {
      var h = el('h2', null, t('We sell'));
      h.style.marginTop = '18px';
      c.appendChild(h);
      var chips = el('ul', 'chips');
      info.sells.forEach(function (s) {
        var li = el('li');
        li.appendChild(link(s, '/#find?q=' + encodeURIComponent(s) + (info.city ? '&city=' + encodeURIComponent(cityLabel(info.city, labels)) : '')));
        chips.appendChild(li);
      });
      c.appendChild(chips);
    }
    wrap.appendChild(c);

    // Hours card
    var hcard = el('section', 'panel-card');
    hcard.appendChild(el('h2', null, t('Opening hours')));
    if (week) {
      var st = statusNode(week);
      if (st) { var p = el('p', 'hours-status'); p.appendChild(st); hcard.appendChild(p); }
      var table = el('table', 'hours');
      var today = berlinNow().day;
      for (var d = 0; d < 7; d++) {
        var tr = el('tr', d === today ? 'is-today' : '');
        tr.appendChild(el('td', null, t(DAY_NAMES[d])));
        tr.appendChild(el('td', null, week[d].length ? week[d].map(function (r) { return hhmm(r[0]) + '–' + hhmm(r[1]); }).join(', ') : t('Closed')));
        table.appendChild(tr);
      }
      hcard.appendChild(table);
    } else {
      hcard.appendChild(el('p', null, info.hours || t('Please call the shop for opening hours.')));
    }
    var note = el('p', 'panel-note');
    note.appendChild(doc.createTextNode(t('Is this your shop?') + ' '));
    note.appendChild(link(t('Update your listing'), SET.listPage));
    note.appendChild(doc.createTextNode(' · '));
    note.appendChild(link(t('Report wrong information'), SET.contactPage + '?about=' + encodeURIComponent(name)));
    hcard.appendChild(note);
    wrap.appendChild(hcard);
    panel.appendChild(wrap);

    // Structured data so Google can show the shop with address, hours and phone
    var type = 'Store';
    labels.forEach(function (l) {
      var n = norm(l);
      if (n.indexOf('restaurant') >= 0) type = 'Restaurant';
      else if (n === 'food' || n.indexOf('grocer') >= 0 || n.indexOf('lebensmittel') >= 0) type = 'GroceryStore';
    });
    var ld = { '@context': 'https://schema.org', '@type': type, name: name, url: url, address: splitAddress(info.address, info.city) };
    if (image) ld.image = image;
    if (info.phone) ld.telephone = info.phone;
    if (info.lat && info.lng) ld.geo = { '@type': 'GeoCoordinates', latitude: info.lat, longitude: info.lng };
    if (week) {
      var oh = [];
      week.forEach(function (ranges, d) { ranges.forEach(function (r) { oh.push(SCHEMA_DAYS[d] + ' ' + hhmm(r[0]) + '-' + hhmm(r[1])); }); });
      if (oh.length) ld.openingHours = oh;
    }
    if (info.website) ld.sameAs = [info.website];
    addJsonLd(ld);

    // More shops in the same city
    var cl = cityLabel(info.city, labels);
    var more = entry.querySelector('.entry-more');
    if (!cl || !more) return;
    fetchFeed(cl, 8, 1).then(function (items) {
      items = items.filter(function (it) { return pathOf(it.url) !== pathOf(url) && it.info && it.info.type === 'shop'; }).slice(0, 3);
      if (!items.length) return;
      var head = el('div', 'block-head');
      head.appendChild(el('h2', 'block-title', t('More shops in') + ' ' + ((findIn(CITIES, cl) || {}).name || cl)));
      head.appendChild(link(t('See all'), labelUrl(cl), 'btn btn-link'));
      more.appendChild(head);
      var grid = el('div', 'card-grid');
      items.forEach(function (it) { grid.appendChild(buildCard(it)); });
      more.appendChild(grid);
    });
  }
  function pathOf(u) {
    try { return new URL(u, location.href).pathname; } catch (e) { return String(u).split(/[?#]/)[0]; }
  }
  function cityLabel(city, labels) {
    for (var i = 0; i < labels.length; i++) if (findIn(CITIES, labels[i]) || sameCity(labels[i], city)) return labels[i];
    var c = null;
    CITIES.forEach(function (x) { if (!c && sameCity(x.label, city)) c = x.label; });
    return c || '';
  }

  function eventPanel(panel, info, name, image, url) {
    var d = eventDate(info);
    var wrap = el('div', 'panel');
    var c = el('section', 'panel-card');
    c.appendChild(el('h2', null, t('Event details')));
    var facts = el('dl', 'facts');
    if (d) facts.appendChild(fact(ICON.cal, d.toLocaleDateString(SET.lang, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (info.time ? ' · ' + info.time : '')));
    if (info.place || info.city) {
      var where = [info.place, info.city].filter(Boolean).join(', ');
      facts.appendChild(fact(ICON.pin, link(where, 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(where), '', true)));
    }
    if (info.price) facts.appendChild(fact(ICON.ticket, info.price));
    c.appendChild(facts);
    var actions = el('div', 'panel-actions');
    actions.style.marginTop = '16px';
    actions.style.marginBottom = '0';
    if (info.register) actions.appendChild(link(t('Register'), info.register, 'btn btn-primary', true));
    var times = /(\d{1,2}[:.]\d{2})\s*[-–]\s*(\d{1,2}[:.]\d{2})/.exec(info.time || '');
    if (d) {
      var ics = icsFile(name, d, times, [info.place, info.city].filter(Boolean).join(', '), url);
      var a = null;
      try { a = link(t('Add to calendar'), URL.createObjectURL(new Blob([ics], { type: 'text/calendar' })), 'btn btn-ghost'); } catch (e) { a = null; }
    }
    if (a) {
      a.setAttribute('download', 'event.ics');
      actions.appendChild(a);
    }
    if (actions.children.length) c.appendChild(actions);
    wrap.appendChild(c);
    panel.appendChild(wrap);

    if (d) {
      var ymd = info.date.slice(0, 10);
      var ld = {
        '@context': 'https://schema.org', '@type': 'Event', name: name, url: url,
        startDate: ymd + (times ? 'T' + times[1].replace('.', ':') : ''),
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: { '@type': 'Place', name: info.place || info.city, address: splitAddress(info.place, info.city) }
      };
      if (times) ld.endDate = ymd + 'T' + times[2].replace('.', ':');
      if (image) ld.image = image;
      addJsonLd(ld);
    }
  }
  function icsFile(name, d, times, where, url) {
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    var ymd = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate());
    function stamp(t2) { return ymd + 'T' + t2.replace(/[:.]/, '').replace(/^(\d{3})$/, '0$1') + '00'; }
    function esc(s) { return String(s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n'); }
    var now = new Date();
    var lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Directory//Events//EN', 'BEGIN:VEVENT',
      'UID:' + ymd + '-' + Math.abs(hash(url)) + '@directory',
      'DTSTAMP:' + now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate()) + 'T' + pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + '00Z'];
    if (times) { lines.push('DTSTART:' + stamp(times[1])); lines.push('DTEND:' + stamp(times[2])); }
    else lines.push('DTSTART;VALUE=DATE:' + ymd);
    lines.push('SUMMARY:' + esc(name), 'LOCATION:' + esc(where), 'URL:' + url, 'END:VEVENT', 'END:VCALENDAR');
    return lines.join('\r\n');
  }
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return h;
  }

  // ------------------------------------------------------------------ list page titles
  function initListTitle() {
    var h = doc.querySelector('.js-list-title');
    if (!h) return;
    var label = labelFromHref(location.pathname);
    var city = label && (findIn(CITIES, label) || findIn(STATES, label));
    if (city) h.textContent = t('African shops in') + ' ' + city.name;
    var cat = label && findIn(CATEGORIES, label);
    if (cat) h.textContent = cat.name;
  }

  // ------------------------------------------------------------------ state outline icons
  // State outlines: Natural Earth admin-1 boundaries (public domain, naturalearthdata.com), simplified,
  // centred in a 100-unit box. STATE_BOX turns a latitude/longitude into a point in that box.
  var GEO_K = 0.62932;
  var STATE_SHAPES = {"Baden-Württemberg":"M65 100 55 94 50 94 47 95 44 92 44 93 42 93 42 90 40 89 39 90 38 88 35 90 33 93 33 94 35 95 39 95 38 97 37 96 35 98 32 98 29 96 23 99 20 99 19 98 17 97 16 99 13 99 11 99 13 97 11 98 9 92 10 85 12 81 10 77 10 74 13 68 14 66 15 64 15 61 16 57 17 56 17 52 21 47 21 46 23 46 25 44 27 38 29 36 32 30 33 25 35 22 35 21 36 16 34 15 35 14 34 10 35 9 38 12 39 11 39 8 41 8 42 11 45 13 47 13 46 14 45 14 45 16 45 17 46 18 47 15 48 15 48 14 49 13 53 13 52 10 57 10 58 7 62 6 62 4 61 3 60 4 60 3 59 3 59 1 63 0 67 1 68 1 67 4 68 5 70 3 70 5 72 3 74 8 73 11 75 10 76 14 78 14 80 11 81 13 81 16 82 18 81 19 82 21 82 23 81 23 82 26 85 29 84 31 85 33 88 34 90 38 90 46 91 48 90 50 90 48 88 50 86 48 85 50 87 52 87 56 85 56 82 59 81 58 79 59 77 62 79 66 82 75 80 81 81 82 80 85 81 87 80 89 81 90 81 94 80 94 80 95 79 94 76 94 74 94 70 97 67 98Z","Bayern":"M63 8 63 10 65 12 66 16 70 18 70 19 72 20 70 24 69 25 71 27 74 34 76 37 78 37 81 39 84 44 86 45 89 49 92 49 93 51 95 52 96 55 96 60 94 62 93 61 89 60 88 66 86 69 81 70 78 72 76 74 80 83 79 86 81 87 82 88 81 94 76 91 77 90 76 88 74 88 71 89 70 87 66 88 66 86 65 87 65 89 65 90 60 90 58 91 54 90 53 93 50 93 50 95 47 96 46 95 44 96 42 96 40 93 40 92 38 93 34 91 33 92 32 91 31 96 29 99 26 100 27 97 25 97 25 95 24 93 23 94 22 92 20 92 19 90 17 92 15 92 16 90 21 88 24 88 25 88 26 88 25 84 26 83 25 79 26 75 24 69 23 66 25 64 26 63 26 64 29 62 30 59 28 58 29 57 30 58 32 56 32 58 33 57 32 55 32 50 30 47 29 46 28 44 28 43 26 41 26 36 27 36 25 34 26 32 25 31 24 33 22 33 22 30 20 31 21 29 19 26 18 27 18 26 17 27 17 24 11 24 10 25 11 26 12 26 12 28 10 28 9 30 6 30 6 29 7 24 5 22 5 17 4 15 5 14 6 13 7 14 9 13 10 13 12 14 14 14 14 10 17 10 17 9 18 8 19 5 21 5 23 4 26 0 30 2 31 5 34 6 35 10 37 11 37 10 39 10 37 7 38 5 41 5 42 6 45 6 45 8 47 9 47 3 49 1 51 2 50 4 52 6 60 4 61 6Z","Berlin":"M58 11 62 16 62 24 72 35 79 40 84 41 84 43 81 51 81 54 87 53 89 54 92 58 98 60 100 63 98 65 97 70 94 74 93 80 92 82 88 84 85 89 84 89 83 81 81 79 79 79 75 77 66 74 62 75 60 75 57 71 56 71 51 73 51 79 46 79 43 78 39 73 33 75 31 71 24 74 20 71 19 71 12 74 10 76 4 74 0 72 4 65 3 61 3 57 10 50 7 45 9 32 8 30 9 27 10 26 18 30 19 30 18 26 20 20 26 19 30 13 32 13 32 18 33 19 36 20 41 21 44 20 45 18 49 15 52 17 53 17 54 15Z","Brandenburg":"M96 43 97 44 96 47 96 48 94 51 94 53 95 57 99 60 98 65 100 67 98 71 98 74 95 78 97 83 99 86 99 88 98 91 95 90 88 93 86 92 83 92 80 94 77 100 71 100 65 99 61 97 57 98 56 97 55 98 55 92 54 90 51 88 55 84 54 80 56 77 51 77 48 75 46 74 45 73 40 71 38 72 34 69 33 70 27 62 28 59 27 56 29 47 28 47 27 46 25 47 25 45 24 45 25 41 27 41 27 40 26 37 26 35 28 33 27 31 24 31 23 30 20 30 18 29 16 28 17 27 14 25 12 25 12 24 10 24 10 22 9 23 5 21 2 22 0 19 3 20 4 18 7 19 8 18 7 16 9 14 12 13 14 15 16 14 16 13 21 11 23 9 26 8 33 13 39 13 42 15 42 16 48 16 48 17 50 17 54 13 56 14 58 12 61 12 63 11 65 6 67 6 70 3 73 3 72 1 72 0 74 2 76 5 81 6 82 5 85 5 85 8 81 11 81 12 85 13 89 10 90 12 91 13 89 16 89 19 88 22 82 27 83 30 82 32 89 37 91 39Z","Bremen":"M30 16 31 12 26 0 31 2 38 3 37 5 39 13 39 17 35 21 34 20 32 19ZM26 66 31 68 34 68 43 72 50 72 51 74 54 75 59 76 66 81 68 81 69 77 71 77 75 81 73 84 76 88 75 90 74 95 68 100 63 96 63 98 61 99 59 98 53 95 46 96 46 90 39 82 38 77 37 74 32 74 26 70 24 66Z","Hamburg":"M4 55 13 57 16 56 13 53 7 49 0 48 2 39 4 36 5 33 8 33 12 36 11 41 13 43 32 28 36 27 41 28 43 27 45 23 46 21 50 20 53 21 54 20 55 19 57 10 59 9 69 10 73 7 76 6 77 7 77 9 72 18 73 20 79 24 80 29 81 30 82 32 80 45 74 48 75 60 76 61 81 63 86 71 91 74 97 80 99 80 100 86 91 87 89 88 85 93 76 94 73 93 70 91 67 87 63 86 58 81 50 84 49 88 42 91 39 91 35 89 29 91 28 84 26 82 23 83 21 86 13 80 9 71 5 66Z","Hessen":"M76 12 76 13 76 16 79 17 80 19 84 21 83 24 83 23 81 23 83 24 82 26 84 28 83 29 79 29 78 30 79 32 76 32 77 33 78 33 79 34 78 36 76 37 74 45 76 45 76 44 79 44 79 51 78 53 76 55 74 56 72 55 71 60 69 61 68 63 64 63 64 65 65 66 64 68 61 69 59 67 56 67 54 69 53 68 50 69 49 71 51 71 51 74 51 77 52 81 52 80 53 82 54 83 54 87 53 87 53 89 52 90 53 92 52 92 53 95 49 95 48 96 48 98 47 98 46 100 45 100 45 97 46 96 47 96 47 95 45 95 42 94 41 90 39 91 39 93 38 94 35 92 34 92 32 87 35 84 34 84 32 78 31 75 28 72 27 71 19 74 16 71 18 70 18 68 20 68 20 67 19 66 20 64 22 63 23 64 23 62 25 61 23 57 21 56 23 53 22 50 24 49 25 50 27 47 25 45 27 40 26 39 30 34 32 35 35 33 37 28 37 25 40 25 42 24 41 23 43 21 42 17 39 18 38 17 41 13 48 12 47 8 50 6 52 7 53 9 54 10 59 5 60 3 59 2 63 0 64 1 67 1 69 4 68 4 68 5 67 5 67 6 68 8 68 11 66 11 66 13 65 13 70 16 72 14 71 14 70 13 72 11 74 13 74 11 75 10Z","Mecklenburg-Vorpommern":"M97 58 98 65 99 69 100 74 96 77 92 76 96 73 96 70 88 70 86 66 84 65 85 67 82 68 79 70 78 71 76 75 74 76 71 76 69 78 67 77 63 81 62 79 57 80 56 78 53 77 48 76 42 72 39 73 37 75 32 77 33 78 30 79 29 77 26 78 24 79 25 82 24 83 21 82 21 83 18 83 15 80 13 82 4 75 3 72 0 72 1 69 6 66 6 64 8 64 9 65 9 64 9 59 4 56 4 51 7 49 8 50 9 49 8 49 8 47 12 45 15 45 17 47 17 48 19 47 23 50 24 44 26 44 29 39 32 39 39 38 40 42 39 40 41 38 40 38 42 36 46 33 51 25 53 27 61 28 60 28 53 28 52 29 53 30 51 30 48 29 48 31 47 31 46 33 47 34 49 35 48 34 50 32 52 31 51 30 55 29 56 28 55 30 55 29 56 30 58 29 58 31 59 31 61 28 64 28 64 29 66 30 65 31 66 34 71 36 72 38 72 39 74 38 73 39 74 39 76 42 77 42 76 40 82 38 82 39 85 41 83 44 85 46 86 48 87 48 85 52 91 56 95 57 96 56 97 57 95 58ZM95 48 94 50 95 51 85 52 85 51 88 50 87 46 89 46 89 48 89 47 91 48 91 46 88 43 87 45 86 46 86 44 84 45 85 41 83 39 85 38 87 41 90 43ZM82 29 84 31 82 34 82 33 80 33 82 32 80 32 82 31 81 31 76 32 73 34 73 35 74 35 74 36 72 35 72 34 70 35 69 33 67 34 68 33 66 32 67 30 70 30 69 28 67 28 70 26 67 23 70 23 71 24 71 23 73 21 72 24 73 23 73 22 75 25 77 25 77 24 76 23 77 22 75 22 73 20 70 22 71 19 69 19 69 18 74 17 75 17 73 19 74 21 80 21 81 23 79 25 79 27 79 28Z","Niedersachsen":"M8 42 10 38 11 29 12 26 14 27 13 26 7 25 8 20 10 19 9 17 13 15 17 15 26 13 28 14 28 16 30 19 30 20 28 21 29 22 31 23 32 23 33 21 33 20 32 20 33 17 34 17 35 18 38 19 37 21 37 25 38 21 38 20 39 21 40 20 40 17 38 17 37 14 39 9 40 8 45 10 53 9 59 17 63 19 65 23 66 22 66 23 67 23 69 22 72 24 75 23 79 25 82 25 83 27 90 32 91 31 95 35 97 34 100 35 98 37 98 39 96 40 93 41 88 40 87 41 83 42 84 46 87 49 88 49 87 51 88 53 87 53 87 54 90 57 88 58 90 62 89 63 89 65 87 66 87 67 81 68 79 69 81 71 80 75 82 81 81 82 81 83 78 84 75 83 75 84 73 86 72 86 71 88 69 88 67 89 66 88 65 89 64 88 62 90 63 91 62 92 58 90 60 88 60 85 60 83 61 83 61 82 60 81 58 81 57 80 55 81 57 74 54 74 54 72 53 72 53 70 51 70 51 67 50 65 47 65 47 63 48 63 49 61 47 61 47 59 49 58 50 56 50 54 49 53 47 56 44 57 42 56 41 54 40 52 37 53 36 55 33 55 34 56 36 58 37 63 35 66 32 65 31 66 26 68 25 66 27 65 27 64 25 63 26 59 27 59 25 57 23 57 21 56 21 54 19 54 18 57 13 60 8 61 7 61 8 57 6 55 5 55 0 54 0 52 1 51 1 49 2 48 7 49Z","Nordrhein-Westfalen":"M25 20 27 20 33 14 40 13 46 8 47 8 49 4 51 4 51 7 54 9 57 8 59 11 58 11 58 13 57 16 60 17 59 19 56 21 57 22 59 23 61 22 65 21 67 19 71 20 73 17 72 9 69 7 68 5 71 5 73 2 77 2 79 3 79 7 82 8 86 7 87 4 90 3 91 4 90 5 91 7 89 9 87 10 87 13 89 14 88 15 88 16 87 16 87 19 91 19 92 21 93 24 92 25 95 26 94 28 96 28 96 31 100 31 98 40 99 40 96 42 97 43 97 44 93 47 93 49 90 49 89 47 88 46 84 48 85 50 86 50 85 51 80 52 78 54 75 57 77 58 80 57 80 61 79 63 79 64 78 65 74 65 75 68 72 72 70 75 67 74 65 76 63 78 64 80 63 83 61 82 59 79 59 76 58 76 55 74 56 72 54 72 53 73 53 76 51 77 51 79 48 80 43 82 42 84 41 85 38 85 37 85 36 86 30 88 29 90 28 92 27 91 25 92 26 97 21 97 20 96 17 98 15 96 16 98 14 98 13 96 13 91 10 91 9 90 9 89 11 86 9 85 6 81 4 81 3 78 4 77 4 76 6 75 6 73 4 72 4 70 1 70 0 68 0 67 1 66 2 67 4 65 8 62 8 61 6 61 6 59 9 53 10 52 9 46 6 42 7 40 4 39 4 37 2 36 3 34 2 33 6 31 8 32 7 30 8 29 11 31 14 33 15 32 15 31 17 31 19 30 25 29 27 26 23 22Z","Rheinland-Pfalz":"M12 44 12 39 14 38 13 36 17 34 18 32 20 32 22 30 21 28 23 30 27 28 28 29 30 29 31 30 34 29 33 26 33 25 33 23 35 23 36 24 37 21 38 19 42 17 45 17 47 15 48 16 51 15 52 15 53 12 60 10 63 8 62 6 64 5 65 5 65 1 66 0 68 1 67 3 70 5 71 5 72 8 74 12 77 13 76 14 78 18 76 20 74 20 72 21 73 24 71 27 74 28 76 34 74 34 73 36 72 36 70 37 69 39 70 40 70 42 68 41 67 43 65 45 68 49 79 45 83 49 84 51 83 53 86 59 87 59 86 61 84 62 84 64 87 74 86 75 88 76 87 82 88 82 85 86 84 92 81 98 79 100 70 96 65 95 61 96 60 95 57 94 55 91 56 90 51 89 50 86 51 85 53 80 50 78 48 76 48 75 50 73 49 69 47 69 45 67 39 66 28 71 20 71 20 69 22 66 21 65 24 62 25 58 21 57 19 55 18 56 18 54 16 53 12 47Z","Saarland":"M0 37 1 26 14 25 25 25 31 22 35 22 49 16 57 10 60 12 63 10 69 14 76 15 83 20 85 20 89 18 90 25 91 29 92 29 92 31 92 33 86 38 87 40 91 45 91 47 99 49 100 51 100 55 97 58 94 66 93 67 91 68 90 71 91 75 96 80 98 80 96 82 95 85 91 86 89 90 86 88 78 88 70 84 69 85 70 87 67 89 65 88 64 83 64 78 62 78 55 74 47 74 46 76 47 81 46 83 35 82 34 79 35 76 34 73 32 74 31 69 28 67 28 65 20 56 20 54 20 53 22 53 22 52 17 45 16 41 15 40 6 35Z","Sachsen":"M80 45 76 44 75 47 77 47 77 48 77 49 80 50 78 52 75 52 73 53 68 56 66 56 64 57 64 59 62 60 53 61 52 61 52 63 50 66 47 65 45 67 43 67 40 71 36 71 35 75 34 76 29 74 27 75 25 76 20 77 14 83 13 88 11 85 11 84 9 83 9 81 3 79 3 77 0 75 2 73 1 71 3 69 5 70 6 68 8 68 9 65 11 65 13 63 14 62 12 62 12 60 11 60 13 58 12 56 15 55 17 55 20 52 23 52 24 51 23 48 20 47 19 43 14 41 10 41 9 39 9 37 8 37 9 34 8 31 9 28 8 23 11 17 13 18 17 17 18 15 24 15 26 13 28 14 32 12 41 17 42 20 41 26 42 25 43 26 48 24 52 27 60 28 66 27 69 22 72 19 76 19 78 20 86 17 90 18 91 19 96 22 98 24 98 29 100 32 100 34 98 42 92 55 87 54 87 50 85 50 86 47 83 44Z","Sachsen-Anhalt":"M15 67 11 60 11 57 13 55 12 53 13 52 11 51 10 49 12 49 13 47 22 47 22 45 25 43 25 42 24 40 26 39 24 36 24 35 23 33 25 33 25 32 21 28 22 26 23 26 22 23 23 20 21 21 17 15 16 12 16 10 21 9 24 7 30 7 31 8 35 7 38 5 38 2 40 2 40 0 42 0 42 1 43 2 44 3 46 3 47 4 48 4 48 6 50 7 52 8 56 8 56 9 58 8 59 9 60 11 59 13 59 15 60 18 59 19 58 20 57 23 58 24 57 25 59 24 60 25 62 25 59 35 60 38 59 40 64 48 65 49 67 49 70 51 71 51 73 50 78 52 79 54 81 54 84 56 90 56 87 60 88 64 84 68 78 65 76 67 74 67 73 68 66 68 66 70 62 71 60 70 59 72 59 74 58 76 58 81 57 83 58 86 57 89 58 89 59 92 61 93 60 95 61 96 59 100 57 99 53 99 49 96 45 96 43 92 36 92 36 89 33 86 37 84 34 80 32 78 22 77 21 70 22 69 21 68 17 67Z","Schleswig-Holstein":"M9 2 23 5 25 8 29 8 31 7 34 8 39 4 39 6 45 8 47 9 48 11 51 10 51 9 53 10 56 15 54 15 52 16 55 16 57 17 56 23 54 27 49 29 51 29 61 28 63 30 62 30 63 34 61 35 61 38 62 37 64 33 68 31 79 36 82 39 84 39 86 39 92 35 95 34 94 35 96 35 99 34 100 34 98 36 97 36 98 41 98 45 97 47 90 52 87 53 85 55 87 58 90 59 91 63 93 64 91 65 90 64 85 67 85 68 86 71 85 74 87 75 89 77 91 77 93 79 93 86 92 87 91 85 88 85 88 89 83 91 82 92 80 93 79 98 76 98 68 94 68 93 63 88 62 85 64 85 64 81 62 78 63 76 61 76 59 76 58 79 56 79 55 81 52 81 48 84 48 82 46 82 45 85 43 85 38 81 37 77 33 74 31 69 26 66 17 64 16 65 15 65 12 62 9 56 11 55 15 57 16 57 17 52 15 50 15 49 14 49 10 51 8 47 10 44 9 42 13 41 14 39 11 40 11 39 5 40 3 42 1 40 0 37 4 36 2 35 1 36 2 33 11 32 16 29 16 28 16 27 11 21 9 21 10 20 9 16 4 12 4 11 2 7 2 2 5 3Z","Thüringen":"M3 28 2 24 6 21 7 21 10 21 11 18 13 19 15 17 18 14 18 12 20 12 23 14 27 13 28 13 28 12 27 11 28 10 30 9 33 9 39 11 39 12 37 13 39 19 40 22 51 23 54 25 57 30 56 32 53 33 56 36 56 40 65 40 67 45 72 44 74 46 77 48 82 48 84 50 87 45 85 43 86 41 89 41 94 42 96 47 98 48 100 52 99 53 95 52 92 56 90 56 86 57 87 59 85 61 86 62 87 64 88 64 88 66 86 67 83 67 82 71 80 71 78 72 76 72 74 74 75 76 74 78 72 80 70 80 69 79 60 81 58 80 58 78 56 77 56 73 53 73 49 76 51 82 50 87 48 87 47 87 46 86 46 84 45 82 42 83 40 82 40 83 38 81 33 81 32 82 30 82 30 84 35 87 35 89 31 89 30 91 27 90 26 84 24 82 22 83 21 80 19 80 19 79 17 77 16 75 13 74 12 71 9 71 6 73 6 68 7 67 6 65 4 64 3 65 3 67 0 66 2 61 2 59 2 58 3 56 5 55 6 52 5 50 3 51 3 49 6 49 5 47 6 45 11 46 12 44 10 42 11 39 9 38 11 37 12 39 13 35 7 33 6 30Z"};
  var STATE_BOX = {"Baden-Württemberg":[7.5119,49.7956,44.192,8.5,0.0],"Bayern":[8.9766,50.5629,30.379,3.7,0.0],"Berlin":[13.0916,52.6636,241.02,0.0,11.3],"Brandenburg":[11.2741,53.5438,45.541,0.0,0.0],"Bremen":[8.4961,53.6171,168.783,23.8,0.0],"Hamburg":[9.7408,53.7278,270.623,0.0,6.2],"Hessen":[7.7714,51.655,44.273,15.7,0.0],"Mecklenburg-Vorpommern":[10.6012,54.6884,41.926,0.0,16.9],"Niedersachsen":[6.6717,53.8925,32.365,0.0,7.9],"Nordrhein-Westfalen":[5.8525,52.5242,44.021,0.0,1.6],"Rheinland-Pfalz":[6.0964,50.9327,50.647,11.6,0.0],"Saarland":[6.3423,49.6295,151.579,0.0,10.3],"Sachsen":[11.8974,51.6701,50.854,0.0,11.6],"Sachsen-Anhalt":[10.5696,53.0503,47.116,10.5,0.0],"Schleswig-Holstein":[8.5999,54.9059,62.667,0.0,1.7],"Thüringen":[9.8777,51.6374,57.371,0.0,9.0]};
  // Category icons, drawn for this theme. 'f' = filled shape, 'l' = line.
  var CATEGORY_ICONS = {
    food: [['l', 'M27 42 43 12M73 42 57 12'], ['f', 'M6 40h88l-11 52H17zM31 54v24h7V54zM46 54v24h8V54zM62 54v24h7V54z']],
    beauty: [['l', 'M50 9a13 13 0 1 1 0 26a13 13 0 1 1 0-26M50 35v8'], ['f', 'M18 43h64v11H18zM20 54h6v38h-6zM31 54h6v38h-6zM42 54h6v38h-6zM53 54h6v38h-6zM64 54h6v38h-6zM75 54h6v38h-6z']],
    fashion: [['f', 'M35 6 13 17 3 41l18 7 4-9v55h50V39l4 9 18-7-10-24L65 6c-4 11-26 11-30 0zM38 50l7 7-7 7-7-7zM62 50l7 7-7 7-7-7zM50 66l7 7-7 7-7-7z']],
    restaurant: [['l', 'M7 10v17c0 7 4 10 7 10s7-3 7-10V10M14 37v56'], ['f', 'M52 26a26 26 0 1 1 0 52a26 26 0 1 1 0-52zM52 35a17 17 0 1 0 0 34a17 17 0 1 0 0-34zM94 8c-9 6-12 24-12 38h6v47h6z']],
    services: [['l', 'M20 38C28 14 60 6 79 21'], ['f', 'M94 33 86 11 70 28zM6 46h58v48H6zM29 46v18h12V46z']],
    wholesale: [['f', 'M5 56h42v38H5zM21 56v11h10V56zM53 56h42v38H53zM69 56v11h10V56zM29 12h42v38H29zM45 12v11h10V12z']]
  };
  var CATEGORY_WORDS = {
    food: 'food groceries lebensmittel essen supermarket', beauty: 'hair beauty hair & beauty haare kosmetik friseur salon',
    fashion: 'fashion fabrics mode stoffe clothes kleidung', restaurant: 'restaurant restaurants food & drinks imbiss',
    services: 'services shipping money transfer versand service', wholesale: 'wholesale grosshandel grosshandler'
  };
  function categoryIcon(label, text) {
    var keys = Object.keys(CATEGORY_ICONS);
    for (var pass = 0; pass < 2; pass++) {
      var n = norm(pass ? text : label);
      for (var i = 0; i < keys.length; i++) {
        var words = CATEGORY_WORDS[keys[i]].split(' ');
        if (n === keys[i] || words.indexOf(n) > -1 || words.indexOf(n.split(/[ &,]/)[0]) > -1) return keys[i];
      }
    }
    return '';
  }

  function svgEl(name, attrs) {
    var node = doc.createElementNS('http://www.w3.org/2000/svg', name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }
  function addTileIcon(link, parts) {
    var svg = svgEl('svg', { viewBox: '-6 -6 112 112', 'class': 'tile-icon', 'aria-hidden': 'true', focusable: 'false' });
    parts.forEach(function (p) { svg.appendChild(p); });
    link.insertBefore(svg, link.firstChild);
    link.classList.add('has-icon');
  }
  function shapeFor(state) {
    var n = norm(state);
    for (var k in STATE_SHAPES) if (norm(k) === n) return k;
    return '';
  }

  // Icons on the category, city and state tiles. Tiles with no match keep their pattern.
  function initTileIcons() {
    var i, links;
    links = doc.querySelectorAll('.js-states a');
    for (i = 0; i < links.length; i++) {
      var st = shapeFor(labelFromHref(links[i].getAttribute('href')) || links[i].textContent);
      if (st) addTileIcon(links[i], [svgEl('path', { d: STATE_SHAPES[st] })]);
    }
    // City: its state's outline with a dot where the city is. A link can set its own place:
    // <a href="/search/label/Gotha" data-state="Thüringen" data-lat="50.95" data-lng="10.70">Gotha</a>
    links = doc.querySelectorAll('.js-cities a');
    for (i = 0; i < links.length; i++) {
      var a = links[i];
      var g = cityGeo(labelFromHref(a.getAttribute('href'))) || cityGeo(a.textContent) || {};
      var state = shapeFor(a.getAttribute('data-state') || g.state);
      var lat = parseFloat(a.getAttribute('data-lat') || g.lat), lng = parseFloat(a.getAttribute('data-lng') || g.lng);
      if (!state) continue;
      var parts = [svgEl('path', { d: STATE_SHAPES[state], 'class': 'tile-land' })];
      if (!isNaN(lat) && !isNaN(lng)) {
        var b = STATE_BOX[state];
        var x = (lng - b[0]) * GEO_K * b[2] + b[3], y = (b[1] - lat) * b[2] + b[4];
        if (x > -6 && x < 106 && y > -6 && y < 106) parts.push(svgEl('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: 12, 'class': 'tile-dot' }));
      }
      addTileIcon(a, parts);
    }
    links = doc.querySelectorAll('.js-categories a');
    for (i = 0; i < links.length; i++) {
      var key = links[i].getAttribute('data-icon') || categoryIcon(labelFromHref(links[i].getAttribute('href')), links[i].textContent);
      if (!CATEGORY_ICONS[key]) continue;
      addTileIcon(links[i], CATEGORY_ICONS[key].map(function (p) {
        return svgEl('path', { d: p[1], 'class': p[0] === 'l' ? 'tile-line' : 'tile-fill' });
      }));
    }
  }

  // ------------------------------------------------------------------ slideshow
  function initSlides() {
    var boxes = doc.querySelectorAll('.js-slides');
    for (var b = 0; b < boxes.length; b++) (function (box) {
      var list = box.querySelector('ul.slides');
      if (!list || box.classList.contains('is-ready')) return;
      var slides = [];
      for (var c = 0; c < list.children.length; c++) if (list.children[c].tagName === 'LI') slides.push(list.children[c]);
      var n = slides.length;
      if (!n) return;
      box.classList.add('is-ready');
      slides.forEach(function (li, i) {
        li.classList.add('slide');
        var tone = li.getAttribute('data-tone');
        if (tone) li.classList.add('tone-' + tone);
        li.setAttribute('role', 'group');
        li.setAttribute('aria-roledescription', t('slide'));
        li.setAttribute('aria-label', (i + 1) + ' / ' + n);
        var img = li.querySelector('img');
        var text = el('div', 'slide-text');
        while (li.firstChild) {
          var node = li.firstChild;
          if (node === img) { li.removeChild(node); continue; }
          text.appendChild(node);
        }
        if (img) { img.className = 'slide-bg'; img.alt = img.alt || ''; li.appendChild(img); li.classList.add('has-image'); }
        li.appendChild(text);
      });
      if (n < 2) return;
      var cur = 0, timer = null;
      var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var nav = el('div', 'slides-nav');
      var prev = el('button', 'slides-arrow slides-prev');
      prev.type = 'button';
      prev.setAttribute('aria-label', t('Previous slide'));
      prev.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>';
      var next = el('button', 'slides-arrow slides-next');
      next.type = 'button';
      next.setAttribute('aria-label', t('Next slide'));
      next.innerHTML = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
      var dots = el('div', 'slides-dots');
      var dotEls = slides.map(function (_, i) {
        var d = el('button', 'slides-dot');
        d.type = 'button';
        d.setAttribute('aria-label', t('Slide') + ' ' + (i + 1));
        d.addEventListener('click', function () { go(i); restart(); });
        dots.appendChild(d);
        return d;
      });
      nav.appendChild(prev);
      nav.appendChild(dots);
      nav.appendChild(next);
      box.appendChild(nav);
      function go(i) {
        cur = (i + n) % n;
        list.style.transform = 'translateX(' + (-100 * cur) + '%)';
        slides.forEach(function (li, k) {
          li.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
          var links = li.querySelectorAll('a, button');
          for (var x = 0; x < links.length; x++) links[x].tabIndex = k === cur ? 0 : -1;
        });
        dotEls.forEach(function (d, k) { d.setAttribute('aria-current', k === cur ? 'true' : 'false'); });
      }
      function stop() { if (timer) { clearInterval(timer); timer = null; } }
      function start() { if (!reduce && !timer) timer = setInterval(function () { go(cur + 1); }, 6500); }
      function restart() { stop(); start(); }
      prev.addEventListener('click', function () { go(cur - 1); restart(); });
      next.addEventListener('click', function () { go(cur + 1); restart(); });
      box.addEventListener('mouseenter', stop);
      box.addEventListener('mouseleave', start);
      box.addEventListener('focusin', stop);
      box.addEventListener('focusout', start);
      doc.addEventListener('visibilitychange', function () { if (doc.hidden) stop(); else start(); });
      var x0 = null;
      list.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
      list.addEventListener('touchend', function (e) {
        if (x0 == null) return;
        var dx = e.changedTouches[0].clientX - x0;
        if (Math.abs(dx) > 40) go(cur + (dx < 0 ? 1 : -1));
        x0 = null;
        start();
      });
      go(0);
      start();
    })(boxes[b]);
  }

    // ================================================================== HOMEPAGE SECTIONS (src/blocks.js)
  // Every gadget added in Layout gets the AfroKauf look (see skin.css: .home-section > .widget).
  // A few "section codes" in a gadget's content become designed sections:
  //   <ul class="benefits">   icon strip          <ul class="banners">   two big promo banners
  //   <div class="deals">     offers (products with an old price)          <ul class="logos">  logo row
  //   <div class="feed-row" data-kind="products|shops|posts" data-label="…">  a row of cards
  //   <div class="spotlight"> big themed band with tiles      <dl class="faq">  questions and answers
  //   <div class="newsletter-signup">  newsletter form (needs crm_endpoint in Directory settings)
  SET.product = S.product_label || 'Product';
  SET.magazine = S.magazine_label || 'Magazine';
  SET.crm = /^https:\/\/script\.google\.com\/.+\/exec$/.test(S.crm_endpoint || '') ? S.crm_endpoint : '';
  SET.priceNote = S.price_note || 'Prices incl. VAT. Pay and pick up in the shop.';

  var ICON_PATHS = {
    free: '<path d="M20 12v9H4v-9"/><path d="M2 7h20v5H2z"/><path d="M12 21V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    check: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    bag: '<path d="M6 7h12l1 14H5z"/><path d="M9 7a3 3 0 0 1 6 0"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"/>',
    map: '<path d="M12 22s7-7.2 7-12a7 7 0 0 0-14 0c0 4.8 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    star: '<path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>',
    truck: '<path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
    heart: '<path d="M20.8 6.6a5 5 0 0 0-8.8-2 5 5 0 0 0-8.8 2c-.9 4.4 4.3 8.6 8.8 12.4 4.5-3.8 9.7-8 8.8-12.4z"/>',
    people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-4-6"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1"/>',
    facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8z"/>',
    youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
    tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3-3.46"/><path d="M14 3c.5 3 2.5 5 5.5 5"/>',
    linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>'
  };
  function icon(name, size) {
    var s = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', size || 24); s.setAttribute('height', size || 24);
    s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '1.8'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = ICON_PATHS[name] || ICON_PATHS.check;
    return s;
  }
  function gadgetOf(node) {
    while (node && node !== doc.body) { if (node.classList && node.classList.contains('widget')) return node; node = node.parentNode; }
    return null;
  }
  function hideGadget(node) { var g = gadgetOf(node); (g || node).classList.add('is-empty-block'); }
  function visible(node) { return !!(node.offsetParent || node.getClientRects().length); }

  function initBlocks() {
    var all = doc.querySelectorAll('.benefits');
    var order = ['check', 'clock', 'chat', 'bag'];
    for (var i = 0; i < all.length; i++) {
      var lis = all[i].querySelectorAll(':scope > li');
      for (var j = 0; j < lis.length; j++) {
        if (lis[j].querySelector('.benefit-icon')) continue;
        var ic = el('span', 'benefit-icon');
        ic.appendChild(icon(lis[j].getAttribute('data-icon') || order[j % order.length]));
        lis[j].insertBefore(ic, lis[j].firstChild);
      }
    }
    all = doc.querySelectorAll('.banners > li, .spotlight');
    for (i = 0; i < all.length; i++) {
      var tone = all[i].getAttribute('data-tone');
      if (tone) all[i].classList.add('tone-' + tone);
      var img = all[i].querySelector(':scope > img');
      if (img) { all[i].classList.add('has-img'); var m = el('div', 'banner-media'); all[i].insertBefore(m, all[i].firstChild); m.appendChild(img); }
    }
    all = doc.querySelectorAll('.logos > li');
    for (i = 0; i < all.length; i++) if (!all[i].querySelector('img')) all[i].classList.add('is-text');
    initFaq();
    initFeedRows();
    initDeals();
    initNewsletter();
    initFooterIcons();
  }

  // Questions and answers: <dl class="faq"><dt>Question</dt><dd>Answer</dd></dl> -> fold-open list + Google FAQ data
  function initFaq() {
    var lists = doc.querySelectorAll('dl.faq');
    for (var i = 0; i < lists.length; i++) {
      var dl = lists[i], box = el('div', 'faq-list'), qa = [];
      var dts = dl.querySelectorAll('dt');
      for (var j = 0; j < dts.length; j++) {
        var dd = dts[j].nextElementSibling;
        if (!dd || dd.tagName !== 'DD') continue;
        var d = el('details', 'faq-item');
        var s = el('summary', null, dts[j].textContent.trim());
        var body = el('div', 'faq-answer');
        while (dd.firstChild) body.appendChild(dd.firstChild);
        d.appendChild(s); d.appendChild(body); box.appendChild(d);
        qa.push({ '@type': 'Question', name: s.textContent, acceptedAnswer: { '@type': 'Answer', text: body.textContent.trim() } });
      }
      dl.parentNode.replaceChild(box, dl);
      if (qa.length && visible(box)) addJsonLd({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: qa });
    }
  }

  // Rows of cards from a label: products, shops or articles
  function rowShell(node) {
    var wrap = el('div', 'row-wrap');
    var row = el('div', 'row-scroll');
    var prev = el('button', 'row-arrow row-prev', '‹'), next = el('button', 'row-arrow row-next', '›');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', t('Back')); next.setAttribute('aria-label', t('More'));
    prev.addEventListener('click', function () { row.scrollBy({ left: -row.clientWidth * 0.8, behavior: 'smooth' }); });
    next.addEventListener('click', function () { row.scrollBy({ left: row.clientWidth * 0.8, behavior: 'smooth' }); });
    wrap.appendChild(prev); wrap.appendChild(row); wrap.appendChild(next);
    node.appendChild(wrap);
    var ends = function () {
      wrap.classList.toggle('at-start', row.scrollLeft < 8);
      wrap.classList.toggle('at-end', row.scrollLeft + row.clientWidth > row.scrollWidth - 8);
    };
    row.addEventListener('scroll', ends, { passive: true });
    setTimeout(ends, 50);
    return row;
  }
  function initFeedRows() {
    var rows = doc.querySelectorAll('.feed-row');
    for (var i = 0; i < rows.length; i++) (function (node) {
      if (!visible(node)) return;
      var kind = node.getAttribute('data-kind') || 'posts';
      var label = node.getAttribute('data-label') || (kind === 'products' ? SET.product : kind === 'shops' ? SET.shop : SET.magazine);
      var max = parseInt(node.getAttribute('data-max'), 10) || 8;
      fetchFeed(label, kind === 'posts' ? max : 60, 1).then(function (items) {
        items = items.filter(function (it) {
          if (kind === 'products') return it.info && it.info.type === 'product';
          if (kind === 'shops') return it.info && it.info.type === 'shop';
          return true;
        });
        if (kind === 'shops') items.sort(function (a, b) { return isFeatured(b) - isFeatured(a); });
        items = items.slice(0, max);
        if (!items.length) { hideGadget(node); return; }
        var row = rowShell(node);
        items.forEach(function (it) { row.appendChild(buildCard(it)); });
      });
    })(rows[i]);
  }

  // Deals of the week: products with an old price whose offer has not ended, biggest discount first
  function initDeals() {
    var boxes = doc.querySelectorAll('.deals');
    for (var i = 0; i < boxes.length; i++) (function (node) {
      if (!visible(node)) return;
      var max = parseInt(node.getAttribute('data-max'), 10) || 8;
      fetchFeed(SET.product, 150, 1).then(function (items) {
        items = items.filter(function (it) { return it.info && it.info.type === 'product' && dealActive(it.info) && it.info.inStock; })
          .sort(function (a, b) { return discount(b.info) - discount(a.info); }).slice(0, max);
        if (!items.length) { hideGadget(node); return; }
        var row = rowShell(node);
        items.forEach(function (it) { row.appendChild(buildCard(it)); });
      });
    })(boxes[i]);
  }

  // Newsletter band in the footer: posts to the AfroKauf sheet (double opt-in: we email a confirm link)
  function initNewsletter() {
    var boxes = doc.querySelectorAll('.newsletter-signup');
    for (var i = 0; i < boxes.length; i++) (function (box) {
      if (!SET.crm) { hideGadget(box); return; }
      var f = el('form', 'news-form');
      f.noValidate = true;
      var row = el('div', 'news-row');
      var mail = el('input'); mail.type = 'email'; mail.name = 'email'; mail.required = true; mail.autocomplete = 'email';
      mail.placeholder = t('Your email address'); mail.setAttribute('aria-label', t('Your email address'));
      var lang = el('select'); lang.name = 'language'; lang.setAttribute('aria-label', t('Language'));
      ['English', 'Deutsch', 'Français'].forEach(function (l) { var o = el('option', null, l); o.value = l; lang.appendChild(o); });
      if (/^de/i.test(SET.lang || '')) lang.value = 'Deutsch';
      else if (/^fr/i.test(SET.lang || '')) lang.value = 'Français';
      var btn = el('button', 'btn btn-primary', t('Sign up')); btn.type = 'submit';
      row.appendChild(mail); row.appendChild(lang); row.appendChild(btn);
      var trap = el('input'); trap.name = 'company2'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.className = 'news-trap'; trap.setAttribute('aria-hidden', 'true');
      var ok = el('label', 'news-consent');
      var cb = el('input'); cb.type = 'checkbox'; cb.required = true;
      ok.appendChild(cb);
      var span = el('span', null, t('Yes, send me the AfroKauf newsletter. I can unsubscribe at any time.') + ' ');
      var priv = link(t('Privacy'), '/p/datenschutz.html'); span.appendChild(priv);
      ok.appendChild(span);
      var msg = el('p', 'news-msg'); msg.setAttribute('role', 'status');
      f.appendChild(row); f.appendChild(trap); f.appendChild(ok); f.appendChild(msg);
      box.appendChild(f);
      f.addEventListener('submit', function (ev) {
        ev.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail.value.trim())) { msg.textContent = t('Please check the email address.'); return; }
        if (!cb.checked) { msg.textContent = t('Please tick the box to agree.'); return; }
        btn.disabled = true; msg.textContent = t('Sending...');
        postCrm({ kind: 'subscribe', email: mail.value.trim(), language: lang.value, company2: trap.value, page_url: location.href.split('#')[0] })
          .then(function () { f.classList.add('is-done'); msg.textContent = t('Almost done: please click the link in the email we just sent you.'); })
          .catch(function () { btn.disabled = false; msg.textContent = t('Sorry, that did not work. Please try again later.'); });
      });
    })(boxes[i]);
  }
  function postCrm(data) {
    return fetch(SET.crm, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'text/plain;charset=utf-8' } })
      .then(function (r) { return r.json(); })
      .then(function (res) { if (!res || !res.ok) throw new Error((res && res.error) || 'error'); return res; });
  }

  // Footer: social links get their icon
  function initFooterIcons() {
    var links = doc.querySelectorAll('.site-footer a[href]');
    var known = { 'instagram.com': 'instagram', 'facebook.com': 'facebook', 'youtube.com': 'youtube', 'youtu.be': 'youtube', 'tiktok.com': 'tiktok', 'linkedin.com': 'linkedin' };
    for (var i = 0; i < links.length; i++) {
      var h = links[i].getAttribute('href') || '';
      for (var k in known) {
        if (h.indexOf(k) > -1 && !links[i].querySelector('svg')) {
          links[i].classList.add('has-social-icon');
          links[i].insertBefore(icon(known[k], 18), links[i].firstChild);
          break;
        }
      }
    }
  }
  // ================================================================== SHOP (src/shop.js)
  // Products are posts with the label "Product" and this block at the top:
  //   <div class="product-info" data-price="4.50" data-old-price="5.20" data-unit="500 g"
  //     data-shop="Mama Ada Foods" data-shop-page="https://…/mama-ada-foods.html" data-whatsapp="+49 151 …"
  //     data-city="Frankfurt" data-stock="yes" data-until="2026-11-30">4,50 € · 500 g</div>
  // Member shops' products: the cart sends ONE order per shop (WhatsApp, or the order form -> AfroKauf sheet,
  // which re-checks every price from the blog feed and emails the shop). Pay and pick up in the shop.
  // AfroKauf's own products (seminar tickets, Premium): data-pay-link="https://paypal.me/…" -> "Buy now".
  function num(v) {   // "39,90", "1.299,50" and "1,299.50" all work
    if (v === undefined || v === null || v === '') return NaN;
    var s = String(v).replace(/[^\d.,-]/g, '');
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    else s = s.replace(',', '.');
    return parseFloat(s);
  }
  function money(n) {
    try { return new Intl.NumberFormat(SET.lang || 'de-DE', { style: 'currency', currency: 'EUR' }).format(n); }
    catch (e) { return n.toFixed(2).replace('.', ',') + ' €'; }
  }
  // Price per kg or litre (Grundpreis, required in Germany for goods sold by weight or volume)
  function basePrice(price, unit) {
    var u = String(unit || '').toLowerCase().replace(',', '.');
    var m = /(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl)\b/.exec(u) || /()(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl)\b/.exec(u);
    if (!m || !(price > 0)) return '';
    var qty = parseFloat(m[2]) * (m[1] ? parseFloat(m[1]) : 1);
    var f = { kg: 1, g: 0.001, l: 1, ml: 0.001, cl: 0.01 }[m[3]];
    var amount = qty * f;
    if (!(amount > 0)) return '';
    return money(price / amount) + ' / ' + (m[3] === 'kg' || m[3] === 'g' ? 'kg' : 'l');
  }
  function readProduct(b) {
    var a = function (n) { return (b.getAttribute('data-' + n) || '').trim(); };
    var price = num(a('price')), old = num(a('old-price'));
    var until = /^\d{4}-\d{2}-\d{2}$/.test(a('until')) ? a('until') : '';
    return {
      type: 'product', price: price, oldPrice: old > price ? old : NaN, unit: a('unit'),
      base: a('base-price') || basePrice(price, a('unit')),
      shop: a('shop'), shopPage: safeUrl(a('shop-page')), whatsapp: a('whatsapp'), city: a('city'),
      inStock: !/^(no|0|sold ?out|nein|ausverkauft)$/i.test(a('stock')),
      until: until, payLink: safeUrl(a('pay-link')), seller: a('seller')
    };
  }
  function todayIso() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function dealActive(p) { return p.oldPrice > p.price && (!p.until || p.until >= todayIso()); }
  function discount(p) { return dealActive(p) ? Math.round((1 - p.price / p.oldPrice) * 100) : 0; }
  function isOwnProduct(p) { return !!p.payLink; }
  function untilText(p) {
    if (!p.until || !dealActive(p)) return '';
    var d = new Date(p.until + 'T12:00:00');
    return t('Offer until') + ' ' + d.toLocaleDateString(SET.lang, { weekday: 'short', day: 'numeric', month: 'short' });
  }
  function priceNode(p, big) {
    var box = el('div', 'price' + (big ? ' price-big' : ''));
    if (!(p.price >= 0)) return box;
    box.appendChild(el('span', 'price-now' + (dealActive(p) ? ' is-deal' : ''), money(p.price)));
    if (dealActive(p)) box.appendChild(el('s', 'price-old', money(p.oldPrice)));
    var small = [p.unit, p.base ? '(' + p.base + ')' : ''].filter(Boolean).join(' ');
    if (small) box.appendChild(el('span', 'price-unit', small));
    return box;
  }

  // ---- cards (lists, rows, deals)
  function productCard(card, item, opts) {
    var p = item.info;
    var media = card.querySelector('.dcard-media');
    var kicker = card.querySelector('.dcard-kicker');
    var meta = card.querySelector('.dcard-meta');
    var extra = card.querySelector('.dcard-extra');
    if (media && dealActive(p) && !media.querySelector('.deal-badge')) media.appendChild(el('span', 'deal-badge', '-' + discount(p) + ' %'));
    if (media && !p.inStock) media.appendChild(el('span', 'soldout-badge', t('Sold out')));
    if (kicker) { kicker.textContent = ''; kicker.appendChild(el('span', 'dcard-label is-shown', isOwnProduct(p) ? (p.seller || siteName()) : [p.shop, p.city].filter(Boolean).join(' · '))); }
    if (meta) { meta.textContent = ''; meta.appendChild(priceNode(p)); }
    if (!extra) return;
    extra.textContent = '';
    var u = untilText(p);
    if (u) extra.appendChild(el('p', 'deal-until', u));
    var actions = el('div', 'dcard-actions');
    if (isOwnProduct(p)) {
      var buy = link(t('Buy now'), p.payLink, 'btn btn-primary btn-sm', true);
      actions.appendChild(buy);
    } else if (p.inStock && p.price > 0) {
      var add = el('button', 'btn btn-primary btn-sm js-add', t('Add to order'));
      add.type = 'button';
      add.addEventListener('click', function () { cartAdd(cartItem(item), 1, add); });
      actions.appendChild(add);
    }
    if (actions.children.length) extra.appendChild(actions);
  }
  function cartItem(item) {
    var p = item.info;
    return { id: String(item.id || ''), url: item.url, title: item.title, img: item.img || '', price: p.price, unit: p.unit,
      shop: p.shop || siteName(), shopPage: p.shopPage || '', whatsapp: p.whatsapp || '' };
  }

  // ---- product page
  function productPanel(entry, panel, p, name, labels, image, url) {
    var wrap = el('div', 'panel');
    var c = el('section', 'panel-card product-card');
    if (dealActive(p)) c.appendChild(el('span', 'deal-badge deal-badge-inline', '-' + discount(p) + ' % · ' + (untilText(p) || t('Offer'))));
    c.appendChild(priceNode(p, true));
    c.appendChild(el('p', 'price-note', t(SET.priceNote)));
    var id = entry.getAttribute('data-id') || '';
    var item = { id: id, url: url, title: name, img: image, info: p };
    if (!p.inStock) c.appendChild(el('p', 'stock-out', t('Sold out at the moment.')));
    var actions = el('div', 'panel-actions');
    if (isOwnProduct(p)) {
      actions.appendChild(link(t('Buy now'), p.payLink, 'btn btn-primary', true));
      c.appendChild(actions);
      c.appendChild(el('p', 'panel-small', t('You buy this directly from') + ' ' + (p.seller || siteName()) + '. ' + t('Payment opens on a secure payment page.')));
    } else {
      if (p.inStock && p.price > 0) {
        var qty = el('div', 'qty');
        var minus = el('button', 'qty-btn', '−'), plus = el('button', 'qty-btn', '+'), val = el('input', 'qty-val');
        minus.type = plus.type = 'button'; minus.setAttribute('aria-label', t('Less')); plus.setAttribute('aria-label', t('More'));
        val.type = 'number'; val.min = '1'; val.max = '99'; val.value = '1'; val.setAttribute('aria-label', t('Quantity'));
        minus.addEventListener('click', function () { val.value = Math.max(1, (parseInt(val.value, 10) || 1) - 1); });
        plus.addEventListener('click', function () { val.value = Math.min(99, (parseInt(val.value, 10) || 1) + 1); });
        qty.appendChild(minus); qty.appendChild(val); qty.appendChild(plus);
        actions.appendChild(qty);
        var add = el('button', 'btn btn-primary js-add', t('Add to order'));
        add.type = 'button';
        add.addEventListener('click', function () { cartAdd(cartItem(item), Math.max(1, Math.min(99, parseInt(val.value, 10) || 1)), add); });
        actions.appendChild(add);
      }
      var wa = waUrl(p.whatsapp, t('Hello, I am interested in') + ' "' + name + '" (' + url + ').');
      if (wa) actions.appendChild(link(t('Ask on WhatsApp'), wa, 'btn btn-whatsapp', true));
      c.appendChild(actions);
      if (p.shop) {
        var by = el('p', 'panel-small');
        by.appendChild(doc.createTextNode(t('Sold by') + ' '));
        by.appendChild(p.shopPage ? link(p.shop, p.shopPage) : el('strong', null, p.shop));
        if (p.city) by.appendChild(doc.createTextNode(' · ' + p.city));
        by.appendChild(doc.createTextNode('. ' + t('Order online, pick up and pay in the shop.')));
        c.appendChild(by);
      }
    }
    // the first photo moves next to the price box
    var body = entry.querySelector('.entry-body');
    var first = body && body.querySelector('img');
    if (first) {
      var fig = el('figure', 'product-photo');
      var im = el('img'); im.src = first.getAttribute('src'); im.alt = first.getAttribute('alt') || name;
      fig.appendChild(im); wrap.appendChild(fig);
      var holder = first.closest('.separator') || first.closest('a') || first;
      holder.classList.add('is-moved');
    }
    wrap.appendChild(c);
    if (panel) panel.appendChild(wrap);
    var offer = { '@type': 'Offer', price: (p.price || 0).toFixed(2), priceCurrency: 'EUR', url: url,
      availability: 'https://schema.org/' + (p.inStock ? 'InStock' : 'OutOfStock'),
      seller: { '@type': 'Organization', name: isOwnProduct(p) ? (p.seller || siteName()) : p.shop || siteName() } };
    if (p.until && dealActive(p)) offer.priceValidUntil = p.until;
    var ld = { '@context': 'https://schema.org', '@type': 'Product', name: name, url: url, offers: offer };
    if (image) ld.image = image;
    addJsonLd(ld);
  }

  // ---- cart (kept in this browser only)
  var CART_KEY = 'ak-cart-v1';
  function cartRead() { var s = storage('localStorage'); try { return JSON.parse((s && s.getItem(CART_KEY)) || '[]') || []; } catch (e) { return []; } }
  function cartWrite(items) { var s = storage('localStorage'); try { if (s) s.setItem(CART_KEY, JSON.stringify(items)); } catch (e) { /* full */ } cartBadge(); }
  function cartKey(i) { return i.id || i.url; }
  function cartAdd(item, qty, btn) {
    var items = cartRead(), found = null;
    items.forEach(function (i) { if (cartKey(i) === cartKey(item)) found = i; });
    if (found) found.qty = Math.min(99, found.qty + qty);
    else { item.qty = qty; items.push(item); }
    cartWrite(items);
    if (btn) { var txt = btn.textContent; btn.textContent = '✓ ' + t('Added'); btn.disabled = true; setTimeout(function () { btn.textContent = txt; btn.disabled = false; }, 1400); }
    var b = doc.querySelector('.cart-btn'); if (b) { b.classList.remove('is-bump'); void b.offsetWidth; b.classList.add('is-bump'); }
  }
  function cartCount() { return cartRead().reduce(function (n, i) { return n + i.qty; }, 0); }
  function cartBadge() {
    var b = doc.querySelector('.cart-count');
    if (!b) return;
    var n = cartCount();
    b.textContent = n;
    b.parentNode.classList.toggle('has-items', n > 0);
  }
  function groups(items) {
    var out = [], by = {};
    items.forEach(function (i) {
      var k = i.shop || '?';
      if (!by[k]) { by[k] = { shop: i.shop, shopPage: i.shopPage, whatsapp: i.whatsapp, items: [] }; out.push(by[k]); }
      by[k].items.push(i);
      if (!by[k].whatsapp && i.whatsapp) by[k].whatsapp = i.whatsapp;
    });
    return out;
  }
  function total(list) { return list.reduce(function (s, i) { return s + i.price * i.qty; }, 0); }

  var drawer = null, lastFocus = null;
  function initShop() {
    var inner = doc.querySelector('.header-inner');
    if (inner && !doc.querySelector('.cart-btn')) {
      var b = el('button', 'cart-btn');
      b.type = 'button';
      b.setAttribute('aria-label', t('Your order'));
      b.appendChild(icon('bag', 22));
      b.appendChild(el('span', 'cart-count', '0'));
      b.addEventListener('click', openDrawer);
      var toggle = inner.querySelector('.nav-toggle');
      inner.insertBefore(b, toggle || null);
    }
    cartBadge();
    window.addEventListener('storage', function (e) { if (e.key === CART_KEY) { cartBadge(); if (drawer && drawer.classList.contains('is-open')) renderDrawer(); } });
    // the Product label page gets its own title
    var h = doc.querySelector('.js-list-title');
    if (h && (norm(labelFromHref(location.pathname)) === norm(SET.product) || norm(h.textContent) === norm(SET.product))) {
      h.textContent = t('Shop: order from African shops near you');
      var note = el('p', 'list-note', t(SET.priceNote));
      if (h.parentNode) h.parentNode.parentNode.insertBefore(note, h.parentNode.nextSibling);
    }
  }
  function openDrawer() {
    if (!drawer) {
      drawer = el('div', 'cart-drawer');
      drawer.setAttribute('role', 'dialog'); drawer.setAttribute('aria-modal', 'true'); drawer.setAttribute('aria-label', t('Your order'));
      drawer.innerHTML = '<div class="cart-shade" data-close="1"></div><div class="cart-panel" tabindex="-1"><div class="cart-head"><h2></h2><button type="button" class="cart-close" data-close="1">×</button></div><div class="cart-body"></div></div>';
      drawer.querySelector('h2').textContent = t('Your order');
      drawer.querySelector('.cart-close').setAttribute('aria-label', t('Close'));
      drawer.addEventListener('click', function (e) { if (e.target.getAttribute('data-close')) closeDrawer(); });
      doc.addEventListener('keydown', function (e) { if (e.key === 'Escape' && drawer.classList.contains('is-open')) closeDrawer(); });
      doc.body.appendChild(drawer);
    }
    lastFocus = doc.activeElement;
    renderDrawer();
    drawer.classList.add('is-open');
    doc.documentElement.classList.add('cart-locked');
    drawer.querySelector('.cart-panel').focus();
  }
  function closeDrawer() {
    drawer.classList.remove('is-open');
    doc.documentElement.classList.remove('cart-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function renderDrawer(done) {
    var body = drawer.querySelector('.cart-body');
    body.textContent = '';
    if (done) body.appendChild(done);
    var items = cartRead();
    if (!items.length) {
      if (!done) {
        body.appendChild(el('p', 'cart-empty', t('Your order is empty.')));
        body.appendChild(link(t('Open the shop'), labelUrl(SET.product), 'btn btn-primary'));
      }
      return;
    }
    if (groups(items).length > 1) body.appendChild(el('p', 'cart-hint', t('Products from different shops are sent as separate orders, one per shop.')));
    groups(items).forEach(function (g) { body.appendChild(groupNode(g)); });
  }
  function groupNode(g) {
    var box = el('section', 'cart-group');
    var head = el('h3', 'cart-shop');
    head.appendChild(g.shopPage ? link(g.shop, g.shopPage) : doc.createTextNode(g.shop));
    box.appendChild(head);
    var ul = el('ul', 'cart-items');
    g.items.forEach(function (i) {
      var li = el('li', 'cart-item');
      if (i.img) { var im = el('img'); im.src = sizedImage(i.img); im.alt = ''; li.appendChild(im); } else li.appendChild(el('span', 'cart-ph'));
      var info = el('div', 'cart-info');
      info.appendChild(link(i.title, i.url, 'cart-title'));
      info.appendChild(el('span', 'cart-unit', [money(i.price), i.unit].filter(Boolean).join(' · ')));
      li.appendChild(info);
      var q = el('div', 'qty qty-sm');
      var m = el('button', 'qty-btn', '−'), p = el('button', 'qty-btn', '+'), v = el('span', 'qty-val', String(i.qty));
      m.type = p.type = 'button'; m.setAttribute('aria-label', t('Less')); p.setAttribute('aria-label', t('More'));
      m.addEventListener('click', function () { setQty(i, i.qty - 1); });
      p.addEventListener('click', function () { setQty(i, i.qty + 1); });
      q.appendChild(m); q.appendChild(v); q.appendChild(p);
      li.appendChild(q);
      li.appendChild(el('span', 'cart-line', money(i.price * i.qty)));
      ul.appendChild(li);
    });
    box.appendChild(ul);
    var sum = el('p', 'cart-total');
    sum.appendChild(el('span', null, t('Total')));
    sum.appendChild(el('strong', null, money(total(g.items))));
    box.appendChild(sum);
    box.appendChild(el('p', 'price-note', t(SET.priceNote)));
    box.appendChild(orderForm(g));
    return box;
  }
  function setQty(item, n) {
    var items = cartRead().filter(function (i) {
      if (cartKey(i) !== cartKey(item)) return true;
      i.qty = Math.min(99, n);
      return n > 0;
    });
    cartWrite(items);
    renderDrawer();
  }
  function field(label, type, name, required) {
    var w = el('label', 'cart-field');
    w.appendChild(el('span', null, t(label) + (required ? ' *' : '')));
    var i = type === 'textarea' ? el('textarea') : el('input');
    if (type !== 'textarea') i.type = type;
    i.name = name; if (required) i.required = true;
    if (name === 'name') i.autocomplete = 'name';
    if (name === 'phone') i.autocomplete = 'tel';
    if (name === 'email') i.autocomplete = 'email';
    w.appendChild(i);
    return w;
  }
  function orderForm(g) {
    var f = el('form', 'cart-form');
    f.noValidate = true;
    f.appendChild(el('h4', null, t('Order from') + ' ' + g.shop));
    f.appendChild(field('Your name', 'text', 'name', true));
    f.appendChild(field('Phone', 'tel', 'phone', true));
    f.appendChild(field('Email (for the confirmation)', 'email', 'email', false));
    f.appendChild(field('When will you pick it up?', 'text', 'pickup', false));
    f.appendChild(field('Note for the shop', 'textarea', 'note', false));
    var trap = el('input'); trap.name = 'company2'; trap.className = 'news-trap'; trap.tabIndex = -1; trap.autocomplete = 'off'; trap.setAttribute('aria-hidden', 'true');
    f.appendChild(trap);
    var ok = el('label', 'news-consent');
    var cb = el('input'); cb.type = 'checkbox'; cb.name = 'consent';
    ok.appendChild(cb);
    var span = el('span', null, t('I agree that my details go to AfroKauf and this shop to handle my order.') + ' ');
    span.appendChild(link(t('Privacy'), '/p/datenschutz.html'));
    ok.appendChild(span);
    f.appendChild(ok);
    var msg = el('p', 'cart-msg'); msg.setAttribute('role', 'alert');
    f.appendChild(msg);
    var acts = el('div', 'cart-actions');
    if (SET.crm) { var send = el('button', 'btn btn-primary', t('Send order request')); send.type = 'submit'; acts.appendChild(send); }
    if (waUrl(g.whatsapp, 'x')) { var wa = el('button', 'btn btn-whatsapp', t('Order on WhatsApp')); wa.type = 'button'; wa.className += ' js-wa'; acts.appendChild(wa); }
    if (!acts.children.length) acts.appendChild(el('p', 'cart-msg', t('This shop does not take orders online yet. Please call the shop.')));
    f.appendChild(acts);
    f.appendChild(el('p', 'panel-small', t('This is an order request: the shop confirms it. You pay when you pick it up.')));
    var val = function (n) { return (f.elements[n] && f.elements[n].value || '').trim(); };
    var check = function (needConsent) {
      if (!val('name')) return t('Please write your name.');
      if (val('phone').replace(/\D/g, '').length < 6) return t('Please write your phone number.');
      if (val('email') && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(val('email'))) return t('Please check the email address.');
      if (needConsent && !cb.checked) return t('Please tick the box to agree.');
      return '';
    };
    var wab = acts.querySelector('.js-wa');
    if (wab) wab.addEventListener('click', function () {
      var err = check(false); if (err) { msg.textContent = err; return; }
      var lines = g.items.map(function (i) { return '- ' + i.qty + ' × ' + i.title + (i.unit && norm(i.title).indexOf(norm(i.unit)) < 0 ? ' (' + i.unit + ')' : '') + ' = ' + money(i.price * i.qty); });
      var text = t('Hello') + ' ' + g.shop + ', ' + t('I would like to order (via') + ' ' + siteName() + '):\n' + lines.join('\n') + '\n' +
        t('Total') + ': ' + money(total(g.items)) + '\n' + t('Name') + ': ' + val('name') + '\n' + t('Phone') + ': ' + val('phone') +
        (val('pickup') ? '\n' + t('Pick-up') + ': ' + val('pickup') : '') + (val('note') ? '\n' + t('Note') + ': ' + val('note') : '');
      window.open(waUrl(g.whatsapp, text), '_blank', 'noopener');
      finish(g, null);
    });
    f.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var err = check(true); if (err) { msg.textContent = err; return; }
      var btn = f.querySelector('button[type=submit]'); btn.disabled = true; msg.textContent = t('Sending...');
      postCrm({ kind: 'order', shop: g.shop, shopPage: g.shopPage, name: val('name'), phone: val('phone'), email: val('email'),
        pickup: val('pickup'), note: val('note'), company2: trap.value, consent: true, language: SET.lang || '', page_url: location.href.split('#')[0],
        items: g.items.map(function (i) { return { id: i.id, url: i.url, title: i.title, qty: i.qty, price: i.price }; }) })
        .then(function (res) { finish(g, res); })
        .catch(function (e) { btn.disabled = false; msg.textContent = (e && e.message && e.message !== 'error' && !/fetch/i.test(e.message) ? e.message + ' ' : '') + t('Sorry, sending did not work. Please try WhatsApp or call the shop.'); });
    });
    return f;
  }
  function finish(g, res) {
    cartWrite(cartRead().filter(function (i) { return (i.shop || '?') !== (g.shop || '?'); }));
    var done = el('div', 'cart-done');
    if (res) {
      done.appendChild(el('h3', null, t('Thank you! Your order request was sent.')));
      done.appendChild(el('p', null, t('Order number') + ': ' + res.ref + ' · ' + t('Total') + ': ' + money(res.total)));
      if (res.changed) done.appendChild(el('p', 'panel-small', t('Some prices have changed since you added the products. The total above is the current price.')));
      done.appendChild(el('p', null, g.shop + ' ' + t('confirms your order. You pay when you pick it up.')));
    } else {
      done.appendChild(el('h3', null, t('Almost done: press Send in WhatsApp.')));
      done.appendChild(el('p', null, g.shop + ' ' + t('confirms your order on WhatsApp. You pay when you pick it up.')));
    }
    renderDrawer(done);
  }

  initSlides();
  initTileIcons();
  enhanceListCards();
  initListTitle();
  initFinder();
  initFeeds();
  initSingle();
  initBlocks();
  initShop();
  initLangSwitch();
})();
