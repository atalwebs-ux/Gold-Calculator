import { Request, Response } from 'express';
export declare function getLiveRates(req: Request, res: Response): Promise<void>;
export declare function getLatestRate(req: Request, res: Response): Promise<void>;
export declare function getHistoricalRates(req: Request, res: Response): Promise<void>;
export declare function calculateGold(req: Request, res: Response): Promise<void>;
export declare function getProviderStatus(_req: Request, res: Response): Promise<void>;
export declare function getCurrencies(_req: Request, res: Response): Promise<void>;
export declare const INITIAL_COUNTRIES_LIST: {
    code: string;
    name: string;
    currency: string;
    symbol: string;
    flag: string;
}[];
export declare function getCountries(_req: Request, res: Response): void;
