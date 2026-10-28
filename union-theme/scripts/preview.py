#!/usr/bin/env python3
"""Write static preview pages that mirror the markup Blogger renders from src/theme.xml.

    python3 scripts/preview.py        writes preview/<profile>-home.html and preview/<profile>-post.html

Gadget titles and contents come from profiles/, so the preview shows the real
content of each profile. Posts, labels and feeds are sample data: open the pages
through scripts/browser_test.py, which serves /feeds/ with sample JSON. Run
scripts/build.py first (the pages use dist/<palette>.css and dist/theme.js).
"""
import html
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROFILES = ROOT / 'profiles'
OUT = ROOT / 'preview'

# Blogger's own widget stylesheet, loaded after the skin, to prove the resets win
# ...plus rules from Blogger's newer injected bundle that once collided with this theme's class names
BLOGGER_BUNDLE_V2_CSS = ('.share-buttons{background-color:#fff;border-radius:2px;box-shadow:0 2px 2px 0 rgba(0,0,0,.14),'
                         '0 3px 1px -2px rgba(0,0,0,.2),0 1px 5px 0 rgba(0,0,0,.12);color:#000;list-style:none;margin:0;'
                         'padding:8px 0;position:absolute;top:-11px;min-width:200px;z-index:101}.hidden{display:none}'
                         '.share-button{width:20px;height:20px;overflow:hidden;position:relative}')
BLOGGER_WIDGET_CSS = ('.widget{margin:30px 0;_margin:0 0 10px}.widget ul{padding:0 0 0 1.25em;margin:0;line-height:1.2}'
                      '.widget li{padding:.25em 0;margin:0}.section{margin:0 15px}')

SAMPLE_POSTS = [
    ('Union signs new collective bargaining agreement', 'Campaigns', '2026-10-20T09:00:00Z', True),
    ('Know your rights: overtime and leave explained', 'Publications', '2026-10-14T09:00:00Z', True),
    ('Annual delegates conference: resolutions adopted', 'Events', '2026-10-02T09:00:00Z', False),
    ('Statement on the new minimum wage order', 'News', '2026-09-28T09:00:00Z', True),
]
LABELS = ['Campaigns', 'Decent Work', 'Events', 'Minimum Wage', 'News', 'Publications', 'Regions', 'Training', 'Writer: Jane Wanjiku']
# Writer credit lines as editors would type them: separate paragraphs + a photo on the next line (KPUWU),
# or <br>-separated lines with bold inside one block (generic)
WRITER_LINES = {
    'kpuwu': """<p>Written by: Jane Wanjiku | Shop steward, KCA University branch</p>
<p>Author photo:</p>
<div class='separator' style='clear: both; text-align: center;'><a href='#'><img class='stress-author-photo' src='https://blogger.googleusercontent.com/img/b/sample/s200/jane-photo.jpg'/></a></div>
<p>About the author: Jane has represented support staff at KCA University since 2019 and chairs the branch women's committee.</p>""",
    'generic': """<div>Written by: <b>Peter Otieno</b>, Branch Secretary<br/>About the author: Peter leads the North branch and writes about pensions.</div>""",
}


def esc(s):
    return html.escape(s, quote=True)


def load(name):
    folder = PROFILES / name
    profile = json.loads((folder / 'profile.json').read_text(encoding='utf-8'))
    content = {p.stem: p.read_text(encoding='utf-8').strip() for p in folder.glob('*.html')}
    return profile, content


class Page:
    def __init__(self, profile, content):
        self.p, self.c = profile, content

    def on(self, wid):
        return wid not in self.p.get('omit', [])

    def title(self, wid):
        return self.p['titles'].get(wid, '')

    def html_widget(self, wid, inner=None):
        """The standard HTML gadget includable (html-main.xml)."""
        if not self.on(wid):
            return ''
        t = self.title(wid)
        head = f"<h2 class='title'>{esc(t)}</h2>" if t else ''
        body = inner if inner is not None else f"<div class='widget-content'>{self.c[wid]}</div>"
        return f"<div class='widget HTML' data-version='1' id='{wid}'>{head}{body}</div>"

    def feed_widget(self, wid, kind, count):
        if not self.on(wid):
            return ''
        return (f"<div class='widget HTML' data-version='1' id='{wid}'><div class='feed-block' data-count='{count}' data-kind='{kind}'>"
                f"<div class='feed-head'><h2 class='title'>{esc(self.title(wid))}</h2><a class='feed-more' href='/search'>View all</a></div>"
                f"<div class='feed-label' hidden='hidden'>{self.c[wid]}</div>"
                f"<div class='feed-items'><p class='feed-status'>Loading&#8230;</p></div></div></div>")


def section(cls, sid, widgets):
    return f"<div class='{cls} section' id='{sid}'>{widgets}</div>"


def card(title, label, date, image, n):
    img = (f"<img class='js-resize' alt='{esc(title)}' src='https://blogger.googleusercontent.com/img/b/sample/s72-c/{"logo-kca.png" if n == 1 else f"post{n}.jpg"}' loading='lazy'/>"
           if image else "<span class='post-card-placeholder'>&#9633;</span>")
    return (f"<article class='post-card'><a aria-hidden='true' class='post-card-media' href='post.html' tabindex='-1'>{img}</a>"
            f"<div class='post-card-body'><div class='post-card-labels'>{"<a class='badge' href='/search/label/Writer%3A%20Jane%20Wanjiku'>Writer: Jane Wanjiku</a>" if n == 0 else ''}<a class='badge' href='/search/label/{label}'>{label}</a>"
            f"<a class='badge' href='/search/label/News'>News</a></div>"
            f"<h3 class='post-card-title'><a href='post.html'>{esc(title)}</a></h3>"
            f"<div class='post-card-meta'><time class='js-date' datetime='{date}'>9:00 AM</time>"
            f"<span class='post-card-comments'>2 comments</span></div></div></article>")


def label_widget(wid, title):
    items = ''.join(f"<li><a dir='ltr' href='/search/label/{l}'>{l}</a></li>" for l in LABELS)
    return (f"<div class='widget Label' data-version='1' id='{wid}'><h2>{title}</h2>"
            f"<div class='widget-content list-label-widget-content'><ul>{items}</ul></div></div>")


def popular():
    items = ''.join(
        f"<li><div class='item-content'><div class='item-thumbnail'><a href='post.html'>"
        f"<img alt='' border='0' height='72' width='72' src='https://blogger.googleusercontent.com/img/b/sample/s72-c/post{n}.jpg'/></a></div>"
        f"<div class='item-title'><a href='post.html'>{esc(t)}</a></div></div><div style='clear: both;'></div></li>"
        for n, (t, _, _, _) in enumerate(SAMPLE_POSTS))
    return (f"<div class='widget PopularPosts' data-version='1' id='PopularPosts1'><h2>Most read</h2>"
            f"<div class='widget-content popular-posts'><ul>{items}</ul></div></div>")


SHARE_BAR = """<div class='u-share' data-title='{title}' data-url='https://example.org/{slug}.html'><span class='u-share-label'>Share</span><div class='u-share-list'><a class='u-share-btn u-share-whatsapp' href='#'>WhatsApp</a><a class='u-share-btn u-share-facebook' href='#'>Facebook</a></div></div>
<p class='print-source'>Printed from {blog}: https://example.org/{slug}.html</p>"""


def render(name, kind):
    profile, content = load(name)
    pg = Page(profile, content)
    palette = 'red-navy'
    uses_logo = name == 'kpuwu'
    brand = ("<span class='brand-logo'><img alt='Kenya Private Universities Workers Union' "
             "src='https://blogger.googleusercontent.com/img/a/logo=s304'/></span>") if uses_logo else (
             "<span aria-hidden='true' class='brand-mark'></span><span class='brand-text'>"
             "<span class='brand-name'>Your Union Name</span><span class='brand-tagline'>Workers united</span></span>")
    blog_title = 'Kenya Private Universities Workers Union' if uses_logo else 'Your Union Name'
    home = kind == 'home'

    hero_main = (f"<div class='widget HTML' data-version='1' id='HTML12'><div class='hero-copy'>"
                 f"<p class='hero-eyebrow'>{esc(pg.title('HTML12'))}</p><h1 class='hero-title'>{blog_title}</h1>"
                 f"<div class='hero-text'>{content['HTML12']}</div></div></div>"
                 f"<div class='widget HTML' data-version='1' id='HTML26'><div class='widget-content hero-actions'>{content['HTML26']}</div></div>")
    hero_side = f"<div class='widget HTML' data-version='1' id='HTML7'><div class='hero-media'>{content['HTML7']}</div></div>"
    cta = (f"<div class='widget HTML' data-version='1' id='HTML29'><div class='cta-inner'><h2 class='cta-title'>{esc(pg.title('HTML29'))}</h2>"
           f"<div class='widget-content cta-body'>{content['HTML29']}</div></div></div>")

    share = SHARE_BAR
    # Test-only extra documents (preview, never in a profile): a Drive file and a Google Sheet
    docs = content['HTML35']
    if name == 'generic':
        docs = docs.replace('</ul>', "<li><a href='https://drive.google.com/file/d/1AbCdEfGh_ijk-LMN/view?usp=sharing' data-type='pdf'>Preview: Drive file</a> Shared from Google Drive</li>"
                            "<li><a href='https://docs.google.com/spreadsheets/d/1ZyXwV_uts-RQ/edit?usp=sharing'>Preview: Google Sheet</a> Exported as Excel</li></ul>")
    if kind in ('downloads', 'sitemap', 'branches'):
        heading = {'downloads': 'Downloads', 'sitemap': 'Sitemap', 'branches': 'About us'}[kind]
        holder = {'downloads': "<p>All our documents in one place.</p><div class='u-downloads'></div>",
                  'sitemap': "<div class='u-sitemap'></div>",
                  'branches': "<p>We are a democratic union run by and for our members. Find your nearest office below.</p><h2>Our branch offices</h2><div class='u-branches'></div>"}[kind]
        main = f"""<article class='post-single post'><a name='3'></a><header class='post-head'><h1 class='post-title entry-title'>{heading}</h1></header>
<div class='post-body entry-content' id='post-body-3'>{holder}</div>
""" + share.replace('{title}', heading).replace('{slug}', 'p/' + kind).replace('{blog}', blog_title) + "</article>"
    elif kind == 'page':
        main = f"""<article class='post-single post'><a name='2'></a><header class='post-head'><h1 class='post-title entry-title'>Who can join?</h1></header>
<div class='post-body entry-content' id='post-body-2'>
<p>Membership is open to every worker employed by a member institution, whether permanent, on contract or casual.</p>
<h2>How to join</h2>
<ol><li>Download and fill in the membership form.</li><li>Hand it to your shop steward or branch secretary.</li><li>Your subscription is deducted from your salary every month.</li></ol>
<p>Questions? <a href='https://example.org/p/faqs.html'>Read the FAQs</a>.</p>
</div>
""" + share.replace('{title}', 'Who can join?').replace('{slug}', 'p/who-can-join').replace('{blog}', blog_title) + "</article>"
    elif home:
        main = ("<div class='section-head'><h2 class='section-title'>Latest news</h2></div><div class='post-grid'>"
                + ''.join(card(t, l, d, i, n) for n, (t, l, d, i) in enumerate(SAMPLE_POSTS))
                + "</div><nav aria-label='Pages' class='blog-pager-nav'><a class='btn btn-primary older' href='#'>Older posts &#8594;</a></nav>")
    else:
        main = f"""<article class='post-single post'><a name='1'></a><header class='post-head'>
<nav aria-label='Breadcrumb' class='breadcrumb'><a href='home.html'>Home</a><a class='crumb-label' href='/search/label/Writer%3A%20Jane%20Wanjiku'>Writer: Jane Wanjiku</a><a class='crumb-label' href='/search/label/Campaigns'>Campaigns</a><a class='crumb-label' href='/search/label/News'>News</a></nav>
<h1 class='post-title entry-title'>{esc(SAMPLE_POSTS[0][0])}</h1>
<div class='post-meta'><a class='post-author' href='#'>{'Unknown' if name == 'kpuwu' else 'Secretariat'}</a><span aria-hidden='true' class='sep'></span><time class='published js-date' datetime='2026-10-20T09:00:00Z'>9:00 AM</time></div></header>
<div class='post-body entry-content' id='post-body-1'>
<div class='separator' style='clear: both; text-align: center;'><a href='#' style='margin-left: 1em; margin-right: 1em;'><img border='0' height='360' width='640' src='https://blogger.googleusercontent.com/img/b/sample/s640/post0.jpg'/></a></div>
<p>After months of negotiations, the union and the employers' association have signed a new collective bargaining agreement covering pay, allowances and working hours for the next two years.</p>
<h2>What changes for members</h2>
<ul><li>A general pay increase across all grades</li><li>Improved house and commuter allowances</li><li>Clear rules on overtime and leave</li></ul>
<blockquote>When we stand together, we win. This agreement belongs to every member who took part.</blockquote>
<p>Branch officials will hold meetings at every workplace to explain the agreement. Contact your shop steward with any questions.</p>
<h2><span style='font-size: 48px; color: green; font-family: Impact;'>A heading pasted with its own style</span></h2>
<p class='MsoNormal'><span class='stress-messy' style='font-family: "Times New Roman"; font-size: 8pt; color: blue; background: yellow;'>Pasted from Word in tiny blue Times.</span> <font class='stress-font' face='Comic Sans MS' size='7' color='#ff00ff'>Huge pink Comic Sans.</font> <b>Bold stays bold.</b></p>
<h3>Stress test: content that often breaks phone layouts</h3>
<p>Full text: https://www.example.org/documents/collective-bargaining-agreement-2026-2028-final-signed-version-with-annexes-and-schedules.pdf and Arbeitnehmerinteressenvertretungsorganisationsgesetzgebung.</p>
<iframe class='stress-video' width='640' height='360' src='https://www.youtube.com/embed/8ZJz4Cda9MY' allowfullscreen=''></iframe>
<p><img class='stress-wide' width='1600' height='500' src='https://blogger.googleusercontent.com/img/b/sample/s1600/wide.jpg'/></p>
<table align='center' cellpadding='0' cellspacing='0' class='tr-caption-container' style='margin-left: auto; margin-right: auto;'><tbody><tr><td style='text-align: center;'><a href='#' style='margin-left: auto; margin-right: auto;'><img border='0' width='640' height='427' src='https://blogger.googleusercontent.com/img/b/sample/s640/caption.jpg'/></a></td></tr><tr><td class='tr-caption' style='text-align: center;'>Members at the signing ceremony</td></tr></tbody></table>
<table class='stress-table'><tr><th>Grade</th><th>Basic pay</th><th>House allowance</th><th>Commuter allowance</th><th>Medical cover</th><th>Leave days</th><th>Overtime rate</th><th>Pension</th><th>Effective date</th></tr><tr><td>A</td><td>100</td><td>20</td><td>10</td><td>Yes</td><td>24</td><td>1.5x</td><td>10%</td><td>1 January 2027</td></tr></table>
<pre><code>Clause 14.2(b): overtime_rate = basic_hourly_rate * 1.5 for every hour beyond the normal working week of forty hours</code></pre>
<table><tr><th>Grade</th><th>Old</th><th>New</th></tr><tr><td>A</td><td>100</td><td>108</td></tr><tr><td>B</td><td>120</td><td>130</td></tr></table>
{WRITER_LINES[name]}
</div>
<div class='post-tags'><span class='post-tags-label'>Filed under</span><a class='badge badge-soft' href='/search/label/Writer%3A%20Jane%20Wanjiku'>Writer: Jane Wanjiku</a><a class='badge badge-soft' href='#'>Campaigns</a><a class='badge badge-soft' href='#'>News</a></div>
<div class='u-share' data-title='{esc(SAMPLE_POSTS[0][0])}' data-url='https://example.org/post.html'><span class='u-share-label'>Share</span><div class='u-share-list'><a class='u-share-btn u-share-whatsapp' href='#'>WhatsApp</a><a class='u-share-btn u-share-facebook' href='#'>Facebook</a></div></div>
<p class='print-source'>Printed from {blog_title}: https://example.org/post.html</p>
<aside class='join-box'><div class='join-box-text'><p class='join-box-title'>Not a member yet?</p><p>Workers are stronger together. Join the union and have a say in your pay, conditions and rights at work.</p></div><a class='btn btn-primary js-join-link' href='/search'>Join today</a></aside>
<div class='related' hidden='hidden'><h2 class='related-title'>Related articles</h2><div class='related-grid'></div></div>
<div class='comments' id='comments'><h4>2 comments:</h4><div class='comments-content'><div class='comment-thread'><ol>
<li class='comment'><div class='avatar-image-container'><img src='https://blogger.googleusercontent.com/img/b/sample/s35/avatar.jpg' alt=''/></div><div class='comment-block'><div class='comment-header'><cite class='user'>Jane W.</cite><span class='datetime'>21 October 2026</span></div><p class='comment-content'>Great news for all of us. Thank you to the negotiating team!</p><span class='comment-actions'><a href='#'>Reply</a></span></div></li>
</ol></div></div></div>
</article><nav aria-label='More posts' class='blog-pager-nav'><a class='btn btn-outline newer' href='#'>&#8592; Newer</a><a class='btn btn-outline older' href='#'>Older &#8594;</a></nav>"""

    sidebar = ''.join([
        pg.html_widget('HTML2'), popular(), pg.html_widget('HTML19'), label_widget('Label1', 'Topics'),
        pg.html_widget('HTML5'),
    ])
    home_style = "<style>.home-only { display: block; }</style>" if home else ''
    stats = pg.html_widget('HTML28')

    page = f"""<!DOCTYPE html>
<html lang='en'><head><meta charset='utf-8'/><meta content='width=device-width, initial-scale=1' name='viewport'/>
<title>{name} {kind} preview</title>
<link href='../dist/{palette}.css' rel='stylesheet'/>
<style>{BLOGGER_WIDGET_CSS}{BLOGGER_BUNDLE_V2_CSS}</style>
{home_style}
</head>
<body class='union pt-{'index' if home else ('item' if kind == 'post' else 'static_page')}'>
<a class='skip-link' href='#content'>Skip to content</a>
<div class='topbar'><div class='container topbar-inner'>
{section('topbar-social', 'topbar-social', pg.html_widget('HTML15'))}
{section('topbar-lang', 'topbar-lang', f"<div class='widget HTML' data-version='1' id='HTML33'><div class='lang-picker'><button aria-expanded='false' aria-haspopup='true' class='lang-toggle' type='button'>&#127760; <span class='lang-current'>Language</span></button><div class='widget-content lang-menu notranslate'>{content['HTML33']}</div></div></div>")}
<form action='/search' class='search-form topbar-search' method='get' role='search'><input aria-label='Search this site' name='q' placeholder='Search this site...' type='search'/><button aria-label='Search' type='submit'>&#9906;</button></form>
</div></div>
<header class='site-header' id='site-header'><div class='container header-inner'>
{section('brand-section', 'header', f"<div class='widget Header' data-version='1' id='Header1'><a class='brand' href='home.html'>{brand}</a></div>")}
<button aria-controls='site-nav' aria-expanded='false' aria-label='Open menu' class='nav-toggle' id='nav-toggle' type='button'>
<svg aria-hidden='true' class='icon-menu' fill='none' height='26' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24' width='26'><line x1='3' x2='21' y1='6' y2='6'/><line x1='3' x2='21' y1='12' y2='12'/><line x1='3' x2='21' y1='18' y2='18'/></svg>
<svg aria-hidden='true' class='icon-close' fill='none' height='26' stroke='currentColor' stroke-width='2' viewBox='0 0 24 24' width='26'><line x1='18' x2='6' y1='6' y2='18'/><line x1='6' x2='18' y1='6' y2='18'/></svg></button>
<nav aria-label='Main' class='nav-drawer' id='site-nav'>
{section('site-nav', 'menu', f"<div class='widget HTML' data-version='1' id='HTML16'><div class='widget-content'>{content['HTML16']}</div></div>")}
{section('header-cta', 'header-cta', f"<div class='widget HTML' data-version='1' id='HTML3'><div class='widget-content'>{content['HTML3']}</div></div>")}
</nav></div></header>
<main id='content'>
<div class='home-only ticker' id='ticker'><div class='container ticker-inner'><span class='ticker-label'>Latest</span><div class='ticker-track'><ul class='ticker-list'></ul></div></div></div>
<section class='home-only hero'><div class='container hero-grid'>{section('hero-main', 'hero-main', hero_main)}{section('hero-side', 'hero-side', hero_side)}</div></section>
<section class='home-only band band-services'><div class='container'>{section('services', 'services', pg.html_widget('HTML27'))}</div></section>
<section class='home-only band band-stats js-hide-empty'><div class='container'>{section('stats', 'stats', stats)}</div></section>
<section class='home-only band band-feeds'><div class='container'><div class='feed-row'>
{section('feed-col', 'box3', pg.feed_widget('HTML6', 'news', 4))}{section('feed-col', 'box', pg.feed_widget('HTML8', 'news', 4))}{section('feed-col', 'box1', pg.feed_widget('HTML9', 'news', 4))}
</div></div></section>
<section class='home-only band band-leader'><div class='container leader-grid'>
{section('leader-col', 'box4', pg.feed_widget('HTML14', 'message', 1))}{section('events-col', 'box6', pg.feed_widget('HTML10', 'tiles', 6))}
</div></section>
<div class='page-main' id='news'><div class='container main-grid'>
<div class='main-col'>{section('main', 'main', f"<div class='widget Blog' data-version='1' id='Blog1'>{main}</div>")}</div>
<aside class='sidebar'>{section('sidebar-section', 'sidebar', sidebar)}</aside>
</div></div>
<section class='home-only band band-about'><div class='container'>{section('about-section', 'newsletter_wrapper', pg.feed_widget('HTML11', 'list', 4))}</div></section>
<section class='home-only band band-members'><div class='container'>{section('members-section', 'crosscol', pg.feed_widget('HTML13', 'strip', 12))}</div></section>
<section class='home-only band band-cta'><div class='container'>{section('cta-section', 'join-cta', cta)}</div></section>
<section class='home-only band band-partners'><div class='container'>{section('partners-section', 'partners', pg.html_widget('HTML4'))}</div></section>
<section class='home-only band band-downloads' id='downloads'><div class='container'>{section('downloads-section', 'downloads-list', pg.html_widget('HTML35', f"<div class='widget-content'>{docs}</div>"))}</div></section>
</main>
<div class='u-data branch-data' hidden='hidden'>{section('branches-section', 'branch-offices', pg.html_widget('HTML36'))}</div>
<footer class='site-footer' id='contact'><div class='container'>
<div class='footer-certs'>{section('certs-section', 'footer-certs', pg.html_widget('HTML34'))}</div>
<div class='footer-grid'>
{section('footer-col', 'f-widget-1', pg.html_widget('HTML30'))}
{section('footer-col', 'f-widget-2', label_widget('Label3', 'Quick links'))}
{section('footer-col', 'f-widget-3', pg.html_widget('HTML31') + pg.html_widget('HTML21'))}
{section('footer-col', 'f-widget-last', pg.html_widget('HTML23') + "<div class='widget Translate' data-version='1' id='Translate1'><h2 class='title'>Translate</h2><div id='google_translate_element'><select><option>Select Language</option></select></div></div>")}
</div>
<div class='footer-bottom'><p class='copyright'>&#169; <span class='js-year'></span> {blog_title}. All rights reserved.</p><div class='footer-social'></div>
{section('footer-credit', 'footer-credit', "<div class='widget Attribution' data-version='1' id='Attribution1'><div class='widget-content' style='text-align: center;'>Powered by <a href='https://www.blogger.com'>Blogger</a>.</div></div>")}
</div></div>
<a aria-label='Back to top' class='to-top' href='#content'>&#8593;</a></footer>
<script src='../dist/theme.js'></script>
</body></html>
"""
    # The preview runs from a local server: point links that would 404 back at the preview pages
    page = page.replace("href='post.html'", f"href='{name}-post.html'").replace("href='home.html'", f"href='{name}-home.html'")
    return page


def main():
    OUT.mkdir(exist_ok=True)
    for name in ('kpuwu', 'generic'):
        for kind in ('home', 'post', 'page', 'downloads', 'sitemap', 'branches'):
            (OUT / f'{name}-{kind}.html').write_text(render(name, kind), encoding='utf-8')
            print(f'wrote preview/{name}-{kind}.html')


if __name__ == '__main__':
    main()
