// import mongoose from "mongoose";

// import connectDB from "../config/db.js";

// import brandModel from "../modules/master/models/brand.model.js";
// import cityModel from "../modules/master/models/city.model.js";
// import bodyTypeModel from "../modules/master/models/bodyType.model.js";
// import provinceModel from "../modules/master/models/province.model.js";

// const brands = [
//   { name: "Toyota" },
//   { name: "Suzuki" },
//   { name: "Honda" },
//   { name: "Daihatsu" },
//   { name: "Hyundai" },
//   { name: "KIA" },
//   { name: "Changan" },
//   { name: "MG" },
//   { name: "BYD" },
//   { name: "DFSK" },
//   { name: "Prince" },
//   { name: "Proton" },
//   { name: "FAW" },
//   { name: "JAC" },
//   { name: "Jetour" },
//   { name: "Haval" },
//   { name: "GWM" },
//   { name: "ORA" },
//   { name: "Deepal" },
//   { name: "Omoda" },
//   { name: "Jaecoo" },
//   { name: "Geely" },
//   { name: "Tesla" },
//   { name: "Audi" },
//   { name: "BMW" },
//   { name: "Mercedes Benz" },
//   { name: "Volkswagen" },
//   { name: "Porsche" },
//   { name: "Lexus" },
//   { name: "Land Rover" },
//   { name: "Range Rover" },
//   { name: "Nissan" },
//   { name: "Mitsubishi" },
//   { name: "Mazda" },
//   { name: "Subaru" },
//   { name: "Peugeot" },
//   { name: "Renault" },
//   { name: "Volvo" },
//   { name: "Ferrari" },
//   { name: "Lamborghini" },
//   { name: "Bentley" },
//   { name: "Rolls Royce" },
//   { name: "McLaren" },
//   { name: "Maserati" },
//   { name: "Jaguar" },
//   { name: "Mini" }
// ];

// const cities = [
//   { name: "Lahore", province: "punjab" },
//   { name: "Karachi", province: "sindh" },
//   { name: "Quetta", province: "balochistan" },
//   { name: "Islamabad", province: "ict" },
//   { name: "Rawalpindi", province: "punjab" },

//   { name: "Abbottabad", province: "kpk" },
//   { name: "Abdul Hakeem", province: "punjab" },
//   { name: "Adda jahan khan", province: "punjab" },
//   { name: "Ahmadpur East", province: "punjab" },
//   { name: "Arifwala", province: "punjab" },
//   { name: "Attock", province: "punjab" },

//   { name: "Azad Kashmir", province: "azad-kashmir" },
//   { name: "Mirpur A.K.", province: "azad-kashmir" },
//   { name: "Muzaffarabad", province: "azad-kashmir" },
//   { name: "Kotli Ak", province: "azad-kashmir" },

//   { name: "Badin", province: "sindh" },
//   { name: "Nawabshah", province: "sindh" },
//   { name: "Dadu", province: "sindh" },
//   { name: "Hyderabad", province: "sindh" },
//   { name: "Mirpur khas", province: "sindh" },
//   { name: "Larkana", province: "sindh" },
//   { name: "Sukkur", province: "sindh" },
//   { name: "Khairpur", province: "sindh" },

//   { name: "Bahawalnagar", province: "punjab" },
//   { name: "Bahawalpur", province: "punjab" },
//   { name: "Burewala", province: "punjab" },
//   { name: "Chiniot", province: "punjab" },
//   { name: "Chakwal", province: "punjab" },
//   { name: "Chishtian", province: "punjab" },
//   { name: "Chowk azam", province: "punjab" },
//   { name: "D.G.Khan", province: "punjab" },
//   { name: "Dera Ghazi Khan", province: "punjab" },
//   { name: "Daska", province: "punjab" },
//   { name: "Dinga", province: "punjab" },
//   { name: "Faisalabad", province: "punjab" },
//   { name: "Feroz walla", province: "punjab" },
//   { name: "Gojra", province: "punjab" },
//   { name: "Gujar Khan", province: "punjab" },
//   { name: "Gujranwala", province: "punjab" },
//   { name: "Gujrat", province: "punjab" },
//   { name: "Hafizabad", province: "punjab" },
//   { name: "Hasilpur", province: "punjab" },
//   { name: "Jaranwala", province: "punjab" },
//   { name: "Jhang", province: "punjab" },
//   { name: "Jhelum", province: "punjab" },
//   { name: "Kasur", province: "punjab" },
//   { name: "Kamoke", province: "punjab" },
//   { name: "Kot addu", province: "punjab" },
//   { name: "Layyah", province: "punjab" },
//   { name: "Lodhran", province: "punjab" },
//   { name: "Mandi bahauddin", province: "punjab" },
//   { name: "Multan", province: "punjab" },
//   { name: "Muzaffar Gargh", province: "punjab" },
//   { name: "Okara", province: "punjab" },
//   { name: "Pak pattan sharif", province: "punjab" },
//   { name: "Rahim Yar Khan", province: "punjab" },
//   { name: "Sadiqabad", province: "punjab" },
//   { name: "Sahiwal", province: "punjab" },
//   { name: "Sargodha", province: "punjab" },
//   { name: "Sheikhupura", province: "punjab" },
//   { name: "Sialkot", province: "punjab" },
//   { name: "Toba Tek Singh", province: "punjab" },
//   { name: "Vehari", province: "punjab" },
//   { name: "Wah cantt", province: "punjab" },
//   { name: "Wazirabad", province: "punjab" },

//   { name: "Bannu", province: "kpk" },
//   { name: "Buner", province: "kpk" },
//   { name: "Chitral", province: "kpk" },
//   { name: "Dera ismail khan", province: "kpk" },
//   { name: "Dir", province: "kpk" },
//   { name: "Haripur", province: "kpk" },
//   { name: "Hayatabad", province: "kpk" },
//   { name: "Karak", province: "kpk" },
//   { name: "Kohat", province: "kpk" },
//   { name: "Khyber", province: "kpk" },
//   { name: "Lakki marwat", province: "kpk" },
//   { name: "Lower Dir", province: "kpk" },
//   { name: "Malakand Agency", province: "kpk" },
//   { name: "Mansehra", province: "kpk" },
//   { name: "Mardan", province: "kpk" },
//   { name: "Nowshera", province: "kpk" },
//   { name: "Nowshera cantt", province: "kpk" },
//   { name: "Peshawar", province: "kpk" },
//   { name: "Swabi", province: "kpk" },
//   { name: "Swat", province: "kpk" },
//   { name: "Swatmingora", province: "kpk" },

//   { name: "Balochistan", province: "balochistan" },
//   { name: "Khuzdar", province: "balochistan" },
//   { name: "Lasbela", province: "balochistan" },

//   { name: "Gilgit", province: "gilgit-baltistan" },
//   { name: "Hunza", province: "gilgit-baltistan" },
//   { name: "Northern Areas", province: "gilgit-baltistan" },

//   // { name: "Other", province: "unknown" },
//   // { name: "Un-Registered", province: "unknown" }
// ];

// const bodyTypes = [
//   { name: "Compact hatchback" },
//   { name: "Compact sedan" },
//   { name: "Compact SUV" },
//   { name: "Convertible" },
//   { name: "Coupe" },
//   { name: "Crossover" },
//   { name: "Double Cabin" },
//   { name: "Hatchback" },
//   { name: "High Roof" },
//   { name: "Micro Van" },
//   { name: "Mini Van" },
//   { name: "Mini Vehicles" },
//   { name: "MPV" },
//   { name: "Off-Road Vehicles" },
//   { name: "Pick Up" },
//   { name: "Sedan" },
//   { name: "Single Cabin" },
//   { name: "Station Wagon" },
//   { name: "Subcompact hatchback" },
//   { name: "SUV" },
//   { name: "Truck" },
//   { name: "Van" }
// ];

// const provinces = [
//   {
//     name: "Punjab",
//     slug: "punjab"
//   },
//   {
//     name: "Sindh",
//     slug: "sindh"
//   },
//   {
//     name: "Khyber Pakhtunkhwa",
//     slug: "kpk"
//   },
//   {
//     name: "Balochistan",
//     slug: "balochistan"
//   },
//   {
//     name: "Islamabad Capital Territory",
//     slug: "ict"
//   },
//   {
//     name: "Gilgit Baltistan",
//     slug: "gilgit-baltistan"
//   },
//   {
//     name: "Azad Kashmir",
//     slug: "azad-kashmir"
//   }
// ];

// async function seedMasterData() {
//   try {
//     await connectDB();

//     console.log("Connected to DB");

//     // Clear old data
//     await brandModel.deleteMany({});
//     await cityModel.deleteMany({});
//     await bodyTypeModel.deleteMany({});
//     await provinceModel.deleteMany({});

//     // insert new data
//     await brandModel.insertMany(brands);

//     // We are seeding provinces first then creating map to get province ids. after map, we will link the city with province 
//     const createdProvinces = await provinceModel.insertMany(provinces);

//     const provinceMap = {};

//     createdProvinces.forEach((province) => {
//       provinceMap[province.slug] = province._id;
//     });


//     const citiesWithSlug = cities.map((city) => ({
//       name: city.name,

//       slug: city.name
//         .toLowerCase()
//         .replace(/\s+/g, "-")
//         .replace(/[^a-z0-9-]/g, ""),

//       province: provinceMap[city.province]
//     }));

//     await cityModel.insertMany(citiesWithSlug);

//     await bodyTypeModel.insertMany(bodyTypes);

//     console.log("Master data seeded successfully");

//     process.exit();
//   } catch (error) {
//     console.error(error);

//     process.exit(1);
//   }
// }

// seedMasterData();


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