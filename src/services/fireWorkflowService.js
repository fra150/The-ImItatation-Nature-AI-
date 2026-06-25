// src/services/fireWorkflowService.js
//
// Pipeline reale "rilevamento incendio -> creazione FireEvent -> dispatch del
// drone più vicino". Questo è il cuore concreto della visione "Bot Padre
// controlla i droni": chiude il loop fra ciò che Earth Engine / i sensori
// rilevano e l'azione della flotta.
//
// Perché questo file esiste: la logica precedente (droneController /
// fireEventController) cercava droni e fuochi con `status: 'active'`, ma gli
// ENUM reali dei modelli sono Drone=available|in_use|maintenance e
// FireEvent=detected|in_progress|extinguished. Quel mismatch rendeva
// l'assegnazione un no-op silenzioso (zero risultati, sempre). Qui usiamo gli
// enum corretti e coordinate reali per il calcolo della distanza.
const geolib = require('geolib');
const { FireEvent, Drone } = require('../models');
const logger = require('../utils/logger');

// Stati di un incendio ancora "aperto" (da gestire). 'extinguished' è escluso.
const ACTIVE_FIRE_STATUSES = ['detected', 'in_progress'];

/**
 * Normalizza un input geografico in `{ latitude, longitude }` numerico.
 * Accetta:
 *  - oggetti { latitude/lat, longitude/lng/lon }
 *  - stringhe "lat,lng" (è il formato in cui salviamo FireEvent.location)
 * Ritorna null se non è interpretabile come coordinata.
 */
function parseCoords(value) {
  if (!value) return null;
  if (typeof value === 'object') {
    const lat = value.latitude ?? value.lat;
    const lng = value.longitude ?? value.lng ?? value.lon;
    return Number.isFinite(lat) && Number.isFinite(lng)
      ? { latitude: lat, longitude: lng }
      : null;
  }
  if (typeof value === 'string') {
    const parts = value.split(',').map((s) => parseFloat(s.trim()));
    if (parts.length === 2 && parts.every(Number.isFinite)) {
      return { latitude: parts[0], longitude: parts[1] };
    }
  }
  return null;
}

/**
 * Crea un FireEvent reale rispettando lo schema Sequelize (areaId, location,
 * startTime, severity, status). La location viene salvata come stringa
 * "lat,lng" quando arrivano coordinate, così resta interrogabile e
 * ri-parseabile per l'assegnazione batch.
 * @returns {Promise<FireEvent>}
 */
async function createFireEvent({
  areaId,
  location,
  latitude,
  longitude,
  severity = 'medium',
  detectedBySensorId = null,
  description = null,
  startTime,
} = {}) {
  if (areaId == null) {
    throw new Error('areaId is required to create a fire event');
  }
  const hasCoords = Number.isFinite(latitude) && Number.isFinite(longitude);
  const locationLabel = location || (hasCoords ? `${latitude},${longitude}` : null);
  if (!locationLabel) {
    throw new Error('location (or latitude/longitude) is required to create a fire event');
  }
  return FireEvent.create({
    areaId,
    location: locationLabel,
    latitude: hasCoords ? latitude : null,
    longitude: hasCoords ? longitude : null,
    severity,
    status: 'detected',
    startTime: startTime || new Date(),
    detectedBySensorId,
    description,
  });
}

/**
 * Trova il drone DISPONIBILE più vicino a una coordinata. Filtra i droni privi
 * di posizione (geolib lancerebbe su location null) e usa la distanza reale.
 * @param {{latitude:number, longitude:number}|string} coords
 * @returns {Promise<Drone|null>}
 */
async function findNearestAvailableDrone(coords) {
  const point = parseCoords(coords);
  if (!point) return null;

  const drones = await Drone.findAll({ where: { status: 'available' } });
  const located = drones.filter(
    (d) => d.location && Number.isFinite(d.location.latitude) && Number.isFinite(d.location.longitude),
  );
  if (located.length === 0) return null;

  let nearest = null;
  let shortest = Number.MAX_VALUE;
  for (const drone of located) {
    const distance = geolib.getDistance(point, drone.location);
    if (distance < shortest) {
      shortest = distance;
      nearest = drone;
    }
  }
  return nearest;
}

/**
 * Assegna un drone a un incendio con gli enum CORRETTI: il drone passa a
 * 'in_use' con azione 'extinguish' e fireEventId valorizzato; l'incendio, se
 * appena rilevato, passa a 'in_progress'. (La vecchia util impostava
 * status='mission' — valore NON presente nell'enum Drone — e colonne
 * inesistenti: sarebbe sempre fallita.)
 * @returns {Promise<Drone>} il drone aggiornato
 */
async function assignDroneToFireEvent(drone, fireEvent) {
  drone.status = 'in_use';
  drone.action = 'extinguish';
  drone.fireEventId = fireEvent.id; // colonna creata dall'associazione in models/index.js
  await drone.save();

  if (fireEvent.status === 'detected') {
    fireEvent.status = 'in_progress';
    await fireEvent.save();
  }

  logger.info(`Drone ${drone.id} assigned to fire event ${fireEvent.id}`);
  return drone;
}

/**
 * Orchestrazione completa: crea l'incendio e gli manda subito il drone più
 * vicino. Degrada con grazia: se non ci sono droni disponibili, l'incendio
 * resta registrato e `dispatched` è false (nessun errore).
 * @returns {Promise<{fireEvent: FireEvent, assignedDrone: Drone|null, dispatched: boolean}>}
 */
async function detectAndDispatch(payload = {}) {
  const fireEvent = await createFireEvent(payload);

  const coords =
    parseCoords(
      Number.isFinite(payload.latitude) && Number.isFinite(payload.longitude)
        ? { latitude: payload.latitude, longitude: payload.longitude }
        : payload.coords || payload.location,
    ) || parseCoords(fireEvent.location);

  const drone = await findNearestAvailableDrone(coords);
  if (!drone) {
    logger.warn(`Fire event ${fireEvent.id} registered, but no available drone to dispatch`);
    return { fireEvent, assignedDrone: null, dispatched: false };
  }

  await assignDroneToFireEvent(drone, fireEvent);
  return { fireEvent, assignedDrone: drone, dispatched: true };
}

/**
 * Assegna in batch i droni disponibili a tutti gli incendi ancora aperti che
 * non ne hanno già uno. Usa le coordinate ricavate da FireEvent.location
 * (formato "lat,lng"); gli incendi senza coordinate interpretabili vengono
 * saltati con grazia. Rimpiazza la vecchia logica con enum sbagliati.
 * @returns {Promise<{assigned:number, assignments:Array<{fireEventId:number, droneId:number}>}>}
 */
async function assignDronesToActiveFires() {
  const fires = await FireEvent.findAll({ where: { status: ACTIVE_FIRE_STATUSES } });
  const assignments = [];

  for (const fire of fires) {
    const alreadyAssigned = await Drone.findOne({ where: { fireEventId: fire.id } });
    if (alreadyAssigned) continue;

    // Preferisci le coordinate persistite; ripiega sul parsing di `location`
    // per gli incendi storici creati prima delle colonne lat/lng.
    const coords =
      parseCoords({ latitude: fire.latitude, longitude: fire.longitude }) ||
      parseCoords(fire.location);
    if (!coords) continue;

    const drone = await findNearestAvailableDrone(coords);
    if (!drone) continue;

    await assignDroneToFireEvent(drone, fire);
    assignments.push({ fireEventId: fire.id, droneId: drone.id });
  }

  return { assigned: assignments.length, assignments };
}

module.exports = {
  ACTIVE_FIRE_STATUSES,
  parseCoords,
  createFireEvent,
  findNearestAvailableDrone,
  assignDroneToFireEvent,
  detectAndDispatch,
  assignDronesToActiveFires,
};
