"""Kreislo logo geometry: outlined SVG for every logo version and colourway.
Run: python3 -I kreislo.py <fonts dir> <out dir>"""
import math, os, sys, json
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen
from fontTools.pens.boundsPen import BoundsPen

FONTS, OUT = sys.argv[1], sys.argv[2]
INK, ORANGE, PAPER, WHITE = '#111111', '#FF3300', '#F7F5F2', '#FFFFFF'
WORD = TTFont(os.path.join(FONTS, 'Oswald-600.ttf'))
TAG = TTFont(os.path.join(FONTS, 'OpenSans-600.ttf'))

def glyph(font, ch):
    return font.getBestCmap()[ord(ch)]

def outline(font, text, cap, x, base, tracking=0.0):
    """Path data for text with cap height `cap` (px) starting at x on baseline `base`. Returns (d, width)."""
    upm = font['head'].unitsPerEm
    s = cap / font['OS/2'].sCapHeight
    gs = font.getGlyphSet(); hmtx = font['hmtx']
    parts, pen_x = [], x
    for i, ch in enumerate(text):
        if ch == ' ':
            pen_x += hmtx['space'][0] * s + tracking * upm * s
            continue
        g = glyph(font, ch)
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (s, 0, 0, -s, pen_x, base)))
        parts.append(pen.getCommands())
        pen_x += hmtx[g][0] * s + (tracking * upm * s if i < len(text) - 1 else 0)
    return ' '.join(parts), pen_x - x

def glyph_box(font, ch, cap):
    s = cap / font['OS/2'].sCapHeight
    gs = font.getGlyphSet(); bp = BoundsPen(gs); gs[glyph(font, ch)].draw(bp)
    x0, y0, x1, y1 = bp.bounds
    return x0 * s, y0 * s, x1 * s, y1 * s, font['hmtx'][glyph(font, ch)][0] * s

def o_stroke(font, cap):
    """Thickness of the letter O's side wall, so the ring matches the letters."""
    s = cap / font['OS/2'].sCapHeight
    gs = font.getGlyphSet(); rec = RecordingPen(); gs[glyph(font, 'O')].draw(rec)
    contours, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ('closePath', 'endPath'):
            contours.append(cur); cur = []
    boxes = []
    for c in contours:
        r = RecordingPen(); r.value = c; bp = BoundsPen(gs); r.replay(bp); boxes.append(bp.bounds)
    boxes.sort(key=lambda b: b[2] - b[0], reverse=True)
    return (boxes[0][2] - boxes[1][2]) * s

def ring(cx, cy, w, h, sw, colour, gap=(-28, 266), head=(0.86, 1.05)):
    """Circular arrow drawn on an oval w x h (outer size): a gap at the top right and an arrowhead
    pointing clockwise into the gap, like "play it again"."""
    rx, ry = (w - sw) / 2, (h - sw) / 2
    t0, t1 = math.radians(gap[0]), math.radians(gap[1])
    pt = lambda t: (cx + rx * math.cos(t), cy + ry * math.sin(t))
    p0, p1 = pt(t0), pt(t1)
    arc = f'M{p0[0]:.2f} {p0[1]:.2f}A{rx:.2f} {ry:.2f} 0 1 1 {p1[0]:.2f} {p1[1]:.2f}'
    tx, ty = -rx * math.sin(t1), ry * math.cos(t1); n = math.hypot(tx, ty); tx, ty = tx / n, ty / n
    nx, ny = ry * math.cos(t1), rx * math.sin(t1); n = math.hypot(nx, ny); nx, ny = nx / n, ny / n
    hw, tip = sw * head[0], sw * head[1]
    b1 = (p1[0] + nx * hw, p1[1] + ny * hw)
    b2 = (p1[0] - nx * hw, p1[1] - ny * hw)
    tp = (p1[0] + tx * tip, p1[1] + ty * tip)
    arrow = f'M{b1[0]:.2f} {b1[1]:.2f}L{tp[0]:.2f} {tp[1]:.2f}L{b2[0]:.2f} {b2[1]:.2f}Z'
    return (f'<path d="{arc}" fill="none" stroke="{colour}" stroke-width="{sw:.2f}" stroke-linecap="butt"/>'
            f'<path d="{arrow}" fill="{colour}"/>')

NAME = 'KREISLO'                 # the name; the last O becomes the arrow ring
RING_AT = 6                      # position of the ring in NAME
CAP = 100.0                      # cap height of the wordmark in SVG units
RING_SW = 0.165                  # ring stroke as a share of its diameter (symbol)
WORD_RING_SW = 0.19             # a little heavier in the wordmark, to match the letter stems
RING_GAP = (-32, 264)            # where the ring starts and where the arrow sits (degrees, clockwise from 3 o'clock)
RING_HEAD = (0.92, 1.12)         # arrowhead half-width and length, in stroke widths
TRACK = 0.055                    # letter spacing of the wordmark (em)

def wordmark(x, base, letters, ringc):
    """KREISL◯ at cap height CAP. Returns (svg, width)."""
    sw = o_stroke(WORD, CAP) * 0.98
    ox0, oy0, ox1, oy1, oadv = glyph_box(WORD, 'O', CAP)
    upm_s = CAP / WORD['OS/2'].sCapHeight * WORD['head'].unitsPerEm
    out, pen = [], x
    for i, ch in enumerate(NAME):
        if i == RING_AT:
            D = CAP * 1.0                                   # circle as tall as the capitals
            lsb, rsb = ox0 * 0.15 + TRACK * upm_s * 0.15, (oadv - ox1) * 1.1   # the L's open right side needs less space
            cx = pen + lsb + D / 2; cy = base - CAP / 2
            out.append(ring(cx, cy, D, D, D * WORD_RING_SW, ringc, gap=RING_GAP, head=RING_HEAD))
            pen += lsb + D + rsb + TRACK * upm_s
            continue
        dpath, w = outline(WORD, ch, CAP, pen, base)
        out.append(f'<path d="{dpath}" fill="{letters}"/>')
        pen += w + TRACK * upm_s
    return ''.join(out), pen - TRACK * upm_s - x

def tagline(x, base, width, colour, text='KEEP GOOD THINGS MOVING', cap=None):
    """Tagline spread to exactly `width`."""
    cap = cap or CAP * 0.155
    _, w0 = outline(TAG, text, cap, 0, 0, 0)
    upm_s = cap / TAG['OS/2'].sCapHeight * TAG['head'].unitsPerEm
    track = (width - w0) / (len(text) - 1) / upm_s
    d, w = outline(TAG, text, cap, x, base, track)
    return f'<path d="{d}" fill="{colour}"/>'

def symbol(cx, cy, d, ringc, letter):
    """Round symbol: the arrow ring with a K inside."""
    sw = d * RING_SW
    cap = d * 0.34
    ex0, ey0, ex1, ey1, eadv = glyph_box(WORD, 'K', cap)
    dpath, _ = outline(WORD, 'K', cap, cx - (ex0 + ex1) / 2, cy + cap / 2)
    return ring(cx, cy, d, d, sw, ringc, gap=RING_GAP, head=RING_HEAD) + f'<path d="{dpath}" fill="{letter}"/>'

def svg(w, h, body, bg=None, title='Kreislo'):
    rect = f'<rect width="{w:.2f}" height="{h:.2f}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" width="{w:.2f}" height="{h:.2f}">'
            f'<title>{title}</title>{rect}{body}</svg>\n')

COLOURWAYS = {                    # letters, ring, tagline
    'colour-on-light': (INK, ORANGE, '#555555'),
    'colour-on-dark': (WHITE, ORANGE, '#CFCFCF'),
    'black': (INK, INK, INK),
    'white': (WHITE, WHITE, WHITE),
}

def build():
    os.makedirs(OUT, exist_ok=True)
    pad = CAP * 0.30
    _, ww = wordmark(0, 0, INK, ORANGE)
    files = {}
    for name, (lc, rc, tc) in COLOURWAYS.items():
        # 1. primary: wordmark + tagline
        body, _ = wordmark(pad, pad + CAP, lc, rc)
        body += tagline(pad, pad + CAP + CAP * 0.42, ww, tc)
        files[f'kreislo-logo-primary-{name}.svg'] = svg(ww + 2 * pad, CAP * 1.42 + 2 * pad + CAP * 0.02, body)
        # 2. wordmark only
        body, _ = wordmark(pad, pad + CAP, lc, rc)
        files[f'kreislo-wordmark-{name}.svg'] = svg(ww + 2 * pad, CAP + 2 * pad + CAP * 0.03, body)
        # 3. stacked: symbol above wordmark + tagline
        sd = CAP * 1.9; W = ww + 2 * pad
        body = symbol(W / 2, pad + sd / 2, sd, rc, lc)
        y = pad + sd + CAP * 0.45 + CAP
        b2, _ = wordmark(pad, y, lc, rc); body += b2
        body += tagline(pad, y + CAP * 0.42, ww, tc)
        files[f'kreislo-logo-stacked-{name}.svg'] = svg(W, y + CAP * 0.42 + pad, body)
        # 4. symbol only
        sd = 200
        files[f'kreislo-symbol-{name}.svg'] = svg(sd + 2 * pad, sd + 2 * pad, symbol(sd / 2 + pad, sd / 2 + pad, sd, rc, lc))
    # 5. app icon / favicon: symbol on a rounded ink square (and a square version for iOS)
    S = 512
    files['kreislo-app-icon-rounded.svg'] = svg(S, S, f'<rect width="{S}" height="{S}" rx="{S*0.22}" fill="{INK}"/>' + symbol(S/2, S/2, S*0.70, ORANGE, WHITE))
    files['kreislo-app-icon-square.svg'] = svg(S, S, symbol(S/2, S/2, S*0.66, ORANGE, WHITE), bg=INK)
    files['kreislo-app-icon-orange.svg'] = svg(S, S, f'<rect width="{S}" height="{S}" rx="{S*0.22}" fill="{ORANGE}"/>' + symbol(S/2, S/2, S*0.70, WHITE, WHITE))
    files['kreislo-profile-circle.svg'] = svg(S, S, f'<circle cx="{S/2}" cy="{S/2}" r="{S/2}" fill="{INK}"/>' + symbol(S/2, S/2, S*0.60, ORANGE, WHITE))
    for k, v in files.items():
        open(os.path.join(OUT, k), 'w').write(v)
    json.dump({'wordmark_width': ww, 'cap': CAP, 'ring_stroke': o_stroke(WORD, CAP)}, open(os.path.join(OUT, '_metrics.json'), 'w'))
    print(len(files), 'svg files; wordmark width', round(ww, 1))

if __name__ == '__main__':
    build()
