import { Request, Response } from 'express';
import { z } from 'zod';
import { goldRateService } from '../services/goldRateService';
import { fastForexProvider } from '../providers/fastForexProvider';
import { goldPriceProvider } from '../providers/goldPriceProvider';
import { sendSuccess, sendError } from '../utils/response';

const calculateSchema = z.object({
  weight: z.number().positive('Weight must be greater than 0'),
  unit: z.enum(['gram', '10g', '100g', 'kg', 'troy_oz', 'tola']),
  purity: z.enum(['24K', '22K', '18K', '14K']),
  currency: z.string().optional().default('USD'),
  country: z.string().optional().default('US'),
  charges: z
    .object({
      makingChargePercent: z.number().min(0).max(100).optional().default(0),
      taxPercent: z.number().min(0).max(100).optional().default(0),
    })
    .optional(),
});

export async function getLiveRates(req: Request, res: Response): Promise<void> {
  try {
    const currency = (req.query.currency as string) || 'USD';
    const country = (req.query.country as string) || 'US';

    const rates = await goldRateService.getLiveGoldRates(currency, country);
    sendSuccess(res, rates, `Live gold rates for ${country} in ${currency}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch live gold rates';
    sendError(res, message, 500, 'RATES_FETCH_FAILED');
  }
}

export async function getLatestRate(req: Request, res: Response): Promise<void> {
  try {
    const currency = (req.query.currency as string) || 'USD';
    const country = (req.query.country as string) || 'US';
    const purity = ((req.query.purity as string) || '24K').toUpperCase();
    const unit = ((req.query.unit as string) || 'gram').toLowerCase();

    const live = await goldRateService.getLiveGoldRates(currency, country);
    const purityRates = live.ratesByPurityAndUnit[purity];

    if (!purityRates || purityRates[unit] === undefined) {
      sendError(res, `Rate for ${purity} and ${unit} not found`, 400, 'INVALID_RATE_QUERY');
      return;
    }

    const price = purityRates[unit];
    sendSuccess(
      res,
      {
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
      },
      `Latest rate for ${purity} (${unit})`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch latest rate';
    sendError(res, message, 500, 'LATEST_RATE_FAILED');
  }
}

export async function getHistoricalRates(req: Request, res: Response): Promise<void> {
  try {
    const currency = (req.query.currency as string) || 'USD';
    const country = (req.query.country as string) || 'US';
    const purity = ((req.query.purity as string) || '24K').toUpperCase();
    const unit = ((req.query.unit as string) || 'gram').toLowerCase();
    const range = ((req.query.range as string) || '7d').toLowerCase();

    const history = await goldRateService.getHistoricalRates(currency, country, purity, unit, range);
    sendSuccess(res, history, `Historical rates for ${purity} (${unit}) in ${currency}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch historical rates';
    sendError(res, message, 500, 'HISTORY_FETCH_FAILED');
  }
}

export async function calculateGold(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = calculateSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError(
        res,
        'Invalid calculation parameters',
        400,
        'VALIDATION_ERROR',
        parseResult.error.flatten().fieldErrors
      );
      return;
    }

    const result = await goldRateService.calculateGold(parseResult.data);
    sendSuccess(res, result, 'Gold calculation completed successfully');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gold calculation failed';
    sendError(res, message, 500, 'CALCULATION_ERROR');
  }
}

export async function getProviderStatus(_req: Request, res: Response): Promise<void> {
  try {
    const [fastForexStatus, goldPriceStatus] = await Promise.all([
      fastForexProvider.getStatus(),
      goldPriceProvider.getStatus(),
    ]);

    sendSuccess(
      res,
      {
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
      },
      'Provider status retrieved'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to retrieve provider status';
    sendError(res, message, 500, 'PROVIDER_STATUS_FAILED');
  }
}

export async function getCurrencies(_req: Request, res: Response): Promise<void> {
  try {
    const { rates, updated } = await fastForexProvider.fetchAllRates('USD');
    const currencyNames: Record<string, string> = await fastForexProvider
      .getCurrencies()
      .catch(() => ({} as Record<string, string>));

    const list = Object.entries(rates).map(([code, rate]) => ({
      code,
      name: currencyNames[code] || code,
      exchangeRateToUSD: rate,
    }));

    sendSuccess(
      res,
      {
        total: list.length,
        base: 'USD',
        updated,
        currencies: list,
      },
      'Currencies and exchange rates retrieved'
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch currencies';
    sendError(res, message, 500, 'CURRENCIES_FETCH_FAILED');
  }
}

export const INITIAL_COUNTRIES_LIST = [
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

export function getCountries(_req: Request, res: Response): void {
  sendSuccess(res, INITIAL_COUNTRIES_LIST, 'Supported countries retrieved');
}
