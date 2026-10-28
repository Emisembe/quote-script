"""The EFIC logo guidelines as one HTML page of A4 sheets (used by build_logo.py)."""
import re

NAVY, GOLD, DEEP, OFF, GREY, WHITE = '#14213D', '#E7B165', '#0F1A30', '#F7F6F2', '#4A5568', '#FFFFFF'


def inline(svg, h=None, w=None, style=''):
    """An outlined SVG sized for the page (height or width in mm)."""
    size = ('height:%smm;width:auto' % h) if h else ('width:%smm;height:auto' % w)
    return re.sub(r'width="[\d.]+" height="[\d.]+"', 'style="display:block;%s;%s"' % (size, style), svg, 1)


def swatch(name, hexv, note, dark=True):
    r, g, b = (int(hexv[i:i + 2], 16) for i in (1, 3, 5))
    fg = WHITE if dark else NAVY
    return ('<div class="sw"><div class="chip" style="background:%s;color:%s">%s</div>'
            '<p><b>HEX</b> %s<br><b>RGB</b> %d, %d, %d<br>%s</p></div>') % (hexv, fg, name, hexv, r, g, b, note)


def page(svgs, icon_svg, marks, X):
    P = lambda c: svgs[('primary', c)]
    H = lambda c: svgs[('horizontal', c)]
    Wm = lambda c: svgs[('wordmark', c)]
    box = marks['primary'].box
    pw, ph = box[2] - box[0], box[3] - box[1]

    # clear-space drawing: the logo with an X margin, X boxes in the corners
    k = 120 / (pw + 2 * X)                      # mm per logo unit, 120 mm wide
    xm = X * k
    clear = ('<div class="clear" style="width:%.2fmm;height:%.2fmm">'
             '<div class="cs-in" style="inset:%.2fmm">%s</div>'
             '<span class="xb" style="left:0;top:0;width:%.2fmm;height:%.2fmm">X</span>'
             '<span class="xb" style="right:0;bottom:0;width:%.2fmm;height:%.2fmm">X</span></div>') % (
        (pw + 2 * X) * k, (ph + 2 * X) * k, xm, inline(P('positive'), w=pw * k), xm, xm, xm, xm)

    donts = [
        ('Don\'t stretch or squash it', '<div style="transform:scale(1.75,.8);transform-origin:center">%s</div>' % inline(P('positive'), h=17)),
        ('Don\'t change the colours', inline(P('positive').replace(NAVY, GREY).replace(GOLD, NAVY), h=22)),
        ('Don\'t add shadows, glows or outlines', inline(P('positive'), h=22, style='filter:drop-shadow(1.2mm 1.2mm 1mm rgba(0,0,0,.55))')),
        ('Don\'t rotate it', '<div style="transform:rotate(-12deg)">%s</div>' % inline(P('positive'), h=20)),
        ('Don\'t place it on busy backgrounds', '<div class="busy">%s</div>' % inline(P('white'), h=20)),
        ('Don\'t retype it in another font', '<div class="retyped"><b>EFIC</b><i></i><span>Efic Consultancy Ltd</span></div>'),
        ('Don\'t put the navy logo on navy', '<div style="background:%s;padding:3mm">%s</div>' % (NAVY, inline(P('navy'), h=18))),
        ('Don\'t crowd it: keep the clear space', '<div class="crowd">%s<span>Text too close</span></div>' % inline(P('positive'), h=18)),
    ]

    files = [
        ('Website (Blogger header, on the navy bar)', 'web/blogger-header-reverse-600px.png'),
        ('Website on a white header', 'web/blogger-header-positive-600px.png'),
        ('Browser tab icon (Blogger favicon)', 'web/favicon.ico'),
        ('Phone home-screen icon', 'web/apple-touch-icon.png, web/icon-192.png, web/icon-512.png'),
        ('Facebook, LinkedIn, X, YouTube, WhatsApp profile', 'social/profile-picture-efic.png'),
        ('Cover / banner images', 'social/*-cover.png, *-banner.png, *-header.png'),
        ('Email signature', 'email/email-signature-white.png'),
        ('Letters, invoices, Word, PowerPoint', 'png/primary/efic-primary-positive-1000px.png'),
        ('Printer, sign-maker, embroidery, merchandise', 'pdf/ or svg/ (vector, any size)'),
        ('Edit or make a new version', 'efic-logo-master.svg in Inkscape'),
    ]

    sheets = []
    # 1 cover
    sheets.append('''<section class="sheet cover">
  <div class="cover-logo">%s</div>
  <div class="cover-foot"><h1>Logo Guidelines</h1><p>EFIC Consultancy Ltd &middot; Version 1.0 &middot; October 2026</p></div>
</section>''' % inline(P('reverse'), w=130))

    # 2 versions
    sheets.append('''<section class="sheet">
  <h2>The logo versions</h2>
  <p class="lead">One logo, four arrangements. Use the <b>primary logo</b> whenever there is room. Pick a smaller arrangement only when the space asks for it.</p>
  <div class="grid2">
    <figure><div class="tile">%s</div><figcaption><b>Primary (stacked)</b> &mdash; the main logo: documents, cover pages, signs, profile pages.</figcaption></figure>
    <figure><div class="tile">%s</div><figcaption><b>Horizontal</b> &mdash; wide, low spaces: website header, email signature, banners, letterhead.</figcaption></figure>
    <figure><div class="tile">%s</div><figcaption><b>Wordmark</b> &mdash; EFIC on its own, when the full name is already nearby or the logo is small (stamps, pens, social posts).</figcaption></figure>
    <figure><div class="tile">%s</div><figcaption><b>Icon</b> &mdash; very small spaces: browser tab, app icon, watermark. Never instead of the logo on documents.</figcaption></figure>
  </div>
</section>''' % (inline(P('positive'), w=62), inline(H('positive'), w=72), inline(Wm('positive'), w=50), inline(icon_svg, w=30)))

    # 3 colour versions
    cells = []
    for c, bg, text in [('navy-bg', WHITE, 'Full colour on its own navy panel. Works on any background, including photos.'),
                        ('positive', WHITE, 'Navy and gold on white or light backgrounds (Off-White #F7F6F2).'),
                        ('reverse', NAVY, 'White and gold on navy or other dark backgrounds.'),
                        ('white', DEEP, 'All white: dark photos, one-colour printing on dark material, embroidery.'),
                        ('navy', OFF, 'All navy: one-colour printing, stamps, light-coloured merchandise.'),
                        ('black', WHITE, 'All black: fax, newspaper adverts, black-only printers, engraving.')]:
        cells.append('<figure><div class="tile" style="background:%s">%s</div><figcaption>%s</figcaption></figure>' % (
            bg, inline(P(c), w=52 if c != 'navy-bg' else 56), text))
    sheets.append('''<section class="sheet">
  <h2>Colour versions</h2>
  <p class="lead">Choose the version by the background, so the logo always stands out clearly.</p>
  <div class="grid2 six">%s</div>
</section>''' % ''.join(cells))

    # 4 clear space and minimum size
    sheets.append('''<section class="sheet">
  <h2>Clear space</h2>
  <p class="lead">Keep an empty margin around the logo at least the size of <b>X</b> &mdash; the height of the capital E in &ldquo;Efic Consultancy Ltd&rdquo;. Nothing else (text, edges, other logos) goes inside it. The transparent files already include this margin.</p>
  %s
  <h2 style="margin-top:12mm">Minimum size</h2>
  <p class="lead">Below these sizes the small words stop being readable. Switch to the next smaller version instead.</p>
  <table class="t">
    <tr><th>Version</th><th>Print (width)</th><th>Screen (width)</th></tr>
    <tr><td>Primary (stacked)</td><td>30 mm</td><td>140 px</td></tr>
    <tr><td>Horizontal</td><td>45 mm</td><td>200 px</td></tr>
    <tr><td>Wordmark</td><td>15 mm</td><td>60 px</td></tr>
    <tr><td>Icon</td><td>5 mm</td><td>16 px</td></tr>
  </table>
</section>''' % clear)

    # 5 colours and fonts
    sheets.append('''<section class="sheet">
  <h2>Colours</h2>
  <p class="lead">The same colours as the EFIC website, letters and documents.</p>
  <div class="sws">%s%s%s%s</div>
  <p class="small">For printing, send the PDF files and ask the printer to match these colours and show you a proof first. Every printer converts colours slightly differently, so a proof avoids surprises.</p>
  <p class="small"><b>Gold is for the rule and accents, never for text on white.</b> Gold text on a white background is too faint to read, and white text on gold is too.</p>
  <h2 style="margin-top:10mm">Fonts</h2>
  <table class="t">
    <tr><th>Use</th><th>Font</th></tr>
    <tr><td>EFIC in the logo</td><td class="ss9">Source Sans 3 Black</td></tr>
    <tr><td>&ldquo;Efic Consultancy Ltd&rdquo; in the logo</td><td class="ss4">Source Sans 3 Regular</td></tr>
    <tr><td>Headings on the website and documents</td><td class="mont">Montserrat</td></tr>
    <tr><td>Body text in letters and documents</td><td>Calibri or Arial</td></tr>
  </table>
  <p class="small">The logo fonts are free (SIL Open Font License) and included in the <b>fonts</b> folder. You never need to type the logo yourself: always use the logo files.</p>
</section>''' % (swatch('Navy', NAVY, 'Main colour: the logo, headings, backgrounds'),
                 swatch('Gold', GOLD, 'Accent: the rule, highlights, buttons on navy', dark=False),
                 swatch('White', WHITE, 'Logo text on navy', dark=False),
                 swatch('Deep Navy', DEEP, 'Darker backgrounds, footers')))

    # 6 don'ts
    sheets.append('''<section class="sheet">
  <h2>Please don&rsquo;t</h2>
  <p class="lead">The logo only works if it always looks the same. Use the files as they are.</p>
  <div class="grid2 donts">%s</div>
</section>''' % ''.join('<figure><div class="tile">%s</div><figcaption><span class="no">&times;</span> %s</figcaption></figure>' % (d, t) for t, d in donts))

    # 7 which file
    sheets.append('''<section class="sheet">
  <h2>Which file do I use?</h2>
  <table class="t files">%s</table>
  <h2 style="margin-top:10mm">File types</h2>
  <table class="t">
    <tr><td><b>SVG</b></td><td>Vector: sharp at any size. Websites, Inkscape, designers.</td></tr>
    <tr><td><b>PDF</b></td><td>Vector: printers, sign-makers, Word and PowerPoint (Insert &rarr; Picture).</td></tr>
    <tr><td><b>PNG</b></td><td>Picture with a transparent background: anywhere that won&rsquo;t take SVG. Use the biggest size you need; never enlarge a small PNG.</td></tr>
    <tr><td><b>ICO</b></td><td>The browser-tab icon.</td></tr>
  </table>
  <p class="small" style="margin-top:8mm">Questions about the logo: askeficc@gmail.com &middot; eficc.blogspot.com</p>
</section>''' % ''.join('<tr><td>%s</td><td><code>%s</code></td></tr>' % r for r in files))

    n = len(sheets)
    body = '\n'.join(s.replace('</section>', '<div class="pno">EFIC Logo Guidelines &middot; %d / %d</div></section>' % (i + 1, n), 1)
                     if i else s for i, s in enumerate(sheets))
    return TEMPLATE.replace('{{BODY}}', body)


TEMPLATE = '''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EFIC Logo Guidelines</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@600;700;800&display=swap" rel="stylesheet">
<style>
@font-face{font-family:"Source Sans 3";font-weight:400;src:url(../fonts/SourceSans3-Regular.ttf)}
@font-face{font-family:"Source Sans 3";font-weight:600;src:url(../fonts/SourceSans3-Semibold.ttf)}
@font-face{font-family:"Source Sans 3";font-weight:700;src:url(../fonts/SourceSans3-Bold.ttf)}
@font-face{font-family:"Source Sans 3";font-weight:900;src:url(../fonts/SourceSans3-Black.ttf)}
@page{size:A4;margin:0}
*{box-sizing:border-box}
html{background:#d9d9d9}
body{margin:0;font:11pt/1.45 "Source Sans 3",Arial,sans-serif;color:#14213D;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.sheet{width:210mm;height:297mm;margin:10mm auto;background:#fff;padding:22mm 20mm;position:relative;overflow:hidden;page-break-after:always;break-after:page}
.sheet:last-child{page-break-after:auto;break-after:auto}
@media print{html{background:#fff}.sheet{margin:0}}
@media screen and (max-width:820px){.sheet{transform-origin:top left}}
h1,h2{font-family:Montserrat,Arial,sans-serif;font-weight:800;margin:0 0 4mm}
h2{font-size:19pt;padding-bottom:3mm;position:relative}
h2:after{content:"";position:absolute;left:0;bottom:0;width:22mm;height:1.2mm;border-radius:1mm;background:#E7B165}
.lead{font-size:12pt;color:#4A5568;margin:0 0 8mm;max-width:150mm}
.small{font-size:10pt;color:#4A5568;max-width:160mm}
.cover{background:#14213D;color:#fff;display:flex;flex-direction:column;justify-content:center;align-items:center}
.cover-foot{position:absolute;left:20mm;right:20mm;bottom:22mm;border-top:.6mm solid #E7B165;padding-top:5mm}
.cover-foot h1{font-size:24pt;margin:0}
.cover-foot p{margin:1mm 0 0;color:#F7F6F2}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:7mm}
.tile{height:52mm;background:#F7F6F2;border-radius:2mm;display:flex;align-items:center;justify-content:center;overflow:hidden}
.six .tile{height:46mm}
.donts .tile{height:38mm;background:#fff;border:.3mm solid #e2e2e2}
figure{margin:0}
figcaption{font-size:10pt;margin-top:2.5mm;color:#4A5568}
figcaption b{color:#14213D}
.no{display:inline-block;width:5mm;height:5mm;line-height:5mm;text-align:center;border-radius:50%;background:#14213D;color:#fff;font-weight:700;margin-right:1mm}
.busy{padding:4mm 6mm;background:repeating-linear-gradient(45deg,#E7B165 0 4mm,#F7F6F2 4mm 8mm,#4A5568 8mm 12mm)}
.retyped{text-align:center;font-family:"Times New Roman",serif}
.retyped b{display:block;font-size:30pt;line-height:1}
.retyped i{display:block;height:.6mm;background:#E7B165;margin:1mm 0}
.retyped span{font-style:italic}
.crowd{position:relative}
.crowd span{position:absolute;left:100%;top:30%;margin-left:-1mm;white-space:nowrap;font-size:9pt;background:#14213D;color:#fff;padding:.5mm 1.5mm}
.clear{position:relative;margin:2mm auto 0;outline:.3mm dashed #4A5568;background:repeating-linear-gradient(45deg,#F7F6F2 0 2mm,#fff 2mm 4mm)}
.cs-in{position:absolute;background:#fff;outline:.3mm solid #E7B165;display:flex;align-items:center;justify-content:center}
.xb{position:absolute;display:flex;align-items:center;justify-content:center;background:#14213D;color:#fff;font:700 9pt Montserrat,Arial,sans-serif}
.t{border-collapse:collapse;width:100%;font-size:10.5pt}
.t th,.t td{text-align:left;padding:2.2mm 3mm;border-bottom:.3mm solid #e2e2e2;vertical-align:top}
.t th{font-family:Montserrat,Arial,sans-serif;font-size:9.5pt;background:#14213D;color:#fff}
.files td:first-child{width:46%}
code{font-family:Consolas,monospace;font-size:9pt;background:#F7F6F2;padding:.3mm 1mm;border-radius:1mm}
.ss9{font-weight:900}.ss4{font-weight:400}.mont{font-family:Montserrat,Arial,sans-serif;font-weight:700}
.sws{display:grid;grid-template-columns:repeat(4,1fr);gap:5mm;margin-bottom:6mm}
.chip{height:30mm;border-radius:2mm;display:flex;align-items:flex-end;padding:3mm;font:700 10pt Montserrat,Arial,sans-serif;border:.3mm solid #e2e2e2}
.sw p{font-size:9pt;margin:2mm 0 0;color:#4A5568}
.sw b{color:#14213D}
.pno{position:absolute;bottom:10mm;right:20mm;font-size:8.5pt;color:#4A5568}
</style></head><body>
{{BODY}}
</body></html>
'''
