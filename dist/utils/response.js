"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details ?? null;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
}
function sendError(res, message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR', details = null) {
    return res.status(statusCode).json({
        success: false,
        message,
        code,
        details,
    });
}
//# sourceMappingURL=response.js.map