// Endpoint Gemini: analizza un prompt/dati col modello reale (geminiService ->
// GoogleGenerativeAI) e, se disponibile, restituisce anche l'audio (TTS).
// Degrada con 503 quando GEMINI_API_KEY non è configurata.
const express = require('express');
const router = express.Router();
const GeminiController = require('../controllers/geminiController');

router.post('/', GeminiController.getDataAndProcess);

module.exports = router;
