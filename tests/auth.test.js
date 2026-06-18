const request = require('supertest');
const app = require('../src/app');

// Verifica il cablaggio dell'autenticazione: validazione (middleware `validate`)
// e logout stateless. Niente DB: le richieste con body vuoto vengono respinte
// dalla validazione PRIMA che il controller tocchi il database.
describe('auth routes', () => {
  test('POST /auth/register with empty body -> 400 with validation errors', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  test('POST /auth/login with empty body -> 400', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(400);
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('POST /auth/logout -> 200 (stateless JWT)', async () => {
    const res = await request(app).post('/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/Logout successful/);
  });
});
