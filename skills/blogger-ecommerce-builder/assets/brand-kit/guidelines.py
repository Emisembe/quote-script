"""Kreislo brand guidelines as an A4 landscape HTML (rendered to PDF by guidelines.js)."""
import os, re, sys, json
ROOT = sys.argv[1]
SVG = os.path.join(ROOT, 'masters')
PREV = json.load(open(os.path.join(ROOT, 'jobs.json')))['previews']
INK, ORANGE, PAPER, STONE, BLUSH = '#111111', '#FF3300', '#F7F5F2', '#6B6B6B', '#FFE3D9'
def logo(name, width, style=''):
    s = open(os.path.join(SVG, name + '.svg')).read()
    s = re.sub(r'<title>.*?</title>', '', s)
    return s.replace('<svg ', f'<svg style="width:{width};height:auto;display:block;{style}" ', 1).replace(re.search(r'width="[\d.]+" height="[\d.]+"', s).group(0), '', 1)
colours = json.load(open(os.path.join(ROOT, 'colours.json')))
def page(inner, bg='#fff', cls=''):
    return f'<section class="page {cls}" style="background:{bg}">{inner}<div class="foot">Kreislo · Brand guidelines 1.0</div></section>'
def head(n, t, sub=''):
    return f'<div class="eyebrow">{n}</div><h2>{t}</h2>' + (f'<p class="lead">{sub}</p>' if sub else '')
P = []
P.append(page(f'''<div class="cover">{logo("kreislo-logo-primary-colour-on-dark", "520px")}
<div class="cover-meta"><b>BRAND GUIDELINES</b><br>Version 1.0 · November 2026</div></div>''', INK, 'dark'))
P.append(page(head('01', 'The idea', 'Kreislo comes from the German word <b>Kreislauf</b>: cycle, circulation. Say it <b>KRICE-low</b>. We keep good things moving: second-hand goods from Germany find their next owner, here or in Africa; digital products reach people instantly; and parcels leave Gießen well packed. Every item gets another round.') + f'''
<div class="cols3">
<div class="card"><h3>Second round</h3><p>From clothes to washing machines: good things get another life, in Germany or in Africa. Less waste, fair prices.</p></div>
<div class="card"><h3>Personal</h3><p>Real people answer: on WhatsApp, Telegram, by phone or video call. Every order is confirmed personally.</p></div>
<div class="card"><h3>Honest</h3><p>We describe condition exactly, show every flaw, and keep our promises on delivery and download.</p></div>
</div>
<div class="cols2" style="margin-top:22px">
<div><h3>How we sound</h3><ul><li>Warm and direct: "Hi Anna, your washing machine leaves Gießen today."</li><li>Short sentences, everyday words.</li><li>Honest about condition: "small scratch on the left side".</li><li>We say "second-hand" or "pre-owned", never "old" or "junk".</li></ul></div>
<div><h3>Tagline</h3><table class="t"><tr><td>English</td><td><b>Keep good things moving</b></td></tr><tr><td>German</td><td><b>Gute Dinge in Bewegung</b></td></tr><tr><td>French</td><td><b>Les bonnes choses continuent</b></td></tr><tr><td>Portuguese</td><td><b>Coisas boas em movimento</b></td></tr><tr><td>Swahili</td><td><b>Vitu vizuri viendelee kusonga</b></td></tr></table>
<p class="small">The logo files carry the English tagline. Use the translations in texts and posts; have a native speaker check them before printing.</p></div></div>'''))
P.append(page(head('02', 'Logo versions', 'Always use the original files from the logo project; never retype or redraw the logo.') + f'''
<div class="grid2">
<div class="tile">{logo("kreislo-logo-primary-colour-on-light", "78%")}<p><b>Primary</b>: website, print, documents. First choice.</p></div>
<div class="tile">{logo("kreislo-logo-stacked-colour-on-light", "38%")}<p><b>Stacked</b>: square spaces, business card, packaging.</p></div>
<div class="tile">{logo("kreislo-wordmark-colour-on-light", "70%")}<p><b>Wordmark</b>: small sizes and the website header (tagline too small to read).</p></div>
<div class="tile">{logo("kreislo-symbol-colour-on-light", "26%")}<p><b>Symbol</b>: browser icon, profile pictures, stickers, watermarks.</p></div>
</div>'''))
P.append(page(head('03', 'Clear space and minimum size', 'Keep free space around the logo of at least <b>x</b> = half the height of the letters. Nothing (text, edges, photos) may come closer.') + f'''
<div class="cols2"><div class="tile clear"><div class="cs">{logo("kreislo-logo-primary-colour-on-light", "100%")}</div><span class="x xt">x</span><span class="x xl">x</span><span class="x xr">x</span><span class="x xb">x</span></div>
<div><h3>Minimum sizes</h3><table class="t"><tr><th></th><th>Screen</th><th>Print</th></tr>
<tr><td>Primary logo</td><td>140 px wide</td><td>35 mm wide</td></tr><tr><td>Wordmark</td><td>90 px wide</td><td>22 mm wide</td></tr>
<tr><td>Stacked logo</td><td>90 px wide</td><td>22 mm wide</td></tr><tr><td>Symbol</td><td>16 px</td><td>6 mm</td></tr></table>
<p class="small">Below these sizes use the next smaller version: primary → wordmark → symbol.</p></div></div>'''))
P.append(page(head('04', 'Colour versions', 'Pick the version that gives the strongest contrast with the background.') + f'''
<div class="grid4">
<div class="sw" style="background:#fff;border:1px solid #e5e5e5">{logo("kreislo-logo-primary-colour-on-light", "84%")}<p>Colour on light</p></div>
<div class="sw" style="background:{INK}">{logo("kreislo-logo-primary-colour-on-dark", "84%")}<p style="color:#ccc">Colour on dark</p></div>
<div class="sw" style="background:{BLUSH}">{logo("kreislo-logo-primary-black", "84%")}<p>Black: one-colour print, stamps</p></div>
<div class="sw" style="background:{ORANGE}">{logo("kreislo-logo-primary-white", "84%")}<p style="color:#fff">White: on orange or photos</p></div>
</div>'''))
sw = ''.join(f'''<div class="col"><div class="chip" style="background:{c["hex"]};{'border:1px solid #ddd;' if c["hex"] in ('#FFFFFF','#F7F5F2') else ''}"></div>
<b>{c["name"]}</b><span>HEX {c["hex"]}</span><span>RGB {" ".join(map(str,c["rgb"]))}</span><span>CMYK {c["cmyk"]}</span><span>Pantone {c["pantone"]}</span><em>{c["use"]}</em></div>''' for c in colours)
P.append(page(head('05', 'Colours') + f'<div class="colours">{sw}</div><div class="ratio"><span style="flex:6;background:{PAPER}">Paper / White 60%</span><span style="flex:3;background:{INK};color:#fff">Ink 30%</span><span style="flex:1;background:{ORANGE};color:#fff">10%</span></div><p class="small">CMYK and Pantone values are close matches for print; ask your printer for a proof. Files: Colours/ (CSS, JSON, Adobe .ase, GIMP/Inkscape .gpl).</p>'))
P.append(page(head('06', 'Typography', 'Two free Google fonts. Both are also in Canva and already on the website.') + f'''
<div class="cols2"><div class="type"><div class="spec">Oswald SemiBold · headlines</div><div style="font-family:Oswald;font-weight:600;font-size:64px;line-height:1;letter-spacing:.04em">NEW IN THIS WEEK</div>
<div style="font-family:Oswald;font-weight:600;font-size:30px;letter-spacing:.06em;margin-top:10px;color:{ORANGE}">ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789 €</div>
<p class="small">Capitals, letter spacing +4 to +6 %. Headlines, buttons, prices.</p></div>
<div class="type"><div class="spec">Open Sans · text</div><p style="font-family:'Open Sans';font-size:19px;line-height:1.6;margin:0">Washing machine, 7 kg, energy class A. Very good condition, tested and cleaned. Pickup in Gießen or delivery by our partner.</p>
<p style="font-family:'Open Sans';font-weight:600;font-size:19px;margin:10px 0 0">SemiBold for emphasis and labels.</p>
<p class="small">Regular 400 for text, SemiBold 600 for emphasis. Line height 1.5 to 1.7.</p></div></div>'''))
dont = [('Stretched', 'transform:scaleX(1.5)'), ('Recoloured', 'filter:hue-rotate(160deg)'), ('Rotated', 'transform:rotate(-12deg)'),
        ('Shadows or effects', 'filter:drop-shadow(6px 6px 3px rgba(0,0,0,.6))'), ('Busy background', ''), ('Low contrast', '')]
dd = ''
for t, st in dont:
    bg = 'background:repeating-linear-gradient(45deg,#d9a,#d9a 12px,#8bd 12px,#8bd 24px);' if t == 'Busy background' else ('background:#444;' if t == 'Low contrast' else '')
    name = 'kreislo-logo-primary-black' if t == 'Low contrast' else 'kreislo-logo-primary-colour-on-light'
    dd += f'<div class="dont"><div class="dbox" style="{bg}">{logo(name, "80%", st)}</div><p>✕ {t}</p></div>'
P.append(page(head('07', 'Please don’t') + f'<div class="grid3">{dd}</div>'))
imgs = ''.join(f'<img src="file://{os.path.abspath(os.path.join(ROOT, PREV[k]))}" class="{"wide" if k in ("05","07") else ""}">' for k in ('01','02','05','06','07') if k in PREV)
P.append(page(head('08', 'In use', 'Templates for all of these are in the Brand Kit, folder B - Templates.') + f'<div class="apps">{imgs}</div>'))
rows = [('Website header (Blogger: Layout → Header → Image, "instead of title")', 'Logo Project → 01 Website header logo'),
        ('Browser tab icon (Blogger: Settings → Favicon)', 'Logo Project → 03 Favicon (browser tab icon)'),
        ('Phone home screen icon', 'Logo Project → 04 Phone home-screen icon'),
        ('Email signature', 'Logo Project → 05 Email signature logo, Brand Kit → 09 Email signature'),
        ('Letters, invoices, documents', 'Logo Project → 06 Letterhead logo, Brand Kit → 08 Letterhead (A4)'),
        ('Instagram, WhatsApp, Telegram, Facebook profile picture', 'Logo Project → 07 / 08 Social media profile picture'),
        ('Business cards, packaging', 'Logo Project → 09 Business card logo, Brand Kit → 05 Business card'),
        ('Watermark on product photos', 'Logo Project → 10 Product photo watermark'),
        ('Stamps, bags, boxes (one colour)', 'Logo Project → 11 One-colour stamp and packaging logo'),
        ('Designers, sign makers, embroidery', 'the PROJECT (.svg) or PRINT (.pdf) file of any design')]
P.append(page(head('09', 'Which file for what', 'Every design has its own folder with an editable PROJECT file, ready-made files and a READ ME.') + '<table class="t big">' + ''.join(f'<tr><td>{a}</td><td>{b}</td></tr>' for a, b in rows) + '''</table><p class="small" style="margin-top:18px">Before you register the name or print in quantity: check that "Kreislo" is free for retail (class 35), transport and storage (class 39) and digital products (class 9) at dpma.de and in TMview (tmdn.org), and secure the web address and social handles.</p>'''))
css = f'''@page{{size:297mm 210mm;margin:0}}*{{box-sizing:border-box}}body{{margin:0;font-family:"Open Sans",Arial,sans-serif;color:{INK}}}
.page{{width:297mm;height:210mm;padding:18mm 20mm 16mm;position:relative;overflow:hidden;page-break-after:always}}
.foot{{position:absolute;left:20mm;bottom:8mm;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:#999}}
.dark .foot{{color:#666}}.cover{{height:100%;display:flex;flex-direction:column;justify-content:center;gap:40px}}
.cover-meta{{color:#bbb;font-size:13px;letter-spacing:.18em;line-height:1.9}}.cover-meta b{{color:{ORANGE};font-family:Oswald;font-weight:600;font-size:16px}}
.eyebrow{{font-family:Oswald;font-weight:600;color:{ORANGE};letter-spacing:.2em;font-size:14px}}
h2{{font-family:Oswald;font-weight:600;font-size:40px;letter-spacing:.04em;text-transform:uppercase;margin:2px 0 8px}}
h3{{font-family:Oswald;font-weight:600;letter-spacing:.05em;text-transform:uppercase;font-size:18px;margin:0 0 8px}}
.lead{{font-size:15px;line-height:1.6;max-width:200mm;color:#333;margin:0 0 16px}}.small{{font-size:11px;color:{STONE};line-height:1.6}}
ul{{margin:0;padding-left:18px;font-size:13px;line-height:1.8}}p{{font-size:13px;line-height:1.6}}
.cols3{{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}}.cols2{{display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:start}}
.card{{background:{PAPER};border-radius:12px;padding:16px 18px;border-top:4px solid {ORANGE}}}
.grid2{{display:grid;grid-template-columns:1fr 1fr;gap:14px}}.tile{{background:{PAPER};border-radius:12px;padding:16px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60mm}}
.tile p{{margin:10px 0 0;text-align:center;font-size:12px}}
.clear{{position:relative;padding:14mm;background:#fff;border:1px dashed {ORANGE};min-height:0}}.cs{{width:100%;outline:1px solid #eee}}
.x{{position:absolute;font-family:Oswald;color:{ORANGE};font-size:14px}}.xt{{top:3mm;left:50%}}.xb{{bottom:3mm;left:50%}}.xl{{left:4mm;top:50%}}.xr{{right:4mm;top:50%}}
.t{{border-collapse:collapse;font-size:13px;width:100%}}.t td,.t th{{border-bottom:1px solid #e5e5e5;padding:7px 8px;text-align:left;vertical-align:top}}.t th{{font-family:Oswald;font-weight:600;letter-spacing:.05em}}
.t.big td{{font-size:13px;padding:10px 8px}}
.grid4{{display:grid;grid-template-columns:1fr 1fr;gap:12px}}.sw{{border-radius:12px;height:58mm;display:flex;flex-direction:column;align-items:center;justify-content:center}}.sw p{{margin:10px 0 0;font-size:11px}}
.colours{{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}}.col{{display:flex;flex-direction:column;font-size:10.5px;line-height:1.5}}.col b{{font-family:Oswald;font-weight:600;font-size:15px;letter-spacing:.04em;margin:8px 0 2px}}
.col em{{color:{STONE};font-style:normal;margin-top:6px}}.chip{{height:34mm;border-radius:10px}}
.ratio{{display:flex;height:12mm;border-radius:8px;overflow:hidden;margin-top:14px;font-size:11px;font-weight:600}}.ratio span{{display:flex;align-items:center;padding-left:10px}}
.type{{background:{PAPER};border-radius:12px;padding:18px}}.spec{{font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:{STONE};margin-bottom:10px}}
.grid3{{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}}.dbox{{height:40mm;border-radius:10px;background:{PAPER};display:flex;align-items:center;justify-content:center;overflow:hidden}}
.dont p{{color:#c00;font-weight:600;font-size:12px;margin:6px 0 0}}
.apps{{display:flex;flex-wrap:wrap;gap:10px;align-items:center}}.apps img{{height:55mm;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,.15)}}.apps img.wide{{height:40mm}}'''
html = f'<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&family=Open+Sans:wght@400;600;700&display=swap"><style>{css}</style></head><body>{"".join(P)}</body></html>'
out = os.path.join(ROOT, '_guidelines.html'); open(out, 'w').write(html); print(out, len(P), 'pages')
