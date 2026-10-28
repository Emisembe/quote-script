# Solidarity: a Blogger theme for unions and associations

A rebuild of the BCorporate v3 theme used on kpuwuke.blogspot.com. It has the same idea (a magazine-style homepage fed by labels) with a modern, mobile-first design, no jQuery and every piece of content editable from **Layout**.

## Files to upload

| File | For |
|---|---|
| `build/theme-kpuwu-red-navy.xml` | KPUWU's blog: all current gadget content, union red + navy |
| `build/theme-kpuwu-logo-colours.xml` | KPUWU, coloured from the logo (not built yet: see "Colours") |
| `build/theme-union-template.xml` | Any other union or association: placeholder content to replace |

## Install (about 5 minutes)

1. **Back up first.** Blogger → **Theme** → ▾ next to *Customise* → **Backup** → Download. Restoring a theme can reset gadget text you edited.
2. **Theme** → ▾ → **Restore** → upload the `.xml` file.
   If you only see *"Could not restore theme"*: open **Theme** → ▾ → **Edit HTML**, select everything, paste the whole file and click **Save**. That screen names the exact problem; send me a screenshot.
3. **Theme** → ▾ → **Mobile settings** → choose **Desktop**, so phones get this responsive theme rather than Blogger's basic mobile theme.
4. Check on a phone and a computer: the homepage, a post, a label page (e.g. *Campaigns*), a search, a 404 (`/nothing-here`), the menu, and a test comment.

## What's on the homepage, and how to edit it (Layout → gadget → Edit)

| Section | Gadget | What to put in it |
|---|---|---|
| Top bar | **Follow us** | A list of social links. Icons are added automatically for Facebook, X/Twitter, YouTube, Instagram, LinkedIn, TikTok and WhatsApp. The same links appear in the footer. |
| Header | **Main menu** | A `<ul>` list of links. Put a second `<ul>` inside an item to make a dropdown (use `href="#"` on the parent). |
| Header | **Join button** | One link: the red button top right. The "Not a member yet?" box under every post reuses this link. |
| Hero | **Our philosophy / Workers united** | Title = small line above the big heading; content = the paragraph. The big heading is the blog title. |
| Hero | **Hero buttons** | A `<ul>` of links. The first one is red. |
| Hero | **Hero slideshow** | One or more `<img>` tags. With two or more, they rotate with arrows and dots. |
| What we do | **How we support members** | A `<ul>`: each `<li>` is a card, `<strong>` for the card title. |
| Numbers (template only) | **Our union in numbers** | A `<ul>`: `<li><strong>10,000+</strong> members</li>`. Delete the gadget and the red band disappears. |
| News blocks | **Campaigns / Emerging issues / Publications** | The gadget content is a **label name**. The block shows the latest posts with that label. |
| Leadership | **Message from the General Secretary** | A label name. Shows the latest post with that label. |
| Events | **Events** | A label name. Shows six posts as photo tiles. |
| Latest news | Blog posts | Your posts, as cards, on every list page. |
| About | **Background of the union / Who we are** | A label name. |
| Members | **Member institutions / Our branches** | A label name. A scrollable strip. |
| Call to action | **Stronger together** | A paragraph and a `<ul>` of two buttons. |
| Partners | **Our partners** | `<ul class="logo-list">` with an `<img>` per `<li>`. |
| Documents | **Important documents** (below the partners) | One `<li><a href="LINK">Title</a> Short description</li>` per document; instructions are inside the gadget. The homepage shows the first 6 as download cards; your **Downloads** page shows all of them. Hidden while the list is empty. |
| Footer | **Certifications & accreditations** | ISO and other certificates: one `<li><img src="…" alt="ISO 9001:2015" /><span>ISO 9001:2015 Quality management</span></li>` each (instructions are inside the gadget). The strip stays hidden while the list is empty. |

Label names must match exactly (same spelling and capitals) the labels on your posts.

## Articles written by members: credit the writer

The office publishes every article (writers don't need a Blogger account). To credit the person who wrote it, type these lines anywhere in the post, usually at the end, in the normal editor:

```
Written by: Jane Wanjiku | Shop steward, KCA University branch
Author photo: https://link-to-a-photo.jpg
About the author: Jane has represented support staff at KCA University since 2019.
```

- Only **Written by:** is needed. After the name, put the role after a `|` (or a comma).
- **Author photo:** paste a picture link, *or* leave it empty and insert the photo (Insert image) on the line just after it. No photo? The box shows the writer's initials.
- The lines disappear from the article and become a **byline** under the title ("By Jane Wanjiku · Shop steward…") and an **About the author** box at the end. Google is told who wrote it.
- **Writer pages (optional):** also give the post the label `Writer: Jane Wanjiku` (exactly the same name). The byline then links to a page of all her articles ("Articles by Jane Wanjiku"). Writer labels are kept out of topic lists, news cards, breadcrumbs and the Sitemap.

**Also automatic on every article:** reading time ("4 min read"); the first paragraph shown as a larger introduction; quotes (the editor's *Quote* button) shown as large pull quotes; and an **In this article** contents box on long articles with 3 or more headings (use *Heading* / *Subheading* in the editor).

## Videos under short articles

**Layout → Videos** (near the bottom of Layout): one YouTube link per line, optionally followed by `|` and a title:

```
https://www.youtube.com/watch?v=8ZJz4Cda9MY | History of trade unions
https://youtu.be/VIDEO-ID | Another union video
```

- **On computers:** under a post or page, the column beside the sidebar often ends early and leaves empty space. The theme fills that space with **as many videos as fit** (two per row), never making the page longer: a long article gets none, a short one gets two or more. It adjusts as photos load and when the window is resized.
- **On phones and tablets:** the first video shows under the article.
- Videos show as a picture with a play button and only load YouTube when someone presses play, so pages stay fast. A video that is playing is never moved.
- Empty list = no videos.

**Related articles** stay under every post, above the videos: other articles on the same topic first, topped up with your latest articles when the topic has fewer than three (or the post has no topic), so the box is never missing.

## Branch offices

**Layout → Branch offices** (near the bottom of Layout) holds the list. Add one `<li>` per branch, one detail per line (the instructions are inside the gadget):

```
<li>Nairobi branch
Region: Nairobi
Address: Solidarity Building, Digo Road, Nairobi
Contact: Jane Wanjiku, Branch Secretary
Phone: +254 700 000 000
Email: nairobi@example.com
WhatsApp: +254 700 000 000
Hours: Mon-Fri, 8:00-17:00
Notes: Visits by appointment only
</li>
```

Only the first line (the branch name) is required; also possible: `Map:` (a Google Maps link) and `Photo:` (a picture link). Each branch becomes a card with **Call**, **Email**, **WhatsApp** and **Directions** buttons. With more than 3 branches, a search box and a region filter appear. The branches are also given to Google (address, phone), which helps people searching for your offices.

Where it shows:
- a **Branches** page: Pages → New page → title **Branches** → publish (the address must end in `/p/branches.html`); the KPUWU menu item *Regions & Branches* already points there;
- any other page or post, e.g. **About KPUWU**: open the page → *HTML view* → put `<div class="u-branches"></div>` where the list should appear.

## Downloads page and Sitemap page (one-time setup, 2 minutes)

Both pages fill themselves from the theme; you only create them once, empty.

1. Blogger → **Pages** → **New page**. Title: **Downloads**. Leave the text empty (or write an intro line). **Publish**. The address must end in `/p/downloads.html`. Blogger makes it from the title; check it under *Page settings → Permalink*.
2. **Pages** → **New page**. Title: **Sitemap**. Leave it empty. **Publish**. The address must end in `/p/sitemap.html`.
3. Add both to the menu: **Layout** → *Main menu* → Edit, e.g. `<li><a href="/p/downloads.html">Downloads</a></li>`, and put the Sitemap link in the footer *Quick links* or *Useful links* gadget.

- **Downloads** shows every document from the *Important documents* gadget, with a Download button (and a View button for Google Drive files).
- **Sitemap** lists every page and every article, grouped by topic (label), newest first. It updates itself whenever you publish.
- Using other page names? Put `<div class="u-downloads"></div>` or `<div class="u-sitemap"></div>` in the page (in *HTML view*) and the theme fills that spot.

## Getting found on Google (SEO)

**What the theme does automatically**
- Tells Google who you are (structured data): the union's name, logo and social profiles, and for every post the headline, date, image, author and breadcrumb (Home › topic › article).
- Proper titles, one main heading per page, image descriptions (alt text added automatically from captions or the post title), fast, mobile-friendly pages. Google's Lighthouse SEO audit scores **100** on the home, post, page, Downloads and Sitemap pages.
- Shared links show a large preview image on WhatsApp, Facebook, X and LinkedIn.
- Points crawlers to Blogger's sitemap, and keeps list pages that only repeat posts (labels, search, archives, "older posts") out of Google's index while still following their links. Your posts and pages are indexed as normal.

**Blogger's XML sitemap.** Blogger creates it for you and keeps it up to date:
- `https://kpuwuke.blogspot.com/sitemap.xml`: all posts
- `https://kpuwuke.blogspot.com/sitemap-pages.xml`: all pages

**Submit it to Google Search Console (about 10 minutes, once)**
1. Go to <https://search.google.com/search-console> and sign in with the Google account that owns the blog.
2. **Add property** → choose **URL prefix** → enter `https://kpuwuke.blogspot.com/` → Continue. Blogger blogs owned by that account are usually verified automatically. If not, choose **HTML tag**, copy the `content="…"` code, and ask me to add it to the theme (or check Blogger *Settings → Crawlers and indexing*, which links to Search Console).
3. Left menu → **Sitemaps** → enter `sitemap.xml` → **Submit**. Then enter `sitemap-pages.xml` → **Submit**. Both should show *Success* within a day or two.
4. Optional: **URL inspection** → paste your homepage address → **Request indexing**.

**Blogger settings to switch on** (Blogger → **Settings**)
- *Meta tags* → **Enable search description** → on, then write a one-sentence description of the union (up to 150 characters). It appears under your name in Google.
- After that, every post editor has a **Search description** box (right side, *Post settings*): write one sentence per post. This is the biggest single help for clicks from Google.
- *Crawlers and indexing* → leave **Custom robots.txt** off (Blogger's default already lists the sitemap).
- *Basic* → **Description**: a short line about the union.
- *Publishing*: if you ever get a custom domain (e.g. kpuwu.or.ke), set it here and submit the sitemap again for the new address.

**Habits that matter most for ranking**
- Post regularly; use clear titles with the words people search for ("NSSF contribution rates 2026", not "Update").
- Give every image a caption or alt text, and use labels consistently (they become the Sitemap topics).
- Ask partners (COTU, universities, NGOs) to link to your site.

## Sharing, printing, languages

- **Share bar on every post and every page** (static pages too): WhatsApp, Facebook, X, LinkedIn, Telegram, Reddit, Pinterest, Email and Copy link. On phones a **More apps** button opens the phone's own share menu (Instagram, Signal, SMS…). Links always use the clean page address (no `?m=1` or tracking codes).
- **Print button** next to the share buttons. The printout has only the article: title, date, text, images, and the source address at the bottom. No menus, sidebar, buttons or comments.
- **Language switcher** in the top bar (globe button), powered by Google Translate. Edit the list in Layout → *Languages*: one link per language, `<li><a href="#" data-lang="sw">Kiswahili</a></li>`. **The first language must be the one the blog is written in.** Codes: `sw` Kiswahili, `fr` French, `es` Spanish, `pt` Portuguese, `de` German, `ar` Arabic, `zh-CN` Chinese, `am` Amharic, `so` Somali, `lg` Luganda… The footer *Translate* gadget still offers every language. Translation is automatic (machine translation) and happens in the visitor's browser.
- **"Powered by Blogger" is hidden.** The Attribution gadget stays in Layout (Blogger expects it), but it never shows on the site.

## KPUWU version: what changed

- **Kept:** logo, all menu links, the 12 slider images, philosophy, all label blocks, partners, donate button, map, Ministry of Labour and COTU links, YouTube video, Translate, AdSense sponsor gadget.
- **Removed on request:** the MyLiveChat "Leave a message" box.
- **The menu is now a gadget** (Layout → *Main menu*), so you no longer need Edit HTML to change it.
- **Removed (broken or retired):** jQuery and its plugins; AddThis share buttons (the service shut down), replaced by WhatsApp/Facebook/X/LinkedIn/copy-link buttons; Google+ links; the old Facebook like-box, replaced by Facebook's current Page embed; the Twitter timeline embed (it no longer loads reliably for visitors), now an icon in the top bar; the duplicate PayPal button and fake payment icons in the footer; the clock widget; the `<marquee>`, replaced by a smooth "Latest" ticker; Greek leftover labels; the old Universal Analytics code (Google stopped collecting data with it in 2023).
- **Analytics:** to track visitors again, create a GA4 property and paste its `G-…` ID under Blogger **Settings → Google Analytics property ID**.

### Menu links to check (they were like this in the old theme)

Several items point to the same page, so they probably need their real targets:
- *Labour Laws*, *Press Releases*, *Training / Education*, *Informal Workers*, *Pensions*, *Food Security* → label **Decent Work**
- *Reports / Publications*, *History of Unions*, *Gender Violence*, *Whistle Blowing*, *Sexual Harassment*, *Entrepreneurship* → page **/p/donate.html**
- *Cases in Court*, *Accomplishments*, *Working Together*, *Gallery / Notices* → page **/p/gallery.html**
- *Departments* and *Why join?* → label **Youth League**; *Decent Work* → label **Membership Section**; *Climate Change* → YouTube channel

Fix them in Layout → *Main menu* → Edit.

## Text and photos, whatever you paste in

- **Text:** fonts, sizes, colours and highlights pasted from Word, WhatsApp or other websites (or left over from the old theme) are replaced by the theme's style in posts, pages and gadgets. **Bold**, *italics*, underline, alignment, lists, quotes and links still work. Headings inside posts always use the theme's heading style.
- **Photos:** every photo shrinks to fit the screen, at any upload size. In news cards and thumbnails, photos fill the frame; logos, banners, very tall images and small images are shown whole, never cropped or blown up. Videos and maps pasted into posts keep their shape on phones, and wide tables scroll sideways.

## Colours

Change any colour under **Theme → Customise → Advanced**. To build the KPUWU logo-colour file, add a `kpuwu-logo` entry to `profiles/palettes.json` (same keys as `red-navy`) and run the build.

## For developers

```
src/theme.xml           structure, sections, gadgets (@@markers@@)
src/skin.css            all CSS + Blogger <Variable> colours
src/theme.js            vanilla JS (menu, slideshow, label feeds, ticker, related posts)
src/includables/        Blogger's own gadget code, copied from the original backup
profiles/<name>/        gadget titles (profile.json) and contents (<gadget id>.html)
profiles/palettes.json  colour schemes
reference/proven.json   what the original Blogger backup proves Blogger accepts
scripts/build.py        builds build/*.xml   (--check: fail if stale)
scripts/check.py        audit a theme file   (--ban "a,b": strings that must not appear)
scripts/preview.py      writes preview/*.html with the same markup
scripts/browser_test.js Playwright test: overflow, JS errors, feeds, menu, phone centring
```

```
python3 scripts/build.py && python3 scripts/check.py build/theme-kpuwu-red-navy.xml
python3 scripts/check.py build/theme-union-template.xml --ban "KPUWU,Kenya Private,kpuwuke,91844755,ca-pub-"
python3 scripts/preview.py && node scripts/browser_test.js
```

The audit only allows Blogger tags, gadget types, settings and data tags that the original KPUWU backup (or the skill's starter theme, see `reference/proven.json → extra`) proves Blogger accepts. Only Blogger itself can confirm a theme, so the first upload is the real test.
