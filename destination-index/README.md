# African Talent Destination Index (Google Apps Script)

One-file Apps Script that turns an empty Google Sheet into a scoring tool:
is a European country a realistic destination for African professionals?

## Install
1. Create a new Google Sheet.
2. Extensions > Apps Script. Replace the contents of `Code.gs` with [`Code.gs`](Code.gs). Save.
3. Reload the Sheet. Menu **Destination Index** appears.
4. **Destination Index > Build / repair the sheet** (approve permissions the first time).
5. **Destination Index > Open control panel (buttons)** and follow the **Guide** tab.

## Features
- Tabs: Guide, Dashboard, Findings & Advice, Data, Professions, Organisations, Evidence, Weights, Scores, Indicators, Sources, Rubrics, Log.
- Findings & Advice: the answer in plain language (one sentence, what it means, country-by-country advice with a profession selector, editable wording) and two charts.
- Professions: shortage status per profession and country, links to official shortage lists, most-needed ranking on the Dashboard.
- Organisations: starter list of EU, global and national bodies that shape migration, labour and anti-discrimination policy, with engagement tracking.
- Control-panel sidebar with buttons: build, fetch, refresh, navigate, reset.
- Add your own **source links**: Eurostat (data-browser link, API link or dataset code, with filters
  and optional A - B gap) or any **CSV link** (map the country / value / year columns).
- Add your own **indicators** (pillar + direction) and **countries**; scores update automatically.
- Every fetched value is written to Data with a cell note and logged in Evidence.

## Code updates (menu > Code updates)
Everything is in the single `Code.gs`. To update:
**Destination Index > Code updates > Update code to the latest version.**
It downloads the newest `Code.gs` from this repository, checks it, and opens a window with
*Copy code*, a link to the Apps Script editor, and the paste steps (Ctrl+A, Ctrl+V, Ctrl+S, reload).
Your data is not touched. Optional fully automatic install is described in the Guide tab, section 14.
