# quote-script

This repo has two unrelated tools in it:

- `quote.js` — a price-quote calculator, the original purpose of this repo. Not used by the teleprompter.
- `teleprompter.html` — the entire teleprompter app, described below. **One file, nothing else needed** — open it anywhere: desktop, phone, email attachment, USB stick.

## Teleprompter

`teleprompter.html` is a single self-contained file — no build step, no account, no other files to keep alongside it, no server required for the core features. Everything (styling, logic, icons, the "Add to Home Screen" manifest) is inlined into that one file, so you can email it to yourself, AirDrop it, or drop it on a USB stick and it still works.

Opening it shows one choice: is this device **the teleprompter** (the screen you read from) or **the remote control** (a second device that drives it)? Pick one — you can switch anytime with the "↩ Switch device role" link.

### As the teleprompter

- **Load a script**: paste text in, or upload a `.txt` file. Save scripts to a local library (stored in the browser, per device) for reuse. Whatever you're typing is also auto-saved as a draft, so an accidental refresh won't lose it.
- **Font size & scroll speed**: adjustable live via sliders, both before starting and while it's running — the current value (px / speed / opacity %) is shown next to each slider as you drag it.
- **3-2-1 countdown**: optional, on by default, before the first play so you and the camera operator have a beat to get ready. Only fires once per session — pausing and resuming skips it.
- **Progress bar & time readout**: top of the screen, shows how far through the script you are and elapsed/estimated-remaining time at the current speed. Playback auto-stops at the end instead of scrolling into blank space.
- **Paragraph jump**: "Prev ¶ / Next ¶" buttons jump to the start of the previous/next blank-line-separated section — useful for skipping to a spot after a flubbed take.
- **Eye-line guide**: the "Guide" button shows a labeled line ("Look here — eye line") with markers at both ends, marking where your eyes (and ideally the camera lens) should be. The label fades after 2.5s so it doesn't sit on top of (and block) the text scrolling past it — just the thin line and edge markers stay, plus a subtle fade on text above/below it so the current line stands out.
- **See-through / transparent background**: an opacity slider controls a scrim over the display, with black or green-screen presets. At 0% opacity with the camera off and the page embedded as a transparent source (e.g. an OBS Browser Source), the background is fully transparent. Turning on the camera toggle instead shows your device's live camera feed behind the scrolling text, so you can read while keeping an eye on your framing.
- **Mirror mode**: cycles through off / horizontal / vertical / both, for use with physical teleprompter beamsplitter-glass rigs.
- **Mobile + desktop**: touch-friendly controls, fullscreen support (limited on iPhone — see below), and a screen wake lock while playing so mobile screens don't sleep mid-take.

Keyboard / remote-clicker shortcuts while the prompter is running: `Space`/`Enter` play/pause, `↑`/`↓` speed, `Page Up`/`Page Down` jump paragraph, `+`/`-` font size, `M` mirror, `C` camera, `F` fullscreen, `Esc` back to editor. Most Bluetooth presentation clickers send these same key codes, so they work without any extra setup.

### As the remote control

Open the *same file* on a second phone or laptop and choose "🔗 The Remote Control" to drive the teleprompter without touching the reading screen — play/pause, speed, font size, jump paragraph, mirror, guide, reset.

It connects the two devices directly (WebRTC), with no account, app, or server of ours in the middle — you pair them once per session by copying a short code from one screen to the other:

1. On the teleprompter, tap **🔗 Remote** → **Generate pairing code** → copy the code shown.
2. On the remote device, paste that code → **Generate my code** → copy the code it shows you.
3. Paste that back into the teleprompter's Step 2 box and tap **Connect**.

After that the two stay connected for the session; the remote also mirrors the teleprompter's play state, speed, font size, and progress so you can see what's happening from across the room. This only needs the two devices to be reachable from each other (same Wi-Fi covers the normal case) — a STUN lookup to a public Google server helps them find each other through NAT, but no script content ever leaves the two devices.

If pairing seems stuck, it's almost always a restrictive network (hotel/corporate Wi-Fi, or client isolation) blocking that discovery step — try a different network, or connect both devices to the same phone hotspot.

### Using it on an iPhone

Safari (and every other iOS browser, which are all required by Apple to use Safari's engine) has a few quirks:

- **Camera see-through and the screen wake lock both require HTTPS.** Opening the file directly (`file://`) or over plain `http://` on your LAN won't allow them — you need the GitHub Pages HTTPS link. Everything else — including the wireless remote — works fine without HTTPS.
- **The Fullscreen button doesn't work on iPhone** — iOS Safari doesn't support fullscreening a webpage element. Instead: open the file in Safari, tap Share → **Add to Home Screen**. It'll then launch full-screen with no address bar, like a real app.

### One trade-off from going single-file

The earlier multi-file version had a service worker for offline caching (so it kept working with zero signal after the first load). A service worker has to live at its own URL, which doesn't fit inside one self-contained HTML file, so that specific feature was dropped to get everything into one file. Everything else — including the remote control — is unaffected.
