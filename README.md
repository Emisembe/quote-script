# quote-script

## Teleprompter

`teleprompter.html` is a self-contained, offline-capable teleprompter. Open it directly in a browser (desktop or mobile) — no build step, no server required.

- **Load a script**: paste text in, or upload a `.txt` file. Save scripts to a local library (stored in the browser, per device) for reuse.
- **Font size & scroll speed**: adjustable live via sliders, both before starting and while it's running.
- **See-through / transparent background**: a darkness slider controls a black scrim over the display. At 0% with the camera off and the page embedded as a transparent source (e.g. an OBS Browser Source), the page background is fully transparent. Turning on the camera toggle instead shows your device's live camera feed behind the scrolling text, so you can read while keeping an eye on your framing.
- **Mirror mode**: cycles through off / horizontal / vertical / both, for use with physical teleprompter beamsplitter-glass rigs.
- **Mobile + desktop**: touch-friendly controls, fullscreen support, and a screen wake lock while playing so mobile screens don't sleep mid-take.

Keyboard shortcuts while the prompter is running: `Space` play/pause, `↑`/`↓` speed, `+`/`-` font size, `M` mirror, `C` camera, `F` fullscreen, `Esc` back to editor.

Note: camera access requires HTTPS (or `localhost`) per browser security rules — it won't work over plain `http://` or `file://` on most mobile browsers.