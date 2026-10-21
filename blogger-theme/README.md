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

```bash
python3 scripts/build.py && python3 scripts/check.py theme-eficc.xml && python3 scripts/preview.py
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
