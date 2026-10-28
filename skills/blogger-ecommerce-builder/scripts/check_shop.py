#!/usr/bin/env python3
"""Shop-specific audit for a Blogger e-commerce theme (run it after blogger-theme-builder's check.py).

    python3 scripts/check_shop.py theme.xml [--owner you@example.com --owner "Your Bank Name" ...]

Catches what makes a shop theme dangerous or broken, not just ugly:
  * someone else's payment details left in the theme (PayPal email, bank account, demo store)
  * secret or test payment keys
  * retired services, dead image hosts, disabled zoom, the ?m=1 redirect hack
  * no Product structured data, icon-only buttons with no accessible name
  * every outside host the shop depends on (printed so the owner can judge the risk)

Exit code 0 = no FAIL (WARN lines are for a human to read), 1 = at least one FAIL.
"""
import argparse
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

# Demo data shipped inside SpotCommerce 2.x. If any of this survives, money or orders go to its author.
SPOTCOMMERCE_LEFTOVERS = [
    'nguyentien.jobs@gmail.com', 'TIEN NGUYEN VAN', '1894 3822 0704 2852', 'Asia Commercial Bank',
    'Mai Van Vinh', 'spotcommerce.blogspot.com', 'sctemptester', '642e8d9e4f61b7001240a276',
]
RETIRED = {
    'lorempixel.com': 'image host is offline (broken default thumbnails)',
    'addthis': 'AddThis shut down in 2023',
    'plus.google.com': 'Google+ is gone',
    'data-vocabulary.org': 'schema retired; use schema.org',
}
TRUSTED_HOSTS = ('blogger.com', 'blogspot.com', 'googleusercontent.com', 'blogblog.com', 'gstatic.com',
                 'googleapis.com', 'google.com', 'ggpht.com', 'youtube.com', 'ytimg.com')

ap = argparse.ArgumentParser()
ap.add_argument('theme')
ap.add_argument('--owner', action='append', default=[],
                help="the shop owner's own email/bank/name; matching values are not reported")
args = ap.parse_args()

text = pathlib.Path(args.theme).read_text(encoding='utf-8-sig')
low = text.lower()
owner = [o.lower() for o in args.owner]
fails, warns, oks = [], [], []


def check(ok, label, detail='', warn=False):
    if ok:
        oks.append(label)
    else:
        (warns if warn else fails).append(label + (f' -- {detail}' if detail else ''))


# ------------------------------------------------------------ money goes to the right person
left = [s for s in SPOTCOMMERCE_LEFTOVERS if s.lower() in low]
check(not left, 'no SpotCommerce demo payment/store details left', str(left))

secret = re.findall(r'\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{8,}', text)
check(not secret, 'no secret payment keys in the theme (anyone can read it)', str(secret))
check('pk_test_' not in text, 'no Stripe *test* key (test keys take no real money)')

emails = sorted(set(e for e in re.findall(r'[\w.+-]+@[\w-]+\.[\w.]+', text)
                    if e.lower() not in owner and not e.lower().endswith(('@example.com', '@blogger.com'))))
check(not emails, 'every email address in the theme belongs to the owner', ', '.join(emails), warn=True)

ibans = re.findall(r'\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}\b', text)
ibans = [i for i in ibans if i.lower() not in owner]
check(not ibans, 'no bank account numbers except the owner\'s', str(ibans), warn=True)

check(not re.search(r'LICENSE\s*=\s*["\']', text), 'no vendor licence-key switch',
      'the shop depends on a licence check by the template vendor', warn=True)

# ------------------------------------------------------------ hazards
dead = [f'{k} ({v})' for k, v in RETIRED.items() if k in low]
check(not dead, 'no retired services', '; '.join(dead))
check(not re.search(r"indexOf\(\s*['\"]m=1['\"]\s*\)", text),
      'no ?m=1 redirect script (loads every mobile page twice; use Theme > Mobile settings > Desktop)')
check('maximum-scale' not in text and 'user-scalable' not in text, 'pinch-zoom is not disabled (shoppers zoom photos)')
old_ui = re.findall(r'jqueryui/(1\.(?:[0-9]|1[0-2])\.\d+)', text)
check(not old_ui, 'no jQuery UI older than 1.13 (known XSS issues)', str(old_ui))
proto_rel = [u for u in re.findall(r'''(?:src|href)\s*=\s*['"](//[^'"]+)''', text)
             if not u.startswith('//www.blogger.com/')]  # Blogger's own comment code uses these
check(not proto_rel, 'no protocol-relative // URLs', str(proto_rel[:5]))

# ------------------------------------------------------------ shop quality
check(bool(re.search(r'''["']@type["']\s*:\s*["']Product["']|schema\.org/Product''', text)),
      'Product structured data present (price/stock in Google results)',
      'BlogPosting markup alone gives no product rich results')

try:
    root = ET.fromstring(text.encode('utf-8'))
    X = '{http://www.w3.org/1999/xhtml}'
    nameless = []
    for el in root.iter():
        if el.tag not in (X + 'a', X + 'button', 'a', 'button'):
            continue
        E = '{http://www.google.com/2005/gml/expr}'
        if el.get('aria-label') or el.get('title') or el.get(E + 'aria-label') or el.get(E + 'title'):
            continue
        if el.get('aria-hidden') == 'true' or el.get('tabindex') == '-1':
            continue
        if ''.join(el.itertext()).strip():
            continue
        if any((c.get('alt') or c.get(E + 'alt')) for c in el.iter() if c.tag.endswith('img')):
            continue
        if any(c.tag.startswith('{http://www.google.com/2005/gml/data}') for c in el.iter()):
            continue  # text comes from a data: tag
        if not list(el):
            continue  # empty anchors such as <a name=...> are targets, not controls
        nameless.append(el.get('class') or el.get('id') or el.tag.split('}')[-1])
    check(not nameless, 'icon-only links/buttons have an accessible name (aria-label)', str(sorted(set(nameless))[:12]))
except ET.ParseError as e:
    check(False, 'theme is well-formed XML', str(e))

loaded = re.findall(r'''<script[^>]*\bsrc\s*=\s*['"](?:https?:)?//([^/'"]+)''', text) + \
    re.findall(r'''<link[^>]*\bhref\s*=\s*['"](?:https?:)?//([^/'"]+)''', text)
hosts = sorted(set(h.lower() for h in loaded
                   if not h.lower().endswith(TRUSTED_HOSTS)))
check(not hosts, 'scripts/styles load only from Google/Blogger hosts',
      'shop breaks if any of these go away: ' + ', '.join(hosts), warn=True)

for o in oks:
    print(f'ok    {o}')
for w in warns:
    print(f'WARN  {w}')
for f in fails:
    print(f'FAIL  {f}')
print(f'\n{len(oks)} ok, {len(warns)} warnings, {len(fails)} failed')
sys.exit(1 if fails else 0)
