#!/usr/bin/env python3
"""Build "AfroKauf Verbund – Business concept, phased plan and team" as a .docx (uploaded to Drive as a Google Doc).
    python3 build_business_plan_docx.py <out.docx>
Brainstorm turned into a director's plan: model, income streams, cooperative, shop warehouse network,
theories, phases (now / next / later), team roles, risks, money, first 30 days. Plain English.
"""
import pathlib
import sys

_here = pathlib.Path(__file__).with_name('build_guide_docx.py').read_text(encoding='utf-8')
exec(compile(_here.split('# ====================================================================== CONTENT')[0], 'build_guide_docx.py', 'exec'))

OUT = pathlib.Path(sys.argv[1])

doc.add_heading('AfroKauf Verbund – Business concept, phased plan and team', level=0)
para('A director’s plan: what AfroKauf is, how it makes money, which big ideas can make it grow (a cooperative and a network of shops '
     'that work as small warehouses), what to do now and what later, and which people to look for.')
para('Status: brainstorm and working plan, 25 November 2026. All numbers are examples to show the logic, not a forecast. '
     'Legal and tax points must be checked with a tax adviser (Steuerberater) and, for the cooperative, with a cooperative audit association.')

# ------------------------------------------------------------------ summary
h1('1. Summary on one page')
bullets([('Vision: ', 'AfroKauf Verbund becomes the network of African shops in Germany – “the EDEKA of African shops”: independent shops '
          'that are found together, buy together, sell online together and learn together.'),
         ('Why free: ', 'the basic listing is free so every shop joins. A directory is only valuable when it is complete; customers come where all shops are.'),
         ('How we earn: ', 'from shops and partners who want more – Premium visibility, seminars, advertising, partner packages, services – '
          'and later from commission on online orders, joint buying and our own products.'),
         ('Three engines, built one after the other: ', '(1) Directory and media (website, live shows, newsletter) → '
          '(2) Network and marketplace (shops as small warehouses, click & collect, delivery) → '
          '(3) Cooperative (joint buying and importing, own brand).'),
         ('Why we can win: ', 'we know the community, the tools are already built (website, shop, CRM, live overlays, video assets), '
          'and running costs are close to zero, so we can start without a loan.')])
table(['Phase', 'When', 'Main goal'], [
    ['0 Foundation', 'Now – month 1', 'Legal basics, website live, first 50 shops listed'],
    ['1 Launch and prove', 'Months 1–6', 'Hessen: 150 shops, first paying Premium shops, seminars, live shows'],
    ['2 Network pilot', 'Months 4–9', '5 shops in Frankfurt sell online together; first joint purchase'],
    ['3 Grow', 'Months 9–18', 'More regions, 3 hub shops, shipping across Germany, first team'],
    ['4 Cooperative and own brand', 'Months 18–36', 'Found the cooperative, joint imports, AfroKauf products, academy'],
    ['5 Scale', 'Years 3–5', 'Germany-wide and DACH, marketplace app, member-shop concept'],
], widths=[4, 3.2, 9.3])

# ------------------------------------------------------------------ model
h1('2. The business model')
h2('2.1 The answer to “How will you make money if registration is free?”')
para('“The basic listing is free so every African shop joins – a directory is only useful when it is complete. We earn from the shops and '
     'partners who want more visibility, more customers and more knowledge, and later from orders and joint buying in our network.”')
para('This is called freemium: free brings the shops, the shops bring the customers, and a part of them pays for more.')
h2('2.2 All income streams and when they start')
table(['Income stream', 'Who pays', 'Example price', 'Starts in phase'], [
    ['Premium listing (top of search, homepage, photos, weekly offers)', 'Shops', '19 €/month (founding price 9 €)', '1'],
    ['Seminars and workshops', 'Shop owners, founders', 'from 29 € per person', '1'],
    ['Advertising: live-show breaks, newsletter, banners, “Deals of the week”', 'Shops, wholesalers, brands, money transfer, shipping', '50–150 € per slot', '1'],
    ['Partner and sponsor packages', 'Wholesalers, banks, airlines, telecom, food brands', '300–1,000 €/year', '1–3'],
    ['Services for shops: logo, signs, product photos, Google profile, WhatsApp Business', 'Shops', 'one-off fees', '1'],
    ['Own tickets and products with payment link', 'Customers', 'per sale', '1'],
    ['Commission on online orders (click & collect, delivery)', 'Shops (from the order)', '5–10 % per order', '2'],
    ['Referral fees (card terminals, stock loans, insurance, parcel shop)', 'Partners', 'per referral', '2–3'],
    ['B2B orders: restaurants, caterers, churches, events', 'Business customers', 'margin / commission', '3'],
    ['Subscription box (“African pantry box”)', 'Customers', 'e.g. 29–49 €/month', '3'],
    ['Retail media in member shops (posters, QR, shelf space)', 'Brands, importers', 'per campaign', '3'],
    ['Cooperative membership and buying fee', 'Member shops', 'share + yearly fee + 1–3 % of purchases', '4'],
    ['Own brand (AfroKauf gari, spices, palm oil …)', 'Customers via member shops', 'higher margin', '4'],
    ['Academy certificate, market days, trade fair', 'Shop owners, exhibitors', 'fees / stands', '4'],
    ['Licence: “AfroKauf member shop” concept for new shops', 'New shops', 'yearly licence', '5'],
], widths=[6.2, 3.8, 3.5, 3])
h2('2.3 Why our costs stay low')
bullets(['Website on Blogger: free. CRM, sign-ups and orders on Google Sheets and Apps Script: free. Domain: about 12 € a year.',
         'Live shows with XSplit and our own overlays; videos with Camtasia and our own assets – no agency costs.',
         'No own warehouse: the stock already sits in the shops (part 4).',
         'So almost every euro of income is profit in the first phases, and we can grow step by step.'])
h2('2.4 Example: one year in Hessen (illustration, not a forecast)')
table(['Item', 'Calculation', 'Per month'], [
    ['Premium shops', '300 listed × 10 % = 30 × 19 €', '570 €'],
    ['Seminars', '2 × 15 people × 29 €', '870 €'],
    ['Advertising', '3 partners × 100 €', '300 €'],
    ['Total income', '', 'about 1,740 €'],
    ['Running costs', 'domain, small ads, materials', 'about 100–200 €'],
], widths=[4.5, 8, 4])

# ------------------------------------------------------------------ cooperative
h1('3. Big idea A: the cooperative (Verbund / Genossenschaft)')
para('A famous German example: EDEKA was founded in 1898 as a buying cooperative of small independent grocers, and REWE also grew out of grocers’ '
     'cooperatives. Small shops joined forces to buy like a big company – and stayed independent.')
h2('3.1 How it works')
steps(['Shops become members: they buy a share and pay a small yearly fee.',
       'The cooperative collects the orders of all members for the most-sold products (gari, rice, palm oil, egusi, spices, hair and beauty).',
       'It negotiates volume prices with importers and wholesalers – later it imports together (shared container from Ghana, Nigeria, Cameroon …).',
       'The cooperative keeps a small buying fee (e.g. 1–3 %). The rest of the savings goes back to the members at the end of the year '
       '(in German cooperatives this refund is called “Rückvergütung”).',
       'Next step: own AfroKauf products with correct German labelling, made once for all members.'])
h2('3.2 Where the money comes from')
bullets(['Members’ shares (start capital) and yearly fees: steady, predictable income.',
         'Buying fee on joint purchases and volume rebates from suppliers.',
         'Joint imports: removing a middleman is the biggest margin lever.',
         'Own brand: much higher margin than reselling other brands.'])
h2('3.3 Legal form (check with an adviser)')
bullets(['A registered cooperative (eingetragene Genossenschaft, eG) needs at least 3 founding members and written rules (Satzung), '
         'and it must be a member of a cooperative audit association (Prüfungsverband), which checks it regularly and costs money every year. '
         'Small cooperatives can have a simpler set-up; ask the audit association.',
         'Recommended path: now run AfroKauf as your own small company (e.g. UG or GmbH) – you keep control and can move fast. '
         'When 10–20 shops are committed, found “AfroKauf Verbund eG” for joint buying. Your company runs the platform (website, '
         'shop, marketing, live shows) as a paid service for the cooperative: you keep the tech and the brand, the members own the buying power.',
         'Members have one vote each, whatever their size – this builds trust between shops that are also competitors.'])

# ------------------------------------------------------------------ warehouse network
h1('4. Big idea B: the shops as a small warehouse network')
h2('4.1 How it works')
steps(['A customer anywhere in Germany orders on the AfroKauf website.',
       'The order goes to the nearest member shop that has the products in stock (or the shop the customer chose).',
       'The shop packs the order. The customer collects it (click & collect), a local courier brings it, or it is shipped by parcel.',
       'The shop earns its normal margin plus a packing fee; AfroKauf earns a commission; the customer pays the shipping.'])
h2('4.2 Why it is clever')
bullets([('Asset-light: ', 'no warehouse rent, no warehouse staff – big retailers call this “ship-from-store”.'),
         ('Distributed stock: ', 'there is a shop in most cities, so delivery is fast and cheap.'),
         ('Long tail: ', 'a customer in a small town gets products that are only sold in Frankfurt or Berlin.'),
         ('Hub-and-spoke: ', '3–5 bigger shops become regional hubs (e.g. Frankfurt, Cologne, Berlin, Hamburg, Munich). Joint purchases arrive at a hub; '
          'the hub refills smaller shops and ships online orders.'),
         ('Good for the shops: ', 'more sales without more rent; they become part of something bigger.')])
h2('4.3 Example of one order (illustration)')
table(['Item', 'Amount', 'Goes to'], [
    ['Customer order', '40 €', ''],
    ['Shop margin (25 %)', '10 €', 'the shop'],
    ['AfroKauf commission (8 %)', '3.20 €', 'AfroKauf'],
    ['Packing fee (e.g. 1.50 €)', 'from the commission or added to shipping', 'the shop'],
    ['Shipping paid by the customer', 'about 5–6 €', 'the courier'],
], widths=[6, 6, 4.5])
h2('4.4 Rules that make it work')
bullets(['Start with dry goods only (gari, egusi, rice, spices, palm oil, hair and beauty). No fresh or frozen food until cold-chain delivery is solved.',
         'A simple stock sheet for the top 20–30 products per shop, updated every day; later a till system that updates stock automatically.',
         'Fair order rules: nearest shop first, rotation when several shops are equally near, all numbers visible to members.',
         'Packing standard: same box, same AfroKauf sticker and leaflet, same packing time (e.g. within 24 hours).',
         'Legal check before shipping food online: German food labelling and allergen information on the product page, the customer’s '
         '14-day right of withdrawal (with exceptions for perishable food), registration under the packaging law, imprint, privacy policy and terms.'])

# ------------------------------------------------------------------ theories
h1('5. Business theories behind the plan')
table(['Theory', 'What it means for AfroKauf'], [
    ['Network effects', 'Every new shop makes AfroKauf more useful for customers, and every new customer makes it more valuable for shops.'],
    ['Two-sided (later three-sided) marketplace', 'Shops on one side, customers on the other – and brands, importers and partners as a third side that pays for access.'],
    ['Freemium – “land and expand”', 'Free listing brings everyone in; paid extras grow with the shop’s success.'],
    ['Flywheel', 'More shops → more choice → more customers → more orders → better buying prices → better margins → more shops join.'],
    ['Economies of scale through aggregation', 'Many small buyers act as one big buyer and get big-buyer prices.'],
    ['Platform cooperativism', 'The members own (part of) the platform, so they trust it more than a stranger’s app or Amazon.'],
    ['Asset-light / distributed inventory', 'Use the stock and space that already exist in the shops instead of building a warehouse.'],
    ['Long tail', 'Many niche products, each sold in small numbers, add up to a big business online.'],
    ['Hub-and-spoke logistics', 'A few hubs receive bulk deliveries and serve the smaller shops around them.'],
    ['Vertical integration', 'Step by step from directory to buying, importing and own brand: keep more of the margin in the network.'],
    ['Retail media', 'Brands pay to be seen where people shop: in the shops, on the website, in the live show and newsletter.'],
    ['Jobs to be done', 'Customers want “find my food near me, open now”; shops want “more customers and better prices”; brands want “reach the community”.'],
], widths=[5, 11.5])

# ------------------------------------------------------------------ phases
h1('6. The phased plan (director’s view)')
para('Rule for every phase: do only what this phase needs, measure it, and move on only when the “gate” is reached. Phases can overlap a little.')

h2('Phase 0 – Foundation (now to month 1)')
bullets([('Goal: ', 'be ready to open: legal basics, website live, first shops listed.'),
         ('Implement now: ', 'register the business (talk to a tax adviser about the right form: sole trader first or UG straight away); '
          'Impressum and Datenschutz pages; upload the AfroKauf theme and connect the Google Sheet (setup guide); '
          'list the first 50 shops from the Hessen list (with their permission); Google Business profile, Instagram, Facebook, TikTok, YouTube; '
          'a business bank account; a simple monthly bookkeeping routine.'),
         ('Not yet: ', 'no online selling, no cooperative, no staff, no paid ads.'),
         ('Money: ', 'own savings; costs under 100 €.'),
         ('Gate to phase 1: ', 'website live, 50 shops listed, sign-up form and CRM tested end to end.')])

h2('Phase 1 – Launch and prove (months 1–6, Hessen)')
bullets([('Goal: ', 'show that shops and customers use AfroKauf and that some shops pay.'),
         ('Implement: ', 'list 150 shops in Hessen; weekly live show (offers, shop visits, interviews) with the AfroKauf overlays; '
          'monthly newsletter for shops and for customers; founding Premium offer (e.g. 9 € for 6 months) for the first 20 shops; '
          'first seminar every month; sell the first advert slots in live breaks and the newsletter; a QR-code poster “Find us on AfroKauf” in every shop.'),
         ('Talk to shops: ', 'interview 10–20 shop owners with the questions in part 11. This decides how phase 2 looks.'),
         ('Money: ', 'Premium, seminars, adverts, services. Target: income covers all running costs.'),
         ('Numbers to watch: ', 'shops listed, Premium shops, website visitors, calls/WhatsApp clicks per shop, live viewers, newsletter subscribers, seminar sign-ups.'),
         ('Gate to phase 2: ', '150 shops, 20 paying shops, at least 5 shops willing to try online orders.')])

h2('Phase 2 – Network pilot (months 4–9, Frankfurt)')
bullets([('Goal: ', 'prove that shops can sell online together and that joint buying saves money.'),
         ('Implement: ', '5 pilot shops in Frankfurt; 20–30 dry products; click & collect (already built) plus local delivery by courier or own driver; '
          'a shared stock sheet; packing standard; legal check for selling food online; payment online for delivery orders. '
          'First joint purchase: the top 10 products ordered together from one wholesaler – show the saving in euros to every shop.'),
         ('Not yet: ', 'no shipping across Germany, no cooperative paperwork, no own brand.'),
         ('Money: ', 'commission per order, packing fees covered, first referral fees.'),
         ('Numbers to watch: ', 'orders per week, average order value, profit per order, delivery time, stock errors, repeat customers, saving per joint purchase.'),
         ('Gate to phase 3: ', 'about 50 orders a week, stock errors under 5 %, a positive profit per order, shops want to continue.')])

h2('Phase 3 – Grow (months 9–18)')
bullets([('Goal: ', 'take what works to more cities and build the first team.'),
         ('Implement: ', 'expand the directory to Rhein-Main, NRW and Berlin (regional ambassadors); 3 hub shops; parcel shipping across Germany for dry goods; '
          'B2B orders for restaurants, caterers, churches and events; test a subscription box; retail media packages for brands; '
          'partner packages for wholesalers, money transfer and airlines; first part-time hires (part 7).'),
         ('Money: ', 'all phase 1–2 streams plus B2B, subscriptions, retail media, partner packages.'),
         ('Numbers to watch: ', 'active shops per city, orders per week, share of repeat customers, income per shop, cost per new customer.'),
         ('Gate to phase 4: ', '10–20 shops ask to buy together; joint purchases happen every month; monthly income can pay a small team.')])

h2('Phase 4 – Cooperative and own brand (months 18–36)')
bullets([('Goal: ', 'turn buying power into lasting margin and member loyalty.'),
         ('Implement: ', 'found “AfroKauf Verbund eG” with the committed shops (adviser + audit association); joint imports (shared containers); '
          '3–5 AfroKauf own-brand products; the AfroKauf Academy with a certificate; first African market day or trade fair; '
          'online payment and commission for all orders (marketplace).'),
         ('Money: ', 'membership shares and fees, buying fee, own brand margin, academy, events.'),
         ('Gate to phase 5: ', 'cooperative running with clear rules, own brand selling, network profitable without the founder doing everything.')])

h2('Phase 5 – Scale (years 3–5)')
bullets([('Goal: ', 'become the address for African shopping in Germany, Austria and Switzerland.'),
         ('Implement: ', 'Germany-wide coverage; marketplace app; “AfroKauf member shop” licence for new shops (signage, supply, training); '
          'financing partners for shop stock; an own central hub only if volume justifies it.'),
         ('Money: ', 'commission, licences, own brand, membership, media, partners.')])

h2('6.1 Now – next – later – not yet')
table(['Now (phase 0–1)', 'Next (phase 2–3)', 'Later (phase 4–5)', 'Not yet (avoid)'], [
    ['Website, CRM, sign-up form, shop with WhatsApp / click & collect', 'Online orders with 5 pilot shops, local delivery', 'Marketplace app, payment for all orders', 'Own warehouse'],
    ['Premium listing, seminars, adverts in lives and newsletter', 'Joint purchase with a wholesaler', 'Cooperative (eG), joint imports', 'Fresh and frozen food delivery'],
    ['Weekly live show, newsletter, social media', 'Hub shops, shipping in Germany', 'Own brand, academy certificate', 'Big paid ad campaigns'],
    ['Talking to 10–20 shops', 'First part-time team', 'Licence for new shops, DACH', 'Taking loans before the pilot works'],
], widths=[4.2, 4.2, 4.2, 3.9])

# ------------------------------------------------------------------ team
h1('7. The team: which people, which role, when')
para('Principles: hire for trust and access to the community first, skills second. Start with freelancers, commission-based ambassadors '
     'and part-time helpers; hire employees only when the income is regular. Write down each role in one page. '
     'Mix the community’s languages (English, French, German, and later Twi, Yoruba, Tigrinya, Amharic, Swahili …).')

h2('7.1 Phase 0–1: the founding circle')
table(['Role', 'What they do', 'Who to look for', 'How to pay'], [
    ['Founder and director (you)', 'Vision, partners, sales to shops, live-show host, decisions, money', '–', 'Later a salary from profit'],
    ['Shop ambassadors (2–4, by city)', 'Visit shops, explain AfroKauf, list shops, sell Premium, collect photos', 'Trusted community members, students, people who know shop owners; friendly, reliable', 'Commission per Premium sale (e.g. first month’s fee) + small fee per listed shop'],
    ['Community and social media helper', 'Posts, stories, comments, WhatsApp groups, newsletter text', 'Young creator from the community; writes well; knows TikTok and Instagram', 'Freelance per month or Minijob'],
    ['Content and video helper', 'Filming shop visits, editing with Camtasia, live-show production', 'Media student or hobby filmmaker', 'Per video / per show'],
    ['External: tax adviser (Steuerberater)', 'Business form, VAT, bookkeeping, payroll later', 'Adviser who knows small retail and start-ups', 'Hourly / monthly fee'],
    ['External: legal adviser (as needed)', 'Terms, online food rules, cooperative later', 'Lawyer for commercial / food law', 'Per case'],
], widths=[3.6, 4.8, 4.6, 3.5])

h2('7.2 Phase 2–3: building the operations')
table(['Role', 'What they do', 'Who to look for', 'How to pay'], [
    ['Operations and logistics coordinator', 'Runs the pilot: orders, stock sheet, packing standard, couriers, problems', 'Organised person with retail or delivery experience; calm under pressure', 'Part-time, then full-time'],
    ['Customer service (WhatsApp, phone, email)', 'Answers customers and shops, follows up orders', 'Patient, multilingual, good on the phone', 'Minijob / part-time'],
    ['Partnerships and advertising manager', 'Sells adverts, partner packages, B2B deals to wholesalers, brands, banks, airlines', 'Sales person with a network in the community and in business', 'Base fee + commission'],
    ['Regional coordinators / hub managers', 'Run a hub shop’s online orders and the shops around it', 'Ideally the hub shop owners themselves', 'Share of hub income'],
    ['Web and e-commerce developer (freelance)', 'Payments, stock connection, later the app', 'Freelancer with shop/payment experience; can work with Google Sheets and Apps Script first', 'Per project'],
    ['Bookkeeping / finance helper', 'Invoices, payments to shops, monthly numbers', 'Accounting student or part-time bookkeeper', 'Part-time'],
], widths=[3.8, 4.6, 4.6, 3.5])

h2('7.3 Phase 4–5: the cooperative and growth team')
table(['Role', 'What they do', 'Who to look for', 'How to pay'], [
    ['Purchasing and category manager', 'Joint buying, importers, container imports, own brand, quality and labelling', 'Experience in food import or wholesale; knows German food rules', 'Full-time'],
    ['Cooperative board (Vorstand) and supervisory board', 'Run and control the cooperative; small cooperatives can have a simpler set-up', 'Respected shop owners and one person with finance knowledge', 'As set in the rules'],
    ['Marketing lead', 'Brand, campaigns, newsletter, online ads, live-show programme', 'Marketing person who knows the community and data', 'Full-time'],
    ['Academy lead / trainer', 'Seminars, certificate, new-founder programme', 'Experienced shop owner or business trainer', 'Per seminar, then part-time'],
    ['Head of operations', 'All logistics, hubs, delivery partners, quality', 'Logistics manager', 'Full-time'],
    ['Finance lead / controller', 'Budget, cash flow, funding, reports for members and partners', 'Finance professional', 'Part-time, then full-time'],
], widths=[3.8, 4.6, 4.6, 3.5])

h2('7.4 Advisory board (from phase 1, unpaid or small fee)')
bullets(['An experienced grocery or retail person (ideally someone who knows how buying groups work).',
         'An importer or wholesaler of African food.',
         'A lawyer or tax adviser.',
         'A respected community leader (church, association, embassy contacts).',
         'Meet every 2–3 months; they open doors and warn you early.'])
h2('7.5 Where to find people')
bullets(['Community: churches, African associations, student groups, WhatsApp groups, the shops themselves.',
         'Universities (business, media, logistics students – also for internships and theses).',
         'LinkedIn, Xing and local start-up networks; start-up advice centres and the chamber of commerce (IHK).'])

# ------------------------------------------------------------------ risks
h1('8. Risks and how to handle them')
table(['Risk', 'How to handle it'], [
    ['Shops don’t trust each other (competitors)', 'Clear written rules, fair order routing, transparent numbers, one member one vote in the cooperative'],
    ['Shops don’t pay for Premium', 'Several income streams; prove value with numbers (calls, clicks, orders per shop)'],
    ['Stock counts are wrong', 'Few products first, daily stock sheet, later a till system'],
    ['Food law, returns, packaging rules', 'Legal check before phase 2; dry goods only; correct product information'],
    ['Cash flow (paying shops before customers pay)', 'Online payment before delivery; weekly payouts to shops'],
    ['Founder does everything', 'Ambassadors and helpers from phase 1; write processes down; the team in part 7'],
    ['Bigger players copy the idea', 'Community trust, cooperative ownership, events and live shows are hard to copy'],
], widths=[5.5, 11])

# ------------------------------------------------------------------ money
h1('9. Money: funding the phases')
bullets([('Phase 0–1: ', 'own savings and the first income – costs are very low. Consider a start-up grant: if you start from unemployment, ask the '
          'employment agency (Agentur für Arbeit) about the start-up grant (Gründungszuschuss).'),
         ('Phase 2–3: ', 'reinvest income; partner and sponsor packages; small start-up loans (e.g. KfW start-up programmes or Hessen’s micro-loans – '
          'check current offers with the IHK or a start-up advice centre); prize competitions for founders and social enterprises.'),
         ('Phase 4: ', 'members’ cooperative shares are start capital that stays in the community; supplier credit for joint purchases.'),
         ('Rule: ', 'no loan before the pilot proves that orders make a profit.')])

# ------------------------------------------------------------------ KPIs
h1('10. The numbers that matter')
table(['Number', 'Why it matters'], [
    ['Shops listed / active / paying', 'Health of the directory and the main income'],
    ['Website visitors, calls and WhatsApp clicks per shop', 'Proof of value for Premium'],
    ['Orders per week, average order value, profit per order', 'Health of the network'],
    ['Repeat customers (%)', 'Do customers come back?'],
    ['Stock accuracy and delivery time', 'Can the network keep its promise?'],
    ['Saving per joint purchase', 'The reason to join the cooperative'],
    ['Live viewers, newsletter subscribers', 'Reach for advertisers'],
    ['Income vs. costs every month', 'Survival'],
], widths=[7, 9.5])

# ------------------------------------------------------------------ questions + 30 days
h1('11. Questions to ask shop owners (before phase 2)')
steps(['Where do you buy your stock, and what do you pay for your top 10 products?',
       'What is your biggest problem: supplier prices, rent, too few customers, staff, time?',
       'Would you pack online orders for a fee? How quickly?',
       'Do you have storage space? Could your shop be a hub for your city?',
       'Would you join a buying group? What would make you trust it?',
       'What would you pay for: more customers, better prices, training, a better shop look?'])

h1('12. Your next 30 days')
steps(['Book a first meeting with a tax adviser: business form, VAT, bookkeeping.',
       'Website live with Impressum and Datenschutz; sign-up form and CRM tested.',
       'List the first 50 Hessen shops; visit 10 of them in person with the QR poster.',
       'Interview 10 shop owners with the questions in part 11.',
       'First live show and first newsletter.',
       'Find 2 shop ambassadors and 1 social media helper.',
       'Ask 3 possible partners (a wholesaler, a money transfer company, a food brand) about an advert or partner package.',
       'Start a simple monthly sheet with the numbers in part 10.'])

fix_numbering()
doc.save(OUT)
print('saved', OUT)
