// Classificazione del territorio via Earth Engine (letture GET pubbliche).
// - GET /api/classify/unsupervised : K-means su composito Landsat -> thumbnail
// - GET /api/classify/supervised   : Random Forest (etichette MODIS) -> thumbnail + accuratezza
// Query opzionali: bbox=w,s,e,n · startDate · endDate · numClusters.
const express = require('express');
const router = express.Router();
const classificationController = require('../controllers/classificationController');

router.get('/unsupervised', classificationController.unsupervised);
router.get('/supervised', classificationController.supervised);

module.exports = router;
