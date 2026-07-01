const request = require('supertest');
const { sequelize } = require('../src/config/database');
const { Area, Drone, FireEvent } = require('../src/models');
const app = require('../src/app');

// Sgancio agente estinguente su SQLite in-memory + flusso auth reale.
// Copre il bug storico: Drone non aveva `payloadCapacity`, quindi il
// controllo "capacità insufficiente" (drone.payloadCapacity < amount) era
// sempre `undefined < amount` -> false, e non scattava mai.
describe('POST /drones/:droneId/release-agent', () => {
  let token;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const reg = await request(app)
      .post('/auth/register')
      .send({ username: 'pilota', password: 'Password123!', role: 'admin' });
    expect(reg.status).toBe(201);
    const login = await request(app)
      .post('/auth/login')
      .send({ username: 'pilota', password: 'Password123!' });
    token = login.body.token;
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('senza token -> 401', async () => {
    const res = await request(app).post('/drones/1/release-agent').send({});
    expect(res.status).toBe(401);
  });

  test('amount non valido -> 400', async () => {
    const drone = await Drone.create({ identifier: 'REL-1', model: 'X', status: 'available', payloadCapacity: 50 });
    const res = await request(app)
      .post(`/drones/${drone.id}/release-agent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: -5, target: { latitude: 1, longitude: 1 } });
    expect(res.status).toBe(400);
  });

  test('target mancante -> 400', async () => {
    const drone = await Drone.create({ identifier: 'REL-2', model: 'X', status: 'available', payloadCapacity: 50 });
    const res = await request(app)
      .post(`/drones/${drone.id}/release-agent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10 });
    expect(res.status).toBe(400);
  });

  test('drone inesistente -> 404', async () => {
    const res = await request(app)
      .post('/drones/999999/release-agent')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10, target: { latitude: 1, longitude: 1 } });
    expect(res.status).toBe(404);
  });

  test('capacità insufficiente -> 400 (il bug storico: prima non scattava mai)', async () => {
    const drone = await Drone.create({ identifier: 'REL-3', model: 'X', status: 'available', payloadCapacity: 5 });
    const res = await request(app)
      .post(`/drones/${drone.id}/release-agent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 10, target: { latitude: 1, longitude: 1 } });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/[Ii]nsufficient/);
  });

  test('sgancio valido decrementa davvero il payload', async () => {
    const drone = await Drone.create({ identifier: 'REL-4', model: 'X', status: 'available', payloadCapacity: 50 });
    const res = await request(app)
      .post(`/drones/${drone.id}/release-agent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 20, target: { latitude: 37.7, longitude: 15.0 } });
    expect(res.status).toBe(200);
    expect(res.body.remainingPayload).toBe(30);

    const reloaded = await Drone.findByPk(drone.id);
    expect(reloaded.payloadCapacity).toBe(30);
  });

  test('lo sgancio su un drone assegnato a un incendio lo estingue e libera il drone', async () => {
    const area = await Area.create({
      name: 'Zona Release',
      location: { latitude: 37.0, longitude: 15.0 },
      riskLevel: 'medium',
    });
    const fire = await FireEvent.create({
      areaId: area.id,
      location: 'Test',
      latitude: 37.0,
      longitude: 15.0,
      severity: 'medium',
      status: 'in_progress',
      startTime: new Date(),
    });
    const drone = await Drone.create({
      identifier: 'REL-5',
      model: 'X',
      status: 'in_use',
      action: 'extinguish',
      payloadCapacity: 50,
      fireEventId: fire.id,
    });

    const res = await request(app)
      .post(`/drones/${drone.id}/release-agent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 20, target: { latitude: 37.0, longitude: 15.0 } });

    expect(res.status).toBe(200);
    expect(res.body.resolvedFireEventId).toBe(fire.id);

    const reloadedFire = await FireEvent.findByPk(fire.id);
    expect(reloadedFire.status).toBe('extinguished');
    expect(reloadedFire.endTime).toBeTruthy();

    const reloadedDrone = await Drone.findByPk(drone.id);
    expect(reloadedDrone.status).toBe('available');
    expect(reloadedDrone.action).toBe('patrol');
    expect(reloadedDrone.fireEventId).toBeNull();
  });

  test('un drone non assegnato a nessun incendio: resolvedFireEventId è null', async () => {
    const drone = await Drone.create({ identifier: 'REL-6', model: 'X', status: 'available', payloadCapacity: 50 });
    const res = await request(app)
      .post(`/drones/${drone.id}/release-agent`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5, target: { latitude: 1, longitude: 1 } });
    expect(res.status).toBe(200);
    expect(res.body.resolvedFireEventId).toBeNull();
  });
});
