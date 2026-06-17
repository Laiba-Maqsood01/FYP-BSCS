import axios from "axios";

import connectDB from "../config/db.js";

import carModel from "../modules/master/models/carModel.model.js";
import brandModel from "../modules/master/models/brand.model.js";

await connectDB();

console.log("Connected to DB");

await carModel.deleteMany({});

const brands = await brandModel.find();

let totalModels = 0;

for (const brand of brands) {

  try {

    console.log(`Fetching ${brand.name}...`);

    const response = await axios.get(
      `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(
        brand.name
      )}?format=json`
    );

    const results = response.data.Results || [];

    if (!results.length) {

      console.log(
        `${brand.name}: No models found`
      );

      continue;
    }

    const models = results.map((item) => ({
      name: item.Model_Name.trim(),
      brand: brand._id
    }));

    const uniqueModels = [];

    const seen = new Set();

    for (const model of models) {

      const key =
        `${model.name}-${brand._id}`;

      if (seen.has(key)) continue;

      seen.add(key);

      uniqueModels.push(model);
    }

    await carModel.insertMany(
      uniqueModels,
      { ordered: false }
    );

    totalModels += uniqueModels.length;

    console.log(
      `${brand.name}: ${uniqueModels.length} models inserted`
    );

  } catch (error) {

    console.log(
      `${brand.name}: failed`
    );

    console.log(error.message);
  }
}

console.log(
  `Completed. Total Models: ${totalModels}`
);

process.exit();


// import axios from "axios";
// import connectDB from "../config/db.js";

// import carModel from "../modules/master/models/carModel.model.js";
// import brandModel from "../modules/master/models/brand.model.js";

// import { fallbackBrandModels } from "./fallback.seed.js";

// await connectDB();

// console.log("Connected to DB");

// await carModel.deleteMany({});

// const brands = await brandModel.find();

// let totalModels = 0;

// for (const brand of brands) {
//   try {
//     console.log(`Fetching ${brand.name}...`);

//     let apiModels = [];

//     // 1. API fetch
//     try {
//       const response = await axios.get(
//         `https://vpic.nhtsa.dot.gov/api/vehicles/GetModelsForMake/${encodeURIComponent(
//           brand.name
//         )}?format=json`
//       );

//       apiModels = (response.data.Results || []).map((item) =>
//         item.Model_Name.trim()
//       );
//     } catch (err) {
//       console.log(`${brand.name}: API failed`);
//     }

//     // 2. fallback models
//     const fallback =
//       fallbackBrandModels.find((b) => b.name === brand.name)?.models || [];

//     // 3. merge + deduplicate
//     const merged = [...apiModels, ...fallback];

//     const unique = [...new Set(merged)];

//     const modelsToInsert = unique.map((model) => ({
//       name: model,
//       brand: brand._id
//     }));

//     if (!modelsToInsert.length) {
//       console.log(`${brand.name}: no models`);
//       continue;
//     }

//     await carModel.insertMany(modelsToInsert, { ordered: false });

//     totalModels += modelsToInsert.length;

//     console.log(`${brand.name}: ${modelsToInsert.length} models inserted`);
//   } catch (error) {
//     console.log(`${brand.name}: failed`);
//     console.log(error.message);
//   }
// }

// console.log(`Completed. Total Models: ${totalModels}`);

// process.exit();