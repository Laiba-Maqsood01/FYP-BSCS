import brandModel from "./models/brand.model.js";
import { isManagedSaleCity } from "../../config/constants.js";
import bodyTypeModel from "./models/bodyType.model.js";
import provinceModel from "./models/province.model.js";
import cityModel from "./models/city.model.js";
import carModel from "./models/carModel.model.js";
import listingModel from "../listing/listing.model.js";
import carYearModel from "./models/carYear.mode.js";

export async function getBrands() {
  return await brandModel.find({
    isActive: true
  });
}

export async function getBodyTypes() {
  return await bodyTypeModel.find({
    isActive: true
  });
}

export async function getProvinces() {
  return await provinceModel.find();
}

export async function getCities(provinceId) {

  const filters = {};

  if (provinceId) {
    filters.province = provinceId;
  }

  return await cityModel
    .find(filters)
    .populate("province", "name");
}

export async function getModels(brandId) {
  const filters = {};
  if (brandId) filters.brand = brandId;

  const models = await carModel
    .find(filters)
    .populate("brand", "name")
    .lean();

  return models;
}

// NEW SERVICE
export async function getYears(modelId) {
  return await carYearModel.find({ model: modelId });
}

export async function getManagedCities() {
  // Match in JS via the normalizing helper so DB spelling variants
  // ("Khan Pur", "Liaqatpur") are still recognised as managed cities.
  const cities = await cityModel.find().populate("province", "name");
  return cities.filter(c => isManagedSaleCity(c.name));
}

export async function getCitiesWithCount() {
  // Get all active cities
  const cities = await cityModel.find().populate("province", "name").lean();

  // Count active listings per city in one aggregation
  const counts = await listingModel.aggregate([
    { $match: { status: "ACTIVE" } },
    { $group: { _id: "$city", count: { $sum: 1 } } }
  ]);

  const countMap = {};
  counts.forEach(c => { countMap[c._id.toString()] = c.count; });

  return cities.map(city => ({
    ...city,
    listingCount: countMap[city._id.toString()] || 0
  }));
}