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

## Design templates (Inkscape): sale posts, merchandise, press wall, video backgrounds
`design_templates.py` makes one Inkscape project per design (layers, locked background, hidden guide layer,
export DPI stored in the file), and `render_inkscape.py` exports them with Inkscape itself:
- **Sale posts** (live, editable text): square, portrait 4:5, story 9:16 (safe zones), landscape; filled examples
  (washing machine, fridge, tools, tractor with line drawings as photo stand-ins); "new arrivals" grid; shipment
  announcement. Documents are sized in inches with a px viewBox, so a **300 dpi export = 2x the platform size**
  (1080 -> 2160 px). The photo window is a hole in the locked background layer, with the photo layer underneath:
  the owner imports a photo, scales it, done (no clipping path).
- **Merchandise print files** (outlines, real size in mm, transparent, small margin): T-shirt chest 90 mm + back
  280 mm (dark/light), cap front symbol 55 mm / logo 100 mm for embroidery, work uniform chest/back/sleeve +
  one-colour version; placement preview sheets.
- **Events:** step-and-repeat press backdrop 300 x 200 cm + 2 cm bleed (light/dark, vector PDF), roll-up
  85 x 200 cm (bottom 10 cm in the stand, QR placeholder), video backgrounds 1920x1080 + 4K.
```bash
python3 -I design_templates.py FONTS_DIR OUT && python3 -I render_inkscape.py OUT/jobs.json
```
`social_profiles.py` (same arguments, writes `jobs-social.json`) adds one project per platform image, named by
platform: YouTube banner (2560x1440, all text in the centre 1546x423), profile picture 800, thumbnail 1280x720,
watermark 150; LinkedIn company cover 1128x191 + logo 400, personal background 1584x396 + personal photo with the
arrow ring; Facebook page cover 1640x924 (text in the centre 1640x624 band) + profile 720; TikTok profile 800 +
video cover 1080x1920 (title inside the 3:4 grid crop; TikTok and Instagram have no header image); Instagram
profile + 6 story highlight covers; X header 1500x500 + profile 400; WhatsApp Business profile 640. Headers get a
hidden "SAFE AREAS" layer and a rendered "SAFE AREAS check" PNG. Platform sizes change: search before reusing.

Needs **full** Oswald/Open Sans TTFs installed (`~/.local/share/fonts`, `fc-cache -f`): the Latin-subset files
from the Google Fonts CSS API render as blank text in Inkscape ("Invalid glyph found"). Full TTFs come from npm
(`npm pack @expo-google-fonts/oswald @expo-google-fonts/open-sans`, with the OFL licence). `apt-get install inkscape`
works in cloud sessions. Check after export: alpha bounding box of print PNGs must not touch the edge; `pdffonts`
shows 0 fonts and `pdfimages -list` 0 images for print PDFs; test the photo window by inserting an oversized image.

## Intro and outro videos (2D animation, 4K, desktop 16:9 and mobile 9:16)
`video/`: the animation is SVG drawn by JavaScript as a pure function of time (`window.renderFrame(t)`), so every
frame is exact. `render.js` opens the page in Playwright at deviceScaleFactor 2 (3840x2160 or 2160x3840), screenshots
each frame as JPEG and pipes it into ffmpeg (H.264 High, CRF 16, 60 fps; about 0.25 s per 4K frame on 4 cores).
`sound.py` makes the sound logo with numpy only (filtered-noise whooshes, low thump, bell partials, soft chord,
simple reverb; peak -1 dBFS), so there is no music licence. `package.py` makes one folder per video with 4K,
4K silent, HD and a still image.
- Intro (6 s): the arrow ring draws itself big in the centre while spinning, flies into the O, letters rise one by
  one, tagline opens up with an orange line, a light sheen crosses the letters, fade.
- Outro (12 s): logo, "Thanks for watching", website / WhatsApp / social handles with icons, Subscribe (desktop) or
  Follow (mobile) button; desktop has two "Watch next" frames for YouTube end-screen elements (5–20 s allowed);
  mobile keeps everything above the bottom caption area of TikTok/Reels.
- Texts live in `CONFIG` at the top of intro.html / outro.html. `logo.js` comes from `make_logo_js.py`
  (wordmark + symbol masters + icons from shop.js). Copy Oswald/Open Sans TTFs into `video/fonts/`.
```bash
python3 make_logo_js.py masters ../../shop/shop.js logo.js
node preview.js intro.html desktop "0.8,2.0,3.0,5.0" prev/in      # check stills first
python3 sound.py intro intro.wav && node render.js intro.html desktop intro-desktop-4k.mp4 intro.wav 60
```

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
- Inkscape needs full font files (subset web fonts render blank); print files use outlines so the shop needs no fonts.
- Real reviews only in any "customer review" template; placeholders must be clearly fake.
