import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema(
  {
    userId: { type: String, default: null },
    email: { type: String, lowercase: true, trim: true, default: '' },
    jobId: { type: mongoose.Schema.Types.Mixed, required: true },
    jobTitle: { type: String, required: true },
    agency: { type: String, default: '' },
    status: {
      type: String,
      enum: ['saved', 'applied', 'admit_card', 'exam', 'result'],
      default: 'saved'
    },
    examDate: { type: String, default: null },
    admitCardDate: { type: String, default: null },
    admitCardUrl: { type: String, default: '' },
    resultDate: { type: String, default: null },
    resultStatus: {
      type: String,
      enum: ['', 'pending', 'qualified', 'not_qualified', 'awaited'],
      default: ''
    },
    resultNote: { type: String, default: '' },
    notes: { type: String, default: '' },
    applyLink: { type: String, default: '' }
  },
  { timestamps: true }
);

const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
export default Application;
