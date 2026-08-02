/**
 * Persist a full live scrape into Mongo (same behavior as /api/agents/scrape/run).
 */
import { runScrapingAgent } from '../agents/portalScraper.js';
import { aggregateJobs, getAggregationStats } from '../agents/jobAggregator.js';
import Job from '../models/Job.js';
import { isMongoReady } from '../config/db.js';

let scrapeInFlight = false;
let lastScheduledScrape = null;

export function getScrapeSchedulerStatus() {
  return {
    inFlight: scrapeInFlight,
    lastRun: lastScheduledScrape,
    playwright: process.env.SCRAPE_USE_PLAYWRIGHT !== '0',
    cronEnabled: process.env.SCRAPE_CRON_ENABLED !== '0',
    cronExpr: process.env.SCRAPE_CRON || '0 */6 * * *'
  };
}

export async function runScheduledScrape({ reason = 'manual' } = {}) {
  if (scrapeInFlight) {
    return { skipped: true, reason: 'Scrape already in progress' };
  }

  scrapeInFlight = true;
  const startedAt = Date.now();
  try {
    console.log(`[ScrapeCron] Starting scrape (${reason})…`);
    const scrape = await runScrapingAgent();
    const jobs = aggregateJobs(scrape.scrapedJobs);
    const stats = getAggregationStats(scrape.rawCount, jobs.length, {
      liveScrape: true,
      scheduled: true,
      reason,
      scrapedRaw: scrape.rawCount,
      scrapeDurationMs: scrape.durationMs,
      scrapeSources: scrape.sources,
      scrapedAt: scrape.scrapedAt,
      sources: scrape.sources.filter((s) => s.ok).map((s) => s.source)
    });

    if (isMongoReady()) {
      await Job.deleteMany({});
      if (jobs.length) await Job.insertMany(jobs);
    }

    lastScheduledScrape = {
      at: new Date().toISOString(),
      reason,
      durationMs: Date.now() - startedAt,
      count: jobs.length,
      okPortals: scrape.sources.filter((s) => s.ok).length,
      totalPortals: scrape.sources.length,
      stats
    };

    console.log(
      `[ScrapeCron] Done in ${lastScheduledScrape.durationMs}ms — ${jobs.length} jobs · ${lastScheduledScrape.okPortals}/${lastScheduledScrape.totalPortals} portals OK`
    );
    return { skipped: false, ...lastScheduledScrape };
  } catch (err) {
    lastScheduledScrape = {
      at: new Date().toISOString(),
      reason,
      error: err.message,
      durationMs: Date.now() - startedAt
    };
    console.error('[ScrapeCron] Failed:', err.message);
    throw err;
  } finally {
    scrapeInFlight = false;
  }
}
