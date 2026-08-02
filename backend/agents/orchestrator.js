/**
 * Dual-agent orchestrator for hackathon judge demo.
 * Runs Job Aggregator → Document Checklist Agent → Alert Agent in sequence.
 */
import {
  aggregateJobsLive,
  getAggregationStats,
  daysUntilDeadline
} from './jobAggregator.js';
import { runDocumentChecklistAgent } from './documentAgent.js';
import { runAlertSweepDemo, ALERT_WINDOWS, memoryAlerts } from './alertAgent.js';
import Alert from '../models/Alert.js';
import { isMongoReady } from '../config/db.js';
import { getNotifyStatus } from '../services/notify.js';

function nowStamp() {
  return new Date().toISOString().replace('T', ' ').replace('Z', '');
}

export function getAgentCapabilityStatus() {
  return {
    notify: getNotifyStatus(),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    alertWindows: ALERT_WINDOWS,
    stack: {
      frontend: 'Vite + React + Tailwind',
      backend: 'Express (Node)',
      database: 'MongoDB',
      ai: process.env.OPENAI_API_KEY ? 'OpenAI live' : 'Rule engine (paste OPENAI_API_KEY for GPT extraction)',
      notifications: getNotifyStatus().liveCapable
        ? 'Twilio + Resend live'
        : 'Demo mode (paste Twilio/Resend keys + NOTIFY_MODE=live)'
    }
  };
}

/**
 * Full dual-agent run for judges.
 */
export async function runDualAgentDemo({
  jobId = null,
  vaultDocuments = [],
  candidate = {},
  subscribeAlerts = true,
  forceResend = true
} = {}) {
  const traces = [];
  const push = (event, payload = {}) => {
    traces.push({ timestamp: nowStamp(), event, ...payload });
  };

  // ── Agent 0: Job Aggregation (LIVE SCRAPE — no API keys) ────────────────
  push('AGENT_INIT', {
    agent: 'JobAggregatorAgent',
    details: 'Live scrape SSC / UPSC / IBPS / RRB + public boards (no API keys), then dedupe'
  });

  let jobs;
  let stats;
  try {
    const live = await aggregateJobsLive();
    jobs = live.jobs;
    stats = live.stats;
    push('TOOL_CALL', {
      tool: 'scrape_government_portals',
      args: { sources: live.scrape?.sources?.map((s) => s.source) || [] },
      response: {
        status: 'SUCCESS',
        scrapeSources: live.scrape?.sources,
        scrapedRaw: live.scrape?.rawCount,
        durationMs: live.scrape?.durationMs
      }
    });
  } catch (err) {
    jobs = [];
    stats = getAggregationStats(0, 0, { liveScrape: false, error: err.message });
    push('TOOL_CALL', {
      tool: 'scrape_government_portals',
      response: { status: 'ERROR', error: err.message, cleanCount: 0 }
    });
  }

  push('TOOL_CALL', {
    tool: 'dedupe_by_title_agency_deadline',
    response: {
      status: 'SUCCESS',
      rawCount: stats.rawCount,
      cleanCount: stats.cleanCount,
      duplicatesRemoved: stats.duplicatesRemoved
    }
  });

  const selected =
    jobs.find((j) => String(j.id) === String(jobId)) ||
    jobs.find((j) => (j.daysRemaining ?? daysUntilDeadline(j.deadline)) <= 7) ||
    jobs[0];

  push('JOB_SELECTED', {
    jobId: selected?.id,
    title: selected?.title,
    deadline: selected?.deadline,
    daysRemaining: selected ? daysUntilDeadline(selected.deadline) : null,
    sourcePortals: selected?.sourcePortals || []
  });

  // ── Agent 2: Document Checklist ───────────────────────────────────────────
  push('AGENT_INIT', {
    agent: 'DocumentChecklistAgent',
    details: 'Extract required docs, normalize names, compare vault → DONE/MISSING'
  });

  const checklistResult = await runDocumentChecklistAgent({
    jobRequiredDocuments: selected?.requiredDocuments || [],
    vaultDocuments
  });

  push('TOOL_CALL', {
    tool: 'evaluate_eligibility_and_checklist',
    args: {
      jobId: selected?.id,
      vaultCount: vaultDocuments.length,
      extractMethod: checklistResult.extractMethod
    },
    response: {
      status: 'EVALUATION_COMPLETE',
      summary: checklistResult.summary,
      openaiUsed: checklistResult.openaiUsed,
      displayLines: checklistResult.displayLines
    }
  });

  // ── Agent 1: Alert Agent ──────────────────────────────────────────────────
  push('AGENT_INIT', {
    agent: 'AlertAgent',
    details: `Schedule WhatsApp+Email for windows ${ALERT_WINDOWS.join('/')}`
  });

  if (subscribeAlerts && selected) {
    const alertData = {
      jobId: selected.id,
      jobTitle: selected.title,
      email: (candidate.email || 'rahul.sharma@example.com').toLowerCase(),
      phone: candidate.phone || '+919876543210',
      channel: 'Email & WhatsApp',
      windows: [...ALERT_WINDOWS],
      frequency: '7, 3, 1 days before deadline',
      status: 'ACTIVE',
      sentLog: [],
      createdAt: new Date().toISOString()
    };

    if (isMongoReady()) {
      await Alert.findOneAndUpdate(
        { email: alertData.email, jobTitle: alertData.jobTitle },
        alertData,
        { upsert: true, new: true }
      );
    } else {
      const existing = memoryAlerts.find(
        (a) => a.email === alertData.email && a.jobTitle === alertData.jobTitle
      );
      if (!existing) memoryAlerts.push({ id: `alert-${Date.now()}`, ...alertData });
    }

    push('TOOL_CALL', {
      tool: 'subscribe_deadline_alerts',
      args: { windows: ALERT_WINDOWS, channel: alertData.channel },
      response: { status: 'ACTIVE', email: alertData.email, phone: alertData.phone }
    });
  }

  const alertResult = await runAlertSweepDemo({ forceResend });

  push('TOOL_CALL', {
    tool: 'schedule_whatsapp_and_email_alert',
    args: { provider: 'Twilio WhatsApp + Resend Email', windows: ALERT_WINDOWS },
    response: {
      status: 'DISPATCHED',
      mode: alertResult.notify?.mode,
      firedCount: alertResult.firedCount,
      fired: alertResult.fired
    }
  });

  push('AGENT_COMPLETE', {
    agent: 'DualAgentPipeline',
    details: 'Aggregation → Checklist → Alerts finished'
  });

  return {
    success: true,
    capabilities: getAgentCapabilityStatus(),
    aggregation: stats,
    selectedJob: selected,
    checklist: checklistResult,
    alerts: alertResult,
    traces,
    pitch: {
      tagline: 'From 25 Portals to 1 Dashboard. From Confusion to Selection.',
      agents: ['Alert Agent (7/3/1 Twilio+Resend)', 'Document Checklist Agent (PDF+NLP+Vault)'],
      outcome: {
        dedupedJobs: stats.cleanCount,
        duplicatesRemoved: stats.duplicatesRemoved,
        checklistReady: checklistResult.summary?.done,
        checklistGaps: (checklistResult.summary?.missing || 0) + (checklistResult.summary?.formatFix || 0),
        alertsFired: alertResult.firedCount
      }
    }
  };
}
