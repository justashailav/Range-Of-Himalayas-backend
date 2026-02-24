import axios from "axios";
import crypto from "crypto";

const BASE_URL = "https://api-preprod.phonepe.com/apis/hermes";
const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX;

// 🔥 Generate Checksum
const generateChecksum = (payload) => {
  const base64Payload = Buffer.from(payload).toString("base64");

  const stringToHash =
    base64Payload + "/pg/v1/pay" + SALT_KEY;

  const sha256 = crypto
    .createHash("sha256")
    .update(stringToHash)
    .digest("hex");

  const checksum = sha256 + "###" + SALT_INDEX;

  return { base64Payload, checksum };
};


// 🔥 STEP 1 — Initiate Payment
export const phonePePay = async (amount, userId) => {
  try {
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: "TXN_" + Date.now(),
      merchantUserId: userId,
      amount: amount * 100,
      redirectUrl: "https://rangeofhimalayas.co.in/success",
      redirectMode: "POST",
      callbackUrl:
        "https://range-of-himalayas-backend.onrender.com/api/payment/callback",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const payloadString = JSON.stringify(payload);

    const { base64Payload, checksum } =
      generateChecksum(payloadString);

    const response = await axios.post(
      `${BASE_URL}/pg/v1/pay`,
      {
        request: base64Payload,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
          accept: "application/json",
        },
      }
    );

    return response.data;

  } catch (error) {
    console.error("❌ PhonePe Pay Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};


// 🔥 STEP 2 — Check Payment Status
export const phonePeStatus = async (merchantTransactionId) => {
  try {
    const stringToHash =
      `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}` +
      SALT_KEY;

    const sha256 = crypto
      .createHash("sha256")
      .update(stringToHash)
      .digest("hex");

    const checksum = sha256 + "###" + SALT_INDEX;

    const response = await axios.get(
      `${BASE_URL}/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          "X-VERIFY": checksum,
          accept: "application/json",
        },
      }
    );

    return response.data;

  } catch (error) {
    console.error("❌ Status Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};