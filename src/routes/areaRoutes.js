// Routes to be added still.
const express = require('express');
const router = express.Router();

const {
  validateAreaData,
  createArea,
  getAllAreas,
  getArea,
  updateArea,
  deleteArea,
  monitorArea,
  monitorAreaai,
} = require('../controllers/areaController');

// Create a new area
router.post('/areas', validateAreaData, createArea);

// Get all areas
router.get('/areas', getAllAreas);

// Get a specific area
router.get('/areas/:id', getArea);

// Update an existing area
router.put('/areas/:id', validateAreaData, updateArea);

// Delete an area
router.delete('/areas/:id', deleteArea);

// Monitor an area in real-time
router.get('/areas/:id/monitor', monitorArea);

// Monitor an area using AI
router.get('/areas/:id/monitor-ai', monitorAreaai);

module.exports = router;

/*
In this code, I have created a router for the Express.js application. This router handles HTTP requests related to areas. Here are the steps I followed:
1. I imported the Express module and created a router object using `express.Router()`.
2. I imported the necessary functions from the `areaController` controller. These functions were used to handle the different HTTP requests related to areas.
3. I defined the routes for the application. Each route is associated with a specific function from the `areaController`.
4. I created a POST route for `/areas` that validates the area data using the `validateAreaData` function and then creates a new area using the `createArea` function.
5. I created a GET route for `/areas` that returns all areas using the `getAllAreas` function.
6. I created a GET route for `/areas/:id` that returns a specific area using the `getArea` function.
7. I created a PUT route for `/areas/:id` that validates the area data using the `validateAreaData` function and then updates the existing area using the `updateArea` function.
8. I created a DELETE route for `/areas/:id` that deletes an area using the `deleteArea` function.
9. I created a GET route for `/areas/:id/monitor` that monitors an area in real-time using the `monitorArea` function.
10. I created a GET route for `/areas/:id/monitor-ai` that monitors an area using AI using the `monitorAreaai` function.
11. Finally, I exported the router so that it can be used in the Express.js application.
*/
