# SpotCommerce teardown (v2.3.9, Sneeit)

Notes from taking apart `spotcommerce.xml` (the theme) and the demo blog export (`blog-08-12-2014.xml`).
Use them to **customise SpotCommerce** for someone who already bought it, to **migrate** a SpotCommerce
shop to our own shop layer, or as a source of ideas. The vendor documentation (sneeit.com) and the
`main.js` / `main.scss.css` files on `tiennguyenvan.github.io` could not be fetched from the sandbox,
so everything below comes from the theme and demo data alone. Say so when you rely on it.

## Contents
1. How it works
2. Where every setting lives
3. Product data: the label syntax
4. Demo design and assets
5. What's good (ideas worth borrowing)
6. What's risky or broken
7. Modifying SpotCommerce safely
8. Migrating to our shop layer

---

## 1. How it works

- **Engine:** legacy (`b:version='2'`, version-less widgets). It still uses some v3-era tags:
  `b:with`, `resizeImage(...)`, `data:post.featuredImage` (PopularPosts) and `data:view.isLayoutMode`.
  They are proven for *this* theme only. Don't copy them into another theme unless its reference proves them.
- **The theme XML is only a shell.** All shop logic (cart, wishlist, checkout, slider, tabs, related
  products, translations, menu) is in a closed external script:
  `https://tiennguyenvan.github.io/cdn/spotcommerce/2.3.9/main.js` plus `main.scss.css` (or the
  `spotcommerce-rtl.scss.css` stylesheet for RTL blogs). It also needs jQuery 3.6.3 and jQuery UI 1.10.4
  from Google's CDN, and icon fonts from `google-git.github.io` (a third-party mirror, not Google).
  The inline `launch-js` script defines settings as global `var`s, then polls every 10 ms until
  jQuery, jQuery UI and `window.main_js` exist, and calls `main_js()`.
- **Pages:** list pages show `index-post` cards (thumbnail, title, an empty `.add-to-cart`). JS fills in
  prices from labels. Single posts (`item-post`) have empty slots (`.desc-image-list`, `.post-header-meta-2`,
  `.post-header-action-buttons`, `.post-similar`) that JS fills with the gallery, price, buy buttons and
  similar products. Wishlist is `/?page=wishlist`; cart and checkout are JS views too.
- **Comments are reviews:** `comment_picker` relabels Blogger comments as "Reviews" / "Add a review".
- **Order delivery (inferred):** the Blogger **ContactForm** widget sits inside the Blog section and the
  strings mention "the shop owner did not receive your order" and a Google Form fallback
  (`GOOGLE_FORM_PREFILL_URL`). So orders most likely go through Blogger's contact-form mail to the
  blog owner, falling back to a prefilled Google Form or a screenshot. That's an undocumented Blogger
  endpoint, and it fails silently when Blogger changes it.
- **Payments:** direct bank transfer (up to 5 accounts), cheque, cash on delivery, PayPal (by email
  address), UPI QR codes (Paytm/PhonePe/GPay) and "Order via WhatsApp". A Stripe block exists but is
  disabled (`b:comment` + `b:if cond='false'`) and holds a **test** publishable key. Nothing confirms
  that a payment arrived. The owner checks by hand.
- **Cart storage:** browser `localStorage`, kept `CART_CACHE_DURATION` days (default 7).

## 2. Where every setting lives

| What | Where in the XML | Notes |
|---|---|---|
| Main colour, fonts, item tile colour | `<Variable>`s in `<b:skin>`: `maincolor` (#FF3300), `body.font` (16px Open Sans), `emfont` (20px Oswald), `itembgcolor` (#EBE2D9), `body.background.color` (#f0f0f0) | Also in Theme > Customise |
| Slider / pager font size | `/*slider-font-size-start*/…/*…-end*/` markers in the skin | Edited by "Sneeit Spot" |
| Licence key | `var SNEEIT_LICENSE = "";` | Vendor licence check |
| Store, currency, PayPal, tax, shipping | `var STORE_NAME`, `CURRENCY_CODE = SC['USD']`, `PAYPAL_EMAIL`, `TAX`, `SHIPPING_FEE` (`''`/0 free, number flat, `'10%'` percent) | In `launch-js` |
| Bank accounts 1–5 | `BANK_ACCOUNT_n_NAME / NUMBER / BANKNAME / SORTCODE / IBAN / BIC_SWIFT` | Account 1 ships with **the author's real-looking details** |
| Payment methods, checkout fields | `ENABLE_DIRECT_BANK_TRANSFER`, `ENABLE_CHEQUE`, `ENABLE_CASH_ON_DELIVERY`, `ENABLE_PAYPAL`, `ENABLE_UPI_TRANSFER`, `ENABLE_FIELD_*` | true/false |
| UPI QR images | `UPI_QR_PAYTM`, `UPI_QR_PHONEPE`, `UPI_QR_GPAY` (+ `_LOGO`) | Demo QR codes. Replace or disable |
| WhatsApp ordering | `WHATSAPP_PHONE_ORDER` | Blank = off |
| Coupons | `COUPON_0…4`, `MAX_COUPON_VALUE_PER_ORDER` | Format unknown without the docs; coupons are checked client-side, so anyone can read them |
| Misc | `DAY_FORMAT`, `SUMMARY_LEN`, `DEFAULT_THUMBNAIL` (lorempixel, **dead**), `NUMBER_ITEMS_FOR_COLLECTION`, `MAX_ARCHIVE_ITEMS`, `SHOW_CHECKOUT_PRINT`, `GOOGLE_FORM_PREFILL_URL`, slider speed/pause/controls | |
| Main menu | Between `<!--SPOTCOMMERCE-MAIN-MENU-LOCATION-START-->` and `…-END-->` in `Header1` | Hard-coded links to `spotcommerce.blogspot.com` |
| Copyright | `<!--cpr-year-start-->Copyright (c) 2021<!--cpr-year-end-->` | Static year |
| Checkout terms link | `<!--checkout-agreement-start-->… href='put_your_link_here' …` | Must be replaced |
| Translations | ~90 hidden `<span data-l10n='…'>` strings, plus the "Translator" LinkList10 (name = translation, URL = original) | LinkList overrides are marked "obsoleted" in favour of Sneeit Spot |
| Settings editor manifest | `<b:if cond='false'><![CDATA[ SNEEIT-THEME-OPTIONS … SNEEIT-THEME-MENUS ]]></b:if>` at the end | JSON listing each option's `start`/`end` text markers. Sneeit Spot rewrites the values between them |

**Sneeit Spot** is the vendor's settings editor. It finds each value by its start/end marker strings, so
if you hand-edit, keep those exact strings intact (e.g. `var PAYPAL_EMAIL = '` … `';`) or the editor can
no longer find the setting.

## 3. Product data: the label syntax

From the demo export (38 products). Each product is a normal post. **Labels carry the shop data:**

| Label | Meaning | Example |
|---|---|---|
| `_N` | price | `_39`, `_240.55`, `_89.90` |
| `-N` | old price, shown crossed out (sale) | `-40`, `-90.00` |
| `!N` | stock count (`!0` = out of stock) | `!0` |
| anything else | category (menu, collections, related products) | `Women's Clothing`, `Nightwear` |

The post body starts with the product photos (Blogger `.separator` image blocks), then the description,
optionally `<h2>Features</h2><ul>…</ul>`. JS moves the photos into a gallery.
The hidden `Label2` widget in `admin-section` prints every label with its count and URL, so JS can build
collections without extra feed requests.

Why labels? On list pages, the legacy Blog widget can print labels server-side, so prices are available
without loading each post. The cost: price labels appear in label lists, sitemaps and
`/search/label/_39` pages, changing a price means editing labels, and Google sees no price in the HTML.

## 4. Demo design and assets

The user supplied the demo images:
- **Header background** (`Image2`): a warm, blurred night-city photo. The gadget's `main` includable
  prints `<style>#header{background-image:url(…)}</style>`.
- **Home Horizon background** (`Image1`): a teal/green blurred night street behind the `Text1` "DIRECTLY" block.
- **Logo**: a white wordmark with a dot in the main colour (#FF3300), on the dark header.
- **Slider** (`Image3`–`Image7`): transparent PNG product cut-outs. The gadget title format is
  `PRODUCT NAME[CATEGORY]`, e.g. `SCOTT SPORT T-SHIRT[MEN's CLOTHING]`, and the gadget's link points to the product.
- **Cards**: transparent product PNGs on the beige `itembgcolor` tile. Oswald for headings, Open Sans for body text.

The demo shirts carry real brand logos (Scott, La Sportiva). Never ship them on a real shop.

## 5. What's good (ideas worth borrowing)

- **Image gadget as a background picker:** an Image gadget whose `main` includable only prints a
  `<style>` with `background-image`, so the owner changes hero backgrounds in Layout with an upload button.
- **Hidden admin section** with a Label gadget that exposes all labels with counts to JS.
- **Gadgets as settings/translation stores** (LinkList name/URL pairs). Our version uses HTML gadgets with
  `key: value` lines, which are safer (no URL mangling) and easier for non-developers to edit.
- **`data-l10n` strings** gathered in one hidden block, so one theme can be translated without touching code.
- **Comments relabelled as product reviews.**
- **`body#layout` CSS with `.layout-title:after { content: '…' }`** to label gadgets and explain them inside the Layout editor.
- **Homepage tabs** (Latest / Random / Popular), a search overlay, the breadcrumb bar and a "Similar products" block.
- **Store, bank, tax and shipping settings** grouped in one documented block, with an options manifest
  an external editor can rewrite.

## 6. What's risky or broken

1. **Vendor lock-in:** the shop only works while `tiennguyenvan.github.io` serves `main.js` (v2.3.9
   pinned) and the licence check passes. It's closed code, so it can't be audited or fixed.
2. **The author's payment details are the defaults:** a PayPal email, bank account, store address in
   Ho Chi Minh City and a ShareThis property id. If the owner misses one, **customers pay the template
   author**. Run `check_shop.py` first, every time.
3. **Client-side totals:** prices, coupons, tax and shipping are computed in the browser and sent as text.
   A tampered cart produces a "valid-looking" order. The owner must re-check every order against the
   real prices (our Apps Script backend does this automatically).
4. **Fragile order delivery:** an undocumented contact-form endpoint, a Google Form fallback, and
   "take a screenshot and send it" as the last resort.
5. **Old dependencies:** jQuery UI 1.10.4 (2014, known XSS issues) loaded protocol-relative;
   lorempixel default thumbnails (service dead); an AddThis wrapper (AddThis shut down in 2023).
6. **Mobile:** `maximum-scale=1.0` blocks pinch-zoom on product photos, and a script redirects `?m=1`
   to `?m=0`, loading every mobile page twice.
7. **SEO:** posts are marked up as `BlogPosting` with an incomplete `hentry`. There's no `Product`/`Offer`
   structured data, so no price or stock in Google results. Product images use `alt='natural-thumbnail'`.
8. **Accessibility:** the menu, search, cart, wishlist and scroll-up controls are icon-only `<a>` elements
   with no `href` and no `aria-label`.
9. **Layout editor:** the slider, popular items, Home Horizon and collection sections sit inside
   `<b:if>` (homepage only).
10. **Leftovers:** a hard-coded menu pointing to `spotcommerce.blogspot.com`, "Copyright (c) 2021",
    `put_your_link_here` in the terms checkbox.

## 7. Modifying SpotCommerce safely (owner keeps the paid theme)

Work on a copy, never on the live theme. Back up first (Theme > ▾ > Backup).

1. Run `python3 scripts/check_shop.py spotcommerce.xml --owner <their email> --owner <their IBAN>`
   and the blogger-theme-builder `check.py` (with the theme itself as the reference).
2. Replace **every** item in the leftover list: `PAYPAL_EMAIL`, `BANK_ACCOUNT_1_*` (and blank the
   unused 2–5), `STORE_*`, `CURRENCY_CODE` (e.g. `SC['EUR']`), the UPI QR codes (or set
   `ENABLE_UPI_TRANSFER = false`), `WHATSAPP_PHONE_ORDER`, the ShareThis line in `shareButtons`
   (replace it with plain share links), the menu block, the copyright year, `put_your_link_here`.
3. Switch off what the owner can't honour: cheque, COD, bank transfer, PayPal (`ENABLE_*`), and unused
   checkout fields (`ENABLE_FIELD_*`).
4. Fix the cheap issues without touching vendor logic: viewport → `width=device-width, initial-scale=1`;
   delete the `m=1` redirect and tell the owner to set Mobile settings → Desktop; load jQuery UI over
   `https://` (and only bump the version after testing, because main.js may depend on 1.10 behaviour);
   `DEFAULT_THUMBNAIL` → an image on their own blog; add `aria-label`s to the toggles; give product
   images real alt text (`expr:alt='data:post.title'`).
5. Add Product structured data without touching main.js: put shop.js's JSON-LD block into a small inline
   script that reads the `_`/`-`/`!` labels from the page (or use our full shop layer instead).
6. Keep Sneeit Spot's marker strings unchanged if the owner still uses that editor.
7. Test a real order end-to-end (every enabled payment method) before announcing the shop.

## 8. Migrating to our shop layer

- Keep the posts. Set `label_prices: yes` in Shop settings, and shop.js and Code.gs read the `_ - !`
  labels exactly as SpotCommerce did. Price labels are hidden from label lists.
- Convert products gradually to the product block (`<div class="product" data-price=…>`), which wins
  over labels when present. Then remove the price labels.
- Rebuild the look (dark photo header, white wordmark with accent dot, beige tiles, Oswald headings)
  with blogger-theme-builder's starter. Reuse the background-image gadget pattern for the header and banner.
