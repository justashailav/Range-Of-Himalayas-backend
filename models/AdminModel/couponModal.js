import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  usageLimit: {
    type: Number,
    default: 1, // per user
  },
  usedCount: {
    type: Number,
    default: 0, // global total usage
  },
  usedBy: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      count: { type: Number, default: 0 },
    },
  ],
   maxUniqueUsers: {
    type: Number,
    default: 0, // 0 = unlimited, else e.g. 100 = first 100 users only
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

export const Coupon = mongoose.model("Coupon", couponSchema);
