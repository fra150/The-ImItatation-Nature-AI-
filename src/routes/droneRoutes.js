// Route temporaneamente DISABILITATA (modalità "core, niente AI").
// Le route originali referenziavano numerosi handler non presenti in
// droneController (getAllDrones, createDrone, validateDroneData, planFlightRoute,
// getAllFires, ...) e il controller dipende da servizi AI/Earth Engine.
// Il file del controller resta intatto: per riattivare, allineare le route agli
// handler realmente esportati (addDrone, getDrones, assignDronesToFires,
// updateDroneStatus, getRealtimeData, releaseExtinguishingAgent, uploadImage,
// analyzeDroneData).
const express = require('express');
const router = express.Router();

router.use((req, res) => {
  res.status(501).json({
    error: 'Not Implemented',
    feature: 'drones',
    message:
      'Drone endpoints are temporarily disabled (route/controller realignment and AI deps pending).',
  });
});

module.exports = router;
