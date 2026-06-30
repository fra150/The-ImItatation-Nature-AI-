#!/usr/bin/env node
// scripts/virtualDrone.js — DRONE VIRTUALE (SITL, software-in-the-loop)
//
// Si connette al broker MQTT REALE e parla ESATTAMENTE come parlerà il drone
// fisico: pubblica telemetria (GPS che insegue i waypoint, batteria che cala)
// su drones/{id}/telemetry e obbedisce ai comandi su drones/{id}/commands.
// Così sviluppiamo e dimostriamo tutto il sistema senza hardware; quando
// arriverà il drone vero, è un drop-in (cambia solo chi pubblica/sottoscrive).
//
// Uso:  node scripts/virtualDrone.js [IDENTIFIER]
//   env: MQTT_BROKER_URL (default mqtt://localhost:1883), DRONE_ID, LAT, LON,
//        TICK_MS (default 1500)
const mqtt = require('mqtt');

const BROKER = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const ID = process.argv[2] || process.env.DRONE_ID || 'SKYDIO-01';
const TICK_MS = Number(process.env.TICK_MS || 1500);
const STEP = 0.0012; // ~130 m di avvicinamento per tick

const T = {
  telemetry: `drones/${ID}/telemetry`,
  status: `drones/${ID}/status`,
  ack: `drones/${ID}/ack`,
  commands: `drones/${ID}/commands`,
};

const home = { latitude: Number(process.env.LAT || 37.75), longitude: Number(process.env.LON || 14.994) };
const state = {
  latitude: home.latitude,
  longitude: home.longitude,
  altitude: 0,
  speed: 0,
  heading: 0,
  battery: 100,
  status: 'available',
  action: 'patrol',
};
let target = null; // {latitude, longitude}
let mission = []; // coda di waypoint rimanenti

const log = (...a) => console.log(`[${ID}]`, ...a);

const client = mqtt.connect(BROKER, { reconnectPeriod: 3000 });

client.on('connect', () => {
  log(`connesso a ${BROKER}`);
  client.subscribe(T.commands, (err) => {
    if (err) log('subscribe error', err.message);
    else log(`in ascolto su ${T.commands}`);
  });
  publishStatus();
});

client.on('error', (e) => log('mqtt error', e.message));

// --- Comandi in arrivo dal Bot Padre ---------------------------------------
client.on('message', (topic, buf) => {
  if (topic !== T.commands) return;
  let cmd;
  try {
    cmd = JSON.parse(buf.toString());
  } catch {
    return log('comando JSON non valido');
  }
  log('comando ricevuto:', cmd.type);
  switch (cmd.type) {
    case 'mission':
      mission = Array.isArray(cmd.waypoints) ? cmd.waypoints.slice() : [];
      target = mission.shift() || null;
      state.status = 'in_use';
      state.action = 'survey';
      break;
    case 'goto':
      target = { latitude: Number(cmd.latitude), longitude: Number(cmd.longitude) };
      mission = [];
      state.status = 'in_use';
      state.action = cmd.action || 'extinguish';
      break;
    case 'release':
      log('💧 sgancio agente estinguente');
      break;
    case 'land':
    case 'return':
      target = cmd.type === 'return' ? { ...home } : null;
      mission = [];
      state.action = cmd.type === 'return' ? 'transport' : 'patrol';
      break;
    case 'analysis':
      // ricevuta analisi AI: nessun movimento, solo presa in carico
      break;
    default:
      log('comando sconosciuto:', cmd.type);
  }
  ack(cmd.type);
  publishStatus();
});

function ack(command) {
  client.publish(T.ack, JSON.stringify({ command, result: 'ok', ts: Date.now() }));
}

function publishStatus() {
  client.publish(
    T.status,
    JSON.stringify({ online: true, status: state.status, action: state.action }),
  );
}

// bearing in gradi 0–360 da posizione corrente verso dst
function bearing(cur, dst) {
  const deg = (Math.atan2(dst.longitude - cur.longitude, dst.latitude - cur.latitude) * 180) / Math.PI;
  return (deg + 360) % 360;
}

// --- Loop di simulazione: muove, consuma batteria, pubblica telemetria ------
function tick() {
  if (target) {
    const dLat = target.latitude - state.latitude;
    const dLon = target.longitude - state.longitude;
    const dist = Math.hypot(dLat, dLon);
    if (dist <= STEP) {
      // arrivato al waypoint
      state.latitude = target.latitude;
      state.longitude = target.longitude;
      target = mission.shift() || null;
      if (!target) {
        state.speed = 0;
        log('🎯 waypoint/missione completati — hovering');
      }
    } else {
      state.heading = Math.round(bearing(state, target));
      state.latitude += (dLat / dist) * STEP;
      state.longitude += (dLon / dist) * STEP;
      state.altitude = 100;
      state.speed = 12;
    }
    state.battery = Math.max(0, state.battery - 0.6); // volo: consumo maggiore
  } else {
    state.speed = 0;
    state.altitude = state.status === 'available' ? 0 : state.altitude;
    state.battery = Math.max(0, state.battery - 0.1); // idle
  }

  // batteria scarica -> rientro automatico (failsafe), come un drone vero
  if (state.battery < 20 && state.action !== 'transport' && state.status !== 'available') {
    log('🔋 batteria bassa: rientro automatico (RTH)');
    target = { ...home };
    mission = [];
    state.action = 'transport';
    publishStatus();
  }

  client.publish(
    T.telemetry,
    JSON.stringify({
      latitude: Number(state.latitude.toFixed(6)),
      longitude: Number(state.longitude.toFixed(6)),
      altitude: state.altitude,
      speed: state.speed,
      heading: state.heading,
      batteryLevel: Number(state.battery.toFixed(1)),
    }),
  );
}

const timer = setInterval(tick, TICK_MS);

// --- Spegnimento pulito -----------------------------------------------------
function shutdown() {
  clearInterval(timer);
  log('offline');
  client.publish(T.status, JSON.stringify({ online: false }), {}, () => {
    client.end(true, () => process.exit(0));
  });
  setTimeout(() => process.exit(0), 1000); // failsafe
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

log(`drone virtuale avviato → ${BROKER} (tick ${TICK_MS}ms). Ctrl-C per fermare.`);
