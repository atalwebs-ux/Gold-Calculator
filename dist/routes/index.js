"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthRoutes_1 = __importDefault(require("./healthRoutes"));
const goldRoutes_1 = __importDefault(require("./goldRoutes"));
const notificationRoutes_1 = __importDefault(require("./notificationRoutes"));
const authRoutes_1 = __importDefault(require("./authRoutes"));
const communityRoutes_1 = __importDefault(require("./communityRoutes"));
const adminRoutes_1 = __importDefault(require("./adminRoutes"));
const router = (0, express_1.Router)();
// Mount Health Check endpoint
router.use('/', healthRoutes_1.default);
// Mount Gold & Forex endpoints
router.use('/', goldRoutes_1.default);
// Mount Notification endpoints
router.use('/', notificationRoutes_1.default);
// Mount Auth & OTP endpoints
router.use('/', authRoutes_1.default);
// Mount Community Posts, Polls & Twitter Feed endpoints
router.use('/', communityRoutes_1.default);
// Mount Admin Management & Portal endpoints
router.use('/', adminRoutes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map