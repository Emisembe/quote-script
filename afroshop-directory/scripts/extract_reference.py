#!/usr/bin/env python3
"""Extract what a Blogger-generated theme proves Blogger accepts.

    python3 scripts/extract_reference.py path/to/theme-backup.xml reference/proven.json

Use a theme Blogger itself produced or accepted (Theme > Backup). The output
is the rulebook scripts/check.py audits against: Blogger tags, attributes,
gadget types/versions/settings/values, data tags and built-in includes.
"""
import json
import pathlib
import re
import sys
import xml.etree.ElementTree as ET

B = '{http://www.google.com/2005/gml/b}'
EXPR = '{http://www.google.com/2005/gml/expr}'

DEFAULT_BANNED = ['YOUR_', 'YOUR DESCRIPTION', 'soratemplates']


def short(tag):
    return tag.replace(B, 'b:').replace(EXPR, 'expr:')


def extract(text):
    root = ET.fromstring(text.encode('utf-8'))
    ref = {
        '_about': ("Facts taken from a theme export that Blogger generated and accepted. "
                   "scripts/check.py only allows what is listed here, plus 'extra' entries (each needs a reason)."),
        'html_attributes': sorted(short(k) for k in root.attrib if not k.startswith('{http://www.w3.org')),
        'b_tags': sorted({short(el.tag) for el in root.iter() if el.tag.startswith(B)}),
        'data_tags': sorted(set(re.findall(r'data:[a-zA-Z_][a-zA-Z0-9_.]*', text))),
        'section_attributes': sorted({a for el in root.iter(B + 'section') for a in el.attrib}),
        'widget_attributes': sorted({a for el in root.iter(B + 'widget') for a in el.attrib}),
    }
    types = {}
    for w in root.iter(B + 'widget'):
        d = types.setdefault(w.get('type'), {'versions': set(), 'settings': set(), 'blank_ok': set(), 'values': {}})
        d['versions'].add(w.get('version') or '')
        for st in w.iter(B + 'widget-setting'):
            key, value = st.get('name'), (st.text or '').strip()
            d['settings'].add(key)
            if not value:
                d['blank_ok'].add(key)
            elif key != 'content':
                d['values'].setdefault(key, set()).add(value)
    ref['widget_types'] = {
        t: {'versions': sorted(d['versions']), 'settings': sorted(d['settings']),
            'blank_ok': sorted(d['blank_ok']),
            'values': {k: sorted(v) for k, v in sorted(d['values'].items())}}
        for t, d in sorted(types.items())
    }
    defined = {inc.get('id') for inc in root.iter(B + 'includable')}
    ref['builtin_includes'] = sorted({i.get('name') for i in root.iter(B + 'include')} - defined)
    ref['extra'] = {
        'data_tags': {},
        'setting_values': {'boolean settings may be true or false': ['true', 'false']},
        'banned_strings': DEFAULT_BANNED,
        'notes': ('Anything allowed beyond the reference export goes here with a reason. '
                  'Add names/addresses of other blogs found in the reference to banned_strings.'),
    }
    return ref


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    ref = extract(src.read_text(encoding='utf-8'))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(ref, indent=2) + '\n', encoding='utf-8')
    print(f'wrote {out}: {len(ref["widget_types"])} gadget types, {len(ref["data_tags"])} data tags, '
          f'engine attributes {ref["html_attributes"]}')


if __name__ == '__main__':
    main()
