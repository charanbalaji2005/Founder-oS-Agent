import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"FounderOS AI Security" <${process.env.MAIL_USER}>`,
    to: email,
    subject: "FounderOS AI - Login Verification Code",
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <h2 style="color: #111827; margin-bottom: 20px;">Security Verification</h2>
        <p style="color: #4b5563; font-size: 16px; line-height: 24px;">
          Use the following verification code to complete your login to FounderOS AI. This code will expire in 10 minutes.
        </p>
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #111827;">${otp}</span>
        </div>
        <p style="color: #9ca3af; font-size: 12px;">
          If you did not request this code, please ignore this email or contact support if you have concerns about your account security.
        </p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
}
