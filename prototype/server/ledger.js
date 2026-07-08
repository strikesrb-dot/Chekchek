// Ardoise Grossiste — receivables ledger for a wholesale depot.
// Each customer (boutiquier/mason) has a running tab. Deliveries post debit
// lines; payments post credit lines and are allocated oldest-debit-first (FIFO)
// so partial payments clear the oldest bag of cement before the newest.
//
// This is the money core of the "software owners can't quit" product: the tab
// IS the depot's working capital, so once balances live here they never leave.

let seq = 0;

export function createLedger(clock = () => 0) {
  const customers = new Map(); // id -> { id, name, phone, lines: [] }

  // A line: { id, ts, kind: 'debit'|'credit', amount, remaining, note, ref }
  // `remaining` on a debit is how much of it is still unpaid (FIFO target).
  function addCustomer({ id, name, phone }) {
    if (!id) throw new Error('customer id required');
    if (!customers.has(id)) customers.set(id, { id, name: name ?? id, phone: phone ?? null, lines: [] });
    return customers.get(id);
  }

  // A delivery (or manual sale) increases what the customer owes.
  function postDebit(customerId, { amount, note = '', ref = null, ts = clock() }) {
    const c = requireCustomer(customerId);
    if (!(amount > 0)) throw new Error('debit amount must be positive');
    const line = { id: ++seq, ts, kind: 'debit', amount, remaining: amount, note, ref };
    c.lines.push(line);
    return line;
  }

  // A payment reduces what the customer owes, applied to the oldest debt first.
  function postPayment(customerId, { amount, note = '', ref = null, ts = clock() }) {
    const c = requireCustomer(customerId);
    if (!(amount > 0)) throw new Error('payment amount must be positive');
    let left = amount;
    const applied = [];
    for (const line of c.lines) {
      if (left <= 0) break;
      if (line.kind !== 'debit' || line.remaining <= 0) continue;
      const take = Math.min(left, line.remaining);
      line.remaining -= take;
      left -= take;
      applied.push({ debitId: line.id, applied: take });
    }
    const credit = { id: ++seq, ts, kind: 'credit', amount, remaining: -left, note, ref, applied };
    c.lines.push(credit);
    // `remaining` on a credit is the leftover overpayment (credit balance).
    return { credit, unappliedOverpayment: left };
  }

  function balance(customerId) {
    const c = requireCustomer(customerId);
    return c.lines.reduce((sum, l) => sum + (l.kind === 'debit' ? l.amount : -l.amount), 0);
  }

  // Unpaid debit lines (remaining > 0), oldest first — the aging engine's input.
  function openDebits(customerId) {
    return requireCustomer(customerId).lines
      .filter((l) => l.kind === 'debit' && l.remaining > 0)
      .sort((a, b) => a.ts - b.ts);
  }

  function listCustomers() {
    return [...customers.values()].map((c) => ({
      id: c.id, name: c.name, phone: c.phone, balance: balance(c.id),
    }));
  }

  function requireCustomer(id) {
    const c = customers.get(id);
    if (!c) throw new Error(`unknown customer: ${id}`);
    return c;
  }

  function totalOutstanding() {
    let t = 0;
    for (const c of customers.values()) t += balance(c.id);
    return t;
  }

  return {
    customers,
    addCustomer,
    postDebit,
    postPayment,
    balance,
    openDebits,
    listCustomers,
    totalOutstanding,
  };
}
