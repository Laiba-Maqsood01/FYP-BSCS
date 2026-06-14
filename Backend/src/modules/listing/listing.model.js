import mongoose from "mongoose";

const listingSchema = new mongoose.Schema(
  {
    // seller
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    // listing type
    saleMode: {
      type: String,
      enum: ["GENERAL", "MANAGED"],
      default: "GENERAL"
    },

    // car location
    city: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cities",
      required: true
    },

    // registered city/province
    registeredIn: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "cities",
      required: true
    },

    // car info
    year: {
      type: Number,
      required: true,
      min: 1950,
      max: new Date().getFullYear() + 1
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "brands",
      required: true
    },

    carModel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "car_models",
      required: true
    },
    // body types from collection
    bodyType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "body_types",
      required: true
    },

    // vehicle details
    engineType: {
      type: String,
      enum: ["petrol", "diesel", "hybrid", "electric"],
      required: true
    },

    engineCapacity: {
      type: Number,
      required: true
    },

    transmission: {
      type: String,
      enum: ["manual", "automatic"],
      required: true
    },

    assembly: {
      type: String,
      enum: ["local", "imported"],
      required: true
    },

    exteriorColor: {
      type: String,
      required: true,
      trim: true
    },

    mileage: {
      type: Number,
      required: true,
      min: 0
    },

    price: {
      type: Number,
      required: true,
      min: 1000
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10
    },

    // media
    images: [
      {
        url: String,
        fileId: String
      }
    ],

    // contact info
    mobileNumber: {
      type: String,
      required: true
    },

    secondaryNumber: {
      type: String,
      default: null
    },

    whatsappAllowed: {
      type: Boolean,
      default: true
    },

    // listing status
    status: {
      type: String,
      enum: [
        "PENDING",
        "ACTIVE",
        "REJECTED",
        "SOLD",
        "REMOVED"
      ],
      default: "PENDING"
    },

    rejectionReason: {
      type: String,
      default: null
    },
    
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// indexes
listingSchema.index({ brand: 1 });
listingSchema.index({ carModel: 1 });
listingSchema.index({ city: 1 });
listingSchema.index({ bodyType: 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ year: -1 });
listingSchema.index({ mileage: 1 });
listingSchema.index({ engineType: 1 });
listingSchema.index({ transmission: 1 });
listingSchema.index({ assembly: 1 });
listingSchema.index({ saleMode: 1 });
listingSchema.index({ isFeatured: -1 });
listingSchema.index({ createdAt: -1 });

listingSchema.index(
  {
    seller: 1,
    brand: 1,
    carModel: 1,
    city: 1,
    year: 1
  },
  {
    unique: true,
    partialFilterExpression: {
      status: {
        $in: ["PENDING", "ACTIVE"]
      }
    }
  }
);

const listingModel = mongoose.model(
  "listings",
  listingSchema
);

export default listingModel;

