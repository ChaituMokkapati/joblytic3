import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import VaultDocument from '../models/VaultDocument.js';
import VaultProfile from '../models/VaultProfile.js';
import { isMongoReady } from '../config/db.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/** In-memory fallback when Mongo is down */
const memoryDocs = [];
const memoryProfiles = new Map();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname) || '';
    cb(null, `vault-${unique}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
  }
});

function formatFromMime(mimetype, originalName) {
  if (mimetype === 'application/pdf') return 'PDF';
  if (mimetype === 'image/png') return 'PNG';
  if (mimetype.includes('jpeg') || mimetype.includes('jpg')) return 'JPG';
  const ext = path.extname(originalName).replace('.', '').toUpperCase();
  return ext || 'FILE';
}

function evaluateStatus({ type, fileFormat, fileSizeKB, issueDate }) {
  const issues = [];
  let status = 'VERIFIED';

  if (type === 'Biometric' && /photo/i.test(type) === false) {
    // handled below via name heuristics in route
  }

  if (fileFormat === 'JPG' || fileFormat === 'JPEG' || fileFormat === 'PNG') {
    if (fileSizeKB > 100) {
      status = 'ATTENTION_REQUIRED';
      issues.push(`File size ${fileSizeKB}KB is large for many gov forms (often ≤50–100KB for photos).`);
    }
  }

  if (issueDate) {
    const issued = new Date(issueDate);
    if (!Number.isNaN(issued.getTime())) {
      const cutoff = new Date('2025-04-01');
      if (/caste|obc|ews|category/i.test(String(type)) && issued < cutoff) {
        status = 'EXPIRED_OR_INVALID';
        issues.push('Category certificate issued before 01-04-2025 may be rejected for many central posts.');
      }
    }
  }

  return { status, issueNote: issues.join(' ') };
}

function toClientDoc(doc) {
  const raw = doc.toObject ? doc.toObject() : { ...doc };
  const id = String(raw._id || raw.id);
  return {
    id,
    _id: id,
    ownerEmail: raw.ownerEmail,
    name: raw.name,
    type: raw.type,
    fileName: raw.fileName,
    fileFormat: raw.fileFormat,
    fileSizeKB: raw.fileSizeKB,
    dimensions: raw.dimensions || 'N/A (Document)',
    issueDate: raw.issueDate || '',
    uploadDate: raw.uploadDate,
    status: raw.status,
    issueNote: raw.issueNote || '',
    fileUrl: raw.fileUrl,
    previewUrl: raw.previewUrl || raw.fileUrl,
    mimetype: raw.mimetype,
    createdAt: raw.createdAt
  };
}

function resolveEmail(req) {
  const email = (req.query.email || req.body?.email || req.headers['x-user-email'] || '')
    .toString()
    .toLowerCase()
    .trim();
  return email;
}

/**
 * GET /api/vault/profile?email=
 */
router.get('/profile', async (req, res) => {
  try {
    const email = resolveEmail(req);
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });

    if (isMongoReady()) {
      let profile = await VaultProfile.findOne({ email }).lean();
      if (!profile) {
        profile = await VaultProfile.create({
          email,
          name: email.split('@')[0],
          phone: '',
          category: 'General',
          qualification: ''
        });
        profile = profile.toObject();
      }
      return res.json({ success: true, profile });
    }

    if (!memoryProfiles.has(email)) {
      memoryProfiles.set(email, {
        email,
        name: email.split('@')[0],
        phone: '',
        category: 'General',
        qualification: '',
        dob: '',
        whatsappEnabled: true,
        emailEnabled: true
      });
    }
    res.json({ success: true, profile: memoryProfiles.get(email) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/vault/profile
 */
router.put('/profile', async (req, res) => {
  try {
    const email = resolveEmail(req);
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });

    const patch = {
      name: req.body.name,
      phone: req.body.phone,
      category: req.body.category,
      qualification: req.body.qualification,
      dob: req.body.dob,
      whatsappEnabled: req.body.whatsappEnabled,
      emailEnabled: req.body.emailEnabled
    };
    Object.keys(patch).forEach((k) => patch[k] === undefined && delete patch[k]);

    if (isMongoReady()) {
      const profile = await VaultProfile.findOneAndUpdate(
        { email },
        { $set: { email, ...patch } },
        { upsert: true, new: true }
      ).lean();
      return res.json({ success: true, profile });
    }

    const prev = memoryProfiles.get(email) || { email };
    const next = { ...prev, ...patch, email };
    memoryProfiles.set(email, next);
    res.json({ success: true, profile: next });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/vault/documents?email=
 */
router.get('/documents', async (req, res) => {
  try {
    const email = resolveEmail(req);
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });

    if (isMongoReady()) {
      const docs = await VaultDocument.find({ ownerEmail: email }).sort({ createdAt: -1 });
      return res.json({
        success: true,
        count: docs.length,
        documents: docs.map(toClientDoc)
      });
    }

    const docs = memoryDocs.filter((d) => d.ownerEmail === email);
    res.json({ success: true, count: docs.length, documents: docs.map(toClientDoc) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/vault — profile + documents together
 */
router.get('/', async (req, res) => {
  try {
    const email = resolveEmail(req);
    if (!email) return res.status(400).json({ success: false, error: 'email is required' });

    let profile;
    let documents;

    if (isMongoReady()) {
      profile = await VaultProfile.findOne({ email }).lean();
      if (!profile) {
        const created = await VaultProfile.create({
          email,
          name: email.split('@')[0],
          category: 'General'
        });
        profile = created.toObject();
      }
      const docs = await VaultDocument.find({ ownerEmail: email }).sort({ createdAt: -1 });
      documents = docs.map(toClientDoc);
    } else {
      if (!memoryProfiles.has(email)) {
        memoryProfiles.set(email, {
          email,
          name: email.split('@')[0],
          phone: '',
          category: 'General',
          qualification: '',
          dob: '',
          whatsappEnabled: true,
          emailEnabled: true
        });
      }
      profile = memoryProfiles.get(email);
      documents = memoryDocs.filter((d) => d.ownerEmail === email).map(toClientDoc);
    }

    res.json({
      success: true,
      candidate: {
        ...profile,
        documents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/vault/upload
 * multipart field: document
 * body: email, name, type, issueDate, dimensions
 */
router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file uploaded.' });
    }

    const email = resolveEmail(req);
    if (!email) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ success: false, error: 'email is required' });
    }

    const fileFormat = formatFromMime(req.file.mimetype, req.file.originalname);
    const fileSizeKB = Math.round(req.file.size / 1024);
    const type = req.body.type || 'Document';
    const name =
      req.body.name ||
      path.basename(req.file.originalname, path.extname(req.file.originalname)) ||
      'Uploaded document';
    const issueDate = req.body.issueDate || '';
    const dimensions =
      req.body.dimensions ||
      (fileFormat === 'PDF' ? 'N/A (Document)' : 'As uploaded');

    const { status, issueNote } = evaluateStatus({
      type,
      fileFormat,
      fileSizeKB,
      issueDate
    });

    // Extra photo-size heuristic by name
    let finalStatus = status;
    let finalNote = issueNote;
    if (/photo|passport/i.test(name) && fileSizeKB > 50) {
      finalStatus = 'ATTENTION_REQUIRED';
      finalNote = [finalNote, `Passport photo is ${fileSizeKB}KB (many forms require ≤50KB).`]
        .filter(Boolean)
        .join(' ');
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const record = {
      ownerEmail: email,
      name,
      type,
      fileName: req.file.originalname,
      fileFormat,
      fileSizeKB,
      dimensions,
      issueDate,
      uploadDate: new Date().toISOString().slice(0, 10),
      status: finalStatus,
      issueNote: finalNote,
      filename: req.file.filename,
      fileUrl,
      mimetype: req.file.mimetype,
      previewUrl: fileFormat === 'PDF' ? '' : fileUrl
    };

    if (isMongoReady()) {
      const created = await VaultDocument.create(record);
      return res.status(201).json({
        success: true,
        message: 'Document saved to vault',
        document: toClientDoc(created)
      });
    }

    const mem = { ...record, id: `mem-${Date.now()}`, _id: `mem-${Date.now()}` };
    memoryDocs.unshift(mem);
    res.status(201).json({ success: true, message: 'Document saved (memory)', document: toClientDoc(mem) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PATCH /api/vault/documents/:id
 */
router.patch('/documents/:id', async (req, res) => {
  try {
    const email = resolveEmail(req);
    const { id } = req.params;
    const allowed = ['name', 'type', 'issueDate', 'dimensions', 'status', 'issueNote'];
    const patch = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) patch[key] = req.body[key];
    }

    if (isMongoReady()) {
      const query = { _id: id };
      if (email) query.ownerEmail = email;
      const updated = await VaultDocument.findOneAndUpdate(query, { $set: patch }, { new: true });
      if (!updated) return res.status(404).json({ success: false, error: 'Document not found' });
      return res.json({ success: true, document: toClientDoc(updated) });
    }

    const idx = memoryDocs.findIndex((d) => String(d.id || d._id) === String(id));
    if (idx < 0) return res.status(404).json({ success: false, error: 'Document not found' });
    if (email && memoryDocs[idx].ownerEmail !== email) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    memoryDocs[idx] = { ...memoryDocs[idx], ...patch };
    res.json({ success: true, document: toClientDoc(memoryDocs[idx]) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/vault/documents/:id?email=
 */
router.delete('/documents/:id', async (req, res) => {
  try {
    const email = resolveEmail(req);
    const { id } = req.params;

    if (isMongoReady()) {
      const query = { _id: id };
      if (email) query.ownerEmail = email;
      const doc = await VaultDocument.findOneAndDelete(query);
      if (!doc) return res.status(404).json({ success: false, error: 'Document not found' });
      const diskPath = path.join(uploadsDir, doc.filename);
      fs.unlink(diskPath, () => {});
      return res.json({ success: true, message: 'Document deleted' });
    }

    const idx = memoryDocs.findIndex((d) => String(d.id || d._id) === String(id));
    if (idx < 0) return res.status(404).json({ success: false, error: 'Document not found' });
    if (email && memoryDocs[idx].ownerEmail !== email) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    const [removed] = memoryDocs.splice(idx, 1);
    if (removed?.filename) {
      fs.unlink(path.join(uploadsDir, removed.filename), () => {});
    }
    res.json({ success: true, message: 'Document deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.use((err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, error: `Upload error: ${err.message}` });
  }
  if (err) return res.status(400).json({ success: false, error: err.message });
  next();
});

export default router;
