import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      // Use Port 465 for SSL in production
      port: parseInt(process.env.BREVO_PORT) || 465,
      // If port is 465, secure MUST be true. If 587, secure MUST be false.
      secure: true, 
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
      // Production optimizations
      pool: true, 
      connectionTimeout: 10000, // 10 seconds
      greetingTimeout: 10000,
    });

    const mailOptions = {
      from: `"HimalayanBooking" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Legendary Experience Email Dispatched:", info.messageId);
    return info;
  } catch (error) {
    // This will help you see if it's still a timeout or an Auth error
    console.error("Critical Email Error:", error.message);
    throw error;
  }
};