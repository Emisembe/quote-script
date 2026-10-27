# Letter rules

## DIN 5008 geometry (A4, all values in mm from the top-left corner of the sheet)

| | Form B (default) | Form A |
|---|---|---|
| Letterhead height | 45 | 27 |
| Address field top | 45 | 27 |
| Info block top (left edge 125) | 50 | 32 |
| Body text starts at | 98.46 | 80.46 |
| Fold marks | 105, 210 | 87, 192 |
| Hole mark | 148.5 | 148.5 |

- **Address field:** starts 20 mm from the left and is 85 x 45 mm. The text starts 25 mm from the left, so it is 80 mm wide. The top 17.7 mm is the return-address zone (one small line, `.lt-return`); the address itself fills the 27.3 mm below it, at most 6 lines. More than 6 lines shows a warning in the panel.
- **Margins:** text is 25 mm from the left and at least 20 mm from the right.
- **Body start:** if the info block runs long, the body starts 8.46 mm (two blank lines) below it instead.
- **Footer:** at the bottom of every sheet. Body text stops 5 mm above it.
- **Pages 2 onwards:** a header with the company name, reference and date. Body starts at 25 mm.
- **Page numbers:** "Page X of Y" in the letter's language, only when there is more than one page.
- **Country:** the line for a letter abroad is printed in capitals, as the last address line.
- **Envelopes:** these positions fit DL and C5/6 window envelopes after folding at the marks.

## Greeting and closing (used when the user leaves those fields empty)

| Language | Address line | Greeting | Closing |
|---|---|---|---|
| en | Mr/Ms/Mrs or academic title, first, last | `Dear Ms Musterfrau,` / `Dear Sir or Madam,` (no name) | `Yours sincerely` (name known) / `Yours faithfully` (no name), British convention |
| de | **Herrn** / Frau, Dr., first, last | `Sehr geehrter Herr Dr. Mustermann,` / `Sehr geehrte Frau ...,` / `Guten Tag Erika Musterfrau,` (name, no title) / `Sehr geehrte Damen und Herren,` | `Mit freundlichen Grüßen`, with **no comma** (DIN 5008) |
| fr | Monsieur / Madame ... | `Monsieur,` / `Madame,` / `Madame, Monsieur,` | `Veuillez agréer, [greeting], l'expression de mes salutations distinguées.` |
| sw | Bw. / Bi. ... | `Ndugu Bw. ...,` / `Ndugu,` | `Wako mwaminifu,` |
| zh | surname given-name + 先生/女士 | 尊敬的...： | 此致 / 敬礼！ |

English has no comma after "Dear ..." in some house styles. EFIC uses the comma. Change the `GREETING` functions if the user asks.

## Our reference (automatic)
`INITIALS-YYYYMMDD-HHMMSS`, for example `KPLC-20261022-163239`.
- **Initials** come from the recipient company. Accents are removed and dots dropped ("S.A." becomes "SA"). Legal forms and small words are skipped (`SKIP_WORDS`: Ltd, Limited, PLC, Inc, GmbH, AG, KG, S.A., SARL, BV, Pty, "and", "of", "the", "und", "de", "na", "ya", ...).
  - Several words: their first letters, at most 5 (Kenya Power and Lighting Company PLC gives KPLC, Equity Bank Kenya Limited gives EBK).
  - One word: its first 3 letters (Safaricom gives SAF), unless it is a 2-6 character all-capitals name, which is kept whole (KCB, UNICEF).
  - No usable company name (empty, or only Chinese characters): the person's initials (EM). No name at all: `LTR`.
- **Date and time** are when the letter was started (`refStamp`), not the letter date. This keeps the reference stable while editing and unique per letter. `New` makes a new one, and a saved letter keeps its own.
- A typed reference in the field always wins. The reference is shown in the info block, the continuation header, the margin strip and the PDF file name.

## GiroCode (EPC069-12 "SEPA credit transfer" QR)
The payload has one field per line:
1. `BCD`
2. `002`
3. `1` (UTF-8)
4. `SCT`
5. BIC (optional in version 002)
6. Creditor name (max 70 characters)
7. IBAN, without spaces
8. Amount: `EUR` + 2 decimals, between 0.01 and 999999999.99. **Leave it empty if there is no amount, never `EUR0.00`.**
9. Purpose code
10. Structured reference (an RF creditor reference only, so leave it empty)
11. Unstructured text: our free-text reference, max 140 characters
12. Information

Drop trailing empty fields. Validate the IBAN with mod-97 before drawing the code; if it fails, show a warning and no code. Encode with qrcode-generator in UTF-8 byte mode, error level M: `qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8']`. qrcodejs adds a byte-order mark that some banking apps reject. GiroCode only works for euro payments within SEPA, so say so in the panel hint.

## Dates
`fmtDate()` uses `toLocaleDateString(W[lang].locale, {day:'numeric', month:'long', year:'numeric'})`, for example "22 October 2026" or "22. Oktober 2026". Both are valid DIN 5008 forms.

## Contracts
- **Page 1:**
  1. The letterhead.
  2. The title (Montserrat 15pt, uppercase) with a 28 mm gold rule.
  3. `Ref. <reference> · <date>`, then the opening line.
  4. `BETWEEN`, party 1 `(1) Name, details (the "Role");`, `AND`, party 2 `(2) Name, details (the "Role").`, then `(each a "Party" and together the "Parties").`
- **No envelope window on contracts:** no address field, info block or fold marks. Body text starts 4 mm below the letterhead rule.
- **Clauses:** headings numbered `1.` with sub-clauses `1.1` indented 10 mm, and list items `(a)` indented 18 mm. A heading always has at least 12 mm of room after it, otherwise it moves to the next page. Long clauses split between words with at least two lines on each side, and the number appears only on the first part.
- **Signature blocks (`.ct-exec`, kept together):**
  - "IN WITNESS WHEREOF ..." followed by two columns.
  - Each column has "Signed for and on behalf of", the party's name, a 16 mm signature line, and Name, Position and Date lines.
  - Optional witness lines (Signature, Name, Date) go under each column.
- **Every page:** initials boxes (two 11 x 5.5 mm boxes, bottom left) and `Page X of Y`. From page 2, a header with organisation, title, reference and date.
- **Schedules** start on a new page with a centred title and gold rule.
- **Reference** `<party 2 initials>-YYYYMMDD-HHMMSS` (`CTR-…` when party 2 has no name yet).
- **Governing law:** `{law}` defaults to *the laws of Kenya* and `{courts}` to *Kenya*. Templates assume Kenyan defaults where numbers matter: employment has 21 working days' annual leave, one month's notice after probation and a [3]-month probation. Change them with the law.
- **Blanks** `[like this]` print with an off-white background and a dark-gold dashed underline, so an unfinished contract is obvious on paper. The panel lists the open ones.
- **DRAFT** watermark: dark gold `#C9924A` at 12% opacity, rotated -32 degrees, in the letter's language (ENTWURF, PROJET, RASIMU, 草稿).
