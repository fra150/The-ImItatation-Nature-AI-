const request = require('supertest');
const bcrypt = require('bcrypt');
const { sequelize } = require('../src/config/database');
require('../src/models'); // registra modelli + associazioni
const User = require('../src/models/user');
const app = require('../src/app');

// Integrazione DB REALE (SQLite in-memory sotto NODE_ENV=test) + flusso AUTH:
// register -> login (JWT) -> mutazioni protette -> persistenza reale.
describe('DB + auth integration (SQLite in-memory)', () => {
  let token;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('register persists a user; login returns a JWT', async () => {
    const reg = await request(app)
      .post('/auth/register')
      .send({ username: 'tester', password: 'Password123!' });
    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({ username: 'tester', role: 'viewer' });

    // Admin per i test successivi: la registrazione pubblica forza viewer
    // (anti privilege-escalation), gli admin si creano direttamente a DB.
    const hash = await bcrypt.hash('Password123!', 10);
    await User.create({ username: 'tester_admin', password: hash, role: 'admin' });
    const login = await request(app)
      .post('/auth/login')
      .send({ username: 'tester_admin', password: 'Password123!' });
    expect(login.status).toBe(200);
    token = login.body.token;
    expect(typeof token).toBe('string');
  });

  test('GET /api/users requires auth and never exposes the password hash', async () => {
    const noAuth = await request(app).get('/api/users');
    expect(noAuth.status).toBe(401);

    const list = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.some((u) => u.username === 'tester_admin')).toBe(true);
    expect(list.body[0].password).toBeUndefined();
  });

  test('mutation without token -> 401; with token + invalid body -> 400', async () => {
    const noAuth = await request(app).post('/sensors').send({});
    expect(noAuth.status).toBe(401);

    const badBody = await request(app)
      .post('/sensors')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(badBody.status).toBe(400); // la validazione gira DOPO l'auth
  });

  test('authenticated create persists a sensor (real DB + JSON location)', async () => {
    const create = await request(app)
      .post('/sensors')
      .set('Authorization', `Bearer ${token}`)
      .send({
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

    const list = await request(app).get('/sensors'); // GET pubblico
    const sensors = list.body.sensors || list.body;
    expect(Array.isArray(sensors)).toBe(true);
    expect(sensors.some((s) => s.name === 'S1' && s.location.latitude === 37.75)).toBe(true);
  });
});
