// GT06 frame *encoder* — used by the simulator and tests to act like real
// tracker hardware against the server's decoder (server/gt06.js).

import { crcItu, PROTO } from '../server/gt06.js';

export function buildLogin(imei, serial = 1) {
  const digits = imei.padStart(16, '0');
  const payload = Buffer.alloc(8);
  for (let i = 0; i < 8; i++) {
    payload[i] = (parseInt(digits[i * 2], 16) << 4) | parseInt(digits[i * 2 + 1], 16);
  }
  return frame(PROTO.LOGIN, payload, serial);
}

export function buildPosition({ date = new Date(), lat, lon, speedKmh = 0, course = 0, valid = true, satellites = 9 }, serial = 1) {
  const payload = Buffer.alloc(18);
  payload[0] = date.getUTCFullYear() - 2000;
  payload[1] = date.getUTCMonth() + 1;
  payload[2] = date.getUTCDate();
  payload[3] = date.getUTCHours();
  payload[4] = date.getUTCMinutes();
  payload[5] = date.getUTCSeconds();
  payload[6] = (12 << 4) | (satellites & 0x0f);
  payload.writeUInt32BE(Math.round(Math.abs(lat) * 1_800_000), 7);
  payload.writeUInt32BE(Math.round(Math.abs(lon) * 1_800_000), 11);
  payload[15] = Math.min(255, Math.round(speedKmh));
  let flags = Math.round(course) & 0x03ff;
  if (lat >= 0) flags |= 1 << 10; // north
  if (lon < 0) flags |= 1 << 11; // west
  if (valid) flags |= 1 << 12;
  payload.writeUInt16BE(flags, 16);
  return frame(PROTO.GPS, payload, serial);
}

function frame(protocol, payload, serial) {
  const len = payload.length + 5;
  const body = Buffer.concat([
    Buffer.from([len, protocol]),
    payload,
    Buffer.from([serial >> 8, serial & 0xff]),
  ]);
  const crc = crcItu(body);
  return Buffer.concat([
    Buffer.from([0x78, 0x78]),
    body,
    Buffer.from([crc >> 8, crc & 0xff, 0x0d, 0x0a]),
  ]);
}
