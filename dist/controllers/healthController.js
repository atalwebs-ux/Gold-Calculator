"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHealth = getHealth;
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const response_1 = require("../utils/response");
async function getHealth(_req, res) {
    const dbStatus = await (0, db_1.checkDatabaseConnection)();
    const healthData = {
        status: 'ok',
        version: '1.0.0',
        service: 'Global Gold Live API',
        environment: env_1.config.env,
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
            type: 'mysql',
            connected: dbStatus.connected,
            latencyMs: dbStatus.latencyMs ?? null,
            error: dbStatus.error ?? null,
        },
        goldApiProvider: {
            configured: env_1.config.goldApi.provider,
            status: 'active',
        },
        forexProvider: {
            configured: 'fastFOREX',
            status: env_1.config.fastForex.apiKey ? 'active' : 'unconfigured',
        },
    };
    (0, response_1.sendSuccess)(res, healthData, 'Global Gold Live service is operational');
}
//# sourceMappingURL=healthController.js.map