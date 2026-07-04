import axios from "axios";
import connectDB from "../config/db.js";

import brandModel from "../modules/master/models/brand.model.js";
import carModel from "../modules/master/models/carModel.model.js";
import carYearModel from "../modules/master/models/carYear.mode.js";

await connectDB();

console.log("🚀 Connected to DB");

// CLEAN ONLY CAR DATA
await brandModel.deleteMany({});
await carModel.deleteMany({});
await carYearModel.deleteMany({});

console.log("🧹 Car collections cleared");

// STEP 1: GET MAKES
const makesRes = await axios.get(
  `https://carapi.app/api/makes`,
  {
    headers: {
      Authorization: `Bearer ${process.env.CARAPI_KEY}`
    }
  }
);

const makes = makesRes.data?.data || [];

for (const make of makes) {
  try {
    console.log(`🚗 Make: ${make.name}`);

    const brand = await brandModel.create({
      name: make.name
    });

    // STEP 2: MODELS
    const modelRes = await axios.get(
      `https://carapi.app/api/models?make=${encodeURIComponent(make.name)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CARAPI_KEY}`
        }
      }
    );

    const models = modelRes.data?.data || [];

    for (const m of models) {
      if (!m.name) continue;

      const createdModel = await carModel.create({
        name: m.name,
        brand: brand._id
      });

      // STEP 3: YEARS (ONLY THIS EXTRA RELATION)
      try {
        const yearRes = await axios.get(
          `https://carapi.app/api/years?make=${encodeURIComponent(make.name)}&model=${encodeURIComponent(m.name)}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.CARAPI_KEY}`
            }
          }
        );

        const years = yearRes.data?.data || [];

        for (const y of years) {
          await carYearModel.updateOne(
            { model: createdModel._id, year: y.year },
            {
              $setOnInsert: {
                model: createdModel._id,
                year: y.year
              }
            },
            { upsert: true }
          );
        }

      } catch (err) {
        console.log(`⚠️ Year failed: ${m.name}`);
      }
    }

  } catch (err) {
    console.log(`❌ Make failed: ${make.name}`);
  }
}

console.log("🎉 DONE SEEDING CARS");
process.exit();