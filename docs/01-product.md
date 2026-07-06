# 01 — Product: who it's for and what it does

## Terminology and market reality

- **Thiak-thiak (tiak-tiak)** — moto *delivery* riders, the dominant courier workforce in
  Dakar. They carry food, parcels, documents, market goods. Mostly informal: work comes by
  phone call, WhatsApp, and street relationships.
- **"Jakarta"** — moto-*taxis* (named after the Indonesian import brands), the primary
  passenger transport in regional cities: Touba, Thiès, Kaolack, Mbour, Saint-Louis,
  Ziguinchor, Tambacounda. Tens of thousands per city.
- Passenger moto-taxi operation is **restricted in Dakar proper**; delivery is not. This
  single regulatory fact dictates the rollout order (delivery first in Dakar, passenger
  transport in the regions).
- Estimated addressable fleet nationwide: on the order of 200k–400k motos. The 200k target
  is ambitious but the right design number for the architecture.

## One mode-agnostic backbone, three launch verticals

The tracking backbone (vehicle registry, position pipeline, live map, trips, geofences)
is **mode-agnostic from day one**: every vehicle carries a `mode` — `moto`, `taxi`,
`car`, `minibus`, `truck`, `boat`. Motos are the launch wedge because that's where the
open market is, but nothing in the platform is moto-shaped. Later modes (Dakar taxis,
car rapides/AFTU minibuses, intercity freight, pirogues) are product launches on the
same backbone — see doc 05, Phase 3. Build the backbone once.

### V1 — Delivery (thiak-thiak dispatch) — *launch vertical*
- Senders (individuals, restaurants, boutiques, e-commerce) request a pickup → nearest
  available rider gets the job → live tracking → proof of delivery (photo + recipient code)
  → payment via Wave/Orange Money or cash.
- Business senders get a dashboard: bulk orders, address book, COD (cash-on-delivery)
  reconciliation — COD collection is *the* killer feature for Senegalese e-commerce, where
  most buyers pay on receipt.

### V2 — Moto-taxi hailing (regional cities)
- Passenger hails via app, or — crucially — via a **street-corner USSD/SMS code or a call
  center**, because many passengers won't have the app. Fixed, transparent zone-to-zone
  fares (regional moto fares are already de-facto standardized; the app publishes them
  rather than surge-pricing, at least initially).
- Safety layer: rider identity, plate number, trip tracking, SOS button, trip-share link.
  This is the #1 selling point to passengers (especially women) and to authorities.

### V3 — Fleet tracking, any vehicle (B2B SaaS)
- Many motos are owned by small investors who rent them to riders ("work-and-pay" or daily
  rental). Owners desperately want: where is my moto, is it being used off-hours, theft
  recovery, remote immobilization. The exact same need exists for taxi owners, delivery-van
  fleets, intercity trucks, and transport cooperatives — the GPS box doesn't care what
  it's bolted to.
- Sell the GPS box + a subscription (see doc 02) for **any vehicle mode**. This vertical
  *funds and seeds* the tracked-vehicle base: every fleet-tracked vehicle is one tap away
  from becoming dispatchable on V1/V2 (or on later modes' products — taxi hailing,
  seat booking, freight).

## Users and what each one needs

### Rider (driver) app — the product that must be perfect
- **Device reality:** Tecno/Infinix/Itel Androids, 1–3 GB RAM, patchy 3G, expensive data.
  App must be < 20 MB, Android-Go friendly, offline-tolerant, battery-frugal.
- **Language reality:** French UI, **Wolof audio prompts** for every key action (new job,
  navigate, confirm delivery) — literacy varies, audio removes the barrier.
- Core loop: go online → receive job (full-screen + loud audio, one-tap accept) → navigate
  → status updates auto-derived from GPS where possible (arrived = geofence, not a tap) →
  collect payment → daily earnings summary.
- Wallet: earnings, subscription status, instant cash-out to Wave/OM.
- Works while offline: queue status updates, cache the assigned job, sync when signal returns.

### Customer app + non-app channels
- App (Android first, tiny APK; iOS later; a mobile-web fallback for one-off senders).
- **WhatsApp bot** for delivery requests — Senegalese commerce already lives on WhatsApp;
  meeting senders there beats forcing an install.
- **Voice status line (IVR)** — the zero-data channel. A customer with an active order
  calls a local number; the system recognizes them by **caller ID** (no menus), reads the
  driver's live position, and answers with stitched prerecorded **Wolof/French** clips:
  *"Sa livreur mingi ci yoon wi… il est à… trois… kilomètres… environ dix minutes."*
  - **Movement-aware prompts** from GPS speed: moving steadily → "your driver is on the
    way, ~6 minutes"; stopped near the destination for several minutes → "your driver has
    stopped nearby, he may be looking for your address — stay reachable."
  - **Missed-call (flash) callback**: the customer flashes the number and hangs up (free);
    the platform calls back and plays the status. Costs us a few francs, costs them nothing.
  - Needs only voice credit and any handset — covers customers with no data, no smartphone,
    or low literacy. Voice numbers/rates via operators or an aggregator (ARTP — doc 04).
- USSD short code + call center for hailing and price checks (regional passengers).

### Fleet owner dashboard (web + Android)
- Live map, trip history, geofences/off-hours alerts, immobilizer control, rider assignment,
  revenue per moto (if the moto also works on the platform).

### Ops console (internal)
- Rider onboarding/KYC queue, live city map, dispute handling, COD reconciliation,
  fraud flags, zone/fare management, SOS response.

## Trust & safety (non-negotiable at launch)
- Rider KYC: national ID (CNI), photo, phone number (registered SIMs are already
  KYC'd in Senegal), moto plate/registration; helmet required in profile photo.
- Ratings both directions; automatic suspension thresholds.
- SOS button → call center + location; trip-share links.
- Insurance partnership (rider + parcel + passenger) — negotiate a group policy; this is a
  differentiator and a regulatory shield.

## What we deliberately do NOT build at first
- Surge pricing (fixed zone fares build trust; revisit later).
- Multi-modal *dispatch products* (taxi hailing, minibus ticketing, freight marketplace) —
  the backbone tracks any mode from day one and fleet-tracking SaaS is open to all modes,
  but dispatch launches moto-only until the loop is proven.
- In-app chat (phone call button is enough; everyone calls).
- Nationwide launch (see doc 05 — one city, one vertical).
