# River Musa: a Blogger theme

A full-width, responsive Blogger theme for **The River Musa Show**. It works on any Blogger blog: nothing is tied to one blog address, and the text, links and photo are edited in Blogger's **Layout** screen, without touching code.

- Sticky header with logo, menu and a call-to-action button. On phones the menu folds into a hamburger.
- Full-screen hero on the homepage: tagline, title, intro text, buttons and a host card.
- Episode grid: 3 columns on desktop, 2 on tablet, 1 on phone.
- Single-post layout with a sidebar, share buttons and Blogger comments.
- Topics strip, three-column footer, and a 404 page with search.
- Uses Blogger's current theme engine (Layouts v3, version-2 widgets, `b:responsive`). No jQuery, and every asset loads over HTTPS.

## Install

1. In Blogger, go to **Theme → ▾ (next to Customize) → Backup** and download your current theme.
2. **Theme → ▾ → Restore**, then upload [`theme.xml`](theme.xml).
3. Go to **Layout** and edit the widgets (see the next section).
4. Make sure **Settings → Posts → Max posts shown on main page** is a multiple of 3 (e.g. 9), so the grid rows fill evenly.

There's no "mobile template" to switch off. The theme declares itself responsive, so Blogger serves the same page to phones.

## What to edit in Layout

| Area | Widget | What it controls |
|---|---|---|
| Brand | **Header** (`Header1`) | Blog title and description. Upload a square logo to replace the "RM" initials. Choose *Instead of title and description* to use a wide logo. |
| Main menu | **Link List** (`LinkList1`) | Menu links. `/#about`, `/#episodes`, `/#topics` and `#connect` jump to homepage sections. |
| Header button | **Link List** (`LinkList3`) | The teal button in the header (first link only). |
| Hero | **Text** (`Text1`) | *Title* = the small teal tagline. *Content* = the intro paragraph. The big headline is your **blog title**. |
| Hero | **Link List** (`LinkList2`) | Hero buttons. The first link is the solid teal button, the rest are outlined. |
| Hero | **Image** (`Image1`) | Host card: *Title* = name, *Caption* = role, image = photo (a microphone icon shows until you upload one). |
| Posts | **Blog Posts** (`Blog1`) | Its title ("Latest Episodes") is the heading above the grid. |
| Topics | **Labels** (`Label1`) | Homepage topic pills, built from your post labels. |
| Sidebar | `PopularPosts1`, `Label2` | Shown next to single posts and pages. Add more gadgets here. |
| Footer | `Text2`, `LinkList4`, `LinkList5` | About text, social links (shown as pills), and quick links. |

**Placeholder links to replace:** the YouTube, TikTok, Instagram and LinkedIn links point to each site's homepage. "Learn More" and "Shop" go to `/p/about.html` and `/p/shop.html`, so either create pages with those names or change the links.

**Colours:** go to **Theme → Customize → Advanced**. All brand colours and the body font are theme variables.

> Gadgets you add later through Layout use Blogger's standard markup. The theme styles that markup too. The hero layout is special only for the three hero widgets above: if you delete one and re-add it, it will look like a plain widget.

## Working on the theme

`theme.xml` is **generated**, so edit the files in `src/` and rebuild:

```
src/theme.xml           page structure, sections and widgets (with @@ markers)
src/skin.css            all styles + theme variables  -> goes into <b:skin>
src/layout-editor.css   styles for the Layout screen   -> goes into <b:template-skin>
src/theme.js            menu, header shadow, initials, copy-link, year
```

```bash
python3 scripts/build.py      # writes theme.xml (+ dist/ for the preview)
python3 scripts/check.py      # audits theme.xml (see AUDIT.md)
```

Open `preview/home.html` and `preview/post.html` in a browser to see the design without uploading. They use the built CSS and JS with sample content.

GitHub Actions runs the build check and the audit on every push (`.github/workflows/check.yml`).

## Repository notes

- `archive/quote.js` is the unrelated script that used to sit in this repo, kept for reference.
- The earlier patched version of the downloaded "Sky Blog" theme is in git history (commit `191424d`). It was replaced by this clean theme.
