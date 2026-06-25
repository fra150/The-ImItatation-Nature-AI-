const request = require('supertest');
const { sequelize } = require('../src/config/database');
const { Area, Drone, FireEvent } = require('../src/models');
const app = require('../src/app');
const fireWorkflow = require('../src/services/fireWorkflowService');

// Pipeline REALE rilevamento -> FireEvent -> dispatch drone più vicino, su
// SQLite in-memory (NODE_ENV=test). Verifica che gli enum corretti
// (Drone='available'/'in_use', FireEvent='detected'/'in_progress') e il calcolo
// della distanza funzionino davvero — non il vecchio no-op con status:'active'.
describe('fire workflow service (detect -> create -> dispatch)', () => {
  let area;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    area = await Area.create({
      name: 'Zona Test',
      location: { latitude: 37.0, longitude: 15.0 },
      riskLevel: 'high',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  // Stato pulito per ogni test: droni e incendi ricreati, area condivisa.
  beforeEach(async () => {
    await Drone.destroy({ where: {} });
    await FireEvent.destroy({ where: {} });
  });

  test('detectAndDispatch crea l\'incendio e assegna il drone disponibile più vicino', async () => {
    const near = await Drone.create({
      model: 'DJI-Near',
      status: 'available',
      location: { latitude: 37.05, longitude: 15.05 },
    });
    await Drone.create({
      model: 'DJI-Far',
      status: 'available',
      location: { latitude: 45.0, longitude: 9.0 },
    });

    const result = await fireWorkflow.detectAndDispatch({
      areaId: area.id,
      latitude: 37.06,
      longitude: 15.04,
      severity: 'high',
    });

    expect(result.dispatched).toBe(true);
    expect(result.assignedDrone.id).toBe(near.id);
    expect(result.fireEvent.status).toBe('in_progress');

    const reloaded = await Drone.findByPk(near.id);
    expect(reloaded.status).toBe('in_use');
    expect(reloaded.action).toBe('extinguish');
    expect(reloaded.fireEventId).toBe(result.fireEvent.id);
  });

  test('senza droni disponibili l\'incendio è comunque registrato (dispatched:false)', async () => {
    await Drone.create({
      model: 'DJI-Down',
      status: 'maintenance',
      location: { latitude: 37.05, longitude: 15.05 },
    });

    const result = await fireWorkflow.detectAndDispatch({
      areaId: area.id,
      latitude: 37.06,
      longitude: 15.04,
    });

    expect(result.dispatched).toBe(false);
    expect(result.assignedDrone).toBeNull();
    expect(result.fireEvent.id).toBeDefined();
    expect(result.fireEvent.status).toBe('detected');
    expect(await FireEvent.count()).toBe(1);
  });

  test('createFireEvent richiede areaId', async () => {
    await expect(fireWorkflow.createFireEvent({ latitude: 1, longitude: 2 })).rejects.toThrow(
      /areaId/,
    );
  });

  test('assignDronesToActiveFires assegna i droni agli incendi aperti con coordinate', async () => {
    const fire = await fireWorkflow.createFireEvent({
      areaId: area.id,
      latitude: 37.06,
      longitude: 15.04,
      severity: 'medium',
    });
    await Drone.create({
      model: 'DJI-Batch',
      status: 'available',
      location: { latitude: 37.05, longitude: 15.05 },
    });

    const res = await fireWorkflow.assignDronesToActiveFires();

    expect(res.assigned).toBe(1);
    expect(res.assignments[0].fireEventId).toBe(fire.id);

    const reloaded = await FireEvent.findByPk(fire.id);
    expect(reloaded.status).toBe('in_progress');
  });
});

describe('fire workflow route wiring', () => {
  test('POST /api/fire-events/detect senza token -> 401 (mutazione protetta)', async () => {
    const res = await request(app).post('/api/fire-events/detect').send({});
    expect(res.status).toBe(401);
  });
});
