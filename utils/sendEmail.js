import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.BREVO_HOST,
      port: parseInt(process.env.BREVO_PORT),
      secure: false, 
      auth: {
        user: process.env.BREVO_USER,
        pass: process.env.BREVO_SMTP_KEY,
      },
    });

    const mailOptions = {
      // This will show as "HimalayanBooking <contact@rangeofhimalayas.co.in>"
      from: `"HimalayanBooking" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: subject,
      html: message,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email Dispatched Successfully:", info.messageId);
    return info;
  } catch (error) {
    console.error("Critical Email Error:", error.message);
    throw error;
  }
};