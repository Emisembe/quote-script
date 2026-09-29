# Regional Trade Gap Scorecard (Europe first, any region later)

A self-building Google Sheets app for the countries of one region:

- what they import and export
- where they could trade more with each other
- how much value each country adds (or loses) by processing its raw materials, and what it would need to process more

It is the Africa Trade Gap Scorecard v3.2, made region-configurable. The same single `Code.gs` now contains two regions:

- **Europe** (42 countries): the default for a new workbook
- **Africa** (54 countries): the same data and results as v3.2

More regions can be added as one data block each.

## Set it up (about 2 minutes)

1. Create an empty Google Sheet.
2. Go to **Extensions → Apps Script**, delete the placeholder code and paste in all of [`Code.gs`](Code.gs). Save.
3. Reload the Sheet. A **Europe Trade** menu appears.
4. Click **Europe Trade → Quick start**. Accept the authorisation prompt the first time.

Quick start builds every tab, loads **SAMPLE (synthetic) data** and computes the scorecard. The SAMPLE numbers are not real statistics. For real figures, get a free UN Comtrade key and run **2b** (see the Data_Sources tab).

`appsscript.json` is optional. The `test/` folder is only for checking the code on a computer; you do not paste it into Apps Script.

## Choosing the region

| I want to… | Do this |
|---|---|
| Build a new workbook for Europe | Nothing: Europe is the default (`DEFAULT_REGION = 'EUROPE'` near the top of `Code.gs`). |
| Switch a workbook to another region | Menu **Europe Trade → Switch region**, type `AFRICA` (or another key), then reload the browser tab so the menu gets its new name. |
| See which region a workbook uses | The **Settings** tab, row "Region" (grey, read-only). |

Switching rebuilds every tab for the new countries, agreements and value chains. It deletes the trade and enabler data, because that data belongs to the old countries. It keeps:
- the weights
- the analysis year and the other general settings
- the product ticks
- the UN Comtrade API key

Tip: keep one Google Sheet per region.

Every "Africa / African" wording is now the region's own wording. That covers titles, the blue boxes, the Guide, Methodology, chart titles, the menu name, "European median", and so on. The test suite checks that no Africa wording appears in a Europe workbook.

## What is new compared with the Africa version

- **Region blocks.** Countries, agreements, value chains, indicators, sample-data shape, texts and default picks live in one block per region at the top of `Code.gs`.
- **New tab: Agreements** (orange, editable). One row per trade agreement: its sides and the access tier it gives.
  - Side B empty means everyone on side A trades with everyone else on side A (a bloc, such as the EU).
  - Side B filled means side A trades with side B only (hub-and-spoke, such as EU with Ukraine; Ukraine and Serbia do not get free trade through the EU).
- **Countries tab columns:** ISO3 · UN M49 · UN Comtrade code · Country · sub-region · Capital · lat · lon · Landlocked · Groups.
- **Indicators can point either way.** A region can set its own World Bank indicators, and each can be "higher is better" or "lower is better".
- **Update works on old workbooks.** "Update workbook" also works on a workbook built with the Africa Trade Scorecard v3.x. It stays Africa, keeps its data, weights, API key and membership edits, and moves the old access scores to the new tiers.

## Europe

### Countries (42)
- **EU-27:** Austria, Belgium, Bulgaria, Croatia, Cyprus, Czechia, Denmark, Estonia, Finland, France, Germany, Greece, Hungary, Ireland, Italy, Latvia, Lithuania, Luxembourg, Malta, Netherlands, Poland, Portugal, Romania, Slovakia, Slovenia, Spain, Sweden
- **EFTA (European Free Trade Association):** Iceland, Liechtenstein, Norway, Switzerland
- **United Kingdom**
- **Western Balkans:** Albania, Bosnia and Herzegovina, Kosovo, Montenegro, North Macedonia, Serbia
- **Eastern neighbours & Türkiye:** Ukraine, Moldova, Belarus, Türkiye

Sub-regions (policy groups, editable): EU North, EU West, EU South, EU Central & East, EFTA & UK, Western Balkans, Eastern neighbours & Türkiye.

### Market-access tiers (scores editable on Settings)

| Tier | Default | Example |
|---|---|---|
| EU single market | 1.0 | Germany → France |
| EEA (European Economic Area) / EFTA, including the EU–Switzerland agreements | 0.9 | Norway → Germany, Switzerland → Italy |
| EU–Türkiye customs union | 0.8 | Türkiye → Germany |
| Free trade agreement | 0.6 | EU–UK TCA, DCFTAs with Ukraine and Moldova, SAAs with the Western Balkans, CEFTA, EFTA / UK / Türkiye FTAs |
| Other | 0.3 | Belarus → Poland (EU sanctions; consider a lower score) |

Abbreviations: TCA = Trade and Cooperation Agreement; DCFTA = Deep and Comprehensive Free Trade Area; SAA = Stabilisation and Association Agreement; CEFTA = Central European Free Trade Agreement; FTA = free trade agreement.

### Value chains (25). The multipliers are ASSUMPTIONS: replace them with study values.

| Chain | Raw HS4 | Semi-processed HS4 | Processed HS4 | Multiplier |
|---|---|---|---|---|
| Iron ore & scrap → iron & steel | 2601, 7204 | 7201, 7203, 7206, 7207 | 7208, 7209, 7210, 7213, 7214, 7216, 7306, 7308 | 2.0 |
| Bauxite, alumina & scrap → aluminium | 2606, 7602 | 2818, 7601 | 7604, 7606, 7607, 7610, 7616 | 3.0 |
| Copper ore & scrap → wire & cable | 2603, 7404 | 7402, 7403 | 7408, 7409, 7411, 8544 | 1.3 |
| Nickel ore → ferro-nickel & stainless steel | 2604 | 7202, 7502 | 7219, 7220, 7222 | 2.0 |
| Zinc & lead ores → refined metal & products | 2607, 2608 | 7801, 7901 | 7804, 7905, 7907 | 1.8 |
| Lithium & rare earths → battery materials & magnets | 2530 | 2805, 2825, 2836, 2846 | 8505, 8507 | 3.0 |
| Crude oil → refined fuels | 2709 | – | 2710 | 1.3 |
| Natural gas → ammonia & fertiliser | 2711 | 2814 | 3102, 3105 | 1.6 |
| Basic petrochemicals → polymers → plastic products | 2901, 2902 | 3901–3904 | 3917, 3920, 3923, 3926 | 2.0 |
| Silica sand & quartz → glass & glass fibre | 2505, 2506 | 2804, 7001 | 7005, 7007, 7010, 7019 | 3.0 |
| Limestone & clay → cement & ceramics | 2507, 2508, 2521 | 2523 | 6810, 6907, 6910 | 2.5 |
| Marble & granite blocks → worked stone | 2515, 2516 | – | 6802 | 3.0 |
| Logs → sawn wood, panels & furniture | 4403 | 4407, 4408, 4410, 4411, 4412 | 4418, 9403 | 2.5 |
| Wood chips & recovered paper → pulp, paper & packaging | 4401, 4707 | 4703, 4704, 4705 | 4802, 4804, 4810, 4818, 4819 | 2.0 |
| Wheat → flour, pasta & bakery | 1001 | 1101, 1103 | 1902, 1905 | 1.6 |
| Barley & hops → malt & beer | 1003, 1210 | 1107 | 2203 | 3.0 |
| Oilseeds (sunflower, rapeseed) → vegetable oils | 1205, 1206 | – | 1512, 1514, 1517 | 1.6 |
| Milk → cheese & dairy products | 0401 | 0402, 0405 | 0403, 0406, 1901 | 2.5 |
| Live animals → meat & meat products | 0102, 0103, 0104 | 0201–0204 | 1601, 1602 | 1.8 |
| Whole fish → fillets, smoked & canned fish | 0302, 0303 | 0304 | 0305, 1604 | 1.7 |
| Grapes → wine | 0806 | – | 2204 | 3.0 |
| Fruit & vegetables → juices, preserves, frozen fries & tomato paste | 0701, 0702, 0805, 0808, 0809 | 1105 | 2002, 2004, 2007, 2008, 2009 | 2.0 |
| Raw hides & skins → leather & footwear | 4101–4103 | 4104–4107 | 4202, 4203, 6403, 6405 | 3.0 |
| Wool, cotton & flax → yarn, fabric & clothing | 5101, 5201, 5301 | 5105, 5112, 5205, 5208, 5209, 5306, 5309 | 6104, 6109, 6110, 6203, 6204, 6302 | 3.0 |
| Tobacco leaf → cigarettes | 2401 | – | 2402 | 2.5 |

### Readiness indicators for Europe (World Bank)

Electricity access is close to 100% everywhere in Europe, so for Europe it is replaced by energy intensity, where lower is better. Tertiary education replaces secondary school, and R&D (research and development) spending is added.

The other indicators are unchanged: manufacturing, manufactured exports, LPI (Logistics Performance Index), private credit and internet use.

## Please verify (I could not check these from here)

The session had no internet access to UN Comtrade or the World Bank, so the codes below come from my own knowledge.

1. **UN Comtrade codes that differ from UN M49:** France 251, Norway 579, Switzerland 757 (includes Liechtenstein). Liechtenstein and Kosovo have no Comtrade code, so the fetch skips them and lists them in the data status. Kosovo's trade still shows up through its partners' reports. Check against comtradeapi.un.org/files/v1/app/reference/Reporters.json.
2. **Kosovo uses `XKX`.** This is the World Bank and EU code, not an official ISO code. It has no UN M49 code.
3. **Agreement details marked "verify" on the Agreements tab:**
   - EFTA–Moldova FTA (recent)
   - UK agreements with Bosnia and Herzegovina and Montenegro (not listed)
   - Türkiye–Ukraine FTA (signed 2022; treated as not in force)
   - Ukraine–Moldova and Ukraine–Montenegro / North Macedonia FTAs
   - the CIS FTA (Commonwealth of Independent States Free Trade Area), which Moldova is leaving
   - the new EU–Switzerland package
4. **World Bank series:** `EG.EGY.PRIM.PP.KD` (energy intensity) and `GB.XPD.RSDV.GD.ZS` (R&D). Check the "Data years" column after menu 2d; some series lag several years.
5. **Capitals and coordinates** are to two decimal places and are only used for distances.
6. **Sample-data shape** (country size, specialisation, who produces and processes each chain) is a rough guess, used only to make the SAMPLE data look plausible. It is never shown as a statistic.

## Adding a region (ASEAN, Latin America & Caribbean, the Gulf/GCC, South Asia, Central Asia…)

1. In `Code.gs`, copy the whole `EUROPE: { … },` block inside `REGIONS` and give it a new key, for example `ASEAN: { … },`.
2. Replace its contents:
   - name and wording
   - countries (ISO3, UN M49, UN Comtrade code, capital, coordinates, landlocked, groups)
   - access tiers and agreements
   - about 25 value chains with HS4 codes and assumed multipliers
   - optional World Bank indicators
   - sample shape, default picks, and the short texts
   The comment above `REGIONS` explains every field.
3. Run `node region-trade-scorecard/test/run.js` on a computer. The first section checks every region block: unique codes, valid HS4 codes, agreements that point to real countries or groups, sample lists that use listed countries, and default picks that exist.
4. Paste the code into the sheet, then **Switch region** and type the new key.

No other code needs to change.

## How it was tested

`node --check` passes. The suite `test/run.js` runs **1,910 checks, all passing**:

```
node region-trade-scorecard/test/run.js path/to/africa-trade-scorecard/Code.gs
```

The optional path is the old Africa v3.2 `Code.gs`. It enables the comparison and upgrade tests.

**The mock** (`test/mock.js`) stands in for SpreadsheetApp, PropertiesService, ScriptApp, UrlFetchApp, Utilities, Session and Charts. Every object allows only methods that exist in the real Apps Script API, so a call to an invented method fails the test. The list of methods actually used is printed at the end of the run.

**Every menu flow was run:**
- Quick start
- Compute
- Refresh (SAMPLE, COMTRADE and own-data sources)
- Monthly auto-refresh ON / OFF, and the trigger handler run without a user interface
- Update workbook
- Clear data
- UN Comtrade fetch with fake API responses, resuming in background chunks (took 10 runs)
- Stop fetch, and a rejected API key
- World Bank fetch with fake responses
- Full audit
- Reset
- Switch region: Europe → Africa → Europe, and an unknown region name is refused

**Europe checks:**
- all five access tiers occur
- spot checks: Germany → France = EU single market, Norway → Germany = EEA / EFTA, Türkiye → Germany = EU–Türkiye customs union, UK → France = FTA, Belarus → Poland = Other
- France, Norway and Switzerland are fetched with their Comtrade codes
- no Africa wording anywhere
- no emojis
- no unfilled placeholders
- every abbreviation used appears in the abbreviations list

**Africa checks:**
- On the same sample data, the new code gives Scorecard and VA_Scorecard values identical to v3.2.
- Only some Market access labels differ, and only in wording or order (for example "REC: COMESA/AMU" instead of "REC: AMU/COMESA").

**Update from an older version:**
- An Africa v3.2 workbook, updated with the new code, stays Africa.
- It keeps Raw_Trade, Raw_HS4, Enablers, the API key, edited weights and an edited membership.
- Its old access scores move to the new tiers, and the capital names are added.

**Formulas:**
- every formula has balanced brackets and quotes
- it refers only to existing tabs and named ranges
- it uses only real Google Sheets functions

### What only a real Google Sheet can confirm
- **Formula results.** The mock does not calculate formulas, so NOW SHOWING lines, Health_Check results, Top_Gaps, Explain_Score and the live charts need to be looked at in the sheet.
- **Real UN Comtrade and World Bank responses,** including the Comtrade codes above and the API rate limits.
- **Appearance:** the look of charts, column widths, and the − / + grouping of the blue boxes.
- **Authorisation prompts and time-driven triggers** actually firing.
- **Simple-trigger behaviour.** The menu name is read from document properties when the sheet opens. If that is blocked, the menu falls back to the default region's name until you run any menu item.
