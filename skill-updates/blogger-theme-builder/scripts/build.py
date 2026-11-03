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
    '@@LABEL_MAIN@@': 'includables/label-main.xml',
    '@@POPULARPOSTS_MAIN@@': 'includables/popularposts-main.xml',
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


def skin_css():
    return resolve_custom_properties(read('skin.css'))


def build():
    template = read('theme.xml')
    parts = {
        '@@SKIN_CSS@@': '\n' + skin_css(),
        '@@THEME_JS@@': read('theme.js').rstrip('\n'),
    }
    for marker, path in INCLUDABLES.items():
        parts[marker] = read(path).rstrip('\n')
    for marker, content in parts.items():
        if marker not in template:
            sys.exit(f'build: {marker} missing from src/theme.xml')
        if marker in ('@@SKIN_CSS@@', '@@THEME_JS@@') and ']]>' in content:
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
    print(f'built {OUT.relative_to(ROOT)} ({len(theme.encode("utf-8")):,} bytes)')


if __name__ == '__main__':
    main()
