import axios from "axios";

import { Products } from "../models/AdminModel/productsModel.js";
import { User } from "../models/userModel.js";


const BASE_URL = "https://api.indiancouriercompany.com/api/custom";

// 🔥 Convert weight string → kg
const parseWeightToKg = (weightStr) => {
  if (!weightStr) return 0.5;

  weightStr = weightStr.toLowerCase();

  if (weightStr.includes("kg")) {
    return parseFloat(weightStr);
  }

  if (weightStr.includes("g")) {
    return parseFloat(weightStr) / 1000;
  }

  if (weightStr.includes("ml")) {
    return parseFloat(weightStr) / 1000; // assume 1ml ≈ 1g
  }

  return 0.5;
};

export const createICCOrder = async (order) => {
  try {
    const user = await User.findById(order.userId).lean();

    let products = [];
    let totalWeight = 0;

    // ===============================
    // 📦 CART ITEMS
    // ===============================
    for (let i = 0; i < order.cartItems.length; i++) {
      const item = order.cartItems[i];

      const unitPrice =
        Number(item.price) || Number(item.salesPrice) || 100;

      const orderValue = unitPrice * item.quantity;

      products.push({
        productName: item.title || "Product",   // ✅ FIX
        quantity: item.quantity,
        sku: item.productId || `SKU_${i}`,
        orderValue: orderValue,                // ✅ FIX
        hsn: "0000", // optional (you can improve later)
      });

      const itemWeight = parseWeightToKg(item.weight);
      totalWeight += itemWeight * item.quantity;
    }

    // ===============================
    // ⚖️ WEIGHT FIX
    // ===============================
    if (totalWeight <= 0) totalWeight = 0.5;
    totalWeight = Math.max(totalWeight, 0.1);

    // ===============================
    // 📍 ADDRESS FIX (ARRAY FORMAT)
    // ===============================
    const addr = order.addressInfo;

    let addressLines = [addr.address || ""];

    if (addr.notes) {
      addressLines.push(addr.notes);
    }

    const deliveryAddress = {
      lines: addressLines, // ✅ MUST BE ARRAY
      city: addr.city,
      state: "Himachal Pradesh",
      pincode: addr.pincode,
      customerName: user?.name || "Customer",
    };

    // ===============================
    // 📞 PHONE
    // ===============================
    const phone = (addr.phone || "")
      .replace(/\D/g, "")
      .slice(-10);

    const deliveryPhones = [
      {
        phoneNumber: phone,
        phoneType: "Primary",
      },
    ];

    // ===============================
    // 💳 PAYMENT MODE
    // ===============================
    const paymentMode =
      order.paymentMethod === "cod" ? "COD" : "Prepaid";

    // ===============================
    // 📄 INVOICE (REQUIRED IN MANY CASES)
    // ===============================
    const invoice = {
      invoiceDate: new Date().toISOString(),
      invoiceNumber: `INV_${order._id}`,
      shippingCharge: 0,
      hasDisconnect: false,
      hasShippingCharge: false,
      discount: 0,
    };

    // ===============================
    // 📦 FINAL PAYLOAD
    // ===============================
    const payload = {
      orderId: order._id.toString(),
      paymentMode,

      deliveryAddress,
      deliveryPhones,

      physicalWeight: Number(totalWeight.toFixed(2)),

      dimensions: {
        length: 10,
        breadth: 10,
        height: 10,
      },

      products,

      invoice, // ✅ IMPORTANT
      channel: "Custom", // ✅ IMPORTANT

      
    };

    console.log("📦 ICC FINAL PAYLOAD:", payload);

    const res = await axios.post(
      `${BASE_URL}/createOrder`,
      payload,
      {
        headers: {
          email: process.env.ICC_EMAIL,
          password: process.env.ICC_PASSWORD,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ ICC Response:", res.data);

    return res.data;

  } catch (error) {
    console.error(
      "❌ ICC ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
};


export const trackICCByOrderId = async (orderId, phone) => {
  try {
    const cleanPhone = (phone || "")
      .replace(/\D/g, "")
      .slice(-10);

    const url = `${BASE_URL}/tracking?orderId=${orderId}&phone=${cleanPhone}`;

    const res = await axios.post(
      url,
      {},
      {
        headers: {
          email: process.env.ICC_EMAIL,
          password: process.env.ICC_PASSWORD,
        },
      }
    );

    return res.data;

  } catch (error) {
    console.error(
      "❌ ICC TRACK ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
};