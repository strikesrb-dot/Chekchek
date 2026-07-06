// Ops dashboard: live vehicles + jobs, click-to-create a job. State flows in
// from the SSE stream; user actions go out through api.js.

import { VEHICLE_MODES, MODE_COLORS, JOB_STATE_LABELS } from './config.js';
import { apiPost, subscribe } from './api.js';
import { createMap } from './map.js';

const ui = {
  mode: document.getElementById('job-mode'),
  create: document.getElementById('job-create'),
  reset: document.getElementById('job-reset'),
  hint: document.getElementById('job-hint'),
  jobs: document.getElementById('jobs'),
  vehicles: document.getElementById('vehicles'),
  stats: document.getElementById('stats'),
};

const state = { vehicles: new Map(), jobs: new Map(), pickup: null, dropoff: null, pins: [] };
const view = createMap('map');

VEHICLE_MODES.forEach((m) => ui.mode.add(new Option(m, m)));

view.map.on('click', (e) => {
  const point = { lat: e.latlng.lat, lon: e.latlng.lng };
  if (!state.pickup) {
    state.pickup = point;
    state.pins.push(view.addPin(point, 'Pickup'));
    ui.hint.textContent = 'Now click the dropoff point.';
  } else if (!state.dropoff) {
    state.dropoff = point;
    state.pins.push(view.addPin(point, 'Dropoff'));
    ui.hint.textContent = 'Ready — request the job.';
    ui.create.disabled = false;
  }
});

ui.reset.onclick = () => {
  state.pickup = state.dropoff = null;
  state.pins.forEach(view.removeLayer);
  state.pins = [];
  ui.create.disabled = true;
  ui.hint.innerHTML = 'Click the map to set <b>pickup</b>, click again for <b>dropoff</b>.';
};

ui.create.onclick = async () => {
  await apiPost('/api/jobs', { mode: ui.mode.value, pickup: state.pickup, dropoff: state.dropoff });
  ui.reset.onclick();
};

subscribe({
  snapshot(snap) {
    snap.vehicles.forEach((v) => state.vehicles.set(v.id, v));
    snap.jobs.forEach((j) => state.jobs.set(j.id, j));
    render();
  },
  position(v) { state.vehicles.set(v.id, v); render(); },
  vehicle(v) { state.vehicles.set(v.id, v); render(); },
  job(j) { state.jobs.set(j.id, j); render(); },
});

function render() {
  for (const v of state.vehicles.values()) view.upsertVehicle(v);

  const counts = {};
  let online = 0;
  for (const v of state.vehicles.values()) {
    if (v.status !== 'offline') { online++; counts[v.mode] = (counts[v.mode] ?? 0) + 1; }
  }
  ui.stats.textContent = `${online} vehicles online · ` +
    Object.entries(counts).map(([m, n]) => `${n} ${m}`).join(' · ');

  ui.vehicles.replaceChildren(
    ...[...state.vehicles.values()].slice(0, 60).map((v) => {
      const li = document.createElement('li');
      li.innerHTML = `<span class="badge" style="background:${MODE_COLORS[v.mode]}">${v.mode}</span>` +
        `${escapeHtml(v.label)} <span class="muted">· ${v.status} · ${v.source}</span>`;
      return li;
    }),
  );

  const jobs = [...state.jobs.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 25);
  ui.jobs.replaceChildren(
    ...jobs.map((j) => {
      const li = document.createElement('li');
      const who = j.assignedTo ?? j.offeredTo;
      li.innerHTML = `<b>${j.id}</b> (${j.mode}) — ${JOB_STATE_LABELS[j.state] ?? j.state}` +
        (who ? ` <span class="muted">· ${escapeHtml(who)}</span>` : '');
      return li;
    }),
  );
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
