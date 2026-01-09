import { Resend } from "resend";

export const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(
  to: string,
  confirmUrl: string
) {
  await resend.emails.send({
    from: "Ecom <onboarding@resend.dev>",
    to,
    subject: "Confirm your email",
    html: `
      <h3>Email Verification</h3>
      <p>Click the link below to verify your email:</p>
      <a href="${confirmUrl}">${confirmUrl}</a>
    `
  });
}
