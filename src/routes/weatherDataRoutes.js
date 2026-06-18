// Route temporaneamente DISABILITATA (modalità "core, niente AI").
// Le route originali referenziavano handler non presenti in
// weatherDataController (insertWeatherData, updateWeatherData,
// deleteWeatherData) e usavano validationResult senza importarlo; inoltre il
// controller dipende da Google Earth Engine. Il controller resta intatto: per
// riattivare, allineare le route agli handler esportati (getWeatherData,
// visualizeWeatherData, getWeatherDataGoes, getWindSpeedData) e implementare i
// mancanti.
const express = require('express');
const router = express.Router();

router.use((req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    feature: 'weather',
    message:
      'Weather endpoints are temporarily disabled (Earth Engine unavailable and route/controller realignment pending).',
  });
});

module.exports = router;
