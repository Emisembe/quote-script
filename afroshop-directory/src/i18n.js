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
