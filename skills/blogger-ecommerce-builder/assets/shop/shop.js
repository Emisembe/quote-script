/* Blogger shop: product cards, product page, cart drawer, checkout, languages, reviews.
 * Vanilla JS: no libraries, no external CDN. Goes inside a CDATA-wrapped <script>
 * at the end of <body>, after the theme's own script.
 *
 * Reads:
 *   .shop-settings      HTML gadget text, one "key: value" per line (see settings-gadget.html)
 *   .shop-words         optional HTML gadget text, "English: Translation" per line,
 *                       "[de] English: Deutsch" for one language only
 *   .shop-card          product cards on list pages (see blog-includables.xml)
 *   .shop-item          the single product page wrapper
 *   .product[data-price] the product block inside each post body
 *   [data-lang]         content blocks shown only in that language
 *   [data-i18n]         theme text translated with the language packs
 *   [data-lang-switch]  where the language picker goes
 * Writes: localStorage "shop-cart-v1" and "shop-lang" (fail safe).
 */
(function () {
  'use strict';

  var doc = document;
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  function store(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) { /* private mode: nothing is remembered */ }
    return null;
  }

  // ------------------------------------------------------------ settings
  // Gadget text may use real line breaks, <br> or one <p>/<div> per line.
  function gadgetLines(selector) {
    var el = doc.querySelector(selector);
    if (!el) return [];
    var copy = el.cloneNode(true);
    each(copy.querySelectorAll('br, p, div, li'), function (n) { n.appendChild(doc.createTextNode('\n')); });
    return (copy.textContent || '').split(/\r?\n/);
  }

  var ALIASES = { e_mail: 'email', mail: 'email', google_sheet: 'order_endpoint', sheet: 'order_endpoint',
                  sheet_url: 'order_endpoint', order_url: 'order_endpoint', telegram_username: 'telegram',
                  lang: 'language', whatsapp_number: 'whatsapp' };

  // "Key: value" or "Key = value"; keys are case-insensitive, spaces/hyphens become "_".
  var S = {}, SHIP_LINES = [];
  gadgetLines('.shop-settings').forEach(function (line) {
    var m = /^\s*([A-Za-z][\w \-]*?)\s*[:=]\s*(.*?)\s*$/.exec(line);
    if (!m) return;
    var key = m[1].toLowerCase().replace(/[\s\-]+/g, '_');
    key = ALIASES[key] || key;
    if (key === 'ship_to') SHIP_LINES.push(m[2]);
    else S[key] = m[2];
  });

  var on = function (v) { return /^(yes|true|on|1|ja|oui)$/i.test(String(v || '').trim()); };
  var list = function (v) { return String(v || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); };

  // ------------------------------------------------------------ languages
  var PACKS = {
    de: {
      'Add to cart': 'In den Warenkorb', 'Choose options': 'Optionen wählen', 'Out of stock': 'Ausverkauft', 'Sale': 'Angebot',
      'Quantity': 'Menge', 'Choose': 'Bitte wählen', 'Please choose': 'Bitte wählen Sie', 'Cart': 'Warenkorb',
      'Checkout': 'Zur Kasse', 'Subtotal': 'Zwischensumme', 'Shipping': 'Versand', 'Free': 'Kostenlos', 'Total': 'Gesamt',
      'Free shipping from': 'Versandkostenfrei ab', 'Your cart is empty.': 'Ihr Warenkorb ist leer.',
      'Full name': 'Vor- und Nachname', 'Phone': 'Telefon', 'Email': 'E-Mail', 'Street and house number': 'Straße und Hausnummer',
      'Postcode': 'PLZ', 'City': 'Stadt', 'Country': 'Land', 'Other city…': 'Andere Stadt…', 'Note': 'Anmerkung',
      'How do you want to order?': 'Wie möchten Sie bestellen?', 'Send order': 'Zahlungspflichtig bestellen',
      'Back to cart': 'Zurück zum Warenkorb', 'Please fill in the marked fields.': 'Bitte füllen Sie die markierten Felder aus.',
      'added to cart': 'in den Warenkorb gelegt', 'View cart': 'Warenkorb ansehen', 'Only': 'Nur noch', 'in stock': 'auf Lager',
      'Thank you': 'Vielen Dank', 'Order number': 'Bestellnummer', 'Bank transfer': 'Überweisung', 'Reference': 'Verwendungszweck',
      'Clear cart': 'Warenkorb leeren', 'Ask on WhatsApp': 'Per WhatsApp fragen', 'Ask on Telegram': 'Per Telegram fragen',
      'Hi, I am interested in': 'Hallo, ich interessiere mich für', 'Place order (we confirm by email)': 'Bestellen (Bestätigung per E-Mail)',
      'Send order on WhatsApp': 'Bestellung per WhatsApp senden', 'Send order on Telegram': 'Bestellung per Telegram senden',
      'Pay with PayPal': 'Mit PayPal bezahlen', 'Send order by email': 'Bestellung per E-Mail senden', 'Sending…': 'Wird gesendet…',
      'New order': 'Neue Bestellung', 'Order': 'Bestellung', 'Customer': 'Kunde', 'Delivery address': 'Lieferadresse',
      'WhatsApp opened with your order. Press send there to complete it.': 'WhatsApp wurde mit Ihrer Bestellung geöffnet. Tippen Sie dort auf Senden, um sie abzuschließen.',
      'Your email app opened with the order. Press send there to complete it.': 'Ihr E-Mail-Programm wurde mit der Bestellung geöffnet. Bitte dort senden.',
      'Your order is copied. In Telegram, paste it into the chat and send it.': 'Ihre Bestellung wurde kopiert. Fügen Sie sie in Telegram in den Chat ein und senden Sie sie.',
      'Copy order again': 'Bestellung erneut kopieren', 'Copied': 'Kopiert', 'Open Telegram': 'Telegram öffnen',
      'Thank you! Your order was received. Total': 'Vielen Dank! Ihre Bestellung ist eingegangen. Gesamt',
      'Sorry, the order could not be sent.': 'Die Bestellung konnte leider nicht gesendet werden.',
      'Please choose another way to order.': 'Bitte wählen Sie einen anderen Bestellweg.',
      'Online ordering is not available yet. Please contact us.': 'Online-Bestellungen sind noch nicht möglich. Bitte kontaktieren Sie uns.',
      'Image': 'Bild', 'Video': 'Video', 'Close': 'Schließen', 'Remove': 'Entfernen',
      'Share': 'Teilen', 'Copy link': 'Link kopieren', 'Link copied': 'Link kopiert', 'Share on': 'Teilen auf',
      'Reviews': 'Bewertungen', 'Write a review': 'Bewertung schreiben', 'review': 'Bewertung', 'reviews': 'Bewertungen',
      'Rated': 'Bewertet mit', 'out of 5': 'von 5', 'based on': 'aus',
      'Start your review with a rating, for example 5/5 or ★★★★★.': 'Beginnen Sie Ihre Bewertung mit Sternen, z. B. 5/5 oder ★★★★★.',
      'Language': 'Sprache', 'Incl. VAT, plus shipping': 'inkl. MwSt., zzgl. Versand',
      'New arrivals': 'Neuheiten', 'Shop by category': 'Nach Kategorie einkaufen', 'Categories': 'Kategorien',
      'Popular products': 'Beliebte Produkte', 'Order directly': 'Direkt bestellen', 'Why shop with us': 'Warum bei uns kaufen',
      'New collection': 'Neue Kollektion', 'About the shop': 'Über den Shop', 'Customer service': 'Kundenservice',
      'Follow us': 'Folgen Sie uns', 'Home': 'Startseite', 'Women': 'Damen', 'Men': 'Herren', 'Contact': 'Kontakt',
      'Shop now': 'Jetzt einkaufen', 'See the sale': 'Zum Sale', 'Contact us': 'Kontakt aufnehmen',
      'Shipping & delivery': 'Versand & Lieferung', 'Returns (Widerruf)': 'Widerruf & Rückgabe', 'Privacy policy': 'Datenschutz',
      'Search products...': 'Produkte suchen...', 'Newer posts': 'Neuere Produkte', 'Older posts': 'Weitere Produkte',
      'Newer post': 'Vorheriges Produkt', 'Older post': 'Nächstes Produkt', 'Page not found': 'Seite nicht gefunden',
      'Back to home': 'Zur Startseite', 'Search': 'Suchen', 'Skip to content': 'Zum Inhalt springen',
      'Open menu': 'Menü öffnen', 'Features': 'Merkmale', 'Size guide': 'Größentabelle', 'Details': 'Details',
      'The page you were looking for has moved or no longer exists.': 'Die gesuchte Seite wurde verschoben oder existiert nicht mehr.',
      'No posts found here yet.': 'Hier gibt es noch keine Produkte.',
      'How will you pay?': 'Wie möchten Sie bezahlen?', 'Payment': 'Zahlung', 'Cash on delivery': 'Barzahlung bei Lieferung',
      'Cash on pickup': 'Barzahlung bei Abholung', 'Pay now with PayPal': 'Jetzt mit PayPal bezahlen',
      'Size': 'Größe', 'Colour': 'Farbe', 'Color': 'Farbe'
    },
    fr: {
      'Add to cart': 'Ajouter au panier', 'Choose options': 'Choisir les options', 'Out of stock': 'Épuisé', 'Sale': 'Promo',
      'Quantity': 'Quantité', 'Choose': 'Choisir', 'Please choose': 'Veuillez choisir', 'Cart': 'Panier',
      'Checkout': 'Commander', 'Subtotal': 'Sous-total', 'Shipping': 'Livraison', 'Free': 'Gratuite', 'Total': 'Total',
      'Free shipping from': 'Livraison gratuite dès', 'Your cart is empty.': 'Votre panier est vide.',
      'Full name': 'Nom complet', 'Phone': 'Téléphone', 'Email': 'E-mail', 'Street and house number': 'Rue et numéro',
      'Postcode': 'Code postal', 'City': 'Ville', 'Country': 'Pays', 'Other city…': 'Autre ville…', 'Note': 'Remarque',
      'How do you want to order?': 'Comment voulez-vous commander ?', 'Send order': 'Commander et payer',
      'Back to cart': 'Retour au panier', 'Please fill in the marked fields.': 'Veuillez remplir les champs marqués.',
      'added to cart': 'ajouté au panier', 'View cart': 'Voir le panier', 'Only': 'Plus que', 'in stock': 'en stock',
      'Thank you': 'Merci', 'Order number': 'Numéro de commande', 'Bank transfer': 'Virement bancaire', 'Reference': 'Référence',
      'Clear cart': 'Vider le panier', 'Ask on WhatsApp': 'Demander sur WhatsApp', 'Ask on Telegram': 'Demander sur Telegram',
      'Hi, I am interested in': 'Bonjour, je suis intéressé(e) par', 'Place order (we confirm by email)': 'Commander (confirmation par e-mail)',
      'Send order on WhatsApp': 'Envoyer la commande sur WhatsApp', 'Send order on Telegram': 'Envoyer la commande sur Telegram',
      'Pay with PayPal': 'Payer avec PayPal', 'Send order by email': 'Envoyer la commande par e-mail', 'Sending…': 'Envoi…',
      'New order': 'Nouvelle commande', 'Order': 'Commande', 'Customer': 'Client', 'Delivery address': 'Adresse de livraison',
      'WhatsApp opened with your order. Press send there to complete it.': 'WhatsApp s’est ouvert avec votre commande. Appuyez sur Envoyer pour la terminer.',
      'Your email app opened with the order. Press send there to complete it.': 'Votre messagerie s’est ouverte avec la commande. Envoyez-la pour terminer.',
      'Your order is copied. In Telegram, paste it into the chat and send it.': 'Votre commande est copiée. Collez-la dans la discussion Telegram et envoyez-la.',
      'Copy order again': 'Copier à nouveau', 'Copied': 'Copié', 'Open Telegram': 'Ouvrir Telegram',
      'Thank you! Your order was received. Total': 'Merci ! Votre commande a bien été reçue. Total',
      'Sorry, the order could not be sent.': 'Désolé, la commande n’a pas pu être envoyée.',
      'Please choose another way to order.': 'Veuillez choisir un autre moyen de commander.',
      'Online ordering is not available yet. Please contact us.': 'La commande en ligne n’est pas encore disponible. Contactez-nous.',
      'Image': 'Image', 'Video': 'Vidéo', 'Close': 'Fermer', 'Remove': 'Retirer',
      'Share': 'Partager', 'Copy link': 'Copier le lien', 'Link copied': 'Lien copié', 'Share on': 'Partager sur',
      'Reviews': 'Avis', 'Write a review': 'Écrire un avis', 'review': 'avis', 'reviews': 'avis',
      'Rated': 'Noté', 'out of 5': 'sur 5', 'based on': 'sur',
      'Start your review with a rating, for example 5/5 or ★★★★★.': 'Commencez votre avis par une note, par ex. 5/5 ou ★★★★★.',
      'Language': 'Langue', 'Incl. VAT, plus shipping': 'TVA incluse, hors livraison',
      'New arrivals': 'Nouveautés', 'Shop by category': 'Acheter par catégorie', 'Categories': 'Catégories',
      'Popular products': 'Produits populaires', 'Order directly': 'Commandez directement', 'Why shop with us': 'Pourquoi nous choisir',
      'New collection': 'Nouvelle collection', 'About the shop': 'À propos de la boutique', 'Customer service': 'Service client',
      'Follow us': 'Suivez-nous', 'Home': 'Accueil', 'Women': 'Femme', 'Men': 'Homme', 'Contact': 'Contact',
      'Shop now': 'Acheter', 'See the sale': 'Voir les promos', 'Contact us': 'Nous contacter',
      'Shipping & delivery': 'Livraison', 'Returns (Widerruf)': 'Retours et rétractation', 'Privacy policy': 'Confidentialité',
      'Search products...': 'Rechercher des produits...', 'Newer posts': 'Produits plus récents', 'Older posts': 'Plus de produits',
      'Newer post': 'Produit précédent', 'Older post': 'Produit suivant', 'Page not found': 'Page introuvable',
      'Back to home': 'Retour à l’accueil', 'Search': 'Rechercher', 'Skip to content': 'Aller au contenu',
      'Open menu': 'Ouvrir le menu', 'Features': 'Caractéristiques', 'Size guide': 'Guide des tailles', 'Details': 'Détails',
      'The page you were looking for has moved or no longer exists.': 'La page que vous cherchez a été déplacée ou n’existe plus.',
      'No posts found here yet.': 'Aucun produit pour le moment.',
      'How will you pay?': 'Comment voulez-vous payer ?', 'Payment': 'Paiement', 'Cash on delivery': 'Paiement à la livraison',
      'Cash on pickup': 'Paiement au retrait', 'Pay now with PayPal': 'Payer maintenant avec PayPal',
      'Size': 'Taille', 'Colour': 'Couleur', 'Color': 'Couleur'
    }
  };

  // Owner words: "English: Translation" for every language, "[de] English: Deutsch" for one.
  var WORDS = { '*': {} };
  gadgetLines('.shop-words').forEach(function (line) {
    var m = /^\s*(?:\[([a-z]{2})\]\s*)?([^:]+?)\s*:\s*(.+?)\s*$/i.exec(line);
    if (!m) return;
    var lang = (m[1] || '*').toLowerCase();
    (WORDS[lang] = WORDS[lang] || {})[m[2]] = m[3];
  });

  var LANGS = list(S.languages).map(function (l) { return l.toLowerCase().slice(0, 2); });
  var LANG = (S.language || 'en').toLowerCase().slice(0, 2);
  var saved = store('shop-lang');
  if (saved && LANGS.indexOf(saved) > -1) LANG = saved;

  function t(text) {
    var own = WORDS[LANG] || {};
    return own[text] || WORDS['*'][text] || (PACKS[LANG] || {})[text] || text;
  }

  var CFG = {
    currency: (S.currency || 'EUR').toUpperCase(),
    locale: S.locale || LANG, // number and currency format only
    shop: S.shop_name || ((doc.querySelector('.brand-name') || {}).textContent || doc.title).trim(),
    whatsapp: (S.whatsapp || '').replace(/[^\d]/g, ''),
    telegram: (S.telegram || '').replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@/, '').replace(/[^\w]/g, ''),
    email: S.email || '',
    endpoint: /^https:\/\//.test(S.order_endpoint || '') ? S.order_endpoint : '',
    placeOrder: S.place_order === undefined ? true : on(S.place_order),
    // "paypal: yourname" (or a paypal.me link) = PayPal.Me with the amount filled in; an email = classic PayPal cart.
    paypalMe: /@/.test(S.paypal || '') ? '' : (S.paypal || '').replace(/^https?:\/\/(www\.)?(paypal\.me|paypal\.com\/paypalme)\//i, '').split(/[/?#\s]/)[0],
    paypalEmail: /@/.test(S.paypal || '') ? S.paypal.trim() : '',
    bank: S.bank || '',
    shipping: parseNumber(S.shipping) || 0,
    freeOver: parseNumber(S.free_shipping_over) || 0,
    taxNote: S.tax_note || '',
    defaultCountry: S.default_country || '',
    labelPrices: on(S.label_prices) // also read SpotCommerce-style labels: _39 -49 !0
  };

  // How the buyer pays: "payment: Bank transfer, PayPal, Cash on delivery". Without it: what the settings allow.
  CFG.payments = list(S.payment || S.payments);
  if (!CFG.payments.length) {
    if (CFG.bank) CFG.payments.push('Bank transfer');
    if (CFG.paypalMe || CFG.paypalEmail) CFG.payments.push('PayPal');
  }
  var isPayPal = function (p) { return /paypal/i.test(p || ''); };
  var isBank = function (p) { return /bank|transfer|überweis|virement/i.test(p || ''); };

  // ship_to: Germany = Berlin, Hamburg     ship_to: Austria (9,90) = Vienna     ship_to: Switzerland (14)
  var SHIP_TO = SHIP_LINES.map(function (line) {
    var m = /^([^=(]+?)\s*(?:\(([^)]*)\))?\s*(?:=\s*(.*))?$/.exec(line);
    if (!m || !m[1].trim()) return null;
    return { country: m[1].trim(), fee: parseNumber(m[2]), cities: list(m[3]) };
  }).filter(Boolean);

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
    var node = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') node.textContent = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] !== null && attrs[k] !== undefined) node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
    });
    return node;
  }

  function svg(path, opts) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = doc.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('width', '20');
    s.setAttribute('height', '20');
    s.setAttribute('aria-hidden', 'true');
    var p = doc.createElementNS(ns, 'path');
    p.setAttribute('d', path);
    if (opts === 'stroke') {
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', 'currentColor');
      p.setAttribute('stroke-width', '2');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
    } else {
      p.setAttribute('fill', 'currentColor');
    }
    s.appendChild(p);
    return s;
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

  function youtubeId(url) {
    var m = /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/.exec(url || '');
    return m ? m[1] : '';
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
    }
    return Promise.resolve(legacyCopy(text));
  }
  function legacyCopy(text) {
    var area = el('textarea', { 'class': 'shop-hp', readonly: 'readonly' });
    area.value = text;
    doc.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = doc.execCommand('copy'); } catch (e) { ok = false; }
    area.remove();
    return ok;
  }

  // ------------------------------------------------------------ product data
  // <div class="product" data-price="39" data-old-price="49" data-stock="12" data-sku="TS-01"
  //      data-options="Size: S, M, L | Colour: Red, Black" data-video="https://youtu.be/...">Price: 39 EUR</div>
  function parseOptions(text) {
    return String(text || '').split('|').map(function (group) {
      var i = group.indexOf(':');
      if (i < 1) return null;
      var values = group.slice(i + 1).split(',').map(function (v) { return v.trim(); }).filter(Boolean);
      return values.length ? { name: group.slice(0, i).trim(), values: values } : null;
    }).filter(Boolean);
  }

  function productFrom(root, labels) {
    var p = { price: NaN, oldPrice: NaN, stock: NaN, sku: '', options: [], videos: [] };
    var block = root && root.querySelector ? root.querySelector('.product[data-price]') : null;
    if (block) {
      p.price = parseNumber(block.getAttribute('data-price'));
      p.oldPrice = parseNumber(block.getAttribute('data-old-price'));
      p.stock = parseNumber(block.getAttribute('data-stock'));
      p.sku = block.getAttribute('data-sku') || '';
      p.options = parseOptions(block.getAttribute('data-options'));
      p.videos = list(block.getAttribute('data-video')).map(youtubeId).filter(Boolean);
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
      box.appendChild(doc.createTextNode(' '));
    }
    box.appendChild(el('span', { 'class': 'shop-price-now', text: money(p.price) }));
    return box;
  }

  function soldOut(p) { return !isNaN(p.stock) && p.stock <= 0; }

  // ------------------------------------------------------------ cart store
  var KEY = 'shop-cart-v1';
  var cart = [];
  try { cart = JSON.parse(store(KEY) || '[]') || []; } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  function save() {
    store(KEY, JSON.stringify(cart));
    renderCount();
    if (drawer && drawer.getAttribute('data-open') === 'true' && panel.getAttribute('data-view') === 'cart') renderCart();
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
                  : item.title + ' — ' + t('added to cart'), true);
  }

  // Shipping: the chosen country's fee from "ship_to", else the general "shipping" fee.
  function shippingFor(country) {
    var dest = SHIP_TO.filter(function (d) { return d.country === country; })[0];
    return dest && !isNaN(dest.fee) ? dest.fee : CFG.shipping;
  }

  function totals(country) {
    var sub = cart.reduce(function (s, l) { return s + l.price * l.qty; }, 0);
    var fee = shippingFor(country);
    var ship = cart.length && fee && !(CFG.freeOver && sub >= CFG.freeOver) ? fee : 0;
    return { sub: sub, ship: ship, hasFee: !!fee, total: sub + ship,
             count: cart.reduce(function (s, l) { return s + l.qty; }, 0) };
  }

  // ------------------------------------------------------------ list cards
  function enhanceCards() {
    each(doc.querySelectorAll('.shop-card'), function (card) {
      var src = card.querySelector('template.shop-src');
      var p = productFrom(src ? src.content : card, labelsOf(card));
      var slot = card.querySelector('.shop-card-buy');
      if (!p || !slot) return;
      card.classList.add('is-product');
      var img = card.querySelector('.shop-card-media img');
      if (img) img.src = sized(img.getAttribute('src'), 600); // full product, no crop
      if (!isNaN(p.oldPrice)) {
        var pct = Math.round((1 - p.price / p.oldPrice) * 100);
        card.appendChild(el('span', { 'class': 'shop-badge', text: pct >= 5 ? '−' + pct + '%' : t('Sale') }));
      }
      if (!soldOut(p) && !isNaN(p.stock) && p.stock <= 3) {
        card.appendChild(el('span', { 'class': 'shop-badge shop-badge-low', text: t('Only') + ' ' + p.stock + ' ' + t('in stock') }));
      }
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
    var item = doc.querySelector('.shop-item');
    if (!item) return;
    // A post whose HTML closes more <div>s than it opens pushes the reviews and the sidebar out of the page
    // frame. Put them back and tell the owner in the console.
    var reviews = doc.querySelector('.shop-reviews');
    var grid = doc.querySelector('.main-grid');
    var side = doc.querySelector('aside.sidebar');
    if ((reviews && !item.contains(reviews)) || (grid && side && !grid.contains(side))) {
      if (reviews && !item.contains(reviews)) item.appendChild(reviews);
      if (grid && side && !grid.contains(side)) grid.appendChild(side);
      console.warn('[shop] This post has an extra closing tag (</div>) in its HTML. The page was repaired; please check the post in HTML view.');
    }
    var body = item.querySelector('.post-body') || item;
    var p = productFrom(body, labelsOf(item));
    var slot = item.querySelector('.shop-buy');
    enhanceShare(item);
    var rating = enhanceReviews(item);
    if (!p || !slot) return;
    item.classList.add('is-product');
    var block = body.querySelector('.product[data-price]');
    if (block) block.hidden = true;

    var title = (item.getAttribute('data-title') || (item.querySelector('h1') || {}).textContent || '').trim();
    var url = item.getAttribute('data-url') || location.href.split(/[?#]/)[0];
    var media = collectMedia(body, p);
    var images = media.filter(function (m) { return m.type === 'image'; }).map(function (m) { return m.src; });
    var image = item.getAttribute('data-image') || images[0] || '';

    buildGallery(item, media);

    if (rating.count) {
      slot.appendChild(el('a', { 'class': 'shop-rating', href: '#comments' }, [
        stars(rating.avg), ' ' + rating.avg.toFixed(1) + ' (' + rating.count + ' ' + t(rating.count === 1 ? 'review' : 'reviews') + ')'
      ]));
    }
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
      if (!isNaN(p.stock) && p.stock <= 3) slot.appendChild(el('p', { 'class': 'shop-low', text: t('Only') + ' ' + p.stock + ' ' + t('in stock') }));
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
          var chosen = selects.map(function (s, n) { return t(p.options[n].name) + ': ' + s.value; });
          var n = Math.max(1, parseInt(qty.value, 10) || 1);
          addToCart({ id: item.getAttribute('data-id'), title: title, url: url,
                      image: image, price: p.price, stock: p.stock, sku: p.sku, chosen: chosen }, n);
        }
      }));
      slot.appendChild(msg);
    }
    var ask = el('div', { 'class': 'shop-ask' });
    var hello = t('Hi, I am interested in') + ' ' + title + ' ' + url;
    if (CFG.whatsapp) {
      ask.appendChild(el('a', { 'class': 'shop-btn shop-btn-ghost shop-btn-wa', target: '_blank', rel: 'noopener',
        href: 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(hello) }, [svg(ICONS.whatsapp), ' ' + t('Ask on WhatsApp')]));
    }
    if (CFG.telegram) {
      ask.appendChild(el('a', { 'class': 'shop-btn shop-btn-ghost shop-btn-tg', target: '_blank', rel: 'noopener',
        href: 'https://t.me/' + CFG.telegram }, [svg(ICONS.telegram), ' ' + t('Ask on Telegram')]));
    }
    if (ask.children.length) slot.appendChild(ask);

    // Product structured data for Google (rich results with price, stock and rating).
    var ld = {
      '@context': 'https://schema.org', '@type': 'Product', name: title,
      image: images.slice(0, 5), url: url,
      offers: {
        '@type': 'Offer', priceCurrency: CFG.currency, price: p.price.toFixed(2),
        availability: soldOut(p) ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: url
      }
    };
    if (p.sku) ld.sku = p.sku;
    if (rating.count) ld.aggregateRating = { '@type': 'AggregateRating', ratingValue: rating.avg.toFixed(1), reviewCount: rating.count };
    var desc = item.querySelector('meta[itemprop=description]') || doc.querySelector('meta[name=description]');
    if (desc && desc.content) ld.description = desc.content;
    doc.head.appendChild(el('script', { type: 'application/ld+json', text: JSON.stringify(ld) }));
  }

  // Photos and videos for the gallery. Anything inside .keep, .photo-grid, .photo-row or .photo-wide
  // (or .two-cols, or a language block) stays in the description where the owner placed it.
  var KEEP = '.keep, .photo-grid, .photo-row, .photo-wide, .video-wide, .two-cols, [data-lang]';
  function collectMedia(body, p) {
    var media = [];
    each(body.querySelectorAll('img'), function (img) {
      if (img.closest(KEEP) || !img.src || /^http:/.test(img.src)) return;
      media.push({ type: 'image', src: img.src, node: img });
    });
    p.videos.forEach(function (id) { media.push({ type: 'video', id: id }); });
    each(body.querySelectorAll('iframe'), function (frame) {
      var id = youtubeId(frame.src);
      if (!id || frame.closest(KEEP) || p.videos.indexOf(id) > -1) return;
      media.push({ type: 'video', id: id, node: frame });
    });
    return media;
  }

  function buildGallery(item, media) {
    var target = item.querySelector('.shop-gallery');
    if (!target || !media.length) return;
    // The gallery now shows these, so hide their original blocks in the description.
    media.forEach(function (m) {
      if (!m.node) return;
      var box = m.node.closest('.separator') || m.node.closest('a') || m.node;
      if (!box.textContent.trim() || box === m.node) box.hidden = true;
    });
    var stage = el('div', { 'class': 'shop-gallery-main' });
    target.appendChild(stage);
    var thumbs = [];
    function show(n, autoplay) {
      var m = media[n];
      stage.textContent = '';
      if (m.type === 'image') {
        stage.appendChild(el('img', { src: sized(m.src, 1000), alt: '' }));
      } else {
        stage.appendChild(el('iframe', {
          src: 'https://www.youtube-nocookie.com/embed/' + m.id + '?rel=0' + (autoplay ? '&autoplay=1' : ''),
          title: t('Video'), allow: 'autoplay; encrypted-media; picture-in-picture', allowfullscreen: 'allowfullscreen',
          loading: 'lazy'
        }));
      }
      thumbs.forEach(function (b, i) { b.setAttribute('aria-current', i === n ? 'true' : 'false'); });
    }
    if (media.length > 1) {
      var row = el('div', { 'class': 'shop-gallery-thumbs' });
      media.slice(0, 10).forEach(function (m, n) {
        var pic = m.type === 'image' ? sized(m.src, 160) : 'https://img.youtube.com/vi/' + m.id + '/mqdefault.jpg';
        var b = el('button', {
          type: 'button', 'class': m.type === 'video' ? 'is-video' : '',
          'aria-label': t(m.type === 'video' ? 'Video' : 'Image') + ' ' + (n + 1),
          onclick: function () { show(n, true); }
        }, [el('img', { src: pic, alt: '', loading: 'lazy' })]);
        thumbs.push(b);
        row.appendChild(b);
      });
      target.appendChild(row);
    }
    show(0, false);
  }

  // ------------------------------------------------------------ share buttons
  var ICONS = {
    whatsapp: 'M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5zm5.3 13.3c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.1z',
    telegram: 'M21.6 3.4 2.9 10.6c-1.3.5-1.3 1.2-.2 1.6l4.8 1.5 1.8 5.6c.2.6.4.8.8.8s.6-.2.9-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.9-1.3-1.5zM9.4 14.4l-.3 3.6-1.3-4.4 9.4-5.9-7.8 6.7z',
    facebook: 'M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1v1.9H8v3.2h2.6V21H14v-9.3h2.6l.4-3.2z',
    x: 'M17.8 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.8 3h6.4l4.4 5.8zm-1.1 16.2h1.7L7.3 4.7H5.5z',
    pinterest: 'M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.2-5s-.3-.6-.3-1.5c0-1.4.8-2.4 1.8-2.4.9 0 1.3.6 1.3 1.4 0 .9-.6 2.2-.9 3.4-.2 1 .5 1.9 1.6 1.9 1.9 0 3.3-2 3.3-4.9 0-2.5-1.8-4.3-4.4-4.3-3 0-4.8 2.3-4.8 4.6 0 .9.4 1.9.8 2.4.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.8-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z',
    link: 'M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1',
    share: 'M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v7h14v-7'
  };

  function enhanceShare(item) {
    var box = item.querySelector('.shop-share');
    if (!box) return;
    var url = item.getAttribute('data-url') || location.href.split(/[?#]/)[0];
    var title = (item.getAttribute('data-title') || doc.title).trim();
    var u = encodeURIComponent(url), tx = encodeURIComponent(title);
    var edit = box.querySelector('.item-control, .quick-edit-link');
    box.textContent = '';
    box.classList.add('is-ready');
    box.appendChild(el('span', { 'class': 'shop-share-label', text: t('Share') }));
    var row = el('div', { 'class': 'shop-share-row' });
    var nets = [
      ['whatsapp', 'WhatsApp', 'https://api.whatsapp.com/send?text=' + tx + '%20' + u],
      ['telegram', 'Telegram', 'https://t.me/share/url?url=' + u + '&text=' + tx],
      ['facebook', 'Facebook', 'https://www.facebook.com/sharer/sharer.php?u=' + u],
      ['x', 'X', 'https://twitter.com/intent/tweet?url=' + u + '&text=' + tx],
      ['pinterest', 'Pinterest', 'https://pinterest.com/pin/create/button/?url=' + u + '&description=' + tx]
    ];
    if (navigator.share) {
      row.appendChild(el('button', { type: 'button', 'class': 'shop-net shop-net-share', 'aria-label': t('Share'), title: t('Share'),
        onclick: function () { navigator.share({ title: title, url: url }).catch(function () {}); } }, [svg(ICONS.share, 'stroke')]));
    }
    nets.forEach(function (n) {
      row.appendChild(el('a', { 'class': 'shop-net shop-net-' + n[0], href: n[2], target: '_blank', rel: 'nofollow noopener',
        'aria-label': t('Share on') + ' ' + n[1], title: n[1] }, [svg(ICONS[n[0]])]));
    });
    row.appendChild(el('button', { type: 'button', 'class': 'shop-net shop-net-link', 'aria-label': t('Copy link'), title: t('Copy link'),
      onclick: function () { copyText(url).then(function () { toast(t('Link copied')); }); } }, [svg(ICONS.link, 'stroke')]));
    box.appendChild(row);
    if (edit) box.appendChild(edit);
  }

  // ------------------------------------------------------------ reviews (Blogger comments)
  // A comment starting with "★★★★☆", "4/5", "Rating: 4" or "4 stars" counts as a rated review.
  var RATING = /^\s*(?:(★{1,5})☆{0,4}|([1-5](?:[.,]5)?)\s*\/\s*5|(?:rating|bewertung|note)\s*[:=]?\s*([1-5](?:[.,]5)?)|([1-5])\s*(?:stars?|sterne?|étoiles?))\s*[.:\-–—]?\s*/i;

  function stars(value) {
    var box = el('span', { 'class': 'shop-stars', role: 'img', 'aria-label': t('Rated') + ' ' + value.toFixed(1) + ' ' + t('out of 5') });
    var fill = el('span', { 'class': 'shop-stars-fill', style: 'width:' + (value / 5 * 100).toFixed(0) + '%' });
    fill.textContent = '★★★★★';
    box.appendChild(doc.createTextNode('★★★★★'));
    box.appendChild(fill);
    return box;
  }

  function enhanceReviews(scope) {
    var result = { count: 0, avg: 0 };
    var wrap = scope.querySelector('.shop-reviews') || scope;
    var title = wrap.querySelector('.comments-title, #comments > h4');
    if (!title) return result;
    var total = 0;
    each(wrap.querySelectorAll('.comment-content, dd.comment-body > p, dd.comment-body'), function (body) {
      if (body.matches('dd.comment-body') && body.querySelector('p')) return;
      var first = body.firstChild;
      while (first && first.nodeType === 3 && !first.nodeValue.trim()) first = first.nextSibling;
      if (!first || first.nodeType !== 3) return;
      var m = RATING.exec(first.nodeValue);
      if (!m) return;
      var value = m[1] ? m[1].length : parseNumber(m[2] || m[3] || m[4]);
      if (!(value >= 1 && value <= 5)) return;
      first.nodeValue = first.nodeValue.slice(m[0].length);
      body.insertBefore(stars(value), body.firstChild);
      body.closest('li, dd') && body.closest('li, dd').classList.add('is-rated');
      result.count++;
      total += value;
    });
    if (result.count) result.avg = total / result.count;
    var n = parseInt((title.textContent.match(/\d+/) || ['0'])[0], 10);
    title.textContent = t('Reviews') + ' (' + n + ')';
    if (result.count) {
      title.parentNode.insertBefore(el('div', { 'class': 'shop-review-summary' }, [
        el('strong', { text: result.avg.toFixed(1) }), stars(result.avg),
        el('span', { text: t('based on') + ' ' + result.count + ' ' + t(result.count === 1 ? 'review' : 'reviews') })
      ]), title.nextSibling);
    }
    var post = wrap.querySelector('#comment-post-message');
    if (post) {
      post.textContent = t('Write a review');
      post.parentNode.insertBefore(el('p', { 'class': 'shop-note', text: t('Start your review with a rating, for example 5/5 or ★★★★★.') }), post.nextSibling);
    }
    return result;
  }

  // ------------------------------------------------------------ drawer
  var drawer, panel, lastFocus;

  function renderCount() {
    var n = totals().count;
    each(doc.querySelectorAll('[data-cart-count]'), function (b) {
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
    doc.body.appendChild(drawer);
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') closeDrawer();
    });
    doc.addEventListener('click', function (e) {
      var open = e.target.closest && e.target.closest('[data-cart-open]');
      if (open) { e.preventDefault(); openDrawer(); }
    });
    if (location.hash === '#cart') openDrawer();
  }

  function openDrawer() {
    lastFocus = doc.activeElement;
    drawer.hidden = false;
    drawer.setAttribute('data-open', 'true');
    doc.documentElement.classList.add('shop-locked');
    renderCart();
    panel.focus();
  }

  function closeDrawer() {
    drawer.setAttribute('data-open', 'false');
    drawer.hidden = true;
    doc.documentElement.classList.remove('shop-locked');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function header(title, view) {
    panel.textContent = '';
    panel.setAttribute('data-view', view);
    panel.appendChild(el('div', { 'class': 'shop-panel-head' }, [
      el('h2', { text: title }),
      el('button', { type: 'button', 'class': 'shop-x', 'aria-label': t('Close'), text: '×', onclick: closeDrawer })
    ]));
  }

  function sumRows(tt) {
    var rows = [[t('Subtotal'), money(tt.sub)]];
    if (tt.hasFee) rows.push([t('Shipping'), tt.ship ? money(tt.ship) : t('Free')]);
    rows.push([t('Total'), money(tt.total)]);
    return el('dl', { 'class': 'shop-sum' }, rows.reduce(function (a, r) {
      return a.concat([el('dt', { text: r[0] }), el('dd', { text: r[1] })]);
    }, []));
  }

  function renderCart() {
    header(t('Cart'), 'cart');
    if (!cart.length) {
      panel.appendChild(el('p', { 'class': 'shop-empty', text: t('Your cart is empty.') }));
      return;
    }
    var lines = el('ul', { 'class': 'shop-lines' });
    cart.forEach(function (l) {
      var qty = el('input', { type: 'number', min: '0', value: String(l.qty), 'aria-label': t('Quantity') + ': ' + l.title,
        onchange: function () {
          var n = Math.max(0, parseInt(qty.value, 10) || 0);
          if (n === 0) cart = cart.filter(function (x) { return x !== l; }); else l.qty = n;
          save();
        } });
      lines.appendChild(el('li', { 'class': 'shop-line' }, [
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
    panel.appendChild(lines);
    var tt = totals(SHIP_TO.length ? SHIP_TO[0].country : '');
    panel.appendChild(sumRows(tt));
    if (CFG.freeOver && tt.hasFee && tt.sub < CFG.freeOver) {
      panel.appendChild(el('p', { 'class': 'shop-note', text: t('Free shipping from') + ' ' + money(CFG.freeOver) }));
    }
    panel.appendChild(el('button', { type: 'button', 'class': 'shop-btn shop-btn-big', text: t('Checkout'), onclick: renderCheckout }));
  }

  // ------------------------------------------------------------ checkout
  function methods() {
    var m = [];
    if (CFG.endpoint && CFG.placeOrder) m.push(['order', t('Place order (we confirm by email)')]);
    if (CFG.whatsapp) m.push(['whatsapp', t('Send order on WhatsApp')]);
    if (CFG.telegram) m.push(['telegram', t('Send order on Telegram')]);
    if (CFG.email) m.push(['email', t('Send order by email')]);
    if (!m.length && (CFG.paypalMe || CFG.paypalEmail)) m.push(['paypal', t('Pay with PayPal')]);
    return m;
  }

  function field(name, label, type, required, extra) {
    var id = 'shop-f-' + name;
    var input = type === 'textarea'
      ? el('textarea', { id: id, name: name, rows: '2' })
      : el('input', Object.assign({ id: id, name: name, type: type || 'text' }, extra || {}));
    if (required) input.required = true;
    return el('label', { 'class': 'shop-field shop-f-' + name, 'for': id }, [el('span', { text: t(label) + (required ? ' *' : '') }), input]);
  }

  // Every country from the browser's own list, named in the shop language.
  var REGIONS = 'AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP KE KG KH KM KN KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MK ML MM MN MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP NZ OM PA PE PG PH PK PL PS PT PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT TW TZ UA UG US UY UZ VC VE VN VU WS YE ZA ZM ZW'.split(' ');
  function countryNames() {
    if (SHIP_TO.length) return SHIP_TO.map(function (d) { return d.country; });
    var names;
    try {
      var dn = new Intl.DisplayNames([LANG], { type: 'region' });
      names = REGIONS.map(function (c) { return dn.of(c); });
    } catch (e) {
      names = REGIONS;
    }
    return names.sort(function (a, b) { return a.localeCompare(b, LANG); });
  }
  function defaultCountry(names) {
    var want = CFG.defaultCountry;
    if (!want) return SHIP_TO.length === 1 ? names[0] : '';
    if (/^[A-Z]{2}$/i.test(want)) {
      try { want = new Intl.DisplayNames([LANG], { type: 'region' }).of(want.toUpperCase()); } catch (e) { /* keep code */ }
    }
    return names.indexOf(want) > -1 ? want : '';
  }

  function addressFields(form, onCountry) {
    var names = countryNames();
    var country = el('select', { id: 'shop-f-country', name: 'country', required: 'required', autocomplete: 'country-name' },
      [el('option', { value: '', text: t('Choose') + '…' })].concat(names.map(function (n) { return el('option', { value: n, text: n }); })));
    country.value = defaultCountry(names);
    var cityBox = el('div', { 'class': 'shop-field shop-f-city' });
    var postcode = field('postcode', 'Postcode', 'text', true, { autocomplete: 'postal-code' });
    var row = el('div', { 'class': 'shop-row' }, [postcode, cityBox]);
    function drawCity() {
      // Keep what the buyer already typed when they change the country.
      var before = cityBox.querySelector('input:not([hidden])');
      var typed = before ? before.value : '';
      cityBox.textContent = '';
      var dest = SHIP_TO.filter(function (d) { return d.country === country.value; })[0];
      var label = el('label', { 'for': 'shop-f-city' }, [el('span', { text: t('City') + ' *' })]);
      cityBox.appendChild(label);
      var text = el('input', { id: 'shop-f-city-other', name: 'city_other', type: 'text', autocomplete: 'address-level2' });
      if (dest && dest.cities.length) {
        var pick = el('select', { id: 'shop-f-city', name: 'city', required: 'required' },
          [el('option', { value: '', text: t('Choose') + '…' })]
            .concat(dest.cities.map(function (c) { return el('option', { value: c, text: c }); }))
            .concat([el('option', { value: '*', text: t('Other city…') })]));
        cityBox.appendChild(pick);
        text.hidden = true;
        text.setAttribute('aria-label', t('City'));
        pick.addEventListener('change', function () {
          text.hidden = pick.value !== '*';
          text.required = pick.value === '*';
          if (!text.hidden) text.focus();
        });
        cityBox.appendChild(text);
      } else {
        text.id = 'shop-f-city';
        text.name = 'city';
        text.required = true;
        text.value = typed;
        cityBox.appendChild(text);
      }
      onCountry(country.value);
    }
    country.addEventListener('change', drawCity);
    form.appendChild(field('street', 'Street and house number', 'text', true, { autocomplete: 'street-address' }));
    form.appendChild(row);
    form.appendChild(el('label', { 'class': 'shop-field shop-f-country', 'for': 'shop-f-country' }, [el('span', { text: t('Country') + ' *' }), country]));
    drawCity();
  }

  function renderCheckout() {
    header(t('Checkout'), 'checkout');
    var ways = methods();
    if (!ways.length) {
      panel.appendChild(el('p', { 'class': 'shop-msg', text: t('Online ordering is not available yet. Please contact us.') }));
      panel.appendChild(el('p', { 'class': 'shop-note', text: 'Shop owner: Layout › Shop settings › add whatsapp, telegram, email, paypal or google_sheet.' }));
      return;
    }
    var form = el('form', { 'class': 'shop-form', novalidate: 'novalidate' }, [
      field('name', 'Full name', 'text', true, { autocomplete: 'name' }),
      field('phone', 'Phone', 'tel', true, { autocomplete: 'tel' }),
      field('email', 'Email', 'email', CFG.endpoint && CFG.placeOrder && ways[0][0] === 'order', { autocomplete: 'email' })
    ]);
    var sumBox = el('div', { 'class': 'shop-sum-box' });
    var chosenCountry = '';
    addressFields(form, function (c) {
      chosenCountry = c;
      sumBox.textContent = '';
      sumBox.appendChild(sumRows(totals(c)));
    });
    form.appendChild(field('note', 'Note', 'textarea', false));
    form.appendChild(el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'class': 'shop-hp', 'aria-hidden': 'true' }));
    var fs = el('fieldset', { 'class': 'shop-methods' }, [el('legend', { text: t('How do you want to order?') })]);
    ways.forEach(function (m, n) {
      fs.appendChild(el('label', { 'class': 'shop-method shop-method-' + m[0] }, [
        el('input', { type: 'radio', name: 'method', value: m[0], checked: n === 0 ? 'checked' : false }), ' ' + m[1]]));
    });
    form.appendChild(fs);
    var pays = CFG.payments.filter(function () { return ways[0][0] !== 'paypal'; });
    if (pays.length) {
      var pfs = el('fieldset', { 'class': 'shop-methods shop-payments' }, [el('legend', { text: t('How will you pay?') })]);
      pays.forEach(function (pay, n) {
        pfs.appendChild(el('label', { 'class': 'shop-method' }, [
          el('input', { type: 'radio', name: 'payment', value: pay, checked: n === 0 ? 'checked' : false }), ' ' + t(pay)]));
      });
      form.appendChild(pfs);
    }
    form.appendChild(sumBox);
    var msg = el('p', { 'class': 'shop-msg', role: 'status' });
    var submit = el('button', { type: 'submit', 'class': 'shop-btn shop-btn-big', text: t('Send order') });
    form.appendChild(submit);
    form.appendChild(msg);
    form.appendChild(el('button', { type: 'button', 'class': 'shop-link', text: '← ' + t('Back to cart'), onclick: renderCart }));
    form.addEventListener('change', function (e) {
      // Email is required only when the shop itself sends the confirmation.
      if (e.target.name === 'method') form.elements.email.required = e.target.value === 'order';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.website.value) return; // bot filled the honeypot
      var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (i) {
        return !i.hidden && (!i.value.trim() || !i.checkValidity());
      });
      if (bad.length) { msg.textContent = t('Please fill in the marked fields.'); bad[0].focus(); return; }
      var city = form.elements.city.value === '*' ? form.elements.city_other.value : form.elements.city.value;
      var data = { country: chosenCountry, city: city.trim() };
      ['name', 'phone', 'email', 'street', 'postcode', 'note'].forEach(function (k) { data[k] = form.elements[k].value.trim(); });
      data.address = data.street + ', ' + data.postcode + ' ' + data.city + ', ' + data.country;
      data.payment = form.elements.payment ? form.elements.payment.value : (form.elements.method.value === 'paypal' ? 'PayPal' : '');
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

  // The order as a message for WhatsApp, Telegram and email (plain: no *bold* markers, for email).
  function orderText(id, c, plain) {
    var tt = totals(c.country);
    var rule = '────────────────';
    var lines = ['🛍️ ' + t('New order').toUpperCase() + ' #' + id, CFG.shop, rule];
    cart.forEach(function (l) {
      lines.push(l.qty + ' × ' + l.title);
      if (l.chosen.length) lines.push('   ' + l.chosen.join(' · '));
      lines.push('   ' + money(l.price) + (l.qty > 1 ? ' × ' + l.qty + ' = ' + money(l.price * l.qty) : ''));
      if (l.url) lines.push('   ' + l.url);
    });
    lines.push(rule, t('Subtotal') + ': ' + money(tt.sub));
    if (tt.hasFee) lines.push(t('Shipping') + (c.country ? ' (' + c.country + ')' : '') + ': ' + (tt.ship ? money(tt.ship) : t('Free')));
    var star = plain ? '' : '*';
    lines.push(star + t('Total') + ': ' + money(tt.total) + star);
    if (c.payment) lines.push('💳 ' + t('Payment') + ': ' + t(c.payment));
    lines.push(rule, '👤 ' + c.name, '📞 ' + c.phone);
    if (c.email) lines.push('✉️ ' + c.email);
    lines.push('📍 ' + c.street, '    ' + c.postcode + ' ' + c.city, '    ' + c.country);
    if (c.note) lines.push('📝 ' + c.note);
    if (CFG.bank && (isBank(c.payment) || !CFG.payments.length)) lines.push(rule, t('Bank transfer') + ': ' + CFG.bank, t('Reference') + ': ' + id);
    return lines.join('\n');
  }

  function payload(id, method, customer) {
    var tt = totals(customer.country);
    return JSON.stringify({ orderId: id, method: method, customer: customer, page: location.href, lang: LANG,
      shipping: tt.ship, total: tt.total,
      items: cart.map(function (l) { return { id: l.id, title: l.title, qty: l.qty, chosen: l.chosen, price: l.price, url: l.url }; }) });
  }

  // Copy of a chat/email/PayPal order for the Google Sheet. Fire-and-forget: it must never block the buyer.
  function logOrder(id, method, customer) {
    if (!CFG.endpoint) return;
    try {
      fetch(CFG.endpoint, { method: 'POST', mode: 'no-cors', keepalive: true, body: payload(id, method, customer) });
    } catch (e) { /* the chat message is the order; the sheet copy is a bonus */ }
  }

  function submitOrder(method, customer, msg, button) {
    var id = orderId();
    var text = orderText(id, customer);
    var after = { payment: customer.payment, total: totals(customer.country).total, lines: cart.slice(), ship: totals(customer.country).ship };
    if (method !== 'order') logOrder(id, method, customer);
    if (method === 'whatsapp') {
      window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text), '_blank', 'noopener');
      return done(id, t('WhatsApp opened with your order. Press send there to complete it.'), false, '', after);
    }
    if (method === 'telegram') {
      // Telegram links can't fill in a message for a person, so the order goes via the clipboard.
      copyText(text);
      window.open('https://t.me/' + CFG.telegram, '_blank', 'noopener');
      return done(id, t('Your order is copied. In Telegram, paste it into the chat and send it.'), false, text, after);
    }
    if (method === 'email') {
      location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(t('Order') + ' #' + id + ' — ' + CFG.shop) +
        '&body=' + encodeURIComponent(orderText(id, customer, true));
      return done(id, t('Your email app opened with the order. Press send there to complete it.'), false, '', after);
    }
    if (method === 'paypal') return done(id, t('Pay now with PayPal'), false, '', after);
    // Apps Script endpoint: text/plain keeps it a "simple" request, so no CORS preflight.
    button.disabled = true;
    msg.textContent = t('Sending…');
    fetch(CFG.endpoint, { method: 'POST', body: payload(id, 'order', customer) })
      .then(function (r) { return r.text(); })
      .then(function (body) {
        var res;
        try { res = JSON.parse(body); } catch (e) {
          // An HTML page instead of JSON: the script is incomplete or its newest version isn't deployed.
          console.warn('[shop] The order inbox (google_sheet) did not answer with JSON. Paste the whole Code.gs and deploy a New version.');
          throw new Error('');
        }
        if (!res.ok) throw new Error(res.error || '');
        after.total = res.total;
        done(res.orderId || id, t('Thank you! Your order was received. Total') + ': ' + money(res.total), true, '', after);
      })
      .catch(function (err) {
        button.disabled = false;
        var why = err && err.message && !/fetch|network|load/i.test(err.message) ? ' (' + err.message + ')' : '';
        msg.textContent = t('Sorry, the order could not be sent.') + why + (methods().length > 1 ? ' ' + t('Please choose another way to order.') : '');
      });
  }

  function payPalButton(id, after) {
    var label = t('Pay now with PayPal') + ' (' + money(after.total) + ')';
    if (CFG.paypalMe) {
      return el('a', { 'class': 'shop-btn shop-btn-big shop-btn-paypal', target: '_blank', rel: 'noopener',
        href: 'https://www.paypal.com/paypalme/' + encodeURIComponent(CFG.paypalMe) + '/' + after.total.toFixed(2) + CFG.currency, text: label });
    }
    var f = el('form', { method: 'post', action: 'https://www.paypal.com/cgi-bin/webscr', target: '_blank' });
    var add = function (k, v) { f.appendChild(el('input', { type: 'hidden', name: k, value: String(v) })); };
    add('cmd', '_cart'); add('upload', '1'); add('business', CFG.paypalEmail);
    add('currency_code', CFG.currency); add('invoice', id); add('charset', 'utf-8');
    add('return', location.href.split('#')[0]);
    after.lines.forEach(function (l, n) {
      add('item_name_' + (n + 1), (l.title + (l.chosen.length ? ' (' + l.chosen.join(', ') + ')' : '')).slice(0, 127));
      add('amount_' + (n + 1), l.price.toFixed(2));
      add('quantity_' + (n + 1), l.qty);
    });
    if (after.ship) add('handling_cart', after.ship.toFixed(2));
    f.appendChild(el('button', { type: 'submit', 'class': 'shop-btn shop-btn-big shop-btn-paypal', text: label }));
    return f;
  }

  function done(id, text, clear, copyable, after) {
    after = after || {};
    header(t('Thank you'), 'done');
    panel.appendChild(el('p', { 'class': 'shop-done', text: text }));
    panel.appendChild(el('p', { 'class': 'shop-order-no' }, [t('Order number') + ': ', el('strong', { text: '#' + id })]));
    if (copyable) {
      var area = el('textarea', { 'class': 'shop-copy', readonly: 'readonly', rows: '8', 'aria-label': t('Order') });
      area.value = copyable;
      var again = el('button', { type: 'button', 'class': 'shop-btn shop-btn-ghost', text: t('Copy order again'),
        onclick: function () { copyText(copyable).then(function () { again.textContent = t('Copied') + ' ✓'; }); } });
      panel.appendChild(area);
      panel.appendChild(el('div', { 'class': 'shop-ask' }, [again,
        el('a', { 'class': 'shop-btn shop-btn-tg', href: 'https://t.me/' + CFG.telegram, target: '_blank', rel: 'noopener' }, [svg(ICONS.telegram), ' ' + t('Open Telegram')])]));
    }
    if (isPayPal(after.payment) && (CFG.paypalMe || CFG.paypalEmail)) panel.appendChild(payPalButton(id, after));
    if (CFG.bank && (isBank(after.payment) || !CFG.payments.length)) {
      panel.appendChild(el('p', { 'class': 'shop-note', text: t('Bank transfer') + ': ' + CFG.bank + ' — ' + t('Reference') + ': #' + id }));
    }
    if (clear) { cart = []; save(); }
    else panel.appendChild(el('button', { type: 'button', 'class': 'shop-btn', text: t('Clear cart'), onclick: function () { cart = []; save(); closeDrawer(); } }));
  }

  // ------------------------------------------------------------ toast
  var toastEl, toastTimer;
  function toast(text, withCart) {
    if (!toastEl) {
      toastEl = el('div', { 'class': 'shop-toast', role: 'status', 'aria-live': 'polite' });
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = '';
    toastEl.appendChild(doc.createTextNode(text + ' '));
    if (withCart) toastEl.appendChild(el('button', { type: 'button', 'class': 'shop-link', 'data-cart-open': '', text: t('View cart') }));
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3500);
  }

  // ------------------------------------------------------------ page language
  function applyLanguage() {
    doc.documentElement.lang = LANG;
    // Owner content in several languages: <div data-lang="de">…</div><div data-lang="en">…</div>
    each(doc.querySelectorAll('[data-lang]'), function (n) {
      var langs = list(n.getAttribute('data-lang').replace(/\s+/g, ',')).map(function (l) { return l.toLowerCase().slice(0, 2); });
      n.hidden = langs.indexOf(LANG) === -1;
    });
    each(doc.querySelectorAll('[data-i18n]'), function (n) { n.textContent = t(n.textContent.trim()); });
    each(doc.querySelectorAll('[data-i18n-placeholder]'), function (n) { n.placeholder = t(n.placeholder); });
    each(doc.querySelectorAll('[data-i18n-label]'), function (n) { n.setAttribute('aria-label', t(n.getAttribute('aria-label'))); });
    // Gadget titles and links the owner typed in English get the pack/word translations too.
    each(doc.querySelectorAll('.widget > h2, .widget > h3, .section-title, .widget-content a, .hero-eyebrow, .perk-title'), function (n) {
      if (n.children.length) return;
      var text = n.textContent.trim();
      var tr = t(text);
      if (tr !== text) n.textContent = tr;
    });
    var spot = doc.querySelector('[data-lang-switch]');
    if (spot && LANGS.length > 1) {
      var names;
      try { names = new Intl.DisplayNames(LANGS, { type: 'language' }); } catch (e) { names = null; }
      var pick = el('select', { 'class': 'shop-lang', 'aria-label': t('Language') }, LANGS.map(function (l) {
        var name = l.toUpperCase();
        try { name = new Intl.DisplayNames([l], { type: 'language' }).of(l); } catch (e) { /* code is fine */ }
        return el('option', { value: l, text: name.charAt(0).toUpperCase() + name.slice(1) });
      }));
      pick.value = LANG;
      pick.addEventListener('change', function () { store('shop-lang', pick.value); location.reload(); });
      spot.appendChild(pick);
      spot.hidden = false;
    }
  }

  // ------------------------------------------------------------ start
  // Price labels (_39, -49, !0) must not show up as categories in Label gadgets.
  function hidePriceLabels() {
    if (!CFG.labelPrices) return;
    each(doc.querySelectorAll('.Label li, .Label a, .shop-cat'), function (n) {
      if (/^[_\-!]\d[\d.,]*(\s*\(\s*\d+\s*\))?$/.test(n.textContent.trim())) n.hidden = true;
    });
  }

  function start() {
    applyLanguage();
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
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start);
  else start();
})();
