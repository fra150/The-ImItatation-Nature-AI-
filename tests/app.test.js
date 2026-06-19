const request = require('supertest');
const app = require('../src/app');

// Questi test girano SENZA database: l'app è importabile senza avviare il
// server (guardia require.main) e gli endpoint esercitati non toccano il DB.
describe('HTTP surface', () => {
  test('GET /health -> 200 { status: "ok" }', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('the-imitatation-nature-ai');
  });

  test('GET / -> 200 with service metadata', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toMatch(/ImItatation Nature AI/);
    expect(res.body.health).toBe('/health');
  });

  test('unknown route -> 404', async () => {
    const res = await request(app).get('/definitely-not-a-route');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Route not found');
  });

  describe('AI routes disabled in core mode -> 501', () => {
    test.each([
      ['post', '/gemini', 'gemini'],
      ['get', '/api/forestChange', 'forest'],
    ])('%s %s -> 501', async (method, path, feature) => {
      const res = await request(app)[method](path);
      expect(res.status).toBe(501);
      expect(res.body.error).toBe('Not Implemented');
      expect(res.body.feature).toBe(feature);
    });
  });
});
