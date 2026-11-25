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
      if (/^de/i.test(SET.lang || doc.documentElement.lang || '')) lang.value = 'Deutsch';
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
