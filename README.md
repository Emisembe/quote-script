# quote-script

This repo has two unrelated tools in it:

- `quote.js` — a price-quote calculator, the original purpose of this repo. Not used by the teleprompter.
- `teleprompter.html` (+ `teleprompter.css`, `teleprompter.js`) — the teleprompter app, described below. All three files must stay in the same folder — the HTML file loads the other two by relative filename. `teleprompter.html` is the only file you open.

`manifest.webmanifest`, `icon-180.png`, `icon-512.png`, and `sw.js` support installing the teleprompter to a phone's home screen and let it run offline (see below) — they're only used by the teleprompter, you can ignore them otherwise.

## Teleprompter

`teleprompter.html` is a self-contained teleprompter. Open it directly in a browser (desktop or mobile) — no build step, no account, no server required for the core features.

- **Load a script**: paste text in, or upload a `.txt` file. Save scripts to a local library (stored in the browser, per device) for reuse. Whatever you're typing is also auto-saved as a draft, so an accidental refresh won't lose it.
- **Font size & scroll speed**: adjustable live via sliders, both before starting and while it's running — the current value (px / speed / opacity %) is shown next to each slider as you drag it.
- **3-2-1 countdown**: optional, on by default, before the first play so you and the camera operator have a beat to get ready. Only fires once per session — pausing and resuming skips it.
- **Progress bar & time readout**: top of the screen, shows how far through the script you are and elapsed/estimated-remaining time at the current speed. Playback auto-stops at the end instead of scrolling into blank space.
- **Paragraph jump**: "Prev ¶ / Next ¶" buttons jump to the start of the previous/next blank-line-separated section — useful for skipping to a spot after a flubbed take.
- **Eye-line guide**: the "Guide" button shows a labeled line ("Look here — eye line") with markers at both ends, marking where your eyes (and ideally the camera lens) should be, plus a subtle fade on text above/below it so the current line stands out.
- **See-through / transparent background**: an opacity slider controls a scrim over the display, with black or green-screen presets. At 0% opacity with the camera off and the page embedded as a transparent source (e.g. an OBS Browser Source), the background is fully transparent. Turning on the camera toggle instead shows your device's live camera feed behind the scrolling text, so you can read while keeping an eye on your framing.
- **Mirror mode**: cycles through off / horizontal / vertical / both, for use with physical teleprompter beamsplitter-glass rigs.
- **Mobile + desktop**: touch-friendly controls, fullscreen support (limited on iPhone — see below), and a screen wake lock while playing so mobile screens don't sleep mid-take.

Keyboard / remote-clicker shortcuts while the prompter is running: `Space`/`Enter` play/pause, `↑`/`↓` speed, `Page Up`/`Page Down` jump paragraph, `+`/`-` font size, `M` mirror, `C` camera, `F` fullscreen, `Esc` back to editor. Most Bluetooth presentation clickers send these same key codes, so they work without any extra setup.

### Using it on an iPhone

Safari (and every other iOS browser, which are all required by Apple to use Safari's engine) has a few quirks:

- **Camera see-through and the screen wake lock both require HTTPS.** Opening the file directly (`file://`) or over plain `http://` on your LAN won't allow them — you need the GitHub Pages HTTPS link.
- **The Fullscreen button doesn't work on iPhone** — iOS Safari doesn't support fullscreening a webpage element. Instead: open the site in Safari, tap Share → **Add to Home Screen**. It'll then launch full-screen with no address bar, like a real app, and keep working offline after the first load (a small service worker caches the app shell).

### Running it locally without HTTPS

Everything except camera passthrough and wake lock works by just double-clicking `teleprompter.html`.
