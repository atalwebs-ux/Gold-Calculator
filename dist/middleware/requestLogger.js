"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestLogger = requestLogger;
const logger_1 = require("../utils/logger");
function requestLogger(req, res, next) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    res.on('finish', () => {
        const duration = Date.now() - start;
        const { statusCode } = res;
        logger_1.logger.info(`${method} ${originalUrl} ${statusCode} - ${duration}ms`, {
            ip,
            method,
            url: originalUrl,
            statusCode,
            durationMs: duration,
        });
    });
    next();
}
//# sourceMappingURL=requestLogger.js.map