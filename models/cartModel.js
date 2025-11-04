import mongoose from "mongoose";

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        size: {
          type: String,
          enum: ["Small", "Medium", "Large"], 
          required: true,
        },
        weight: {
          type: String,
          enum: ["1kg","2kg","3kg","5kg", "10kg", "12kg", "15kg"],
        },
      },
    ],

    boxes: [
      {
        boxId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CustomBox",
          required: true,
        },
        boxName: { type: String },
        items: [
          {
            productId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "Products",
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
              min: 1,
            },
            size: {
              type: String,
              enum: ["Small", "Medium", "Large"],
              required: true,
            },
            weight: {
              type: String,
              enum: ["1kg","2kg","3kg","5kg", "10kg", "12kg", "15kg"],
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
