import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLedger } from '../server/ledger.js';
import { ageCustomer, agingReport, bucketFor, AGING_BUCKETS } from '../server/aging.js';
import { landedCostPerUnit, quote } from '../server/landedcost.js';

const DAY = 24 * 60 * 60 * 1000;

test('debits accrue and balance reflects what a customer owes', () => {
  const L = createLedger();
  L.addCustomer({ id: 'modou', name: 'Modou Boutique' });
  L.postDebit('modou', { amount: 50000, note: '10 bags cement' });
  L.postDebit('modou', { amount: 30000, note: '6 bags cement' });
  assert.equal(L.balance('modou'), 80000);
});

test('payment applies FIFO: oldest debit clears first', () => {
  let t = 0;
  const L = createLedger(() => t);
  L.addCustomer({ id: 'c1' });
  t = 1000; L.postDebit('c1', { amount: 40000 }); // oldest
  t = 2000; L.postDebit('c1', { amount: 60000 });
  t = 3000;
  const { unappliedOverpayment } = L.postPayment('c1', { amount: 50000 });
  assert.equal(unappliedOverpayment, 0);
  assert.equal(L.balance('c1'), 50000);
  const open = L.openDebits('c1');
  // First debit fully paid (gone from open list), second partly paid (40k left).
  assert.equal(open.length, 1);
  assert.equal(open[0].remaining, 50000); // 60000 - 10000 leftover from first
});

test('overpayment is reported and leaves a zero balance', () => {
  const L = createLedger();
  L.addCustomer({ id: 'c2' });
  L.postDebit('c2', { amount: 20000 });
  const { unappliedOverpayment } = L.postPayment('c2', { amount: 25000 });
  assert.equal(unappliedOverpayment, 5000);
  assert.equal(L.balance('c2'), -5000); // customer is in credit
});

test('unknown customer and bad amounts fail loudly', () => {
  const L = createLedger();
  assert.throws(() => L.postDebit('ghost', { amount: 100 }));
  L.addCustomer({ id: 'c3' });
  assert.throws(() => L.postDebit('c3', { amount: -5 }));
  assert.throws(() => L.postPayment('c3', { amount: 0 }));
});

test('aging buckets classify by days outstanding', () => {
  assert.equal(bucketFor(0), '0-15');
  assert.equal(bucketFor(15), '0-15');
  assert.equal(bucketFor(16), '16-30');
  assert.equal(bucketFor(45), '31-60');
  assert.equal(bucketFor(90), '60+');
});

test('ageCustomer splits an unpaid tab across the right buckets', () => {
  let t = 0;
  const L = createLedger(() => t);
  L.addCustomer({ id: 'mason' });
  const now = 100 * DAY;
  t = now - 5 * DAY; L.postDebit('mason', { amount: 10000 }); // 0-15
  t = now - 40 * DAY; L.postDebit('mason', { amount: 20000 }); // 31-60
  t = now - 80 * DAY; L.postDebit('mason', { amount: 5000 }); // 60+
  const a = ageCustomer(L, 'mason', now);
  assert.equal(a.total, 35000);
  assert.equal(a.buckets['0-15'], 10000);
  assert.equal(a.buckets['31-60'], 20000);
  assert.equal(a.buckets['60+'], 5000);
  assert.equal(a.oldestDays, 80);
});

test('agingReport ranks worst-overdue first and sums the portfolio', () => {
  let t = 0;
  const L = createLedger(() => t);
  const now = 100 * DAY;
  L.addCustomer({ id: 'fresh' });
  L.addCustomer({ id: 'stale' });
  L.addCustomer({ id: 'paid' });
  t = now - 3 * DAY; L.postDebit('fresh', { amount: 100000 });
  t = now - 70 * DAY; L.postDebit('stale', { amount: 20000 });
  t = now - 10 * DAY; L.postDebit('paid', { amount: 8000 });
  L.postPayment('paid', { amount: 8000 }); // settled -> excluded
  const rep = agingReport(L, now);
  assert.equal(rep.debtorCount, 2);
  assert.equal(rep.totalOutstanding, 120000);
  assert.equal(rep.debtors[0].id, 'stale'); // oldest first
  assert.equal(rep.buckets['60+'], 20000);
  assert.equal(rep.buckets['0-15'], 100000);
});

test('landed cost and margin quote compute the floor price', () => {
  const { totalLanded, perUnit } = landedCostPerUnit({
    purchase: 1_000_000, transport: 100_000, handling: 50_000, units: 500,
  });
  assert.equal(totalLanded, 1_150_000);
  assert.equal(perUnit, 2300);

  const q = quote({ purchase: 1_000_000, transport: 100_000, handling: 50_000, units: 500, margin: 0.15 });
  assert.equal(q.floorPerUnit, 2300);
  assert.ok(Math.abs(q.suggestedPerUnit - 2705.88) < 0.1, `got ${q.suggestedPerUnit}`);
  assert.ok(q.marginPerUnit > 0);
});

test('AGING_BUCKETS is the shared ordered vocabulary', () => {
  assert.deepEqual(AGING_BUCKETS, ['0-15', '16-30', '31-60', '60+']);
});
