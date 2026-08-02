import mongoose from 'mongoose';

const requiredDocSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    type: String,
    mandatory: { type: Boolean, default: true },
    allowedFormat: [String],
    maxSizeKB: Number,
    minSizeKB: Number,
    dimensions: String,
    specificRule: String
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    posts: {
      type: String,
      default: '1,000 Posts'
    },
    fee: {
      type: String,
      default: '₹100 General / OBC'
    },
    deadline: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Central', 'Bank', 'Railway', 'State PSC']
    },
    agency: {
      type: String,
      default: 'Government Portal'
    },
    description: {
      type: String,
      default: 'Official Government Job Notification'
    },
    salary: {
      type: String,
      default: '₹35,400 - ₹1,42,400'
    },
    location: {
      type: String,
      default: 'All India'
    },
    qualification: {
      type: String,
      default: 'As per notification'
    },
    officialUrl: {
      type: String,
      default: ''
    },
    applyLink: {
      type: String,
      default: ''
    },
    pdfNotificationUrl: {
      type: String,
      default: ''
    },
    sourcePortals: {
      type: [String],
      default: []
    },
    requiredDocuments: {
      type: [requiredDocSchema],
      default: []
    },
    daysRemaining: {
      type: Number,
      default: null
    },
    urgencyLevel: {
      type: String,
      default: 'NORMAL'
    }
  },
  {
    timestamps: true
  }
);

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
export default Job;
