---
name: efic-letter-generator
description: "Generate, customise, fix or extend the EFIC Letter Generator: a single-file Blogger page (eficc.blogspot.com) that writes business letters (DIN 5008) and contracts (numbered clauses, parties, signature blocks, editable governing law) on EFIC letterhead on real A4 pages. It has 10 letter and 7 contract templates (consultancy, NDA, employment, supply, partnership, MoU), highlighted [blanks], an automatic reference, an Update button, 5 languages, print, 300 dpi PDF, save/load and a SEPA GiroCode. Use it whenever the user wants the letter tool again, a changed version (defaults, bank details, a new template or clause, another language, a new field), a bug fixed, or a new EFIC letter or contract tool, even if they just say 'my letter page', 'the letter tool', 'contract templates' or paste its HTML."
---

# EFIC Letter Generator

The tested, working page is bundled as `assets/efic-letter-generator.html`. Always start from it: it encodes many fixes (Blogger character handling, print, pagination, DIN geometry, GiroCode) that are easy to lose in a rewrite. Copy it into the user's project, change only what the request needs, then verify it.

If the user pastes a version of the page, compare it with the bundled one first (`diff`): theirs may contain their real details or newer edits, and those win. Merge your change into their copy.

## Workflow

1. **Copy** `assets/efic-letter-generator.html` to the working folder (for the EFIC repo: `letter-generator/efic-letter-generator.html`), unless the user supplied their own copy.
2. **Find the spot** with `references/code-map.md`. It lists every section of the file and the exact places to touch for the common requests (defaults, a new language, reference format, a new field, colours).
3. **Edit** following the rules below.
4. **Make it Blogger-safe:** run `python3 scripts/blogger_safe.py fix FILE`, then `check FILE`. Some writing tools turn a typed `é` into a real `é`, so run this after every edit, not just once.
5. **Check the JS syntax:** extract the inline `<script>` and run `node --check`.
6. **Run the browser tests:** `bash scripts/setup_test_env.sh WORKDIR` once, then `node scripts/test_letter.js FILE WORKDIR`. They cover full page in a themed page and a bare page, 5 screen widths, DIN positions, pagination, languages, references, the Update button, GiroCode, save/load, print and PDF. Add a check for whatever you changed. Look at the screenshots the test writes (`WORKDIR/shots/`) yourself.
7. **Deliver:** send the file and a screenshot. Tell the user, in plain words, how to install it: **Blogger → Pages → (the page) → Edit → HTML view → replace everything → Update**. Then list any placeholder details they still need to fill in (bank details, phone).

## Rules (each one comes from a real bug)

- **ASCII only.** Blogger's page editor rewrites non-ASCII characters as `&#NNN;` on save. HTML decodes those again, but `<script>` and `<style>` don't, so German, French and Chinese text and symbols like `×` broke. Use `\uXXXX` in JS, `\XXXXXX` in CSS and `&#NNN;` in HTML; `blogger_safe.py fix` does this for you. Don't write `<script>` or `<style>` inside an HTML comment (older fixers treated it as a real tag).
- **Everything is scoped under `#ldg-app`**, and every CSS rule starts with it, so nothing leaks into the theme. The first `<style>` block hides the theme around the tool on this page only: menu, header, sidebar, page title, share bar, comments, footer and `#main > .widget:not(.Blog)`. Keep that block when you edit, because the user wants the tool to fill the whole page. `fullPage()` (just before `Start`) also hides every sibling of the tool at each level of the page on start and on `load`, so theme sections added later can't appear around it. It keeps Blogger's cookie notice (anything with `cookie` in its id or class). The test suite's mock theme includes a newsletter band, a made-up future section and a cookie notice.
- **Typed text goes in with `textContent`/`el()`, never `innerHTML`.** People type `&` and `<`, and `innerHTML` would also let typed code run.
- **Keep `#ldg-app [hidden] { display: none !important; }`.** Button classes set `display:inline-flex`, which beats the `hidden` attribute, so hidden "Remove" buttons showed up.
- **One page model for everything.** `render()` builds real A4 sheets (`.ldg-sheet`, 210 x 297 mm), and the preview, Print and PDF all use them. Never slice a screenshot into pages. New content has to go through `block()` (moves whole to the next page) or `paragraph()` (splits between words, at least 2 lines on each side), or it will overflow into the footer.
- **Print** moves `#ldg-app` to `<body>` on `beforeprint` and back on `afterprint`. Print CSS needs `!important`, because inline heights set by `fitLayout()` would otherwise cut printing to page 1.
- **PDF:** html2canvas at `scale: 3.125` (300 dpi) per sheet, JPEG, jsPDF A4. Await `document.fonts.ready` first.
- **Live preview plus Update button.** Inputs inside `#ldgPanel` trigger `schedule()` (150 ms). The Update button calls `update()` immediately and shows "Updated" for 1.5 s. A new field inside the panel updates on its own; a control outside it needs its own listener.
- **Every visible word is translated.** Add it to `UI` (panel) or `W` (letter) for all five languages, and use `data-t` / `data-tp` in the markup.
- **Saved data:** add new letter fields to `LETTER_FIELDS` and letterhead fields to `HEAD_FIELDS`, or Save/Load and "remember my letterhead" will silently drop them.
- **Brand:** Navy `#14213D`, Gold `#E7B165`, Deep Navy `#0F1A30`, Off-White `#F7F6F2`, Grey `#4A5568`. Never put gold text on white, white text on gold, or Alert Red anywhere. Montserrat for headings and UI, Calibri/Arial for the letter. For anything wider than this page, use the `efic-brand-web` skill.
- **Don't invent EFIC's real details** (bank account, phone, address). Leave the placeholders and ask for them.
- **Templates and contracts:**
  - Templates live in `TPL` (English text, `mode: 'letter' | 'contract'`) and are listed per mode in `TPL_ORDER`. Their names are UI keys `t_<id>` in all five languages.
  - Use `[square brackets]` for anything the user must fill in: `tokens()` marks them, they are highlighted, and the panel counts the open blanks. Use `{org}`, `{company}`, `{party1}`, `{party2}`, `{role1}`, `{role2}`, `{law}`, `{courts}` or `{date}` for values the tool knows (`fill()`). Never hard-code EFIC's name in template text; use `{org}`.
  - `applyTemplate()` asks before replacing text the user edited (`edited()`). Keep that.
- **Contract text is not legal advice.** Keep templates plain-English and standard, keep the governing law editable (default *the laws of Kenya* / *Kenya*), and tell the user to have a lawyer review a template once before relying on it.

Letter conventions (DIN 5008 measurements, greetings and closings, GiroCode, the reference format) are in `references/letter-rules.md`. Read it before changing anything that prints on the letter.

## Variants
For a related tool (memo, offer letter, cover letter, reminder/dunning letter), copy the page and rename the wrapper id and storage keys (`#ldg-app`, `ldgLetters`, `ldgLetterhead`, the `ldg` CSS prefix and `window.ldg*` functions). Two tools on one blog then won't overwrite each other's saved letters, and two pages can't clash if they're ever combined. Keep the engine (`render`, `block`, `paragraph`, print, PDF) as it is, and change the wording, fields and defaults.
