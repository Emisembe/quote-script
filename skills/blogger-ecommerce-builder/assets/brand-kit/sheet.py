from PIL import Image
import sys
d=sys.argv[1]
op=lambda f: Image.open(d+f).convert('RGBA')
a=op('kreislo-logo-primary-colour-on-light-900px.png'); b=op('kreislo-logo-primary-colour-on-dark-900px.png')
c=op('kreislo-logo-stacked-colour-on-light-500px.png'); s=op('kreislo-symbol-colour-on-light-300px.png'); i=op('kreislo-app-icon-rounded-256px.png'); pr=op('kreislo-profile-circle-256px.png'); w=op('kreislo-wordmark-colour-on-dark-300px.png')
W=1900; H=max(a.height+b.height+60, c.height)+40+300
sh=Image.new('RGBA',(W,H),'#ffffff')
sh.alpha_composite(a,(20,20)); dark=Image.new('RGBA',(b.width,b.height),'#111111'); dark.alpha_composite(b); sh.alpha_composite(dark,(20,a.height+40))
sh.alpha_composite(c,(960,20)); y=H-290
sh.alpha_composite(s,(20,y)); sh.alpha_composite(i,(380,y+20)); sh.alpha_composite(pr,(680,y+20))
hd=Image.new('RGBA',(700,max(110,w.height+20)),'#111111'); hd.alpha_composite(w,(20,(hd.height-w.height)//2)); sh.alpha_composite(hd,(1000,y+60))
sh.convert('RGB').save(d+'_sheet.png')
