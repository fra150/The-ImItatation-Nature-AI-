// Weather data API — superficie "core" DB-backed (NON richiede Earth Engine):
// salva e consulta osservazioni meteo nel model WeatherData.
// Gli endpoint Earth Engine (ERA5, GOES, classify/cluster) restano differiti:
// dipendono da una sessione EE e da globali del Code Editor (Map.*). I relativi
// handler restano esportati dal controller per quando si riattiverà l'EE.
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { validate } = require('../middleware/validator');
const weatherDataController = require('../controllers/weatherDataController');

// Crea un'osservazione meteo
router.post(
  '/',
  validate([
    check('areaId').notEmpty().withMessage('areaId is required').isInt(),
    check('date').notEmpty().withMessage('date is required').isISO8601(),
  ]),
  weatherDataController.createWeatherData,
);

router.get('/', weatherDataController.getAllWeatherData);
router.get('/:id', weatherDataController.getWeatherDataById);
router.put('/:id', weatherDataController.updateWeatherData);
router.delete('/:id', weatherDataController.deleteWeatherData);

module.exports = router;
