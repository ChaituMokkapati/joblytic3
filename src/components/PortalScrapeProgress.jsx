import React from 'react';
import { Loader2, CheckCircle2, XCircle, Circle, Radar, Globe2 } from 'lucide-react';

/**
 * Live portal scrape status list.
 * portalStatuses: [{ id, label, status: 'pending'|'scraping'|'ok'|'error', count?, error?, durationMs? }]
 */
export default function PortalScrapeProgress({
  portalStatuses = [],
  title = 'Scraping portals…',
  subtitle = null,
  compact = false
}) {
  const active = portalStatuses.find((p) => p.status === 'scraping');
  const done = portalStatuses.filter((p) => p.status === 'ok' || p.status === 'error').length;
  const total = portalStatuses.length || 1;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      className={`rounded-2xl border border-cyan-500/30 bg-slate-950/80 ${
        compact ? 'p-4' : 'p-6 sm:p-8'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radar className="w-7 h-7 text-cyan-400 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-xs text-cyan-300/90 font-mono mt-0.5">
              {active ? (
                <>
                  Now scraping <span className="text-emerald-400 font-semibold">{active.label || active.id}</span>
                  <span className="inline-flex ml-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce [animation-delay:120ms]">.</span>
                    <span className="animate-bounce [animation-delay:240ms]">.</span>
                  </span>
                </>
              ) : (
                subtitle || 'Preparing portal crawl…'
              )}
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400">
          {done}/{total} · {pct}%
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto">
        {portalStatuses.map((p) => {
          const isScraping = p.status === 'scraping';
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 border text-xs transition-all duration-300 ${
                isScraping
                  ? 'bg-cyan-500/15 border-cyan-400/50 shadow-[0_0_20px_rgba(34,211,238,0.12)] scale-[1.01]'
                  : p.status === 'ok'
                    ? 'bg-emerald-950/40 border-emerald-800/50'
                    : p.status === 'error'
                      ? 'bg-rose-950/30 border-rose-800/40'
                      : 'bg-slate-900/60 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {p.status === 'scraping' ? (
                  <Loader2 className="w-4 h-4 text-cyan-300 animate-spin shrink-0" />
                ) : p.status === 'ok' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : p.status === 'error' ? (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`font-semibold truncate ${isScraping ? 'text-cyan-100' : 'text-slate-200'}`}>
                    <Globe2 className="w-3 h-3 inline mr-1 opacity-70" />
                    {p.label || p.id}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">{p.id}</p>
                </div>
              </div>
              <div className="text-right shrink-0 font-mono text-[10px]">
                {p.status === 'scraping' && <span className="text-cyan-300 animate-pulse">live</span>}
                {p.status === 'ok' && (
                  <span className="text-emerald-400">
                    {p.count ?? 0} jobs{p.durationMs != null ? ` · ${p.durationMs}ms` : ''}
                  </span>
                )}
                {p.status === 'error' && (
                  <span className="text-rose-300 max-w-[9rem] truncate block" title={p.error}>
                    {p.error || 'failed'}
                  </span>
                )}
                {p.status === 'pending' && <span className="text-slate-600">queued</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const DEFAULT_PORTAL_TOOLS = [
  { id: 'freejobalert.com', label: 'FreeJobAlert' },
  { id: 'sarkariresult.com', label: 'SarkariResult' },
  { id: 'sarkariexam.com', label: 'SarkariExam' },
  { id: 'sarkarijobfind.com', label: 'SarkariJobFind' },
  { id: 'rojgarresult.com', label: 'RojgarResult' },
  { id: 'govtjobsblog.in', label: 'GovtJobsBlog' },
  { id: 'ssc.gov.in', label: 'SSC Official' },
  { id: 'ibps.in', label: 'IBPS Official' },
  { id: 'upsc.gov.in', label: 'UPSC Official' },
  { id: 'rrb', label: 'RRB / Railways' },
  { id: 'employmentnews.gov.in', label: 'Employment News' },
  { id: 'ncs.gov.in', label: 'NCS (Playwright)' },
  { id: 'tnpsc.gov.in', label: 'TNPSC' }
];

export function initPortalStatuses(tools = DEFAULT_PORTAL_TOOLS) {
  return tools.map((t) => ({
    id: t.id,
    label: t.label,
    status: 'pending',
    count: null,
    error: null,
    durationMs: null
  }));
}

export function applyPortalEvent(statuses, evt) {
  if (!evt?.event) return statuses;

  if (evt.event === 'init' && Array.isArray(evt.portals)) {
    return initPortalStatuses(evt.portals);
  }

  if (evt.event === 'portal_start') {
    return statuses.map((p) =>
      p.id === evt.source ? { ...p, status: 'scraping' } : p.status === 'scraping' ? { ...p, status: 'pending' } : p
    );
  }

  if (evt.event === 'portal_done') {
    return statuses.map((p) =>
      p.id === evt.source
        ? { ...p, status: 'ok', count: evt.count, durationMs: evt.durationMs, error: null }
        : p
    );
  }

  if (evt.event === 'portal_error') {
    return statuses.map((p) =>
      p.id === evt.source
        ? { ...p, status: 'error', count: 0, durationMs: evt.durationMs, error: evt.error }
        : p
    );
  }

  return statuses;
}
