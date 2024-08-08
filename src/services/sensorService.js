const mqtt = require('mqtt');
const Sensor = require('../models/sensor');
const logger = require('../utils/logger');

// Check if the MQTT broker URL is defined
if (!process.env.MQTT_BROKER_URL) {
  throw new Error('MQTT broker URL is not defined');
}

// Create an MQTT client and connect to the broker
const client = mqtt.connect(process.env.MQTT_BROKER_URL);

// Handle the connection event to the broker
client.on('connect', () => {
  logger.info('Connected to MQTT broker');
  client.subscribe('sensors/#', (err) => {
    if (err) {
      logger.error('Failed to subscribe to sensors topic:', err);
    }
  });
});

// Handle the event of receiving an MQTT message
client.on('message', async (topic, message) => {
  // Check if the message is a non-empty string
  if (typeof message !== 'string' || message.trim() === '') {
    logger.error('Invalid MQTT message');
    return;
  }

  try {
    // Parse the MQTT message
    const data = JSON.parse(message.toString());

    // Find the corresponding sensor in the database
    const sensor = await Sensor.findOne({ where: { id: data.sensorId } });

    // Check if the sensor is valid
    if (!sensor) {
      logger.error(`Sensor with ID ${data.sensorId} not found`);
      return;
    }

    // Process sensor data
    logger.info(`Received data from sensor ${sensor.id}: ${message.toString()}`);
    // Implement fire detection logic here
  } catch (error) {
    // Handle network or connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      logger.error('Failed to connect to MQTT broker');
      return;
    }

    // Throw a generic error
    logger.error('Error processing MQTT message:', error);
  }
});

// Export the MQTT client
module.exports = {
  client,
};

/* I've written a Node.js script that uses the MQTT (Message Queuing Telemetry Transport) protocol to communicate with a broker. This script is designed to interact with a database of sensors and process data received from those sensors.
First, I've imported the necessary modules: 'mqtt' for handling MQTT communication, a 'Sensor' model for database operations, and a 'logger' for logging messages.
I've then checked if the MQTT broker URL is defined in the environment variables. If it's not, the script throws an error.
Next, I've created an MQTT client and connected it to the broker using the provided URL. When the client successfully connects to the broker, it logs a message and subscribes to the 'sensors/#' topic. If there's an error during the subscription, it's logged.
The script listens for incoming MQTT messages on the subscribed topic. When a message is received, it checks if the message is a non-empty string. If it's not, an error message is logged.
If the message is valid, the script parses it and looks up the corresponding sensor in the database using the sensor ID from the message. If the sensor is not found, an error message is logged.
If the sensor is found, the script logs a message with the received data and then processes the sensor data. This is where you would implement the logic for fire detection, which is currently commented out.
If there's an error during the processing of the MQTT message, the script checks if it's a network or connection error. If it is, an error message is logged. If it's not, a generic error message is logged.
Finally, the script exports the MQTT client so that it can be used by other parts of the application.  */
