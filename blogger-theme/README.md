# EFIC Blogger theme

The theme for eficc.blogspot.com, rebranded to the EFIC Brand Colour Guide v1.0.

| File | What it is |
| --- | --- |
| `theme-eficc.xml` | **The file to upload to Blogger.** Generated, so don't edit it by hand. |
| `original/theme-eficc-backup.xml` | The blog's own backup, the theme Blogger already accepts. |
| `src/brand.css` | The EFIC brand layer (colours, type, layout polish). |
| `scripts/build.py` | Applies the brand layer and the fixes to the backup, then writes `theme-eficc.xml`. |
| `scripts/check.py` | Pre-upload audit. Everything must be proven by the original theme. |
| `reference/proven.json` | What the original theme proves Blogger accepts, plus two documented exceptions. |
| `scripts/preview.py` | Writes `preview/home.html` and `preview/post.html` for browser testing. |
| `tests/` | Browser tests (Playwright): `full.js` menus and sharing, `langtest.js` languages and office cards, `slidetest.js` slideshow. |

```bash
python3 scripts/build.py && python3 scripts/check.py theme-eficc.xml && python3 scripts/preview.py
node tests/full.js && node tests/langtest.js && node tests/slidetest.js
```

## Install

1. **Theme → ▾ → Backup**, to keep a copy of the current theme.
2. **Theme → ▾ → Restore → Upload** `theme-eficc.xml`. If it only says *"Could not restore theme"*, use **Theme → ▾ → Edit HTML**, paste the whole file and save; that screen names the exact problem.
3. **Theme → ▾ → Mobile settings → Desktop**, so phones get this responsive theme.
4. Check: homepage, a post, a label page, a search, a missing page (404), the phone menu, and the contact form.

## What changed

**Brand**
- Navy `#14213D`, Gold `#E7B165` and Deep Navy `#0F1A30` replace the template's sky blue, green and red. Alert Red is gone, because the guide reserves it for LIVE broadcasts.
- Montserrat for headings, menus and buttons. Body copy uses Calibri, with Arial as fallback.
- Only approved colour pairings are used. Gold is never used for text on white, and white text never sits on gold. Hover colours that broke this rule now use navy.
- The hero has a navy overlay, a gold divider, and gold "Get in Touch" and outline "Our Expertise" buttons.
- Post, page and 404 headers are a compact navy bar.
- Section titles have gold rules. Expertise tiles are cards. The process rings and the post-card edge are gold, and sidebar titles use the guide's gold left edge.

**Sharing, social links and footer logo**
- Posts have WhatsApp (now on desktop too), Telegram and Print share buttons. Print gives a clean, EFIC-headed article: no menu, sidebar, comments or footer, and each link's address is printed after it.
- **Social icons:** in **Layout → Footer Social Widget** (or **Top Social Widget**) → *Edit* → *Add new link*. The **Link name** chooses the icon, capitals don't matter, and any other name gets a link icon. Links left as `#` stay hidden.
  - **Brand icons:** facebook, twitter, x, linkedin, instagram, youtube, tiktok, whatsapp, telegram, pinterest, github, medium, reddit, snapchat, spotify, twitch, vimeo, flickr, slack, wechat, xing, quora, google, tumblr, behance, dribbble, soundcloud, skype, rss.
  - **Other icons:** email, website, phone, podcast.
- **Footer logo:** **Layout → Footer Logo → HTML/JavaScript → Edit**. Change the image link, or delete the gadget and use *Add a Gadget* in the same spot.

**One menu bar**
- The homepage-only second menu, with its fixed links and logo, is gone. One bar stays fixed at the top of every page: the logo on the left, then the **Main Menu** gadget with its dropdowns, then the language switcher.
  - The bar is see-through over the homepage photo, and solid navy once you scroll or when the homepage has a slideshow.
  - Below 1180px wide, and whenever the menu items no longer fit on one row (for example after you add more in Layout), it switches to a hamburger button on the right instead of wrapping onto two rows.
- **Logo:** **Layout → Menu Logo → HTML/JavaScript → Edit**, then change the image link. You can also delete the gadget and use *Add a Gadget* in the same spot.
- **Menu links:** **Layout → Main Menu → Edit**. Start a name with `_` to put it in the dropdown under the item above it. To jump to a homepage section, use links like `/#section-2` (Expertise), `/#section-3` (Process), `/#main-wrapper` (Work & Insights), `/#section-5` (Videos) or `/#section-6` (Contact).

**Languages: English, Kiswahili, Deutsch, Français, العربية**
- The switcher is in the menu bar on every page. Visitors pick a language and the whole page is translated, posts included, by Google's website translation.
- The choice is remembered as visitors move around the blog. Choosing **English** brings back the original text.
- Google's script loads only for visitors who pick another language, so English pages stay fast.
- Arabic reads right-to-left in a matching Arabic font (Cairo).
- The company name, logo, addresses, phone numbers and emails are never translated.
- If Google's in-page translation ever stops working, the switcher opens the same page through Google Translate (`…translate.goog`) instead.
- Translation is automatic, so it is good for understanding but not certified. For key pages (services, contact) you can also write your own versions as separate pages and link them from the menu.
- To change the languages, edit `LANGS` and the `<option>` list in `scripts/build.py`, then rebuild.

**Office contacts (head office and branches)**
- **Layout → Office Contacts**: one gadget per office, shown as cards in the homepage contact section.
- **To add a branch:**
  1. Click *Add a Gadget*, then **Text** (or **HTML/JavaScript**).
  2. In the title, enter the office name (e.g. *Mombasa Branch*).
  3. In the content, type one detail per line. For example:
     ```
     Moi Avenue, Mombasa, Kenya
     mombasa@efic.co.ke
     Tel: +254 700 000 000
     WhatsApp: +254 711 000 000
     Mon-Fri 8:00-17:00
     ```
- **What the theme adds for you:**
  - The right icon on each line.
  - Click-to-email and click-to-call links, a WhatsApp link (start the number with `+` and the country code), and a *Get directions* link to Google Maps for the address.
- **Order and editing:** drag the gadgets to change the order. The first gadget, *Head Office*, holds the details that used to be in the theme code; edit it the same way.
- A gadget that contains an image, map or table is shown exactly as you typed it.

**Slideshow below the menu (homepage)**
- **Layout → Slideshow (homepage, below the menu)**: one gadget per slide. Gadget order is slide order.
- **Kinds of slide:**
  - **Photo:** *Add a Gadget* → **Image**. Upload the photo; the title becomes the headline, the caption the text under it, and the optional link makes the slide clickable. Landscape photos at least 1600 px wide look best; the theme asks Blogger for a 1920 px copy.
  - **YouTube video:** *Add a Gadget* → **HTML/JavaScript** (or **Text**). Paste the video link (`youtube.com/watch?v=…`, `youtu.be/…` or `/shorts/…`); the title becomes the headline.
  - **Text only:** a Text gadget with a title and a short line becomes a navy announcement slide.
- **Videos:** they show their YouTube picture with a gold play button. They only load when someone presses play, so the page stays fast. While a video plays, the slideshow waits.
- **Moving between slides:**
  - It moves on every 6 seconds and stops while the mouse is over it.
  - Visitors can use the arrows, dots, keyboard arrows, swipe on phones, or the pause button.
  - Visitors who turn off motion on their device get no automatic movement.
- **Size:** 16:9 on computers and tablets, 4:3 on phones.
- **Placement:** homepage only. With slides, the page goes: solid navy menu bar → slideshow → a compact band with the company name, tagline and buttons. With no slide gadgets, the homepage looks exactly as before.

**Fixes inherited from the 2017 template**
- Pinch-to-zoom works again (`maximum-scale=1` removed).
- Placeholder meta removed (`YOUR DESCRIPTION HERE`, `@username`, `YOUR-LOGO-IMAGE.png`). Each post now gets its own `og:url`, title and image, and pages without an image fall back to the logo.
- All `http://` fonts, images and share links are now `https://`. Font Awesome loads from cdnjs.
- Homepage sections also show for visitors arriving from Facebook (`?fbclid=`) or `?m=1` links.
- The contact form gadget is no longer inside a `<b:if>`, so it can't vanish from Layout.
- Post titles on the cards show all the time, so they're readable on phones (they used to appear only on hover).
- `document.write` (footer year), the scroll-hijacking SmoothScroll script and the `hentry` Search Console errors are gone. Embeds load lazily.

## Exceptions the audit accepts (see `reference/proven.json`)
- **jQuery** stays. The menu builder, mobile menu, one-page nav, related posts and "load more" depend on it.
- **eficc.blogspot.com links** are the blog's own pages.
