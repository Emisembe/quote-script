# Testing, auditing and Google Sheets limits

## Contents
1. The two tools
2. workflows.js: every menu action
3. verify.js: formula results
4. Audit checklist
5. Google Sheets limits and differences
6. Debugging "it doesn't work in my sheet"

## 1. The two tools (copy from `scripts/` into the project's `tests/`)

- `mock.js` loads `Code.gs` (path from `CODE_GS`, else `../Code.gs`) into a Node `vm` context with fakes for
  SpreadsheetApp, Charts, PropertiesService, ScriptApp (triggers), Utilities and Session. Sheet and Range
  methods are whitelisted: calling one the real API lacks throws, and writes outside the grid throw, like
  Google does. Charts record their options (`sheet.getCharts()[i].opts`). Exports
  `{ ctx, sheets, named, toasts, alerts, triggers }`; `ctx` holds the script's functions (`ctx.quickStart()`).
  Top-level `const` values are not on `ctx`; read them with `require('vm').runInContext('NAME', ctx)`.
  Add `UrlFetchApp` yourself in a test to fake an API.
- `sheetsim.js` evaluates the formulas the mock wrote, with Google Sheets semantics: array broadcasting,
  ARRAYFORMULA, spills (#REF! on collision), blanks, case-insensitive text, criteria with `* ?` wildcards,
  named ranges, a mini QUERY. Functions: AND ARRAYFORMULA ARRAY_CONSTRAIN COUNT COUNTA COUNTIF COUNTIFS
  COUNTUNIQUE FILTER FIND IF IFERROR INDEX ISNUMBER LEFT LOWER MATCH MAX MAXIFS MEDIAN MIN OR QUERY RANK ROUND
  ROW SEARCH SORT SPARKLINE SUM SUMIF SUMIFS SUMPRODUCT TEXT TEXTJOIN VLOOKUP. Add a function there before
  using a new one in the workbook, and follow Google's documented behaviour, not Excel's.
  Use: `const sim = fromMock(m); sim.run(); sim.value('Tab', row, col); sim.errors()`;
  after changing a picker cell, `sim.run(8, ['Tab'])` recalculates only that tab.

`example/tests/` has the full Africa test files to copy from.

## 2. workflows.js: every menu action and every function

Run each menu entry on a fresh mock: quickStart, upgradeWorkbook, refreshData, loadSampleData, toggleAutoRefresh,
runFullAudit, clearRawTrade, buildWorkbook (reset), fetchWorldBankData, autoRefresh, onOpen/checkVersion_.
Then the hard paths:
- a fake API (`ctx.UrlFetchApp = { fetch: url => … }`) with a fake clock (`ctx.Date = class extends Date {
  static now() { t += 50000; return t; } }`) so long jobs split into runs; drain triggers by calling the
  handler while `m.triggers.length` and assert exactly one pending trigger between runs;
- one failing item, several failures in a row, a rejected key, stop, an API that returns an error body;
- update from an older layout (data shifted by inserted/deleted rows at the top, missing tabs or columns):
  data must be identical afterwards, edits and settings kept, no backup tab or triggers left, status "Done";
- a step that throws: the build stops cleanly and the next run recovers;
- every chart has a title (`opts.title` and `opts.titleTextStyle`).
Wrap all top-level functions to record calls and assert that none was never called (coverage).

## 3. verify.js: formula results

Build with sample data, run the simulator, then check numbers against independent calculations in the test:
composite = weighted average; rankings sorted; every picker for every value (all 54 countries) shows NOW
SHOWING with the right name and count, tables have the expected rows, chart data equals the source cells;
changing a weight or assumption cell changes results live; Health_Check rows have the expected status;
fallback cases (benchmark missing) still produce values and the right message. Count checks and print
`RESULT: N checks passed, M failed`. A full run takes ~15 minutes; run it in the background.

Performance note for test helpers: `sheet.getLastRow()` in the mock scans all cells; call it once, not in a
loop condition.

## 4. Audit checklist

1. Run both test files; report the counts.
2. Coverage: every function called by some test.
3. Count spreadsheet calls per menu action with an instrumented mock; a build of ~3,000 calls is fine.
4. Cells: rows × all columns of every tab (Google counts empty columns) far below 10 million with real data
   sizes, not sample sizes.
5. Longest formula and longest text far below 50,000 characters.
6. Re-read paths the tests cannot run for real: triggers, UI dialogs inside triggers (no UI: use toasts or
   console), API quotas, time limits.

## 5. Google Sheets limits and differences

- 6 minutes per execution (custom functions 30 s). Plan every long job as resumable steps.
- 10 million cells per spreadsheet, empty columns included: `deleteColumns` on long data tabs.
- 50,000 characters per cell.
- `getValues()` or any read after writes forces a flush and waits for recalculation; batch writes, read first.
- Triggers: UI calls (`getUi().alert`) fail in time-driven triggers; toasts may not show. Write status to a
  visible cell instead (`P_BUILD`, `P_STATUS`).
- Simple triggers (`onOpen`) cannot use services that need authorisation; wrap them in try/catch.
- Chart titles cannot be formulas; put the live name in the series header (legend) instead.
- ARRAYFORMULA/FILTER spills give #REF! when something sits in the way: reserve enough rows below each
  spilling formula for the largest realistic result.

## 6. Debugging "it doesn't work in my sheet"

1. Ask which menu item they ran and what they see (a screenshot is best), and the version shown in the Guide.
2. Reproduce in the simulator: render the tab as text for the same selection (write a small script that prints
   every non-empty cell `row: A=… | B=…`) and read it as the user would.
3. Check for a half-finished earlier run (status "In progress"/"Stopped", hidden `_Update_Backup` tab): the fix
   is usually to run Update (or Quick start with sample data) again with the new code.
4. Fix the cause, add a test that would have caught it, bump the version, rerun both test files.
