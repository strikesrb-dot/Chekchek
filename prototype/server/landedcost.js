// Landed-cost-per-unit calculator — the "stopped a below-margin quote today"
// hook that opens the sale to a depot owner. Given what a batch of goods cost to
// buy and bring in, it returns the true floor price per unit so the owner never
// quotes below cost again.

export function landedCostPerUnit({ purchase, transport = 0, handling = 0, duties = 0, otherFees = 0, units }) {
  if (!(units > 0)) throw new Error('units must be positive');
  const totalLanded = purchase + transport + handling + duties + otherFees;
  const perUnit = totalLanded / units;
  return { totalLanded, perUnit };
}

// Floor price and a suggested sell price at a target margin (e.g. 0.15 = 15%).
export function quote({ purchase, transport = 0, handling = 0, duties = 0, otherFees = 0, units, margin = 0.15 }) {
  const { totalLanded, perUnit } = landedCostPerUnit({ purchase, transport, handling, duties, otherFees, units });
  if (margin < 0 || margin >= 1) throw new Error('margin must be in [0, 1)');
  const suggested = perUnit / (1 - margin);
  return {
    totalLanded,
    floorPerUnit: perUnit,
    suggestedPerUnit: suggested,
    marginPerUnit: suggested - perUnit,
  };
}
