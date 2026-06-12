import mongoose from "mongoose";

const favoriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true
    },

    listing: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "listings",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate favorites
favoriteSchema.index(
  {
    user: 1,
    listing: 1
  },
  {
    unique: true
  }
);

// Fast queries
favoriteSchema.index({ user: 1 });
favoriteSchema.index({ listing: 1 });

const favoriteModel = mongoose.model("favorites", favoriteSchema);

export default favoriteModel;