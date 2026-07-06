// TCP listener for GT06-family hardware trackers. Protocol decoding lives in
// gt06.js; this file only maps connections/IMEIs onto the vehicle registry.

import net from 'node:net';
import { extractFrames, buildResponse } from './gt06.js';

export function startGt06Server(store, port, log = console.log) {
  const server = net.createServer((socket) => {
    let buffer = Buffer.alloc(0);
    let imei = null;

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);
      const { frames, rest } = extractFrames(buffer);
      buffer = Buffer.from(rest);

      for (const frame of frames) {
        if (!frame.ok) continue; // bad CRC — drop silently, tracker will resend

        if (frame.type === 'login') {
          imei = frame.imei;
          store.upsertVehicle({
            id: `gt06-${imei}`,
            mode: 'moto', // registry can reassign the true mode after install
            label: `Box ${imei.slice(-6)}`,
            source: 'gt06',
          });
          log(`[gt06] login imei=${imei}`);
        }

        if (frame.type === 'position' && imei && frame.valid) {
          store.setPosition(`gt06-${imei}`, {
            lat: frame.lat,
            lon: frame.lon,
            speed: frame.speedKmh,
            course: frame.course,
            ts: frame.ts,
          });
        }

        socket.write(buildResponse(frame.protocol, frame.serial));
      }
    });

    socket.on('error', () => socket.destroy());
  });

  server.listen(port, () => log(`[gt06] tracker gateway listening on tcp :${port}`));
  return server;
}
