import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      default: 'general'
    },
    candidateName: {
      type: String,
      default: 'Candidate'
    },
    docType: {
      type: String,
      default: 'Document'
    },
    originalName: {
      type: String,
      required: true
    },
    filename: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    sizeKB: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'WARNING', 'REJECTED'],
      default: 'VERIFIED'
    },
    issues: {
      type: [String],
      default: []
    },
    uploadedAt: {
      type: String,
      default: () => new Date().toISOString()
    }
  },
  {
    timestamps: true
  }
);

const Verification = mongoose.models.Verification || mongoose.model('Verification', verificationSchema);
export default Verification;
