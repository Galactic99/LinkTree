import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  linktreeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Linktree', required: true },
  linkId: { type: mongoose.Schema.Types.ObjectId, required: true },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  country: String,
  city: String,
  referrer: String,
}, { timestamps: true });

// Create indexes for efficient querying
analyticsSchema.index({ linktreeId: 1, timestamp: -1 });
analyticsSchema.index({ linkId: 1, timestamp: -1 });

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

export default Analytics; 