import request from 'supertest';
import { app } from '../src/app';

describe('Health and System Endpoints', () => {
  it('GET / should return service info', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Global Gold Live API');
    expect(res.body).toHaveProperty('status', 'active');
  });

  it('GET /api/v1/health should return 200 with contract compliance', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('service', 'Global Gold Live API');
    expect(res.body.data).toHaveProperty('timestamp');
    expect(res.body.data).toHaveProperty('database');
    expect(res.body.data.database).toHaveProperty('type', 'mysql');
  });

  it('GET /api/v1/non-existent-route should return 404 with error contract', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('message');
  });

  it('GET /privacy-policy should return 200 with HTML content', async () => {
    const res = await request(app).get('/privacy-policy');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/html');
    expect(res.text).toContain('Privacy Policy for Gold Live');
    expect(res.text).toContain('Account & Data Deletion');
  });

  it('GET /delete-account should return 200 with HTML instructions', async () => {
    const res = await request(app).get('/delete-account');
    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('text/html');
    expect(res.text).toContain('Account & Data Deletion');
    expect(res.text).toContain('developer.support@goldliveapp.com');
  });

  it('POST /api/v1/notifications/broadcast without valid X-Admin-Key should return 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/notifications/broadcast')
      .send({ title: 'Test Alert', body: 'Spot gold up 2%' });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body).toHaveProperty('code', 'UNAUTHORIZED');
  });
});

