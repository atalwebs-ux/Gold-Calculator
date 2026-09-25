"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOtpEmail = sendOtpEmail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_1 = require("../config/env");
let transporter = null;
function getTransporter() {
    if (!transporter) {
        if (!env_1.config.smtp.user || !env_1.config.smtp.pass) {
            return null;
        }
        transporter = nodemailer_1.default.createTransport({
            host: env_1.config.smtp.host,
            port: env_1.config.smtp.port,
            secure: env_1.config.smtp.secure,
            auth: {
                user: env_1.config.smtp.user,
                pass: env_1.config.smtp.pass,
            },
            tls: {
                rejectUnauthorized: false, // Prevents self-signed cert failures on shared hosting
            },
        });
    }
    return transporter;
}
/**
 * Send an OTP verification email to the user.
 */
async function sendOtpEmail(toEmail, otp, name) {
    const mailTransporter = getTransporter();
    const userName = name && name.trim() ? name.trim() : 'Gold Live User';
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Verification Code - Gold Live</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0B0F19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #E2E8F0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0B0F19; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 500px; background-color: #131B2E; border: 1px solid #1E293B; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 24px 20px; text-align: center; border-bottom: 1px solid #1E293B;">
              <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 24px; background: rgba(212, 175, 55, 0.15); border: 1.5px solid #D4AF37; color: #D4AF37; font-size: 22px; font-weight: bold; margin-bottom: 12px;">
                ⌖
              </div>
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 1px; color: #F8FAFC;">
                GOLD LIVE
              </h1>
              <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">
                Real-Time Gold & Precious Metals Intelligence
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 32px 28px;">
              <h2 style="margin: 0 0 12px; font-size: 18px; font-weight: 600; color: #F1F5F9;">
                Verify Your Email Address
              </h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94A3B8;">
                Hello <strong style="color: #F8FAFC;">${userName}</strong>,<br>
                Thank you for signing up with Gold Live. Please use the 6-digit verification code below to confirm your email and activate your account.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background: #0B0F19; border: 1.5px solid #D4AF37; border-radius: 12px; padding: 22px; text-align: center; margin-bottom: 24px;">
                <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; font-weight: 600; display: block; margin-bottom: 8px;">
                  Your Verification Code
                </span>
                <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #F59E0B; display: inline-block;">
                  ${otp}
                </span>
                <div style="margin-top: 10px; font-size: 12px; color: #64748B;">
                  ⏱ Valid for 10 minutes
                </div>
              </div>

              <p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5; color: #64748B;">
                If you did not request this code or attempt to create a Gold Live account, you can safely disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #0B0F19; border-top: 1px solid #1E293B; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #475569;">
                &copy; ${new Date().getFullYear()} Gold Live. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
    // If no transporter configured, log and fallback in development
    if (!mailTransporter) {
        console.log(`\n========================================`);
        console.log(`[EMAIL SERVICE] SMTP Credentials not configured in .env`);
        console.log(`[EMAIL SERVICE] Target: ${toEmail}`);
        console.log(`[EMAIL SERVICE] Registration OTP Code: ${otp}`);
        console.log(`========================================\n`);
        return {
            success: true,
            message: 'OTP generated (SMTP not configured, checked in dev mode)',
            devOtp: env_1.config.env !== 'production' ? otp : undefined,
        };
    }
    try {
        const info = await mailTransporter.sendMail({
            from: env_1.config.smtp.from,
            to: toEmail,
            subject: `[${otp}] Your Gold Live Verification Code`,
            text: `Hello ${userName},\n\nYour Gold Live verification code is: ${otp}\n\nThis code is valid for 10 minutes.\nIf you did not request this code, please ignore this email.\n\n— The Gold Live Team`,
            html: htmlContent,
        });
        console.log(`[EMAIL SERVICE] OTP email delivered to ${toEmail}. MessageId: ${info.messageId}`);
        return {
            success: true,
            message: 'Verification code sent to your email',
        };
    }
    catch (err) {
        const errMessage = err instanceof Error ? err.message : String(err);
        console.error(`[EMAIL SERVICE] Failed to send email to ${toEmail}:`, errMessage);
        // If development, allow inspection without breaking user registration
        if (env_1.config.env !== 'production') {
            console.log(`[EMAIL SERVICE] Dev fallback -> OTP for ${toEmail}: ${otp}`);
            return {
                success: true,
                message: 'OTP generated with dev fallback',
                devOtp: otp,
            };
        }
        return {
            success: false,
            message: 'Failed to deliver verification email. Please check your email address.',
        };
    }
}
//# sourceMappingURL=emailService.js.map