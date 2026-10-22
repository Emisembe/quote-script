#!/usr/bin/env python3
"""Make HTML for a Blogger page or gadget survive Blogger's editor.

Blogger rewrites every non-ASCII character as &#NNN; when a page is saved.
HTML decodes those again, but <script> and <style> do not, so a JS string
like '×' turns into the visible text "&#215;". This tool writes every
non-ASCII character in a form Blogger leaves alone:

    JavaScript  ->  \\uXXXX       CSS  ->  \\XXXXXX       HTML  ->  &#NNN;

    python3 blogger_safe.py check FILE   # exit 1 if Blogger would change the file
    python3 blogger_safe.py fix FILE     # rewrite FILE in place
"""
import re
import sys


def js_escape(text):
    out = []
    for ch in text:
        cp = ord(ch)
        if cp < 128:
            out.append(ch)
        elif cp > 0xFFFF:  # surrogate pair for astral characters (emoji)
            cp -= 0x10000
            out.append('\\u%04x\\u%04x' % (0xD800 + (cp >> 10), 0xDC00 + (cp & 0x3FF)))
        else:
            out.append('\\u%04x' % cp)
    return ''.join(out)


def css_escape(text):
    # Six hex digits need no trailing space to terminate the escape.
    return ''.join(ch if ord(ch) < 128 else '\\%06x' % ord(ch) for ch in text)


def fix(src):
    src = re.sub(r'(<script\b[^>]*>)(.*?)(</script>)',
                 lambda m: m.group(1) + js_escape(m.group(2)) + m.group(3), src, flags=re.S | re.I)
    src = re.sub(r'(<style\b[^>]*>)(.*?)(</style>)',
                 lambda m: m.group(1) + css_escape(m.group(2)) + m.group(3), src, flags=re.S | re.I)
    return ''.join(ch if ord(ch) < 128 else '&#%d;' % ord(ch) for ch in src)


def main():
    if len(sys.argv) != 3 or sys.argv[1] not in ('check', 'fix'):
        sys.exit(__doc__)
    mode, path = sys.argv[1], sys.argv[2]
    src = open(path, encoding='utf-8').read()
    bad = [(n + 1, line) for n, line in enumerate(src.splitlines()) if any(ord(c) > 127 for c in line)]
    if mode == 'check':
        if not bad:
            print(f'OK  {path} is ASCII-only: Blogger will save it unchanged.')
            return
        print(f'FAIL  {len(bad)} line(s) contain characters Blogger will rewrite:')
        for n, line in bad[:20]:
            chars = ''.join(sorted({c for c in line if ord(c) > 127}))
            print(f'  line {n}: {chars!r}  {line.strip()[:80]}')
        print(f'Run: python3 {sys.argv[0]} fix {path}')
        sys.exit(1)
    fixed = fix(src)
    open(path, 'w', encoding='ascii').write(fixed)
    print(f'Fixed {len(bad)} line(s); {path} is now ASCII-only.')


if __name__ == '__main__':
    main()
