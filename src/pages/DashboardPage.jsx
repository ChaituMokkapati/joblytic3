import React, { useState } from 'react';

const STATS = [
  { value: '100M+', label: 'Users', icon: '👤' },
  { value: '25+', label: 'Portals Aggregated', icon: '🌐' },
  { value: '100%', label: 'Doc Verification Accuracy', icon: '✅' },
];

const FILTERS = ['All', 'Central', 'Bank', 'Railway', 'State PSC'];

const JOBS = [
  {
    id: 'ssc-cgl',
    title: 'SSC CGL 2026',
    org: 'Staff Selection Commission',
    category: 'Central',
    posts: '17,727',
    fee: '₹100',
    salary: '₹36,400 – ₹1,42,400',
    lastDate: '2026-07-31',
    badge: '🔥 Hot',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    url: 'https://ssc.gov.in',
    urgent: true,
  },
  {
    id: 'rrb-ntpc',
    title: 'RRB NTPC',
    org: 'Railway Recruitment Board',
    category: 'Railway',
    posts: '11,558',
    fee: '₹500',
    salary: '₹19,900 – ₹35,400',
    lastDate: '2026-08-01',
    badge: '🚂 Railway',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    url: 'https://indianrailways.gov.in',
    urgent: false,
  },
  {
    id: 'ibps-po',
    title: 'IBPS PO',
    org: 'Institute of Banking Personnel',
    category: 'Bank',
    posts: '4,455',
    fee: '₹850 / ₹175',
    salary: '₹52,000+',
    lastDate: '2026-08-03',
    badge: '🏦 Bank',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    url: 'https://ibps.in',
    urgent: false,
  },
  {
    id: 'upsc',
    title: 'UPSC CSE',
    org: 'Union Public Service Commission',
    category: 'Central',
    posts: '1,056',
    fee: '₹100',
    salary: 'Grade A & B',
    lastDate: 'TBD',
    badge: '🏛️ UPSC',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    url: 'https://upsc.gov.in',
    urgent: false,
  },
  {
    id: 'tspsc-g1',
    title: 'TSPSC Group 1',
    org: 'Telangana State PSC',
    category: 'State PSC',
    posts: '563',
    fee: '₹200 / ₹100',
    salary: 'Grade 1 Services',
    lastDate: 'TBD',
    badge: '📋 State PSC',
    badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
    url: 'https://tspsc.gov.in',
    urgent: false,
  },
  {
    id: 'sbi-clerk',
    title: 'SBI Clerk 2026',
    org: 'State Bank of India',
    category: 'Bank',
    posts: '13,735',
    fee: '₹750 / ₹0',
    salary: '₹26,000+',
    lastDate: 'TBD',
    badge: '🏦 SBI',
    badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    url: 'https://sbi.co.in',
    urgent: false,
  },
];

function ToggleSwitch({ jobId, initial = false }) {
  const [on, setOn] = useState(initial);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
        on
          ? 'bg-green-500/20 border-green-500/40 text-green-400'
          : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${on ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`} />
      Alerts {on ? 'ON' : 'OFF'}
    </button>
  );
}

function DocVerifyButton({ jobId }) {
  const [state, setState] = useState('idle'); // idle | loading | done

  const handleClick = () => {
    setState('loading');
    setTimeout(() => setState('done'), 1800);
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === 'loading'}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
        state === 'done'
          ? 'bg-green-500/20 border border-green-500/40 text-green-400'
          : state === 'loading'
          ? 'bg-green-500/10 border border-green-500/20 text-green-300 cursor-wait'
          : 'bg-green-500 hover:bg-green-400 text-black'
      }`}
    >
      {state === 'loading' && (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      )}
      {state === 'done' ? '✅ Verified!' : state === 'loading' ? 'Verifying…' : '🤖 Run AI Doc Verification'}
    </button>
  );
}

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = JOBS.filter(j => {
    const matchFilter = filter === 'All' || j.category === filter;
    const matchSearch = j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.org.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient */}
      <div className="ambient-orb w-[500px] h-[500px] bg-amber-500 top-[-100px] right-[-150px]" />
      <div className="ambient-orb w-[400px] h-[400px] bg-green-500 bottom-0 left-[-100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
              <span className="gradient-text-amber">AMB</span> Dashboard
            </h1>
            <p className="text-gray-400 text-sm">Government Job Control Room — Live Updates</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            <span className="text-green-400 text-xs font-semibold">LIVE</span>
            <span className="text-gray-500 text-xs">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {STATS.map((s, i) => (
            <div key={i} className="glass-card p-5 flex items-center gap-4 border border-white/[0.06]">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-2xl">
                {s.icon}
              </div>
              <div>
                <div className="text-2xl font-black gradient-text-amber">{s.value}</div>
                <div className="text-gray-400 text-xs font-medium">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search jobs by title, organization..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/8 transition-all"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  filter === f
                    ? 'bg-amber-500 border-amber-500 text-black'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Showing <span className="text-white font-semibold">{filtered.length}</span> jobs
            {filter !== 'All' && <span className="text-amber-400"> · {filter}</span>}
          </p>
          <span className="text-xs text-gray-500">Updated 2 min ago</span>
        </div>

        {/* Job Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((job) => {
            const isUrgent = job.lastDate !== 'TBD' && job.lastDate <= today;

            return (
              <div
                key={job.id}
                className="glass-card border border-white/[0.06] hover:border-amber-500/30 p-6 rounded-2xl flex flex-col gap-4 transition-all duration-300 group"
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-bold text-base group-hover:text-amber-400 transition-colors">
                        {job.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${job.badgeColor}`}>
                        {job.badge}
                      </span>
                      {isUrgent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          ⚠️ LAST DATE TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-xs">{job.org}</p>
                  </div>
                </div>

                {/* Job Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Posts', value: job.posts },
                    { label: 'Fee', value: job.fee },
                    { label: 'Salary', value: job.salary },
                    { label: 'Last Date', value: job.lastDate, highlight: job.lastDate === 'TBD' ? false : job.lastDate <= '2026-08-01' },
                  ].map((info, i) => (
                    <div key={i} className="bg-white/[0.03] rounded-lg p-3 border border-white/[0.04]">
                      <div className="text-gray-500 text-[10px] uppercase tracking-wider mb-0.5">{info.label}</div>
                      <div className={`text-xs font-bold ${info.highlight ? 'text-red-400' : 'text-white'}`}>
                        {info.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-white/[0.04]">
                  <DocVerifyButton jobId={job.id} />
                  <ToggleSwitch jobId={job.id} initial={job.id === 'ssc-cgl'} />
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-lg transition-all hover:scale-105"
                  >
                    Portal →
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-gray-400">No jobs found for "{search}"</p>
            <button onClick={() => { setSearch(''); setFilter('All'); }} className="mt-4 text-amber-400 text-sm hover:underline">
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
