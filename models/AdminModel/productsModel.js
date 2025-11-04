import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["Small", "Medium", "Large"],
    required: true,
  },
  weight: {
    type: String,
    enum: ["1kg","2kg","3kg","5kg", "10kg", "12kg", "15kg"],
    required: true,
  },
  stock: { type: Number, required: true, default: 0 },
  price: { type: Number, required: true, default: 0 }, // normal pack price
  salesPrice: { type: Number, default: 0 },
});

// ✅ Nutrition schema
const nutritionSchema = new mongoose.Schema({
  calories: { type: String, default: "" },
  carbohydrates: { type: String, default: "" },
  fiber: { type: String, default: "" },
  sugar: { type: String, default: "" },
  vitaminC: { type: String, default: "" },
  potassium: { type: String, default: "" },
  protein: { type: String, default: "" },
  fat: { type: String, default: "" },
});

// ✅ Product details schema
const detailsSchema = new mongoose.Schema({
  origin: { type: String, default: "" },
  variety: { type: String, default: "" },
  season: { type: String, default: "" },
  shelfLife: { type: String, default: "" },
  storage: { type: String, default: "" },
  certification: { type: String, default: "" },
  size: { type: String, default: "" },
  packaging: { type: String, default: "" },
});

// ✅ Custom box price per size
const customBoxPriceSchema = new mongoose.Schema({
  size: {
    type: String,
    enum: ["Small", "Medium", "Large"],
    required: true,
  },
  pricePerPiece: { type: Number, required: true },
});

// ✅ Product schema
const productsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    nutrition: { type: nutritionSchema, default: () => ({}) },
    details: { type: detailsSchema, default: () => ({}) },
    rating: { type: Number, default: 0 },
    reviewsCount: { type: Number, default: 0 },
    badges: { type: [String], default: ["Bestseller", "Organic"] },
    image: { type: String, default: "" },
    images: { type: [String], default: [] },
    view360: { type: String, default: "" },
    variants: [variantSchema], // normal pack variants
    customBoxPrices: [customBoxPriceSchema], // price per piece for custom box
  },
  { timestamps: true }
);

export const Products = mongoose.model("Products", productsSchema);
