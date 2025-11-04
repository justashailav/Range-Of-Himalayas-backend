import { sendEmail } from "../utils/sendEmail.js";
export const contactFormHandler = async (req, res) => {
  try {
    const { name, email, phone, comment } = req.body;
    console.log(name,email,phone,comment)
    if (!name || !email || !phone || !comment) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const subject = `Contact Form Submission from ${name}`;
    const message = `
      <h2>New Contact Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Comment:</strong> ${comment}</p>
    `;

    await sendEmail({
      email: process.env.SMTP_MAIL, 
      subject,
      message,
    });

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Email sending error:", error);
    res.status(500).json({ message: "Failed to send message." });
  }
};
