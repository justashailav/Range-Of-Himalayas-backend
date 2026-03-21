import axios from "axios";

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: {
          name: "Range Of Himalayas",
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
        },
      }
    );

    console.log("Email sent via Brevo API:", response.data);
    return response.data;
  } catch (error) {
    console.error("Critical Email Error:", error.response?.data || error.message);
    throw error;
  }
};