import mongoose from 'mongoose';

const vaultDocumentSchema = new mongoose.Schema(
  {
    ownerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      default: 'Document',
      enum: ['Education', 'Biometric', 'Category', 'Identity', 'Self Declaration', 'Document', 'Other']
    },
    fileName: { type: String, required: true },
    fileFormat: { type: String, required: true },
    fileSizeKB: { type: Number, required: true },
    dimensions: { type: String, default: 'N/A (Document)' },
    issueDate: { type: String, default: '' },
    uploadDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
    status: {
      type: String,
      enum: ['VERIFIED', 'ATTENTION_REQUIRED', 'EXPIRED_OR_INVALID', 'PENDING'],
      default: 'VERIFIED'
    },
    issueNote: { type: String, default: '' },
    filename: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimetype: { type: String, required: true },
    previewUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

const VaultDocument =
  mongoose.models.VaultDocument || mongoose.model('VaultDocument', vaultDocumentSchema);

export default VaultDocument;
