import mongoose from 'mongoose';

const TONES = ['success', 'warning', 'danger', 'info'];
const EXAMS = ['SSC', 'Banking', 'Railway', 'UPSC', 'State PSC'];

const instituteStudentSchema = new mongoose.Schema(
  {
    instituteEmail: { type: String, lowercase: true, trim: true, required: true, index: true },
    instituteName: { type: String, trim: true, default: 'AMB Coaching Desk' },
    name: { type: String, trim: true, required: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: 'All India' },
    batch: { type: String, trim: true, default: 'General' },
    exams: { type: [String], default: [] },
    docsReady: { type: Number, default: 0, min: 0 },
    docsTotal: { type: Number, default: 6, min: 1 },
    alertsOn: { type: Number, default: 0, min: 0 },
    status: { type: String, trim: true, default: 'Enrolled' },
    tone: { type: String, enum: TONES, default: 'info' },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

instituteStudentSchema.index({ instituteEmail: 1, name: 1 });

const InstituteStudent =
  mongoose.models.InstituteStudent || mongoose.model('InstituteStudent', instituteStudentSchema);

export { TONES, EXAMS };
export default InstituteStudent;
