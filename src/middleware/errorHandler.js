const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.message);

  if (err.name === 'ValidationError') {
    // Handle validation errors
    res.status(400).json({ error: err.message });
  } else if (err.name === 'NotFoundError') {
    // Handle resource not found errors
    res.status(404).json({ error: err.message });
  } else if (err.name === 'UnauthorizedError') {
    // Handle failed authentication errors
    res.status(401).json({ error: err.message });
  } else {
    // Handle generic errors
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

module.exports = errorHandler;

/* In this code, I have created an error handling middleware for a Node.js application.
This middleware is designed to catch and handle errors that may occur during the lifecycle of an HTTP request.
1. I have imported a custom logging module called `logger` to log error messages.
2. I have defined a function `errorHandler` that accepts four parameters: `err`, `req`, `res`, and `next`.
These parameters represent the error, the request, the response, and the callback function to pass to the next middleware, respectively.
3. Inside the `errorHandler` function, I have used the `logger` module to log the error message.
4. Then, I have used a series of `if-else` statements to handle different types of errors based on their name. If the error is a `ValidationError`,
the HTTP response will have a status 400 (Bad Request) and the error message will be returned to the client. If the error is a `NotFoundError`, the HTTP response will have a status 404 (Not Found) and the error message will be returned to the client.
If the error is an `UnauthorizedError`, the HTTP response will have a status 401 (Unauthorized) and the error message will be returned to the client.
5. If the error does not fall into any of the previous categories, the HTTP response will have a status 500 (Internal Server Error) and a generic error message will be returned to the client.
6. Finally, I have exported the `errorHandler` function as a module so that it can be used in other parts of the application. */
