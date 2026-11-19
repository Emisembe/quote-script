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
  var CITY_STATE = {
    'berlin': 'Berlin', 'hamburg': 'Hamburg', 'bremen': 'Bremen', 'bremerhaven': 'Bremen',
    'munchen': 'Bayern', 'nurnberg': 'Bayern', 'augsburg': 'Bayern', 'regensburg': 'Bayern', 'wurzburg': 'Bayern', 'ingolstadt': 'Bayern', 'erlangen': 'Bayern', 'furth': 'Bayern',
    'stuttgart': 'Baden-Württemberg', 'mannheim': 'Baden-Württemberg', 'karlsruhe': 'Baden-Württemberg', 'freiburg': 'Baden-Württemberg', 'heidelberg': 'Baden-Württemberg', 'ulm': 'Baden-Württemberg', 'heilbronn': 'Baden-Württemberg', 'pforzheim': 'Baden-Württemberg', 'reutlingen': 'Baden-Württemberg',
    'frankfurt': 'Hessen', 'frankfurt am main': 'Hessen', 'wiesbaden': 'Hessen', 'kassel': 'Hessen', 'darmstadt': 'Hessen', 'offenbach': 'Hessen', 'offenbach am main': 'Hessen', 'hanau': 'Hessen', 'giessen': 'Hessen', 'marburg': 'Hessen', 'fulda': 'Hessen',
    'koln': 'Nordrhein-Westfalen', 'dusseldorf': 'Nordrhein-Westfalen', 'dortmund': 'Nordrhein-Westfalen', 'essen': 'Nordrhein-Westfalen', 'duisburg': 'Nordrhein-Westfalen', 'bochum': 'Nordrhein-Westfalen', 'wuppertal': 'Nordrhein-Westfalen', 'bielefeld': 'Nordrhein-Westfalen', 'bonn': 'Nordrhein-Westfalen', 'munster': 'Nordrhein-Westfalen', 'aachen': 'Nordrhein-Westfalen', 'gelsenkirchen': 'Nordrhein-Westfalen', 'monchengladbach': 'Nordrhein-Westfalen', 'krefeld': 'Nordrhein-Westfalen', 'oberhausen': 'Nordrhein-Westfalen', 'hagen': 'Nordrhein-Westfalen', 'hamm': 'Nordrhein-Westfalen', 'leverkusen': 'Nordrhein-Westfalen', 'solingen': 'Nordrhein-Westfalen', 'paderborn': 'Nordrhein-Westfalen', 'siegen': 'Nordrhein-Westfalen',
    'hannover': 'Niedersachsen', 'braunschweig': 'Niedersachsen', 'oldenburg': 'Niedersachsen', 'osnabruck': 'Niedersachsen', 'wolfsburg': 'Niedersachsen', 'gottingen': 'Niedersachsen', 'hildesheim': 'Niedersachsen', 'salzgitter': 'Niedersachsen',
    'leipzig': 'Sachsen', 'dresden': 'Sachsen', 'chemnitz': 'Sachsen', 'zwickau': 'Sachsen',
    'halle': 'Sachsen-Anhalt', 'halle (saale)': 'Sachsen-Anhalt', 'magdeburg': 'Sachsen-Anhalt', 'dessau': 'Sachsen-Anhalt',
    'erfurt': 'Thüringen', 'jena': 'Thüringen', 'gera': 'Thüringen', 'weimar': 'Thüringen',
    'potsdam': 'Brandenburg', 'cottbus': 'Brandenburg', 'frankfurt (oder)': 'Brandenburg',
    'rostock': 'Mecklenburg-Vorpommern', 'schwerin': 'Mecklenburg-Vorpommern', 'greifswald': 'Mecklenburg-Vorpommern',
    'kiel': 'Schleswig-Holstein', 'lubeck': 'Schleswig-Holstein', 'flensburg': 'Schleswig-Holstein', 'neumunster': 'Schleswig-Holstein',
    'mainz': 'Rheinland-Pfalz', 'ludwigshafen': 'Rheinland-Pfalz', 'koblenz': 'Rheinland-Pfalz', 'trier': 'Rheinland-Pfalz', 'kaiserslautern': 'Rheinland-Pfalz',
    'saarbrucken': 'Saarland'
  };
  function stateOf(info) {
    if (!info) return '';
    if (info.state) return info.state;
    return CITY_STATE[norm(info.city)] || CITY_STATE[norm(info.city).split(' ')[0]] || '';
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
          if (want.indexOf(lab) >= 0 || (info && sameCity(lab, info.city))) server[i].classList.add('is-shown');
        }
        if (!kicker.querySelector('.is-shown') && info && info.city) {
          var c = el('span', 'dcard-label is-shown', info.city);
          kicker.appendChild(c);
        }
      } else {
        want.forEach(function (w) { kicker.appendChild(el('span', 'dcard-label is-shown', w)); });
      }
    }
    if (!info) return;
    card.classList.add('is-rich', 'is-' + info.type);

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
      enhanceCard(cards[i], {
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
  // Outlines: SVG Maps (github.com/VictorCazanave/svg-maps), based on MapSVG, CC BY 4.0. Simplified.
  var STATE_SHAPES = {"Baden-Württemberg":"M47 10 51 10 53 6 56 7 56 4 55 3 54 4 54 3 55 3 52 2 53 2 53 1 56 0 57 1 58 0 60 2 60 0 63 0 62 4 63 5 64 3 65 5 67 3 69 8 67 11 69 11 70 9 71 14 73 14 75 11 75 13 76 13 76 16 78 18 76 19 76 20 78 23 76 24 77 24 77 27 80 29 79 31 80 31 80 34 83 34 86 38 86 39 85 40 86 42 85 47 87 47 87 49 85 51 86 49 85 49 84 51 83 49 81 49 80 50 82 53 82 54 82 57 80 57 80 58 78 60 76 59 74 60 74 61 72 63 75 67 77 75 77 78 76 81 76 85 75 85 77 88 75 89 76 90 77 94 76 94 75 95 75 94 74 93 72 95 69 94 66 97 62 97 61 99 57 99 46 94 44 93 41 95 39 94 40 93 38 92 38 91 37 92 38 93 38 94 36 93 36 90 35 90 34 88 33 90 32 88 31 88 31 89 29 90 26 94 28 95 32 94 33 95 32 95 32 97 31 97 30 96 28 97 29 98 26 99 20 96 17 99 13 100 11 98 9 98 8 99 5 100 4 99 5 99 5 97 3 98 2 98 0 93 1 91 1 89 1 85 3 81 2 78 2 74 5 70 5 66 7 65 6 62 8 58 9 57 8 54 10 51 13 48 14 46 17 44 20 37 23 36 25 31 26 25 29 22 28 21 29 19 29 18 28 19 29 16 27 15 28 14 27 9 28 9 31 13 32 11 32 8 35 8 34 8 35 12 38 13 38 12 39 14 41 13 40 15 39 14 39 15 39 16 38 17 39 18 42 15 42 13 44 13 46 12 47 12 46 10 47 10 47 10Z","Bayern":"M21 1 23 0 25 0 25 2 27 2 28 5 30 5 30 7 32 7 33 10 35 11 35 10 37 10 37 9 35 7 37 5 39 5 40 7 43 6 43 9 45 9 46 6 45 3 47 1 49 2 49 4 50 4 51 6 56 5 57 5 59 4 60 5 60 7 63 8 63 9 62 10 64 11 64 14 66 16 70 18 70 20 71 20 69 26 71 27 71 29 73 32 74 35 76 36 76 38 79 38 81 39 84 44 86 45 88 47 89 49 90 50 91 49 92 49 94 52 95 52 96 53 97 55 96 57 97 57 97 60 95 63 91 61 89 62 89 66 87 69 81 71 76 75 76 76 81 83 79 87 81 87 82 88 82 89 81 94 76 92 77 90 76 89 76 88 73 88 72 89 70 90 69 87 66 88 65 86 64 87 65 90 61 90 57 91 53 90 52 93 49 93 48 94 49 95 47 95 46 96 45 96 46 95 45 95 43 96 40 96 39 94 38 94 39 93 38 92 36 93 32 91 31 92 29 91 30 95 29 97 27 99 24 100 25 97 24 96 22 97 22 95 20 94 20 92 18 92 16 90 15 92 12 92 13 90 16 90 17 88 20 89 21 88 22 89 23 88 23 86 22 85 23 84 22 82 23 75 22 70 20 67 21 65 24 65 27 63 27 60 26 58 26 57 28 59 29 57 29 59 30 58 29 56 30 53 29 51 30 51 27 47 25 47 25 46 25 45 25 44 23 42 23 40 24 40 23 37 24 36 22 35 23 33 22 32 21 33 19 34 19 31 18 32 17 31 18 30 16 26 15 27 15 26 14 27 13 24 12 24 12 26 11 24 10 25 9 24 6 26 8 26 8 27 8 26 9 27 9 29 7 28 4 31 2 30 3 26 2 22 1 22 1 18 1 16 0 16 1 14 3 14 4 15 5 13 8 14 9 15 11 15 10 10 14 10 14 9 15 8 16 4 18 5 21 1Z","Berlin":"M58 2 60 1 59 4 65 7 61 17 63 20 69 21 74 26 74 31 82 33 80 35 85 36 78 50 80 51 83 48 92 54 91 51 100 57 97 60 95 59 98 60 96 63 97 65 96 68 89 71 91 74 87 76 83 83 82 81 83 73 81 72 77 74 75 69 67 70 67 68 58 69 56 63 49 65 49 74 45 73 44 71 42 70 38 65 34 67 32 66 31 64 27 66 24 66 23 63 20 62 11 66 10 68 12 69 5 70 7 68 0 65 1 62 5 58 3 55 4 48 12 41 8 38 4 39 6 31 8 30 10 25 6 22 11 19 19 21 17 17 20 12 26 12 26 8 29 8 29 3 33 4 33 11 40 13 46 7 50 9 53 6 57 6 54 3 57 0 58 0 58 2Z","Brandenburg":"M0 20 3 21 4 19 7 20 8 18 8 16 11 15 13 16 15 16 15 14 16 14 17 13 19 13 20 12 21 12 22 9 23 10 25 9 25 10 27 9 28 11 31 12 33 14 35 14 37 15 39 14 39 15 41 16 41 17 42 17 44 17 45 18 47 17 47 18 48 18 52 14 55 16 55 14 57 13 58 13 59 14 60 12 62 12 63 11 63 7 66 7 66 5 68 4 71 3 70 2 70 0 71 2 73 3 74 6 76 6 78 7 79 6 83 6 82 9 79 14 83 14 85 12 87 11 88 14 86 17 87 19 86 24 80 28 80 31 79 33 86 37 89 41 94 46 93 47 94 49 91 54 92 59 96 61 95 66 97 69 95 76 92 79 94 81 95 84 96 86 97 89 96 90 95 90 95 92 93 92 92 90 91 91 87 92 85 94 83 92 80 92 80 93 78 94 78 95 77 95 78 96 76 100 75 98 70 100 64 99 63 100 63 98 61 97 60 97 59 96 59 97 57 97 56 99 54 98 54 97 53 97 54 93 52 91 53 90 52 88 51 89 50 87 53 84 52 83 52 77 49 77 49 76 47 76 47 74 44 74 44 73 42 73 39 71 37 72 35 72 34 70 32 71 28 67 26 64 29 61 27 60 29 56 28 55 29 53 28 53 30 50 29 49 30 49 28 49 27 48 26 49 26 47 24 47 25 45 25 43 27 43 27 41 26 39 27 36 28 35 27 32 26 32 24 33 24 31 24 32 21 31 20 32 16 30 16 28 13 26 12 27 11 26 10 25 10 24 7 24 5 22 2 23 0 20Z","Bremen":"M1 64 2 64 7 67 10 66 12 67 10 70 13 70 14 74 20 73 22 71 22 73 25 72 26 75 35 75 38 80 43 80 46 77 50 81 47 83 48 86 51 86 48 88 49 92 50 95 46 98 46 100 41 100 39 96 38 99 34 99 30 96 29 93 27 96 24 96 22 93 23 90 18 87 19 85 15 79 14 74 3 69 0 65 1 64ZM4 1 11 3 13 1 16 1 16 0 18 0 14 6 15 9 16 9 16 14 17 16 15 19 13 21 11 20 9 21 7 15 9 15 9 11 10 12 8 10 8 6 7 5 7 8 4 1Z","Hamburg":"M0 51 7 30 7 34 11 36 12 41 18 43 27 33 30 24 42 26 45 16 56 17 58 10 57 8 59 5 66 7 74 0 78 2 78 4 76 8 72 10 72 14 69 17 76 21 79 26 77 28 82 30 77 36 79 43 71 47 72 61 77 64 81 61 86 72 94 81 100 82 97 86 90 90 85 96 75 96 54 78 53 82 49 82 50 86 43 91 36 88 31 92 30 91 32 85 29 80 22 85 22 87 13 78 12 69 9 70 9 67 6 65 8 62 6 56 7 52 0 51Z","Hessen":"M47 0 49 0 49 1 52 1 54 4 52 3 53 5 52 4 52 6 51 6 53 8 53 11 51 12 51 13 50 13 52 16 55 16 56 14 55 15 54 13 57 12 58 11 59 13 59 11 60 11 61 16 62 17 64 17 65 19 69 21 68 24 67 23 66 23 68 24 67 27 69 28 67 30 64 29 63 30 65 32 61 32 61 33 62 33 62 34 63 33 64 35 63 36 64 37 61 38 61 43 59 46 62 46 61 44 64 44 65 46 64 47 64 49 63 53 59 56 56 55 56 60 53 62 53 63 53 64 51 64 49 63 49 66 49 66 49 70 47 70 45 68 41 67 39 70 39 69 38 68 34 70 34 72 35 72 36 74 35 75 36 81 37 80 37 83 38 83 38 84 39 85 38 87 37 87 37 89 36 90 37 92 37 93 38 95 36 94 35 96 33 95 33 97 29 100 30 97 30 96 31 97 32 95 30 96 30 94 29 95 26 94 25 90 26 90 23 91 24 94 22 95 20 92 18 92 16 87 20 84 18 84 17 80 16 79 15 75 13 73 12 72 3 75 0 71 2 70 2 68 4 69 4 67 3 66 4 65 6 63 7 64 7 62 9 62 10 61 8 57 5 56 7 54 6 52 6 51 8 49 9 50 10 50 11 47 9 45 11 41 10 39 14 35 16 36 19 33 19 31 22 29 21 28 21 25 27 25 26 23 28 20 27 18 26 17 23 18 22 17 26 13 33 12 33 10 31 8 35 6 37 7 37 10 41 9 41 8 43 6 43 5 45 3 44 2 47 0Z","Niedersachsen":"M41 0 43 2 45 2 48 2 47 1 51 0 54 1 58 9 63 12 63 13 65 16 66 15 66 16 67 16 69 15 71 17 74 16 79 18 82 18 84 20 86 19 88 19 90 23 92 24 92 26 93 26 95 29 97 28 100 29 99 30 98 30 98 32 94 34 88 33 87 35 83 36 84 40 86 44 87 43 87 45 88 47 87 47 87 48 89 51 88 52 90 56 88 57 89 58 89 59 87 60 87 62 82 62 79 64 81 65 80 66 81 67 79 70 82 75 80 76 81 78 75 77 74 79 72 81 72 81 71 82 68 82 66 84 66 83 64 83 65 84 63 83 63 84 61 85 62 86 63 85 62 87 58 84 60 83 59 80 59 78 60 78 60 77 61 78 60 76 55 75 55 72 56 70 57 68 54 69 54 67 53 66 53 65 51 64 51 61 50 61 50 59 47 59 47 57 48 58 48 56 49 56 46 54 50 50 49 49 50 48 49 47 48 47 46 50 44 51 41 51 41 47 40 46 38 47 37 47 35 49 33 49 33 50 36 52 36 57 37 58 35 60 33 59 31 61 28 61 26 63 25 61 27 60 27 58 25 57 26 55 25 54 27 54 25 51 21 50 21 49 19 48 18 49 19 50 18 51 13 55 8 56 7 54 8 51 6 48 5 49 0 48 0 45 2 45 1 43 1 42 8 42 8 35 11 30 10 26 11 24 11 22 12 20 13 20 7 19 6 18 7 12 9 13 7 12 9 13 8 11 10 9 11 8 17 8 24 5 23 6 27 6 28 9 29 9 30 12 28 13 28 14 32 17 33 15 33 13 31 13 33 10 37 11 39 14 40 13 39 11 40 10 37 10 37 7 39 0 41 0Z","Mecklenburg-Vorpommern":"M51 9 52 10 61 11 61 12 58 12 56 11 54 12 54 12 52 13 52 14 51 14 51 14 55 12 55 14 55 13 56 14 57 13 58 15 61 12 64 11 64 13 65 14 66 18 68 19 67 19 68 19 69 20 71 20 72 22 73 23 71 24 74 23 73 24 74 24 75 27 76 27 76 25 82 23 81 24 84 26 82 29 87 34 85 36 84 38 92 42 94 42 95 41 96 42 95 44 97 44 98 48 97 51 100 60 98 61 96 63 92 63 95 59 95 56 92 55 91 57 89 56 87 56 86 52 85 52 84 50 83 52 84 53 82 54 80 55 79 57 77 57 77 61 76 62 74 62 74 64 72 62 71 62 69 63 69 65 67 64 63 67 62 67 62 66 60 67 59 66 57 66 56 66 57 65 55 65 54 64 48 64 47 61 44 60 43 59 41 60 41 59 39 59 38 58 37 61 36 62 35 63 31 64 32 65 27 64 25 65 25 69 24 69 21 69 21 70 15 69 16 67 13 65 10 60 8 59 6 61 3 58 0 59 1 55 3 55 3 54 6 52 6 49 8 50 9 46 9 44 7 44 4 42 5 36 7 34 8 35 10 35 8 34 8 33 12 30 15 30 17 31 17 33 19 32 23 35 23 32 22 32 22 31 22 32 21 32 21 31 23 30 23 32 24 29 26 29 27 27 26 26 25 28 24 27 28 24 33 24 40 22 42 20 46 17 51 9ZM74 0 73 2 74 5 80 4 81 5 81 7 78 9 78 11 79 13 81 13 83 15 82 19 81 17 80 17 81 16 79 16 81 15 79 16 78 15 76 15 73 19 73 18 72 19 72 20 73 19 74 19 73 21 71 19 71 20 72 18 70 19 68 19 68 17 67 18 68 17 66 16 66 14 70 13 69 11 67 12 68 10 66 11 67 9 69 9 69 10 68 10 68 11 70 9 69 9 69 8 67 8 67 6 69 6 71 8 71 6 72 5 72 6 73 6 74 9 75 10 76 9 76 5 75 6 73 3 69 6 70 2 67 6 69 1 74 0Z","Nordrhein-Westfalen":"M33 13 36 12 40 12 46 7 48 7 48 5 47 5 48 3 51 4 51 6 58 8 59 10 58 10 58 12 57 12 57 15 58 16 60 17 59 17 60 19 56 20 59 22 60 21 65 21 67 18 71 19 71 18 74 16 72 14 72 10 72 8 68 6 68 3 71 4 73 1 75 1 77 0 79 1 79 6 83 6 85 6 89 1 90 2 91 2 90 4 91 6 86 11 89 14 88 14 88 16 87 15 88 16 88 18 89 17 91 18 91 20 93 21 92 25 93 26 95 25 95 27 97 28 96 31 100 30 99 32 100 33 98 36 98 38 98 40 100 40 97 41 98 42 96 46 93 47 93 48 90 49 90 47 88 46 84 47 86 50 85 51 79 52 77 54 75 56 76 58 79 57 81 59 79 63 79 64 75 64 73 65 74 68 72 70 72 72 69 75 67 74 63 78 64 80 63 82 62 82 61 82 60 81 58 79 58 75 55 74 55 72 54 71 52 72 53 75 50 77 50 78 48 79 48 80 47 80 44 81 42 81 41 85 37 85 37 84 36 86 35 86 34 87 33 86 31 88 30 88 30 89 28 89 29 92 28 93 26 91 24 92 26 97 23 98 22 96 21 97 20 95 16 98 17 97 15 95 14 96 16 98 15 98 13 96 14 93 13 92 14 91 10 91 9 89 11 85 9 85 7 81 5 81 4 79 3 78 4 77 4 75 6 75 6 72 4 72 4 69 1 70 0 67 1 66 3 67 4 65 9 62 8 61 8 60 6 61 6 58 10 53 10 46 6 42 7 40 5 39 5 37 2 36 3 34 2 32 6 30 8 31 7 29 8 29 10 30 12 30 15 32 15 30 17 31 23 28 24 29 27 25 23 22 23 21 24 21 25 19 28 19 31 14 33 13Z","Rheinland-Pfalz":"M10 32 10 31 9 29 10 28 11 30 11 31 16 29 17 31 18 29 19 31 22 30 21 24 23 23 24 25 26 24 25 21 27 21 27 20 29 19 31 17 32 18 33 17 34 18 36 15 36 16 40 16 41 12 43 12 47 10 48 10 49 9 51 8 51 6 53 5 54 5 53 1 55 0 57 1 56 3 58 3 59 5 61 5 61 9 63 11 63 13 64 12 66 13 65 15 67 18 65 21 63 20 62 21 61 23 62 25 60 27 64 29 64 31 66 33 65 35 63 34 62 35 63 36 63 37 61 36 59 38 58 40 59 41 59 43 57 42 56 44 54 45 58 50 68 46 70 47 72 49 73 52 73 54 74 55 74 57 75 60 77 60 76 62 73 64 77 75 76 76 78 77 77 79 78 79 78 80 76 82 78 84 74 87 73 93 71 99 68 100 61 97 59 95 57 97 55 95 54 96 52 95 51 96 46 94 45 90 43 90 43 89 41 90 39 88 38 86 42 84 42 80 39 79 38 78 37 77 39 75 38 74 39 72 38 72 38 69 36 70 35 68 32 68 30 66 29 67 29 67 27 67 27 68 23 69 19 72 18 71 16 72 15 71 13 72 9 71 8 70 10 67 10 65 13 62 13 61 14 58 12 57 10 58 8 56 7 56 7 55 4 53 4 51 3 50 2 51 0 45 1 41 1 40 3 39 2 36 6 35 7 32 8 33 10 32Z","Saarland":"M2 13 6 14 7 13 9 15 11 14 16 17 20 15 22 17 24 18 24 16 26 15 28 15 28 13 29 14 31 14 32 15 34 13 37 12 44 7 46 8 49 5 50 6 52 3 55 4 56 1 57 2 61 1 60 3 64 0 67 2 70 6 71 5 73 7 78 6 78 8 79 9 82 9 82 11 87 8 88 15 91 16 91 17 89 18 88 23 91 24 89 27 85 29 86 30 89 33 89 37 96 38 97 41 100 40 99 51 96 53 94 53 95 54 93 56 93 58 91 56 89 59 91 61 90 64 96 71 96 73 93 73 90 77 85 75 80 77 79 75 77 76 74 73 72 73 72 72 71 71 69 72 70 75 67 77 64 69 65 66 63 66 59 63 58 64 55 61 51 63 48 61 46 63 48 67 46 71 41 69 37 70 34 66 36 64 35 62 32 62 32 57 29 56 30 53 25 50 22 47 22 45 20 43 20 42 22 43 23 40 22 40 22 37 18 35 19 32 7 24 4 26 1 25 0 16 2 13Z","Sachsen":"M13 30 11 29 12 28 10 27 11 25 10 25 10 23 9 18 10 18 10 15 10 13 9 11 11 10 10 8 11 6 13 6 15 5 17 5 18 4 19 5 24 3 23 4 26 1 28 2 31 0 31 1 32 1 34 2 34 1 36 1 36 2 37 2 38 4 39 3 41 5 40 6 42 8 41 11 42 12 41 13 42 13 42 15 44 15 46 13 48 13 48 12 49 13 50 13 52 14 53 16 54 15 54 16 60 16 66 15 67 16 69 12 68 11 70 11 69 10 72 8 71 7 76 8 78 9 79 7 84 6 85 5 87 7 89 7 89 4 90 5 90 6 90 8 97 11 98 17 100 21 98 31 95 38 93 40 92 43 90 43 89 42 87 42 88 38 85 39 86 35 83 33 83 32 83 33 81 33 80 34 77 32 75 35 77 35 77 37 80 38 79 40 77 40 76 40 74 41 70 44 67 43 65 45 64 45 64 47 63 48 59 48 58 49 57 48 52 49 52 52 50 54 47 52 46 55 43 55 42 59 40 58 38 59 37 59 36 62 34 64 30 61 30 63 29 62 27 63 26 64 25 63 20 64 20 67 17 68 15 72 15 72 15 75 13 75 13 73 12 72 12 72 12 71 10 71 10 68 7 68 3 67 4 65 1 62 2 62 3 60 2 58 1 58 0 57 2 57 2 55 4 53 5 55 5 57 6 57 7 56 9 56 8 55 9 53 10 54 10 52 12 53 14 51 14 50 12 50 12 48 11 48 12 46 12 46 13 45 12 45 12 43 15 43 16 42 18 42 19 40 24 39 25 39 23 35 22 35 21 35 21 33 20 34 20 31 18 30 15 31 15 29 13 30Z","Sachsen-Anhalt":"M30 0 32 0 31 1 33 1 33 3 35 2 38 4 37 6 42 8 43 7 46 8 46 7 46 9 48 8 49 9 50 11 49 12 48 16 49 17 49 20 47 20 48 22 46 25 48 25 47 25 48 26 49 25 50 27 52 26 50 30 51 31 51 33 51 33 49 38 51 39 50 40 49 42 50 45 55 49 56 48 58 51 60 51 62 49 65 52 67 52 67 53 70 53 71 55 73 55 73 56 75 56 76 57 75 57 77 63 73 67 72 67 71 66 70 67 68 66 68 66 67 65 65 67 63 66 60 69 61 68 57 69 55 69 55 70 49 71 48 73 48 74 47 75 48 77 48 82 47 82 48 86 47 89 48 89 48 91 51 93 50 95 51 95 51 96 49 100 48 98 47 99 45 98 43 99 42 98 41 97 41 96 40 96 39 95 35 95 33 92 31 93 30 92 29 92 26 92 27 88 24 87 27 83 25 81 25 79 23 79 22 78 20 79 15 77 13 78 13 77 12 77 12 75 11 73 11 72 10 70 10 69 11 69 11 68 8 68 6 67 4 67 0 59 0 57 3 55 1 53 3 52 1 51 0 50 2 50 3 48 4 48 12 47 11 45 14 44 15 42 13 42 13 41 15 39 12 34 15 33 15 32 13 31 11 28 11 26 13 26 11 23 12 20 11 21 8 16 7 16 6 12 6 10 11 9 13 6 22 8 28 5 28 2 29 2 30 0Z","Schleswig-Holstein":"M5 0 4 1 6 3 4 4 3 5 3 9 5 11 11 10 12 9 17 10 18 9 23 9 26 11 30 11 33 12 33 15 35 15 37 15 39 13 40 16 41 14 46 11 45 13 46 14 52 16 54 18 56 18 56 16 58 17 59 20 61 22 61 23 60 22 59 22 60 24 61 23 60 24 61 24 60 30 58 33 54 35 55 36 64 34 66 36 65 37 66 40 64 41 65 43 64 44 66 44 66 42 67 38 71 37 80 41 84 45 87 44 92 40 95 40 93 41 95 41 98 39 98 40 97 42 96 42 97 51 92 55 89 58 88 58 87 57 85 60 86 63 90 64 90 67 93 68 91 69 90 67 85 71 86 75 86 77 89 80 91 80 92 83 91 88 88 88 88 91 84 93 83 94 81 95 80 100 77 99 72 96 71 96 70 96 71 95 68 93 67 91 65 91 65 88 66 87 66 85 67 84 64 82 66 78 65 78 64 80 62 79 62 82 59 81 59 83 56 83 54 87 52 86 51 84 50 89 48 88 44 85 42 81 40 78 36 71 32 70 25 70 22 67 20 63 21 63 20 63 19 61 18 61 21 60 23 61 24 59 23 59 24 59 22 55 20 56 18 53 19 46 15 46 14 47 11 44 11 46 10 45 11 42 12 43 14 42 14 41 11 41 12 40 19 38 20 39 25 35 27 35 25 35 24 32 21 36 18 35 18 33 20 31 21 28 21 27 18 28 20 26 16 23 16 21 14 20 14 17 11 13 11 10 8 11 5 13 2 11 1 12 1 19 0 18 1 9 4 0 5 0Z","Thüringen":"M30 0 32 0 34 2 35 1 36 2 38 2 38 3 37 3 36 4 37 5 38 6 38 7 39 10 39 13 41 13 40 13 43 13 46 14 48 14 49 15 52 14 53 15 55 15 55 18 56 18 55 18 58 20 54 25 57 26 58 28 57 29 58 31 61 31 63 32 65 31 68 35 73 34 73 36 75 36 75 38 77 38 77 39 80 39 82 40 83 39 84 41 87 36 87 35 85 35 87 32 89 31 89 33 93 33 95 34 95 36 96 36 95 37 97 38 98 38 99 41 100 42 99 43 95 43 92 45 92 46 92 46 91 45 90 46 89 47 87 47 86 48 85 48 86 49 87 50 86 51 85 51 85 52 86 52 86 55 88 55 86 58 84 58 83 59 82 58 81 61 82 61 79 61 79 63 77 63 78 60 77 58 76 60 74 61 74 62 72 63 72 65 74 64 75 66 74 67 75 68 73 69 74 70 70 72 69 70 63 72 61 71 59 73 59 72 58 71 58 70 56 70 56 69 56 65 53 64 51 67 49 67 51 74 50 74 50 79 47 77 47 79 47 78 46 78 46 75 45 73 42 74 42 74 40 73 40 74 38 72 37 72 36 72 34 72 32 74 30 73 30 74 30 76 35 78 35 80 31 80 30 82 28 81 26 81 26 75 25 75 24 73 22 74 21 71 19 72 19 70 18 70 16 66 13 65 12 63 10 63 8 62 6 65 7 63 6 59 7 59 6 56 3 56 3 58 0 58 0 56 2 55 1 54 2 52 2 50 3 50 3 47 5 47 5 45 7 44 5 42 3 43 4 41 3 42 3 41 7 40 5 38 6 37 9 37 10 38 12 37 12 35 10 34 11 31 9 29 10 29 12 31 13 27 9 25 7 24 6 21 3 21 2 20 2 16 6 12 7 13 7 12 10 13 10 12 11 12 12 9 13 10 15 9 18 5 18 4 20 3 23 5 26 4 28 5 27 2 30 0Z"};
  function initStateIcons() {
    var links = doc.querySelectorAll('.js-states a');
    var byName = {};
    Object.keys(STATE_SHAPES).forEach(function (k) { byName[norm(k)] = STATE_SHAPES[k]; });
    for (var i = 0; i < links.length; i++) {
      var d = byName[norm(labelFromHref(links[i].getAttribute('href')))];
      if (!d) continue;
      var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '-6 -6 112 112');
      svg.setAttribute('class', 'tile-icon');
      svg.setAttribute('aria-hidden', 'true');
      var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
      links[i].insertBefore(svg, links[i].firstChild);
      links[i].classList.add('has-icon');
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

  initSlides();
  initStateIcons();
  enhanceListCards();
  initListTitle();
  initFinder();
  initFeeds();
  initSingle();
})();
