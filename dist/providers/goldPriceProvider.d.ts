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
export declare class GoldPriceProvider {
    private baseUrl;
    private refreshInterval;
    private cachedQuotes;
    private lastFetchedAt;
    constructor();
    /**
     * Fetches latest spot gold prices from GoldPrice API.
     */
    fetchSpotPrices(): Promise<{
        quotes: Map<string, SpotSymbolQuote>;
        fetchedAt: string;
        isCached: boolean;
    }>;
    /**
     * Retrieves spot gold price for any requested currency per troy ounce directly from GoldPrice API quotes.
     */
    getSpotGold(currency?: string): Promise<{
        pricePerTroyOz: number;
        quoteCurrency: string;
        computedAt: string;
        isStale: boolean;
    }>;
    /**
     * Retrieves spot gold price for USD per troy ounce.
     */
    getSpotGoldUSD(): Promise<{
        pricePerTroyOz: number;
        computedAt: string;
        isStale: boolean;
    }>;
    /**
     * Health and status check for GoldPrice provider.
     */
    getStatus(): Promise<{
        healthy: boolean;
        latencyMs: number;
        error?: string;
    }>;
}
export declare const goldPriceProvider: GoldPriceProvider;
