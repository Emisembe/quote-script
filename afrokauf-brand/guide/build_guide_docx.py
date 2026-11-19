#!/usr/bin/env python3
"""Build "AfroKauf – How to edit and run everything" as a .docx (uploaded to Drive as a Google Doc).

    python3 build_guide_docx.py <images_dir> <out.docx>
"""
import pathlib
import sys

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

GREEN = RGBColor(0x0E, 0x4D, 0x3A)
CLAY = RGBColor(0xB4, 0x49, 0x1F)
INK = RGBColor(0x1F, 0x24, 0x20)

doc = Document()
for s in doc.sections:
    s.left_margin = s.right_margin = Cm(2.2)
    s.top_margin = s.bottom_margin = Cm(2)
st = doc.styles['Normal']
st.font.name = 'Arial'
st.font.size = Pt(11)
for name, size, color in [('Title', 26, GREEN), ('Heading 1', 18, GREEN), ('Heading 2', 14, CLAY), ('Heading 3', 12, INK)]:
    s = doc.styles[name]
    s.font.name = 'Arial'
    s.font.size = Pt(size)
    s.font.color.rgb = color
    s.font.bold = True


def link(paragraph, text, url):
    part = paragraph.part
    r_id = part.relate_to(url, 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink', is_external=True)
    h = OxmlElement('w:hyperlink')
    h.set(qn('r:id'), r_id)
    r = OxmlElement('w:r')
    rpr = OxmlElement('w:rPr')
    c = OxmlElement('w:color')
    c.set(qn('w:val'), '1D5C7A')
    u = OxmlElement('w:u')
    u.set(qn('w:val'), 'single')
    rpr.append(c)
    rpr.append(u)
    r.append(rpr)
    t = OxmlElement('w:t')
    t.text = text
    t.set(qn('xml:space'), 'preserve')
    r.append(t)
    h.append(r)
    paragraph._p.append(h)


def para(text='', bold_lead=None, style=None):
    p = doc.add_paragraph(style=style)
    if bold_lead:
        p.add_run(bold_lead).bold = True
    # [[text|url]] makes a link
    import re
    pos = 0
    for m in re.finditer(r'\[\[(.+?)\|(.+?)\]\]', text):
        p.add_run(text[pos:m.start()])
        link(p, m.group(1), m.group(2))
        pos = m.end()
    p.add_run(text[pos:])
    return p


def h1(t):
    doc.add_heading(t, level=1)


def h2(t):
    doc.add_heading(t, level=2)


def h3(t):
    doc.add_heading(t, level=3)


def steps(items):
    for it in items:
        if isinstance(it, tuple):
            para(it[1], bold_lead=it[0], style='List Number')
        else:
            para(it, style='List Number')
    restart_numbering()


def bullets(items):
    for it in items:
        if isinstance(it, tuple):
            para(it[1], bold_lead=it[0], style='List Bullet')
        else:
            para(it, style='List Bullet')


_num = [0]


def restart_numbering():
    """Each numbered list starts at 1 (new numbering instance)."""
    numbering = doc.part.numbering_part.numbering_definitions._numbering
    # find the abstractNum used by List Number
    style = doc.styles['List Number']
    num_id = style.element.pPr.numPr.numId.val
    abstract = None
    for n in numbering.findall(qn('w:num')):
        if n.get(qn('w:numId')) == str(num_id):
            abstract = n.find(qn('w:abstractNumId')).get(qn('w:val'))
    if abstract is None:
        return
    new = OxmlElement('w:num')
    new_id = str(1000 + _num[0])
    _num[0] += 1
    new.set(qn('w:numId'), new_id)
    an = OxmlElement('w:abstractNumId')
    an.set(qn('w:val'), abstract)
    new.append(an)
    ov = OxmlElement('w:lvlOverride')
    ov.set(qn('w:ilvl'), '0')
    so = OxmlElement('w:startOverride')
    so.set(qn('w:val'), '1')
    ov.append(so)
    new.append(ov)
    numbering.append(new)
    _pending_restart[0] = new_id


_pending_restart = [None]


def table(header, rows, widths=None):
    t = doc.add_table(rows=1, cols=len(header))
    t.style = 'Light Grid Accent 1'
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, h in enumerate(header):
        cell = t.rows[0].cells[i]
        cell.text = ''
        cell.paragraphs[0].add_run(h).bold = True
    for row in rows:
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = v
    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    doc.add_paragraph()
    return t


def image(path, width_cm=16, caption=None):
    doc.add_picture(str(path), width=Cm(width_cm))
    if caption:
        p = doc.add_paragraph()
        r = p.add_run(caption)
        r.italic = True
        r.font.size = Pt(9)


def note(text):
    p = doc.add_paragraph()
    r = p.add_run('Tip: ')
    r.bold = True
    r.font.color.rgb = CLAY
    p.add_run(text)


# The numbered-list restart trick needs each new list to use its own numId. python-docx applies the
# style's numId; we patch paragraphs after each list instead.
def fix_numbering():
    body = doc.element.body
    current = None
    prev_was_num = False
    counter = [0]
    numbering = doc.part.numbering_part.numbering_definitions._numbering
    style = doc.styles['List Number']
    base_id = style.element.pPr.numPr.numId.val
    abstract = None
    for n in numbering.findall(qn('w:num')):
        if n.get(qn('w:numId')) == str(base_id):
            abstract = n.find(qn('w:abstractNumId')).get(qn('w:val'))
    for p in body.iter(qn('w:p')):
        ps = p.find(qn('w:pPr'))
        sty = ps.find(qn('w:pStyle')).get(qn('w:val')) if ps is not None and ps.find(qn('w:pStyle')) is not None else ''
        is_num = sty in ('ListNumber', 'List Number')
        if is_num and not prev_was_num:
            counter[0] += 1
            current = str(2000 + counter[0])
            new = OxmlElement('w:num')
            new.set(qn('w:numId'), current)
            an = OxmlElement('w:abstractNumId')
            an.set(qn('w:val'), abstract)
            new.append(an)
            ov = OxmlElement('w:lvlOverride')
            ov.set(qn('w:ilvl'), '0')
            so = OxmlElement('w:startOverride')
            so.set(qn('w:val'), '1')
            ov.append(so)
            new.append(ov)
            numbering.append(new)
        if is_num:
            numpr = OxmlElement('w:numPr')
            il = OxmlElement('w:ilvl')
            il.set(qn('w:val'), '0')
            ni = OxmlElement('w:numId')
            ni.set(qn('w:val'), current)
            numpr.append(il)
            numpr.append(ni)
            ps.append(numpr)
        prev_was_num = is_num


def restart_numbering():  # noqa: F811  (replaced by fix_numbering at the end)
    pass


# ====================================================================== CONTENT
IMG = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])

doc.add_heading('AfroKauf – How to edit and run everything', level=0)
para('This guide explains, step by step, how to edit every AfroKauf design, set up the social media pages, run the website, '
     'bring shops on board and run the weekly work. It is written in simple English. Keep it open next to Inkscape when you edit.')
para('Last updated: 19 November 2026', bold_lead='')

h1('1. Your AfroKauf folder')
para('Everything lives in the Google Drive folder “AfroKauf”. Every design has its own folder. Inside you always find:')
bullets([('The picture (.png): ', 'ready to use. Upload it to Facebook, send it on WhatsApp, put it on the website.'),
         ('The Inkscape file (.svg): ', 'the editable project. Open it in Inkscape to change words, photos or colours.'),
         ('A print file (.pdf): ', 'only for things you print (window sticker, flyer, poster).')])
table(['Folder', 'What is inside', 'When you use it'], [
    ['01 Pitch', 'Google Slides in English and German, with a script in the speaker notes', 'Meetings with shop owners and partners'],
    ['02 Guide', 'This document', 'Whenever you are not sure how to do something'],
    ['03 Logo', 'One folder per logo version: colour, reverse, black, white, with tagline, Verbund, stacked, icons', 'Website, documents, signs, profile pictures'],
    ['04 Member badge and shop lockup', 'Round “Mitglied im AfroKauf Verbund” badge and the “shop name + member” design', 'For every shop that joins'],
    ['05 Social media', 'Profile picture and a header for LinkedIn, YouTube, Facebook and X', 'Setting up the pages (section 6)'],
    ['06 Templates', 'Offer post, story, live banner, window sticker, weekly flyer, seminar poster', 'Every week'],
    ['07 Brand guide', 'One page with colours, font and logo rules', 'Send it to printers and helpers'],
    ['08 Fonts', 'The brand font Bricolage Grotesque (free)', 'Install it once (section 2)'],
    ['09 Website', 'The Blogger theme file and its instructions', 'Setting up the website (section 7)'],
    ['10 Shop branding', 'Shop sign, door sign, price labels, shelf badges, stamp card, product photo card, presentation ideas', 'For every member shop (section 14)'],
], widths=[3.5, 7, 6])
image(IMG / 'overview.png', 16, 'The logo family and templates at a glance.')

h1('2. Set up your computer (once)')
h2('2.1 Install Inkscape (free)')
steps(['Go to [[inkscape.org|https://inkscape.org/release/]] and click Download.',
       'Choose your system (Windows or macOS) and install it like any other program.',
       'Open Inkscape once to check it works.'])
h2('2.2 Install the brand font')
steps(['Open the folder 08 Fonts in Google Drive and download the three .ttf files (right-click → Download).',
       'Windows: double-click each file and click Install. Mac: double-click each file and click Install Font.',
       'Close and open Inkscape again. The font is called “Bricolage Grotesque”.'])
note('If a template shows a plain font like Arial instead of the rounded brand letters, the font is not installed yet.')
h2('2.3 The font in Google Slides')
para('Open the pitch in Google Slides. If the letters look plain: click on a text, open the font menu, choose “More fonts”, '
     'search for “Bricolage Grotesque” and add it. Google Slides then shows the brand font everywhere.')

h1('3. Brand basics')
h2('3.1 Colours')
table(['Name', 'Colour code', 'Use it for'], [
    ['Green', '#0E4D3A', 'Main colour: backgrounds, headings, header'],
    ['Gold', '#E9A23B', 'Prices, buttons, highlights'],
    ['Clay', '#C4552D', 'Small titles, second highlight'],
    ['Cream', '#FBF6EE', 'Light backgrounds'],
    ['Sand', '#F3E3C3', 'Boxes and photo frames'],
    ['Ink', '#1F2420', 'Normal text'],
], widths=[3, 3.5, 9.5])
h2('3.2 Which logo where')
table(['Situation', 'Use this logo folder'], [
    ['Cream or white background', 'Logo – colour'],
    ['Green background or a calm photo', 'Logo – reverse'],
    ['Printing in one colour (stamp, receipt)', 'Logo – black or Logo – white'],
    ['Anything for shop owners or partners (seminars, LinkedIn)', 'Verbund logo'],
    ['Small square spaces (app icon, browser tab, profile picture)', 'App icon or Round profile picture'],
], widths=[8, 8])
h2('3.3 Logo rules')
bullets(['Never stretch, squeeze, rotate or recolour the logo.',
         'Leave free space around the logo, at least as big as the letter “A”.',
         'Shops always show their own name first, then the member badge.',
         'On a shared flyer, every price belongs to one named shop (“bei Lagos Taste”). Shops never agree on common selling prices (see section 13).'])

h1('4. Editing in Inkscape – the basics')
h2('4.1 Open a design')
steps(['In Google Drive, open the folder of the design, right-click the .svg file → Download.',
       'In Inkscape: File → Open, choose the downloaded file.',
       'Save a copy straight away with a new name (File → Save As), for example “offer-egusi-week48.svg”. The original stays clean for next time.'])
h2('4.2 The Layers panel')
para('Open it with Layer → Layers and Objects (or Ctrl+Shift+L). Every template has two layers:')
bullets([('Background: ', 'locked (padlock icon), so you cannot move it by accident. Click the padlock to unlock it if you really need to.'),
         ('Artwork and text: ', 'everything you change. Each text you are meant to edit is called “EDIT: …”, for example “EDIT: Price”.')])
h2('4.3 Change a text')
steps(['Press T (Text tool), then click into the text.',
       'Select the old words and type the new ones.',
       'Too long? Make the size smaller in the toolbar at the top. Do not squeeze the letters.',
       'Press Escape when you are done.'])
h2('4.4 Put a photo into a frame')
para('The grey boxes with a camera and “Foto hier einfügen” are photo frames.')
steps(['File → Import, choose your photo, click OK.',
       'Move and resize the photo so it covers the frame. Hold Ctrl while resizing to keep its shape.',
       'Press Page Down until the photo sits under the frame.',
       'Click the photo, hold Shift and click the frame’s dashed rectangle, so both are selected.',
       'Object → Clip → Set Clip. The photo now has the frame’s shape.',
       'Delete the camera icon and the words “Foto hier einfügen” in that frame (click them, press Delete).'])
note('Use bright, sharp photos taken in daylight. Clean the shelf or table first. One product per photo looks best.')
h2('4.5 Add a QR code')
steps(['Click the dashed “QR-Code hier” box and delete it.',
       'Extensions → Render → Barcode → QR Code.',
       'Paste the web address (for example the shop’s page on afrokauf.de) into “Text”, then click Apply and close the window.',
       'Move the code to where the box was. Hold Ctrl while resizing so it stays square. Keep it black on white.',
       'Test it with your phone camera before printing.'])
h2('4.6 Change a colour')
para('Select the object, open Object → Fill and Stroke (Ctrl+Shift+F) and type the colour code from section 3.1 into the RGBA field (add “ff” at the end, for example 0E4D3Aff).')
h2('4.7 Export')
table(['For', 'How', 'Settings'], [
    ['Social media, WhatsApp', 'File → Export (Ctrl+Shift+E) → Page → PNG → Export', 'Leave the size as it is: the templates already have the right size'],
    ['Printing', 'File → Save a Copy → PDF', 'Tick “Convert text to paths” so the printer sees the right font'],
    ['Website', 'Export as PNG', 'Keep files under 1 MB'],
], widths=[3.5, 7, 5.5])
h2('4.8 Common problems')
table(['Problem', 'Solution'], [
    ['Text shows in a plain font', 'Install the brand font (section 2.2) and restart Inkscape'],
    ['I cannot click something', 'It is on the locked Background layer. Unlock it in the Layers panel'],
    ['The photo sticks out of the frame', 'Repeat the clip steps in 4.4'],
    ['I made a mistake', 'Ctrl+Z undoes it, as often as you need'],
    ['The design looks blurry on Facebook', 'Export again as PNG at the original size, not as a screenshot'],
], widths=[6, 10])

h1('5. Step by step: the most common jobs')
h2('5.1 A member lockup for a new shop (2 minutes)')
steps(['Open 04 Member badge and shop lockup → Shop name + member lockup → the .svg.',
       'Change “Dein Shopname” to the shop’s name and “Frankfurt am Main” to its city.',
       'Save As “<shopname>-member.svg”, then export a PNG.',
       'Send the PNG to the shop on WhatsApp with a short message, and add it to their page on the website.'])
image(IMG / 'member-lockup.png', 12, 'The shop’s own name first, then “Mitglied im AfroKauf Verbund”.')
h2('5.2 Offer of the week (social post 1080 × 1080)')
steps(['Open 06 Templates → Offer of the week post → the .svg.',
       'Put in the product photo (section 4.4).',
       'Change product name, price, old price, shop name and city.',
       'Export PNG and post it on Instagram, Facebook, WhatsApp Status and the WhatsApp Channel.'])
image(IMG / 'social-post.png', 9)
h2('5.3 Story (1080 × 1920)')
para('Same steps as 5.2 with the story template. Keep text away from the top and bottom 250 pixels: apps cover them with buttons.')
h2('5.4 Weekly offers flyer (A4)')
steps(['Collect six offers from member shops by Wednesday: product, price, photo, shop name and city.',
       'Open the flyer template, change the week (“KW 48”), the dates and the region.',
       'Fill the six offers. Every offer names its shop.',
       'Update the line “Teilnehmende Shops”.',
       'Save a Copy as PDF: send it on WhatsApp and print a few for each shop.'])
h2('5.5 Window sticker for a shop (A6)')
steps(['Open the window sticker template.',
       'Replace the QR box with a QR code to the shop’s page (section 4.5).',
       'Save a Copy as PDF and order it as a window sticker (“Fensteraufkleber, innen klebend”) so it can be read from outside.'])
h2('5.6 Seminar poster (A4) and live banner')
para('Change the title, date, place, price and points. Add a QR code to the registration page. '
     'The live banner (1920 × 1080) is the picture people see before a live video starts: change the title, day and time.')

h1('6. Social media setup')
h2('6.1 Accounts and which files to upload')
table(['Platform', 'Account name', 'Profile picture', 'Header'], [
    ['LinkedIn (company page)', 'AfroKauf Verbund', 'Profile picture – green', 'LinkedIn company cover'],
    ['LinkedIn (your own profile)', 'Your name', 'Your photo', 'LinkedIn personal banner'],
    ['YouTube', 'AfroKauf', 'Profile picture – green', 'YouTube banner + YouTube watermark'],
    ['Facebook page', 'AfroKauf', 'Profile picture – green', 'Facebook cover'],
    ['Instagram', '@afrokauf', 'Profile picture – green', 'none'],
    ['X', '@afrokauf', 'Profile picture – green', 'X header'],
    ['WhatsApp Business + WhatsApp Channel', 'AfroKauf', 'Profile picture – green', 'none'],
    ['TikTok', '@afrokauf', 'Profile picture – green', 'none'],
], widths=[4.5, 3.5, 4, 4])
note('Check that the names are free on every platform before you print anything with them.')
h2('6.2 Where to upload (apps change their menus from time to time)')
bullets([('LinkedIn: ', 'open your company page → Edit page → logo and cover image.'),
         ('YouTube: ', 'YouTube Studio → Customisation → Branding: picture, banner image and video watermark.'),
         ('Facebook: ', 'your page → click the profile picture or the cover photo → upload.'),
         ('Instagram, X, TikTok: ', 'Edit profile → change photo (X also has a header).'),
         ('WhatsApp Business: ', 'Settings → your business name → profile photo. A WhatsApp Channel has its own photo in the channel settings.')])
h2('6.3 Safe zones')
para('Every platform cuts its header differently on phones, computers and TVs. Each header file has a hidden layer called “Safe zone guide”. '
     'Click the eye icon in the Layers panel to see it: keep text and logo inside the red dashed box, then hide the layer again before exporting.')
image(IMG / 'social-guides.png', 16, 'Headers with the safe zone (red dashed box) and where the profile photo covers them.')
h2('6.4 Profile texts (copy and adapt)')
table(['Language', 'Text'], [
    ['English', 'African shops in Germany, together. Find your foods near you · weekly offers · live every Friday · afrokauf.de'],
    ['Deutsch', 'Afrikanische Shops in Deutschland, gemeinsam stark. Finde deine Lebensmittel in deiner Nähe · Wochenangebote · jeden Freitag live · afrokauf.de'],
    ['LinkedIn (Verbund)', 'AfroKauf Verbund connects independent African shops in Germany: shared marketing, joint buying and seminars, while every owner stays the owner.'],
], widths=[3.5, 12.5])
h2('6.5 Weekly content plan')
table(['Day', 'Post', 'Template'], [
    ['Monday', 'Offer of the week from one member shop', 'Offer of the week post + story'],
    ['Wednesday', 'Shop spotlight: photo and short story of one shop', 'Offer post with a shop photo'],
    ['Friday 18:00', 'Live video: fresh goods from several shops', 'Live banner'],
    ['Saturday', 'Weekly offers flyer', 'Weekly offers flyer (PDF + PNG)'],
    ['Once a month', 'Seminar announcement', 'Seminar poster'],
], widths=[3, 7.5, 5.5])
h2('6.6 Running the Friday live video')
steps(['By Wednesday: ask three shops what is new and agree a 5-minute slot each.',
       'Thursday: post the live banner with the time.',
       'Friday: phone on a stand, good light, quiet room. Start with a hello and the shops in this live.',
       'Show each product, its price and the shop’s name and city. Ask viewers to write their city in the comments.',
       'End with: “All shops on afrokauf.de – see you next Friday.”',
       'Afterwards: save the video and post short clips during the week.'])
note('Only use music you are allowed to use (free or licensed music). Ask every person on camera for permission.')

h1('7. The website (Blogger)')
h2('7.1 Install the theme')
steps(['Make a Blogger blog at blogger.com with your Google account.',
       'Theme → arrow next to “Customise” → Restore → upload the theme file from 09 Website.',
       'If Blogger says “Could not restore theme”: Theme → arrow → Edit HTML, paste the whole file, Save. The error message then shows exactly what is wrong.',
       'Theme → arrow → Mobile settings → Desktop.',
       'Settings → Site feed → Allow blog feed: Full.',
       'Settings → Comments → moderation: Always (comments are shown as reviews).'])
h2('7.2 Add a shop')
steps(['New post. Title = the shop’s name.',
       'Switch to HTML view and paste the shop block from the website README. Fill in address, opening hours, phone, WhatsApp and the products the shop sells.',
       'Go back to the normal view: write 2–3 sentences about the shop and add 2–5 photos.',
       'Labels: Shop, the category (for example Food), the city (for example Frankfurt) and the state (for example Hessen). Add Featured for Premium members.',
       'Publish and check the page on your phone.'])
note('The product list is what customers search. Write the words people really type: egusi, gari, plantain, braiding hair, also German names.')
h2('7.3 Add a seminar or event')
para('A post with the label Events and the event block (date, time, place, price, registration link). It appears on the homepage automatically and disappears after the date.')
h2('7.4 Things you change in Layout')
para('Menu, homepage text, categories, cities, plans and prices, footer and the German words for buttons are all gadgets in Blogger’s Layout page. Click the pencil icon on a gadget to edit it.')
h2('7.5 Everything you can change in Layout')
para('Open Blogger → Layout. Every box is a gadget: click its pencil icon, change the text or links, click Save. The changes are live straight away.')
table(['Gadget', 'What it changes'], [
    ['Announcement bar', 'The thin bar above the header (news, a seminar date). Remove the gadget to hide the bar.'],
    ['Site name (Header)', 'Blog name and tagline. You can also upload a logo picture here instead of the text.'],
    ['Menu and “List your shop” button', 'The links in the header.'],
    ['African shops across Germany', 'The homepage title line and intro text.'],
    ['Slideshow (the gadget with no title, first in the homepage section)', 'The sliding banners on the homepage (section 7.7).'],
    ['How it works', 'The three steps for customers on the homepage.'],
    ['Browse by category', 'The category tiles. Each link is /search/label/<Category>. Each tile gets its own icon (basket, afro comb, shirt, plate, parcel, boxes). For a new category, choose one by adding data-icon="food" (or beauty, fashion, restaurant, services, wholesale) to its link.'],
    ['Featured shops', 'The intro text. The shops shown are the posts with the label Featured.'],
    ['Shops by city', 'The city tiles. They also fill the “Where?” list in the search. Add a city when its first shop joins. Each tile shows its Bundesland with a dot where the city is; about 90 big cities are known. For a smaller town, add its place to the link: data-state="Thüringen" data-lat="50.95" data-lng="10.70" (from Google Maps, right-click).'],
    ['Shops by state', 'All 16 Bundesländer with their outline shapes, also in the “Where?” list. The outlines come from Natural Earth, which is public domain, so no credit line is needed.'],
    ['Seminars & events', 'The intro text. The events shown are the posts with the label Events.'],
    ['Own an African shop?', 'Plans and prices for shop owners.'],
    ['Partners and supporters', 'Text and partner logos.'],
    ['Directory settings', 'Label names and page addresses the site uses. Add “date_language: de-DE” for German dates.'],
    ['Site words', 'Translate any button or message, one per line, for example “Near me: In meiner Nähe”.'],
    ['Footer: About us, For shop owners, Follow us, Legal', 'The four footer columns.'],
    ['Favicon (top of the Layout page)', 'The small icon in the browser tab (section 7.6).'],
], widths=[5.5, 10.5])
note('Never delete the gadget called “Blog posts” (it shows the shops) or “Directory settings”.')
h2('7.6 Favicon (the icon in the browser tab)')
steps(['Download favicon.ico from 03 Logo → Favicons (website tab icon).',
       'Blogger → Layout → Favicon (top of the page) → Edit.',
       'Upload favicon.ico (if Blogger asks for a picture, use the 32×32 PNG) and click Save.',
       'Open your site in a new tab: the green bag icon appears next to the page title. Browsers sometimes take a day to show a new favicon.'])
h2('7.7 Edit the slideshow')
para('The slideshow changes slide every few seconds. Each slide is one line in the gadget, like this:')
para('<li data-tone="green"><h3>Title</h3><p>One or two sentences.</p><a href="/p/list-your-shop.html">Button text</a></li>')
steps(['Layout → the first gadget in the homepage section (it has no title) → pencil icon.',
       'Change the title, text, button text or link of a slide. Copy a whole <li>…</li> line to add a slide; delete one to remove it.',
       'Colour: data-tone="green", "gold" or "clay".',
       'Photo (optional): upload the photo into a draft post, click it, copy its address, and add <img src="paste address here"> inside the <li>. The text stays on top of the photo.',
       'Save. Use 2–5 slides: more than five and nobody sees the last ones.'])
note('Good slides: offer of the week, next seminar, a new member shop, “list your shop for free”.')
h2('7.8 Before going live')
bullets(['Pages: List your shop, Contact, Impressum, Datenschutz, Terms for shop owners.',
         'Connect your own domain (afrokauf.de) in Settings → Custom domain.',
         'Test: homepage, a shop page, a city page, a search, the phone menu, a test comment.'])

h1('8. Bringing shops on board')
h2('8.1 What to say (first visit or WhatsApp)')
table(['Language', 'Message'], [
    ['English', 'Hello, I’m [name] from AfroKauf. We are building one website and one social media network for African shops in Germany, so customers can find you. Joining is free. Can I create a page for your shop?'],
    ['Deutsch', 'Hallo, ich bin [Name] von AfroKauf. Wir bauen eine gemeinsame Website und Social-Media-Seiten für afrikanische Shops in Deutschland, damit Kunden Sie finden. Der Beitritt ist kostenlos. Darf ich eine Seite für Ihren Shop anlegen?'],
], widths=[3, 13])
h2('8.2 What to collect')
bullets(['Shop name, address, phone, WhatsApp number', 'Opening hours for every day',
         '10–20 products customers ask for (the words they really use)', 'Countries the products come from, extra services (delivery, money transfer, catering)',
         '3–5 photos (shop front, shelves, popular products)',
         'Written permission to publish all of this, for example a “Yes” on WhatsApp. Keep it.',
         'For Premium: billing name, address and email'])
h2('8.3 Within 48 hours')
steps(['Create the shop page (section 7.2).', 'Make the member lockup (5.1) and the window sticker (5.5).',
       'Send both on WhatsApp with the link to their page.', 'Add the owner to the members’ WhatsApp community.',
       'Offer the shop branding kit (section 14): sign, door sign, price labels, stamp cards.'])
h2('8.4 Keep the information fresh')
para('Every three months, send each shop a short message: “Are your opening hours, phone and products still right?” Wrong opening hours lose trust fast.')

h1('9. Seminars')
table(['When', 'What to do'], [
    ['8 weeks before', 'Choose topic, date and room. Ask a speaker. Set the price (members less).'],
    ['6 weeks before', 'Make the seminar poster and an event post on the website. Open registration.'],
    ['4 weeks before', 'Post on all channels, send the poster to member shops, print a few.'],
    ['1 week before', 'Remind everyone who registered. Prepare name tags and a sign-in list.'],
    ['On the day', 'Welcome, short round of names, the talk, questions, a group photo (with permission).'],
    ['After', 'Thank-you message with the slides, a 3-question feedback form, plan the next topic.'],
], widths=[3.5, 12.5])
para('Good first topics: Instagram and WhatsApp marketing; food import rules and German labels; cash-register rules (TSE) and receipts; getting Google reviews.')

h1('10. The buying-together pilot')
steps(['Choose one city and 3–5 member shops who trust each other.',
       'Choose one product they all buy every month (for example rice, palm oil or frozen fish).',
       'Ask each shop how much they buy per month and what they pay now. Write it down.',
       'Ask 2–3 wholesalers or importers for a price for the combined amount.',
       'Each shop orders and pays the supplier directly. AfroKauf never holds the money or the goods in the pilot.',
       'After three months, compare: how much did each shop save? Share the result with all members.'])
note('Shops buy together and advertise together, but never agree on selling prices among themselves. That is against German competition law.')

h1('11. Presenting the pitch')
h2('11.1 Where the script is')
steps(['Open 01 Pitch → the Google Slides deck (English or German).',
       'View → Show speaker notes: the script for each slide appears under the slide.',
       'To present: Slideshow → Presenter view. You see the script and the next slide; the audience only sees the slide.',
       'Replace the placeholders first: [Your name], [Date], [Name], [Phone / WhatsApp], [Email] and the phase 1 targets [50] shops in [3] cities.'])
h2('11.2 How the script is built')
para('Each slide’s script has three parts: TRANSITION IN (the sentence that links it to the slide before), the main talk with the KEY POINT, '
     'and TRANSITION OUT (the sentence that leads to the next slide). Say the transition out, then click to the next slide.')
h2('11.3 Connecting phrases')
table(['Moment', 'English', 'Deutsch'], [
    ['Opening', 'Let me begin with the big picture.', 'Lassen Sie mich mit dem großen Ganzen beginnen.'],
    ['Context to problem', 'With that in mind, …', 'Vor diesem Hintergrund …'],
    ['Key question', 'This raises an important question.', 'Das wirft eine wichtige Frage auf.'],
    ['Your answer', 'Building on this idea, …', 'Darauf aufbauend …'],
    ['Make it concrete', 'Let me make this concrete.', 'Lassen Sie mich das konkret machen.'],
    ['Main point', 'The key point here is …', 'Der entscheidende Punkt ist …'],
    ['Say it simply', 'In other words, …', 'Mit anderen Worten …'],
    ['A doubt', 'Of course, you may be wondering …', 'Nun fragen Sie sich vielleicht …'],
    ['Pull together', 'Taken together, …', 'Alles in allem …'],
    ['Close', 'To sum up, …', 'Kurz gesagt …'],
], widths=[3.5, 6, 6.5])
h2('11.4 Practice tips')
bullets(['Practise twice out loud with the timer: aim for 12–15 minutes.', 'Look at people, not at the slide. The slide supports you; you tell the story.',
         'Pause after each KEY POINT for two seconds.', 'End on time and invite questions.'])

h1('12. Weekly and monthly routine')
table(['When', 'Task'], [
    ['Monday', 'Post the offer of the week. Answer messages from the weekend.'],
    ['Tuesday', 'Visit or call 2–3 new shops. Create pages for shops that said yes.'],
    ['Wednesday', 'Collect offers for the flyer. Post a shop spotlight.'],
    ['Thursday', 'Announce Friday’s live. Read and approve website comments.'],
    ['Friday', 'Live video at 18:00.'],
    ['Saturday', 'Send the weekly offers flyer.'],
    ['Monthly', 'Seminar planning, invoices for Premium, check the numbers: shops, followers, website visits, Premium members.'],
    ['Every 3 months', 'Check every shop’s information. Review prices and plans.'],
], widths=[3.5, 12.5])

h1('13. Legal and admin in Germany (checklist)')
para('This is a checklist, not legal advice. Ask the IHK (chamber of commerce), a tax adviser or a lawyer for your own case.')
bullets([('Business registration: ', 'register a trade (Gewerbeanmeldung) at your town hall before you take money for listings or seminars.'),
         ('Impressum: ', 'the website needs a legal notice with your name and address.'),
         ('Privacy (DSGVO): ', 'a Datenschutzerklärung on the website, and written permission from each shop before you publish its data and photos.'),
         ('Photos and people: ', 'only use photos you took or were allowed to use; ask people before filming or photographing them.'),
         ('Terms for Premium: ', 'clear terms (AGB) for paid listings: price, what is included, how to cancel.'),
         ('Taxes and invoices: ', 'ask a tax adviser about the small-business rule (Kleinunternehmerregelung) and VAT.'),
         ('Competition law: ', 'shops buy and advertise together, but never agree on selling prices.'),
         ('Brand protection: ', 'consider registering “AfroKauf” as a trademark at the DPMA, and keep the domain afrokauf.de.'),
         ('Music: ', 'use only free or licensed music in videos and lives.')])

h1('14. Shop branding kit for member shops')
para('Folder 10 Shop branding has a ready design for everything a shop shows its customers. Each folder holds the picture (.png), '
     'the Inkscape project (.svg) and a print file (.pdf). Change the shop’s name, phone and prices in Inkscape (section 4), then print or post.')
image(IMG / 'shop-kit.png', 16, 'Shop sign, door sign, price labels, shelf badges, stamp card, product photo card and the ideas page.')
table(['Design', 'Size', 'How the shop uses it'], [
    ['Shop sign', '3 : 1 (300 × 100 mm, printers scale it)', 'Over the door or in the window. Change the name, what they sell and the phone number.'],
    ['Door sign: opening hours', 'A5', 'On the door. Change the name, the hours for each day, and add a QR code to the shop’s page.'],
    ['Price labels', 'A4 sheet, 8 labels', 'On shelves. Product, origin, price and the unit price (Grundpreis).'],
    ['Shelf badges', 'A4 sheet, 6 round badges', 'NEU, FRISCH, ANGEBOT, BELIEBT and “Aus …” badges for shelves and the new-arrivals corner.'],
    ['Stamp card (front and back)', '85 × 55 mm (business card)', 'Loyalty card: 10 stamps = 1 small gift. Print front and back.'],
    ['Product photo card', '1080 × 1080 px', 'For the WhatsApp Business catalogue, Status and Instagram: product photo, price, shop.'],
    ['Shop presentation ideas', 'A4', 'Ten ideas to give every member shop when they join.'],
], widths=[4, 4.5, 7.5])
h2('14.1 Prices and the law')
para('In Germany, shops must show the unit price (Grundpreis: the price per kg, per litre or per 100 g) next to the selling price '
     'for goods sold by weight or volume. That is why every price label has a Grundpreis line. Ask the IHK if you are unsure.')
h2('14.2 Printing tips')
bullets(['Online printers (for example for signs, stickers and cards) want PDF files: use the (print).pdf in each folder, or Save a Copy as PDF from Inkscape.',
         'Signs: tell the printer the real size (for example 150 × 50 cm). The design scales without losing quality.',
         'Price labels and badges: print on thick paper or sticker paper and cut along the dashed lines.',
         'Stamp cards: order as business cards, printed on both sides.'])

h1('15. Words used in this guide')
table(['Word', 'Meaning'], [
    ['SVG', 'The editable Inkscape file of a design'], ['PNG', 'A finished picture, ready to post or send'],
    ['PDF', 'A finished file for printing'], ['Layer', 'A sheet inside a design; some are locked so you don’t move them by accident'],
    ['Clip', 'Putting a photo into a shape, so it takes that shape'], ['Safe zone', 'The part of a header that every device shows'],
    ['Lockup', 'A fixed combination, for example the shop name next to the member badge'],
    ['Speaker notes', 'The script under each slide in Google Slides'],
], widths=[3.5, 12.5])

fix_numbering()
doc.save(OUT)
print(OUT)
