import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["Small", "Medium", "Large", ""],
    default: "",
  },
  weight: {
    type: String,
    enum: [
      "50g",
      "100g",
      "120g",
      "150g",
      "175g",
      "200g",
      "250g",
      "500g",
      "750g",
      "1kg",
      "2kg",
      "3kg",
      "5kg",
      "10kg",
      "12kg",
      "15kg",
      "100ml",
      "200ml",
      "500ml",
      "1L",
    ],
    required: true,
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
});
const nutritionSchema = new mongoose.Schema({
  calories: { type: String, default: "" },
  energy: { type: String, default: "" },
  calcium: { type: String, default: "" },
  iron: { type: String, default: "" },
  magnesium: { type: String, default: "" },
  sodium: { type: String, default: "" },
  carbohydrates: { type: String, default: "" },
  fiber: { type: String, default: "" },
  sugar: { type: String, default: "" },
  vitaminC: { type: String, default: "" },
  vitaminE: { type: String, default: "" },
  potassium: { type: String, default: "" },
  protein: { type: String, default: "" },
  fat: { type: String, default: "" },
  fulvicacid:{ type: String, default: "" },
  humicacid:{ type: String, default: "" },
  minerals:{ type: String, default: "" }
});

const detailsSchema = new mongoose.Schema({
  origin: { type: String, default: "" },
  variety: { type: String, default: "" },
  season: { type: String, default: "" },
  shelfLife: { type: String, default: "" },
  storage: { type: String, default: "" },
  certification: { type: String, default: "" },
  packaging: { type: String, default: "" },
});
const customBoxPriceSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["Small", "Medium", "Large"],
    required: true,
  },
  pricePerPiece: {
    type: Number,
    required: true,
  },
});
const comboNutritionItemSchema = new mongoose.Schema({
  name: { type: String, required: true },

  // ❌ REMOVE THIS
  // unit: { type: String },

  nutrition: {
    type: nutritionSchema,
    default: () => ({}),
  },
});
const productsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },
    isCombo: {
      type: Boolean,
      default: false,
    },
    nutrition: {
      type: nutritionSchema,
      default: () => ({}),
    },
    comboNutrition: {
      type: comboNutritionSchema,
      default: () => ({ items: [] }),
    },

    details: {
      type: detailsSchema,
      default: () => ({}),
    },

    rating: {
      type: Number,
      default: 0,
    },

    reviewsCount: {
      type: Number,
      default: 0,
    },

    badges: {
      type: [String],
      default: ["Bestseller", "Organic"],
    },

    image: {
      type: String,
      default: "",
    },

    images: {
      type: [String],
      default: [],
    },

    view360: {
      type: String,
      default: "",
    },
    variants: {
      type: [variantSchema],
      default: [],
    },

    customBoxPrices: {
      type: [customBoxPriceSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Products = mongoose.model("Products", productsSchema);
