import express from 'express';
import Alert from '../models/Alert.js';
import { isMongoReady } from '../config/db.js';
import { memoryAlerts, runAlertSweep, runAlertSweepDemo, ALERT_WINDOWS } from '../agents/alertAgent.js';
import { getNotifyStatus } from '../services/notify.js';

const router = express.Router();

/**
 * GET /api/alerts
 */
router.get('/', async (req, res) => {
  try {
    if (isMongoReady()) {
      const mongoAlerts = await Alert.find().sort({ createdAt: -1 }).lean();
      return res.json({
        success: true,
        count: mongoAlerts.length,
        notify: getNotifyStatus(),
        alerts: mongoAlerts
      });
    }

    res.json({
      success: true,
      count: memoryAlerts.length,
      notify: getNotifyStatus(),
      alerts: memoryAlerts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/alerts/status — notify provider status
 */
router.get('/status', (req, res) => {
  res.json({ success: true, notify: getNotifyStatus(), windows: ALERT_WINDOWS });
});

/**
 * POST /api/alerts/run-now — demo / manual sweep
 * body: { forceResend?: boolean, strict?: boolean }
 */
router.post('/run-now', async (req, res) => {
  try {
    const forceResend = Boolean(req.body?.forceResend);
    const strict = Boolean(req.body?.strict);
    const result = strict
      ? await runAlertSweep()
      : await runAlertSweepDemo({ forceResend });

    res.json({
      success: true,
      message: `Alert sweep complete. Fired ${result.firedCount} notification(s).`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Subscribe handler
 */
const handleSubscribe = async (req, res) => {
  const { jobId, jobTitle, email, phone, channel, frequency, windows, userId } = req.body;

  if (!email || !jobTitle) {
    return res.status(400).json({
      success: false,
      error: 'Email and job title are required to subscribe.'
    });
  }

  const alertData = {
    jobId: jobId ?? null,
    jobTitle,
    email: email.toLowerCase().trim(),
    phone: phone || '',
    userId: userId || null,
    channel: channel || 'Email & WhatsApp',
    frequency: frequency || '7, 3, 1 days before deadline',
    windows: Array.isArray(windows) && windows.length ? windows : [7, 3, 1],
    status: 'ACTIVE',
    sentLog: [],
    lastSentAt: null,
    createdAt: new Date().toISOString()
  };

  try {
    if (isMongoReady()) {
      const createdAlert = await Alert.create(alertData);
      return res.status(201).json({
        success: true,
        message: `Alert activated for ${jobTitle}. Windows: ${alertData.windows.join(', ')} days.`,
        alert: createdAlert,
        notify: getNotifyStatus()
      });
    }

    const memoryAlert = { id: `alert-${Date.now()}`, ...alertData };
    memoryAlerts.push(memoryAlert);

    res.status(201).json({
      success: true,
      message: `Alert activated for ${jobTitle} (In-Memory).`,
      alert: memoryAlert,
      notify: getNotifyStatus()
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/subscribe', handleSubscribe);
router.post('/', handleSubscribe);

/**
 * DELETE /api/alerts/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    if (isMongoReady()) {
      const deleted = await Alert.findByIdAndDelete(req.params.id);
      if (deleted) {
        return res.json({ success: true, message: 'Alert cancelled (MongoDB).', alert: deleted });
      }
    }

    const alertIndex = memoryAlerts.findIndex(
      (a) => a.id === req.params.id || String(a._id) === req.params.id
    );
    if (alertIndex === -1) {
      return res.status(404).json({ success: false, error: 'Alert not found.' });
    }

    const removedAlert = memoryAlerts.splice(alertIndex, 1)[0];
    res.json({
      success: true,
      message: `Alert subscription for ${removedAlert.jobTitle} cancelled.`,
      alert: removedAlert
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
