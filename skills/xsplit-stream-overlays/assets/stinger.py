#!/usr/bin/env python3
"""AfroKauf stinger transition: coloured bands sweep across, the logo shows while the screen is fully covered,
then the bands leave and show the next scene / clip.

    python3 stinger.py OUTDIR                  # XSplit / OBS set: 60 fps, .webm (VP9 + alpha) and .mov (Animation + alpha)
    python3 stinger.py OUTDIR --camtasia       # Camtasia set: 30 fps, both directions, .mov + .webm + .mp4 on magenta

The cut between the two scenes / clips must happen while the screen is covered: the "cut point" printed at the end.
"""
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
# ---- brand (change these for another brand)
GREEN, GREEN2, GOLD, CLAY, SAND, CREAM = (14, 77, 58), (23, 100, 77), (233, 162, 59), (196, 85, 45), (243, 227, 195), (251, 246, 238)
PANEL = GREEN                                        # the colour that covers the screen
LEAD = [(GOLD, 150), (CLAY, 150), (SAND, 80)]        # bands in front of the panel (colour, width at 1920 px)
TRAIL = [(CLAY, 120), (GOLD, 120), (GREEN2, 120)]    # bands behind it
WORDMARK = [('Afro', CREAM), ('Kauf', GOLD)]         # logo text parts and colours
STRIPE = [GOLD, CLAY, GREEN2, SAND]                  # little stripe under the logo
FONT = os.path.join(HERE, 'fonts', 'Poppins-ExtraBold.ttf')
KEY = (255, 0, 255)                                  # magenta background for the .mp4 (Remove a Color / colour key)
DUR = 1.2                                            # seconds


def curve(t):
    """0..1 -> 0..1, quick at the start and end, slow in the middle (the covered moment)."""
    x = 2 * t - 1
    return 0.5 + 0.5 * (0.72 * x ** 3 + 0.28 * x)


def render(W, H, fps, frames_dir, direction='left'):
    """Write PNG frames with alpha. direction='left': bands travel right-to-left; 'right': left-to-right."""
    k = W / 1920 if W >= H else W / 1080
    s = int(H * math.tan(math.radians(14)))
    lead = [(c, int(w * k) or 1) for c, w in LEAD]
    trail = [(c, int(w * k) or 1) for c, w in TRAIL]
    n = int(round(DUR * fps))
    G = W + 400
    while True:                       # panel long enough to cover the screen for about 0.45 s
        L = sum(w for _, w in lead) + G + sum(w for _, w in trail)
        start, end, lo = W + s, -(L + s), sum(w for _, w in lead)
        cov = [i for i in range(n) if start + (end - start) * curve(i / (n - 1)) + lo + s <= 0
               and start + (end - start) * curve(i / (n - 1)) + lo + G >= W]
        if len(cov) >= 0.45 * fps:
            break
        G += 100
    font = ImageFont.truetype(FONT, int(min(W, H) * 0.16))
    os.makedirs(frames_dir, exist_ok=True)
    for i in range(n):
        t = i / (n - 1)
        bands = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        d = ImageDraw.Draw(bands)
        x = start + (end - start) * curve(t)
        for col, w in lead + [(PANEL, G)] + trail:
            d.polygon([(x, H), (x + w, H), (x + w + s, 0), (x + s, 0)], fill=col + (255,))
            x += w
        if direction == 'right':
            bands = bands.transpose(Image.FLIP_LEFT_RIGHT)
        a = start + (end - start) * curve(t) + lo
        margin = min(-(a + s), a + G - W)
        if margin > 0:
            alpha = max(0.0, min(1.0, margin / (W * 0.12)))
            logo = Image.new('RGBA', (W, H), (0, 0, 0, 0))
            ld = ImageDraw.Draw(logo)
            widths = [ld.textlength(p, font=font) for p, _ in WORDMARK]
            tx = (W - sum(widths)) / 2
            ty = H / 2 - font.size * 0.72
            xx = tx
            for (p, col), wd in zip(WORDMARK, widths):
                ld.text((xx, ty), p, font=font, fill=col + (255,))
                xx += wd
            sw, sx, sy, sh = int(sum(widths)), int(tx), int(ty + font.size * 1.35), max(8, min(W, H) // 90)
            seg = max(24, sw // 12)
            for j, x0 in enumerate(range(sx, sx + sw, seg)):
                ld.rectangle([x0, sy, min(x0 + seg, sx + sw) - 1, sy + sh], fill=STRIPE[j % len(STRIPE)] + (255,))
            logo.putalpha(logo.getchannel('A').point(lambda v: int(v * alpha)))
            bands = Image.alpha_composite(bands, logo)
        bands.save(os.path.join(frames_dir, 'f%04d.png' % i))
    return int(round(cov[len(cov) // 2] / fps * 1000)), (int(cov[0] / fps * 1000), int(cov[-1] / fps * 1000))


def encode(frames_dir, base, fps, kinds, W, H):
    pat = os.path.join(frames_dir, 'f%04d.png')
    ff = ['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(fps), '-i', pat]
    if 'webm' in kinds:     # VP9 with alpha (XSplit, OBS, newer editors)
        subprocess.run(ff + ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-b:v', '8M', '-auto-alt-ref', '0',
                             '-metadata:s:v:0', 'alpha_mode=1', base + '.webm'], check=True)
    if 'mov' in kinds:      # QuickTime Animation with alpha (Camtasia, Premiere, DaVinci, XSplit)
        subprocess.run(ff + ['-c:v', 'qtrle', '-pix_fmt', 'argb', base + '.mov'], check=True)
    if 'mp4' in kinds:      # no alpha: magenta background, remove it with a colour key ("Remove a Color" in Camtasia)
        key = '0x%02X%02X%02X' % KEY
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=%s:s=%dx%d:r=%d' % (key, W, H, fps)] + ff[4:] +
                       ['-filter_complex', '[0][1]overlay=shortest=1,format=yuv420p', '-c:v', 'libx264', '-crf', '14',
                        '-preset', 'slow', '-movflags', '+faststart', base + ' (magenta key).mp4'], check=True)


if __name__ == '__main__':
    out = sys.argv[1]
    camtasia = '--camtasia' in sys.argv
    os.makedirs(out, exist_ok=True)
    sizes = (('desktop 16x9', 1920, 1080), ('mobile 9x16', 1080, 1920))
    if camtasia:
        jobs = [('AfroKauf - Transition - %s - %s' % (dn, tag), W, H, 30, d, ('mov', 'webm', 'mp4'))
                for d, dn in (('left', 'sweep left'), ('right', 'sweep right')) for tag, W, H in sizes]
    else:
        jobs = [('AfroKauf Live - Transition (stinger) - ' + tag, W, H, 60, 'left', ('webm', 'mov')) for tag, W, H in sizes]
    for name, W, H, fps, d, kinds in jobs:
        fd = os.path.join(out, 'frames - ' + name)
        point, cov = render(W, H, fps, fd, d)
        encode(fd, os.path.join(out, name), fps, kinds, W, H)
        print(name, '| cut point', point, 'ms | screen covered', cov[0], '-', cov[1], 'ms')
