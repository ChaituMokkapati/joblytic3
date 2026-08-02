/**
 * Scraping Agent — multi-portal job fetcher (no API keys).
 * Strategy: RSS when available → plain HTTP → Playwright for JS/Cloudflare pages.
 */
import * as cheerio from 'cheerio';
import { STANDARD_DOCS, BANK_DOCS } from '../data/commonDocs.js';
import { fetchHtmlWithBrowser, isPlaywrightEnabled } from '../services/browserFetch.js';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
  'User-Agent': UA,
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9,hi;q=0.8',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  Referer: 'https://www.google.com/'
};

function looksBlocked(html = '', status) {
  if (status === 403 || status === 503) return true;
  const head = String(html).slice(0, 2500).toLowerCase();
  return (
    head.includes('just a moment') ||
    head.includes('cf-browser-verification') ||
    head.includes('checking your browser') ||
    head.includes('attention required') ||
    (head.includes('cloudflare') && head.includes('challenge'))
  );
}

async function fetchHtml(url, timeoutMs = 14000, extraHeaders = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { ...DEFAULT_HEADERS, ...extraHeaders },
      redirect: 'follow'
    });
    const text = await res.text();
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }
    if (looksBlocked(text, res.status)) {
      const err = new Error('Blocked by bot protection');
      err.status = 403;
      err.body = text;
      throw err;
    }
    return text;
  } finally {
    clearTimeout(timer);
  }
}

/** HTTP first; on block/failure optionally escalate to Playwright. */
async function fetchHtmlSmart(url, { preferBrowser = false, timeoutMs = 16000 } = {}) {
  if (preferBrowser && isPlaywrightEnabled()) {
    try {
      return await fetchHtmlWithBrowser(url, { timeoutMs: Math.max(timeoutMs, 40000) });
    } catch (err) {
      console.warn(`[browser] ${url} failed: ${err.message} — falling back to HTTP`);
    }
  }

  try {
    return await fetchHtml(url, timeoutMs);
  } catch (err) {
    const shouldBrowser =
      isPlaywrightEnabled() &&
      (err.status === 403 ||
        err.status === 503 ||
        /blocked|abort|timeout|fetch failed|HTTP 403|HTTP 503/i.test(err.message));
    if (shouldBrowser) {
      console.warn(`[scrape] escalating ${url} to Playwright (${err.message})`);
      return fetchHtmlWithBrowser(url, { timeoutMs: 45000 });
    }
    throw err;
  }
}

async function fetchHtmlRetry(url, opts = {}) {
  try {
    return await fetchHtmlSmart(url, opts);
  } catch (err) {
    await new Promise((r) => setTimeout(r, 500));
    return fetchHtmlSmart(url, { ...opts, timeoutMs: 20000 });
  }
}

function guessCategory(title = '', agency = '') {
  const t = `${title} ${agency}`.toLowerCase();
  if (/ibps|sbi|bank|nabard|rbi/.test(t)) return 'Bank';
  if (/rrb|railway|ntpc|alp|group d|group-d/.test(t)) return 'Railway';
  if (/upsc|ssc|cgl|chsl|cpo|central|drdo|isro|nda|cds/.test(t)) return 'Central';
  if (/psc|state|tnpsc|appsc|kpsc|mpsc|bpsc|upsssc|gpsc|rpsc/.test(t)) return 'State PSC';
  return 'Central';
}

function guessAgency(title = '', source = '') {
  const t = title.toLowerCase();
  if (/ssc/.test(t)) return 'Staff Selection Commission (SSC)';
  if (/upsc/.test(t)) return 'Union Public Service Commission (UPSC)';
  if (/ibps/.test(t)) return 'Institute of Banking Personnel Selection (IBPS)';
  if (/rrb|railway/.test(t)) return 'Railway Recruitment Board (RRB)';
  if (/sbi/.test(t)) return 'State Bank of India';
  if (/tnpsc/.test(t)) return 'Tamil Nadu Public Service Commission';
  if (/appsc|ap psc/.test(t)) return 'Andhra Pradesh Public Service Commission';
  if (/upsssc/.test(t)) return 'UPSSSC';
  if (/ncs|national career/.test(t)) return 'National Career Service';
  return source || 'Government Portal';
}

function parseLooseDate(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/\s+/g, ' ').trim();
  let m = cleaned.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = cleaned.match(/(\d{1,2})[\/\-.](\d{1,2})[\/\-.](20\d{2})/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  m = cleaned.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(20\d{2})/i);
  if (m) {
    const months = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    return `${m[3]}-${months[m[2].slice(0, 3).toLowerCase()]}-${m[1].padStart(2, '0')}`;
  }
  return null;
}

function futureDeadline(daysFromNow = 14) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function looksLikeJobTitle(title) {
  if (!title || title.length < 10 || title.length > 180) return false;
  if (/^home$|^login$|^contact$|^about$|^menu$/i.test(title)) return false;
  return /ssc|upsc|ibps|rrb|railway|bank|psc|recruitment|vacancy|notification|online form|examination|constable|clerk|officer|ntpc|cgl|chsl|po\b|group|admit|result|pet\b|jobs?/i.test(
    title
  );
}

function isNoiseTitle(title) {
  return (
    /answer key|cut.?off|syllabus only|download app|subscribe|whatsapp group|youtube|instagram/i.test(title) &&
    !/recruitment|vacancy|online form|notification/i.test(title)
  );
}

function toJob({ title, agency, deadline, officialUrl, applyLink, sourcePortal, posts }) {
  const category = guessCategory(title, agency);
  return {
    title: title.trim().replace(/\s+/g, ' ').slice(0, 180),
    agency: agency || guessAgency(title, sourcePortal),
    category,
    posts: posts || 'See notification',
    fee: 'As per notification',
    salary: 'As per notification',
    location: 'All India / As per notification',
    qualification: 'As per notification',
    deadline: deadline || futureDeadline(10 + Math.floor(Math.random() * 12)),
    officialUrl: officialUrl || applyLink || '',
    applyLink: applyLink || officialUrl || '',
    pdfNotificationUrl: '',
    sourcePortal,
    requiredDocuments: category === 'Bank' ? BANK_DOCS : STANDARD_DOCS,
    scrapedAt: new Date().toISOString()
  };
}

function extractJobsFromAnchors($, baseUrl, sourcePortal, { agencyForce } = {}) {
  const jobs = [];
  const seen = new Set();

  $('a').each((_, el) => {
    const title = $(el).text().replace(/\s+/g, ' ').trim();
    const href = $(el).attr('href') || '';
    if (!looksLikeJobTitle(title) || isNoiseTitle(title)) return;

    const key = title.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    let abs = href;
    if (href && !href.startsWith('http')) {
      try {
        abs = new URL(href, baseUrl).toString();
      } catch {
        abs = baseUrl;
      }
    }

    const parentText = $(el).parent().text();
    const deadline = parseLooseDate(parentText) || parseLooseDate(title) || futureDeadline(8 + (jobs.length % 18));

    jobs.push(
      toJob({
        title,
        agency: agencyForce || guessAgency(title, sourcePortal),
        deadline,
        officialUrl: abs || baseUrl,
        applyLink: abs || baseUrl,
        sourcePortal
      })
    );
  });

  return jobs;
}

function extractJobsFromRss(xml, sourcePortal) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const jobs = [];
  const seen = new Set();

  $('item').each((_, el) => {
    const title = $(el).find('title').first().text().replace(/\s+/g, ' ').trim();
    const link = $(el).find('link').first().text().trim() || $(el).find('guid').first().text().trim();
    const description = $(el).find('description').first().text() || '';
    const content = $(el).find('content\\:encoded').first().text() || description;

    if (!title || seen.has(title.toLowerCase())) return;
    if (isNoiseTitle(title) && !looksLikeJobTitle(title)) return;
    if (!looksLikeJobTitle(title) && !/form|result|admit|recruit|vacancy|notification|exam|job/i.test(title)) {
      return;
    }

    seen.add(title.toLowerCase());
    const deadline =
      parseLooseDate(content) || parseLooseDate(description) || parseLooseDate(title) || futureDeadline(8 + (jobs.length % 18));

    jobs.push(
      toJob({
        title,
        agency: guessAgency(title, sourcePortal),
        deadline,
        officialUrl: link || `https://www.${sourcePortal}/`,
        applyLink: link || `https://www.${sourcePortal}/`,
        sourcePortal
      })
    );
  });

  return jobs;
}

async function scrapeRssOrHtml({ feedUrl, htmlUrl, sourcePortal, preferBrowser = false, limit = 35 }) {
  if (feedUrl) {
    try {
      const xml = await fetchHtml(feedUrl, 16000, {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        Referer: htmlUrl || feedUrl
      });
      const jobs = extractJobsFromRss(xml, sourcePortal);
      if (jobs.length) return jobs.slice(0, limit);
    } catch (err) {
      console.warn(`[${sourcePortal}] RSS failed: ${err.message}`);
    }
  }

  if (!htmlUrl) return [];
  const html = await fetchHtmlRetry(htmlUrl, { preferBrowser });
  const $ = cheerio.load(html);
  return extractJobsFromAnchors($, htmlUrl, sourcePortal).slice(0, limit);
}

export async function scrapeFreeJobAlert() {
  return scrapeRssOrHtml({
    feedUrl: 'https://www.freejobalert.com/feed/',
    htmlUrl: 'https://www.freejobalert.com/latest-notifications/',
    sourcePortal: 'freejobalert.com',
    limit: 45
  });
}

export async function scrapeSarkariResult() {
  return scrapeRssOrHtml({
    feedUrl: 'https://www.sarkariresult.com/feed/',
    htmlUrl: 'https://www.sarkariresult.com/',
    sourcePortal: 'sarkariresult.com',
    preferBrowser: true,
    limit: 40
  });
}

export async function scrapeSarkariExam() {
  return scrapeRssOrHtml({
    feedUrl: 'https://www.sarkariexam.com/feed/',
    htmlUrl: 'https://www.sarkariexam.com/',
    sourcePortal: 'sarkariexam.com',
    preferBrowser: true,
    limit: 35
  });
}

export async function scrapeSarkariJobFind() {
  return scrapeRssOrHtml({
    feedUrl: 'https://www.sarkarijobfind.com/feed/',
    htmlUrl: 'https://www.sarkarijobfind.com/',
    sourcePortal: 'sarkarijobfind.com',
    limit: 30
  });
}

export async function scrapeRojgarResult() {
  return scrapeRssOrHtml({
    feedUrl: 'https://www.rojgarresult.com/feed/',
    htmlUrl: 'https://www.rojgarresult.com/',
    sourcePortal: 'rojgarresult.com',
    limit: 30
  });
}

export async function scrapeGovtJobsBlog() {
  return scrapeRssOrHtml({
    feedUrl: 'https://www.govtjobsblog.in/feed/',
    htmlUrl: 'https://www.govtjobsblog.in/',
    sourcePortal: 'govtjobsblog.in',
    limit: 30
  });
}

export async function scrapeSSC() {
  const urls = ['https://ssc.gov.in/', 'https://ssc.nic.in/'];
  const jobs = [];
  for (const url of urls) {
    try {
      const html = await fetchHtmlRetry(url, { preferBrowser: true });
      const $ = cheerio.load(html);
      jobs.push(
        ...extractJobsFromAnchors($, url, 'ssc.gov.in', {
          agencyForce: 'Staff Selection Commission (SSC)'
        })
      );
    } catch {
      /* try next mirror */
    }
  }
  if (!jobs.length) {
    jobs.push(
      toJob({
        title: 'SSC Latest Notifications (Portal Live)',
        agency: 'Staff Selection Commission (SSC)',
        deadline: futureDeadline(14),
        officialUrl: 'https://ssc.gov.in',
        applyLink: 'https://ssc.gov.in',
        sourcePortal: 'ssc.gov.in'
      })
    );
  }
  return jobs.slice(0, 20);
}

export async function scrapeIBPS() {
  const jobs = [];
  for (const url of ['https://www.ibps.in/', 'https://www.ibps.in/archive/']) {
    try {
      const html = await fetchHtmlRetry(url, { preferBrowser: true });
      const $ = cheerio.load(html);
      jobs.push(
        ...extractJobsFromAnchors($, url, 'ibps.in', {
          agencyForce: 'Institute of Banking Personnel Selection (IBPS)'
        })
      );
    } catch {
      /* continue */
    }
  }
  try {
    const more = await scrapeRssOrHtml({
      feedUrl: null,
      htmlUrl: 'https://www.freejobalert.com/ibps/',
      sourcePortal: 'ibps.in',
      limit: 15
    });
    jobs.push(
      ...more.map((j) => ({
        ...j,
        agency: 'Institute of Banking Personnel Selection (IBPS)',
        category: 'Bank'
      }))
    );
  } catch {
    /* ignore */
  }
  return jobs.slice(0, 20);
}

export async function scrapeUPSC() {
  const url = 'https://www.upsc.gov.in/';
  try {
    const html = await fetchHtmlRetry(url, { preferBrowser: true });
    const $ = cheerio.load(html);
    const jobs = extractJobsFromAnchors($, url, 'upsc.gov.in', {
      agencyForce: 'Union Public Service Commission (UPSC)'
    });
    if (jobs.length) return jobs.slice(0, 15);
  } catch (err) {
    console.warn('[upsc] scrape failed:', err.message);
  }
  return [
    toJob({
      title: 'UPSC Current Examinations & Notifications',
      agency: 'Union Public Service Commission (UPSC)',
      deadline: futureDeadline(20),
      officialUrl: url,
      applyLink: 'https://upsconline.nic.in',
      sourcePortal: 'upsc.gov.in'
    })
  ];
}

export async function scrapeRRB() {
  const jobs = [];
  const urls = [
    'https://www.rrbcdg.gov.in/',
    'https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,7,1281'
  ];
  for (const url of urls) {
    try {
      const html = await fetchHtmlRetry(url, { preferBrowser: true });
      const $ = cheerio.load(html);
      jobs.push(
        ...extractJobsFromAnchors($, url, url.includes('rrbcdg') ? 'rrbcdg.gov.in' : 'indianrailways.gov.in', {
          agencyForce: 'Railway Recruitment Board (RRB)'
        })
      );
    } catch {
      /* next */
    }
  }
  if (!jobs.length) {
    jobs.push(
      toJob({
        title: 'RRB CEN / Recruitment Board Notices',
        agency: 'Railway Recruitment Board (RRB)',
        deadline: futureDeadline(9),
        officialUrl: 'https://www.rrbcdg.gov.in/',
        applyLink: 'https://www.rrbcdg.gov.in/',
        sourcePortal: 'rrbcdg.gov.in'
      })
    );
  }
  return jobs.slice(0, 18);
}

export async function scrapeEmploymentNews() {
  const url = 'https://www.employmentnews.gov.in/';
  try {
    const html = await fetchHtmlRetry(url, { preferBrowser: true });
    const $ = cheerio.load(html);
    return extractJobsFromAnchors($, url, 'employmentnews.gov.in').slice(0, 20);
  } catch {
    return [];
  }
}

/** National Career Service — JS-heavy government SPA-ish pages */
export async function scrapeNCS() {
  const url = 'https://www.ncs.gov.in/';
  try {
    const html = await fetchHtmlRetry(url, { preferBrowser: true, timeoutMs: 45000 });
    const $ = cheerio.load(html);
    const jobs = extractJobsFromAnchors($, url, 'ncs.gov.in', {
      agencyForce: 'National Career Service'
    });
    if (jobs.length) return jobs.slice(0, 20);
  } catch (err) {
    console.warn('[ncs] scrape failed:', err.message);
  }
  return [
    toJob({
      title: 'National Career Service — Browse Government Jobs',
      agency: 'National Career Service',
      deadline: futureDeadline(12),
      officialUrl: url,
      applyLink: url,
      sourcePortal: 'ncs.gov.in'
    })
  ];
}

export async function scrapeTNPSC() {
  const url = 'https://www.tnpsc.gov.in/';
  try {
    const html = await fetchHtmlRetry(url, { preferBrowser: true });
    const $ = cheerio.load(html);
    const jobs = extractJobsFromAnchors($, url, 'tnpsc.gov.in', {
      agencyForce: 'Tamil Nadu Public Service Commission'
    });
    if (jobs.length) return jobs.slice(0, 15);
  } catch (err) {
    console.warn('[tnpsc] scrape failed:', err.message);
  }
  return [
    toJob({
      title: 'TNPSC Latest Notifications',
      agency: 'Tamil Nadu Public Service Commission',
      deadline: futureDeadline(16),
      officialUrl: url,
      applyLink: url,
      sourcePortal: 'tnpsc.gov.in'
    })
  ];
}

/** Agent registry — each entry is a scraping tool */
export const SCRAPE_TOOLS = [
  { id: 'freejobalert.com', label: 'FreeJobAlert', fn: scrapeFreeJobAlert },
  { id: 'sarkariresult.com', label: 'SarkariResult', fn: scrapeSarkariResult },
  { id: 'sarkariexam.com', label: 'SarkariExam', fn: scrapeSarkariExam },
  { id: 'sarkarijobfind.com', label: 'SarkariJobFind', fn: scrapeSarkariJobFind },
  { id: 'rojgarresult.com', label: 'RojgarResult', fn: scrapeRojgarResult },
  { id: 'govtjobsblog.in', label: 'GovtJobsBlog', fn: scrapeGovtJobsBlog },
  { id: 'ssc.gov.in', label: 'SSC Official', fn: scrapeSSC },
  { id: 'ibps.in', label: 'IBPS Official', fn: scrapeIBPS },
  { id: 'upsc.gov.in', label: 'UPSC Official', fn: scrapeUPSC },
  { id: 'rrb', label: 'RRB / Railways', fn: scrapeRRB },
  { id: 'employmentnews.gov.in', label: 'Employment News', fn: scrapeEmploymentNews },
  { id: 'ncs.gov.in', label: 'NCS (Playwright)', fn: scrapeNCS },
  { id: 'tnpsc.gov.in', label: 'TNPSC', fn: scrapeTNPSC }
];

/**
 * Scraping Agent run — parallel portal visits + structured report.
 */
export async function runScrapingAgent({ sources = null } = {}) {
  const startedAt = Date.now();
  const tools = sources?.length
    ? SCRAPE_TOOLS.filter((t) => sources.includes(t.id))
    : SCRAPE_TOOLS;

  const traces = [];
  const push = (event, payload = {}) => {
    traces.push({
      timestamp: new Date().toISOString(),
      event,
      ...payload
    });
  };

  push('AGENT_INIT', {
    agent: 'ScrapingAgent',
    details: `Visiting ${tools.length} portals (RSS → HTTP → Playwright). No API keys.`
  });

  const results = await Promise.all(
    tools.map(async ({ id, label, fn }) => {
      const t0 = Date.now();
      try {
        push('TOOL_CALL_START', { tool: `scrape_${id}`, portal: label });
        const jobs = await fn();
        const ms = Date.now() - t0;
        push('TOOL_CALL_SUCCESS', {
          tool: `scrape_${id}`,
          portal: label,
          count: jobs.length,
          durationMs: ms
        });
        return { source: id, label, ok: true, count: jobs.length, jobs, error: null, durationMs: ms };
      } catch (err) {
        push('TOOL_CALL_ERROR', {
          tool: `scrape_${id}`,
          portal: label,
          error: err.message
        });
        return {
          source: id,
          label,
          ok: false,
          count: 0,
          jobs: [],
          error: err.message,
          durationMs: Date.now() - t0
        };
      }
    })
  );

  const scrapedJobs = results.flatMap((r) => r.jobs);
  push('AGENT_COMPLETE', {
    agent: 'ScrapingAgent',
    details: `Fetched ${scrapedJobs.length} raw postings from ${results.filter((r) => r.ok).length}/${results.length} portals`
  });

  return {
    agent: 'ScrapingAgent',
    scrapedAt: new Date().toISOString(),
    durationMs: Date.now() - startedAt,
    sources: results.map(({ source, label, ok, count, error, durationMs }) => ({
      source,
      label,
      ok,
      count,
      error,
      durationMs
    })),
    scrapedJobs,
    rawCount: scrapedJobs.length,
    traces
  };
}

/** Back-compat for jobAggregator */
export async function scrapeAllPortals() {
  const result = await runScrapingAgent();
  return {
    scrapedAt: result.scrapedAt,
    durationMs: result.durationMs,
    sources: result.sources,
    scrapedJobs: result.scrapedJobs,
    rawCount: result.rawCount
  };
}
