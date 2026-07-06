// JSON API route handlers. Transport concerns (server, static files, SSE) live
// in http.js; this file maps API routes onto store + dispatch operations.

import { isVehicleMode } from './modes.js';

export function createApi(store, dispatch) {
  // Each entry: [method, regex, handler(match, body) -> {status, data}]
  const routes = [
    ['GET', /^\/api\/state$/, () => ok(store.snapshot())],

    ['POST', /^\/api\/vehicles$/, (_m, body) => {
      if (!isVehicleMode(body.mode)) return err(400, `mode must be a known vehicle mode`);
      if (!body.id || typeof body.id !== 'string') return err(400, 'id required');
      return ok(store.upsertVehicle({ id: body.id, mode: body.mode, label: body.label, source: body.source ?? 'app' }));
    }],

    ['POST', /^\/api\/vehicles\/([^/]+)\/position$/, (m, body) => {
      const { lat, lon } = body;
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return err(400, 'lat/lon required');
      const v = store.setPosition(m[1], { lat, lon, speed: body.speed ?? 0, course: body.course ?? 0 });
      return v ? ok(v) : err(404, 'unknown vehicle');
    }],

    ['POST', /^\/api\/vehicles\/([^/]+)\/status$/, (m, body) => {
      if (!['offline', 'available', 'busy'].includes(body.status)) return err(400, 'bad status');
      const v = store.setStatus(m[1], body.status);
      return v ? ok(v) : err(404, 'unknown vehicle');
    }],

    ['GET', /^\/api\/vehicles\/([^/]+)\/offer$/, (m) => ok(dispatch.currentOfferFor(m[1]))],

    ['POST', /^\/api\/jobs$/, (_m, body) => {
      if (!isVehicleMode(body.mode)) return err(400, 'mode must be a known vehicle mode');
      if (!isPoint(body.pickup) || !isPoint(body.dropoff)) return err(400, 'pickup/dropoff {lat,lon} required');
      return ok(dispatch.requestJob(body));
    }],

    ['POST', /^\/api\/jobs\/([^/]+)\/respond$/, (m, body) =>
      guarded(() => dispatch.respond(m[1], body.vehicleId, Boolean(body.accept)))],

    ['POST', /^\/api\/jobs\/([^/]+)\/advance$/, (m, body) =>
      guarded(() => dispatch.advance(m[1], body.vehicleId))],

    ['POST', /^\/api\/jobs\/([^/]+)\/cancel$/, (m) => guarded(() => dispatch.cancel(m[1]))],
  ];

  function handle(method, path, body) {
    for (const [m, re, fn] of routes) {
      if (m !== method) continue;
      const match = path.match(re);
      if (match) return fn(match, body ?? {});
    }
    return null; // not an API route
  }

  return { handle };
}

const ok = (data) => ({ status: 200, data });
const err = (status, message) => ({ status, data: { error: message } });
const isPoint = (p) => p && Number.isFinite(p.lat) && Number.isFinite(p.lon);

function guarded(fn) {
  try {
    return ok(fn());
  } catch (e) {
    return err(409, e.message);
  }
}
