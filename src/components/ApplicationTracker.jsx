import React, { useEffect, useState } from 'react';
import { Briefcase, Plus, Trash2, RefreshCw, Calendar, FileText, Trophy, ExternalLink } from 'lucide-react';
import { fetchApplications, createApplication, updateApplication, deleteApplication } from '../api/jobsApi';

const STATUSES = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'admit_card', label: 'Admit Card' },
  { value: 'exam', label: 'Exam' },
  { value: 'result', label: 'Result' }
];

const RESULT_STATUSES = [
  { value: '', label: '—' },
  { value: 'pending', label: 'Pending' },
  { value: 'awaited', label: 'Awaited' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'not_qualified', label: 'Not Qualified' }
];

export default function ApplicationTracker({ jobs = [], candidate }) {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [busy, setBusy] = useState(false);

  const email = candidate?.email || '';

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApplications(email);
      setApplications(data.applications || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [email]);

  const handleAdd = async () => {
    const job = jobs.find((j) => String(j.id) === String(selectedJobId));
    if (!job) return;
    setBusy(true);
    try {
      await createApplication({
        email,
        jobId: job.id,
        jobTitle: job.title,
        agency: job.agency,
        status: 'saved',
        applyLink: job.applyLink || job.officialUrl || ''
      });
      setSelectedJobId('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handlePatch = async (id, payload) => {
    setBusy(true);
    try {
      await updateApplication(id, payload);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id) => {
    setBusy(true);
    try {
      await deleteApplication(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/30 mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              Application Tracker
            </div>
            <h2 className="text-2xl font-extrabold text-white">Applications, admit cards, exams & results</h2>
            <p className="text-slate-400 text-sm mt-1">Saved → Applied → Admit Card → Exam → Result</p>
          </div>
          <button
            onClick={load}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-100"
          >
            <option value="">Select a job to track…</option>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title}
              </option>
            ))}
          </select>
          <button
            disabled={!selectedJobId || busy}
            onClick={handleAdd}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Add to Tracker
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">{error}</div>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-3xl">Loading applications…</div>
        ) : applications.length === 0 ? (
          <div className="glass-panel p-8 text-center text-slate-400 text-sm rounded-3xl">No tracked applications yet.</div>
        ) : (
          applications.map((app) => {
            const id = app._id || app.id;
            return (
              <div key={id} className="glass-panel p-5 rounded-3xl border border-slate-800 space-y-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{app.jobTitle}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{app.agency || 'Government'}</p>
                    {app.applyLink && (
                      <a
                        href={app.applyLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
                      >
                        Apply link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={app.status}
                      onChange={(e) => handlePatch(id, { status: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleDelete(id)}
                      className="p-2 rounded-lg border border-rose-800/50 text-rose-300 hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Exam date
                    </span>
                    <input
                      type="date"
                      defaultValue={app.examDate || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (app.examDate || '')) {
                          handlePatch(id, { examDate: e.target.value || null, status: app.status === 'saved' ? 'exam' : app.status });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Admit card date
                    </span>
                    <input
                      type="date"
                      defaultValue={app.admitCardDate || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (app.admitCardDate || '')) {
                          handlePatch(id, {
                            admitCardDate: e.target.value || null,
                            status: app.status === 'saved' || app.status === 'applied' ? 'admit_card' : app.status
                          });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Admit card URL</span>
                    <input
                      type="url"
                      placeholder="https://…"
                      defaultValue={app.admitCardUrl || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (app.admitCardUrl || '')) {
                          handlePatch(id, { admitCardUrl: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500 flex items-center gap-1">
                      <Trophy className="w-3 h-3" /> Result date
                    </span>
                    <input
                      type="date"
                      defaultValue={app.resultDate || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (app.resultDate || '')) {
                          handlePatch(id, { resultDate: e.target.value || null });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    />
                  </label>

                  <label className="space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Result status</span>
                    <select
                      value={app.resultStatus || ''}
                      onChange={(e) =>
                        handlePatch(id, {
                          resultStatus: e.target.value,
                          status: e.target.value ? 'result' : app.status
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    >
                      {RESULT_STATUSES.map((s) => (
                        <option key={s.value || 'empty'} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 md:col-span-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Result note</span>
                    <input
                      type="text"
                      placeholder="Score / rank / remark"
                      defaultValue={app.resultNote || ''}
                      onBlur={(e) => {
                        if (e.target.value !== (app.resultNote || '')) {
                          handlePatch(id, { resultNote: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-100"
                    />
                  </label>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
