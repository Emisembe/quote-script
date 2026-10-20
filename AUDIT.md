# Theme audit

What was checked to make sure `theme.xml` installs and runs on Blogger without glitches, and what can only be confirmed on a live blog.

## 1. Automated checks (`python3 scripts/check.py`)

These run on every push in GitHub Actions. Current result: **all pass**.

| Area | Check | Why it matters |
|---|---|---|
| Upload | XML is well-formed | Blogger rejects the file otherwise |
| Engine | `b:version=2`, `b:layoutsVersion=3`, `b:defaultwidgetversion=2`, `b:responsive=true` | Current theme engine; no separate mobile template |
| Skins | One `<b:skin>`, one `<b:template-skin>` | Styles load, and the Layout screen stays usable |
| Widgets | Unique ids, id matches type (`LinkList2`), all version 2, exactly one Blog widget | Blogger refuses duplicate or mismatched ids |
| Structure | Every widget inside a section; no nested sections; Blog widget never behind `<b:if>` | Prevents "widget cannot be shown" errors |
| Ids | Section, widget and element ids don't collide | Avoids broken anchors and scripts |
| Includes | Every `<b:include>` resolves to an includable in that widget or a Blogger built-in | Missing includables break the page |
| CSS | Every `$(variable)` is defined; braces balance; no `//` comments | A CSS error silently drops the rest of the stylesheet |
| HTTPS | No `http://` scripts, styles or images | Browsers block them on HTTPS blogs |
| Runtime | No `document.write`, no jQuery, no hard-coded `*.blogspot.com` | Works on any blog and doesn't block page rendering |
| Content | No leftovers from other templates ("Union Watch", "Kajiado", `YOUR_…`) | Nobody else's content on your site |
| Mobile | Pinch-zoom not disabled | Accessibility |
| JS | Inline script passes `node --check` | A syntax error would disable the menu |

The audit also catches real faults: run against the old downloaded theme, it reports 28 failures (insecure jQuery, `document.write`, other blogs' content, legacy widgets and more).

## 2. Browser checks (preview pages, Chromium)

Homepage and post preview, at 1440px, 820px and 390px wide:

- No horizontal scrolling at any width.
- No JavaScript errors.
- The hamburger opens and closes, `aria-expanded` updates, and Escape closes it.
- The menu closes when a link is chosen and when the window grows to desktop width.
- The hero fills the screen under the sticky header. The episode grid steps 3 → 2 → 1 columns.

## 3. Built for stability

- **Few custom templates.** Only Header, the hero Text and Image, and Blog Posts use custom markup. Every other gadget uses Blogger's own default markup, which Blogger keeps up to date.
- **Comments are Blogger's own** (`commentPicker`), so threaded replies, moderation and sign-in keep working.
- **Pagination uses Blogger's built-in links**, not feed scripts, so it can't break when feeds change.
- **Homepage sections stay editable.** The hero and Topics show only on the homepage, but also always in Layout mode (`data:view.isLayoutMode`), so you can still edit them.
- **No JavaScript needed for content.** Without JS, the brand mark just shows no initials. Nothing else is lost.
- **One source of truth.** `theme.xml` is generated from `src/`, and CI fails if it is out of date.

## 4. Confirm on a live blog (one-time, about 10 minutes)

Blogger's template engine only runs on Blogger's servers, so this last step can't be automated. Use a **test blog** (Blogger lets you create one for free) before switching your main blog:

1. Restore `theme.xml` on the test blog. It should save without errors.
2. Open **Layout**. You should see Brand, Main menu, Header button, Hero, Posts, Sidebar, Topics and the footer sections.
3. Publish 3 posts with images and labels. Check that the homepage grid shows images, labels, excerpts and dates.
4. Open a post. Check the title, author and date, the share buttons, the comment form, the newer/older links, and the sidebar.
5. Visit a label page (`/search/label/...`), run a search, and open a URL that doesn't exist (404 page).
6. On a phone, check the hamburger menu, the hero, and posting a comment.
7. **Theme → Customize → Advanced**: change the accent colour and confirm it updates everywhere.

## 5. Known limits

- **Image widget:** Blogger's Image gadget asks for an image before it will save edits. Upload your host photo the first time you edit the host card.
- **Heading font:** Bebas Neue loads from Google Fonts. If it can't load, the theme falls back to Impact / Arial Narrow.
- **Placeholder links:** the social links, "Learn More" and "Shop" need your real addresses (see README).
