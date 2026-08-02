import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, FileText, CheckCircle, XCircle, AlertTriangle, FileCode, RefreshCw, Sliders, ArrowRight, Download, Eye, ExternalLink, ShieldCheck, Terminal, Upload, Loader2 } from 'lucide-react';
import { runDocumentChecklist, parseNotificationPdf } from '../api/jobsApi';
import { useToast } from './Toast';

function localFallbackAudit(currentJob, candidate) {
  const reqs = currentJob?.requiredDocuments || [];
  return reqs.map((req) => {
    const matchedDoc = (candidate?.documents || []).find(
      (doc) =>
        doc.type?.toLowerCase() === req.type?.toLowerCase() ||
        doc.name?.toLowerCase().includes((req.name || '').toLowerCase().split(' ')[0]) ||
        (req.id === 'doc-photo' && doc.id === 'vault-photo') ||
        (req.id === 'doc-sig' && doc.id === 'vault-sig') ||
        (req.id === 'doc-10th' && doc.id === 'vault-10th') ||
        (req.id === 'doc-degree' && doc.id === 'vault-degree') ||
        (req.id === 'doc-caste' && doc.id === 'vault-obc')
    );
    if (!matchedDoc) {
      return { requirement: req, matchedDoc: null, status: 'MISSING', reason: 'Document not found in candidate vault locker.' };
    }
    const isSizeOk = matchedDoc.fileSizeKB <= req.maxSizeKB && matchedDoc.fileSizeKB >= (req.minSizeKB || 0);
    const isFormatOk = (req.allowedFormat || []).includes(matchedDoc.fileFormat);
    if (!isSizeOk || !isFormatOk) {
      return {
        requirement: req,
        matchedDoc,
        status: 'FORMAT_SIZE_FIX_NEEDED',
        reason: !isSizeOk
          ? `File size (${matchedDoc.fileSizeKB} KB) exceeds maximum limit (${req.maxSizeKB} KB).`
          : `Format (${matchedDoc.fileFormat}) does not match required (${(req.allowedFormat || []).join('/')}).`
      };
    }
    return { requirement: req, matchedDoc, status: 'DONE', reason: 'Perfect match with job notification guidelines.' };
  });
}

export default function DocumentChecklistAgent({
  selectedJob,
  candidate,
  jobs,
  onSelectJob,
  onOpenOptimizerModal,
  onViewTerminalTrace
}) {
  const toast = useToast();
  const pdfInputRef = useRef(null);
  const [currentJob, setCurrentJob] = useState(selectedJob || jobs?.[0]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);
  const [analysisComplete, setAnalysisComplete] = useState(true);
  const [auditResults, setAuditResults] = useState(() => localFallbackAudit(selectedJob || jobs?.[0], candidate));
  const [extractMethod, setExtractMethod] = useState('local');
  const [apiError, setApiError] = useState(null);
  const [notificationPdf, setNotificationPdf] = useState(null);
  const [pdfMeta, setPdfMeta] = useState(null);
  const [parsingPdf, setParsingPdf] = useState(false);

  useEffect(() => {
    if (selectedJob) {
      setCurrentJob(selectedJob);
      setAuditResults(localFallbackAudit(selectedJob, candidate));
      setAnalysisComplete(true);
    }
  }, [selectedJob, candidate]);

  const handleRunAgentAudit = async () => {
    if (!currentJob) return;
    setIsAnalyzing(true);
    setAnalysisComplete(false);
    setAnalysisStep(1);
    setApiError(null);

    const step2 = setTimeout(() => setAnalysisStep(2), 600);
    const step3 = setTimeout(() => setAnalysisStep(3), 1200);

    try {
      const data = await runDocumentChecklist({
        jobId: currentJob.id,
        documents: candidate?.documents || [],
        notificationPdf: notificationPdf || undefined,
        pdfUrl: !notificationPdf ? currentJob.pdfNotificationUrl || undefined : undefined
      });
      clearTimeout(step2);
      clearTimeout(step3);
      setAnalysisStep(4);
      setExtractMethod(data.extractMethod || 'api');
      setPdfMeta(data.pdfMeta || null);
      setAuditResults(data.checklist || localFallbackAudit(currentJob, candidate));
      if (data.requiredDocuments?.length) {
        setCurrentJob((prev) => ({ ...prev, requiredDocuments: data.requiredDocuments }));
      }
      toast.success(
        `Checklist ready via ${data.extractMethod || 'rules'} · ${data.summary?.total ?? data.checklist?.length ?? 0} docs`
      );
    } catch (err) {
      clearTimeout(step2);
      clearTimeout(step3);
      setApiError(err.message);
      setExtractMethod('local_fallback');
      setAuditResults(localFallbackAudit(currentJob, candidate));
      setAnalysisStep(4);
      toast.error(err.message || 'Checklist failed');
    } finally {
      setIsAnalyzing(false);
      setAnalysisComplete(true);
    }
  };

  const handleParsePdfOnly = async () => {
    if (!notificationPdf && !currentJob?.pdfNotificationUrl) {
      toast.error('Upload a notification PDF or pick a job with a PDF URL');
      return;
    }
    setParsingPdf(true);
    try {
      const data = await parseNotificationPdf({
        notificationPdf: notificationPdf || undefined,
        pdfUrl: !notificationPdf ? currentJob?.pdfNotificationUrl || undefined : undefined
      });
      setExtractMethod(data.extractMethod || 'pdf_parse');
      setPdfMeta(data.pdfMeta || null);
      if (data.requiredDocuments?.length) {
        setCurrentJob((prev) =>
          prev ? { ...prev, requiredDocuments: data.requiredDocuments } : prev
        );
        setAuditResults(
          localFallbackAudit(
            { ...(currentJob || {}), requiredDocuments: data.requiredDocuments },
            candidate
          )
        );
      }
      toast.success(`Parsed ${data.count || 0} required docs from PDF`);
    } catch (err) {
      toast.error(err.message || 'PDF parse failed');
    } finally {
      setParsingPdf(false);
    }
  };

  const totalReqs = auditResults.length;
  const doneCount = auditResults.filter((r) => r.status === 'DONE').length;
  const fixCount = auditResults.filter((r) => r.status === 'FORMAT_SIZE_FIX_NEEDED').length;
  const missingCount = auditResults.filter((r) => r.status === 'MISSING' || r.status === 'EXPIRED_RULE').length;

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-emerald-500/30">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Core Innovation: Multi-Step Reasoning Codex Agent</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              AI Document Checklist Agent
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl">
              Select any target job below. The agent calls <code className="text-emerald-400">/api/verify-docs/checklist</code> to extract/normalize required docs, compare them with <strong className="text-emerald-400 font-semibold">{candidate.name}'s</strong> vault, and return DONE / MISSING / format fixes.
              {extractMethod && analysisComplete && (
                <span className="block mt-1 text-[10px] text-slate-500 font-mono">extractMethod: {extractMethod}</span>
              )}
              {apiError && <span className="block mt-1 text-[10px] text-amber-400">API fallback: {apiError}</span>}
            </p>
          </div>

          {/* Job Selector Dropdown */}
          <div className="w-full md:w-auto min-w-[280px]">
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
              Select Target Notification:
            </label>
            <select
              value={currentJob?.id ?? ''}
              onChange={(e) => {
                const found = jobs.find((j) => String(j.id) === String(e.target.value));
                if (found) {
                  setCurrentJob(found);
                  setAuditResults(localFallbackAudit(found, candidate));
                  if (onSelectJob) onSelectJob(found);
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-emerald-300 font-semibold focus:outline-none focus:border-emerald-500 shadow-inner"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.agency} - {(j.title || '').substring(0, 35)}... ({j.daysRemaining}d left)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Target Job Quick Info Card & Agent Execution Button */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {!currentJob ? (
            <p className="text-sm text-slate-400">
              No live scraped jobs yet. Open the Scrape tab and run the Scraping Agent.
            </p>
          ) : (
            <div className="flex items-center space-x-4 w-full">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 font-extrabold text-sm shrink-0">
                PDF
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {currentJob.agency}
                  </span>
                  <span className="text-xs text-slate-400">
                    Deadline:{' '}
                    <strong className="text-slate-200">
                      {currentJob.deadlineDate || currentJob.deadline}
                    </strong>{' '}
                    ({currentJob.daysRemaining} days remaining)
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-1 truncate">{currentJob.title}</h3>
                {currentJob.pdfNotificationUrl ? (
                  <a
                    href={currentJob.pdfNotificationUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-emerald-400 hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <span>Official notification link</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    No PDF URL on this job — upload a notification PDF below.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 w-full md:w-auto shrink-0">
            <button
              onClick={handleRunAgentAudit}
              disabled={isAnalyzing || !currentJob}
              className="flex-1 md:flex-initial py-3 px-6 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-950 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Parsing + auditing…' : 'Run Codex AI Audit'}</span>
            </button>

            <button
              onClick={onViewTerminalTrace}
              className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-emerald-400 font-semibold text-xs flex items-center space-x-1.5 transition"
              title="View raw tool calls in terminal"
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">Trace</span>
            </button>
          </div>
        </div>

        {/* Real PDF notification upload */}
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white">Official notification PDF</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Upload SSC/IBPS/UPSC notification PDF. Agent extracts “Documents Required” + size/format rules
              (OpenAI used if key is set; otherwise rule engine).
            </p>
            {notificationPdf && (
              <p className="text-[11px] text-emerald-400 font-mono mt-1 truncate">
                Selected: {notificationPdf.name}
              </p>
            )}
            {pdfMeta && (
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Parsed: {pdfMeta.pages} page(s) · {pdfMeta.chars} chars · method={extractMethod}
              </p>
            )}
          </div>
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              setNotificationPdf(f);
              setPdfMeta(null);
              if (f) toast.info(`PDF ready: ${f.name}`);
            }}
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => pdfInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-800"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              Choose PDF
            </button>
            <button
              type="button"
              disabled={parsingPdf || (!notificationPdf && !currentJob?.pdfNotificationUrl)}
              onClick={handleParsePdfOnly}
              className="px-3 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {parsingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Parse PDF
            </button>
            {notificationPdf && (
              <button
                type="button"
                onClick={() => {
                  setNotificationPdf(null);
                  setPdfMeta(null);
                  if (pdfInputRef.current) pdfInputRef.current.value = '';
                }}
                className="px-2 py-2 rounded-xl text-slate-500 hover:text-rose-300 text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reasoning Steps Animation */}
      {isAnalyzing && (
        <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 space-y-4 animate-pulse">
          <div className="flex items-center space-x-3">
            <Sparkles className="w-5 h-5 text-emerald-400 animate-spin" />
            <h4 className="text-sm font-bold text-white">Codex Agent Multi-Step Execution Progress:</h4>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className={`flex items-center space-x-2 ${analysisStep >= 1 ? 'text-emerald-400' : 'text-slate-600'}`}>
              <span>{analysisStep >= 1 ? '✓' : '○'}</span>
              <span>
                Step 1: Reading notification PDF (
                {notificationPdf?.name || currentJob?.pdfNotificationUrl || 'job templates'})
              </span>
            </div>
            <div className={`flex items-center space-x-2 ${analysisStep >= 2 ? 'text-emerald-400' : 'text-slate-600'}`}>
              <span>{analysisStep >= 2 ? '✓' : '○'}</span>
              <span>Step 2: Extracting Documents Required + size/format rules</span>
            </div>
            <div className={`flex items-center space-x-2 ${analysisStep >= 3 ? 'text-emerald-400' : 'text-slate-600'}`}>
              <span>{analysisStep >= 3 ? '✓' : '○'}</span>
              <span>Step 3: Accessing Candidate Vault Locker ({candidate?.documents?.length || 0} files scanned)</span>
            </div>
            <div className={`flex items-center space-x-2 ${analysisStep >= 4 ? 'text-emerald-400' : 'text-slate-600'}`}>
              <span>{analysisStep >= 4 ? '✓' : '○'}</span>
              <span>Step 4: Synthesizing Verification Matrix & Auto-Fix recommendations</span>
            </div>
          </div>
        </div>
      )}

      {/* Verification Matrix Summary Scorecard */}
      {analysisComplete && !isAnalyzing && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-slate-300 flex items-center justify-center font-bold text-sm">
              {totalReqs}
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono">Total Rules</p>
              <p className="text-sm font-bold text-white">Document Checks</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-emerald-800/60 bg-emerald-950/20 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-900/80 text-emerald-300 flex items-center justify-center font-bold text-sm">
              {doneCount}
            </div>
            <div>
              <p className="text-[10px] text-emerald-400 uppercase font-mono">Status: [✓ DONE]</p>
              <p className="text-sm font-bold text-emerald-200">Verified Ready</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-amber-800/60 bg-amber-950/20 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-900/80 text-amber-300 flex items-center justify-center font-bold text-sm">
              {fixCount}
            </div>
            <div>
              <p className="text-[10px] text-amber-400 uppercase font-mono">Status: [! FIX]</p>
              <p className="text-sm font-bold text-amber-200">Size / Spec Fix</p>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-rose-800/60 bg-rose-950/20 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-900/80 text-rose-300 flex items-center justify-center font-bold text-sm">
              {missingCount}
            </div>
            <div>
              <p className="text-[10px] text-rose-400 uppercase font-mono">Status: [X MISSING]</p>
              <p className="text-sm font-bold text-rose-200">Action Required</p>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Audit Checklist Table */}
      {analysisComplete && !isAnalyzing && (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden space-y-0">
          <div className="p-5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Personalized Verification Checklist</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Candidate: <strong className="text-emerald-400">{candidate.name}</strong> ({candidate.category})
            </span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {auditResults.map((result, idx) => {
              const req = result.requirement;
              const doc = result.matchedDoc;

              return (
                <div key={idx} className="p-5 hover:bg-slate-900/40 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Document details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      {result.status === 'DONE' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-extrabold font-mono flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> [✓] DONE
                        </span>
                      )}

                      {result.status === 'FORMAT_SIZE_FIX_NEEDED' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-extrabold font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> [!] FORMAT FIX
                        </span>
                      )}

                      {(result.status === 'MISSING' || result.status === 'EXPIRED_RULE') && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-extrabold font-mono flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-400" /> [X] MISSING / EXPIRED
                        </span>
                      )}

                      <span className="text-xs font-semibold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {req.type}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">{req.name}</h4>

                    {/* Guidelines extracted from Codex PDF Interpreter */}
                    <div className="text-xs text-slate-400 space-y-1">
                      <p>
                        <strong className="text-slate-300 font-mono">Job Spec:</strong> Format: {req.allowedFormat.join('/')} | Max Size: {req.maxSizeKB} KB {req.dimensions ? `| Dimensions: ${req.dimensions}` : ''}
                      </p>
                      <p className="text-slate-400 italic">
                        "{req.specificRule}"
                      </p>
                    </div>

                    {/* Matched document info */}
                    {doc ? (
                      <div className="text-xs text-emerald-400/90 font-mono bg-slate-950/70 p-2 rounded-lg border border-slate-800/80 inline-block mt-2">
                        Matched Vault File: <strong className="text-slate-200">{doc.fileName}</strong> ({doc.fileFormat}, {doc.fileSizeKB} KB, {doc.dimensions})
                      </div>
                    ) : (
                      <div className="text-xs text-rose-400/90 font-mono bg-rose-950/20 p-2 rounded-lg border border-rose-900/30 inline-block mt-2">
                        No candidate document found matching this rule in vault locker.
                      </div>
                    )}

                    {/* Reason Note */}
                    <p className={`text-xs font-medium mt-1 ${
                      result.status === 'DONE' ? 'text-emerald-400' : result.status === 'FORMAT_SIZE_FIX_NEEDED' ? 'text-amber-300' : 'text-rose-400'
                    }`}>
                      {result.reason}
                    </p>
                  </div>

                  {/* Right: Quick Action Buttons */}
                  <div className="w-full md:w-auto flex items-center space-x-2 pt-2 md:pt-0">
                    {result.status === 'FORMAT_SIZE_FIX_NEEDED' && (
                      <button
                        onClick={() => onOpenOptimizerModal(doc, req)}
                        className="w-full md:w-auto py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md transition"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Launch 1-Click AI Resizer</span>
                      </button>
                    )}

                    {result.status === 'EXPIRED_RULE' && (
                      <button
                        onClick={() => alert(`Guidance: Obtain new GoI Format ${req.name} issued after April 1, 2025 from Tehsildar/SDM portal.`)}
                        className="w-full md:w-auto py-2 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs flex items-center justify-center space-x-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download GoI Format Template</span>
                      </button>
                    )}

                    {result.status === 'MISSING' && (
                      <button
                        onClick={() => alert(`Please upload ${req.name} into candidate vault locker.`)}
                        className="w-full md:w-auto py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-1 transition"
                      >
                        <span>Upload File to Vault</span>
                      </button>
                    )}

                    {result.status === 'DONE' && (
                      <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-400 text-xs font-bold flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" /> Ready for Form
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
