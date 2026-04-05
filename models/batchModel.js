import mongoose from "mongoose";

const batchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      unique: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    productType: {
      type: String,
      enum: ["juice", "pulp", "oil", "other"],
      default: "pulp",
    },

    // 🌍 Origin
    origin: {
      location: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, default: "India" },
      lat: Number,
      lng: Number,
      altitude: Number,
    },

    // 🌱 Harvest
    harvestDate: { type: Date, required: true },
    harvestSeason: String,
    harvestedBy: String,

    // 🏭 Processing
    processedDate: { type: Date, required: true },
    processingMethod: {
      type: String,
      enum: ["cold-pressed", "natural", "manual", "other"],
      default: "natural",
    },

    // 👨‍🌾 Farmer
    farmer: {
      name: { type: String, required: true },
      village: String,
      image: String,
    },

    // 📦 Packaging
    packagingDate: { type: Date, required: true },
    packagingType: {
      type: String,
      enum: ["glass", "eco-pack", "plastic", "other"],
      default: "glass",
    },

    // 📊 Inventory
    totalUnits: { type: Number, default: 0 },
    remainingUnits: { type: Number, default: 0 },

    // 📖 Story & Media
    story: {
      type: String,
      required: true,
    },
    images: [String],
    videoUrl: String,

    // ⏳ Timeline
    timeline: [
      {
        step: String,
        date: Date,
        description: String,
      },
    ],

    // 🔐 Authenticity
    qrCode: String,
    isVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);


// ✅ HOOKS MUST COME BEFORE MODEL

batchSchema.pre("save", function (next) {
  // auto generate batchId if missing
  if (!this.batchId) {
    const date = new Date();

    const month = date
      .toLocaleString("default", { month: "short" })
      .toUpperCase();

    const year = date.getFullYear().toString().slice(-2);

    const random = Math.floor(100 + Math.random() * 900);

    this.batchId = `ROH-${month}${year}-${random}`;
  }

  // validation
  if (this.remainingUnits > this.totalUnits) {
    return next(new Error("Remaining units cannot exceed total units"));
  }

  next();
});


// ✅ MODEL AFTER HOOK
export const Batch = mongoose.model("Batch", batchSchema);