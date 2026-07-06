// GT06 protocol codec — the wire protocol spoken by the ubiquitous $10–25
// Chinese GPS trackers (Concox/Jimi GT06 family, Sinotrack, and clones).
// Frame: 0x78 0x78 | LEN | PROTO | PAYLOAD… | SERIAL(2) | CRC-ITU(2) | 0x0D 0x0A
// LEN counts PROTO through CRC inclusive. CRC covers LEN through SERIAL.
// Bit layout of the course/status word follows the de-facto standard also used
// by Traccar's decoder (bit12 = GPS valid, bit11 = west, bit10 = north).

export const PROTO = {
  LOGIN: 0x01,
  GPS: 0x12,
  HEARTBEAT: 0x13,
  GPS_ALT: 0x22,
};

// CRC-ITU (X.25): poly 0x8408 reflected, init 0xFFFF, final complement.
const CRC_TABLE = (() => {
  const table = new Uint16Array(256);
  for (let i = 0; i < 256; i++) {
    let fcs = i;
    for (let bit = 0; bit < 8; bit++) {
      fcs = fcs & 1 ? (fcs >>> 1) ^ 0x8408 : fcs >>> 1;
    }
    table[i] = fcs;
  }
  return table;
})();

export function crcItu(bytes) {
  let fcs = 0xffff;
  for (const b of bytes) fcs = ((fcs >>> 8) ^ CRC_TABLE[(fcs ^ b) & 0xff]) & 0xffff;
  return ~fcs & 0xffff;
}

// Pull complete frames off a stream buffer. Returns decoded frames plus the
// unconsumed remainder (partial frame still in flight).
export function extractFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset + 5 <= buffer.length) {
    if (buffer[offset] !== 0x78 || buffer[offset + 1] !== 0x78) {
      offset++; // resync: skip garbage until a start marker
      continue;
    }
    const len = buffer[offset + 2];
    const total = 2 + 1 + len + 2; // start(2) + len(1) + body(len) + stop(2)
    if (offset + total > buffer.length) break; // incomplete — wait for more bytes
    const frame = buffer.subarray(offset, offset + total);
    const decoded = decodeFrame(frame);
    if (decoded) frames.push(decoded);
    offset += total;
  }
  return { frames, rest: buffer.subarray(offset) };
}

export function decodeFrame(frame) {
  const len = frame[2];
  const body = frame.subarray(2, 3 + len); // LEN..SERIAL — the CRC-covered span
  const crcGiven = frame.readUInt16BE(len + 1); // bytes 3+len-2 .. 3+len-1
  const crcCalc = crcItu(body.subarray(0, body.length - 2));
  const protocol = frame[3];
  const serial = frame.readUInt16BE(len - 1); // bytes 3+len-4 .. 3+len-3
  if (crcGiven !== crcCalc) return { protocol, serial, ok: false, error: 'bad crc' };

  const payload = frame.subarray(4, 4 + len - 5);
  const base = { protocol, serial, ok: true };

  if (protocol === PROTO.LOGIN) return { ...base, type: 'login', imei: bcdImei(payload.subarray(0, 8)) };
  if (protocol === PROTO.HEARTBEAT) return { ...base, type: 'heartbeat' };
  if (protocol === PROTO.GPS || protocol === PROTO.GPS_ALT) {
    return { ...base, type: 'position', ...decodeGps(payload) };
  }
  return { ...base, type: 'unknown' };
}

function decodeGps(p) {
  const ts = Date.UTC(2000 + p[0], p[1] - 1, p[2], p[3], p[4], p[5]);
  const satellites = p[6] & 0x0f;
  let lat = p.readUInt32BE(7) / 1_800_000; // raw = minutes * 30000
  let lon = p.readUInt32BE(11) / 1_800_000;
  const speedKmh = p[15];
  const flags = p.readUInt16BE(16);
  const course = flags & 0x03ff;
  if (!(flags & (1 << 10))) lat = -lat; // bit10 set = North
  if (flags & (1 << 11)) lon = -lon; // bit11 set = West
  const valid = Boolean(flags & (1 << 12));
  return { ts, satellites, lat, lon, speedKmh, course, valid };
}

function bcdImei(bytes) {
  let digits = '';
  for (const b of bytes) digits += (b >> 4).toString(16) + (b & 0x0f).toString(16);
  return digits.replace(/^0+(?=\d{15}$)/, ''); // 8 BCD bytes = 16 digits, IMEI is 15
}

// Server ack the tracker expects (same shape for login/heartbeat/position).
export function buildResponse(protocol, serial) {
  const body = Buffer.from([0x05, protocol, serial >> 8, serial & 0xff]);
  const crc = crcItu(body);
  return Buffer.concat([
    Buffer.from([0x78, 0x78]),
    body,
    Buffer.from([crc >> 8, crc & 0xff, 0x0d, 0x0a]),
  ]);
}
