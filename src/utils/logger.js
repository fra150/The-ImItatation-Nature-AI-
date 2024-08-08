const winston = require('winston');
const winstonDailyRotateFile = require('winston-daily-rotate-file');

// Create the logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    // Transport for weekly rotating log files
    new winstonDailyRotateFile({
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-dd-DD',
      maxFiles: '52', // Maximum 52 files (one year)
      zippedArchive: true, // Compresses archived log files
    }),
    // Transport for weekly rotating error log files
    new winstonDailyRotateFile({
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-dd-DD',
      level: 'error',
      maxFiles: '52', // Maximum 52 files (one year)
      zippedArchive: true, // Compresses archived log files
    }),
  ],
});

// Add console transport only in development and test environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console());
}

// Exception handling
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  process.exit(1); // Safely close the application
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection: ${reason.message}`, { stack: reason.stack });
  process.exit(1); // Safely close the application
});

// Logger usage example
logger.info('Informational log message');
logger.warn('Warning! Something is not right.');
logger.error('Error! Something went wrong.');
logger.debug('Debug information'); // Will not be displayed in production

const loggerMqtt = winston.createLogger({
  level: 'info', // Default log level
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    }),
  ),
  transports: [
    new winston.transports.Console(), // Log output to the console
    // Add other transports such as files or databases if necessary
  ],
});

module.exports = { logger, loggerMqtt };

/* I'm In this script, I'm setting up a logging system for a Node.js application using the Winston library. Winston is a versatile logging library that allows for logging to various transports, such as consoles, files, databases, and more.
Firstly, I'm importing the necessary modules: Winston itself, and a Winston plugin called 'winston-daily-rotate-file' which allows for log files to be rotated daily.
Then, I create the main logger using Winston's `createLogger` function. I set the default log level to 'info', which means that logs with a level of 'info', 'warn', and 'error' will be recorded. I also specify a log format that includes a timestamp and JSON formatting.
The logger is configured with two transports: one for combined logs and one for error logs. Both transports use the 'winston-daily-rotate-file' plugin to create rotating log files. The files are named with the current date and are compressed for archiving. The error log transport only records logs with a level of 'error'.
Additionally, if the application is not running in a production environment, I add a console transport to the logger. This means that logs will be output to the console in addition to being written to files.
I also include exception handling for uncaught exceptions and unhandled rejections. If an uncaught exception or unhandled rejection occurs, the logger will record an error log with the error message and stack trace, and then safely exit the application.
Finally, I demonstrate how to use the logger to log messages at various levels. I log an informational message, a warning message, an error message, and a debug message. The debug message will not be displayed in a production environment, as the log level is set to 'info'.
I also create a second logger, `loggerMqtt`, which is a simpler logger that only outputs logs to the console. This logger is likely used for a specific purpose, such as logging MQTT messages.
Overall, this script sets up a robust logging system for a Node.js application that records logs to rotating files and the console, handles exceptions, and provides flexibility for different logging levels and transports. */
