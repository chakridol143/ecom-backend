import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendVerificationEmail = async (
  to: string,
  confirmUrl: string
) => {
  await transporter.sendMail({
    from: `"Ecom App" <noreply@brevo.com>`,
    to,
    subject: "Verify your email",
    html: `
      <h3>Email Verification</h3>
      <p>Please click the link below to verify your email:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
    `
  });
};
