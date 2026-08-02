import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  GraduationCap,
  Users,
  Search,
  Bell,
  FileCheck2,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Pencil,
  X,
  Save,
  Database
} from 'lucide-react';
import {
  fetchInstituteStudents,
  createInstituteStudent,
  updateInstituteStudent,
  deleteInstituteStudent,
  seedInstituteStudents
} from '../api/instituteApi';
import { useToast } from './Toast';
import DarkSelect from './DarkSelect';

const EXAMS = ['All', 'SSC', 'Banking', 'Railway', 'UPSC', 'State PSC'];
const TONES = ['success', 'warning', 'danger', 'info'];

const toneClass = {
  success: 'text-emerald-300 bg-emerald-950/40 border-emerald-800/50',
  warning: 'text-amber-300 bg-amber-950/40 border-amber-800/50',
  danger: 'text-rose-300 bg-rose-950/40 border-rose-800/50',
  info: 'text-cyan-300 bg-cyan-950/40 border-cyan-800/50'
};

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  state: '',
  batch: '',
  exams: [],
  docsReady: 0,
  docsTotal: 6,
  alertsOn: 0,
  status: 'Enrolled',
  tone: 'info',
  notes: ''
};

export default function CoachingInstitute({ candidate }) {
  const toast = useToast();
  const instituteEmail =
    candidate?.email ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}').email || 'institute@ambjobs.com';
      } catch {
        return 'institute@ambjobs.com';
      }
    })();

  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ students: 0, alerts: 0, ready: 0, atRisk: 0 });
  const [storage, setStorage] = useState('mongodb');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [query, setQuery] = useState('');
  const [examFilter, setExamFilter] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchInstituteStudents({
        instituteEmail,
        q: query,
        exam: examFilter,
        state: stateFilter,
        seed: true
      });
      setStudents(data.students || []);
      setStats(data.stats || { students: 0, alerts: 0, ready: 0, atRisk: 0 });
      setStorage(data.storage || 'memory');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [instituteEmail, query, examFilter, stateFilter]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  const states = useMemo(() => {
    const set = new Set(students.map((s) => s.state).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [students]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (s) => {
    setEditingId(s.id);
    setForm({
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      state: s.state || '',
      batch: s.batch || '',
      exams: s.exams || [],
      docsReady: s.docsReady ?? 0,
      docsTotal: s.docsTotal ?? 6,
      alertsOn: s.alertsOn ?? 0,
      status: s.status || 'Enrolled',
      tone: s.tone || 'info',
      notes: s.notes || ''
    });
    setShowForm(true);
  };

  const toggleExam = (ex) => {
    setForm((prev) => {
      const has = prev.exams.includes(ex);
      return {
        ...prev,
        exams: has ? prev.exams.filter((e) => e !== ex) : [...prev.exams, ex]
      };
    });
  };

  const saveStudent = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Student name is required');
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await updateInstituteStudent(editingId, form);
        toast.success('Student updated');
      } else {
        await createInstituteStudent({ ...form, instituteEmail });
        toast.success('Student added');
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeStudent = async (id, name) => {
    if (!window.confirm(`Remove ${name} from institute roster?`)) return;
    setBusy(true);
    try {
      await deleteInstituteStudent(id);
      toast.success('Student removed');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reseed = async () => {
    if (!window.confirm('Replace roster with demo seed students?')) return;
    setBusy(true);
    try {
      await seedInstituteStudents({ instituteEmail, force: true });
      toast.success('Demo cohort seeded');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#800020]/20 text-[#D4AF37] text-xs font-semibold border border-[#D4AF37]/30 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Coaching Institute Console
            </div>
            <h2 className="text-2xl font-extrabold text-white">Manage aspirants from one desk</h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Live Mongo roster for institute{' '}
              <span className="text-amber-300 font-mono text-xs">{instituteEmail}</span>. Track docs,
              alerts, and exam batches.
            </p>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
              <Database className="w-3 h-3" />
              Storage: {storage === 'mongodb' ? 'MongoDB' : 'In-memory fallback'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              disabled={loading || busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={reseed}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              Seed demo
            </button>
            <button
              type="button"
              onClick={openCreate}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#800020] text-white border border-[#D4AF37]/40 hover:opacity-90"
            >
              <Plus className="w-3.5 h-3.5" />
              Add student
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-mono">Students</p>
            <p className="text-xl font-bold text-white flex items-center gap-1">
              <Users className="w-4 h-4 text-emerald-400" /> {stats.students}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-mono">Active alerts</p>
            <p className="text-xl font-bold text-cyan-300 flex items-center gap-1">
              <Bell className="w-4 h-4" /> {stats.alerts}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-mono">Docs ready</p>
            <p className="text-xl font-bold text-emerald-400 flex items-center gap-1">
              <FileCheck2 className="w-4 h-4" /> {stats.ready}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-mono">At risk</p>
            <p className="text-xl font-bold text-amber-300">{stats.atRisk || 0}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-3 relative z-20">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search student, email, batch or state…"
            className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500/40"
          />
        </div>
        <DarkSelect
          label="Exam"
          value={examFilter}
          onChange={setExamFilter}
          options={EXAMS}
          className="md:w-44"
        />
        <DarkSelect
          label="State"
          value={stateFilter}
          onChange={setStateFilter}
          options={states}
          className="md:w-48"
          menuClassName="max-h-64"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/30 text-rose-300 text-xs">{error}</div>
      )}

      {showForm && (
        <form
          onSubmit={saveStudent}
          className="glass-panel p-5 rounded-2xl border border-[#D4AF37]/30 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">{editingId ? 'Edit student' : 'Add student'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name *"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="State"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              value={form.batch}
              onChange={(e) => setForm({ ...form, batch: e.target.value })}
              placeholder="Batch (e.g. SSC-2026-A)"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              placeholder="Status note"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="number"
              min={0}
              value={form.docsReady}
              onChange={(e) => setForm({ ...form, docsReady: Number(e.target.value) })}
              placeholder="Docs ready"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="number"
              min={1}
              value={form.docsTotal}
              onChange={(e) => setForm({ ...form, docsTotal: Number(e.target.value) })}
              placeholder="Docs total"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <input
              type="number"
              min={0}
              value={form.alertsOn}
              onChange={(e) => setForm({ ...form, alertsOn: Number(e.target.value) })}
              placeholder="Alerts on"
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
            />
            <DarkSelect
              label="Tone"
              value={form.tone}
              onChange={(tone) => setForm({ ...form, tone })}
              options={TONES.map((t) => ({ value: t, label: t }))}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMS.filter((e) => e !== 'All').map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => toggleExam(ex)}
                className={`text-[10px] px-2.5 py-1 rounded-lg border ${
                  form.exams.includes(ex)
                    ? 'bg-[#800020]/40 border-[#D4AF37]/50 text-[#D4AF37]'
                    : 'border-slate-700 text-slate-400'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Coach notes…"
            rows={2}
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-500"
          >
            <Save className="w-3.5 h-3.5" />
            {editingId ? 'Save changes' : 'Create student'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center text-slate-400 text-sm py-12">Loading institute roster…</div>
      ) : students.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-12 border border-dashed border-slate-700 rounded-2xl">
          No students yet. Add one or click <strong className="text-amber-300">Seed demo</strong>.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {students.map((s) => (
            <div key={s.id} className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-bold text-white">{s.name}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {s.state}
                    {s.batch ? ` · ${s.batch}` : ''}
                  </p>
                  {s.email ? <p className="text-[10px] text-slate-500 mt-0.5">{s.email}</p> : null}
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-lg border shrink-0 ${toneClass[s.tone] || toneClass.info}`}>
                  {s.status}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(s.exams || []).map((ex) => (
                  <span
                    key={ex}
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"
                  >
                    {ex}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-mono">Docs</p>
                  <p className="font-bold text-emerald-300">
                    {s.docsReady}/{s.docsTotal}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                  <p className="text-slate-500 text-[10px] uppercase font-mono">Alerts</p>
                  <p className="font-bold text-cyan-300">{s.alertsOn}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[11px] border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => removeStudent(s.id, s.name)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] border border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
