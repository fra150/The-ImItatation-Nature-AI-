const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const droneController = require('../controllers/droneController');
const multer = require('multer');
const path = require('path');
const validate = require('../middleware/validator');

// Handling multer and upload
const upload = multer({ dest: path.join(__dirname, '../uploads/') });

// Middleware for handling requests
router.use(express.json());

// For handling images
router.post('/upload', upload.single('image'), droneController.uploadDroneImage);

// Middleware for handling errors
router.use((req, res, next) => {
  // Middleware logic here
  next();
});

// Routes for managing drones
router.get('/drones', droneController.getAllDrones); // to be inserted later
router.post('/drones', droneController.validateDroneData, droneController.createDrone);
router.put('/drones/:id', droneController.validateDroneData, droneController.updateDrone);
router.delete('/drones/:id', droneController.deleteDrone);

// Routes for assigning and monitoring drones
router.post('/assign-drones', droneController.assignDronesToFires);
router.put('/drones/:id/status', droneController.updateDroneStatus);

// Routes for real-time data and intervention
router.get('/drones/:droneId/realtime', droneController.getRealtimeData);
router.post('/drones/:droneId/release-agent', droneController.releaseExtinguishingAgent);

// Routes for flight planning
router.post('/drones/:droneId/plan-route', droneController.planFlightRoute);

// Routes for data analysis
router.post('/analyze-data', droneController.analyzeData);

// Routes for managing fires
router.get('/fires', droneController.getAllFires);
router.post('/fires', droneController.createFire);
router.put('/fires/:id', droneController.updateFire);
router.delete('/fires/:id', droneController.deleteFire);

//Routers for analyzeDroneData
router.get('/analyze/:id', analyzeDroneData);

module.exports = router;

/* I have setting up a router for an Express.js application that manages drones and fires. The router handles various HTTP requests related to drone operations, fire management, data analysis, and real-time data.
First, I import the necessary modules and dependencies, including Express, the Express-Validator for input validation, Multer for handling file uploads, and my custom droneController for handling the business logic.
I then configure Multer to handle image uploads and set up a middleware to parse JSON data in the request body.
The router defines several routes for different functionalities:
1. Uploading drone images: This route accepts POST requests with an image file and calls the `uploadDroneImage` function from the droneController.
2. Managing drones: There are routes for getting all drones, creating a new drone, updating an existing drone, and deleting a drone. Each route calls the corresponding function from the droneController.
3. Assigning and monitoring drones: There are routes for assigning drones to fires and updating the status of a drone.
4. Real-time data and intervention: There are routes for getting real-time data from a drone and releasing an extinguishing agent.
5. Flight planning: There is a route for planning a flight route for a drone.
6. Data analysis: There is a route for analyzing data.
7. Managing fires: There are routes for getting all fires, creating a new fire, updating an existing fire, and deleting a fire.
8. Analyzing drone data: There is a route for analyzing drone data.
Finally, I export the router so it can be used in the main application. */
