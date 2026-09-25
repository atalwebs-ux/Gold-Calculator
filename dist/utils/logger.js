"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function formatLog(level, message, context, err) {
    const payload = {
        level,
        message,
        timestamp: new Date().toISOString(),
    };
    if (context && Object.keys(context).length > 0) {
        // Sanitize any secrets
        const sanitized = { ...context };
        const secretKeys = ['password', 'token', 'authorization', 'apiKey', 'privateKey', 'secret'];
        for (const key of Object.keys(sanitized)) {
            if (secretKeys.some(s => key.toLowerCase().includes(s))) {
                sanitized[key] = '[REDACTED]';
            }
        }
        payload.context = sanitized;
    }
    if (err instanceof Error) {
        payload.error = err.stack || err.message;
    }
    else if (err) {
        payload.error = String(err);
    }
    return JSON.stringify(payload);
}
exports.logger = {
    info: (message, context) => {
        console.log(formatLog('info', message, context));
    },
    warn: (message, context) => {
        console.warn(formatLog('warn', message, context));
    },
    error: (message, err, context) => {
        console.error(formatLog('error', message, context, err));
    },
    debug: (message, context) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(formatLog('debug', message, context));
        }
    },
};
//# sourceMappingURL=logger.js.map