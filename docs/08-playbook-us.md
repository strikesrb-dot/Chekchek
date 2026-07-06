# 08 — The Playbook, Part 1: from today (in the US) to a proven working system

Follow this top to bottom. Check boxes as you go. Part 2 (doc 09) starts when you land in
Senegal. Prices are estimates from mid-2026; treat anything ±30% as normal.

## Step 0 — Today, from the iPad: rent the server (~20 min, $6/month)

- [ ] Go to digitalocean.com → create account (needs a card). Alternatives: Hetzner
  (cheaper, EU), Vultr. Any works; instructions below assume DigitalOcean.
- [ ] Create → Droplets → region **Frankfurt or London** (best ping to both US & Senegal)
  → Ubuntu 24.04 → Basic → **$6/mo (1 GB)** → Authentication: **Password** (simplest from
  iPad) → hostname `chekchek` → Create.
- [ ] Copy the droplet's IP address. This is YOUR-SERVER everywhere below.
- [ ] On GitHub (github.com → your repo → Settings → Developer settings → Fine-grained
  personal access tokens): create a token, repository access = only `Chekchek`,
  permission = Contents: Read-only. Copy it. This lets the server download your code.

## Step 1 — Install ChekChek on the server (~30 min)

- [ ] In DigitalOcean: your droplet → Access → **Launch Droplet Console** (a terminal in
  the browser — works on iPad). Log in as `root` with your password.
- [ ] Paste these lines one at a time (replace TOKEN and check the branch name):

```bash
apt update && apt install -y nodejs npm git ufw
git clone https://TOKEN@github.com/strikesrb-dot/Chekchek.git /opt/chekchek
cd /opt/chekchek && git checkout claude/check-check-gps-app-fm4knp
ufw allow 22 && ufw allow 8080 && ufw allow 5055 && ufw allow 5023 && ufw --force enable
cat >/etc/systemd/system/chekchek.service <<'EOF'
[Unit]
Description=ChekChek prototype
After=network.target
[Service]
WorkingDirectory=/opt/chekchek/prototype
ExecStart=/usr/bin/node server/index.js
Restart=always
[Install]
WantedBy=multi-user.target
EOF
systemctl enable --now chekchek
```

- [ ] Open `http://YOUR-SERVER:8080` on the iPad. If you see the ChekChek map: **you are
  live on the internet.** (Blank page = wait 30 s, refresh; still broken =
  `journalctl -u chekchek -n 50` shows the error — paste it into a Claude session.)
- [ ] To update the server after future code changes:
  `cd /opt/chekchek && git pull && systemctl restart chekchek`

## Step 2 — Test with your mom, today (~15 min)

- [ ] iPad: open `http://YOUR-SERVER:8080` (the owner/ops view). Keep it open.
- [ ] Your phone: open `http://YOUR-SERVER:8080/rider` in the browser → name: "Me" →
  vehicle type: moto → Se connecter → **Passer en ligne** → allow location.
- [ ] Mom's phone: same address, name "Mom", type taxi. Allow location.
- [ ] Watch the iPad: two dots. Have her drive to the store. The dot follows her —
  that is exactly what a Dakar owner sees. Screenshot it; it's your first demo asset.
- [ ] Optional (this is the "real driver phone" mode): install the free **Traccar Client**
  app on her phone → server URL `http://YOUR-SERVER:5055` → device id `mom` → start.
  Phone reports even with the browser closed.
- [ ] Test the job loop: on the iPad tap map twice (pickup, dropoff) → Request job → her
  phone (on /rider, online, nearest of that mode) gets **Nouvelle course !** → she taps
  Accepter and works through the buttons. You just ran a dispatch end to end.

## Step 3 — Order the hardware test batch (~$220, do this the same week)

**Critical US fact: 2G networks are dead in the US.** 2G-only trackers cannot be tested
in the US — order 4G-capable units for US testing; ship 2G ones straight to Senegal later.

- [ ] AliExpress order (search exact model names, buy from stores with 1,000+ orders):
  - 2 × **Micodus MV720G** (4G, engine-cut relay) ~ $28 each
  - 2 × **Jimi VL103** (4G, Concox/Jimi lineage — GT06-family protocol) ~ $32 each
  - 1 × **Teltonika FMC920** (quality benchmark) ~ $50 (from a Teltonika distributor/eBay)
- [ ] SIMs for trackers: **Hologram.io** IoT SIMs (pay-as-you-go, work on US LTE, also
  roam in Senegal later) — order 3, ~$5 each + ~$1/mo each at tracker data volumes.
- [ ] While waiting for delivery, ask a Claude session to: add persistence + a simple
  login + per-owner vehicle lists to the prototype (see STATUS.md → Next).

## Step 4 — Bench-test the boxes (weekend project)

- [ ] Insert SIM. Wire red→car/moto battery + (or a 12 V bench supply / old car battery),
  black→ –. The unit LED should go solid when it finds GPS + network.
- [ ] Configure by texting SMS commands to the SIM's number (each manual lists them;
  MV720-family example): `apn,hologram#` then `server,1,YOUR-SERVER,5023,0#` then check
  with `where#`.
- [ ] The box appears on your dashboard as `Box <imei>`. If it connects but shows no
  position, put it outdoors (GPS needs sky). If nothing connects, the server log
  (`journalctl -u chekchek -f`) shows whether packets arrive — debug from there with
  Claude. Protocol variants are *expected*; the decoder may need a small extension.
- [ ] Torture tests, in your car for a week: daily drives (does the trail look right?),
  underground parking (does it resume?), pull power (does the backup battery phone
  home?), leave it in the sun. Log failures per unit. **The winner is the one you'll
  buy 20–50 of for Senegal.**

## Step 5 — Exit criteria for Part 1 (aim: 3–6 weeks from today)

- [ ] Server has run 2+ weeks unattended; you can update it yourself.
- [ ] Two phones + two hardware boxes tracked reliably for a week.
- [ ] Job dispatch demo you can run in front of anyone in 3 minutes.
- [ ] Prototype upgraded with login + persistence + owner accounts (Claude sessions).
- [ ] Winner tracker model chosen; 20–50 units + mounting hardware ordered for Senegal
  (order to a US address and carry them in luggage, or ship DHL to Dakar — carrying is
  simpler; declare them; they're consumer electronics, ~$300–800 total).

**Total Part-1 spend: ~$300–450** (server $6/mo, batch ~$220, SIM data ~$10, misc wiring).
