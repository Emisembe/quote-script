# QC Tools for Google Sheets

Five of the 7 QC tools (Check Sheet, Pareto, Scatter, Histogram, Control Chart) in **one Apps Script file**: [`Code.gs`](Code.gs).
One `setup` run creates the database sheets, the check sheet Google Form, the form trigger and the dashboard.

## Setup (one time, about 2 minutes)

1. Open **your** Google Sheet (a new one or one you already use), then **Extensions → Apps Script**.
2. Delete what is in `Code.gs`, paste the whole of [`Code.gs`](Code.gs), and click **Save**.
3. Choose `setup` in the function dropdown and click **Run**. Approve the permissions.
4. Go back to your Sheet. The QC tabs are added to **this** Sheet and the **QC Tools** menu appears (reload once if you don't see it). Start at the **QC Guide** tab.
   - **Open dashboard** shows all five tools inside the Sheet. No deployment is needed.
   - **Open check sheet form** gives you the link to share with whoever collects data.
   - **Load demo data** adds 5 weeks of the toaster example from the video. **Remove demo data** deletes it again.
5. Optional: to use the dashboard on a phone or share it, go to **Deploy → New deployment → Web app → Deploy** and open the URL.
   "Execute as: Me" with "Who has access: Only myself" (or your organisation) keeps the data private.

What setup does, and doesn't do:
- It never creates a new spreadsheet. If the code isn't attached to a Sheet, it stops and tells you what to do.
- It never changes your own tabs. Every tab it adds starts with `QC`.
- Running it again duplicates nothing. It reuses the tabs, data, form and trigger, and refreshes QC Guide and QC Summary.
- Form answers go straight into **QC Records**, so there is no separate "Form Responses" tab.
- Upgrading from the first version: the old `Records`, `Lists`, `Specs`, `Events` and `How to use` tabs are renamed to their `QC` names. The old "Form Responses" copy is removed after its rows are safely in QC Records.
- A copied Sheet gets its own new form, instead of sending answers to the original Sheet.

## Tabs added to your Sheet

| Tab | What it holds |
|---|---|
| QC Guide | Start here: first steps, daily routine, which tool answers which question and how to read it, PDCA cycle, adding data by hand, menu reference, troubleshooting. Written with your own names from QC Settings. |
| QC Settings | Your names: organisation, form name, form description, thank-you message, form open/closed, dashboard title, menu name, and what "Project / Area / Shift / Recorded by" are called in your business. |
| QC Summary | Live numbers and charts: totals, defects per day, Pareto table with cumulative %, measurement averages. Updates by itself. |
| QC Records | The data. Form entries arrive here automatically. You can also type or paste rows. |
| QC Lists | Projects, areas, shifts, defect types and measurements. These drive the form. |
| QC Specs | LSL, target and USL per measurement. The histogram uses them for Pp/Ppk. |
| QC Events | Process changes (date + label). The control chart starts a new phase with new limits at each one. |

## Renaming everything from QC Settings

1. Type your values in the **Value** column of **QC Settings**. `{org}` is replaced with your organisation name, and a blank cell means "use the default".
2. Click **menu → Apply settings and lists**.

This renames the Google Form (its title and its file name in Drive) and rewords its questions. It also updates the dashboard title and filter labels, the guide, the summary and the menu name (reload the Sheet to see the new menu name).
The form is edited in place, so its link keeps working and earlier answers are kept. Questions for defect types you removed from QC Lists are deleted, and new ones are added.
The QC tab names and the QC Records columns stay fixed, so formulas, links and the data format keep working.

## The database is reusable

Every tool reads one generic table, the **QC Records** tab:

| Date | Project | Area | Shift | Recorded By | Kind | Item | Value |
|---|---|---|---|---|---|---|---|
| 2026-09-01 | Toaster final test | Final test | Day | Operator A | Count | Control PCB | 3 |
| 2026-09-01 | Toaster final test | Final test | Day | Operator A | Measure | Humidity | 21.4 |
| 2026-09-01 | Toaster final test | Final test | Day | Operator A | Inspected | Units inspected | 104 |

- **Count** is a number of defects, complaints or events. The Item is the category.
- **Measure** is any measured number: temperature, weight, wait time, humidity.
- **Inspected** is how many units were checked. When it exists, the control chart switches to a u chart (defects per unit).

The same data powers every tool, and the filters (Project, Area, Shift, dates) point each tool at a different situation.
A new process, department or client only needs a new **Project** name plus its items in the **QC Lists** tab, then **menu → Apply settings and lists**.
You can also paste rows from other systems straight into QC Records.

## What each tool does

| Tool | Answers | Options |
|---|---|---|
| Check Sheet | What happened, when, and who recorded it? Includes the "reduce by X%" target. | Columns by day, area, shift or person |
| Pareto | Which few categories cause most of the problem (80/20)? | Group by defect type, area, shift, project or person |
| Scatter | Does Y move with X? Pearson r, R² and a trend line, paired by day. | Any two series |
| Histogram | Shape and spread against spec limits, with Pp/Ppk. | Any measurement or daily count; bin count |
| Control Chart | Is the process stable, and did the change work? c, u or I-MR chart, phases from Events, rules 1–3. | Any series; chart type |

## Development

The tool logic and `setup` are tested in Node, without Google. `test/gas-mock.js` imitates the Sheets, Forms and trigger services:

```
node --test test/*.test.js
```

`appsscript.json` and `.claspignore` let you push with [clasp](https://github.com/google/clasp) instead of pasting the file.
