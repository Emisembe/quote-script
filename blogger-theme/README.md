# Blogger theme: responsive River Musa redesign

`theme.xml` is the theme to upload. The first commit in its history is the original export, so `git diff` shows every change.

## Install

1. In Blogger, go to **Theme → ⋮ (next to Customize) → Backup** and download your current theme first.
2. **Theme → ⋮ → Restore → Upload** and pick `theme.xml`.
3. **Theme → ⋮ → Mobile settings → Desktop**. This sends phones to the responsive layout instead of Blogger's old mobile template.

## What changed

**Responsive layout**
- Fluid content and sidebar layout (flexbox) in place of the fixed 805/694/670px widths. The sidebar drops below the posts at 1024px and under.
- Post list is a 2-column card grid that becomes 1 column on phones. The homepage featured grid now shows on mobile too (before, it was hidden).
- Header, footer widgets, related posts, author box, comments and pagination all reflow. Nothing scrolls sideways at 375px.

**Hamburger menu (1024px and under)**
- A sticky Menu button opens the full menu plus the search box. Submenus open on tap, with a caret.
- Escape closes the menu, and it resets when the window is widened to desktop. It has proper `aria-expanded` and label attributes.
- On desktop, dropdowns open on hover or keyboard focus.
- Before, the menu was hidden between 771 and 1024px, and phones got a plain `<select>` box.

**Branding (River Musa)**
- Deep Navy `#0D1C2E` header, nav and footer, with a 4px Signal Teal `#00C0A8` strip under the nav.
- Bebas Neue for display headings. Arial for body text.
- Teal label badges, brand-style tabs, 10px card corners, navy/teal pagination.

**Fixes needed for it to work properly on Blogger (HTTPS)**
- All `http://` scripts, fonts and images now use `https://`. Browsers were blocking the jQuery load, which broke the sidebar tabs, back-to-top button and menu.
- jQuery was loaded twice (1.x, then 1.7.1). It now loads once (1.12.4).
- Fixed a script with a stray `});` that was a syntax error.
- Fixed `.slideDown()(500)` in the sidebar tabs, which threw an error on every click.
- Fixed broken CSS: an invalid Bootstrap `@media` fragment that swallowed the WhatsApp share styles, a rule nested inside another rule, an unclosed `@media`, and undefined skin variables.
- Removed the second viewport tag, which blocked pinch-zoom, and the placeholder `YOUR DESCRIPTION HERE` / `YOUR KEYWORDS HERE` meta tags.
- Google+ share buttons (Google+ shut down in 2019) replaced with LinkedIn on desktop and WhatsApp on mobile.
- The mobile template called related-post functions that didn't exist. It now calls the ones the theme defines.
- Added the missing CSS for the `embed-responsive` YouTube widgets.

**Unchanged:** every widget, section ID, feed script (featured posts, pagination, related posts), comments, AdSense slots and menu link.

## Content to review in Blogger (widget content, not theme code)
- **HTML3 "partner slider":** uses `via.placeholder.com` images. That service has shut down, so the images are blank.
- **HTML4 "social connect":** has a Google+ entry and hard-coded follower counts.
- **HTML10 Facebook box:** uses the retired `fb-like-box` plugin. Swap it for the Facebook Page Plugin.
- **Text:** "Businesses in Kajiado" / "Union Watch Africa" text in the About widget, author box and header title.
