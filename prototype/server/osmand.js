// OsmAnd-protocol HTTP endpoint — the simplest widely-supported phone protocol
// (Traccar Client, OsmAnd tracker and many apps speak it). One GET/POST per fix:
//   /?id=<device>&lat=..&lon=..&speed=..&bearing=..&timestamp=..&mode=moto
// `mode` is our extension so a test phone can register as any vehicle type.

import http from 'node:http';
import { isVehicleMode } from './modes.js';

export function startOsmandServer(store, port, log = console.log) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const q = url.searchParams;
    const id = q.get('id') ?? q.get('deviceid');
    const lat = Number(q.get('lat'));
    const lon = Number(q.get('lon'));

    if (!id || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      res.writeHead(400).end('missing id/lat/lon');
      return;
    }

    const mode = isVehicleMode(q.get('mode')) ? q.get('mode') : 'moto';
    store.upsertVehicle({ id: `osmand-${id}`, mode, source: 'osmand', label: id });

    // Number(null) is 0, so guard for the param's absence before parsing.
    const tsRaw = q.has('timestamp') ? Number(q.get('timestamp')) : NaN;
    store.setPosition(`osmand-${id}`, {
      lat,
      lon,
      speed: numberOr(q.get('speed'), 0),
      course: numberOr(q.get('bearing'), 0),
      // OsmAnd timestamps may be seconds or milliseconds since epoch.
      ts: Number.isFinite(tsRaw) ? (tsRaw < 10_000_000_000 ? tsRaw * 1000 : tsRaw) : Date.now(),
    });
    res.writeHead(200).end('OK');
  });

  server.listen(port, () => log(`[osmand] phone gateway listening on http :${port}`));
  return server;
}

function numberOr(raw, fallback) {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}
