# Afroshop Directory: a Blogger theme for African shops in Germany

One website where customers find African shops near them, by product ("who sells egusi in Frankfurt?"),
by city or by their location. Every shop has its own page with Call, WhatsApp and Directions buttons,
opening hours with "Open now", a "We sell" list, reviews (Blogger comments) and Google structured data.
Seminars and events get their own pages with "Add to calendar".

The theme is `theme.xml`. Everything else is the source and the preview.

## Install (10 minutes)

1. Make a new Blogger blog (or back up the current theme: **Theme → ▾ → Backup**).
2. **Theme → ▾ → Restore → Upload** `theme.xml`.
   If Blogger says only *"Could not restore theme"*, open **Theme → ▾ → Edit HTML**, paste the whole file
   and save. That screen shows the exact error; send a screenshot of it.
3. **Theme → ▾ → Mobile settings → Desktop**, so phones get this theme.
4. **Settings → Site feed → Allow blog feed: Full.** The search reads shop details from the feed.
5. **Settings → Comments → Comment moderation: Always.** Comments are shown as reviews, so read them first.
6. **Settings → Basic → Title**: the site name (e.g. "Afroshop Finder"). **Description**: a short tagline.
7. Create these **Pages** (Pages → New page): `List your shop`, `Contact`, `Impressum`, `Datenschutz`,
   `Terms for shop owners`. A German site needs an Impressum and a Datenschutzerklärung before it goes live.

Then check: homepage, a shop page, a city page (`/search/label/Berlin`), a search, the phone menu.

## Add a shop

A shop is a normal post.

1. **Title**: the shop's name.
2. Switch the editor to **HTML view** and paste this at the very top, then fill it in:

```html
<div class="shop-info"
  data-city="Frankfurt am Main"
  data-state="Hessen"
  data-address="Musterstraße 12, 60311 Frankfurt am Main"
  data-lat="50.1109" data-lng="8.6821"
  data-phone="+49 69 1234567"
  data-whatsapp="+49 151 1234567"
  data-hours="Mo-Fr 10:00-20:00; Sa 09:00-18:00"
  data-sells="gari, egusi, plantain, palm oil, stockfish, yam, indomie"
  data-origin="Nigeria, Ghana"
  data-services="delivery, money transfer"
  data-website="" data-instagram="">
Musterstraße 12, 60311 Frankfurt · Mo-Fr 10-20, Sa 9-18 · Tel. 069 1234567
</div>
```

3. Below it, in the normal editor: a short description and 2–5 photos (the first photo is the card picture).
4. **Labels**: `Shop`, the **category** (`Food`, `Hair & Beauty`, `Fashion`, `Restaurant`, `Services`, `Wholesale`),
   the **city** exactly as in the "Shops by city" gadget (`Frankfurt`) and the **state** (Bundesland) exactly as in the
   "Shops by state" gadget (`Hessen`). Add `Featured` for paying members.

| Field | How to fill it |
|---|---|
| `data-lat` / `data-lng` | On Google Maps, right-click the shop → the first line is "lat, lng". Needed for "Near me". |
| `data-hours` | Days `Mo Tu We Th Fr Sa Su` (or German `Mo Di Mi Do Fr Sa So`), ranges with `-`, days separated by `;`. Two shifts: `Mo-Fr 10:00-14:00, 15:00-19:00`. `So closed` is allowed. Times are German time. |
| `data-sells` | Comma-separated. **This is what search finds**, so use the words customers type, in English, German or local names (`egusi, Melonenkerne`). |
| `data-state` | The Bundesland, e.g. `Hessen`, `Bayern`, `Nordrhein-Westfalen`. For big cities the site works it out itself, but fill it in for small towns. |
| `data-whatsapp` | Any format; `0151…` is turned into `+49 151…`. Leave empty if the shop has no WhatsApp. |
| text inside the block | Shown only if the visitor's browser has no JavaScript. Keep it short. |

## Favicon (the small icon in the browser tab)

Layout → **Favicon** (at the top of the Layout page) → Edit → upload `favicon.ico`
from Drive › AfroKauf › 03 Logo › Favicons. If Blogger asks for a picture instead, use the 32 × 32 PNG.

## Add a seminar or event

A normal post with the labels `Events` (and e.g. `Seminar`) and this block at the top:

```html
<div class="event-info" data-date="2027-01-23" data-time="14:00-17:00"
  data-place="Bürgerhaus Gutleut" data-city="Frankfurt am Main"
  data-price="29 € · members 19 €" data-register="https://...">23 January 2027, 14:00-17:00</div>
```

Upcoming events appear on the homepage automatically, nearest date first. Past events disappear from it.

## Things you edit in Layout

| Gadget | What it does |
|---|---|
| Announcement bar | The thin bar above the header. Change the text for news; remove the gadget to hide the bar |
| Site name (Header) | Blog title and tagline, or upload a logo image instead of the text |
| Menu, "List your shop" button | Header links |
| African shops across Germany | Homepage intro text |
| Browse by category | Category tiles. **Also feeds the search's category names.** Each link is `/search/label/<Label>` |
| Featured shops | Intro text; shows posts with the `Featured` label |
| How it works | Three steps for customers on the homepage |
| Shops by city | City tiles. **Also fills the "Where?" list in the search.** Add a city here when its first shop joins |
| Shops by state | All 16 Bundesländer. Also in the "Where?" list. A link is `/search/label/<State>` |
| Seminars & events | Intro text; shows upcoming `Events` posts |
| Own an African shop? | The plans and prices (plain HTML; keep the `plan` classes) |
| Partners and supporters | Text and partner logos (`<ul><li><img src="..."></li></ul>`) |
| Follow us (footer) | Links to your social media pages |
| Directory settings | Label names and page addresses the script uses. Add `date_language: de-DE` for German dates |
| Site words | Translate any button or message, one per line: `Open now: Jetzt geöffnet` |
| Footer gadgets | About, owner links, legal links |

German starter for **Site words**:

```
Open now: Jetzt geöffnet
until: bis
Closed: Geschlossen
opens: öffnet
today: heute
tomorrow: morgen
Call: Anrufen
Directions: Route
Featured: Empfohlen
Searching...: Suche läuft...
Shops selling: Shops mit
in: in
near you: in deiner Nähe
shops found: Shops gefunden
shop found: Shop gefunden
No shops found. Try another word or a nearby city.: Nichts gefunden. Versuche ein anderes Wort oder eine Stadt in der Nähe.
Contact & location: Kontakt & Anfahrt
Opening hours: Öffnungszeiten
We sell: Wir verkaufen
Products from: Produkte aus
Services: Service
More shops in: Weitere Shops in
See all: Alle ansehen
Is this your shop?: Ist das dein Shop?
Update your listing: Eintrag aktualisieren
Report wrong information: Fehler melden
Monday: Montag
Tuesday: Dienstag
Wednesday: Mittwoch
Thursday: Donnerstag
Friday: Freitag
Saturday: Samstag
Sunday: Sonntag
African shops in: Afroshops in
Event details: Veranstaltung
Register: Anmelden
Add to calendar: In den Kalender
Show more: Mehr anzeigen
```

## How it works and its limits

- Search runs in the visitor's browser: it reads every `Shop` post from the blog's feed (cached 20 minutes)
  and matches the words against name, `data-sells`, origin, services, labels and description.
  Good up to roughly **500–1,000 shops**. Beyond that, move the shop index to a Google Sheet.
- "Near me" uses the browser's location only after the visitor taps the button. The position never
  leaves their device: distances are calculated in the page. No map is embedded, so no Google Maps cookies.
  "Directions" opens Google Maps only when tapped.
- No Google Fonts are loaded (German courts have fined sites for that without consent); the theme uses system fonts.
- Stock and offers are what the post says. Shop owners can't edit their own page unless you add them as
  Blogger authors (max. 100); usually you update pages from their WhatsApp messages or a Google Form.

## For developers

```bash
python3 scripts/build.py && python3 scripts/check.py   # src/ → theme.xml, then audit
python3 preview/make_preview.py                        # preview/*.html with DEMO (fictional) shops
```

Edit `src/` only: `theme.xml` (structure), `skin.css`, `theme.js` (menu, images, dates),
`directory.js` (shops, events, search, hours, structured data).
