const Joi = require('joi');

// Schema for user data validation
const userSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().min(8).max(128).required(),
  email: Joi.string().email().required(),
});

// Schema for sensor data validation
const sensorSchema = Joi.object({
  sensorId: Joi.string().alphanum().length(12).required(),
  type: Joi.string().valid('temperature', 'humidity', 'smoke').required(),
  location: Joi.string().min(3).required(),
});

// Schema for drone data validation
const droneSchema = Joi.object({
  droneId: Joi.string().alphanum().length(10).required(),
  model: Joi.string().min(3).required(),
  lastMaintenance: Joi.date().iso().required(),
});

// Schema for location data validation
const locationSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  description: Joi.string().optional(),
});

// Schema for Google Gemini data validation
const geminiDataSchema = Joi.object({
  sessionId: Joi.string().uuid().required(),
  message: Joi.string().min(1).required(),
  response: Joi.object().optional(), // Adjust based on the response format
});

// Function to validate user data
const validateUser = (data) => {
  const { error } = userSchema.validate(data);
  if (error) {
    throw new Error(
      `User data validation failed: ${error.details.map((x) => x.message).join(', ')}`,
    );
  }
  return true;
};

// Function to validate sensor data
const validateSensor = (data) => {
  const { error } = sensorSchema.validate(data);
  if (error) {
    throw new Error(
      `Sensor data validation failed: ${error.details.map((x) => x.message).join(', ')}`,
    );
  }
  return true;
};

// Function to validate drone data
const validateDrone = (data) => {
  const { error } = droneSchema.validate(data);
  if (error) {
    throw new Error(
      `Drone data validation failed: ${error.details.map((x) => x.message).join(', ')}`,
    );
  }
  return true;
};

// Function to validate location data
const validateLocation = (data) => {
  const { error } = locationSchema.validate(data);
  if (error) {
    throw new Error(
      `Location data validation failed: ${error.details.map((x) => x.message).join(', ')}`,
    );
  }
  return true;
};

// Function to validate Google Gemini data
const validateGeminiData = (data) => {
  const { error } = geminiDataSchema.validate(data);
  if (error) {
    throw new Error(
      `Gemini data validation failed: ${error.details.map((x) => x.message).join(', ')}`,
    );
  }
  return true;
};

module.exports = {
  validateUser,
  validateSensor,
  validateDrone,
  validateLocation,
  validateGeminiData,
};

/*In this code, I've defined several schemas using the Joi library for validating different types of data. These schemas include user data, sensor data, drone data, location data, and data from Google Gemini. Each schema specifies the expected format and constraints for the data it validates.
For example, the user schema requires a username that is alphanumeric, between 3 and 30 characters long, an email address in a valid format, and a password that is between 8 and 128 characters long.
I've also defined several validation functions that use these schemas to validate data. Each function takes a data object as input and returns true if the data is valid according to the schema, or throws an error if the data is invalid.
The error message includes the details of the validation error, which makes it easier to understand what went wrong during the validation process. For example, if the user data validation fails, the error message might include a message like "username length must be at least 3 characters long" or "email must be a valid email address".
To use these validation functions, you can simply call them with the data object you want to validate. For example, to validate user data, you can call the validate User function with the user data object as input. If the data is valid, the function will return true. If the data is invalid, the function will throw an error.
Overall, this code provides a simple and effective way to validate different types of data in a Node.js application. It uses the Joi library to define schemas for the data, and provides validation functions that can be easily integrated into your application's code.  */
