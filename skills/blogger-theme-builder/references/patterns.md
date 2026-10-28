# Patterns worth borrowing

Techniques seen in good commercial Blogger themes (SpotCommerce, Sneeit) that make a theme easier for
non-developers to run. Each one uses only ordinary gadgets, but still check every tag and gadget type
against `reference/proven.json` before using it.

## Contents
1. Settings in a gadget, not in the code
2. Background images the owner can swap in Layout
3. Translations in one place
4. Labels and counts for JavaScript
5. Explaining gadgets inside the Layout editor
6. Post body for JavaScript on list pages, without loading its images
7. Page type on `<body>`
8. Marker comments around values a tool may rewrite

---

## 1. Settings in a gadget, not in the code

Owners shouldn't need **Edit HTML** to change a phone number, currency or a feature switch. Put
settings in an **HTML/JavaScript gadget** inside an unconditional section that's hidden on the site:

```xml
<div class='site-settings-wrap'>
  <b:section class='site-settings-section' id='site-settings' showaddelement='no'>
    <b:widget id='HTML90' locked='true' title='Site settings' type='HTML'>
      <b:widget-settings>
        <b:widget-setting name='content'><![CDATA[whatsapp: +49 170 0000000
show_dates: yes]]></b:widget-setting>
      </b:widget-settings>
      <b:includable id='main'><div class='site-settings'><data:content/></div></b:includable>
    </b:widget>
  </b:section>
</div>
```

CSS: `.site-settings-wrap { display: none } body#layout .site-settings-wrap { display: block }`.
JS reads `key: value` lines. Clone the node and turn `<br>`, `<p>`, `<div>` into line breaks first,
because people paste with formatting (see blogger-ecommerce-builder `shop.js → readLines`).
Prefer this to LinkList name/URL pairs (SpotCommerce's approach): Blogger may rewrite values typed into
a URL field, and the HTML gadget's `content` is never blank, which avoids the "required field" error.

## 2. Background images the owner can swap in Layout

An **Image gadget** whose `main` includable prints only a style rule. The owner uploads a new picture in
Layout and it becomes the hero background:

```xml
<b:widget id='Image2' locked='true' title='Header background' type='Image'>
  <b:includable id='main'>
    &lt;style&gt;#header{background-image:url(<data:sourceUrl/>)}&lt;/style&gt;
  </b:includable>
</b:widget>
```

Ship it **with a real image URL** (`displayUrl`). An empty Image gadget fails upload with
"Required field must not be blank" (see pitfalls).

## 3. Translations in one place

Mark every fixed word in the markup with `data-l10n='English text'` (or keep them in one hidden
block), and let a "Words" HTML gadget hold `English text: Translation` lines. One small function swaps
the text. One theme then serves German, English or French blogs without code edits.

## 4. Labels and counts for JavaScript

A **Label gadget** in a hidden admin section (`display: none`, shown in `body#layout`) with a minimal
includable gives JS every label, count and URL without a feed request:

```xml
<b:loop values='data:labels' var='label'>
  <span class='label-info' expr:data-count='data:label.count' expr:data-url='data:label.url'><data:label.name/></span>
</b:loop>
```

Use it for category menus, "collections" blocks, or hiding labels that are really data.

## 5. Explaining gadgets inside the Layout editor

The legacy engine applies the skin in Layout (`body#layout`), and v3 themes have `b:template-skin`.
Use CSS to make Layout self-explanatory:

```css
body#layout #HTML90 .layout-title:after { content: ' (one setting per line: key: value)'; }
body#layout #slider { background: #FFFFE0; border: 2px dashed #E0C000; }
```

## 6. Post body for JavaScript on list pages, without loading its images

On list pages, legacy `data:post.body` holds the text up to the jump break. Wrap it in `<template>`
and the browser parses it but loads nothing (no images, no scripts). JS can then read structured data
(a price block, a rating, a reading time) from `template.content`:

```xml
<template class='post-src'><data:post.body/></template>
```

## 7. Page type on `<body>`

`<body expr:class='data:blog.pageType'>` (plus the theme's own classes) lets CSS style `item`, `index`,
`static_page`, `archive` and `error_page` differently without extra `<b:if>` blocks.

## 8. Marker comments around values a tool may rewrite

When a value will be changed by a script or by Claude later (copyright year, menu block, a setting),
wrap it in a unique comment pair: `<!--cpr-year-start-->2026<!--cpr-year-end-->`. Search-and-replace
is then exact, and nothing else in the theme can match. Don't hard-code a year at all where JS can
fill it in (`theme.js` already does).
