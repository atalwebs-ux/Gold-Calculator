import { config } from '../config/env';
import { logger } from '../utils/logger';
import { FALLBACK_FX_RATES } from './fastForexProvider';

export interface SpotSymbolQuote {
  symbol: string;
  quote_currency: string;
  unit: string;
  contract_type: string;
  price: string;
  is_stale: boolean;
  computed_at: string;
}

export interface SpotPricesResponse {
  symbols: SpotSymbolQuote[];
}

export class GoldPriceProvider {
  private baseUrl: string;
  private refreshInterval: number;
  private cachedQuotes: Map<string, SpotSymbolQuote> = new Map();
  private lastFetchedAt = 0;

  constructor() {
    this.baseUrl = config.goldApi.baseUrl;
    this.refreshInterval = config.goldApi.refreshInterval;
  }

  /**
   * Fetches latest spot gold prices from GoldPrice API.
   */
  async fetchSpotPrices(): Promise<{
    quotes: Map<string, SpotSymbolQuote>;
    fetchedAt: string;
    isCached: boolean;
  }> {
    const now = Date.now();
    if (this.cachedQuotes.size > 0 && now - this.lastFetchedAt < this.refreshInterval) {
      return {
        quotes: this.cachedQuotes,
        fetchedAt: new Date(this.lastFetchedAt).toISOString(),
        isCached: true,
      };
    }

    try {
      const url = `${this.baseUrl}/prices`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          ...(config.goldApi.apiKey ? { Authorization: `Bearer ${config.goldApi.apiKey}` } : {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`GoldPrice API error: ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as SpotPricesResponse;
      if (!json.symbols || !Array.isArray(json.symbols)) {
        throw new Error('Invalid response structure from GoldPrice API');
      }

      // Map quotes by quote_currency (e.g. "USD" -> quote)
      const map = new Map<string, SpotSymbolQuote>();
      for (const item of json.symbols) {
        if (item.symbol === 'XAU') {
          map.set(item.quote_currency.toUpperCase(), item);
        }
      }

      this.cachedQuotes = map;
      this.lastFetchedAt = now;

      logger.info(`GoldPrice API: successfully fetched ${map.size} spot XAU quotes`);

      return {
        quotes: map,
        fetchedAt: new Date(now).toISOString(),
        isCached: false,
      };
    } catch (err) {
      logger.error('GoldPrice fetchSpotPrices failed', err);
      if (this.cachedQuotes.size > 0) {
        logger.warn('Returning stale GoldPrice cached quotes due to network/API error');
        return {
          quotes: this.cachedQuotes,
          fetchedAt: new Date(this.lastFetchedAt).toISOString(),
          isCached: true,
        };
      }

      // Safe fallback if initial fetch fails before cache is primed (reference spot gold price)
      const fallbackQuote: SpotSymbolQuote = {
        symbol: 'XAU',
        quote_currency: 'USD',
        unit: 'troy_ounce',
        contract_type: 'spot',
        price: '4380.00',
        is_stale: true,
        computed_at: new Date().toISOString(),
      };
      const fallbackMap = new Map<string, SpotSymbolQuote>();
      fallbackMap.set('USD', fallbackQuote);
      return {
        quotes: fallbackMap,
        fetchedAt: new Date().toISOString(),
        isCached: true,
      };
    }
  }

  /**
   * Retrieves spot gold price for any requested currency per troy ounce directly from GoldPrice API quotes.
   */
  async getSpotGold(currency = 'USD'): Promise<{ pricePerTroyOz: number; quoteCurrency: string; computedAt: string; isStale: boolean }> {
    const { quotes } = await this.fetchSpotPrices();
    const curUpper = currency.toUpperCase();
    const quote = quotes.get(curUpper);
    if (quote) {
      return {
        pricePerTroyOz: parseFloat(quote.price),
        quoteCurrency: curUpper,
        computedAt: quote.computed_at,
        isStale: quote.is_stale,
      };
    }

    // If currency not directly returned, derive using USD quote + FX
    const usdQuote = quotes.get('USD');
    const usdPrice = usdQuote ? parseFloat(usdQuote.price) : 4356.92;
    const fx = FALLBACK_FX_RATES[curUpper] || 1.0;
    return {
      pricePerTroyOz: usdPrice * fx,
      quoteCurrency: curUpper,
      computedAt: usdQuote ? usdQuote.computed_at : new Date().toISOString(),
      isStale: false,
    };
  }

  /**
   * Retrieves spot gold price for USD per troy ounce.
   */
  async getSpotGoldUSD(): Promise<{ pricePerTroyOz: number; computedAt: string; isStale: boolean }> {
    const res = await this.getSpotGold('USD');
    return {
      pricePerTroyOz: res.pricePerTroyOz,
      computedAt: res.computedAt,
      isStale: res.isStale,
    };
  }

  /**
   * Health and status check for GoldPrice provider.
   */
  async getStatus(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const url = `${this.baseUrl}/prices`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      return {
        healthy: res.ok,
        latencyMs: Date.now() - start,
      };
    } catch (err) {
      return {
        healthy: false,
        latencyMs: Date.now() - start,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}

export const goldPriceProvider = new GoldPriceProvider();
