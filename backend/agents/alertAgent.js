/**
 * Alert Agent — schedule and fire 7 / 3 / 1 day deadline reminders.
 */
import Alert from '../models/Alert.js';
import Job from '../models/Job.js';
import { isMongoReady } from '../config/db.js';
import { daysUntilDeadline, aggregateJobs } from './jobAggregator.js';
import { dispatchAlertNotification, getNotifyStatus } from '../services/notify.js';

export const ALERT_WINDOWS = [7, 3, 1];

/** In-memory alerts when Mongo is down */
export const memoryAlerts = [];

function alreadySentForWindow(alert, windowDays) {
  const log = alert.sentLog || [];
  return log.some((entry) => entry.windowDays === windowDays);
}

function findJobForAlert(alert, jobs) {
  if (alert.jobId != null) {
    const byId = jobs.find((j) => String(j.id) === String(alert.jobId));
    if (byId) return byId;
  }
  return jobs.find(
    (j) => j.title && alert.jobTitle && j.title.toLowerCase() === alert.jobTitle.toLowerCase()
  );
}

async function loadJobs() {
  if (isMongoReady()) {
    const jobs = await Job.find().lean();
    if (jobs.length) return jobs;
  }
  return aggregateJobs();
}

async function loadActiveAlerts() {
  if (isMongoReady()) {
    return Alert.find({ status: 'ACTIVE' }).lean();
  }
  return memoryAlerts.filter((a) => a.status === 'ACTIVE');
}

async function persistSent(alert, windowDays, dispatchResult) {
  const entry = {
    windowDays,
    sentAt: new Date().toISOString(),
    mode: dispatchResult.mode,
    results: dispatchResult.results
  };

  if (isMongoReady() && alert._id) {
    await Alert.findByIdAndUpdate(alert._id, {
      $push: { sentLog: entry },
      lastSentAt: entry.sentAt
    });
  } else {
    const mem = memoryAlerts.find((a) => a.id === alert.id);
    if (mem) {
      mem.sentLog = mem.sentLog || [];
      mem.sentLog.push(entry);
      mem.lastSentAt = entry.sentAt;
    }
  }

  return entry;
}

/**
 * Run alert sweep: for each ACTIVE subscription, fire if daysLeft ∈ {7,3,1}
 * and that window was not already sent.
 */
export async function runAlertSweep({ forceWindows = null } = {}) {
  const jobs = await loadJobs();
  const alerts = await loadActiveAlerts();
  const fired = [];
  const skipped = [];

  for (const alert of alerts) {
    const job = findJobForAlert(alert, jobs);
    if (!job) {
      skipped.push({ alertId: alert._id || alert.id, reason: 'job not found', jobTitle: alert.jobTitle });
      continue;
    }

    const daysLeft = daysUntilDeadline(job.deadline);
    const windows = alert.windows?.length ? alert.windows : ALERT_WINDOWS;
    const targetWindows = forceWindows || windows;

    for (const windowDays of targetWindows) {
      const matches = daysLeft === windowDays || (forceWindows && forceWindows.includes(windowDays));
      // When forceWindows is set (run-now demo), fire for matching window even if daysLeft differs —
      // but only if daysLeft equals that window OR we force the nearest window.
      const shouldFire = forceWindows
        ? forceWindows.includes(windowDays) && daysLeft === windowDays
        : daysLeft === windowDays;

      if (!shouldFire) continue;

      if (alreadySentForWindow(alert, windowDays) && !forceWindows) {
        skipped.push({
          alertId: alert._id || alert.id,
          reason: `already sent ${windowDays}d window`,
          jobTitle: job.title
        });
        continue;
      }

      // Allow re-fire on run-now when forceWindows provided and already sent — skip duplicate unless force
      if (alreadySentForWindow(alert, windowDays) && forceWindows) {
        skipped.push({
          alertId: alert._id || alert.id,
          reason: `already sent ${windowDays}d (use forceResend)`,
          jobTitle: job.title
        });
        continue;
      }

      const dispatchResult = await dispatchAlertNotification({
        email: alert.email,
        phone: alert.phone,
        jobTitle: job.title,
        deadline: job.deadline,
        applyLink: job.applyLink || job.officialUrl,
        daysLeft,
        windowDays,
        channel: alert.channel
      });

      const entry = await persistSent(alert, windowDays, dispatchResult);
      fired.push({
        alertId: alert._id || alert.id,
        jobTitle: job.title,
        windowDays,
        daysLeft,
        ...entry
      });
    }
  }

  return {
    notify: getNotifyStatus(),
    checked: alerts.length,
    firedCount: fired.length,
    skippedCount: skipped.length,
    fired,
    skipped
  };
}

/**
 * Demo-friendly run: for each alert, pick the closest window among 7/3/1
 * relative to daysLeft (or fire the window that equals daysLeft).
 * If none equal, still send a "preview" for the nearest upcoming window once via forceResend.
 */
export async function runAlertSweepDemo({ forceResend = false } = {}) {
  const jobs = await loadJobs();
  const alerts = await loadActiveAlerts();
  const fired = [];
  const skipped = [];

  for (const alert of alerts) {
    const job = findJobForAlert(alert, jobs);
    if (!job) {
      skipped.push({ alertId: alert._id || alert.id, reason: 'job not found', jobTitle: alert.jobTitle });
      continue;
    }

    const daysLeft = daysUntilDeadline(job.deadline);
    const windows = alert.windows?.length ? alert.windows : ALERT_WINDOWS;

    // Prefer exact match; else nearest window >= daysLeft; else nearest absolute
    let windowDays = windows.find((w) => w === daysLeft);
    if (windowDays == null) {
      const upcoming = windows.filter((w) => w >= daysLeft).sort((a, b) => a - b);
      windowDays = upcoming[0] ?? [...windows].sort((a, b) => Math.abs(a - daysLeft) - Math.abs(b - daysLeft))[0];
    }

    if (!forceResend && alreadySentForWindow(alert, windowDays)) {
      skipped.push({
        alertId: alert._id || alert.id,
        reason: `already sent ${windowDays}d window`,
        jobTitle: job.title
      });
      continue;
    }

    const dispatchResult = await dispatchAlertNotification({
      email: alert.email,
      phone: alert.phone,
      jobTitle: job.title,
      deadline: job.deadline,
      applyLink: job.applyLink || job.officialUrl,
      daysLeft,
      windowDays,
      channel: alert.channel
    });

    const entry = await persistSent(alert, windowDays, dispatchResult);
    fired.push({
      alertId: alert._id || alert.id,
      jobTitle: job.title,
      windowDays,
      daysLeft,
      ...entry
    });
  }

  return {
    notify: getNotifyStatus(),
    checked: alerts.length,
    firedCount: fired.length,
    skippedCount: skipped.length,
    fired,
    skipped,
    demo: true
  };
}
