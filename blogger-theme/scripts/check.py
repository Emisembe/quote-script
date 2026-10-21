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


ACCEPTED = REF.get('extra', {}).get('accepted', {})
accepted = []


def check(ok, label, detail=''):
    if ok:
        passes.append(label)
    elif label in ACCEPTED:
        accepted.append(f'{label} -- {ACCEPTED[label]}')
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

data_tags = set(re.findall(r'data:[a-zA-Z_][a-zA-Z0-9_.]*', text))
allowed_tags = set(REF['data_tags']) | set(REF['extra']['data_tags'])
check(data_tags <= allowed_tags, f'all {len(data_tags)} data: tags are proven by the original theme',
      str(sorted(data_tags - allowed_tags)))

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
banned = REF.get('extra', {}).get('banned_strings', ['YOUR_', 'YOUR DESCRIPTION', 'soratemplates'])
leftovers = [w for w in banned if w.lower() in text.lower()]
check(not leftovers, 'no leftover content from other blogs/templates', str(leftovers))
check('maximum-scale' not in text and 'user-scalable' not in text, 'pinch-zoom is not disabled')
check(len(text.encode('utf-8')) < 900_000, 'theme file is well under Blogger size limits')

# Behaviour that only shows up on a live blog
check(not re.search(r"class='[^']*\bhentry\b", text),
      'no incomplete hentry microformat (Search Console reports missing author/updated)')
uses_url_home = "data:blog.url == data:blog.homepageUrl" in text
check(not uses_url_home or "data:blog.canonicalUrl == data:blog.homepageUrl" in text,
      'homepage checks also use canonicalUrl (url alone fails with ?fbclid= / ?m=1)')
check(bool(re.search(r'body \.widget ul', skin)),
      "skin resets beat Blogger's injected widget stylesheet (body-prefixed selectors)")

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
for a in accepted:
    print(f'ACCEPTED  {a}')
for f in failures:
    print(f'FAIL  {f}')
print(f'\n{len(passes)} passed, {len(accepted)} accepted (see reference/proven.json extra.accepted), {len(failures)} failed')
sys.exit(1 if failures else 0)
