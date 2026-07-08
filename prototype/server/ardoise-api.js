// Ardoise Grossiste API — receivables routes on top of the ledger + aging +
// landed-cost modules. Mounted by http.js under /api/ardoise/*. Transport only;
// all money logic lives in the ledger/aging/landedcost modules.

import { createLedger } from './ledger.js';
import { agingReport } from './aging.js';
import { quote } from './landedcost.js';

export function createArdoiseApi(clock = () => Date.now()) {
  const ledger = createLedger(clock);

  const routes = [
    ['GET', /^\/api\/ardoise\/report$/, () => ok(agingReport(ledger, clock()))],

    ['POST', /^\/api\/ardoise\/customers$/, (_m, b) => {
      if (!b.id) return err(400, 'id required');
      return ok(ledger.addCustomer({ id: b.id, name: b.name, phone: b.phone }));
    }],

    // A delivery hand-over: the depot's killer feature. In production this is
    // fired by the ChekChek driver app's GPS+photo stamp; here it's an endpoint.
    ['POST', /^\/api\/ardoise\/customers\/([^/]+)\/delivery$/, (m, b) =>
      guard(() => ledger.postDebit(m[1], { amount: Number(b.amount), note: b.note ?? 'livraison', ref: b.ref ?? null }))],

    ['POST', /^\/api\/ardoise\/customers\/([^/]+)\/payment$/, (m, b) =>
      guard(() => ledger.postPayment(m[1], { amount: Number(b.amount), note: b.note ?? 'paiement Wave', ref: b.ref ?? null }))],

    ['POST', /^\/api\/ardoise\/landed-cost$/, (_m, b) =>
      guard(() => quote({
        purchase: Number(b.purchase), transport: Number(b.transport ?? 0),
        handling: Number(b.handling ?? 0), duties: Number(b.duties ?? 0),
        otherFees: Number(b.otherFees ?? 0), units: Number(b.units), margin: Number(b.margin ?? 0.15),
      }))],
  ];

  function handle(method, path, body) {
    for (const [m, re, fn] of routes) {
      if (m !== method) continue;
      const match = path.match(re);
      if (match) return fn(match, body ?? {});
    }
    return null;
  }

  return { handle, ledger };
}

const ok = (data) => ({ status: 200, data });
const err = (status, message) => ({ status, data: { error: message } });
function guard(fn) {
  try { return ok(fn()); } catch (e) { return err(409, e.message); }
}
