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

# One menu: drop the homepage-only scrolling header (hard-coded links and logo)
# and turn the Layout menu into a fixed bar with a Layout-editable logo on the left.
resub(r"<b:if cond='[^']*'>\n<div class='scroll-header' id='head-trigger'>.*?</b:if>\n(?=<div id='header-wrapper'>)", '')
resub(r"\$\(function \(\) \{\s*\$\(window\)\.on\(\"scroll\", function\(e\)\{.*?\}\);\s*\}\);\n", '')
sub("""$('.scrolling-menu').slicknav({
        prependTo: '.menu-mobile2',
        label: ''
    });
""", '')
resub(r"<script>\s*\$\(document\)\.ready\(function\(\) \{\s*\$\(&#39;#nav&#39;\)\.onePageNav\(\);\s*\}\);\s*</script>\n", '')

sub("""<div class='row menu-wrap'>
        <b:section class='menu' id='menu'""", f"""<div class='row menu-wrap'>
        <b:section class='menu-logo' id='menu-logo' maxwidgets='1' name='Menu Logo' showaddelement='yes'>
          <b:widget id='HTML8' locked='false' title='' type='HTML'>
            <b:widget-settings>
              <b:widget-setting name='content'><![CDATA[<a href="/" title="Efic Consultancy Ltd"><img alt="Efic Consultancy Ltd" src="{LOGO}"/></a>]]></b:widget-setting>
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
        <b:section class='menu' id='menu'""")
sub("body#layout .tm-menu, body#layout #menu {", "body#layout .menu-wrap {\ndisplay: block;\n}\nbody#layout .tm-menu, body#layout #menu {")

# Menu bar is see-through over the homepage hero until the visitor scrolls.
sub("""  var links = document.querySelectorAll('ul[id="social"] a');""", """  var bar = document.querySelector('.tm-menu');
  if (bar) {
    var onScroll = function () {
      bar.className = bar.className.replace(/\\s*is-scrolled/g, '') + (window.pageYOffset > 40 ? ' is-scrolled' : '');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
  // Share links: build them with properly encoded URL and title, so titles
  // containing & or # are not cut off.
  var shareBox = document.querySelector('.share-art');
  if (shareBox) {
    var h1 = document.querySelector('h1.post-title');
    var canonical = document.querySelector('link[rel="canonical"]');
    var U = encodeURIComponent(canonical ? canonical.href : location.href.split('#')[0]);
    var T = encodeURIComponent(h1 ? h1.textContent.replace(/\\s+/g, ' ').trim() : document.title);
    var share = {
      'fac-art': 'https://www.facebook.com/sharer.php?u=' + U,
      'twi-art': 'https://twitter.com/intent/tweet?url=' + U + '&text=' + T,
      'lin-art': 'https://www.linkedin.com/sharing/share-offsite/?url=' + U,
      'wat-art': 'https://api.whatsapp.com/send?text=' + T + '%20' + U,
      'tel-art': 'https://t.me/share/url?url=' + U + '&text=' + T
    };
    for (var cls in share) {
      var a = shareBox.querySelector('a.' + cls);
      if (a) { a.setAttribute('href', share[cls]); }
    }
  }
  // The mobile menu button is created by SlickNav once the page is ready.
  var labelMenu = function () {
    var btns = document.querySelectorAll('.slicknav_btn');
    for (var k = 0; k < btns.length; k++) { btns[k].setAttribute('aria-label', 'Menu'); }
  };
  document.addEventListener('DOMContentLoaded', function () { setTimeout(labelMenu, 0); });
  window.addEventListener('load', labelMenu);
  var links = document.querySelectorAll('ul[id="social"] a');""")

# Layout editor: every section must be visible and editable there.
sub("""#layout .sora-contact-widget {
display:none;
}""", """body#layout .insta-wrap, body#layout .sora-contact-widget, body#layout .Attribution,
body#layout .tm-menu #menu, body#layout #menu .widget {
display: block !important;
}
body#layout .insta-wrap .contact-title, body#layout .insta-wrap .contact_list_wrapper, body#layout .map-me {
display: none;
}
body#layout #sora_blogger_cntct_form {
padding: 0;
}
body#layout #sora_blogger_cntct_form .wrap-me {
float: none;
max-width: 100%;
}""")
sub("body#layout .sora-special-box, body#layout .sora-works-box, body#layout .sora-about-box, body#layout .insta-wrap, body#layout  .Portfolio-title {display:none;}",
    "body#layout .sora-special-box, body#layout .sora-works-box, body#layout .sora-about-box, body#layout  .Portfolio-title {display:none;}")

# Layout editor: plain, readable backgrounds and no fixed heights, so every
# section box is fully visible and clickable.
sub("/*------Layout (end)----------*/", """body#layout .tm-menu, body#layout .tm-menu .menu-wrap, body#layout .tm-menu #menu, body#layout #header-wrapper {
height: auto !important;
position: static !important;
background: #fff !important;
border: 0;
box-shadow: none;
padding: 0;
}
body#layout #header-wrapper:before, body#layout .header-logo-desc:before, body#layout .hero-cta, body#layout .slicknav_menu {
display: none !important;
}
body#layout .row {
width: auto !important;
}
body#layout .tm-menu #menu {
text-align: left;
}
body#layout .fenix-head, body#layout .fenix-sub-head {
display: block;
transform: none !important;
}
body#layout #jugas_footer, body#layout #jugas_footer .copy-container.row, body#layout #jugas_footer .foot-logo,
body#layout #jugas_footer .foot-social, body#layout #jugas_footer .footer-copy {
background: #fff !important;
display: block;
padding: 0;
border: 0;
}
/*------Layout (end)----------*/""")

# Links to the blog's own pages are relative, so the theme (menu gadget and
# homepage tiles) points at whichever blog it is installed on, not eficc.
sub('https://eficc.blogspot.com/p/', '/p/', count=31)

# Share bar on Pages as well as Posts (it was posts-only); related posts stay
# posts-only because pages have no labels.
sub("""<b:if cond='data:blog.pageType == &quot;item&quot;'>
<div class='share-box'>""", """<b:if cond='data:blog.pageType in {&quot;static_page&quot;,&quot;item&quot;}'>
<div class='share-box'>""")
sub("""      <div style='clear:both'/>  
<div id='related-posts'>""", """      <div style='clear:both'/>  
</b:if>
<b:if cond='data:blog.pageType == &quot;item&quot;'>
<div id='related-posts'>""")
# Leftover non-HTML <whatsapp> tag from the template (the real button is wat-art)
resub(r"<whatsapp expr:href='data:post.url' expr:src='data:post.firstImageUrl' expr:text='data:post.title'/>\n", '')

# Office contacts: the hard-coded address/email/WhatsApp list becomes a Layout
# section of gadgets, one per office. The owner types plain lines (address,
# email, phone, hours); the footer script turns them into cards with icons,
# click-to-call/mail/WhatsApp links and a "Get directions" link.
GADGET_MAIN = """<b:includable id='main'>
  <!-- only display title if it's non-empty -->
  <b:if cond='data:title != &quot;&quot;'>
    <h2 class='title'><data:title/></h2>
  </b:if>
  <div class='widget-content'>
    <data:content/>
  </div>

  <b:include name='quickedit'/>
</b:includable>"""
resub(r"<div class='contact_list_wrapper'>\s*<ul class='contact-list-info'>.*?</ul>\s*</div>",
      f"""<div class='office-contacts-wrap'>
<b:section class='office-contacts' id='office-contacts' name='Office Contacts' showaddelement='yes'>
  <b:widget id='HTML9' locked='false' title='Head Office' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[Tubman St. 100475-00101, Kenya<br/>
askeficc@gmail.com<br/>
WhatsApp: \U0001F1E9\U0001F1EA +49 123 3547892]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
</b:section>
</div>""")
sub("body#layout .insta-wrap .contact-title, body#layout .insta-wrap .contact_list_wrapper, body#layout .map-me {",
    "body#layout .office-contacts-wrap {\ndisplay: block !important;\n}\n"
    "body#layout #office-contacts {\ndisplay: block !important;\n}\n"
    "body#layout .insta-wrap .contact-title, body#layout .insta-wrap .contact_list_wrapper, body#layout .map-me {")

# Language switcher in the menu bar: English, Kiswahili, Deutsch, Francais, Arabic.
sub("\t<div class='menu-mobile'/>", """\t<div class='lang-switch notranslate' translate='no'>
          <i aria-hidden='true' class='fa fa-globe'/>
          <select aria-label='Language' class='lang-select' id='lang-select'>
            <option value='en'>English</option>
            <option value='sw'>Kiswahili</option>
            <option value='de'>Deutsch</option>
            <option value='fr'>Fran&#231;ais</option>
            <option lang='ar' value='ar'>&#1575;&#1604;&#1593;&#1585;&#1576;&#1610;&#1577;</option>
          </select>
        </div>
        <div id='google_translate_element'/>
\t<div class='menu-mobile'/>""")

sub("</body>", """<script type='text/javascript'>
//<![CDATA[
// Office contact cards (Layout > Office Contacts). Each gadget: title = office
// name, one plain line per detail. Gadgets with images, maps or tables are left as typed.
(function () {
  if (document.body.id === 'layout') { return; }
  var EMAIL = /[^\\s@<>(),;:]+@[^\\s@<>(),;:]+\\.[a-z]{2,}/i;
  var WEB = /^(https?:\\/\\/|www\\.)\\S+$/i;
  var PHONE = /\\+?\\d[\\d\\s().\\/-]{5,}\\d/g;
  var LABEL = /^(tel|telephone|phone|mobile|mob|cell|whatsapp|wa|office|fax|simu|landline|call|or|and)*$/;
  var HOURS = /\\b(mon|tue|wed|thu|fri|sat|sun|daily|open|hours|closed)\\b|\\d{1,2}[:.]\\d{2}/i;
  function lines(node) {
    var html = node.innerHTML.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/(p|div|li|h[1-6])>/gi, '\\n');
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    return doc.body.textContent.split('\\n').map(function (l) { return l.replace(/\\s+/g, ' ').trim(); }).filter(Boolean);
  }
  function kind(l) {
    if (EMAIL.test(l)) { return 'email'; }
    if (WEB.test(l)) { return 'web'; }
    var phones = l.match(PHONE);
    if (phones) {
      var rest = l.replace(PHONE, '').replace(/[^a-z]/gi, '').toLowerCase();
      if (LABEL.test(rest)) { return /whats\\s*app/i.test(l) ? 'whatsapp' : 'phone'; }
    }
    return HOURS.test(l) ? 'hours' : 'address';
  }
  function row(icon, cls, keep) {
    var r = document.createElement('div'), i = document.createElement('i'), v = document.createElement('div');
    r.className = 'office-row office-' + cls + (keep ? ' notranslate' : '');
    if (keep) { r.setAttribute('translate', 'no'); }
    i.className = 'fa ' + icon; i.setAttribute('aria-hidden', 'true');
    v.className = 'office-val';
    r.appendChild(i); r.appendChild(v);
    return {row: r, val: v};
  }
  function link(href, label, external) {
    var a = document.createElement('a');
    a.href = href; a.textContent = label;
    if (external) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }
  // Text with every phone number turned into a tel: (or WhatsApp) link.
  function phoneText(target, l, wa) {
    var last = 0, m;
    PHONE.lastIndex = 0;
    while ((m = PHONE.exec(l))) {
      if (m.index > last) { target.appendChild(document.createTextNode(l.slice(last, m.index))); }
      var digits = m[0].replace(/[^\\d+]/g, '');
      var href = wa && digits.charAt(0) === '+' ? 'https://wa.me/' + digits.slice(1) : 'tel:' + digits;
      target.appendChild(link(href, m[0], href.indexOf('https') === 0));
      last = m.index + m[0].length;
    }
    if (last < l.length) { target.appendChild(document.createTextNode(l.slice(last))); }
  }
  var cards = document.querySelectorAll('#office-contacts .widget');
  for (var c = 0; c < cards.length; c++) {
    var box = cards[c].querySelector('.widget-content');
    cards[c].className += ' office-card';
    if (!box || box.querySelector('iframe, img, table, script')) { continue; }
    var ls = lines(box), out = document.createDocumentFragment(), addr = [], r;
    var flush = function () {
      if (!addr.length) { return; }
      var a = row('fa-map-marker', 'address', false);
      var place = document.createElement('span');
      place.className = 'notranslate'; place.setAttribute('translate', 'no');
      place.textContent = addr.join('\\n');
      var dir = link('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(addr.join(', ')), 'Get directions', true);
      dir.className = 'office-dir';
      a.val.appendChild(place); a.val.appendChild(document.createElement('br')); a.val.appendChild(dir);
      out.appendChild(a.row); addr = [];
    };
    for (var i = 0; i < ls.length; i++) {
      var l = ls[i], k = kind(l);
      if (k === 'address') { addr.push(l); continue; }
      flush();
      if (k === 'email') {
        r = row('fa-envelope', 'email', true);
        var em = l.match(EMAIL)[0];
        r.val.appendChild(document.createTextNode(l.slice(0, l.indexOf(em))));
        r.val.appendChild(link('mailto:' + em, em));
        r.val.appendChild(document.createTextNode(l.slice(l.indexOf(em) + em.length)));
      } else if (k === 'web') {
        r = row('fa-globe', 'web', true);
        r.val.appendChild(link(/^https?:/i.test(l) ? l : 'https://' + l, l.replace(/^https?:\\/\\//i, ''), true));
      } else if (k === 'whatsapp' || k === 'phone') {
        r = row(k === 'whatsapp' ? 'fa-whatsapp' : 'fa-phone', k, true);
        phoneText(r.val, l, k === 'whatsapp');
      } else {
        r = row('fa-clock-o', 'hours', false);
        r.val.textContent = l;
      }
      out.appendChild(r.row);
    }
    flush();
    box.innerHTML = '';
    box.appendChild(out);
  }
})();

// Desktop menu: if the Layout menu needs more than one row, use the hamburger instead.
(function () {
  var root = document.documentElement, timer = null;
  function fit() {
    if (window.innerWidth <= 1180) { root.className = root.className.replace(/\\s*menu-overflow/g, ''); return; }
    root.className = root.className.replace(/\\s*menu-overflow/g, '');
    var items = document.querySelectorAll('#nav1 > li'), tops = {}, rows = 0;
    for (var i = 0; i < items.length; i++) {
      if (!items[i].offsetHeight) { continue; }
      var t = Math.round(items[i].getBoundingClientRect().top);
      if (!tops[t]) { tops[t] = true; rows++; }
    }
    if (rows > 1) { root.className += ' menu-overflow'; }
  }
  window.addEventListener('load', fit);
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(fit, 120); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(fit); }
})();

// Language switcher (menu bar). The page is written in English; other languages
// come from Google's website translation, loaded only when a visitor picks one.
// If that script cannot load, the same page opens through translate.goog instead.
(function () {
  var sel = document.getElementById('lang-select');
  if (!sel || document.body.id === 'layout') { return; }
  var LANGS = ['en', 'sw', 'de', 'fr', 'ar'], RTL = {ar: true};
  var root = document.documentElement, host = location.hostname;
  var proxied = /\\.translate\\.goog$/.test(host);
  function cookieLang() { var m = document.cookie.match(/(?:^|;\\s*)googtrans=\\/[a-z-]*\\/([a-z-]+)/i); return m ? m[1] : ''; }
  function proxyLang() { var m = location.search.match(/[?&]_x_tr_tl=([a-z-]+)/i); return m ? m[1] : ''; }
  function writeCookie(lang) {
    var value = lang ? '/en/' + lang : '', end = lang ? '' : '; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    var domains = ['', '; domain=' + host, '; domain=.' + host];
    for (var d = 0; d < domains.length; d++) { document.cookie = 'googtrans=' + value + '; path=/' + domains[d] + end; }
  }
  function cleanSearch() {
    var p = location.search.replace(/^\\?/, '').split('&').filter(function (x) { return x && !/^_x_tr_/.test(x); });
    return p.length ? '?' + p.join('&') : '';
  }
  function siteHost() {
    if (!proxied) { return host; }
    return host.replace(/\\.translate\\.goog$/, '').split('--').map(function (part) { return part.replace(/-/g, '.'); }).join('-');
  }
  function proxyUrl(lang) {
    var q = cleanSearch();
    q += (q ? '&' : '?') + '_x_tr_sl=en&_x_tr_tl=' + lang + '&_x_tr_hl=' + lang;
    return 'https://' + siteHost().replace(/-/g, '--').replace(/\\./g, '-') + '.translate.goog' + location.pathname + q + location.hash;
  }
  function useProxy() { try { return sessionStorage.getItem('eficTrProxy') === '1'; } catch (e) { return false; } }
  var cur = (proxied ? proxyLang() : cookieLang()) || 'en';
  if (LANGS.indexOf(cur) < 0) { cur = 'en'; }
  sel.value = cur;
  // Names, addresses and contact details stay exactly as written.
  var keep = document.querySelectorAll('#header h1, .footer-copy [itemprop=name], #menu-logo, .foot-logo');
  for (var k = 0; k < keep.length; k++) { keep[k].className += ' notranslate'; keep[k].setAttribute('translate', 'no'); }
  if (RTL[cur]) {
    root.className += ' efic-rtl';
    var font = document.createElement('link');
    font.rel = 'stylesheet';
    font.href = 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap';
    document.head.appendChild(font);
  }
  sel.addEventListener('change', function () {
    var lang = sel.value;
    if (proxied) { location.href = lang === 'en' ? 'https://' + siteHost() + location.pathname + cleanSearch() + location.hash : proxyUrl(lang); return; }
    writeCookie(lang === 'en' ? '' : lang);
    if (lang !== 'en' && useProxy()) { writeCookie(''); location.href = proxyUrl(lang); return; }
    location.reload();
  });
  if (proxied || cur === 'en') { return; }
  var failed = false;
  var fail = function () {
    if (failed) { return; }
    failed = true;
    try { sessionStorage.setItem('eficTrProxy', '1'); } catch (e) {}
    writeCookie('');
    location.href = proxyUrl(cur);
  };
  window.googleTranslateElementInit = function () {
    try {
      new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: LANGS.join(','), autoDisplay: false}, 'google_translate_element');
    } catch (e) { fail(); }
  };
  var s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  s.onerror = fail;
  document.body.appendChild(s);
  setTimeout(function () { if (!(window.google && google.translate && google.translate.TranslateElement)) { fail(); } }, 15000);
})();
//]]>
</script>
</body>""")

# Slideshow below the menu bar (homepage). Layout > Slideshow: one gadget per slide.
# Image gadget = photo slide (title, caption, link); HTML/JavaScript or Text gadget
# with a YouTube link = video slide; gadget order = slide order. Empty = no slideshow.
sub("<div id='header-wrapper'>", """<div class='efic-slider-wrap'>
<b:section class='efic-slides' id='slideshow' name='Slideshow (homepage, below the menu)' showaddelement='yes'>
</b:section>
</div>
<div id='header-wrapper'>""")
sub("body#layout .office-contacts-wrap {", "body#layout .efic-slider-wrap {\ndisplay: block !important;\npadding: 0 !important;\nbackground: #fff !important;\n}\nbody#layout .office-contacts-wrap {")
sub("""// Desktop menu: if the Layout menu needs more than one row""", """// Slideshow (Layout > Slideshow): photos from Image gadgets, YouTube links from
// HTML/JavaScript or Text gadgets, text-only slides from anything else.
(function () {
  var sec = document.getElementById('slideshow');
  if (!sec || document.body.id === 'layout') { return; }
  var wrap = sec.parentNode, outer = document.getElementById('outer-wrapper');
  var YT = /(?:youtube(?:-nocookie)?\\.com\\/(?:watch\\?(?:[^#\\s"']*&(?:amp;)?)?v=|embed\\/|shorts\\/|live\\/)|youtu\\.be\\/)([A-Za-z0-9_-]{11})/;
  var IMG_URL = /^https?:\\/\\/\\S+\\.(?:jpe?g|png|webp|gif)(?:\\?\\S*)?$|^https:\\/\\/(?:blogger\\.googleusercontent\\.com|[1-4]\\.bp\\.blogspot\\.com)\\/\\S+$/i;
  // Blogger image links carry a size; ask for a sharp 1920 px version.
  function sharp(src) {
    if (!/googleusercontent\\.com|bp\\.blogspot\\.com/.test(src)) { return src; }
    return src.replace(/\\/(?:s\\d+|w\\d+-h\\d+)(?:-[a-z0-9-]*)?\\//i, '/s1920/').replace(/=(?:s\\d+|w\\d+-h\\d+)(?:-[a-z0-9-]*)?$/i, '=s1920');
  }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text) { e.textContent = text; } return e; }
  var slides = [], ws = sec.querySelectorAll('.widget');
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i], box = w.querySelector('.widget-content') || w, h = w.querySelector('h2');
    var title = h ? h.textContent.trim() : '', text = box.textContent.replace(/\\s+/g, ' ').trim();
    var frame = box.querySelector('iframe[src*="youtu"]'), a = box.querySelector('a[href]'), img = box.querySelector('img'), cap = box.querySelector('.caption');
    var m = (frame && frame.src.match(YT)) || (a && a.href.match(YT)) || box.innerHTML.match(YT);
    var s = {title: title, video: m ? m[1] : '', img: '', alt: '', link: '', caption: ''};
    if (!s.video && img) { s.img = sharp(img.currentSrc || img.src); s.alt = img.alt || title; }
    if (!s.video && !s.img && IMG_URL.test(text)) { s.img = sharp(text); s.alt = title; text = ''; }
    if (a && !s.video && !/^javascript:/i.test(a.getAttribute('href'))) { s.link = a.href; }
    s.caption = cap ? cap.textContent.trim() : text.replace(/https?:\\/\\/\\S+/g, '').replace(/\\s+/g, ' ').trim();
    if (s.caption === title) { s.caption = ''; }
    if (s.video || s.img || s.title || s.caption) { slides.push(s); }
  }
  if (!slides.length) { return; }

  var root = el('div', 'efic-slider'), track = el('div', 'es-track'), items = [], dots = [], cur = 0, timer = null;
  var paused = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches, hover = false, playing = false;
  root.setAttribute('role', 'region'); root.setAttribute('aria-roledescription', 'carousel'); root.setAttribute('aria-label', 'Highlights');
  function stopVideo(item) {
    var f = item.querySelector('iframe');
    if (f) { f.parentNode.replaceChild(item.thumb, f); playing = false; root.className = root.className.replace(/\\s*is-playing/g, ''); }
  }
  function thumbFor(id, title) {
    var b = el('button', 'es-media es-video'), t = el('img');
    b.type = 'button'; b.setAttribute('aria-label', 'Play video' + (title ? ': ' + title : ''));
    t.alt = ''; t.loading = 'lazy'; t.src = 'https://i.ytimg.com/vi/' + id + '/maxresdefault.jpg';
    t.onload = function () { if (t.naturalWidth <= 120) { t.onload = null; t.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'; } };
    b.appendChild(t); b.appendChild(el('span', 'es-play'));
    b.addEventListener('click', function () {
      var f = el('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
      f.title = title || 'Video'; f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen'); f.setAttribute('allowfullscreen', '');
      f.className = 'es-media';
      b.parentNode.replaceChild(f, b); playing = true; root.className += ' is-playing'; schedule();
    });
    return b;
  }
  slides.forEach(function (s, n) {
    var item = el('div', 'es-slide' + (s.video ? ' is-video' : s.img ? '' : ' is-text'));
    item.setAttribute('role', 'group'); item.setAttribute('aria-roledescription', 'slide');
    item.setAttribute('aria-label', (n + 1) + ' / ' + slides.length + (s.title ? ': ' + s.title : ''));
    if (s.video) { item.thumb = thumbFor(s.video, s.title); item.appendChild(item.thumb); }
    else if (s.img) {
      var im = el('img'); im.src = s.img; im.alt = s.alt; if (n) { im.loading = 'lazy'; }
      if (s.link) { var ln = el('a', 'es-media'); ln.href = s.link; ln.appendChild(im); item.appendChild(ln); } else { im.className = 'es-media'; item.appendChild(im); }
    }
    if (s.title || s.caption) {
      var c = el('div', 'es-caption');
      if (s.title) { c.appendChild(el('h3', '', s.title)); }
      if (s.caption) { c.appendChild(el('p', '', s.caption)); }
      if (s.link && !s.img) { var more = el('a', 'efic-btn efic-btn-gold', 'Learn more'); more.href = s.link; c.appendChild(more); }
      item.appendChild(c);
    }
    items.push(item); track.appendChild(item);
  });
  root.appendChild(track);
  function show(n, focusDot) {
    if (items[cur].thumb) { stopVideo(items[cur]); }
    cur = (n + items.length) % items.length;
    for (var k = 0; k < items.length; k++) {
      var on = k === cur;
      items[k].className = items[k].className.replace(/\\s*is-active/g, '') + (on ? ' is-active' : '');
      items[k].setAttribute('aria-hidden', on ? 'false' : 'true');
      var f = items[k].querySelectorAll('a, button');
      for (var j = 0; j < f.length; j++) { f[j].tabIndex = on ? 0 : -1; }
      if (dots[k]) { dots[k].setAttribute('aria-current', on ? 'true' : 'false'); }
    }
    if (focusDot && dots[cur]) { dots[cur].focus(); }
    schedule();
  }
  function schedule() {
    clearTimeout(timer);
    if (items.length > 1 && !paused && !hover && !playing) { timer = setTimeout(function () { if (!document.hidden) { show(cur + 1); } else { schedule(); } }, 6000); }
  }
  if (items.length > 1) {
    var prev = el('button', 'es-arrow es-prev'), next = el('button', 'es-arrow es-next'), nav = el('div', 'es-dots'), pause = el('button', 'es-pause');
    prev.type = next.type = pause.type = 'button';
    prev.setAttribute('aria-label', 'Previous slide'); next.setAttribute('aria-label', 'Next slide');
    prev.innerHTML = '<i class="fa fa-chevron-left" aria-hidden="true"></i>'; next.innerHTML = '<i class="fa fa-chevron-right" aria-hidden="true"></i>';
    prev.addEventListener('click', function () { show(cur - 1); });
    next.addEventListener('click', function () { show(cur + 1); });
    items.forEach(function (it, n) {
      var d = el('button', 'es-dot'); d.type = 'button'; d.setAttribute('aria-label', 'Slide ' + (n + 1));
      d.addEventListener('click', function () { show(n); }); dots.push(d); nav.appendChild(d);
    });
    var setPause = function () {
      pause.setAttribute('aria-label', paused ? 'Play slideshow' : 'Pause slideshow');
      pause.innerHTML = '<i class="fa fa-' + (paused ? 'play' : 'pause') + '" aria-hidden="true"></i>';
    };
    pause.addEventListener('click', function () { paused = !paused; setPause(); schedule(); });
    setPause();
    root.appendChild(prev); root.appendChild(next); root.appendChild(nav); root.appendChild(pause);
    root.addEventListener('mouseenter', function () { hover = true; schedule(); });
    root.addEventListener('mouseleave', function () { hover = false; schedule(); });
    root.addEventListener('focusin', function () { hover = true; schedule(); });
    root.addEventListener('focusout', function () { hover = false; schedule(); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(cur - 1, true); } else if (e.key === 'ArrowRight') { show(cur + 1, true); }
    });
    var x0 = null, y0 = 0;
    root.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, {passive: true});
    root.addEventListener('touchend', function (e) {
      if (x0 === null) { return; }
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { show(cur + (dx < 0 ? 1 : -1)); }
    }, {passive: true});
  }
  sec.style.display = 'none';
  wrap.appendChild(root);
  wrap.className += ' has-slides';
  if (outer) { outer.className += ' has-slider'; }
  show(0);
})();

// Desktop menu: if the Layout menu needs more than one row""")

# Areas of Expertise: a seventh tile, Technology.
sub("<!-- Sixth Ends -->", """<!-- Sixth Ends -->

<!-- Seventh -->
<a class='special-tiles-link' href='/p/our-services.html'>
<div class='special-tiles'>
<span class='special-icons'>
<i aria-hidden='true' class='fa fa-microchip'/>
</span>
<h6 class='special-heading'>Technology</h6>
<p class='special-text'>Putting digital tools, data and automation to work, from ERP and dashboards to workflow automation, so your teams work faster and decide with better information.</p>
</div>
</a>
<!-- Seventh Ends -->""")

# Message & Video block (homepage). Its section sits outside the homepage-only
# <b:if> so it stays in Layout; the footer script moves it under the expertise tiles.
sub("  </div></div>\n</b:if>\n<div class='insta-wrap' id='section-6'>", f"""  </div></div>
</b:if>
<div class='efic-feature-wrap'>
<b:section class='efic-feature-section' id='feature-story' name='Message &amp; Video (homepage)' showaddelement='yes'>
  <b:widget id='HTML10' locked='false' title='Who we are' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[Driving Efficacy &amp; Effective Solutions<br/>
EFIC Consultancy Ltd helps organisations improve quality, compliance, logistics and business processes, with practical advice that turns into measurable results.]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
  <b:widget id='HTML11' locked='false' title='EFIC in action' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[See how we work<br/>
https://www.youtube.com/watch?v=2bjBiOVQrUs]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
</b:section>
</div>
<div class='insta-wrap' id='section-6'>""")

# Newsletter band above the footer (every page) and certifications row in the footer.
sub("<div style='clear: both;'/>\n<div id='jugas_footer'>", f"""<div style='clear: both;'/>
<div class='efic-newsletter-wrap'>
<b:section class='efic-newsletter-section' id='newsletter' maxwidgets='1' name='Newsletter sign-up' showaddelement='yes'>
  <b:widget id='HTML12' locked='false' title='Stay informed' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[Practical insights on quality, compliance, logistics and process improvement, straight to your inbox.<br/>
askeficc@gmail.com]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
</b:section>
</div>
<div id='jugas_footer'>""")
resub(r"(<b:section class='foot-bar-social blue' id='Footer social widget'.*?</b:section>\n</div>\n)",
      r"""\1<div class='foot-certs'>
<b:section class='foot-certs-section' id='footer-certifications' name='Certifications &amp; Memberships (footer)' showaddelement='yes'>
</b:section>
</div>
""")
# Numbers band (homepage): one HTML gadget per figure, Title = label, Content = number.
# Shipped with a placeholder instead of figures, so nothing untrue goes live: a
# gadget only shows once its number is typed in. Moved under the expertise tiles.
sub("</b:section>\n</div>\n<div class='insta-wrap' id='section-6'>", f"""</b:section>
</div>
<div class='efic-stats-wrap'>
<b:section class='efic-stats-section' id='stats' name='Numbers band (homepage)' showaddelement='yes'>
  <b:widget id='HTML13' locked='false' title='Projects Executed' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[[type the number, e.g. 250+]]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
  <b:widget id='HTML14' locked='false' title='Global Presence' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[[type the number, e.g. 250+]]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
  <b:widget id='HTML15' locked='false' title='Happy Clients' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[[type the number, e.g. 250+]]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
  <b:widget id='HTML16' locked='false' title='Recognitions' type='HTML'>
    <b:widget-settings>
      <b:widget-setting name='content'><![CDATA[[type the number, e.g. 250+]]]></b:widget-setting>
    </b:widget-settings>
    {GADGET_MAIN}
  </b:widget>
</b:section>
</div>
<div class='insta-wrap' id='section-6'>""")

sub("body#layout .office-contacts-wrap {", "body#layout .efic-feature-wrap, body#layout .efic-stats-wrap, body#layout .efic-newsletter-wrap, body#layout .foot-certs {\ndisplay: block !important;\nbackground: #fff !important;\npadding: 0 !important;\n}\nbody#layout .office-contacts-wrap {")

sub("""// Desktop menu: if the Layout menu needs more than one row""", """// Message & Video (Layout > Message & Video): text gadget + video/photo card.
(function () {
  var sec = document.getElementById('feature-story');
  if (!sec || document.body.id === 'layout') { return; }
  var wrap = sec.parentNode, anchor = document.getElementById('section-2');
  var YT = /(?:youtube(?:-nocookie)?\\.com\\/(?:watch\\?(?:[^#\\s"']*&(?:amp;)?)?v=|embed\\/|shorts\\/|live\\/)|youtu\\.be\\/)([A-Za-z0-9_-]{11})/;
  var URL_LINE = /^https?:\\/\\/\\S+$/i, IMG_URL = /\\.(?:jpe?g|png|webp|gif)(?:\\?\\S*)?$|googleusercontent\\.com|bp\\.blogspot\\.com/i;
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text) { e.textContent = text; } return e; }
  function lines(node) {
    var html = node.innerHTML.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/(p|div|li|h[1-6])>/gi, '\\n');
    var doc = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html');
    return doc.body.textContent.split('\\n').map(function (l) { return l.replace(/\\s+/g, ' ').trim(); }).filter(Boolean);
  }
  var text = null, media = null, ws = sec.querySelectorAll('.widget');
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i], box = w.querySelector('.widget-content') || w, h = w.querySelector('h2');
    var title = h ? h.textContent.trim() : '', a = box.querySelector('a[href]'), img = box.querySelector('img'), cap = box.querySelector('.caption');
    var ls = lines(box), m = (a && a.href.match(YT)) || box.innerHTML.match(YT);
    var picture = img ? (img.currentSrc || img.src) : '';
    ls.forEach(function (l) { if (!picture && URL_LINE.test(l) && IMG_URL.test(l) && !YT.test(l)) { picture = l; } });
    var words = ls.filter(function (l) { return !URL_LINE.test(l); });
    if ((m || picture) && !media && (m || words.length <= 2)) {
      media = {title: title, video: m ? m[1] : '', picture: picture, kicker: cap ? cap.textContent.trim() : (words[0] || ''),
        link: a && !m ? a.href : (ls.filter(function (l) { return URL_LINE.test(l) && !YT.test(l) && l !== picture; })[0] || '')};
    } else if (!text && (title || words.length)) {
      text = {kicker: title, lines: words, signature: img ? (img.currentSrc || img.src) : ''};
    }
  }
  if (!text && !media) { return; }
  var root = el('div', 'efic-feature' + (text && media ? '' : ' is-single'));
  if (text) {
    var t = el('div', 'ef-text');
    if (text.kicker) { t.appendChild(el('p', 'ef-kicker', text.kicker)); }
    text.lines.forEach(function (l, n) {
      if (n === 0) { t.appendChild(el('h2', 'ef-headline', l)); }
      else if (/^[\\u2014\\u2013-]\\s*/.test(l)) { t.appendChild(el('p', 'ef-name', l.replace(/^[\\u2014\\u2013-]\\s*/, ''))); }
      else { t.appendChild(el('p', 'ef-body', l)); }
    });
    if (text.signature) { var sig = el('img', 'ef-signature'); sig.src = text.signature; sig.alt = 'Signature'; sig.loading = 'lazy'; t.appendChild(sig); }
    root.appendChild(t);
  }
  if (media) {
    var c = el('div', 'ef-media'), bg = media.picture || (media.video ? 'https://i.ytimg.com/vi/' + media.video + '/maxresdefault.jpg' : '');
    if (bg) {
      var im = el('img', 'ef-media-img'); im.alt = ''; im.loading = 'lazy'; im.src = bg;
      if (!media.picture && media.video) { im.onload = function () { if (im.naturalWidth <= 120) { im.onload = null; im.src = 'https://i.ytimg.com/vi/' + media.video + '/hqdefault.jpg'; } }; }
      c.appendChild(im);
    }
    var o = el('div', 'ef-media-text');
    if (media.kicker) { o.appendChild(el('p', 'ef-media-kicker', media.kicker)); }
    if (media.title) { o.appendChild(el('h3', 'ef-media-title', media.title)); }
    if (media.video) {
      var play = el('button', 'efic-btn efic-btn-gold ef-play');
      play.type = 'button';
      play.innerHTML = '<i class="fa fa-play" aria-hidden="true"></i> ';
      play.appendChild(document.createTextNode('Play video'));
      play.addEventListener('click', function () { openVideo(media.video, media.title, play); });
      o.appendChild(play);
    } else if (media.link) {
      var more = el('a', 'efic-btn efic-btn-gold', 'Learn more'); more.href = media.link; o.appendChild(more);
    }
    c.appendChild(o);
    root.appendChild(c);
  }
  function openVideo(id, title, from) {
    var box = el('div', 'ef-lightbox'), inner = el('div', 'ef-lightbox-inner'), close = el('button', 'ef-close'), f = el('iframe');
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', title || 'Video');
    close.type = 'button'; close.setAttribute('aria-label', 'Close video'); close.innerHTML = '<i class="fa fa-times" aria-hidden="true"></i>';
    f.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&playsinline=1';
    f.title = title || 'Video'; f.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen'); f.setAttribute('allowfullscreen', '');
    inner.appendChild(f); box.appendChild(close); box.appendChild(inner); document.body.appendChild(box);
    document.documentElement.className += ' ef-noscroll';
    var shut = function () {
      document.removeEventListener('keydown', key);
      if (box.parentNode) { box.parentNode.removeChild(box); }
      document.documentElement.className = document.documentElement.className.replace(/\\s*ef-noscroll/g, '');
      from.focus();
    };
    var key = function (e) { if (e.key === 'Escape') { shut(); } else if (e.key === 'Tab') { e.preventDefault(); close.focus(); } };
    close.addEventListener('click', shut);
    box.addEventListener('click', function (e) { if (e.target === box) { shut(); } });
    document.addEventListener('keydown', key);
    close.focus();
  }
  sec.style.display = 'none';
  wrap.appendChild(root);
  wrap.className += ' has-feature';
  if (anchor && anchor.parentNode) { anchor.parentNode.insertBefore(wrap, anchor.nextSibling); }
})();

// Numbers band (Layout > Numbers band): one gadget per figure. Title = the label,
// first line of the content = the number. Gadgets still holding the [placeholder]
// (or no digit) are skipped; with none left the band stays hidden.
(function () {
  var sec = document.getElementById('stats');
  if (!sec || document.body.id === 'layout') { return; }
  var wrap = sec.parentNode, anchor = document.getElementById('section-2');
  var ws = sec.querySelectorAll('.widget'), list = document.createElement('ul');
  list.className = 'efic-stats';
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i], box = w.querySelector('.widget-content') || w, h = w.querySelector('h2');
    var html = box.innerHTML.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/(p|div|li|h[1-6])>/gi, '\\n');
    var ls = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.textContent.split('\\n')
      .map(function (l) { return l.replace(/\\s+/g, ' ').trim(); }).filter(Boolean);
    var value = ls[0] || '', label = (h ? h.textContent.trim() : '') || ls[1] || '';
    if (!/\\d/.test(value) || /[\\[\\]]/.test(value) || value.length > 16) { continue; }
    var li = document.createElement('li'), n = document.createElement('span'), l = document.createElement('span');
    n.className = 'es-number'; n.textContent = value;
    l.className = 'es-label'; l.textContent = label;
    li.appendChild(n); if (label) { li.appendChild(l); }
    list.appendChild(li);
  }
  if (!list.children.length) { return; }
  list.className += ' es-count-' + Math.min(list.children.length, 6);
  sec.style.display = 'none';
  wrap.appendChild(list);
  wrap.className += ' has-stats';
  if (anchor && anchor.parentNode) { anchor.parentNode.insertBefore(wrap, anchor.nextSibling); }
})();

// Newsletter sign-up (Layout > Newsletter sign-up). The gadget holds the text, an
// email address (sign-ups are emailed there) and optionally a form address from
// Google Forms, Mailchimp, Brevo or MailerLite (sign-ups then go to that list).
(function () {
  var sec = document.getElementById('newsletter');
  if (!sec || document.body.id === 'layout') { return; }
  var w = sec.querySelector('.widget');
  if (!w) { return; }
  var box = w.querySelector('.widget-content') || w, h = w.querySelector('h2');
  var html = box.innerHTML.replace(/<br\\s*\\/?>/gi, '\\n').replace(/<\\/(p|div|li|h[1-6])>/gi, '\\n');
  var ls = new DOMParser().parseFromString('<div>' + html + '</div>', 'text/html').body.textContent.split('\\n')
    .map(function (l) { return l.replace(/\\s+/g, ' ').trim(); }).filter(Boolean);
  var EMAIL = /^[^\\s@]+@[^\\s@]+\\.[a-z]{2,}$/i, URL_LINE = /^https?:\\/\\/\\S+$/i;
  var to = '', action = '', words = [];
  ls.forEach(function (l) { if (EMAIL.test(l)) { to = l; } else if (URL_LINE.test(l)) { action = l; } else { words.push(l); } });
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text) { e.textContent = text; } return e; }
  // Which field name each service expects for the email address.
  function field(url) {
    if (/docs\\.google\\.com\\/forms\\//.test(url)) { var m = url.match(/[?&](entry\\.\\d+)/); return m ? m[1] : ''; }
    if (/assets\\.mailerlite\\.com|app\\.mailerlite\\.com/.test(url)) { return 'fields[email]'; }
    return 'EMAIL';   // Mailchimp, Brevo (Sendinblue)
  }
  var root = el('div', 'efic-newsletter'), intro = el('div', 'en-intro'), form = el('form', 'en-form');
  intro.appendChild(el('h3', 'en-title', h ? h.textContent.trim() : 'Newsletter'));
  words.forEach(function (l) { intro.appendChild(el('p', 'en-text', l)); });
  form.setAttribute('novalidate', '');
  var row = el('div', 'en-row'), input = el('input', 'en-email'), btn = el('button', 'efic-btn efic-btn-gold en-submit', 'Subscribe');
  input.type = 'email'; input.required = true; input.name = 'email'; input.autocomplete = 'email';
  input.placeholder = 'Your email address'; input.setAttribute('aria-label', 'Email address');
  btn.type = 'submit';
  row.appendChild(input); row.appendChild(btn);
  var consent = el('label', 'en-consent'), tick = el('input');
  tick.type = 'checkbox'; tick.required = true;
  var site = document.querySelector('meta[property="og:site_name"]');
  var who = (site && site.getAttribute('content')) || (document.querySelector('#header h1') || {}).textContent || '';
  consent.appendChild(tick); consent.appendChild(document.createTextNode(' I agree to receive emails from ' + (who.trim() || 'us') + '. I can unsubscribe at any time.'));
  var trap = el('input', 'en-trap'); trap.type = 'text'; trap.tabIndex = -1; trap.setAttribute('aria-hidden', 'true'); trap.autocomplete = 'off';
  var msg = el('p', 'en-msg'); msg.setAttribute('role', 'status');
  form.appendChild(row); form.appendChild(consent); form.appendChild(trap); form.appendChild(msg);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    msg.className = 'en-msg'; msg.textContent = '';
    if (trap.value) { return; }
    if (!EMAIL.test(input.value.trim())) { msg.className = 'en-msg is-error'; msg.textContent = 'Please enter a valid email address.'; input.focus(); return; }
    if (!tick.checked) { msg.className = 'en-msg is-error'; msg.textContent = 'Please tick the box to agree to receive our emails.'; tick.focus(); return; }
    var email = input.value.trim(), name = action && field(action);
    if (action && name) {
      var post = el('form'), hidden = el('input');
      post.method = 'post'; post.action = action.replace(/[?&]entry\\.\\d+=?[^&]*/, '').replace(/\\?$/, ''); post.target = '_blank'; post.style.display = 'none';
      hidden.type = 'hidden'; hidden.name = name; hidden.value = email;
      post.appendChild(hidden); document.body.appendChild(post); post.submit(); document.body.removeChild(post);
      msg.textContent = /docs\\.google\\.com/.test(action) ? 'Thank you! You are now on our mailing list.' : 'Thank you! Please check your inbox to confirm your subscription.';
    } else if (to) {
      var href = 'mailto:' + to + '?subject=' + encodeURIComponent('Newsletter sign-up') + '&body=' + encodeURIComponent('Please add ' + email + ' to your newsletter.');
      msg.textContent = 'Thank you! Your email app will open to send your request. If it doesn\\'t, write to ';
      var a = el('a', '', to); a.href = href; msg.appendChild(a); msg.appendChild(document.createTextNode('.'));
      window.location.href = href;
    } else {
      msg.className = 'en-msg is-error'; msg.textContent = 'Sign-up is not set up yet.';
      return;
    }
    form.className += ' is-done';
  });
  root.appendChild(intro); root.appendChild(form);
  sec.style.display = 'none';
  sec.parentNode.appendChild(root);
  sec.parentNode.className += ' has-newsletter';
})();

// Certifications & Memberships (footer): one Image gadget per badge.
(function () {
  var sec = document.getElementById('footer-certifications');
  if (!sec || document.body.id === 'layout') { return; }
  var ws = sec.querySelectorAll('.widget'), list = document.createElement('ul');
  list.className = 'cert-list';
  for (var i = 0; i < ws.length; i++) {
    var w = ws[i], box = w.querySelector('.widget-content') || w, h = w.querySelector('h2');
    var img = box.querySelector('img'), a = box.querySelector('a[href]'), cap = box.querySelector('.caption');
    var title = (h ? h.textContent : '').trim(), text = box.textContent.replace(/\\s+/g, ' ').trim();
    var src = img ? (img.currentSrc || img.src) : (/^https?:\\/\\/\\S+\\.(?:jpe?g|png|webp|gif|svg)(\\?\\S*)?$/i.test(text) ? text : '');
    var label = (cap ? cap.textContent.trim() : '') || title || (src ? '' : text);
    if (!src && !label) { continue; }
    var li = document.createElement('li'), holder = a ? document.createElement('a') : document.createElement('span');
    holder.className = 'cert-badge' + (src ? '' : ' is-text');
    if (a) { holder.href = a.href; holder.target = '_blank'; holder.rel = 'noopener'; }
    if (src) { var im = document.createElement('img'); im.src = src; im.alt = label || (img && img.alt) || 'Certification'; im.loading = 'lazy'; holder.appendChild(im); }
    else { holder.textContent = label; }
    li.appendChild(holder);
    if (src && label) { var c = document.createElement('span'); c.className = 'cert-caption'; c.textContent = label; li.appendChild(c); }
    list.appendChild(li);
  }
  if (!list.children.length) { return; }
  var head = document.createElement('p');
  head.className = 'cert-head'; head.textContent = 'Certifications & Memberships';
  sec.style.display = 'none';
  sec.parentNode.appendChild(head); sec.parentNode.appendChild(list);
  sec.parentNode.className += ' has-certs';
})();

// Desktop menu: if the Layout menu needs more than one row""")

out = text
if '--check' in sys.argv:
    if not OUT.exists() or OUT.read_text(encoding='utf-8') != out:
        sys.exit('theme-eficc.xml is stale: run python3 scripts/build.py')
    print('theme-eficc.xml is up to date')
else:
    OUT.write_text(out, encoding='utf-8')
    print(f'wrote {OUT.relative_to(ROOT)} ({len(out.encode())} bytes)')
