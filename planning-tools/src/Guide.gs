/**
 * Guide content. Written to the "Guide" tab and shown in the app's Guide page.
 * Each section: { title, items: [[heading, text], ...] }.
 */
var GUIDE = [
  {
    title: 'Getting started',
    items: [
      ['What this is', 'Seven planning tools in one spreadsheet. They help a team understand a complex problem, decide what to do about it, and plan the fix. This spreadsheet is one project; make a copy for each new project.'],
      ['Open the app', 'Menu bar: Planning Tools → Open planning app. The app shows every tool with charts. Everything you save there is written to the tabs of this spreadsheet.'],
      ['Or work in the tabs', 'Every tool has its own tab and you can type in it directly. Afterwards use Planning Tools → Recalculate all tabs to update the results.'],
      ['Settings', 'The Settings tab holds your project name, time unit, default weight and more. Change the yellow cells in column B.'],
      ['Start fresh', 'Delete a tool tab and run Planning Tools → Set up / repair project tabs. The tab comes back (empty if "Example data in new tabs" is No).']
    ]
  },
  {
    title: 'The usual order',
    items: [
      ['1. Understand the problem', 'Collect ideas with the Brainstorm form, sort them in the Affinity Diagram, then find cause and effect in the Interrelationship Diagram. Use the Matrix Diagram to see how two lists relate.'],
      ['2. Decide', 'Compare possible solutions, vendors or projects in the Prioritization Matrix.'],
      ['3. Plan and deliver', 'Break the chosen solution into tasks with the Tree Diagram, find risks with the PDPC, and schedule the tasks with the Activity Network.'],
      ['Tip', 'You do not need every tool every time. Use the ones that fit the size of the problem.']
    ]
  },
  {
    title: 'Brainstorm form (Google Forms)',
    items: [
      ['Create', 'Planning Tools → Brainstorm form → Create brainstorm form. Type your question, then share the link. People can answer from their phone, as often as they like.'],
      ['Import', 'Planning Tools → Brainstorm form → Import ideas from form (or the button in the app). New answers arrive in the Affinity Diagram as unsorted ideas. Each answer is imported only once.'],
      ['Link again', 'Planning Tools → Brainstorm form → Show form link.']
    ]
  },
  {
    title: '1. Affinity Diagram — sort many ideas into groups',
    items: [
      ['Use it when', 'You have a long, messy list of ideas, complaints or facts and need to see the main themes.'],
      ['Fill in', 'Tab columns: Idea, Category, Source. Write one idea per row. Leave Category empty until the team agrees where it belongs.'],
      ['In the app', 'Each group is a column of cards. Move a card with its drop-down, or drag it on a computer. Add new groups with + Group.'],
      ['Read the result', 'The biggest groups are usually where to focus first.']
    ]
  },
  {
    title: '2. Interrelationship Diagram — find root causes',
    items: [
      ['Use it when', 'Several problems are tangled together and you need to know which ones drive the others.'],
      ['Fill in', 'Give each idea an ID (1, 2, 3…). In "Causes (IDs)" list the ideas this one leads to, e.g. "4, 7". Ask for every pair: does A cause B, or B cause A? Keep only the stronger direction.'],
      ['Read the result', 'Out = arrows going out, In = arrows coming in. The KEY DRIVER has the most arrows out: it is the root cause to fix first. The KEY OUTCOME has the most arrows in: it is the main effect or symptom.']
    ]
  },
  {
    title: '3. Matrix Diagram — how two lists relate',
    items: [
      ['Use it when', 'You want to compare two lists, e.g. customer needs against design features, problems against departments, or tasks against people.'],
      ['Fill in', 'Row names down column A, column names across row 1. In each cell put a symbol: ◎ strong (9), ○ medium (3), △ weak (1), ✕ negative / conflict (−3). You can also type S, M, W or X.'],
      ['Read the result', 'Totals show which rows and columns matter most. ✕ marks trade-offs: improving one thing makes the other worse, so plan for it.']
    ]
  },
  {
    title: '4. Prioritization Matrix — make an objective decision',
    items: [
      ['Use it when', 'You must choose between options: solutions, vendors, designs, projects to work on.'],
      ['Fill in', 'Options down column A, criteria across row 1 (quality, cost, time…). Row 2 is the weight: 100% = normal, 150% = 1.5 times as important, 50% = half. Score each option per criterion. Higher is always better: for cost, give the cheapest option the highest score.'],
      ['Read the result', 'Weighted total = each score × its weight, added up. Highest total wins (highlighted green). If the top two are close, discuss them before deciding.']
    ]
  },
  {
    title: '5. Tree Diagram — break a goal into steps',
    items: [
      ['Use it when', 'A goal is too big to act on and needs to be broken into smaller tasks. Also works as a fault tree: put a failure at the top and its possible causes below.'],
      ['Fill in', 'Each row has an ID, a Parent ID and the item text. The top item has no parent. Example: "Design product" has parent 1 ("Launch new product").'],
      ['Read the result', 'Keep breaking down until every end of the tree is a task someone can do. Level shows how deep an item sits.']
    ]
  },
  {
    title: '6. PDPC (Process Decision Program Chart) — plan for what could go wrong',
    items: [
      ['Use it when', 'A plan has risk: late parts, unavailable people, a test that might fail.'],
      ['Fill in', 'Same ID / Parent ID tree as the Tree Diagram. The app can copy it for you with "Copy from Tree Diagram". For each task, ask: what could go wrong? What have we assumed? What went wrong last time? Write the risks and, in the same order, a countermeasure for each. Separate several with ";".'],
      ['Read the result', 'Risks without a countermeasure are OPEN and shown in red. Close them before the project starts.']
    ]
  },
  {
    title: '7. Activity Network Diagram — schedule and critical path',
    items: [
      ['Use it when', 'You need to know how long a project takes and which tasks must not slip.'],
      ['Fill in', 'One row per task: ID (A, B, C…), description, duration, and predecessors (tasks that must finish first, e.g. "A, C").'],
      ['Read the result', 'The critical path is the longest chain of tasks from start to finish. Its length is the project duration. Critical tasks (red) have zero slack: if one is late, the whole project is late. Slack shows how much any other task can slip.'],
      ['Columns', 'ES / EF = earliest start / finish. LS / LF = latest start / finish without delaying the project. Slack = LS − ES.']
    ]
  },
  {
    title: 'Charts',
    items: [
      ['Download', 'Each diagram in the app has Download PNG (a picture for slides, email or reports) and Download SVG (sharp at any size, for printing).'],
      ['Save to Drive', 'If your browser blocks the download inside the spreadsheet dialog, use Save to Drive. The image goes to a "Planning Tools charts" folder in your Google Drive and a link opens.']
    ]
  },
  {
    title: 'Updating to a new version',
    items: [
      ['1. Replace the code', 'Extensions → Apps Script. Click into the existing code file, select everything (Ctrl+A / Cmd+A), paste the new version over it, and click Save. Replace; do not add a second file.'],
      ['2. Run Update', 'Back in the spreadsheet, reload the page, then Planning Tools → Update after pasting new code.'],
      ['What Update does', 'Adds any new tabs and new settings, refreshes this Guide, and recalculates every tool. Your data, your setting values and your existing tabs are kept. Nothing is duplicated. Running it twice is harmless.'],
      ['Your own notes', 'You can keep notes in a tool tab to the right of the tool’s columns, with one empty column in between. They survive saving and updating.'],
      ['Pasted twice?', 'If the code ended up in two files, a message says so and Update changes nothing until you delete the older file.'],
      ['New permissions', 'A new version may ask for permission again (for example Google Drive for saving charts). That is normal.']
    ]
  },
  {
    title: 'Sharing and using on the phone',
    items: [
      ['Web app', 'Extensions → Apps Script → Deploy → New deployment → Web app. Execute as: Me. Who has access: Only myself, or Anyone with a Google account for your team. Anyone with access can change this project’s data through the app.'],
      ['Another business or project', 'File → Make a copy. The copy has its own data and its own script.']
    ]
  }
];
