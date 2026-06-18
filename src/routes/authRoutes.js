const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../middleware/validator');
const authController = require('../controllers/authController');

const registerValidations = [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role'),
];

const loginValidations = [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register', validate(registerValidations), authController.register);
router.post('/login', validate(loginValidations), authController.login);
router.post('/logout', authController.logout);

module.exports = router;
