// Route temporaneamente DISABILITATA (modalità "core, niente AI").
// Il controller (geminiController) richiede al top-level @tensorflow/tfjs-node
// — il cui binding nativo non carica in questo ambiente — e
// @google-cloud/text-to-speech, non presente tra le dipendenze. Il file del
// controller resta intatto: per riattivare, risolvere quelle dipendenze e
// ripristinare `router.post('/', GeminiController.getDataAndProcess)`.
const express = require('express');
const router = express.Router();

router.use((req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    feature: 'gemini',
    message:
      'Gemini endpoints are temporarily disabled (AI/native dependencies unavailable in this environment).',
  });
});

module.exports = router;
