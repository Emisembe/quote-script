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
- Tabs: Guide, Dashboard, Data, Evidence, Weights, Scores, Indicators, Sources, Rubrics, Log.
- Control-panel sidebar with buttons: build, fetch, refresh, navigate, reset.
- Add your own **source links**: Eurostat (data-browser link, API link or dataset code, with filters
  and optional A - B gap) or any **CSV link** (map the country / value / year columns).
- Add your own **indicators** (pillar + direction) and **countries**; scores update automatically.
- Every fetched value is written to Data with a cell note and logged in Evidence.

## Code updates (menu > Code updates)
The script can update itself from this repository:
**Destination Index > Code updates > Update code to the latest version.**
It downloads the newest `Code.gs`, checks it, backs up the current code in a hidden
`_CodeBackup` tab, installs the new code, and can be undone with *Restore previous code*.

One-time setup:
1. Switch **Google Apps Script API** ON at https://script.google.com/home/usersettings
2. Apps Script editor > Project Settings > tick *Show "appsscript.json" manifest file in editor*.
3. Replace `appsscript.json` with [`appsscript.json`](appsscript.json) and save.
4. Run the update and accept the new permission.
