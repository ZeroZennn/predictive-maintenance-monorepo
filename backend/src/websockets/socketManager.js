'use strict';

const { Server } = require('socket.io');
const logger = require('../config/logger');

class SocketManager {
  constructor() {
    this.io = null;
  }

  /**
   * Attaches Socket.IO to the existing http.Server instance.
   * Must be called once inside server.listen() before any broadcasts.
   * @param {import('http').Server} httpServer
   * @returns {import('socket.io').Server}
   */
  initialize(httpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.io.on('connection', (socket) => {
      logger.info(`[WebSocket] Client connected: ${socket.id}`);

      // Client subscribes to a machine-specific room
      socket.on('join:machine', (machineId) => {
        socket.join(`machine:${machineId}`);
        logger.debug(`[WebSocket] ${socket.id} joined room: machine:${machineId}`);
      });

      // Client unsubscribes from a machine-specific room
      socket.on('leave:machine', (machineId) => {
        socket.leave(`machine:${machineId}`);
        logger.debug(`[WebSocket] ${socket.id} left room: machine:${machineId}`);
      });

      // Client subscribes to the global alerts channel
      socket.on('join:global', () => {
        socket.join('global');
        logger.debug(`[WebSocket] ${socket.id} joined global alerts channel`);
      });

      socket.on('disconnect', (reason) => {
        logger.info(`[WebSocket] Client disconnected: ${socket.id} - ${reason}`);
      });
    });

    logger.info('✅ WebSocket: Socket.IO server initialized.');
    return this.io;
  }

  /**
   * Returns the active Socket.IO instance.
   * Throws if initialize() has not been called yet.
   * @returns {import('socket.io').Server}
   */
  getIO() {
    if (this.io === null) {
      throw new Error('Socket.IO not initialized. Call initialize(server) first.');
    }
    return this.io;
  }
}

// Export singleton — one instance shared across the entire process
module.exports = new SocketManager();
