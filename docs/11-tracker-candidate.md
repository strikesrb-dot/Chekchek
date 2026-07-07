# 11 — Lead candidate tracker (as of July 2026)

## Cantrack GT06 J16 — 4G, engine-cut, GT06 protocol

Found on Alibaba during procurement. **Confirmed compatible with the ChekChek server.**

- **Seller:** Huizhou Cantrack Technology Co., Ltd. (Verified, 4 yrs, 4.7★/189,
  ≥98% on-time, #5 best-seller in GPS Tracker). Main markets incl. **Kenya** (Africa
  export experience — good for Senegal reorders). Contact: Sara Liu.
- **Model:** GT06 J16, 4G LTE (with 2G fallback), GSM/GPS/GPRS/LBS/AGPS.
- **Relay / engine stopper:** yes (remote immobilizer).
- **Backup battery:** 150 mAh (<12 h), 9–90 VDC input (fine for motos).
- **Price tiers:** $12 (5–199) · $11.50 (200–999) · $10 (1,000+) · sample $13.56.
  **MOQ 5** — can sample cheaply.

### ✓ Confirmed by seller (2026-07-07)
- **Custom server supported via GT06 protocol.** SMS command format:
  `SERVER,0,<IP>,<Port>,0#`
  → For ChekChek: **`SERVER,0,165.232.98.59,5023,0#`** (our GT06 gateway port).
- This means it points at our own server, not a vendor-locked app. This is the
  single most important requirement, and it passed.

### ✓ LTE bands confirmed (2026-07-07)
Seller confirmed the "full coverage" global variant (model **G900LS**):
- **LTE-FDD B1/B2/B3/B4/B5/B7/B8/B28/B66** + GSM 850/900/1800/1900.
- **Senegal (Orange): solid** — B3 (1800, Orange's primary LTE band) + B7 + B8; GSM
  900/1800 gives 2G fallback.
- **USA testing: works** — B2/B4/B66 connect in populated areas. Caveat: no B12/B71
  low-band, so deep-indoor/rural US signal is weaker (fine for bench/car testing).
- Extra features noted: FOTA (remote firmware update), cut-fuel, ignition on/off detect.

**BOTH blocking questions now answered → cleared for sample order.**

### Next step: sample-test before bulk
Order 3–5 samples (MOQ 5, ~$13.56 sample price), wire one to a moto/12 V supply, send
`SERVER,0,165.232.98.59,5023,0#`, confirm it appears on the dashboard and the engine-cut
works. THEN place the 50–100 unit order at $10–12.

### Cost model fit (free-first-month box)
- Box ~$10–12 + install ~$4 + SIM ≈ **$16 sunk/vehicle**; box stays ChekChek property
  (reclaim if owner doesn't convert after the free month). Subscription 2,000 FCFA/mo
  (~$3.30) pays the box back in ~5 months. See the free-box economics discussion.

### Cheaper alternatives seen (deferred — MOQ 100)
- Cantrack "Brazil Rastreador 4G+2G" ~$3.65–5.90, MOQ 100.
- Cantrack Secumore C32 (2G) ~$3.80–6, MOQ 100.
- Revisit for large Senegal orders once the J16 is proven; sample the J16 first.
