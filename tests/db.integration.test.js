const request = require('supertest');
const { sequelize } = require('../src/config/database');
require('../src/models'); // registra modelli + associazioni
const app = require('../src/app');

// Integrazione con DB REALE (SQLite in-memory sotto NODE_ENV=test): prova che i
// dati persistono davvero attraverso le richieste HTTP.
describe('DB integration (SQLite in-memory)', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('register persists a user, login returns a JWT, list excludes password', async () => {
    const reg = await request(app)
      .post('/auth/register')
      .send({ username: 'tester', password: 'Password123!', role: 'admin' });
    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({ username: 'tester', role: 'admin' });
    expect(reg.body.id).toBeDefined();

    const login = await request(app)
      .post('/auth/login')
      .send({ username: 'tester', password: 'Password123!' });
    expect(login.status).toBe(200);
    expect(typeof login.body.token).toBe('string');

    const list = await request(app).get('/api/users');
    expect(list.status).toBe(200);
    expect(list.body.some((u) => u.username === 'tester')).toBe(true);
    expect(list.body[0].password).toBeUndefined(); // hash NON esposto
  });

  test('create then read a sensor (real persistence + JSON location)', async () => {
    const create = await request(app).post('/sensors').send({
      name: 'S1',
      type: 'thermal',
      status: 'active',
      location: { latitude: 37.75, longitude: 14.99 },
      manufacturer: 'Acme',
      model: 'T100',
      serialNumber: 'SN1',
      description: 'd',
      softwareVersion: '1',
      firmwareVersion: '1',
      hardwareVersion: '1',
    });
    expect([200, 201]).toContain(create.status);

    const list = await request(app).get('/sensors');
    expect(list.status).toBe(200);
    const sensors = list.body.sensors || list.body;
    expect(Array.isArray(sensors)).toBe(true);
    expect(sensors.length).toBeGreaterThan(0);
    expect(sensors[0].location).toMatchObject({ latitude: 37.75, longitude: 14.99 });
  });
});
