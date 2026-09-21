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
    expect(res.body).toHaveProperty('code', 'NOT_FOUND');
    expect(res.body).toHaveProperty('message');
  });
});
