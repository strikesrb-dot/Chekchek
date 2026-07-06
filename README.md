# ChekChek — GPS tracking + dispatch platform for Senegal's transport economy

ChekChek is a plan for a mass-market platform — think "Uber, but built for Senegal" —
whose tracking core is **mode-agnostic**: motos, taxis, cars, minibuses (car rapides /
Ndiaga Ndiaye), trucks, even pirogues. The launch wedge is the two-wheeler workforce —
the **thiak-thiak** delivery riders of Dakar and the **"Jakarta" moto-taxis** that move
people in Touba, Thiès, Kaolack, Ziguinchor, Mbour, Saint-Louis and every regional city —
because that's where demand density and the open market are. Target scale: **200,000
tracked vehicles** across all modes.

Three things make this different from cloning Uber:

1. **Tracking cannot assume a smartphone.** Many riders have low-end Androids, some have
   feature phones, and fleet owners want to track motos regardless of who is riding. So the
   platform treats "position source" as pluggable: a rider app, a cheap hardwired GPS box
   (~$12–25), or SMS/USSD check-ins.
2. **The money rails are Wave and Orange Money, not credit cards.** Cash is still king on
   the street; the app must make digital payment *easier* than cash, not mandatory.
3. **Tracking is the platform, dispatch is an app on top of it.** One vehicle registry and
   position pipeline serves delivery dispatch, ride-hailing, and fleet-tracking SaaS for
   any vehicle type — so every new mode (taxis, minibuses, freight) is a product launch,
   not a re-architecture.

## The plan, in order

| Doc | What it covers |
|---|---|
| [docs/01-product.md](docs/01-product.md) | Who it's for, the three verticals (delivery, moto-taxi, fleet tracking), features per user |
| [docs/02-tracking-hardware.md](docs/02-tracking-hardware.md) | Phone vs. GPS box vs. SMS — the three-tier device strategy and hardware picks |
| [docs/03-architecture.md](docs/03-architecture.md) | System design that holds at 200k vehicles: ingestion, matching, offline-first apps |
| [docs/04-money-and-rules.md](docs/04-money-and-rules.md) | Payments (Wave/OM), pricing, unit economics, regulators (ARTP, CDP, transport ministry) |
| [docs/05-rollout.md](docs/05-rollout.md) | Phased go-to-market: one city, one vertical first — then multi-modal, then the country |
| [docs/06-mvp.md](docs/06-mvp.md) | The concrete 90-day MVP: what we build first, tech stack, what we deliberately skip |
| [docs/07-engineering-practices.md](docs/07-engineering-practices.md) | How we keep the codebase healthy while building with AI (plain-language; enforced by [CLAUDE.md](CLAUDE.md)) |
| [docs/08-playbook-us.md](docs/08-playbook-us.md) | **The playbook, part 1**: today → deployed server, mom-test, hardware bench-tested (US phase) |
| [docs/09-playbook-senegal.md](docs/09-playbook-senegal.md) | **The playbook, part 2**: on the ground — SIMs, company, mechanics, first paying owners |
| [STATUS.md](STATUS.md) | Living handoff file: what works, what's next — read/updated by every session |
| [docs/resume-fr.md](docs/resume-fr.md) | Résumé exécutif en français |
| [docs/summary-ar.md](docs/summary-ar.md) | الملخّص التنفيذي بالعربية |

## Working prototype

[`prototype/`](prototype/) contains a runnable slice of the tracking + dispatch core:
OsmAnd-protocol HTTP ingestion (any phone can report in), a GT06 binary TCP decoder
(the $12 hardware trackers), a mode-aware dispatch engine, a live Leaflet dashboard, a
browser rider app, and a Dakar fleet simulator. See [prototype/README.md](prototype/README.md).

## One-paragraph strategy

Start with **delivery dispatch in Dakar** (thiak-thiaks already work with restaurants and
e-commerce, and moto *passenger* transport is restricted in Dakar proper), using
**phones-only** and **Traccar-compatible cheap GPS boxes** for fleet owners. Prove the
dispatch + payment loop with ~500 riders. Then expand to **passenger moto-taxis in regional
cities** (Touba/Mbour first) where Jakartas are the backbone of transport, monetizing
riders with a **flat weekly subscription** (not per-ride commission, which moto riders
reject across Africa) and shippers/passengers with service fees. Fleet-tracking
subscriptions for moto owners are the quiet third revenue line that funds the hardware
channel. Scale infrastructure is boring-on-purpose: MQTT ingestion → Kafka → Redis/H3
geoindex → PostGIS, sized in [docs/03-architecture.md](docs/03-architecture.md).
