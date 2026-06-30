// Drone subsystem — incarnazione concreta di "Bot Padre controlla i droni e
// viceversa": il Padre registra/assegna/comanda i droni, i droni riportano
// stato e dati in tempo reale. Tutte le route puntano ad handler realmente
// esportati da droneController. Le parti AI/meteo degradano con grazia quando
// le rispettive dipendenze non sono configurate.
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const droneController = require('../controllers/droneController');

// Upload immagini drone (salvataggio su disco in ../uploads/)
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// --- Registro droni (Bot Padre -> flotta) --------------------------------
router.get('/', droneController.getDrones);
router.post('/', droneController.addDrone);

// --- Comando & controllo --------------------------------------------------
router.post('/assign', droneController.assignDronesToFires); // assegna i droni ai fuochi attivi
router.post('/analyze', droneController.analyzeDroneData); // analisi AI + dispatch
router.post('/:id/mission', droneController.sendMission); // invia waypoint via MQTT
router.post('/:id/command', droneController.sendCommand); // takeoff/land/return/goto…
router.post('/:droneId/release-agent', droneController.releaseExtinguishingAgent);

// --- Telemetria (droni -> Bot Padre) -------------------------------------
router.put('/:id/status', droneController.updateDroneStatus);
router.get('/:droneId/realtime', droneController.getRealtimeData);

// --- Immagini -------------------------------------------------------------
router.post('/upload', upload.single('image'), droneController.uploadImage);

module.exports = router;
