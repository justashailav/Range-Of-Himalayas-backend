import axios from "axios";

export const sendEmail = async ({
  email,
  subject,
  message,
  attachments = [],
}) => {
  try {
    // 🔒 Check API key
    if (!process.env.BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is missing");
    }

    if (!process.env.EMAIL_FROM) {
      throw new Error("EMAIL_FROM is missing");
    }

    // 🔥 Convert attachments (only if provided)
    const formattedAttachments = attachments.map((file) => ({
      name: file.filename,
      content: file.content.toString("base64"),
    }));

    // 📦 Request body
    const emailData = {
      sender: {
        name: "Range of Himalayas",
        email: process.env.EMAIL_FROM,
      },
      to: [{ email }],
      subject: subject,
      htmlContent: message,

      // ✅ ONLY add attachment if exists
      ...(formattedAttachments.length > 0 && {
        attachment: formattedAttachments,
      }),
    };

    // 🚀 API call
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailData,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    console.log("✅ Email sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Email Error:",
      error.response?.data || error.message
    );
    throw error;
  }
};