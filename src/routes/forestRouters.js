const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const forestController = require('../controllers/forestController');
const forestService = require('../services/forestService');

router.get('/chart/forestChange', async (req, res) => {
  try {
    const chartData = await forestService.generateChartData();
    const chartBuffer = await forestService.createChart(chartData);
    res.setHeader('Content-Type', 'image/png');
    res.send(chartBuffer);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/forestChange', async (req, res) => {
  try {
    const data = await forestService.getForestChangeData();
    res.json(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/visualizeForestChange', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await forestService.getForestChangeData();
    forestService.visualizeForestChangeData(data);
    res.status(200).send('Forest change data visualized on map successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get(
  '/data',
  [check('startDate').optional().isISO8601(), check('endDate').optional().isISO8601()],
  forestController.getForestData,
);

router.post(
  '/data',
  [
    check('treeCover2000').isInt({ min: 0, max: 100 }),
    check('loss').isBoolean(),
    check('gain').isBoolean(),
    check('lossYear').isInt({ min: 0, max: 12 }),
    check('firstB30').isInt({ min: 0, max: 255 }),
    check('firstB40').isInt({ min: 0, max: 255 }),
    check('firstB50').isInt({ min: 0, max: 255 }),
    check('firstB70').isInt({ min: 0, max: 255 }),
    check('lastB30').isInt({ min: 0, max: 255 }),
    check('lastB40').isInt({ min: 0, max: 255 }),
    check('lastB50').isInt({ min: 0, max: 255 }),
    check('lastB70').isInt({ min: 0, max: 255 }),
    check('dataMask').isInt({ min: 0, max: 2 }),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
  forestController.insertForestData,
);

module.exports = router;

/*In this code, I have created up an Express.js router for handling various HTTP requests related to forest data
At the beginning decided , I import the necessary modules and dependencies, including Express, express-validator for input validation, and my forestController and forestService modules.
The router has several endpoints:
1. `/chart/forestChange`: When a GET request is made to this endpoint, it generates a chart of forest change data using the forestService. The chart is then sent as a PNG image in the response. If any error occurs during this process, it sends a 500 status code with the error message.
2. `/forestChange`: This endpoint returns JSON data about forest change when a GET request is made. It uses the forestService to fetch this data. If there's an error, it sends a 500 status code with the error message.
3. `/visualizeForestChange`: When a GET request is made to this endpoint, it fetches forest change data and visualizes it on a map using the forestService. It then sends a 200 status code with a success message. If there's an error, it sends a 500 status code with the error message.
4. `/data`: This endpoint handles both GET and POST requests. For GET requests, it validates optional query parameters 'startDate' and 'endDate' to ensure they're in ISO8601 format. It then calls the getForestData function from the forestController. For POST requests, it validates several fields in the request body and calls the insertForestData function from the forestController if the validation passes. If the validation fails, it sends a 400 status code with the validation errors.
Finally, the router is exported to be used in the main application. */
