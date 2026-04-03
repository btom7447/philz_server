import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@philzproperties.com";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  const { error } = await resend.emails.send({
    from: `Philz Properties <${FROM_EMAIL}>`,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("Resend email error:", error);
    throw new Error("Failed to send email");
  }
}

export function passwordResetEmail(resetUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b21a8;">Reset Your Password</h2>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <a href="${resetUrl}" style="display: inline-block; background: #6b21a8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Reset Password
      </a>
      <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
    </div>
  `;
}

export function adminApprovalRequestEmail(userName: string, userEmail: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b21a8;">New Admin Approval Request</h2>
      <p>A new user has registered with an @philzproperties.com email and is requesting admin access:</p>
      <ul>
        <li><strong>Name:</strong> ${userName}</li>
        <li><strong>Email:</strong> ${userEmail}</li>
      </ul>
      <p>Please log into the admin dashboard to approve or deny this request.</p>
    </div>
  `;
}

export function adminApprovedEmail(userName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b21a8;">Admin Access Approved</h2>
      <p>Hi ${userName},</p>
      <p>Your admin access for Philz Properties has been approved. You can now log in and access the admin dashboard.</p>
    </div>
  `;
}

export function adminDeniedEmail(userName: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b21a8;">Admin Access Denied</h2>
      <p>Hi ${userName},</p>
      <p>Your request for admin access has been denied. Your account has been set to a regular user role. If you believe this is an error, please contact an administrator.</p>
    </div>
  `;
}

export function emailVerificationEmail(verifyUrl: string) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #6b21a8;">Verify Your Email</h2>
      <p>Welcome to Philz Properties! Please verify your email address:</p>
      <a href="${verifyUrl}" style="display: inline-block; background: #6b21a8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
        Verify Email
      </a>
      <p style="color: #666; font-size: 14px;">This link expires in 24 hours.</p>
    </div>
  `;
}
