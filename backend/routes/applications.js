import express from 'express';
import Application from '../models/Application.js';
import { isMongoReady } from '../config/db.js';

const router = express.Router();
const memoryApplications = [];
const STATUSES = ['saved', 'applied', 'admit_card', 'exam', 'result'];
const RESULT_STATUSES = ['', 'pending', 'qualified', 'not_qualified', 'awaited'];

const pickFields = (body) => {
  const data = {};
  const keys = [
    'status',
    'examDate',
    'admitCardDate',
    'admitCardUrl',
    'resultDate',
    'resultStatus',
    'resultNote',
    'notes',
    'applyLink',
    'agency',
    'jobTitle'
  ];
  for (const k of keys) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (data.status && !STATUSES.includes(data.status)) delete data.status;
  if (data.resultStatus && !RESULT_STATUSES.includes(data.resultStatus)) delete data.resultStatus;
  return data;
};

router.get('/', async (req, res) => {
  try {
    const email = (req.query.email || '').toLowerCase().trim();
    if (isMongoReady()) {
      const filter = email ? { email } : {};
      const apps = await Application.find(filter).sort({ updatedAt: -1 }).lean();
      return res.json({ success: true, count: apps.length, applications: apps });
    }
    const apps = email ? memoryApplications.filter((a) => a.email === email) : memoryApplications;
    res.json({ success: true, count: apps.length, applications: apps });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { userId, email, jobId, jobTitle, agency, status, applyLink } = req.body;
  if (!jobId || !jobTitle) {
    return res.status(400).json({ success: false, error: 'jobId and jobTitle are required.' });
  }

  const extra = pickFields(req.body);
  const data = {
    userId: userId || null,
    email: (email || '').toLowerCase().trim(),
    jobId,
    jobTitle,
    agency: agency || '',
    status: STATUSES.includes(status) ? status : 'saved',
    examDate: null,
    admitCardDate: null,
    admitCardUrl: '',
    resultDate: null,
    resultStatus: '',
    resultNote: '',
    notes: '',
    applyLink: applyLink || '',
    ...extra,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (isMongoReady()) {
      const created = await Application.create(data);
      return res.status(201).json({ success: true, application: created });
    }
    const created = { id: `app-${Date.now()}`, ...data };
    memoryApplications.unshift(created);
    res.status(201).json({ success: true, application: created });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/:id', async (req, res) => {
  const updates = { ...pickFields(req.body), updatedAt: new Date().toISOString() };
  try {
    if (isMongoReady()) {
      const updated = await Application.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!updated) return res.status(404).json({ success: false, error: 'Application not found' });
      return res.json({ success: true, application: updated });
    }
    const idx = memoryApplications.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Application not found' });
    memoryApplications[idx] = { ...memoryApplications[idx], ...updates };
    res.json({ success: true, application: memoryApplications[idx] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (isMongoReady()) {
      const deleted = await Application.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Application not found' });
      return res.json({ success: true, application: deleted });
    }
    const idx = memoryApplications.findIndex((a) => a.id === req.params.id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Application not found' });
    const [removed] = memoryApplications.splice(idx, 1);
    res.json({ success: true, application: removed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
