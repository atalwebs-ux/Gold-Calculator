"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goldController_1 = require("../controllers/goldController");
const router = (0, express_1.Router)();
// Gold Rates endpoints
router.get('/gold/rates', goldController_1.getLiveRates);
router.get('/gold/rates/latest', goldController_1.getLatestRate);
router.get('/gold/history', goldController_1.getHistoricalRates);
router.post('/gold/calculate', goldController_1.calculateGold);
router.get('/gold/provider-status', goldController_1.getProviderStatus);
// Master Data endpoints
router.get('/currencies', goldController_1.getCurrencies);
router.get('/countries', goldController_1.getCountries);
exports.default = router;
//# sourceMappingURL=goldRoutes.js.map