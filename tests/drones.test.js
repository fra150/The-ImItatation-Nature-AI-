const request = require('supertest');
const app = require('../src/app');

// Il subsystem droni è riattivato (Bot Padre <-> droni). Questi test girano
// SENZA database: verificano il cablaggio route->controller e la validazione,
// senza dipendere dal DB né dalle parti AI (che degradano con grazia).
describe('drone routes (re-enabled)', () => {
  test('POST /drones without token -> 401 (mutations require auth)', async () => {
    const res = await request(app).post('/drones').send({});
    expect(res.status).toBe(401);
  });

  test('POST /drones is no longer a 501 stub', async () => {
    const res = await request(app).post('/drones').send({});
    expect(res.status).not.toBe(501);
  });
});
