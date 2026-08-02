import React, { useRef, useState } from 'react';
import {
  FolderCheck,
  Upload,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Sliders,
  Trash2,
  Eye,
  Loader2,
  FileText,
  Calendar
} from 'lucide-react';
import { uploadVaultDocument, deleteVaultDocument, fileUrl, readImageDimensions } from '../api/vaultApi';
import { useToast } from './Toast';

const DOC_TYPES = ['Education', 'Biometric', 'Category', 'Identity', 'Self Declaration', 'Document', 'Other'];

export default function CandidateVault({
  candidate,
  onUpdateCandidate,
  onOpenOptimizerModal,
  onReloadVault
}) {
  const toast = useToast();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedDocPreview, setSelectedDocPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('Education');
  const [issueDate, setIssueDate] = useState('');
  const [typeOpen, setTypeOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(() => {
    const d = issueDate ? new Date(issueDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const email = candidate?.email;
  const documents = candidate?.documents || [];

  const closeMenus = () => {
    setTypeOpen(false);
    setDateOpen(false);
  };

  const formatDisplayDate = (iso) => {
    if (!iso) return 'Select date';
    const [y, m, d] = iso.split('-');
    if (!y || !m || !d) return iso;
    return `${d}-${m}-${y}`;
  };

  const calendarCells = (() => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const firstDow = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(day);
    return cells;
  })();

  const pickDay = (day) => {
    const y = calMonth.getFullYear();
    const m = String(calMonth.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    setIssueDate(`${y}-${m}-${d}`);
    setDateOpen(false);
  };

  const handleFiles = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;
    if (!email) {
      toast.error('Login required to upload to vault');
      return;
    }

    setUploading(true);
    try {
      const dimensions = await readImageDimensions(file);
      const name =
        docName.trim() ||
        file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') ||
        'Uploaded document';

      const data = await uploadVaultDocument({
        email,
        file,
        name,
        type: docType,
        issueDate,
        dimensions
      });

      const doc = data.document;
      onUpdateCandidate({
        ...candidate,
        documents: [doc, ...documents]
      });
      toast.success(`Saved to vault: ${doc.name}`);
      setDocName('');
      onReloadVault?.();
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      setDragActive(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDeleteDoc = async (docId) => {
    if (!email) return;
    try {
      await deleteVaultDocument(docId, email);
      onUpdateCandidate({
        ...candidate,
        documents: documents.filter((d) => String(d.id) !== String(docId))
      });
      toast.success('Document removed from vault');
      if (selectedDocPreview && String(selectedDocPreview.id) === String(docId)) {
        setSelectedDocPreview(null);
      }
    } catch (err) {
      toast.error(err.message || 'Delete failed');
    }
  };

  const previewSrc = (doc) => {
    const src = doc.previewUrl || doc.fileUrl;
    return fileUrl(src);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="glass-panel p-6 sm:p-8 rounded-3xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
              <FolderCheck className="w-3.5 h-3.5" />
              <span>Real vault · MongoDB + disk storage</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-['Outfit']">
              Personalized Document Vault
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
              Upload certificates, photos, and signatures. Files are stored on the server and metadata in MongoDB.
              Checklist Agent reads this vault for DONE / MISSING checks.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs space-y-1 min-w-[240px]">
            <p className="text-slate-400 font-mono">Profile Owner:</p>
            <p className="text-sm font-bold text-white">{candidate?.name || 'Candidate'}</p>
            <p className="text-emerald-400 font-semibold">{candidate?.category || 'General'} Category</p>
            <p className="text-slate-400">{candidate?.email}</p>
            <p className="text-slate-500 font-mono pt-1">{documents.length} file(s) stored</p>
          </div>
        </div>
      </div>

      {/* Upload meta + dropzone */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-6 overflow-visible">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 overflow-visible">
          <div className="min-w-0">
            <label className="block text-[11px] uppercase tracking-wide font-mono text-slate-400 mb-1.5">
              Document name
            </label>
            <input
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              placeholder="e.g. 10th Certificate"
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60"
            />
          </div>

          <div className="min-w-0 relative z-20">
            <label className="block text-[11px] uppercase tracking-wide font-mono text-slate-400 mb-1.5">
              Type
            </label>
            <button
              type="button"
              onClick={() => {
                setDateOpen(false);
                setTypeOpen((o) => !o);
              }}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-3 text-sm text-left text-white flex items-center justify-between gap-2 focus:outline-none focus:border-emerald-500/60"
            >
              <span className="truncate">{docType}</span>
              <span className={`text-slate-500 text-[10px] transition ${typeOpen ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {typeOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 cursor-default bg-transparent"
                  aria-label="Close type menu"
                  onClick={closeMenus}
                />
                <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 w-full rounded-xl border border-slate-700 bg-slate-950 shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                  {DOC_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setDocType(t);
                        setTypeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-sm border-b border-slate-800/80 last:border-0 transition ${
                        docType === t
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : 'text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="min-w-0 relative z-20">
            <label className="block text-[11px] uppercase tracking-wide font-mono text-slate-400 mb-1.5">
              Issue date
            </label>
            <button
              type="button"
              onClick={() => {
                setTypeOpen(false);
                setDateOpen((o) => !o);
                if (issueDate) {
                  const d = new Date(issueDate);
                  if (!Number.isNaN(d.getTime())) setCalMonth(new Date(d.getFullYear(), d.getMonth(), 1));
                }
              }}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-xl px-3 text-sm text-left text-white flex items-center justify-between gap-2 focus:outline-none focus:border-emerald-500/60"
            >
              <span className={issueDate ? 'text-white' : 'text-slate-500'}>{formatDisplayDate(issueDate)}</span>
              <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            </button>
            {dateOpen && (
              <>
                <button
                  type="button"
                  className="fixed inset-0 z-20 cursor-default bg-transparent"
                  aria-label="Close date menu"
                  onClick={closeMenus}
                />
                <div className="absolute right-0 top-[calc(100%+6px)] z-40 w-[280px] max-w-[calc(100vw-2rem)] rounded-xl border border-slate-700 bg-slate-950 shadow-2xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white text-sm"
                      onClick={() =>
                        setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))
                      }
                    >
                      ‹
                    </button>
                    <p className="text-xs font-semibold text-white font-mono">
                      {calMonth.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                    <button
                      type="button"
                      className="px-2 py-1 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white text-sm"
                      onClick={() =>
                        setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))
                      }
                    >
                      ›
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <div key={d} className="text-center text-[10px] text-slate-500 font-mono py-1">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {calendarCells.map((day, i) => {
                      if (day == null) return <div key={`e-${i}`} />;
                      const y = calMonth.getFullYear();
                      const m = String(calMonth.getMonth() + 1).padStart(2, '0');
                      const d = String(day).padStart(2, '0');
                      const iso = `${y}-${m}-${d}`;
                      const selected = issueDate === iso;
                      return (
                        <button
                          key={iso}
                          type="button"
                          onClick={() => pickDay(day)}
                          className={`h-8 rounded-lg text-xs font-medium transition ${
                            selected
                              ? 'bg-emerald-500 text-slate-950'
                              : 'text-slate-200 hover:bg-slate-800'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      className="text-xs text-slate-400 hover:text-white"
                      onClick={() => {
                        setIssueDate('');
                        setDateOpen(false);
                      }}
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                      onClick={() => {
                        const now = new Date();
                        const y = now.getFullYear();
                        const m = String(now.getMonth() + 1).padStart(2, '0');
                        const d = String(now.getDate()).padStart(2, '0');
                        setCalMonth(new Date(y, now.getMonth(), 1));
                        setIssueDate(`${y}-${m}-${d}`);
                        setDateOpen(false);
                      }}
                    >
                      Today
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`min-h-[200px] flex flex-col items-center justify-center gap-3 px-6 py-8 rounded-2xl border-2 border-dashed text-center transition ${
            dragActive
              ? 'border-emerald-400 bg-emerald-950/20'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/40'
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-inner">
            {uploading ? <Loader2 className="w-7 h-7 animate-spin" /> : <Upload className="w-7 h-7" />}
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white">
              {uploading ? 'Uploading to vault…' : 'Drag and drop or choose a file'}
            </h3>
            <p className="text-xs text-slate-400">PDF, JPG, PNG · max 8MB · stored under /uploads</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button
            type="button"
            disabled={uploading || !email}
            onClick={() => fileInputRef.current?.click()}
            className="mt-1 px-5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs inline-flex items-center gap-2 border border-emerald-500/40 disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" />
            Choose file to upload
          </button>
        </div>
      </div>

      {!documents.length && (
        <div className="p-10 rounded-2xl border border-slate-800 bg-slate-900/40 text-center text-slate-400 text-sm">
          Vault is empty. Upload your 10th certificate, degree, photo, signature, or category docs.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between space-y-4 border border-slate-800"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {doc.type}
                </span>

                {doc.status === 'VERIFIED' && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" /> VERIFIED
                  </span>
                )}
                {doc.status === 'ATTENTION_REQUIRED' && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400" /> ATTENTION
                  </span>
                )}
                {doc.status === 'EXPIRED_OR_INVALID' && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-rose-400" /> EXPIRED/RULES
                  </span>
                )}
                {doc.status === 'PENDING' && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold">
                    PENDING
                  </span>
                )}
              </div>

              <h4 className="text-sm font-bold text-white line-clamp-1">{doc.name}</h4>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs font-mono space-y-1 text-slate-300">
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">File Name:</span>
                  <span className="text-slate-200 truncate max-w-[150px]">{doc.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Format / Size:</span>
                  <span className="text-emerald-400">
                    {doc.fileFormat} ({doc.fileSizeKB} KB)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Dimensions:</span>
                  <span>{doc.dimensions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Issue Date:</span>
                  <span className="text-slate-200">{doc.issueDate || '—'}</span>
                </div>
              </div>

              {doc.issueNote && (
                <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 font-medium">
                  {doc.issueNote}
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center space-x-2">
              {doc.fileFormat !== 'PDF' && (
                <button
                  onClick={() => onOpenOptimizerModal(doc, null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center space-x-1 transition"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>AI Resizer</span>
                </button>
              )}

              <button
                onClick={() => setSelectedDocPreview(doc)}
                className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-semibold text-xs flex items-center space-x-1 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              <button
                onClick={() => handleDeleteDoc(doc.id)}
                className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-rose-950 border border-slate-800 hover:border-rose-800 text-slate-500 hover:text-rose-400 text-xs transition"
                title="Delete document"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedDocPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel p-6 rounded-3xl border border-slate-700 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{selectedDocPreview.name}</h3>
              <button
                onClick={() => setSelectedDocPreview(null)}
                className="text-slate-400 hover:text-white font-mono text-sm"
              >
                ✕
              </button>
            </div>

            <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
              {selectedDocPreview.fileFormat === 'PDF' ? (
                <div className="text-center text-slate-400 text-xs space-y-2 p-4">
                  <FileText className="w-10 h-10 mx-auto text-emerald-400" />
                  <p>PDF stored in vault</p>
                  <a
                    href={fileUrl(selectedDocPreview.fileUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 underline"
                  >
                    Open / download PDF
                  </a>
                </div>
              ) : (
                <img
                  src={previewSrc(selectedDocPreview)}
                  alt={selectedDocPreview.name}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            <div className="text-xs font-mono text-slate-300 space-y-1 bg-slate-900 p-3 rounded-xl">
              <p>File: {selectedDocPreview.fileName}</p>
              <p>
                Size: {selectedDocPreview.fileSizeKB} KB | Format: {selectedDocPreview.fileFormat}
              </p>
              <p>Dimensions: {selectedDocPreview.dimensions}</p>
            </div>

            <button
              onClick={() => setSelectedDocPreview(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
