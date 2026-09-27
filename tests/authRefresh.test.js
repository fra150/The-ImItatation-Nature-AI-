const request = require('supertest');
const { sequelize } = require('../src/config/database');
const app = require('../src/app');

// Refresh token: l'access token JWT è a vita breve (stateless), il refresh
// token è la sessione VERA — revocabile a DB. Copre il motivo per cui questa
// feature esiste: prima "logout" non invalidava nulla lato server.
describe('Refresh token lifecycle (SQLite in-memory)', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await request(app)
      .post('/auth/register')
      .send({ username: 'refresh_user', password: 'Password123!', role: 'viewer' });
  });
  afterAll(async () => {
    await sequelize.close();
  });

  const login = () => request(app).post('/auth/login').send({ username: 'refresh_user', password: 'Password123!' });

  test('login restituisce SIA token che refreshToken', async () => {
    const res = await login();
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.token).not.toBe(res.body.refreshToken);
  });

  test('POST /auth/refresh con refreshToken valido -> nuova coppia token', async () => {
    const { body } = await login();
    const res = await request(app).post('/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(res.status).toBe(200);
    expect(typeof res.body.token).toBe('string');
    expect(typeof res.body.refreshToken).toBe('string');
    expect(res.body.refreshToken).not.toBe(body.refreshToken); // rotazione
  });

  test('il refreshToken usato viene revocato (rotazione): riusarlo -> 401', async () => {
    const { body } = await login();
    const first = await request(app).post('/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(first.status).toBe(200);

    const reuse = await request(app).post('/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(reuse.status).toBe(401);
  });

  test('refreshToken inventato -> 401', async () => {
    const res = await request(app).post('/auth/refresh').send({ refreshToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });

  test('refreshToken mancante -> 400 (validazione)', async () => {
    const res = await request(app).post('/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  test('logout revoca DAVVERO il refresh token: dopo, /auth/refresh -> 401', async () => {
    const { body } = await login();
    const logoutRes = await request(app).post('/auth/logout').send({ refreshToken: body.refreshToken });
    expect(logoutRes.status).toBe(200);

    const afterLogout = await request(app).post('/auth/refresh').send({ refreshToken: body.refreshToken });
    expect(afterLogout.status).toBe(401);
  });

  test('logout senza refreshToken -> comunque 200 (compatibilità)', async () => {
    const res = await request(app).post('/auth/logout').send({});
    expect(res.status).toBe(200);
  });
});
