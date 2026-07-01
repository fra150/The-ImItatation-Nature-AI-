// src/services/fireSpreadService.js
//
// Stima ONESTA della propagazione di un incendio guidata dal vento.
//
// ⚠️ NON è un modello fisico (niente Rothermel, niente umidità del
// combustibile, niente pendenza/topografia). È un'euristica lineare
// documentata: la direzione viene dal vettore vento reale (ERA5 u/v), il
// tasso di avanzamento è una funzione monotona — non certificata — della
// severità e della velocità del vento. Va trattata come un indicatore di
// massima per la consapevolezza situazionale, non come una previsione
// affidabile. Il README elencava questa come funzionalità "in programma, non
// realizzata": questo è il v1 scopato, non la versione da pitch (niente
// GNN/deep-RL).
const { WeatherData } = require('../models');

// Tasso di avanzamento base per severità (m/s), prima di applicare il vento.
// Valori indicativi, non calibrati su dati reali di incendio.
const BASE_RATE_MPS = { low: 0.02, medium: 0.05, high: 0.1 };
const DEFAULT_BASE_RATE_MPS = 0.05;
// Ogni m/s di vento aumenta il tasso di questa frazione (euristica lineare).
const WIND_RATE_FACTOR = 0.6;

/**
 * Vettore vento -> velocità (m/s) e rotta (gradi 0–360, direzione VERSO cui
 * soffia il vento — è quella verso cui il fuoco tende a essere spinto).
 * Convenzione: u = componente est (+) / ovest (-), v = componente nord (+) /
 * sud (-) — standard meteorologico ERA5.
 */
function windVectorToSpeedBearing(windU, windV) {
  const speedMs = Math.hypot(windU, windV);
  const bearingDeg = (Math.atan2(windU, windV) * 180) / Math.PI;
  return { speedMs, bearingDeg: (bearingDeg + 360) % 360 };
}

/**
 * Recupera la lettura meteo più recente per un'area. Ritorna null se non ce
 * n'è nessuna (degradazione con grazia: niente vento = nessuna stima).
 */
async function getLatestWeather(areaId) {
  return WeatherData.findOne({ where: { areaId }, order: [['date', 'DESC']] });
}

/**
 * Stima la propagazione a partire da un vettore vento + severità. Funzione
 * pura, testabile senza DB.
 * @param {{windU:number, windV:number, severity?: 'low'|'medium'|'high', horizonMinutes?: number}} input
 */
function estimateSpread({ windU, windV, severity, horizonMinutes = 60 }) {
  const { speedMs, bearingDeg } = windVectorToSpeedBearing(windU, windV);
  const baseRate = BASE_RATE_MPS[severity] ?? DEFAULT_BASE_RATE_MPS;
  const spreadRateMps = baseRate * (1 + speedMs * WIND_RATE_FACTOR);
  const projectedDistanceMeters = spreadRateMps * horizonMinutes * 60;

  return {
    windSpeedMs: Number(speedMs.toFixed(2)),
    bearingDeg: Math.round(bearingDeg),
    spreadRateMps: Number(spreadRateMps.toFixed(4)),
    horizonMinutes,
    projectedDistanceMeters: Math.round(projectedDistanceMeters),
    method: 'heuristic-wind-linear',
    confidence: 'low',
    disclaimer:
      'Stima euristica indicativa (direzione+velocità vento reali, tasso NON fisico) — non un modello di comportamento del fuoco certificato.',
  };
}

/**
 * Stima end-to-end per un FireEvent: recupera il vento più recente della sua
 * area e applica estimateSpread. Ritorna {available:false, reason} se non ci
 * sono dati meteo per quell'area (nessun crash, nessuna stima inventata).
 */
async function estimateSpreadForFireEvent(fireEvent, options = {}) {
  const weather = await getLatestWeather(fireEvent.areaId);
  if (!weather || typeof weather.u_component_of_wind_10m !== 'number') {
    return { available: false, reason: 'no wind data for this area' };
  }
  const estimate = estimateSpread({
    windU: weather.u_component_of_wind_10m,
    windV: weather.v_component_of_wind_10m ?? 0,
    severity: fireEvent.severity,
    ...options,
  });
  return { available: true, weatherDate: weather.date, ...estimate };
}

module.exports = {
  BASE_RATE_MPS,
  windVectorToSpeedBearing,
  getLatestWeather,
  estimateSpread,
  estimateSpreadForFireEvent,
};
