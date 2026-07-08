// Aging engine for the depot receivables ledger. Buckets every unpaid debit by
// how many days it has been outstanding, so the owner sees "who owes what, and
// how overdue" — the number that decides who gets a reminder tonight.

export const AGING_BUCKETS = ['0-15', '16-30', '31-60', '60+'];
const DAY_MS = 24 * 60 * 60 * 1000;

export function bucketFor(ageDays) {
  if (ageDays <= 15) return '0-15';
  if (ageDays <= 30) return '16-30';
  if (ageDays <= 60) return '31-60';
  return '60+';
}

// Aging for one customer: total owed split across buckets, plus the oldest debt.
export function ageCustomer(ledger, customerId, now) {
  const buckets = Object.fromEntries(AGING_BUCKETS.map((b) => [b, 0]));
  let oldestTs = null;
  for (const line of ledger.openDebits(customerId)) {
    const ageDays = Math.floor((now - line.ts) / DAY_MS);
    buckets[bucketFor(ageDays)] += line.remaining;
    if (oldestTs === null || line.ts < oldestTs) oldestTs = line.ts;
  }
  const total = Object.values(buckets).reduce((a, b) => a + b, 0);
  const oldestDays = oldestTs === null ? 0 : Math.floor((now - oldestTs) / DAY_MS);
  return { customerId, total, buckets, oldestDays };
}

// Portfolio view: every customer with a balance, worst-overdue first, plus totals.
export function agingReport(ledger, now) {
  const rows = ledger.listCustomers()
    .filter((c) => c.balance > 0)
    .map((c) => {
      const a = ageCustomer(ledger, c.id, now);
      return { id: c.id, name: c.name, phone: c.phone, ...a };
    })
    .sort((a, b) => b.oldestDays - a.oldestDays || b.total - a.total);

  const totals = Object.fromEntries(AGING_BUCKETS.map((b) => [b, 0]));
  for (const r of rows) for (const b of AGING_BUCKETS) totals[b] += r.buckets[b];

  return {
    totalOutstanding: rows.reduce((s, r) => s + r.total, 0),
    debtorCount: rows.length,
    buckets: totals,
    debtors: rows,
  };
}
