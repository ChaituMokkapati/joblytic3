import mongoose from 'mongoose';

const sentLogSchema = new mongoose.Schema(
  {
    windowDays: Number,
    sentAt: String,
    mode: String,
    results: mongoose.Schema.Types.Mixed
  },
  { _id: false }
);

const alertSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    jobTitle: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    phone: {
      type: String,
      default: ''
    },
    userId: {
      type: String,
      default: null
    },
    channel: {
      type: String,
      default: 'Email & WhatsApp'
    },
    frequency: {
      type: String,
      default: '7, 3, 1 days before deadline'
    },
    windows: {
      type: [Number],
      default: [7, 3, 1]
    },
    status: {
      type: String,
      default: 'ACTIVE'
    },
    lastSentAt: {
      type: String,
      default: null
    },
    sentLog: {
      type: [sentLogSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const Alert = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
export default Alert;
