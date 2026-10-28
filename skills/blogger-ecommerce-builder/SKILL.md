---
name: blogger-ecommerce-builder
description: Turn a Blogger (Blogspot) blog into a working online shop, or customise, audit or migrate a Blogger shopping template such as SpotCommerce (Sneeit). Covers product posts with price/sale/stock/options, product cards and product pages, a cart drawer, checkout by WhatsApp, email, PayPal or a Google Apps Script order inbox that re-checks prices, Product structured data, shop translations, and the dangers in bought shop templates (the author's PayPal or bank details left in, closed vendor scripts, test payment keys). Use whenever the user wants to sell products on Blogger, add a cart, "add to cart" or checkout to Blogger, build an e-commerce Blogger theme, mentions SpotCommerce or another Blogger shopping template, or asks how a Blogger store takes orders or payments, even if they only say "my blog shop".
---

# Blogger e-commerce builder

Blogger has no shop features. A Blogger shop is a theme plus JavaScript that treats **posts as products**,
keeps a **cart in the browser**, and sends the **order somewhere the owner will see it**. Each of those
three parts can fail silently, so this skill gives a tested version of each and an audit for the dangers.

**Always load `blogger-theme-builder` too.** It owns the theme mechanics (grounding in a proven
reference, src → build.py → theme.xml, check.py, upload steps). This skill adds the shop layer on top.
If the user has a brand skill, apply it to the shop styles.

## Pick the job

| The user wants… | Do this |
|---|---|
| A shop on their blog (new or redesign) | §1–§5 below |
| To keep SpotCommerce (or another bought shop theme) and change it | `references/spotcommerce.md` §7, then §4 audit |
| To leave SpotCommerce but keep their products | `references/spotcommerce.md` §8 (labels keep working) |
| An opinion on a shop template | Run §4's audits and read `references/spotcommerce.md` §5–6 for what to look for |

## 1. Theme base

Follow blogger-theme-builder steps 1–2 (reference backup, starter project). Then add the shop layer:

```bash
python3 <this skill>/scripts/add_shop_layer.py path/to/project   # once; then build + both audits
```

On the unmodified starter this passes check.py and check_shop.py with no failures. If the project's markup
has drifted, the script names the missing anchor; add that piece by hand. The pieces in `assets/shop/`:

- `theme-snippets.xml`: the skin `<Variable>`s (`shop.accent`, `shop.ink`, `shop.tile`), the header cart
  button, the hidden **Shop settings** section (HTML gadgets, kept editable in Layout) and the script marker.
- `blog-includables.xml`: `shopCard` (list pages, inside a `.shop-grid`) and `shopItem` (single product)
  for the Blog widget. A post becomes a product only when its body has the product block (shop.js then
  adds `.is-product`, which switches on the two-column layout), so ordinary posts still read as posts.
  Static pages keep the theme's own includable.
- `shop.css` → append to `src/skin.css`. `shop.js` → `src/shop.js`, wired in `build.py` as `@@SHOP_JS@@`.
- `settings-gadget.html`: the content to paste into the Shop settings gadget (and German shop words).

Keep everything the theme-builder rules require: sections unconditional, TypeN widget ids, only proven
data tags (the includables use ones Blogger-generated legacy themes contain; check.py confirms them).

## 2. Products

Products are posts with a product block at the top of the body:

```html
<div class="product" data-price="39.90" data-old-price="49.90" data-stock="12"
     data-sku="TS-01" data-options="Size: S, M, L | Colour: Red, Black">Price: 39.90 EUR</div>
```

Labels stay categories. SpotCommerce price labels (`_39`, `-49`, `!0`) work with `label_prices: yes`.
Full reference and the owner's step-by-step instructions are in `references/products-and-orders.md` §1–2.

Why this format: data attributes survive Blogger's editor, the block is in `data:post.body` on list
pages (rendered into an inert `<template>`, so its images don't download), prices are no longer label
clutter, and the inner text gives no-JS visitors a price.

## 3. Orders and payments

Ask the owner how they want to receive orders. If they're unsure, recommend the **Apps Script order inbox**
(`assets/apps-script/Code.gs`): a Google Sheet row plus emails, with **every price re-read from the blog's
feed so a tampered cart can't change the total**. WhatsApp is the zero-setup option. Details, trade-offs,
setup steps and the German/EU legal checklist (Impressum, Widerruf, "Zahlungspflichtig bestellen",
VAT note) are in `references/products-and-orders.md` §3–6.

Never: put secret payment keys in the theme; use Blogger's contact-form endpoint for orders; trust
browser-computed totals without a server check or a manual check by the owner.

## 4. Audit

```bash
python3 scripts/build.py && python3 scripts/check.py                     # theme-builder audit
python3 <this skill>/scripts/check_shop.py theme.xml --owner owner@mail --owner "DE89 3704 ..."
```

`check_shop.py` fails on: SpotCommerce demo payment/store details, secret or test payment keys, retired
services (lorempixel, AddThis, Google+), the `?m=1` redirect, disabled zoom, old jQuery UI,
protocol-relative URLs, missing Product structured data, and icon-only controls without an accessible
name. It warns, for a human to judge, on any email or IBAN not passed as `--owner`, vendor licence
switches, and every non-Google host the shop loads code from. On a fresh starter theme the only
expected failure is "Product structured data" until shop.js is wired in.

## 5. Browser test

Open `assets/shop/preview/list.html` and `item.html` (they load `../shop.js`, plus `shop.preview.css`,
which is shop.css with the variables resolved; regenerate it if shop.css changes), and update them if
you change the markup. With Playwright at 1280 and 375px check:
cards show prices, sale badges and sold-out states; option pickers are required; the stock limit caps
quantity; the cart badge counts; the drawer opens from the badge and closes with Escape; totals and free
shipping are correct; checkout validates the required fields; the WhatsApp/email text is complete (stub
`window.open` to read it); `application/ld+json` has the right price and availability; no horizontal
scroll; no console errors. Then screenshot and look.

For the Apps Script inbox, run Code.gs in Node with stubbed services (`LockService`, `SpreadsheetApp`,
`MailApp`, `UrlFetchApp`, `CacheService`, `ContentService`) and post a cart with a fake low price. The
reply total must use the feed price.

## 6. Deliver

Theme delivery and install steps as in blogger-theme-builder §5, plus:
1. Fill in **Layout → Shop settings** (whatsapp/email/order_endpoint, currency, shipping) and, if needed, **Shop words**.
2. Blogger **Settings → Site feed → Allow blog feed: Full** (needed by the inbox).
3. Convert or create 2–3 products and **place a real test order with every enabled method** before going live.
4. Hand over the "Adding a product" steps (`references/products-and-orders.md` §1) in plain language.

Be honest about limits: the cart lives in the buyer's browser, stock is updated by hand, and payment
confirmation (PayPal/bank) is checked by the owner.
