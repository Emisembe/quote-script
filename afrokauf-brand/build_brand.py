#!/usr/bin/env python3
"""Generate the AfroKauf logo files and Inkscape templates.

    pip install fonttools uharfbuzz
    python3 build_brand.py            # writes logo/*.svg and templates/*.svg

Logos are pure vector paths (no font needed to open them). Templates keep their
text as live text in Bricolage Grotesque (fonts/), so install those fonts before
editing the templates in Inkscape. Every editable text has a label that starts
with "EDIT:" (see Inkscape's Layers and Objects panel).
"""
import pathlib
from xml.sax.saxutils import escape

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = pathlib.Path(__file__).resolve().parent
FONTS = ROOT / 'fonts'

# ------------------------------------------------------------------ brand colours
GREEN = '#0E4D3A'
GREEN_DARK = '#0B3B2D'
GOLD = '#E9A23B'
CLAY = '#C4552D'
CREAM = '#FBF6EE'
SAND = '#F3E3C3'
INK = '#1F2420'
MUTED = '#646A63'
WHITE = '#FFFFFF'

FAMILY = "'Bricolage Grotesque', 'Segoe UI', Arial, sans-serif"

_uid = [0]


def uid(prefix):
    _uid[0] += 1
    return '%s%d' % (prefix, _uid[0])


# ------------------------------------------------------------------ text to paths (logos)
class Face:
    def __init__(self, file):
        self.file = str(FONTS / file)
        self.tt = TTFont(self.file)
        self.glyphs = self.tt.getGlyphSet()
        self.order = self.tt.getGlyphOrder()
        self.upm = self.tt['head'].unitsPerEm
        self.hb = hb.Font(hb.Face(hb.Blob.from_file_path(self.file)))

    def paths(self, text, size, x=0.0, y=0.0, tracking=0.0, split=None):
        """Return ([(path_d, part_index)], width). tracking in em; split = index where part 1 starts."""
        buf = hb.Buffer()
        buf.add_str(text)
        buf.guess_segment_properties()
        hb.shape(self.hb, buf, {'kern': True, 'liga': True})
        scale = size / self.upm
        cx = 0.0
        out = []
        for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
            pen = SVGPathPen(self.glyphs)
            tp = TransformPen(pen, (scale, 0, 0, -scale, x + (cx + pos.x_offset) * scale, y - pos.y_offset * scale))
            self.glyphs[self.order[info.codepoint]].draw(tp)
            d = pen.getCommands()
            part = 1 if (split is not None and info.cluster >= split) else 0
            if d:
                out.append((d, part))
            cx += pos.x_advance + tracking * self.upm
        width = (cx - tracking * self.upm) * scale
        return out, width


XB = Face('BricolageGrotesque-ExtraBold.ttf')
SB = Face('BricolageGrotesque-SemiBold.ttf')
RG = Face('BricolageGrotesque-Regular.ttf')
CAP = 0.66  # cap height / em


def text_group(face, text, size, x, y, fills, tracking=0.0, split=None, label=None):
    parts, w = face.paths(text, size, x, y, tracking, split)
    by = {}
    for d, p in parts:
        by.setdefault(p, []).append(d)
    lab = ' inkscape:label="%s"' % escape(label) if label else ''
    g = ''.join('<path fill="%s" d="%s"/>' % (fills[p], ' '.join(ds)) for p, ds in sorted(by.items()))
    return '<g%s>%s</g>' % (lab, g), w


# ------------------------------------------------------------------ the mark (shopping bag, two linked handles, kente band)
# Designed in a 100-unit box; visible content spans x 12..88, y 19.5..90.
MARK_X0, MARK_Y0, MARK_W, MARK_H = 12.0, 19.5, 76.0, 70.5
BODY = 'M23 40 L77 40 Q84 40 84.6 47 L87.4 83 Q88 90 81 90 L19 90 Q12 90 12.6 83 L15.4 47 Q16 40 23 40 Z'
VARIANTS = {
    'color': dict(body=GREEN, h1=GOLD, h2=CLAY, band=[GOLD, CREAM, CLAY]),
    'reverse': dict(body=CREAM, h1=GOLD, h2=CREAM, band=[GOLD, GREEN, CLAY]),
    'mono-dark': dict(body=INK, h1=INK, h2=INK, band=None),
    'mono-white': dict(body=WHITE, h1=WHITE, h2=WHITE, band=None),
}


def mark(x, y, h, variant='color', label='AfroKauf mark'):
    """Mark whose visible top-left is (x, y) and height h. Returns (svg, width)."""
    v = VARIANTS[variant]
    s = h / MARK_H
    tf = 'translate(%.3f %.3f) scale(%.5f) translate(%.1f %.1f)' % (x, y, s, -MARK_X0, -MARK_Y0)
    handles = ('<path d="M23 46 V40 A17 17 0 0 1 57 40 V46" fill="none" stroke="%s" stroke-width="7.5" stroke-linecap="round"/>'
               '<path d="M43 46 V40 A17 17 0 0 1 77 40 V46" fill="none" stroke="%s" stroke-width="7.5" stroke-linecap="round"/>') % (v['h1'], v['h2'])
    if v['band']:
        cid = uid('bagclip')
        blocks = ''.join('<rect x="%d" y="59" width="9.5" height="12" fill="%s"/>' % (10 + i * 9.5, v['band'][i % 3]) for i in range(9))
        body = ('<defs><clipPath id="%s"><path d="%s"/></clipPath></defs><path d="%s" fill="%s"/>'
                '<g clip-path="url(#%s)">%s</g>') % (cid, BODY, BODY, v['body'], cid, blocks)
    else:
        mid = uid('bagmask')
        slots = ''.join('<rect x="%s" y="59" width="9.5" height="12" fill="black"/>' % fmt(10 + i * 9.5) for i in range(1, 9, 2))
        body = ('<defs><mask id="%s" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100"><path d="%s" fill="white"/>%s</mask></defs>'
                '<path d="%s" fill="%s" mask="url(#%s)"/>') % (mid, BODY, slots, BODY, v['body'], mid)
    return '<g inkscape:label="%s" transform="%s">%s%s</g>' % (escape(label), tf, handles, body), MARK_W * s


# ------------------------------------------------------------------ logo lockups
WORD_COLORS = {
    'color': (GREEN, CLAY), 'reverse': (CREAM, GOLD), 'mono-dark': (INK, INK), 'mono-white': (WHITE, WHITE),
}
SUB_COLORS = {'color': MUTED, 'reverse': '#CFE0D8', 'mono-dark': INK, 'mono-white': WHITE}
ACCENT = {'color': CLAY, 'reverse': GOLD, 'mono-dark': INK, 'mono-white': WHITE}


def lockup(x, y, size, variant='color', sub=None, verbund=False, label='AfroKauf logo'):
    """Horizontal logo. (x, y) = top-left of the mark; size = wordmark font size. Returns (svg, w, h)."""
    cap = size * CAP
    mh = cap * 1.62
    m, mw = mark(x, y, mh, variant)
    gap = size * 0.22
    base = y + mh * 0.86  # wordmark baseline sits near the bag's bottom
    if sub or verbund:
        base = y + mh * 0.62
    wx = x + mw + gap
    word, ww = text_group(XB, 'AfroKauf', size, wx, base, WORD_COLORS[variant], tracking=-0.01, split=4, label='Wordmark')
    extra = ''
    w = mw + gap + ww
    h = mh
    if verbund:
        vg, vw = text_group(SB, 'VERBUND', size * 0.3, wx + size * 0.03, base + size * 0.42, {0: ACCENT[variant]}, tracking=0.32, label='Verbund')
        extra += vg
        w = max(w, mw + gap + vw)
    elif sub:
        sg, sw = text_group(RG, sub, size * 0.3, wx + size * 0.02, base + size * 0.42, {0: SUB_COLORS[variant]}, label='Tagline')
        extra += sg
        w = max(w, mw + gap + sw + size * 0.02)
    return '<g inkscape:label="%s">%s%s%s</g>' % (escape(label), m, word, extra), w, h


def stacked(cx, y, size, variant='color', sub=None, label='AfroKauf logo (stacked)'):
    mh = size * CAP * 2.1
    _, mw = mark(0, 0, mh, variant)
    m, _ = mark(cx - mw / 2, y, mh, variant)
    _, ww = XB.paths('AfroKauf', size, tracking=-0.01)
    base = y + mh + size * 0.95
    word, _ = text_group(XB, 'AfroKauf', size, cx - ww / 2, base, WORD_COLORS[variant], tracking=-0.01, split=4, label='Wordmark')
    extra = ''
    h = base + size * 0.12 - y
    if sub:
        _, sw = RG.paths(sub, size * 0.3)
        sg, _ = text_group(RG, sub, size * 0.3, cx - sw / 2, base + size * 0.48, {0: SUB_COLORS[variant]}, label='Tagline')
        extra = sg
        h += size * 0.48
    return '<g inkscape:label="%s">%s%s%s</g>' % (escape(label), m, word, extra), max(mw, ww), h


# ------------------------------------------------------------------ SVG documents
def doc(w, h, body, title, units='px', layers=None):
    unit = '' if units == 'px' else units
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
           'xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" '
           'xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" '
           'version="1.1" width="%s%s" height="%s%s" viewBox="0 0 %s %s">' % (w, unit, h, unit, w, h),
           '<title>%s</title>' % escape(title),
           '<sodipodi:namedview id="namedview" pagecolor="#ffffff" bordercolor="#999999" inkscape:document-units="%s" showgrid="false"/>' % units]
    if layers:
        for layer in layers:
            name, content, locked = layer[:3]
            hidden = len(layer) > 3 and layer[3]
            out.append('<g inkscape:groupmode="layer" inkscape:label="%s" id="%s"%s%s>%s</g>' % (
                escape(name), uid('layer'), ' sodipodi:insensitive="true"' if locked else '',
                ' style="display:none"' if hidden else '', content))
    else:
        out.append(body)
    out.append('</svg>')
    return '\n'.join(out)


def T(x, y, text, size, weight=400, fill=INK, anchor='start', label=None, spacing=None, lines=None, lh=1.2, style=''):
    """Live, editable text. lines -> several lines (each its own tspan)."""
    lab = ' inkscape:label="EDIT: %s"' % escape(label) if label else ''
    sp = ' letter-spacing="%s"' % spacing if spacing is not None else ''
    attrs = 'x="%s" y="%s" font-family="%s" font-size="%s" font-weight="%d" fill="%s" text-anchor="%s"%s%s%s' % (
        fmt(x), fmt(y), escape(FAMILY, {"'": '&apos;'}), fmt(size), weight, fill, anchor, sp, lab,
        ' style="%s"' % style if style else '')
    if lines is None:
        lines = [text]
    if len(lines) == 1:
        return '<text xml:space="preserve" %s>%s</text>' % (attrs, escape(lines[0]))
    spans = ''.join('<tspan sodipodi:role="line" x="%s" y="%s">%s</tspan>' % (fmt(x), fmt(y + i * size * lh), escape(t)) for i, t in enumerate(lines))
    return '<text xml:space="preserve" %s>%s</text>' % (attrs, spans)


def fmt(n):
    return ('%.2f' % n).rstrip('0').rstrip('.') if isinstance(n, float) else str(n)


def stripe(x, y, w, h, unit):
    """Kente-style stripe band (gold, clay, green, sand)."""
    cols = [GOLD, CLAY, '#17644D', SAND]
    widths = [unit, unit, unit, unit * 0.28]
    out, cx, i = [], x, 0
    cid = uid('stripeclip')
    while cx < x + w:
        out.append('<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>' % (fmt(cx), fmt(y), fmt(widths[i % 4] + 0.01), fmt(h), cols[i % 4]))
        cx += widths[i % 4]
        i += 1
    return ('<g inkscape:label="Stripe"><defs><clipPath id="%s"><rect x="%s" y="%s" width="%s" height="%s"/></clipPath></defs>'
            '<g clip-path="url(#%s)">%s</g></g>') % (cid, fmt(x), fmt(y), fmt(w), fmt(h), cid, ''.join(out))


def dots(x, y, w, h, step, r, color, opacity):
    pid = uid('dots')
    return ('<defs><pattern id="%s" x="%s" y="%s" width="%s" height="%s" patternUnits="userSpaceOnUse">'
            '<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="%s"/></pattern></defs>'
            '<rect inkscape:label="Dot pattern" x="%s" y="%s" width="%s" height="%s" fill="url(#%s)"/>') % (
        pid, fmt(x), fmt(y), fmt(step), fmt(step), fmt(step / 2), fmt(step / 2), fmt(r), color, opacity,
        fmt(x), fmt(y), fmt(w), fmt(h), pid)


def photo(x, y, w, h, r, label, text_size, dark=False):
    """Photo frame: import a photo, put it under this frame, select both, Object > Clip > Set clip."""
    stroke = '#9AA79F' if not dark else '#5E8F7E'
    fill = SAND if not dark else '#17644D'
    tc = MUTED if not dark else '#CFE0D8'
    icon_s = min(w, h) * 0.16
    ix, iy = x + w / 2 - icon_s / 2, y + h / 2 - icon_s * 0.9
    icon = ('<g transform="translate(%s %s) scale(%s)" fill="none" stroke="%s" stroke-width="1.6" stroke-linejoin="round">'
            '<rect x="2" y="6" width="20" height="14" rx="3"/><circle cx="12" cy="13" r="4"/><path d="M8 6l1.5-3h5L16 6"/></g>') % (
        fmt(ix), fmt(iy), fmt(icon_s / 24), tc)
    return ('<g inkscape:label="PHOTO: %s">'
            '<rect inkscape:label="Photo frame (use as clip)" x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s" stroke="%s" stroke-width="%s" stroke-dasharray="%s"/>'
            '%s%s</g>') % (escape(label), fmt(x), fmt(y), fmt(w), fmt(h), fmt(r), fill, stroke, fmt(text_size * 0.12), fmt(text_size * 0.5), icon,
                           T(x + w / 2, y + h / 2 + icon_s * 0.75, 'Foto hier einfügen', text_size, 600, tc, 'middle'))


def qr_box(x, y, s, text_size):
    return ('<g inkscape:label="QR CODE: replace (Extensions > Render > Barcode > QR Code)">'
            '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="#FFFFFF"/>'
            '<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="none" stroke="#9AA79F" stroke-width="%s" stroke-dasharray="%s"/>'
            '%s</g>') % (fmt(x), fmt(y), fmt(s), fmt(s), fmt(s * 0.08), fmt(x + s * 0.08), fmt(y + s * 0.08), fmt(s * 0.84), fmt(s * 0.84),
                         fmt(s * 0.05), fmt(text_size * 0.1), fmt(text_size * 0.4),
                         T(x + s / 2, y + s / 2, 'QR-Code', text_size, 700, MUTED, 'middle', lines=['QR-Code', 'hier'], lh=1.15))


def write(rel, content):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding='utf-8')
    return p


# ------------------------------------------------------------------ logo files
def build_logos():
    pad = 40
    files = []
    for variant, bg in [('color', None), ('reverse', GREEN), ('mono-dark', None), ('mono-white', GREEN)]:
        g, w, h = lockup(pad, pad, 160, variant)
        W, H = w + 2 * pad, h + 2 * pad
        back = '<rect inkscape:label="Background (delete for transparent)" width="%s" height="%s" fill="%s"/>' % (fmt(W), fmt(H), bg) if bg else ''
        files.append(write('logo/afrokauf-logo-%s.svg' % variant, doc(fmt(W), fmt(H), back + g, 'AfroKauf logo (%s)' % variant)))

        g, w, h = lockup(pad, pad, 160, variant, sub='Afroshops in deiner Nähe')
        W, H = w + 2 * pad, h + 2 * pad + 20
        back = '<rect inkscape:label="Background (delete for transparent)" width="%s" height="%s" fill="%s"/>' % (fmt(W), fmt(H), bg) if bg else ''
        files.append(write('logo/afrokauf-logo-tagline-%s.svg' % variant, doc(fmt(W), fmt(H), back + g, 'AfroKauf logo with tagline (%s)' % variant)))

        g, w, h = lockup(pad, pad, 160, variant, verbund=True)
        W, H = w + 2 * pad, h + 2 * pad + 20
        back = '<rect inkscape:label="Background (delete for transparent)" width="%s" height="%s" fill="%s"/>' % (fmt(W), fmt(H), bg) if bg else ''
        files.append(write('logo/afrokauf-verbund-%s.svg' % variant, doc(fmt(W), fmt(H), back + g, 'AfroKauf Verbund logo (%s)' % variant)))

    # stacked
    for variant, bg in [('color', None), ('reverse', GREEN)]:
        g, w, h = stacked(400, 60, 150, variant, sub='Afroshops in deiner Nähe')
        back = '<rect inkscape:label="Background (delete for transparent)" width="800" height="%s" fill="%s"/>' % (fmt(h + 120), bg) if bg else ''
        files.append(write('logo/afrokauf-logo-stacked-%s.svg' % variant, doc(800, fmt(h + 120), back + g, 'AfroKauf logo stacked (%s)' % variant)))

    # icons: app / profile picture / favicon
    for name, bg, variant in [('icon-cream', CREAM, 'color'), ('icon-green', GREEN, 'reverse')]:
        m, mw = mark(0, 0, 300, variant)
        m, _ = mark(256 - mw / 2, 256 - 150 - 8, 300, variant)
        files.append(write('logo/afrokauf-%s.svg' % name, doc(512, 512,
                     '<rect inkscape:label="Background" width="512" height="512" rx="112" fill="%s"/>%s' % (bg, m), 'AfroKauf icon')))
    m, mw = mark(0, 0, 300, 'reverse')
    m, _ = mark(256 - mw / 2, 256 - 150 - 8, 300, 'reverse')
    files.append(write('logo/afrokauf-profile-round.svg', doc(512, 512,
                 '<circle inkscape:label="Background" cx="256" cy="256" r="256" fill="%s"/>%s' % (GREEN, m), 'AfroKauf profile picture')))
    return files


# ------------------------------------------------------------------ member badge + lockup
def build_member():
    # Round seal, 600 px. Ring text is live text on a circle: edit it with the Text tool.
    cx = cy = 300
    m, mw = mark(0, 0, 165, 'reverse')
    m, _ = mark(cx - mw / 2, cy - 122, 165, 'reverse')
    word, ww = text_group(XB, 'AfroKauf', 54, 0, 0, WORD_COLORS['reverse'], tracking=-0.01, split=4)
    word, _ = text_group(XB, 'AfroKauf', 54, cx - ww / 2, cy + 100, WORD_COLORS['reverse'], tracking=-0.01, split=4, label='Wordmark')
    ring_text = 'MITGLIED IM AFROKAUF VERBUND • GEMEINSAM STARK • '
    _, rw = XB.paths(ring_text, 34)
    spacing = (2 * 3.14159265 * 228 - rw) / len(ring_text)
    ring = ('<defs><path id="badgering" d="M %d %d m -228 0 a 228 228 0 1 1 456 0 a 228 228 0 1 1 -456 0"/></defs>'
            '<text inkscape:label="EDIT: Ring text" font-family="%s" font-size="34" font-weight="800" fill="%s" letter-spacing="%.2f">'
            '<textPath xlink:href="#badgering" startOffset="0">%s</textPath></text>') % (
        cx, cy, escape(FAMILY, {"'": '&apos;'}), GOLD, spacing, ring_text)
    body = ('<circle inkscape:label="Badge" cx="300" cy="300" r="296" fill="%s"/>'
            '<circle cx="300" cy="300" r="270" fill="none" stroke="%s" stroke-width="3"/>'
            '<circle cx="300" cy="300" r="186" fill="none" stroke="%s" stroke-width="3"/>%s%s%s') % (GREEN, GOLD, GOLD, ring, m, word)
    files = [write('member/afrokauf-member-badge.svg', doc(600, 600, body, 'Member badge'))]

    # Shop + member lockup: shop name and city on top (live text), "Mitglied im" + Verbund logo below
    W, H = 1200, 440
    v, vw, vh = lockup(0, 0, 70, 'color', verbund=True)
    v, vw, vh = lockup(330, 300, 70, 'color', verbund=True)
    body = ('<rect inkscape:label="Background (delete for transparent)" width="%d" height="%d" rx="36" fill="%s"/>' % (W, H, CREAM)
            + T(70, 150, 'Dein Shopname', 104, 800, GREEN, label='Shop name')
            + T(72, 215, 'Frankfurt am Main', 42, 400, MUTED, label='City')
            + stripe(70, 258, 160, 8, 18)
            + T(70, 358, 'Mitglied im', 40, 600, CLAY, label='Member line')
            + v)
    files.append(write('member/afrokauf-member-lockup.svg', doc(W, H, body, 'Shop name + member of AfroKauf Verbund')))
    return files


# ------------------------------------------------------------------ templates
def social_post():
    W = H = 1080
    logo, lw, lh = lockup(72, 960, 46, 'color')
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, CREAM) + stripe(0, 0, W, 16, 72))
    art = (T(72, 120, 'ANGEBOT DER WOCHE', 34, 800, CLAY, spacing=3, label='Kicker')
           + photo(72, 160, 936, 520, 36, 'product photo', 30)
           + '<g inkscape:label="Price burst"><circle cx="890" cy="650" r="132" fill="%s"/>' % GOLD
           + T(890, 640, '4,99 €', 66, 800, INK, 'middle', label='Price')
           + T(890, 690, 'statt 6,49 €', 26, 600, INK, 'middle', label='Old price') + '</g>'
           + T(72, 780, 'Egusi, gemahlen · 1 kg', 64, 800, INK, label='Product name')
           + T(74, 836, 'bei Lagos Taste Afroshop, Frankfurt', 34, 400, MUTED, label='Shop and city')
           + T(74, 880, 'Solange der Vorrat reicht', 24, 400, MUTED, label='Small print')
           + logo + T(W - 72, 1000, 'afrokauf.de', 32, 700, GREEN, 'end', label='Website'))
    return doc(W, H, '', 'Social post 1080x1080 – Offer of the week', layers=[('Background', bg, True), ('Artwork and text', art, False)])


def social_story():
    W, H = 1080, 1920
    logo, lw, lh = lockup(0, 0, 84, 'reverse')
    logo, lw, lh = lockup(W / 2 - lw / 2, 130, 84, 'reverse')
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, GREEN) + dots(0, 0, W, H, 36, 2.6, '#FFFFFF', 0.08) + stripe(0, H - 24, W, 24, 80))
    art = (logo
           + T(W / 2, 400, 'FRISCH EINGETROFFEN', 40, 800, GOLD, 'middle', spacing=4, label='Kicker')
           + photo(90, 460, 900, 900, 48, 'product photo', 34, dark=True)
           + T(W / 2, 1490, 'Kochbananen', 96, 800, CREAM, 'middle', label='Product name')
           + T(W / 2, 1570, 'Diese Woche in 8 Shops in Frankfurt', 42, 400, '#CFE0D8', 'middle', label='Line')
           + '<g inkscape:label="Button"><rect x="240" y="1650" width="600" height="110" rx="55" fill="%s"/>' % GOLD
           + T(W / 2, 1722, 'Shops finden: afrokauf.de', 40, 800, INK, 'middle', label='Button text') + '</g>')
    return doc(W, H, '', 'Story 1080x1920', layers=[('Background', bg, True), ('Artwork and text', art, False)])


def live_banner():
    W, H = 1920, 1080
    logo, lw, lh = lockup(110, 110, 64, 'reverse', verbund=True)
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, GREEN) + dots(0, 0, W, H, 40, 3, '#FFFFFF', 0.07)
          + '<circle cx="1700" cy="160" r="520" fill="%s" fill-opacity="0.16"/>' % GOLD + stripe(0, H - 28, W, 28, 96))
    art = (logo
           + '<g inkscape:label="LIVE pill"><rect x="110" y="300" width="200" height="72" rx="36" fill="%s"/><circle cx="150" cy="336" r="12" fill="#FFFFFF"/>' % CLAY
           + T(176, 351, 'LIVE', 40, 800, '#FFFFFF', spacing=3) + '</g>'
           + T(106, 500, 'Frische Ware', 112, 800, CREAM, label='Title', lines=['Frische Ware', 'der Woche'], lh=1.0)
           + T(112, 700, 'Neu eingetroffen in 12 Afroshops in Frankfurt', 46, 400, '#CFE0D8', label='Subtitle')
           + T(112, 820, 'Jeden Freitag · 18:00 Uhr', 52, 800, GOLD, label='Date and time')
           + T(112, 890, 'Facebook · Instagram · YouTube', 40, 600, CREAM, label='Platforms')
           + photo(1240, 340, 560, 560, 280, 'host or product photo', 30, dark=True))
    return doc(W, H, '', 'Live stream banner 1920x1080', layers=[('Background', bg, True), ('Artwork and text', art, False)])


def window_sticker():
    W, H = 105, 148  # A6, mm
    logo, lw, lh = lockup(0, 0, 13.5, 'reverse')
    logo, lw, lh = lockup(W / 2 - lw / 2, 14, 13.5, 'reverse')
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, GREEN) + dots(0, 0, W, H, 4, 0.3, '#FFFFFF', 0.08) + stripe(0, H - 5, W, 5, 7))
    art = (logo
           + T(W / 2, 46, 'MITGLIED IM', 4.6, 800, GOLD, 'middle', spacing=0.8, label='Line 1')
           + T(W / 2, 55, 'AfroKauf Verbund', 8.2, 800, CREAM, 'middle', label='Line 2')
           + qr_box(W / 2 - 24, 63, 48, 5)
           + T(W / 2, 123, 'Scannen: Öffnungszeiten,', 4.4, 600, '#CFE0D8', 'middle', label='Scan text', lines=['Scannen: Öffnungszeiten,', 'Angebote & Bewertungen'], lh=1.3)
           + T(W / 2, 139, 'afrokauf.de', 6, 800, GOLD, 'middle', label='Website'))
    return doc(W, H, '', 'Window sticker A6 (105 x 148 mm)', units='mm', layers=[('Background', bg, True), ('Artwork and text', art, False)])


def weekly_flyer():
    W, H = 210, 297  # A4, mm
    logo, lw, lh = lockup(14, 14, 11, 'reverse')
    head_h = 62
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, CREAM)
          + '<rect width="%d" height="%d" fill="%s"/>' % (W, head_h, GREEN) + dots(0, 0, W, head_h, 4, 0.3, '#FFFFFF', 0.08)
          + stripe(0, head_h, W, 3.5, 7) + stripe(0, H - 3.5, W, 3.5, 7))
    tiles = []
    cw, ch, gx, gy, x0, y0 = 87, 58, 8, 6, 14, 74
    products = [('Egusi, gemahlen 1 kg', '4,99 €', 'Lagos Taste, Frankfurt'), ('Kochbananen 1 kg', '2,49 €', 'Douala Market, Frankfurt'),
                ('Palmöl 1 l', '3,99 €', 'Mama Ada, Berlin'), ('Gari 2 kg', '5,49 €', 'Accra Corner, Hamburg'),
                ('Shea-Butter 250 g', '6,90 €', 'Sahel Beauty, München'), ('Jollof-Gewürz 100 g', '1,99 €', "Yaa's Kitchen, Düsseldorf")]
    for i, (name, price, shop) in enumerate(products):
        x = x0 + (i % 2) * (cw + gx)
        y = y0 + (i // 2) * (ch + gy)
        tiles.append('<g inkscape:label="Offer %d"><rect x="%s" y="%s" width="%s" height="%s" rx="4" fill="#FFFFFF" stroke="%s" stroke-width="0.3"/>' % (
            i + 1, x, y, cw, ch, '#E6DCCB')
            + photo(x + 3, y + 3, cw - 6, 32, 3, 'offer %d photo' % (i + 1), 3.2)
            + '<circle cx="%s" cy="%s" r="10" fill="%s"/>' % (fmt(x + cw - 13.0), fmt(y + 32.0), GOLD)
            + T(x + cw - 13.0, y + 34.0, price, 5.2, 800, INK, 'middle', label='Offer %d price' % (i + 1))
            + T(x + 4, y + 45, name, 5.2, 800, INK, label='Offer %d product' % (i + 1))
            + T(x + 4, y + 52, 'bei ' + shop, 3.6, 400, MUTED, label='Offer %d shop' % (i + 1)) + '</g>')
    art = (logo
           + T(14, 44, 'Angebote der Woche', 13, 800, CREAM, label='Title')
           + T(15, 53, '23.–29. November · Frankfurt & Umgebung', 4.6, 600, GOLD, label='Dates and region')
           + '<g inkscape:label="Week badge"><circle cx="176" cy="31" r="19" fill="%s"/>' % GOLD
           + T(176, 29, 'KW 48', 6.4, 800, INK, 'middle', label='Week') + T(176, 36, 'gültig bis Sa', 3.2, 600, INK, 'middle', label='Valid') + '</g>'
           + ''.join(tiles)
           + T(14, 276, 'Teilnehmende Shops: Lagos Taste · Douala Market · Bantu Cargo · …', 3.6, 600, GREEN, label='Participating shops')
           + T(14, 283, 'Preise gelten nur im genannten Shop, solange der Vorrat reicht. Alle Shops: afrokauf.de', 3.1, 400, MUTED, label='Small print'))
    return doc(W, H, '', 'Weekly offers flyer A4', units='mm', layers=[('Background', bg, True), ('Artwork and text', art, False)])


def seminar_poster():
    W, H = 210, 297
    logo, lw, lh = lockup(0, 0, 10, 'color', verbund=True)
    logo, lw, lh = lockup(18, 264, 10, 'color', verbund=True)
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, CREAM)
          + '<rect width="%d" height="128" fill="%s"/>' % (W, GREEN) + dots(0, 0, W, 128, 4, 0.3, '#FFFFFF', 0.08)
          + '<circle cx="190" cy="10" r="70" fill="%s" fill-opacity="0.18"/>' % GOLD + stripe(0, 128, W, 3.5, 7))
    art = ('<g inkscape:label="Seminar pill"><rect x="18" y="20" width="40" height="11" rx="5.5" fill="%s"/>' % CLAY
           + T(38, 27.8, 'SEMINAR', 4.4, 800, '#FFFFFF', 'middle', spacing=0.6) + '</g>'
           + T(18, 54, 'Instagram & WhatsApp', 14, 800, CREAM, label='Title', lines=['Instagram & WhatsApp', 'für Afroshops'], lh=1.12)
           + T(19, 90, 'Mehr Kunden mit dem Handy – Schritt für Schritt', 5.6, 400, '#CFE0D8', label='Subtitle')
           + T(19, 112, 'Sa, 23. Januar 2027 · 14–17 Uhr', 6.4, 800, GOLD, label='Date and time')
           + T(18, 150, 'Das lernst du', 6, 800, GREEN, label='List heading')
           + ''.join('<circle cx="21" cy="%s" r="1.4" fill="%s"/>' % (fmt(160.0 + i * 10 - 1.6), GOLD)
                     + T(26, 160 + i * 10, item, 5, 400, INK, label='Point %d' % (i + 1))
                     for i, item in enumerate(['Gute Produktfotos mit dem Handy', 'Wochenangebote im WhatsApp-Status',
                                                'Google-Bewertungen sammeln', 'Ein Live-Video für alle Shops']))
           + '<g inkscape:label="Info box"><rect x="18" y="206" width="120" height="46" rx="4" fill="#FFFFFF" stroke="#E6DCCB" stroke-width="0.3"/>'
           + T(24, 218, 'Ort: Bürgerhaus, Frankfurt', 4.4, 600, INK, label='Place')
           + T(24, 228, 'Preis: 29 € · Mitglieder 19 €', 4.4, 600, INK, label='Price')
           + T(24, 238, 'Anmeldung: afrokauf.de/seminare', 4.4, 600, CLAY, label='Register')
           + T(24, 246, 'Begrenzte Plätze', 3.6, 400, MUTED, label='Note') + '</g>'
           + qr_box(150, 206, 42, 4.4)
           + logo)
    return doc(W, H, '', 'Seminar poster A4', units='mm', layers=[('Background', bg, True), ('Artwork and text', art, False)])


def build_templates():
    return [write('templates/social-post-1080.svg', social_post()),
            write('templates/social-story-1080x1920.svg', social_story()),
            write('templates/live-banner-1920x1080.svg', live_banner()),
            write('templates/window-sticker-A6.svg', window_sticker()),
            write('templates/weekly-offers-flyer-A4.svg', weekly_flyer()),
            write('templates/seminar-poster-A4.svg', seminar_poster())]


# ------------------------------------------------------------------ social media profiles and headers
# Sizes as recommended by the platforms in 2026. Each header has a hidden "Safe zone" layer:
# show it in Inkscape (Layers panel, eye icon) to see what every phone and computer shows.
def safe_zone(x, y, w, h, note, size):
    return ('<rect x="%s" y="%s" width="%s" height="%s" fill="none" stroke="#FF2D55" stroke-width="%s" stroke-dasharray="%s"/>'
            % (fmt(x), fmt(y), fmt(w), fmt(h), fmt(size * 0.12), fmt(size * 0.6))
            + T(x + size * 0.4, y + size * 1.2, note, size, 700, '#FF2D55'))


def header(W, H, safe, audience, title, line, avatar=None):
    """safe = (x, y, w, h) of the area every device shows. avatar = (cx, cy, r) where the profile photo overlaps."""
    sx, sy, sw, sh = safe
    verbund = audience == 'owners'
    size = sh * 0.3
    while True:  # shrink until logo + message fit the safe zone, then centre them
        g, lw, lh = lockup(0, 0, size, 'reverse', verbund=verbund)
        gap = size * 0.9
        text_w = max(XB.paths(title, size * 0.62)[1], RG.paths(line, size * 0.36)[1])
        total = lw + gap + text_w
        if total <= sw * 0.92 or size < 10:
            break
        size *= 0.94
    lx = sx + (sw - total) / 2
    g, lw, lh = lockup(lx, sy + sh / 2 - lh / 2 - (size * 0.18 if verbund else 0), size, 'reverse', verbund=verbund)
    tx = lx + lw + gap
    bg = ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, GREEN) + dots(0, 0, W, H, H / 18.0, H / 260.0, '#FFFFFF', 0.08)
          + '<circle cx="%s" cy="%s" r="%s" fill="%s" fill-opacity="0.16"/>' % (fmt(W * 0.86), fmt(H * 0.1), fmt(H * 0.75), GOLD)
          + stripe(0, H - H * 0.04, W, H * 0.04, H * 0.12))
    divider = '<rect x="%s" y="%s" width="%s" height="%s" fill="%s"/>' % (fmt(tx - gap / 2), fmt(sy + sh * 0.22), fmt(max(2.0, H / 300.0)), fmt(sh * 0.56), GOLD)
    art = (g + divider
           + T(tx, sy + sh * 0.47, title, size * 0.62, 800, CREAM, label='Header title')
           + T(tx, sy + sh * 0.47 + size * 0.62, line, size * 0.36, 400, '#CFE0D8', label='Header line'))
    guide = safe_zone(sx, sy, sw, sh, 'SAFE ZONE – keep text and logo inside', H / 40.0)
    if avatar:
        cx, cy, r = avatar
        guide += ('<circle cx="%s" cy="%s" r="%s" fill="#FF2D55" fill-opacity="0.25" stroke="#FF2D55" stroke-width="%s"/>' % (fmt(cx), fmt(cy), fmt(r), fmt(H / 300.0))
                  + T(cx, cy, 'Profile photo', H / 30.0, 700, '#FF2D55', 'middle'))
    return bg, art, guide


def build_social():
    files = []
    # Profile picture: one square file for every platform. The mark sits inside the circle crop.
    for name, bg, variant in [('profile-1080-green', GREEN, 'reverse'), ('profile-1080-cream', CREAM, 'color')]:
        m, mw = mark(0, 0, 520, variant)
        m, _ = mark(540 - mw / 2, 540 - 260 - 14, 520, variant)
        guide = '<circle cx="540" cy="540" r="540" fill="none" stroke="#FF2D55" stroke-width="4" stroke-dasharray="20"/>'
        files.append(write('social/%s.svg' % name, doc(1080, 1080, '', 'Profile picture (all platforms)', layers=[
            ('Background', '<rect width="1080" height="1080" fill="%s"/>' % bg, True), ('Logo', m, False),
            ('Circle crop guide (hidden)', guide, True, True)])))

    specs = [
        # file, W, H, safe zone, audience, title, line, avatar overlap
        ('linkedin-company-cover-4200x700', 4200, 700, (700, 110, 3200, 480), 'owners',
         'Gemeinsam stark', 'Der Verbund für Afroshops in Deutschland', None),
        ('linkedin-personal-banner-1584x396', 1584, 396, (520, 40, 1010, 300), 'owners',
         'Gemeinsam stark', 'Der Verbund für Afroshops in Deutschland', (260, 396, 200)),
        ('youtube-banner-2560x1440', 2560, 1440, (507, 508, 1546, 423), 'customers',
         'Afroshops in deiner Nähe', 'Live jeden Freitag · afrokauf.de', None),
        ('facebook-cover-1640x624', 1640, 624, (250, 70, 1140, 420), 'customers',
         'Afroshops in deiner Nähe', 'Angebote, Live-Videos und Seminare · afrokauf.de', None),
        ('x-header-1500x500', 1500, 500, (360, 60, 1080, 300), 'customers',
         'Afroshops in deiner Nähe', 'Angebote und Live-Videos · afrokauf.de', (150, 500, 140)),
    ]
    for name, W, H, safe, aud, title, line, avatar in specs:
        bg, art, guide = header(W, H, safe, aud, title, line, avatar)
        files.append(write('social/%s.svg' % name, doc(W, H, '', name, layers=[
            ('Background', bg, True), ('Logo and text', art, False), ('Safe zone guide (hidden)', guide, True, True)])))

    # YouTube watermark (shown on every video), 150 x 150, transparent
    m, mw = mark(0, 0, 112, 'reverse')
    m, _ = mark(75 - mw / 2, 75 - 56 - 2, 112, 'reverse')
    files.append(write('social/youtube-watermark-150.svg', doc(150, 150,
                 '<circle inkscape:label="Background" cx="75" cy="75" r="75" fill="%s" fill-opacity="0.9"/>%s' % (GREEN, m), 'YouTube watermark')))
    return files


# ------------------------------------------------------------------ brand guide (one page)
def brand_guide():
    W, H = 1600, 2000
    swatches = [('Grün', GREEN, 'RGB 14 77 58', 'Hauptfarbe'), ('Gold', GOLD, 'RGB 233 162 59', 'Akzent, Preise'),
                ('Lehm', CLAY, 'RGB 196 85 45', 'Akzent, Hinweise'), ('Creme', CREAM, 'RGB 251 246 238', 'Hintergrund'),
                ('Sand', SAND, 'RGB 243 227 195', 'Flächen'), ('Tinte', INK, 'RGB 31 36 32', 'Text')]
    l1, w1, h1 = lockup(100, 330, 120, 'color', sub='Afroshops in deiner Nähe')
    l2, w2, h2 = lockup(940, 362, 92, 'reverse', verbund=True)
    m1, mw1 = mark(1290, 1530, 120, 'color')
    m2, mw2 = mark(1450, 1530, 60, 'color')
    out = ['<rect width="%d" height="%d" fill="#FFFFFF"/>' % (W, H), stripe(0, 0, W, 18, 90),
           T(100, 150, 'AfroKauf – Markenhandbuch', 64, 800, INK),
           T(100, 210, 'Logo, Farben und Schrift für die Website, Social Media und Druck.', 30, 400, MUTED),
           T(100, 300, 'LOGO', 24, 800, CLAY, spacing=3), l1,
           '<rect x="860" y="290" width="640" height="230" rx="24" fill="%s"/>' % GREEN, l2,
           T(100, 640, 'Schutzzone: rund um das Logo mindestens so viel Platz wie die Höhe des „A“ frei lassen.', 26, 400, INK),
           T(100, 740, 'FARBEN', 24, 800, CLAY, spacing=3)]
    for i, (n, c, rgb, use) in enumerate(swatches):
        x = 100 + (i % 3) * 470
        y = 780 + (i // 3) * 250
        out.append('<rect x="%d" y="%d" width="440" height="130" rx="18" fill="%s" stroke="#E6DCCB" stroke-width="2"/>' % (x, y, c))
        out.append(T(x, y + 172, n + '  ' + c, 28, 800, INK))
        out.append(T(x, y + 208, rgb + ' · ' + use, 22, 400, MUTED))
    out += [T(100, 1320, 'SCHRIFT', 24, 800, CLAY, spacing=3),
            T(100, 1410, 'Bricolage Grotesque', 72, 800, INK),
            T(100, 1470, 'ExtraBold für Überschriften und Preise · SemiBold für Hinweise · Regular für Text.', 28, 400, INK),
            T(100, 1510, 'Kostenlos (SIL Open Font License) – im Ordner fonts/ enthalten.', 26, 400, MUTED),
            T(100, 1620, 'REGELN', 24, 800, CLAY, spacing=3),
            T(100, 1670, '✓ Auf Creme oder Weiß das farbige Logo, auf Grün die helle Version.', 28, 400, INK),
            T(100, 1720, '✓ Shops nutzen das Mitglieds-Abzeichen neben ihrem eigenen Namen.', 28, 400, INK),
            T(100, 1770, '✗ Logo nicht verzerren, umfärben, drehen oder mit Effekten versehen.', 28, 400, INK),
            T(100, 1820, '✗ Kein Logo auf unruhigen Fotos ohne ruhige Fläche dahinter.', 28, 400, INK),
            T(1290, 1500, 'Zeichen allein', 22, 600, MUTED), m1, m2,
            stripe(0, H - 18, W, 18, 90)]
    return write('afrokauf-brand-guide.svg', doc(W, H, ''.join(out), 'AfroKauf brand guide'))


if __name__ == '__main__':
    files = build_logos() + build_member() + build_templates() + build_social() + [brand_guide()]
    for f in files:
        print(f.relative_to(ROOT))
