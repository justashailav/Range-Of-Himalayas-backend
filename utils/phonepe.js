import crypto from "crypto";
import axios from "axios";

const PHONEPE_BASE_URL =
  "https://api-preprod.phonepe.com/apis/pg-sandbox";

export const createChecksum = (payload, apiPath) => {
  const base64Payload = Buffer
    .from(JSON.stringify(payload))
    .toString("base64");

  const hash =
    crypto
      .createHash("sha256")
      .update(
        base64Payload +
          apiPath +
          process.env.PHONEPE_SALT_KEY
      )
      .digest("hex");

  const checksum =
    hash + "###" + process.env.PHONEPE_SALT_INDEX;

  return { base64Payload, checksum };
};

export const phonePePay = async (payload) => {
  const apiPath = "/pg/v1/pay";

  const { base64Payload, checksum } =
    createChecksum(payload, apiPath);

  const response = await axios.post(
    `${PHONEPE_BASE_URL}${apiPath}`,
    { request: base64Payload },
    {
      headers: {
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
    }
  );

  return response.data;
};

export const phonePeStatus = async (
  merchantTransactionId
) => {
  const apiPath = `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`;

  const hash =
    crypto
      .createHash("sha256")
      .update(
        apiPath + process.env.PHONEPE_SALT_KEY
      )
      .digest("hex");

  const checksum =
    hash + "###" + process.env.PHONEPE_SALT_INDEX;

  const response = await axios.get(
    `${PHONEPE_BASE_URL}${apiPath}`,
    {
      headers: {
        "X-VERIFY": checksum,
        "X-MERCHANT-ID":
          process.env.PHONEPE_MERCHANT_ID,
      },
    }
  );

  return response.data;
};