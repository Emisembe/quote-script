# EFIC Financial Reporting — Timeout Fix Guide (v2 → v3)

This guide explains **why** the EFIC Apps Script could hit Google's 6-minute execution limit, **what** was changed in `efic/Code.gs` to prevent it, and **how** to install and verify the fixed version.

---

## 1. The problem: "Exceeded maximum execution time"

Google stops any single Apps Script run at roughly **6 minutes (360 s)**. The error almost never means the logic is wrong — it means the run is doing too much *slow* work, usually too many round-trips to the Spreadsheet, Gmail or Drive service. Each `getRange().getValue()`, `appendRow()`, or `GmailApp.sendEmail()` is a separate network call costing tens to hundreds of milliseconds. Put one of those inside a loop and the total grows with the data.

## 2. What was slow in v2

| # | Location | Problem | Risk |
|---|----------|---------|------|
| 1 | `ensureConfig()` | `sSheet.appendRow(row)` called inside a `.forEach` — one round-trip per missing setting | Low per run, but it's the pattern that scales badly |
| 2 | `processPeriod_()` | `GmailApp.sendEmail()` called **once per recipient** in a loop | **High** — 100 recipients ≈ 100 network calls; on Workspace (1,500 recipients) this alone can exceed 6 min |
| 3 | `installTriggers()` | Annual and Quarterly triggers use `onMonthDay(1)` so they **fire every month** | Not a timeout, but the annual report was sent 12×/year and the quarterly report 3×/quarter |
| 4 | `processPeriod_()` | No clock, no timing in logs | You couldn't tell *where* time went when a run was slow |
| 5 | `processPeriod_()` | A failure was only visible in the Executions log | Silent failures for scheduled runs |

What was **already fine**: all ledger reads use `getDataRange().getValues()` (one bulk read per tab), metrics are computed in memory, Settings/CoA/Statutory are each read once, and `seedDemoLedger()` writes with a single `setValues()`.

## 3. The fixes in v3

### Fix 1 — Batch the Settings write (`ensureConfig`)

```js
// v2 — N round-trips
needed.forEach(function (row) {
  if (existingKeys.indexOf(row[0]) === -1) { sSheet.appendRow(row); }
});

// v3 — 1 round-trip
var toAdd = needed.filter(function (row) { return existingKeys.indexOf(row[0]) === -1; });
if (toAdd.length) {
  sSheet.getRange(sSheet.getLastRow() + 1, 1, toAdd.length, 3).setValues(toAdd);
}
```

### Fix 2 — One BCC email instead of N sends (`processPeriod_`)

```js
// v2 — one GmailApp call per recipient
emails.forEach(function (e) { dispatchEmail_(e, subject, htmlBody); });

// v3 — one GmailApp call, everyone else on BCC
var opts = { htmlBody: htmlBody, name: orgName };
if (emails.length > 1) { opts.bcc = emails.slice(1).join(','); }
if (pdfBlob)           { opts.attachments = [pdfBlob]; }
dispatchEmail_(emails[0], subject, plainText, opts);
```

Benefits: constant time regardless of recipient count, and the Gmail daily quota is charged **once** per report instead of once per recipient. Recipients cannot see each other's addresses (BCC).

### Fix 3 — Fiscal-calendar gates (`runAnnualReport`, `runQuarterlyReport`)

Apps Script time triggers cannot express "first day of the fiscal year", so the triggers still fire on the 1st of every month — but each function now checks the date and exits immediately when it is not the right day:

```js
function runAnnualReport() {
  var now = new Date(), fyMo = fyStartMonth_(getConfig_());
  if (now.getDate() !== 1 || now.getMonth() !== fyMo) { return; }   // not FY start → skip
  processPeriod_('Annual');
}

function runQuarterlyReport() {
  var now = new Date(), fyMo = fyStartMonth_(getConfig_());
  var monthsIn = ((now.getMonth() - fyMo) + 12) % 12;
  if (now.getDate() !== 1 || monthsIn % 3 !== 0) { return; }        // not a quarter start → skip
  processPeriod_('Quarterly');
}
```

Result: Annual sends once a year, Quarterly four times a year, both respecting **Financial Year Start Month** in Settings. The menu items "Send a report now ▸ Quarterly / Annual" go through the same gate — use `testQuarterly()` / `testAnnual()` from the script editor (or "Preview annual report to me") to force a send on any date.

### Fix 4 — Clock guard and timing

`processPeriod_` records a start time, logs a warning if the ledger load alone passes 2.5 min (a sign to split old data into an archive tab), and logs total elapsed seconds on every run so slow runs are diagnosable from the Executions page.

### Fix 5 — Error alert

If a scheduled run throws, the script owner receives an email ("EFIC report error: <cadence>") with the error and elapsed time. Scheduled failures are no longer silent.

### Bonus — PDF attachment on the Annual report

New Settings key **`Attach PDF to Annual Report`** (`Yes` / `No`, default `No`). When `Yes`, `buildPdfReport_()` creates a temporary Google Doc containing the Performance Summary, Income Statement, Statutory & Tax, Balance Sheet and all ratios, exports it to PDF with `DriveApp.getFileById(id).getAs(MimeType.PDF)`, trashes the temp Doc, and attaches the PDF to the email. If PDF generation fails for any reason the email still sends (the error is logged).

## 4. How to install the fixed version

1. Open the EFIC spreadsheet → **Extensions ▸ Apps Script**.
2. Select all of `Code.gs` and replace it with the contents of `efic/Code.gs` from this repository.
3. **Save**, then reload the spreadsheet so the *Financial Reports* menu refreshes.
4. **Financial Reports ▸ Setup / update config** — this adds the new `Attach PDF to Annual Report` row to Settings (non-destructive; nothing you already have is changed).
5. In **Settings**, set `Attach PDF to Annual Report` to `Yes` if you want the PDF.
6. **Financial Reports ▸ Install / refresh automatic triggers** — this replaces the old triggers with the gated ones.
7. **Financial Reports ▸ Preview annual report to me** — confirms the email (and PDF) arrive. The first run will ask for Docs/Drive permission because of the PDF step; approve it.

> Two things to check in your current Settings tab while you're there:
> - **Ledger Tab Name** is `sample_ledger_2024`. New form submissions land in `Submissions`, so set this to `Submissions, sample_ledger_2024` (or just `Submissions`) or new entries will not be reported.
> - **Default Language** is `DE`. Every report will be in German unless you change it to `EN`.

## 5. How to verify it worked

- **Executions page** (Apps Script editor ▸ left sidebar ▸ Executions): every run now ends with a line like
  `[Annual] Sent to 2 recipient(s) via BCC. Rows: 14. Time: 3.4s.` — look at `Time:`. Typical runs are well under 10 s.
- Run `runQuarterlyReport` from the editor on a non-quarter-start day: the log should read
  `runQuarterlyReport: skipped (not the first day of a fiscal quarter)` and nothing is sent.
- A local harness exercising the same logic with mocked Google services lives at
  `efic/test/run-tests.js` — run `node efic/test/run-tests.js efic/Code.gs` to confirm all checks pass after any edit.

## 6. If a run *still* approaches 6 minutes

The script now batches every Sheet operation, so the only remaining variable is ledger size. Options, in order:

1. **Narrow the ledger** — move closed years into their own tab (e.g. `ledger_2023`) and remove it from *Ledger Tab Name* for routine reports; add it back only for an annual comparison.
2. **Keep tabs tidy** — stray content far below the data makes `getDataRange()` read thousands of empty rows. Delete unused rows at the bottom of ledger tabs.
3. **Chunking** — if a single ledger genuinely exceeds ~50 k rows, the next step is a resumable run that stores the last processed row in `PropertiesService` and re-triggers itself. Not needed at current volumes; ask for it when the log's `Time:` passes ~120 s.

## 7. Checklist used for this audit

1. Grep for `getRange(` + loop variable + `.getValue()` / `.setValue()` / `appendRow(` inside loops → found one (`ensureConfig`), fixed.
2. Grep for service calls inside loops (`sendEmail`, `insertChart`, `flush`) → found one (`sendEmail`), fixed with BCC.
3. Heavy optional work off the hot path → PDF is opt-in via Settings and wrapped so it can never block the email.
4. Cache repeated reads → `getConfig_()` is called once per run and passed down; every tab is read once.
5. Timing in logs → added.
6. Re-run and confirm → mock harness passes; see §5.
