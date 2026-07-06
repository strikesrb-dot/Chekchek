// Leaflet helpers for the ops dashboard: vehicle markers colored by mode,
// pickup/dropoff pins. Leaflet itself is loaded globally by dashboard.html.

import { MODE_COLORS, DAKAR_CENTER } from './config.js';

export function createMap(elementId) {
  const map = L.map(elementId).setView([DAKAR_CENTER.lat, DAKAR_CENTER.lon], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);

  const vehicleMarkers = new Map(); // vehicleId -> circleMarker

  function upsertVehicle(vehicle) {
    if (!vehicle.pos) return;
    const color = MODE_COLORS[vehicle.mode] ?? '#374151';
    const busy = vehicle.status === 'busy';
    let marker = vehicleMarkers.get(vehicle.id);
    if (!marker) {
      marker = L.circleMarker([vehicle.pos.lat, vehicle.pos.lon], { radius: 7, weight: 2 });
      marker.addTo(map);
      vehicleMarkers.set(vehicle.id, marker);
    }
    marker.setLatLng([vehicle.pos.lat, vehicle.pos.lon]);
    marker.setStyle({ color, fillColor: color, fillOpacity: busy ? 1 : 0.4 });
    marker.bindTooltip(`${vehicle.label} · ${vehicle.mode} · ${vehicle.status}`);
  }

  function addPin(point, label) {
    return L.marker([point.lat, point.lon], { title: label })
      .addTo(map)
      .bindTooltip(label);
  }

  function removeLayer(layer) {
    if (layer) map.removeLayer(layer);
  }

  return { map, upsertVehicle, addPin, removeLayer };
}
