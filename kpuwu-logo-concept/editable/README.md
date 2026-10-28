# KPUWU logo: editable project files

Everything here is vector: edit it, recolour it, and export it at any size without losing quality.

## Which software?

| Software | Cost | Open this file |
|---|---|---|
| **Inkscape** 1.2 or newer (recommended), [inkscape.org](https://inkscape.org) | Free (Windows, Mac, Linux) | `kpuwu-logo-project.svg`: all six versions in one file, one per page |
| Adobe Illustrator, Affinity Designer, CorelDRAW | Paid | One version at a time: `kpuwu-horizontal.svg`, `kpuwu-stacked.svg`… then save in the program's own format (.ai, .afdesign, .cdr) |
| Figma (free plan) | Free | Drag a version's `.svg` onto the canvas |
| Canva | Free / Pro | Upload a file from `outlined/` as an element (colours can be changed; text can't) |

## Step 1: install the font first

The text is set in **Oswald** (Bold for "KPUWU", Medium for the union name). Install both files from `fonts/` **before** opening the logo, or your program will show a substitute font.
- **Windows:** right-click each `.ttf` → *Install for all users*.
- **Mac:** double-click each `.ttf` → *Install Font*.

Oswald is free under the SIL Open Font License (`fonts/OFL.txt`); you can use it for anything, including commercial printing.

## What's in this folder

| File | What it is |
|---|---|
| `kpuwu-logo-project.svg` | **The master project** (Inkscape). Pages: Horizontal, Horizontal white, Stacked, Stacked white, Website header, Emblem |
| `kpuwu-horizontal.svg`, `-horizontal-white`, `-stacked`, `-stacked-white`, `-header`, `-emblem` | Each version on its own, for Illustrator, Affinity, CorelDRAW, Figma |
| `outlined/…-outlined.svg` | The same versions with the text turned into shapes: they open correctly anywhere, even without the font (text can't be retyped) |
| `fonts/` | Oswald Bold and Medium (.ttf) and their licence |

## Editing in Inkscape

- **Pages:** the six versions sit side by side. Use the **Pages** tool (the page icon in the left toolbar) to see or select them, or just zoom out (`5` fits the page, `4` fits the whole drawing).
- **Change the text:** Text tool (`T`), click into "KPUWU" or the union name and type. Letter spacing is in the Text toolbar.
- **Change a colour:** select a shape, open *Fill and Stroke* (`Shift+Ctrl+F`). The logo colours are saved as document swatches (Union red, Navy, Gold, Light blue, Name grey, Dark navy): pick them from the palette bar at the bottom → the ▸ menu → *Auto*.
- **Edit the emblem once, update all versions:** the emblem on every page is a *clone* of the one on the **Emblem** page. Change the master (it's grouped: double-click to enter the group) and all pages follow. To change one page's emblem on its own, select it → *Edit → Clone → Unlink Clone* (`Shift+Alt+D`).
- **White versions:** they sit on a dark navy background so you can see them. It's a locked object at the bottom of that page. To export a transparent file, hide or delete it first: open *Layers and Objects* (`Shift+Ctrl+L`) and click the eye icon.
- **Save your work:** *File → Save* (keep the format **Inkscape SVG**: everything stays editable).

## Exporting from Inkscape

- **PNG for print (300 dpi):** *File → Export* (`Shift+Ctrl+E`) → **Page** → choose the page → format **PNG** → **DPI 300** → *Export*. The background is transparent by default; for the white versions, hide the dark background first.
- **PNG for the web:** same, **DPI 96** (or set the width in pixels).
- **PDF for printers:** *File → Save a Copy* → **PDF** → tick *Convert text to paths* (or *Embed fonts*). The PDF stays sharp at any size.

## Colours

| Colour | HEX | Pantone (closest) | CMYK (approx.) |
|---|---|---|---|
| Union red | #C8102E | 186 C | 0 / 100 / 81 / 4 |
| Navy | #13294B | 2767 C | 100 / 78 / 0 / 54 |
| Gold (tassel) | #F2B705 | close to 7409 C | 0 / 25 / 100 / 5 |
| Light blue (workers) | #B9C6DA | | |
| Name grey | #4A5668 | | |
