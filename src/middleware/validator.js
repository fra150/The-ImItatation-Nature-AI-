const { validationResult } = require('express-validator');
const { body } = require('express-validator');

/**
 * Middleware function for validating request data.
 *
 * @param {Array<Function>} validations - An array of express-validator validation functions.
 * @returns {Function} - A middleware function that executes the validations and handles errors.
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Run all the validations defined in the array.
    for (const validation of validations) {
      await validation.run(req);
    }
    // Get the validation results.
    const errors = validationResult(req);
    // If there are no errors, proceed to the next middleware.
    if (errors.isEmpty()) {
      return next();
    }
    // If there are errors, return a 400 error with the list of errors.
    res.status(400).json({ errors: errors.array() });
  };
};

// Validation for creating/updating a sensor
const validateSensorData = [
  body('type').notEmpty().withMessage('Type is required'),
  body('location').notEmpty().withMessage('Location is required'),
  body('status').notEmpty().withMessage('Status is required'),
];

// Middleware for handling validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next(); // If there are no validation errors, pass to the next middleware
};

module.exports = {
  validateSensorData,
  handleValidationErrors,
  validate,
};



/* In this code, I've created a middleware for validating request data in an Express.js application.
The middleware is designed to be reusable and flexible, accepting an array of express-validator validation functions as a parameter.
1. I've defined a middleware function called `validate` that accepts an array of validation functions as an argument.
2. Inside the `validate` function, I've iterated through each validation function in the array and executed it using the `run` method of express-validator.
3. After executing all validations, I've used the `validationResult` function of express-validator to get the validation results.
4. If the validation results are empty, it means there are no validation errors, so I've called the `next` function to pass to the next middleware.
5. If there are validation errors, I've returned a response with a 400 (Bad Request) status and a JSON object containing the list of errors.
6. I've defined an array of validation functions called `validateSensorData` for validating sensor data. The validation functions check that the required fields `type`, `location`, and `status` are not empty.
7. I've created a middleware called `handleValidationErrors` for handling validation errors.
This middleware uses the `validationResult` function of express-validator to get the list of validation errors.
If there are errors, the middleware returns a response with a 400 status and a JSON object containing the list of errors. If there are no errors,
the middleware calls the `next` function to pass to the next middleware.
8. Finally, I've exported the functions `validateSensorData`, `handleValidationErrors`, and `validate` to be used in other parts of the application.
*/