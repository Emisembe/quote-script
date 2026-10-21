#!/usr/bin/env python3
"""Build the EFIC-branded Blogger theme from the blog's own backup.

    python3 scripts/build.py           # writes theme-eficc.xml
    python3 scripts/build.py --check   # fails if theme-eficc.xml is stale

The backup in original/ is the theme Blogger already accepts on the blog, so
every structural piece (sections, gadgets, includables, data tags) is kept
as-is. This script only applies targeted, counted edits on top of it:
brand colours and typography (EFIC Brand Colour Guide v1.0), plus fixes for
problems inherited from the 2017 template. Each edit asserts how many times
its target occurs, so a changed backup fails loudly instead of silently.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'original' / 'theme-eficc-backup.xml'
OUT = ROOT / 'theme-eficc.xml'
BRAND_CSS = ROOT / 'src' / 'brand.css'

NAVY, GOLD, DEEP, LIGHT_GOLD, DARK_GOLD = '#14213D', '#E7B165', '#0F1A30', '#F5D08A', '#C9924A'
OFFWHITE, GREY = '#F7F6F2', '#4A5568'
HEADING_FONT = "'Montserrat', 'Arial Black', Arial, sans-serif"
BODY_FONT = "Calibri, Arial, 'Helvetica Neue', sans-serif"
HOME = "data:blog.url == data:blog.homepageUrl or data:blog.canonicalUrl == data:blog.homepageUrl"
TAGLINE = 'Driving Efficacy and Effective Solutions.'
LOGO = ('https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhucOvxCXLKVV7Z2TkCIDpfkNwX0oKO29CvT0-YIzfjrwX'
        'vRSRtSt4zXpUHdVGQUhUJ5vGEnxjdHKPobnNDvWEZ9WzpGqFx0DpclJzz8C1nkfozQ3GSoJyVrhrVpgHbdf7-2PghqXIIAA89mhHWzEsB4f'
        'z-DkrbAXa6FZnuZAw69j-oGTLEil53QfQR1Nw/s600/Efic%20consultancy%20web%20logo.png')
LINKEDIN = 'https://www.linkedin.com/company/efic-consultancy-ltd/'

text = SRC.read_text(encoding='utf-8')


def sub(old, new, count=1):
    """Replace a literal string that must occur exactly `count` times."""
    global text
    found = text.count(old)
    if found != count:
        sys.exit(f'build: expected {count} x {old[:70]!r}, found {found}')
    text = text.replace(old, new)


def resub(pattern, new, count=1, flags=re.S):
    global text
    text, n = re.subn(pattern, new, text, flags=flags)
    if n != count:
        sys.exit(f'build: expected {count} matches of /{pattern[:70]}/, found {n}')


# ------------------------------------------------------------------ <head>
# Static SEO block: placeholder images/handles and og:url pointing every post at
# the homepage. Replaced by one viewport, theme colour, fonts and per-page meta.
resub(r"<head>\s*<!--.*?<meta content='width=device-width, initial-scale=1, maximum-scale=1' name='viewport'/>",
      "<head>\n    <meta content='width=device-width, initial-scale=1' name='viewport'/>\n"
      f"    <meta content='{NAVY}' name='theme-color'/>")
sub("<link href='http://fonts.googleapis.com/css?family=Dosis:400,700|Open+Sans:400,700,400italic|Exo+2:700' media='all' rel='stylesheet' type='text/css'/>",
    "<link href='https://fonts.googleapis.com' rel='preconnect'/>\n"
    "    <link crossorigin='anonymous' href='https://fonts.gstatic.com' rel='preconnect'/>\n"
    "    <link href='https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700;800&amp;display=swap' rel='stylesheet'/>")
sub("<link href='//maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css' rel='stylesheet'/>",
    "<link href='https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css' rel='stylesheet'/>")

SOCIAL_META = f"""<!-- Social and search meta (EFIC) -->
    <b:if cond='{HOME}'>
      <b:if cond='data:blog.metaDescription == &quot;&quot;'>
        <meta content='{TAGLINE}' name='description'/>
        <meta content='{TAGLINE}' property='og:description'/>
        <meta content='{TAGLINE}' name='twitter:description'/>
      </b:if>
      <meta expr:content='data:blog.title' property='og:title'/>
      <meta expr:content='data:blog.title' name='twitter:title'/>
      <meta expr:content='data:blog.homepageUrl' property='og:url'/>
      <meta content='website' property='og:type'/>
      <script type='application/ld+json'>{{&quot;@context&quot;: &quot;https://schema.org&quot;, &quot;@type&quot;: &quot;Organization&quot;, &quot;name&quot;: &quot;Efic Consultancy Ltd&quot;, &quot;url&quot;: &quot;<data:blog.homepageUrl/>&quot;, &quot;logo&quot;: &quot;{LOGO}&quot;, &quot;description&quot;: &quot;{TAGLINE}&quot;, &quot;sameAs&quot;: [&quot;{LINKEDIN}&quot;]}}</script>
    </b:if>
    <b:if cond='data:blog.pageType == &quot;item&quot;'>
      <meta expr:content='data:blog.pageName' property='og:title'/>
      <meta expr:content='data:blog.pageName' name='twitter:title'/>
      <meta expr:content='data:blog.canonicalUrl' property='og:url'/>
      <meta content='article' property='og:type'/>
    </b:if>
    <b:if cond='data:blog.postImageUrl'>
      <meta expr:content='data:blog.postImageUrl' property='og:image'/>
      <meta expr:content='data:blog.postImageUrl' name='twitter:image'/>
      <meta content='summary_large_image' name='twitter:card'/>
    <b:else/>
      <b:if cond='data:blog.postImageThumbnailUrl'>
        <meta expr:content='data:blog.postImageThumbnailUrl' property='og:image'/>
        <meta expr:content='data:blog.postImageThumbnailUrl' name='twitter:image'/>
      <b:else/>
        <meta content='{LOGO}' property='og:image'/>
        <meta content='{LOGO}' name='twitter:image'/>
      </b:if>
      <meta content='summary' name='twitter:card'/>
    </b:if>
    <b:if cond='data:blog.metaDescription != &quot;&quot;'>
      <meta expr:content='data:blog.metaDescription' property='og:description'/>
      <meta expr:content='data:blog.metaDescription' name='twitter:description'/>
    </b:if>
    <meta expr:content='data:blog.title' property='og:site_name'/>"""
resub(r"<!-- Description and Keywords \(start\) -->.*?<meta content='@username' name='twitter:creator'/>", SOCIAL_META)

# ------------------------------------------------------------------ skin
sub("""Name:        Fenix Portfolio
Author :     http://www.soratemplates.com
License:     Premium Version""",
    """Name:        EFIC Consultancy
Based on:    Fenix Portfolio (Sora Templates)
Brand:       EFIC Brand Colour Guide v1.0 (navy, gold, Montserrat)""")
sub('<Group description="Main Hover Color" selector="body">\n'
    '<Variable name="maincolor" description="Primary Color" type="color" default="#5DADE2"  value="#5DADE2"/>',
    '<Group description="EFIC Gold accent" selector="body">\n'
    f'<Variable name="maincolor" description="EFIC Gold (accent)" type="color" default="{GOLD}"  value="{GOLD}"/>')

# Typography: Dosis / Exo 2 -> Montserrat, Open Sans -> Calibri stack (brand guide p.5)
for old in ("'Dosis', sans-serif", "'Exo 2', sans-serif"):
    text = text.replace(old, HEADING_FONT)
resub(r"font-family:\s*Dosis;", f"font-family: {HEADING_FONT};", count=4)
resub(r"font-family: 'Exo 2';", f"font-family: {HEADING_FONT};", count=1)
text = text.replace("'Open Sans', sans-serif", BODY_FONT)

# Colours: template blue/green/red -> brand palette. Alert red is reserved for
# LIVE broadcast states, so it leaves the website entirely.
resub(r"#5DADE2", GOLD, count=5, flags=re.I)
sub('rgb(93, 173, 226)', GOLD, count=3)        # process rings (inline style)
sub('#0A1F33', NAVY, count=2)
sub('background-color: #06182C;', f'background-color: {DEEP};')
sub('background-color: #06182C !important;', f'background-color: {DEEP} !important;')
sub('color:#e74c3c;', f'color:{NAVY};')
sub('background-color: #E83434 !important;', f'background-color: {NAVY} !important;\n    color: #fff !important;')
sub('background: #0066CC !important;', f'background: {NAVY} !important;')

# Gold text or white-on-gold fails WCAG AA on light backgrounds (guide p.3):
# hovers on white become navy, gold fills get navy text.
for selector_tail in ('.post-body a {text-decoration:none;color:$maincolor;}',):
    sub(selector_tail, f'.post-body a {{text-decoration:underline;text-decoration-color:{GOLD};text-underline-offset:3px;color:{NAVY};font-weight:600;}}')
sub(""".comments .comments-content .comment-header a:hover {
color:$maincolor
}""", f""".comments .comments-content .comment-header a:hover {{
color:{NAVY};text-decoration:underline
}}""")
sub(""".PopularPosts ul li a:hover {
color: $maincolor
}""", f""".PopularPosts ul li a:hover {{
color: {NAVY};text-decoration:underline
}}""")
sub(""".BlogArchive ul li a:hover {
color:$maincolor;
}""", f""".BlogArchive ul li a:hover {{
color:{NAVY};text-decoration:underline;
}}""")
sub(""".list-label-widget-content li span:last-child {
color: $maincolor;""", f""".list-label-widget-content li span:last-child {{
color: {GREY};""")

# Small fixes inside the original CSS
sub('   webkit-transform: translate3d(-11px, 0, 0);', '    -webkit-transform: translate3d(-11px, 0, 0);')
sub('padding: 0 0 5x;', 'padding: 0 0 5px;')
sub("""::selection {background:transparent; text-shadow:#000 0 0 2px;}
::-moz-selection {background:transparent; text-shadow:#000 0 0 2px;}
::-webkit-selection {background:transparent; text-shadow:#000 0 0 2px;}
::-o-selection {background:transparent; text-shadow:#000 0 0 2px;}""",
    f"""::selection {{background:{GOLD}; color:{NAVY};}}
::-moz-selection {{background:{GOLD}; color:{NAVY};}}""")
sub('background: url(http://3.bp.blogspot.com/', 'background: url(https://3.bp.blogspot.com/')

# Brand layer: appended last so it wins over the template rules above it.
sub(']]></b:skin>', '\n' + BRAND_CSS.read_text(encoding='utf-8') + ']]></b:skin>')

# Typography & shortcodes <style>: green/slate -> brand
sub('.button:hover{background-color:#27ae60;color:#fff}', f'.button:hover{{background-color:{GOLD};color:{NAVY}}}')
sub('cursor:pointer;background:#27ae60;border:0;', f'cursor:pointer;background:{GOLD};border:0;')
sub('transition:all .2s ease-out;color:#FFF}', f'transition:all .2s ease-out;color:{NAVY};font-weight:700}}')
sub('#contact .contact-form-button-submit:hover{background:#2c3e50}', f'#contact .contact-form-button-submit:hover{{background:{NAVY};color:#fff}}')
text = text.replace('#27ae60', DARK_GOLD).replace('#2c3e50', NAVY)
sub('blockquote{font-style:italic;color:#888;', f'blockquote{{font-style:italic;color:{NAVY};background:{OFFWHITE};')

# ------------------------------------------------------------------ body
# Homepage detection that survives ?fbclid=, ?m=1 and UTM links.
sub("cond='data:blog.url == data:blog.homepageUrl'", f"cond='{HOME}'", count=5)

# Hero: call-to-action buttons under the tagline (homepage only).
sub("<div style='clear: both;'/>\n<div class='social-head'>",
    f"""<div style='clear: both;'/>
<b:if cond='{HOME}'>
<div class='hero-cta'>
  <a class='efic-btn efic-btn-gold' href='#section-6'>Get in Touch</a>
  <a class='efic-btn efic-btn-ghost' href='#section-2'>Our Expertise</a>
</div>
</b:if>
<div class='social-head'>""")

# Contact block: take its section out of <b:if> so the gadget stays registered
# and editable; it is hidden by CSS and revealed on the homepage from <head>.
sub("  </div></div>\n<div class='insta-wrap' id='section-6'>", "  </div></div>\n</b:if>\n<div class='insta-wrap' id='section-6'>")
sub("""</div>
</div>
  </b:if>
<div style='clear: both;'/>
<div id='jugas_footer'>""", """</div>
</div>
<div style='clear: both;'/>
<div id='jugas_footer'>""")
sub("</head>", f"""<b:if cond='{HOME}'>
<style>.insta-wrap{{display:block}}</style>
</b:if>
</head>""")

# Lazy-load embeds (map is on every page now, hidden off the homepage).
sub("<iframe allowfullscreen='' class='map'", "<iframe allowfullscreen='' class='map' loading='lazy' title='Efic Consultancy on Google Maps'")
sub("<iframe allowfullscreen='allowfullscreen' frameborder='0' src='https://www.youtube.com/embed/",
    "<iframe allowfullscreen='allowfullscreen' frameborder='0' loading='lazy' title='Efic Consultancy video' src='https://www.youtube.com/embed/", count=3)

sub("<a href='/'><i class='fa fa-car'/>", "<a href='/'><i class='fa fa-home'/>")

# Incomplete hentry microformat -> Search Console errors
sub("class='post hentry uncustomized-post-template'", "class='post uncustomized-post-template'")
sub("<div class='post hentry'>", "<div class='post'>")

# Insecure (http://) images and share links are blocked or warned on HTTPS
text = re.sub(r'http://([123])\.bp\.blogspot\.com', r'https://\1.bp.blogspot.com', text)
sub('&quot;http://www.facebook.com/sharer.php?u=', '&quot;https://www.facebook.com/sharer.php?u=')
sub('&quot;http://twitter.com/share?url=', '&quot;https://twitter.com/share?url=')
sub('&quot;http://pinterest.com/pin/create/button/?url=', '&quot;https://pinterest.com/pin/create/button/?url=')
sub('&quot;http://www.linkedin.com/shareArticle?url=', '&quot;https://www.linkedin.com/shareArticle?url=')

# Footer year without document.write
sub("Copyright &#169; <script type='text/javascript'>var creditsyear = new Date();document.write(creditsyear.getFullYear());</script>",
    "Copyright &#169; <span class='footer-year'/>")
sub("</body>", """<script type='text/javascript'>
//<![CDATA[
(function () {
  var y = String(new Date().getFullYear());
  var els = document.querySelectorAll('.footer-year');
  for (var i = 0; i < els.length; i++) { els[i].textContent = y; }
})();
//]]>
</script>
</body>""")

# SmoothScroll (2014) hijacks the mouse wheel; CSS scroll-behavior replaces it.
resub(r"<script language='javascript' type='text/javascript'>//<!\[CDATA\[\n// SmoothScroll for websites.*?//\]\]></script>\n", '')

# Share box: Telegram and Print next to WhatsApp (WhatsApp now shows on desktop too, via brand.css)
sub("<i class='fa fa-whatsapp'/><span class='resp_del5'> Whatsapp</span></a>",
    "<i class='fa fa-whatsapp'/><span class='resp_del5'> WhatsApp</span></a>\n"
    "<a class='tel-art' expr:href='&quot;https://t.me/share/url?url=&quot; + data:post.url + &quot;&amp;text=&quot; + data:post.title' "
    "onclick='window.open(this.href, &apos;windowName&apos;, &apos;width=600, height=500, left=24, top=24, scrollbars, resizable&apos;); return false;' "
    "rel='nofollow' target='_blank'><i class='fa fa-telegram'/><span class='resp_del5'> Telegram</span></a>\n"
    "<a class='prt-art' href='#print' onclick='window.print(); return false;' rel='nofollow' title='Print this article'>"
    "<i class='fa fa-print'/><span class='resp_del5'> Print</span></a>")

# Footer logo: its own section with an HTML gadget, so it can be changed or
# swapped in Layout (replaces the logo that was hard-coded in CSS).
FOOTER_LOGO = ('https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgG0aQBMZGz0PVqsPP8tF_fpSHG5I59mZOc4LhSQjlHYa9fN'
               '67o1wDvlDFRIqt4QQpIGuZRGS9OQFv9DbQLOWqyHSFaYI8NpgWm0rvaFzOUd4cI88h7xAJEaqcZ6wwtg-7gO2N4iEfp43mbT3EXqnqDi1BetV'
               'LV9hJsqyJ7XlMiEryrgjhhSbt62mxRKb-q/s320/white%20logo%20new%20Efic%20consultancy%20logo.png')
sub("""<div id='jugas_footer'>
        <div class='copy-container row'>
         <div class='foot-social'>""", f"""<div id='jugas_footer'>
        <div class='copy-container row'>
         <div class='foot-logo'>
<b:section class='foot-logo-section' id='footer-logo' maxwidgets='3' name='Footer Logo' showaddelement='yes'>
  <b:widget id='HTML7' locked='false' title='' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[<a href="/" title="Efic Consultancy Ltd"><img alt="Efic Consultancy Ltd" src="{FOOTER_LOGO}"/></a>]]></b:widget-setting>
    </b:widget-settings>
    <b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>
  </b:widget>
</b:section>
         </div>
         <div class='foot-social'>""")
sub("body#layout .FollowByEmail .widget-content:before, body#layout .jugas_footer_copyright {",
    "body#layout #jugas_footer .copy-container.row::before {\ndisplay:none;\n}\n"
    "body#layout .FollowByEmail .widget-content:before, body#layout .jugas_footer_copyright {")

# Social icons: lower-case the names typed in Layout ("LinkedIn" -> "linkedin")
# so the matching icon is found; unknown names get a generic link icon (CSS).
sub("""  var els = document.querySelectorAll('.footer-year');
  for (var i = 0; i < els.length; i++) { els[i].textContent = y; }""",
    """  var els = document.querySelectorAll('.footer-year');
  for (var i = 0; i < els.length; i++) { els[i].textContent = y; }
  var links = document.querySelectorAll('ul[id="social"] a');
  for (var j = 0; j < links.length; j++) {
    var name = (links[j].getAttribute('title') || '').trim();
    links[j].className = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    links[j].setAttribute('aria-label', name);
    if (/^https?:/.test(links[j].getAttribute('href') || '')) {
      links[j].setAttribute('target', '_blank');
      links[j].setAttribute('rel', 'noopener');
    }
  }""")

out = text
if '--check' in sys.argv:
    if not OUT.exists() or OUT.read_text(encoding='utf-8') != out:
        sys.exit('theme-eficc.xml is stale: run python3 scripts/build.py')
    print('theme-eficc.xml is up to date')
else:
    OUT.write_text(out, encoding='utf-8')
    print(f'wrote {OUT.relative_to(ROOT)} ({len(out.encode())} bytes)')
