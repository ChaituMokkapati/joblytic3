import React, { useState } from 'react';
import { Sparkles, Bell, BellOff, Search, Clock, Award, Users, Filter, Loader2, AlertCircle } from 'lucide-react';
import PortalScrapeProgress from './PortalScrapeProgress';

export default function DeadlineDashboard({
  jobs = [],
  loading = false,
  isScraping = false,
  portalStatuses = [],
  error = null,
  onSelectJobForChecklist = () => {},
  onToggleAlert = () => {},
  onCategoryChange = () => {},
  onRefreshJobs = null,
  onSearchFilters = null,
  jobStats = null,
  activeCategory = 'All'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [locationFilter, setLocationFilter] = useState('');
  const [qualificationFilter, setQualificationFilter] = useState('');

  // Available Job Categories
  const categories = ['All', 'Central', 'Bank', 'Railway', 'State PSC'];

  // Safe list of jobs array
  const safeJobsList = Array.isArray(jobs) ? jobs : [];

  // Filter & Sort
  const filteredJobs = safeJobsList
    .filter((job) => {
      if (!job) return false;
      const title = job.title || '';
      const agency = job.agency || '';
      const location = job.location || '';
      const qualification = job.qualification || '';
      const matchesSearch =
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agency.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        qualification.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = activeCategory === 'All' || job.category === activeCategory;
      const matchesLocation =
        !locationFilter.trim() || location.toLowerCase().includes(locationFilter.trim().toLowerCase());
      const matchesQualification =
        !qualificationFilter.trim() ||
        qualification.toLowerCase().includes(qualificationFilter.trim().toLowerCase());
      
      const daysLeft = typeof job.daysRemaining === 'number' 
        ? job.daysRemaining 
        : Math.max(1, Math.ceil((new Date(job.deadline || job.deadlineDate) - new Date()) / (1000 * 60 * 60 * 24))) || 5;

      const matchesUrgency =
        urgencyFilter === 'All' ||
        (urgencyFilter === 'Urgent' && daysLeft <= 5) ||
        (urgencyFilter === 'Subscribed' && Boolean(job.alertSubscribed));

      return matchesSearch && matchesCategory && matchesUrgency && matchesLocation && matchesQualification;
    })
    .sort((a, b) => {
      const aDays = typeof a.daysRemaining === 'number' ? a.daysRemaining : 5;
      const bDays = typeof b.daysRemaining === 'number' ? b.daysRemaining : 5;
      return aDays - bDays; // Deadline Nearest First!
    });

  return (
    <div className="space-y-8 pb-12">
      
      {/* Hackathon Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0b1329] to-[#0d1c3a] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Track 4: Domain Agents - AMB SaaS Job Portal</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-['Outfit']">
              Unified Government Job <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">Deadline Dashboard</span>
            </h2>
            
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
              Multi-portal feed (SSC, UPSC, IBPS, RRB, State) with dedupe by title + agency + deadline.
              {jobStats && (
                <span className="block mt-1 text-xs font-mono text-emerald-400/90">
                  Aggregator: raw={jobStats.rawCount} clean={jobStats.cleanCount} removed={jobStats.duplicatesRemoved}
                </span>
              )}
            </p>

            <div className="pt-2 flex flex-wrap gap-4 items-center">
              {typeof onRefreshJobs === 'function' && (
                <button
                  type="button"
                  onClick={onRefreshJobs}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold"
                >
                  Refresh & scrape portals
                </button>
              )}
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                <Users className="w-4 h-4 text-emerald-400" />
                <span><strong className="text-white">Live scrape</strong> · no API keys</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-300 bg-slate-800/80 px-3.5 py-2 rounded-xl border border-slate-700/60">
                <Award className="w-4 h-4 text-cyan-400" />
                <span><strong className="text-white">Live Backend</strong> Synchronized</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-500/20">
              <Clock className="w-8 h-8" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-mono">Backend Endpoint</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">http://localhost:5000/api/jobs</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 glass-panel p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search job title, SSC, IBPS, UPSC, Railway..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Category Filter Buttons: All, Central, Bank, Railway, State PSC */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block mr-1" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Urgency Filter */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setUrgencyFilter('All')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              urgencyFilter === 'All' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400'
            }`}
          >
            All ({safeJobsList.length})
          </button>
          <button
            onClick={() => setUrgencyFilter('Urgent')}
            className={`px-3 py-1 rounded-lg text-xs font-medium ${
              urgencyFilter === 'Urgent' ? 'bg-rose-500/20 text-rose-300 font-semibold border border-rose-500/30' : 'text-slate-400'
            }`}
          >
            Closing Soon
          </button>
        </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              onSearchFilters?.({ location: e.target.value, qualification: qualificationFilter, q: searchTerm });
            }}
            placeholder="Filter by location (e.g. All India, Tamil Nadu)"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            value={qualificationFilter}
            onChange={(e) => {
              setQualificationFilter(e.target.value);
              onSearchFilters?.({ location: locationFilter, qualification: e.target.value, q: searchTerm });
            }}
            placeholder="Filter by qualification (e.g. Bachelor, 12th)"
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Loading / live scrape status */}
      {loading && (
        isScraping && portalStatuses.length > 0 ? (
          <PortalScrapeProgress
            portalStatuses={portalStatuses}
            title="Refreshing job feed from live portals"
          />
        ) : (
          <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-sm font-semibold text-slate-300">Loading saved jobs from database…</p>
          </div>
        )
      )}

      {/* Error State Banner */}
      {error && !loading && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Failed to connect to backend</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Job Grid / Job Cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              No job postings found for category "{activeCategory}".
            </div>
          ) : (
            filteredJobs.map((job) => {
              const daysLeft = typeof job.daysRemaining === 'number'
                ? job.daysRemaining
                : Math.max(1, Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24))) || 5;
              
              const isUrgent = daysLeft <= 3;
              const isWarning = daysLeft > 3 && daysLeft <= 7;

              return (
                <div
                  key={job.id || job._id || Math.random()}
                  className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between relative group border border-slate-800 hover:border-[#800020]/60 transition-all"
                >
                  {/* Top Row: Category & Urgency Badge */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <span className="px-2.5 py-1 text-[11px] font-bold text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 rounded-lg tracking-wider uppercase font-mono">
                        {job.category || 'Central'}
                      </span>

                      {/* Countdown Timer Badge */}
                      <div
                        className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${
                          isUrgent
                            ? 'bg-rose-950/90 text-rose-300 border-rose-800/80 animate-pulse'
                            : isWarning
                            ? 'bg-amber-950/90 text-amber-300 border-amber-800/80'
                            : 'bg-emerald-950/90 text-emerald-300 border-emerald-800/80'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>{daysLeft} Days Left</span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                      {job.title || 'Government Job Notification'}
                    </h3>

                    {/* Job Specs Summary */}
                    <div className="grid grid-cols-2 gap-2 text-xs py-2 border-y border-slate-800/80 text-slate-300 font-sans">
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Vacancies / Posts</span>
                        <span className="font-bold text-slate-100">{job.posts || '1,000 Posts'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Deadline</span>
                        <span className="font-semibold text-[#D4AF37] font-mono">{job.deadline || job.deadlineDate || '—'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Location</span>
                        <span className="font-semibold text-slate-200">{job.location || 'All India'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] uppercase font-mono">Qualification</span>
                        <span className="font-medium text-slate-200 line-clamp-1">{job.qualification || 'As per notification'}</span>
                      </div>
                    </div>

                    {/* Live scrape meta */}
                    <div className="space-y-1.5 text-[11px]">
                      <p className="text-slate-500 font-mono uppercase text-[10px]">Sources</p>
                      <div className="flex flex-wrap gap-1">
                        {(job.sourcePortals?.length ? job.sourcePortals : ['unknown']).map((src) => (
                          <span
                            key={src}
                            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300/90 font-mono"
                          >
                            {src}
                          </span>
                        ))}
                      </div>
                      {job.scrapedAt && (
                        <p className="text-slate-500 font-mono">
                          Scraped: {new Date(job.scrapedAt).toLocaleString()}
                        </p>
                      )}
                      {(job.applyLink || job.officialUrl) && (
                        <a
                          href={job.applyLink || job.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex text-emerald-400 hover:underline font-semibold"
                        >
                          Open apply / portal link →
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className="pt-5 space-y-2.5">
                    <button
                      onClick={() => onSelectJobForChecklist(job)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition group/btn"
                    >
                      <Sparkles className="w-4 h-4 text-slate-950 group-hover/btn:rotate-12 transition-transform" />
                      <span>Run AI Doc Verification</span>
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onToggleAlert(job.id)}
                        className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                          job.alertSubscribed
                            ? 'bg-emerald-950/60 border-emerald-700/80 text-emerald-300 hover:bg-emerald-900/60'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                      >
                        {job.alertSubscribed ? (
                          <>
                            <Bell className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                            <span>Alerts ON</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3.5 h-3.5 text-slate-500" />
                            <span>Set Alert</span>
                          </>
                        )}
                      </button>
                      {(job.applyLink || job.officialUrl) && (
                        <a
                          href={job.applyLink || job.officialUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl border border-slate-700 text-xs text-slate-200 hover:bg-slate-800"
                        >
                          Apply
                        </a>
                      )}
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

    </div>
  );
}
