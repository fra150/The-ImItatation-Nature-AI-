const classification = require('../services/classification');
const logger = require('../utils/logger');

const parseBbox = (q) => (q.bbox ? q.bbox.split(',').map(Number) : undefined);

// Wrappa una funzione di classificazione EE in un handler Express con degrado
// graceful (503 se EE non configurato, 500 per altri errori).
const handle = (fn, label) => async (req, res) => {
  try {
    const data = await fn({
      bbox: parseBbox(req.query),
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      numClusters: req.query.numClusters ? Number(req.query.numClusters) : undefined,
    });
    res.json(data);
  } catch (error) {
    const code = /not configured/i.test(error.message) ? 503 : 500;
    logger.error(`${label} classification error: ${error.message}`);
    res.status(code).json({ error: 'Classification error', detail: error.message });
  }
};

module.exports = {
  unsupervised: handle(classification.unsupervised, 'Unsupervised'),
  supervised: handle(classification.supervised, 'Supervised'),
};
