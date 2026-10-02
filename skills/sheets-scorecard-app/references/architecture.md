# Architecture of a self-building Sheets app

All function names below exist in `example/Code.gs`; open it to see the full version.

## Contents
1. File layout
2. Layout constants derived from the explanation boxes
3. Parameters as named ranges
4. The menu
5. Staged build: Quick start, Update, Reset
6. Keeping data on update
7. Refresh and auto-refresh
8. Version check
9. Helpers worth copying

## 1. File layout (one Code.gs)

```
header comment: what it is, how to install, how to update
APP            sheet names, colours, property keys, trigger handler names (keep handler names stable forever)
CRITERIA       [name, default weight, explanation]  (order = sub-score columns)
PARAMS         [named range, label, default, note, editable]
reference data countries, products, value chains, equipment, suppliers, markets, sample-data shapes
TAB_HELP       per tab: title, what, read, say, watch  (drives the blue explanation boxes)
ABBREVIATIONS  every short form with its full name (Guide table)
L              row positions derived from TAB_HELP (see 2)
menu + entry points
staged build + update (backup/restore)
build*_        one function per tab
data           sample generators, API fetchers, readers/writers
compute        pure scoring functions (no Sheets calls) + write*_ functions
helpers
```

Pure scoring functions take plain arrays and return rows. That keeps them fast (one `getValues`, one
`setValues`) and lets the Node tests check them directly.

## 2. Layout constants derived from the explanation boxes

Every tab starts with a blue box whose height depends on its help text. Never hard-code row numbers: derive
them, so editing help text cannot break formulas.

```js
function top_(key) {            // first row below the box (header row on data tabs)
  return 1 + bannerLines_(key).length + (DATA_TABS.indexOf(key) >= 0 ? 1 : 2);
}
const L = (() => {
  const s = top_('settings');
  return { settingsWeight: s + 1, /* … */ rawHead: top_('raw'), rawFirst: top_('raw') + 1, /* … */ };
})();
```

Build functions and formulas use `L.*` and `top_(key)`. Tests use the same values (`c.L`, `c.top_`).
Layout values that depend on other sections (for example a chart area above a table) get their own constant
(`NEEDS_CHART_ROWS`) or layout function (`vlcLayout_()`), also used by the tests.

## 3. Parameters as named ranges

Each PARAM is a row on Settings with a named range (`P_YEAR`, `P_MIN_GAP`, `P_SH_AF` …). Formulas use the
names directly (`=…*P_SH_AF`), so changing a yellow cell updates every tab instantly. Read and write them
with `getParam_` / `setParam_`. Status values the code sets (`P_STATUS`, `P_WB_STATUS`, `P_BUILD`,
`P_LAST_REFRESH`) are also params, so Health_Check and the Dashboard can show them.

Weights live in a Settings table; the composite score is a live ARRAYFORMULA over the sub-score columns times
the weight cells, divided by their sum. Changing a weight re-ranks everything without running code.

## 4. The menu

`onOpen` builds one menu: Quick start; Refresh data; numbered data steps (2a sample, 2b API, 2c clear for own
data, 2d free indicators); 3 Compute; auto-refresh on/off; Update workbook after pasting new code; Reset;
Run full audit; Stop a running download. `onOpen` then calls `checkVersion_`.

## 5. Staged build: Quick start, Update and Reset

In a real sheet, building ~28 tabs plus computing can take longer than Google's 6-minute limit
("Exceeded maximum execution time"). So the build is a list of steps:

```js
function buildSteps_(mode) {           // mode: 'quick' | 'update' | 'reset'
  const steps = [];
  if (mode === 'update') steps.push(['Saving your settings', ss => backupSettings_(ss)]);
  steps.push(['Arranging tabs', ss => arrangeTabs_(ss)]);
  steps.push(['Settings', ss => buildSettings_(ss, keptKey)]);
  // … 2–3 tab builders per step …
  if (mode === 'update') steps.push(['Restoring your settings', ss => restoreSettings_(ss)]);
  if (mode === 'quick') steps.push(['Loading sample data', () => loadSampleData_()]);
  if (mode !== 'reset') steps.push(['Scoring', () => computeTrade_()], ['Scoring value addition', …]);
  return steps;
}
```

`startBuild_(mode)` stores `{mode, step, tries, messages}` as JSON in DocumentProperties and calls
`runBuild_()`, which:
- creates a safety-net trigger 8 minutes out (if Google kills the run, it resumes at the same step);
- runs steps while under ~3 minutes, saving the step number after each;
- when the budget is used, replaces the triggers with one that fires in 1 minute (`continueBuild`);
- writes progress to `P_BUILD` ("In progress: step 6 of 17 (…)", later "Done (update, version …)");
- stops cleanly on an exception or after 3 tries of the same step, with the message in `P_BUILD`;
- deletes its triggers and the state when finished, then shows the result.

`buildWorkbook_()` runs the same steps in one go; it is only used for a brand-new empty workbook.

## 6. Keeping data on update

`backupSettings_` snapshots settings and user edits (weights, params, countries, products, value chains,
equipment, suppliers, markets) to a hidden `_Update_Backup` tab as chunked JSON (Dates converted to text),
because a staged update spans several executions. `restoreSettings_` puts them back and deletes the tab.

Big data tabs (Raw_Trade, Raw_HS4, Enablers) are not copied: `dataSheet_(ss, name, headerText, newHead)`
finds the old header row, inserts or deletes rows at the top so the header lands where the new layout wants
it, and clears only the box above. The data moves without being rewritten. `snapshot_(ss, true)` skips them.

After restoring, `fillMissingValueAddition_` adds data that older versions did not have (sample values when
the source is SAMPLE, a download otherwise) and returns a message for the user.

## 7. Refresh and auto-refresh

`refreshData` reloads from the same source (`P_SOURCE`: SAMPLE / COMTRADE / OWN) and recomputes.
`toggleAutoRefresh` installs or removes a monthly time trigger whose handler name never changes, so it keeps
working after code updates. Long downloads use the same step-and-trigger pattern as the build
(`startComtradeFetch_`, `runComtradeFetch_`, `continueComtradeFetch`, `stopComtradeFetch`).

## 8. Version check

`APP.version` is bumped with every change. The build stores it in DocumentProperties; `checkVersion_` (from
`onOpen`) shows a toast when the pasted code is newer: "Run Africa Trade → Update workbook — your data is kept."
The Guide shows the version that built the workbook.

## 9. Helpers worth copying

`resetSheet_` (removes row groups, charts, merges, validations, notes, formats), `clearSheetBody_`,
`ensureRows_`, `trimColumns_`, `header_`, `dropdown_`, `writeBanner_`, `nowShowing_`, `steps_`, `notify_`
(toast, or console when there is no UI because a trigger is running), `alert_`, `confirm_`, `colLetter_`,
`mulberry32_` (seeded random numbers for repeatable sample data).
