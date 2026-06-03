'use strict';

const axios = require('axios');
const chatService = require('../services/chatService');
const logger = require('../config/logger');

const chatController = {
  async query(req, res, next) {
    try {
      const { query, machine_id, session_id } = req.body;
      const userId = req.user.id;

      const activeSessionId = session_id || `SES-${userId}-${Date.now()}`;

      const session = await chatService.getOrCreateSession(
        activeSessionId, userId, machine_id
      );

      await chatService.saveMessage(
        activeSessionId, 'user', query, null, machine_id
      );

      const history = await chatService.getRecentHistory(
        activeSessionId, 10
      );

      const nlpPayload = {
        query,
        machine_ids: machine_id ? [machine_id] : [],
        session_id: activeSessionId,
        history: history.slice(0, -1)
      };

      const nlpResponse = await axios.post(
        process.env.NLP_ENGINE_URL + '/nlp/query',
        nlpPayload,
        { timeout: 60000 }
      );
      const nlpData = nlpResponse.data;

      await chatService.saveMessage(
        activeSessionId,
        'assistant',
        nlpData.answer,
        nlpData.citations || null,
        machine_id
      );

      await chatService.updateSessionTimestamp(activeSessionId);

      logger.info(
        `[Chat] Session ${activeSessionId} | ` +
        `mode: ${nlpData.mode || nlpData.query_mode} | ` +
        `confidence: ${nlpData.confidence} | ` +
        `latency: ${nlpData.latency_ms || nlpData.processing_time_ms}ms`
      );

      return res.status(200).json({
        status: 'success',
        data: {
          session_id: activeSessionId,
          query_id: nlpData.query_id,
          answer: nlpData.answer,
          citations: nlpData.citations || [],
          action_suggestions: nlpData.action_suggestions || [],
          has_live_context: nlpData.live_context_used || nlpData.has_live_context || false,
          query_mode: nlpData.mode || nlpData.query_mode,
          confidence: nlpData.confidence,
          machine_id: machine_id || null,
          processing_time_ms: nlpData.latency_ms || nlpData.processing_time_ms,
          provider_used: nlpData.provider_used,
          model_used: nlpData.model_used
        }
      });
    } catch (err) {
      if (err.isAxiosError || err.response) {
        logger.error(`[Chat] NLP Engine error: ${err.message}`);
        const activeSessionId = req.body.session_id || `SES-${req.user.id}-${Date.now()}`;
        return res.status(503).json({
          status: 'error',
          message: 'AI Copilot is temporarily unavailable.',
          session_id: activeSessionId,
          fallback: true
        });
      }
      next(err);
    }
  },

  async getSessions(req, res, next) {
    try {
      const sessions = await chatService.getUserSessions(req.user.id);
      return res.status(200).json({
        status: 'success',
        data: { sessions, total: sessions.length }
      });
    } catch (err) {
      next(err);
    }
  },

  async getSessionMessages(req, res, next) {
    try {
      const { session_id } = req.params;
      const result = await chatService.getSessionMessages(session_id, req.user.id);
      if (!result) {
        return res.status(404).json({
          status: 'error',
          message: 'Session not found'
        });
      }
      return res.status(200).json({
        status: 'success',
        data: result
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
          status: 'error',
          message: 'Session not found'
        });
      }
      return res.status(200).json({
        status: 'success',
        message: 'Session deleted successfully'
      });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = chatController;
