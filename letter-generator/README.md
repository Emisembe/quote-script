# EFIC Letter Generator

A Blogger **page** for writing business letters on EFIC letterhead. It follows the German DIN 5008 layout, so the address shows through a window envelope, and exports the letter as a PDF. It is a separate project from the theme (`../blogger-theme`) and the Document Generator (`../doc-generator`).

## Install
In Blogger, go to **Pages**, open the page and click **Edit**. Switch to **HTML view**, replace everything with `efic-letter-generator.html`, then click **Update**.

The tool fills the whole page. On this page only, it hides the theme's menu, header, sidebar, page title, share bar, comments, footer and any extra gadgets in the main column.

## What it does
**Layout:**
- Real A4 pages in DIN 5008 **Form B** (standard) or **Form A** (short letterhead).
- The address field and info block sit at the standard measurements, so the address lines up with a DL/C5 window envelope.
- Optional fold marks, hole mark, and a reference strip in the margin.

**Long letters:**
- The letter moves onto page 2, 3 and so on. Paragraphs split between words, with at least 2 lines kept on each side of a page break.
- Pages 2 onwards get a short header with the company name, reference and date.
- When there is more than one page, every page says "Page X of Y".
- Text never runs into the footer.

**Languages:**
- English, German, French, Kiswahili and Chinese, for both the panel and the letter.
- Greetings and closings match the recipient. In English: "Dear Ms Musterfrau," and "Yours sincerely" when you know the name, otherwise "Dear Sir or Madam," and "Yours faithfully".
- In German the address reads "Herrn" and the closing "Mit freundlichen Grüßen" has no comma.
- To use your own wording, type it in the Greeting and Closing fields.

**Letterhead and signature:**
- Logo upload or image link, tagline, contact details, and up to 4 footer columns.
- Signature name, position, an optional place line, and an optional signature image.
- With **Remember my letterhead** ticked, your letterhead stays filled in on this device.

**Our reference (automatic):**
- Leave **Our Reference** empty and it fills in by itself: the initials of the company you're writing to, then the date and time (to the second) you started the letter. For example, Kenya Power and Lighting Company PLC gives `KPLC-20261022-163239`.
- Legal endings and small words are skipped (Ltd, PLC, GmbH, AG, S.A., "and", "of"). A one-word name uses its first 3 letters (Safaricom gives `SAF`), and a short all-capitals name stays whole (`KCB`, `UNICEF`).
- With no company, it uses the person's initials (Erika Musterfrau gives `EM`). With no name at all, it starts with `LTR`.
- The time part stays fixed while you edit, so the reference doesn't change while you type. **New** starts a new time, and a saved letter keeps its original reference.
- Type your own reference in the field to replace the automatic one. The reference also names the PDF file.

**Update button:** the preview already follows every change you type. **Update** redraws the pages at once and shows "Updated", so you can be sure what you see is current before you print or download.

**Save and Load:** saves letters on this device, in the browser.

**GiroCode (optional):**
- A SEPA payment QR code in the footer, for clients paying in euro.
- The IBAN is checked before the code appears.
- If you leave the amount empty, the payer types it in their banking app.

**Print and PDF:**
- Print and Download PDF produce exactly the pages in the preview.
- The PDF is 300 dpi. On phones you can share the PDF file itself.

## Placeholders to replace
Before using it for real, replace these in the panel:
- **Footer columns:** "Your bank name / IBAN / account number" (EFIC's real bank details).
- **Recipient:** the sample recipient (Musterfirma AG, Berlin).
- **Phone:** EFIC's phone number.

## Blogger-safe characters
Blogger rewrites special characters (`ß`, `é`, `—`, Chinese text) as codes like `&#223;` when you save. Inside `<script>` and `<style>` those codes are never turned back. So the file is pure ASCII, and every special character is written as an escape. After any edit, check it with:

```bash
python3 ../skills/efic-brand-web/scripts/blogger_safe.py check efic-letter-generator.html
```

## Tested
These checks were run in Chromium, both inside a copy of the EFIC theme page and on a bare page:
- Screen widths 1440, 1024, 820, 390 and 320 px: no sideways scrolling, every field stays inside its panel, and there are no script errors.
- The tool fills the page and every theme element around it is hidden.
- The DIN 5008 Form A and Form B positions, measured in mm.
- A 3-page letter: no text lost, page numbers, the continuation header, and nothing behind the footer.
- The wording for all five languages.
- Typed HTML is shown as text and never runs.
- Footer columns can be removed and added again.
- The GiroCode, read back by a QR scanner, matches the EPC standard.
- Save and load, and the letterhead remembered after reloading.
- Print, as a real print to PDF: 3 A4 pages with searchable text.
- Download PDF: 3 pages at 300 dpi.
- The automatic reference for 10 different company names (Kenyan, German, French, Chinese, none), typed references, New, and Save/Load.
- The Update button, in all languages.

Screenshots are in `preview/`.

## Skill
The `efic-letter-generator` skill (`../skills/efic-letter-generator`) bundles a copy of this file, a map of the code and the browser tests. After changing this file, copy it to `../skills/efic-letter-generator/assets/` so the skill stays current.
