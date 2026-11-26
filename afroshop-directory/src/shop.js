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
      until: until, payLink: safeUrl(a('pay-link')), seller: a('seller'),
      sku: a('sku').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 40)   // AfroKauf product code, e.g. AK-FD-GARI-1KG-0042
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
    return { id: String(item.id || ''), url: item.url, title: item.title, img: item.img || '', price: p.price, unit: p.unit, sku: p.sku || '',
      shop: p.shop || siteName(), shopPage: p.shopPage || '', whatsapp: p.whatsapp || '' };
  }

  // ---- product page
  function productPanel(entry, panel, p, name, labels, image, url) {
    var wrap = el('div', 'panel');
    var c = el('section', 'panel-card product-card');
    if (dealActive(p)) c.appendChild(el('span', 'deal-badge deal-badge-inline', '-' + discount(p) + ' % · ' + (untilText(p) || t('Offer'))));
    c.appendChild(priceNode(p, true));
    c.appendChild(el('p', 'price-note', t(SET.priceNote)));
    if (p.sku) c.appendChild(el('p', 'sku', t('SKU') + ': ' + p.sku));
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
      var wa = waUrl(p.whatsapp, t('Hello, I am interested in') + ' "' + name + '"' + (p.sku ? ' [' + p.sku + ']' : '') + ' (' + url + ').');
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
    if (p.sku) ld.sku = p.sku;
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
      var lines = g.items.map(function (i) { return '- ' + i.qty + ' × ' + i.title + (i.unit && norm(i.title).indexOf(norm(i.unit)) < 0 ? ' (' + i.unit + ')' : '') + (i.sku ? ' [' + i.sku + ']' : '') + ' = ' + money(i.price * i.qty); });
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
        items: g.items.map(function (i) { return { id: i.id, url: i.url, title: i.title, sku: i.sku || '', qty: i.qty, price: i.price }; }) })
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
