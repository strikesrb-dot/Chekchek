# 04 — Money and rules: payments, pricing, unit economics, regulators

## Payments: meet the money where it lives

- **Wave** dominates person-to-person mobile money in Senegal (aggressive ~1% pricing,
  massive agent network). **Orange Money** is the incumbent with the deepest reach;
  **Free Money** third. Card penetration is negligible. **Cash is still the street
  default** — the app must support cash without punishing it.
- Integrations, in order: Wave Business/Checkout API → Orange Money Web Payment API →
  Free Money. All flows must work on the *customer's* phone via USSD-triggered approval
  (no card forms, no redirects that die on 3G).
- **Wallet + double-entry ledger from day one.** Every franc (earnings, service fees,
  subscription, COD collected, cash-out) is a ledger entry. Riders cash out instantly to
  Wave/OM. COD reconciliation (rider collects cash for a merchant → owes it back, netted
  against earnings) is the feature that wins e-commerce merchants and the discipline that
  prevents fraud from eating the company.
- Driver-side float problem: riders often lack the balance to remit COD. Solution: COD
  ceiling tied to a rider's deposit + history, and same-day netting.

## Pricing & who pays what

| Vertical | Customer pays | Worker pays platform |
|---|---|---|
| Delivery (Dakar launch) | Distance-zone fee (e.g. 1,000–2,500 FCFA in-city) + optional COD fee (1–2%) | **Weekly subscription** ≈ 2,500–4,000 FCFA (~$4–6.50) for unlimited jobs |
| Moto-taxi (regions) | Fixed published zone fares (matching street prices; the app adds trust, not markup) | Weekly subscription, cheaper regional tier |
| Fleet tracking (any vehicle) | — | 1,500–2,500 FCFA/vehicle/month + hardware at cost |
| Taxis / minibuses / trucks (later modes) | Mode-specific (metered taxi, seat booking, per-tonne-km freight) | Subscription or per-transaction, negotiated per mode |

**Why subscription, not commission, for two-wheeler workers:** across African markets
(SafeBoda, Gokada, Max.ng, Gozem's evolution) per-ride commission on moto work triggers
mass off-platform leakage — riders take the match, cancel, and deal in cash. A flat
weekly fee that costs less than one day's fuel makes ChekChek feel like a tool the rider
*buys* (like his phone), not a boss taking a cut. Commission can apply to
business-account volume (merchants) where the platform genuinely originates demand.

**Unit economics sanity check (delivery rider):** a full-time Dakar thiak-thiak doing
10–20 jobs/day grosses roughly 5,000–10,000 FCFA/day. A 3,000 FCFA/week subscription is
~4–8% of weekly gross — sellable if the platform brings him even 2 extra jobs/week.
At 20k paying riders → ~$4–6M ARR from subscriptions alone before merchant fees, fleet
SaaS, and payments margin.

**Path to 200k:** 200k vehicles × blended ~2,000 FCFA/month platform revenue ≈
**$60–80M ARR potential**. Getting there is a distribution problem (docs 02, 05), not a
technology problem (doc 03).

## Regulatory map (engage early, in person, in French)

| Body | Why they matter | Action |
|---|---|---|
| **CDP** (Commission de Protection des Données Personnelles) | Location data = personal data under **Law n° 2008-12**. Processing requires prior declaration/authorization. | File before beta. Appoint a local DPO. Consent flows in French + Wolof audio. Retention & downsampling policy (doc 03). |
| **ARTP** (telecom regulator) | USSD short codes, SMS sender IDs, M2M SIM arrangements. | Short code application via operators/aggregator early — lead times are long. |
| **Ministère des Transports terrestres / CETUD** (Dakar urban transport) | Moto-taxi legality varies by city; Dakar restricts passenger motos. Local decrees govern Jakartas in regional cities (registration, vests, helmets). | Position ChekChek as the *formalization partner*: registered, identifiable, insured, trackable riders are exactly what authorities keep demanding. Pilot MoU with one regional commune (e.g. Mbour or Thiès) before scaling passenger transport. |
| **BCEAO / DMF** (central bank, e-money) | Holding rider wallet balances can constitute e-money issuance. | Partner model: balances sit at a licensed EME/bank partner (or keep wallets as pass-through with instant settlement) until/unless we pursue our own license. |
| **Municipalities & rider associations** | Jakarta unions and *garages* (stands) control the streets socially. | Recruit via association leaders; offer association dashboards; never launch a city against the union. |
| **Insurance (CIMA-zone insurers)** | Group policies for rider/passenger/parcel. | Negotiate a group scheme; embed premium in subscription. A visible "insured" badge is a trust weapon. |

## Fraud & leakage (plan for it, don't discover it)

- GPS spoofing / ghost riders → mock-location detection + server-side physics checks (doc 03).
- Off-platform dealing → subscription model removes the main incentive; merchant COD flows
  keep business volume on-platform because the *reconciliation* is the value.
- COD theft → deposit ceilings, daily netting, association-level guarantors.
- Account sharing → periodic selfie re-verification on job acceptance (lightweight, on-device).
- SIM swap on cash-out → cash-out PIN + cooling period after SIM-change signals from operators.

## Funding shape (indicative)

- **Pre-seed (~$250–500k):** MVP build (doc 06), 500-rider Dakar delivery pilot, CDP/ARTP
  groundwork, 2k GPS boxes for fleet pilot.
- **Seed (~$2–4M):** 3 cities, passenger vertical in 1–2 regional cities, payments
  integrations hardened, 25k vehicles, team of ~25.
- **Series A (~$10–20M):** national rollout, hardware channel at scale, moto-financing
  partnerships (track-and-immobilize unlocks work-and-pay lending), 200k-vehicle path.
