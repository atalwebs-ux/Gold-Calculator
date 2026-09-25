"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_COUNTRIES_LIST = void 0;
exports.getLiveRates = getLiveRates;
exports.getLatestRate = getLatestRate;
exports.getHistoricalRates = getHistoricalRates;
exports.calculateGold = calculateGold;
exports.getProviderStatus = getProviderStatus;
exports.getCurrencies = getCurrencies;
exports.getCountries = getCountries;
const zod_1 = require("zod");
const goldRateService_1 = require("../services/goldRateService");
const fastForexProvider_1 = require("../providers/fastForexProvider");
const goldPriceProvider_1 = require("../providers/goldPriceProvider");
const response_1 = require("../utils/response");
const calculateSchema = zod_1.z.object({
    weight: zod_1.z.number().positive('Weight must be greater than 0'),
    unit: zod_1.z.enum(['gram', '10g', '100g', 'kg', 'troy_oz', 'tola']),
    purity: zod_1.z.enum(['24K', '22K', '18K', '14K']),
    currency: zod_1.z.string().optional().default('USD'),
    country: zod_1.z.string().optional().default('US'),
    charges: zod_1.z
        .object({
        makingChargePercent: zod_1.z.number().min(0).max(100).optional().default(0),
        taxPercent: zod_1.z.number().min(0).max(100).optional().default(0),
    })
        .optional(),
});
async function getLiveRates(req, res) {
    try {
        const currency = req.query.currency || 'USD';
        const country = req.query.country || 'US';
        const rates = await goldRateService_1.goldRateService.getLiveGoldRates(currency, country);
        (0, response_1.sendSuccess)(res, rates, `Live gold rates for ${country} in ${currency}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch live gold rates';
        (0, response_1.sendError)(res, message, 500, 'RATES_FETCH_FAILED');
    }
}
async function getLatestRate(req, res) {
    try {
        const currency = req.query.currency || 'USD';
        const country = req.query.country || 'US';
        const purity = (req.query.purity || '24K').toUpperCase();
        const unit = (req.query.unit || 'gram').toLowerCase();
        const live = await goldRateService_1.goldRateService.getLiveGoldRates(currency, country);
        const purityRates = live.ratesByPurityAndUnit[purity];
        if (!purityRates || purityRates[unit] === undefined) {
            (0, response_1.sendError)(res, `Rate for ${purity} and ${unit} not found`, 400, 'INVALID_RATE_QUERY');
            return;
        }
        const price = purityRates[unit];
        (0, response_1.sendSuccess)(res, {
            country: live.country,
            currency: live.currency,
            purity,
            unit,
            price,
            formatted: `${live.currency} ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            change: live.change,
            changePercent: live.changePercent,
            source: live.source,
            lastUpdated: live.lastUpdated,
        }, `Latest rate for ${purity} (${unit})`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch latest rate';
        (0, response_1.sendError)(res, message, 500, 'LATEST_RATE_FAILED');
    }
}
async function getHistoricalRates(req, res) {
    try {
        const currency = req.query.currency || 'USD';
        const country = req.query.country || 'US';
        const purity = (req.query.purity || '24K').toUpperCase();
        const unit = (req.query.unit || 'gram').toLowerCase();
        const range = (req.query.range || '7d').toLowerCase();
        const history = await goldRateService_1.goldRateService.getHistoricalRates(currency, country, purity, unit, range);
        (0, response_1.sendSuccess)(res, history, `Historical rates for ${purity} (${unit}) in ${currency}`);
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch historical rates';
        (0, response_1.sendError)(res, message, 500, 'HISTORY_FETCH_FAILED');
    }
}
async function calculateGold(req, res) {
    try {
        const parseResult = calculateSchema.safeParse(req.body);
        if (!parseResult.success) {
            (0, response_1.sendError)(res, 'Invalid calculation parameters', 400, 'VALIDATION_ERROR', parseResult.error.flatten().fieldErrors);
            return;
        }
        const result = await goldRateService_1.goldRateService.calculateGold(parseResult.data);
        (0, response_1.sendSuccess)(res, result, 'Gold calculation completed successfully');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Gold calculation failed';
        (0, response_1.sendError)(res, message, 500, 'CALCULATION_ERROR');
    }
}
async function getProviderStatus(_req, res) {
    try {
        const [fastForexStatus, goldPriceStatus] = await Promise.all([
            fastForexProvider_1.fastForexProvider.getStatus(),
            goldPriceProvider_1.goldPriceProvider.getStatus(),
        ]);
        (0, response_1.sendSuccess)(res, {
            providers: {
                fastForex: {
                    name: 'fastFOREX.io',
                    type: 'fx_rates',
                    healthy: fastForexStatus.healthy,
                    latencyMs: fastForexStatus.latencyMs,
                    error: fastForexStatus.error ?? null,
                },
                goldPrice: {
                    name: 'GoldPrice.dev',
                    type: 'spot_metals',
                    healthy: goldPriceStatus.healthy,
                    latencyMs: goldPriceStatus.latencyMs,
                    error: goldPriceStatus.error ?? null,
                },
            },
            timestamp: new Date().toISOString(),
        }, 'Provider status retrieved');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to retrieve provider status';
        (0, response_1.sendError)(res, message, 500, 'PROVIDER_STATUS_FAILED');
    }
}
async function getCurrencies(_req, res) {
    try {
        const { rates, updated } = await fastForexProvider_1.fastForexProvider.fetchAllRates('USD');
        const currencyNames = await fastForexProvider_1.fastForexProvider
            .getCurrencies()
            .catch(() => ({}));
        const list = Object.entries(rates).map(([code, rate]) => ({
            code,
            name: currencyNames[code] || code,
            exchangeRateToUSD: rate,
        }));
        (0, response_1.sendSuccess)(res, {
            total: list.length,
            base: 'USD',
            updated,
            currencies: list,
        }, 'Currencies and exchange rates retrieved');
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch currencies';
        (0, response_1.sendError)(res, message, 500, 'CURRENCIES_FETCH_FAILED');
    }
}
exports.INITIAL_COUNTRIES_LIST = [
    { code: 'US', name: 'United States', currency: 'USD', symbol: '$', flag: '🇺🇸' },
    { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', flag: '🇮🇳' },
    { code: 'AE', name: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ', flag: '🇦🇪' },
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', symbol: '﷼', flag: '🇸🇦' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', symbol: '£', flag: '🇬🇧' },
    { code: 'AU', name: 'Australia', currency: 'AUD', symbol: 'A$', flag: '🇦🇺' },
    { code: 'CA', name: 'Canada', currency: 'CAD', symbol: 'C$', flag: '🇨🇦' },
    { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', flag: '🇸🇬' },
    { code: 'DE', name: 'Germany', currency: 'EUR', symbol: '€', flag: '🇩🇪' },
    { code: 'FR', name: 'France', currency: 'EUR', symbol: '€', flag: '🇫🇷' },
    { code: 'CH', name: 'Switzerland', currency: 'CHF', symbol: 'CHF', flag: '🇨🇭' },
    { code: 'JP', name: 'Japan', currency: 'JPY', symbol: '¥', flag: '🇯🇵' },
    { code: 'QA', name: 'Qatar', currency: 'QAR', symbol: '﷼', flag: '🇶🇦' },
    { code: 'KW', name: 'Kuwait', currency: 'KWD', symbol: 'KD', flag: '🇰🇼' },
    { code: 'BH', name: 'Bahrain', currency: 'BHD', symbol: 'BD', flag: '🇧🇭' },
    { code: 'OM', name: 'Oman', currency: 'OMR', symbol: '﷼', flag: '🇴🇲' },
];
function getCountries(_req, res) {
    (0, response_1.sendSuccess)(res, exports.INITIAL_COUNTRIES_LIST, 'Supported countries retrieved');
}
//# sourceMappingURL=goldController.js.map