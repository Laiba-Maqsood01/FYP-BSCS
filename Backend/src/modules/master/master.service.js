import brandModel from "./models/brand.model.js";
import bodyTypeModel from "./models/bodyType.model.js";
import provinceModel from "./models/province.model.js";
import cityModel from "./models/city.model.js";

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