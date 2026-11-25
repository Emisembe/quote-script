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


# ---------------------------------------------------------------- 2b. interview lower third (who is speaking)
def interview_third(v=False, side='left'):
    """Gold tag (e.g. SHOP OWNER / GUEST / HOST) + name + shop and city. side='right' for the person on the right."""
    W, H = dims(v)
    T = 240
    E = T - 24
    if v:
        w, tag_w, tag_h, h1, h2 = 960, 300, 54, 112, 64
        x, y = 60, 1150
    else:
        w, tag_w, tag_h, h1, h2 = 760, 250, 46, 92, 54
        x, y = (80 if side == 'left' else W - 80 - 760), 770
    dx = -(x + w) if (side == 'left' or v) else (W - x)
    L = []
    L.append(rect(x, y, tag_w, tag_h, GOLD, slot='Tag Colour', **mv(0, dx, 0, E + 6)))
    L.append(text(x + 16, y + 6, tag_w - 32, tag_h - 12, 'SHOP OWNER', GREEN, weight=800, prop='Tag', **mv(0, dx, 0, E + 6)))
    L.append(rect(x, y + tag_h, w, h1, GREEN, slot='Panel Colour', **mv(6, dx, 0, E + 4)))
    L.append(rect(x, y + tag_h + h1, int(w * 0.8), h2, CREAM, **mv(12, dx, 0, E)))
    L += stripe(x, y + tag_h + h1 + h2, int(w * 0.8), 8, E, 16, dx, 0, seg=40)
    L.append(Matte((x, y + tag_h, w, h1),
                   text(x + 28, y + tag_h + 12, w - 56, h1 - 24, 'Tunde Bello', CREAM, weight=800, align='left', prop='Name', **mv(18, 0, h1, E - 4))))
    L.append(Matte((x, y + tag_h + h1, int(w * 0.8), h2),
                   text(x + 28, y + tag_h + h1 + 10, int(w * 0.8) - 48, h2 - 20, 'Owner, Lagos Taste Afroshop, Frankfurt', GREEN, weight=600,
                        align='left', prop='Shop and city', **mv(24, 0, -h2, E - 8))))
    return W, H, T, L


def interview_third_right(v=False):
    return interview_third(v, 'right')


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


# ---------------------------------------------------------------- 5. news-style lower third: title block + headline + QR + ticker
QR_TICKER_TEXT = ('Free listing for every African shop in Germany   |   Order online, pick up in the shop   |   '
                  'Seminars for shop owners   |   afrokauf.blogspot.com   |   Follow us: @afrokauf')


def qr_third(v=False, qr=True):
    """Two rows, like a TV news bar. Top: clay title block + cream headline strip (+ gold-framed QR square).
    Bottom: AfroKauf tab + scrolling ticker. The QR square is a placeholder: in Camtasia put your QR image on top of it."""
    W, H = dims(v)
    T = 600                       # 20 s on screen; the ticker makes one full pass
    E = T - 24
    if v:
        x, w = 40, W - 80
        sy, top_h, head_h, tick_h = 1290, 84, 156, 80
        title_w = 640                                 # a tab on top of the headline, like the desktop block
        ty = sy + 8                                   # title block row
        hx, hy, hw = x, ty + top_h, w                 # headline row under it
        qs = 128
        tab_w = 270
    else:
        x, w = 60, W - 120
        sy, top_h, head_h, tick_h = 856, 120, 120, 72
        title_w = 540
        ty = sy + 8
        hx, hy, hw = x + title_w, ty, w - title_w     # headline row beside the title block
        qs = 100
        tab_w = 330
    tick_y = (hy + head_h) if v else (ty + top_h)
    L = []
    # kente stripe on top
    L += stripe(x, sy, title_w if v else w, 8, E, 0, -(x + w), 0, seg=48)
    # title block (clay) with the programme name
    L.append(rect(x, ty, title_w, top_h, CLAY, slot='Title Block Colour', **mv(2, -(x + title_w), 0, E + 4)))
    L.append(Matte((x, ty, title_w, top_h),
                   text(x + 28, ty + 12, title_w - 56, top_h - 24, 'AFROKAUF LIVE', CREAM, weight=800,
                        align='left' if v else 'center', prop='Title', **mv(12, 0, top_h, E - 2))))
    # headline strip (cream)
    L.append(rect(hx, hy, hw, head_h, CREAM, slot='Headline Strip Colour', **mv(8, -(hx + hw), 0, E + 2)))
    text_w = hw - 56 - ((qs + 48) if qr else 0)
    L.append(Matte((hx, hy, hw, head_h),
                   text(hx + 28, hy + 14, text_w, head_h - 28, 'Shop owner Ada asks this question', GREEN, weight=600,
                        align='left', prop='Headline', **mv(18, 0, -head_h, E - 4))))
    if qr:
        qx, qy = hx + hw - qs - 24, hy + (head_h - qs) // 2
        L.append(rect(qx - 6, qy - 6, qs + 12, qs + 12, GOLD, slot='QR Frame Colour', **mv(22, 0, head_h + 40, E - 6)))
        L.append(rect(qx, qy, qs, qs, (255, 255, 255), **mv(22, 0, head_h + 40, E - 6)))
        L.append(text(qx + 8, qy + qs // 2 - 18, qs - 16, 36, 'QR', (190, 190, 190), weight=700, prop='QR placeholder (hide)',
                      **mv(22, 0, head_h + 40, E - 6)))
    # ticker row: AfroKauf tab (green) + cream strip with scrolling text
    L.append(rect(x, tick_y, w, tick_h, CREAM, slot='Ticker Colour', **mv(4, 0, tick_h + 160, E + 4)))
    L.append(rect(x, tick_y, w, 3, SAND, **mv(4, 0, tick_h + 160, E + 4)))
    win = (x + tab_w, tick_y, w - tab_w, tick_h)
    th = 40 if not v else 44
    tw = 2700 if not v else 2500
    L.append(Matte(win, text(win[0], tick_y + (tick_h - th) // 2, tw, th, QR_TICKER_TEXT, INK, weight=600, align='left',
                             prop='Ticker Text', start=24, dur=T - 24, scroll=(win[2], -tw))))
    L.append(rect(x, tick_y, tab_w, tick_h, GREEN, slot='Tab Colour', **mv(4, 0, tick_h + 160, E + 4)))
    L.append(rect(x + tab_w - 6, tick_y, 6, tick_h, CLAY, **mv(4, 0, tick_h + 160, E + 4)))
    half = (tab_w - 6) // 2
    L.append(text(x + 14, tick_y + 10, half - 10, tick_h - 20, 'Afro', CREAM, weight=800, align='right', prop='Tab first part',
                  **mv(4, 0, tick_h + 160, E + 4)))
    L.append(text(x + 6 + half, tick_y + 10, half - 14, tick_h - 20, 'Kauf', GOLD, weight=800, align='left', prop='Tab second part',
                  **mv(4, 0, tick_h + 160, E + 4)))
    return W, H, T, L


def qr_third_plain(v=False):
    return qr_third(v, qr=False)


# Short names without commas or brackets: Camtasia unpacks "<name>.asset/<name>.assetproj" into a deep folder,
# and long names (path over Windows' 260-character limit) or commas made the import fail ("failed to import").
ASSETS = [
    ('AK Ticker', ticker),
    ('AK Lower Third', lower_third),
    ('AK Guest Left', interview_third),
    ('AK Guest Right', interview_third_right),
    ('AK Live Title', live_title),
    ('AK End Card', end_card),
    ('AK News Bar QR', qr_third),
    ('AK News Bar', qr_third_plain),
]


def variants():
    for name, fn in ASSETS:
        for v, tag in ((False, '16x9'), (True, '9x16')):
            if v and fn is interview_third_right:
                continue   # on a phone both people share the same bottom area
            yield '%s %s' % (name, tag), fn, v


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
            sheet.paste(t, (xd, 60)); g.text((xd, 24), name.replace('AK ', '').replace(' 16x9', ''), font=font, fill=INK)
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
