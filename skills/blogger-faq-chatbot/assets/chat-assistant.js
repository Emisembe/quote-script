// FAQ chat assistant for Blogger (and any HTML site). No dependencies, no server, no API key.
//
// Reads its questions and answers from a Layout gadget:  <div class="chat-data"> ... .widget-content
//   Name: / Welcome: / Popular: q1 | q2 | q3      optional settings
//   WhatsApp: / Phone:                             optional, used to hand over to a person
//   Q: question   Also: other words, comma separated   A: answer ([label](/p/page.html) links)
// The "Ask" button joins an existing ".quick-contact" bar if the theme has one, otherwise it
// adds its own round button in the corner. Put this file at the end of <body>, inside
// //<![CDATA[ ... //]]> when pasted into a Blogger theme.
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var data = doc.querySelector('.chat-data .widget-content');
  if (!data) return;

  // ---------------------------------------------------------------- small helpers
  function el(tag, attrs, children) {
    var node = doc.createElement(tag);
    if (attrs) {
      for (var k in attrs) {
        if (!attrs.hasOwnProperty(k) || attrs[k] == null) continue;
        if (k === 'text') node.textContent = attrs[k];
        else if (k === 'className') node.className = attrs[k];
        else node.setAttribute(k, attrs[k]);
      }
    }
    (children || []).forEach(function (c) { if (c) node.appendChild(c); });
    return node;
  }
  var ICONS = {
    chat: 'M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 6.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z',
    send: 'M3 20.5V14l9-2-9-2V3.5L22 12 3 20.5z',
    close: 'M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z',
    phone: 'M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.6a1 1 0 0 1-.25 1z',
    whatsapp: 'M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.2-.7-2.7-1.1-4.4-3.8-4.5-4-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2.1 1.3.3.1.4.1.6-.1l.8-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.2z'
  };
  function icon(name) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = doc.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('class', 'chat-icon');
    s.setAttribute('aria-hidden', 'true');
    var p = doc.createElementNS(ns, 'path');
    p.setAttribute('d', ICONS[name]);
    p.setAttribute('fill-rule', 'evenodd');
    s.appendChild(p);
    return s;
  }
  // Text of a gadget, line by line (<br>, blocks and typed new lines all separate lines)
  var BLOCK_TAGS = /^(P|DIV|LI|H[1-6]|BLOCKQUOTE|TD|TH|SECTION|ARTICLE|UL|OL|TABLE|TBODY|TR|PRE)$/;
  function lines(rootNode) {
    var out = [];
    var cur = '';
    (function walk(n) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) cur += c.nodeValue;
        else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { out.push(cur); cur = ''; }
          else if (BLOCK_TAGS.test(c.tagName)) { out.push(cur); cur = ''; walk(c); out.push(cur); cur = ''; }
          else if (c.tagName !== 'SCRIPT' && c.tagName !== 'STYLE') walk(c);
        }
      }
    })(rootNode);
    out.push(cur);
    var all = [];
    out.forEach(function (l) { all = all.concat(l.split(/\r?\n/)); });
    return all.map(function (l) { return l.replace(/ /g, ' '); });
  }
  // Blogger feed search (JSONP, works on blogspot.com and custom domains)
  var feedId = 0;
  function searchPosts(query, count, done) {
    var cb = '__chatFeed' + (++feedId);
    var script = doc.createElement('script');
    var finished = false;
    var finish = function (entries) {
      if (finished) return;
      finished = true;
      try { delete window[cb]; } catch (err) { window[cb] = undefined; }
      if (script.parentNode) script.parentNode.removeChild(script);
      done(entries || []);
    };
    window[cb] = function (json) { finish(json && json.feed ? json.feed.entry : []); };
    script.onerror = function () { finish([]); };
    setTimeout(function () { finish([]); }, 8000);
    script.src = '/feeds/posts/summary?alt=json-in-script&max-results=' + count + '&q=' + encodeURIComponent(query) + '&callback=' + cb;
    doc.body.appendChild(script);
  }
  function entryLink(e) {
    var url = '#';
    (e.link || []).forEach(function (l) { if (l.rel === 'alternate') url = l.href; });
    return { title: (e.title && e.title.$t) || 'Article', url: url };
  }

  // ---------------------------------------------------------------- read the gadget
  var config = { name: 'Ask us', welcome: 'Hello! How can we help you?', popular: [], faqs: [], whatsapp: '', phone: '' };
  var current = null, lastKey = null;
  lines(data).forEach(function (row) {
    var m = row.trim().match(/^(name|welcome|popular|whatsapp|phone|q|also|a)\s*:\s*(.*)$/i);
    if (m) {
      var key = m[1].toLowerCase(), val = m[2].trim();
      if (key === 'q') { current = { q: val, also: '', a: '' }; config.faqs.push(current); }
      else if (key === 'popular') config.popular = val.split('|').map(function (x) { return x.trim(); }).filter(Boolean);
      else if (key === 'name' || key === 'welcome' || key === 'whatsapp' || key === 'phone') config[key] = val || config[key];
      else if (current) current[key] = val;
      lastKey = key;
    } else if (row.trim() && current && lastKey === 'a') {
      current.a += '\n' + row.trim();          // answers may continue on the next lines
    }
  });
  config.faqs = config.faqs.filter(function (f) { return f.q && f.a; });
  if (!config.faqs.length) return;             // empty list = chat switched off

  // ---------------------------------------------------------------- matching
  // Words without filler ("how do I..."), light stemming (joined/joining -> join), then each
  // question word is compared with the FAQ's words: exact, still-being-typed prefix, short form,
  // or a small spelling mistake (swapped letters count as one).
  var STOP = { the: 1, a: 1, an: 1, i: 1, im: 1, my: 1, me: 1, to: 1, of: 1, in: 1, on: 1, for: 1, and: 1, or: 1, is: 1,
    are: 1, do: 1, does: 1, did: 1, how: 1, what: 1, when: 1, where: 1, who: 1, which: 1, can: 1, could: 1, you: 1, your: 1,
    be: 1, with: 1, it: 1, this: 1, that: 1, about: 1, at: 1, am: 1, was: 1, will: 1, would: 1, should: 1, please: 1,
    hello: 1, hi: 1, there: 1, get: 1, have: 1, has: 1, any: 1, we: 1, us: 1, if: 1, so: 1, by: 1, from: 1 };
  function words(text) {
    var t = (text || '').toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/[^a-z0-9]+/g, ' ').split(' ').filter(function (w) { return w && !STOP[w]; }).map(function (w) {
      return w.length > 4 ? w.replace(/(ing|ed|es|s)$/, '') : w;
    });
  }
  function distance(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 3;
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) {
      for (j = 1; j <= b.length; j++) {
        var cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
        if (i > 1 && j > 1 && a.charAt(i - 1) === b.charAt(j - 2) && a.charAt(i - 2) === b.charAt(j - 1)) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
    return d[a.length][b.length];
  }
  config.faqs.forEach(function (f) { f.words = words(f.q + ' ' + f.also.replace(/,/g, ' ')); });
  function score(query, faq, typing) {
    var qw = words(query);
    if (!qw.length) return 0;
    var total = 0, strong = 0;
    qw.forEach(function (w, idx) {
      var best = 0, lastWord = typing && idx === qw.length - 1;
      faq.words.forEach(function (fw) {
        var sc = 0;
        if (fw === w) sc = 1;
        else if (w.length >= 3 && fw.indexOf(w) === 0) sc = lastWord ? 0.9 : 0.75;
        else if (fw.length >= 3 && w.indexOf(fw) === 0 && w.length - fw.length <= 3) sc = 0.85;
        else if (w.length >= 4 && fw.length >= 4 && distance(w, fw) <= (w.length >= 8 ? 2 : 1)) sc = 0.8;
        else if (w.length >= 5 && fw.length >= 5 && (fw.indexOf(w) !== -1 || w.indexOf(fw) !== -1)) sc = 0.6;
        if (sc > best) best = sc;
      });
      total += best;
      if (best >= 0.75) strong++;
    });
    return strong ? total / qw.length : 0;
  }
  function matches(query, typing) {
    return config.faqs.map(function (f) { return { faq: f, score: score(query, f, typing) }; })
      .filter(function (x) { return x.score >= 0.34; })
      .sort(function (a, b) { return b.score - a.score; });
  }
  // Answer text -> DOM. [label](url), https:// links, /p/... /search/... paths and emails become links.
  function rich(text) {
    var frag = doc.createDocumentFragment();
    var re = /\[([^\]]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s)]+)|(\s|^)(\/(?:p|search)\/[^\s)]+)|([\w.+-]+@[\w-]+\.[\w.]+)/g;
    String(text).split('\n').forEach(function (line, li) {
      if (li) frag.appendChild(doc.createElement('br'));
      var last = 0, m;
      while ((m = re.exec(line))) {
        var lead = m[4] || '';
        frag.appendChild(doc.createTextNode(line.slice(last, m.index) + lead));
        var href = m[2] || m[3] || m[5] || ('mailto:' + m[6]);
        var label = (m[1] || m[3] || m[5] || m[6]).replace(/[.,]$/, '');
        var a = el('a', { href: href.replace(/[.,]$/, ''), text: label });
        if (/^https?:/.test(href) && href.indexOf(window.location.host) === -1) { a.target = '_blank'; a.rel = 'noopener'; }
        frag.appendChild(a);
        last = m.index + m[0].length - (/[.,]$/.test(m[3] || '') ? 1 : 0);
      }
      frag.appendChild(doc.createTextNode(line.slice(last)));
    });
    return frag;
  }

  // ---------------------------------------------------------------- contact hand-over
  var digits = function (v) { return (v || '').replace(/[^\d+]/g, ''); };
  function contactLinks(question) {
    var row = el('div', { className: 'chat-handover' });
    var themeWa = doc.querySelector('.quick-contact .qc-whatsapp');
    var themeCall = doc.querySelector('.quick-contact .qc-call');
    var waBase = themeWa ? themeWa.getAttribute('href').split('?')[0] :
      (digits(config.whatsapp).length >= 7 ? 'https://wa.me/' + digits(config.whatsapp).replace(/^\+/, '') : '');
    var tel = themeCall ? themeCall.getAttribute('href') : (digits(config.phone).length >= 7 ? 'tel:' + digits(config.phone) : '');
    if (waBase) {
      var wa = el('a', { className: 'chat-action chat-wa', href: waBase + '?text=' + encodeURIComponent('Hello, I have a question: ' + question), target: '_blank', rel: 'noopener' }, [icon('whatsapp')]);
      wa.appendChild(doc.createTextNode('Ask on WhatsApp'));
      row.appendChild(wa);
    }
    if (tel) {
      var call = el('a', { className: 'chat-action chat-call', href: tel }, [icon('phone')]);
      call.appendChild(doc.createTextNode('Call us'));
      row.appendChild(call);
    }
    return row.children.length ? row : null;
  }

  // ---------------------------------------------------------------- the chat window
  var KEY = 'faq-chat-v1';
  var history = [];
  try { history = JSON.parse(window.sessionStorage.getItem(KEY) || '[]') || []; } catch (err) { history = []; }
  var save = function () { try { window.sessionStorage.setItem(KEY, JSON.stringify(history.slice(-30))); } catch (err) { /* private mode */ } };

  var dock = doc.querySelector('.quick-contact');
  var askBtn = el('button', { type: 'button', className: dock ? 'qc-btn qc-ask' : 'chat-launcher', 'aria-haspopup': 'dialog', 'aria-expanded': 'false', 'aria-label': 'Open the chat: ' + config.name }, [icon('chat')]);
  askBtn.appendChild(el('span', { className: dock ? 'qc-label' : 'chat-launcher-text' }, dock ?
    [el('span', { className: 'qc-short', text: 'Ask' }), el('span', { className: 'qc-number', text: config.name })] : [doc.createTextNode('Ask')]));
  if (dock) {
    dock.insertBefore(askBtn, dock.firstChild);
    var n = dock.querySelectorAll('.qc-btn').length;
    dock.className = dock.className.replace(/qc-count-\d/, '') + ' qc-count-' + n;
    root.classList.remove('qc-single');
    if (n === 3) root.classList.add('qc-three');
  } else {
    doc.body.appendChild(askBtn);
  }

  var log = el('div', { className: 'chat-log', role: 'log', 'aria-live': 'polite' });
  var suggest = el('div', { className: 'chat-suggest' });
  var input = el('input', { type: 'text', className: 'chat-input', placeholder: 'Type your question…', 'aria-label': 'Your question', autocomplete: 'off', maxlength: '200' });
  var send = el('button', { type: 'submit', className: 'chat-send', 'aria-label': 'Send' }, [icon('send')]);
  var close = el('button', { type: 'button', className: 'chat-close', 'aria-label': 'Close the chat' }, [icon('close')]);
  var form = el('form', { className: 'chat-form' }, [input, send]);
  var panel = el('div', { className: 'chat-panel', role: 'dialog', 'aria-label': config.name, hidden: 'hidden' }, [
    el('div', { className: 'chat-head' }, [
      el('span', { className: 'chat-avatar', 'aria-hidden': 'true' }, [icon('chat')]),
      el('div', { className: 'chat-title' }, [el('p', { className: 'chat-name', text: config.name }), el('p', { className: 'chat-sub', text: 'Answers straight away · or talk to a person' })]),
      close]),
    log, suggest, form]);
  doc.body.appendChild(panel);

  function chips(questions, cls) {
    return el('div', { className: 'chat-chips ' + (cls || '') }, questions.map(function (q) {
      return el('button', { type: 'button', className: 'chat-chip', 'data-q': q, text: q });
    }));
  }
  function add(who, text, extras, keep) {
    var bubble = el('div', { className: 'chat-bubble' });
    bubble.appendChild(who === 'bot' ? rich(text) : doc.createTextNode(text));
    var msg = el('div', { className: 'chat-msg chat-' + who }, [bubble]);
    (extras || []).forEach(function (x) { if (x) msg.appendChild(x); });
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
    if (keep !== false) { history.push({ who: who, text: text }); save(); }
    return msg;
  }
  function ask(question) {
    question = (question || '').trim();
    if (!question) return;
    add('user', question);
    suggest.textContent = '';
    input.value = '';
    var hits = matches(question, false);
    var dots = el('div', { className: 'chat-msg chat-bot chat-typing', 'aria-hidden': 'true' }, [el('div', { className: 'chat-bubble', text: '•••' })]);
    log.appendChild(dots);
    log.scrollTop = log.scrollHeight;
    setTimeout(function () {
      if (dots.parentNode) log.removeChild(dots);
      if (hits.length && hits[0].score >= 0.6) {
        var more = hits.slice(1, 3).filter(function (h) { return h.score >= 0.45; }).map(function (h) { return h.faq.q; });
        add('bot', hits[0].faq.a, more.length ? [el('p', { className: 'chat-more', text: 'You might also want to know:' }), chips(more)] : null);
        return;
      }
      var near = hits.slice(0, 3).map(function (h) { return h.faq.q; });
      var msg = add('bot', near.length ? 'I\'m not completely sure. Did you mean one of these?' :
        'I don\'t have a ready answer for that. Here is what I found on the website, or ask a person directly:', [near.length ? chips(near) : null]);
      searchPosts(question.slice(0, 80), 3, function (entries) {
        if (entries.length) {
          msg.appendChild(el('p', { className: 'chat-more', text: 'Articles that may help:' }));
          msg.appendChild(el('ul', { className: 'chat-links' }, entries.map(entryLink).map(function (p) {
            return el('li', null, [el('a', { href: p.url, text: p.title })]);
          })));
        }
        var people = contactLinks(question);
        if (people) { msg.appendChild(el('p', { className: 'chat-more', text: 'Talk to a person:' })); msg.appendChild(people); }
        log.scrollTop = log.scrollHeight;
      });
    }, 350);
  }
  var started = false;
  function start() {
    if (started) return;
    started = true;
    if (history.length) history.forEach(function (h) { add(h.who, h.text, null, false); });
    else add('bot', config.welcome, null, false);
    var pop = config.popular.length ? config.popular : config.faqs.slice(0, 4).map(function (f) { return f.q; });
    log.appendChild(el('div', { className: 'chat-msg chat-bot' }, [el('p', { className: 'chat-more', text: 'Popular questions:' }), chips(pop)]));
  }
  function setOpen(open) {
    panel.hidden = !open;
    askBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    root.classList.toggle('chat-open', open);      // lock scrolling on <html> only (see SKILL.md)
    if (open) { start(); log.scrollTop = log.scrollHeight; input.focus(); }
    else askBtn.focus();
  }
  askBtn.addEventListener('click', function () { setOpen(panel.hidden); });
  close.addEventListener('click', function () { setOpen(false); });
  doc.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.key === 'Esc') && !panel.hidden) setOpen(false); });
  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  input.addEventListener('input', function () {
    suggest.textContent = '';
    if (input.value.trim().length < 2) return;
    var hits = matches(input.value, true).slice(0, 4);
    if (hits.length) suggest.appendChild(chips(hits.map(function (h) { return h.faq.q; }), 'chat-chips-live'));
  });
  panel.addEventListener('click', function (e) {
    var chip = e.target.closest ? e.target.closest('.chat-chip') : null;
    if (chip) ask(chip.getAttribute('data-q'));
  });
})();
