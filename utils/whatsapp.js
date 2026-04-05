import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export const sendWhatsApp = async (phone, message) => {
  try {
    const cleanPhone = phone.replace(/\D/g, "").slice(-10);

    const res = await client.messages.create({
      from: "whatsapp:+14155238886",
      to: `whatsapp:+91${cleanPhone}`,
      body: message,
    });

    console.log("✅ Sent:", res.sid);
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
};