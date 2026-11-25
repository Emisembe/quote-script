#!/usr/bin/env python3
"""Camtasia .libzip toolkit (Asset Project Version 4.0 = Camtasia 2021+2022).
  inspect  PKG                      clips, tracks (matte/hidden), texts, keyframes, properties
  audit    PKG                      every rule that has broken an import or playback before
  stay     PKG OUT NAME SECONDS     lengthen: in-animations kept, exits (incl. mattes) moved to the end
  sync     PKG OUT NAME             re-sync animationTracks + repackage (fixes Asset Size)
"""
import json, os, sys, uuid, zipfile

def load(pkg):
    z = zipfile.ZipFile(pkg); n = z.namelist()
    get = lambda ext: [x for x in n if x.endswith(ext)][0]
    return dict(proj=json.loads(z.read(get(".assetproj"))), info=json.loads(z.read(get(".info.json"))),
                thumb=z.read(get(".thumb.png")), pkg=json.loads(z.read("Packages.json")))

def save(a, out, name):
    raw = json.dumps(a["proj"], indent=2, separators=(",", " : "), ensure_ascii=True).encode()
    info = dict(a["info"]); info["Asset Id"] = str(uuid.uuid4())
    info["Asset Size"] = str(len(raw) + len(a["thumb"]))
    pk = dict(a["pkg"]); pk["Platform"] = "Win"
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("Packages.json", json.dumps(pk, indent=2, separators=(",", " : ")))
        z.writestr(f"{name}.asset/{name}.thumb.png", a["thumb"])
        z.writestr(f"{name}.asset/{name}.assetproj", raw)
        z.writestr(f"{name}.asset/{name}.info.json", json.dumps(info, indent=2, separators=(",", " : ")))

def clips(proj):
    """id -> (clip, parent_group_or_None, track_dict_it_sits_on)"""
    out = {}
    def walk(g, parent, track):
        out[g["id"]] = (g, parent, track)
        for tr in g.get("tracks", []) if g["_type"] == "Group" else []:
            for m in tr["medias"]: walk(m, g, tr)
    for tr in proj["timeline"]["sceneTrack"]["scenes"][0]["csml"]["tracks"]:
        for m in tr["medias"]: walk(m, None, tr)
    return out

def kf_params(c):
    for src in ("parameters", "def"):
        for name, p in (c.get(src) or {}).items():
            if name != "textAttributes" and isinstance(p, dict) and isinstance(p.get("keyframes"), list):
                yield name, p

def spans(c):
    return sorted({(k["time"], k["endTime"] - k["time"]) for _, p in kf_params(c) for k in p["keyframes"] if "time" in k})

def sync(c, interp=None):
    vis = []
    for i, (t, d) in enumerate(spans(c)):
        e = {"endTime": t + d, "duration": d, "range": [t, d]}
        if interp: e["interp"] = interp
        elif i == 0: e["interp"] = "eioe"
        vis.append(e)
    c["animationTracks"] = {"visual": vis} if vis else {}

def sync_all(proj, linear_ids=()):
    for cid, (c, _, _) in clips(proj).items():
        if c["_type"] == "Callout": sync(c, "linr" if cid in linear_ids else None)

def audit_proj(a):
    p, info = a["proj"], a["info"]; C = clips(p); errs = []
    ver = info.get("Asset Project Version")
    if ver == "6.0": errs.append("NOTE version 6.0 = Camtasia 2022 only (2021 needs 4.0); arrow rule checked for 4.0 only")
    elif ver not in ("4.0", "2.0"): errs.append(f"Asset Project Version {ver}: too new for 2021/2022 (7.0 = 2023+)")
    ids = [g["id"] for g, _, _ in C.values()]
    if len(ids) != len(set(ids)): errs.append("duplicate clip ids")
    for cid, (c, par, tr) in C.items():
        if ver in ("4.0", "2.0") and c["_type"] == "Callout" and spans(c) != sorted((e["range"][0], e["range"][1]) for e in (c.get("animationTracks") or {}).get("visual", [])):
            errs.append(f"clip {cid}: keyframes and animationTracks disagree (Camtasia follows the arrows)")
        for name, prm in kf_params(c):
            for k in prm["keyframes"]:
                if k["endTime"] - k["time"] != k.get("duration", k["endTime"] - k["time"]): errs.append(f"clip {cid} {name}: duration field wrong")
        if c.get("mediaDuration") is not None and abs(float(c["mediaDuration"]) - c["duration"]) > 0.5:
            errs.append(f"clip {cid}: mediaDuration != duration")
        if tr.get("matte"):
            last = max([k["endTime"] for _, prm in kf_params(c) for k in prm["keyframes"]] or [0])
            errs.append(f"NOTE clip {cid} is a TRACK MATTE (track {tr['trackIndex']} of group {par['id'] if par else '-'}): "
                        f"layers below are only visible where it is; its last move ends at frame {last + c['start']} of the group")
        if tr.get("videoHidden"): errs.append(f"NOTE track {tr['trackIndex']} holding clip {cid} is hidden")
        if c["_type"] == "Callout" and isinstance(c["def"].get("text"), str) and c["def"].get("textAttributes"):
            for kf in c["def"]["textAttributes"]["keyframes"]:
                for at in kf["value"]:
                    if at.get("rangeEnd", 0) > len(c["def"]["text"]): errs.append(f"clip {cid}: text style range longer than text")
    if any(ord(ch) > 127 for ch in json.dumps(p, ensure_ascii=False)): errs.append("NOTE non-ASCII characters in text (written escaped)")
    top = C[min(C)][0]
    if int(info.get("Asset Duration", top["duration"])) != top["duration"]: errs.append("info Asset Duration != top group duration")
    for prop in top.get("attributes", {}).get("assetProperties", []):
        for o in prop["objects"]:
            if o not in C: errs.append(f"property '{prop['name']}' points to missing clip {o}")
    return errs

def inspect(a):
    p, info = a["proj"], a["info"]
    print(f"version {info['Asset Project Version']} | type {info['Asset Type']} | {info['Asset Width']}x{info['Asset Height']} | "
          f"editRate {p.get('editRate')} | duration {info['Asset Duration']}")
    C = clips(p)
    for cid, (c, par, tr) in C.items():
        depth = 0; q = par
        while q is not None: depth += 1; q = C[q["id"]][1]
        flags = "".join(f" [{k}]" for k in ("matte", "videoHidden") if tr.get(k))
        s = f"{'  ' * depth}{c['_type']} {cid} track{tr.get('trackIndex', '?')}{flags} start={c['start']} dur={c['duration']}"
        if c["_type"] == "Callout":
            d = c["def"]; s += f" {d.get('shape')} w={d['width'].get('defaultValue') if isinstance(d.get('width'), dict) else d.get('width')}"
            if isinstance(d.get("text"), str): s += f" text={d['text'][:40]!r}"
        moves = [(n, [(k['time'], k['endTime']) for k in prm['keyframes']]) for n, prm in kf_params(c)]
        if moves: s += " moves=" + str(dict(moves[:3]))
        print(s)
    top = C[min(C)][0]
    print("editable properties:", [(x["name"], x["objects"]) for x in top.get("attributes", {}).get("assetProperties", [])])

def stay(a, seconds):
    """Lengthen the asset; everything animates in, stays, and exits at the new end."""
    p = a["proj"]; C = clips(p); rate = int(p.get("editRate", 30))
    top = C[min(C)][0]; total = int(seconds * rate); delta = total - top["duration"]
    for cid, (c, par, tr) in C.items():
        half = c["duration"] * 0.5               # keyframes in the 2nd half of a clip are its exit
        c["duration"] += delta
        if "mediaDuration" in c: c["mediaDuration"] = type(c["mediaDuration"])(c["mediaDuration"] + delta)
        for _, prm in kf_params(c):
            for k in prm["keyframes"]:
                if k["time"] >= half:
                    k["time"] += delta; k["endTime"] += delta
    a["info"]["Asset Duration"] = str(total)
    sync_all(p)

if __name__ == "__main__":
    cmd = sys.argv[1]; a = load(sys.argv[2])
    if cmd == "inspect": inspect(a)
    elif cmd == "audit":
        e = audit_proj(a); real = [x for x in e if not x.startswith("NOTE")]
        print("\n".join(e) if e else "", "\nRESULT:", "PASS" if not real else f"{len(real)} problem(s)")
    elif cmd == "stay": stay(a, float(sys.argv[5])); save(a, sys.argv[3], sys.argv[4]); print("wrote", sys.argv[3])
    elif cmd == "sync": sync_all(a["proj"]); save(a, sys.argv[3], sys.argv[4]); print("wrote", sys.argv[3])
