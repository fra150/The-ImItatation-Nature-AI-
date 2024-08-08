const Area = require('../models/area');
const Sensor = require('../models/sensor');
const Drone = require('../models/drone');
const Fire = require('../models/fireEvents');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const NotificationService = require('../services/notificationService');
const AnalysisService = require('../services/aiAnalysisService');
const geminiService = require('../services/geminiService');
const {trainSupervisedClassifier,} = require('../services/classificationService/supervisedClassification');
const {trainUnsupervisedClusterer,} = require('../services/classificationService/unsupervisedClassification');
const { createCompositeImage } = require('../services/classificationService/dataPreparation');
const { evaluateAccuracy } = require('../services/classificationService/accuracyEvaluation');

// Function to classify a area (These examples can be modified as needed)
const classifyareaController = async (req, res) => {
  const { startDate, endDate, points, label } = req.body;
  const { image, bands } = createCompositeImage(startDate, endDate);

  const classifiedImage = await trainSupervisedClassifier(image, points, bands, label);
  const accuracy = await evaluateAccuracy(classifiedImage, image, label, bands, req.body.region);

  res.json({
    classifiedImage,
    accuracy,
  });
};

// Example of an endpoint that uses unsupervised classification (These examples can be modified as needed)
const clusterareaController = async (req, res) => {
  const { startDate, endDate, region } = req.body;
  const { image } = createCompositeImage(startDate, endDate);

  const clusteredImage = await trainUnsupervisedClusterer(image, region);

  res.json(clusteredImage);
};

// This is an alternative AI-based monitoring option for the Area
const monitorAreaai = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByPk(id, {
      include: [{ model: Sensor }, { model: Drone }],
    });
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    // Simulate real-time monitoring
    const monitoringData = await simulateMonitoring(area);
    // Analyze data using the Gemini service
    const analysis = await geminiService.analyzeData(monitoringData);
    if (analysis.fireDetected) {
      await NotificationService.sendAlert({
        areaId: area.id,
        message: `Potential fire detected in area ${area.name}`,
        severity: 'high',
      });
    }

    res.json({ area, monitoringData, analysis });
  } catch (error) {
    logger.error('Error during area monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Middleware for validating area data.
 */
const validateAreaData = [
  body('name')
    .notEmpty()
    .withMessage('Area name is required')
    .isString()
    .withMessage('Area name must be a string'),
  body('dimensions').isObject().withMessage('Dimensions must be an object').optional(), // Dimensions are optional to allow updating other fields
  body('dimensions.width')
    .isNumeric()
    .withMessage('Width must be a number')
    .toFloat()
    .withMessage('Width must be a decimal number')
    .optional(), // Dimensions are optional to allow updating other fields
  body('dimensions.length')
    .isNumeric()
    .withMessage('Length must be a number')
    .toFloat()
    .withMessage('Length must be a decimal number')
    .optional(),
  body('location').isObject().withMessage('Location must be an object').optional(),
  body('location.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be a decimal number between -90 and 90')
    .optional(),
  body('location.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be a decimal number between -180 and 180')
    .optional(),
  body('sensorIds').isArray().withMessage('Sensor IDs must be an array').optional(),
  body('sensorIds.*').isInt().withMessage('Each sensor ID must be an integer').optional(),
];

/**
 * Create a new area.
 * @route POST /areas
 * @param {Object} req - The HTTP request.
 * @param {Object} req.body - The request body containing area data.
 * @param {string} req.body.name - The name of the area.
 * @param {Object} req.body.dimensions - The dimensions of the area (optional).
 * @param {number} req.body.dimensions.width - The width of the area.
 * @param {number} req.body.dimensions.length - The length of the area.
 * @param {Object} req.body.location - The location of the area (optional).
 * @param {number} req.body.location.latitude - The latitude of the area.
 * @param {number} req.body.location.longitude - The longitude of the area.
 * @param {Array} req.body.sensorIds - An array of sensor IDs to associate with the area (optional).
 * @param {Object} res - The HTTP response.
 * @returns {Object} - A JSON object containing the data of the newly created area or an error message.
 */
const createArea = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, dimensions, location, sensorIds } = req.body;
    // Check if an area with the same name already exists
    const existingArea = await Area.findOne({ where: { name } });
    if (existingArea) {
      return res.status(409).json({ error: 'An area with this name already exists' });
    }
    const newArea = await Area.create({
      name,
      dimensions,
      location,
    });
    // Associate sensors with the area
    if (sensorIds && sensorIds.length > 0) {
      const sensors = await Sensor.findAll({
        where: { id: sensorIds },
      });
      await newArea.setSensors(sensors);
    }
    // Plan resources (drones) for the area
    await planResourcesForArea(newArea);
    logger.info(`New area created: ${newArea.name}`);
    res.status(201).json(newArea);
  } catch (error) {
    logger.error('Error during area creation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get all areas.
 */
const getAllAreas = async (req, res) => {
  try {
    const areas = await Area.findAll({
      include: [{ model: Sensor }, { model: Drone }],
    });
    res.json(areas);
  } catch (error) {
    logger.error('Error during area retrieval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a specific area.
 */
const getArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByPk(id, {
      include: [{ model: Sensor }, { model: Drone }],
    });
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    res.json(area);
  } catch (error) {
    logger.error('Error during area retrieval:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update an existing area.
 */
const updateArea = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const { name, dimensions, location, sensorIds } = req.body;
    const area = await Area.findByPk(id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }
    await area.update({
      name,
      dimensions,
      location,
    });
    // Update sensor association
    if (sensorIds) {
      const sensors = await Sensor.findAll({
        where: { id: sensorIds },
      });
      await area.setSensors(sensors);
    }
    // Recalculate resource planning
    await planResourcesForArea(area);
    logger.info(`Area updated: ${area.name}`);
    res.json(area);
  } catch (error) {
    logger.error('Error during area update:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete an area.
 */
const deleteArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByPk(id);
    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }

    await area.destroy();
    logger.info(`Area deleted: ${area.name}`);
    res.status(204).end();
  } catch (error) {
    logger.error('Error during area deletion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Plan resources for an area.
 */
const planResourcesForArea = async (area) => {
  try {
    // Implement here the logic to assign drones to the area
    // This is just a simplified example
    const availableDrones = await Drone.findAll({ where: { status: 'available' } });
    const droneCount = Math.ceil((area.dimensions.width * area.dimensions.length) / 1000000); // 1 drone per km²
    const assignedDrones = availableDrones.slice(0, droneCount);

    await area.setDrones(assignedDrones);

    logger.info(`Assigned ${assignedDrones.length} drones to area ${area.name}`);
  } catch (error) {
    logger.error('Error during resource planning:', error);
  }
};

/**
 * Monitor an area in real-time.
 */
const monitorArea = async (req, res) => {
  try {
    const { id } = req.params;
    const area = await Area.findByPk(id, {
      include: [{ model: Sensor }, { model: Drone }],
    });

    if (!area) {
      return res.status(404).json({ error: 'Area not found' });
    }

    // Simulate real-time monitoring
    const monitoringData = await simulateMonitoring(area);

    // Analyze data and send notifications if necessary
    const analysis = await AnalysisService.analyzeData(monitoringData);
    if (analysis.fireDetected) {
      await NotificationService.sendAlert({
        areaId: area.id,
        message: `Potential fire detected in area ${area.name}`,
        severity: 'high',
      });
    }

    res.json({ area, monitoringData, analysis });
  } catch (error) {
    logger.error('Error during area monitoring:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Simulate monitoring of an area.
 */
const simulateMonitoring = async (area) => {
  // This is just a simplified simulation. In a real system,
  // this data would come from actual sensors and drones.
  return {
    temperature: Math.random() * 30 + 10, // 10-40°C
    smokeLevel: Math.random() * 100, // 0-100%
    windSpeed: Math.random() * 20, // 0-20 km/h
    humidity: Math.random() * 100, // 0-100%
  };
};

module.exports = {
  validateAreaData, // This was added to validate input data before creating or updating an area.
  createArea,
  getAllAreas,
  getArea,
  updateArea,
  deleteArea,
  monitorArea,
  monitorAreaai,
  classifyareaController,
  clusterareaController,
};

/* I have created a controller to handle operations related to areas in a fire monitoring and management system. The controller includes the following features:
I also inserted two classification  supervised and unsupervised examples both linked to service classificationService,they are just two incomplete examples.
Creating a new area: I have defined a createArea function that accepts area data as input, validates the data using the validateAreaData middleware, checks if an area with the same name already exists, and if not, creates a new area in the database. It also associates sensors with the area and plans resources (drones) for the area.
Retrieving all areas: I have defined a getAllAreas function that retrieves all areas from the database and returns them as a response.
Retrieving a specific area: I have defined a getArea function that accepts the ID of an area as input, retrieves the area from the database, and returns it as a response.
Updating an existing area: I have defined an updateArea function that accepts the ID of an area and the new area data as input, validates the data using the validateAreaData middleware, retrieves the area from the database, updates the area data, and recalculates the resource planning.
Deleting an area: I have defined a deleteArea function that accepts the ID of an area as input, retrieves the area from the database, and deletes it.
Monitoring an area: I have defined a monitorArea function that accepts the ID of an area as input, retrieves the area from the database, simulates real-time monitoring, and analyzes the data using the AnalysisService. If a potential fire is detected, it sends a notification using the NotificationService.
The validateAreaData middleware has been added to validate input data before creating or updating an area. A centralized error handler has been added to capture and log errors. The planResourcesForArea function has been added to simulate assigning drones to an area. The monitorArea function has been improved to use the AnalysisService and NotificationService. Finally, the monitorareaai function has been added to use the @geminiService for analyzing monitoring data.*/
