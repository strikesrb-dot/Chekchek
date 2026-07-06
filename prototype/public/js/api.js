// Thin client for the prototype API + the SSE live stream.

export async function apiGet(path) {
  const res = await fetch(path);
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

// Subscribe to live events. handlers: {snapshot, position, vehicle, job}
export function subscribe(handlers) {
  const source = new EventSource('/events');
  for (const [event, handler] of Object.entries(handlers)) {
    source.addEventListener(event, (e) => handler(JSON.parse(e.data)));
  }
  return source;
}
