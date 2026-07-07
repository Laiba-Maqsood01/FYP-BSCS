// Cities where GearTrade operates its inspection / managed-sale services.
// Keep in sync with Backend/src/config/constants.js (MANAGED_SALE_CITY_NAMES).
export const MANAGED_CITY_NAMES = ["Rahim Yar Khan", "Khanpur", "Liaqat Pur", "Sadiqabad"];

// Compare city names ignoring case, spaces and hyphens, so DB spellings like
// "Khan Pur" or "Liaqatpur" still count as managed cities.
const normalizeCityName = (name) => String(name || "").toLowerCase().replace(/[\s-]+/g, "");

export const isManagedCity = (name) =>
  MANAGED_CITY_NAMES.some(n => normalizeCityName(n) === normalizeCityName(name));
