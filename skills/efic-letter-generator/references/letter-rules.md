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
