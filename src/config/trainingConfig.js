const path = require('path');
const logger = require('../utils/logger');

const config = {
  modelPath: process.env.MODEL_PATH || path.join(__dirname,'models/ai_model/model.json'),
  savePath: process.env.SAVE_PATH || path.join(__dirname, 'models/ai_model/trained_model'),
  epochs: process.env.EPOCHS ? parseInt(process.env.EPOCHS, 10) : 50,

  validateConfig: function () {
    this.validateEpochs();
    this.validatePath(this.modelPath, 'The model path must be absolute.');
    this.validatePath(this.savePath, 'The save path must be absolute.');
  },

  validateEpochs: function () {
    if (this.epochs <= 0) {
      throw new Error('The number of epochs must be positive.');
    }
  },

  validatePath: function (pathToValidate, errorMessage) {
    if (!path.isAbsolute(pathToValidate)) {
      throw new Error(errorMessage);
    }
  },
};

if (!process.env.MODEL_PATH) {
  logger.warn('The MODEL_PATH environment variable is not set. Using the default relative path.');
}
if (!process.env.SAVE_PATH) {
  logger.warn('The SAVE_PATH environment variable is not set. Using the default relative path.');
}
if (!process.env.EPOCHS) {
  logger.warn('The EPOCHS environment variable is not set. Using the default value of 50.');
}

try {
  config.validateConfig();
} catch (error) {
  logger.error('Configuration validation error:', error);
  process.exit(1); // Exit the application with an error code
}

module.exports = config;

/* Into this code ,I have configured the settings for training and using an AI model. First, I import the 'path' module and a custom 'logger' utility. Then, I define a 'config' object that contains the paths for the model and where to save the trained model, as well as the number of epochs for training.
The 'config' object also includes validation functions to ensure that the model path and save path are absolute, and that the number of epochs is positive. If the environment variables 'MODEL_PATH', 'SAVE_PATH', and 'EPOCHS' are not set, the code uses default relative paths and a default number of epochs of 50.
After defining the 'config' object, I use the 'logger' utility to log warnings if any of the environment variables are not set, and then I validate the configuration using the validation functions. If any validation errors occur, the code logs an error message and exits the application with an error code.
Finally, I export the 'config' object so that it can be used by other parts of the application. */
