#!/usr/bin/env python3
"""Build "AfroKauf website: from zero to live" as a .docx (uploaded to Drive as a Google Doc).
    python3 build_setup_guide_docx.py <images_dir> <out.docx>
One complete guide for anybody: every step from an empty Blogger account to a live website.
"""
import pathlib
import sys

_here = pathlib.Path(__file__).with_name('build_guide_docx.py').read_text(encoding='utf-8')
exec(compile(_here.split('# ====================================================================== CONTENT')[0], 'build_guide_docx.py', 'exec'))

IMG = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])


def code(text):
    t = doc.add_table(rows=1, cols=1)
    t.style = 'Table Grid'
    cell = t.rows[0].cells[0]
    shade = OxmlElement('w:shd')
    shade.set(qn('w:val'), 'clear')
    shade.set(qn('w:fill'), 'F4F1EA')
    cell._tc.get_or_add_tcPr().append(shade)
    cell.text = ''
    lines = text.split('\n')
    p = cell.paragraphs[0]
    for i, line in enumerate(lines):
        r = p.add_run(line)
        r.font.name = 'Courier New'
        r.font.size = Pt(9)
        if i < len(lines) - 1:
            r.add_break()
    doc.add_paragraph()


def check(items):
    for it in items:
        para('☐  ' + it)


def img(name, width, caption):
    p = IMG / name
    if p.exists():
        image(p, width, caption)


doc.add_heading('AfroKauf website: from zero to live', level=0)
para('This is the one guide to set up the AfroKauf website, from an empty Blogger account to a live site with shops, '
     'products, orders and a newsletter. Follow the parts in order. Every step says exactly where to click. '
     'You do not need to know any code: where code is needed, you copy and paste it.')
para('Last updated: 25 November 2026')

h2('What you need before you start')
bullets([('A Google account ', 'for AfroKauf (e.g. infoafrokauf@gmail.com). Use the same account for Blogger, Google Drive, Sheets and Gmail.'),
         ('The AfroKauf Drive folder. ', 'Everything you need is there: 09 Website (theme, page codes, script), 02 Guide (all guides), 03 Logo (logo and favicon).'),
         ('A computer ', 'with Chrome or Edge. Blogger works on a phone, but setting up is much easier on a computer.'),
         ('About 2 hours ', 'for the whole setup. You can stop after any part and continue later.')])
table(['Part', 'What you do', 'Time'], [
    ['1', 'Create the blog', '10 min'],
    ['2', 'Upload the AfroKauf theme', '10 min'],
    ['3', 'Blogger settings that matter', '15 min'],
    ['4', 'Create the pages', '20 min'],
    ['5', 'Fill in the Layout gadgets', '30 min'],
    ['6', 'Connect the Google Sheet (sign-ups, orders, newsletter)', '30 min'],
    ['7', 'Add the first shop, product and article', '20 min'],
    ['8', 'Test everything (checklist)', '15 min'],
    ['9', 'Languages (English, Deutsch, Français, later Kiswahili, Amharic, Tigrinya)', '10 min'],
    ['10', 'Your own domain (optional)', '15 min'],
    ['11', 'The daily and weekly routine', '–'],
    ['12', 'Problems and fixes', '–'],
], widths=[1.4, 12, 3])

# ------------------------------------------------------------------ 1
h1('1. Create the blog')
steps(['Open blogger.com and sign in with the AfroKauf Google account.',
       'Click “Create blog” (or “New blog” in the menu on the left if you already have a blog).',
       'Name: AfroKauf. Click Next.',
       'Address: choose the web address, e.g. afrokauf.blogspot.com. If it is taken, try afrokauf-verbund. You can add your own domain later (part 10).',
       'Display name: AfroKauf Verbund. Click Finish.'])
para('You now see the Blogger dashboard. The menu on the left has: Posts, Stats, Comments, Pages, Layout, Theme, Settings and “View blog”.')

# ------------------------------------------------------------------ 2
h1('2. Upload the AfroKauf theme')
steps(['Download “AfroKauf Blogger theme (upload in Blogger).xml” from Drive › AfroKauf › 09 Website to your computer.',
       'In Blogger, click Theme in the menu on the left.',
       'Next to the big orange “Customise” button there is a small arrow ▾. Click it › Backup. Save the file. (On a new blog this is the empty default theme; on an existing blog it is your safety copy.)',
       'Click the arrow ▾ again › Restore › Upload › choose the AfroKauf .xml file.',
       'Wait for “Theme restored”. Click “View blog”: you see the green AfroKauf header, the search box and the homepage sections.'])
note('If Blogger only says “Could not restore theme”: Theme › ▾ › Edit HTML, select all the code in the box, paste the whole .xml file, click the save icon. That screen shows the exact error. Send a screenshot of it.')
h2('2.1 Phones must get the same design')
steps(['Theme › arrow ▾ › Mobile settings.', 'Choose “Desktop” (Show desktop theme on mobile devices: Yes). Save.'])
para('The AfroKauf theme is made for phones and computers. Blogger’s own mobile theme would hide everything.')

# ------------------------------------------------------------------ 3
h1('3. Blogger settings that matter')
para('Click Settings in the menu on the left. Change these, leave everything else as it is.')
table(['Where (Settings ›)', 'Setting', 'Set it to', 'Why'], [
    ['Basic', 'Title', 'AfroKauf', 'Shown in the browser tab and on Google'],
    ['Basic', 'Description', 'African shops across Germany: find food, hair & beauty, fashion and more near you.', 'Google shows it under the title'],
    ['Basic', 'Blog language', 'Deutsch', 'Blogger’s own words (comment form, dates) in German'],
    ['Basic', 'Favicon', 'Upload favicon.ico or the 32×32 PNG from Drive › 03 Logo › Favicons', 'The small icon in the browser tab'],
    ['Privacy', 'Visible to search engines', 'On', 'So Google finds the shops'],
    ['Publishing', 'HTTPS redirect', 'On', 'Safe connection, needed for “Near me”'],
    ['Comments', 'Comment moderation', 'Always', 'Reviews are read by you before they appear'],
    ['Comments', 'Who can comment', 'Users with Google Accounts', 'Fewer spam reviews'],
    ['Formatting', 'Time zone', '(GMT+01:00) Berlin', '“Open now” and dates use German time'],
    ['Meta tags', 'Enable search description', 'On', 'You can write a Google text for each shop'],
    ['Site feed', 'Allow blog feed', 'Full', 'IMPORTANT: search, deals, products and the price check read the feed'],
    ['Site feed', 'Post feed redirect URL', 'empty', ''],
], widths=[2.6, 3.4, 5.4, 5.1])
note('“Allow blog feed: Full” is the one setting people forget. Without it the search finds nothing and orders say “no longer available”.')

# ------------------------------------------------------------------ 4
h1('4. Create the pages')
para('Pages are fixed pages like “Contact”. Click Pages › New page. Type the title, write or paste the content, click Publish. '
     'The title decides the address: “List your shop” becomes /p/list-your-shop.html, which is exactly what the buttons on the site link to.')
table(['Title (type exactly)', 'Content', 'Address'], [
    ['List your shop', 'The sign-up form: paste “List your shop – page code” in HTML view (part 6.4)', '/p/list-your-shop.html'],
    ['Add products', 'The products form for listed shops: paste “Add products – page code” in HTML view (part 6.4)', '/p/add-products.html'],
    ['Contact', 'Your email, WhatsApp number and, if you want, a short contact text', '/p/contact.html'],
    ['Impressum', 'Legally required: name, address, email, phone of the person or company behind AfroKauf', '/p/impressum.html'],
    ['Datenschutz', 'Legally required privacy policy: what data you collect (forms, orders, newsletter, comments, WhatsApp) and why', '/p/datenschutz.html'],
    ['Terms for shop owners', 'Rules for listings, Premium price, cancellation', '/p/agb.html (rename the page address to agb if needed)'],
], widths=[3.4, 9, 4.1])
bullets([('Impressum and Datenschutz: ', 'a German website needs both before it goes live. Use a generator (for example from eRecht24 or your IHK) and have the result checked. Add the parts about the sign-up form, orders, WhatsApp and the newsletter (text in the sign-up guide, part 2.9).'),
         ('Code pages: ', 'for “List your shop” and “Add products” click the pencil icon at the top left › HTML view before pasting. Never switch these two pages back to Compose view: that can break the form.'),
         ('Page address wrong? ', 'Open the page › Page settings on the right › Permalink › Custom permalink.')])

# ------------------------------------------------------------------ 5
h1('5. Fill in the Layout gadgets')
img('home-top.png', 16, 'The homepage: slideshow, benefits strip, promo banners, categories and deals.')
para('Click Layout. Every box is a gadget. Click the pencil icon on a gadget to change it, then Save. Drag gadgets up or down to change the order. '
     'The changes are live straight away: keep a second tab with your website open and reload it to check.')
para('Go through the gadgets from top to bottom:', bold_lead='')
table(['Gadget in Layout', 'What it is', 'What to do'], [
    ['Announcement bar', 'Thin bar above the header', 'Write your current news, or remove the gadget to hide the bar'],
    ['Site name (Header)', 'Logo and name at the top left', 'Keep the text, or upload the logo image (Drive › 03 Logo)'],
    ['Menu (no title, in the header)', 'Find a shop, Shop, Categories, Cities, Events', 'Change names or add links: one <li><a href="…">Name</a></li> per line'],
    ['“List your shop” button', 'The gold button in the header', 'Keep it'],
    ['African shops across Germany', 'The big welcome text', 'Write 2–3 sentences about AfroKauf'],
    ['Slideshow (no title, first on the homepage)', 'Sliding banners', 'One <li> per slide: title, text, button. Colours: green, gold, clay. A photo with <img src="…">'],
    ['Benefits strip (no title)', '4 boxes with icons', 'Change the words and icons'],
    ['Promo banners (no title)', '2 big coloured banners', 'Title, text, button, colour, optional picture'],
    ['How it works', '3 steps for customers', 'Change the words'],
    ['Browse by category', 'Category tiles', 'Keep the links; you may rename the tiles. These names also feed the search'],
    ['Deals of the week', 'Products with an offer', 'Nothing: fills itself'],
    ['Products from our shops', 'Row of products', 'Nothing: fills itself'],
    ['Featured shops', 'Shops with the label Featured (Premium)', 'Change the intro text'],
    ['Our member shops', 'Row of logos', 'Add member shops’ logos (with their permission)'],
    ['Shops by city', 'City tiles', 'Add a city when its first shop joins. Also fills the “Where?” list in the search'],
    ['Shops by state', 'All 16 Bundesländer', 'Keep it'],
    ['Spotlight (no title)', '“Everything for your kitchen” band', 'Headline, tiles, colour'],
    ['AfroKauf Magazine', 'Row of articles', 'Nothing: fills itself from posts with the label Magazine'],
    ['Seminars & events', 'Next events', 'Change the intro; events fill themselves'],
    ['Own an African shop?', 'Plans and prices', 'Check the prices; keep the plan classes'],
    ['Questions and answers', 'Fold-open questions', 'Write your own questions and answers'],
    ['Partners and supporters', 'Partners’ text and logos', 'Write the text, add logos when you have partners'],
    ['Directory settings (bottom, hidden on the site)', 'Settings the script uses', 'Part 6.3: paste the web app address after crm_endpoint:'],
    ['Language: Deutsch, Français, Kiswahili, Amharic, Tigrinya (bottom, hidden)', 'All texts of the site in that language', 'Part 9'],
    ['Site words: English changes (bottom, hidden)', 'Optional: rename an English text', 'Usually nothing'],
    ['Newsletter band (footer, no title)', '“Never miss an offer”', 'Change the text; the form appears after part 6.3'],
    ['About us, For shop owners, Follow us, Legal (footer)', 'The 4 footer columns', 'Your text; your real social media links (Instagram, Facebook, YouTube, TikTok, LinkedIn)'],
], widths=[4.2, 5, 7.3])
note('Section codes for new homepage sections (benefits, banners, rows of products, spotlight, FAQ, logos) are in the guide “AfroKauf – Homepage sections and the shop”, part 2.2.')

# ------------------------------------------------------------------ 6
h1('6. Connect the Google Sheet')
para('The Google Sheet is your office: every shop sign-up, order, product and newsletter subscriber lands there, and you send all emails from it. '
     'This part is also described in detail in the guide “AfroKauf – Shop sign-ups and shop pages”, part 2.')
h2('6.1 Make the sheet and add the script')
steps(['Drive › AfroKauf › 09 Website › New › Google Sheets › Blank spreadsheet. Name it: AfroKauf – Shop sign-ups.',
       'In the sheet: Extensions › Apps Script. Name the project: AfroKauf sign-ups.',
       'Delete the few lines in Code.gs. Open “Apps Script code (Code.gs).txt” from Drive › 09 Website › Sign-up form, copy everything, paste it. Save (Ctrl+S).',
       'Above the code choose setup in the list next to “Debug”, click Run.',
       'Google asks for permission: Review permissions › your account › Advanced › “Go to AfroKauf sign-ups (unsafe)” › Allow. This is normal for your own script.',
       'Back in the sheet you see the tabs Sign-ups, Settings, Campaigns, Send log, Orders, Subscribers and Products, and a new menu “AfroKauf” (reload the sheet if you do not see it).'])
h2('6.2 Publish the script')
steps(['In Apps Script: Deploy › New deployment › gear icon › Web app.',
       'Description: AfroKauf website. Execute as: Me. Who has access: Anyone. Deploy.',
       'Copy the Web app URL. It starts with https://script.google.com/macros/s/ and ends with /exec. Keep it in a note: you need it three times.',
       'Test: open the address in a new tab. It says “AfroKauf sign-up form is connected.”'])
h2('6.3 Put the address in three places')
table(['Where', 'What to do'], [
    ['Blogger › Layout › Directory settings › pencil', 'After crm_endpoint: paste the address. Save. This switches on the order form and the newsletter band'],
    ['The sheet › Settings tab › “Web app address”', 'Paste it if it is empty. Confirm and unsubscribe links in emails need it'],
    ['The two code pages (part 6.4)', 'Between the quotes of ENDPOINT'],
], widths=[6.5, 10])
code('crm_endpoint: https://script.google.com/macros/s/AKfy...your-code.../exec')
h2('6.4 The two form pages')
steps(['Open “List your shop – page code (paste in Blogger).txt” from Drive › 09 Website › Sign-up form. Copy everything.',
       'Blogger › Pages › New page › title “List your shop” › pencil icon › HTML view › paste.',
       'Near the bottom, find var ENDPOINT = \'PASTE_YOUR_WEB_APP_URL_HERE\'; and put your address between the quotes. On the next line put your WhatsApp number (4915112345678, no + or spaces). Publish.',
       'Do the same with “Add products – page code” on a page titled “Add products”.'])
img('form-phone.png', 6, 'The “List your shop” form on a phone.')
h2('6.5 The Settings tab')
para('Open the Settings tab in the sheet and check: your email, your name for messages, WhatsApp number, “List your shop” page address, website address, social links, '
     'Impressum and Datenschutz addresses. Then menu AfroKauf › Send me a sample of every email, to see the designed emails in your inbox.')
img('emails.png', 15, 'The emails shops and customers get: sign-up received, page live, newsletter.')
h2('6.6 After every script update')
para('When you paste a new version of the script: Save › AfroKauf › Set up the sheet › Apps Script › Deploy › Manage deployments › pencil › Version: New version › Deploy. The address stays the same.')

# ------------------------------------------------------------------ 7
h1('7. Add the first shop, product and article')
h2('7.1 A shop')
steps(['Fill in your own “List your shop” form with a real shop (or a test shop).',
       'In the sheet: click the new row › AfroKauf › Show post code for the selected row.',
       'Blogger › Posts › New post. Title: the shop name. Pencil › HTML view › paste the post code. Pencil › Compose view › add the photos at the end.',
       'Labels (right side): paste the labels, e.g. Shop, Food, Frankfurt, Hessen. Publish.',
       'In the sheet: paste the post address in “Shop page link”, Status: Live. AfroKauf › Message: page is live: a ready email is in your Gmail drafts.'])
h2('7.2 A product')
steps(['Blogger › New post. Title: product name with size, e.g. “Gari Ijebu, 1 kg”.',
       'HTML view: paste the product block and fill it in (price, size, shop, shop page, WhatsApp, city).',
       'Compose view: add the product photo and a short description. Labels: Product, Food, Frankfurt. Publish.'])
code('<div class="product-info"\n  data-price="3.49" data-old-price="" data-unit="1 kg"\n  data-shop="Lagos Taste Afroshop"\n'
     '  data-shop-page="https://afrokauf.blogspot.com/…/lagos-taste.html"\n  data-whatsapp="+49 152 9876543" data-city="Frankfurt"\n'
     '  data-stock="yes" data-until="">3,49 € · 1 kg</div>')
img('product.png', 15, 'A product page: photo, price with price per kilo, quantity, “Add to order”.')
h2('7.3 A magazine article')
steps(['Blogger › New post. Write the article (a recipe, a shop story, tips).', 'Put a good photo at the top. Label: Magazine. Publish.'])
para('Full details on products, offers, own products with payment links and orders: guide “AfroKauf – Homepage sections and the shop”.')

# ------------------------------------------------------------------ 8
h1('8. Test everything')
para('Tick each line. Do the test on a computer AND on your phone.')
check(['The homepage shows the slideshow, benefits, banners, categories, cities and states.',
       'Search “gari” (or a product your test shop sells) and pick a city: the shop appears.',
       '“Near me” asks for your location and shows distances.',
       'The shop page shows hours with “Open now / Closed”, and the Call, WhatsApp and Directions buttons work.',
       'The menu opens and closes on the phone.',
       'The product appears in “Products from our shops” and in the menu › Shop.',
       '“Add to order” › bag icon › the order form sends; the Orders tab has the row; the shop email and your copy arrive.',
       '“Order on WhatsApp” opens WhatsApp with the order text.',
       'The footer newsletter: sign up with your email, click the confirm link, the Subscribers tab says Confirmed.',
       'The “List your shop” form: a test sign-up creates a row, a photos folder, an email to you and a “Sign-up received” email.',
       'The globe button switches the site to Deutsch and Français, and back to English.',
       'Impressum and Datenschutz open from the footer.',
       'Afterwards: set test orders to Cancelled, test rows to Spam, delete the test subscriber.'])

# ------------------------------------------------------------------ 9
h1('9. Languages')
img('languages.png', 16, 'The globe button in the header: visitors choose their language.')
para('The website speaks several languages. Visitors tap the globe button in the header (EN, DE, FR …) and choose. '
     'The first time, the site uses the language of their phone or computer, and afterwards it remembers their choice.')
h2('9.1 Which languages, and why in two steps')
table(['Step', 'Languages', 'Status'], [
    ['Step 1', 'English, Deutsch, Français', 'Ready. Switched on from the start'],
    ['Step 2', 'Kiswahili, Amharic (አማርኛ), Tigrinya (ትግርኛ)', 'Drafts. Already in the theme, but switched off until a native speaker has checked them'],
], widths=[2.2, 7, 7.3])
para('Why these: German is the language of the country, English and French reach most African communities in Germany '
     '(Nigeria, Ghana, Cameroon, Congo, Togo …). Eritreans and Ethiopians are among the largest African communities in Germany, '
     'so Tigrinya and Amharic follow, and Kiswahili for East Africa. Yoruba, Igbo, Hausa and Twi speakers almost all read English, '
     'so use those languages in your social media and videos instead of on the website.')
h2('9.2 Where the languages are set')
steps(['Layout › Directory settings (bottom) › pencil icon.',
       'Find the line languages: en, de, fr. These are the languages visitors can choose. The codes: en English, de Deutsch, fr Français, sw Kiswahili, am Amharic, ti Tigrinya.',
       'The first code in the line is the language for visitors whose phone speaks none of them. Leave en first.',
       'Save.'])
h2('9.3 Switch on step 2 (after the check)')
steps(['Find a native speaker for each language: a shop owner, a community member or a translator. Allow about 1 hour each.',
       'Layout › Language: Amharic (draft …) › pencil icon › copy all the text into an email or a Google Doc and send it to them. '
       'Ask them to correct only the part after “ = ” on each line, and to keep the English part and the “ = ” as they are.',
       'Paste the corrected text back into the gadget and Save. You may also remove “(draft, needs a native-speaker check)” from the gadget title.',
       'Directory settings › add the code to the line, e.g. languages: en, de, fr, am › Save.',
       'Open the website, choose the new language with the globe button and click through the homepage, a shop page, a product and the order form.'])
h2('9.4 Correct or add a word')
para('Every language is one gadget at the bottom of Layout, for example “Language: Deutsch”. The first line is lang: de. '
     'Every other line is the English text, then “ = ”, then the translation:')
code('lang: de\nOpen now = Jetzt geöffnet\nAdd to order = In die Bestellung\nFood = Lebensmittel')
bullets([('Correct a word: ', 'change the part after “ = ” and Save.'),
         ('Your own labels: ', 'categories such as Food or Beauty can be translated too: add a line like Food = Lebensmittel.'),
         ('Changed an English text? ', 'If you change the English words in a gadget (for example a FAQ answer), add the new English text with its translation to each language gadget, otherwise that text stays in English.'),
         ('Do not translate the lang: line ', 'and do not remove the spaces around the “=”.')])
h2('9.5 What stays in one language')
bullets([('Your posts: ', 'shop pages, products and magazine articles stay in the language you write them in. Write them in English or German; for important articles you can publish a second post in another language.'),
         ('Names: ', 'shop names, city and state names.'),
         ('The two form pages ', '(“List your shop”, “Add products”): English, with a language choice for the emails.'),
         ('Emails from the sheet: ', 'English, Deutsch or Français, depending on the language the person chose.'),
         ('Google: ', 'search engines see the English texts. The switch happens on the visitor’s screen.')])
para('A link straight to a language, for a post on social media: add ?lang=de (or fr, en …) to the address, e.g. afrokauf.blogspot.com/?lang=fr.')

# ------------------------------------------------------------------ 10
h1('10. Your own domain (optional)')
steps(['Buy the domain (e.g. afrokauf.de) from a provider such as IONOS, Strato or Google’s partner Squarespace Domains.',
       'Blogger › Settings › Publishing › Custom domain › type www.afrokauf.de › Save. Blogger shows two CNAME records.',
       'In your domain provider’s DNS settings add both CNAME records exactly as Blogger shows them. Wait up to a few hours.',
       'Back in Blogger, save the custom domain again. Then switch on “Redirect domain” (afrokauf.de → www.afrokauf.de) and HTTPS redirect.',
       'Update the website address in: the sheet’s Settings tab (Website, page addresses), your social media profiles and printed material.'])

# ------------------------------------------------------------------ 11
h1('11. The routine')
table(['When', 'What'], [
    ['Every day (10 min)', 'Email “AfroKauf: … open”: work the open sign-ups (sign-up guide, part 3). Check the Orders tab: are new orders confirmed by the shop?'],
    ['Every week', 'Update offers (old price + end date). One magazine article or shop story. Post the week’s offers on social media. Moderate reviews (Blogger › Comments).'],
    ['Every month', 'Newsletter to shops and to customers. Check Blogger › Stats: which shops and products are viewed most (tell Premium shops their numbers).'],
    ['Every 3 months', 'Backups: Theme › ▾ › Backup, Settings › Manage blog › Back up content, and File › Download of the sheet. Store them in Drive.'],
], widths=[3.6, 12.9])

# ------------------------------------------------------------------ 12
h1('12. Problems and fixes')
table(['What you see', 'Why', 'Fix'], [
    ['“Could not restore theme”', 'Blogger refuses the file', 'Part 2 note: paste in Edit HTML and send a screenshot of the error'],
    ['Search finds nothing', 'Feed not Full, or no posts with the label Shop', 'Settings › Site feed › Full; check the labels'],
    ['Shop missing on its city page', 'City label spelled differently from the city tile', 'Make the label exactly like the tile (Frankfurt, not Frankfurt am Main)'],
    ['Phones show a plain blue Blogger page', 'Mobile setting', 'Part 2.1: Desktop'],
    ['No order form in the cart, no newsletter band', 'crm_endpoint empty', 'Part 6.3'],
    ['Form says “not connected”', 'ENDPOINT not filled in on the page', 'Part 6.4'],
    ['“Sending did not work”', 'Web app access not “Anyone”, or no new version after a script change', 'Part 6.2 and 6.6'],
    ['No emails arrive', 'Spam folder, or Google’s daily limit (about 100 a day on free Gmail)', 'Check spam; wait until tomorrow; Google Workspace allows more'],
    ['“Open now” is wrong', 'Typo in the hours, or wrong time zone', 'Hours like Mo-Fr 10:00-20:00; Settings › Formatting › Berlin'],
    ['No globe button in the header', 'Only one language in the languages: line', 'Part 9.2'],
    ['A text stays in English in another language', 'The English text was changed, or it is your own post', 'Part 9.4 and 9.5'],
    ['A section looks plain or empty', 'Typo in the section code, or nothing to show yet', 'Copy the code again; add content'],
    ['Something else', '', 'Take a screenshot and send it. Describe what you clicked just before'],
], widths=[4.6, 5.6, 6.3])

fix_numbering()
doc.save(OUT)
print('saved', OUT)
