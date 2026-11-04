# Murdock Emisembe Foundation: Blogger theme

A rebuild of the foundation's Blogger theme (www.murdockemisembefoundation.org).
It replaces the old "Areda" template: no jQuery, no Bootstrap, and no demo
leftovers. Every gadget the foundation already had keeps its ID and pictures.

**File to upload:** `theme-murdockemisembefoundation.xml` (a copy of `theme.xml`).

## Install (about 5 minutes)

1. **Back up first.** Blogger → **Theme** → ▾ next to *Customise* → **Backup** → *Download*.
2. **Theme** → ▾ → **Restore** → **Upload** → choose `theme-murdockemisembefoundation.xml`.
   - If Blogger only says *"Could not restore theme"*: **Theme** → ▾ → **Edit HTML**,
     select everything, paste the whole file, **Save**. That screen names the exact problem.
   - Still failing? Copy the exact message from Edit HTML (or a screenshot) and send it.
     The upload page never says why; Edit HTML does.
3. **Theme** → ▾ → **Mobile settings** → choose **Desktop**, so phones get this
   responsive theme instead of Blogger's basic mobile theme.
4. Live check (2 minutes): homepage, one post, a label page, search, a missing page
   (`/nope`), the phone menu, and a test comment.

## What to fill in after installing (Theme → Layout)

| Where | Gadget | What to add |
|---|---|---|
| Header | **HTML29** (Donate button) | A real donation link (M-Pesa Paybill page, PayPal, bank details page). It points to the *Get involved* section for now. |
| Get involved | **HTML14** | The same donation link on the *Donate* button. |
| Footer | **Social Footer** | Facebook, X and Instagram addresses. Icons left as `#` stay hidden until a real link is added. |
| Team | **Murdock Emisembe / Onesmas Gathuku / Jayne Kabosa** | Personal social links (hidden while `#`). Check Jayne's bio. |
| Who we are | **HTML25** | Review the mission text (written from the site's own programme list). |
| Projects | **Item 1 to 6** | Rename the titles to the project names. They are used as the photo descriptions. |

## Languages

Visitors can read the site in **English, Kiswahili, Français, Arabic and Deutsch**
(globe button in the header, language row in the footer). The buttons drive Google
Translate (gadget *Translate1*), so translations are automatic and the choice follows
the visitor from page to page. Arabic turns the layout right-to-left. To change the
languages, edit the buttons in `src/theme.xml` and `includedLanguages` in
`src/includables/translate-main.xml`. Full guide: *MEF Website Guide: Setup and Posting*.

## What changed

- **Fixed broken things:** the *Donate* button went to a ThemeForest sales page;
  *Contact* in the menu went to `/404`; the *Sponsor Links* and *Quick Links*
  gadgets pointed at ThemeForest or `!`; project photos opened the template's demo
  images; the Instagram feed used a dead API; post labels were in Greek
  ("σχόλια", "Αναρτήθηκε από"); lorem-ipsum text and a Google+ icon remained.
- **Faster and safer:** removed jQuery 2, Bootstrap 3, 10+ plugins, `document.write`
  feed scripts, an `http://` script and the Blogger navbar loader. Pinch-zoom works again.
- **New homepage:** hero slider (your 5 slides), *Who we are* with your mission video,
  *What we do* cards, project gallery with a lightbox, a *Get involved* band,
  latest stories, team, partners, and a contact section with form, WhatsApp and map.
- **Story pages:** clean article layout, share buttons (Facebook, WhatsApp,
  LinkedIn, X, copy link), *More stories like this*, a *Get involved* call-out,
  Blogger comments unchanged.
- **Homepage sections now also appear for visitors who arrive from Facebook or
  WhatsApp links** (`?fbclid=`, `?m=1`); the old theme hid them.
- Colours stay the foundation's blue `#145474` and green `#87BA45`. You can change
  them in **Theme → Customise → Advanced**.

## For developers

Edit `src/`, never `theme.xml` directly.

```bash
python3 scripts/build.py           # src/ → theme.xml
python3 scripts/check.py           # audit against reference/proven.json (from the original backup)
python3 scripts/render_preview.py  # theme.xml → preview/*.html with sample posts
```

Browser checks (overflow, JS errors, menu, slider, lightbox, mobile centring, one h1 per page):

```bash
cd preview && python3 -m http.server 8765
```

```bash
node scripts/preview_test.js http://127.0.0.1:8765 shots
```

`preview_test.js` needs Playwright; Font Awesome for the preview goes in
`preview/vendor/font-awesome` (`npm pack font-awesome@4.7.0`).
