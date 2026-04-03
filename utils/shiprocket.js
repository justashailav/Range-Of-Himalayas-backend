import axios from "axios";

let SHIPROCKET_TOKEN = null;

// 🔐 Generate Token
export const generateToken = async () => {
  const res = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      email: process.env.SHIPROCKET_EMAIL,
      password: process.env.SHIPROCKET_PASSWORD,
    }
  );

  SHIPROCKET_TOKEN = res.data.token;
};

// 🚀 Create Shipment
export const createShipment = async (order, user) => {
  try {
    if (!SHIPROCKET_TOKEN) {
      await generateToken();
    }

    // 🔥 SAFE NAME SPLIT
    const fullName = user?.name || "Customer";
    const nameParts = fullName.trim().split(" ");

    // 🔥 SAFE ADDRESS OBJECT
    const addr = order.addressInfo || {};

    const payload = {
      order_id: order._id.toString(),
      order_date: new Date().toISOString().slice(0, 10),
      pickup_location: "Primary",

      // ✅ REQUIRED FIELDS (FIXED)
      billing_customer_name: nameParts[0],
      billing_last_name: nameParts.slice(1).join(" ") || "NA",

      billing_address: (addr.address || "NA").substring(0, 200),
      billing_city: addr.city || "Shimla",
      billing_pincode: addr.pincode || "17204",
      billing_state: addr.state || "Himachal Pradesh",
      billing_country: "India",
      billing_phone: addr.phone || "9015118744",

      shipping_is_billing: true,

      order_items: (order.cartItems || []).map((item) => ({
        name: item.title || "Product",
        sku: item.productId?.toString() || "SKU",
        units: item.quantity || 1,
        selling_price: item.price || 0,
      })),

      // 🔥 IMPORTANT: FULL AMOUNT + COD
      payment_method:
        order.paymentMethod === "cod" ? "COD" : "Prepaid",

      sub_total: order.totalAmount || 0,

      length: 10,
      breadth: 10,
      height: 5,
      weight: 0.5,
    };

    console.log("📦 Shiprocket Payload:", payload); // 🔥 DEBUG

    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      payload,
      {
        headers: {
          Authorization: `Bearer ${SHIPROCKET_TOKEN}`,
        },
      }
    );

    console.log("✅ Shiprocket Success:", res.data);

    return res.data;
  } catch (err) {
    console.log("❌ Shiprocket Error:", err.response?.data || err.message);
  }
};
// 🚚 Assign Courier
export const assignCourier = async (shipmentId) => {
  const res = await axios.post(
    "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
    {
      shipment_id: shipmentId,
    },
    {
      headers: {
        Authorization: `Bearer ${SHIPROCKET_TOKEN}`,
      },
    }
  );

  return res.data;
};