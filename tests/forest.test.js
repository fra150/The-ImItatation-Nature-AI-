const request = require('supertest');
const app = require('../src/app');

// /api/data è la superficie CRUD DB-backed dei dati forest (Earth Engine NON
// richiesto). Gli endpoint EE (es. /api/forestChange) restano differiti -> 501.
// Test DB-free: la validazione respinge il body vuoto prima di toccare il DB.
describe('forest data routes (DB-backed CRUD)', () => {
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

  test('deferred Earth Engine endpoint /api/forestChange -> 501', async () => {
    const res = await request(app).get('/api/forestChange');
    expect(res.status).toBe(501);
    expect(res.body.feature).toBe('forest');
  });
});
