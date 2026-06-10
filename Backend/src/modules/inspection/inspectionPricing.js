export function calculateInspectionFee(listing) {
  const engineCC = listing.engineCapacity;
  const bodyType = listing.bodyType?.name;

  // SUV / 4x4 / premium category
  const premiumTypes = [
    "SUV",
    "4x4",
    "Jeep",
    "Luxury",
    "German"
  ];

  if (premiumTypes.includes(bodyType)) {
    return 7000;
  }

  if (engineCC <= 1000) {
    return 2000;
  }

  if (engineCC <= 2000) {
    return 5000;
  }

  // fallback
  return 5000;
}