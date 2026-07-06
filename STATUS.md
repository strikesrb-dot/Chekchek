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

**Hard deadline: the user flies to Senegal in August for 10 days.** Doc 10 is the trip
plan (recon + seed mission) with the July countdown.

**MILESTONE 2026-07-06: the prototype is DEPLOYED AND LIVE on the internet.**
- DigitalOcean droplet (London, $6/mo, Ubuntu 24.04), IP **165.232.98.59**, hostname
  ChekChek. Runs as systemd service `chekchek` (auto-restart, starts on boot).
- Dashboard: http://165.232.98.59:8080 · phone gateway :5055 · GT06 gateway :5023.
- Code lives in `/opt/chekchek` (branch `claude/check-check-gps-app-fm4knp`), cloned
  with a read-only fine-grained GitHub token (user should rotate it after the trip).
- Update procedure: `cd /opt/chekchek && git pull && systemctl restart chekchek`.
- Note: server is plain HTTP → browser geolocation on /rider does NOT work remotely;
  phones report via the Traccar Client app until HTTPS + domain lands (build item 5).

**MILESTONE 2026-07-06 (later same day): first vehicle tracked end-to-end in production.**
User verified the full pipeline live: curl → OsmAnd gateway (:5055) → store → SSE →
dashboard showed "1 vehicles online · 1 moto" with the dot in Dakar. Server-side is
proven. The user's iPhone (Traccar Client, id `myphone`) was configured correctly
(URL http://165.232.98.59:5055, continuous tracking ON) but hadn't reported yet as of
last check — suspected cause: Interval was 300s + stop detection while stationary.
Fix in progress: Interval → 10, tap "Send location", check Vehicles list.

Remaining this week: finish phone reporting (`myphone` + mom's phone) and
**order the 4G trackers (critical path, 2–4 week shipping)**. Build queue for Claude
sessions: "NOT done" items 1–5 above — all needed before the August flight.

## Deliverables outside the repo (the user works from an iPad and can't browse files)

The user needs previews/artifacts/PNGs, not repo paths. Existing:
- Demo simulation artifact: https://claude.ai/code/artifact/af5a775c-ea1c-4116-9e38-1e0f80ad4b69
- Playbook posters artifact (3 posters: US, Senegal, August trip):
  https://claude.ai/code/artifact/92e2ea6a-bb6e-4b9d-90c2-f752234d9df1
- Posters also delivered as PNGs in-chat. When docs change materially, re-render and
  resend (poster source: scratchpad `playbook-posters.html` — regenerate if missing).

## Decisions already made (do not relitigate)

- Multi-modal from day one; motos are the launch wedge (user decision).
- Owner-first go-to-market (tracking SaaS), marketplace later (docs 01/05, discussed).
- Subscriptions not per-ride commission; per-vehicle pricing not per-owner (doc 04).
- Zero runtime deps in prototype; structure rules in CLAUDE.md are binding.
- Docs: English masters + FR/AR summaries (user decision).
