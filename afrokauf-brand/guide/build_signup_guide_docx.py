#!/usr/bin/env python3
"""Build "AfroKauf – Shop sign-ups and shop pages" as a .docx (uploaded to Drive as a Google Doc).
    python3 build_signup_guide_docx.py <images_dir> <out.docx>
Uses the same styles and helpers as build_guide_docx.py (everything above its CONTENT marker).
"""
import pathlib
import sys

_here = pathlib.Path(__file__).with_name('build_guide_docx.py').read_text(encoding='utf-8')
exec(compile(_here.split('# ====================================================================== CONTENT')[0], 'build_guide_docx.py', 'exec'))

IMG = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(sys.argv[2])


def code(text):
    """A block of code or exact text to copy, in a grey box."""
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
        r.font.size = Pt(9.5)
        if i < len(lines) - 1:
            r.add_break()
    doc.add_paragraph()


doc.add_heading('AfroKauf – Shop sign-ups and shop pages', level=0)
para('This guide shows the whole road of a shop: from the “List your shop” form on the website, to its own shop page, '
     'to changing that page later and adding products, photos and offers. It also explains the list of shops in Hessen. '
     'It is written in simple English. Do the parts in order the first time.')
para('Last updated: 19 November 2026')

table(['Part', 'What you do', 'How often'], [
    ['1', 'Understand how a shop gets listed', 'Read once'],
    ['2', 'Set up the sign-up form (Google Sheet, Apps Script, Blogger page)', 'Once, about 30 minutes'],
    ['3', 'Turn a sign-up into a live shop page', 'For every new shop, about 15 minutes'],
    ['4', 'Change a shop page', 'When a shop asks'],
    ['5', 'Add products, photos and weekly offers', 'Often, mostly for Premium shops'],
    ['6', 'Find shops: the Hessen list', 'Weekly'],
    ['7', 'Problems and fixes', 'When something does not work'],
], widths=[1.3, 11, 4.2])

para('Your files in Google Drive:', bold_lead='')
bullets([('09 Website › Sign-up form: ', 'the page code for Blogger and the Apps Script code.'),
         ('10 Shop leads: ', 'the list of African shops in Hessen (a Google Sheet).'),
         ('02 Guide: ', 'this document and the main AfroKauf guide.')])

# ------------------------------------------------------------------ 1
h1('1. How a shop gets listed')
para('Blogger cannot let visitors make their own pages. So shop owners send you their details, and you publish the page. '
     'This is a good thing: you check every shop before it goes live, so customers can trust the site.')
steps([('The owner taps “List your shop”. ', 'The button is in the header, the announcement bar, the slideshow, the price cards and the footer. '
        'They all open one page: /p/list-your-shop.html.'),
       ('The owner fills in the form ', '(about 5 minutes): shop name, kind of shop, address, phone, WhatsApp, email, opening hours, '
        'what they sell, photos, the plan they want and their OK for data use.'),
       ('The details land in your Google Sheet. ', 'The photos go into a Drive folder, the map position is found from the address, '
        'and the page code for Blogger is written for you. You get an email.'),
       ('You check the shop: ', 'a short call, Google Maps, or a visit.'),
       ('You publish the page in Blogger: ', 'new post, paste the code, add the photos and labels, Publish.'),
       ('The site does the rest by itself: ', 'search, city page, state page, category, “Near me”, “Open now”, the Call, WhatsApp and '
        'Directions buttons, and the data Google needs to show the shop.'),
       ('You send the owner the link. ', 'For Premium you also add the label Featured after they pay.')])
image(IMG / 'form-phone.png', 6.5, 'The “List your shop” page on a phone.')

# ------------------------------------------------------------------ 2
h1('2. Set up the sign-up form (once)')
para('You need: your Google account (the one with the AfroKauf Drive), Blogger open in another tab, and the two files from '
     'Drive › 09 Website › Sign-up form.')

h2('2.1 Make the Google Sheet')
steps(['Open Google Drive › AfroKauf › 09 Website.',
       'Click New › Google Sheets › Blank spreadsheet.',
       'Click “Untitled spreadsheet” at the top left and name it: AfroKauf – Shop sign-ups.'])

h2('2.2 Add the script')
steps(['In the new sheet, click Extensions › Apps Script. A new tab opens with a code editor.',
       'At the top left, click “Untitled project” and name it: AfroKauf sign-ups.',
       'In the editor you see a file called Code.gs with a few lines in it. Click into it, press Ctrl+A (Mac: Cmd+A) and Delete.',
       'Open the file “Apps Script code (Code.gs).txt” from Drive, select everything (Ctrl+A), copy (Ctrl+C) and paste it into the empty editor (Ctrl+V).',
       'Click the Save icon (the small disk) or press Ctrl+S.'])

h2('2.3 Run the setup and give permission')
steps(['Above the code there is a drop-down list next to “Debug”. Choose setup in it.',
       'Click Run.',
       'Google asks for permission. Click Review permissions and choose your account.',
       'Google says “Google hasn’t verified this app”. This is normal for your own script. Click Advanced, then “Go to AfroKauf sign-ups (unsafe)”.',
       'Google lists what the script may do: use this sheet, save the photos in your Drive, send you emails, put message drafts in your Gmail, '
       'run by itself once a day, and find map positions. Click Allow.',
       'Go back to the sheet tab. You now see two new tabs, Sign-ups and Settings, and a message box. Click OK.'])
para('The script also made a Drive folder called “AfroKauf shop photos”. Every sign-up with photos gets its own folder inside it. '
     'You can run setup again at any time (menu AfroKauf › Set up the sheet): it only adds what is missing and never deletes your rows, columns or settings.')

h2('2.4 Fill in the Settings tab')
para('Everything you may want to change is on the Settings tab, not in the code. Column A is the setting, column B is your value.')
table(['Setting', 'What to write'], [
    ['Notify email', 'Where new sign-ups and the daily list go. Already filled with your Google email.'],
    ['Your name', 'How messages to shops are signed, e.g. “Ada, AfroKauf team”.'],
    ['Your WhatsApp number', 'With country code, no + or spaces: 4915112345678.'],
    ['“List your shop” page address', 'The full address of the page from part 2.6, e.g. https://afrokauf.blogspot.com/p/list-your-shop.html. Messages to shops use it.'],
    ['Send daily summary email?', 'Yes or No. When Yes, you get one email a day, only on days when sign-ups are waiting.'],
    ['Daily email time', 'The hour, 0–23. 8 means between 8 and 9 in the morning.'],
    ['Follow up — New / Checking / Waiting for shop', 'After how many days a sign-up in that status is marked ⚠ FOLLOW UP. Defaults 2, 3 and 7 days. The website promises 2 working days.'],
    ['Page live / Missing info texts', 'The messages to shops, in English, Deutsch and Français. Change the words as you like. Keep the {{…}} words: they are filled in for each shop.'],
], widths=[5.3, 11.2])
note('After you change “Send daily summary email?” or the email time, run AfroKauf › Set up the sheet once, so the daily timer is updated.')

h2('2.5 Publish the script as a web app')
steps(['In the Apps Script tab, click the blue Deploy button (top right) › New deployment.',
       'Click the gear icon next to “Select type” and choose Web app.',
       'Description: Sign-up form. Execute as: Me. Who has access: Anyone.',
       'Click Deploy. Allow again if Google asks.',
       'Copy the Web app URL. It starts with https://script.google.com/macros/s/ and ends with /exec.',
       'Test it: paste that address into a new browser tab. You should see: “AfroKauf sign-up form is connected.”'])
note('“Anyone” only means the website form can send to it. Nobody can read your sheet through this address.')

h2('2.6 Make the “List your shop” page in Blogger')
steps(['Open the file “List your shop – page code (paste in Blogger).txt” from Drive and copy everything.',
       'In Blogger, click Pages › New page.',
       'Title: List your shop (exactly like this, so the address becomes /p/list-your-shop.html and all buttons find it).',
       'At the top left of the editor, click the pencil icon › HTML view.',
       'Delete anything in the box and paste the code.',
       'Find this line near the bottom: var ENDPOINT = \'PASTE_YOUR_WEB_APP_URL_HERE\'; Replace PASTE_YOUR_WEB_APP_URL_HERE with your Web app URL. Keep the quote marks.',
       'On the next line, write your WhatsApp number between the quotes, with country code and no + or spaces, e.g. \'4915112345678\'. This is for the “Send on WhatsApp instead” link.',
       'Click Publish.'])
code("var ENDPOINT = 'https://script.google.com/macros/s/AKfy...your-code.../exec';\nvar WHATSAPP = '4915112345678';")
note('Do not switch the page back to “Compose view” after pasting. Compose view can break the form code. If you need to change the text, do it in HTML view.')

h2('2.7 Test it')
steps(['Open your website and click “List your shop”.',
       'Fill in a test shop with your own details and one photo. Tick the two boxes. Click Send my shop.',
       'You see “Thank you! We have your details” and a reference like AK-261119-X7QD.',
       'Check: a new row in the sheet, an email to you, and a photos folder in Drive.',
       'Set the test row’s Status to Spam, or delete the row.'])

h2('2.8 When you change the script later')
para('After any change to the code you must publish a new version, or the website keeps using the old one:')
steps(['Deploy › Manage deployments.', 'Click the pencil icon.', 'Version: New version.', 'Click Deploy. The web app address stays the same.'])

h2('2.9 Add the form to your Datenschutz page')
para('Your Datenschutzerklärung must say what happens with the form data. Add a section like this to the Datenschutz page '
     '(and have it checked, for example by the IHK or a lawyer, before you go live):')
code('Anmeldeformular „List your shop“\n'
     'Wenn Sie Ihr Geschäft über das Formular anmelden, speichern wir die Angaben zum Geschäft, Ihren Namen, Ihre E-Mail-Adresse,\n'
     'Telefonnummer und die Fotos, um Ihre Shop-Seite zu erstellen und Sie dazu zu kontaktieren (Art. 6 Abs. 1 lit. b DSGVO).\n'
     'Die Daten werden in Google Tabellen und Google Drive gespeichert; zur Ermittlung der Kartenposition wird die Adresse an\n'
     'Google Maps übermittelt (Google Ireland Ltd.). Angaben zum Geschäft und die Fotos werden auf der Shop-Seite veröffentlicht;\n'
     'Ihr Name und Ihre private Nummer nicht. Sie können jederzeit Auskunft, Berichtigung oder Löschung verlangen: [E-Mail].')
note('With a normal free Gmail account, Google does not sign a data processing agreement (AVV) with you. Once AfroKauf is a real business, '
     'move the sheet and the script to a Google Workspace account. Workspace includes that agreement.')

# ------------------------------------------------------------------ 3
h1('3. From sign-up to live shop page')
image(IMG / 'form-done.png', 6.5, 'What the shop owner sees after sending.')

h2('3.1 A new sign-up arrives')
steps(['You get an email “AfroKauf sign-up: <shop name> (AK-…)”.',
       'Open the sheet. The new row is at the bottom. Set Status to Checking, so you know you are on it.',
       'The first time you open the sheet after setup, reload the page. A new menu AfroKauf appears next to Help.'])
para('When you change the Status (with the drop-down), “Status since” gets today’s date by itself. The column “Follow-up” then shows '
     '⚠ FOLLOW UP when a sign-up waits too long in New, Checking or Waiting for shop, and the row turns red. Green rows are done. Grey rows are rejected or spam.')

h2('3.2 Check the shop')
bullets(['Call the contact number. Say thank you and check the address and opening hours.',
         'Look the address up on Google Maps. Does the shop exist there? Is the street right?',
         'Look at the photos: they must be the shop’s own photos. No photos from the internet, and no people who can be recognised unless they agreed.',
         'Something missing? Set Status to “Waiting for shop”, then menu AfroKauf › Message: missing information. '
         'A draft appears in your Gmail with the text from Settings. Write what is missing where it says [write here what is missing], then press Send. '
         'The window also has a WhatsApp link with the same text.',
         'After each call: AfroKauf › Add a dated note. Type what was said. It goes to the top of “Your notes” with today’s date, so you always see the history.',
         'Not a real shop, or spam? Set Status to Rejected or Spam.'])

h2('3.3 Get the ready code')
steps(['Click any cell in the shop’s row.',
       'Menu AfroKauf › Show post code for the selected row.',
       'A window shows three boxes: Title, Labels and Post code. Click into a box: everything in it is selected. Copy it with Ctrl+C.',
       'If you corrected something in the row (for example the opening hours), use AfroKauf › Remake post code for the selected row first.'])
para('The post code is the shop block the website reads. It looks like this:')
code('<div class="shop-info"\n  data-city="Frankfurt am Main"\n  data-state="Hessen"\n  data-address="Taunusstraße 43, 60329 Frankfurt am Main"\n'
     '  data-lat="50.10945" data-lng="8.66912"\n  data-phone="069 1234567"\n  data-whatsapp="0151 1234567"\n'
     '  data-hours="Mo-Fr 10:00-20:00; Sa 10:00-18:00; Su closed"\n  data-sells="gari, egusi, plantain, palm oil"\n'
     '  data-origin="Nigeria, Ghana"\n  data-services="delivery, money transfer"\n  data-website="" data-instagram="">\n'
     'Taunusstraße 43, 60329 Frankfurt am Main · Mo-Fr 10:00-20:00; Sa 10:00-18:00; Su closed · Tel. 069 1234567\n</div>')

h2('3.4 Download the photos')
steps(['In the row, click the link in “Photos folder”.', 'Select all photos, then right-click › Download. They come as a zip file: open it.'])

h2('3.5 Make the shop page in Blogger')
steps(['Blogger › Posts › New post.',
       'Title: paste the title.',
       'Pencil icon at the top left › HTML view. Paste the post code.',
       'Pencil icon › Compose view. You now see the short address line. Click at the very end, below everything.',
       'Insert image (the picture icon) › Upload from computer › choose the shop-front photo first, then the others. The first photo becomes the shop’s picture in all lists.',
       'Right side, Labels: paste the labels, e.g. Shop, Food, Frankfurt, Hessen. Check each one is spelled exactly like the tiles on the homepage.',
       'Click Publish, then Confirm.'])
table(['Label', 'Why', 'Must match'], [
    ['Shop', 'Makes it a shop: search, lists, “Near me”', 'Exactly “Shop”'],
    ['Food, Hair & Beauty, …', 'Shows it under the category', 'The “Browse by category” links'],
    ['Frankfurt', 'Shows it on the city page', 'The “Shops by city” tile (Frankfurt, not Frankfurt am Main)'],
    ['Hessen', 'Shows it on the state page', 'The “Shops by state” tile'],
    ['Featured', 'Premium shops only: homepage “Featured shops”', 'Exactly “Featured”'],
], widths=[3.6, 6.4, 6.5])
note('A shop from a new city? Add the city to Layout › “Shops by city” the same day, so its city page appears in the lists. '
     'Big cities get their map icon by themselves. For a small town, add its position to the link (see the main guide, section 7.5).')

h2('3.6 Check the live page')
bullets(['Open the post on the website (View post). Do you see the photo, the address, “Open now” or “Closed”, and the Call, WhatsApp and Directions buttons?',
         'On the homepage, search for one product from the list (e.g. egusi) and the city. The shop should appear.',
         'New posts can take up to 20 minutes to appear in the search, because visitors’ browsers keep the shop list for 20 minutes.'])

h2('3.7 Finish in the sheet and tell the shop')
steps(['Paste the page address into “Shop page link”.',
       'Set Status to Live. “Done on” gets today’s date by itself.',
       'Menu AfroKauf › Message: page is live. A ready email is now in your Gmail Drafts, in the language the owner chose on the form '
       '(English, Deutsch or Français). Open Gmail, check it, press Send. Or click the WhatsApp link in the window to send the same text on WhatsApp.',
       'Nothing is ever sent by itself: you always check and press Send. The owner asked for the link in the form, so sending it is allowed.'])

h2('3.8 Your daily list')
bullets([('AfroKauf › What needs me today: ', 'every open sign-up, overdue ones first, with how many days it has waited and who wants Premium.'),
         ('Daily email: ', 'the same list by email each morning, only on days when something is open (Settings: Send daily summary email?).'),
         ('AfroKauf › Email me the list now: ', 'sends that email straight away.')])

h2('3.9 Premium shops')
bullets(['Send an invoice (bank transfer or PayPal). Blogger has no payment system.',
         'After the first payment: open the post, add the label Featured, click Update. The shop now shows in “Featured shops” on the homepage.',
         'Premium also means: more photos, a full product list and weekly offers (part 5).',
         'If they stop paying: remove the label Featured. Their basic page stays.'])

# ------------------------------------------------------------------ 4
h1('4. Change a shop page')
h2('4.1 Find the post')
bullets(['Blogger › Posts › search box at the top › type the shop name › click the post.',
         'Or: open the shop page on the website while you are logged in to Blogger, and click the small pencil (Quick edit) under the post.'])
h2('4.2 Change the shop details')
steps(['Pencil icon › HTML view. The shop block is at the top.',
       'Change only the text between the quote marks " ". Keep the quote marks and everything else.',
       'Click Update. The change is live straight away.'])
table(['To change', 'Edit this', 'How to write it'], [
    ['Phone', 'data-phone', '069 1234567 or +49 69 1234567'],
    ['WhatsApp', 'data-whatsapp', 'Any format. Empty "" hides the WhatsApp button'],
    ['Opening hours', 'data-hours', 'Mo-Fr 10:00-20:00; Sa 10:00-18:00; Su closed. Days: Mo Tu We Th Fr Sa Su. Lunch break: Mo-Fr 10:00-14:00, 15:00-19:00'],
    ['Address (shop moved)', 'data-address, data-lat, data-lng, data-city', 'New address. New lat/lng from Google Maps: right-click the shop, click the first line (the numbers) to copy them. Change the city label too if the city changed'],
    ['What they sell', 'data-sells', 'Words separated by commas. This is what the search finds'],
    ['Countries', 'data-origin', 'Nigeria, Ghana, Cameroon'],
    ['Services', 'data-services', 'delivery, money transfer, shipping to Africa'],
    ['Website, Instagram', 'data-website, data-instagram', 'Full address starting with https://'],
], widths=[3.4, 4.2, 8.9])
note('The line of text inside the block (address · hours · phone) is only shown to the rare visitor without JavaScript. Keep it roughly up to date, but it does not have to be perfect.')
h2('4.3 Changes sent through the form')
para('Owners can use the same form and choose “Change my existing shop page”. You get a row with “Update” in the column “New or update”. '
     'Open their post, change what they sent (4.2), then set Status to “Update done”.')
h2('4.4 Shop closed or wants to leave')
bullets([('Closed for a holiday: ', 'add one line at the top of the post text, e.g. “Closed 1–15 August for holidays.” Remove it afterwards.'),
         ('Closed for good: ', 'open the post › Revert to draft. It disappears from the site but you keep it.'),
         ('Owner wants to be removed: ', 'Revert to draft or delete the post the same week. Also delete their row in the sheet and their photos folder within one month (DSGVO). Write it in your notes.')])

# ------------------------------------------------------------------ 5
h1('5. Products, photos and weekly offers')
para('AfroKauf is a directory, not an online shop: customers do not buy on the site. So a “product” on a shop page is one of three things: '
     'a word in the “We sell” list (so search finds it), a photo, or an offer. Here is how to add each.')
h2('5.1 Add a product to the search')
steps(['Open the post › HTML view.',
       'In data-sells, add the product at the end, after a comma. Add the names customers type: English, German and the local name.',
       'Update.'])
code('data-sells="gari, egusi, Melonenkerne, ogbono, plantain, Kochbananen, palm oil, Palmöl, stockfish, Stockfisch, yam"')
h2('5.2 Add product photos')
steps(['Open the post › Compose view.',
       'Click where the photo should go (below the shop block).',
       'Insert image › Upload from computer › choose the photo.',
       'Click the photo › Add caption: the product name, and the price if you want, e.g. “Egusi, 500 g – 4.50 € (9.00 €/kg)”.',
       'Update.'])
note('If you show a price for something sold by weight or volume, also show the price per kilo or litre (Grundpreis). This is the law in Germany (PAngV).')
h2('5.3 Change the shop’s main picture')
para('The first photo in the post is the picture in all lists. To change it: in Compose view, drag the new photo to the top (or cut it with Ctrl+X and paste it at the top), then Update.')
h2('5.4 Weekly offers (Premium)')
steps(['Open the post › HTML view.',
       'Paste this block below the shop block and change the text.',
       'Update. When the offers end, delete the block or replace it with the new week.'])
code('<h3>Offers this week (until Saturday 28 November)</h3>\n<ul>\n  <li>Plantain, 1 kg – 2.49 €</li>\n'
     '  <li>Palm oil, 1 l – 5.99 €</li>\n  <li>Stockfish, 500 g – 14.90 € (29.80 €/kg)</li>\n</ul>')
note('Share each offer week on social media with a link to the shop page. Use the post templates from the social media kit.')
h2('5.5 Good photos')
bullets(['Landscape (wide) photos look best in the lists. Daylight, no blur, a clean shelf.',
         'Only the shop’s own photos. Pictures copied from the internet or from producers’ websites can cost a fine.',
         'People who can be recognised need to agree. Ask, and keep their OK in writing (a WhatsApp “yes” is fine).',
         'Blogger makes photos smaller by itself. Photos straight from the phone are fine.'])

# ------------------------------------------------------------------ 6
h1('6. Find shops: the Hessen list')
para('In Drive › 10 Shop leads you find “AfroKauf shop leads – Hessen”: 64 African shops, hair salons, restaurants and one importer in '
     '10 Hessen cities, found in public web listings. The sheet has three tabs:')
bullets([('Summary: ', 'how many places per city and type, and how many are already listed. It counts by itself.'),
         ('Hessen: ', 'the list, grouped by city, with phone, WhatsApp, email, website, opening hours, where it was found and “How sure”.'),
         ('How to use this list: ', 'the steps and the rules.')])
h2('6.1 How to work with it')
steps(['Start with the rows marked High in “How sure”: they have their own website or several matching listings.',
       'Visit where you can. In Frankfurt, Taunusstraße, Moselstraße, Münchener Straße and Mainzer Landstraße are all within 10 minutes of the Hauptbahnhof: one afternoon, many shops. Bring printed flyers from the shop kit.',
       'Or call. Keep it short and friendly.',
       'After every contact fill in Status, Date contacted, How contacted and Outcome (drop-down lists).',
       'A shop says yes: send them the “List your shop” link (they agreed, so WhatsApp is fine now). They fill in the form themselves, so you get the right details and their OK in one step.',
       'Wrong number or closed: Status “Closed / wrong”. Do not delete the row, so nobody calls again.'])
h2('6.2 What to say')
code('English: “Hello, my name is … from AfroKauf. We are building a free website where customers find African shops in Hessen, '
     'with your address, opening hours and a WhatsApp button. Can I add your shop? It takes 5 minutes, and it is free.”\n\n'
     'Deutsch: „Guten Tag, mein Name ist … von AfroKauf. Wir bauen eine kostenlose Website, auf der Kunden afrikanische Geschäfte '
     'in Hessen finden, mit Adresse, Öffnungszeiten und WhatsApp-Button. Darf ich Ihr Geschäft eintragen? Es dauert 5 Minuten und ist kostenlos.“')
h2('6.3 The rules (important)')
bullets([('Collecting the list is fine: ', 'it is business information the shops published themselves. Use it only for AfroKauf, and do not sell or share it.'),
         ('Calling a shop is fine ', 'when it is clearly about their business (a free listing is). Stop if they say no.'),
         ('Do not send emails, WhatsApp or SMS ', 'to these numbers before the shop says yes. In Germany that counts as advertising without consent (§ 7 UWG), also towards businesses. '
          'Ask first, on the phone or in the shop: “May I send you the link on WhatsApp?”'),
         ('Say where you got their number ', 'the first time you talk to them, and that you will delete it if they want (DSGVO). Delete the rows of shops that said no after 6 months.'),
         ('Emails are rare: ', 'most small shops only publish a phone number. Ask for the email when you talk to them.')])
h2('6.4 Make it bigger')
bullets(['Towns still to check: Rüsselsheim, Bad Homburg, Limburg, Friedberg, Bad Hersfeld, Rodgau, Dreieich, Langen, Maintal, Frankfurt-Höchst, Frankfurt-Nordweststadt.',
         'Google Maps is the best way to check one shop: search “Afroshop” in the town and compare with the list.',
         'Ask every shop: “Which other African shops do you know?” Shop owners know each other. This is the fastest way to grow the list.',
         'The next states use the same sheet layout: Nordrhein-Westfalen, Berlin, Hamburg, Bayern, Baden-Württemberg.'])

# ------------------------------------------------------------------ 7
h1('7. Problems and fixes')
table(['What you see', 'Why', 'Fix'], [
    ['The form says “The form is not connected yet”', 'The ENDPOINT line still has PASTE_YOUR_WEB_APP_URL_HERE', 'Part 2.6, step 6'],
    ['“Sorry, sending did not work”', 'The web app is not set to “Anyone”, or the script was changed without a new version', 'Part 2.5 (Who has access: Anyone), then part 2.8'],
    ['No email arrives', 'Spam folder, or another address is set in NOTIFY_EMAIL', 'Check spam; check the line NOTIFY_EMAIL in the script'],
    ['No AfroKauf menu in the sheet', 'The sheet was not reloaded after setup', 'Reload the sheet tab (F5)'],
    ['“No map position found”', 'Google could not find the address', 'Copy lat and lng from Google Maps into the row (or into data-lat and data-lng)'],
    ['The shop has no picture in the lists', 'No photo in the post, or the first photo is very small', 'Part 5.3'],
    ['The shop is not in the search', 'Label “Shop” missing; feed not set to Full; 20-minute delay', 'Check the labels; Settings › Site feed › Full; wait 20 minutes'],
    ['The shop is not on its city page', 'The city label is spelled differently from the tile', 'Make the label exactly like the “Shops by city” tile'],
    ['“Open now” is wrong', 'Mistake in data-hours', 'Part 4.2: days Mo Tu We Th Fr Sa Su, times 10:00-20:00, ; between days'],
    ['The form looks broken after editing the page', 'The page was opened in Compose view', 'Paste the page code again in HTML view (part 2.6)'],
    ['“Status since” or the ⚠ flag does not change', 'Setup was not run after pasting the script, so the edit timer is missing', 'Run AfroKauf › Set up the sheet once'],
    ['The message is in the wrong language', 'The Language column of that row', 'Change Language in the row, then make the message again'],
    ['“Could not do this” when using the menu', 'You were not on the Sign-ups tab, or clicked the header row', 'Open the Sign-ups tab, click the shop’s row, try again'],
], widths=[4.8, 5.6, 6.1])

fix_numbering()
doc.save(OUT)
print('saved', OUT)
