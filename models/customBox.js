import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Products",
    required: true,
  },
  size: { 
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  pricePerUnit: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
});

const customBoxSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    boxName: {
      type: String,
      default: "My Apple Box",
      trim: true,
    },
    boxSize: {
      type: Number,
      required: true,
      enum: [6, 12, 24],
    },
    items: [itemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number, 
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: 0,
    },
    isGift: {
      type: Boolean,
      default: false,
    },
    message: {
      type: String,
      maxlength: 300,
      trim: true,
    },
  },
  { timestamps: true }
);

export const CustomBox = mongoose.model("CustomBox", customBoxSchema);
