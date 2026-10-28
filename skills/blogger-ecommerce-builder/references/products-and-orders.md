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

**SpotCommerce labels** (`_39` price, `-49` old price, `!0` stock) still work when Shop settings has
`label_prices: yes`. The block wins when both exist.

What the shop layer does with it: prices, sale badges and sold-out states on cards; gallery, option
pickers, quantity and Add to cart on the product page; `Product` + `Offer` JSON-LD for Google; the block
itself is hidden once JS has read it.

## 3. Choosing how orders arrive

| Method | Setup | Good for | Watch out |
|---|---|---|---|
| **WhatsApp** (`whatsapp:` number) | none | Small shops, local delivery, markets where people already order by chat | The buyer must press Send in WhatsApp; nothing is recorded until they do |
| **Email** (`email:`) | none | Fallback | Opens the buyer's mail app (fails on PCs without one) |
| **Apps Script inbox** (`order_endpoint:`) | 5 min (see §4) | Anyone who wants a real order list, confirmation emails and server-checked totals | Redeploy a new version after code changes; the blog's feed must be public and **Full** |
| **PayPal** (`paypal:` business email) | PayPal business account | Paying online immediately | Classic cart form. Check that the payment arrived in PayPal before shipping; there's no automatic stock update |
| **Bank transfer** (`bank:` text) | none | Shown after the order with the order number as reference | Manual matching |

Order of preference when unsure: Apps Script inbox (+ bank/PayPal for payment) → WhatsApp → email.
If the owner already runs a Google Sheets shop or POS, use the same Sheet: add the `Orders` tab to it and
deploy Code.gs in that project.

Never use the undocumented Blogger contact-form endpoint for orders (SpotCommerce does). It changes
without notice, and orders are lost silently.

## 4. Apps Script order inbox (assets/apps-script/Code.gs)

1. Open **sheets.new**, then **Extensions → Apps Script**, paste `Code.gs` and fill in `SETTINGS`.
   `SHIPPING` and `FREE_SHIPPING_OVER` must match the Shop settings gadget.
2. **Deploy → New deployment → Web app**, Execute as **Me**, access **Anyone**. Authorise.
3. Put the `/exec` URL in Shop settings: `order_endpoint: https://script.google.com/macros/s/…/exec`.
4. Blogger: **Settings → Site feed → Allow blog feed: Full** (the script reads prices from the feed).
5. Test: run `testProduct()` in the editor with a real post id (the number in the post's edit URL),
   then place a real order on the blog. A row should appear in **Orders**, and both emails should arrive.

What it does: re-reads every price and stock value from the post's public feed (cached 10 minutes),
ignoring the prices the browser sent; refuses sold-out and unknown products; writes one row per order
(status `New`, to change by hand); emails the owner (reply-to = buyer) and the buyer (with bank
details if set). The browser sends `text/plain` JSON, which avoids a CORS preflight and lets it read the reply.
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
- If orders go through WhatsApp, say so in the privacy policy.
