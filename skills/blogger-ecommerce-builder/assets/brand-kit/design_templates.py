"""Kreislo design templates: sale posts, merchandise print files, press backdrop, roll-up, video backgrounds.
Every design is its own Inkscape project (layers, locked background, hidden guide layer, 300 dpi export).
Run: python3 -I design_templates.py <fonts dir> <out dir>   (needs kreislo.py next to this file)"""
import os, sys, json, math, html
HERE = os.path.dirname(os.path.abspath(__file__))
FONTS, OUT = sys.argv[1], sys.argv[2]
sys.path.insert(0, HERE)
sys.argv = [sys.argv[0], FONTS, OUT]
import kreislo as K
from fontTools.ttLib import TTFont

INK, ORANGE, PAPER, WHITE, STONE, BLUSH = K.INK, K.ORANGE, K.PAPER, K.WHITE, '#6B6B6B', '#FFE3D9'
GREY, PANEL, SOFT = '#CFCFCF', '#262626', '#9A9A9A'
CONTACT = {'phone': '+49 157 0000000', 'web': 'kreislo.de', 'mail': 'hello@kreislo.de'}

FT = {('Oswald', 600): TTFont(os.path.join(FONTS, 'Oswald-600.ttf')),
      ('Oswald', 500): TTFont(os.path.join(FONTS, 'Oswald-500.ttf')),
      ('Open Sans', 400): TTFont(os.path.join(FONTS, 'OpenSans-400.ttf')),
      ('Open Sans', 600): TTFont(os.path.join(FONTS, 'OpenSans-600.ttf')),
      ('Open Sans', 700): TTFont(os.path.join(FONTS, 'OpenSans-700.ttf'))}

def width(s, size, fam='Oswald', w=600, ls=0):
    f = FT[(fam, w)]; cmap = f.getBestCmap(); hm = f['hmtx']; upm = f['head'].unitsPerEm
    adv = sum(hm[cmap.get(ord(c), cmap[ord('?')])][0] for c in s)
    return adv * size / upm + ls * max(len(s) - 1, 0)

esc = lambda s: html.escape(s, quote=True)

# ---------- SVG building blocks ----------
def T(x, y, s, size, fam='Oswald', w=600, fill=WHITE, anchor='start', ls=0, label=None):
    """Live, editable text (Inkscape keeps it as text)."""
    lab = f' inkscape:label="{esc(label)}"' if label else ''
    return (f'<text xml:space="preserve" x="{x:.1f}" y="{y:.1f}"{lab} style="font-family:\'{fam}\';font-weight:{w};'
            f'font-size:{size}px;line-height:1.1;letter-spacing:{ls}px;fill:{fill};text-anchor:{anchor}">'
            f'<tspan x="{x:.1f}" y="{y:.1f}" sodipodi:role="line">{esc(s)}</tspan></text>')

def O(x, y, s, cap, fill, fam=('Oswald', 600), anchor='start', track=0.0):
    """Text as outlines (print files: no fonts needed at the print shop). cap = capital height."""
    font = FT[fam]
    _, wdt = K.outline(font, s, cap, 0, 0, track)
    if anchor == 'middle': x -= wdt / 2
    elif anchor == 'end': x -= wdt
    d, _ = K.outline(font, s, cap, x, y, track)
    return f'<path d="{d}" fill="{fill}"/>', wdt

WM_W = K.wordmark(0, 100, '#000', '#000')[1]   # wordmark width at cap 100
def logo(x, y, cap, letters=WHITE, ring=ORANGE, anchor='start', label='Logo'):
    """Kreislo wordmark (outlines); y = top of the capitals."""
    s = cap / 100.0; wdt = WM_W * s
    if anchor == 'middle': x -= wdt / 2
    elif anchor == 'end': x -= wdt
    body, _ = K.wordmark(0, 100, letters, ring)
    return f'<g inkscape:label="{label}" transform="translate({x:.2f},{y:.2f}) scale({s:.5f})">{body}</g>', wdt

def symbol(cx, cy, d, ring=ORANGE, letter=WHITE, label='Symbol'):
    return f'<g inkscape:label="{label}">{K.symbol(cx, cy, d, ring, letter)}</g>'

def tagline(x, y, wdt, colour, cap):
    return K.tagline(x, y, wdt, colour, cap=cap)

def rrect(x, y, w, h, r):
    return (f'M{x+r:.1f} {y:.1f}H{x+w-r:.1f}A{r} {r} 0 0 1 {x+w:.1f} {y+r:.1f}V{y+h-r:.1f}A{r} {r} 0 0 1 {x+w-r:.1f} {y+h:.1f}'
            f'H{x+r:.1f}A{r} {r} 0 0 1 {x:.1f} {y+h-r:.1f}V{y+r:.1f}A{r} {r} 0 0 1 {x+r:.1f} {y:.1f}Z')

def pill(x, y, s, size, bg=ORANGE, fg=WHITE, pad=26, h=None, ls=2, anchor='start', w=600):
    h = h or size * 1.75; tw = width(s, size, 'Oswald', w, ls); pw = tw + 2 * pad
    if anchor == 'end': x -= pw
    return (f'<g inkscape:label="Badge: {esc(s)}"><path d="{rrect(x, y, pw, h, h/2)}" fill="{bg}"/>'
            + T(x + pw / 2, y + h / 2 + size * 0.36, s, size, fill=fg, anchor='middle', ls=ls, w=w) + '</g>'), pw

def check(cx, cy, r, fill=ORANGE, mark=WHITE):
    return (f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r}" fill="{fill}"/><path d="M{cx-r*0.45:.1f} {cy:.1f}l{r*0.32:.1f} {r*0.32:.1f}'
            f'l{r*0.6:.1f} {-r*0.62:.1f}" fill="none" stroke="{mark}" stroke-width="{r*0.26:.1f}" stroke-linecap="round" stroke-linejoin="round"/>')

def chat_icon(x, y, s, fill=WHITE):
    """Speech bubble with a phone handset feel (generic chat icon, not a trademark)."""
    return (f'<g transform="translate({x:.1f},{y:.1f}) scale({s/48:.4f})"><path d="M24 3C12.4 3 3 11.6 3 22.2c0 4.2 1.5 8.1 4 11.2L5 45l12.2-4.6'
            f'c2.1.6 4.4 1 6.8 1 11.6 0 21-8.6 21-19.2S35.6 3 24 3z" fill="none" stroke="{fill}" stroke-width="3.6" stroke-linejoin="round"/>'
            f'<path d="M17.5 14.5c.8-.8 2-.8 2.6.1l2 2.8c.5.7.4 1.6-.2 2.2l-1.3 1.3c1.2 2.6 3.2 4.6 5.8 5.8l1.3-1.3c.6-.6 1.5-.7 2.2-.2l2.8 2'
            f'c.9.6.9 1.8.1 2.6l-1.4 1.4c-1.3 1.3-3.3 1.6-5 .8-4.6-2.1-8.3-5.8-10.4-10.4-.8-1.7-.5-3.7.8-5z" fill="{fill}"/></g>')

def price_disc(cx, cy, r, lines, small='ONLY'):
    """Orange price circle. lines = ['189 €'] or ['PRICE ON', 'REQUEST']."""
    out = [f'<g inkscape:label="Price circle (edit the text)"><circle cx="{cx}" cy="{cy}" r="{r}" fill="{ORANGE}"/>',
           f'<circle cx="{cx}" cy="{cy}" r="{r-10}" fill="none" stroke="{WHITE}" stroke-opacity="0.35" stroke-width="3"/>']
    if len(lines) == 1:
        big = r * 0.62
        while width(lines[0], big) > r * 1.55: big -= 2
        if small: out.append(T(cx, cy - r * 0.32, small, r * 0.17, w=500, anchor='middle', ls=3))
        out.append(T(cx, cy + big * 0.36 + r * 0.08, lines[0], big, anchor='middle'))
    else:
        sz = r * 0.3
        out.append(T(cx, cy - sz * 0.15, lines[0], sz, anchor='middle', ls=1))
        out.append(T(cx, cy + sz * 0.95, lines[1], sz, anchor='middle', ls=1))
    return ''.join(out) + '</g>'

# ---------- product drawings (placeholders for the real photo) ----------
def drawing(kind, cx, cy, size, c=WHITE, a=ORANGE):
    s = size / 400.0; sw = 9
    st = f'fill="none" stroke="{c}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"'
    sa = f'fill="none" stroke="{a}" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round"'
    if kind == 'washer':
        g = (f'<path d="{rrect(60, 20, 280, 360, 26)}" {st}/><path d="M60 92H340" {st}/>'
             f'<rect x="88" y="46" width="70" height="22" rx="6" {sa}/><circle cx="300" cy="57" r="14" {st}/><circle cx="256" cy="57" r="6" fill="{c}"/>'
             f'<circle cx="200" cy="232" r="104" {st}/><circle cx="200" cy="232" r="76" {sa}/>'
             f'<path d="M140 250q30-22 60 0t60 0" {st}/><path d="M90 380v14M310 380v14" {st}/>')
    elif kind == 'fridge':
        g = (f'<path d="{rrect(100, 6, 200, 384, 22)}" {st}/><path d="M100 140H300" {st}/>'
             f'<path d="M128 46v56M128 176v94" {sa}/><path d="M160 360h110" stroke="{c}" stroke-width="4" stroke-linecap="round" opacity=".5"/>'
             f'<path d="M118 390v8M282 390v8" {st}/>')
    elif kind == 'tools':
        g = (f'<path d="{rrect(40, 210, 320, 170, 20)}" {st}/><path d="M40 268H360" {st}/><path d="M150 210v-34q0-16 16-16h68q16 0 16 16v34" {st}/>'
             f'<rect x="182" y="254" width="36" height="28" rx="6" fill="{a}"/>'
             f'<path d="M86 196 L74 70 Q72 48 94 46 L188 46 Q210 46 210 68 L210 100 Q210 118 192 118 L132 118 L140 196Z" {st}/>'
             f'<path d="M210 70h56M266 60v20" {sa}/><path d="M246 70h36" {sa}/>'
             f'<path d="M300 196l46-118" {st}/><path d="M330 74l28 10-6 18-28-10z" fill="{a}"/>')
    elif kind == 'tractor':
        g = (f'<circle cx="120" cy="290" r="88" {st}/><circle cx="120" cy="290" r="30" {sa}/>'
             f'<circle cx="318" cy="318" r="56" {st}/><circle cx="318" cy="318" r="18" {sa}/>'
             f'<path d="M62 210 L80 70 H200 L214 190" {st}/><path d="M104 96h80l8 84h-96z" {sa}/>'
             f'<path d="M214 190 H352 Q372 190 372 210 V262" {st}/><path d="M214 250h48" {st}/><path d="M300 190V128" {st}/><path d="M290 128h20" {st}/>')
    else:
        g = ''
    return f'<g inkscape:label="Example drawing (delete when you add your photo)" transform="translate({cx - 200*s:.1f},{cy - 200*s:.1f}) scale({s:.4f})">{g}</g>'

def photo_placeholder(x, y, w, h, r, kind=None, note='PUT YOUR PRODUCT PHOTO HERE'):
    g = [f'<defs><linearGradient id="ph{int(x)}{int(y)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E2E2E"/>'
         f'<stop offset="1" stop-color="#1E1E1E"/></linearGradient></defs>',
         f'<path inkscape:label="Placeholder (delete)" d="{rrect(x - 8, y - 8, w + 16, h + 16, r)}" fill="url(#ph{int(x)}{int(y)})"/>']
    if kind:
        g.append(drawing(kind, x + w / 2, y + h / 2 - h * 0.02, min(w, h) * 0.66))
        g.append(T(x + w / 2, y + h - 22, 'Example drawing · replace with your photo', min(22, h * 0.05), 'Open Sans', 400, SOFT, 'middle'))
    else:
        sz = max(18, min(34, w / 22))
        g.append(T(x + w / 2, y + h / 2 + sz * 0.35, note, sz, 'Oswald', 500, '#777777', 'middle', ls=4))
    return ''.join(g)

def frame(W, H, holes, fill=INK):
    """Background with see-through windows: the photo layer underneath shows only inside them."""
    d = f'M0 0H{W}V{H}H0Z ' + ' '.join(rrect(*h) for h in holes)
    return f'<path inkscape:label="Background with photo window" d="{d}" fill="{fill}" fill-rule="evenodd"/>'

# ---------- Inkscape document ----------
def layer(label, body, locked=False, hidden=False, lid=None):
    lid = lid or 'layer-' + ''.join(ch for ch in label.lower() if ch.isalnum())[:24]
    attrs = ' sodipodi:insensitive="true"' if locked else ''
    style = ' style="display:none"' if hidden else ''
    return f'<g inkscape:groupmode="layer" id="{lid}" inkscape:label="{esc(label)}"{attrs}{style}>{body}</g>'

def doc(vw, vh, phys, layers, title, export_name, units='px', dpi=300, desk='#d1d1d1'):
    pw, ph = phys
    return ('<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
            f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            f'xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" '
            f'width="{pw}" height="{ph}" viewBox="0 0 {vw} {vh}" version="1.1" '
            f'inkscape:export-filename="{esc(export_name)}" inkscape:export-xdpi="{dpi}" inkscape:export-ydpi="{dpi}">\n'
            f'<title>{esc(title)}</title>\n'
            f'<sodipodi:namedview id="namedview" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1" '
            f'inkscape:pageshadow="2" inkscape:pageopacity="0" inkscape:pagecheckerboard="true" inkscape:deskcolor="{desk}" '
            f'inkscape:document-units="{units}" showgrid="false"/>\n'
            + '\n'.join(layers) + '\n</svg>\n')

def guides(rects, W, H, note=''):
    """Hidden layer: dashed boxes for safe areas / trim line. Hidden layers are not exported."""
    sw = max(W, H) / 600
    g = ''.join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="none" stroke="{col}" stroke-width="{sw:.1f}" '
                f'stroke-dasharray="{sw*6:.1f} {sw*4:.1f}"/>' for x, y, w, h, col in rects)
    if note:
        g += T(W / 2, H / 2, note, max(W, H) / 60, 'Open Sans', 600, '#00A3FF', 'middle')
    return layer('0 · GUIDES (switch on to see safe areas; not printed when hidden)', g, locked=True, hidden=True, lid='layer-guides')

# ---------- social sale posts ----------
def sale_post(fmt, p, template):
    """fmt: square | portrait | story | landscape. p: product texts."""
    W, H = {'square': (1080, 1080), 'portrait': (1080, 1350), 'story': (1080, 1920), 'landscape': (1200, 628)}[fmt]
    L = []; txt = []; deco = []
    if fmt in ('square', 'portrait', 'story'):
        m = 48 if fmt != 'story' else 60
        top = {'square': 44, 'portrait': 50, 'story': 250}[fmt]
        win = {'square': (m, 118, W - 2*m, 572, 30), 'portrait': (m, 132, W - 2*m, 712, 32),
               'story': (m, 340, W - 2*m, 720, 34)}[fmt]
        lg, _ = logo(m, top, 42 if fmt != 'story' else 50)
        deco.append(lg)
        txt.append(T(W - m, top + 36, p['category'], 26, 'Oswald', 500, ORANGE, 'end', ls=3, label='Category'))
        x, y, w, h, r = win
        b, _ = pill(x + 24, y + 24, p['badge'], 28 if fmt != 'story' else 32)
        deco.append(b)
        pr = {'square': 108, 'portrait': 120, 'story': 132}[fmt]
        pcx, pcy = x + w - pr - 18, y + h
        deco.append(price_disc(pcx, pcy, pr, p['price'], p.get('price_small', 'ONLY')))
        ty = {'square': y + h + 96, 'portrait': y + h + 104, 'story': y + h + 120}[fmt]
        tsz = {'square': 66, 'portrait': 76, 'story': 84}[fmt]
        maxw = pcx - pr - 30 - m
        while width(p['title'], tsz) > maxw: tsz -= 2
        txt.append(T(m, ty, p['title'], tsz, label='Product name'))
        txt.append(T(m, ty + 56, p['sub'], 32 if fmt != 'story' else 36, 'Open Sans', 600, GREY, label='Details line'))
        if fmt == 'square':
            cx = m; cy = ty + 128
            for item in p['checks']:
                deco.append(check(cx + 16, cy - 10, 16))
                txt.append(T(cx + 44, cy, item, 26, 'Open Sans', 400, WHITE, label='Check point'))
                cx += 44 + width(item, 26, 'Open Sans', 400) + 40
        else:
            cy = ty + (128 if fmt == 'portrait' else 128)
            step = 52 if fmt == 'portrait' else 56
            for item in p['checks']:
                deco.append(check(m + 18, cy - 11, 18))
                txt.append(T(m + 52, cy, item, 30 if fmt == 'portrait' else 34, 'Open Sans', 400, WHITE, label='Check point'))
                cy += step
        if fmt == 'story':
            by, bh = 1478, 112
            deco.append(f'<path inkscape:label="Button" d="{rrect(m, by, W - 2*m, bh, bh/2)}" fill="{ORANGE}"/>')
            deco.append(chat_icon(m + 44, by + 33, 52))
            txt.append(T(m + 118, by + 54, p.get('cta', 'ORDER ON WHATSAPP'), 40, label='Button text'))
            txt.append(T(m + 118, by + 92, CONTACT['phone'], 28, 'Open Sans', 600, WHITE, label='Phone'))
            txt.append(T(W / 2, 1640, CONTACT['web'] + '  ·  ' + p.get('foot', 'Pickup in Gießen · shipping to Kenya'), 28, 'Open Sans', 600, GREY, 'middle', label='Footer line'))
        else:
            bh = 130 if fmt == 'square' else 136
            by = H - bh
            deco.append(f'<rect inkscape:label="Bottom bar" x="0" y="{by}" width="{W}" height="{bh}" fill="{ORANGE}"/>')
            deco.append(chat_icon(m, by + bh/2 - 26, 52))
            txt.append(T(m + 74, by + bh/2 - 4, p.get('cta', 'ORDER ON WHATSAPP'), 38, label='Button text'))
            txt.append(T(m + 74, by + bh/2 + 34, CONTACT['phone'], 28, 'Open Sans', 600, WHITE, label='Phone'))
            txt.append(T(W - m, by + bh/2 + 14, CONTACT['web'], 40, 'Oswald', 500, WHITE, 'end', label='Website'))
        holes = [win]
        safe = [(m, m, W - 2*m, H - 2*m, '#00A3FF')]
        if fmt == 'story':
            safe = [(0, 250, W, 1350, '#00A3FF')]
    else:  # landscape 1200 x 628 (Facebook, LinkedIn, X, website share image)
        win = (36, 36, 600, 556, 26); x, y, w, h, r = win
        b, _ = pill(x + 22, y + 22, p['badge'], 24); deco.append(b)
        rx = 676
        lg, _ = logo(rx, 52, 34); deco.append(lg)
        txt.append(T(W - 40, 84, p['category'], 22, 'Oswald', 500, ORANGE, 'end', ls=3, label='Category'))
        tsz = 58
        while width(p['title'], tsz) > W - 40 - rx: tsz -= 2
        txt.append(T(rx, 196, p['title'], tsz, label='Product name'))
        txt.append(T(rx, 240, p['sub'], 24, 'Open Sans', 600, GREY, label='Details line'))
        cy = 300
        for item in p['checks']:
            deco.append(check(rx + 13, cy - 8, 13)); txt.append(T(rx + 36, cy, item, 22, 'Open Sans', 400, WHITE, label='Check point')); cy += 38
        ptxt = ' '.join(p['price'])
        txt.append(T(rx, 492, ptxt, 76 if len(p['price']) == 1 else 44, 'Oswald', 600, ORANGE, label='Price'))
        deco.append(f'<path inkscape:label="Button" d="{rrect(rx, 522, W - 40 - rx, 70, 35)}" fill="{ORANGE}"/>')
        deco.append(chat_icon(rx + 22, 538, 38))
        txt.append(T(rx + 74, 567, 'WhatsApp ' + CONTACT['phone'], 26, 'Oswald', 500, WHITE, label='Button text'))
        holes = [win]
        safe = [(30, 30, W - 60, H - 60, '#00A3FF')]
    x, y, w, h, r = win
    L.append(layer('1 · PHOTO – put your picture here (it shows only inside the window)',
                   photo_placeholder(x, y, w, h, r, p.get('drawing'))))
    L.append(layer('2 · BACKGROUND (locked)', frame(W, H, holes), locked=True))
    L.append(layer('3 · BADGES, PRICE AND LOGO', ''.join(deco)))
    L.append(layer('4 · TEXT – double-click to edit', ''.join(txt)))
    L.append(guides(safe, W, H, 'Keep text inside the dashed line' if fmt != 'story' else 'Story: keep text between the lines (top and bottom are covered by the app)'))
    return W, H, L

def grid_post():
    W = H = 1080; m = 48
    tiles = [(m, 300, 468, 250), (564, 300, 468, 250), (m, 640, 468, 250), (564, 640, 468, 250)]
    items = [('Washing machine 7 kg', '189 €', 'washer'), ('Fridge-freezer', '249 €', 'fridge'),
             ('Tool set', '79 €', 'tools'), ('Compact tractor', 'Ask us', 'tractor')]
    ph, deco, txt = [], [], []
    lg, _ = logo(m, 44, 42); deco.append(lg)
    txt.append(T(W - m, 80, 'THIS WEEK', 26, 'Oswald', 500, ORANGE, 'end', ls=3, label='Small heading'))
    txt.append(T(m, 200, 'NEW ARRIVALS', 96, label='Headline'))
    txt.append(T(m, 252, 'Used, checked and ready to go · Gießen', 30, 'Open Sans', 600, GREY, label='Sub line'))
    for (x, y, w, h), (name, price, kind) in zip(tiles, items):
        ph.append(photo_placeholder(x, y, w, h, 22, kind))
        txt.append(T(x, y + h + 40, name, 30, 'Oswald', 500, WHITE, label='Product name'))
        txt.append(T(x + w, y + h + 40, price, 34, 'Oswald', 600, ORANGE, 'end', label='Price'))
    bh = 120; by = H - bh
    deco.append(f'<rect inkscape:label="Bottom bar" x="0" y="{by}" width="{W}" height="{bh}" fill="{ORANGE}"/>')
    deco.append(chat_icon(m, by + 34, 52))
    txt.append(T(m + 74, by + 56, 'ASK FOR PHOTOS AND PRICES', 36, label='Button text'))
    txt.append(T(m + 74, by + 92, CONTACT['phone'], 26, 'Open Sans', 600, WHITE, label='Phone'))
    txt.append(T(W - m, by + 74, CONTACT['web'], 38, 'Oswald', 500, WHITE, 'end', label='Website'))
    L = [layer('1 · PHOTOS – one picture per window', ''.join(ph)),
         layer('2 · BACKGROUND (locked)', frame(W, H, [(x, y, w, h, 22) for x, y, w, h in tiles]), locked=True),
         layer('3 · LOGO AND BAR', ''.join(deco)), layer('4 · TEXT – double-click to edit', ''.join(txt)),
         guides([(m, m, W - 2*m, H - 2*m, '#00A3FF')], W, H)]
    return W, H, L

def container_post():
    W = H = 1080; m = 60; deco, txt = [], []
    deco.append(f'<rect width="{W}" height="{H}" fill="{INK}"/>')
    # big faint ring in the corner
    deco.append(f'<g opacity="0.08">{K.ring(930, 330, 760, 760, 120, WHITE, gap=K.RING_GAP, head=K.RING_HEAD)}</g>')
    lg, _ = logo(m, 56, 42); deco.append(lg)
    txt.append(T(m, 268, 'NEXT CONTAINER', 112, label='Headline 1'))
    txt.append(T(m, 392, 'TO KENYA', 112, 'Oswald', 600, ORANGE, label='Headline 2'))
    # route line Gießen -> Mombasa
    y0 = 520
    deco.append(f'<g inkscape:label="Route"><circle cx="{m+14}" cy="{y0}" r="14" fill="{WHITE}"/>'
                f'<path d="M{m+40} {y0}H{W-m-60}" stroke="{WHITE}" stroke-width="5" stroke-dasharray="4 16" stroke-linecap="round"/>'
                f'<path d="M{W-m-62} {y0-18}l26 18-26 18z" fill="{ORANGE}"/><circle cx="{W-m-14}" cy="{y0}" r="14" fill="{ORANGE}"/></g>')
    txt.append(T(m, y0 + 58, 'GIESSEN · GERMANY', 30, 'Oswald', 500, WHITE, ls=2, label='From'))
    txt.append(T(W - m, y0 + 58, 'MOMBASA · KENYA', 30, 'Oswald', 500, ORANGE, 'end', ls=2, label='To'))
    rows = [('Loading in Gießen', '[date]'), ('Arrival in Mombasa', '[about date]'),
            ('Still space for', 'washing machines, fridges, tools, bikes')]
    y = 690
    for k, v in rows:
        deco.append(check(m + 18, y - 11, 18))
        txt.append(T(m + 54, y, k + ':', 32, 'Open Sans', 400, GREY, label='Row label'))
        txt.append(T(m + 54 + width(k + ':', 32, 'Open Sans', 400) + 14, y, v, 32, 'Open Sans', 700, WHITE, label='Row value'))
        y += 62
    bh = 132; by = H - bh
    deco.append(f'<rect inkscape:label="Bottom bar" x="0" y="{by}" width="{W}" height="{bh}" fill="{ORANGE}"/>')
    deco.append(chat_icon(m, by + 40, 52))
    txt.append(T(m + 74, by + 62, 'RESERVE YOUR SPACE', 40, label='Button text'))
    txt.append(T(m + 74, by + 100, 'WhatsApp ' + CONTACT['phone'], 28, 'Open Sans', 600, WHITE, label='Phone'))
    txt.append(T(W - m, by + 82, CONTACT['web'], 40, 'Oswald', 500, WHITE, 'end', label='Website'))
    L = [layer('1 · BACKGROUND AND GRAPHICS (locked)', ''.join(deco), locked=True),
         layer('2 · TEXT – double-click to edit (replace the [date] parts)', ''.join(txt)),
         guides([(m, m, W - 2*m, H - 2*m, '#00A3FF')], W, H)]
    return W, H, L

# ---------- merchandise ----------
def print_doc(w_mm, h_mm, body, title, fname, note):
    pad = max(5.0, round(max(w_mm, h_mm) * 0.06, 1))      # small margin so nothing touches the edge
    body = f'<g transform="translate({pad},{pad})">{body}</g>'; w_mm += 2 * pad; h_mm += 2 * pad
    L = [layer('1 · ARTWORK (outlines – no fonts needed)', body),
         guides([(0, 0, w_mm, h_mm, '#00A3FF')], w_mm, h_mm, note)]
    return doc(f'{w_mm:.2f}', f'{h_mm:.2f}', (f'{w_mm:.2f}mm', f'{h_mm:.2f}mm'), L, title, fname, units='mm')

def art_wordmark(wmm, letters, ring, tag=None):
    cap = wmm / WM_W * 100; g, _ = logo(0, 0, cap, letters, ring)
    h = cap
    if tag:
        tcap = cap * 0.155; g += tagline(0, cap + cap * 0.42 + tcap, wmm, tag, tcap); h = cap + cap * 0.42 + tcap
    return g, wmm, h

def art_back_tshirt(letters, ring, k):
    W = 280.0; parts = []; y = 0
    d = 150; parts.append(symbol(W / 2, d / 2, d, ring, k)); y = d + 22
    _, w0 = K.outline(FT[('Oswald', 600)], 'KEEP GOOD THINGS', 10, 0, 0); cap = 10 * (W - 6) / w0
    a, w1 = O(W / 2, y + cap, 'KEEP GOOD THINGS', cap, letters, anchor='middle'); parts.append(a); y += cap + cap * 0.38
    b, w2 = O(W / 2, y + cap, 'MOVING', cap, ring, anchor='middle'); parts.append(b); y += cap + 30
    g, ww = logo(W / 2, y, 130 / WM_W * 100, letters, ring, anchor='middle'); parts.append(g); y += 130 / WM_W * 100
    return ''.join(parts), W, y

def art_back_uniform(letters, ring, sub):
    W = 250.0; cap = W / WM_W * 100
    g, _ = logo(0, 0, cap, letters, ring)
    t = K.tagline(0, cap + 22 + 9, W, sub, text='FULFILMENT  ·  LOGISTICS  ·  GIESSEN', cap=9)
    return g + t, W, cap + 22 + 9

TSHIRT_F = ('M235 40Q300 98 365 40L460 72L560 190L492 242L450 202L455 600Q300 616 145 600L150 202L108 242L40 190L140 72Z')
TSHIRT_B = ('M235 40Q300 60 365 40L460 72L560 190L492 242L450 202L455 600Q300 616 145 600L150 202L108 242L40 190L140 72Z')
def garment(x, y, s, path, colour, collar='tee', line='#000000'):
    stroke = '#3a3a3a' if colour in (INK, '#1d1d1d', '#2B2B2B') else '#b9b9b9'
    g = f'<path d="{path}" fill="{colour}" stroke="{stroke}" stroke-width="3" stroke-linejoin="round"/>'
    if collar == 'tee-front':
        g += f'<path d="M235 40Q300 98 365 40" fill="none" stroke="{stroke}" stroke-width="10"/>'
    elif collar == 'tee-back':
        g += f'<path d="M235 40Q300 60 365 40" fill="none" stroke="{stroke}" stroke-width="10"/>'
    elif collar == 'polo-front':
        g += (f'<path d="M235 40L300 92L250 104Z M365 40L300 92L350 104Z" fill="{colour}" stroke="{stroke}" stroke-width="3" stroke-linejoin="round"/>'
              f'<path d="M290 92V190H310V92" fill="none" stroke="{stroke}" stroke-width="3"/><circle cx="300" cy="120" r="4" fill="{stroke}"/><circle cx="300" cy="160" r="4" fill="{stroke}"/>')
    elif collar == 'polo-back':
        g += f'<path d="M235 40Q300 66 365 40L360 30Q300 52 240 30Z" fill="{colour}" stroke="{stroke}" stroke-width="3"/>'
    g += f'<path d="M150 202L145 600M450 202L455 600" stroke="{stroke}" stroke-width="1" opacity=".0"/>'
    return f'<g transform="translate({x},{y}) scale({s})">{g}</g>'

def placed(art, aw, ah, cx, top, width_units):
    s = width_units / aw
    return f'<g transform="translate({cx - width_units/2:.2f},{top:.2f}) scale({s:.4f})">{art}</g>'

def cap_shape(colour):
    stroke = '#3a3a3a' if colour == INK else '#b9b9b9'
    return (f'<path d="M90 300C90 120 190 60 300 60S510 120 510 300Z" fill="{colour}" stroke="{stroke}" stroke-width="3"/>'
            f'<path d="M300 60V300M300 60C230 110 200 200 196 300M300 60C370 110 400 200 404 300" fill="none" stroke="{stroke}" stroke-width="2"/>'
            f'<circle cx="300" cy="62" r="9" fill="{colour}" stroke="{stroke}" stroke-width="2"/>'
            f'<path d="M70 300C120 350 480 350 530 300C560 330 520 372 300 378C80 372 40 330 70 300Z" fill="{colour}" stroke="{stroke}" stroke-width="3"/>')

def label_txt(x, y, s, size=22, fill=INK, w=600, anchor='middle'):
    return T(x, y, s, size, 'Open Sans', w, fill, anchor)

# ---------- events ----------
def step_repeat(W, H, unit, bg, letters, ring, k, wm_w, sym_d, pitch_x, pitch_y, x0=0, y0=0):
    out = [f'<rect inkscape:label="Background" x="0" y="0" width="{W}" height="{H}" fill="{bg}"/>']
    cap = wm_w / WM_W * 100
    r = 0; y = y0
    while y < H + pitch_y:
        c = -1; x = x0 + (pitch_x / 2 if r % 2 else 0) - pitch_x
        while x < W + pitch_x:
            if (c + r) % 2 == 0:
                g, _ = logo(x, y - cap / 2, cap, letters, ring, anchor='middle'); out.append(g)
            else:
                out.append(symbol(x, y, sym_d, ring, k))
            x += pitch_x; c += 1
        y += pitch_y; r += 1
    return ''.join(out)

def write(path, s):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f: f.write(s)

# ---------- build everything ----------
def build():
    root = os.path.join(OUT, 'Kreislo Design Templates')
    jobs = []
    def add(folder, base, svg_text, render, readme):
        d = os.path.join(root, folder); os.makedirs(d, exist_ok=True)
        sp = os.path.join(d, f'Kreislo - {base} - PROJECT (Inkscape).svg'); write(sp, svg_text)
        write(os.path.join(d, 'READ ME.txt'), readme.strip() + '\n')
        for r in render:
            r = dict(r); r['svg'] = sp; r['out'] = os.path.join(d, r['out'].replace('{b}', f'Kreislo - {base}')); jobs.append(r)

    HOWTO = """
How to use it in Inkscape (free: inkscape.org)
1. Install the fonts Oswald and Open Sans first (fonts.google.com, free), then open the "PROJECT (Inkscape).svg".
2. Photo: File > Import your picture, then Layer > Move Selection to Layer... > "1 · PHOTO". Delete the
   placeholder and the example drawing. Drag the corners (hold Ctrl to keep the shape) until the picture fills
   the window: anything outside the window is hidden by the background, so you never need a clipping path.
3. Text: double-click any text and type. Price: double-click the number in the orange circle.
4. Export: File > Export (Shift+Ctrl+E) > Page > DPI 300 > Export. The file is already set to 300 dpi.
5. Save your edited copy with File > Save As... under a new name, so the template stays clean.
Layers: Layer > Layers and Objects (Shift+Ctrl+L). Layer "0 · GUIDES" shows the safe area; switch it on with
the eye icon while you work and off before exporting.
"""
    SIZES = {'square': ('7.2in', '7.2in', '2160 x 2160 px', 'Instagram and Facebook feed, WhatsApp, Telegram'),
             'portrait': ('7.2in', '9in', '2160 x 2700 px', 'Instagram and Facebook feed (4:5 takes the most space in the feed)'),
             'story': ('7.2in', '12.8in', '2160 x 3840 px', 'Instagram/Facebook stories, WhatsApp Status, TikTok and Reels cover'),
             'landscape': ('8in', '4.1867in', '2400 x 1256 px', 'Facebook and LinkedIn link posts, X, website share image')}
    blank = dict(category='HOME APPLIANCES', badge='USED · TESTED', price=['189 €'], title='PRODUCT NAME HERE',
                 sub='Size · model · condition', checks=['Tested and cleaned', 'Pickup in Gießen', 'Ships to Kenya'])
    n = 0
    for fmt, label in [('square', 'square 1-1'), ('portrait', 'portrait 4-5'), ('story', 'story 9-16'), ('landscape', 'landscape')]:
        n += 1; W, H, L = sale_post(fmt, blank, True); pw, ph, px, use = SIZES[fmt]
        base = f'Sale post - {label} - template'
        add(f'A - Social media sale posts/{n:02d} Sale post - {label} - template', base,
            doc(W, H, (pw, ph), L, f'Kreislo sale post {label}', f'Kreislo - {base} - 300dpi.png'),
            [dict(out='{b} - 300dpi.png', w=W, h=H, scale=2, dpi=300)],
            f"""Kreislo - Sale post ({label}) - template
For: {use}.
Size: {W} x {H} design units, exports at 300 dpi = {px} (twice the platform size, so it stays sharp).
Files: PROJECT (Inkscape).svg = the editable template. 300dpi.png = how it looks.
{HOWTO}""")
    products = [
        ('washing machine', 'washer', dict(category='HOME APPLIANCES', badge='USED · TESTED', price=['189 €'], title='WASHING MACHINE',
            sub='7 kg · 1400 rpm · energy class A+++', checks=['Tested and cleaned', 'Pickup in Gießen or delivery', 'Can ship to Kenya'])),
        ('fridge', 'fridge', dict(category='HOME APPLIANCES', badge='USED · TESTED', price=['249 €'], title='FRIDGE-FREEZER',
            sub='185 cm tall · 300 litres · No Frost', checks=['Cooling tested for 24 hours', 'Cleaned inside and out', 'Can ship to Kenya'])),
        ('tools', 'tools', dict(category='TOOLS', badge='USED · WORKING', price=['79 €'], title='TOOL SET',
            sub='Cordless drill 18 V · 2 batteries · case', checks=['Every tool tested', 'Batteries hold charge', 'Can ship to Kenya'])),
        ('tractor', 'tractor', dict(category='FARM MACHINERY', badge='USED · INSPECTED', price=['PRICE ON', 'REQUEST'], title='COMPACT TRACTOR',
            sub='25 HP · 4WD · 1,850 hours', checks=['Inspected before sale', 'Photos and video on request', 'Container shipping to Mombasa'],
            cta='ASK FOR THE PRICE'))]
    for name, kind, p in products:
        n += 1; p = dict(p, drawing=kind)
        for fmt, label in [('portrait', 'portrait 4-5')]:
            W, H, L = sale_post(fmt, p, False); pw, ph, px, use = SIZES[fmt]
            base = f'Sale post - {name} - example'
            add(f'A - Social media sale posts/{n:02d} Sale post - {name} - example', base,
                doc(W, H, (pw, ph), L, f'Kreislo sale post {name}', f'Kreislo - {base} - 300dpi.png'),
                [dict(out='{b} - 300dpi.png', w=W, h=H, scale=2, dpi=300)],
                f"""Kreislo - Sale post: {name} (filled-in example)
A finished example of the portrait 4:5 post. The drawing is only a stand-in: put your real photo of the item
in the photo layer (real photos sell; never use photos of another seller's item).
Change the price, the details line and the three check points to what is true for this item.
Export: 300 dpi = {px}.
{HOWTO}""")
    n += 1; W, H, L = grid_post(); base = 'New arrivals - 4 items'
    add(f'A - Social media sale posts/{n:02d} New arrivals - 4 items (square)', base,
        doc(W, H, ('7.2in', '7.2in'), L, 'Kreislo new arrivals', f'Kreislo - {base} - 300dpi.png'),
        [dict(out='{b} - 300dpi.png', w=W, h=H, scale=2, dpi=300)],
        f"""Kreislo - New arrivals, 4 items (square)
For a weekly "what came in" post. Four photo windows: put one picture in each (all in layer "1 · PHOTOS").
Export: 300 dpi = 2160 x 2160 px.
{HOWTO}""")
    n += 1; W, H, L = container_post(); base = 'Next container to Kenya'
    add(f'A - Social media sale posts/{n:02d} Next container to Kenya (square)', base,
        doc(W, H, ('7.2in', '7.2in'), L, 'Kreislo next container', f'Kreislo - {base} - 300dpi.png'),
        [dict(out='{b} - 300dpi.png', w=W, h=H, scale=2, dpi=300)],
        f"""Kreislo - Next container to Kenya (square)
Announce a shipment and let people reserve space. Replace the [date] parts before posting; only promise dates
the shipping company has confirmed.
Export: 300 dpi = 2160 x 2160 px.
{HOWTO}""")

    # ----- B: merchandise -----
    PRINT_NOTE = """
Print files are real size in millimetres, with the letters turned into shapes (no fonts needed at the print shop).
Send the PRINT.pdf (vector, sharp at any size). If the shop wants a picture, send the 300dpi.png (transparent
background, real size at 300 dpi). Colours: Kreislo Orange #FF3300 (Pantone 172 C is close: check a printed
sample), white #FFFFFF, Ink #111111.
"""
    tee = []
    for col, letters, ring, kk, tag in [('dark shirt', WHITE, ORANGE, WHITE, GREY), ('light shirt', INK, ORANGE, INK, '#555555')]:
        g, w, h = art_wordmark(90, letters, ring)
        tee.append(('chest logo 90mm - ' + col, g, w, h, 'Left chest: 90 mm wide. About 9 cm below the collar seam, centre about 10 cm from the middle.'))
        g, w, h = art_back_tshirt(letters, ring, kk)
        tee.append(('back print 280mm - ' + col, g, w, h, 'Back: 280 mm wide. Top about 8 cm below the collar seam, centred.'))
    i = 0
    for nm, g, w, h, note in tee:
        i += 1; base = f'T-shirt - {nm}'
        add(f'B - Merchandise/01 T-shirt/{i:02d} T-shirt - {nm}', base,
            print_doc(w, h, g, f'Kreislo {base}', f'Kreislo - {base} - 300dpi.png', ''),
            [dict(out='{b} - PRINT.pdf', mm=(w, h)), dict(out='{b} - 300dpi.png', mm=(w, h), dpi=300, transparent=True)],
            f"Kreislo - {base}\n{note}\n{PRINT_NOTE}")
    # T-shirt mockup sheet
    chest_d, cw, chh = tee[0][1], tee[0][2], tee[0][3]
    back_d, bw, bh_ = tee[1][1], tee[1][2], tee[1][3]
    chest_l, back_l = tee[2][1], tee[3][1]
    u = 300 / 540.0  # mockup units per mm (body about 540 mm wide)
    sheet = [f'<rect width="2600" height="1560" fill="{PAPER}"/>']
    for row, (colr, cd, bd) in enumerate([('#1d1d1d', chest_d, back_d), ('#FFFFFF', chest_l, back_l)]):
        oy = 120 + row * 720
        for j, (path, collar, art, aw, ah, cx, top, wu) in enumerate([
                (TSHIRT_F, 'tee-front', cd, cw, chh, 370, 120, 90 * u), (TSHIRT_B, 'tee-back', bd, bw, bh_, 300, 40 + 80 * u, 280 * u)]):
            ox = 120 + j * 640 + (row and 1280 * 0)
            ox = 120 + j * 640
            sheet.append(f'<g transform="translate({ox},{oy})">' + garment(0, 0, 1, path, colr, collar) + placed(art, aw, ah, cx, top, wu) + '</g>')
            sheet.append(label_txt(ox + 300, oy + 660, ('FRONT' if j == 0 else 'BACK') + (' · dark shirt' if row == 0 else ' · light shirt'), 24))
    notes = ['WHERE THE PRINTS GO', 'Front: logo on the left chest (the wearer\'s left),', '90 mm wide, about 9 cm below the collar seam.',
             'Back: 280 mm wide, centred,', 'top about 8 cm below the collar seam.', '', 'Dark shirts: white letters, orange ring.',
             'Light shirts: black letters, orange ring.', '', 'Print method: DTF or screen print.', 'Ask for a test print first.']
    ny = 200
    for k2, s in enumerate(notes):
        sheet.append(T(1460, ny, s, 40 if k2 == 0 else 30, 'Oswald' if k2 == 0 else 'Open Sans', 600 if k2 == 0 else 400, INK if k2 else ORANGE))
        ny += 64 if k2 == 0 else 46
    lg, _ = logo(1460, 1300, 60, INK, ORANGE); sheet.append(lg)
    add('B - Merchandise/01 T-shirt/00 T-shirt - placement preview', 'T-shirt - placement preview',
        doc(2600, 1560, ('2600px', '1560px'), [layer('1 · PREVIEW', ''.join(sheet))], 'Kreislo T-shirt preview', 'Kreislo - T-shirt - placement preview.png', dpi=96),
        [dict(out='{b}.png', w=2600, h=1560, scale=1, dpi=150)],
        "Kreislo - T-shirt - placement preview\nShows where each print goes, on a dark and a light shirt. Not a print file: the print files are in the other folders.\nShow this to the print shop together with the PRINT.pdf files.")

    # Cap
    caps = []
    g = symbol(27.5, 27.5, 55, ORANGE, WHITE); caps.append(('front symbol 55mm - dark cap', g, 55.0, 55.0, 'symbol'))
    g, w, h = art_wordmark(100, WHITE, ORANGE); caps.append(('front logo 100mm - dark cap', g, w, h, 'word'))
    g, w, h = art_wordmark(100, INK, ORANGE); caps.append(('front logo 100mm - light cap', g, w, h, 'word'))
    EMB = """
For embroidery: send the PRINT.pdf. The embroiderer turns it into a stitch file (usually DST); ask to see the
stitch preview before they sew 50 caps. Two thread colours: orange (close to Pantone 172 C) and white or black.
Embroidery area on the front of a structured cap is about 110 x 55 mm, so the tagline is left out: it would be
too small to stitch cleanly.
"""
    i = 0
    for nm, g, w, h, kind in caps:
        i += 1; base = f'Cap - {nm}'
        add(f'B - Merchandise/02 Cap/{i:02d} Cap - {nm}', base, print_doc(w, h, g, f'Kreislo {base}', f'Kreislo - {base} - 300dpi.png', ''),
            [dict(out='{b} - PRINT.pdf', mm=(w, h)), dict(out='{b} - 300dpi.png', mm=(w, h), dpi=300, transparent=True)],
            f"Kreislo - {base}\nReal size: {w:.0f} x {h:.0f} mm, centred on the front panel.\n{EMB}")
    u = 400 / 200.0
    sheet = [f'<rect width="2200" height="900" fill="{PAPER}"/>']
    for j, ((nm, g, w, h, kind), colr) in enumerate(zip(caps, [INK, INK, '#FFFFFF'])):
        ox = 100 + j * 700
        top = 175 if kind == 'symbol' else 195
        sheet.append(f'<g transform="translate({ox},100)">' + cap_shape(colr) + placed(g, w, h, 300, top, w * u) + '</g>')
        sheet.append(label_txt(ox + 300, 560, nm.replace(' - ', ' · '), 26))
    sheet.append(T(100, 690, 'Front panel, centred. Embroidered: orange + white thread on dark caps, orange + black on light caps.', 30, 'Open Sans', 400, INK))
    lg, _ = logo(100, 760, 56, INK, ORANGE); sheet.append(lg)
    add('B - Merchandise/02 Cap/00 Cap - placement preview', 'Cap - placement preview',
        doc(2200, 900, ('2200px', '900px'), [layer('1 · PREVIEW', ''.join(sheet))], 'Kreislo cap preview', 'Kreislo - Cap - placement preview.png', dpi=96),
        [dict(out='{b}.png', w=2200, h=900, scale=1, dpi=150)],
        "Kreislo - Cap - placement preview\nShows the three cap options. Not a print file: the files to embroider are in the other folders.")

    # Work uniform
    uni = []
    g, w, h = art_wordmark(90, WHITE, ORANGE); uni.append(('chest logo 90mm', g, w, h, 'Left chest, 90 mm wide, about 9 cm below the shoulder seam.'))
    g, w, h = art_wordmark(90, WHITE, WHITE); uni.append(('chest logo 90mm - one colour white', g, w, h, 'One colour (cheaper for flex print or embroidery). Same place as the colour version.'))
    g, w, h = art_back_uniform(WHITE, ORANGE, GREY); uni.append(('back print 250mm', g, w, h, 'Back, 250 mm wide, top about 10 cm below the collar. Change "GIESSEN" if the team works elsewhere.'))
    g = symbol(30, 30, 60, ORANGE, WHITE); uni.append(('sleeve symbol 60mm', g, 60.0, 60.0, 'Upper right sleeve, 60 mm, about 8 cm below the shoulder seam.'))
    i = 0
    for nm, g, w, h, note in uni:
        i += 1; base = f'Work uniform - {nm}'
        add(f'B - Merchandise/03 Work uniform/{i:02d} Work uniform - {nm}', base, print_doc(w, h, g, f'Kreislo {base}', f'Kreislo - {base} - 300dpi.png', ''),
            [dict(out='{b} - PRINT.pdf', mm=(w, h)), dict(out='{b} - 300dpi.png', mm=(w, h), dpi=300, transparent=True)],
            f"""Kreislo - {base}
{note}
For dark work clothes (black, anthracite, navy). Polo shirts, work shirts, softshell or work jackets.
For warehouse safety vests: print only on the dark fabric, never over the reflective stripes.
{PRINT_NOTE}""")
    u = 300 / 540.0
    sheet = [f'<rect width="2400" height="900" fill="{PAPER}"/>']
    colr = '#2B2B2B'
    fx, bx = 100, 760
    front = (garment(0, 0, 1, TSHIRT_F, colr, 'polo-front') + placed(uni[0][1], uni[0][2], uni[0][3], 380, 128, 90 * u)
             + placed(uni[3][1], 60, 60, 92, 150, 60 * u * 0.9))
    back = garment(0, 0, 1, TSHIRT_B, colr, 'polo-back') + placed(uni[2][1], uni[2][2], uni[2][3], 300, 100, 250 * u)
    sheet.append(f'<g transform="translate({fx},90)">{front}</g><g transform="translate({bx},90)">{back}</g>')
    sheet.append(label_txt(fx + 300, 770, 'FRONT · chest logo + sleeve symbol', 26)); sheet.append(label_txt(bx + 300, 770, 'BACK · logo + line', 26))
    notes = ['WORK UNIFORM', 'Anthracite or black workwear,', 'white letters with the orange ring.', '',
             'Chest: 90 mm · Back: 250 mm', 'Sleeve: 60 mm symbol', '', 'Embroidery for polos and jackets,', 'flex or DTF print for T-shirts.']
    ny = 170
    for k2, s in enumerate(notes):
        sheet.append(T(1440, ny, s, 40 if k2 == 0 else 30, 'Oswald' if k2 == 0 else 'Open Sans', 600 if k2 == 0 else 400, ORANGE if k2 == 0 else INK)); ny += 62 if k2 == 0 else 46
    add('B - Merchandise/03 Work uniform/00 Work uniform - placement preview', 'Work uniform - placement preview',
        doc(2400, 900, ('2400px', '900px'), [layer('1 · PREVIEW', ''.join(sheet))], 'Kreislo uniform preview', 'Kreislo - Work uniform - placement preview.png', dpi=96),
        [dict(out='{b}.png', w=2400, h=900, scale=1, dpi=150)],
        "Kreislo - Work uniform - placement preview\nShows where chest, sleeve and back prints go. Not a print file.")

    # ----- C: events, stage and video -----
    BLEED = 20.0; TW, TH = 3000.0, 2000.0; W, H = TW + 2 * BLEED, TH + 2 * BLEED
    for j, (nm, bg, letters, ring, k) in enumerate([('light', WHITE, INK, ORANGE, INK), ('dark', INK, WHITE, ORANGE, WHITE)]):
        body = step_repeat(W, H, 'mm', bg, letters, ring, k, wm_w=420, sym_d=170, pitch_x=640, pitch_y=320, x0=BLEED + 180, y0=BLEED + 160)
        L = [layer('1 · PATTERN (locked: logos repeat across the wall)', body, locked=True),
             guides([(BLEED, BLEED, TW, TH, '#00A3FF')], W, H, 'Dashed line = final size 300 x 200 cm. The 2 cm outside it is bleed (cut off).')]
        base = f'Press backdrop 300x200cm - {nm}'
        add(f'C - Events, stage and video/0{j+1} Press backdrop 300x200cm - {nm}', base,
            doc(f'{W:.0f}', f'{H:.0f}', (f'{W:.0f}mm', f'{H:.0f}mm'), L, f'Kreislo {base}', f'Kreislo - {base} - preview.png', units='mm', dpi=50),
            [dict(out='{b} - PRINT.pdf', mm=(W, H)), dict(out='{b} - preview.png', mm=(W, H), dpi=40)],
            f"""Kreislo - {base} (step-and-repeat media wall)
The wall behind speakers at press conferences, interviews, launches and live shows: the logo and the symbol repeat
in staggered rows, so every photo and video shows the brand whatever the crop.
Final size 300 x 200 cm + 2 cm bleed on every side = document 304 x 204 cm. Send the PRINT.pdf: it is vector,
so it is sharp at any size (a 300 dpi picture of a 3 m wall would be 35,000 pixels wide; print shops use the PDF).
Order it on matte fabric (Stoffbanner / textile) or matte PVC, never glossy: glossy reflects the camera flash.
A different size (for example 240 x 240 cm pop-up): ask the shop for their size and bleed, then in Inkscape
File > Document Properties change width and height and move the pattern; the logos just continue.
Light version: best for photos (faces stand out). Dark version: strong on video and stage lights.
""")
    # Roll-up banner 85 x 200 cm
    RB = 5.0; RW, RH = 850 + 2 * RB, 2000 + 2 * RB; x0 = RB; m = 70
    deco, txt = [], []
    deco.append(f'<rect width="{RW}" height="{RH}" fill="{INK}"/>')
    deco.append(f'<g opacity="0.07">{K.ring(RW - 60, 1020, 900, 900, 150, WHITE, gap=K.RING_GAP, head=K.RING_HEAD)}</g>')
    lg, lw = logo(RW / 2, 170, 116, WHITE, ORANGE, anchor='middle'); deco.append(lg)
    deco.append(tagline(RW / 2 - lw / 2, 170 + 116 + 50 + 18, lw, GREY, 18))
    txt.append(T(x0 + m, 690, 'KEEP GOOD', 128, label='Headline 1'))
    txt.append(T(x0 + m, 830, 'THINGS', 128, label='Headline 2'))
    txt.append(T(x0 + m, 970, 'MOVING', 128, 'Oswald', 600, ORANGE, label='Headline 3'))
    services = ['Second-hand appliances,', 'tools and machines', 'Digital products', 'Fulfilment and storage in Gießen', 'Shipping from Germany to Kenya']
    y = 1140; first = True
    for s in services:
        if not s.startswith('tools'):
            deco.append(check(x0 + m + 18, y - 12, 18))
        txt.append(T(x0 + m + 54, y, s, 38, 'Open Sans', 600, WHITE, label='Service line')); y += 58 if s.endswith(',') else 76
    qy = 1580
    deco.append(f'<g inkscape:label="QR code placeholder (replace)"><rect x="{x0+m}" y="{qy}" width="240" height="240" rx="12" fill="{WHITE}"/>'
                + T(x0 + m + 120, qy + 112, 'QR CODE', 34, 'Oswald', 600, '#999999', 'middle') + T(x0 + m + 120, qy + 150, 'to your shop', 22, 'Open Sans', 400, '#999999', 'middle') + '</g>')
    txt.append(T(x0 + m + 280, qy + 70, 'SCAN · SHOP · ASK', 40, label='QR text'))
    txt.append(T(x0 + m + 280, qy + 130, CONTACT['web'], 46, 'Oswald', 500, ORANGE, label='Website'))
    txt.append(T(x0 + m + 280, qy + 186, 'WhatsApp ' + CONTACT['phone'], 30, 'Open Sans', 600, WHITE, label='Phone'))
    deco.append(f'<rect inkscape:label="Bottom band (hidden in the stand)" x="0" y="{RH - RB - 100}" width="{RW}" height="{100 + RB}" fill="{ORANGE}"/>')
    L = [layer('1 · BACKGROUND AND GRAPHICS', ''.join(deco)), layer('2 · TEXT – double-click to edit', ''.join(txt)),
         guides([(x0, RB, 850, 2000, '#00A3FF'), (x0 + 40, RB + 40, 770, 1860 - 100, '#FF00AA')], RW, RH,
                'Blue = final size 85 x 200 cm · Pink = keep text inside · bottom 10 cm goes into the stand')]
    base = 'Roll-up banner 85x200cm'
    add('C - Events, stage and video/03 Roll-up banner 85x200cm', base,
        doc(f'{RW:.0f}', f'{RH:.0f}', (f'{RW:.0f}mm', f'{RH:.0f}mm'), L, 'Kreislo roll-up', f'Kreislo - {base} - preview.png', units='mm', dpi=72),
        [dict(out='{b} - PRINT.pdf', mm=(RW, RH)), dict(out='{b} - preview.png', mm=(RW, RH), dpi=72)],
        f"""Kreislo - {base}
A stand-up banner for stages, fairs, markets, the warehouse entrance and next to the press wall.
Final size 85 x 200 cm + 5 mm bleed (document 86 x 201 cm). The bottom 10 cm disappears into the stand: no text there.
Before printing: replace the QR code placeholder (make a QR code for your shop address, File > Import it, put it on the
white square), check the phone number, then File > Save a Copy... > PDF ("Convert text to paths" ticked) and send that
PDF. Print shops often have their own template: if their size or bleed differs, change Document Properties.
Text stays editable here, so you need the fonts Oswald and Open Sans installed.
""")
    # Video backgrounds 1920 x 1080
    VW, VH = 1920, 1080
    for j, (nm, kind) in enumerate([('pattern light', 'light'), ('pattern dark', 'dark'), ('clean dark', 'clean')]):
        if kind == 'clean':
            body = (f'<defs><radialGradient id="vg" cx="0.35" cy="0.45" r="0.9"><stop offset="0" stop-color="#2A2A2A"/><stop offset="1" stop-color="{INK}"/></radialGradient></defs>'
                    f'<rect width="{VW}" height="{VH}" fill="url(#vg)"/>'
                    f'<g opacity="0.10">{K.ring(1700, 760, 900, 900, 140, WHITE, gap=K.RING_GAP, head=K.RING_HEAD)}</g>')
            lg, lw = logo(VW - 90, 80, 64, WHITE, ORANGE, anchor='end'); body += lg
            body += tagline(VW - 90 - lw, 80 + 64 + 30 + 13, lw, GREY, 13)
            body += f'<rect x="0" y="{VH - 10}" width="{VW}" height="10" fill="{ORANGE}"/>'
        else:
            bg, letters, k = (WHITE, INK, INK) if kind == 'light' else (INK, WHITE, WHITE)
            body = step_repeat(VW, VH, 'px', bg, letters, ORANGE, k, wm_w=300, sym_d=120, pitch_x=460, pitch_y=230, x0=130, y0=110)
        L = [layer('1 · BACKGROUND (locked)', body, locked=True),
             guides([(560, 260, 800, 820, '#00A3FF')], VW, VH, 'Where you usually sit in the picture')]
        base = f'Video background - {nm}'
        add(f'C - Events, stage and video/0{4+j} Video background - {nm}', base,
            doc(VW, VH, (f'{VW}px', f'{VH}px'), L, f'Kreislo {base}', f'Kreislo - {base} - 1920x1080.png', dpi=96),
            [dict(out='{b} - 1920x1080.png', w=VW, h=VH, scale=1, dpi=72, jpg=False), dict(out='{b} - 4K 3840x2160.png', w=VW, h=VH, scale=2, dpi=72)],
            f"""Kreislo - {base}
Background picture for live shows, interviews and video calls (Zoom, Microsoft Teams, Google Meet, OBS, StreamYard),
and for screens behind a stage. Use the 1920x1080 file (that is the size Zoom and Teams ask for); the 4K file is for
big screens and OBS.
Zoom: Settings > Background & Effects > + > Add image. Teams: Effects > Backgrounds > Add new.
Your own preview may show the logo mirrored: that is only on your screen, the others see it the right way round.
Screens use pixels, not dpi, so these are given in pixels.
""")
    with open(os.path.join(OUT, 'jobs.json'), 'w') as f: json.dump(jobs, f, indent=1)
    print(len(jobs), 'render jobs')

if __name__ == '__main__':
    build()
