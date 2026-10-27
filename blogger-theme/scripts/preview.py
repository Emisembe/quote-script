#!/usr/bin/env python3
"""Render static preview pages from theme-eficc.xml for browser testing.

    python3 scripts/preview.py   # writes preview/home.html and preview/post.html

Blogger's template engine only runs on Blogger, so this approximates it:
gadget sections are swapped for sample markup shaped like Blogger's output,
top-level <b:if> blocks are resolved for the page type, and the theme's own
CSS and scripts are kept. Good for checking layout, colour and the menu; the
real test is still the live blog.
"""
import html
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
THEME = (ROOT / 'theme-eficc.xml').read_text(encoding='utf-8')
OUT = ROOT / 'preview'


def card_image(n):
    hues = ['#2B3753', '#3A4A6B', '#1E2C4A', '#4A5568', '#2F3E5C', '#22304D']
    svg = (f"<svg xmlns='http://www.w3.org/2000/svg' width='720' height='405'>"
           f"<rect width='720' height='405' fill='{hues[n % 6]}'/>"
           f"<circle cx='{520 - n * 40}' cy='{120 + n * 20}' r='160' fill='#E7B165' opacity='0.18'/>"
           f"<rect x='60' y='{230 - n * 10}' width='300' height='22' fill='#FFFFFF' opacity='0.12'/></svg>")
    return 'data:image/svg+xml,' + svg.replace('#', '%23').replace("'", '%27').replace('<', '%3C').replace('>', '%3E')


LOGO_SVG = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='64'%3E"
            "%3Crect x='2' y='2' width='60' height='60' fill='none' stroke='%23E7B165' stroke-width='3'/%3E"
            "%3Ctext x='32' y='42' font-family='Arial' font-weight='900' font-size='26' fill='%23E7B165' text-anchor='middle'%3EE%3C/text%3E"
            "%3Ctext x='76' y='42' font-family='Arial' font-weight='900' font-size='26' fill='white'%3EEFIC%3C/text%3E%3C/svg%3E")
SLIDE_SVG = ('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%271600%27 height=%27900%27%3E'
             '%3Crect width=%271600%27 height=%27900%27 fill=%27%232B3753%27/%3E%3Ccircle cx=%271180%27 cy=%27300%27 r=%27380%27 fill=%27%23E7B165%27 opacity=%270.22%27/%3E'
             '%3Crect x=%27120%27 y=%27180%27 width=%27520%27 height=%2730%27 fill=%27white%27 opacity=%270.15%27/%3E%3C/svg%3E')
MENU = ['Quality Management', '_ISO Compliance', '_Certification', 'Logistics', '_Supplier Audits',
        '_Risk Management', '_Supply Chain Optimization', '_Trade Facilitation', 'Business Process Optimization',
        '_Project Management', '_Process Mapping', 'contact', 'Our Services', '_Client Interest Form', 'News']
POSTS = ['ISO 9001 Readiness: A Practical Checklist for Kenyan SMEs', 'Sourcing German Industrial Equipment Without the Risk',
         'Process Mapping That Actually Gets Used', 'Supplier Audits: What Good Looks Like',
         'Trade Facilitation and the East African Community', 'Building a Risk Register Your Board Will Read']


def social(names):
    return "<div class='widget LinkList'><div class='widget-content'><ul id='social'>" + ''.join(
        f"<li><a class='{n}' href='{u}' title='{n}'></a></li>" for n, u in names) + '</ul></div></div>'


def sections(page):
    posts = ''.join(
        f"<div class='post-grid-item'><div class='post-outer'><div class='post'><div class='block-image'>"
        f"<a class='thumb' href='post.html'><img alt='' src='{card_image(i)}'/></a>"
        f"<font class='retitle'><span class='post-retitle'><h2 class='post-title entry-title'>"
        f"<a href='post.html'>{html.escape(t)}</a></h2></span></font></div></div></div></div>"
        for i, t in enumerate(POSTS))
    single = ("<div class='post-grid-item'><div class='post-outer'><div class='post'><div class='post-header'>"
              "<div class='post-head'><h1 class='post-title entry-title'>ISO 9001 Readiness: A Practical Checklist for Kenyan SMEs</h1></div>"
              "<div class='post-meta'><span class='post-timestamp'><i class='fa fa-calendar-o'></i> <a href='#'>12 March 2026</a></span>"
              "<span class='label-head'><i class='fa fa-folder-open-o'></i> <a href='#'>Quality</a></span></div></div>"
              "<article><div class='post-body entry-content'>"
              "<p>Most small and medium businesses don&#8217;t fail certification because their products are poor. They fail because nobody wrote down how the work is actually done. This checklist walks through what an auditor will ask for, in the order they usually ask for it.</p>"
              "<h2>1. Define the scope</h2><p>Start with the sites, products and processes the certificate will cover. Keep it narrow for the first audit; you can <a href='#'>extend the scope later</a>.</p>"
              "<ul><li>List every site and what happens there</li><li>Name an owner for each core process</li><li>Note any outsourced work</li></ul>"
              "<blockquote>An auditor wants evidence, not intentions. If it isn&#8217;t recorded, it didn&#8217;t happen.</blockquote>"
              "<h2>2. Map the processes</h2><p>A one-page process map per activity beats a 60-page manual. Inputs, outputs, owner, and how you measure it.</p>"
              "</div></article><div class='post-footer'><div class='share-box'><h8 class='share-title'>Share This:</h8><div class='share-art'>"
              "<a class='fac-art' href='#'><i class='fa fa-facebook'></i><span class='resp_del'> Facebook</span></a>"
              "<a class='twi-art' href='#'><i class='fa fa-twitter'></i><span class='resp_del2'> Twitter</span></a>"
              "<a class='lin-art' href='#'><i class='fa fa-linkedin-square'></i><span class='resp_del5'> Linkedin</span></a>"
              "<a class='wat-art' href='#'><i class='fa fa-whatsapp'></i><span class='resp_del5'> WhatsApp</span></a>"
              "<a class='tel-art' href='#'><i class='fa fa-telegram'></i><span class='resp_del5'> Telegram</span></a>"
              "<a class='prt-art' href='#print' onclick='window.print(); return false;'><i class='fa fa-print'></i><span class='resp_del5'> Print</span></a>"
              "</div></div><div style='clear:both'></div></div></div>"
              "<div class='comments' id='comments'><h4>2 comments:</h4></div></div></div>")
    labels = ''.join(f"<span class='label-size'><a href='#'>{t}</a><span class='label-count'>{n}</span></span>"
                     for t, n in [('Quality', 6), ('Logistics', 4), ('Compliance', 3), ('Risk', 2)])
    return {
        'LinkList210': "<div class='widget LinkList' style='display:block'><div class='widget-content'><ul>"
                "<li><a href='home.html'>Home</a></li>" + ''.join(f"<li><a href='#'>{m}</a></li>" for m in MENU) + '</ul></div></div>',
        'Header1': "<div class='widget Header'><div id='header-inner'><div class='titlewrapper'><h1 class='title'>"
                  + ('Efic Consultancy Ltd' if page == 'home' else "<a href='home.html'>Efic Consultancy Ltd</a>")
                  + '</h1></div></div></div>',
        'HTML3': "<div class='widget HTML'><div class='widget-content'><p>Driving Efficacy and Effective Solutions.</p></div></div>",
        'LinkList230': social([('facebook', '#'), ('twitter', '#'), ('instagram', '#'),
                                        ('linkedin', 'https://www.linkedin.com/company/efic-consultancy-ltd/')]),
        'Blog1': "<div class='widget Blog'><div class='blog-posts hfeed'><div class='post-grid'>"
                + (posts if page == 'home' else single) + "</div></div>"
                + ("<div class='blog-pager' id='blog-pager'><span id='blog-pager-older-link'><a class='blog-pager-older-link' href='#'>Older Posts</a></span></div>" if page == 'home' else '')
                + '</div>',
        'Label1': "<div class='widget Label'><h2>Tags</h2><div class='widget-content cloud-label-widget-content'>" + labels + "</div></div>",
        'PopularPosts1': "<div class='widget PopularPosts'><h2>Popular</h2><div class='widget-content popular-posts'><ul>"
                         + ''.join(f"<li><div class='item-title'><a href='#'>{t}</a></div></li>" for t in POSTS[1:4]) + '</ul></div></div>',
        'ContactForm1': "<div class='widget ContactForm'><div class='contact-form-widget'><div class='form'><form name='contact-form'>"
                          "<p></p><span class='name-bg'>Your Name</span><br/><input class='contact-form-name' id='ContactForm1_contact-form-name' type='text'/>"
                          "<p></p><span class='email-bg'>Your Email*</span><br/><input class='contact-form-email' id='ContactForm1_contact-form-email' type='text'/>"
                          "<p></p><span class='message-bg'>Your Message*</span><br/><textarea class='contact-form-email-message' id='ContactForm1_contact-form-email-message' rows='5'></textarea>"
                          "<p></p><span class='send-bg'><input class='contact-form-button contact-form-button-submit' type='button' value='Send'/></span>"
                          "<span class='clear-bg'><input class='contact-form-button contact-form-button-submit clear-button' type='reset' value='Clear'/></span>"
                          '</form></div></div></div>',
        'LinkList250': social([('facebook', '#'), ('LinkedIn', 'https://www.linkedin.com/company/efic-consultancy-ltd/'),
                                        ('youtube', 'https://youtube.com/'), ('WhatsApp', 'https://wa.me/'),
                                        ('Telegram', 'https://t.me/'), ('TikTok', 'https://tiktok.com/'), ('X', 'https://x.com/'),
                                        ('Email', 'mailto:askeficc@gmail.com'), ('Mastodon', 'https://mastodon.social/')]),
        'HTML8': "<div class='widget HTML'><div class='widget-content'><a href='home.html'><img alt='Efic Consultancy Ltd' src=\"" + LOGO_SVG + "\"/></a></div></div>",
        'HTML7': "<div class='widget HTML'><div class='widget-content'><a href='home.html'><img alt='Efic Consultancy Ltd' src=\"" + LOGO_SVG + "\"/></a></div></div>",
    }


def resolve_ifs(src, page):
    """Resolve top-level <b:if> blocks for a page type ('home' or 'item')."""
    out, stack, pos = [], [], 0
    token = re.compile(r"<b:if cond='([^']*)'>|<b:else/>|</b:if>")
    for m in token.finditer(src):
        if all(s[1] for s in stack):
            out.append(src[pos:m.start()])
        pos = m.end()
        if m.group(0).startswith('<b:if'):
            cond = html.unescape(m.group(1))
            if 'homepageUrl' in cond:
                val = page == 'home'
            elif 'pageType !=' in cond:
                val = page == 'home' and False   # index-only infinite scroll & smooth scroll: skip in preview
            elif 'pageType in' in cond:
                kind = {'item': '"item"', 'static': '"static_page"'}.get(page, '"index"')
                val = kind in cond
            elif 'pageType ==' in cond:
                kind = {'item': '"item"', 'static': '"static_page"'}.get(page, '"index"')
                val = kind in cond
            else:
                val = True
            stack.append([val, val])
        elif m.group(0) == '<b:else/>':
            stack[-1][1] = not stack[-1][0]
        else:
            stack.pop()
    if all(s[1] for s in stack):
        out.append(src[pos:])
    return ''.join(out)


def render(page):
    head = THEME.split('<head>', 1)[1].split('</head>', 1)[0]
    skin = re.search(r'<b:skin><!\[CDATA\[(.*?)\]\]></b:skin>', head, re.S).group(1).replace('$maincolor', '#E7B165')
    head_styles = ''.join(re.findall(r'<style>.*?</style>', resolve_ifs(head.split(']]></b:template-skin>')[1], page), re.S))
    head_styles += ''.join(re.findall(r'<style>.*?</style>', head.split('<b:template-skin>')[0].split(']]></b:skin>')[1], re.S))
    if page == 'layout':
        head_styles += '<style>' + re.search(r'<b:template-skin><!\[CDATA\[(.*?)\]\]></b:template-skin>', head, re.S).group(1) + '</style>'
        head_scripts = []
    links = ''.join(re.findall(r"<link [^>]*/>", head))
    head_scripts = re.findall(r"<script src='[^']*jquery[^']*' type='text/javascript'/>", head)

    body = THEME.split('<body', 1)[1].split('>', 1)[1].split('</body>', 1)[0]
    sample = sections({'layout': 'home', 'static': 'item'}.get(page, page))

    def widget_html(wid, title, wtype, wsrc):
        if page == 'layout':
            return (f"<div class='widget {wtype} draggable-widget' id='{wid}'><div class='widget-wrap1'><div class='widget-wrap2'>"
                    f"<div class='widget-wrap3'><div class='widget-content'><div class='layout-title'>{html.escape(title or wtype)}</div>"
                    f"<a class='editlink' href='#'>Edit</a></div></div></div></div></div>")
        if wid in sample:
            return sample[wid].replace("<div class='widget ", f"<div id='{wid}' class='widget ", 1)
        content = re.search(r"<b:widget-setting name='content'><!\[CDATA\[(.*?)\]\]>", wsrc, re.S)
        inner = content.group(1) if content else f"<p>{wtype} gadget</p>"
        heading = f"<h2 class='title'>{html.escape(title)}</h2>" if title else ''
        return f"<div id='{wid}' class='widget {wtype}'>{heading}<div class='widget-content'>{inner}</div></div>"

    def section_html(m):
        attrs, inner = m.group(1), m.group(2)
        cls = re.search(r"class='([^']*)'", attrs).group(1)
        sid = re.search(r"id='([^']*)'", attrs).group(1)
        name = re.search(r"name='([^']*)'", attrs)
        widgets = re.findall(r"(<b:widget id='([^']+)'[^>]*?title='([^']*)'[^>]*?type='([^']+)'.*?</b:widget>)", inner, re.S)
        out = ''.join(widget_html(wid, html.unescape(t), wt, src) for src, wid, t, wt in widgets)
        if sid == 'slideshow' and page != 'layout':
            # Preview only: slides added the way an owner would (Image, HTML and Text gadgets).
            out += ("<div class='widget Image' id='Image1'><h2>ISO 9001 Readiness Workshops</h2><div class='widget-content'>"
                    "<a href='#section-2'><img id='Image1_img' alt='Workshop' width='1600' height='900' src=\"" + SLIDE_SVG + "\"/></a>"
                    "<br/><span class='caption'>Practical certification support for growing businesses</span></div></div>"
                    "<div class='widget HTML' id='HTML10'><h2 class='title'>EFIC in 90 seconds</h2><div class='widget-content'>"
                    "https://www.youtube.com/watch?v=2bjBiOVQrUs</div></div>"
                    "<div class='widget Text' id='Text2'><h2 class='title'>Now serving Mombasa</h2><div class='widget-content'>"
                    "Our new branch opens on 1 November (sample slide)</div></div>")
        if sid == 'office-contacts' and page != 'layout':
            # Preview only: a branch added the way an owner would, as a Text gadget.
            out += ("<div class='widget Text' id='Text1'><h2 class='title'>Mombasa Branch (sample)</h2>"
                    "<div class='widget-content'>Moi Avenue, Mombasa, Kenya<br>mombasa@example.com<br>"
                    "Tel: +254 700 000 000<br>Mon-Fri 8:00-17:00</div></div>")
        if page == 'layout':
            out = f"<h4>{html.escape(html.unescape(name.group(1)) if name else sid)}</h4>" + out + "<div class='add_widget'><a href='#'>Add a Gadget</a></div>"
        return f"<div class='section {cls}' id='{sid}' data-section-name='{html.escape(name.group(1) if name else sid)}'>{out}</div>"

    body = re.sub(r"<b:section ([^>]*)>(.*?)</b:section>", section_html, body, flags=re.S)
    body = resolve_ifs(body, 'home' if page == 'layout' else page)
    cls = {'home': 'index home', 'layout': 'index home', 'item': 'item', 'static': 'static_page item'}[page]
    body = re.sub(r'&lt;div id=&quot;outer-wrapper&quot; class=&quot;.*?&quot;&gt;', f'<div id="outer-wrapper" class="{cls}">', body, count=1)
    body = body.replace('&lt;/div&gt;', '</div>')
    body = re.sub(r"<(iframe|textarea|span|div|ul|li|h1|a|i|p)(\s[^<>]*?)?/>", lambda m: f'<{m.group(1)}{m.group(2) or ""}></{m.group(1)}>', body)
    # Scripts that need Blogger's servers (feeds, quote.js) are left out of the preview.
    body = re.sub(r"<script[^>]*>(?:(?!</script>).)*(?:loadScript)(?:(?!</script>).)*</script>", '', body, flags=re.S)
    body = re.sub(r'(<script[^>]*>)((?:(?!</script>).)*)(</script>)',
                  lambda m: m.group(0) if 'CDATA' in m.group(2) else m.group(1) + html.unescape(m.group(2)) + m.group(3),
                  body, flags=re.S)
    if page in ('item', 'static'):
        body = body.replace("<div id='related-posts'>", "<div id='related-posts' style='display:none'>")
    if page == 'layout':
        body = re.sub(r'<script.*?</script>', '', body, flags=re.S)

    return (f"<!DOCTYPE html>\n<html><head><meta charset='utf-8'/>"
            f"<meta content='width=device-width, initial-scale=1' name='viewport'/>"
            f"<title>EFIC preview ({page})</title>{links}"
            f"{''.join(s.replace('/>', '></script>') for s in head_scripts)}"
            f"<style>{skin}</style>{head_styles}</head>"
            f"<body class='{ {'item': 'item', 'static': 'static_page'}.get(page, 'index') }'{' id=\"layout\"' if page == 'layout' else ''}>{body}</body></html>")


OUT.mkdir(exist_ok=True)
for page in ('home', 'item', 'static', 'layout'):
    name = {'home': 'home.html', 'item': 'post.html', 'static': 'page.html', 'layout': 'layout.html'}[page]
    (OUT / name).write_text(render(page), encoding='utf-8')
    print(f'wrote preview/{name}')
