import { Router } from 'express';
import { sendOtp, verifyOtp, resendOtp } from '../controllers/authController';

const router = Router();

// Registration Email OTP endpoints
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);

export default router;
