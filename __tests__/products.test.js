import request from 'supertest';
import app from '../src/app.js';

describe('GET /api/health', () => {
  it('returns status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

describe('GET /api/products', () => {
  it('returns 200 with array', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('accepts category filter', async () => {
    const res = await request(app).get('/api/products?category=eletronicos');
    expect(res.status).toBe(200);
  });

  it('accepts price range filter', async () => {
    const res = await request(app).get('/api/products?price_min=10&price_max=100');
    expect(res.status).toBe(200);
  });
});

describe('POST /api/products (without auth)', () => {
  it('returns 401', async () => {
    const res = await request(app).post('/api/products').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders (without auth)', () => {
  it('returns 401', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/me (without auth)', () => {
  it('returns 401', async () => {
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/docs', () => {
  it('returns swagger ui', async () => {
    const res = await request(app).get('/api/docs/');
    expect([200, 301, 302]).toContain(res.status);
  });
});
