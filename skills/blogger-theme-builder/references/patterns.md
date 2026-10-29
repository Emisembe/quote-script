# Owner-editable features that worked

Each pattern below was built for a real blog (eficc.blogspot.com). It passed the proven-only audit and browser tests (the translation step was tested with a stand-in for Google's script, because the sandbox can't reach Google). Treat the first live upload as the final check. They share one idea: **the theme ships a Layout section (plus at most one proven HTML gadget), and the owner adds content as ordinary gadgets in Layout.** Blogger validates gadgets the owner adds in Layout itself, so they don't need to be in the reference theme. Only what you *upload* must be proven. A footer script then reads those gadgets and builds the polished component.

## Contents
1. Gadgets as data: the general recipe
2. Office/branch contact cards
3. Slideshow of photos and YouTube videos
4. Language switcher (Google translation) with a fallback
5. Menus that outgrow one row
6. Testing these in Playwright
7. Message & video block (text + card with a video pop-up)
8. Newsletter sign-up without Blogger's retired Follow by Email
9. Badge row (certifications, memberships, partners)
10. Numbers band (key figures)
11. Contact form: a reference number per message
12. Post cards: picture or playable video from each post

---

## 1. Gadgets as data: the general recipe

- **The section.** Add an unconditional `b:section` with a clear `name` (it's the label in Layout, e.g. `Slideshow (homepage, below the menu)`), `showaddelement='yes'` and no `maxwidgets`.
  - An empty section is fine: `<b:section ...>\n</b:section>`.
  - If you pre-fill it, use an **HTML** gadget (`content` is the only setting and can't be blank), with its own `main` includable.
  - Don't ship Text or Image gadgets unless the reference proves them. Tell the owner to add those themselves.
- **One gadget is one item.** The title is the item's name or headline, and the content is the details. Gadget order in Layout is display order, so owners reorder by dragging.
- **Read gadgets robustly.** Owners use different gadget types and editors:
  - Read the title from `h2` (HTML/Text gadgets output `h2.title`; Image outputs a plain `h2`).
  - Turn content into lines: replace `<br>` and closing `</p></div></li>` with newlines, then parse with `DOMParser` (it doesn't run scripts or load images) and split the `textContent`.
  - Image gadgets: `img`, an optional wrapping `a[href]`, and `span.caption`.
- **Leave rich content alone.** If a gadget contains `img`, `iframe`, `table` or `script` and the pattern doesn't expect it, keep it exactly as typed rather than mangling it.
- **Build output with DOM nodes and `textContent`**, never `innerHTML` with gadget text.
- **Skip the Layout editor.** Start the script with `if (document.body.id === 'layout') return;`, and make the section visible there: `body#layout .wrap { display: block !important; }`.
- **Empty means unchanged.** With no gadgets, the page must look exactly as before. Test that explicitly.
- **Preview.** Add realistic sample gadgets in `preview.py` for the section, marked "(sample)" and preview-only, so tests exercise the different gadget formats. Never ship sample content in the theme.

## 2. Office/branch contact cards

The owner types plain lines in a Text or HTML gadget (title = office name):
```
Moi Avenue, Mombasa, Kenya
mombasa@example.com
Tel: +254 700 000 000
WhatsApp: +254 711 000 000
Mon-Fri 8:00-17:00
```
The script works out what each line is, in this order:
1. **Email:** turn it into a `mailto:` link.
2. **Web address** (`http`/`www`): turn it into a link that opens in a new tab.
3. **Phone:** the line has a number of 7 or more digits, and its other letters are only labels (`tel|phone|mobile|cell|fax|whatsapp|...`). Link each number with `tel:`. If the line says WhatsApp and the number starts with `+`, use `https://wa.me/<digits>` instead.
4. **Opening hours:** day names, or times like `8:00`.
5. **Address:** everything else. Consecutive address lines join into one block, with a *Get directions* link to `https://www.google.com/maps/search/?api=1&query=...`.

The address test above is why a PO-box line like `Tubman St. 100475-00101, Kenya` isn't taken for a phone number: it has other words in it.

Each row gets an icon disc. Addresses, emails and numbers get `class="notranslate" translate="no"`, so page translation doesn't mangle them. Lay the cards out with `grid-template-columns: repeat(auto-fit, minmax(240px, 340px)); justify-content: center`, so a single office is centred and several wrap.

## 3. Slideshow of photos and YouTube videos

**Slide types** (one gadget each):
- **Photo:** an Image gadget (title, caption, link), or a pasted image URL in an HTML gadget.
- **Video:** a YouTube URL (`watch?v=`, `youtu.be/`, `/shorts/`, `/embed/`, `/live/`; 11-character id) in an HTML or Text gadget.
- **Text-only:** anything else with a title or text.

**Sharp photos:** rewrite Blogger image sizes to 1920 px, but only on Google hosts: path form `/s640/` or `/w640-h360/` becomes `/s1920/`, and suffix form `=s640` becomes `=s1920`.

**Videos load lazily:**
- Show the thumbnail `https://i.ytimg.com/vi/<id>/maxresdefault.jpg` with a play button.
- Missing HD thumbnails still load: YouTube returns a 120x90 placeholder. So on `load`, if `naturalWidth <= 120`, switch to `hqdefault.jpg`.
- On click, swap in an iframe for `https://www.youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&playsinline=1`.
- While it plays: stop auto-advance, and hide the caption, dots and pause button, which would cover YouTube's controls. Leaving the slide puts the thumbnail back, which stops the video.

**Behaviour:**
- Crossfade slides (stacked, absolutely positioned) in an `aspect-ratio` box: 16:9 with `max-height: 78vh`, 4:3 on phones. Images use `object-fit: cover`.
- Auto-advance every 6 s. Pause on hover or focus, while `document.hidden`, with a **pause button** (WCAG 2.2.2), and when `prefers-reduced-motion` is set (start paused).
- Arrows (hidden on phones), dots with `aria-current`, keyboard arrows, and a horizontal swipe (|dx| > 40 and > |dy|).

**Accessibility:**
- The container gets `role="region"` and `aria-roledescription="carousel"`. Each slide gets `role="group"`, `aria-roledescription="slide"` and `aria-label="2 / 5: Title"`.
- Hidden slides get `aria-hidden="true"` and `tabIndex = -1` on their links and buttons.

**Placement under a fixed menu bar:**
- Give the wrapper top padding equal to the bar height.
- If the homepage normally has a see-through bar over a full-screen hero, make the bar solid and the hero compact when slides exist. Set a `has-slider` class from JS; don't use `:has()`.

## 4. Language switcher (Google translation) with a fallback

Whole-blog translation (posts included) with no per-language content to maintain:

- **The switcher.** A native `<select>` in the menu bar, `class="notranslate" translate="no"`, with each language written in its own name (`Kiswahili`, `Deutsch`, `Français`, `العربية`). It works with phone pickers, keyboards and screen readers for free.
- **Load Google only when needed.** Load Google's website-translation script only when a non-English language is chosen, so English visitors pay nothing in speed or privacy.
  - The choice lives in the `googtrans` cookie as `/en/<lang>`, on `path=/` for the host and `.host`. Clear it by setting both with an expired date.
  - On change, write the cookie and `location.reload()`. Then load `https://translate.google.com/translate_a/element.js?cb=init`, and in `init` call `new google.translate.TranslateElement({pageLanguage: 'en', includedLanguages: 'en,sw,de,fr,ar', autoDisplay: false}, 'google_translate_element')`. It translates according to the cookie.
- **Fallback.** If the script fails (`onerror`, or `google.translate` still undefined after 15 s), set a sessionStorage flag, clear the cookie and open the same page through Google's proxy:
  - Build the address: `https://<host with '-' → '--' and '.' → '-'>.translate.goog<path>?<query>&_x_tr_sl=en&_x_tr_tl=<lang>&_x_tr_hl=<lang>`.
  - On proxy pages, read `_x_tr_tl` to show the current language. Choosing English rebuilds the original host (`--` becomes `-`, single `-` becomes `.`) and drops the `_x_tr_*` parameters.
  - Once the flag is set, later choices go straight to the proxy.
- **Hide Google's chrome:**
  ```css
  body { top: 0 !important; }
  iframe.skiptranslate, .goog-te-banner-frame, #goog-gt-tt, .goog-te-balloon-frame,
  .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
  .goog-text-highlight { background: none !important; box-shadow: none !important; }
  ```
- **Keep names and contact details as written.** Before loading the script, add `notranslate` to the blog title, the logo and the contact rows.
- **Right-to-left (Arabic, Hebrew, Urdu):**
  - Google adds `translated-rtl` to `<html>`, but set your own class too (also on proxy pages).
  - Apply `direction: rtl; text-align: right` to content blocks (post body, sidebar, cards, mobile menu panel), not to the whole layout. Keep centred section titles centred, and flip `border-left` accents to `border-right` (sidebar titles, card titles, quotes, related posts). Old templates force `text-align: left` on list items and sidebar entries (Popular Posts), so set `text-align: right` on those explicitly, or bullets end up on the right with the text still on the left. Look at an RTL screenshot of a post with a list and a sidebar.
  - Brand Latin fonts have no Arabic letters, so for RTL only, load an Arabic font such as `Cairo` and put it second in the stacks: `'Montserrat', 'Cairo', ...`.
- **Be honest about verification.** The sandbox can't reach translate.google.com. Test with a stand-in `element.js` that reads the cookie and adds the `translated-*` class, test the fallback by aborting that request, and tell the user the live blog is the real test. Machine translation is for understanding; suggest hand-written pages for key content.

## 5. Menus that outgrow one row

A LinkList menu that the owner edits will eventually stop fitting. The EFIC theme's menu already wrapped "Our Services" and "News" onto a second row at 1440 px before any change, and nobody had noticed.

- Give the bar more room on wide screens (`max-width: 1400px` instead of a fixed 1170 px row), with slightly tighter item padding between the hamburger breakpoint and about 1400 px.
- **Automatic fallback:** on `load`, `document.fonts.ready` and (debounced) `resize`, above the hamburger breakpoint:
  1. Remove a `menu-overflow` class from `<html>`.
  2. Collect the distinct `top` values of the visible top-level menu items.
  3. If there is more than one, add the class back.
- Under `html.menu-overflow`, repeat the mobile rules: hide the desktop nav and show the hamburger.
- **Test:** check that items sit on one row at 1180–1920 px (include 1366, a common laptop width).

## 6. Testing these in Playwright

- **Serve the preview from the real hostname.** Route `https://<blog>.blogspot.com/` and its paths to the preview HTML files. Cookies, `location.hostname` and proxy-address logic need a real host; `file://` hides bugs.
- **Stand in for third parties:**
  - `element.js`: a stand-in, or abort it to test the fallback.
  - `i.ytimg.com`: a local JPEG. Also serve a 120x90 image to test the HD-thumbnail fallback.
  - `youtube-nocookie.com`: a blank page.
  - Image hosts: local files.
- **Timers:** use `page.clock.install()` and `clock.runFor(ms)` to test auto-advance without waiting.
- **Touch:** create a context with `hasTouch: true` and dispatch `TouchEvent` objects built from `new Touch({...})`.
- **Reduced motion:** use the context option `reducedMotion: 'reduce'`.
- **"Is it really visible?"** Use `document.elementFromPoint` at the element's centre. Themes with `scroll-behavior: smooth` make `scrollIntoView()` animate, so measure after `scrollIntoView({behavior: 'instant'})`, or the point is off-screen and the check fails for the wrong reason.
- **Clipped content hides from `scrollWidth`.** Old templates set `html { overflow-x: hidden }`, so content pushed past the right edge is cut off silently, and `scrollWidth == innerWidth` still passes. That is how a fixed-width footer icon row hid its last icon on phones. Also check that no visible element in your sections has `getBoundingClientRect().right > innerWidth` or `left < 0`.
- **Preview sample gadget ids must not collide** with real gadget ids in the theme (`HTML10` sample vs a real `HTML10`). Give samples ids from a high, unused range (`HTML90+`, `Image9+`).

## 7. Message & video block (text + card with a video pop-up)

A "personal message + video" block, common on consultancy and agency sites.
- **The section:** two shipped HTML gadgets, so it works on day one. Pre-fill them only with the blog's own wording and media, never invented names or quotes.
- **Text gadget:**
  - Title = the small kicker.
  - First content line = the big headline. The following lines = paragraphs.
  - A line starting with `—`, `–` or `-` = the name/title line.
  - An `img` = the signature image.
- **Card gadget:**
  - Title = the big overlay text, and the first text line = the kicker.
  - A YouTube link gives a **Play video** button; another link gives **Learn more**.
  - The background is the video's thumbnail (with the HD-or-standard fallback) or an Image gadget's photo.
- **Telling the two apart:** a gadget with a YouTube link, or a picture and at most two lines of text, is the card. Anything with more writing is the text side, even if it contains an image (the signature). The first version misread a Text gadget with a signature as the card.
- **Video pop-up:** `role="dialog"` and `aria-modal="true"`. Focus goes to the Close button and Tab stays there. Escape, the Close button or a click on the backdrop closes it, removes the iframe (which stops the video) and returns focus to Play. Lock page scroll while it's open.
- **Homepage-only section inside `<b:if>`:** if the homepage blocks are wrapped in a homepage-only `<b:if>` and the new block belongs between them, put the section after the `</b:if>` (so Layout still sees it). Then move its wrapper with JS (`anchor.parentNode.insertBefore(wrap, anchor.nextSibling)`), and show it only under the homepage class.

## 8. Newsletter sign-up without Blogger's retired Follow by Email

Blogger's *Follow by Email* gadget (FeedBurner) stopped sending emails in July 2021, so don't ship it. Instead, build a **Newsletter** section with one HTML gadget:
- Title = the heading. Text lines = the invitation.
- One email line = where sign-ups go when no list exists yet. It's never displayed; the script uses a `mailto:` with subject and body and shows the address as a fallback link.
- An optional form-address line connects a real list:

| Service | Address the owner pastes | Email field name |
|---|---|---|
| Google Forms | `https://docs.google.com/forms/d/e/<id>/formResponse?entry.<n>` | `entry.<n>` |
| Mailchimp | `https://<dc>.list-manage.com/subscribe/post?u=…&id=…` | `EMAIL` |
| Brevo | `https://<x>.sibforms.com/serve/…` | `EMAIL` |
| MailerLite | `https://assets.mailerlite.com/jsonp/<acc>/forms/<id>/subscribe` | `fields[email]` |

- **Submitting:** build a hidden `<form method="post" target="_blank">` with just the email field and submit it. The service shows its own confirmation page in a new tab.
- **The thank-you message must match the service.** Google Forms sends no confirmation email; the mailing services send a double opt-in email, which is the expected standard in Germany and the EU.
- **The form:** a required consent tick-box with the blog name taken from `meta[property="og:site_name"]` (page titles differ per page). Add a hidden honeypot field (ignore submissions that fill it), inline messages with `role="status"`, and stack the email box and button on phones.
- **Test:** route each service's address in Playwright and assert the POST body (`entry.123456=test%40example.com`, `EMAIL=…`, `fields%5Bemail%5D=…`) and the new tab.

## 9. Badge row (certifications, memberships, partners)

- **The section:** a footer section that ships **empty**, because a badge is a claim and only the owner can make it. The owner adds an **Image** gadget per badge (logo, caption, link) or a Text gadget for a words-only badge.
- **Rendering:** logos on white rounded tiles (most certificate logos assume a white background), centred and wrapping. Captions go under the tiles, links open in a new tab, and a short uppercase heading goes above the row. The heading and row exist only when there is at least one badge.
- **Remind the owner:** ISO and accreditation marks have usage rules (for example, a consultancy that helps clients get certified is not itself certified).

## 10. Numbers band (key figures)

A full-width band of big numbers with a label under each (*1,165 Projects Executed*, *286+ Global Presence*).

- **The section:** ship **one** HTML gadget, *Key figures*, with one figure per line: `number | label | link`. One Edit box for all figures beats four gadgets (the owner asked for this after trying one gadget per figure). Lines starting with `#` are notes (put the format and an example there). Also accept one gadget per figure (title = label, first line = number, a link in the content) for owners who add gadgets.
- **Parse lines from the HTML gadget:** `<br>`, block ends **and** raw new lines (the HTML box keeps plain new lines), then `textContent`.
- **Ship placeholders, not figures.** Figures are claims, like badges. Ship `[number] | Projects Executed` lines. Skip any figure whose number has a `[`, has no digit, or is longer than 16 characters (a sentence, not a number). The band appears only when at least one real figure exists, so uploading the theme never publishes made-up numbers. The preview injects sample numbers (preview-only).
- **Links:** accept only `http(s)://`, `/…` or `#…` (never `javascript:`). Wrap the figure in an `a`; other sites open in a new tab with `rel=noopener`. Underline the label on hover and give it a visible focus outline.
- **Rendering:** a `ul` of `li` > number + label spans, built with `textContent`. Use the brand's dark colour for the band, white numbers and accent-coloured labels (an accent on a dark background is fine; never accent text on white). Lay it out with flex-wrap: 4 per row on desktop, a class `es-count-N` for 3/5/6 (3 per row) or 1–2, and 2 per row below 900 px. Use `overflow-wrap: anywhere` so `2,568,000+` can't overflow at 320 px.
- **Still numbers by default.** A count-up animation is optional. If you add one, honour `prefers-reduced-motion` and keep the final text in the HTML, so screen readers and translation see the real figure.
- **Homepage only,** moved under the anchor block like section 7. When two scripts insert after the same anchor, the one that runs **last** ends up **first**, so order the scripts deliberately and update the other block's placement test.

## 11. Contact form: a reference number per message

Blogger's ContactForm gadget only emails the owner. It has no server-side hook, no storage and no counter, but a script can still stamp each message.

- **How:** a `click` listener on `document` in the **capture** phase runs before Blogger's own handler on the Send button (`#ContactForm1_contact-form-submit`). It puts `Prospect no.: P-<initials>-<YYYYMMDD>-<HHMMSS>` plus a blank line at the top of the textarea, so it's in the email Blogger sends.
- **Only when Blogger will accept the form** (message not empty, email has an `@`). Otherwise leave the text untouched. On a retry, reuse the number already at the top, so there's never a second line.
- **Show the visitor:** watch `#ContactForm1_contact-form-success-message` with a MutationObserver. When it holds text that isn't "Sending..." and the error box is empty, append *Your reference: …* inside it. The template's success box has a fixed `height: 35px`; make it `height: auto` or the line spills out.
- **Initials:** strip accents (`normalize('NFD')`), keep A–Z words, take up to 3. With no Latin name (empty, Chinese …), use `WEB`.
- **Limits to tell the owner:** numbers are unique but not sequential, they aren't collected anywhere, and the email subject is Blogger's. For running numbers and a register, also post the form to a Google Apps Script web app that writes to a Sheet.
- **Test with a stand-in** for Blogger's script: a target-phase click handler that validates, shows "Sending...", then "Message sent." and clears the form, recording the message. Assert the recorded message, the shown reference, failed-then-retry, and names (none, accents, hyphens, non-Latin).

## 12. Post cards: picture or playable video from each post

Old templates build index cards from `data:post.firstImageUrl` (or `thumbnailUrl`, or a placeholder), then rewrite the URL in jQuery. That breaks in three ways:
- A one-argument `img.replace(url)` turns the placeholder into the address `undefined` (a broken image, with the alt text above an empty card). Fix it at the source: `return img;`.
- A post with only a video gets no picture.
- Pictures come at whatever size the post used.

- **Read the post, then decide.** Fetch `/feeds/posts/default?alt=json&max-results=50` once (same origin; no JSONP needed on the live blog) and map entries by the `alternate` link's pathname. If an entry has no `content` (the feed is set to *short*), or a card is missing, `fetch()` the post page and read `.post-body`. Parse with `DOMParser` (nothing runs, nothing loads).
- **Media order:** an embedded video wins (`iframe`/`embed`/`video`: YouTube URLs, the `youtube-src-id` attribute of videos uploaded in Blogger, `blogger.com/video.g` players, `<video src>`). Then the first real picture: skip pixels and icons (width or height under 60, `emoji`, `blank.gif`). Then a linked YouTube video.
- **Picture size:** for `googleusercontent.com`/`bp.blogspot.com`, swap the size segment before the file name (`/s320/`, `/s72-c/`, `/w640-h400-rw/`) or the `=s…` suffix for `w800`. On `error`, fall back to the card's original picture, then to the empty state.
- **Empty state:** a class on the card that hides the `img` (`visibility: hidden` keeps the height and hides the alt text) and paints a brand gradient with a faint wordmark.
- **Video:** the YouTube picture (`i.ytimg.com/vi/ID/hqdefault.jpg`, which always exists), plus a `button` (`aria-label="Play video: <title>"`). On click, use `preventDefault()` and `stopPropagation()` (the card is a link). Add an `iframe` (youtube-nocookie, `autoplay=1&playsinline=1`) absolutely filling the card, plus a close button. Hide the title overlay while it plays. Allow one player at a time; Esc closes it; return focus to the play button.
- **Later cards:** infinite-scroll "Learn More" (jquery.ias) appends `.post-grid` items, so watch `.blog-posts` with a MutationObserver and mark processed cards (`data-pc`).
- **Test** with a fake feed and post pages routed in Playwright. Cover each media type, a short feed, a 404 on the large picture, the `undefined` src, one-at-a-time play, close/Esc/Enter, appended cards, and 320/390 px. The cards float, so screenshot a clip around them, not the wrapper (it has no height).
