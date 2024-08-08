const Sensor = require('../models/sensor');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/validator');
const { trainSupervisedClassifier,} = require('../services/classificationService/supervisedClassification');
const {trainUnsupervisedClusterer,} = require('../services/classificationService/unsupervisedClassification');
const { createCompositeImage } = require('../services/classificationService/dataPreparation');
const { evaluateAccuracy } = require('../services/classificationService/accuracyEvaluation');
const { exportClassifier } = require('../services/classificationService/classifierExport');

// Function to classify a fire event (These examples can be modified as needed)
const classifysensorController = async (req, res) => {
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
const clustersensorController = async (req, res) => {
  const { startDate, endDate, region } = req.body;
  const { image } = createCompositeImage(startDate, endDate);

  const clusteredImage = await trainUnsupervisedClusterer(image, region);

  res.json(clusteredImage);
};

// Function to get sensors by type
const getSensorsByType = async (req, res) => {
  const { type } = req.params;
  try {
    const sensors = await Sensor.findAll({ where: { type } });
    res.json({
      message: `Sensors of type ${type} retrieved successfully`,
      sensors,
    });
  } catch (error) {
    logger.error('Error fetching sensors:', error);
    res.status(500).json({ error: 'Failed to fetch sensors' });
  }
};

/**
 * Function to retrieve all sensors
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Array} sensors - Array of sensors
 */
const getAllSensors = async (req, res) => {
  try {
    const sensors = await Sensor.findAll();
    res.json({ message: 'Sensors retrieved successfully', sensors });
  } catch (error) {
    logger.error('Error fetching sensors:', error);
    res.status(500).json({ error: 'Failed to fetch sensors' });
  }
};

/**
 * Create a new sensor
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Sensor
 */
const createSensor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    type,
    name,
    description,
    manufacturer,
    model,
    serialNumber,
    firmwareVersion,
    hardwareVersion,
    location,
    status,
    softwareVersion,
  } = req.body;

  try {
    const sensor = await Sensor.create({
      type,
      name,
      description,
      manufacturer,
      model,
      serialNumber,
      firmwareVersion,
      hardwareVersion,
      location,
      status,
      softwareVersion,
    });
    res.status(201).json({ message: 'Sensor created successfully', sensor });
  } catch (error) {
    logger.error('Error creating sensor:', error);
    res.status(500).json({ error: 'Failed to create sensor' });
  }
};

/**
 * Update an existing sensor
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Sensor
 */
const updateSensor = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { id } = req.params;
    const { type, location, status } = req.body;
    const sensor = await Sensor.findByPk(id);
    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    sensor.type = type;
    sensor.location = location;
    sensor.status = status;
    await sensor.save();
    res.json({ message: 'Sensor updated successfully', sensor });
  } catch (error) {
    logger.error('Error updating sensor:', error);
    res.status(500).json({ error: 'Failed to update sensor' });
  }
};

/**
 * Delete an existing sensor
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {void}
 */
const deleteSensor = async (req, res) => {
  try {
    const { id } = req.params;
    const sensor = await Sensor.findByPk(id);
    if (!sensor) {
      return res.status(404).json({ error: 'Sensor not found' });
    }
    await sensor.destroy();
    res.status(204).json({ message: 'Sensor deleted successfully' });
  } catch (error) {
    logger.error('Error deleting sensor:', error);
    res.status(500).json({ error: 'Failed to delete sensor' });
  }
};

/* Additional functions to consider:
1. Add a function to insert a sensor using GPS
2. Analyze the sensor and its status using AI (Gemini)
3. Enable communication between sensors using IoT (MQTT) */

module.exports = {
  getAllSensors,
  createSensor,
  updateSensor,
  deleteSensor,
  getSensorsByType,
  classifysensorController,
  clustersensorController,
};

/* That's a great explanation of your code! You've created a module to handle CRUD operations on sensors, which is a common task in many applications. Here's a summary of what you've done:
1. You've imported the `Sensor` module, which represents the sensor model in your database.
2. You've imported the `logger` module to log any errors that may occur.
3. You've imported the `express-validator` module to validate sensor data.
4. You've created a `getSensorsByType` function that retrieves sensors from the database based on the specified type.
5. You've created a `getAllSensors` function that retrieves all sensors from the database.
6. You've created a `createSensor` function that creates a new sensor in the database. Before creating the sensor, the sensor data is validated using `express-validator`.
7. You've created an `updateSensor` function that updates an existing sensor in the database. Again, the sensor data is validated before being updated.
8. You've created a `deleteSensor` function that deletes an existing sensor from the database.
These functions can be used as route handlers in an Express application to handle HTTP requests related to sensors. For example, the `getAllSensors` function can be used to handle GET requests to the `/sensors` endpoint to retrieve all sensors from the database.*/
 