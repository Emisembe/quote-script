# Africa Trade Gap Scorecard

A self-building Google Sheets app that shows what African countries import and export, ranks where they could trade more with each other, and measures how much value each country adds (or loses) by processing its raw materials, and what it needs to add more. It is a **composite index** (a multi-criteria scorecard) with weights you can edit.

## Set it up (about 2 minutes)

1. Create an empty Google Sheet.
2. Go to **Extensions → Apps Script**, delete the placeholder code and paste in all of [`Code.gs`](Code.gs). Save.
3. Reload the Sheet. A **Africa Trade** menu appears.
4. Click **Africa Trade → Quick start**. Accept the authorisation prompt the first time.

Quick start builds every tab, loads **sample (synthetic) data** and computes the scorecard, so you can see how everything works.

Everything is in **one file**, `Code.gs`. `appsscript.json` is optional.

## Use real data

| Option | How |
|---|---|
| **UN Comtrade** (recommended) | Get a free key at [comtradedeveloper.un.org](https://comtradedeveloper.un.org) (Products → subscribe to *comtrade - v1*). Paste it on **Settings → UN Comtrade API key**, then run **2b**. It fetches 54 countries in chunks in the background (about 5–15 min) and recomputes when it finishes. |
| **Your own data** | Run **2c** to clear `Raw_Trade`, then paste rows: `Year · Reporter ISO3 · Partner ISO3 (or WLD for world) · X or M · HS2 · Value USD`. Then run **3**. |

## Tabs

Colour code of the tabs: blue = explanation · green = results · orange = your inputs · grey = data. Every results and input tab starts with a **blue box** covering *what you see*, *how to read it*, *a sentence you can use when presenting* and *what to watch out for*. You can hide it with −.

| Tab | Type | What it shows |
|---|---|---|
| Guide | Explanation | Start here: steps, tab map, a 5-minute presentation script, **all abbreviations with full names**, all tab explanations |
| About | Explanation | What the tool is, why it exists, the questions it answers, and what it is *not* |
| Dashboard | Results | Africa-wide totals, a table per country, charts of intra-African share and gap by sector |
| Charts | Results | Flow diagram of the method, live weights diagram, the "untapped gap" illustrated, and 6 charts (sectors, top exporters, regions, top opportunities, market access, score spread) |
| Top_Gaps | Results | Ranked opportunities, filtered by exporter, importer and sector |
| Country_View | Results | One country: top exports and imports, African buyers and suppliers, best opportunities |
| Explain_Score | Results | One opportunity explained: a written summary, points per criterion, and a picture of the gap |
| Scorecard | Results | The full index: raw inputs, 7 sub-scores (0–1), composite (0–100) |
| Settings | Input | Weights and parameters (yellow cells), data status, last refresh time, auto-refresh status |
| Methodology | Explanation | Every formula, step by step, a worked example, and the limits |
| Glossary | Explanation | Plain-English definitions of the terms used |
| Data_Sources | Explanation | Sample vs Comtrade vs own data, the API key, the Raw_Trade format, other sources |
| Refresh_&_Updates | Explanation | How to refresh data, switch on auto-refresh, and update the code safely |
| FAQ | Explanation | Frequently asked questions |
| Countries / Products | Input | Reference data. Edit memberships, or untick products to exclude them |
| Value_Addition | Results | Per country: raw vs processed exports, processing share, value lost by exporting raw, enabler gaps; 3 charts |
| Value_Lost_Charts | Results | Value lost made visual: a 4-step diagram of how value is lost, a value ladder for every chain, a worked example, a live "pick a country" section with 2 charts, and 5 Africa-wide charts (raw vs processed, by sector, by region, round trip, readiness vs value lost) |
| Country_Needs | Results | Pick a country: enablers vs the African median, value-addition opportunities, what processing requires, a summary in words |
| VA_Scorecard | Results | Every country × value chain with 5 sub-scores and a value-addition score (0–100) |
| Value_Chains | Input | The 25 value chains: raw, semi-processed and processed HS4 codes, value multipliers (assumptions) and needs |
| Enablers | Data | 7 World Bank indicators per country (electricity, manufacturing, manufactured exports, logistics, schooling, credit, internet) |
| Raw_Trade | Data | The 2-digit trade data the trade-gap analysis uses |
| Raw_HS4 | Data | The 4-digit trade data the value-addition analysis uses |

## Value addition

For 25 value chains, for example cocoa → chocolate, copper ore → cable, crude oil → fuel, bauxite → aluminium, cotton → clothing and hides → leather & footwear:

- **Processing share** = (semi-processed + processed exports) ÷ all exports in the chain
- **Value lost (estimate)** = raw exports × (multiplier − 1) + semi-processed exports × (multiplier − 1) ÷ 2. The multipliers are **editable assumptions** on the Value_Chains tab.
- **Round-trip imports** = processed goods bought back while the raw material is exported
- **Value-addition score (0–100)** combines 5 weighted criteria: value at stake, raw material base, processing gap, market for processed goods, and readiness
- **Needs**: each chain lists what it requires (energy, industry, logistics, skills, finance, digital, standards). A need is flagged where the country is below the African median on the matching World Bank indicator.

UN Comtrade (2b) downloads the 4-digit data and the World Bank indicators automatically. Menu **2d** refreshes only the World Bank indicators, which are free and need no key.

## Refreshing the data

- **Refresh data**: re-loads from the same source as last time (UN Comtrade, sample or your own) and recomputes.
- **Newer year**: change *Analysis year* on Settings, then run Refresh.
- **Monthly auto-refresh ON / OFF**: refreshes on the 1st of each month at about 3 am.
- **Weights**: changes apply instantly, with no refresh needed.

## Updating the code

1. Go to **Extensions → Apps Script**, replace all the code with the new `Code.gs`, and save.
2. Reload the sheet. A "New code detected" message may appear.
3. Run **Africa Trade → Update workbook after pasting new code**.

This rebuilds every tab's layout, explanations and charts. It keeps your Raw_Trade data, weights, settings, API key, and Countries/Products edits, then recomputes.
Don't use **Reset workbook to defaults** to update: it deletes your data.

## How the score works

For every exporter **A**, importer **B** and product **p** (HS 2-digit), where A exports p to the world and B imports p from the world:

**Untapped gap = min(B's imports of p, A's exports of p) − what A already sells B**

| Criterion | Default weight | Scaled 0–1 by |
|---|---|---|
| Demand | 20 | log of B's world imports of p, min-max |
| Supply capacity | 15 | log of A's world exports of p, min-max |
| Untapped gap | 25 | log of gap, min-max |
| Market access | 15 | same customs union 1.0 · same REC/FTA 0.8 · both AfCFTA 0.6 · other 0.3 |
| Proximity | 10 | distance between capitals (×0.85 if landlocked) |
| Demand growth | 5 | B's import growth for p vs. previous year |
| Competitiveness | 10 | A's revealed comparative advantage (RCA) in p vs. Africa, as RCA/(1+RCA) |

**Composite = weighted average × 100.** It is a live sheet formula, so changing a weight re-ranks everything immediately.

## Limits

- Many African countries report to Comtrade late or not at all. Missing reporters are listed in the data status.
- Informal cross-border trade is not recorded, so real intra-African trade is higher than the figures show.
- HS 2-digit is broad. Treat results as leads to investigate, not conclusions.
- Customs union, REC and AfCFTA memberships are a starting point. Check them and edit them on the Countries tab.
