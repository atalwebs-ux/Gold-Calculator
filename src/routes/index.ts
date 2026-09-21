import { Router } from 'express';
import healthRoutes from './healthRoutes';
import goldRoutes from './goldRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

// Mount Health Check endpoint
router.use('/', healthRoutes);

// Mount Gold & Forex endpoints
router.use('/', goldRoutes);

// Mount Notification endpoints
router.use('/', notificationRoutes);

export default router;
