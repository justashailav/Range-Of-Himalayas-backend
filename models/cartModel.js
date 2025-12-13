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

        // ✅ SIZE → OPTIONAL (matches Product variant)
        size: {
          type: String,
          enum: ["Small", "Medium", "Large", ""],
          default: "",
        },

        // ✅ WEIGHT → REQUIRED + same enum as Product
        weight: {
          type: String,
          enum: [
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
          ],
          required: true,
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

        boxName: {
          type: String,
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

            // ✅ SIZE OPTIONAL
            size: {
              type: String,
              enum: ["Small", "Medium", "Large", ""],
              default: "",
            },

            // ✅ WEIGHT REQUIRED
            weight: {
              type: String,
              enum: [
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
              ],
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
