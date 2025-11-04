import mongoose from "mongoose";

const productReviewSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products", // Must match your Products model name
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // optional, but good practice
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    reviewMessage: {
      type: String,
      required: true,
    },
    reviewValue: {
      type: Number,
      required: true,
    },
    reviewImages: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", productReviewSchema);
