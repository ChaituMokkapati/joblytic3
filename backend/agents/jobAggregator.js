/**
 * Job Aggregation Agent
 * Live scrape ingest → dedupe by title+agency+deadline → sort by nearest deadline.
 */
import { STANDARD_DOCS } from '../data/commonDocs.js';

function normalizeKey(title, agency, deadline) {
  const t = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const a = String(agency || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const d = String(deadline || '').slice(0, 10);
  return `${t}|${a}|${d}`;
}

/**
 * Deduplicate by job name + organization + deadline; merge sourcePortals.
 */
export function deduplicateJobs(rawJobs) {
  const map = new Map();

  for (const job of rawJobs) {
    const key = normalizeKey(job.title, job.agency, job.deadline);
    if (!map.has(key)) {
      map.set(key, {
        ...job,
        sourcePortals: [job.sourcePortal].filter(Boolean),
        sourcePortal: undefined
      });
    } else {
      const existing = map.get(key);
      if (job.sourcePortal && !existing.sourcePortals.includes(job.sourcePortal)) {
        existing.sourcePortals.push(job.sourcePortal);
      }
    }
  }

  return Array.from(map.values());
}

export function daysUntilDeadline(deadline) {
  const end = new Date(deadline);
  end.setHours(23, 59, 59, 999);
  const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
  return diff;
}

/**
 * Sort by nearest deadline (ascending). Past deadlines sink to end.
 */
export function sortByNearestDeadline(jobs) {
  return [...jobs].sort((a, b) => {
    const da = daysUntilDeadline(a.deadline);
    const db = daysUntilDeadline(b.deadline);
    const scoreA = da < 0 ? 9999 + Math.abs(da) : da;
    const scoreB = db < 0 ? 9999 + Math.abs(db) : db;
    return scoreA - scoreB;
  });
}

/**
 * Full aggregation pipeline: raw scraped jobs → dedupe → assign ids → sort.
 * Pass scraped jobs only — no dummy/seed feed.
 */
export function aggregateJobs(rawJobs = []) {
  const raw = Array.isArray(rawJobs) ? rawJobs : [];
  const deduped = deduplicateJobs(raw);
  const withMeta = deduped.map((job) => {
    const daysRemaining = daysUntilDeadline(job.deadline);
    return {
      id: 0,
      title: job.title,
      agency: job.agency,
      category: job.category,
      posts: job.posts,
      fee: job.fee,
      salary: job.salary,
      location: job.location || 'All India',
      qualification: job.qualification || 'As per notification',
      deadline: job.deadline,
      officialUrl: job.officialUrl || '',
      applyLink: job.applyLink || job.officialUrl || '',
      pdfNotificationUrl: job.pdfNotificationUrl || '',
      sourcePortals: job.sourcePortals || (job.sourcePortal ? [job.sourcePortal] : []),
      requiredDocuments: job.requiredDocuments || STANDARD_DOCS,
      description: `${job.title} — scraped from ${(job.sourcePortals || [job.sourcePortal]).filter(Boolean).join(', ') || 'portal'}`,
      daysRemaining,
      urgencyLevel: daysRemaining <= 3 ? 'URGENT' : daysRemaining <= 7 ? 'WARNING' : 'NORMAL',
      scrapedAt: job.scrapedAt || null
    };
  });

  const sorted = sortByNearestDeadline(withMeta);
  return sorted.map((job, index) => ({ ...job, id: index + 1 }));
}

export function getAggregationStats(rawCount, cleanCount, extra = {}) {
  return {
    rawCount,
    cleanCount,
    duplicatesRemoved: Math.max(0, rawCount - cleanCount),
    sources: extra.sources || [],
    ...extra
  };
}

/**
 * Live scrape all portals (no API keys) → dedupe → sort. No seed data.
 */
export async function aggregateJobsLive() {
  const { scrapeAllPortals } = await import('./portalScraper.js');
  const scrape = await scrapeAllPortals();
  const jobs = aggregateJobs(scrape.scrapedJobs);

  return {
    jobs,
    stats: getAggregationStats(scrape.scrapedJobs.length, jobs.length, {
      liveScrape: true,
      scrapedRaw: scrape.rawCount,
      scrapeDurationMs: scrape.durationMs,
      scrapeSources: scrape.sources,
      scrapedAt: scrape.scrapedAt,
      sources: scrape.sources.filter((s) => s.ok).map((s) => s.source)
    }),
    scrape
  };
}
