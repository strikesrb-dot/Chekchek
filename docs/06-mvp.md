# 06 — The 90-day MVP: what we actually build first

Goal: by day 90, real Dakar riders complete real paid deliveries dispatched by the
platform, and real fleet vehicles (any mode) show live on a map from $12 GPS boxes.

## Scope (and the discipline to keep it)

**In:**
1. **Tracking core (mode-agnostic):** position ingestion from (a) rider phones,
   (b) GT06-family GPS boxes, (c) OsmAnd-protocol test clients; live state store;
   live map. *Prototyped in this repo — see `prototype/`.*
2. **Dispatch:** nearest-available-vehicle matching filtered by mode + job lifecycle
   state machine (`requested → offered → accepted → arrived_pickup → in_transit →
   delivered → settled`), 15 s offer cascade.
3. **Rider app (Android):** go online, receive job (loud + Wolof audio), one-tap
   accept, call buttons, proof of delivery (photo + code), earnings screen, offline
   queueing. Small APK (<20 MB), works on 1 GB-RAM devices.
4. **Sender surfaces:** minimal Android/web app for individuals + WhatsApp bot for
   merchants + a merchant web dashboard (address book, bulk, COD flag).
5. **Money v1:** Wave checkout for prepaid jobs; cash + COD recorded in a double-entry
   ledger; manual weekly reconciliation tooling for ops.
6. **Ops console v1:** onboarding/KYC queue, live city map, job monitor, manual
   dispatch override, rider suspend.
7. **Fleet tracking v1:** register a device → live map + trip history + geofence alert
   for fleet owners (this is sellable on day one to taxi/van owners too).

**Out (explicitly):** passenger hailing, USSD, surge/dynamic pricing, in-app chat,
routing-engine ETAs (haversine × 1.4 is fine at launch), iOS, automated payouts,
Kafka (a message bus abstraction ships first; Kafka lands in month 4–6 when volume
justifies it).

## Stack (chosen for hiring reality + boring reliability)

| Layer | Choice | Why |
|---|---|---|
| Backend | **TypeScript/Node** services (or Go for gateways later) | Talent pool, one language across backend + web |
| System of record | **Postgres + PostGIS** | Trips, orders, ledger, geo history |
| Live state | **Redis** (GEO + H3 sets) | Nearest-vehicle in ms |
| Bus | Redis streams v1 → **Kafka/Redpanda** later | Don't run Kafka for 500 riders |
| Device gateway | **Traccar-derived decoders** (GT06 first) | 200+ protocols solved; don't rewrite |
| Phone telemetry | MQTT (EMQX/Mosquitto) + HTTPS batch fallback | Flaky-3G-friendly |
| Rider app | **React Native or Kotlin** (decide with first mobile hire) | Small APK is a hard requirement |
| Maps | OSM: self-hosted tiles + OSRM + custom landmark gazetteer | Cost + weak street addressing |
| Web (dashboards) | React + MapLibre GL | |
| Infra | One cloud (EU-West or SA), Docker Compose → k8s later; IaC from day 1 | |

## The prototype in this repo (`prototype/`)

A runnable slice of items 1–2, proving the riskiest technical claims:

- `server/` — Node.js, zero external services:
  - OsmAnd-protocol HTTP endpoint (`:5055`) — any phone with a free tracker app
    (Traccar Client / OsmAnd) reports into it today.
  - **GT06 binary TCP decoder** (`:5023`) — login + GPS packets from the $12 trackers,
    CRC-checked (validated by unit tests + included packet simulator).
  - Vehicle registry with **modes** (`moto, taxi, car, minibus, truck, boat`), Redis-free
    in-memory geo index (H3-style cell bucketing), dispatch engine with offer cascade.
  - WebSocket fan-out to dashboard + rider clients.
- `public/dashboard.html` — live map (Leaflet/OSM): every vehicle colored by mode,
  click-to-create a delivery job, watch matching happen.
- `public/rider.html` — browser "rider app": uses the phone's real GPS, go
  online/offline, receive + accept jobs, drive the job state machine.
- `sim/simulate.js` — spawns N simulated vehicles of mixed modes moving around Dakar
  + generates delivery demand, so the whole loop runs with zero hardware.
- `test/` — unit tests for the GT06 decoder and the dispatch engine.

Run it: see `prototype/README.md`.

## 90-day calendar

- **Weeks 1–4:** tracking core productionized (Postgres/Redis/MQTT), device gateway
  with real GT06 hardware on Senegalese SIMs, rider app skeleton.
- **Weeks 5–8:** dispatch + full job lifecycle on real devices; ops console; merchant
  dashboard + WhatsApp bot; Wave sandbox integration.
- **Weeks 9–12:** closed pilot — 50 riders, 10 merchants, 200 fleet boxes; daily
  field iteration; CDP filing done; hardware candidate chosen.
- **Day 90 demo:** a merchant order placed on WhatsApp, dispatched to a real rider,
  tracked live, paid via Wave, reconciled in the ledger — plus a fleet owner watching
  his taxi and two motos on his own dashboard.

## MVP success metrics
- Job completion rate ≥ 95%; median dispatch-to-pickup < 10 min in pilot zone.
- Position pipeline: p99 device→map latency < 5 s; zero data loss on 30-min offline gaps.
- Rider week-4 retention ≥ 60%; NPS from merchants ≥ 40.
- GT06 fleet: ≥ 99% of powered devices reporting daily.
