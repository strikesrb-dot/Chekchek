// Main HTTP server: static files for the dashboard/rider pages, the JSON API
// (handlers in api.js), and a Server-Sent Events stream for live updates.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

export function startHttpServer(store, api, port, log = console.log) {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');

    if (url.pathname === '/events') return openEventStream(store, req, res);

    if (url.pathname.startsWith('/api/')) {
      const body = req.method === 'POST' ? await readJson(req) : null;
      const result = api.handle(req.method, url.pathname, body);
      if (result) {
        res.writeHead(result.status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(result.data));
      } else {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end('{"error":"not found"}');
      }
      return;
    }

    await serveStatic(url.pathname, res);
  });

  server.listen(port, () => log(`[http] dashboard http://localhost:${port}  rider http://localhost:${port}/rider`));
  return server;
}

function openEventStream(store, req, res) {
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  });
  res.write(`event: snapshot\ndata: ${JSON.stringify(store.snapshot())}\n\n`);

  const send = (event) => (data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  const onPosition = send('position');
  const onVehicle = send('vehicle');
  const onJob = send('job');
  store.events.on('position', onPosition);
  store.events.on('vehicle', onVehicle);
  store.events.on('job', onJob);
  const keepalive = setInterval(() => res.write(': keepalive\n\n'), 25_000);

  req.on('close', () => {
    clearInterval(keepalive);
    store.events.off('position', onPosition);
    store.events.off('vehicle', onVehicle);
    store.events.off('job', onJob);
  });
}

async function serveStatic(pathname, res) {
  const routeMap = { '/': '/dashboard.html', '/rider': '/rider.html' };
  const rel = routeMap[pathname] ?? pathname;
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404).end('not found');
  }
}

function readJson(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch {
        resolve({});
      }
    });
  });
}
