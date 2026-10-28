# River Musa: a Blogger theme

A full-width, responsive Blogger theme for **The River Musa Show**. It works on any Blogger blog: nothing is tied to one blog address, and all text and links are edited in Blogger's **Layout** screen.

- Sticky header with logo, menu and a call-to-action button. On phones the menu folds into a hamburger.
- Full-screen hero on the homepage: tagline, title, intro text, buttons and a host card.
- Homepage slideshow of photos and YouTube videos, and a "Free Downloads" section, both edited as Link Lists.
- YouTube links in posts become responsive players, and episode cards with a video play it right on the homepage.
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
| Hero | HTML (`HTML4`) | Hero buttons, as a list of links. The first is solid teal, the rest are outlined. |
| Hero | HTML (`HTML5`) | Host card: *Title* = name, *Content* = role. Paste a **YouTube link** on its own line and the video appears in the card (it loads only when played). Or add `<img src="PHOTO-URL">` to show a photo instead of the microphone. |
| Slideshow | **Link List** (`LinkList3`) | Homepage slideshow under the hero. Each link is one slide: *Site URL* = a photo address (Blogger/Google Photos image, a public Google Drive image, or any image URL) or a YouTube link; *Site Name* = the caption (type `-` for no caption). Slides change every 6 seconds, swipe on phones, and pause while a video plays. Hidden while empty. |
| Free Downloads | **Link List** (`LinkList4`) | Download cards. *Site Name* = the file title (end with `(PDF)` etc. to show the type), *Site URL* = the file link. Google Drive, Docs, Sheets, Slides and Dropbox share links are turned into direct downloads. Link to it with `/#downloads`. Hidden while empty. |
| Posts | **Blog Posts** (`Blog1`) | Its title ("Latest Episodes") is the heading above the grid. |
| Topics | **Labels** (`Label1`) | Homepage topic pills, built from your post labels. |
| Sidebar | `PopularPosts1`, `Label2` | Shown next to single posts and pages. You can add more gadgets here. |
| Footer | HTML `HTML6`, **Link List** `LinkList2`, HTML `HTML8` | About text, social links (icons are added automatically from the address: YouTube, TikTok, Instagram, LinkedIn, Facebook, X, WhatsApp, Spotify, podcasts, email), and quick links. There is no "Powered by Blogger" line. |

**Videos in posts:** paste a YouTube link on its own line in a post (in Compose view, or as a link) and it becomes a responsive player that loads only when played. A link inside a sentence stays a normal link. On the homepage, a card whose post contains a video shows a play button and plays the video in the card.

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
reference/proven.json  what the original theme proves Blogger accepts
```

```bash
python3 scripts/build.py      # writes theme.xml (+ dist/ for the preview)
python3 scripts/check.py      # audits theme.xml against the rules in AUDIT.md
```

Open `preview/home.html` and `preview/post.html` in a browser to see the design with sample content (run the build first).

GitHub Actions runs the build check and the audit on every push.
