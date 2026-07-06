// Fleet + demand simulator. Spawns a mixed-mode fleet around Dakar (most report
// via the OsmAnd phone protocol, some over raw GT06 TCP to exercise the hardware
// path) and generates delivery/ride demand so the whole loop runs end to end.
//
//   node sim/simulate.js            # 40 vehicles, runs until Ctrl-C
//   SIM_VEHICLES=100 SIM_DURATION_MS=30000 node sim/simulate.js

import { createBot, randomPoint } from './vehicle-bot.js';

const HTTP_PORT = process.env.CHEKCHEK_HTTP_PORT ?? 8080;
const OSMAND_PORT = process.env.CHEKCHEK_OSMAND_PORT ?? 5055;
const GT06_PORT = Number(process.env.CHEKCHEK_GT06_PORT ?? 5023);
const VEHICLES = Number(process.env.SIM_VEHICLES ?? 40);
const DURATION_MS = Number(process.env.SIM_DURATION_MS ?? 0); // 0 = forever
const TICK_SEC = 2;

const baseUrl = {
  api: `http://127.0.0.1:${HTTP_PORT}`,
  osmand: `http://127.0.0.1:${OSMAND_PORT}`,
};

// Fleet mix: mostly motos (the launch vertical), plus other modes to show the
// backbone is mode-agnostic. Every 5th moto reports via GT06 binary TCP.
const bots = [];
for (let i = 0; i < VEHICLES; i++) {
  const roll = i / VEHICLES;
  const mode = roll < 0.6 ? 'moto' : roll < 0.75 ? 'taxi' : roll < 0.85 ? 'car' : roll < 0.95 ? 'minibus' : 'truck';
  const transport = mode === 'moto' && i % 5 === 0 ? 'gt06' : 'osmand';
  bots.push(createBot({ index: i, mode, transport, baseUrl, gt06Port: GT06_PORT }));
}
console.log(`[sim] ${bots.length} vehicles launched (incl. GT06 hardware-path bots)`);

const tickTimer = setInterval(() => {
  bots.forEach((b) => b.tick(TICK_SEC).catch(() => {}));
}, TICK_SEC * 1000);

// Demand: a new job every few seconds, weighted toward moto deliveries.
const demandTimer = setInterval(async () => {
  const roll = Math.random();
  const mode = roll < 0.7 ? 'moto' : roll < 0.9 ? 'taxi' : 'car';
  await fetch(`${baseUrl.api}/api/jobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ mode, pickup: randomPoint(), dropoff: randomPoint() }),
  }).catch(() => {});
}, 5000);

const statsTimer = setInterval(async () => {
  try {
    const res = await fetch(`${baseUrl.api}/api/state`);
    const { vehicles, jobs } = await res.json();
    const byState = {};
    jobs.forEach((j) => (byState[j.state] = (byState[j.state] ?? 0) + 1));
    console.log(
      `[sim] vehicles=${vehicles.length} jobs=${jobs.length}`,
      Object.entries(byState).map(([s, n]) => `${s}:${n}`).join(' '),
    );
  } catch {
    console.log('[sim] server unreachable — is `npm start` running?');
  }
}, 10_000);

if (DURATION_MS > 0) {
  setTimeout(() => {
    clearInterval(tickTimer);
    clearInterval(demandTimer);
    clearInterval(statsTimer);
    console.log('[sim] done');
    process.exit(0);
  }, DURATION_MS);
}
