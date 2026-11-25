# AfroKauf Live – HTML overlays for XSplit Broadcaster (and TikTok LIVE Studio)

Lower thirds in the AfroKauf colours as single HTML files: see-through background, fonts and QR code
generator inside the file (works offline), adapts to 16:9 and 9:16.

| File (in `dist/`) | What it shows |
|---|---|
| AfroKauf Live - News Bar - desktop 16x9.html / mobile 9x16.html | Clay title block, headline strip, QR card, AfroKauf tab with running ticker |
| AfroKauf Live - Break screen - desktop 16x9.html / mobile 9x16.html | Starting soon / be right back / thanks: countdown, rotating adverts with QR codes, ticker |
| Transition (stinger) .webm / .mov (made by `stinger.py`) | AfroKauf colour wipe with logo; transition point 633 ms (16:9), 683 ms (9:16) |

**The full user guide is [GUIDE.md](GUIDE.md)** (also in Drive as a Google Doc). Short version below.

## How to use it in XSplit Broadcaster

1. Save the HTML file on your laptop, e.g. in `Documents\AfroKauf Live`.
2. **Change the text:** right-click the file › Open with › Notepad. Change only the text between the quotes in the
   block marked `EDIT HERE` (title, headline, QR link, ticker messages). Save with Ctrl+S.
   One file per guest: save a copy (e.g. `News Bar - Ada.html`) and change the headline.
3. **Add it to your scene:** in XSplit add a source › Webpage, and choose the file with Browse (local file).
4. **Size:** set the webpage size to 1920×1080 (or 1080×1920 for a vertical TikTok canvas) and make the
   source fill the whole canvas. Put it **above** your camera in the list of sources.
5. **Check the background:** you should see your camera everywhere except the bars.
   - If you see a white or black background: in the source's settings, add this custom CSS:
     `body { background: transparent !important; }`
   - If it is still not see-through: set `green_screen: true` in the file and use XSplit's colour key (chroma key) on the source.
6. **Show and hide:** give the source a hotkey in XSplit, or tick/untick it. When it appears it slides in.
   If it does not slide in again when you show it, right-click › Refresh, or turn on XSplit's option to refresh the
   webpage when the scene loads.
7. **After editing the file:** right-click the source in XSplit › Refresh.

Tip: double-click the file to see it in Chrome. Add `?test=1` to the address to see it on a brown background,
or `?layout=tall` for the phone version.

### Settings in the EDIT HERE block

| Setting | Meaning |
|---|---|
| `title` | The clay block on the left, e.g. `AFROKAUF LIVE`, `SHOP TALK` |
| `headline` | The main line. Long text gets smaller automatically (max. 2 lines) |
| `qr_link` | The web address the QR code opens. `""` hides the QR card |
| `qr_label` | Small text under the QR code, e.g. `SCAN ME`; `""` for none |
| `ticker` | The running messages, one per line |
| `ticker_speed` | 80–160 is good |
| `show_seconds` | `0` = stays until you hide it; e.g. `20` = slides out by itself after 20 s |
| `layout` | `"auto"`, `"wide"` (16:9) or `"tall"` (9:16) |
| `green_screen` | `true` only if your software cannot show the see-through background |

## TikTok

- **TikTok LIVE Studio** (TikTok's computer app): add a source › Link and use the overlay there with `layout: "tall"`.
  Some people report display problems with Link sources; then run the overlay in XSplit and bring XSplit into
  LIVE Studio as a camera (XSplit's virtual camera output).
- **Streaming from XSplit straight to TikTok** needs a TikTok stream key, which TikTok gives only to some accounts.
- The TikTok phone app cannot show overlays.

## For developers

`python3 build.py` builds `dist/` from `src/`; `python3 stinger.py OUTDIR` renders the transition videos (needs ffmpeg): it puts the Poppins fonts (SIL Open Font License, `fonts/OFL.txt`) and the
QR code generator (Kazuhiko Arase, MIT license, `vendor/qrcode-generator.js`) inside each file.
