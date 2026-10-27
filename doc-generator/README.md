# EFIC Document Generator

A Blogger **page** that creates invoices, receipts, quotations and 13 other financial documents, then exports them as a PDF. It is a separate project from the Blogger theme in `../blogger-theme`.

## Install
In Blogger, go to **Pages**, open the page and click **Edit**. Switch to **HTML view**, replace everything with `efic-document-generator.html`, then click **Update**.

The page hides the theme's menu, header, sidebar, title, share bar, comments and footer, but only on this page. When the page opens, it also hides anything else around the tool, so sections added to the theme later (like the newsletter band) never appear on this page. The only exception is Blogger's cookie notice for European visitors, which has to stay visible.

## Blogger-safe characters
Blogger's page editor turns every special character (`×`, `—`, `ä`, Chinese text) into a code like `&#215;` when you save. Inside `<script>` and `<style>` those codes are never turned back, so they show up as text. The file is therefore pure ASCII:
- **JavaScript:** special characters are written as `\u00d7`.
- **CSS:** they are written as `\0000d7`.
- **Page text:** they are written as `&#215;`.

Check any edit with:

```bash
python3 tools/blogger_sim.py efic-document-generator.html /tmp/saved.html && cmp efic-document-generator.html /tmp/saved.html
```

No output means Blogger will leave the file unchanged.

## Payment options
The **Payment Options** panel (it used to be called Bank Details) lists every way a client can pay. Tick the ones you accept and fill in their details. Each ticked method appears on the document as a card:
- **Bank transfer:** bank, account, and optionally IBAN and SWIFT.
- **M-Pesa:**
  - Paybill: business number, with the document number as the account number
  - Buy Goods (Till): till number
  - Send Money: phone number
- **PayPal:** email or link.
- **Skrill:** email.
- **Other:** any method by name, e.g. Wise or Airtel Money.

Above the cards: "Please use [document number] as your payment reference". The document only shows the details; clients pay in their own app. Receipts can record M-Pesa, Skrill or Mobile Money as how they were paid. Older saved documents open with bank transfer ticked, as before.

## Pages, print and PDF
The preview, Print and the PDF all use the same A4 page layout, so what you see is what prints:
- Item rows are never split across pages.
- The table header repeats on every page.
- Pages 2 onward start with the EFIC band and a "(continued)" line naming the document.
- The totals never start a page alone; at least one item row moves with them.
- Every page has a footer: company, document number and **Page X of Y**, translated.
- **Print** gives real text at full printer resolution, and the text can be searched.
- **Download PDF** captures each page at 300 dpi.
- Delivery notes, packing slips and bills of lading leave out prices, totals and bank details.
- **New fields:** an editable **Document No.** for your own sequence, and VAT / tax IDs for you and the client.
- Uploaded logos are scaled to at most 600 px, so saved documents stay small.


**Print quality:** **Print** sends text to the printer as sharp outlines, at the printer's full resolution (600-1200 dpi), so use it for paper copies. **Download PDF** is 300 dpi, the print-shop standard, which suits email. An uploaded logo prints at 384 ppi or more.
## What changed from the first version
**Brand (EFIC Brand Colour Guide v1.0)**
- Navy `#14213D` and Gold `#E7B165` replace sky blue and the eight different button colours.
- Montserrat for headings and labels, Calibri/Arial for text.
- Alert Red is no longer used. The guide reserves it for LIVE broadcasts.
- Gold is never used for text on white, and white text never sits on gold.
- The document has a navy top band with a gold rule, gold underlines on its section titles, and a navy total bar with the amount in gold. Without an uploaded logo, it shows a navy badge with the company initials.

**Fixes**
- **Safe text:** typed text, addresses and saved names are no longer inserted as HTML. `<` and `&` display correctly and nothing typed can run as code.
- **Live preview:** the document updates as you type. The **Update** button (first in the top bar) redraws it at once and shows "Updated", for peace of mind before printing or downloading.
- **Stable document number:** it stays the same while you edit, and saving or loading keeps it.
- **New Download PDF button.** On phones that support it, a **Share PDF** button sends the file itself.
- **Smaller PDFs:** saved as JPEG, about 0.2 MB a page instead of about 12 MB.
- **Translations:** dates and amounts follow the chosen language (`22 Oct 2026` / `£1,870.00`, `22. Okt. 2026` / `£1.870,00`). Bank, currency, payment method, phone and email labels are translated, and units read Hours/Days instead of hrs/days.
- **Fits the panel:** fields no longer overflow it, and the layout has no sideways scrolling from 320px to 1440px.
- **Line items:** each has two rows, the description across the top and SKU, unit, qty and price below, so nothing is cut off.
- **Clean print:** prints the document only, without the theme's print heading.
- **Keyboard:** panels open with the keyboard, and Escape closes the dialog.
- **Saved documents:** they still load (same storage key and format).
