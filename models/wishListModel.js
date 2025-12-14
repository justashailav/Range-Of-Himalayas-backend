import mongoose from "mongoose";
const wishListSchema = new mongoose.Schema(
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
          default: 1,
        },
        size: {
          type: String,
          enum: ["Small", "Medium", "Large",""],
          default:""
        },
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
  { timestamps: true }
);

export const WishList = mongoose.model("WishList", wishListSchema);
