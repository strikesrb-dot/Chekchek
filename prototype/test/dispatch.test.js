import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../server/store.js';
import { createDispatch } from '../server/dispatch.js';

const PLATEAU = { lat: 14.6708, lon: -17.4381 };

function setup(options = {}) {
  const store = createStore();
  const dispatch = createDispatch(store, { offerTimeoutMs: 40, requeueDelayMs: 40, ...options });
  const add = (id, mode, lat, lon) => {
    store.upsertVehicle({ id, mode });
    store.setPosition(id, { lat, lon });
    return id;
  };
  return { store, dispatch, add };
}

test('offers to the nearest vehicle of the requested mode only', (t) => {
  const { store, dispatch, add } = setup();
  t.after(() => dispatch.stop());
  add('moto-near', 'moto', 14.671, -17.439);
  add('moto-far', 'moto', 14.75, -17.5);
  add('taxi-nearest', 'taxi', 14.6709, -17.4382); // closest of all, wrong mode

  const job = dispatch.requestJob({ mode: 'moto', pickup: PLATEAU, dropoff: { lat: 14.7, lon: -17.46 } });
  assert.equal(job.state, 'offered');
  assert.equal(job.offeredTo, 'moto-near');
});

test('decline cascades to the next candidate; accept assigns and marks busy', (t) => {
  const { store, dispatch, add } = setup();
  t.after(() => dispatch.stop());
  add('m1', 'moto', 14.671, -17.439);
  add('m2', 'moto', 14.68, -17.45);

  const job = dispatch.requestJob({ mode: 'moto', pickup: PLATEAU, dropoff: { lat: 14.7, lon: -17.46 } });
  dispatch.respond(job.id, 'm1', false);
  assert.equal(job.offeredTo, 'm2');

  dispatch.respond(job.id, 'm2', true);
  assert.equal(job.state, 'accepted');
  assert.equal(job.assignedTo, 'm2');
  assert.equal(store.vehicles.get('m2').status, 'busy');
});

test('offer times out and cascades automatically', async (t) => {
  const { dispatch, add } = setup();
  t.after(() => dispatch.stop());
  add('m1', 'moto', 14.671, -17.439);
  add('m2', 'moto', 14.68, -17.45);

  const job = dispatch.requestJob({ mode: 'moto', pickup: PLATEAU, dropoff: { lat: 14.7, lon: -17.46 } });
  assert.equal(job.offeredTo, 'm1');
  await new Promise((r) => setTimeout(r, 70));
  assert.equal(job.offeredTo, 'm2');
  assert.deepEqual(job.declined, ['m1']);
});

test('job with no candidates queues, then dispatches when a vehicle appears', async (t) => {
  const { dispatch, add } = setup();
  t.after(() => dispatch.stop());

  const job = dispatch.requestJob({ mode: 'truck', pickup: PLATEAU, dropoff: { lat: 14.7, lon: -17.46 } });
  assert.equal(job.state, 'requested');

  add('t1', 'truck', 14.672, -17.44);
  await new Promise((r) => setTimeout(r, 70));
  assert.equal(job.state, 'offered');
  assert.equal(job.offeredTo, 't1');
});

test('full lifecycle: accept → advance to settled frees the vehicle', (t) => {
  const { store, dispatch, add } = setup();
  t.after(() => dispatch.stop());
  add('m1', 'moto', 14.671, -17.439);

  const job = dispatch.requestJob({ mode: 'moto', pickup: PLATEAU, dropoff: { lat: 14.7, lon: -17.46 } });
  dispatch.respond(job.id, 'm1', true);
  for (const expected of ['arrived_pickup', 'in_transit', 'delivered', 'settled']) {
    dispatch.advance(job.id, 'm1');
    assert.equal(job.state, expected);
  }
  assert.equal(store.vehicles.get('m1').status, 'available');
  assert.throws(() => dispatch.advance(job.id, 'm1')); // cannot advance past settled
});

test('advance is rejected for a vehicle the job is not assigned to', (t) => {
  const { dispatch, add } = setup();
  t.after(() => dispatch.stop());
  add('m1', 'moto', 14.671, -17.439);
  add('m2', 'moto', 14.672, -17.44);
  const job = dispatch.requestJob({ mode: 'moto', pickup: PLATEAU, dropoff: { lat: 14.7, lon: -17.46 } });
  dispatch.respond(job.id, job.offeredTo, true);
  const other = job.assignedTo === 'm1' ? 'm2' : 'm1';
  assert.throws(() => dispatch.advance(job.id, other));
});
