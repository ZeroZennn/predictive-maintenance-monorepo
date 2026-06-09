"use strict";

const axios = require("axios");
const chatService = require("../services/chatService");
const logger = require("../config/logger");

const chatController = {
  async query(req, res, next) {
    try {
      const { query, session_id } = req.body;
      const { machine_id: payloadMachineId } = req.body;
      const userId = req.user.id;

      const nlpContextService = require("../services/nlpContextService");

      // Detect machine ID from query text (regex)
      // This OVERRIDES payload machine_id if user explicitly
      // mentions a different machine in their message
      const detectedMachineIds = nlpContextService.detectMachineId(query);
      const detectedMachineId = detectedMachineIds.length > 0
        ? detectedMachineIds[0]
        : null;

      // Priority: regex detection > payload machine_id > null
      const resolvedMachineId = detectedMachineId || payloadMachineId || null;

      // Log override for debugging
      if (detectedMachineId && payloadMachineId && detectedMachineId !== payloadMachineId) {
        logger.info(
          `[Chat] Machine ID override: payload=${payloadMachineId} → ` +
          `detected=${detectedMachineId} from query`
        );
      }

      const activeSessionId = session_id || `SES-${userId}-${Date.now()}`;

      const session = await chatService.getOrCreateSession(
        activeSessionId,
        userId,
        resolvedMachineId,
      );

      await chatService.saveMessage(
        activeSessionId,
        "user",
        query,
        null,
        resolvedMachineId,
      );

      const history = await chatService.getRecentHistory(activeSessionId, 10);

      // Extract historical context from TimescaleDB if a machine is selected
      let formattedTimescaledData = null;
      if (resolvedMachineId) {
        formattedTimescaledData = await nlpContextService.getHistoricalContext(resolvedMachineId);
        if (formattedTimescaledData) {
          logger.info(`[Chat] Injected historical context for ${resolvedMachineId}`);
        }
      }

      const nlpPayload = {
        query,
        machine_ids: resolvedMachineId ? [resolvedMachineId] : [],
        session_id: activeSessionId,
        history: history.slice(0, -1),
        mode: 'auto',
        use_reranker: true,
        use_hybrid: true,
        historical_context: formattedTimescaledData
      };

      const nlpResponse = await axios.post(
        process.env.NLP_ENGINE_URL + "/nlp/query",
        nlpPayload,
        { timeout: 60000 },
      );
      const nlpData = nlpResponse.data;

      await chatService.saveMessage(
        activeSessionId,
        "assistant",
        nlpData.answer,
        nlpData.citations || null,
        resolvedMachineId,
      );

      await chatService.updateSessionTimestamp(activeSessionId);

      logger.info(
        `[Chat] Session ${activeSessionId} | ` +
          `mode: ${nlpData.mode || nlpData.query_mode} | ` +
          `confidence: ${nlpData.confidence} | ` +
          `latency: ${nlpData.latency_ms || nlpData.processing_time_ms}ms`,
      );

      let machineStatus = null;
      if (resolvedMachineId) {
        try {
          const redisClient = require("../config/redisClient");
          const cached = await redisClient.get(
            `machine:${resolvedMachineId}:prediction`,
          );
          if (cached) {
            const pred = JSON.parse(cached);
            machineStatus = {
              machine_id: resolvedMachineId,
              classification: pred.classification,
              health_score: pred.health_score,
              rul_days: pred.rul_days,
              urgency_level: pred.urgency_level,
              cached_at: pred.cached_at,
            };
          }
        } catch (e) {
          // non-blocking — machine_status is optional
        }
      }

      return res.status(200).json({
        status: "success",
        // Primary fields (per brief spec)
        message: nlpData.answer,
        citations: nlpData.citations || [],
        machine_status: machineStatus,
        // Extended fields (for Frontend rich UI)
        session_id: activeSessionId,
        query_id: nlpData.query_id,
        answer: nlpData.answer,
        action_suggestions: nlpData.action_suggestions || [],
        has_live_context:
          nlpData.live_context_used || nlpData.has_live_context || false,
        query_mode: nlpData.mode || nlpData.query_mode,
        confidence: nlpData.confidence,
        machine_id: resolvedMachineId,
        processing_time_ms: nlpData.latency_ms || nlpData.processing_time_ms,
        provider_used: nlpData.provider_used,
        model_used: nlpData.model_used,
        reply: nlpData.answer,
        sources: nlpData.citations || [],
        suggested_actions: nlpData.action_suggestions || [],
      });
    } catch (err) {
      if (err.isAxiosError || err.response) {
        logger.error(`[Chat] NLP Engine error: ${err.message}`);
        const activeSessionId =
          req.body.session_id || `SES-${req.user.id}-${Date.now()}`;
        return res.status(503).json({
          status: "error",
          message: "AI Copilot is temporarily unavailable.",
          session_id: activeSessionId,
          fallback: true,
        });
      }
      next(err);
    }
  },

  async getSessions(req, res, next) {
    try {
      const sessions = await chatService.getUserSessions(req.user.id);
      return res.status(200).json({
        status: "success",
        data: { sessions, total: sessions.length },
      });
    } catch (err) {
      next(err);
    }
  },

  async getSessionMessages(req, res, next) {
    try {
      const { session_id } = req.params;
      const result = await chatService.getSessionMessages(
        session_id,
        req.user.id,
      );
      if (!result) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }
      return res.status(200).json({
        status: "success",
        data: result,
      });
    } catch (err) {
      next(err);
    }
  },

  async deleteSession(req, res, next) {
    try {
      const { session_id } = req.params;
      const deleted = await chatService.deleteSession(session_id, req.user.id);
      if (!deleted) {
        return res.status(404).json({
          status: "error",
          message: "Session not found",
        });
      }
      return res.status(200).json({
        status: "success",
        message: "Session deleted successfully",
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = chatController;
