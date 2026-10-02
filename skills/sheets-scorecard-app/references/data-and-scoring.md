# Data sources and scoring

## Contents
1. UN Comtrade (trade flows)
2. World Bank WDI (country indicators)
3. Sample data
4. Trade-gap composite index
5. Value addition
6. Market for finished products
7. What is Africa-specific in the example

## 1. UN Comtrade API v1

- Endpoint: `https://comtradeapi.un.org/data/v1/get/C/A/HS?<query>`, header `Ocp-Apim-Subscription-Key: <key>`.
  Free key: comtradedeveloper.un.org → Products → subscribe to "comtrade - v1" → copy the primary key into
  Settings. The free plan limits calls per day; keep requests large and few.
- Query used per reporter: `reporterCode` (UN M49 numeric code; EU = 97), `period=YEAR,YEAR-1`,
  `partnerCode=0,<partner M49 list>` (0 = world), `partner2Code=0`, `flowCode=M,X`, `cmdCode=AG2` (all
  2-digit chapters) or an explicit HS4 list, `customsCode=C00`, `motCode=0`, `maxRecords=100000`,
  `includeDesc=false`. Filter the answer again on those totals codes; keep `primaryValue > 0`.
- `comtradeGet_` retries 4 times with growing pauses; a 401/403 means the key was rejected (stop).
  Pause ~1.2 s between calls.
- One country per step, cursor in DocumentProperties, ~4-minute run budget, continuation trigger in 1 minute,
  safety-net trigger in 8 minutes. A failing country is recorded ("AGO (error: …)") and skipped; three
  failures in a row or a rejected key stop the fetch and keep what was loaded. When the cursor reaches the
  end: write the status listing countries that did not report, fetch the World Bank indicators, compute.
- Many African countries report late or not at all; partner (mirror) data from importers fills some gaps.
  Say this in the Methodology and Data_Sources tabs.

## 2. World Bank WDI

- `https://api.worldbank.org/v2/country/{ISO3;ISO3;…}/indicator/{ID}?format=json&mrnev=1&per_page=1000`
  (free, no key; `mrnev=1` = latest non-empty value per country). One call per indicator for all countries.
- The answer is `[meta, rows]`. If `rows` is missing or empty, or `meta.message` is set, throw a clear error
  and keep the existing data. Do not load blanks as if they were real.
- Indicators used: electricity access (EG.ELC.ACCS.ZS), manufacturing % of GDP (NV.IND.MANF.ZS), manufactured
  exports % (TX.VAL.MANF.ZS.UN), Logistics Performance Index (LP.LPI.OVRL.XQ), secondary enrolment
  (SE.SEC.ENRR), private credit % of GDP (FS.AST.PRVT.GD.ZS), internet use (IT.NET.USER.ZS). For labour:
  SL.TLF.TOTL.IN (labour force), SL.UEM.TOTL.ZS (unemployment), SL.UEM.1524.ZS (youth unemployment); higher
  unemployment means more workers available, so do not flag it as a gap.
- A benchmark group (the 27 EU countries) is fetched in the same calls and stored to the right of the main
  table, so its median never mixes into the main group's median.

## 3. Sample data

Seeded random generators (`mulberry32_`) with a realistic shape: bigger economies trade more, neighbours
trade more, producers of a raw material export it. Label every sample value SAMPLE (status params, Health_Check
= CHECK, Data_Sources). Sample benchmark values use a separate seed so adding them does not change the others.

## 4. Trade-gap composite index

For exporter A, importer B, product p (A exports p to the world, B imports p from the world):
`untapped gap = min(B's world imports of p, A's world exports of p) − current A→B trade`.

| Criterion | Default weight | Scaling 0–1 |
|---|---|---|
| Demand | 20 | log10(1+x), min-max |
| Supply capacity | 15 | log10(1+x), min-max |
| Untapped gap | 25 | log10(1+x), min-max |
| Market access | 15 | customs union 1.0 · same regional bloc 0.8 · both in AfCFTA 0.6 · other 0.3 (Settings) |
| Proximity | 10 | 1 − (distance − min)/(max − min), great-circle between capitals; × 0.85 if landlocked; 0.5 if coordinates missing |
| Demand growth | 5 | importer growth vs previous year, clamped −50%…+100%, then scaled |
| Competitiveness | 10 | RCA vs the region as reference; RCA/(1+RCA) |

Composite = weighted average × 100, a live sheet formula. Keep the top `P_MAX_ROWS` by gap (20,000 default).

## 5. Value addition

Per country and value chain (raw → semi-processed → processed HS4 codes, editable on Value_Chains):
- processing share = (semi + processed exports) ÷ all exports in the chain;
- value lost (estimate) = raw × (multiplier − 1) + semi × (multiplier − 1) ÷ 2 (multipliers are assumptions);
- round-trip imports = processed goods bought back while the raw material is exported;
- score (0–100), 5 weighted criteria: value at stake 30, raw base 20, processing gap 15, market for processed
  goods 15, readiness 20 (enablers the chain needs vs the group median);
- needs flagged where the country is below the median on an indicator the chain needs.

## 6. Market for finished products

`estimated revenue = home imports × P_SH_HOME + region's imports from outside the region × P_SH_AF + outside
markets' imports × P_SH_EXT` (defaults 25%, 10%, 1%, live formula). Trade values show what buyers pay, not
profit; each country's estimate assumes it alone wins those shares, so totals across countries are not added.

## 7. What is Africa-specific in the example

Swap these for a new region: `COUNTRIES` (ISO3, M49, name, region, capital lat/lon, landlocked, customs unions,
regional blocs, AfCFTA flag), access tiers and their labels, `MARKETS` (outside markets and their M49 codes),
benchmark group (EU27), value chains relevant to the region, equipment and suppliers lists, sample-data size
tables, all help texts that say "Africa"/"African median". Everything else (menu, build, update, banners,
pickers, Health_Check, tests) carries over unchanged.
