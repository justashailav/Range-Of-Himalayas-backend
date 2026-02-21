import axios from "axios";
import qs from "qs";

const PHONEPE_BASE_URL =
  "https://api-preprod.phonepe.com/apis/hermes";


// 🔥 STEP 1 — Generate Access Token
export const generateAccessToken = async () => {
  try {
    const response = await axios.post(
      `${PHONEPE_BASE_URL}/v1/oauth/token`,
      qs.stringify({
        client_id: process.env.PHONEPE_MERCHANT_ID,
        client_version: process.env.PHONEPE_SALT_INDEX, // this is 1
        client_secret: process.env.PHONEPE_SALT_KEY,
        grant_type: "client_credentials",
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error("❌ Token generation failed:", error.response?.data || error);
    throw error;
  }
};

// 🔥 STEP 2 — Initiate Payment
export const phonePePay = async (payload) => {
  try {
    const token = await generateAccessToken();

    const response = await axios.post(
      `${PHONEPE_BASE_URL}/pg/v1/pay`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ PhonePe Pay Error:", error.response?.data || error);
    throw error;
  }
};

// 🔥 STEP 3 — Check Payment Status
export const phonePeStatus = async (merchantTransactionId) => {
  try {
    const token = await generateAccessToken();

    const response = await axios.get(
      `${PHONEPE_BASE_URL}/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("❌ PhonePe Status Error:", error.response?.data || error);
    throw error;
  }
};