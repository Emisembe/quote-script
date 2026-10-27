---
name: efic-brand-web
description: "EFIC Consultancy Ltd brand system for the web: Blogger themes, Blogger pages and gadgets, HTML tools and apps, and printable/PDF business documents (invoices, quotes, receipts, letters), print quality. Covers navy/gold tokens, approved colour pairings, Montserrat/Calibri type, signature components, Blogger-specific rules (ASCII-safe code, scoping, hiding theme chrome) and a verification checklist. Use whenever building, restyling, fixing or reviewing anything web-based for EFIC / Efic Consultancy / eficc.blogspot.com, including when the user pastes HTML for a Blogger page or says 'make it match my brand', 'use my colours', 'rebrand this page', 'EFIC style', even if they don't name the brand guide."
---

# EFIC brand for the web

This captures how the EFIC Brand Colour Guide v1.0 was applied to the eficc.blogspot.com theme, the EFIC Document Generator page and the EFIC Letter Generator page, plus every bug found along the way. Apply it to new pages, gadgets, tools and documents so they look like one family and survive Blogger.

For building or fixing a whole Blogger **theme** (XML), also use the `blogger-theme-builder` skill. This skill supplies the brand and the EFIC-specific lessons on top of it. For the EFIC Letter Generator page itself, use the `efic-letter-generator` skill: it bundles the tested page and its browser tests.

## 1. Brand tokens

| Token | Hex | Role |
|---|---|---|
| EFIC Navy | `#14213D` | Primary: nav bars, headers, headings, table headers, dark buttons, totals bar |
| EFIC Gold | `#E7B165` | Accent: CTA fills, divider lines, left-edge bars, icons and labels **on navy** |
| Deep Navy | `#0F1A30` | Footers, overlays, hover on navy |
| Pure White | `#FFFFFF` | Text on navy, page and card backgrounds |
| Off-White | `#F7F6F2` | Section backgrounds, info boxes, zebra rows |
| Neutral Grey | `#4A5568` | Body copy, labels, secondary text |
| Light Gold | `#F5D08A` | **Only inside gold gradients** (e.g. `linear-gradient(135deg,#F5D08A,#E7B165,#C9924A)`) |
| Dark Gold | `#C9924A` | Gradient depth; decorative large marks (watermarks) |
| Alert Red | `#E74C3C` | **Never on the web.** Reserved for the LIVE broadcast dot |

Supporting neutrals that read as on-brand: borders `#E8E5DC` / `#D9D5CA`, tool backdrop `#ECEAE4`, muted text `#718096`.

### Approved pairings (WCAG AA)
- White on Navy (14.7:1), Gold on Navy (6.4:1), Navy on Gold (6.4:1), Navy on White (14.7:1): use freely.
- Gold on Off-White (2.8:1): decorative headings 24pt+ only.
- **White on Gold (2.3:1): never.** A gold button always has navy text.
- **Gold text on white: never** for anything readable. On light backgrounds, hovers and links go navy (add a gold underline for flair: `text-decoration-color:#E7B165`).

The reason these matter: the old template mixed sky blue, green, purple, orange and red, and used gold/blue text on white; the brand only feels "EFIC" when navy carries surfaces and gold is a sparing accent.

## 2. Typography
- **Montserrat** (400/600/700/800) for headings, nav, buttons, labels, section titles, document titles. Stack: `'Montserrat', 'Arial Black', Arial, sans-serif`.
- **Calibri** for body copy, form fields, document body and tables. Stack: `Calibri, Arial, 'Helvetica Neue', sans-serif`.
- Load: `https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&display=swap`. On eficc.blogspot.com the theme already loads it, plus Font Awesome 4.7 (`fa fa-*` icons work in pages and gadgets).
- Labels and section titles: Montserrat 600-700, 9-13px, uppercase, letter-spacing 1-2px. No light-weight headings (the guide lists them as a "don't").

## 3. Signature components
Use these motifs; they come straight from the guide's broadcast components and make pages instantly recognisable. Copy-ready CSS is in `references/components.css`.

- **Gold left edge**: 3-4px gold `border-left` on sidebar titles, info boxes, active panel heads, card titles. ("Brand entry point, always first.")
- **Navy band + gold rule**: navy bar with a 2-3px gold `border-bottom` for top bars, page headers, document tops, totals.
- **Gold short underline** under section headings: 36-72px wide, 2-3px, gold (or the light-gold gradient).
- **Buttons**: primary = gold fill + navy text; on navy bars secondary = transparent + white text + `rgba(255,255,255,.35)` border, hover gold; on white = navy outline, hover navy fill + white text. One primary per bar.
- **Cards**: white, 1px `#E8E5DC` border, gold top border appears on hover, slight lift.
- **Icon disc**: navy circle with a gold icon.
- **Documents (invoices etc.)**: navy band + gold rule at the top; navy table header with white uppercase Montserrat; off-white zebra rows; numbers right-aligned; totals block ending in a **navy bar with white label and gold amount**; status watermark in navy (draft/pending in dark gold) at ~7% opacity; initials badge (navy square, gold initials, gold bottom rule) when no logo.
- **Focus states**: `outline: 2px solid #E7B165; outline-offset: 2px`; inputs get gold border + `0 0 0 3px rgba(231,177,101,.3)` ring.

## 4. Building Blogger pages, gadgets and tools
These rules come from real failures on eficc.blogspot.com.

1. **Make the code ASCII-only. This is the most important rule.** Blogger's page editor rewrites every non-ASCII character (`×`, `—`, `…`, `ä`, `é`, Chinese text) as `&#NNN;` on save. HTML decodes those again, but **`<script>` and `<style>` don't**, so the remove button showed "&#215;" and every German/French/Chinese label broke. Write JS as `'\u00d7'`, CSS as `content:'\0000d7'`, HTML text as `&#215;`. Run `python3 scripts/blogger_safe.py fix <file>` to convert, and `check` to verify. Beware: some writing tools silently turn `\u00d7` escapes into the real character (this happened while writing the Document Generator), so always run the check on the final file. Don't write `<script>` or `<style>` inside an HTML comment either: older versions of the fixer took it for a real script tag and escaped the whole page as JavaScript (the current one skips comments).
2. **Scope everything under one wrapper id** (`#fdg-app`, `#efic-xyz`) and prefix all CSS with it, so nothing leaks into the theme and theme rules lose on specificity.
3. **Set `box-sizing: border-box` on the wrapper's descendants.** Without it, `width:100%` fields plus padding overflow their panel (seen as cut-off inputs). Also add `#app [hidden] { display: none !important; }`: a button class with `display:inline-flex` beats the `hidden` attribute, so "Remove" buttons showed with nothing to remove.
4. **Full-page tools hide the theme chrome on that page only.** For the current EFIC theme hide: `#header-wrapper, #jugas_footer, .tm-menu, .scroll-header, .slicknav_menu, #sidebar-wrapper, .foot-bar-social, .Attribution, .feed-links, #blog-pager, .post-header, .post-head, h1.post-title, .post-footer, .share-box, #related-posts, .comments, #comments, .insta-wrap, #main > .widget:not(.Blog)` (the last one hides the HTML gadgets the theme keeps under every post and page), and zero `#content-wrapper`/`#main-wrapper`/`.post-body` padding, width and float. Otherwise the page title, share bar, comments or gadget text appear around the tool. Also hide the theme's newer sections: `.efic-newsletter-wrap, .efic-slider-wrap, .efic-feature-wrap, .office-contacts-wrap, .foot-certs, .lang-switch, #google_translate_element`. **Make it future-proof with a little JS:** on start and on `load`, walk up from the tool's wrapper to `<body>` and set `display:none !important` on every sibling at each level (skip `script`/`style`/`link`, and anything whose id or class contains `cookie`, because Blogger's EU cookie notice must stay visible). The CSS list alone failed once: the newsletter band added to the theme later appeared under both tools. Test it by listing every visible element outside the tool's wrapper: the list should be empty, even with a made-up new theme section injected, and the cookie notice should still show.
5. **Known theme clashes to neutralise inside your wrapper:** `.post-body img` adds `padding:10px 0` (logos shift); `.post-body h2/h3` add `margin:28px 0 12px`, so set full margins on your headings; the theme's print CSS adds an "EFIC CONSULTANCY LTD" heading via `#content-wrapper:before`, so set `content:none` in your `@media print`; `html{overflow-x:hidden}` hides sideways overflow on the blog, so test the tool on a bare page too.
6. **No stray wrappers**: don't wrap the paste in `<p>…</p>` (Blogger's HTML view sometimes adds one). Put `<style>`, markup and `<script>` at the top level.
7. **Links to the blog's own pages are relative** (`/p/services.html`), never `https://eficc.blogspot.com/...`, so the code works on test blogs and after a domain change.
8. **Never build HTML from typed text with `innerHTML`.** Use `textContent` / DOM nodes (or an escape helper). Typed `<` or `&` broke layouts and allowed script injection in the first Document Generator.
9. **Grid layouts**: use `minmax(0,1fr)` and `min-width:0` on grid children, or one wide input makes the whole column overflow on phones.
10. **Share URLs**: build them with `encodeURIComponent` (titles with `&` or `#` were cut off). WhatsApp `https://api.whatsapp.com/send?text=`, Telegram `https://t.me/share/url?url=&text=`.
11. **PDF export (html2canvas + jsPDF)**: use JPEG (`toDataURL('image/jpeg', .92)`), not PNG: about 0.2 MB a page instead of 12 MB. Await `document.fonts.ready` before capture. Offer `navigator.share({files})` where `navigator.canShare` allows, so phones can send the PDF itself.
12. **Multi-page documents**: lay the document out on fixed A4 sheets (794 x 1123 CSS px = 210 x 297 mm at 96 dpi) and use the same sheets for the preview, Print and the PDF. Move whole blocks; never slice a long screenshot into pages. Rules:
    - Item rows never split, and the table header repeats on every page.
    - Pages 2+ get the navy band and a "(continued)" line with the document number.
    - The totals keep at least one row with them.
    - Every page has a footer reading "Page X of Y".
    - **Print:** move the tool to `<body>` on `beforeprint` and back on `afterprint`, and use `@page { size: A4; margin: 0 }`. Inline heights set by JS (sticky panels) beat print CSS, so print rules need `!important`. Without them, printing silently stops after page 1.
    - **PDF:** capture each sheet with html2canvas at `scale: 3.125` (300 dpi).
    - **Test:** check the real print with Playwright `page.pdf()` and `pdftotext`.
    - **Print quality:** users care that paper copies look sharp. Keep the document as real HTML text, never a screenshot, so **Print** sends text as outlines at the printer's full resolution (600-1200 dpi). **Download PDF** is a 300 dpi picture of each page, which is fine for email and print shops. When the user asks for a PDF that's as sharp as the paper copy, tell them to use **Print → Save as PDF**.
    - **Uploaded images** are downscaled so saved documents stay small, but the limit must keep at least 300 ppi at the largest size the image can print: pixels >= (max printed width in mm / 25.4) x 300. A 70 mm wide letter logo needs about 830 px, so the letter tool uses 1000 px (362 ppi). An 800 px limit gave only 290 ppi on wide logos.
    - **QR codes:** draw them at about 8 px per module and give the `<img>` `image-rendering: pixelated`, so the edges print crisp and banking apps can scan them.
    - **Verify print quality:** run `pdffonts` on the print PDF (embedded fonts mean the text is outlines) and `pdfimages -list` (every image at or above 300 ppi; ignore the `smask` rows). Run `pdfimages -list` on the downloaded PDF too: about 2481 x 3509 per A4 page means 300 dpi.
13. **Live preview plus an Update button.** Redraw on every input with a short debounce (about 150 ms), and still put an **Update** button first in the top bar. It redraws at once and shows "Updated" for about 1.5 s (gold on the navy bar), so the user can see the preview is current before printing. Users ask for this button even when the preview is live.
14. **Contracts and templates** (see the `efic-letter-generator` skill): contracts use the letterhead, then a centred Montserrat title with a gold rule, BETWEEN/AND parties, auto-numbered clauses (1. / 1.1 / (a)), two-column signature blocks, initials boxes and "Page X of Y" on every page, and schedules on new pages. Template text marks what the user must fill in with `[square brackets]`. Show these blanks with an off-white background and a dark-gold dashed underline, and list the open ones in the panel. A DRAFT watermark uses dark gold at about 12% opacity. Templates are plain-English starting points, not legal advice, and the governing law stays editable.
14a. **Automatic document numbers and references:** build them from initials plus the date and time to the second, for example `EFIC-INVOICE-20261022-163239` (the invoice tool) or `KPLC-20261022-163239` (the letter tool: initials of the recipient company).
    - Fix the time stamp when the document is started, so the number doesn't change while the user types. **New** makes a new one, and Save/Load keeps the original.
    - Leaving the field empty means automatic, and the placeholder shows the automatic value. A typed value always wins.
    - For initials: strip accents and dots, then skip legal forms (Ltd, PLC, GmbH, AG, S.A.) and small words (and, of, the).
    - Fallbacks: one word gives its first 3 letters, a short all-capitals name stays whole, no company uses the person's initials, and with nothing at all use a fixed fallback (`LTR`).
    - Use the number in the PDF file name.
15. **Letters (DIN 5008)**: on A4 Form B the address field is 45 mm from the top, 20 mm from the left and 85 x 45 mm (text starts at 25 mm, with a 17.7 mm return-address zone above it). The info block sits at 125 mm from the left and 50 mm from the top. Body text starts at 98.46 mm, 25 mm from the left and 20 mm from the right. Fold marks are at 105/210 mm and the hole mark at 148.5 mm. Form A: 27/32/80.46 mm, with folds at 87/192 mm. Long paragraphs split by words, with at least 2 lines on each side of the break. German: "Herrn" in the address, and no comma after "Mit freundlichen Grüßen". English: "Yours sincerely" with a name, "Yours faithfully" with "Dear Sir or Madam". GiroCode (EPC069-12): drop trailing empty fields, leave the amount empty below 0.01 (never `EUR0.00`), put free text in the unstructured field, check the IBAN with mod-97, and use qrcode-generator in UTF-8 byte mode (qrcodejs adds a BOM that banking apps reject). Working example: `letter-generator/` in the repo, and the `efic-letter-generator` skill.
16. **Document types**: delivery notes, packing slips and bills of lading carry no prices, totals or bank details. Invoices need an editable document number and VAT/tax ID fields.
17. **Locale**: format dates and amounts with `toLocaleDateString`/`toLocaleString` for the chosen language, and translate every visible label.
18. **Accessibility**: collapsible heads are `<button aria-expanded>`, icon-only buttons get `aria-label`, Escape closes dialogs, keep pinch-zoom (no `maximum-scale`).

## 5. Theme-level lessons (eficc.blogspot.com)
Keep these in mind when touching the theme itself (`blogger-theme/` in the `emisembe/quote-script` repo builds it with `scripts/build.py`, audit `scripts/check.py`):
- One fixed menu bar: Layout logo gadget on the left, Layout LinkList menu on the right, see-through over the homepage hero until scroll; hamburger below 1180px with the lines centred (`.slicknav_no-text` adds a 15px top margin that pushes them down).
- Every section must stay visible and clickable in **Layout** (`body#layout`): no fixed heights, no `display:none` from responsive rules, plain backgrounds so section names are readable.
- Share bar on posts **and** pages (`data:blog.pageType in {"static_page","item"}`).
- Homepage detection also checks `data:blog.canonicalUrl` (Facebook `?fbclid=` links).
- **Languages:** the menu bar has a switcher for English, Kiswahili, Deutsch, Français and العربية. Google translation is loaded only on demand, with a `translate.goog` fallback. Arabic is right-to-left with the Cairo font. Company name, logo and contact details are `notranslate`. The switcher is a white-on-navy `<select>` with a gold globe and chevron. Recipe in `blogger-theme-builder` → `references/patterns.md`.
- **Office Contacts** (Layout section in the homepage contact area): one gadget per office, plain lines. They render as white cards with a gold left edge, navy icon discs with gold icons, navy bold links and a gold-underlined *Get directions*. The Head Office gadget (`HTML9`) holds the details that used to be hard-coded.
- **Slideshow (homepage, below the menu)**: Image gadgets give photo slides, YouTube links in HTML/Text gadgets give video slides. Brand treatment:
  - Captions have a navy gradient, a white Montserrat headline and a short gold bar.
  - The play button is a gold disc with a navy triangle. The active dot is gold. Arrows and pause are navy discs that turn gold with navy icons on hover.
  - With slides, the homepage menu bar is solid navy, not see-through, and the hero becomes a compact band. Keep its content above the navy tint (`.fenix-head { position: relative; z-index: 1 }`).
- **Areas of Expertise** has seven tiles (Technology added, `fa-microchip`). `.special-wrap` is a centred flex-wrap, so an incomplete last row is centred.
- **Message & Video** (homepage, under the expertise tiles): white section. The kicker is grey Montserrat in uppercase with a short gold bar before it (never gold text on white), the headline navy Montserrat 700. The card has a navy gradient over the photo or thumbnail, white text and a gold **Play video** button. The video opens in a navy pop-up.
- **Newsletter** (every page, above the footer): a navy `#14213D` band. White heading with a gold rule under it, a white email box, a gold Subscribe button with navy text, and a consent tick-box (gold `accent-color`). It ships emailing sign-ups to askeficc@gmail.com until the owner adds a Google Forms, Mailchimp, Brevo or MailerLite address.
- **Certifications & Memberships** (footer, between the social icons and the copyright): white logo tiles on deep navy, with gold-outlined text badges. It ships empty; never add certifications EFIC doesn't hold.
- **Menu bar** is solid `#14213D`. A semi-transparent bar let slide captions show through. The bar is up to 1400 px wide on big screens and switches itself to the hamburger whenever the Layout menu would wrap.
- **Tests:** `blogger-theme/tests/`: `full.js` (menus, hamburger, share links), `langtest.js` (switcher placement at 320-1920 px, translation, fallback, office cards) `slidetest.js` (slides, timing, video, swipe, reduced motion, empty section) and `featuretest.js` (Technology tile, message & video, newsletter services, certifications, clipping at 320-1920 px). Run them after `build.py` and `preview.py`; all must pass before a theme goes to the user.
- The theme's audit checks run on every build; a passing preview is not proof Blogger accepts it, so always tell the user the upload is the real test.

## 6. Verification checklist
Before handing anything over:
- [ ] `python3 scripts/brand_audit.py <file>`: no off-brand colours, no Alert Red, and no gold text or white-on-gold flagged.
- [ ] `python3 scripts/blogger_safe.py check <file>`: the file is ASCII-only (for Blogger pages and gadgets).
- [ ] JS syntax: extract each `<script>` and run `node --check`.
- [ ] Browser test (Playwright; Chromium is at `/opt/pw-browsers/` in cloud sessions) at 1440, 1024, 820, 390 and 320px: no JS errors, `scrollWidth == innerWidth`, inputs stay inside their panel. Test once inside a copy of a themed page and once on a bare page.
- [ ] Behaviour: whatever the tool does (live updates, the Update button, add/remove rows, save/load, language switch, automatic numbers, PDF download size, print view, share links with `&`/`#` in titles).
- [ ] Print quality: `pdffonts` shows embedded fonts in the print PDF, `pdfimages -list` shows every image at 300 ppi or more (test with a very wide uploaded logo), and the downloaded PDF is 300 dpi.
- [ ] Simulate Blogger's save (`blogger_safe.py check` does this) and re-run the browser test on the converted output.
- [ ] Look at the screenshots yourself, and send them to the user.
- [ ] Flag placeholder business data (addresses, bank details, phone numbers, currency) rather than inventing EFIC's real details. Ask for them.

## 7. Talking to the user
The user (Efic) works in Blogger's own menus. Give click paths using its names (**Pages → Edit → HTML view**, **Theme → Restore**, **Layout → gadget → Edit**). Explain any bug in one plain sentence: what broke, why, what changed. When they send a screenshot, check whether it's a Page (`/p/`) or a Post, and which version of a file is installed, before assuming the code is wrong.
