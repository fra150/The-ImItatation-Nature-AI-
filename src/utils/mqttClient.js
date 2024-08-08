// utils/mqttClient.js
const mqtt = require('mqtt');
const Sensor = require('../models/sensor');
const logger = require('./logger');

// Check if the MQTT broker URL is defined
if (!process.env.MQTT_BROKER_URL) {
  throw new Error('MQTT Broker URL is not defined');
}

// Create an MQTT client and connect to the broker
const client = mqtt.connect(process.env.MQTT_BROKER_URL);

// Handle the connection event to the broker
client.on('connect', () => {
  logger.info('Connected to MQTT Broker');
  client.subscribe('sensors/#', (err) => {
    if (err) {
      logger.error('Unable to subscribe to the sensors topic:', err);
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
    logger.info(`Data received from sensor ${sensor.id}: ${message.toString()}`);

    // Fire detection logic (example)
    if (sensor.type === 'thermal' && data.temperature > 60) {
      // Temperature above 60°C, possible fire
      logger.warn(`Possible fire detected by sensor ${sensor.id}`);
      // Implement fire event handling logic here
    }
  } catch (error) {
    // Handle network or connection errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      logger.error('Unable to connect to MQTT Broker');
      return;
    }

    // Throw a generic error
    logger.error('Error during MQTT message processing:', error);
  }
});

// Function to subscribe to a topic - to be improved
const subscribeToTopic = (topic) => {
  client.subscribe(topic, (err) => {
    if (err) {
      logger.error(`Error during subscription to topic ${topic}:`, err);
    } else {
      logger.info(`Successfully subscribed to topic ${topic}`);
    }
  });
};

// Function to publish a message to a topic
const publishMessage = (topic, message) => {
  if (!client.connected) {
    logger.warn('Unable to publish. MQTT client is not connected.');
    return;
  }
  client.publish(topic, message, { qos: 1 }, (err) => {
    // Set QoS to 1 for "at least once"
    if (err) {
      logger.error(`Error during publishing to topic ${topic}:`, err);
    } else {
      logger.info(`Message published to topic ${topic}: ${message}`);
    }
  });
};

// Export the MQTT client
module.exports = {
  client,
  subscribeToTopic,
  publishMessage,
};

/* In This code JavaScript  is a module that interacts with an MQTT (Message Queuing Telemetry Transport) broker to handle sensor data. It uses the 'mqtt' library to create an MQTT client and connect to the broker. The sensor data model is imported from '../models/sensor', and a logger is imported from './logger' for logging events and errors.
When the code runs, it first checks if the MQTT broker URL is defined in the environment variables. If it's not, it throws an error. If the URL is defined, the code creates an MQTT client and connects to the broker.
Upon connecting to the broker, the code subscribes to the 'sensors/#' topic. This means it will receive messages from any topic that starts with 'sensors/'. If there's an error during the subscription, it logs the error.
The code then sets up an event listener for incoming MQTT messages. When a message is received, the code checks if the message is a non-empty string. If it's not, it logs an error and returns. If the message is valid, the code parses the message as JSON and finds the corresponding sensor in the database using the sensor ID from the message.
If the sensor is not found in the database, the code logs an error and returns. If the sensor is found, the code logs the received data and checks if it's a thermal sensor and if the temperature is above 60°C. If both conditions are true, it logs a warning about a possible fire detection.
The code also includes error handling for network or connection errors. If the code is unable to connect to the MQTT broker, it logs an error. For other errors during message processing, it logs the error as well.
Additionally, the code exports a function to subscribe to a specific topic and a function to publish a message to a specific topic. The publish function checks if the MQTT client is connected before publishing the message. If the client is not connected, it logs a warning and returns. The publish function also sets the Quality of Service (QoS) to 1, which means the message will be delivered at least once. */
