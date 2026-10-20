#!/usr/bin/env python3
"""Assemble theme.xml from the files in src/.

    python3 scripts/build.py          write theme.xml (+ dist/ files for the preview)
    python3 scripts/build.py --check  exit 1 if theme.xml is out of date with src/
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
OUT = ROOT / 'theme.xml'
DIST = ROOT / 'dist'


def read(name):
    return (SRC / name).read_text(encoding='utf-8')


def build():
    template = read('theme.xml')
    parts = {
        '@@SKIN_CSS@@': '\n' + read('skin.css'),
        '@@LAYOUT_CSS@@': '\n' + read('layout-editor.css'),
        '@@THEME_JS@@': read('theme.js').rstrip('\n'),
    }
    for marker, content in parts.items():
        if template.count(marker) != 1:
            sys.exit(f'build: expected exactly one {marker} in src/theme.xml')
        if ']]>' in content:
            sys.exit(f'build: {marker} content contains "]]>", which would end the CDATA block')
        template = template.replace(marker, content)
    return template


def preview_css(skin):
    """Skin with Blogger variables replaced by their default values."""
    defaults = dict(re.findall(r'<Variable name="([^"]+)"[^>]*\bvalue="([^"]*)"', skin))
    css = re.sub(r'\$\(([^)]+)\)', lambda m: defaults.get(m.group(1), m.group(0)), skin)
    return css


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
    (DIST / 'theme.css').write_text(preview_css(read('skin.css')), encoding='utf-8')
    (DIST / 'theme.js').write_text(read('theme.js'), encoding='utf-8')
    print(f'built {OUT.relative_to(ROOT)} ({len(theme.encode("utf-8")):,} bytes)')


if __name__ == '__main__':
    main()
