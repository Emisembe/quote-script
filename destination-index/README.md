# African Talent Destination Index (Google Apps Script)

One-file Apps Script that turns an empty Google Sheet into a scoring tool:
is a European country a realistic destination for African professionals?

## Install
1. Create a new Google Sheet.
2. Extensions > Apps Script. Replace the contents of `Code.gs` with [`Code.gs`](Code.gs). Save.
3. Reload the Sheet. Menu **Destination Index** appears.
4. **Destination Index > 1. Build / repair the sheet** (approve permissions the first time).
5. Follow the **Guide** tab.

## Tabs
Guide, Dashboard, Data, Evidence, Weights, Scores, Indicators, Sources, Rubrics, Log.

Eurostat indicators (F1, F2, R1, R3) are fetched automatically via the Eurostat JSON API;
the rest are filled manually from the sources listed in the Indicators tab.
