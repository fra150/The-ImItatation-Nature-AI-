// Route temporaneamente DISABILITATA (modalità "core, niente AI").
// Il controller (forestController -> forestService) richiede chartjs-node-canvas
// (non presente tra le dipendenze) e Google Earth Engine. Il file del controller
// resta intatto: per riattivare, aggiungere le dipendenze e ripristinare le
// route originali (/forestChange, /chart/forestChange, /data, ...).
const express = require('express');
const router = express.Router();

router.use((req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    feature: 'forest',
    message:
      'Forest endpoints are temporarily disabled (Earth Engine / chartjs-node-canvas unavailable in this environment).',
  });
});

module.exports = router;
