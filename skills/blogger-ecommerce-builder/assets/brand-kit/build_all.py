"""Kreislo: every logo design and brand template in its own folder with its own project file.
Run: python3 -I build_all.py <root>   then node render_all.js <root>/jobs.json   then python3 -I finish.py <root>"""
import json, os, re, shutil, struct, subprocess, sys
ROOT = sys.argv[1]
SRC, FONTS = os.path.join(ROOT, 'src'), os.path.join(ROOT, 'fonts')
MASTERS = os.path.join(ROOT, 'masters')
OUT = os.path.join(ROOT, 'final')
LOGO, KIT = os.path.join(OUT, 'Kreislo Logo Project'), os.path.join(OUT, 'Kreislo Brand Kit')
if os.path.isdir(OUT): shutil.rmtree(OUT)
if os.path.isdir(MASTERS): shutil.rmtree(MASTERS)
subprocess.run([sys.executable, '-I', os.path.join(SRC, 'kreislo.py'), FONTS, MASTERS], check=True)
INK, ORANGE, PAPER, STONE, WHITE, BLUSH = '#111111', '#FF3300', '#F7F5F2', '#6B6B6B', '#FFFFFF', '#FFE3D9'
GF = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&amp;family=Open+Sans:wght@400;600;700&amp;display=swap">'
jobs, post = [], []        # render jobs; extra steps for finish.py
designs = []               # (group dir, folder name) for zips and the index

def mk(*p):
    d = os.path.join(*p); os.makedirs(d, exist_ok=True); return d

def readme(folder, title, use, files, notes=''):
    lines = [f'KREISLO - {title.upper()}', '', 'WHAT IT IS FOR', '  ' + use, '', 'FILES IN THIS FOLDER']
    lines += [f'  {n}\n      {d}' for n, d in files]
    if notes: lines += ['', 'GOOD TO KNOW', '  ' + notes]
    lines += ['', 'The PROJECT file (.svg) is the editable original: open it in Inkscape (free), Illustrator, Affinity',
              'or Figma, or upload it to Canva. Everything else in this folder was made from it.']
    open(os.path.join(folder, 'READ ME.txt'), 'w').write('\n'.join(lines) + '\n')

def logo_design(group, num, title, master, use, pngs=(), pdf=False, notes='', extra_files=()):
    """One logo design = its own folder: PROJECT svg + exports + READ ME."""
    folder = mk(group, f'{num} {title}')
    designs.append((group, f'{num} {title}'))
    base = f'Kreislo - {title}'
    svg = open(os.path.join(MASTERS, master + '.svg')).read().replace('<title>Kreislo</title>', f'<title>Kreislo - {title}</title>')
    proj = os.path.join(folder, f'{base} - PROJECT (editable).svg'); open(proj, 'w').write(svg)
    files = [(os.path.basename(proj), 'Editable vector original. Any size, no quality loss.')]
    for label, kw in pngs:
        out = os.path.join(folder, f'{base} - {label}.png')
        jobs.append(dict(kind='png', src=proj, out=out, **kw)); files.append((os.path.basename(out), 'Picture, transparent background' + (f' ({label})' if label else '')))
    if pdf:
        out = os.path.join(folder, f'{base} - PRINT.pdf'); jobs.append(dict(kind='pdf', src=proj, out=out))
        files.append((os.path.basename(out), 'Vector PDF for printers, sign makers, embroidery.'))
    files += list(extra_files)
    readme(folder, title, use, files, notes)
    return folder, base

# ================================================================ LOGO PROJECT
use_dir = mk(LOGO, 'A - Logos by use')
ver_dir = mk(LOGO, 'B - All logo versions (one design per folder)')

logo_design(use_dir, '01', 'Website header logo', 'kreislo-wordmark-colour-on-dark',
    'The logo at the top of your website (Blogger: Layout -> Header -> Edit -> Image -> upload -> "Instead of title and description").',
    pngs=[('for Blogger header 88px high', {'height': 88}), ('sharp 176px high', {'height': 176})],
    notes='White letters for the black Night Shop header. Upload the 88px file; the 176px one is extra sharp on large screens.')
logo_design(use_dir, '02', 'Website header logo with tagline', 'kreislo-logo-primary-colour-on-dark',
    'Alternative website header logo with "KEEP GOOD THINGS MOVING" under the name.',
    pngs=[('for Blogger header 120px high', {'height': 120})], notes='The tagline is small in the header; the plain website header logo (01) reads better on phones.')
_, b = logo_design(use_dir, '03', 'Favicon (browser tab icon)', 'kreislo-app-icon-rounded',
    'The small icon in the browser tab and in Google search results (Blogger: Settings -> Favicon -> upload).',
    pngs=[('512px (upload this to Blogger)', {'width': 512}), ('48px', {'width': 48}), ('32px', {'width': 32})],
    extra_files=[('Kreislo - Favicon (browser tab icon) - favicon.ico', 'Classic icon file (16, 32, 48 px) for other website builders.')])
post.append(('ico', os.path.join(use_dir, '03 Favicon (browser tab icon)', b + ' - 512px (upload this to Blogger).png'),
             os.path.join(use_dir, '03 Favicon (browser tab icon)', b + ' - favicon.ico')))
logo_design(use_dir, '04', 'Phone home-screen icon', 'kreislo-app-icon-square',
    'The icon when a customer saves your shop to their phone home screen (apple-touch-icon), and app-style icons.',
    pngs=[('180px (iPhone)', {'width': 180}), ('192px (Android)', {'width': 192}), ('512px', {'width': 512})],
    notes='Square on purpose: phones round the corners themselves.')
logo_design(use_dir, '05', 'Email signature logo', 'kreislo-logo-primary-colour-on-light',
    'The logo in your email signature (Gmail: Settings -> Signature -> insert image) and in order emails.',
    pngs=[('600px wide (show at 300px)', {'width': 600}), ('300px wide', {'width': 300})],
    notes='Use the 600px file and set it to 300px wide in the signature: sharp on phones and retina screens. The ready signature is in the Brand Kit (Email signature).')
logo_design(use_dir, '06', 'Letterhead logo (letters, invoices, documents)', 'kreislo-logo-primary-colour-on-light',
    'The logo for letters, invoices, delivery notes, price lists and other documents.',
    pngs=[('for Word and Google Docs 2400px', {'width': 2400})], pdf=True,
    notes='In Word: Insert -> Pictures, then set the width to about 6 cm. A ready A4 letterhead (Word + PDF) is in the Brand Kit (Letterhead).')
logo_design(use_dir, '07', 'Social media profile picture (black)', 'kreislo-app-icon-square',
    'Profile picture for Instagram, WhatsApp Business, Telegram, Facebook, TikTok, YouTube.',
    pngs=[('1080x1080', {'width': 1080})], notes='Upload the square; each app cuts it into a circle. The symbol stays inside the circle.')
logo_design(use_dir, '08', 'Social media profile picture (orange)', 'kreislo-app-icon-orange',
    'Orange alternative profile picture: stands out more in chat lists.', pngs=[('1080x1080', {'width': 1080})])
logo_design(use_dir, '09', 'Business card logo', 'kreislo-logo-stacked-colour-on-dark',
    'Front of the business card, packaging, shop sign on a dark background.',
    pngs=[('1000px', {'width': 1000})], pdf=True, notes='The finished business card is in the Brand Kit (Business card).')
_, b = logo_design(use_dir, '10', 'Product photo watermark', 'kreislo-symbol-white',
    'A small white symbol to put in a corner of product photos, so copied photos still show where they come from.',
    pngs=[('white 400px', {'width': 400})],
    extra_files=[('Kreislo - Product photo watermark - white 400px see-through 50%.png', 'Already half transparent: just place it on the photo.')])
post.append(('fade', os.path.join(use_dir, '10 Product photo watermark', b + ' - white 400px.png'),
             os.path.join(use_dir, '10 Product photo watermark', b + ' - white 400px see-through 50%.png')))
logo_design(use_dir, '11', 'One-colour stamp and packaging logo', 'kreislo-logo-primary-black',
    'Rubber stamps, kraft paper bags, boxes, tissue paper, engraving: anywhere only one ink colour is possible.',
    pngs=[('1200px', {'width': 1200})], pdf=True, notes='A stamp maker or packaging printer needs the PRINT.pdf.')
logo_design(use_dir, '12', 'Logo on photos and orange backgrounds', 'kreislo-logo-primary-white',
    'All-white logo for use on top of photos, on orange or on any dark colour.',
    pngs=[('1200px', {'width': 1200})], pdf=True)

VERS = [('Primary logo', 'kreislo-logo-primary', [600, 1200, 2400]), ('Wordmark', 'kreislo-wordmark', [600, 1200, 2400]),
        ('Stacked logo', 'kreislo-logo-stacked', [500, 1000, 2000]), ('Symbol', 'kreislo-symbol', [256, 512, 1024])]
CW = [('colour on light', 'colour-on-light'), ('colour on dark', 'colour-on-dark'), ('black', 'black'), ('white', 'white')]
n = 13
for vt, vm, sizes in VERS:
    for ct, cm in CW:
        logo_design(ver_dir, f'{n:02d}', f'{vt} - {ct}', f'{vm}-{cm}',
            {'colour on light': 'For white or light backgrounds.', 'colour on dark': 'For black or dark backgrounds (letters are white).',
             'black': 'One colour, black: stamps, engraving, simple print.', 'white': 'One colour, white: on photos, orange or dark colours.'}[ct],
            pngs=[(f'{w}px', {'width': w}) for w in sizes], pdf=True)
        n += 1
for t, m, use in [('App icon - black rounded', 'kreislo-app-icon-rounded', 'Rounded black icon with the symbol.'),
                  ('App icon - black square', 'kreislo-app-icon-square', 'Square black icon (phones round it themselves).'),
                  ('App icon - orange rounded', 'kreislo-app-icon-orange', 'Rounded orange icon with a white symbol.'),
                  ('Round profile badge', 'kreislo-profile-circle', 'Round black badge with the symbol (stickers, avatars).')]:
    logo_design(ver_dir, f'{n:02d}', t, m, use, pngs=[(f'{w}px', {'width': w}) for w in (192, 512, 1024)], pdf=True); n += 1

src_dir = mk(LOGO, 'C - Source scripts (to change the logo later)')
for f in ('kreislo.py', 'build_all.py', 'finish.py', 'render_all.js', 'guidelines.py', 'guidelines.js'):
    if os.path.exists(os.path.join(SRC, f)): shutil.copy(os.path.join(SRC, f), src_dir)

# ================================================================ BRAND KIT
vb = lambda f: tuple(map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', open(f).read()).groups()))
def logo_svg(name, x, y, w=None, h=None):
    path = os.path.join(MASTERS, name + '.svg'); W0, H0 = vb(path)
    if w is None: w = h * W0 / H0
    h = w * H0 / W0
    inner = re.sub(r'<title>.*?</title>', '', re.sub(r'^<svg[^>]*>|</svg>\s*$', '', open(path).read().strip()))
    return f'<svg x="{x:.1f}" y="{y:.1f}" width="{w:.1f}" height="{h:.1f}" viewBox="0 0 {W0} {H0}">{inner}</svg>', w, h
def text(x, y, s, size, cls='os', fill=INK, anchor='start', weight=None, spacing=None):
    a = f' text-anchor="{anchor}"' if anchor != 'start' else ''
    return (f'<text class="{cls}" x="{x}" y="{y}" font-size="{size}" fill="{fill}"{a}' + (f' font-weight="{weight}"' if weight else '')
            + (f' letter-spacing="{spacing}"' if spacing is not None else '') + f'>{s}</text>')
def svgdoc(w, h, body, unit):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}{unit}" height="{h}{unit}">'
            f'<style>.o{{font-family:Oswald,"Arial Narrow",sans-serif;font-weight:600}}.os{{font-family:"Open Sans",Arial,sans-serif}}</style>{body}</svg>\n')

tpl_dir = mk(KIT, 'B - Templates (one design per folder)')
previews = {}
def tpl(num, title, use, parts, unit='px', notes='', extra_files=()):
    """parts: list of (suffix, w, h, body, png_width, pdf)."""
    folder = mk(tpl_dir, f'{num} {title}'); designs.append((tpl_dir, f'{num} {title}'))
    files = []
    for suffix, w, h, body, pngw, pdf in parts:
        base = f'Kreislo - {title}' + (f' - {suffix}' if suffix else '')
        proj = os.path.join(folder, f'{base} - PROJECT (editable).svg'); open(proj, 'w').write(svgdoc(w, h, body, unit))
        files.append((os.path.basename(proj), 'Editable original with live text (install the fonts first, see Fonts).'))
        if pngw:
            out = os.path.join(folder, f'{base} - ready to post.png' if unit == 'px' else f'{base} - preview.png')
            jobs.append(dict(kind='png', src=proj, out=out, width=pngw, fonts=True)); files.append((os.path.basename(out), 'Finished picture.'))
            previews.setdefault(num, out)
        if pdf:
            out = os.path.join(folder, f'{base} - PRINT.pdf')
            jobs.append(dict(kind='pdf', src=proj, out=out, unit=unit, w=w, h=h, fonts=True)); files.append((os.path.basename(out), 'Print file with bleed, send this to the printer.'))
    files += list(extra_files)
    readme(folder, title, use, files, notes)
    return folder

lg, _, _ = logo_svg('kreislo-wordmark-colour-on-dark', 60, 48, h=70)
tpl('01', 'Instagram post - new in', 'Product post for Instagram and Facebook, 1080 x 1080.', [('', 1080, 1080,
    f'<rect width="1080" height="1080" fill="{INK}"/>{lg}<rect x="60" y="170" width="960" height="650" rx="24" fill="#2A2A2A"/>'
    + text(540, 505, 'YOUR PRODUCT PHOTO HERE', 34, 'o', '#777777', 'middle', spacing=4)
    + f'<rect x="60" y="760" width="250" height="60" rx="30" fill="{ORANGE}"/>' + text(185, 801, 'NEW IN', 30, 'o', WHITE, 'middle', spacing=3)
    + text(60, 910, 'PRODUCT NAME HERE', 58, 'o', WHITE, spacing=2) + text(60, 970, 'Very good condition · Checked by hand', 30, 'os', '#CFCFCF')
    + text(1020, 970, '29,90 €', 54, 'o', ORANGE, 'end'), 1080, False)], notes='Replace the grey box with your photo and change name, size and price.')
sym, _, _ = logo_svg('kreislo-symbol-colour-on-light', 440, 120, w=200)
tpl('02', 'Instagram post - brand message', 'Brand message post for Instagram and Facebook, 1080 x 1080.', [('', 1080, 1080,
    f'<rect width="1080" height="1080" fill="{PAPER}"/>{sym}' + text(540, 470, 'GOOD THINGS', 92, 'o', INK, 'middle', spacing=4)
    + text(540, 575, 'DESERVE A', 92, 'o', INK, 'middle', spacing=4) + text(540, 680, 'SECOND ROUND.', 92, 'o', ORANGE, 'middle', spacing=4)
    + text(540, 790, 'Checked by hand and ready for their next owner.', 30, 'os', STONE, 'middle')
    + text(540, 980, 'kreislo.de', 28, 'os', INK, 'middle', weight=600), 1080, False)])
lg, _, _ = logo_svg('kreislo-logo-primary-colour-on-dark', 140, 120, w=800)
tpl('03', 'Instagram story', 'Story for Instagram, Facebook and WhatsApp status, 1080 x 1920.', [('', 1080, 1920,
    f'<rect width="1080" height="1920" fill="{INK}"/>{lg}<rect x="90" y="460" width="900" height="1000" rx="30" fill="#2A2A2A"/>'
    + text(540, 975, 'YOUR PHOTO HERE', 40, 'o', '#777777', 'middle', spacing=4) + text(540, 1580, 'NEW ARRIVALS ONLINE', 70, 'o', WHITE, 'middle', spacing=3)
    + f'<rect x="290" y="1650" width="500" height="100" rx="50" fill="{ORANGE}"/>' + text(540, 1716, 'SHOP NOW', 42, 'o', WHITE, 'middle', spacing=4), 1080, False)])
lg, _, _ = logo_svg('kreislo-logo-primary-colour-on-dark', 280, 150, w=640)
tpl('04', 'Website share image', 'The picture shown when your shop link is shared on WhatsApp, Facebook or X (1200 x 630).', [('', 1200, 630,
    f'<rect width="1200" height="630" fill="{INK}"/><rect y="618" width="1200" height="12" fill="{ORANGE}"/>{lg}'
    + text(600, 500, 'Second-hand from Germany to Africa · Digital products · Fulfilment in Gießen', 26, 'os', '#CFCFCF', 'middle'), 1200, False)])
lg, _, _ = logo_svg('kreislo-logo-stacked-colour-on-dark', 45.5 - 24, 12, w=48)
front = f'<rect width="91" height="61" fill="{INK}"/>{lg}'
sym, _, _ = logo_svg('kreislo-symbol-colour-on-light', 68, 8, w=17)
back = (f'<rect width="91" height="61" fill="{WHITE}"/><rect x="0" y="0" width="7" height="61" fill="{ORANGE}"/>{sym}'
        + text(13, 20, 'YOUR NAME', 6.2, 'o', INK, spacing=0.3) + text(13, 25.5, 'Founder · Kreislo', 3.2, 'os', ORANGE, weight=600)
        + text(13, 36, '+49 157 0000000', 3.1, 'os', INK) + text(13, 41, 'hello@kreislo.de', 3.1, 'os', INK)
        + text(13, 46, 'kreislo.de', 3.1, 'os', INK) + text(13, 51, 'WhatsApp · Telegram · Instagram @kreislo', 3.1, 'os', STONE))
tpl('05', 'Business card', 'Business card 85 x 55 mm, front and back, with 3 mm bleed.', [('front', 91, 61, front, 1075, True), ('back', 91, 61, back, 1075, True)],
    unit='mm', notes='Change name, phone, email and links in the back PROJECT file, then make a new PDF (or send the SVG to the printer).')
sym, _, _ = logo_svg('kreislo-symbol-white', 32 - 13, 9, w=26)
tpl('06', 'Parcel sticker', 'Round 60 mm sticker to close parcels and tissue paper (2 mm bleed).', [('', 64, 64,
    f'<circle cx="32" cy="32" r="32" fill="{ORANGE}"/><circle cx="32" cy="32" r="30" fill="none" stroke="{WHITE}" stroke-width="0.4" stroke-dasharray="1 1"/>{sym}'
    + text(32, 43, 'THANK YOU', 6.2, 'o', WHITE, 'middle', spacing=0.4) + text(32, 49, 'for keeping good things moving', 2.9, 'os', WHITE, 'middle', weight=600), 1000, True)], unit='mm')
lg, _, _ = logo_svg('kreislo-logo-primary-colour-on-light', 14, 14, w=58)
tpl('07', 'Thank-you card', 'A6 card (148 x 105 mm) to put in every parcel, 3 mm bleed.', [('', 154, 111,
    f'<rect width="154" height="111" fill="{PAPER}"/><rect x="0" y="105" width="154" height="6" fill="{ORANGE}"/>{lg}'
    + text(14, 52, 'THANK YOU!', 13, 'o', INK, spacing=0.6) + text(14, 62, 'Your order is ready for its next round. We checked it by hand,', 4, 'os', INK)
    + text(14, 68, 'packed it with care and hope you enjoy it.', 4, 'os', INK)
    + text(14, 80, 'Something not right? Message us, we answer within a day.', 3.6, 'os', STONE)
    + text(14, 92, 'Share it with us: @kreislo  ·  kreislo.de', 3.6, 'os', ORANGE, weight=600), 1540, True)], unit='mm')
lg, _, _ = logo_svg('kreislo-logo-primary-colour-on-light', 20, 16, w=62)
sym, _, _ = logo_svg('kreislo-symbol-colour-on-light', 182, 266, w=10)
letter = (f'<rect width="210" height="297" fill="{WHITE}"/>{lg}<rect x="20" y="44" width="170" height="0.6" fill="{ORANGE}"/>'
          + text(190, 26, 'Kreislo · Keep good things moving', 3.4, 'os', STONE, 'end') + text(190, 31, 'Street 1 · 35390 Gießen', 3.4, 'os', STONE, 'end')
          + text(190, 36, 'hello@kreislo.de · +49 157 0000000', 3.4, 'os', STONE, 'end')
          + f'<rect x="20" y="262" width="170" height="0.3" fill="#DDDDDD"/>'
          + text(20, 270, 'Kreislo · Owner: Your Name · Street 1 · 35390 Gießen', 2.8, 'os', STONE)
          + text(20, 275, 'kreislo.de · VAT ID / Tax no.: …', 2.8, 'os', STONE)
          + text(20, 280, 'Bank: Your Bank · IBAN DE00 0000 0000 0000 0000 00 · BIC XXXXXXXX', 2.8, 'os', STONE) + sym)
tpl('08', 'Letterhead (A4)', 'A4 letter paper for letters, invoices and offers. Word file to type in, PDF/SVG to print.',
    [('', 210, 297, letter, 1240, True)], unit='mm',
    extra_files=[('Kreislo - Letterhead (A4) - for Word.docx', 'Open in Word or Google Docs and type your letter; logo and footer are in the header/footer.')],
    notes='Change the address, owner name, tax number and bank details (German business letters need them in the footer).')
post.append(('docx', os.path.join(tpl_dir, '08 Letterhead (A4)', 'Kreislo - Letterhead (A4) - for Word.docx')))
esig = mk(tpl_dir, '09 Email signature'); designs.append((tpl_dir, '09 Email signature'))
open(os.path.join(esig, 'Kreislo - Email signature.html'), 'w').write(f"""<!-- Kreislo email signature. Gmail: Settings -> See all settings -> Signature -> Create new.
     1. Upload "Kreislo - Email signature logo - 600px wide (show at 300px).png" somewhere public (a draft Blogger post works)
        and replace LOGO_IMAGE_LINK below with its https:// address.
     2. Change name, phone and links. 3. Open this file in a browser, select all (Ctrl+A), copy, paste into Gmail. -->
<table cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:{INK};line-height:1.5;">
  <tr>
    <td style="padding-right:16px;border-right:3px solid {ORANGE};vertical-align:middle;">
      <img src="LOGO_IMAGE_LINK" alt="Kreislo" width="150" style="display:block;width:150px;height:auto;border:0;">
    </td>
    <td style="padding-left:16px;vertical-align:middle;">
      <div style="font-size:15px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">Your Name</div>
      <div style="color:{ORANGE};font-weight:bold;margin-bottom:6px;">Founder · Kreislo</div>
      <div>+49 157 0000000 · <a href="https://wa.me/491570000000" style="color:{INK};">WhatsApp</a></div>
      <div><a href="https://kreislo.de" style="color:{INK};">kreislo.de</a></div>
      <div style="color:{STONE};font-size:12px;">Keep good things moving.</div>
    </td>
  </tr>
</table>
""")
shutil.copy(os.path.join(MASTERS, 'kreislo-logo-primary-colour-on-light.svg'), os.path.join(esig, 'Kreislo - Email signature logo - PROJECT (editable).svg'))
jobs.append(dict(kind='png', src=os.path.join(esig, 'Kreislo - Email signature logo - PROJECT (editable).svg'),
                 out=os.path.join(esig, 'Kreislo - Email signature logo - 600px wide (show at 300px).png'), width=600))
readme(esig, 'Email signature', 'Your signature under every email (Gmail, Outlook, Apple Mail).',
       [('Kreislo - Email signature.html', 'The signature: open in a browser, copy, paste into the signature settings.'),
        ('Kreislo - Email signature logo - 600px wide (show at 300px).png', 'The logo picture the signature shows.'),
        ('Kreislo - Email signature logo - PROJECT (editable).svg', 'Editable logo original.')])

# colours, fonts, guidelines: each its own folder
COLOURS = [
    ('Kreislo Orange', ORANGE, (255, 51, 0), '0 / 85 / 100 / 0', 'close to Pantone 172 C (check on a printed swatch)', 'Accent: the arrow, buttons, prices, highlights. About 10% of a design.'),
    ('Ink', INK, (17, 17, 17), '0 / 0 / 0 / 95 (large areas: 60 / 40 / 40 / 100)', 'Black 6 C', 'Text, header, footer, dark backgrounds. About 30%.'),
    ('Paper', PAPER, (247, 245, 242), '0 / 1 / 2 / 3', '—', 'Warm background for sections, cards and print. About 60% with white.'),
    ('Stone', STONE, (107, 107, 107), '0 / 0 / 0 / 58', 'Cool Gray 10 C', 'Small text, captions, the tagline.'),
    ('Blush', BLUSH, (255, 227, 217), '0 / 11 / 15 / 0', '—', 'Soft tint of the orange for notes and badges.'),
    ('White', WHITE, (255, 255, 255), '0 / 0 / 0 / 0', '—', 'Backgrounds, text on Ink.')]
cdir = mk(KIT, 'C - Colours'); designs.append((KIT, 'C - Colours'))
open(os.path.join(cdir, 'Kreislo colours - for websites.css'), 'w').write(':root {\n' + ''.join(f'  --kreislo-{n.split()[-1].lower()}: {h};\n' for n, h, *_ in COLOURS) + '}\n')
json.dump([{'name': n, 'hex': h, 'rgb': r, 'cmyk': c, 'pantone': p, 'use': u} for n, h, r, c, p, u in COLOURS],
          open(os.path.join(cdir, 'Kreislo colours - data.json'), 'w'), indent=2, ensure_ascii=False)
open(os.path.join(cdir, 'Kreislo colours - for Inkscape and GIMP.gpl'), 'w').write('GIMP Palette\nName: Kreislo\nColumns: 6\n#\n' + ''.join(f'{r[0]:3d} {r[1]:3d} {r[2]:3d}\t{n}\n' for n, h, r, *_ in COLOURS))
blocks = b''
for n_, h, r, *_ in COLOURS:
    nm = (n_ + '\0').encode('utf-16-be')
    body = struct.pack('>H', len(n_) + 1) + nm + b'RGB ' + struct.pack('>fff', *(v / 255 for v in r)) + struct.pack('>H', 2)
    blocks += struct.pack('>HI', 1, len(body)) + body
open(os.path.join(cdir, 'Kreislo colours - for Adobe (Illustrator, Photoshop).ase'), 'wb').write(b'ASEF' + struct.pack('>HHI', 1, 0, len(COLOURS)) + blocks)
json.dump([{'name': n, 'hex': h, 'rgb': r, 'cmyk': c, 'pantone': p, 'use': u} for n, h, r, c, p, u in COLOURS], open(os.path.join(ROOT, 'colours.json'), 'w'), indent=2, ensure_ascii=False)
sw = ''
for i, (n_, h, r, c, p, u) in enumerate(COLOURS):
    x = 40 + i * 260; tc = WHITE if n_ in ('Kreislo Orange', 'Ink', 'Stone') else INK
    sw += f'<rect x="{x}" y="40" width="240" height="240" rx="18" fill="{h}"' + (' stroke="#DDDDDD"' if n_ in ('White', 'Paper') else '') + '/>'
    sw += text(x + 20, 240, n_, 26, 'o', tc) + text(x + 20, 268, h, 18, 'os', tc, weight=600)
    sw += text(x, 318, f'RGB {r[0]} {r[1]} {r[2]}', 17, 'os', STONE) + text(x, 344, f'CMYK {c.split(" (")[0]}', 17, 'os', STONE)
open(os.path.join(cdir, 'Kreislo colours - swatches PROJECT (editable).svg'), 'w').write(svgdoc(1620, 380, f'<rect width="1620" height="380" fill="{WHITE}"/>' + sw, 'px'))
jobs.append(dict(kind='png', src=os.path.join(cdir, 'Kreislo colours - swatches PROJECT (editable).svg'), out=os.path.join(cdir, 'Kreislo colours - swatches.png'), width=1620, fonts=True))
readme(cdir, 'Colours', 'The brand colours in every format.', [
    ('Kreislo colours - swatches.png', 'The palette at a glance with HEX, RGB, CMYK.'),
    ('Kreislo colours - for Adobe (Illustrator, Photoshop).ase', 'Swatches panel -> menu -> Import Swatches.'),
    ('Kreislo colours - for Inkscape and GIMP.gpl', 'Palette file for Inkscape, GIMP, Krita.'),
    ('Kreislo colours - for websites.css', 'CSS variables.'), ('Kreislo colours - data.json', 'All values for developers.')],
    'Canva: Brand Kit -> Colours -> add #FF3300, #111111, #F7F5F2, #6B6B6B, #FFE3D9.')
fdir = mk(KIT, 'D - Fonts'); designs.append((KIT, 'D - Fonts'))
open(os.path.join(fdir, 'READ ME.txt'), 'w').write("""KREISLO - FONTS (both free, also for business use: SIL Open Font License)

Oswald SemiBold (600)  - the logo letters, headlines, buttons. Headlines in CAPITALS with a little letter spacing.
   Download: https://fonts.google.com/specimen/Oswald  ("Get font" -> "Download all")
Open Sans  (400 Regular, 600 SemiBold)  - body text, product descriptions, emails, letters.
   Download: https://fonts.google.com/specimen/Open+Sans

Install: unzip, double-click each .ttf file -> Install (Windows) / Install Font (Mac).
Canva and Google Docs: both fonts are already in the font list, nothing to install.
Your website already uses both fonts.
Fallbacks when a font isn't available: Arial Narrow (headlines), Arial (text).
""")
gdir = mk(KIT, 'A - Brand guidelines'); designs.append((KIT, 'A - Brand guidelines'))
jobs.append(dict(kind='png', src=os.path.join(MASTERS, 'kreislo-logo-primary-colour-on-light.svg'), out=os.path.join(ROOT, 'masters_png_letterhead.png'), width=1600))  # for the Word letterhead
json.dump({'jobs': jobs, 'gf': GF, 'post': post, 'designs': designs, 'previews': previews}, open(os.path.join(ROOT, 'jobs.json'), 'w'), indent=1)
print(len(designs), 'design folders;', len(jobs), 'render jobs')
