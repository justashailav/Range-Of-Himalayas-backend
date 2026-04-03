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
    // 🔹 CART ITEMS
    // ===============================
    for (let i = 0; i < order.cartItems.length; i++) {
      const item = order.cartItems[i];

      const unitPrice =
        Number(item.price) || Number(item.salesPrice) || 100;

      products.push({
        name: item.title || "Product",
        quantity: item.quantity,

        // 🔥 FIX: total order value
        price: unitPrice * item.quantity,

        // 🔥 REQUIRED BY ICC
        sku: item.productId || `SKU_${i}`,
        description: item.title || "Product",
      });

      const itemWeight = parseWeightToKg(item.weight);
      totalWeight += itemWeight * item.quantity;
    }

    // ===============================
    // 🔹 BOX ITEMS
    // ===============================
    for (let i = 0; i < order.boxes.length; i++) {
      const box = order.boxes[i];

      for (let j = 0; j < box.items.length; j++) {
        const boxItem = box.items[j];

        // fallback price
        const unitPrice = 100;

        products.push({
          name: "Box Product",
          quantity: boxItem.quantity,
          price: unitPrice * boxItem.quantity,

          sku: boxItem.productId || `BOX_${j}`,
          description: "Box Item",
        });

        totalWeight += 0.5 * boxItem.quantity;
      }
    }

    // ===============================
    // ⚖️ WEIGHT FIX
    // ===============================
    if (totalWeight <= 0) totalWeight = 0.5;

    // 🔥 minimum safe weight
    totalWeight = Math.max(totalWeight, 0.1);

    // ===============================
    // 📍 ADDRESS
    // ===============================
    const addr = order.addressInfo;

    let fullAddress = addr.address || "";
    if (addr.notes) fullAddress += `, ${addr.notes}`;

    fullAddress = fullAddress.substring(0, 200);

    const deliveryAddress = {
      lines: fullAddress,
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
    };

    console.log("📦 ICC Payload:", payload);

    // ===============================
    // 🚀 API CALL
    // ===============================
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
