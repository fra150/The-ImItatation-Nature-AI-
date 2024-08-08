const express = require('express');
const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
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
router.post('/', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a user by ID
router.put('/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (user) {
      await user.update(req.body);
      res.json(user);
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
