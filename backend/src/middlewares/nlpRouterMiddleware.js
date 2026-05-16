'use strict';

const nlpContextService = require('../services/nlpContextService');
const logger = require('../config/logger');

// Keyword signals that the user is asking about a specific machine's condition.
// Match against lowercased query - any hit + a machine ID → machine_specific mode.
const MACHINE_SPECIFIC_KEYWORDS = [
  'kondisi', 'status', 'rul', 'health', 'skor', 'score',
  'suhu', 'temperature', 'getaran', 'vibration', 'tekanan',
  'pressure', 'rpm', 'konsumsi', 'kebisingan', 'kelembaban',
  'breakdown', 'rusak', 'panas', 'overheat', 'anomali',
  'anomaly', 'prediksi', 'prediction', 'sisa umur', 'maintenance',
  'servis', 'jadwal', 'kapan', 'aman', 'bahaya', 'kritis',
  'warning', 'critical', 'healthy',
];

/**
 * nlpRouter - rule-based intent classifier middleware.
 *
 * Classifies each query as 'general' or 'machine_specific',
 *
 * Classification rules (applied in order, OR logic):
 *   Rule 1 - explicit machine_id in request body
 *   Rule 2 - machine ID pattern (M-XX) detected in query text
 *   Rule 3 - machine-specific keyword detected AND at least one machine ID known
 */
async function nlpRouter(req, res, next) {
  // Extract request fields
  const { query, machine_id, session_id } = req.body;

  // Validate query presence
  if (!query || query.trim() === '') {
    return res.status(400).json({
      status:  'error',
      message: 'Query is required',
    });
  }

  // Detect machine IDs from both sources
  const explicitMachineId = machine_id || null;
  const detectedIds       = nlpContextService.detectMachineId(query);

  const allMachineIds = [
    ...new Set([
      ...(explicitMachineId ? [explicitMachineId] : []),
      ...detectedIds,
    ]),
  ];

  // Determine intent mode
  let isSpecific = false;

  // explicit machine_id provided in body
  if (explicitMachineId) {
    isSpecific = true;
  }

  // machine ID extracted from query text
  if (detectedIds.length > 0) {
    isSpecific = true;
  }

  // keyword detected AND we know at least one machine
  if (!isSpecific && allMachineIds.length > 0) {
    const queryLower = query.toLowerCase();
    const hasKeyword = MACHINE_SPECIFIC_KEYWORDS.some(
      (kw) => queryLower.includes(kw)
    );
    if (hasKeyword) {
      isSpecific = true;
    }
  }

  const mode = isSpecific ? 'machine_specific' : 'general';

  // Build live context (primary machine only, if specific)
  let liveContext = null;
  if (isSpecific && allMachineIds.length > 0) {
    liveContext = await nlpContextService.buildContext(allMachineIds[0]);
  }

  // Attach routing decision to request
  req.nlpRouting = {
    mode,
    machine_ids: allMachineIds,
    live_context: liveContext,
    session_id:   session_id || `SES-${Date.now()}`,
  };

  logger.info(
    `[NLPRouter] mode: ${mode} | ` +
    `machines: [${allMachineIds.join(', ')}] | ` +
    `context: ${liveContext ? 'injected' : 'none'} | ` +
    `query: "${query.substring(0, 50)}..."`
  );

  // Continue to controller
  next();
}

module.exports = nlpRouter;
