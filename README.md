# River Musa: a Blogger theme

A full-width, responsive Blogger theme for **The River Musa Show**. It works on any Blogger blog: nothing is tied to one blog address, and all text and links are edited in Blogger's **Layout** screen.

- Sticky header with logo, menu and a call-to-action button. On phones the menu folds into a hamburger.
- Full-screen hero on the homepage: tagline, title, intro text, buttons and a host card.
- Homepage slideshow of photos and YouTube videos, and a "Free Downloads" section, both edited as Link Lists.
- YouTube links in posts become responsive players, and episode cards with a video play it right on the homepage.
- "Listen on" platform badges in the hero, a newsletter signup box, related episodes under each post, and Impressum/Datenschutz links in the footer.
- The heading font (Bebas Neue) is built into the theme, so visitors' browsers never contact Google Fonts.
- Episode grid: 3 columns on desktop, 2 on tablet, 1 on phone.
- Single-post layout with a sidebar, share buttons and Blogger comments.
- Topics strip, three-column footer, and a 404 page with search.

**Built on the original theme's foundation.** The blog's original Blogger theme (exported from the account and accepted by Blogger) is the guide for every technical choice. The theme uses only the widget types, widget settings, Blogger tags and data tags that the original used. The comment system is the original's own Blogger-generated code. `scripts/check.py` enforces this using `reference/proven.json` (see [AUDIT.md](AUDIT.md)).

## Install

1. In Blogger, go to **Theme → ▾ (next to Customise) → Backup** and download your current theme.
2. **Theme → ▾ → Restore**, then upload [`theme.xml`](theme.xml). If Restore shows a vague error, use **Theme → ▾ → Edit HTML** instead: select all, paste the file's contents and save. That screen names the exact problem.
3. **Theme → ▾ → Mobile settings → "Desktop"**, so phones get this responsive layout instead of Blogger's basic mobile theme.
4. **Settings → Posts → Max posts shown on main page**: use a multiple of 3 (e.g. 9) so grid rows fill evenly.

## What to edit in Layout

Every gadget is a standard Blogger gadget. The menu, social links, slideshow and downloads are **Link List** gadgets (add, rename, reorder and delete links with buttons); the rest are **HTML/JavaScript** gadgets.

| Area | Gadget | What it controls |
|---|---|---|
| Brand | **Header** (`Header1`) | Blog title and description. Upload a square logo to replace the "RM" initials. Choose *Instead of title and description* to use a wide logo. |
| Main menu | **Link List** (`LinkList1`) | Menu links. Start a link's name with `_` to make it a sub-page of the link above (shown as a dropdown; the `_` is hidden). `/#about`, `/#episodes`, `/#downloads`, `/#topics` and `#connect` jump to homepage sections. |
| Header button | HTML (`HTML2`) | One link, shown as the teal button. |
| Hero | HTML (`HTML3`) | *Title* = the small teal tagline. *Content* = the intro paragraph. The big headline is your **blog title**. |
| Hero | HTML (`HTML4`) | Hero buttons, as a list of links. The first is solid teal, the rest are outlined. On phones they fill the screen width, one under another; on tablets they share one row. |
| Hero | **Link List** (`LinkList6`, "Listen on") | Platform badges under the hero buttons (YouTube, Spotify, Apple Podcasts, TikTok, ...): *Site Name* = the label, *Site URL* = your show's page there. Icons are added from the address. Hidden while empty. |
| Hero | HTML (`HTML5`) | Host card: *Title* = name, *Content* = role. Paste a **YouTube link** on its own line and the video appears in the card (it loads only when played). Or add `<img src="PHOTO-URL">` to show a photo instead of the microphone. |
| Slideshow | **Link List** (`LinkList3`, titled "Highlights") | Homepage slideshow under the hero. The gadget's **title is the heading** above it (clear it for no heading). Each link is one slide: *Site URL* = a photo address (Blogger/Google Photos image, a public Google Drive image, or any image URL) or a YouTube link; *Site Name* = the caption (type `-` for no caption). Slides change every 6 seconds and swipe on phones. A strip of thumbnails under the slideshow shows every slide (the video's own thumbnail for YouTube links, including YouTube Studio links). The arrows hide while a video plays so they don't cover YouTube's buttons. Hidden while empty. |
| Free Downloads | **Link List** (`LinkList4`) | Download cards. *Site Name* = the file title (end with `(PDF)` etc. to show the type), *Site URL* = the file link. Google Drive, Docs, Sheets, Slides and Dropbox share links are turned into direct downloads. Link to it with `/#downloads`. Hidden while empty. |
| Posts | **Blog Posts** (`Blog1`) | Its title ("Latest Episodes") is the heading above the grid. |
| Topics | **Labels** (`Label1`) | Homepage topic pills, built from your post labels. |
| Sidebar | `PopularPosts1`, `Label2` | Shown next to single posts and pages. You can add more gadgets here. |
| Newsletter | HTML (`HTML9`) | Signup box above the footer on every page. *Title* = heading, *Content* = the text plus **one** of: a link to your signup page (becomes a button), a Substack link (shows Substack's own signup box), a `mailto:` link (opens an email with "Subscribe" as subject), or the embed code from Mailchimp/Brevo/Kit (styled to match). Hidden until it has a link or form. |
| Footer | HTML `HTML6`, **Link List** `LinkList2`, HTML `HTML8` | About text, social and contact links (icons are added automatically from the address: YouTube, TikTok, Instagram, LinkedIn, Facebook, X, WhatsApp, Spotify, podcasts, `mailto:` email, `tel:` phone), and quick links. There is no "Powered by Blogger" line. |
| Footer buttons | **Link List** (`LinkList7`, "Support the Show") | Big buttons above the copyright: starts with *Chat on WhatsApp* (`https://wa.me/`), *Join on Telegram* (`https://t.me/`) and *Support the Show* (`https://www.paypal.com/paypalme/`). Replace the links with yours (`https://wa.me/49151…`, `https://t.me/yourchannel`, your PayPal.me / Ko-fi / Buy Me a Coffee page). Donation links become the solid teal button. Full width on phones. |
| Footer bar | **Link List** (`LinkList5`, "Legal") | Links next to the copyright. Starts with *Impressum* → `/p/impressum.html` and *Datenschutz* → `/p/datenschutz.html`: create pages with exactly those titles. |
| Posts | (automatic) | **Share bar**: the phone's own Share menu (where supported), Facebook, X, LinkedIn, WhatsApp, Telegram, Copy link and **Print**. Printing gives a clean page: just the article, videos as links, and the post's address. |
| Posts | (automatic) | **Related episodes** under each post: up to 3 posts with the same first label, topped up with the newest posts. Video posts play in the card. |

**Videos in posts:** paste a YouTube link on its own line in a post (in Compose view, or as a link), or add it with Blogger's video button, and it becomes the same branded player as the host card: the video's HD thumbnail with a teal play button, loading YouTube only when played. A link inside a sentence stays a normal link. On the homepage, a card whose post contains a video shows the video's thumbnail with a play button and plays the video in the card.

**Favicon:** `assets/favicon-rivermusa.png` (512×512, 23 KB) is ready for **Settings → Favicon**. Blogger needs a square image under 100 KB. Browsers cache favicons, so check in a private window.

**Placeholder links to replace:** the YouTube, TikTok, Instagram and LinkedIn links point to each site's homepage. "Learn More" and "Shop" go to `/p/about.html` and `/p/shop.html`, so create pages with those names or change the links.

**Colours:** go to **Theme → Customise → Advanced** to change the brand colours.

## Working on the theme

`theme.xml` is **generated**, so edit the files in `src/` and rebuild:

```
src/theme.xml          page structure, sections and gadgets (with @@ markers)
src/skin.css           all styles + colour variables  -> goes into <b:skin>
src/theme.js           menu, slideshow, downloads, video players, header shadow, initials, image sizing, dates, copy-link
src/includables/       gadget code taken from the blog's original Blogger theme
src/fonts/             Bebas Neue (OFL), inlined into the skin at build time
reference/proven.json  what the original theme proves Blogger accepts
```

```bash
python3 scripts/build.py      # writes theme.xml (+ dist/ for the preview)
python3 scripts/check.py      # audits theme.xml against the rules in AUDIT.md
```

Open `preview/home.html` and `preview/post.html` in a browser to see the design with sample content (run the build first).

GitHub Actions runs the build check and the audit on every push.
