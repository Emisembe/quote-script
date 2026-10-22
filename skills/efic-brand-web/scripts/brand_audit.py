#!/usr/bin/env python3
"""Check HTML/CSS (or a Blogger theme XML) against the EFIC web palette.

    python3 brand_audit.py FILE [FILE...]

Reports, per file:
  ERROR  Alert Red or other reds (reserved for the LIVE broadcast dot)
  ERROR  white text on a gold background (2.3:1, fails WCAG AA)
  WARN   gold used as a text colour (fine on navy; check it is never on white)
  WARN   colours outside the EFIC palette and its neutrals
Exit code 1 if there are errors. Colours inside url(...) / data: URIs are ignored.
"""
import re
import sys

PALETTE = {
    '#14213D': 'EFIC Navy', '#E7B165': 'EFIC Gold', '#0F1A30': 'Deep Navy', '#FFFFFF': 'White',
    '#F7F6F2': 'Off-White', '#4A5568': 'Neutral Grey', '#F5D08A': 'Light Gold (gradients only)',
    '#C9924A': 'Dark Gold',
}
NEUTRALS = {'#000000', '#E8E5DC', '#D9D5CA', '#ECEAE4', '#F0EEE8', '#718096', '#2B3753'}
REDS = {'#E74C3C', '#C0392B', '#E83434', '#FF0000', '#F55D5D', '#DB4A39', '#CA2127', '#D32F2F'}
GOLD, WHITE = '#E7B165', '#FFFFFF'
# (?<!&) skips HTML character codes such as &#163; (the pound sign)
HEX = re.compile(r'(?<!&)#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b')


def norm(h):
    h = h.upper()
    return '#' + ''.join(c * 2 for c in h[1:]) if len(h) == 4 else h


def rules(css):
    """Innermost { ... } blocks as (selector, declarations)."""
    for m in re.finditer(r'([^{}]*)\{([^{}]*)\}', css):
        yield m.group(1).strip().split('\n')[-1][:70], m.group(2)


def audit(path):
    text = open(path, encoding='utf-8', errors='replace').read()
    text = re.sub(r'url\([^)]*\)', 'url()', text)
    text = re.sub(r'data:[^"\'\s)]+', '', text)
    errors, warns, off = [], [], {}
    for h in HEX.findall(text):
        c = norm('#' + h)
        if c in REDS:
            errors.append(f'red {c}: Alert Red is reserved for the LIVE broadcast dot; use navy (or an outline button) instead')
        elif c not in PALETTE and c not in NEUTRALS:
            off[c] = off.get(c, 0) + 1
    for sel, decl in rules(text):
        d = {k.strip().lower(): norm(v.group(0)) for k, v in
             ((p.split(':', 1)[0], HEX.search(p.split(':', 1)[1])) for p in decl.split(';') if ':' in p) if v}
        bg = d.get('background-color') or d.get('background')
        if d.get('color') in (WHITE, '#FFF') and bg == GOLD:
            errors.append(f'white text on gold in "{sel}": use navy text on gold')
        if d.get('color') == GOLD and bg not in ('#14213D', '#0F1A30'):
            warns.append(f'gold text in "{sel}": fine on navy/deep navy; check it never sits on white or off-white')
    print(f'== {path}')
    for e in sorted(set(errors)):
        print('  ERROR ' + e)
    for w in sorted(set(warns)):
        print('  WARN  ' + w)
    if off:
        top = ', '.join(f'{c} x{n}' for c, n in sorted(off.items(), key=lambda x: -x[1])[:12])
        print(f'  WARN  {len(off)} off-palette colour(s): {top}')
    if not (errors or warns or off):
        print('  OK    only EFIC palette colours, no red, no forbidden pairings')
    return bool(errors)


if __name__ == '__main__':
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    sys.exit(1 if any([audit(p) for p in sys.argv[1:]]) else 0)
