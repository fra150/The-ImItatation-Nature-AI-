const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.',
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded from IP address: ${req.ip}`);
    res.status(429).send('Too many requests. Please try again later.');
  },
});

module.exports = limiter;

/* In this code, I have imported two modules: `express-rate-limit` and a custom logging module called `logger`.
The `express-rate-limit` module is a middleware library for Express that allows you to limit the number of HTTP requests that a single client can send to the server within a certain time frame. This helps to prevent brute force attacks, abuse, and spam.
I have created a limiter using the `rateLimit` function provided by the module. I have set the `windowMs` to 15 minutes, which means the limit applies to a 15-minute interval.
I have set the `max` to 100, which means that each IP address can send a maximum of 100 requests to the server within a 15-minute interval. If a client exceeds this limit, an error message is returned.
I have also provided a `handler` function that is called when a client exceeds the request limit.
This function logs a warning message using the `logger` module and sends an HTTP response with a status code of 429 and an error message.
In summary, I have created a rate limiting middleware for Express that limits the number of HTTP requests that a single client can send to the server within a 15-minute interval to 100 requests.
If a client exceeds this limit, a warning message is logged and an error response is sent. */
