'use strict';

const { Router } = require('express');
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

// POST /api/nlp/chat
// authenticate, validate, classify intent, inject context, forward to NLP Engine
router.post('/chat', authenticate, validateChat, nlpRouter, nlpController.chat);

// GET /api/nlp/health - no auth needed (monitoring/frontend status indicator)
router.get('/health', nlpController.healthCheck);

module.exports = router;
