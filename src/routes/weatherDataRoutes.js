const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const weatherDataController = require('../controllers/weatherDataController');

// Route to get weather data
router.get(
  '/data',
  [
    check('startDate').optional().isDate().toDate(), // Start date (optional)
    check('endDate').optional().isDate().toDate(), // End date (optional)
  ],
  weatherDataController.getWeatherData,
);

// Route to visualize weather data on the map
router.get('/visualize', weatherDataController.visualizeWeatherData);

// Route to insert weather data (all fields are interchangeable)
router.post(
  '/data',
  [
    check('date').isDate().toDate(),
    check('mean_2m_air_temperature').isFloat({ min: -50, max: 50 }), // Using a realistic temperature range
    check('total_precipitation').isFloat({ min: 0 }), // Non-negative precipitation
    check('dewpoint_2m_temperature').isFloat({ min: -50, max: 50 }), // Realistic temperature range
    check('mean_sea_level_pressure').isFloat({ min: 950, max: 1050 }), // Realistic pressure range
    check('surface_pressure').isFloat({ min: 950, max: 1050 }), // Realistic pressure range
    check('u_component_of_wind_10m').isFloat(),
    check('v_component_of_wind_10m').isFloat(), // Added V component of wind
  ],
  (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next(); // If no errors, proceed to the controller
  },
  weatherDataController.insertWeatherData,
);

// Route to update weather data (all fields are interchangeable)
router.put(
  '/data/',
  [
    check('date').optional().isDate().toDate(),
    check('mean_2m_air_temperature').optional().isFloat({ min: -50, max: 50 }),
    check('total_precipitation').optional().isFloat({ min: 0 }),
    check('dewpoint_2m_temperature').optional().isFloat({ min: -50, max: 50 }),
    check('mean_sea_level_pressure').optional().isFloat({ min: 950, max: 1050 }),
    check('surface_pressure').optional().isFloat({ min: 950, max: 1050 }),
    check('u_component_of_wind_10m').optional().isFloat(),
    check('v_component_of_wind_10m').optional().isFloat(),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  weatherDataController.updateWeatherData,
);

// Route to delete weather data
router.delete('/data/', weatherDataController.deleteWeatherData);

// Route to get wind speed data
router.get('/wind-speed', weatherDataController.getWindSpeedData); // to get wind speed data

// Route to visualize weather data on the map
router.get('/visualize', weatherDataController.visualizeWeatherData);

// Export routes for use in other modules
module.exports = router;

/* I'm creating a weather data management system using Express.js . Into this code sets up various routes for handling weather data operations.
First, I import the necessary modules and controllers. The Express.js framework is used to create the server, and the express-validator library is used for data validation.
The first route is for retrieving weather data. It accepts optional query parameters for a start date and an end date. If provided, the data returned will be within this date range. The data validation checks ensure that the dates are in a valid format.
The next route is for visualizing weather data on a map. This route doesn't require any specific data validation as it's primarily used for displaying data.
The third route is for inserting new weather data. It requires several fields such as date, mean 2m air temperature, total precipitation, dewpoint 2m temperature, mean sea level pressure, surface pressure, and the U and V components of wind at 10m. Each field has specific validation rules to ensure the data is accurate and within reasonable ranges.
The fourth route is for updating existing weather data. Similar to the insert route, it accepts several fields, but all are optional. This means that only the fields provided in the request body will be updated.
The fifth route is for deleting weather data.
The sixth route is for retrieving wind speed data.
Finally, the last route is for visualizing weather data on a map, which is a duplicate of the second route.
All the routes are exported for use in other modules of the application. */