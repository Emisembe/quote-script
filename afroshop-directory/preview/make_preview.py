#!/usr/bin/env python3
"""Generate static preview pages that mirror what theme.xml renders on Blogger.

    python3 scripts/build.py && python3 preview/make_preview.py

Writes preview/home.html, city.html, shop.html, event.html. Gadget content is read from
src/theme.xml, so the previews stay in sync. Shops and events are DEMO data (fictional).
The script's feed requests are answered by window.DIR_DEMO_FEED instead of Blogger.
"""
import html
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parent
XML = (ROOT / 'src' / 'theme.xml').read_text(encoding='utf-8')
BUILT = (ROOT / 'theme.xml').read_text(encoding='utf-8')   # language gadgets are filled in by the build


def gadget(wid, xml=None):
    m = re.search(r"<b:widget id='%s'[^>]*title='([^']*)'.*?<!\[CDATA\[(.*?)\]\]>" % wid, xml or XML, re.S)
    return html.unescape(m.group(1)), m.group(2)


# ------------------------------------------------------------------ demo data (fictional)
SHOPS = [
    dict(slug='mama-ada', title="Mama Ada's African Food", labels=['Shop', 'Food', 'Berlin', 'Featured'],
         city='Berlin', address='Musterstraße 12, 10115 Berlin', lat=52.531, lng=13.384,
         phone='+49 30 1234567', whatsapp='+49 151 1234567', hours='Mo-Fr 10:00-20:00; Sa 09:00-18:00',
         sells='gari, egusi, palm oil, stockfish, yam flour, plantain, ogbono, crayfish, maggi, indomie',
         origin='Nigeria, Ghana, Cameroon', services='delivery in Berlin, pre-orders',
         text='Family-run shop with West African groceries since 2009. Fresh plantain and yam every Thursday.'),
    dict(slug='accra-corner', title='Accra Corner Market', labels=['Shop', 'Food', 'Hamburg', 'Featured'],
         city='Hamburg', address='Beispielweg 4, 20095 Hamburg', lat=53.551, lng=10.0,
         phone='+49 40 7654321', whatsapp='+49 160 7654321', hours='Mo-Sa 10:00-19:00',
         sells='kenkey, shito, gari, palm nut soup base, cocoyam, tilapia, banku mix',
         origin='Ghana, Togo', services='', text='Ghanaian groceries, frozen fish and fresh vegetables.'),
    dict(slug='sahel-beauty', title='Sahel Beauty & Hair', labels=['Shop', 'Hair & Beauty', 'München', 'Featured'],
         city='München', address='Probeplatz 8, 80331 München', lat=48.137, lng=11.575,
         phone='+49 89 5550101', whatsapp='+49 170 5550101', hours='Di-Sa 10:00-19:00',
         sells='braiding hair, shea butter, black soap, wigs, edge control, hair extensions',
         origin='Senegal, Mali, Nigeria', services='braiding by appointment',
         text='Hair, skin care and braiding. Book your braids on WhatsApp.'),
    dict(slug='lagos-taste', title='Lagos Taste Afroshop', labels=['Shop', 'Food', 'Frankfurt', 'Hessen'],
         city='Frankfurt am Main', state='Hessen', address='Testgasse 21, 60311 Frankfurt am Main', lat=50.111, lng=8.682,
         phone='+49 69 9876543', whatsapp='+49 152 9876543', hours='Mo-Sa 09:00-21:00',
         sells='egusi, ogbono, semovita, poundo yam, suya spice, zobo leaves, palm oil, malt drinks',
         origin='Nigeria', services='money transfer', text='Nigerian groceries, drinks and spices in the city centre.'),
    dict(slug='kente-co', title='Kente & Co. Fashion', labels=['Shop', 'Fashion', 'Köln'],
         city='Köln', address='Musterring 3, 50667 Köln', lat=50.938, lng=6.96,
         phone='+49 221 4445566', whatsapp='', hours='Mo-Fr 11:00-19:00; Sa 11:00-16:00',
         sells='kente, ankara fabric, wax print, tailoring, dashiki, headwraps',
         origin='Ghana, Côte d’Ivoire', services='tailoring', text='African fabrics and made-to-measure clothes.'),
    dict(slug='yaas-kitchen', title="Yaa's Kitchen", labels=['Shop', 'Restaurant', 'Düsseldorf'],
         city='Düsseldorf', address='Beispielallee 40, 40213 Düsseldorf', lat=51.225, lng=6.776,
         phone='+49 211 3332211', whatsapp='+49 176 3332211', hours='Di-So 12:00-22:00',
         sells='jollof rice, waakye, fufu, light soup, kelewele, suya',
         origin='Ghana', services='catering, takeaway', text='Ghanaian home cooking. Catering for weddings and parties.'),
    dict(slug='frankfurt-cargo', title='Bantu Cargo & Money Transfer', labels=['Shop', 'Services', 'Frankfurt'],
         city='Frankfurt am Main', address='Probestraße 77, 60329 Frankfurt am Main', lat=50.107, lng=8.664,
         phone='+49 69 1112223', whatsapp='+49 157 1112223', hours='Mo-Fr 09:00-18:00; Sa 10:00-14:00',
         sells='shipping to Africa, barrels, money transfer, phone credit',
         origin='Cameroon, Nigeria, Kenya', services='weekly sea freight', text='Ship barrels and boxes to West and East Africa.'),
    dict(slug='douala-market', title='Douala Market', labels=['Shop', 'Food', 'Frankfurt'],
         city='Frankfurt am Main', address='Musterplatz 2, 60313 Frankfurt am Main', lat=50.116, lng=8.69,
         phone='+49 69 4440000', whatsapp='+49 151 4440000', hours='Mo-Sa 10:00-20:00',
         sells='ndolé leaves, cassava sticks, egusi, plantain, njangsang, smoked fish',
         origin='Cameroon', services='', text='Cameroonian specialities and fresh plantain.'),
    dict(slug='kilimanjaro', title='Kilimanjaro Spices', labels=['Shop', 'Food', 'Leipzig'],
         city='Leipzig', address='Testweg 9, 04109 Leipzig', lat=51.34, lng=12.374,
         phone='+49 341 2223344', whatsapp='', hours='Mo-Fr 10:00-19:00',
         sells='berbere, teff, injera, pilau masala, chai, ugali flour',
         origin='Ethiopia, Kenya, Tanzania', services='', text='East African spices, teff and fresh injera on Fridays.'),
]
EVENTS = [
    dict(slug='social-media-seminar', title='Seminar: Instagram & WhatsApp marketing for Afroshops',
         labels=['Events', 'Seminar'], date='2027-01-23', time='14:00-17:00', place='Bürgerhaus (demo venue)',
         city='Frankfurt am Main', price='29 € · members 19 €', register='https://example.com/register',
         text='Learn to post offers that bring customers into your shop.'),
    dict(slug='import-rules', title='Workshop: food import rules and German labels',
         labels=['Events', 'Seminar'], date='2027-02-13', time='10:00-13:00', place='Community centre (demo)',
         city='Köln', price='35 €', register='https://example.com/register',
         text='Customs, labelling and food safety checks explained in plain language.'),
    dict(slug='market-day', title='African Market Day', labels=['Events', 'Community'], date='2027-03-06',
         time='11:00-18:00', place='Town square (demo)', city='Berlin', price='Free entry', register='',
         text='Stalls from 30 shops, food, music and a kids corner.'),
]


def prod_img(name, bg, fg='#FBF6EE'):
    # simple demo picture (a coloured pack with the product name), as a data: URI
    import urllib.parse
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#FBF6EE"/>'
           '<rect x="120" y="40" width="160" height="220" rx="18" fill="%s"/><rect x="120" y="150" width="160" height="16" fill="#E9A23B"/>'
           '<text x="200" y="120" font-family="Arial" font-size="22" font-weight="700" fill="%s" text-anchor="middle">%s</text></svg>') % (bg, fg, html.escape(name))
    return 'data:image/svg+xml;charset=utf-8,' + urllib.parse.quote(svg)


PRODUCTS = [
    dict(slug='gari-ijebu', title='Gari Ijebu, 1 kg', price='3.49', old='3.99', unit='1 kg', shop='Lagos Taste Afroshop', page='lagos-taste.html', wa='+49 152 9876543', city='Frankfurt', until='2027-12-31', img=('Gari', '#0E4D3A'), cat='Food'),
    dict(slug='palm-oil', title='Red palm oil, 1 l', price='5.49', old='6.49', unit='1 l', shop='Lagos Taste Afroshop', page='lagos-taste.html', wa='+49 152 9876543', city='Frankfurt', until='', img=('Palm oil', '#C4552D'), cat='Food'),
    dict(slug='egusi', title='Ground egusi, 500 g', price='4.50', old='', unit='500 g', shop='Douala Market', page='douala-market.html', wa='+49 151 4440000', city='Frankfurt', until='', img=('Egusi', '#8E3B1F'), cat='Food'),
    dict(slug='plantain', title='Fresh plantain, per kg', price='2.99', old='3.49', unit='1 kg', shop='Douala Market', page='douala-market.html', wa='+49 151 4440000', city='Frankfurt', until='2027-12-31', img=('Plantain', '#E9A23B', '#1F2420'), cat='Food'),
    dict(slug='stockfish', title='Stockfish pieces, 250 g', price='8.90', old='', unit='250 g', shop="Mama Ada's African Food", page='mama-ada.html', wa='+49 151 1234567', city='Berlin', until='', img=('Stockfish', '#1D5C7A'), cat='Food'),
    dict(slug='shea-butter', title='Raw shea butter, 200 g', price='6.50', old='7.90', unit='200 g', shop='Sahel Beauty & Hair', page='sahel-beauty.html', wa='+49 170 5550101', city='München', until='', img=('Shea', '#3B2A1A', '#E9A23B'), cat='Hair & Beauty'),
    dict(slug='braiding-hair', title='Braiding hair, 3 packs', price='9.99', old='', unit='3 packs', shop='Sahel Beauty & Hair', page='sahel-beauty.html', wa='+49 170 5550101', city='München', until='', img=('Braids', '#17644D'), cat='Hair & Beauty', stock='no'),
    dict(slug='malt-6', title='Malt drink, 6 × 0,33 l', price='6.99', old='7.99', unit='6 x 0,33 l', shop='Lagos Taste Afroshop', page='lagos-taste.html', wa='+49 152 9876543', city='Frankfurt', until='', img=('Malt', '#0B3B2D'), cat='Food'),
]
OWN = dict(slug='seminar-ticket', title='Seminar ticket: More customers with your phone', price='29', old='', unit='1 seat, 23 Jan 2027, Frankfurt', pay='https://www.paypal.com/paypalme/example/29', seller='AfroKauf Verbund', img=('Seminar', '#0E4D3A'), cat='Events')
MAGAZINE = [
    dict(slug='egusi-soup', title='Egusi soup in 45 minutes: a simple family recipe', img=('Recipe', '#C4552D'), text='Melon seeds, palm oil and spinach: the classic West African soup, step by step, with ingredients from your local Afroshop.'),
    dict(slug='shop-story', title='Shop story: 15 years of Lagos Taste in Frankfurt', img=('Story', '#0E4D3A'), text='How a small corner shop near the station became the meeting point for Nigerian families in Frankfurt.'),
    dict(slug='braids-care', title='How to care for braids in German winter', img=('Hair tips', '#17644D'), text='Dry heating air is hard on hair. Five tips from braiders, and the products that help.'),
    dict(slug='jollof', title='Jollof rice for 10 people: the party guide', img=('Jollof', '#E9A23B', '#1F2420'), text='Quantities, timing and the smoky bottom everybody wants. Plus where to find long-grain parboiled rice.'),
]


def product_block(p, own=False):
    a = dict(price=p['price'], unit=p['unit'])
    if p.get('old'): a['old-price'] = p['old']
    if own:
        a.update({'pay-link': p['pay'], 'seller': p['seller']})
    else:
        a.update({'shop': p['shop'], 'shop-page': p['page'], 'whatsapp': p['wa'], 'city': p['city']})
        if p.get('until'): a['until'] = p['until']
        if p.get('stock'): a['stock'] = p['stock']
    attrs = ' '.join('data-%s="%s"' % (k, html.escape(v)) for k, v in a.items())
    img = '<img src="%s" alt="%s">' % (prod_img(*p['img']), html.escape(p['title']))
    return '<div class="product-info" %s>%s € · %s</div>\n%s\n<p>Demo product for the preview.</p>' % (attrs, p['price'], html.escape(p['unit']), img)


def post_block(m):
    return '<img src="%s" alt="">\n<p>%s</p>' % (prod_img(*m['img']), html.escape(m['text']))


def shop_block(s):
    attrs = ' '.join('data-%s="%s"' % (k, html.escape(str(s[k]))) for k in
                     ['city', 'state', 'address', 'lat', 'lng', 'phone', 'whatsapp', 'hours', 'sells', 'origin', 'services'] if s.get(k, '') != '')
    fallback = '%s · %s · Tel. %s · %s' % (s['address'], s['hours'], s['phone'], s['sells'])
    return '<div class="shop-info" %s>%s</div>\n<p>%s</p>' % (attrs, html.escape(fallback), html.escape(s['text']))


def event_block(e):
    attrs = ' '.join('data-%s="%s"' % (k, html.escape(e[k])) for k in ['date', 'time', 'place', 'city', 'price', 'register'] if e[k])
    fallback = '%s, %s · %s, %s · %s' % (e['date'], e['time'], e['place'], e['city'], e['price'])
    return '<div class="event-info" %s>%s</div>\n<p>%s</p>' % (attrs, html.escape(fallback), html.escape(e['text']))


_IDS = {}


def post_id(slug):
    return _IDS.setdefault(slug, str(7000000000000000000 + len(_IDS) + 1))


def entry_json(item, body):
    return {
        'id': {'$t': 'tag:blogger.com,1999:blog-1.post-' + post_id(item['slug'])},
        'title': {'$t': item['title']},
        'link': [{'rel': 'alternate', 'href': item['slug'] + '.html'}],
        'category': [{'term': l} for l in item['labels']],
        'content': {'$t': body},
        'published': {'$t': '2026-11-01T10:00:00+01:00'},
    }


for _p in PRODUCTS:
    _p['labels'] = ['Product', _p['cat'], _p['city']]
OWN['labels'] = ['Product', 'Events']
for _m in MAGAZINE:
    _m['labels'] = ['Magazine']
FEED = ([entry_json(s, shop_block(s)) for s in SHOPS] + [entry_json(e, event_block(e)) for e in EVENTS] +
        [entry_json(p, product_block(p)) for p in PRODUCTS] + [entry_json(OWN, product_block(OWN, True))] +
        [entry_json(m, post_block(m)) for m in MAGAZINE])

# ------------------------------------------------------------------ page parts
ICON_MENU = '<svg aria-hidden="true" class="icon-menu" fill="none" height="26" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="26"><line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/></svg><svg aria-hidden="true" class="icon-close" fill="none" height="26" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="26"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>'


def finder():
    m = re.search(r"(<section aria-label='Find a shop'.*?</section>\s*<section aria-live='polite'.*?</section>)", XML, re.S)
    return m.group(1)


def html_widget(wid, cls='widget-content'):
    title, content = gadget(wid)
    h = '<h2 class="title">%s</h2>' % html.escape(title) if title else ''
    return '<div class="widget HTML" id="%s">%s<div class="%s">%s</div></div>' % (wid, h, cls, content)


def announce():
    _, c = gadget('HTML13')
    return '<div class="widget HTML" id="HTML13"><div class="announce"><div class="container announce-inner">%s</div></div></div>' % c


def header():
    return '''<header class="site-header" id="site-header"><div class="container header-inner">
<div class="brand-section section" id="header"><div class="widget Header" id="Header1"><a class="brand" href="home.html"><span aria-hidden="true" class="brand-mark brand-mark-svg"><svg aria-hidden='true' viewBox='0 0 76.0 70.5' width='40' height='37'><g transform='translate(0.000 0.000) scale(1.00000) translate(-12.0 -19.5)'><path d='M23 46 V40 A17 17 0 0 1 57 40 V46' fill='none' stroke='#E9A23B' stroke-width='7.5' stroke-linecap='round'/><path d='M43 46 V40 A17 17 0 0 1 77 40 V46' fill='none' stroke='#FBF6EE' stroke-width='7.5' stroke-linecap='round'/><defs><clipPath id='bagclip1'><path d='M23 40 L77 40 Q84 40 84.6 47 L87.4 83 Q88 90 81 90 L19 90 Q12 90 12.6 83 L15.4 47 Q16 40 23 40 Z'/></clipPath></defs><path d='M23 40 L77 40 Q84 40 84.6 47 L87.4 83 Q88 90 81 90 L19 90 Q12 90 12.6 83 L15.4 47 Q16 40 23 40 Z' fill='#FBF6EE'/><g clip-path='url(#bagclip1)'><rect x='10' y='59' width='9.5' height='12' fill='#E9A23B'/><rect x='19' y='59' width='9.5' height='12' fill='#0E4D3A'/><rect x='29' y='59' width='9.5' height='12' fill='#C4552D'/><rect x='38' y='59' width='9.5' height='12' fill='#E9A23B'/><rect x='48' y='59' width='9.5' height='12' fill='#0E4D3A'/><rect x='57' y='59' width='9.5' height='12' fill='#C4552D'/><rect x='67' y='59' width='9.5' height='12' fill='#E9A23B'/><rect x='76' y='59' width='9.5' height='12' fill='#0E4D3A'/><rect x='86' y='59' width='9.5' height='12' fill='#C4552D'/></g></g></svg></span><span class="brand-text"><span class="brand-name">AfroKauf</span><span class="brand-tagline">Afroshops in deiner Nähe</span></span></a></div></div>
<button aria-controls="site-nav" aria-expanded="false" aria-label="Open menu" class="nav-toggle" id="nav-toggle" type="button">%s</button>
<nav aria-label="Main" class="nav-drawer" id="site-nav"><div class="site-nav section" id="menu">%s</div><div class="header-cta section" id="header-cta">%s</div></nav>
</div></header>''' % (ICON_MENU, html_widget('HTML1'), html_widget('HTML2'))


def block_tiles(wid, cls, js):
    title, content = gadget(wid)
    return '<div class="widget HTML" id="%s"><div class="block %s"><div class="container"><h2 class="block-title">%s</h2><div class="widget-content %s">%s</div></div></div></div>' % (
        wid, cls, html.escape(title), js, content)


def slides_block():
    _, content = gadget('HTML17')
    return ('<div class="widget HTML" id="HTML17"><div class="block block-slides"><div class="container">'
            '<div class="widget-content slideshow js-slides" role="region" aria-roledescription="carousel" aria-label="Highlights">%s</div></div></div></div>') % content


def block_feed(wid, kind, mx, more, extra=''):
    title, content = gadget(wid)
    return ('<div class="widget HTML" id="%s"><div class="block block-feed %s" data-feed="%s" data-max="%d"><div class="container">'
            '<div class="block-head"><h2 class="block-title">%s</h2><a class="btn btn-link js-feed-more" href="#">%s</a></div>'
            '<div class="block-intro">%s</div><div class="card-grid js-feed-list"></div></div></div></div>') % (
        wid, extra, kind, mx, html.escape(title), more, content)


def block_owners():
    title, content = gadget('HTML8')
    return '<div class="widget HTML" id="HTML8"><div class="block block-owners"><div class="container"><h2 class="block-title">%s</h2><div class="widget-content">%s</div></div></div></div>' % (html.escape(title), content)


def settings():
    _, s = gadget('HTML90')
    s = s.replace('crm_endpoint: ', 'crm_endpoint: https://script.google.com/macros/s/PREVIEW/exec')
    # the preview switches on every language, including the drafts, so they can be checked
    s = s.replace('languages: en, de, fr', 'languages: en, de, fr, sw, am, ti')
    _, w = gadget('HTML91')
    packs = ''.join('<div class="widget HTML" id="HTML%s"><div class="dir-lang">%s</div></div>' % (n, gadget('HTML' + n, BUILT)[1]) for n in ('92', '93', '94', '95', '96'))
    return '<div class="dir-admin"><div class="section"><div class="widget HTML" id="HTML90"><div class="dir-settings">%s</div></div><div class="widget HTML" id="HTML91"><div class="dir-words">%s</div></div>%s</div></div>' % (s, w, packs)


def footer():
    return '''<footer class="site-footer"><div class="container">
<div class="footer-news section" id="footer-news">%s</div><div class="footer-grid">
<div class="footer-col section">%s</div><div class="footer-col section">%s</div><div class="footer-col section">%s</div><div class="footer-col section">%s</div></div>
<div class="footer-bottom"><p class="copyright">&#169; <span class="js-year"></span> AfroKauf</p></div></div></footer>''' % (
        html_widget('HTML25'), html_widget('HTML9'), html_widget('HTML10'), html_widget('HTML16'), html_widget('HTML11'))


def card(item, body):
    labels = ''.join('<span class="dcard-label" data-label="%s">%s</span>' % (html.escape(l), html.escape(l)) for l in item['labels'])
    media = '<img alt="" src="%s">' % prod_img(*item['img']) if item.get('img') else '<span class="dcard-ph"></span>'
    return (('''<article class="dcard" data-id="''' + post_id(item['slug']) + '''" data-url="%s.html"><a aria-hidden="true" class="dcard-media" href="%s.html" tabindex="-1">@@MEDIA@@</a>
<div class="dcard-body"><p class="dcard-kicker">%s</p><h3 class="dcard-title"><a href="%s.html">%s</a></h3><p class="dcard-meta"><time class="js-date" datetime="2026-11-01T10:00:00+01:00">11/1/2026</time></p><div class="dcard-extra"></div></div>
<template class="dcard-src">@@BODY@@</template></article>''') % (item['slug'], item['slug'], labels, item['slug'], html.escape(item['title']))).replace('@@MEDIA@@', media).replace('@@BODY@@', body)


def page(name, body_class, main, home=False, path=''):
    home_style = '<style>.home-only { display: block; } .finder-band { margin-top: -64px; padding-top: 0; }</style>' if home else ''
    doc = '''<!DOCTYPE html>
<!-- Generated by preview/make_preview.py: mirrors theme.xml markup with DEMO (fictional) shops. -->
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Preview: %s</title><link href="../dist/theme.css" rel="stylesheet">%s
<script>window.DIR_DEMO_FEED_DATA = %s;
window.DIR_DEMO_FEED = function (label, max, start) {
  var all = window.DIR_DEMO_FEED_DATA.filter(function (e) { return !label || e.category.some(function (c) { return c.term === label; }); });
  return all.slice(start - 1, start - 1 + max);
};</script>
%s</head><body class="dir %s">
<a class="skip-link" href="#content">Skip to content</a>
<div class="announce-section section">%s</div>
%s
<main id="content">
%s
%s
</main>
%s
<script src="../dist/theme.js"></script><script src="../dist/directory.js"></script>
</body></html>''' % (name, home_style, json.dumps(FEED), '', body_class, announce(), header(), main, settings(), footer())
    (HERE / (name + '.html')).write_text(doc, encoding='utf-8')


def hero():
    title, content = gadget('HTML3')
    return '''<section class="hero home-only"><div class="container"><div class="hero-main section"><div class="widget HTML" id="HTML3"><div class="hero-copy"><p class="hero-eyebrow">%s</p><h1 class="hero-title">AfroKauf</h1><div class="hero-text">%s</div></div></div></div></div></section>''' % (html.escape(title), content)


def home():
    top = '<div class="home-only home-blocks"><div class="home-section section">%s</div></div>' % ''.join([
        slides_block(), html_widget('HTML18'), html_widget('HTML19'), block_tiles('HTML14', 'block-howto', ''), block_tiles('HTML4', 'block-categories', 'js-categories'),
        html_widget('HTML20'), html_widget('HTML26'), block_feed('HTML5', 'featured', 6, 'See all'), html_widget('HTML21'),
        block_tiles('HTML6', 'block-cities', 'js-cities'), block_tiles('HTML12', 'block-states', 'js-states')])
    newest = SHOPS[3:9]
    lst = '<div class="page-main"><div class="container"><div class="main section"><div class="widget Blog" id="Blog1"><div class="block-head list-head"><h2 class="block-title">Newest listings</h2></div><div class="card-grid">%s</div><nav aria-label="Pages" class="pager"><a class="btn btn-primary older" href="#">More &#8594;</a></nav></div></div></div></div>' % ''.join(card(s, shop_block(s)) for s in newest)
    bottom = '<div class="home-only home-blocks"><div class="home-section section">%s</div></div>' % ''.join([
        html_widget('HTML22'), html_widget('HTML23'), block_feed('HTML7', 'events', 4, 'All events', 'block-events'), block_owners(),
        html_widget('HTML24'), block_tiles('HTML15', 'block-partners', '')])
    page('home', 'pt-index', hero() + finder() + top + lst + bottom, home=True)


def hidden_home_blocks():
    # On other pages Blogger still renders the homepage sections (hidden by CSS)
    return '<div class="home-only home-blocks"><div class="home-section section">%s%s%s</div></div>' % (
        block_tiles('HTML4', 'block-categories', 'js-categories'), block_tiles('HTML6', 'block-cities', 'js-cities'), block_tiles('HTML12', 'block-states', 'js-states'))


def city():
    shops = [s for s in SHOPS if 'Frankfurt' in s['labels']]
    lst = '<div class="page-main"><div class="container"><div class="main section"><div class="widget Blog" id="Blog1"><div class="block-head list-head"><h1 class="block-title js-list-title">Frankfurt</h1></div><div class="card-grid">%s</div></div></div></div></div>' % ''.join(card(s, shop_block(s)) for s in shops)
    page('city', 'pt-index', finder() + hidden_home_blocks() + lst)


def entry(item, body):
    labels = ''.join('<a class="badge" data-label="%s" href="#">%s</a>' % (html.escape(l), html.escape(l)) for l in item['labels'])
    return '''<div class="page-main"><div class="container"><div class="main section"><div class="widget Blog" id="Blog1">
<article class="entry post" data-id="''' + post_id(item['slug']) + '''" data-url="%s.html"><header class="entry-head"><div class="entry-labels">%s</div><h1 class="entry-title">%s</h1>
<p class="entry-meta"><span class="entry-updated">Listed <time class="js-date" datetime="2026-11-01T10:00:00+01:00">11/1/2026</time></span></p></header>
<div class="entry-panel"></div><div class="entry-body post-body">%s</div><div class="entry-more"></div>
<div class="entry-share"><span class="entry-share-label">Share</span><a href="#">WhatsApp</a><a href="#">Facebook</a><a href="#">LinkedIn</a><button data-copy-url="#" type="button">Copy link</button></div>
<div class="entry-reviews"><h4>Reviews</h4><p>Blogger comments appear here as reviews.</p></div>
</article></div></div></div></div>''' % (item['slug'], labels, html.escape(item['title']), body)


def shop():
    s = SHOPS[3]
    page('shop', 'pt-item', finder() + hidden_home_blocks() + entry(s, shop_block(s) + '<h2>About us</h2><p>Open since 2015 in the heart of Frankfurt. Fresh palm oil, egusi and stockfish every week, plus a big choice of Nigerian drinks.</p>'))


def event():
    e = EVENTS[0]
    page('event', 'pt-item', finder() + hidden_home_blocks() + entry(e, event_block(e) + '<h2>What you will learn</h2><ul><li>Taking product photos with your phone</li><li>Posting weekly offers on WhatsApp Status and Instagram</li><li>Getting Google reviews</li></ul>'))


def shop_list():
    lst = ('<div class="page-main"><div class="container"><div class="main section"><div class="widget Blog" id="Blog1"><div class="block-head list-head">'
           '<h1 class="block-title js-list-title">Product</h1></div><div class="card-grid">%s</div></div></div></div></div>') % ''.join(
        card(p, product_block(p, p is OWN)) for p in PRODUCTS + [OWN])
    page('products', 'pt-index', finder() + hidden_home_blocks() + lst, path='/search/label/Product')


def product():
    p = PRODUCTS[0]
    page('product', 'pt-item', finder() + hidden_home_blocks() + entry(p, product_block(p) + '<h2>About this product</h2><p>Coarse, sour gari from Ijebu: for eba or to soak with cold water, sugar and groundnuts.</p>'))
    page('product-own', 'pt-item', finder() + hidden_home_blocks() + entry(OWN, product_block(OWN, True) + '<h2>What you get</h2><p>A seat at the Saturday seminar, coffee and the slides by email.</p>'))


home()
city()
shop()
event()
shop_list()
product()
print('wrote preview/home.html, city.html, shop.html, event.html, products.html, product.html, product-own.html')
