# Brand kit generator (logo project + brand kit, one folder per design)

Built for the shop "Kreislo" (wordmark KREISL◯ with an orange arrow ring as the last O, tagline
"Keep good things moving"). Reuse it for another brand by changing the name, ring position, tagline and
template texts. Everything is drawn in code, so a change is a re-run, not a redesign.

## What it makes
- **Logo Project**, one folder per design, each with `PROJECT (editable).svg` (letters as outlines, no fonts
  needed), PNGs in several sizes, `PRINT.pdf` (vector) and a READ ME saying what it is for:
  A) by use: website header logo, favicon (+ .ico), phone icon, email signature logo, letterhead logo, social
  profile pictures, business card logo, product photo watermark (also 50 % see-through), one-colour stamp,
  logo on photos; B) every version × colourway: primary, wordmark, stacked, symbol × colour on light / on
  dark / black / white, plus app icons; C) the source scripts.
- **Brand Kit**: 10-page brand guidelines PDF (idea, logo versions, clear space, colour versions, colours
  with HEX/RGB/CMYK/Pantone, typography, don'ts, in use, which file for what); colours as .ase (Adobe),
  .gpl (Inkscape/GIMP), CSS, JSON, swatch PNG; font download notes; templates, each with an editable SVG
  plus PNG or print PDF with bleed: Instagram post ×2, story, website share image, business card front/back,
  60 mm parcel sticker, A6 thank-you card, A4 letterhead (+ Word .docx), email signature (HTML).
- `downloads/`: both packages as zips plus **one zip per design**, so the owner can save designs one by one.

## Run
```bash
mkdir -p ROOT/src && cp *.py *.js ROOT/src/ && cd ROOT
sh /path/to/fetch_fonts.sh                       # → ROOT/fonts/*.ttf (Latin subsets)
pip install fonttools python-docx                # Pillow and Playwright are usually present
python3 -I src/build_all.py .                    # SVG masters, folders, render jobs
node src/render_all.js jobs.json                 # PNG + PDF via Chromium (fonts from Google Fonts)
python3 -I src/finish.py "$PWD"                  # favicon.ico, watermark, Word letterhead, guidelines, zips
```
Output: `ROOT/final/` (folders) and `ROOT/downloads/` (zips).

## Change it for another brand
- `kreislo.py`: `NAME` (the word), `RING_AT` (which letter becomes the arrow ring; must be an O or round
  letter), `CAP`, `TRACK`, `WORD_RING_SW`, `RING_GAP`, `RING_HEAD`, colours, and the default `tagline` text.
  The symbol uses the first letter of the name inside the ring (change `'K'` in `symbol()`).
- `build_all.py`: folder names, READ ME texts, template texts (posts, sticker, card, letterhead, signature),
  colours and contact placeholders. `guidelines.py`: the brand story, voice, taglines in other languages.
- File prefixes (`kreislo-…`, `Kreislo - …`) are plain strings: search and replace them.
- Check spacing by eye after a name change: the gap before the ring depends on the letter before it
  (the L needed a tighter left side bearing: see `lsb` in `wordmark()`).

## Lessons
- **Search the name before proposing it** (web search for the exact word, company registers, trademark
  databases DPMA/TMview, domains, social handles). A beautiful logo for a taken name is wasted work.
- A circle in a condensed typeface must be spaced by hand; an evenly stroked oval looks clumsy.
- Doc and artifact tools cap one write at 32 KB: split long code into Part 1 / Part 2.
- Keep print PDFs vector (Chromium `page.pdf` of the SVG); check page size in mm and that there are no
  raster images inside.
- Real reviews only in any "customer review" template; placeholders must be clearly fake.
