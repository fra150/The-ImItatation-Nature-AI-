const request = require('supertest');
const { sequelize } = require('../src/config/database');
const { Area, FireEvent, WeatherData } = require('../src/models');
const app = require('../src/app');

// GET /api/fire-events/:id/spread è locale e gratuito (nessuna chiamata
// esterna) -> testabile end-to-end senza mock di rete, a differenza del
// briefing Gemini.
describe('GET /api/fire-events/:id/spread', () => {
  let area;
  let fire;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    area = await Area.create({
      name: 'Zona Vento',
      location: { latitude: 37.0, longitude: 15.0 },
      riskLevel: 'high',
    });
    fire = await FireEvent.create({
      areaId: area.id,
      location: 'Test',
      severity: 'high',
      status: 'in_progress',
      startTime: new Date(),
    });
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('incendio inesistente -> 404', async () => {
    const res = await request(app).get('/api/fire-events/999999/spread');
    expect(res.status).toBe(404);
  });

  test('nessun dato meteo per l\'area -> available:false, nessun crash', async () => {
    const res = await request(app).get(`/api/fire-events/${fire.id}/spread`);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(false);
  });

  test('con dati meteo reali -> stima disponibile con rotta e disclaimer', async () => {
    await WeatherData.create({
      areaId: area.id,
      date: new Date(),
      u_component_of_wind_10m: 8,
      v_component_of_wind_10m: 3,
    });

    const res = await request(app).get(`/api/fire-events/${fire.id}/spread`);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.method).toBe('heuristic-wind-linear');
    expect(typeof res.body.bearingDeg).toBe('number');
    expect(typeof res.body.projectedDistanceMeters).toBe('number');
  });
});
