// src/services/realtimeService.js
//
// Layer real-time (Socket.io) del "Bot Padre": quando un drone cambia stato o
// viene rilevato/assegnato un incendio, lo broadcastiamo a tutti i client
// connessi (la dashboard aggiorna mappa e liste senza ricaricare).
//
// `io` è un singleton a livello di modulo, valorizzato da initRealtime() solo
// all'avvio reale del server. Gli helper emit* sono NO-OP sicuri quando io è
// null: così i test che importano l'app Express via supertest (senza far
// partire il server) non toccano mai Socket.io e restano verdi.
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const environment = require('../config/environment');

let io = null;

/**
 * Middleware di handshake Socket.io: richiede un JWT valido (lo stesso delle
 * route HTTP) passato in `socket.handshake.auth.token`. Senza token valido la
 * connessione viene rifiutata. Verifica SINCRONA per essere facilmente testabile.
 */
function socketAuth(socket, next) {
  const token = socket.handshake && socket.handshake.auth && socket.handshake.auth.token;
  if (!token) return next(new Error('unauthorized: missing token'));
  try {
    const decoded = jwt.verify(token, environment.jwtSecret);
    socket.user = { id: decoded.id, role: decoded.role };
    return next();
  } catch (err) {
    return next(new Error('unauthorized: invalid token'));
  }
}

/**
 * Inizializza Socket.io sopra un server HTTP esistente. La connessione richiede
 * un JWT valido (vedi socketAuth) — la telemetria droni/incendi non è pubblica.
 * @param {import('http').Server} httpServer
 * @param {{corsOrigin?: string|string[]}} [options]
 * @returns {import('socket.io').Server}
 */
function initRealtime(httpServer, options = {}) {
  const { Server } = require('socket.io');
  io = new Server(httpServer, {
    cors: { origin: options.corsOrigin || '*', methods: ['GET', 'POST'] },
  });

  io.use(socketAuth); // gate JWT su ogni connessione

  io.on('connection', (socket) => {
    logger.info(`Realtime client connected: ${socket.id} (user ${socket.user && socket.user.id})`);
    socket.on('disconnect', (reason) => {
      logger.info(`Realtime client disconnected: ${socket.id} (${reason})`);
    });
  });

  logger.info('Realtime (Socket.io) initialized (JWT-protected)');
  return io;
}

/** @returns {import('socket.io').Server|null} */
function getIo() {
  return io;
}

/**
 * Broadcast di un evento a tutti i client. No-op (ritorna false) se Socket.io
 * non è inizializzato — non lancia mai, così i controller/servizi possono
 * chiamarlo incondizionatamente.
 */
function emit(event, payload) {
  if (!io) return false;
  io.emit(event, payload);
  return true;
}

// Normalizza un'istanza Sequelize (o un oggetto) in JSON piano per il client.
function plain(model) {
  if (model && typeof model.toJSON === 'function') return model.toJSON();
  return model ?? null;
}

/** Stato/telemetria di un drone aggiornati. */
function emitDroneUpdate(drone) {
  return emit('drone:update', plain(drone));
}

/** Nuovo incendio rilevato/registrato. */
function emitFireEvent(fire) {
  return emit('fire:new', plain(fire));
}

/** Incendio + drone assegnato (dispatch completato). */
function emitFireDispatch({ fireEvent, assignedDrone } = {}) {
  return emit('fire:dispatch', {
    fireEvent: plain(fireEvent),
    assignedDrone: plain(assignedDrone),
  });
}

// Solo per i test: chiude e azzera il singleton fra un caso e l'altro.
function _reset() {
  if (io) {
    io.close();
    io = null;
  }
}

module.exports = {
  initRealtime,
  socketAuth,
  getIo,
  emit,
  emitDroneUpdate,
  emitFireEvent,
  emitFireDispatch,
  _reset,
};
