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

    const res = await axios.post(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        order_id: order._id.toString(),
        order_date: new Date().toISOString().slice(0, 10),
        pickup_location: "Primary",

        billing_customer_name: user.name || "Customer",
        billing_address: order.addressInfo.address,
        billing_city: order.addressInfo.city,
        billing_pincode: order.addressInfo.pincode,
        billing_state: order.addressInfo.state,
        billing_country: "India",
        billing_phone: order.addressInfo.phone,

        shipping_is_billing: true,

        order_items: order.cartItems.map((item) => ({
          name: item.title || "Product",
          sku: item.productId.toString(),
          units: item.quantity,
          selling_price: item.price,
        })),

        // 🔥 IMPORTANT: FULL AMOUNT + COD
        payment_method:
          order.paymentMethod === "cod" ? "COD" : "Prepaid",

        sub_total: order.totalAmount,

        length: 10,
        breadth: 10,
        height: 5,
        weight: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${SHIPROCKET_TOKEN}`,
        },
      }
    );

    return res.data;
  } catch (err) {
    console.log("❌ Shiprocket Error:", err.response?.data);
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