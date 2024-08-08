const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./config/database');
const environment = require('./config/environment');
const logger = require('./utils/logger');
const app = express();
const port = environment.port;
const authRoutes = require('./routes/authRoutes');
const fireEventRoutes = require('./routes/fireEventRoutes');
const areaRoutes = require('./routes/areaRoutes');
const sensorRoutes = require('./routes/sensorRoutes'); // Added
const droneRoutes = require('./routes/droneRoutes'); // Added
const { loadTrainAndSaveModel } = require('./services/trainingService');
const geminiRoutes = require('./routes/geminiRoutes');
const forestRoutes = require('./routes/forestRouters');

// Start model training
loadTrainAndSaveModel()
  .then(() => {
    logger.info('Model training completed');
  })
  .catch((error) => {
    logger.error('Error during model training:', error);
  });

// Middleware to parse request bodies as JSON
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(require('../middleware/rateLimiter'));
app.use(require('../middleware/errorHandler'));
// Routes
app.use('/auth', authRoutes);
app.use('/sensors', sensorRoutes);
app.use('/drones', droneRoutes);
app.use('/api/fire-events', fireEventRoutes);
app.use('/api', forestRoutes);

// 404 - Not Found error handling
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found' });
});

// Centralized error handling
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

//gemini service
app.use('/gemini', geminiRoutes);

// Database synchronization
(async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully!');

    await sequelize.sync({ alter: true });
    logger.info('Database synchronized successfully.');

    app.listen(port, () => {
      logger.info(`Server is listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Error during database synchronization or server startup:', error);
    process.exit(1);
  }
})();

module.exports = app;

/* This is a Node.js application built with Express.js, a popular web application framework. The application is designed to handle various routes for authentication, fire events, areas, sensors, drones, and a Gemini service.
Upon starting, the application initiates the training and saving of a machine learning model. This process is asynchronous and logs any errors that occur during the training phase.
The application uses middleware to parse incoming request bodies as JSON. It also includes CORS (Cross-Origin Resource Sharing) to allow requests from different origins, a rate limiter to prevent abuse, and an error handler to manage unhandled errors.
The application defines routes for authentication, sensors, drones, fire events, and a Gemini service. It also includes a route for forest data.
The application handles 404 errors by sending a JSON response with an error message. It also includes centralized error handling to log any unhandled errors and send a JSON response with a generic error message.
Finally, the application establishes a connection to the database and synchronizes it. If the connection is successful, the application starts listening on the specified port. If any errors occur during the database synchronization or server startup, they are logged and the process exits with a status code of 1.*/
