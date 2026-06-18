const express = require('express');
const cors = require('cors');
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
app.use('/gemini', geminiRoutes);
app.use('/api/fire-events', fireEventRoutes);
app.use('/api/weather', weatherDataRoutes);
app.use('/api/users', userRoutes);
app.use('/api/areas', areaRoutes);
// forestRoutes è montato sul prefisso condiviso '/api' (catch-all 501 in
// modalità no-AI): va registrato DOPO le route '/api/...' più specifiche,
// altrimenti le oscurerebbe tutte.
app.use('/api', forestRoutes);

// ============================================================
// 404 Handler
// ============================================================
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ============================================================
// Error handler — DEVE essere registrato DOPO le route.
// Express riconosce i gestori di errore dalla firma a 4 argomenti
// (err, req, res, next): se registrato prima delle route, gli errori
// lanciati dai controller non lo raggiungerebbero mai.
// ============================================================
app.use(require('./middleware/errorHandler'));

// ============================================================
// Servizi in background (ML training + MQTT) — avviati solo quando
// il server parte davvero, non al semplice require() del modulo,
// così i test possono importare l'app senza effetti collaterali.
// ============================================================
function initBackgroundServices() {
  loadTrainAndSaveModel()
    .then(() => logger.info('Model training completed'))
    .catch((error) => logger.error(`Error during model training: ${error.message}`));

  if (process.env.MQTT_BROKER_URL) {
    try {
      const { client, subscribeToTopic, publishMessage } = require('./utils/mqttClient');
      app.locals.mqttClient = client;
      app.locals.mqttSubscribe = subscribeToTopic;
      app.locals.mqttPublish = publishMessage;
      logger.info('MQTT client initialized and attached to app.locals');
    } catch (mqttError) {
      logger.warn(`MQTT client not available (non-blocking): ${mqttError.message}`);
    }
  } else {
    logger.info('MQTT broker not configured — skipping MQTT integration');
  }
}

// ============================================================
// Avvio del server. La connessione al DB è "best effort": se il
// database non è raggiungibile, il server parte comunque per
// esporre /health e la superficie API (utile in demo/dev).
// ============================================================
async function startServer() {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
    await sequelize.sync({ alter: true });
    logger.info('Database synchronized successfully.');
  } catch (error) {
    logger.error(`Database unavailable — continuing without DB: ${error.message}`);
  }

  initBackgroundServices();

  return app.listen(port, () => {
    logger.info(`Server is listening on port ${port}`);
  });
}

// Avvia il server solo se il file è eseguito direttamente
// (node src/app.js), non quando viene importato (es. dai test).
if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
