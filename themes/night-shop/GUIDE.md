# Night Shop: setup and update guide

Night Shop turns a Blogger blog into a shop. Every post is a product. Visitors fill a cart, choose
how to order (online, WhatsApp, Telegram, email or PayPal), and every order can be saved in your own
Google Sheet.

This guide is kept up to date with every change to the theme. The newest version is always in this
folder (`themes/night-shop/GUIDE.md`). The complete click-by-click version, with every code block to copy,
is the "Night Shop: complete setup guide" document.

## Contents
1. What's in the folder
2. Install or update the theme (do this every time)
3. Shop settings: every line explained
4. Adding a product
5. Languages
6. How orders reach you
7. Saving every order in a Google Sheet
8. Reviews
9. Footer pages (Shipping, Returns, Contact, Impressum, Privacy)
10. Troubleshooting
11. How we make changes together
12. Ideas for next steps

---

## 1. What's in the folder

| File | What it's for |
|---|---|
| `theme-night-shop.xml` (in the main folder) | The theme you upload to Blogger |
| `samples/` | Six ready-made product posts to copy |
| `pages/` | Templates for the footer pages |
| `apps-script/Code.gs` | The Google Sheet order inbox |
| `GUIDE.md` | This guide |
| `src/`, `scripts/`, `preview/` | The theme's source; Claude edits these and builds `theme-night-shop.xml` |

## 2. Install or update the theme (do this every time)

Uploading a theme puts every gadget back to the theme's default text. So **save your gadget text first**.

1. **Back up:** Theme → ▾ (next to Customise) → **Backup** → Download. Keep the file.
2. **Copy your settings:** Layout → **Shop settings** (bottom of the page) → Edit → select all text →
   copy it into a note. Do the same for **Shop words**, the **menu** gadget, and any gadget you changed
   (hero text, "Why shop with us", "Order directly", footer texts).
3. **Upload:** Theme → ▾ → **Restore** → upload `theme-night-shop.xml`.
   If it only says "Could not restore theme": Theme → ▾ → **Edit HTML**, select everything, paste the
   whole file, Save. That screen names the exact problem; send Claude a screenshot.
4. **Paste your settings back:** Layout → Shop settings → Edit → paste → Save. Same for the other gadgets.
5. **Phones:** Theme → ▾ → **Mobile settings** → choose **Desktop** (once is enough).
6. **Blog feed:** Settings → Site feed → Allow blog feed → **Full** (needed by the Google Sheet inbox).
7. **Reviews without a Google account:** Settings → Comments → Who can comment → **Anyone**.
8. **Check** (2 minutes): homepage, one product, add to cart, checkout, a category page, the language
   picker, and the phone menu.

## 3. Shop settings: every line explained

Layout → **Shop settings** → Edit. One setting per line. Capital letters don't matter; `:` or `=` both
work. Leave a value empty to switch it off.

```
shop_name: Night Shop
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
| `hero_image`, `banner_image` | A photo link (`https://…`) for the big homepage background and the "Order directly" banner. Empty = the drawn city lights |

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

**The six samples:** `01` T-shirt with sizes and a size chart · `02` sneakers with video and details
table · `03` sale item with lifestyle photo grid · `04` sold out · `05` bag with photo-and-text block ·
`06` product in three languages.

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
Checkout asks for name, phone, email, street, postcode, city and country, plus an optional note.

## 7. Saving every order in a Google Sheet

You can't paste a normal Sheet link into the shop: a sheet can't receive orders by itself. A small
script acts as the sheet's "inbox". **Where is it?** In the kit zip, folder `apps-script`, file `Code.gs`
(Claude also sends it as its own file, already filled in with your blog address and email).

**Paste the whole file, unchanged.** It is about 430 lines long. If you only have a short version
(for example one an AI "tidied up"), orders fail with "Sorry, the order could not be sent", because
the part that receives orders (`doPost`) is missing. Set it up once (about 5 minutes):

1. Open **sheets.new** and name the sheet, e.g. "Night Shop orders".
2. **Extensions → Apps Script.** Select everything in the editor (Ctrl+A), delete it, and paste all of `Code.gs`.
3. At the top, change `BLOG_URL` to your blog address, e.g. `https://yourshop.blogspot.com`.
   Optional: `OWNER_EMAIL` (where order emails go), `EMAIL_OWNER_FOR_CHAT_ORDERS: true` (also email
   you WhatsApp/Telegram orders). Save (disk icon).
4. Choose **setup** in the function list next to Run, press **Run**, and allow the permissions
   ("Advanced → Go to … (unsafe)" is normal for your own script). You get a test email, and the tabs
   **Orders** and **Order lines** appear.
5. **Deploy → New deployment** → gear icon → **Web app** → Execute as **Me** → Who has access
   **Anyone** → Deploy. Copy the **Web app URL** (ends in `/exec`).
6. Blogger: Layout → Shop settings → `google_sheet: ` + paste the URL → Save.
7. Place a test order. A new row appears in **Orders** (one row per order) and **Order lines** (one
   row per product).

**Replacing an older script:** paste the new file over everything, Save, run **setup** again (tabs with
old columns are renamed "Orders (old …)", nothing is deleted), then **Deploy → Manage deployments →
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

## 9. Footer pages (Shipping, Returns, Contact, Impressum, Privacy)

The footer already links to `/p/shipping.html`, `/p/returns.html`, `/p/contact.html`,
`/p/impressum.html` and `/p/privacy.html`. Create each page once:

1. **Pages → New page.**
2. Title: the **short name first**: `shipping` (then `returns`, `contact`, `impressum`, `privacy`).
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
- **Pickup point / local delivery** option with its own fee.
