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
        productName: item.title || "Product",
        quantity: item.quantity,
        sku: item.productId || `SKU_${i}`,
        orderValue: orderValue,
        hsn: "0000",
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
    // 📍 ADDRESS
    // ===============================
    const addr = order.addressInfo;

    let addressLines = [addr.address || ""];
    if (addr.notes) addressLines.push(addr.notes);

    const deliveryAddress = {
      lines: addressLines,
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
    // 📄 INVOICE
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
      orderId: order._id.toString(), // ✅ your ID (still fine)
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
      invoice,
      channel: "Custom",
    };

    console.log("📦 ICC FINAL PAYLOAD:", payload);

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

    // ===============================
    // 🔥 IMPORTANT RETURN FORMAT
    // ===============================
    if (!res.data?.data) {
      throw new Error("Invalid ICC response");
    }

    return {
      userOrderId: res.data.data.userOrderId, // 🔥 MAIN ID
      awbNumber: res.data.data.awbNumber,
      shipmentId: res.data.data.shipmentId,
      raw: res.data,
    };

  } catch (error) {
    console.error(
      "❌ ICC ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
};

export const trackICCShipment = async (order) => {
  try {
    if (!order?.courierOrderId) {
      throw new Error("❌ courierOrderId missing in order");
    }

    const cleanPhone = (order.addressInfo?.phone || "")
      .replace(/\D/g, "")
      .slice(-10);

    if (!cleanPhone) {
      throw new Error("❌ Phone number missing for tracking");
    }

    const url = `${BASE_URL}/tracking?orderId=${order.courierOrderId}&phone=${cleanPhone}`;

    console.log("🔍 Tracking URL:", url);

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

    console.log("📦 ICC TRACK RESPONSE:", res.data);

    if (!res.data?.success) {
      throw new Error(res.data?.message || "Tracking failed");
    }

    return res.data;
  } catch (error) {
    console.error(
      "❌ ICC TRACK ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
};


export const bookICCShipment = async (userOrderId) => {
  try {
    if (!userOrderId) {
      throw new Error("❌ userOrderId is required for booking shipment");
    }

    console.log("🚚 Booking shipment for:", userOrderId);

    const url = `${BASE_URL}/bookShipment`;

    const payload = {
      userOrderId: userOrderId, 
    };

    const res = await axios.post(url, payload, {
      headers: {
        email: process.env.ICC_EMAIL,
        password: process.env.ICC_PASSWORD,
        "Content-Type": "application/json",
      },
    });

    console.log("📦 ICC BOOK RESPONSE:", res.data);

    // ❌ Handle ICC error
    if (!res.data || res.data.success === false) {
      throw new Error(
        res.data?.message || "Shipment booking failed from ICC"
      );
    }

    // ✅ Extract data safely
    const data = res.data?.data || {};

    return {
      awbNumber: data.awbNumber || null,
      shipmentId: data.shipmentId || null,
      raw: res.data,
    };
  } catch (error) {
    console.error(
      "❌ BOOK ICC SHIPMENT ERROR:",
      error.response?.data || error.message
    );
    throw error;
  }
};