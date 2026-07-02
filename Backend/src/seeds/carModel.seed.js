import connectDB from "../config/db.js";
import brandModel from "../modules/master/models/brand.model.js";
import carModel from "../modules/master/models/carModel.model.js";
import { vehicleData } from "./vehicleData.js";

await connectDB();
console.log("Connected to DB");

await brandModel.deleteMany({});
await carModel.deleteMany({});
console.log("Cleared brands and car models");

let totalBrands = 0;
let totalModels = 0;

for (const entry of vehicleData) {
  try {
    const brand = await brandModel.create({ name: entry.make });
    totalBrands++;

    const models = [...new Set(entry.models)]
      .filter(Boolean)
      .map(name => ({ name: name.trim(), brand: brand._id }));

    if (models.length) {
      await carModel.insertMany(models, { ordered: false });
      totalModels += models.length;
    }

    console.log(`${entry.make}: ${models.length} models`);
  } catch (err) {
    console.log(`${entry.make}: failed — ${err.message}`);
  }
}

console.log(`Done. ${totalBrands} brands, ${totalModels} models inserted.`);
process.exit();
