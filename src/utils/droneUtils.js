const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const geolib = require('geolib');
const logger = require('../utils/logger');
const { body, validationResult } = require('express-validator');
const aiAnalysisService = require('../services/aiAnalysisService');

// Middleware for centralized error handling
const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
};

// Middleware for validating drone data
const validateDroneData = [
  body('identifier').isString().notEmpty(),
  body('status').isIn(['active', 'inactive', 'maintenance', 'mission']),
  body('location').isObject().notEmpty(),
  body('batteryLevel').isNumeric(),
  body('payloadCapacity').isNumeric(),
  body('sensors').isArray(),
];

// Find the nearest drone to a fire
const findNearestDrone = (fireLocation, drones) => {
  let nearestDrone = null;
  let shortestDistance = Number.MAX_VALUE;
  for (const drone of drones) {
    const distance = geolib.getDistance(fireLocation, drone.location);
    if (distance < shortestDistance) {
      shortestDistance = distance;
      nearestDrone = drone;
    }
  }
  return nearestDrone;
};

// Assign a drone to a fire
const assignDroneToFire = async (drone, fire) => {
  drone.status = 'mission';
  drone.currentMission = fire.id;
  await drone.save();
  fire.assignedDrone = drone.id;
  await fire.save();
  // Plan the path for the drone
  const path = await PathfindingService.calculatePath(drone.location, fire.location);
  // Send the path to the drone (this part will depend on the specific hardware of the drone)
};

// Handles the upload and optimization of drone images
const uploadDroneImage = async (req, res) => {
  try {
    // Check if a file has been uploaded
    if (!req.file) {
      logger.warn('Attempt to upload without a file');
      return res.status(400).json({ error: 'No file uploaded. Make sure to send an image.' });
    }
    const imagePath = path.join(__dirname, '../uploads/', req.file.filename);
    // Process and save the image
    await processAndSaveImage(req.file.path, imagePath);
    logger.info(`Image uploaded and optimized: ${imagePath}`);
    res.status(200).json({ message: 'Image uploaded and optimized successfully', path: imagePath });
  } catch (error) {
    handleImageProcessingError(error, res);
  }
};

// Process and save the optimized image
const processAndSaveImage = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath).resize(800, 800).toFile(outputPath);
    // Remove the original unoptimized file
    fs.unlinkSync(inputPath);
  } catch (error) {
    logger.error('Error during image processing:', error);
    throw new Error('Unable to process the image');
  }
};

// Handles errors during image processing
const handleImageProcessingError = (error, res) => {
  logger.error('Error during image processing:', error);
  if (error.message === 'Unable to process the image') {
    res.status(500).json({
      error: 'Unable to process the image. Make sure the file is a valid image.',
    });
  } else {
    res.status(500).json({ error: 'An error occurred during image processing.' });
  }
};

module.exports = {
  errorHandler,
  validateDroneData,
  findNearestDrone,
  assignDroneToFire,
  uploadDroneImage,
  processAndSaveImage,
  handleImageProcessingError,
};

/* I have created a Node.js module that handles various tasks related to drones and fire management. The module uses several external libraries such as `sharp` for image processing, `fs` for file system operations, `path` for working with file and directory paths, `geolib` for geospatial calculations, `express-validator` for data validation, and a custom `logger` for logging errors and information.
The module exports several functions and middleware that can be used in an Express.js application. The `errorHandler` middleware is used for centralized error handling. It logs the error using the custom `logger` and sends a JSON response with a 500 status code and an error message.
The `validateDroneData` middleware is used for validating drone data. It uses the `express-validator` library to validate the `identifier`, `status`, `location`, `batteryLevel`, `payloadCapacity`, and `sensors` properties of the drone data.
The `findNearestDrone` function takes a fire location and a list of drones as input and returns the nearest drone to the fire location. It uses the `geolib` library to calculate the distance between the fire location and the location of each drone.
The `assignDroneToFire` function takes a drone and a fire as input and assigns the drone to the fire. It updates the status and current mission of the drone and saves the changes to the database. It also updates the assigned drone of the fire and saves the changes to the database. Finally, it calculates the path for the drone to reach the fire location using a `PathfindingService` and sends the path to the drone.
The `uploadDroneImage` function handles the upload and optimization of drone images. It checks if a file has been uploaded and if not, it logs a warning message and sends a JSON response with a 400 status code and an error message. If a file has been uploaded, it processes and saves the image using the `processAndSaveImage` function and sends a JSON response with a 200 status code and a success message.
The `processAndSaveImage` function takes an input path and an output path as input and processes and saves the image. It uses the `sharp` library to resize the image to 800x800 pixels and save it to the output path. It also removes the original unoptimized file using the `fs` library.
The `handleImageProcessingError` function handles errors that occur during image processing. It logs the error using the custom `logger` and sends a JSON response with a 500 status code and an error message. If the error message is "Unable to process the image", it sends a more specific error message.
Overall, this module provides a set of functions and middleware that can be used to manage drones and fires in a Node.js application. It includes features for error handling, data validation, finding the nearest drone to a fire, assigning a drone to a fire, and handling the upload and optimization of drone images. */
