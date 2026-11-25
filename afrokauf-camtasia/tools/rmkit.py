#!/usr/bin/env python3
"""River Musa asset kit: Camtasia 4.0 assets (2021 + 2022) cloned from breaking_news_left templates.
Specs use top-left pixel coordinates; frames at 30 fps."""
import copy, json, math, os, sys, uuid, zipfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import camtasia_tools as ct
from PIL import Image, ImageDraw, ImageFont, ImageChops

BASE = os.environ.get("RM_BASE", "breaking_news_left.libzip")
TEAL = (0, 192, 168); NAVY = (13, 28, 46); BLUE = (30, 105, 224); WHITE = (255, 255, 255)
FONT_DIR = os.environ.get("AK_FONT_DIR", "/usr/share/fonts/truetype/google-fonts/").rstrip("/") + "/"

class El:
    def __init__(self, kind, x, y, w, h, color, start=0, dur=None, enter=None, exit=None,
                 text=None, weight=700, align="center", prop=None, scroll=None, slot=None, fx=None, alpha=1.0, stroke=None):
        self.__dict__.update(locals()); del self.__dict__["self"]

def rect(*a, **k): return El("rect", *a, **k)
def text(x, y, w, h, s, color, **k): return El("text", x, y, w, h, color, text=s, **k)

class Matte:
    def __init__(self, window, *children): self.window = window; self.children = list(children)

def _templates():
    a = ct.load(BASE); C = ct.clips(a["proj"])
    strip = lambda c: _clean(copy.deepcopy(c))
    return a, strip(C[12][0]), strip(C[7][0]), copy.deepcopy(C[11][0]), copy.deepcopy(C[2][0])

def _clean(c):
    for src in ("parameters", "def"):
        for k, p in list(c[src].items()):
            if isinstance(p, dict) and "keyframes" in p and k != "textAttributes": p.pop("keyframes", None)
    c["animationTracks"] = {}; return c

def _track(i, medias, matte=0):
    return {"trackIndex": i, "ident": "", "audioMuted": False, "videoHidden": False, "magnetic": False,
            "matte": matte, "solo": False, "metadata": {"IsLocked": "False", "WinTrackHeight": "56"}, "medias": medias}

def _param(rest, enter, exit_, dur, axis, linear=None):
    sgn = 1 if axis == 0 else -1
    if linear is not None:
        a, b = linear
        return {"type": "double", "defaultValue": a, "interp": "linr",
                "keyframes": [{"endTime": dur, "time": 0, "value": b, "interp": "linr", "duration": dur}]}
    kfs = []; start_val = rest
    if enter and enter[axis] != 0:
        start_val = rest + sgn * enter[axis]
        kfs.append({"endTime": enter[3], "time": enter[2], "value": rest, "interp": "eioe", "duration": enter[3] - enter[2]})
    if exit_ and exit_[axis] != 0:
        kfs.append({"endTime": exit_[3], "time": exit_[2], "value": rest + sgn * exit_[axis], "interp": "eioe", "duration": exit_[3] - exit_[2]})
    p = {"type": "double", "defaultValue": start_val, "interp": "eioe"}
    if kfs: p["keyframes"] = kfs
    return p

class Builder:
    def __init__(self, W, H, total, name):
        self.W, self.H, self.total, self.name = W, H, total, name
        self.a, self.RECT, self.TEXT, self.GROUP, self.TOP = _templates()
        self.next_id = 3; self.props = {}; self.slots = {}

    def _id(self):
        i = self.next_id; self.next_id += 1; return i

    def _callout(self, e):
        c = copy.deepcopy(self.RECT if e.kind == "rect" else self.TEXT)
        c["id"] = self._id(); dur = e.dur if e.dur is not None else self.total - e.start
        c["start"] = e.start; c["duration"] = dur; c["mediaStart"] = 0; c["mediaDuration"] = dur
        d = c["def"]
        d["width"] = e.w if not isinstance(d["width"], dict) else dict(d["width"], defaultValue=e.w)
        d["height"] = e.h if not isinstance(d["height"], dict) else dict(d["height"], defaultValue=e.h)
        cx = e.x + e.w / 2 - self.W / 2; cy = self.H / 2 - (e.y + e.h / 2)
        P = c["parameters"]
        P["translation0"] = _param(cx, e.enter, e.exit, dur, 0, linear=(cx + e.scroll[0], cx + e.scroll[1]) if e.scroll else None)
        P["translation1"] = _param(cy, e.enter, e.exit, dur, 1)
        if e.kind == "rect":
            setv = lambda key, val: d.__setitem__(key, dict(d[key], defaultValue=val) if isinstance(d[key], dict) else val)
            setv("fill-color-opacity", float(e.alpha))
            if e.stroke:
                sc, sw = e.stroke
                for k, v in zip(("red", "green", "blue"), sc): setv(f"stroke-color-{k}", v / 255)
                setv("stroke-width", float(sw))
            for k, v in zip(("red", "green", "blue"), e.color): setv(f"fill-color-{k}", v / 255)
        else:
            d["text"] = e.text; d["horizontal-alignment"] = e.align; d["vertical-alignment"] = "center"
            d["resize-behavior"] = "resizeText"; d["word-wrap"] = 1.0
            for kf in d["textAttributes"]["keyframes"]:
                for at in kf["value"]:
                    at["rangeEnd"] = len(e.text)
                    if at["name"] == "fontName": at["value"] = "Poppins"
                    if at["name"] == "fontWeight": at["value"] = e.weight
                    if at["name"] == "fgColor": at["value"] = "(%d,%d,%d,255)" % e.color
                    if at["name"] == "fontSize": at["value"] = round(e.h * 0.6)
                    if at["name"] == "kerning": at["value"] = 0.0
        for name, (v0, v1, a_, b_, v2, c_, d_) in (e.fx or {}).items():
            kfs = [{"endTime": b_, "time": a_, "value": v1, "interp": "eioe", "duration": b_ - a_}]
            if c_ is not None: kfs.append({"endTime": d_, "time": c_, "value": v2, "interp": "eioe", "duration": d_ - c_})
            P[name] = {"type": "double", "defaultValue": v0, "interp": "eioe", "keyframes": kfs}
        if getattr(e, "custom", None): e.custom(c, self.W, self.H)
        if e.prop: self.props.setdefault(e.prop, []).append(c["id"])
        if e.slot: self.slots.setdefault(e.slot, []).append(c["id"])
        ct.sync(c, "linr" if e.scroll else None)
        return c

    def _group(self, tracks, ident):
        g = copy.deepcopy(self.GROUP); g["id"] = self._id()
        g["start"] = 0; g["duration"] = self.total; g["mediaStart"] = 0.0; g["mediaDuration"] = float(self.total)
        g["parameters"]["translation0"] = {"type": "double", "defaultValue": 0.0, "interp": "eioe"}
        g["parameters"]["translation1"] = {"type": "double", "defaultValue": 0.0, "interp": "eioe"}
        g["attributes"] = dict(g["attributes"], ident=ident, widthAttr=float(self.W), heightAttr=float(self.H), assetProperties=[])
        g["animationTracks"] = {}; g["tracks"] = tracks
        return g

    def build(self, layers, out=None):
        tracks = []
        for L in layers:
            if isinstance(L, Matte):
                for ch in L.children:
                    x, y, w, h = L.window
                    m = self._callout(rect(x, y, w, h, WHITE)); c = self._callout(ch)
                    tracks.append(_track(len(tracks), [self._group([_track(0, [c]), _track(1, [m], matte=1)], "Reveal")]))
                continue
            items = L if isinstance(L, list) else [L]
            tracks.append(_track(len(tracks), [self._callout(e) for e in items]))
        top = self.TOP; top["id"] = 2
        top["start"] = 0; top["duration"] = self.total; top["mediaStart"] = 0.0; top["mediaDuration"] = float(self.total)
        top["tracks"] = tracks
        props = [{"type": 0, "name": n, "objects": ids, "themeMappings": {"font-color": "", "font-family": ""}} for n, ids in self.props.items()]
        props += [{"type": 1, "name": n, "objects": ids} for n, ids in self.slots.items()]
        top["attributes"] = dict(top["attributes"], ident=self.name, widthAttr=float(self.W), heightAttr=float(self.H), assetProperties=props)
        p = self.a["proj"]; p["width"] = float(self.W); p["height"] = float(self.H)
        p["timeline"]["sceneTrack"]["scenes"][0]["csml"]["tracks"][0]["medias"] = [top]
        self.a["info"].update({"Asset Width": str(self.W), "Asset Height": str(self.H), "Asset Duration": str(self.total),
                               "Asset Creator": "AfroKauf Verbund", "Asset Type": "5"})
        return self

    def save(self, out, thumb_png):
        self.a["thumb"] = thumb_png; ct.save(self.a, out, self.name)
        return [e for e in ct.audit_proj(ct.load(out)) if not e.startswith("NOTE")]

# ---------------- preview renderer (approximate; same spec)
def _ease(u): return u * u * (3 - 2 * u)

def _offset(e, f):
    if e.scroll:
        u = min(max(f / e.dur, 0), 1); return (e.scroll[0] + (e.scroll[1] - e.scroll[0]) * u, 0)
    dx = dy = 0.0
    if e.enter:
        a, b = e.enter[2], e.enter[3]; u = 0 if f <= a else 1 if f >= b else _ease((f - a) / (b - a))
        dx += e.enter[0] * (1 - u); dy += e.enter[1] * (1 - u)
    if e.exit:
        c, d = e.exit[2], e.exit[3]; u = 0 if f <= c else 1 if f >= d else _ease((f - c) / (d - c))
        dx += e.exit[0] * u; dy += e.exit[1] * u
    return dx, dy

_FONTS = {}
def _font(weight, size):
    name = {800: "ExtraBold", 700: "Bold", 600: "SemiBold", 500: "Medium"}.get(weight, "Bold")
    path = FONT_DIR + f"Poppins-{name}.ttf"
    if not os.path.exists(path): path = FONT_DIR + "Poppins-Bold.ttf"
    if (path, size) not in _FONTS: _FONTS[(path, size)] = ImageFont.truetype(path, size)
    return _FONTS[(path, size)]

def _wrap(s, ft, w):
    lines, cur = [], ""
    for wd in s.split(" "):
        t = (cur + " " + wd).strip()
        if ft.getlength(t) <= w or not cur: cur = t
        else: lines.append(cur); cur = wd
    lines.append(cur); return lines

def _inv_affine(sc, rot, cx, cy):
    c, s_ = math.cos(-rot) / sc, math.sin(-rot) / sc
    return (c, -s_, cx - c * cx + s_ * cy, s_, c, cy - s_ * cx - c * cy)

def _draw_el(img, e, f, total, clip=None):
    dur = e.dur if e.dur is not None else total - e.start; lf = f - e.start
    if lf < 0 or lf >= dur: return
    if e.scroll: e.dur = dur
    ox, oy = _offset(e, lf); x, y = e.x + ox, e.y + oy
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0)); g = ImageDraw.Draw(layer)
    if e.kind == "rect":
        fill = e.color + (int(255 * e.alpha),) if e.alpha > 0 else None
        g.rectangle([x, y, x + e.w, y + e.h], fill=fill, outline=(e.stroke[0] + (255,)) if e.stroke else None, width=int(e.stroke[1]) if e.stroke else 0)
    else:
        size = int(e.h * 0.6)
        while size > 8:
            ft = _font(e.weight, size); lines = _wrap(e.text, ft, e.w); th = len(lines) * size * 1.15
            if th <= e.h and all(ft.getlength(l) <= e.w for l in lines): break
            size -= 2
        ty = y + (e.h - th) / 2
        for l in lines:
            lw = ft.getlength(l); lx = x if e.align == "left" else x + e.w - lw if e.align == "right" else x + (e.w - lw) / 2
            g.text((lx, ty), l, font=ft, fill=e.color + (255,)); ty += size * 1.15
    if e.fx:
        def fxv(n, dflt):
            if n not in e.fx: return dflt
            v0, v1, a_, b_, v2, c_, d_ = e.fx[n]
            if lf <= a_: return v0
            if lf < b_: return v0 + (v1 - v0) * _ease((lf - a_) / (b_ - a_))
            if c_ is None or lf <= c_: return v1
            if lf < d_: return v1 + (v2 - v1) * _ease((lf - c_) / (d_ - c_))
            return v2
        op, sc, rot = fxv("opacity", 1.0), max(fxv("scale0", 1.0), 0.01), fxv("rotation2", 0.0)
        if sc != 1.0 or rot: layer = layer.transform(layer.size, Image.AFFINE, _inv_affine(sc, rot, x + e.w / 2, y + e.h / 2), resample=Image.BILINEAR)
        if op < 1.0: layer.putalpha(layer.split()[3].point(lambda p: int(p * max(op, 0))))
    if clip:
        mask = Image.new("L", img.size, 0); ImageDraw.Draw(mask).rectangle([clip[0], clip[1], clip[0] + clip[2], clip[1] + clip[3]], fill=255)
        layer.putalpha(ImageChops.multiply(layer.split()[3], mask))
    img.alpha_composite(layer)

def render(layers, W, H, total, f, bg=None):
    img = bg.copy().convert("RGBA") if bg is not None else Image.new("RGBA", (W, H), (0, 0, 0, 0))
    for L in layers:
        if isinstance(L, Matte):
            for ch in L.children: _draw_el(img, ch, f, total, clip=L.window)
        else:
            for e in (L if isinstance(L, list) else [L]): _draw_el(img, e, f, total)
    return img
