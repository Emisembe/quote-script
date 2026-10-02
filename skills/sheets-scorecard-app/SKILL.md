---
name: sheets-scorecard-app
description: Build a self-building Google Sheets app in one Apps Script file — a composite index, scorecard, ranking or multi-criteria decision tool that downloads public data (UN Comtrade, World Bank or similar APIs), scores it with editable weights, and explains every tab to non-technical users — plus a Node test harness that checks every formula with Google Sheets semantics. Use this skill whenever someone wants a Google Sheet / Apps Script tool that ranks, scores or compares countries, products, suppliers, regions or options; a trade, market, value-addition or opportunity analysis in Sheets; a dashboard workbook with pickers, charts and explanations; or to extend, audit, fix or update such a workbook (including "Exceeded maximum execution time", tabs that stopped working, or adapting the Africa Trade Scorecard to Europe or another region) — even if they don't say "Apps Script" or "scorecard".
---

# Self-building Google Sheets scorecard apps

This skill captures how the Africa Trade Gap Scorecard was built: one `Code.gs` file that a user pastes into
Extensions → Apps Script, which then builds 28 tabs, downloads real data, scores it, draws charts, explains
itself, updates itself safely, and audits itself. The finished project is in `example/` — read it for any
pattern below before inventing your own.

The person you build for is often not technical and may not write English as a first language. That shapes
almost every decision: the workbook must explain itself, confirm every action, survive mistakes, and never
lose their data.

## What to read when

| You are about to… | Read |
|---|---|
| Plan or write the code (structure, layout constants, tabs, menu, update/refresh) | `references/architecture.md` |
| Design what the user sees (explanation boxes, pickers, NOW SHOWING, charts, Guide, Health_Check) | `references/ux-patterns.md` |
| Download data (UN Comtrade, World Bank) or write scoring formulas | `references/data-and-scoring.md` |
| Test, audit, or debug "it doesn't work in my sheet" | `references/testing-and-limits.md` |
| See a working implementation of anything | `example/Code.gs` (search for the function names the references give) |

## Workflow

1. **Agree the idea first, in plain words.** Restate what the tool will rank and why, list the tabs you
   propose, and say what each criterion measures. Ask before building; this user likes to confirm
   ("I agree") before work starts. Explain any assumption the user must set (weights, target shares,
   multipliers) and why it is theirs to set, before you build it.
2. **Build in one `Code.gs`.** No HTML sidebars, no libraries, no extra files the user must manage.
   Constants at the top (criteria, weights, parameters, reference lists), then layout, build, data, compute,
   tabs, helpers. Every result tab has a blue explanation box; every picker has a NOW SHOWING line.
3. **Ship sample data.** Quick start must work with no API key: synthetic data with a realistic shape,
   labelled SAMPLE everywhere, so the user sees the whole tool in two minutes.
4. **Test before you hand anything over.** Copy `scripts/mock.js` and `scripts/sheetsim.js` into the
   project's `tests/`, write `workflows.js` (every menu action) and `verify.js` (formula results for every
   picker value), and run both. See `references/testing-and-limits.md`. Report the check count honestly, and
   say plainly that a real Google Sheet is the one thing the tests cannot be.
5. **Deliver.** Commit and push if there is a repo, send the `Code.gs` file, and give the user numbered
   steps: paste, reload, run the menu item, wait for "Done", run the full audit.
6. **Every later change** follows the same loop: small, tested, version number bumped, update path kept
   working (old workbooks must upgrade without losing data).

## Rules that came from real problems

These each cost a round of user frustration on the original project; keep them.

- **Google stops any script after 6 minutes.** Long jobs (build, update, data download) run in steps that save
  their place in DocumentProperties and continue from a time-based trigger, with a safety-net trigger in case
  Google kills a run. Never copy big data tabs out and back in during an update; leave them in place.
- **Google counts empty cells** toward the 10 million cell limit. Trim long data tabs to the columns they use.
- **A picker must prove it worked.** A green NOW SHOWING line under every dropdown names the selection and
  counts what was found, or says exactly why nothing was found. Chart legends carry the selected name.
- **Chart headings go inside the chart** (`setOption('title', …)` with one shared title style), with a short
  "how to read it" line in the cell above.
- **No emojis.** Every abbreviation gets its full name in brackets or in the Guide's abbreviation table.
- **Every tab says what it shows, how to read it, a sentence to say when presenting, and what to watch out for.**
- **One failing item must not stop a download**; record it and continue. Stop only on a rejected key or
  several failures in a row, and keep what was loaded.
- **Bad user input must not stop scoring** (text in a number column, a missing coordinate): use a neutral value
  and flag it on Health_Check.
- **Benchmarks are context, not flags.** When adding a comparison (for example a European median next to the
  African one), keep scores and GAP flags on the original basis, and make charts fall back gracefully when
  the benchmark data is missing.

## Talking to the user

Short sentences, no jargon, or explain it once in brackets. Lead with the result ("Fixed. Update now runs in
steps…"), then what changed, then their numbered steps. When they ask for one or two sentences, give exactly
that. When something can only be checked in their real sheet, say so and ask for a screenshot rather than
guessing. Present choices as a recommendation plus a short reason, and wait for "I agree" on larger changes.

## Adapting the example to a new project

The Africa example generalises directly: swap the entity list (54 African countries → EU members, ASEAN,
your company's suppliers), the reference lists (products, value chains, equipment, markets), the API
reporter codes, and the criteria/weights. Keep the skeleton: menu, staged build, banners, pickers, Health_Check,
sample data, tests. `references/data-and-scoring.md` lists which parts are Africa-specific.
