// Shared front-end constants. Mode list mirrors server/modes.js — if you add a
// mode, change both (the prototype has no build step to share code across them).

export const VEHICLE_MODES = ['moto', 'taxi', 'car', 'minibus', 'truck', 'boat'];

export const MODE_COLORS = {
  moto: '#15803d',
  taxi: '#eab308',
  car: '#2563eb',
  minibus: '#9333ea',
  truck: '#c2410c',
  boat: '#0e7490',
};

export const DAKAR_CENTER = { lat: 14.716, lon: -17.467 };

export const JOB_STATE_LABELS = {
  requested: 'Waiting for a vehicle…',
  offered: 'Offered to a driver…',
  accepted: 'Driver en route to pickup',
  arrived_pickup: 'Driver at pickup',
  in_transit: 'In transit',
  delivered: 'Delivered',
  settled: 'Settled',
  cancelled: 'Cancelled',
};

// What the driver's "advance" button should say in each state (rider page is FR).
export const ADVANCE_LABELS_FR = {
  accepted: "Je suis arrivé au point de retrait",
  arrived_pickup: 'Colis récupéré — départ',
  in_transit: 'Livraison effectuée',
  delivered: 'Clôturer (payé)',
};
