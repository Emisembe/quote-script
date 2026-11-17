#!/usr/bin/env python3
"""Audit theme.xml before uploading it to Blogger.

    python3 scripts/check.py [path/to/theme.xml]

Two kinds of checks:
  * General: well-formed XML, unique ids, balanced CSS, HTTPS-only, valid JS, ...
  * Proven-only: every Blogger tag, widget type, widget setting (and its value),
    section attribute and data tag must also appear in reference/proven.json,
    which was extracted from the blog's original theme that Blogger accepted.
    This is what catches problems like "Required field must not be blank".

Exit code 0 = all checks pass, 1 = at least one failure.
"""
import json
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
PATH = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'theme.xml'
REF = json.loads((ROOT / 'reference' / 'proven.json').read_text(encoding='utf-8'))

B = '{http://www.google.com/2005/gml/b}'
EXPR = '{http://www.google.com/2005/gml/expr}'
BOOLEANS = set(REF['extra']['setting_values']['boolean settings may be true or false'])

failures = []
passes = []


def check(ok, label, detail=''):
    if ok:
        passes.append(label)
    else:
        failures.append(label + (f' -- {detail}' if detail else ''))


text = PATH.read_text(encoding='utf-8')

# ---------------------------------------------------------------- general
try:
    root = ET.fromstring(text.encode('utf-8'))
    check(True, 'XML is well-formed')
except ET.ParseError as e:
    print(f'FAIL  XML is not well-formed: {e}')
    sys.exit(1)

parent = {c: p for p in root.iter() for c in p}


def ancestors(el):
    while el in parent:
        el = parent[el]
        yield el


def short(tag):
    return tag.replace(B, 'b:').replace(EXPR, 'expr:')


sections = root.findall(f'.//{B}section')
widgets = root.findall(f'.//{B}widget')
sec_ids = [s.get('id') for s in sections]
wid_ids = [w.get('id') for w in widgets]

check(len(root.findall(f'.//{B}skin')) == 1, 'exactly one <b:skin>')
check(len(sec_ids) == len(set(sec_ids)), 'section ids are unique', str(sec_ids))
check(len(wid_ids) == len(set(wid_ids)), 'widget ids are unique', str(wid_ids))
bad_ids = [w.get('id') for w in widgets if not re.fullmatch(re.escape(w.get('type', '')) + r'\d+', w.get('id', ''))]
check(not bad_ids, 'widget ids match their type (e.g. HTML3)', str(bad_ids))
check(sum(w.get('type') == 'Blog' for w in widgets) == 1, 'exactly one Blog widget')
orphans = [w.get('id') for w in widgets if not any(a.tag == f'{B}section' for a in ancestors(w))]
check(not orphans, 'every widget sits inside a <b:section>', str(orphans))
nested = [s.get('id') for s in sections if any(a.tag == f'{B}section' for a in ancestors(s))]
check(not nested, 'no nested sections', str(nested))
conditional = [s.get('id') for s in sections if any(a.tag == f'{B}if' for a in ancestors(s))]
check(not conditional, 'no section is inside a <b:if> (keeps every gadget editable in Layout)', str(conditional))

# Page-level ids must be unique. Ids inside widget includables are only checked
# against page-level ids, because Blogger renders one branch/includable at a time.
in_widget = {el for w in widgets for el in w.iter()}
page_ids = [el.get('id') for el in root.iter()
            if el.get('id') and not el.tag.startswith(B) and el not in in_widget]
widget_inner_ids = {el.get('id') for el in in_widget if el.get('id') and not el.tag.startswith(B)}
check(len(page_ids) == len(set(page_ids)), 'page-level element ids are unique', str(page_ids))
clash = set(page_ids) & (set(sec_ids) | set(wid_ids) | widget_inner_ids)
check(not clash, 'section/widget/element ids do not clash with each other', str(clash))

no_main = [w.get('id') for w in widgets if w.find(f"{B}includable[@id='main']") is None]
check(not no_main, 'every widget has its own main includable', str(no_main))
for w in widgets:
    defined = {i.get('id') for i in w.findall(f'{B}includable')}
    missing = sorted({inc.get('name') for inc in w.iter(f'{B}include')} - defined - set(REF['builtin_includes']))
    check(not missing, f'{w.get("id")}: every <b:include> resolves', f'undefined: {missing}')

# ---------------------------------------------------------------- proven-only
html_attrs = {short(k) for k in root.attrib if not k.startswith('{http://www.w3.org')}
check(html_attrs <= set(REF['html_attributes']), '<html> uses only proven attributes',
      str(html_attrs - set(REF['html_attributes'])))
b_tags = {short(el.tag) for el in root.iter() if el.tag.startswith(B)}
check(b_tags <= set(REF['b_tags']), 'only proven Blogger tags (b:...)', str(b_tags - set(REF['b_tags'])))
sec_attrs = {a for s in sections for a in s.attrib}
check(sec_attrs <= set(REF['section_attributes']), 'sections use only proven attributes',
      str(sec_attrs - set(REF['section_attributes'])))
wid_attrs = {a for w in widgets for a in w.attrib}
check(wid_attrs <= set(REF['widget_attributes']), 'widgets use only proven attributes',
      str(wid_attrs - set(REF['widget_attributes'])))

for w in widgets:
    wid, wtype = w.get('id'), w.get('type')
    proven = REF['widget_types'].get(wtype)
    if proven is None:
        check(False, f'{wid}: widget type "{wtype}" is proven', 'not used by the original theme')
        continue
    problems = []
    if (w.get('version') or '') not in proven['versions']:
        problems.append(f'version {w.get("version")!r} not proven')
    for st in w.iter(f'{B}widget-setting'):
        key, value = st.get('name'), (st.text or '').strip()
        if key not in proven['settings']:
            problems.append(f'setting "{key}" not proven')
        elif not value and key not in proven['blank_ok']:
            problems.append(f'setting "{key}" is blank (Blogger rejects blank required settings)')
        elif value and key != 'content' and key in proven.get('values', {}):
            known = proven['values'][key]
            if value not in known and not (value in BOOLEANS and set(known) <= BOOLEANS):
                problems.append(f'setting "{key}" = "{value}" not proven (proven: {known})')
    check(not problems, f'{wid} ({wtype}): type, version and settings are proven', '; '.join(problems))

# Embedded files (url(data:font/woff2;base64,...)) are not Blogger data tags
no_data_uris = re.sub(r"url\(['\"]?data:[^)]*\)", 'url()', text)
data_tags = set(re.findall(r'data:[a-zA-Z_][a-zA-Z0-9_.]*', no_data_uris))
allowed_tags = set(REF['data_tags']) | set(REF['extra']['data_tags'])
check(data_tags <= allowed_tags, f'all {len(data_tags)} data: tags are proven by the original theme',
      str(sorted(data_tags - allowed_tags)))

# Search engines and social sharing
check(all(t in text for t in ("property='og:title'", "property='og:url'", "property='og:image'", "name='twitter:card'")),
      'social sharing tags (Open Graph + Twitter card) are in <head>')
check(len(re.findall(r"pageType == &quot;(?:archive|error_page)&quot;'>\s*<meta content='noindex, follow' name='robots'/>", text)) == 2,
      'archive and 404 pages are noindex, follow (no thin or duplicate pages in Google)')

# ---------------------------------------------------------------- CSS
skin = root.find(f'.//{B}skin').text or ''
defined_vars = set(re.findall(r'<Variable name="([^"]+)"', skin))
used_vars = set(re.findall(r'\$\(([^)]+)\)', skin))
check(used_vars <= defined_vars, 'every $(variable) in the skin is defined', str(used_vars - defined_vars))
bad_vars = [v for v in re.findall(r'<Variable [^>]*/>', skin)
            if not all(f'{a}="' in v for a in ('name', 'description', 'type', 'default', 'value'))]
check(not bad_vars, 'every Variable has name/description/type/default/value', str(bad_vars))
check('var(--' not in skin and not re.search(r'^\s*--[\w-]+\s*:', skin, flags=re.M),
      'skin has no CSS custom properties (the original skin used none)')


def brace_balance(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    depth = low = 0
    for ch in css:
        depth += ch == '{'
        depth -= ch == '}'
        low = min(low, depth)
    return depth, low


styles = [skin] + [el.text or '' for el in root.iter('{http://www.w3.org/1999/xhtml}style')]
unbalanced = [n + 1 for n, css in enumerate(styles) if brace_balance(css) != (0, 0)]
check(not unbalanced, 'all CSS braces balance', f'blocks {unbalanced}')
check('//' not in re.sub(r'/\*.*?\*/|https?://|url\([^)]*\)', '', skin, flags=re.S),
      'no // line comments in CSS (invalid CSS)')

# ---------------------------------------------------------------- runtime hazards
insecure = re.findall(r'''(?:src|href|action)\s*=\s*['"](http://[^'"]+)''', text) + re.findall(r'url\((http://[^)]+)', text)
check(not insecure, 'no insecure http:// resources (blocked on HTTPS blogs)', str(insecure))
check('document.write' not in text, 'no document.write')
check('jquery' not in text.lower(), 'no jQuery dependency')
check(not re.search(r'[a-z0-9-]+\.blogspot\.com', text), 'no hard-coded blogspot addresses')
leftovers = [w for w in ('Union Watch', 'Kajiado', 'YOUR_', 'YOUR DESCRIPTION', 'soratemplates') if w.lower() in text.lower()]
check(not leftovers, 'no leftover content from other blogs/templates', str(leftovers))
check('maximum-scale' not in text and 'user-scalable' not in text, 'pinch-zoom is not disabled')
check(len(text.encode('utf-8')) < 900_000, 'theme file is well under Blogger size limits')

# ---------------------------------------------------------------- Brand
# The River Musa Show palette and fonts. A colour outside this list fails the audit,
# so shades can't drift (e.g. #6B7A8C instead of #6B7A8D). To add a colour on purpose,
# add it here with the reason.
BRAND_HEX = {
    '0D1C2E': 'Deep Navy', '00C0A8': 'Signal Teal', '33D4C0': 'Teal Light', '5A6273': 'Broadcast Slate',
    'F5F7FA': 'Page background', 'FFFFFF': 'Card / white', 'DDE2EA': 'Border', '1C2B3A': 'Body text',
    '6B7A8D': 'Muted text', '1A7BC4': 'Brand gradient start', 'C9D2E0': 'Text on navy',
    'F7F9FB': 'Table zebra row', 'FFF3CD': 'Status amber background', '7A5800': 'Status amber text',
    '17263A': 'Panels on navy (Theme Designer "primary.soft")',
    '15803D': 'Data tables: up (green)', 'DC2626': 'Data tables: down (red)',
    '000000': 'Video letterbox and print ink', '555555': 'Print only: grey link addresses',
}
BRAND_RGB = {'0, 192, 168', '13, 28, 46', '255, 255, 255', '0, 0, 0'}
BRAND_VARS = {'primary.color': '#0D1C2E', 'accent.color': '#00C0A8', 'accent.hover.color': '#33D4C0',
              'page.background.color': '#F5F7FA', 'text.color': '#1C2B3A', 'muted.color': '#6B7A8D',
              'border.color': '#DDE2EA', 'primary.soft.color': '#17263A'}


def off_brand(source):
    source = re.sub(r'url\(data:[^)]*\)|&#\d+;', '', source)
    hexes = {h.upper() if len(h) == 6 else ''.join(c * 2 for c in h).upper()
             for h in re.findall(r'(?<![&\w])#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b', source)}
    rgbs = {re.sub(r',\s*', ', ', m) for m in re.findall(r'rgba?\((\d+,\s*\d+,\s*\d+)', source)}
    fonts = {f.strip() for f in re.findall(r'font-family\s*:\s*([^;}"\n]+)', source)}
    bad_fonts = {f for f in fonts if not re.match(r"(var\(--[\w-]+\)|'Bebas Neue'|Arial\b|Consolas\b)", f)}
    return sorted('#' + h for h in hexes - BRAND_HEX.keys()) + sorted(rgbs - BRAND_RGB) + sorted(bad_fonts)


check(not off_brand(text), 'theme uses only brand colours and fonts (Navy #0D1C2E, Teal #00C0A8, Bebas Neue, Arial)',
      str(off_brand(text)))
var_defaults = dict(re.findall(r'<Variable name="([^"]+)"[^>]*default="([^"]+)"', skin))
var_values = dict(re.findall(r'<Variable name="([^"]+)"[^>]*value="([^"]+)"', skin))
wrong_vars = {k: (var_defaults.get(k), var_values.get(k)) for k, v in BRAND_VARS.items()
              if var_defaults.get(k, '').upper() != v or var_values.get(k, '').upper() != v}
check(not wrong_vars, 'Theme Designer colours (Customize > Advanced) default to the brand palette', str(wrong_vars))
extra_files = sorted((ROOT / 'page-templates').glob('*.html')) + [ROOT / 'print' / 'business-card' / 'river-musa-business-card.svg']
for extra in extra_files:
    if extra.exists():
        src = extra.read_text(encoding='utf-8')
        if extra.suffix == '.svg':  # cut and safe-area guides (hidden layer) and Inkscape's own page settings
            src = re.sub(r'<rect[^>]*stroke:#(?:FF00FF|00AEEF)[^>]*/>|<text[^>]*fill:#FF00FF[^>]*>.*?</text>|<sodipodi:namedview[^>]*>', '', src)
        check(not off_brand(src), f'{extra.relative_to(ROOT)} uses only brand colours and fonts', str(off_brand(src)))

# Behaviour that only shows up on a live blog
check(not re.search(r"class='[^']*\bhentry\b", text),
      'no incomplete hentry microformat (Search Console reports missing author/updated)')
home_reveal = re.findall(r"<b:if cond='data:blog\.(url|canonicalUrl) == data:blog\.homepageUrl'>\s*<style[^>]*>\.hero", text)
check(set(home_reveal) == {'url', 'canonicalUrl'},
      'homepage hero is revealed even with ?fbclid=/?m=1 style parameters (url and canonicalUrl checks)', str(home_reveal))
check(bool(re.search(r'body \.widget ul', skin)),
      "skin resets beat Blogger's injected widget stylesheet (body-prefixed selectors)")
check(text.count('<h1') >= 1 and "<h1 class='section-title'>" in text,
      'list pages (labels, search, archive) get their own h1')

scripts = re.findall(r'//<!\[CDATA\[(.*?)//\]\]>', text, flags=re.S)
node = shutil.which('node')
if node:
    for n, js in enumerate(scripts, 1):
        with tempfile.NamedTemporaryFile('w', suffix='.js', delete=False) as f:
            f.write(js)
        r = subprocess.run([node, '--check', f.name], capture_output=True, text=True)
        pathlib.Path(f.name).unlink()
        check(r.returncode == 0, f'inline script {n} has valid JavaScript syntax', r.stderr.strip()[:300])
else:
    print('SKIP  JavaScript syntax check (node not installed)')

for p in passes:
    print(f'ok    {p}')
for f in failures:
    print(f'FAIL  {f}')
print(f'\n{len(passes)} passed, {len(failures)} failed')
sys.exit(1 if failures else 0)
