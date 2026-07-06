# 05 — Rollout: from one neighborhood to 200,000 vehicles

Uber-style marketplaces die from launching too wide. Density beats coverage: 300 riders
in one city where pickup takes 6 minutes beats 3,000 riders spread thin where it takes 25.

## Phase 0 — Groundwork (months 0–3, parallel with MVP build)
- Incorporate; CDP data-protection filing; ARTP short-code application started.
- Sign 10–20 anchor merchants in Dakar (restaurants, e-commerce sellers, pharmacies)
  who already dispatch thiak-thiaks daily by phone — they seed guaranteed job volume.
- Recruit 50 pilot riders through 2–3 well-known garages/stands and one riders'
  association; hand-onboard every one (KYC, training, Wolof audio walkthrough).
- Pilot 200 GPS boxes with 3–5 small fleet owners (test hardware candidates from doc 02).

## Phase 1 — Prove the loop: Dakar delivery (months 3–9)
- **One vertical (delivery), one zone** (e.g. Plateau–Médina–Point E–Almadies corridor).
- Success gates before expanding: ≥500 weekly-active riders, ≥60% week-4 rider retention,
  ≥8 jobs/rider/day median, COD reconciliation loss <0.5%, pickup ETA p50 <10 min.
- Merchant dashboard + WhatsApp bot live; Wave payments live; cash supported.
- Fleet-tracking SaaS sold in parallel (any vehicle type — motos, taxis, delivery vans;
  the tracking backbone is mode-agnostic from day one, doc 03).

## Phase 2 — Prove passenger transport: one regional city (months 9–15)
- Launch moto-taxi hailing in **Mbour or Thiès** (dense, close to Dakar for ops support,
  Jakarta-dominated transport). Touba is the biggest prize but has unique governance —
  enter it with local partners once the model is proven, ideally before the Magal
  (the annual pilgrimage is the single largest transport-demand event in Senegal).
- MoU with the commune + rider association *before* launch: registered vests, published
  zone fares, safety training. ChekChek = formalization, not disruption.
- Street-level demand channels: USSD hailing, call center, corner QR posters.
- Success gates: ≥1,500 active riders in city, ≥3 trips/rider/day via app, zero
  union conflict, measurable authority endorsement.

## Phase 3 — Multi-city + multi-modal (months 15–30)
- Replicate the regional playbook: Touba, Kaolack, Saint-Louis, Ziguinchor. Each city =
  a launch kit (association deal, commune MoU, 2 ops hires, installer-mechanic network,
  zone/fare tables) — a repeatable checklist, not a bespoke project.
- **Open new modes on the same backbone** (this is why tracking is mode-agnostic):
  - **Taxis (Dakar):** dispatch + tracking for the existing yellow-black taxi fleet.
  - **Minibuses (car rapides / Ndiaga Ndiaye, AFTU):** live tracking + seat-level
    ticketing later; even bare tracking sold to owners/cooperatives is revenue.
  - **Freight:** intercity trucks (Dakar–Touba–Kaolack corridors), market-day logistics.
  - **Pirogues/boats** where relevant (Saint-Louis, Ziguinchor–Dakar coastal) — the
    tracker tier works anywhere with GSM coverage.
- Moto-financing partnership: lenders finance motos that ship with our box +
  immobilizer; every financed vehicle is a platform vehicle by default.

## Phase 4 — Mass scale (months 30–48): the 200k path

| Source of tracked vehicles | Target |
|---|---|
| Delivery riders (Dakar + secondary cities) | 30–50k |
| Regional moto-taxis (8–10 cities) | 80–120k |
| Fleet/SaaS tracking (taxis, vans, trucks, minibuses) | 30–50k |
| Financed vehicles (partner-originated) | 20–40k |

- Hardware channel matured: certified installer network in every city (mechanics),
  regional warehouses, 4G-only device mix as 2G sunsets.
- Consider West-Africa expansion only after Senegal density is won (Gambia and
  Guinea-Bissau are natural adjacencies; Gozem/Yango will be competing regionally).

## Competition, honestly
- **Yango / Heetch / Yassir** own Dakar *car* ride-hailing. Don't fight them there.
  Two-wheelers, regional cities, fleet tracking, and COD delivery are wide open.
- **Paps, Yobante Express** do logistics — potential *customers* of the rider network
  rather than pure rivals.
- **Gozem** (Togo/Bénin) proves the moto-super-app model works in francophone West
  Africa and could enter Senegal — speed and street-level lock-in (associations,
  installers, subscriptions riders love) are the moat. Nobody else is building the
  hardware-inclusive tracking base; that's the defensible layer.

## Team shape at each phase
- Phase 1 (~10): 4 eng, 1 product/design, 2 rider ops, 1 merchant sales, 1 hardware/
  installer lead, 1 finance/regulatory.
- Phase 2–3 (~25–40): + city launchers (2/city), call center (grows with passenger
  vertical), data/fraud analyst, payments engineer, government-relations lead.
- Phase 4 (~80–120): platform/SRE team, per-city ops pods, hardware supply chain,
  risk & compliance function.
