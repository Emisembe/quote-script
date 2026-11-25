#!/usr/bin/env python3
"""Build "AfroKauf – Homepage sections and the shop" as a .docx (uploaded to Drive as a Google Doc).
    python3 build_shop_guide_docx.py <images_dir> <out.docx>
Uses the same styles and helpers as build_guide_docx.py (everything above its CONTENT marker).
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


doc.add_heading('AfroKauf – Homepage sections and the shop', level=0)
para('This guide covers the new parts of the website: the homepage sections you edit in Layout, the magazine, the shop with '
     'products from member shops, orders, the “Add products” page for shops and the customer newsletter. Simple English, step by step.')
para('Last updated: 24 November 2026')
table(['Part', 'What it is about'], [
    ['1', 'Put the new version online (once, about 20 minutes)'],
    ['2', 'Homepage sections: edit them in Layout, or add new ones'],
    ['3', 'Magazine articles'],
    ['4', 'Products: put a product online'],
    ['5', 'Products sent by shops (“Add products” page)'],
    ['6', 'Orders: what happens and what you do'],
    ['7', 'Customer newsletter'],
    ['8', 'The rules (Germany)'],
    ['9', 'Problems and fixes'],
], widths=[1.4, 15])

# ------------------------------------------------------------------ 1
h1('1. Put the new version online')
h2('1.1 The theme')
steps(['Blogger › Theme › ▾ next to “Customise” › Backup. Keep the file.',
       'Theme › ▾ › Restore › upload “AfroKauf Blogger theme (upload in Blogger).xml” from Drive › 09 Website.',
       'Open your website. You see the new sections on the homepage, a “Shop” link in the menu and a bag icon at the top right.'])
note('Your own gadget texts stay as they are. New gadgets come with example texts you can change.')
h2('1.2 Connect the website to your AfroKauf sheet')
steps(['Blogger › Layout › “Directory settings” (at the bottom) › pencil.',
       'Find the line crm_endpoint: and paste your web app address after it (the same /exec address as on the “List your shop” page). Save.'])
code('crm_endpoint: https://script.google.com/macros/s/AKfy...your-code.../exec')
para('This switches on the order form in the cart and the newsletter form in the footer. Without it, the cart still works with WhatsApp, and the newsletter band stays hidden.')
h2('1.3 The script')
steps(['Open the AfroKauf sign-ups sheet › Extensions › Apps Script.',
       'Replace all code with the new “Apps Script code (Code.gs).txt” from Drive › 09 Website › Sign-up form. Save.',
       'Back in the sheet: AfroKauf › Set up the sheet. New tabs appear: Orders, Subscribers and Products.',
       'Apps Script › Deploy › Manage deployments › pencil › Version: New version › Deploy. The address stays the same.',
       'Google may ask for one new permission: “connect to an external service”. That is the price check: the script reads the prices from your own blog.'])
h2('1.4 The “Add products” page')
steps(['Blogger › Pages › New page. Title: Add products.',
       'Pencil icon › HTML view. Paste everything from “Add products – page code (paste in Blogger).txt”.',
       'Put your web app address into ENDPOINT, as on the “List your shop” page. Publish.',
       'Send the page address to your listed shops.'])
h2('1.5 Test everything once')
bullets(['Make one test product (part 4), add it to the cart, and send the order form to yourself. Check the Orders tab and the emails.',
         'Sign up in the footer newsletter band with your own email and click the confirm link. Check the Subscribers tab.',
         'Afterwards set the test order to Cancelled and delete the test subscriber row.'])

# ------------------------------------------------------------------ 2
h1('2. Homepage sections')
image(IMG / 'home-top.png', 16, 'The top of the homepage: slideshow, benefits strip, promo banners, categories and deals.')
para('Every section is a gadget in Blogger › Layout. Click the pencil to change the text. Drag gadgets up or down to change the order. '
     'Click “Add a gadget” in the homepage areas to add a new section: any gadget you add there gets the AfroKauf look by itself.')
h2('2.1 The sections that are already there')
table(['Gadget in Layout', 'What it shows', 'How to edit'], [
    ['(no title) benefits', 'The strip with 4 icons under the slideshow', 'Change the words. Icon names: free, check, clock, bag, chat, map, star, truck, heart, people'],
    ['(no title) banners', 'Two big coloured banners', 'Title, text, button text and link. Colours: green, gold, clay, sand. Optional picture'],
    ['Deals of the week', 'Products with an old price, biggest discount first', 'Nothing: it fills itself from products with an offer. Hidden when there are no offers'],
    ['Products from our shops', 'A row of products', 'Nothing: it fills itself from posts with the label Product'],
    ['Our member shops', 'A row of logos', 'Add one line per logo (see 2.2). Replace the example line'],
    ['(no title) spotlight', '“Everything for your kitchen” band with tiles and a row of food shops', 'Headline, tile names and links, colour, and which label the row shows'],
    ['AfroKauf Magazine', 'A row of articles', 'Nothing: it fills itself from posts with the label Magazine'],
    ['Questions and answers', 'Fold-open questions; Google can show them in search results', 'One question and answer pair each (see 2.2)'],
    ['(footer) newsletter band', '“Never miss an offer” with the sign-up form', 'Title and text. The form appears when crm_endpoint is set (1.2)'],
], widths=[3.8, 5.6, 7.1])
note('Sections that fill themselves hide when they have nothing to show. So the magazine row appears with your first Magazine article.')

h2('2.2 Codes for new sections')
para('Layout › Add a gadget › HTML/JavaScript › give it a title (or leave it empty) › paste one of these codes › change the words › Save. '
     'Pictures: upload them in a Blogger post, right-click the picture › Copy image address, and paste that address.')
h3('Benefits strip (icons)')
code('<ul class="benefits">\n<li data-icon="truck"><strong>Delivery in Berlin</strong>Many shops deliver to your door.</li>\n'
     '<li data-icon="heart"><strong>From the community</strong>Run by people who know these shops.</li>\n</ul>')
h3('Promo banners')
code('<ul class="banners">\n<li data-tone="clay"><p class="kicker">Black Friday</p><h3>Up to 30 % off in 12 shops</h3>\n'
     '<p>Only this weekend.</p><a href="/search/label/Product">See the deals</a></li>\n'
     '<li data-tone="sand"><img src="PICTURE-ADDRESS"><h3>New: Kumasi Market</h3><p>Now open in Köln.</p><a href="/p/...">Visit</a></li>\n</ul>')
h3('A row of products, shops or articles from any label')
code('<div class="feed-row" data-kind="products" data-label="Hair & Beauty" data-max="8"></div>\n'
     '<div class="feed-row" data-kind="shops" data-label="Berlin" data-max="8"></div>\n'
     '<div class="feed-row" data-kind="posts" data-label="Magazine" data-max="6"></div>')
h3('Deals (products with an offer)')
code('<div class="deals" data-max="8"></div>')
h3('Logo row')
code('<ul class="logos">\n<li><a href="SHOP-PAGE-ADDRESS"><img src="LOGO-ADDRESS" alt="Shop name"></a></li>\n'
     '<li><a href="SHOP-PAGE-ADDRESS">Shop name without logo</a></li>\n</ul>')
note('Use only logos of member shops and partners who agreed. Do not use product brand logos (Indomie, Tropical Sun…): those are trademarks of other companies.')
h3('Spotlight band')
code('<div class="spotlight" data-tone="green">\n<h3>Everything for your hair</h3>\n<ul>\n'
     '<li><a href="/#find?q=braids">Braiding hair</a></li>\n<li><a href="/#find?q=wigs">Wigs</a></li>\n</ul>\n'
     '<div class="feed-row" data-kind="shops" data-label="Hair & Beauty" data-max="8"></div>\n</div>')
para('Colours for data-tone: gold, green, clay. Links like /#find?q=word open the search with that word.')
h3('Questions and answers')
code('<dl class="faq">\n<dt>Do the shops deliver?</dt>\n<dd>Some do. Look for “delivery” on the shop page.</dd>\n</dl>')

# ------------------------------------------------------------------ 3
h1('3. Magazine articles')
steps(['Blogger › New post. Write the article like any blog post.',
       'Put a good picture at the top: it becomes the picture in the magazine row.',
       'Label: Magazine (and a category or city if it fits). Publish.'])
bullets(['Good topics: recipes with products from member shops, shop stories, hair and skin care, seminar reports, “what is egusi?”.',
         'Link to the shops and products you mention. Customers love it, and so does Google.',
         'Only your own pictures, or pictures the shop gave you.'])

# ------------------------------------------------------------------ 4
h1('4. Products')
image(IMG / 'product.png', 16, 'A product page: photo, price with price per kilo, offer badge, quantity, “Add to order” and WhatsApp.')
h2('4.1 Put a product online')
steps(['Blogger › New post. Title: the product name with size, e.g. “Gari Ijebu, 1 kg”.',
       'Pencil › HTML view. Paste the product block (below) at the top and fill it in.',
       'Pencil › Compose view. Below the block, add the photo (white or plain background works best) and a short description.',
       'Labels: Product, the category (e.g. Food) and the city label of the shop (e.g. Frankfurt). Publish.'])
code('<div class="product-info"\n  data-price="3.49"\n  data-old-price=""\n  data-unit="1 kg"\n  data-shop="Lagos Taste Afroshop"\n'
     '  data-shop-page="https://afrokauf.blogspot.com/2026/11/lagos-taste.html"\n  data-whatsapp="+49 152 9876543"\n  data-city="Frankfurt"\n'
     '  data-stock="yes"\n  data-until="">\n3,49 € · 1 kg · Lagos Taste Afroshop\n</div>')
table(['Field', 'How to write it'], [
    ['data-price', 'Price with VAT, dot or comma: 3.49 or 3,49'],
    ['data-unit', 'Size: 1 kg, 500 g, 1 l, 6 x 0,33 l, 3 packs. The price per kg or litre is calculated by itself'],
    ['data-old-price + data-until', 'For an offer: the old price and the last day (2026-12-31). After that day the offer disappears by itself'],
    ['data-shop, data-shop-page, data-whatsapp, data-city', 'Copy them from the shop’s page. Orders go to this shop'],
    ['data-stock', 'yes, or no when sold out (the product stays visible with “Sold out”)'],
], widths=[5.2, 11.3])
h2('4.2 AfroKauf’s own products (seminar tickets, Premium)')
para('For things AfroKauf sells itself, use a payment link instead of the cart:')
code('<div class="product-info" data-price="29" data-unit="1 seat, 23 Jan 2027, Frankfurt"\n'
     '  data-seller="AfroKauf Verbund" data-pay-link="https://www.paypal.com/paypalme/YOURNAME/29">29 €</div>')
bullets(['Make the link in PayPal (paypal.me with the amount) or as a Stripe payment link. Never put passwords or secret keys in a post.',
         'The button says “Buy now” and opens the payment page. Check in PayPal or Stripe that the money arrived, then send the ticket or switch on Premium.'])

# ------------------------------------------------------------------ 5
h1('5. Products sent by shops')
steps(['A listed shop opens “Add products”, types its reference (AK-…) and its email, and adds up to 10 products with price, size, offer and photo.',
       'You get an email. The products are on the Products tab, with Status New.',
       'Check the price, the size and the photo. Click the row › AfroKauf › Show product post code.',
       'Make the post as in 4.1: title, code in HTML view, photo, labels. Publish.',
       'Set Status to Published and paste the product page address into “Product page link”.'])
note('Only shops with Status Live can send products, and only with the reference and the email from their own sign-up. So nobody can send products in someone else’s name.')

# ------------------------------------------------------------------ 6
h1('6. Orders')
image(IMG / 'cart.png', 16, 'The cart: products are grouped by shop. Each shop gets its own order, by form or WhatsApp.')
h2('6.1 What the customer does')
bullets(['Adds products (“Add to order”), opens the bag icon, writes name and phone, and sends: either “Send order request” (form) or “Order on WhatsApp”.',
         'Products from two shops become two orders, one per shop.',
         'It is an order request: the shop confirms, and the customer pays when picking up.'])
h2('6.2 What happens with a form order')
bullets(['The script reads every price again from your blog. If someone changed a price in their browser, the real price is used.',
         'A new row appears on the Orders tab, with an order number like OR-LTA-20261124-153012-123 (shop initials, date, time, milliseconds).',
         'The shop gets a designed email with the products, the total and a “Reply on WhatsApp” button. You get a copy (Settings › “Send me a copy of every order?”).',
         'If the shop has no email in the sheet, only you get the order, with a button to forward it to the shop on WhatsApp.',
         'The customer gets a confirmation if they gave an email.',
         'WhatsApp orders go straight to the shop’s WhatsApp and are not in the sheet.'])
h2('6.3 What you do')
steps(['Look at the Orders tab once a day. Status New means: has the shop seen it?',
       'Ask the shop (WhatsApp) if it confirmed. Set Status: Confirmed, Ready, Collected or Cancelled.',
       'Problems (customer did not come, product missing)? Write them in “Your notes”.'])

# ------------------------------------------------------------------ 7
h1('7. Customer newsletter')
steps(['Customers sign up in the green band at the bottom of every page. They get an email with a confirm button (double opt-in).',
       'They appear on the Subscribers tab: “Waiting for confirmation”, then “Confirmed” with date and time.',
       'Write: Newsletter & announcements › New customer newsletter. Same format as the other campaigns.',
       'Preview, then send to everyone, exactly as in the sign-up guide, part 7.'])
note('Customer newsletters go only to the Subscribers tab. The shop-owner newsletter and announcements go only to shops. The lists never mix.')

# ------------------------------------------------------------------ 8
h1('8. The rules (Germany)')
para('Not legal advice: have the pages checked by the IHK or a lawyer before you start selling.')
bullets([('Prices: ', 'always with VAT. The site shows “Prices incl. VAT. Pay and pick up in the shop.” (Directory settings › price_note).'),
         ('Price per kg or litre (Grundpreis): ', 'calculated from data-unit. Write the size in g, kg, ml or l so it works.'),
         ('Old prices: ', 'only a price the shop really charged in the last 30 days (§ 11 PAngV). Otherwise leave data-old-price empty.'),
         ('Datenschutz: ', 'add the order form (name, phone, email go to AfroKauf and the shop), WhatsApp orders and the customer newsletter to your Datenschutz page.'),
         ('Order requests: ', 'the customer does not pay online; the shop confirms. Keep the wording “order request” and “pay in the shop”.'),
         ('AfroKauf’s own sales: ', 'when you sell to consumers with a payment link, you need terms (AGB) and the 14-day withdrawal information (Widerrufsbelehrung). Seminars for shop owners are business customers.'),
         ('Photos: ', 'only the shops’ own photos, or photos they are allowed to use.')])

# ------------------------------------------------------------------ 9
h1('9. Problems and fixes')
table(['What you see', 'Why', 'Fix'], [
    ['No order form in the cart, only WhatsApp', 'crm_endpoint is empty or wrong', 'Part 1.2'],
    ['No newsletter band in the footer', 'crm_endpoint is empty', 'Part 1.2'],
    ['“… is no longer available” when ordering', 'The product post is a draft, or the blog feed is not public and Full', 'Publish the post; Settings › Site feed › Full'],
    ['A product shows no price per kg', 'data-unit has no g, kg, ml or l', 'Write e.g. 500 g'],
    ['The offer badge is gone', 'data-until is in the past', 'That is correct. Change the date for a new offer'],
    ['Deals or magazine row is missing on the homepage', 'Nothing to show yet', 'Add a product with an offer, or a Magazine article'],
    ['A section looks plain', 'The code has a typo (e.g. class="banner" instead of "banners")', 'Copy the code from part 2.2 again'],
    ['Orders do not reach the shop', 'The shop has no email in Sign-ups, or the shop name in the product differs', 'Add the email; write data-shop exactly like the shop name'],
], widths=[5.2, 5.8, 5.5])

fix_numbering()
doc.save(OUT)
print('saved', OUT)
