// A simulated vehicle: wanders Dakar between random waypoints, reports its
// position (OsmAnd HTTP or GT06 TCP), polls for job offers, accepts, and drives
// the job to completion so the full dispatch loop runs with zero hardware.

import net from 'node:net';
import { buildLogin, buildPosition } from './gt06-encode.js';

export const DAKAR = { minLat: 14.665, maxLat: 14.77, minLon: -17.52, maxLon: -17.44 };
const SPEED_KMH = { moto: 28, taxi: 22, car: 22, minibus: 16, truck: 16, boat: 12 };

export function randomPoint() {
  return {
    lat: DAKAR.minLat + Math.random() * (DAKAR.maxLat - DAKAR.minLat),
    lon: DAKAR.minLon + Math.random() * (DAKAR.maxLon - DAKAR.minLon),
  };
}

export function createBot({ index, mode, transport, baseUrl, gt06Port }) {
  const name = `${mode}-${index}`;
  const imei = String(350000000000000 + index);
  const storeId = transport === 'gt06' ? `gt06-${imei}` : `osmand-${name}`;
  const bot = {
    name,
    mode,
    storeId,
    pos: randomPoint(),
    target: randomPoint(),
    job: null,
    phase: 'wander',
    socket: null,
    serial: 1,
  };

  if (transport === 'gt06') {
    bot.socket = net.connect(gt06Port, '127.0.0.1', () => {
      bot.socket.write(buildLogin(imei, bot.serial++));
    });
    bot.socket.on('error', () => {});
  }

  async function tick(dtSec) {
    move(dtSec);
    await report();
    await workJobs();
  }

  function move(dtSec) {
    const speed = SPEED_KMH[bot.mode] * (0.7 + Math.random() * 0.6);
    const stepKm = (speed / 3600) * dtSec;
    const dLat = bot.target.lat - bot.pos.lat;
    const dLon = bot.target.lon - bot.pos.lon;
    const distKm = Math.hypot(dLat * 111, dLon * 107); // rough km at Dakar latitude
    if (distKm < 0.12) {
      onArrive();
      return;
    }
    const f = Math.min(1, stepKm / distKm);
    bot.pos = { lat: bot.pos.lat + dLat * f, lon: bot.pos.lon + dLon * f };
  }

  function onArrive() {
    if (bot.phase === 'to_pickup') advance('arrived_pickup');
    else if (bot.phase === 'to_dropoff') advance('delivered');
    else bot.target = randomPoint();
  }

  async function report() {
    if (bot.socket) {
      if (!bot.socket.destroyed) {
        bot.socket.write(buildPosition({ lat: bot.pos.lat, lon: bot.pos.lon, speedKmh: 20 }, bot.serial++));
      }
    } else {
      const q = new URLSearchParams({
        id: bot.name, lat: bot.pos.lat, lon: bot.pos.lon, speed: '20', mode: bot.mode,
      });
      await fetch(`${baseUrl.osmand}/?${q}`).catch(() => {});
    }
  }

  async function workJobs() {
    if (bot.job) return;
    const offer = await getJson(`${baseUrl.api}/api/vehicles/${bot.storeId}/offer`);
    if (!offer) return;
    const job = await postJson(`${baseUrl.api}/api/jobs/${offer.id}/respond`, {
      vehicleId: bot.storeId, accept: true,
    });
    if (!job || job.error) return;
    bot.job = job;
    bot.phase = 'to_pickup';
    bot.target = job.pickup;
  }

  async function advance(reached) {
    const job = await postJson(`${baseUrl.api}/api/jobs/${bot.job.id}/advance`, { vehicleId: bot.storeId });
    if (!job || job.error) { reset(); return; }
    if (reached === 'arrived_pickup') {
      // pause at pickup, then depart
      await postJson(`${baseUrl.api}/api/jobs/${bot.job.id}/advance`, { vehicleId: bot.storeId });
      bot.phase = 'to_dropoff';
      bot.target = bot.job.dropoff;
    } else {
      // delivered → settle and go back to wandering
      await postJson(`${baseUrl.api}/api/jobs/${bot.job.id}/advance`, { vehicleId: bot.storeId });
      reset();
    }
  }

  function reset() {
    bot.job = null;
    bot.phase = 'wander';
    bot.target = randomPoint();
  }

  return { tick, name };
}

async function getJson(url) {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}

async function postJson(url, body) {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch {
    return null;
  }
}
