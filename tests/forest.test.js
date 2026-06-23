const request = require('supertest');
const app = require('../src/app');

// /api/data è la superficie CRUD DB-backed dei dati forest (Earth Engine NON
// richiesto). /api/forestChange è un endpoint Earth Engine reale (thumbnail
// Hansen); sotto test EE è disattivato, quindi degrada a 503 (niente rete).
// Il chart (/api/chart/forestChange) resta differito -> 501.
describe('forest routes', () => {
  test('POST /api/data with empty body -> 400 validation errors', async () => {
    const res = await request(app).post('/api/data').send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /api/data is not a 501 stub', async () => {
    const res = await request(app).post('/api/data').send({});
    expect(res.status).not.toBe(501);
  });

  test('GET /api/forestChange (EE endpoint) -> 503 when EE disabled in tests, not 501', async () => {
    const res = await request(app).get('/api/forestChange');
    expect(res.status).not.toBe(501);
    expect(res.status).toBe(503);
  });

  test('deferred chart endpoint /api/chart/forestChange -> 501', async () => {
    const res = await request(app).get('/api/chart/forestChange');
    expect(res.status).toBe(501);
    expect(res.body.feature).toBe('forest');
  });
});
