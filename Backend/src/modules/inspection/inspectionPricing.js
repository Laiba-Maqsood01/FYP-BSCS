const PREMIUM_BODY_TYPES = ["SUV", "4x4", "Jeep", "Luxury", "German"];

export function calculateInspectionFee(listing, fees) {
  const engineCC = listing.engineCapacity; // CC for fuel cars, kWh for EVs
  const bodyType = listing.bodyType?.name;

  if (PREMIUM_BODY_TYPES.includes(bodyType)) return fees.premium;

  // Electric cars store battery kWh in engineCapacity, so the CC thresholds
  // don't apply — every EV pays the premium fee (high-voltage checks).
  if (listing.engineType === "electric") return fees.premium;

  if (engineCC <= 1000) return fees.standard;
  return fees.managed;
}
