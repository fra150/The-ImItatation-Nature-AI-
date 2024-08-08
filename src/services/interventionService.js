// src/services/interventionService.js
const FireEvent = require('../models/fireEvent');
const { sendDroneCommands } = require('./droneControlService');
const { startChatSession } = require('./geminiService');
const { Client } = require('@googlemaps/google-maps-services-js');
const winston = require('winston');

// Constants
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

/**
 * Plans intervention for a fire event using available drones
 * @param {FireEvent} fireEvent - The fire event object
 * @returns {Promise<void>}
 */
const planIntervention = async (fireEvent) => {
  try {
    const availableDrones = await fetchAvailableDrones();
    const droneAssignments = assignDrones(fireEvent, availableDrones);

    for (const assignment of droneAssignments) {
      const { drone, task } = assignment;
      const route = await planRoute(fireEvent.location, drone);
      await sendDroneCommands(drone, task, route);
    }

    const interventionMessage = `Planning intervention for fire at ${
      fireEvent.location
    } with assigned drones: ${JSON.stringify(droneAssignments)}.`;
    const geminiInterventionReport = await startChatSession(interventionMessage);

    logger.info('Gemini AI Intervention Report:', geminiInterventionReport);
  } catch (error) {
    logger.error('Error planning intervention:', error);
    throw error; // Re-throw the error for higher-level error handling
  }
};

/**
 * Fetches available drones from the management system
 * @returns {Promise<Array>} Array of available drones
 */
const fetchAvailableDrones = async () => {
  try {
    // Fetch available drones from a database or drone management system
    // Replace with actual implementation
    return [
      { id: 1, type: 'water', location: '40.7128,-74.0060' },
      { id: 2, type: 'surveillance', location: '40.7129,-74.0061' },
    ];
  } catch (error) {
    logger.error('Error fetching available drones:', error);
    throw error;
  }
};

/**
 * Assigns drones to tasks based on fire event data and drone capabilities
 * @param {FireEvent} fireEvent - The fire event object
 * @param {Array} availableDrones - Array of available drones
 * @returns {Array} Array of drone assignments
 */
const assignDrones = (fireEvent, availableDrones) => {
  try {
    // Implement logic to assign drones to tasks based on fire event data and drone capabilities
    // Replace with actual implementation
    return availableDrones.map((drone) => ({
      drone,
      task: drone.type === 'water' ? 'extinguish' : 'monitor',
    }));
  } catch (error) {
    logger.error('Error assigning drones:', error);
    throw error;
  }
};

/**
 * Plans route for a drone to the fire location
 * @param {string} destination - The fire location
 * @param {Object} drone - The drone object
 * @returns {Promise<string>} The planned route as an encoded polyline
 */
const planRoute = async (destination, drone) => {
  try {
    const response = await googleMapsClient.directions({
      params: {
        origin: drone.location,
        destination: destination,
        mode: 'driving',
        key: GOOGLE_MAPS_API_KEY,
      },
    });

    return response.data.routes[0].overview_polyline.points;
  } catch (error) {
    logger.error('Error planning route:', error);
    throw error;
  }
};

module.exports = {
  planIntervention,
  fetchAvailableDrones,
  assignDrones,
  planRoute,
};

/* This code starts by importing the necessary modules and initializing the Google Maps client and a logger. The Google Maps client is used to plan routes for the drones, and the logger is used to log information and errors.
The main function of the service is planIntervention, which takes a fireEvent object as an argument. This function is responsible for planning the intervention by fetching available drones, assigning them to tasks, planning routes for the drones, sending commands to the drones, and generating a report using Gemini AI.
The fetchAvailableDrones function is used to retrieve a list of available drones from the management system. In the current implementation, this function returns a hardcoded array of drones, but in a real-world scenario, this function would fetch the data from a database or a drone management system.
The assignDrones function is responsible for assigning drones to tasks based on the fire event data and the drone capabilities. In the current implementation, this function assigns each drone to either the 'extinguish' or 'monitor' task based on its type.
The planRoute function is used to plan a route for a drone to the fire location. This function uses the Google Maps Directions API to calculate the route and returns the route as an encoded polyline.
Finally, the planIntervention function sends commands to the drones using the sendDroneCommands function and generates a report using the startChatSession function from the Gemini service. The report is then logged using the logger.
If any errors occur during the intervention planning process, they are logged using the logger and re-thrown for higher-level error handling. */
