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

Label names must match exactly (same spelling and capitals) the labels on your posts.

## Sharing, printing, languages

- **Share bar on every post and every page** (static pages too): WhatsApp, Facebook, X, LinkedIn, Telegram, Reddit, Pinterest, Email and Copy link. On phones a **More apps** button opens the phone's own share menu (Instagram, Signal, SMS…). Links always use the clean page address (no `?m=1` or tracking codes).
- **Print button** next to the share buttons. The printout has only the article: title, date, text, images, and the source address at the bottom. No menus, sidebar, buttons or comments.
- **Language switcher** in the top bar (globe button), powered by Google Translate. Edit the list in Layout → *Languages*: one link per language, `<li><a href="#" data-lang="sw">Kiswahili</a></li>`. **The first language must be the one the blog is written in.** Codes: `sw` Kiswahili, `fr` French, `es` Spanish, `pt` Portuguese, `de` German, `ar` Arabic, `zh-CN` Chinese, `am` Amharic, `so` Somali, `lg` Luganda… The footer *Translate* gadget still offers every language. Translation is automatic (machine translation) and happens in the visitor's browser.
- **"Powered by Blogger" is hidden.** The Attribution gadget stays in Layout (Blogger expects it), but it never shows on the site.

## KPUWU version: what changed

- **Kept:** logo, all menu links, the 12 slider images, philosophy, all label blocks, partners, donate button, map, Ministry of Labour and COTU links, YouTube video, Translate, live chat, AdSense sponsor gadget.
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
