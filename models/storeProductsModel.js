import mongoose from "mongoose";

/* ---------------- VARIANT ---------------- */
const storeVariantSchema = new mongoose.Schema(
  {
    size: {
      type: String,
      default: "",
    },

    weight: {
      type: String,
      required: true,
    },

    // 🔥 POS / Scanner
    sku: {
      type: String,
    },

    barcode: {
      type: String,
    },

    stock: {
      type: Number,
      default: 0,
    },

    price: {
      type: Number,
      default: 0,
    },

    salesPrice: {
      type: Number,
      default: 0,
    },

    // 💰 Profit tracking
    costPrice: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/* ---------------- STOCK LOG ---------------- */
const stockLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["sale", "restock", "adjustment", "return"],
    },

    quantity: Number,

    note: String,

    date: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ---------------- DAILY SALES ---------------- */
const dailySalesSchema = new mongoose.Schema(
  {
    date: String, // "2026-04-07"
    quantity: Number,
    revenue: Number,
  },
  { _id: false }
);

/* ---------------- MAIN SCHEMA ---------------- */
const storeProductSchema = new mongoose.Schema(
  {
    // 🏪 Store reference
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Store",
      required: true,
    },

    // 🏷️ Basic info
    title: {
      type: String,
      required: true,
      trim: true,
    },

    displayName: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    // 🏷️ Category
    category: {
      type: String,
      default: "",
    },

    // 🔍 Search
    searchKeywords: {
      type: [String],
      default: [],
    },

    // 📦 Variants
    variants: {
      type: [storeVariantSchema],
      default: [],
    },

    // 🔥 Total stock (auto calculated)
    totalStock: {
      type: Number,
      default: 0,
    },

    // 📊 Sales analytics
    sold: {
      type: Number,
      default: 0,
    },

    dailySales: {
      type: [dailySalesSchema],
      default: [],
    },

    // 📦 Inventory logs
    stockLogs: {
      type: [stockLogSchema],
      default: [],
    },

    // ⚠️ Alerts
    lowStockThreshold: {
      type: Number,
      default: 5,
    },

    // 🎯 Control
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

/* ---------------- AUTO TOTAL STOCK ---------------- */
storeProductSchema.pre("save", function (next) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce(
      (sum, v) => sum + (v.stock || 0),
      0
    );
  }
  next();
});

/* ---------------- EXPORT ---------------- */
export const StoreProduct = mongoose.model("StoreProduct",storeProductSchema);