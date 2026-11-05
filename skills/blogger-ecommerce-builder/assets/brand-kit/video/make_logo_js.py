"""Builds logo.js (letters, K symbol, icons) for the video engine from the logo project's SVG masters.
python3 make_logo_js.py <masters dir> <shop.js> logo.js
masters dir = the brand kit's masters folder (kreislo-wordmark-colour-on-dark.svg, kreislo-symbol-colour-on-dark.svg)."""
import re, json, sys
masters, shopjs, out = sys.argv[1:4]
wm = open(masters + '/kreislo-wordmark-colour-on-dark.svg').read()
sym = open(masters + '/kreislo-symbol-colour-on-dark.svg').read()
letters = [{'d': d} for d in re.findall(r'<path d="([^"]+)" fill="#FFFFFF"/>', wm)]
k = re.findall(r'<path d="([^"]+)" fill="#FFFFFF"/>', sym)[0]
js = open(shopjs).read(); block = js[js.index('var ICONS = {'):js.index('};', js.index('var ICONS = {'))]
icons = {n: re.search(r"\n\s+'?%s'?: '([^']+)'" % n, block).group(1) for n in ['whatsapp', 'youtube', 'instagram', 'tiktok', 'facebook', 'globe', 'mail', 'phone']}
data = {'letters': letters, 'symbolK': k, 'icons': icons, 'stroke': ['instagram', 'globe', 'mail', 'phone']}
open(out, 'w').write('var LOGO = ' + json.dumps(data) + ';\n')
print('wrote', out, len(letters), 'letters')
