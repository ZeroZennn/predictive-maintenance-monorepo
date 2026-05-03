'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = Router();

// Validation rules for login
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Valid email is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password min 6 characters'),
];

// POST /api/auth/login - authenticate and receive JWT
router.post('/login', validateLogin, authController.login);

// GET /api/auth/me - return current user (requires valid token)
router.get('/me', authenticate, authController.getMe);

// POST /api/auth/logout - stateless logout acknowledgement (requires valid token)
router.post('/logout', authenticate, authController.logout);

module.exports = router;
