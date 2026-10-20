# Theme audit

How `theme.xml` is checked so that it installs and runs on Blogger without glitches.

## What went wrong in the first upload, and the fix

The first version used Blogger's newer widget engine and an **Image** gadget with no picture. Blogger rejected it with *"The widget settings in widget with id Image1 is not valid. Required field must not be blank."*

The theme was rebuilt on the foundation of the blog's **original theme**, which Blogger generated and accepted:

| Area | Now |
|---|---|
| Widget engine | Same as the original (`b:version='2'`, version-1 widgets) |
| Gadget types | Only the original's: Header, Blog, HTML, PopularPosts, Label, Attribution (no Image, Text or LinkList) |
| Gadget settings | Only setting names **and values** the original used. Blank only where the original was blank. |
| Data tags | All of them appear in the original theme |
| Comments | The original's own Blogger-generated comment code (threaded comments, comment form, iframe comments), with the decorative wrapper divs removed |
| Gadget code | HTML, Labels, Popular Posts and Attribution use the original's code verbatim, apart from opening popular posts in the same tab |
| Stylesheet | Plain CSS with Blogger `$(variables)`, like the original's. CSS custom properties are resolved at build time. |

## Automated audit (`python3 scripts/check.py`), 58 checks, all passing

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

Run against the version Blogger rejected, the audit reports 23 failures, including the Image gadget. The current theme passes all 58 checks.

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
