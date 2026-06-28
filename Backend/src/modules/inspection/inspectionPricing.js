const PREMIUM_BODY_TYPES = ["SUV", "4x4", "Jeep", "Luxury", "German"];

export function calculateInspectionFee(listing, fees) {
  const engineCC = listing.engineCapacity;
  const bodyType = listing.bodyType?.name;

  if (PREMIUM_BODY_TYPES.includes(bodyType)) return fees.premium;
  if (engineCC <= 1000) return fees.standard;
  return fees.managed;
}