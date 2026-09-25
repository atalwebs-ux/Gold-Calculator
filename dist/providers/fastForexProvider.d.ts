export interface FastForexRateMap {
    [currency: string]: number;
}
export interface FastForexMetalSpot {
    bid: string;
    ask: string;
    mid: string;
    spread: string;
    metal: string;
    currency: string;
    unit: string;
    tsp: number;
    dtm: string;
    cross_rate: boolean;
    source: string;
    source_instrument: string;
    purity: string;
    purity_name: string;
    ms: number;
}
export declare const FALLBACK_FX_RATES: Record<string, number>;
export declare class FastForexProvider {
    private apiKey;
    private baseUrl;
    private cacheTtlMs;
    private ratesCache;
    private metalsCache;
    private currenciesCache;
    constructor();
    private getHeaders;
    /**
     * Fetches real-time metal spot price from fastFOREX official /metals/spot endpoint.
     * Supports any world currency, purity (999/24K, 916/22K, 750/18K, 585/14K) and unit (gram, oz_t, tola).
     */
    fetchMetalSpot(metal?: string, currency?: string, unit?: string, purity?: string): Promise<FastForexMetalSpot>;
    /**
     * Fetches all exchange rates for a given base currency (default USD).
     * Utilizes in-memory TTL caching.
     */
    fetchAllRates(base?: string): Promise<{
        rates: FastForexRateMap;
        updated: string;
        isCached: boolean;
    }>;
    /**
     * Fetches exchange rate from one currency to another.
     */
    fetchOne(from: string, to: string): Promise<number>;
    /**
     * Converts an amount from one currency to another using fastFOREX /convert endpoint or rates.
     */
    convert(amount: number, from: string, to: string): Promise<{
        amount: number;
        result: number;
        rate: number;
    }>;
    /**
     * Fetches the supported currency dictionary from FastForex.
     */
    getCurrencies(): Promise<Record<string, string>>;
    /**
     * Fetches daily time-series exchange rates between two currencies.
     */
    fetchTimeSeries(from?: string, to?: string): Promise<Record<string, number>>;
    /**
     * Provider health and latency check.
     */
    getStatus(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
export declare const fastForexProvider: FastForexProvider;
