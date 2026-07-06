# STATUS — the single source of truth between sessions

**Every Claude session: read this file first. Before ending a session, update it and
commit.** (Rule 11 in CLAUDE.md.) This file kills the "new chat doesn't know anything"
problem: the repo remembers so the chat doesn't have to.

_Last updated: 2026-07-06 (session: initial plan + prototype build)_

## What exists and provably works

- Full business/technical plan in `docs/` (01–09), FR + AR executive summaries.
- Runnable prototype in `prototype/` — verified end-to-end this session:
  - Phone tracking (OsmAnd protocol, port 5055) and browser rider app with real GPS.
  - Hardware tracker path: GT06 binary TCP decoder (port 5023), CRC-checked, tested
    against the documented reference packet + simulator acting as fake hardware.
  - Mode-aware dispatch (moto/taxi/car/minibus/truck/boat) with offer cascade; full job
    lifecycle; live SSE dashboard; Dakar simulator. 17 unit tests green (`npm test`).
- iPad demo artifact (in-browser simulation, no server needed):
  https://claude.ai/code/artifact/af5a775c-ea1c-4116-9e38-1e0f80ad4b69

## What is NOT done (the gap between "engine" and "sellable product")

Ordered — this is the build queue for upcoming sessions:

1. **Persistence** — everything is in-memory; a server restart loses vehicles/jobs.
   Add SQLite or JSON-snapshot storage behind the store module.
2. **Auth + owner accounts** — no logins; anyone with the URL sees everything. Add:
   phone-number + PIN login, `Owner` entity, vehicles belong to owners, owner dashboard
   shows only their fleet. This is the fleet-tracking product (docs 01, 09).
3. **Trip history view** — per-vehicle daily trails ("where did it go yesterday").
4. **Geofence / off-hours alerts** for owners.
5. **HTTPS + a domain** (rider GPS in browsers requires HTTPS off-localhost; use Caddy).
6. Later, per docs 05–06: real GT06 hardware quirks, payments (Wave), IVR line,
   ordering marketplace.

## Where the user is in the playbook

Doc 08 (US phase): not started — next action is Step 0 (rent the DigitalOcean server).

## Decisions already made (do not relitigate)

- Multi-modal from day one; motos are the launch wedge (user decision).
- Owner-first go-to-market (tracking SaaS), marketplace later (docs 01/05, discussed).
- Subscriptions not per-ride commission; per-vehicle pricing not per-owner (doc 04).
- Zero runtime deps in prototype; structure rules in CLAUDE.md are binding.
- Docs: English masters + FR/AR summaries (user decision).
