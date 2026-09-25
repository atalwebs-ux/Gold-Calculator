export interface SendOtpResult {
    success: boolean;
    message: string;
    devOtp?: string;
}
/**
 * Send an OTP verification email to the user.
 */
export declare function sendOtpEmail(toEmail: string, otp: string, name?: string): Promise<SendOtpResult>;
