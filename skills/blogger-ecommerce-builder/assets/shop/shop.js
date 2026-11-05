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
      'Digital': 'Digital', 'Digital download': 'Digitaler Download', 'Weight': 'Gewicht', 'Dimensions': 'Maße',
      'Digital download – the link is sent by email after payment.': 'Digitaler Download – den Link erhalten Sie nach der Zahlung per E-Mail.',
      'Digital products: the download link is sent to your email after payment.': 'Digitale Produkte: Den Download-Link senden wir Ihnen nach der Zahlung per E-Mail.',
      'The download link is sent to your email after payment.': 'Den Download-Link senden wir Ihnen nach der Zahlung per E-Mail.',
      'Download link to': 'Download-Link an', 'Delivery': 'Lieferung', 'About': 'Mehr über', 'Parcel weight': 'Paketgewicht',
      'No delivery option for this country. Please contact us.': 'Für dieses Land gibt es keine Versandart. Bitte kontaktieren Sie uns.',
      'Our partners': 'Unsere Partner', 'Certified & accredited': 'Zertifiziert & akkreditiert',
      '2–4 working days': '2–4 Werktage', '3–5 working days': '3–5 Werktage', '4–7 working days': '4–7 Werktage',
      'By appointment': 'Nach Absprache', 'Pickup in Berlin': 'Abholung in Berlin',
      '14-day returns': '14 Tage Widerruf', 'Personal service': 'Persönlicher Service', 'Fast shipping': 'Schneller Versand',
      'Free shipping from 50 €': 'Kostenloser Versand ab 50 €', 'Order easily on WhatsApp or Telegram': 'Einfach per WhatsApp oder Telegram bestellen',
      'New arrivals every week': 'Jede Woche neue Stücke', 'Delivered in 2–4 working days': 'Lieferung in 2–4 Werktagen',
      'Easy and personal': 'Einfach und persönlich', 'Secure payment': 'Sichere Zahlung', 'PayPal or bank transfer': 'PayPal oder Überweisung',
      'We answer within a day': 'Antwort innerhalb eines Tages', 'We accept': 'Wir akzeptieren', 'Bank transfer': 'Überweisung',
      'Cash on delivery': 'Nachnahme', 'Close': 'Schließen', 'Previous': 'Zurück', 'Next': 'Weiter',
      'Our team': 'Unser Team', 'Delivery partners': 'Versandpartner',
      'You may also like': 'Das könnte Ihnen auch gefallen', 'Subscribe': 'Anmelden', 'Your email': 'Ihre E-Mail-Adresse',
      'Yes, I would like to receive news and offers by email. I can unsubscribe at any time.': 'Ja, ich möchte Neuigkeiten und Angebote per E-Mail erhalten. Ich kann mich jederzeit abmelden.',
      'Almost done! Please confirm your subscription in the email we just sent you.': 'Fast geschafft! Bitte bestätigen Sie die Anmeldung in der E-Mail, die wir Ihnen gerade geschickt haben.',
      'I agree that my details are used to answer my request.': 'Ich bin einverstanden, dass meine Angaben zur Beantwortung meiner Anfrage verwendet werden.',
      'Privacy policy': 'Datenschutzerklärung', 'Send request': 'Anfrage senden', 'Request a quote': 'Angebot anfragen',
      'Thank you! Your request was sent. We will reply within one working day.': 'Vielen Dank! Ihre Anfrage wurde gesendet. Wir antworten innerhalb eines Werktags.',
      'Something went wrong. Please try again or message us on WhatsApp.': 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns auf WhatsApp.',
      'Please tick the box to agree.': 'Bitte setzen Sie das Häkchen zur Zustimmung.', 'Learn more': 'Mehr erfahren',
      'Talk to us': 'Sprechen Sie mit uns', 'Call us': 'Rufen Sie uns an', 'Zoom video call': 'Zoom-Videoanruf',
      'Google Meet video call': 'Google-Meet-Videoanruf', 'Microsoft Teams call': 'Microsoft-Teams-Anruf',
      'Chat on WhatsApp': 'Per WhatsApp schreiben', 'Chat on Telegram': 'Per Telegram schreiben', 'Email us': 'E-Mail schreiben',
      'Prefer to talk? Call us or join a video call at these times.': 'Lieber persönlich? Rufen Sie an oder kommen Sie zu diesen Zeiten in einen Videoanruf.',
      'Mon–Fri 9:00–18:00': 'Mo–Fr 9:00–18:00 Uhr', 'Tue & Thu 18:00–19:00': 'Di & Do 18:00–19:00 Uhr', 'Sat 10:00–12:00': 'Sa 10:00–12:00 Uhr',
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
      'Digital': 'Numérique', 'Digital download': 'Téléchargement numérique', 'Weight': 'Poids', 'Dimensions': 'Dimensions',
      'Digital download – the link is sent by email after payment.': 'Téléchargement numérique – le lien est envoyé par e-mail après le paiement.',
      'Digital products: the download link is sent to your email after payment.': 'Produits numériques : le lien de téléchargement est envoyé par e-mail après le paiement.',
      'The download link is sent to your email after payment.': 'Le lien de téléchargement vous est envoyé par e-mail après le paiement.',
      'Download link to': 'Lien de téléchargement à', 'Delivery': 'Livraison', 'About': 'À propos de', 'Parcel weight': 'Poids du colis',
      'No delivery option for this country. Please contact us.': 'Aucune livraison prévue pour ce pays. Contactez-nous.',
      'Our partners': 'Nos partenaires', 'Certified & accredited': 'Certifié et accrédité',
      '2–4 working days': '2 à 4 jours ouvrés', '3–5 working days': '3 à 5 jours ouvrés', '4–7 working days': '4 à 7 jours ouvrés',
      'By appointment': 'Sur rendez-vous', 'Pickup in Berlin': 'Retrait à Berlin',
      '14-day returns': 'Retour sous 14 jours', 'Personal service': 'Service personnel', 'Fast shipping': 'Expédition rapide',
      'Free shipping from 50 €': 'Livraison offerte dès 50 €', 'Order easily on WhatsApp or Telegram': 'Commandez facilement sur WhatsApp ou Telegram',
      'New arrivals every week': 'Des nouveautés chaque semaine', 'Delivered in 2–4 working days': 'Livré en 2 à 4 jours ouvrés',
      'Easy and personal': 'Simple et personnel', 'Secure payment': 'Paiement sécurisé', 'PayPal or bank transfer': 'PayPal ou virement',
      'We answer within a day': 'Réponse sous 24 heures', 'We accept': 'Nous acceptons', 'Bank transfer': 'Virement bancaire',
      'Cash on delivery': 'Paiement à la livraison', 'Close': 'Fermer', 'Previous': 'Précédent', 'Next': 'Suivant',
      'Our team': 'Notre équipe', 'Delivery partners': 'Partenaires de livraison',
      'You may also like': 'Vous aimerez aussi', 'Subscribe': "S'inscrire", 'Your email': 'Votre e-mail',
      'Yes, I would like to receive news and offers by email. I can unsubscribe at any time.': 'Oui, je souhaite recevoir des nouveautés et des offres par e-mail. Je peux me désinscrire à tout moment.',
      'Almost done! Please confirm your subscription in the email we just sent you.': "Presque fini ! Confirmez votre inscription dans l'e-mail que nous venons de vous envoyer.",
      'I agree that my details are used to answer my request.': "J'accepte que mes données soient utilisées pour répondre à ma demande.",
      'Privacy policy': 'Politique de confidentialité', 'Send request': 'Envoyer la demande', 'Request a quote': 'Demander un devis',
      'Thank you! Your request was sent. We will reply within one working day.': 'Merci ! Votre demande a été envoyée. Nous répondons sous un jour ouvré.',
      'Something went wrong. Please try again or message us on WhatsApp.': 'Une erreur est survenue. Réessayez ou écrivez-nous sur WhatsApp.',
      'Please tick the box to agree.': 'Merci de cocher la case.', 'Learn more': 'En savoir plus',
      'Talk to us': 'Parlez-nous', 'Call us': 'Appelez-nous', 'Zoom video call': 'Appel vidéo Zoom',
      'Google Meet video call': 'Appel vidéo Google Meet', 'Microsoft Teams call': 'Appel Microsoft Teams',
      'Chat on WhatsApp': 'Écrire sur WhatsApp', 'Chat on Telegram': 'Écrire sur Telegram', 'Email us': 'Écrivez-nous',
      'Prefer to talk? Call us or join a video call at these times.': 'Vous préférez parler ? Appelez-nous ou rejoignez un appel vidéo à ces horaires.',
      'Mon–Fri 9:00–18:00': 'lun–ven 9h00–18h00', 'Tue & Thu 18:00–19:00': 'mar et jeu 18h00–19h00', 'Sat 10:00–12:00': 'sam 10h00–12h00',
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

  // "Ask on WhatsApp/Telegram" also work when only the "Talk to us" gadget has the number or name.
  gadgetLines('.shop-contact').forEach(function (line) {
    var m = /^\s*(whatsapp|telegram)\s*:\s*([^|]+)/i.exec(line);
    if (!m) return;
    var v = m[2].trim();
    if (/whatsapp/i.test(m[1]) && !CFG.whatsapp) CFG.whatsapp = v.replace(/[^\d]/g, '');
    if (/telegram/i.test(m[1]) && !CFG.telegram) CFG.telegram = v.replace(/^https?:\/\/(www\.)?t\.me\//i, '').replace(/^@/, '').replace(/[^\w]/g, '');
  });

  // Delivery partners: a gadget wrapped in <div class='shop-delivery'>, one option per line:
  //   DHL Parcel | 4,90 up to 2 kg; 6,99 up to 5 kg | 2–4 working days | /p/delivery.html#dhl | Germany
  //   Pickup in Berlin | 0 | By appointment
  // = name | fee (flat, or weight steps) | delivery time | info page (optional) | countries (optional, else all).
  // When this gadget has options, they decide the shipping fee (ship_to fees are not used).
  var DELIVERY = gadgetLines('.shop-delivery').map(function (line) {
    var parts = line.split('|').map(function (x) { return x.trim(); });
    if (parts.length < 2 || !parts[0]) return null;
    var tiers = parseTiers(parts[1]);
    if (!tiers.length) return null;
    var opt = { name: parts[0], tiers: tiers, time: parts[2] || '', link: '', countries: [] };
    parts.slice(3).forEach(function (x) {
      if (/^(https:\/\/|\/)/.test(x)) opt.link = x;
      else if (x) opt.countries = list(x);
    });
    return opt;
  }).filter(Boolean);

  // "4,90" or "4,90 up to 2 kg; 6,99 up to 5 kg" (also "bis", "jusqu'à", "<=").
  function parseTiers(text) {
    return String(text || '').split(';').map(function (seg) {
      var m = /^\s*([\d.,]+)\s*(?:€|eur|chf|\$|£)?\s*(?:(?:up to|bis|jusqu'?à|max\.?|<=?)\s*([\d.,]+)\s*kg)?\s*$/i.exec(seg);
      return m ? { fee: parseNumber(m[1]), max: m[2] ? parseNumber(m[2]) : Infinity } : null;
    }).filter(function (x) { return x && !isNaN(x.fee); });
  }
  // Country names compare without case; a two-letter code (DE, AT) also matches the country's name.
  function inList(names, country) {
    var want = String(country).toLowerCase();
    return names.some(function (n) {
      if (n.toLowerCase() === want) return true;
      if (!/^[A-Z]{2}$/i.test(n)) return false;
      try {
        return [LANG, 'en'].some(function (l) { return new Intl.DisplayNames([l], { type: 'region' }).of(n.toUpperCase()).toLowerCase() === want; });
      } catch (e) { return false; }
    });
  }
  function feeFor(opt, weight) {
    for (var i = 0; i < opt.tiers.length; i++) if (weight <= opt.tiers[i].max) return opt.tiers[i].fee;
    return NaN; // heavier than the largest step: this option can't carry the parcel
  }
  function deliveriesFor(country, weight) {
    return DELIVERY.filter(function (o) {
      return (!o.countries.length || !country || inList(o.countries, country)) && !isNaN(feeFor(o, weight));
    });
  }

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

  // data-weight is in kg; "400 g" also works.
  function parseWeight(v) {
    var n = parseNumber(v);
    if (isNaN(n) || n < 0) return 0;
    return /\d\s*g\b/i.test(String(v)) && !/kg/i.test(String(v)) ? n / 1000 : n;
  }
  function fmtKg(w) {
    var nf;
    try { nf = new Intl.NumberFormat(CFG.locale, { maximumFractionDigits: 2 }); } catch (e) { nf = { format: String }; }
    return w < 1 ? nf.format(Math.round(w * 1000)) + ' g' : nf.format(Math.round(w * 100) / 100) + ' kg';
  }

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
    var p = { price: NaN, oldPrice: NaN, stock: NaN, sku: '', options: [], videos: [], digital: false, weight: 0, dimensions: '' };
    var block = root && root.querySelector ? root.querySelector('.product[data-price]') : null;
    if (block) {
      p.price = parseNumber(block.getAttribute('data-price'));
      p.oldPrice = parseNumber(block.getAttribute('data-old-price'));
      p.stock = parseNumber(block.getAttribute('data-stock'));
      p.sku = block.getAttribute('data-sku') || '';
      p.options = parseOptions(block.getAttribute('data-options'));
      p.videos = list(block.getAttribute('data-video')).map(youtubeId).filter(Boolean);
      p.digital = /^(yes|true|1|digital|ja|oui)$/i.test((block.getAttribute('data-digital') || '').trim());
      p.weight = parseWeight(block.getAttribute('data-weight'));
      p.dimensions = (block.getAttribute('data-dimensions') || '').trim();
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
                     price: item.price, chosen: item.chosen, sku: item.sku, qty: qty,
                     digital: !!item.digital, weight: item.weight || 0 });
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

  // Totals for a country and a chosen delivery option. Digital-only carts have no shipping.
  function totals(country, delivery) {
    var sub = cart.reduce(function (s, l) { return s + l.price * l.qty; }, 0);
    var weight = cart.reduce(function (s, l) { return s + (l.digital ? 0 : (l.weight || 0) * l.qty); }, 0);
    var physical = cart.some(function (l) { return !l.digital; });
    var fee = 0, hasFee = false, option = null;
    if (physical && DELIVERY.length) {
      var opts = deliveriesFor(country, weight);
      option = opts.filter(function (o) { return o.name === delivery; })[0] || opts[0] || null;
      if (option) { fee = feeFor(option, weight); hasFee = true; }
    } else if (physical) {
      fee = shippingFor(country);
      hasFee = !!fee;
    }
    var ship = cart.length && fee && !(CFG.freeOver && sub >= CFG.freeOver) ? fee : 0;
    return { sub: sub, ship: ship, hasFee: hasFee, total: sub + ship, weight: weight, physical: physical, option: option,
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
      if (p.digital) card.appendChild(el('span', { 'class': 'shop-badge shop-badge-digital', text: t('Digital') }));
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
                        sku: p.sku, chosen: [], digital: p.digital, weight: p.weight }, 1);
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
    if (p.digital) {
      slot.appendChild(el('p', { 'class': 'shop-digital-note' }, [svg(ICONS.download, 'stroke'), ' ' + t('Digital download – the link is sent by email after payment.')]));
    }
    var facts = [];
    if (p.weight) facts.push(t('Weight') + ': ' + fmtKg(p.weight));
    if (p.dimensions) facts.push(t('Dimensions') + ': ' + p.dimensions);
    if (facts.length) slot.appendChild(el('p', { 'class': 'shop-facts', text: facts.join(' · ') }));

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
                      image: image, price: p.price, stock: p.stock, sku: p.sku, chosen: chosen,
                      digital: p.digital, weight: p.weight }, n);
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
    phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z',
    video: 'M23 7l-7 5 7 5V7zM3 5h11a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
    clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    download: 'M12 3v12M7 10l5 5 5-5M5 21h14',
    mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
    share: 'M12 3v12M7.5 7.5 12 3l4.5 4.5M5 13v7h14v-7',
    // trust row icons (stroke)
    truck: 'M1 5h13v10H1zM14 8h4l3 3.5V15h-7M7.5 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM19.5 17.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    'return': 'M9 14 4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
    lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
    shield: 'M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5zM9 12l2 2 4-4',
    chat: 'M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z',
    card: 'M2 5h20v14H2zM2 10h20M6 15h4',
    gift: 'M3 8h18v4H3zM5 12h14v9H5zM12 8v13M12 8S10.5 3 8 4s-1 4 4 4zM12 8s1.5-5 4-4 1 4-4 4z',
    star: 'm12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z',
    leaf: 'M5 21c0-9 5-15 16-16-1 11-7 16-16 16zM5 21l8-8',
    heart: 'M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.7-8 11-8 11z',
    box: 'M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10',
    check: 'M20 6 9 17l-5-5',
    globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z',
    warehouse: 'M3 21V9l9-5 9 5v12M7 21v-7h10v7M7 17h10',
    tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8zM7.5 7.5h.01',
    plus: 'M12 5v14M5 12h14',
    // team page social icons
    instagram: 'M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zM16 11.4A4 4 0 1 1 12.6 8 4 4 0 0 1 16 11.4zM17.5 6.5h.01',
    linkedin: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3zM9 9h3.8v1.7h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6V21h-4v-5.6c0-1.3 0-3-1.9-3s-2.1 1.4-2.1 2.9V21H9z',
    tiktok: 'M16.6 2c.3 2.4 1.7 3.9 4.1 4.1v3.1a7.3 7.3 0 0 1-4-1.2v6.6c0 3.9-2.9 6.4-6.3 6.4A6.2 6.2 0 0 1 4 14.8c0-3.8 3.4-6.6 7.3-6v3.3c-1.8-.4-3.9.6-3.9 2.8 0 1.6 1.3 2.9 2.9 2.9 1.8 0 2.9-1.2 2.9-3.1V2z',
    youtube: 'M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.8 15.1V8.9l5.7 3.1z'
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
    var physical = cart.some(function (l) { return !l.digital; });
    var anyDigital = cart.some(function (l) { return l.digital; });
    var form = el('form', { 'class': 'shop-form', novalidate: 'novalidate' }, [
      field('name', 'Full name', 'text', true, { autocomplete: 'name' }),
      field('phone', 'Phone', 'tel', true, { autocomplete: 'tel' }),
      // Digital products are sent by email, so then email is always required.
      field('email', 'Email', 'email', anyDigital || (CFG.endpoint && CFG.placeOrder && ways[0][0] === 'order'), { autocomplete: 'email' })
    ]);
    var sumBox = el('div', { 'class': 'shop-sum-box' });
    var delBox = el('div', { 'class': 'shop-delivery-box' });
    var chosen = { country: '', delivery: '' };
    var showSum = function () {
      sumBox.textContent = '';
      sumBox.appendChild(sumRows(totals(chosen.country, chosen.delivery)));
    };
    function drawDelivery() {
      delBox.textContent = '';
      if (!physical || !DELIVERY.length) return;
      var base = totals(chosen.country, '');
      var opts = deliveriesFor(chosen.country, base.weight);
      if (!opts.length) {
        chosen.delivery = '';
        delBox.appendChild(el('p', { 'class': 'shop-msg', text: t('No delivery option for this country. Please contact us.') }));
        return;
      }
      if (!opts.some(function (o) { return o.name === chosen.delivery; })) chosen.delivery = opts[0].name;
      var fsd = el('fieldset', { 'class': 'shop-methods shop-deliveries' }, [el('legend', { text: t('Delivery') })]);
      opts.forEach(function (o) {
        var fee = feeFor(o, base.weight);
        var free = !fee || (CFG.freeOver && base.sub >= CFG.freeOver);
        var input = el('input', { type: 'radio', name: 'delivery', value: o.name, checked: o.name === chosen.delivery ? 'checked' : false,
          onchange: function () { chosen.delivery = o.name; showSum(); } });
        fsd.appendChild(el('label', { 'class': 'shop-method shop-delivery-opt' }, [input,
          el('span', { 'class': 'shop-delivery-text' }, [
            el('span', { 'class': 'shop-delivery-head' }, [el('strong', { text: t(o.name) }), el('span', { 'class': 'shop-delivery-fee', text: free ? t('Free') : money(fee) })]),
            o.time ? el('span', { 'class': 'shop-contact-time' }, [svg(ICONS.clock, 'stroke'), ' ' + t(o.time)]) : null,
            o.link ? el('a', { href: o.link, target: '_blank', rel: 'noopener', 'class': 'shop-delivery-info', text: t('About') + ' ' + t(o.name) }) : null
          ])]));
      });
      delBox.appendChild(fsd);
      if (base.weight) delBox.appendChild(el('p', { 'class': 'shop-note', text: t('Parcel weight') + ': ' + fmtKg(base.weight) }));
    }
    if (physical) {
      addressFields(form, function (c) { chosen.country = c; drawDelivery(); showSum(); });
      if (cart.some(function (l) { return l.digital; })) {
        form.appendChild(el('p', { 'class': 'shop-digital-note' }, [svg(ICONS.download, 'stroke'), ' ' + t('Digital products: the download link is sent to your email after payment.')]));
      }
    } else {
      form.appendChild(el('p', { 'class': 'shop-digital-note' }, [svg(ICONS.download, 'stroke'), ' ' + t('Digital products: the download link is sent to your email after payment.')]));
      showSum();
    }
    form.appendChild(field('note', 'Note', 'textarea', false));
    form.appendChild(el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'class': 'shop-hp', 'aria-hidden': 'true' }));
    form.appendChild(delBox);
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
      if (e.target.name === 'method') form.elements.email.required = anyDigital || e.target.value === 'order';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.elements.website.value) return; // bot filled the honeypot
      var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (i) {
        return !i.hidden && (!i.value.trim() || !i.checkValidity());
      });
      if (bad.length) { msg.textContent = t('Please fill in the marked fields.'); bad[0].focus(); return; }
      var data = { country: chosen.country, city: '', street: '', postcode: '', address: '' };
      ['name', 'phone', 'email', 'note'].forEach(function (k) { data[k] = form.elements[k].value.trim(); });
      if (physical) {
        var city = form.elements.city.value === '*' ? form.elements.city_other.value : form.elements.city.value;
        data.city = city.trim();
        data.street = form.elements.street.value.trim();
        data.postcode = form.elements.postcode.value.trim();
        data.address = data.street + ', ' + data.postcode + ' ' + data.city + ', ' + data.country;
      }
      var tt = totals(chosen.country, chosen.delivery);
      data.delivery = tt.option ? tt.option.name : '';
      data.deliveryTime = tt.option ? tt.option.time : '';
      data.weight = Math.round(tt.weight * 1000) / 1000;
      data.digitalOnly = !physical;
      data.payment = form.elements.payment ? form.elements.payment.value : (form.elements.method.value === 'paypal' ? 'PayPal' : '');
      submitOrder(form.elements.method.value, data, msg, submit);
    });
    panel.appendChild(form);
    form.elements.name.focus();
  }

  // Order number = product initials + date + time to the second: "Sportiva Swing Tee" at 15:30:12 on
  // 4 Nov 2026 -> SST-261104-153012 (one-word names use their first 3 letters: BRA-…). A second order from
  // this device in the same second gets -2; the Google Sheet also adds -2, -3 … if a number already exists.
  function initials(title) {
    var plain = String(title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'SS').toUpperCase();
    var words = plain.split(/[^A-Z0-9]+/).filter(Boolean);
    if (!words.length) return 'NS';
    return (words.length > 1 ? words.map(function (w) { return w.charAt(0); }).join('') : words[0]).slice(0, 3);
  }

  function orderId() {
    var d = new Date();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    var id = initials(cart[0] && cart[0].title) + '-' + String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) +
      pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds());
    var last = String(store('shop-last-order') || '');
    if (last === id || last.indexOf(id + '-') === 0) id += '-' + ((parseInt(last.slice(id.length + 1), 10) || 1) + 1);
    store('shop-last-order', id);
    return id;
  }

  // The order as a message for WhatsApp, Telegram and email (plain: no *bold* markers, for email).
  function orderText(id, c, plain) {
    var tt = totals(c.country, c.delivery);
    var rule = '────────────────';
    var lines = ['🛍️ ' + t('New order').toUpperCase() + ' #' + id, CFG.shop, rule];
    cart.forEach(function (l) {
      lines.push(l.qty + ' × ' + l.title);
      if (l.chosen.length) lines.push('   ' + l.chosen.join(' · '));
      if (l.digital) lines.push('   ' + t('Digital download'));
      lines.push('   ' + money(l.price) + (l.qty > 1 ? ' × ' + l.qty + ' = ' + money(l.price * l.qty) : ''));
      if (l.url) lines.push('   ' + l.url);
    });
    lines.push(rule, t('Subtotal') + ': ' + money(tt.sub));
    if (tt.hasFee) lines.push(t('Shipping') + (c.delivery ? ' – ' + t(c.delivery) : (c.country ? ' (' + c.country + ')' : '')) + ': ' + (tt.ship ? money(tt.ship) : t('Free')));
    var star = plain ? '' : '*';
    lines.push(star + t('Total') + ': ' + money(tt.total) + star);
    if (c.payment) lines.push('💳 ' + t('Payment') + ': ' + t(c.payment));
    if (c.delivery) lines.push('🚚 ' + t('Delivery') + ': ' + t(c.delivery) + (c.deliveryTime ? ' · ' + t(c.deliveryTime) : ''));
    if (tt.physical && tt.weight) lines.push('⚖️ ' + t('Parcel weight') + ': ' + fmtKg(tt.weight));
    lines.push(rule, '👤 ' + c.name, '📞 ' + c.phone);
    if (c.email) lines.push('✉️ ' + c.email);
    if (tt.physical) lines.push('📍 ' + c.street, '    ' + c.postcode + ' ' + c.city, '    ' + c.country);
    else lines.push('📥 ' + t('Download link to') + ': ' + c.email);
    if (c.note) lines.push('📝 ' + c.note);
    if (CFG.bank && (isBank(c.payment) || !CFG.payments.length)) lines.push(rule, t('Bank transfer') + ': ' + CFG.bank, t('Reference') + ': ' + id);
    return lines.join('\n');
  }

  function payload(id, method, customer) {
    var tt = totals(customer.country, customer.delivery);
    return JSON.stringify({ orderId: id, method: method, customer: customer, page: location.href, lang: LANG,
      shipping: tt.ship, total: tt.total,
      items: cart.map(function (l) { return { id: l.id, title: l.title, qty: l.qty, chosen: l.chosen, price: l.price, url: l.url, digital: !!l.digital }; }) });
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
    var tt = totals(customer.country, customer.delivery);
    var after = { payment: customer.payment, total: tt.total, lines: cart.slice(), ship: tt.ship, digital: cart.some(function (l) { return l.digital; }) };
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
        if (typeof res.total === 'number' && !isNaN(res.total)) after.total = res.total;
        done(res.orderId || id, t('Thank you! Your order was received. Total') + ': ' + money(after.total), true, '', after);
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
    if (after.digital) panel.appendChild(el('p', { 'class': 'shop-digital-note' }, [svg(ICONS.download, 'stroke'), ' ' + t('The download link is sent to your email after payment.')]));
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

  // ------------------------------------------------------------ call and video buttons
  // An HTML gadget whose content is wrapped in <div class='shop-contact'>, one button per line:
  //   call: +49 157 00000000 | Mon–Fri 9:00–18:00
  //   zoom: https://zoom.us/j/123 | Tue & Thu 18:00–19:00 | Video advice
  //   meet: https://meet.google.com/abc-defg-hij | Sat 10:00–12:00
  //   text: Prefer to talk? …
  // = type: link or number | times (optional) | own button text (optional). Also: teams, whatsapp, telegram, email.
  var CONTACT = {
    call: { icon: 'phone', stroke: true, label: 'Call us', href: function (v) { return 'tel:' + v.replace(/[^\d+]/g, ''); }, detail: true },
    zoom: { icon: 'video', stroke: true, label: 'Zoom video call', href: function (v) { return v; } },
    meet: { icon: 'video', stroke: true, label: 'Google Meet video call', href: function (v) { return v; } },
    teams: { icon: 'video', stroke: true, label: 'Microsoft Teams call', href: function (v) { return v; } },
    whatsapp: { icon: 'whatsapp', label: 'Chat on WhatsApp', href: function (v) { return 'https://wa.me/' + v.replace(/[^\d]/g, ''); }, detail: true },
    telegram: { icon: 'telegram', label: 'Chat on Telegram', href: function (v) { return 'https://t.me/' + v.replace(/^@|^https?:\/\/t\.me\//, ''); } },
    email: { icon: 'mail', stroke: true, label: 'Email us', href: function (v) { return 'mailto:' + v; }, detail: true }
  };
  var CONTACT_ALIAS = { phone: 'call', tel: 'call', google_meet: 'meet', googlemeet: 'meet', mail: 'email', e_mail: 'email' };

  function renderContact() {
    each(doc.querySelectorAll('.shop-contact'), function (box) {
      var items = [], intro = '';
      gadgetLinesOf(box).forEach(function (line) {
        var m = /^\s*([A-Za-z][\w \-]*?)\s*:\s*(.+?)\s*$/.exec(line);
        if (!m) return;
        var key = m[1].toLowerCase().replace(/[\s\-]+/g, '_');
        key = CONTACT_ALIAS[key] || key;
        if (key === 'text') { intro = m[2]; return; }
        var type = CONTACT[key];
        var parts = m[2].split('|').map(function (x) { return x.trim(); });
        if (!type || !parts[0]) return;
        var href = type.href(parts[0]);
        if (!/^(https:|tel:|mailto:)/.test(href)) return; // only safe links
        items.push({ key: key, type: type, value: parts[0], href: href, time: parts[1] || '', label: parts[2] || '' });
      });
      if (!items.length) return;
      box.textContent = '';
      box.classList.add('is-ready');
      if (intro) box.appendChild(el('p', { 'class': 'shop-contact-intro', text: t(intro) }));
      var cards = el('div', { 'class': 'shop-contact-cards' });
      box.appendChild(cards);
      items.forEach(function (it) {
        var outside = !/^(tel:|mailto:)/.test(it.href);
        cards.appendChild(el('a', { 'class': 'shop-contact-card shop-contact-' + it.key, href: it.href,
          target: outside ? '_blank' : false, rel: outside ? 'noopener' : false }, [
          el('span', { 'class': 'shop-contact-icon' }, [svg(ICONS[it.type.icon], it.type.stroke ? 'stroke' : null)]),
          el('span', { 'class': 'shop-contact-text' }, [
            el('strong', { text: it.label ? t(it.label) : t(it.type.label) }),
            it.type.detail ? el('span', { 'class': 'shop-contact-detail', text: it.value }) : null,
            it.time ? el('span', { 'class': 'shop-contact-time' }, [svg(ICONS.clock, 'stroke'), ' ' + t(it.time)]) : null
          ])
        ]));
      });
    });
  }

  // Lines of a gadget's text, like gadgetLines() but for an element already found.
  function gadgetLinesOf(el) {
    var copy = el.cloneNode(true);
    each(copy.querySelectorAll('br, p, div, li'), function (n) { n.appendChild(doc.createTextNode('\n')); });
    return (copy.textContent || '').split(/\r?\n/);
  }

  // Page anchors per language: /p/delivery.html#dhl opens id="dhl-de" when the page is read in German
  // (the English id="dhl" is in a hidden data-lang block then).
  function jumpToLanguageAnchor() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id || !/^[\w-]+$/.test(id)) return;
    var own = doc.getElementById(id + '-' + LANG), base = doc.getElementById(id);
    var target = own && own.offsetParent !== null ? own : base;
    if (target && target.offsetParent !== null) setTimeout(function () { target.scrollIntoView(); }, 0);
  }

  // ------------------------------------------------------------ announcement bar
  // A gadget wrapped in <div class='shop-announce'> above the header, one message per line:
  //   Free shipping from 50 € | /p/shipping.html        (the link is optional)
  // Several lines take turns every 5 seconds (paused while the mouse is over it). The × hides it for this visit.
  function renderAnnounce() {
    each(doc.querySelectorAll('.shop-announce'), function (box) {
      var bar = box.closest('.announce') || box;
      var msgs = gadgetLinesOf(box).map(function (line) {
        var parts = line.split('|').map(function (x) { return x.trim(); });
        return parts[0] ? { text: parts[0], link: /^(https:\/\/|\/)/.test(parts[1] || '') ? parts[1] : '' } : null;
      }).filter(Boolean);
      var key = 'shop-announce-closed:' + msgs.map(function (m) { return m.text; }).join('|');
      var closed = false;
      try { closed = sessionStorage.getItem(key) === '1'; } catch (e) { /* private mode */ }
      if (!msgs.length || closed) { bar.hidden = true; return; }
      box.textContent = '';
      box.classList.add('is-ready');
      var slides = msgs.map(function (m, i) {
        var inner = m.link ? el('a', { href: m.link, text: t(m.text) }) : el('span', { text: t(m.text) });
        return el('p', { 'class': 'shop-announce-msg' + (i ? '' : ' is-on'), 'aria-hidden': i ? 'true' : 'false' }, [inner]);
      });
      var track = el('div', { 'class': 'shop-announce-track' }, slides);
      box.appendChild(track);
      var at = 0, paused = false;
      function show(n) {
        slides[at].classList.remove('is-on'); slides[at].setAttribute('aria-hidden', 'true');
        at = (n + slides.length) % slides.length;
        slides[at].classList.add('is-on'); slides[at].setAttribute('aria-hidden', 'false');
      }
      if (slides.length > 1) {
        box.insertBefore(el('button', { type: 'button', 'class': 'shop-announce-nav is-prev', 'aria-label': t('Previous'), text: '‹', onclick: function () { show(at - 1); } }), track);
        box.appendChild(el('button', { type: 'button', 'class': 'shop-announce-nav is-next', 'aria-label': t('Next'), text: '›', onclick: function () { show(at + 1); } }));
        box.addEventListener('mouseenter', function () { paused = true; });
        box.addEventListener('mouseleave', function () { paused = false; });
        box.addEventListener('focusin', function () { paused = true; });
        box.addEventListener('focusout', function () { paused = false; });
        var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!still) setInterval(function () { if (!paused && !doc.hidden) show(at + 1); }, 5000);
      }
      box.appendChild(el('button', { type: 'button', 'class': 'shop-announce-close', 'aria-label': t('Close'), text: '×', onclick: function () {
        bar.hidden = true;
        try { sessionStorage.setItem(key, '1'); } catch (e) { /* fine */ }
      } }));
    });
  }

  // ------------------------------------------------------------ trust row
  // A gadget wrapped in <div class='shop-trust'>, one promise per line:
  //   truck | Free shipping from 50 € | Delivered in 2–4 working days | /p/delivery.html
  //   pay: PayPal, Bank transfer, Cash on delivery        (payment badges under the row)
  // Icons: truck, return, lock, shield, chat, card, gift, star, leaf, heart, box, check, clock, phone, mail.
  function renderTrust() {
    each(doc.querySelectorAll('.shop-trust'), function (box) {
      var items = [], pays = [];
      gadgetLinesOf(box).forEach(function (line) {
        var pm = /^\s*(pay|payment|payments)\s*:\s*(.+)$/i.exec(line);
        if (pm) { pays = list(pm[2]); return; }
        var parts = line.split('|').map(function (x) { return x.trim(); });
        if (parts.length < 2 || !parts[1]) return;
        items.push({ icon: ICONS[parts[0].toLowerCase()] ? parts[0].toLowerCase() : 'check', title: parts[1], text: parts[2] || '',
                     link: /^(https:\/\/|\/)/.test(parts[3] || '') ? parts[3] : '' });
      });
      if (!items.length && !pays.length) return;
      box.textContent = '';
      box.classList.add('is-ready');
      if (items.length) {
        var grid = el('ul', { 'class': 'shop-trust-list' });
        items.forEach(function (it) {
          var body = [el('span', { 'class': 'shop-trust-icon' }, [svg(ICONS[it.icon], 'stroke')]),
            el('span', { 'class': 'shop-trust-text' }, [el('strong', { text: t(it.title) }), it.text ? el('span', { text: t(it.text) }) : null])];
          grid.appendChild(el('li', { 'class': 'shop-trust-item' }, [it.link ? el('a', { href: it.link }, body) : el('div', {}, body)]));
        });
        box.appendChild(grid);
      }
      if (pays.length) {
        box.appendChild(el('p', { 'class': 'shop-trust-pay' }, [el('span', { 'class': 'shop-trust-pay-label', text: t('We accept') + ':' })]
          .concat(pays.map(function (x) { return el('span', { 'class': 'shop-pay-badge', text: t(x) }); }))));
      }
    });
  }

  // ------------------------------------------------------------ team page
  // <div class="team"><div class="team-member" data-phone="+49 …" data-email="…" data-whatsapp="+49 …"
  //   data-telegram="@name" data-instagram="https://…" data-facebook data-linkedin data-tiktok data-x data-youtube>
  //   <img src="…" alt="Name"><h3>Name</h3><p class="team-role">Role</p><p class="team-bio">…</p></div></div>
  // The data-… values become a phone line and a row of round icon buttons. Only https links are used.
  var TEAM_LINKS = [
    ['whatsapp', 'WhatsApp', false, function (v) { return 'https://wa.me/' + v.replace(/[^\d]/g, ''); }],
    ['telegram', 'Telegram', false, function (v) { return 'https://t.me/' + v.replace(/^@|^https?:\/\/t\.me\//, ''); }],
    ['email', 'Email', true, function (v) { return /^[^@\s]+@[^@\s]+$/.test(v) ? 'mailto:' + v : ''; }, 'mail'],
    ['instagram', 'Instagram', true], ['facebook', 'Facebook', false], ['linkedin', 'LinkedIn', false],
    ['tiktok', 'TikTok', false], ['x', 'X', false], ['youtube', 'YouTube', false]
  ];
  function renderTeam() {
    each(doc.querySelectorAll('.team-member'), function (card) {
      if (card.querySelector('.team-links')) return;
      var nameNode = card.querySelector('h2, h3, h4');
      var who = nameNode ? nameNode.textContent.trim() : '';
      var phone = (card.getAttribute('data-phone') || '').trim();
      var box = el('div', { 'class': 'team-links' });
      if (phone) {
        box.appendChild(el('a', { 'class': 'team-phone', href: 'tel:' + phone.replace(/[^\d+]/g, '') }, [svg(ICONS.phone, 'stroke'), ' ' + phone]));
      }
      var row = el('div', { 'class': 'team-social' });
      TEAM_LINKS.forEach(function (d) {
        var v = (card.getAttribute('data-' + d[0]) || '').trim();
        if (!v) return;
        var href = d[3] ? d[3](v) : v;
        if (!/^(https:\/\/|mailto:)/.test(href)) return;
        row.appendChild(el('a', { 'class': 'team-net team-net-' + d[0], href: href, target: /^https/.test(href) ? '_blank' : false, rel: 'noopener',
          'aria-label': (who ? who + ' – ' : '') + d[1], title: d[1] }, [svg(ICONS[d[4] || d[0]], d[2] ? 'stroke' : null)]));
      });
      if (row.children.length) box.appendChild(row);
      if (box.children.length) card.appendChild(box);
    });
  }

  // ------------------------------------------------------------ homepage blocks
  // Every block is an HTML gadget wrapped in a <div class='shop-…'>; one item per line, parts separated by |.
  // Lines in the visitor's language: <div data-lang="de">…</div> blocks inside the gadget; English (or all) as fallback.
  function langLines(box) {
    var pick = function (lang) {
      var copy = box.cloneNode(true);
      each(copy.querySelectorAll('[data-lang]'), function (n) {
        var langs = list(n.getAttribute('data-lang').replace(/\s+/g, ',')).map(function (l) { return l.toLowerCase().slice(0, 2); });
        if (lang && langs.indexOf(lang) === -1) n.parentNode.removeChild(n);
      });
      return gadgetLinesOf(copy).filter(function (l) { return l.trim() && !/^\s*#/.test(l); });
    };
    var lines = pick(LANG);
    if (!lines.length) lines = pick('en');
    if (!lines.length) lines = pick('');
    return lines;
  }
  function hideEmpty(box) {
    var sec = box.closest('section') || box;
    sec.hidden = true;
  }
  function lineParts(box) {
    var intro = '', items = [];
    langLines(box).forEach(function (line) {
      var m = /^\s*text\s*:\s*(.+)$/i.exec(line);
      if (m) { intro = m[1].trim(); return; }
      var parts = line.split('|').map(function (x) { return x.trim(); });
      if (parts[0]) items.push(parts);
    });
    return { intro: intro, items: items };
  }
  function safeLink(v) { return /^(https:\/\/|\/|#)/.test(v || '') ? v : ''; }
  function ready(box, intro) {
    box.textContent = '';
    box.classList.add('is-ready');
    if (intro) box.appendChild(el('p', { 'class': 'shop-block-intro', text: t(intro) }));
  }

  // What we do: icon | title | text | button text | link
  function renderServices() {
    each(doc.querySelectorAll('.shop-services'), function (box) {
      var d = lineParts(box);
      if (!d.items.length) return hideEmpty(box);
      ready(box, d.intro);
      var grid = el('div', { 'class': 'shop-services-grid' });
      d.items.forEach(function (p) {
        var icon = ICONS[(p[0] || '').toLowerCase()] ? p[0].toLowerCase() : 'check';
        var link = safeLink(p[4]);
        grid.appendChild(el('div', { 'class': 'shop-service' }, [
          el('span', { 'class': 'shop-service-icon' }, [svg(ICONS[icon], 'stroke')]),
          el('h3', { text: t(p[1] || '') }),
          p[2] ? el('p', { text: t(p[2]) }) : null,
          link ? el('a', { 'class': 'shop-btn shop-btn-ghost', href: link, text: t(p[3] || 'Learn more') + ' →' }) : null
        ]));
      });
      box.appendChild(grid);
    });
  }

  // How it works: title | text   (numbered automatically)
  function renderSteps() {
    each(doc.querySelectorAll('.shop-steps'), function (box) {
      var d = lineParts(box);
      if (!d.items.length) return hideEmpty(box);
      ready(box, d.intro);
      var ol = el('ol', { 'class': 'shop-steps-list' });
      d.items.forEach(function (p, i) {
        ol.appendChild(el('li', { 'class': 'shop-step' }, [
          el('span', { 'class': 'shop-step-num', text: String(i + 1) }),
          el('h3', { text: t(p[0]) }), p[1] ? el('p', { text: t(p[1]) }) : null]));
      });
      box.appendChild(ol);
    });
  }

  // Customer reviews: stars (1-5) | quote | name, place
  function renderTestimonials() {
    each(doc.querySelectorAll('.shop-testimonials'), function (box) {
      var d = lineParts(box);
      var items = d.items.filter(function (p) { return p[1]; });
      if (!items.length) return hideEmpty(box);
      ready(box, d.intro);
      var row = el('div', { 'class': 'shop-quotes' });
      items.forEach(function (p) {
        var n = Math.max(0, Math.min(5, (p[0].match(/★/g) || []).length || parseInt(p[0], 10) || 5));
        row.appendChild(el('figure', { 'class': 'shop-quote' }, [
          el('div', { 'class': 'shop-quote-stars', 'aria-label': n + ' / 5', text: '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n) }),
          el('blockquote', { text: '“' + t(p[1]) + '”' }),
          p[2] ? el('figcaption', { text: '– ' + p[2] }) : null]));
      });
      box.appendChild(row);
    });
  }

  // FAQ: question | answer  → open/close list + FAQPage data for Google
  function renderFaq() {
    var all = [];
    each(doc.querySelectorAll('.shop-faq'), function (box) {
      var d = lineParts(box);
      var items = d.items.filter(function (p) { return p[1]; });
      if (!items.length) return hideEmpty(box);
      ready(box, d.intro);
      items.forEach(function (p) {
        var q = t(p[0]), a = t(p.slice(1).join(' | '));
        if (!box.closest('[hidden]')) all.push({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } });
        box.appendChild(el('details', { 'class': 'shop-faq-item' }, [el('summary', { text: q }), el('p', { text: a })]));
      });
    });
    if (all.length) {
      var ld = el('script', { type: 'application/ld+json' });
      ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: all });
      doc.head.appendChild(ld);
    }
  }

  // Sends a request or sign-up to the Google Sheet inbox. Returns a promise with the reply.
  function sendLead(data) {
    data.type = 'lead'; data.lang = LANG; data.page = location.href.split('#')[0];
    return fetch(CFG.endpoint, { method: 'POST', body: JSON.stringify(data) })
      .then(function (r) { return r.text(); })
      .then(function (body) {
        var res = JSON.parse(body);
        if (!res.ok) throw new Error(res.error || '');
        return res;
      });
  }
  function consentBox(text, withPrivacy) {
    var input = el('input', { type: 'checkbox', name: 'consent', required: 'required' });
    return el('label', { 'class': 'shop-consent' }, [input, el('span', {}, [t(text) + ' ',
      withPrivacy ? el('a', { href: '/p/privacy.html', target: '_blank', rel: 'noopener', text: t('Privacy policy') }) : null])]);
  }

  // Newsletter: "text: …" line for the intro; "button: …" for the button text. Needs google_sheet.
  function renderNewsletter() {
    each(doc.querySelectorAll('.shop-newsletter'), function (box) {
      var section = box.closest('.newsletter') || box;
      if (!CFG.endpoint) { section.hidden = true; console.warn('[shop] Newsletter needs google_sheet in Shop settings.'); return; }
      var intro = '', button = 'Subscribe';
      langLines(box).forEach(function (line) {
        var m = /^\s*(text|button)\s*:\s*(.+)$/i.exec(line);
        if (m && /text/i.test(m[1])) intro = m[2].trim();
        else if (m) button = m[2].trim();
      });
      ready(box, intro);
      var msg = el('p', { 'class': 'shop-msg', role: 'status' });
      var email = el('input', { type: 'email', name: 'email', required: 'required', autocomplete: 'email', placeholder: t('Your email'), 'aria-label': t('Your email') });
      var btn = el('button', { type: 'submit', 'class': 'shop-btn', text: t(button) });
      var form = el('form', { 'class': 'shop-newsletter-form', novalidate: 'novalidate' }, [
        el('div', { 'class': 'shop-newsletter-row' }, [email, btn]),
        consentBox('Yes, I would like to receive news and offers by email. I can unsubscribe at any time.', true),
        el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'class': 'shop-hp', 'aria-hidden': 'true' }), msg]);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.elements.website.value) return;
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())) { msg.textContent = t('Please fill in the marked fields.'); email.focus(); return; }
        if (!form.elements.consent.checked) { msg.textContent = t('Please tick the box to agree.'); return; }
        btn.disabled = true; msg.textContent = t('Sending…');
        sendLead({ kind: 'newsletter', fields: { Email: email.value.trim() }, consent: true }).then(function () {
          form.replaceWith(el('p', { 'class': 'shop-done-note', text: t('Almost done! Please confirm your subscription in the email we just sent you.') }));
        }).catch(function () { btn.disabled = false; msg.textContent = t('Something went wrong. Please try again or message us on WhatsApp.'); });
      });
      box.appendChild(form);
    });
  }

  // Request forms in pages: <div class="shop-lead" data-kind="quote" data-fields="Name*; Email*; Phone; Parcels per month: under 50 / 50–200; Message"
  //   data-button="Request a quote"></div>. * = required. A field with ":" becomes a choice list.
  function renderLeadForms() {
    each(doc.querySelectorAll('.shop-lead'), function (box, n) {
      var kind = (box.getAttribute('data-kind') || 'request').replace(/[^\w-]/g, '');
      var specs = (box.getAttribute('data-fields') || 'Name*; Email*; Phone; Message').split(';').map(function (x) { return x.trim(); }).filter(Boolean);
      var form = el('form', { 'class': 'shop-form shop-lead-form', novalidate: 'novalidate' });
      specs.forEach(function (spec, i) {
        var m = /^([^:*]+)(\*)?\s*(?::\s*(.+))?$/.exec(spec);
        if (!m) return;
        var label = m[1].trim(), req = !!m[2], id = 'shop-lead-' + n + '-' + i, input;
        if (m[3]) {
          input = el('select', { id: id, name: label, required: req ? 'required' : false },
            [el('option', { value: '', text: t('Choose') + '…' })].concat(m[3].split('/').map(function (o) { return el('option', { value: o.trim(), text: t(o.trim()) }); })));
        } else if (/message|details|nachricht|notes?|what do you|was verkaufen/i.test(label)) {
          input = el('textarea', { id: id, name: label, rows: '4', required: req ? 'required' : false });
        } else {
          var type = /e-?mail/i.test(label) ? 'email' : (/phone|telefon|whatsapp/i.test(label) ? 'tel' : 'text');
          input = el('input', { id: id, name: label, type: type, required: req ? 'required' : false,
            autocomplete: type === 'email' ? 'email' : (type === 'tel' ? 'tel' : (/^name$/i.test(label) ? 'name' : 'off')) });
        }
        form.appendChild(el('label', { 'class': 'shop-field', 'for': id }, [el('span', { text: t(label) + (req ? ' *' : '') }), input]));
      });
      var msg = el('p', { 'class': 'shop-msg', role: 'status' });
      var btn = el('button', { type: 'submit', 'class': 'shop-btn shop-btn-big', text: t(box.getAttribute('data-button') || 'Send request') });
      form.appendChild(consentBox('I agree that my details are used to answer my request.', true));
      form.appendChild(el('input', { type: 'text', name: 'website', tabindex: '-1', autocomplete: 'off', 'class': 'shop-hp', 'aria-hidden': 'true' }));
      form.appendChild(btn); form.appendChild(msg);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (form.elements.website.value) return;
        var fields = {}, bad = null;
        each(form.querySelectorAll('input, select, textarea'), function (f) {
          if (!f.name || f.name === 'website' || f.name === 'consent') return;
          var v = f.value.trim();
          f.classList.toggle('is-invalid', f.required && !v);
          if (f.required && !v && !bad) bad = f;
          if (v && f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) && !bad) bad = f;
          fields[f.name] = v;
        });
        if (bad) { msg.textContent = t('Please fill in the marked fields.'); bad.focus(); return; }
        if (!form.elements.consent.checked) { msg.textContent = t('Please tick the box to agree.'); return; }
        var text = '📩 ' + t(box.getAttribute('data-button') || 'Request') + ' – ' + CFG.shop + '\n' +
          Object.keys(fields).filter(function (k) { return fields[k]; }).map(function (k) { return k + ': ' + fields[k]; }).join('\n');
        var fallback = function () {
          if (CFG.whatsapp) { window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text), '_blank', 'noopener'); msg.textContent = t('WhatsApp opened with your order. Press send there to complete it.'); }
          else if (CFG.email) location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(CFG.shop) + '&body=' + encodeURIComponent(text);
          else msg.textContent = t('Something went wrong. Please try again or message us on WhatsApp.');
          btn.disabled = false;
        };
        if (!CFG.endpoint) return fallback();
        btn.disabled = true; msg.textContent = t('Sending…');
        sendLead({ kind: kind, fields: fields, consent: true }).then(function () {
          form.replaceWith(el('p', { 'class': 'shop-done-note', text: t('Thank you! Your request was sent. We will reply within one working day.') }));
        }).catch(fallback);
      });
      box.textContent = '';
      box.appendChild(form);
    });
  }

  // Round WhatsApp button in the bottom corner of every page ("whatsapp_button: no" switches it off).
  function floatingWhatsApp() {
    if (!CFG.whatsapp || /^(no|off|false|0|nein|non)$/i.test(S.whatsapp_button || '')) return;
    var item = doc.querySelector('.shop-item');
    var title = item ? (item.getAttribute('data-title') || '').trim() : '';
    var text = t('Hi') + ' ' + CFG.shop + (title ? ', ' + t('I have a question about') + ' "' + title + '": ' + location.href.split('#')[0] : ', ');
    doc.body.appendChild(el('a', { 'class': 'shop-wa-float', href: 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text),
      target: '_blank', rel: 'noopener', 'aria-label': t('Chat on WhatsApp'), title: t('Chat on WhatsApp') }, [svg(ICONS.whatsapp)]));
  }

  // "You may also like": other products from the same category, read from the blog feed.
  function relatedProducts() {
    var item = doc.querySelector('.shop-item.is-product');
    if (!item || !window.fetch || !window.DOMParser || !/^https?:$/.test(location.protocol)) return;
    var here = (item.getAttribute('data-url') || location.href).split(/[?#]/)[0];
    var label = labelsOf(item).filter(function (l) { return !/^[_\-!]\d/.test(l); })[0];
    var url = location.origin + '/feeds/posts/default' + (label ? '/-/' + encodeURIComponent(label) : '') + '?alt=json&max-results=12';
    fetch(url).then(function (r) { return r.json(); }).then(function (data) {
      var picks = [];
      ((data.feed || {}).entry || []).forEach(function (e) {
        if (picks.length >= 4) return;
        var link = ((e.link || []).filter(function (l) { return l.rel === 'alternate'; })[0] || {}).href || '';
        if (!link || link.split(/[?#]/)[0] === here) return;
        var html = (e.content || e.summary || {}).$t || '';
        var dom = new DOMParser().parseFromString(html, 'text/html');
        var p = productFrom(dom.body, (e.category || []).map(function (c) { return c.term; }));
        if (!p) return;
        var img = (e.media$thumbnail || {}).url || ((dom.querySelector('img') || {}).getAttribute ? dom.querySelector('img').getAttribute('src') : '');
        img = (img || '').replace(/\/s\d+(-c)?\//, '/s400/').replace(/=s\d+(-c)?$/, '=s400');
        picks.push({ title: e.title.$t, link: link, img: img, p: p });
      });
      if (!picks.length) return;
      var grid = el('div', { 'class': 'shop-related-grid' });
      picks.forEach(function (x) {
        grid.appendChild(el('a', { 'class': 'shop-related-card', href: x.link }, [
          el('span', { 'class': 'shop-related-img' }, [x.img ? el('img', { src: x.img, alt: x.title, loading: 'lazy' }) : null]),
          el('span', { 'class': 'shop-related-title', text: x.title }), priceNode(x.p)]));
      });
      var sec = el('section', { 'class': 'shop-related' }, [el('h2', { text: t('You may also like') }), grid]);
      var reviews = item.querySelector('.shop-reviews');
      if (reviews) item.insertBefore(sec, reviews); else item.appendChild(sec);
    }).catch(function () { /* no feed: nothing to show */ });
  }

  // ------------------------------------------------------------ logo rows
  // Partners on the homepage, accreditation symbols in the footer: a gadget wrapped in
  // <div class='shop-logos'>, one logo per line:  Name | logo image link | website (optional).
  // A line without an image shows the name as a badge.
  function renderLogos() {
    each(doc.querySelectorAll('.shop-logos'), function (box) {
      var items = gadgetLinesOf(box).map(function (line) {
        var parts = line.split('|').map(function (x) { return x.trim(); });
        if (!parts[0]) return null;
        return { name: parts[0], img: /^https:\/\//.test(parts[1] || '') ? parts[1] : '',
                 link: /^(https:\/\/|\/)/.test(parts[2] || '') ? parts[2] : '' };
      }).filter(Boolean);
      if (!items.length) return;
      box.textContent = '';
      box.classList.add('is-ready');
      var row = el('ul', { 'class': 'shop-logo-list' });
      items.forEach(function (it) {
        var inner = it.img ? el('img', { src: it.img, alt: it.name, loading: 'lazy' }) : el('span', { 'class': 'shop-logo-name', text: t(it.name) });
        var node = it.link
          ? el('a', { href: it.link, title: it.name, target: /^https/.test(it.link) ? '_blank' : false, rel: 'noopener' }, [inner])
          : el('span', { title: it.name }, [inner]);
        row.appendChild(el('li', { 'class': 'shop-logo' + (it.img ? '' : ' is-text') }, [node]));
      });
      box.appendChild(row);
    });
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
    renderContact();
    renderLogos();
    renderAnnounce();
    renderTrust();
    renderTeam();
    renderServices();
    renderSteps();
    renderTestimonials();
    renderFaq();
    renderNewsletter();
    renderLeadForms();
    floatingWhatsApp();
    relatedProducts();
    jumpToLanguageAnchor();
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
