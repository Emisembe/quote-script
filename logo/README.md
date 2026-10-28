# EFIC Logo

The EFIC Consultancy Ltd logo as an editable Inkscape project, plus every logo version and file type you need. It's a separate project from the theme (`../blogger-theme`) and the tools (`../doc-generator`, `../letter-generator`).

The logo was rebuilt from the original image as clean vector shapes. Measured against the original, it matches within about a pixel:
- **EFIC** is set in **Source Sans 3 Black**.
- **Efic Consultancy Ltd** is set in **Source Sans 3 Regular**.

## What's in the folder

| Folder / file | What it is |
|---|---|
| `efic-logo-master.svg` | **The Inkscape project.** 14 pages (one per version) with live, editable text. |
| `fonts/` | The two logo fonts (free, SIL Open Font License). Install them before editing. |
| `svg/` | Every version with the text turned into shapes, so it looks the same on any computer. |
| `pdf/` | Vector files for printers, sign-makers, Word and PowerPoint. |
| `png/` | Pictures with transparent backgrounds, 3 sizes each (in `primary/`, `horizontal/`, `wordmark/` and `icon/`). |
| `web/` | Favicon (`favicon.ico`, `favicon.svg`), phone icons, and the Blogger header logo. |
| `social/` | Profile pictures and cover banners for LinkedIn, Facebook, X and YouTube. |
| `email/` | Email-signature logo (white or navy background). |
| `guidelines/` | `efic-logo-guidelines.pdf`: how to use the logo (7 pages). Hand it to printers and designers. |
| `tools/` | The scripts that build all of the above. |

**The versions:**
- **Primary (stacked):** EFIC, gold rule, Efic Consultancy Ltd. This is the main logo.
- **Horizontal:** EFIC, a gold bar, then the name on two lines. For website headers, email and banners.
- **Wordmark:** EFIC and the rule only. For small spaces.
- **Icon:** the E with a gold bar on navy. For browser tabs and app icons.

**The colours (each version comes in these):**
- `navy-bg`: on its own navy panel.
- `positive`: navy and gold, for white backgrounds.
- `reverse`: white and gold, for dark backgrounds.
- `white`, `navy`, `black`: one colour each.

## Editing in Inkscape

1. **Install Inkscape 1.2 or newer.** It's free from inkscape.org. Older versions open the file too, but they don't show the pages.
2. **Install the fonts** in `fonts/`, then restart Inkscape:
   - **Windows:** select all four `.ttf` files, right-click and choose **Install for all users**.
   - **Mac:** double-click each file and choose **Install**.

   Without the fonts, Inkscape shows a different font in its place.
3. **Open `efic-logo-master.svg`.** Each version is a page and a layer with the same name. To see the layers, go to **Layer → Layers and Objects** (Ctrl+Shift+L). Backgrounds are locked so you don't move them by accident.
4. **Change the words:** use the **Text tool** (T) and click into the text. The text stays centred while you type.
5. **Change a brand colour everywhere at once:** the colours are document swatches called **EFIC Navy**, **EFIC Gold**, **EFIC White** and **EFIC Black**.
   1. Select anything that has the colour.
   2. Open **Object → Fill and Stroke** (Ctrl+Shift+F) and change the swatch.
   3. Every object that uses that swatch changes with it.
6. **Export:** go to **File → Export** (Ctrl+Shift+E), choose **Single Image** (then the page) or **Batch export** (all pages at once), and pick PNG, PDF or SVG.
7. **Before sending an SVG or PDF you made to someone else:** select all, then **Path → Object to Path**. This turns the text into shapes, so it looks the same without the fonts. Do it in a copy, so your master keeps editable text. The files in `svg/` and `pdf/` are already converted.

## Putting the logo on Blogger

- **Browser-tab icon (favicon):** go to **Blogger → Settings → Favicon** (in older dashboards, **Layout → Favicon → Edit**) and upload `web/favicon.ico`. The 16 and 32 px sizes inside it are drawn pixel by pixel, so they stay sharp.
- **Header logo:**
  1. Go to **Layout → Header → Edit → Image → From your computer**.
  2. Choose `web/blogger-header-reverse-600px.png` for a navy header, or `web/blogger-header-positive-600px.png` for a white one.
  3. Tick **Instead of title and description**.

  For sharp screens, use the 1200 px file and let Blogger shrink it.
- **Social profiles:**
  - Profile picture: `social/profile-picture-efic.png`. It's made to survive the round crop.
  - Covers and banners: the file named after the platform. The logo sits inside each platform's safe area, so it isn't hidden behind the profile picture or cut off on phones.
- **Email signature:** insert `email/email-signature-white.png` and set its width to 300 px. The file is twice that size, so it stays sharp.

## Building the files again

After you change the build script (sizes, colours, a new version):

```bash
pip install fonttools uharfbuzz cairosvg pillow
python3 logo/tools/build_logo.py          # master, svg, pdf, png, web, social, email, guidelines HTML
node logo/tools/render_guidelines.js      # guidelines PDF and preview pictures (needs: npm i playwright)
```

Changes you make by hand in Inkscape aren't read by the script. Export them from Inkscape instead.

## Advice on the logo

**What I changed when rebuilding it (all reversible in the master):**
1. **Colours aligned with the brand.** The image you sent uses a greyer navy (#142634) and a slightly different gold (#EAAD5A) from the brand colours used on the website and documents. The new files use the brand **Navy #14213D** and **Gold #E7B165**, so the logo matches everything around it.
2. **The dark outline around EFIC is gone.** The original has a faint dark ring or shadow around the letters. On a flat navy background it only makes the edges look soft. It also can't be printed in one colour, embroidered or cut as a sign. The flat letters look crisper.
3. **The gold rule is clean and exact.** The original rule tapers at the ends. It's now a straight bar with rounded ends, the same width as before. It's thicker in the wordmark and the icon, so it doesn't disappear at small sizes.
4. **New small versions.** A stacked logo with small words can't work as a 16 px browser icon or a round profile picture. So there's now a horizontal version, a wordmark and an E icon.

**Worth thinking about (I didn't change these, they're your call):**
- **EFIC is said twice.** "EFIC" on top, then "Efic Consultancy Ltd" underneath. Many firms use the second line to say what they do, for example **EFIC / CONSULTANCY** or **EFIC / Consultancy Ltd**. Then the logo reads in one go, and the full legal name goes on letters and invoices, where the law needs it anyway. If you like the idea, it's a two-minute text change in the master.
- **Pick one spelling for the name in text:** "EFIC Consultancy Ltd" or "Efic Consultancy Ltd". Use it the same way on the website, letters, invoices and social profiles.
- **Never retype the logo.** The website headings use Montserrat, and the logo uses Source Sans 3. That contrast is fine. But a logo typed in Montserrat, Arial or Times stops being the logo. Always use the files.
- **Protect it.** Once you're happy with the final design, consider registering it as a trademark, for example with KIPI (Kenya Industrial Property Institute) if Kenya is your main market.
