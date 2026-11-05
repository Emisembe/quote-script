# Night Shop: setup and update guide

Night Shop turns a Blogger blog into a shop. Every post is a product. Visitors fill a cart, choose
how to order (online, WhatsApp, Telegram, email or PayPal), and every order can be saved in your own
Google Sheet.

This guide is kept up to date with every change to the theme. The newest version is always in this
folder (`themes/night-shop/GUIDE.md`). The complete click-by-click version, with every code block to copy,
is the "Night Shop: complete setup guide" document.

## Contents
0. Quick start: the whole setup in order (with test checklist)
1. What's in the folder
2. Install or update the theme (do this every time)
3. Shop settings: every line explained
4. Adding a product
5. Languages
5b. Call and video buttons ("Talk to us")
5c. Our partners and accreditation symbols
5d. Delivery partners, delivery time and weight
5e. Digital products (download link after payment)
5f. Logo and browser icon
5g. Announcement bar
5h. Trust row above the footer
5i. Team page (photos, names, phone numbers, social icons)
5j. Homepage sections: What we do, How it works, Customer reviews, Questions & answers, Newsletter
5k. Fulfilment page and Shipping to Kenya page (with request forms)
5l. WhatsApp button and "You may also like"
5m. "Ask Kreislo" chat assistant (questions and answers you edit in Layout)
5n. News ticker on the homepage (announcements and figures)
5o. Our branches (addresses, phone numbers, WhatsApp, directions)
6. How orders reach you
7. Saving every order in a Google Sheet
8. Reviews
9. Footer pages (Shipping, Delivery partners, Returns, Contact, Impressum, Privacy)
10. Troubleshooting
11. How we make changes together
12. Ideas for next steps

---

## 0. Quick start: the whole setup in order

Do these steps in this order; each one points to the section with the details. Tick them off.

**A. Blogger basics** (once)
- [ ] Theme → ▾ → **Backup** → Download (keep the file).
- [ ] Upload `theme-night-shop.xml` (section 2).
- [ ] Settings → **Title**: `Kreislo` · Description: `Keep good things moving`.
- [ ] Theme → ▾ → **Mobile settings** → **Desktop**.
- [ ] Settings → Site feed → Allow blog feed → **Full**.
- [ ] Settings → Comments → Who can comment → **Anyone**.
- [ ] Settings → **Favicon** → Logo Project `03 Favicon` → the 512px file (section 5f).
- [ ] Layout → **Header** → Image → Logo Project `01 Website header logo` (88px file) → "Instead of title and description" (section 5f).

**B. Shop settings and delivery** (Layout, bottom of the page)
- [ ] **Shop settings**: `shop_name: Kreislo`, whatsapp, telegram, email, paypal, payment, bank, shipping,
      free_shipping_over, ship_to, default_country, tax_note, language(s) (section 3).
- [ ] **Delivery options**: your real carriers, prices and countries (section 5d).

**C. Order sheet** (once, about 10 minutes)
- [ ] sheets.new → Extensions → Apps Script → paste the whole `Code.gs` → Save → run **setup** → allow →
      Deploy as Web app (Anyone) → copy the `/exec` link (section 7).
- [ ] Shop settings → `google_sheet: ` + the `/exec` link.

**D. Pages** (Pages → New page; short title first, then the nice title; section 9)
- [ ] `shipping` · `delivery` · `returns` · `contact` · `impressum` · `privacy` (footer pages, section 9)
- [ ] `team` (section 5i) · `fulfilment` and `kenya` (section 5k)
- [ ] Replace every `[square bracket]` with your real details (address, prices, dates, insurance, customs).

**E. Homepage texts** (Layout; edit or delete what you don't need)
- [ ] Announcement bar (5g) · Banner "Keep good things moving" and its buttons · "Why Kreislo"
- [ ] Talk to us (5b) · What we do · How it works · What customers say (only real reviews) ·
      Questions & answers · Stay in the loop (section 5j)
- [ ] Shipping to Kenya banner · Shop by category · Our partners (5c) · Trust row (5h) · Certified & accredited (5c) ·
      footer texts and menu.
- [ ] **News** ticker under the header (5n) · **Our branches** with your real address and numbers (5o).
- [ ] **Ask assistant (chat bubble)** at the bottom of Layout: check every answer, add your own (5m).

**F. Products** (section 4)
- [ ] 6–10 products: photos first, then the product block with price, stock, options, **weight**, labels.
- [ ] One digital product (5e): Drive link in the sheet's **Downloads** tab.

**G. Test everything, on your phone and on a computer** (about 20 minutes)
- [ ] Homepage on the phone: menu opens, language picker works, no sideways scrolling, "Ask Kreislo" bubble bottom-right.
- [ ] News ticker moves, stops when you touch it, and the pause button works; each link opens the right page.
- [ ] Our branches: Call rings your number, WhatsApp opens the right chat, Directions opens Google Maps at your address.
- [ ] Chat bubble: tap a suggested question; type a question in your own words; type something it can't know
      → "Ask on WhatsApp" opens WhatsApp with the question typed in, and a row appears in the **Questions** tab.
- [ ] Product page: gallery and video, size/colour required, Ask on WhatsApp / Telegram, "You may also like".
- [ ] Cart: change the quantity, remove a product, totals and free shipping are right.
- [ ] Checkout: change country and delivery partner (the shipping price changes); test **each** way:
      Place order · WhatsApp · Telegram · Email; and both payments: Bank transfer (bank details shown) ·
      PayPal (button with the amount).
- [ ] Digital product alone: no address asked; set its order to **Paid** in the sheet → download email arrives.
- [ ] Fulfilment page and Kenya page: send each form → a row in **Requests** + an email to you.
- [ ] Newsletter: sign up → confirmation email → click it → Status **Subscribed** in the **Newsletter** tab.
- [ ] In the sheet: rows in **Orders** and **Order lines** for every test order; you and the buyer got emails.
- [ ] Delete the test rows when you're done.

**H. Before you announce the launch**
- [ ] Impressum, privacy policy and returns checked (e-recht24.de or a lawyer).
- [ ] No `[square brackets]`, "Your Name" or example numbers left anywhere.
- [ ] Copy the text of all your Layout gadgets into a note (you need it after every theme update).

## 1. What's in the folder

| File | What it's for |
|---|---|
| `theme-night-shop.xml` (in the main folder) | The theme you upload to Blogger |
| `samples/` | Seven ready-made product posts to copy (07 = digital download) |
| `pages/` | Page templates: shipping, delivery, returns, contact, impressum, privacy, team, fulfilment, kenya |
| `apps-script/Code.gs` | The Google Sheet order inbox |
| `GUIDE.md` | This guide |
| `src/`, `scripts/`, `preview/` | The theme's source; Claude edits these and builds `theme-night-shop.xml` |

## 2. Install or update the theme (do this every time)

Uploading a theme puts every gadget back to the theme's default text. So **save your gadget text first**.

1. **Back up:** Theme → ▾ (next to Customise) → **Backup** → Download. Keep the file.
2. **Copy your settings:** Layout → **Shop settings** (bottom of the page) → Edit → select all text →
   copy it into a note. Do the same for **Shop words**, **Delivery options**, the **menu** gadget, and every
   gadget you changed: Announcement bar, the banner ("Keep good things moving") and its buttons,
   "Why Kreislo", "Talk to us", "What we do", "How it works", "What customers say", "Questions & answers",
   "Stay in the loop", "Shipping to Kenya" banner, "Our partners", Trust row, "Certified & accredited",
   footer texts. (The pages and posts are not touched by a theme upload.)
3. **Upload:** Theme → ▾ → **Restore** → upload `theme-night-shop.xml`.
   If it only says "Could not restore theme": Theme → ▾ → **Edit HTML**, select everything, paste the
   whole file, Save. That screen names the exact problem; send Claude a screenshot.
4. **Paste your settings back:** Layout → Shop settings → Edit → paste → Save. Same for the other gadgets.
5. **Phones:** Theme → ▾ → **Mobile settings** → choose **Desktop** (once is enough).
6. **Blog feed:** Settings → Site feed → Allow blog feed → **Full** (needed by the Google Sheet inbox).
7. **Reviews without a Google account:** Settings → Comments → Who can comment → **Anyone**.
8. **Check** (5 minutes): homepage, one product, add to cart, checkout, a category page, the language
   picker, the phone menu and the WhatsApp button. After a bigger update, do the full test list in
   section 0, part G.

## 3. Shop settings: every line explained

Layout → **Shop settings** → Edit. One setting per line. Capital letters don't matter; `:` or `=` both
work. Leave a value empty to switch it off.

```
shop_name: Kreislo
currency: EUR
locale: de-DE
language: en
languages: en, de, fr
whatsapp: +49 170 1234567
telegram: @night_shop
email: orders@example.com
google_sheet: https://script.google.com/macros/s/…/exec
place_order: yes
paypal: yourpaypalme_name
payment: Bank transfer, PayPal, Cash on delivery
bank: Sparkasse, IBAN DE00 0000 0000 0000 0000 00
shipping: 4,90
free_shipping_over: 50
default_country: DE
ship_to: Germany = Berlin, Hamburg, Munich, Frankfurt, Cologne
ship_to: Austria (9,90) = Vienna, Graz
ship_to: Switzerland (14,90)
tax_note: Incl. VAT, plus shipping
label_prices: yes
whatsapp_button: yes
hero_image:
banner_image:
```

| Line | What it does |
|---|---|
| `shop_name` | Name used in order messages and emails. Empty = the blog title |
| `currency`, `locale` | Price currency, and how numbers look (`de-DE` gives "29,90 €") |
| `language` | The language visitors see first: `en`, `de` or `fr` |
| `languages` | Languages in the header picker. Empty = no picker |
| `whatsapp` | Your WhatsApp number with country code. Adds "Send order on WhatsApp" and "Ask on WhatsApp" |
| `telegram` | Your Telegram username. Adds "Send order on Telegram" and "Ask on Telegram" |
| `email` | Adds "Send order by email" (opens the buyer's email app) |
| `google_sheet` | The link of your order inbox (section 7). Every order is then saved in the sheet |
| `place_order` | `yes` shows "Place order (we confirm by email)", which sends straight to the sheet. `no` hides it but still records WhatsApp/Telegram orders |
| `paypal` | Your **PayPal.Me name** (the part after `paypal.me/`). Buyers who choose PayPal get a "Pay now with PayPal" button with the amount filled in. Works with any PayPal account. (A PayPal email instead uses PayPal's older cart page, which needs a verified business account and often shows "Things don't appear to be working".) |
| `payment` | The answers to "How will you pay?" at checkout, in your own words. "Bank transfer" shows your bank details after ordering; "PayPal" shows the PayPal button; anything else (Cash on delivery, Cash on pickup…) is just noted on the order. Empty = Bank transfer and/or PayPal if `bank`/`paypal` are filled in |
| `bank` | Shown after ordering when the buyer chose bank transfer, with the order number as the payment reference |
| `shipping` | Shipping fee for countries without their own fee |
| `free_shipping_over` | Order value from which shipping is free |
| `ship_to` | One line per country you deliver to: `Country (fee) = city, city`. The fee and the city list are optional. The buyer can still pick "Other city…". No `ship_to` lines = every country in the world |
| `default_country` | Country selected at checkout (`DE` or `Germany`) |
| `tax_note` | Small line under the price |
| `label_prices` | `yes` keeps old SpotCommerce labels (`_39` = price, `-49` = old price, `!0` = sold out) working |
| `whatsapp_button` | `no` hides the round WhatsApp button in the corner of every page (section 5l). Empty or `yes` = shown |
| `hero_image`, `banner_image` | A photo link (`https://…`) for the big homepage background and the "Shipping to Kenya" banner. Empty = the drawn city lights |

**How to get a photo link:** upload the photo into any post (it can stay a draft), switch to HTML view
(the `<>` pencil icon at top left), and copy the address inside `src="…"`.

## 4. Adding a product

1. **Posts → New post.** The title is the product name.
2. **Upload the photos first** (square or 4:5 works best). They become the gallery; the first one is the
   photo on the product card.
3. Switch to **HTML view** and put the **product block** at the very top:

```html
<div class="product" data-price="29,90" data-old-price="34,90" data-stock="12" data-sku="TS-01"
     data-options="Size: S, M, L | Colour: Blue, White" data-video="https://youtu.be/VIDEO_ID">Price: 29,90 EUR</div>
```

| Part | Meaning |
|---|---|
| `data-price` | Price (required) |
| `data-old-price` | Old price: crossed out, with a "−15%" badge |
| `data-stock` | How many you have. `0` = sold out; 3 or less shows "Only 3 in stock"; leave it out for unlimited |
| `data-sku` | Your article number (optional) |
| `data-options` | Choices the buyer must make, groups separated by `|` |
| `data-video` | YouTube link(s), shown in the gallery after the photos |
| `data-weight` | Shipping weight of one piece: `0.8` (kg) or `400 g`. Shown on the product page and used for the delivery price (section 5d) |
| `data-dimensions` | Size, e.g. `38 x 30 x 12 cm`. Shown on the product page |
| `data-digital` | `yes` for a download (e-book, template …): no address or shipping at checkout (section 5e) |

**Weight and size: you enter them, not the buyer.** Weigh each product once, packed if you can, and
write it into the block. The checkout adds up the weights of everything in the cart and picks the right
price step. Buyers never type measurements: they can't know them, and a price based on what they type
could be cheated.

4. Write the description. You can use these building blocks (copy them from `samples/`):

| Block | Looks like |
|---|---|
| `<ul class="feature-list">` | Ticked list in columns |
| `<table class="size-table">` | Size chart with a dark header |
| `<table class="spec-table">` | Two-column details table |
| `<div class="photo-grid">` (or `photo-grid cols-3`) | Photos side by side, inside the description |
| `<div class="photo-wide">` | One big photo inside the description |
| `<div class="two-cols">` | Photo next to text |
| `<div class="video-wide">` + YouTube iframe | Big video inside the description |
| `<div class="note-box">` | Highlighted note |
| `<div data-lang="de">` | Text only for German visitors (section 5) |

5. **Labels** = categories (Women, Men, Sale…). The menu links to `/search/label/Women` and so on.
6. If you use **Insert jump break**, keep the product block above it.
7. **Publish.** To change a price or stock later: edit the post → HTML view → change the number.

**The seven samples:** `01` T-shirt with sizes and a size chart · `02` sneakers with video and details
table · `03` sale item with lifestyle photo grid · `04` sold out · `05` bag with photo-and-text block ·
`06` product in three languages · `07` digital download (e-book). Samples 01–06 now include
`data-weight`, and 02 and 05 `data-dimensions`.

## 5. Languages

- `language: en` is what visitors see first; `languages: en, de, fr` shows the picker in the header.
  The visitor's choice is remembered on their device.
- **Built in:** all shop buttons and messages, the menu and gadget titles of this theme, and fixed theme
  text (search, pages, 404) in English, German and French.
- **Your own text** (product descriptions, hero text, pages): write one block per language:

```html
<p data-lang="en">Soft cotton tee.</p>
<p data-lang="de">Weiches Baumwoll-Shirt.</p>
<p data-lang="fr">T-shirt en coton doux.</p>
```

  Text outside a `data-lang` block shows in every language. `data-lang="en fr"` shows in both.
- **Your own wording or another language:** Layout → **Shop words**, one per line:

```
Send order: Zahlungspflichtig bestellen
[de] New arrivals: Neu eingetroffen
[es] Add to cart: Añadir al carrito
```

  Plain lines change a text for every language; `[xx]` lines only for that language. For a new
  language such as Spanish, add `es` to `languages:` and give the shop words in Spanish.
- Product **titles** stay as you typed them (Blogger has one title per post).

## 5b. Call and video buttons ("Talk to us")

The homepage strip under the top banner shows a call, a Zoom and a Google Meet button with their call
times. Edit it in **Layout → "Talk to us" → Edit**, one line per button:

```
text: Prefer to talk? Call us or join a video call at these times.
call: +49 157 00000000 | Mon–Fri 9:00–18:00
zoom: https://zoom.us/j/1234567890 | Tue & Thu 18:00–19:00
meet: https://meet.google.com/abc-defg-hij | Sat 10:00–12:00
```

`type: link or number | call times | own button text (optional)`. Types: `call`, `zoom`, `meet`,
`teams`, `whatsapp`, `telegram`, `email`. Delete a line to remove a button. Use a Zoom/Meet link that
stays the same (your personal room or a recurring meeting). Your own times in German or French: Shop
words, e.g. `[de] Wed 17:00–19:00: Mi 17:00–19:00 Uhr`.

## 5c. Our partners and accreditation symbols

Two logo rows, both edited in **Layout**:
- **Our partners**: on the homepage, under "Shop by category".
- **Certified & accredited**: in the footer on every page, above the © line.

One logo per line: `Name | logo picture link | website (optional)`

```
Atelier Nord | https://blogger.googleusercontent.com/img/…/atelier-logo.png | https://atelier-nord.de
Trusted Shops | https://…/trusted-shops-seal.png | https://www.trustedshops.de/bewertung/info_XXXX.html
14-day returns | | /p/returns.html
```

**Getting a logo picture link:** create a draft post, upload the logo (PNG with a transparent background,
about 300 px wide), switch to HTML view and copy the `https://blogger.googleusercontent.com/…` address.
Don't publish the draft. Without a picture link the name shows as a neat round badge. Logos show grey and
turn colourful on mouse-over. Only show seals and memberships you really hold, and link them to the
certificate page; most seal providers have rules for how their logo may be used.

## 5d. Delivery partners, delivery time and weight

At checkout the buyer chooses how the parcel travels (DHL, Hermes, pickup …) and sees the price,
the estimated delivery time and an "About DHL Parcel" link for each option. Edit the options in
**Layout → Delivery options** (bottom of the page, next to Shop settings), one option per line:

```
DHL Parcel | 4,90 up to 2 kg; 6,99 up to 5 kg; 10,49 up to 10 kg; 16,49 up to 31,5 kg | 2–4 working days | /p/delivery.html#dhl | Germany
Hermes | 4,50 up to 5 kg; 6,95 up to 10 kg | 3–5 working days | /p/delivery.html#hermes | Germany
DHL International | 14,90 up to 5 kg; 24,90 up to 20 kg | 4–7 working days | /p/delivery.html#dhl-international | Austria, Switzerland
Pickup in Berlin | 0 | By appointment | /p/delivery.html#pickup | Germany
```

| Part | Meaning |
|---|---|
| 1. Name | What the buyer sees, e.g. `DHL Parcel` |
| 2. Price | One price (`4,90`, `0` = free) **or** weight steps: `4,90 up to 2 kg; 6,99 up to 5 kg`. A parcel heavier than the last step hides the option |
| 3. Delivery time | Free text: `2–4 working days`, `By appointment` |
| 4. Info page | Optional link to the partner's part of your Delivery partners page |
| 5. Countries | Optional. The country names from your `ship_to` lines. Empty = all countries |

**Adding more delivery partners:** add one more line in Layout → Delivery options and Save. There is no
limit; each line becomes one choice at checkout, in the same order as the lines. For example:

```
GLS | 4,49 up to 2 kg; 5,99 up to 5 kg; 8,99 up to 20 kg | 2–3 working days | /p/delivery.html#gls | Germany
DPD | 5,20 up to 3 kg; 7,90 up to 10 kg | 1–2 working days | /p/delivery.html#dpd | Germany, Austria
Local courier (Berlin) | 7,50 | Same day if ordered by 12:00 | /p/delivery.html#courier | Germany
```

Then copy one partner block on the Delivery partners page (from `<div class="product-section" id="…">`
to its `</div>`), change the id to match the link (`id="gls"`, German `id="gls-de"`) and fill in the
details. To remove a partner, delete its line. Take the prices from the carrier's current price list.

Good to know:
- When Delivery options has lines, they set the shipping price. `ship_to` still decides which countries
  and cities can be chosen; its fees in brackets are no longer used. Empty Delivery options = old behaviour.
- `free_shipping_over` still makes every option free above that amount. Delete the line if you don't want that.
- The order message, the sheet (columns **Delivery**, **Delivery time**, **Weight (kg)**) and the emails
  show the chosen option. The sheet recalculates the price from your posts, so it can't be cheated.
- German/French names of options and times go into Shop words: `[de] By appointment: Nach Absprache`.

**The Delivery partners page** (explains each partner): create it like the other footer pages (section 9)
with the short title `delivery` and paste `pages/delivery.html`. Each partner has a marker
(`id="dhl"`, German `id="dhl-de"`), which the 4th part of the option line jumps to. The footer's
"Customer service" list links to it.

## 5e. Digital products (download link after payment)

1. Upload your file to **Google Drive** → right-click → **Share** → General access: **Anyone with the
   link** → **Copy link**.
2. Create the product like any other, with `data-digital="yes"` in the product block
   (`samples/07-digital-download.html`):
   ```html
   <div class="product" data-price="12,90" data-digital="yes">Price: 12,90 EUR (digital download)</div>
   ```
   The card gets a "Digital" badge. At checkout a cart with only digital products asks for name, phone
   and **email** (required), no address, no shipping. A mixed cart asks for the address as usual.
3. **In your order sheet, tab "Downloads":** the first order of the product adds a row for it
   (Product | Post ID | Download link | Message to the buyer). Paste the Drive link into **Download link**
   once. "Message" is optional, e.g. a password or "Open with Adobe Reader".
4. **When the money has arrived:** in **Orders**, set the order's **Status** to `Paid`. Within seconds the
   buyer gets an email with a big Download button, and **Downloads sent** shows the date.
   If the link is missing you see "Missing link: (product)": add it, then set Status to Paid again.
   To send again: click the order's row → menu **Shop → Send download links for the selected order**.

This needs the newest `Code.gs` (section 7) and running **setup** once more (it asks for one extra
permission to watch the Status column). Honest limit: a Drive link can be passed on. For valuable files,
make a separate copy and link per buyer.

## 5f. Logo and browser icon

**Logo:** Layout → **Header** (top) → Edit → Image → upload your logo → choose
- **"Instead of title and description"**: only the logo shows. Best for a wide logo with your name in it
  (PNG with a transparent background, about 440 × 88 px; it shows at most 44 px high, 36 px on phones).
- **"Behind title and description"**: a small square logo shows next to the shop name (about 200 × 200 px).

Save. Remove the image the same way to go back to the text name.

**Which Kreislo file:** Logo Project → `01 Website header logo` → the "88px high" PNG (white letters for
the black header). Browser icon: `03 Favicon` → the "512px" PNG.

**Browser icon (favicon):** Settings → **Favicon** → upload a square image (at least 48 × 48 px, under
100 KB). It shows in the browser tab and in Google search results. The theme also colours the phone's
browser bar black to match the header.

## 5g. Announcement bar

The thin coloured bar above the header, on every page. Edit it in **Layout → Announcement bar** (top of
the page), one message per line, with an optional link after `|`:

```
Free shipping from 50 € | /p/shipping.html
Order easily on WhatsApp or Telegram
New arrivals every week
```

With several lines the messages take turns every 5 seconds; ‹ › let visitors step through them, and ×
hides the bar until they close the browser. One line = one fixed message. Empty gadget = no bar.
Translations: Shop words, e.g. `[de] New arrivals every week: Jede Woche neue Stücke`. Its colour is the
theme's accent colour (Theme → Customise).

## 5h. Trust row above the footer

Four short promises with icons above the footer on every page, plus "We accept" payment badges. Edit it in
**Layout → Trust row** (the gadget just above the footer; its title is not shown on the site), one promise per line:

```
truck | Free shipping from 50 € | Delivered in 2–4 working days | /p/delivery.html
return | 14-day returns | Easy and personal | /p/returns.html
lock | Secure payment | PayPal or bank transfer
chat | Personal service | We answer within a day | /p/contact.html
pay: PayPal, Bank transfer, Cash on delivery
```

`icon | title | small text | link (optional)`. Icons: `truck`, `return`, `lock`, `shield`, `chat`,
`card`, `gift`, `star`, `leaf`, `heart`, `box`, `check`, `clock`, `phone`, `mail`. Three to four promises
look best; on phones they show two per row. Only promise what you really do: change "50 €" if your
`free_shipping_over` is different.

## 5i. Team page (photos, names, phone numbers, social icons)

A page with one card per person: round photo, name, job, a short text, a phone number people can tap to
call, and round buttons for WhatsApp, Telegram, email, Instagram, Facebook, LinkedIn, TikTok, X and YouTube.
The template is `pages/team.html`; create it like the footer pages (section 9) with the short title `team`,
then rename it "Our team". The footer's Customer service list already links to `/p/team.html`.

Each person is one block. Copy a whole block to add someone, delete one to remove them:

```html
<div class="team-member" data-phone="+49 157 0000001" data-email="anna@yourshop.de"
     data-whatsapp="+49 157 0000001" data-instagram="https://www.instagram.com/yourshop">
<img src="PASTE_PHOTO_LINK_1" alt="Anna Becker">
<h3>Anna Becker</h3>
<p class="team-role">Founder &amp; buyer</p>
<p class="team-bio">Picks every piece by hand and checks it before it goes online.</p>
</div>
```

- **Photo:** square, at least 300 × 300 px. Upload it in a draft post, copy its
  `https://blogger.googleusercontent.com/…` address into `src="…"`. Don't publish the draft.
- **Buttons:** only the `data-…` parts you fill in appear. `data-whatsapp` is a number with country code,
  `data-telegram` an @username, the social ones the full `https://` link.
- **Languages:** the template has each job and text twice, with `data-lang="en"` and `data-lang="de"`.
- **Privacy (GDPR):** ask each person in writing before showing their photo, phone number or private
  accounts. A shop phone number or a shared shop email is often the better choice.

## 5j. Homepage sections: What we do, How it works, Customer reviews, Questions & answers, Newsletter

Five new homepage sections, each edited in **Layout** (gadget title = heading). One item per line, parts
separated by `|`. A line starting with `text:` is the intro sentence. Lines starting with `#` are notes and
are not shown. Write each language in its own block, `<div data-lang="en"> … </div>` and
`<div data-lang="de"> … </div>`; visitors see their language (English if their language is missing).

| Section (Layout) | One line = | Example |
|---|---|---|
| **What we do** | `icon | title | text | button text | link` | `warehouse | Fulfilment for sellers | We store, pack and ship … | Request a quote | /p/fulfilment.html` |
| **How it works** | `title | text` (numbered automatically) | `Choose | Find your item in the shop …` |
| **What customers say** | `stars 1–5 | what they said | name, city` | `5 | Fast and friendly. | Amina, Gießen` |
| **Questions & answers** | `question | answer` | `How do I pay? | By bank transfer, PayPal or cash on pickup.` |
| **Stay in the loop** (newsletter) | `text: …` and `button: …` | `button: Subscribe` |

- Icons for "What we do": `tag`, `globe`, `download`, `warehouse`, `truck`, `return`, `lock`, `shield`,
  `chat`, `card`, `gift`, `star`, `leaf`, `heart`, `box`, `check`, `clock`, `phone`, `mail`.
- **Customer reviews stay hidden** until you add a line without `#`. Only use real reviews, and ask the
  customer before quoting them.
- The **FAQ** also tells Google your questions and answers (it can show them in search results).
- The **newsletter** needs `google_sheet` (section 7). Sign-ups land in the **Newsletter** tab. Each
  subscriber gets an email with a "Yes, subscribe me" button (double opt-in, required in Germany); only
  people with Status **Subscribed** may get your newsletter. Every email has an unsubscribe link.
  Send newsletters from Gmail to the Subscribed addresses (BCC), or import them into a newsletter service.

## 5k. Fulfilment page and Shipping to Kenya page (with request forms)

Two page templates: `pages/fulfilment.html` (short title `fulfilment`, then "Fulfilment for sellers") and
`pages/kenya.html` (short title `kenya`, then "Shipping to Kenya"). Create them like the footer pages
(section 9) and replace everything in `[square brackets]`, especially the next shipping date to Kenya,
your prices, insurance and customs details. The menu, the footer and "What we do" already link to them.

Each page has a **request form**. Requests land in the **Requests** tab of your order sheet (Type,
name, email, phone, company, details, Status) and you get an email with a "Reply on WhatsApp" button.
Without `google_sheet` the request opens in WhatsApp instead. Change the questions in the form's
`data-fields`: separate them with `;`, `*` = required, `Question: a / b / c` = a choice list.

```html
<div class="shop-lead" data-kind="quote" data-button="Request a quote"
     data-fields="Name*; Company; Email*; Phone; What do you sell?*; Orders per month: under 50 / 50–200 / over 200; Message"></div>
```

You can put a form like this on any page; `data-kind` is the type shown in the sheet (quote, kenya, …).

## 5l. WhatsApp button and "You may also like"

- **WhatsApp button:** while the "Ask Kreislo" assistant is on (section 5m), WhatsApp is inside its chat
  window. Without the assistant, a round green button sits in the bottom-right corner of every page, using
  the `whatsapp:` number from Shop settings. On a product page the message already names the product and
  its link. To switch the round button off: `whatsapp_button: no` in Shop settings.
- **You may also like:** under each product, up to 4 other products from the same category (the first
  label), with photo and price. It reads your blog feed, so **Settings → Site feed → Full** is needed.

## 5m. "Ask Kreislo" chat assistant (questions and answers you edit in Layout)

A round **Ask Kreislo** button sits in the bottom-right corner of every page. It opens a small chat window
with a greeting and a few suggested questions. Visitors tap one or type their own question; the assistant
finds the closest question in your list and shows your answer. When it has no answer it says so and
offers **Ask on WhatsApp**, with the visitor's question already typed in. A "Chat with a person on
WhatsApp" link is always at the bottom of the window, so this button replaces the round WhatsApp button.

It is **not AI**: it only knows what you write, it costs nothing and sends no visitor data anywhere except
the optional "unanswered questions" list below. Edit it in **Layout → bottom of the page → "Ask
assistant (chat bubble)"**:

```
<div data-lang="en">
name: Ask Kreislo
greeting: Hi! I am the Kreislo helper. Ask me about payment, delivery, shipping to Kenya or fulfilment.
suggest: How do I pay? ; Do you ship to Kenya? ; Where can I pick up? ; How do I order?
use_faq: yes
log_unanswered: yes
Where can I pick up? | Pickup is in Gießen by appointment. Send us a WhatsApp message. | pickup collect address visit
How much does shipping to Kenya cost? | It depends on size and weight … More: /p/kenya.html | price mombasa nairobi freight
</div>
<div data-lang="de">
name: Fragen Sie Kreislo
…
</div>
```

| Line | What it does |
|---|---|
| `name:` | Text on the button and at the top of the chat window |
| `greeting:` | First message when the window opens |
| `suggest:` | Questions shown as buttons, separated by `;` (write them exactly like the questions in your list) |
| `use_faq: yes` | Also answers with everything in **Questions & answers** (section 5j), so you don't type answers twice |
| `log_unanswered: yes` | Questions it could not answer are saved in your order sheet, tab **Questions** (needs `google_sheet`) |
| `question \| answer \| other words` | One question per line. "Other words" are words people might use instead (freight, cost, Mombasa…): they help it find the right answer |

- **Links in answers:** write `/p/kenya.html` or a full `https://…` address in the answer; it becomes a link.
  An email address becomes a mail link.
- **Make it better every week:** open the **Questions** tab, add a line to the assistant for each real
  question people asked, then type "Yes" in "Added to the assistant?".
- **Privacy:** the Questions tab only stores the question, the language and the page, no name or address.
  Add one sentence to your privacy policy, e.g. "Questions typed into the chat assistant that it cannot
  answer are stored anonymously so we can improve our answers." Or switch it off with `log_unanswered: no`.
- **Switch the assistant off:** empty the gadget (the round WhatsApp button comes back).

## 5n. News ticker on the homepage (announcements and figures)

A dark strip under the header on the homepage, with your news scrolling slowly from right to left. The
gadget title (**News**) is the orange label on the left. It stops when someone points at it or taps it,
has a pause button, and stands still for visitors whose phone is set to "reduce motion" (they can swipe it).
Edit it in **Layout → News** (under the header). One item per line:

```
New in: washing machines and fridges, tested and cleaned | /search/label/Appliances
Next container to Mombasa: loading on 15 December | /p/kenya.html
Online retail in Germany: *€XX bn* in 2025 | Source: name of the study, year | https://link-to-the-study
```

- The part after the first `|` that starts with `/` or `https://` is the link (optional).
- Any other part is shown small in brackets as the source, e.g. "(Source: HDE 2025)".
- `*Text between stars*` is highlighted in orange: use it for numbers.
- **Figures:** only use numbers you can show a source for, and say which year they are from. Check them
  every few months.
- Lines starting with `#` are notes and are not shown. An empty gadget hides the ticker.
- German lines go in a `<div data-lang="de"> … </div>` block, like the other homepage sections.

## 5o. Our branches (addresses, phone numbers, WhatsApp, directions)

A homepage section with one card per branch: name, address, phone number, opening hours, and the
buttons **Call**, **WhatsApp** and **Directions** (opens Google Maps at the address). Google also gets the
address and phone number of every branch, which helps you appear in local search and on Google Maps.
Edit it in **Layout → Our branches**. One branch per line, always in this order:

```
text: Visit us, call us or send a WhatsApp message.
Kreislo Gießen – shop and warehouse | Musterstraße 1, 35390 Gießen, Germany | +49 157 0000000 | +49 157 0000000 | Mon–Fri 9:00–18:00
Kreislo Mombasa | Moi Avenue 1, Mombasa, Kenya | +254 700 000000 | +254 700 000000 | Mon–Sat 8:00–17:00 | https://maps.app.goo.gl/… | mombasa@kreislo.de
```

`name | address | phone | WhatsApp number | opening hours | map link (optional) | email (optional)`

- Write phone numbers with the country code (`+49 …`, `+254 …`). Leave a part empty (`| |`) to skip it,
  e.g. a branch without WhatsApp.
- **Map link:** without one, Directions searches Google Maps for the address. For an exact pin, open your
  place in Google Maps → Share → Copy link, and paste it as the 6th part.
- **Replace the example address** (Musterstraße) before you go live: a wrong address on Google is worse
  than none. Only list addresses where customers may come or call.

## 6. How orders reach you

| The buyer picks | What happens |
|---|---|
| **Send order on WhatsApp** | WhatsApp opens with the full order typed in; the buyer presses Send |
| **Send order on Telegram** | Telegram can't type a message for the buyer, so the order is **copied** and your Telegram chat opens; the buyer pastes and sends. The thank-you screen shows the order with a "Copy order again" button |
| **Send order by email** | The buyer's email app opens with the order |
| **Place order** (needs the sheet) | Sent straight to your sheet; you and the buyer get an email |

Then the buyer answers **"How will you pay?"** (your `payment` list). Bank transfer → your bank details
on the thank-you screen and in the buyer's email. PayPal → a blue "Pay now with PayPal (34,80 €)"
button that opens your PayPal.Me with the amount; check in PayPal that the money arrived before you ship.

Each order has a number made of the first product's initials, the date and the time to the second,
e.g. **BRA-261104-153012** ("Bra", 4 Nov 2026, 15:30:12) or **SST-…** for "Sportiva Swing Tee". A second
order with the same number gets **-2** (same phone, same second), and the Google Sheet adds -2, -3 … to any
number it already has, so no two rows share a number. Ask buyers to use it as the payment reference.
Checkout asks for name, phone, email, street, postcode, city and country, the delivery partner (with
price and delivery time), how to order and how to pay, plus an optional note. A cart with only digital
products skips the address and delivery and requires the email.

## 7. Saving every order in a Google Sheet

You can't paste a normal Sheet link into the shop: a sheet can't receive orders by itself. A small
script acts as the sheet's "inbox". **Where is it?** In the kit zip, folder `apps-script`, file `Code.gs`
(Claude also sends it as its own file, already filled in with your blog address and email).

**Paste the whole file, unchanged.** It is about 760 lines long. If you only have a short version
(for example one an AI "tidied up"), orders fail with "Sorry, the order could not be sent", because
the part that receives orders (`doPost`) is missing. Set it up once (about 5 minutes):

1. Open **sheets.new** and name the sheet, e.g. "Night Shop orders".
2. **Extensions → Apps Script.** Select everything in the editor (Ctrl+A), delete it, and paste all of `Code.gs`.
3. At the top, change `BLOG_URL` to your blog address, e.g. `https://yourshop.blogspot.com`.
   Optional: `OWNER_EMAIL` (where order emails go), `EMAIL_OWNER_FOR_CHAT_ORDERS: true` (also email
   you WhatsApp/Telegram orders). Save (disk icon).
4. Choose **setup** in the function list next to Run, press **Run**, and allow the permissions
   ("Advanced → Go to … (unsafe)" is normal for your own script). You get a test email, and the tabs
   **Orders**, **Order lines**, **Downloads**, **Requests**, **Newsletter** and **Questions** appear.
5. **Deploy → New deployment** → gear icon → **Web app** → Execute as **Me** → Who has access
   **Anyone** → Deploy. Copy the **Web app URL** (ends in `/exec`).
6. Blogger: Layout → Shop settings → `google_sheet: ` + paste the URL → Save.
7. Place a test order. A new row appears in **Orders** (one row per order) and **Order lines** (one
   row per product). Send one fulfilment request and one newsletter sign-up too: rows appear in
   **Requests** and **Newsletter**.

**Replacing an older script:** paste the new file over everything, Save, run **setup** again (new
columns are added at the end of your tabs and your orders stay; tabs from a completely different script
are renamed "Orders (old …)", nothing is deleted), then **Deploy → Manage deployments →
pencil → Version: New version → Deploy**. Without the new version, the shop keeps talking to the old
script.

What you get: every order, whichever way the buyer ordered. WhatsApp/Telegram/email/PayPal orders get
the status "Sent via WhatsApp – check the chat", so you can see who started an order but didn't send
it. Prices in the sheet are re-checked against your posts (an edited cart can't change them).
Shipping, currency and bank details are read from your Shop settings, so you only change them in one
place. Change the **Status** column by hand (Paid, Shipped…).

**Telegram alert for every order (optional):** in Telegram, open **@BotFather** → `/newbot` → copy the
token into `TELEGRAM_BOT_TOKEN`. Send your new bot any message, run **telegramFindChatId**, copy the
number from the log into `TELEGRAM_CHAT_ID`, then redeploy (next step).

**After changing the script:** Deploy → **Manage deployments** → pencil → Version: **New version** →
Deploy. The link stays the same.

## 8. Reviews

Reviews are Blogger comments under each product. A comment that starts with `★★★★★`, `5/5`,
`Rating: 4` or `4 stars` shows stars. The average appears above the reviews and next to the price,
and Google can show it in search results. Set **Settings → Comments → Who can comment → Anyone** so
buyers don't need a Google account. Moderate comments in **Comments** in Blogger.

## 9. Footer pages (Shipping, Delivery partners, Returns, Contact, Impressum, Privacy)

The footer already links to `/p/shipping.html`, `/p/delivery.html`, `/p/team.html`, `/p/fulfilment.html`,
`/p/kenya.html`, `/p/returns.html`, `/p/contact.html`, `/p/impressum.html` and `/p/privacy.html`; the menu
links to Kenya and Fulfilment. Create each page once:

1. **Pages → New page.**
2. Title: the **short name first**: `shipping` (then `delivery`, `team`, `fulfilment`, `kenya`, `returns`,
   `contact`, `impressum`, `privacy`). The file to paste has the same name, e.g. `pages/kenya.html`.
   Blogger makes the page address from the first title.
3. HTML view → paste the matching file from `pages/` → replace everything in `[square brackets]`.
4. **Publish.** Then change the title to the nice name ("Shipping & delivery", "Returns (Widerruf)" …)
   and **Update**. The address stays the same.

The Impressum, Widerruf and Privacy templates are **starting points, not legal advice**. Check them with
a generator such as e-recht24.de or a lawyer, especially the new 2026 EU rule for an online
"withdraw from contract" function. If you sell privately (not as a business), ask whether you need an
Impressum and Widerruf at all.

## 10. Troubleshooting

| Problem | Fix |
|---|---|
| Checkout says "Online ordering is not available yet" | Shop settings has no `whatsapp`, `telegram`, `email`, `paypal` or `google_sheet` value |
| "Sorry, the order could not be sent" (Place order) | The script in the sheet is incomplete or the newest version isn't deployed: section 7, "Replacing an older script". If the message shows a reason in brackets (e.g. "Product not found"), see the next rows |
| "Ask on WhatsApp" / "Ask on Telegram" missing on product pages | Your `whatsapp:`/`telegram:` lines are empty (a theme upload resets Shop settings). Paste them back into Shop settings, or keep `whatsapp:`/`telegram:` lines in the "Talk to us" gadget: the buttons use those too |
| A delivery option doesn't appear at checkout | Its country (5th part) isn't spelled like the `ship_to` country, or the parcel is heavier than its last weight step |
| The announcement bar is gone for me | You pressed × : it stays hidden until the browser is closed. Other visitors still see it |
| Logo is missing in the header | Layout → Header → the image must be set to "Instead of title" or "Behind title"; very wide logos are scaled down to fit |
| A homepage section is missing | "What customers say" stays hidden until it has a line without `#`. The newsletter is hidden without `google_sheet` |
| Request form or newsletter says "Something went wrong" | The newest Code.gs isn't deployed: paste it, run setup, Deploy → Manage deployments → New version |
| Newsletter confirm link says "not valid" | The link was already used, or the row was deleted in the Newsletter tab |
| No "Ask Kreislo" button | The assistant gadget (Layout, bottom) is empty or was reset by a theme upload: paste your saved text back |
| The assistant gives the wrong answer | Add "other words" to the right question (3rd part), or make the question more specific. Test again with the same words |
| Nothing arrives in the **Questions** tab | `log_unanswered: yes` and `google_sheet` are needed; paste the newest Code.gs, run **setup** once, then Deploy → Manage deployments → New version |
| The ticker doesn't move | Your phone or computer is set to "reduce motion" (then it stands still on purpose), or you pressed pause |
| "You may also like" doesn't appear | The product has no category label, there are no other products in it, or the blog feed isn't set to Full |
| "Missing link: …" in Downloads sent | Paste the Drive link into the Downloads tab, then set Status to Paid again |
| Download email not sent when setting Paid | Run **setup** once after pasting the new Code.gs (it creates the trigger), and type exactly `Paid` |
| PayPal shows "Things don't appear to be working" | You entered a PayPal email: use your PayPal.Me name in `paypal:` instead |
| A word appears in English in another language | A line in **Shop words** overrides it (e.g. `Add to cart: Add to cart`). Delete that line |
| "Search This Blog", "Blog Archive", "Report Abuse", "Home" boxes appear on product pages | Gadgets from your old Blogger theme that Blogger moved into the new sidebar. Layout → sidebar → open each → Remove (keep any you want) |
| Reviews or the sidebar stretch across the whole screen, "0 comments" not turned into Reviews | The product post has an extra `</div>`. The theme now repairs the page, but open the post in HTML view and remove the stray `</div>` |
| A product shows no price | The product block is missing, or not at the very top, or `data-price` has a typo. Check in HTML view |
| Sheet gets nothing | `google_sheet` link must end in `/exec`; deployment access must be **Anyone**; after code changes deploy a **New version** |
| Sheet says "Product not found" | Blog feed must be **Full**, and the blog must be public |
| Settings gone after updating the theme | Paste the copy you saved in step 2 of section 2 |
| Phones show a plain Blogger look, or the shop hangs on a phone | Theme → ▾ → Mobile settings → **Desktop** ("Mobile" gives phones Blogger's own simple theme without the shop) |
| "Could not restore theme" | Use Edit HTML (section 2, step 3) and send Claude a screenshot of the message |

## 11. How we make changes together

1. Tell Claude what you want, with screenshots from your phone if something looks wrong.
2. Claude changes `src/`, rebuilds `theme-night-shop.xml`, runs two automatic checks, tests desktop
   and phone in a browser, updates this guide, and sends you the new file.
3. You follow section 2 (backup → copy settings → upload → paste settings → check).
4. Tell Claude what you saw. Anything Blogger complains about gets fixed from the exact error message.

Keep the newest `theme-night-shop.xml` and your backup files. To undo an update, restore the backup.

## 12. Ideas for next steps

- **Stock that updates itself:** the sheet lowers `data-stock` when an order is marked Paid (needs the Blogger API).
- **Discount codes** checked by the sheet, so nobody can invent one.
- **Order status page:** buyers enter their order number and see "Paid / Shipped".
- **Google Shopping:** a product feed from the sheet for free listings in Google Merchant Center.
- **Filters** on category pages: price range, size, in stock only.
- **Wishlist** and **recently viewed** products.
- **"New" badge** for products from the last 14 days.
- **Parcel labels:** a button in the sheet that creates a DHL label from the order row.
- **One download link per buyer** (copies made automatically in Drive) for valuable files.
