const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const User = require('../models/user');

// Nasconde l'hash della password prima di rispondere (create/update
// restituivano l'intera riga, incluso il campo password).
const sanitize = (user) => {
  const plain = user.toJSON ? user.toJSON() : user;
  const { password, ...rest } = plain;
  return rest;
};

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, { attributes: { exclude: ['password'] } });
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new user
const adminCreateValidations = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password').notEmpty().withMessage('Password is required').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'operator', 'viewer']).withMessage('Invalid role'),
];
router.post('/', validate(adminCreateValidations), async (req, res) => {
  try {
    const { password, id, ...rest } = req.body;
    // Password hashata come in authController.register — prima veniva
    // salvata (e restituita!) in chiaro creando l'utente da questa route.
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const user = await User.create({ ...rest, password: hashedPassword });
    res.status(201).json(sanitize(user));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a user by ID
const adminUpdateValidations = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password').optional().isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['admin', 'operator', 'viewer']).withMessage('Invalid role'),
];
router.put('/:id', validate(adminUpdateValidations), async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      const { password, id, ...rest } = req.body;
      const update = password ? { ...rest, password: await bcrypt.hash(password, 10) } : rest;
      await user.update(update);
      res.json(sanitize(user));
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a user by ID
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.destroy();
      res.json({ message: 'User deleted' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

/*This is a Node.js Express application that provides a RESTful API for managing user data. Here's a description of the code in the first person:
I start by importing the necessary modules. Express is used to create the server and define the routes, and I'm assuming there's a User model defined elsewhere in the application that interacts with the database.
I then create an instance of an Express router. This router will be used to define the routes for managing user data.
The first route is a GET request to the root URL ('/'). This route is used to retrieve all users from the database. If the operation is successful, the user data is returned as a JSON response. If an error occurs, a 500 status code is returned along with an error message.
The next route is also a GET request, but it includes a dynamic segment in the URL ('/:id'). This route is used to retrieve a single user by their ID. If the user is found, their data is returned as a JSON response. If the user is not found, a 404 status code is returned along with a message indicating that the user was not found. If an error occurs, a 500 status code is returned along with an error message.
The third route is a POST request to the root URL ('/'). This route is used to create a new user. The user data is expected to be provided in the request body. If the operation is successful, the newly created user data is returned as a JSON response with a 201 status code. If an error occurs, a 400 status code is returned along with an error message.
The fourth route is a PUT request that includes a dynamic segment in the URL ('/:id'). This route is used to update an existing user by their ID. The updated user data is expected to be provided in the request body. If the user is found, their data is updated and the updated user data is returned as a JSON response. If the user is not found, a 404 status code is returned along with a message indicating that the user was not found. If an error occurs, a 400 status code is returned along with an error message.
The final route is a DELETE request that includes a dynamic segment in the URL ('/:id'). This route is used to delete a user by their ID. If the user is found, they are deleted from the database and a message indicating that the user was deleted is returned as a JSON response. If the user is not found, a 404 status code is returned along with a message indicating that the user was not found. If an error occurs, a 500 status code is returned along with an error message.
Finally, I export the router so that it can be used by the main application. */
