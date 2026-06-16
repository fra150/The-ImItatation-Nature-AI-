// utils/mqttClient.js
const mqtt = require('mqtt');
const Sensor = require('../models/sensor');
const logger = require('./logger').logger || require('./logger');

// MQTT broker URL — può essere undefined (graceful fallback)
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL;

if (!MQTT_BROKER_URL) {
  logger.warn('MQTT_BROKER_URL not set. MQTT client will not connect.');
}

// Create an MQTT client and connect to the broker (solo se configurato)
const client = MQTT_BROKER_URL
  ? mqtt.connect(MQTT_BROKER_URL, {
      reconnectPeriod: 10000,
      connectTimeout: 30000,
    })
  : null;

// Solo procedi con gli event listener se il client è stato creato
if (client) {
  client.on('connect', () => {
    logger.info('Connected to MQTT Broker');
    client.subscribe('sensors/#', (err) => {
      if (err) {
        logger.error('Unable to subscribe to the sensors topic:', err);
      }
    });
  });

  client.on('error', (err) => {
    logger.error('MQTT client error:', err.message);
  });

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
}

// Function to subscribe to a topic
const subscribeToTopic = (topic) => {
  if (!client || !client.connected) {
    logger.warn('Unable to subscribe. MQTT client is not connected.');
    return;
  }
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
  if (!client || !client.connected) {
    logger.warn('Unable to publish. MQTT client is not connected.');
    return;
  }
  client.publish(topic, message, { qos: 1 }, (err) => {
    if (err) {
      logger.error(`Error during publishing to topic ${topic}:`, err);
    } else {
      logger.info(`Message published to topic ${topic}: ${message}`);
    }
  });
};

// Export the MQTT utilities
module.exports = {
  client,
  subscribeToTopic,
  publishMessage,
};
