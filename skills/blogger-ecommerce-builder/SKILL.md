---
name: blogger-ecommerce-builder
description: Turn a Blogger (Blogspot) blog into a complete online shop and small-business site, or customise, audit or migrate a Blogger shopping template such as SpotCommerce. Ships a tested shop theme: products with price/sale/stock/options/weight/video, digital downloads, cart and checkout (Google Sheet order inbox that re-checks prices, WhatsApp, Telegram, email, PayPal.Me, bank transfer), delivery partners with weight prices, multilingual shops, homepage sections (services, steps, reviews, FAQ, newsletter, partners, trust row, news ticker, branches), an "Ask" chat assistant, team/fulfilment/export pages with request forms, plus a logo/brand kit, owner guide and launch plan. Use whenever the user wants to sell products or services on Blogger, add a cart, checkout, order or quote form to Blogger, build an e-commerce Blogger theme, mentions SpotCommerce or another Blogger shop template, or asks how a Blogger store takes orders or payments, even if they only say "my blog shop".
---

# Blogger e-commerce builder

Blogger has no shop features. A Blogger shop is a theme plus JavaScript that treats **posts as products**,
keeps a **cart in the browser**, and sends the **order somewhere the owner will see it**. Each of those
parts can fail silently, so this skill ships a complete, tested shop theme (**Night Shop**), the pieces to
add a shop to any theme, an order inbox for Google Sheets, an audit, test scripts, an owner guide, and a
brand-kit generator.

**Always load `blogger-theme-builder` too.** It owns the theme mechanics (grounding in a proven
reference, src → build.py → theme.xml, check.py, upload steps). If the user has a brand skill, apply it.

## What you can build

| Area | Features (all owner-editable in Blogger's Layout or in the post's HTML) |
|---|---|
| **Storefront** | Product grid with prices, sale badges (−20 %), "Only 3 in stock", sold out, "Digital" badge; categories from labels; search; sticky header with cart badge; language picker |
| **Product page** | Photo + YouTube gallery (thumbnails, ▶ video), options (size, colour) that must be chosen, quantity capped by stock, weight and size line, "Ask on WhatsApp / Telegram", share buttons, star reviews from comments, Product + rating JSON-LD, "You may also like" from the same category |
| **Rich descriptions** | `feature-list`, `size-table`, `spec-table`, `photo-grid`, `photo-wide`, `two-cols`, `video-wide`, `note-box`, `data-lang` blocks |
| **Cart & checkout** | Drawer cart in localStorage; name, phone, email, street, postcode, city list per country; delivery partners with weight-step prices, delivery time and "About" link; free shipping threshold; "How do you want to order?" (Place order / WhatsApp / Telegram / email) and "How will you pay?" (bank transfer, PayPal.Me, cash …); digital-only carts skip the address |
| **Orders** | Order numbers from product initials + date + time (`SST-261105-063922`); Google Sheet inbox re-checks every price, stock, delivery fee and weight from the blog feed; branded HTML emails to owner and buyer; optional Telegram alert; chat orders logged too; bank details or "Pay now with PayPal (34,80 €)" after ordering |
| **Digital products** | `data-digital="yes"`; Downloads tab; owner sets Status = Paid → buyer gets the download email |
| **Business pages** | Templates: shipping, delivery partners, returns (Widerruf), contact, Impressum, privacy, team (photo, role, phone, social icons), fulfilment for sellers (quote form), shipping to another country (request form) |
| **Homepage sections** | Announcement bar, hero + perks, "Talk to us" call/Zoom/Meet buttons with times, What we do (service cards), How it works (steps), customer reviews, FAQ (+ FAQPage JSON-LD), newsletter (double opt-in), partner logos, trust row with payment badges, accreditation seals, news ticker with sourced figures, branches with Call / WhatsApp / Directions, "Ask …" chat assistant (Q&A from Layout, WhatsApp fallback; or a floating WhatsApp button) |
| **Languages** | English, German, French, Swahili, Arabic (right to left), Amharic, Tigrinya built in (native names in the picker, Noto fonts for Ge'ez/Arabic, homepage gadgets with a block per language); any other language via the Shop words gadget; owner content in `data-lang` blocks, also inside line-based gadgets |
| **Owner handover** | Owner guide with a start-to-finish quick start and test checklist, living guide document with every code block, prefilled order-inbox script |
| **Brand & launch** | Logo project + brand kit (one folder per design, editable SVG, PNG, print PDF, Word letterhead, guidelines PDF), name research, launch plan with posts for every platform |

## Pick the job

| The user wants… | Do this |
|---|---|
| A complete shop quickly | §1A: start from `assets/night-shop/` |
| A shop inside their existing theme | §1B: `scripts/add_shop_layer.py` |
| To keep SpotCommerce (or another bought shop theme) and change it | `references/spotcommerce.md` §7, then §7 audit |
| To leave SpotCommerce but keep their products | `references/spotcommerce.md` §8 (labels keep working) |
| An opinion on a shop template | §7 audits + `references/spotcommerce.md` §5–6 |
| A new feature on an existing Night Shop | Edit `src/` + `shop.js`/`shop.css`, keep both copies in sync (§9 lessons), test (§8), update the owner guide |
| Logo, brand kit, name, launch posts | §10 |

## 1. Theme base

### 1A. Start from Night Shop (recommended)
`assets/night-shop/` is the complete theme used on a live shop: `src/` (theme.xml, skin.css with shop.css
inside, theme.js, shop.js, includables), `preview/` (home, post, team, fulfilment, kenya), `reference/proven.json`,
`scripts/build.py` (builds `theme.xml` and `dist/` preview assets), `tests/`, and `OWNER-GUIDE.md`.

1. Copy the folder into the project; copy `check.py` and `extract_reference.py` from blogger-theme-builder's
   `scripts/` into its `scripts/`. If the user has a theme backup, regenerate `reference/proven.json` from it.
2. `python3 scripts/build.py && python3 scripts/check.py && python3 <this skill>/scripts/check_shop.py theme.xml`
   (90/90 and 14/14 on the shipped version).
3. Rebrand: the default gadget texts are the example shop "Kreislo" (second-hand Germany → Kenya, digital
   products, fulfilment in Gießen). Replace them in `src/theme.xml`: HTML1 menu, HTML3–5 hero, HTML6–8 footer,
   HTML10 promo, HTML11 talk, HTML12 partners, HTML13 seals, HTML14 announcement, HTML15 trust row,
   HTML16–20 homepage sections, HTML21 news ticker, HTML22 branches, HTML23 Ask assistant, HTML91 Shop settings, HTML93 Delivery options; and the pages in `assets/pages/`.
   Colours are skin `<Variable>`s (`accent.color`, `shop.accent` …) so the owner can also change them in Theme → Customise.
4. Edit `OWNER-GUIDE.md` for the new shop and hand it over (§9).

### 1B. Add the shop to another theme
Follow blogger-theme-builder steps 1–2, then `python3 <this skill>/scripts/add_shop_layer.py path/to/project`.
It wires `assets/shop/` into the project: skin variables, cart button, hidden Shop settings section,
`blog-includables.xml` (`shopCard`, `shopItem`), `shop.css`, `shop.js` (`@@SHOP_JS@@` in build.py). Add the
optional gadgets from `assets/shop/theme-snippets.xml` (snippets 5–11). Keep sections unconditional, TypeN
widget ids and only proven data tags.

## 2. Products

A product is a post with a product block at the very top of the body (HTML view):

```html
<div class="product" data-price="39,90" data-old-price="49,90" data-stock="12" data-sku="TS-01"
     data-options="Size: S, M, L | Colour: Red, Black" data-video="https://youtu.be/ID"
     data-weight="0.4" data-dimensions="30 x 22 x 3 cm">Price: 39,90 EUR</div>
```

`data-digital="yes"` makes it a download. Weight and size are entered by the **owner**, never the buyer.
Labels are categories; SpotCommerce price labels (`_39`, `-49`, `!0`) work with `label_prices: yes`.
Ready posts: `assets/samples/01–07`. Full reference: `references/products-and-orders.md` §1–2.

## 3. Orders and payments

Recommend the **Google Sheet order inbox** (`assets/apps-script/Code.gs`, §5) plus WhatsApp. Shop settings
lines: `whatsapp`, `telegram`, `email`, `google_sheet`, `place_order`, `paypal` (PayPal.Me **name**, not an
email: the classic cart page fails for most accounts), `payment: Bank transfer, PayPal, Cash on delivery`,
`bank`, `shipping`, `free_shipping_over`, `ship_to: Country (fee) = city, city`, `default_country`, `tax_note`,
`whatsapp_button`. Every line explained: `assets/shop/settings-gadget.html` and OWNER-GUIDE §3.
Legal checklist (Impressum, Widerruf, "Zahlungspflichtig bestellen", VAT note): `references/products-and-orders.md` §6.

Never: put secret payment keys in the theme; use Blogger's contact-form endpoint for orders; trust
browser totals without the sheet's re-check or the owner's manual check.

## 4. Owner-editable blocks

Every block is an HTML gadget whose content is wrapped in `<div class='shop-…'>`: one item per line, parts
separated by `|`. In line-based blocks, `text:` is an intro line, `#` lines are notes, and `<div data-lang="de">`
blocks give per-language versions (fallback English). Blocks without items hide their `<section>`.

| Class (gadget) | One line = | Notes |
|---|---|---|
| `shop-settings` (hidden) | `key: value` | §3 |
| `shop-words` (hidden) | `English: yours` or `[de] English: Deutsch` | Translations / own wording |
| `shop-delivery` (hidden) | `name \| 4,90 up to 2 kg; 6,99 up to 5 kg \| 2–4 working days \| /p/delivery.html#dhl \| Germany` | Overrides ship_to fees; re-checked by Code.gs |
| `shop-contact` | `call: +49 … \| Mon–Fri 9–18`, `zoom:`/`meet:`/`teams:`/`whatsapp:`/`telegram:`/`email:` | Also feeds Ask buttons if Shop settings lacks numbers |
| `shop-announce` | `message \| link` | Rotating bar above the header, closable |
| `shop-services` | `icon \| title \| text \| button \| link` | What we do |
| `shop-steps` | `title \| text` | Numbered |
| `shop-testimonials` | `stars \| quote \| name, city` | Hidden while empty; real reviews only |
| `shop-faq` | `question \| answer` | Adds FAQPage JSON-LD for the visible language |
| `shop-newsletter` | `text: …`, `button: …` | Needs google_sheet; double opt-in |
| `shop-logos` | `Name \| https logo \| link` | Partners / accreditation seals; text badge without logo |
| `shop-trust` | `icon \| title \| text \| link`, `pay: …` | Trust row + payment badges |
| `shop-ticker` | `text with *figure* \| source \| link` (parts after the first in any order) | Homepage news ticker under the header; gadget title = label; pause button, stops on hover/focus, still for reduced motion |
| `shop-branches` | `name \| address \| phone \| WhatsApp \| hours \| map link \| email`, `text:` | Branch cards with Call / WhatsApp / Directions (Google Maps search when no map link) + LocalBusiness JSON-LD |
| `shop-assistant` (hidden) | `name:`, `greeting:`, `suggest: a ; b`, `use_faq:`, `log_unanswered:`, `question \| answer \| other words` | "Ask …" chat bubble on every page (not AI: word matching incl. FAQ); no match → WhatsApp with the question + anonymous Questions tab; replaces the WhatsApp float; empty = off |
| `shop-lead` (in pages) | `data-kind`, `data-button`, `data-fields="Name*; Email*; Choice: a / b; Message"` | Request/quote form → Requests tab; WhatsApp fallback |
| `team` / `team-member` (in pages) | `data-phone`, `data-email`, `data-whatsapp`, `data-telegram`, `data-instagram` … | Team cards with icon buttons |

Icons: `tag globe download warehouse truck return lock shield chat card gift star leaf heart box check clock phone mail pin`.
Line formats and examples: `references/products-and-orders.md` §4b–4g; gadget XML: `assets/shop/theme-snippets.xml`.

## 5. The order inbox (Code.gs)

One Apps Script web app bound to a Google Sheet. Tabs: **Orders**, **Order lines**, **Downloads**, **Requests**,
**Newsletter**, **Questions** (unanswered chat questions, anonymous, max 300/day; all created by `setup`; new columns are appended to old tabs, foreign tabs are moved aside
as "(old …)"). It re-reads price, stock, digital flag and weight from the post feed, the Shop settings,
Delivery options and Talk-to-us gadgets from the homepage (cached 10 min), recomputes shipping, stores
customer text safely (no formulas), sends branded emails, and answers JSON. `doGet` serves newsletter
confirm/unsubscribe pages. Owner steps: paste the **whole** file → run `setup` → Deploy as Web app (Me,
Anyone) → `google_sheet: …/exec`. After every code change: **Manage deployments → New version** and run
`setup` again when new tabs or triggers were added. Give the owner a copy with `BLOG_URL`/`OWNER_EMAIL`
filled in, but never commit their email to a repository.

## 6. Languages

`language:` sets the default, `languages: en, de, fr, sw, ar, am, ti` adds a header picker (native names). Packs
for de, fr, sw, ar, am, ti are in `shop.js` (same keys; add a language by copying a pack); others come from Shop
words. RTL languages (`ar fa he ur ps`) set `dir="rtl"` on `<html>`; phone numbers, prices and links are isolated
LTR. Non-Latin scripts need fonts: add Noto Sans Arabic / Noto Sans Ethiopic to the Google Fonts link (only
downloaded when those letters appear) and after the primary family in every font stack. Mark machine-made
translations for a native speaker's check. Owner content uses `data-lang` blocks; fixed theme words
use `data-i18n`, `data-i18n-placeholder`, `data-i18n-label`. Gadget titles and menu links typed in English
are translated when a pack or Shop words know them.

## 7. Audit

```bash
python3 scripts/build.py && python3 scripts/check.py
python3 <this skill>/scripts/check_shop.py theme.xml --owner owner@mail --owner "DE89 3704 ..."
```

`check_shop.py` fails on SpotCommerce demo payment details, secret/test payment keys, retired services, the
`?m=1` redirect, disabled zoom, old jQuery UI, protocol-relative URLs, missing Product data and unnamed icon
controls; it warns on unknown emails/IBANs, vendor licence switches and third-party script hosts.

## 8. Test

- **Browser:** serve the project over http (`python3 -m http.server 8765`; feed-based features need http, not
  `file://`) and run `assets/night-shop/tests/browser-full.js`: four device sizes, every page, every
  checkout method, digital checkout, forms, newsletter, WhatsApp button. Look at the screenshots.
- **Inbox:** `tests/inbox-orders.js` and `tests/inbox-requests.js` run Code.gs in Node with fake Google
  services; a fake low cart price must come back as the feed price.
- A failing check can be the test: read the reason before changing shop code.
- Say plainly what was not tested: the live blog, the real Apps Script deployment, real email delivery,
  real phones.

## 9. Deliver and hand over

1. Theme file named like a Blogger backup (`theme-<shop>.xml`) + install steps (blogger-theme-builder §5).
2. **Owner guide** (`OWNER-GUIDE.md` adapted): section 0 is the whole setup in order (Blogger settings, logo
   and favicon, Shop settings, Delivery options, order sheet, all pages, homepage texts, products) with a
   test checklist and a before-launch list. Update it with every change.
3. Optional living guide document (Claude Docs or Google Docs) with every code block to copy; split code
   over 32 KB into Part 1 / Part 2 and verify the pasted text against the file.
4. Tell the owner: **copy the Layout gadget texts before every theme upload** (an upload resets them), set
   Mobile settings → Desktop, Site feed → Full, Comments → Anyone.

## 10. Brand and launch (optional)

- **Name:** web-search every candidate (exact word, companies, trademarks DPMA/TMview/EUIPO, domains,
  social handles) **before** proposing it, and show the results with sources. Invented words with a meaning
  in the owner's languages work well.
- **Logo + brand kit:** `assets/brand-kit/` (README there): a code-drawn wordmark with an arrow-ring O, symbol,
  app icons, every version and colourway, one folder and one zip per design, guidelines PDF, colours, templates
  (posts, story, share image, business card, sticker, thank-you card, letterhead + Word, email signature).
- **Design templates (Inkscape):** `assets/brand-kit/design_templates.py` (README there): sale posts for any
  product (square, 4:5, story, landscape, examples, new-arrivals grid, shipment notice) with a photo window and
  300 dpi export, merchandise print files (T-shirt, cap embroidery, work uniform) with placement previews, a
  step-and-repeat press backdrop, roll-up banner and video-call backgrounds. One folder and one zip per design.
  `social_profiles.py`: profile pictures and header images for YouTube, LinkedIn (company + personal), Facebook,
  TikTok, Instagram (highlight covers), X and WhatsApp Business, each named by platform with safe-area checks.
- **Intro and outro videos:** `assets/brand-kit/video/` renders 2D logo animations at 4K 60 fps for desktop (16:9,
  YouTube end screen frames) and mobile (9:16, TikTok/Reels safe area), with a sound logo made in code.
- **Business model and team plan:** write them as documents with a Business Model Canvas, the business lines, unit
  economics per sale, start and monthly costs, break-even, phases with triggers, legal rules (look them up: e.g.
  export of used electrical goods needs a function test per device), risks, KPIs; a team plan per phase with
  contract types, current minimum wage and Minijob limits (search them), costs, job ads and employer checklist.
  Mark every number that is not sourced as an assumption.
- **Launch plan document:** costs to secure the name (trade registration at the town hall ≈ €20–60, DPMA
  trademark €290 online for up to 3 classes + €100 per extra class, EU trademark €850/€900/€1,050 for 1/2/3
  classes, domain a few euros a year; confirm current fees), a 7-day timeline, ready posts for LinkedIn,
  Instagram/Facebook, TikTok/Reels, X and WhatsApp, merch file guide, checklist. Use only market figures you
  can source, and say when the owner's number can't be confirmed.

## 11. Lessons from live installs

- A theme upload resets every gadget: tell the owner to save Shop settings first; make Ask/WhatsApp buttons
  fall back to the Talk-to-us gadget.
- Owners paste shortened scripts ("AI tidied it"): insist on the whole Code.gs and a **New version** deploy;
  show the JSON error reason in the checkout message.
- `BLOG_URL` with a trailing slash, old tabs with other columns, cached products with `null` stock: all handled
  in Code.gs; keep those guards.
- A default "Shop words" line like `Add to cart: Add to cart` blocks every translation.
- Long blog titles break menus letter by letter: keep `white-space: nowrap` and a gap on nav links.
- A post with an extra `</div>` pushes reviews and sidebar out of the frame: shop.js repairs it and logs a hint.
- `&` in a widget `title='…'` must be `&amp;`; `]]>` must never appear inside CDATA script/CSS.
- shop.js and shop.css exist twice (skill `assets/shop/` and the theme's `src/`); edit the skill copy, then copy
  into `src/` (shop.css is embedded in `src/skin.css` between "Blogger shop styles." and the end of shop.css).
- Theme rules (`.widget li`, post-body tables) can override block styles: use specific selectors and check
  screenshots at 375 px.
- Two features must not share a class prefix: the product page already had `.shop-ask` (Ask on WhatsApp), so the
  chat assistant uses `.shop-chat-*`. Grep shop.js/shop.css for a new prefix before using it.
- Anything that reads a gadget another renderer rebuilds (the assistant reads the FAQ) must run before that renderer.
- Moving content needs a pause button, must stop on hover/focus and stand still for `prefers-reduced-motion`;
  in tests, wait ~150 ms after clicking pause before measuring.
- Never invent market figures for a ticker or a page: ship `#` example lines with "Source:" and let the owner fill them.
- A homepage `<style>` that sets `.section { display:block }` beats the `hidden` attribute: ship
  `[hidden] { display: none !important; }`, or empty sections show their raw `#` notes.
- `button, input { color: inherit }` in a theme makes inputs inside dark sections white-on-white: give shop
  inputs an explicit dark colour and white background; style `<option>` colours on dark selects.
- Right to left: anything parked at `left: -9999px` (skip links, honeypots) widens an RTL page by 10,000 px and
  phones zoom out; hide with `transform`/`clip-path` instead. Test every language at 390 px.
- Tokenize chat questions with `\p{L}\p{N}` (Unicode), not `[a-z0-9]`, or Arabic and Ge'ez questions find nothing.
