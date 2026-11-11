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
      'Newsletter sign-up': 'Anmeldung zum Newsletter', 'Your email app opened. Press send there to finish signing up.': 'Ihr E-Mail-Programm wurde geöffnet. Tippen Sie dort auf Senden, um die Anmeldung abzuschließen.', 'WhatsApp opened. Press send there to finish signing up.': 'WhatsApp wurde geöffnet. Tippen Sie dort auf Senden, um die Anmeldung abzuschließen.',
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
      'Ask us': 'Fragen Sie uns', 'Answers from our help list': 'Antworten aus unserer Hilfeliste', 'Type your question…': 'Ihre Frage eingeben…',
      'Your question': 'Ihre Frage', 'Send': 'Senden', 'Chat with a person on WhatsApp': 'Mit einem Menschen auf WhatsApp schreiben',
      'Sorry, I do not have an answer to that yet.': 'Dazu habe ich leider noch keine Antwort.',
      'Ask us on WhatsApp – your question is already typed in.': 'Fragen Sie uns auf WhatsApp – Ihre Frage ist schon eingetippt.',
      'Ask on WhatsApp': 'Auf WhatsApp fragen', 'You might also mean:': 'Meinten Sie vielleicht:', 'Questions I can answer:': 'Fragen, die ich beantworten kann:',
      'my question': 'meine Frage', 'Call': 'Anrufen', 'Directions': 'Route', 'Pause': 'Anhalten', 'Play': 'Abspielen', 'Source': 'Quelle',
      'Open chat': 'Chat öffnen',
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
      'Size': 'Größe', 'Colour': 'Farbe', 'Color': 'Farbe',
      'Shop': "Shop",
      'Kenya': "Kenia",
      'Fulfilment': "Fulfillment",
      'News': "Neuigkeiten",
      'Our branches': "Unsere Standorte",
      'What we do': "Was wir tun",
      'How it works': "So funktioniert es",
      'What customers say': "Das sagen Kunden",
      'Questions & answers': "Fragen & Antworten",
      'Stay in the loop': "Bleiben Sie informiert",
      'Talk to us': "Sprechen Sie mit uns"
    },
    fr: {
      'Newsletter sign-up': 'Inscription à la newsletter', 'Your email app opened. Press send there to finish signing up.': 'Votre messagerie s’est ouverte. Appuyez sur Envoyer pour terminer l’inscription.', 'WhatsApp opened. Press send there to finish signing up.': 'WhatsApp s’est ouvert. Appuyez sur Envoyer pour terminer l’inscription.',
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
      'Ask us': 'Posez votre question', 'Answers from our help list': 'Réponses de notre liste d’aide', 'Type your question…': 'Tapez votre question…',
      'Your question': 'Votre question', 'Send': 'Envoyer', 'Chat with a person on WhatsApp': 'Parler à une personne sur WhatsApp',
      'Sorry, I do not have an answer to that yet.': 'Désolé, je n’ai pas encore de réponse à cela.',
      'Ask us on WhatsApp – your question is already typed in.': 'Demandez-nous sur WhatsApp – votre question est déjà saisie.',
      'Ask on WhatsApp': 'Demander sur WhatsApp', 'You might also mean:': 'Vouliez-vous dire :', 'Questions I can answer:': 'Questions auxquelles je peux répondre :',
      'my question': 'ma question', 'Call': 'Appeler', 'Directions': 'Itinéraire', 'Pause': 'Pause', 'Play': 'Lecture', 'Source': 'Source',
      'Open chat': 'Ouvrir le chat',
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
      'Size': 'Taille', 'Colour': 'Couleur', 'Color': 'Couleur',
      'Shop': "Boutique",
      'Kenya': "Kenya",
      'Fulfilment': "Logistique",
      'News': "Actualités",
      'Our branches': "Nos agences",
      'What we do': "Ce que nous faisons",
      'How it works': "Comment ça marche",
      'What customers say': "Avis clients",
      'Questions & answers': "Questions & réponses",
      'Stay in the loop': "Restez informé",
      'Talk to us': "Parlez-nous"
    },
    sw: {
      'Newsletter sign-up': 'Usajili wa jarida', 'Your email app opened. Press send there to finish signing up.': 'Programu yako ya barua pepe imefunguka. Bonyeza tuma huko ili kukamilisha usajili.', 'WhatsApp opened. Press send there to finish signing up.': 'WhatsApp imefunguka. Bonyeza tuma huko ili kukamilisha usajili.',
      'Add to cart': "Weka kwenye kikapu",
      'Choose options': "Chagua chaguo",
      'Out of stock': "Imeisha",
      'Sale': "Punguzo",
      'Quantity': "Idadi",
      'Choose': "Chagua",
      'Please choose': "Tafadhali chagua",
      'Cart': "Kikapu",
      'Checkout': "Lipia",
      'Subtotal': "Jumla ndogo",
      'Shipping': "Usafirishaji",
      'Free': "Bure",
      'Total': "Jumla",
      'Free shipping from': "Usafirishaji bure kuanzia",
      'Your cart is empty.': "Kikapu chako ni tupu.",
      'Full name': "Jina kamili",
      'Phone': "Simu",
      'Email': "Barua pepe",
      'Street and house number': "Mtaa na namba ya nyumba",
      'Postcode': "Postikodi",
      'City': "Mji",
      'Country': "Nchi",
      'Other city…': "Mji mwingine…",
      'Note': "Maelezo",
      'How do you want to order?': "Ungependa kuagiza vipi?",
      'Send order': "Tuma oda",
      'Back to cart': "Rudi kwenye kikapu",
      'Please fill in the marked fields.': "Tafadhali jaza sehemu zilizowekwa alama.",
      'added to cart': "imewekwa kwenye kikapu",
      'View cart': "Tazama kikapu",
      'Only': "Zimebaki",
      'in stock': "tu",
      'Thank you': "Asante",
      'Order number': "Namba ya oda",
      'Bank transfer': "Uhamisho wa benki",
      'Reference': "Kumbukumbu",
      'Clear cart': "Futa kikapu",
      'Ask on WhatsApp': "Uliza kwa WhatsApp",
      'Ask on Telegram': "Uliza kwa Telegram",
      'Hi, I am interested in': "Habari, ninavutiwa na",
      'Place order (we confirm by email)': "Weka oda (tutathibitisha kwa barua pepe)",
      'Send order on WhatsApp': "Tuma oda kwa WhatsApp",
      'Send order on Telegram': "Tuma oda kwa Telegram",
      'Pay with PayPal': "Lipa kwa PayPal",
      'Send order by email': "Tuma oda kwa barua pepe",
      'Sending…': "Inatuma…",
      'New order': "Oda mpya",
      'Order': "Oda",
      'Customer': "Mteja",
      'Delivery address': "Anwani ya kufikishiwa",
      'WhatsApp opened with your order. Press send there to complete it.': "WhatsApp imefunguka na oda yako. Bonyeza tuma huko ili kukamilisha.",
      'Your email app opened with the order. Press send there to complete it.': "Programu yako ya barua pepe imefunguka na oda. Bonyeza tuma huko ili kukamilisha.",
      'Your order is copied. In Telegram, paste it into the chat and send it.': "Oda yako imenakiliwa. Kwenye Telegram, ibandike kwenye gumzo na uitume.",
      'Copy order again': "Nakili oda tena",
      'Copied': "Imenakiliwa",
      'Open Telegram': "Fungua Telegram",
      'Thank you! Your order was received. Total': "Asante! Oda yako imepokelewa. Jumla",
      'Sorry, the order could not be sent.': "Samahani, oda haikuweza kutumwa.",
      'Please choose another way to order.': "Tafadhali chagua njia nyingine ya kuagiza.",
      'Online ordering is not available yet. Please contact us.': "Kuagiza mtandaoni bado hakupatikani. Tafadhali wasiliana nasi.",
      'Image': "Picha",
      'Video': "Video",
      'Close': "Funga",
      'Remove': "Ondoa",
      'Share': "Shiriki",
      'Copy link': "Nakili kiungo",
      'Link copied': "Kiungo kimenakiliwa",
      'Share on': "Shiriki kwenye",
      'Reviews': "Maoni",
      'Write a review': "Andika maoni",
      'review': "maoni",
      'reviews': "maoni",
      'Rated': "Imepewa",
      'out of 5': "kati ya 5",
      'based on': "kutokana na",
      'Digital': "Kidijitali",
      'Digital download': "Upakuaji wa kidijitali",
      'Weight': "Uzito",
      'Dimensions': "Vipimo",
      'Digital download – the link is sent by email after payment.': "Upakuaji wa kidijitali – kiungo kinatumwa kwa barua pepe baada ya malipo.",
      'Digital products: the download link is sent to your email after payment.': "Bidhaa za kidijitali: kiungo cha kupakua kinatumwa kwenye barua pepe yako baada ya malipo.",
      'The download link is sent to your email after payment.': "Kiungo cha kupakua kinatumwa kwenye barua pepe yako baada ya malipo.",
      'Download link to': "Kiungo cha kupakua kwa",
      'Delivery': "Ufikishaji",
      'About': "Kuhusu",
      'Parcel weight': "Uzito wa kifurushi",
      'No delivery option for this country. Please contact us.': "Hakuna njia ya kufikisha kwa nchi hii. Tafadhali wasiliana nasi.",
      'Our partners': "Washirika wetu",
      'Certified & accredited': "Imethibitishwa na kuidhinishwa",
      '2–4 working days': "Siku 2–4 za kazi",
      '3–5 working days': "Siku 3–5 za kazi",
      '4–7 working days': "Siku 4–7 za kazi",
      'By appointment': "Kwa miadi",
      'Pickup in Berlin': "Kuchukua Berlin",
      '14-day returns': "Kurudisha ndani ya siku 14",
      'Personal service': "Huduma ya kibinafsi",
      'Fast shipping': "Usafirishaji wa haraka",
      'Free shipping from 50 €': "Usafirishaji bure kuanzia 50 €",
      'Order easily on WhatsApp or Telegram': "Agiza kwa urahisi kwa WhatsApp au Telegram",
      'New arrivals every week': "Bidhaa mpya kila wiki",
      'Delivered in 2–4 working days': "Inafika ndani ya siku 2–4 za kazi",
      'Easy and personal': "Rahisi na ya kibinafsi",
      'Secure payment': "Malipo salama",
      'PayPal or bank transfer': "PayPal au uhamisho wa benki",
      'We answer within a day': "Tunajibu ndani ya siku moja",
      'We accept': "Tunapokea",
      'Cash on delivery': "Lipa unapopokea",
      'Previous': "Iliyotangulia",
      'Next': "Inayofuata",
      'Our team': "Timu yetu",
      'Delivery partners': "Washirika wa usafirishaji",
      'You may also like': "Unaweza pia kupenda",
      'Subscribe': "Jisajili",
      'Your email': "Barua pepe yako",
      'Yes, I would like to receive news and offers by email. I can unsubscribe at any time.': "Ndiyo, ningependa kupokea habari na ofa kwa barua pepe. Naweza kujiondoa wakati wowote.",
      'Almost done! Please confirm your subscription in the email we just sent you.': "Karibu tumemaliza! Tafadhali thibitisha usajili wako kwenye barua pepe tuliyokutumia sasa hivi.",
      'I agree that my details are used to answer my request.': "Nakubali taarifa zangu zitumike kujibu ombi langu.",
      'Privacy policy': "Sera ya faragha",
      'Send request': "Tuma ombi",
      'Request a quote': "Omba bei",
      'Thank you! Your request was sent. We will reply within one working day.': "Asante! Ombi lako limetumwa. Tutajibu ndani ya siku moja ya kazi.",
      'Ask us': "Tuulize",
      'Answers from our help list': "Majibu kutoka orodha yetu ya msaada",
      'Type your question…': "Andika swali lako…",
      'Your question': "Swali lako",
      'Send': "Tuma",
      'Chat with a person on WhatsApp': "Ongea na mtu kwa WhatsApp",
      'Sorry, I do not have an answer to that yet.': "Samahani, bado sina jibu la hilo.",
      'Ask us on WhatsApp – your question is already typed in.': "Tuulize kwa WhatsApp – swali lako tayari limeandikwa.",
      'You might also mean:': "Huenda unamaanisha:",
      'Questions I can answer:': "Maswali ninayoweza kujibu:",
      'my question': "swali langu",
      'Call': "Piga simu",
      'Directions': "Maelekezo",
      'Pause': "Sitisha",
      'Play': "Endelea",
      'Source': "Chanzo",
      'Open chat': "Fungua gumzo",
      'Something went wrong. Please try again or message us on WhatsApp.': "Kuna tatizo. Tafadhali jaribu tena au tutumie ujumbe kwa WhatsApp.",
      'Please tick the box to agree.': "Tafadhali weka alama kwenye kisanduku kukubali.",
      'Learn more': "Jifunze zaidi",
      'Talk to us': "Ongea nasi",
      'Call us': "Tupigie simu",
      'Zoom video call': "Simu ya video ya Zoom",
      'Google Meet video call': "Simu ya video ya Google Meet",
      'Microsoft Teams call': "Simu ya Microsoft Teams",
      'Chat on WhatsApp': "Ongea kwa WhatsApp",
      'Chat on Telegram': "Ongea kwa Telegram",
      'Email us': "Tutumie barua pepe",
      'Prefer to talk? Call us or join a video call at these times.': "Ungependa kuongea? Tupigie simu au jiunge na simu ya video nyakati hizi.",
      'Mon–Fri 9:00–18:00': "Jumatatu–Ijumaa 9:00–18:00",
      'Tue & Thu 18:00–19:00': "Jumanne na Alhamisi 18:00–19:00",
      'Sat 10:00–12:00': "Jumamosi 10:00–12:00",
      'Start your review with a rating, for example 5/5 or ★★★★★.': "Anza maoni yako kwa alama, kwa mfano 5/5 au ★★★★★.",
      'Language': "Lugha",
      'Incl. VAT, plus shipping': "Pamoja na VAT, bila usafirishaji",
      'New arrivals': "Bidhaa mpya",
      'Shop by category': "Nunua kwa aina",
      'Categories': "Aina",
      'Popular products': "Bidhaa maarufu",
      'Order directly': "Agiza moja kwa moja",
      'Why shop with us': "Kwa nini ununue kwetu",
      'New collection': "Mkusanyiko mpya",
      'About the shop': "Kuhusu duka",
      'Customer service': "Huduma kwa wateja",
      'Follow us': "Tufuate",
      'Home': "Nyumbani",
      'Women': "Wanawake",
      'Men': "Wanaume",
      'Contact': "Mawasiliano",
      'Shop now': "Nunua sasa",
      'See the sale': "Tazama punguzo",
      'Contact us': "Wasiliana nasi",
      'Shipping & delivery': "Usafirishaji na ufikishaji",
      'Returns (Widerruf)': "Kurudisha bidhaa",
      'Search products...': "Tafuta bidhaa...",
      'Newer posts': "Bidhaa mpya zaidi",
      'Older posts': "Bidhaa zaidi",
      'Newer post': "Bidhaa iliyotangulia",
      'Older post': "Bidhaa inayofuata",
      'Page not found': "Ukurasa haupatikani",
      'Back to home': "Rudi nyumbani",
      'Search': "Tafuta",
      'Skip to content': "Ruka hadi maudhui",
      'Open menu': "Fungua menyu",
      'Features': "Sifa",
      'Size guide': "Mwongozo wa saizi",
      'Details': "Maelezo",
      'The page you were looking for has moved or no longer exists.': "Ukurasa uliotafuta umehamishwa au haupo tena.",
      'No posts found here yet.': "Bado hakuna bidhaa hapa.",
      'How will you pay?': "Utalipa vipi?",
      'Payment': "Malipo",
      'Cash on pickup': "Lipa taslimu unapochukua",
      'Pay now with PayPal': "Lipa sasa kwa PayPal",
      'Size': "Saizi",
      'Colour': "Rangi",
      'Color': "Rangi",
      'Shop': "Duka",
      'Kenya': "Kenya",
      'Fulfilment': "Huduma za ghala",
      'News': "Habari",
      'Our branches': "Matawi yetu",
      'What we do': "Tunachofanya",
      'How it works': "Jinsi inavyofanya kazi",
      'What customers say': "Wateja wanasema nini",
      'Questions & answers': "Maswali na majibu",
      'Stay in the loop': "Pata habari zetu"
    },
    ar: {
      'Newsletter sign-up': 'الاشتراك في النشرة البريدية', 'Your email app opened. Press send there to finish signing up.': 'تم فتح تطبيق البريد. اضغط إرسال هناك لإتمام الاشتراك.', 'WhatsApp opened. Press send there to finish signing up.': 'تم فتح واتساب. اضغط إرسال هناك لإتمام الاشتراك.',
      'Add to cart': "أضف إلى السلة",
      'Choose options': "اختر الخيارات",
      'Out of stock': "نفد من المخزون",
      'Sale': "تخفيض",
      'Quantity': "الكمية",
      'Choose': "اختر",
      'Please choose': "يرجى اختيار",
      'Cart': "السلة",
      'Checkout': "إتمام الطلب",
      'Subtotal': "المجموع الفرعي",
      'Shipping': "الشحن",
      'Free': "مجاني",
      'Total': "الإجمالي",
      'Free shipping from': "شحن مجاني ابتداءً من",
      'Your cart is empty.': "سلتك فارغة.",
      'Full name': "الاسم الكامل",
      'Phone': "الهاتف",
      'Email': "البريد الإلكتروني",
      'Street and house number': "الشارع ورقم المنزل",
      'Postcode': "الرمز البريدي",
      'City': "المدينة",
      'Country': "الدولة",
      'Other city…': "مدينة أخرى…",
      'Note': "ملاحظة",
      'How do you want to order?': "كيف تريد أن تطلب؟",
      'Send order': "إرسال الطلب",
      'Back to cart': "العودة إلى السلة",
      'Please fill in the marked fields.': "يرجى ملء الحقول المحددة.",
      'added to cart': "أُضيف إلى السلة",
      'View cart': "عرض السلة",
      'Only': "متبقٍ",
      'in stock': "فقط",
      'Thank you': "شكرًا لك",
      'Order number': "رقم الطلب",
      'Bank transfer': "تحويل بنكي",
      'Reference': "المرجع",
      'Clear cart': "إفراغ السلة",
      'Ask on WhatsApp': "اسأل عبر واتساب",
      'Ask on Telegram': "اسأل عبر تيليجرام",
      'Hi, I am interested in': "مرحبًا، أنا مهتم بـ",
      'Place order (we confirm by email)': "تقديم الطلب (نؤكده بالبريد الإلكتروني)",
      'Send order on WhatsApp': "إرسال الطلب عبر واتساب",
      'Send order on Telegram': "إرسال الطلب عبر تيليجرام",
      'Pay with PayPal': "الدفع عبر PayPal",
      'Send order by email': "إرسال الطلب بالبريد الإلكتروني",
      'Sending…': "جارٍ الإرسال…",
      'New order': "طلب جديد",
      'Order': "الطلب",
      'Customer': "العميل",
      'Delivery address': "عنوان التوصيل",
      'WhatsApp opened with your order. Press send there to complete it.': "تم فتح واتساب مع طلبك. اضغط إرسال هناك لإتمامه.",
      'Your email app opened with the order. Press send there to complete it.': "تم فتح تطبيق البريد مع الطلب. اضغط إرسال هناك لإتمامه.",
      'Your order is copied. In Telegram, paste it into the chat and send it.': "تم نسخ طلبك. الصقه في محادثة تيليجرام وأرسله.",
      'Copy order again': "انسخ الطلب مرة أخرى",
      'Copied': "تم النسخ",
      'Open Telegram': "افتح تيليجرام",
      'Thank you! Your order was received. Total': "شكرًا لك! تم استلام طلبك. الإجمالي",
      'Sorry, the order could not be sent.': "عذرًا، تعذّر إرسال الطلب.",
      'Please choose another way to order.': "يرجى اختيار طريقة أخرى للطلب.",
      'Online ordering is not available yet. Please contact us.': "الطلب عبر الإنترنت غير متاح بعد. يرجى التواصل معنا.",
      'Image': "صورة",
      'Video': "فيديو",
      'Close': "إغلاق",
      'Remove': "إزالة",
      'Share': "مشاركة",
      'Copy link': "نسخ الرابط",
      'Link copied': "تم نسخ الرابط",
      'Share on': "مشاركة على",
      'Reviews': "التقييمات",
      'Write a review': "اكتب تقييمًا",
      'review': "تقييم",
      'reviews': "تقييمات",
      'Rated': "التقييم",
      'out of 5': "من 5",
      'based on': "بناءً على",
      'Digital': "رقمي",
      'Digital download': "تنزيل رقمي",
      'Weight': "الوزن",
      'Dimensions': "الأبعاد",
      'Digital download – the link is sent by email after payment.': "تنزيل رقمي – يُرسل الرابط بالبريد الإلكتروني بعد الدفع.",
      'Digital products: the download link is sent to your email after payment.': "المنتجات الرقمية: يُرسل رابط التنزيل إلى بريدك الإلكتروني بعد الدفع.",
      'The download link is sent to your email after payment.': "يُرسل رابط التنزيل إلى بريدك الإلكتروني بعد الدفع.",
      'Download link to': "رابط التنزيل إلى",
      'Delivery': "التوصيل",
      'About': "حول",
      'Parcel weight': "وزن الطرد",
      'No delivery option for this country. Please contact us.': "لا يوجد خيار توصيل لهذه الدولة. يرجى التواصل معنا.",
      'Our partners': "شركاؤنا",
      'Certified & accredited': "معتمد وموثّق",
      '2–4 working days': "2–4 أيام عمل",
      '3–5 working days': "3–5 أيام عمل",
      '4–7 working days': "4–7 أيام عمل",
      'By appointment': "بموعد مسبق",
      'Pickup in Berlin': "الاستلام في برلين",
      '14-day returns': "إرجاع خلال 14 يومًا",
      'Personal service': "خدمة شخصية",
      'Fast shipping': "شحن سريع",
      'Free shipping from 50 €': "شحن مجاني ابتداءً من 50 €",
      'Order easily on WhatsApp or Telegram': "اطلب بسهولة عبر واتساب أو تيليجرام",
      'New arrivals every week': "وصول منتجات جديدة كل أسبوع",
      'Delivered in 2–4 working days': "التوصيل خلال 2–4 أيام عمل",
      'Easy and personal': "سهل وشخصي",
      'Secure payment': "دفع آمن",
      'PayPal or bank transfer': "PayPal أو تحويل بنكي",
      'We answer within a day': "نرد خلال يوم واحد",
      'We accept': "نقبل",
      'Cash on delivery': "الدفع عند الاستلام",
      'Previous': "السابق",
      'Next': "التالي",
      'Our team': "فريقنا",
      'Delivery partners': "شركاء التوصيل",
      'You may also like': "قد يعجبك أيضًا",
      'Subscribe': "اشترك",
      'Your email': "بريدك الإلكتروني",
      'Yes, I would like to receive news and offers by email. I can unsubscribe at any time.': "نعم، أرغب في تلقي الأخبار والعروض بالبريد الإلكتروني. يمكنني إلغاء الاشتراك في أي وقت.",
      'Almost done! Please confirm your subscription in the email we just sent you.': "اقتربت! يرجى تأكيد اشتراكك من الرسالة التي أرسلناها إليك الآن.",
      'I agree that my details are used to answer my request.': "أوافق على استخدام بياناتي للرد على طلبي.",
      'Privacy policy': "سياسة الخصوصية",
      'Send request': "إرسال الطلب",
      'Request a quote': "اطلب عرض سعر",
      'Thank you! Your request was sent. We will reply within one working day.': "شكرًا لك! تم إرسال طلبك. سنرد خلال يوم عمل واحد.",
      'Ask us': "اسألنا",
      'Answers from our help list': "إجابات من قائمة المساعدة لدينا",
      'Type your question…': "اكتب سؤالك…",
      'Your question': "سؤالك",
      'Send': "إرسال",
      'Chat with a person on WhatsApp': "تحدث مع شخص عبر واتساب",
      'Sorry, I do not have an answer to that yet.': "عذرًا، ليس لدي إجابة على ذلك بعد.",
      'Ask us on WhatsApp – your question is already typed in.': "اسألنا عبر واتساب – سؤالك مكتوب مسبقًا.",
      'You might also mean:': "ربما تقصد:",
      'Questions I can answer:': "أسئلة يمكنني الإجابة عنها:",
      'my question': "سؤالي",
      'Call': "اتصال",
      'Directions': "الاتجاهات",
      'Pause': "إيقاف مؤقت",
      'Play': "تشغيل",
      'Source': "المصدر",
      'Open chat': "افتح المحادثة",
      'Something went wrong. Please try again or message us on WhatsApp.': "حدث خطأ ما. يرجى المحاولة مرة أخرى أو مراسلتنا عبر واتساب.",
      'Please tick the box to agree.': "يرجى تحديد المربع للموافقة.",
      'Learn more': "اعرف المزيد",
      'Talk to us': "تحدث إلينا",
      'Call us': "اتصل بنا",
      'Zoom video call': "مكالمة فيديو عبر Zoom",
      'Google Meet video call': "مكالمة فيديو عبر Google Meet",
      'Microsoft Teams call': "مكالمة عبر Microsoft Teams",
      'Chat on WhatsApp': "تحدث عبر واتساب",
      'Chat on Telegram': "تحدث عبر تيليجرام",
      'Email us': "راسلنا بالبريد",
      'Prefer to talk? Call us or join a video call at these times.': "تفضّل التحدث؟ اتصل بنا أو انضم إلى مكالمة فيديو في هذه الأوقات.",
      'Mon–Fri 9:00–18:00': "الاثنين–الجمعة 9:00–18:00",
      'Tue & Thu 18:00–19:00': "الثلاثاء والخميس 18:00–19:00",
      'Sat 10:00–12:00': "السبت 10:00–12:00",
      'Start your review with a rating, for example 5/5 or ★★★★★.': "ابدأ تقييمك بعدد النجوم، مثل 5/5 أو ★★★★★.",
      'Language': "اللغة",
      'Incl. VAT, plus shipping': "شامل ضريبة القيمة المضافة، دون الشحن",
      'New arrivals': "وصل حديثًا",
      'Shop by category': "تسوق حسب الفئة",
      'Categories': "الفئات",
      'Popular products': "المنتجات الأكثر رواجًا",
      'Order directly': "اطلب مباشرة",
      'Why shop with us': "لماذا تتسوق معنا",
      'New collection': "تشكيلة جديدة",
      'About the shop': "عن المتجر",
      'Customer service': "خدمة العملاء",
      'Follow us': "تابعنا",
      'Home': "الرئيسية",
      'Women': "نساء",
      'Men': "رجال",
      'Contact': "اتصل بنا",
      'Shop now': "تسوق الآن",
      'See the sale': "شاهد التخفيضات",
      'Contact us': "تواصل معنا",
      'Shipping & delivery': "الشحن والتوصيل",
      'Returns (Widerruf)': "الإرجاع",
      'Search products...': "ابحث عن منتجات...",
      'Newer posts': "منتجات أحدث",
      'Older posts': "منتجات أخرى",
      'Newer post': "المنتج السابق",
      'Older post': "المنتج التالي",
      'Page not found': "الصفحة غير موجودة",
      'Back to home': "العودة إلى الرئيسية",
      'Search': "بحث",
      'Skip to content': "انتقل إلى المحتوى",
      'Open menu': "افتح القائمة",
      'Features': "المزايا",
      'Size guide': "دليل المقاسات",
      'Details': "التفاصيل",
      'The page you were looking for has moved or no longer exists.': "الصفحة التي تبحث عنها نُقلت أو لم تعد موجودة.",
      'No posts found here yet.': "لا توجد منتجات هنا بعد.",
      'How will you pay?': "كيف ستدفع؟",
      'Payment': "الدفع",
      'Cash on pickup': "الدفع نقدًا عند الاستلام",
      'Pay now with PayPal': "ادفع الآن عبر PayPal",
      'Size': "المقاس",
      'Colour': "اللون",
      'Color': "اللون",
      'Shop': "المتجر",
      'Kenya': "كينيا",
      'Fulfilment': "خدمات التخزين والشحن",
      'News': "أخبار",
      'Our branches': "فروعنا",
      'What we do': "ماذا نقدم",
      'How it works': "كيف يعمل",
      'What customers say': "آراء العملاء",
      'Questions & answers': "أسئلة وأجوبة",
      'Stay in the loop': "ابقَ على اطلاع"
    },
    am: {
      'Newsletter sign-up': 'የዜና መጽሔት ምዝገባ', 'Your email app opened. Press send there to finish signing up.': 'የኢሜይል መተግበሪያዎ ተከፍቷል። ምዝገባውን ለማጠናቀቅ እዚያ ላክ ይጫኑ።', 'WhatsApp opened. Press send there to finish signing up.': 'WhatsApp ተከፍቷል። ምዝገባውን ለማጠናቀቅ እዚያ ላክ ይጫኑ።',
      'Add to cart': "ወደ ጋሪ ጨምር",
      'Choose options': "አማራጮችን ይምረጡ",
      'Out of stock': "ተሽጦ አልቋል",
      'Sale': "ቅናሽ",
      'Quantity': "ብዛት",
      'Choose': "ይምረጡ",
      'Please choose': "እባክዎ ይምረጡ",
      'Cart': "ጋሪ",
      'Checkout': "ክፍያ ፈጽም",
      'Subtotal': "ንዑስ ድምር",
      'Shipping': "መላኪያ",
      'Free': "ነፃ",
      'Total': "ጠቅላላ",
      'Free shipping from': "ነፃ መላኪያ ከ",
      'Your cart is empty.': "ጋሪዎ ባዶ ነው።",
      'Full name': "ሙሉ ስም",
      'Phone': "ስልክ",
      'Email': "ኢሜይል",
      'Street and house number': "መንገድ እና የቤት ቁጥር",
      'Postcode': "የፖስታ ኮድ",
      'City': "ከተማ",
      'Country': "አገር",
      'Other city…': "ሌላ ከተማ…",
      'Note': "ማስታወሻ",
      'How do you want to order?': "እንዴት ማዘዝ ይፈልጋሉ?",
      'Send order': "ትዕዛዝ ላክ",
      'Back to cart': "ወደ ጋሪ ተመለስ",
      'Please fill in the marked fields.': "እባክዎ ምልክት የተደረገባቸውን መስኮች ይሙሉ።",
      'added to cart': "ወደ ጋሪ ተጨምሯል",
      'View cart': "ጋሪውን ይመልከቱ",
      'Only': "የቀሩት",
      'in stock': "ብቻ ናቸው",
      'Thank you': "እናመሰግናለን",
      'Order number': "የትዕዛዝ ቁጥር",
      'Bank transfer': "የባንክ ዝውውር",
      'Reference': "ማጣቀሻ",
      'Clear cart': "ጋሪውን አጽዳ",
      'Ask on WhatsApp': "በWhatsApp ይጠይቁ",
      'Ask on Telegram': "በTelegram ይጠይቁ",
      'Hi, I am interested in': "ሰላም፣ ፍላጎት አለኝ በ",
      'Place order (we confirm by email)': "ትዕዛዝ ያስገቡ (በኢሜይል እናረጋግጣለን)",
      'Send order on WhatsApp': "ትዕዛዙን በWhatsApp ላክ",
      'Send order on Telegram': "ትዕዛዙን በTelegram ላክ",
      'Pay with PayPal': "በPayPal ይክፈሉ",
      'Send order by email': "ትዕዛዙን በኢሜይል ላክ",
      'Sending…': "በመላክ ላይ…",
      'New order': "አዲስ ትዕዛዝ",
      'Order': "ትዕዛዝ",
      'Customer': "ደንበኛ",
      'Delivery address': "የማድረሻ አድራሻ",
      'WhatsApp opened with your order. Press send there to complete it.': "WhatsApp ከትዕዛዝዎ ጋር ተከፍቷል። ለማጠናቀቅ እዚያ ላክ ይጫኑ።",
      'Your email app opened with the order. Press send there to complete it.': "የኢሜይል መተግበሪያዎ ከትዕዛዙ ጋር ተከፍቷል። ለማጠናቀቅ እዚያ ላክ ይጫኑ።",
      'Your order is copied. In Telegram, paste it into the chat and send it.': "ትዕዛዝዎ ተቀድቷል። በTelegram ውይይት ውስጥ ለጥፈው ይላኩት።",
      'Copy order again': "ትዕዛዙን እንደገና ቅዳ",
      'Copied': "ተቀድቷል",
      'Open Telegram': "Telegram ክፈት",
      'Thank you! Your order was received. Total': "እናመሰግናለን! ትዕዛዝዎ ደርሶናል። ጠቅላላ",
      'Sorry, the order could not be sent.': "ይቅርታ፣ ትዕዛዙ ሊላክ አልቻለም።",
      'Please choose another way to order.': "እባክዎ ሌላ የማዘዣ መንገድ ይምረጡ።",
      'Online ordering is not available yet. Please contact us.': "በመስመር ላይ ማዘዝ ገና አልተጀመረም። እባክዎ ያግኙን።",
      'Image': "ምስል",
      'Video': "ቪዲዮ",
      'Close': "ዝጋ",
      'Remove': "አስወግድ",
      'Share': "አጋራ",
      'Copy link': "ሊንክ ቅዳ",
      'Link copied': "ሊንኩ ተቀድቷል",
      'Share on': "አጋራ በ",
      'Reviews': "ግምገማዎች",
      'Write a review': "ግምገማ ይጻፉ",
      'review': "ግምገማ",
      'reviews': "ግምገማዎች",
      'Rated': "ደረጃ",
      'out of 5': "ከ5",
      'based on': "በ",
      'Digital': "ዲጂታል",
      'Digital download': "ዲጂታል ማውረድ",
      'Weight': "ክብደት",
      'Dimensions': "መጠን",
      'Digital download – the link is sent by email after payment.': "ዲጂታል ማውረድ – ሊንኩ ከክፍያ በኋላ በኢሜይል ይላካል።",
      'Digital products: the download link is sent to your email after payment.': "ዲጂታል ምርቶች፦ የማውረጃ ሊንኩ ከክፍያ በኋላ ወደ ኢሜይልዎ ይላካል።",
      'The download link is sent to your email after payment.': "የማውረጃ ሊንኩ ከክፍያ በኋላ ወደ ኢሜይልዎ ይላካል።",
      'Download link to': "የማውረጃ ሊንክ ወደ",
      'Delivery': "ማድረስ",
      'About': "ስለ",
      'Parcel weight': "የጥቅሉ ክብደት",
      'No delivery option for this country. Please contact us.': "ለዚህ አገር የማድረሻ አማራጭ የለም። እባክዎ ያግኙን።",
      'Our partners': "አጋሮቻችን",
      'Certified & accredited': "የተረጋገጠ እና እውቅና ያለው",
      '2–4 working days': "2–4 የሥራ ቀናት",
      '3–5 working days': "3–5 የሥራ ቀናት",
      '4–7 working days': "4–7 የሥራ ቀናት",
      'By appointment': "በቀጠሮ",
      'Pickup in Berlin': "ከበርሊን መውሰድ",
      '14-day returns': "በ14 ቀናት ውስጥ መመለስ",
      'Personal service': "የግል አገልግሎት",
      'Fast shipping': "ፈጣን መላኪያ",
      'Free shipping from 50 €': "ከ50 € ጀምሮ ነፃ መላኪያ",
      'Order easily on WhatsApp or Telegram': "በWhatsApp ወይም በTelegram በቀላሉ ይዘዙ",
      'New arrivals every week': "በየሳምንቱ አዳዲስ ዕቃዎች",
      'Delivered in 2–4 working days': "በ2–4 የሥራ ቀናት ውስጥ ይደርሳል",
      'Easy and personal': "ቀላል እና የግል",
      'Secure payment': "ደህንነቱ የተጠበቀ ክፍያ",
      'PayPal or bank transfer': "PayPal ወይም የባንክ ዝውውር",
      'We answer within a day': "በአንድ ቀን ውስጥ እንመልሳለን",
      'We accept': "እንቀበላለን",
      'Cash on delivery': "ሲደርስ በጥሬ ገንዘብ",
      'Previous': "የቀደመው",
      'Next': "ቀጣይ",
      'Our team': "ቡድናችን",
      'Delivery partners': "የመላኪያ አጋሮች",
      'You may also like': "እነዚህንም ሊወዱ ይችላሉ",
      'Subscribe': "ይመዝገቡ",
      'Your email': "ኢሜይልዎ",
      'Yes, I would like to receive news and offers by email. I can unsubscribe at any time.': "አዎ፣ ዜናዎችንና ቅናሾችን በኢሜይል መቀበል እፈልጋለሁ። በማንኛውም ጊዜ ምዝገባዬን መሰረዝ እችላለሁ።",
      'Almost done! Please confirm your subscription in the email we just sent you.': "ሊጠናቀቅ ነው! እባክዎ አሁን በላክንልዎ ኢሜይል ምዝገባዎን ያረጋግጡ።",
      'I agree that my details are used to answer my request.': "መረጃዬ ጥያቄዬን ለመመለስ ጥቅም ላይ እንዲውል እስማማለሁ።",
      'Privacy policy': "የግላዊነት ፖሊሲ",
      'Send request': "ጥያቄ ላክ",
      'Request a quote': "የዋጋ ጥያቄ ያቅርቡ",
      'Thank you! Your request was sent. We will reply within one working day.': "እናመሰግናለን! ጥያቄዎ ተልኳል። በአንድ የሥራ ቀን ውስጥ እንመልሳለን።",
      'Ask us': "ይጠይቁን",
      'Answers from our help list': "ከእርዳታ ዝርዝራችን የተገኙ መልሶች",
      'Type your question…': "ጥያቄዎን ይጻፉ…",
      'Your question': "ጥያቄዎ",
      'Send': "ላክ",
      'Chat with a person on WhatsApp': "በWhatsApp ከሰው ጋር ይወያዩ",
      'Sorry, I do not have an answer to that yet.': "ይቅርታ፣ ለዚህ ገና መልስ የለኝም።",
      'Ask us on WhatsApp – your question is already typed in.': "በWhatsApp ይጠይቁን – ጥያቄዎ አስቀድሞ ተጽፏል።",
      'You might also mean:': "ምናልባት ይህን ማለትዎ ይሆናል፦",
      'Questions I can answer:': "ልመልሳቸው የምችላቸው ጥያቄዎች፦",
      'my question': "ጥያቄዬ",
      'Call': "ይደውሉ",
      'Directions': "አቅጣጫ",
      'Pause': "ለአፍታ አቁም",
      'Play': "ቀጥል",
      'Source': "ምንጭ",
      'Open chat': "ውይይት ክፈት",
      'Something went wrong. Please try again or message us on WhatsApp.': "ችግር ተፈጥሯል። እባክዎ እንደገና ይሞክሩ ወይም በWhatsApp መልዕክት ይላኩልን።",
      'Please tick the box to agree.': "ለመስማማት እባክዎ ሳጥኑን ምልክት ያድርጉ።",
      'Learn more': "ተጨማሪ ይወቁ",
      'Talk to us': "ያነጋግሩን",
      'Call us': "ይደውሉልን",
      'Zoom video call': "የZoom ቪዲዮ ጥሪ",
      'Google Meet video call': "የGoogle Meet ቪዲዮ ጥሪ",
      'Microsoft Teams call': "የMicrosoft Teams ጥሪ",
      'Chat on WhatsApp': "በWhatsApp ይወያዩ",
      'Chat on Telegram': "በTelegram ይወያዩ",
      'Email us': "ኢሜይል ይላኩልን",
      'Prefer to talk? Call us or join a video call at these times.': "መነጋገር ይመርጣሉ? በእነዚህ ሰዓቶች ይደውሉልን ወይም የቪዲዮ ጥሪ ይቀላቀሉ።",
      'Mon–Fri 9:00–18:00': "ሰኞ–አርብ 9:00–18:00",
      'Tue & Thu 18:00–19:00': "ማክሰኞ እና ሐሙስ 18:00–19:00",
      'Sat 10:00–12:00': "ቅዳሜ 10:00–12:00",
      'Start your review with a rating, for example 5/5 or ★★★★★.': "ግምገማዎን በደረጃ ይጀምሩ፣ ለምሳሌ 5/5 ወይም ★★★★★።",
      'Language': "ቋንቋ",
      'Incl. VAT, plus shipping': "ተ.እ.ታ ጨምሮ፣ መላኪያ ሳይጨምር",
      'New arrivals': "አዳዲስ ዕቃዎች",
      'Shop by category': "በምድብ ይግዙ",
      'Categories': "ምድቦች",
      'Popular products': "ተወዳጅ ምርቶች",
      'Order directly': "በቀጥታ ይዘዙ",
      'Why shop with us': "ለምን ከእኛ ይገዛሉ",
      'New collection': "አዲስ ስብስብ",
      'About the shop': "ስለ ሱቁ",
      'Customer service': "የደንበኞች አገልግሎት",
      'Follow us': "ይከተሉን",
      'Home': "መነሻ",
      'Women': "ሴቶች",
      'Men': "ወንዶች",
      'Contact': "አድራሻ",
      'Shop now': "አሁን ይግዙ",
      'See the sale': "ቅናሹን ይመልከቱ",
      'Contact us': "ያግኙን",
      'Shipping & delivery': "መላኪያ እና ማድረስ",
      'Returns (Widerruf)': "መመለስ",
      'Search products...': "ምርቶችን ይፈልጉ...",
      'Newer posts': "አዳዲስ ምርቶች",
      'Older posts': "ተጨማሪ ምርቶች",
      'Newer post': "የቀደመው ምርት",
      'Older post': "ቀጣዩ ምርት",
      'Page not found': "ገጹ አልተገኘም",
      'Back to home': "ወደ መነሻ ተመለስ",
      'Search': "ፈልግ",
      'Skip to content': "ወደ ይዘቱ ዝለል",
      'Open menu': "ምናሌ ክፈት",
      'Features': "ባህሪያት",
      'Size guide': "የመጠን መመሪያ",
      'Details': "ዝርዝሮች",
      'The page you were looking for has moved or no longer exists.': "የፈለጉት ገጽ ተዛውሯል ወይም ከእንግዲህ የለም።",
      'No posts found here yet.': "እዚህ ገና ምርቶች የሉም።",
      'How will you pay?': "እንዴት ይከፍላሉ?",
      'Payment': "ክፍያ",
      'Cash on pickup': "ሲወስዱ በጥሬ ገንዘብ",
      'Pay now with PayPal': "አሁን በPayPal ይክፈሉ",
      'Size': "መጠን",
      'Colour': "ቀለም",
      'Color': "ቀለም",
      'Shop': "ሱቅ",
      'Kenya': "ኬንያ",
      'Fulfilment': "የማከማቻ እና የመላኪያ አገልግሎት",
      'News': "ዜና",
      'Our branches': "ቅርንጫፎቻችን",
      'What we do': "የምንሠራው",
      'How it works': "እንዴት እንደሚሠራ",
      'What customers say': "ደንበኞች ምን ይላሉ",
      'Questions & answers': "ጥያቄዎችና መልሶች",
      'Stay in the loop': "መረጃ ያግኙ"
    },
    ti: {
      'Newsletter sign-up': 'ምዝገባ ጋዜጣ', 'Your email app opened. Press send there to finish signing up.': 'መተግበሪ ኢመይልኩም ተኸፊቱ ኣሎ። ምዝገባ ንምዝዛም ኣብኡ ስደድ ጠውቑ።', 'WhatsApp opened. Press send there to finish signing up.': 'WhatsApp ተኸፊቱ ኣሎ። ምዝገባ ንምዝዛም ኣብኡ ስደድ ጠውቑ።',
      'Add to cart': "ናብ ዘንቢል ወስኽ",
      'Choose options': "ምርጫታት ምረጽ",
      'Out of stock': "ተሸይጡ ተወዲኡ",
      'Sale': "ቅናሽ",
      'Quantity': "ብዝሒ",
      'Choose': "ምረጽ",
      'Please choose': "በጃኹም ምረጹ",
      'Cart': "ዘንቢል",
      'Checkout': "ክፍሊት ፈጽም",
      'Subtotal': "ንኡስ ድምር",
      'Shipping': "ምልኣኽ",
      'Free': "ብነጻ",
      'Total': "ጠቕላላ",
      'Free shipping from': "ብነጻ ምልኣኽ ካብ",
      'Your cart is empty.': "ዘንቢልኩም ባዶ እዩ።",
      'Full name': "ምሉእ ስም",
      'Phone': "ስልኪ",
      'Email': "ኢመይል",
      'Street and house number': "ጎደና ከምኡ'ውን ቁጽሪ ገዛ",
      'Postcode': "ፖስታዊ ኮድ",
      'City': "ከተማ",
      'Country': "ሃገር",
      'Other city…': "ካልእ ከተማ…",
      'Note': "መዘኻኸሪ",
      'How do you want to order?': "ብኸመይ ክትእዝዙ ትደልዩ?",
      'Send order': "ትእዛዝ ስደድ",
      'Back to cart': "ናብ ዘንቢል ተመለስ",
      'Please fill in the marked fields.': "በጃኹም ዝተመልከቱ ቦታታት ምልኡ።",
      'added to cart': "ናብ ዘንቢል ተወሲኹ",
      'View cart': "ዘንቢል ርአ",
      'Only': "ዝተረፉ",
      'in stock': "ጥራይ እዮም",
      'Thank you': "የቐንየልና",
      'Order number': "ቁጽሪ ትእዛዝ",
      'Bank transfer': "ባንካዊ ምትሕልላፍ",
      'Reference': "መወከሲ",
      'Clear cart': "ዘንቢል ኣጽሪ",
      'Ask on WhatsApp': "ብWhatsApp ሕተቱ",
      'Ask on Telegram': "ብTelegram ሕተቱ",
      'Hi, I am interested in': "ሰላም፡ ድሌት ኣለኒ ኣብ",
      'Place order (we confirm by email)': "ትእዛዝ ኣእትዉ (ብኢመይል ነረጋግጽ)",
      'Send order on WhatsApp': "ትእዛዝ ብWhatsApp ስደድ",
      'Send order on Telegram': "ትእዛዝ ብTelegram ስደድ",
      'Pay with PayPal': "ብPayPal ክፈሉ",
      'Send order by email': "ትእዛዝ ብኢመይል ስደድ",
      'Sending…': "ይስደድ ኣሎ…",
      'New order': "ሓድሽ ትእዛዝ",
      'Order': "ትእዛዝ",
      'Customer': "ዓሚል",
      'Delivery address': "ኣድራሻ ምብጻሕ",
      'WhatsApp opened with your order. Press send there to complete it.': "WhatsApp ምስ ትእዛዝኩም ተኸፊቱ ኣሎ። ንምዝዛም ኣብኡ ስደድ ጠውቑ።",
      'Your email app opened with the order. Press send there to complete it.': "መተግበሪ ኢመይልኩም ምስ ትእዛዝ ተኸፊቱ ኣሎ። ንምዝዛም ኣብኡ ስደድ ጠውቑ።",
      'Your order is copied. In Telegram, paste it into the chat and send it.': "ትእዛዝኩም ተቐዲሑ ኣሎ። ኣብ Telegram ናብ ዕላል ለጢፍኩም ስደዱዎ።",
      'Copy order again': "ትእዛዝ ደጊምካ ቕዳሕ",
      'Copied': "ተቐዲሑ",
      'Open Telegram': "Telegram ክፈት",
      'Thank you! Your order was received. Total': "የቐንየልና! ትእዛዝኩም በጺሑና ኣሎ። ጠቕላላ",
      'Sorry, the order could not be sent.': "ይቕሬታ፡ ትእዛዝ ክስደድ ኣይከኣለን።",
      'Please choose another way to order.': "በጃኹም ካልእ መንገዲ ምእዛዝ ምረጹ።",
      'Online ordering is not available yet. Please contact us.': "ብኢንተርነት ምእዛዝ ገና ኣይጀመረን። በጃኹም ተራኸቡና።",
      'Image': "ስእሊ",
      'Video': "ቪድዮ",
      'Close': "ዕጸው",
      'Remove': "ኣልግስ",
      'Share': "ኣካፍል",
      'Copy link': "መላግቦ ቕዳሕ",
      'Link copied': "መላግቦ ተቐዲሑ",
      'Share on': "ኣካፍል ኣብ",
      'Reviews': "ርእይቶታት",
      'Write a review': "ርእይቶ ጸሓፉ",
      'review': "ርእይቶ",
      'reviews': "ርእይቶታት",
      'Rated': "ደረጃ",
      'out of 5': "ካብ 5",
      'based on': "ብመሰረት",
      'Digital': "ዲጂታላዊ",
      'Digital download': "ዲጂታላዊ ምውራድ",
      'Weight': "ክብደት",
      'Dimensions': "ዓቐን",
      'Digital download – the link is sent by email after payment.': "ዲጂታላዊ ምውራድ – መላግቦ ድሕሪ ክፍሊት ብኢመይል ይለኣኽ።",
      'Digital products: the download link is sent to your email after payment.': "ዲጂታላዊ ፍርያት፦ መላግቦ ምውራድ ድሕሪ ክፍሊት ናብ ኢመይልኩም ይለኣኽ።",
      'The download link is sent to your email after payment.': "መላግቦ ምውራድ ድሕሪ ክፍሊት ናብ ኢመይልኩም ይለኣኽ።",
      'Download link to': "መላግቦ ምውራድ ናብ",
      'Delivery': "ምብጻሕ",
      'About': "ብዛዕባ",
      'Parcel weight': "ክብደት ጥቕሊ",
      'No delivery option for this country. Please contact us.': "ነዛ ሃገር ዝኸውን መማረጺ ምብጻሕ የለን። በጃኹም ተራኸቡና።",
      'Our partners': "መሻርኽትና",
      'Certified & accredited': "ዝተረጋገጸን ኣፍልጦ ዘለዎን",
      '2–4 working days': "2–4 መዓልታት ስራሕ",
      '3–5 working days': "3–5 መዓልታት ስራሕ",
      '4–7 working days': "4–7 መዓልታት ስራሕ",
      'By appointment': "ብቖጸራ",
      'Pickup in Berlin': "ካብ በርሊን ምውሳድ",
      '14-day returns': "ኣብ ውሽጢ 14 መዓልቲ ምምላስ",
      'Personal service': "ውልቃዊ ኣገልግሎት",
      'Fast shipping': "ቅልጡፍ ምልኣኽ",
      'Free shipping from 50 €': "ካብ 50 € ጀሚሩ ብነጻ ምልኣኽ",
      'Order easily on WhatsApp or Telegram': "ብWhatsApp ወይ ብTelegram ብቐሊሉ እዘዙ",
      'New arrivals every week': "ኣብ ነፍሲ ወከፍ ሰሙን ሓደስቲ ኣቑሑት",
      'Delivered in 2–4 working days': "ኣብ ውሽጢ 2–4 መዓልታት ስራሕ ይበጽሕ",
      'Easy and personal': "ቀሊልን ውልቃውን",
      'Secure payment': "ውሑስ ክፍሊት",
      'PayPal or bank transfer': "PayPal ወይ ባንካዊ ምትሕልላፍ",
      'We answer within a day': "ኣብ ውሽጢ ሓደ መዓልቲ ንምልሽ",
      'We accept': "ንቕበል",
      'Cash on delivery': "ምስ በጽሐ ብጥረ ገንዘብ",
      'Previous': "ዝሓለፈ",
      'Next': "ዝቕጽል",
      'Our team': "ጉጅለና",
      'Delivery partners': "መሻርኽቲ ምልኣኽ",
      'You may also like': "እዚኦም'ውን ክፈትዉኹም ይኽእሉ",
      'Subscribe': "ተመዝገቡ",
      'Your email': "ኢመይልኩም",
      'Yes, I would like to receive news and offers by email. I can unsubscribe at any time.': "እወ፡ ዜናታትን ቅናሻትን ብኢመይል ክቕበል እደሊ። ኣብ ዝኾነ ግዜ ምዝገባይ ክሰርዝ እኽእል።",
      'Almost done! Please confirm your subscription in the email we just sent you.': "ክንዛዘም ቀሪብና! በጃኹም ኣብቲ ሕጂ ዝለኣኽናልኩም ኢመይል ምዝገባኹም ኣረጋግጹ።",
      'I agree that my details are used to answer my request.': "ሓበሬታይ ንሕቶይ ንምምላስ ክጥቀመሉ ይሰማማዕ።",
      'Privacy policy': "ፖሊሲ ውልቃውነት",
      'Send request': "ሕቶ ስደድ",
      'Request a quote': "ዋጋ ሕተቱ",
      'Thank you! Your request was sent. We will reply within one working day.': "የቐንየልና! ሕቶኹም ተላኢኹ ኣሎ። ኣብ ውሽጢ ሓደ መዓልቲ ስራሕ ክንምልስ ኢና።",
      'Ask us': "ሕተቱና",
      'Answers from our help list': "መልስታት ካብ ዝርዝር ሓገዝና",
      'Type your question…': "ሕቶኹም ጸሓፉ…",
      'Your question': "ሕቶኹም",
      'Send': "ስደድ",
      'Chat with a person on WhatsApp': "ብWhatsApp ምስ ሰብ ተዘራረቡ",
      'Sorry, I do not have an answer to that yet.': "ይቕሬታ፡ ነዚ ገና መልሲ የብለይን።",
      'Ask us on WhatsApp – your question is already typed in.': "ብWhatsApp ሕተቱና – ሕቶኹም ኣቐዲሙ ተጻሒፉ ኣሎ።",
      'You might also mean:': "ምናልባት እዚ ማለትኩም ይኸውን፦",
      'Questions I can answer:': "ክምልሶም ዝኽእል ሕቶታት፦",
      'my question': "ሕቶይ",
      'Call': "ደውሉ",
      'Directions': "ኣንፈት",
      'Pause': "ደው ኣብል",
      'Play': "ቀጽል",
      'Source': "ምንጪ",
      'Open chat': "ዕላል ክፈት",
      'Something went wrong. Please try again or message us on WhatsApp.': "ጌጋ ተፈጢሩ። በጃኹም ደጊምኩም ፈትኑ ወይ ብWhatsApp መልእኽቲ ስደዱልና።",
      'Please tick the box to agree.': "ንምስምማዕ በጃኹም ነቲ ሳጹን ምልክት ግበሩ።",
      'Learn more': "ተወሳኺ ፍለጡ",
      'Talk to us': "ተዘራረቡና",
      'Call us': "ደውሉልና",
      'Zoom video call': "ናይ Zoom ቪድዮ ጻውዒት",
      'Google Meet video call': "ናይ Google Meet ቪድዮ ጻውዒት",
      'Microsoft Teams call': "ናይ Microsoft Teams ጻውዒት",
      'Chat on WhatsApp': "ብWhatsApp ተዘራረቡ",
      'Chat on Telegram': "ብTelegram ተዘራረቡ",
      'Email us': "ኢመይል ስደዱልና",
      'Prefer to talk? Call us or join a video call at these times.': "ምዝርራብ ትመርጹ? ኣብዚ ሰዓታት ደውሉልና ወይ ናብ ቪድዮ ጻውዒት ተጸንበሩ።",
      'Mon–Fri 9:00–18:00': "ሰኑይ–ዓርቢ 9:00–18:00",
      'Tue & Thu 18:00–19:00': "ሰሉስን ሓሙስን 18:00–19:00",
      'Sat 10:00–12:00': "ቀዳም 10:00–12:00",
      'Start your review with a rating, for example 5/5 or ★★★★★.': "ርእይቶኹም ብደረጃ ጀምሩ፡ ንኣብነት 5/5 ወይ ★★★★★።",
      'Language': "ቋንቋ",
      'Incl. VAT, plus shipping': "ግብሪ ወሲኹ፡ ምልኣኽ ከይወሰኸ",
      'New arrivals': "ሓደስቲ ኣቑሑት",
      'Shop by category': "ብዓይነት ዕደጉ",
      'Categories': "ዓይነታት",
      'Popular products': "ፍቱዋት ፍርያት",
      'Order directly': "ብቐጥታ እዘዙ",
      'Why shop with us': "ስለምንታይ ካባና ትዕድጉ",
      'New collection': "ሓድሽ ስብስብ",
      'About the shop': "ብዛዕባ እቲ ድኳን",
      'Customer service': "ኣገልግሎት ዓማዊል",
      'Follow us': "ተኸተሉና",
      'Home': "መበገሲ",
      'Women': "ደቂ ኣንስትዮ",
      'Men': "ደቂ ተባዕትዮ",
      'Contact': "ርክብ",
      'Shop now': "ሕጂ ዕደጉ",
      'See the sale': "ቅናሽ ርአዩ",
      'Contact us': "ተራኸቡና",
      'Shipping & delivery': "ምልኣኽን ምብጻሕን",
      'Returns (Widerruf)': "ምምላስ",
      'Search products...': "ፍርያት ድለዩ...",
      'Newer posts': "ሓደስቲ ፍርያት",
      'Older posts': "ተወሰኽቲ ፍርያት",
      'Newer post': "ዝሓለፈ ፍርያት",
      'Older post': "ዝቕጽል ፍርያት",
      'Page not found': "ገጽ ኣይተረኽበን",
      'Back to home': "ናብ መበገሲ ተመለስ",
      'Search': "ድለ",
      'Skip to content': "ናብ ትሕዝቶ ሕለፍ",
      'Open menu': "ዝርዝር ክፈት",
      'Features': "መለለዪታት",
      'Size guide': "መምርሒ ዓቐን",
      'Details': "ዝርዝራት",
      'The page you were looking for has moved or no longer exists.': "እቲ ዝደለኹሞ ገጽ ተቐዪሩ ወይ ድማ የለን።",
      'No posts found here yet.': "ኣብዚ ገና ፍርያት የለን።",
      'How will you pay?': "ብኸመይ ክትከፍሉ ኢኹም?",
      'Payment': "ክፍሊት",
      'Cash on pickup': "ኣብ ምውሳድ ብጥረ ገንዘብ",
      'Pay now with PayPal': "ሕጂ ብPayPal ክፈሉ",
      'Size': "ዓቐን",
      'Colour': "ሕብሪ",
      'Color': "ሕብሪ",
      'Shop': "ድኳን",
      'Kenya': "ኬንያ",
      'Fulfilment': "ኣገልግሎት ምኽዛንን ምልኣኽን",
      'News': "ዜና",
      'Our branches': "ጨናፍርና",
      'What we do': "እንገብሮ",
      'How it works': "ብኸመይ ከም ዝሰርሕ",
      'What customers say': "ዓማዊል እንታይ ይብሉ",
      'Questions & answers': "ሕቶታትን መልስታትን",
      'Stay in the loop': "ሓበሬታ ርኸቡ"
    },
    es: {
      "Newsletter sign-up": "Suscripción al boletín",
      "Your email app opened. Press send there to finish signing up.": "Se abrió tu aplicación de correo. Pulsa enviar para terminar la suscripción.",
      "WhatsApp opened. Press send there to finish signing up.": "Se abrió WhatsApp. Pulsa enviar para terminar la suscripción.",
      "Add to cart": "Añadir al carrito",
      "Choose options": "Elegir opciones",
      "Out of stock": "Agotado",
      "Sale": "Oferta",
      "Quantity": "Cantidad",
      "Choose": "Elegir",
      "Please choose": "Por favor, elige",
      "Cart": "Carrito",
      "Checkout": "Pagar",
      "Subtotal": "Subtotal",
      "Shipping": "Envío",
      "Free": "Gratis",
      "Total": "Total",
      "Free shipping from": "Envío gratis desde",
      "Your cart is empty.": "Tu carrito está vacío.",
      "Full name": "Nombre completo",
      "Phone": "Teléfono",
      "Email": "Correo electrónico",
      "Street and house number": "Calle y número",
      "Postcode": "Código postal",
      "City": "Ciudad",
      "Country": "País",
      "Other city…": "Otra ciudad…",
      "Note": "Nota",
      "How do you want to order?": "¿Cómo quieres hacer el pedido?",
      "Send order": "Enviar pedido",
      "Back to cart": "Volver al carrito",
      "Please fill in the marked fields.": "Por favor, rellena los campos marcados.",
      "added to cart": "añadido al carrito",
      "View cart": "Ver carrito",
      "Only": "Solo quedan",
      "in stock": "en stock",
      "Thank you": "Gracias",
      "Order number": "Número de pedido",
      "Bank transfer": "Transferencia bancaria",
      "Reference": "Referencia",
      "Clear cart": "Vaciar carrito",
      "Ask on WhatsApp": "Preguntar por WhatsApp",
      "Ask on Telegram": "Preguntar por Telegram",
      "Hi, I am interested in": "Hola, me interesa",
      "Place order (we confirm by email)": "Hacer pedido (lo confirmamos por correo)",
      "Send order on WhatsApp": "Enviar pedido por WhatsApp",
      "Send order on Telegram": "Enviar pedido por Telegram",
      "Pay with PayPal": "Pagar con PayPal",
      "Send order by email": "Enviar pedido por correo",
      "Sending…": "Enviando…",
      "New order": "Nuevo pedido",
      "Order": "Pedido",
      "Customer": "Cliente",
      "Delivery address": "Dirección de entrega",
      "WhatsApp opened with your order. Press send there to complete it.": "WhatsApp se abrió con tu pedido. Pulsa enviar para completarlo.",
      "Your email app opened with the order. Press send there to complete it.": "Tu aplicación de correo se abrió con el pedido. Pulsa enviar para completarlo.",
      "Your order is copied. In Telegram, paste it into the chat and send it.": "Tu pedido está copiado. En Telegram, pégalo en el chat y envíalo.",
      "Copy order again": "Copiar pedido otra vez",
      "Copied": "Copiado",
      "Open Telegram": "Abrir Telegram",
      "Thank you! Your order was received. Total": "¡Gracias! Hemos recibido tu pedido. Total",
      "Sorry, the order could not be sent.": "Lo sentimos, no se pudo enviar el pedido.",
      "Please choose another way to order.": "Por favor, elige otra forma de pedir.",
      "Online ordering is not available yet. Please contact us.": "El pedido en línea aún no está disponible. Por favor, contáctanos.",
      "Image": "Imagen",
      "Video": "Vídeo",
      "Close": "Cerrar",
      "Remove": "Quitar",
      "Share": "Compartir",
      "Copy link": "Copiar enlace",
      "Link copied": "Enlace copiado",
      "Share on": "Compartir en",
      "Reviews": "Opiniones",
      "Write a review": "Escribir una opinión",
      "review": "opinión",
      "reviews": "opiniones",
      "Rated": "Valorado con",
      "out of 5": "de 5",
      "based on": "según",
      "Digital": "Digital",
      "Digital download": "Descarga digital",
      "Weight": "Peso",
      "Dimensions": "Medidas",
      "Digital download – the link is sent by email after payment.": "Descarga digital: el enlace se envía por correo después del pago.",
      "Digital products: the download link is sent to your email after payment.": "Productos digitales: el enlace de descarga se envía a tu correo después del pago.",
      "The download link is sent to your email after payment.": "El enlace de descarga se envía a tu correo después del pago.",
      "Download link to": "Enlace de descarga a",
      "Delivery": "Entrega",
      "About": "Acerca de",
      "Parcel weight": "Peso del paquete",
      "No delivery option for this country. Please contact us.": "No hay envío para este país. Por favor, contáctanos.",
      "Our partners": "Nuestros socios",
      "Certified & accredited": "Certificados y acreditados",
      "2–4 working days": "2–4 días laborables",
      "3–5 working days": "3–5 días laborables",
      "4–7 working days": "4–7 días laborables",
      "By appointment": "Con cita previa",
      "Pickup in Berlin": "Recogida en Berlín",
      "14-day returns": "Devolución en 14 días",
      "Personal service": "Atención personal",
      "Fast shipping": "Envío rápido",
      "Free shipping from 50 €": "Envío gratis desde 50 €",
      "Order easily on WhatsApp or Telegram": "Pide fácilmente por WhatsApp o Telegram",
      "New arrivals every week": "Novedades cada semana",
      "Delivered in 2–4 working days": "Entrega en 2–4 días laborables",
      "Easy and personal": "Fácil y personal",
      "Secure payment": "Pago seguro",
      "PayPal or bank transfer": "PayPal o transferencia",
      "We answer within a day": "Respondemos en un día",
      "We accept": "Aceptamos",
      "Cash on delivery": "Pago contra reembolso",
      "Previous": "Anterior",
      "Next": "Siguiente",
      "Our team": "Nuestro equipo",
      "Delivery partners": "Socios de envío",
      "You may also like": "También te puede gustar",
      "Subscribe": "Suscribirse",
      "Your email": "Tu correo",
      "Yes, I would like to receive news and offers by email. I can unsubscribe at any time.": "Sí, quiero recibir novedades y ofertas por correo. Puedo darme de baja en cualquier momento.",
      "Almost done! Please confirm your subscription in the email we just sent you.": "¡Casi listo! Confirma tu suscripción en el correo que te acabamos de enviar.",
      "I agree that my details are used to answer my request.": "Acepto que mis datos se usen para responder a mi solicitud.",
      "Privacy policy": "Política de privacidad",
      "Send request": "Enviar solicitud",
      "Request a quote": "Pedir presupuesto",
      "Thank you! Your request was sent. We will reply within one working day.": "¡Gracias! Tu solicitud se ha enviado. Responderemos en un día laborable.",
      "Ask us": "Pregúntanos",
      "Answers from our help list": "Respuestas de nuestra lista de ayuda",
      "Type your question…": "Escribe tu pregunta…",
      "Your question": "Tu pregunta",
      "Send": "Enviar",
      "Chat with a person on WhatsApp": "Habla con una persona por WhatsApp",
      "Sorry, I do not have an answer to that yet.": "Lo siento, todavía no tengo respuesta para eso.",
      "Ask us on WhatsApp – your question is already typed in.": "Pregúntanos por WhatsApp: tu pregunta ya está escrita.",
      "You might also mean:": "Quizás quieres decir:",
      "Questions I can answer:": "Preguntas que puedo responder:",
      "my question": "mi pregunta",
      "Call": "Llamar",
      "Directions": "Cómo llegar",
      "Pause": "Pausa",
      "Play": "Reproducir",
      "Source": "Fuente",
      "Open chat": "Abrir chat",
      "Something went wrong. Please try again or message us on WhatsApp.": "Algo salió mal. Inténtalo de nuevo o escríbenos por WhatsApp.",
      "Please tick the box to agree.": "Por favor, marca la casilla para aceptar.",
      "Learn more": "Más información",
      "Talk to us": "Habla con nosotros",
      "Call us": "Llámanos",
      "Zoom video call": "Videollamada por Zoom",
      "Google Meet video call": "Videollamada por Google Meet",
      "Microsoft Teams call": "Llamada por Microsoft Teams",
      "Chat on WhatsApp": "Escribir por WhatsApp",
      "Chat on Telegram": "Escribir por Telegram",
      "Email us": "Escríbenos un correo",
      "Prefer to talk? Call us or join a video call at these times.": "¿Prefieres hablar? Llámanos o únete a una videollamada en estos horarios.",
      "Mon–Fri 9:00–18:00": "lun–vie 9:00–18:00",
      "Tue & Thu 18:00–19:00": "mar y jue 18:00–19:00",
      "Sat 10:00–12:00": "sáb 10:00–12:00",
      "Start your review with a rating, for example 5/5 or ★★★★★.": "Empieza tu opinión con una nota, por ejemplo 5/5 o ★★★★★.",
      "Language": "Idioma",
      "Incl. VAT, plus shipping": "IVA incluido, más envío",
      "New arrivals": "Novedades",
      "Shop by category": "Comprar por categoría",
      "Categories": "Categorías",
      "Popular products": "Productos populares",
      "Order directly": "Pide directamente",
      "Why shop with us": "Por qué comprar con nosotros",
      "New collection": "Nueva colección",
      "About the shop": "Sobre la tienda",
      "Customer service": "Atención al cliente",
      "Follow us": "Síguenos",
      "Home": "Inicio",
      "Women": "Mujer",
      "Men": "Hombre",
      "Contact": "Contacto",
      "Shop now": "Comprar ahora",
      "See the sale": "Ver ofertas",
      "Contact us": "Contáctanos",
      "Shipping & delivery": "Envío y entrega",
      "Returns (Widerruf)": "Devoluciones (desistimiento)",
      "Search products...": "Buscar productos...",
      "Newer posts": "Productos más recientes",
      "Older posts": "Más productos",
      "Newer post": "Producto anterior",
      "Older post": "Producto siguiente",
      "Page not found": "Página no encontrada",
      "Back to home": "Volver al inicio",
      "Search": "Buscar",
      "Skip to content": "Ir al contenido",
      "Open menu": "Abrir menú",
      "Features": "Características",
      "Size guide": "Guía de tallas",
      "Details": "Detalles",
      "The page you were looking for has moved or no longer exists.": "La página que buscas se ha movido o ya no existe.",
      "No posts found here yet.": "Todavía no hay productos aquí.",
      "How will you pay?": "¿Cómo vas a pagar?",
      "Payment": "Pago",
      "Cash on pickup": "Pago en efectivo al recoger",
      "Pay now with PayPal": "Pagar ahora con PayPal",
      "Size": "Talla",
      "Colour": "Color",
      "Color": "Color",
      "Shop": "Tienda",
      "Kenya": "Kenia",
      "Fulfilment": "Logística",
      "News": "Novedades",
      "Our branches": "Nuestras tiendas",
      "What we do": "Lo que hacemos",
      "How it works": "Cómo funciona",
      "What customers say": "Lo que dicen los clientes",
      "Questions & answers": "Preguntas y respuestas",
      "Stay in the loop": "Mantente al día"
    },
    zh: {
      "Newsletter sign-up": "订阅新闻简报",
      "Your email app opened. Press send there to finish signing up.": "邮件应用已打开。请在那里点击发送以完成订阅。",
      "WhatsApp opened. Press send there to finish signing up.": "WhatsApp 已打开。请在那里点击发送以完成订阅。",
      "Add to cart": "加入购物车",
      "Choose options": "选择规格",
      "Out of stock": "已售罄",
      "Sale": "特价",
      "Quantity": "数量",
      "Choose": "选择",
      "Please choose": "请选择",
      "Cart": "购物车",
      "Checkout": "结算",
      "Subtotal": "小计",
      "Shipping": "运费",
      "Free": "免费",
      "Total": "合计",
      "Free shipping from": "满额免运费：",
      "Your cart is empty.": "您的购物车是空的。",
      "Full name": "姓名",
      "Phone": "电话",
      "Email": "电子邮箱",
      "Street and house number": "街道和门牌号",
      "Postcode": "邮政编码",
      "City": "城市",
      "Country": "国家",
      "Other city…": "其他城市…",
      "Note": "备注",
      "How do you want to order?": "您想如何下单？",
      "Send order": "提交订单",
      "Back to cart": "返回购物车",
      "Please fill in the marked fields.": "请填写标记的栏目。",
      "added to cart": "已加入购物车",
      "View cart": "查看购物车",
      "Only": "仅剩",
      "in stock": "件",
      "Thank you": "谢谢",
      "Order number": "订单号",
      "Bank transfer": "银行转账",
      "Reference": "付款备注",
      "Clear cart": "清空购物车",
      "Ask on WhatsApp": "通过 WhatsApp 咨询",
      "Ask on Telegram": "通过 Telegram 咨询",
      "Hi, I am interested in": "您好，我对以下商品感兴趣：",
      "Place order (we confirm by email)": "下单（我们会通过邮件确认）",
      "Send order on WhatsApp": "通过 WhatsApp 发送订单",
      "Send order on Telegram": "通过 Telegram 发送订单",
      "Pay with PayPal": "使用 PayPal 付款",
      "Send order by email": "通过邮件发送订单",
      "Sending…": "发送中…",
      "New order": "新订单",
      "Order": "订单",
      "Customer": "客户",
      "Delivery address": "收货地址",
      "WhatsApp opened with your order. Press send there to complete it.": "WhatsApp 已打开并填好您的订单。请在那里点击发送完成下单。",
      "Your email app opened with the order. Press send there to complete it.": "邮件应用已打开并填好订单。请在那里点击发送完成下单。",
      "Your order is copied. In Telegram, paste it into the chat and send it.": "订单已复制。请在 Telegram 聊天中粘贴并发送。",
      "Copy order again": "再次复制订单",
      "Copied": "已复制",
      "Open Telegram": "打开 Telegram",
      "Thank you! Your order was received. Total": "谢谢！我们已收到您的订单。合计",
      "Sorry, the order could not be sent.": "抱歉，订单未能发送。",
      "Please choose another way to order.": "请选择其他下单方式。",
      "Online ordering is not available yet. Please contact us.": "暂不支持在线下单，请联系我们。",
      "Image": "图片",
      "Video": "视频",
      "Close": "关闭",
      "Remove": "删除",
      "Share": "分享",
      "Copy link": "复制链接",
      "Link copied": "链接已复制",
      "Share on": "分享到",
      "Reviews": "评价",
      "Write a review": "写评价",
      "review": "条评价",
      "reviews": "条评价",
      "Rated": "评分",
      "out of 5": "（满分 5 分）",
      "based on": "共",
      "Digital": "数字商品",
      "Digital download": "数字下载",
      "Weight": "重量",
      "Dimensions": "尺寸",
      "Digital download – the link is sent by email after payment.": "数字下载：付款后下载链接将通过邮件发送。",
      "Digital products: the download link is sent to your email after payment.": "数字商品：付款后下载链接将发送到您的邮箱。",
      "The download link is sent to your email after payment.": "付款后下载链接将发送到您的邮箱。",
      "Download link to": "下载链接发送至",
      "Delivery": "配送",
      "About": "关于",
      "Parcel weight": "包裹重量",
      "No delivery option for this country. Please contact us.": "暂不支持配送到该国家，请联系我们。",
      "Our partners": "合作伙伴",
      "Certified & accredited": "认证与资质",
      "2–4 working days": "2–4 个工作日",
      "3–5 working days": "3–5 个工作日",
      "4–7 working days": "4–7 个工作日",
      "By appointment": "需预约",
      "Pickup in Berlin": "柏林自提",
      "14-day returns": "14 天退货",
      "Personal service": "贴心服务",
      "Fast shipping": "快速发货",
      "Free shipping from 50 €": "满 50 € 免运费",
      "Order easily on WhatsApp or Telegram": "通过 WhatsApp 或 Telegram 轻松下单",
      "New arrivals every week": "每周上新",
      "Delivered in 2–4 working days": "2–4 个工作日送达",
      "Easy and personal": "简单贴心",
      "Secure payment": "安全支付",
      "PayPal or bank transfer": "PayPal 或银行转账",
      "We answer within a day": "一天内回复",
      "We accept": "支持的付款方式",
      "Cash on delivery": "货到付款",
      "Previous": "上一个",
      "Next": "下一个",
      "Our team": "我们的团队",
      "Delivery partners": "物流伙伴",
      "You may also like": "猜你喜欢",
      "Subscribe": "订阅",
      "Your email": "您的邮箱",
      "Yes, I would like to receive news and offers by email. I can unsubscribe at any time.": "是的，我想通过邮件接收新品和优惠信息。我可以随时退订。",
      "Almost done! Please confirm your subscription in the email we just sent you.": "快完成了！请在我们刚发给您的邮件中确认订阅。",
      "I agree that my details are used to answer my request.": "我同意使用我的信息来回复我的请求。",
      "Privacy policy": "隐私政策",
      "Send request": "发送请求",
      "Request a quote": "获取报价",
      "Thank you! Your request was sent. We will reply within one working day.": "谢谢！您的请求已发送，我们会在一个工作日内回复。",
      "Ask us": "向我们提问",
      "Answers from our help list": "来自帮助列表的回答",
      "Type your question…": "输入您的问题…",
      "Your question": "您的问题",
      "Send": "发送",
      "Chat with a person on WhatsApp": "通过 WhatsApp 联系人工客服",
      "Sorry, I do not have an answer to that yet.": "抱歉，我暂时无法回答这个问题。",
      "Ask us on WhatsApp – your question is already typed in.": "通过 WhatsApp 问我们，您的问题已自动填好。",
      "You might also mean:": "您是不是想问：",
      "Questions I can answer:": "我可以回答的问题：",
      "my question": "我的问题",
      "Call": "拨打电话",
      "Directions": "路线",
      "Pause": "暂停",
      "Play": "播放",
      "Source": "来源",
      "Open chat": "打开聊天",
      "Something went wrong. Please try again or message us on WhatsApp.": "出了点问题。请重试，或通过 WhatsApp 给我们发消息。",
      "Please tick the box to agree.": "请勾选同意。",
      "Learn more": "了解更多",
      "Talk to us": "联系我们",
      "Call us": "致电我们",
      "Zoom video call": "Zoom 视频通话",
      "Google Meet video call": "Google Meet 视频通话",
      "Microsoft Teams call": "Microsoft Teams 通话",
      "Chat on WhatsApp": "WhatsApp 聊天",
      "Chat on Telegram": "Telegram 聊天",
      "Email us": "给我们发邮件",
      "Prefer to talk? Call us or join a video call at these times.": "想直接沟通？请在以下时间致电或加入视频通话。",
      "Mon–Fri 9:00–18:00": "周一至周五 9:00–18:00",
      "Tue & Thu 18:00–19:00": "周二和周四 18:00–19:00",
      "Sat 10:00–12:00": "周六 10:00–12:00",
      "Start your review with a rating, for example 5/5 or ★★★★★.": "请以评分开头，例如 5/5 或 ★★★★★。",
      "Language": "语言",
      "Incl. VAT, plus shipping": "含增值税，另加运费",
      "New arrivals": "新品",
      "Shop by category": "按类别购物",
      "Categories": "分类",
      "Popular products": "热门商品",
      "Order directly": "直接下单",
      "Why shop with us": "为什么选择我们",
      "New collection": "新系列",
      "About the shop": "关于本店",
      "Customer service": "客户服务",
      "Follow us": "关注我们",
      "Home": "首页",
      "Women": "女士",
      "Men": "男士",
      "Contact": "联系",
      "Shop now": "立即购买",
      "See the sale": "查看特价",
      "Contact us": "联系我们",
      "Shipping & delivery": "运输与配送",
      "Returns (Widerruf)": "退货（撤回权）",
      "Search products...": "搜索商品...",
      "Newer posts": "较新的商品",
      "Older posts": "更多商品",
      "Newer post": "上一件商品",
      "Older post": "下一件商品",
      "Page not found": "页面未找到",
      "Back to home": "返回首页",
      "Search": "搜索",
      "Skip to content": "跳到正文",
      "Open menu": "打开菜单",
      "Features": "特点",
      "Size guide": "尺码指南",
      "Details": "详情",
      "The page you were looking for has moved or no longer exists.": "您要找的页面已移动或不存在。",
      "No posts found here yet.": "这里暂时没有商品。",
      "How will you pay?": "您将如何付款？",
      "Payment": "付款",
      "Cash on pickup": "自提时现金付款",
      "Pay now with PayPal": "立即使用 PayPal 付款",
      "Size": "尺码",
      "Colour": "颜色",
      "Color": "颜色",
      "Shop": "商店",
      "Kenya": "肯尼亚",
      "Fulfilment": "仓储物流",
      "News": "最新消息",
      "Our branches": "我们的门店",
      "What we do": "我们的业务",
      "How it works": "如何运作",
      "What customers say": "客户评价",
      "Questions & answers": "常见问题",
      "Stay in the loop": "获取最新消息"
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
    pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12.5a2.8 2.8 0 1 0 0-5.6 2.8 2.8 0 0 0 0 5.6z',
    send: 'M3 20.5 21.5 12 3 3.5 3 10l12 2-12 2z',
    pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
    play: 'M8 5v14l11-7z',
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
      // Without the order sheet the box still shows: sign-ups go to you by email or WhatsApp instead.
      var direct = !CFG.endpoint;
      if (direct && !CFG.email && !CFG.whatsapp) { section.hidden = true; console.warn('[shop] Newsletter needs google_sheet (or email/whatsapp) in Shop settings.'); return; }
      if (direct) console.warn('[shop] Newsletter: no google_sheet in Shop settings, sign-ups are sent by ' + (CFG.email ? 'email' : 'WhatsApp') + '.');
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
        if (direct) {
          var note = t('Newsletter sign-up') + ' – ' + CFG.shop + '\n' + t('Email') + ': ' + email.value.trim() + '\n' +
            t('Yes, I would like to receive news and offers by email. I can unsubscribe at any time.');
          if (CFG.email) location.href = 'mailto:' + CFG.email + '?subject=' + encodeURIComponent(t('Newsletter sign-up') + ' – ' + CFG.shop) + '&body=' + encodeURIComponent(note);
          else window.open('https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(note), '_blank', 'noopener');
          msg.textContent = t(CFG.email ? 'Your email app opened. Press send there to finish signing up.' : 'WhatsApp opened. Press send there to finish signing up.');
          return;
        }
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
    if (ASK) return;   // the "Ask" chat bubble has the WhatsApp button inside
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

  // ------------------------------------------------------------ ticker (homepage)
  // A gadget wrapped in <div class='shop-ticker'>, one item per line; the gadget title is the label on the left:
  //   Next container to Mombasa: 15 December | /p/kenya.html
  //   German online retail: *€88 bn* in 2024 | Source: HDE Online-Monitor 2025 | https://…
  // *Text between stars* is highlighted. A part starting with / or https:// is the link; any other part is the source.
  // It scrolls slowly, stops on mouse-over, focus or the pause button, and stands still for "reduce motion" visitors.
  function tickerNodes(text) {
    return String(text).split('*').map(function (s, i) { return i % 2 ? el('strong', { text: s }) : (s ? doc.createTextNode(s) : null); });
  }
  function renderTicker() {
    each(doc.querySelectorAll('.shop-ticker'), function (box) {
      var items = [];
      langLines(box).forEach(function (line) {
        var parts = line.split('|').map(function (x) { return x.trim(); });
        if (!parts[0]) return;
        var it = { text: t(parts[0]), link: '', source: '' };
        parts.slice(1).forEach(function (x) { if (safeLink(x)) it.link = it.link || x; else if (x) it.source = x; });
        items.push(it);
      });
      if (!items.length) return hideEmpty(box);
      var widget = box.closest('.widget');
      var head = widget && widget.querySelector('h2.title, h3.title');
      var label = head ? head.textContent.trim() : '';
      if (head) head.hidden = true;
      box.textContent = '';
      box.classList.add('is-ready');
      var makeList = function () {
        var ul = el('ul', { 'class': 'shop-ticker-list' });
        items.forEach(function (it) {
          var main = it.link
            ? el('a', { href: it.link, target: /^https/.test(it.link) ? '_blank' : false, rel: /^https/.test(it.link) ? 'noopener' : false }, tickerNodes(it.text))
            : el('span', {}, tickerNodes(it.text));
          ul.appendChild(el('li', { 'class': 'shop-ticker-item' }, [main,
            it.source ? el('span', { 'class': 'shop-ticker-source', text: '(' + t(it.source.replace(/^(source|quelle)\s*:\s*/i, 'Source: ')) + ')' }) : null]));
        });
        return ul;
      };
      var first = makeList();
      var track = el('div', { 'class': 'shop-ticker-track' }, [first]);
      var view = el('div', { 'class': 'shop-ticker-view' }, [track]);
      var toggle = el('button', { type: 'button', 'class': 'shop-ticker-toggle', 'aria-pressed': 'false', 'aria-label': t('Pause'), title: t('Pause') }, [svg(ICONS.pause)]);
      if (label) box.appendChild(el('span', { 'class': 'shop-ticker-label', text: t(label) }));
      box.appendChild(view);
      box.appendChild(toggle);
      toggle.addEventListener('click', function () {
        var paused = box.classList.toggle('is-paused');
        toggle.setAttribute('aria-pressed', paused ? 'true' : 'false');
        toggle.setAttribute('aria-label', t(paused ? 'Play' : 'Pause')); toggle.title = t(paused ? 'Play' : 'Pause');
        toggle.replaceChild(svg(ICONS[paused ? 'play' : 'pause']), toggle.firstChild);
      });
      var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var setup = function () {
        if (still) { box.classList.add('is-still'); return; }
        // Fill at least one screen width, then add a hidden copy so the loop has no gap.
        var guard = 0;
        while (first.scrollWidth < view.clientWidth && guard++ < 8) {
          items.forEach(function (it, i) { first.appendChild(first.children[i].cloneNode(true)); });
        }
        var copy = first.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        each(copy.querySelectorAll('a'), function (a) { a.setAttribute('tabindex', '-1'); });
        track.appendChild(copy);
        var speed = 60; // pixels per second
        track.style.animationDuration = Math.max(12, Math.round(first.scrollWidth / speed)) + 's';
        box.classList.add('is-moving');
      };
      if (box.offsetParent !== null) setup();
      else if (window.requestAnimationFrame) requestAnimationFrame(function () { if (box.offsetParent !== null) setup(); });
    });
  }

  // ------------------------------------------------------------ branches (homepage)
  // A gadget wrapped in <div class='shop-branches'>, one branch per line (text: line = intro):
  //   name | address | phone | WhatsApp number | opening hours | map link (optional) | email (optional)
  // Without a map link, "Directions" opens Google Maps with the address. Adds LocalBusiness data for Google.
  function renderBranches() {
    each(doc.querySelectorAll('.shop-branches'), function (box) {
      var d = lineParts(box);
      var items = d.items.filter(function (p) { return p[0] && (p[1] || p[2]); });
      if (!items.length) return hideEmpty(box);
      ready(box, d.intro);
      var grid = el('div', { 'class': 'shop-branches-grid' }), data = [];
      items.forEach(function (p) {
        var name = p[0], addr = p[1] || '', phone = p[2] || '', wa = (p[3] || '').replace(/[^\d]/g, ''), hours = p[4] || '';
        var map = safeLink(p[5]) || (addr ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr) : '');
        var mail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p[6] || '') ? p[6] : '';
        var tel = phone.replace(/[^\d+]/g, '');
        var outside = function (href) { return /^https/.test(href) ? { target: '_blank', rel: 'noopener' } : {}; };
        var link = function (cls, href, kids) { var a = { 'class': cls, href: href }, o = outside(href); a.target = o.target || false; a.rel = o.rel || false; return el('a', a, kids); };
        var actions = [];
        if (tel) actions.push(link('shop-btn shop-branch-call', 'tel:' + tel, [svg(ICONS.phone, 'stroke'), ' ' + t('Call')]));
        if (wa.length >= 7) actions.push(link('shop-btn shop-branch-wa', 'https://wa.me/' + wa + '?text=' + encodeURIComponent(t('Hi') + ' ' + CFG.shop + ' – ' + name + ', '), [svg(ICONS.whatsapp), ' WhatsApp']));
        if (map) actions.push(link('shop-btn shop-btn-ghost shop-branch-map', map, [svg(ICONS.pin, 'stroke'), ' ' + t('Directions')]));
        grid.appendChild(el('article', { 'class': 'shop-branch' }, [
          el('h3', { text: t(name) }),
          addr ? el('p', { 'class': 'shop-branch-line' }, [svg(ICONS.pin, 'stroke'), el('span', { text: addr })]) : null,
          tel ? el('p', { 'class': 'shop-branch-line' }, [svg(ICONS.phone, 'stroke'), el('a', { href: 'tel:' + tel, text: phone })]) : null,
          mail ? el('p', { 'class': 'shop-branch-line' }, [svg(ICONS.mail, 'stroke'), el('a', { href: 'mailto:' + mail, text: mail })]) : null,
          hours ? el('p', { 'class': 'shop-branch-line' }, [svg(ICONS.clock, 'stroke'), el('span', { text: t(hours) })]) : null,
          actions.length ? el('div', { 'class': 'shop-branch-actions' }, actions) : null
        ]));
        var biz = { '@context': 'https://schema.org', '@type': 'LocalBusiness', name: CFG.shop + ' – ' + name, url: location.origin + '/' };
        if (addr) biz.address = addr;
        if (phone) biz.telephone = phone;
        if (mail) biz.email = mail;
        if (/^https/.test(map)) biz.hasMap = map;
        data.push(biz);
      });
      box.appendChild(grid);
      if (box.offsetParent !== null && data.length) {   // only where the section is visible (homepage)
        var ld = el('script', { type: 'application/ld+json' });
        ld.textContent = JSON.stringify(data.length === 1 ? data[0] : data);
        doc.head.appendChild(ld);
      }
    });
  }

  // ------------------------------------------------------------ "Ask" assistant (every page)
  // A gadget in the hidden admin area wrapped in <div class='shop-assistant'>:
  //   name: Ask Kreislo
  //   greeting: Hi! Ask me about payment, delivery, shipping to Kenya or fulfilment.
  //   suggest: How do I pay? ; Do you ship to Kenya? ; Where are you?
  //   use_faq: yes            (also answers from the "Questions & answers" gadget)
  //   log_unanswered: yes     (questions it could not answer go to the order sheet, tab "Questions")
  //   question | answer | other words people use for it
  // It is not AI: it picks the closest question from the list. No match: WhatsApp with the question typed in.
  // An empty gadget switches it off (the round WhatsApp button comes back).
  var STOP = ' a an the is are am do does did i you we it its to of for in on at and or my your our can could how what when where which who whom why with be will would should there this that these me us please hi hello hey get got have has any some much many about from ' +
    'ich du sie wir es der die das den dem des ein eine einen ist sind und oder wie was wo wann kann konnen mein meine ihr ihre bitte hallo hi habt haben gibt man mit von zu im am auf fur ' +
    'je tu vous nous il le la les un une des du est sont et ou comment quoi quand peux pouvez puis mon ma mes votre vos bonjour salut avec pour dans sur de ' +
    'na ya wa za la kwa ni je nini gani vipi lini wapi nina una ana mna tuna hii hiyo huu hilo habari jambo naomba tafadhali ' +
    'في من علي عن الي هل كيف ما ماذا متي اين انا انت نحن هذا هذه لي لك مع او مرحبا ' +
    'el la lo los las del que en un una por con para mi mis tu tus su como donde cuando cuanto puedo puede hola hay ' +
    '怎么 怎样 如何 什么 可以 我们 你们 您们 是否 请问 你好 您好 一下 哪里 ';
  var CJK_STOP = STOP.split(' ').filter(function (x) { return /[\u3400-\u9fff]/.test(x); });
  function words(s) {
    var plain = String(s || '').toLowerCase();
    // strip accents (Latin) and short vowel marks (Arabic); unify Arabic letter variants
    if (plain.normalize) plain = plain.normalize('NFD').replace(/[̀-ًͯ-ٰٟ]/g, '');
    plain = plain.replace(/ß/g, 'ss').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي');
    var parts;
    try { parts = plain.split(new RegExp('[^\\p{L}\\p{N}]+', 'u')); } // any script: Latin, Arabic, Ge'ez (Amharic, Tigrinya) …
    catch (e) { parts = plain.split(/[\s.,;:!?()"'\-\/|·…؟،፡-፨]+/); }
    // Chinese and Japanese have no spaces: split runs of Han characters into overlapping pairs (付款方式 → 付款 款方 方式)
    var cjk = /[\u3400-\u9fff\uf900-\ufaff]{2,}/;
    parts = parts.reduce(function (all, w) {
      if (!cjk.test(w)) { all.push(w); return all; }
      CJK_STOP.forEach(function (x) { w = w.split(x).join(' '); });
      w.replace(/[我你您他她吗呢吧啊的了么在要]/g, ' ').split(/([\u3400-\u9fff\uf900-\ufaff]+)/).forEach(function (run) {
        if (!/^[\u3400-\u9fff\uf900-\ufaff]+$/.test(run)) { run = run.trim(); if (run.length > 1) all.push(run); return; }
        if (run.length < 2) return;
        for (var i = 0; i < run.length - 1; i++) all.push(run.slice(i, i + 2));
      });
      return all;
    }, []);
    return parts.filter(function (w) { return w.length > 1 && STOP.indexOf(' ' + w + ' ') === -1; })
      .map(function (w) { return w.length > 4 ? w.replace(/(ing|ed|es|en|er|s|e|n)$/, '') : w; });
  }
  function sameWord(a) {
    return function (b) { return a === b || (a.length >= 4 && b.length >= 4 && (b.indexOf(a) !== -1 || a.indexOf(b) !== -1)); };
  }
  function collectAssistant() {
    var box = doc.querySelector('.shop-assistant');
    if (!box) return null;
    var cfg = { name: 'Ask us', greeting: '', suggest: [], useFaq: true, log: false, placeholder: '', qa: [] };
    var lines = langLines(box);
    if (!lines.length) return null;   // empty gadget = assistant switched off
    lines.forEach(function (line) {
      var m = /^\s*(name|greeting|suggest|use_faq|log_unanswered|placeholder)\s*:\s*(.*)$/i.exec(line);
      if (m) {
        var k = m[1].toLowerCase(), v = m[2].trim();
        if (k === 'name') cfg.name = v || cfg.name;
        else if (k === 'greeting') cfg.greeting = v;
        else if (k === 'suggest') cfg.suggest = v.split(';').map(function (x) { return x.trim(); }).filter(Boolean);
        else if (k === 'use_faq') cfg.useFaq = on(v);
        else if (k === 'log_unanswered') cfg.log = on(v);
        else cfg.placeholder = v;
        return;
      }
      var p = line.split('|').map(function (x) { return x.trim(); });
      if (p[0] && p[1]) cfg.qa.push({ q: p[0], a: p[1], k: p.slice(2).join(' ') });
    });
    if (cfg.useFaq) each(doc.querySelectorAll('.shop-faq'), function (f) {
      lineParts(f).items.forEach(function (p) {
        if (p[1] && !cfg.qa.some(function (x) { return x.q.toLowerCase() === p[0].toLowerCase(); })) cfg.qa.push({ q: p[0], a: p.slice(1).join(' | '), k: '' });
      });
    });
    if (!cfg.qa.length) return null;
    cfg.qa.forEach(function (x) { x.wq = words(x.q); x.wk = words(x.k); x.wa = words(x.a); });
    return cfg;
  }
  function bestAnswers(cfg, question) {
    var norm = function (q) { return String(q).toLowerCase().replace(/[\s?!.؟。]+$/, '').trim(); };   // "what is a kit" = "What is a kit?"
    var exact = cfg.qa.filter(function (x) { return norm(x.q) === norm(question); })[0];
    if (exact) return [exact];
    var qw = words(question);
    if (!qw.length) return [];
    return cfg.qa.map(function (x) {
      var s = 0, strong = 0;
      qw.forEach(function (w) {
        var m = sameWord(w), v = 0;
        if (x.wk.some(m)) v = 3;
        if (x.wq.some(m)) v = Math.max(v, 2.5);
        if (!v && x.wa.some(m)) v = 0.6;
        if (v >= 2.5) strong++;
        s += v;
      });
      return { x: x, s: s + 2 * strong / qw.length, strong: strong };
    }).filter(function (r) { return r.strong > 0 && r.s >= 2.5; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 3)
      .filter(function (r, i, all) { return i === 0 || r.s >= all[0].s * 0.6; })
      .map(function (r) { return r.x; });
  }
  // Answer text with clickable links: https://…, /p/… and /search/… paths, email addresses.
  function answerNodes(text) {
    var out = [], re = /(https:\/\/[^\s]+|\/(?:p|search)\/[^\s]+|[^\s@()]+@[^\s@()]+\.[a-z]{2,})/gi, last = 0, m;
    while ((m = re.exec(text))) {
      var raw = m[1].replace(/[.,;:!?)]+$/, ''), end = m.index + raw.length;
      if (m.index > last) out.push(text.slice(last, m.index));
      var href = /@/.test(raw) && !/^https/.test(raw) ? 'mailto:' + raw : raw;
      out.push(el('a', { href: href, target: /^https/.test(href) ? '_blank' : false, rel: /^https/.test(href) ? 'noopener' : false,
        text: /^\/p\//.test(raw) ? raw.replace(/^\/p\/|\.html$/g, '').replace(/[-_]/g, ' ') : raw }));
      last = end; re.lastIndex = end;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }
  function waLink(question) {
    var item = doc.querySelector('.shop-item');
    var title = item ? (item.getAttribute('data-title') || '').trim() : '';
    var text = t('Hi') + ' ' + CFG.shop + ', ' + (question ? t('my question') + ': ' + question : '') +
      (title ? (question ? ' – ' : '') + t('I have a question about') + ' "' + title + '": ' + location.href.split('#')[0] : '');
    return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text);
  }
  var ASK = null;
  function buildAssistant(cfg) {
    var name = t(cfg.name), opened = false, asked = {};
    var bubble = el('button', { type: 'button', 'class': 'shop-chat-bubble', 'aria-expanded': 'false', 'aria-controls': 'shop-chat-panel', 'aria-label': t('Open chat') + ': ' + name },
      [svg(ICONS.chat, 'stroke'), el('span', { 'class': 'shop-chat-bubble-text', text: name })]);
    var log = el('div', { 'class': 'shop-chat-log', role: 'log', 'aria-live': 'polite' });
    var input = el('input', { type: 'text', 'class': 'shop-chat-input', name: 'question', maxlength: '300', autocomplete: 'off',
      placeholder: t(cfg.placeholder || 'Type your question…'), 'aria-label': t('Your question') });
    var form = el('form', { 'class': 'shop-chat-form' }, [input, el('button', { type: 'submit', 'class': 'shop-chat-send', 'aria-label': t('Send'), title: t('Send') }, [svg(ICONS.send)])]);
    var wa = CFG.whatsapp ? el('a', { 'class': 'shop-chat-wa', href: waLink(''), target: '_blank', rel: 'noopener' }, [svg(ICONS.whatsapp), ' ' + t('Chat with a person on WhatsApp')]) : null;
    var close = function () {
      panel.hidden = true; bubble.setAttribute('aria-expanded', 'false'); doc.body.classList.remove('shop-chat-open'); bubble.focus();
    };
    var panel = el('div', { 'class': 'shop-chat-panel', id: 'shop-chat-panel', role: 'dialog', 'aria-label': name, hidden: 'hidden' }, [
      el('div', { 'class': 'shop-chat-head' }, [
        el('span', { 'class': 'shop-chat-avatar' }, [svg(ICONS.chat, 'stroke')]),
        el('div', { 'class': 'shop-chat-title' }, [el('strong', { text: name }), el('span', { text: t('Answers from our help list') })]),
        el('button', { type: 'button', 'class': 'shop-chat-close', 'aria-label': t('Close'), title: t('Close'), text: '×', onclick: close })]),
      log, el('div', { 'class': 'shop-chat-foot' }, [form, wa])]);
    var say = function (who, kids) {
      var msg = el('div', { 'class': 'shop-chat-msg is-' + who }, kids);
      log.appendChild(msg);
      log.scrollTop = log.scrollHeight;
      return msg;
    };
    var chips = function (title, qs) {
      if (!qs.length) return;
      say('bot', [title ? el('p', { 'class': 'shop-chat-note', text: t(title) }) : null,
        el('div', { 'class': 'shop-chat-chips' }, qs.map(function (q) {
          return el('button', { type: 'button', 'class': 'shop-chat-chip', text: t(q), onclick: function () { ask(q); } });
        }))]);
    };
    var ask = function (q) {
      q = String(q || '').trim().slice(0, 300);
      if (!q) return;
      say('user', [el('p', { text: q })]);
      if (wa) wa.href = waLink(q);
      var found = bestAnswers(cfg, q);
      if (found.length) {
        say('bot', [el('p', { 'class': 'shop-chat-q', text: t(found[0].q) }), el('p', {}, answerNodes(t(found[0].a)))]);
        chips('You might also mean:', found.slice(1).map(function (x) { return x.q; }));
        return;
      }
      say('bot', [el('p', { text: t('Sorry, I do not have an answer to that yet.') }),
        CFG.whatsapp ? el('p', { text: t('Ask us on WhatsApp – your question is already typed in.') }) : null,
        CFG.whatsapp ? el('a', { 'class': 'shop-btn shop-chat-wa-btn', href: waLink(q), target: '_blank', rel: 'noopener' }, [svg(ICONS.whatsapp), ' ' + t('Ask on WhatsApp')]) : null]);
      chips('Questions I can answer:', (cfg.suggest.length ? cfg.suggest : cfg.qa.slice(0, 4).map(function (x) { return x.q; })).slice(0, 4));
      var key = q.toLowerCase();
      if (cfg.log && CFG.endpoint && !asked[key] && window.fetch) {
        asked[key] = 1;
        sendLead({ kind: 'question', fields: { Question: q } }).catch(function () { /* logging is optional */ });
      }
    };
    form.addEventListener('submit', function (e) { e.preventDefault(); var q = input.value; input.value = ''; ask(q); });
    bubble.addEventListener('click', function () {
      if (!panel.hidden) return close();
      panel.hidden = false; bubble.setAttribute('aria-expanded', 'true'); doc.body.classList.add('shop-chat-open');
      if (!opened) {
        opened = true;
        say('bot', [el('p', { text: t(cfg.greeting || 'Hi! How can we help?') })]);
        chips('', (cfg.suggest.length ? cfg.suggest : cfg.qa.slice(0, 4).map(function (x) { return x.q; })).slice(0, 5));
      }
      setTimeout(function () { input.focus(); }, 30);
    });
    panel.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    doc.body.appendChild(panel);
    doc.body.appendChild(bubble);
  }

  // ------------------------------------------------------------ logo rows
  // Partners on the homepage, accreditation symbols in the footer: a gadget wrapped in
  // <div class='shop-logos'>, one logo per line:  Name | logo image link | website (optional).
  // A line without an image shows the name as a badge.
  // Default: one clean row, logos the same height, grey until the mouse is over them.
  // Options:  grey: no  (always in colour)   style: tiles  (each logo in a white box)
  function renderLogos() {
    var YES = /^(yes|true|on|ja)$/i, NO = /^(no|false|off|nein)$/i;
    each(doc.querySelectorAll('.shop-logos'), function (box) {
      var grey = true, tiles = false;
      var items = gadgetLinesOf(box).map(function (line) {
        if (/^\s*#/.test(line)) return null;                       // notes for the owner
        var opt = /^\s*(grey|gray|colou?r|style)\s*:\s*(\S+)\s*$/i.exec(line);
        if (opt) {
          var k = opt[1].toLowerCase(), v = opt[2];
          if (k === 'style') tiles = /^(tiles?|boxe?s?)$/i.test(v);
          else if (/^gr/.test(k)) grey = !NO.test(v);
          else grey = !YES.test(v);                                // colour: yes = no grey
          return null;
        }
        var parts = line.split('|').map(function (x) { return x.trim(); });
        if (!parts[0]) return null;
        return { name: parts[0], img: /^https:\/\//.test(parts[1] || '') ? sized(parts[1], 400) : '',
                 link: /^(https?:\/\/|\/)/.test(parts[2] || '') ? parts[2] : '' };
      }).filter(Boolean);
      if (!items.length) return;
      box.textContent = '';
      box.classList.add('is-ready');
      box.classList.toggle('is-grey', grey);
      box.classList.toggle('is-tiles', tiles);
      var row = el('ul', { 'class': 'shop-logo-list' });
      items.forEach(function (it) {
        var badge = function () { return el('span', { 'class': 'shop-logo-name', text: t(it.name) }); };
        var inner = it.img ? el('img', { src: it.img, alt: it.name, loading: 'lazy', decoding: 'async' }) : badge();
        var outside = /^https?:/.test(it.link);
        var tile = it.link
          ? el('a', { 'class': 'shop-logo-tile', href: it.link, title: it.name, 'aria-label': it.name, target: outside ? '_blank' : false, rel: outside ? 'noopener' : false }, [inner])
          : el('span', { 'class': 'shop-logo-tile', title: it.name }, [inner]);
        var li = el('li', { 'class': 'shop-logo' + (it.img ? '' : ' is-text') }, [tile]);
        if (it.img) inner.addEventListener('error', function () {   // broken picture link: show the name instead
          li.classList.add('is-text'); tile.replaceChild(badge(), inner);
        });
        row.appendChild(li);
      });
      box.appendChild(row);
    });
  }


  // ------------------------------------------------------------ page language
  // Languages written right to left, and native names for the language picker.
  var RTL = ['ar', 'fa', 'he', 'ur', 'ps'];
  var NATIVE = { en: 'English', de: 'Deutsch', fr: 'Français', sw: 'Kiswahili', ar: 'العربية', am: 'አማርኛ', ti: 'ትግርኛ', zh: '中文',
    so: 'Soomaali', es: 'Español', it: 'Italiano', pt: 'Português', tr: 'Türkçe', pl: 'Polski', nl: 'Nederlands' };
  function applyLanguage() {
    doc.documentElement.lang = LANG;
    doc.documentElement.dir = RTL.indexOf(LANG) > -1 ? 'rtl' : 'ltr';
    doc.documentElement.classList.add('lang-' + LANG);
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
        var name = NATIVE[l] || l.toUpperCase();
        if (!NATIVE[l]) { try { name = new Intl.DisplayNames([l], { type: 'language' }).of(l); } catch (e) { /* code is fine */ } }
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
    ASK = collectAssistant();   // reads the FAQ gadget too, so before renderFaq() rebuilds it
    renderFaq();
    renderTicker();
    renderBranches();
    renderNewsletter();
    renderLeadForms();
    if (ASK) buildAssistant(ASK);
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
