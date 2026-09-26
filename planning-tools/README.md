# Planning Tools

All **7 Management & Planning Tools** for Google Sheets, in **one file**: `PlanningTools.gs`.

| # | Tool | What it does |
|---|---|---|
| 1 | Affinity Diagram | Sort many ideas into groups (drag & drop board); collect ideas with a Google Form |
| 2 | Interrelationship Diagram | Cause-and-effect arrows; finds the key driver (root cause) and key outcome |
| 3 | Matrix Diagram | Relate two lists with ◎ ○ △ ✕; totals and trade-offs |
| 4 | Prioritization Matrix | Weighted scoring and ranking of options |
| 5 | Tree Diagram | Break a goal into tasks (or a fault tree) |
| 6 | PDPC | Risks and countermeasures per task; flags open risks |
| 7 | Activity Network | Critical path, ES/EF/LS/LF/slack, network diagram, schedule |

Plus: a **Planning Tools** menu in the menu bar, a **Guide** tab explaining every tool,
a **Settings** tab, and a web app that also works on the phone.

## Install (5 minutes, one file)

1. Open a Google Sheet (a new one becomes your project).
2. **Extensions → Apps Script**.
3. Delete everything in `Code.gs`, paste the whole of **`PlanningTools.gs`**, click **Save**.
4. Reload the spreadsheet. The **Planning Tools** menu appears.
5. **Planning Tools → Set up / repair project tabs**. Google asks for permission once.
6. Read the **Guide** tab, then **Planning Tools → Open planning app**.

### Menu bar

- **Open planning app**: all tools with charts, inside the sheet.
- **Go to tool**: jump to any of the 7 tabs.
- **Brainstorm form**: create a Google Form, import answers, show the link.
- **Recalculate all tabs**: after typing directly in the tabs.
- **Guide**, **Settings**, **Set up / repair project tabs**.
- **Update after pasting new code**.

### Updating to a new version

1. Extensions → Apps Script → select all the old code and paste the new `PlanningTools.gs` **over** it. Save.
2. Reload the spreadsheet → **Planning Tools → Update after pasting new code**.

Update adds new tabs and settings, refreshes the Guide and recalculates the tools. Your data,
setting values, your own tabs, and notes kept to the right of a tool's columns (after an empty
column) are left alone. Running it twice changes nothing. If the code was pasted into a second
file by mistake, you get a warning and nothing is changed.

### Safe with your data

- Rows with a mistake are kept and flagged, never dropped.
- IDs like `1.1` stay text (no automatic dates); text starting with `=`, `+`, `-` stays text.
- Saves are locked so two people saving at once do not overwrite each other half-way.
- A copied spreadsheet does not reuse the original project's brainstorm form.

### Charts

Every diagram has **Download PNG**, **Download SVG** and **Save to Drive** (folder
"Planning Tools charts").

### Settings tab

Colour theme (Light = white, Dark, Automatic; also switchable at the top of the app), project name, company/team, time unit (days, weeks…), default criterion weight, score scale,
brainstorm question, app colour, and whether new tabs start with example data.

### Web app / phone / team

Apps Script editor → **Deploy → New deployment → Web app**. Execute as *Me*; access *Only myself*,
or *Anyone with a Google account* for your team (they can then change this project's data).

### Another business or project

**File → Make a copy** of the spreadsheet. The copy carries the script and has its own data.

## Development

The single file is generated from `src/`. Edit `src/`, then:

```
node build.js             # writes PlanningTools.gs
node tests/run-tests.js   # tests: calculations + the whole file against fake Sheets/Forms
node tests/preview.js     # writes tests/preview.html: the real app running on fake data, open in a browser
```
