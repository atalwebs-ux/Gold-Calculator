"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const adminAuth_1 = require("../middleware/adminAuth");
const router = (0, express_1.Router)();
// Public Admin Auth
router.post('/admin/login', adminController_1.adminLogin);
// Protected Admin Routes
router.post('/admin/change-password', adminAuth_1.requireAdminAuth, adminController_1.changePassword);
router.get('/admin/stats', adminAuth_1.requireAdminAuth, adminController_1.getDashboardStats);
router.get('/admin/users', adminAuth_1.requireAdminAuth, adminController_1.listUsers);
router.delete('/admin/users/:id', adminAuth_1.requireAdminAuth, adminController_1.deleteUser);
router.get('/admin/users/export', adminAuth_1.requireAdminAuth, adminController_1.exportUsersCsv);
router.get('/admin/posts', adminAuth_1.requireAdminAuth, adminController_1.listAdminPosts);
router.post('/admin/poll', adminAuth_1.requireAdminAuth, adminController_1.createAdminPoll);
router.delete('/admin/posts/:id', adminAuth_1.requireAdminAuth, adminController_1.deleteAdminPost);
exports.default = router;
//# sourceMappingURL=adminRoutes.js.map