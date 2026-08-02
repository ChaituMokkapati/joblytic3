import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Verification from '../models/Verification.js';
import Job from '../models/Job.js';
import { isMongoReady } from '../config/db.js';
import { runDocumentChecklistAgent } from '../agents/documentAgent.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const memoryHistory = [];

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, JPG, and PNG files are allowed.'));
  }
});

async function resolveJobRequiredDocs(jobId) {
  if (jobId == null || jobId === '') return { job: null, requiredDocuments: [] };
  const numericId = Number(jobId);
  if (isMongoReady()) {
    const job = await Job.findOne({ id: Number.isNaN(numericId) ? jobId : numericId }).lean();
    if (job) return { job, requiredDocuments: job.requiredDocuments || [] };
  }
  return { job: null, requiredDocuments: [] };
}

/**
 * POST /api/verify-docs/parse-pdf
 * Upload a notification PDF (or pass pdfUrl) → extract required documents only.
 */
router.post('/parse-pdf', upload.single('notificationPdf'), async (req, res) => {
  try {
    const pdfUrl = req.body?.pdfUrl || '';
    const result = await runDocumentChecklistAgent({
      pdfPath: req.file?.path,
      pdfUrl: pdfUrl || undefined,
      vaultDocuments: [],
      jobRequiredDocuments: [],
      preferPdf: true
    });

    res.json({
      success: true,
      message: 'Notification PDF parsed for required documents.',
      extractMethod: result.extractMethod,
      pdfMeta: result.pdfMeta,
      errors: result.errors,
      requiredDocuments: result.requiredDocuments,
      count: result.requiredDocuments.length
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/verify-docs/checklist
 * multipart: optional notificationPdf
 * body: jobId, documents, pdfUrl (optional)
 */
router.post('/checklist', upload.single('notificationPdf'), async (req, res) => {
  try {
    let vaultDocuments = req.body.documents;
    if (typeof vaultDocuments === 'string') {
      try {
        vaultDocuments = JSON.parse(vaultDocuments);
      } catch {
        vaultDocuments = [];
      }
    }
    if (!Array.isArray(vaultDocuments)) vaultDocuments = [];

    const { jobId } = req.body;
    const pdfUrl = req.body.pdfUrl || '';
    const { job, requiredDocuments } = await resolveJobRequiredDocs(jobId);

    const result = await runDocumentChecklistAgent({
      pdfPath: req.file?.path,
      pdfUrl: pdfUrl || job?.pdfNotificationUrl || undefined,
      jobRequiredDocuments: requiredDocuments,
      vaultDocuments,
      preferPdf: true
    });

    res.json({
      success: true,
      jobId: jobId || null,
      jobTitle: job?.title || null,
      ...result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const handleDocUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file uploaded.' });
    }

    const { docType, candidateName, jobId } = req.body;
    const fileUrlPath = `/uploads/${req.file.filename}`;
    const sizeKB = Math.round(req.file.size / 1024);
    let verificationStatus = 'VERIFIED';
    const issues = [];

    if (req.file.size > 2 * 1024 * 1024) {
      verificationStatus = 'WARNING';
      issues.push('File size exceeds recommended 2MB threshold.');
    }

    const recordData = {
      jobId: jobId || 'general',
      candidateName: candidateName || 'Candidate',
      docType: docType || 'Document',
      originalName: req.file.originalname,
      filename: req.file.filename,
      fileUrl: fileUrlPath,
      sizeKB: `${sizeKB} KB`,
      mimetype: req.file.mimetype,
      status: verificationStatus,
      issues,
      uploadedAt: new Date().toISOString()
    };

    if (isMongoReady()) {
      const mongoRecord = await Verification.create(recordData);
      return res.status(200).json({
        success: true,
        message: 'Document uploaded and verified (MongoDB)',
        verification: mongoRecord
      });
    }

    memoryHistory.push(recordData);
    res.status(200).json({
      success: true,
      message: 'Document uploaded and verified (In-Memory)',
      verification: recordData
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

router.post('/upload', upload.single('document'), handleDocUpload);
router.post('/', upload.single('document'), handleDocUpload);

const handleGetHistory = async (req, res) => {
  try {
    if (isMongoReady()) {
      const mongoHistory = await Verification.find().sort({ createdAt: -1 }).lean();
      return res.json({ success: true, count: mongoHistory.length, history: mongoHistory });
    }
    res.json({ success: true, count: memoryHistory.length, history: memoryHistory });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

router.get('/history', handleGetHistory);
router.get('/', handleGetHistory);

router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  if (err) return res.status(400).json({ success: false, error: err.message });
  next();
});

export default router;
