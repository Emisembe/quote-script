#!/usr/bin/env python3
"""Build the AfroKauf live overlays: one self-contained HTML file each (fonts and QR code generator inside).

    python3 build.py          ->  dist/*.html

Sources: src/*.html with markers @@FONT_600@@, @@FONT_800@@ (Poppins, SIL Open Font License, fonts/OFL.txt)
and @@QRLIB@@ (vendor/qrcode-generator.js, Kazuhiko Arase, MIT license).
"""
import base64
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
# (source, output name, text replacements for this version)
FILES = [
    ('news-bar.html', 'AfroKauf Live - News Bar - desktop 16x9.html', [('layout: "auto"', 'layout: "wide"')]),
    ('news-bar.html', 'AfroKauf Live - News Bar - mobile 9x16.html', [('layout: "auto"', 'layout: "tall"')]),
    ('break.html', 'AfroKauf Live - Break screen - desktop 16x9.html', [('layout: "auto"', 'layout: "wide"')]),
    ('break.html', 'AfroKauf Live - Break screen - mobile 9x16.html', [('layout: "auto"', 'layout: "tall"')]),
]


def main():
    f600 = base64.b64encode((ROOT / 'fonts' / 'Poppins-SemiBold.ttf').read_bytes()).decode()
    f800 = base64.b64encode((ROOT / 'fonts' / 'Poppins-ExtraBold.ttf').read_bytes()).decode()
    lib = (ROOT / 'vendor' / 'qrcode-generator.js').read_text(encoding='utf-8')
    if '</script' in lib.lower():
        raise SystemExit('vendor library contains </script>')
    (ROOT / 'dist').mkdir(exist_ok=True)
    for old in (ROOT / 'dist').glob('*.html'):
        old.unlink()
    for src, out, reps in FILES:
        s = (ROOT / 'src' / src).read_text(encoding='utf-8')
        for a, b in reps:
            if a not in s:
                raise SystemExit(f'{src}: {a!r} not found')
            s = s.replace(a, b, 1)
        for k, v in (('@@FONT_600@@', f600), ('@@FONT_800@@', f800), ('@@QRLIB@@', lib)):
            if k not in s:
                raise SystemExit(f'{src}: marker {k} missing')
            s = s.replace(k, v)
        (ROOT / 'dist' / out).write_text(s, encoding='utf-8')
        print('built', out, f'({len(s) // 1024} KB)')


if __name__ == '__main__':
    main()
