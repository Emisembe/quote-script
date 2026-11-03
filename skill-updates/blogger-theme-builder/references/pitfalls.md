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

**Reference backup won't parse ("unbound prefix")**
→ Old templates use `xlink:href` in SVG icons without declaring `xmlns:xlink`. Blogger accepts it; ElementTree doesn't.
→ `extract_reference.py` now declares the missing prefix before parsing. Don't add the declaration to the user's theme just for this.

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

Typical in ThemeForest one-page templates (Areda by fbtemplates, ~2017), all found on one real NGO blog:
- **Demo links in gadgets the owner never noticed**: the *Donate* button and *Sponsor Links* pointing at the template's ThemeForest sales page; Image captions with `href='YOUR POST URL'` and a "zoom" link to the **demo's** photos on `3.bp.blogspot.com` (so the lightbox showed someone else's pictures); `link` setting literally `...`.
- **Menu items pointing at `/404`, `#`, `https://` or `!`.** List every LinkList/HTML link and check each one.
- **Instagram gadget with an access token**: the legacy Instagram API is dead (2020). Remove the gadget; don't commit the token.
- **Blog widget labels in another language** (e.g. Greek `σχόλια`, `Αναρτήθηκε από`) because the template author's blog was set up that way. Fix `commentLabel`, `authorLabel`, `timestampLabel`, `postLabelsLabel`, `postLocationLabel`.
- **Placeholder people and text**: a team member's gadget titled "Sarah Doe" with a lorem-ipsum bio, "Client Name 1-6" partner logos, "Our Exlusive Blog".
- **Homepage sections inside one big `<b:if>`** (url == homepageUrl): they vanish for Facebook visitors (`?fbclid=`). Rebuilding with unconditional sections fixes it.

**Rebuild vs. patch a bought template**
→ Patching a 7,000-line jQuery/Bootstrap template keeps every bug. A rebuild keeps the owner's content if you **reuse every widget id and copy Image/Header settings verbatim** (their uploaded picture URLs). Widgets can move to new sections freely; Blogger places them where the XML says. Generate the new `src/theme.xml` once with a small script that reads settings from the backup, then treat `src/` as the source.
→ Widgets you drop (dead feeds, duplicates) are deleted on restore. Say which ones in the hand-over.

## 3. Live-blog behaviour

**Homepage-only sections missing for social visitors**
→ `data:blog.url == data:blog.homepageUrl` fails when the URL has `?fbclid=…` (Facebook/Instagram), `?m=1`, or UTM parameters.
→ Add a second condition, `data:blog.canonicalUrl == data:blog.homepageUrl`, as a separate `<b:if>` that emits the same `<style>`. That avoids needing an `or` operator if the reference doesn't use one.

**Mobile visitors get Blogger's basic mobile theme**
→ Legacy-engine custom themes default to Blogger's mobile template.
→ Tell the user: **Theme → ▾ → Mobile settings → Desktop**. A v3 theme can declare `b:responsive='true'` instead, but only if the reference proves it.

**Re-uploading resets gadget content**
→ Restoring a theme can overwrite gadget text and links the user already edited.
→ Always say: back up first, and note any edits.

## 4. CSS

**Blogger injects its own widget stylesheet, sometimes after the skin**
→ Its `.widget { margin: 30px 0 }`, `.widget ul { padding-left: 1.25em }` and `.widget li { padding: .25em 0 }` can beat same-specificity resets.
→ Reset with `body .section, body .widget`, `body .widget ul/ol/li`. Then re-raise the list styles you want back, e.g. `body .widget .post-body ul { list-style: disc; padding-left: 1.4em }`, because posts live inside the Blog widget. Test by loading a copy of those rules *after* the theme CSS in the preview.

**Your own class on a `b:section` loses to the reset**
→ `body .section { margin: 0; padding: 0 }` (needed against Blogger's injected CSS) also beats `.section-intro { margin: 0 auto }` or `.form-card { padding: 40px }`, because Blogger renders the section as `<div class='form-card section'>`. Symptom: "centred" intros sit left, cards have no padding.
→ Prefix those rules: `body .section-intro { ... }`. Same for list items: `body .widget li { padding: 0 }` beats `.footer li { padding: 5px 0 }`; write `body .footer-col li`.

**Hidden helper sections for photo backgrounds**
→ Let the owner change a section's background photo without code: put an Image gadget in a hidden section (`class='bg-source'`, shown only in `body#layout`), give the band `data-bg-from='<section id>'`, and let JS copy the image URL into `background-image`. Without JS the band keeps its solid colour.

**Social icons left as `#`**
→ Owners often don't have every profile yet. `.social a[href="#"] { display: none }` hides the icon until a real link is typed into the gadget. Better than shipping dead icons or inventing URLs.

**Homepage-only layout tweaks**
→ The conditional homepage `<style>` (both url and canonicalUrl checks) can carry more than show/hide: e.g. full-width news grid, cap the story cards (`.post-card:nth-child(n+7) { display: none }`, fewer on phones), hide the pager.

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

- **Card images**: legacy `data:post.thumbnailUrl` is 72px (`/s72-c/`) and `data:post.firstImageUrl` is full size. Rewrite to `/w720-h405-c/` (path form) or `=w720-h405-c` (the newer `=s1600` form), **but only on Google hosts**: `googleusercontent.com`, `blogspot.com`, `ggpht.com`. Never touch other hosts, or you'll break their URLs.
- **YouTube thumbnails** come from both `img.youtube.com` and `i.ytimg.com`. Upgrade `default.jpg` to `hqdefault.jpg`.
- **Dates**: `data:post.timestamp` follows the blog's *timestamp* setting (often a time like "9:00 AM"). Output `<time datetime="{timestampISO8601}">` and format it with `toLocaleDateString` in JS.
- Keep JS dependency-free and guarded (`if (!el) return`). Put it at the end of `<body>` inside `//<![CDATA[ … //]]>`.
- Brand initials, two-colour titles and similar touches: build them with DOM nodes, never `innerHTML` with blog text.

- **Card excerpts without a summary tag**: legacy themes may not prove `data:post.snippet`. Put `<data:post.body/>` inside a `<template>` in the card and let JS read `template.content.textContent`. Template content is inert: its images don't download and its scripts don't run (a `hidden` div would still load every image).
- **Related posts**: replace `json-in-script` + `document.write` callbacks with `fetch('/feeds/posts/default/-/' + encodeURIComponent(label) + '?alt=json&max-results=6')` (same origin), skip the current URL, build cards with DOM nodes.
- **LinkList dropdowns**: many templates use the convention "`_Name` = submenu item of the item above". Keep it (owners know it) and build the nested `<ul>` in JS. In loops, capture the parent item per button (an IIFE): a shared `var parent` makes every toggle open the last item.
- **Label links without `data:label.url`**: if the reference doesn't prove it, use `expr:href='data:blog.homepageUrl + "search/label/" + data:label.name'`. If `b:loop index=` isn't proven, show only the first label with CSS (`.labels a:nth-child(n+2) { display: none }`).

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
- **Free-text settings aren't enum values.** `check.py`'s "value is proven" rule is for option settings (`displayMode`, `timeRange`). Link names, URLs, captions and Blog labels are the owner's own text; they are listed in `proven.json → extra.free_text_settings` so changing a menu link doesn't fail the audit. Blank values are still checked.
- **Preview with the real markup.** `scripts/render_preview.py` interprets the subset of the template language a theme uses (sections, widgets, includables, if/else, loop, data tags, expr attributes) and writes `preview/*.html` with sample posts, so the browser test runs the actual theme instead of hand-copied HTML. Adapt its sample content and image placeholders per project. `scripts/preview_test.js` then checks overflow, JS errors, one h1, menu, slider, lightbox and phone centring.
- **Scroll-reveal + smooth scroll fool screenshots.** With `html { scroll-behavior: smooth }`, a test's `scrollTo` loop ends long before the page has scrolled, so revealed-on-scroll sections look blank in full-page screenshots. Scroll with `{ behavior: 'instant' }` and wait ~100ms per step.
- **Name the delivered file like a Blogger backup** (`theme-<blog>.xml`) and send it as an attachment. Users struggle to download raw files from GitHub.
