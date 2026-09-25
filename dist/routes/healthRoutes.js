"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const healthController_1 = require("../controllers/healthController");
const router = (0, express_1.Router)();
// GET /api/v1/health
router.get('/health', healthController_1.getHealth);
exports.default = router;
//# sourceMappingURL=healthRoutes.js.map