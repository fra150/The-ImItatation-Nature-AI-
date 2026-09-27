const request = require('supertest');
const { sequelize } = require('../src/config/database');
const app = require('../src/app');

// RBAC: admin/operator possono mutare, viewer no (le GET restano pubbliche
// per tutti). Le mutazioni su /api/users richiedono admin specificamente.
describe('RBAC — ruoli su mutazioni (SQLite in-memory)', () => {
  let adminToken;
  let operatorToken;
  let viewerToken;

  const registerAndLogin = async (username, role) => {
    const reg = await request(app)
      .post('/auth/register')
      .send({ username, password: 'Password123!', role });
    expect(reg.status).toBe(201);
    const login = await request(app).post('/auth/login').send({ username, password: 'Password123!' });
    expect(login.status).toBe(200);
    return login.body.token;
  };

  const sensorPayload = (serialNumber) => ({
    name: 'S-RBAC',
    type: 'thermal',
    status: 'active',
    location: { latitude: 37.75, longitude: 14.99 },
    manufacturer: 'Acme',
    model: 'T100',
    serialNumber,
    description: 'd',
    softwareVersion: '1',
    firmwareVersion: '1',
    hardwareVersion: '1',
  });

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    adminToken = await registerAndLogin('rbac_admin', 'admin');
    operatorToken = await registerAndLogin('rbac_operator', 'operator');
    viewerToken = await registerAndLogin('rbac_viewer', 'viewer');
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('viewer autenticato NON può creare un sensore -> 403', async () => {
    const res = await request(app)
      .post('/sensors')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send(sensorPayload('RBAC-V1'));
    expect(res.status).toBe(403);
  });

  test('operator PUÒ creare un sensore', async () => {
    const res = await request(app)
      .post('/sensors')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(sensorPayload('RBAC-O1'));
    expect([200, 201]).toContain(res.status);
  });

  test('admin PUÒ creare un sensore', async () => {
    const res = await request(app)
      .post('/sensors')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(sensorPayload('RBAC-A1'));
    expect([200, 201]).toContain(res.status);
  });

  test('senza token -> 401 (non 403: il controllo ruolo non sostituisce l\'auth)', async () => {
    const res = await request(app).post('/sensors').send(sensorPayload('RBAC-N1'));
    expect(res.status).toBe(401);
  });

  test('GET resta pubblico per qualunque ruolo (anche senza token)', async () => {
    const res = await request(app).get('/sensors');
    expect(res.status).toBe(200);
  });

  test('operator NON può mutare /api/users (richiede admin) -> 403', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ username: 'nope', password: 'x', role: 'viewer' });
    expect(res.status).toBe(403);
  });

  test('admin PUÒ mutare /api/users (e la password non trapela mai in chiaro)', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'creato-da-admin', password: 'Password123!', role: 'viewer' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.password).toBeUndefined();
  });
});
