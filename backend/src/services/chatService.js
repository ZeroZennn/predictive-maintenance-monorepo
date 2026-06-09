'use strict';

const pgPool = require('../config/postgresClient');
const logger = require('../config/logger');

const chatService = {
  async getOrCreateSession(sessionId, userId, machineId = null) {
    try {
      const result = await pgPool.query(
        'SELECT * FROM chat_sessions WHERE session_id = $1',
        [sessionId]
      );
      if (result.rows.length > 0) {
        return result.rows[0];
      }
      const title = machineId ? `Chat — ${machineId}` : 'General Chat';
      const insertResult = await pgPool.query(
        `INSERT INTO chat_sessions (session_id, user_id, machine_id, title)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [sessionId, userId, machineId, title]
      );
      return insertResult.rows[0];
    } catch (err) {
      throw err;
    }
  },

  async getRecentHistory(sessionId, limit = 10) {
    try {
      const result = await pgPool.query(
        `SELECT role, content FROM chat_messages
         WHERE session_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [sessionId, limit]
      );
      return result.rows.reverse();
    } catch (err) {
      return [];
    }
  },

  async saveMessage(sessionId, role, content, citations = null, machineId = null) {
    try {
      const citationsJson = Array.isArray(citations) ? JSON.stringify(citations) : null;
      const result = await pgPool.query(
        `INSERT INTO chat_messages (session_id, role, content, citations, machine_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [sessionId, role, content, citationsJson, machineId]
      );
      return result.rows[0];
    } catch (err) {
      logger.error(`[ChatService] Failed to save message: ${err.message}`);
      return null;
    }
  },

  async getUserSessions(userId) {
    try {
      const result = await pgPool.query(
        `SELECT 
          cs.*,
          (SELECT content FROM chat_messages 
           WHERE session_id = cs.session_id 
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM chat_messages 
           WHERE session_id = cs.session_id 
           ORDER BY created_at DESC LIMIT 1) as last_message_at,
          (SELECT COUNT(*) FROM chat_messages 
           WHERE session_id = cs.session_id) as message_count
         FROM chat_sessions cs
         WHERE cs.user_id = $1
         ORDER BY cs.updated_at DESC`,
        [userId]
      );
      return result.rows;
    } catch (err) {
      return [];
    }
  },

  async getSessionMessages(sessionId, userId) {
    try {
      const sessionResult = await pgPool.query(
        'SELECT * FROM chat_sessions WHERE session_id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      if (sessionResult.rows.length === 0) return null;
      
      const messagesResult = await pgPool.query(
        'SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC',
        [sessionId]
      );
      return {
        session: sessionResult.rows[0],
        messages: messagesResult.rows
      };
    } catch (err) {
      throw err;
    }
  },

  async deleteSession(sessionId, userId) {
    try {
      await pgPool.query('DELETE FROM chat_messages WHERE session_id = $1', [sessionId]);
      const result = await pgPool.query(
        'DELETE FROM chat_sessions WHERE session_id = $1 AND user_id = $2',
        [sessionId, userId]
      );
      return result.rowCount > 0;
    } catch (err) {
      throw err;
    }
  },

  async updateSessionTimestamp(sessionId) {
    try {
      await pgPool.query(
        'UPDATE chat_sessions SET updated_at = NOW() WHERE session_id = $1',
        [sessionId]
      );
    } catch (err) {
      // ignore error silently
    }
  }
};

module.exports = chatService;
