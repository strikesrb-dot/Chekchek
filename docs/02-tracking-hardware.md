# 02 — Tracking & hardware: the three-tier device strategy

The core design decision: **the platform tracks vehicles and riders through whatever
channel exists**, and the backend treats all of them as one "position source" abstraction.
Everything in this doc applies to *any* vehicle mode — the same boxes and pipeline serve
motos, taxis, vans, minibuses, trucks, and boats; only the mounting/installation differs.

## Tier 1 — Rider's smartphone (default, $0 hardware)

- Android app streams GPS over MQTT when online/on-trip; batches and uploads when signal
  returns. Adaptive sampling: every 5 s on-trip, every 30–60 s idle-online, off when
  offline (battery + data budget: target < 15 MB data/month and < 8%/day battery for
  a full-time rider).
- Anti-spoofing: mock-location detection, sanity checks server-side (speed/teleport
  filters), periodic cell-tower cross-check.
- Weakness: phone off = invisible; rider-owned, not moto-owned. Fine for dispatch, not
  enough for fleet owners or theft recovery. Hence tier 2.

## Tier 2 — Hardwired GPS box (the mass-scale differentiator)

A ~$12–25 GPS/GSM tracker wired to the vehicle battery, with its own SIM. Same device
family for a moto, a taxi, or a truck; larger vehicles just get better mounting options
(and for trucks/minibuses, optional extras like fuel-level sensing later).

**Hardware candidates (all speak protocols supported by the open-source Traccar server —
we adopt those wire protocols so devices are commodity, never proprietary):**

| Device class | Example | ~Unit cost | Notes |
|---|---|---|---|
| Ultra-budget | Sinotrack ST-901, Concox/Jimi GT06 family | $10–15 | GPS+2G, relay output for immobilizer. Good enough for v1. |
| Mid | Jimi/Concox GT06E / JM-VL03 | $18–25 | 4G/2G fallback — important as 2G sunsets. |
| Quality tier | Teltonika FMB920 | $35–45 | Battery backup, excellent firmware. For premium fleets. |

**Selection rules:** must have 2G *and* 4G paths in the portfolio, relay/immobilizer line,
internal battery, and an open documented protocol. Order pilot batches of 3 candidate
models and test in Dakar heat/dust/rain before committing.

**Connectivity:** M2M SIM deals with Orange/Free/Expresso — a tracker sends ~5–20 MB/month;
negotiated M2M data should land well under $1/moto/month at fleet volume. Dual-provider
strategy from day one (coverage differs by region; also negotiation leverage).

**Installation & channel:** train moto mechanics in each city as certified installers
(paid per install, ~30 min job: battery tap + hidden mount). Mechanics become our street
distribution network — they see every moto in the city.

**Business model for the box:** don't sell hardware at margin. Offer it at/near cost
(or bundled free with a 12-month fleet subscription of ~1,500–2,500 FCFA/month, ≈ $2.50–4).
The box pays for itself in theft deterrence alone; for us it converts an untracked moto
into a permanent platform node.

## Tier 3 — No-GPS fallback (SMS/USSD/cell-ID)

- Feature-phone riders: go online / report status via USSD menu; approximate position from
  the cell tower (via operator location APIs where available) or from declared zone.
  These riders get dispatched within their declared zone with manual confirmation.
- Also the degradation path for tiers 1–2 when data networks fail: trackers queue and
  batch; the app queues and batches; USSD is the channel of last resort.
- The same zero-data philosophy applies *outbound* to customers: the voice status line
  (IVR with caller-ID lookup and missed-call callback, doc 01) reads live tracking state
  to any handset with voice credit — no app, no data, no literacy requirement.

## Position pipeline (all tiers converge)

```
phone app (MQTT/TLS) ─┐
GPS boxes (GT06/Teltonika binary over TCP) ─┤→ protocol gateways → normalized
USSD/SMS gateway (aggregator or direct ARTP short code) ─┘   PositionEvent → Kafka
```

One normalized `PositionEvent {vehicle_id, source, lat, lon, speed, heading, ts, quality}`
feeds everything downstream: live maps, dispatch, geofences, trip reconstruction, fraud.
The vehicle's `mode` lives in the registry, not the event — the pipeline never branches
on vehicle type.

**Build vs. buy for the device gateway:** start by embedding/porting Traccar's protocol
decoders (mature, Apache-licensed, supports 200+ tracker protocols) behind our own Kafka
producer, rather than writing GT06 parsers from scratch. Replace pieces only if scale
demands it.

## Why this tiering wins

- **Zero-friction start:** any rider with any Android can earn today (tier 1).
- **Sticky infrastructure:** fleet boxes (tier 2) make the *moto* the platform's node, not
  the phone — surviving rider churn, enabling theft recovery and work-and-pay financing
  (lenders will finance motos they can track and immobilize — this unlocks moto-financing
  partnerships, a huge adjacent business).
- **Nobody excluded:** tier 3 keeps feature-phone riders and dead zones inside the system.
