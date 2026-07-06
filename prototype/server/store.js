// In-memory system of record for the prototype: vehicles, jobs, and a live
// grid-cell index. Emits events so transports (SSE) and dispatch can react.
// The production equivalent is Redis (live state) + Postgres (history).

import { EventEmitter } from 'node:events';
import { cellKey, ringKeys, haversineKm } from './geo.js';
import { isVehicleMode } from './modes.js';

export function createStore() {
  const events = new EventEmitter();
  events.setMaxListeners(0);
  const vehicles = new Map(); // id -> vehicle
  const jobs = new Map(); // id -> job
  const cells = new Map(); // cellKey -> Set<vehicleId>
  let jobSeq = 0;

  function upsertVehicle({ id, mode, label, source }) {
    if (!isVehicleMode(mode)) throw new Error(`unknown vehicle mode: ${mode}`);
    const existing = vehicles.get(id);
    const vehicle = existing ?? {
      id,
      mode,
      label: label ?? id,
      source: source ?? 'app',
      status: 'offline',
      pos: null,
      lastSeen: null,
    };
    if (existing) {
      if (label) vehicle.label = label;
      if (source) vehicle.source = source;
    } else {
      vehicles.set(id, vehicle);
    }
    events.emit('vehicle', vehicle);
    return vehicle;
  }

  function setPosition(id, { lat, lon, speed = 0, course = 0, ts = Date.now() }) {
    const vehicle = vehicles.get(id);
    if (!vehicle) return null;
    if (vehicle.pos) removeFromCell(vehicle);
    vehicle.pos = { lat, lon, speed, course, ts };
    vehicle.lastSeen = Date.now();
    if (vehicle.status === 'offline') vehicle.status = 'available';
    addToCell(vehicle);
    events.emit('position', vehicle);
    return vehicle;
  }

  function setStatus(id, status) {
    const vehicle = vehicles.get(id);
    if (!vehicle) return null;
    vehicle.status = status;
    events.emit('vehicle', vehicle);
    return vehicle;
  }

  function addToCell(vehicle) {
    const key = cellKey(vehicle.pos.lat, vehicle.pos.lon);
    if (!cells.has(key)) cells.set(key, new Set());
    cells.get(key).add(vehicle.id);
    vehicle.cell = key;
  }

  function removeFromCell(vehicle) {
    const set = cells.get(vehicle.cell);
    if (set) {
      set.delete(vehicle.id);
      if (set.size === 0) cells.delete(vehicle.cell);
    }
  }

  // Nearest candidates for dispatch: search cell rings outward, then rank by
  // straight-line distance. Falls back to a full scan if the index comes up dry.
  function nearestAvailable({ point, mode, limit = 20, exclude = new Set(), staleAfterMs = 120_000 }) {
    const now = Date.now();
    const eligible = (v) =>
      v.status === 'available' &&
      v.mode === mode &&
      v.pos &&
      now - v.lastSeen <= staleAfterMs &&
      !exclude.has(v.id);

    const found = new Map();
    for (let radius = 0; radius <= 20 && found.size < limit; radius++) {
      for (const key of ringKeys(point.lat, point.lon, radius)) {
        for (const id of cells.get(key) ?? []) {
          const v = vehicles.get(id);
          if (v && eligible(v)) found.set(id, v);
        }
      }
    }
    if (found.size === 0) {
      for (const v of vehicles.values()) if (eligible(v)) found.set(v.id, v);
    }
    return [...found.values()]
      .sort((a, b) => haversineKm(point, a.pos) - haversineKm(point, b.pos))
      .slice(0, limit);
  }

  function createJob({ mode, pickup, dropoff, note }) {
    const job = {
      id: `job-${++jobSeq}`,
      mode,
      pickup,
      dropoff,
      note: note ?? null,
      state: 'requested',
      offeredTo: null,
      assignedTo: null,
      declined: [],
      history: [{ state: 'requested', ts: Date.now() }],
      createdAt: Date.now(),
    };
    jobs.set(job.id, job);
    events.emit('job', job);
    return job;
  }

  function updateJob(job, patch) {
    Object.assign(job, patch);
    if (patch.state) job.history.push({ state: patch.state, ts: Date.now() });
    events.emit('job', job);
    return job;
  }

  function snapshot() {
    return {
      vehicles: [...vehicles.values()],
      jobs: [...jobs.values()],
    };
  }

  return {
    events,
    vehicles,
    jobs,
    upsertVehicle,
    setPosition,
    setStatus,
    nearestAvailable,
    createJob,
    updateJob,
    snapshot,
  };
}
