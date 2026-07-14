import mongoose from "mongoose";

const DEFAULT_SLOTS = [
  "09:00 AM",
  "10:30 AM",
  "12:00 PM",
  "02:00 PM",
  "03:30 PM",
];

const slotSchema = new mongoose.Schema({
  label: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
  availableDays: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] }, // 0=Sun … 6=Sat
  isActive: { type: Boolean, default: true },
}, { _id: true });

const siteSettingsSchema = new mongoose.Schema({
  _id: { type: String, default: "singleton" },
  companyPhone: { type: String, default: "03000000000" },
  inspectionSlots: {
    type: [slotSchema],
    default: () => DEFAULT_SLOTS.map(label => ({ label, isDefault: true })),
  },
  inspectionFees: {
    standard:     { type: Number, default: 2000 },
    managed:      { type: Number, default: 5000 },
    premium:      { type: Number, default: 7000 },
  },
  commissionPercentage: { type: Number, default: 0.9 },
}, { timestamps: true });

const SiteSettings = mongoose.model("site_settings", siteSettingsSchema);

export async function getSettings() {
  let doc = await SiteSettings.findById("singleton");
  if (!doc) {
    doc = await SiteSettings.create({ _id: "singleton" });
  }
  return doc;
}

export async function updateSettings(fields) {
  const doc = await SiteSettings.findByIdAndUpdate(
    "singleton",
    { $set: fields },
    { upsert: true, new: true }
  );
  return doc;
}

export default SiteSettings;
