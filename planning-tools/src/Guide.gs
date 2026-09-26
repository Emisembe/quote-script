/**
 * Guide content. Written to the "Guide" tab and shown in the app's Guide page.
 * Each section: { title, items: [[heading, text], ...] }.
 * Written for someone who has never used these tools: short sentences, no jargon without explanation.
 */
var GUIDE = [
  {
    title: 'Welcome — read this first',
    items: [
      ['What this is', 'A toolbox of seven planning tools that teams use to solve problems and deliver improvements. You do not need any training to use it. This guide explains every button and every column.'],
      ['Who it is for', 'Anyone: team leaders, engineers, office staff, small business owners, students. It works for factories, offices, shops, hospitals, schools and personal projects.'],
      ['One sheet = one project', 'This spreadsheet holds one project (for example "Reduce late deliveries"). For a new project, make a copy: File → Make a copy. Each copy has its own data.'],
      ['Two ways to work', 'A) The app: Planning Tools menu → Open planning app. Easiest, with charts and buttons. B) The tabs at the bottom of the spreadsheet: type directly into the cells. Both show the same data. What you save in the app appears in the tabs, and what you type in the tabs appears in the app.'],
      ['Nothing is lost', 'Your data is stored in this spreadsheet in your own Google Drive. Google keeps a version history (File → Version history) if you ever need to go back.']
    ]
  },
  {
    title: 'Contents',
    items: [
      ['Getting started', 'First-time setup, the menu, the app, the Settings tab.'],
      ['The seven tools', '1 Affinity Diagram · 2 Interrelationship Diagram · 3 Matrix Diagram · 4 Prioritization Matrix · 5 Tree Diagram · 6 PDPC · 7 Activity Network Diagram.'],
      ['Before you start', 'Rules for the tabs · Colours at a glance · Running a session with your team.'],
      ['More', 'A complete example · Brainstorm form · Charts and downloads · Updating to a new version · Sharing · Frequently asked questions · Troubleshooting · Glossary.']
    ]
  },
  {
    title: 'Getting started — first time (5 minutes)',
    items: [
      ['Step 1', 'Look at the top of the spreadsheet for the menu called "Planning Tools" (next to Help). If you do not see it, reload the page and wait a few seconds.'],
      ['Step 2', 'Click Planning Tools → Set up / repair project tabs. The first time, Google asks for permission. Click Continue, choose your Google account, click "Advanced", then "Go to … (unsafe)", then "Allow". This warning appears because the script is your own and not published by a company. It only works inside your spreadsheet.'],
      ['Step 3', 'Run Planning Tools → Set up / repair project tabs once more. Nine tabs appear: Guide, Settings and one tab per tool, filled with example data so you can see how everything works.'],
      ['Step 4', 'Click Planning Tools → Open planning app. Try each tool with the example data. Then replace the examples with your own information.'],
      ['Start empty instead', 'If you prefer no example data: in the Settings tab set "Example data in new tabs" to No, delete the tool tabs, and run Set up / repair project tabs again.']
    ]
  },
  {
    title: 'The Planning Tools menu',
    items: [
      ['Open planning app', 'Opens the app in a window over the spreadsheet. All seven tools, with charts, in one place.'],
      ['Go to tool', 'Jumps to a tool\'s tab in the spreadsheet.'],
      ['Brainstorm form', 'Create a Google Form so people can send ideas from their phone, import the answers, or show the form link again.'],
      ['Recalculate all tabs', 'Use this after typing directly in the tabs. It updates every result (totals, ranks, critical path…) and colours.'],
      ['Guide / Settings', 'Opens this guide or the Settings tab.'],
      ['Set up / repair project tabs', 'Creates any tab that is missing. It never changes or deletes tabs that already exist.'],
      ['Update after pasting new code', 'Only needed when you install a newer version of Planning Tools. See "Updating to a new version".']
    ]
  },
  {
    title: 'Using the app',
    items: [
      ['Tabs along the top', 'Guide and the seven tools, numbered in the order you would normally use them.'],
      ['Light / Dark / Auto', 'The switch at the top right changes how the app looks. Light = white background. Dark = dark background. Auto = follows your phone or computer. Your choice is saved in the Settings tab.'],
      ['Editing', 'Click into any box and type. Use "+" buttons to add rows, and × to remove a row.'],
      ['Saving', 'Nothing is stored until you click the blue button (Save, Analyze & save, Score & save…). The results and charts update, and the matching tab in the spreadsheet is updated too.'],
      ['Messages', 'If something is missing or wrong, a yellow box lists what to fix, for example "Task B depends on Z, which does not exist". Your typing is still saved; only the results wait until it is fixed.']
    ]
  },
  {
    title: 'The Settings tab',
    items: [
      ['How to change a setting', 'Open the Settings tab and change the yellow cells in column B. Some cells have a small arrow: click it and pick from the list. The app uses the new value the next time it opens.'],
      ['Colour theme', 'Light (white background), Dark, or Automatic (follows your device). You can also change it with the switch at the top of the app.'],
      ['Project name / Company', 'Shown at the top of the app, on downloaded charts and on the brainstorm form.'],
      ['Time unit', 'The unit for task durations in the Activity Network: days, weeks, hours… Just type the word.'],
      ['Default criterion weight', 'The weight a new criterion gets in the Prioritization Matrix. 100 means normal importance.'],
      ['Score scale', 'A reminder of the scoring scale your team agreed on, e.g. "1–5 (higher is better)".'],
      ['Brainstorm question', 'The question used when you create a brainstorm form.'],
      ['App colour', 'The main colour of buttons and highlights, written as a colour code like #2f6fdb. Search "color picker" on Google to find codes.'],
      ['Example data in new tabs', 'Yes = new tool tabs start with an example. No = they start empty.']
    ]
  },
  {
    title: 'Rules for the tabs — keep your data safe',
    items: [
      ['Do not rename the tool tabs', 'The tool finds its data by the tab name (e.g. "Activity Network"). If you rename a tab, the tool no longer sees it and creates a new, empty one. Rename it back to fix this.'],
      ['Do not change row 1', 'Row 1 of each tool tab holds the column titles. Leave them as they are. Type your data from row 2 downwards.'],
      ['Do not insert columns inside a tool', 'Add your own columns only to the RIGHT of the tool\'s columns, with one empty column in between. Everything there is kept.'],
      ['Formulas become values', 'If you type a formula in a tool column, the tool keeps its result, not the formula, the next time it saves. Keep formulas in your own columns on the right.'],
      ['Rows with a mistake are kept', 'If a row has a problem (for example two tasks with the same ID), the tool keeps the row, shows a yellow "Please check" message, and waits for you to fix it. Nothing is deleted.'],
      ['Result columns', 'Columns such as Out, In, Role, Level, ES, EF, Slack, Weighted Total and Rank are filled in by the tool. Anything you type there is replaced on the next save.'],
      ['IDs are text', 'IDs such as 1.1 or A2 are stored as text, so the spreadsheet will not turn them into dates or numbers.']
    ]
  },
  {
    title: 'Colours at a glance',
    items: [
      ['Blue', 'Buttons and normal bars. The colour can be changed in Settings → App colour.'],
      ['Green', 'The best option (Prioritization Matrix) or a countermeasure (PDPC).'],
      ['Red', 'Needs attention: critical tasks (Activity Network), open risks (PDPC), conflicts ✕ (Matrix).'],
      ['Orange', 'Key driver — the root cause (Interrelationship Diagram). Also risks in the PDPC.'],
      ['Pink', 'Key outcome — the main effect (Interrelationship Diagram).'],
      ['Light grey bar', 'Slack: how much a task may slip (Activity Network schedule).'],
      ['Yellow box', 'A message listing what to check or fix.']
    ]
  },
  {
    title: 'Running a session with your team',
    items: [
      ['Before', 'Write the problem or goal in one sentence everyone agrees with, e.g. "Orders ship late more than twice a week." Invite the people who do the work, not only managers. Book 60–90 minutes.'],
      ['Share the screen', 'Open the app on a projector or shared screen so everyone sees the same thing. One person types; everyone else talks.'],
      ['Collect first, judge later', 'During brainstorming no idea is criticised. Quantity first. The brainstorm form lets quiet people contribute too.'],
      ['Timebox', 'Give each step a time limit, e.g. 10 minutes of ideas, 15 minutes of sorting. Move on when time is up.'],
      ['Agree before scoring', 'Agree criteria and weights (Prioritization Matrix) before anyone scores, so the result is fair.'],
      ['End with actions', 'Finish every session with who does what by when. The Tree Diagram and Activity Network are good places to record it.'],
      ['Share the result', 'Download the charts (PNG) and send them with a short summary, or share the spreadsheet.']
    ]
  },
  {
    title: 'Which tool should I use?',
    items: [
      ['"We have lots of ideas and it is messy"', '1 Affinity Diagram — groups ideas into themes.'],
      ['"Many problems are connected; what is the real cause?"', '2 Interrelationship Diagram — finds the root cause.'],
      ['"How do these two lists affect each other?"', '3 Matrix Diagram — e.g. customer wishes versus product features.'],
      ['"Which option should we choose?"', '4 Prioritization Matrix — scores options fairly.'],
      ['"This goal is too big; what exactly must we do?"', '5 Tree Diagram — breaks it into tasks.'],
      ['"What could go wrong with our plan?"', '6 PDPC — lists risks and backup plans.'],
      ['"How long will it take and what must not be late?"', '7 Activity Network — schedule and critical path.'],
      ['The usual order', 'Understand the problem (1, 2, 3) → decide (4) → plan and deliver (5, 6, 7). Small problems may need only one or two tools.']
    ]
  },
  {
    title: '1. Affinity Diagram — sort many ideas into groups',
    items: [
      ['What it is', 'A board of sticky notes. Each note is one idea. You move notes that belong together into the same group, then name each group. The groups show the main themes hidden in a long list.'],
      ['When to use it', 'After a brainstorm, a customer survey, a list of complaints, or any time you have more than about 15 ideas and cannot see the big picture.'],
      ['Step 1 — collect ideas', 'Type each idea in the box "Type an idea and press Enter", or collect them from your team with the brainstorm form (see "Brainstorm form"). One idea per note. Short and specific: "Forklifts block the aisle" is better than "Layout".'],
      ['Step 2 — sort', 'New ideas land in "Unsorted". Move each note to a group with its drop-down menu (or drag it on a computer). Create a new group by typing a name in "New group name" and clicking + Group.'],
      ['Step 3 — name the groups', 'Give each group a clear name that describes what the notes have in common, e.g. Maintenance, Training, Layout.'],
      ['Step 4 — save', 'Click Save. The Affinity Diagram tab now lists every idea with its group.'],
      ['Reading the result', 'The chart "Biggest groups" shows how many ideas each group has. Big groups usually deserve attention first. "Still unsorted" tells you how many notes still need a group.'],
      ['Example', 'Problem: "We keep missing production targets." 11 ideas were collected and sorted into Maintenance (3), Training (2), Quality (2), Layout (2), Equipment (1). Maintenance is the biggest theme.'],
      ['In the tab', 'Columns: Idea, Category (the group), Source (who or where it came from). Leave Category empty for unsorted ideas.'],
      ['Common mistakes', 'Putting two ideas on one note. Creating a group for every single note. Arguing for too long: if a note fits two groups, pick one and move on.']
    ]
  },
  {
    title: '2. Interrelationship Diagram — find the root cause',
    items: [
      ['What it is', 'A picture of cause and effect. Each idea is a circle. An arrow from A to B means "A causes (or makes worse) B". Counting arrows shows which problems drive the others.'],
      ['When to use it', 'When several problems are tangled together and fixing symptoms has not worked.'],
      ['Step 1 — list the ideas', 'Add 5 to 10 ideas, each with an ID (1, 2, 3…). Tip: the button "Copy ideas from Affinity" brings in ideas you already collected.'],
      ['Step 2 — ask about every pair', 'Take two ideas, say 1 and 2, and ask: "Does 1 cause 2, or does 2 cause 1, or neither?" If 1 causes 2, write 2 in the "Causes (IDs)" box of idea 1. Several are allowed: "4, 7".'],
      ['Only one direction', 'If both seem true, keep only the stronger direction. The app warns you if two ideas point at each other.'],
      ['Step 3 — analyze', 'Click Analyze & save. The table shows Out (arrows leaving) and In (arrows arriving) and a Role for each idea.'],
      ['Reading the result', 'KEY DRIVER (orange) = most arrows out. This is the likely root cause: fixing it improves many other things. KEY OUTCOME (pink) = most arrows in. This is the main symptom or result — usually what the customer or the boss sees. Driver / Outcome = more arrows out than in, or the opposite. Link = equal in and out.'],
      ['Example', '"No standard work instructions" causes preventive maintenance to be skipped, scrap, and operator mistakes (3 arrows out) → key driver. "Production targets missed" receives 3 arrows → key outcome. So: write the work instructions first.'],
      ['In the tab', 'Columns: ID, Idea, Causes (IDs). Out, In and Role are filled in automatically.'],
      ['Common mistakes', 'Drawing arrows in both directions. Using vague ideas ("communication") that cause everything. Too many ideas at once — start with the 10 most important.']
    ]
  },
  {
    title: '3. Matrix Diagram — how two lists relate',
    items: [
      ['What it is', 'A grid. One list goes down the left side (rows), another across the top (columns). In each box you mark how strongly the row and the column are connected.'],
      ['When to use it', 'Comparing any two lists: customer wishes vs. product features, problems vs. departments, tasks vs. people, skills vs. team members, risks vs. controls.'],
      ['The symbols', '◎ Strong relationship (counts 9). ○ Medium (counts 3). △ Weak (counts 1). ✕ Negative or conflict (counts −3): improving one makes the other worse. Leave the box empty when there is no relationship. In the tab you may also type S, M, W or X.'],
      ['Step 1', 'Click + Row for each item of your first list and + Column for each item of the second list. Type their names.'],
      ['Step 2', 'For each box, pick a symbol from the small menu. Ask: "If we change this column, how much does it affect this row?"'],
      ['Step 3', 'Click Total & save.'],
      ['Reading the result', 'Row and column totals show what matters most — high totals deserve attention. Red boxes (✕) are trade-offs: the app lists them so you can plan for them instead of being surprised.'],
      ['Example', 'Customer wishes (Easy to carry, Long battery life, Low price, Durable) vs. design features (Weight, Battery capacity, Housing material, Part count). A bigger battery helps battery life (◎) but makes the product heavier and more expensive (✕).'],
      ['Common mistakes', 'Marking every box — most boxes should be empty. Mixing up rows and columns halfway through.']
    ]
  },
  {
    title: '4. Prioritization Matrix — make a fair decision',
    items: [
      ['What it is', 'A scoring table. Options are compared on several criteria, each criterion has a weight, and the option with the highest weighted score wins. It turns opinions into a transparent decision.'],
      ['When to use it', 'Choosing a supplier, a solution, a design, a project to start, a candidate, a location — any choice with more than one thing to consider.'],
      ['Step 1 — options', 'Click + Option for each choice you are considering and type its name (e.g. Vendor A, Vendor B).'],
      ['Step 2 — criteria', 'Click + Criterion for each thing that matters (e.g. Quality, Cost, Delivery time, Service).'],
      ['Step 3 — weights', 'In the "Weight (%)" row give each criterion a weight. 100 = normal importance. 150 = one and a half times as important. 50 = half as important. Agree the weights BEFORE scoring, so nobody adjusts them to favour an option.'],
      ['Step 4 — scores', 'Score every option on every criterion using the same scale (e.g. 1 to 5). HIGHER IS ALWAYS BETTER. For cost, the cheapest option gets the highest score. For delivery time, the fastest option gets the highest score.'],
      ['Step 5', 'Click Score & save.'],
      ['How the total is calculated', 'For each criterion: score × weight ÷ 100. Add these up. Example: Quality score 4 with weight 150 → 6. Cost score 2 with weight 100 → 2. Service score 3 with weight 80 → 2.4. Total = 10.4.'],
      ['Reading the result', 'Rank 1 (green) is the best option. The bar chart shows how close the options are. If the top two are very close, discuss them before deciding — small scoring differences can change the order.'],
      ['Common mistakes', 'Giving cost a high score for the most expensive option (remember: higher is better). Changing weights after seeing the result. Too many criteria — 3 to 6 is usually enough.']
    ]
  },
  {
    title: '5. Tree Diagram — break a goal into tasks',
    items: [
      ['What it is', 'A diagram that starts with one goal on the left and splits it into smaller and smaller parts to the right, until each end is a concrete task someone can do.'],
      ['When to use it', 'When a goal feels too big ("Launch a new product") and you need to know exactly what to do. It can also be used as a fault tree: put a failure at the top and its possible causes below it.'],
      ['How IDs and parents work', 'Every item has an ID (1, 2, 3…). Every item except the goal names its Parent ID — the item it belongs to. The goal has an empty parent.'],
      ['Step 1', 'Write your goal as item 1 with no parent.'],
      ['Step 2', 'Ask "What do we need to achieve this?" Add each answer with Parent ID 1.'],
      ['Step 3', 'Repeat for each new item: "What do we need to achieve this?" Keep going until each end is a task a person can start this week.'],
      ['Step 4', 'Click Draw & save. The tree appears, and the tab shows the Level of each item (1 = the goal).'],
      ['Example', 'Goal 1 "Launch new product" → 2 "Design product", 3 "Set up production", 4 "Marketing". Then 2 → 5 "Define requirements", 6 "Build prototype". And so on.'],
      ['Common mistakes', 'Stopping too early ("Marketing" is not a task yet). Giving an item a parent ID that does not exist. Making an item its own parent. The app points these out.']
    ]
  },
  {
    title: '6. PDPC — plan for what could go wrong',
    items: [
      ['What it is', 'PDPC stands for Process Decision Program Chart. It takes your task tree and adds, for each task, what could go wrong (risks) and what you will do about it (countermeasures).'],
      ['When to use it', 'Before starting a plan where a problem would be expensive or embarrassing: a launch, a move, an event, an audit, a new process.'],
      ['Step 1', 'Click "Copy from Tree Diagram" to bring in your tasks. (Or add tasks with + Task using the same ID / Parent ID system as the Tree.)'],
      ['Step 2 — find risks', 'For each task ask: What could go wrong? What are we assuming? What went wrong last time? What do we need that we might not get (people, money, parts, approval)? Write the risks in "Risks". Separate several with a semicolon ; like this: "Parts arrive late; Test fails".'],
      ['Step 3 — countermeasures', 'In "Countermeasures", write what you will do for each risk, in the SAME ORDER, also separated by ;. Example: "Order from two suppliers; Plan a second test".'],
      ['Step 4', 'Click Check & save.'],
      ['Reading the result', 'The chart shows tasks, risks (yellow ⚠) and countermeasures (green ✓). A risk without a countermeasure is OPEN and shown in red. "Open" counts them. Before starting the project, every open risk should have a countermeasure, or the team should agree to accept it.'],
      ['Common mistakes', 'Writing countermeasures in a different order than the risks. Listing risks nobody can influence (the weather) without any backup plan.']
    ]
  },
  {
    title: '7. Activity Network Diagram — schedule and critical path',
    items: [
      ['What it is', 'A diagram of all tasks in the order they must happen, with their durations. It calculates how long the whole project takes and which tasks must not be late.'],
      ['When to use it', 'Whenever someone asks "When will it be finished?" or when several people work on tasks that depend on each other.'],
      ['Step 1', 'Add every task with + Task. Give it an ID (A, B, C… is filled in for you), a description, and a duration (in the time unit from Settings, normally days).'],
      ['Step 2 — predecessors', 'For each task, list the tasks that must be FINISHED before it can start, e.g. "A, C". Tasks that can start straight away have no predecessors.'],
      ['Step 3', 'Click Calculate & save.'],
      ['Critical path', 'The longest chain of tasks from start to finish. Its length is the project duration. Critical tasks are red. If a critical task is one day late, the whole project is one day late.'],
      ['Slack', 'How much a task can be late without delaying the project. Critical tasks have 0 slack. A task with slack 10 can start up to 10 days later than planned.'],
      ['The columns', 'ES = earliest start. EF = earliest finish. LS = latest start without delaying the project. LF = latest finish without delaying the project. Slack = LS − ES.'],
      ['The charts', 'Network diagram: boxes are tasks, arrows show the order, red is the critical path. Schedule: each bar shows when a task happens; the light grey part shows its slack. All paths: every route from start to finish with its total length.'],
      ['Example', 'Tasks A to K. The path A → B → F → H → K takes 73 days and is the critical path. Task J (train operators) has 29 days of slack, so it can wait while the team focuses on the prototype.'],
      ['How to shorten a project', 'Only shortening a CRITICAL task makes the project shorter. Add people, work in parallel or remove steps on the red path. Speeding up a task with slack does not help.'],
      ['Common mistakes', 'Forgetting a predecessor (the plan looks faster than reality). Loops: A needs B and B needs A — the app warns you.']
    ]
  },
  {
    title: 'A complete example — from problem to plan',
    items: [
      ['The problem', 'A small workshop keeps missing its weekly production target.'],
      ['1. Affinity', 'The team sends 11 ideas through the brainstorm form. Sorted into groups, Maintenance, Training, Quality and Layout stand out.'],
      ['2. Interrelationship', 'Arrows between 7 key ideas show "No standard work instructions" as the key driver and "Production targets missed" as the key outcome.'],
      ['3. Matrix', 'The team checks which departments are involved in each problem, to know who must take part in the fix.'],
      ['4. Prioritization', 'Three possible fixes are scored on cost, speed and impact. "Write and train standard work instructions" wins.'],
      ['5. Tree', 'The winning fix is broken down: pick the first 5 processes, write the instructions, test them, train each shift.'],
      ['6. PDPC', 'Risks are added: "Trainer not available" → "Train two internal trainers". One risk stays open and is discussed with the manager.'],
      ['7. Activity Network', 'Durations and order are entered. The critical path shows the project takes 6 weeks and that writing the instructions must not slip.'],
      ['Result', 'In one afternoon the team moved from a vague complaint to a root cause, a chosen solution, a risk plan and a schedule — with charts to show the manager.']
    ]
  },
  {
    title: 'Brainstorm form (Google Forms)',
    items: [
      ['Why', 'People often share more ideas when they can write them privately, from their phone, in their own time.'],
      ['Create the form', 'Planning Tools → Brainstorm form → Create brainstorm form (or the "Create form" button in the Affinity tool). Type the question, e.g. "What stops us from delivering on time?". A link appears.'],
      ['Share it', 'Send the link by email, chat or as a QR code. Anyone with the link can answer; they can submit the form as many times as they like, one idea each time.'],
      ['Bring answers in', 'Planning Tools → Brainstorm form → Import ideas from form (or the "Import new answers" button). New ideas appear in the Affinity Diagram as Unsorted, with the person\'s name if they gave one. Each answer is imported only once, so you can import as often as you like.'],
      ['Find the link again', 'Planning Tools → Brainstorm form → Show form link.']
    ]
  },
  {
    title: 'Charts and downloads',
    items: [
      ['Download PNG', 'A picture of the chart, ready for PowerPoint, Word, email or WhatsApp.'],
      ['Download SVG', 'A drawing that stays sharp at any size — best for printing posters or large screens.'],
      ['Save to Drive', 'Saves the picture to a folder called "Planning Tools charts" in your Google Drive and opens it. Use this if the Download buttons do nothing (some browsers block downloads inside the spreadsheet window). Google asks for Drive permission the first time.'],
      ['Colours', 'Charts are downloaded with the current theme. For white charts, switch the app to Light first.']
    ]
  },
  {
    title: 'Updating to a new version',
    items: [
      ['1. Replace the code', 'Extensions → Apps Script. Click into the existing code, select everything (Ctrl+A on Windows, Cmd+A on Mac), paste the new version over it, and click Save (the disk icon). Replace it — do not create a second file.'],
      ['2. Run Update', 'Go back to the spreadsheet, reload the page, then Planning Tools → Update after pasting new code.'],
      ['What Update does', 'Adds new tabs and new settings, refreshes this Guide, and recalculates every tool. Your data, your setting values and your own tabs are kept. Nothing is duplicated. Running it twice is harmless.'],
      ['Your own notes', 'You can keep notes in a tool tab to the right of the tool\'s columns, with one empty column in between. They survive saving and updating.'],
      ['Pasted twice by mistake?', 'A message tells you. Delete the older copy in Apps Script, save, and run Update again. Until then Update changes nothing.'],
      ['Permissions again', 'A new version may ask for permission again. That is normal.']
    ]
  },
  {
    title: 'Sharing, teams and phones',
    items: [
      ['Share the spreadsheet', 'Click Share (top right) and add your team. People with edit access can use the menu and the app.'],
      ['Web app (phone and bookmark)', 'Extensions → Apps Script → Deploy → New deployment → click the gear → Web app. "Execute as": Me. "Who has access": Only myself, or Anyone with a Google account for your team. Click Deploy and copy the link. Anyone with access to the link can change this project\'s data through the app.'],
      ['Another project or business', 'File → Make a copy. The copy carries the tool and starts with its own data. Delete the old data or set "Example data in new tabs" to No and recreate the tabs.']
    ]
  },
  {
    title: 'Frequently asked questions',
    items: [
      ['Does it cost anything?', 'No. It runs on your normal Google account (free or Workspace).'],
      ['Can several people work at the same time?', 'Yes. Share the spreadsheet. Saves are handled one after the other so they do not overwrite each other half-way. If two people edit the same tool at the same moment, the last save wins, so agree who edits which tool.'],
      ['Does it work on a phone?', 'Yes, through the web app link (see "Sharing, teams and phones"). The Google Sheets phone app does not show custom menus, so use the web app there.'],
      ['Does it work offline?', 'No. It needs an internet connection, like Google Sheets.'],
      ['Who can see my data?', 'Only people you share the spreadsheet or web app with. The data never leaves your Google account.'],
      ['How many rows can I use?', 'Plenty for normal projects: hundreds of ideas or tasks. Very large lists (thousands) make the app slower.'],
      ['Can I print?', 'Yes. Download a chart as SVG or PNG and print it, or print the tab with File → Print.'],
      ['Can I use my own language for the data?', 'Yes. Ideas, tasks, criteria and names can be in any language. The menus and this guide are in English.'],
      ['I made a mistake. Can I undo?', 'In the tabs use Ctrl+Z / Cmd+Z. For bigger changes use File → Version history → See version history and restore an earlier version.']
    ]
  },
  {
    title: 'Troubleshooting',
    items: [
      ['I do not see the Planning Tools menu', 'Reload the spreadsheet and wait 5–10 seconds. Check that the code was saved in Extensions → Apps Script.'],
      ['"Authorization required" or a permission screen', 'Follow the steps in "Getting started — Step 2". It is needed once, and again when a new version needs new permissions.'],
      ['The app says "Please check"', 'Read the yellow box; it names the row and the problem (missing ID, unknown predecessor, loop…). Fix it and save again.'],
      ['My changes in the tab do not show in the app', 'Close and reopen the app. If results look old, use Planning Tools → Recalculate all tabs.'],
      ['I deleted a tab by accident', 'Planning Tools → Set up / repair project tabs brings it back (empty or with examples). To recover your data use File → Version history.'],
      ['Downloads do nothing', 'Use Save to Drive instead.'],
      ['The app is dark', 'Click ☀ Light at the top of the app, or set "Colour theme" to Light in the Settings tab.'],
      ['Messages like "causes TUE", "APR", "2026", "GMT"', 'Google Sheets had turned a list such as "4, 7" into a date (older versions of Planning Tools did not prevent this). Install the latest version and run Update: it turns those dates back into the lists they were, lists the cells it fixed, and stores them as text so it cannot happen again. Check the listed cells.'],
      ['A tab is empty but I had data', 'Check whether the tab was renamed. The tool uses the exact names: Affinity Diagram, Interrelationship, Matrix Diagram, Prioritization Matrix, Tree Diagram, PDPC, Activity Network. Rename your tab back and delete the new empty one.'],
      ['"Service invoked too many times" or a timeout', 'Google limits how much a free account can run per day. Wait a few minutes and try again. Saving one tool in the app does less work than Recalculate all tabs.'],
      ['Something else', 'Note what you clicked and the exact message, take a screenshot, and send it to whoever maintains your copy of Planning Tools.']
    ]
  },
  {
    title: 'Glossary',
    items: [
      ['Brainstorm', 'Collecting as many ideas as possible without judging them yet.'],
      ['Root cause', 'The underlying reason for a problem. Fixing it stops the problem coming back.'],
      ['Symptom / outcome', 'What you can see happening because of a cause, e.g. late deliveries.'],
      ['Criterion (plural: criteria)', 'Something you judge options on, e.g. price or quality.'],
      ['Weight', 'How important a criterion is compared with the others.'],
      ['Predecessor', 'A task that must be finished before another task can start.'],
      ['Critical path', 'The longest chain of dependent tasks; it decides the project end date.'],
      ['Slack (float)', 'How long a task can be delayed without delaying the project.'],
      ['Risk', 'Something that might go wrong.'],
      ['Countermeasure', 'What you will do to prevent a risk or limit its damage.'],
      ['Trade-off', 'When improving one thing makes another thing worse.']
    ]
  }
];
