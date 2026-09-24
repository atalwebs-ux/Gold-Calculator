import { Router } from 'express';
import {
  sendOtp,
  verifyOtp,
  resendOtp,
  syncCustomer,
  getCustomer,
  listCustomers,
} from '../controllers/authController';

const router = Router();

// Registration Email OTP endpoints
router.post('/auth/send-otp', sendOtp);
router.post('/auth/verify-otp', verifyOtp);
router.post('/auth/resend-otp', resendOtp);

// Customer sync & database persistence endpoints
router.post('/auth/sync-user', syncCustomer);
router.get('/auth/customer', getCustomer);
router.get('/auth/customers', listCustomers);

export default router;
