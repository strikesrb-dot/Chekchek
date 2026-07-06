# 09 — The Playbook, Part 2: on the ground in Senegal (first 6–8 weeks)

Prerequisite: Part 1 complete (doc 08). You arrive with a working system, 20–50 tested
tracker boxes, and a 3-minute demo on your iPad. Names/prices are estimates — verify on
the ground and update this doc as you learn (that's rule 7 in CLAUDE.md).

## Week 1 — Set up your base

- [ ] **SIMs, day one:** buy an Orange SIM and a Free SIM (any Orange/Free boutique,
  passport needed — registration is mandatory). Put Orange in your phone; keep both for
  coverage testing. Buy data with `#111#` (Orange) / `#150#` (Free).
- [ ] **Tracker SIMs for the pilot:** at an Orange boutique, buy ~25 prepaid SIMs with the
  smallest data bundles (a few hundred FCFA/month each covers a tracker). Register each
  (bring passport; expect this to take a morning; tip: some boutiques cap SIMs per person
  per day — spread across days/boutiques, and put real M2M SIMs on the roadmap via
  **Orange Business** once you're a registered company).
- [ ] **Coverage drive:** put one working tracker + your phone in a taxi; ride
  Plateau → Médina → Grand Dakar → Pikine → back on the corniche. Watch the dashboard.
  Where the trail gaps, note it. Repeat once with a Free SIM. Now you *know* coverage
  instead of guessing.
- [ ] **Company registration:** go to **APIX** (the one-stop business registration
  center, Dakar) → register a **SUARL** (single-owner limited company). Cost on the
  order of 25,000–70,000 FCFA plus notary if required; typically about a week. You need
  this for Wave Business, Orange Business, and the CDP filing.
- [ ] **Wave Business:** sign up (business.wave.com or their Dakar office) with the
  company papers. This is how subscriptions get collected — owners pay a Wave request,
  you have receipts, nobody handles cash.
- [ ] **Data-protection filing (CDP):** engage a local business lawyer (~150–400k FCFA)
  to prepare the CDP declaration for GPS/location processing (Law 2008-12). Start it now;
  it runs in the background. Keep the receipt of filing.

## Week 2 — Recruit your first mechanics (your installers *and* salesforce)

Where: the moto-mechanic clusters — around Colobane, Petersen, and the garages where
thiak-thiaks queue for repairs. Go in person, mid-morning, with a moto that has a box
already installed (install one on a rented/borrowed moto first — that's your show piece).

The pitch (French; adjust to Wolof through whoever you're with):

> « Je m'appelle X. Voici un boîtier GPS — regardez, ce téléphone montre où est la moto
> en temps réel, et le propriétaire peut couper le moteur à distance si on la vole.
> Je cherche deux mécaniciens sérieux pour poser ces boîtiers. **Je paie 2 500 F par
> pose**, c'est 30 minutes de travail : deux fils sur la batterie, boîtier caché sous la
> selle. Et pour chaque propriétaire que vous m'amenez qui s'abonne, **je vous donne
> 2 000 F.** »

- [ ] Train 2–3 mechanics: watch them do 2 installs each on test motos; check the box
  reports before paying. Give each a laminated one-page install card (wiring photo,
  SMS config commands, your number).
- [ ] Agree referral terms out loud, in front of their colleagues (social contract >
  paper contract at this stage).

## Weeks 2–4 — First paying owners (target: 5 owners, 20–40 vehicles)

Finding them: mechanics' referrals first (that's why you pay for referrals); then the
garage/stand chiefs (chef de garage) — the man who runs the moto stand knows every owner;
then any owner who ever lost a moto to theft (everyone knows one).

The pitch, with the live demo on your iPad:

> « Voici vos motos, en direct, sur votre téléphone. Où elles sont, où elles ont roulé,
> à quelle heure. Si on en vole une : vous la retrouvez, et vous pouvez l'immobiliser à
> distance. Le boîtier coûte 10 000 F une fois [at/near your cost], l'abonnement c'est
> **2 000 F par moto par mois** — le premier mois est gratuit. Si après un mois vous ne
> voulez plus, je reprends le boîtier et vous ne payez rien. »

Rules for the pilot:
- [ ] First month free, money-back box — removes all risk from their side.
- [ ] Collect only via **Wave request** (from your Wave Business) — clean records.
- [ ] Install where the owner watches; hand him his login (owner view) on his own phone
  before you leave. The "wow" moment must happen on *his* phone, not yours.
- [ ] WhatsApp group per owner fleet (you + owner + his drivers' stand) for support.
- [ ] **Immobilizer policy from day one:** cut-off is only ever sent while the vehicle is
  stopped (the software enforces it) and only at the owner's request. Demonstrate once,
  parked. Never demo on a moving moto.
- [ ] Weekly visit each owner for the first month: what confused him? What did he check
  daily? What didn't he use? Write it in STATUS.md — this is your real product spec.

## Weeks 4–8 — Prove the business, then decide

Gates before you scale past the pilot (be strict — these protect you from
"nice in theory"):
- [ ] ≥ 80% of pilot vehicles reporting cleanly every day for 3 straight weeks.
- [ ] ≥ 4 of 5 pilot owners convert to paying after the free month.
- [ ] ≥ 1 theft-recovery or theft-deterrence story you can retell (this becomes your
  marketing).
- [ ] A mechanic has installed a box *without you present* and it worked.
- [ ] You've collected a full month of subscriptions through Wave without chasing anyone
  more than twice.

If gates pass → order 200–500 boxes (now negotiate: Alibaba direct with the manufacturer,
or Jimi/Concox's Africa distributor; target landed cost ≤ 9,000 FCFA), hire one full-time
ops person (a sharp, honest young person from the garage scene beats a diploma here,
~150–250k FCFA/month), and repeat the Week-2/Week-4 loop in the next neighborhood.
If gates fail → the notes in STATUS.md tell you exactly what to fix; fix it before
spending another franc on hardware.

## Services to subscribe to in Senegal (when each becomes relevant)

| Service | For | When |
|---|---|---|
| Wave Business | Collecting subscriptions, later driver payouts | Week 1 |
| Orange Business (M2M SIMs) | Bulk tracker SIMs, one bill, better rates | After ~50 vehicles |
| LAfricaMobile (Dakar-based aggregator) | SMS notifications, and the IVR voice line (doc 01) | With first customers who ask "where is my driver" |
| Orange Money Business | Second collection channel | When an owner insists |
| Local accountant (cabinet comptable) | Taxes, payroll for ops hire | With first employee |
| Insurance broker (CIMA-zone) | Group theft/liability product | After the pilot proves numbers |

**Pilot budget, all-in (flights excluded): ~$2,500–4,500** — boxes you carried, ~25 SIMs,
company + lawyer + CDP, mechanic pay, transport, first-month-free subsidy, buffer.
