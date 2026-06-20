// Forest data API — superficie "core" DB-backed (NON richiede Earth Engine):
// CRUD sui record di forest-change nel model ForestData. Gli endpoint Earth
// Engine / chart restano differiti (501): richiedono una sessione EE e
// chartjs-node-canvas (dipendenza nativa non installata). Montato su '/api'.
const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { validate } = require('../middleware/validator');
const forestController = require('../controllers/forestController');

// --- CRUD DB-backed (forest data) ---
router.post(
  '/data',
  validate([
    check('treeCover2000').isInt({ min: 0, max: 100 }),
    check('loss').isBoolean(),
    check('gain').isBoolean(),
    check('lossYear').isInt(),
  ]),
  forestController.insertForestData,
);
router.get('/data', forestController.getAllForestData);
router.get('/data/:id', forestController.getForestDataById);
router.put('/data/:id', forestController.updateForestData);
router.delete('/data/:id', forestController.deleteForestData);

// --- Endpoint Earth Engine differiti (501 informativo) ---
const eeDeferred = (req, res) =>
  res.status(501).json({
    error: 'Not Implemented',
    feature: 'forest',
    message:
      'Forest Earth Engine endpoints are deferred (require an EE session and chartjs-node-canvas).',
  });
router.get('/forestChange', eeDeferred);
router.get('/chart/forestChange', eeDeferred);
router.get('/visualizeForestChange', eeDeferred);

module.exports = router;
