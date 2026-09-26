# QC Tools for Google Sheets

Five of the 7 QC tools (Check Sheet, Pareto, Scatter, Histogram, Control Chart) in **one Apps Script file**: [`Code.gs`](Code.gs).
One `setup` run creates the database sheets, the check sheet Google Form, the form trigger and the dashboard.

## Setup (one time, about 2 minutes)

1. Create a blank Google Sheet, then open **Extensions → Apps Script**.
2. Delete what is in `Code.gs`, paste the whole of [`Code.gs`](Code.gs), and click **Save**.
3. Choose `setup` in the function dropdown and click **Run**. Approve the permissions.
4. Reload the Sheet. A **QC Tools** menu appears:
   - **Open dashboard** opens all five tools inside the Sheet. No deployment is needed.
   - **Open check sheet form** gives you the link to share with whoever collects data.
   - **Load demo data** adds 5 weeks of the toaster example from the video. **Remove demo data** deletes it again.
5. Optional: to use the dashboard on a phone or share it, go to **Deploy → New deployment → Web app → Deploy** and open the URL.
   "Execute as: Me" with "Who has access: Only myself" (or your organisation) keeps the data private.

## The database is reusable

Every tool reads one generic table, the **Records** sheet:

| Date | Project | Area | Shift | Recorded By | Kind | Item | Value |
|---|---|---|---|---|---|---|---|
| 2026-09-01 | Toaster final test | Final test | Day | Operator A | Count | Control PCB | 3 |
| 2026-09-01 | Toaster final test | Final test | Day | Operator A | Measure | Humidity | 21.4 |
| 2026-09-01 | Toaster final test | Final test | Day | Operator A | Inspected | Units inspected | 104 |

- **Count** is a number of defects, complaints or events. The Item is the category.
- **Measure** is any measured number: temperature, weight, wait time, humidity.
- **Inspected** is how many units were checked. When it exists, the control chart switches to a u chart (defects per unit).

The same data powers every tool, and the filters (Project, Area, Shift, dates) point each tool at a different situation.
A new process, department or client only needs a new **Project** name plus its items in the **Lists** sheet, then **QC Tools → Rebuild form**.
You can also paste rows from other systems straight into Records.

| Sheet | What it holds |
|---|---|
| Records | The data. Form entries arrive here automatically. |
| Lists | Projects, areas, shifts, defect types and measurements. These drive the form. |
| Specs | LSL, target and USL per measurement. The histogram uses them for Pp/Ppk. |
| Events | Process changes (date + label). The control chart starts a new phase with new limits at each one. |

## What each tool does

| Tool | Answers | Options |
|---|---|---|
| Check Sheet | What happened, when, and who recorded it? Includes the "reduce by X%" target. | Columns by day, area, shift or person |
| Pareto | Which few categories cause most of the problem (80/20)? | Group by defect type, area, shift, project or person |
| Scatter | Does Y move with X? Pearson r, R² and a trend line, paired by day. | Any two series |
| Histogram | Shape and spread against spec limits, with Pp/Ppk. | Any measurement or daily count; bin count |
| Control Chart | Is the process stable, and did the change work? c, u or I-MR chart, phases from Events, rules 1–3. | Any series; chart type |

## Development

The tool logic is made of pure functions that are tested in Node, without Google:

```
node --test test/tools.test.js
```

`appsscript.json` and `.claspignore` let you push with [clasp](https://github.com/google/clasp) instead of pasting the file.
