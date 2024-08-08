const { createClient } = require('@google/maps');
const util = require('util');
const logger = require('winston');

// Winston logger configuration with logging levels
const logger = winston.createLogger({
  level: 'info', // Set the logging level to 'info'
  format: winston.format.json(), // Format logs in JSON format
  transports: [
    new winston.transports.Console(), // Send logs to the console
  ],
});

// Using an environment variable for the Google Maps API key
const googleMapsClient = createClient({
  key: process.env.GOOGLE_MAPS_API_KEY,
  Promise: Promise,
});

// Function to get the geocode of an address
const getGeocode = async (address) => {
  // Validation: check if the address is provided
  if (!address) {
    logger.error('No address provided'); // Log the error
    return Promise.reject(new Error('Address not provided')); // Reject the promise with an error
  }

  try {
    // Make a geocoding request to the Google Maps API
    const response = await googleMapsClient.geocode({ address });
    // Using destructuring to directly access the results
    const {
      json: { results },
    } = response;
    // Optional: return only the first result, if present
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    // If there is an error, log it with details
    logger.error('Error during geocoding: %s', util.inspect(error));
    // Reject the promise with a generic error message
    return Promise.reject(new Error('Error during geocoding'));
  }
};

// Export the getGeocode function for use in other modules
module.exports = {
  getGeocode,
};

/*  I've created a Node.js module that interacts with the Google Maps API to retrieve the geocode (latitude and longitude) of a given address. To do this, I've used the `@google/maps` library to create a client that can make requests to the Google Maps API.
I've also set up a logger using the Winston library to log errors and information during the geocoding process. The logger is configured to log messages at the 'info' level and to format logs in JSON format.
The main function of this module is the `getGeocode` function, which takes an address as an argument. It first checks if the address is provided, and if not, it logs an error and rejects the promise with an error message.
If the address is provided, the function makes a geocoding request to the Google Maps API using the `googleMapsClient.geocode` method. This method returns a promise that resolves to the API response.
I've used destructuring to extract the `results` array from the API response, which contains the geocode information for the address. If there are any results, the function returns the first one. If there are no results, it returns `null`.
If there is an error during the geocoding process, the function logs the error using the logger and rejects the promise with a generic error message.
Finally, I've exported the `getGeocode` function so that it can be used in other modules. */
