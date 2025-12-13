import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    cartId: String,
    cartItems: [
      {
        productId: String,
        title: String,
        image: String,
        salesPrice: String,
        price: String,
        quantity: Number,
        size: String,
        weight: {
          type: String,
          enum: ["1kg", "2kg", "3kg", "5kg", "10kg", "12kg", "15kg"],
          required: true,
        },
      },
    ],
    boxes: [
      {
        boxId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CustomBox",
          required: false,
        },
        boxName: {
          type: String,
          required: false,
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
            },
            size: {
              type: String,
              enum: ["Small", "Medium", "Large"],
              required: true,
            },
          },
        ],
      },
    ],
    addressInfo: {
      addressId: String,
      address: String,
      city: String,
      pincode: String,
      phone: String,
      notes: String,
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    orderUpdateDate: {
      type: Date,
      default: Date.now,
    },
    paymentId: String,
    razorpaySignature: String,
    payerId: String,

    code: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    orderStatus: {
      type: String,
      enum: [
        "confirmed",
        "partially_cancelled",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "confirmed",
    },

    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "confirmed",
            "partially_cancelled",
            "packed",
            "shipped",
            "out_for_delivery",
            "delivered",
            "rejected",
            "cancelled",
          ],
          required: true,
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    cancelStatus: {
      type: String,
      enum: ["none", "requested", "cancelled"],
      default: "none",
    },
    cancellationReason: String,
    cancelledItems: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Products" },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        reason: String,
        cancelledAt: { type: Date, default: Date.now },
        refundAvailableDate: {
          type: Date,
          default: function () {
            return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
          },
        },
        refunded: { type: Boolean, default: false },
      },
    ],
    returnRequests: [
      {
        reason: {
          type: String,
          required: true,
        },
        photos: [{ type: String }],
        videos: [{ type: String }],
        status: {
          type: String,
          enum: ["requested", "approved", "rejected", "refunded"],
          default: "requested",
        },
        refundAmount: {
          type: Number,
          default: 0,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        reviewedAt: Date,
      },
    ],
    returnStatus: {
      type: String,
      enum: ["none", "requested", "approved", "rejected", "refunded"],
      default: "none",
    },
    refundStatus: {
      type: String,
      enum: ["none", "processing", "refunded", "rejected", "manual"],
      default: "none",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    freeGift: {
      name: { type: String },
      quantity: { type: Number, default: 0 },
      price: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
