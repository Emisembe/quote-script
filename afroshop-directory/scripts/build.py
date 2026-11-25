#!/usr/bin/env python3
"""Assemble theme.xml from the files in src/.

    python3 scripts/build.py          write theme.xml (+ dist/ files for the preview)
    python3 scripts/build.py --check  exit 1 if theme.xml is out of date with src/

The skin is authored with CSS custom properties for readability. The build
resolves them to plain values / Blogger $(variables), so the uploaded skin
uses only the CSS features the blog's original Blogger theme used.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
OUT = ROOT / 'theme.xml'
DIST = ROOT / 'dist'

INCLUDABLES = {
    '@@HTML_MAIN@@': 'includables/html-main.xml',
    '@@ATTRIBUTION_MAIN@@': 'includables/attribution-main.xml',
    '@@BLOG_COMMENTS@@': 'includables/blog-comments.xml',
}


def read(name):
    return (SRC / name).read_text(encoding='utf-8')


def resolve_custom_properties(css):
    """Inline the :root { --x: value } block and every var(--x) use."""
    m = re.search(r':root\s*\{(.*?)\}', css, flags=re.S)
    if not m:
        return css
    props = dict(re.findall(r'(--[\w-]+)\s*:\s*([^;]+);', m.group(1)))
    css = css[:m.start()] + css[m.end():]
    for _ in range(5):  # values may reference other properties
        css = re.sub(r'var\((--[\w-]+)\)', lambda v: props[v.group(1)].strip(), css)
    if 'var(--' in css:
        sys.exit('build: unresolved var(--...) in skin.css')
    return css


MODULES = ['blocks.js', 'shop.js']   # merged into directory.js, so they share its helpers


def directory_js():
    js = read('directory.js')
    if '/* @@MODULES@@ */' not in js:
        sys.exit('build: /* @@MODULES@@ */ missing from src/directory.js')
    if '/* @@I18N@@ */' not in js:
        sys.exit('build: /* @@I18N@@ */ missing from src/directory.js')
    js = js.replace('/* @@I18N@@ */', read('i18n.js').strip('\n').lstrip())
    return js.replace('/* @@MODULES@@ */', '\n'.join(read(m).rstrip('\n') for m in MODULES))


# Translations: src/i18n/strings.tsv has one row per English text and one column per language.
# Each language becomes the content of its own gadget in Layout (marker @@LANG_xx@@ in theme.xml).
LANG_CODES = ['de', 'fr', 'sw', 'am', 'ti']


def lang_packs():
    rows = [l.split('\t') for l in read('i18n/strings.tsv').rstrip('\n').split('\n')]
    head, rows = rows[0], rows[1:]
    packs = {}
    for code in LANG_CODES:
        col = head.index(code)
        lines = ['lang: ' + code]
        for r in rows:
            if len(r) != len(head):
                sys.exit(f'build: strings.tsv row has {len(r)} columns: {r[0]!r}')
            if ' = ' in r[0] or ']]>' in r[col]:
                sys.exit(f'build: strings.tsv text cannot contain " = " or "]]>": {r[0]!r}')
            if r[col].strip():
                lines.append(r[0] + ' = ' + r[col].strip())
        packs['@@LANG_' + code + '@@'] = '\n'.join(lines)
    return packs


def skin_css():
    return resolve_custom_properties(read('skin.css'))


def build():
    template = read('theme.xml')
    parts = {
        '@@SKIN_CSS@@': '\n' + skin_css(),
        '@@THEME_JS@@': read('theme.js').rstrip('\n'),
        '@@DIR_JS@@': directory_js().rstrip('\n'),
    }
    parts.update(lang_packs())
    for marker, path in INCLUDABLES.items():
        parts[marker] = read(path).rstrip('\n')
    for marker, content in parts.items():
        if marker not in template:
            sys.exit(f'build: {marker} missing from src/theme.xml')
        if marker in ('@@SKIN_CSS@@', '@@THEME_JS@@', '@@DIR_JS@@') and ']]>' in content:
            sys.exit(f'build: {marker} content contains "]]>", which would end the CDATA block')
        template = template.replace(marker, content)
    leftover = re.findall(r'@@[A-Z_]+@@', template)
    if leftover:
        sys.exit(f'build: unknown markers {leftover}')
    return template


def preview_css(skin):
    """Skin with Blogger variables replaced by their default values."""
    defaults = dict(re.findall(r'<Variable name="([^"]+)"[^>]*\bvalue="([^"]*)"', skin))
    return re.sub(r'\$\(([^)]+)\)', lambda m: defaults.get(m.group(1), m.group(0)), skin)


def main():
    theme = build()
    if '--check' in sys.argv:
        current = OUT.read_text(encoding='utf-8') if OUT.exists() else ''
        if current != theme:
            sys.exit('build --check: theme.xml is out of date. Run: python3 scripts/build.py')
        print('build --check: theme.xml is up to date')
        return
    OUT.write_text(theme, encoding='utf-8')
    DIST.mkdir(exist_ok=True)
    (DIST / 'theme.css').write_text(preview_css(skin_css()), encoding='utf-8')
    (DIST / 'theme.js').write_text(read('theme.js'), encoding='utf-8')
    (DIST / 'directory.js').write_text(directory_js(), encoding='utf-8')
    print(f'built {OUT.relative_to(ROOT)} ({len(theme.encode("utf-8")):,} bytes)')


if __name__ == '__main__':
    main()
