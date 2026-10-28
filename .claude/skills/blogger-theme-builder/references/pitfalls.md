# Blogger theme pitfalls

Each entry: **symptom → cause → fix**. All were hit on real blogs.

## Contents
1. Upload and validation errors
2. Problems in old or downloaded templates
3. Live-blog behaviour
4. CSS
5. JavaScript and images
6. SEO and markup
7. Process

---

## 1. Upload and validation errors

**"The widget settings in widget with id Image1 is not valid. Required field must not be blank"**
→ An Image gadget was shipped with an empty `displayUrl`. Blogger validates gadget settings on upload, and Image requires a picture.
→ Don't ship Image gadgets without a real image URL. Use an HTML gadget instead, e.g. a host card where *title* = name and *content* = role, plus an optional `<img>` that JS moves into the avatar slot. In general: blank settings only where the reference theme has them blank (`check.py` enforces this).

**"Could not restore theme" (Theme → Restore)**
→ Blogger's catch-all message; it never says why.
→ First, check the file is really XML. Its first line must be `<?xml version="1.0" encoding="UTF-8" ?>`. Right-clicking a GitHub file and choosing "Save link as" saves GitHub's HTML page instead; use the attachment or GitHub's **Raw** button. Second, have the user paste the file into **Theme → Edit HTML** and save. That screen reports the precise error.

**Unverified engine features**
→ The first rebuild used Layouts v3 features (`b:layoutsVersion='3'`, version-2 widgets, `b:eval`, `b:template-skin`, `data:view.*`, `data:posts.empty`, `resizeImage`, widgets without includables relying on Blogger's defaults). None could be checked offline, and the upload failed.
→ Use only what the reference theme proves (`reference/proven.json`). A legacy reference proves the legacy engine; a v3 export proves v3.

**Sections inside `<b:if>`**
→ Gadgets in those sections can vanish from the Layout editor, so the user can't edit them.
→ Keep every `b:section` unconditional. Hide the wrapper with CSS (`.hero { display: none; }`) and reveal it with a conditional `<style>` in `<head>`.

## 2. Problems in old or downloaded templates

Typical in Sora/"premium" Blogger templates from around 2015–2019:
- **`http://` jQuery, fonts or images.** Browsers block them on HTTPS blogs, so tabs, menus and back-to-top silently break. Use https and load jQuery once (or not at all).
- **jQuery loaded twice** (e.g. `jquery/1` then `1.7.1`). The second load wipes out plugins.
- **Syntax errors.** A stray `});` kills a whole `<script>`. Check every inline script with `node --check`.
- **`.slideDown()(500)`** throws on every click. It should be `.slideDown(500)`.
- **Invalid CSS** such as `*/@media (...) { // comment` (Bootstrap pastes). It silently swallows the rules after it. Also watch for rules nested inside rules, unclosed `@media`, `font-family: ;`, typos like `overfolow`, and undefined `$(variables)`.
- **`$(variable)` used in a plain `<style>` block.** Variables only work inside `<b:skin>`.
- **A second viewport meta with `maximum-scale=1`** blocks pinch-zoom. Keep exactly one: `width=device-width, initial-scale=1`.
- **Placeholder meta** (`YOUR DESCRIPTION HERE`, `YOUR KEYWORDS HERE`). Remove it; `all-head-content` already prints the real description.
- **Leftover content from other blogs** (names, addresses, social links, AdSense ids, author box text). Users notice and get confused. Strip it, and add the names to `extra.banned_strings` so the audit catches them.
- **Google+ share links** and `fb-like-box` (both retired). Replace with LinkedIn/WhatsApp/X links and Facebook's Page Plugin.
- **`selectnav` / `document.write` menus and feeds.** Replace with a vanilla JS hamburger and Blogger's own pagination links.
- **Menu hidden at middle widths** (e.g. `#menu-main { display: none }` at ≤1024px while the dropdown only appeared at ≤770px). Always test 771–1024px.

## 3. Live-blog behaviour

**Homepage-only sections missing for social visitors**
→ `data:blog.url == data:blog.homepageUrl` fails when the URL has `?fbclid=…` (Facebook/Instagram), `?m=1`, or UTM parameters.
→ Add a second condition, `data:blog.canonicalUrl == data:blog.homepageUrl`, as a separate `<b:if>` that emits the same `<style>`. That avoids needing an `or` operator if the reference doesn't use one.

**Mobile visitors get Blogger's basic mobile theme**
→ Legacy-engine custom themes default to Blogger's mobile template.
→ Tell the user: **Theme → ▾ → Mobile settings → Desktop**. A v3 theme can declare `b:responsive='true'` instead, but only if the reference proves it.

**Duplicate gadgets after an update (two menus, two social lists)**
→ Changing a gadget's type between versions (e.g. HTML1 menu → LinkList1) gives it a new id. On restore, Blogger asks whether to keep or delete gadgets the new theme doesn't contain; "keep" leaves the old one alongside the new one.
→ Avoid changing gadget ids/types once a theme is live. When you must, warn the user before they upload: choose **delete** in that dialog (after backing up), or delete the old copy in Layout afterwards. In Layout, a Link List opens "Configure Link List"; an HTML gadget opens a content box. Also tell them to check for a kept **Attribution** gadget ("Powered by Blogger").

**Re-uploading resets gadget content**
→ Restoring a theme can overwrite gadget text and links the user already edited (menu links, social links, hero text, host video).
→ Always say: back up first, and note any edits. New Link Lists ship with only `sorting`, so they start empty.

**Favicon won't upload**
→ Blogger's Settings → Favicon wants a square image under 100 KB (PNG or ICO). A wide logo or a large photo is refused or shows squashed.
→ Make a square 512×512 PNG with simple, bold shapes (initials) that stay readable at 16–32px; keep it far under 100 KB. Browsers cache favicons, so check in a private window.

## 4. CSS

**Blogger injects its own widget stylesheet, sometimes after the skin**
→ Its `.widget { margin: 30px 0 }`, `.widget ul { padding-left: 1.25em }` and `.widget li { padding: .25em 0 }` can beat same-specificity resets.
→ Reset with `body .section, body .widget`, `body .widget ul/ol/li`. Then re-raise the list styles you want back, e.g. `body .widget .post-body ul { list-style: disc; padding-left: 1.4em }`, because posts live inside the Blog widget. Test by loading a copy of those rules *after* the theme CSS in the preview.

**CSS custom properties in the skin**
→ They're readable to author, but if the reference skin never used them, they're an unproven risk.
→ `build.py` resolves `:root { --x: … }` and every `var(--x)` into plain values / `$(variables)` at build time.

**Images in posts on phones**
→ Blogger wraps aligned images in `.separator a` with inline floats and margins. Forcing margins to 0 everywhere ruins desktop alignment.
→ Only at ≤600px: `.post-body .separator a { float: none !important; margin-left: 0 !important; margin-right: 0 !important }`.

**Mobile view looks unbalanced (left-aligned text above a centred card)**
→ A responsive layout that only stacks into one column still reads as lopsided on phones.
→ With phone-only rules (no structure change), centre the hero (whenever it is a single column, ≤959px), section headings, card text and meta, topic pills, post header (labels/title/date), share buttons, pager buttons (full width) and footer. Keep long article paragraphs left-aligned for readability. Turn the hero title's vertical accent bar into a centred bar under the title. Verify with a measurement, not by eye: at 320/360/375/390/414px, compare each element's left and right gap (≤2px difference) and confirm `scrollWidth == innerWidth`.

**Layout editor**
→ The legacy engine applies the skin to Layout too (`body#layout`). Make hidden-by-default sections visible there: `body#layout .hero, body#layout .sidebar { display: block }`, and un-stick the header.

## 5. JavaScript and images

- **Mobile menu feels "frozen"**: locking page scroll while a half-height menu is open leaves the lower half of the page visible but dead; only the X closes it. Always add a dimmed backdrop under the header (tap to close), unlock on link tap, Escape and resize, and reset on `pageshow` (back/forward cache). Test with real touch emulation (Playwright `devices['iPhone 13']`, `tap()`), not just clicks.
- **Video in a card or hero**: let the user paste a plain YouTube link into an HTML gadget. JS extracts the 11-character id (watch, youtu.be, shorts, live, embed), removes the link text, and shows a thumbnail (`i.ytimg.com/vi/ID/hqdefault.jpg`) with a play button. Only on click insert `youtube-nocookie.com/embed/ID?autoplay=1`. This keeps the page fast and never needs an Image gadget.
- **"Powered by Blogger"** is the Attribution gadget. Blogger doesn't require it, so removing the gadget is fine. Keep your own copyright line.
- **Flex on a menu `ul`** also hits nested sub-menus. Use `.widget-content > ul` for the top row.
- **Slideshow or download list without new gadget types**: use a Link List (one link = one slide or file) and let JS rebuild it. *Site URL* holds the photo/YouTube/file address, *Site Name* the caption or title (allow `-` for "no caption", since Blogger needs a name). Use a CSS scroll-snap track (swipe works natively), arrows, dots, keyboard arrows, and autoplay that pauses on hover, focus, hidden tab and a playing video and is off for `prefers-reduced-motion`. Stop a slide's video when the user leaves it.
- **Ship such Link Lists empty and hidden**: hide the section in CSS, and have the homepage `<style>` reveal it only once JS adds a class (`.showcase.has-slides`). An empty gadget then never shows a blank box.
- **Google Drive links**: a share link (`/file/d/ID/view`) is an HTML page, not a file. Downloads: `drive.google.com/uc?export=download&id=ID`. Docs/Sheets/Slides: `/export?format=pdf|xlsx` and `/export/pdf`. Images: `drive.google.com/thumbnail?id=ID&sz=w1600`. Dropbox: `dl=0` → `dl=1`. The file must be shared as "Anyone with the link".
- **Videos pasted in posts**: turn a YouTube link that is alone on its line (as a link or bare text) into the lite player; leave links inside sentences alone. For homepage cards, take the id from a YouTube `thumbnailUrl` if present, otherwise make one request to the blog's own feed (`/feeds/posts/default?alt=json&max-results=50`, same origin, http(s) only) and match each entry's alternate link to the card's URL.

- **Card images**: legacy `data:post.thumbnailUrl` is 72px (`/s72-c/`) and `data:post.firstImageUrl` is full size. Rewrite to `/w720-h405-c/` (path form) or `=w720-h405-c` (the newer `=s1600` form), **but only on Google hosts**: `googleusercontent.com`, `blogspot.com`, `ggpht.com`. Never touch other hosts, or you'll break their URLs.
- **YouTube thumbnails** come from both `img.youtube.com` and `i.ytimg.com`. Upgrade `default.jpg` to `hqdefault.jpg`.
- **Dates**: `data:post.timestamp` follows the blog's *timestamp* setting (often a time like "9:00 AM"). Output `<time datetime="{timestampISO8601}">` and format it with `toLocaleDateString` in JS.
- Keep JS dependency-free and guarded (`if (!el) return`). Put it at the end of `<body>` inside `//<![CDATA[ … //]]>`.
- Brand initials, two-colour titles and similar touches: build them with DOM nodes, never `innerHTML` with blog text.

## 6. SEO and markup

- **`hentry` without `author`/`updated`** makes Google Search Console report errors. Drop `hentry`, or add the full microformat.
- **One h1 per page.** Homepage: the hero title. Posts: the post title. Label, search and archive pages: give the list heading an h1. Use the same tracking-parameter-proof homepage check, so a homepage visit from Facebook doesn't get two h1s.
- **Breadcrumb schema from `data-vocabulary.org`** is dead. Remove it or use schema.org.
- **Self-closing tags** like `<div class='clear'/>` are fine in the XML; Blogger expands them. Inline SVG with self-closing `<line/>` and `<path/>` is fine too.

## 7. Process

- **Grounding beats guessing.** Every time something unproven was used, it was the thing that broke.
- **Can't reach Blogger or its docs from the sandbox?** That's normal. Say so; don't claim live verification.
- **Mutation-test new audit checks** with a broken copy. One regex check silently passed everything.
- **Keep the repo reproducible**: `src/` → `build.py` → `theme.xml`, with CI running `build.py --check` and `check.py`.
- **Name the delivered file like a Blogger backup** (`theme-<blog>.xml`) and send it as an attachment. Users struggle to download raw files from GitHub.
