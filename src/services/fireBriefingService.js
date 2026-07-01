// src/services/fireBriefingService.js
//
// Riepilogo incidente generato da Gemini: raccoglie i dati REALI già a
// disposizione (incendio, area, meteo, stima propagazione, droni assegnati) e
// chiede a Gemini di sintetizzarli in un briefing leggibile per un vigile del
// fuoco. Non è un sistema di ragionamento autonomo: è un riassunto testuale
// su dati che il backend ha già raccolto — degrada a 503 se GEMINI_API_KEY
// non è configurata (stesso pattern del resto del progetto).
const { FireEvent, Area, Drone } = require('../models');
const { startChatSession } = require('./geminiService');
const fireSpreadService = require('./fireSpreadService');
const logger = require('../utils/logger');

/**
 * Raccoglie tutti i dati disponibili su un incendio in un unico oggetto,
 * senza chiamare Gemini. Esposta separatamente così il contesto è
 * ispezionabile/testabile a prescindere dall'AI.
 * @returns {Promise<Object|null>} null se l'incendio non esiste
 */
async function buildBriefingContext(fireEventId) {
  const fireEvent = await FireEvent.findByPk(fireEventId);
  if (!fireEvent) return null;

  const area = await Area.findByPk(fireEvent.areaId);
  const assignedDrones = await Drone.findAll({ where: { fireEventId: fireEvent.id } });
  const spread = await fireSpreadService.estimateSpreadForFireEvent(fireEvent);

  return { fireEvent, area, assignedDrones, spread };
}

function formatContextForPrompt({ fireEvent, area, assignedDrones, spread }) {
  const lines = [
    `Fire event #${fireEvent.id} — status: ${fireEvent.status}, severity: ${fireEvent.severity}`,
    `Location label: ${fireEvent.location}${
      fireEvent.latitude != null ? ` (${fireEvent.latitude}, ${fireEvent.longitude})` : ''
    }`,
    `Detected: ${fireEvent.startTime || fireEvent.detectedAt}`,
    area ? `Area: ${area.name} (risk level: ${area.riskLevel})` : 'Area: unknown',
    fireEvent.description ? `Notes: ${fireEvent.description}` : null,
    assignedDrones.length
      ? `Assigned drones: ${assignedDrones.map((d) => `${d.model} (${d.status}, battery ${d.batteryLevel}%)`).join('; ')}`
      : 'Assigned drones: none currently dispatched',
    spread.available
      ? `Wind-driven spread estimate (heuristic, not physics-grade): wind ${spread.windSpeedMs} m/s toward ${spread.bearingDeg}°, projected ~${spread.projectedDistanceMeters}m in ${spread.horizonMinutes} min`
      : `Spread estimate: unavailable (${spread.reason})`,
  ].filter(Boolean);
  return lines.join('\n');
}

/**
 * Genera il briefing testuale. Lancia se Gemini non è configurato/raggiungibile
 * — il chiamante (controller) traduce l'errore in un 503 chiaro, come per le
 * altre integrazioni AI del progetto.
 * @returns {Promise<{context: Object, briefing: string}>}
 */
async function generateBriefing(fireEventId) {
  const context = await buildBriefingContext(fireEventId);
  if (!context) {
    const err = new Error('Fire event not found');
    err.statusCode = 404;
    throw err;
  }

  const prompt = [
    'You are assisting a wildfire incident commander. Summarize the following',
    'data into a short, actionable briefing (max ~150 words): current situation,',
    'the single most important risk, and one recommended next action. Be direct',
    'and concrete, no filler.',
    '',
    formatContextForPrompt(context),
  ].join('\n');

  const briefing = await startChatSession(prompt);
  logger.info(`Generated Gemini briefing for fire event ${fireEventId}`);
  return { context, briefing };
}

module.exports = {
  buildBriefingContext,
  formatContextForPrompt,
  generateBriefing,
};
