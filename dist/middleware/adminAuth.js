"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAdminAuth = requireAdminAuth;
exports.generateAdminToken = generateAdminToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const response_1 = require("../utils/response");
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'gold-admin-secret-key-2026';
function requireAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        (0, response_1.sendError)(res, 'Authentication token missing or invalid', 401, 'UNAUTHORIZED');
        return;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    }
    catch (err) {
        (0, response_1.sendError)(res, 'Invalid or expired session token', 401, 'INVALID_TOKEN');
    }
}
function generateAdminToken(admin) {
    return jsonwebtoken_1.default.sign(admin, JWT_SECRET, { expiresIn: '7d' });
}
//# sourceMappingURL=adminAuth.js.map