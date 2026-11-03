#!/usr/bin/env python3
"""Render theme.xml into static preview pages, the way Blogger would (roughly).

    python3 scripts/render_preview.py      writes preview/home.html, post.html, label.html, 404.html

This is a small interpreter for the subset of Blogger's template language the
theme uses (b:section, b:widget, b:includable, b:include, b:if/b:else, b:loop,
data: tags, expr: attributes). Widget data comes from the gadget settings in
theme.xml plus sample posts, so the preview uses the real markup, CSS and JS.
It is a testing aid only: Blogger itself remains the final judge.

Adapt per project: HOME, POSTS/BODY (sample stories), the logo in the Header
branch and the logo-sized Image ids. It overwrites hand-written preview pages.

Remote images are replaced by local placeholders (the sandbox can't reach
Blogger's image servers); Font Awesome is served from preview/vendor if present.
"""
import html
import pathlib
import re
import sys

from lxml import etree

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = ROOT / 'theme.xml'
OUT = ROOT / 'preview'
NS = {'b': 'http://www.google.com/2005/gml/b', 'data': 'http://www.google.com/2005/gml/data',
      'expr': 'http://www.google.com/2005/gml/expr', 'h': 'http://www.w3.org/1999/xhtml'}
B, DATA, EXPR, H = ('{%s}' % NS[k] for k in ('b', 'data', 'expr', 'h'))
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'}
RAW = {'content', 'body', 'caption', 'adCode', 'postSummary'}  # data tags holding HTML
HOME = 'https://www.murdockemisembefoundation.org/'

sys.path.insert(0, str(ROOT / 'scripts'))
from build import preview_css  # noqa: E402


# ---------------------------------------------------------------- placeholder images
PALETTE = [('#145474', '#87BA45'), ('#0B3349', '#3E8EB5'), ('#4A7A1C', '#145474'), ('#7A5C3E', '#F6EEE3'),
           ('#1F6F8B', '#99C46A'), ('#0F2533', '#C9924A'), ('#2C7A7B', '#E6D5B8'), ('#3D5A80', '#98C1D9')]


def placeholder(n, label, w=1600, h=1000):
    a, b = PALETTE[n % len(PALETTE)]
    name = f'ph-{n}.svg'
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}' viewBox='0 0 {w} {h}'>"
           f"<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='{a}'/>"
           f"<stop offset='1' stop-color='{b}'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/>"
           f"<circle cx='{w*0.78}' cy='{h*0.3}' r='{h*0.32}' fill='#fff' opacity='.08'/>"
           f"<circle cx='{w*0.2}' cy='{h*0.85}' r='{h*0.25}' fill='#000' opacity='.06'/>"
           f"<text x='50%' y='92%' text-anchor='middle' font-family='Arial' font-size='{max(14, h//22)}' "
           f"fill='#fff' opacity='.6'>{html.escape(label)}</text></svg>")
    (OUT / 'img').mkdir(parents=True, exist_ok=True)
    (OUT / 'img' / name).write_text(svg, encoding='utf-8')
    return 'img/' + name


# ---------------------------------------------------------------- values used in conditions
class V:
    """A Blogger value: compares "true"/"false" strings with booleans like Blogger does."""
    def __init__(self, v):
        self.v = v.v if isinstance(v, V) else v

    def _norm(self, o):
        o = o.v if isinstance(o, V) else o
        a = self.v
        if isinstance(a, bool) and isinstance(o, str):
            return str(a).lower(), o
        if isinstance(o, bool) and isinstance(a, str):
            return a, str(o).lower()
        if isinstance(a, (int, float)) and isinstance(o, str) and o.isdigit():
            return a, int(o)
        if a is None:
            a = ''
        return a, o

    def __eq__(self, o):
        a, b = self._norm(o)
        return a == b

    def __ne__(self, o):
        return not self.__eq__(o)

    def __bool__(self):
        if isinstance(self.v, str):
            return self.v not in ('', 'false')
        return bool(self.v)


class Ctx:
    def __init__(self, blog, widget=None, scope=None):
        self.blog, self.widget, self.scope = blog, widget or {}, scope or {}

    def child(self, **kw):
        s = dict(self.scope)
        s.update(kw)
        return Ctx(self.blog, self.widget, s)

    def get(self, path):
        parts = path.split('.')
        head = parts[0]
        if head in self.scope:
            val = self.scope[head]
        elif head == 'blog':
            val = self.blog
        elif head in self.widget:
            val = self.widget[head]
        else:
            return None
        for p in parts[1:]:
            val = val.get(p) if isinstance(val, dict) else None
        return val


def cond_eval(cond, ctx):
    expr = re.sub(r'data:([\w.]+)', lambda m: f'D({m.group(1)!r})', cond)
    expr = re.sub(r'!(?!=)', ' not ', expr)
    try:
        return bool(eval(expr, {'D': lambda p: V(ctx.get(p))}))
    except Exception as e:  # noqa: BLE001
        raise SystemExit(f'render_preview: cannot evaluate cond {cond!r}: {e}')


def expr_eval(text, ctx):
    expr = re.sub(r'data:([\w.]+)', lambda m: f'S({m.group(1)!r})', text)

    def s(p):
        v = ctx.get(p)
        return '' if v is None else (str(v).lower() if isinstance(v, bool) else str(v))
    try:
        return str(eval(expr, {'S': s}))
    except Exception as e:  # noqa: BLE001
        raise SystemExit(f'render_preview: cannot evaluate expr {text!r}: {e}')


# ---------------------------------------------------------------- renderer
class Renderer:
    def __init__(self, tree, blog, widget_data):
        self.tree, self.blog, self.widget_data = tree, blog, widget_data

    def attrs(self, el, ctx):
        out = []
        for k, v in el.attrib.items():
            if k.startswith(EXPR):
                out.append((k[len(EXPR):], expr_eval(v, ctx)))
            elif k.startswith('{'):
                continue
            else:
                out.append((k, v))
        return ''.join(f' {k}="{html.escape(v, quote=True)}"' for k, v in out)

    def text(self, t, parent_tag):
        if not t:
            return ''
        return t if parent_tag in ('script', 'style') else html.escape(t, quote=False)

    def children(self, el, ctx, tag=''):
        out = [self.text(el.text, tag)]
        for c in el:
            out.append(self.node(c, ctx))
            out.append(self.text(c.tail, tag))
        return ''.join(out)

    def branch(self, el, ctx, take_true):
        out, in_true = [], True
        if take_true:
            out.append(self.text(el.text, ''))
        for c in el:
            if c.tag == B + 'else':
                in_true = False
                if not take_true:
                    out.append(self.text(c.tail, ''))
                continue
            if in_true == take_true:
                out.append(self.node(c, ctx))
                out.append(self.text(c.tail, ''))
        return ''.join(out)

    def node(self, el, ctx):
        if not isinstance(el.tag, str):
            return ''  # comments
        tag = el.tag
        if tag.startswith(B):
            return self.blogger(el, tag[len(B):], ctx)
        if tag.startswith(DATA):
            name = tag[len(DATA):]
            val = ctx.get(name)
            if val is None:
                return ''
            if isinstance(val, bool):
                val = str(val).lower()
            return str(val) if name.split('.')[-1] in RAW else html.escape(str(val), quote=False)
        local = etree.QName(el).localname
        if local == 'template-skin':
            return ''
        a = self.attrs(el, ctx)
        if local in VOID:
            return f'<{local}{a}>'
        return f'<{local}{a}>{self.children(el, ctx, local)}</{local}>'

    def blogger(self, el, kind, ctx):
        if kind == 'if':
            return self.branch(el, ctx, cond_eval(el.get('cond'), ctx))
        if kind == 'loop':
            items = ctx.get(el.get('values').replace('data:', '')) or []
            out = []
            for i, item in enumerate(items):
                kw = {el.get('var'): item}
                if el.get('index'):
                    kw[el.get('index')] = i
                out.append(self.children(el, ctx.child(**kw)))
            return ''.join(out)
        if kind == 'section':
            cls = (el.get('class', '') + ' section').strip()
            return f"<div class=\"{cls}\" id=\"{el.get('id')}\">{''.join(self.node(c, ctx) for c in el)}</div>"
        if kind == 'widget':
            wid, wtype = el.get('id'), el.get('type')
            data = self.widget_data(el)
            wctx = Ctx(self.blog, data)
            data['top'] = data
            main = el.find(B + "includable[@id='main']")
            body = self.children(main, wctx.child(**({main.get('var'): data} if main.get('var') else {})))
            return f'<div class="widget {wtype}" data-version="1" id="{wid}">{body}</div>'
        if kind == 'include':
            name = el.get('name')
            if name == 'all-head-content':
                return '<meta charset="utf-8">'
            widget = next((a for a in el.iterancestors() if a.tag == B + 'widget'), None)
            inc = widget.find(B + f"includable[@id='{name}']") if widget is not None else None
            if inc is None:
                return ''  # built-in (quickedit etc.)
            local = ctx
            if el.get('data') and inc.get('var'):
                local = ctx.child(**{inc.get('var'): ctx.get(el.get('data').replace('data:', ''))})
            return self.children(inc, local)
        if kind == 'skin':
            return '<style>' + preview_css(el.text or '') + '</style>'
        if kind in ('includable', 'widget-settings', 'else', 'template-skin'):
            return ''
        raise SystemExit(f'render_preview: unsupported tag b:{kind}')


# ---------------------------------------------------------------- sample content
POSTS = [
    ('Free legal clinic reaches 120 families in Kakamega', ['Legal Aid', 'Community']),
    ('Why good governance starts at the county level', ['Governance']),
    ('Know your rights: a plain guide to tenancy law', ['Legal Aid', 'Human Rights']),
    ('Students lead a clean-up drive along the river', ['Environment', 'Education']),
    ('Health and safety training for market traders', ['Health']),
    ('The Emisembe Report: episode highlights', ['Governance', 'Media']),
    ('A seventh story that should be hidden on the homepage', ['Community']),
]
BODY = ('<p>Our team spent the week in the community, listening first and then explaining, step by step, '
        'how people can protect their rights at work and at home. Many of the questions were about land, '
        'tenancy and family matters.</p><div class="separator" style="clear:both;text-align:center">'
        '<a href="#" style="margin-left:1em;margin-right:1em"><img src="{img}" width="640" height="400"></a></div>'
        '<h2>What we learned</h2><p>People want clear, practical advice. That is why every clinic now ends with a '
        'short session on where to go next.</p><ul><li>Bring any documents you have</li><li>Ask questions early</li>'
        '<li>Follow up with our team on WhatsApp</li></ul><blockquote>Justice should not depend on what you can afford.'
        '</blockquote><p>Thank you to every volunteer who made this possible.</p>')


def posts(n=7):
    out = []
    for i, (title, labels) in enumerate(POSTS[:n]):
        img = placeholder(60 + i, f'Story photo {i + 1}', 1280, 800)
        slug = re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-')
        out.append({
            'id': str(1000 + i), 'title': title, 'url': f'{HOME}2026/10/{slug}.html', 'body': BODY.format(img=img),
            'firstImageUrl': img if i != 3 else '', 'thumbnailUrl': '',
            'timestamp': '9:00 AM', 'timestampISO8601': f'2026-10-{28 - i:02d}T09:00:00+03:00',
            'author': 'Murdock Emisembe', 'authorProfileUrl': '#', 'labels': [{'name': l, 'isLast': j == len(labels) - 1} for j, l in enumerate(labels)],
            'numComments': 2, 'allowComments': True, 'forceIframeComments': False, 'commentSource': 0,
            'showThreadedComments': False, 'comments': [], 'embedCommentForm': False, 'addCommentUrl': '#',
            'addCommentOnclick': '', 'commentLabelFull': '2 comments', 'editUrl': '',
        })
    return out


def make_widget_data(page, all_posts):
    counter = {'n': 0}

    def data(el):
        wid, wtype = el.get('id'), el.get('type')
        s = {st.get('name'): (st.text or '') for st in el.iter(B + 'widget-setting')}
        d = {'title': el.get('title', ''), 'widget': {'instanceId': wid}}
        if wtype == 'HTML':
            d['content'] = s.get('content', '')
        elif wtype == 'Image':
            counter['n'] += 1
            w, h = int(s.get('displayWidth') or 1600), int(s.get('displayHeight') or 1000)
            if int(wid[5:]) in range(18, 24):  # partner logos
                w, h = 400, 200
            d.update(sourceUrl=placeholder(counter['n'], d['title'], w, h), width=w, height=h,
                     link=s.get('link', ''), caption=s.get('caption', ''))
        elif wtype == 'Header':
            logo = OUT / 'img' / 'logo.svg'
            logo.write_text("<svg xmlns='http://www.w3.org/2000/svg' width='330' height='80'><rect width='80' height='80' rx='16' fill='#145474'/>"
                            "<text x='40' y='52' text-anchor='middle' font-family='Georgia' font-size='30' font-weight='700' fill='#87BA45'>ME</text>"
                            "<text x='96' y='36' font-family='Georgia' font-size='22' font-weight='700' fill='#0F2533'>Murdock Emisembe</text>"
                            "<text x='96' y='62' font-family='Arial' font-size='15' letter-spacing='3' fill='#4A7A1C'>FOUNDATION</text></svg>")
            d.update(title='Murdock Emisembe Foundation', useImage=s.get('useImage') == 'true', sourceUrl='img/logo.svg',
                     imagePlacement=s.get('imagePlacement', 'REPLACE'), description='')
        elif wtype == 'LinkList':
            links, i = [], 0
            while f'text-{i}' in s:
                links.append({'name': s[f'text-{i}'], 'target': s.get(f'link-{i}', '')})
                i += 1
            d['links'] = links
        elif wtype == 'Blog':
            shown = all_posts if page['pageType'] != 'item' else all_posts[:1]
            if page['pageType'] == 'error_page':
                shown = []
            d.update(posts=shown, numPosts=len(shown), olderPageUrl='#older' if page['pageType'] == 'index' else '#older-post',
                     newerPageUrl='#newer' if page['pageType'] == 'item' else '', newerPageTitle='A newer story about our work',
                     olderPageTitle='An older story from the archive', postCommentMsg='Post a Comment', mobile=False)
        elif wtype == 'PopularPosts':
            d.update(showThumbnails=True, showSnippets=False,
                     posts=[{'href': p['url'], 'title': p['title'], 'thumbnail': p['firstImageUrl'], 'snippet': ''} for p in all_posts[:3]])
        elif wtype == 'FeaturedPost':
            p = all_posts[1]
            d.update(showFirstImage=True, showPostTitle=True, showSnippet=True, postUrl=p['url'], postTitle=p['title'],
                     postFirstImage=p['firstImageUrl'], postSummary='Accountable institutions make the difference between promises and results.')
        elif wtype == 'Translate':
            d.update(pageLanguage='en', layout='VERTICAL')
        elif wtype == 'AdSense':
            d['adCode'] = ''
        return d
    return data


PAGES = {
    'home': {'pageType': 'index', 'url': HOME, 'canonicalUrl': HOME, 'pageName': '', 'pageTitle': 'Murdock Emisembe Foundation'},
    'label': {'pageType': 'index', 'url': HOME + 'search/label/Legal%20Aid', 'canonicalUrl': HOME + 'search/label/Legal%20Aid',
              'pageName': 'Legal Aid', 'pageTitle': 'Murdock Emisembe Foundation: Legal Aid'},
    'search': {'pageType': 'index', 'url': HOME + 'search', 'canonicalUrl': HOME + 'search', 'pageName': '', 'pageTitle': 'Murdock Emisembe Foundation'},
    'post': {'pageType': 'item', 'url': HOME + '2026/10/free-legal-clinic.html', 'canonicalUrl': HOME + '2026/10/free-legal-clinic.html',
             'pageName': POSTS[0][0], 'pageTitle': 'Murdock Emisembe Foundation: ' + POSTS[0][0]},
    '404': {'pageType': 'error_page', 'url': HOME + 'nope', 'canonicalUrl': HOME + 'nope', 'pageName': '', 'pageTitle': 'Murdock Emisembe Foundation'},
}

# Blogger's own widget stylesheet, loaded after the skin, to prove the skin's resets win
BLOGGER_WIDGET_CSS = '<style>.widget{margin:30px 0;_margin:0 0 10px}.widget ul{padding:0 0 0 1.25em;margin:0;line-height:1.2}.widget li{padding:.25em 0;margin:0}.section{margin:0 15px}</style>'


def main():
    OUT.mkdir(exist_ok=True)
    parser = etree.XMLParser(strip_cdata=False, resolve_entities=False)
    tree = etree.fromstring(THEME.read_bytes(), parser)
    all_posts = posts()
    for name, page in PAGES.items():
        blog = dict(page, homepageUrl=HOME, title='Murdock Emisembe Foundation', languageDirection='ltr',
                    metaDescription='', postImageUrl='')
        r = Renderer(tree, blog, make_widget_data(page, all_posts))
        out = '<!DOCTYPE html>\n' + r.node(tree, Ctx(blog))
        out = out.replace('</head>', BLOGGER_WIDGET_CSS + '</head>', 1)
        fa = OUT / 'vendor' / 'font-awesome' / 'css' / 'font-awesome.min.css'
        if fa.exists():
            out = out.replace('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css',
                              'vendor/font-awesome/css/font-awesome.min.css')
        # Third-party widgets that can't load offline
        out = re.sub(r'<script src="//translate\.google\.com[^"]*"></script>', '', out)
        out = re.sub(r'<iframe[^>]*(youtube|maps\.google)[^>]*></iframe>',
                     '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font:600 15px Inter,Arial">Embedded video / map</div>', out)
        (OUT / f'{name}.html').write_text(out, encoding='utf-8')
        print(f'wrote preview/{name}.html')


if __name__ == '__main__':
    main()
