import request from 'supertest';
import { app } from '../src/app';

describe('Gold Rates & FastForex Integration Endpoints', () => {
  // Allow time for external API calls if necessary
  jest.setTimeout(25000);

  it('GET /api/v1/countries should return list of supported countries', async () => {
    const res = await request(app).get('/api/v1/countries');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(16);
    expect(res.body.data[0]).toHaveProperty('code');
    expect(res.body.data[0]).toHaveProperty('currency');
  });

  it('GET /api/v1/currencies should return currencies list from FastForex', async () => {
    const res = await request(app).get('/api/v1/currencies');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('currencies');
    expect(Array.isArray(res.body.data.currencies)).toBe(true);
    expect(res.body.data.currencies.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/gold/rates should return real-time rates matrix', async () => {
    const res = await request(app).get('/api/v1/gold/rates?currency=USD&country=US');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('currency', 'USD');
    expect(res.body.data).toHaveProperty('pricePerGram24K');
    expect(res.body.data).toHaveProperty('ratesByPurityAndUnit');

    const rates = res.body.data.ratesByPurityAndUnit;
    expect(rates).toHaveProperty('24K');
    expect(rates).toHaveProperty('22K');
    expect(rates).toHaveProperty('18K');
    expect(rates).toHaveProperty('14K');

    expect(rates['24K']).toHaveProperty('gram');
    expect(rates['24K']).toHaveProperty('10g');
    expect(rates['24K']).toHaveProperty('troy_oz');
    expect(rates['24K']).toHaveProperty('tola');

    // Mathematical consistency checks:
    // 22K price per gram must be less than 24K
    expect(rates['22K'].gram).toBeLessThan(rates['24K'].gram);
    // 10g price must be approximately 10x 1g price
    expect(rates['24K']['10g']).toBeCloseTo(rates['24K'].gram * 10, 1);
  });

  it('GET /api/v1/gold/rates/latest should return specific purity and unit', async () => {
    const res = await request(app).get(
      '/api/v1/gold/rates/latest?currency=EUR&country=FR&purity=22K&unit=gram'
    );
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('currency', 'EUR');
    expect(res.body.data).toHaveProperty('purity', '22K');
    expect(res.body.data).toHaveProperty('unit', 'gram');
    expect(res.body.data).toHaveProperty('price');
    expect(typeof res.body.data.price).toBe('number');
  });

  it('POST /api/v1/gold/calculate should compute accurate gold value', async () => {
    const res = await request(app)
      .post('/api/v1/gold/calculate')
      .send({
        weight: 10,
        unit: 'gram',
        purity: '24K',
        currency: 'USD',
        country: 'US',
        charges: {
          makingChargePercent: 5,
          taxPercent: 3,
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('baseGoldValue');
    expect(res.body.data).toHaveProperty('makingCharges');
    expect(res.body.data).toHaveProperty('tax');
    expect(res.body.data).toHaveProperty('totalEstimate');
    expect(res.body.data.totalEstimate).toBeGreaterThan(res.body.data.baseGoldValue);
  });

  it('POST /api/v1/gold/calculate should reject invalid weight', async () => {
    const res = await request(app).post('/api/v1/gold/calculate').send({
      weight: -10,
      unit: 'gram',
      purity: '24K',
    });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/gold/provider-status should report provider health', async () => {
    const res = await request(app).get('/api/v1/gold/provider-status');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('providers');
    expect(res.body.data.providers).toHaveProperty('fastForex');
    expect(res.body.data.providers.fastForex).toHaveProperty('healthy', true);
  });

  it('GET /api/v1/gold/history should return historical time series points', async () => {
    const res = await request(app).get('/api/v1/gold/history?currency=USD&range=7d');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('currency', 'USD');
    expect(res.body.data).toHaveProperty('purity', '24K');
    expect(res.body.data).toHaveProperty('points');
    expect(Array.isArray(res.body.data.points)).toBe(true);
    expect(res.body.data.points.length).toBeGreaterThanOrEqual(5);
    expect(res.body.data.points[0]).toHaveProperty('date');
    expect(res.body.data.points[0]).toHaveProperty('price');
    expect(res.body.data).toHaveProperty('highest');
    expect(res.body.data).toHaveProperty('lowest');
  });
});

