"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
// Registration Email OTP endpoints
router.post('/auth/send-otp', authController_1.sendOtp);
router.post('/auth/verify-otp', authController_1.verifyOtp);
router.post('/auth/resend-otp', authController_1.resendOtp);
// Customer sync & database persistence endpoints
router.post('/auth/sync-user', authController_1.syncCustomer);
router.get('/auth/customer', authController_1.getCustomer);
router.get('/auth/customers', authController_1.listCustomers);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map