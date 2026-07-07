// Cities where Managed Sale and Inspection services are available
export const MANAGED_SALE_CITY_NAMES = [
  "Rahim Yar Khan",
  "Khanpur",
  "Liaqat Pur",
  "Sadiqabad",
];

// Compare city names ignoring case, spaces and hyphens, so DB spellings like
// "Khan Pur" or "Liaqatpur" still count as managed cities.
const normalizeCityName = (name) => String(name || "").toLowerCase().replace(/[\s-]+/g, "");

export const isManagedSaleCity = (name) =>
  MANAGED_SALE_CITY_NAMES.some((n) => normalizeCityName(n) === normalizeCityName(name));
