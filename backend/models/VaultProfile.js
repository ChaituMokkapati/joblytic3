import mongoose from 'mongoose';

const vaultProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: { type: String, default: 'Candidate' },
    phone: { type: String, default: '' },
    category: { type: String, default: 'General' },
    qualification: { type: String, default: '' },
    dob: { type: String, default: '' },
    whatsappEnabled: { type: Boolean, default: true },
    emailEnabled: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const VaultProfile =
  mongoose.models.VaultProfile || mongoose.model('VaultProfile', vaultProfileSchema);

export default VaultProfile;
