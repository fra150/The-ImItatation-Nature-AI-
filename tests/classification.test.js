const request = require('supertest');
const app = require('../src/app');

// Classificazione del territorio via Earth Engine (GET pubblici). Sotto test EE
// è disattivato (NODE_ENV=test) -> 503, senza chiamate di rete.
describe('classification routes (Earth Engine)', () => {
  test('GET /api/classify/unsupervised -> 503 when EE disabled in tests', async () => {
    const res = await request(app).get('/api/classify/unsupervised');
    expect(res.status).toBe(503);
  });

  test('GET /api/classify/supervised -> 503 when EE disabled in tests', async () => {
    const res = await request(app).get('/api/classify/supervised');
    expect(res.status).toBe(503);
  });
});
