// Dispatch engine: nearest-available-vehicle matching with an offer cascade.
// Rules are deliberately simple and explainable (see docs/03-architecture.md §4):
// filter by mode/availability, rank by distance, offer with a timeout, cascade.

import { JOB_ADVANCE } from './modes.js';

export function createDispatch(store, options = {}) {
  const offerTimeoutMs = options.offerTimeoutMs ?? 15_000;
  const requeueDelayMs = options.requeueDelayMs ?? 10_000;
  const maxCandidates = options.maxOfferCandidates ?? 20;
  const staleAfterMs = options.staleAfterMs ?? 120_000;
  const timers = new Map(); // jobId -> Timeout

  function requestJob({ mode, pickup, dropoff, note }) {
    const job = store.createJob({ mode, pickup, dropoff, note });
    offerNext(job);
    return job;
  }

  function offerNext(job) {
    clearTimer(job.id);
    if (job.state !== 'requested' && job.state !== 'offered') return;

    const candidates = store.nearestAvailable({
      point: job.pickup,
      mode: job.mode,
      limit: maxCandidates,
      exclude: new Set(job.declined),
      staleAfterMs,
    });

    if (candidates.length === 0) {
      // Nobody suitable right now — go back to the queue and retry shortly.
      store.updateJob(job, { state: 'requested', offeredTo: null });
      timers.set(job.id, setTimeout(() => offerNext(job), requeueDelayMs));
      return;
    }

    const vehicle = candidates[0];
    store.updateJob(job, { state: 'offered', offeredTo: vehicle.id });
    timers.set(
      job.id,
      setTimeout(() => {
        // Offer expired: treat as a decline and cascade to the next candidate.
        if (job.state === 'offered' && job.offeredTo === vehicle.id) {
          job.declined.push(vehicle.id);
          store.updateJob(job, { state: 'requested', offeredTo: null });
          offerNext(job);
        }
      }, offerTimeoutMs),
    );
  }

  function respond(jobId, vehicleId, accept) {
    const job = store.jobs.get(jobId);
    if (!job) throw new Error(`unknown job: ${jobId}`);
    if (job.state !== 'offered' || job.offeredTo !== vehicleId) {
      throw new Error(`job ${jobId} is not offered to ${vehicleId}`);
    }
    clearTimer(job.id);
    if (accept) {
      store.updateJob(job, { state: 'accepted', assignedTo: vehicleId, offeredTo: null });
      store.setStatus(vehicleId, 'busy');
    } else {
      job.declined.push(vehicleId);
      store.updateJob(job, { state: 'requested', offeredTo: null });
      offerNext(job);
    }
    return job;
  }

  // Assigned worker taps through the lifecycle: accepted → arrived_pickup →
  // in_transit → delivered → settled. Delivery frees the vehicle.
  function advance(jobId, vehicleId) {
    const job = store.jobs.get(jobId);
    if (!job) throw new Error(`unknown job: ${jobId}`);
    if (job.assignedTo !== vehicleId) throw new Error(`job ${jobId} not assigned to ${vehicleId}`);
    const next = JOB_ADVANCE[job.state];
    if (!next) throw new Error(`job ${jobId} cannot advance from ${job.state}`);
    store.updateJob(job, { state: next });
    if (next === 'delivered') store.setStatus(vehicleId, 'available');
    return job;
  }

  function cancel(jobId) {
    const job = store.jobs.get(jobId);
    if (!job) throw new Error(`unknown job: ${jobId}`);
    clearTimer(job.id);
    if (job.assignedTo) store.setStatus(job.assignedTo, 'available');
    return store.updateJob(job, { state: 'cancelled', offeredTo: null });
  }

  function currentOfferFor(vehicleId) {
    for (const job of store.jobs.values()) {
      if (job.state === 'offered' && job.offeredTo === vehicleId) return job;
    }
    return null;
  }

  function clearTimer(jobId) {
    const t = timers.get(jobId);
    if (t) clearTimeout(t);
    timers.delete(jobId);
  }

  function stop() {
    for (const t of timers.values()) clearTimeout(t);
    timers.clear();
  }

  return { requestJob, respond, advance, cancel, currentOfferFor, offerNext, stop };
}
