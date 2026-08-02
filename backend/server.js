import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';

import jobsRouter from './routes/jobs.js';
import verifyRouter from './routes/verify.js';
import alertsRouter from './routes/alerts.js';
import applicationsRouter from './routes/applications.js';
import agentsRouter from './routes/agents.js';
import scrapeAgentRouter from './routes/scrapeAgent.js';
import vaultRouter from './routes/vault.js';
import instituteRouter from './routes/institute.js';
import authRouter, { handleSignup, handleLogin, handleForgotPassword, handleResetPassword } from './routes/auth.js';
import { connectDB, getDBStatus } from './config/db.js';
import { runAlertSweep } from './agents/alertAgent.js';
import { getNotifyStatus } from './services/notify.js';
import { getAgentCapabilityStatus } from './agents/orchestrator.js';
import { runScheduledScrape, getScrapeSchedulerStatus } from './services/scrapeScheduler.js';
import { closeBrowser } from './services/browserFetch.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.post('/api/signup', handleSignup);
app.post('/api/login', handleLogin);
app.post('/api/forgot-password', handleForgotPassword);
app.post('/api/reset-password', handleResetPassword);
app.use('/api/auth', authRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/verify-docs', verifyRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/agents', agentsRouter);
app.use('/api/agents/scrape', scrapeAgentRouter);
app.use('/api/vault', vaultRouter);
app.use('/api/institute', instituteRouter);

app.get('/', (req, res) => {
  if (req.accepts('html')) {
    return res.send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>AMB SaaS Express Backend API</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #080c14; color: #f8fafc; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #0f172a; border: 1px solid #334155; padding: 2.5rem; border-radius: 16px; max-width: 520px; text-align: center; }
            h1 { color: #38bdf8; margin-bottom: 0.5rem; font-size: 1.8rem; }
            p { color: #94a3b8; font-size: 0.95rem; line-height: 1.5; }
            .btn { display: inline-block; background: linear-gradient(135deg, #10b981, #0d9488); color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; margin-top: 1.5rem; }
            .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); padding: 4px 14px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">Backend Express Server Running</div>
            <h1>AMB SaaS Job Portal API</h1>
            <p>Joblytic agents: Alert (7/3/1), Document Checklist, Job Aggregation + Application Tracker.</p>
            <a href="http://localhost:3000" class="btn">Open AMB Web Application UI (Port 3000)</a>
          </div>
        </body>
      </html>
    `);
  }

  res.json({
    name: 'AMB SaaS Job Portal Express Backend',
    status: 'AMB Backend Running',
    port: PORT,
    frontendUrl: 'http://localhost:3000',
    notify: getNotifyStatus(),
    endpoints: {
      health: `http://localhost:${PORT}/api/health`,
      jobs: `http://localhost:${PORT}/api/jobs`,
      jobsRefresh: `http://localhost:${PORT}/api/jobs/refresh`,
      verifyDocs: `http://localhost:${PORT}/api/verify-docs`,
      checklist: `http://localhost:${PORT}/api/verify-docs/checklist`,
      alerts: `http://localhost:${PORT}/api/alerts`,
      alertsRunNow: `http://localhost:${PORT}/api/alerts/run-now`,
      applications: `http://localhost:${PORT}/api/applications`
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'AMB Backend Running',
    database: getDBStatus(),
    notify: getNotifyStatus(),
    agents: getAgentCapabilityStatus(),
    scrape: getScrapeSchedulerStatus(),
    endpoints: {
      agentsStatus: '/api/agents/status',
      agentsRunDemo: 'POST /api/agents/run-demo',
      jobsRefresh: 'POST /api/jobs/refresh',
      scrapeRun: 'POST /api/agents/scrape/run',
      checklist: 'POST /api/verify-docs/checklist',
      alertsRunNow: 'POST /api/alerts/run-now'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Daily Alert Agent sweep at 09:00 server time
cron.schedule('0 9 * * *', async () => {
  try {
    console.log('[AlertAgent] Daily cron sweep starting...');
    const result = await runAlertSweep();
    console.log(`[AlertAgent] Cron done. Fired=${result.firedCount} skipped=${result.skippedCount}`);
  } catch (err) {
    console.error('[AlertAgent] Cron failed:', err.message);
  }
});

// Scheduled portal scrape (default every 6 hours). Set SCRAPE_CRON_ENABLED=0 to disable.
const scrapeCronExpr = process.env.SCRAPE_CRON || '0 */6 * * *';
if (process.env.SCRAPE_CRON_ENABLED !== '0') {
  if (cron.validate(scrapeCronExpr)) {
    cron.schedule(scrapeCronExpr, async () => {
      try {
        await runScheduledScrape({ reason: 'cron' });
      } catch (err) {
        console.error('[ScrapeCron] schedule tick failed:', err.message);
      }
    });
    console.log(`[ScrapeCron] Enabled — schedule "${scrapeCronExpr}" (Playwright ${process.env.SCRAPE_USE_PLAYWRIGHT === '0' ? 'off' : 'on'})`);
  } else {
    console.warn(`[ScrapeCron] Invalid SCRAPE_CRON="${scrapeCronExpr}" — scheduler not started`);
  }
} else {
  console.log('[ScrapeCron] Disabled (SCRAPE_CRON_ENABLED=0)');
}

const server = app.listen(PORT, () => {
  console.log(`AMB Backend running on http://localhost:${PORT}`);
  console.log(`Notify mode: ${getNotifyStatus().mode}`);
});

async function shutdown(signal) {
  console.log(`\n${signal} received — shutting down…`);
  await closeBrowser().catch(() => {});
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 4000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use by another process.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
