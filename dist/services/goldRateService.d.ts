export declare const TROY_OUNCE_IN_GRAMS = 31.1034768;
export declare const TOLA_IN_GRAMS = 11.6638038;
export declare const PURITY_RATIOS: Record<string, number>;
export declare const FASTFOREX_PURITY_CODES: Record<string, string>;
export declare const WEIGHT_MULTIPLIERS_IN_GRAMS: Record<string, number>;
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
export declare class GoldRateService {
    /**
     * Retrieves real-time calculated gold rates directly from fastFOREX /metals/spot endpoint.
     */
    getLiveGoldRates(currency?: string, country?: string): Promise<LiveRatesResponse>;
    /**
     * Executes transparent gold calculation based on live rates and weight/purity parameters.
     */
    calculateGold(input: CalculationInput): Promise<CalculationOutput>;
    /**
     * Retrieves historical chart points for a specific currency, purity, and unit.
     */
    getHistoricalRates(currency?: string, country?: string, purity?: string, unit?: string, range?: string): Promise<{
        currency: string;
        country: string;
        purity: string;
        unit: string;
        range: string;
        highest: number;
        lowest: number;
        current: number;
        change: number;
        changePercent: number;
        points: {
            date: string;
            price: number;
            formatted: string;
        }[];
        source: string;
    }>;
}
export declare const goldRateService: GoldRateService;
