import React, { useState, useEffect } from 'react';
import { Cpu, Terminal, Play, Copy, Check, Sparkles, Shield, Loader2, Zap } from 'lucide-react';
import { runDualAgentDemo, fetchAgentStatus } from '../api/jobsApi';

export default function AgentTerminal({ activeJob, candidate }) {
  const [activeLogTab, setActiveLogTab] = useState('tool_calls');
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);
  const [caps, setCaps] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAgentStatus()
      .then(setCaps)
      .catch(() => setCaps(null));
  }, []);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    try {
      const data = await runDualAgentDemo({
        jobId: activeJob?.id,
        documents: candidate?.documents || [],
        candidate: {
          name: candidate?.name,
          email: candidate?.email,
          phone: candidate?.phone
        },
        forceResend: true
      });
      setResult(data);
      setActiveLogTab('tool_calls');
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  };

  const traces = result?.traces || [];
  const displayLines = result?.checklist?.displayLines || [];
  const pitch = result?.pitch;

  const systemPrompt = `SYSTEM — JOBLYTIC DUAL AGENTS
You operate two autonomous domain agents for Indian government job aspirants.

1) AlertAgent
   - Deduped jobs from SSC/UPSC/IBPS/RRB/State
   - Windows: 7 / 3 / 1 days before deadline
   - Channels: Twilio WhatsApp + Resend Email

2) DocumentChecklistAgent
   - Parse notification PDF / embedded rules
   - Normalize + dedupe document names
   - Compare vault → [✓] DONE / [X] MISSING / [!] FORMAT

OpenAI: ${caps?.openaiConfigured ? 'CONFIGURED' : 'paste OPENAI_API_KEY'}
Notify: ${caps?.notify?.mode || 'demo'} (Twilio=${caps?.notify?.twilioConfigured ? 'yes' : 'no'}, Resend=${caps?.notify?.resendConfigured ? 'yes' : 'no'})`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(systemPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Judge Demo — Dual Agent Pipeline
            </div>
            <h2 className="text-2xl font-extrabold text-white">Live Agent Trace Terminal</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              One click runs Job Aggregator → Document Checklist → Alert Agent (7/3/1). Paste API keys in{' '}
              <code className="text-emerald-400">backend/.env</code> to go live.
            </p>
          </div>
          <button
            onClick={handleRun}
            disabled={running}
            className="px-5 py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-sm flex items-center gap-2 disabled:opacity-50"
          >
            {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
            {running ? 'Running agents…' : 'Run Dual Agents'}
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-mono">OpenAI</p>
            <p className={caps?.openaiConfigured ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
              {caps?.openaiConfigured ? 'Ready' : 'Paste key'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-mono">Notify mode</p>
            <p className="text-cyan-300 font-bold uppercase">{caps?.notify?.mode || '…'}</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-mono">Twilio</p>
            <p className={caps?.notify?.twilioConfigured ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {caps?.notify?.twilioConfigured ? 'Ready' : 'Optional'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-slate-500 font-mono">Resend</p>
            <p className={caps?.notify?.resendConfigured ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
              {caps?.notify?.resendConfigured ? 'Ready' : 'Optional'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">{error}</div>
      )}

      {pitch && (
        <div className="glass-panel p-5 rounded-2xl border border-cyan-800/40 grid md:grid-cols-4 gap-3">
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono">Deduped jobs</p>
            <p className="text-2xl font-bold text-white">{pitch.outcome.dedupedJobs}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono">Duplicates removed</p>
            <p className="text-2xl font-bold text-amber-300">{pitch.outcome.duplicatesRemoved}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono">Docs ready</p>
            <p className="text-2xl font-bold text-emerald-400">{pitch.outcome.checklistReady}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase font-mono">Alerts fired</p>
            <p className="text-2xl font-bold text-cyan-300">{pitch.outcome.alertsFired}</p>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
            <Terminal className="w-4 h-4" />
            joblytic-agent@amb — {activeJob?.title?.slice(0, 42) || 'no job'}…
          </div>
          <div className="flex gap-1">
            {['tool_calls', 'checklist', 'system'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveLogTab(tab)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  activeLogTab === tab ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-500'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 max-h-[420px] overflow-y-auto font-mono text-[11px] leading-relaxed bg-[#0a0f18]">
          {activeLogTab === 'system' && (
            <div>
              <button onClick={copyPrompt} className="mb-3 text-emerald-400 flex items-center gap-1 text-xs">
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} Copy system prompt
              </button>
              <pre className="whitespace-pre-wrap text-slate-300">{systemPrompt}</pre>
            </div>
          )}

          {activeLogTab === 'checklist' && (
            <div className="space-y-1">
              {!displayLines.length && (
                <p className="text-slate-500">Run dual agents to generate checklist output.</p>
              )}
              {displayLines.map((line, i) => (
                <p
                  key={i}
                  className={
                    line.startsWith('[✓]')
                      ? 'text-emerald-400'
                      : line.startsWith('[!]')
                        ? 'text-amber-300'
                        : 'text-rose-300'
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {activeLogTab === 'tool_calls' && (
            <div className="space-y-3">
              {!traces.length && !running && (
                <p className="text-slate-500 flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-300" /> Press “Run Dual Agents” for live traces.
                </p>
              )}
              {running && (
                <p className="text-emerald-400 animate-pulse flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Executing tool chain…
                </p>
              )}
              {traces.map((t, i) => (
                <div key={i} className="border border-slate-800 rounded-xl p-3 bg-slate-950/60">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-cyan-400 font-bold">{t.event}</span>
                    <span className="text-slate-600">{t.timestamp}</span>
                  </div>
                  {t.agent && <p className="text-emerald-300">agent: {t.agent}</p>}
                  {t.tool && <p className="text-amber-200">tool: {t.tool}</p>}
                  {t.details && <p className="text-slate-400">{t.details}</p>}
                  {t.response && (
                    <pre className="mt-2 text-slate-300 whitespace-pre-wrap overflow-x-auto">
                      {JSON.stringify(t.response, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
          <Shield className="w-3 h-3 text-emerald-500" />
          <Cpu className="w-3 h-3" />
          Modular agents · Dedup · Checklist · 7/3/1 alerts
        </div>
      </div>
    </div>
  );
}
