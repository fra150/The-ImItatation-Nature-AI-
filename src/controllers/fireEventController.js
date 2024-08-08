const FireIncident = require('../models/fireEvents');
const Drone = require('../models/drone');
const { findNearestDrone, assignDroneToFire } = require('../utils/droneUtils');
const { analyzeData } = require('../services/geminiService');
const { trainSupervisedClassifier,} = require('../services/classificationService/supervisedClassification');
const {trainUnsupervisedClusterer,} = require('../services/classificationService/unsupervisedClassification');
const { createCompositeImage } = require('../services/classificationService/dataPreparation');
const { evaluateAccuracy } = require('../services/classificationService/accuracyEvaluation');
const { exportClassifier } = require('../services/classificationService/classifierExport');


// Function to classify a fire event (These examples can be modified as needed)
const classifyFireEvent = async (req, res) => {
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
const clusterFireEvent = async (req, res) => {
  const { startDate, endDate, region } = req.body;
  const { image } = createCompositeImage(startDate, endDate);

  const clusteredImage = await trainUnsupervisedClusterer(image, region);

  res.json(clusteredImage);
};

const analyzeFireEventData = async (req, res) => {
  try {
    const data = req.body;
    const analysisResult = await analyzeData(data);
    res.status(200).json({ analysis: analysisResult });
  } catch (error) {
    res.status(500).json({ error: 'Error during data analysis' });
  }
};

/**
 * Fetches all fire events
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Array} FireEvents
 */
const getAllFireEvents = async (req, res, next) => {
  try {
    const fireEvents = await FireEvent.findAll();
    res.status(200).json(fireEvents);
  } catch (error) {
    logger.error('Error fetching fire events:', error);
    res.status(500).json({ error: 'Failed to fetch fire events' });
    next(error);
  }
};

/**
 * Creates a new fire event
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} FireEvent
 */
const createFireEvent = async (req, res, next) => {
  await check('sensorId', 'Sensor ID is required').notEmpty().run(req);
  await check('location', 'Location is required').notEmpty().run(req);
  await check('status', 'Status is required').notEmpty().run(req);
  await check('severity', 'Severity is required').notEmpty().run(req);
  await check('date', 'Date is required').notEmpty().run(req);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { sensorId, location, status, severity, date } = req.body;
    const fireEvent = await FireEvent.create({ sensorId, location, status, severity, date });
    res.status(201).json({ message: 'Fire event created successfully', fireEvent });
  } catch (error) {
    logger.error('Error creating fire event:', error);
    res.status(500).json({ error: 'Failed to create fire event' });
    next(error);
  }
};

/**
 * Updates an existing fire event
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} FireEvent
 */
const updateFireEvent = async (req, res, next) => {
  const { id } = req.params;
  const { status, severity, location } = req.body;
  try {
    const fireEvent = await FireEvent.findByPk(id);
    if (!fireEvent) {
      return res.status(404).json({ error: 'Fire event not found' });
    }
    fireEvent.status = status;
    fireEvent.severity = severity;
    fireEvent.location = location;
    await fireEvent.save();
    res.json({ message: 'Fire event updated successfully', fireEvent });
  } catch (error) {
    logger.error('Error updating fire event:', error);
    res.status(500).json({ error: 'Failed to update fire event' });
    next(error);
  }
};

/**
 * Deletes an existing fire event
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Object} Message
 */
const deleteFireEvent = async (req, res, next) => {
  const { id } = req.params;
  try {
    const fireEvent = await FireEvent.findByPk(id);
    if (!fireEvent) {
      return res.status(404).json({ error: 'Fire event not found' });
    }
    await fireEvent.destroy();
    res.json({ message: 'Fire event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting fire event:', error);
    res.status(500).json({ error: 'Failed to delete fire event' });
    next(error);
  }
};

// Adds a new fire event
const addFireEvent = async (req, res) => {
  try {
    // Validation
    await Promise.all([
      check('sensorId', 'Sensor ID is required').notEmpty().run(req),
      check('location', 'Location is required').notEmpty().run(req),
      check('status', 'Status is required').notEmpty().run(req),
      check('model', 'Model is required').notEmpty().run(req),
      check('serialNumber', 'Serial Number is required').notEmpty().run(req),
      check('firmwareVersion', 'Firmware Version is required').notEmpty().run(req),
      check('hardwareVersion', 'Hardware Version is required').notEmpty().run(req),
      check('softwareVersion', 'Software Version is required').notEmpty().run(req),
      check('description', 'Description is required').notEmpty().run(req),
      check('manufacturer', 'Manufacturer is required').notEmpty().run(req),
      check('name', 'Name is required').notEmpty().run(req),
      check('type', 'Type is required').notEmpty().run(req),
      check('date', 'Date is required').notEmpty().run(req),
    ]);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Creation of the event
    const {
      sensorId,
      location,
      status,
      model,
      serialNumber,
      firmwareVersion,
      hardwareVersion,
      softwareVersion,
      description,
      manufacturer,
      name,
      type,
      date,
    } = req.body;

    const fireEvent = await FireEvent.create({
      sensorId,
      location,
      status,
      model,
      serialNumber,
      firmwareVersion,
      hardwareVersion,
      softwareVersion,
      description,
      manufacturer,
      name,
      type,
      date,
    });

    res.status(201).json(fireEvent);
  } catch (error) {
    logger.error('Error adding fire event:', error);
    res.status(500).json({ error: 'Failed to add fire event' });
  }
};

// Fetches all active fire incidents
const getActiveFireIncidents = async (req, res, next) => {
  try {
    const activeFires = await FireIncident.findAll({ where: { status: 'active' } });
    res.status(200).json(activeFires);
  } catch (error) {
    next(error);
  }
};

// Updates the status of a fire incident
const updateFireIncidentStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const fireIncident = await FireIncident.findByPk(id);
    if (!fireIncident) {
      return res.status(404).json({ error: 'Fire incident not found' });
    }
    fireIncident.status = status;
    await fireIncident.save();
    res.json(fireIncident);
  } catch (error) {
    next(error);
  }
};

// Automatically assigns drones to detected fires
const assignDronesToFires = async (req, res, next) => {
  try {
    const fires = await FireIncident.findAll({ where: { status: 'active' } });
    const availableDrones = await Drone.findAll({ where: { status: 'active' } });
    for (const fire of fires) {
      const nearestDrone = findNearestDrone(fire.location, availableDrones);
      if (nearestDrone) {
        await assignDroneToFire(nearestDrone, fire);
      }
    }
    res.json({ message: 'Drones assigned successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculates the fire intensity based on various parameters
 * @param {number} temperature - The temperature of the area where the fire is located
 * @param {number} humidity - The humidity of the area where the fire is located
 * @param {number} windSpeed - The wind speed in the area where the fire is located
 * @returns {number} - The estimated fire intensity
 */
function calculateFireIntensity(temperature, humidity, windSpeed) {
  const intensity = temperature * 0.6 + humidity * -0.3 + windSpeed * 0.7;
  return Math.max(0, intensity); // Ensures that the intensity is not negative
}

module.exports = {
  addFireEvent,
  getActiveFireIncidents,
  updateFireIncidentStatus,
  assignDronesToFires,
  getAllFireEvents,
  createFireEvent,
  updateFireEvent,
  deleteFireEvent,
  calculateFireIntensity,
  analyzeFireEventData,
  classifyFireEvent,
  clusterFireEvent,
};

/* In this code, I have created a module to handle fire events in a system.
The module includes various functions to perform operations such as getting, creating, updating, and deleting fire events.
for `analyze FireEvent Data` I created a link with gemini AI.
I also inserted two classification examples both linked to service classificationService,they are just two incomplete examples
getAllFireEvents: This function retrieves all fire events from the database and returns them as a response.
createFireEvent: This function creates a new fire event in the database. Before creating the event,
the code checks that all necessary fields are present in the request. If a field is missing, the function returns an error.
updateFireEvent: This function updates an existing fire event in the database. The function retrieves the event from the database using the ID provided in the request.
If the event does not exist, the function returns an error. Otherwise, the function updates the event's fields with the new values provided in the request and saves the updated event to the database.
deleteFireEvent: This function deletes an existing fire event from the database.
The function retrieves the event from the database using the ID provided in the request. If the event does not exist, the function returns an error.
Otherwise, the function deletes the event from the database.
addFireEvent: This function adds a new fire event to the database. Before adding the event,
the code checks that all necessary fields are present in the request. If a field is missing, the function returns an error. Otherwise,
the function creates a new fire event in the database using the values provided in the request.
getActiveFireIncidents: This function retrieves all active fire incidents from the database and returns them as a response.
updateFireIncidentStatus: This function updates the status of an existing fire incident in the database.
The function retrieves the incident from the database using the ID provided in the request. If the incident does not exist, the function returns an error.
Otherwise, the function updates the incident's status with the new value provided in the request and saves the updated incident to the database.
assignDronesToFires: This function automatically assigns drones to detected fires.
The function retrieves all active fire incidents from the database and all available drones from the database. For each fire incident, the function finds the nearest drone using the findNearestDrone function.
If a drone is available, the function assigns the drone to the fire incident using the assignDroneToFire function.
calculateFireIntensity: This function calculates the intensity of the fire based on various parameters.
The function uses a mathematical formula to calculate the fire intensity based on temperature, humidity, and wind speed.
The function returns the estimated fire intensity.*/
