# Code map: efic-letter-generator.html

One file, in this order. Find sections with `grep -n "/\* --\|// --"`; line numbers drift, but the section comments don't.

## 1. Header comment
Install instructions for Blogger. Keep it free of `<script>`/`<style>` mentions.

## 2. `<style>` (all rules prefixed `#ldg-app`, except the first block)
| Section comment | What it does |
|---|---|
| `FULL PAGE: hide the theme around this tool` | Hides the EFIC theme's chrome on this page and zeroes wrapper padding. Theme selectors: `#header-wrapper, #jugas_footer, .tm-menu, .scroll-header, #sidebar-wrapper, .foot-bar-social, .Attribution, .feed-links, #blog-pager, .slicknav_menu, .post-header, .post-head, h1.post-title, .post-footer, .share-box, #related-posts, .comments, #comments, .insta-wrap, #main > .widget:not(.Blog)` |
| `APP SHELL` | Top bar, panel sections (`.ldg-section`, `.ldg-head` buttons, `.ldg-body`), form fields (`.fg`), buttons (`.ldg-btn` + `-ghost`/`-gold`/`-navy`/`-outline`/`-small`/`-add`), saved list, modal, `[hidden]` rule |
| `A4 LETTER PAGES` | `.ldg-sheet` and everything printed: `.lt-band`, `.lt-head`, `.lt-rule`, `.lt-address` (`.lt-zusatz`/`.lt-return`, `.lt-anschrift`), `.lt-info`, `.lt-flow`, `.lt-subject`, `.lt-signoff`, `.lt-extra`, `.lt-footer` (`.lt-pageno`, `.lt-cols`, `.lt-qr`), `.lt-cont`, `.lt-strip`, `.lt-mark` |
| `PRINT` | `@page { size: A4; margin: 0 }`, only the sheets print, under `html.ldg-printing` |
| `RESPONSIVE` | Below 980 px the panel and preview stack. Below 600 px the buttons wrap and rows become one column. |

## 3. Markup `<div id="ldg-app">`
- **Top bar:** `#lang` select, then the buttons, which call global functions: Update `ldgUpdateNow()` (`#ldgUpdateBtn`), `ldgNew()`, `ldgSave()`, `ldgToggleSaved()` (`#ldgLoadBtn`), `ldgPrint()`, `ldgPdf()`.
- **`#ldgSaved`:** the saved-letters list.
- **`#ldgPanel`:** the sections, in order:
  - **Letter Settings:** `layout` (B/A), `fold`, `strip`.
  - **Letterhead:** `orgName`, `tagline`, `logoFile`/`logoUrl`, `returnAddr`, `orgPhone`, `orgFax`, `orgEmail`, `orgWeb`, `orgContact`, `orgRoom`, `remember`.
  - **Recipient:** `recCompany`, `recTitle` (mr/ms/mrs), `recAcad`, `recFirst`, `recLast`, `recDept`, `recStreet`, `recZip`, `recCity`, `recCountry`, `#addrWarn`.
  - **Letter:** `yourRef`, `ourRef` (empty means automatic, and the placeholder shows the automatic value), `docDate`, `subject`, `greeting`, `body`, `closing`, `encl`, `cc`.
  - **Signature:** `sigName`, `sigTitle`, `sigPlace`, `sigFile`.
  - **Footer Columns:** `#fcols` and `#addCol` (at most 4).
  - **Payment QR Code:** `qrOn`, `qrIban`, `qrBic`, `qrAmt`, `qrRef`, `#ibanWarn`.
- **`.ldg-preview`:** `#ldgPageCount`, `#ldgPrevRef`, `#ldgPagesWrap > #ldgPages` (the sheets).
- **`#ldgModal`:** the PDF progress and result dialog.

Every label has `data-t="key"` (text) or `data-tp="key"` (placeholder), filled from `UI[lang]`.

## 4. Scripts
- Three CDN scripts (cdnjs): html2canvas 1.4.1, jspdf 2.5.1, qrcode-generator 1.4.4. There's also a jsdelivr fallback for qrcode at the end.
- One inline IIFE:

| Section comment | Contents |
|---|---|
| `Interface text` | `UI = {en, de, fr, sw, zh}`: panel and button words |
| `Letter wording` | `W = {...}`: info-block labels, `encl`, `cc`, `pageOf` ("Page {x} of {y}"), `qr`, `locale` (date format), and the sample `subject`/`body` |
| (after W) | `ADDRESS[lang](t, acad, first, last)`, `GREETING[lang](...)`, `CLOSING[lang](named, greeting)` |
| constants | `FORM.B`/`FORM.A` geometry in mm, `HOLE`, `PX_PER_MM`, `PDF_SCALE`, storage keys, `HEAD_FIELDS`, `LETTER_FIELDS`, state (`lang`, `logo`, `sigImg`, `timer`, `refStamp`, `qrCache`) |
| helpers | `$`, `val`, `txt`, `setVal`, `el(tag, cls, text)` (safe text), `u(key)` (UI word), `w(key)` (letter word), `lines`, `fmtDate` |
| `Interface language` | `applyUI()`, `setLang(l, keepText)`. Sample subject and body text follow the language unless the user has edited them (`isTemplate`). |
| `Sections`, `Images`, `Footer columns` | Collapsing, `readImage` (logo downscaled to 1000 px, signature to 800 px: still 350+ ppi on paper), `addCol`/`refreshAddCol`/`getCols` |
| `Our reference` | `stamp(date)`, `SKIP_WORDS`, `initials(name)`, `autoRef()`, `ourRef()` |
| `GiroCode` | `ibanOk`, `epcPayload`, `qrImage` (cached) |
| `Letter content` | `recipient`, `addressLines`, `greetingText`, `closingText`, `returnText`, `tokens`/`paraFrom` |
| `Pages` | `render()`: `newSheet()` (band, marks, letterhead, address, info, footer, flow), `fits()`, `block()`, `paragraph()`, then the order subject, greeting, paragraphs, sign-off, enclosures, cc, then page numbers. `fitPreview()` scales sheets to the preview width. |
| `Save / load` | `store`/`read` (localStorage, guarded by try/catch), `letterhead()`, `applyHead()`, `saveHead()`, `ldgSave`, `renderSaved`, `load` (restores `refStamp`), `ldgToggleSaved`, `ldgNew` (new `refStamp`) |
| `Print` | `enterPrint`/`exitPrint`, `ldgPrint` |
| `PDF` | `modal`, `fileName()` (reference + company), `ldgPdf` |
| `Live update` | `ldgUpdateNow`, `update()` (render + save letterhead), `schedule()`, listeners, `fitLayout()` |
| `Start` | Loads the saved letterhead, or adds 3 default footer columns. Then the sample text, the first render, and a re-render after fonts load. |

## Recipes

**Change defaults** (company name, tagline, email, sample recipient): edit the `value="..."` attributes in the markup. For the default footer columns, edit the `addCol(...)` calls under `Start`. Remember that a visitor's saved letterhead overrides the defaults on their device.

**Add a language** (for example `es`): add an `<option>` to `#lang`, then `UI.es`, `W.es` (including `locale: 'es-ES'`), `ADDRESS.es`, `GREETING.es` and `CLOSING.es`. Check that every key in `UI.en` exists in the new one. In `W.es.pageOf`, keep the `{x}` and `{y}` placeholders.

**Change the reference format:** edit `autoRef()` (the shape) or `initials()`/`SKIP_WORDS` (how initials are made). Keep `refStamp` set when the letter starts (`ldgNew`, and at start-up) and saved with the letter, so the reference doesn't change while the user types.

**Add a letter field:**
1. Add the markup inside a panel section, with a `data-t` label, and add the `UI` words in all five languages.
2. Add the field to `LETTER_FIELDS` (or to `HEAD_FIELDS` if it belongs to the letterhead).
3. Draw it in `render()` with `el()`, using `block()` if it's below the address.

**Change the sign-off:** edit the `.lt-signoff` construction in `render()`. If there's no signature image, a 15 mm `.lt-sigspace` leaves room for a handwritten signature.

**Colours:** only use the brand tokens. Check with the `efic-brand-web` skill's `brand_audit.py`, if it's available.
