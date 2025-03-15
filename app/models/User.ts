import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: {
      type: String,
      unique: true,
      required: true,
    },
    image: String,
    emailVerified: Date,
    isPremium: {
      type: Boolean,
      default: false,
    },
    premiumFeatures: {
      customDomain: { type: Boolean, default: false },
      abTesting: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      customThemes: { type: Boolean, default: false },
    },
    customDomains: [{
      domain: String,
      verified: { type: Boolean, default: false },
      linktreeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Linktree' },
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Create indexes
userSchema.index({ email: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User; 