import { Router } from 'express';
import {
  getLiveRates,
  getLatestRate,
  getHistoricalRates,
  calculateGold,
  getProviderStatus,
  getCurrencies,
  getCountries,
} from '../controllers/goldController';

const router = Router();

// Gold Rates endpoints
router.get('/gold/rates', getLiveRates);
router.get('/gold/rates/latest', getLatestRate);
router.get('/gold/history', getHistoricalRates);
router.post('/gold/calculate', calculateGold);
router.get('/gold/provider-status', getProviderStatus);

// Master Data endpoints
router.get('/currencies', getCurrencies);
router.get('/countries', getCountries);

export default router;
