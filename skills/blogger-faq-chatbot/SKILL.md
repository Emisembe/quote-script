---
name: blogger-faq-chatbot
description: Add an "Ask us" FAQ chat assistant to a Blogger (Blogspot) site or any HTML site, edited from Blogger's Layout like a normal gadget. As visitors type it predicts and suggests matching questions (tolerating spelling mistakes), answers from the site owner's own question-and-answer list, searches the blog's articles when nothing fits, and hands over to WhatsApp or Call with the visitor's question already typed. Free, no server, no API key, nothing sent to third parties. Use this skill whenever the user wants a chatbot, chat assistant, FAQ bot, "ask us" box, help widget, live-chat alternative, predictive or suggested questions, or automatic answers to common member/customer questions on Blogger or a simple website, even if they just say "a chat that answers questions" or ask whether a chatbot is possible on their blog. Also use it to edit, extend, restyle or debug such a chat, or to write its starter questions and answers.
---

# Blogger FAQ chat assistant

A self-contained chat ("Ask" button → chat window) that runs entirely in the visitor's browser.
The site owner keeps the questions and answers in a Layout gadget, so they can change them any
time without touching code. It suits organisations whose visitors ask the same things again and
again (unions, associations, churches, schools, small businesses).

What the visitor gets:
- **Popular questions** as buttons when the chat opens.
- **Predicted questions while typing**: "jion", "membrship", "dismised", "fees" still find
  "How do I join?", "membership", "dismissal", "fee". Matching uses the question's words plus an
  `Also:` list of other words people use, with prefix matching (still typing), light stemming
  (joined → join) and edit distance where swapped letters count as one mistake.
- **An answer** from the list, with links, plus "You might also want to know" questions.
- **When nothing fits**: matching articles from the blog (Blogger feed search, `?q=`) and a
  hand-over: *Ask on WhatsApp* (opens WhatsApp with their question typed) and *Call us*.
- **The conversation is kept** while they move between pages (sessionStorage, same visit only).
- Full screen on phones, a 390 px window in the corner on computers; Escape closes; keyboard and
  screen-reader friendly; not printed.

Be honest with the user about what it is: a question matcher over their own answers, not an AI that
writes new answers. That is also its strength: it can never invent a wrong legal or medical answer.
If they later need free-form answers, see `references/ai-upgrade.md`.

## Files in this skill

| File | What it is |
|---|---|
| `assets/chat-assistant.js` | The whole chat. No dependencies, ES5, safe to paste into a Blogger theme |
| `assets/chat-assistant.css` | Its styles, colours as variables at the top |
| `assets/gadget-snippet.xml` | The Layout gadget (Blogger XML) that holds the questions |
| `assets/starter-faq.txt` | The question format with instructions, to paste into the gadget |
| `assets/demo.html` | A plain page using the chat, for trying it and for the test |
| `scripts/test_chat.js` | Browser test for any page that has the chat (phone + computer) |
| `references/ai-upgrade.md` | How to add a real AI behind it later, and what that costs/risks |

## Workflow

### 1. Write the questions and answers first

Ask the user for the questions people really ask, with their answers. If they want a starter list,
draft it **from their own website content** (pages, posts, labels), and keep to what the site says:
- Don't invent facts the site doesn't state: fees, amounts, dates, deadlines, legal rights,
  procedures. For those, answer with where to find out ("For the current rate, contact the office
  using the WhatsApp or Call buttons"). A confident wrong answer is worse than a hand-over.
- Keep answers to 1–3 sentences and end with a link to the page that has the details
  (`[Who can join](/p/who-can-join.html)`). Short answers read well in a chat bubble.
- Write `Q:` the way a visitor would ask ("How do I join the union?"), and fill `Also:` generously
  with the words people actually use, including informal, local and short forms ("sacked, fired,
  dismissed, show cause, warning letter"; "nhif, shif, sha"). `Also:` drives most good matches.
- 8–15 questions is a good start; `Popular:` should hold the 3–4 most common.
- Tell the user which answers you drafted so they check them before going live.

The format (also explained inside `assets/starter-faq.txt`):
```
Name: Ask KPUWU
Welcome: Hello! Ask me about joining, dues, your rights at work...
Popular: How do I join? | Who can join? | How are dues paid?
WhatsApp: +254 700 000 000      (only if the theme has no WhatsApp button)
Phone: +254 700 000 000         (only if the theme has no Call button)

Q: How do I join the union?
Also: join, become a member, membership, register, sign up, form s
A: Sign Form S at your workplace through the shop steward. Read more: [Who can join](/p/who-can-join.html).
```
An answer can continue on the next lines until the next `Q:`. Links: `[text](url)`, bare
`https://...`, bare `/p/...` or `/search/...` paths and email addresses all become links.

### 2. Add it to the theme

In a Blogger theme (edit the theme source, or Theme → Edit HTML):
1. Paste `assets/gadget-snippet.xml` just before the footer, outside any other `b:section` and never
   inside `<b:if>` (a section inside `b:if` vanishes from Layout). Give the widget an unused id
   (`HTML` + a number higher than any in the theme). Put the questions in its `content` setting.
2. Add `body#layout .chat-data[hidden] { display: block !important; }` to the skin so the gadget
   shows in Theme → Layout. If the theme uses another class for hidden data sections, match it.
3. Put `assets/chat-assistant.css` in a `<style>` block in `<head>` (outside `<b:skin>`; it uses CSS
   variables, which some theme audits forbid inside the skin). Set the colour variables to the
   site's brand colours. If you merge it into a skin that forbids variables, replace them with values.
4. Put `assets/chat-assistant.js` at the end of `<body>` in a script wrapped in
   `//<![CDATA[` … `//]]>` so Blogger's XML parser accepts `<` and `&` in the code.

If the theme has a Call/WhatsApp bar with `.quick-contact`, `.qc-call`, `.qc-whatsapp` buttons (as
built by the blogger-theme-builder union theme), the chat adds an **Ask** button to that bar and uses
its numbers for the hand-over. Otherwise it adds its own round "Ask" button in the bottom corner and
uses the `WhatsApp:`/`Phone:` lines from the gadget. Either way the chat is off while the list is empty.

When the theme is built from source with an audit (blogger-theme-builder's `check.py`), the module
adds no Blogger data tags, no jQuery, no `document.write` and no `http://` resources, so it passes.

### 3. Test it

```
node scripts/test_chat.js path/to/preview.html
```
The page must contain the gadget markup (`.chat-data .widget-content` with the questions) and load the
CSS and JS. The test reads the page's own first question, types a typo of it, and checks on a phone
(390 px, touch emulation) and a computer (1440 px): Ask button, welcome + popular questions, the typo
suggests the right question, the answer comes from the list, an unknown question falls back to
articles and WhatsApp/Call with the question typed, Escape closes, the conversation survives a reload,
the phone does not zoom out, and there are no JavaScript errors. Look at a screenshot too.

Things that went wrong in real themes, and why the module does what it does:
- **Scroll lock on `<html>` only.** Locking `<body>` as well (`overflow:hidden`) turns the body into a
  scroll box and unsticks a sticky header: the header jumps off screen behind the chat.
- **Prefixed class names** (`chat-…`). Blogger injects its own stylesheet; a theme once used
  `.share-buttons`, which Blogger also styles (`position:absolute`), and the buttons floated away.
- **16 px text in the input**, or iPhones zoom the page when the box is tapped.
- **No duplicate keys in object literals.** Older browsers reject them in strict mode and the whole
  script stops.
- **Real phone emulation in tests.** In phone mode an element wider than the screen makes the phone
  zoom out and widens the page itself, so a plain `scrollWidth <= innerWidth` check passes anyway;
  compare `innerWidth` with the intended width (the test does).
- **Feed search can fail** (feeds turned off, offline, custom domain quirks): the fallback still shows
  WhatsApp/Call, so the visitor is never stuck.

### 4. Tell the user how to run it

Explain in Blogger's own words:
- **Layout → Chat assistant (questions and answers) → Edit**: add, change or remove `Q:` / `Also:` /
  `A:` blocks; Save. Changes show immediately.
- Watch which questions people ask on WhatsApp after "Ask on WhatsApp": those are the next `Q:`
  blocks to add, and the best `Also:` words.
- Everything stays on their site: no account, no cost, no data sent to a chat company.
