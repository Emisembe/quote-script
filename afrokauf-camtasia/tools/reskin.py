#!/usr/bin/env python3
"""Rebrand a WORKING Camtasia .libzip into brand colors, keeping import-compatible structure."""
import argparse, json, os, shutil, uuid, zipfile
BRAND={"TEAL":(0.0,0.7529,0.6588),"NAVY":(0.0510,0.1098,0.1804),
       "BLUE":(0.1176,0.4118,0.8784),"WHITE":(1.0,1.0,1.0),"BLACK":(0.0,0.0,0.0)}
def parse_rgb(s):
    return BRAND[s.upper()] if s.upper() in BRAND else tuple(float(x) for x in s.split(","))
def val(x): return x.get("defaultValue") if isinstance(x,dict) else x
def near(a,b,eps=0.03): return isinstance(a,(int,float)) and abs(a-b)<eps
def extract(z,dst):
    with zipfile.ZipFile(z) as f: f.extractall(dst)
def find(d,ext):
    for r,_,fs in os.walk(d):
        for f in fs:
            if f.endswith(ext): return os.path.join(r,f)
def inspect(base):
    tmp="/tmp/_insp_"+uuid.uuid4().hex[:6]; extract(base,tmp)
    i=json.load(open(find(tmp,".info.json"))); d=json.load(open(find(tmp,".assetproj")))
    print("Asset Project Version:",i.get("Asset Project Version"),"| Type:",i.get("Asset Type"),
          "|",i.get("Asset Width")+"x"+i.get("Asset Height"))
    idx=[0]
    def w(o):
        if isinstance(o,dict):
            if o.get("_type")=="Callout":
                df=o.get("def",{}); n=idx[0]; idx[0]+=1
                r=val(df.get("fill-color-red"));g=val(df.get("fill-color-green"));b=val(df.get("fill-color-blue"))
                fc=(round(r,3),round(g,3),round(b,3)) if isinstance(r,(int,float)) else None
                print(f"  [{n}] shape={df.get('shape')} fill={fc} text={repr(val(df.get('text')))[:50]}")
            for v in o.values(): w(v)
        elif isinstance(o,list):
            for v in o: w(v)
    w(d); shutil.rmtree(tmp,ignore_errors=True)
def setchan(df,prefix,rgb):
    for k,ch in zip(("red","green","blue"),rgb):
        key=f"{prefix}-{k}"
        if key in df and isinstance(df[key],dict):
            df[key]["defaultValue"]=ch
            for kf in df[key].get("keyframes",[]) or []: kf["value"]=ch
        elif key in df: df[key]=ch
def settext(df,t):
    if isinstance(df.get("text"),dict): df["text"]["defaultValue"]=t
    else: df["text"]=t
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("base"); ap.add_argument("out",nargs="?")
    ap.add_argument("--name"); ap.add_argument("--map",nargs="*",default=[])
    ap.add_argument("--text",nargs="*",default=[]); ap.add_argument("--inspect",action="store_true")
    a=ap.parse_args()
    if a.inspect: return inspect(a.base)
    cmap=[(parse_rgb(m.split("=")[0]),parse_rgb(m.split("=")[1])) for m in a.map]
    tmap=dict(t.split("=",1) for t in a.text)
    work="/tmp/_rsk_"+uuid.uuid4().hex[:6]; extract(a.base,work)
    proj=find(work,".assetproj"); info=find(work,".info.json"); thumb=find(work,".thumb.png")
    pkg=os.path.join(work,"Packages.json"); d=json.load(open(proj))
    def w(o):
        if isinstance(o,dict):
            if o.get("_type")=="Callout":
                df=o.get("def",{})
                r=val(df.get("fill-color-red"));g=val(df.get("fill-color-green"));b=val(df.get("fill-color-blue"))
                for (orr,ogg,obb),new in cmap:
                    if near(r,orr) and near(g,ogg) and near(b,obb): setchan(df,"fill-color",new); break
                t=val(df.get("text"))
                if isinstance(t,str) and t in tmap: settext(df,tmap[t])
            for v in o.values(): w(v)
        elif isinstance(o,list):
            for v in o: w(v)
    w(d)
    i=json.load(open(info)); i["Asset Id"]=str(uuid.uuid4()); i["Asset Creator"]="AfroKauf Verbund"
    try:
        pk=json.load(open(pkg)); pk["Platform"]="Win"; json.dump(pk,open(pkg,"w"),indent=2)
    except Exception: pass
    assetdir=os.path.dirname(proj); old=os.path.basename(proj)[:-len(".assetproj")]
    name=a.name or old
    json.dump(d,open(proj,"w"),indent=2); json.dump(i,open(info,"w"),indent=2)
    os.rename(proj,os.path.join(assetdir,name+".assetproj"))
    os.rename(info,os.path.join(assetdir,name+".info.json"))
    if thumb: os.rename(thumb,os.path.join(assetdir,name+".thumb.png"))
    newdir=os.path.join(os.path.dirname(assetdir),name+".asset")
    if newdir!=assetdir: os.rename(assetdir,newdir)
    out=a.out or (name.replace(" ","")+".libzip")
    rel=["Packages.json",f"{name}.asset/{name}.assetproj",f"{name}.asset/{name}.info.json"]
    if os.path.exists(os.path.join(work,f"{name}.asset/{name}.thumb.png")):
        rel.append(f"{name}.asset/{name}.thumb.png")
    with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
        for r in rel: z.write(os.path.join(work,r),r)
    print("wrote",out,os.path.getsize(out),"bytes")
    shutil.rmtree(work,ignore_errors=True)
if __name__=="__main__": main()
