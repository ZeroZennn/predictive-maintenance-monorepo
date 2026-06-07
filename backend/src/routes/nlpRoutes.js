'use strict';

const { Router } = require('express');
const chatController = require('../controllers/chatController')
const { nlpLimiter } = require('../middlewares/rateLimitMiddleware')
const { body } = require('express-validator');
const nlpController = require('../controllers/nlpController');
const nlpRouter = require('../middlewares/nlpRouterMiddleware');
const { authenticate } = require('../middlewares/authMiddleware');


const router = Router();

// Validation rules for chat endpoint
const validateChat = [
  body('query')
    .notEmpty()
    .withMessage('Query is required')
    .isLength({ min: 3, max: 1000 })
    .withMessage('Query must be between 3 and 1000 characters'),

  body('machine_id')
    .optional()
    .matches(/^M-\d{2}$/)
    .withMessage('machine_id must match pattern M-XX'),

  body('session_id')
    .optional()
    .isString(),
];

// DEPRECATED: Use POST /api/chat/query instead
// Kept for backward compatibility during transition
// Will be removed in next major version
router.post(
  '/query',
  authenticate,
  nlpLimiter,
  body('query').notEmpty().isLength({ min: 2, max: 2000 }),
  body('machine_id').optional().matches(/^M-\d{2}$/),
  body('session_id').optional().isString(),
  chatController.query
)

// POST /api/nlp/chat
// authenticate, validate, classify intent, inject context, forward to NLP Engine
router.post('/chat', authenticate, validateChat, nlpRouter, nlpController.chat);

// GET /api/nlp/health - no auth needed (monitoring/frontend status indicator)
router.get('/health', nlpController.healthCheck);

module.exports = router;
