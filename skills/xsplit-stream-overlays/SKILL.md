---
name: xsplit-stream-overlays
description: Build branded live-stream graphics as single offline HTML files for XSplit (Webpage source), OBS (Browser source) or TikTok LIVE Studio (Link source): a TV-news lower third with title, headline, scannable QR code and running ticker; break screens (starting soon, be right back / commercial break with rotating adverts and QR codes, thanks for watching, with countdown); a stinger transition video with alpha; the same transition for Camtasia; and a plain-English streaming guide. See-through background, 16:9 and 9:16, edited in Notepad. Use when the user mentions XSplit, OBS, stream overlays, lower thirds for a live, a ticker, a QR code on stream, a break or starting-soon screen, commercial breaks, stinger transitions, TikTok LIVE overlays, or wants the AfroKauf live overlays for another brand.
---

# Stream overlays for XSplit / OBS / TikTok LIVE Studio (+ transitions for Camtasia)

Proven in XSplit Broadcaster 4.6 on Windows: a local HTML file added as a Webpage source shows a
see-through background over the camera (no extra CSS needed). Reference build: the AfroKauf set in `assets/`.

## What you deliver (per brand)

| File | What it is |
|---|---|
| `<Brand> Live - News Bar - desktop 16x9.html` / `- mobile 9x16.html` | Lower third: title block, headline strip (auto-fits, max 2 lines), QR card with "SCAN ME", tab with logo + running ticker |
| `<Brand> Live - Break screen - desktop 16x9.html` / `- mobile 9x16.html` | Full screen: logo + LIVE badge, heading, countdown, rotating "ADVERT" cards each with its own QR code, ticker |
| `<Brand> Live - Transition (stinger) - desktop 16x9 / mobile 9x16 .webm + .mov` | 1.2 s colour sweep with the logo while the screen is covered (60 fps), cut point printed |
| `<Brand> - Transition - sweep left/right - desktop/mobile .mov + (magenta key).mp4` | Same sweep for Camtasia / video editors (30 fps), both directions |
| Streaming guide (Google Doc) | From `assets/GUIDE-template.md`, adapted to the brand |
| Camtasia how-to (Google Doc) | From `assets/TRANSITIONS-camtasia-template.md` |

## Workflow

1. **Collect the brand:** 5–7 colours (dark panel, accent, alert/title colour, light strip colour, text), the wordmark
   (two-part names look best: first part light, second part accent), a font (OFL/free licence – it gets embedded),
   the default links for QR codes, 3–6 ticker messages, the show name. Never invent the user's links or handles; use what they gave.
2. **Copy `assets/` into the project** (e.g. `<brand>-live/`). Change the brand in:
   - `src/news-bar.html` and `src/break.html`: the `:root` colour tokens, the `<b>Afro</b><b>Kauf</b>` wordmark parts (tab and break-screen logo),
     the default texts in the `SETTINGS` block (title, headline, qr_link, ticker, promos, heading…).
   - `fonts/`: put the brand font files (SemiBold 600 + ExtraBold/Bold 800) and keep the licence file.
   - `stinger.py`: the brand block at the top (PANEL, LEAD, TRAIL, WORDMARK, STRIPE, FONT).
   - `build.py`: `FILES` (output names; one desktop and one mobile file per source via the `layout` replacement).
3. **Build:** `python3 build.py` → `dist/*.html` (fonts as base64 + QR library inlined; ~0.5 MB each).
   `python3 stinger.py OUT` (XSplit/OBS set) and `python3 stinger.py OUT --camtasia` (editor set). Needs ffmpeg with libvpx-vp9 and qtrle.
4. **Test (always):** `npm i jsqr` in a scratch folder, then `node assets/tests/test_overlays.js dist OUTDIR`.
   It checks JS errors, parts off-screen, clipped text, see-through background, ticker moving, and decodes every QR code.
   Look at the screenshots yourself (long headline, no-QR variant, tall layout). For the stinger, decode frames back
   (`ffmpeg -c:v libvpx-vp9 -i x.webm … -pix_fmt rgba`) and check that early frames have transparent pixels and the middle frames are fully covered.
5. **Make previews:** Playwright screenshots with `?test=1` (brown backdrop) and GIFs (PIL) of the slide-in and of the
   stinger composited between two scene screenshots.
6. **Deliver:** one clearly named folder (e.g. Drive "Live streaming (XSplit and TikTok)"). Upload HTML, GIF, PNG, video
   with `disableConversionToGoogleType: true` (otherwise Drive turns them into Google Docs); upload the guide as
   `text/markdown` so it becomes a Google Doc. Before replacing a Drive file, check it was not modified since your upload.
7. **Ask the user for the 2-minute test** in their software and a screenshot, before building more variants.

## Design rules that made it work

- **Stage scaling:** draw everything on a fixed 1920×1080 (wide) or 1080×1920 (tall) stage of absolutely positioned
  parts and scale it with `transform: scale()` to the window. Same geometry at every canvas size; `layout: "auto"`
  picks wide/tall from the window shape; the built files force one.
- **See-through:** `html, body { background: transparent }` on lower thirds. Fallbacks for the user: XSplit source
  custom CSS `body { background: transparent !important; }`, or `green_screen: true` + colour key.
- **Editable without code:** a `SETTINGS` object in a `<script>` at the very top, inside an "EDIT HERE" comment,
  with one comment per line in plain words. Users copy the file per guest and change the headline in Notepad.
  URL parameters override settings (`?headline=…&layout=tall&test=1`) for previews.
- **Fonts first, then measure:** call `document.fonts.load('600 40px "X"')` and `('800 …')` before building/fitting;
  `document.fonts.ready` resolves too early when nothing uses the font yet → long headlines overflow.
- **Auto-fit text:** reduce font size in 2 px steps until the text fits its box and line limit.
- **Ticker:** two copies of the messages back to back, `requestAnimationFrame`, `translateX(-(t·speed) mod half)`;
  repeat the list until one copy is wider than the window. Brand-coloured vertical bars as separators.
- **QR code:** `vendor/qrcode-generator.js` (Kazuhiko Arase, MIT) inlined; UTF-8 bytes, error level M, 2-module
  quiet zone, `image-rendering: pixelated`, dark brand colour on white, inside a coloured frame with "SCAN ME".
  Make the QR card stick out above the bar (bigger = scans from a TV/laptop screen).
- **Entry animation:** parts slide in from the left with staggered delays; replays on `visibilitychange`;
  optional `show_seconds` auto-hide. Break screen: countdown from page load (refresh restarts it), adverts rotate
  with a progress bar and dots.
- **Vertical/TikTok safe zone:** keep content out of the bottom ~15 % and the right edge (TikTok buttons, comments).
- **Stinger:** bands as slanted polygons in a "train" (lead bands, long panel, trail bands) moving with a curve that is
  fast at the ends and slow in the middle; panel long enough to cover the screen ≥ 0.45 s; logo fades in only while
  covered; cut point = middle of the covered frames (≈ 633 ms at 16:9, 683–700 ms at 9:16). WebM needs
  `-pix_fmt yuva420p -auto-alt-ref 0 -metadata:s:v:0 alpha_mode=1`; MOV `-c:v qtrle -pix_fmt argb` (small for flat colours).
  For editors without alpha support: MP4 on magenta (#FF00FF – far from typical brand colours) + "Remove a Color".

## Facts for the guide (check dates; platforms change)

- **XSplit:** Add Source › Webpage › Browse (local file). Source above the camera. Right-click › Refresh after edits.
  Transition box at the bottom right ("Cut: 0ms") › stinger, transition point in ms; fallback Fade 300 ms.
  Hotkeys under Tools › Settings › Hotkeys. Canvas: 1280×720 30 fps for normal laptops, 1920×1080 30 fps for strong ones;
  a talk show does not need 60 fps. Soft picture = camera/light, not the HTML (it is vector text).
- **TikTok (researched Nov 2026):** a stream key for outside software is given by TikTok only to some accounts
  (reports: ~1,000 followers; since July 2025 ≥ 50 % gaming content to keep third-party access). Without a key:
  TikTok LIVE Studio with a Link source (some users report display bugs) or the streaming app as a virtual camera.
  The phone app cannot show overlays.
- **Camtasia:** import the .mov, put it on the track above the cut, starting at the cut point before the cut
  (30 fps: 19 frames for 633 ms); project size must match; fallback magenta MP4 + Visual Effects › Remove a Color.
- Per-scenario plans (solo, studio interview, remote guest via call window capture + system sound + headphones,
  shop tour with phone camera, seminar with screen capture, TikTok vertical presentation, record-only) are in `GUIDE-template.md`.

## Environment lessons

- Sandboxes may block `pip install` and CDN loads in the browser: embed libraries; `npm i` in a scratch folder worked for `jsqr`.
- Keep files self-contained (no network at show time).
- Name every file `<Brand> Live - <What> - <desktop 16x9|mobile 9x16>.<ext>` so the user never mixes them up.
