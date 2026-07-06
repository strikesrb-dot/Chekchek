// Shared vocabulary for the whole platform. The tracking core is mode-agnostic:
// every vehicle carries one of these modes and dispatch filters on it.

export const VEHICLE_MODES = ['moto', 'taxi', 'car', 'minibus', 'truck', 'boat'];

export const VEHICLE_STATUS = ['offline', 'available', 'busy'];

// Job lifecycle. `requested` re-enters dispatch until a vehicle accepts.
export const JOB_STATES = [
  'requested',
  'offered',
  'accepted',
  'arrived_pickup',
  'in_transit',
  'delivered',
  'settled',
  'cancelled',
];

// Forward transitions a worker drives by tapping "advance" after acceptance.
export const JOB_ADVANCE = {
  accepted: 'arrived_pickup',
  arrived_pickup: 'in_transit',
  in_transit: 'delivered',
  delivered: 'settled',
};

export function isVehicleMode(value) {
  return VEHICLE_MODES.includes(value);
}
