import { Router } from 'express';
import healthRoutes from './healthRoutes';
import goldRoutes from './goldRoutes';
import notificationRoutes from './notificationRoutes';
import authRoutes from './authRoutes';
import communityRoutes from './communityRoutes';
import adminRoutes from './adminRoutes';

const router = Router();

// Mount Health Check endpoint
router.use('/', healthRoutes);

// Mount Gold & Forex endpoints
router.use('/', goldRoutes);

// Mount Notification endpoints
router.use('/', notificationRoutes);

// Mount Auth & OTP endpoints
router.use('/', authRoutes);

// Mount Community Posts, Polls & Twitter Feed endpoints
router.use('/', communityRoutes);

// Mount Admin Management & Portal endpoints
router.use('/', adminRoutes);

export default router;
