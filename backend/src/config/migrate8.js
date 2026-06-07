"use strict";

require("dotenv").config();

const logger = require("./logger");
const pgPool = require("./postgresClient");

async function migrateV8() {
  try {
    // create chat_sessions table
    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS chat_sessions (
            id            SERIAL PRIMARY KEY,
            session_id    VARCHAR(50) UNIQUE NOT NULL,
            user_id       INTEGER REFERENCES users(id),
            machine_id    VARCHAR(10),
            title         VARCHAR(255),
            created_at    TIMESTAMPTZ DEFAULT NOW(),
            updated_at    TIMESTAMPTZ DEFAULT NOW()
        );
    `);
    
    // create chat_messages table
    await pgPool.query(`
        CREATE TABLE IF NOT EXISTS chat_messages (
            id            SERIAL PRIMARY KEY,
            session_id    VARCHAR(50) NOT NULL REFERENCES chat_sessions(session_id),
            role          VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
            content       TEXT NOT NULL,
            citations     JSONB,
            machine_id    VARCHAR(10),
            created_at    TIMESTAMPTZ DEFAULT NOW()
        );
    `);

    // All indexing for chat_sessions and chat_messages
    await pgPool.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id
        ON chat_sessions(user_id);

        CREATE INDEX IF NOT EXISTS idx_chat_sessions_session_id
        ON chat_sessions(session_id);

        CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id
        ON chat_messages(session_id);
    `);

    logger.info("✅ V8: chat_sessions and chat_messages tables ready.");
  } catch (err) {
    logger.error(`PostgreSQL V8 migration error: ${err.message}`);
    throw err;
  }
}

async function runMigrationsV8() {
    logger.info("Starting migrations V8...");

    try {
        await migrateV8();
        logger.info("✅ All V8 migrations completed.");
    } catch (err) {
        logger.error(`❌ Migration V8 failed: ${err.message}`);
        process.exit(1);
    } finally {
        await pgPool.end();
    }
}

runMigrationsV8();