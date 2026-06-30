const http = require('http');
const jwt = require('jsonwebtoken');
const realtime = require('../src/services/realtimeService');
const environment = require('../src/config/environment');

// Verifica il layer real-time SENZA aprire connessioni di rete: che gli emit
// siano no-op sicuri prima di initRealtime (così i test supertest che non
// avviano il server restano verdi) e che dopo l'init facciano broadcast.
describe('realtimeService (Socket.io layer)', () => {
  afterEach(() => realtime._reset());

  test('emit è un no-op sicuro finché io non è inizializzato', () => {
    expect(realtime.getIo()).toBeNull();
    expect(realtime.emit('drone:update', { id: 1 })).toBe(false);
    expect(realtime.emitFireEvent({ id: 2 })).toBe(false);
  });

  test('initRealtime aggancia io al server e gli emit fanno broadcast', () => {
    const server = http.createServer();
    const io = realtime.initRealtime(server);

    expect(io).toBeTruthy();
    expect(realtime.getIo()).toBe(io);

    const spy = jest.spyOn(io, 'emit');

    // Istanza "Sequelize-like": plain() deve usare toJSON().
    const drone = { id: 7, status: 'in_use', toJSON: () => ({ id: 7, status: 'in_use' }) };
    expect(realtime.emitDroneUpdate(drone)).toBe(true);
    expect(spy).toHaveBeenCalledWith('drone:update', { id: 7, status: 'in_use' });

    realtime.emitFireDispatch({
      fireEvent: { id: 3, toJSON: () => ({ id: 3 }) },
      assignedDrone: drone,
    });
    expect(spy).toHaveBeenCalledWith('fire:dispatch', {
      fireEvent: { id: 3 },
      assignedDrone: { id: 7, status: 'in_use' },
    });

    spy.mockRestore();
  });
});

describe('realtimeService — auth JWT sull\'handshake del socket', () => {
  const call = (token) => {
    const socket = { handshake: { auth: token === undefined ? {} : { token } } };
    let err;
    realtime.socketAuth(socket, (e) => {
      err = e;
    });
    return { socket, err };
  };

  test('rifiuta la connessione senza token', () => {
    const { err } = call(undefined);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/unauthorized/);
  });

  test('rifiuta un token non valido', () => {
    const { err } = call('garbage.token.here');
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/unauthorized/);
  });

  test('accetta un JWT valido e attacca lo user al socket', () => {
    const token = jwt.sign({ id: 42, role: 'admin' }, environment.jwtSecret);
    const { socket, err } = call(token);
    expect(err).toBeUndefined();
    expect(socket.user).toEqual({ id: 42, role: 'admin' });
  });
});
