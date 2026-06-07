'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

const router = Router();

// Multer - file upload configuration

// Ensure uploads directory exists at startup
const uploadsDir = path.join(__dirname, '../../uploads');
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/octet-stream'  // PowerShell & some clients send this
  ]
  
  const allowedExtensions = ['.pdf', '.docx', '.txt']
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (allowedMimes.includes(file.mimetype) && 
      allowedExtensions.includes(ext)) {
    cb(null, true)
  } else if (allowedExtensions.includes(ext)) {
    // Extension valid even if MIME type is generic
    cb(null, true)
  } else {
    cb(new Error('Only PDF, DOCX, and TXT files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Validation rules

const validateCreateUser = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters'),

  body('email')
    .isEmail().withMessage('Valid email is required'),

  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .isIn(['admin', 'technician']).withMessage('Role must be admin or technician'),
];

const validateUpdateUser = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 }).withMessage('Username must be 3–50 characters'),

  body('email')
    .optional()
    .isEmail().withMessage('Valid email is required'),

  body('role')
    .optional()
    .isIn(['admin', 'technician']).withMessage('Role must be admin or technician'),

  body('is_active')
    .optional()
    .isBoolean().withMessage('is_active must be a boolean'),
];

// USER routes - all require admin role

router.get(
  '/users',
  authenticate, requireRole('admin'),
  adminController.getUsers
);

router.post(
  '/users',
  authenticate, requireRole('admin'),
  validateCreateUser,
  adminController.createUser
);

router.put(
  '/users/:id',
  authenticate, requireRole('admin'),
  validateUpdateUser,
  adminController.updateUser
);

router.delete(
  '/users/:id',
  authenticate, requireRole('admin'),
  adminController.deleteUser
);

// DOCUMENT routes
// CRUD Document - admin only

// Upload, multipart form-data
router.post(
  '/documents/upload',
  authenticate, requireRole('admin'),
  upload.single('file'),
  adminController.uploadDocument
);

// List all documents
router.get(
  '/documents',
  authenticate, requireRole('admin'),
  adminController.getDocuments
);

// Get single document status
router.get(
  '/documents/:document_id/status',
  authenticate, requireRole('admin'),
  adminController.getDocumentStatus
);

// NLP Engine callback - verified by X-Internal-Key header
router.patch(
  '/documents/:document_id/status',
  adminController.updateDocumentStatus
);

// Delete document
router.delete(
  '/documents/:document_id',
  authenticate, requireRole('admin'),
  adminController.deleteDocument
);

module.exports = router;
