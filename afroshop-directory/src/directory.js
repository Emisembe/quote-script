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

  enhanceListCards();
  initListTitle();
  initFinder();
  initFeeds();
  initSingle();
})();
