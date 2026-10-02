# What the user sees

The workbook is used by people who did not build it and may present it to others. Each pattern below exists
because a real user asked "how do I know it changed?", "what am I looking at?" or "how do I explain this?".

## Tab types and colours

Blue tabs explain, green tabs show results, orange tabs are inputs, grey tabs hold data. The Guide lists every
tab with its type and purpose. Typical set: Guide, Health_Check, About, Dashboard, Charts, results tabs with
pickers, Scorecard, Settings, Methodology, Glossary, Data_Sources, Refresh_&_Updates, FAQ, input tabs,
data tabs.

## The blue explanation box on every tab

Driven by `TAB_HELP[key] = { title, what: [...], read: [...], say: [...], watch: [...] }` and written by
`writeBanner_`. Labels: WHAT YOU SEE · HOW TO READ IT · SAY IT LIKE THIS (a sentence the user can say when
presenting) · WATCH OUT. Rows 2.. are grouped so the user can hide the box with −. Because the box height
comes from the text, every layout row is derived from it (see architecture.md).

## Pickers and the NOW SHOWING line

Each yellow dropdown cell has:
- step-by-step notes next to it (`steps_`): "Step 1: choose… Step 2: the green NOW SHOWING line confirms it…";
- a note on the cell itself;
- a green NOW SHOWING line (`nowShowing_`) right below: names what was picked, counts what was found
  ("— 9 value chains · total value lost $26,000,000"), and when nothing is found says exactly why
  ("no data for that year", "exports little of the 25 raw materials", "data not loaded yet: run Refresh",
  "European figures not loaded yet: run menu 2d");
- chart legends whose header cell is a formula containing the selected name (`="Value lost: "&$B$12`), so the
  chart visibly changes too. Chart titles are fixed text, so they say "country chosen above (live)".

## Charts

- Heading inside the chart: `.setOption('title', title).setOption('titleTextStyle', CHART_TITLE_STYLE)`
  for every chart; a short italic "how to read it" line in the cell above.
- Live charts read small formula tables (to the right of the visible area, labelled "Data for chart A…")
  that follow the picker. Static charts are drawn by Compute from tables written by code.
- Use an index (benchmark = 100) when indicators have different units; never put % and a 1–5 score on the
  same raw axis. Give the chart a fallback basis if the benchmark is missing.
- Keep each chart within its reserved rows (default rows are ~21 px; a 330 px chart needs ~16 rows).

## Guide, Glossary, FAQ, Methodology, Data_Sources, Refresh_&_Updates

- Guide: steps to start, tab map, a 5-minute presentation script, the abbreviation table (full names),
  the picker table (where you pick → what confirms the change), the code version.
- Glossary: every term in plain words (median, composite index, RCA, value multiplier, target share…).
- Methodology: every formula step by step with a worked example and the limits.
- FAQ: real questions users asked, including errors they saw ("Exceeded maximum execution time — what now?").
- Refresh_&_Updates: how to refresh, auto-refresh, and update the code safely; what is kept.

## Health_Check and the full audit

A live list (`healthChecks_()`): each row = check name, a formula result, a status formula (OK / CHECK / INFO)
and what to do. Include data source (SAMPLE = CHECK), every reference list filled, weights > 0, shares between
0 and 100%, benchmarks loaded, coordinates are numbers, workbook update status, last computed.
"Run full audit" scans every tab for error values, missing tabs, missing named ranges and missing charts,
and lists each problem with the fix.

## Assumptions the user owns

Put judgements (weights, target market shares, value multipliers) in yellow cells on Settings or input tabs,
labelled ASSUMPTION, and explain in the FAQ why they are there: data shows market size, not what a newcomer
would win; the user can test cautious and ambitious scenarios and show exactly what a figure rests on.

## Writing style inside the workbook

Plain sentences, no emojis, full names for abbreviations, numbers formatted (`#,##0`, `0.0%`), money in USD
with the source and year stated. Lists of organisations carry "not an endorsement; verify before contacting".
