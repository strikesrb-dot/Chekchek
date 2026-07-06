# ChekChek prototype — multi-modal tracking + dispatch core

A runnable slice of the platform described in [`docs/06-mvp.md`](../docs/06-mvp.md):
position ingestion from phones **and** cheap GT06 hardware trackers, a mode-aware
dispatch engine, a live ops map, and a browser rider app. Node.js 22+, **zero runtime
dependencies**, no build step.

## Run it

```bash
cd prototype
npm start          # terminal 1 — the platform
npm run sim        # terminal 2 — 40 simulated vehicles + demand around Dakar
```

Then open:

- **http://localhost:8080** — live ops dashboard. Vehicles colored by mode; click the
  map twice (pickup, dropoff), pick a mode, request a job, and watch the offer cascade
  and lifecycle play out.
- **http://localhost:8080/rider** — the rider app (open it on a phone on the same
  network to use real GPS). Register, go online, receive and work real job offers.

```bash
npm test           # unit tests: GT06 codec, dispatch engine, geo index
```

## What's actually proven here

| Claim from the plan | Where |
|---|---|
| One pipeline for any position source | `server/store.js` — phones (OsmAnd HTTP, port 5055), hardware trackers (GT06 TCP, port 5023), and the rider app all converge on the same store |
| The $12 tracker protocol is tractable | `server/gt06.js` — CRC-checked binary decoder, validated against the documented login packet + encoder round-trip tests |
| Mode-agnostic tracking, mode-filtered dispatch | `server/modes.js`, `server/dispatch.js` — a `truck` job never goes to a `moto` |
| Nearest-vehicle matching with offer cascade | `server/dispatch.js` + grid-cell index in `server/store.js` (H3-style ring search) |
| Full job lifecycle | `requested → offered → accepted → arrived_pickup → in_transit → delivered → settled`, driven from the rider app or the simulator |
| Live ops visibility | Server-Sent Events stream (`/events`) feeding the Leaflet dashboard |

## Point a real phone at it

Install any OsmAnd-protocol tracking app (e.g. Traccar Client), set the server URL to
`http://<your-ip>:5055`, and the phone appears on the dashboard. Add `&mode=taxi` style
parameters via the device identifier to register other modes, or just use `/rider`.

## Layout (rules in ../CLAUDE.md)

```
server/   config, modes, geo, store, dispatch, api, http (SSE+static),
          osmand (phone gateway), gt06 + gt06-server (hardware gateway)
public/   dashboard.html + rider.html (markup only), css/, js/ (ES modules)
sim/      simulate (orchestration), vehicle-bot (movement + job behavior),
          gt06-encode (acts like real tracker hardware)
test/     node --test suites for the codec, dispatch, geo
```

## Deliberate prototype shortcuts (production path in docs/03)

In-memory store instead of Redis/Postgres · SSE instead of MQTT fan-out · straight-line
ETAs instead of OSRM · no auth on the API · map tiles from the public OSM server (Leaflet
itself is vendored in `public/vendor/`, so everything but the map background works offline).
