import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendInviteEmail = async (to: string, workspaceName: string, role: string, inviteToken: string) => {
  const baseUrl = process.env.FRONTEND_URL || "http://localhost:8081";
  const acceptUrl = `${baseUrl}/?token=${inviteToken}&action=accept`;
  const declineUrl = `${baseUrl}/?token=${inviteToken}&action=decline`;

  const mailOptions = {
    from: `"FounderOS" <${process.env.MAIL_USER}>`,
    to,
    subject: `Invitation to join ${workspaceName} on FounderOS`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #111827;">FounderOS Workspace Invitation</h2>
        <p>You have been invited to join <strong>${workspaceName}</strong> as a <strong>${role}</strong>.</p>
        <p>FounderOS is an AI-powered company operating system where humans and AI agents work together.</p>
        <div style="margin: 30px 0;">
          <a href="${acceptUrl}" style="background-color: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-right: 10px;">Accept Invitation</a>
          <a href="${declineUrl}" style="background-color: #f3f4f6; color: #111827; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; border: 1px solid #e5e7eb;">Decline</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #6b7280;">If you don't have an account yet, you will be prompted to create one using this email address.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Invitation email sent to ${to}`);
  } catch (error) {
    console.error("❌ Failed to send invitation email:", error);
  }
};
