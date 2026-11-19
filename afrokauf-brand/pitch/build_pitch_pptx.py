#!/usr/bin/env python3
"""Build the AfroKauf pitch as PowerPoint files for Google Slides (English + German).

    python3 build_pitch_pptx.py <deck_en_root> <deck_de_root> <assets_dir> <out_dir>

The slide text and the speaker script are read from the web decks (project/slides/*.html),
so both versions say exactly the same. Every slide's script goes into its speaker notes.
Layout: 16:9, drawn on a 1920 x 1080 grid (1 px = 0.5 pt).
"""
import html
import json
import pathlib
import re
import sys
from html.parser import HTMLParser

from PIL import Image
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

FONT = 'Bricolage Grotesque'
C = {k: RGBColor.from_string(v) for k, v in dict(
    green='0E4D3A', green2='17644D', gold='E9A23B', clay='B4491F', cream='FBF6EE', paper='FFFDF8',
    sand='F3E3C3', ink='1F2420', soft='4A4F49', ondark='CFE0D8').items()}

BLOBS = {  # web-deck image ids -> local file names
    '2b2aba7b267c6bb2892802e57ea162c5': 'afrokauf-verbund-reverse.png', '83e4a4ccf4feb2944356d8cc03b37da5': 'afrokauf-verbund-reverse.png',
    '098b38f3e5755c1b981a12eb8c79b40e': 'afrokauf-member-lockup.png', 'b4992dd33c44bba7ec0d4aa321b9ccc6': 'afrokauf-member-lockup.png',
    '0a1a68c94a3f64231e7ab5c1d52b4ccc': 'social-post-1080.png', 'e1ac1f5f93fc370d0386bd3199ab1f30': 'social-post-1080.png',
    '2c99070f2a6b09097bb5436476c03356': 'website-search-phone.png', '619b802bbaf8cbc0066efb05a0acef52': 'website-search-phone.png',
}


def px(v):
    return Emu(int(round(v * 6350)))


# ------------------------------------------------------------------ read a web-deck slide
class SlideReader(HTMLParser):
    """Collects text by class: eyebrow, title, lead, cards, steps, rows, table, phases, notes."""

    def __init__(self):
        super().__init__()
        self.d = dict(cls='', eyebrow='', title='', lead='', statement='', meta='', contact='', small='',
                      cards=[], steps=[], rows=[], table=[], phases=[], img=None, notes='')
        self.stack = []
        self.buf = None
        self.target = None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = a.get('class', '')
        self.stack.append((tag, cls))
        if tag == 'section':
            self.d['cls'] = cls
        if tag == 'img':
            m = re.search(r'/_blob/([0-9a-f]+)', a.get('src', ''))
            if m:
                self.d['img'] = (BLOBS[m.group(1)], cls)
        if 'card' in cls.split() or 'phase' in cls.split():
            (self.d['phases'] if 'phase' in cls.split() else self.d['cards']).append({})
        if tag == 'tr':
            self.d['table'].append([])
        if 'row' in cls.split():
            self.d['rows'].append([])
        if tag in ('p', 'h1', 'h2', 'h3', 'li', 'td', 'th', 'aside'):
            self.buf = []
            self.target = (tag, cls)

    def handle_endtag(self, tag):
        if self.stack:
            self.stack.pop()
        if self.buf is None or self.target is None or tag != self.target[0]:
            return
        text = html.unescape(''.join(self.buf)).strip()
        tag, cls = self.target
        self.buf = None
        if tag == 'aside':
            self.d['notes'] = text
        elif tag in ('td', 'th'):
            self.d['table'][-1].append(text)
        elif tag == 'li':
            self.d['steps'].append(text)
        elif 'k' == cls or 'v' == cls:
            self.d['rows'][-1].append(text)
        elif cls in ('num', 'card-title', 'txt', 'when'):
            holder = self.d['phases'][-1] if self.in_phase() else self.d['cards'][-1]
            holder[cls] = text
        else:
            for key in ('eyebrow', 'lead', 'statement', 'meta', 'contact', 'small'):
                if key in cls.split():
                    self.d[key] = text
            if 'title' in cls.split() or 'cover-title' in cls.split():
                self.d['title'] = text

    def in_phase(self):
        return any('phase' in c.split() for _, c in self.stack)

    def handle_data(self, data):
        if self.buf is not None:
            self.buf.append(data)


def read_deck(root):
    root = pathlib.Path(root)
    deck = json.loads((root / 'project/deck.json').read_text(encoding='utf-8'))
    slides = []
    for sid in deck['order']:
        r = SlideReader()
        r.feed((root / 'project/slides' / (sid + '.html')).read_text(encoding='utf-8'))
        r.d['id'] = sid
        slides.append(r.d)
    return deck['title'], slides


# ------------------------------------------------------------------ drawing helpers
def bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = C[color]


def textbox(slide, x, y, w, h, paras, anchor='top'):
    """paras = [(text, size_px, bold, color, extra_space_before_px)]"""
    tb = slide.shapes.add_textbox(px(x), px(y), px(w), px(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = {'top': MSO_ANCHOR.TOP, 'middle': MSO_ANCHOR.MIDDLE, 'bottom': MSO_ANCHOR.BOTTOM}[anchor]
    for i, (text, size, bold, color, before) in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        run = p.add_run()
        run.text = text
        f = run.font
        f.name = FONT
        f.size = Pt(size * 0.5)
        f.bold = bold
        f.color.rgb = C[color]
        if before:
            p.space_before = Pt(before * 0.5)
        p.line_spacing = 1.12
    return tb


def card(slide, x, y, w, h, fill, line, paras, pad=40):
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, px(x), px(y), px(w), px(h))
    shp.adjustments[0] = min(0.5, 24.0 / min(w, h))
    shp.fill.solid()
    shp.fill.fore_color.rgb = C[fill]
    if line:
        shp.line.color.rgb = C[line]
        shp.line.width = Pt(1)
    else:
        shp.line.fill.background()
    shp.shadow.inherit = False
    tf = shp.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = px(pad)
    tf.vertical_anchor = MSO_ANCHOR.TOP
    for i, (text, size, bold, color, before) in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        run = p.add_run()
        run.text = text
        run.font.name = FONT
        run.font.size = Pt(size * 0.5)
        run.font.bold = bold
        run.font.color.rgb = C[color]
        if before:
            p.space_before = Pt(before * 0.5)
        p.line_spacing = 1.12
    return shp


def picture(slide, path, x, y, w, h, fit='contain'):
    im = Image.open(path)
    iw, ih = im.size
    if fit == 'contain':
        s = min(w / iw, h / ih)
        nw, nh = iw * s, ih * s
        return slide.shapes.add_picture(str(path), px(x + (w - nw) / 2), px(y + (h - nh) / 2), px(nw), px(nh))
    return slide.shapes.add_picture(str(path), px(x), px(y), px(w), px(h))


def glow(slide):
    shp = slide.shapes.add_shape(MSO_SHAPE.OVAL, px(1180), px(0), px(740), px(740))
    shp.fill.solid()
    shp.fill.fore_color.rgb = C['gold']
    srgb = shp.fill._xPr.find(qn('a:solidFill')).find(qn('a:srgbClr'))
    alpha = srgb.makeelement(qn('a:alpha'), {'val': '16000'})
    srgb.append(alpha)
    shp.line.fill.background()
    shp.shadow.inherit = False
    shp.name = 'Decoration circle'


def foot(slide, n, dark=False):
    color = 'ondark' if dark else 'soft'
    textbox(slide, 128, 990, 800, 30, [('AfroKauf Verbund', 24, False, color, 0)])
    tb = textbox(slide, 1592, 990, 200, 30, [(str(n), 24, False, color, 0)])
    tb.text_frame.paragraphs[0].alignment = PP_ALIGN.RIGHT


def lines_needed(text, size, width):
    return max(1, -(-int(len(text) * size * 0.56) // int(width)))


def head(slide, d, dark=False, x=128, w=1664, y=128):
    """eyebrow + title (+ lead). Returns the y below it."""
    textbox(slide, x, y, w, 30, [(d['eyebrow'], 24, True, 'gold' if dark else 'clay', 0)])
    y += 46
    n = lines_needed(d['title'], 72, w)
    textbox(slide, x, y, w, 82 * n, [(d['title'], 72, True, 'cream' if dark else 'ink', 0)])
    y += 82 * n + 16
    if d['lead']:
        ln = lines_needed(d['lead'], 32, 1300)
        textbox(slide, x, y, 1300, 46 * ln, [(d['lead'], 32, False, 'ondark' if dark else 'soft', 0)])
        y += 46 * ln + 8
    return y + 32


def notes(slide, text):
    tf = slide.notes_slide.notes_text_frame
    tf.text = text.replace('\r', '')


# ------------------------------------------------------------------ slide builders
def build(lang, title, slides, assets, stripe_png, out):
    prs = Presentation()
    prs.slide_width, prs.slide_height = px(1920), px(1080)
    blank = prs.slide_layouts[6]
    for n, d in enumerate(slides, 1):
        s = prs.slides.add_slide(blank)
        sid = d['id']
        dark = 'dark' in d['cls'].split()
        gold = 'gold' in d['cls'].split()
        bg(s, 'green' if dark else 'gold' if gold else 'cream')
        if dark:
            glow(s)
            s.shapes.add_picture(str(stripe_png), px(0), px(1064), px(1920), px(16))
        elif not gold:
            s.shapes.add_picture(str(stripe_png), px(0), px(0), px(1920), px(16))

        if sid == 'cover':
            picture(s, assets / d['img'][0], 128, 250, 760, 204)
            textbox(s, 128, 490, 1300, 130, [(d['title'], 120, True, 'cream', 0)])
            textbox(s, 128, 640, 1150, 100, [(d['lead'], 32, False, 'ondark', 0)])
            textbox(s, 128, 780, 1200, 40, [(d['meta'], 24, True, 'gold', 0)])
        elif sid == 'insight':
            textbox(s, 128, 230, 1664, 30, [(d['eyebrow'], 24, True, 'ink', 0)])
            textbox(s, 128, 290, 1500, 220, [(d['statement'], 96, True, 'ink', 0)])
            textbox(s, 128, 560, 1300, 200, [(d['lead'], 32, False, 'ink', 0)])
        elif sid in ('customers', 'owners', 'marketing'):
            img_name = d['img'][0]
            if sid == 'customers':
                picture(s, assets / img_name, 128, 160, 351, 760)
                tx, tw = 128 + 351 + 96, 1664 - 351 - 96
            elif sid == 'marketing':
                picture(s, assets / img_name, 128, 240, 600, 600)
                tx, tw = 128 + 600 + 96, 1664 - 600 - 96
            else:
                tx, tw = 128, 1664 - 720 - 96
                picture(s, assets / img_name, 128 + tw + 96, 410, 720, 264)
            y = head(s, d, x=tx, w=tw, y=250 if sid != 'marketing' else 220)
            bullet = sid == 'marketing'
            paras = []
            for i, step in enumerate(d['steps']):
                lead_in = '•  ' if bullet else '%d.  ' % (i + 1)
                paras.append((lead_in + step, 32, False, 'ink', 14 if i else 0))
            tb = textbox(s, tx, y, tw, 500, paras)
            if d['small']:
                extra = sum(lines_needed(t[0], 32, tw) for t in paras) * 46 + 14 * len(paras)
                textbox(s, tx, y + extra + 24, tw, 40, [(d['small'], 24, False, 'soft', 0)])
        elif sid == 'buying':
            y = head(s, d)
            rows = d['rows']
            tbl = s.shapes.add_table(len(rows), 2, px(128), px(y), px(1664), px(80 * len(rows))).table
            style_table(tbl, [300, 1364], header=False)
            for r, (k, v) in enumerate(rows):
                set_cell(tbl.cell(r, 0), k, True, 'clay')
                set_cell(tbl.cell(r, 1), v, False, 'ink')
        elif sid == 'model':
            y = head(s, d)
            rows = d['table']
            tbl = s.shapes.add_table(len(rows), 3, px(128), px(y), px(1664), px(76 * len(rows))).table
            style_table(tbl, [640, 470, 554], header=True)
            for r, row in enumerate(rows):
                for c, val in enumerate(row):
                    set_cell(tbl.cell(r, c), val, r == 0, 'ink')
        elif sid == 'roadmap':
            y = head(s, d)
            w = (1664 - 64) / 3
            for i, ph in enumerate(d['phases']):
                now = i == 0
                card(s, 128 + i * (w + 32), y, w, 920 - y, 'green' if now else 'paper', None if now else 'sand', [
                    (ph.get('when', ''), 24, True, 'gold' if now else 'clay', 0),
                    (ph.get('card-title', ''), 44, True, 'cream' if now else 'ink', 16),
                    (ph.get('txt', ''), 32, False, 'ondark' if now else 'soft', 16)])
        else:  # head + cards: picture, problem, solution, why, ask
            y = head(s, d, dark=dark, y=280 if sid == 'ask' else 128)
            cards = d['cards']
            cols = 4 if len(cards) == 4 and sid == 'solution' else 3 if len(cards) == 3 else 2
            rows = -(-len(cards) // cols)
            w = (1664 - 32 * (cols - 1)) / cols
            bottom = 860 if sid == 'ask' else 920
            h = (bottom - y - 32 * (rows - 1)) / rows
            if sid == 'ask':
                h = min(h, 260)
            for i, cd in enumerate(cards):
                paras = []
                if cd.get('num'):
                    paras.append((cd['num'], 32, True, 'clay', 0))
                paras.append((cd.get('card-title', ''), 44, True, 'cream' if dark else 'ink', 8 if paras else 0))
                paras.append((cd.get('txt', ''), 32, False, 'ondark' if dark else 'soft', 16))
                card(s, 128 + (i % cols) * (w + 32), y + (i // cols) * (h + 32), w, h,
                     'green2' if dark else 'paper', None if dark else 'sand', paras)
            if d['contact']:
                textbox(s, 128, y + h + 48, 1664, 40, [(d['contact'], 32, True, 'gold', 0)])
        if sid not in ('cover', 'ask'):
            foot(s, n, dark)
        notes(s, d['notes'])
    prs.core_properties.title = title
    prs.save(out)
    return out


def style_table(tbl, widths, header):
    for i, w in enumerate(widths):
        tbl.columns[i].width = px(w)
    tbl.first_row = header
    tbl.horz_banding = False
    tblPr = tbl._tbl.tblPr
    for child in list(tblPr):
        if child.tag == qn('a:tableStyleId'):
            tblPr.remove(child)


def set_cell(cell, text, bold, color):
    cell.text = ''
    cell.fill.solid()
    cell.fill.fore_color.rgb = C['paper'] if not bold or color != 'ink' else C['sand']
    cell.margin_left = cell.margin_right = px(20)
    cell.margin_top = cell.margin_bottom = px(14)
    p = cell.text_frame.paragraphs[0]
    run = p.add_run()
    run.text = text
    run.font.name = FONT
    run.font.size = Pt(16)
    run.font.bold = bold
    run.font.color.rgb = C[color]
    cell.text_frame.word_wrap = True
    tcPr = cell._tc.get_or_add_tcPr()
    for edge in ('a:lnL', 'a:lnR', 'a:lnT', 'a:lnB'):
        for old in tcPr.findall(qn(edge)):
            tcPr.remove(old)
        ln = tcPr.makeelement(qn(edge), {'w': '12700', 'cap': 'flat', 'cmpd': 'sng', 'algn': 'ctr'})
        fill = ln.makeelement(qn('a:solidFill'), {})
        clr = fill.makeelement(qn('a:srgbClr'), {'val': 'E6DCCB'})
        fill.append(clr)
        ln.append(fill)
        tcPr.insert(0, ln) if False else tcPr.append(ln)


def stripe(path):
    im = Image.new('RGB', (1920, 16), '#F3E3C3')
    cols = [('#E9A23B', 72), ('#C4552D', 72), ('#17644D', 72), ('#F3E3C3', 20)]
    x, i = 0, 0
    from PIL import ImageDraw
    dr = ImageDraw.Draw(im)
    while x < 1920:
        c, w = cols[i % 4]
        dr.rectangle([x, 0, x + w - 1, 15], fill=c)
        x += w
        i += 1
    im.save(path)
    return path


if __name__ == '__main__':
    en_root, de_root, assets, out = (pathlib.Path(a) for a in sys.argv[1:5])
    out.mkdir(parents=True, exist_ok=True)
    st = stripe(out / '_stripe.png')
    for lang, root, name in [('en', en_root, 'AfroKauf Pitch (English).pptx'), ('de', de_root, 'AfroKauf Pitch (Deutsch).pptx')]:
        title, slides = read_deck(root)
        print(build(lang, title, slides, assets, st, out / name))
    st.unlink()
