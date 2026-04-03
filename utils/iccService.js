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
    // ===============================
    // 👤 GET USER NAME
    // ===============================
    const user = await User.findById(order.userId).lean();

    // ===============================
    // 📦 PRODUCTS ARRAY + WEIGHT
    // ===============================
    let products = [];
    let totalWeight = 0;

    // 🔹 CART ITEMS
    for (let i = 0; i < order.cartItems.length; i++) {
      const item = order.cartItems[i];

      products.push({
        name: item.title || "Product",
        quantity: item.quantity,
        price: Number(item.price),
      });

      const itemWeight = parseWeightToKg(item.weight);
      totalWeight += itemWeight * item.quantity;
    }

    // 🔹 BOX ITEMS
    for (let i = 0; i < order.boxes.length; i++) {
      const box = order.boxes[i];

      for (let j = 0; j < box.items.length; j++) {
        const boxItem = box.items[j];

        const product = await Products.findById(boxItem.productId).lean();

        products.push({
          name: product?.title || "Box Product",
          quantity: boxItem.quantity,
          price: 0, // optional (you can improve later)
        });

        // assume 500g per box item (adjust if needed)
        totalWeight += 0.5 * boxItem.quantity;
      }
    }

    // fallback weight
    if (totalWeight <= 0) totalWeight = 0.5;

    const addr = order.addressInfo;

    // combine address + notes (important)
    let fullAddress = addr.address || "";

    if (addr.notes) {
      fullAddress += `, ${addr.notes}`;
    }

    // ICC expects clean string (max ~200 chars usually)
    fullAddress = fullAddress.substring(0, 200);

    const deliveryAddress = {
      lines: fullAddress,
      city: addr.city,
      state: "Himachal Pradesh", // static or dynamic later
      pincode: addr.pincode,
      customerName: user?.name || "Customer",
    };
    const phone = (addr.phone || "")
  .replace(/\D/g, "")   // remove +91, spaces
  .slice(-10);   

    const deliveryPhones = [
      {
        phoneNumber: phone,
        phoneType: "Primary",
      },
    ];
    const paymentMode = order.paymentMethod === "cod" ? "COD" : "Prepaid";
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
    const res = await axios.post(`${BASE_URL}/createOrder`, payload, {
      headers: {
        email: process.env.ICC_EMAIL,
        password: process.env.ICC_PASSWORD,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ ICC Response:", res.data);

    return res.data;
  } catch (error) {
    console.error("❌ ICC ERROR:", error.response?.data || error.message);
    throw error;
  }
};
