import React, { useEffect, useState } from 'react';
import { Globe2, Play, Loader2, Radar } from 'lucide-react';
import { useToast } from './Toast';
import { runScrapingAgentStream } from '../api/jobsApi';
import PortalScrapeProgress, {
  initPortalStatuses,
  applyPortalEvent,
  DEFAULT_PORTAL_TOOLS
} from './PortalScrapeProgress';

const BASE = 'http://localhost:5000';

export default function ScrapingAgentPanel({ onJobsUpdated }) {
  const toast = useToast();
  const [tools, setTools] = useState([]);
  const [selected, setSelected] = useState([]);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [portalStatuses, setPortalStatuses] = useState([]);

  useEffect(() => {
    fetch(`${BASE}/api/agents/scrape/tools`)
      .then((r) => r.json())
      .then((d) => {
        const list = d.tools || [];
        setTools(list);
        setSelected(list.map((t) => t.id));
      })
      .catch(() => setTools([]));
  }, []);

  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    const selectedTools = (tools.length ? tools : DEFAULT_PORTAL_TOOLS).filter((t) =>
      selected.includes(t.id)
    );
    setPortalStatuses(initPortalStatuses(selectedTools));
    toast.info('Scraping portals…');

    try {
      const data = await runScrapingAgentStream({
        sources: selected,
        persist: true,
        onEvent: (evt) => setPortalStatuses((prev) => applyPortalEvent(prev, evt))
      });
      setResult(data);
      onJobsUpdated?.(data);
      const ok = (data.sources || []).filter((s) => s.ok).length;
      const total = (data.sources || []).length;
      toast.success(
        `Scrape done: ${data.count ?? data.stats?.cleanCount ?? 0} jobs · ${ok}/${total} portals OK`
      );
    } catch (err) {
      setError(err.message);
      toast.error(`Scrape failed: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 text-xs font-semibold border border-cyan-500/30 mb-2">
              <Radar className="w-3.5 h-3.5" />
              Scraping Agent · No API keys
            </div>
            <h2 className="text-2xl font-extrabold text-white">Crawl SSC / UPSC / IBPS / RRB + boards</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Autonomous agent visits public portals one by one, shows live status, then dedupes by title + organization + deadline.
            </p>
          </div>
          <button
            onClick={run}
            disabled={running || selected.length === 0}
            className="px-5 py-3 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            {running ? 'Scraping portals…' : 'Run Scraping Agent'}
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {tools.map((t) => {
            const on = selected.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggle(t.id)}
                disabled={running}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                  on
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-200'
                    : 'bg-slate-950 border-slate-700 text-slate-500'
                }`}
              >
                <Globe2 className="w-3 h-3 inline mr-1" />
                {t.label}
              </button>
            );
          })}
          {!tools.length && <span className="text-xs text-slate-500">Loading scrape tools…</span>}
        </div>
      </div>

      {(running || portalStatuses.length > 0) && (
        <PortalScrapeProgress
          portalStatuses={portalStatuses}
          title={running ? 'Live portal crawl in progress' : 'Last crawl status'}
        />
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">{error}</div>
      )}

      {result && !running && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Raw scraped</p>
              <p className="text-2xl font-bold text-white">
                {result.stats?.scrapedRaw ?? result.sources?.reduce((a, s) => a + (s.count || 0), 0)}
              </p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">After dedupe</p>
              <p className="text-2xl font-bold text-emerald-400">{result.stats?.cleanCount ?? result.count}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Duplicates removed</p>
              <p className="text-2xl font-bold text-amber-300">{result.stats?.duplicatesRemoved ?? 0}</p>
            </div>
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <p className="text-[10px] text-slate-500 uppercase font-mono">Duration</p>
              <p className="text-2xl font-bold text-cyan-300">{result.durationMs}ms</p>
            </div>
          </div>

          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800 text-xs text-slate-400 font-mono">Sample scraped jobs</div>
            <div className="divide-y divide-slate-800">
              {(result.sample || []).map((j, i) => (
                <div key={i} className="px-4 py-3 text-xs">
                  <p className="text-white font-semibold">{j.title}</p>
                  <p className="text-slate-400 mt-0.5">
                    {j.agency} · deadline {j.deadline}
                  </p>
                  <p className="text-cyan-400/90 font-mono mt-1">{(j.sourcePortals || []).join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
