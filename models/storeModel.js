import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  // 🏷️ Basic Info
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  code: {
    type: String,
    unique: true // store unique code
  },

  // 📍 Address
  address: {
    line1: String,
    line2: String,
    city: String,
    state: String,
    country: { type: String, default: "India" },
    pincode: String
  },

  // 🌍 Geo Location (for nearest store)
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point"
    },
    coordinates: {
      type: [Number], // [lng, lat]
      index: "2dsphere"
    }
  },

  // 📞 Contact
  phone: String,
  whatsapp: String,
  email: String,

  // 🧑‍💼 Manager & Staff
  managerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  staffIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  // ⏰ Working Hours
  openingHours: [
    {
      day: String,
      open: String,
      close: String,
      isClosed: { type: Number, default: 0 }
    }
  ],

  // 🚀 ORDER MODES (pickup / delivery)
  orderModes: {
    type: [String], // ["pickup", "delivery"]
    default: ["pickup", "delivery"]
  },

  // 🚚 SERVICES (ADVANCED)
  services: {
    // 🏬 Pickup
    pickup: {
      enabled: { type: Number, default: 1 },
      preparationTimeMinutes: { type: Number, default: 30 },
      maxOrdersPerSlot: { type: Number, default: 20 }
    },

    // 🚚 Delivery
    delivery: {
      enabled: { type: Number, default: 1 },
      radiusKm: { type: Number, default: 5 },
      charge: { type: Number, default: 0 },
      freeDeliveryAbove: { type: Number, default: 0 },
      estimatedTimeMinutes: { type: Number, default: 60 }
    },

    // ⚡ Express Delivery
    expressDelivery: {
      enabled: { type: Number, default: 0 },
      charge: { type: Number, default: 50 },
      timeMinutes: { type: Number, default: 30 }
    }
  },

  // 🕒 Pickup Slots (optional but powerful)
  pickupSlots: [
    {
      start: String, // "10:00"
      end: String,   // "11:00"
      maxOrders: Number
    }
  ],

  // 📦 Store Status
  isActive: { type: Number, default: 1 },
  isOpenNow: { type: Number, default: 1 },
  isAcceptingOrders: { type: Number, default: 1 },

  // ⚙️ Automation
  autoOpenClose: { type: Number, default: 0 },
  holidayDates: [Date],

  // 📦 Inventory System
  inventoryType: {
    type: String,
    enum: ["central", "store-based"],
    default: "store-based"
  },

  // 💰 Pricing & Offers
  priceMultiplier: { type: Number, default: 1 },
  activeOffers: [
    {
      title: String,
      discountType: String, // "percentage" / "flat"
      value: Number,
      validTill: Date
    }
  ],

  // 📊 Analytics
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },

  // 🔐 Permissions (Manager Panel)
  permissions: {
    canManageOrders: { type: Number, default: 1 },
    canManageInventory: { type: Number, default: 1 },
    canViewReports: { type: Number, default: 1 },
    canEditStore: { type: Number, default: 0 }
  },

  // 🧠 Smart Controls
  priority: { type: Number, default: 0 },
  tags: [String], // ["flagship", "warehouse"]
  zone: String,

  // 🔗 Integrations
  posSystemId: String,
  warehouseId: String,

  // 🖼️ Media
  images: [String],
  banner: String,

  // 🧾 Notes
  notes: String

}, { timestamps: true });
export const Store= mongoose.model("Store", storeSchema);