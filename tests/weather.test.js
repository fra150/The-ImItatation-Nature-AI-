const request = require('supertest');
const app = require('../src/app');

// /api/weather è ora una superficie CRUD DB-backed (Earth Engine NON richiesto).
// Test DB-free: la validazione respinge il body vuoto PRIMA di toccare il DB,
// e la route non è più uno stub 501.
describe('weather data routes (DB-backed CRUD)', () => {
  test('POST /api/weather with empty body -> 400 validation errors', async () => {
    const res = await request(app).post('/api/weather').send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /api/weather is no longer a 501 stub', async () => {
    const res = await request(app).post('/api/weather').send({});
    expect(res.status).not.toBe(501);
  });
});
