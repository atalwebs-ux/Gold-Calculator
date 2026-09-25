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
export declare function generateAndSendOtp(rawEmail: string, name?: string): Promise<OtpSendResponse>;
/**
 * Verify a submitted OTP for an email address
 */
export declare function verifyOtp(rawEmail: string, inputOtp: string): OtpVerifyResponse;
