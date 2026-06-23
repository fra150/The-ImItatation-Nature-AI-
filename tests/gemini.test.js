const request = require('supertest');
const app = require('../src/app');

// /gemini è riattivato e usa il servizio Gemini reale (GoogleGenerativeAI).
// Test DB-free e SENZA chiamate di rete: con body vuoto e/o senza
// GEMINI_API_KEY, l'handler risponde 503 (AI non configurata) o 400 (manca il
// prompt) PRIMA di contattare l'API. Non è più uno stub 501.
describe('gemini route (re-enabled, graceful)', () => {
  test('POST /gemini is no longer a 501 stub', async () => {
    const res = await request(app).post('/gemini').send({});
    expect(res.status).not.toBe(501);
  });

  test('POST /gemini without token -> 401 (mutations require auth)', async () => {
    const res = await request(app).post('/gemini').send({});
    expect(res.status).toBe(401);
  });
});
