import express from 'express';
import { getAgentCapabilityStatus, runDualAgentDemo } from '../agents/orchestrator.js';

const router = express.Router();

/**
 * GET /api/agents/status
 */
router.get('/status', (req, res) => {
  res.json({ success: true, ...getAgentCapabilityStatus() });
});

/**
 * POST /api/agents/run-demo
 * Judge-ready dual agent pipeline.
 * body: { jobId?, documents?, candidate?, forceResend? }
 */
router.post('/run-demo', async (req, res) => {
  try {
    let documents = req.body?.documents;
    if (typeof documents === 'string') {
      try {
        documents = JSON.parse(documents);
      } catch {
        documents = [];
      }
    }
    if (!Array.isArray(documents)) documents = [];

    const result = await runDualAgentDemo({
      jobId: req.body?.jobId ?? null,
      vaultDocuments: documents,
      candidate: req.body?.candidate || {},
      subscribeAlerts: req.body?.subscribeAlerts !== false,
      forceResend: req.body?.forceResend !== false
    });

    res.json(result);
  } catch (error) {
    console.error('[agents/run-demo]', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
