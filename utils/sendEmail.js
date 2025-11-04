import nodemailer from "nodemailer";

export const sendEmail = async ({ email, subject, message, attachments }) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",         
    auth: {
      user: process.env.SMTP_MAIL,
      pass: process.env.SMTP_PASSWORD
    },
    port: 465,
    secure: true,               
  });

  const mailOptions = {
    from: `"Range of Himalayas" <${process.env.SMTP_MAIL}>`,
    to: email,
    subject,
    html: message,
    attachments,
  };

  await transporter.sendMail(mailOptions);
};
