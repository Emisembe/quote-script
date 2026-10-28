#!/usr/bin/env python3
"""Add the shop layer to a blogger-theme-builder project (one that started from its starter).

    python3 <this skill>/scripts/add_shop_layer.py path/to/project

Edits src/skin.css, src/theme.xml, scripts/build.py and adds src/shop.js:
  * shop <Variable>s + shop.css (+ hidden-settings rules) in the skin
  * shopCard on list pages, shopItem on post pages, both includables in Blog1
  * cart button in the header, hidden "Shop settings" section, @@SHOP_JS@@ script
Run it once; it refuses to run twice. If the project's markup no longer matches the
starter (an anchor below is missing), it stops and names the anchor: add that piece by hand
from assets/shop/theme-snippets.xml instead.
Afterwards: python3 scripts/build.py && python3 scripts/check.py && check_shop.py theme.xml
"""
import pathlib
import re
import sys

KIT = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'shop'
project = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '.').resolve()
src = project / 'src'


def need(cond, msg):
    if not cond:
        sys.exit('add_shop_layer: ' + msg)


need((src / 'theme.xml').exists(), f'{src / "theme.xml"} not found (run from a blogger-theme-builder project)')
theme = (src / 'theme.xml').read_text(encoding='utf-8')
need('@@SHOP_JS@@' not in theme, 'shop layer already added')

snip = (KIT / 'theme-snippets.xml').read_text(encoding='utf-8')
includables = (KIT / 'blog-includables.xml').read_text(encoding='utf-8')
includables = includables[includables.index('<b:includable'):]

# ---- skin
skin = (src / 'skin.css').read_text(encoding='utf-8')
need('Variable definitions' in skin, 'skin.css has no "Variable definitions" comment')
end = skin.index('*/', skin.index('Variable definitions'))
variables = '\n'.join(re.findall(r'<Variable name="shop[^\n]*/>', snip))
skin = skin[:end] + variables + '\n' + skin[end:]
skin += ('\n/* ---- shop (blogger-ecommerce-builder) ---- */\n' + (KIT / 'shop.css').read_text(encoding='utf-8') +
         '\n.shop-admin { display: none; }\nbody#layout .shop-admin { display: block; }\n')

# ---- theme.xml
edits = [
    ('list pages use rmCard',
     re.compile(r"(<div class=')post-grid('>\s*<b:loop values='data:posts' var='post'>\s*<b:include data='post' name=')rmCard('/>)"),
     r"\1post-grid shop-grid\2shopCard\3"),
    ('item pages use rmSingle',
     re.compile(r"(<b:if cond='data:blog.pageType == &quot;item&quot;'>\s*<b:loop values='data:posts' var='post'>\s*<b:include data='post' name=')rmSingle('/>)"),
     r"\1shopItem\2"),
    ("Blog1 has an includable named rmCard",
     re.compile(r"(\n\s*)(<b:includable id='rmCard' var='post'>)"),
     lambda m: m.group(1) + includables.strip() + m.group(1) + m.group(2)),
    ("header has <div class='container header-inner'>",
     re.compile(r"(<div class='container header-inner'>\n)"),
     lambda m: m.group(1) + re.search(r"<a aria-label='Cart'.*?</a>", snip, re.S).group(0) + '\n'),
    ('theme script holds @@THEME_JS@@',
     re.compile(r"(<script type='text/javascript'>\s*//<!\[CDATA\[\s*@@THEME_JS@@\s*//\]\]>\s*</script>\n)"),
     lambda m: (re.search(r"<div class='shop-admin'>.*?\n</div>", snip, re.S).group(0) + '\n' + m.group(1) +
                "<script type='text/javascript'>\n//<![CDATA[\n@@SHOP_JS@@\n//]]>\n</script>\n")),
]
for name, pattern, repl in edits:
    theme, n = pattern.subn(repl, theme, count=1)
    need(n == 1, f'anchor not found: {name}')

# ---- build.py
build_path = project / 'scripts' / 'build.py'
build = build_path.read_text(encoding='utf-8')
old_part = "        '@@THEME_JS@@': read('theme.js').rstrip('\\n'),"
old_cdata = "if marker in ('@@SKIN_CSS@@', '@@THEME_JS@@')"
need(old_part in build and old_cdata in build, 'scripts/build.py is not the blogger-theme-builder version')
build = build.replace(old_part, old_part + "\n        '@@SHOP_JS@@': read('shop.js').rstrip('\\n'),")
build = build.replace(old_cdata, "if marker in ('@@SKIN_CSS@@', '@@THEME_JS@@', '@@SHOP_JS@@')")

(src / 'skin.css').write_text(skin, encoding='utf-8')
(src / 'theme.xml').write_text(theme, encoding='utf-8')
(src / 'shop.js').write_text((KIT / 'shop.js').read_text(encoding='utf-8'), encoding='utf-8')
build_path.write_text(build, encoding='utf-8')
print('shop layer added: src/skin.css, src/theme.xml, src/shop.js, scripts/build.py')
print('next: python3 scripts/build.py && python3 scripts/check.py && '
      f'python3 {pathlib.Path(__file__).resolve().parent / "check_shop.py"} theme.xml')
