#!/usr/bin/env python3
"""Assemble the Blogger theme files from src/ and profiles/.

    python3 scripts/build.py          write build/*.xml (+ dist/ files for the preview)
    python3 scripts/build.py --check  exit 1 if build/*.xml is out of date with src/

One design (src/), several outputs (BUILDS below):
  * a content profile (profiles/<name>/) gives every gadget its title and
    content, and can omit gadgets that profile does not need;
  * a palette (profiles/palettes.json) sets the default colours, which stay
    editable in Blogger under Theme > Customise > Advanced.

The skin is authored with CSS custom properties for readability. The build
resolves them to plain values / Blogger $(variables), so the uploaded skin
uses only the CSS features the blog's original Blogger theme used.
"""
import json
import pathlib
import re
import sys
from xml.sax.saxutils import escape

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'
PROFILES = ROOT / 'profiles'
OUT = ROOT / 'build'
DIST = ROOT / 'dist'

# (profile, palette, output file)
BUILDS = [
    ('kpuwu', 'red-navy', 'theme-kpuwu-red-navy.xml'),
    ('kpuwu', 'kpuwu-logo', 'theme-kpuwu-logo-colours.xml'),
    ('generic', 'red-navy', 'theme-union-template.xml'),
]

INCLUDABLES = {
    '@@HTML_MAIN@@': 'includables/html-main.xml',
    '@@LABEL_MAIN@@': 'includables/label-main.xml',
    '@@POPULARPOSTS_MAIN@@': 'includables/popularposts-main.xml',
    '@@ATTRIBUTION_MAIN@@': 'includables/attribution-main.xml',
    '@@TRANSLATE_MAIN@@': 'includables/translate-main.xml',
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


def skin_css(palette):
    css = read('skin.css')
    missing = sorted(set(re.findall(r'@@P:([\w.-]+)@@', css)) - set(palette))
    if missing:
        sys.exit(f'build: palette is missing {missing}')
    css = re.sub(r'@@P:([\w.-]+)@@', lambda m: palette[m.group(1)], css)
    return resolve_custom_properties(css)


def load_profile(name):
    folder = PROFILES / name
    profile = json.loads((folder / 'profile.json').read_text(encoding='utf-8'))
    content = {p.stem: p.read_text(encoding='utf-8').strip() for p in folder.glob('*.html')}
    return profile, content


def remove_widget(template, wid):
    pattern = re.compile(r"[ \t]*<b:widget id='%s'.*?</b:widget>\n" % re.escape(wid), flags=re.S)
    template, n = pattern.subn('', template, count=1)
    if n != 1:
        sys.exit(f'build: cannot omit {wid}: widget not found')
    return template


def build(profile_name, palette):
    profile, content = load_profile(profile_name)
    template = read('theme.xml')

    for wid in profile.get('omit', []):
        template = remove_widget(template, wid)

    # Gadget titles and contents
    used = set()

    def title(m):
        wid = m.group(1)
        if wid not in profile['titles']:
            sys.exit(f'build: profile "{profile_name}" has no title for {wid}')
        return escape(profile['titles'][wid], {"'": '&#39;', '"': '&quot;'})

    def body(m):
        wid = m.group(1)
        if wid not in content:
            sys.exit(f'build: profile "{profile_name}" has no {wid}.html')
        if ']]>' in content[wid]:
            sys.exit(f'build: {wid}.html contains "]]>", which would end the CDATA block')
        used.add(wid)
        return content[wid]

    template = re.sub(r'@@T:(\w+)@@', title, template)
    template = re.sub(r'@@C:(\w+)@@', body, template)
    unused = sorted(set(content) - used)
    if unused:
        sys.exit(f'build: profile "{profile_name}" has content for missing/omitted gadgets: {unused}')

    copyright_text = profile.get('attribution', '')
    template = template.replace('@@ATTRIBUTION_SETTINGS@@', (
        "<b:widget-settings>\n            <b:widget-setting name='copyright'>%s</b:widget-setting>\n"
        "          </b:widget-settings>" % escape(copyright_text)) if copyright_text else '')

    feed = read('includables/feed-main.xml').rstrip('\n')
    template = re.sub(r'@@FEED_MAIN:(\w+):(\d+)@@',
                      lambda m: feed.replace('@@KIND@@', m.group(1)).replace('@@COUNT@@', m.group(2)),
                      template)

    parts = {
        '@@SKIN_CSS@@': '\n' + skin_css(palette),
        '@@THEME_JS@@': read('theme.js').rstrip('\n'),
    }
    for marker, path in INCLUDABLES.items():
        parts[marker] = read(path).rstrip('\n')
    for marker, value in parts.items():
        if marker not in template:
            sys.exit(f'build: {marker} missing from src/theme.xml')
        if marker in ('@@SKIN_CSS@@', '@@THEME_JS@@') and ']]>' in value:
            sys.exit(f'build: {marker} content contains "]]>", which would end the CDATA block')
        template = template.replace(marker, value)
    leftover = re.findall(r'@@[A-Z_]+(?::[\w.:-]+)?@@', template)
    if leftover:
        sys.exit(f'build: unknown markers {sorted(set(leftover))}')
    return template


def preview_css(skin):
    """Skin with Blogger variables replaced by their default values."""
    defaults = dict(re.findall(r'<Variable name="([^"]+)"[^>]*\bvalue="([^"]*)"', skin))
    return re.sub(r'\$\(([^)]+)\)', lambda m: defaults.get(m.group(1), m.group(0)), skin)


def main():
    palettes = json.loads((PROFILES / 'palettes.json').read_text(encoding='utf-8'))
    check = '--check' in sys.argv
    stale = []
    for profile_name, palette_name, filename in BUILDS:
        palette = palettes.get(palette_name)
        if palette is None:
            print(f'skip  {filename}: palette "{palette_name}" not defined yet in profiles/palettes.json')
            continue
        palette = {k: v for k, v in palette.items() if not k.startswith('_')}
        theme = build(profile_name, palette)
        out = OUT / filename
        if check:
            current = out.read_text(encoding='utf-8') if out.exists() else ''
            if current != theme:
                stale.append(filename)
            continue
        OUT.mkdir(exist_ok=True)
        out.write_text(theme, encoding='utf-8')
        print(f'built build/{filename} ({len(theme.encode("utf-8")):,} bytes)')
        DIST.mkdir(exist_ok=True)
        (DIST / f'{palette_name}.css').write_text(preview_css(skin_css(palette)), encoding='utf-8')
    if check:
        if stale:
            sys.exit(f'build --check: out of date: {stale}. Run: python3 scripts/build.py')
        print('build --check: all theme files are up to date')
        return
    (DIST / 'theme.js').write_text(read('theme.js'), encoding='utf-8')


if __name__ == '__main__':
    main()
