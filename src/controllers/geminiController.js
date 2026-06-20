const { analyzeData, startChatSession } = require('../services/geminiService');
const { geminiApiKey } = require('../config/environment');
const logger = require('../utils/logger');

// Text-to-Speech è OPZIONALE: il pacchetto @google-cloud/text-to-speech non è
// tra le dipendenze installate, quindi lo carichiamo in modo lazy. Se assente
// (o senza credenziali), degradiamo restituendo solo la risposta testuale.
let _tts; // undefined = non ancora provato, null = non disponibile
function getTtsClient() {
  if (_tts !== undefined) return _tts;
  try {
    const { TextToSpeechClient } = require('@google-cloud/text-to-speech');
    const { textToSpeechCredentials } = require('../config/environment');
    _tts = new TextToSpeechClient({ keyFilename: textToSpeechCredentials });
  } catch (e) {
    logger.warn(`Text-to-Speech non disponibile: ${e.message}`);
    _tts = null;
  }
  return _tts;
}

const GeminiController = {
  /**
   * Analizza un prompt o dei dati con Gemini (servizio reale GoogleGenerativeAI)
   * e restituisce la risposta testuale; se il Text-to-Speech è disponibile,
   * allega anche l'audio. Degrada con 503 se Gemini non è configurato.
   * Body: { prompt: string } oppure { data: any }.
   */
  async getDataAndProcess(req, res) {
    if (!geminiApiKey) {
      return res.status(503).json({
        error: 'AI unavailable',
        detail: 'Gemini not configured (set GEMINI_API_KEY).',
      });
    }

    const input = req.body && (req.body.prompt ?? req.body.data);
    if (input === undefined || input === null || input === '') {
      return res.status(400).json({ error: 'Provide "prompt" or "data" in the request body.' });
    }

    try {
      // Risposta testuale dal modello Gemini reale.
      const written =
        typeof input === 'string' ? await startChatSession(input) : await analyzeData(input);

      // Audio opzionale: solo se il client TTS è disponibile.
      let spoken = null;
      const tts = getTtsClient();
      if (tts) {
        try {
          const [response] = await tts.synthesizeSpeech({
            input: { text: typeof written === 'string' ? written : JSON.stringify(written) },
            voice: { languageCode: 'en-US', ssmlGender: 'NEUTRAL' },
            audioConfig: { audioEncoding: 'MP3' },
          });
          spoken = response.audioContent;
        } catch (ttsErr) {
          logger.warn(`Text-to-speech failed: ${ttsErr.message}`);
        }
      }

      res.json({ written, spoken });
    } catch (error) {
      logger.error(`Error in Gemini controller: ${error.message}`);
      res.status(502).json({ error: 'Gemini request failed', detail: error.message });
    }
  },
};

module.exports = GeminiController;
