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
          enum: ["Small", "Medium", "Large", ""],
          default: "",
        },
        weight: {
          type: String,
          enum: [
            "10g",
            "20g",
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
            "500ml (Honey) 100ml (Apricot Oil)",
            "500ml (Honey) 200ml (Sea Buckthorn Pulp)",
            "500ml (Honey) 10g (Himalayan Shilajit)",
            "500ml (Honey) 20g (Himalayan Shilajit)"
          ],
          required: true,
        },
      },
    ],
  },
  { timestamps: true },
);

export const WishList = mongoose.model("WishList", wishListSchema);
