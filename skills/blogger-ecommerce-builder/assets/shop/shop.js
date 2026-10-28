/* Blogger shop: product cards, product page, cart drawer, checkout.
 * Vanilla JS: no libraries, no external CDN. Goes inside a CDATA-wrapped <script>
 * at the end of <body>, after the theme's own script.
 *
 * Reads:
 *   .shop-settings      HTML gadget text, one "key: value" per line
 *   .shop-words         optional HTML gadget text, "English: Translation" per line
 *   .shop-card          product cards on list pages (see blog-includables.xml)
 *   .shop-item          the single product page wrapper
 *   .product[data-price] the product block inside each post body
 * Writes: localStorage "shop-cart-v1" (cart survives reloads; fails safe).
 */
(function () {
  'use strict';

  // ------------------------------------------------------------ settings
  function readLines(selector) {
    var out = {};
    var el = document.querySelector(selector);
    if (!el) return out;
    // Gadget text may use real line breaks, <br> or one <p>/<div> per line.
    var copy = el.cloneNode(true);
    Array.prototype.forEach.call(copy.querySelectorAll('br, p, div, li'), function (n) {
      n.appendChild(document.createTextNode('\n'));
    });
    (copy.textContent || '').split(/\r?\n/).forEach(function (line) {
      var i = line.indexOf(':');
      if (i < 1) return;
      var key = line.slice(0, i).trim();
      var value = line.slice(i + 1).trim();
      if (key) out[key] = value;
    });
    return out;
  }

  var S = readLines('.shop-settings');
  var WORDS = readLines('.shop-words');
  var on = function (v) { return /^(yes|true|on|1)$/i.test(String(v || '').trim()); };

  var CFG = {
    currency: (S.currency || 'EUR').toUpperCase(),
    locale: S.locale || document.documentElement.lang || 'en',
    shop: S.shop_name || document.title.split('|').pop().trim(),
    whatsapp: (S.whatsapp || '').replace(/[^\d]/g, ''),
    email: S.email || '',
    endpoint: S.order_endpoint || '',
    paypal: S.paypal || '',
    bank: S.bank || '',
    shipping: parseNumber(S.shipping) || 0,
    freeOver: parseNumber(S.free_shipping_over) || 0,
    taxNote: S.tax_note || '',
    labelPrices: on(S.label_prices) // also read SpotCommerce-style labels: _39 -49 !0
  };

  function t(text) { return WORDS[text] || text; }

  // ------------------------------------------------------------ helpers
  function parseNumber(v) {
    if (v === undefined || v === null || v === '') return NaN;
    var s = String(v).replace(/[^\d.,-]/g, '');
    // "1.299,50" -> 1299.50 ; "1,299.50" -> 1299.50 ; "39,90" -> 39.90
    if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
      s = s.lastIndexOf(',') > s.lastIndexOf('.') ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
    return parseFloat(s);
  }

  var fmt;
  try {
    fmt = new Intl.NumberFormat(CFG.locale, { style: 'currency', currency: CFG.currency });
  } catch (e) {
    fmt = { format: function (n) { return CFG.currency + ' ' + n.toFixed(2); } };
  }
  function money(n) { return fmt.format(Math.round(n * 100) / 100); }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // Bigger images from Google-hosted URLs only (other hosts are left alone).
  function sized(url, w) {
    if (!url || !/(googleusercontent\.com|blogspot\.com|ggpht\.com)/.test(url)) return url;
    if (/\/s\d+(-c)?\//.test(url) || /\/w\d+-h\d+(-[a-z]+)?\//.test(url)) {
      return url.replace(/\/(s\d+(-c)?|w\d+-h\d+(-[a-z]+)?)\//, '/w' + w + '/');
    }
    if (/=s\d+(-c)?$|=w\d+(-h\d+)?(-[a-z]+)?$/.test(url)) return url.replace(/=[^=]+$/, '=w' + w);
    return url;
  }

  // ------------------------------------------------------------ product data
  // <div class="product" data-price="39" data-old-price="49" data-stock="12"
  //      data-sku="TS-01" data-options="Size: S, M, L | Colour: Red, Black">Price: 39 EUR</div>
  function parseOptions(text) {
    return String(text || '').split('|').map(function (group) {
      var i = group.indexOf(':');
      if (i < 1) return null;
      var values = group.slice(i + 1).split(',').map(function (v) { return v.trim(); }).filter(Boolean);
      return values.length ? { name: group.slice(0, i).trim(), values: values } : null;
    }).filter(Boolean);
  }

  function productFrom(root, labels) {
    var p = { price: NaN, oldPrice: NaN, stock: NaN, sku: '', options: [] };
    var block = root && root.querySelector ? root.querySelector('.product[data-price]') : null;
    if (block) {
      p.price = parseNumber(block.getAttribute('data-price'));
      p.oldPrice = parseNumber(block.getAttribute('data-old-price'));
      p.stock = parseNumber(block.getAttribute('data-stock'));
      p.sku = block.getAttribute('data-sku') || '';
      p.options = parseOptions(block.getAttribute('data-options'));
    }
    if (isNaN(p.price) && CFG.labelPrices && labels) {
      labels.forEach(function (name) {
        var m = /^([_\-!])(\d[\d.,]*)$/.exec(name.trim());
        if (!m) return;
        var n = parseNumber(m[2]);
        if (m[1] === '_') p.price = n;
        else if (m[1] === '-') p.oldPrice = n;
        else p.stock = n;
      });
    }
    if (!(p.oldPrice > p.price)) p.oldPrice = NaN;
    return isNaN(p.price) ? null : p;
  }

  function labelsOf(scope) {
    return Array.prototype.map.call(scope.querySelectorAll('[data-label]'), function (n) {
      return n.getAttribute('data-label');
    });
  }

  function priceNode(p) {
    var box = el('span', { 'class': 'shop-price' });
    if (!isNaN(p.oldPrice)) {
      box.appendChild(el('del', { 'class': 'shop-price-old', text: money(p.oldPrice) }));
      box.appendChild(document.createTextNode(' '));
    }
    box.appendChild(el('span', { 'class': 'shop-price-now', text: money(p.price) }));
    return box;
  }

  function soldOut(p) { return !isNaN(p.stock) && p.stock <= 0; }

  // ------------------------------------------------------------ cart store
  var KEY = 'shop-cart-v1';
  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || '[]') || []; } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* private mode: cart lives for this page only */ }
    renderCount();
    if (drawer && drawer.getAttribute('data-open') === 'true') renderCart();
  }

  function lineKey(id, chosen) { return id + '|' + chosen.join('|'); }

  function addToCart(item, qty) {
    var key = lineKey(item.id, item.chosen);
    var line = cart.filter(function (l) { return l.key === key; })[0];
    if (line) line.qty += qty;
    else cart.push({ key: key, id: item.id, title: item.title, url: item.url, image: item.image,
                     price: item.price, chosen: item.chosen, sku: item.sku, qty: qty });
    line = cart.filter(function (l) { return l.key === key; })[0];
    var limited = !isNaN(item.stock) && line.qty > item.stock;
    if (limited) line.qty = item.stock;
    save();
    toast(limited ? t('Only') + ' ' + item.stock + ' ' + t('in stock') + ' — ' + item.title
                  : item.title + ' — ' + t('added to cart'));
  }

  function totals() {
    var sub = cart.reduce(function (s, l) { return s + l.price * l.qty; }, 0);
    var ship = cart.length && CFG.shipping && !(CFG.freeOver && sub >= CFG.freeOver) ? CFG.shipping : 0;
    return { sub: sub, ship: ship, total: sub + ship, count: cart.reduce(function (s, l) { return s + l.qty; }, 0) };
  }

  // ------------------------------------------------------------ list cards
  function enhanceCards() {
    Array.prototype.forEach.call(document.querySelectorAll('.shop-card'), function (card) {
      var src = card.querySelector('template.shop-src');
      var p = productFrom(src ? src.content : card, labelsOf(card));
      var slot = card.querySelector('.shop-card-buy');
      if (!p || !slot) return;
      card.classList.add('is-product');
      if (!isNaN(p.oldPrice)) card.appendChild(el('span', { 'class': 'shop-badge', text: t('Sale') }));
      slot.appendChild(priceNode(p));
      var title = card.getAttribute('data-title') || (card.querySelector('h2, h3') || {}).textContent || '';
      if (soldOut(p)) {
        card.classList.add('is-soldout');
        slot.appendChild(el('span', { 'class': 'shop-soldout', text: t('Out of stock') }));
      } else if (p.options.length) {
        slot.appendChild(el('a', { 'class': 'shop-btn shop-btn-ghost', href: card.getAttribute('data-url'), text: t('Choose options') }));
      } else {
        slot.appendChild(el('button', {
          type: 'button', 'class': 'shop-btn', text: t('Add to cart'),
          'aria-label': t('Add to cart') + ': ' + title.trim(),
          onclick: function () {
            addToCart({ id: card.getAttribute('data-id'), title: title.trim(), url: card.getAttribute('data-url'),
                        image: card.getAttribute('data-image') || '', price: p.price, stock: p.stock,
                        sku: p.sku, chosen: [] }, 1);
          }
        }));
      }
    });
  }

  // ------------------------------------------------------------ product page
  function enhanceItem() {
    var item = document.querySelector('.shop-item');
    if (!item) return;
    var body = item.querySelector('.post-body') || item;
    var p = productFrom(body, labelsOf(item));
    var slot = item.querySelector('.shop-buy');
    if (!p || !slot) return;
    item.classList.add('is-product');
    var block = body.querySelector('.product[data-price]');
    if (block) block.hidden = true;

    var title = (item.getAttribute('data-title') || (item.querySelector('h1') || {}).textContent || '').trim();
    var images = Array.prototype.map.call(body.querySelectorAll('img'), function (i) { return i.src; })
      .filter(function (src) { return src && !/^http:/.test(src); });
    var image = item.getAttribute('data-image') || images[0] || '';

    buildGallery(item, images);

    slot.appendChild(priceNode(p));
    if (CFG.taxNote) slot.appendChild(el('p', { 'class': 'shop-note', text: t(CFG.taxNote) }));

    var selects = p.options.map(function (opt, n) {
      var id = 'shop-opt-' + n;
      var select = el('select', { id: id, required: 'required' },
        [el('option', { value: '', text: t('Choose') + '…' })].concat(opt.values.map(function (v) {
          return el('option', { value: v, text: v });
        })));
      slot.appendChild(el('label', { 'class': 'shop-field', 'for': id }, [el('span', { text: t(opt.name) }), select]));
      return select;
    });

    if (soldOut(p)) {
      slot.appendChild(el('p', { 'class': 'shop-soldout', text: t('Out of stock') }));
    } else {
      var qty = el('input', { type: 'number', min: '1', value: '1', inputmode: 'numeric', id: 'shop-qty',
                              max: isNaN(p.stock) ? false : String(p.stock) });
      var msg = el('p', { 'class': 'shop-msg', role: 'status' });
      slot.appendChild(el('label', { 'class': 'shop-field shop-qty', 'for': 'shop-qty' }, [el('span', { text: t('Quantity') }), qty]));
      slot.appendChild(el('button', {
        type: 'button', 'class': 'shop-btn shop-btn-big', text: t('Add to cart'),
        onclick: function () {
          var missing = selects.filter(function (s) { return !s.value; });
          if (missing.length) { msg.textContent = t('Please choose') + ' ' + t(p.options[selects.indexOf(missing[0])].name); missing[0].focus(); return; }
          msg.textContent = '';
          var chosen = selects.map(function (s, n) { return p.options[n].name + ': ' + s.value; });
          var n = Math.max(1, parseInt(qty.value, 10) || 1);
          addToCart({ id: item.getAttribute('data-id'), title: title, url: item.getAttribute('data-url') || location.href.split('?')[0],
                      image: image, price: p.price, stock: p.stock, sku: p.sku, chosen: chosen }, n);
        }
      }));
      slot.appendChild(msg);
    }
    if (CFG.whatsapp) {
      slot.appendChild(el('a', { 'class': 'shop-btn shop-btn-ghost', target: '_blank', rel: 'noopener',
        href: 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(t('Hi, I am interested in') + ' ' + title + ' ' + location.href.split('?')[0]),
        text: t('Ask on WhatsApp') }));
    }

    // Product structured data for Google (rich results with price and stock).
    var ld = {
      '@context': 'https://schema.org', '@type': 'Product', name: title,
      image: images.slice(0, 5), url: location.href.split('?')[0],
      offers: {
        '@type': 'Offer', priceCurrency: CFG.currency, price: p.price.toFixed(2),
        availability: soldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: location.href.split('?')[0]
      }
    };
    if (p.sku) ld.sku = p.sku;
    var desc = item.querySelector('meta[itemprop=description]') || document.querySelector('meta[name=description]');
    if (desc && desc.content) ld.description = desc.content;
    document.head.appendChild(el('script', { type: 'application/ld+json', text: JSON.stringify(ld) }));
  }

  function buildGallery(item, images) {
    var target = item.querySelector('.shop-gallery');
    if (!target || !images.length) return;
    // The gallery now shows the photos, so hide Blogger's own image blocks in the description.
    Array.prototype.forEach.call(item.querySelectorAll('.post-body .separator'), function (s) {
      if (s.querySelector('img') && !s.textContent.trim()) s.hidden = true;
    });
    var main = el('img', { 'class': 'shop-gallery-main', src: sized(images[0], 900), alt: '' });
    target.appendChild(main);
    if (images.length < 2) return;
    var row = el('div', { 'class': 'shop-gallery-thumbs' });
    images.slice(0, 8).forEach(function (src, n) {
      row.appendChild(el('button', {
        type: 'button', 'aria-label': t('Image') + ' ' + (n + 1),
        onclick: function () { main.src = sized(src, 900); }
      }, [el('img', { src: sized(src, 160), alt: '', loading: 'lazy' })]));
    });
    target.appendChild(row);
  }

  // ------------------------------------------------------------ drawer
  var drawer, panel, lastFocus;

  function renderCount() {
    var n = totals().count;
    Array.prototype.forEach.call(document.querySelectorAll('[data-cart-count]'), function (b) {
      b.textContent = n;
      b.hidden = n === 0;
    });
  }

  function buildDrawer() {
    drawer = el('div', { 'class': 'shop-drawer', 'data-open': 'false', hidden: 'hidden' });
    var shade = el('div', { 'class': 'shop-shade', onclick: closeDrawer });
    panel = el('div', { 'class': 'shop-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': t('Cart'), tabindex: '-1' });
    drawer.appendChild(shade);
    drawer.appendChild(panel);
    document.body.appendChild(drawer);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') closeDrawer();
    });
    document.addEventListener('click', function (e) {
      var open = e.target.closest && e.target.closest('[data-cart-open]');
      if (open) { e.preventDefault(); openDrawer(); }
    });
    if (location.hash === '#cart') openDrawer();
  }

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    drawer.setAttribute('data-open', 'true');
    document.documentElement.classList.add('shop-locked');
    renderCart();
    panel.focus();
  }

  function closeDrawer() {
    drawer.setAttribute('data-open', 'false');
    drawer.hidden = true;
    document.documentElement.classList.remove('shop-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function header(title) {
    return el('div', { 'class': 'shop-panel-head' }, [
      el('h2', { text: title }),
      el('button', { type: 'button', 'class': 'shop-x', 'aria-label': t('Close'), text: '×', onclick: closeDrawer })
    ]);
  }

  function sumRows(tt) {
    var rows = [[t('Subtotal'), money(tt.sub)]];
    if (CFG.shipping) rows.push([t('Shipping'), tt.ship ? money(tt.ship) : t('Free')]);
    rows.push([t('Total'), money(tt.total)]);
    return el('dl', { 'class': 'shop-sum' }, rows.reduce(function (a, r) {
      return a.concat([el('dt', { text: r[0] }), el('dd', { text: r[1] })]);
    }, []));
  }

  function renderCart() {
    panel.textContent = '';
    panel.appendChild(header(t('Cart')));
    if (!cart.length) {
      panel.appendChild(el('p', { 'class': 'shop-empty', text: t('Your cart is empty.') }));
      return;
    }
    var list = el('ul', { 'class': 'shop-lines' });
    cart.forEach(function (l) {
      var qty = el('input', { type: 'number', min: '0', value: String(l.qty), 'aria-label': t('Quantity') + ': ' + l.title,
        onchange: function () {
          var n = Math.max(0, parseInt(qty.value, 10) || 0);
          if (n === 0) cart = cart.filter(function (x) { return x !== l; }); else l.qty = n;
          save();
        } });
      list.appendChild(el('li', { 'class': 'shop-line' }, [
        l.image ? el('img', { src: sized(l.image, 120), alt: '', loading: 'lazy' }) : el('span', { 'class': 'shop-line-noimg' }),
        el('div', { 'class': 'shop-line-info' }, [
          el('a', { href: l.url, text: l.title }),
          l.chosen.length ? el('small', { text: l.chosen.join(' · ') }) : null,
          el('span', { 'class': 'shop-line-price', text: money(l.price) })
        ]),
        qty,
        el('button', { type: 'button', 'class': 'shop-x', 'aria-label': t('Remove') + ': ' + l.title, text: '×',
          onclick: function () { cart = cart.filter(function (x) { return x !== l; }); save(); } })
      ]));
    });
    panel.appendChild(list);
    var tt = totals();
    panel.appendChild(sumRows(tt));
    if (CFG.freeOver && CFG.shipping && tt.sub < CFG.freeOver) {
      panel.appendChild(el('p', { 'class': 'shop-note', text: t('Free shipping from') + ' ' + money(CFG.freeOver) }));
    }
    panel.appendChild(el('button', { type: 'button', 'class': 'shop-btn shop-btn-big', text: t('Checkout'), onclick: renderCheckout }));
  }

  // ------------------------------------------------------------ checkout
  function methods() {
    var m = [];
    if (CFG.endpoint) m.push(['order', t('Place order (we confirm by email)')]);
    if (CFG.whatsapp) m.push(['whatsapp', t('Send order on WhatsApp')]);
    if (CFG.paypal) m.push(['paypal', t('Pay with PayPal')]);
    if (CFG.email && !CFG.endpoint) m.push(['email', t('Send order by email')]);
    return m;
  }

  function field(name, label, type, required, extra) {
    var id = 'shop-f-' + name;
    var input = type === 'textarea'
      ? el('textarea', { id: id, name: name, rows: '3' })
      : el('input', Object.assign({ id: id, name: name, type: type || 'text' }, extra || {}));
    if (required) input.required = true;
    return el('label', { 'class': 'shop-field', 'for': id }, [el('span', { text: t(label) + (required ? ' *' : '') }), input]);
  }

  function renderCheckout() {
    panel.textContent = '';
    panel.appendChild(header(t('Checkout')));
    var list = methods();
    if (!list.length) {
      panel.appendChild(el('p', { 'class': 'shop-msg', text: 'Shop settings: add whatsapp, email, paypal or order_endpoint.' }));
      return;
    }
    var form = el('form', { 'class': 'shop-form', novalidate: 'novalidate' }, [
      field('name', 'Full name', 'text', true, { autocomplete: 'name' }),
      field('phone', 'Phone', 'tel', true, { autocomplete: 'tel' }),
      field('email', 'Email', 'email', !!CFG.endpoint, { autocomplete: 'email' }),
      field('address', 'Delivery address', 'textarea', true),
      field('note', 'Note', 'textarea', false),
      el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'class': 'shop-hp', 'aria-hidden': 'true' })
    ]);
    var fs = el('fieldset', { 'class': 'shop-methods' }, [el('legend', { text: t('How do you want to order?') })]);
    list.forEach(function (m, n) {
      fs.appendChild(el('label', {}, [el('input', { type: 'radio', name: 'method', value: m[0], checked: n === 0 ? 'checked' : false }), ' ' + m[1]]));
    });
    form.appendChild(fs);
    form.appendChild(sumRows(totals()));
    var msg = el('p', { 'class': 'shop-msg', role: 'status' });
    var submit = el('button', { type: 'submit', 'class': 'shop-btn shop-btn-big', text: t('Send order') });
    form.appendChild(submit);
    form.appendChild(msg);
    form.appendChild(el('button', { type: 'button', 'class': 'shop-link', text: '← ' + t('Back to cart'), onclick: renderCart }));
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.website.value) return; // bot filled the honeypot
      var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (i) { return !i.value.trim() || !i.checkValidity(); });
      if (bad.length) { msg.textContent = t('Please fill in the marked fields.'); bad[0].focus(); return; }
      var data = {};
      ['name', 'phone', 'email', 'address', 'note'].forEach(function (k) { data[k] = form.elements[k].value.trim(); });
      submitOrder(form.elements.method.value, data, msg, submit);
    });
    panel.appendChild(form);
    form.elements.name.focus();
  }

  function orderId() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    return 'O' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' +
      Math.random().toString(36).slice(2, 6).toUpperCase();
  }

  function orderText(id, c) {
    var tt = totals();
    var lines = [t('New order') + ' ' + id + ' — ' + CFG.shop, ''];
    cart.forEach(function (l) {
      lines.push(l.qty + ' × ' + l.title + (l.chosen.length ? ' (' + l.chosen.join(', ') + ')' : '') + ' — ' + money(l.price * l.qty));
    });
    lines.push('', t('Subtotal') + ': ' + money(tt.sub));
    if (CFG.shipping) lines.push(t('Shipping') + ': ' + (tt.ship ? money(tt.ship) : t('Free')));
    lines.push(t('Total') + ': ' + money(tt.total), '');
    [c.name, c.phone, c.email, c.address].forEach(function (v) { if (v) lines.push(v); });
    if (c.note) lines.push('', c.note);
    return lines.join('\n');
  }

  function submitOrder(method, customer, msg, button) {
    var id = orderId();
    if (method === 'whatsapp') {
      window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(orderText(id, customer)), '_blank', 'noopener');
      return done(id, t('WhatsApp opened with your order. Press send there to complete it.'), false);
    }
    if (method === 'email') {
      location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(t('Order') + ' ' + id) +
        '&body=' + encodeURIComponent(orderText(id, customer));
      return done(id, t('Your email app opened with the order. Press send there to complete it.'), false);
    }
    if (method === 'paypal') return paypal(id);
    // Apps Script endpoint: text/plain keeps it a "simple" request, so no CORS preflight.
    button.disabled = true;
    msg.textContent = t('Sending…');
    fetch(CFG.endpoint, {
      method: 'POST',
      body: JSON.stringify({ orderId: id, customer: customer, page: location.href,
        items: cart.map(function (l) { return { id: l.id, title: l.title, qty: l.qty, chosen: l.chosen, price: l.price, url: l.url }; }) })
    }).then(function (r) { return r.json(); }).then(function (res) {
      if (!res || !res.ok) throw new Error(res && res.error || 'failed');
      done(res.orderId || id, t('Thank you! Your order was received. Total') + ': ' + money(res.total), true);
    }).catch(function () {
      button.disabled = false;
      msg.textContent = t('Sorry, the order could not be sent.') + (CFG.whatsapp ? ' ' + t('Please choose WhatsApp instead.') : '');
    });
  }

  function paypal(id) {
    var f = el('form', { method: 'post', action: 'https://www.paypal.com/cgi-bin/webscr', target: '_top' });
    var add = function (k, v) { f.appendChild(el('input', { type: 'hidden', name: k, value: String(v) })); };
    add('cmd', '_cart'); add('upload', '1'); add('business', CFG.paypal);
    add('currency_code', CFG.currency); add('invoice', id); add('charset', 'utf-8');
    add('return', location.href.split('#')[0]);
    cart.forEach(function (l, n) {
      add('item_name_' + (n + 1), (l.title + (l.chosen.length ? ' (' + l.chosen.join(', ') + ')' : '')).slice(0, 127));
      add('amount_' + (n + 1), l.price.toFixed(2));
      add('quantity_' + (n + 1), l.qty);
    });
    var tt = totals();
    if (tt.ship) add('handling_cart', tt.ship.toFixed(2));
    document.body.appendChild(f);
    cart = []; save();
    f.submit();
  }

  function done(id, text, clear) {
    panel.textContent = '';
    panel.appendChild(header(t('Thank you')));
    panel.appendChild(el('p', { 'class': 'shop-done', text: text }));
    panel.appendChild(el('p', { text: t('Order number') + ': ' + id }));
    if (CFG.bank) panel.appendChild(el('p', { 'class': 'shop-note', text: t('Bank transfer') + ': ' + CFG.bank + ' — ' + t('Reference') + ': ' + id }));
    var clearBtn = el('button', { type: 'button', 'class': 'shop-btn', text: t('Clear cart'), onclick: function () { cart = []; save(); closeDrawer(); } });
    if (clear) { cart = []; save(); } else panel.appendChild(clearBtn);
  }

  // ------------------------------------------------------------ toast
  var toastEl, toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = el('div', { 'class': 'shop-toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = '';
    toastEl.appendChild(document.createTextNode(text + ' '));
    toastEl.appendChild(el('button', { type: 'button', 'class': 'shop-link', 'data-cart-open': '', text: t('View cart') }));
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3500);
  }

  // ------------------------------------------------------------ start
  // Price labels (_39, -49, !0) must not show up as categories in Label gadgets.
  function hidePriceLabels() {
    if (!CFG.labelPrices) return;
    Array.prototype.forEach.call(document.querySelectorAll('.Label li, .Label a, .shop-cat'), function (n) {
      if (/^[_\-!]\d[\d.,]*\s*(\(\d+\))?$/.test(n.textContent.trim())) n.hidden = true;
    });
  }

  function start() {
    hidePriceLabels();
    buildDrawer();
    enhanceCards();
    enhanceItem();
    renderCount();
    window.addEventListener('storage', function (e) {
      if (e.key !== KEY) return;
      try { cart = JSON.parse(e.newValue || '[]') || []; } catch (x) { cart = []; }
      renderCount();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
