import React, { useMemo, useState } from 'react';
import { Bell, MessageSquare, Mail, Smartphone, CheckCircle, Clock, Send, ShieldAlert, Sparkles, AlertCircle, Loader2, Filter, MapPin } from 'lucide-react';
import { subscribeAlert, runAlertsNow } from '../api/jobsApi';

const EXAM_TYPES = ['All', 'Central', 'Bank', 'Railway', 'State PSC'];
const STATES = ['All', 'All India', 'Uttar Pradesh', 'Tamil Nadu', 'Kerala', 'Gujarat', 'Andhra Pradesh', 'Maharashtra', 'Bihar', 'Rajasthan'];

export default function AlertAgent({ jobs, candidate, onToggleAlert }) {
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [subscribeMsg, setSubscribeMsg] = useState(null);
  const [examType, setExamType] = useState('All');
  const [statePref, setStatePref] = useState('All');

  const preferredJobs = useMemo(() => {
    return (jobs || []).filter((j) => {
      const matchExam = examType === 'All' || j.category === examType;
      const loc = (j.location || 'All India').toLowerCase();
      const matchState =
        statePref === 'All' ||
        statePref === 'All India' ||
        loc.includes('all india') ||
        loc.includes(statePref.toLowerCase());
      return matchExam && matchState;
    });
  }, [jobs, examType, statePref]);

  const subscribedJobs = preferredJobs.filter((j) => j.alertSubscribed);

  const handleSubscribeAll = async () => {
    setBusy(true);
    setSubscribeMsg(null);
    try {
      const targets = subscribedJobs.length ? subscribedJobs : preferredJobs.slice(0, 5);
      for (const job of targets) {
        await subscribeAlert({
          jobId: job.id,
          jobTitle: job.title,
          email: candidate?.email || 'candidate@ambjobs.com',
          phone: candidate?.phone || '',
          channel: 'Email & WhatsApp',
          windows: [7, 3, 1],
          frequency: `7/3/1 · ${examType} · ${statePref}`
        });
        if (!job.alertSubscribed) onToggleAlert?.(job.id);
      }
      setSubscribeMsg(
        `Subscribed ${targets.length} job(s) for exam=${examType}, state=${statePref} (7/3/1 windows).`
      );
    } catch (err) {
      setSubscribeMsg(`Subscribe failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleRunNow = async () => {
    setBusy(true);
    setRunResult(null);
    try {
      const data = await runAlertsNow({ forceResend: true });
      setRunResult(data);
    } catch (err) {
      setRunResult({ success: false, error: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-emerald-500/30">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
              <Bell className="w-3.5 h-3.5" />
              <span>Autonomous AI Alert Agent</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Proactive Multi-Channel Notifications
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Prefer exam type & state, then schedule <strong className="text-emerald-400 font-semibold">7 / 3 / 1 day</strong> reminders.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                <select
                  value={examType}
                  onChange={(e) => setExamType(e.target.value)}
                  className="bg-transparent text-xs text-slate-100 outline-none"
                >
                  {EXAM_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-slate-900">
                      Exam: {t}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-slate-950 border border-slate-700">
                <MapPin className="w-3.5 h-3.5 text-amber-300" />
                <select
                  value={statePref}
                  onChange={(e) => setStatePref(e.target.value)}
                  className="bg-transparent text-xs text-slate-100 outline-none"
                >
                  {STATES.map((t) => (
                    <option key={t} value={t} className="bg-slate-900">
                      State: {t}
                    </option>
                  ))}
                </select>
              </div>
              <span className="text-[11px] text-slate-400 self-center font-mono">
                matching jobs: {preferredJobs.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                disabled={busy || preferredJobs.length === 0}
                onClick={handleSubscribeAll}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-700/50 text-emerald-300 text-xs font-bold disabled:opacity-50"
              >
                Sync preferred alerts
              </button>
              <button
                disabled={busy}
                onClick={handleRunNow}
                className="px-3 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Run alerts now
              </button>
            </div>
            {subscribeMsg && <p className="text-[11px] text-cyan-300 font-mono">{subscribeMsg}</p>}
            {runResult && (
              <p className="text-[11px] text-slate-300 font-mono">
                Sweep: fired={runResult.firedCount ?? 0} skipped={runResult.skippedCount ?? 0} mode={runResult.notify?.mode || 'n/a'}
                {runResult.error ? ` error=${runResult.error}` : ''}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-2xl font-extrabold text-emerald-400 font-['Outfit']">{subscribedJobs.length}</span>
              <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Active (filtered)</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
              <span className="text-2xl font-extrabold text-cyan-400 font-['Outfit']">7/3/1</span>
              <p className="text-[10px] text-slate-400 uppercase font-mono mt-0.5">Day Windows</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Schedule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400 flex items-center justify-center font-bold text-sm">
            7D
          </div>
          <h3 className="text-sm font-bold text-white">7 Days Prior: Initial Alert</h3>
          <p className="text-xs text-slate-400">
            Sends first WhatsApp summary & document checklist requirement notification.
          </p>
          <span className="inline-block text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800">
            WhatsApp + Email
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-amber-800/40 bg-amber-950/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-800 text-amber-400 flex items-center justify-center font-bold text-sm">
            3D
          </div>
          <h3 className="text-sm font-bold text-white">3 Days Prior: Urgency Warning</h3>
          <p className="text-xs text-slate-400">
            Triggers document format fix check and reminds candidate of missing certificates.
          </p>
          <span className="inline-block text-[10px] font-mono text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800">
            WhatsApp Priority Push
          </span>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-rose-800/40 bg-rose-950/10 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center font-bold text-sm">
            24H
          </div>
          <h3 className="text-sm font-bold text-white">24 Hours Prior: Final Call</h3>
          <p className="text-xs text-slate-400">
            Emergency alert before official portal server traffic peak. Direct portal action link.
          </p>
          <span className="inline-block text-[10px] font-mono text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded border border-rose-800">
            High Priority Alert
          </span>
        </div>
      </div>

      {/* Active Subscriptions List & Live Trigger Simulators */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Active Alert Subscriptions ({subscribedJobs.length})</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Sending to: <strong className="text-emerald-400">{candidate.phone}</strong> & <strong className="text-slate-200">{candidate.email}</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {subscribedJobs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No active job subscriptions. Go to the Deadline Dashboard to enable alerts.
            </div>
          ) : (
            subscribedJobs.map((job) => (
              <div key={job.id} className="p-5 hover:bg-slate-900/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold font-mono border border-cyan-800">
                      {job.agency}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                      job.daysRemaining <= 3 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                    }`}>
                      Deadline: {job.daysRemaining} days left ({job.deadlineDate || job.deadline})
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">{job.title}</h4>
                </div>

                {/* Test Action Buttons */}
                <div className="flex items-center space-x-2 w-full md:w-auto">
                  <button
                    onClick={() => setShowWhatsAppModal(job)}
                    className="flex-1 md:flex-initial py-2 px-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Test WhatsApp Alert</span>
                  </button>

                  <button
                    onClick={() => setShowEmailModal(job)}
                    className="flex-1 md:flex-initial py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                  >
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Test Email Alert</span>
                  </button>

                  <button
                    onClick={() => onToggleAlert(job.id)}
                    className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 text-xs transition"
                  >
                    Disable
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* WhatsApp Alert Simulation Modal */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b141a] rounded-3xl border border-emerald-500/40 max-w-sm w-full overflow-hidden shadow-2xl space-y-0">
            {/* WhatsApp Header */}
            <div className="bg-[#1f2c34] p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-extrabold text-xs">
                  JL
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-100">Joblytic AI Bot (Official)</h4>
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Verified Business
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* WhatsApp Chat Body */}
            <div className="p-4 space-y-3 bg-[#0b141a] text-xs font-sans">
              <div className="bg-[#005c4b] text-slate-100 p-3.5 rounded-2xl rounded-tl-none space-y-2 border border-emerald-500/30">
                <p className="font-bold text-emerald-200">
                  ⚠️ URGENT DEADLINE ALERT - {showWhatsAppModal.agency}
                </p>
                <p>
                  Hi <strong>{candidate.name}</strong>, application for <strong>{showWhatsAppModal.title}</strong> closes in <strong>{showWhatsAppModal.daysRemaining} days</strong> ({showWhatsAppModal.deadlineDate} at {showWhatsAppModal.closingTime}).
                </p>
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-emerald-400/20 text-[11px] space-y-1 font-mono">
                  <p className="text-amber-300 font-bold">📋 AI Doc Verification Result:</p>
                  <p>• 10th Certificate: [✓ READY]</p>
                  <p>• Photo: [! SIZE 85KB EXCEEDS 50KB]</p>
                  <p>• OBC Certificate: [X REQUIRES GOI 2025 FORMAT]</p>
                </div>
                <p className="text-[11px] text-emerald-200">
                  👉 Click below to fix photo size & submit before portal rush:
                </p>
                <a
                  href={showWhatsAppModal.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-center py-2 bg-emerald-400 text-slate-950 rounded-xl font-extrabold text-xs shadow-md"
                >
                  Open Official Application Portal ➔
                </a>
                <p className="text-[9px] text-slate-300 text-right font-mono mt-1">11:42 PM ✓✓</p>
              </div>
            </div>

            <div className="p-3 bg-[#1f2c34] text-center">
              <button
                onClick={() => setShowWhatsAppModal(null)}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Close WhatsApp Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Alert Simulation Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-mono">From: alerts@joblytic.ai (Resend API)</p>
                <h3 className="text-sm font-bold text-white">
                  Subject: [JOBLYTIC ALERTS] Action Required: {showEmailModal.title}
                </h3>
              </div>
              <button
                onClick={() => setShowEmailModal(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-3">
              <p>Dear <strong>{candidate.name}</strong>,</p>
              <p>
                This is an automated proactive notification from Joblytic AI. The application form for <strong>{showEmailModal.title}</strong> is closing on <strong>{showEmailModal.deadlineDate} ({showEmailModal.daysRemaining} days remaining)</strong>.
              </p>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1">
                <p className="text-emerald-400 font-bold">Codex Verification Summary:</p>
                <p>• Category: {candidate.category}</p>
                <p>• Document Status: 2 Complete, 1 Format Fix Required, 1 Missing</p>
              </div>
              <p>
                Please ensure all documents are verified before final payment.
              </p>
            </div>

            <button
              onClick={() => setShowEmailModal(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
            >
              Close Email Preview
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
