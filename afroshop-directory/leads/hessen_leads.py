"""Hessen shop leads -> AfroKauf leads workbook (xlsx, uploaded to Drive as a Google Sheet).
Every row is public business information found by web search in November 2026. Check it before use."""
import sys
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule

# name, type, city, address, phone, phone2/whatsapp, email, web/social, hours, sources, confidence, notes
L = [
 # ---------------- Frankfurt am Main
 ('AfroShop Afrika-Afrika', 'Food', 'Frankfurt am Main', 'Taunusstraße 43, 60329 Frankfurt am Main', '0152 14031764', 'WhatsApp 0174 9853157', '', 'https://afroshopafrika-afrika.de/', '', 'Own website + Impressum', 'High', 'Fresh vegetables, frozen food, drinks, cosmetics. Has its own website: good first contact.'),
 ('Afroshop Duka Kilimanjaro', 'Food', 'Frankfurt am Main', 'Dreieichstraße 29, 60594 Frankfurt am Main', '069 60608977', '', '', '', '', '11880.com', 'Medium', 'Sachsenhausen.'),
 ('Mode- und Afroshop (Hauptbahnhof-Passage)', 'Fashion', 'Frankfurt am Main', 'Hauptbahnhof-Passage, 60329 Frankfurt am Main', '069 24247273', '', '', '', '', '11880.com; branchenkompass-frankfurt.de', 'Medium', 'Clothes shop in the station passage.'),
 ('GT World of Beauty Kosmetikhandel GmbH', 'Hair & Beauty', 'Frankfurt am Main', 'Münchener Straße 45, 60329 Frankfurt am Main', '069 24278738', '069 24278737 (other listing)', '', '', '', '11880.com; stadtbranchenbuch.com', 'Medium', 'Cosmetics, wigs and hair. Two directories give different last digits.'),
 ('Afro-Shop Kaiserstraße', 'Hair & Beauty', 'Frankfurt am Main', 'Kaiserstraße 64, 60329 Frankfurt am Main', '01521 2830094', '', '', '', '', 'cylex.de; frankfurt-adressbuch.de', 'Medium', 'Listed as hairdresser and cosmetics.'),
 ('Kaneshie African Shop', 'Food', 'Frankfurt am Main', 'Moselstraße 51, 60329 Frankfurt am Main', '069 29728585', '', '', '', 'Mo-Sa 09:00-18:00', '11880.com; frankfurt-inklusiv.de', 'Medium', 'Ghanaian name (Kaneshie = Accra market).'),
 ('African Shop Big Mama', 'Food', 'Frankfurt am Main', 'Taunusstraße 45-47, 60329 Frankfurt am Main', '069 26010327', '01522 4320581', '', '', '', '11880.com', 'Medium', 'Next door to AfroShop Afrika-Afrika: visit both on one trip.'),
 ('African Shop Wiesenhüttenplatz', 'Food', 'Frankfurt am Main', 'Wiesenhüttenplatz 39, 60329 Frankfurt am Main', '069 65603884', '069 26010327 (other listing)', '', '', '', 'branchenkompass-frankfurt.de; 11880.com; jeanlucabobo.com', 'Low', 'Directories disagree on the phone number. Check in person.'),
 ('African Bazaar (Ibrahim African Basar)', 'Food', 'Frankfurt am Main', 'Mainzer Landstraße 107, 60329 Frankfurt am Main', '069 259488', '', '', '', 'Mo-Fr 09:00-20:00; Sa 09:00-16:00 (sources differ)', 'dasoertliche.de; 11880.com; gelbeseiten.de; infobel.com', 'High', 'Long-running (reviews since 2008). Food, cosmetics, music, barbers inside.'),
 ('Salems Afro Hair Salon', 'Hair & Beauty', 'Frankfurt am Main', 'Gutleutstraße 155, 60327 Frankfurt am Main', '', '', '', '', '', 'friseure-friseursalons.de', 'Low', 'Braids. Phone not found.'),
 ('Afrohair Salon LW', 'Hair & Beauty', 'Frankfurt am Main', 'Spohrstraße 63, Frankfurt am Main', '', '', '', 'Yelp listing', '', 'yelp.com', 'Medium', 'Braids, twists, locs, crochet. Founded 2018.'),
 ('Black Hair Salon', 'Hair & Beauty', 'Frankfurt am Main', 'Gutleutstraße 127, Frankfurt am Main', '', '', '', '', '', 'afroplus.de', 'Low', 'Says it has been open 30+ years. Weaving, relaxer, braids, kids.'),
 ('Ebenezer Hair & Cosmetics', 'Hair & Beauty', 'Frankfurt am Main', '', '', '', '', 'https://ebenezerffm.com/', 'Mo-Sa 10:00-20:00', 'Own website', 'Medium', 'Address not in search results: see the website Impressum.'),
 ('Rorossalon', 'Hair & Beauty', 'Frankfurt am Main', '', '', '', '', 'https://rorossalon.de/', '', 'Own website', 'Medium', 'Braids, wigs, sew-ins. Address: see website.'),
 ('Black Lion', 'Restaurant', 'Frankfurt am Main', 'Nauheimer Straße 10, 60486 Frankfurt am Main', '', '', '', 'https://www.blacklionfrankfurt.de/', 'Mo-Th 13:00-22:00; Fr-Sa 13:00-23:00; Su 13:00-22:00', 'Own website', 'High', 'Ethiopian and Eritrean.'),
 ('Savanna', 'Restaurant', 'Frankfurt am Main', 'Alte Gasse 69, Frankfurt am Main', '', '', '', 'https://www.savanna-restaurant.com/', '', 'Own website', 'High', 'Eritrean and Ethiopian, vegan options.'),
 ('Im Herzen Afrikas', 'Restaurant', 'Frankfurt am Main', '', '', '', '', 'https://www.imherzenafrikas-frankfurt.de/', '', 'Own website', 'Medium', 'Eritrean. Address: see website.'),
 ('Erta Ale', 'Restaurant', 'Frankfurt am Main', 'Leipziger Straße 47, Frankfurt am Main', '', '', '', 'https://www.ertaale.net/', '', 'Own website', 'High', 'Ethiopian.'),
 ('Sebeta', 'Restaurant', 'Frankfurt am Main', 'Werftstraße 15, Frankfurt am Main', '', '', '', 'https://www.sebeta-restaurant.de/', 'Lunch buffet Mo-Th 12:00-15:00', 'Own website', 'High', 'Ethiopian.'),
 ('Taste of Africa', 'Restaurant', 'Frankfurt am Main', 'Düsseldorfer Straße 15-17, Frankfurt am Main', '', '', '', 'https://tasteafrica.setmore.com/', '', 'Own booking page', 'Medium', 'African and Ethiopian.'),
 ('Adulis', 'Restaurant', 'Frankfurt am Main', 'Dreieichstraße 35, Frankfurt am Main', '', '', '', 'TheFork listing', '', 'thefork.de', 'Medium', 'Eritrean and Ethiopian.'),
 ('Mommona', 'Restaurant', 'Frankfurt am Main', 'Sachsenhausen (street not found)', '', '', '', '', '', 'frankfurt-tipp.de', 'Low', 'East African, many vegan dishes.'),
 ('Ambassel', 'Restaurant', 'Frankfurt am Main', 'By the Main river (street not found)', '', '', '', '', '', 'frankfurt-tipp.de', 'Low', 'Ethiopian.'),
 ('African Queen', 'Restaurant', 'Frankfurt am Main', 'Near the Messe (street not found)', '', '', '', '', '', 'frankfurt-tipp.de', 'Low', 'Eritrean.'),
 ('Kenkey House', 'Restaurant', 'Frankfurt am Main', '', '', '', '', 'Yelp listing', '', 'yelp.de', 'Low', 'Ghanaian name. Very few details online.'),
 # ---------------- Wiesbaden
 ('Chriskes Afro Care (Chris Kes Afro Beauty)', 'Food', 'Wiesbaden', 'Rheinstraße 69, 65185 Wiesbaden', '0611 18171740', '', 'chriskes@gmx.net', 'https://chriskes-afro-beauty.de/', '', 'Own website; cylex.de; 11880.com; afrohype.de', 'High', 'Food AND hair/beauty/nails. Online shop with pick-up. Open since 2015.'),
 ('Home Afrika Afro Shop', 'Food', 'Wiesbaden', 'Wörthstraße 16, 65185 Wiesbaden', '', '', '', '', '', 'afrohype.de', 'Low', 'Phone not found.'),
 ('Afroshop Black & White Wiesbaden', 'Hair & Beauty', 'Wiesbaden', 'Schiersteiner Straße 20, Wiesbaden', '', '', '', 'Facebook page', '', 'facebook.com; afrohype.de', 'Medium', 'Extensions, cornrows, crochet braids. Named in a "Top 10 Afroshops in Germany" list.'),
 ('Salon Latino', 'Hair & Beauty', 'Wiesbaden', 'Oranienstraße 60, Wiesbaden', '0611 97159577', '', '', 'https://salon-latino.jimdofree.com/', '', 'Own website', 'Medium', 'Afro hairstyles and braiding.'),
 ('HairX Salon', 'Hair & Beauty', 'Wiesbaden', '', '', '', '', 'http://hairx.de/', '', 'Own website', 'Low', 'Braids, locs, extensions. Address: see website.'),
 ("Fidel's Place Afro Salon", 'Hair & Beauty', 'Wiesbaden', '', '', '', '', 'Facebook page', '', 'facebook.com', 'Low', 'Men, women, kids.'),
 ('African American Hair Salon Prestige', 'Hair & Beauty', 'Wiesbaden', 'Rheingauviertel (street not found)', '', '', '', 'Foursquare listing', '', 'foursquare.com', 'Low', 'Old listing. May be closed.'),
 ('Mama of Africa (Wiesbaden)', 'Restaurant', 'Wiesbaden', 'Wiesbaden city centre', '', '', '', 'https://www.mamaofafrica-wiesbaden.de/', '', 'Own website', 'Medium', 'Eritrean and Ethiopian. Also has a Gießen branch.'),
 ('African Palace', 'Restaurant', 'Wiesbaden', 'Kaiser-Friedrich-Ring 39, 65185 Wiesbaden', '', '', '', '', '', 'yelp.de', 'Low', ''),
 # ---------------- Offenbach am Main
 ('AfroLatino Supermarkt', 'Food', 'Offenbach am Main', 'Kaiserstraße 73, 63065 Offenbach am Main', '', '', '', 'TikTok @afrolatinosupermarkt', '', 'tiktok.com', 'Medium', 'New opening (2024/25). Message them on TikTok or visit.'),
 ('Afrika Mini Markt', 'Food', 'Offenbach am Main', 'Große Marktstraße 35, 63065 Offenbach am Main', '069 15619557', '', '', 'http://www.afrikaminimarkt.de/', '', 'Own website (old page)', 'Medium', 'Food, cosmetics, hair care, textiles, art. Website is ~7 years old.'),
 ('African Shop Luisenstraße', 'Food', 'Offenbach am Main', 'Luisenstraße 71, 63067 Offenbach am Main', '069 82362545', '', '', '', '', 'dasoertliche.de; golocal.de; stadtbranchenbuch.com', 'Medium', ''),
 ('Afro-Caribean-Shop', 'Food', 'Offenbach am Main', 'Berliner Straße 118, 63065 Offenbach am Main', '069 82367469', '', '', '', '', 'stadtbranchenbuch.com', 'Low', ''),
 ('Afro Diva', 'Hair & Beauty', 'Offenbach am Main', 'Tempelseestraße 14, Offenbach am Main', '069 26402797', '', '', 'https://afro-diva.de/', '', 'branchen-info.net', 'Medium', 'Online shop for hair and beauty.'),
 # ---------------- Darmstadt
 ('King David Afroshop', 'Food', 'Darmstadt', 'Holzstraße 9, 64283 Darmstadt', '06151 8619482', '', '', 'https://www.king-david-afroshop.de/ · facebook.com/Afroshopking', 'Mo-Sa 10:00-20:00', 'Own website; afroplus.de; facebook.com', 'High', 'Family business since 2014. Food and hair. Online shop: strong Premium candidate.'),
 ("Mama's Food Market", 'Food', 'Darmstadt', 'Kirchstraße 12, 64283 Darmstadt', '', '', '', 'https://mamasfoodmarket.de/', 'Mo-Sa 10:00-20:00', 'Own website', 'High', 'Fufu, plantain, gari, palm oil, smoked fish. Delivers in Germany.'),
 ("Bantu Kingz n' Queenz", 'Hair & Beauty', 'Darmstadt', 'Elisabethenstraße 49, Darmstadt', '06151 4936941', '', '', 'facebook.com/AfroAmericanHairstyleDarmstadt', '', 'facebook.com', 'Medium', 'Afro salon for women and men.'),
 ('Sonia Hair', 'Hair & Beauty', 'Darmstadt', 'Mobile (no shop address)', '', '', '', 'zenaba.de profile', '', 'zenaba.de', 'Low', 'Freelance braider. Not a shop: maybe a partner, not a listing.'),
 ('Yetenbi', 'Restaurant', 'Darmstadt', 'Goethestraße 46, 64285 Darmstadt', '', '', '', '', '', 'web search (restaurant list)', 'Low', ''),
 ('Baobab African street food', 'Restaurant', 'Darmstadt', 'Kunsthandwerkermarkt (market stall)', '', '', '', 'darmstadt-tourismus.de listing', '', 'darmstadt-tourismus.de', 'Low', 'Market stall.'),
 # ---------------- Kassel
 ('Keita Afro-Asia Shop', 'Food', 'Kassel', 'Kurt-Schumacher-Straße 5, 34117 Kassel', '0561 73983777', '', '', '', '', 'mapquest.com; jeanlucabobo.com (as Asia-Afro Shop / Asamai Markt)', 'Medium', 'Same address appears under other names.'),
 ('Afro Shop Center', 'Food', 'Kassel', 'Werner-Hilpert-Straße 1, 34117 Kassel', '0561 779246', '', '', '', '', '11880.com', 'Medium', ''),
 ('Afroshop Black & White Kassel', 'Hair & Beauty', 'Kassel', 'Kettengasse 1, 34117 Kassel (other listings: Frankfurter Str. 113 / Brüderstraße 8)', '0561 282097', '', '', '', '', '11880.com; afrohype.de', 'Medium', 'Three addresses online: probably moved. Call first.'),
 ("Mina's Afro Hair & More", 'Hair & Beauty', 'Kassel', 'Kurt-Schumacher-Straße 30, 34117 Kassel', '0170 4341932', '', '', 'Fresha / Planity booking page', '', 'fresha.com; planity.com', 'High', 'Takes online bookings: active business.'),
 ('Abessina', 'Restaurant', 'Kassel', 'Kurt-Schumacher-Straße 23, Kassel', '', '', '', '', '', 'web search (restaurant list)', 'Low', 'Eritrean and Ethiopian.'),
 ('Edna Restaurant', 'Restaurant', 'Kassel', 'Wilhelmshöher Allee 287, Kassel', '', '', '', '', '', 'web search (restaurant list)', 'Low', ''),
 ('Mama Africa (Kassel)', 'Restaurant', 'Kassel', 'Entenanger 4, 34117 Kassel', '', '', '', '', '', 'web search (restaurant list)', 'Low', 'Near Königsplatz.'),
 # ---------------- Gießen
 ('Afro Shop Gießen – One In Town (Afroshop Tina)', 'Food', 'Gießen', 'Bahnhofstraße 45, 35390 Gießen', '0641 5878325', '', '', 'TikTok @afroshop.giessen', 'Most days 11:00-20:00 (sources differ)', 'cylex.de; afrohype.de; meinestadt.de; onlinestreet.de; tiktok.com', 'High', 'Active on TikTok.'),
 ('Blue Nile Restaurant & Café', 'Restaurant', 'Gießen', 'Bahnhofstraße 53, 35390 Gießen', '', '', '', '', '', 'freizeitmonster.de', 'Low', ''),
 ('Mama of Africa (Gießen)', 'Restaurant', 'Gießen', 'Bahnhofstraße 7, 35390 Gießen', '', '', '', 'https://www.mamaofafrica-wiesbaden.de/', '', 'Own website; freizeitmonster.de', 'Medium', 'Same owners as Mama of Africa Wiesbaden: one contact, two listings.'),
 # ---------------- Hanau
 ('Afro-Asia Shop Hanau', 'Food', 'Hanau', 'Hospitalstraße 18, 63450 Hanau', '06181 4348730', '', '', '', '', 'web directories (via search)', 'Medium', 'A second listing gives another number.'),
 ('Afro Barbershop Hanau International', 'Hair & Beauty', 'Hanau', 'Hospitalstraße 11, 63450 Hanau', '0162 3089641', '', '', 'Fresha / Planity booking page', 'Evenings and weekends', 'cylex.de; fresha.com; planity.com', 'High', 'Men’s barber. Appointments by phone.'),
 ('Afro-Shop Krämerstraße', 'Hair & Beauty', 'Hanau', 'Krämerstraße 15, 63450 Hanau', '', '', '', '', '', 'golocal.de', 'Low', 'Only review is from 2010. Probably closed.'),
 # ---------------- Fulda
 ('Afro Latino International Trading', 'Food', 'Fulda', 'Petersgasse 16, 36037 Fulda', '', '', '', '', '', '11880.com; mylokaal.com', 'Medium', ''),
 ('ADI Hair & Beauty', 'Hair & Beauty', 'Fulda', '', '', '', '', 'mylokaal.com listing', '', 'mylokaal.com', 'Low', ''),
 ('Afro Asia Markt Fulda', 'Food', 'Fulda', '', '', '', '', 'mylokaal.com listing', '', 'mylokaal.com', 'Low', ''),
 # ---------------- Wetzlar
 ('Egepicom Afroamericashop', 'Food', 'Wetzlar', 'Karl-Kellner-Ring 21, 35576 Wetzlar', '06441 4445420', '', '', 'https://afroamericashop.de/', '', 'golocal.de; branchen-info.net; afroclub.org', 'Medium', 'Food, spices, frozen fish/meat, money transfer (one listing says no. 22).'),
 ('Afro Nature Foods', 'Wholesale', 'Wetzlar', 'Weingartenstraße 3, 35581 Wetzlar', '', '', '', 'http://afronaturefoods.com/', '', 'Own website', 'Low', 'Possibly an importer, not a shop: a good partner or supplier lead.'),
 # ---------------- Marburg
 ('New Life Shop – der Afro Shop', 'Food', 'Marburg', 'Bahnhofstraße 23, 35037 Marburg', '06421 6200989', '', '', '', '', 'stadtbranchenbuch.com', 'Low', 'Listed under gifts. Check what they sell.'),
]

SRC_URLS = {
 'AfroShop Afrika-Afrika': 'https://afroshopafrika-afrika.de/impressum',
 'Afroshop Duka Kilimanjaro': 'https://www.11880.com/branchenbuch/frankfurt-am-main/071213389B101815564/afroshop-duka-kilimanjaro.html',
 'Mode- und Afroshop (Hauptbahnhof-Passage)': 'https://www.11880.com/branchenbuch/frankfurt-am-main/181143735B48794168/modeshop-und-afroshop-inh-almaz-tuemelisan-modegeschaeft.html',
 'GT World of Beauty Kosmetikhandel GmbH': 'https://www.11880.com/branchenbuch/frankfurt-am-main/110633108B27752389/gt-world-of-beauty-kosmetikhandel-gmbh-afroshop-mit-kosmetik-peruecken-und-haaren-kosmetikshop.html',
 'Afro-Shop Kaiserstraße': 'https://web2.cylex.de/firma-home/afro-shop-1585032.html',
 'Kaneshie African Shop': 'https://www.11880.com/branchenbuch/frankfurt-am-main/182770043B113009143/kaneshie-african-shop.html',
 'African Shop Big Mama': 'https://www.11880.com/branchenbuch/frankfurt-am-main/182770043B113958807/african-shop-big-mama.html',
 'African Shop Wiesenhüttenplatz': 'https://branchenkompass-frankfurt.de/branchenbuch/african-shop-frankfurt-gutleutviertel-afro-shops_207475.html',
 'African Bazaar (Ibrahim African Basar)': 'https://www.11880.com/branchenbuch/frankfurt-am-main/071213389B1915354/ninje-ibrahim-african-basar.html',
 'Salems Afro Hair Salon': 'https://friseure-friseursalons.de/frankfurt-am-main/friseursalon/16040-salems-afro-hair-salon.html',
 'Afrohair Salon LW': 'https://www.yelp.com/biz/afrohair-salon-lw-frankfurt-am-main',
 'Black Hair Salon': 'https://afroplus.de/listing/black-hair-salon/',
 'Adulis': 'https://www.thefork.de/restaurants/frankfurt-am-main-c176689/afrikanisch-t385',
 'Mommona': 'https://www.frankfurt-tipp.de/en/index/top-tipps/ttkat/african-restaurants-in-frankfurt-rhein-main.html',
 'Ambassel': 'https://www.frankfurt-tipp.de/en/index/top-tipps/ttkat/african-restaurants-in-frankfurt-rhein-main.html',
 'African Queen': 'https://www.frankfurt-tipp.de/en/index/top-tipps/ttkat/african-restaurants-in-frankfurt-rhein-main.html',
 'Kenkey House': 'https://www.yelp.de/search?find_desc=Afrikanisches+Restaurant&find_loc=Gie%C3%9Fen%2C+Hessen',
 'Home Afrika Afro Shop': 'https://afrohype.de/listings/home-afrika-afro-shop/',
 'Afroshop Black & White Wiesbaden': 'https://www.facebook.com/p/Afroshop-Black-White-100063756259146/',
 "Fidel's Place Afro Salon": 'https://www.facebook.com/p/Fidels-Place-Afro-Salon-100063774124022/',
 'African American Hair Salon Prestige': 'https://de.foursquare.com/v/african-american-hair-salon-prestige/5402c9c4498ea2d8e579bd02',
 'African Palace': 'https://www.yelp.de/search?find_desc=Afrikanisches+Restaurant&find_loc=Mainz-Kastel',
 'AfroLatino Supermarkt': 'https://www.tiktok.com/@afrolatinosupermarkt/video/7398897868007886112',
 'African Shop Luisenstraße': 'https://www.dasoertliche.de/Themen/African-Shop-Einzelhandel-Offenbach-am-Main-Luisenstr',
 'Afro-Caribean-Shop': 'https://offenbach-am-main.stadtbranchenbuch.com/4209165.html',
 'Afro Diva': 'https://offenbach.branchen-info.net/fp_3719386.php',
 "Bantu Kingz n' Queenz": 'https://www.facebook.com/AfroAmericanHairstyleDarmstadt/',
 'Sonia Hair': 'https://zenaba.de/Friseurin/Sonia-Hair',
 'Baobab African street food': 'https://www.darmstadt-tourismus.de/en/visit/detailsen/poidetail/baobab-afrikanisches-street-food-auf-dem-kunsthandwerkermarkt.html',
 'Keita Afro-Asia Shop': 'https://www.mapquest.com/de/hessen/keita-afro-asia-shop-805408211',
 'Afro Shop Center': 'https://www.11880.com/branchenbuch/kassel-hessen/182770043B102413852/afro-shop-center.html',
 'Afroshop Black & White Kassel': 'https://www.11880.com/branchenbuch/kassel-hessen/182771284B53104372/afroshop-black-white.html',
 "Mina's Afro Hair & More": 'https://www.fresha.com/lvp/minas-afro-hair-more-kassel-kurt-schumacher-strasse-kassel-0aoAxJ',
 'Afro Shop Gießen – One In Town (Afroshop Tina)': 'https://afrohype.de/listings/afro-shop-giessen-one-in-town/',
 'Blue Nile Restaurant & Café': 'https://freizeitmonster.de/blog/afrikanische-restaurants-giessen',
 'Mama of Africa (Gießen)': 'https://freizeitmonster.de/blog/afrikanische-restaurants-giessen',
 'Afro Barbershop Hanau International': 'https://www.fresha.com/de/lvp/afro-barbershop-hanau-international-hospitalstrasse-hanau-85kaJQ',
 'Afro-Shop Krämerstraße': 'https://www.golocal.de/hanau/friseure/afro-shop-doussou-cissouma-imrN/',
 'Afro Latino International Trading': 'https://mylokaal.com/marketplace.php',
 'ADI Hair & Beauty': 'https://mylokaal.com/marketplace.php',
 'Afro Asia Markt Fulda': 'https://mylokaal.com/marketplace.php',
 'Egepicom Afroamericashop': 'https://www.golocal.de/wetzlar/afroshops/egepicom-afroamericashop-YUwMc/',
 'New Life Shop – der Afro Shop': 'https://marburg.stadtbranchenbuch.com/4406741.html',
 'Chriskes Afro Care (Chris Kes Afro Beauty)': 'https://web2.cylex.de/firma-home/chriskes-afro-shop-11587614.html',
}

HEAD = ['No.', 'Status', 'Business name', 'Type', 'City', 'Bundesland', 'Address', 'Phone', 'Phone 2 / WhatsApp', 'Email', 'Website / social',
        'Opening hours (as published)', 'Found on', 'Source link', 'How sure', 'Notes', 'Date contacted', 'How contacted', 'Outcome / next step']
W = [5, 14, 34, 13, 16, 11, 40, 16, 22, 22, 36, 26, 30, 30, 10, 46, 13, 15, 30]

GREEN, GOLD, CLAY, CREAM = '1F4D3A', 'E0A43A', 'C8553D', 'FBF6EE'
thin = Side(style='thin', color='E5DCCB')

wb = Workbook()
ws = wb.active
ws.title = 'Hessen'
ws.append(HEAD)
for c in ws[1]:
    c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor=GREEN)
    c.alignment = Alignment(vertical='center', wrap_text=True)
ws.row_dimensions[1].height = 30
order = ['Frankfurt am Main', 'Wiesbaden', 'Offenbach am Main', 'Darmstadt', 'Kassel', 'Gießen', 'Hanau', 'Fulda', 'Wetzlar', 'Marburg']
rank = {'Food': 0, 'Wholesale': 1, 'Hair & Beauty': 2, 'Fashion': 3, 'Restaurant': 4}
rows = sorted(L, key=lambda r: (order.index(r[2]), rank[r[1]], r[0]))
for i, r in enumerate(rows, 1):
    name, typ, city, addr, ph, ph2, mail, web, hours, found, conf, notes = r
    ws.append([i, 'To check', name, typ, city, 'Hessen', addr, ph, ph2, mail, web, hours, found, SRC_URLS.get(name, web if web.startswith('http') else ''), conf, notes, '', '', ''])
for row in ws.iter_rows(min_row=2):
    for c in row:
        c.alignment = Alignment(vertical='top', wrap_text=True); c.border = Border(bottom=thin)
    for c in (row[13], row[10]):
        if isinstance(c.value, str) and c.value.startswith('http'):
            c.hyperlink = c.value; c.font = Font(color='1F4D3A', underline='single')
for i, w in enumerate(W, 1):
    ws.column_dimensions[ws.cell(1, i).column_letter].width = w
ws.freeze_panes = 'D2'
ws.auto_filter.ref = ws.dimensions
n = ws.max_row
dv = DataValidation(type='list', formula1='"To check,Visited,Called,Interested,Listed (Basic),Listed (Premium),Not interested,Closed / wrong"', allow_blank=True)
ws.add_data_validation(dv); dv.add('B2:B%d' % (n + 300))
dv2 = DataValidation(type='list', formula1='"Visit,Phone call,WhatsApp (they wrote first),Email (they agreed),Event / seminar"', allow_blank=True)
ws.add_data_validation(dv2); dv2.add('R2:R%d' % (n + 300))
for val, col in (('High', 'DCEBE4'), ('Medium', 'F3E3C3'), ('Low', 'F7D9CC')):
    ws.conditional_formatting.add('O2:O%d' % (n + 300), FormulaRule(formula=['$O2="%s"' % val], fill=PatternFill('solid', fgColor=col)))
for val, col in (('Listed (Basic)', 'DCEBE4'), ('Listed (Premium)', 'B9DCC9'), ('Interested', 'F3E3C3'), ('Not interested', 'EEEEEE'), ('Closed / wrong', 'EEEEEE')):
    ws.conditional_formatting.add('B2:B%d' % (n + 300), FormulaRule(formula=['$B2="%s"' % val], fill=PatternFill('solid', fgColor=col)))

# --- Summary
s = wb.create_sheet('Summary', 0)
s['A1'] = 'AfroKauf – African shops in Hessen (first list)'; s['A1'].font = Font(bold=True, size=16, color=GREEN)
s['A2'] = 'Collected from public web listings on 19 November 2026. %d businesses in %d cities. Every line needs checking before you use it.' % (len(rows), len(order))
s['A4'] = 'City'; s['B4'] = 'Food'; s['C4'] = 'Hair & Beauty'; s['D4'] = 'Restaurant'; s['E4'] = 'Other'; s['F4'] = 'Total'
for c in s[4]:
    c.font = Font(bold=True, color='FFFFFF'); c.fill = PatternFill('solid', fgColor=GREEN)
for i, city in enumerate(order, 5):
    s.cell(i, 1, city)
    s.cell(i, 2, '=COUNTIFS(Hessen!$E:$E,$A%d,Hessen!$D:$D,"Food")' % i)
    s.cell(i, 3, '=COUNTIFS(Hessen!$E:$E,$A%d,Hessen!$D:$D,"Hair & Beauty")' % i)
    s.cell(i, 4, '=COUNTIFS(Hessen!$E:$E,$A%d,Hessen!$D:$D,"Restaurant")' % i)
    s.cell(i, 6, '=COUNTIF(Hessen!$E:$E,$A%d)' % i)
    s.cell(i, 5, '=F%d-B%d-C%d-D%d' % (i, i, i, i))
t = 5 + len(order)
s.cell(t, 1, 'Total').font = Font(bold=True)
for col in 'BCDEF':
    s['%s%d' % (col, t)] = '=SUM(%s5:%s%d)' % (col, col, t - 1); s['%s%d' % (col, t)].font = Font(bold=True)
s.cell(t + 1, 1, 'Listed so far')
s.cell(t + 1, 6, '=COUNTIF(Hessen!$B:$B,"Listed*")')
for col, w in zip('ABCDEF', (22, 10, 14, 12, 10, 10)):
    s.column_dimensions[col].width = w

# --- How to use
h = wb.create_sheet('How to use this list')
lines = [
 ('How to use this list', 'h'),
 ('1. Start with the "High" rows: they have a website or several matching listings, so they are most likely still open.', ''),
 ('2. Visit in person where you can (Frankfurt: Taunusstraße, Moselstraße, Mainzer Landstraße and Münchener Straße are all within 10 minutes of the Hauptbahnhof). Bring a printed shop flyer from the shop kit.', ''),
 ('3. After every contact fill in Status, Date contacted, How contacted and Outcome. Use the drop-down lists.', ''),
 ('4. A shop says yes → send them the link to "List your shop" on the website. They fill it in themselves, so you get their consent and the right details in one step.', ''),
 ('5. Wrong number or shop closed → set Status to "Closed / wrong". Do not delete the row, so nobody calls them again.', ''),
 ('', ''),
 ('The rules in Germany (important)', 'h'),
 ('• Collecting this list is fine: it is business information the shops published themselves. Keep it for AfroKauf work only and do not sell or share it.', ''),
 ('• Phone call to a shop: allowed when the call is clearly relevant to their business (a free listing for their shop is). Keep it short and polite and stop if they say no (§ 7 UWG).', ''),
 ('• Email, WhatsApp or SMS advertising: NOT allowed without their prior "yes" (§ 7 UWG), also to businesses. So do not mass-message these numbers. Ask on the phone or in the shop first: "May I send you the details on WhatsApp?"', ''),
 ('• Many shops are run by one person, so their details count as personal data (DSGVO). When you first contact a shop, tell them where you got their number and that they can ask you to delete it. Delete rows of shops that say no after 6 months.', ''),
 ('• Do not copy whole directories (11880, Gelbe Seiten, Google Maps) into this sheet. Use them to look up one shop at a time.', ''),
 ('', ''),
 ('How this list was made', 'h'),
 ('Web searches per city and type (Afroshop, afrikanische Lebensmittel, Afro-Friseur, afrikanisches Restaurant). Each row shows where it was found ("Found on" and "Source link"). Most small shops publish only a phone number, so emails are rare. Ask for the email when you talk to them. Google Maps is the best place to check if a shop is still open and has the newest phone number.', ''),
 ('Missing towns to check next: Rüsselsheim, Bad Homburg, Limburg, Friedberg, Bad Hersfeld, Rodgau, Dreieich, Langen, Maintal, Frankfurt-Höchst, Frankfurt-Nordweststadt.', ''),
]
for i, (txt, kind) in enumerate(lines, 1):
    c = h.cell(i, 1, txt); c.alignment = Alignment(wrap_text=True, vertical='top')
    if kind == 'h': c.font = Font(bold=True, size=13, color=GREEN)
h.column_dimensions['A'].width = 120
wb.save(sys.argv[1])
print(len(rows), 'rows')
