import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    cartId: {
      type: String,
    },

    cartItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
          required: true,
        },

        title: {
          type: String,
          required: true,
        },

        image: {
          type: String,
          default: "",
        },

        price: {
          type: Number,
          required: true,
        },

        salesPrice: {
          type: Number,
          default: 0,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        // ✅ OPTIONAL SIZE (fruits only)
        size: {
          type: String,
          enum: ["Small", "Medium", "Large", ""],
          default: "",
        },

        // ✅ REQUIRED WEIGHT (fruits + dry fruits)
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
      enum: ["razorpay", "cod"],
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

    cancellationReason: {
      type: String,
    },

    cancelledItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Products",
        },
        quantity: {
          type: Number,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        reason: String,
        cancelledAt: {
          type: Date,
          default: Date.now,
        },
        refundAvailableDate: {
          type: Date,
          default: () =>
            new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
        refunded: {
          type: Boolean,
          default: false,
        },
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
      name: String,
      quantity: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
