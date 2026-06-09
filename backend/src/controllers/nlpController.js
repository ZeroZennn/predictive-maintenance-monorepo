"use strict";

const axios = require("axios");
const logger = require("../config/logger");

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
    const { mode, machine_ids, live_context, session_id } = req.nlpRouting || {};
    const { query } = req.body || {};

    try {
      const nlpPayload = {
        query,
        machine_ids: machine_ids || [], // Ensure it's an array
        session_id: session_id || req.body.session_id,
        history: req.body.history || [], // Add history from request body
      };

      // Call NLP Engine
      const response = await axios.post(
        process.env.NLP_ENGINE_URL + "/nlp/query",
        nlpPayload,
        { timeout: 30000 }, // 30s timeout for LLM inference
      );

      // Log success with key metrics
      logger.info(
        `[NLP] Response for session ${session_id}: ` +
          `mode=${response.data.mode} | confidence=${response.data.confidence} | ` +
          `latency=${response.data.latency_ms}ms | ` +
          `citations=${response.data.citations?.length || 0}`,
      );

      // Map the NLP Engine response to what the Frontend expects
      const mappedData = {
        answer: response.data.answer || (response.data.answer_text),
        citations: response.data.citations || [],
        has_live_context: response.data.live_context_used || false,
        machine_id: response.data.live_context_data && response.data.live_context_data.length > 0 
                      ? response.data.live_context_data[0].machine_id 
                      : (machine_ids && machine_ids.length > 0 ? machine_ids[0] : null),
        query_mode: response.data.mode,
        processing_time_ms: response.data.latency_ms,
        // Include any other fields
        ...response.data
      };

      // Ensure don't send duplicate or confusing fields
      delete mappedData.live_context_used;
      delete mappedData.mode;
      delete mappedData.latency_ms;

      // Proxy mapped NLP response to Frontend
      return res.status(200).json({
        status: "success",
        data: mappedData,
      });
    } catch (err) {
      // Distinguish NLP Engine availability errors from other failures
      if (
        err.code === "ECONNREFUSED" ||
        err.code === "ETIMEDOUT" ||
        err.response
      ) {
        logger.error(`[NLP] NLP Engine unavailable: ${err.message}`);
        return res.status(503).json({
          status: "error",
          message: "AI Copilot is temporarily unavailable. Please try again.",
          fallback: true,
        });
      }

      // global error handler
      next(err);
    }
  },

  /**
   * GET /nlp/health
   *
   * Proxy health check to NLP Engine - no auth required.
   * Used by monitoring and the Frontend's connection indicator.
   */
  async healthCheck(req, res) {
    try {
      const response = await axios.get(
        process.env.NLP_ENGINE_URL + "/nlp/health",
        { timeout: 5000 },
      );

      // Map the response to match the older frontend contract if needed
      const mappedHealth = {
        status: response.data.status,
        qdrant: response.data.vector_db, // Map vector_db to qdrant
        vector_count: response.data.chunks_indexed, // Map chunks_indexed to vector_count
        llm_status: response.data.llm_status,
        ...response.data
      };

      return res.status(200).json({
        status: "success",
        nlp_engine: mappedHealth,
      });
    } catch (err) {
      return res.status(503).json({
        status: "error",
        message: "NLP Engine unavailable",
        nlp_engine: null,
      });
    }
  },
};

module.exports = nlpController;
