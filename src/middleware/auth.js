const jwt = require('jsonwebtoken');
const environment = require('../config/environment');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing token' });
  }
  const token = authHeader.split(' ')[1];
  if (!token || token === '') {
    return res.status(401).json({ message: 'Invalid token format' });
  }
  jwt.verify(token, environment.jwtSecret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Expired token' });
      }
      return res.status(401).json({ message: 'Token authentication error' });
    }
    if (!decoded.role) {
      return res.status(401).json({ message: 'Invalid user role' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

/* In this code, I have created a middleware for user authentication and authorization in a Node.js application. This middleware uses JSON Web Tokens (JWT) to verify the user's identity and their role. Here are the steps I followed:
I imported the necessary libraries, which are jsonwebtoken for handling JWT and environment for accessing configuration variables.
I defined a middleware function that takes three arguments: the request (req), the response (res), and the next function that passes control to the next middleware.
I extracted the Authorization header from the request. If this header is not present, the function returns a response with status 401 (Unauthorized) and an error message "Missing token".
I extracted the JWT token from the Authorization header, which is formatted as "Bearer <token>".
If the token is not present or is an empty string, the function returns a response with status 401 and an error message "Invalid token format".
I used the jwt.verify function to verify the token's validity. This function takes three arguments: the token, the secret key used to sign the token, and a callback that is called once the verification is complete.
If the token verification fails, the callback returns a response with status 401 and an appropriate error message. If the token is expired, the error message is "Expired token".
If there is a generic token authentication error, the error message is "Token authentication error".
If the token verification is successful, the callback extracts the user's ID and their role from the decoded payload and adds them to the request as userId and userRole properties.
Finally, the next function is called to pass control to the next middleware. */
