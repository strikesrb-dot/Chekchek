// Ardoise Grossiste depot dashboard: post deliveries (debits) and Wave payments
// (credits) against customer tabs, and watch the aging report update. Talks to
// the /api/ardoise/* routes. Seeds a few demo customers on first load so a depot
// owner sees a realistic "who owes what" board immediately.

const $ = (id) => document.getElementById(id);
const fmt = (n) => new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' F';

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

async function seedIfEmpty() {
  const rep = await api('GET', '/api/ardoise/report');
  if (rep.debtorCount > 0) return;
  const demo = [
    ['modou', 'Modou — Boutique Ndamatou', 180000],
    ['fatou', 'Fatou — Quincaillerie', 60000],
    ['ibou', 'Ibou — Chantier Khaïra', 420000],
  ];
  for (const [id, name, amount] of demo) {
    await api('POST', '/api/ardoise/customers', { id, name });
    await api('POST', `/api/ardoise/customers/${id}/delivery`, { amount, note: 'ciment' });
  }
  await api('POST', '/api/ardoise/customers/fatou/payment', { amount: 20000 });
}

async function refresh() {
  const rep = await api('GET', '/api/ardoise/report');
  $('total').textContent = 'Total dû : ' + fmt(rep.totalOutstanding);
  $('debtor-count').textContent = `(${rep.debtorCount} clients)`;

  const B = rep.buckets;
  $('buckets').innerHTML = [
    ['0-15 j', B['0-15'], 'b0'], ['16-30 j', B['16-30'], 'b1'],
    ['31-60 j', B['31-60'], 'b2'], ['60+ j', B['60+'], 'b3'],
  ].map(([k, v, c]) => `<div class="bucket ${c}"><div class="k">${k}</div><div class="v">${fmt(v)}</div></div>`).join('');

  $('debtors').innerHTML = rep.debtors.length
    ? rep.debtors.map((d) =>
        `<li><span class="name">${escapeHtml(d.name)}</span>` +
        `<span class="age">${d.oldestDays} j</span>` +
        `<span class="bal">${fmt(d.total)}</span></li>`).join('')
    : '<li class="empty">Aucune dette. 🎉</li>';

  const sel = $('cust');
  const cur = sel.value;
  sel.innerHTML = rep.debtors.concat(await extraCustomers(rep))
    .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}</option>`).join('');
  if (cur) sel.value = cur;
}

// Customers with a zero balance still need to be selectable for a new delivery.
async function extraCustomers(rep) {
  const known = new Set(rep.debtors.map((d) => d.id));
  return (window.__allCustomers ?? []).filter((c) => !known.has(c.id));
}

$('add-cust').onclick = async () => {
  const name = $('new-name').value.trim();
  if (!name) return;
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + name.length;
  await api('POST', '/api/ardoise/customers', { id, name });
  window.__allCustomers = (window.__allCustomers ?? []).concat([{ id, name }]);
  $('new-name').value = '';
  await refresh();
  $('cust').value = id;
};

$('deliver').onclick = () => post('delivery');
$('pay').onclick = () => post('payment');

async function post(kind) {
  const id = $('cust').value;
  const amount = Number($('amount').value);
  if (!id || !(amount > 0)) return;
  try {
    await api('POST', `/api/ardoise/customers/${id}/${kind}`, { amount });
    $('amount').value = '';
    await refresh();
  } catch (e) {
    alert(e.message);
  }
}

$('calc').onclick = async () => {
  try {
    const q = await api('POST', '/api/ardoise/landed-cost', {
      purchase: Number($('lc-purchase').value),
      transport: Number($('lc-transport').value || 0),
      units: Number($('lc-units').value),
      margin: 0.15,
    });
    $('lc-out').innerHTML =
      `Plancher : <b>${fmt(q.floorPerUnit)}</b>/unité · ` +
      `Prix conseillé (+15%) : <b>${fmt(q.suggestedPerUnit)}</b>`;
  } catch (e) {
    $('lc-out').textContent = e.message;
  }
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

await seedIfEmpty();
await refresh();
