#!/usr/bin/env python3
"""Build every EFIC logo file from the fonts in logo/fonts.

    pip install fonttools uharfbuzz cairosvg pillow
    python3 logo/tools/build_logo.py

Writes:
  efic-logo-master.svg   Inkscape project: one page and one layer per version, live text
  svg/                   every version with the text turned into shapes (looks the same everywhere)
  png/  pdf/             ready-made exports
  web/  social/  email/  favicon, app icons, banners, email signature
  guidelines/guidelines.html   (tools/render_guidelines.js turns it into the PDF)

The geometry was measured from the original logo (1000 x 1000 px image):
EFIC is Source Sans 3 Black, the subtitle Source Sans 3 Regular.
"""
import io
import os

import cairosvg
import uharfbuzz as hb
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
FONTS = os.path.join(ROOT, 'fonts')

# ---- Brand colours -------------------------------------------------------
NAVY = '#14213D'
GOLD = '#E7B165'
WHITE = '#FFFFFF'
BLACK = '#000000'

# role -> colour for each colourway; 'bg' None means transparent
COLOURWAYS = {
    'navy-bg':  {'label': 'Full colour on navy',   'type': WHITE, 'accent': GOLD, 'bg': NAVY},
    'reverse':  {'label': 'White and gold, no background (for dark backgrounds)', 'type': WHITE, 'accent': GOLD, 'bg': None},
    'positive': {'label': 'Navy and gold, no background (for white backgrounds)', 'type': NAVY, 'accent': GOLD, 'bg': None},
    'white':    {'label': 'One colour: white',      'type': WHITE, 'accent': WHITE, 'bg': None},
    'navy':     {'label': 'One colour: navy',       'type': NAVY, 'accent': NAVY, 'bg': None},
    'black':    {'label': 'One colour: black',      'type': BLACK, 'accent': BLACK, 'bg': None},
}
SWATCH = {WHITE: 'efic-white', GOLD: 'efic-gold', NAVY: 'efic-navy', BLACK: 'efic-black'}


def num(v):
    s = '%.2f' % v
    s = s.rstrip('0').rstrip('.')
    return '0' if s in ('-0', '') else s


# ---- Fonts ---------------------------------------------------------------
class Face:
    def __init__(self, file, family, weight, spec):
        path = os.path.join(FONTS, file)
        self.tt = TTFont(path)
        self.gs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.upm = self.tt['head'].unitsPerEm
        self.hb = hb.Font(hb.Face(hb.Blob.from_file_path(path)))
        self.family, self.weight, self.spec = family, weight, spec

    def layout(self, text, size, ls):
        """Glyphs with pen positions (px), the ink box relative to the pen
        origin and baseline (y down), and the advance incl. letter-spacing."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {'kern': True, 'liga': True})
        s = size / self.upm
        x = 0.0
        glyphs, xs, ys = [], [], []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            name = self.order[info.codepoint]
            gx, gy = x + pos.x_offset * s, -pos.y_offset * s
            glyphs.append((name, gx, gy))
            bp = BoundsPen(self.gs)
            self.gs[name].draw(bp)
            if bp.bounds:
                a, b, c, d = bp.bounds
                xs += [gx + a * s, gx + c * s]
                ys += [gy - d * s, gy - b * s]
            x += pos.x_advance * s + ls
        return glyphs, (min(xs), min(ys), max(xs), max(ys)), x

    def path(self, glyphs, size, ox, baseline):
        s = size / self.upm
        pen = SVGPathPen(self.gs, ntos=num)
        for name, gx, gy in glyphs:
            self.gs[name].draw(TransformPen(pen, (s, 0, 0, -s, ox + gx, baseline + gy)))
        return pen.getCommands()


BLACKF = Face('SourceSans3-Black.ttf', 'Source Sans 3', 900, 'Source Sans 3 Heavy')
REGF = Face('SourceSans3-Regular.ttf', 'Source Sans 3', 400, 'Source Sans 3')


# ---- Logo geometry -------------------------------------------------------
# A mark is a list of parts in its own coordinates plus its ink box.
# Text parts: ('text', face, string, size, letter-spacing, ink-left, baseline, role)
# Bar parts:  ('bar', x, y, w, h, role)
class Mark:
    def __init__(self, name, title):
        self.name, self.title, self.parts = name, title, []
        self.box = None

    def _grow(self, b):
        self.box = b if self.box is None else (min(self.box[0], b[0]), min(self.box[1], b[1]),
                                               max(self.box[2], b[2]), max(self.box[3], b[3]))

    def text(self, face, string, size, ls, baseline, left=None, centre=None, role='type'):
        glyphs, ink, adv = face.layout(string, size, ls)
        w = ink[2] - ink[0]
        if left is None:
            left = centre - w / 2
        ox = left - ink[0]
        self.parts.append(('text', face, string, size, ls, ox, baseline, role, glyphs, adv))
        self._grow((left, baseline + ink[1], left + w, baseline + ink[3]))
        return (left, baseline + ink[1], left + w, baseline + ink[3])

    def bar(self, x, y, w, h, role='accent'):
        self.parts.append(('bar', x, y, w, h, role))
        self._grow((x, y, x + w, y + h))


# Measured on the 1000 px original: EFIC 606 x 213 px, rule 651 x 8 px,
# subtitle 599 px wide. Sizes below reproduce those within a pixel.
EFIC_SIZE, EFIC_LS = 316.0, 1.6
SUB_SIZE, SUB_LS = 70.7, 0.74
EFIC_BASE = 209.2           # EFIC ink top at y = 0
RULE_W, RULE_H, RULE_GAP = 651.0, 8.0, 21.0
SUB_BASE = 307.4
SUBTITLE = 'Efic Consultancy Ltd'
X = SUB_SIZE * 0.66         # clear-space unit: cap height of the subtitle E


def primary():
    m = Mark('primary', 'Primary logo (stacked)')
    m.text(BLACKF, 'EFIC', EFIC_SIZE, EFIC_LS, EFIC_BASE, centre=0)
    m.bar(-RULE_W / 2, EFIC_BASE + RULE_GAP, RULE_W, RULE_H)
    m.text(REGF, SUBTITLE, SUB_SIZE, SUB_LS, SUB_BASE, centre=0)
    return m


def wordmark():
    m = Mark('wordmark', 'Wordmark (EFIC and rule)')
    m.text(BLACKF, 'EFIC', EFIC_SIZE, EFIC_LS, EFIC_BASE, centre=0)
    # a little thicker than in the full logo: this version is used smaller
    m.bar(-RULE_W / 2, EFIC_BASE + RULE_GAP, RULE_W, RULE_H * 1.5)
    return m


def horizontal():
    m = Mark('horizontal', 'Horizontal logo')
    ink = m.text(BLACKF, 'EFIC', EFIC_SIZE, EFIC_LS, EFIC_BASE, left=0)
    cap = ink[3] - ink[1]
    gap = 0.23 * cap
    bx = ink[2] + gap
    m.bar(bx, ink[1], RULE_H * 1.25, cap)
    tx = bx + RULE_H * 1.25 + gap
    size = 108.0
    asc = 0.724 * size                      # top of f, l, d
    m.text(REGF, 'Efic', size, size * 0.0105, ink[1] + asc, left=tx)
    m.text(REGF, 'Consultancy Ltd', size, size * 0.0105, EFIC_BASE, left=tx)
    return m


def icon():
    """The E with a gold bar, on a navy square: favicon and app icons."""
    m = Mark('icon', 'Icon (E)')
    size = 512.0
    f = 0.47 * size / 0.66
    glyphs, ink, adv = BLACKF.layout('E', f, 0)
    w, cap = ink[2] - ink[0], ink[3] - ink[1]
    barh, gap = 0.075 * size, 0.06 * size
    top = (size - (cap + gap + barh)) / 2
    m.text(BLACKF, 'E', f, 0, top - ink[1], centre=size / 2)
    m.bar((size - w * 1.15) / 2, top + cap + gap, w * 1.15, barh)
    m.box = (0, 0, size, size)
    m.square = True
    return m


MARKS = {k: f() for k, f in [('primary', primary), ('horizontal', horizontal),
                              ('wordmark', wordmark), ('icon', icon)]}


# ---- SVG writers ---------------------------------------------------------
def outlined_parts(mark, cw, dx=0.0, dy=0.0, k=1.0, indent='  '):
    out = []
    for p in mark.parts:
        if p[0] == 'text':
            _, face, string, size, ls, ox, base, role, glyphs, adv = p
            d = face.path([(g, x * k, y * k) for g, x, y in glyphs], size * k, ox * k + dx, base * k + dy)
            out.append('%s<path aria-label="%s" fill="%s" d="%s"/>' % (indent, string, cw[role], d))
        else:
            _, x, y, w, h, role = p
            out.append('%s<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"/>' % (
                indent, num(x * k + dx), num(y * k + dy), num(w * k), num(h * k), num(min(w, h) * k / 2), cw[role]))
    return out


def padded(mark, pad):
    if getattr(mark, 'square', False):
        return mark.box
    x0, y0, x1, y1 = mark.box
    return (x0 - pad, y0 - pad, x1 + pad, y1 + pad)


def outlined_svg(mark, cwname, pad=None):
    cw = COLOURWAYS[cwname]
    if getattr(mark, 'square', False):
        cw = dict(cw, bg=cw['bg'] or (NAVY if cw['type'] == WHITE else None))
    if pad is None:
        pad = X * (2 if cw['bg'] else 1)
    x0, y0, x1, y1 = padded(mark, pad)
    w, h = x1 - x0, y1 - y0
    lines = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s %s %s %s" width="%s" height="%s">' % (
        num(x0), num(y0), num(w), num(h), num(w), num(h)),
        '  <title>EFIC Consultancy Ltd</title>']
    if cw['bg']:
        lines.append('  <rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>' % (num(x0), num(y0), num(w), num(h), cw['bg']))
    lines += outlined_parts(mark, cw)
    lines.append('</svg>')
    return '\n'.join(lines) + '\n'


def canvas_svg(W, H, bg, items):
    """items: (mark, colourway, scale, left, top) placed by ink box."""
    lines = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" width="%d" height="%d">' % (W, H, W, H),
             '  <title>EFIC Consultancy Ltd</title>',
             '  <rect width="%d" height="%d" fill="%s"/>' % (W, H, bg)]
    for mark, cwname, k, left, top in items:
        lines += outlined_parts(mark, COLOURWAYS[cwname], left - mark.box[0] * k, top - mark.box[1] * k, k)
    lines.append('</svg>')
    return '\n'.join(lines) + '\n'


def fit(mark, W, H, maxw, maxh, cy=None):
    x0, y0, x1, y1 = mark.box
    k = min(maxw / (x1 - x0), maxh / (y1 - y0))
    cy = H / 2 if cy is None else cy
    return k, (W - (x1 - x0) * k) / 2, cy - (y1 - y0) * k / 2


# ---- Inkscape master -----------------------------------------------------
MASTER_PAGES = [
    ('primary', 'navy-bg'), ('primary', 'positive'), ('primary', 'reverse'),
    ('primary', 'white'), ('primary', 'navy'), ('primary', 'black'),
    ('horizontal', 'navy-bg'), ('horizontal', 'positive'), ('horizontal', 'reverse'), ('horizontal', 'navy'),
    ('wordmark', 'navy-bg'), ('wordmark', 'positive'), ('wordmark', 'navy'),
    ('icon', 'navy-bg'),
]


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('"', '&quot;')


def live_parts(mark, cw, indent):
    out = []
    for p in mark.parts:
        if p[0] == 'text':
            _, face, string, size, ls, ox, base, role, glyphs, adv = p
            style = ("font-family:'%s';font-weight:%d;font-style:normal;font-size:%spx;line-height:1;"
                     "letter-spacing:%spx;-inkscape-font-specification:'%s';text-anchor:middle;"
                     "text-align:center;fill:url(#%s)") % (face.family, face.weight, num(size), num(ls),
                                                            face.spec, SWATCH[cw[role]])
            out.append('%s<text xml:space="preserve" style="%s" x="%s" y="%s" inkscape:label="%s">%s</text>' % (
                indent, style, num(ox + adv / 2), num(base), esc(string), esc(string)))
        else:
            _, x, y, w, h, role = p
            out.append('%s<rect x="%s" y="%s" width="%s" height="%s" rx="%s" style="fill:url(#%s)" inkscape:label="Gold rule"/>' % (
                indent, num(x), num(y), num(w), num(h), num(min(w, h) / 2), SWATCH[cw[role]]))
    return out


def master_svg():
    gap = 120
    pages, x, y, rowh, col = [], 0.0, 0.0, 0.0, 0
    cols = {'primary': 3, 'horizontal': 2, 'wordmark': 3, 'icon': 1}
    last = None
    for name, cwname in MASTER_PAGES:
        mark = MARKS[name]
        cw = COLOURWAYS[cwname]
        x0, y0, x1, y1 = padded(mark, X * (2 if cw['bg'] else 1))
        w, h = x1 - x0, y1 - y0
        if last is not None and (name != last or col >= cols[name]):
            x, y, rowh, col = 0.0, y + rowh + gap, 0.0, 0
        pages.append((name, cwname, x, y, w, h, x0, y0))
        x += w + gap
        rowh = max(rowh, h)
        col += 1
        last = name
    W0, H0 = pages[0][4], pages[0][5]
    out = ['<?xml version="1.0" encoding="UTF-8" standalone="no"?>',
           '<!-- EFIC Consultancy Ltd: logo master. Open in Inkscape 1.2 or newer.',
           '     Install the fonts in the fonts folder first (see README.md). -->',
           '<svg xmlns="http://www.w3.org/2000/svg"',
           '     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"',
           '     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"',
           '     xmlns:osb="http://www.openswatchbook.org/uri/2009/osb"',
           '     width="%spx" height="%spx" viewBox="0 0 %s %s" version="1.1" id="efic-logo-master">' % (
               num(W0), num(H0), num(W0), num(H0)),
           '  <title>EFIC Consultancy Ltd logo master</title>',
           '  <sodipodi:namedview id="namedview" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1"',
           '     inkscape:pagecheckerboard="true" inkscape:deskcolor="#d1d1d1" inkscape:document-units="px">']
    for i, (name, cwname, x, y, w, h, *_r) in enumerate(pages):
        out.append('    <inkscape:page x="%s" y="%s" width="%s" height="%s" id="page-%s-%s" inkscape:label="%s - %s"/>' % (
            num(x), num(y), num(w), num(h), name, cwname, MARKS[name].title, COLOURWAYS[cwname]['label']))
    out.append('  </sodipodi:namedview>')
    out.append('  <defs id="defs">')
    for colour, sid in [(NAVY, 'efic-navy'), (GOLD, 'efic-gold'), (WHITE, 'efic-white'), (BLACK, 'efic-black')]:
        out.append('    <linearGradient id="%s" inkscape:swatch="solid" osb:paint="solid" inkscape:label="%s"><stop offset="0" style="stop-color:%s;stop-opacity:1"/></linearGradient>' % (
            sid, sid.replace('efic-', 'EFIC ').title().replace('Efic', 'EFIC'), colour))
    out.append('  </defs>')
    for i, (name, cwname, x, y, w, h, x0, y0) in enumerate(pages):
        mark, cw = MARKS[name], COLOURWAYS[cwname]
        if getattr(mark, 'square', False):
            cw = dict(cw, bg=NAVY)
        out.append('  <g inkscape:groupmode="layer" id="layer-%s-%s" inkscape:label="%02d %s - %s">' % (
            name, cwname, i + 1, MARKS[name].title, cw['label']))
        out.append('    <g transform="translate(%s,%s)">' % (num(x - x0), num(y - y0)))
        if cw['bg']:
            out.append('      <rect x="%s" y="%s" width="%s" height="%s" style="fill:url(#%s)" inkscape:label="Background" sodipodi:insensitive="true"/>' % (
                num(x0), num(y0), num(w), num(h), SWATCH[cw['bg']]))
        out += live_parts(mark, cw, '      ')
        out.append('    </g>')
        out.append('  </g>')
    out.append('</svg>')
    return '\n'.join(out) + '\n', pages


# ---- Raster helpers ------------------------------------------------------
def pixel_icon(n):
    """The icon drawn on a 16 x 16 grid (scaled 2x / 3x), for favicons."""
    k = n // 16
    im = Image.new('RGB', (n, n), NAVY)
    px = im.load()
    white = tuple(int(WHITE[i:i + 2], 16) for i in (1, 3, 5))
    gold = tuple(int(GOLD[i:i + 2], 16) for i in (1, 3, 5))
    rects = [((4, 1, 6, 10), white),            # stem
             ((4, 1, 11, 2), white),            # top arm
             ((4, 5, 10, 6), white),            # middle arm
             ((4, 9, 11, 10), white),           # bottom arm
             ((4, 12, 11, 13), gold)]           # gold bar
    for (x0, y0, x1, y1), c in rects:
        for x in range(x0 * k, (x1 + 1) * k):
            for y in range(y0 * k, (y1 + 1) * k):
                px[x, y] = c
    return im


def png(svg, path, width=None, height=None):
    cairosvg.svg2png(bytestring=svg.encode(), write_to=path, output_width=width, output_height=height)


def write(rel, text):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(text)
    return path


def out(rel):
    path = os.path.join(ROOT, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def main():
    master, pages = master_svg()
    write('efic-logo-master.svg', master)

    svgs = {}
    sets = {
        'primary': ['navy-bg', 'positive', 'reverse', 'white', 'navy', 'black'],
        'horizontal': ['navy-bg', 'positive', 'reverse', 'white', 'navy', 'black'],
        'wordmark': ['navy-bg', 'positive', 'reverse', 'white', 'navy', 'black'],
    }
    for name, cws in sets.items():
        for cwname in cws:
            svg = outlined_svg(MARKS[name], cwname)
            svgs[(name, cwname)] = svg
            base = 'efic-%s-%s' % (name, cwname)
            write('svg/%s.svg' % base, svg)
            for wpx in ([2000, 1000, 500] if name != 'wordmark' else [1000, 500, 250]):
                png(svg, out('png/%s/%s-%dpx.png' % (name, base, wpx)), width=wpx)
            if cwname in ('navy-bg', 'positive', 'navy', 'black', 'white', 'reverse'):
                cairosvg.svg2pdf(bytestring=svg.encode(), write_to=out('pdf/%s.pdf' % base))

    # icon
    icon_svg = outlined_svg(MARKS['icon'], 'navy-bg')
    write('svg/efic-icon.svg', icon_svg)
    write('web/favicon.svg', icon_svg)
    for wpx, rel in [(1024, 'png/icon/efic-icon-1024px.png'), (512, 'web/icon-512.png'), (192, 'web/icon-192.png'),
                     (180, 'web/apple-touch-icon.png')]:
        png(icon_svg, out(rel), width=wpx)
    # browser-tab sizes are drawn on the pixel grid, so they stay sharp
    small = {n: pixel_icon(n) for n in (16, 32, 48)}
    small[16].save(out('web/favicon-16.png'))
    small[32].save(out('web/favicon-32.png'))
    small[48].save(out('web/favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[small[16], small[32]])

    # website header logos (transparent, for the navy menu bar or a white header)
    for cwname in ('reverse', 'positive'):
        png(svgs[('horizontal', cwname)], out('web/blogger-header-%s-600px.png' % cwname), width=600)
        png(svgs[('horizontal', cwname)], out('web/blogger-header-%s-1200px.png' % cwname), width=1200)

    # social: profile pictures (they are shown in a circle, so keep inside it)
    for name, maxfrac, rel in [('wordmark', 0.80, 'social/profile-picture-efic'),
                               ('primary', 0.80, 'social/profile-picture-full')]:
        mark = MARKS[name]
        x0, y0, x1, y1 = mark.box
        diag = ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5
        k = 1000 * maxfrac / diag
        svg = canvas_svg(1000, 1000, NAVY, [(mark, 'reverse', k, (1000 - (x1 - x0) * k) / 2, (1000 - (y1 - y0) * k) / 2)])
        write(rel + '.svg', svg)
        png(svg, out(rel + '.png'), width=1000)

    # social: banners, logo inside each platform's safe area
    banners = [
        ('linkedin-personal-banner', 1584, 396, 1000, 260),
        ('linkedin-company-cover', 1128, 191, 800, 120),
        ('facebook-cover', 1640, 624, 1100, 320),
        ('x-twitter-header', 1500, 500, 1100, 260),
        ('youtube-banner', 2560, 1440, 1546, 423),
    ]
    for rel, W, H, sw, sh in banners:
        mark = MARKS['horizontal']
        k, left, top = fit(mark, W, H, sw * 0.82, sh * 0.5)
        svg = canvas_svg(W, H, NAVY, [(mark, 'reverse', k, left, top)])
        line = max(4, round(H * 0.012))         # thin gold line along the bottom, like the rule
        svg = svg.replace('</svg>', '  <rect y="%d" width="%d" height="%d" fill="%s"/>\n</svg>' % (H - line, W, line, GOLD))
        write('social/%s.svg' % rel, svg)
        png(svg, out('social/%s.png' % rel), width=W)

    # email signature: 600 px file shown at 300 px
    for cwname, bg in (('positive', WHITE), ('reverse', NAVY)):
        mark = MARKS['horizontal']
        x0, y0, x1, y1 = mark.box
        W = 600
        k = (W - 40) / (x1 - x0)
        H = round((y1 - y0) * k + 40)
        svg = canvas_svg(W, H, bg, [(mark, cwname, k, 20, 20)])
        png(svg, out('email/email-signature-%s.png' % ('white' if bg == WHITE else 'navy')), width=W)

    # brand guidelines page (tools/render_guidelines.js makes the PDF)
    import guidelines
    write('guidelines/efic-logo-guidelines.html', guidelines.page(svgs, icon_svg, MARKS, X))
    print('pages in master:', len(pages))
    for k, m in MARKS.items():
        print(k, [round(v, 1) for v in m.box])


if __name__ == '__main__':
    main()
