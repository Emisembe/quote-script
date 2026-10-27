# Enterprise Quality Management & Planning Studio

A single-file, browser-based workspace covering the **Seven Basic QC Tools**, the
**Seven Management and Planning Tools** and a **Project Planning and Documentation** module
(project plan, job descriptions, flowcharts), with three example scenarios, four languages,
JSON save/restore and printable reports.

## Files

| File | Use |
| --- | --- |
| `index.html` | The application. Loads Tailwind CSS and Chart.js from CDNs, so it needs internet on first open. |
| `index.offline.html` | Identical app with Tailwind (compiled) and Chart.js embedded. Runs with no network connection. |
| `build-offline.sh` | Regenerates `index.offline.html` from `index.html` after edits (needs Node.js and npm). |

Open either HTML file directly in Chrome, Edge, Firefox or Safari. No server is needed.

## What is included

**Module 1: Seven Basic QC Tools**
1. Cause-and-Effect (Fishbone) diagram across the 6M categories, with root-cause flagging
2. Check sheet: tally grid per machine/unit and shift, operators per shift, totals and shares
3. Control chart (Individuals): CL/UCL/LCL from moving range or standard deviation; Western Electric rules 1-3 flagged with callouts
4. Histogram: raw or frequency data, normal fit, Cp, Cpk, expected and observed out-of-spec
5. Pareto chart: auto-sorted, cumulative %, adjustable threshold, vital-few highlighting
6. Scatter diagram: Pearson r, R squared, least-squares trendline
7. Stratification viewer: slices check sheet or control chart data by machine, shift or operator

**Module 2: Seven Management and Planning Tools**
1. Affinity diagram (KJ): sticky notes, drag-and-drop grouping, parking lot
2. Interrelationship digraph: click matrix, in/out tallies, key driver and key outcome
3. Tree diagram: goal to objective to strategy to action, rendered as a diagram
4. Matrix diagram (L-shaped): Strong/Moderate/Weak (9/3/1), weighted totals, coverage gaps
5. Prioritization matrix: weighted criteria scoring and automatic ranking
6. PDPC: phases, what-if risks, countermeasures marked feasible or impractical
7. Arrow diagram: CPM or PERT, ES/EF/LS/LF, float, critical path, network and Gantt views, on-time probability

**Module 3: Project Planning and Documentation**
1. Project plan: charter (sponsor, goal, scope, deliverables), tasks with owners, dates, status and progress, milestones, team, and a dated timeline with a Today line. Progress is compared with where the plan should be today. Tasks can be imported from the arrow diagram.
2. Job descriptions: purpose, responsibilities, qualifications, skills and success measures, with a live print preview, completeness check and templates (Quality Manager, Quality Engineer, Project Manager, Process Improvement Specialist).
3. Flowchart: steps, decisions with Yes/No paths, documents, waits and swimlanes per role. The chart is drawn automatically and hand-offs, rework loops and broken paths are highlighted.

**Plain-language guides**: every tool opens with a guide (what it shows, when to use it, how to read it,
what to do next, key terms), every chart has a one-line reading tip, and every result is explained in a
"What this means" box. The printed report repeats the reading tip under each tool.

**Languages**: English, German (Deutsch), French (Francais) and Spanish (Espanol), chosen in the header.
The whole interface, the guides, results, charts and reports switch language; numbers and dates follow
the language too. Your own text and the example data stay as typed. To add a language, add it to
`LANGS`/`LANG_ORDER` and add one column to `I18N_ROWS` in `index.html`.

**Workspace features**: scenario switcher (Manufacturing, SaaS, Healthcare, Blank) with undo,
automatic local save, JSON export/import with validation, and "Generate Report", which compiles
every tool with data into an A4 summary. Print it, or choose "Save as PDF" in the print dialog.

## Printing charts

- **Any single chart or diagram**: every chart and diagram has **PNG** (downloads a high-resolution
  image for slides or email) and **Print** (prints it alone on a landscape A4 page with its key metrics).
- **One tool**: the **Print tool** button at the top of each tool prints that tool's results, charts and tables.
- **Report contents**: in the report preview, the **Contents** menu switches between the full executive
  report, charts and diagrams only, Module 1 only, Module 2 only, or any single tool.

## Adapting it to your situation

Everything is editable; the presets are only starting points.

- Start from **Blank workspace**, or edit a preset and rename it in the project bar (initiative, problem
  statement, owner, focus, period).
- **Fishbone**: choose a category framework (6M manufacturing, 8P service and marketing, 4S service,
  IT and software, healthcare), then rename, add (up to 8) or remove categories.
- **Check sheet**: under "Customize labels", rename what is counted, the unit, the time period and the
  person (for example: Error type, Cluster, Rotation, Engineer). The control chart and stratification
  views use the same labels.
- **Tree diagram**: rename the five levels (for example: Vision, Pillar, Initiative, Project, Step).
- **Matrix diagram**: change the Strong / Moderate / Weak scores (for example 5 / 3 / 1).
- **Save as scenario** stores the current workspace under your own name in the scenario list
  (in this browser). Use **Export JSON** to move it to another computer or share it.
