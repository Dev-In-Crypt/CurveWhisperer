import { test, expect } from '@playwright/test';

const API_URL = 'https://cwbackend-production.up.railway.app';

test.describe('Backend API Integration', () => {
  test('GET /api/stats returns valid response', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/stats`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('activeCurves');
    expect(data).toHaveProperty('graduationsToday');
    expect(typeof data.activeCurves).toBe('number');
    expect(typeof data.graduationsToday).toBe('number');
  });

  test('GET /api/curves returns array', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/curves`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('curves');
    expect(Array.isArray(data.curves)).toBe(true);
    expect(data).toHaveProperty('total');
  });

  test('GET /api/alerts returns array', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/alerts`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('alerts');
    expect(Array.isArray(data.alerts)).toBe(true);
  });

  test('GET /api/curves/:address returns 400 for invalid address', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/curves/not-an-address`);
    expect(res.status()).toBe(400);
  });

  test('GET /api/curves/:address returns 404 for unknown token', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/curves/0x0000000000000000000000000000000000000000`);
    expect(res.status()).toBe(404);
  });

  test('.env is not accessible', async ({ request }) => {
    const res = await request.get(`${API_URL}/.env`);
    expect(res.status()).not.toBe(200);
    const text = await res.text();
    expect(text).not.toContain('BITQUERY_API_KEY');
    expect(text).not.toContain('PRIVATE_KEY');
  });

  test('unknown routes return 404', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/secret`);
    expect(res.status()).toBe(404);
  });
});
