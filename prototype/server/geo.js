// Geospatial helpers: distance and a simple grid-cell index (a stand-in for H3 at
// prototype scale — same idea: bucket vehicles by cell, search rings outward).

const EARTH_RADIUS_KM = 6371;
const CELL_DEG = 0.005; // ~550 m north-south per cell

const toRad = (deg) => (deg * Math.PI) / 180;

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function cellKey(lat, lon) {
  const row = Math.floor(lat / CELL_DEG);
  const col = Math.floor(lon / CELL_DEG);
  return `${row}:${col}`;
}

// Keys of the square ring at `radius` cells around the given cell (radius 0 = the
// cell itself). Used to widen a nearest-vehicle search outward.
export function ringKeys(lat, lon, radius) {
  const row = Math.floor(lat / CELL_DEG);
  const col = Math.floor(lon / CELL_DEG);
  if (radius === 0) return [`${row}:${col}`];
  const keys = [];
  for (let r = row - radius; r <= row + radius; r++) {
    for (let c = col - radius; c <= col + radius; c++) {
      if (Math.abs(r - row) === radius || Math.abs(c - col) === radius) {
        keys.push(`${r}:${c}`);
      }
    }
  }
  return keys;
}

// Straight-line distance scaled by a road-winding factor: good enough to rank
// nearby candidates until a routing engine (OSRM) replaces it.
export function roadEtaMinutes(from, to, mode) {
  const speeds = { moto: 22, taxi: 18, car: 18, minibus: 14, truck: 14, boat: 12 };
  const kmh = speeds[mode] ?? 18;
  const km = haversineKm(from, to) * 1.4;
  return (km / kmh) * 60;
}
