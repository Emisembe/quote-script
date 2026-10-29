---
name: blogger-theme-builder
description: Build, convert, redesign, fix or audit Blogger (Blogspot) XML themes/templates so they upload cleanly and run without glitches. Use this skill whenever the user mentions Blogger or Blogspot themes or templates, a theme .xml from Blogger, "Edit HTML" in Blogger, Theme → Restore, a "Could not restore theme" or "widget settings ... not valid" error, making a Blogger site responsive, adding a hamburger/mobile menu to Blogger, converting a design or screenshot into a Blogger theme, cleaning up a downloaded third-party Blogger template, or adding owner-editable features to a Blogger site such as a language switcher/translation (incl. Arabic right-to-left), a homepage slideshow/slider/carousel of photos and YouTube videos managed in Layout, branch/office contact cards, a newsletter or email sign-up, a 'message from the director' block with a video, or certification/partner badges in the footer — even if they just say "my blog theme" and the blog is on Blogger.
---

# Blogger theme builder

Blogger only validates and renders themes on its own servers. You can't run the template engine locally and its docs are often unreachable, so a theme that "looks right" can still be rejected on upload. Being clever doesn't make a Blogger theme reliable. **Grounding** does: build only from things a real, Blogger-generated theme proves Blogger accepts, then audit mechanically against that proof.

This skill packages that method plus the scripts and a working starter theme.

## The workflow

### 1. Get a proven reference theme first

Ask the user for a **backup of a theme Blogger accepted**, ideally their own blog's: **Theme → ▾ (next to Customise) → Backup**. A third-party template they previously uploaded successfully also works. This file is the ground truth for which widget engine, gadget types, settings, setting values, tags and data tags are allowed.

Then generate the rulebook:

```bash
python3 scripts/extract_reference.py path/to/backup.xml reference/proven.json
```

If the user genuinely can't provide one, use `assets/starter/` as-is (it uploaded successfully on a real blog) and its bundled `reference/proven.json`. Tell them the first upload is the real test.

**Don't upgrade the engine on a hunch.** If the reference uses the legacy engine (`b:version='2'` with version-1 widgets, no `b:layoutsVersion`), stay on it. If it is a Layouts v3 export (Contempo, Soho, ...), v3 tags are proven and fine to use. The rule is *match the reference*, not "always legacy".

### 2. Set up the project from the starter

Copy `assets/starter/` into the project (it contains `src/`, `preview/`, `reference/`, `.github/`) and copy this skill's `scripts/` folder next to it. Then replace `reference/proven.json` with the one generated from the user's backup.

```
src/theme.xml          structure, sections, gadgets, with @@MARKERS@@
src/skin.css           all CSS + Blogger <Variable> definitions (goes into <b:skin>)
src/theme.js           vanilla JS (menu, image sizing, dates, copy-link, year)
src/includables/       gadget code copied verbatim from the reference theme
scripts/build.py       assembles theme.xml; resolves CSS custom properties
scripts/check.py       the audit (general + proven-only rules)
preview/*.html         static pages with the same markup, for browser testing
```

Edit `src/`, never `theme.xml`. `python3 scripts/build.py` regenerates it, and `--check` fails if it's stale.

### 3. Build on proven pieces

- **Copy Blogger-generated code from the reference** for anything intricate: comments (`comment_picker`, `threaded_comments`, `threaded_comment_js`, `comment-form`, ...), Label, PopularPosts, Attribution, HTML `main` includables. Strip only decorative wrapper divs. Keep their data tags exactly.
- **Use only gadget types the reference uses.** For editable text, links and buttons, the HTML/JavaScript gadget is the safest universal choice: its only setting, `content`, can't be "blank required".
- **Give every widget its own `main` includable** in the XML, so nothing depends on Blogger filling in defaults.
- **Widget ids are `TypeN`** (`HTML3`, `Label2`), unique, and every widget sits in a `b:section`.
- **Keep sections unconditional.** A section inside `<b:if>` disappears from the Layout editor. To show something only on the homepage, hide it in CSS and reveal it with a conditional `<style>` in `<head>` (see pitfalls: homepage detection).
- **Content belongs in gadgets, not hard-coded markup**, so the theme works on any blog. Never copy another blog's text, links or addresses.
- If the user has a **brand skill** (colours, fonts, tone), load it and apply it.
- **Features the owner keeps up to date** (slides, branch offices, any list of cards) work best as **a Layout section the owner fills with ordinary gadgets**, which a footer script turns into the finished component. Owners can add gadget types the reference doesn't prove (Image, Text), because Blogger validates those in Layout, not on upload. Read `references/patterns.md` for the recipe and worked examples: office contact cards, a photo/YouTube slideshow, a language switcher with a fallback, a menu that switches to the hamburger when it outgrows one row, a message & video block, a newsletter sign-up (Blogger's Follow by Email is retired), a certifications badge row, and a numbers band of key figures.

### 4. Audit, then test in a browser

```bash
python3 scripts/build.py && python3 scripts/check.py
```

`check.py` rejects anything the reference doesn't prove: unproven gadget types, versions, setting names, setting values, blank required settings, Blogger tags, attributes and data tags. It also catches general hazards: `http://` assets, `document.write`, jQuery, unbalanced CSS, broken JS, leftover content, disabled zoom, missing homepage fallbacks. Fix every failure. Don't weaken a rule to make it pass unless you add the exception to `reference/proven.json → extra` with a reason.

When you add a new check, **prove it works**: run it against a deliberately broken copy and confirm it fails. One check in the original project silently passed everything because of a regex escaping bug.

Then open `preview/home.html` and `preview/post.html` (update their markup if you changed structure) with Playwright at roughly 1440, 820 and 390px wide. Check for no horizontal scroll, no JS errors and the menu working (open, Escape, link click, resize to desktop). Measure mobile centring at 320–414px (left gap equals right gap for headings, cards, buttons, footer). Take screenshots and actually look at them. Chromium lives under `/opt/pw-browsers/` in cloud sessions; use the `chromium_headless_shell-*/…/headless_shell` binary.

### 5. Deliver and install

Send `theme.xml` as a file attachment named like a Blogger backup (e.g. `theme-<blogname>.xml`), plus these steps:

1. **Back up the current theme first.** Restoring can reset gadget content they've already edited.
2. **Theme → ▾ → Restore → Upload.** If it says only *"Could not restore theme"*, use **Theme → ▾ → Edit HTML**, paste the whole file and save. That screen names the exact error (gadget id or line).
3. Legacy-engine themes only: **Theme → ▾ → Mobile settings → Desktop**, so phones get the responsive theme.
4. Ask for a screenshot of any error message and fix exactly that. Error messages name the culprit precisely; don't guess.

Be honest about what you verified. The audit and the browser preview are strong, but only Blogger can confirm a theme, so say so and give the 2-minute live check: homepage, a post, a label page, search, a 404, the phone menu, a test comment.

## Pitfalls

Read `references/pitfalls.md` before writing or fixing a theme. It lists every real failure seen so far, each with its symptom, cause and fix, including:
- the blank Image-gadget error
- the generic restore error and GitHub HTML downloads
- homepage detection breaking on `?fbclid=`
- Blogger's injected widget CSS overriding the skin
- broken legacy templates (insecure jQuery, `document.write`, invalid CSS)
- `hentry` Search Console errors
- image-URL resizing rules

For data tags and settings commonly needed in legacy Blog widgets, see `references/legacy-tags.md`.

For owner-editable features (gadgets as data, slideshow, translation, office cards, menu overflow) and how to test them, see `references/patterns.md`.

## Explaining things to the user

Many Blogger users aren't developers. Use Blogger's own menu names (Theme, Customise, Edit HTML, Layout, gadget), give click-by-click steps, and explain any code term you can't avoid. When something fails, say what went wrong in one plain sentence, what you changed, and what to do next.
