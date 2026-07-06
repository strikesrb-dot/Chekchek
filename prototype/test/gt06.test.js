import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crcItu, extractFrames, decodeFrame, buildResponse } from '../server/gt06.js';
import { buildLogin, buildPosition } from '../sim/gt06-encode.js';

// Reference login packet from the public GT06 protocol documentation:
// imei 123456789012345, serial 1, CRC 0x8CDD.
const DOC_LOGIN = Buffer.from('78780d01012345678901234500018cdd0d0a', 'hex');

test('CRC-ITU matches the documented login packet', () => {
  const body = DOC_LOGIN.subarray(2, DOC_LOGIN.length - 4);
  assert.equal(crcItu(body), 0x8cdd);
});

test('decodes the documented login packet', () => {
  const { frames, rest } = extractFrames(DOC_LOGIN);
  assert.equal(frames.length, 1);
  assert.equal(rest.length, 0);
  assert.deepEqual(
    { type: frames[0].type, imei: frames[0].imei, serial: frames[0].serial, ok: frames[0].ok },
    { type: 'login', imei: '123456789012345', serial: 1, ok: true },
  );
});

test('position packet round-trips through encoder and decoder', () => {
  const sent = {
    date: new Date(Date.UTC(2026, 6, 6, 12, 30, 15)),
    lat: 14.7167, // Dakar — north, west
    lon: -17.4677,
    speedKmh: 33,
    course: 270,
    valid: true,
  };
  const decoded = decodeFrame(buildPosition(sent, 42));
  assert.equal(decoded.ok, true);
  assert.equal(decoded.type, 'position');
  assert.equal(decoded.serial, 42);
  assert.ok(Math.abs(decoded.lat - sent.lat) < 1e-5, `lat ${decoded.lat}`);
  assert.ok(Math.abs(decoded.lon - sent.lon) < 1e-5, `lon ${decoded.lon}`);
  assert.equal(decoded.speedKmh, 33);
  assert.equal(decoded.course, 270);
  assert.equal(decoded.valid, true);
  assert.equal(decoded.ts, sent.date.getTime());
});

test('southern/eastern coordinates round-trip correctly', () => {
  const sent = { lat: -4.32, lon: 15.31, speedKmh: 10, course: 90, valid: true }; // Kinshasa-ish
  const decoded = decodeFrame(buildPosition(sent, 7));
  assert.ok(Math.abs(decoded.lat - sent.lat) < 1e-5);
  assert.ok(Math.abs(decoded.lon - sent.lon) < 1e-5);
});

test('rejects a corrupted frame via CRC', () => {
  const packet = buildLogin('351608041797115', 9);
  packet[6] ^= 0xff; // flip bits inside the IMEI
  const decoded = decodeFrame(packet);
  assert.equal(decoded.ok, false);
});

test('extractFrames resyncs across garbage and partial frames', () => {
  const a = buildLogin('351608041797115', 1);
  const b = buildPosition({ lat: 14.7, lon: -17.45 }, 2);
  const stream = Buffer.concat([Buffer.from([0x00, 0xff, 0x13]), a, b.subarray(0, 10)]);
  const { frames, rest } = extractFrames(stream);
  assert.equal(frames.length, 1);
  assert.equal(frames[0].type, 'login');
  assert.deepEqual(rest, b.subarray(0, 10));
});

test('server ack has the documented shape', () => {
  const ack = buildResponse(0x01, 1);
  assert.equal(ack.length, 10);
  assert.deepEqual([...ack.subarray(0, 5)], [0x78, 0x78, 0x05, 0x01, 0x00]);
  assert.deepEqual([...ack.subarray(-2)], [0x0d, 0x0a]);
});
