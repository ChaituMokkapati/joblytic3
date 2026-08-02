import express from 'express';
import Job from '../models/Job.js';
import { isMongoReady } from '../config/db.js';
import {
  aggregateJobsLive,
  getAggregationStats,
  daysUntilDeadline,
  sortByNearestDeadline
} from '../agents/jobAggregator.js';

const router = express.Router();

let memoryJobs = [];
let lastRefreshAt = null;
let lastScrapeMeta = null;

const refreshMemoryJobs = async () => {
  const result = await aggregateJobsLive();
  memoryJobs = result.jobs;
  lastScrapeMeta = result;
  lastRefreshAt = new Date().toISOString();
  return result;
};

const syncJobsToMongo = async () => {
  const result = await refreshMemoryJobs();
  if (isMongoReady()) {
    await Job.deleteMany({});
    if (result.jobs.length) await Job.insertMany(result.jobs);
  }
  return result;
};

const ensureMongoJobs = async () => {
  const count = await Job.countDocuments();
  if (count === 0) {
    const result = await syncJobsToMongo();
    return result.jobs;
  }
  const jobs = await Job.find().lean();
  return jobs.map((j) => ({
    ...j,
    daysRemaining: daysUntilDeadline(j.deadline)
  }));
};

const applyFilters = (jobs, query) => {
  const { category, location, qualification, q, search } = query;
  const term = (q || search || '').toString().trim().toLowerCase();

  let filtered = [...jobs];

  if (category && category.trim() !== '' && category.trim().toLowerCase() !== 'all') {
    filtered = filtered.filter(
      (j) => j.category && j.category.toLowerCase() === category.trim().toLowerCase()
    );
  }

  if (location && location.trim()) {
    const loc = location.trim().toLowerCase();
    filtered = filtered.filter((j) => (j.location || '').toLowerCase().includes(loc));
  }

  if (qualification && qualification.trim()) {
    const qual = qualification.trim().toLowerCase();
    filtered = filtered.filter((j) => (j.qualification || '').toLowerCase().includes(qual));
  }

  if (term) {
    filtered = filtered.filter((j) => {
      const hay = `${j.title} ${j.agency} ${j.category} ${j.location} ${j.qualification} ${j.salary}`.toLowerCase();
      return hay.includes(term);
    });
  }

  return sortByNearestDeadline(
    filtered.map((j) => ({
      ...j,
      daysRemaining: daysUntilDeadline(j.deadline)
    }))
  );
};

/**
 * GET /api/jobs
 */
router.get('/', async (req, res) => {
  try {
    let jobs;
    if (isMongoReady()) {
      jobs = await ensureMongoJobs();
    } else {
      if (!memoryJobs.length) await refreshMemoryJobs();
      jobs = memoryJobs;
    }

    const filtered = applyFilters(jobs, req.query);
    const rawCount = lastScrapeMeta?.stats?.rawCount || jobs.length;

    res.json({
      success: true,
      count: filtered.length,
      stats: lastScrapeMeta?.stats || getAggregationStats(rawCount, memoryJobs.length || jobs.length),
      lastRefreshAt,
      liveScrape: Boolean(lastScrapeMeta?.scrape),
      jobs: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/jobs/refresh
 * Always live-scrapes portals (no seed/dummy data).
 */
router.post('/refresh', async (req, res) => {
  try {
    const result = isMongoReady() ? await syncJobsToMongo() : await refreshMemoryJobs();

    res.json({
      success: true,
      message: 'Live scrape complete: portals fetched, duplicates removed, sorted by deadline.',
      stats: result.stats,
      scrape: result.scrape
        ? {
            scrapedAt: result.scrape.scrapedAt,
            durationMs: result.scrape.durationMs,
            rawCount: result.scrape.rawCount,
            sources: result.scrape.sources
          }
        : null,
      lastRefreshAt,
      count: result.jobs.length,
      jobs: result.jobs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/jobs/scrape — live portal scrape only
 */
router.post('/scrape', async (req, res) => {
  try {
    const result = isMongoReady() ? await syncJobsToMongo() : await refreshMemoryJobs();

    res.json({
      success: true,
      message: 'Portal scrapers finished (live only, no dummy data).',
      stats: result.stats,
      scrape: result.scrape,
      count: result.jobs.length,
      jobs: result.jobs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const jobId = parseInt(req.params.id, 10);

  try {
    let job = null;
    if (isMongoReady()) {
      job = await Job.findOne({ id: jobId }).lean();
    }
    if (!job) {
      job = memoryJobs.find((j) => j.id === jobId) || null;
    }
    if (!job) {
      return res.status(404).json({ success: false, error: 'Job posting not found' });
    }

    res.json({
      success: true,
      job: { ...job, daysRemaining: daysUntilDeadline(job.deadline) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { title, posts, fee, deadline, category, agency, description, location, qualification, salary, applyLink, officialUrl } =
    req.body;

  if (!title || !category || !deadline) {
    return res.status(400).json({
      success: false,
      error: 'Missing required job fields: title, category, deadline'
    });
  }

  const newJobData = {
    id: Date.now(),
    title,
    posts: posts || 'As per notification',
    fee: fee || 'As per notification',
    deadline,
    category,
    agency: agency || 'Government Portal',
    description: description || 'Official Government Job Notification',
    salary: salary || 'As per notification',
    location: location || 'All India',
    qualification: qualification || 'As per notification',
    applyLink: applyLink || officialUrl || '',
    officialUrl: officialUrl || '',
    sourcePortals: ['manual'],
    requiredDocuments: [],
    daysRemaining: daysUntilDeadline(deadline)
  };

  try {
    if (isMongoReady()) {
      const createdMongoJob = await Job.create(newJobData);
      return res.status(201).json({ success: true, message: 'Job created in MongoDB', job: createdMongoJob });
    }

    memoryJobs.push(newJobData);
    memoryJobs = sortByNearestDeadline(memoryJobs);
    res.status(201).json({ success: true, message: 'Job created in memory', job: newJobData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
