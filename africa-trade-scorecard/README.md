# Africa Trade Gap Scorecard

A self-building Google Sheets app that shows what African countries import and export, and ranks where they could trade more with each other. It is a **composite index** (a multi-criteria scorecard) with weights you can edit.

## Set it up (about 2 minutes)

1. Create an empty Google Sheet.
2. Go to **Extensions → Apps Script**, delete the placeholder code and paste in all of [`Code.gs`](Code.gs). Save.
3. Reload the Sheet. A **🌍 Africa Trade** menu appears.
4. Click **🌍 Africa Trade → ▶ Quick start**. Accept the authorisation prompt the first time.

Quick start builds every tab, loads **sample (synthetic) data** and computes the scorecard, so you can see how everything works.

## Use real data

| Option | How |
|---|---|
| **UN Comtrade** (recommended) | Get a free key at [comtradedeveloper.un.org](https://comtradedeveloper.un.org) (Products → subscribe to *comtrade - v1*). Paste it on **Settings → UN Comtrade API key**, then run **2b**. It fetches 54 countries in chunks in the background (about 5–15 min) and recomputes when it finishes. |
| **Your own data** | Run **2c** to clear `Raw_Trade`, then paste rows: `Year · Reporter ISO3 · Partner ISO3 (or WLD for world) · X or M · HS2 · Value USD`. Then run **3**. |

## Tabs

The tabs are colour-coded: 🔵 explanation, 🟢 results, 🟠 your inputs, ⚪ data.

| Tab | Type | What it shows |
|---|---|---|
| Guide | 🔵 | Start here: 4 steps and a map of every tab |
| About | 🔵 | What the tool is, why it exists, the questions it answers, and what it is *not* |
| Dashboard | 🟢 | Africa-wide totals, a table per country, charts of intra-African share and gap by sector |
| Top_Gaps | 🟢 | Ranked opportunities, filtered by exporter, importer and sector |
| Country_View | 🟢 | One country: top exports and imports, African buyers and suppliers, best opportunities |
| Explain_Score | 🟢 | Pick one opportunity and see how each of the 7 criteria contributed to its score, with a bar per criterion |
| Scorecard | 🟢 | The full index: raw inputs, 7 sub-scores (0–1), composite (0–100). Every header has a note |
| Settings | 🟠 | Weights and parameters (yellow cells) |
| Methodology | 🔵 | Every formula, step by step, with a worked example and the known limits |
| Glossary | 🔵 | Plain-English meaning of 35 terms (RCA, HS code, AfCFTA, REC, customs union, SACU, ECOWAS…) |
| Data_Sources | 🔵 | Sample vs Comtrade vs own data, how to get an API key, the Raw_Trade format, other sources |
| FAQ | 🔵 | Common questions and answers |
| Countries / Products | 🟠 | Reference data. Edit memberships, or untick products to exclude them |
| Raw_Trade | ⚪ | The trade data everything is computed from |

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
