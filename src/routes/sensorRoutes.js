const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
const { validate } = require('../middleware/validator');

// Crea un nuovo sensore (con validazione dell'input)
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
  sensorController.createSensor,
);

router.get('/', sensorController.getAllSensors);
router.get('/:type', sensorController.getSensorsByType); // Recupera i sensori per tipo
router.put('/:id', sensorController.updateSensor);
router.delete('/:id', sensorController.deleteSensor);

module.exports = router;
