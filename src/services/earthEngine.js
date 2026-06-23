// Inizializzazione centralizzata di Google Earth Engine via SERVICE ACCOUNT.
// In @google/earthengine 0.1.x `ee.Authenticate()` (login interattivo/browser)
// non esiste più: per un backend si usa ee.data.authenticateViaPrivateKey con
// la chiave JSON del service account. La chiave NON è nel repo: va indicata via
// env EE_SERVICE_ACCOUNT_KEY (o GOOGLE_APPLICATION_CREDENTIALS) e tenuta in
// secrets/ (gitignored). Senza chiave, initEarthEngine() rigetta con un errore
// chiaro così gli endpoint possono degradare (503) invece di crashare.
const path = require('path');
const fs = require('fs');
const ee = require('@google/earthengine');
const logger = require('../utils/logger');

let _initPromise = null;

function keyPath() {
  return process.env.EE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS || null;
}

function loadKey() {
  // Sotto test EE è disattivato (niente chiamate di rete): gli endpoint -> 503.
  if (process.env.NODE_ENV === 'test') return null;
  const p = keyPath();
  if (!p) return null;
  const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
  if (!fs.existsSync(abs)) {
    logger.warn(`Earth Engine key file not found at ${abs}`);
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(abs, 'utf8'));
  } catch (e) {
    logger.error(`Invalid Earth Engine key file (${abs}): ${e.message}`);
    return null;
  }
}

// True se è configurata una chiave del service account valida (file presente).
function isConfigured() {
  return loadKey() !== null;
}

// Inizializza Earth Engine una sola volta (promise memoizzata). Rigetta con un
// messaggio chiaro se la chiave non è configurata o l'auth/init fallisce.
function initEarthEngine() {
  if (_initPromise) return _initPromise;

  _initPromise = new Promise((resolve, reject) => {
    const key = loadKey();
    if (!key) {
      _initPromise = null; // permette un nuovo tentativo dopo aver messo la chiave
      return reject(
        new Error(
          'Earth Engine not configured: set EE_SERVICE_ACCOUNT_KEY to the service-account JSON key path (e.g. ./secrets/ee-key.json).',
        ),
      );
    }

    ee.data.authenticateViaPrivateKey(
      key,
      () =>
        ee.initialize(
          null,
          null,
          () => {
            logger.info('Earth Engine initialized via service account.');
            resolve();
          },
          (err) => {
            _initPromise = null;
            reject(new Error(`Earth Engine initialize failed: ${err}`));
          },
          null,
          process.env.EE_PROJECT || null,
        ),
      (err) => {
        _initPromise = null;
        reject(new Error(`Earth Engine authentication failed: ${err}`));
      },
    );
  });

  return _initPromise;
}

module.exports = { initEarthEngine, isConfigured };
