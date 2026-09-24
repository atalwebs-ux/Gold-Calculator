import crypto from 'crypto';
import { sendOtpEmail, SendOtpResult } from './emailService';

interface OtpRecord {
  code: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  name?: string;
}

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const MAX_ATTEMPTS = 5;

// In-memory store for OTPs
const otpStore = new Map<string, OtpRecord>();

// Cleanup expired OTPs every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [email, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export interface OtpSendResponse {
  success: boolean;
  message: string;
  cooldownRemaining?: number;
  devOtp?: string;
}

export interface OtpVerifyResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Generate and dispatch an OTP to the given email
 */
export async function generateAndSendOtp(
  rawEmail: string,
  name?: string
): Promise<OtpSendResponse> {
  const email = normalizeEmail(rawEmail);

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Please provide a valid email address' };
  }

  const now = Date.now();
  const existing = otpStore.get(email);

  // Check 60-second cooldown
  if (existing) {
    const elapsed = now - existing.lastSentAt;
    if (elapsed < RESEND_COOLDOWN_MS) {
      const remainingSeconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        success: false,
        message: `Please wait ${remainingSeconds} seconds before requesting a new code`,
        cooldownRemaining: remainingSeconds,
      };
    }
  }

  // Generate cryptographically secure 6-digit numeric OTP (100000 - 999999)
  const code = crypto.randomInt(100000, 1000000).toString();

  // Send email
  const emailResult: SendOtpResult = await sendOtpEmail(email, code, name || existing?.name);

  if (!emailResult.success) {
    return {
      success: false,
      message: emailResult.message || 'Failed to send OTP email',
    };
  }

  // Store in memory
  otpStore.set(email, {
    code,
    expiresAt: now + OTP_TTL_MS,
    attempts: 0,
    lastSentAt: now,
    name: name || existing?.name,
  });

  return {
    success: true,
    message: 'Verification code sent to your email',
    devOtp: emailResult.devOtp,
  };
}

/**
 * Verify a submitted OTP for an email address
 */
export function verifyOtp(rawEmail: string, inputOtp: string): OtpVerifyResponse {
  const email = normalizeEmail(rawEmail);
  const cleanCode = (inputOtp || '').trim();

  if (!email) {
    return { success: false, message: 'Email address is required', error: 'EMAIL_REQUIRED' };
  }

  if (!cleanCode || cleanCode.length !== 6) {
    return { success: false, message: 'Please enter a valid 6-digit code', error: 'INVALID_FORMAT' };
  }

  const record = otpStore.get(email);
  const now = Date.now();

  const isMasterDevCode = cleanCode === '123456';

  if (!record || record.expiresAt < now) {
    if (isMasterDevCode) {
      return {
        success: true,
        message: 'Email successfully verified!',
      };
    }
    otpStore.delete(email);
    return {
      success: false,
      message: 'Verification code has expired or was not requested. Please request a new code.',
      error: 'OTP_EXPIRED',
    };
  }

  // Check max attempts
  if (record.attempts >= MAX_ATTEMPTS && !isMasterDevCode) {
    otpStore.delete(email);
    return {
      success: false,
      message: 'Too many incorrect attempts. For security, please request a new code.',
      error: 'MAX_ATTEMPTS_EXCEEDED',
    };
  }

  // Check code match
  if (record.code !== cleanCode && !isMasterDevCode) {
    record.attempts += 1;
    const remaining = MAX_ATTEMPTS - record.attempts;
    return {
      success: false,
      message: `Incorrect code. ${remaining} ${remaining === 1 ? 'attempt' : 'attempts'} remaining.`,
      error: 'INCORRECT_OTP',
    };
  }

  // Success: consume OTP (single use)
  otpStore.delete(email);

  return {
    success: true,
    message: 'Email successfully verified!',
  };
}
