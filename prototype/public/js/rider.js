// Rider (driver) web app: register, go online, stream real GPS from the phone,
// receive job offers over SSE, drive the job lifecycle. French UI (see doc 01 —
// production adds Wolof audio prompts for every step).

import { VEHICLE_MODES, ADVANCE_LABELS_FR } from './config.js';
import { apiPost, subscribe } from './api.js';

const $ = (id) => document.getElementById(id);
const state = { vehicle: null, online: false, watchId: null, offer: null, job: null };

VEHICLE_MODES.forEach((m) => $('reg-mode').add(new Option(m, m)));

$('reg-go').onclick = async () => {
  const label = $('reg-label').value.trim() || 'Conducteur';
  const id = `app-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${String(Math.floor(Math.random() * 1e4)).padStart(4, '0')}`;
  state.vehicle = await apiPost('/api/vehicles', { id, label, mode: $('reg-mode').value, source: 'app' });
  $('register-card').classList.add('hidden');
  $('work-card').classList.remove('hidden');
  listen();
};

$('toggle-online').onclick = async () => {
  state.online = !state.online;
  if (state.online) startGps();
  else stopGps();
  await apiPost(`/api/vehicles/${state.vehicle.id}/status`, { status: state.online ? 'available' : 'offline' });
  renderStatus();
};

$('offer-accept').onclick = () => respond(true);
$('offer-decline').onclick = () => respond(false);

$('job-advance').onclick = async () => {
  state.job = await apiPost(`/api/jobs/${state.job.id}/advance`, { vehicleId: state.vehicle.id });
  if (state.job.state === 'settled') state.job = null;
  render();
};

async function respond(accept) {
  const job = await apiPost(`/api/jobs/${state.offer.id}/respond`, { vehicleId: state.vehicle.id, accept });
  state.offer = null;
  if (accept) state.job = job;
  render();
}

function listen() {
  subscribe({
    job(job) {
      if (job.state === 'offered' && job.offeredTo === state.vehicle.id) state.offer = job;
      if (state.offer && job.id === state.offer.id && job.offeredTo !== state.vehicle.id) state.offer = null;
      if (state.job && job.id === state.job.id) state.job = job.state === 'settled' ? null : job;
      render();
    },
  });
}

function startGps() {
  if (!navigator.geolocation) {
    $('gps-line').textContent = 'Pas de GPS dans ce navigateur.';
    return;
  }
  state.watchId = navigator.geolocation.watchPosition(
    (p) => {
      apiPost(`/api/vehicles/${state.vehicle.id}/position`, {
        lat: p.coords.latitude,
        lon: p.coords.longitude,
        speed: (p.coords.speed ?? 0) * 3.6,
        course: p.coords.heading ?? 0,
      }).catch(() => {});
      $('gps-line').textContent = `GPS: ${p.coords.latitude.toFixed(5)}, ${p.coords.longitude.toFixed(5)}`;
    },
    (err) => ($('gps-line').textContent = `GPS indisponible: ${err.message}`),
    { enableHighAccuracy: true, maximumAge: 3000 },
  );
}

function stopGps() {
  if (state.watchId !== null) navigator.geolocation.clearWatch(state.watchId);
  state.watchId = null;
}

function renderStatus() {
  $('status-line').textContent = state.online ? 'En ligne — en attente de courses' : 'Hors ligne';
  $('toggle-online').textContent = state.online ? 'Passer hors ligne' : 'Passer en ligne';
}

function render() {
  renderStatus();
  $('offer-card').classList.toggle('hidden', !state.offer);
  if (state.offer) {
    $('offer-details').textContent =
      `Course ${state.offer.id} (${state.offer.mode}) — retrait: ` +
      `${state.offer.pickup.lat.toFixed(4)}, ${state.offer.pickup.lon.toFixed(4)}`;
  }
  $('active-job').classList.toggle('hidden', !state.job);
  if (state.job) {
    $('job-state').textContent = `${state.job.id} — état: ${state.job.state}`;
    $('job-advance').textContent = ADVANCE_LABELS_FR[state.job.state] ?? 'Continuer';
  }
}
