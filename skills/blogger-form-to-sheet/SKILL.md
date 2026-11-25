---
name: blogger-form-to-sheet
description: Build a designed form that lives on a Blogger page (or any static website page) and sends every answer straight into a Google Sheet through an Apps Script web app, with photo upload to Drive, a unique reference per entry, a designed confirmation email, an email to the owner, follow-up flags and a Settings tab. No Google Form. Use whenever the user wants a sign-up, registration, application, "list your shop", "become a partner", order, booking, product submission or newsletter form on Blogger/Blogspot or a static site that fills a Google Sheet, or says "like the List your shop page".
---

# Page form → Google Sheet (no Google Form)

A form written in plain HTML/CSS/JS is pasted into a Blogger page (HTML view). It POSTs JSON to an Apps
Script web app bound to a Google Sheet. The script validates, writes one row, saves photos to Drive,
emails the owner and the person, and returns a reference. The owner works the sheet with a custom menu.

Reference implementation: `assets/example-page.html` (form) and `assets/example-Code.gs` (script),
from the AfroKauf "List your shop" page. Reuse their structure; change fields, texts and columns.

## 1. The page (paste into Blogger › Pages › HTML view)

- One self-contained block: `<div class="ak-form">` + `<form novalidate>` + scoped `<style>` + one IIFE `<script>`.
  All CSS scoped under the form's class so the blog theme is not affected. Mobile first, 16 px inputs.
- Settings at the top of the script: `var ENDPOINT = 'PASTE_YOUR_WEB_APP_URL_HERE'` (and optional WhatsApp fallback number).
  If ENDPOINT is not a `https://script.google.com/…/exec` address, show "not connected" instead of failing silently.
- Send with `fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data) })`.
  `text/plain` avoids the CORS preflight; Apps Script's redirect allows reading the JSON reply.
- Validate in the browser AND on the server. Required consent checkbox(es) with a Datenschutz/privacy link.
- Honeypot: a hidden `company2` input; the server pretends success and stores nothing when it is filled.
- Photos: read files in the browser, scale to max ~1600 px on a canvas, send JPEG base64 (max 4 files).
- Repeating rows (e.g. up to 10 products): a `<template>` cloned per row, "Add another" / "Remove".
- Success: hide the form, show a thank-you box with the reference. Failure: re-enable the button, show the server's message.
- Optional fallback: "Send on WhatsApp instead" that builds a `wa.me` message from the same data.
- Never switch the Blogger page back to Compose view after pasting: it can break the code.

## 2. The script (Google Sheet › Extensions › Apps Script)

Copy the patterns from `assets/example-Code.gs`:
- **Settings tab** (`config_()`, `SETTING_DEFAULTS`): emails, texts, colours, links, follow-up days. Nothing editable lives in code.
- **Columns found by header name** (`headerMap_`, `ensureSheet_`): `setup()` only adds missing tabs, columns and settings; safe to re-run.
- **doPost**: parse JSON → route by `d.kind` → honeypot → `validate_` → rate limit (`CacheService`, per hour) →
  `LockService` only around "make reference + append row" → slow work (photos, geocoding, emails) after the lock.
- **Unique reference**: `PREFIX-<initials>-<yyyyMMdd>-<HHmmss>-<SSS>` made inside the lock and checked against
  existing references (`uniqueId_`); +1 ms on a clash. Never random-only IDs.
- **Formula injection guard**: prefix values starting with `= + - @` with `'` (`safeCell_`).
- **Emails**: Gmail-safe HTML (tables, inline styles, Arial, 600 px), brand header/stripe/banner/details table/button/footer
  with Impressum, Datenschutz and unsubscribe (`wrapEmail_`). Logo as inline image (`cid:`) from a Drive file.
  Messages to people the owner should check are Gmail **drafts**, never auto-sent; transactional confirmations are sent.
- **Signed links** (newsletter double opt-in, unsubscribe): HMAC with a secret in Script Properties (`sig_`, `link_`), handled in `doGet`.
- **Menu** (`onOpen`): show ready-to-paste code for the selected row, dated notes, "what needs me today", campaigns.
- **Status since + ⚠ FOLLOW UP** via an installable onEdit trigger and a per-row formula; conditional colours.
- **Prices or anything money-related**: never trust the browser; re-read from the source (e.g. the blog feed with `UrlFetchApp`).

## 3. Deploy and hand over

1. Sheet › Extensions › Apps Script › paste › Save › run `setup` › allow.
2. Deploy › New deployment › Web app › Execute as **Me**, access **Anyone** › copy the `/exec` address.
3. Paste it into ENDPOINT on the page (and into Settings "Web app address" if links in emails need it).
4. After every code change: Deploy › Manage deployments › edit › **New version** (same address).
5. Test with a real submission; check row, photos folder, both emails.
6. Add the form to the Datenschutz page (what is stored, Google as processor; a free Gmail account has no AVV —
   recommend Google Workspace for a business).

## 4. Test before handing over

- Run the script in Node with stubbed services (SpreadsheetApp with a small fake sheet, LockService, CacheService,
  DriveApp, MailApp, GmailApp, Utilities incl. HMAC, UrlFetchApp) and check: setup twice, valid/invalid posts,
  honeypot, duplicate-safe references, emails' HTML, signed links (forged one refused).
- Load the page with Playwright at 390 and 1280 px, route the ENDPOINT to the stubbed script, fill the form,
  check validation messages, the JSON sent, photo resizing and the thank-you state. Screenshot and look.

## Variations that reuse the same machinery

Become a partner · product submissions from members · order requests from a cart · event bookings ·
newsletter sign-up (double opt-in) · job/volunteer applications · update requests ("change my page").
