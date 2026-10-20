# River Musa: a Blogger theme

A full-width, responsive Blogger theme for **The River Musa Show**. It works on any Blogger blog: nothing is tied to one blog address, and all text and links are edited in Blogger's **Layout** screen.

- Sticky header with logo, menu and a call-to-action button. On phones the menu folds into a hamburger.
- Full-screen hero on the homepage: tagline, title, intro text, buttons and a host card.
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

Every gadget is a standard Blogger gadget. Most are **HTML/JavaScript** gadgets, where you edit the links in the content box.

| Area | Gadget | What it controls |
|---|---|---|
| Brand | **Header** (`Header1`) | Blog title and description. Upload a square logo to replace the "RM" initials. Choose *Instead of title and description* to use a wide logo. |
| Main menu | HTML (`HTML1`) | A list of links. `/#about`, `/#episodes`, `/#topics` and `#connect` jump to homepage sections. |
| Header button | HTML (`HTML2`) | One link, shown as the teal button. |
| Hero | HTML (`HTML3`) | *Title* = the small teal tagline. *Content* = the intro paragraph. The big headline is your **blog title**. |
| Hero | HTML (`HTML4`) | Hero buttons, as a list of links. The first is solid teal, the rest are outlined. |
| Hero | HTML (`HTML5`) | Host card: *Title* = name, *Content* = role. To show a photo, add `<img src="PHOTO-URL">` to the content and it replaces the microphone icon. |
| Posts | **Blog Posts** (`Blog1`) | Its title ("Latest Episodes") is the heading above the grid. |
| Topics | **Labels** (`Label1`) | Homepage topic pills, built from your post labels. |
| Sidebar | `PopularPosts1`, `Label2` | Shown next to single posts and pages. You can add more gadgets here. |
| Footer | HTML `HTML6`, `HTML7`, `HTML8` | About text, social links (shown as pills), and quick links. |

**Placeholder links to replace:** the YouTube, TikTok, Instagram and LinkedIn links point to each site's homepage. "Learn More" and "Shop" go to `/p/about.html` and `/p/shop.html`, so create pages with those names or change the links.

**Colours:** go to **Theme → Customise → Advanced** to change the brand colours.

## Working on the theme

`theme.xml` is **generated**, so edit the files in `src/` and rebuild:

```
src/theme.xml          page structure, sections and gadgets (with @@ markers)
src/skin.css           all styles + colour variables  -> goes into <b:skin>
src/theme.js           menu, header shadow, initials, image sizing, dates, copy-link
src/includables/       gadget code taken from the blog's original Blogger theme
reference/proven.json  what the original theme proves Blogger accepts
```

```bash
python3 scripts/build.py      # writes theme.xml (+ dist/ for the preview)
python3 scripts/check.py      # audits theme.xml against the rules in AUDIT.md
```

Open `preview/home.html` and `preview/post.html` in a browser to see the design with sample content (run the build first).

GitHub Actions runs the build check and the audit on every push.
