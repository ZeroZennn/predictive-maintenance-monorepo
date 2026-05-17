'use strict';

const axios = require('axios');
const logger = require('../config/logger');

const nlpController = {
  /**
   * POST /api/nlp/chat
   *
   * Forwards the classified query (with injected live context) to the
   * NLP Engine and proxies the response back to the Frontend.
   * Routing metadata is set by nlpRouterMiddleware on req.nlpRouting.
   */
  async chat(req, res, next) {
    // Read routing decision from middleware
    const { mode, machine_ids, live_context, session_id } = req.nlpRouting;
    const { query } = req.body;

    try {
      // Build NLP Engine payload per confirmed contract
      const nlpPayload = {
        query,
        machine_ids,
        session_id,
        mode,
        live_context,
      };

      // Call NLP Engine
      const response = await axios.post(
        process.env.NLP_ENGINE_URL + '/api/nlp/query',
        nlpPayload,
        { timeout: 30000 } // 30s timeout for LLM inference
      );

      // Log success with key metrics
      logger.info(
        `[NLP] Response for session ${session_id}: ` +
        `mode=${mode} | confidence=${response.data.confidence} | ` +
        `latency=${response.data.latency_ms}ms | ` +
        `citations=${response.data.citations?.length || 0}`
      );

      // Proxy full NLP response to Frontend
      return res.status(200).json({
        status: 'success',
        data: response.data,
      });
    } catch (err) {
      // Distinguish NLP Engine availability errors from other failures
      if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.response) {
        logger.error(`[NLP] NLP Engine unavailable: ${err.message}`);
        return res.status(503).json({
          status: 'error',
          message: 'AI Copilot is temporarily unavailable. Please try again.',
          fallback: true,
        });
      }

      // global error handler
      next(err);
    }
  },

  /**
   * GET /api/nlp/health
   *
   * Proxy health check to NLP Engine - no auth required.
   * Used by monitoring and the Frontend's connection indicator.
   */
  async healthCheck(req, res) {
    try {
      const response = await axios.get(
        process.env.NLP_ENGINE_URL + '/api/nlp/health',
        { timeout: 5000 }
      );

      return res.status(200).json({
        status: 'success',
        nlp_engine: response.data,
      });
    } catch (err) {
      return res.status(503).json({
        status: 'error',
        message: 'NLP Engine unavailable',
        nlp_engine: null,
      });
    }
  },
};

module.exports = nlpController;
