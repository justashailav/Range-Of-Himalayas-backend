import axios from "axios";

export const sendEmail = async ({ email, subject, message }) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing");
    }

    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Range of Himalayas",
          email: process.env.EMAIL_FROM,
        },
        to: [{ email }],
        subject: subject,
        htmlContent: message,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Email sent:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Email Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};