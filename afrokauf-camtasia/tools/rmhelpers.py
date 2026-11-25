from rmkit import rect, text, Matte, TEAL, NAVY, BLUE, WHITE
SLATE = (90, 98, 115); GRID = (38, 56, 80); MUTED = (160, 170, 185); LIGHT = (220, 228, 238); DEEP = (24, 44, 68)

def dims(v): return (1080, 1920) if v else (1920, 1080)

def mv(start, dx, dy, E, edx=None, edy=None, d=12):
    """enter from (dx,dy) at `start`, leave to (edx,edy) at global frame E."""
    edx = dx if edx is None else edx; edy = dy if edy is None else edy
    return dict(start=start, enter=(dx, dy, 0, d), exit=(edx, edy, E - start, E - start + d))

def card(x, y, w, h, E, W, side=1, start=0):
    """Navy panel + teal bottom strip sliding in from the right (side=1) or left (side=-1)."""
    dx = (W - x) if side > 0 else -(x + w)
    return [rect(x, y, w, h, NAVY, slot="Panel Colour", **mv(start, dx, 0, E + 10)),
            rect(x, y + h, w, 12, TEAL, slot="Accent Colour", **mv(start + 8, dx, 0, E + 8))]

def rise(win, el_fn, start, E, dist=None):
    """Element revealed from below inside window `win` (matte), sinking back out at E."""
    return Matte(win, el_fn(**mv(start, 0, dist or win[3], E)))

def label_box(x, y, w, h, s, E, start, W, fill=TEAL, ink=NAVY, prop="Label", side=-1):
    dx = -(x + w) if side < 0 else W - x
    return [rect(x, y, w, h, fill, slot="Accent Colour" if fill == TEAL else None, **mv(start, dx, 0, E)),
            text(x + 14, y + 6, w - 28, h - 12, s, ink, weight=800, prop=prop, **mv(start, dx, 0, E))]

# Example asset
def key_point(v=False):
    W, H = dims(v); T = 300; E = T - 30
    px, py, pw, ph = (60, 240, 960, 560) if v else (1140, 220, 700, 540)
    L = card(px, py, pw, ph, E, W)
    win = (px, py, pw, ph)
    L += [rise(win, lambda **kw: text(px + 40, py + 160, pw - 80, ph - 200, "Write the one idea here", WHITE, align="left", prop="Statement", **kw), 20, E)]
    return W, H, T, L
