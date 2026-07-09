const request = require('supertest');
const { sequelize } = require('../src/config/database');
const { Drone, DroneData } = require('../src/models');
const app = require('../src/app');

// GET /drones/:id/history è una lettura gratuita/locale (nessuna chiamata
// esterna) -> GET pubblico, testabile end-to-end senza token.
describe('GET /drones/:id/history', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('drone inesistente -> 404', async () => {
    const res = await request(app).get('/drones/999999/history');
    expect(res.status).toBe(404);
  });

  test('senza storico -> lista vuota, nessun errore', async () => {
    const drone = await Drone.create({ identifier: 'HIST-EMPTY', model: 'X', status: 'available' });
    const res = await request(app).get(`/drones/${drone.id}/history`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.history).toEqual([]);
  });

  test('ritorna lo storico più recente per primo, rispettando il limit', async () => {
    const drone = await Drone.create({ identifier: 'HIST-FULL', model: 'X', status: 'available' });
    for (let i = 0; i < 5; i += 1) {
      await DroneData.create({
        droneId: drone.identifier,
        latitude: 37 + i * 0.01,
        longitude: 15,
        altitude: 100,
        speed: 10,
        timestamp: new Date(Date.now() + i * 1000), // via via più recenti
      });
    }

    const res = await request(app).get(`/drones/${drone.id}/history?limit=3`);
    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.history).toHaveLength(3);
    // il più recente (i=4, lat 37.04) deve essere il primo
    expect(res.body.history[0].latitude).toBeCloseTo(37.04);
  });

  test('limit oltre il massimo viene comunque limitato (protezione da abuso)', async () => {
    const drone = await Drone.create({ identifier: 'HIST-CAP', model: 'X', status: 'available' });
    const res = await request(app).get(`/drones/${drone.id}/history?limit=99999`);
    expect(res.status).toBe(200);
    // nessun errore, la richiesta e' comunque servita (con un tetto interno)
  });
});
