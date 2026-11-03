# Products, orders and payments

## Contents
1. Adding a product (owner instructions)
2. Product block reference
3. Choosing how orders arrive
4. Apps Script order inbox
5. Payments
6. Legal checklist (Germany / EU)

---

## 1. Adding a product (give the owner these steps)

1. **Posts → New post.** Title = product name.
2. Upload the photos first (square or 4:5, ideally on a plain or transparent background). The first photo
   becomes the card image; all photos form the gallery.
3. Switch to **HTML view** (the `<>` pencil icon at top left → HTML view) and add the product block at the **very top**:
   ```html
   <div class="product" data-price="39.90" data-old-price="49.90" data-stock="12"
        data-sku="TS-01" data-options="Size: S, M, L | Colour: Red, Black">Price: 39.90 EUR</div>
   ```
   The text inside ("Price: …") is what visitors without JavaScript and simple crawlers see. Keep it honest.
4. Switch back to compose view and write the description.
5. If you use **Insert jump break**, keep the product block *above* it (list pages only receive the text before the break).
6. **Labels = categories** (`Shirts`, `Women`). They drive the menu and category pages.
7. Publish. Change the price later by editing `data-price` in HTML view.

## 2. Product block reference

| Attribute | Required | Meaning |
|---|---|---|
| `data-price` | yes | Current price. `39.90`, `39,90` and `1.299,00` all work |
| `data-old-price` | no | Previous price. Shown crossed out with a "Sale" badge, but only if higher than the price |
| `data-stock` | no | Units in stock. `0` = sold out; empty = unlimited; the cart never exceeds it |
| `data-sku` | no | Article number, used in structured data and the order |
| `data-options` | no | `Name: a, b, c` groups separated by `|`. The buyer must choose one per group |
| `data-video` | no | YouTube link(s), comma-separated. Shown in the gallery after the photos (played from youtube-nocookie.com) |

**SpotCommerce labels** (`_39` price, `-49` old price, `!0` stock) still work when Shop settings has
`label_prices: yes`. The block wins when both exist.

What the shop layer does with it: prices, "−20%" sale badges, "Only 2 in stock" and sold-out states on
cards; a photo + video gallery, option pickers, quantity and Add to cart on the product page; `Product` +
`Offer` (+ `AggregateRating`) JSON-LD for Google; the block itself is hidden once JS has read it.

**Description building blocks** (CSS in shop.css; ready-made posts in `assets/samples/`):

| Markup | Result |
|---|---|
| photos at the top of the post | gallery (they're hidden from the text) |
| `<div class="photo-grid">` (`cols-3` for three) | photos in a grid that stay in the text |
| `<div class="photo-wide">`, `<div class="two-cols">` | one big photo / photo next to text, stays in the text |
| `<div class="video-wide"><iframe …></div>` | a 16:9 video in the text |
| `<ul class="feature-list">` | ticked feature list in columns |
| `<table class="spec-table">` / `size-table` (wrap in `<div class="table-scroll">`) | details / size chart |
| `<div class="note-box">` | highlighted note |
| `<div data-lang="de">` (`"en fr"` for several) | shown only in those languages |

**Reviews** are Blogger comments. A comment that starts with `★★★★★`, `4/5`, `Rating: 4` or `4 stars`
shows stars; the average appears under the title and in the JSON-LD. Ask the owner to set
**Settings → Comments → Who can comment → Anyone** so buyers don't need a Google account.
Never add "verified buyer" claims the shop can't check.

## 3. Choosing how orders arrive

| Method | Setup | Good for | Watch out |
|---|---|---|---|
| **WhatsApp** (`whatsapp:` number) | none | Small shops, local delivery, markets where people already order by chat | The buyer must press Send in WhatsApp; nothing is recorded until they do (unless the sheet is connected) |
| **Telegram** (`telegram:` @username) | none | Same as WhatsApp | Telegram links can't prefill a message to a person, so the order is copied to the clipboard and the buyer pastes it; the done screen shows the text and a copy button |
| **Email** (`email:`) | none | Fallback | Opens the buyer's mail app (fails on PCs without one) |
| **Apps Script inbox** (`order_endpoint:`) | 5 min (see §4) | Anyone who wants a real order list, confirmation emails and server-checked totals | Redeploy a new version after code changes; the blog's feed must be public and **Full** |
| **PayPal** (`paypal:` PayPal.Me name) | any PayPal account | Paying online immediately | A payment choice, not an order channel: the thank-you screen and buyer email get a PayPal.Me button with the amount (`paypal.com/paypalme/NAME/34.80EUR`). A PayPal *email* falls back to the classic `cgi-bin/webscr` cart, which often fails with "Things don't appear to be working" unless the account is a verified business account. Check the payment arrived before shipping |
| **Bank transfer** (`bank:` text) | none | Shown after the order with the order number as reference | Manual matching |

Order of preference when unsure: Apps Script inbox (+ bank/PayPal for payment) → WhatsApp/Telegram → email.
With `google_sheet:` set, **every** order is recorded, including WhatsApp/Telegram/email/PayPal ones (sent
in the background, status "Sent via WhatsApp – check the chat"). `place_order: no` hides the direct
button but keeps the recording.

Checkout asks two separate questions: **how to order** (Place order, WhatsApp, Telegram, email) and
**how to pay** (`payment:` list, e.g. Bank transfer, PayPal, Cash on delivery). The payment is in the
message, the sheet ("Payment" column) and the emails; bank details are shown only for bank transfer.

Checkout asks for street, postcode, city and country. `ship_to:` lines limit the countries, give each a
fee and a city list (with "Other city…"); without them every country is listed in the shop language.
If the owner already runs a Google Sheets shop or POS, use the same Sheet: add the `Orders` tab to it and
deploy Code.gs in that project.

Never use the undocumented Blogger contact-form endpoint for orders (SpotCommerce does). It changes
without notice, and orders are lost silently.

## 4. Apps Script order inbox (assets/apps-script/Code.gs)

1. Open **sheets.new**, then **Extensions → Apps Script**, paste `Code.gs` and set `BLOG_URL` (and
   `OWNER_EMAIL` if orders should go to another address). Shipping, currency, bank details and shop name
   are read from the blog's own Shop settings gadget, so there is one place to edit them.
2. Run **setup** once and allow the permissions: it creates **Orders** and **Order lines** and emails a test.
3. **Deploy → New deployment → Web app**, Execute as **Me**, access **Anyone**.
4. Put the `/exec` URL in Shop settings: `google_sheet: https://script.google.com/macros/s/…/exec`.
5. Blogger: **Settings → Site feed → Allow blog feed: Full** (the script reads prices from the feed).
6. Optional Telegram alerts: create a bot with @BotFather, put the token in `TELEGRAM_BOT_TOKEN`, send
   your bot "/start", run **telegramFindChatId**, copy the id into `TELEGRAM_CHAT_ID`, redeploy.
7. Test with a real order. After any code change: Manage deployments → Edit → **New version**.

Lessons from the first live install: owners paste shortened versions of Code.gs (an AI "tidied" it and
dropped `doPost`), so tell them to paste the **whole file** and redeploy a **New version**; a
`BLOG_URL` with a trailing slash is normalised by `blog_()`; tabs with other columns are moved aside as
"(old …)" by `sheet_()`. When the inbox answers with HTML instead of JSON, shop.js logs a console hint and
shows the generic error; a JSON error is shown in brackets.

What it does: re-reads every price and stock value from the post's public feed (cached 10 minutes),
ignoring the prices the browser sent; refuses sold-out and unknown products; writes one row per order
(status `New`, to change by hand) and one row per product in **Order lines**; for direct orders sends
branded HTML emails (built with the `email` skill's Gmail-safe patterns) to the owner (with a "Reply on
WhatsApp" button) and the buyer (with bank details if set); stores customer text as text so a name like
`=IMPORTXML(…)` can't run as a formula. The browser sends `text/plain` JSON, which avoids a CORS preflight and lets it read the reply.
Limits: MailApp sends about 100 emails/day on a free account (each order uses 2). There's no stock decrement.
The owner updates `data-stock` by hand.

## 5. Payments

- Never put **secret** keys (`sk_live_…`, API secrets) in a theme. Everyone can read the XML.
  A publishable key is fine only with a server that creates the payment (Apps Script can create a
  Stripe Checkout Session via UrlFetchApp, but only build that if the owner asks for card payments).
- **PayPal.me / payment links** are a low-tech option. Show the link with the order total after an
  inbox order.
- Show bank details only *after* the order, with the order number as the payment reference.

## 6. Legal checklist (Germany / EU) — not legal advice; tell the owner to confirm

- **Impressum** page (name, address, contact) and **Datenschutzerklärung** (privacy policy) linked in the footer.
  The order form collects personal data, and the Apps Script inbox stores it in Google Sheets.
- **AGB** and **Widerrufsbelehrung** (14-day withdrawal right, with a model withdrawal form) for distance selling to consumers.
- Prices shown to consumers include VAT: show "inkl. MwSt., zzgl. Versand" (`tax_note`) or
  "Kein Ausweis der USt. gem. § 19 UStG" for Kleinunternehmer.
- **Button solution (§ 312j BGB):** the final order button must clearly state that ordering costs money,
  e.g. "Zahlungspflichtig bestellen" (set `Send order: Zahlungspflichtig bestellen` in Shop words).
- A sale price (`data-old-price`) must be a price that was actually charged before: the lowest price of
  the previous 30 days (PAngV § 11).
- If orders go through WhatsApp or Telegram, say so in the privacy policy.
- Since 19 June 2026 EU law (Directive 2023/2673) asks for an easy online withdrawal function for online
  contracts. Have the owner check the current German implementation before launch.
- The EU online dispute resolution (ODR) platform closed in July 2025: don't link it in the Impressum.
- Page templates (Shipping, Contact, Impressum, Widerruf, Privacy) are in `assets/pages/`. They are
  starting points, not legal advice.
