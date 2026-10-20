#!/usr/bin/env python3
"""Audit theme.xml for problems that make Blogger reject a theme or glitch at runtime.

    python3 scripts/check.py [path/to/theme.xml]

Exit code 0 = all checks pass, 1 = at least one failure.
"""
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import xml.etree.ElementTree as ET

ROOT = pathlib.Path(__file__).resolve().parent.parent
PATH = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'theme.xml'

B = '{http://www.google.com/2005/gml/b}'
XHTML = '{http://www.w3.org/1999/xhtml}'

# Includables Blogger provides itself for version-2 widgets.
BUILTIN_INCLUDES = {'commentPicker', 'quickedit', 'all-head-content'}

failures = []
passes = []


def check(ok, label, detail=''):
    (passes if ok else failures).append(label + (f' -- {detail}' if detail and not ok else ''))


text = PATH.read_text(encoding='utf-8')

# 1. Well-formed XML (Blogger refuses anything else)
try:
    root = ET.fromstring(text.encode('utf-8'))
    check(True, 'XML is well-formed')
except ET.ParseError as e:
    print(f'FAIL  XML is not well-formed: {e}')
    sys.exit(1)

# 2. Theme engine attributes
attrs = {k.replace(B, 'b:'): v for k, v in root.attrib.items()}
for key, want in [('b:version', '2'), ('b:layoutsVersion', '3'),
                  ('b:defaultwidgetversion', '2'), ('b:responsive', 'true')]:
    check(attrs.get(key) == want, f'<html> has {key}="{want}"', f'found {attrs.get(key)!r}')

# 3. Skin blocks
skins = root.findall(f'.//{B}skin')
check(len(skins) == 1, 'exactly one <b:skin>', f'found {len(skins)}')
check(len(root.findall(f'.//{B}template-skin')) == 1, 'one <b:template-skin> for the Layout editor')
skin = (skins[0].text or '') if skins else ''
template_skin = root.find(f'.//{B}template-skin')

# 4. Widgets and sections
sections = root.findall(f'.//{B}section')
widgets = root.findall(f'.//{B}widget')
sec_ids = [s.get('id') for s in sections]
wid_ids = [w.get('id') for w in widgets]
check(len(sec_ids) == len(set(sec_ids)), 'section ids are unique', str(sec_ids))
check(len(wid_ids) == len(set(wid_ids)), 'widget ids are unique', str(wid_ids))
bad_ids = [w.get('id') for w in widgets if not re.fullmatch(re.escape(w.get('type')) + r'\d+', w.get('id'))]
check(not bad_ids, 'widget ids match their type (e.g. LinkList2)', str(bad_ids))
blogs = [w for w in widgets if w.get('type') == 'Blog']
check(len(blogs) == 1, 'exactly one Blog widget', f'found {len(blogs)}')
check(all(w.get('version') == '2' for w in widgets), 'all widgets are version 2')

parent = {c: p for p in root.iter() for c in p}


def ancestors(el):
    while el in parent:
        el = parent[el]
        yield el


orphans = [w.get('id') for w in widgets if not any(a.tag == f'{B}section' for a in ancestors(w))]
check(not orphans, 'every widget sits inside a <b:section>', str(orphans))
nested = [s.get('id') for s in sections if any(a.tag == f'{B}section' for a in ancestors(s))]
check(not nested, 'no nested sections', str(nested))
if blogs:
    conditional = any(a.tag == f'{B}if' for a in ancestors(blogs[0]))
    check(not conditional, 'Blog widget is not hidden behind a <b:if>')

element_ids = [el.get('id') for el in root.iter() if el.get('id') and not el.tag.startswith(B)]
clash = set(element_ids) & (set(sec_ids) | set(wid_ids))
check(not clash, 'section/widget ids do not clash with element ids', str(clash))
check(len(element_ids) == len(set(element_ids)), 'element ids are unique', str(element_ids))

# 5. Every <b:include> resolves
for w in widgets:
    defined = {i.get('id') for i in w.findall(f'{B}includable')}
    for inc in w.iter(f'{B}include'):
        name = inc.get('name')
        ok = name in defined or name in BUILTIN_INCLUDES
        check(ok, f'{w.get("id")}: include "{name}" resolves', 'not defined in this widget')

# 6. Skin CSS
defined_vars = set(re.findall(r'<Variable name="([^"]+)"', skin))
used_vars = set(re.findall(r'\$\(([^)]+)\)', skin))
check(used_vars <= defined_vars, 'every $(variable) in the skin is defined', str(used_vars - defined_vars))
for vdef in re.findall(r'<Variable [^>]*/>', skin):
    check(all(f'{a}="' in vdef for a in ('name', 'description', 'type', 'default', 'value')),
          'Variable has name/description/type/default/value', vdef)


def brace_balance(css):
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    depth = low = 0
    for ch in css:
        depth += ch == '{'
        depth -= ch == '}'
        low = min(low, depth)
    return depth, low


for label, css in [('skin', skin), ('layout skin', (template_skin.text or '') if template_skin is not None else '')]:
    depth, low = brace_balance(css)
    check(depth == 0 and low == 0, f'{label} CSS braces balance', f'depth {depth}, min {low}')
check('//' not in re.sub(r'/\*.*?\*/|https?://|url\([^)]*\)', '', skin, flags=re.S),
      'no // line comments in CSS (invalid CSS)')

# 7. Runtime hazards
check(not re.search(r'''(?:src|href)\s*=\s*['"]http://''', text) and 'url(http://' not in text,
      'no insecure http:// resources (blocked on HTTPS blogs)')
check('document.write' not in text, 'no document.write (blocks rendering, breaks on async loads)')
check('jquery' not in text.lower(), 'no jQuery dependency')
check(not re.search(r'[a-z0-9-]+\.blogspot\.com', text), 'no hard-coded blogspot addresses')
leftovers = [w for w in ('Union Watch', 'Kajiado', 'YOUR_', 'YOUR DESCRIPTION') if w.lower() in text.lower()]
check(not leftovers, 'no leftover content from other blogs/templates', str(leftovers))
check('maximum-scale' not in text and 'user-scalable' not in text, 'pinch-zoom is not disabled')
check(len(text.encode('utf-8')) < 900_000, 'theme file is well under Blogger size limits')

# 8. JavaScript syntax (needs Node.js; skipped if it is not installed)
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
