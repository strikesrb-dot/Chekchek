# ChekChek — rules for every coding session (human or Claude)

This file is read automatically by Claude Code at the start of every session. Its job is
to keep this codebase modular and healthy even when features are added one small request
at a time. **These rules are not optional.** If a user request would violate one, say so
and propose the compliant way instead of complying silently.

## Project shape

- `docs/` — the business + technical plan (numbered docs, English masters; FR/AR summaries).
- `prototype/` — runnable Node.js prototype of the tracking/dispatch core.
  - `prototype/server/` — backend modules, one concern per file.
  - `prototype/public/` — dashboard + rider web app. HTML files contain **markup only**;
    styles live in `public/css/`, behavior in `public/js/`, one module per concern.
  - `prototype/sim/` — fleet/demand simulator.
  - `prototype/test/` — unit tests (`node --test`).

## Hard rules (structure)

1. **File size limit: ~300 lines.** If an edit would push a file meaningfully past that,
   split it into modules FIRST, then add the feature. Never grow a file past ~400 lines.
2. **No giant HTML files.** HTML is layout only. JavaScript goes in `public/js/*.js`
   (ES modules), CSS in `public/css/*.css`. Adding a `<script>` with more than ~10 lines
   of inline code is a violation.
3. **One file = one job.** New feature area → new module. Don't bolt unrelated logic
   onto an existing file because it's convenient.
4. **State lives in the store module** (`server/store.js`); business rules live in their
   own modules (dispatch, trips, geo…); protocol/transport code (HTTP, WS, TCP decoders)
   never contains business logic. Web UI state goes through each page's small store/state
   module, not scattered globals.
5. **Shared constants in one place** (`server/modes.js`, `public/js/config.js`).
   Never re-declare vehicle modes, ports, or job states inline.

## Hard rules (process)

6. **Tests must pass before every commit:** `cd prototype && npm test`. New logic in
   `server/` gets a unit test in `test/`.
7. **Every session that adds a feature updates docs** if behavior or structure changed
   (at minimum `prototype/README.md`).
8. **Small commits, clear messages** — one feature or fix per commit.
9. **Before adding code, search for an existing module that already does the job** and
   extend/reuse it. Duplication is a bug.
10. **When a file is refactored/split, update this file's Project shape section** if the
    layout changed.

## Conventions

- Node 22+, plain ES modules (`"type": "module"`), no build step in the prototype.
- No new npm dependencies without a stated reason in the commit message (prototype
  currently has **zero** runtime deps — keep it that way unless truly needed).
- Vehicle `mode` is one of `server/modes.js` — the platform is multi-modal; never write
  moto-only logic outside labeled launch-vertical code.
- Naming: `camelCase` functions/vars, `SCREAMING_SNAKE` constants, kebab-case filenames.
- Errors: fail loud in dev (throw), degrade gracefully at runtime edges (network, GPS).

## Definition of done for any request

- [ ] Code in the right module (or a new one), all files under the size limit
- [ ] `npm test` green, new logic covered
- [ ] Docs touched if behavior/structure changed
- [ ] Committed with a descriptive message
