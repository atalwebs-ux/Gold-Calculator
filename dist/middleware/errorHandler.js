"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const response_1 = require("../utils/response");
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    if (err instanceof response_1.AppError) {
        logger_1.logger.warn(`AppError: ${err.message}`, {
            path: req.path,
            method: req.method,
            statusCode: err.statusCode,
            code: err.code,
        });
        (0, response_1.sendError)(res, err.message, err.statusCode, err.code, err.details);
        return;
    }
    const errorObj = err instanceof Error ? err : new Error(String(err));
    logger_1.logger.error('Unhandled Exception occurred', errorObj, {
        path: req.path,
        method: req.method,
    });
    const message = process.env.NODE_ENV === 'production'
        ? 'An unexpected internal error occurred'
        : errorObj.message;
    (0, response_1.sendError)(res, message, 500, 'INTERNAL_SERVER_ERROR', null);
}
//# sourceMappingURL=errorHandler.js.map