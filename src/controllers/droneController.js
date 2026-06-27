const Drone = require('../models/drone');
const { sequelize } = require('../config/database');
const FireIncident = require('../models/fireEvents');
const WeatherService = require('../services/weatherService');
const AIAnalysisService = require('../services/aiAnalysisService');
const { analyzeData } = require('../services/geminiService');
const logger = require('../utils/logger');

const { findNearestDrone, assignDroneToFire, uploadDroneImage } = require('../utils/droneUtils');
const fireWorkflow = require('../services/fireWorkflowService');
const realtime = require('../services/realtimeService');
const { check, validationResult } = require('express-validator');

// Cervello "Bot Padre": legge i dati dei droni, li analizza con l'AI (Gemini)
// e rimanda indietro le indicazioni ai droni. L'analisi AI degrada con grazia
// se Gemini non è configurato (GEMINI_API_KEY assente).
const analyzeDroneData = async (req, res) => {
  try {
    const droneData = await Drone.findAll();
    if (!droneData || droneData.length === 0) {
      return res.status(404).json({ error: 'No drone data found' });
    }

    // Analisi AI (graceful): senza chiave Gemini restituiamo un 503 chiaro.
    let analysisResult;
    try {
      analysisResult = await analyzeData(droneData);
    } catch (aiError) {
      logger.warn(`Drone AI analysis unavailable: ${aiError.message}`);
      return res.status(503).json({
        error: 'AI analysis unavailable',
        detail: 'Gemini not configured or unreachable (set GEMINI_API_KEY).',
      });
    }

    // Dispatch verso i droni (simulato: il canale hardware reale non è ancora
    // implementato — vedi visione "Bot Padre controlla i droni").
    const sendResult = dispatchToDrones(analysisResult, droneData);

    res.status(200).json({ analysis: analysisResult, sendStatus: sendResult });
  } catch (error) {
    logger.error(`Error during drone data analysis: ${error.message}`);
    res.status(500).json({ error: 'Error during drone data analysis' });
  }
};

// Invio (simulato) delle indicazioni ai droni. Sostituire con il canale di
// comunicazione reale (MQTT / API drone) quando disponibile.
const dispatchToDrones = (analysis, drones) => {
  logger.info(`Dispatching analysis to ${drones.length} drone(s)`);
  return { dispatched: drones.length, simulated: true };
};

// Add a new drone
const addDrone = async (req, res) => {
  await check('name', 'Name is required').notEmpty().run(req);
  await check('model', 'Model is required').notEmpty().run(req);
  await check('status', 'Status is required').notEmpty().run(req);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, model, status } = req.body;
    const drone = await Drone.create({ name, model, status });
    res.status(201).json(drone);
  } catch (error) {
    logger.error('Error adding drone:', error);
    res.status(500).json({ error: 'Failed to add drone' });
  }
};

// Get all drones
const getDrones = async (req, res) => {
  try {
    const drones = await Drone.findAll();
    res.status(200).json(drones);
  } catch (error) {
    logger.error('Error fetching drones:', error);
    res.status(500).json({ error: 'Failed to fetch drones' });
  }
};

// Automatically assign drones to detected fires.
// Delega a fireWorkflowService, che usa gli ENUM corretti
// (Drone='available', FireEvent='detected'|'in_progress') e coordinate reali.
// La versione precedente qui filtrava per status:'active' — valore inesistente
// in entrambi gli enum — quindi non assegnava mai nulla.
const assignDronesToFires = async (req, res, next) => {
  try {
    const result = await fireWorkflow.assignDronesToActiveFires();
    res.json({ message: 'Drones assigned successfully', ...result });
  } catch (error) {
    next(error);
  }
};

// Update the status of a drone
const updateDroneStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, location, batteryLevel, sensorData } = req.body;
  try {
    const drone = await Drone.findByPk(id);
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    drone.status = status;
    drone.location = location;
    drone.batteryLevel = batteryLevel;
    drone.lastSensorData = sensorData;
    await drone.save();
    realtime.emitDroneUpdate(drone); // telemetria live verso la dashboard

    // Analisi AI dei dati sensore (opzionale/graceful): il metodo dedicato non
    // è ancora implementato in aiAnalysisService, quindi degrada a null senza
    // far fallire l'aggiornamento di stato del drone.
    let aiAnalysis = null;
    if (typeof AIAnalysisService.analyzeSensorData === 'function') {
      try {
        aiAnalysis = await AIAnalysisService.analyzeSensorData(sensorData);
      } catch (aiError) {
        logger.warn(`Sensor AI analysis failed: ${aiError.message}`);
      }
    }

    // Notifica batteria bassa (placeholder per il canale di notifica reale)
    if (typeof batteryLevel === 'number' && batteryLevel < 20) {
      logger.warn(`Drone ${id} battery low: ${batteryLevel}%`);
    }

    res.json({ drone, aiAnalysis });
  } catch (error) {
    next(error);
  }
};

// Get real-time data from a specific drone
const getRealtimeData = async (req, res, next) => {
  const { droneId } = req.params;
  try {
    const drone = await Drone.findByPk(droneId);
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    // Simulate obtaining real-time data
    const realtimeData = {
      location: drone.location,
      batteryLevel: drone.batteryLevel,
      videoFeed: `https://drone-video-feed.com/${droneId}`, // this site should be the front-end part for firefighters the site is just an example.
      sensorData: drone.lastSensorData,
    };
    // Dati meteo per la posizione del drone (opzionale/graceful): la funzione
    // dedicata non è esposta dal WeatherService, quindi se non disponibile
    // restituiamo i dati realtime senza meteo invece di far fallire la richiesta.
    let weatherData = null;
    if (typeof WeatherService.getWeatherData === 'function') {
      try {
        weatherData = await WeatherService.getWeatherData(drone.location);
      } catch (wErr) {
        logger.warn(`Weather lookup failed: ${wErr.message}`);
      }
    }
    res.json({ realtimeData, weatherData });
  } catch (error) {
    next(error);
  }
};

// Release water or extinguishing agents from the drone, such as fireball
const releaseExtinguishingAgent = async (req, res, next) => {
  const { droneId } = req.params;
  const { amount, target } = req.body;
  try {
    const drone = await Drone.findByPk(droneId);
    if (!drone) {
      return res.status(404).json({ error: 'Drone not found' });
    }
    // Check if the drone has enough payload capacity
    if (drone.payloadCapacity < amount) {
      return res.status(400).json({ error: 'Insufficient payload capacity' });
    }
    // Simulate releasing water or extinguishing agents
    drone.payloadCapacity -= amount;
    await drone.save();
    // Log the release
    logger.info(
      `Drone ${droneId} released ${amount} liters of extinguishing agent at ${target.latitude}, ${target.longitude}`,
    );
    res.json({ message: 'Extinguishing agent released successfully' });
  } catch (error) {
    next(error);
  }
};

// Upload and optimize a drone image
const uploadImage = (req, res) => {
  uploadDroneImage(req, res);
};

module.exports = {
  addDrone,
  getDrones,
  assignDronesToFires,
  updateDroneStatus,
  getRealtimeData,
  releaseExtinguishingAgent,
  uploadImage,
  analyzeDroneData,
};

/*In this part of the code, we handle operations related to drones used for fire control. Here's an explanation of the main steps:
Importing necessary dependencies:
The Drone model is imported to interact with drone data in the database.
for `analyze Drone Data` I created a connection with gemini's AI so that it reads data from the database to send the drones to the appropriate places.
The FireIncident model is imported to interact with fire incident data in the database.
The WeatherService service is imported to get real-time weather data.
The AIAnalysisService service is imported to analyze sensor data using artificial intelligence.
The logger is imported to log errors and information.
Some utility functions are also imported for validating drone data, finding the nearest drone, assigning the drone to the fire, and uploading drone images.
Adding a new drone:
The addDrone function checks if the required fields (name, model, and status) are present in the request.
If the fields are valid, it creates a new drone in the database and returns the data of the newly created drone.
If errors occur during drone creation, errors are logged and an error response is returned.
Getting all drones:
The getDrones function retrieves all drones from the database and returns the drone data.
If errors occur during drone retrieval, errors are logged and an error response is returned.
Automatically assigning drones to detected fires:
The assignDronesToFires function retrieves all active fires from the database and all active drones from the database.
For each fire, it finds the nearest drone and assigns it to the fire.
If errors occur during drone assignment to fires, they are handled by the error handler.
Updating the status of a drone:
The updateDroneStatus function updates the status, position, battery level, and sensor data of a specific drone.
It analyzes the sensor data using artificial intelligence and returns the results of the analysis.
If the battery level is low, it sends a low battery notification.
If errors occur during drone status update, they are handled by the error handler.
Getting real-time data from a specific drone:
The getRealtimeData function returns real-time data from a specific drone, including position, battery level, video feed, and sensor data.
It also gets weather data for the drone's location using the WeatherService service.
If errors occur during real-time data retrieval, they are handled by the error handler.
Releasing water or extinguishing agents from the drone:
The releaseExtinguishingAgent function releases a specific amount of water or extinguishing agents from a specific drone.
It checks if the drone has enough payload capacity to release the specified amount.
If the drone has sufficient payload capacity, it simulates the release of water or extinguishing agents and updates the drone's payload capacity.
It logs the release of water or extinguishing agents.
If errors occur during water or extinguishing agent release, they are handled by the error handler.
Uploading and optimizing a drone's image:
The uploadImage function uploads and optimizes a drone's image using the imported uploadDroneImage function.
In summary, this code handles operations related to drones used for fire control, including adding new drones, optimizing drone images, automatically assigning drones to detected fires, updating drone status, retrieving real-time data from drones, releasing water or extinguishing agents from drones, and handling errors. */
