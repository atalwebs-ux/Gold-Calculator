import { Request, Response } from 'express';
import { generateAndSendOtp, verifyOtp as verifyOtpService } from '../services/otpService';
import { sendSuccess, sendError } from '../utils/response';

/**
 * POST /api/v1/auth/send-otp
 * Body: { email: string, name?: string }
 */
export async function sendOtp(req: Request, res: Response): Promise<void> {
  const { email, name } = req.body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    sendError(res, 'A valid email address is required', 400, 'INVALID_EMAIL');
    return;
  }

  try {
    const result = await generateAndSendOtp(email, name);

    if (!result.success) {
      const statusCode = result.cooldownRemaining ? 429 : 400;
      const code = result.cooldownRemaining ? 'COOLDOWN_ACTIVE' : 'OTP_SEND_FAILED';
      sendError(res, result.message, statusCode, code, {
        cooldownRemaining: result.cooldownRemaining,
      });
      return;
    }

    sendSuccess(
      res,
      {
        email: email.trim().toLowerCase(),
        devOtp: result.devOtp, // Only present in non-production
      },
      result.message
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to send OTP';
    console.error('[AUTH CONTROLLER] sendOtp error:', err);
    sendError(res, errMsg, 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/v1/auth/verify-otp
 * Body: { email: string, otp: string }
 */
export async function verifyOtp(req: Request, res: Response): Promise<void> {
  const { email, otp } = req.body;

  if (!email || typeof email !== 'string') {
    sendError(res, 'Email is required', 400, 'EMAIL_REQUIRED');
    return;
  }

  if (!otp || typeof otp !== 'string') {
    sendError(res, 'Verification code is required', 400, 'OTP_REQUIRED');
    return;
  }

  try {
    const result = verifyOtpService(email, otp);

    if (!result.success) {
      sendError(res, result.message, 400, result.error || 'VERIFY_FAILED');
      return;
    }

    sendSuccess(
      res,
      {
        verified: true,
        email: email.trim().toLowerCase(),
      },
      result.message
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Failed to verify OTP';
    console.error('[AUTH CONTROLLER] verifyOtp error:', err);
    sendError(res, errMsg, 500, 'INTERNAL_ERROR');
  }
}

/**
 * POST /api/v1/auth/resend-otp
 * Body: { email: string }
 */
export async function resendOtp(req: Request, res: Response): Promise<void> {
  return sendOtp(req, res);
}
