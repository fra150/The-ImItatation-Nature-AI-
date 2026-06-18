// Verifica il fix del logger: per anni il modulo esportava { logger } ma ~14
// file lo importavano come oggetto intero, causando "logger.error is not a
// function". Ora entrambi gli stili devono restituire un logger usabile.
describe('utils/logger', () => {
  test('default import (const logger = require(...)) is a usable logger', () => {
    const logger = require('../src/utils/logger');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  test('destructured import (const { logger } = require(...)) is a usable logger', () => {
    const { logger } = require('../src/utils/logger');
    expect(typeof logger.info).toBe('function');
    expect(typeof logger.error).toBe('function');
  });

  test('loggerMqtt is still exposed', () => {
    const { loggerMqtt } = require('../src/utils/logger');
    expect(typeof loggerMqtt.info).toBe('function');
  });

  test('default and named handle point to the same instance', () => {
    const def = require('../src/utils/logger');
    const { logger } = require('../src/utils/logger');
    expect(def).toBe(logger);
  });
});
