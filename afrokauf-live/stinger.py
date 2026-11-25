#!/usr/bin/env python3
"""AfroKauf stinger transition for XSplit (and OBS): coloured bands sweep across, the AfroKauf logo shows while the
screen is fully covered, then the bands leave and show the new scene.

    python3 stinger.py OUTDIR            -> frames, then .webm (VP9 with alpha) and .mov (QuickTime Animation with alpha)

The scene change must happen while the screen is covered: the "transition point" printed at the end (in ms).
"""
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
GREEN, GREEN2, GOLD, CLAY, SAND, CREAM = (14, 77, 58), (23, 100, 77), (233, 162, 59), (196, 85, 45), (243, 227, 195), (251, 246, 238)
FPS, DUR = 60, 1.2


def curve(t):
    """0..1 -> 0..1, quick at the start and end, slow in the middle (the covered moment)."""
    x = 2 * t - 1
    g = 0.72 * x ** 3 + 0.28 * x
    return 0.5 + 0.5 * g


def render(W, H, outdir, tag):
    s = int(H * math.tan(math.radians(14)))          # slant of the band edges
    lead = [(GOLD, 150), (CLAY, 150), (SAND, 80)]
    trail = [(CLAY, 120), (GOLD, 120), (GREEN2, 120)]
    # make the big green panel long enough to cover the screen for about 0.45 s around the middle
    G = W + 400
    while True:
        L = sum(w for _, w in lead) + G + sum(w for _, w in trail)
        start, end = W + s, -(L + s)
        lo = sum(w for _, w in lead)                  # green panel starts here inside the train

        def covered(t):
            a = start + (end - start) * curve(t) + lo
            return a + s <= 0 and a + G >= W
        span = sum(1 for i in range(int(DUR * FPS)) if covered(i / (DUR * FPS - 1)))
        if span >= 0.45 * FPS:
            break
        G += 100
    font = ImageFont.truetype(os.path.join(HERE, 'fonts', 'Poppins-ExtraBold.ttf'), int(min(W, H) * 0.16))
    frames_dir = os.path.join(outdir, 'frames-' + tag)
    os.makedirs(frames_dir, exist_ok=True)
    n = int(DUR * FPS)
    cover_frames = []
    for i in range(n):
        t = i / (n - 1)
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(img)
        x = start + (end - start) * curve(t)
        for col, w in lead + [(GREEN, G)] + trail:
            d.polygon([(x, H), (x + w, H), (x + w + s, 0), (x + s, 0)], fill=col + (255,))
            x += w
        a = start + (end - start) * curve(t) + lo
        cov = a + s <= 0 and a + G >= W
        if cov:
            cover_frames.append(i)
        # logo, fading in and out near the edges of the covered time
        margin = min(-(a + s), a + G - W)
        if margin > 0:
            alpha = max(0.0, min(1.0, margin / (W * 0.12)))
            logo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            ld = ImageDraw.Draw(logo)
            w1 = ld.textlength('Afro', font=font)
            w2 = ld.textlength('Kauf', font=font)
            tx = (W - (w1 + w2)) / 2
            ty = H / 2 - font.size * 0.72
            ld.text((tx, ty), 'Afro', font=font, fill=CREAM + (255,))
            ld.text((tx + w1, ty), 'Kauf', font=font, fill=GOLD + (255,))
            # stripe under the logo
            sw = int(w1 + w2)
            sx, sy, sh = int(tx), int(ty + font.size * 1.35), max(8, H // 90)
            cols = [GOLD, CLAY, GREEN2, SAND]
            seg = max(24, sw // 12)
            k = 0
            for xx in range(sx, sx + sw, seg):
                ld.rectangle([xx, sy, min(xx + seg, sx + sw) - 1, sy + sh], fill=cols[k % 4] + (255,))
                k += 1
            logo.putalpha(logo.getchannel('A').point(lambda v: int(v * alpha)))
            img = Image.alpha_composite(img, logo)
        img.save(os.path.join(frames_dir, 'f%04d.png' % i))
    mid = cover_frames[len(cover_frames) // 2]
    return frames_dir, int(round(mid / FPS * 1000)), (cover_frames[0], cover_frames[-1])


def encode(frames_dir, base):
    pat = os.path.join(frames_dir, 'f%04d.png')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', pat, '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p',
                    '-b:v', '8M', '-auto-alt-ref', '0', '-metadata:s:v:0', 'alpha_mode=1', base + '.webm'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', pat, '-c:v', 'qtrle', '-pix_fmt', 'argb',
                    base + '.mov'], check=True)


if __name__ == '__main__':
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for tag, W, H, name in (('wide', 1920, 1080, 'AfroKauf Live - Transition (stinger) - desktop 16x9'),
                            ('tall', 1080, 1920, 'AfroKauf Live - Transition (stinger) - mobile 9x16')):
        fd, point, cov = render(W, H, out, tag)
        encode(fd, os.path.join(out, name))
        print(name, '| transition point', point, 'ms | screen covered from', round(cov[0] / FPS * 1000), 'to', round(cov[1] / FPS * 1000), 'ms')
