// src/services/fireDetectionService.js

const mqtt = require('mqtt');
const redis = require('redis');
const { startChatSession } = require('./geminiService');
const { sendNotification } = require('./notificationService');
const FireEvent = require('../models/fireEvent');
const tf = require('@tensorflow/tfjs-node');
const winston = require('winston'); // More robust logger
const config = require('../config/fireDetection'); // Configuration file
const logger = require('../utils/logger');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// To train the AI
const model = await tf.loadGraphModel('models/ai_model/model.json');

// Initialize MQTT client with configuration
const client = mqtt.connect(config.mqttBroker);

// Initialize Redis client with configuration
const redisClient = redis.createClient(config.redisOptions);

/**
 * Connect to MQTT broker and subscribe to sensor topics
 */
client.on('connect', () => {
  client.subscribe(config.sensorTopics);
  logger.info('Connected to MQTT broker and subscribed to sensor topics');
});

/**
 * Handle incoming MQTT messages
 */
client.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    logger.debug(`Sensor data received: ${JSON.stringify(data)}`);
    const fireDetected = await analyzeData(data);
    if (fireDetected) {
      await handleFireDetection(data);
    }
  } catch (error) {
    logger.error('Error processing sensor data:', error);
  }
});

/**
 * Analyze sensor data to detect fire
 * @param {Object} data - Sensor data
 * @returns {Promise<boolean>} - True if fire is detected, otherwise False
 */
async function analyzeData(data) {
  try {
    const lidarData = await getLidarData();
    const environmentalData = await getEnvironmentalData();
    const combinedData = { ...data, lidarData, environmentalData };

    const fireDetected = await runFireDetectionModel(combinedData);
    return fireDetected;
  } catch (error) {
    logger.error('Error analyzing data:', error);
    return false;
  }
}

/**
 * Retrieve recent LiDAR data from Redis
 * @returns {Promise<Array>} - Array of LiDAR data
 */
async function getLidarData() {
  return new Promise((resolve, reject) => {
    redisClient.lrange('lidar_data', -config.lidarDataPoints, -1, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.map(JSON.parse));
      }
    });
  });
}

/**
 * Retrieve environmental data from Redis
 * @returns {Promise<Object>} - Object containing environmental data
 */
async function getEnvironmentalData() {
  return new Promise((resolve, reject) => {
    redisClient.hgetall('environmental_data', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

/**
 * Create a new fire event in the database
 * @param {Object} data - Fire event data
 * @returns {Promise<Object>} - Created FireEvent object
 */
async function createFireEvent(data) {
  try {
    const fireEvent = new FireEvent({
      location: data.location,
      severity: calculateFireSeverity(data),
      timestamp: new Date(),
      sensorData: data,
    });
    await fireEvent.save();
    logger.info(`Fire event created: ${fireEvent._id}`);
    return fireEvent;
  } catch (error) {
    logger.error('Error creating fire event:', error);
    throw error;
  }
}

// Update the status of a fire event in the database
async function updateFireEvent(id, status) {
  try {
    const fireEvent = await FireEvent.findById(id);
    if (!fireEvent) {
      throw new Error(`Fire event with ID ${id} not found`);
    }
    fireEvent.status = status;
    await fireEvent.save();
    logger.info(`Fire event updated: ${fireEvent._id}`);
    return fireEvent;
  } catch (error) {
    logger.error('Error updating fire event:', error);
    throw error;
  }
}

// Update the status of a sensor in the database
async function updateSensor(id, status) {
  try {
    const sensor = await Sensor.findById(id);
    if (!sensor) {
      throw new Error(`Sensor with ID ${id} not found`);
    }
    sensor.status = status;
    await sensor.save();
    logger.info(`Sensor updated: ${sensor._id}`);
    return sensor;
  } catch (error) {
    logger.error('Error updating sensor:', error);
    throw error;
  }
}

/**
 * Calculate the severity of the fire based on sensor data
 * @param {Object} data - Sensor data
 * @returns {string} - Fire severity level
 */
function calculateFireSeverity(data) {
  // Extract relevant data from the data object
  const { temperature, smokeDensity, windSpeed } = data;

  // If the temperature is above 100 degrees, smoke density is above 50, and wind speed is above 10,
  // the fire severity level is 'high'
  if (temperature > 100 && smokeDensity > 50 && windSpeed > 10) {
    return 'high';
  }
  // If any of the other conditions are true (temperature above 80 degrees, smoke density above 30, or wind speed above 5),
  // the fire severity level is 'medium'
  else if (temperature > 80 || smokeDensity > 30 || windSpeed > 5) {
    return 'medium';
  }
  // If none of the previous conditions are true, the fire severity level is 'low'
  else {
    return 'low';
  }
}

/**
 * Handle actions when a fire is detected
 * @param {Object} data - Fire event data
 */
async function handleFireDetection(data) {
  const fireEvent = await createFireEvent(data);
  await startChatSession(`Fire detected: ${JSON.stringify(fireEvent)}`);
  await sendNotification(fireEvent);
  logger.warn(`Fire detected! Event ID: ${fireEvent._id}`);
}

/**
 * Run the fire detection model using TensorFlow.js
 * @param {Object} data - Combined data for analysis
 * @returns {Promise<boolean>} - True if fire is detected, otherwise False
 */
async function runFireDetectionModel(data) {
  try {
    const model = await tf.loadLayersModel(config.modelPath);
    const preprocessedData = preprocessData(data);
    const tensorData = tf.tensor2d([preprocessedData]);
    const prediction = model.predict(tensorData);
    const probability = prediction.dataSync()[0];
    tensorData.dispose();
    prediction.dispose();
    return probability > config.fireDetectionThreshold;
  } catch (error) {
    logger.error('Error running fire detection model:', error);
    return false;
  }
}

/**
 * Preprocess data for machine learning model
 * @param {Object} data - Raw data
 * @returns {Array} - Array of preprocessed features
 */
function preprocessData(data) {
  // We use @tensorflow/tfjs-node here
  const { temperature, humidity, smokeLevel } = data;
  // Normalize data
  const maxTemperature = 120; // Maximum possible value for temperature
  const maxHumidity = 100; // Maximum possible value for humidity
  const maxSmokeLevel = 100; // Maximum possible value for smoke level
  const normalizedTemperature = temperature / maxTemperature;
  const normalizedHumidity = humidity / maxHumidity;
  const normalizedSmokeLevel = smokeLevel / maxSmokeLevel;

  // Feature extraction
  const heatIndex = calculateHeatIndex(temperature, humidity);

  // Dimensionality reduction using Principal Component Analysis (PCA)
  const pca = new PCA(2); // Reduce data to 2 principal components
  const pcaData = pca.fitTransform([
    normalizedTemperature,
    normalizedHumidity,
    normalizedSmokeLevel,
    heatIndex,
    // ... other relevant features
  ]);

  return pcaData.flat();
}

// Function to calculate heat index
function calculateHeatIndex(temperature, humidity) {
  const c1 = -8.78469475556;
  const c2 = 1.61139411;
  const c3 = 2.33854883889;
  const c4 = -0.14611605;
  const c5 = -0.012308094;
  const c6 = -0.0164248277778;
  const c7 = 0.002211732;
  const c8 = 0.00072546;
  const c9 = -0.000003582;

  const t = (temperature * 9) / 5 + 32; // Convert temperature to Fahrenheit
  const h = humidity;

  const heatIndex =
    c1 +
    c2 * t +
    c3 * h +
    c4 * t * h +
    c5 * t * t +
    c6 * h * h +
    c7 * t * t * h +
    c8 * t * h * h +
    c9 * t * t * h * h;

  return heatIndex;
}

// Class for Principal Component Analysis (PCA)
class PCA {
  constructor(nComponents) {
    this.nComponents = nComponents;
  }

  fitTransform(data) {
    const mean = tf.mean(data, 0);
    const centeredData = tf.sub(data, mean);
    const covarianceMatrix = tf.matMul(centeredData, centeredData, false, true);
    const { values: eigenvalues, vectors: eigenvectors } = tf.linalg.eig(covarianceMatrix);
    const sortedIndices = eigenvalues
      .dataSync()
      .map((_, i) => i)
      .sort((a, b) => eigenvalues.dataSync()[b] - eigenvalues.dataSync()[a]);
    const sortedEigenvectors = eigenvectors.gather(sortedIndices.slice(0, this.nComponents), 1);
    const pcaData = tf.matMul(centeredData, sortedEigenvectors);
    return pcaData.arraySync();
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down fire detection service...');
  client.end();
  await redisClient.quit();
  process.exit(0);
});

module.exports = {
  analyzeData,
  getLidarData,
  getEnvironmentalData,
  createFireEvent,
  updateFireEvent,
  updateSensor,
  calculateFireSeverity,
  handleFireDetection,
  runFireDetectionModel,
  preprocessData,
  calculateHeatIndex,
};

/* In this code, I have developed a fire detection service that uses sensor data to identify the presence of fires. The service was built using Node.js and connects to an MQTT broker to receive data from sensors. Additionally, it connects to a Redis server to retrieve additional LiDAR and environmental data.
The main steps I followed are as follows:
1. I configured a logger using Winston to log messages with various levels of severity.
1.1 I inserted await to insert the processed data into the destination folder.
2. I initialized an MQTT client and connected to the MQTT broker specified in the configuration. Once connected, I subscribed to the sensor topics.
3. I initialized a Redis client and connected to the Redis server specified in the configuration.
4. I created an `analyzeData` function that combines sensor data with LiDAR and environmental data retrieved from Redis. The function then preprocesses the data and passes it to a fire detection model using TensorFlow.js. If the model detects a fire, the function returns `true`; otherwise, it returns `false`.
5. I created a `handleFireDetection` function that is called when a fire is detected. The function creates a new fire event in the database, starts a chat session with an external service (Gemini), and sends a notification to an external notification service.
6. I created functions to retrieve LiDAR and environmental data from Redis, create and update fire events in the database, and update sensor status in the database.
7. I created a `calculateFireSeverity` function that calculates the severity level of a fire based on sensor data.
8. I created a `runFireDetectionModel` function that loads a fire detection model using TensorFlow.js, preprocesses the data, and passes it to the model for prediction.
9. I created a `preprocessData` function that normalizes sensor data and extracts additional features, such as the heat index. Then, the function reduces the dimensionality of the data using principal component analysis (PCA).
10. I handled graceful shutdown of the service using an event handler for SIGINT. When the service is shut down, the event handler closes the MQTT and Redis connections and terminates the process.
In summary, I created a fire detection service that uses sensor data to identify the presence of fires. The service connects to an MQTT broker to receive data from sensors and to a Redis server to retrieve additional data. Then, the service analyzes the data using a machine learning model and, if a fire is detected, creates a fire event in the database, starts a chat session with an external service, and sends a notification to an external notification service. The service was designed to be robust and scalable, with the ability to handle graceful shutdown and log messages using a configurable logger.*/
