import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ email, subject, message, attachments }) => {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM,
      to: email,
      subject,
      html: message,
      attachments: attachments?.map((file) => ({
        filename: file.filename,
        content: file.content,
      })),
    });

    console.log("Email sent successfully....");
  } catch (error) {
    console.error("Email Error →", error);
  }
};
