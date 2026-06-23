const request = require('supertest');
const app = require('../src/app');

// /api/weather è ora una superficie CRUD DB-backed (Earth Engine NON richiesto).
// Test DB-free: la validazione respinge il body vuoto PRIMA di toccare il DB,
// e la route non è più uno stub 501.
describe('weather data routes (DB-backed CRUD)', () => {
  test('POST /api/weather without token -> 401 (mutations require auth)', async () => {
    const res = await request(app).post('/api/weather').send({});
    expect(res.status).toBe(401);
  });

  test('POST /api/weather is no longer a 501 stub', async () => {
    const res = await request(app).post('/api/weather').send({});
    expect(res.status).not.toBe(501);
  });

  test('GET /api/weather/era5 (Earth Engine) -> 503 when EE disabled in tests', async () => {
    const res = await request(app).get('/api/weather/era5');
    expect(res.status).toBe(503);
  });

  test('GET /api/weather/wind (Earth Engine) -> 503 when EE disabled in tests', async () => {
    const res = await request(app).get('/api/weather/wind');
    expect(res.status).toBe(503);
  });
});
