# EFIC Letter Generator

A Blogger **page** for writing business letters and contracts on EFIC letterhead. Letters follow the German DIN 5008 layout, so the address shows through a window envelope. Contracts get their own layout with numbered clauses and signature blocks. Both export as a PDF. It is a separate project from the theme (`../blogger-theme`) and the Document Generator (`../doc-generator`).

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

**Templates (Document section, at the top of the panel):**
- Choose **Letter** or **Contract / Agreement**, then a template. The template fills in the text, and you edit every word.
- **Letters:** invoice cover letter (the original sample, in all five languages), introduction of services, quotation cover letter, engagement letter, payment reminder, final payment notice, job offer, contract termination notice, reference letter, blank letter.
- **Contracts:** consultancy / service agreement, non-disclosure agreement (mutual NDA), employment contract, supply agreement, partnership agreement, memorandum of understanding (MoU), blank agreement.
- **Blanks:** words in `[square brackets]` are blanks to fill in, for example `[start date]` or `[amount]`. They are highlighted on the page, and the panel lists the ones still open ("4 blank(s) still to fill in: …"). Print only when the list is gone.
- **Filled in automatically:** `{org}` (your organisation), `{company}` (the recipient or party 2), `{party1}`, `{party2}`, `{role1}`, `{role2}`, `{law}`, `{courts}` and `{date}`. They work in your own text too.
- **Choosing another template after you have edited the text asks first**, so you can't lose your work by accident. Switching between Letter and Contract keeps each one's text.
- **Mark as DRAFT** puts a faint DRAFT watermark on every page (in the letter's language).
- **Language:** templates are written in English. The panel, template names and the contract's fixed words (BETWEEN, Signature, Page 1 of 3 …) follow the language you choose.

**Contracts:**
- **Layout:** your letterhead, then the title with a gold rule, the reference and date, the opening line, and the parties ("BETWEEN (1) … AND (2) …").
- **Party 1 is you:** the name defaults to your organisation name. Party 2 is the other side. Each party has a name, details (registration number, address) and what it is called in the contract (Consultant, Client, Employer, Employee …).
- **Governing law and courts** are editable fields. They default to *the laws of Kenya* and *Kenya*, and the governing-law clause uses them. If you change them, check legal minimums such as leave, notice and probation.
- **Clauses are numbered for you,** so you can add, delete or move clauses without renumbering:
  ```
  # Fees and Payment            -> 3.  FEES AND PAYMENT
  The Client shall pay ...      -> 3.1 The Client shall pay ...
  Invoices are payable ...      -> 3.2 Invoices are payable ...
  - is public;                  -> (a) is public;
  ## Schedule 1: Services       -> starts a schedule on a new page
  ```
- **Signatures:** a block for each party. Yours uses the Signature section (name, position, signature image). Party 2's signatory name and position have their own fields. Tick **Witness lines** to add a witness under each signature (on by default for employment and partnership).
- **Every page** has initials boxes (can be switched off), "Page X of Y", and from page 2 a short header with the contract title.
- **Reference and PDF name:** built from party 2's initials, e.g. `KPLC-20261027-194133`.
- **Templates are a starting point, not legal advice.** They are plain-English standard clauses. Have a lawyer review a template once before you rely on it, especially employment and partnership agreements.

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
- **Print** sends the text to the printer as sharp outlines, so it prints at the printer's full resolution (600-1200 dpi). It's the best choice for paper. To keep a PDF with the same sharp, selectable text, choose **Print → Save as PDF**.
- **Download PDF** is 300 dpi, the print-shop standard, and the easiest way to email a letter. On phones you can share the PDF file itself.
- Uploaded images stay above 300 ppi on paper: the logo prints at 362 ppi or more, the signature at 376 ppi or more and the GiroCode at 379 ppi, with crisp edges.

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
- Templates and contracts (28 checks):
  - Every letter and contract template renders with nothing behind the footer.
  - Clause numbering (1., 1.1, (a)) and blanks highlighted without the punctuation around them, listed once each.
  - Party names and governing law filled in, and changes to the law and courts carried through.
  - Signature blocks for both parties, witness lines, initials boxes and "Page X of Y" on every page, and the schedule on its own page.
  - No clause heading left alone at the foot of a page.
  - The "replace your text?" question (Cancel keeps your text), DRAFT watermark, German wording, Save/Load/New for contracts.
  - Switching back to a letter keeps it, and a printed contract has the right number of pages and searchable text.

Screenshots are in `preview/`.

## Skill
The `efic-letter-generator` skill (`../skills/efic-letter-generator`) bundles a copy of this file, a map of the code and the browser tests. After changing this file, copy it to `../skills/efic-letter-generator/assets/` so the skill stays current.
