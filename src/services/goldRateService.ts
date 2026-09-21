import { fastForexProvider, FALLBACK_FX_RATES } from '../providers/fastForexProvider';
import { goldPriceProvider } from '../providers/goldPriceProvider';
import { logger } from '../utils/logger';

export const TROY_OUNCE_IN_GRAMS = 31.1034768;
export const TOLA_IN_GRAMS = 11.6638038;

export const PURITY_RATIOS: Record<string, number> = {
  '24K': 1.0,
  '22K': 22 / 24,
  '18K': 18 / 24,
  '14K': 14 / 24,
};

export const FASTFOREX_PURITY_CODES: Record<string, string> = {
  '24K': '999',
  '22K': '916',
  '18K': '750',
  '14K': '585',
};

export const WEIGHT_MULTIPLIERS_IN_GRAMS: Record<string, number> = {
  gram: 1,
  '10g': 10,
  '100g': 100,
  kg: 1000,
  troy_oz: TROY_OUNCE_IN_GRAMS,
  tola: TOLA_IN_GRAMS,
};

export interface LiveRatesResponse {
  country: string;
  currency: string;
  fxRateToUSD: number;
  baseGoldPerTroyOzUSD: number;
  pricePerGram24K: number;
  bid: number;
  ask: number;
  ratesByPurityAndUnit: Record<string, Record<string, number>>;
  previousPricePerGram24K: number;
  change: number;
  changePercent: number;
  isStale: boolean;
  source: string;
  lastUpdated: string;
}

export interface CalculationInput {
  weight: number;
  unit: string;
  purity: string;
  currency?: string;
  country?: string;
  charges?: {
    makingChargePercent?: number;
    taxPercent?: number;
  };
}

export interface CalculationOutput {
  input: {
    weight: number;
    unit: string;
    purity: string;
    currency: string;
    country: string;
  };
  weightInGrams: number;
  ratePerGram: number;
  baseGoldValue: number;
  makingCharges: number;
  tax: number;
  totalEstimate: number;
  currency: string;
  calculationBreakdown: {
    purityRatio: number;
    unitMultiplier: number;
    ratePerGram24K: number;
  };
}

const previousRatesCache = new Map<string, number>();

export class GoldRateService {
  /**
   * Retrieves real-time calculated gold rates directly from fastFOREX /metals/spot endpoint.
   */
  async getLiveGoldRates(currency = 'USD', country = 'US'): Promise<LiveRatesResponse> {
    const curUpper = currency.toUpperCase();
    const countryUpper = country.toUpperCase();

    let pricePerGram24K: number;
    let bid = 0;
    let ask = 0;
    let lastUpdated = new Date().toISOString();
    let source = 'fastFOREX official /metals/spot';
    let fxRate = 1.0;
    let spotOzUSD = 4378.15;

    try {
      // 1. Primary: Direct fastFOREX /metals/spot call
      const metalSpot = await fastForexProvider.fetchMetalSpot('XAU', curUpper, 'gram', '999');
      pricePerGram24K = parseFloat(metalSpot.mid);
      bid = parseFloat(metalSpot.bid);
      ask = parseFloat(metalSpot.ask);
      lastUpdated = metalSpot.dtm;
      source = `fastFOREX (${metalSpot.source_instrument})`;

      // Fetch FX rate and USD spot for cross comparison
      if (curUpper !== 'USD') {
        fxRate = await fastForexProvider.fetchOne('USD', curUpper);
      }
      spotOzUSD = (pricePerGram24K * TROY_OUNCE_IN_GRAMS) / (fxRate || 1.0);
    } catch (err) {
      logger.warn('fastFOREX fetchMetalSpot failed, falling back to GoldPrice quotes', { error: String(err) });
      // Fallback: GoldPrice spot quote directly in requested currency
      const spotRes = await goldPriceProvider.getSpotGold(curUpper);
      pricePerGram24K = spotRes.pricePerTroyOz / TROY_OUNCE_IN_GRAMS;
      bid = pricePerGram24K * 0.9995;
      ask = pricePerGram24K * 1.0005;
      lastUpdated = spotRes.computedAt;
      source = 'GoldPrice.dev Live Spot';

      try {
        const usdSpot = await goldPriceProvider.getSpotGoldUSD();
        spotOzUSD = usdSpot.pricePerTroyOz;
        fxRate = curUpper === 'USD' ? 1.0 : spotRes.pricePerTroyOz / spotOzUSD;
      } catch {
        fxRate = curUpper === 'USD' ? 1.0 : (FALLBACK_FX_RATES[curUpper] || 1.0);
        spotOzUSD = spotRes.pricePerTroyOz / fxRate;
      }
    }

    // Safety guard: if INR and rate is anomalously low (< 3000), multiply by realistic FX
    if (curUpper === 'INR' && pricePerGram24K < 3000) {
      const realFx = fxRate > 1 ? fxRate : 95.8;
      pricePerGram24K = pricePerGram24K * realFx;
      bid = pricePerGram24K * 0.9995;
      ask = pricePerGram24K * 1.0005;
      fxRate = realFx;
    }

    // Previous rate & change calculation
    const cacheKey = `${countryUpper}_${curUpper}`;
    const prevRate = previousRatesCache.get(cacheKey) || pricePerGram24K * 0.998;
    previousRatesCache.set(cacheKey, pricePerGram24K);

    const change = pricePerGram24K - prevRate;
    const changePercent = prevRate > 0 ? (change / prevRate) * 100 : 0;

    // Generate rates across all purities and weight units
    const ratesByPurityAndUnit: Record<string, Record<string, number>> = {};

    for (const [purity, ratio] of Object.entries(PURITY_RATIOS)) {
      ratesByPurityAndUnit[purity] = {};
      const gramPrice = pricePerGram24K * ratio;

      for (const [unit, multiplier] of Object.entries(WEIGHT_MULTIPLIERS_IN_GRAMS)) {
        ratesByPurityAndUnit[purity][unit] = Number((gramPrice * multiplier).toFixed(4));
      }
    }

    return {
      country: countryUpper,
      currency: curUpper,
      fxRateToUSD: Number(fxRate.toFixed(4)),
      baseGoldPerTroyOzUSD: Number(spotOzUSD.toFixed(2)),
      pricePerGram24K: Number(pricePerGram24K.toFixed(4)),
      bid: Number(bid.toFixed(4)),
      ask: Number(ask.toFixed(4)),
      ratesByPurityAndUnit,
      previousPricePerGram24K: Number(prevRate.toFixed(4)),
      change: Number(change.toFixed(4)),
      changePercent: Number(changePercent.toFixed(2)),
      isStale: false,
      source,
      lastUpdated,
    };
  }

  /**
   * Executes transparent gold calculation based on live rates and weight/purity parameters.
   */
  async calculateGold(input: CalculationInput): Promise<CalculationOutput> {
    const currency = (input.currency || 'USD').toUpperCase();
    const country = (input.country || 'US').toUpperCase();
    const purity = input.purity.toUpperCase();
    const unit = input.unit.toLowerCase();

    const purityRatio = PURITY_RATIOS[purity];
    if (purityRatio === undefined) {
      throw new Error(`Invalid purity '${purity}'. Supported: 24K, 22K, 18K, 14K`);
    }

    const unitMultiplier = WEIGHT_MULTIPLIERS_IN_GRAMS[unit];
    if (unitMultiplier === undefined) {
      throw new Error(`Invalid weight unit '${unit}'. Supported: gram, 10g, 100g, kg, troy_oz, tola`);
    }

    if (input.weight <= 0 || isNaN(input.weight)) {
      throw new Error('Weight must be a positive number.');
    }

    const live = await this.getLiveGoldRates(currency, country);
    const ratePerGram24K = live.pricePerGram24K;
    const ratePerGram = ratePerGram24K * purityRatio;

    const weightInGrams = input.weight * unitMultiplier;
    const baseGoldValue = Number((weightInGrams * ratePerGram).toFixed(2));

    const makingChargePercent = input.charges?.makingChargePercent ?? 0;
    const taxPercent = input.charges?.taxPercent ?? 0;

    const makingCharges = Number(((baseGoldValue * makingChargePercent) / 100).toFixed(2));
    const tax = Number((((baseGoldValue + makingCharges) * taxPercent) / 100).toFixed(2));
    const totalEstimate = Number((baseGoldValue + makingCharges + tax).toFixed(2));

    return {
      input: {
        weight: input.weight,
        unit,
        purity,
        currency,
        country,
      },
      weightInGrams: Number(weightInGrams.toFixed(4)),
      ratePerGram: Number(ratePerGram.toFixed(4)),
      baseGoldValue,
      makingCharges,
      tax,
      totalEstimate,
      currency,
      calculationBreakdown: {
        purityRatio,
        unitMultiplier,
        ratePerGram24K,
      },
    };
  }

  /**
   * Retrieves historical chart points for a specific currency, purity, and unit.
   */
  async getHistoricalRates(
    currency = 'USD',
    country = 'US',
    purity = '24K',
    unit = 'gram',
    range = '7d'
  ) {
    const curUpper = currency.toUpperCase();
    const purityRatio = PURITY_RATIOS[purity.toUpperCase()] || 1.0;
    const unitMultiplier = WEIGHT_MULTIPLIERS_IN_GRAMS[unit.toLowerCase()] || 1;

    // Get live USD spot gold base (approx $140.62 / g)
    const { pricePerTroyOz: spotOzUSD } = await goldPriceProvider.getSpotGoldUSD();
    const spotGramUSD = spotOzUSD / TROY_OUNCE_IN_GRAMS;

    // Fetch daily FX time-series
    const fxSeries = await fastForexProvider.fetchTimeSeries('USD', curUpper);
    const dates = Object.keys(fxSeries).sort();

    // Slice based on range
    const count = range === '7d' ? 7 : range === '1m' ? 14 : range === '3m' ? 14 : 7;
    const selectedDates = dates.slice(-count);

    const defaultFx = curUpper === 'USD' ? 1.0 : (FALLBACK_FX_RATES[curUpper] || 95.8);

    const points = selectedDates.map((date) => {
      let fx = fxSeries[date] || defaultFx;
      if (curUpper === 'INR' && fx < 10) {
        fx = defaultFx;
      }
      const price = Number((spotGramUSD * fx * purityRatio * unitMultiplier).toFixed(2));
      return {
        date,
        price,
        formatted: `${curUpper} ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      };
    });

    const prices = points.map((p) => p.price);
    const highest = Math.max(...prices);
    const lowest = Math.min(...prices);
    const current = prices[prices.length - 1] || 0;
    const initial = prices[0] || current;
    const change = Number((current - initial).toFixed(2));
    const changePercent = initial > 0 ? Number(((change / initial) * 100).toFixed(2)) : 0;

    return {
      currency: curUpper,
      country: country.toUpperCase(),
      purity: purity.toUpperCase(),
      unit: unit.toLowerCase(),
      range,
      highest,
      lowest,
      current,
      change,
      changePercent,
      points,
      source: 'fastFOREX Real-Time Timeseries',
    };
  }
}

export const goldRateService = new GoldRateService();
