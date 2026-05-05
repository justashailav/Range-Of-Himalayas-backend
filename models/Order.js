import mongoose from "mongoose";
const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
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
        batchId: String,
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
            "500ml (Honey) 500ml (Sea Buckthorn Pulp)",
            "500ml (Honey) 10g (Himalayan Shilajit)",
            "500ml (Honey) 20g (Himalayan Shilajit)",
            "10g (Himalayan Shilajit) 500ml (Sea Buckthorn Pulp)",
            "10g (Himalayan Shilajit) 200ml (Sea Buckthorn Pulp)",
            "20g (Himalayan Shilajit) 200ml (Sea Buckthorn Pulp)",
            "20g (Himalayan Shilajit) 500ml (Sea Buckthorn Pulp)",
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
        },
        boxName: String,
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
      location: {
        type: {
          type: String,
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "partial_paid", "paid", "failed"],
      default: "pending",
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    razorpayOrderId: {
      type: String,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
    },

    razorpaySignature: {
      type: String,
    },

    codAdvanceAmount: {
      type: Number,
      default: 0,
    },

    codRemainingAmount: {
      type: Number,
      default: 0,
    },

    codAdvancePaid: {
      type: Boolean,
      default: false,
    },

    code: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "partially_cancelled",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "rejected",
        "cancelled",
      ],
      default: "pending",
    },
    courierOrderId: {
      type: String,
    },

    awb: {
      type: String,
    },

    shipmentId: {
      type: String,
    },

    shippingStatus: {
      type: String,
      enum: ["pending", "created", "shipped", "failed"],
      default: "pending",
    },
    statusHistory: [
      {
        status: {
          type: String,
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
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
        },
        quantity: Number,
        price: Number,
        reason: String,
        cancelledAt: {
          type: Date,
          default: Date.now,
        },
        refundAvailableDate: {
          type: Date,
          default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        refunded: {
          type: Boolean,
          default: false,
        },
      },
    ],

    /* ✅ RETURNS */
    returnRequests: [
      {
        reason: String,
        photos: [String],
        videos: [String],
        status: {
          type: String,
          enum: ["requested", "approved", "rejected", "refunded"],
          default: "requested",
        },
        refundAmount: Number,
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
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
