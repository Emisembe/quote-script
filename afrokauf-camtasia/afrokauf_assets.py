#!/usr/bin/env python3
"""AfroKauf Verbund – Camtasia assets (Asset Project Version 4.0: Camtasia 2021 + 2022).

Every asset is a spec fn(v) -> (W, H, T, layers); v=False landscape 16:9 (1920x1080), v=True vertical 9:16 (1080x1920).
Frames at 30 fps. Coordinates are top-left pixels. Built with tools/rmkit.py (from the camtasia-brand-reskin skill).

    python3 afrokauf_assets.py preview OUTDIR            # PNG previews + contact sheet (no Camtasia base needed)
    RM_BASE=base.libzip python3 afrokauf_assets.py build OUTDIR   # .libzip files (needs a working 4.0 base)
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'tools'))
from rmkit import rect, text, Matte, render  # noqa: E402

# ---------------------------------------------------------------- brand
GREEN = (14, 77, 58)      # #0E4D3A
GREEN2 = (23, 100, 77)    # #17644D
GOLD = (233, 162, 59)     # #E9A23B
CLAY = (196, 85, 45)      # #C4552D
SAND = (243, 227, 195)    # #F3E3C3
CREAM = (251, 246, 238)   # #FBF6EE
INK = (31, 36, 32)        # #1F2420
SOFT = (207, 224, 216)    # #CFE0D8 text on green


def dims(v):
    return (1080, 1920) if v else (1920, 1080)


def mv(start, dx, dy, E, d=12, edx=None, edy=None):
    """Slide in from (dx, dy) at `start`, slide out the same way (or to edx/edy) at global frame E."""
    edx = dx if edx is None else edx
    edy = dy if edy is None else edy
    return dict(start=start, enter=(dx, dy, 0, d), exit=(edx, edy, E - start, E - start + d))


def stripe(x, y, w, h, E, start, dx, dy, seg=None):
    """The AfroKauf stripe: gold, clay, green, sand blocks (one clip per block)."""
    cols = [GOLD, CLAY, GREEN2, SAND]
    seg = seg or max(24, w // 16)
    out, i, cx = [], 0, x
    while cx < x + w:
        sw = min(seg, x + w - cx)
        out.append(rect(cx, y, sw, h, cols[i % 4], **mv(start, dx, dy, E)))
        cx += sw
        i += 1
    return out


# ---------------------------------------------------------------- 1. ticker
TICKER_TEXT = ('THIS WEEK: Gari Ijebu 1 kg 3,49 EUR at Lagos Taste Frankfurt  +++  Fresh plantain at Douala Market  +++  '
               'Find African shops near you: afrokauf.blogspot.com  +++  List your shop for free')


def ticker(v=False):
    W, H = dims(v)
    T = 1800                      # 60 s; three back-to-back passes of 20 s
    E = T - 24
    if v:
        bar_y, bar_h, lab_w, lab_h = 1452, 92, 300, 64
        lab_x, lab_y = 40, bar_y - lab_h
        win = (0, bar_y, W, bar_h)
        txt_h = 54
    else:
        bar_y, bar_h, lab_w, lab_h = 976, 72, 250, 72
        lab_x, lab_y = 0, bar_y
        win = (lab_w, bar_y, W - lab_w, bar_h)
        txt_h = 44
    L = []
    L += stripe(0, bar_y - 6, W, 6, E, 0, 0, bar_h + 120)
    L.append(rect(0, bar_y, W, bar_h, GREEN, slot='Bar Colour', **mv(0, 0, bar_h + 120, E)))
    # label: gold box with green text
    L.append(rect(lab_x, lab_y, lab_w, lab_h, GOLD, slot='Label Colour', **mv(8, -(lab_x + lab_w), 0, E - 6)))
    L.append(text(lab_x + 16, lab_y + 8, lab_w - 32, lab_h - 16, 'OFFERS', GREEN, weight=800, prop='Ticker Label',
                  **mv(8, -(lab_x + lab_w), 0, E - 6)))
    # scrolling text: copies of one pass, back to back, visible only inside the bar (matte)
    wx, wy, ww, wh = win
    tw = 2600 if not v else 2400
    passes, one = [], (T - 24) // 3
    for k in range(3):
        passes.append(text(wx, wy + (wh - txt_h) // 2, tw, txt_h, TICKER_TEXT, CREAM, weight=600, align='left',
                           prop='Ticker Text', start=24 + k * one, dur=one, scroll=(ww, -tw)))
    L.append(Matte(win, *passes))
    return W, H, T, L


# ---------------------------------------------------------------- 2. lower third: name + shop
def lower_third(v=False):
    W, H = dims(v)
    T = 240                       # 8 s on screen
    E = T - 24
    if v:
        x, y, w, h1, h2 = 60, 1180, 960, 112, 64
    else:
        x, y, w, h1, h2 = 80, 790, 820, 96, 56
    L = []
    L.append(rect(x, y, 16, h1 + h2, GOLD, slot='Accent Colour', **mv(0, -(x + 40), 0, E + 6)))
    L.append(rect(x + 16, y, w - 16, h1, GREEN, slot='Panel Colour', **mv(4, -(x + w), 0, E + 4)))
    L.append(rect(x + 16, y + h1, int(w * 0.72), h2, CREAM, **mv(10, -(x + w), 0, E)))
    L += stripe(x + 16, y + h1 + h2, int(w * 0.72) - 0, 8, E, 14, -(x + w), 0, seg=40)
    L.append(Matte((x + 16, y, w - 16, h1),
                   text(x + 44, y + 14, w - 72, h1 - 28, 'Ada Obi', CREAM, weight=800, align='left', prop='Name', **mv(16, 0, h1, E - 4))))
    L.append(Matte((x + 16, y + h1, int(w * 0.72), h2),
                   text(x + 44, y + h1 + 10, int(w * 0.72) - 56, h2 - 20, 'Lagos Taste Afroshop, Frankfurt', GREEN, weight=600,
                        align='left', prop='Shop or role', **mv(22, 0, -h2, E - 8))))
    return W, H, T, L


# ---------------------------------------------------------------- 3. LIVE badge + show title
def live_title(v=False):
    W, H = dims(v)
    T = 900                       # 30 s; place it again later in the live if needed
    E = T - 24
    if v:
        x, y, bw, bh, tw, th = 60, 260, 200, 76, 960, 84
        tx, ty = 60, y + bh + 14
    else:
        x, y, bw, bh, tw, th = 60, 52, 170, 64, 700, 64
        tx, ty = x + bw + 12, y
    L = []
    L.append(rect(x, y, bw, bh, CLAY, slot='Live Colour', **mv(0, 0, -(y + bh + 40), E)))
    dot = bh // 4
    L.append(rect(x + 22, y + (bh - dot) // 2, dot, dot, CREAM,
                  fx={'opacity': (1.0, 0.25, 30, 45, 1.0, 45, 60)}, **mv(0, 0, -(y + bh + 40), E)))
    L.append(text(x + 22 + dot + 10, y + 8, bw - dot - 44, bh - 16, 'LIVE', CREAM, weight=800, align='left', prop='Badge',
                  **mv(0, 0, -(y + bh + 40), E)))
    L.append(rect(tx, ty, tw, th, GREEN, slot='Panel Colour', **mv(10, -(tx + tw), 0, E + 4)))
    L.append(rect(tx, ty + th, tw, 6, GOLD, slot='Accent Colour', **mv(14, -(tx + tw), 0, E + 2)))
    L.append(Matte((tx, ty, tw, th),
                   text(tx + 24, ty + 10, tw - 48, th - 20, 'Friday offers from Frankfurt', CREAM, weight=700, align='left',
                        prop='Show title', **mv(20, 0, th, E - 4))))
    return W, H, T, L


# ---------------------------------------------------------------- 4. end card
def end_card(v=False):
    W, H = dims(v)
    T = 300                       # 10 s
    E = T - 24
    L = [rect(0, 0, W, H, GREEN, slot='Background Colour', **mv(0, 0, H, E + 6, d=16))]
    L += stripe(0, H - 16, W, 16, E, 6, 0, 40)
    if v:
        cy, wm_h, gap = 520, 150, 40
    else:
        cy, wm_h, gap = 250, 140, 30
    half = W // 2
    L.append(text(half - 620, cy, 620, wm_h, 'Afro', CREAM, weight=800, align='right', prop='Brand first part', **mv(12, 0, 60, E - 6)))
    L.append(text(half, cy, 620, wm_h, 'Kauf', GOLD, weight=800, align='left', prop='Brand second part', **mv(12, 0, 60, E - 6)))
    L.append(text(half - 400, cy + wm_h, 800, 50, 'V E R B U N D', GOLD, weight=600, prop='Brand line', **mv(16, 0, 60, E - 6)))
    lines = [('Find African shops near you', 'Line 1'), ('afrokauf.blogspot.com', 'Line 2'), ('Follow us: @afrokauf', 'Line 3')]
    y0 = cy + wm_h + 50 + gap
    lh = 64 if v else 56
    for i, (s, p) in enumerate(lines):
        L.append(text(half - 480, y0 + i * (lh + 14), 960, lh, s, SOFT if i != 1 else CREAM, weight=600 if i != 1 else 700,
                      prop=p, **mv(22 + 4 * i, 0, 40, E - 8)))
    bw, bh = (720, 110) if v else (640, 96)
    by = y0 + 3 * (lh + 14) + (70 if v else 40)
    L.append(rect(half - bw // 2, by, bw, bh, GOLD, slot='Button Colour', **mv(36, 0, 60, E - 10)))
    L.append(text(half - bw // 2 + 24, by + 16, bw - 48, bh - 32, 'List your shop for free', GREEN, weight=800, prop='Button text',
                  **mv(36, 0, 60, E - 10)))
    return W, H, T, L


ASSETS = [
    ('AfroKauf - Ticker - Offers and details', ticker),
    ('AfroKauf - Lower Third - Name and shop', lower_third),
    ('AfroKauf - LIVE Badge and Show Title', live_title),
    ('AfroKauf - End Card - Find shops and follow', end_card),
]


def variants():
    for name, fn in ASSETS:
        for v, tag in ((False, '16x9 Desktop'), (True, '9x16 Mobile')):
            yield '%s - %s' % (name, tag), fn, v


# ---------------------------------------------------------------- preview background (stand-in for real footage)
def backdrop(W, H):
    from PIL import Image, ImageDraw
    img = Image.new('RGB', (W, H))
    d = ImageDraw.Draw(img)
    for yy in range(H):   # warm studio gradient
        t = yy / H
        d.line([(0, yy), (W, yy)], fill=(int(92 - 40 * t), int(78 - 34 * t), int(70 - 30 * t)))
    cx = W // 2
    head = int(min(W, H) * 0.16)
    top = int(H * (0.22 if H > W else 0.18))
    d.ellipse([cx - head // 2, top, cx + head // 2, top + int(head * 1.25)], fill=(58, 40, 32))
    d.rounded_rectangle([cx - int(head * 1.5), top + int(head * 1.35), cx + int(head * 1.5), H + 40], radius=head // 2, fill=(40, 52, 70))
    return img.convert('RGBA')


def preview(outdir):
    from PIL import Image
    os.makedirs(outdir, exist_ok=True)
    tiles = []
    for name, fn, v in variants():
        W, H, T, L = fn(v)
        bg = backdrop(W, H)
        f = 60 if T > 120 else T // 2
        img = render(L, W, H, T, f, bg).convert('RGB')
        path = os.path.join(outdir, name + '.png')
        img.save(path)
        tiles.append((name, img, v))
        # a second frame for the ticker shows the text moving
        if fn is ticker:
            render(L, W, H, T, 300, bg).convert('RGB').save(os.path.join(outdir, name + ' (later frame).png'))
    # contact sheet: desktop row + mobile row
    from PIL import ImageDraw, ImageFont
    font = ImageFont.truetype(os.path.join(os.environ.get('AK_FONT_DIR', ''), 'Poppins-SemiBold.ttf'), 22)
    dw, mw = 640, 202
    sheet = Image.new('RGB', (4 * (dw + 24) + 24, 360 + 380 + 120), (251, 246, 238))
    g = ImageDraw.Draw(sheet)
    xd = xm = 24
    for name, img, v in tiles:
        if not v:
            t = img.resize((dw, 360))
            sheet.paste(t, (xd, 60)); g.text((xd, 24), name.replace('AfroKauf - ', '').replace(' - 16x9 Desktop', ''), font=font, fill=INK)
            xd += dw + 24
        else:
            t = img.resize((mw, 360))
            sheet.paste(t, (xm + (dw - mw) // 2, 470)); xm += dw + 24
    g.text((24, 440), 'Mobile 9:16 (below)', font=font, fill=GREEN)
    sheet.save(os.path.join(outdir, 'AfroKauf - Camtasia test pack - overview.png'))
    return [t[0] for t in tiles]


def build(outdir):
    from rmkit import Builder
    os.makedirs(outdir, exist_ok=True)
    problems = {}
    for name, fn, v in variants():
        W, H, T, L = fn(v)
        bg = backdrop(W, H)
        import io
        thumb = render(L, W, H, T, 60 if T > 120 else T // 2, bg).convert('RGB').resize((320, int(320 * H / W)))
        buf = io.BytesIO(); thumb.save(buf, 'PNG')
        safe = name.replace(':', '')
        errs = Builder(W, H, T, safe).build(L, None).save(os.path.join(outdir, safe + '.libzip'), buf.getvalue())
        if errs:
            problems[name] = errs
    return problems


if __name__ == '__main__':
    cmd, out = sys.argv[1], sys.argv[2]
    if cmd == 'preview':
        print('\n'.join(preview(out)))
    elif cmd == 'build':
        p = build(out)
        print('AUDIT:', 'PASS' if not p else p)
