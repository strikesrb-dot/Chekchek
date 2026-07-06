# 03 — Technical architecture: holding 200,000 vehicles

## Design load (the honest math)

200k registered vehicles will never all be online at once. Realistic peak concurrency is
30–40% → **~70k concurrently reporting vehicles**.

| Source | Rate | Peak msgs/sec |
|---|---|---|
| On-trip phones (~25k) | 1 pos / 5 s | ~5,000 |
| Idle-online phones (~35k) | 1 pos / 30 s | ~1,200 |
| GPS boxes (~70k powered) | 1 pos / 10–30 s | ~4,500 |
| **Total position ingest** | | **~10–12k msg/s peak** |

10–12k small messages/sec is *modest* — a handful of commodity servers, not a
mega-cluster. The hard parts are elsewhere: flaky networks, offline bursts (a rider
reconnects and uploads 400 queued points at once), device diversity, and cost discipline.
The architecture below is deliberately boring and buys headroom to 5–10× the target.

## System overview

```
┌─ Rider app (Android) ──── MQTT/TLS ────┐
├─ GPS boxes (GT06 / Teltonika…) ─ TCP ──┤   ┌────────────┐
├─ USSD/SMS aggregator ── HTTP webhook ──┼──▶│  Ingestion  │──▶ Kafka: positions
└─ Customer app / WhatsApp bot / web ────┘   │  gateways   │──▶ Kafka: device-events
                                             └────────────┘
Kafka topics ──▶ consumers:
  • live-state svc  → Redis (GEO + H3 cells): current pos/status of every vehicle
  • trip service    → trip segmentation, distance, PostGIS storage
  • geofence svc    → zone entry/exit, off-hours alerts, arrival auto-detect
  • fraud svc       → teleport/speed/mock-GPS scoring
  • archiver        → Parquet on object storage (analytics, ML later)

Core services (stateless, k8s or plain ASG):
  dispatch/matching • orders • pricing • riders/KYC • payments • notifications
Backing stores: Postgres+PostGIS (system of record) • Redis (live state, queues)
Realtime out: WebSocket/MQTT fan-out to apps (rider jobs, customer live-tracking)
```

## Key decisions and why

**1. MQTT for phones, raw TCP for trackers, one normalized event.**
MQTT 5 with persistent sessions handles flaky 3G gracefully (QoS 1, offline queues,
tiny overhead). Cheap trackers speak their own binary protocols — we run
Traccar-derived protocol decoders as thin gateway pods that emit the same
`PositionEvent` to Kafka. Nothing downstream knows or cares what the device was.

**2. Kafka as the spine.** Every position flows through one log. Live map, dispatch,
trips, fraud, analytics are independent consumers — adding a feature never touches
ingestion. (Managed Kafka or Redpanda; 12k msg/s × ~200 bytes is trivial throughput.)

**3. Geo-indexing: Redis GEO + H3 cells.** Current position of every vehicle lives in
Redis (`GEOADD` per city, plus H3 res-8 cell membership sets). "Nearest 20 available
riders to point X" = one Redis query at res-8/9, ~milliseconds. PostGIS is for
history/analytics, never in the dispatch hot path.

**4. Dispatch = simple, explainable rules first.** Filter (available, required vehicle
mode, zone allowed, capacity) → rank by ETA (haversine × road factor to start; OSRM
later) → offer to best rider with 15 s acceptance window → cascade to next. Batch/
auction matching is a v3 optimization, not a v1 need. Fixed zone fares keep pricing a
lookup table.

**5. Offline-first is a product feature, not an afterthought.**
- Rider app: local queue (SQLite) for positions + status changes; server accepts
  late-stamped batches; trip reconstruction tolerates gaps.
- Job assignment delivered over MQTT *and* FCM push *and* (last resort) SMS.
- Customer sees "last seen 4 min ago" honestly rather than a frozen dot.

**6. Maps without bankruptcy.** OpenStreetMap ecosystem end-to-end: self-hosted tiles
(OpenMapTiles) + OSRM/Valhalla for routing + Nominatim/Pelias with a **custom Senegal
gazetteer** — street addressing is weak in Senegal, so first-class support for
landmarks, "quartier + description", and what3words-style codes matters more than
house numbers. Google Maps APIs at 200k vehicles would be a company-killing line item.

**7. Cost envelope at full scale (order of magnitude).** Ingest+Kafka+Redis+DB+services
for 70k concurrent ≈ tens of servers ≈ **$15–30k/month cloud** — i.e. ~$0.10–0.15 per
registered vehicle per month. Infrastructure will never be the business risk; SIM data
and payment fees dominate marginal cost.

## Data model (core entities)

`Rider/Driver` (KYC, wallet, subscription, rating) — `Vehicle` (**mode:
moto|taxi|car|minibus|truck|boat**, plate, owner, device bindings) — `Device` (imei,
type, sim, protocol) — `PositionEvent` (append-only) — `Trip`
(derived segments) — `Order/Job` (delivery or ride: state machine
`requested→offered→accepted→arrived_pickup→in_transit→delivered/completed→settled`) —
`Zone` (H3 sets + fare table) — `LedgerEntry` (double-entry wallet: earnings, fees,
COD, cash-outs).

Vehicles and riders are **separately tracked and loosely bound** (a moto may have a
box *and* a rider phone; reconcile by proximity) — this is what makes fleet-tracking
and dispatch one platform instead of two products.

## Security & privacy baseline
- TLS everywhere incl. tracker TCP where firmware allows; device auth = per-device
  token/IMEI allowlist; phone auth = SIM-based OTP.
- Location data is personal data under Senegal's data-protection law (Law 2008-12, CDP
  oversight — see doc 04): retention policy (raw positions → downsample after 90 days),
  role-based access in ops console, audit logs, rider consent flows in French/Wolof.
- Immobilizer commands: two-person rule + never while moving (speed check server-side).

## Build order (matches doc 06)
1. Ingestion (OsmAnd-protocol HTTP + GT06 TCP) → Redis live state → live map. *(prototype in this repo)*
2. Dispatch + order state machine + rider/customer apps.
3. Wave/OM payment integration + wallet ledger.
4. Kafka spine + PostGIS trips + fleet dashboards (replace prototype's in-memory bus).
5. Fraud, analytics, routing/ETA upgrades.
