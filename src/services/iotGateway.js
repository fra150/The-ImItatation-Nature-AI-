// src/services/iotGateway.js
//
// Gateway IoT/droni su MQTT — il punto unico dove i dispositivi fisici parlano
// col "Bot Padre". Il broker è il bus: droni e sensori PUBBLICANO telemetria,
// il backend la SOTTOSCRIVE, aggiorna il DB ed emette gli eventi Socket.io
// (riusa il real-time già pronto); per i comandi il backend PUBBLICA sui topic
// dei droni.
//
// Scelte per "scrivere bene":
//  - Trasporto INIETTATO: init(client) riceve un client MQTT (o un fake nei
//    test) → tutta la logica è testabile SENZA un broker reale.
//  - Handler PURI (handle*): parsano e aggiornano il DB + emettono, senza
//    dipendere dal trasporto → unit-test diretti.
//  - Degradazione con grazia: senza client, i publish sono no-op che ritornano
//    false (come il resto del progetto).
const logger = require('../utils/logger');
const realtime = require('./realtimeService');
const fireWorkflow = require('./fireWorkflowService');
const { Drone, Sensor } = require('../models');

// Soglie di rilevamento incendio da telemetria sensore (override via env).
const FIRE_TEMP_THRESHOLD = Number(process.env.FIRE_TEMP_THRESHOLD || 60); // °C
const FIRE_SMOKE_THRESHOLD = Number(process.env.FIRE_SMOKE_THRESHOLD || 70); // %/ppm-normalizzato

// --- Salute della connessione (WiFi/radio) ----------------------------------
// Un drone è considerato OFFLINE se non manda telemetria/stato per più di
// questo timeout (watchdog lato backend: funziona indipendentemente dal
// broker/LWT, e non richiede che il drone "annunci" la propria disconnessione
// — utile perché un link radio spesso cade senza un ultimo messaggio pulito).
const DRONE_OFFLINE_TIMEOUT_MS = Number(process.env.DRONE_OFFLINE_TIMEOUT_MS || 30_000);
const OFFLINE_WATCHDOG_INTERVAL_MS = Number(process.env.OFFLINE_WATCHDOG_INTERVAL_MS || 10_000);
// Segnale debole: RSSI in dBm (più vicino a 0 = meglio) e/o qualità link 0–100%.
const WEAK_SIGNAL_RSSI_DBM = Number(process.env.WEAK_SIGNAL_RSSI_DBM || -80);
const WEAK_SIGNAL_LINK_QUALITY = Number(process.env.WEAK_SIGNAL_LINK_QUALITY || 30);

// ---------------------------------------------------------------------------
// Schema dei topic — centralizzato qui così c'è UNA sola fonte di verità.
//   drones/{id}/telemetry  (drone -> backend)  GPS, batteria, quota, velocità
//   drones/{id}/status     (drone -> backend)  online/azione/stato
//   drones/{id}/ack        (drone -> backend)  esito di un comando
//   drones/{id}/commands   (backend -> drone)  goto / mission / takeoff / land …
//   sensors/{id}/telemetry (sensore -> backend) letture ambientali
// ---------------------------------------------------------------------------
const topics = {
  droneTelemetry: (id = '+') => `drones/${id}/telemetry`,
  droneStatus: (id = '+') => `drones/${id}/status`,
  droneAck: (id = '+') => `drones/${id}/ack`,
  droneCommands: (id) => `drones/${id}/commands`,
  sensorTelemetry: (id = '+') => `sensors/${id}/telemetry`,
};

// Estrae { domain, id, kind } da un topic a 3 segmenti; null se non riconosciuto.
function parseTopic(topic) {
  const parts = String(topic).split('/');
  if (parts.length !== 3) return null;
  const [domain, id, kind] = parts;
  if (domain !== 'drones' && domain !== 'sensors') return null;
  return { domain, id, kind };
}

let activeClient = null;
let offlineWatchdogTimer = null;

// Trova un drone dal riferimento del topic: prima per identifier, poi per PK
// numerica (così funziona sia "SKYDIO-01" sia "7").
async function findDrone(ref) {
  let drone = await Drone.findOne({ where: { identifier: ref } });
  if (!drone && /^\d+$/.test(String(ref))) drone = await Drone.findByPk(Number(ref));
  return drone;
}

const num = (v) => (Number.isFinite(v) ? v : undefined);

// --- Handler telemetria drone -> aggiorna snapshot live + emette ------------
async function handleDroneTelemetry(ref, data = {}) {
  const drone = await findDrone(ref);
  if (!drone) {
    logger.warn(`IoT: telemetry from unknown drone "${ref}" ignored`);
    return null;
  }
  const lat = num(data.latitude);
  const lng = num(data.longitude);
  if (lat !== undefined && lng !== undefined) drone.location = { latitude: lat, longitude: lng };
  if (num(data.batteryLevel) !== undefined) drone.batteryLevel = data.batteryLevel;
  if (num(data.altitude) !== undefined) drone.altitude = data.altitude;
  if (num(data.speed) !== undefined) drone.speed = data.speed;
  if (num(data.heading) !== undefined) drone.heading = data.heading;
  if (num(data.signalStrength) !== undefined) drone.signalStrength = data.signalStrength;
  if (num(data.linkQuality) !== undefined) drone.linkQuality = data.linkQuality;
  if (num(data.latencyMs) !== undefined) drone.latencyMs = data.latencyMs;
  drone.lastSeenAt = new Date();
  drone.online = true;
  await drone.save();

  if (typeof data.batteryLevel === 'number' && data.batteryLevel < 20) {
    logger.warn(`IoT: drone ${drone.identifier || drone.id} battery low (${data.batteryLevel}%)`);
  }
  const weakSignal =
    (typeof data.signalStrength === 'number' && data.signalStrength < WEAK_SIGNAL_RSSI_DBM) ||
    (typeof data.linkQuality === 'number' && data.linkQuality < WEAK_SIGNAL_LINK_QUALITY);
  if (weakSignal) {
    logger.warn(
      `IoT: drone ${drone.identifier || drone.id} weak signal (RSSI ${data.signalStrength ?? '?'}dBm, quality ${data.linkQuality ?? '?'}%)`,
    );
    realtime.emit('drone:weak-signal', {
      droneId: drone.id,
      identifier: drone.identifier,
      signalStrength: drone.signalStrength,
      linkQuality: drone.linkQuality,
    });
  }
  realtime.emitDroneUpdate(drone);
  return drone;
}

// --- Handler stato drone (online/azione/status) -----------------------------
async function handleDroneStatus(ref, data = {}) {
  const drone = await findDrone(ref);
  if (!drone) {
    logger.warn(`IoT: status from unknown drone "${ref}" ignored`);
    return null;
  }
  if (data.status) drone.status = data.status;
  if (data.action) drone.action = data.action;
  if (typeof data.online === 'boolean') drone.online = data.online;
  drone.lastSeenAt = new Date();
  await drone.save();
  realtime.emitDroneUpdate(drone);
  return drone;
}

// --- Watchdog "drone offline" -----------------------------------------------
// Un link radio/WiFi spesso cade senza un ultimo messaggio pulito (niente
// last-will da sottoscrivere), quindi il modo affidabile di rilevare un drone
// scomparso è lato backend: se non manda nulla da troppo tempo, lo dichiariamo
// offline noi. Funzione pura (no side effect sul trasporto) → testabile
// chiamandola direttamente, senza aspettare l'interval reale.
async function checkOfflineDrones(timeoutMs = DRONE_OFFLINE_TIMEOUT_MS) {
  const cutoff = new Date(Date.now() - timeoutMs);
  const stale = await Drone.findAll({ where: { online: true } });
  const wentOffline = [];
  for (const drone of stale) {
    if (!drone.lastSeenAt || drone.lastSeenAt > cutoff) continue;
    drone.online = false;
    await drone.save();
    logger.warn(`IoT: drone ${drone.identifier || drone.id} went offline (no telemetry for >${timeoutMs}ms)`);
    realtime.emitDroneUpdate(drone);
    realtime.emit('drone:offline', { droneId: drone.id, identifier: drone.identifier, lastSeenAt: drone.lastSeenAt });
    wentOffline.push(drone.id);
  }
  return wentOffline;
}

// --- Handler ack comando ----------------------------------------------------
async function handleDroneAck(ref, data = {}) {
  logger.info(`IoT: drone ${ref} ack ${data.command || '?'} -> ${data.result || 'ok'}`);
  realtime.emit('drone:ack', { droneId: ref, ...data });
  return true;
}

// --- Handler telemetria sensore -> eventuale rilevamento incendio -----------
// Questo è il ponte IoT→incendio→drone: una lettura sopra soglia crea un
// FireEvent e fa partire il dispatch del drone, riusando fireWorkflowService.
async function handleSensorTelemetry(ref, data = {}) {
  const sensor = await Sensor.findByPk(ref);
  if (!sensor) {
    logger.warn(`IoT: telemetry from unknown sensor "${ref}" ignored`);
    return null;
  }
  realtime.emit('sensor:reading', { sensorId: sensor.id, type: sensor.type, ...data });

  const hot = sensor.type === 'thermal' && num(data.temperature) > FIRE_TEMP_THRESHOLD;
  const smoky = num(data.smokeLevel) > FIRE_SMOKE_THRESHOLD;
  if (!hot && !smoky) return { sensor, fire: null };

  const loc = sensor.location || {};
  logger.warn(`IoT: possible fire from sensor ${sensor.id} (${sensor.type})`);
  const result = await fireWorkflow.detectAndDispatch({
    areaId: sensor.AreaId,
    latitude: num(loc.latitude),
    longitude: num(loc.longitude),
    severity: hot && smoky ? 'high' : 'medium',
    detectedBySensorId: sensor.id,
    description: `Rilevato da sensore ${sensor.name || sensor.id}`,
  });
  return { sensor, fire: result };
}

// --- Routing dei messaggi in ingresso --------------------------------------
async function onMessage(topic, message) {
  const meta = parseTopic(topic);
  if (!meta) return;
  let data;
  try {
    data = JSON.parse(message.toString());
  } catch (err) {
    logger.error(`IoT: invalid JSON on ${topic}: ${err.message}`);
    return;
  }
  if (meta.domain === 'drones') {
    if (meta.kind === 'telemetry') return handleDroneTelemetry(meta.id, data);
    if (meta.kind === 'status') return handleDroneStatus(meta.id, data);
    if (meta.kind === 'ack') return handleDroneAck(meta.id, data);
  } else if (meta.domain === 'sensors' && meta.kind === 'telemetry') {
    return handleSensorTelemetry(meta.id, data);
  }
}

// --- Comandi backend -> drone ----------------------------------------------
// `ref` può essere un'istanza Drone, un identifier o una PK.
function droneRefId(ref) {
  if (ref && typeof ref === 'object') return ref.identifier || ref.id;
  return ref;
}

function sendCommand(ref, command = {}, client = activeClient) {
  const id = droneRefId(ref);
  const topic = topics.droneCommands(id);
  const payload = JSON.stringify({ ...command, ts: Date.now() });
  if (!client || client.connected === false) {
    logger.warn(`IoT: no broker — command "${command.type}" for drone ${id} not published`);
    return false;
  }
  client.publish(topic, payload, { qos: 1 });
  logger.info(`IoT: command "${command.type}" -> ${topic}`);
  return true;
}

function sendMission(ref, waypoints, client = activeClient) {
  if (!Array.isArray(waypoints) || waypoints.length === 0) {
    throw new Error('mission requires a non-empty waypoints array');
  }
  return sendCommand(ref, { type: 'mission', waypoints }, client);
}

// Avvia il polling periodico che rileva i droni andati offline. `.unref()`
// evita che il timer tenga vivo il processo Node (o Jest) da solo.
function startOfflineWatchdog(intervalMs = OFFLINE_WATCHDOG_INTERVAL_MS) {
  stopOfflineWatchdog();
  offlineWatchdogTimer = setInterval(() => {
    checkOfflineDrones().catch((e) => logger.error(`IoT offline watchdog error: ${e.message}`));
  }, intervalMs);
  if (typeof offlineWatchdogTimer.unref === 'function') offlineWatchdogTimer.unref();
  return offlineWatchdogTimer;
}

function stopOfflineWatchdog() {
  if (offlineWatchdogTimer) {
    clearInterval(offlineWatchdogTimer);
    offlineWatchdogTimer = null;
  }
}

// --- Inizializzazione (chiamata da app.js con un client mqtt connesso) ------
// Il watchdog offline parte SEMPRE (è basato sul DB, non sul client MQTT);
// la sottoscrizione ai topic parte solo se c'è un client (altrimenti degraded).
function init(client) {
  activeClient = client || null;
  startOfflineWatchdog();
  if (!activeClient) {
    logger.info('IoT gateway: no MQTT client — degraded (no devices over MQTT)');
    return;
  }
  const subs = [topics.droneTelemetry(), topics.droneStatus(), topics.droneAck(), topics.sensorTelemetry()];
  activeClient.subscribe(subs, (err) => {
    if (err) logger.error(`IoT gateway subscribe failed: ${err.message}`);
    else logger.info(`IoT gateway subscribed: ${subs.join(', ')}`);
  });
  activeClient.on('message', (topic, message) => {
    onMessage(topic, message).catch((e) => logger.error(`IoT message error: ${e.message}`));
  });
  logger.info('IoT gateway initialized');
}

function getClient() {
  return activeClient;
}

// Solo per i test: azzera lo stato del modulo (client + watchdog).
function _reset() {
  activeClient = null;
  stopOfflineWatchdog();
}

module.exports = {
  topics,
  parseTopic,
  init,
  getClient,
  onMessage,
  handleDroneTelemetry,
  handleDroneStatus,
  handleDroneAck,
  handleSensorTelemetry,
  checkOfflineDrones,
  sendCommand,
  sendMission,
  FIRE_TEMP_THRESHOLD,
  FIRE_SMOKE_THRESHOLD,
  DRONE_OFFLINE_TIMEOUT_MS,
  WEAK_SIGNAL_RSSI_DBM,
  WEAK_SIGNAL_LINK_QUALITY,
  _reset,
};
