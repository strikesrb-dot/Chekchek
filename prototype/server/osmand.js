// Phone-tracking HTTP endpoint. Accepts both dialects real apps speak:
//  1. Legacy OsmAnd query style (Traccar Client Android, many apps):
//       GET/POST /?id=<device>&lat=..&lon=..&speed=..&bearing=..&timestamp=..
//  2. Modern Traccar Client iOS (Transistorsoft JSON):
//       POST / with body {"location":{"timestamp":ISO,"coords":{"latitude":..,
//       "longitude":..,"speed":m/s,"heading":..},...},"device_id":"..."}
// `mode` query param is our extension so a test phone can register as any mode.

import http from 'node:http';
import { isVehicleMode } from './modes.js';

// Pure parser: returns an array of {id, lat, lon, speed(km/h), course, ts}.
export function parsePositions(url, bodyText) {
  const q = url.searchParams;
  const qId = q.get('id') ?? q.get('deviceid') ?? q.get('device_id');

  let body = null;
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch {
      body = null; // not JSON — fall through to query-style
    }
  }

  if (body) {
    const rootId = body.device_id ?? body.id ?? qId;
    const locs = Array.isArray(body) ? body
      : Array.isArray(body.location) ? body.location
      : body.location ? [body.location]
      : [body];
    const positions = [];
    for (const loc of locs) {
      const c = loc.coords ?? loc;
      const lat = Number(c.latitude ?? c.lat);
      const lon = Number(c.longitude ?? c.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
      const speedMs = Number(c.speed);
      positions.push({
        id: String(loc.device_id ?? rootId ?? ''),
        lat,
        lon,
        speed: Number.isFinite(speedMs) && speedMs > 0 ? speedMs * 3.6 : 0,
        course: numberOr(c.heading, 0),
        ts: loc.timestamp ? Date.parse(loc.timestamp) || Date.now() : Date.now(),
      });
    }
    const valid = positions.filter((p) => p.id);
    if (valid.length) return valid;
  }

  const lat = Number(q.get('lat'));
  const lon = Number(q.get('lon'));
  if (!qId || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
  // Number(null) is 0, so guard for the param's absence before parsing.
  const tsRaw = q.has('timestamp') ? Number(q.get('timestamp')) : NaN;
  return [{
    id: qId,
    lat,
    lon,
    speed: numberOr(q.get('speed'), 0),
    course: numberOr(q.get('bearing'), 0),
    // OsmAnd timestamps may be seconds or milliseconds since epoch.
    ts: Number.isFinite(tsRaw) ? (tsRaw < 10_000_000_000 ? tsRaw * 1000 : tsRaw) : Date.now(),
  }];
}

export function startOsmandServer(store, port, log = console.log) {
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      const url = new URL(req.url, 'http://localhost');
      const positions = parsePositions(url, raw);
      if (positions.length === 0) {
        res.writeHead(400).end('missing id/lat/lon');
        return;
      }
      const mode = isVehicleMode(url.searchParams.get('mode')) ? url.searchParams.get('mode') : 'moto';
      for (const p of positions) {
        store.upsertVehicle({ id: `osmand-${p.id}`, mode, source: 'osmand', label: p.id });
        store.setPosition(`osmand-${p.id}`, p);
      }
      res.writeHead(200).end('OK');
    });
  });

  server.listen(port, () => log(`[osmand] phone gateway listening on http :${port}`));
  return server;
}

function numberOr(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
