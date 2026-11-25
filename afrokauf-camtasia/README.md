# AfroKauf Verbund – Camtasia assets

Editable Camtasia library assets (Asset Project Version 4.0: Camtasia 2021 and 2022) in the AfroKauf colours.
Every asset comes as **16x9 Desktop** and **9x16 Mobile**. Font: Poppins (install on the editing PC).

- `afrokauf_assets.py` – the asset designs (ticker, lower third, LIVE badge + show title, end card)
- `tools/` – the Camtasia kit from the camtasia-brand-reskin skill (rmkit, camtasia_tools, reskin)

```bash
AK_FONT_DIR=/path/to/poppins python3 afrokauf_assets.py preview OUTDIR          # PNG previews
AK_FONT_DIR=/path/to/poppins RM_BASE=breaking_news_left.libzip python3 afrokauf_assets.py build OUTDIR
```

Building the .libzip files needs a working 4.0 base asset exported from Camtasia (e.g. breaking_news_left.libzip).
Import in Camtasia: File > Library > Import Zipped Library Assets, drag to the timeline, edit texts in Properties.
