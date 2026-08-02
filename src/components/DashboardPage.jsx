import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import DeadlineDashboard from './DeadlineDashboard';
import DocumentChecklistAgent from './DocumentChecklistAgent';
import CandidateVault from './CandidateVault';
import AlertAgent from './AlertAgent';
import AgentTerminal from './AgentTerminal';
import DocumentOptimizerModal from './DocumentOptimizerModal';
import ProfileBoard from './ProfileBoard';
import ApplicationTracker from './ApplicationTracker';
import CoachingInstitute from './CoachingInstitute';
import ScrapingAgentPanel from './ScrapingAgentPanel';

import { fetchJobs, checkHealth, subscribeAlert, runScrapingAgentStream } from '../api/jobsApi';
import { fetchVault, updateVaultProfile } from '../api/vaultApi';
import { ShieldCheck, Server } from 'lucide-react';
import { useToast } from './Toast';
import { initPortalStatuses, applyPortalEvent, DEFAULT_PORTAL_TOOLS } from './PortalScrapeProgress';
import { parseWorkspaceTab, workspacePath } from '../workspaceTabs';

const DEFAULT_DOCS = [];

function emptyCandidate(overrides = {}) {
  return {
    name: 'Candidate',
    email: '',
    phone: '',
    whatsappEnabled: true,
    emailEnabled: true,
    category: 'General',
    qualification: '',
    dob: '',
    documents: [],
    ...overrides
  };
}

function mapApiJob(apiJob) {
  const deadline = apiJob.deadline || apiJob.deadlineDate;
  const daysRemaining =
    typeof apiJob.daysRemaining === 'number'
      ? apiJob.daysRemaining
      : Math.max(0, Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24)));

  return {
    ...apiJob,
    id: apiJob.id,
    title: apiJob.title,
    agency: apiJob.agency || `${apiJob.category || 'Central'} Government Portal`,
    category: apiJob.category || 'Central',
    posts: apiJob.posts || apiJob.vacancies || 'As per notification',
    fee: apiJob.fee || 'As per notification',
    deadline,
    deadlineDate: deadline,
    salaryRange: apiJob.salary || apiJob.salaryRange || 'As per notification',
    location: apiJob.location || 'All India',
    qualification: apiJob.qualification || 'As per notification',
    officialUrl: apiJob.officialUrl || apiJob.applyLink || '',
    applyLink: apiJob.applyLink || apiJob.officialUrl || '',
    pdfNotificationUrl: apiJob.pdfNotificationUrl || '',
    sourcePortals: apiJob.sourcePortals || [],
    scrapedAt: apiJob.scrapedAt || null,
    daysRemaining,
    alertSubscribed: Boolean(apiJob.alertSubscribed),
    requiredDocuments: apiJob.requiredDocuments?.length > 0 ? apiJob.requiredDocuments : DEFAULT_DOCS
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const activeTab = parseWorkspaceTab(searchParams.get('tab'));
  const setActiveTab = (tab) => navigate(workspacePath(tab), { replace: false });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);
  const [jobs, setJobs] = useState([]);
  const [jobStats, setJobStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidate, setCandidate] = useState(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return emptyCandidate({
        name: stored.name || 'Candidate',
        email: stored.email || ''
      });
    } catch {
      return emptyCandidate();
    }
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [optimizerModal, setOptimizerModal] = useState({ isOpen: false, doc: null, req: null });
  const [backendStatus, setBackendStatus] = useState({ connected: false, message: 'Connecting to Express...' });
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [portalStatuses, setPortalStatuses] = useState([]);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    fetchBackendHealth();
    loadJobs('All');
    loadVault();
  }, []);

  const loadVault = async () => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      const email = stored.email || candidate.email;
      if (!email) return;

      const data = await fetchVault(email);
      const c = data.candidate || {};
      setCandidate({
        name: c.name || stored.name || email.split('@')[0],
        email: c.email || email,
        phone: c.phone || '',
        category: c.category || 'General',
        qualification: c.qualification || '',
        dob: c.dob || '',
        whatsappEnabled: c.whatsappEnabled !== false,
        emailEnabled: c.emailEnabled !== false,
        documents: Array.isArray(c.documents) ? c.documents : []
      });

      // Seed profile name from login user if vault profile is bare
      if (stored.name && (!c.name || c.name === email.split('@')[0])) {
        await updateVaultProfile(email, { name: stored.name }).catch(() => {});
      }
    } catch (err) {
      console.warn('Vault load failed:', err.message);
    }
  };

  const fetchBackendHealth = async () => {
    try {
      const data = await checkHealth();
      setBackendStatus({
        connected: true,
        message: `${data.status || 'Connected'} · ${data.database || ''}`
      });
    } catch (err) {
      setBackendStatus({ connected: false, message: 'Offline' });
    }
  };

  const loadJobs = async (categoryFilter = 'All', extra = {}) => {
    setSelectedCategory(categoryFilter);
    setLoading(true);
    setError(null);
    try {
      const payload = await fetchJobs(categoryFilter, extra);
      const dataArray = Array.isArray(payload) ? payload : payload.jobs || [];
      if (payload.stats) setJobStats(payload.stats);

      const mappedJobs = dataArray.map(mapApiJob);
      setJobs(mappedJobs);
      if (mappedJobs.length > 0) {
        setSelectedJob((prev) => {
          if (!prev) return mappedJobs[0];
          return mappedJobs.find((j) => String(j.id) === String(prev.id)) || mappedJobs[0];
        });
      }
      setLoading(false);
    } catch (err) {
      console.error('Failed to load jobs from backend API:', err);
      setError(err.message || 'Error fetching jobs from server');
      setJobs([]);
      setSelectedJob(null);
      setLoading(false);
    }
  };

  const handleRefreshJobs = async () => {
    setLoading(true);
    setIsScraping(true);
    setPortalStatuses(initPortalStatuses(DEFAULT_PORTAL_TOOLS));
    toast.info('Refreshing portals…');
    try {
      const data = await runScrapingAgentStream({
        persist: true,
        onEvent: (evt) => setPortalStatuses((prev) => applyPortalEvent(prev, evt))
      });
      if (data.stats) setJobStats(data.stats);
      const mapped = (data.jobs || []).map(mapApiJob);
      setJobs(mapped);
      if (mapped[0]) setSelectedJob(mapped[0]);
      setError(null);
      toast.success(`Scrape done: ${data.count ?? mapped.length} jobs from live portals`);
    } catch (err) {
      setError(err.message);
      toast.error(`Scrape failed: ${err.message}`);
    } finally {
      setLoading(false);
      setIsScraping(false);
    }
  };

  const handleToggleAlert = async (jobId) => {
    const job = jobs.find((j) => String(j.id) === String(jobId));
    const turningOn = job && !job.alertSubscribed;

    setJobs((prevJobs) =>
      prevJobs.map((j) => (String(j.id) === String(jobId) ? { ...j, alertSubscribed: !j.alertSubscribed } : j))
    );

    if (turningOn && job) {
      try {
        await subscribeAlert({
          jobId: job.id,
          jobTitle: job.title,
          email: candidate.email,
          phone: candidate.phone,
          channel: 'Email & WhatsApp',
          windows: [7, 3, 1]
        });
      } catch (err) {
        console.warn('Alert subscribe failed:', err.message);
      }
    }
  };

  const handleSelectJobForChecklist = (job) => {
    setSelectedJob(job);
    setActiveTab('checklist');
  };

  const handleOpenOptimizerModal = (doc, req) => {
    setOptimizerModal({ isOpen: true, doc, req });
  };

  const handleSaveOptimizedDoc = (updatedDoc) => {
    setCandidate((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === updatedDoc.id ? updatedDoc : d))
    }));
  };

  const activeAlertsCount = jobs.filter((j) => j.alertSubscribed).length;
  const jobsForAgents = jobs;

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('amb-alerts-count', { detail: { count: activeAlertsCount } }));
  }, [activeAlertsCount]);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
          <div className="w-10 h-10 rounded-xl bg-[#800020] text-[#D4AF37] border border-[#D4AF37]/50 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-serif font-bold text-white">Backend status</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${backendStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
              />
              <span className="text-xs text-slate-300 font-mono flex items-center gap-1 flex-wrap">
                <Server className="w-3 h-3 text-[#D4AF37]" /> Node+Express API (Port 5000):{' '}
                <strong className={backendStatus.connected ? 'text-emerald-400' : 'text-amber-400'}>
                  {backendStatus.message}
                </strong>
              </span>
            </div>
          </div>
        </div>

        {activeTab === 'dashboard' && (
          <DeadlineDashboard
            jobs={jobs}
            loading={loading}
            isScraping={isScraping}
            portalStatuses={portalStatuses}
            error={error}
            jobStats={jobStats}
            onSelectJobForChecklist={handleSelectJobForChecklist}
            onToggleAlert={handleToggleAlert}
            onCategoryChange={(cat) => loadJobs(cat)}
            onRefreshJobs={handleRefreshJobs}
            onSearchFilters={(filters) => loadJobs(selectedCategory, filters)}
            activeCategory={selectedCategory}
          />
        )}

        {activeTab === 'tracker' && <ApplicationTracker jobs={jobsForAgents} candidate={candidate} />}

        {activeTab === 'scrape' && (
          <ScrapingAgentPanel
            onJobsUpdated={() => {
              loadJobs(selectedCategory);
              fetchBackendHealth();
            }}
          />
        )}

        {activeTab === 'coaching' && <CoachingInstitute candidate={candidate} />}

        {activeTab === 'profile' && <ProfileBoard />}

        {activeTab === 'checklist' && (
          <DocumentChecklistAgent
            selectedJob={selectedJob}
            candidate={candidate}
            jobs={jobsForAgents}
            onSelectJob={setSelectedJob}
            onOpenOptimizerModal={handleOpenOptimizerModal}
            onViewTerminalTrace={() => setActiveTab('terminal')}
          />
        )}

        {activeTab === 'vault' && (
          <CandidateVault
            candidate={candidate}
            onUpdateCandidate={setCandidate}
            onOpenOptimizerModal={handleOpenOptimizerModal}
            onReloadVault={loadVault}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertAgent jobs={jobsForAgents} candidate={candidate} onToggleAlert={handleToggleAlert} />
        )}

        {activeTab === 'terminal' && (
          <AgentTerminal activeJob={selectedJob} candidate={candidate} />
        )}

        {optimizerModal.isOpen && optimizerModal.doc && (
          <DocumentOptimizerModal
            docToOptimize={optimizerModal.doc}
            requirement={optimizerModal.req}
            onClose={() => setOptimizerModal({ isOpen: false, doc: null, req: null })}
            onSaveOptimizedDoc={handleSaveOptimizedDoc}
          />
        )}
      </div>
    </div>
  );
}
