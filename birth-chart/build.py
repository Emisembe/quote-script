#!/usr/bin/env python3
"""Bundle src/ into one self-contained index.html.

Every local stylesheet and script referenced by src/index.html is inlined,
including the astronomy-engine library, so the result works when it is the
only file uploaded to a host. Only Google Fonts load from the network, and the
page falls back to system fonts without them.

Usage:
    python3 build.py                 # writes index.html
    python3 build.py --fragment OUT  # also writes a body-only fragment (no <html>/<head>/<body>)
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "src"

LIB_BANNER = (
    "/* astronomy-engine 2.1.19, Copyright (c) 2019-2023 Don Cross, MIT License. "
    "https://github.com/cosinekitty/astronomy */\n"
)


def inline(html: str) -> str:
    def css(m):
        return "<style>\n" + (SRC / m.group(1)).read_text(encoding="utf-8") + "\n</style>"

    def js(m):
        path = m.group(1)
        code = (SRC / path).read_text(encoding="utf-8")
        if "vendor/astronomy" in path:
            code = LIB_BANNER + code
        # A literal "</script" inside the code would end the tag early.
        code = code.replace("</script", "<\\/script")
        return f"<script>\n/* {path} */\n{code}\n</script>"

    html = re.sub(r'<link rel="stylesheet" href="(?!https?:)([^"]+)">', css, html)
    html = re.sub(r'<script src="(?!https?:)([^"]+)"></script>', js, html)
    return html


def fragment(html: str) -> str:
    """Strip the document wrapper for hosts that supply their own."""
    for pat in (r"<!doctype html>\s*", r"<html[^>]*>\s*", r"</html>\s*", r"<head>\s*", r"</head>\s*",
                r"<body>\s*", r"</body>\s*", r'<meta [^>]*>\s*'):
        html = re.sub(pat, "", html, flags=re.I)
    return html


def main():
    html = inline((SRC / "index.html").read_text(encoding="utf-8"))
    out = ROOT / "index.html"
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({len(html.encode()) // 1024} KB)")
    if "--fragment" in sys.argv:
        dest = Path(sys.argv[sys.argv.index("--fragment") + 1])
        dest.write_text(fragment(html), encoding="utf-8")
        print(f"wrote {dest}")


if __name__ == "__main__":
    main()
