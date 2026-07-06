# 07 — Engineering practices: how to build with AI without ending up with a 20,000-line file

Written for a founder who directs Claude/AI to build, without a coding background. This
doc explains *why* projects rot when built one "add this" at a time, and the small set of
habits that prevent it. The enforcement version of this doc is [`CLAUDE.md`](../CLAUDE.md)
at the repo root — Claude Code reads that file automatically every session and treats it
as standing orders.

## Why "add one thing at a time" creates a mess

Every time you say "add X," the AI looks for the easiest place to put X — which is
usually *inside whatever file already exists*. Nobody ever asks for "restructure the
code"; so nothing ever pushes back, and after 50 additions you have one 20,000-line HTML
file. It's not an AI weakness — human teams do exactly this without discipline. The fix
is the same for both: **rules that live in the project, not in your memory**, so every
session starts already knowing them.

## The mental model (the only theory you need)

Think of an app like a restaurant, not a food truck:

- **The dining room** (what users see) — screens, buttons, maps. → `public/` here.
- **The kitchen** (the rules of the business) — "which vehicle is closest?", "what does
  this trip cost?". → `server/` modules like `dispatch.js`.
- **The pantry** (the data) — vehicles, jobs, positions. → the store/database module.
- **The delivery entrance** (the outside world) — GPS boxes, phones, payment providers.
  → protocol/gateway modules.

A food truck does everything in one box; fine for one cook, chaos at scale. **Separation
means a change in one room doesn't burn down the others** — you can redo the menu without
touching the pantry. Every rule below is just this principle applied.

## The seven habits that keep a project healthy

1. **Put the rules in the repo (`CLAUDE.md`).** File-size limits, folder layout, "no
   inline scripts," "tests before commit." Claude reads it every session automatically.
   When you start any new project, creating this file is step one — before any feature.

2. **Cap file size (~300 lines).** This is the single highest-leverage rule. A file
   that can't grow forces modularity mechanically, without you needing to know *how*
   to modularize — the AI knows how; the cap makes it happen.

3. **Ask for structure in the first prompt, not the fiftieth.** The first request to a
   new project should be: *"Set up the project skeleton with separate folders for X, Y,
   Z, a test runner, and a CLAUDE.md with our rules — before writing any features."*
   Foundations are nearly free on day one and brutally expensive on day ninety.

4. **Demand tests with every feature.** You don't need to read tests; you need them to
   exist. They're the safety net that lets session #40 change code written in session #2
   without silently breaking it. Your phrase: *"include tests, and run the full test
   suite before you finish."*

5. **Commit small and often (git is your save-game).** One feature = one commit with a
   clear message. When something breaks, you can point to the last good save instead of
   archaeologically digging through one giant blob of changes.

6. **Fight context rot with fresh sessions + good docs.** Long chats degrade — the AI
   starts forgetting early decisions (you've felt this). The cure is to make the *repo*
   the memory instead of the chat: README + docs + CLAUDE.md carry everything forward.
   End a work session by asking: *"update the docs and CLAUDE.md to reflect what changed,
   then commit."* Then start the next session fresh; it reboots with full knowledge.

7. **Schedule cleanup like rent.** Every ~10 feature requests, spend one request on:
   *"No new features. Review the codebase for files over the size limit, duplicated
   logic, and code in the wrong module. Refactor, keep all tests green."* Ten percent
   maintenance forever beats a rewrite every six months.

## Phrases that work (copy-paste arsenal)

- New project: *"Before any features: create the folder structure, test runner, and a
  CLAUDE.md with a 300-line file cap, no-inline-script rule, and tests-before-commit."*
- Every feature: *"Add X. Follow CLAUDE.md. If any file would exceed the size limit,
  split it first. Include tests. Run the suite. Commit."*
- Health check: *"Audit the project against CLAUDE.md and list violations, worst first."*
- When you smell rot: *"Stop. What technical debt have we accumulated? Propose a cleanup
  plan before we add anything else."*

## What this repo already does for you

- `CLAUDE.md` — standing orders, enforced every session.
- `prototype/` — built module-per-concern from day one, as the living example: no file
  near the cap, HTML with zero inline logic, shared constants in one place.
- `prototype/test/` — unit tests wired to plain `npm test` (no frameworks to break).
- Numbered `docs/` — the repo *is* the memory; any fresh session can rebuild full context
  from the docs alone.
