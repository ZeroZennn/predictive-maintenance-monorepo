'use strict';

const pgPool      = require('../config/postgresClient');
const authService = require('../services/authService');
const axios       = require('axios');
const fs          = require('fs');
const path        = require('path');
const FormData    = require('form-data');
const logger      = require('../config/logger');

const adminController = {

  // USER MANAGEMENT

  /**
   * GET /api/admin/users
   * Returns all users ordered by creation date.
   */
  async getUsers(req, res, next) {
    try {
      const result = await pgPool.query(
        `SELECT id, username, email, role, is_active,
                last_login, created_at
         FROM users
         ORDER BY created_at DESC`
      );

      return res.status(200).json({
        status: 'success',
        data: {
          users: result.rows,
          total: result.rows.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/users
   * Creates a new user with a bcrypt-hashed password.
   */
  async createUser(req, res, next) {
    try {
      const { username, email, password, role } = req.body;

      const password_hash = await authService.hashPassword(password);

      const result = await pgPool.query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, role`,
        [username, email, password_hash, role]
      );

      logger.info(`[Admin] User created: ${email} (${role})`);

      return res.status(201).json({
        status: 'success',
        data: { user: result.rows[0] },
      });
    } catch (err) {
      // Unique constraint violation - duplicate email or username
      if (err.code === '23505') {
        return res.status(409).json({
          status:  'error',
          message: 'Email or username already exists',
        });
      }
      next(err);
    }
  },

  /**
   * PUT /api/admin/users/:id
   * Updates user profile fields.
   */
  async updateUser(req, res, next) {
    try {
      const id = req.params.id;
      const { username, email, role, is_active } = req.body;

      const result = await pgPool.query(
        `UPDATE users
         SET username = $1, email = $2, role = $3,
             is_active = $4, updated_at = NOW()
         WHERE id = $5
         RETURNING id, username, email, role, is_active`,
        [username, email, role, is_active, id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { user: result.rows[0] },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   * Soft-delete only - sets is_active = false.
   */
  async deleteUser(req, res, next) {
    try {
      // Prevent self-deactivation
      if (parseInt(req.params.id) === req.user.id) {
        return res.status(400).json({
          status: 'error',
          message: 'Cannot deactivate your own account',
        });
      }

      const result = await pgPool.query(
        `UPDATE users
         SET is_active = false, updated_at = NOW()
         WHERE id = $1`,
        [req.params.id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found',
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'User deactivated successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  // DOCUMENT MANAGEMENT
  /**
   * POST /api/admin/documents/upload
   *
   * Saves the file, records it in PostgreSQL with status "processing",
   * then fire-and-forgets the NLP ingest call so the client gets an
   * immediate 201 without waiting for LLM indexing.
   */
  async uploadDocument(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status:  'error',
          message: 'No file uploaded',
        });
      }

      const { doc_type, label }                            = req.body;
      const { originalname, path: tempFilePath, size, mimetype } = req.file;

      // Generate unique document_id
      const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 8);
      const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      const document_id = `DOC-${timestamp}-${randomSuffix}`;

      // Move file from multer temp location to final storage path
      const storagePath = process.env.STORAGE_PATH || '/app/uploads';
      const finalFilename = `${document_id}-${originalname.replace(/\s+/g, '_')}`;
      const finalPath = path.join(storagePath, finalFilename);

      fs.renameSync(tempFilePath, finalPath);

      // Persist record to PostgreSQL with status "processing"
      await pgPool.query(
        `INSERT INTO documents
           (document_id, filename, original_name, file_format,
            file_size, file_path, label, doc_type, status, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'processing', $9)
         RETURNING *`,
        [
          document_id,
          finalFilename,
          originalname,
          mimetype,
          size,
          finalPath,
          label || originalname,
          doc_type || 'manual',
          req.user.id,
        ]
      );

      // Fire-and-forget NLP ingest (non-blocking)
      // Client gets 201 immediately; NLP Engine calls back via PATCH /status
      setImmediate(async () => {
        try {
          await axios.post(
            process.env.NLP_ENGINE_URL + '/nlp/ingest',
            {
              document_id,
              file_path: finalPath,
              filename: finalFilename,
              doc_type: doc_type || 'manual',
            },
            { timeout: 10000 }
          );
          logger.info(`[Admin] NLP ingest triggered for ${document_id}`);
        } catch (err) {
          logger.error(`[Admin] NLP ingest failed for ${document_id}: ${err.message}`);
          // Mark document as failed in DB so admin can see the error
          await pgPool.query(
            `UPDATE documents
             SET status = 'failed', error_message = $1
             WHERE document_id = $2`,
            [err.message, document_id]
          );
        }
      });

      // Return immediately - do NOT wait for NLP Engine
      return res.status(201).json({
        status: 'success',
        message: 'Document uploaded and queued for processing',
        data: {
          document_id,
          filename: finalFilename,
          status: 'processing',
        },
      });
    } catch (err) {
      // Clean up temp file if it still exists after an error
      if (req.file?.path) {
        try { fs.unlinkSync(req.file.path); } catch (_) { /* ignore */ }
      }
      next(err);
    }
  },

  /**
   * GET /api/admin/documents
   * Lists all documents ordered by upload time.
   */
  async getDocuments(req, res, next) {
    try {
      const result = await pgPool.query(
        'SELECT * FROM documents ORDER BY uploaded_at DESC'
      );

      return res.status(200).json({
        status: 'success',
        data: {
          documents: result.rows,
          total: result.rows.length,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/admin/documents/:document_id/status
   * Returns a single document's full record.
   */
  async getDocumentStatus(req, res, next) {
    try {
      const { document_id } = req.params;

      const result = await pgPool.query(
        'SELECT * FROM documents WHERE document_id = $1',
        [document_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Document not found',
        });
      }

      return res.status(200).json({
        status:'success',
        data: { document: result.rows[0] },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/admin/documents/:document_id/status
   *
   * Internal callback endpoint - called by NLP Engine when indexing completes.
   * Authenticated via X-Internal-Key header (NOT JWT).
   */
  async updateDocumentStatus(req, res, next) {
    try {
      // Verify internal secret key
      const internalKey = req.headers['x-internal-key'];
      if (internalKey !== process.env.INTERNAL_API_KEY) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid internal key',
        });
      }

      // Extract fields from callback body
      const { document_id } = req.params;
      const { status, chunks_count, doc_type, processed_at, error_message } = req.body;

      // Update document record
      const result = await pgPool.query(
        `UPDATE documents
         SET status = $1,
             chunks_count = $2,
             doc_type = COALESCE($3, doc_type),
             ready_at = $4,
             error_message = $5,
             updated_at = NOW()
         WHERE document_id = $6
         RETURNING document_id, status, chunks_count`,
        [status, chunks_count, doc_type, processed_at, error_message, document_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Document not found',
        });
      }

      // Log outcome
      if (status === 'ready') {
        logger.info(`[Admin] Document ${document_id} indexed: ${chunks_count} chunks`);
      } else if (status === 'failed') {
        logger.error(`[Admin] Document ${document_id} failed: ${error_message}`);
      }

      return res.status(200).json({
        status: 'success',
        message: `Document status updated to ${status}`,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/documents/:document_id
   *
   * Notifies NLP Engine to remove from vector DB, deletes PostgreSQL record, then asynchronously removes the physical file.
   * NLP Engine errors don't block deletion.
   */
  async deleteDocument(req, res, next) {
    try {
      const { document_id } = req.params;

      // Retrieve file_path before deleting
      const docResult = await pgPool.query(
        'SELECT file_path FROM documents WHERE document_id = $1',
        [document_id]
      );

      if (docResult.rows.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Document not found',
        });
      }

      const { file_path } = docResult.rows[0];

      // Notify NLP Engine to purge from vector DB
      try {
        await axios.delete(
          process.env.NLP_ENGINE_URL + `/nlp/documents/${document_id}`,
          { timeout: 10000 }
        );
      } catch (nlpErr) {
        // NLP unavailability must NOT block the deletion
        logger.warn(`[Admin] NLP vector delete failed for ${document_id}: ${nlpErr.message} - continuing`);
      }

      // Delete record from PostgreSQL
      await pgPool.query(
        'DELETE FROM documents WHERE document_id = $1',
        [document_id]
      );

      // Async physical file cleanup (non-blocking)
      fs.unlink(file_path, (err) => {
        if (err) logger.warn(`[Admin] File cleanup failed: ${err.message}`);
      });

      logger.info(`[Admin] Document deleted: ${document_id}`);

      return res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
