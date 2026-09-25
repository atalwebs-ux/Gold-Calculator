import { Router } from 'express';
import {
  adminLogin,
  changePassword,
  getDashboardStats,
  listUsers,
  deleteUser,
  exportUsersCsv,
  listAdminPosts,
  createAdminPoll,
  deleteAdminPost,
} from '../controllers/adminController';
import { requireAdminAuth } from '../middleware/adminAuth';

const router = Router();

// Public Admin Auth
router.post('/admin/login', adminLogin);

// Protected Admin Routes
router.post('/admin/change-password', requireAdminAuth as any, changePassword as any);
router.get('/admin/stats', requireAdminAuth as any, getDashboardStats as any);
router.get('/admin/users', requireAdminAuth as any, listUsers as any);
router.delete('/admin/users/:id', requireAdminAuth as any, deleteUser as any);
router.get('/admin/users/export', requireAdminAuth as any, exportUsersCsv as any);
router.get('/admin/posts', requireAdminAuth as any, listAdminPosts as any);
router.post('/admin/poll', requireAdminAuth as any, createAdminPoll as any);
router.delete('/admin/posts/:id', requireAdminAuth as any, deleteAdminPost as any);

export default router;
