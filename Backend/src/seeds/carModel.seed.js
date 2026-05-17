import connectDB from "../config/db.js";
import carModel from "../modules/master/models/carModel.model.js";
import brandModel from "../modules/master/models/brand.model.js";

await connectDB();

const brands = await brandModel.find();

const getBrand = (name) =>
  brands.find((b) => b.name === name)?._id;

// 👉 TEST MODELS (PakWheels-style)
const models = [
  { name: "Corolla", brand: "Toyota" },
  { name: "Yaris", brand: "Toyota" },
  { name: "Civic", brand: "Honda" },
  { name: "City", brand: "Honda" },
  { name: "Cultus", brand: "Suzuki" },
  { name: "Alto", brand: "Suzuki" },
  { name: "Mehran", brand: "Suzuki" },
  { name: "Fortuner", brand: "Toyota" },
  { name: "Hilux", brand: "Toyota" },
  { name: "BR-V", brand: "Honda" },
  { name: "Sportage", brand: "KIA" },
  { name: "Picanto", brand: "KIA" },
  { name: "Sonata", brand: "Hyundai" },
  { name: "Elantra", brand: "Hyundai" },
  { name: "Swift", brand: "Suzuki" }
];

const formatted = models.map((m) => ({
  name: m.name,
  brand: getBrand(m.brand)
}));

await carModel.deleteMany({});
await carModel.insertMany(formatted);

console.log("Car models seeded successfully");
process.exit();