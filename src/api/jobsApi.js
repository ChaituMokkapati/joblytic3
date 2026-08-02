/**
 * AMB SaaS Job Portal - API Service Layer
 * Express backend on http://localhost:5000
 */

const BASE_URL = 'http://localhost:5000';

async function parseJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || data.message || res.statusText);
  return data;
}

// ─── Jobs ────────────────────────────────────────────────────────────────────

export const fetchJobs = async (category = '', extra = {}) => {
  const params = new URLSearchParams();
  if (category && category !== 'All') params.set('category', category);
  if (extra.q) params.set('q', extra.q);
  if (extra.location) params.set('location', extra.location);
  if (extra.qualification) params.set('qualification', extra.qualification);
  const qs = params.toString() ? `?${params}` : '';
  const res = await fetch(`${BASE_URL}/api/jobs${qs}`);
  const data = await parseJson(res);
  // Back-compat: callers may expect array OR { jobs }
  return data;
};

export const refreshJobs = async ({ live = true } = {}) => {
  const res = await fetch(`${BASE_URL}/api/jobs/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ live })
  });
  return parseJson(res);
};

export const scrapeJobs = async () => {
  const res = await fetch(`${BASE_URL}/api/jobs/scrape`, { method: 'POST' });
  return parseJson(res);
};

export const getScrapeTools = async () => {
  const res = await fetch(`${BASE_URL}/api/agents/scrape/tools`);
  return parseJson(res);
};

export const runScrapingAgent = async ({ sources = null, persist = true } = {}) => {
  const res = await fetch(`${BASE_URL}/api/agents/scrape/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sources, persist })
  });
  return parseJson(res);
};

/**
 * Sequential scrape with live portal progress (SSE).
 * onEvent(evt) receives init | portal_start | portal_done | portal_error | complete | error
 */
export const runScrapingAgentStream = async ({
  sources = null,
  persist = true,
  onEvent = null
} = {}) => {
  const res = await fetch(`${BASE_URL}/api/agents/scrape/run-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify({ sources, persist })
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || res.statusText);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let complete = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split('\n\n');
    buffer = chunks.pop() || '';

    for (const chunk of chunks) {
      const line = chunk
        .split('\n')
        .find((l) => l.startsWith('data: '));
      if (!line) continue;
      try {
        const evt = JSON.parse(line.slice(6));
        onEvent?.(evt);
        if (evt.event === 'complete') complete = evt;
        if (evt.event === 'error') throw new Error(evt.error || 'Scrape stream failed');
      } catch (err) {
        if (err.message && !err.message.includes('JSON')) throw err;
      }
    }
  }

  if (!complete) throw new Error('Scrape stream ended without complete event');
  return complete;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signup = async (name, email, password) => {
  const res = await fetch(`${BASE_URL}/api/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });
  return parseJson(res);
};

export const login = async (email, password) => {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return parseJson(res);
};

export const forgotPassword = async (email) => {
  const res = await fetch(`${BASE_URL}/api/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return parseJson(res);
};

export const resetPassword = async (email, otp, newPassword) => {
  const res = await fetch(`${BASE_URL}/api/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp, newPassword })
  });
  return parseJson(res);
};

// ─── Alerts ───────────────────────────────────────────────────────────────────

export const fetchAlerts = async () => {
  const res = await fetch(`${BASE_URL}/api/alerts`);
  return parseJson(res);
};

export const subscribeAlert = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/alerts/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
};

export const runAlertsNow = async ({ forceResend = true } = {}) => {
  const res = await fetch(`${BASE_URL}/api/alerts/run-now`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ forceResend })
  });
  return parseJson(res);
};

// ─── Document checklist ───────────────────────────────────────────────────────

export const runDocumentChecklist = async ({ jobId, documents, notificationPdf, pdfUrl }) => {
  const form = new FormData();
  if (jobId != null) form.append('jobId', String(jobId));
  form.append('documents', JSON.stringify(documents || []));
  if (notificationPdf) form.append('notificationPdf', notificationPdf);
  if (pdfUrl) form.append('pdfUrl', pdfUrl);

  const res = await fetch(`${BASE_URL}/api/verify-docs/checklist`, {
    method: 'POST',
    body: form
  });
  return parseJson(res);
};

export const parseNotificationPdf = async ({ notificationPdf, pdfUrl } = {}) => {
  const form = new FormData();
  if (notificationPdf) form.append('notificationPdf', notificationPdf);
  if (pdfUrl) form.append('pdfUrl', pdfUrl);

  const res = await fetch(`${BASE_URL}/api/verify-docs/parse-pdf`, {
    method: 'POST',
    body: form
  });
  return parseJson(res);
};

// ─── Applications tracker ─────────────────────────────────────────────────────

export const fetchApplications = async (email = '') => {
  const qs = email ? `?email=${encodeURIComponent(email)}` : '';
  const res = await fetch(`${BASE_URL}/api/applications${qs}`);
  return parseJson(res);
};

export const createApplication = async (payload) => {
  const res = await fetch(`${BASE_URL}/api/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
};

export const updateApplication = async (id, payload) => {
  const res = await fetch(`${BASE_URL}/api/applications/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return parseJson(res);
};

export const deleteApplication = async (id) => {
  const res = await fetch(`${BASE_URL}/api/applications/${id}`, { method: 'DELETE' });
  return parseJson(res);
};

export const runDualAgentDemo = async ({ jobId, documents, candidate, forceResend = true } = {}) => {
  const res = await fetch(`${BASE_URL}/api/agents/run-demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, documents, candidate, forceResend })
  });
  return parseJson(res);
};

export const fetchAgentStatus = async () => {
  const res = await fetch(`${BASE_URL}/api/agents/status`);
  return parseJson(res);
};

// ─── Health ───────────────────────────────────────────────────────────────────

export const checkHealth = async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  if (!res.ok) throw new Error('Backend unreachable');
  return res.json();
};
