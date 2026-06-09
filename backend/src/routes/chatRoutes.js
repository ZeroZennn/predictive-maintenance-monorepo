'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const chatController = require('../controllers/chatController');
const { authenticate } = require('../middlewares/authMiddleware');
const { nlpLimiter } = require('../middlewares/rateLimitMiddleware');

const validateQuery = [
  body('query')
    .notEmpty()
    .isLength({ min: 2, max: 2000 })
    .withMessage('Query must be between 2 and 2000 characters'),
  body('machine_id')
    .optional()
    .matches(/^M-\d{2}$/)
    .withMessage('Invalid machine_id format'),
  body('session_id')
    .optional()
    .isString()
];

const router = Router();

router.use(authenticate);

router.post(
  '/query',
  nlpLimiter,
  validateQuery,
  chatController.query
);

router.get(
  '/sessions',
  chatController.getSessions
);

router.get(
  '/sessions/:session_id',
  [
    param('session_id').notEmpty()
  ],
  chatController.getSessionMessages
);

router.delete(
  '/sessions/:session_id',
  [
    param('session_id').notEmpty()
  ],
  chatController.deleteSession
);

module.exports = router;
