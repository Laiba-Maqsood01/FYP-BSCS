import mongoose from "mongoose";
import config from "../config/config.js";
import featuredPlanModel from "../modules/featured/featured-plan.model.js";

const plans = [
  { name: "BASIC",   label: "Basic",   amount: 500,  durationDays: 7  },
  { name: "PREMIUM", label: "Premium", amount: 1000, durationDays: 15 },
  { name: "TOP",     label: "Top",     amount: 2000, durationDays: 30 },
];

async function seed() {
  await mongoose.connect(config.MONGO_URI);
  for (const plan of plans) {
    await featuredPlanModel.updateOne(
      { name: plan.name },
      { $setOnInsert: plan },
      { upsert: true }
    );
    console.log(`Upserted plan: ${plan.name}`);
  }
  console.log("Featured plans seeded.");
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
