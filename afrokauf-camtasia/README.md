# AfroKauf Verbund – Camtasia assets

Editable Camtasia library assets (Asset Project Version 4.0: Camtasia 2021 and 2022) in the AfroKauf colours.
Every asset comes as **16x9 Desktop** and **9x16 Mobile**. Font: Poppins (install on the editing PC).

- `afrokauf_assets.py` – the asset designs: ticker, lower thirds (name + shop, interview guest left/right),
  LIVE badge + show title, end card, and the **News Bar** (TV-news style: clay title block, headline strip,
  gold-framed QR square, AfroKauf tab + scrolling ticker; also a version without the QR square)
- `tools/` – the Camtasia kit from the camtasia-brand-reskin skill (rmkit, camtasia_tools, reskin)

```bash
AK_FONT_DIR=/path/to/poppins python3 afrokauf_assets.py preview OUTDIR          # PNG previews
AK_FONT_DIR=/path/to/poppins RM_BASE=breaking_news_left.libzip python3 afrokauf_assets.py build OUTDIR
```

Building the .libzip files needs a working 4.0 base asset exported from Camtasia (e.g. breaking_news_left.libzip).
Import in Camtasia: File > Library > Import Zipped Library Assets, drag to the timeline, edit texts in Properties.

**News Bar with QR:** the white square is a placeholder. In Camtasia, drag your QR code image (PNG) onto a track
above the News Bar, size it to the square (100 px desktop, 128 px mobile) and line it up. Hide the grey "QR" text
in Properties. Edit Title, Headline and Ticker Text in Properties; colours are under the "... Colour" settings.
