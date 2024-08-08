const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const fireEventController = require('../controllers/fireEventController');
const validate = require('../middleware/validator');

// Register FireEvent routes
router.post(
  '/',
  validate([
    check('sensorId').notEmpty().withMessage('Sensor ID is required'),
    check('location').notEmpty().withMessage('Location is required'),
    check('status').notEmpty().withMessage('Status is required'),
    check('model').notEmpty().withMessage('Model is required'),
    check('serialNumber').notEmpty().withMessage('Serial Number is required'),
    check('date').notEmpty().withMessage('Date is required'),
    check('name').notEmpty().withMessage('Name is required'),
    check('description').notEmpty().withMessage('Description is required'),
    check('type').notEmpty().withMessage('Type is required'),
    check('softwareVersion').notEmpty().withMessage('Software Version is required'),
    check('hardwareVersion').notEmpty().withMessage('Hardware Version is required'),
    check('firmwareVersion').notEmpty().withMessage('Firmware Version is required'),
  ]),
  fireEventController.addFireEvent,
);

// Register FireEvent routes
router.get('/', fireEventController.getAllFireEvents);
router.post('/', fireEventController.createFireEvent);
router.put('/:id', fireEventController.updateFireEvent);
router.delete('/:id', fireEventController.deleteFireEvent);
module.exports = router;

/* This code sets up an Express router for handling HTTP requests related to fire events. The Express framework is used for building web applications and APIs in Node.js. The router is used to define routes for different HTTP methods (GET, POST, PUT, DELETE) and associate them with the corresponding controller functions.
First, the Express module is imported, and an instance of the Express router is created. The 'express-validator' module is also imported to validate the data sent in the request body. The 'fireEventController' module contains the functions that handle the fire event operations.
A POST route is defined for adding a new fire event. The 'validate' middleware function is used to validate the data sent in the request body. The 'validate' function takes an array of validation checks as arguments. Each check specifies a field in the request body and a validation rule. If the validation rule fails, an error message is added to the 'errors' array. If there are no errors, the 'addFireEvent' function from the 'fireEventController' module is called to handle the request.
Four additional routes are defined for retrieving all fire events, creating a new fire event, updating an existing fire event, and deleting a fire event. Each route is associated with a corresponding function from the 'fireEventController' module.
Finally, the router is exported so that it can be used in other parts of the application.
Overall, this code sets up a RESTful API for managing fire events, with endpoints for creating, retrieving, updating, and deleting fire events. The 'express-validator' middleware is used to validate the data sent in the request body, ensuring that the required fields are present and that they meet the specified validation rules. */
