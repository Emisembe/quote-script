# Theme audit

How `theme.xml` is checked so that it installs and runs on Blogger without glitches.

## What went wrong in the first upload, and the fix

The first version used Blogger's newer widget engine and an **Image** gadget with no picture. Blogger rejected it with *"The widget settings in widget with id Image1 is not valid. Required field must not be blank."*

The theme was rebuilt on the foundation of the blog's **original theme**, which Blogger generated and accepted:

| Area | Now |
|---|---|
| Widget engine | Same as the original (`b:version='2'`, version-1 widgets) |
| Gadget types | Only proven ones: Header, Blog, HTML, PopularPosts, Label (from the original) and LinkList (from a second Blogger backup, see below). No Image or Text gadgets. |
| Gadget settings | Only setting names **and values** the original used. Blank only where the original was blank. |
| Data tags | All of them appear in the original theme |
| Comments | The original's own Blogger-generated comment code (threaded comments, comment form, iframe comments), with the decorative wrapper divs removed |
| Gadget code | HTML, Labels and Popular Posts use the original's code verbatim, apart from opening popular posts in the same tab |
| Stylesheet | Plain CSS with Blogger `$(variables)`, like the original's. CSS custom properties are resolved at build time. |

## Automated audit (`python3 scripts/check.py`), 72 checks, all passing

**Proven-only rules** (from `reference/proven.json`, extracted from the original theme):
- Only Blogger tags the original used (`b:if`, `b:loop`, `b:include`, ...): no `b:eval`, no `b:template-skin`.
- `<html>`, section and widget attributes limited to the ones the original used.
- Every gadget's type, version, setting names and setting values match the original. Blank settings only where the original had them blank. **This rule flags the rejected `Image1` gadget.**
- Every `data:` tag (126 used, most of them in the comment code) appears in the original theme.

**General rules:**
- Well-formed XML. Unique section, widget and element ids. Widget ids match their type.
- Every gadget has its own `main` code, and every `b:include` resolves.
- Every widget sits in a section. No sections hidden inside `b:if`, so all gadgets stay editable in Layout.
- Skin variables are defined, CSS braces balance, and there are no CSS custom properties or `//` comments.
- HTTPS only, no `document.write`, no jQuery, no hard-coded blog addresses, no leftovers from other templates.
- Pinch-zoom allowed. Inline JavaScript passes `node --check`.

**Live-blog behaviour** (added after the successful upload):
- The homepage hero still appears when visitors arrive with tracking parameters (`?fbclid=` from Facebook or Instagram, `?m=1`). The theme checks both the page address and Blogger's canonical address.
- Blogger injects its own widget stylesheet, sometimes after the theme. The theme's resets use stronger selectors, so gadget spacing and list styles can't be overridden. This was tested by loading a copy of Blogger's rules after the theme: widget margins stayed at 0 and post bullet lists kept their bullets.
- Label, search and archive pages each get exactly one main heading (h1).
- No incomplete `hentry` microformat, which Google Search Console reports as "missing author/updated".
- Card images are resized only on Blogger/Google and YouTube addresses, and images hosted elsewhere are never rewritten. Tested on 10 sample addresses.
- Images aligned left or right in posts keep Blogger's alignment on desktop and stack centred on phones.

Each of these checks was confirmed to fail on a deliberately broken copy of the theme, so they really do catch the problem.

Run against the version Blogger rejected, the audit reports 23 failures, including the Image gadget. The current theme passes all 72 checks.

## Link List gadgets (menu and footer social links)

The original theme had no Link List gadget, so its format was proven from a second Blogger backup on the same account (`theme-4696870781314041925.xml`). Only the Link List facts were taken from it: type `LinkList`, version `1`, settings `sorting` = `NONE` and `text-N` / `link-N`, data tags `data:links`, `data:link.name`, `data:link.target`. Nothing else from that theme is used. `reference/proven.json` records the source.

Browser-tested: `_` items become a dropdown on desktop (hover and keyboard focus) and a tap-to-open list in the phone menu; social links get matching icons and open in a new tab; a YouTube link in the host card shows a thumbnail with a play button and loads the player only when played; "Powered by Blogger" is gone and the copyright line remains.

## Slideshow, downloads and videos

Four Link List gadgets now exist: Menu (`LinkList1`), Connect (`LinkList2`), Slideshow (`LinkList3`) and Free Downloads (`LinkList4`). The two new ones use exactly the proven Link List settings (`sorting` = `NONE`) and ship empty, so their homepage sections stay hidden until links are added. Like the hero, the sections are always present in the template (so they stay editable in Layout) and are revealed only on the homepage with the same two-condition check.

Browser-tested:
- **Slideshow**: photos and YouTube slides, captions (`-` = none), arrows, dots, keyboard arrows, swipe on touch phones, autoplay every 6s that pauses on hover, focus, hidden tab and a playing video, and stops for reduced-motion users. Leaving a slide stops its video. Google Drive photo links are shown through Drive's thumbnail service at full width.
- **Downloads**: Drive file, Docs, Sheets, Slides and Dropbox links convert to direct downloads; the file type (PDF, ZIP, ...) is shown from the name or address. Cards stack and centre on phones.
- **Post videos**: a YouTube link alone on its line (as a link or as plain text) becomes a 16:9 player that loads only on click. A link inside a sentence is left alone.
- **Card videos**: a card plays its post's video in place without leaving the homepage. The video is found from the YouTube thumbnail, or else from one request to the blog's own feed.
- No horizontal scrolling at 320–1440px, and no JavaScript errors.

## Phone menu opened while scrolled down (fixed)

On the live blog, opening the phone menu after scrolling down showed only the dimmed overlay and the page seemed frozen. Cause: the scroll lock set `overflow: hidden` on `<body>`, which stops the sticky header from sticking, so the header and its close button jumped to the top of the page, off-screen. Reproduced in the preview (header at -600px / -1500px after opening), fixed by locking only `<html>` and moving the sideways-overflow guard from `body` to `html`, plus a safety net that pins the header to the top if it is ever off-screen. Re-tested on a 500px desktop window, iPhone 13 and Pixel 7 at 600px and 1500px scroll: header stays at the top, the X closes the menu, and the page keeps its position. The safety net was tested by forcing the old CSS back in.

## Listen on, newsletter, related episodes, legal links

New gadgets use only proven types and settings: `LinkList5` (Legal), `LinkList6` (Listen on), both `sorting` = `NONE` with `text-N` / `link-N`, and `HTML9` (Newsletter, non-blank `content`). Sections stay unconditional and editable in Layout; the hero badges and the newsletter are hidden by CSS until they have content.

Privacy: the Bebas Neue font is now embedded in the skin as a base64 `woff2` (13.8 KB, SIL Open Font License), and the Google Fonts `<link>` tags are gone, so no font request goes to Google. The audit's data-tag check skips embedded `url(data:...)` files; a mutation test confirmed it still fails on an unknown `data:blog.fakeTag`.

Browser-tested (desktop and iPhone 13): badges get platform icons and open in a new tab; `mailto:` and `tel:` contact links get icons; legal links render in the footer bar and centre on phones; the newsletter turns a signup link into a button, a `mailto:` link into "Subscribe" email, a Substack link into Substack's embed, keeps pasted provider forms (styled), and stays hidden with the default text; related episodes skip the current post, fill from the newest posts when a label has fewer than 3, use the video thumbnail or first image, and play videos in place. No horizontal scroll and no JavaScript errors.

## Footer buttons, share and print

`LinkList7` ("Support the Show", proven Link List settings) adds WhatsApp, Telegram and donation buttons above the footer bar; donation addresses (PayPal, Ko-fi, Buy Me a Coffee, Patreon, Stripe links, betterplace, GoFundMe) become the primary button. The share bar adds Telegram, Print, and a native Share button that only appears where the browser supports it. A print stylesheet hides everything but the article, prints videos as `Video: https://youtu.be/ID` and ends with the post's address. Browser-tested: hero buttons full width at 320 and 390px and one equal row at 768px, footer buttons full width on phones with icons and new-tab links, the Share button passes the post's title and address to the phone's share menu, Print opens printing, and a PDF of the print view was checked.

## Browser checks (preview pages, Chromium)

Homepage and post, at 1440px, 820px and 390px wide:
- No horizontal scrolling, and no JavaScript errors.
- Hamburger menu: opens and closes, `aria-expanded` updates, and it closes on Escape, on choosing a link, and when widened to desktop.
- The hero fills the screen under the sticky header. The episode grid steps 3 → 2 → 1 columns.
- Brand initials ("RM") and the two-colour hero title are generated correctly.

## Still to confirm on Blogger itself

Blogger's template engine only runs on Blogger, so do the final check there:

1. Restore `theme.xml`, or paste it into **Edit HTML**, which names any problem exactly.
2. Open **Layout** and check that all the gadgets listed in the README appear.
3. Publish 2–3 posts with images and labels. Check the homepage grid, a post page, a comment, a label page, a search and a missing page (404).
4. Check on a phone.

If Blogger reports anything, the message names the gadget or line, so send it over for a targeted fix.
