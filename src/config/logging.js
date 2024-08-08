/* This file is for the configuration of all logging files. */
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const fs = require('fs');

const logDir = 'logs';

// Create the log directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Winston logger configuration
const logger = winston.createLogger({
  level: 'info', // Logs messages of 'info' level or higher
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info) => `${info.timestamp} ${info.level}: ${info.message}`),
  ),
  transports: [
    new winston.transports.Console(), // Writes logs to the console
    // Writes logs to a daily rotating file, keeping logs for a year
    new DailyRotateFile({
      filename: `${logDir}/application-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '365d',
    }),
  ],
});

module.exports = logger;

/* The system uses Winston, a versatile logging library, to log events and important information during execution. 
Logs are written both to the console and to a daily rotating file, making it easier to monitor and debug the application.
 The logging configuration is defined in the logging.js file. */
