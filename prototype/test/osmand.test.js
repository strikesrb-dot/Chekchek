import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePositions } from '../server/osmand.js';

const url = (s) => new URL(s, 'http://localhost');

test('parses legacy OsmAnd query style', () => {
  const [p] = parsePositions(url('/?id=test&lat=14.6934&lon=-17.444&speed=10&bearing=90'), '');
  assert.equal(p.id, 'test');
  assert.equal(p.lat, 14.6934);
  assert.equal(p.lon, -17.444);
  assert.equal(p.speed, 10);
  assert.equal(p.course, 90);
  assert.ok(p.ts > 1_700_000_000_000); // defaults to "now", not epoch zero
});

test('query timestamp in seconds is converted to milliseconds', () => {
  const [p] = parsePositions(url('/?id=a&lat=1&lon=2&timestamp=1783369186'), '');
  assert.equal(p.ts, 1_783_369_186_000);
});

test('parses modern iOS Traccar Client JSON POST (Transistorsoft shape)', () => {
  const body = JSON.stringify({
    location: {
      timestamp: '2026-07-06T20:30:00.000Z',
      coords: { latitude: 40.7128, longitude: -74.006, speed: 5, heading: 180, accuracy: 10 },
      is_moving: true,
    },
    device_id: 'myphone',
  });
  const [p] = parsePositions(url('/'), body);
  assert.equal(p.id, 'myphone');
  assert.equal(p.lat, 40.7128);
  assert.equal(p.lon, -74.006);
  assert.equal(p.speed, 18); // 5 m/s → 18 km/h
  assert.equal(p.course, 180);
  assert.equal(p.ts, Date.parse('2026-07-06T20:30:00.000Z'));
});

test('JSON with device_id only in query params still resolves the id', () => {
  const body = JSON.stringify({ location: { coords: { latitude: 1, longitude: 2 } } });
  const [p] = parsePositions(url('/?device_id=phone2'), body);
  assert.equal(p.id, 'phone2');
});

test('batch JSON bodies produce one position per location', () => {
  const body = JSON.stringify({
    location: [
      { coords: { latitude: 1, longitude: 2 }, timestamp: '2026-07-06T20:00:00Z' },
      { coords: { latitude: 3, longitude: 4 }, timestamp: '2026-07-06T20:00:10Z' },
    ],
    device_id: 'batch',
  });
  const ps = parsePositions(url('/'), body);
  assert.equal(ps.length, 2);
  assert.deepEqual(ps.map((p) => p.lat), [1, 3]);
});

test('garbage requests parse to nothing', () => {
  assert.deepEqual(parsePositions(url('/?lat=1&lon=2'), ''), []); // no id
  assert.deepEqual(parsePositions(url('/'), 'not json'), []);
  assert.deepEqual(parsePositions(url('/'), '{"location":{"coords":{}}}'), []);
});
