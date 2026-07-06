import { test } from 'node:test';
import assert from 'node:assert/strict';
import { haversineKm, cellKey, ringKeys } from '../server/geo.js';
import { createStore } from '../server/store.js';

test('haversine: Dakar Plateau to Thiès is ~57 km', () => {
  const km = haversineKm({ lat: 14.6928, lon: -17.4467 }, { lat: 14.7886, lon: -16.926 });
  assert.ok(km > 54 && km < 60, `got ${km}`);
});

test('cell rings: ring 0 is the cell itself, ring 1 has 8 cells', () => {
  const p = { lat: 14.716, lon: -17.467 };
  assert.deepEqual(ringKeys(p.lat, p.lon, 0), [cellKey(p.lat, p.lon)]);
  assert.equal(ringKeys(p.lat, p.lon, 1).length, 8);
  assert.ok(!ringKeys(p.lat, p.lon, 1).includes(cellKey(p.lat, p.lon)));
});

test('nearestAvailable ranks by distance and respects mode/exclusions', () => {
  const store = createStore();
  for (const [id, lat, lon] of [
    ['a', 14.716, -17.467],
    ['b', 14.72, -17.47],
    ['c', 14.75, -17.51],
  ]) {
    store.upsertVehicle({ id, mode: 'moto' });
    store.setPosition(id, { lat, lon });
  }
  store.upsertVehicle({ id: 'taxi', mode: 'taxi' });
  store.setPosition('taxi', { lat: 14.716, lon: -17.467 });

  const point = { lat: 14.7161, lon: -17.4671 };
  const ranked = store.nearestAvailable({ point, mode: 'moto' }).map((v) => v.id);
  assert.deepEqual(ranked, ['a', 'b', 'c']);

  const excluded = store.nearestAvailable({ point, mode: 'moto', exclude: new Set(['a']) }).map((v) => v.id);
  assert.deepEqual(excluded, ['b', 'c']);
});

test('busy and stale vehicles are not candidates', () => {
  const store = createStore();
  store.upsertVehicle({ id: 'busy', mode: 'moto' });
  store.setPosition('busy', { lat: 14.716, lon: -17.467 });
  store.setStatus('busy', 'busy');

  store.upsertVehicle({ id: 'stale', mode: 'moto' });
  store.setPosition('stale', { lat: 14.716, lon: -17.467 });
  store.vehicles.get('stale').lastSeen = Date.now() - 10 * 60 * 1000;

  const found = store.nearestAvailable({ point: { lat: 14.716, lon: -17.467 }, mode: 'moto' });
  assert.equal(found.length, 0);
});
