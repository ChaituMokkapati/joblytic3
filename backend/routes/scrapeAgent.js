import express from 'express';
import { runScrapingAgent, SCRAPE_TOOLS } from '../agents/portalScraper.js';
import { aggregateJobs, getAggregationStats } from '../agents/jobAggregator.js';
import Job from '../models/Job.js';
import { isMongoReady } from '../config/db.js';

const router = express.Router();

router.get('/tools', (req, res) => {
  res.json({
    success: true,
    agent: 'ScrapingAgent',
    tools: SCRAPE_TOOLS.map((t) => ({ id: t.id, label: t.label })),
    note: 'No API keys — RSS → HTTP → Playwright fallback for JS/Cloudflare portals'
  });
});

/** Trigger the same path used by the scrape cron (manual). */
router.post('/run-scheduled', async (req, res) => {
  try {
    const { runScheduledScrape, getScrapeSchedulerStatus } = await import('../services/scrapeScheduler.js');
    const result = await runScheduledScrape({ reason: 'api' });
    res.json({ success: true, scheduler: getScrapeSchedulerStatus(), result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/run', async (req, res) => {
  try {
    const sources = Array.isArray(req.body?.sources) ? req.body.sources : null;
    const persist = req.body?.persist !== false;

    const scrape = await runScrapingAgent({ sources });
    const jobs = aggregateJobs(scrape.scrapedJobs);
    const stats = getAggregationStats(scrape.rawCount, jobs.length, {
      liveScrape: true,
      scrapedRaw: scrape.rawCount,
      scrapeDurationMs: scrape.durationMs,
      scrapeSources: scrape.sources,
      scrapedAt: scrape.scrapedAt,
      sources: scrape.sources.filter((s) => s.ok).map((s) => s.source)
    });

    if (persist && isMongoReady()) {
      await Job.deleteMany({});
      if (jobs.length) await Job.insertMany(jobs);
    }

    res.json({
      success: true,
      message: 'Scraping Agent finished portal crawl + dedupe (live only, no seed).',
      agent: scrape.agent,
      durationMs: scrape.durationMs,
      traces: scrape.traces,
      sources: scrape.sources,
      stats,
      count: jobs.length,
      jobs: jobs.slice(0, 50),
      sample: jobs.slice(0, 8).map((j) => ({
        title: j.title,
        agency: j.agency,
        deadline: j.deadline,
        sourcePortals: j.sourcePortals,
        applyLink: j.applyLink
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Sequential scrape with live SSE progress (one portal at a time).
 * Events: init | portal_start | portal_done | portal_error | complete | error
 */
router.post('/run-stream', async (req, res) => {
  const sources = Array.isArray(req.body?.sources) ? req.body.sources : null;
  const persist = req.body?.persist !== false;

  const tools = sources?.length
    ? SCRAPE_TOOLS.filter((t) => sources.includes(t.id))
    : SCRAPE_TOOLS;

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const startedAt = Date.now();
  const scrapedJobs = [];
  const sourceResults = [];

  try {
    send({
      event: 'init',
      agent: 'ScrapingAgent',
      portals: tools.map((t) => ({ id: t.id, label: t.label })),
      total: tools.length
    });

    for (const tool of tools) {
      send({ event: 'portal_start', source: tool.id, label: tool.label });
      const t0 = Date.now();
      try {
        const jobs = await tool.fn();
        const durationMs = Date.now() - t0;
        scrapedJobs.push(...jobs);
        const row = {
          source: tool.id,
          label: tool.label,
          ok: true,
          count: jobs.length,
          error: null,
          durationMs
        };
        sourceResults.push(row);
        send({ event: 'portal_done', ...row });
      } catch (err) {
        const row = {
          source: tool.id,
          label: tool.label,
          ok: false,
          count: 0,
          error: err.message,
          durationMs: Date.now() - t0
        };
        sourceResults.push(row);
        send({ event: 'portal_error', ...row });
      }
    }

    const jobs = aggregateJobs(scrapedJobs);
    const stats = getAggregationStats(scrapedJobs.length, jobs.length, {
      liveScrape: true,
      scrapedRaw: scrapedJobs.length,
      scrapeDurationMs: Date.now() - startedAt,
      scrapeSources: sourceResults,
      scrapedAt: new Date().toISOString(),
      sources: sourceResults.filter((s) => s.ok).map((s) => s.source)
    });

    if (persist && isMongoReady()) {
      await Job.deleteMany({});
      if (jobs.length) await Job.insertMany(jobs);
    }

    send({
      event: 'complete',
      success: true,
      durationMs: Date.now() - startedAt,
      sources: sourceResults,
      stats,
      count: jobs.length,
      jobs,
      sample: jobs.slice(0, 8).map((j) => ({
        title: j.title,
        agency: j.agency,
        deadline: j.deadline,
        sourcePortals: j.sourcePortals,
        applyLink: j.applyLink
      }))
    });
  } catch (error) {
    send({ event: 'error', error: error.message });
  } finally {
    res.end();
  }
});

export default router;
