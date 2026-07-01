const request = require('supertest');
const { sequelize } = require('../src/config/database');
const app = require('../src/app');
const fireBriefingService = require('../src/services/fireBriefingService');

// POST /api/fire-events/:id/briefing chiama Gemini (costo/rete reale) — come
// per l'endpoint /gemini esistente, i test si fermano ai controlli PRIMA
// della chiamata esterna (auth, esistenza dell'incendio) e non invocano mai
// l'AI davvero, per restare deterministici e offline-safe. Un solo
// beforeAll/afterAll per l'intero file: sequelize è un singleton condiviso e
// chiuderlo in un describe impedirebbe il sync() del successivo.
beforeAll(async () => {
  await sequelize.sync({ force: true });
});
afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/fire-events/:id/briefing (safe boundary — no real Gemini call)', () => {
  test('senza token -> 401 (mutazione protetta, non arriva mai a Gemini)', async () => {
    const res = await request(app).post('/api/fire-events/1/briefing').send({});
    expect(res.status).toBe(401);
  });
});

describe('fireBriefingService.buildBriefingContext (no Gemini call)', () => {
  test('incendio inesistente -> null (nessuna chiamata a Gemini)', async () => {
    const context = await fireBriefingService.buildBriefingContext(999999);
    expect(context).toBeNull();
  });

  test('formatContextForPrompt produce un testo leggibile dai dati raccolti', () => {
    const text = fireBriefingService.formatContextForPrompt({
      fireEvent: { id: 1, status: 'in_progress', severity: 'high', location: 'Test', startTime: new Date() },
      area: { name: 'Etna', riskLevel: 'high' },
      assignedDrones: [{ model: 'Skydio X10', status: 'in_use', batteryLevel: 80 }],
      spread: { available: false, reason: 'no wind data for this area' },
    });
    expect(text).toMatch(/Fire event #1/);
    expect(text).toMatch(/Skydio X10/);
    expect(text).toMatch(/unavailable/);
  });
});
