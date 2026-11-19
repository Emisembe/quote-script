# AfroKauf brand kit

Logo, member badge and ready-to-edit templates for AfroKauf and the AfroKauf Verbund.
Open the `.svg` files in **Inkscape** (free: inkscape.org). Finished files are in `exports/`.

## First: install the font (once)

Open `fonts/`, double-click each `.ttf` file and click **Install**, then restart Inkscape.
The font is Bricolage Grotesque (free, SIL Open Font License, see `fonts/OFL.txt`).
The **logo files don't need the font**: their letters are shapes. The **templates** need it for the editable text.

## What's in the kit

| Folder | Files | Use |
|---|---|---|
| `logo/` | `afrokauf-logo-*` (colour, reverse, mono-dark, mono-white), `-tagline-`, `-stacked-` | Website, documents, signs |
| `logo/` | `afrokauf-verbund-*` | Everything for shop owners: seminars, member material |
| `logo/` | `afrokauf-icon-*`, `afrokauf-profile-round` | Facebook, Instagram, WhatsApp, LinkedIn profile picture, app icon |
| `member/` | `afrokauf-member-badge` | Round "Mitglied im AfroKauf Verbund" seal for shop windows, websites, posts |
| `member/` | `afrokauf-member-lockup` | **Shop name + "Mitglied im AfroKauf Verbund"**: make one per shop |
| `templates/` | social post 1080×1080, story 1080×1920, live banner 1920×1080 | Social media, live streams |
| `templates/` | window sticker A6, weekly offers flyer A4, seminar poster A4 | Print |
| `afrokauf-brand-guide.svg` | one page | Colours, font and rules, to send to printers and helpers |

Which colour version: on cream or white use **colour**; on green or photos use **reverse**;
for one-colour printing (stamps, receipts, engraving) use **mono-dark** or **mono-white**.

## Editing a template in Inkscape

1. Open the template. Open **Layers and Objects** (Ctrl+Shift+L). The **Background** layer is locked so you
   don't move it by accident; work in **Artwork and text**.
2. **Text:** every text you're meant to change is labelled `EDIT: ...`. Double-click it and type.
   Too long? Make it smaller in the text toolbar, don't squeeze it.
3. **Photos:** each grey dashed box labelled `PHOTO:` is a photo frame.
   - **File → Import** your photo, place it over the frame, then **Object → Lower** (Page Down) until it's under the frame.
   - Select the photo and the frame's rectangle (Shift+click), then **Object → Clip → Set Clip**. The photo now has the frame's shape.
   - Delete the camera icon and "Foto hier einfügen" text in that frame.
4. **QR codes:** delete the dashed QR box, then **Extensions → Render → Barcode → QR Code**, paste the shop's page
   address (e.g. `https://afrokauf.de/2026/11/lagos-taste.html`) and place the code where the box was.
5. **Save as a copy** (File → Save a Copy) with the shop's name, so the template stays clean.
6. **Export:** for social media, **File → Export → Page → PNG**. For print, **File → Save a Copy → PDF**.

### A member lockup for a shop (2 minutes)

Open `member/afrokauf-member-lockup.svg`, change **Shop name** and **City**, save a copy as
`lagos-taste-member.svg`, export PNG. Send it to the shop for their WhatsApp, Instagram and door.

## Printing

- Online printers usually want **3 mm bleed** (extra background beyond the cut). In Inkscape:
  **Document Properties → Page → Bleed: 3 mm**, then drag the background rectangle to the bleed edge.
- Window sticker: order as "Aufkleber für Glas / Fensterfolie, innen klebend" so it's read from outside.

## Rules (short version)

- Don't stretch, recolour, rotate or add effects to the logo.
- Leave free space around the logo at least as tall as the "A".
- Shops show their **own name first**, then the member badge. The network makes them stronger without taking their name away.
- Prices on shared flyers always belong to **one named shop** ("bei Lagos Taste"). Shops don't agree on common
  selling prices among themselves, because that's a competition-law (Kartellrecht) risk.

## For developers

`build_brand.py` generates every SVG (`pip install fonttools uharfbuzz`, then `python3 build_brand.py`).
Change colours, texts or layouts there rather than in the SVGs, then re-export.
