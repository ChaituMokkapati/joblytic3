import express from 'express';
import InstituteStudent, { TONES, EXAMS } from '../models/InstituteStudent.js';
import { isMongoReady } from '../config/db.js';

const router = express.Router();

/** In-memory fallback when Mongo is down */
const memoryStudents = [];
let memorySeq = 1;

const SEED = [
  {
    name: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    phone: '9876500001',
    state: 'Uttar Pradesh',
    batch: 'SSC-2026-A',
    exams: ['SSC', 'Banking'],
    docsReady: 4,
    docsTotal: 6,
    alertsOn: 3,
    status: 'At risk — photo size',
    tone: 'warning'
  },
  {
    name: 'Ananya Iyer',
    email: 'ananya.iyer@example.com',
    phone: '9876500002',
    state: 'Tamil Nadu',
    batch: 'UPSC-Foundation',
    exams: ['UPSC', 'State PSC'],
    docsReady: 6,
    docsTotal: 6,
    alertsOn: 2,
    status: 'Ready to apply',
    tone: 'success'
  },
  {
    name: 'Mohammed Irfan',
    email: 'm.irfan@example.com',
    phone: '9876500003',
    state: 'Kerala',
    batch: 'Railway-Batch-2',
    exams: ['Railway', 'SSC'],
    docsReady: 3,
    docsTotal: 5,
    alertsOn: 1,
    status: 'Missing caste certificate',
    tone: 'danger'
  },
  {
    name: 'Priya Patel',
    email: 'priya.patel@example.com',
    phone: '9876500004',
    state: 'Gujarat',
    batch: 'Bank-PO-26',
    exams: ['Banking', 'SSC'],
    docsReady: 5,
    docsTotal: 6,
    alertsOn: 4,
    status: 'Admit card tracked',
    tone: 'success'
  },
  {
    name: 'Arjun Reddy',
    email: 'arjun.reddy@example.com',
    phone: '9876500005',
    state: 'Andhra Pradesh',
    batch: 'State-PSC-A',
    exams: ['State PSC', 'UPSC'],
    docsReady: 2,
    docsTotal: 6,
    alertsOn: 0,
    status: 'No alerts enabled',
    tone: 'warning'
  },
  {
    name: 'Sneha Kulkarni',
    email: 'sneha.k@example.com',
    phone: '9876500006',
    state: 'Maharashtra',
    batch: 'Bank-PO-26',
    exams: ['Banking'],
    docsReady: 6,
    docsTotal: 6,
    alertsOn: 2,
    status: 'Result awaited',
    tone: 'info'
  }
];

function normalizeEmail(v) {
  return String(v || '').toLowerCase().trim();
}

function serialize(doc) {
  const o = doc?.toObject ? doc.toObject() : { ...doc };
  return {
    id: String(o._id || o.id),
    instituteEmail: o.instituteEmail || '',
    instituteName: o.instituteName || 'AMB Coaching Desk',
    name: o.name,
    email: o.email || '',
    phone: o.phone || '',
    state: o.state || 'All India',
    batch: o.batch || 'General',
    exams: Array.isArray(o.exams) ? o.exams : [],
    docsReady: Number(o.docsReady) || 0,
    docsTotal: Math.max(1, Number(o.docsTotal) || 6),
    alertsOn: Number(o.alertsOn) || 0,
    status: o.status || 'Enrolled',
    tone: TONES.includes(o.tone) ? o.tone : 'info',
    notes: o.notes || '',
    createdAt: o.createdAt || null,
    updatedAt: o.updatedAt || null
  };
}

function pickBody(body = {}) {
  const data = {};
  const keys = [
    'name',
    'email',
    'phone',
    'state',
    'batch',
    'exams',
    'docsReady',
    'docsTotal',
    'alertsOn',
    'status',
    'tone',
    'notes',
    'instituteName'
  ];
  for (const k of keys) {
    if (body[k] !== undefined) data[k] = body[k];
  }
  if (data.email) data.email = normalizeEmail(data.email);
  if (Array.isArray(data.exams)) {
    data.exams = data.exams.map((e) => String(e).trim()).filter(Boolean);
  } else if (typeof data.exams === 'string') {
    data.exams = data.exams
      .split(',')
      .map((e) => e.trim())
      .filter(Boolean);
  }
  if (data.tone && !TONES.includes(data.tone)) delete data.tone;
  if (data.docsReady !== undefined) data.docsReady = Math.max(0, Number(data.docsReady) || 0);
  if (data.docsTotal !== undefined) data.docsTotal = Math.max(1, Number(data.docsTotal) || 6);
  if (data.alertsOn !== undefined) data.alertsOn = Math.max(0, Number(data.alertsOn) || 0);
  if (data.docsReady !== undefined && data.docsTotal !== undefined && data.docsReady > data.docsTotal) {
    data.docsReady = data.docsTotal;
  }
  return data;
}

function computeStats(students) {
  return {
    students: students.length,
    alerts: students.reduce((a, s) => a + (Number(s.alertsOn) || 0), 0),
    ready: students.filter((s) => Number(s.docsReady) === Number(s.docsTotal)).length,
    atRisk: students.filter((s) => s.tone === 'warning' || s.tone === 'danger').length
  };
}

async function listForInstitute(instituteEmail) {
  if (isMongoReady()) {
    const rows = await InstituteStudent.find({ instituteEmail }).sort({ updatedAt: -1 }).lean();
    return rows.map((r) => serialize({ ...r, _id: r._id }));
  }
  return memoryStudents.filter((s) => s.instituteEmail === instituteEmail).map(serialize);
}

async function ensureSeed(instituteEmail, instituteName) {
  const existing = await listForInstitute(instituteEmail);
  if (existing.length) return existing;

  if (isMongoReady()) {
    const docs = SEED.map((s) => ({
      ...s,
      instituteEmail,
      instituteName: instituteName || 'AMB Coaching Desk'
    }));
    await InstituteStudent.insertMany(docs);
    return listForInstitute(instituteEmail);
  }

  for (const s of SEED) {
    memoryStudents.push({
      id: `mem-${memorySeq++}`,
      _id: undefined,
      instituteEmail,
      instituteName: instituteName || 'AMB Coaching Desk',
      ...s,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  return listForInstitute(instituteEmail);
}

router.get('/meta', (req, res) => {
  res.json({
    success: true,
    exams: EXAMS,
    tones: TONES,
    storage: isMongoReady() ? 'mongodb' : 'memory'
  });
});

router.get('/students', async (req, res) => {
  try {
    const instituteEmail = normalizeEmail(req.query.instituteEmail || req.query.email);
    if (!instituteEmail) {
      return res.status(400).json({ success: false, error: 'instituteEmail is required' });
    }

    const seed = req.query.seed !== '0';
    let students = await listForInstitute(instituteEmail);
    if (!students.length && seed) {
      students = await ensureSeed(instituteEmail, req.query.instituteName);
    }

    const q = String(req.query.q || '').toLowerCase().trim();
    const exam = req.query.exam || 'All';
    const state = req.query.state || 'All';

    const filtered = students.filter((s) => {
      const matchQ =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.state.toLowerCase().includes(q) ||
        (s.email || '').includes(q) ||
        (s.batch || '').toLowerCase().includes(q);
      const matchExam = exam === 'All' || s.exams.includes(exam);
      const matchState = state === 'All' || s.state === state;
      return matchQ && matchExam && matchState;
    });

    res.json({
      success: true,
      storage: isMongoReady() ? 'mongodb' : 'memory',
      count: filtered.length,
      stats: computeStats(students),
      students: filtered
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/students', async (req, res) => {
  try {
    const instituteEmail = normalizeEmail(req.body.instituteEmail || req.body.email);
    if (!instituteEmail) {
      return res.status(400).json({ success: false, error: 'instituteEmail is required' });
    }
    const data = pickBody(req.body);
    if (!data.name?.trim()) {
      return res.status(400).json({ success: false, error: 'Student name is required' });
    }

    if (isMongoReady()) {
      const created = await InstituteStudent.create({
        instituteEmail,
        instituteName: data.instituteName || 'AMB Coaching Desk',
        ...data,
        name: data.name.trim()
      });
      return res.status(201).json({ success: true, student: serialize(created) });
    }

    const row = {
      id: `mem-${memorySeq++}`,
      instituteEmail,
      instituteName: data.instituteName || 'AMB Coaching Desk',
      name: data.name.trim(),
      email: data.email || '',
      phone: data.phone || '',
      state: data.state || 'All India',
      batch: data.batch || 'General',
      exams: data.exams || [],
      docsReady: data.docsReady ?? 0,
      docsTotal: data.docsTotal ?? 6,
      alertsOn: data.alertsOn ?? 0,
      status: data.status || 'Enrolled',
      tone: data.tone || 'info',
      notes: data.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    memoryStudents.unshift(row);
    res.status(201).json({ success: true, student: serialize(row) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = pickBody(req.body);

    if (isMongoReady()) {
      const updated = await InstituteStudent.findByIdAndUpdate(id, { $set: data }, { new: true });
      if (!updated) return res.status(404).json({ success: false, error: 'Student not found' });
      return res.json({ success: true, student: serialize(updated) });
    }

    const idx = memoryStudents.findIndex((s) => String(s.id) === String(id));
    if (idx < 0) return res.status(404).json({ success: false, error: 'Student not found' });
    memoryStudents[idx] = {
      ...memoryStudents[idx],
      ...data,
      updatedAt: new Date().toISOString()
    };
    res.json({ success: true, student: serialize(memoryStudents[idx]) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isMongoReady()) {
      const deleted = await InstituteStudent.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ success: false, error: 'Student not found' });
      return res.json({ success: true, deleted: serialize(deleted) });
    }
    const idx = memoryStudents.findIndex((s) => String(s.id) === String(id));
    if (idx < 0) return res.status(404).json({ success: false, error: 'Student not found' });
    const [deleted] = memoryStudents.splice(idx, 1);
    res.json({ success: true, deleted: serialize(deleted) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/** Re-seed demo cohort for an institute (replaces empty or force=1) */
router.post('/students/seed', async (req, res) => {
  try {
    const instituteEmail = normalizeEmail(req.body.instituteEmail || req.body.email);
    if (!instituteEmail) {
      return res.status(400).json({ success: false, error: 'instituteEmail is required' });
    }
    const force = Boolean(req.body.force);
    const instituteName = req.body.instituteName || 'AMB Coaching Desk';

    if (isMongoReady()) {
      const count = await InstituteStudent.countDocuments({ instituteEmail });
      if (count && !force) {
        const students = await listForInstitute(instituteEmail);
        return res.json({ success: true, seeded: false, count: students.length, students, stats: computeStats(students) });
      }
      if (force) await InstituteStudent.deleteMany({ instituteEmail });
      await InstituteStudent.insertMany(
        SEED.map((s) => ({ ...s, instituteEmail, instituteName }))
      );
      const students = await listForInstitute(instituteEmail);
      return res.json({ success: true, seeded: true, count: students.length, students, stats: computeStats(students) });
    }

    if (force) {
      for (let i = memoryStudents.length - 1; i >= 0; i--) {
        if (memoryStudents[i].instituteEmail === instituteEmail) memoryStudents.splice(i, 1);
      }
    }
    const students = await ensureSeed(instituteEmail, instituteName);
    res.json({ success: true, seeded: true, count: students.length, students, stats: computeStats(students) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
