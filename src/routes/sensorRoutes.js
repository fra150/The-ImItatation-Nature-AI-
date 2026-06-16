const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const validate = require('../middleware/validator');

router.post(
  '/',
  validate([
    check('name').notEmpty().withMessage('Name is required'),
    check('type').notEmpty().withMessage('Type is required'),
    check('location').notEmpty().withMessage('Location is required'),
    check('status').notEmpty().withMessage('Status is required'),
    check('softwareVersion').notEmpty().withMessage('Software version is required'),
    check('firmwareVersion').notEmpty().withMessage('Firmware version is required'),
    check('hardwareVersion').notEmpty().withMessage('Hardware version is required'),
    check('manufacturer').notEmpty().withMessage('Manufacturer is required'),
    check('model').notEmpty().withMessage('Model is required'),
    check('serialNumber').notEmpty().withMessage('Serial number is required'),
    check('description').notEmpty().withMessage('Description is required'),
  ]),
  sensorController.addSensor,
);
// Register sensor routes
router.get('/', sensorController.getAllSensors);
router.get('/:type', sensorController.getSensorsByType); // Per recuperare i sensori in base al tipo
router.post('/', sensorController.validateSensorData, sensorController.createSensor);
router.put('/:id', sensorController.validateSensorData, sensorController.updateSensor);
router.delete('/:id', sensorController.deleteSensor);
router.use(sensorController.errorHandler); // Con questo registro il middleware per la gestione centralizzata degli errori

module.exports = router;

/* In this code, I'm decided  up a router for an Express.js application to handle various sensor-related routes. I'm importing the necessary modules and dependencies, including Express.js, express-validator for input validation, and the sensor controller that contains the logic for handling sensor-related operations.
I've defined a POST route for adding a new sensor. This route includes middleware for validating the sensor data. The validation checks ensure that all required fields, such as name, type, location, status, software version, firmware version, hardware version, manufacturer, model, serial number, and description, are not empty. If any of these fields are missing, an error message will be returned.
I've also defined other routes for retrieving all sensors, getting sensors by type, creating a new sensor, updating an existing sensor, and deleting a sensor. Each of these routes is associated with a corresponding function in the sensor controller.
Finally, I've registered a middleware for handling errors that may occur during sensor-related operations. This middleware is called at the end of the sensor controller's functions and is responsible for sending an appropriate error response to the client.
Overall, this code sets up a router for handling sensor-related operations in an Express.js application, including input validation and error handling. */
