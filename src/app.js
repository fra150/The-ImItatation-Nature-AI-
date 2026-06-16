const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const { sequelize } = require('./config/database');
const environment = require('./config/environment');
const { logger } = require('./utils/logger');
const { loadTrainAndSaveModel } = require('./services/trainingService');

const app = express();
const port = environment.port;

// ============================================================
// Routes
// ============================================================
const authRoutes = require('./routes/authRoutes');
const fireEventRoutes = require('./routes/fireEventRoutes');
const areaRoutes = require('./routes/areaRoutes');
const sensorRoutes = require('./routes/sensorRoutes');
const droneRoutes = require('./routes/droneRoutes');
const geminiRoutes = require('./routes/geminiRoutes');
const forestRoutes = require('./routes/forestRoutes');
const weatherDataRoutes = require('./routes/weatherDataRoutes');
const userRoutes = require('./routes/userRoutes');

// ============================================================
// Middleware globali
// ============================================================
app.use(express.json());
app.use(cors());
app.use(require('./middleware/rateLimiter'));
app.use(require('./middleware/errorHandler'));

// ============================================================
// Health endpoint per readiness probe (K8s / Brainverse_AI)
// ============================================================
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'the-imitatation-nature-ai',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================
// Endpoint radice
// ============================================================
app.get('/', (_req, res) => {
  res.json({
    name: 'The ImItatation Nature AI',
    version: '1.0.0',
    description: 'AI-powered wildfire detection and prevention system',
    orchestrated_by: 'Brainverse AI OS v7.1',
    health: '/health',
  });
});

// ============================================================
// Routes API
// ============================================================
app.use('/auth', authRoutes);
app.use('/sensors', sensorRoutes);
app.use('/drones', droneRoutes);
app.use('/api/fire-events', fireEventRoutes);
app.use('/api', forestRoutes);
app.use('/gemini', geminiRoutes);
app.use('/api/weather', weatherDataRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);

// ============================================================
// 404 Handler
// ============================================================
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// ML Training asincrono (non blocca l'avvio)
// ============================================================
loadTrainAndSaveModel()
  .then(() => logger.info('Model training completed'))
  .catch((error) => logger.error('Error during model training:', error));

// ============================================================
// MQTT Client — integrato solo se configurato
// ============================================================
if (process.env.MQTT_BROKER_URL) {
  try {
    const { client, subscribeToTopic, publishMessage } = require('./utils/mqttClient');
    app.locals.mqttClient = client;
    app.locals.mqttSubscribe = subscribeToTopic;
    app.locals.mqttPublish = publishMessage;
    logger.info('MQTT client initialized and attached to app.locals');
  } catch (mqttError) {
    logger.warn('MQTT client not available (non-blocking):', mqttError.message);
  }
} else {
  logger.info('MQTT broker not configured — skipping MQTT integration');
}

// ============================================================
// Database sync + Server start
// ============================================================
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');

    await sequelize.sync({ alter: true });
    logger.info('Database synchronized successfully.');

    app.listen(port, () => {
      logger.info(`Server is listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Error during database sync or server startup:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
